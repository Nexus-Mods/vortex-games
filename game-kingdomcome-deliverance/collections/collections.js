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
exports.parseCollectionsData = exports.genCollectionsData = void 0;
const vortex_api_1 = require("vortex-api");
const loadOrder_1 = require("./loadOrder");
function genCollectionsData(context, gameId, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        try {
            const loadOrder = yield loadOrder_1.exportLoadOrder(api.getState(), includedMods);
            const collectionData = {
                loadOrder,
            };
            return Promise.resolve(collectionData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.genCollectionsData = genCollectionsData;
function parseCollectionsData(context, gameId, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, gameId);
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== gameId) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Last active profile is missing'));
        }
        try {
            yield loadOrder_1.importLoadOrder(api, collection);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.parseCollectionsData = parseCollectionsData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFHcEQsMkNBQStEO0FBRS9ELFNBQXNCLGtCQUFrQixDQUFDLE9BQWdDLEVBQ2hDLE1BQWMsRUFDZCxZQUFzQjs7UUFDN0QsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN4QixJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQWEsTUFBTSwyQkFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNoRixNQUFNLGNBQWMsR0FBd0I7Z0JBQzFDLFNBQVM7YUFDVixDQUFDO1lBQ0YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3hDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUE7QUFiRCxnREFhQztBQUVELFNBQXNCLG9CQUFvQixDQUFDLE9BQWdDLEVBQ2hDLE1BQWMsRUFDZCxVQUErQjs7UUFDeEUsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLE1BQU0sRUFBRTtZQUM5QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7U0FDbkY7UUFDRCxJQUFJO1lBQ0YsTUFBTSwyQkFBZSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUN4QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBZkQsb0RBZUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IElLQ0RDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IGV4cG9ydExvYWRPcmRlciwgaW1wb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdKSB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGxvYWRPcmRlcjogc3RyaW5nW10gPSBhd2FpdCBleHBvcnRMb2FkT3JkZXIoYXBpLmdldFN0YXRlKCksIGluY2x1ZGVkTW9kcyk7XHJcbiAgICBjb25zdCBjb2xsZWN0aW9uRGF0YTogSUtDRENvbGxlY3Rpb25zRGF0YSA9IHtcclxuICAgICAgbG9hZE9yZGVyLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sbGVjdGlvbkRhdGEpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElLQ0RDb2xsZWN0aW9uc0RhdGEpIHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIGdhbWVJZCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBnYW1lSWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0xhc3QgYWN0aXZlIHByb2ZpbGUgaXMgbWlzc2luZycpKTtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGltcG9ydExvYWRPcmRlcihhcGksIGNvbGxlY3Rpb24pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcbiJdfQ==