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
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID || isSuppressed) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUNwQyxHQUF3QixFQUN4QixZQUE2Qjs7UUFDL0IsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBaUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSxrQ0FBeUIsR0FBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdFLE1BQU0sT0FBTyxHQUFtQixzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvRCxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxJQUFJLFlBQVksRUFBRTtZQUMvQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLElBQUksR0FBb0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO1FBQzdFLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JGLElBQUksVUFBVSxFQUFFO1lBRWQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FDNUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRTdELElBQUksR0FBc0IsQ0FBQztRQUUzQixJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksbUJBQW1CLEVBQUU7WUFDekMsR0FBRyxHQUFHO2dCQUNKLFFBQVEsRUFBRSxTQUFTO2dCQUNuQixXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztpQkFDOUI7Z0JBQ0QsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFFLFlBQVksQ0FBQyxtQkFBbUIsRUFBVTthQUNoRSxDQUFDO1NBQ0g7UUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsQ0FBQztDQUFBO0FBbENELGdEQWtDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIGdldFN1cHByZXNzTW9kTGltaXRCcmFuY2ggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IE1vZExpbWl0UGF0Y2hlciB9IGZyb20gJy4vbW9kTGltaXRQYXRjaCc7XHJcblxyXG5jb25zdCBNT0RfTElNSVRfVEhSRVNIT0xEID0gMjQ7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdE1vZExpbWl0QnJlYWNoKFxyXG4gICAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgbGltaXRQYXRjaGVyOiBNb2RMaW1pdFBhdGNoZXIpOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgY29uc3Qgc3RhdGU6IHR5cGVzLklTdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGlzU3VwcHJlc3NlZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0U3VwcHJlc3NNb2RMaW1pdEJyYW5jaCgpLCBmYWxzZSk7XHJcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBpc1N1cHByZXNzZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XHJcbiAgY29uc3QgbGltaXRQYXRjaCA9IE9iamVjdC52YWx1ZXMobW9kcykuZmluZChtb2QgPT4gbW9kLnR5cGUgPT09ICd3M21vZGxpbWl0cGF0Y2hlcicpO1xyXG4gIGlmIChsaW1pdFBhdGNoKSB7XHJcbiAgICAvLyBBIGxpbWl0IHBhdGNoIGFscmVhZHkgZXhpc3RzLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZW5hYmxlZCA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihpZCA9PlxyXG4gICAgdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBpZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcclxuXHJcbiAgbGV0IHJlczogdHlwZXMuSVRlc3RSZXN1bHQ7XHJcblxyXG4gIGlmIChlbmFibGVkLmxlbmd0aCA+PSBNT0RfTElNSVRfVEhSRVNIT0xEKSB7XHJcbiAgICByZXMgPSB7XHJcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgICAgc2hvcnQ6IHQoJ01vZCBMaW1pdCBSZWFjaGVkJyksXHJcbiAgICAgIH0sXHJcbiAgICAgIGF1dG9tYXRpY0ZpeDogKCkgPT4gKGxpbWl0UGF0Y2hlci5lbnN1cmVNb2RMaW1pdFBhdGNoKCkgYXMgYW55KSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcyk7XHJcbn1cclxuIl19