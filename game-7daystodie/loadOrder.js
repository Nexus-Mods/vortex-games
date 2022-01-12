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
        const filteredLO = loadOrder.filter(lo => { var _a, _b; return !common_1.INVALID_LO_MOD_TYPES.includes((_b = (_a = props.mods) === null || _a === void 0 ? void 0 : _a[lo === null || lo === void 0 ? void 0 : lo.modId]) === null || _b === void 0 ? void 0 : _b.type); });
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
                return (!common_1.INVALID_LO_MOD_TYPES.includes((_a = mods[id]) === null || _a === void 0 ? void 0 : _a.type))
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2QztBQUU3QyxxQ0FBeUQ7QUFFekQsaUNBQTREO0FBRTVELFNBQXNCLFNBQVMsQ0FBQyxPQUFnQyxFQUNoQyxTQUFvQixFQUNwQixTQUFrQjs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsSUFBQSxlQUFRLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFHRCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUEsbUJBQVksRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsZUFDdkMsT0FBQSxDQUFDLDZCQUFvQixDQUFDLFFBQVEsQ0FBQyxNQUFBLE1BQUEsS0FBSyxDQUFDLElBQUksMENBQUcsRUFBRSxhQUFGLEVBQUUsdUJBQUYsRUFBRSxDQUFFLEtBQUssQ0FBQywwQ0FBRSxJQUFJLENBQUMsQ0FBQSxFQUFBLENBQUMsQ0FBQztRQUlqRSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBd0IsRUFBRSxHQUFXLEVBQUUsRUFBRTtZQUMxRSxNQUFNLE1BQU0sR0FBRyxJQUFBLGlCQUFVLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDL0IsTUFBTSxJQUFJLEdBQXNCO2dCQUM5QixNQUFNO2FBQ1AsQ0FBQztZQUNGLHVDQUFZLE9BQU8sS0FBRSxJQUFJLElBQUc7UUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFHSCxNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsVUFB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T0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1Qjs7Q0FDRjtBQXZERCxrQ0F1REM7QUFFRCxTQUFzQixRQUFRLENBQUMsSUFBZSxFQUNmLE9BQWtCOztRQUkvQyxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQUE7QUFORCw0QkFNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSU5WQUxJRF9MT19NT0RfVFlQRVMgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzLCBJU2VyaWFsaXphYmxlRGF0YSwgTG9hZE9yZGVyIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGVuc3VyZUxPRmlsZSwgZ2VuUHJvcHMsIG1ha2VQcmVmaXggfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICAvLyBNYWtlIHN1cmUgdGhlIExPIGZpbGUgaXMgY3JlYXRlZCBhbmQgcmVhZHkgdG8gYmUgd3JpdHRlbiB0by5cclxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQsIHByb2ZpbGVJZCwgcHJvcHMpO1xyXG4gIGNvbnN0IGZpbHRlcmVkTE8gPSBsb2FkT3JkZXIuZmlsdGVyKGxvID0+IFxyXG4gICAgIUlOVkFMSURfTE9fTU9EX1RZUEVTLmluY2x1ZGVzKHByb3BzLm1vZHM/Lltsbz8ubW9kSWRdPy50eXBlKSk7XHJcblxyXG4gIC8vIFRoZSBhcnJheSBhdCB0aGlzIHBvaW50IGlzIHNvcnRlZCBpbiB0aGUgb3JkZXIgaW4gd2hpY2ggd2Ugd2FudCB0aGUgZ2FtZSB0byBsb2FkIHRoZVxyXG4gIC8vICBtb2RzLCB3aGljaCBtZWFucyB3ZSBjYW4ganVzdCBsb29wIHRocm91Z2ggaXQgYW5kIHVzZSB0aGUgaW5kZXggdG8gYXNzaWduIHRoZSBwcmVmaXguXHJcbiAgY29uc3QgcHJlZml4ZWRMTyA9IGZpbHRlcmVkTE8ubWFwKChsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnksIGlkeDogbnVtYmVyKSA9PiB7XHJcbiAgICBjb25zdCBwcmVmaXggPSBtYWtlUHJlZml4KGlkeCk7XHJcbiAgICBjb25zdCBkYXRhOiBJU2VyaWFsaXphYmxlRGF0YSA9IHtcclxuICAgICAgcHJlZml4LFxyXG4gICAgfTtcclxuICAgIHJldHVybiB7IC4uLmxvRW50cnksIGRhdGEgfTtcclxuICB9KTtcclxuXHJcbiAgLy8gV3JpdGUgdGhlIHByZWZpeGVkIExPIHRvIGZpbGUuXHJcbiAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobG9GaWxlUGF0aCkuY2F0Y2goeyBjb2RlOiAnRU5PRU5UJyB9LCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSk7XHJcbiAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobG9GaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkocHJlZml4ZWRMTyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8TG9hZE9yZGVyPiB7XHJcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXHJcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXHJcbiAgLy8gIHRoZSBjdXJyZW50bHkgYWN0aXZlIHByb2ZpbGUsIGV0Yy5cclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIFdoeSBhcmUgd2UgZGVzZXJpYWxpemluZyB3aGVuIHRoZSBwcm9maWxlIGlzIGludmFsaWQgb3IgYmVsb25ncyB0b1xyXG4gICAgLy8gIGFub3RoZXIgZ2FtZSA/XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgZGVzZXJpYWxpemF0aW9uIGZ1bmN0aW9uIHNob3VsZCBiZSB1c2VkIHRvIGZpbHRlciBhbmQgaW5zZXJ0IHdhbnRlZCBkYXRhIGludG8gVm9ydGV4J3NcclxuICAvLyAgbG9hZE9yZGVyIGFwcGxpY2F0aW9uIHN0YXRlLCBvbmNlIHRoYXQncyBkb25lLCBWb3J0ZXggd2lsbCB0cmlnZ2VyIGEgc2VyaWFsaXphdGlvbiBldmVudFxyXG4gIC8vICB3aGljaCB3aWxsIGVuc3VyZSB0aGF0IHRoZSBkYXRhIGlzIHdyaXR0ZW4gdG8gdGhlIExPIGZpbGUuXHJcbiAgY29uc3QgY3VycmVudE1vZHNTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5wcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuXHJcbiAgLy8gd2Ugb25seSB3YW50IHRvIGluc2VydCBlbmFibGVkIG1vZHMuXHJcbiAgY29uc3QgZW5hYmxlZE1vZElkcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRNb2RzU3RhdGUpXHJcbiAgICAuZmlsdGVyKG1vZElkID0+IHV0aWwuZ2V0U2FmZShjdXJyZW50TW9kc1N0YXRlLCBbbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xyXG4gIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsb0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRhdGE6IElMb2FkT3JkZXJFbnRyeVtdID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XHJcblxyXG4gICAgLy8gVXNlciBtYXkgaGF2ZSBkaXNhYmxlZC9yZW1vdmVkIGEgbW9kIC0gd2UgbmVlZCB0byBmaWx0ZXIgb3V0IGFueSBleGlzdGluZ1xyXG4gICAgLy8gIGVudHJpZXMgZnJvbSB0aGUgZGF0YSB3ZSBwYXJzZWQuXHJcbiAgICBjb25zdCBmaWx0ZXJlZERhdGEgPSBkYXRhLmZpbHRlcihlbnRyeSA9PiBlbmFibGVkTW9kSWRzLmluY2x1ZGVzKGVudHJ5LmlkKSk7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgYWRkZWQgYW55IG5ldyBtb2RzLlxyXG4gICAgY29uc3QgZGlmZiA9IGVuYWJsZWRNb2RJZHMuZmlsdGVyKGlkID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMobW9kc1tpZF0/LnR5cGUpKVxyXG4gICAgICAmJiAoZmlsdGVyZWREYXRhLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBpZCkgPT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXHJcbiAgICBkaWZmLmZvckVhY2gobWlzc2luZ0VudHJ5ID0+IHtcclxuICAgICAgZmlsdGVyZWREYXRhLnB1c2goe1xyXG4gICAgICAgIGlkOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgbW9kSWQ6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IG1vZHNbbWlzc2luZ0VudHJ5XSAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW21pc3NpbmdFbnRyeV0pXHJcbiAgICAgICAgICA6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBdCB0aGlzIHBvaW50IHlvdSBtYXkgaGF2ZSBub3RpY2VkIHRoYXQgd2UncmUgbm90IHNldHRpbmcgdGhlIHByZWZpeFxyXG4gICAgLy8gIGZvciB0aGUgbmV3bHkgYWRkZWQgbW9kIGVudHJpZXMgLSB3ZSBjb3VsZCBjZXJ0YWlubHkgZG8gdGhhdCBoZXJlLFxyXG4gICAgLy8gIGJ1dCB0aGF0IHdvdWxkIHNpbXBseSBiZSBjb2RlIGR1cGxpY2F0aW9uIGFzIHdlIG5lZWQgdG8gYXNzaWduIHByZWZpeGVzXHJcbiAgICAvLyAgZHVyaW5nIHNlcmlhbGl6YXRpb24gYW55d2F5IChvdGhlcndpc2UgdXNlciBkcmFnLWRyb3AgaW50ZXJhY3Rpb25zIHdpbGxcclxuICAgIC8vICBub3QgYmUgc2F2ZWQpXHJcbiAgICByZXR1cm4gZmlsdGVyZWREYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGUocHJldjogTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogTG9hZE9yZGVyKTogUHJvbWlzZTxhbnk+IHtcclxuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxyXG4gIC8vICBhbmQgd2UgZG9uJ3Qgd2FudCB0byBhcHBseSBhbnkgcmVzdHJpY3Rpb25zIGVpdGhlciwgc28gd2UganVzdFxyXG4gIC8vICByZXR1cm4uXHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG4iXX0=