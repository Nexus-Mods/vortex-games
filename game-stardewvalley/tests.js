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
const semver_1 = require("semver");
const SMAPI_1 = require("./SMAPI");
function testSMAPIOutdated(api, depManager) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFJQSxtQ0FBcUM7QUFFckMsbUNBQXNEO0FBRXRELFNBQXNCLGlCQUFpQixDQUFDLEdBQXdCLEVBQ3hCLFVBQTZCOzs7UUFFbkUsSUFBSSxtQkFBbUIsR0FBRyxNQUFBLE1BQUEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLE9BQU8sQ0FBQztRQUNqRSxJQUFJLG1CQUFtQixLQUFLLFNBQVMsRUFBRTtZQUVyQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLGVBQWUsR0FBRyxHQUFTLEVBQUU7O1lBQ2pDLG1CQUFtQixHQUFHLE1BQUEsTUFBQSxJQUFBLG9CQUFZLEVBQUMsR0FBRyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsT0FBTyxDQUFDO1lBQzdELE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDekQsTUFBTSxrQkFBa0IsR0FBYSxFQUFFLENBQUM7WUFDeEMsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDOUQsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztvQkFDN0MsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFO3dCQUN4QyxPQUFPLENBQUMsSUFBQSxZQUFHLEVBQUMsbUJBQW1CLEVBQUUsSUFBQSxlQUFNLEVBQUMsTUFBQSxJQUFJLENBQUMsaUJBQWlCLG1DQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUM7cUJBQzdFO29CQUNELE9BQU8sS0FBSyxDQUFDO2dCQUNmLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQzNCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQSxDQUFBO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLEVBQUUsQ0FBQztRQUN6QyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ3hCLE9BQU8sUUFBUTtZQUNiLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNoQixXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDakMsSUFBSSxFQUFFLENBQUMsQ0FBQyxtRkFBbUY7MEJBQ25GLHNEQUFzRCxDQUFDO2lCQUNoRTtnQkFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSxxQkFBYSxFQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7Z0JBQzVDLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlLEVBQUU7Z0JBQ2xDLFFBQVEsRUFBRSxTQUFrQzthQUM3QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O0NBQ2hDO0FBekNELDhDQXlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgRGVwZW5kZW5jeU1hbmFnZXIgZnJvbSAnLi9kZXBlbmRlbmN5TWFuYWdlcic7XHJcblxyXG5pbXBvcnQgeyBjb2VyY2UsIGd0ZSB9IGZyb20gJ3NlbXZlcic7XHJcblxyXG5pbXBvcnQgeyBkb3dubG9hZFNNQVBJLCBmaW5kU01BUElNb2QgfSBmcm9tICcuL1NNQVBJJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0U01BUElPdXRkYXRlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xyXG4gIGxldCBjdXJyZW50U01BUElWZXJzaW9uID0gZmluZFNNQVBJTW9kKGFwaSk/LmF0dHJpYnV0ZXM/LnZlcnNpb247XHJcbiAgaWYgKGN1cnJlbnRTTUFQSVZlcnNpb24gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gU01BUEkgaXNuJ3QgaW5zdGFsbGVkIG9yIGVuYWJsZWQuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpc1NtYXBpT3V0ZGF0ZWQgPSBhc3luYyAoKSA9PiB7XHJcbiAgICBjdXJyZW50U01BUElWZXJzaW9uID0gZmluZFNNQVBJTW9kKGFwaSk/LmF0dHJpYnV0ZXM/LnZlcnNpb247XHJcbiAgICBjb25zdCBlbmFibGVkTWFuaWZlc3RzID0gYXdhaXQgZGVwTWFuYWdlci5nZXRNYW5pZmVzdHMoKTtcclxuICAgIGNvbnN0IGluY29tcGF0aWJsZU1vZElkczogc3RyaW5nW10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgW2lkLCBtYW5pZmVzdHNdIG9mIE9iamVjdC5lbnRyaWVzKGVuYWJsZWRNYW5pZmVzdHMpKSB7XHJcbiAgICAgIGNvbnN0IGluY29tcGF0aWJsZSA9IG1hbmlmZXN0cy5maWx0ZXIoKGl0ZXIpID0+IHtcclxuICAgICAgICBpZiAoaXRlci5NaW5pbXVtQXBpVmVyc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICByZXR1cm4gIWd0ZShjdXJyZW50U01BUElWZXJzaW9uLCBjb2VyY2UoaXRlci5NaW5pbXVtQXBpVmVyc2lvbiA/PyAnMC4wLjAnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChpbmNvbXBhdGlibGUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGluY29tcGF0aWJsZU1vZElkcy5wdXNoKGlkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgoaW5jb21wYXRpYmxlTW9kSWRzLmxlbmd0aCA+IDApKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG91dGRhdGVkID0gYXdhaXQgaXNTbWFwaU91dGRhdGVkKCk7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIG91dGRhdGVkXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgICAgc2hvcnQ6IHQoJ1NNQVBJIHVwZGF0ZSByZXF1aXJlZCcpLFxyXG4gICAgICAgIGxvbmc6IHQoJ1NvbWUgU3RhcmRldyBWYWxsZXkgbW9kcyByZXF1aXJlIGEgbmV3ZXIgdmVyc2lvbiBvZiBTTUFQSSB0byBmdW5jdGlvbiBjb3JyZWN0bHksICdcclxuICAgICAgICAgICAgICArICd5b3Ugc2hvdWxkIGNoZWNrIGZvciBTTUFQSSB1cGRhdGVzIGluIHRoZSBtb2RzIHBhZ2UuJyksXHJcbiAgICAgIH0sXHJcbiAgICAgIGF1dG9tYXRpY0ZpeDogKCkgPT4gZG93bmxvYWRTTUFQSShhcGksIHRydWUpLFxyXG4gICAgICBvblJlY2hlY2s6ICgpID0+IGlzU21hcGlPdXRkYXRlZCgpLFxyXG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnIGFzIHR5cGVzLlByb2JsZW1TZXZlcml0eSxcclxuICAgIH0pXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG59Il19