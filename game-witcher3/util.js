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
                        { label: 'Cancel', action: () => {
                                api.dismissNotification('missing-script-merger');
                            } },
                        { label: 'Download Script Merger', action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                .catch(err => null)
                                .then(() => api.dismissNotification('missing-script-merger')) },
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
            return bluebird_1.default.reject(new Error(errMessage));
        }
        const expectedModNameLocation = ['witcher3menumodroot', 'witcher3tl'].includes(mod.type)
            ? path_1.default.join(installationPath, mod.installationPath, 'Mods')
            : path_1.default.join(installationPath, mod.installationPath);
        return vortex_api_1.fs.readdirAsync(expectedModNameLocation)
            .then(entries => Promise.resolve(entries[0]));
    });
}
exports.findModFolder = findModFolder;
function getManagedModNames(api, mods) {
    const installationPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
    return bluebird_1.default.reduce(mods, (accum, mod) => findModFolder(installationPath, mod)
        .then(modName => {
        if (!modName || ['collection', 'w3modlimitpatcher'].includes(mod.type)) {
            return Promise.resolve(accum);
        }
        const modComponents = vortex_api_1.util.getSafe(mod, ['attributes', 'modComponents'], []);
        if (modComponents.length === 0) {
            modComponents.push(modName);
        }
        [...modComponents].forEach(key => {
            accum.push({
                id: mod.id,
                name: key,
            });
        });
        return Promise.resolve(accum);
    })
        .catch(err => {
        (0, vortex_api_1.log)('error', 'unable to resolve mod name', err);
        return Promise.resolve(accum);
    }), []);
}
exports.getManagedModNames = getManagedModNames;
function getAllMods(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const invalidModTypes = ['witcher3menumoddocuments'];
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
        const manualCandidates = [].concat(iniEntries, [common_1.UNI_PATCH]).filter(entry => {
            const hasVortexKey = vortex_api_1.util.getSafe(ini.data[entry], ['VK'], undefined) !== undefined;
            return ((!hasVortexKey) || (ini.data[entry].VK === entry) && !modKeys.includes(entry));
        }) || [common_1.UNI_PATCH];
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
                const entries = yield walkPath(path_1.default.join(modsPath, mod), { skipHidden: true, skipLinks: true });
                const valid = [].concat(candidates, entries.filter(entry => (!entry.isDirectory)
                    && (path_1.default.extname(path_1.default.basename(entry.filePath)) !== '')
                    && ((entry === null || entry === void 0 ? void 0 : entry.linkCount) === undefined || entry.linkCount <= 1)));
                if (valid.length > 0) {
                    accum.push(mod);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0RBQWdDO0FBQ2hDLDJDQUE2RDtBQUU3RCw0REFBdUM7QUFFdkMsZ0RBQXdCO0FBRXhCLG1FQUE0RDtBQUU1RCwwREFBNEQ7QUFFNUQscUNBQTZFO0FBRzdFLFNBQXNCLGFBQWEsQ0FBQyxHQUF3QixFQUN4QixZQUF1Qjs7UUFDekQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDbEMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFJLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7WUFDM0QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDaEQsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXZDLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7YUFDaEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxZQUFZLENB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LEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlGLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFkRCw0QkFjQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxTQUFpQixFQUFFLEtBQW1CO0lBQ3BFLE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JELE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5RCxJQUFJLENBQUMsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssYUFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ2pGLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsSUFBSSxDQUFBLGFBQWEsYUFBYixhQUFhLHVCQUFiLGFBQWEsQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRTtRQUNyQyxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFaRCwwQ0FZQztBQUFBLENBQUM7QUFFRixTQUFnQixNQUFNLENBQUksSUFBb0M7SUFDNUQsT0FBTyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUUsQ0FBQyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFGRCx3QkFFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCBJbmlTdHJ1Y3R1cmUgZnJvbSAnLi9pbmlQYXJzZXInO1xyXG5cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lcyB9IGZyb20gJy4vbWVyZ2VJbnZlbnRvcnlQYXJzaW5nJztcclxuXHJcbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5LCBJV2Fsa09wdGlvbnMgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgTE9DS0VEX1BSRUZJWCwgSTE4Tl9OQU1FU1BBQ0UsIFVOSV9QQVRDSCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSURlcGxveWVkRmlsZSwgSURlcGxveW1lbnQgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXREZXBsb3ltZW50KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RzPzogc3RyaW5nW10pOiBQcm9taXNlPElEZXBsb3ltZW50PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xyXG4gIGlmICgoZ2FtZSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2dhbWUgaXMgbm90IGRpc2NvdmVyZWQnLCBHQU1FX0lEKTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG5cclxuICBjb25zdCBpbnN0YWxsYXRpb25EaXJlY3RvcmllcyA9IE9iamVjdC52YWx1ZXMobW9kcylcclxuICAgIC5maWx0ZXIobW9kID0+IChpbmNsdWRlZE1vZHMgIT09IHVuZGVmaW5lZClcclxuICAgICAgPyBpbmNsdWRlZE1vZHMuaW5jbHVkZXMobW9kLmlkKVxyXG4gICAgICA6IHRydWUpXHJcbiAgICAubWFwKG1vZCA9PiBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcblxyXG4gIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZTogSURlcGxveWVkRmlsZSkgPT4gaW5zdGFsbGF0aW9uRGlyZWN0b3JpZXMuaW5jbHVkZXMoZmlsZS5zb3VyY2UpO1xyXG5cclxuICBjb25zdCBtb2RQYXRoczogeyBbdHlwZUlkOiBzdHJpbmddOiBzdHJpbmcgfSA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gIGNvbnN0IG1vZFR5cGVzID0gT2JqZWN0LmtleXMobW9kUGF0aHMpLmZpbHRlcihrZXkgPT4gISFtb2RQYXRoc1trZXldKTtcclxuICBjb25zdCBkZXBsb3ltZW50OiBJRGVwbG95bWVudCA9IGF3YWl0IG1vZFR5cGVzLnJlZHVjZShhc3luYyAoYWNjdW1QLCBtb2RUeXBlKSA9PiB7XHJcbiAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiB0eXBlcy5JRGVwbG95bWVudE1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksIG1vZFR5cGUsIEdBTUVfSUQpO1xyXG4gICAgICBhY2N1bVttb2RUeXBlXSA9IG1hbmlmZXN0LmZpbGVzLmZpbHRlcihmaWx0ZXJGdW5jKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBnZXQgbWFuaWZlc3QnLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIGRlcGxveW1lbnQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBnZXREb2N1bWVudHNQYXRoID0gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnVGhlIFdpdGNoZXIgMycpXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBnZXRETENQYXRoID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0RMQycpO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBnZXRUTFBhdGggPSAoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgaXNUVzMgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIChnYW1lSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgaWYgKGdhbWVJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3Qgbm90aWZJZCA9ICdtaXNzaW5nLXNjcmlwdC1tZXJnZXInO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiBub3RpZklkLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnV2l0Y2hlciAzIHNjcmlwdCBtZXJnZXIgaXMgbWlzc2luZy9taXNjb25maWd1cmVkJyxcclxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgYWN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyJywge1xyXG4gICAgICAgICAgICBiYmNvZGU6IGFwaS50cmFuc2xhdGUoJ1ZvcnRleCBpcyB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgU2NyaXB0IE1lcmdlclxcJ3MgbG9jYXRpb24uIFRoZSB0b29sIG5lZWRzIHRvIGJlIGRvd25sb2FkZWQgYW5kIGNvbmZpZ3VyZWQgbWFudWFsbHkuICdcclxuICAgICAgICAgICAgICArICdbdXJsPWh0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Ub29sX1NldHVwOl9XaXRjaGVyXzNfU2NyaXB0X01lcmdlcl1GaW5kIG91dCBtb3JlIGFib3V0IGhvdyB0byBjb25maWd1cmUgaXQgYXMgYSB0b29sIGZvciB1c2UgaW4gVm9ydGV4LlsvdXJsXVticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgICAgICAgICArICdOb3RlOiBXaGlsZSBzY3JpcHQgbWVyZ2luZyB3b3JrcyB3ZWxsIHdpdGggdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kcywgdGhlcmUgaXMgbm8gZ3VhcmFudGVlIGZvciBhIHNhdGlzZnlpbmcgb3V0Y29tZSBpbiBldmVyeSBzaW5nbGUgY2FzZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKTtcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHsgbGFiZWw6ICdEb3dubG9hZCBTY3JpcHQgTWVyZ2VyJywgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS93aXRjaGVyMy9tb2RzLzQ4NCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpKSB9LFxyXG4gICAgICAgICAgXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICBpZiAoIWluc3RhbGxhdGlvblBhdGggfHwgIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xyXG4gICAgY29uc3QgZXJyTWVzc2FnZSA9ICFpbnN0YWxsYXRpb25QYXRoXHJcbiAgICAgID8gJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnXHJcbiAgICAgIDogJ0ZhaWxlZCB0byByZXNvbHZlIG1vZCBpbnN0YWxsYXRpb24gcGF0aCc7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcihlcnJNZXNzYWdlKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBleHBlY3RlZE1vZE5hbWVMb2NhdGlvbiA9IFsnd2l0Y2hlcjNtZW51bW9kcm9vdCcsICd3aXRjaGVyM3RsJ10uaW5jbHVkZXMobW9kLnR5cGUpXHJcbiAgICA/IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgJ01vZHMnKVxyXG4gICAgOiBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZXhwZWN0ZWRNb2ROYW1lTG9jYXRpb24pXHJcbiAgICAudGhlbihlbnRyaWVzID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzWzBdKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNYW5hZ2VkTW9kTmFtZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcclxuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShtb2RzLCAoYWNjdW0sIG1vZCkgPT4gZmluZE1vZEZvbGRlcihpbnN0YWxsYXRpb25QYXRoLCBtb2QpXHJcbiAgICAudGhlbihtb2ROYW1lID0+IHtcclxuICAgICAgaWYgKCFtb2ROYW1lIHx8IFsnY29sbGVjdGlvbicsICd3M21vZGxpbWl0cGF0Y2hlciddLmluY2x1ZGVzKG1vZC50eXBlKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZENvbXBvbmVudHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnbW9kQ29tcG9uZW50cyddLCBbXSk7XHJcbiAgICAgIGlmIChtb2RDb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIG1vZENvbXBvbmVudHMucHVzaChtb2ROYW1lKTtcclxuICAgICAgfVxyXG4gICAgICBbLi4ubW9kQ29tcG9uZW50c10uZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgaWQ6IG1vZC5pZCxcclxuICAgICAgICAgIG5hbWU6IGtleSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byByZXNvbHZlIG1vZCBuYW1lJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9KSwgW10pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyBNb2QgdHlwZXMgd2UgZG9uJ3Qgd2FudCB0byBkaXNwbGF5IGluIHRoZSBMTyBwYWdlXHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBtZXJnZWQ6IFtdLFxyXG4gICAgICBtYW51YWw6IFtdLFxyXG4gICAgICBtYW5hZ2VkOiBbXSxcclxuICAgIH0pO1xyXG4gIH1cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcblxyXG4gIC8vIE9ubHkgc2VsZWN0IG1vZHMgd2hpY2ggYXJlIGVuYWJsZWQsIGFuZCBhcmUgbm90IGEgbWVudSBtb2QuXHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RTdGF0ZSkuZmlsdGVyKGtleSA9PlxyXG4gICAgKCEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSkpO1xyXG5cclxuICBjb25zdCBtZXJnZWRNb2ROYW1lcyA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWVzKGFwaSk7XHJcbiAgY29uc3QgbWFudWFsbHlBZGRlZE1vZHMgPSBhd2FpdCBnZXRNYW51YWxseUFkZGVkTW9kcyhhcGkpO1xyXG4gIGNvbnN0IG1hbmFnZWRNb2RzID0gYXdhaXQgZ2V0TWFuYWdlZE1vZE5hbWVzKGFwaSwgZW5hYmxlZE1vZHMubWFwKGtleSA9PiBtb2RzW2tleV0pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIG1lcmdlZDogbWVyZ2VkTW9kTmFtZXMsXHJcbiAgICBtYW51YWw6IG1hbnVhbGx5QWRkZWRNb2RzLmZpbHRlcihtb2QgPT4gIW1lcmdlZE1vZE5hbWVzLmluY2x1ZGVzKG1vZCkpLFxyXG4gICAgbWFuYWdlZDogbWFuYWdlZE1vZHMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNYW51YWxseUFkZGVkTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBIb3cvd2h5IGFyZSB3ZSBldmVuIGhlcmUgP1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCEnKSk7XHJcbiAgfVxyXG4gIGNvbnN0IGluaSA9IGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLmVuc3VyZU1vZFNldHRpbmdzKCk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICBjb25zdCBpbmlFbnRyaWVzID0gT2JqZWN0LmtleXMoaW5pLmRhdGEpO1xyXG4gIGNvbnN0IG1hbnVhbENhbmRpZGF0ZXMgPSBbXS5jb25jYXQoaW5pRW50cmllcywgW1VOSV9QQVRDSF0pLmZpbHRlcihlbnRyeSA9PiB7XHJcbiAgICBjb25zdCBoYXNWb3J0ZXhLZXkgPSB1dGlsLmdldFNhZmUoaW5pLmRhdGFbZW50cnldLCBbJ1ZLJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZDtcclxuICAgIHJldHVybiAoKCFoYXNWb3J0ZXhLZXkpIHx8IChpbmkuZGF0YVtlbnRyeV0uVksgPT09IGVudHJ5KSAmJiAhbW9kS2V5cy5pbmNsdWRlcyhlbnRyeSkpO1xyXG4gIH0pIHx8IFtVTklfUEFUQ0hdO1xyXG4gIGNvbnN0IHVuaXF1ZUNhbmRpZGF0ZXMgPSBuZXcgU2V0KG5ldyBTZXQobWFudWFsQ2FuZGlkYXRlcykpO1xyXG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xyXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBBcnJheS5mcm9tKHVuaXF1ZUNhbmRpZGF0ZXMpO1xyXG4gIGNvbnN0IHZhbGlkQ2FuZGlkYXRlcyA9IGF3YWl0IGNhbmRpZGF0ZXMucmVkdWNlKGFzeW5jIChhY2N1bVAsIG1vZCkgPT4ge1xyXG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICBjb25zdCBtb2RGb2xkZXIgPSBwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCk7XHJcbiAgICBjb25zdCBleGlzdHMgPSBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZEZvbGRlcikpLnRoZW4oKCkgPT4gdHJ1ZSkuY2F0Y2goKCkgPT4gZmFsc2UpO1xyXG4gICAgaWYgKCFleGlzdHMpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT2ssIHdlIGtub3cgdGhlIGZvbGRlciBpcyB0aGVyZSAtIGxldHMgZW5zdXJlIHRoYXRcclxuICAgIC8vICBpdCBhY3R1YWxseSBjb250YWlucyBmaWxlcy5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB3YWxrUGF0aChwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCksIHsgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pO1xyXG4gICAgICBjb25zdCB2YWxpZCA9IFtdLmNvbmNhdChjYW5kaWRhdGVzLCBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAoIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAocGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKSAhPT0gJycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChlbnRyeT8ubGlua0NvdW50ID09PSB1bmRlZmluZWQgfHwgZW50cnkubGlua0NvdW50IDw9IDEpKSk7XHJcbiAgICAgIGlmICh2YWxpZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChtb2QpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKCFbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5zb21lKGVyci5jb2RlKSkge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHdhbGsgcGF0aCcsIGVycik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICB9LCBQcm9taXNlLnJlc29sdmUoW10pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbGlkQ2FuZGlkYXRlcyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0xvY2tlZEVudHJ5KG1vZE5hbWU6IHN0cmluZykge1xyXG4gIC8vIFdlJ3JlIGFkZGluZyB0aGlzIHRvIGF2b2lkIGhhdmluZyB0aGUgbG9hZCBvcmRlciBwYWdlXHJcbiAgLy8gIGZyb20gbm90IGxvYWRpbmcgaWYgd2UgZW5jb3VudGVyIGFuIGludmFsaWQgbW9kIG5hbWUuXHJcbiAgaWYgKCFtb2ROYW1lIHx8IHR5cGVvZihtb2ROYW1lKSAhPT0gJ3N0cmluZycpIHtcclxuICAgIGxvZygnZGVidWcnLCAnZW5jb3VudGVyZWQgaW52YWxpZCBtb2QgaW5zdGFuY2UvbmFtZScpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICByZXR1cm4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGV0ZXJtaW5lRXhlY3V0YWJsZShkaXNjb3ZlcmVkUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcclxuICBpZiAoZGlzY292ZXJlZFBhdGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCAnYmluJywgJ3g2NF9EWDEyJywgJ3dpdGNoZXIzLmV4ZScpKTtcclxuICAgICAgcmV0dXJuICdiaW4veDY0X0RYMTIvd2l0Y2hlcjMuZXhlJztcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBub3AsIHVzZSBmYWxsYmFja1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGFjdGlvbiA9IHtcclxuICAgIHR5cGU6ICdTRVRfRkJfRk9SQ0VfVVBEQVRFJyxcclxuICAgIHBheWxvYWQ6IHtcclxuICAgICAgcHJvZmlsZUlkLFxyXG4gICAgfSxcclxuICB9O1xyXG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb24pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa1BhdGgoZGlyUGF0aDogc3RyaW5nLCB3YWxrT3B0aW9ucz86IElXYWxrT3B0aW9ucyk6IFByb21pc2U8SUVudHJ5W10+IHtcclxuICB3YWxrT3B0aW9ucyA9IHdhbGtPcHRpb25zIHx8IHsgc2tpcExpbmtzOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH07XHJcbiAgLy8gV2UgUkVBTExZIGRvbid0IGNhcmUgZm9yIGhpZGRlbiBvciBpbmFjY2Vzc2libGUgZmlsZXMuXHJcbiAgd2Fsa09wdGlvbnMgPSB7IC4uLndhbGtPcHRpb25zLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfTtcclxuICBjb25zdCB3YWxrUmVzdWx0czogSUVudHJ5W10gPSBbXTtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SUVudHJ5W10+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcclxuICAgICAgd2Fsa1Jlc3VsdHMucHVzaCguLi5lbnRyaWVzKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpIGFzIGFueTtcclxuICAgICAgLy8gSWYgdGhlIGRpcmVjdG9yeSBpcyBtaXNzaW5nIHdoZW4gd2UgdHJ5IHRvIHdhbGsgaXQ7IGl0J3MgbW9zdCBwcm9iYWJseSBkb3duIHRvIGEgY29sbGVjdGlvbiBiZWluZ1xyXG4gICAgICAvLyAgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgaW5zdGFsbGVkL3JlbW92ZWQuIFdlIGNhbiBzYWZlbHkgaWdub3JlIHRoaXMuXHJcbiAgICB9LCB3YWxrT3B0aW9ucykuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICByZXR1cm4gcmVzb2x2ZSh3YWxrUmVzdWx0cyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkOiBzdHJpbmcsIHN0YXRlOiB0eXBlcy5JU3RhdGUpIHtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKCEhYWN0aXZlUHJvZmlsZSAmJiAhIWRlcGxveVByb2ZpbGUgJiYgKGRlcGxveVByb2ZpbGUuaWQgIT09IGFjdGl2ZVByb2ZpbGUuaWQpKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiBhY3RpdmVQcm9maWxlO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcbiJdfQ==