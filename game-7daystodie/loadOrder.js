"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.serialize = serialize;
exports.deserialize = deserialize;
exports.validate = validate;
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
function deserialize(context) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function validate(prev, current) {
    return __awaiter(this, void 0, void 0, function* () {
        return undefined;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0NBLDhCQWlEQztBQUVELGtDQStEQztBQUVELDRCQU1DO0FBOUpELDBDQUE0QjtBQUM1QiwyQ0FBc0Q7QUFFdEQsdUNBQTBDO0FBQzFDLHFDQUF5RDtBQUV6RCxpQ0FBNkU7QUFFN0UsU0FBUyxhQUFhLENBQUMsSUFBZSxFQUFFLE9BQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNwQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFhLEVBQUUsUUFBZ0IsRUFBRSxHQUFVO0lBQ2xFLE9BQU8sSUFBSSxPQUFPLENBQW9CLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3hELEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSx5QkFBeUIsRUFBRTtZQUN2RCxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsd0RBQXdEO2tCQUNoRixnRkFBZ0Y7a0JBQ2hGLGlHQUFpRyxDQUFDO1NBQ3ZHLEVBQUU7WUFDRCxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM5QztnQkFDRSxLQUFLLEVBQUUsaUJBQWlCO2dCQUN4QixNQUFNLEVBQUUsR0FBUyxFQUFFO29CQUNqQixNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsS0FB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SixNQUFNLEVBQUUsSUFBQSxpQkFBVSxFQUFDLEdBQUcsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztxQkFDdkQ7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFPSCxPQUFPLFlBQVksQ0FBQztRQUN0QixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBc0IsUUFBUSxDQUFDLElBQWUsRUFDZixPQUFrQjs7UUFJL0MsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IHNldFByZXZpb3VzTE8gfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyBHQU1FX0lELCBJTlZBTElEX0xPX01PRF9UWVBFUyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJUHJvcHMsIElTZXJpYWxpemFibGVEYXRhLCBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZW5zdXJlTE9GaWxlLCBnZW5Qcm9wcywgZ2V0UHJlZml4T2Zmc2V0LCBtYWtlUHJlZml4IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmZ1bmN0aW9uIGlzTE9EaWZmZXJlbnQocHJldjogTG9hZE9yZGVyLCBjdXJyZW50OiBMb2FkT3JkZXIpIHtcclxuICBjb25zdCBkaWZmID0gXy5kaWZmZXJlbmNlKHByZXYsIGN1cnJlbnQpO1xyXG4gIGlmIChkaWZmLmxlbmd0aCA+IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb3JydXB0TE9EaWFsb2cocHJvcHM6IElQcm9wcywgZmlsZVBhdGg6IHN0cmluZywgZXJyOiBFcnJvcikge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJTG9hZE9yZGVyRW50cnlbXT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgcHJvcHMuYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0NvcnJ1cHQgbG9hZCBvcmRlciBmaWxlJywge1xyXG4gICAgICBiYmNvZGU6IHByb3BzLmFwaS50cmFuc2xhdGUoJ1RoZSBsb2FkIG9yZGVyIGZpbGUgaXMgaW4gYSBjb3JydXB0IHN0YXRlIG9yIG1pc3NpbmcuICdcclxuICAgICAgICArICdZb3UgY2FuIHRyeSB0byBmaXggaXQgeW91cnNlbGYgb3IgVm9ydGV4IGNhbiByZWdlbmVyYXRlIHRoZSBmaWxlIGZvciB5b3UsIGJ1dCAnXHJcbiAgICAgICAgKyAndGhhdCBtYXkgcmVzdWx0IGluIGxvc3Mgb2YgZGF0YS4gV2lsbCBvbmx5IGFmZmVjdCBsb2FkIG9yZGVyIGl0ZW1zIHlvdSBhZGRlZCBtYW51YWxseSwgaWYgYW55KS4nKSxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gcmVqZWN0KGVycikgfSxcclxuICAgICAge1xyXG4gICAgICAgIGxhYmVsOiAnUmVnZW5lcmF0ZSBGaWxlJyxcclxuICAgICAgICBhY3Rpb246IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKS5jYXRjaChlcnIyID0+IG51bGwpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoW10pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c0xPOiBMb2FkT3JkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdpbnZhbGlkIHByb3BzJykpO1xyXG4gIH1cclxuXHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBMTyBmaWxlIGlzIGNyZWF0ZWQgYW5kIHJlYWR5IHRvIGJlIHdyaXR0ZW4gdG8uXHJcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0LCBwcm9maWxlSWQsIHByb3BzKTtcclxuICBjb25zdCBmaWx0ZXJlZExPID0gbG9hZE9yZGVyLmZpbHRlcihsbyA9PlxyXG4gICAgIUlOVkFMSURfTE9fTU9EX1RZUEVTLmluY2x1ZGVzKHByb3BzLm1vZHM/Lltsbz8ubW9kSWRdPy50eXBlKSk7XHJcblxyXG4gIGNvbnN0IG9mZnNldCA9IGdldFByZWZpeE9mZnNldChjb250ZXh0LmFwaSk7XHJcblxyXG4gIC8vIFRoZSBhcnJheSBhdCB0aGlzIHBvaW50IGlzIHNvcnRlZCBpbiB0aGUgb3JkZXIgaW4gd2hpY2ggd2Ugd2FudCB0aGUgZ2FtZSB0byBsb2FkIHRoZVxyXG4gIC8vICBtb2RzLCB3aGljaCBtZWFucyB3ZSBjYW4ganVzdCBsb29wIHRocm91Z2ggaXQgYW5kIHVzZSB0aGUgaW5kZXggdG8gYXNzaWduIHRoZSBwcmVmaXguXHJcbiAgY29uc3QgcHJlZml4ZWRMTyA9IGZpbHRlcmVkTE8ubWFwKChsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnksIGlkeDogbnVtYmVyKSA9PiB7XHJcbiAgICBjb25zdCBwcmVmaXggPSBtYWtlUHJlZml4KGlkeCArIG9mZnNldCk7XHJcbiAgICBjb25zdCBkYXRhOiBJU2VyaWFsaXphYmxlRGF0YSA9IHtcclxuICAgICAgcHJlZml4LFxyXG4gICAgfTtcclxuICAgIHJldHVybiB7IC4uLmxvRW50cnksIGRhdGEgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgnW10nKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICBsZXQgc2F2ZWRMTzogSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcclxuICB0cnkge1xyXG4gICAgc2F2ZWRMTyA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgc2F2ZWRMTyA9IGF3YWl0IGNvcnJ1cHRMT0RpYWxvZyhwcm9wcywgbG9GaWxlUGF0aCwgZXJyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGJhdGNoZWRBY3Rpb25zID0gW107XHJcbiAgLy8gaWYgKGlzTE9EaWZmZXJlbnQoc2F2ZWRMTywgcHJlZml4ZWRMTykpIHtcclxuICAvLyAgIGJhdGNoZWRBY3Rpb25zLnB1c2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvcHMucHJvZmlsZS5pZCwgcHJlZml4ZWRMTykpO1xyXG4gIC8vIH1cclxuICBiYXRjaGVkQWN0aW9ucy5wdXNoKHNldFByZXZpb3VzTE8ocHJvcHMucHJvZmlsZS5pZCwgcHJldmlvdXNMTykpO1xyXG4gIHV0aWwuYmF0Y2hEaXNwYXRjaChjb250ZXh0LmFwaS5zdG9yZSwgYmF0Y2hlZEFjdGlvbnMpO1xyXG5cclxuICAvLyBXcml0ZSB0aGUgcHJlZml4ZWQgTE8gdG8gZmlsZS5cclxuICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsb0ZpbGVQYXRoKS5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBhd2FpdCB1dGlsLndyaXRlRmlsZUF0b21pYyhsb0ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShwcmVmaXhlZExPKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBQcm9taXNlPExvYWRPcmRlcj4ge1xyXG4gIC8vIGdlblByb3BzIGlzIGEgc21hbGwgdXRpbGl0eSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIG9mdGVuIHJlLXVzZWQgb2JqZWN0c1xyXG4gIC8vICBzdWNoIGFzIHRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdGFsbGVkIE1vZHMsIFZvcnRleCdzIGFwcGxpY2F0aW9uIHN0YXRlLFxyXG4gIC8vICB0aGUgY3VycmVudGx5IGFjdGl2ZSBwcm9maWxlLCBldGMuXHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcz8ucHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBXaHkgYXJlIHdlIGRlc2VyaWFsaXppbmcgd2hlbiB0aGUgcHJvZmlsZSBpcyBpbnZhbGlkIG9yIGJlbG9uZ3MgdG9cclxuICAgIC8vICBhbm90aGVyIGdhbWUgP1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuXHJcbiAgLy8gVGhlIGRlc2VyaWFsaXphdGlvbiBmdW5jdGlvbiBzaG91bGQgYmUgdXNlZCB0byBmaWx0ZXIgYW5kIGluc2VydCB3YW50ZWQgZGF0YSBpbnRvIFZvcnRleCdzXHJcbiAgLy8gIGxvYWRPcmRlciBhcHBsaWNhdGlvbiBzdGF0ZSwgb25jZSB0aGF0J3MgZG9uZSwgVm9ydGV4IHdpbGwgdHJpZ2dlciBhIHNlcmlhbGl6YXRpb24gZXZlbnRcclxuICAvLyAgd2hpY2ggd2lsbCBlbnN1cmUgdGhhdCB0aGUgZGF0YSBpcyB3cml0dGVuIHRvIHRoZSBMTyBmaWxlLlxyXG4gIGNvbnN0IGN1cnJlbnRNb2RzU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvcHMucHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcblxyXG4gIC8vIHdlIG9ubHkgd2FudCB0byBpbnNlcnQgZW5hYmxlZCBtb2RzLlxyXG4gIGNvbnN0IGVuYWJsZWRNb2RJZHMgPSBPYmplY3Qua2V5cyhjdXJyZW50TW9kc1N0YXRlKVxyXG4gICAgLmZpbHRlcihtb2RJZCA9PiB1dGlsLmdldFNhZmUoY3VycmVudE1vZHNTdGF0ZSwgW21vZElkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUocHJvcHMuc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgbGV0IGRhdGE6IElMb2FkT3JkZXJFbnRyeVtdID0gW107XHJcbiAgbGV0IGxvRmlsZVBhdGg7XHJcbiAgdHJ5IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsb0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBkYXRhID0gYXdhaXQgY29ycnVwdExPRGlhbG9nKHByb3BzLCBsb0ZpbGVQYXRoLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgLy8gVXNlciBtYXkgaGF2ZSBkaXNhYmxlZC9yZW1vdmVkIGEgbW9kIC0gd2UgbmVlZCB0byBmaWx0ZXIgb3V0IGFueSBleGlzdGluZ1xyXG4gICAgLy8gIGVudHJpZXMgZnJvbSB0aGUgZGF0YSB3ZSBwYXJzZWQuXHJcbiAgICBjb25zdCBmaWx0ZXJlZERhdGEgPSBkYXRhLmZpbHRlcihlbnRyeSA9PiBlbmFibGVkTW9kSWRzLmluY2x1ZGVzKGVudHJ5LmlkKSk7XHJcbiAgICBjb25zdCBvZmZzZXQgPSBnZXRQcmVmaXhPZmZzZXQoY29udGV4dC5hcGkpO1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgYWRkZWQgYW55IG5ldyBtb2RzLlxyXG4gICAgY29uc3QgZGlmZiA9IGVuYWJsZWRNb2RJZHMuZmlsdGVyKGlkID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMobW9kc1tpZF0/LnR5cGUpKVxyXG4gICAgICAmJiAoZmlsdGVyZWREYXRhLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBpZCkgPT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXHJcbiAgICBkaWZmLmZvckVhY2goKG1pc3NpbmdFbnRyeSwgaWR4KSA9PiB7XHJcbiAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKHtcclxuICAgICAgICBpZDogbWlzc2luZ0VudHJ5LFxyXG4gICAgICAgIG1vZElkOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBuYW1lOiBtb2RzW21pc3NpbmdFbnRyeV0gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgPyB1dGlsLnJlbmRlck1vZE5hbWUobW9kc1ttaXNzaW5nRW50cnldKVxyXG4gICAgICAgICAgOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgcHJlZml4OiBtYWtlUHJlZml4KGlkeCArIGZpbHRlcmVkRGF0YS5sZW5ndGggKyBvZmZzZXQpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXQgdGhpcyBwb2ludCB5b3UgbWF5IGhhdmUgbm90aWNlZCB0aGF0IHdlJ3JlIG5vdCBzZXR0aW5nIHRoZSBwcmVmaXhcclxuICAgIC8vICBmb3IgdGhlIG5ld2x5IGFkZGVkIG1vZCBlbnRyaWVzIC0gd2UgY291bGQgY2VydGFpbmx5IGRvIHRoYXQgaGVyZSxcclxuICAgIC8vICBidXQgdGhhdCB3b3VsZCBzaW1wbHkgYmUgY29kZSBkdXBsaWNhdGlvbiBhcyB3ZSBuZWVkIHRvIGFzc2lnbiBwcmVmaXhlc1xyXG4gICAgLy8gIGR1cmluZyBzZXJpYWxpemF0aW9uIGFueXdheSAob3RoZXJ3aXNlIHVzZXIgZHJhZy1kcm9wIGludGVyYWN0aW9ucyB3aWxsXHJcbiAgICAvLyAgbm90IGJlIHNhdmVkKVxyXG4gICAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IExvYWRPcmRlcik6IFByb21pc2U8YW55PiB7XHJcbiAgLy8gTm90aGluZyB0byB2YWxpZGF0ZSByZWFsbHkgLSB0aGUgZ2FtZSBkb2VzIG5vdCByZWFkIG91ciBsb2FkIG9yZGVyIGZpbGVcclxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcclxuICAvLyAgcmV0dXJuLlxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuIl19