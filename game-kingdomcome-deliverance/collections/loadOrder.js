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
const statics_1 = require("../statics");
const util_1 = require("../util");
function exportLoadOrder(state, modIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, statics_1.GAME_ID);
        if (profileId === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Invalid profile id'));
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], []);
        if (!loadOrder) {
            return Promise.resolve(undefined);
        }
        const filteredLO = loadOrder.filter(lo => modIds.some(id => (0, util_1.transformId)(id) === lo));
        return Promise.resolve(filteredLO);
    });
}
exports.exportLoadOrder = exportLoadOrder;
function importLoadOrder(api, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, statics_1.GAME_ID);
        if (profileId === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled(`Invalid profile id ${profileId}`));
        }
        api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, collection.loadOrder));
        return Promise.resolve(undefined);
    });
}
exports.importLoadOrder = importLoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCx3Q0FBcUM7QUFDckMsa0NBQXNDO0FBSXRDLFNBQXNCLGVBQWUsQ0FBQyxLQUFtQixFQUNuQixNQUFnQjs7UUFFcEQsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsaUJBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDdkU7UUFFRCxNQUFNLFNBQVMsR0FBYSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVGLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDZCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLFVBQVUsR0FBYSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUEsa0JBQVcsRUFBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9GLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUFmRCwwQ0FlQztBQUVELFNBQXNCLGVBQWUsQ0FBQyxHQUF3QixFQUN4QixVQUErQjs7UUFDbkUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGlCQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMsc0JBQXNCLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNwRjtRQUVELEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDakYsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Q0FBQTtBQVhELDBDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9ucywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4uL3N0YXRpY3MnO1xuaW1wb3J0IHsgdHJhbnNmb3JtSWQgfSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHsgSUtDRENvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0TG9hZE9yZGVyKHN0YXRlOiB0eXBlcy5JU3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkczogc3RyaW5nW10pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnSW52YWxpZCBwcm9maWxlIGlkJykpO1xuICB9XG5cbiAgY29uc3QgbG9hZE9yZGVyOiBzdHJpbmdbXSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcbiAgaWYgKCFsb2FkT3JkZXIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb25zdCBmaWx0ZXJlZExPOiBzdHJpbmdbXSA9IGxvYWRPcmRlci5maWx0ZXIobG8gPT4gbW9kSWRzLnNvbWUoaWQgPT4gdHJhbnNmb3JtSWQoaWQpID09PSBsbykpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbHRlcmVkTE8pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogSUtDRENvbGxlY3Rpb25zRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKGBJbnZhbGlkIHByb2ZpbGUgaWQgJHtwcm9maWxlSWR9YCkpO1xuICB9XG5cbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgY29sbGVjdGlvbi5sb2FkT3JkZXIgYXMgYW55KSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbn1cbiJdfQ==