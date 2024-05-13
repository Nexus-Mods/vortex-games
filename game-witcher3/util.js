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
exports.toBlue = exports.validateProfile = exports.walkPath = exports.forceRefresh = exports.determineExecutable = exports.isLockedEntry = exports.getManuallyAddedMods = exports.getAllMods = exports.getManagedModNames = exports.findModFolder = exports.notifyMissingScriptMerger = exports.isTW3 = exports.getTLPath = exports.getDLCPath = exports.getDocumentsPath = exports.getDeployment = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const vortex_api_1 = require("vortex-api");
const iniParser_1 = __importDefault(require("./iniParser"));
const path_1 = __importDefault(require("path"));
const mergeInventoryParsing_1 = require("./mergeInventoryParsing");
const turbowalk_1 = __importDefault(require("turbowalk"));
const common_1 = require("./common");
function getDeployment(api, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const game = vortex_api_1.util.getGame(common_1.GAME_ID);
        if ((game === undefined) || ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined)) {
            (0, vortex_api_1.log)('error', 'game is not discovered', common_1.GAME_ID);
            return undefined;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const installationDirectories = Object.values(mods)
            .filter(mod => (includedMods !== undefined)
            ? includedMods.includes(mod.id)
            : true)
            .map(mod => mod.installationPath);
        const filterFunc = (file) => installationDirectories.includes(file.source);
        const modPaths = game.getModPaths(discovery.path);
        const modTypes = Object.keys(modPaths).filter(key => !!modPaths[key]);
        const deployment = yield modTypes.reduce((accumP, modType) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            try {
                const manifest = yield vortex_api_1.util.getManifest(api, modType, common_1.GAME_ID);
                accum[modType] = manifest.files.filter(filterFunc);
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'failed to get manifest', err);
            }
            return accum;
        }), {});
        return deployment;
    });
}
exports.getDeployment = getDeployment;
const getDocumentsPath = (game) => {
    return path_1.default.join(vortex_api_1.util.getVortexPath('documents'), 'The Witcher 3');
};
exports.getDocumentsPath = getDocumentsPath;
const getDLCPath = (api) => {
    return (game) => {
        const state = api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return path_1.default.join(discovery.path, 'DLC');
    };
};
exports.getDLCPath = getDLCPath;
exports.getTLPath = ((api) => {
    return (game) => {
        const state = api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return discovery.path;
    };
});
const isTW3 = (api) => {
    return (gameId) => {
        if (gameId !== undefined) {
            return (gameId === common_1.GAME_ID);
        }
        const state = api.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === common_1.GAME_ID);
    };
};
exports.isTW3 = isTW3;
function notifyMissingScriptMerger(api) {
    const notifId = 'missing-script-merger';
    api.sendNotification({
        id: notifId,
        type: 'info',
        message: api.translate('Witcher 3 script merger is missing/misconfigured', { ns: common_1.I18N_NAMESPACE }),
        allowSuppress: true,
        actions: [
            {
                title: 'More',
                action: () => {
                    api.showDialog('info', 'Witcher 3 Script Merger', {
                        bbcode: api.translate('Vortex is unable to resolve the Script Merger\'s location. The tool needs to be downloaded and configured manually. '
                            + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]Find out more about how to configure it as a tool for use in Vortex.[/url][br][/br][br][/br]'
                            + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: common_1.I18N_NAMESPACE }),
                    }, [
                        {
                            label: 'Cancel', action: () => {
                                api.dismissNotification('missing-script-merger');
                            }
                        },
                        {
                            label: 'Download Script Merger', action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                .catch(err => null)
                                .then(() => api.dismissNotification('missing-script-merger'))
                        },
                    ]);
                },
            },
        ],
    });
}
exports.notifyMissingScriptMerger = notifyMissingScriptMerger;
function findModFolder(installationPath, mod) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!installationPath || !(mod === null || mod === void 0 ? void 0 : mod.installationPath)) {
            const errMessage = !installationPath
                ? 'Game is not discovered'
                : 'Failed to resolve mod installation path';
            return Promise.reject(new Error(errMessage));
        }
        const expectedModNameLocation = ['witcher3menumodroot', 'witcher3tl'].includes(mod.type)
            ? path_1.default.join(installationPath, mod.installationPath, 'Mods')
            : path_1.default.join(installationPath, mod.installationPath);
        const entries = yield vortex_api_1.fs.readdirAsync(expectedModNameLocation);
        for (const entry of entries) {
            const stats = yield vortex_api_1.fs.statAsync(path_1.default.join(expectedModNameLocation, entry)).catch(err => null);
            if (stats === null || stats === void 0 ? void 0 : stats.isDirectory()) {
                return Promise.resolve(entry);
            }
        }
        return Promise.reject(new Error('Failed to find mod folder'));
    });
}
exports.findModFolder = findModFolder;
function getManagedModNames(api, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const isDeployed = (modPath) => __awaiter(this, void 0, void 0, function* () { return yield vortex_api_1.fs.statAsync(modPath).then(stats => stats.isDirectory()).catch(err => false); });
        const installationPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
        const modTypes = vortex_api_1.selectors.modPathsForGame(api.getState(), common_1.GAME_ID);
        return mods.reduce((accumP, mod) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            let modName;
            try {
                modName = yield findModFolder(installationPath, mod);
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'unable to resolve mod name', err);
            }
            if (!modName || ['collection', 'w3modlimitpatcher'].includes(mod.type)) {
                return Promise.resolve(accum);
            }
            const modPath = modTypes[mod.type];
            const modComponents = vortex_api_1.util.getSafe(mod, ['attributes', 'modComponents'], []);
            if (modComponents.length === 0) {
                modComponents.push(modName);
            }
            for (const component of modComponents) {
                const res = yield isDeployed(path_1.default.join(modPath, component));
                if (res) {
                    accum.push({ id: mod.id, name: component });
                }
            }
            return Promise.resolve(accum);
        }), Promise.resolve([]));
    });
}
exports.getManagedModNames = getManagedModNames;
function getAllMods(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const invalidModTypes = ['witcher3menumoddocuments', 'collection'];
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.id) === undefined) {
            return Promise.resolve({
                merged: [],
                manual: [],
                managed: [],
            });
        }
        const modState = vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profile.id, 'modState'], {});
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabledMods = Object.keys(modState).filter(key => (!!mods[key] && modState[key].enabled && !invalidModTypes.includes(mods[key].type)));
        const mergedModNames = yield (0, mergeInventoryParsing_1.getMergedModNames)(api);
        const manuallyAddedMods = yield getManuallyAddedMods(api);
        const managedMods = yield getManagedModNames(api, enabledMods.map(key => mods[key]));
        return Promise.resolve({
            merged: mergedModNames,
            manual: manuallyAddedMods.filter(mod => !mergedModNames.includes(mod)),
            managed: managedMods,
        });
    });
}
exports.getAllMods = getAllMods;
function getManuallyAddedMods(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Game is not discovered!'));
        }
        const ini = yield iniParser_1.default.getInstance().ensureModSettings();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modKeys = Object.keys(mods);
        const iniEntries = Object.keys(ini.data);
        const manualCandidates = [].concat(iniEntries).filter(entry => {
            const hasVortexKey = vortex_api_1.util.getSafe(ini.data[entry], ['VK'], undefined) !== undefined;
            return ((!hasVortexKey) || (ini.data[entry].VK === entry) && !modKeys.includes(entry));
        });
        const uniqueCandidates = new Set(new Set(manualCandidates));
        const modsPath = path_1.default.join(discovery.path, 'Mods');
        const candidates = Array.from(uniqueCandidates);
        const validCandidates = yield candidates.reduce((accumP, mod) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            const modFolder = path_1.default.join(modsPath, mod);
            const exists = vortex_api_1.fs.statAsync(path_1.default.join(modFolder)).then(() => true).catch(() => false);
            if (!exists) {
                return Promise.resolve(accum);
            }
            try {
                const entries = yield walkPath(modFolder, { skipHidden: true, skipLinks: true });
                if (entries.length > 0) {
                    const files = entries.filter(entry => !entry.isDirectory
                        && (path_1.default.extname(path_1.default.basename(entry.filePath)) !== '')
                        && ((entry === null || entry === void 0 ? void 0 : entry.linkCount) === undefined || entry.linkCount <= 1));
                    if (files.length > 0) {
                        accum.push(mod);
                    }
                }
            }
            catch (err) {
                if (!['ENOENT', 'ENOTFOUND'].some(err.code)) {
                    (0, vortex_api_1.log)('error', 'unable to walk path', err);
                }
                return Promise.resolve(accum);
            }
            return Promise.resolve(accum);
        }), Promise.resolve([]));
        return Promise.resolve(validCandidates);
    });
}
exports.getManuallyAddedMods = getManuallyAddedMods;
function isLockedEntry(modName) {
    if (!modName || typeof (modName) !== 'string') {
        (0, vortex_api_1.log)('debug', 'encountered invalid mod instance/name');
        return false;
    }
    return modName.startsWith(common_1.LOCKED_PREFIX);
}
exports.isLockedEntry = isLockedEntry;
function determineExecutable(discoveredPath) {
    if (discoveredPath !== undefined) {
        try {
            vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, 'bin', 'x64_DX12', 'witcher3.exe'));
            return 'bin/x64_DX12/witcher3.exe';
        }
        catch (err) {
        }
    }
    return 'bin/x64/witcher3.exe';
}
exports.determineExecutable = determineExecutable;
function forceRefresh(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const action = {
        type: 'SET_FB_FORCE_UPDATE',
        payload: {
            profileId,
        },
    };
    api.store.dispatch(action);
}
exports.forceRefresh = forceRefresh;
function walkPath(dirPath, walkOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        walkOptions = walkOptions || { skipLinks: true, skipHidden: true, skipInaccessible: true };
        walkOptions = Object.assign(Object.assign({}, walkOptions), { skipHidden: true, skipInaccessible: true, skipLinks: true });
        const walkResults = [];
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield (0, turbowalk_1.default)(dirPath, (entries) => {
                walkResults.push(...entries);
                return Promise.resolve();
            }, walkOptions).catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
            return resolve(walkResults);
        }));
    });
}
exports.walkPath = walkPath;
function validateProfile(profileId, state) {
    const activeProfile = vortex_api_1.selectors.activeProfile(state);
    const deployProfile = vortex_api_1.selectors.profileById(state, profileId);
    if (!!activeProfile && !!deployProfile && (deployProfile.id !== activeProfile.id)) {
        return undefined;
    }
    if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    return activeProfile;
}
exports.validateProfile = validateProfile;
;
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
exports.toBlue = toBlue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0RBQWdDO0FBQ2hDLDJDQUE2RDtBQUU3RCw0REFBdUM7QUFFdkMsZ0RBQXdCO0FBRXhCLG1FQUE0RDtBQUU1RCwwREFBNEQ7QUFFNUQscUNBQTZFO0FBRzdFLFNBQXNCLGFBQWEsQ0FBQyxHQUF3QixFQUMxRCxZQUF1Qjs7UUFDdkIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDbEMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFJLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7WUFDM0QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDaEQsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXZDLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7YUFDaEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxZQUFZLENB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LENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckQsTUFBTSxhQUFhLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlELElBQUksQ0FBQyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxhQUFhLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDakYsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxJQUFJLENBQUEsYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQ3JDLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQVpELDBDQVlDO0FBQUEsQ0FBQztBQUVGLFNBQWdCLE1BQU0sQ0FBSSxJQUFvQztJQUM1RCxPQUFPLENBQUMsR0FBRyxJQUFXLEVBQUUsRUFBRSxDQUFDLGtCQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUZELHdCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XHJcblxyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmltcG9ydCB7IGdldE1lcmdlZE1vZE5hbWVzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xyXG5cclxuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnksIElXYWxrT3B0aW9ucyB9IGZyb20gJ3R1cmJvd2Fsayc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBMT0NLRURfUFJFRklYLCBJMThOX05BTUVTUEFDRSwgVU5JX1BBVENIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJRGVwbG95ZWRGaWxlLCBJRGVwbG95bWVudCB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERlcGxveW1lbnQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gIGluY2x1ZGVkTW9kcz86IHN0cmluZ1tdKTogUHJvbWlzZTxJRGVwbG95bWVudD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICBpZiAoKGdhbWUgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgbG9nKCdlcnJvcicsICdnYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJywgR0FNRV9JRCk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgY29uc3QgaW5zdGFsbGF0aW9uRGlyZWN0b3JpZXMgPSBPYmplY3QudmFsdWVzKG1vZHMpXHJcbiAgICAuZmlsdGVyKG1vZCA9PiAoaW5jbHVkZWRNb2RzICE9PSB1bmRlZmluZWQpXHJcbiAgICAgID8gaW5jbHVkZWRNb2RzLmluY2x1ZGVzKG1vZC5pZClcclxuICAgICAgOiB0cnVlKVxyXG4gICAgLm1hcChtb2QgPT4gbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG5cclxuICBjb25zdCBmaWx0ZXJGdW5jID0gKGZpbGU6IElEZXBsb3llZEZpbGUpID0+IGluc3RhbGxhdGlvbkRpcmVjdG9yaWVzLmluY2x1ZGVzKGZpbGUuc291cmNlKTtcclxuXHJcbiAgY29uc3QgbW9kUGF0aHM6IHsgW3R5cGVJZDogc3RyaW5nXTogc3RyaW5nIH0gPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICBjb25zdCBtb2RUeXBlcyA9IE9iamVjdC5rZXlzKG1vZFBhdGhzKS5maWx0ZXIoa2V5ID0+ICEhbW9kUGF0aHNba2V5XSk7XHJcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBtb2RUeXBlcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kVHlwZSkgPT4ge1xyXG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBtYW5pZmVzdDogdHlwZXMuSURlcGxveW1lbnRNYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCBtb2RUeXBlLCBHQU1FX0lEKTtcclxuICAgICAgYWNjdW1bbW9kVHlwZV0gPSBtYW5pZmVzdC5maWxlcy5maWx0ZXIoZmlsdGVyRnVuYyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmlmZXN0JywgZXJyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIHJldHVybiBkZXBsb3ltZW50O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0RG9jdW1lbnRzUGF0aCA9IChnYW1lOiB0eXBlcy5JR2FtZSkgPT4ge1xyXG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ1RoZSBXaXRjaGVyIDMnKVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0RExDUGF0aCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0VExQYXRoID0gKChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IGlzVFczID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiAoZ2FtZUlkOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChnYW1lSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSkge1xyXG4gIGNvbnN0IG5vdGlmSWQgPSAnbWlzc2luZy1zY3JpcHQtbWVyZ2VyJztcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogbm90aWZJZCxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgMyBzY3JpcHQgbWVyZ2VyIGlzIG1pc3NpbmcvbWlzY29uZmlndXJlZCcsXHJcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgU2NyaXB0IE1lcmdlcicsIHtcclxuICAgICAgICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdWb3J0ZXggaXMgdW5hYmxlIHRvIHJlc29sdmUgdGhlIFNjcmlwdCBNZXJnZXJcXCdzIGxvY2F0aW9uLiBUaGUgdG9vbCBuZWVkcyB0byBiZSBkb3dubG9hZGVkIGFuZCBjb25maWd1cmVkIG1hbnVhbGx5LiAnXHJcbiAgICAgICAgICAgICAgKyAnW3VybD1odHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvVG9vbF9TZXR1cDpfV2l0Y2hlcl8zX1NjcmlwdF9NZXJnZXJdRmluZCBvdXQgbW9yZSBhYm91dCBob3cgdG8gY29uZmlndXJlIGl0IGFzIGEgdG9vbCBmb3IgdXNlIGluIFZvcnRleC5bL3VybF1bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICAgICAgICAgKyAnTm90ZTogV2hpbGUgc2NyaXB0IG1lcmdpbmcgd29ya3Mgd2VsbCB3aXRoIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHMsIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSBmb3IgYSBzYXRpc2Z5aW5nIG91dGNvbWUgaW4gZXZlcnkgc2luZ2xlIGNhc2UuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQgU2NyaXB0IE1lcmdlcicsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBudWxsKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICBpZiAoIWluc3RhbGxhdGlvblBhdGggfHwgIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xyXG4gICAgY29uc3QgZXJyTWVzc2FnZSA9ICFpbnN0YWxsYXRpb25QYXRoXHJcbiAgICAgID8gJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnXHJcbiAgICAgIDogJ0ZhaWxlZCB0byByZXNvbHZlIG1vZCBpbnN0YWxsYXRpb24gcGF0aCc7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGVyck1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uID0gWyd3aXRjaGVyM21lbnVtb2Ryb290JywgJ3dpdGNoZXIzdGwnXS5pbmNsdWRlcyhtb2QudHlwZSlcclxuICAgID8gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCAnTW9kcycpXHJcbiAgICA6IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhleHBlY3RlZE1vZE5hbWVMb2NhdGlvbik7XHJcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4oZXhwZWN0ZWRNb2ROYW1lTG9jYXRpb24sIGVudHJ5KSkuY2F0Y2goZXJyID0+IG51bGwpO1xyXG4gICAgaWYgKHN0YXRzPy5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZW50cnkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignRmFpbGVkIHRvIGZpbmQgbW9kIGZvbGRlcicpKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hbmFnZWRNb2ROYW1lcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZHM6IHR5cGVzLklNb2RbXSk6IFByb21pc2U8eyBuYW1lOiBzdHJpbmcsIGlkOiBzdHJpbmcgfVtdPiB7XHJcbiAgY29uc3QgaXNEZXBsb3llZCA9IGFzeW5jIChtb2RQYXRoOiBzdHJpbmcpID0+IGF3YWl0IGZzLnN0YXRBc3luYyhtb2RQYXRoKS50aGVuKHN0YXRzID0+IHN0YXRzLmlzRGlyZWN0b3J5KCkpLmNhdGNoKGVyciA9PiBmYWxzZSk7XHJcbiAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gIGNvbnN0IG1vZFR5cGVzOiB7IFt0eXBlSWQ6IHN0cmluZ106IHN0cmluZyB9ID0gc2VsZWN0b3JzLm1vZFBhdGhzRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgcmV0dXJuIG1vZHMucmVkdWNlKGFzeW5jIChhY2N1bVAsIG1vZCkgPT4ge1xyXG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICBsZXQgbW9kTmFtZTtcclxuICAgIHRyeSB7XHJcbiAgICAgIG1vZE5hbWUgPSBhd2FpdCBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGgsIG1vZCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gcmVzb2x2ZSBtb2QgbmFtZScsIGVycik7XHJcbiAgICB9XHJcbiAgICBpZiAoIW1vZE5hbWUgfHwgWydjb2xsZWN0aW9uJywgJ3czbW9kbGltaXRwYXRjaGVyJ10uaW5jbHVkZXMobW9kLnR5cGUpKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kUGF0aCA9IG1vZFR5cGVzW21vZC50eXBlXTtcclxuICAgIGNvbnN0IG1vZENvbXBvbmVudHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnbW9kQ29tcG9uZW50cyddLCBbXSk7XHJcbiAgICBpZiAobW9kQ29tcG9uZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgbW9kQ29tcG9uZW50cy5wdXNoKG1vZE5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIG1vZENvbXBvbmVudHMpIHtcclxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgaXNEZXBsb3llZChwYXRoLmpvaW4obW9kUGF0aCwgY29tcG9uZW50KSk7XHJcbiAgICAgIGlmIChyZXMpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKHsgaWQ6IG1vZC5pZCwgbmFtZTogY29tcG9uZW50IH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICB9LCBQcm9taXNlLnJlc29sdmUoW10pKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFsbE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgLy8gTW9kIHR5cGVzIHdlIGRvbid0IHdhbnQgdG8gZGlzcGxheSBpbiB0aGUgTE8gcGFnZVxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJywgJ2NvbGxlY3Rpb24nXTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBtZXJnZWQ6IFtdLFxyXG4gICAgICBtYW51YWw6IFtdLFxyXG4gICAgICBtYW5hZ2VkOiBbXSxcclxuICAgIH0pO1xyXG4gIH1cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcblxyXG4gIC8vIE9ubHkgc2VsZWN0IG1vZHMgd2hpY2ggYXJlIGVuYWJsZWQsIGFuZCBhcmUgbm90IGEgbWVudSBtb2QuXHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RTdGF0ZSkuZmlsdGVyKGtleSA9PlxyXG4gICAgKCEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSkpO1xyXG5cclxuICBjb25zdCBtZXJnZWRNb2ROYW1lcyA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWVzKGFwaSk7XHJcbiAgY29uc3QgbWFudWFsbHlBZGRlZE1vZHMgPSBhd2FpdCBnZXRNYW51YWxseUFkZGVkTW9kcyhhcGkpO1xyXG4gIGNvbnN0IG1hbmFnZWRNb2RzID0gYXdhaXQgZ2V0TWFuYWdlZE1vZE5hbWVzKGFwaSwgZW5hYmxlZE1vZHMubWFwKGtleSA9PiBtb2RzW2tleV0pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIG1lcmdlZDogbWVyZ2VkTW9kTmFtZXMsXHJcbiAgICBtYW51YWw6IG1hbnVhbGx5QWRkZWRNb2RzLmZpbHRlcihtb2QgPT4gIW1lcmdlZE1vZE5hbWVzLmluY2x1ZGVzKG1vZCkpLFxyXG4gICAgbWFuYWdlZDogbWFuYWdlZE1vZHMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNYW51YWxseUFkZGVkTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBIb3cvd2h5IGFyZSB3ZSBldmVuIGhlcmUgP1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCEnKSk7XHJcbiAgfVxyXG4gIGNvbnN0IGluaSA9IGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLmVuc3VyZU1vZFNldHRpbmdzKCk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICBjb25zdCBpbmlFbnRyaWVzID0gT2JqZWN0LmtleXMoaW5pLmRhdGEpO1xyXG4gIGNvbnN0IG1hbnVhbENhbmRpZGF0ZXMgPSBbXS5jb25jYXQoaW5pRW50cmllcykuZmlsdGVyKGVudHJ5ID0+IHtcclxuICAgIGNvbnN0IGhhc1ZvcnRleEtleSA9IHV0aWwuZ2V0U2FmZShpbmkuZGF0YVtlbnRyeV0sIFsnVksnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuICgoIWhhc1ZvcnRleEtleSkgfHwgKGluaS5kYXRhW2VudHJ5XS5WSyA9PT0gZW50cnkpICYmICFtb2RLZXlzLmluY2x1ZGVzKGVudHJ5KSk7XHJcbiAgfSk7XHJcbiAgY29uc3QgdW5pcXVlQ2FuZGlkYXRlcyA9IG5ldyBTZXQobmV3IFNldChtYW51YWxDYW5kaWRhdGVzKSk7XHJcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyk7XHJcbiAgY29uc3QgY2FuZGlkYXRlcyA9IEFycmF5LmZyb20odW5pcXVlQ2FuZGlkYXRlcyk7XHJcbiAgY29uc3QgdmFsaWRDYW5kaWRhdGVzID0gYXdhaXQgY2FuZGlkYXRlcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kKSA9PiB7XHJcbiAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcclxuICAgIGNvbnN0IG1vZEZvbGRlciA9IHBhdGguam9pbihtb2RzUGF0aCwgbW9kKTtcclxuICAgIGNvbnN0IGV4aXN0cyA9IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kRm9sZGVyKSkudGhlbigoKSA9PiB0cnVlKS5jYXRjaCgoKSA9PiBmYWxzZSk7XHJcbiAgICBpZiAoIWV4aXN0cykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPaywgd2Uga25vdyB0aGUgZm9sZGVyIGlzIHRoZXJlIC0gbGV0cyBlbnN1cmUgdGhhdFxyXG4gICAgLy8gIGl0IGFjdHVhbGx5IGNvbnRhaW5zIGZpbGVzLlxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHdhbGtQYXRoKG1vZEZvbGRlciwgeyBza2lwSGlkZGVuOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSk7XHJcbiAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjb25zdCBmaWxlcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeVxyXG4gICAgICAgICAgJiYgKHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSkgIT09ICcnKVxyXG4gICAgICAgICAgJiYgKGVudHJ5Py5saW5rQ291bnQgPT09IHVuZGVmaW5lZCB8fCBlbnRyeS5saW5rQ291bnQgPD0gMSkpO1xyXG4gICAgICAgIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBhY2N1bS5wdXNoKG1vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKCFbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5zb21lKGVyci5jb2RlKSkge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHdhbGsgcGF0aCcsIGVycik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICB9LCBQcm9taXNlLnJlc29sdmUoW10pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbGlkQ2FuZGlkYXRlcyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0xvY2tlZEVudHJ5KG1vZE5hbWU6IHN0cmluZykge1xyXG4gIC8vIFdlJ3JlIGFkZGluZyB0aGlzIHRvIGF2b2lkIGhhdmluZyB0aGUgbG9hZCBvcmRlciBwYWdlXHJcbiAgLy8gIGZyb20gbm90IGxvYWRpbmcgaWYgd2UgZW5jb3VudGVyIGFuIGludmFsaWQgbW9kIG5hbWUuXHJcbiAgaWYgKCFtb2ROYW1lIHx8IHR5cGVvZiAobW9kTmFtZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICBsb2coJ2RlYnVnJywgJ2VuY291bnRlcmVkIGludmFsaWQgbW9kIGluc3RhbmNlL25hbWUnKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcmV0dXJuIG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRldGVybWluZUV4ZWN1dGFibGUoZGlzY292ZXJlZFBhdGg6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgaWYgKGRpc2NvdmVyZWRQYXRoICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGZzLnN0YXRTeW5jKHBhdGguam9pbihkaXNjb3ZlcmVkUGF0aCwgJ2JpbicsICd4NjRfRFgxMicsICd3aXRjaGVyMy5leGUnKSk7XHJcbiAgICAgIHJldHVybiAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZSc7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8gbm9wLCB1c2UgZmFsbGJhY2tcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICdiaW4veDY0L3dpdGNoZXIzLmV4ZSc7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVJlZnJlc2goYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBhY3Rpb24gPSB7XHJcbiAgICB0eXBlOiAnU0VUX0ZCX0ZPUkNFX1VQREFURScsXHJcbiAgICBwYXlsb2FkOiB7XHJcbiAgICAgIHByb2ZpbGVJZCxcclxuICAgIH0sXHJcbiAgfTtcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9uKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtQYXRoKGRpclBhdGg6IHN0cmluZywgd2Fsa09wdGlvbnM/OiBJV2Fsa09wdGlvbnMpOiBQcm9taXNlPElFbnRyeVtdPiB7XHJcbiAgd2Fsa09wdGlvbnMgPSB3YWxrT3B0aW9ucyB8fCB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9O1xyXG4gIC8vIFdlIFJFQUxMWSBkb24ndCBjYXJlIGZvciBoaWRkZW4gb3IgaW5hY2Nlc3NpYmxlIGZpbGVzLlxyXG4gIHdhbGtPcHRpb25zID0geyAuLi53YWxrT3B0aW9ucywgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH07XHJcbiAgY29uc3Qgd2Fsa1Jlc3VsdHM6IElFbnRyeVtdID0gW107XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElFbnRyeVtdPihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBhd2FpdCB0dXJib3dhbGsoZGlyUGF0aCwgKGVudHJpZXM6IElFbnRyeVtdKSA9PiB7XHJcbiAgICAgIHdhbGtSZXN1bHRzLnB1c2goLi4uZW50cmllcyk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKSBhcyBhbnk7XHJcbiAgICAgIC8vIElmIHRoZSBkaXJlY3RvcnkgaXMgbWlzc2luZyB3aGVuIHdlIHRyeSB0byB3YWxrIGl0OyBpdCdzIG1vc3QgcHJvYmFibHkgZG93biB0byBhIGNvbGxlY3Rpb24gYmVpbmdcclxuICAgICAgLy8gIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGluc3RhbGxlZC9yZW1vdmVkLiBXZSBjYW4gc2FmZWx5IGlnbm9yZSB0aGlzLlxyXG4gICAgfSwgd2Fsa09wdGlvbnMpLmNhdGNoKGVyciA9PiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgcmV0dXJuIHJlc29sdmUod2Fsa1Jlc3VsdHMpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZDogc3RyaW5nLCBzdGF0ZTogdHlwZXMuSVN0YXRlKSB7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmICghIWFjdGl2ZVByb2ZpbGUgJiYgISFkZXBsb3lQcm9maWxlICYmIChkZXBsb3lQcm9maWxlLmlkICE9PSBhY3RpdmVQcm9maWxlLmlkKSkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYWN0aXZlUHJvZmlsZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG4iXX0=