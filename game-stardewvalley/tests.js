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
exports.testSMAPIOutdated = exports.testMissingDependencies = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const semver_1 = require("semver");
const SMAPI_1 = require("./SMAPI");
function testMissingDependencies(api, depManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = api.translate;
        const state = api.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        if (gameMode !== common_1.GAME_ID) {
            return undefined;
        }
        yield depManager.scanManifests(true);
        let missingDependencies = [];
        try {
            missingDependencies = depManager.findMissingDependencies();
            if (missingDependencies.length === 0) {
                return Promise.resolve(undefined);
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'Error while checking for missing dependencies', err);
            return Promise.resolve(undefined);
        }
        return Promise.resolve({
            description: {
                short: 'Some Stardew Valley mods are missing dependencies',
                long: t('Some of your Stardew Valley mods have unfulfilled dependencies - this '
                    + 'may cause odd in-game behaviour, or may cause the game to fail to start.\n\n'
                    + 'You are missing the following dependencies:[br][/br][br][/br]{{deps}}', {
                    replace: {
                        deps: missingDependencies.map(dep => dep.UniqueID).join('[br][/br]'),
                    },
                }),
            },
            severity: 'warning',
        });
    });
}
exports.testMissingDependencies = testMissingDependencies;
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
        let outdated = yield isSmapiOutdated();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBbUQ7QUFFbkQscUNBQW1DO0FBSW5DLG1DQUFxQztBQUVyQyxtQ0FBc0Q7QUFFdEQsU0FBc0IsdUJBQXVCLENBQUMsR0FBd0IsRUFDeEIsVUFBNkI7O1FBRXpFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sUUFBUSxHQUFHLHNCQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLElBQUksUUFBUSxLQUFLLGdCQUFPLEVBQUU7WUFDeEIsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxNQUFNLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxtQkFBbUIsR0FBcUIsRUFBRSxDQUFDO1FBQy9DLElBQUk7WUFDRixtQkFBbUIsR0FBRyxVQUFVLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUMzRCxJQUFJLG1CQUFtQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3BDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNuQztTQUNGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLCtDQUErQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNyQixXQUFXLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLG1EQUFtRDtnQkFDMUQsSUFBSSxFQUFFLENBQUMsQ0FBQyx3RUFBd0U7c0JBQ3hFLDhFQUE4RTtzQkFDOUUsdUVBQXVFLEVBQUU7b0JBQy9FLE9BQU8sRUFBRTt3QkFDUCxJQUFJLEVBQUUsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7cUJBQ3JFO2lCQUNGLENBQUM7YUFDSDtZQUNELFFBQVEsRUFBRSxTQUFrQztTQUM3QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFuQ0QsMERBbUNDO0FBRUQsU0FBc0IsaUJBQWlCLENBQUMsR0FBd0IsRUFDckIsVUFBNkI7OztRQUV0RSxJQUFJLG1CQUFtQixHQUFHLE1BQUEsTUFBQSxJQUFBLG9CQUFZLEVBQUMsR0FBRyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsT0FBTyxDQUFDO1FBQ2pFLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO1lBRXJDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sZUFBZSxHQUFHLEdBQVMsRUFBRTs7WUFDakMsbUJBQW1CLEdBQUcsTUFBQSxNQUFBLElBQUEsb0JBQVksRUFBQyxHQUFHLENBQUMsMENBQUUsVUFBVSwwQ0FBRSxPQUFPLENBQUM7WUFDN0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN6RCxNQUFNLGtCQUFrQixHQUFhLEVBQUUsQ0FBQztZQUN4QyxLQUFLLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUM5RCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7O29CQUM3QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTLEVBQUU7d0JBQ3hDLE9BQU8sQ0FBQyxJQUFBLFlBQUcsRUFBQyxtQkFBbUIsRUFBRSxJQUFBLGVBQU0sRUFBQyxNQUFBLElBQUksQ0FBQyxpQkFBaUIsbUNBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztxQkFDN0U7b0JBQ0QsT0FBTyxLQUFLLENBQUM7Z0JBQ2YsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDM0Isa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM3QjthQUNGO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFBLENBQUE7UUFHRCxJQUFJLFFBQVEsR0FBRyxNQUFNLGVBQWUsRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsT0FBTyxRQUFRO1lBQ2IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7Z0JBQ2hCLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDO29CQUNqQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLG1GQUFtRjswQkFDbkYsc0RBQXNELENBQUM7aUJBQ2hFO2dCQUNELFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHFCQUFhLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztnQkFDNUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWUsRUFBRTtnQkFDbEMsUUFBUSxFQUFFLFNBQWtDO2FBQzdDLENBQUM7WUFDRixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7Q0FDaEM7QUExQ0QsOENBMENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbG9nLCB0eXBlcywgc2VsZWN0b3JzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgRGVwZW5kZW5jeU1hbmFnZXIgZnJvbSAnLi9kZXBlbmRlbmN5TWFuYWdlcic7XHJcbmltcG9ydCB7IElTRFZEZXBlbmRlbmN5IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBjb2VyY2UsIGd0ZSB9IGZyb20gJ3NlbXZlcic7XHJcblxyXG5pbXBvcnQgeyBkb3dubG9hZFNNQVBJLCBmaW5kU01BUElNb2QgfSBmcm9tICcuL1NNQVBJJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0TWlzc2luZ0RlcGVuZGVuY2llcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBkZXBNYW5hZ2VyLnNjYW5NYW5pZmVzdHModHJ1ZSk7XHJcbiAgbGV0IG1pc3NpbmdEZXBlbmRlbmNpZXM6IElTRFZEZXBlbmRlbmN5W10gPSBbXTtcclxuICB0cnkge1xyXG4gICAgbWlzc2luZ0RlcGVuZGVuY2llcyA9IGRlcE1hbmFnZXIuZmluZE1pc3NpbmdEZXBlbmRlbmNpZXMoKTtcclxuICAgIGlmIChtaXNzaW5nRGVwZW5kZW5jaWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ0Vycm9yIHdoaWxlIGNoZWNraW5nIGZvciBtaXNzaW5nIGRlcGVuZGVuY2llcycsIGVycik7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgIHNob3J0OiAnU29tZSBTdGFyZGV3IFZhbGxleSBtb2RzIGFyZSBtaXNzaW5nIGRlcGVuZGVuY2llcycsXHJcbiAgICAgIGxvbmc6IHQoJ1NvbWUgb2YgeW91ciBTdGFyZGV3IFZhbGxleSBtb2RzIGhhdmUgdW5mdWxmaWxsZWQgZGVwZW5kZW5jaWVzIC0gdGhpcyAnXHJcbiAgICAgICAgICAgICsgJ21heSBjYXVzZSBvZGQgaW4tZ2FtZSBiZWhhdmlvdXIsIG9yIG1heSBjYXVzZSB0aGUgZ2FtZSB0byBmYWlsIHRvIHN0YXJ0LlxcblxcbidcclxuICAgICAgICAgICAgKyAnWW91IGFyZSBtaXNzaW5nIHRoZSBmb2xsb3dpbmcgZGVwZW5kZW5jaWVzOlticl1bL2JyXVticl1bL2JyXXt7ZGVwc319Jywge1xyXG4gICAgICAgIHJlcGxhY2U6IHtcclxuICAgICAgICAgIGRlcHM6IG1pc3NpbmdEZXBlbmRlbmNpZXMubWFwKGRlcCA9PiBkZXAuVW5pcXVlSUQpLmpvaW4oJ1ticl1bL2JyXScpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgfSxcclxuICAgIHNldmVyaXR5OiAnd2FybmluZycgYXMgdHlwZXMuUHJvYmxlbVNldmVyaXR5LFxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdFNNQVBJT3V0ZGF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwTWFuYWdlcjogRGVwZW5kZW5jeU1hbmFnZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dHlwZXMuSVRlc3RSZXN1bHQ+IHtcclxuICBsZXQgY3VycmVudFNNQVBJVmVyc2lvbiA9IGZpbmRTTUFQSU1vZChhcGkpPy5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xyXG4gIGlmIChjdXJyZW50U01BUElWZXJzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFNNQVBJIGlzbid0IGluc3RhbGxlZCBvciBlbmFibGVkLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaXNTbWFwaU91dGRhdGVkID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgY3VycmVudFNNQVBJVmVyc2lvbiA9IGZpbmRTTUFQSU1vZChhcGkpPy5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xyXG4gICAgY29uc3QgZW5hYmxlZE1hbmlmZXN0cyA9IGF3YWl0IGRlcE1hbmFnZXIuZ2V0TWFuaWZlc3RzKCk7XHJcbiAgICBjb25zdCBpbmNvbXBhdGlibGVNb2RJZHM6IHN0cmluZ1tdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IFtpZCwgbWFuaWZlc3RzXSBvZiBPYmplY3QuZW50cmllcyhlbmFibGVkTWFuaWZlc3RzKSkge1xyXG4gICAgICBjb25zdCBpbmNvbXBhdGlibGUgPSBtYW5pZmVzdHMuZmlsdGVyKChpdGVyKSA9PiB7XHJcbiAgICAgICAgaWYgKGl0ZXIuTWluaW11bUFwaVZlcnNpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmV0dXJuICFndGUoY3VycmVudFNNQVBJVmVyc2lvbiwgY29lcmNlKGl0ZXIuTWluaW11bUFwaVZlcnNpb24gPz8gJzAuMC4wJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoaW5jb21wYXRpYmxlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBpbmNvbXBhdGlibGVNb2RJZHMucHVzaChpZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKGluY29tcGF0aWJsZU1vZElkcy5sZW5ndGggPiAwKSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgbGV0IG91dGRhdGVkID0gYXdhaXQgaXNTbWFwaU91dGRhdGVkKCk7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIG91dGRhdGVkXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgICAgc2hvcnQ6IHQoJ1NNQVBJIHVwZGF0ZSByZXF1aXJlZCcpLFxyXG4gICAgICAgIGxvbmc6IHQoJ1NvbWUgU3RhcmRldyBWYWxsZXkgbW9kcyByZXF1aXJlIGEgbmV3ZXIgdmVyc2lvbiBvZiBTTUFQSSB0byBmdW5jdGlvbiBjb3JyZWN0bHksICdcclxuICAgICAgICAgICAgICArICd5b3Ugc2hvdWxkIGNoZWNrIGZvciBTTUFQSSB1cGRhdGVzIGluIHRoZSBtb2RzIHBhZ2UuJyksXHJcbiAgICAgIH0sXHJcbiAgICAgIGF1dG9tYXRpY0ZpeDogKCkgPT4gZG93bmxvYWRTTUFQSShhcGksIHRydWUpLFxyXG4gICAgICBvblJlY2hlY2s6ICgpID0+IGlzU21hcGlPdXRkYXRlZCgpLFxyXG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnIGFzIHR5cGVzLlByb2JsZW1TZXZlcml0eSxcclxuICAgIH0pXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG59Il19