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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNamesOfMergedMods = exports.getMergedModNames = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const vortex_api_1 = require("vortex-api");
function getMergeInventory(api) {
    const state = api.getState();
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    const scriptMerger = vortex_api_1.util.getSafe(discovery, ['tools', common_1.SCRIPT_MERGER_ID], undefined);
    if ((scriptMerger === undefined) || (scriptMerger.path === undefined)) {
        return bluebird_1.default.resolve([]);
    }
    return vortex_api_1.fs.readFileAsync(path_1.default.join(path_1.default.dirname(scriptMerger.path), common_1.MERGE_INV_MANIFEST))
        .then((xmlData) => __awaiter(this, void 0, void 0, function* () {
        try {
            const mergeData = yield (0, xml2js_1.parseStringPromise)(xmlData);
            return Promise.resolve(mergeData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }))
        .catch(err => (err.code === 'ENOENT')
        ? Promise.resolve(undefined)
        : Promise.reject(new vortex_api_1.util.DataInvalid(`Failed to parse ${common_1.MERGE_INV_MANIFEST}: ${err}`)));
}
function getMergedModNames(api) {
    return getMergeInventory(api)
        .then((mergeInventory) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (mergeInventory === undefined) {
            return Promise.resolve([]);
        }
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const modsPath = path_1.default.join(discovery.path, 'Mods');
        const mergeEntry = (_a = mergeInventory === null || mergeInventory === void 0 ? void 0 : mergeInventory.MergeInventory) === null || _a === void 0 ? void 0 : _a.Merge;
        if (mergeEntry === undefined) {
            let inv;
            try {
                inv = JSON.stringify(mergeInventory);
            }
            catch (err) {
                return Promise.reject(err);
            }
            (0, vortex_api_1.log)('debug', 'failed to retrieve merged mod names', inv);
            return Promise.resolve([]);
        }
        const elements = yield mergeEntry.reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const accum = yield accumP;
            const mergeModName = (_b = iter === null || iter === void 0 ? void 0 : iter.MergedModName) === null || _b === void 0 ? void 0 : _b[0];
            if (mergeModName === undefined) {
                return accum;
            }
            if (!accum.includes(mergeModName)) {
                try {
                    yield vortex_api_1.fs.statAsync(path_1.default.join(modsPath, mergeModName));
                    accum.push(mergeModName);
                }
                catch (err) {
                    (0, vortex_api_1.log)('debug', 'merged mod is missing', mergeModName);
                }
            }
            return accum;
        }), []);
        return Promise.resolve(elements);
    }))
        .catch(err => {
        api.showErrorNotification('Invalid MergeInventory.xml file', err, { allowReport: false });
        return Promise.resolve([]);
    });
}
exports.getMergedModNames = getMergedModNames;
function getNamesOfMergedMods(api) {
    return getMergeInventory(api)
        .then((mergeInventory) => __awaiter(this, void 0, void 0, function* () {
        if (mergeInventory === undefined) {
            return Promise.resolve([]);
        }
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const modsPath = path_1.default.join(discovery.path, 'Mods');
        const modNames = yield mergeInventory.MergeInventory.Merge.reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            const mergedMods = iter === null || iter === void 0 ? void 0 : iter.IncludedMod;
            for (const modName of mergedMods) {
                if (modName === undefined) {
                    return accum;
                }
                if (!accum.includes(modName === null || modName === void 0 ? void 0 : modName._)) {
                    try {
                        yield vortex_api_1.fs.statAsync(path_1.default.join(modsPath, modName === null || modName === void 0 ? void 0 : modName._));
                        accum.push(modName === null || modName === void 0 ? void 0 : modName._);
                    }
                    catch (err) {
                        (0, vortex_api_1.log)('debug', 'merged mod is missing', modName === null || modName === void 0 ? void 0 : modName._);
                    }
                }
            }
            return accum;
        }), []);
        return Promise.resolve(modNames);
    }));
}
exports.getNamesOfMergedMods = getNamesOfMergedMods;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsbUNBQTRDO0FBRTVDLHFDQUF5RTtBQUV6RSwyQ0FBa0Q7QUFFbEQsU0FBUyxpQkFBaUIsQ0FBQyxHQUF3QjtJQUdqRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2xHLE1BQU0sWUFBWSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3JGLElBQUksQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxFQUFFO1FBQ3JFLE9BQU8sa0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDN0I7SUFFRCxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSwyQkFBa0IsQ0FBQyxDQUFDO1NBQ3BGLElBQUksQ0FBQyxDQUFNLE9BQU8sRUFBQyxFQUFFO1FBQ3BCLElBQUk7WUFDRixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDLENBQUEsQ0FBQztTQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7UUFDbkMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLDJCQUFrQixLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9GLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxHQUF3QjtJQUd4RCxPQUFPLGlCQUFpQixDQUFDLEdBQUcsQ0FBQztTQUMxQixJQUFJLENBQUMsQ0FBTSxjQUFjLEVBQUMsRUFBRTs7UUFDM0IsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUM1QjtRQUNELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuRCxNQUFNLFVBQVUsR0FBRyxNQUFBLGNBQWMsYUFBZCxjQUFjLHVCQUFkLGNBQWMsQ0FBRSxjQUFjLDBDQUFFLEtBQUssQ0FBQztRQUN6RCxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUIsSUFBSSxHQUFHLENBQUM7WUFDUixJQUFJO2dCQUNGLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ3RDO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzVCO1lBQ0QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxxQ0FBcUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFDRCxNQUFNLFFBQVEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBTyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7O1lBQzlELE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDO1lBQzNCLE1BQU0sWUFBWSxHQUFHLE1BQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLGFBQWEsMENBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUMsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO2dCQUM5QixPQUFPLEtBQUssQ0FBQzthQUNkO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ2pDLElBQUk7b0JBQ0YsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7b0JBQ3RELEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7aUJBQzFCO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNaLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsWUFBWSxDQUFDLENBQUM7aUJBQ3JEO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQSxDQUFDO1NBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBS1gsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFDOUQsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0IsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBbERELDhDQWtEQztBQUVELFNBQWdCLG9CQUFvQixDQUFDLEdBQXdCO0lBRTNELE9BQU8saUJBQWlCLENBQUMsR0FBRyxDQUFDO1NBQzFCLElBQUksQ0FBQyxDQUFNLGNBQWMsRUFBQyxFQUFFO1FBQzNCLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFDRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNsQyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM5RCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBTyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDdkYsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUM7WUFDM0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFdBQVcsQ0FBQztZQUNyQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFVBQVUsRUFBRTtnQkFDaEMsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO29CQUN6QixPQUFPLEtBQUssQ0FBQztpQkFDZDtnQkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQy9CLElBQUk7d0JBQ0YsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQztxQkFDeEI7b0JBQUMsT0FBTyxHQUFHLEVBQUU7d0JBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ25EO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDUCxDQUFDO0FBL0JELG9EQStCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU0NSSVBUX01FUkdFUl9JRCwgTUVSR0VfSU5WX01BTklGRVNUIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmZ1bmN0aW9uIGdldE1lcmdlSW52ZW50b3J5KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIC8vIFByb3ZpZGVkIHdpdGggYSBwYXR0ZXJuLCBhdHRlbXB0cyB0byByZXRyaWV2ZSBlbGVtZW50IHZhbHVlc1xyXG4gIC8vICBmcm9tIGFueSBlbGVtZW50IGtleXMgdGhhdCBtYXRjaCB0aGUgcGF0dGVybiBpbnNpZGUgdGhlIG1lcmdlIGludmVudG9yeSBmaWxlLlxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoZGlzY292ZXJ5LCBbJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKChzY3JpcHRNZXJnZXIgPT09IHVuZGVmaW5lZCkgfHwgKHNjcmlwdE1lcmdlci5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHNjcmlwdE1lcmdlci5wYXRoKSwgTUVSR0VfSU5WX01BTklGRVNUKSlcclxuICAgIC50aGVuKGFzeW5jIHhtbERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG1lcmdlRGF0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlRGF0YSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSAvLyBObyBtZXJnZSBmaWxlPyAtIG5vIHByb2JsZW0uXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChgRmFpbGVkIHRvIHBhcnNlICR7TUVSR0VfSU5WX01BTklGRVNUfTogJHtlcnJ9YCkpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1lcmdlZE1vZE5hbWVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIC8vIFRoaXMgcmV0cmlldmVzIHRoZSBuYW1lIG9mIHRoZSByZXN1bHRpbmcgbWVyZ2VkIG1vZCBpdHNlbGYuXHJcbiAgLy8gIEFLQSBcIm1vZDAwMDBfTWVyZ2VkRmlsZXNcIlxyXG4gIHJldHVybiBnZXRNZXJnZUludmVudG9yeShhcGkpXHJcbiAgICAudGhlbihhc3luYyBtZXJnZUludmVudG9yeSA9PiB7XHJcbiAgICAgIGlmIChtZXJnZUludmVudG9yeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgICAgY29uc3QgbWVyZ2VFbnRyeSA9IG1lcmdlSW52ZW50b3J5Py5NZXJnZUludmVudG9yeT8uTWVyZ2U7XHJcbiAgICAgIGlmIChtZXJnZUVudHJ5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBsZXQgaW52O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpbnYgPSBKU09OLnN0cmluZ2lmeShtZXJnZUludmVudG9yeSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gcmV0cmlldmUgbWVyZ2VkIG1vZCBuYW1lcycsIGludik7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCBtZXJnZUVudHJ5LnJlZHVjZShhc3luYyAoYWNjdW1QLCBpdGVyKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VNb2ROYW1lID0gaXRlcj8uTWVyZ2VkTW9kTmFtZT8uWzBdO1xyXG4gICAgICAgIGlmIChtZXJnZU1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWFjY3VtLmluY2x1ZGVzKG1lcmdlTW9kTmFtZSkpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kc1BhdGgsIG1lcmdlTW9kTmFtZSkpO1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKG1lcmdlTW9kTmFtZSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nKCdkZWJ1ZycsICdtZXJnZWQgbW9kIGlzIG1pc3NpbmcnLCBtZXJnZU1vZE5hbWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIFtdKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShlbGVtZW50cyk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBwYXJzZSB0aGUgbWVyZ2UgaW52ZW50b3J5IGZvciB3aGF0ZXZlciByZWFzb24uXHJcbiAgICAgIC8vICBSYXRoZXIgdGhhbiBibG9ja2luZyB0aGUgdXNlciBmcm9tIG1vZGRpbmcgaGlzIGdhbWUgd2UncmVcclxuICAgICAgLy8gIHdlIHNpbXBseSByZXR1cm4gYW4gZW1wdHkgYXJyYXk7IGJ1dCBiZWZvcmUgd2UgZG8gdGhhdCxcclxuICAgICAgLy8gIHdlIG5lZWQgdG8gdGVsbCBoaW0gd2Ugd2VyZSB1bmFibGUgdG8gcGFyc2UgdGhlIG1lcmdlZCBpbnZlbnRvcnkuXHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTWVyZ2VJbnZlbnRvcnkueG1sIGZpbGUnLCBlcnIsXHJcbiAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc09mTWVyZ2VkTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBCbHVlYmlyZDxzdHJpbmdbXT4ge1xyXG4gIC8vIFRoaXMgcmV0cmlldmVzIGEgdW5pcXVlIGxpc3Qgb2YgbW9kIG5hbWVzIGluY2x1ZGVkIGluIHRoZSBtZXJnZWQgbW9kXHJcbiAgcmV0dXJuIGdldE1lcmdlSW52ZW50b3J5KGFwaSlcclxuICAgIC50aGVuKGFzeW5jIG1lcmdlSW52ZW50b3J5ID0+IHtcclxuICAgICAgaWYgKG1lcmdlSW52ZW50b3J5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xyXG4gICAgICBjb25zdCBtb2ROYW1lcyA9IGF3YWl0IG1lcmdlSW52ZW50b3J5Lk1lcmdlSW52ZW50b3J5Lk1lcmdlLnJlZHVjZShhc3luYyAoYWNjdW1QLCBpdGVyKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VkTW9kcyA9IGl0ZXI/LkluY2x1ZGVkTW9kO1xyXG4gICAgICAgIGZvciAoY29uc3QgbW9kTmFtZSBvZiBtZXJnZWRNb2RzKSB7XHJcbiAgICAgICAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobW9kTmFtZT8uXykpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZHNQYXRoLCBtb2ROYW1lPy5fKSk7XHJcbiAgICAgICAgICAgICAgYWNjdW0ucHVzaChtb2ROYW1lPy5fKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgbG9nKCdkZWJ1ZycsICdtZXJnZWQgbW9kIGlzIG1pc3NpbmcnLCBtb2ROYW1lPy5fKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIFtdKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lcyk7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=