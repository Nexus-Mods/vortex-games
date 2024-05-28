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
exports.importLoadOrder = exports.exportLoadOrder = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
const util_1 = require("./util");
const migrations_1 = require("../migrations");
function exportLoadOrder(api, modIds, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        if (profileId === undefined) {
            return Promise.reject(new util_1.CollectionGenerateError('Invalid profile id'));
        }
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        if (loadOrder === undefined) {
            return Promise.resolve(undefined);
        }
        const includedMods = modIds.reduce((accum, iter) => {
            if (mods[iter] !== undefined) {
                accum[iter] = mods[iter];
            }
            return accum;
        }, {});
        const filteredLO = (0, util_1.genCollectionLoadOrder)(loadOrder, includedMods);
        return Promise.resolve(filteredLO);
    });
}
exports.exportLoadOrder = exportLoadOrder;
function importLoadOrder(api, collection) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        if (profileId === undefined) {
            return Promise.reject(new util_1.CollectionParseError(((_a = collection === null || collection === void 0 ? void 0 : collection['info']) === null || _a === void 0 ? void 0 : _a['name']) || '', 'Invalid profile id'));
        }
        const converted = (0, migrations_1.getPersistentLoadOrder)(api, collection.loadOrder);
        api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, converted));
        return Promise.resolve(undefined);
    });
}
exports.importLoadOrder = importLoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCxzQ0FBb0M7QUFHcEMsaUNBQ3lDO0FBQ3pDLDhDQUF1RDtBQUV2RCxTQUFzQixlQUFlLENBQUMsR0FBd0IsRUFDeEIsTUFBZ0IsRUFDaEIsSUFBcUM7O1FBRXpFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDckUsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQzNCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLDhCQUF1QixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztTQUMxRTtRQUVELE1BQU0sU0FBUyxHQUFvQixJQUFBLG1DQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQU8zQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ2pELElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMxQjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsTUFBTSxVQUFVLEdBQW9CLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3BGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUE3QkQsMENBNkJDO0FBRUQsU0FBc0IsZUFBZSxDQUFDLEdBQXdCLEVBQ3hCLFVBQThCOzs7UUFDbEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksMkJBQW9CLENBQUMsQ0FBQSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRyxNQUFNLENBQUMsMENBQUcsTUFBTSxDQUFDLEtBQUksRUFBRSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztTQUM3RztRQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsbUNBQXNCLEVBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxTQUFnQixDQUFDLENBQUM7UUFDM0UsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztDQUNuQztBQVpELDBDQVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9ucywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcclxuaW1wb3J0IHsgSVczQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvciwgQ29sbGVjdGlvblBhcnNlRXJyb3IsXHJcbiAgZ2VuQ29sbGVjdGlvbkxvYWRPcmRlciB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuLi9taWdyYXRpb25zJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dHlwZXMuTG9hZE9yZGVyPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3IoJ0ludmFsaWQgcHJvZmlsZSBpZCcpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xyXG4gIGlmIChsb2FkT3JkZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVGhpcyBpcyB0aGVvcmV0aWNhbGx5IFwiZmluZVwiIC0gdGhlIHVzZXIgbWF5IGhhdmUgc2ltcGx5XHJcbiAgICAvLyAgZG93bmxvYWRlZCB0aGUgbW9kcyBhbmQgaW1tZWRpYXRlbHkgY3JlYXRlZCB0aGUgY29sbGVjdGlvblxyXG4gICAgLy8gIHdpdGhvdXQgYWN0dWFsbHkgc2V0dGluZyB1cCBhIGxvYWQgb3JkZXIuIEFsdGVybmF0aXZlbHlcclxuICAgIC8vICB0aGUgZ2FtZSBleHRlbnNpb24gaXRzZWxmIG1pZ2h0IGJlIGhhbmRsaW5nIHRoZSBwcmVzb3J0IGZ1bmN0aW9uYWxpdHlcclxuICAgIC8vICBlcnJvbmVvdXNseS4gUmVnYXJkbGVzcywgdGhlIGNvbGxlY3Rpb24gY3JlYXRpb24gc2hvdWxkbid0IGJlIGJsb2NrZWRcclxuICAgIC8vICBieSB0aGUgaW5leGlzdGFuY2Ugb2YgYSBsb2FkT3JkZXIuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbmNsdWRlZE1vZHMgPSBtb2RJZHMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgaWYgKG1vZHNbaXRlcl0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhY2N1bVtpdGVyXSA9IG1vZHNbaXRlcl07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG4gIGNvbnN0IGZpbHRlcmVkTE86IHR5cGVzLkxvYWRPcmRlciA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBpbmNsdWRlZE1vZHMpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmlsdGVyZWRMTyk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcblxyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uUGFyc2VFcnJvcihjb2xsZWN0aW9uPy5bJ2luZm8nXT8uWyduYW1lJ10gfHwgJycsICdJbnZhbGlkIHByb2ZpbGUgaWQnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb252ZXJ0ZWQgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSwgY29sbGVjdGlvbi5sb2FkT3JkZXIgYXMgYW55KTtcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBjb252ZXJ0ZWQpKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbn1cclxuIl19