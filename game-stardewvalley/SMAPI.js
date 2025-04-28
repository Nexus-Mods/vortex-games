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
exports.downloadSMAPI = exports.deploySMAPI = exports.findSMAPIMod = exports.findSMAPITool = void 0;
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
exports.findSMAPITool = findSMAPITool;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBQ25DLG1DQUE2QjtBQUM3QiwyQ0FBc0Q7QUFFdEQsU0FBZ0IsYUFBYSxDQUFDLEdBQXdCOztJQUNwRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLElBQUksR0FBRyxNQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxLQUFLLDBDQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sQ0FBQyxDQUFDLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLElBQUksQ0FBQSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUN6QyxDQUFDO0FBTEQsc0NBS0M7QUFFRCxTQUFnQixZQUFZLENBQUMsR0FBd0I7SUFDbkQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakcsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFlLEVBQUUsRUFBRSxX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QUFDO1lBQzFHLE1BQU0sS0FBSyxHQUFHLE1BQU0saUJBQUksQ0FBQyxTQUFTLENBQVMsRUFBRSxDQUFDLEVBQUUsQ0FDOUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQzlFLE1BQU0sb0JBQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRTtnQkFDMUQsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUVILE1BQU0sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3hCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkUsaUJBQUksQ0FBQyxHQUFHLENBQUMscUJBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QztnQkFBUztZQUNSLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQzdDOztDQUNGO0FBbERELHNDQWtEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFjdGlvbnMsIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgZ3RlIH0gZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgU01BUElfTU9EX0lELCBTTUFQSV9VUkwgfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmluZFNNQVBJVG9vbChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgfCB1bmRlZmluZWQge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgdG9vbCA9IGRpc2NvdmVyeT8udG9vbHM/Llsnc21hcGknXTtcclxuICByZXR1cm4gISF0b29sPy5wYXRoID8gdG9vbCA6IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTTUFQSU1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiB0eXBlcy5JTW9kIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gIGNvbnN0IGlzU01BUEkgPSAobW9kOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgbW9kLnR5cGUgPT09ICdTTUFQSScgJiYgbW9kLmF0dHJpYnV0ZXM/Lm1vZElkID09PSAyNDAwO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBTTUFQSU1vZHM6IHR5cGVzLklNb2RbXSA9IE9iamVjdC52YWx1ZXMobW9kcykuZmlsdGVyKChtb2Q6IHR5cGVzLklNb2QpID0+XHJcbiAgICBpc1NNQVBJKG1vZCkgJiYgaXNBY3RpdmUobW9kLmlkKSk7XHJcblxyXG4gIHJldHVybiAoU01BUElNb2RzLmxlbmd0aCA9PT0gMClcclxuICAgID8gdW5kZWZpbmVkXHJcbiAgICA6IFNNQVBJTW9kcy5sZW5ndGggPiAxXHJcbiAgICAgID8gU01BUElNb2RzLnJlZHVjZSgocHJldiwgaXRlcikgPT4ge1xyXG4gICAgICAgIGlmIChwcmV2ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBpdGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGd0ZShpdGVyLmF0dHJpYnV0ZXMudmVyc2lvbiA/PyAnMC4wLjAnLCBwcmV2LmF0dHJpYnV0ZXMudmVyc2lvbiA/PyAnMC4wLjAnKSkgPyBpdGVyIDogcHJldjtcclxuICAgICAgfSwgdW5kZWZpbmVkKVxyXG4gICAgICA6IFNNQVBJTW9kc1swXTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlcGxveVNNQVBJKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCBjYikpO1xyXG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtcXVpY2stZGlzY292ZXJ5JywgKCkgPT4gY2IobnVsbCkpKTtcclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgdG9vbCA9IGRpc2NvdmVyeT8udG9vbHM/Llsnc21hcGknXTtcclxuICBpZiAodG9vbCkge1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdG9vbC5pZCkpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkU01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCB1cGRhdGU/OiBib29sZWFuKSB7XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ3NtYXBpLWluc3RhbGxpbmcnLFxyXG4gICAgbWVzc2FnZTogdXBkYXRlID8gJ1VwZGF0aW5nIFNNQVBJJyA6ICdJbnN0YWxsaW5nIFNNQVBJJyxcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICB9KTtcclxuXHJcbiAgaWYgKGFwaS5leHQ/LmVuc3VyZUxvZ2dlZEluICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGF3YWl0IGFwaS5leHQuZW5zdXJlTG9nZ2VkSW4oKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2RGaWxlcyA9IGF3YWl0IGFwaS5leHQubmV4dXNHZXRNb2RGaWxlcyhHQU1FX0lELCBTTUFQSV9NT0RfSUQpO1xyXG5cclxuICAgIGNvbnN0IGZpbGVUaW1lID0gKGlucHV0OiBhbnkpID0+IE51bWJlci5wYXJzZUludChpbnB1dC51cGxvYWRlZF90aW1lLCAxMCk7XHJcblxyXG4gICAgY29uc3QgZmlsZSA9IG1vZEZpbGVzXHJcbiAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLmNhdGVnb3J5X2lkID09PSAxKVxyXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGZpbGVUaW1lKGxocykgLSBmaWxlVGltZShyaHMpKVswXTtcclxuXHJcbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnTm8gU01BUEkgbWFpbiBmaWxlIGZvdW5kJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGxJbmZvID0ge1xyXG4gICAgICBnYW1lOiBHQU1FX0lELFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBueG1VcmwgPSBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7U01BUElfTU9EX0lEfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gO1xyXG4gICAgY29uc3QgZGxJZCA9IGF3YWl0IHV0aWwudG9Qcm9taXNlPHN0cmluZz4oY2IgPT5cclxuICAgICAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1kb3dubG9hZCcsIFtueG1VcmxdLCBkbEluZm8sIHVuZGVmaW5lZCwgY2IsIHVuZGVmaW5lZCwgeyBhbGxvd0luc3RhbGw6IGZhbHNlIH0pKTtcclxuICAgIGNvbnN0IG1vZElkID0gYXdhaXQgdXRpbC50b1Byb21pc2U8c3RyaW5nPihjYiA9PlxyXG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBkbElkLCB7IGFsbG93QXV0b0VuYWJsZTogZmFsc2UgfSwgY2IpKTtcclxuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgYXdhaXQgYWN0aW9ucy5zZXRNb2RzRW5hYmxlZChhcGksIHByb2ZpbGVJZCwgW21vZElkXSwgdHJ1ZSwge1xyXG4gICAgICBhbGxvd0F1dG9EZXBsb3k6IGZhbHNlLFxyXG4gICAgICBpbnN0YWxsZWQ6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICBhd2FpdCBkZXBsb3lTTUFQSShhcGkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgU01BUEknLCBlcnIpO1xyXG4gICAgdXRpbC5vcG4oU01BUElfVVJMKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLWluc3RhbGxpbmcnKTtcclxuICB9XHJcbn1cclxuIl19