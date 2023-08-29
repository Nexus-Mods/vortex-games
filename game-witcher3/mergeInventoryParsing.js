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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsbUNBQTRDO0FBRTVDLHFDQUF5RTtBQUV6RSwyQ0FBa0Q7QUFFbEQsU0FBUyxpQkFBaUIsQ0FBQyxPQUFnQztJQUd6RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbEcsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckYsSUFBSSxDQUFDLFlBQVksS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEVBQUU7UUFDckUsT0FBTyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM3QjtJQUVELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLDJCQUFrQixDQUFDLENBQUM7U0FDcEYsSUFBSSxDQUFDLENBQU0sT0FBTyxFQUFDLEVBQUU7UUFDcEIsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FB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QUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7b0JBQ3pCLE9BQU8sS0FBSyxDQUFDO2lCQUNkO2dCQUNELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsRUFBRTtvQkFDL0IsSUFBSTt3QkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3BELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUN4QjtvQkFBQyxPQUFPLEdBQUcsRUFBRTt3QkFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQztxQkFDbkQ7aUJBQ0Y7YUFDRjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDUCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNQLENBQUM7QUEvQkQsb0RBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgU0NSSVBUX01FUkdFUl9JRCwgTUVSR0VfSU5WX01BTklGRVNUIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5mdW5jdGlvbiBnZXRNZXJnZUludmVudG9yeShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICAvLyBQcm92aWRlZCB3aXRoIGEgcGF0dGVybiwgYXR0ZW1wdHMgdG8gcmV0cmlldmUgZWxlbWVudCB2YWx1ZXNcbiAgLy8gIGZyb20gYW55IGVsZW1lbnQga2V5cyB0aGF0IG1hdGNoIHRoZSBwYXR0ZXJuIGluc2lkZSB0aGUgbWVyZ2UgaW52ZW50b3J5IGZpbGUuXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyID0gdXRpbC5nZXRTYWZlKGRpc2NvdmVyeSwgWyd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xuICBpZiAoKHNjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB8fCAoc2NyaXB0TWVyZ2VyLnBhdGggPT09IHVuZGVmaW5lZCkpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShbXSk7XG4gIH1cblxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHNjcmlwdE1lcmdlci5wYXRoKSwgTUVSR0VfSU5WX01BTklGRVNUKSlcbiAgICAudGhlbihhc3luYyB4bWxEYXRhID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1lcmdlRGF0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtZXJnZURhdGEpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSAvLyBObyBtZXJnZSBmaWxlPyAtIG5vIHByb2JsZW0uXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGBGYWlsZWQgdG8gcGFyc2UgJHtNRVJHRV9JTlZfTUFOSUZFU1R9OiAke2Vycn1gKSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWVyZ2VkTW9kTmFtZXMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgLy8gVGhpcyByZXRyaWV2ZXMgdGhlIG5hbWUgb2YgdGhlIHJlc3VsdGluZyBtZXJnZWQgbW9kIGl0c2VsZi5cbiAgLy8gIEFLQSBcIm1vZDAwMDBfTWVyZ2VkRmlsZXNcIlxuICByZXR1cm4gZ2V0TWVyZ2VJbnZlbnRvcnkoY29udGV4dClcbiAgICAudGhlbihhc3luYyBtZXJnZUludmVudG9yeSA9PiB7XG4gICAgICBpZiAobWVyZ2VJbnZlbnRvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcbiAgICAgIGNvbnN0IG1lcmdlRW50cnkgPSBtZXJnZUludmVudG9yeT8uTWVyZ2VJbnZlbnRvcnk/Lk1lcmdlO1xuICAgICAgaWYgKG1lcmdlRW50cnkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBsZXQgaW52O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGludiA9IEpTT04uc3RyaW5naWZ5KG1lcmdlSW52ZW50b3J5KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gcmV0cmlldmUgbWVyZ2VkIG1vZCBuYW1lcycsIGludik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgfVxuICAgICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCBtZXJnZUVudHJ5LnJlZHVjZShhc3luYyAoYWNjdW1QLCBpdGVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgICAgICBjb25zdCBtZXJnZU1vZE5hbWUgPSBpdGVyPy5NZXJnZWRNb2ROYW1lPy5bMF07XG4gICAgICAgIGlmIChtZXJnZU1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBhY2N1bTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFjY3VtLmluY2x1ZGVzKG1lcmdlTW9kTmFtZSkpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RzUGF0aCwgbWVyZ2VNb2ROYW1lKSk7XG4gICAgICAgICAgICBhY2N1bS5wdXNoKG1lcmdlTW9kTmFtZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2coJ2RlYnVnJywgJ21lcmdlZCBtb2QgaXMgbWlzc2luZycsIG1lcmdlTW9kTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2N1bTtcbiAgICAgIH0sIFtdKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZWxlbWVudHMpO1xuICAgIH0pXG4gICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAvLyBXZSBmYWlsZWQgdG8gcGFyc2UgdGhlIG1lcmdlIGludmVudG9yeSBmb3Igd2hhdGV2ZXIgcmVhc29uLlxuICAgICAgLy8gIFJhdGhlciB0aGFuIGJsb2NraW5nIHRoZSB1c2VyIGZyb20gbW9kZGluZyBoaXMgZ2FtZSB3ZSdyZVxuICAgICAgLy8gIHdlIHNpbXBseSByZXR1cm4gYW4gZW1wdHkgYXJyYXk7IGJ1dCBiZWZvcmUgd2UgZG8gdGhhdCxcbiAgICAgIC8vICB3ZSBuZWVkIHRvIHRlbGwgaGltIHdlIHdlcmUgdW5hYmxlIHRvIHBhcnNlIHRoZSBtZXJnZWQgaW52ZW50b3J5LlxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIE1lcmdlSW52ZW50b3J5LnhtbCBmaWxlJywgZXJyLFxuICAgICAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZXNPZk1lcmdlZE1vZHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBCbHVlYmlyZDxzdHJpbmdbXT4ge1xuICAvLyBUaGlzIHJldHJpZXZlcyBhIHVuaXF1ZSBsaXN0IG9mIG1vZCBuYW1lcyBpbmNsdWRlZCBpbiB0aGUgbWVyZ2VkIG1vZFxuICByZXR1cm4gZ2V0TWVyZ2VJbnZlbnRvcnkoY29udGV4dClcbiAgICAudGhlbihhc3luYyBtZXJnZUludmVudG9yeSA9PiB7XG4gICAgICBpZiAobWVyZ2VJbnZlbnRvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcbiAgICAgIGNvbnN0IG1vZE5hbWVzID0gYXdhaXQgbWVyZ2VJbnZlbnRvcnkuTWVyZ2VJbnZlbnRvcnkuTWVyZ2UucmVkdWNlKGFzeW5jIChhY2N1bVAsIGl0ZXIpID0+IHtcbiAgICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XG4gICAgICAgIGNvbnN0IG1lcmdlZE1vZHMgPSBpdGVyPy5JbmNsdWRlZE1vZDtcbiAgICAgICAgZm9yIChjb25zdCBtb2ROYW1lIG9mIG1lcmdlZE1vZHMpIHtcbiAgICAgICAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWNjdW07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobW9kTmFtZT8uXykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kc1BhdGgsIG1vZE5hbWU/Ll8pKTtcbiAgICAgICAgICAgICAgYWNjdW0ucHVzaChtb2ROYW1lPy5fKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBsb2coJ2RlYnVnJywgJ21lcmdlZCBtb2QgaXMgbWlzc2luZycsIG1vZE5hbWU/Ll8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjdW07XG4gICAgICB9LCBbXSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWVzKTtcbiAgICB9KTtcbn1cbiJdfQ==