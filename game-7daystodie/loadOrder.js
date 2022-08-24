"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const _ = __importStar(require("lodash"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
function isLODifferent(prev, current) {
    const diff = _.difference(prev, current);
    if (diff.length > 0) {
        return true;
    }
    return false;
}
function corruptLODialog(props, filePath, err) {
    return new Promise((resolve, reject) => {
        props.api.showDialog('error', 'Corrupt load order file', {
            bbcode: props.api.translate('The load order file is in a corrupt state or missing. '
                + 'You can try to fix it yourself or Vortex can regenerate the file for you, but '
                + 'that may result in loss of data. Will only affect load order items you added manually, if any).'),
        }, [
            { label: 'Cancel', action: () => reject(err) },
            {
                label: 'Regenerate File',
                action: () => __awaiter(this, void 0, void 0, function* () {
                    yield vortex_api_1.fs.removeAsync(filePath).catch(err2 => null);
                    return resolve([]);
                }),
            },
        ]);
    });
}
function serialize(context, loadOrder, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = (0, util_1.genProps)(context);
        if (props === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('invalid props'));
        }
        const loFilePath = yield (0, util_1.ensureLOFile)(context, profileId, props);
        const filteredLO = loadOrder.filter(lo => { var _a, _b; return !common_1.INVALID_LO_MOD_TYPES.includes((_b = (_a = props.mods) === null || _a === void 0 ? void 0 : _a[lo === null || lo === void 0 ? void 0 : lo.modId]) === null || _b === void 0 ? void 0 : _b.type); });
        const offset = (0, util_1.getPrefixOffset)(context.api);
        const prefixedLO = filteredLO.map((loEntry, idx) => {
            const prefix = (0, util_1.makePrefix)(idx + offset);
            const data = {
                prefix,
            };
            return Object.assign(Object.assign({}, loEntry), { data });
        });
        const fileData = yield vortex_api_1.fs.readFileAsync(loFilePath, { encoding: 'utf8' })
            .catch(err => (err.code === 'ENOENT')
            ? Promise.resolve('[]')
            : Promise.reject(err));
        let savedLO = [];
        try {
            savedLO = JSON.parse(fileData);
        }
        catch (err) {
            savedLO = yield corruptLODialog(props, loFilePath, err);
        }
        if (isLODifferent(savedLO, prefixedLO)) {
            context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(props.profile.id, prefixedLO));
        }
        yield vortex_api_1.fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
        yield vortex_api_1.util.writeFileAtomic(loFilePath, JSON.stringify(prefixedLO));
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
        let data = [];
        let loFilePath;
        try {
            try {
                loFilePath = yield (0, util_1.ensureLOFile)(context);
                const fileData = yield vortex_api_1.fs.readFileAsync(loFilePath, { encoding: 'utf8' });
                data = JSON.parse(fileData);
            }
            catch (err) {
                data = yield corruptLODialog(props, loFilePath, err);
            }
            const filteredData = data.filter(entry => enabledModIds.includes(entry.id));
            const offset = (0, util_1.getPrefixOffset)(context.api);
            const diff = enabledModIds.filter(id => {
                var _a;
                return (!common_1.INVALID_LO_MOD_TYPES.includes((_a = mods[id]) === null || _a === void 0 ? void 0 : _a.type))
                    && (filteredData.find(loEntry => loEntry.id === id) === undefined);
            });
            diff.forEach((missingEntry, idx) => {
                filteredData.push({
                    id: missingEntry,
                    modId: missingEntry,
                    enabled: true,
                    name: mods[missingEntry] !== undefined
                        ? vortex_api_1.util.renderModName(mods[missingEntry])
                        : missingEntry,
                    data: {
                        prefix: (0, util_1.makePrefix)(idx + filteredData.length + offset),
                    },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBNEI7QUFDNUIsMkNBQXNEO0FBRXRELHFDQUF5RDtBQUV6RCxpQ0FBNkU7QUFFN0UsU0FBUyxhQUFhLENBQUMsSUFBZSxFQUFFLE9BQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFLEdBQVU7SUFDbEUsT0FBTyxJQUFJLE9BQU8sQ0FBb0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDeEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLHlCQUF5QixFQUFFO1lBQ3ZELE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyx3REFBd0Q7a0JBQ2hGLGdGQUFnRjtrQkFDaEYsaUdBQWlHLENBQUM7U0FDdkcsRUFBRTtZQUNELEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzlDO2dCQUNFLEtBQUssRUFBRSxpQkFBaUI7Z0JBQ3hCLE1BQU0sRUFBRSxHQUFTLEVBQUU7b0JBQ2pCLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbkQsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFD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QU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1Qjs7Q0FDRjtBQS9ERCxrQ0ErREM7QUFFRCxTQUFzQixRQUFRLENBQUMsSUFBZSxFQUNmLE9BQWtCOztRQUkvQyxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQUE7QUFORCw0QkFNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBJTlZBTElEX0xPX01PRF9UWVBFUyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJUHJvcHMsIElTZXJpYWxpemFibGVEYXRhLCBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZW5zdXJlTE9GaWxlLCBnZW5Qcm9wcywgZ2V0UHJlZml4T2Zmc2V0LCBtYWtlUHJlZml4IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmZ1bmN0aW9uIGlzTE9EaWZmZXJlbnQocHJldjogTG9hZE9yZGVyLCBjdXJyZW50OiBMb2FkT3JkZXIpIHtcclxuICBjb25zdCBkaWZmID0gXy5kaWZmZXJlbmNlKHByZXYsIGN1cnJlbnQpO1xyXG4gIGlmIChkaWZmLmxlbmd0aCA+IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb3JydXB0TE9EaWFsb2cocHJvcHM6IElQcm9wcywgZmlsZVBhdGg6IHN0cmluZywgZXJyOiBFcnJvcikge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJTG9hZE9yZGVyRW50cnlbXT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgcHJvcHMuYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0NvcnJ1cHQgbG9hZCBvcmRlciBmaWxlJywge1xyXG4gICAgICBiYmNvZGU6IHByb3BzLmFwaS50cmFuc2xhdGUoJ1RoZSBsb2FkIG9yZGVyIGZpbGUgaXMgaW4gYSBjb3JydXB0IHN0YXRlIG9yIG1pc3NpbmcuICdcclxuICAgICAgICArICdZb3UgY2FuIHRyeSB0byBmaXggaXQgeW91cnNlbGYgb3IgVm9ydGV4IGNhbiByZWdlbmVyYXRlIHRoZSBmaWxlIGZvciB5b3UsIGJ1dCAnXHJcbiAgICAgICAgKyAndGhhdCBtYXkgcmVzdWx0IGluIGxvc3Mgb2YgZGF0YS4gV2lsbCBvbmx5IGFmZmVjdCBsb2FkIG9yZGVyIGl0ZW1zIHlvdSBhZGRlZCBtYW51YWxseSwgaWYgYW55KS4nKSxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gcmVqZWN0KGVycikgfSxcclxuICAgICAge1xyXG4gICAgICAgIGxhYmVsOiAnUmVnZW5lcmF0ZSBGaWxlJyxcclxuICAgICAgICBhY3Rpb246IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKS5jYXRjaChlcnIyID0+IG51bGwpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoW10pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICAvLyBNYWtlIHN1cmUgdGhlIExPIGZpbGUgaXMgY3JlYXRlZCBhbmQgcmVhZHkgdG8gYmUgd3JpdHRlbiB0by5cclxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQsIHByb2ZpbGVJZCwgcHJvcHMpO1xyXG4gIGNvbnN0IGZpbHRlcmVkTE8gPSBsb2FkT3JkZXIuZmlsdGVyKGxvID0+XHJcbiAgICAhSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMocHJvcHMubW9kcz8uW2xvPy5tb2RJZF0/LnR5cGUpKTtcclxuXHJcbiAgY29uc3Qgb2Zmc2V0ID0gZ2V0UHJlZml4T2Zmc2V0KGNvbnRleHQuYXBpKTtcclxuXHJcbiAgLy8gVGhlIGFycmF5IGF0IHRoaXMgcG9pbnQgaXMgc29ydGVkIGluIHRoZSBvcmRlciBpbiB3aGljaCB3ZSB3YW50IHRoZSBnYW1lIHRvIGxvYWQgdGhlXHJcbiAgLy8gIG1vZHMsIHdoaWNoIG1lYW5zIHdlIGNhbiBqdXN0IGxvb3AgdGhyb3VnaCBpdCBhbmQgdXNlIHRoZSBpbmRleCB0byBhc3NpZ24gdGhlIHByZWZpeC5cclxuICBjb25zdCBwcmVmaXhlZExPID0gZmlsdGVyZWRMTy5tYXAoKGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSwgaWR4OiBudW1iZXIpID0+IHtcclxuICAgIGNvbnN0IHByZWZpeCA9IG1ha2VQcmVmaXgoaWR4ICsgb2Zmc2V0KTtcclxuICAgIGNvbnN0IGRhdGE6IElTZXJpYWxpemFibGVEYXRhID0ge1xyXG4gICAgICBwcmVmaXgsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIHsgLi4ubG9FbnRyeSwgZGF0YSB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobG9GaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKCdbXScpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcblxyXG4gIGxldCBzYXZlZExPOiBJTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBzYXZlZExPID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBzYXZlZExPID0gYXdhaXQgY29ycnVwdExPRGlhbG9nKHByb3BzLCBsb0ZpbGVQYXRoLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGlzTE9EaWZmZXJlbnQoc2F2ZWRMTywgcHJlZml4ZWRMTykpIHtcclxuICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb3BzLnByb2ZpbGUuaWQsIHByZWZpeGVkTE8pKTtcclxuICB9XHJcblxyXG4gIC8vIFdyaXRlIHRoZSBwcmVmaXhlZCBMTyB0byBmaWxlLlxyXG4gIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxvRmlsZVBhdGgpLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGF3YWl0IHV0aWwud3JpdGVGaWxlQXRvbWljKGxvRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHByZWZpeGVkTE8pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8TG9hZE9yZGVyPiB7XHJcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXHJcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXHJcbiAgLy8gIHRoZSBjdXJyZW50bHkgYWN0aXZlIHByb2ZpbGUsIGV0Yy5cclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIFdoeSBhcmUgd2UgZGVzZXJpYWxpemluZyB3aGVuIHRoZSBwcm9maWxlIGlzIGludmFsaWQgb3IgYmVsb25ncyB0b1xyXG4gICAgLy8gIGFub3RoZXIgZ2FtZSA/XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgZGVzZXJpYWxpemF0aW9uIGZ1bmN0aW9uIHNob3VsZCBiZSB1c2VkIHRvIGZpbHRlciBhbmQgaW5zZXJ0IHdhbnRlZCBkYXRhIGludG8gVm9ydGV4J3NcclxuICAvLyAgbG9hZE9yZGVyIGFwcGxpY2F0aW9uIHN0YXRlLCBvbmNlIHRoYXQncyBkb25lLCBWb3J0ZXggd2lsbCB0cmlnZ2VyIGEgc2VyaWFsaXphdGlvbiBldmVudFxyXG4gIC8vICB3aGljaCB3aWxsIGVuc3VyZSB0aGF0IHRoZSBkYXRhIGlzIHdyaXR0ZW4gdG8gdGhlIExPIGZpbGUuXHJcbiAgY29uc3QgY3VycmVudE1vZHNTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5wcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuXHJcbiAgLy8gd2Ugb25seSB3YW50IHRvIGluc2VydCBlbmFibGVkIG1vZHMuXHJcbiAgY29uc3QgZW5hYmxlZE1vZElkcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRNb2RzU3RhdGUpXHJcbiAgICAuZmlsdGVyKG1vZElkID0+IHV0aWwuZ2V0U2FmZShjdXJyZW50TW9kc1N0YXRlLCBbbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBsZXQgZGF0YTogSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcclxuICBsZXQgbG9GaWxlUGF0aDtcclxuICB0cnkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcclxuICAgICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGRhdGEgPSBhd2FpdCBjb3JydXB0TE9EaWFsb2cocHJvcHMsIGxvRmlsZVBhdGgsIGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBVc2VyIG1heSBoYXZlIGRpc2FibGVkL3JlbW92ZWQgYSBtb2QgLSB3ZSBuZWVkIHRvIGZpbHRlciBvdXQgYW55IGV4aXN0aW5nXHJcbiAgICAvLyAgZW50cmllcyBmcm9tIHRoZSBkYXRhIHdlIHBhcnNlZC5cclxuICAgIGNvbnN0IGZpbHRlcmVkRGF0YSA9IGRhdGEuZmlsdGVyKGVudHJ5ID0+IGVuYWJsZWRNb2RJZHMuaW5jbHVkZXMoZW50cnkuaWQpKTtcclxuICAgIGNvbnN0IG9mZnNldCA9IGdldFByZWZpeE9mZnNldChjb250ZXh0LmFwaSk7XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgdXNlciBhZGRlZCBhbnkgbmV3IG1vZHMuXHJcbiAgICBjb25zdCBkaWZmID0gZW5hYmxlZE1vZElkcy5maWx0ZXIoaWQgPT4gKCFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhtb2RzW2lkXT8udHlwZSkpXHJcbiAgICAgICYmIChmaWx0ZXJlZERhdGEuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IGlkKSA9PT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cclxuICAgIGRpZmYuZm9yRWFjaCgobWlzc2luZ0VudHJ5LCBpZHgpID0+IHtcclxuICAgICAgZmlsdGVyZWREYXRhLnB1c2goe1xyXG4gICAgICAgIGlkOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgbW9kSWQ6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IG1vZHNbbWlzc2luZ0VudHJ5XSAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW21pc3NpbmdFbnRyeV0pXHJcbiAgICAgICAgICA6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBwcmVmaXg6IG1ha2VQcmVmaXgoaWR4ICsgZmlsdGVyZWREYXRhLmxlbmd0aCArIG9mZnNldCksXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBdCB0aGlzIHBvaW50IHlvdSBtYXkgaGF2ZSBub3RpY2VkIHRoYXQgd2UncmUgbm90IHNldHRpbmcgdGhlIHByZWZpeFxyXG4gICAgLy8gIGZvciB0aGUgbmV3bHkgYWRkZWQgbW9kIGVudHJpZXMgLSB3ZSBjb3VsZCBjZXJ0YWlubHkgZG8gdGhhdCBoZXJlLFxyXG4gICAgLy8gIGJ1dCB0aGF0IHdvdWxkIHNpbXBseSBiZSBjb2RlIGR1cGxpY2F0aW9uIGFzIHdlIG5lZWQgdG8gYXNzaWduIHByZWZpeGVzXHJcbiAgICAvLyAgZHVyaW5nIHNlcmlhbGl6YXRpb24gYW55d2F5IChvdGhlcndpc2UgdXNlciBkcmFnLWRyb3AgaW50ZXJhY3Rpb25zIHdpbGxcclxuICAgIC8vICBub3QgYmUgc2F2ZWQpXHJcbiAgICByZXR1cm4gZmlsdGVyZWREYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGUocHJldjogTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogTG9hZE9yZGVyKTogUHJvbWlzZTxhbnk+IHtcclxuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxyXG4gIC8vICBhbmQgd2UgZG9uJ3Qgd2FudCB0byBhcHBseSBhbnkgcmVzdHJpY3Rpb25zIGVpdGhlciwgc28gd2UganVzdFxyXG4gIC8vICByZXR1cm4uXHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG4iXX0=