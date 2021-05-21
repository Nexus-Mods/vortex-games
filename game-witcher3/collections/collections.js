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
            const menuModData = yield menumod_1.exportMenuMod(api, profile);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQsc0NBQXNEO0FBSXRELDJDQUErRDtBQUUvRCx3Q0FBMEQ7QUFDMUQsZ0RBQXdFO0FBRXhFLGtEQUF1RDtBQUV2RCxpQ0FBMEQ7QUFFMUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFlBQXNCOztRQUM3RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFlLE1BQU0sMkJBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sV0FBVyxHQUFHLE1BQU0sdUJBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEQsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3pDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLEVBQUUseUJBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RixJQUFJLGdCQUFnQixDQUFDO1lBQ3JCLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO2dCQUNsQyxnQkFBZ0IsR0FBRyxNQUFNLGdDQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDbEU7WUFDRCxNQUFNLFVBQVUsR0FBa0I7Z0JBQ2hDLG1CQUFtQixFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO2dCQUNoRCxnQkFBZ0IsRUFBRSxnQkFBZ0IsS0FBSyxTQUFTO29CQUM5QyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztvQkFDbEMsQ0FBQyxDQUFDLFNBQVM7YUFDZCxDQUFDO1lBQ0YsTUFBTSxjQUFjLEdBQXVCO2dCQUN6QyxTQUFTO2dCQUNULFVBQVU7YUFDWCxDQUFDO1lBQ0YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3hDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUE7QUEvQkQsZ0RBK0JDO0FBRUQsU0FBc0Isb0JBQW9CLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFVBQThCOzs7UUFDdkUsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLE1BQU0sRUFBRTtZQUM5QixNQUFNLGNBQWMsR0FBRyxPQUFBLFVBQVUsQ0FBQyxNQUFNLENBQUMsMENBQUcsTUFBTSxPQUFNLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQztZQUN4SCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSwyQkFBb0IsQ0FBQyxjQUFjLEVBQzNELGdDQUFnQyxDQUFDLENBQUMsQ0FBQztTQUN0QztRQUNELE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDeEUsSUFBSTtZQUNGLE1BQU0sMkJBQWUsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDdkMsSUFBSSxtQkFBbUIsS0FBSyxTQUFTLEVBQUU7Z0JBQ3JDLE1BQU0sdUJBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLGlCQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO2FBQ3BFO1lBRUQsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUU7Z0JBRWxDLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN6QyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3pGLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO29CQUNsQyxNQUFNLG1DQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNyQztnQkFDRCxNQUFNLGdDQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLGlCQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2FBQzdFO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1Qjs7Q0FDRjtBQS9CRCxvREErQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBTQ1JJUFRfTUVSR0VSX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IElMb2FkT3JkZXIsIElXM0NvbGxlY3Rpb25zRGF0YSwgSVczTWVyZ2VkRGF0YSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgZXhwb3J0TG9hZE9yZGVyLCBpbXBvcnRMb2FkT3JkZXIgfSBmcm9tICcuL2xvYWRPcmRlcic7XHJcblxyXG5pbXBvcnQgeyBleHBvcnRNZW51TW9kLCBpbXBvcnRNZW51TW9kIH0gZnJvbSAnLi4vbWVudW1vZCc7XHJcbmltcG9ydCB7IGV4cG9ydFNjcmlwdE1lcmdlcywgaW1wb3J0U2NyaXB0TWVyZ2VzIH0gZnJvbSAnLi4vbWVyZ2VCYWNrdXAnO1xyXG5cclxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIgfSBmcm9tICcuLi9zY3JpcHRtZXJnZXInO1xyXG5cclxuaW1wb3J0IHsgQ29sbGVjdGlvblBhcnNlRXJyb3IsIGhleDJCdWZmZXIgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdKSB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIGdhbWVJZF0sIHt9KTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgbG9hZE9yZGVyOiBJTG9hZE9yZGVyID0gYXdhaXQgZXhwb3J0TG9hZE9yZGVyKGFwaS5nZXRTdGF0ZSgpLCBpbmNsdWRlZE1vZHMsIG1vZHMpO1xyXG4gICAgY29uc3QgbWVudU1vZERhdGEgPSBhd2FpdCBleHBvcnRNZW51TW9kKGFwaSwgcHJvZmlsZSk7XHJcbiAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGxldCBzY3JpcHRNZXJnZXNEYXRhO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBzY3JpcHRNZXJnZXNEYXRhID0gYXdhaXQgZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQsIHByb2ZpbGUuaWQpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbWVyZ2VkRGF0YTogSVczTWVyZ2VkRGF0YSA9IHtcclxuICAgICAgbWVudU1vZFNldHRpbmdzRGF0YTogbWVudU1vZERhdGEudG9TdHJpbmcoJ2hleCcpLFxyXG4gICAgICBzY3JpcHRNZXJnZWREYXRhOiBzY3JpcHRNZXJnZXNEYXRhICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IHNjcmlwdE1lcmdlc0RhdGEudG9TdHJpbmcoJ2hleCcpXHJcbiAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgY29sbGVjdGlvbkRhdGE6IElXM0NvbGxlY3Rpb25zRGF0YSA9IHtcclxuICAgICAgbG9hZE9yZGVyLFxyXG4gICAgICBtZXJnZWREYXRhLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sbGVjdGlvbkRhdGEpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSkge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZUlkKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IGdhbWVJZCkge1xyXG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uWydpbmZvJ10/LlsnbmFtZSddICE9PSB1bmRlZmluZWQgPyBjb2xsZWN0aW9uWydpbmZvJ11bJ25hbWUnXSA6ICdXaXRjaGVyIDMgQ29sbGVjdGlvbic7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IENvbGxlY3Rpb25QYXJzZUVycm9yKGNvbGxlY3Rpb25OYW1lLFxyXG4gICAgICAnTGFzdCBhY3RpdmUgcHJvZmlsZSBpcyBtaXNzaW5nJykpO1xyXG4gIH1cclxuICBjb25zdCB7IG1lbnVNb2RTZXR0aW5nc0RhdGEsIHNjcmlwdE1lcmdlZERhdGEgfSA9IGNvbGxlY3Rpb24ubWVyZ2VkRGF0YTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgaW1wb3J0TG9hZE9yZGVyKGFwaSwgY29sbGVjdGlvbik7XHJcbiAgICBpZiAobWVudU1vZFNldHRpbmdzRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IGltcG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBoZXgyQnVmZmVyKG1lbnVNb2RTZXR0aW5nc0RhdGEpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2NyaXB0TWVyZ2VkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIHRoZSBzY3JpcHQgbWVyZ2VyIGluc3RhbGxlZCBzdHJhaWdodCBhd2F5IVxyXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYXdhaXQgZG93bmxvYWRTY3JpcHRNZXJnZXIoY29udGV4dCk7XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgaW1wb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQsIHByb2ZpbGUuaWQsIGhleDJCdWZmZXIoc2NyaXB0TWVyZ2VkRGF0YSkpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcbiJdfQ==