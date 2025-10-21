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
exports.exportLoadOrder = exportLoadOrder;
exports.importLoadOrder = importLoadOrder;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBTUEsMENBZUM7QUFFRCwwQ0FXQztBQWxDRCwyQ0FBNkQ7QUFDN0Qsd0NBQXFDO0FBQ3JDLGtDQUFzQztBQUl0QyxTQUFzQixlQUFlLENBQUMsS0FBbUIsRUFDbkIsTUFBZ0I7O1FBRXBELE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGlCQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUM1QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFhLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUYsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxNQUFNLFVBQVUsR0FBYSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUEsa0JBQVcsRUFBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9GLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUFFRCxTQUFzQixlQUFlLENBQUMsR0FBd0IsRUFDeEIsVUFBK0I7O1FBQ25FLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUU3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxpQkFBTyxDQUFDLENBQUM7UUFDckUsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDNUIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMsc0JBQXNCLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRUQsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxTQUFnQixDQUFDLENBQUMsQ0FBQztRQUNqRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEMsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9ucywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi4vc3RhdGljcyc7XHJcbmltcG9ydCB7IHRyYW5zZm9ybUlkIH0gZnJvbSAnLi4vdXRpbCc7XHJcblxyXG5pbXBvcnQgeyBJS0NEQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0TG9hZE9yZGVyKHN0YXRlOiB0eXBlcy5JU3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWRzOiBzdHJpbmdbXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0ludmFsaWQgcHJvZmlsZSBpZCcpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlcjogc3RyaW5nW10gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgaWYgKCFsb2FkT3JkZXIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGZpbHRlcmVkTE86IHN0cmluZ1tdID0gbG9hZE9yZGVyLmZpbHRlcihsbyA9PiBtb2RJZHMuc29tZShpZCA9PiB0cmFuc2Zvcm1JZChpZCkgPT09IGxvKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaWx0ZXJlZExPKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogSUtDRENvbGxlY3Rpb25zRGF0YSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcblxyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZChgSW52YWxpZCBwcm9maWxlIGlkICR7cHJvZmlsZUlkfWApKTtcclxuICB9XHJcblxyXG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIGNvbGxlY3Rpb24ubG9hZE9yZGVyIGFzIGFueSkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxufVxyXG4iXX0=