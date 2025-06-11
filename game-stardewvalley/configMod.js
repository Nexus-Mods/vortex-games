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
function onSyncModConfigurations(api, silent) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (!(smapiTool === null || smapiTool === void 0 ? void 0 : smapiTool.path)) {
            api.showErrorNotification('SMAPI is not installed/configured', 'This feature requires Vortex to know the location of SMAPI. Please ensure that SMAPI is at least configured as a tool in Vortex.', { allowReport: false });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFDdEUscUNBQW9KO0FBQ3BKLHVDQUE0QztBQUU1QyxpQ0FBb0U7QUFFcEUsbUNBQXNEO0FBR3RELE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQy9DLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQTtBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWdDO0lBQ2hFLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUM1RSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUM5QixHQUFHLEVBQUU7UUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLGdCQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCw4Q0FRQztBQUVELFNBQWUsdUJBQXVCLENBQUMsR0FBd0IsRUFBRSxNQUFnQjs7UUFDL0UsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7WUFDL0IsT0FBTztTQUNSO1FBQ0QsTUFBTSxTQUFT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LENBQUM7SUFDbkYsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM1QyxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBRXpDLElBQUksV0FBVyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLFdBQVcsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFBLHVCQUFjLEdBQUUsQ0FBQztJQUN0RSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFHaEMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCBzZWxlY3RvcnMsIGxvZywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELCBHQU1FX0lELCBNT0RfQ09ORklHLCBSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCBNT0RfVFlQRV9DT05GSUcsIE1PRF9NQU5JRkVTVCwgZ2V0QnVuZGxlZE1vZHMgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IHNldE1lcmdlQ29uZmlncyB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IElGaWxlRW50cnkgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgd2Fsa1BhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCwgZGVsZXRlRm9sZGVyIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7IGZpbmRTTUFQSU1vZCwgZmluZFNNQVBJVG9vbCB9IGZyb20gJy4vU01BUEknO1xyXG5pbXBvcnQgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5cclxuY29uc3Qgc3luY1dyYXBwZXIgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnc3dhcCcsIHt9LCAnU3luYyBNb2QgQ29uZmlndXJhdGlvbnMnLFxyXG4gICAgKCkgPT4gc3luY1dyYXBwZXIoY29udGV4dC5hcGkpLFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgc2lsZW50PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xyXG4gIGlmICghc21hcGlUb29sPy5wYXRoKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdTTUFQSSBpcyBub3QgaW5zdGFsbGVkL2NvbmZpZ3VyZWQnLCAnVGhpcyBmZWF0dXJlIHJlcXVpcmVzIFZvcnRleCB0byBrbm93IHRoZSBsb2NhdGlvbiBvZiBTTUFQSS4gUGxlYXNlIGVuc3VyZSB0aGF0IFNNQVBJIGlzIGF0IGxlYXN0IGNvbmZpZ3VyZWQgYXMgYSB0b29sIGluIFZvcnRleC4nLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xyXG4gIGlmICghbWVyZ2VDb25maWdzKSB7XHJcbiAgICBpZiAoc2lsZW50KSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ01vZCBDb25maWd1cmF0aW9uIFN5bmMnLCB7XHJcbiAgICAgIGJiY29kZTogJ01hbnkgU3RhcmRldyBWYWxsZXkgbW9kcyBnZW5lcmF0ZSB0aGVpciBvd24gY29uZmlndXJhdGlvbiBmaWxlcyBkdXJpbmcgZ2FtZSBwbGF5LiBCeSBkZWZhdWx0IHRoZSBnZW5lcmF0ZWQgZmlsZXMgYXJlLCAnXHJcbiAgICAgICAgKyAnaW5nZXN0ZWQgYnkgdGhlaXIgcmVzcGVjdGl2ZSBtb2RzLlticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgICArICdVbmZvcnR1bmF0ZWx5IHRoZSBtb2QgY29uZmlndXJhdGlvbiBmaWxlcyBhcmUgbG9zdCB3aGVuIHVwZGF0aW5nIG9yIHJlbW92aW5nIGEgbW9kLlticl1bL2JyXVticl1bL2JyXSBUaGlzIGJ1dHRvbiBhbGxvd3MgeW91IHRvICdcclxuICAgICAgICArICdJbXBvcnQgYWxsIG9mIHlvdXIgYWN0aXZlIG1vZFxcJ3MgY29uZmlndXJhdGlvbiBmaWxlcyBpbnRvIGEgc2luZ2xlIG1vZCB3aGljaCB3aWxsIHJlbWFpbiB1bmFmZmVjdGVkIGJ5IG1vZCB1cGRhdGVzLlticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgICArICdXb3VsZCB5b3UgbGlrZSB0byBlbmFibGUgdGhpcyBmdW5jdGlvbmFsaXR5PyAoU01BUEkgbXVzdCBiZSBpbnN0YWxsZWQpJyxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnRW5hYmxlJyB9XHJcbiAgICBdKTtcclxuXHJcbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0Nsb3NlJykge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdFbmFibGUnKSB7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRNZXJnZUNvbmZpZ3MocHJvZmlsZS5pZCwgdHJ1ZSkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdHlwZSBFdmVudFR5cGUgPSAncHVyZ2UtbW9kcycgfCAnZGVwbG95LW1vZHMnO1xyXG4gIGNvbnN0IGV2ZW50UHJvbWlzZSA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGV2ZW50VHlwZTogRXZlbnRUeXBlKSA9PiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCBjYiA9IChlcnI6IGFueSkgPT4gZXJyICE9PSBudWxsID8gcmVqZWN0KGVycikgOiByZXNvbHZlKCk7XHJcbiAgICAoZXZlbnRUeXBlID09PSAncHVyZ2UtbW9kcycpXHJcbiAgICAgID8gYXBpLmV2ZW50cy5lbWl0KGV2ZW50VHlwZSwgZmFsc2UsIGNiKVxyXG4gICAgICA6IGFwaS5ldmVudHMuZW1pdChldmVudFR5cGUsIGNiKTtcclxuICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcclxuICAgIGlmIChtb2Q/LmNvbmZpZ01vZFBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBhd2FpdCBldmVudFByb21pc2UoYXBpLCAncHVyZ2UtbW9kcycpO1xyXG5cclxuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCByZXNvbHZlQ2FuZGlkYXRlTmFtZSA9IChmaWxlOiBJRW50cnkpOiBzdHJpbmcgPT4ge1xyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShpbnN0YWxsUGF0aCwgZmlsZS5maWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gcmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIHJldHVybiBzZWdtZW50c1swXTtcclxuICAgIH1cclxuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgd2Fsa1BhdGgoaW5zdGFsbFBhdGgpO1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiBJRmlsZUVudHJ5W10sIGZpbGU6IElFbnRyeSkgPT4ge1xyXG4gICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfQ09ORklHICYmICFwYXRoLmRpcm5hbWUoZmlsZS5maWxlUGF0aCkuaW5jbHVkZXMobW9kLmNvbmZpZ01vZFBhdGgpKSB7XHJcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlTmFtZSA9IHJlc29sdmVDYW5kaWRhdGVOYW1lKGZpbGUpO1xyXG4gICAgICAgIGlmICh1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIGNhbmRpZGF0ZU5hbWUsICdlbmFibGVkJ10sIGZhbHNlKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYWNjdW0ucHVzaCh7IGZpbGVQYXRoOiBmaWxlLmZpbGVQYXRoLCBjYW5kaWRhdGVzOiBbY2FuZGlkYXRlTmFtZV0gfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gICAgYXdhaXQgYWRkTW9kQ29uZmlnKGFwaSwgZmlsdGVyZWQsIGluc3RhbGxQYXRoKTtcclxuICAgIGF3YWl0IGV2ZW50UHJvbWlzZShhcGksICdkZXBsb3ktbW9kcycpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHN5bmMgbW9kIGNvbmZpZ3VyYXRpb25zJywgZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhbml0aXplUHJvZmlsZU5hbWUoaW5wdXQ6IHN0cmluZykge1xyXG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsICdfJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbmZpZ01vZE5hbWUocHJvZmlsZU5hbWU6IHN0cmluZykge1xyXG4gIHJldHVybiBgU3RhcmRldyBWYWxsZXkgQ29uZmlndXJhdGlvbiAoJHtzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGVOYW1lKX0pYDtcclxufVxyXG5cclxudHlwZSBDb25maWdNb2QgPSB7XHJcbiAgbW9kOiB0eXBlcy5JTW9kO1xyXG4gIGNvbmZpZ01vZFBhdGg6IHN0cmluZztcclxufVxyXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Q29uZmlnTW9kPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xyXG4gIGlmICghbWVyZ2VDb25maWdzKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kID0gYXdhaXQgZW5zdXJlQ29uZmlnTW9kKGFwaSk7XHJcbiAgICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBjb25maWdNb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBjb25maWdNb2RQYXRoLCBtb2QgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzb2x2ZSBjb25maWcgbW9kIHBhdGgnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZE1vZENvbmZpZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiBJRmlsZUVudHJ5W10sIG1vZHNQYXRoPzogc3RyaW5nKSB7XHJcbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gIGlmIChjb25maWdNb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBpc0luc3RhbGxQYXRoID0gbW9kc1BhdGggIT09IHVuZGVmaW5lZDtcclxuICBtb2RzUGF0aCA9IG1vZHNQYXRoID8/IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZGVmYXVsdE1vZHNSZWxQYXRoKCkpO1xyXG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xyXG4gIGlmIChzbWFwaVRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBjb25maWdNb2RBdHRyaWJ1dGVzOiBzdHJpbmdbXSA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcclxuICBsZXQgbmV3Q29uZmlnQXR0cmlidXRlcyA9IEFycmF5LmZyb20obmV3IFNldChjb25maWdNb2RBdHRyaWJ1dGVzKSk7XHJcbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ3NtYXBpX2ludGVybmFsJykpIHtcclxuICAgICAgLy8gRG9uJ3QgdG91Y2ggdGhlIGludGVybmFsIFNNQVBJIGNvbmZpZ3VyYXRpb24gZmlsZXMuXHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgICBpZDogTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCxcclxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgY29uZmlnIGZpbGVzLi4uJyxcclxuICAgICAgbWVzc2FnZTogZmlsZS5jYW5kaWRhdGVzWzBdLFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGlmICghY29uZmlnTW9kQXR0cmlidXRlcy5pbmNsdWRlcyhmaWxlLmNhbmRpZGF0ZXNbMF0pKSB7XHJcbiAgICAgIG5ld0NvbmZpZ0F0dHJpYnV0ZXMucHVzaChmaWxlLmNhbmRpZGF0ZXNbMF0pO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5zdGFsbFJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZHNQYXRoLCBmaWxlLmZpbGVQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSBpbnN0YWxsUmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBpc0luc3RhbGxQYXRoID8gc2VnbWVudHMuc2xpY2UoMSkuam9pbihwYXRoLnNlcCkgOiBpbnN0YWxsUmVsUGF0aDtcclxuICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihjb25maWdNb2QuY29uZmlnTW9kUGF0aCwgcmVsUGF0aCk7XHJcbiAgICAgIGNvbnN0IHRhcmdldERpciA9IHBhdGguZXh0bmFtZSh0YXJnZXRQYXRoKSAhPT0gJycgPyBwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkgOiB0YXJnZXRQYXRoO1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRhcmdldERpcik7XHJcbiAgICAgIGxvZygnZGVidWcnLCAnaW1wb3J0aW5nIGNvbmZpZyBmaWxlIGZyb20nLCB7IHNvdXJjZTogZmlsZS5maWxlUGF0aCwgZGVzdGluYXRpb246IHRhcmdldFBhdGgsIG1vZElkOiBmaWxlLmNhbmRpZGF0ZXNbMF0gfSk7XHJcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhmaWxlLmZpbGVQYXRoLCB0YXJnZXRQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZS5maWxlUGF0aCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCk7XHJcbiAgc2V0Q29uZmlnTW9kQXR0cmlidXRlKGFwaSwgY29uZmlnTW9kLm1vZC5pZCwgQXJyYXkuZnJvbShuZXcgU2V0KG5ld0NvbmZpZ0F0dHJpYnV0ZXMpKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVDb25maWdNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx0eXBlcy5JTW9kPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kSW5zdGFsbGVkID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maW5kKGl0ZXIgPT4gaXRlci50eXBlID09PSBNT0RfVFlQRV9DT05GSUcpO1xyXG4gIGlmIChtb2RJbnN0YWxsZWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2RJbnN0YWxsZWQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IGNvbmZpZ01vZE5hbWUocHJvZmlsZS5uYW1lKTtcclxuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGNyZWF0ZUNvbmZpZ01vZChhcGksIG1vZE5hbWUsIHByb2ZpbGUpO1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlLmlkLCBtb2QuaWQsIHRydWUpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNvbmZpZ01vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZE5hbWU6IHN0cmluZywgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUpOiBQcm9taXNlPHR5cGVzLklNb2Q+IHtcclxuICBjb25zdCBtb2QgPSB7XHJcbiAgICBpZDogbW9kTmFtZSxcclxuICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcclxuICAgIGF0dHJpYnV0ZXM6IHtcclxuICAgICAgbmFtZTogJ1N0YXJkZXcgVmFsbGV5IE1vZCBDb25maWd1cmF0aW9uJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIG1vZCBpcyBhIGNvbGxlY3RpdmUgbWVyZ2Ugb2YgU0RWIG1vZCBjb25maWd1cmF0aW9uIGZpbGVzIHdoaWNoIFZvcnRleCBtYWludGFpbnMgJ1xyXG4gICAgICAgICsgJ2ZvciB0aGUgbW9kcyB5b3UgaGF2ZSBpbnN0YWxsZWQuIFRoZSBjb25maWd1cmF0aW9uIGlzIG1haW50YWluZWQgdGhyb3VnaCBtb2QgdXBkYXRlcywgJ1xyXG4gICAgICAgICsgJ2J1dCBhdCB0aW1lcyBpdCBtYXkgbmVlZCB0byBiZSBtYW51YWxseSB1cGRhdGVkJyxcclxuICAgICAgbG9naWNhbEZpbGVOYW1lOiAnU3RhcmRldyBWYWxsZXkgTW9kIENvbmZpZ3VyYXRpb24nLFxyXG4gICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxyXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgICB2YXJpYW50OiBzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGUubmFtZS5yZXBsYWNlKFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsICdfJykpLFxyXG4gICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcclxuICAgICAgc291cmNlOiAndXNlci1nZW5lcmF0ZWQnLFxyXG4gICAgfSxcclxuICAgIGluc3RhbGxhdGlvblBhdGg6IG1vZE5hbWUsXHJcbiAgICB0eXBlOiBNT0RfVFlQRV9DT05GSUcsXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHR5cGVzLklNb2Q+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIHByb2ZpbGUuZ2FtZUlkLCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzb2x2ZShtb2QgYXMgYW55KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25XaWxsRW5hYmxlTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBtb2RJZHM6IHN0cmluZ1tdLCBlbmFibGVkOiBib29sZWFuLCBvcHRpb25zPzogYW55KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChlbmFibGVkKSB7XHJcbiAgICBhd2FpdCBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGksIHRydWUpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gIGlmICghY29uZmlnTW9kKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAobW9kSWRzLmluY2x1ZGVzKGNvbmZpZ01vZC5tb2QuaWQpKSB7XHJcbiAgICAvLyBUaGUgY29uZmlnIG1vZCBpcyBnZXR0aW5nIGRpc2FibGVkL3VuaW5zdGFsbGVkIC0gcmUtaW5zdGF0ZSBhbGwgb2ZcclxuICAgIC8vICB0aGUgY29uZmlndXJhdGlvbiBmaWxlcy5cclxuICAgIGF3YWl0IG9uUmV2ZXJ0RmlsZXMoYXBpLCBwcm9maWxlSWQpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKG9wdGlvbnM/Lmluc3RhbGxlZCB8fCBvcHRpb25zPy53aWxsQmVSZXBsYWNlZCkge1xyXG4gICAgLy8gRG8gbm90aGluZywgdGhlIG1vZHMgYXJlIGJlaW5nIHJlLWluc3RhbGxlZC5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGF0dHJpYiA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcclxuICBjb25zdCByZWxldmFudCA9IG1vZElkcy5maWx0ZXIoaWQgPT4gYXR0cmliLmluY2x1ZGVzKGlkKSk7XHJcbiAgaWYgKHJlbGV2YW50Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAoZW5hYmxlZCkge1xyXG4gICAgYXdhaXQgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBmb3IgKGNvbnN0IGlkIG9mIHJlbGV2YW50KSB7XHJcbiAgICBjb25zdCBtb2QgPSBtb2RzW2lkXTtcclxuICAgIGlmICghbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgY29uc3QgZmlsZXM6IElFbnRyeVtdID0gYXdhaXQgd2Fsa1BhdGgobW9kUGF0aCwgeyBza2lwTGlua3M6IHRydWUsIHNraXBIaWRkZW46IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUgfSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKSA9PT0gTU9EX01BTklGRVNUKTtcclxuICAgIGlmIChtYW5pZmVzdEZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZFBhdGgsIHBhdGguZGlybmFtZShtYW5pZmVzdEZpbGUuZmlsZVBhdGgpKTtcclxuICAgIGNvbnN0IG1vZENvbmZpZ0ZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ01vZC5jb25maWdNb2RQYXRoLCByZWxQYXRoLCBNT0RfQ09ORklHKTtcclxuICAgIGF3YWl0IGZzLmNvcHlBc3luYyhtb2RDb25maWdGaWxlUGF0aCwgcGF0aC5qb2luKG1vZFBhdGgsIHJlbFBhdGgsIE1PRF9DT05GSUcpLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KS5jYXRjaChlcnIgPT4gbnVsbCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBhcHBseVRvTW9kQ29uZmlnKGFwaSwgKCkgPT4gZGVsZXRlRm9sZGVyKHBhdGguZGlybmFtZShtb2RDb25maWdGaWxlUGF0aCkpKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLCBjb25maWdNb2QubW9kLCByZWxldmFudCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBseVRvTW9kQ29uZmlnKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY2I6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcclxuICAvLyBBcHBseWluZyBmaWxlIG9wZXJhdGlvbnMgdG8gdGhlIGNvbmZpZyBtb2QgcmVxdWlyZXMgdXMgdG9cclxuICAvLyAgcmVtb3ZlIGl0IGZyb20gdGhlIGdhbWUgZGlyZWN0b3J5IGFuZCBkZXBsb3ltZW50IG1hbmlmZXN0IGJlZm9yZVxyXG4gIC8vICByZS1pbnRyb2R1Y2luZyBpdCAodGhpcyBpcyB0byBhdm9pZCBFQ0QpXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcclxuICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgY29uZmlnTW9kLm1vZC5pZCwgZmFsc2UpO1xyXG4gICAgYXdhaXQgY2IoKTtcclxuICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgY29uZmlnTW9kLm1vZC5pZCwgdHJ1ZSk7IFxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uUmV2ZXJ0RmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcclxuICBpZiAoIWNvbmZpZ01vZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBhdHRyaWIgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XHJcbiAgaWYgKGF0dHJpYi5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGF3YWl0IG9uV2lsbEVuYWJsZU1vZHMoYXBpLCBwcm9maWxlSWQsIGF0dHJpYiwgZmFsc2UpO1xyXG4gIHJldHVybjtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWRkZWRGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzbWFwaVRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbCA9IGZpbmRTTUFQSVRvb2woYXBpKTtcclxuICBpZiAoc21hcGlUb29sID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFZlcnkgaW1wb3J0YW50IG5vdCB0byBhZGQgYW55IGZpbGVzIGlmIFZvcnRleCBoYXMgbm8ga25vd2xlZGdlIG9mIFNNQVBJJ3MgbG9jYXRpb24uXHJcbiAgICAvLyAgdGhpcyBpcyB0byBhdm9pZCBwdWxsaW5nIFNNQVBJIGNvbmZpZ3VyYXRpb24gZmlsZXMgaW50byBvbmUgb2YgdGhlIG1vZHMgaW5zdGFsbGVkIGJ5IFZvcnRleC5cclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgaXNTTUFQSUZpbGUgPSAoZmlsZTogSUZpbGVFbnRyeSkgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgcmV0dXJuIHNlZ21lbnRzLmluY2x1ZGVzKCdzbWFwaV9pbnRlcm5hbCcpO1xyXG4gIH07XHJcbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xyXG4gIGNvbnN0IHJlc3VsdCA9IGZpbGVzLnJlZHVjZSgoYWNjdW0sIGZpbGUpID0+IHtcclxuICAgIGlmIChtZXJnZUNvbmZpZ3MgJiYgIWlzU01BUElGaWxlKGZpbGUpICYmIHBhdGguYmFzZW5hbWUoZmlsZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0NPTkZJRykge1xyXG4gICAgICBhY2N1bS5jb25maWdzLnB1c2goZmlsZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhY2N1bS5yZWd1bGFycy5wdXNoKGZpbGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHsgY29uZmlnczogW10gYXMgSUZpbGVFbnRyeVtdLCByZWd1bGFyczogW10gYXMgSUZpbGVFbnRyeVtdIH0pO1xyXG4gIHJldHVybiBQcm9taXNlLmFsbChbXHJcbiAgICBhZGRDb25maWdGaWxlcyhhcGksIHByb2ZpbGVJZCwgcmVzdWx0LmNvbmZpZ3MpLFxyXG4gICAgYWRkUmVndWxhckZpbGVzKGFwaSwgcHJvZmlsZUlkLCByZXN1bHQucmVndWxhcnMpXHJcbiAgXSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGNvbmZpZ01vZElkOiBzdHJpbmcpOiBhbnkge1xyXG4gIHJldHVybiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgY29uZmlnTW9kSWQsICdhdHRyaWJ1dGVzJywgJ2NvbmZpZ01vZCddLCBbXSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNvbmZpZ01vZElkOiBzdHJpbmcsIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKSB7XHJcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGNvbmZpZ01vZElkLCAnY29uZmlnTW9kJywgYXR0cmlidXRlcykpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW1vdmVDb25maWdNb2RBdHRyaWJ1dGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29uZmlnTW9kOiB0eXBlcy5JTW9kLCBhdHRyaWJ1dGVzOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IGV4aXN0aW5nID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLmdldFN0YXRlKCksIGNvbmZpZ01vZC5pZCk7XHJcbiAgY29uc3QgbmV3QXR0cmlidXRlcyA9IGV4aXN0aW5nLmZpbHRlcihhdHRyID0+ICFhdHRyaWJ1dGVzLmluY2x1ZGVzKGF0dHIpKTtcclxuICBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpLCBjb25maWdNb2QuaWQsIG5ld0F0dHJpYnV0ZXMpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBhZGRDb25maWdGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XHJcbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgaWQ6IE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QsXHJcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBjb25maWcgZmlsZXMuLi4nLFxyXG4gICAgbWVzc2FnZTogJ1N0YXJ0aW5nIHVwLi4uJ1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gYWRkTW9kQ29uZmlnKGFwaSwgZmlsZXMsIHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFkZFJlZ3VsYXJGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XHJcbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZXMpIHtcclxuICAgIGlmIChlbnRyeS5jYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxyXG4gICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSxcclxuICAgICAgICB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcclxuICAgICAgaWYgKGZyb20gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIEhvdyBpcyB0aGlzIGV2ZW4gcG9zc2libGU/IHJlZ2FyZGxlc3MgaXQncyBub3QgdGhpc1xyXG4gICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZXNvbHZlIG1vZCBwYXRoIGZvciBtb2QgdHlwZScsIG1vZC50eXBlKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZnJvbSwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xyXG4gICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXHJcbiAgICAgIC8vIGNyZWF0ZSBhIGxpbmsgdG8gaXQgd2l0aCB0aGUgY29ycmVjdCBkZXBsb3ltZW50IG1ldGhvZCBhbmQgbm90IGFzayB0aGUgdXNlciBhbnkgcXVlc3Rpb25zXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xyXG4gICAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBpZiAoIWVyci5tZXNzYWdlLmluY2x1ZGVzKCdhcmUgdGhlIHNhbWUgZmlsZScpKSB7XHJcbiAgICAgICAgICAvLyBzaG91bGQgd2UgYmUgcmVwb3J0aW5nIHRoaXMgdG8gdGhlIHVzZXI/IFRoaXMgaXMgYSBjb21wbGV0ZWx5XHJcbiAgICAgICAgICAvLyBhdXRvbWF0ZWQgcHJvY2VzcyBhbmQgaWYgaXQgZmFpbHMgbW9yZSBvZnRlbiB0aGFuIG5vdCB0aGVcclxuICAgICAgICAgIC8vIHVzZXIgcHJvYmFibHkgZG9lc24ndCBjYXJlXHJcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZS1pbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcclxuICBpZiAobW9kPy5pZCA9PT0gdW5kZWZpbmVkIHx8IG1vZC50eXBlID09PSAnc2R2cm9vdGZvbGRlcicpIHtcclxuICAgIC8vIFRoZXJlIGlzIG5vIHJlbGlhYmxlIHdheSB0byBhc2NlcnRhaW4gd2hldGhlciBhIG5ldyBmaWxlIGVudHJ5XHJcbiAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcclxuICAgIC8vICBhcyByZXBsYWNlbWVudCBtb2RzLiBUaGlzIG9idmlvdXNseSBtZWFucyB0aGF0IGlmIHRoZSBnYW1lIGhhc1xyXG4gICAgLy8gIGEgc3Vic3RhbnRpYWwgdXBkYXRlIHdoaWNoIGludHJvZHVjZXMgbmV3IGZpbGVzIHdlIGNvdWxkIHBvdGVudGlhbGx5XHJcbiAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxyXG4gICAgLy8gIGNvbnRlbnRpb24gYmV0d2VlbiB0aGUgZ2FtZSBpdHNlbGYgKHdoZW4gaXQgdXBkYXRlcykgYW5kIHRoZSBtb2QuXHJcbiAgICAvL1xyXG4gICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXHJcbiAgICAvLyAgbW9kcywgd2hpY2ggaXMgd2h5IGl0J3Mgbm90IHNhZmUgdG8gYXNzdW1lIHRoYXQgYW55IGFkZGl0aW9uIGluc2lkZSB0aGVcclxuICAgIC8vICBtb2RzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IGFkZGVkIHRvIHRoaXMgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgZWl0aGVyLlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgaWYgKG1vZC50eXBlICE9PSAnU01BUEknKSB7XHJcbiAgICAvLyBPdGhlciBtb2QgdHlwZXMgZG8gbm90IHJlcXVpcmUgZnVydGhlciB2YWxpZGF0aW9uIC0gaXQgc2hvdWxkIGJlIGZpbmVcclxuICAgIC8vICB0byBhZGQgdGhpcyBlbnRyeS5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VnbWVudHMgPSBlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICBjb25zdCBtb2RzU2VnSWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gIGNvbnN0IG1vZEZvbGRlck5hbWUgPSAoKG1vZHNTZWdJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc1NlZ0lkeCArIDEpKVxyXG4gICAgPyBzZWdtZW50c1ttb2RzU2VnSWR4ICsgMV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gIGxldCBidW5kbGVkTW9kcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdzbWFwaUJ1bmRsZWRNb2RzJ10sIFtdKTtcclxuICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XHJcbiAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCdjb250ZW50JykpIHtcclxuICAgIC8vIFNNQVBJIGlzIG5vdCBzdXBwb3NlZCB0byBvdmVyd3JpdGUgdGhlIGdhbWUncyBjb250ZW50IGRpcmVjdGx5LlxyXG4gICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKG1vZEZvbGRlck5hbWUgIT09IHVuZGVmaW5lZCkgJiYgYnVuZGxlZE1vZHMuaW5jbHVkZXMobW9kRm9sZGVyTmFtZSk7XHJcbn07Il19