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
        var _a;
        if (mergeInventory === undefined) {
            return Promise.resolve([]);
        }
        const state = context.api.getState();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsbUNBQTRDO0FBRTVDLHFDQUF5RTtBQUV6RSwyQ0FBa0Q7QUFFbEQsU0FBUyxpQkFBaUIsQ0FBQyxPQUFnQztJQUd6RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbEcsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckYsSUFBSSxDQUFDLFlBQVksS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEVBQUU7UUFDckUsT0FBTyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM3QjtJQUVELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLDJCQUFrQixDQUFDLENBQUM7U0FDcEYsSUFBSSxDQUFDLENBQU0sT0FBTyxFQUFDLEVBQUU7UUFDcEIsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FB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QUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7b0JBQ3pCLE9BQU8sS0FBSyxDQUFDO2lCQUNkO2dCQUNELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsRUFBRTtvQkFDL0IsSUFBSTt3QkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3BELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN4QjtvQkFBQyxPQUFPLEdBQUcsRUFBRTt3QkFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQztxQkFDbkQ7aUJBQ0Y7YUFDRjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDUCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNQLENBQUM7QUEvQkQsb0RBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBTQ1JJUFRfTUVSR0VSX0lELCBNRVJHRV9JTlZfTUFOSUZFU1QgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuZnVuY3Rpb24gZ2V0TWVyZ2VJbnZlbnRvcnkoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICAvLyBQcm92aWRlZCB3aXRoIGEgcGF0dGVybiwgYXR0ZW1wdHMgdG8gcmV0cmlldmUgZWxlbWVudCB2YWx1ZXNcclxuICAvLyAgZnJvbSBhbnkgZWxlbWVudCBrZXlzIHRoYXQgbWF0Y2ggdGhlIHBhdHRlcm4gaW5zaWRlIHRoZSBtZXJnZSBpbnZlbnRvcnkgZmlsZS5cclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoZGlzY292ZXJ5LCBbJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKChzY3JpcHRNZXJnZXIgPT09IHVuZGVmaW5lZCkgfHwgKHNjcmlwdE1lcmdlci5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHNjcmlwdE1lcmdlci5wYXRoKSwgTUVSR0VfSU5WX01BTklGRVNUKSlcclxuICAgIC50aGVuKGFzeW5jIHhtbERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG1lcmdlRGF0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlRGF0YSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSAvLyBObyBtZXJnZSBmaWxlPyAtIG5vIHByb2JsZW0uXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChgRmFpbGVkIHRvIHBhcnNlICR7TUVSR0VfSU5WX01BTklGRVNUfTogJHtlcnJ9YCkpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1lcmdlZE1vZE5hbWVzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgLy8gVGhpcyByZXRyaWV2ZXMgdGhlIG5hbWUgb2YgdGhlIHJlc3VsdGluZyBtZXJnZWQgbW9kIGl0c2VsZi5cclxuICAvLyAgQUtBIFwibW9kMDAwMF9NZXJnZWRGaWxlc1wiXHJcbiAgcmV0dXJuIGdldE1lcmdlSW52ZW50b3J5KGNvbnRleHQpXHJcbiAgICAudGhlbihhc3luYyBtZXJnZUludmVudG9yeSA9PiB7XHJcbiAgICAgIGlmIChtZXJnZUludmVudG9yeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xyXG4gICAgICBjb25zdCBtZXJnZUVudHJ5ID0gbWVyZ2VJbnZlbnRvcnk/Lk1lcmdlSW52ZW50b3J5Py5NZXJnZTtcclxuICAgICAgaWYgKG1lcmdlRW50cnkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGxldCBpbnY7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGludiA9IEpTT04uc3RyaW5naWZ5KG1lcmdlSW52ZW50b3J5KTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byByZXRyaWV2ZSBtZXJnZWQgbW9kIG5hbWVzJywgaW52KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBlbGVtZW50cyA9IGF3YWl0IG1lcmdlRW50cnkucmVkdWNlKGFzeW5jIChhY2N1bVAsIGl0ZXIpID0+IHtcclxuICAgICAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcclxuICAgICAgICBjb25zdCBtZXJnZU1vZE5hbWUgPSBpdGVyPy5NZXJnZWRNb2ROYW1lPy5bMF07XHJcbiAgICAgICAgaWYgKG1lcmdlTW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobWVyZ2VNb2ROYW1lKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RzUGF0aCwgbWVyZ2VNb2ROYW1lKSk7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2gobWVyZ2VNb2ROYW1lKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBsb2coJ2RlYnVnJywgJ21lcmdlZCBtb2QgaXMgbWlzc2luZycsIG1lcmdlTW9kTmFtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVsZW1lbnRzKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgLy8gV2UgZmFpbGVkIHRvIHBhcnNlIHRoZSBtZXJnZSBpbnZlbnRvcnkgZm9yIHdoYXRldmVyIHJlYXNvbi5cclxuICAgICAgLy8gIFJhdGhlciB0aGFuIGJsb2NraW5nIHRoZSB1c2VyIGZyb20gbW9kZGluZyBoaXMgZ2FtZSB3ZSdyZVxyXG4gICAgICAvLyAgd2Ugc2ltcGx5IHJldHVybiBhbiBlbXB0eSBhcnJheTsgYnV0IGJlZm9yZSB3ZSBkbyB0aGF0LFxyXG4gICAgICAvLyAgd2UgbmVlZCB0byB0ZWxsIGhpbSB3ZSB3ZXJlIHVuYWJsZSB0byBwYXJzZSB0aGUgbWVyZ2VkIGludmVudG9yeS5cclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIE1lcmdlSW52ZW50b3J5LnhtbCBmaWxlJywgZXJyLFxyXG4gICAgICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZXNPZk1lcmdlZE1vZHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBCbHVlYmlyZDxzdHJpbmdbXT4ge1xyXG4gIC8vIFRoaXMgcmV0cmlldmVzIGEgdW5pcXVlIGxpc3Qgb2YgbW9kIG5hbWVzIGluY2x1ZGVkIGluIHRoZSBtZXJnZWQgbW9kXHJcbiAgcmV0dXJuIGdldE1lcmdlSW52ZW50b3J5KGNvbnRleHQpXHJcbiAgICAudGhlbihhc3luYyBtZXJnZUludmVudG9yeSA9PiB7XHJcbiAgICAgIGlmIChtZXJnZUludmVudG9yeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xyXG4gICAgICBjb25zdCBtb2ROYW1lcyA9IGF3YWl0IG1lcmdlSW52ZW50b3J5Lk1lcmdlSW52ZW50b3J5Lk1lcmdlLnJlZHVjZShhc3luYyAoYWNjdW1QLCBpdGVyKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VkTW9kcyA9IGl0ZXI/LkluY2x1ZGVkTW9kO1xyXG4gICAgICAgIGZvciAoY29uc3QgbW9kTmFtZSBvZiBtZXJnZWRNb2RzKSB7XHJcbiAgICAgICAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobW9kTmFtZT8uXykpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZHNQYXRoLCBtb2ROYW1lPy5fKSk7XHJcbiAgICAgICAgICAgICAgYWNjdW0ucHVzaChtb2ROYW1lPy5fKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgbG9nKCdkZWJ1ZycsICdtZXJnZWQgbW9kIGlzIG1pc3NpbmcnLCBtb2ROYW1lPy5fKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIFtdKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lcyk7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=