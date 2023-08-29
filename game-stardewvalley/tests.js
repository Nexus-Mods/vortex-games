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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFJQSxtQ0FBcUM7QUFFckMsbUNBQXNEO0FBRXRELFNBQXNCLGlCQUFpQixDQUFDLEdBQXdCLEVBQ3hCLFVBQTZCOzs7UUFFbkUsSUFBSSxtQkFBbUIsR0FBRyxNQUFBLE1BQUEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLE9BQU8sQ0FBQztRQUNqRSxJQUFJLG1CQUFtQixLQUFLLFNBQVMsRUFBRTtZQUVyQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLGVBQWUsR0FBRyxHQUFTLEVBQUU7O1lBQ2pDLG1CQUFtQixHQUFHLE1BQUEsTUFBQSxJQUFBLG9CQUFZLEVBQUMsR0FBRyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsT0FBTyxDQUFDO1lBQzdELE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDekQsTUFBTSxrQkFBa0IsR0FBYSxFQUFFLENBQUM7WUFDeEMsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDOUQsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztvQkFDN0MsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFO3dCQUN4QyxPQUFPLENBQUMsSUFBQSxZQUFHLEVBQUMsbUJBQW1CLEVBQUUsSUFBQSxlQUFNLEVBQUMsTUFBQSxJQUFJLENBQUMsaUJBQWlCLG1DQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUM7cUJBQzdFO29CQUNELE9BQU8sS0FBSyxDQUFDO2dCQUNmLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQzNCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQSxDQUFBO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLEVBQUUsQ0FBQztRQUN6QyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ3hCLE9BQU8sUUFBUTtZQUNiLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNoQixXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDakMsSUFBSSxFQUFFLENBQUMsQ0FBQyxtRkFBbUY7MEJBQ25GLHNEQUFzRCxDQUFDO2lCQUNoRTtnQkFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSxxQkFBYSxFQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7Z0JBQzVDLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlLEVBQUU7Z0JBQ2xDLFFBQVEsRUFBRSxTQUFrQzthQUM3QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O0NBQ2hDO0FBekNELDhDQXlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcblxuaW1wb3J0IHsgY29lcmNlLCBndGUgfSBmcm9tICdzZW12ZXInO1xuXG5pbXBvcnQgeyBkb3dubG9hZFNNQVBJLCBmaW5kU01BUElNb2QgfSBmcm9tICcuL1NNQVBJJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RTTUFQSU91dGRhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dHlwZXMuSVRlc3RSZXN1bHQ+IHtcbiAgbGV0IGN1cnJlbnRTTUFQSVZlcnNpb24gPSBmaW5kU01BUElNb2QoYXBpKT8uYXR0cmlidXRlcz8udmVyc2lvbjtcbiAgaWYgKGN1cnJlbnRTTUFQSVZlcnNpb24gPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFNNQVBJIGlzbid0IGluc3RhbGxlZCBvciBlbmFibGVkLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IGlzU21hcGlPdXRkYXRlZCA9IGFzeW5jICgpID0+IHtcbiAgICBjdXJyZW50U01BUElWZXJzaW9uID0gZmluZFNNQVBJTW9kKGFwaSk/LmF0dHJpYnV0ZXM/LnZlcnNpb247XG4gICAgY29uc3QgZW5hYmxlZE1hbmlmZXN0cyA9IGF3YWl0IGRlcE1hbmFnZXIuZ2V0TWFuaWZlc3RzKCk7XG4gICAgY29uc3QgaW5jb21wYXRpYmxlTW9kSWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2lkLCBtYW5pZmVzdHNdIG9mIE9iamVjdC5lbnRyaWVzKGVuYWJsZWRNYW5pZmVzdHMpKSB7XG4gICAgICBjb25zdCBpbmNvbXBhdGlibGUgPSBtYW5pZmVzdHMuZmlsdGVyKChpdGVyKSA9PiB7XG4gICAgICAgIGlmIChpdGVyLk1pbmltdW1BcGlWZXJzaW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gIWd0ZShjdXJyZW50U01BUElWZXJzaW9uLCBjb2VyY2UoaXRlci5NaW5pbXVtQXBpVmVyc2lvbiA/PyAnMC4wLjAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgICBpZiAoaW5jb21wYXRpYmxlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW5jb21wYXRpYmxlTW9kSWRzLnB1c2goaWQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKChpbmNvbXBhdGlibGVNb2RJZHMubGVuZ3RoID4gMCkpO1xuICB9XG5cbiAgY29uc3Qgb3V0ZGF0ZWQgPSBhd2FpdCBpc1NtYXBpT3V0ZGF0ZWQoKTtcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XG4gIHJldHVybiBvdXRkYXRlZFxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIGRlc2NyaXB0aW9uOiB7XG4gICAgICAgIHNob3J0OiB0KCdTTUFQSSB1cGRhdGUgcmVxdWlyZWQnKSxcbiAgICAgICAgbG9uZzogdCgnU29tZSBTdGFyZGV3IFZhbGxleSBtb2RzIHJlcXVpcmUgYSBuZXdlciB2ZXJzaW9uIG9mIFNNQVBJIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSwgJ1xuICAgICAgICAgICAgICArICd5b3Ugc2hvdWxkIGNoZWNrIGZvciBTTUFQSSB1cGRhdGVzIGluIHRoZSBtb2RzIHBhZ2UuJyksXG4gICAgICB9LFxuICAgICAgYXV0b21hdGljRml4OiAoKSA9PiBkb3dubG9hZFNNQVBJKGFwaSwgdHJ1ZSksXG4gICAgICBvblJlY2hlY2s6ICgpID0+IGlzU21hcGlPdXRkYXRlZCgpLFxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyBhcyB0eXBlcy5Qcm9ibGVtU2V2ZXJpdHksXG4gICAgfSlcbiAgICA6IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xufSJdfQ==