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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBb0Q7QUFFcEQsc0NBQXNEO0FBSXRELDJDQUErRDtBQUUvRCx3Q0FBMEQ7QUFDMUQsZ0RBQXdFO0FBRXhFLGtEQUF1RDtBQUV2RCxpQ0FBMEQ7QUFFMUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFlBQXNCLEVBQ3RCLFVBQXNCOztRQUM3RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFlLE1BQU0sSUFBQSwyQkFBZSxFQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEYsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHVCQUFhLEVBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNwRSxNQUFNLGdCQUFnQixHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDekMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pGLElBQUksZ0JBQWdCLENBQUM7WUFDckIsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVB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RTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1Qjs7Q0FDRjtBQS9CRCxvREErQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBTQ1JJUFRfTUVSR0VSX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IElMb2FkT3JkZXIsIElXM0NvbGxlY3Rpb25zRGF0YSwgSVczTWVyZ2VkRGF0YSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgZXhwb3J0TG9hZE9yZGVyLCBpbXBvcnRMb2FkT3JkZXIgfSBmcm9tICcuL2xvYWRPcmRlcic7XHJcblxyXG5pbXBvcnQgeyBleHBvcnRNZW51TW9kLCBpbXBvcnRNZW51TW9kIH0gZnJvbSAnLi4vbWVudW1vZCc7XHJcbmltcG9ydCB7IGV4cG9ydFNjcmlwdE1lcmdlcywgaW1wb3J0U2NyaXB0TWVyZ2VzIH0gZnJvbSAnLi4vbWVyZ2VCYWNrdXAnO1xyXG5cclxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIgfSBmcm9tICcuLi9zY3JpcHRtZXJnZXInO1xyXG5cclxuaW1wb3J0IHsgQ29sbGVjdGlvblBhcnNlRXJyb3IsIGhleDJCdWZmZXIgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpIHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgZ2FtZUlkXSwge30pO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBsb2FkT3JkZXI6IElMb2FkT3JkZXIgPSBhd2FpdCBleHBvcnRMb2FkT3JkZXIoYXBpLmdldFN0YXRlKCksIGluY2x1ZGVkTW9kcywgbW9kcyk7XHJcbiAgICBjb25zdCBtZW51TW9kRGF0YSA9IGF3YWl0IGV4cG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBpbmNsdWRlZE1vZHMpO1xyXG4gICAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBsZXQgc2NyaXB0TWVyZ2VzRGF0YTtcclxuICAgIGlmIChzY3JpcHRNZXJnZXJUb29sICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgc2NyaXB0TWVyZ2VzRGF0YSA9IGF3YWl0IGV4cG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LmFwaSwgcHJvZmlsZS5pZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1lcmdlZERhdGE6IElXM01lcmdlZERhdGEgPSB7XHJcbiAgICAgIG1lbnVNb2RTZXR0aW5nc0RhdGE6IChtZW51TW9kRGF0YSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgID8gbWVudU1vZERhdGEudG9TdHJpbmcoJ2hleCcpXHJcbiAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICAgIHNjcmlwdE1lcmdlZERhdGE6IHNjcmlwdE1lcmdlc0RhdGEgIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gc2NyaXB0TWVyZ2VzRGF0YS50b1N0cmluZygnaGV4JylcclxuICAgICAgICA6IHVuZGVmaW5lZCxcclxuICAgIH07XHJcbiAgICBjb25zdCBjb2xsZWN0aW9uRGF0YTogSVczQ29sbGVjdGlvbnNEYXRhID0ge1xyXG4gICAgICBsb2FkT3JkZXIsXHJcbiAgICAgIG1lcmdlZERhdGEsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2xsZWN0aW9uRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKSB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBnYW1lSWQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gZ2FtZUlkKSB7XHJcbiAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb25bJ2luZm8nXT8uWyduYW1lJ10gIT09IHVuZGVmaW5lZCA/IGNvbGxlY3Rpb25bJ2luZm8nXVsnbmFtZSddIDogJ1dpdGNoZXIgMyBDb2xsZWN0aW9uJztcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQ29sbGVjdGlvblBhcnNlRXJyb3IoY29sbGVjdGlvbk5hbWUsXHJcbiAgICAgICdMYXN0IGFjdGl2ZSBwcm9maWxlIGlzIG1pc3NpbmcnKSk7XHJcbiAgfVxyXG4gIGNvbnN0IHsgbWVudU1vZFNldHRpbmdzRGF0YSwgc2NyaXB0TWVyZ2VkRGF0YSB9ID0gY29sbGVjdGlvbi5tZXJnZWREYXRhO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBpbXBvcnRMb2FkT3JkZXIoYXBpLCBjb2xsZWN0aW9uKTtcclxuICAgIGlmIChtZW51TW9kU2V0dGluZ3NEYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXdhaXQgaW1wb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGhleDJCdWZmZXIobWVudU1vZFNldHRpbmdzRGF0YSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzY3JpcHRNZXJnZWREYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgdGhlIHNjcmlwdCBtZXJnZXIgaW5zdGFsbGVkIHN0cmFpZ2h0IGF3YXkhXHJcbiAgICAgIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChzY3JpcHRNZXJnZXJUb29sID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBhd2FpdCBkb3dubG9hZFNjcmlwdE1lcmdlcihhcGkpO1xyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IGltcG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LmFwaSwgcHJvZmlsZS5pZCwgaGV4MkJ1ZmZlcihzY3JpcHRNZXJnZWREYXRhKSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuIl19