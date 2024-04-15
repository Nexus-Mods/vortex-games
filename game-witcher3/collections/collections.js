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
            const loadOrder = yield (0, loadOrder_1.exportLoadOrder)(api, includedMods, mods);
            const menuModData = yield (0, menumod_1.exportMenuMod)(api, profile, includedMods);
            const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
            let scriptMergesData;
            if (scriptMergerTool !== undefined) {
                scriptMergesData = yield (0, mergeBackup_1.exportScriptMerges)(context.api, profile.id, includedMods, collection);
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
                loadOrder: loadOrder,
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
                    yield (0, scriptmerger_1.downloadScriptMerger)(api);
                }
                yield (0, mergeBackup_1.importScriptMerges)(context.api, profile.id, (0, util_1.hex2Buffer)(scriptMergedData));
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.parseCollectionsData = parseCollectionsData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBb0Q7QUFFcEQsc0NBQXNEO0FBSXRELDJDQUErRDtBQUUvRCx3Q0FBMEQ7QUFDMUQsZ0RBQXdFO0FBRXhFLGtEQUF1RDtBQUV2RCxpQ0FBMEQ7QUFFMUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFlBQXNCLEVBQ3RCLFVBQXNCOztRQUM3RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFvQixNQUFNLElBQUEsMkJBQWUsRUFBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDcEUsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3pDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLEVBQUUseUJBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RixJQUFJLGdCQUFnQixDQUFDO1lBQ3JCLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO2dCQUNsQyxnQkFB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WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7O0NBQ0Y7QUEvQkQsb0RBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU0NSSVBUX01FUkdFUl9JRCB9IGZyb20gJy4uL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJVzNDb2xsZWN0aW9uc0RhdGEsIElXM01lcmdlZERhdGEgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IGV4cG9ydExvYWRPcmRlciwgaW1wb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5cclxuaW1wb3J0IHsgZXhwb3J0TWVudU1vZCwgaW1wb3J0TWVudU1vZCB9IGZyb20gJy4uL21lbnVtb2QnO1xyXG5pbXBvcnQgeyBleHBvcnRTY3JpcHRNZXJnZXMsIGltcG9ydFNjcmlwdE1lcmdlcyB9IGZyb20gJy4uL21lcmdlQmFja3VwJztcclxuXHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyIH0gZnJvbSAnLi4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IENvbGxlY3Rpb25QYXJzZUVycm9yLCBoZXgyQnVmZmVyIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIGdhbWVJZF0sIHt9KTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIgPSBhd2FpdCBleHBvcnRMb2FkT3JkZXIoYXBpLCBpbmNsdWRlZE1vZHMsIG1vZHMpO1xyXG4gICAgY29uc3QgbWVudU1vZERhdGEgPSBhd2FpdCBleHBvcnRNZW51TW9kKGFwaSwgcHJvZmlsZSwgaW5jbHVkZWRNb2RzKTtcclxuICAgIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgbGV0IHNjcmlwdE1lcmdlc0RhdGE7XHJcbiAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHNjcmlwdE1lcmdlc0RhdGEgPSBhd2FpdCBleHBvcnRTY3JpcHRNZXJnZXMoY29udGV4dC5hcGksIHByb2ZpbGUuaWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbik7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtZXJnZWREYXRhOiBJVzNNZXJnZWREYXRhID0ge1xyXG4gICAgICBtZW51TW9kU2V0dGluZ3NEYXRhOiAobWVudU1vZERhdGEgIT09IHVuZGVmaW5lZClcclxuICAgICAgICA/IG1lbnVNb2REYXRhLnRvU3RyaW5nKCdoZXgnKVxyXG4gICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICBzY3JpcHRNZXJnZWREYXRhOiBzY3JpcHRNZXJnZXNEYXRhICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IHNjcmlwdE1lcmdlc0RhdGEudG9TdHJpbmcoJ2hleCcpXHJcbiAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgY29sbGVjdGlvbkRhdGE6IElXM0NvbGxlY3Rpb25zRGF0YSA9IHtcclxuICAgICAgbG9hZE9yZGVyOiBsb2FkT3JkZXIgYXMgYW55LFxyXG4gICAgICBtZXJnZWREYXRhLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sbGVjdGlvbkRhdGEpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSkge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZUlkKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IGdhbWVJZCkge1xyXG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uWydpbmZvJ10/LlsnbmFtZSddICE9PSB1bmRlZmluZWQgPyBjb2xsZWN0aW9uWydpbmZvJ11bJ25hbWUnXSA6ICdXaXRjaGVyIDMgQ29sbGVjdGlvbic7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IENvbGxlY3Rpb25QYXJzZUVycm9yKGNvbGxlY3Rpb25OYW1lLFxyXG4gICAgICAnTGFzdCBhY3RpdmUgcHJvZmlsZSBpcyBtaXNzaW5nJykpO1xyXG4gIH1cclxuICBjb25zdCB7IG1lbnVNb2RTZXR0aW5nc0RhdGEsIHNjcmlwdE1lcmdlZERhdGEgfSA9IGNvbGxlY3Rpb24ubWVyZ2VkRGF0YTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgaW1wb3J0TG9hZE9yZGVyKGFwaSwgY29sbGVjdGlvbik7XHJcbiAgICBpZiAobWVudU1vZFNldHRpbmdzRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IGltcG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBoZXgyQnVmZmVyKG1lbnVNb2RTZXR0aW5nc0RhdGEpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2NyaXB0TWVyZ2VkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIHRoZSBzY3JpcHQgbWVyZ2VyIGluc3RhbGxlZCBzdHJhaWdodCBhd2F5IVxyXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYXdhaXQgZG93bmxvYWRTY3JpcHRNZXJnZXIoYXBpKTtcclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBpbXBvcnRTY3JpcHRNZXJnZXMoY29udGV4dC5hcGksIHByb2ZpbGUuaWQsIGhleDJCdWZmZXIoc2NyaXB0TWVyZ2VkRGF0YSkpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcbiJdfQ==