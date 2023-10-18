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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCxzQ0FBb0M7QUFHcEMsaUNBQ3dFO0FBRXhFLFNBQXNCLGVBQWUsQ0FBQyxLQUFtQixFQUNuQixNQUFnQixFQUNoQixJQUFxQzs7UUFFekUsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSw4QkFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDMUU7UUFFRCxNQUFNLFNBQVMsR0FBZSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzlDLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFPM0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNqRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUI7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNQLE1BQU0sVUFBVSxHQUFlLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQy9FLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUE3QkQsMENBNkJDO0FBRUQsU0FBc0IsZUFBZSxDQUFDLEdBQXdCLEVBQ3hCLFVBQThCOzs7UUFDbEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksMkJBQW9CLENBQUMsQ0FBQSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRyxNQUFNLENBQUMsMENBQUcsTUFBTSxDQUFDLEtBQUksRUFBRSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztTQUM3RztRQUVELEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDakYsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztDQUNuQztBQVhELDBDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9ucywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4uL2NvbW1vbic7XG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJTG9hZE9yZGVyRW50cnksIElXM0NvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvciwgQ29sbGVjdGlvblBhcnNlRXJyb3IsXG4gIGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIsIGlzTW9kSW5Db2xsZWN0aW9uLCBpc1ZhbGlkTW9kIH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydExvYWRPcmRlcihzdGF0ZTogdHlwZXMuSVN0YXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RJZHM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SUxvYWRPcmRlcj4ge1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcignSW52YWxpZCBwcm9maWxlIGlkJykpO1xuICB9XG5cbiAgY29uc3QgbG9hZE9yZGVyOiBJTG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCB1bmRlZmluZWQpO1xuICBpZiAobG9hZE9yZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBUaGlzIGlzIHRoZW9yZXRpY2FsbHkgXCJmaW5lXCIgLSB0aGUgdXNlciBtYXkgaGF2ZSBzaW1wbHlcbiAgICAvLyAgZG93bmxvYWRlZCB0aGUgbW9kcyBhbmQgaW1tZWRpYXRlbHkgY3JlYXRlZCB0aGUgY29sbGVjdGlvblxuICAgIC8vICB3aXRob3V0IGFjdHVhbGx5IHNldHRpbmcgdXAgYSBsb2FkIG9yZGVyLiBBbHRlcm5hdGl2ZWx5XG4gICAgLy8gIHRoZSBnYW1lIGV4dGVuc2lvbiBpdHNlbGYgbWlnaHQgYmUgaGFuZGxpbmcgdGhlIHByZXNvcnQgZnVuY3Rpb25hbGl0eVxuICAgIC8vICBlcnJvbmVvdXNseS4gUmVnYXJkbGVzcywgdGhlIGNvbGxlY3Rpb24gY3JlYXRpb24gc2hvdWxkbid0IGJlIGJsb2NrZWRcbiAgICAvLyAgYnkgdGhlIGluZXhpc3RhbmNlIG9mIGEgbG9hZE9yZGVyLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IGluY2x1ZGVkTW9kcyA9IG1vZElkcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgaWYgKG1vZHNbaXRlcl0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYWNjdW1baXRlcl0gPSBtb2RzW2l0ZXJdO1xuICAgIH1cbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcbiAgY29uc3QgZmlsdGVyZWRMTzogSUxvYWRPcmRlciA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBpbmNsdWRlZE1vZHMpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbHRlcmVkTE8pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG5cbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQ29sbGVjdGlvblBhcnNlRXJyb3IoY29sbGVjdGlvbj8uWydpbmZvJ10/LlsnbmFtZSddIHx8ICcnLCAnSW52YWxpZCBwcm9maWxlIGlkJykpO1xuICB9XG5cbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgY29sbGVjdGlvbi5sb2FkT3JkZXIgYXMgYW55KSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbn1cbiJdfQ==