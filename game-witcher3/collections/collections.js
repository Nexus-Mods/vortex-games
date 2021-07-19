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
exports.parseCollectionsData = exports.genCollectionsData = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
const loadOrder_1 = require("./loadOrder");
const menumod_1 = require("../menumod");
const mergeBackup_1 = require("../mergeBackup");
const scriptmerger_1 = require("../scriptmerger");
const util_1 = require("./util");
function genCollectionsData(context, gameId, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', gameId], {});
        try {
            const loadOrder = yield loadOrder_1.exportLoadOrder(api.getState(), includedMods, mods);
            const menuModData = yield menumod_1.exportMenuMod(api, profile, includedMods);
            const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
            let scriptMergesData;
            if (scriptMergerTool !== undefined) {
                scriptMergesData = yield mergeBackup_1.exportScriptMerges(context, profile.id);
            }
            const mergedData = {
                menuModSettingsData: (menuModData !== undefined)
                    ? menuModData.toString('hex')
                    : undefined,
                scriptMergedData: scriptMergesData !== undefined
                    ? scriptMergesData.toString('hex')
                    : undefined,
            };
            const collectionData = {
                loadOrder,
                mergedData,
            };
            return Promise.resolve(collectionData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.genCollectionsData = genCollectionsData;
function parseCollectionsData(context, gameId, collection) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, gameId);
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== gameId) {
            const collectionName = ((_a = collection['info']) === null || _a === void 0 ? void 0 : _a['name']) !== undefined ? collection['info']['name'] : 'Witcher 3 Collection';
            return Promise.reject(new util_1.CollectionParseError(collectionName, 'Last active profile is missing'));
        }
        const { menuModSettingsData, scriptMergedData } = collection.mergedData;
        try {
            yield loadOrder_1.importLoadOrder(api, collection);
            if (menuModSettingsData !== undefined) {
                yield menumod_1.importMenuMod(api, profile, util_1.hex2Buffer(menuModSettingsData));
            }
            if (scriptMergedData !== undefined) {
                const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
                if (scriptMergerTool === undefined) {
                    yield scriptmerger_1.downloadScriptMerger(context);
                }
                yield mergeBackup_1.importScriptMerges(context, profile.id, util_1.hex2Buffer(scriptMergedData));
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.parseCollectionsData = parseCollectionsData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQsc0NBQXNEO0FBSXRELDJDQUErRDtBQUUvRCx3Q0FBMEQ7QUFDMUQsZ0RBQXdFO0FBRXhFLGtEQUF1RDtBQUV2RCxpQ0FBMEQ7QUFFMUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFlBQXNCOztRQUM3RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFlLE1BQU0sMkJBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sV0FBVyxHQUFHLE1BQU0sdUJBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN6QyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekYsSUFBSSxnQkFBZ0IsQ0FBQztZQUNyQixJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRTtnQkFDbEMsZ0JBQWdCLEdBQUcs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b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU0NSSVBUX01FUkdFUl9JRCB9IGZyb20gJy4uL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJVzNDb2xsZWN0aW9uc0RhdGEsIElXM01lcmdlZERhdGEgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IGV4cG9ydExvYWRPcmRlciwgaW1wb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5cclxuaW1wb3J0IHsgZXhwb3J0TWVudU1vZCwgaW1wb3J0TWVudU1vZCB9IGZyb20gJy4uL21lbnVtb2QnO1xyXG5pbXBvcnQgeyBleHBvcnRTY3JpcHRNZXJnZXMsIGltcG9ydFNjcmlwdE1lcmdlcyB9IGZyb20gJy4uL21lcmdlQmFja3VwJztcclxuXHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyIH0gZnJvbSAnLi4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IENvbGxlY3Rpb25QYXJzZUVycm9yLCBoZXgyQnVmZmVyIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBnYW1lSWRdLCB7fSk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IGF3YWl0IGV4cG9ydExvYWRPcmRlcihhcGkuZ2V0U3RhdGUoKSwgaW5jbHVkZWRNb2RzLCBtb2RzKTtcclxuICAgIGNvbnN0IG1lbnVNb2REYXRhID0gYXdhaXQgZXhwb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGluY2x1ZGVkTW9kcyk7XHJcbiAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGxldCBzY3JpcHRNZXJnZXNEYXRhO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBzY3JpcHRNZXJnZXNEYXRhID0gYXdhaXQgZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQsIHByb2ZpbGUuaWQpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbWVyZ2VkRGF0YTogSVczTWVyZ2VkRGF0YSA9IHtcclxuICAgICAgbWVudU1vZFNldHRpbmdzRGF0YTogKG1lbnVNb2REYXRhICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgPyBtZW51TW9kRGF0YS50b1N0cmluZygnaGV4JylcclxuICAgICAgICA6IHVuZGVmaW5lZCxcclxuICAgICAgc2NyaXB0TWVyZ2VkRGF0YTogc2NyaXB0TWVyZ2VzRGF0YSAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgPyBzY3JpcHRNZXJnZXNEYXRhLnRvU3RyaW5nKCdoZXgnKVxyXG4gICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IGNvbGxlY3Rpb25EYXRhOiBJVzNDb2xsZWN0aW9uc0RhdGEgPSB7XHJcbiAgICAgIGxvYWRPcmRlcixcclxuICAgICAgbWVyZ2VkRGF0YSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbGxlY3Rpb25EYXRhKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpIHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIGdhbWVJZCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBnYW1lSWQpIHtcclxuICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gY29sbGVjdGlvblsnaW5mbyddPy5bJ25hbWUnXSAhPT0gdW5kZWZpbmVkID8gY29sbGVjdGlvblsnaW5mbyddWyduYW1lJ10gOiAnV2l0Y2hlciAzIENvbGxlY3Rpb24nO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uUGFyc2VFcnJvcihjb2xsZWN0aW9uTmFtZSxcclxuICAgICAgJ0xhc3QgYWN0aXZlIHByb2ZpbGUgaXMgbWlzc2luZycpKTtcclxuICB9XHJcbiAgY29uc3QgeyBtZW51TW9kU2V0dGluZ3NEYXRhLCBzY3JpcHRNZXJnZWREYXRhIH0gPSBjb2xsZWN0aW9uLm1lcmdlZERhdGE7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGltcG9ydExvYWRPcmRlcihhcGksIGNvbGxlY3Rpb24pO1xyXG4gICAgaWYgKG1lbnVNb2RTZXR0aW5nc0RhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhd2FpdCBpbXBvcnRNZW51TW9kKGFwaSwgcHJvZmlsZSwgaGV4MkJ1ZmZlcihtZW51TW9kU2V0dGluZ3NEYXRhKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNjcmlwdE1lcmdlZERhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSB0aGUgc2NyaXB0IG1lcmdlciBpbnN0YWxsZWQgc3RyYWlnaHQgYXdheSFcclxuICAgICAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGF3YWl0IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGNvbnRleHQpO1xyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IGltcG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LCBwcm9maWxlLmlkLCBoZXgyQnVmZmVyKHNjcmlwdE1lcmdlZERhdGEpKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG4iXX0=