"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAddedFiles = exports.onRevertFiles = exports.applyToModConfig = exports.onWillEnableMods = exports.ensureConfigMod = exports.addModConfig = exports.registerConfigMod = void 0;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const actions_1 = require("./actions");
const util_1 = require("./util");
const SMAPI_1 = require("./SMAPI");
const syncWrapper = (api) => {
    onSyncModConfigurations(api);
};
function registerConfigMod(context) {
    context.registerAction('mod-icons', 999, 'swap', {}, 'Sync Mod Configurations', () => syncWrapper(context.api), () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === common_1.GAME_ID);
    });
}
exports.registerConfigMod = registerConfigMod;
const shouldSuppressSync = (api) => {
    const state = api.getState();
    const suppressOnActivities = ['installing_dependencies'];
    const isActivityRunning = (activity) => vortex_api_1.util.getSafe(state, ['session', 'base', 'activity', activity], []).length > 0;
    const suppressingActivities = suppressOnActivities.filter(activity => isActivityRunning(activity));
    const suppressing = suppressingActivities.length > 0;
    return suppressing;
};
function onSyncModConfigurations(api, silent) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID || shouldSuppressSync(api)) {
            return;
        }
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (!(smapiTool === null || smapiTool === void 0 ? void 0 : smapiTool.path)) {
            return;
        }
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        if (!mergeConfigs) {
            if (silent) {
                return;
            }
            const result = yield api.showDialog('info', 'Mod Configuration Sync', {
                bbcode: 'Many Stardew Valley mods generate their own configuration files during game play. By default the generated files are, '
                    + 'ingested by their respective mods.[br][/br][br][/br]'
                    + 'Unfortunately the mod configuration files are lost when updating or removing a mod.[br][/br][br][/br] This button allows you to '
                    + 'Import all of your active mod\'s configuration files into a single mod which will remain unaffected by mod updates.[br][/br][br][/br]'
                    + 'Would you like to enable this functionality? (SMAPI must be installed)',
            }, [
                { label: 'Close' },
                { label: 'Enable' }
            ]);
            if (result.action === 'Close') {
                return;
            }
            if (result.action === 'Enable') {
                api.store.dispatch((0, actions_1.setMergeConfigs)(profile.id, true));
            }
        }
        const eventPromise = (api, eventType) => new Promise((resolve, reject) => {
            const cb = (err) => err !== null ? reject(err) : resolve();
            (eventType === 'purge-mods')
                ? api.events.emit(eventType, false, cb)
                : api.events.emit(eventType, cb);
        });
        try {
            const mod = yield initialize(api);
            if ((mod === null || mod === void 0 ? void 0 : mod.configModPath) === undefined) {
                return;
            }
            yield eventPromise(api, 'purge-mods');
            const installPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
            const resolveCandidateName = (file) => {
                const relPath = path_1.default.relative(installPath, file.filePath);
                const segments = relPath.split(path_1.default.sep);
                return segments[0];
            };
            const files = yield (0, util_1.walkPath)(installPath);
            const filtered = files.reduce((accum, file) => {
                if (path_1.default.basename(file.filePath).toLowerCase() === common_1.MOD_CONFIG && !path_1.default.dirname(file.filePath).includes(mod.configModPath)) {
                    const candidateName = resolveCandidateName(file);
                    if (vortex_api_1.util.getSafe(profile, ['modState', candidateName, 'enabled'], false) === false) {
                        return accum;
                    }
                    accum.push({ filePath: file.filePath, candidates: [candidateName] });
                }
                return accum;
            }, []);
            yield addModConfig(api, filtered, installPath);
            yield eventPromise(api, 'deploy-mods');
        }
        catch (err) {
            api.showErrorNotification('Failed to sync mod configurations', err);
        }
    });
}
function sanitizeProfileName(input) {
    return input.replace(common_1.RGX_INVALID_CHARS_WINDOWS, '_');
}
function configModName(profileName) {
    return `Stardew Valley Configuration (${sanitizeProfileName(profileName)})`;
}
function initialize(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return Promise.resolve(undefined);
        }
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        if (!mergeConfigs) {
            return Promise.resolve(undefined);
        }
        try {
            const mod = yield ensureConfigMod(api);
            const installationPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const configModPath = path_1.default.join(installationPath, mod.installationPath);
            return Promise.resolve({ configModPath, mod });
        }
        catch (err) {
            api.showErrorNotification('Failed to resolve config mod path', err);
            return Promise.resolve(undefined);
        }
    });
}
function addModConfig(api, files, modsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const configMod = yield initialize(api);
        if (configMod === undefined) {
            return;
        }
        const state = api.getState();
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        const isInstallPath = modsPath !== undefined;
        modsPath = modsPath !== null && modsPath !== void 0 ? modsPath : path_1.default.join(discovery.path, (0, util_1.defaultModsRelPath)());
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (smapiTool === undefined) {
            return;
        }
        const configModAttributes = extractConfigModAttributes(state, configMod.mod.id);
        let newConfigAttributes = Array.from(new Set(configModAttributes));
        for (const file of files) {
            const segments = file.filePath.toLowerCase().split(path_1.default.sep).filter(seg => !!seg);
            if (segments.includes('smapi_internal')) {
                continue;
            }
            api.sendNotification({
                type: 'activity',
                id: common_1.NOTIF_ACTIVITY_CONFIG_MOD,
                title: 'Importing config files...',
                message: file.candidates[0],
            });
            if (!configModAttributes.includes(file.candidates[0])) {
                newConfigAttributes.push(file.candidates[0]);
            }
            try {
                const installRelPath = path_1.default.relative(modsPath, file.filePath);
                const segments = installRelPath.split(path_1.default.sep);
                const relPath = isInstallPath ? segments.slice(1).join(path_1.default.sep) : installRelPath;
                const targetPath = path_1.default.join(configMod.configModPath, relPath);
                const targetDir = path_1.default.extname(targetPath) !== '' ? path_1.default.dirname(targetPath) : targetPath;
                yield vortex_api_1.fs.ensureDirWritableAsync(targetDir);
                (0, vortex_api_1.log)('debug', 'importing config file from', { source: file.filePath, destination: targetPath, modId: file.candidates[0] });
                yield vortex_api_1.fs.copyAsync(file.filePath, targetPath, { overwrite: true });
                yield vortex_api_1.fs.removeAsync(file.filePath);
            }
            catch (err) {
                api.showErrorNotification('Failed to write mod config', err);
            }
        }
        api.dismissNotification(common_1.NOTIF_ACTIVITY_CONFIG_MOD);
        setConfigModAttribute(api, configMod.mod.id, Array.from(new Set(newConfigAttributes)));
    });
}
exports.addModConfig = addModConfig;
function ensureConfigMod(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modInstalled = Object.values(mods).find(iter => iter.type === common_1.MOD_TYPE_CONFIG);
        if (modInstalled !== undefined) {
            return Promise.resolve(modInstalled);
        }
        else {
            const profile = vortex_api_1.selectors.activeProfile(state);
            const modName = configModName(profile.name);
            const mod = yield createConfigMod(api, modName, profile);
            api.store.dispatch(vortex_api_1.actions.setModEnabled(profile.id, mod.id, true));
            return Promise.resolve(mod);
        }
    });
}
exports.ensureConfigMod = ensureConfigMod;
function createConfigMod(api, modName, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const mod = {
            id: modName,
            state: 'installed',
            attributes: {
                name: 'Stardew Valley Mod Configuration',
                description: 'This mod is a collective merge of SDV mod configuration files which Vortex maintains '
                    + 'for the mods you have installed. The configuration is maintained through mod updates, '
                    + 'but at times it may need to be manually updated',
                logicalFileName: 'Stardew Valley Mod Configuration',
                modId: 42,
                version: '1.0.0',
                variant: sanitizeProfileName(profile.name.replace(common_1.RGX_INVALID_CHARS_WINDOWS, '_')),
                installTime: new Date(),
                source: 'user-generated',
            },
            installationPath: modName,
            type: common_1.MOD_TYPE_CONFIG,
        };
        return new Promise((resolve, reject) => {
            api.events.emit('create-mod', profile.gameId, mod, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    return reject(error);
                }
                return resolve(mod);
            }));
        });
    });
}
function onWillEnableMods(api, profileId, modIds, enabled, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        if (enabled) {
            yield onSyncModConfigurations(api, true);
            return;
        }
        const configMod = yield initialize(api);
        if (!configMod) {
            return;
        }
        if (modIds.includes(configMod.mod.id)) {
            yield onRevertFiles(api, profileId);
            return;
        }
        if ((options === null || options === void 0 ? void 0 : options.installed) || (options === null || options === void 0 ? void 0 : options.willBeReplaced)) {
            return Promise.resolve();
        }
        const attrib = extractConfigModAttributes(state, configMod.mod.id);
        const relevant = modIds.filter(id => attrib.includes(id));
        if (relevant.length === 0) {
            return;
        }
        const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        if (enabled) {
            yield onSyncModConfigurations(api);
            return;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        for (const id of relevant) {
            const mod = mods[id];
            if (!(mod === null || mod === void 0 ? void 0 : mod.installationPath)) {
                continue;
            }
            const modPath = path_1.default.join(installPath, mod.installationPath);
            const files = yield (0, util_1.walkPath)(modPath, { skipLinks: true, skipHidden: true, skipInaccessible: true });
            const manifestFile = files.find(file => path_1.default.basename(file.filePath) === common_1.MOD_MANIFEST);
            if (manifestFile === undefined) {
                continue;
            }
            const relPath = path_1.default.relative(modPath, path_1.default.dirname(manifestFile.filePath));
            const modConfigFilePath = path_1.default.join(configMod.configModPath, relPath, common_1.MOD_CONFIG);
            yield vortex_api_1.fs.copyAsync(modConfigFilePath, path_1.default.join(modPath, relPath, common_1.MOD_CONFIG), { overwrite: true }).catch(err => null);
            try {
                yield applyToModConfig(api, () => (0, util_1.deleteFolder)(path_1.default.dirname(modConfigFilePath)));
            }
            catch (err) {
                api.showErrorNotification('Failed to write mod config', err);
                return;
            }
        }
        removeConfigModAttributes(api, configMod.mod, relevant);
    });
}
exports.onWillEnableMods = onWillEnableMods;
function applyToModConfig(api, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const configMod = yield initialize(api);
            yield api.emitAndAwait('deploy-single-mod', common_1.GAME_ID, configMod.mod.id, false);
            yield cb();
            yield api.emitAndAwait('deploy-single-mod', common_1.GAME_ID, configMod.mod.id, true);
        }
        catch (err) {
            api.showErrorNotification('Failed to write mod config', err);
        }
    });
}
exports.applyToModConfig = applyToModConfig;
function onRevertFiles(api, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        const configMod = yield initialize(api);
        if (!configMod) {
            return;
        }
        const attrib = extractConfigModAttributes(state, configMod.mod.id);
        if (attrib.length === 0) {
            return;
        }
        yield onWillEnableMods(api, profileId, attrib, false);
        return;
    });
}
exports.onRevertFiles = onRevertFiles;
function onAddedFiles(api, profileId, files) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (smapiTool === undefined) {
            return;
        }
        const isSMAPIFile = (file) => {
            const segments = file.filePath.toLowerCase().split(path_1.default.sep).filter(seg => !!seg);
            return segments.includes('smapi_internal');
        };
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        const result = files.reduce((accum, file) => {
            if (mergeConfigs && !isSMAPIFile(file) && path_1.default.basename(file.filePath).toLowerCase() === common_1.MOD_CONFIG) {
                accum.configs.push(file);
            }
            else {
                accum.regulars.push(file);
            }
            return accum;
        }, { configs: [], regulars: [] });
        return Promise.all([
            addConfigFiles(api, profileId, result.configs),
            addRegularFiles(api, profileId, result.regulars)
        ]);
    });
}
exports.onAddedFiles = onAddedFiles;
function extractConfigModAttributes(state, configModId) {
    return vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, configModId, 'attributes', 'configMod'], []);
}
function setConfigModAttribute(api, configModId, attributes) {
    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, configModId, 'configMod', attributes));
}
function removeConfigModAttributes(api, configMod, attributes) {
    const existing = extractConfigModAttributes(api.getState(), configMod.id);
    const newAttributes = existing.filter(attr => !attributes.includes(attr));
    setConfigModAttribute(api, configMod.id, newAttributes);
}
function addConfigFiles(api, profileId, files) {
    return __awaiter(this, void 0, void 0, function* () {
        if (files.length === 0) {
            return Promise.resolve();
        }
        api.sendNotification({
            type: 'activity',
            id: common_1.NOTIF_ACTIVITY_CONFIG_MOD,
            title: 'Importing config files...',
            message: 'Starting up...'
        });
        return addModConfig(api, files, undefined);
    });
}
function addRegularFiles(api, profileId, files) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (files.length === 0) {
            return Promise.resolve();
        }
        const state = api.getState();
        const game = vortex_api_1.util.getGame(common_1.GAME_ID);
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        const modPaths = game.getModPaths(discovery.path);
        const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        for (const entry of files) {
            if (entry.candidates.length === 1) {
                const mod = vortex_api_1.util.getSafe(state.persistent.mods, [common_1.GAME_ID, entry.candidates[0]], undefined);
                if (!isModCandidateValid(mod, entry)) {
                    return Promise.resolve();
                }
                const from = modPaths[(_a = mod.type) !== null && _a !== void 0 ? _a : ''];
                if (from === undefined) {
                    (0, vortex_api_1.log)('error', 'failed to resolve mod path for mod type', mod.type);
                    return Promise.resolve();
                }
                const relPath = path_1.default.relative(from, entry.filePath);
                const targetPath = path_1.default.join(installPath, mod.id, relPath);
                try {
                    yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(targetPath));
                    yield vortex_api_1.fs.copyAsync(entry.filePath, targetPath);
                    yield vortex_api_1.fs.removeAsync(entry.filePath);
                }
                catch (err) {
                    if (!err.message.includes('are the same file')) {
                        (0, vortex_api_1.log)('error', 'failed to re-import added file to mod', err.message);
                    }
                }
            }
        }
    });
}
const isModCandidateValid = (mod, entry) => {
    if ((mod === null || mod === void 0 ? void 0 : mod.id) === undefined || mod.type === 'sdvrootfolder') {
        return false;
    }
    if (mod.type !== 'SMAPI') {
        return true;
    }
    const segments = entry.filePath.toLowerCase().split(path_1.default.sep).filter(seg => !!seg);
    const modsSegIdx = segments.indexOf('mods');
    const modFolderName = ((modsSegIdx !== -1) && (segments.length > modsSegIdx + 1))
        ? segments[modsSegIdx + 1] : undefined;
    let bundledMods = vortex_api_1.util.getSafe(mod, ['attributes', 'smapiBundledMods'], []);
    bundledMods = bundledMods.length > 0 ? bundledMods : (0, common_1.getBundledMods)();
    if (segments.includes('content')) {
        return false;
    }
    return (modFolderName !== undefined) && bundledMods.includes(modFolderName);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFDdEUscUNBQW9KO0FBQ3BKLHVDQUE0QztBQUU1QyxpQ0FBb0U7QUFFcEUsbUNBQXNEO0FBR3RELE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQy9DLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQTtBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWdDO0lBQ2hFLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUM1RSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUM5QixHQUFHLEVBQUU7UUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLGdCQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCw4Q0FRQztBQUVELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDdEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ3pELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLFVB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UyxDQUFDLEVBQUU7UUFHaEMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCBzZWxlY3RvcnMsIGxvZywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELCBHQU1FX0lELCBNT0RfQ09ORklHLCBSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCBNT0RfVFlQRV9DT05GSUcsIE1PRF9NQU5JRkVTVCwgZ2V0QnVuZGxlZE1vZHMgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IHNldE1lcmdlQ29uZmlncyB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IElGaWxlRW50cnkgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgd2Fsa1BhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCwgZGVsZXRlRm9sZGVyIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7IGZpbmRTTUFQSU1vZCwgZmluZFNNQVBJVG9vbCB9IGZyb20gJy4vU01BUEknO1xyXG5pbXBvcnQgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5cclxuY29uc3Qgc3luY1dyYXBwZXIgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnc3dhcCcsIHt9LCAnU3luYyBNb2QgQ29uZmlndXJhdGlvbnMnLFxyXG4gICAgKCkgPT4gc3luY1dyYXBwZXIoY29udGV4dC5hcGkpLFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmNvbnN0IHNob3VsZFN1cHByZXNzU3luYyA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHN1cHByZXNzT25BY3Rpdml0aWVzID0gWydpbnN0YWxsaW5nX2RlcGVuZGVuY2llcyddO1xyXG4gIGNvbnN0IGlzQWN0aXZpdHlSdW5uaW5nID0gKGFjdGl2aXR5OiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXNzaW9uJywgJ2Jhc2UnLCAnYWN0aXZpdHknLCBhY3Rpdml0eV0sIFtdKS5sZW5ndGggPiAwO1xyXG4gIGNvbnN0IHN1cHByZXNzaW5nQWN0aXZpdGllcyA9IHN1cHByZXNzT25BY3Rpdml0aWVzLmZpbHRlcihhY3Rpdml0eSA9PiBpc0FjdGl2aXR5UnVubmluZyhhY3Rpdml0eSkpO1xyXG4gIGNvbnN0IHN1cHByZXNzaW5nID0gc3VwcHJlc3NpbmdBY3Rpdml0aWVzLmxlbmd0aCA+IDA7XHJcbiAgcmV0dXJuIHN1cHByZXNzaW5nO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHNpbGVudD86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBzaG91bGRTdXBwcmVzc1N5bmMoYXBpKSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBzbWFwaVRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbCA9IGZpbmRTTUFQSVRvb2woYXBpKTtcclxuICBpZiAoIXNtYXBpVG9vbD8ucGF0aCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBtZXJnZUNvbmZpZ3MgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnU0RWJywgJ21lcmdlQ29uZmlncycsIHByb2ZpbGUuaWRdLCBmYWxzZSk7XHJcbiAgaWYgKCFtZXJnZUNvbmZpZ3MpIHtcclxuICAgIGlmIChzaWxlbnQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnTW9kIENvbmZpZ3VyYXRpb24gU3luYycsIHtcclxuICAgICAgYmJjb2RlOiAnTWFueSBTdGFyZGV3IFZhbGxleSBtb2RzIGdlbmVyYXRlIHRoZWlyIG93biBjb25maWd1cmF0aW9uIGZpbGVzIGR1cmluZyBnYW1lIHBsYXkuIEJ5IGRlZmF1bHQgdGhlIGdlbmVyYXRlZCBmaWxlcyBhcmUsICdcclxuICAgICAgICArICdpbmdlc3RlZCBieSB0aGVpciByZXNwZWN0aXZlIG1vZHMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICsgJ1VuZm9ydHVuYXRlbHkgdGhlIG1vZCBjb25maWd1cmF0aW9uIGZpbGVzIGFyZSBsb3N0IHdoZW4gdXBkYXRpbmcgb3IgcmVtb3ZpbmcgYSBtb2QuW2JyXVsvYnJdW2JyXVsvYnJdIFRoaXMgYnV0dG9uIGFsbG93cyB5b3UgdG8gJ1xyXG4gICAgICAgICsgJ0ltcG9ydCBhbGwgb2YgeW91ciBhY3RpdmUgbW9kXFwncyBjb25maWd1cmF0aW9uIGZpbGVzIGludG8gYSBzaW5nbGUgbW9kIHdoaWNoIHdpbGwgcmVtYWluIHVuYWZmZWN0ZWQgYnkgbW9kIHVwZGF0ZXMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICsgJ1dvdWxkIHlvdSBsaWtlIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uYWxpdHk/IChTTUFQSSBtdXN0IGJlIGluc3RhbGxlZCknLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdFbmFibGUnIH1cclxuICAgIF0pO1xyXG5cclxuICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnQ2xvc2UnKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0VuYWJsZScpIHtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldE1lcmdlQ29uZmlncyhwcm9maWxlLmlkLCB0cnVlKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0eXBlIEV2ZW50VHlwZSA9ICdwdXJnZS1tb2RzJyB8ICdkZXBsb3ktbW9kcyc7XHJcbiAgY29uc3QgZXZlbnRQcm9taXNlID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZXZlbnRUeXBlOiBFdmVudFR5cGUpID0+IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IGNiID0gKGVycjogYW55KSA9PiBlcnIgIT09IG51bGwgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKTtcclxuICAgIChldmVudFR5cGUgPT09ICdwdXJnZS1tb2RzJylcclxuICAgICAgPyBhcGkuZXZlbnRzLmVtaXQoZXZlbnRUeXBlLCBmYWxzZSwgY2IpXHJcbiAgICAgIDogYXBpLmV2ZW50cy5lbWl0KGV2ZW50VHlwZSwgY2IpO1xyXG4gIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gICAgaWYgKG1vZD8uY29uZmlnTW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGF3YWl0IGV2ZW50UHJvbWlzZShhcGksICdwdXJnZS1tb2RzJyk7XHJcblxyXG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHJlc29sdmVDYW5kaWRhdGVOYW1lID0gKGZpbGU6IElFbnRyeSk6IHN0cmluZyA9PiB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGluc3RhbGxQYXRoLCBmaWxlLmZpbGVQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgcmV0dXJuIHNlZ21lbnRzWzBdO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB3YWxrUGF0aChpbnN0YWxsUGF0aCk7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IElGaWxlRW50cnlbXSwgZmlsZTogSUVudHJ5KSA9PiB7XHJcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGUuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9DT05GSUcgJiYgIXBhdGguZGlybmFtZShmaWxlLmZpbGVQYXRoKS5pbmNsdWRlcyhtb2QuY29uZmlnTW9kUGF0aCkpIHtcclxuICAgICAgICBjb25zdCBjYW5kaWRhdGVOYW1lID0gcmVzb2x2ZUNhbmRpZGF0ZU5hbWUoZmlsZSk7XHJcbiAgICAgICAgaWYgKHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgY2FuZGlkYXRlTmFtZSwgJ2VuYWJsZWQnXSwgZmFsc2UpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhY2N1bS5wdXNoKHsgZmlsZVBhdGg6IGZpbGUuZmlsZVBhdGgsIGNhbmRpZGF0ZXM6IFtjYW5kaWRhdGVOYW1lXSB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgICBhd2FpdCBhZGRNb2RDb25maWcoYXBpLCBmaWx0ZXJlZCwgaW5zdGFsbFBhdGgpO1xyXG4gICAgYXdhaXQgZXZlbnRQcm9taXNlKGFwaSwgJ2RlcGxveS1tb2RzJyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc3luYyBtb2QgY29uZmlndXJhdGlvbnMnLCBlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2FuaXRpemVQcm9maWxlTmFtZShpbnB1dDogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoUkdYX0lOVkFMSURfQ0hBUlNfV0lORE9XUywgJ18nKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29uZmlnTW9kTmFtZShwcm9maWxlTmFtZTogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIGBTdGFyZGV3IFZhbGxleSBDb25maWd1cmF0aW9uICgke3Nhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZU5hbWUpfSlgO1xyXG59XHJcblxyXG50eXBlIENvbmZpZ01vZCA9IHtcclxuICBtb2Q6IHR5cGVzLklNb2Q7XHJcbiAgY29uZmlnTW9kUGF0aDogc3RyaW5nO1xyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxDb25maWdNb2Q+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuICBjb25zdCBtZXJnZUNvbmZpZ3MgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnU0RWJywgJ21lcmdlQ29uZmlncycsIHByb2ZpbGUuaWRdLCBmYWxzZSk7XHJcbiAgaWYgKCFtZXJnZUNvbmZpZ3MpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBlbnN1cmVDb25maWdNb2QoYXBpKTtcclxuICAgIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGNvbmZpZ01vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGNvbmZpZ01vZFBhdGgsIG1vZCB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZXNvbHZlIGNvbmZpZyBtb2QgcGF0aCcsIGVycik7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkTW9kQ29uZmlnKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IElGaWxlRW50cnlbXSwgbW9kc1BhdGg/OiBzdHJpbmcpIHtcclxuICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XHJcbiAgaWYgKGNvbmZpZ01vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGlzSW5zdGFsbFBhdGggPSBtb2RzUGF0aCAhPT0gdW5kZWZpbmVkO1xyXG4gIG1vZHNQYXRoID0gbW9kc1BhdGggPz8gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBkZWZhdWx0TW9kc1JlbFBhdGgoKSk7XHJcbiAgY29uc3Qgc21hcGlUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBmaW5kU01BUElUb29sKGFwaSk7XHJcbiAgaWYgKHNtYXBpVG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGNvbmZpZ01vZEF0dHJpYnV0ZXM6IHN0cmluZ1tdID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGUsIGNvbmZpZ01vZC5tb2QuaWQpO1xyXG4gIGxldCBuZXdDb25maWdBdHRyaWJ1dGVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGNvbmZpZ01vZEF0dHJpYnV0ZXMpKTtcclxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcygnc21hcGlfaW50ZXJuYWwnKSkge1xyXG4gICAgICAvLyBEb24ndCB0b3VjaCB0aGUgaW50ZXJuYWwgU01BUEkgY29uZmlndXJhdGlvbiBmaWxlcy5cclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICAgIGlkOiBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELFxyXG4gICAgICB0aXRsZTogJ0ltcG9ydGluZyBjb25maWcgZmlsZXMuLi4nLFxyXG4gICAgICBtZXNzYWdlOiBmaWxlLmNhbmRpZGF0ZXNbMF0sXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgaWYgKCFjb25maWdNb2RBdHRyaWJ1dGVzLmluY2x1ZGVzKGZpbGUuY2FuZGlkYXRlc1swXSkpIHtcclxuICAgICAgbmV3Q29uZmlnQXR0cmlidXRlcy5wdXNoKGZpbGUuY2FuZGlkYXRlc1swXSk7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbnN0YWxsUmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kc1BhdGgsIGZpbGUuZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IGluc3RhbGxSZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IGlzSW5zdGFsbFBhdGggPyBzZWdtZW50cy5zbGljZSgxKS5qb2luKHBhdGguc2VwKSA6IGluc3RhbGxSZWxQYXRoO1xyXG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGNvbmZpZ01vZC5jb25maWdNb2RQYXRoLCByZWxQYXRoKTtcclxuICAgICAgY29uc3QgdGFyZ2V0RGlyID0gcGF0aC5leHRuYW1lKHRhcmdldFBhdGgpICE9PSAnJyA/IHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSA6IHRhcmdldFBhdGg7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGFyZ2V0RGlyKTtcclxuICAgICAgbG9nKCdkZWJ1ZycsICdpbXBvcnRpbmcgY29uZmlnIGZpbGUgZnJvbScsIHsgc291cmNlOiBmaWxlLmZpbGVQYXRoLCBkZXN0aW5hdGlvbjogdGFyZ2V0UGF0aCwgbW9kSWQ6IGZpbGUuY2FuZGlkYXRlc1swXSB9KTtcclxuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGZpbGUuZmlsZVBhdGgsIHRhcmdldFBhdGgsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlLmZpbGVQYXRoKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9EKTtcclxuICBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpLCBjb25maWdNb2QubW9kLmlkLCBBcnJheS5mcm9tKG5ldyBTZXQobmV3Q29uZmlnQXR0cmlidXRlcykpKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUNvbmZpZ01vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHR5cGVzLklNb2Q+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RJbnN0YWxsZWQgPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQoaXRlciA9PiBpdGVyLnR5cGUgPT09IE1PRF9UWVBFX0NPTkZJRyk7XHJcbiAgaWYgKG1vZEluc3RhbGxlZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZEluc3RhbGxlZCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gY29uZmlnTW9kTmFtZShwcm9maWxlLm5hbWUpO1xyXG4gICAgY29uc3QgbW9kID0gYXdhaXQgY3JlYXRlQ29uZmlnTW9kKGFwaSwgbW9kTmFtZSwgcHJvZmlsZSk7XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGUuaWQsIG1vZC5pZCwgdHJ1ZSkpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2QpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29uZmlnTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kTmFtZTogc3RyaW5nLCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSk6IFByb21pc2U8dHlwZXMuSU1vZD4ge1xyXG4gIGNvbnN0IG1vZCA9IHtcclxuICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgc3RhdGU6ICdpbnN0YWxsZWQnLFxyXG4gICAgYXR0cmlidXRlczoge1xyXG4gICAgICBuYW1lOiAnU3RhcmRldyBWYWxsZXkgTW9kIENvbmZpZ3VyYXRpb24nLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgbW9kIGlzIGEgY29sbGVjdGl2ZSBtZXJnZSBvZiBTRFYgbW9kIGNvbmZpZ3VyYXRpb24gZmlsZXMgd2hpY2ggVm9ydGV4IG1haW50YWlucyAnXHJcbiAgICAgICAgKyAnZm9yIHRoZSBtb2RzIHlvdSBoYXZlIGluc3RhbGxlZC4gVGhlIGNvbmZpZ3VyYXRpb24gaXMgbWFpbnRhaW5lZCB0aHJvdWdoIG1vZCB1cGRhdGVzLCAnXHJcbiAgICAgICAgKyAnYnV0IGF0IHRpbWVzIGl0IG1heSBuZWVkIHRvIGJlIG1hbnVhbGx5IHVwZGF0ZWQnLFxyXG4gICAgICBsb2dpY2FsRmlsZU5hbWU6ICdTdGFyZGV3IFZhbGxleSBNb2QgQ29uZmlndXJhdGlvbicsXHJcbiAgICAgIG1vZElkOiA0MiwgLy8gTWVhbmluZyBvZiBsaWZlXHJcbiAgICAgIHZlcnNpb246ICcxLjAuMCcsXHJcbiAgICAgIHZhcmlhbnQ6IHNhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZS5uYW1lLnJlcGxhY2UoUkdYX0lOVkFMSURfQ0hBUlNfV0lORE9XUywgJ18nKSksXHJcbiAgICAgIGluc3RhbGxUaW1lOiBuZXcgRGF0ZSgpLFxyXG4gICAgICBzb3VyY2U6ICd1c2VyLWdlbmVyYXRlZCcsXHJcbiAgICB9LFxyXG4gICAgaW5zdGFsbGF0aW9uUGF0aDogbW9kTmFtZSxcclxuICAgIHR5cGU6IE1PRF9UWVBFX0NPTkZJRyxcclxuICB9O1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2U8dHlwZXMuSU1vZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgcHJvZmlsZS5nYW1lSWQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXNvbHZlKG1vZCBhcyBhbnkpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbldpbGxFbmFibGVNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4sIG9wdGlvbnM/OiBhbnkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKGVuYWJsZWQpIHtcclxuICAgIGF3YWl0IG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaSwgdHJ1ZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XHJcbiAgaWYgKCFjb25maWdNb2QpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChtb2RJZHMuaW5jbHVkZXMoY29uZmlnTW9kLm1vZC5pZCkpIHtcclxuICAgIC8vIFRoZSBjb25maWcgbW9kIGlzIGdldHRpbmcgZGlzYWJsZWQvdW5pbnN0YWxsZWQgLSByZS1pbnN0YXRlIGFsbCBvZlxyXG4gICAgLy8gIHRoZSBjb25maWd1cmF0aW9uIGZpbGVzLlxyXG4gICAgYXdhaXQgb25SZXZlcnRGaWxlcyhhcGksIHByb2ZpbGVJZCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAob3B0aW9ucz8uaW5zdGFsbGVkIHx8IG9wdGlvbnM/LndpbGxCZVJlcGxhY2VkKSB7XHJcbiAgICAvLyBEbyBub3RoaW5nLCB0aGUgbW9kcyBhcmUgYmVpbmcgcmUtaW5zdGFsbGVkLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgYXR0cmliID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGUsIGNvbmZpZ01vZC5tb2QuaWQpO1xyXG4gIGNvbnN0IHJlbGV2YW50ID0gbW9kSWRzLmZpbHRlcihpZCA9PiBhdHRyaWIuaW5jbHVkZXMoaWQpKTtcclxuICBpZiAocmVsZXZhbnQubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChlbmFibGVkKSB7XHJcbiAgICBhd2FpdCBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGZvciAoY29uc3QgaWQgb2YgcmVsZXZhbnQpIHtcclxuICAgIGNvbnN0IG1vZCA9IG1vZHNbaWRdO1xyXG4gICAgaWYgKCFtb2Q/Lmluc3RhbGxhdGlvblBhdGgpIHtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICBjb25zdCBmaWxlczogSUVudHJ5W10gPSBhd2FpdCB3YWxrUGF0aChtb2RQYXRoLCB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9KTtcclxuICAgIGNvbnN0IG1hbmlmZXN0RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUuZmlsZVBhdGgpID09PSBNT0RfTUFOSUZFU1QpO1xyXG4gICAgaWYgKG1hbmlmZXN0RmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kUGF0aCwgcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZS5maWxlUGF0aCkpO1xyXG4gICAgY29uc3QgbW9kQ29uZmlnRmlsZVBhdGggPSBwYXRoLmpvaW4oY29uZmlnTW9kLmNvbmZpZ01vZFBhdGgsIHJlbFBhdGgsIE1PRF9DT05GSUcpO1xyXG4gICAgYXdhaXQgZnMuY29weUFzeW5jKG1vZENvbmZpZ0ZpbGVQYXRoLCBwYXRoLmpvaW4obW9kUGF0aCwgcmVsUGF0aCwgTU9EX0NPTkZJRyksIHsgb3ZlcndyaXRlOiB0cnVlIH0pLmNhdGNoKGVyciA9PiBudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGFwcGx5VG9Nb2RDb25maWcoYXBpLCAoKSA9PiBkZWxldGVGb2xkZXIocGF0aC5kaXJuYW1lKG1vZENvbmZpZ0ZpbGVQYXRoKSkpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2QgY29uZmlnJywgZXJyKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVtb3ZlQ29uZmlnTW9kQXR0cmlidXRlcyhhcGksIGNvbmZpZ01vZC5tb2QsIHJlbGV2YW50KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFwcGx5VG9Nb2RDb25maWcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjYjogKCkgPT4gUHJvbWlzZTx2b2lkPikge1xyXG4gIC8vIEFwcGx5aW5nIGZpbGUgb3BlcmF0aW9ucyB0byB0aGUgY29uZmlnIG1vZCByZXF1aXJlcyB1cyB0b1xyXG4gIC8vICByZW1vdmUgaXQgZnJvbSB0aGUgZ2FtZSBkaXJlY3RvcnkgYW5kIGRlcGxveW1lbnQgbWFuaWZlc3QgYmVmb3JlXHJcbiAgLy8gIHJlLWludHJvZHVjaW5nIGl0ICh0aGlzIGlzIHRvIGF2b2lkIEVDRClcclxuICB0cnkge1xyXG4gICAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gICAgYXdhaXQgYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBjb25maWdNb2QubW9kLmlkLCBmYWxzZSk7XHJcbiAgICBhd2FpdCBjYigpO1xyXG4gICAgYXdhaXQgYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBjb25maWdNb2QubW9kLmlkLCB0cnVlKTsgXHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25SZXZlcnRGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gIGlmICghY29uZmlnTW9kKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGF0dHJpYiA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcclxuICBpZiAoYXR0cmliLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgb25XaWxsRW5hYmxlTW9kcyhhcGksIHByb2ZpbGVJZCwgYXR0cmliLCBmYWxzZSk7XHJcbiAgcmV0dXJuO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25BZGRlZEZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xyXG4gIGlmIChzbWFwaVRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVmVyeSBpbXBvcnRhbnQgbm90IHRvIGFkZCBhbnkgZmlsZXMgaWYgVm9ydGV4IGhhcyBubyBrbm93bGVkZ2Ugb2YgU01BUEkncyBsb2NhdGlvbi5cclxuICAgIC8vICB0aGlzIGlzIHRvIGF2b2lkIHB1bGxpbmcgU01BUEkgY29uZmlndXJhdGlvbiBmaWxlcyBpbnRvIG9uZSBvZiB0aGUgbW9kcyBpbnN0YWxsZWQgYnkgVm9ydGV4LlxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBpc1NNQVBJRmlsZSA9IChmaWxlOiBJRmlsZUVudHJ5KSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICByZXR1cm4gc2VnbWVudHMuaW5jbHVkZXMoJ3NtYXBpX2ludGVybmFsJyk7XHJcbiAgfTtcclxuICBjb25zdCBtZXJnZUNvbmZpZ3MgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnU0RWJywgJ21lcmdlQ29uZmlncycsIHByb2ZpbGUuaWRdLCBmYWxzZSk7XHJcbiAgY29uc3QgcmVzdWx0ID0gZmlsZXMucmVkdWNlKChhY2N1bSwgZmlsZSkgPT4ge1xyXG4gICAgaWYgKG1lcmdlQ29uZmlncyAmJiAhaXNTTUFQSUZpbGUoZmlsZSkgJiYgcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfQ09ORklHKSB7XHJcbiAgICAgIGFjY3VtLmNvbmZpZ3MucHVzaChmaWxlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFjY3VtLnJlZ3VsYXJzLnB1c2goZmlsZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgeyBjb25maWdzOiBbXSBhcyBJRmlsZUVudHJ5W10sIHJlZ3VsYXJzOiBbXSBhcyBJRmlsZUVudHJ5W10gfSk7XHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgIGFkZENvbmZpZ0ZpbGVzKGFwaSwgcHJvZmlsZUlkLCByZXN1bHQuY29uZmlncyksXHJcbiAgICBhZGRSZWd1bGFyRmlsZXMoYXBpLCBwcm9maWxlSWQsIHJlc3VsdC5yZWd1bGFycylcclxuICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgY29uZmlnTW9kSWQ6IHN0cmluZyk6IGFueSB7XHJcbiAgcmV0dXJuIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBjb25maWdNb2RJZCwgJ2F0dHJpYnV0ZXMnLCAnY29uZmlnTW9kJ10sIFtdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0Q29uZmlnTW9kQXR0cmlidXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29uZmlnTW9kSWQ6IHN0cmluZywgYXR0cmlidXRlczogc3RyaW5nW10pIHtcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgY29uZmlnTW9kSWQsICdjb25maWdNb2QnLCBhdHRyaWJ1dGVzKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb25maWdNb2Q6IHR5cGVzLklNb2QsIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKSB7XHJcbiAgY29uc3QgZXhpc3RpbmcgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhhcGkuZ2V0U3RhdGUoKSwgY29uZmlnTW9kLmlkKTtcclxuICBjb25zdCBuZXdBdHRyaWJ1dGVzID0gZXhpc3RpbmcuZmlsdGVyKGF0dHIgPT4gIWF0dHJpYnV0ZXMuaW5jbHVkZXMoYXR0cikpO1xyXG4gIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGksIGNvbmZpZ01vZC5pZCwgbmV3QXR0cmlidXRlcyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFkZENvbmZpZ0ZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcclxuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBpZDogTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCxcclxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIGNvbmZpZyBmaWxlcy4uLicsXHJcbiAgICBtZXNzYWdlOiAnU3RhcnRpbmcgdXAuLi4nXHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBhZGRNb2RDb25maWcoYXBpLCBmaWxlcywgdW5kZWZpbmVkKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gYWRkUmVndWxhckZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcclxuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlcykge1xyXG4gICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLFxyXG4gICAgICAgIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmICghaXNNb2RDYW5kaWRhdGVWYWxpZChtb2QsIGVudHJ5KSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBmcm9tID0gbW9kUGF0aHNbbW9kLnR5cGUgPz8gJyddO1xyXG4gICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXHJcbiAgICAgICAgLy8gIGZ1bmN0aW9uJ3Mgam9iIHRvIHJlcG9ydCB0aGlzLlxyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlc29sdmUgbW9kIHBhdGggZm9yIG1vZCB0eXBlJywgbW9kLnR5cGUpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShmcm9tLCBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LiBUaGF0IHdheSwgdm9ydGV4IHdpbGxcclxuICAgICAgLy8gY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0IGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSk7XHJcbiAgICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ2FyZSB0aGUgc2FtZSBmaWxlJykpIHtcclxuICAgICAgICAgIC8vIHNob3VsZCB3ZSBiZSByZXBvcnRpbmcgdGhpcyB0byB0aGUgdXNlcj8gVGhpcyBpcyBhIGNvbXBsZXRlbHlcclxuICAgICAgICAgIC8vIGF1dG9tYXRlZCBwcm9jZXNzIGFuZCBpZiBpdCBmYWlscyBtb3JlIG9mdGVuIHRoYW4gbm90IHRoZVxyXG4gICAgICAgICAgLy8gdXNlciBwcm9iYWJseSBkb2Vzbid0IGNhcmVcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlLWltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGlzTW9kQ2FuZGlkYXRlVmFsaWQgPSAobW9kLCBlbnRyeSkgPT4ge1xyXG4gIGlmIChtb2Q/LmlkID09PSB1bmRlZmluZWQgfHwgbW9kLnR5cGUgPT09ICdzZHZyb290Zm9sZGVyJykge1xyXG4gICAgLy8gVGhlcmUgaXMgbm8gcmVsaWFibGUgd2F5IHRvIGFzY2VydGFpbiB3aGV0aGVyIGEgbmV3IGZpbGUgZW50cnlcclxuICAgIC8vICBhY3R1YWxseSBiZWxvbmdzIHRvIGEgcm9vdCBtb2RUeXBlIGFzIHNvbWUgb2YgdGhlc2UgbW9kcyB3aWxsIGFjdFxyXG4gICAgLy8gIGFzIHJlcGxhY2VtZW50IG1vZHMuIFRoaXMgb2J2aW91c2x5IG1lYW5zIHRoYXQgaWYgdGhlIGdhbWUgaGFzXHJcbiAgICAvLyAgYSBzdWJzdGFudGlhbCB1cGRhdGUgd2hpY2ggaW50cm9kdWNlcyBuZXcgZmlsZXMgd2UgY291bGQgcG90ZW50aWFsbHlcclxuICAgIC8vICBhZGQgYSB2YW5pbGxhIGdhbWUgZmlsZSBpbnRvIHRoZSBtb2QncyBzdGFnaW5nIGZvbGRlciBjYXVzaW5nIGNvbnN0YW50XHJcbiAgICAvLyAgY29udGVudGlvbiBiZXR3ZWVuIHRoZSBnYW1lIGl0c2VsZiAod2hlbiBpdCB1cGRhdGVzKSBhbmQgdGhlIG1vZC5cclxuICAgIC8vXHJcbiAgICAvLyBUaGVyZSBpcyBhbHNvIGEgcG90ZW50aWFsIGNoYW5jZSBmb3Igcm9vdCBtb2RUeXBlcyB0byBjb25mbGljdCB3aXRoIHJlZ3VsYXJcclxuICAgIC8vICBtb2RzLCB3aGljaCBpcyB3aHkgaXQncyBub3Qgc2FmZSB0byBhc3N1bWUgdGhhdCBhbnkgYWRkaXRpb24gaW5zaWRlIHRoZVxyXG4gICAgLy8gIG1vZHMgZGlyZWN0b3J5IGNhbiBiZSBzYWZlbHkgYWRkZWQgdG8gdGhpcyBtb2QncyBzdGFnaW5nIGZvbGRlciBlaXRoZXIuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBpZiAobW9kLnR5cGUgIT09ICdTTUFQSScpIHtcclxuICAgIC8vIE90aGVyIG1vZCB0eXBlcyBkbyBub3QgcmVxdWlyZSBmdXJ0aGVyIHZhbGlkYXRpb24gLSBpdCBzaG91bGQgYmUgZmluZVxyXG4gICAgLy8gIHRvIGFkZCB0aGlzIGVudHJ5LlxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gIGNvbnN0IG1vZHNTZWdJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXHJcbiAgICA/IHNlZ21lbnRzW21vZHNTZWdJZHggKyAxXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgbGV0IGJ1bmRsZWRNb2RzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ3NtYXBpQnVuZGxlZE1vZHMnXSwgW10pO1xyXG4gIGJ1bmRsZWRNb2RzID0gYnVuZGxlZE1vZHMubGVuZ3RoID4gMCA/IGJ1bmRsZWRNb2RzIDogZ2V0QnVuZGxlZE1vZHMoKTtcclxuICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ2NvbnRlbnQnKSkge1xyXG4gICAgLy8gU01BUEkgaXMgbm90IHN1cHBvc2VkIHRvIG92ZXJ3cml0ZSB0aGUgZ2FtZSdzIGNvbnRlbnQgZGlyZWN0bHkuXHJcbiAgICAvLyAgdGhpcyBpcyBjbGVhcmx5IG5vdCBhIFNNQVBJIGZpbGUgYW5kIHNob3VsZCBfbm90XyBiZSBhZGRlZCB0byBpdC5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHJldHVybiAobW9kRm9sZGVyTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiBidW5kbGVkTW9kcy5pbmNsdWRlcyhtb2RGb2xkZXJOYW1lKTtcclxufTsiXX0=