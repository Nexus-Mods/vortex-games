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
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], undefined);
        if (loadOrder === undefined) {
            return Promise.resolve(undefined);
        }
        const filteredLO = loadOrder.filter(lo => modIds.find(id => (0, util_1.transformId)(id) === lo) !== undefined);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCx3Q0FBcUM7QUFDckMsa0NBQXNDO0FBSXRDLFNBQXNCLGVBQWUsQ0FBQyxLQUFtQixFQUNuQixNQUFnQjs7UUFFcEQsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsaUJBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDdkU7UUFFRCxNQUFNLFNBQVMsR0FBYSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzVDLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxVQUFVLEdBQWEsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUNqRCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBQSxrQkFBVyxFQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO1FBQzNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUFqQkQsMENBaUJDO0FBRUQsU0FBc0IsZUFBZSxDQUFDLEdBQXdCLEVBQ3hCLFVBQStCOztRQUNuRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFN0IsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsaUJBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3BGO1FBRUQsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxTQUFnQixDQUFDLENBQUMsQ0FBQztRQUNqRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEMsQ0FBQztDQUFBO0FBWEQsMENBV0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY3Rpb25zLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi4vc3RhdGljcyc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1JZCB9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQgeyBJS0NEQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRMb2FkT3JkZXIoc3RhdGU6IHR5cGVzLklTdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWRzOiBzdHJpbmdbXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdJbnZhbGlkIHByb2ZpbGUgaWQnKSk7XG4gIH1cblxuICBjb25zdCBsb2FkT3JkZXI6IHN0cmluZ1tdID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCB1bmRlZmluZWQpO1xuICBpZiAobG9hZE9yZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb25zdCBmaWx0ZXJlZExPOiBzdHJpbmdbXSA9IGxvYWRPcmRlci5maWx0ZXIobG8gPT5cbiAgICBtb2RJZHMuZmluZChpZCA9PiB0cmFuc2Zvcm1JZChpZCkgPT09IGxvKSAhPT0gdW5kZWZpbmVkKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaWx0ZXJlZExPKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElLQ0RDb2xsZWN0aW9uc0RhdGEpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcblxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZChgSW52YWxpZCBwcm9maWxlIGlkICR7cHJvZmlsZUlkfWApKTtcbiAgfVxuXG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIGNvbGxlY3Rpb24ubG9hZE9yZGVyIGFzIGFueSkpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG59XG4iXX0=