"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const menuMod = __importStar(require("./menumod"));
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
        if (activeProfile === undefined || (0, util_1.suppressEventHandlers)(api)) {
            return Promise.resolve();
        }
        return menuMod.onWillDeploy(api, deployment, activeProfile)
            .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
            ? Promise.resolve()
            : Promise.reject(err));
    });
};
exports.onWillDeploy = onWillDeploy;
const applyToIniStruct = (api, getPriorityManager, modIds) => {
    const currentLO = (0, migrations_1.getPersistentLoadOrder)(api);
    const newLO = [...currentLO.filter(entry => !modIds.includes(entry.modId))];
    iniParser_1.default.getInstance(api, getPriorityManager).setINIStruct(newLO).then(() => (0, util_1.forceRefresh)(api));
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
const onDidDeploy = (api) => {
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
                return menuMod.removeMenuMod(api, activeProfile);
            }
            else {
                return menuMod.onDidDeploy(api, deployment, activeProfile)
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
            .then(() => iniParser_1.default.getInstance().setINIStruct(loadOrder))
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
        priorityManager().priorityType = priorityType;
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
        (0, util_1.notifyMissingScriptMerger)(api);
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
        (0, util_1.notifyMissingScriptMerger)(api);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRIYW5kbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV2ZW50SGFuZGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkQ7QUFFN0QsdUNBQTRDO0FBRTVDLHFDQUdrQjtBQUVsQixtREFBcUM7QUFDckMsK0NBQW1FO0FBQ25FLGlDQUF5RztBQUl6Ryw0REFBdUM7QUFDdkMsNkNBQXNEO0FBSXRELFNBQWdCLG9CQUFvQixDQUFDLEdBQXdCO0lBQzNELE9BQU8sQ0FBTyxRQUFnQixFQUFFLEVBQUU7UUFDaEMsSUFBSSxRQUFRLEtBQUssZ0JBQU8sRUFBRTtZQUd4QixHQUFHLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUMzQzthQUFNO1lBQ0wsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzdCLE1BQU0sVUFBVSxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sVUFBVSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE1BQU0sWUFBWSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFBLDhCQUFxQixHQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEYsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBQSx5QkFBZSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDbEQsSUFBSSxVQUFVLE1BQUssVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFFLEVBQUUsQ0FBQSxFQUFFO2dCQUNqQyxJQUFJO29CQUNGLE1BQU0sSUFBQSw0QkFBYyxFQUFDLEdBQUcsRUFBRSxVQUFVLENBQUM7eUJBQ2xDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLGdDQUFr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QUNGO2dCQUNEO29CQUNFLEtBQUssRUFBRSxVQUFVO29CQUNqQixNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUU7d0JBQ2hCLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDckIsT0FBTyxFQUFFLENBQUM7b0JBQ1osQ0FBQztpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0tBQ0o7U0FBTTtRQUNMLElBQUEsZ0NBQXlCLEVBQUMsR0FBRyxDQUFDLENBQUM7S0FDaEM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHsgYWN0aW9ucywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmltcG9ydCB7XHJcbiAgR0FNRV9JRCwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoLCBQQVJUX1NVRkZJWCxcclxuICBJTlBVVF9YTUxfRklMRU5BTUUsIFNDUklQVF9NRVJHRVJfSUQsIEkxOE5fTkFNRVNQQUNFXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0ICogYXMgbWVudU1vZCBmcm9tICcuL21lbnVtb2QnO1xyXG5pbXBvcnQgeyBzdG9yZVRvUHJvZmlsZSwgcmVzdG9yZUZyb21Qcm9maWxlIH0gZnJvbSAnLi9tZXJnZUJhY2t1cCc7XHJcbmltcG9ydCB7IHZhbGlkYXRlUHJvZmlsZSwgZm9yY2VSZWZyZXNoLCBzdXBwcmVzc0V2ZW50SGFuZGxlcnMsIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIgfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcbmltcG9ydCB7IElSZW1vdmVNb2RPcHRpb25zIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG50eXBlIERlcGxveW1lbnQgPSB7IFttb2RUeXBlOiBzdHJpbmddOiB0eXBlcy5JRGVwbG95ZWRGaWxlW10gfTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvbkdhbWVNb2RlQWN0aXZhdGlvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICByZXR1cm4gYXN5bmMgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAvLyBKdXN0IGluIGNhc2UgdGhlIHNjcmlwdCBtZXJnZXIgbm90aWZpY2F0aW9uIGlzIHN0aWxsXHJcbiAgICAgIC8vICBwcmVzZW50LlxyXG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignd2l0Y2hlcjMtbWVyZ2UnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBnYW1lTW9kZSk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcclxuICAgICAgaWYgKGxhc3RQcm9mSWQgIT09IGFjdGl2ZVByb2Y/LmlkKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGFwaSwgbGFzdFByb2ZJZClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGFwaSwgYWN0aXZlUHJvZj8uaWQpKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZXN0b3JlIHByb2ZpbGUgbWVyZ2VkIGZpbGVzJywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBvbldpbGxEZXBsb3kgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudDogRGVwbG95bWVudCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkIHx8IHN1cHByZXNzRXZlbnRIYW5kbGVycyhhcGkpKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbWVudU1vZC5vbldpbGxEZXBsb3koYXBpLCBkZXBsb3ltZW50LCBhY3RpdmVQcm9maWxlKVxyXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGFwcGx5VG9JbmlTdHJ1Y3QgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnZXRQcmlvcml0eU1hbmFnZXI6ICgpID0+IFByaW9yaXR5TWFuYWdlciwgbW9kSWRzOiBzdHJpbmdbXSkgPT4ge1xyXG4gIGNvbnN0IGN1cnJlbnRMTyA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICBjb25zdCBuZXdMTzogdHlwZXMuSUxvYWRPcmRlckVudHJ5W10gPSBbLi4uY3VycmVudExPLmZpbHRlcihlbnRyeSA9PiAhbW9kSWRzLmluY2x1ZGVzKGVudHJ5Lm1vZElkKSldO1xyXG4gIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZShhcGksIGdldFByaW9yaXR5TWFuYWdlcikuc2V0SU5JU3RydWN0KG5ld0xPKS50aGVuKCgpID0+IGZvcmNlUmVmcmVzaChhcGkpKTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG9uTW9kc0Rpc2FibGVkID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBQcmlvcml0eU1hbmFnZXIpID0+IHtcclxuICByZXR1cm4gYXN5bmMgKG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4sIGdhbWVJZDogc3RyaW5nKSA9PiB7XHJcbiAgICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGVuYWJsZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYXBwbHlUb0luaVN0cnVjdChhcGksIHByaW9yaXR5TWFuYWdlciwgbW9kSWRzKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBvbkRpZFJlbW92ZU1vZCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyKSA9PiB7XHJcbiAgcmV0dXJuIGFzeW5jIChnYW1lSWQ6IHN0cmluZywgbW9kSWQ6IHN0cmluZywgcmVtb3ZlT3B0czogSVJlbW92ZU1vZE9wdGlvbnMpID0+IHtcclxuICAgIGlmIChHQU1FX0lEICE9PSBnYW1lSWQgfHwgcmVtb3ZlT3B0cz8ud2lsbEJlUmVwbGFjZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG4gICAgYXBwbHlUb0luaVN0cnVjdChhcGksIHByaW9yaXR5TWFuYWdlciwgW21vZElkXSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IG9uRGlkUHVyZ2UgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eU1hbmFnZXI6ICgpID0+IFByaW9yaXR5TWFuYWdlcikgPT4ge1xyXG4gIHJldHVybiBhc3luYyAocHJvZmlsZUlkOiBzdHJpbmcsIGRlcGxveW1lbnQ6IERlcGxveW1lbnQpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZShhcGksIHByaW9yaXR5TWFuYWdlcikucmV2ZXJ0TE9GaWxlKCk7XHJcbiAgfTtcclxufVxyXG5cclxubGV0IHByZXZEZXBsb3ltZW50OiBEZXBsb3ltZW50ID0ge307XHJcbmV4cG9ydCBjb25zdCBvbkRpZERlcGxveSA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50OiBEZXBsb3ltZW50KSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHZhbGlkYXRlUHJvZmlsZShwcm9maWxlSWQsIHN0YXRlKTtcclxuICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChKU09OLnN0cmluZ2lmeShwcmV2RGVwbG95bWVudCkgIT09IEpTT04uc3RyaW5naWZ5KGRlcGxveW1lbnQpKSB7XHJcbiAgICAgIHByZXZEZXBsb3ltZW50ID0gZGVwbG95bWVudDtcclxuICAgICAgcXVlcnlTY3JpcHRNZXJnZShhcGksICdZb3VyIG1vZHMgc3RhdGUvbG9hZCBvcmRlciBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHlvdSByYW4gJ1xyXG4gICAgICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyLiBZb3UgbWF5IHdhbnQgdG8gcnVuIHRoZSBtZXJnZXIgdG9vbCBhbmQgY2hlY2sgd2hldGhlciBhbnkgbmV3IHNjcmlwdCBjb25mbGljdHMgYXJlICdcclxuICAgICAgICArICdwcmVzZW50LCBvciBpZiBleGlzdGluZyBtZXJnZXMgaGF2ZSBiZWNvbWUgdW5lY2Vzc2FyeS4gUGxlYXNlIGFsc28gbm90ZSB0aGF0IGFueSBsb2FkIG9yZGVyIGNoYW5nZXMgJ1xyXG4gICAgICAgICsgJ21heSBhZmZlY3QgdGhlIG9yZGVyIGluIHdoaWNoIHlvdXIgY29uZmxpY3RpbmcgbW9kcyBhcmUgbWVhbnQgdG8gYmUgbWVyZ2VkLCBhbmQgbWF5IHJlcXVpcmUgeW91IHRvICdcclxuICAgICAgICArICdyZW1vdmUgdGhlIGV4aXN0aW5nIG1lcmdlIGFuZCByZS1hcHBseSBpdC4nKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICAgIGNvbnN0IGRvY0ZpbGVzID0gKGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXSA/PyBbXSlcclxuICAgICAgLmZpbHRlcihmaWxlID0+IGZpbGUucmVsUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWClcclxuICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcclxuICAgIGNvbnN0IG1lbnVNb2RQcm9taXNlID0gKCkgPT4ge1xyXG4gICAgICBpZiAoZG9jRmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1lbnUgbW9kcyBkZXBsb3llZCAtIHJlbW92ZSB0aGUgbW9kLlxyXG4gICAgICAgIHJldHVybiBtZW51TW9kLnJlbW92ZU1lbnVNb2QoYXBpLCBhY3RpdmVQcm9maWxlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbWVudU1vZC5vbkRpZERlcGxveShhcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgICAudGhlbihhc3luYyAobW9kSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBpZiAobW9kSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChhY3RpdmVQcm9maWxlLmlkLCBtb2RJZCwgdHJ1ZSkpO1xyXG4gICAgICAgICAgICBhd2FpdCBhcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIG1vZElkLCB0cnVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIG1lbnVNb2RQcm9taXNlKClcclxuICAgICAgLnRoZW4oKCkgPT4gSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkuc2V0SU5JU3RydWN0KGxvYWRPcmRlcikpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBmb3JjZVJlZnJlc2goYXBpKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkubW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyLCAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgb25Qcm9maWxlV2lsbENoYW5nZSA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcblxyXG4gICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGFwaSwgbGFzdFByb2ZJZClcclxuICAgICAgICAudGhlbigoKSA9PiByZXN0b3JlRnJvbVByb2ZpbGUoYXBpLCBwcm9maWxlLmlkKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpKSB7XHJcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgbWVyZ2VkIGl0ZW1zJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG9uU2V0dGluZ3NDaGFuZ2UgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eU1hbmFnZXI6ICgpID0+IFByaW9yaXR5TWFuYWdlcikgPT4ge1xyXG4gIHJldHVybiBhc3luYyAocHJldjogc3RyaW5nLCBjdXJyZW50OiBhbnkpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBwcmlvcml0eU1hbmFnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgcHJpb3JpdHlNYW5hZ2VyKCkucHJpb3JpdHlUeXBlID0gcHJpb3JpdHlUeXBlO1xyXG4gICAgYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcclxuICAgICAgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkucmV2ZXJ0TE9GaWxlKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFNjcmlwdE1lcmdlclRvb2woYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXI/LnBhdGgpIHtcclxuICAgIHJldHVybiBzY3JpcHRNZXJnZXI7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5TY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3QgdG9vbCA9IGdldFNjcmlwdE1lcmdlclRvb2woYXBpKTtcclxuICBpZiAodG9vbD8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXBpLnJ1bkV4ZWN1dGFibGUodG9vbC5wYXRoLCBbXSwgeyBzdWdnZXN0RGVwbG95OiB0cnVlIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBydW4gdG9vbCcsIGVycixcclxuICAgICAgeyBhbGxvd1JlcG9ydDogWydFUEVSTScsICdFQUNDRVNTJywgJ0VOT0VOVCddLmluZGV4T2YoZXJyLmNvZGUpICE9PSAtMSB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHF1ZXJ5U2NyaXB0TWVyZ2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCByZWFzb246IHN0cmluZykge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgaWYgKChzdGF0ZS5zZXNzaW9uLmJhc2UuYWN0aXZpdHk/Lmluc3RhbGxpbmdfZGVwZW5kZW5jaWVzID8/IFtdKS5sZW5ndGggPiAwKSB7XHJcbiAgICAvLyBEbyBub3QgYnVnIHVzZXJzIHdoaWxlIHRoZXkncmUgaW5zdGFsbGluZyBhIGNvbGxlY3Rpb24uXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6ICd3aXRjaGVyMy1tZXJnZScsXHJcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgbWVzc2FnZTogdCgnV2l0Y2hlciBTY3JpcHQgbWVyZ2VyIG1heSBuZWVkIHRvIGJlIGV4ZWN1dGVkJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMycsIHtcclxuICAgICAgICAgICAgICB0ZXh0OiByZWFzb24sXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnUnVuIHRvb2wnLFxyXG4gICAgICAgICAgYWN0aW9uOiBkaXNtaXNzID0+IHtcclxuICAgICAgICAgICAgcnVuU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgfVxyXG59Il19