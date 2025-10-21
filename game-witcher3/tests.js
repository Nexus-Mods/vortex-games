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
exports.testModLimitBreach = testModLimitBreach;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const MOD_LIMIT_THRESHOLD = 24;
function testModLimitBreach(api, limitPatcher) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLGdEQWtDQztBQXpDRCwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUNwQyxHQUF3QixFQUN4QixZQUE2Qjs7O1FBQy9CLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQWlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsa0NBQXlCLEdBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBbUIsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNoRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFvQyxNQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFPLENBQUMsbUNBQUksRUFBRSxDQUFDO1FBQ25GLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JGLElBQUksVUFBVSxFQUFFLENBQUM7WUFFZixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQzVDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUU3RCxJQUFJLEdBQXNCLENBQUM7UUFFM0IsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFDMUMsR0FBRyxHQUFHO2dCQUNKLFFBQVEsRUFBRSxTQUFTO2dCQUNuQixXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztpQkFDOUI7Z0JBQ0QsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFFLFlBQVksQ0FBQyxtQkFBbUIsRUFBVTthQUNoRSxDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRTdXBwcmVzc01vZExpbWl0QnJhbmNoIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBNb2RMaW1pdFBhdGNoZXIgfSBmcm9tICcuL21vZExpbWl0UGF0Y2gnO1xyXG5cclxuY29uc3QgTU9EX0xJTUlUX1RIUkVTSE9MRCA9IDI0O1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RNb2RMaW1pdEJyZWFjaChcclxuICAgIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgIGxpbWl0UGF0Y2hlcjogTW9kTGltaXRQYXRjaGVyKTogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIGNvbnN0IHN0YXRlOiB0eXBlcy5JU3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBpc1N1cHByZXNzZWQgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFN1cHByZXNzTW9kTGltaXRCcmFuY2goKSwgZmFsc2UpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgaXNTdXBwcmVzc2VkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdID8/IHt9O1xyXG4gIGNvbnN0IGxpbWl0UGF0Y2ggPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQobW9kID0+IG1vZC50eXBlID09PSAndzNtb2RsaW1pdHBhdGNoZXInKTtcclxuICBpZiAobGltaXRQYXRjaCkge1xyXG4gICAgLy8gQSBsaW1pdCBwYXRjaCBhbHJlYWR5IGV4aXN0cy5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGVuYWJsZWQgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIoaWQgPT5cclxuICAgIHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgaWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XHJcblxyXG4gIGxldCByZXM6IHR5cGVzLklUZXN0UmVzdWx0O1xyXG5cclxuICBpZiAoZW5hYmxlZC5sZW5ndGggPj0gTU9EX0xJTUlUX1RIUkVTSE9MRCkge1xyXG4gICAgcmVzID0ge1xyXG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxyXG4gICAgICBkZXNjcmlwdGlvbjoge1xyXG4gICAgICAgIHNob3J0OiB0KCdNb2QgTGltaXQgUmVhY2hlZCcpLFxyXG4gICAgICB9LFxyXG4gICAgICBhdXRvbWF0aWNGaXg6ICgpID0+IChsaW1pdFBhdGNoZXIuZW5zdXJlTW9kTGltaXRQYXRjaCgpIGFzIGFueSksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXMpO1xyXG59XHJcbiJdfQ==