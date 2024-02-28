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
function testSMAPIOutdated(api, depManager) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const activeGameId = vortex_api_1.selectors.activeGameId(state);
        if (activeGameId !== GAME_ID) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBOEM7QUFJOUMsbUNBQXFDO0FBRXJDLG1DQUFzRDtBQUV0RCxTQUFzQixpQkFBaUIsQ0FBQyxHQUF3QixFQUN4QixVQUE2Qjs7O1FBRW5FLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFlBQVksR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuRCxJQUFJLFlBQVksS0FBSyxPQUFPLEVBQUU7WUFDNUIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsSUFBSSxtQkFBbUIsR0FBRyxNQUFBLE1BQUEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLE9BQU8sQ0FBQztRQUNqRSxJQUFJLG1CQUFtQixLQUFLLFNBQVMsRUFBRTtZQUVyQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLGVBQWUsR0FBRyxHQUFTLEVBQUU7O1lBQ2pDLG1CQUFtQixHQUFHLE1BQUEsTUFBQSxJQUFBLG9CQUFZLEVBQUMsR0FBRyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsT0FBTyxDQUFDO1lBQzdELE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDekQsTUFBTSxrQkFBa0IsR0FBYSxFQUFFLENBQUM7WUFDeEMsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDOUQsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztvQkFDN0MsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFO3dCQUN4QyxPQUFPLENBQUMsSUFBQSxZQUFHLEVBQUMsbUJBQW1CLEVBQUUsSUFBQSxlQUFNLEVBQUMsTUFBQSxJQUFJLENBQUMsaUJBQWlCLG1DQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUM7cUJBQzdFO29CQUNELE9BQU8sS0FBSyxDQUFDO2dCQUNmLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQzNCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQSxDQUFBO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLEVBQUUsQ0FBQztRQUN6QyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ3hCLE9BQU8sUUFBUTtZQUNiLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNoQixXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDakMsSUFBSSxFQUFFLENBQUMsQ0FBQyxtRkFBbUY7MEJBQ25GLHNEQUFzRCxDQUFDO2lCQUNoRTtnQkFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSxxQkFBYSxFQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7Z0JBQzVDLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlLEVBQUU7Z0JBQ2xDLFFBQVEsRUFBRSxTQUFrQzthQUM3QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O0NBQ2hDO0FBL0NELDhDQStDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzLCBzZWxlY3RvcnMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IGNvZXJjZSwgZ3RlIH0gZnJvbSAnc2VtdmVyJztcclxuXHJcbmltcG9ydCB7IGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9IGZyb20gJy4vU01BUEknO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RTTUFQSU91dGRhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcE1hbmFnZXI6IERlcGVuZGVuY3lNYW5hZ2VyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlR2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBsZXQgY3VycmVudFNNQVBJVmVyc2lvbiA9IGZpbmRTTUFQSU1vZChhcGkpPy5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xyXG4gIGlmIChjdXJyZW50U01BUElWZXJzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFNNQVBJIGlzbid0IGluc3RhbGxlZCBvciBlbmFibGVkLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaXNTbWFwaU91dGRhdGVkID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgY3VycmVudFNNQVBJVmVyc2lvbiA9IGZpbmRTTUFQSU1vZChhcGkpPy5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xyXG4gICAgY29uc3QgZW5hYmxlZE1hbmlmZXN0cyA9IGF3YWl0IGRlcE1hbmFnZXIuZ2V0TWFuaWZlc3RzKCk7XHJcbiAgICBjb25zdCBpbmNvbXBhdGlibGVNb2RJZHM6IHN0cmluZ1tdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IFtpZCwgbWFuaWZlc3RzXSBvZiBPYmplY3QuZW50cmllcyhlbmFibGVkTWFuaWZlc3RzKSkge1xyXG4gICAgICBjb25zdCBpbmNvbXBhdGlibGUgPSBtYW5pZmVzdHMuZmlsdGVyKChpdGVyKSA9PiB7XHJcbiAgICAgICAgaWYgKGl0ZXIuTWluaW11bUFwaVZlcnNpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmV0dXJuICFndGUoY3VycmVudFNNQVBJVmVyc2lvbiwgY29lcmNlKGl0ZXIuTWluaW11bUFwaVZlcnNpb24gPz8gJzAuMC4wJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoaW5jb21wYXRpYmxlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBpbmNvbXBhdGlibGVNb2RJZHMucHVzaChpZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKGluY29tcGF0aWJsZU1vZElkcy5sZW5ndGggPiAwKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBvdXRkYXRlZCA9IGF3YWl0IGlzU21hcGlPdXRkYXRlZCgpO1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIHJldHVybiBvdXRkYXRlZFxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBkZXNjcmlwdGlvbjoge1xyXG4gICAgICAgIHNob3J0OiB0KCdTTUFQSSB1cGRhdGUgcmVxdWlyZWQnKSxcclxuICAgICAgICBsb25nOiB0KCdTb21lIFN0YXJkZXcgVmFsbGV5IG1vZHMgcmVxdWlyZSBhIG5ld2VyIHZlcnNpb24gb2YgU01BUEkgdG8gZnVuY3Rpb24gY29ycmVjdGx5LCAnXHJcbiAgICAgICAgICAgICAgKyAneW91IHNob3VsZCBjaGVjayBmb3IgU01BUEkgdXBkYXRlcyBpbiB0aGUgbW9kcyBwYWdlLicpLFxyXG4gICAgICB9LFxyXG4gICAgICBhdXRvbWF0aWNGaXg6ICgpID0+IGRvd25sb2FkU01BUEkoYXBpLCB0cnVlKSxcclxuICAgICAgb25SZWNoZWNrOiAoKSA9PiBpc1NtYXBpT3V0ZGF0ZWQoKSxcclxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyBhcyB0eXBlcy5Qcm9ibGVtU2V2ZXJpdHksXHJcbiAgICB9KVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxufSJdfQ==