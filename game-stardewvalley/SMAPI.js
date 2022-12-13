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
                if (prev === undefined) {
                    return iter;
                }
                return ((0, semver_1.gte)(iter.attributes.version, prev.attributes.version)) ? iter : prev;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBQ25DLG1DQUE2QjtBQUM3QiwyQ0FBc0Q7QUFFdEQsU0FBZ0IsWUFBWSxDQUFDLEdBQXdCO0lBQ25ELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7SUFDckUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pHLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBZSxFQUFFLEVBQUUsV0FDbEMsT0FBQSxHQUFHLENBQUMsSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsS0FBSyxNQUFLLElBQUksQ0FBQSxFQUFBLENBQUM7SUFDekQsTUFBTSxJQUFJLEdBQW9DLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZHLE1BQU0sU0FBUyxHQUFpQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQWUsRUFBRSxFQUFFLENBQzdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxD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QUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN4QjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLHFCQUFxQixDQUFDLGtDQUFrQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ25FLGlCQUFJLENBQUMsR0FBRyxDQUFDLHFCQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkM7Z0JBQVM7WUFDUixHQUFHLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUM3Qzs7Q0FDRjtBQWxERCxzQ0FrREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY3Rpb25zLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGd0ZSB9IGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IFNNQVBJX01PRF9JRCwgU01BUElfVVJMIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTTUFQSU1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiB0eXBlcy5JTW9kIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gIGNvbnN0IGlzU01BUEkgPSAobW9kOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgbW9kLnR5cGUgPT09ICdTTUFQSScgJiYgbW9kLmF0dHJpYnV0ZXM/Lm1vZElkID09PSAyNDAwO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBTTUFQSU1vZHM6IHR5cGVzLklNb2RbXSA9IE9iamVjdC52YWx1ZXMobW9kcykuZmlsdGVyKChtb2Q6IHR5cGVzLklNb2QpID0+XHJcbiAgICBpc1NNQVBJKG1vZCkgJiYgaXNBY3RpdmUobW9kLmlkKSk7XHJcblxyXG4gIHJldHVybiAoU01BUElNb2RzLmxlbmd0aCA9PT0gMClcclxuICAgID8gdW5kZWZpbmVkXHJcbiAgICA6IFNNQVBJTW9kcy5sZW5ndGggPiAxXHJcbiAgICAgID8gU01BUElNb2RzLnJlZHVjZSgocHJldiwgaXRlcikgPT4ge1xyXG4gICAgICAgIGlmIChwcmV2ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBpdGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGd0ZShpdGVyLmF0dHJpYnV0ZXMudmVyc2lvbiwgcHJldi5hdHRyaWJ1dGVzLnZlcnNpb24pKSA/IGl0ZXIgOiBwcmV2O1xyXG4gICAgICB9LCB1bmRlZmluZWQpXHJcbiAgICAgIDogU01BUElNb2RzWzBdO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVwbG95U01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIGNiKSk7XHJcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1xdWljay1kaXNjb3ZlcnknLCAoKSA9PiBjYihudWxsKSkpO1xyXG5cclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICBjb25zdCB0b29sID0gZGlzY292ZXJ5Py50b29scz8uWydzbWFwaSddO1xyXG4gIGlmICh0b29sKSB7XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCB0b29sLmlkKSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRTTUFQSShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHVwZGF0ZT86IGJvb2xlYW4pIHtcclxuICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiAnc21hcGktaW5zdGFsbGluZycsXHJcbiAgICBtZXNzYWdlOiB1cGRhdGUgPyAnVXBkYXRpbmcgU01BUEknIDogJ0luc3RhbGxpbmcgU01BUEknLFxyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gIH0pO1xyXG5cclxuICBpZiAoYXBpLmV4dD8uZW5zdXJlTG9nZ2VkSW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgYXdhaXQgYXBpLmV4dC5lbnN1cmVMb2dnZWRJbigpO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZEZpbGVzID0gYXdhaXQgYXBpLmV4dC5uZXh1c0dldE1vZEZpbGVzKEdBTUVfSUQsIFNNQVBJX01PRF9JRCk7XHJcblxyXG4gICAgY29uc3QgZmlsZVRpbWUgPSAoaW5wdXQ6IGFueSkgPT4gTnVtYmVyLnBhcnNlSW50KGlucHV0LnVwbG9hZGVkX3RpbWUsIDEwKTtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gbW9kRmlsZXNcclxuICAgICAgLmZpbHRlcihmaWxlID0+IGZpbGUuY2F0ZWdvcnlfaWQgPT09IDEpXHJcbiAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gZmlsZVRpbWUobGhzKSAtIGZpbGVUaW1lKHJocykpWzBdO1xyXG5cclxuICAgIGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdObyBTTUFQSSBtYWluIGZpbGUgZm91bmQnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkbEluZm8gPSB7XHJcbiAgICAgIGdhbWU6IEdBTUVfSUQsXHJcbiAgICAgIG5hbWU6ICdTTUFQSScsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IG54bVVybCA9IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvJHtTTUFQSV9NT0RfSUR9L2ZpbGVzLyR7ZmlsZS5maWxlX2lkfWA7XHJcbiAgICBjb25zdCBkbElkID0gYXdhaXQgdXRpbC50b1Byb21pc2U8c3RyaW5nPihjYiA9PlxyXG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWRvd25sb2FkJywgW254bVVybF0sIGRsSW5mbywgdW5kZWZpbmVkLCBjYiwgdW5kZWZpbmVkLCB7IGFsbG93SW5zdGFsbDogZmFsc2UgfSkpO1xyXG4gICAgY29uc3QgbW9kSWQgPSBhd2FpdCB1dGlsLnRvUHJvbWlzZTxzdHJpbmc+KGNiID0+XHJcbiAgICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtaW5zdGFsbC1kb3dubG9hZCcsIGRsSWQsIHsgYWxsb3dBdXRvRW5hYmxlOiBmYWxzZSB9LCBjYikpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgICBhd2FpdCBhY3Rpb25zLnNldE1vZHNFbmFibGVkKGFwaSwgcHJvZmlsZUlkLCBbbW9kSWRdLCB0cnVlLCB7XHJcbiAgICAgIGFsbG93QXV0b0RlcGxveTogZmFsc2UsXHJcbiAgICAgIGluc3RhbGxlZDogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIGF3YWl0IGRlcGxveVNNQVBJKGFwaSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBTTUFQSScsIGVycik7XHJcbiAgICB1dGlsLm9wbihTTUFQSV9VUkwpLmNhdGNoKCgpID0+IG51bGwpO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktaW5zdGFsbGluZycpO1xyXG4gIH1cclxufVxyXG4iXX0=