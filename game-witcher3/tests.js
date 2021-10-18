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
        const isSuppressed = vortex_api_1.util.getSafe(state, (0, common_1.getSuppressModLimitBranch)(), false);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUNwQyxHQUF3QixFQUN4QixZQUE2Qjs7UUFDL0IsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBaUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSxrQ0FBeUIsR0FBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdFLE1BQU0sT0FBTyxHQUFtQixzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssZ0JBQU8sSUFBSSxZQUFZLEVBQUU7WUFDOUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxJQUFJLEdBQW9DLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFPLENBQUMsQ0FBQztRQUM3RSxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssbUJBQW1CLENBQUMsQ0FBQztRQUNyRixJQUFJLFVBQVUsRUFBRTtZQUVkLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQzVDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUU3RCxJQUFJLEdBQXNCLENBQUM7UUFFM0IsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLG1CQUFtQixFQUFFO1lBQ3pDLEdBQUcsR0FBRztnQkFDSixRQUFRLEVBQUUsU0FBUztnQkFDbkIsV0FBVyxFQUFFO29CQUNYLEtBQUssRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUM7aUJBQzlCO2dCQUNELFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBRSxZQUFZLENBQUMsbUJBQW1CLEVBQVU7YUFDaEUsQ0FBQztTQUNIO1FBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLENBQUM7Q0FBQTtBQWxDRCxnREFrQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRTdXBwcmVzc01vZExpbWl0QnJhbmNoIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBNb2RMaW1pdFBhdGNoZXIgfSBmcm9tICcuL21vZExpbWl0UGF0Y2gnO1xyXG5cclxuY29uc3QgTU9EX0xJTUlUX1RIUkVTSE9MRCA9IDI0O1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RNb2RMaW1pdEJyZWFjaChcclxuICAgIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgIGxpbWl0UGF0Y2hlcjogTW9kTGltaXRQYXRjaGVyKTogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIGNvbnN0IHN0YXRlOiB0eXBlcy5JU3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBpc1N1cHByZXNzZWQgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFN1cHByZXNzTW9kTGltaXRCcmFuY2goKSwgZmFsc2UpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBpc1N1cHByZXNzZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XHJcbiAgY29uc3QgbGltaXRQYXRjaCA9IE9iamVjdC52YWx1ZXMobW9kcykuZmluZChtb2QgPT4gbW9kLnR5cGUgPT09ICd3M21vZGxpbWl0cGF0Y2hlcicpO1xyXG4gIGlmIChsaW1pdFBhdGNoKSB7XHJcbiAgICAvLyBBIGxpbWl0IHBhdGNoIGFscmVhZHkgZXhpc3RzLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZW5hYmxlZCA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihpZCA9PlxyXG4gICAgdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBpZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcclxuXHJcbiAgbGV0IHJlczogdHlwZXMuSVRlc3RSZXN1bHQ7XHJcblxyXG4gIGlmIChlbmFibGVkLmxlbmd0aCA+PSBNT0RfTElNSVRfVEhSRVNIT0xEKSB7XHJcbiAgICByZXMgPSB7XHJcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgICAgc2hvcnQ6IHQoJ01vZCBMaW1pdCBSZWFjaGVkJyksXHJcbiAgICAgIH0sXHJcbiAgICAgIGF1dG9tYXRpY0ZpeDogKCkgPT4gKGxpbWl0UGF0Y2hlci5lbnN1cmVNb2RMaW1pdFBhdGNoKCkgYXMgYW55KSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcyk7XHJcbn1cclxuIl19