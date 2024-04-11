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
exports.testModLimitBreach = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const MOD_LIMIT_THRESHOLD = 24;
function testModLimitBreach(api, limitPatcher) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const t = api.translate;
        const state = api.store.getState();
        const isSuppressed = vortex_api_1.util.getSafe(state, (0, common_1.getSuppressModLimitBranch)(), false);
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID || isSuppressed) {
            return Promise.resolve(undefined);
        }
        const mods = (_a = state.persistent.mods[common_1.GAME_ID]) !== null && _a !== void 0 ? _a : {};
        const limitPatch = Object.values(mods).find(mod => mod.type === 'w3modlimitpatcher');
        if (limitPatch) {
            return Promise.resolve(undefined);
        }
        const enabled = Object.keys(mods).filter(id => vortex_api_1.util.getSafe(profile, ['modState', id, 'enabled'], false));
        let res;
        if (enabled.length >= MOD_LIMIT_THRESHOLD) {
            res = {
                severity: 'warning',
                description: {
                    short: t('Mod Limit Reached'),
                },
                automaticFix: () => limitPatcher.ensureModLimitPatch(),
            };
        }
        return Promise.resolve(res);
    });
}
exports.testModLimitBreach = testModLimitBreach;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUNwQyxHQUF3QixFQUN4QixZQUE2Qjs7O1FBQy9CLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQWlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsa0NBQXlCLEdBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBbUIsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sSUFBSSxZQUFZLEVBQUU7WUFDL0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxJQUFJLEdBQW9DLE1BQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQU8sQ0FBQyxtQ0FBSSxFQUFFLENBQUM7UUFDbkYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLG1CQUFtQixDQUFDLENBQUM7UUFDckYsSUFBSSxVQUFVLEVBQUU7WUFFZCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUM1QyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxHQUFzQixDQUFDO1FBRTNCLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxtQkFBbUIsRUFBRTtZQUN6QyxHQUFHLEdBQUc7Z0JBQ0osUUFBUSxFQUFFLFNBQVM7Z0JBQ25CLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO2lCQUM5QjtnQkFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUUsWUFBWSxDQUFDLG1CQUFtQixFQUFVO2FBQ2hFLENBQUM7U0FDSDtRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Q0FDN0I7QUFsQ0QsZ0RBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgZ2V0U3VwcHJlc3NNb2RMaW1pdEJyYW5jaCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgTW9kTGltaXRQYXRjaGVyIH0gZnJvbSAnLi9tb2RMaW1pdFBhdGNoJztcclxuXHJcbmNvbnN0IE1PRF9MSU1JVF9USFJFU0hPTEQgPSAyNDtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0TW9kTGltaXRCcmVhY2goXHJcbiAgICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICBsaW1pdFBhdGNoZXI6IE1vZExpbWl0UGF0Y2hlcik6IFByb21pc2U8dHlwZXMuSVRlc3RSZXN1bHQ+IHtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICBjb25zdCBzdGF0ZTogdHlwZXMuSVN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgaXNTdXBwcmVzc2VkID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRTdXBwcmVzc01vZExpbWl0QnJhbmNoKCksIGZhbHNlKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGlzU3VwcHJlc3NlZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXSA/PyB7fTtcclxuICBjb25zdCBsaW1pdFBhdGNoID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maW5kKG1vZCA9PiBtb2QudHlwZSA9PT0gJ3czbW9kbGltaXRwYXRjaGVyJyk7XHJcbiAgaWYgKGxpbWl0UGF0Y2gpIHtcclxuICAgIC8vIEEgbGltaXQgcGF0Y2ggYWxyZWFkeSBleGlzdHMuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XHJcbiAgICB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIGlkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xyXG5cclxuICBsZXQgcmVzOiB0eXBlcy5JVGVzdFJlc3VsdDtcclxuXHJcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID49IE1PRF9MSU1JVF9USFJFU0hPTEQpIHtcclxuICAgIHJlcyA9IHtcclxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcclxuICAgICAgZGVzY3JpcHRpb246IHtcclxuICAgICAgICBzaG9ydDogdCgnTW9kIExpbWl0IFJlYWNoZWQnKSxcclxuICAgICAgfSxcclxuICAgICAgYXV0b21hdGljRml4OiAoKSA9PiAobGltaXRQYXRjaGVyLmVuc3VyZU1vZExpbWl0UGF0Y2goKSBhcyBhbnkpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzKTtcclxufVxyXG4iXX0=