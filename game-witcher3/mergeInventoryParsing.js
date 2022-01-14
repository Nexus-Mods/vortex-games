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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsbUNBQTRDO0FBRTVDLHFDQUF5RTtBQUV6RSwyQ0FBa0Q7QUFFbEQsU0FBUyxpQkFBaUIsQ0FBQyxPQUFnQztJQUd6RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbEcsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckYsSUFBSSxDQUFDLFlBQVksS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEVBQUU7UUFDckUsT0FBTyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM3QjtJQUdELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLDJCQUFrQixDQUFDLENBQUM7U0FDcEYsSUFBSSxDQUFDLENBQU0sT0FBTyxFQUFDLEVBQUU7UUFDcEIsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FrQm5DO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDLENBQUEsQ0FBQztTQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7UUFDbkMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLDJCQUFrQixLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9GLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxPQUFnQztJQUdoRSxPQUFPLGlCQUFpQixDQUFDLE9BQU8sQ0FBQztTQUM5QixJQUFJLENBQUMsQ0FBTSxjQUFjLEVBQUMsRUFBRTtRQUMzQixJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDaEMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNyQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuRCxNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQWMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFPLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRTs7WUFDdkYsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUM7WUFDM0IsTUFBTSxZQUFZLEdBQUcsTUFBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsYUFBYSwwQ0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5QyxJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUU7Z0JBQzlCLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRTtnQkFDakMsSUFBSTtvQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFDdEQsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDMUI7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7b0JBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxZQUFZLENBQUMsQ0FBQztpQkFDckQ7YUFDRjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDUCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFBLENBQUM7U0FDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFLWCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFDdEUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0IsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBdkNELDhDQXVDQztBQUVELFNBQWdCLG9CQUFvQixDQUFDLE9BQWdDO0lBRW5FLE9BQU8saUJBQWlCLENBQUMsT0FBTyxDQUFDO1NBQzlCLElBQUksQ0FBQyxDQUFNLGNBQWMsRUFBQyxFQUFFO1FBQzNCLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFDRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDbEMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUQsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBYyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQU8sTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3ZGLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDO1lBQzNCLE1BQU0sVUFBVSxHQUFHLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxXQUFXLENBQUM7WUFDckMsS0FBSyxNQUFNLE9BQU8sSUFBSSxVQUFVLEVBQUU7Z0JBQ2hDLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtvQkFDekIsT0FBTyxLQUFLLENBQUM7aUJBQ2Q7Z0JBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLENBQUMsQ0FBQyxFQUFFO29CQUMvQixJQUFJO3dCQUNGLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDcEQsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ3hCO29CQUFDLE9BQU8sR0FBRyxFQUFFO3dCQUNaLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUNuRDtpQkFDRjthQUNGO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNQLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQS9CRCxvREErQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIFNDUklQVF9NRVJHRVJfSUQsIE1FUkdFX0lOVl9NQU5JRkVTVCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5mdW5jdGlvbiBnZXRNZXJnZUludmVudG9yeShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIC8vIFByb3ZpZGVkIHdpdGggYSBwYXR0ZXJuLCBhdHRlbXB0cyB0byByZXRyaWV2ZSBlbGVtZW50IHZhbHVlc1xyXG4gIC8vICBmcm9tIGFueSBlbGVtZW50IGtleXMgdGhhdCBtYXRjaCB0aGUgcGF0dGVybiBpbnNpZGUgdGhlIG1lcmdlIGludmVudG9yeSBmaWxlLlxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGNvbnN0IHNjcmlwdE1lcmdlciA9IHV0aWwuZ2V0U2FmZShkaXNjb3ZlcnksIFsndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoKHNjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB8fCAoc2NyaXB0TWVyZ2VyLnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIC8vIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoc2NyaXB0TWVyZ2VyLnBhdGgpLCBNRVJHRV9JTlZfTUFOSUZFU1QpKVxyXG4gICAgLnRoZW4oYXN5bmMgeG1sRGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VEYXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKHhtbERhdGEpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobWVyZ2VEYXRhKTtcclxuICAgICAgICAvLyBjb25zdCBlbGVtZW50cyA9IFxyXG4gICAgICAgIC8vICAgLm1hcChtb2RFbnRyeSA9PiB7XHJcbiAgICAgICAgLy8gICAgIHRyeSB7XHJcbiAgICAgICAgLy8gICAgICAgcmV0dXJuIG1vZEVudHJ5LnRleHQoKTtcclxuICAgICAgICAvLyAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgIC8vICAgfSlcclxuICAgICAgICAvLyAgIC5maWx0ZXIoZW50cnkgPT4gISFlbnRyeSk7XHJcbiAgICAgICAgLy8gY29uc3QgdW5pcXVlID0gbmV3IFNldChlbGVtZW50cyk7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoQXJyYXkuZnJvbSh1bmlxdWUpLCAoYWNjdW06IHN0cmluZ1tdLCBtb2Q6IHN0cmluZykgPT5cclxuICAgICAgICAvLyAgIGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCkpXHJcbiAgICAgICAgLy8gICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgLy8gICAgIGFjY3VtLnB1c2gobW9kKTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICAgIC8vICAgfSkuY2F0Y2goZXJyID0+IGFjY3VtKSwgW10pO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgLy8gTm8gbWVyZ2UgZmlsZT8gLSBubyBwcm9ibGVtLlxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBwYXJzZSAke01FUkdFX0lOVl9NQU5JRkVTVH06ICR7ZXJyfWApKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXJnZWRNb2ROYW1lcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIC8vIFRoaXMgcmV0cmlldmVzIHRoZSBuYW1lIG9mIHRoZSByZXN1bHRpbmcgbWVyZ2VkIG1vZCBpdHNlbGYuXHJcbiAgLy8gIEFLQSBcIm1vZDAwMDBfTWVyZ2VkRmlsZXNcIlxyXG4gIHJldHVybiBnZXRNZXJnZUludmVudG9yeShjb250ZXh0KVxyXG4gICAgLnRoZW4oYXN5bmMgbWVyZ2VJbnZlbnRvcnkgPT4ge1xyXG4gICAgICBpZiAobWVyZ2VJbnZlbnRvcnkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCBtZXJnZUludmVudG9yeS5NZXJnZUludmVudG9yeS5NZXJnZS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xyXG4gICAgICAgIGNvbnN0IG1lcmdlTW9kTmFtZSA9IGl0ZXI/Lk1lcmdlZE1vZE5hbWU/LlswXTtcclxuICAgICAgICBpZiAobWVyZ2VNb2ROYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtZXJnZU1vZE5hbWUpKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZHNQYXRoLCBtZXJnZU1vZE5hbWUpKTtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChtZXJnZU1vZE5hbWUpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZygnZGVidWcnLCAnbWVyZ2VkIG1vZCBpcyBtaXNzaW5nJywgbWVyZ2VNb2ROYW1lKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZWxlbWVudHMpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAvLyBXZSBmYWlsZWQgdG8gcGFyc2UgdGhlIG1lcmdlIGludmVudG9yeSBmb3Igd2hhdGV2ZXIgcmVhc29uLlxyXG4gICAgICAvLyAgUmF0aGVyIHRoYW4gYmxvY2tpbmcgdGhlIHVzZXIgZnJvbSBtb2RkaW5nIGhpcyBnYW1lIHdlJ3JlXHJcbiAgICAgIC8vICB3ZSBzaW1wbHkgcmV0dXJuIGFuIGVtcHR5IGFycmF5OyBidXQgYmVmb3JlIHdlIGRvIHRoYXQsXHJcbiAgICAgIC8vICB3ZSBuZWVkIHRvIHRlbGwgaGltIHdlIHdlcmUgdW5hYmxlIHRvIHBhcnNlIHRoZSBtZXJnZWQgaW52ZW50b3J5LlxyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTWVyZ2VJbnZlbnRvcnkueG1sIGZpbGUnLCBlcnIsXHJcbiAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc09mTWVyZ2VkTW9kcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IEJsdWViaXJkPHN0cmluZ1tdPiB7XHJcbiAgLy8gVGhpcyByZXRyaWV2ZXMgYSB1bmlxdWUgbGlzdCBvZiBtb2QgbmFtZXMgaW5jbHVkZWQgaW4gdGhlIG1lcmdlZCBtb2RcclxuICByZXR1cm4gZ2V0TWVyZ2VJbnZlbnRvcnkoY29udGV4dClcclxuICAgIC50aGVuKGFzeW5jIG1lcmdlSW52ZW50b3J5ID0+IHtcclxuICAgICAgaWYgKG1lcmdlSW52ZW50b3J5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyk7XHJcbiAgICAgIGNvbnN0IG1vZE5hbWVzID0gYXdhaXQgbWVyZ2VJbnZlbnRvcnkuTWVyZ2VJbnZlbnRvcnkuTWVyZ2UucmVkdWNlKGFzeW5jIChhY2N1bVAsIGl0ZXIpID0+IHtcclxuICAgICAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcclxuICAgICAgICBjb25zdCBtZXJnZWRNb2RzID0gaXRlcj8uSW5jbHVkZWRNb2Q7XHJcbiAgICAgICAgZm9yIChjb25zdCBtb2ROYW1lIG9mIG1lcmdlZE1vZHMpIHtcclxuICAgICAgICAgIGlmIChtb2ROYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtb2ROYW1lPy5fKSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kc1BhdGgsIG1vZE5hbWU/Ll8pKTtcclxuICAgICAgICAgICAgICBhY2N1bS5wdXNoKG1vZE5hbWU/Ll8pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICBsb2coJ2RlYnVnJywgJ21lcmdlZCBtb2QgaXMgbWlzc2luZycsIG1vZE5hbWU/Ll8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWVzKTtcclxuICAgIH0pO1xyXG59XHJcbiJdfQ==