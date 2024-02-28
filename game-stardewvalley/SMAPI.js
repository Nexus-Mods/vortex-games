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
exports.downloadSMAPI = exports.deploySMAPI = exports.findSMAPIMod = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const semver_1 = require("semver");
const constants_1 = require("./constants");
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
                var _a, _b;
                if (prev === undefined) {
                    return iter;
                }
                return ((0, semver_1.gte)((_a = iter.attributes.version) !== null && _a !== void 0 ? _a : '0.0.0', (_b = prev.attributes.version) !== null && _b !== void 0 ? _b : '0.0.0')) ? iter : prev;
            }, undefined)
            : SMAPIMods[0];
}
exports.findSMAPIMod = findSMAPIMod;
function deploySMAPI(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        yield vortex_api_1.util.toPromise(cb => api.events.emit('deploy-mods', cb));
        yield vortex_api_1.util.toPromise(cb => api.events.emit('start-quick-discovery', () => cb(null)));
        const discovery = vortex_api_1.selectors.discoveryByGame(api.getState(), common_1.GAME_ID);
        const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
        if (tool) {
            api.store.dispatch(vortex_api_1.actions.setPrimaryTool(common_1.GAME_ID, tool.id));
        }
    });
}
exports.deploySMAPI = deploySMAPI;
function downloadSMAPI(api, update) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
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
exports.downloadSMAPI = downloadSMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBQ25DLG1DQUE2QjtBQUM3QiwyQ0FBc0Q7QUFFdEQsU0FBZ0IsWUFBWSxDQUFDLEdBQXdCO0lBQ25ELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7SUFDckUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pHLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBZSxFQUFFLEVBQUUsV0FDbEMsT0FBQSxHQUFHLENBQUMsSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsS0FBSyxNQUFLLElBQUksQ0FBQSxFQUFBLENBQUM7SUFDekQsTUFBTSxJQUFJLEdBQW9DLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZHLE1BQU0sU0FBUyxHQUFpQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQWUsRUFBRSxFQUFFLENBQzdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxD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QUFLO2dCQUN0QixTQUFTLEVBQUUsSUFBSTthQUNoQixDQUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN4QjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLHFCQUFxQixDQUFDLGtDQUFrQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ25FLGlCQUFJLENBQUMsR0FBRyxDQUFDLHFCQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkM7Z0JBQVM7WUFDUixHQUFHLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUM3Qzs7Q0FDRjtBQWxERCxzQ0FrREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY3Rpb25zLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGd0ZSB9IGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IFNNQVBJX01PRF9JRCwgU01BUElfVVJMIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTTUFQSU1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiB0eXBlcy5JTW9kIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gIGNvbnN0IGlzU01BUEkgPSAobW9kOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgbW9kLnR5cGUgPT09ICdTTUFQSScgJiYgbW9kLmF0dHJpYnV0ZXM/Lm1vZElkID09PSAyNDAwO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBTTUFQSU1vZHM6IHR5cGVzLklNb2RbXSA9IE9iamVjdC52YWx1ZXMobW9kcykuZmlsdGVyKChtb2Q6IHR5cGVzLklNb2QpID0+XHJcbiAgICBpc1NNQVBJKG1vZCkgJiYgaXNBY3RpdmUobW9kLmlkKSk7XHJcblxyXG4gIHJldHVybiAoU01BUElNb2RzLmxlbmd0aCA9PT0gMClcclxuICAgID8gdW5kZWZpbmVkXHJcbiAgICA6IFNNQVBJTW9kcy5sZW5ndGggPiAxXHJcbiAgICAgID8gU01BUElNb2RzLnJlZHVjZSgocHJldiwgaXRlcikgPT4ge1xyXG4gICAgICAgIGlmIChwcmV2ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBpdGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGd0ZShpdGVyLmF0dHJpYnV0ZXMudmVyc2lvbiA/PyAnMC4wLjAnLCBwcmV2LmF0dHJpYnV0ZXMudmVyc2lvbiA/PyAnMC4wLjAnKSkgPyBpdGVyIDogcHJldjtcclxuICAgICAgfSwgdW5kZWZpbmVkKVxyXG4gICAgICA6IFNNQVBJTW9kc1swXTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlcGxveVNNQVBJKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCBjYikpO1xyXG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtcXVpY2stZGlzY292ZXJ5JywgKCkgPT4gY2IobnVsbCkpKTtcclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgdG9vbCA9IGRpc2NvdmVyeT8udG9vbHM/Llsnc21hcGknXTtcclxuICBpZiAodG9vbCkge1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdG9vbC5pZCkpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkU01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCB1cGRhdGU/OiBib29sZWFuKSB7XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ3NtYXBpLWluc3RhbGxpbmcnLFxyXG4gICAgbWVzc2FnZTogdXBkYXRlID8gJ1VwZGF0aW5nIFNNQVBJJyA6ICdJbnN0YWxsaW5nIFNNQVBJJyxcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICB9KTtcclxuXHJcbiAgaWYgKGFwaS5leHQ/LmVuc3VyZUxvZ2dlZEluICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGF3YWl0IGFwaS5leHQuZW5zdXJlTG9nZ2VkSW4oKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2RGaWxlcyA9IGF3YWl0IGFwaS5leHQubmV4dXNHZXRNb2RGaWxlcyhHQU1FX0lELCBTTUFQSV9NT0RfSUQpO1xyXG5cclxuICAgIGNvbnN0IGZpbGVUaW1lID0gKGlucHV0OiBhbnkpID0+IE51bWJlci5wYXJzZUludChpbnB1dC51cGxvYWRlZF90aW1lLCAxMCk7XHJcblxyXG4gICAgY29uc3QgZmlsZSA9IG1vZEZpbGVzXHJcbiAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLmNhdGVnb3J5X2lkID09PSAxKVxyXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGZpbGVUaW1lKGxocykgLSBmaWxlVGltZShyaHMpKVswXTtcclxuXHJcbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnTm8gU01BUEkgbWFpbiBmaWxlIGZvdW5kJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGxJbmZvID0ge1xyXG4gICAgICBnYW1lOiBHQU1FX0lELFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBueG1VcmwgPSBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7U01BUElfTU9EX0lEfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gO1xyXG4gICAgY29uc3QgZGxJZCA9IGF3YWl0IHV0aWwudG9Qcm9taXNlPHN0cmluZz4oY2IgPT5cclxuICAgICAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1kb3dubG9hZCcsIFtueG1VcmxdLCBkbEluZm8sIHVuZGVmaW5lZCwgY2IsIHVuZGVmaW5lZCwgeyBhbGxvd0luc3RhbGw6IGZhbHNlIH0pKTtcclxuICAgIGNvbnN0IG1vZElkID0gYXdhaXQgdXRpbC50b1Byb21pc2U8c3RyaW5nPihjYiA9PlxyXG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBkbElkLCB7IGFsbG93QXV0b0VuYWJsZTogZmFsc2UgfSwgY2IpKTtcclxuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgYXdhaXQgYWN0aW9ucy5zZXRNb2RzRW5hYmxlZChhcGksIHByb2ZpbGVJZCwgW21vZElkXSwgdHJ1ZSwge1xyXG4gICAgICBhbGxvd0F1dG9EZXBsb3k6IGZhbHNlLFxyXG4gICAgICBpbnN0YWxsZWQ6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICBhd2FpdCBkZXBsb3lTTUFQSShhcGkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgU01BUEknLCBlcnIpO1xyXG4gICAgdXRpbC5vcG4oU01BUElfVVJMKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLWluc3RhbGxpbmcnKTtcclxuICB9XHJcbn1cclxuIl19