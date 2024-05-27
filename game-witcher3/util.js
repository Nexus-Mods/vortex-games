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
exports.toBlue = exports.suppressEventHandlers = exports.validateProfile = exports.walkPath = exports.forceRefresh = exports.determineExecutable = exports.isLockedEntry = exports.getManuallyAddedMods = exports.getAllMods = exports.getManagedModNames = exports.findModFolders = exports.notifyMissingScriptMerger = exports.isTW3 = exports.getTLPath = exports.getDLCPath = exports.getDocumentsPath = exports.getDeployment = void 0;
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
function findModFolders(installationPath, mod) {
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
        const validEntries = [];
        for (const entry of entries) {
            const stats = yield vortex_api_1.fs.statAsync(path_1.default.join(expectedModNameLocation, entry)).catch(err => null);
            if (stats === null || stats === void 0 ? void 0 : stats.isDirectory()) {
                validEntries.push(entry);
            }
        }
        return (validEntries.length > 0)
            ? Promise.resolve(validEntries)
            : Promise.reject(new Error('Failed to find mod folder'));
    });
}
exports.findModFolders = findModFolders;
function getManagedModNames(api, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const installationPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
        return mods.reduce((accumP, mod) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            let folderNames = [];
            try {
                if (!folderNames || ['collection', 'w3modlimitpatcher'].includes(mod.type)) {
                    return Promise.resolve(accum);
                }
                folderNames = yield findModFolders(installationPath, mod);
                for (const component of folderNames) {
                    accum.push({ id: mod.id, name: component });
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'unable to resolve mod name', err);
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
        let ini;
        try {
            ini = yield iniParser_1.default.getInstance().ensureModSettings();
        }
        catch (err) {
            api.showErrorNotification('Failed to load INI structure', err, { allowReport: false });
            return Promise.resolve([]);
        }
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
function suppressEventHandlers(api) {
    const state = api.getState();
    return (state.session.notifications.notifications.some(n => n.id === common_1.ACTIVITY_ID_IMPORTING_LOADORDER));
}
exports.suppressEventHandlers = suppressEventHandlers;
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
exports.toBlue = toBlue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0RBQWdDO0FBQ2hDLDJDQUE2RDtBQUU3RCw0REFBdUM7QUFFdkMsZ0RBQXdCO0FBRXhCLG1FQUE0RDtBQUU1RCwwREFBNEQ7QUFFNUQscUNBQThHO0FBRzlHLFNBQXNCLGFBQWEsQ0FBQyxHQUF3QixFQUMxRCxZQUF1Qjs7UUFDdkIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDbEMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFJLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7WUFDM0QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDaEQsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXZDLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7YUFDaEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQzthQUNSLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXBDLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBbUIsRUFBRSxFQUFFLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUxRixNQUFNLFFBQVEsR0FBaUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEYsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxVQUFVLEdBQWdCLE1BQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFPLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUM5RSxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQztZQUMzQixJQUFJO2dCQUNGLE1BQU0sUUFBUSxHQUE4QixNQUFNLGlCQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO2dCQUMxRixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDcEQ7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQzdDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVQLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7Q0FBQTtBQXBDRCxzQ0FvQ0M7QUFFTSxNQUFNLGdCQUFnQixHQUFHLENBQUMsSUFBaUIsRUFBRSxFQUFFO0lBQ3BELE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQTtBQUNwRSxDQUFDLENBQUE7QUFGWSxRQUFBLGdCQUFnQixvQkFFNUI7QUFFTSxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQXdCLEVBQUUsRUFBRTtJQUNyRCxPQUFPLENBQUMsSUFBaUIsRUFBRSxFQUFFO1FBQzNCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5RCxPQUFPLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMxQyxDQUFDLENBQUE7QUFDSCxDQUFDLENBQUM7QUFOVyxRQUFBLFVBQVUsY0FNckI7QUFFVyxRQUFBLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQ3JELE9BQU8sQ0FBQyxJQUFpQixFQUFFLEVBQUU7UUFDM0IsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlELE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQztJQUN4QixDQUFDLENBQUE7QUFDSCxDQUFDLENBQUMsQ0FBQztBQUVJLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQ2hELE9BQU8sQ0FBQyxNQUFjLEVBQUUsRUFBRTtRQUN4QixJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDeEIsT0FBTyxDQUFDLE1BQU0sS0FBSyxnQkFBTyxDQUFDLENBQUM7U0FDN0I7UUFDRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxRQUFRLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsT0FBTyxDQUFDLFFBQVEsS0FBSyxnQkFBTyxDQUFDLENBQUM7SUFDaEMsQ0FBQyxDQUFBO0FBQ0gsQ0FBQyxDQUFDO0FBVFcsUUFBQSxLQUFLLFNBU2hCO0FBRUYsU0FBZ0IseUJBQXlCLENBQUMsR0FBRztJQUMzQyxNQUFNLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQztJQUN4QyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7UUFDbkIsRUFBRSxFQUFFLE9BQU87UUFDWCxJQUFJLEVBQUUsTUFBTTtRQUNaLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGtEQUFrRCxFQUN2RSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUM7UUFDekIsYUFBYSxFQUFFLElBQUk7UUFDbkIsT0FBTyxFQUFFO1lBQ1A7Z0JBQ0UsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsTUFBTSxFQUFFLEdBQUcsRUFBRTtvQkFDWCxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSx5QkFBeUIsRUFBRTt3QkFDaEQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsc0hBQXNIOzhCQUN4SSw0S0FBNEs7OEJBQzVLLDRJQUE0SSxFQUFFLEVBQUUsRUFBRSxFQUFFLHVCQUFjLEVBQUUsQ0FBQztxQkFDMUssRUFBRTt3QkFDRDs0QkFDRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7Z0NBQzVCLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDOzRCQUNuRCxDQUFDO3lCQUNGO3dCQUNEOzRCQUNFLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsaUJBQUksQ0FBQyxHQUFHLENBQUMsNkNBQTZDLENBQUM7aUNBQ25HLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztpQ0FDbEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO3lCQUNoRTtxQkFDRixDQUFDLENBQUM7Z0JBQ0wsQ0FBQzthQUNGO1NBQ0Y7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBaENELDhEQWdDQztBQUVELFNBQXNCLGNBQWMsQ0FBQyxnQkFBd0IsRUFBRSxHQUFlOztRQUM1RSxJQUFJLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxnQkFBZ0IsQ0FBQSxFQUFFO1lBQy9DLE1BQU0sVUFBVSxHQUFHLENBQUMsZ0JBQWdCO2dCQUNsQyxDQUFDLENBQUMsd0JBQXdCO2dCQUMxQixDQUFDLENBQUMseUNBQXlDLENBQUM7WUFDOUMsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDOUM7UUFFRCxNQUFNLHVCQUF1QixHQUFHLENBQUMscUJBQXFCLEVBQUUsWUFBWSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDdEYsQ0FBQyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQztZQUMzRCxDQUFDLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN0RCxNQUFNLE9BQU8sR0FBRyxNQUFNLGVBQUUsQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUMvRCxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDeEIsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLEVBQUU7WUFDM0IsTUFBTSxLQUFLLEdBQUcsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvRixJQUFJLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxXQUFXLEVBQUUsRUFBRTtnQkFDeEIsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMxQjtTQUNGO1FBRUQsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztZQUMvQixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7SUFDN0QsQ0FBQztDQUFBO0FBdkJELHdDQXVCQztBQUVELFNBQXNCLGtCQUFrQixDQUFDLEdBQXdCLEVBQUUsSUFBa0I7O1FBQ25GLE1BQU0sZ0JBQWdCLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQy9FLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFPLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUN2QyxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQztZQUMzQixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDckIsSUFBSTtnQkFDRixJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsWUFBWSxFQUFFLG1CQUFtQixDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDMUUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUMvQjtnQkFDRCxXQUFXLEdBQUcsTUFBTSxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzFELEtBQUssTUFBTSxTQUFTLElBQUksV0FBVyxFQUFFO29CQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7aUJBQzdDO2FBQ0Y7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQ2pEO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxQixDQUFDO0NBQUE7QUFsQkQsZ0RBa0JDO0FBRUQsU0FBc0IsVUFBVSxDQUFDLEdBQXdCOztRQUV2RCxNQUFNLGVBQWUsR0FBRyxDQUFDLDBCQUEwQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ25FLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLEVBQUUsTUFBSyxTQUFTLEVBQUU7WUFDN0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNyQixNQUFNLEVBQUUsRUFBRTtnQkFDVixNQUFNLEVBQUUsRUFBRTtnQkFDVixPQUFPLEVBQUUsRUFBRTthQUNaLENBQUMsQ0FBQztTQUNKO1FBQ0QsTUFBTSxRQUFRLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBR3RFLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ3JELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZGLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBQSx5Q0FBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ3JCLE1BQU0sRUFBRSxjQUFjO1lBQ3RCLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEUsT0FBTyxFQUFFLFdBQVc7U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBM0JELGdDQTJCQztBQUVELFNBQXNCLG9CQUFvQixDQUFDLEdBQXdCOztRQUNqRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2xHLElBQUksQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsRUFBRTtZQUVqQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7U0FDNUU7UUFDRCxJQUFJLEdBQUcsQ0FBQztRQUNSLElBQUk7WUFDRixHQUFHLEdBQUcsTUFBTSxtQkFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUM7U0FDNUQ7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUN2RixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFFRCxNQUFNLElBQUksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDNUQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztZQUNwRixPQUFPLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sZUFBZSxHQUFHLE1BQU0sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFPLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNwRSxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQztZQUMzQixNQUFNLFNBQVMsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzQyxNQUFNLE1BQU0sR0FBRyxlQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RGLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ1gsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQy9CO1lBSUQsSUFBSTtnQkFDRixNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRixJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUN0QixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVzsyQkFDbkQsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDOzJCQUNwRCxDQUFDLENBQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLFNBQVMsTUFBSyxTQUFTLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO3dCQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUNqQjtpQkFDRjthQUNGO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzNDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQzFDO2dCQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMvQjtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUEsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FBQTtBQXRERCxvREFzREM7QUFFRCxTQUFnQixhQUFhLENBQUMsT0FBZTtJQUczQyxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDN0MsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO1FBQ3RELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsc0JBQWEsQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFSRCxzQ0FRQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLGNBQXNCO0lBQ3hELElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtRQUNoQyxJQUFJO1lBQ0YsZUFBRSxDQUFDLFFBQVEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDMUUsT0FBTywyQkFBMkIsQ0FBQztTQUNwQztRQUFDLE9BQU8sR0FBRyxFQUFFO1NBRWI7S0FDRjtJQUNELE9BQU8sc0JBQXNCLENBQUM7QUFDaEMsQ0FBQztBQVZELGtEQVVDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLEdBQXdCO0lBQ25ELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7SUFDckUsTUFBTSxNQUFNLEdBQUc7UUFDYixJQUFJLEVBQUUscUJBQXFCO1FBQzNCLE9BQU8sRUFBRTtZQUNQLFNBQVM7U0FDVjtLQUNGLENBQUM7SUFDRixHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBVkQsb0NBVUM7QUFFRCxTQUFzQixRQUFRLENBQUMsT0FBZSxFQUFFLFdBQTBCOztRQUN4RSxXQUFXLEdBQUcsV0FBVyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxDQUFDO1FBRTNGLFdBQVcsbUNBQVEsV0FBVyxLQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEdBQUUsQ0FBQztRQUM1RixNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7UUFDakMsT0FBTyxJQUFJLE9BQU8sQ0FBVyxDQUFPLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyRCxNQUFNLElBQUEsbUJBQVMsRUFBQyxPQUFPLEVBQUUsQ0FBQyxPQUFpQixFQUFFLEVBQUU7Z0JBQzdDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztnQkFDN0IsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFTLENBQUM7WUFHbEMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5RixPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBZEQsNEJBY0M7QUFFRCxTQUFnQixlQUFlLENBQUMsU0FBaUIsRUFBRSxLQUFtQjtJQUNwRSxNQUFNLGFBQWEsR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyRCxNQUFNLGFBQWEsR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDOUQsSUFBSSxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxhQUFhLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxLQUFLLGFBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUNqRixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELElBQUksQ0FBQSxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7UUFDckMsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBWkQsMENBWUM7QUFBQSxDQUFDO0FBRUYsU0FBZ0IscUJBQXFCLENBQUMsR0FBd0I7SUFFNUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyx3Q0FBK0IsQ0FBQyxDQUFDLENBQUM7QUFDekcsQ0FBQztBQUpELHNEQUlDO0FBRUQsU0FBZ0IsTUFBTSxDQUFJLElBQW9DO0lBQzVELE9BQU8sQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsd0JBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZXMgfSBmcm9tICcuL21lcmdlSW52ZW50b3J5UGFyc2luZyc7XHJcblxyXG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSwgSVdhbGtPcHRpb25zIH0gZnJvbSAndHVyYm93YWxrJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIExPQ0tFRF9QUkVGSVgsIEkxOE5fTkFNRVNQQUNFLCBVTklfUEFUQ0gsIEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElEZXBsb3llZEZpbGUsIElEZXBsb3ltZW50IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95bWVudChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgaW5jbHVkZWRNb2RzPzogc3RyaW5nW10pOiBQcm9taXNlPElEZXBsb3ltZW50PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xyXG4gIGlmICgoZ2FtZSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2dhbWUgaXMgbm90IGRpc2NvdmVyZWQnLCBHQU1FX0lEKTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG5cclxuICBjb25zdCBpbnN0YWxsYXRpb25EaXJlY3RvcmllcyA9IE9iamVjdC52YWx1ZXMobW9kcylcclxuICAgIC5maWx0ZXIobW9kID0+IChpbmNsdWRlZE1vZHMgIT09IHVuZGVmaW5lZClcclxuICAgICAgPyBpbmNsdWRlZE1vZHMuaW5jbHVkZXMobW9kLmlkKVxyXG4gICAgICA6IHRydWUpXHJcbiAgICAubWFwKG1vZCA9PiBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcblxyXG4gIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZTogSURlcGxveWVkRmlsZSkgPT4gaW5zdGFsbGF0aW9uRGlyZWN0b3JpZXMuaW5jbHVkZXMoZmlsZS5zb3VyY2UpO1xyXG5cclxuICBjb25zdCBtb2RQYXRoczogeyBbdHlwZUlkOiBzdHJpbmddOiBzdHJpbmcgfSA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gIGNvbnN0IG1vZFR5cGVzID0gT2JqZWN0LmtleXMobW9kUGF0aHMpLmZpbHRlcihrZXkgPT4gISFtb2RQYXRoc1trZXldKTtcclxuICBjb25zdCBkZXBsb3ltZW50OiBJRGVwbG95bWVudCA9IGF3YWl0IG1vZFR5cGVzLnJlZHVjZShhc3luYyAoYWNjdW1QLCBtb2RUeXBlKSA9PiB7XHJcbiAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiB0eXBlcy5JRGVwbG95bWVudE1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksIG1vZFR5cGUsIEdBTUVfSUQpO1xyXG4gICAgICBhY2N1bVttb2RUeXBlXSA9IG1hbmlmZXN0LmZpbGVzLmZpbHRlcihmaWx0ZXJGdW5jKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBnZXQgbWFuaWZlc3QnLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIGRlcGxveW1lbnQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBnZXREb2N1bWVudHNQYXRoID0gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnVGhlIFdpdGNoZXIgMycpXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBnZXRETENQYXRoID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0RMQycpO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBnZXRUTFBhdGggPSAoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgaXNUVzMgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIChnYW1lSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgaWYgKGdhbWVJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3Qgbm90aWZJZCA9ICdtaXNzaW5nLXNjcmlwdC1tZXJnZXInO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiBub3RpZklkLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnV2l0Y2hlciAzIHNjcmlwdCBtZXJnZXIgaXMgbWlzc2luZy9taXNjb25maWd1cmVkJyxcclxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgYWN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyJywge1xyXG4gICAgICAgICAgICBiYmNvZGU6IGFwaS50cmFuc2xhdGUoJ1ZvcnRleCBpcyB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgU2NyaXB0IE1lcmdlclxcJ3MgbG9jYXRpb24uIFRoZSB0b29sIG5lZWRzIHRvIGJlIGRvd25sb2FkZWQgYW5kIGNvbmZpZ3VyZWQgbWFudWFsbHkuICdcclxuICAgICAgICAgICAgICArICdbdXJsPWh0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Ub29sX1NldHVwOl9XaXRjaGVyXzNfU2NyaXB0X01lcmdlcl1GaW5kIG91dCBtb3JlIGFib3V0IGhvdyB0byBjb25maWd1cmUgaXQgYXMgYSB0b29sIGZvciB1c2UgaW4gVm9ydGV4LlsvdXJsXVticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgICAgICAgICArICdOb3RlOiBXaGlsZSBzY3JpcHQgbWVyZ2luZyB3b3JrcyB3ZWxsIHdpdGggdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kcywgdGhlcmUgaXMgbm8gZ3VhcmFudGVlIGZvciBhIHNhdGlzZnlpbmcgb3V0Y29tZSBpbiBldmVyeSBzaW5nbGUgY2FzZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCBTY3JpcHQgTWVyZ2VyJywgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS93aXRjaGVyMy9tb2RzLzQ4NCcpXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXHJcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJykpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbmRNb2RGb2xkZXJzKGluc3RhbGxhdGlvblBhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGlmICghaW5zdGFsbGF0aW9uUGF0aCB8fCAhbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XHJcbiAgICBjb25zdCBlcnJNZXNzYWdlID0gIWluc3RhbGxhdGlvblBhdGhcclxuICAgICAgPyAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCdcclxuICAgICAgOiAnRmFpbGVkIHRvIHJlc29sdmUgbW9kIGluc3RhbGxhdGlvbiBwYXRoJztcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoZXJyTWVzc2FnZSkpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZXhwZWN0ZWRNb2ROYW1lTG9jYXRpb24gPSBbJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAnd2l0Y2hlcjN0bCddLmluY2x1ZGVzKG1vZC50eXBlKVxyXG4gICAgPyBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgsICdNb2RzJylcclxuICAgIDogcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpckFzeW5jKGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uKTtcclxuICBjb25zdCB2YWxpZEVudHJpZXMgPSBbXTtcclxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihleHBlY3RlZE1vZE5hbWVMb2NhdGlvbiwgZW50cnkpKS5jYXRjaChlcnIgPT4gbnVsbCk7XHJcbiAgICBpZiAoc3RhdHM/LmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgdmFsaWRFbnRyaWVzLnB1c2goZW50cnkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuICh2YWxpZEVudHJpZXMubGVuZ3RoID4gMClcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHZhbGlkRW50cmllcylcclxuICAgIDogUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdGYWlsZWQgdG8gZmluZCBtb2QgZm9sZGVyJykpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWFuYWdlZE1vZE5hbWVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kczogdHlwZXMuSU1vZFtdKTogUHJvbWlzZTx7IG5hbWU6IHN0cmluZywgaWQ6IHN0cmluZyB9W10+IHtcclxuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgcmV0dXJuIG1vZHMucmVkdWNlKGFzeW5jIChhY2N1bVAsIG1vZCkgPT4ge1xyXG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICBsZXQgZm9sZGVyTmFtZXMgPSBbXTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGlmICghZm9sZGVyTmFtZXMgfHwgWydjb2xsZWN0aW9uJywgJ3czbW9kbGltaXRwYXRjaGVyJ10uaW5jbHVkZXMobW9kLnR5cGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICAgIH1cclxuICAgICAgZm9sZGVyTmFtZXMgPSBhd2FpdCBmaW5kTW9kRm9sZGVycyhpbnN0YWxsYXRpb25QYXRoLCBtb2QpO1xyXG4gICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBmb2xkZXJOYW1lcykge1xyXG4gICAgICAgIGFjY3VtLnB1c2goeyBpZDogbW9kLmlkLCBuYW1lOiBjb21wb25lbnQgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byByZXNvbHZlIG1vZCBuYW1lJywgZXJyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIFByb21pc2UucmVzb2x2ZShbXSkpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyBNb2QgdHlwZXMgd2UgZG9uJ3Qgd2FudCB0byBkaXNwbGF5IGluIHRoZSBMTyBwYWdlXHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCAnY29sbGVjdGlvbiddO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAocHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIG1lcmdlZDogW10sXHJcbiAgICAgIG1hbnVhbDogW10sXHJcbiAgICAgIG1hbmFnZWQ6IFtdLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBwcm9maWxlLmlkLCAnbW9kU3RhdGUnXSwge30pO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgLy8gT25seSBzZWxlY3QgbW9kcyB3aGljaCBhcmUgZW5hYmxlZCwgYW5kIGFyZSBub3QgYSBtZW51IG1vZC5cclxuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZFN0YXRlKS5maWx0ZXIoa2V5ID0+XHJcbiAgICAoISFtb2RzW2tleV0gJiYgbW9kU3RhdGVba2V5XS5lbmFibGVkICYmICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kc1trZXldLnR5cGUpKSk7XHJcblxyXG4gIGNvbnN0IG1lcmdlZE1vZE5hbWVzID0gYXdhaXQgZ2V0TWVyZ2VkTW9kTmFtZXMoYXBpKTtcclxuICBjb25zdCBtYW51YWxseUFkZGVkTW9kcyA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKGFwaSk7XHJcbiAgY29uc3QgbWFuYWdlZE1vZHMgPSBhd2FpdCBnZXRNYW5hZ2VkTW9kTmFtZXMoYXBpLCBlbmFibGVkTW9kcy5tYXAoa2V5ID0+IG1vZHNba2V5XSkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgbWVyZ2VkOiBtZXJnZWRNb2ROYW1lcyxcclxuICAgIG1hbnVhbDogbWFudWFsbHlBZGRlZE1vZHMuZmlsdGVyKG1vZCA9PiAhbWVyZ2VkTW9kTmFtZXMuaW5jbHVkZXMobW9kKSksXHJcbiAgICBtYW5hZ2VkOiBtYW5hZ2VkTW9kcyxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hbnVhbGx5QWRkZWRNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIEhvdy93aHkgYXJlIHdlIGV2ZW4gaGVyZSA/XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkIScpKTtcclxuICB9XHJcbiAgbGV0IGluaTtcclxuICB0cnkge1xyXG4gICAgaW5pID0gYXdhaXQgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkuZW5zdXJlTW9kU2V0dGluZ3MoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBsb2FkIElOSSBzdHJ1Y3R1cmUnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gIGNvbnN0IGluaUVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSk7XHJcbiAgY29uc3QgbWFudWFsQ2FuZGlkYXRlcyA9IFtdLmNvbmNhdChpbmlFbnRyaWVzKS5maWx0ZXIoZW50cnkgPT4ge1xyXG4gICAgY29uc3QgaGFzVm9ydGV4S2V5ID0gdXRpbC5nZXRTYWZlKGluaS5kYXRhW2VudHJ5XSwgWydWSyddLCB1bmRlZmluZWQpICE9PSB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gKCghaGFzVm9ydGV4S2V5KSB8fCAoaW5pLmRhdGFbZW50cnldLlZLID09PSBlbnRyeSkgJiYgIW1vZEtleXMuaW5jbHVkZXMoZW50cnkpKTtcclxuICB9KTtcclxuICBjb25zdCB1bmlxdWVDYW5kaWRhdGVzID0gbmV3IFNldChuZXcgU2V0KG1hbnVhbENhbmRpZGF0ZXMpKTtcclxuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICBjb25zdCBjYW5kaWRhdGVzID0gQXJyYXkuZnJvbSh1bmlxdWVDYW5kaWRhdGVzKTtcclxuICBjb25zdCB2YWxpZENhbmRpZGF0ZXMgPSBhd2FpdCBjYW5kaWRhdGVzLnJlZHVjZShhc3luYyAoYWNjdW1QLCBtb2QpID0+IHtcclxuICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xyXG4gICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpO1xyXG4gICAgY29uc3QgZXhpc3RzID0gZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RGb2xkZXIpKS50aGVuKCgpID0+IHRydWUpLmNhdGNoKCgpID0+IGZhbHNlKTtcclxuICAgIGlmICghZXhpc3RzKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE9rLCB3ZSBrbm93IHRoZSBmb2xkZXIgaXMgdGhlcmUgLSBsZXRzIGVuc3VyZSB0aGF0XHJcbiAgICAvLyAgaXQgYWN0dWFsbHkgY29udGFpbnMgZmlsZXMuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgd2Fsa1BhdGgobW9kRm9sZGVyLCB7IHNraXBIaWRkZW46IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KTtcclxuICAgICAgaWYgKGVudHJpZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IGZpbGVzID0gZW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWVudHJ5LmlzRGlyZWN0b3J5XHJcbiAgICAgICAgICAmJiAocGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKSAhPT0gJycpXHJcbiAgICAgICAgICAmJiAoZW50cnk/LmxpbmtDb3VudCA9PT0gdW5kZWZpbmVkIHx8IGVudHJ5LmxpbmtDb3VudCA8PSAxKSk7XHJcbiAgICAgICAgaWYgKGZpbGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGFjY3VtLnB1c2gobW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBpZiAoIVsnRU5PRU5UJywgJ0VOT1RGT1VORCddLnNvbWUoZXJyLmNvZGUpKSB7XHJcbiAgICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gd2FsayBwYXRoJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIFByb21pc2UucmVzb2x2ZShbXSkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsaWRDYW5kaWRhdGVzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTG9ja2VkRW50cnkobW9kTmFtZTogc3RyaW5nKSB7XHJcbiAgLy8gV2UncmUgYWRkaW5nIHRoaXMgdG8gYXZvaWQgaGF2aW5nIHRoZSBsb2FkIG9yZGVyIHBhZ2VcclxuICAvLyAgZnJvbSBub3QgbG9hZGluZyBpZiB3ZSBlbmNvdW50ZXIgYW4gaW52YWxpZCBtb2QgbmFtZS5cclxuICBpZiAoIW1vZE5hbWUgfHwgdHlwZW9mIChtb2ROYW1lKSAhPT0gJ3N0cmluZycpIHtcclxuICAgIGxvZygnZGVidWcnLCAnZW5jb3VudGVyZWQgaW52YWxpZCBtb2QgaW5zdGFuY2UvbmFtZScpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICByZXR1cm4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGV0ZXJtaW5lRXhlY3V0YWJsZShkaXNjb3ZlcmVkUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcclxuICBpZiAoZGlzY292ZXJlZFBhdGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCAnYmluJywgJ3g2NF9EWDEyJywgJ3dpdGNoZXIzLmV4ZScpKTtcclxuICAgICAgcmV0dXJuICdiaW4veDY0X0RYMTIvd2l0Y2hlcjMuZXhlJztcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBub3AsIHVzZSBmYWxsYmFja1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGFjdGlvbiA9IHtcclxuICAgIHR5cGU6ICdTRVRfRkJfRk9SQ0VfVVBEQVRFJyxcclxuICAgIHBheWxvYWQ6IHtcclxuICAgICAgcHJvZmlsZUlkLFxyXG4gICAgfSxcclxuICB9O1xyXG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb24pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa1BhdGgoZGlyUGF0aDogc3RyaW5nLCB3YWxrT3B0aW9ucz86IElXYWxrT3B0aW9ucyk6IFByb21pc2U8SUVudHJ5W10+IHtcclxuICB3YWxrT3B0aW9ucyA9IHdhbGtPcHRpb25zIHx8IHsgc2tpcExpbmtzOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH07XHJcbiAgLy8gV2UgUkVBTExZIGRvbid0IGNhcmUgZm9yIGhpZGRlbiBvciBpbmFjY2Vzc2libGUgZmlsZXMuXHJcbiAgd2Fsa09wdGlvbnMgPSB7IC4uLndhbGtPcHRpb25zLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfTtcclxuICBjb25zdCB3YWxrUmVzdWx0czogSUVudHJ5W10gPSBbXTtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SUVudHJ5W10+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcclxuICAgICAgd2Fsa1Jlc3VsdHMucHVzaCguLi5lbnRyaWVzKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpIGFzIGFueTtcclxuICAgICAgLy8gSWYgdGhlIGRpcmVjdG9yeSBpcyBtaXNzaW5nIHdoZW4gd2UgdHJ5IHRvIHdhbGsgaXQ7IGl0J3MgbW9zdCBwcm9iYWJseSBkb3duIHRvIGEgY29sbGVjdGlvbiBiZWluZ1xyXG4gICAgICAvLyAgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgaW5zdGFsbGVkL3JlbW92ZWQuIFdlIGNhbiBzYWZlbHkgaWdub3JlIHRoaXMuXHJcbiAgICB9LCB3YWxrT3B0aW9ucykuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICByZXR1cm4gcmVzb2x2ZSh3YWxrUmVzdWx0cyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkOiBzdHJpbmcsIHN0YXRlOiB0eXBlcy5JU3RhdGUpIHtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKCEhYWN0aXZlUHJvZmlsZSAmJiAhIWRlcGxveVByb2ZpbGUgJiYgKGRlcGxveVByb2ZpbGUuaWQgIT09IGFjdGl2ZVByb2ZpbGUuaWQpKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiBhY3RpdmVQcm9maWxlO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN1cHByZXNzRXZlbnRIYW5kbGVycyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyBUaGlzIGlzbid0IGNvb2wsIGJ1dCBtZWguXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICByZXR1cm4gKHN0YXRlLnNlc3Npb24ubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnNvbWUobiA9PiBuLmlkID09PSBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG4iXX0=