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
exports.onSettingsChange = exports.onProfileWillChange = exports.onDidDeploy = exports.onDidPurge = exports.onDidRemoveMod = exports.onModsDisabled = exports.onWillDeploy = exports.onGameModeActivation = void 0;
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
const common_1 = require("./common");
const menumod_1 = __importDefault(require("./menumod"));
const mergeBackup_1 = require("./mergeBackup");
const util_1 = require("./util");
const iniParser_1 = __importDefault(require("./iniParser"));
const migrations_1 = require("./migrations");
function onGameModeActivation(api) {
    return (gameMode) => __awaiter(this, void 0, void 0, function* () {
        if (gameMode !== common_1.GAME_ID) {
            api.dismissNotification('witcher3-merge');
        }
        else {
            const state = api.getState();
            const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, gameMode);
            const activeProf = vortex_api_1.selectors.activeProfile(state);
            const priorityType = vortex_api_1.util.getSafe(state, (0, common_1.getPriorityTypeBranch)(), 'prefix-based');
            api.store.dispatch((0, actions_1.setPriorityType)(priorityType));
            if (lastProfId !== (activeProf === null || activeProf === void 0 ? void 0 : activeProf.id)) {
                try {
                    yield (0, mergeBackup_1.storeToProfile)(api, lastProfId)
                        .then(() => (0, mergeBackup_1.restoreFromProfile)(api, activeProf === null || activeProf === void 0 ? void 0 : activeProf.id));
                }
                catch (err) {
                    api.showErrorNotification('Failed to restore profile merged files', err);
                }
            }
        }
    });
}
exports.onGameModeActivation = onGameModeActivation;
const onWillDeploy = (api) => {
    return (profileId, deployment) => __awaiter(void 0, void 0, void 0, function* () {
        const state = api.store.getState();
        const activeProfile = (0, util_1.validateProfile)(profileId, state);
        if (activeProfile === undefined) {
            return Promise.resolve();
        }
        return menumod_1.default.onWillDeploy(api, deployment, activeProfile)
            .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
            ? Promise.resolve()
            : Promise.reject(err));
    });
};
exports.onWillDeploy = onWillDeploy;
const applyToIniStruct = (api, priorityManager, modIds) => {
    const currentLO = (0, migrations_1.getPersistentLoadOrder)(api);
    const newLO = [...currentLO.filter(entry => !modIds.includes(entry.modId))];
    iniParser_1.default.getInstance(api, priorityManager).setINIStruct(newLO, priorityManager);
    (0, util_1.forceRefresh)(api);
};
const onModsDisabled = (api, priorityManager) => {
    return (modIds, enabled, gameId) => __awaiter(void 0, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID || enabled) {
            return;
        }
        applyToIniStruct(api, priorityManager, modIds);
    });
};
exports.onModsDisabled = onModsDisabled;
const onDidRemoveMod = (api, priorityManager) => {
    return (gameId, modId, removeOpts) => __awaiter(void 0, void 0, void 0, function* () {
        if (common_1.GAME_ID !== gameId || (removeOpts === null || removeOpts === void 0 ? void 0 : removeOpts.willBeReplaced)) {
            return Promise.resolve();
        }
        applyToIniStruct(api, priorityManager, [modId]);
    });
};
exports.onDidRemoveMod = onDidRemoveMod;
const onDidPurge = (api, priorityManager) => {
    return (profileId, deployment) => __awaiter(void 0, void 0, void 0, function* () {
        const state = api.getState();
        const activeProfile = (0, util_1.validateProfile)(profileId, state);
        if (activeProfile === undefined) {
            return Promise.resolve();
        }
        return iniParser_1.default.getInstance(api, priorityManager).revertLOFile();
    });
};
exports.onDidPurge = onDidPurge;
let prevDeployment = {};
const onDidDeploy = (api, priorityManager) => {
    return (profileId, deployment) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const state = api.getState();
        const activeProfile = (0, util_1.validateProfile)(profileId, state);
        if (activeProfile === undefined) {
            return Promise.resolve();
        }
        if (JSON.stringify(prevDeployment) !== JSON.stringify(deployment)) {
            prevDeployment = deployment;
            queryScriptMerge(api, 'Your mods state/load order has changed since the last time you ran '
                + 'the script merger. You may want to run the merger tool and check whether any new script conflicts are '
                + 'present, or if existing merges have become unecessary. Please also note that any load order changes '
                + 'may affect the order in which your conflicting mods are meant to be merged, and may require you to '
                + 'remove the existing merge and re-apply it.');
        }
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const docFiles = ((_a = deployment['witcher3menumodroot']) !== null && _a !== void 0 ? _a : [])
            .filter(file => file.relPath.endsWith(common_1.PART_SUFFIX)
            && (file.relPath.indexOf(common_1.INPUT_XML_FILENAME) === -1));
        const menuModPromise = () => {
            if (docFiles.length === 0) {
                return menumod_1.default.removeMod(api, activeProfile);
            }
            else {
                return menumod_1.default.onDidDeploy(api, deployment, activeProfile)
                    .then((modId) => __awaiter(void 0, void 0, void 0, function* () {
                    if (modId === undefined) {
                        return Promise.resolve();
                    }
                    api.store.dispatch(vortex_api_1.actions.setModEnabled(activeProfile.id, modId, true));
                    yield api.emitAndAwait('deploy-single-mod', common_1.GAME_ID, modId, true);
                    return Promise.resolve();
                }));
            }
        };
        return menuModPromise()
            .then(() => iniParser_1.default.getInstance().setINIStruct(loadOrder, priorityManager))
            .then(() => iniParser_1.default.getInstance().writeToModSettings())
            .then(() => {
            (0, util_1.forceRefresh)(api);
            return Promise.resolve();
        })
            .catch(err => iniParser_1.default.getInstance().modSettingsErrorHandler(err, 'Failed to modify load order file'));
    });
};
exports.onDidDeploy = onDidDeploy;
const onProfileWillChange = (api) => {
    return (profileId) => __awaiter(void 0, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        const priorityType = vortex_api_1.util.getSafe(state, (0, common_1.getPriorityTypeBranch)(), 'prefix-based');
        api.store.dispatch((0, actions_1.setPriorityType)(priorityType));
        const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, profile.gameId);
        try {
            yield (0, mergeBackup_1.storeToProfile)(api, lastProfId)
                .then(() => (0, mergeBackup_1.restoreFromProfile)(api, profile.id));
        }
        catch (err) {
            if (!(err instanceof vortex_api_1.util.UserCanceled)) {
                api.showErrorNotification('Failed to store profile specific merged items', err);
            }
        }
    });
};
exports.onProfileWillChange = onProfileWillChange;
const onSettingsChange = (api, priorityManager) => {
    return (prev, current) => __awaiter(void 0, void 0, void 0, function* () {
        const state = api.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID || priorityManager === undefined) {
            return;
        }
        const priorityType = vortex_api_1.util.getSafe(state, (0, common_1.getPriorityTypeBranch)(), 'prefix-based');
        priorityManager.priorityType = priorityType;
        api.events.on('purge-mods', () => {
            iniParser_1.default.getInstance().revertLOFile();
        });
    });
};
exports.onSettingsChange = onSettingsChange;
function getScriptMergerTool(api) {
    const state = api.store.getState();
    const scriptMerger = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
    if (!!(scriptMerger === null || scriptMerger === void 0 ? void 0 : scriptMerger.path)) {
        return scriptMerger;
    }
    return undefined;
}
function runScriptMerger(api) {
    const tool = getScriptMergerTool(api);
    if ((tool === null || tool === void 0 ? void 0 : tool.path) === undefined) {
        this.notifyMissingScriptMerger(api);
        return Promise.resolve();
    }
    return api.runExecutable(tool.path, [], { suggestDeploy: true })
        .catch(err => api.showErrorNotification('Failed to run tool', err, { allowReport: ['EPERM', 'EACCESS', 'ENOENT'].indexOf(err.code) !== -1 }));
}
function queryScriptMerge(api, reason) {
    const state = api.store.getState();
    const t = api.translate;
    const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
    if (!!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
        api.sendNotification({
            id: 'witcher3-merge',
            type: 'warning',
            message: t('Witcher Script merger may need to be executed', { ns: common_1.I18N_NAMESPACE }),
            allowSuppress: true,
            actions: [
                {
                    title: 'More',
                    action: () => {
                        api.showDialog('info', 'Witcher 3', {
                            text: reason,
                        }, [
                            { label: 'Close' },
                        ]);
                    },
                },
                {
                    title: 'Run tool',
                    action: dismiss => {
                        runScriptMerger(api);
                        dismiss();
                    },
                },
            ],
        });
    }
    else {
        this.notifyMissingScriptMerger(api);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRIYW5kbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV2ZW50SGFuZGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZEO0FBRTdELHVDQUE0QztBQUU1QyxxQ0FHa0I7QUFFbEIsd0RBQWdDO0FBQ2hDLCtDQUFtRTtBQUNuRSxpQ0FBdUQ7QUFJdkQsNERBQXVDO0FBQ3ZDLDZDQUFzRDtBQUl0RCxTQUFnQixvQkFBb0IsQ0FBQyxHQUF3QjtJQUMzRCxPQUFPLENBQU8sUUFBZ0IsRUFBRSxFQUFFO1FBQ2hDLElBQUksUUFBUSxLQUFLLGdCQUFPLEVBQUU7WUFHeEIsR0FBRyxDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDM0M7YUFBTTtZQUNMLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLFVBQVUsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RSxNQUFNLFVBQVUsR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSw4QkFBcUIsR0FBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2xGLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2xELElBQUksVUFBVSxNQUFLLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxFQUFFLENBQUEsRUFBRTtnQkFDakMsSUFBSTtvQkFDRixNQUFNLElBQUEsNEJBQWMsRUFBQyxHQUFHLEVBQUUsVUFBVSxDQUFDO3lCQUNsQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxnQ0FBa0IsRUFBQyxHQUFHLEVBQUUsVUFBVSxh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TyxFQUFFLENBQUM7b0JBQ1osQ0FBQztpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0tBQ0o7U0FBTTtRQUNMLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgeyBhY3Rpb25zLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBzZXRQcmlvcml0eVR5cGUgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBHQU1FX0lELCBnZXRQcmlvcml0eVR5cGVCcmFuY2gsIFBBUlRfU1VGRklYLFxyXG4gIElOUFVUX1hNTF9GSUxFTkFNRSwgU0NSSVBUX01FUkdFUl9JRCwgSTE4Tl9OQU1FU1BBQ0VcclxufSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgbWVudU1vZCBmcm9tICcuL21lbnVtb2QnO1xyXG5pbXBvcnQgeyBzdG9yZVRvUHJvZmlsZSwgcmVzdG9yZUZyb21Qcm9maWxlIH0gZnJvbSAnLi9tZXJnZUJhY2t1cCc7XHJcbmltcG9ydCB7IHZhbGlkYXRlUHJvZmlsZSwgZm9yY2VSZWZyZXNoIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5pbXBvcnQgeyBJUmVtb3ZlTW9kT3B0aW9ucyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxudHlwZSBEZXBsb3ltZW50ID0geyBbbW9kVHlwZTogc3RyaW5nXTogdHlwZXMuSURlcGxveWVkRmlsZVtdIH07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gb25HYW1lTW9kZUFjdGl2YXRpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIGFzeW5jIChnYW1lTW9kZTogc3RyaW5nKSA9PiB7XHJcbiAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgICAgLy8gSnVzdCBpbiBjYXNlIHRoZSBzY3JpcHQgbWVyZ2VyIG5vdGlmaWNhdGlvbiBpcyBzdGlsbFxyXG4gICAgICAvLyAgcHJlc2VudC5cclxuICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3dpdGNoZXIzLW1lcmdlJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZU1vZGUpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcbiAgICAgIGlmIChsYXN0UHJvZklkICE9PSBhY3RpdmVQcm9mPy5pZCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShhcGksIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHJlc3RvcmVGcm9tUHJvZmlsZShhcGksIGFjdGl2ZVByb2Y/LmlkKSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzdG9yZSBwcm9maWxlIG1lcmdlZCBmaWxlcycsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgb25XaWxsRGVwbG95ID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiBhc3luYyAocHJvZmlsZUlkOiBzdHJpbmcsIGRlcGxveW1lbnQ6IERlcGxveW1lbnQpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lbnVNb2Qub25XaWxsRGVwbG95KGFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBhcHBseVRvSW5pU3RydWN0ID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIsIG1vZElkczogc3RyaW5nW10pID0+IHtcclxuICBjb25zdCBjdXJyZW50TE8gPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XHJcbiAgY29uc3QgbmV3TE86IHR5cGVzLklMb2FkT3JkZXJFbnRyeVtdID0gWy4uLmN1cnJlbnRMTy5maWx0ZXIoZW50cnkgPT4gIW1vZElkcy5pbmNsdWRlcyhlbnRyeS5tb2RJZCkpXTtcclxuICBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoYXBpLCBwcmlvcml0eU1hbmFnZXIpLnNldElOSVN0cnVjdChuZXdMTywgcHJpb3JpdHlNYW5hZ2VyKTtcclxuICBmb3JjZVJlZnJlc2goYXBpKTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG9uTW9kc0Rpc2FibGVkID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIpID0+IHtcclxuICByZXR1cm4gYXN5bmMgKG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4sIGdhbWVJZDogc3RyaW5nKSA9PiB7XHJcbiAgICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGVuYWJsZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYXBwbHlUb0luaVN0cnVjdChhcGksIHByaW9yaXR5TWFuYWdlciwgbW9kSWRzKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBvbkRpZFJlbW92ZU1vZCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChnYW1lSWQ6IHN0cmluZywgbW9kSWQ6IHN0cmluZywgcmVtb3ZlT3B0czogSVJlbW92ZU1vZE9wdGlvbnMpID0+IHtcclxuICAgIGlmIChHQU1FX0lEICE9PSBnYW1lSWQgfHwgcmVtb3ZlT3B0cz8ud2lsbEJlUmVwbGFjZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG4gICAgYXBwbHlUb0luaVN0cnVjdChhcGksIHByaW9yaXR5TWFuYWdlciwgW21vZElkXSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IG9uRGlkUHVyZ2UgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcikgPT4ge1xyXG4gIHJldHVybiBhc3luYyAocHJvZmlsZUlkOiBzdHJpbmcsIGRlcGxveW1lbnQ6IERlcGxveW1lbnQpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZShhcGksIHByaW9yaXR5TWFuYWdlcikucmV2ZXJ0TE9GaWxlKCk7XHJcbiAgfTtcclxufVxyXG5cclxubGV0IHByZXZEZXBsb3ltZW50OiBEZXBsb3ltZW50ID0ge307XHJcbmV4cG9ydCBjb25zdCBvbkRpZERlcGxveSA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudDogRGVwbG95bWVudCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoSlNPTi5zdHJpbmdpZnkocHJldkRlcGxveW1lbnQpICE9PSBKU09OLnN0cmluZ2lmeShkZXBsb3ltZW50KSkge1xyXG4gICAgICBwcmV2RGVwbG95bWVudCA9IGRlcGxveW1lbnQ7XHJcbiAgICAgIHF1ZXJ5U2NyaXB0TWVyZ2UoYXBpLCAnWW91ciBtb2RzIHN0YXRlL2xvYWQgb3JkZXIgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgdGltZSB5b3UgcmFuICdcclxuICAgICAgICArICd0aGUgc2NyaXB0IG1lcmdlci4gWW91IG1heSB3YW50IHRvIHJ1biB0aGUgbWVyZ2VyIHRvb2wgYW5kIGNoZWNrIHdoZXRoZXIgYW55IG5ldyBzY3JpcHQgY29uZmxpY3RzIGFyZSAnXHJcbiAgICAgICAgKyAncHJlc2VudCwgb3IgaWYgZXhpc3RpbmcgbWVyZ2VzIGhhdmUgYmVjb21lIHVuZWNlc3NhcnkuIFBsZWFzZSBhbHNvIG5vdGUgdGhhdCBhbnkgbG9hZCBvcmRlciBjaGFuZ2VzICdcclxuICAgICAgICArICdtYXkgYWZmZWN0IHRoZSBvcmRlciBpbiB3aGljaCB5b3VyIGNvbmZsaWN0aW5nIG1vZHMgYXJlIG1lYW50IHRvIGJlIG1lcmdlZCwgYW5kIG1heSByZXF1aXJlIHlvdSB0byAnXHJcbiAgICAgICAgKyAncmVtb3ZlIHRoZSBleGlzdGluZyBtZXJnZSBhbmQgcmUtYXBwbHkgaXQuJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XHJcbiAgICBjb25zdCBkb2NGaWxlcyA9IChkZXBsb3ltZW50Wyd3aXRjaGVyM21lbnVtb2Ryb290J10gPz8gW10pXHJcbiAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpXHJcbiAgICAgICAgJiYgKGZpbGUucmVsUGF0aC5pbmRleE9mKElOUFVUX1hNTF9GSUxFTkFNRSkgPT09IC0xKSk7XHJcbiAgICBjb25zdCBtZW51TW9kUHJvbWlzZSA9ICgpID0+IHtcclxuICAgICAgaWYgKGRvY0ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBtZW51IG1vZHMgZGVwbG95ZWQgLSByZW1vdmUgdGhlIG1vZC5cclxuICAgICAgICByZXR1cm4gbWVudU1vZC5yZW1vdmVNb2QoYXBpLCBhY3RpdmVQcm9maWxlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbWVudU1vZC5vbkRpZERlcGxveShhcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgICAudGhlbihhc3luYyBtb2RJZCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChtb2RJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB0cnVlKSk7XHJcbiAgICAgICAgICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgbW9kSWQsIHRydWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbWVudU1vZFByb21pc2UoKVxyXG4gICAgICAudGhlbigoKSA9PiBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS5zZXRJTklTdHJ1Y3QobG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpKVxyXG4gICAgICAudGhlbigoKSA9PiBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS53cml0ZVRvTW9kU2V0dGluZ3MoKSlcclxuICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGZvcmNlUmVmcmVzaChhcGkpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGVyciA9PiBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS5tb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihlcnIsICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBvblByb2ZpbGVXaWxsQ2hhbmdlID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiBhc3luYyAocHJvZmlsZUlkOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcclxuXHJcbiAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgcHJvZmlsZS5nYW1lSWQpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgc3RvcmVUb1Byb2ZpbGUoYXBpLCBsYXN0UHJvZklkKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHJlc3RvcmVGcm9tUHJvZmlsZShhcGksIHByb2ZpbGUuaWQpKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkpIHtcclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBtZXJnZWQgaXRlbXMnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgb25TZXR0aW5nc0NoYW5nZSA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChwcmV2OiBzdHJpbmcsIGN1cnJlbnQ6IGFueSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8IHByaW9yaXR5TWFuYWdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICBwcmlvcml0eU1hbmFnZXIucHJpb3JpdHlUeXBlID0gcHJpb3JpdHlUeXBlO1xyXG4gICAgYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcclxuICAgICAgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkucmV2ZXJ0TE9GaWxlKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFNjcmlwdE1lcmdlclRvb2woYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXI/LnBhdGgpIHtcclxuICAgIHJldHVybiBzY3JpcHRNZXJnZXI7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5TY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3QgdG9vbCA9IGdldFNjcmlwdE1lcmdlclRvb2woYXBpKTtcclxuICBpZiAodG9vbD8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB0aGlzLm5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBhcGkucnVuRXhlY3V0YWJsZSh0b29sLnBhdGgsIFtdLCB7IHN1Z2dlc3REZXBsb3k6IHRydWUgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJ1biB0b29sJywgZXJyLFxyXG4gICAgICB7IGFsbG93UmVwb3J0OiBbJ0VQRVJNJywgJ0VBQ0NFU1MnLCAnRU5PRU5UJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xIH0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHJlYXNvbjogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnd2l0Y2hlcjMtbWVyZ2UnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIG1lc3NhZ2U6IHQoJ1dpdGNoZXIgU2NyaXB0IG1lcmdlciBtYXkgbmVlZCB0byBiZSBleGVjdXRlZCcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMnLCB7XHJcbiAgICAgICAgICAgICAgdGV4dDogcmVhc29uLFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ1J1biB0b29sJyxcclxuICAgICAgICAgIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICAgIHJ1blNjcmlwdE1lcmdlcihhcGkpO1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5ub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgfVxyXG59Il19