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
exports.getMergedModNames = getMergedModNames;
exports.getNamesOfMergedMods = getNamesOfMergedMods;
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
        api.showErrorNotification('Invalid MergeInventory.xml file', err, { allowReport: false });
        return Promise.resolve([]);
    });
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBaUNBLDhDQWtEQztBQUVELG9EQStCQztBQW5IRCx3REFBZ0M7QUFDaEMsZ0RBQXdCO0FBQ3hCLG1DQUE0QztBQUU1QyxxQ0FBeUU7QUFFekUsMkNBQWtEO0FBRWxELFNBQVMsaUJBQWlCLENBQUMsR0FBd0I7SUFHakQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNsRyxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUseUJBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNyRixJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQ3RFLE9BQU8sa0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLDJCQUFrQixDQUFDLENBQUM7U0FDcEYsSUFBSSxDQUFDLENBQU0sT0FBTyxFQUFDLEVBQUU7UUFDcEIsSUFBSSxDQUFDO1lBQ0gsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFBLDJCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3BELE9BQU8sT0FB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SSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFdBQVcsQ0FBQztZQUNyQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxLQUFLLENBQUM7Z0JBQ2YsQ0FBQztnQkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDO3dCQUNILE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDcEQsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLENBQUM7b0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzt3QkFDYixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQztvQkFDcEQsQ0FBQztnQkFDSCxDQUFDO1lBQ0gsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDUCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIFNDUklQVF9NRVJHRVJfSUQsIE1FUkdFX0lOVl9NQU5JRkVTVCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5mdW5jdGlvbiBnZXRNZXJnZUludmVudG9yeShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyBQcm92aWRlZCB3aXRoIGEgcGF0dGVybiwgYXR0ZW1wdHMgdG8gcmV0cmlldmUgZWxlbWVudCB2YWx1ZXNcclxuICAvLyAgZnJvbSBhbnkgZWxlbWVudCBrZXlzIHRoYXQgbWF0Y2ggdGhlIHBhdHRlcm4gaW5zaWRlIHRoZSBtZXJnZSBpbnZlbnRvcnkgZmlsZS5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyID0gdXRpbC5nZXRTYWZlKGRpc2NvdmVyeSwgWyd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICgoc2NyaXB0TWVyZ2VyID09PSB1bmRlZmluZWQpIHx8IChzY3JpcHRNZXJnZXIucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXIucGF0aCksIE1FUkdFX0lOVl9NQU5JRkVTVCkpXHJcbiAgICAudGhlbihhc3luYyB4bWxEYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtZXJnZURhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoeG1sRGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtZXJnZURhdGEpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgLy8gTm8gbWVyZ2UgZmlsZT8gLSBubyBwcm9ibGVtLlxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBwYXJzZSAke01FUkdFX0lOVl9NQU5JRkVTVH06ICR7ZXJyfWApKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXJnZWRNb2ROYW1lcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyBUaGlzIHJldHJpZXZlcyB0aGUgbmFtZSBvZiB0aGUgcmVzdWx0aW5nIG1lcmdlZCBtb2QgaXRzZWxmLlxyXG4gIC8vICBBS0EgXCJtb2QwMDAwX01lcmdlZEZpbGVzXCJcclxuICByZXR1cm4gZ2V0TWVyZ2VJbnZlbnRvcnkoYXBpKVxyXG4gICAgLnRoZW4oYXN5bmMgbWVyZ2VJbnZlbnRvcnkgPT4ge1xyXG4gICAgICBpZiAobWVyZ2VJbnZlbnRvcnkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyk7XHJcbiAgICAgIGNvbnN0IG1lcmdlRW50cnkgPSBtZXJnZUludmVudG9yeT8uTWVyZ2VJbnZlbnRvcnk/Lk1lcmdlO1xyXG4gICAgICBpZiAobWVyZ2VFbnRyeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgbGV0IGludjtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgaW52ID0gSlNPTi5zdHJpbmdpZnkobWVyZ2VJbnZlbnRvcnkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHJldHJpZXZlIG1lcmdlZCBtb2QgbmFtZXMnLCBpbnYpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gYXdhaXQgbWVyZ2VFbnRyeS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xyXG4gICAgICAgIGNvbnN0IG1lcmdlTW9kTmFtZSA9IGl0ZXI/Lk1lcmdlZE1vZE5hbWU/LlswXTtcclxuICAgICAgICBpZiAobWVyZ2VNb2ROYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtZXJnZU1vZE5hbWUpKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZHNQYXRoLCBtZXJnZU1vZE5hbWUpKTtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChtZXJnZU1vZE5hbWUpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZygnZGVidWcnLCAnbWVyZ2VkIG1vZCBpcyBtaXNzaW5nJywgbWVyZ2VNb2ROYW1lKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZWxlbWVudHMpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAvLyBXZSBmYWlsZWQgdG8gcGFyc2UgdGhlIG1lcmdlIGludmVudG9yeSBmb3Igd2hhdGV2ZXIgcmVhc29uLlxyXG4gICAgICAvLyAgUmF0aGVyIHRoYW4gYmxvY2tpbmcgdGhlIHVzZXIgZnJvbSBtb2RkaW5nIGhpcyBnYW1lIHdlJ3JlXHJcbiAgICAgIC8vICB3ZSBzaW1wbHkgcmV0dXJuIGFuIGVtcHR5IGFycmF5OyBidXQgYmVmb3JlIHdlIGRvIHRoYXQsXHJcbiAgICAgIC8vICB3ZSBuZWVkIHRvIHRlbGwgaGltIHdlIHdlcmUgdW5hYmxlIHRvIHBhcnNlIHRoZSBtZXJnZWQgaW52ZW50b3J5LlxyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIE1lcmdlSW52ZW50b3J5LnhtbCBmaWxlJywgZXJyLFxyXG4gICAgICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZXNPZk1lcmdlZE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogQmx1ZWJpcmQ8c3RyaW5nW10+IHtcclxuICAvLyBUaGlzIHJldHJpZXZlcyBhIHVuaXF1ZSBsaXN0IG9mIG1vZCBuYW1lcyBpbmNsdWRlZCBpbiB0aGUgbWVyZ2VkIG1vZFxyXG4gIHJldHVybiBnZXRNZXJnZUludmVudG9yeShhcGkpXHJcbiAgICAudGhlbihhc3luYyBtZXJnZUludmVudG9yeSA9PiB7XHJcbiAgICAgIGlmIChtZXJnZUludmVudG9yeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgICAgY29uc3QgbW9kTmFtZXMgPSBhd2FpdCBtZXJnZUludmVudG9yeS5NZXJnZUludmVudG9yeS5NZXJnZS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xyXG4gICAgICAgIGNvbnN0IG1lcmdlZE1vZHMgPSBpdGVyPy5JbmNsdWRlZE1vZDtcclxuICAgICAgICBmb3IgKGNvbnN0IG1vZE5hbWUgb2YgbWVyZ2VkTW9kcykge1xyXG4gICAgICAgICAgaWYgKG1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoIWFjY3VtLmluY2x1ZGVzKG1vZE5hbWU/Ll8pKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RzUGF0aCwgbW9kTmFtZT8uXykpO1xyXG4gICAgICAgICAgICAgIGFjY3VtLnB1c2gobW9kTmFtZT8uXyk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgIGxvZygnZGVidWcnLCAnbWVyZ2VkIG1vZCBpcyBtaXNzaW5nJywgbW9kTmFtZT8uXyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kTmFtZXMpO1xyXG4gICAgfSk7XHJcbn1cclxuIl19