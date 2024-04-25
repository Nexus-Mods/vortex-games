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
exports.onAddedFiles = exports.applyToModConfig = exports.onWillEnableMods = exports.ensureConfigMod = exports.addModConfig = exports.registerConfigMod = void 0;
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
                    accum.push({ filePath: file.filePath, candidates: [resolveCandidateName(file)] });
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
        for (const file of files) {
            if (file.candidates.includes(smapi === null || smapi === void 0 ? void 0 : smapi.installationPath)) {
                continue;
            }
            const configModAttributes = extractConfigModAttributes(state, configMod.mod.id);
            if (!configModAttributes.includes(file.candidates[0])) {
                setConfigModAttribute(api, configMod.mod.id, [...configModAttributes, file.candidates[0]]);
            }
            try {
                const installRelPath = path_1.default.relative(modsPath, file.filePath);
                const segments = installRelPath.split(path_1.default.sep);
                const relPath = isInstallPath ? segments.slice(1).join(path_1.default.sep) : installRelPath;
                const targetPath = path_1.default.join(configMod.configModPath, relPath);
                const targetDir = path_1.default.extname(targetPath) !== '' ? path_1.default.dirname(targetPath) : targetPath;
                yield vortex_api_1.fs.ensureDirWritableAsync(targetDir);
                yield vortex_api_1.fs.copyAsync(file.filePath, targetPath, { overwrite: true });
                yield vortex_api_1.fs.removeAsync(file.filePath);
            }
            catch (err) {
                api.showErrorNotification('Failed to write mod config', err);
            }
        }
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
function onWillEnableMods(api, profileId, modIds, enabled) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFDdEUscUNBQXlIO0FBQ3pILHVDQUE0QztBQUU1QyxpQ0FBb0U7QUFFcEUsbUNBQXVDO0FBR3ZDLE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQy9DLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQTtBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWdDO0lBQ2hFLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUM1RSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUM5QixHQUFHLEVBQUU7UUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLGdCQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCw4Q0FRQztBQUVELFNBQWUsdUJBQXVCLENBQUMsR0FBd0IsRUFBRSxNQUFnQjs7UUFDL0UsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE1BQU0sS0FBSyxHQUFHLElBQUEsb0JBQVksRUFBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFF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LFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLFdBQVcsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFBLHVCQUFjLEdBQUUsQ0FBQztJQUN0RSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFHaEMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCBzZWxlY3RvcnMsIGxvZywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lELCBNT0RfQ09ORklHLCBSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCBNT0RfVFlQRV9DT05GSUcsIE1PRF9NQU5JRkVTVCwgZ2V0QnVuZGxlZE1vZHMgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IHNldE1lcmdlQ29uZmlncyB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IElGaWxlRW50cnkgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgd2Fsa1BhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCwgZGVsZXRlRm9sZGVyIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7IGZpbmRTTUFQSU1vZCB9IGZyb20gJy4vU01BUEknO1xyXG5pbXBvcnQgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5cclxuY29uc3Qgc3luY1dyYXBwZXIgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnc3dhcCcsIHt9LCAnU3luYyBNb2QgQ29uZmlndXJhdGlvbnMnLFxyXG4gICAgKCkgPT4gc3luY1dyYXBwZXIoY29udGV4dC5hcGkpLFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgc2lsZW50PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBzbWFwaSA9IGZpbmRTTUFQSU1vZChhcGkpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgc21hcGkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBtZXJnZUNvbmZpZ3MgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnU0RWJywgJ21lcmdlQ29uZmlncycsIHByb2ZpbGUuaWRdLCBmYWxzZSk7XHJcbiAgaWYgKCFtZXJnZUNvbmZpZ3MpIHtcclxuICAgIGlmIChzaWxlbnQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnTW9kIENvbmZpZ3VyYXRpb24gU3luYycsIHtcclxuICAgICAgYmJjb2RlOiAnTWFueSBTdGFyZGV3IFZhbGxleSBtb2RzIGdlbmVyYXRlIHRoZWlyIG93biBjb25maWd1cmF0aW9uIGZpbGVzIGR1cmluZyBnYW1lIHBsYXkuIEJ5IGRlZmF1bHQgdGhlIGdlbmVyYXRlZCBmaWxlcyBhcmUsICdcclxuICAgICAgICArICdpbmdlc3RlZCBieSB0aGVpciByZXNwZWN0aXZlIG1vZHMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICsgJ1VuZm9ydHVuYXRlbHkgdGhlIG1vZCBjb25maWd1cmF0aW9uIGZpbGVzIGFyZSBsb3N0IHdoZW4gdXBkYXRpbmcgb3IgcmVtb3ZpbmcgYSBtb2QuW2JyXVsvYnJdW2JyXVsvYnJdIFRoaXMgYnV0dG9uIGFsbG93cyB5b3UgdG8gJ1xyXG4gICAgICAgICsgJ0ltcG9ydCBhbGwgb2YgeW91ciBhY3RpdmUgbW9kXFwncyBjb25maWd1cmF0aW9uIGZpbGVzIGludG8gYSBzaW5nbGUgbW9kIHdoaWNoIHdpbGwgcmVtYWluIHVuYWZmZWN0ZWQgYnkgbW9kIHVwZGF0ZXMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICsgJ1dvdWxkIHlvdSBsaWtlIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uYWxpdHk/IChTTUFQSSBtdXN0IGJlIGluc3RhbGxlZCknLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdFbmFibGUnIH1cclxuICAgIF0pO1xyXG5cclxuICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnQ2xvc2UnKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0VuYWJsZScpIHtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldE1lcmdlQ29uZmlncyhwcm9maWxlLmlkLCB0cnVlKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0eXBlIEV2ZW50VHlwZSA9ICdwdXJnZS1tb2RzJyB8ICdkZXBsb3ktbW9kcyc7XHJcbiAgY29uc3QgZXZlbnRQcm9taXNlID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZXZlbnRUeXBlOiBFdmVudFR5cGUpID0+IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IGNiID0gKGVycjogYW55KSA9PiBlcnIgIT09IG51bGwgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKTtcclxuICAgIChldmVudFR5cGUgPT09ICdwdXJnZS1tb2RzJylcclxuICAgICAgPyBhcGkuZXZlbnRzLmVtaXQoZXZlbnRUeXBlLCBmYWxzZSwgY2IpXHJcbiAgICAgIDogYXBpLmV2ZW50cy5lbWl0KGV2ZW50VHlwZSwgY2IpO1xyXG4gIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gICAgaWYgKG1vZD8uY29uZmlnTW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGF3YWl0IGV2ZW50UHJvbWlzZShhcGksICdwdXJnZS1tb2RzJyk7XHJcblxyXG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHJlc29sdmVDYW5kaWRhdGVOYW1lID0gKGZpbGU6IElFbnRyeSk6IHN0cmluZyA9PiB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGluc3RhbGxQYXRoLCBmaWxlLmZpbGVQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgcmV0dXJuIHNlZ21lbnRzWzBdO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB3YWxrUGF0aChpbnN0YWxsUGF0aCk7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IElGaWxlRW50cnlbXSwgZmlsZTogSUVudHJ5KSA9PiB7XHJcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGUuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9DT05GSUcgJiYgIXBhdGguZGlybmFtZShmaWxlLmZpbGVQYXRoKS5pbmNsdWRlcyhtb2QuY29uZmlnTW9kUGF0aCkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKHsgZmlsZVBhdGg6IGZpbGUuZmlsZVBhdGgsIGNhbmRpZGF0ZXM6IFtyZXNvbHZlQ2FuZGlkYXRlTmFtZShmaWxlKV0gfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gICAgYXdhaXQgYWRkTW9kQ29uZmlnKGFwaSwgZmlsdGVyZWQsIGluc3RhbGxQYXRoKTtcclxuICAgIGF3YWl0IGV2ZW50UHJvbWlzZShhcGksICdkZXBsb3ktbW9kcycpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHN5bmMgbW9kIGNvbmZpZ3VyYXRpb25zJywgZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhbml0aXplUHJvZmlsZU5hbWUoaW5wdXQ6IHN0cmluZykge1xyXG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsICdfJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbmZpZ01vZE5hbWUocHJvZmlsZU5hbWU6IHN0cmluZykge1xyXG4gIHJldHVybiBgU3RhcmRldyBWYWxsZXkgQ29uZmlndXJhdGlvbiAoJHtzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGVOYW1lKX0pYDtcclxufVxyXG5cclxudHlwZSBDb25maWdNb2QgPSB7XHJcbiAgbW9kOiB0eXBlcy5JTW9kO1xyXG4gIGNvbmZpZ01vZFBhdGg6IHN0cmluZztcclxufVxyXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Q29uZmlnTW9kPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xyXG4gIGlmICghbWVyZ2VDb25maWdzKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kID0gYXdhaXQgZW5zdXJlQ29uZmlnTW9kKGFwaSk7XHJcbiAgICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBjb25maWdNb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBjb25maWdNb2RQYXRoLCBtb2QgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzb2x2ZSBjb25maWcgbW9kIHBhdGgnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZE1vZENvbmZpZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiBJRmlsZUVudHJ5W10sIG1vZHNQYXRoPzogc3RyaW5nKSB7XHJcbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xyXG4gIGlmIChjb25maWdNb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBpc0luc3RhbGxQYXRoID0gbW9kc1BhdGggIT09IHVuZGVmaW5lZDtcclxuICBtb2RzUGF0aCA9IG1vZHNQYXRoID8/IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZGVmYXVsdE1vZHNSZWxQYXRoKCkpO1xyXG4gIGNvbnN0IHNtYXBpID0gZmluZFNNQVBJTW9kKGFwaSk7XHJcbiAgaWYgKHNtYXBpID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XHJcbiAgICBpZiAoZmlsZS5jYW5kaWRhdGVzLmluY2x1ZGVzKHNtYXBpPy5pbnN0YWxsYXRpb25QYXRoKSkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IGNvbmZpZ01vZEF0dHJpYnV0ZXM6IHN0cmluZ1tdID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGUsIGNvbmZpZ01vZC5tb2QuaWQpXHJcbiAgICBpZiAoIWNvbmZpZ01vZEF0dHJpYnV0ZXMuaW5jbHVkZXMoZmlsZS5jYW5kaWRhdGVzWzBdKSkge1xyXG4gICAgICBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpLCBjb25maWdNb2QubW9kLmlkLCBbLi4uY29uZmlnTW9kQXR0cmlidXRlcywgZmlsZS5jYW5kaWRhdGVzWzBdXSk7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbnN0YWxsUmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kc1BhdGgsIGZpbGUuZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IGluc3RhbGxSZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IGlzSW5zdGFsbFBhdGggPyBzZWdtZW50cy5zbGljZSgxKS5qb2luKHBhdGguc2VwKSA6IGluc3RhbGxSZWxQYXRoO1xyXG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGNvbmZpZ01vZC5jb25maWdNb2RQYXRoLCByZWxQYXRoKTtcclxuICAgICAgY29uc3QgdGFyZ2V0RGlyID0gcGF0aC5leHRuYW1lKHRhcmdldFBhdGgpICE9PSAnJyA/IHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSA6IHRhcmdldFBhdGg7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGFyZ2V0RGlyKTtcclxuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGZpbGUuZmlsZVBhdGgsIHRhcmdldFBhdGgsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlLmZpbGVQYXRoKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlQ29uZmlnTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dHlwZXMuSU1vZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZEluc3RhbGxlZCA9IE9iamVjdC52YWx1ZXMobW9kcykuZmluZChpdGVyID0+IGl0ZXIudHlwZSA9PT0gTU9EX1RZUEVfQ09ORklHKTtcclxuICBpZiAobW9kSW5zdGFsbGVkICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kSW5zdGFsbGVkKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSBjb25maWdNb2ROYW1lKHByb2ZpbGUubmFtZSk7XHJcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBjcmVhdGVDb25maWdNb2QoYXBpLCBtb2ROYW1lLCBwcm9maWxlKTtcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZS5pZCwgbW9kLmlkLCB0cnVlKSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVDb25maWdNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2ROYW1lOiBzdHJpbmcsIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlKTogUHJvbWlzZTx0eXBlcy5JTW9kPiB7XHJcbiAgY29uc3QgbW9kID0ge1xyXG4gICAgaWQ6IG1vZE5hbWUsXHJcbiAgICBzdGF0ZTogJ2luc3RhbGxlZCcsXHJcbiAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgIG5hbWU6ICdTdGFyZGV3IFZhbGxleSBNb2QgQ29uZmlndXJhdGlvbicsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBtb2QgaXMgYSBjb2xsZWN0aXZlIG1lcmdlIG9mIFNEViBtb2QgY29uZmlndXJhdGlvbiBmaWxlcyB3aGljaCBWb3J0ZXggbWFpbnRhaW5zICdcclxuICAgICAgICArICdmb3IgdGhlIG1vZHMgeW91IGhhdmUgaW5zdGFsbGVkLiBUaGUgY29uZmlndXJhdGlvbiBpcyBtYWludGFpbmVkIHRocm91Z2ggbW9kIHVwZGF0ZXMsICdcclxuICAgICAgICArICdidXQgYXQgdGltZXMgaXQgbWF5IG5lZWQgdG8gYmUgbWFudWFsbHkgdXBkYXRlZCcsXHJcbiAgICAgIGxvZ2ljYWxGaWxlTmFtZTogJ1N0YXJkZXcgVmFsbGV5IE1vZCBDb25maWd1cmF0aW9uJyxcclxuICAgICAgbW9kSWQ6IDQyLCAvLyBNZWFuaW5nIG9mIGxpZmVcclxuICAgICAgdmVyc2lvbjogJzEuMC4wJyxcclxuICAgICAgdmFyaWFudDogc2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlLm5hbWUucmVwbGFjZShSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCAnXycpKSxcclxuICAgICAgaW5zdGFsbFRpbWU6IG5ldyBEYXRlKCksXHJcbiAgICB9LFxyXG4gICAgaW5zdGFsbGF0aW9uUGF0aDogbW9kTmFtZSxcclxuICAgIHR5cGU6IE1PRF9UWVBFX0NPTkZJRyxcclxuICB9O1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2U8dHlwZXMuSU1vZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgcHJvZmlsZS5nYW1lSWQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXNvbHZlKG1vZCBhcyBhbnkpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbldpbGxFbmFibGVNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4pIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKGVuYWJsZWQpIHtcclxuICAgIGF3YWl0IG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaSwgdHJ1ZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XHJcbiAgaWYgKCFjb25maWdNb2QpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGF0dHJpYiA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcclxuICBjb25zdCByZWxldmFudCA9IG1vZElkcy5maWx0ZXIoaWQgPT4gYXR0cmliLmluY2x1ZGVzKGlkKSk7XHJcbiAgaWYgKHJlbGV2YW50Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAoZW5hYmxlZCkge1xyXG4gICAgYXdhaXQgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBmb3IgKGNvbnN0IGlkIG9mIHJlbGV2YW50KSB7XHJcbiAgICBjb25zdCBtb2QgPSBtb2RzW2lkXTtcclxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgIGNvbnN0IGZpbGVzOiBJRW50cnlbXSA9IGF3YWl0IHdhbGtQYXRoKG1vZFBhdGgsIHsgc2tpcExpbmtzOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH0pO1xyXG4gICAgY29uc3QgbWFuaWZlc3RGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZS5maWxlUGF0aCkgPT09IE1PRF9NQU5JRkVTVCk7XHJcbiAgICBpZiAobWFuaWZlc3RGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoLCBwYXRoLmRpcm5hbWUobWFuaWZlc3RGaWxlLmZpbGVQYXRoKSk7XHJcbiAgICBjb25zdCBtb2RDb25maWdGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdNb2QuY29uZmlnTW9kUGF0aCwgcmVsUGF0aCwgTU9EX0NPTkZJRyk7XHJcbiAgICBhd2FpdCBmcy5jb3B5QXN5bmMobW9kQ29uZmlnRmlsZVBhdGgsIHBhdGguam9pbihtb2RQYXRoLCByZWxQYXRoLCBNT0RfQ09ORklHKSwgeyBvdmVyd3JpdGU6IHRydWUgfSkuY2F0Y2goZXJyID0+IG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgYXBwbHlUb01vZENvbmZpZyhhcGksICgpID0+IGRlbGV0ZUZvbGRlcihwYXRoLmRpcm5hbWUobW9kQ29uZmlnRmlsZVBhdGgpKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZW1vdmVDb25maWdNb2RBdHRyaWJ1dGVzKGFwaSwgY29uZmlnTW9kLm1vZCwgcmVsZXZhbnQpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXBwbHlUb01vZENvbmZpZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNiOiAoKSA9PiBQcm9taXNlPHZvaWQ+KSB7XHJcbiAgLy8gQXBwbHlpbmcgZmlsZSBvcGVyYXRpb25zIHRvIHRoZSBjb25maWcgbW9kIHJlcXVpcmVzIHVzIHRvXHJcbiAgLy8gIHJlbW92ZSBpdCBmcm9tIHRoZSBnYW1lIGRpcmVjdG9yeSBhbmQgZGVwbG95bWVudCBtYW5pZmVzdCBiZWZvcmVcclxuICAvLyAgcmUtaW50cm9kdWNpbmcgaXQgKHRoaXMgaXMgdG8gYXZvaWQgRUNEKVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XHJcbiAgICBhd2FpdCBhcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIGNvbmZpZ01vZC5tb2QuaWQsIGZhbHNlKTtcclxuICAgIGF3YWl0IGNiKCk7XHJcbiAgICBhd2FpdCBhcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIGNvbmZpZ01vZC5tb2QuaWQsIHRydWUpOyBcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2QgY29uZmlnJywgZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkFkZGVkRmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZywgZmlsZXM6IElGaWxlRW50cnlbXSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBkb24ndCBjYXJlIGFib3V0IGFueSBvdGhlciBnYW1lc1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGlzU01BUEkgPSAoZmlsZTogSUZpbGVFbnRyeSkgPT4gZmlsZS5jYW5kaWRhdGVzLmZpbmQoY2FuZGlkYXRlID0+IG1vZHNbY2FuZGlkYXRlXS50eXBlID09PSAnU01BUEknKSAhPT0gdW5kZWZpbmVkO1xyXG4gIGNvbnN0IG1lcmdlQ29uZmlncyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdTRFYnLCAnbWVyZ2VDb25maWdzJywgcHJvZmlsZS5pZF0sIGZhbHNlKTtcclxuICBjb25zdCByZXN1bHQgPSBmaWxlcy5yZWR1Y2UoKGFjY3VtLCBmaWxlKSA9PiB7XHJcbiAgICBpZiAobWVyZ2VDb25maWdzICYmICFpc1NNQVBJKGZpbGUpICYmIHBhdGguYmFzZW5hbWUoZmlsZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0NPTkZJRykge1xyXG4gICAgICBhY2N1bS5jb25maWdzLnB1c2goZmlsZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhY2N1bS5yZWd1bGFycy5wdXNoKGZpbGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHsgY29uZmlnczogW10gYXMgSUZpbGVFbnRyeVtdLCByZWd1bGFyczogW10gYXMgSUZpbGVFbnRyeVtdIH0pO1xyXG4gIHJldHVybiBQcm9taXNlLmFsbChbXHJcbiAgICBhZGRDb25maWdGaWxlcyhhcGksIHByb2ZpbGVJZCwgcmVzdWx0LmNvbmZpZ3MpLFxyXG4gICAgYWRkUmVndWxhckZpbGVzKGFwaSwgcHJvZmlsZUlkLCByZXN1bHQucmVndWxhcnMpXHJcbiAgXSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGNvbmZpZ01vZElkOiBzdHJpbmcpOiBhbnkge1xyXG4gIHJldHVybiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgY29uZmlnTW9kSWQsICdhdHRyaWJ1dGVzJywgJ2NvbmZpZ01vZCddLCBbXSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNvbmZpZ01vZElkOiBzdHJpbmcsIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKSB7XHJcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGNvbmZpZ01vZElkLCAnY29uZmlnTW9kJywgYXR0cmlidXRlcykpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW1vdmVDb25maWdNb2RBdHRyaWJ1dGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29uZmlnTW9kOiB0eXBlcy5JTW9kLCBhdHRyaWJ1dGVzOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IGV4aXN0aW5nID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLmdldFN0YXRlKCksIGNvbmZpZ01vZC5pZCk7XHJcbiAgY29uc3QgbmV3QXR0cmlidXRlcyA9IGV4aXN0aW5nLmZpbHRlcihhdHRyID0+ICFhdHRyaWJ1dGVzLmluY2x1ZGVzKGF0dHIpKTtcclxuICBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpLCBjb25maWdNb2QuaWQsIG5ld0F0dHJpYnV0ZXMpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBhZGRDb25maWdGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XHJcbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuICByZXR1cm4gYWRkTW9kQ29uZmlnKGFwaSwgZmlsZXMsIHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFkZFJlZ3VsYXJGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XHJcbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZXMpIHtcclxuICAgIGlmIChlbnRyeS5jYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxyXG4gICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSxcclxuICAgICAgICB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcclxuICAgICAgaWYgKGZyb20gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIEhvdyBpcyB0aGlzIGV2ZW4gcG9zc2libGU/IHJlZ2FyZGxlc3MgaXQncyBub3QgdGhpc1xyXG4gICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZXNvbHZlIG1vZCBwYXRoIGZvciBtb2QgdHlwZScsIG1vZC50eXBlKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZnJvbSwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xyXG4gICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXHJcbiAgICAgIC8vIGNyZWF0ZSBhIGxpbmsgdG8gaXQgd2l0aCB0aGUgY29ycmVjdCBkZXBsb3ltZW50IG1ldGhvZCBhbmQgbm90IGFzayB0aGUgdXNlciBhbnkgcXVlc3Rpb25zXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xyXG4gICAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBpZiAoIWVyci5tZXNzYWdlLmluY2x1ZGVzKCdhcmUgdGhlIHNhbWUgZmlsZScpKSB7XHJcbiAgICAgICAgICAvLyBzaG91bGQgd2UgYmUgcmVwb3J0aW5nIHRoaXMgdG8gdGhlIHVzZXI/IFRoaXMgaXMgYSBjb21wbGV0ZWx5XHJcbiAgICAgICAgICAvLyBhdXRvbWF0ZWQgcHJvY2VzcyBhbmQgaWYgaXQgZmFpbHMgbW9yZSBvZnRlbiB0aGFuIG5vdCB0aGVcclxuICAgICAgICAgIC8vIHVzZXIgcHJvYmFibHkgZG9lc24ndCBjYXJlXHJcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZS1pbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcclxuICBpZiAobW9kPy5pZCA9PT0gdW5kZWZpbmVkIHx8IG1vZC50eXBlID09PSAnc2R2cm9vdGZvbGRlcicpIHtcclxuICAgIC8vIFRoZXJlIGlzIG5vIHJlbGlhYmxlIHdheSB0byBhc2NlcnRhaW4gd2hldGhlciBhIG5ldyBmaWxlIGVudHJ5XHJcbiAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcclxuICAgIC8vICBhcyByZXBsYWNlbWVudCBtb2RzLiBUaGlzIG9idmlvdXNseSBtZWFucyB0aGF0IGlmIHRoZSBnYW1lIGhhc1xyXG4gICAgLy8gIGEgc3Vic3RhbnRpYWwgdXBkYXRlIHdoaWNoIGludHJvZHVjZXMgbmV3IGZpbGVzIHdlIGNvdWxkIHBvdGVudGlhbGx5XHJcbiAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxyXG4gICAgLy8gIGNvbnRlbnRpb24gYmV0d2VlbiB0aGUgZ2FtZSBpdHNlbGYgKHdoZW4gaXQgdXBkYXRlcykgYW5kIHRoZSBtb2QuXHJcbiAgICAvL1xyXG4gICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXHJcbiAgICAvLyAgbW9kcywgd2hpY2ggaXMgd2h5IGl0J3Mgbm90IHNhZmUgdG8gYXNzdW1lIHRoYXQgYW55IGFkZGl0aW9uIGluc2lkZSB0aGVcclxuICAgIC8vICBtb2RzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IGFkZGVkIHRvIHRoaXMgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgZWl0aGVyLlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgaWYgKG1vZC50eXBlICE9PSAnU01BUEknKSB7XHJcbiAgICAvLyBPdGhlciBtb2QgdHlwZXMgZG8gbm90IHJlcXVpcmUgZnVydGhlciB2YWxpZGF0aW9uIC0gaXQgc2hvdWxkIGJlIGZpbmVcclxuICAgIC8vICB0byBhZGQgdGhpcyBlbnRyeS5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VnbWVudHMgPSBlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICBjb25zdCBtb2RzU2VnSWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gIGNvbnN0IG1vZEZvbGRlck5hbWUgPSAoKG1vZHNTZWdJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc1NlZ0lkeCArIDEpKVxyXG4gICAgPyBzZWdtZW50c1ttb2RzU2VnSWR4ICsgMV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gIGxldCBidW5kbGVkTW9kcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdzbWFwaUJ1bmRsZWRNb2RzJ10sIFtdKTtcclxuICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XHJcbiAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCdjb250ZW50JykpIHtcclxuICAgIC8vIFNNQVBJIGlzIG5vdCBzdXBwb3NlZCB0byBvdmVyd3JpdGUgdGhlIGdhbWUncyBjb250ZW50IGRpcmVjdGx5LlxyXG4gICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKG1vZEZvbGRlck5hbWUgIT09IHVuZGVmaW5lZCkgJiYgYnVuZGxlZE1vZHMuaW5jbHVkZXMobW9kRm9sZGVyTmFtZSk7XHJcbn07Il19