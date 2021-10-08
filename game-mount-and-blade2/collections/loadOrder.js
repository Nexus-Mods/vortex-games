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
        return new Promise((resolve, reject) => {
            api.events.emit('deploy-mods', (err) => {
                if (!!err) {
                    return reject(err);
                }
                else {
                    api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, collection.loadOrder));
                    return resolve();
                }
            });
        });
    });
}
exports.importLoadOrder = importLoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCxzQ0FBb0M7QUFJcEMsaUNBQ3dFO0FBRXhFLFNBQXNCLGVBQWUsQ0FBQyxLQUFtQixFQUNuQixNQUFnQixFQUNoQixJQUFxQzs7UUFFekUsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSw4QkFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDMUU7UUFFRCxNQUFNLFNBQVMsR0FBZSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzlDLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFPM0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNqRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUI7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNQLE1BQU0sVUFBVSxHQUFlLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQy9FLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUE3QkQsMENBNkJDO0FBRUQsU0FBc0IsZUFBZSxDQUFDLEdBQXdCLEVBQ3hCLFVBQTRCOzs7UUFDaEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksMkJBQW9CLENBQUMsQ0FBQSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRyxNQUFNLENBQUMsMENBQUcsTUFBTSxDQUFDLEtBQUksRUFBRSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztTQUM3RztRQUlELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDM0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRTtvQkFDVCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDcEI7cUJBQU07b0JBQ0wsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxTQUFnQixDQUFDLENBQUMsQ0FBQztvQkFDakYsT0FBTyxPQUFPLEVBQUUsQ0FBQztpQkFDbEI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDOztDQUNKO0FBckJELDBDQXFCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFjdGlvbnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4uL2NvbW1vbic7XHJcbmltcG9ydCB7IElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4uL3R5cGVzJztcclxuaW1wb3J0IHsgSUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3IsIENvbGxlY3Rpb25QYXJzZUVycm9yLFxyXG4gIGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIsIGlzTW9kSW5Db2xsZWN0aW9uLCBpc1ZhbGlkTW9kIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRMb2FkT3JkZXIoc3RhdGU6IHR5cGVzLklTdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RJZHM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPElMb2FkT3JkZXI+IHtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3IoJ0ludmFsaWQgcHJvZmlsZSBpZCcpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChsb2FkT3JkZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVGhpcyBpcyB0aGVvcmV0aWNhbGx5IFwiZmluZVwiIC0gdGhlIHVzZXIgbWF5IGhhdmUgc2ltcGx5XHJcbiAgICAvLyAgZG93bmxvYWRlZCB0aGUgbW9kcyBhbmQgaW1tZWRpYXRlbHkgY3JlYXRlZCB0aGUgY29sbGVjdGlvblxyXG4gICAgLy8gIHdpdGhvdXQgYWN0dWFsbHkgc2V0dGluZyB1cCBhIGxvYWQgb3JkZXIuIEFsdGVybmF0aXZlbHlcclxuICAgIC8vICB0aGUgZ2FtZSBleHRlbnNpb24gaXRzZWxmIG1pZ2h0IGJlIGhhbmRsaW5nIHRoZSBwcmVzb3J0IGZ1bmN0aW9uYWxpdHlcclxuICAgIC8vICBlcnJvbmVvdXNseS4gUmVnYXJkbGVzcywgdGhlIGNvbGxlY3Rpb24gY3JlYXRpb24gc2hvdWxkbid0IGJlIGJsb2NrZWRcclxuICAgIC8vICBieSB0aGUgaW5leGlzdGFuY2Ugb2YgYSBsb2FkT3JkZXIuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbmNsdWRlZE1vZHMgPSBtb2RJZHMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgaWYgKG1vZHNbaXRlcl0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhY2N1bVtpdGVyXSA9IG1vZHNbaXRlcl07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG4gIGNvbnN0IGZpbHRlcmVkTE86IElMb2FkT3JkZXIgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgaW5jbHVkZWRNb2RzKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbHRlcmVkTE8pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBJQ29sbGVjdGlvbnNEYXRhKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuXHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IENvbGxlY3Rpb25QYXJzZUVycm9yKGNvbGxlY3Rpb24/LlsnaW5mbyddPy5bJ25hbWUnXSB8fCAnJywgJ0ludmFsaWQgcHJvZmlsZSBpZCcpKTtcclxuICB9XHJcblxyXG4gIC8vIFRoZSBtb2RzIG5lZWQgdG8gYmUgZGVwbG95ZWQgaW4gb3JkZXIgZm9yIHRoZSBsb2FkIG9yZGVyIHRvIGJlIGltcG9ydGVkXHJcbiAgLy8gIGNvcnJlY3RseS5cclxuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIChlcnIpID0+IHtcclxuICAgICAgaWYgKCEhZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIGNvbGxlY3Rpb24ubG9hZE9yZGVyIGFzIGFueSkpO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcbiJdfQ==