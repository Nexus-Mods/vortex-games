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
    return __awaiter(this, void 0, void 0, function* () {
        const t = api.translate;
        const state = api.store.getState();
        const isSuppressed = vortex_api_1.util.getSafe(state, common_1.getSuppressModLimitBranch(), false);
        const profile = vortex_api_1.selectors.activeProfile(state);
        if (profile.gameId !== common_1.GAME_ID || isSuppressed) {
            return Promise.resolve(undefined);
        }
        const mods = state.persistent.mods[common_1.GAME_ID];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUNwQyxHQUF3QixFQUN4QixZQUE2Qjs7UUFDL0IsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBaUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsa0NBQXlCLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBbUIsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLGdCQUFPLElBQUksWUFBWSxFQUFFO1lBQzlDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sSUFBSSxHQUFvQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBTyxDQUFDLENBQUM7UUFDN0UsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLG1CQUFtQixDQUFDLENBQUM7UUFDckYsSUFBSSxVQUFVLEVBQUU7WUFFZCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUM1QyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxHQUFzQixDQUFDO1FBRTNCLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxtQkFBbUIsRUFBRTtZQUN6QyxHQUFHLEdBQUc7Z0JBQ0osUUFBUSxFQUFFLFNBQVM7Z0JBQ25CLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO2lCQUM5QjtnQkFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUUsWUFBWSxDQUFDLG1CQUFtQixFQUFVO2FBQ2hFLENBQUM7U0FDSDtRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQUE7QUFsQ0QsZ0RBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgZ2V0U3VwcHJlc3NNb2RMaW1pdEJyYW5jaCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgTW9kTGltaXRQYXRjaGVyIH0gZnJvbSAnLi9tb2RMaW1pdFBhdGNoJztcclxuXHJcbmNvbnN0IE1PRF9MSU1JVF9USFJFU0hPTEQgPSAyNDtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0TW9kTGltaXRCcmVhY2goXHJcbiAgICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICBsaW1pdFBhdGNoZXI6IE1vZExpbWl0UGF0Y2hlcik6IFByb21pc2U8dHlwZXMuSVRlc3RSZXN1bHQ+IHtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICBjb25zdCBzdGF0ZTogdHlwZXMuSVN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgaXNTdXBwcmVzc2VkID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRTdXBwcmVzc01vZExpbWl0QnJhbmNoKCksIGZhbHNlKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQgfHwgaXNTdXBwcmVzc2VkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdO1xyXG4gIGNvbnN0IGxpbWl0UGF0Y2ggPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQobW9kID0+IG1vZC50eXBlID09PSAndzNtb2RsaW1pdHBhdGNoZXInKTtcclxuICBpZiAobGltaXRQYXRjaCkge1xyXG4gICAgLy8gQSBsaW1pdCBwYXRjaCBhbHJlYWR5IGV4aXN0cy5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGVuYWJsZWQgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIoaWQgPT5cclxuICAgIHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgaWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XHJcblxyXG4gIGxldCByZXM6IHR5cGVzLklUZXN0UmVzdWx0O1xyXG5cclxuICBpZiAoZW5hYmxlZC5sZW5ndGggPj0gTU9EX0xJTUlUX1RIUkVTSE9MRCkge1xyXG4gICAgcmVzID0ge1xyXG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxyXG4gICAgICBkZXNjcmlwdGlvbjoge1xyXG4gICAgICAgIHNob3J0OiB0KCdNb2QgTGltaXQgUmVhY2hlZCcpLFxyXG4gICAgICB9LFxyXG4gICAgICBhdXRvbWF0aWNGaXg6ICgpID0+IChsaW1pdFBhdGNoZXIuZW5zdXJlTW9kTGltaXRQYXRjaCgpIGFzIGFueSksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXMpO1xyXG59XHJcbiJdfQ==