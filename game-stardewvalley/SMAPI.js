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
exports.downloadSMAPI = exports.SMAPI_URL = void 0;
const nexus_api_1 = __importDefault(require("@nexusmods/nexus-api"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
exports.SMAPI_URL = 'https://www.nexusmods.com/stardewvalley/mods/2400';
function downloadSMAPI(api) {
    return __awaiter(this, void 0, void 0, function* () {
        api.dismissNotification('smapi-missing');
        api.sendNotification({
            id: 'smapi-installing',
            message: 'Installing SMAPI',
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
            const modFiles = yield nexus.getModFiles(2400, common_1.GAME_ID);
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
            const nxmUrl = `nxm://${common_1.GAME_ID}/mods/2400/files/${file.file_id}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxxRUFBMEM7QUFDMUMsMkNBQTZEO0FBQzdELHFDQUFtQztBQUN0QixRQUFBLFNBQVMsR0FBRyxtREFBbUQsQ0FBQztBQUU3RSxTQUFzQixhQUFhLENBQUMsR0FBd0I7O1FBQzFELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN6QyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDbkIsRUFBRSxFQUFFLGtCQUFrQjtZQUN0QixPQUFPLEVBQUUsa0JBQWtCO1lBQzNCLElBQUksRUFBRSxVQUFVO1lBQ2hCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsYUFBYSxFQUFFLEtBQUs7U0FDckIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckcsTUFBTSxVQUFVLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkcsTUFBTSxVQUFVLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkcsTUFBTSxNQUFNLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUs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RCxJQUFJLFdBQVcsRUFBRTtnQkFDZixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsb0JBQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUN0RDtZQUNELGlCQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztTQUNsRDtJQUNILENBQUM7Q0FBQTtBQXRGRCxzQ0FzRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTmV4dXNUIGZyb20gJ0BuZXh1c21vZHMvbmV4dXMtYXBpJztcclxuaW1wb3J0IHsgYWN0aW9ucywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5leHBvcnQgY29uc3QgU01BUElfVVJMID0gJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vc3RhcmRld3ZhbGxleS9tb2RzLzI0MDAnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkU01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ3NtYXBpLWluc3RhbGxpbmcnLFxyXG4gICAgbWVzc2FnZTogJ0luc3RhbGxpbmcgU01BUEknLFxyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gIH0pO1xyXG4gIGNvbnN0IGF1dG9JbnN0YWxsID0gdXRpbC5nZXRTYWZlKGFwaS5zdG9yZS5nZXRTdGF0ZSgpLCBbJ3NldHRpbmdzJywgJ2F1dG9tYXRpb24nLCAnaW5zdGFsbCddLCBmYWxzZSk7XHJcbiAgY29uc3QgYXV0b0RlcGxveSA9IHV0aWwuZ2V0U2FmZShhcGkuc3RvcmUuZ2V0U3RhdGUoKSwgWydzZXR0aW5ncycsICdhdXRvbWF0aW9uJywgJ2RlcGxveSddLCBmYWxzZSk7XHJcbiAgY29uc3QgYXV0b0VuYWJsZSA9IHV0aWwuZ2V0U2FmZShhcGkuc3RvcmUuZ2V0U3RhdGUoKSwgWydzZXR0aW5ncycsICdhdXRvbWF0aW9uJywgJ2VuYWJsZSddLCBmYWxzZSk7XHJcbiAgY29uc3QgQVBJS0VZID0gdXRpbC5nZXRTYWZlKGFwaS5zdG9yZS5nZXRTdGF0ZSgpLCBbJ2NvbmZpZGVudGlhbCcsICdhY2NvdW50JywgJ25leHVzJywgJ0FQSUtleSddLCAnJyk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGF1dG9tYXRpb25BY3Rpb25zID0gW107XHJcbiAgICBpZiAoYXV0b0luc3RhbGwpIHtcclxuICAgICAgYXV0b21hdGlvbkFjdGlvbnMucHVzaChhY3Rpb25zLnNldEF1dG9JbnN0YWxsKGZhbHNlKSk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXV0b0RlcGxveSkge1xyXG4gICAgICBhdXRvbWF0aW9uQWN0aW9ucy5wdXNoKGFjdGlvbnMuc2V0QXV0b0RlcGxveW1lbnQoZmFsc2UpKTtcclxuICAgIH1cclxuICAgIGlmIChhdXRvbWF0aW9uQWN0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHV0aWwuYmF0Y2hEaXNwYXRjaChhcGkuc3RvcmUsIGF1dG9tYXRpb25BY3Rpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIUFQSUtFWSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIEFQSSBrZXkgZm91bmQnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG5leHVzID0gbmV3IE5leHVzVCgnVm9ydGV4JywgdXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb24sIEdBTUVfSUQsIDMwMDAwKTtcclxuICAgIGF3YWl0IG5leHVzLnNldEtleShBUElLRVkpO1xyXG4gICAgY29uc3QgbW9kRmlsZXMgPSBhd2FpdCBuZXh1cy5nZXRNb2RGaWxlcygyNDAwLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGZpbGUgPSBtb2RGaWxlcy5maWxlcy5yZWR1Y2UoKGFjYywgY3VyKSA9PiB7XHJcbiAgICAgIGlmICghYWNjKSB7XHJcbiAgICAgICAgYWNjID0gY3VyO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChOdW1iZXIucGFyc2VJbnQoY3VyLnVwbG9hZGVkX3RpbWUsIDEwKSA+IE51bWJlci5wYXJzZUludChhY2MudXBsb2FkZWRfdGltZSksIDEwKSB7XHJcbiAgICAgICAgICBhY2MgPSBjdXI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2M7XHJcbiAgICB9LCB1bmRlZmluZWQpO1xyXG4gICAgY29uc3QgZGxJbmZvID0ge1xyXG4gICAgICBnYW1lOiBHQU1FX0lELFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IG54bVVybCA9IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvMjQwMC9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gO1xyXG4gICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWRvd25sb2FkJywgW254bVVybF0sIGRsSW5mbywgdW5kZWZpbmVkLCAoZXJyLCBpZCkgPT4ge1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1pbnN0YWxsLWRvd25sb2FkJywgaWQsIHVuZGVmaW5lZCwgKGVyciwgbUlkKSA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgICAgICAgaWYgKCFhdXRvRW5hYmxlKSB7XHJcbiAgICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZUlkLCBtSWQsIHRydWUpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtcXVpY2stZGlzY292ZXJ5JywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bJ3NtYXBpJ107XHJcbiAgICAgICAgICAgICAgaWYgKHRvb2wpIHtcclxuICAgICAgICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHRvb2wuaWQpKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBkb3dubG9hZC9pbnN0YWxsIFNNQVBJJywgZXJyKTtcclxuICAgIHV0aWwub3BuKFNNQVBJX1VSTCkuY2F0Y2goZXJyID0+IG51bGwpO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktaW5zdGFsbGluZycpO1xyXG4gICAgY29uc3QgYXV0b21hdGlvbkFjdGlvbnMgPSBbXTtcclxuICAgIGlmIChhdXRvRGVwbG95KSB7XHJcbiAgICAgIGF1dG9tYXRpb25BY3Rpb25zLnB1c2goYWN0aW9ucy5zZXRBdXRvRGVwbG95bWVudCh0cnVlKSk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXV0b0luc3RhbGwpIHtcclxuICAgICAgYXV0b21hdGlvbkFjdGlvbnMucHVzaChhY3Rpb25zLnNldEF1dG9JbnN0YWxsKHRydWUpKTtcclxuICAgIH1cclxuICAgIHV0aWwuYmF0Y2hEaXNwYXRjaChhcGkuc3RvcmUsIGF1dG9tYXRpb25BY3Rpb25zKTtcclxuICB9XHJcbn1cclxuIl19