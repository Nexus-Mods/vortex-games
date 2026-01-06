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
exports.testSMAPIOutdated = testSMAPIOutdated;
const vortex_api_1 = require("vortex-api");
const semver_1 = require("semver");
const SMAPI_1 = require("./SMAPI");
const common_1 = require("./common");
function testSMAPIOutdated(api, depManager) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
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
            var _a, _b;
            currentSMAPIVersion = (_b = (_a = (0, SMAPI_1.findSMAPIMod)(api)) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.version;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLDhDQStDQztBQXpERCwyQ0FBOEM7QUFJOUMsbUNBQXFDO0FBRXJDLG1DQUFzRDtBQUV0RCxxQ0FBbUM7QUFFbkMsU0FBc0IsaUJBQWlCLENBQUMsR0FBd0IsRUFDeEIsVUFBNkI7OztRQUVuRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxZQUFZLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkQsSUFBSSxZQUFZLEtBQUssZ0JBQU8sRUFBRSxDQUFDO1lBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxtQkFBbUIsR0FBRyxNQUFBLE1BQUEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLE9BQU8sQ0FBQztRQUNqRSxJQUFJLG1CQUFtQixLQUFLLFNBQVMsRUFBRSxDQUFDO1lBRXRDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsTUFBTSxlQUFlLEdBQUcsR0FBUyxFQUFFOztZQUNqQyxtQkFBbUIsR0FBRyxNQUFBLE1BQUEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLE9BQU8sQ0FBQztZQUM3RCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3pELE1BQU0sa0JBQWtCLEdBQWEsRUFBRSxDQUFDO1lBQ3hDLEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztvQkFDN0MsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ3pDLE9BQU8sQ0FBQyxJQUFBLFlBQUcsRUFBQyxtQkFBbUIsRUFBRSxJQUFBLGVBQU0sRUFBQyxNQUFBLElBQUksQ0FBQyxpQkFBaUIsbUNBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDOUUsQ0FBQztvQkFDRCxPQUFPLEtBQUssQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzVCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNILENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUEsQ0FBQTtRQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBZSxFQUFFLENBQUM7UUFDekMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixPQUFPLFFBQVE7WUFDYixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDaEIsV0FBVyxFQUFFO29CQUNYLEtBQUssRUFBRSxDQUFDLENBQUMsdUJBQXVCLENBQUM7b0JBQ2pDLElBQUksRUFBRSxDQUFDLENBQUMsbUZBQW1GOzBCQUNuRixzREFBc0QsQ0FBQztpQkFDaEU7Z0JBQ0QsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEscUJBQWEsRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO2dCQUM1QyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFFO2dCQUNsQyxRQUFRLEVBQUUsU0FBa0M7YUFDN0MsQ0FBUTtZQUNULENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzLCBzZWxlY3RvcnMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IGNvZXJjZSwgZ3RlIH0gZnJvbSAnc2VtdmVyJztcclxuXHJcbmltcG9ydCB7IGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9IGZyb20gJy4vU01BUEknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0U01BUElPdXRkYXRlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgaWYgKGFjdGl2ZUdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgbGV0IGN1cnJlbnRTTUFQSVZlcnNpb24gPSBmaW5kU01BUElNb2QoYXBpKT8uYXR0cmlidXRlcz8udmVyc2lvbjtcclxuICBpZiAoY3VycmVudFNNQVBJVmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBTTUFQSSBpc24ndCBpbnN0YWxsZWQgb3IgZW5hYmxlZC5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGlzU21hcGlPdXRkYXRlZCA9IGFzeW5jICgpID0+IHtcclxuICAgIGN1cnJlbnRTTUFQSVZlcnNpb24gPSBmaW5kU01BUElNb2QoYXBpKT8uYXR0cmlidXRlcz8udmVyc2lvbjtcclxuICAgIGNvbnN0IGVuYWJsZWRNYW5pZmVzdHMgPSBhd2FpdCBkZXBNYW5hZ2VyLmdldE1hbmlmZXN0cygpO1xyXG4gICAgY29uc3QgaW5jb21wYXRpYmxlTW9kSWRzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBbaWQsIG1hbmlmZXN0c10gb2YgT2JqZWN0LmVudHJpZXMoZW5hYmxlZE1hbmlmZXN0cykpIHtcclxuICAgICAgY29uc3QgaW5jb21wYXRpYmxlID0gbWFuaWZlc3RzLmZpbHRlcigoaXRlcikgPT4ge1xyXG4gICAgICAgIGlmIChpdGVyLk1pbmltdW1BcGlWZXJzaW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiAhZ3RlKGN1cnJlbnRTTUFQSVZlcnNpb24sIGNvZXJjZShpdGVyLk1pbmltdW1BcGlWZXJzaW9uID8/ICcwLjAuMCcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKGluY29tcGF0aWJsZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgaW5jb21wYXRpYmxlTW9kSWRzLnB1c2goaWQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKChpbmNvbXBhdGlibGVNb2RJZHMubGVuZ3RoID4gMCkpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgb3V0ZGF0ZWQgPSBhd2FpdCBpc1NtYXBpT3V0ZGF0ZWQoKTtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICByZXR1cm4gb3V0ZGF0ZWRcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgZGVzY3JpcHRpb246IHtcclxuICAgICAgICBzaG9ydDogdCgnU01BUEkgdXBkYXRlIHJlcXVpcmVkJyksXHJcbiAgICAgICAgbG9uZzogdCgnU29tZSBTdGFyZGV3IFZhbGxleSBtb2RzIHJlcXVpcmUgYSBuZXdlciB2ZXJzaW9uIG9mIFNNQVBJIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSwgJ1xyXG4gICAgICAgICAgICAgICsgJ3lvdSBzaG91bGQgY2hlY2sgZm9yIFNNQVBJIHVwZGF0ZXMgaW4gdGhlIG1vZHMgcGFnZS4nKSxcclxuICAgICAgfSxcclxuICAgICAgYXV0b21hdGljRml4OiAoKSA9PiBkb3dubG9hZFNNQVBJKGFwaSwgdHJ1ZSksXHJcbiAgICAgIG9uUmVjaGVjazogKCkgPT4gaXNTbWFwaU91dGRhdGVkKCksXHJcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycgYXMgdHlwZXMuUHJvYmxlbVNldmVyaXR5LFxyXG4gICAgfSkgYXMgYW55XHJcbiAgICA6IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG59Il19