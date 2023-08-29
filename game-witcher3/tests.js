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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUNwQyxHQUF3QixFQUN4QixZQUE2Qjs7O1FBQy9CLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQWlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsa0NBQXlCLEdBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBbUIsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sSUFBSSxZQUFZLEVBQUU7WUFDL0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxJQUFJLEdBQW9DLE1BQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQU8sQ0FBQyxtQ0FBSSxFQUFFLENBQUM7UUFDbkYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLG1CQUFtQixDQUFDLENBQUM7UUFDckYsSUFBSSxVQUFVLEVBQUU7WUFFZCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUM1QyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxHQUFzQixDQUFDO1FBRTNCLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxtQkFBbUIsRUFBRTtZQUN6QyxHQUFHLEdBQUc7Z0JBQ0osUUFBUSxFQUFFLFNBQVM7Z0JBQ25CLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO2lCQUM5QjtnQkFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUUsWUFBWSxDQUFDLG1CQUFtQixFQUFVO2FBQ2hFLENBQUM7U0FDSDtRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Q0FDN0I7QUFsQ0QsZ0RBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRTdXBwcmVzc01vZExpbWl0QnJhbmNoIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgTW9kTGltaXRQYXRjaGVyIH0gZnJvbSAnLi9tb2RMaW1pdFBhdGNoJztcblxuY29uc3QgTU9EX0xJTUlUX1RIUkVTSE9MRCA9IDI0O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdE1vZExpbWl0QnJlYWNoKFxuICAgIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICBsaW1pdFBhdGNoZXI6IE1vZExpbWl0UGF0Y2hlcik6IFByb21pc2U8dHlwZXMuSVRlc3RSZXN1bHQ+IHtcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XG4gIGNvbnN0IHN0YXRlOiB0eXBlcy5JU3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgaXNTdXBwcmVzc2VkID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRTdXBwcmVzc01vZExpbWl0QnJhbmNoKCksIGZhbHNlKTtcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgaXNTdXBwcmVzc2VkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG5cbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXSA/PyB7fTtcbiAgY29uc3QgbGltaXRQYXRjaCA9IE9iamVjdC52YWx1ZXMobW9kcykuZmluZChtb2QgPT4gbW9kLnR5cGUgPT09ICd3M21vZGxpbWl0cGF0Y2hlcicpO1xuICBpZiAobGltaXRQYXRjaCkge1xuICAgIC8vIEEgbGltaXQgcGF0Y2ggYWxyZWFkeSBleGlzdHMuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG5cbiAgY29uc3QgZW5hYmxlZCA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihpZCA9PlxuICAgIHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgaWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XG5cbiAgbGV0IHJlczogdHlwZXMuSVRlc3RSZXN1bHQ7XG5cbiAgaWYgKGVuYWJsZWQubGVuZ3RoID49IE1PRF9MSU1JVF9USFJFU0hPTEQpIHtcbiAgICByZXMgPSB7XG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgZGVzY3JpcHRpb246IHtcbiAgICAgICAgc2hvcnQ6IHQoJ01vZCBMaW1pdCBSZWFjaGVkJyksXG4gICAgICB9LFxuICAgICAgYXV0b21hdGljRml4OiAoKSA9PiAobGltaXRQYXRjaGVyLmVuc3VyZU1vZExpbWl0UGF0Y2goKSBhcyBhbnkpLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcyk7XG59XG4iXX0=