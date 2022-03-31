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
            ? Promise.resolve('')
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBNEI7QUFDNUIsMkNBQXNEO0FBRXRELHFDQUF5RDtBQUV6RCxpQ0FBNkU7QUFFN0UsU0FBUyxhQUFhLENBQUMsSUFBZSxFQUFFLE9BQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFLEdBQVU7SUFDbEUsT0FBTyxJQUFJLE9BQU8sQ0FBb0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDeEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLHlCQUF5QixFQUFFO1lBQ3ZELE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyx3REFBd0Q7a0JBQ2hGLGdGQUFnRjtrQkFDaEYsaUdBQWlHLENBQUM7U0FDdkcsRUFBRTtZQUNELEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzlDO2dCQUNFLEtBQUssRUFBRSxpQkFBaUI7Z0JBQ3hCLE1BQU0sRUFBRSxHQUFTLEVBQUU7b0JBQ2pCLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbkQsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFD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QU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1Qjs7Q0FDRjtBQS9ERCxrQ0ErREM7QUFFRCxTQUFzQixRQUFRLENBQUMsSUFBZSxFQUNmLE9BQWtCOztRQUkvQyxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQUE7QUFORCw0QkFNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBJTlZBTElEX0xPX01PRF9UWVBFUyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJUHJvcHMsIElTZXJpYWxpemFibGVEYXRhLCBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZW5zdXJlTE9GaWxlLCBnZW5Qcm9wcywgZ2V0UHJlZml4T2Zmc2V0LCBtYWtlUHJlZml4IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmZ1bmN0aW9uIGlzTE9EaWZmZXJlbnQocHJldjogTG9hZE9yZGVyLCBjdXJyZW50OiBMb2FkT3JkZXIpIHtcclxuICBjb25zdCBkaWZmID0gXy5kaWZmZXJlbmNlKHByZXYsIGN1cnJlbnQpO1xyXG4gIGlmIChkaWZmLmxlbmd0aCA+IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb3JydXB0TE9EaWFsb2cocHJvcHM6IElQcm9wcywgZmlsZVBhdGg6IHN0cmluZywgZXJyOiBFcnJvcikge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJTG9hZE9yZGVyRW50cnlbXT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgcHJvcHMuYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0NvcnJ1cHQgbG9hZCBvcmRlciBmaWxlJywge1xyXG4gICAgICBiYmNvZGU6IHByb3BzLmFwaS50cmFuc2xhdGUoJ1RoZSBsb2FkIG9yZGVyIGZpbGUgaXMgaW4gYSBjb3JydXB0IHN0YXRlIG9yIG1pc3NpbmcuICdcclxuICAgICAgICArICdZb3UgY2FuIHRyeSB0byBmaXggaXQgeW91cnNlbGYgb3IgVm9ydGV4IGNhbiByZWdlbmVyYXRlIHRoZSBmaWxlIGZvciB5b3UsIGJ1dCAnXHJcbiAgICAgICAgKyAndGhhdCBtYXkgcmVzdWx0IGluIGxvc3Mgb2YgZGF0YS4gV2lsbCBvbmx5IGFmZmVjdCBsb2FkIG9yZGVyIGl0ZW1zIHlvdSBhZGRlZCBtYW51YWxseSwgaWYgYW55KS4nKSxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gcmVqZWN0KGVycikgfSxcclxuICAgICAge1xyXG4gICAgICAgIGxhYmVsOiAnUmVnZW5lcmF0ZSBGaWxlJyxcclxuICAgICAgICBhY3Rpb246IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKS5jYXRjaChlcnIyID0+IG51bGwpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoW10pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICAvLyBNYWtlIHN1cmUgdGhlIExPIGZpbGUgaXMgY3JlYXRlZCBhbmQgcmVhZHkgdG8gYmUgd3JpdHRlbiB0by5cclxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQsIHByb2ZpbGVJZCwgcHJvcHMpO1xyXG4gIGNvbnN0IGZpbHRlcmVkTE8gPSBsb2FkT3JkZXIuZmlsdGVyKGxvID0+XHJcbiAgICAhSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMocHJvcHMubW9kcz8uW2xvPy5tb2RJZF0/LnR5cGUpKTtcclxuXHJcbiAgY29uc3Qgb2Zmc2V0ID0gZ2V0UHJlZml4T2Zmc2V0KGNvbnRleHQuYXBpKTtcclxuXHJcbiAgLy8gVGhlIGFycmF5IGF0IHRoaXMgcG9pbnQgaXMgc29ydGVkIGluIHRoZSBvcmRlciBpbiB3aGljaCB3ZSB3YW50IHRoZSBnYW1lIHRvIGxvYWQgdGhlXHJcbiAgLy8gIG1vZHMsIHdoaWNoIG1lYW5zIHdlIGNhbiBqdXN0IGxvb3AgdGhyb3VnaCBpdCBhbmQgdXNlIHRoZSBpbmRleCB0byBhc3NpZ24gdGhlIHByZWZpeC5cclxuICBjb25zdCBwcmVmaXhlZExPID0gZmlsdGVyZWRMTy5tYXAoKGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSwgaWR4OiBudW1iZXIpID0+IHtcclxuICAgIGNvbnN0IHByZWZpeCA9IG1ha2VQcmVmaXgoaWR4ICsgb2Zmc2V0KTtcclxuICAgIGNvbnN0IGRhdGE6IElTZXJpYWxpemFibGVEYXRhID0ge1xyXG4gICAgICBwcmVmaXgsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIHsgLi4ubG9FbnRyeSwgZGF0YSB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobG9GaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKCcnKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICBsZXQgc2F2ZWRMTzogSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcclxuICB0cnkge1xyXG4gICAgc2F2ZWRMTyA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgc2F2ZWRMTyA9IGF3YWl0IGNvcnJ1cHRMT0RpYWxvZyhwcm9wcywgbG9GaWxlUGF0aCwgZXJyKTtcclxuICB9XHJcblxyXG4gIGlmIChpc0xPRGlmZmVyZW50KHNhdmVkTE8sIHByZWZpeGVkTE8pKSB7XHJcbiAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9wcy5wcm9maWxlLmlkLCBwcmVmaXhlZExPKSk7XHJcbiAgfVxyXG5cclxuICAvLyBXcml0ZSB0aGUgcHJlZml4ZWQgTE8gdG8gZmlsZS5cclxuICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsb0ZpbGVQYXRoKS5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBhd2FpdCB1dGlsLndyaXRlRmlsZUF0b21pYyhsb0ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShwcmVmaXhlZExPKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBQcm9taXNlPExvYWRPcmRlcj4ge1xyXG4gIC8vIGdlblByb3BzIGlzIGEgc21hbGwgdXRpbGl0eSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIG9mdGVuIHJlLXVzZWQgb2JqZWN0c1xyXG4gIC8vICBzdWNoIGFzIHRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdGFsbGVkIE1vZHMsIFZvcnRleCdzIGFwcGxpY2F0aW9uIHN0YXRlLFxyXG4gIC8vICB0aGUgY3VycmVudGx5IGFjdGl2ZSBwcm9maWxlLCBldGMuXHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcz8ucHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBXaHkgYXJlIHdlIGRlc2VyaWFsaXppbmcgd2hlbiB0aGUgcHJvZmlsZSBpcyBpbnZhbGlkIG9yIGJlbG9uZ3MgdG9cclxuICAgIC8vICBhbm90aGVyIGdhbWUgP1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuXHJcbiAgLy8gVGhlIGRlc2VyaWFsaXphdGlvbiBmdW5jdGlvbiBzaG91bGQgYmUgdXNlZCB0byBmaWx0ZXIgYW5kIGluc2VydCB3YW50ZWQgZGF0YSBpbnRvIFZvcnRleCdzXHJcbiAgLy8gIGxvYWRPcmRlciBhcHBsaWNhdGlvbiBzdGF0ZSwgb25jZSB0aGF0J3MgZG9uZSwgVm9ydGV4IHdpbGwgdHJpZ2dlciBhIHNlcmlhbGl6YXRpb24gZXZlbnRcclxuICAvLyAgd2hpY2ggd2lsbCBlbnN1cmUgdGhhdCB0aGUgZGF0YSBpcyB3cml0dGVuIHRvIHRoZSBMTyBmaWxlLlxyXG4gIGNvbnN0IGN1cnJlbnRNb2RzU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvcHMucHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcblxyXG4gIC8vIHdlIG9ubHkgd2FudCB0byBpbnNlcnQgZW5hYmxlZCBtb2RzLlxyXG4gIGNvbnN0IGVuYWJsZWRNb2RJZHMgPSBPYmplY3Qua2V5cyhjdXJyZW50TW9kc1N0YXRlKVxyXG4gICAgLmZpbHRlcihtb2RJZCA9PiB1dGlsLmdldFNhZmUoY3VycmVudE1vZHNTdGF0ZSwgW21vZElkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUocHJvcHMuc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgbGV0IGRhdGE6IElMb2FkT3JkZXJFbnRyeVtdID0gW107XHJcbiAgbGV0IGxvRmlsZVBhdGg7XHJcbiAgdHJ5IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsb0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBkYXRhID0gYXdhaXQgY29ycnVwdExPRGlhbG9nKHByb3BzLCBsb0ZpbGVQYXRoLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgLy8gVXNlciBtYXkgaGF2ZSBkaXNhYmxlZC9yZW1vdmVkIGEgbW9kIC0gd2UgbmVlZCB0byBmaWx0ZXIgb3V0IGFueSBleGlzdGluZ1xyXG4gICAgLy8gIGVudHJpZXMgZnJvbSB0aGUgZGF0YSB3ZSBwYXJzZWQuXHJcbiAgICBjb25zdCBmaWx0ZXJlZERhdGEgPSBkYXRhLmZpbHRlcihlbnRyeSA9PiBlbmFibGVkTW9kSWRzLmluY2x1ZGVzKGVudHJ5LmlkKSk7XHJcbiAgICBjb25zdCBvZmZzZXQgPSBnZXRQcmVmaXhPZmZzZXQoY29udGV4dC5hcGkpO1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgYWRkZWQgYW55IG5ldyBtb2RzLlxyXG4gICAgY29uc3QgZGlmZiA9IGVuYWJsZWRNb2RJZHMuZmlsdGVyKGlkID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMobW9kc1tpZF0/LnR5cGUpKVxyXG4gICAgICAmJiAoZmlsdGVyZWREYXRhLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBpZCkgPT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXHJcbiAgICBkaWZmLmZvckVhY2goKG1pc3NpbmdFbnRyeSwgaWR4KSA9PiB7XHJcbiAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKHtcclxuICAgICAgICBpZDogbWlzc2luZ0VudHJ5LFxyXG4gICAgICAgIG1vZElkOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBuYW1lOiBtb2RzW21pc3NpbmdFbnRyeV0gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgPyB1dGlsLnJlbmRlck1vZE5hbWUobW9kc1ttaXNzaW5nRW50cnldKVxyXG4gICAgICAgICAgOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgcHJlZml4OiBtYWtlUHJlZml4KGlkeCArIGZpbHRlcmVkRGF0YS5sZW5ndGggKyBvZmZzZXQpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXQgdGhpcyBwb2ludCB5b3UgbWF5IGhhdmUgbm90aWNlZCB0aGF0IHdlJ3JlIG5vdCBzZXR0aW5nIHRoZSBwcmVmaXhcclxuICAgIC8vICBmb3IgdGhlIG5ld2x5IGFkZGVkIG1vZCBlbnRyaWVzIC0gd2UgY291bGQgY2VydGFpbmx5IGRvIHRoYXQgaGVyZSxcclxuICAgIC8vICBidXQgdGhhdCB3b3VsZCBzaW1wbHkgYmUgY29kZSBkdXBsaWNhdGlvbiBhcyB3ZSBuZWVkIHRvIGFzc2lnbiBwcmVmaXhlc1xyXG4gICAgLy8gIGR1cmluZyBzZXJpYWxpemF0aW9uIGFueXdheSAob3RoZXJ3aXNlIHVzZXIgZHJhZy1kcm9wIGludGVyYWN0aW9ucyB3aWxsXHJcbiAgICAvLyAgbm90IGJlIHNhdmVkKVxyXG4gICAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IExvYWRPcmRlcik6IFByb21pc2U8YW55PiB7XHJcbiAgLy8gTm90aGluZyB0byB2YWxpZGF0ZSByZWFsbHkgLSB0aGUgZ2FtZSBkb2VzIG5vdCByZWFkIG91ciBsb2FkIG9yZGVyIGZpbGVcclxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcclxuICAvLyAgcmV0dXJuLlxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuIl19