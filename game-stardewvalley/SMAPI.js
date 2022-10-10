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
exports.downloadSMAPI = exports.deploySMAPI = exports.findSMAPIMod = exports.SMAPI_URL = exports.SMAPI_MOD_ID = void 0;
const nexus_api_1 = __importDefault(require("@nexusmods/nexus-api"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const semver_1 = require("semver");
exports.SMAPI_MOD_ID = 2400;
exports.SMAPI_URL = `https://www.nexusmods.com/stardewvalley/mods/${exports.SMAPI_MOD_ID}`;
function findSMAPIMod(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const profile = vortex_api_1.selectors.profileById(state, profileId);
    const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
    const isSMAPI = (mod) => { var _a; return mod.type === 'SMAPI' && ((_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.modId) === 2400; };
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const SMAPIMods = Object.values(mods).filter((mod) => isSMAPI(mod) && isActive(mod.id));
    return (SMAPIMods.length === 0)
        ? undefined
        : SMAPIMods.length > 1
            ? SMAPIMods.reduce((prev, iter) => {
                if (prev === undefined) {
                    return iter;
                }
                return ((0, semver_1.gte)(iter.attributes.version, prev.attributes.version)) ? iter : prev;
            }, undefined)
            : SMAPIMods[0];
}
exports.findSMAPIMod = findSMAPIMod;
function deploySMAPI(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            api.events.emit('deploy-mods', () => {
                api.events.emit('start-quick-discovery', () => {
                    var _a;
                    const discovery = vortex_api_1.selectors.discoveryByGame(api.getState(), common_1.GAME_ID);
                    const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
                    if (tool) {
                        api.store.dispatch(vortex_api_1.actions.setPrimaryTool(common_1.GAME_ID, tool.id));
                    }
                    return resolve();
                });
            });
        });
    });
}
exports.deploySMAPI = deploySMAPI;
function downloadSMAPI(api, update) {
    return __awaiter(this, void 0, void 0, function* () {
        api.dismissNotification('smapi-missing');
        api.sendNotification({
            id: 'smapi-installing',
            message: update ? 'Updating SMAPI' : 'Installing SMAPI',
            type: 'activity',
            noDismiss: true,
            allowSuppress: false,
        });
        const autoInstall = vortex_api_1.util.getSafe(api.store.getState(), ['settings', 'automation', 'install'], false);
        const autoDeploy = vortex_api_1.util.getSafe(api.store.getState(), ['settings', 'automation', 'deploy'], false);
        const autoEnable = vortex_api_1.util.getSafe(api.store.getState(), ['settings', 'automation', 'enable'], false);
        const APIKEY = vortex_api_1.util.getSafe(api.store.getState(), ['confidential', 'account', 'nexus', 'APIKey'], '');
        try {
            const automationActions = [];
            if (autoInstall) {
                automationActions.push(vortex_api_1.actions.setAutoInstall(false));
            }
            if (autoDeploy) {
                automationActions.push(vortex_api_1.actions.setAutoDeployment(false));
            }
            if (automationActions.length > 0) {
                vortex_api_1.util.batchDispatch(api.store, automationActions);
            }
            if (!APIKEY) {
                throw new Error('No API key found');
            }
            const nexus = new nexus_api_1.default('Vortex', vortex_api_1.util.getApplication().version, common_1.GAME_ID, 30000);
            yield nexus.setKey(APIKEY);
            const modFiles = yield nexus.getModFiles(exports.SMAPI_MOD_ID, common_1.GAME_ID);
            const file = modFiles.files.reduce((acc, cur) => {
                if (!acc) {
                    acc = cur;
                }
                else {
                    if (Number.parseInt(cur.uploaded_time, 10) > Number.parseInt(acc.uploaded_time), 10) {
                        acc = cur;
                    }
                }
                return acc;
            }, undefined);
            const dlInfo = {
                game: common_1.GAME_ID,
                name: 'SMAPI',
            };
            const nxmUrl = `nxm://${common_1.GAME_ID}/mods/${exports.SMAPI_MOD_ID}/files/${file.file_id}`;
            yield new Promise((resolve, reject) => {
                api.events.emit('start-download', [nxmUrl], dlInfo, undefined, (err, id) => {
                    if (err) {
                        return reject(err);
                    }
                    api.events.emit('start-install-download', id, undefined, (err, mId) => {
                        if (err) {
                            return reject(err);
                        }
                        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(api.getState(), common_1.GAME_ID);
                        if (!autoEnable) {
                            api.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, mId, true));
                        }
                        return resolve(deploySMAPI(api));
                    });
                });
            });
        }
        catch (err) {
            api.showErrorNotification('Failed to download/install SMAPI', err);
            vortex_api_1.util.opn(exports.SMAPI_URL).catch(err => null);
        }
        finally {
            api.dismissNotification('smapi-installing');
            const automationActions = [];
            if (autoDeploy) {
                automationActions.push(vortex_api_1.actions.setAutoDeployment(true));
            }
            if (autoInstall) {
                automationActions.push(vortex_api_1.actions.setAutoInstall(true));
            }
            vortex_api_1.util.batchDispatch(api.store, automationActions);
        }
    });
}
exports.downloadSMAPI = downloadSMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxxRUFBMEM7QUFDMUMsMkNBQTZEO0FBQzdELHFDQUFtQztBQUNuQyxtQ0FBNkI7QUFFaEIsUUFBQSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFFBQUEsU0FBUyxHQUFHLGdEQUFnRCxvQkFBWSxFQUFFLENBQUM7QUFFeEYsU0FBZ0IsWUFBWSxDQUFDLEdBQXdCO0lBQ25ELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7SUFDckUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pHLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBZSxFQUFFLEVBQUUsV0FDbEMsT0FBQSxHQUFHLENBQUMsSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsS0FBSyxNQUFLLElBQUksQ0FBQSxFQUFBLENBQUM7SUFDekQsTUFBTSxJQUFJLEdBQW9DLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZHLE1BQU0sU0FBUyxHQUFpQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFD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QUM7d0JBQzlFLElBQUksQ0FBQyxVQUFVLEVBQUU7NEJBQ2YsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO3lCQUNqRTt3QkFDRCxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbkMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztTQUNKO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkUsaUJBQUksQ0FBQyxHQUFHLENBQUMsaUJBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hDO2dCQUFTO1lBQ1IsR0FBRyxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDNUMsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFDN0IsSUFBSSxVQUFVLEVBQUU7Z0JBQ2QsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG9CQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUN6RDtZQUNELElBQUksV0FBVyxFQUFFO2dCQUNmLGlCQUFpQixDQUFDLElBQUksQ0FBQyxvQkFBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3REO1lBQ0QsaUJBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1NBQ2xEO0lBQ0gsQ0FBQztDQUFBO0FBN0VELHNDQTZFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBOZXh1c1QgZnJvbSAnQG5leHVzbW9kcy9uZXh1cy1hcGknO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGd0ZSB9IGZyb20gJ3NlbXZlcic7XHJcblxyXG5leHBvcnQgY29uc3QgU01BUElfTU9EX0lEID0gMjQwMDtcclxuZXhwb3J0IGNvbnN0IFNNQVBJX1VSTCA9IGBodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3N0YXJkZXd2YWxsZXkvbW9kcy8ke1NNQVBJX01PRF9JRH1gO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTTUFQSU1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiB0eXBlcy5JTW9kIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gIGNvbnN0IGlzU01BUEkgPSAobW9kOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgbW9kLnR5cGUgPT09ICdTTUFQSScgJiYgbW9kLmF0dHJpYnV0ZXM/Lm1vZElkID09PSAyNDAwO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBTTUFQSU1vZHM6IHR5cGVzLklNb2RbXSA9IE9iamVjdC52YWx1ZXMobW9kcykuZmlsdGVyKChtb2Q6IHR5cGVzLklNb2QpID0+XHJcbiAgICBpc1NNQVBJKG1vZCkgJiYgaXNBY3RpdmUobW9kLmlkKSk7XHJcblxyXG4gIHJldHVybiAoU01BUElNb2RzLmxlbmd0aCA9PT0gMClcclxuICAgID8gdW5kZWZpbmVkXHJcbiAgICA6IFNNQVBJTW9kcy5sZW5ndGggPiAxXHJcbiAgICAgID8gU01BUElNb2RzLnJlZHVjZSgocHJldiwgaXRlcikgPT4ge1xyXG4gICAgICAgIGlmIChwcmV2ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBpdGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGd0ZShpdGVyLmF0dHJpYnV0ZXMudmVyc2lvbiwgcHJldi5hdHRyaWJ1dGVzLnZlcnNpb24pKSA/IGl0ZXIgOiBwcmV2O1xyXG4gICAgICB9LCB1bmRlZmluZWQpXHJcbiAgICAgIDogU01BUElNb2RzWzBdO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVwbG95U01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XHJcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ2RlcGxveS1tb2RzJywgKCkgPT4ge1xyXG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LXF1aWNrLWRpc2NvdmVyeScsICgpID0+IHtcclxuICAgICAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgICAgICBjb25zdCB0b29sID0gZGlzY292ZXJ5Py50b29scz8uWydzbWFwaSddO1xyXG4gICAgICAgIGlmICh0b29sKSB7XHJcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCB0b29sLmlkKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkU01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCB1cGRhdGU/OiBib29sZWFuKSB7XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ3NtYXBpLWluc3RhbGxpbmcnLFxyXG4gICAgbWVzc2FnZTogdXBkYXRlID8gJ1VwZGF0aW5nIFNNQVBJJyA6ICdJbnN0YWxsaW5nIFNNQVBJJyxcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICB9KTtcclxuICBjb25zdCBhdXRvSW5zdGFsbCA9IHV0aWwuZ2V0U2FmZShhcGkuc3RvcmUuZ2V0U3RhdGUoKSwgWydzZXR0aW5ncycsICdhdXRvbWF0aW9uJywgJ2luc3RhbGwnXSwgZmFsc2UpO1xyXG4gIGNvbnN0IGF1dG9EZXBsb3kgPSB1dGlsLmdldFNhZmUoYXBpLnN0b3JlLmdldFN0YXRlKCksIFsnc2V0dGluZ3MnLCAnYXV0b21hdGlvbicsICdkZXBsb3knXSwgZmFsc2UpO1xyXG4gIGNvbnN0IGF1dG9FbmFibGUgPSB1dGlsLmdldFNhZmUoYXBpLnN0b3JlLmdldFN0YXRlKCksIFsnc2V0dGluZ3MnLCAnYXV0b21hdGlvbicsICdlbmFibGUnXSwgZmFsc2UpO1xyXG4gIGNvbnN0IEFQSUtFWSA9IHV0aWwuZ2V0U2FmZShhcGkuc3RvcmUuZ2V0U3RhdGUoKSwgWydjb25maWRlbnRpYWwnLCAnYWNjb3VudCcsICduZXh1cycsICdBUElLZXknXSwgJycpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBhdXRvbWF0aW9uQWN0aW9ucyA9IFtdO1xyXG4gICAgaWYgKGF1dG9JbnN0YWxsKSB7XHJcbiAgICAgIGF1dG9tYXRpb25BY3Rpb25zLnB1c2goYWN0aW9ucy5zZXRBdXRvSW5zdGFsbChmYWxzZSkpO1xyXG4gICAgfVxyXG4gICAgaWYgKGF1dG9EZXBsb3kpIHtcclxuICAgICAgYXV0b21hdGlvbkFjdGlvbnMucHVzaChhY3Rpb25zLnNldEF1dG9EZXBsb3ltZW50KGZhbHNlKSk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXV0b21hdGlvbkFjdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB1dGlsLmJhdGNoRGlzcGF0Y2goYXBpLnN0b3JlLCBhdXRvbWF0aW9uQWN0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFBUElLRVkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBBUEkga2V5IGZvdW5kJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBuZXh1cyA9IG5ldyBOZXh1c1QoJ1ZvcnRleCcsIHV0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9uLCBHQU1FX0lELCAzMDAwMCk7XHJcbiAgICBhd2FpdCBuZXh1cy5zZXRLZXkoQVBJS0VZKTtcclxuICAgIGNvbnN0IG1vZEZpbGVzID0gYXdhaXQgbmV4dXMuZ2V0TW9kRmlsZXMoU01BUElfTU9EX0lELCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGZpbGUgPSBtb2RGaWxlcy5maWxlcy5yZWR1Y2UoKGFjYywgY3VyKSA9PiB7XHJcbiAgICAgIGlmICghYWNjKSB7XHJcbiAgICAgICAgYWNjID0gY3VyO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChOdW1iZXIucGFyc2VJbnQoY3VyLnVwbG9hZGVkX3RpbWUsIDEwKSA+IE51bWJlci5wYXJzZUludChhY2MudXBsb2FkZWRfdGltZSksIDEwKSB7XHJcbiAgICAgICAgICBhY2MgPSBjdXI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2M7XHJcbiAgICB9LCB1bmRlZmluZWQpO1xyXG4gICAgY29uc3QgZGxJbmZvID0ge1xyXG4gICAgICBnYW1lOiBHQU1FX0lELFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IG54bVVybCA9IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvJHtTTUFQSV9NT0RfSUR9L2ZpbGVzLyR7ZmlsZS5maWxlX2lkfWA7XHJcbiAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtZG93bmxvYWQnLCBbbnhtVXJsXSwgZGxJbmZvLCB1bmRlZmluZWQsIChlcnIsIGlkKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBpZCwgdW5kZWZpbmVkLCAoZXJyLCBtSWQpID0+IHtcclxuICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgICAgICAgICBpZiAoIWF1dG9FbmFibGUpIHtcclxuICAgICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlSWQsIG1JZCwgdHJ1ZSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGVwbG95U01BUEkoYXBpKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBTTUFQSScsIGVycik7XHJcbiAgICB1dGlsLm9wbihTTUFQSV9VUkwpLmNhdGNoKGVyciA9PiBudWxsKTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLWluc3RhbGxpbmcnKTtcclxuICAgIGNvbnN0IGF1dG9tYXRpb25BY3Rpb25zID0gW107XHJcbiAgICBpZiAoYXV0b0RlcGxveSkge1xyXG4gICAgICBhdXRvbWF0aW9uQWN0aW9ucy5wdXNoKGFjdGlvbnMuc2V0QXV0b0RlcGxveW1lbnQodHJ1ZSkpO1xyXG4gICAgfVxyXG4gICAgaWYgKGF1dG9JbnN0YWxsKSB7XHJcbiAgICAgIGF1dG9tYXRpb25BY3Rpb25zLnB1c2goYWN0aW9ucy5zZXRBdXRvSW5zdGFsbCh0cnVlKSk7XHJcbiAgICB9XHJcbiAgICB1dGlsLmJhdGNoRGlzcGF0Y2goYXBpLnN0b3JlLCBhdXRvbWF0aW9uQWN0aW9ucyk7XHJcbiAgfVxyXG59XHJcbiJdfQ==