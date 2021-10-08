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
            const loadOrder = yield (0, loadOrder_1.exportLoadOrder)(api.getState(), includedMods);
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
            yield (0, loadOrder_1.importLoadOrder)(api, collection);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.parseCollectionsData = parseCollectionsData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFHcEQsMkNBQStEO0FBRS9ELFNBQXNCLGtCQUFrQixDQUFDLE9BQWdDLEVBQ2hDLE1BQWMsRUFDZCxZQUFzQjs7UUFDN0QsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN4QixJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQWEsTUFBTSxJQUFBLDJCQUFlLEVBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sY0FBYyxHQUF3QjtnQkFDMUMsU0FBUzthQUNWLENBQUM7WUFDRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDeEM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQWJELGdEQWFDO0FBRUQsU0FBc0Isb0JBQW9CLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFVBQStCOztRQUN4RSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNwRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssTUFBTSxFQUFFO1lBQzlCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztTQUNuRjtRQUNELElBQUk7WUFDRixNQUFNLElBQUEsMkJBQWUsRUFBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDeEM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQWZELG9EQWVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBJS0NEQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBleHBvcnRMb2FkT3JkZXIsIGltcG9ydExvYWRPcmRlciB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBsb2FkT3JkZXI6IHN0cmluZ1tdID0gYXdhaXQgZXhwb3J0TG9hZE9yZGVyKGFwaS5nZXRTdGF0ZSgpLCBpbmNsdWRlZE1vZHMpO1xyXG4gICAgY29uc3QgY29sbGVjdGlvbkRhdGE6IElLQ0RDb2xsZWN0aW9uc0RhdGEgPSB7XHJcbiAgICAgIGxvYWRPcmRlcixcclxuICAgIH07XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbGxlY3Rpb25EYXRhKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBJS0NEQ29sbGVjdGlvbnNEYXRhKSB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBnYW1lSWQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gZ2FtZUlkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdMYXN0IGFjdGl2ZSBwcm9maWxlIGlzIG1pc3NpbmcnKSk7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBpbXBvcnRMb2FkT3JkZXIoYXBpLCBjb2xsZWN0aW9uKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG4iXX0=