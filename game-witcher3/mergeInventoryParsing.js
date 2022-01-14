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
function getMergeInventory(context) {
    const state = context.api.store.getState();
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
function getMergedModNames(context) {
    return getMergeInventory(context)
        .then((mergeInventory) => __awaiter(this, void 0, void 0, function* () {
        if (mergeInventory === undefined) {
            return Promise.resolve([]);
        }
        const state = context.api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const modsPath = path_1.default.join(discovery.path, 'Mods');
        const elements = yield mergeInventory.MergeInventory.Merge.reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const accum = yield accumP;
            const mergeModName = (_a = iter === null || iter === void 0 ? void 0 : iter.MergedModName) === null || _a === void 0 ? void 0 : _a[0];
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
        context.api.showErrorNotification('Invalid MergeInventory.xml file', err, { allowReport: false });
        return Promise.resolve([]);
    });
}
exports.getMergedModNames = getMergedModNames;
function getNamesOfMergedMods(context) {
    return getMergeInventory(context)
        .then((mergeInventory) => __awaiter(this, void 0, void 0, function* () {
        if (mergeInventory === undefined) {
            return Promise.resolve([]);
        }
        const state = context.api.getState();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsbUNBQTRDO0FBRTVDLHFDQUF5RTtBQUV6RSwyQ0FBa0Q7QUFFbEQsU0FBUyxpQkFBaUIsQ0FBQyxPQUFnQztJQUd6RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbEcsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckYsSUFBSSxDQUFDLFlBQVksS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEVBQUU7UUFDckUsT0FBTyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM3QjtJQUVELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLDJCQUFrQixDQUFDLENBQUM7U0FDcEYsSUFBSSxDQUFDLENBQU0sT0FBTyxFQUFDLEVBQUU7UUFDcEIsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUMsQ0FBQSxDQUFDO1NBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztRQUNuQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDNUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsMkJBQWtCLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0YsQ0FBQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWdDO0lBR2hFLE9BQU8saUJBQWlCLENBQUMsT0FBTyxDQUFDO1NBQzlCLElBQUksQ0FBQyxDQUFNLGNBQWMsRUFBQyxFQUFFO1FBQzNCLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFDRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDbEMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUQsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBYyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQU8sTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFOztZQUN2RixNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQztZQUMzQixNQUFNLFlBQVksR0FBRyxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxhQUFhLDBDQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlDLElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRTtnQkFDOUIsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUNqQyxJQUFJO29CQUNGLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUN0RCxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2lCQUMxQjtnQkFBQyxPQUFPLEdBQUcsRUFBRTtvQkFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLFlBQVksQ0FBQyxDQUFDO2lCQUNyRDthQUNGO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNQLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUEsQ0FBQztTQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUtYLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUN0RSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUF2Q0QsOENBdUNDO0FBRUQsU0FBZ0Isb0JBQW9CLENBQUMsT0FBZ0M7SUFFbkUsT0FBTyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7U0FDOUIsSUFBSSxDQUFDLENBQU0sY0FBYyxFQUFDLEVBQUU7UUFDM0IsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUM1QjtRQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNsQyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM5RCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBTyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDdkYsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUM7WUFDM0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFdBQVcsQ0FBQztZQUNyQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFVBQVUsRUFBRTtnQkFDaEMsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO29CQUN6QixPQUFPLEtBQUssQ0FBQztpQkFDZDtnQkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQy9CLElBQUk7d0JBQ0YsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQztxQkFDeEI7b0JBQUMsT0FBTyxHQUFHLEVBQUU7d0JBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ25EO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDUCxDQUFDO0FBL0JELG9EQStCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU0NSSVBUX01FUkdFUl9JRCwgTUVSR0VfSU5WX01BTklGRVNUIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmZ1bmN0aW9uIGdldE1lcmdlSW52ZW50b3J5KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgLy8gUHJvdmlkZWQgd2l0aCBhIHBhdHRlcm4sIGF0dGVtcHRzIHRvIHJldHJpZXZlIGVsZW1lbnQgdmFsdWVzXHJcbiAgLy8gIGZyb20gYW55IGVsZW1lbnQga2V5cyB0aGF0IG1hdGNoIHRoZSBwYXR0ZXJuIGluc2lkZSB0aGUgbWVyZ2UgaW52ZW50b3J5IGZpbGUuXHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyID0gdXRpbC5nZXRTYWZlKGRpc2NvdmVyeSwgWyd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICgoc2NyaXB0TWVyZ2VyID09PSB1bmRlZmluZWQpIHx8IChzY3JpcHRNZXJnZXIucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXIucGF0aCksIE1FUkdFX0lOVl9NQU5JRkVTVCkpXHJcbiAgICAudGhlbihhc3luYyB4bWxEYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtZXJnZURhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoeG1sRGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtZXJnZURhdGEpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgLy8gTm8gbWVyZ2UgZmlsZT8gLSBubyBwcm9ibGVtLlxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBwYXJzZSAke01FUkdFX0lOVl9NQU5JRkVTVH06ICR7ZXJyfWApKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXJnZWRNb2ROYW1lcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIC8vIFRoaXMgcmV0cmlldmVzIHRoZSBuYW1lIG9mIHRoZSByZXN1bHRpbmcgbWVyZ2VkIG1vZCBpdHNlbGYuXHJcbiAgLy8gIEFLQSBcIm1vZDAwMDBfTWVyZ2VkRmlsZXNcIlxyXG4gIHJldHVybiBnZXRNZXJnZUludmVudG9yeShjb250ZXh0KVxyXG4gICAgLnRoZW4oYXN5bmMgbWVyZ2VJbnZlbnRvcnkgPT4ge1xyXG4gICAgICBpZiAobWVyZ2VJbnZlbnRvcnkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCBtZXJnZUludmVudG9yeS5NZXJnZUludmVudG9yeS5NZXJnZS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xyXG4gICAgICAgIGNvbnN0IG1lcmdlTW9kTmFtZSA9IGl0ZXI/Lk1lcmdlZE1vZE5hbWU/LlswXTtcclxuICAgICAgICBpZiAobWVyZ2VNb2ROYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtZXJnZU1vZE5hbWUpKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZHNQYXRoLCBtZXJnZU1vZE5hbWUpKTtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChtZXJnZU1vZE5hbWUpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZygnZGVidWcnLCAnbWVyZ2VkIG1vZCBpcyBtaXNzaW5nJywgbWVyZ2VNb2ROYW1lKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZWxlbWVudHMpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAvLyBXZSBmYWlsZWQgdG8gcGFyc2UgdGhlIG1lcmdlIGludmVudG9yeSBmb3Igd2hhdGV2ZXIgcmVhc29uLlxyXG4gICAgICAvLyAgUmF0aGVyIHRoYW4gYmxvY2tpbmcgdGhlIHVzZXIgZnJvbSBtb2RkaW5nIGhpcyBnYW1lIHdlJ3JlXHJcbiAgICAgIC8vICB3ZSBzaW1wbHkgcmV0dXJuIGFuIGVtcHR5IGFycmF5OyBidXQgYmVmb3JlIHdlIGRvIHRoYXQsXHJcbiAgICAgIC8vICB3ZSBuZWVkIHRvIHRlbGwgaGltIHdlIHdlcmUgdW5hYmxlIHRvIHBhcnNlIHRoZSBtZXJnZWQgaW52ZW50b3J5LlxyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTWVyZ2VJbnZlbnRvcnkueG1sIGZpbGUnLCBlcnIsXHJcbiAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc09mTWVyZ2VkTW9kcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IEJsdWViaXJkPHN0cmluZ1tdPiB7XHJcbiAgLy8gVGhpcyByZXRyaWV2ZXMgYSB1bmlxdWUgbGlzdCBvZiBtb2QgbmFtZXMgaW5jbHVkZWQgaW4gdGhlIG1lcmdlZCBtb2RcclxuICByZXR1cm4gZ2V0TWVyZ2VJbnZlbnRvcnkoY29udGV4dClcclxuICAgIC50aGVuKGFzeW5jIG1lcmdlSW52ZW50b3J5ID0+IHtcclxuICAgICAgaWYgKG1lcmdlSW52ZW50b3J5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyk7XHJcbiAgICAgIGNvbnN0IG1vZE5hbWVzID0gYXdhaXQgbWVyZ2VJbnZlbnRvcnkuTWVyZ2VJbnZlbnRvcnkuTWVyZ2UucmVkdWNlKGFzeW5jIChhY2N1bVAsIGl0ZXIpID0+IHtcclxuICAgICAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcclxuICAgICAgICBjb25zdCBtZXJnZWRNb2RzID0gaXRlcj8uSW5jbHVkZWRNb2Q7XHJcbiAgICAgICAgZm9yIChjb25zdCBtb2ROYW1lIG9mIG1lcmdlZE1vZHMpIHtcclxuICAgICAgICAgIGlmIChtb2ROYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtb2ROYW1lPy5fKSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kc1BhdGgsIG1vZE5hbWU/Ll8pKTtcclxuICAgICAgICAgICAgICBhY2N1bS5wdXNoKG1vZE5hbWU/Ll8pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICBsb2coJ2RlYnVnJywgJ21lcmdlZCBtb2QgaXMgbWlzc2luZycsIG1vZE5hbWU/Ll8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWVzKTtcclxuICAgIH0pO1xyXG59XHJcbiJdfQ==