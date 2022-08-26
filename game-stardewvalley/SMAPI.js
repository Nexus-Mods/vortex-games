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
        const APIKEY = vortex_api_1.util.getSafe(api.store.getState(), ['confidential', 'account', 'nexus', 'APIKey'], '');
        try {
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
            api.events.emit('start-download', [nxmUrl], dlInfo, undefined, (err, id) => {
                if (err) {
                    throw err;
                }
                api.events.emit('start-install-download', id, undefined, (err, mId) => {
                    if (err) {
                        throw err;
                    }
                    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(api.getState(), common_1.GAME_ID);
                    api.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, mId, true));
                    api.events.emit('deploy-mods', () => {
                        api.events.emit('start-quick-discovery', () => {
                            var _a;
                            api.dismissNotification('smapi-installing');
                            const discovery = vortex_api_1.selectors.discoveryByGame(api.getState(), common_1.GAME_ID);
                            const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
                            if (tool) {
                                api.store.dispatch(vortex_api_1.actions.setPrimaryTool(common_1.GAME_ID, tool.id));
                            }
                        });
                    });
                });
            });
        }
        catch (err) {
            api.dismissNotification('smapi-installing');
            api.showErrorNotification('Failed to download/install SMAPI', err);
            vortex_api_1.util.opn(exports.SMAPI_URL).catch(err => null);
        }
    });
}
exports.downloadSMAPI = downloadSMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxxRUFBMEM7QUFDMUMsMkNBQTZEO0FBQzdELHFDQUFtQztBQUN0QixRQUFBLFNBQVMsR0FBRyxtREFBbUQsQ0FBQztBQUU3RSxTQUFzQixhQUFhLENBQUMsR0FBd0I7O1FBQzFELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN6QyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDbkIsRUFBRSxFQUFFLGtCQUFrQjtZQUN0QixPQUFPLEVBQUUsa0JBQWtCO1lBQzNCLElBQUksRUFBRSxVQUFVO1lBQ2hCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsYUFBYSxFQUFFLEtBQUs7U0FDckIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RHLElBQUk7WUFDRixJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQzthQUNyQztZQUNELE1BQU0sS0FBSyxHQUFHLElBQUksbUJBQU0sQ0FBQyxRQUFRLEVBQUUsaUJBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxPQUFPLEVBQUUsZ0JBQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRixNQUFNLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0IsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDeEQsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFN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cG9ydCB7IGFjdGlvbnMsIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuZXhwb3J0IGNvbnN0IFNNQVBJX1VSTCA9ICdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3N0YXJkZXd2YWxsZXkvbW9kcy8yNDAwJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZFNNQVBJKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdzbWFwaS1taXNzaW5nJyk7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6ICdzbWFwaS1pbnN0YWxsaW5nJyxcclxuICAgIG1lc3NhZ2U6ICdJbnN0YWxsaW5nIFNNQVBJJyxcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICB9KTtcclxuICBjb25zdCBBUElLRVkgPSB1dGlsLmdldFNhZmUoYXBpLnN0b3JlLmdldFN0YXRlKCksIFsnY29uZmlkZW50aWFsJywgJ2FjY291bnQnLCAnbmV4dXMnLCAnQVBJS2V5J10sICcnKTtcclxuICB0cnkge1xyXG4gICAgaWYgKCFBUElLRVkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBBUEkga2V5IGZvdW5kJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBuZXh1cyA9IG5ldyBOZXh1c1QoJ1ZvcnRleCcsIHV0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9uLCBHQU1FX0lELCAzMDAwMCk7XHJcbiAgICBhd2FpdCBuZXh1cy5zZXRLZXkoQVBJS0VZKTtcclxuICAgIGNvbnN0IG1vZEZpbGVzID0gYXdhaXQgbmV4dXMuZ2V0TW9kRmlsZXMoMjQwMCwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBmaWxlID0gbW9kRmlsZXMuZmlsZXMucmVkdWNlKChhY2MsIGN1cikgPT4ge1xyXG4gICAgICBpZiAoIWFjYykge1xyXG4gICAgICAgIGFjYyA9IGN1cjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoTnVtYmVyLnBhcnNlSW50KGN1ci51cGxvYWRlZF90aW1lLCAxMCkgPiBOdW1iZXIucGFyc2VJbnQoYWNjLnVwbG9hZGVkX3RpbWUpLCAxMCkge1xyXG4gICAgICAgICAgYWNjID0gY3VyO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwgdW5kZWZpbmVkKTtcclxuICAgIGNvbnN0IGRsSW5mbyA9IHtcclxuICAgICAgZ2FtZTogR0FNRV9JRCxcclxuICAgICAgbmFtZTogJ1NNQVBJJyxcclxuICAgIH07XHJcbiAgICBjb25zdCBueG1VcmwgPSBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLzI0MDAvZmlsZXMvJHtmaWxlLmZpbGVfaWR9YDtcclxuICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtZG93bmxvYWQnLCBbbnhtVXJsXSwgZGxJbmZvLCB1bmRlZmluZWQsIChlcnIsIGlkKSA9PiB7XHJcbiAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgIH1cclxuICAgICAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1pbnN0YWxsLWRvd25sb2FkJywgaWQsIHVuZGVmaW5lZCwgKGVyciwgbUlkKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGVJZCwgbUlkLCB0cnVlKSk7XHJcbiAgICAgICAgYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsICgpID0+IHtcclxuICAgICAgICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtcXVpY2stZGlzY292ZXJ5JywgKCkgPT4ge1xyXG4gICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktaW5zdGFsbGluZycpO1xyXG4gICAgICAgICAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgICAgICAgICAgY29uc3QgdG9vbCA9IGRpc2NvdmVyeT8udG9vbHM/Llsnc21hcGknXTtcclxuICAgICAgICAgICAgaWYgKHRvb2wpIHtcclxuICAgICAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCB0b29sLmlkKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLWluc3RhbGxpbmcnKTtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBkb3dubG9hZC9pbnN0YWxsIFNNQVBJJywgZXJyKTtcclxuICAgIHV0aWwub3BuKFNNQVBJX1VSTCkuY2F0Y2goZXJyID0+IG51bGwpO1xyXG4gIH1cclxufVxyXG4iXX0=