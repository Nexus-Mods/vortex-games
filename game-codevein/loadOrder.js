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
exports.validate = exports.deserialize = exports.serialize = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
function serialize(context, loadOrder, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = (0, util_1.genProps)(context);
        if (props === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('invalid props'));
        }
        const loFilePath = yield (0, util_1.ensureLOFile)(context, profileId, props);
        const filteredLO = loadOrder.filter(lo => { var _a, _b; return ((_b = (_a = props.mods) === null || _a === void 0 ? void 0 : _a[lo === null || lo === void 0 ? void 0 : lo.modId]) === null || _b === void 0 ? void 0 : _b.type) !== 'collection'; });
        const prefixedLO = filteredLO.map((loEntry, idx) => {
            const prefix = (0, util_1.makePrefix)(idx);
            const data = {
                prefix,
            };
            return Object.assign(Object.assign({}, loEntry), { data });
        });
        yield vortex_api_1.fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
        yield vortex_api_1.fs.writeFileAsync(loFilePath, JSON.stringify(prefixedLO), { encoding: 'utf8' });
        return Promise.resolve();
    });
}
exports.serialize = serialize;
function deserialize(context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const props = (0, util_1.genProps)(context);
        if (((_a = props === null || props === void 0 ? void 0 : props.profile) === null || _a === void 0 ? void 0 : _a.gameId) !== common_1.GAME_ID) {
            return [];
        }
        const currentModsState = vortex_api_1.util.getSafe(props.profile, ['modState'], {});
        const enabledModIds = Object.keys(currentModsState)
            .filter(modId => vortex_api_1.util.getSafe(currentModsState, [modId, 'enabled'], false));
        const mods = vortex_api_1.util.getSafe(props.state, ['persistent', 'mods', common_1.GAME_ID], {});
        const loFilePath = yield (0, util_1.ensureLOFile)(context);
        const fileData = yield vortex_api_1.fs.readFileAsync(loFilePath, { encoding: 'utf8' });
        try {
            const data = JSON.parse(fileData);
            const filteredData = data.filter(entry => enabledModIds.includes(entry.id));
            const diff = enabledModIds.filter(id => {
                var _a;
                return (((_a = mods[id]) === null || _a === void 0 ? void 0 : _a.type) !== 'collection')
                    && (filteredData.find(loEntry => loEntry.id === id) === undefined);
            });
            diff.forEach(missingEntry => {
                filteredData.push({
                    id: missingEntry,
                    modId: missingEntry,
                    enabled: true,
                    name: mods[missingEntry] !== undefined
                        ? vortex_api_1.util.renderModName(mods[missingEntry])
                        : missingEntry,
                });
            });
            return filteredData;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.deserialize = deserialize;
function validate(prev, current) {
    return __awaiter(this, void 0, void 0, function* () {
        return undefined;
    });
}
exports.validate = validate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2QztBQUU3QyxxQ0FBbUM7QUFFbkMsaUNBQTREO0FBRTVELFNBQXNCLFNBQVMsQ0FBQyxPQUFnQyxFQUNoQyxTQUFvQixFQUNwQixTQUFrQjs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsSUFBQSxlQUFRLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFHRCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUEsbUJBQVksRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsZUFBQyxPQUFBLENBQUEsTUFBQSxNQUFBLEtBQUssQ0FBQyxJQUFJLDBDQUFHLEVBQUUsYUFBRixFQUFFLHVCQUFGLEVBQUUsQ0FBRSxLQUFLLENBQUMsMENBQUUsSUFBSSxNQUFLLFlBQVksQ0FBQSxFQUFBLENBQUMsQ0FBQztRQUkxRixNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBd0IsRUFBRSxHQUFXLEVBQUUsRUFBRTtZQUMxRSxNQUFNLE1BQU0sR0FBRyxJQUFBLGlCQUFVLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDL0IsTUFBTSxJQUFJLEdBQXNCO2dCQUM5QixNQUFNO2FBQ1AsQ0FBQztZQUNGLHVDQUFZLE9BQU8sS0FBRSxJQUFJLElBQUc7UUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFHSCxNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxD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U0FDNUI7O0NBQ0Y7QUF2REQsa0NBdURDO0FBRUQsU0FBc0IsUUFBUSxDQUFDLElBQWUsRUFDZixPQUFrQjs7UUFJL0MsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUFBO0FBTkQsNEJBTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmcywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzLCBJU2VyaWFsaXphYmxlRGF0YSwgTG9hZE9yZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBlbnN1cmVMT0ZpbGUsIGdlblByb3BzLCBtYWtlUHJlZml4IH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE9yZGVyOiBMb2FkT3JkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnaW52YWxpZCBwcm9wcycpKTtcbiAgfVxuXG4gIC8vIE1ha2Ugc3VyZSB0aGUgTE8gZmlsZSBpcyBjcmVhdGVkIGFuZCByZWFkeSB0byBiZSB3cml0dGVuIHRvLlxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQsIHByb2ZpbGVJZCwgcHJvcHMpO1xuICBjb25zdCBmaWx0ZXJlZExPID0gbG9hZE9yZGVyLmZpbHRlcihsbyA9PiBwcm9wcy5tb2RzPy5bbG8/Lm1vZElkXT8udHlwZSAhPT0gJ2NvbGxlY3Rpb24nKTtcblxuICAvLyBUaGUgYXJyYXkgYXQgdGhpcyBwb2ludCBpcyBzb3J0ZWQgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHdlIHdhbnQgdGhlIGdhbWUgdG8gbG9hZCB0aGVcbiAgLy8gIG1vZHMsIHdoaWNoIG1lYW5zIHdlIGNhbiBqdXN0IGxvb3AgdGhyb3VnaCBpdCBhbmQgdXNlIHRoZSBpbmRleCB0byBhc3NpZ24gdGhlIHByZWZpeC5cbiAgY29uc3QgcHJlZml4ZWRMTyA9IGZpbHRlcmVkTE8ubWFwKChsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnksIGlkeDogbnVtYmVyKSA9PiB7XG4gICAgY29uc3QgcHJlZml4ID0gbWFrZVByZWZpeChpZHgpO1xuICAgIGNvbnN0IGRhdGE6IElTZXJpYWxpemFibGVEYXRhID0ge1xuICAgICAgcHJlZml4LFxuICAgIH07XG4gICAgcmV0dXJuIHsgLi4ubG9FbnRyeSwgZGF0YSB9O1xuICB9KTtcblxuICAvLyBXcml0ZSB0aGUgcHJlZml4ZWQgTE8gdG8gZmlsZS5cbiAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobG9GaWxlUGF0aCkuY2F0Y2goeyBjb2RlOiAnRU5PRU5UJyB9LCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSk7XG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxvRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHByZWZpeGVkTE8pLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlc2VyaWFsaXplKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KTogUHJvbWlzZTxMb2FkT3JkZXI+IHtcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXG4gIC8vICBzdWNoIGFzIHRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdGFsbGVkIE1vZHMsIFZvcnRleCdzIGFwcGxpY2F0aW9uIHN0YXRlLFxuICAvLyAgdGhlIGN1cnJlbnRseSBhY3RpdmUgcHJvZmlsZSwgZXRjLlxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XG4gIGlmIChwcm9wcz8ucHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgLy8gV2h5IGFyZSB3ZSBkZXNlcmlhbGl6aW5nIHdoZW4gdGhlIHByb2ZpbGUgaXMgaW52YWxpZCBvciBiZWxvbmdzIHRvXG4gICAgLy8gIGFub3RoZXIgZ2FtZSA/XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gVGhlIGRlc2VyaWFsaXphdGlvbiBmdW5jdGlvbiBzaG91bGQgYmUgdXNlZCB0byBmaWx0ZXIgYW5kIGluc2VydCB3YW50ZWQgZGF0YSBpbnRvIFZvcnRleCdzXG4gIC8vICBsb2FkT3JkZXIgYXBwbGljYXRpb24gc3RhdGUsIG9uY2UgdGhhdCdzIGRvbmUsIFZvcnRleCB3aWxsIHRyaWdnZXIgYSBzZXJpYWxpemF0aW9uIGV2ZW50XG4gIC8vICB3aGljaCB3aWxsIGVuc3VyZSB0aGF0IHRoZSBkYXRhIGlzIHdyaXR0ZW4gdG8gdGhlIExPIGZpbGUuXG4gIGNvbnN0IGN1cnJlbnRNb2RzU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvcHMucHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XG5cbiAgLy8gd2Ugb25seSB3YW50IHRvIGluc2VydCBlbmFibGVkIG1vZHMuXG4gIGNvbnN0IGVuYWJsZWRNb2RJZHMgPSBPYmplY3Qua2V5cyhjdXJyZW50TW9kc1N0YXRlKVxuICAgIC5maWx0ZXIobW9kSWQgPT4gdXRpbC5nZXRTYWZlKGN1cnJlbnRNb2RzU3RhdGUsIFttb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSxcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XG4gIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsb0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIHRyeSB7XG4gICAgY29uc3QgZGF0YTogSUxvYWRPcmRlckVudHJ5W10gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcblxuICAgIC8vIFVzZXIgbWF5IGhhdmUgZGlzYWJsZWQvcmVtb3ZlZCBhIG1vZCAtIHdlIG5lZWQgdG8gZmlsdGVyIG91dCBhbnkgZXhpc3RpbmdcbiAgICAvLyAgZW50cmllcyBmcm9tIHRoZSBkYXRhIHdlIHBhcnNlZC5cbiAgICBjb25zdCBmaWx0ZXJlZERhdGEgPSBkYXRhLmZpbHRlcihlbnRyeSA9PiBlbmFibGVkTW9kSWRzLmluY2x1ZGVzKGVudHJ5LmlkKSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdXNlciBhZGRlZCBhbnkgbmV3IG1vZHMuXG4gICAgY29uc3QgZGlmZiA9IGVuYWJsZWRNb2RJZHMuZmlsdGVyKGlkID0+IChtb2RzW2lkXT8udHlwZSAhPT0gJ2NvbGxlY3Rpb24nKVxuICAgICAgJiYgKGZpbHRlcmVkRGF0YS5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gaWQpID09PSB1bmRlZmluZWQpKTtcblxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXG4gICAgZGlmZi5mb3JFYWNoKG1pc3NpbmdFbnRyeSA9PiB7XG4gICAgICBmaWx0ZXJlZERhdGEucHVzaCh7XG4gICAgICAgIGlkOiBtaXNzaW5nRW50cnksXG4gICAgICAgIG1vZElkOiBtaXNzaW5nRW50cnksXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIG5hbWU6IG1vZHNbbWlzc2luZ0VudHJ5XSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgPyB1dGlsLnJlbmRlck1vZE5hbWUobW9kc1ttaXNzaW5nRW50cnldKVxuICAgICAgICAgIDogbWlzc2luZ0VudHJ5LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50IHlvdSBtYXkgaGF2ZSBub3RpY2VkIHRoYXQgd2UncmUgbm90IHNldHRpbmcgdGhlIHByZWZpeFxuICAgIC8vICBmb3IgdGhlIG5ld2x5IGFkZGVkIG1vZCBlbnRyaWVzIC0gd2UgY291bGQgY2VydGFpbmx5IGRvIHRoYXQgaGVyZSxcbiAgICAvLyAgYnV0IHRoYXQgd291bGQgc2ltcGx5IGJlIGNvZGUgZHVwbGljYXRpb24gYXMgd2UgbmVlZCB0byBhc3NpZ24gcHJlZml4ZXNcbiAgICAvLyAgZHVyaW5nIHNlcmlhbGl6YXRpb24gYW55d2F5IChvdGhlcndpc2UgdXNlciBkcmFnLWRyb3AgaW50ZXJhY3Rpb25zIHdpbGxcbiAgICAvLyAgbm90IGJlIHNhdmVkKVxuICAgIHJldHVybiBmaWx0ZXJlZERhdGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YWxpZGF0ZShwcmV2OiBMb2FkT3JkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogTG9hZE9yZGVyKTogUHJvbWlzZTxhbnk+IHtcbiAgLy8gTm90aGluZyB0byB2YWxpZGF0ZSByZWFsbHkgLSB0aGUgZ2FtZSBkb2VzIG5vdCByZWFkIG91ciBsb2FkIG9yZGVyIGZpbGVcbiAgLy8gIGFuZCB3ZSBkb24ndCB3YW50IHRvIGFwcGx5IGFueSByZXN0cmljdGlvbnMgZWl0aGVyLCBzbyB3ZSBqdXN0XG4gIC8vICByZXR1cm4uXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXX0=