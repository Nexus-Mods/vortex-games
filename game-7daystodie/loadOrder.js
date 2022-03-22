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
            bbcode: props.api.translate('The load order file is in a corrupt state. You can try to fix it yourself '
                + 'or Vortex can regenerate the file for you, but that may result in loss of data '
                + '(Will only affect load order items you added manually, if any).'),
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
        const loFilePath = yield (0, util_1.ensureLOFile)(context);
        const fileData = yield vortex_api_1.fs.readFileAsync(loFilePath, { encoding: 'utf8' });
        let data = [];
        try {
            try {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBNEI7QUFDNUIsMkNBQXNEO0FBRXRELHFDQUF5RDtBQUV6RCxpQ0FBNkU7QUFFN0UsU0FBUyxhQUFhLENBQUMsSUFBZSxFQUFFLE9BQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFLEdBQVU7SUFDbEUsT0FBTyxJQUFJLE9BQU8sQ0FBb0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDeEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLHlCQUF5QixFQUFFO1lBQ3ZELE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0RUFBNEU7a0JBQ3BHLGlGQUFpRjtrQkFDakYsaUVBQWlFLENBQUM7U0FDdkUsRUFBRTtZQUNELEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzlDO2dCQUNFLEtBQUssRUFBRSxpQkFBaUI7Z0JBQ3hCLE1BQU0sRUFBRSxHQUFTLEVBQUU7b0JBQ2pCLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbkQsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3JCLENBQUMsQ0FBQTthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBc0IsU0FBUyxDQUFDLE9BQWdDLEVBQ2hDLFNBQW9CLEVBQ3BCLFNBQWtCOztRQUNoRCxNQUFNLEtBQUssR0FBVyxJQUFBLGVBQVEsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztTQUNsRTtRQUdELE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSxtQkFBWSxFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakUsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxlQUN2QyxPQUFBLENBQUMsNkJBQW9CLENBQUMsUUFBUSxDQUFDLE1BQUEsTUFBQSxLQUFLLENBQUMsSUFBSSwwQ0FBRyxFQUFFLGFBQUYsRUFBRSx1QkFBRixFQUFFLENBQUUsS0FBSyxDQUFDLDBDQUFFLElBQUksQ0FBQyxDQUFBLEVBQUEsQ0FBQyxDQUFDO1FBRWpFLE1BQU0sTUFBTSxHQUFHLElBQUEsc0JBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFJNUMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQXdCLEVBQUUsR0FBVyxFQUFFLEVBQUU7WUFDMUUsTUFBTSxNQUFNLEdBQUcsSUFBQSxpQkFBVSxFQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQztZQUN4QyxNQUFNLElBQUksR0FBc0I7Z0JBQzlCLE1BQU07YUFDUCxDQUFDO1lBQ0YsdUNBQVksT0FBTyxLQUFFLElBQUksSUFBRztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7YUFDdEUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztZQUNuQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUUzQixJQUFJLE9BQU8sR0FBc0IsRUFBRSxDQUFDO1FBQ3BDLElBQUk7WUFDRixPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxHQUFHLE1BQU0sZUFBZSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDekQ7UUFFRCxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEVBQUU7WUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDaEY7UUFHRCxNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3BGLE1BQU0saUJBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNuRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0NBQUE7QUE3Q0QsOEJBNkNDO0FBRUQsU0FBc0IsV0FBVyxDQUFDLE9BQWdDOzs7UUFJaEUsTUFBTSxLQUFLLEdBQVcsSUFBQSxlQUFRLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFBLE1BQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLE9BQU8sMENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7WUFHdEMsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUtELE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBR3ZFLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7YUFDaEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM5RSxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFDcEUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2QyxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUEsbUJBQVksRUFBQyxPQUFPLENBQUMsQ0FBQztRQUMvQyxNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDMUUsSUFBSSxJQUFJLEdBQXNCLEVBQUUsQ0FBQztRQUNqQyxJQUFJO1lBQ0YsSUFBSTtnQkFDRixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM3QjtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLElBQUksR0FBRyxNQUFNLGVBQWUsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQ3REO1lBR0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUUsTUFBTSxNQUFNLEdBQUcsSUFBQSxzQkFBZSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUU1QyxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFOztnQkFBQyxPQUFBLENBQUMsQ0FBQyw2QkFBb0IsQ0FBQyxRQUFRLENBQUMsTUFBQSxJQUFJLENBQUMsRUFBRSxDQUFDLDBDQUFFLElBQUksQ0FBQyxDQUFDO3VCQUNuRixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFBO2FBQUEsQ0FBQyxDQUFDO1lBR3RFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQ2pDLFlBQVksQ0FBQyxJQUFJLENBQUM7b0JBQ2hCLEVBQUUsRUFBRSxZQUFZO29CQUNoQixLQUFLLEVBQUUsWUFBWTtvQkFDbkIsT0FBTyxFQUFFLElBQUk7b0JBQ2IsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxTQUFTO3dCQUNwQyxDQUFDLENBQUMsaUJBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN4QyxDQUFDLENBQUMsWUFBWTtvQkFDaEIsSUFBSSxFQUFFO3dCQUNKLE1BQU0sRUFBRSxJQUFBLGlCQUFVLEVBQUMsR0FBRyxHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO3FCQUN2RDtpQkFDRixDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQU9ILE9BQU8sWUFBWSxDQUFDO1NBQ3JCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7O0NBQ0Y7QUE5REQsa0NBOERDO0FBRUQsU0FBc0IsUUFBUSxDQUFDLElBQWUsRUFDZixPQUFrQjs7UUFJL0MsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUFBO0FBTkQsNEJBTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSU5WQUxJRF9MT19NT0RfVFlQRVMgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzLCBJU2VyaWFsaXphYmxlRGF0YSwgTG9hZE9yZGVyIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGVuc3VyZUxPRmlsZSwgZ2VuUHJvcHMsIGdldFByZWZpeE9mZnNldCwgbWFrZVByZWZpeCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5mdW5jdGlvbiBpc0xPRGlmZmVyZW50KHByZXY6IExvYWRPcmRlciwgY3VycmVudDogTG9hZE9yZGVyKSB7XHJcbiAgY29uc3QgZGlmZiA9IF8uZGlmZmVyZW5jZShwcmV2LCBjdXJyZW50KTtcclxuICBpZiAoZGlmZi5sZW5ndGggPiAwKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29ycnVwdExPRGlhbG9nKHByb3BzOiBJUHJvcHMsIGZpbGVQYXRoOiBzdHJpbmcsIGVycjogRXJyb3IpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SUxvYWRPcmRlckVudHJ5W10+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdDb3JydXB0IGxvYWQgb3JkZXIgZmlsZScsIHtcclxuICAgICAgYmJjb2RlOiBwcm9wcy5hcGkudHJhbnNsYXRlKCdUaGUgbG9hZCBvcmRlciBmaWxlIGlzIGluIGEgY29ycnVwdCBzdGF0ZS4gWW91IGNhbiB0cnkgdG8gZml4IGl0IHlvdXJzZWxmICdcclxuICAgICAgICArICdvciBWb3J0ZXggY2FuIHJlZ2VuZXJhdGUgdGhlIGZpbGUgZm9yIHlvdSwgYnV0IHRoYXQgbWF5IHJlc3VsdCBpbiBsb3NzIG9mIGRhdGEgJ1xyXG4gICAgICAgICsgJyhXaWxsIG9ubHkgYWZmZWN0IGxvYWQgb3JkZXIgaXRlbXMgeW91IGFkZGVkIG1hbnVhbGx5LCBpZiBhbnkpLicpLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiByZWplY3QoZXJyKSB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbGFiZWw6ICdSZWdlbmVyYXRlIEZpbGUnLFxyXG4gICAgICAgIGFjdGlvbjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpLmNhdGNoKGVycjIgPT4gbnVsbCk7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShbXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VyaWFsaXplKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRPcmRlcjogTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnaW52YWxpZCBwcm9wcycpKTtcclxuICB9XHJcblxyXG4gIC8vIE1ha2Ugc3VyZSB0aGUgTE8gZmlsZSBpcyBjcmVhdGVkIGFuZCByZWFkeSB0byBiZSB3cml0dGVuIHRvLlxyXG4gIGNvbnN0IGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCwgcHJvZmlsZUlkLCBwcm9wcyk7XHJcbiAgY29uc3QgZmlsdGVyZWRMTyA9IGxvYWRPcmRlci5maWx0ZXIobG8gPT5cclxuICAgICFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhwcm9wcy5tb2RzPy5bbG8/Lm1vZElkXT8udHlwZSkpO1xyXG5cclxuICBjb25zdCBvZmZzZXQgPSBnZXRQcmVmaXhPZmZzZXQoY29udGV4dC5hcGkpO1xyXG5cclxuICAvLyBUaGUgYXJyYXkgYXQgdGhpcyBwb2ludCBpcyBzb3J0ZWQgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHdlIHdhbnQgdGhlIGdhbWUgdG8gbG9hZCB0aGVcclxuICAvLyAgbW9kcywgd2hpY2ggbWVhbnMgd2UgY2FuIGp1c3QgbG9vcCB0aHJvdWdoIGl0IGFuZCB1c2UgdGhlIGluZGV4IHRvIGFzc2lnbiB0aGUgcHJlZml4LlxyXG4gIGNvbnN0IHByZWZpeGVkTE8gPSBmaWx0ZXJlZExPLm1hcCgobG9FbnRyeTogSUxvYWRPcmRlckVudHJ5LCBpZHg6IG51bWJlcikgPT4ge1xyXG4gICAgY29uc3QgcHJlZml4ID0gbWFrZVByZWZpeChpZHggKyBvZmZzZXQpO1xyXG4gICAgY29uc3QgZGF0YTogSVNlcmlhbGl6YWJsZURhdGEgPSB7XHJcbiAgICAgIHByZWZpeCxcclxuICAgIH07XHJcbiAgICByZXR1cm4geyAuLi5sb0VudHJ5LCBkYXRhIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsb0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoJycpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcblxyXG4gIGxldCBzYXZlZExPOiBJTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBzYXZlZExPID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBzYXZlZExPID0gYXdhaXQgY29ycnVwdExPRGlhbG9nKHByb3BzLCBsb0ZpbGVQYXRoLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGlzTE9EaWZmZXJlbnQoc2F2ZWRMTywgcHJlZml4ZWRMTykpIHtcclxuICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb3BzLnByb2ZpbGUuaWQsIHByZWZpeGVkTE8pKTtcclxuICB9XHJcblxyXG4gIC8vIFdyaXRlIHRoZSBwcmVmaXhlZCBMTyB0byBmaWxlLlxyXG4gIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxvRmlsZVBhdGgpLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGF3YWl0IHV0aWwud3JpdGVGaWxlQXRvbWljKGxvRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHByZWZpeGVkTE8pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8TG9hZE9yZGVyPiB7XHJcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXHJcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXHJcbiAgLy8gIHRoZSBjdXJyZW50bHkgYWN0aXZlIHByb2ZpbGUsIGV0Yy5cclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIFdoeSBhcmUgd2UgZGVzZXJpYWxpemluZyB3aGVuIHRoZSBwcm9maWxlIGlzIGludmFsaWQgb3IgYmVsb25ncyB0b1xyXG4gICAgLy8gIGFub3RoZXIgZ2FtZSA/XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgZGVzZXJpYWxpemF0aW9uIGZ1bmN0aW9uIHNob3VsZCBiZSB1c2VkIHRvIGZpbHRlciBhbmQgaW5zZXJ0IHdhbnRlZCBkYXRhIGludG8gVm9ydGV4J3NcclxuICAvLyAgbG9hZE9yZGVyIGFwcGxpY2F0aW9uIHN0YXRlLCBvbmNlIHRoYXQncyBkb25lLCBWb3J0ZXggd2lsbCB0cmlnZ2VyIGEgc2VyaWFsaXphdGlvbiBldmVudFxyXG4gIC8vICB3aGljaCB3aWxsIGVuc3VyZSB0aGF0IHRoZSBkYXRhIGlzIHdyaXR0ZW4gdG8gdGhlIExPIGZpbGUuXHJcbiAgY29uc3QgY3VycmVudE1vZHNTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5wcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuXHJcbiAgLy8gd2Ugb25seSB3YW50IHRvIGluc2VydCBlbmFibGVkIG1vZHMuXHJcbiAgY29uc3QgZW5hYmxlZE1vZElkcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRNb2RzU3RhdGUpXHJcbiAgICAuZmlsdGVyKG1vZElkID0+IHV0aWwuZ2V0U2FmZShjdXJyZW50TW9kc1N0YXRlLCBbbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xyXG4gIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsb0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgbGV0IGRhdGE6IElMb2FkT3JkZXJFbnRyeVtdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBkYXRhID0gYXdhaXQgY29ycnVwdExPRGlhbG9nKHByb3BzLCBsb0ZpbGVQYXRoLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgLy8gVXNlciBtYXkgaGF2ZSBkaXNhYmxlZC9yZW1vdmVkIGEgbW9kIC0gd2UgbmVlZCB0byBmaWx0ZXIgb3V0IGFueSBleGlzdGluZ1xyXG4gICAgLy8gIGVudHJpZXMgZnJvbSB0aGUgZGF0YSB3ZSBwYXJzZWQuXHJcbiAgICBjb25zdCBmaWx0ZXJlZERhdGEgPSBkYXRhLmZpbHRlcihlbnRyeSA9PiBlbmFibGVkTW9kSWRzLmluY2x1ZGVzKGVudHJ5LmlkKSk7XHJcbiAgICBjb25zdCBvZmZzZXQgPSBnZXRQcmVmaXhPZmZzZXQoY29udGV4dC5hcGkpO1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgYWRkZWQgYW55IG5ldyBtb2RzLlxyXG4gICAgY29uc3QgZGlmZiA9IGVuYWJsZWRNb2RJZHMuZmlsdGVyKGlkID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMobW9kc1tpZF0/LnR5cGUpKVxyXG4gICAgICAmJiAoZmlsdGVyZWREYXRhLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBpZCkgPT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXHJcbiAgICBkaWZmLmZvckVhY2goKG1pc3NpbmdFbnRyeSwgaWR4KSA9PiB7XHJcbiAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKHtcclxuICAgICAgICBpZDogbWlzc2luZ0VudHJ5LFxyXG4gICAgICAgIG1vZElkOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBuYW1lOiBtb2RzW21pc3NpbmdFbnRyeV0gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgPyB1dGlsLnJlbmRlck1vZE5hbWUobW9kc1ttaXNzaW5nRW50cnldKVxyXG4gICAgICAgICAgOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgcHJlZml4OiBtYWtlUHJlZml4KGlkeCArIGZpbHRlcmVkRGF0YS5sZW5ndGggKyBvZmZzZXQpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXQgdGhpcyBwb2ludCB5b3UgbWF5IGhhdmUgbm90aWNlZCB0aGF0IHdlJ3JlIG5vdCBzZXR0aW5nIHRoZSBwcmVmaXhcclxuICAgIC8vICBmb3IgdGhlIG5ld2x5IGFkZGVkIG1vZCBlbnRyaWVzIC0gd2UgY291bGQgY2VydGFpbmx5IGRvIHRoYXQgaGVyZSxcclxuICAgIC8vICBidXQgdGhhdCB3b3VsZCBzaW1wbHkgYmUgY29kZSBkdXBsaWNhdGlvbiBhcyB3ZSBuZWVkIHRvIGFzc2lnbiBwcmVmaXhlc1xyXG4gICAgLy8gIGR1cmluZyBzZXJpYWxpemF0aW9uIGFueXdheSAob3RoZXJ3aXNlIHVzZXIgZHJhZy1kcm9wIGludGVyYWN0aW9ucyB3aWxsXHJcbiAgICAvLyAgbm90IGJlIHNhdmVkKVxyXG4gICAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IExvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IExvYWRPcmRlcik6IFByb21pc2U8YW55PiB7XHJcbiAgLy8gTm90aGluZyB0byB2YWxpZGF0ZSByZWFsbHkgLSB0aGUgZ2FtZSBkb2VzIG5vdCByZWFkIG91ciBsb2FkIG9yZGVyIGZpbGVcclxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcclxuICAvLyAgcmV0dXJuLlxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuIl19