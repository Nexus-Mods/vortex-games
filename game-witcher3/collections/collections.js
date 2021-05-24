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
                menuModSettingsData: menuModData.toString('hex'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQsc0NBQXNEO0FBSXRELDJDQUErRDtBQUUvRCx3Q0FBMEQ7QUFDMUQsZ0RBQXdFO0FBRXhFLGtEQUF1RDtBQUV2RCxpQ0FBMEQ7QUFFMUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFlBQXNCOztRQUM3RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFlLE1BQU0sMkJBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sV0FBVyxHQUFHLE1BQU0sdUJBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN6QyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekYsSUFBSSxnQkFBZ0IsQ0FBQztZQUNyQixJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRTtnQkFDbEMsZ0JBQWdCLEdBQUcsTUFBTSxnQ0FBa0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ2xFO1lBQ0QsTUFBTSxVQUFVLEdBQWtCO2dCQUNoQyxtQkFBbUIsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztnQkFDaEQsZ0JBQWdCLEVBQUUsZ0JBQWdCLEtBQUssU0FBUztvQkFDOUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7b0JBQ2xDLENBQUMsQ0FBQyxTQUFTO2FBQ2QsQ0FBQztZQUNGLE1BQU0sY0FBYyxHQUF1QjtnQkFDekMsU0FBUztnQkFDVCxVQUFVO2FBQ1gsQ0FBQztZQUNGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUN4QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBL0JELGdEQStCQztBQUVELFNBQXNCLG9CQUFvQixDQUFDLE9BQWdDLEVBQ2hDLE1BQWMsRUFDZCxVQUE4Qjs7O1FBQ3ZFLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxNQUFNLEVBQUU7WUFDOUIsTUFBTSxjQUFjLEdBQUcsT0FBQSxVQUFVLENBQUMsTUFBTSxDQUFDLDBDQUFHLE1BQU0sT0FBTSxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUM7WUFDeEgsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksMkJBQW9CLENBQUMsY0FBYyxFQUMzRCxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7U0FDdEM7UUFDRCxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQ3hFLElBQUk7WUFDRixNQUFNLDJCQUFlLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO2dCQUNyQyxNQUFNLHVCQUFhLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxpQkFBVSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQzthQUNwRTtZQUVELElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO2dCQUVsQyxNQUFNLGdCQUFnQixHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDekMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN6RixJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRTtvQkFDbEMsTUFBTSxtQ0FBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDckM7Z0JBQ0QsTUFBTSxnQ0FBa0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxpQkFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQzthQUM3RTtTQUNGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7O0NBQ0Y7QUEvQkQsb0RBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU0NSSVBUX01FUkdFUl9JRCB9IGZyb20gJy4uL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJVzNDb2xsZWN0aW9uc0RhdGEsIElXM01lcmdlZERhdGEgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IGV4cG9ydExvYWRPcmRlciwgaW1wb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5cclxuaW1wb3J0IHsgZXhwb3J0TWVudU1vZCwgaW1wb3J0TWVudU1vZCB9IGZyb20gJy4uL21lbnVtb2QnO1xyXG5pbXBvcnQgeyBleHBvcnRTY3JpcHRNZXJnZXMsIGltcG9ydFNjcmlwdE1lcmdlcyB9IGZyb20gJy4uL21lcmdlQmFja3VwJztcclxuXHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyIH0gZnJvbSAnLi4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IENvbGxlY3Rpb25QYXJzZUVycm9yLCBoZXgyQnVmZmVyIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBnYW1lSWRdLCB7fSk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IGF3YWl0IGV4cG9ydExvYWRPcmRlcihhcGkuZ2V0U3RhdGUoKSwgaW5jbHVkZWRNb2RzLCBtb2RzKTtcclxuICAgIGNvbnN0IG1lbnVNb2REYXRhID0gYXdhaXQgZXhwb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGluY2x1ZGVkTW9kcyk7XHJcbiAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGxldCBzY3JpcHRNZXJnZXNEYXRhO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBzY3JpcHRNZXJnZXNEYXRhID0gYXdhaXQgZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQsIHByb2ZpbGUuaWQpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbWVyZ2VkRGF0YTogSVczTWVyZ2VkRGF0YSA9IHtcclxuICAgICAgbWVudU1vZFNldHRpbmdzRGF0YTogbWVudU1vZERhdGEudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgICBzY3JpcHRNZXJnZWREYXRhOiBzY3JpcHRNZXJnZXNEYXRhICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IHNjcmlwdE1lcmdlc0RhdGEudG9TdHJpbmcoJ2hleCcpXHJcbiAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgY29sbGVjdGlvbkRhdGE6IElXM0NvbGxlY3Rpb25zRGF0YSA9IHtcclxuICAgICAgbG9hZE9yZGVyLFxyXG4gICAgICBtZXJnZWREYXRhLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sbGVjdGlvbkRhdGEpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSkge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZUlkKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IGdhbWVJZCkge1xyXG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uWydpbmZvJ10/LlsnbmFtZSddICE9PSB1bmRlZmluZWQgPyBjb2xsZWN0aW9uWydpbmZvJ11bJ25hbWUnXSA6ICdXaXRjaGVyIDMgQ29sbGVjdGlvbic7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IENvbGxlY3Rpb25QYXJzZUVycm9yKGNvbGxlY3Rpb25OYW1lLFxyXG4gICAgICAnTGFzdCBhY3RpdmUgcHJvZmlsZSBpcyBtaXNzaW5nJykpO1xyXG4gIH1cclxuICBjb25zdCB7IG1lbnVNb2RTZXR0aW5nc0RhdGEsIHNjcmlwdE1lcmdlZERhdGEgfSA9IGNvbGxlY3Rpb24ubWVyZ2VkRGF0YTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgaW1wb3J0TG9hZE9yZGVyKGFwaSwgY29sbGVjdGlvbik7XHJcbiAgICBpZiAobWVudU1vZFNldHRpbmdzRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IGltcG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBoZXgyQnVmZmVyKG1lbnVNb2RTZXR0aW5nc0RhdGEpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2NyaXB0TWVyZ2VkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIHRoZSBzY3JpcHQgbWVyZ2VyIGluc3RhbGxlZCBzdHJhaWdodCBhd2F5IVxyXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYXdhaXQgZG93bmxvYWRTY3JpcHRNZXJnZXIoY29udGV4dCk7XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgaW1wb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQsIHByb2ZpbGUuaWQsIGhleDJCdWZmZXIoc2NyaXB0TWVyZ2VkRGF0YSkpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcbiJdfQ==