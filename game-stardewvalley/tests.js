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
exports.testSMAPIOutdated = void 0;
const vortex_api_1 = require("vortex-api");
const semver_1 = require("semver");
const SMAPI_1 = require("./SMAPI");
const common_1 = require("./common");
function testSMAPIOutdated(api, depManager) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const activeGameId = vortex_api_1.selectors.activeGameId(state);
        if (activeGameId !== common_1.GAME_ID) {
            return Promise.resolve(undefined);
        }
        let currentSMAPIVersion = (_b = (_a = (0, SMAPI_1.findSMAPIMod)(api)) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.version;
        if (currentSMAPIVersion === undefined) {
            return Promise.resolve(undefined);
        }
        const isSmapiOutdated = () => __awaiter(this, void 0, void 0, function* () {
            var _c, _d;
            currentSMAPIVersion = (_d = (_c = (0, SMAPI_1.findSMAPIMod)(api)) === null || _c === void 0 ? void 0 : _c.attributes) === null || _d === void 0 ? void 0 : _d.version;
            const enabledManifests = yield depManager.getManifests();
            const incompatibleModIds = [];
            for (const [id, manifests] of Object.entries(enabledManifests)) {
                const incompatible = manifests.filter((iter) => {
                    var _a;
                    if (iter.MinimumApiVersion !== undefined) {
                        return !(0, semver_1.gte)(currentSMAPIVersion, (0, semver_1.coerce)((_a = iter.MinimumApiVersion) !== null && _a !== void 0 ? _a : '0.0.0'));
                    }
                    return false;
                });
                if (incompatible.length > 0) {
                    incompatibleModIds.push(id);
                }
            }
            return Promise.resolve((incompatibleModIds.length > 0));
        });
        const outdated = yield isSmapiOutdated();
        const t = api.translate;
        return outdated
            ? Promise.resolve({
                description: {
                    short: t('SMAPI update required'),
                    long: t('Some Stardew Valley mods require a newer version of SMAPI to function correctly, '
                        + 'you should check for SMAPI updates in the mods page.'),
                },
                automaticFix: () => (0, SMAPI_1.downloadSMAPI)(api, true),
                onRecheck: () => isSmapiOutdated(),
                severity: 'warning',
            })
            : Promise.resolve(undefined);
    });
}
exports.testSMAPIOutdated = testSMAPIOutdated;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBOEM7QUFJOUMsbUNBQXFDO0FBRXJDLG1DQUFzRDtBQUV0RCxxQ0FBbUM7QUFFbkMsU0FBc0IsaUJBQWlCLENBQUMsR0FBd0IsRUFDeEIsVUFBNkI7OztRQUVuRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxZQUFZLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkQsSUFBSSxZQUFZLEtBQUssZ0JBQU8sRUFBRTtZQUM1QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxJQUFJLG1CQUFtQixHQUFHLE1BQUEsTUFBQSxJQUFBLG9CQUFZLEVBQUMsR0FBRyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsT0FBTyxDQUFDO1FBQ2pFLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO1lBRXJDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sZUFBZSxHQUFHLEdBQVMsRUFBRTs7WUFDakMsbUJBQW1CLEdBQUcsTUFBQSxNQUFBLElBQUEsb0JBQVksRUFBQyxHQUFHLENBQUMsMENBQUUsVUFBVSwwQ0FBRSxPQUFPLENBQUM7WUFDN0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN6RCxNQUFNLGtCQUFrQixHQUFhLEVBQUUsQ0FBQztZQUN4QyxLQUFLLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUM5RCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7O29CQUM3QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTLEVBQUU7d0JBQ3hDLE9BQU8sQ0FBQyxJQUFBLFlBQUcsRUFBQyxtQkFBbUIsRUFBRSxJQUFBLGVBQU0sRUFBQyxNQUFBLElBQUksQ0FBQyxpQkFBaUIsbUNBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztxQkFDN0U7b0JBQ0QsT0FBTyxLQUFLLENBQUM7Z0JBQ2YsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDM0Isa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM3QjthQUNGO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFBLENBQUE7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsT0FBTyxRQUFRO1lBQ2IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7Z0JBQ2hCLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDO29CQUNqQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLG1GQUFtRjswQkFDbkYsc0RBQXNELENBQUM7aUJBQ2hFO2dCQUNELFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHFCQUFhLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztnQkFDNUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWUsRUFBRTtnQkFDbEMsUUFBUSxFQUFFLFNBQWtDO2FBQzdDLENBQUM7WUFDRixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7Q0FDaEM7QUEvQ0QsOENBK0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZXMsIHNlbGVjdG9ycyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IERlcGVuZGVuY3lNYW5hZ2VyIGZyb20gJy4vRGVwZW5kZW5jeU1hbmFnZXInO1xyXG5cclxuaW1wb3J0IHsgY29lcmNlLCBndGUgfSBmcm9tICdzZW12ZXInO1xyXG5cclxuaW1wb3J0IHsgZG93bmxvYWRTTUFQSSwgZmluZFNNQVBJTW9kIH0gZnJvbSAnLi9TTUFQSSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RTTUFQSU91dGRhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcE1hbmFnZXI6IERlcGVuZGVuY3lNYW5hZ2VyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlR2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBsZXQgY3VycmVudFNNQVBJVmVyc2lvbiA9IGZpbmRTTUFQSU1vZChhcGkpPy5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xyXG4gIGlmIChjdXJyZW50U01BUElWZXJzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFNNQVBJIGlzbid0IGluc3RhbGxlZCBvciBlbmFibGVkLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaXNTbWFwaU91dGRhdGVkID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgY3VycmVudFNNQVBJVmVyc2lvbiA9IGZpbmRTTUFQSU1vZChhcGkpPy5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xyXG4gICAgY29uc3QgZW5hYmxlZE1hbmlmZXN0cyA9IGF3YWl0IGRlcE1hbmFnZXIuZ2V0TWFuaWZlc3RzKCk7XHJcbiAgICBjb25zdCBpbmNvbXBhdGlibGVNb2RJZHM6IHN0cmluZ1tdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IFtpZCwgbWFuaWZlc3RzXSBvZiBPYmplY3QuZW50cmllcyhlbmFibGVkTWFuaWZlc3RzKSkge1xyXG4gICAgICBjb25zdCBpbmNvbXBhdGlibGUgPSBtYW5pZmVzdHMuZmlsdGVyKChpdGVyKSA9PiB7XHJcbiAgICAgICAgaWYgKGl0ZXIuTWluaW11bUFwaVZlcnNpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmV0dXJuICFndGUoY3VycmVudFNNQVBJVmVyc2lvbiwgY29lcmNlKGl0ZXIuTWluaW11bUFwaVZlcnNpb24gPz8gJzAuMC4wJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoaW5jb21wYXRpYmxlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBpbmNvbXBhdGlibGVNb2RJZHMucHVzaChpZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKGluY29tcGF0aWJsZU1vZElkcy5sZW5ndGggPiAwKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBvdXRkYXRlZCA9IGF3YWl0IGlzU21hcGlPdXRkYXRlZCgpO1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIHJldHVybiBvdXRkYXRlZFxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBkZXNjcmlwdGlvbjoge1xyXG4gICAgICAgIHNob3J0OiB0KCdTTUFQSSB1cGRhdGUgcmVxdWlyZWQnKSxcclxuICAgICAgICBsb25nOiB0KCdTb21lIFN0YXJkZXcgVmFsbGV5IG1vZHMgcmVxdWlyZSBhIG5ld2VyIHZlcnNpb24gb2YgU01BUEkgdG8gZnVuY3Rpb24gY29ycmVjdGx5LCAnXHJcbiAgICAgICAgICAgICAgKyAneW91IHNob3VsZCBjaGVjayBmb3IgU01BUEkgdXBkYXRlcyBpbiB0aGUgbW9kcyBwYWdlLicpLFxyXG4gICAgICB9LFxyXG4gICAgICBhdXRvbWF0aWNGaXg6ICgpID0+IGRvd25sb2FkU01BUEkoYXBpLCB0cnVlKSxcclxuICAgICAgb25SZWNoZWNrOiAoKSA9PiBpc1NtYXBpT3V0ZGF0ZWQoKSxcclxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyBhcyB0eXBlcy5Qcm9ibGVtU2V2ZXJpdHksXHJcbiAgICB9KVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxufSJdfQ==