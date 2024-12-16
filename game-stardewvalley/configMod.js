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
        const smapi = (0, SMAPI_1.findSMAPIMod)(api);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID || smapi === undefined) {
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
        const smapi = (0, SMAPI_1.findSMAPIMod)(api);
        if (smapi === undefined) {
            return;
        }
        const configModAttributes = extractConfigModAttributes(state, configMod.mod.id);
        let newConfigAttributes = Array.from(new Set(configModAttributes));
        for (const file of files) {
            api.sendNotification({
                type: 'activity',
                id: common_1.NOTIF_ACTIVITY_CONFIG_MOD,
                title: 'Importing config files...',
                message: file.candidates[0],
            });
            if (file.candidates.includes(smapi === null || smapi === void 0 ? void 0 : smapi.installationPath)) {
                continue;
            }
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
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const isSMAPI = (file) => file.candidates.find(candidate => mods[candidate].type === 'SMAPI') !== undefined;
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        const result = files.reduce((accum, file) => {
            if (mergeConfigs && !isSMAPI(file) && path_1.default.basename(file.filePath).toLowerCase() === common_1.MOD_CONFIG) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFDdEUscUNBQW9KO0FBQ3BKLHVDQUE0QztBQUU1QyxpQ0FBb0U7QUFFcEUsbUNBQXVDO0FBR3ZDLE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQy9DLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQTtBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWdDO0lBQ2hFLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUM1RSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUM5QixHQUFHLEVBQUU7UUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLGdCQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCw4Q0FRQztBQUVELFNBQWUsdUJBQXVCLENBQUMsR0FBd0IsRUFBRSxNQUFnQjs7UUFDL0UsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE1BQU0sS0FBSyxHQUFHLElBQUEsb0JBQVksRUFBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFF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QUM7SUFDNUUsV0FBVyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUEsdUJBQWMsR0FBRSxDQUFDO0lBQ3RFLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUdoQyxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxDQUFDLGFBQWEsS0FBSyxTQUFTLENBQUMsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzlFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHNlbGVjdG9ycywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QsIEdBTUVfSUQsIE1PRF9DT05GSUcsIFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsIE1PRF9UWVBFX0NPTkZJRywgTU9EX01BTklGRVNULCBnZXRCdW5kbGVkTW9kcyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgc2V0TWVyZ2VDb25maWdzIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHsgSUZpbGVFbnRyeSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyB3YWxrUGF0aCwgZGVmYXVsdE1vZHNSZWxQYXRoLCBkZWxldGVGb2xkZXIgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgZmluZFNNQVBJTW9kIH0gZnJvbSAnLi9TTUFQSSc7XHJcbmltcG9ydCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XHJcblxyXG5jb25zdCBzeW5jV3JhcHBlciA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb25maWdNb2QoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCA5OTksICdzd2FwJywge30sICdTeW5jIE1vZCBDb25maWd1cmF0aW9ucycsXHJcbiAgICAoKSA9PiBzeW5jV3JhcHBlcihjb250ZXh0LmFwaSksXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBzaWxlbnQ/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IHNtYXBpID0gZmluZFNNQVBJTW9kKGFwaSk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBzbWFwaSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IG1lcmdlQ29uZmlncyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdTRFYnLCAnbWVyZ2VDb25maWdzJywgcHJvZmlsZS5pZF0sIGZhbHNlKTtcclxuICBpZiAoIW1lcmdlQ29uZmlncykge1xyXG4gICAgaWYgKHNpbGVudCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdNb2QgQ29uZmlndXJhdGlvbiBTeW5jJywge1xyXG4gICAgICBiYmNvZGU6ICdNYW55IFN0YXJkZXcgVmFsbGV5IG1vZHMgZ2VuZXJhdGUgdGhlaXIgb3duIGNvbmZpZ3VyYXRpb24gZmlsZXMgZHVyaW5nIGdhbWUgcGxheS4gQnkgZGVmYXVsdCB0aGUgZ2VuZXJhdGVkIGZpbGVzIGFyZSwgJ1xyXG4gICAgICAgICsgJ2luZ2VzdGVkIGJ5IHRoZWlyIHJlc3BlY3RpdmUgbW9kcy5bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICAgKyAnVW5mb3J0dW5hdGVseSB0aGUgbW9kIGNvbmZpZ3VyYXRpb24gZmlsZXMgYXJlIGxvc3Qgd2hlbiB1cGRhdGluZyBvciByZW1vdmluZyBhIG1vZC5bYnJdWy9icl1bYnJdWy9icl0gVGhpcyBidXR0b24gYWxsb3dzIHlvdSB0byAnXHJcbiAgICAgICAgKyAnSW1wb3J0IGFsbCBvZiB5b3VyIGFjdGl2ZSBtb2RcXCdzIGNvbmZpZ3VyYXRpb24gZmlsZXMgaW50byBhIHNpbmdsZSBtb2Qgd2hpY2ggd2lsbCByZW1haW4gdW5hZmZlY3RlZCBieSBtb2QgdXBkYXRlcy5bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICAgKyAnV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb25hbGl0eT8gKFNNQVBJIG11c3QgYmUgaW5zdGFsbGVkKScsXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdDbG9zZScgfSxcclxuICAgICAgeyBsYWJlbDogJ0VuYWJsZScgfVxyXG4gICAgXSk7XHJcblxyXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDbG9zZScpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnRW5hYmxlJykge1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0TWVyZ2VDb25maWdzKHByb2ZpbGUuaWQsIHRydWUpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHR5cGUgRXZlbnRUeXBlID0gJ3B1cmdlLW1vZHMnIHwgJ2RlcGxveS1tb2RzJztcclxuICBjb25zdCBldmVudFByb21pc2UgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBldmVudFR5cGU6IEV2ZW50VHlwZSkgPT4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3QgY2IgPSAoZXJyOiBhbnkpID0+IGVyciAhPT0gbnVsbCA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpO1xyXG4gICAgKGV2ZW50VHlwZSA9PT0gJ3B1cmdlLW1vZHMnKVxyXG4gICAgICA/IGFwaS5ldmVudHMuZW1pdChldmVudFR5cGUsIGZhbHNlLCBjYilcclxuICAgICAgOiBhcGkuZXZlbnRzLmVtaXQoZXZlbnRUeXBlLCBjYik7XHJcbiAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XHJcbiAgICBpZiAobW9kPy5jb25maWdNb2RQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYXdhaXQgZXZlbnRQcm9taXNlKGFwaSwgJ3B1cmdlLW1vZHMnKTtcclxuXHJcbiAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgcmVzb2x2ZUNhbmRpZGF0ZU5hbWUgPSAoZmlsZTogSUVudHJ5KTogc3RyaW5nID0+IHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoaW5zdGFsbFBhdGgsIGZpbGUuZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IHJlbFBhdGguc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICByZXR1cm4gc2VnbWVudHNbMF07XHJcbiAgICB9XHJcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHdhbGtQYXRoKGluc3RhbGxQYXRoKTtcclxuICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMucmVkdWNlKChhY2N1bTogSUZpbGVFbnRyeVtdLCBmaWxlOiBJRW50cnkpID0+IHtcclxuICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZmlsZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0NPTkZJRyAmJiAhcGF0aC5kaXJuYW1lKGZpbGUuZmlsZVBhdGgpLmluY2x1ZGVzKG1vZC5jb25maWdNb2RQYXRoKSkge1xyXG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZU5hbWUgPSByZXNvbHZlQ2FuZGlkYXRlTmFtZShmaWxlKTtcclxuICAgICAgICBpZiAodXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBjYW5kaWRhdGVOYW1lLCAnZW5hYmxlZCddLCBmYWxzZSkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFjY3VtLnB1c2goeyBmaWxlUGF0aDogZmlsZS5maWxlUGF0aCwgY2FuZGlkYXRlczogW2NhbmRpZGF0ZU5hbWVdIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICAgIGF3YWl0IGFkZE1vZENvbmZpZyhhcGksIGZpbHRlcmVkLCBpbnN0YWxsUGF0aCk7XHJcbiAgICBhd2FpdCBldmVudFByb21pc2UoYXBpLCAnZGVwbG95LW1vZHMnKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzeW5jIG1vZCBjb25maWd1cmF0aW9ucycsIGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzYW5pdGl6ZVByb2ZpbGVOYW1lKGlucHV0OiBzdHJpbmcpIHtcclxuICByZXR1cm4gaW5wdXQucmVwbGFjZShSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCAnXycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25maWdNb2ROYW1lKHByb2ZpbGVOYW1lOiBzdHJpbmcpIHtcclxuICByZXR1cm4gYFN0YXJkZXcgVmFsbGV5IENvbmZpZ3VyYXRpb24gKCR7c2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlTmFtZSl9KWA7XHJcbn1cclxuXHJcbnR5cGUgQ29uZmlnTW9kID0ge1xyXG4gIG1vZDogdHlwZXMuSU1vZDtcclxuICBjb25maWdNb2RQYXRoOiBzdHJpbmc7XHJcbn1cclxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPENvbmZpZ01vZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG4gIGNvbnN0IG1lcmdlQ29uZmlncyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdTRFYnLCAnbWVyZ2VDb25maWdzJywgcHJvZmlsZS5pZF0sIGZhbHNlKTtcclxuICBpZiAoIW1lcmdlQ29uZmlncykge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGVuc3VyZUNvbmZpZ01vZChhcGkpO1xyXG4gICAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgY29uZmlnTW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgY29uZmlnTW9kUGF0aCwgbW9kIH0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlc29sdmUgY29uZmlnIG1vZCBwYXRoJywgZXJyKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRNb2RDb25maWcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogSUZpbGVFbnRyeVtdLCBtb2RzUGF0aD86IHN0cmluZykge1xyXG4gIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcclxuICBpZiAoY29uZmlnTW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgaXNJbnN0YWxsUGF0aCA9IG1vZHNQYXRoICE9PSB1bmRlZmluZWQ7XHJcbiAgbW9kc1BhdGggPSBtb2RzUGF0aCA/PyBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCgpKTtcclxuICBjb25zdCBzbWFwaSA9IGZpbmRTTUFQSU1vZChhcGkpO1xyXG4gIGlmIChzbWFwaSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGNvbmZpZ01vZEF0dHJpYnV0ZXM6IHN0cmluZ1tdID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGUsIGNvbmZpZ01vZC5tb2QuaWQpO1xyXG4gIGxldCBuZXdDb25maWdBdHRyaWJ1dGVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGNvbmZpZ01vZEF0dHJpYnV0ZXMpKTtcclxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgICAgaWQ6IE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QsXHJcbiAgICAgIHRpdGxlOiAnSW1wb3J0aW5nIGNvbmZpZyBmaWxlcy4uLicsXHJcbiAgICAgIG1lc3NhZ2U6IGZpbGUuY2FuZGlkYXRlc1swXSxcclxuICAgIH0pO1xyXG4gICAgaWYgKGZpbGUuY2FuZGlkYXRlcy5pbmNsdWRlcyhzbWFwaT8uaW5zdGFsbGF0aW9uUGF0aCkpIHtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmICghY29uZmlnTW9kQXR0cmlidXRlcy5pbmNsdWRlcyhmaWxlLmNhbmRpZGF0ZXNbMF0pKSB7XHJcbiAgICAgIG5ld0NvbmZpZ0F0dHJpYnV0ZXMucHVzaChmaWxlLmNhbmRpZGF0ZXNbMF0pO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5zdGFsbFJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZHNQYXRoLCBmaWxlLmZpbGVQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSBpbnN0YWxsUmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBpc0luc3RhbGxQYXRoID8gc2VnbWVudHMuc2xpY2UoMSkuam9pbihwYXRoLnNlcCkgOiBpbnN0YWxsUmVsUGF0aDtcclxuICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihjb25maWdNb2QuY29uZmlnTW9kUGF0aCwgcmVsUGF0aCk7XHJcbiAgICAgIGNvbnN0IHRhcmdldERpciA9IHBhdGguZXh0bmFtZSh0YXJnZXRQYXRoKSAhPT0gJycgPyBwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkgOiB0YXJnZXRQYXRoO1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRhcmdldERpcik7XHJcbiAgICAgIGxvZygnZGVidWcnLCAnaW1wb3J0aW5nIGNvbmZpZyBmaWxlIGZyb20nLCB7IHNvdXJjZTogZmlsZS5maWxlUGF0aCwgZGVzdGluYXRpb246IHRhcmdldFBhdGgsIG1vZElkOiBmaWxlLmNhbmRpZGF0ZXNbMF0gfSk7XHJcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhmaWxlLmZpbGVQYXRoLCB0YXJnZXRQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZS5maWxlUGF0aCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCk7XHJcbiAgc2V0Q29uZmlnTW9kQXR0cmlidXRlKGFwaSwgY29uZmlnTW9kLm1vZC5pZCwgQXJyYXkuZnJvbShuZXcgU2V0KG5ld0NvbmZpZ0F0dHJpYnV0ZXMpKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVDb25maWdNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx0eXBlcy5JTW9kPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kSW5zdGFsbGVkID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maW5kKGl0ZXIgPT4gaXRlci50eXBlID09PSBNT0RfVFlQRV9DT05GSUcpO1xyXG4gIGlmIChtb2RJbnN0YWxsZWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2RJbnN0YWxsZWQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IGNvbmZpZ01vZE5hbWUocHJvZmlsZS5uYW1lKTtcclxuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGNyZWF0ZUNvbmZpZ01vZChhcGksIG1vZE5hbWUsIHByb2ZpbGUpO1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlLmlkLCBtb2QuaWQsIHRydWUpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNvbmZpZ01vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZE5hbWU6IHN0cmluZywgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUpOiBQcm9taXNlPHR5cGVzLklNb2Q+IHtcclxuICBjb25zdCBtb2QgPSB7XHJcbiAgICBpZDogbW9kTmFtZSxcclxuICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcclxuICAgIGF0dHJpYnV0ZXM6IHtcclxuICAgICAgbmFtZTogJ1N0YXJkZXcgVmFsbGV5IE1vZCBDb25maWd1cmF0aW9uJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIG1vZCBpcyBhIGNvbGxlY3RpdmUgbWVyZ2Ugb2YgU0RWIG1vZCBjb25maWd1cmF0aW9uIGZpbGVzIHdoaWNoIFZvcnRleCBtYWludGFpbnMgJ1xyXG4gICAgICAgICsgJ2ZvciB0aGUgbW9kcyB5b3UgaGF2ZSBpbnN0YWxsZWQuIFRoZSBjb25maWd1cmF0aW9uIGlzIG1haW50YWluZWQgdGhyb3VnaCBtb2QgdXBkYXRlcywgJ1xyXG4gICAgICAgICsgJ2J1dCBhdCB0aW1lcyBpdCBtYXkgbmVlZCB0byBiZSBtYW51YWxseSB1cGRhdGVkJyxcclxuICAgICAgbG9naWNhbEZpbGVOYW1lOiAnU3RhcmRldyBWYWxsZXkgTW9kIENvbmZpZ3VyYXRpb24nLFxyXG4gICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxyXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgICB2YXJpYW50OiBzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGUubmFtZS5yZXBsYWNlKFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsICdfJykpLFxyXG4gICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcclxuICAgICAgc291cmNlOiAndXNlci1nZW5lcmF0ZWQnLFxyXG4gICAgfSxcclxuICAgIGluc3RhbGxhdGlvblBhdGg6IG1vZE5hbWUsXHJcbiAgICB0eXBlOiBNT0RfVFlQRV9DT05GSUcsXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHR5cGVzLklNb2Q+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIHByb2ZpbGUuZ2FtZUlkLCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzb2x2ZShtb2QgYXMgYW55KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25XaWxsRW5hYmxlTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBtb2RJZHM6IHN0cmluZ1tdLCBlbmFibGVkOiBib29sZWFuLCBvcHRpb25zPzogYW55KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChlbmFibGVkKSB7XHJcbiAgICBhd2FpdCBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGksIHRydWUpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gIGlmICghY29uZmlnTW9kKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAobW9kSWRzLmluY2x1ZGVzKGNvbmZpZ01vZC5tb2QuaWQpKSB7XHJcbiAgICAvLyBUaGUgY29uZmlnIG1vZCBpcyBnZXR0aW5nIGRpc2FibGVkL3VuaW5zdGFsbGVkIC0gcmUtaW5zdGF0ZSBhbGwgb2ZcclxuICAgIC8vICB0aGUgY29uZmlndXJhdGlvbiBmaWxlcy5cclxuICAgIGF3YWl0IG9uUmV2ZXJ0RmlsZXMoYXBpLCBwcm9maWxlSWQpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKG9wdGlvbnM/Lmluc3RhbGxlZCB8fCBvcHRpb25zPy53aWxsQmVSZXBsYWNlZCkge1xyXG4gICAgLy8gRG8gbm90aGluZywgdGhlIG1vZHMgYXJlIGJlaW5nIHJlLWluc3RhbGxlZC5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGF0dHJpYiA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcclxuICBjb25zdCByZWxldmFudCA9IG1vZElkcy5maWx0ZXIoaWQgPT4gYXR0cmliLmluY2x1ZGVzKGlkKSk7XHJcbiAgaWYgKHJlbGV2YW50Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAoZW5hYmxlZCkge1xyXG4gICAgYXdhaXQgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBmb3IgKGNvbnN0IGlkIG9mIHJlbGV2YW50KSB7XHJcbiAgICBjb25zdCBtb2QgPSBtb2RzW2lkXTtcclxuICAgIGlmICghbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgY29uc3QgZmlsZXM6IElFbnRyeVtdID0gYXdhaXQgd2Fsa1BhdGgobW9kUGF0aCwgeyBza2lwTGlua3M6IHRydWUsIHNraXBIaWRkZW46IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUgfSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKSA9PT0gTU9EX01BTklGRVNUKTtcclxuICAgIGlmIChtYW5pZmVzdEZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZFBhdGgsIHBhdGguZGlybmFtZShtYW5pZmVzdEZpbGUuZmlsZVBhdGgpKTtcclxuICAgIGNvbnN0IG1vZENvbmZpZ0ZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ01vZC5jb25maWdNb2RQYXRoLCByZWxQYXRoLCBNT0RfQ09ORklHKTtcclxuICAgIGF3YWl0IGZzLmNvcHlBc3luYyhtb2RDb25maWdGaWxlUGF0aCwgcGF0aC5qb2luKG1vZFBhdGgsIHJlbFBhdGgsIE1PRF9DT05GSUcpLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KS5jYXRjaChlcnIgPT4gbnVsbCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBhcHBseVRvTW9kQ29uZmlnKGFwaSwgKCkgPT4gZGVsZXRlRm9sZGVyKHBhdGguZGlybmFtZShtb2RDb25maWdGaWxlUGF0aCkpKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLCBjb25maWdNb2QubW9kLCByZWxldmFudCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBseVRvTW9kQ29uZmlnKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY2I6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcclxuICAvLyBBcHBseWluZyBmaWxlIG9wZXJhdGlvbnMgdG8gdGhlIGNvbmZpZyBtb2QgcmVxdWlyZXMgdXMgdG9cclxuICAvLyAgcmVtb3ZlIGl0IGZyb20gdGhlIGdhbWUgZGlyZWN0b3J5IGFuZCBkZXBsb3ltZW50IG1hbmlmZXN0IGJlZm9yZVxyXG4gIC8vICByZS1pbnRyb2R1Y2luZyBpdCAodGhpcyBpcyB0byBhdm9pZCBFQ0QpXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcclxuICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgY29uZmlnTW9kLm1vZC5pZCwgZmFsc2UpO1xyXG4gICAgYXdhaXQgY2IoKTtcclxuICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgY29uZmlnTW9kLm1vZC5pZCwgdHJ1ZSk7IFxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uUmV2ZXJ0RmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcclxuICBpZiAoIWNvbmZpZ01vZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBhdHRyaWIgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XHJcbiAgaWYgKGF0dHJpYi5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGF3YWl0IG9uV2lsbEVuYWJsZU1vZHMoYXBpLCBwcm9maWxlSWQsIGF0dHJpYiwgZmFsc2UpO1xyXG4gIHJldHVybjtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWRkZWRGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgaXNTTUFQSSA9IChmaWxlOiBJRmlsZUVudHJ5KSA9PiBmaWxlLmNhbmRpZGF0ZXMuZmluZChjYW5kaWRhdGUgPT4gbW9kc1tjYW5kaWRhdGVdLnR5cGUgPT09ICdTTUFQSScpICE9PSB1bmRlZmluZWQ7XHJcbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xyXG4gIGNvbnN0IHJlc3VsdCA9IGZpbGVzLnJlZHVjZSgoYWNjdW0sIGZpbGUpID0+IHtcclxuICAgIGlmIChtZXJnZUNvbmZpZ3MgJiYgIWlzU01BUEkoZmlsZSkgJiYgcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfQ09ORklHKSB7XHJcbiAgICAgIGFjY3VtLmNvbmZpZ3MucHVzaChmaWxlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFjY3VtLnJlZ3VsYXJzLnB1c2goZmlsZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgeyBjb25maWdzOiBbXSBhcyBJRmlsZUVudHJ5W10sIHJlZ3VsYXJzOiBbXSBhcyBJRmlsZUVudHJ5W10gfSk7XHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgIGFkZENvbmZpZ0ZpbGVzKGFwaSwgcHJvZmlsZUlkLCByZXN1bHQuY29uZmlncyksXHJcbiAgICBhZGRSZWd1bGFyRmlsZXMoYXBpLCBwcm9maWxlSWQsIHJlc3VsdC5yZWd1bGFycylcclxuICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgY29uZmlnTW9kSWQ6IHN0cmluZyk6IGFueSB7XHJcbiAgcmV0dXJuIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBjb25maWdNb2RJZCwgJ2F0dHJpYnV0ZXMnLCAnY29uZmlnTW9kJ10sIFtdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0Q29uZmlnTW9kQXR0cmlidXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29uZmlnTW9kSWQ6IHN0cmluZywgYXR0cmlidXRlczogc3RyaW5nW10pIHtcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgY29uZmlnTW9kSWQsICdjb25maWdNb2QnLCBhdHRyaWJ1dGVzKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb25maWdNb2Q6IHR5cGVzLklNb2QsIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKSB7XHJcbiAgY29uc3QgZXhpc3RpbmcgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhhcGkuZ2V0U3RhdGUoKSwgY29uZmlnTW9kLmlkKTtcclxuICBjb25zdCBuZXdBdHRyaWJ1dGVzID0gZXhpc3RpbmcuZmlsdGVyKGF0dHIgPT4gIWF0dHJpYnV0ZXMuaW5jbHVkZXMoYXR0cikpO1xyXG4gIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGksIGNvbmZpZ01vZC5pZCwgbmV3QXR0cmlidXRlcyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFkZENvbmZpZ0ZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcclxuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBpZDogTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCxcclxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIGNvbmZpZyBmaWxlcy4uLicsXHJcbiAgICBtZXNzYWdlOiAnU3RhcnRpbmcgdXAuLi4nXHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBhZGRNb2RDb25maWcoYXBpLCBmaWxlcywgdW5kZWZpbmVkKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gYWRkUmVndWxhckZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcclxuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlcykge1xyXG4gICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLFxyXG4gICAgICAgIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmICghaXNNb2RDYW5kaWRhdGVWYWxpZChtb2QsIGVudHJ5KSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBmcm9tID0gbW9kUGF0aHNbbW9kLnR5cGUgPz8gJyddO1xyXG4gICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXHJcbiAgICAgICAgLy8gIGZ1bmN0aW9uJ3Mgam9iIHRvIHJlcG9ydCB0aGlzLlxyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlc29sdmUgbW9kIHBhdGggZm9yIG1vZCB0eXBlJywgbW9kLnR5cGUpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShmcm9tLCBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LiBUaGF0IHdheSwgdm9ydGV4IHdpbGxcclxuICAgICAgLy8gY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0IGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSk7XHJcbiAgICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ2FyZSB0aGUgc2FtZSBmaWxlJykpIHtcclxuICAgICAgICAgIC8vIHNob3VsZCB3ZSBiZSByZXBvcnRpbmcgdGhpcyB0byB0aGUgdXNlcj8gVGhpcyBpcyBhIGNvbXBsZXRlbHlcclxuICAgICAgICAgIC8vIGF1dG9tYXRlZCBwcm9jZXNzIGFuZCBpZiBpdCBmYWlscyBtb3JlIG9mdGVuIHRoYW4gbm90IHRoZVxyXG4gICAgICAgICAgLy8gdXNlciBwcm9iYWJseSBkb2Vzbid0IGNhcmVcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlLWltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGlzTW9kQ2FuZGlkYXRlVmFsaWQgPSAobW9kLCBlbnRyeSkgPT4ge1xyXG4gIGlmIChtb2Q/LmlkID09PSB1bmRlZmluZWQgfHwgbW9kLnR5cGUgPT09ICdzZHZyb290Zm9sZGVyJykge1xyXG4gICAgLy8gVGhlcmUgaXMgbm8gcmVsaWFibGUgd2F5IHRvIGFzY2VydGFpbiB3aGV0aGVyIGEgbmV3IGZpbGUgZW50cnlcclxuICAgIC8vICBhY3R1YWxseSBiZWxvbmdzIHRvIGEgcm9vdCBtb2RUeXBlIGFzIHNvbWUgb2YgdGhlc2UgbW9kcyB3aWxsIGFjdFxyXG4gICAgLy8gIGFzIHJlcGxhY2VtZW50IG1vZHMuIFRoaXMgb2J2aW91c2x5IG1lYW5zIHRoYXQgaWYgdGhlIGdhbWUgaGFzXHJcbiAgICAvLyAgYSBzdWJzdGFudGlhbCB1cGRhdGUgd2hpY2ggaW50cm9kdWNlcyBuZXcgZmlsZXMgd2UgY291bGQgcG90ZW50aWFsbHlcclxuICAgIC8vICBhZGQgYSB2YW5pbGxhIGdhbWUgZmlsZSBpbnRvIHRoZSBtb2QncyBzdGFnaW5nIGZvbGRlciBjYXVzaW5nIGNvbnN0YW50XHJcbiAgICAvLyAgY29udGVudGlvbiBiZXR3ZWVuIHRoZSBnYW1lIGl0c2VsZiAod2hlbiBpdCB1cGRhdGVzKSBhbmQgdGhlIG1vZC5cclxuICAgIC8vXHJcbiAgICAvLyBUaGVyZSBpcyBhbHNvIGEgcG90ZW50aWFsIGNoYW5jZSBmb3Igcm9vdCBtb2RUeXBlcyB0byBjb25mbGljdCB3aXRoIHJlZ3VsYXJcclxuICAgIC8vICBtb2RzLCB3aGljaCBpcyB3aHkgaXQncyBub3Qgc2FmZSB0byBhc3N1bWUgdGhhdCBhbnkgYWRkaXRpb24gaW5zaWRlIHRoZVxyXG4gICAgLy8gIG1vZHMgZGlyZWN0b3J5IGNhbiBiZSBzYWZlbHkgYWRkZWQgdG8gdGhpcyBtb2QncyBzdGFnaW5nIGZvbGRlciBlaXRoZXIuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBpZiAobW9kLnR5cGUgIT09ICdTTUFQSScpIHtcclxuICAgIC8vIE90aGVyIG1vZCB0eXBlcyBkbyBub3QgcmVxdWlyZSBmdXJ0aGVyIHZhbGlkYXRpb24gLSBpdCBzaG91bGQgYmUgZmluZVxyXG4gICAgLy8gIHRvIGFkZCB0aGlzIGVudHJ5LlxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gIGNvbnN0IG1vZHNTZWdJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXHJcbiAgICA/IHNlZ21lbnRzW21vZHNTZWdJZHggKyAxXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgbGV0IGJ1bmRsZWRNb2RzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ3NtYXBpQnVuZGxlZE1vZHMnXSwgW10pO1xyXG4gIGJ1bmRsZWRNb2RzID0gYnVuZGxlZE1vZHMubGVuZ3RoID4gMCA/IGJ1bmRsZWRNb2RzIDogZ2V0QnVuZGxlZE1vZHMoKTtcclxuICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ2NvbnRlbnQnKSkge1xyXG4gICAgLy8gU01BUEkgaXMgbm90IHN1cHBvc2VkIHRvIG92ZXJ3cml0ZSB0aGUgZ2FtZSdzIGNvbnRlbnQgZGlyZWN0bHkuXHJcbiAgICAvLyAgdGhpcyBpcyBjbGVhcmx5IG5vdCBhIFNNQVBJIGZpbGUgYW5kIHNob3VsZCBfbm90XyBiZSBhZGRlZCB0byBpdC5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHJldHVybiAobW9kRm9sZGVyTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiBidW5kbGVkTW9kcy5pbmNsdWRlcyhtb2RGb2xkZXJOYW1lKTtcclxufTsiXX0=