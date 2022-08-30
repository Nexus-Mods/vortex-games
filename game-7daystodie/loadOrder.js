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
const actions_1 = require("./actions");
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
function serialize(context, loadOrder, previousLO, profileId) {
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
        const batchedActions = [];
        batchedActions.push((0, actions_1.setPreviousLO)(props.profile.id, previousLO));
        vortex_api_1.util.batchDispatch(context.api.store, batchedActions);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBNEI7QUFDNUIsMkNBQXNEO0FBRXRELHVDQUEwQztBQUMxQyxxQ0FBeUQ7QUFFekQsaUNBQTZFO0FBRTdFLFNBQVMsYUFBYSxDQUFDLElBQWUsRUFBRSxPQUFrQjtJQUN4RCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN6QyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ25CLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFhLEVBQUUsUUFBZ0IsRUFBRSxHQUFVO0lBQ2xFLE9BQU8sSUFBSSxPQUFPLENBQW9CLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3hELEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSx5QkFBeUIsRUFBRTtZQUN2RCxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsd0RBQXdEO2tCQUNoRixnRkFBZ0Y7a0JBQ2hGLGlHQUFpRyxDQUFDO1NBQ3ZHLEVBQUU7WUFDRCxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM5QztnQkFDRSxLQUFLLEVBQUUsaUJBQWlCO2dCQUN4QixNQUFNLEVBQUUsR0FBUyxFQUFFO29CQUNqQixNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ25ELE9BQU8sT0FBTyxD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QU9ILE9BQU8sWUFBWSxDQUFDO1NBQ3JCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7O0NBQ0Y7QUEvREQsa0NBK0RDO0FBRUQsU0FBc0IsUUFBUSxDQUFDLElBQWUsRUFDZixPQUFrQjs7UUFJL0MsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUFBO0FBTkQsNEJBTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgc2V0UHJldmlvdXNMTyB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IEdBTUVfSUQsIElOVkFMSURfTE9fTU9EX1RZUEVTIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElQcm9wcywgSVNlcmlhbGl6YWJsZURhdGEsIExvYWRPcmRlciB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBlbnN1cmVMT0ZpbGUsIGdlblByb3BzLCBnZXRQcmVmaXhPZmZzZXQsIG1ha2VQcmVmaXggfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZnVuY3Rpb24gaXNMT0RpZmZlcmVudChwcmV2OiBMb2FkT3JkZXIsIGN1cnJlbnQ6IExvYWRPcmRlcikge1xyXG4gIGNvbnN0IGRpZmYgPSBfLmRpZmZlcmVuY2UocHJldiwgY3VycmVudCk7XHJcbiAgaWYgKGRpZmYubGVuZ3RoID4gMCkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvcnJ1cHRMT0RpYWxvZyhwcm9wczogSVByb3BzLCBmaWxlUGF0aDogc3RyaW5nLCBlcnI6IEVycm9yKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElMb2FkT3JkZXJFbnRyeVtdPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBwcm9wcy5hcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnQ29ycnVwdCBsb2FkIG9yZGVyIGZpbGUnLCB7XHJcbiAgICAgIGJiY29kZTogcHJvcHMuYXBpLnRyYW5zbGF0ZSgnVGhlIGxvYWQgb3JkZXIgZmlsZSBpcyBpbiBhIGNvcnJ1cHQgc3RhdGUgb3IgbWlzc2luZy4gJ1xyXG4gICAgICAgICsgJ1lvdSBjYW4gdHJ5IHRvIGZpeCBpdCB5b3Vyc2VsZiBvciBWb3J0ZXggY2FuIHJlZ2VuZXJhdGUgdGhlIGZpbGUgZm9yIHlvdSwgYnV0ICdcclxuICAgICAgICArICd0aGF0IG1heSByZXN1bHQgaW4gbG9zcyBvZiBkYXRhLiBXaWxsIG9ubHkgYWZmZWN0IGxvYWQgb3JkZXIgaXRlbXMgeW91IGFkZGVkIG1hbnVhbGx5LCBpZiBhbnkpLicpLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiByZWplY3QoZXJyKSB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbGFiZWw6ICdSZWdlbmVyYXRlIEZpbGUnLFxyXG4gICAgICAgIGFjdGlvbjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpLmNhdGNoKGVycjIgPT4gbnVsbCk7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShbXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VyaWFsaXplKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRPcmRlcjogTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzTE86IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICAvLyBNYWtlIHN1cmUgdGhlIExPIGZpbGUgaXMgY3JlYXRlZCBhbmQgcmVhZHkgdG8gYmUgd3JpdHRlbiB0by5cclxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQsIHByb2ZpbGVJZCwgcHJvcHMpO1xyXG4gIGNvbnN0IGZpbHRlcmVkTE8gPSBsb2FkT3JkZXIuZmlsdGVyKGxvID0+XHJcbiAgICAhSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMocHJvcHMubW9kcz8uW2xvPy5tb2RJZF0/LnR5cGUpKTtcclxuXHJcbiAgY29uc3Qgb2Zmc2V0ID0gZ2V0UHJlZml4T2Zmc2V0KGNvbnRleHQuYXBpKTtcclxuXHJcbiAgLy8gVGhlIGFycmF5IGF0IHRoaXMgcG9pbnQgaXMgc29ydGVkIGluIHRoZSBvcmRlciBpbiB3aGljaCB3ZSB3YW50IHRoZSBnYW1lIHRvIGxvYWQgdGhlXHJcbiAgLy8gIG1vZHMsIHdoaWNoIG1lYW5zIHdlIGNhbiBqdXN0IGxvb3AgdGhyb3VnaCBpdCBhbmQgdXNlIHRoZSBpbmRleCB0byBhc3NpZ24gdGhlIHByZWZpeC5cclxuICBjb25zdCBwcmVmaXhlZExPID0gZmlsdGVyZWRMTy5tYXAoKGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSwgaWR4OiBudW1iZXIpID0+IHtcclxuICAgIGNvbnN0IHByZWZpeCA9IG1ha2VQcmVmaXgoaWR4ICsgb2Zmc2V0KTtcclxuICAgIGNvbnN0IGRhdGE6IElTZXJpYWxpemFibGVEYXRhID0ge1xyXG4gICAgICBwcmVmaXgsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIHsgLi4ubG9FbnRyeSwgZGF0YSB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobG9GaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKCdbXScpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcblxyXG4gIGxldCBzYXZlZExPOiBJTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBzYXZlZExPID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBzYXZlZExPID0gYXdhaXQgY29ycnVwdExPRGlhbG9nKHByb3BzLCBsb0ZpbGVQYXRoLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgYmF0Y2hlZEFjdGlvbnMgPSBbXTtcclxuICAvLyBpZiAoaXNMT0RpZmZlcmVudChzYXZlZExPLCBwcmVmaXhlZExPKSkge1xyXG4gIC8vICAgYmF0Y2hlZEFjdGlvbnMucHVzaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9wcy5wcm9maWxlLmlkLCBwcmVmaXhlZExPKSk7XHJcbiAgLy8gfVxyXG4gIGJhdGNoZWRBY3Rpb25zLnB1c2goc2V0UHJldmlvdXNMTyhwcm9wcy5wcm9maWxlLmlkLCBwcmV2aW91c0xPKSk7XHJcbiAgdXRpbC5iYXRjaERpc3BhdGNoKGNvbnRleHQuYXBpLnN0b3JlLCBiYXRjaGVkQWN0aW9ucyk7XHJcblxyXG4gIC8vIFdyaXRlIHRoZSBwcmVmaXhlZCBMTyB0byBmaWxlLlxyXG4gIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxvRmlsZVBhdGgpLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGF3YWl0IHV0aWwud3JpdGVGaWxlQXRvbWljKGxvRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHByZWZpeGVkTE8pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8TG9hZE9yZGVyPiB7XHJcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXHJcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXHJcbiAgLy8gIHRoZSBjdXJyZW50bHkgYWN0aXZlIHByb2ZpbGUsIGV0Yy5cclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIFdoeSBhcmUgd2UgZGVzZXJpYWxpemluZyB3aGVuIHRoZSBwcm9maWxlIGlzIGludmFsaWQgb3IgYmVsb25ncyB0b1xyXG4gICAgLy8gIGFub3RoZXIgZ2FtZSA/XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgZGVzZXJpYWxpemF0aW9uIGZ1bmN0aW9uIHNob3VsZCBiZSB1c2VkIHRvIGZpbHRlciBhbmQgaW5zZXJ0IHdhbnRlZCBkYXRhIGludG8gVm9ydGV4J3NcclxuICAvLyAgbG9hZE9yZGVyIGFwcGxpY2F0aW9uIHN0YXRlLCBvbmNlIHRoYXQncyBkb25lLCBWb3J0ZXggd2lsbCB0cmlnZ2VyIGEgc2VyaWFsaXphdGlvbiBldmVudFxyXG4gIC8vICB3aGljaCB3aWxsIGVuc3VyZSB0aGF0IHRoZSBkYXRhIGlzIHdyaXR0ZW4gdG8gdGhlIExPIGZpbGUuXHJcbiAgY29uc3QgY3VycmVudE1vZHNTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5wcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuXHJcbiAgLy8gd2Ugb25seSB3YW50IHRvIGluc2VydCBlbmFibGVkIG1vZHMuXHJcbiAgY29uc3QgZW5hYmxlZE1vZElkcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRNb2RzU3RhdGUpXHJcbiAgICAuZmlsdGVyKG1vZElkID0+IHV0aWwuZ2V0U2FmZShjdXJyZW50TW9kc1N0YXRlLCBbbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBsZXQgZGF0YTogSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcclxuICBsZXQgbG9GaWxlUGF0aDtcclxuICB0cnkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcclxuICAgICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGRhdGEgPSBhd2FpdCBjb3JydXB0TE9EaWFsb2cocHJvcHMsIGxvRmlsZVBhdGgsIGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBVc2VyIG1heSBoYXZlIGRpc2FibGVkL3JlbW92ZWQgYSBtb2QgLSB3ZSBuZWVkIHRvIGZpbHRlciBvdXQgYW55IGV4aXN0aW5nXHJcbiAgICAvLyAgZW50cmllcyBmcm9tIHRoZSBkYXRhIHdlIHBhcnNlZC5cclxuICAgIGNvbnN0IGZpbHRlcmVkRGF0YSA9IGRhdGEuZmlsdGVyKGVudHJ5ID0+IGVuYWJsZWRNb2RJZHMuaW5jbHVkZXMoZW50cnkuaWQpKTtcclxuICAgIGNvbnN0IG9mZnNldCA9IGdldFByZWZpeE9mZnNldChjb250ZXh0LmFwaSk7XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgdXNlciBhZGRlZCBhbnkgbmV3IG1vZHMuXHJcbiAgICBjb25zdCBkaWZmID0gZW5hYmxlZE1vZElkcy5maWx0ZXIoaWQgPT4gKCFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhtb2RzW2lkXT8udHlwZSkpXHJcbiAgICAgICYmIChmaWx0ZXJlZERhdGEuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IGlkKSA9PT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cclxuICAgIGRpZmYuZm9yRWFjaCgobWlzc2luZ0VudHJ5LCBpZHgpID0+IHtcclxuICAgICAgZmlsdGVyZWREYXRhLnB1c2goe1xyXG4gICAgICAgIGlkOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgbW9kSWQ6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IG1vZHNbbWlzc2luZ0VudHJ5XSAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW21pc3NpbmdFbnRyeV0pXHJcbiAgICAgICAgICA6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBwcmVmaXg6IG1ha2VQcmVmaXgoaWR4ICsgZmlsdGVyZWREYXRhLmxlbmd0aCArIG9mZnNldCksXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBdCB0aGlzIHBvaW50IHlvdSBtYXkgaGF2ZSBub3RpY2VkIHRoYXQgd2UncmUgbm90IHNldHRpbmcgdGhlIHByZWZpeFxyXG4gICAgLy8gIGZvciB0aGUgbmV3bHkgYWRkZWQgbW9kIGVudHJpZXMgLSB3ZSBjb3VsZCBjZXJ0YWlubHkgZG8gdGhhdCBoZXJlLFxyXG4gICAgLy8gIGJ1dCB0aGF0IHdvdWxkIHNpbXBseSBiZSBjb2RlIGR1cGxpY2F0aW9uIGFzIHdlIG5lZWQgdG8gYXNzaWduIHByZWZpeGVzXHJcbiAgICAvLyAgZHVyaW5nIHNlcmlhbGl6YXRpb24gYW55d2F5IChvdGhlcndpc2UgdXNlciBkcmFnLWRyb3AgaW50ZXJhY3Rpb25zIHdpbGxcclxuICAgIC8vICBub3QgYmUgc2F2ZWQpXHJcbiAgICByZXR1cm4gZmlsdGVyZWREYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGUocHJldjogTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogTG9hZE9yZGVyKTogUHJvbWlzZTxhbnk+IHtcclxuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxyXG4gIC8vICBhbmQgd2UgZG9uJ3Qgd2FudCB0byBhcHBseSBhbnkgcmVzdHJpY3Rpb25zIGVpdGhlciwgc28gd2UganVzdFxyXG4gIC8vICByZXR1cm4uXHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG4iXX0=