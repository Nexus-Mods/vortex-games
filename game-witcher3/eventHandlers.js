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
    var _a, _b;
    const state = api.store.getState();
    const t = api.translate;
    if (((_b = (_a = state.session.base.activity) === null || _a === void 0 ? void 0 : _a.installing_dependencies) !== null && _b !== void 0 ? _b : []).length > 0) {
        return;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRIYW5kbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV2ZW50SGFuZGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZEO0FBRTdELHVDQUE0QztBQUU1QyxxQ0FHa0I7QUFFbEIsd0RBQWdDO0FBQ2hDLCtDQUFtRTtBQUNuRSxpQ0FBdUQ7QUFJdkQsNERBQXVDO0FBQ3ZDLDZDQUFzRDtBQUl0RCxTQUFnQixvQkFBb0IsQ0FBQyxHQUF3QjtJQUMzRCxPQUFPLENBQU8sUUFBZ0IsRUFBRSxFQUFFO1FBQ2hDLElBQUksUUFBUSxLQUFLLGdCQUFPLEVBQUU7WUFHeEIsR0FBRyxDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDM0M7YUFBTTtZQUNMLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLFVBQVUsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RSxNQUFNLFVBQVUsR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSw4QkFBcUIsR0FBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2xGLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2xELElBQUksVUFBVSxNQUFLLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxFQUFFLENBQUEsRUFBRTtnQkFDakMsSUFBSTtvQkFDRixNQUFNLElBQUEsNEJBQWMsRUFBQyxHQUFHLEVBQUUsVUFBVSxDQUFDO3lCQUNsQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxnQ0FBa0IsRUFBQyxHQUFHLEVBQUUsVUFBVSxh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bkIsQ0FBQyxDQUFDO29CQUNMLENBQUM7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsS0FBSyxFQUFFLFVBQVU7b0JBQ2pCLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRTt3QkFDaEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNyQixPQUFPLEVBQUUsQ0FBQztvQkFDWixDQUFDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7S0FDSjtTQUFNO1FBQ0wsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3JDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCB7IGFjdGlvbnMsIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IHNldFByaW9yaXR5VHlwZSB9IGZyb20gJy4vYWN0aW9ucyc7XHJcblxyXG5pbXBvcnQge1xyXG4gIEdBTUVfSUQsIGdldFByaW9yaXR5VHlwZUJyYW5jaCwgUEFSVF9TVUZGSVgsXHJcbiAgSU5QVVRfWE1MX0ZJTEVOQU1FLCBTQ1JJUFRfTUVSR0VSX0lELCBJMThOX05BTUVTUEFDRVxyXG59IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCBtZW51TW9kIGZyb20gJy4vbWVudW1vZCc7XHJcbmltcG9ydCB7IHN0b3JlVG9Qcm9maWxlLCByZXN0b3JlRnJvbVByb2ZpbGUgfSBmcm9tICcuL21lcmdlQmFja3VwJztcclxuaW1wb3J0IHsgdmFsaWRhdGVQcm9maWxlLCBmb3JjZVJlZnJlc2ggfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcbmltcG9ydCB7IElSZW1vdmVNb2RPcHRpb25zIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG50eXBlIERlcGxveW1lbnQgPSB7IFttb2RUeXBlOiBzdHJpbmddOiB0eXBlcy5JRGVwbG95ZWRGaWxlW10gfTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvbkdhbWVNb2RlQWN0aXZhdGlvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICByZXR1cm4gYXN5bmMgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAvLyBKdXN0IGluIGNhc2UgdGhlIHNjcmlwdCBtZXJnZXIgbm90aWZpY2F0aW9uIGlzIHN0aWxsXHJcbiAgICAgIC8vICBwcmVzZW50LlxyXG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignd2l0Y2hlcjMtbWVyZ2UnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBnYW1lTW9kZSk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcclxuICAgICAgaWYgKGxhc3RQcm9mSWQgIT09IGFjdGl2ZVByb2Y/LmlkKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGFwaSwgbGFzdFByb2ZJZClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGFwaSwgYWN0aXZlUHJvZj8uaWQpKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZXN0b3JlIHByb2ZpbGUgbWVyZ2VkIGZpbGVzJywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBvbldpbGxEZXBsb3kgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudDogRGVwbG95bWVudCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbWVudU1vZC5vbldpbGxEZXBsb3koYXBpLCBkZXBsb3ltZW50LCBhY3RpdmVQcm9maWxlKVxyXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGFwcGx5VG9JbmlTdHJ1Y3QgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlciwgbW9kSWRzOiBzdHJpbmdbXSkgPT4ge1xyXG4gIGNvbnN0IGN1cnJlbnRMTyA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICBjb25zdCBuZXdMTzogdHlwZXMuSUxvYWRPcmRlckVudHJ5W10gPSBbLi4uY3VycmVudExPLmZpbHRlcihlbnRyeSA9PiAhbW9kSWRzLmluY2x1ZGVzKGVudHJ5Lm1vZElkKSldO1xyXG4gIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZShhcGksIHByaW9yaXR5TWFuYWdlcikuc2V0SU5JU3RydWN0KG5ld0xPLCBwcmlvcml0eU1hbmFnZXIpO1xyXG4gIGZvcmNlUmVmcmVzaChhcGkpO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgb25Nb2RzRGlzYWJsZWQgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcikgPT4ge1xyXG4gIHJldHVybiBhc3luYyAobW9kSWRzOiBzdHJpbmdbXSwgZW5hYmxlZDogYm9vbGVhbiwgZ2FtZUlkOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChnYW1lSWQgIT09IEdBTUVfSUQgfHwgZW5hYmxlZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBhcHBseVRvSW5pU3RydWN0KGFwaSwgcHJpb3JpdHlNYW5hZ2VyLCBtb2RJZHMpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG9uRGlkUmVtb3ZlTW9kID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIpID0+IHtcclxuICByZXR1cm4gYXN5bmMgKGdhbWVJZDogc3RyaW5nLCBtb2RJZDogc3RyaW5nLCByZW1vdmVPcHRzOiBJUmVtb3ZlTW9kT3B0aW9ucykgPT4ge1xyXG4gICAgaWYgKEdBTUVfSUQgIT09IGdhbWVJZCB8fCByZW1vdmVPcHRzPy53aWxsQmVSZXBsYWNlZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcbiAgICBhcHBseVRvSW5pU3RydWN0KGFwaSwgcHJpb3JpdHlNYW5hZ2VyLCBbbW9kSWRdKTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3Qgb25EaWRQdXJnZSA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudDogRGVwbG95bWVudCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKGFwaSwgcHJpb3JpdHlNYW5hZ2VyKS5yZXZlcnRMT0ZpbGUoKTtcclxuICB9O1xyXG59XHJcblxyXG5sZXQgcHJldkRlcGxveW1lbnQ6IERlcGxveW1lbnQgPSB7fTtcclxuZXhwb3J0IGNvbnN0IG9uRGlkRGVwbG95ID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIpID0+IHtcclxuICByZXR1cm4gYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50OiBEZXBsb3ltZW50KSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHZhbGlkYXRlUHJvZmlsZShwcm9maWxlSWQsIHN0YXRlKTtcclxuICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChKU09OLnN0cmluZ2lmeShwcmV2RGVwbG95bWVudCkgIT09IEpTT04uc3RyaW5naWZ5KGRlcGxveW1lbnQpKSB7XHJcbiAgICAgIHByZXZEZXBsb3ltZW50ID0gZGVwbG95bWVudDtcclxuICAgICAgcXVlcnlTY3JpcHRNZXJnZShhcGksICdZb3VyIG1vZHMgc3RhdGUvbG9hZCBvcmRlciBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHlvdSByYW4gJ1xyXG4gICAgICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyLiBZb3UgbWF5IHdhbnQgdG8gcnVuIHRoZSBtZXJnZXIgdG9vbCBhbmQgY2hlY2sgd2hldGhlciBhbnkgbmV3IHNjcmlwdCBjb25mbGljdHMgYXJlICdcclxuICAgICAgICArICdwcmVzZW50LCBvciBpZiBleGlzdGluZyBtZXJnZXMgaGF2ZSBiZWNvbWUgdW5lY2Vzc2FyeS4gUGxlYXNlIGFsc28gbm90ZSB0aGF0IGFueSBsb2FkIG9yZGVyIGNoYW5nZXMgJ1xyXG4gICAgICAgICsgJ21heSBhZmZlY3QgdGhlIG9yZGVyIGluIHdoaWNoIHlvdXIgY29uZmxpY3RpbmcgbW9kcyBhcmUgbWVhbnQgdG8gYmUgbWVyZ2VkLCBhbmQgbWF5IHJlcXVpcmUgeW91IHRvICdcclxuICAgICAgICArICdyZW1vdmUgdGhlIGV4aXN0aW5nIG1lcmdlIGFuZCByZS1hcHBseSBpdC4nKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICAgIGNvbnN0IGRvY0ZpbGVzID0gKGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXSA/PyBbXSlcclxuICAgICAgLmZpbHRlcihmaWxlID0+IGZpbGUucmVsUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWClcclxuICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcclxuICAgIGNvbnN0IG1lbnVNb2RQcm9taXNlID0gKCkgPT4ge1xyXG4gICAgICBpZiAoZG9jRmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1lbnUgbW9kcyBkZXBsb3llZCAtIHJlbW92ZSB0aGUgbW9kLlxyXG4gICAgICAgIHJldHVybiBtZW51TW9kLnJlbW92ZU1vZChhcGksIGFjdGl2ZVByb2ZpbGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBtZW51TW9kLm9uRGlkRGVwbG95KGFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgICAgIC50aGVuKGFzeW5jIG1vZElkID0+IHtcclxuICAgICAgICAgICAgaWYgKG1vZElkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQoYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHRydWUpKTtcclxuICAgICAgICAgICAgYXdhaXQgYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBtb2RJZCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBtZW51TW9kUHJvbWlzZSgpXHJcbiAgICAgIC50aGVuKCgpID0+IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLnNldElOSVN0cnVjdChsb2FkT3JkZXIsIHByaW9yaXR5TWFuYWdlcikpXHJcbiAgICAgIC50aGVuKCgpID0+IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLndyaXRlVG9Nb2RTZXR0aW5ncygpKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgZm9yY2VSZWZyZXNoKGFwaSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZXJyID0+IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLm1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGVyciwgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG9uUHJvZmlsZVdpbGxDaGFuZ2UgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJpb3JpdHlUeXBlKHByaW9yaXR5VHlwZSkpO1xyXG5cclxuICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBwcm9maWxlLmdhbWVJZCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShhcGksIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGFwaSwgcHJvZmlsZS5pZCkpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKSkge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzdG9yZSBwcm9maWxlIHNwZWNpZmljIG1lcmdlZCBpdGVtcycsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBvblNldHRpbmdzQ2hhbmdlID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIpID0+IHtcclxuICByZXR1cm4gYXN5bmMgKHByZXY6IHN0cmluZywgY3VycmVudDogYW55KSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgIHByaW9yaXR5TWFuYWdlci5wcmlvcml0eVR5cGUgPSBwcmlvcml0eVR5cGU7XHJcbiAgICBhcGkuZXZlbnRzLm9uKCdwdXJnZS1tb2RzJywgKCkgPT4ge1xyXG4gICAgICBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS5yZXZlcnRMT0ZpbGUoKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHNjcmlwdE1lcmdlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghIXNjcmlwdE1lcmdlcj8ucGF0aCkge1xyXG4gICAgcmV0dXJuIHNjcmlwdE1lcmdlcjtcclxuICB9XHJcblxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1blNjcmlwdE1lcmdlcihhcGkpIHtcclxuICBjb25zdCB0b29sID0gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpO1xyXG4gIGlmICh0b29sPy5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRoaXMubm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGFwaS5ydW5FeGVjdXRhYmxlKHRvb2wucGF0aCwgW10sIHsgc3VnZ2VzdERlcGxveTogdHJ1ZSB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcnVuIHRvb2wnLCBlcnIsXHJcbiAgICAgIHsgYWxsb3dSZXBvcnQ6IFsnRVBFUk0nLCAnRUFDQ0VTUycsICdFTk9FTlQnXS5pbmRleE9mKGVyci5jb2RlKSAhPT0gLTEgfSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBxdWVyeVNjcmlwdE1lcmdlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcmVhc29uOiBzdHJpbmcpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIGlmICgoc3RhdGUuc2Vzc2lvbi5iYXNlLmFjdGl2aXR5Py5pbnN0YWxsaW5nX2RlcGVuZGVuY2llcyA/PyBbXSkubGVuZ3RoID4gMCkge1xyXG4gICAgLy8gRG8gbm90IGJ1ZyB1c2VycyB3aGlsZSB0aGV5J3JlIGluc3RhbGxpbmcgYSBjb2xsZWN0aW9uLlxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnd2l0Y2hlcjMtbWVyZ2UnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIG1lc3NhZ2U6IHQoJ1dpdGNoZXIgU2NyaXB0IG1lcmdlciBtYXkgbmVlZCB0byBiZSBleGVjdXRlZCcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMnLCB7XHJcbiAgICAgICAgICAgICAgdGV4dDogcmVhc29uLFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ1J1biB0b29sJyxcclxuICAgICAgICAgIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICAgIHJ1blNjcmlwdE1lcmdlcihhcGkpO1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5ub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgfVxyXG59Il19