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
        const filteredLO = util_1.genCollectionLoadOrder(loadOrder, includedMods);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCxzQ0FBb0M7QUFHcEMsaUNBQ3dFO0FBRXhFLFNBQXNCLGVBQWUsQ0FBQyxLQUFtQixFQUNuQixNQUFnQixFQUNoQixJQUFxQzs7UUFFekUsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSw4QkFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDMUU7UUFFRCxNQUFNLFNBQVMsR0FBZSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzlDLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFPM0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNqRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUI7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNQLE1BQU0sVUFBVSxHQUFlLDZCQUFzQixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMvRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUFBO0FBN0JELDBDQTZCQztBQUVELFNBQXNCLGVBQWUsQ0FBQyxHQUF3QixFQUN4QixVQUE4Qjs7O1FBQ2xFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUU3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDckUsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQzNCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLDJCQUFvQixDQUFDLE9BQUEsVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFHLE1BQU0sMkNBQUksTUFBTSxNQUFLLEVBQUUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDN0c7UUFFRCxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLFNBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7Q0FDbkM7QUFYRCwwQ0FXQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFjdGlvbnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4uL2NvbW1vbic7XHJcbmltcG9ydCB7IElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSwgSVczQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvciwgQ29sbGVjdGlvblBhcnNlRXJyb3IsXHJcbiAgZ2VuQ29sbGVjdGlvbkxvYWRPcmRlciwgaXNNb2RJbkNvbGxlY3Rpb24sIGlzVmFsaWRNb2QgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydExvYWRPcmRlcihzdGF0ZTogdHlwZXMuSVN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SUxvYWRPcmRlcj4ge1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcignSW52YWxpZCBwcm9maWxlIGlkJykpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9hZE9yZGVyOiBJTG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGxvYWRPcmRlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGlzIGlzIHRoZW9yZXRpY2FsbHkgXCJmaW5lXCIgLSB0aGUgdXNlciBtYXkgaGF2ZSBzaW1wbHlcclxuICAgIC8vICBkb3dubG9hZGVkIHRoZSBtb2RzIGFuZCBpbW1lZGlhdGVseSBjcmVhdGVkIHRoZSBjb2xsZWN0aW9uXHJcbiAgICAvLyAgd2l0aG91dCBhY3R1YWxseSBzZXR0aW5nIHVwIGEgbG9hZCBvcmRlci4gQWx0ZXJuYXRpdmVseVxyXG4gICAgLy8gIHRoZSBnYW1lIGV4dGVuc2lvbiBpdHNlbGYgbWlnaHQgYmUgaGFuZGxpbmcgdGhlIHByZXNvcnQgZnVuY3Rpb25hbGl0eVxyXG4gICAgLy8gIGVycm9uZW91c2x5LiBSZWdhcmRsZXNzLCB0aGUgY29sbGVjdGlvbiBjcmVhdGlvbiBzaG91bGRuJ3QgYmUgYmxvY2tlZFxyXG4gICAgLy8gIGJ5IHRoZSBpbmV4aXN0YW5jZSBvZiBhIGxvYWRPcmRlci5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGluY2x1ZGVkTW9kcyA9IG1vZElkcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICBpZiAobW9kc1tpdGVyXSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFjY3VtW2l0ZXJdID0gbW9kc1tpdGVyXTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcbiAgY29uc3QgZmlsdGVyZWRMTzogSUxvYWRPcmRlciA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBpbmNsdWRlZE1vZHMpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmlsdGVyZWRMTyk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcblxyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uUGFyc2VFcnJvcihjb2xsZWN0aW9uPy5bJ2luZm8nXT8uWyduYW1lJ10gfHwgJycsICdJbnZhbGlkIHByb2ZpbGUgaWQnKSk7XHJcbiAgfVxyXG5cclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBjb2xsZWN0aW9uLmxvYWRPcmRlciBhcyBhbnkpKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbn1cclxuIl19