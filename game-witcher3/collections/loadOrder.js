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
function exportLoadOrder(state, modIds, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        if (profileId === undefined) {
            return Promise.reject(new util_1.CollectionGenerateError('Invalid profile id'));
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], undefined);
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
        api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, collection.loadOrder));
        return Promise.resolve(undefined);
    });
}
exports.importLoadOrder = importLoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCxzQ0FBb0M7QUFHcEMsaUNBQ3dFO0FBRXhFLFNBQXNCLGVBQWUsQ0FBQyxLQUFtQixFQUNuQixNQUFnQixFQUNoQixJQUFxQzs7UUFFekUsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSw4QkFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDMUU7UUFFRCxNQUFNLFNBQVMsR0FBZSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzlDLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFPM0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNqRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUI7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNQLE1BQU0sVUFBVSxHQUFlLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQy9FLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUE3QkQsMENBNkJDO0FBRUQsU0FBc0IsZUFBZSxDQUFDLEdBQXdCLEVBQ3hCLFVBQThCOzs7UUFDbEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksMkJBQW9CLENBQUMsQ0FBQSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRyxNQUFNLENBQUMsMENBQUcsTUFBTSxDQUFDLEtBQUksRUFBRSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztTQUM3RztRQUVELEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDakYsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztDQUNuQztBQVhELDBDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9ucywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlciwgSUxvYWRPcmRlckVudHJ5LCBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IENvbGxlY3Rpb25HZW5lcmF0ZUVycm9yLCBDb2xsZWN0aW9uUGFyc2VFcnJvcixcclxuICBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyLCBpc01vZEluQ29sbGVjdGlvbiwgaXNWYWxpZE1vZCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0TG9hZE9yZGVyKHN0YXRlOiB0eXBlcy5JU3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWRzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTxJTG9hZE9yZGVyPiB7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IENvbGxlY3Rpb25HZW5lcmF0ZUVycm9yKCdJbnZhbGlkIHByb2ZpbGUgaWQnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2FkT3JkZXI6IElMb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgdW5kZWZpbmVkKTtcclxuICBpZiAobG9hZE9yZGVyID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFRoaXMgaXMgdGhlb3JldGljYWxseSBcImZpbmVcIiAtIHRoZSB1c2VyIG1heSBoYXZlIHNpbXBseVxyXG4gICAgLy8gIGRvd25sb2FkZWQgdGhlIG1vZHMgYW5kIGltbWVkaWF0ZWx5IGNyZWF0ZWQgdGhlIGNvbGxlY3Rpb25cclxuICAgIC8vICB3aXRob3V0IGFjdHVhbGx5IHNldHRpbmcgdXAgYSBsb2FkIG9yZGVyLiBBbHRlcm5hdGl2ZWx5XHJcbiAgICAvLyAgdGhlIGdhbWUgZXh0ZW5zaW9uIGl0c2VsZiBtaWdodCBiZSBoYW5kbGluZyB0aGUgcHJlc29ydCBmdW5jdGlvbmFsaXR5XHJcbiAgICAvLyAgZXJyb25lb3VzbHkuIFJlZ2FyZGxlc3MsIHRoZSBjb2xsZWN0aW9uIGNyZWF0aW9uIHNob3VsZG4ndCBiZSBibG9ja2VkXHJcbiAgICAvLyAgYnkgdGhlIGluZXhpc3RhbmNlIG9mIGEgbG9hZE9yZGVyLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5jbHVkZWRNb2RzID0gbW9kSWRzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcclxuICAgIGlmIChtb2RzW2l0ZXJdICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYWNjdW1baXRlcl0gPSBtb2RzW2l0ZXJdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuICBjb25zdCBmaWx0ZXJlZExPOiBJTG9hZE9yZGVyID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIGluY2x1ZGVkTW9kcyk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaWx0ZXJlZExPKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuXHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IENvbGxlY3Rpb25QYXJzZUVycm9yKGNvbGxlY3Rpb24/LlsnaW5mbyddPy5bJ25hbWUnXSB8fCAnJywgJ0ludmFsaWQgcHJvZmlsZSBpZCcpKTtcclxuICB9XHJcblxyXG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIGNvbGxlY3Rpb24ubG9hZE9yZGVyIGFzIGFueSkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxufVxyXG4iXX0=