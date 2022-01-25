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
        const fileData = yield vortex_api_1.fs.readFileAsync(loFilePath, { encoding: 'utf8' });
        const savedLO = JSON.parse(fileData);
        if (isLODifferent(savedLO, prefixedLO)) {
            context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(props.profile.id, prefixedLO));
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBNEI7QUFDNUIsMkNBQXNEO0FBRXRELHFDQUF5RDtBQUV6RCxpQ0FBNkU7QUFFN0UsU0FBUyxhQUFhLENBQUMsSUFBZSxFQUFFLE9BQWtCO0lBQ3hELE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQXNCLFNBQVMsQ0FBQyxPQUFnQyxFQUNoQyxTQUFvQixFQUNwQixTQUFrQjs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsSUFBQSxlQUFRLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFHRCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUEsbUJBQVksRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsZUFDdkMsT0FBQSxDQUFDLDZCQUFvQixDQUFDLFFBQVEsQ0FBQyxNQUFBLE1BQUEsS0FBSyxDQUFDLElBQUksMENBQUcsRUFBRSxhQUFGLEVBQUUsdUJBQUYsRUFBRSxDQUFFLEtBQUssQ0FBQywwQ0FBRSxJQUFJLENBQUMsQ0FBQSxFQUFBLENBQUMsQ0FBQztRQUVqRSxNQUFNLE1BQU0sR0FBRyxJ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U0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FBQTtBQU5ELDRCQU1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIElOVkFMSURfTE9fTU9EX1RZUEVTIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElQcm9wcywgSVNlcmlhbGl6YWJsZURhdGEsIExvYWRPcmRlciB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBlbnN1cmVMT0ZpbGUsIGdlblByb3BzLCBnZXRQcmVmaXhPZmZzZXQsIG1ha2VQcmVmaXggfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZnVuY3Rpb24gaXNMT0RpZmZlcmVudChwcmV2OiBMb2FkT3JkZXIsIGN1cnJlbnQ6IExvYWRPcmRlcikge1xyXG4gIGNvbnN0IGRpZmYgPSBfLmRpZmZlcmVuY2UocHJldiwgY3VycmVudCk7XHJcbiAgaWYgKGRpZmYubGVuZ3RoID4gMCkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE9yZGVyOiBMb2FkT3JkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdpbnZhbGlkIHByb3BzJykpO1xyXG4gIH1cclxuXHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBMTyBmaWxlIGlzIGNyZWF0ZWQgYW5kIHJlYWR5IHRvIGJlIHdyaXR0ZW4gdG8uXHJcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0LCBwcm9maWxlSWQsIHByb3BzKTtcclxuICBjb25zdCBmaWx0ZXJlZExPID0gbG9hZE9yZGVyLmZpbHRlcihsbyA9PlxyXG4gICAgIUlOVkFMSURfTE9fTU9EX1RZUEVTLmluY2x1ZGVzKHByb3BzLm1vZHM/Lltsbz8ubW9kSWRdPy50eXBlKSk7XHJcblxyXG4gIGNvbnN0IG9mZnNldCA9IGdldFByZWZpeE9mZnNldChjb250ZXh0LmFwaSk7XHJcblxyXG4gIC8vIFRoZSBhcnJheSBhdCB0aGlzIHBvaW50IGlzIHNvcnRlZCBpbiB0aGUgb3JkZXIgaW4gd2hpY2ggd2Ugd2FudCB0aGUgZ2FtZSB0byBsb2FkIHRoZVxyXG4gIC8vICBtb2RzLCB3aGljaCBtZWFucyB3ZSBjYW4ganVzdCBsb29wIHRocm91Z2ggaXQgYW5kIHVzZSB0aGUgaW5kZXggdG8gYXNzaWduIHRoZSBwcmVmaXguXHJcbiAgY29uc3QgcHJlZml4ZWRMTyA9IGZpbHRlcmVkTE8ubWFwKChsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnksIGlkeDogbnVtYmVyKSA9PiB7XHJcbiAgICBjb25zdCBwcmVmaXggPSBtYWtlUHJlZml4KGlkeCArIG9mZnNldCk7XHJcbiAgICBjb25zdCBkYXRhOiBJU2VyaWFsaXphYmxlRGF0YSA9IHtcclxuICAgICAgcHJlZml4LFxyXG4gICAgfTtcclxuICAgIHJldHVybiB7IC4uLmxvRW50cnksIGRhdGEgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICBjb25zdCBzYXZlZExPOiBJTG9hZE9yZGVyRW50cnlbXSA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gIGlmIChpc0xPRGlmZmVyZW50KHNhdmVkTE8sIHByZWZpeGVkTE8pKSB7XHJcbiAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9wcy5wcm9maWxlLmlkLCBwcmVmaXhlZExPKSk7XHJcbiAgfVxyXG5cclxuICAvLyBXcml0ZSB0aGUgcHJlZml4ZWQgTE8gdG8gZmlsZS5cclxuICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsb0ZpbGVQYXRoKS5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhsb0ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShwcmVmaXhlZExPKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlc2VyaWFsaXplKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KTogUHJvbWlzZTxMb2FkT3JkZXI+IHtcclxuICAvLyBnZW5Qcm9wcyBpcyBhIHNtYWxsIHV0aWxpdHkgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBvZnRlbiByZS11c2VkIG9iamVjdHNcclxuICAvLyAgc3VjaCBhcyB0aGUgY3VycmVudCBsaXN0IG9mIGluc3RhbGxlZCBNb2RzLCBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZSxcclxuICAvLyAgdGhlIGN1cnJlbnRseSBhY3RpdmUgcHJvZmlsZSwgZXRjLlxyXG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcclxuICBpZiAocHJvcHM/LnByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gV2h5IGFyZSB3ZSBkZXNlcmlhbGl6aW5nIHdoZW4gdGhlIHByb2ZpbGUgaXMgaW52YWxpZCBvciBiZWxvbmdzIHRvXHJcbiAgICAvLyAgYW5vdGhlciBnYW1lID9cclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIC8vIFRoZSBkZXNlcmlhbGl6YXRpb24gZnVuY3Rpb24gc2hvdWxkIGJlIHVzZWQgdG8gZmlsdGVyIGFuZCBpbnNlcnQgd2FudGVkIGRhdGEgaW50byBWb3J0ZXgnc1xyXG4gIC8vICBsb2FkT3JkZXIgYXBwbGljYXRpb24gc3RhdGUsIG9uY2UgdGhhdCdzIGRvbmUsIFZvcnRleCB3aWxsIHRyaWdnZXIgYSBzZXJpYWxpemF0aW9uIGV2ZW50XHJcbiAgLy8gIHdoaWNoIHdpbGwgZW5zdXJlIHRoYXQgdGhlIGRhdGEgaXMgd3JpdHRlbiB0byB0aGUgTE8gZmlsZS5cclxuICBjb25zdCBjdXJyZW50TW9kc1N0YXRlID0gdXRpbC5nZXRTYWZlKHByb3BzLnByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xyXG5cclxuICAvLyB3ZSBvbmx5IHdhbnQgdG8gaW5zZXJ0IGVuYWJsZWQgbW9kcy5cclxuICBjb25zdCBlbmFibGVkTW9kSWRzID0gT2JqZWN0LmtleXMoY3VycmVudE1vZHNTdGF0ZSlcclxuICAgIC5maWx0ZXIobW9kSWQgPT4gdXRpbC5nZXRTYWZlKGN1cnJlbnRNb2RzU3RhdGUsIFttb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgZGF0YTogSUxvYWRPcmRlckVudHJ5W10gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuXHJcbiAgICAvLyBVc2VyIG1heSBoYXZlIGRpc2FibGVkL3JlbW92ZWQgYSBtb2QgLSB3ZSBuZWVkIHRvIGZpbHRlciBvdXQgYW55IGV4aXN0aW5nXHJcbiAgICAvLyAgZW50cmllcyBmcm9tIHRoZSBkYXRhIHdlIHBhcnNlZC5cclxuICAgIGNvbnN0IGZpbHRlcmVkRGF0YSA9IGRhdGEuZmlsdGVyKGVudHJ5ID0+IGVuYWJsZWRNb2RJZHMuaW5jbHVkZXMoZW50cnkuaWQpKTtcclxuICAgIGNvbnN0IG9mZnNldCA9IGdldFByZWZpeE9mZnNldChjb250ZXh0LmFwaSk7XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgdXNlciBhZGRlZCBhbnkgbmV3IG1vZHMuXHJcbiAgICBjb25zdCBkaWZmID0gZW5hYmxlZE1vZElkcy5maWx0ZXIoaWQgPT4gKCFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhtb2RzW2lkXT8udHlwZSkpXHJcbiAgICAgICYmIChmaWx0ZXJlZERhdGEuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IGlkKSA9PT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cclxuICAgIGRpZmYuZm9yRWFjaCgobWlzc2luZ0VudHJ5LCBpZHgpID0+IHtcclxuICAgICAgZmlsdGVyZWREYXRhLnB1c2goe1xyXG4gICAgICAgIGlkOiBtaXNzaW5nRW50cnksXHJcbiAgICAgICAgbW9kSWQ6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IG1vZHNbbWlzc2luZ0VudHJ5XSAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW21pc3NpbmdFbnRyeV0pXHJcbiAgICAgICAgICA6IG1pc3NpbmdFbnRyeSxcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBwcmVmaXg6IG1ha2VQcmVmaXgoaWR4ICsgZmlsdGVyZWREYXRhLmxlbmd0aCArIG9mZnNldCksXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBdCB0aGlzIHBvaW50IHlvdSBtYXkgaGF2ZSBub3RpY2VkIHRoYXQgd2UncmUgbm90IHNldHRpbmcgdGhlIHByZWZpeFxyXG4gICAgLy8gIGZvciB0aGUgbmV3bHkgYWRkZWQgbW9kIGVudHJpZXMgLSB3ZSBjb3VsZCBjZXJ0YWlubHkgZG8gdGhhdCBoZXJlLFxyXG4gICAgLy8gIGJ1dCB0aGF0IHdvdWxkIHNpbXBseSBiZSBjb2RlIGR1cGxpY2F0aW9uIGFzIHdlIG5lZWQgdG8gYXNzaWduIHByZWZpeGVzXHJcbiAgICAvLyAgZHVyaW5nIHNlcmlhbGl6YXRpb24gYW55d2F5IChvdGhlcndpc2UgdXNlciBkcmFnLWRyb3AgaW50ZXJhY3Rpb25zIHdpbGxcclxuICAgIC8vICBub3QgYmUgc2F2ZWQpXHJcbiAgICByZXR1cm4gZmlsdGVyZWREYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGUocHJldjogTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogTG9hZE9yZGVyKTogUHJvbWlzZTxhbnk+IHtcclxuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxyXG4gIC8vICBhbmQgd2UgZG9uJ3Qgd2FudCB0byBhcHBseSBhbnkgcmVzdHJpY3Rpb25zIGVpdGhlciwgc28gd2UganVzdFxyXG4gIC8vICByZXR1cm4uXHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG4iXX0=