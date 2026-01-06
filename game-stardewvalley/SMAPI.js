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
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSMAPITool = findSMAPITool;
exports.getSMAPIMods = getSMAPIMods;
exports.findSMAPIMod = findSMAPIMod;
exports.deploySMAPI = deploySMAPI;
exports.downloadSMAPI = downloadSMAPI;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const semver_1 = require("semver");
const constants_1 = require("./constants");
function findSMAPITool(api) {
    var _a;
    const state = api.getState();
    const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
    const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
    return !!(tool === null || tool === void 0 ? void 0 : tool.path) ? tool : undefined;
}
function getSMAPIMods(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const profile = vortex_api_1.selectors.profileById(state, profileId);
    const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
    const isSMAPI = (mod) => { var _a; return mod.type === 'SMAPI' && ((_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.modId) === constants_1.SMAPI_MOD_ID; };
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    return Object.values(mods).filter((mod) => isSMAPI(mod) && isActive(mod.id));
}
function findSMAPIMod(api) {
    const SMAPIMods = getSMAPIMods(api);
    return (SMAPIMods.length === 0)
        ? undefined
        : SMAPIMods.length > 1
            ? SMAPIMods.reduce((prev, iter) => {
                var _a, _b, _c, _d;
                if (prev === undefined) {
                    return iter;
                }
                return ((0, semver_1.gte)((_b = (_a = iter === null || iter === void 0 ? void 0 : iter.attributes) === null || _a === void 0 ? void 0 : _a.version) !== null && _b !== void 0 ? _b : '0.0.0', (_d = (_c = prev === null || prev === void 0 ? void 0 : prev.attributes) === null || _c === void 0 ? void 0 : _c.version) !== null && _d !== void 0 ? _d : '0.0.0')) ? iter : prev;
            }, undefined)
            : SMAPIMods[0];
}
function deploySMAPI(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield vortex_api_1.util.toPromise(cb => api.events.emit('deploy-mods', cb));
        yield vortex_api_1.util.toPromise(cb => api.events.emit('start-quick-discovery', () => cb(null)));
        const discovery = vortex_api_1.selectors.discoveryByGame(api.getState(), common_1.GAME_ID);
        const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
        if (tool) {
            api.store.dispatch(vortex_api_1.actions.setPrimaryTool(common_1.GAME_ID, tool.id));
        }
    });
}
function downloadSMAPI(api, update) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        api.dismissNotification('smapi-missing');
        api.sendNotification({
            id: 'smapi-installing',
            message: update ? 'Updating SMAPI' : 'Installing SMAPI',
            type: 'activity',
            noDismiss: true,
            allowSuppress: false,
        });
        if (((_a = api.ext) === null || _a === void 0 ? void 0 : _a.ensureLoggedIn) !== undefined) {
            yield api.ext.ensureLoggedIn();
        }
        try {
            const modFiles = yield api.ext.nexusGetModFiles(common_1.GAME_ID, constants_1.SMAPI_MOD_ID);
            const fileTime = (input) => Number.parseInt(input.uploaded_time, 10);
            const file = modFiles
                .filter(file => file.category_id === 1)
                .sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];
            if (file === undefined) {
                throw new vortex_api_1.util.ProcessCanceled('No SMAPI main file found');
            }
            const dlInfo = {
                game: common_1.GAME_ID,
                name: 'SMAPI',
            };
            const nxmUrl = `nxm://${common_1.GAME_ID}/mods/${constants_1.SMAPI_MOD_ID}/files/${file.file_id}`;
            const dlId = yield vortex_api_1.util.toPromise(cb => api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, undefined, { allowInstall: false }));
            const modId = yield vortex_api_1.util.toPromise(cb => api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, cb));
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(api.getState(), common_1.GAME_ID);
            yield vortex_api_1.actions.setModsEnabled(api, profileId, [modId], true, {
                allowAutoDeploy: false,
                installed: true,
            });
            yield deploySMAPI(api);
        }
        catch (err) {
            api.showErrorNotification('Failed to download/install SMAPI', err);
            vortex_api_1.util.opn(constants_1.SMAPI_URL).catch(() => null);
        }
        finally {
            api.dismissNotification('smapi-installing');
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUtBLHNDQUtDO0FBRUQsb0NBU0M7QUFFRCxvQ0FZQztBQUVELGtDQVNDO0FBRUQsc0NBa0RDO0FBbEdELDJDQUE2RDtBQUM3RCxxQ0FBbUM7QUFDbkMsbUNBQTZCO0FBQzdCLDJDQUFzRDtBQUV0RCxTQUFnQixhQUFhLENBQUMsR0FBd0I7O0lBQ3BELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO0lBQzVELE1BQU0sSUFBSSxHQUFHLE1BQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLEtBQUssMENBQUcsT0FBTyxDQUFDLENBQUM7SUFDekMsT0FBTyxDQUFDLENBQUMsQ0FBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsSUFBSSxDQUFBLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3pDLENBQUM7QUFFRCxTQUFnQixZQUFZLENBQUMsR0FBd0I7SUFDbkQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENB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QUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY3Rpb25zLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGd0ZSB9IGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IFNNQVBJX01PRF9JRCwgU01BUElfVVJMIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTTUFQSVRvb2woYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogdHlwZXMuSURpc2NvdmVyZWRUb29sIHwgdW5kZWZpbmVkIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bJ3NtYXBpJ107XHJcbiAgcmV0dXJuICEhdG9vbD8ucGF0aCA/IHRvb2wgOiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTTUFQSU1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogdHlwZXMuSU1vZFtdIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gIGNvbnN0IGlzU01BUEkgPSAobW9kOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgbW9kLnR5cGUgPT09ICdTTUFQSScgJiYgbW9kLmF0dHJpYnV0ZXM/Lm1vZElkID09PSBTTUFQSV9NT0RfSUQ7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIHJldHVybiBPYmplY3QudmFsdWVzKG1vZHMpLmZpbHRlcigobW9kOiB0eXBlcy5JTW9kKSA9PiBpc1NNQVBJKG1vZCkgJiYgaXNBY3RpdmUobW9kLmlkKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kU01BUElNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogdHlwZXMuSU1vZCB7XHJcbiAgY29uc3QgU01BUElNb2RzID0gZ2V0U01BUElNb2RzKGFwaSk7XHJcbiAgcmV0dXJuIChTTUFQSU1vZHMubGVuZ3RoID09PSAwKVxyXG4gICAgPyB1bmRlZmluZWRcclxuICAgIDogU01BUElNb2RzLmxlbmd0aCA+IDFcclxuICAgICAgPyBTTUFQSU1vZHMucmVkdWNlKChwcmV2LCBpdGVyKSA9PiB7XHJcbiAgICAgICAgaWYgKHByZXYgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmV0dXJuIGl0ZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoZ3RlKGl0ZXI/LmF0dHJpYnV0ZXM/LnZlcnNpb24gPz8gJzAuMC4wJywgcHJldj8uYXR0cmlidXRlcz8udmVyc2lvbiA/PyAnMC4wLjAnKSkgPyBpdGVyIDogcHJldjtcclxuICAgICAgfSwgdW5kZWZpbmVkKVxyXG4gICAgICA6IFNNQVBJTW9kc1swXTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlcGxveVNNQVBJKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCBjYikpO1xyXG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtcXVpY2stZGlzY292ZXJ5JywgKCkgPT4gY2IobnVsbCkpKTtcclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgdG9vbCA9IGRpc2NvdmVyeT8udG9vbHM/Llsnc21hcGknXTtcclxuICBpZiAodG9vbCkge1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdG9vbC5pZCkpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkU01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCB1cGRhdGU/OiBib29sZWFuKSB7XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ3NtYXBpLWluc3RhbGxpbmcnLFxyXG4gICAgbWVzc2FnZTogdXBkYXRlID8gJ1VwZGF0aW5nIFNNQVBJJyA6ICdJbnN0YWxsaW5nIFNNQVBJJyxcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICB9KTtcclxuXHJcbiAgaWYgKGFwaS5leHQ/LmVuc3VyZUxvZ2dlZEluICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGF3YWl0IGFwaS5leHQuZW5zdXJlTG9nZ2VkSW4oKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2RGaWxlcyA9IGF3YWl0IGFwaS5leHQubmV4dXNHZXRNb2RGaWxlcyhHQU1FX0lELCBTTUFQSV9NT0RfSUQpO1xyXG5cclxuICAgIGNvbnN0IGZpbGVUaW1lID0gKGlucHV0OiBhbnkpID0+IE51bWJlci5wYXJzZUludChpbnB1dC51cGxvYWRlZF90aW1lLCAxMCk7XHJcblxyXG4gICAgY29uc3QgZmlsZSA9IG1vZEZpbGVzXHJcbiAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLmNhdGVnb3J5X2lkID09PSAxKVxyXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGZpbGVUaW1lKGxocykgLSBmaWxlVGltZShyaHMpKVswXTtcclxuXHJcbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnTm8gU01BUEkgbWFpbiBmaWxlIGZvdW5kJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGxJbmZvID0ge1xyXG4gICAgICBnYW1lOiBHQU1FX0lELFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBueG1VcmwgPSBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7U01BUElfTU9EX0lEfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gO1xyXG4gICAgY29uc3QgZGxJZCA9IGF3YWl0IHV0aWwudG9Qcm9taXNlPHN0cmluZz4oY2IgPT5cclxuICAgICAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1kb3dubG9hZCcsIFtueG1VcmxdLCBkbEluZm8sIHVuZGVmaW5lZCwgY2IsIHVuZGVmaW5lZCwgeyBhbGxvd0luc3RhbGw6IGZhbHNlIH0pKTtcclxuICAgIGNvbnN0IG1vZElkID0gYXdhaXQgdXRpbC50b1Byb21pc2U8c3RyaW5nPihjYiA9PlxyXG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBkbElkLCB7IGFsbG93QXV0b0VuYWJsZTogZmFsc2UgfSwgY2IpKTtcclxuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgYXdhaXQgYWN0aW9ucy5zZXRNb2RzRW5hYmxlZChhcGksIHByb2ZpbGVJZCwgW21vZElkXSwgdHJ1ZSwge1xyXG4gICAgICBhbGxvd0F1dG9EZXBsb3k6IGZhbHNlLFxyXG4gICAgICBpbnN0YWxsZWQ6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICBhd2FpdCBkZXBsb3lTTUFQSShhcGkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgU01BUEknLCBlcnIpO1xyXG4gICAgdXRpbC5vcG4oU01BUElfVVJMKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLWluc3RhbGxpbmcnKTtcclxuICB9XHJcbn1cclxuIl19