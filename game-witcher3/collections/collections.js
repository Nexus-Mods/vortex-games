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
function genCollectionsData(context, gameId, includedMods, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', gameId], {});
        try {
            const loadOrder = yield (0, loadOrder_1.exportLoadOrder)(api.getState(), includedMods, mods);
            const menuModData = yield (0, menumod_1.exportMenuMod)(api, profile, includedMods);
            const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
            let scriptMergesData;
            if (scriptMergerTool !== undefined) {
                scriptMergesData = yield (0, mergeBackup_1.exportScriptMerges)(context, profile.id, includedMods, collection);
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
            yield (0, loadOrder_1.importLoadOrder)(api, collection);
            if (menuModSettingsData !== undefined) {
                yield (0, menumod_1.importMenuMod)(api, profile, (0, util_1.hex2Buffer)(menuModSettingsData));
            }
            if (scriptMergedData !== undefined) {
                const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
                if (scriptMergerTool === undefined) {
                    yield (0, scriptmerger_1.downloadScriptMerger)(context);
                }
                yield (0, mergeBackup_1.importScriptMerges)(context, profile.id, (0, util_1.hex2Buffer)(scriptMergedData));
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.parseCollectionsData = parseCollectionsData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQsc0NBQXNEO0FBSXRELDJDQUErRDtBQUUvRCx3Q0FBMEQ7QUFDMUQsZ0RBQXdFO0FBRXhFLGtEQUF1RDtBQUV2RCxpQ0FBMEQ7QUFFMUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFlBQXNCLEVBQ3RCLFVBQXNCOztRQUM3RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFlLE1BQU0sSUFBQSwyQkFBZSxFQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEYsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHVCQUFhLEVBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNwRSxNQUFNLGdCQUFnQixHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDekMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pGLElBQUksZ0JBQWdCLENBQUM7WUFDckIsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVB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QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7O0NBQ0Y7QUEvQkQsb0RBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBTQ1JJUFRfTUVSR0VSX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcblxuaW1wb3J0IHsgSUxvYWRPcmRlciwgSVczQ29sbGVjdGlvbnNEYXRhLCBJVzNNZXJnZWREYXRhIH0gZnJvbSAnLi90eXBlcyc7XG5cbmltcG9ydCB7IGV4cG9ydExvYWRPcmRlciwgaW1wb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xuXG5pbXBvcnQgeyBleHBvcnRNZW51TW9kLCBpbXBvcnRNZW51TW9kIH0gZnJvbSAnLi4vbWVudW1vZCc7XG5pbXBvcnQgeyBleHBvcnRTY3JpcHRNZXJnZXMsIGltcG9ydFNjcmlwdE1lcmdlcyB9IGZyb20gJy4uL21lcmdlQmFja3VwJztcblxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIgfSBmcm9tICcuLi9zY3JpcHRtZXJnZXInO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9uUGFyc2VFcnJvciwgaGV4MkJ1ZmZlciB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgZ2FtZUlkXSwge30pO1xuICB0cnkge1xuICAgIGNvbnN0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IGF3YWl0IGV4cG9ydExvYWRPcmRlcihhcGkuZ2V0U3RhdGUoKSwgaW5jbHVkZWRNb2RzLCBtb2RzKTtcbiAgICBjb25zdCBtZW51TW9kRGF0YSA9IGF3YWl0IGV4cG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBpbmNsdWRlZE1vZHMpO1xuICAgIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcbiAgICBsZXQgc2NyaXB0TWVyZ2VzRGF0YTtcbiAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzY3JpcHRNZXJnZXNEYXRhID0gYXdhaXQgZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQsIHByb2ZpbGUuaWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbik7XG4gICAgfVxuICAgIGNvbnN0IG1lcmdlZERhdGE6IElXM01lcmdlZERhdGEgPSB7XG4gICAgICBtZW51TW9kU2V0dGluZ3NEYXRhOiAobWVudU1vZERhdGEgIT09IHVuZGVmaW5lZClcbiAgICAgICAgPyBtZW51TW9kRGF0YS50b1N0cmluZygnaGV4JylcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBzY3JpcHRNZXJnZWREYXRhOiBzY3JpcHRNZXJnZXNEYXRhICE9PSB1bmRlZmluZWRcbiAgICAgICAgPyBzY3JpcHRNZXJnZXNEYXRhLnRvU3RyaW5nKCdoZXgnKVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICAgIGNvbnN0IGNvbGxlY3Rpb25EYXRhOiBJVzNDb2xsZWN0aW9uc0RhdGEgPSB7XG4gICAgICBsb2FkT3JkZXIsXG4gICAgICBtZXJnZWREYXRhLFxuICAgIH07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2xsZWN0aW9uRGF0YSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpIHtcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIGdhbWVJZCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IGdhbWVJZCkge1xuICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gY29sbGVjdGlvblsnaW5mbyddPy5bJ25hbWUnXSAhPT0gdW5kZWZpbmVkID8gY29sbGVjdGlvblsnaW5mbyddWyduYW1lJ10gOiAnV2l0Y2hlciAzIENvbGxlY3Rpb24nO1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQ29sbGVjdGlvblBhcnNlRXJyb3IoY29sbGVjdGlvbk5hbWUsXG4gICAgICAnTGFzdCBhY3RpdmUgcHJvZmlsZSBpcyBtaXNzaW5nJykpO1xuICB9XG4gIGNvbnN0IHsgbWVudU1vZFNldHRpbmdzRGF0YSwgc2NyaXB0TWVyZ2VkRGF0YSB9ID0gY29sbGVjdGlvbi5tZXJnZWREYXRhO1xuICB0cnkge1xuICAgIGF3YWl0IGltcG9ydExvYWRPcmRlcihhcGksIGNvbGxlY3Rpb24pO1xuICAgIGlmIChtZW51TW9kU2V0dGluZ3NEYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGF3YWl0IGltcG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBoZXgyQnVmZmVyKG1lbnVNb2RTZXR0aW5nc0RhdGEpKTtcbiAgICB9XG5cbiAgICBpZiAoc2NyaXB0TWVyZ2VkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSB0aGUgc2NyaXB0IG1lcmdlciBpbnN0YWxsZWQgc3RyYWlnaHQgYXdheSFcbiAgICAgIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xuICAgICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhd2FpdCBkb3dubG9hZFNjcmlwdE1lcmdlcihjb250ZXh0KTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IGltcG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LCBwcm9maWxlLmlkLCBoZXgyQnVmZmVyKHNjcmlwdE1lcmdlZERhdGEpKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG4iXX0=