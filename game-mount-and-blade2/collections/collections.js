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
const collectionUtil_1 = require("./collectionUtil");
function genCollectionsData(context, gameId, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', gameId], {});
        try {
            const loadOrder = yield (0, loadOrder_1.exportLoadOrder)(api.getState(), includedMods, mods);
            const collectionData = { loadOrder };
            return Promise.resolve(collectionData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.genCollectionsData = genCollectionsData;
function parseCollectionsData(context, gameId, collection) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, gameId);
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== gameId) {
            const collectionName = ((_a = collection['info']) === null || _a === void 0 ? void 0 : _a['name']) !== undefined ? collection['info']['name'] : 'Witcher 3 Collection';
            return Promise.reject(new collectionUtil_1.CollectionParseError(collectionName, 'Last active profile is missing'));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFPcEQsMkNBQStEO0FBRS9ELHFEQUF3RDtBQUV4RCxTQUFzQixrQkFBa0IsQ0FBQyxPQUFnQyxFQUNoQyxNQUFjLEVBQ2QsWUFBc0I7O1FBQzdELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE1BQU0sSUFBSSxHQUFvQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzlELENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0QyxJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQWUsTUFBTSxJQUFBLDJCQUFlLEVBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RixNQUFNLGNBQWMsR0FBcUIsRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUN2RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDeEM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQWZELGdEQWVDO0FBRUQsU0FBc0Isb0JBQW9CLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFVBQTRCOzs7UUFDckUsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLE1BQU0sRUFBRTtZQUM5QixNQUFNLGNBQWMsR0FBRyxDQUFBLE1BQUEsVUFBVSxDQUFDLE1BQU0sQ0FBQywwQ0FBRyxNQUFNLENBQUMsTUFBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUM7WUFDeEgsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUkscUNBQW9CLENBQUMsY0FBYyxFQUMzRCxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7U0FDdEM7UUFDRCxJQUFJO1lBQ0YsTUFBTSxJQUFBLDJCQUFlLEVBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3hDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7O0NBQ0Y7QUFqQkQsb0RBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcblxuaW1wb3J0IHsgSUxvYWRPcmRlciB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IElDb2xsZWN0aW9uc0RhdGEgIH0gZnJvbSAnLi90eXBlcyc7XG5cbmltcG9ydCB7IGV4cG9ydExvYWRPcmRlciwgaW1wb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9uUGFyc2VFcnJvciB9IGZyb20gJy4vY29sbGVjdGlvblV0aWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkge1xuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIGdhbWVJZF0sIHt9KTtcbiAgdHJ5IHtcbiAgICBjb25zdCBsb2FkT3JkZXI6IElMb2FkT3JkZXIgPSBhd2FpdCBleHBvcnRMb2FkT3JkZXIoYXBpLmdldFN0YXRlKCksIGluY2x1ZGVkTW9kcywgbW9kcyk7XG4gICAgY29uc3QgY29sbGVjdGlvbkRhdGE6IElDb2xsZWN0aW9uc0RhdGEgPSB7IGxvYWRPcmRlciB9O1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sbGVjdGlvbkRhdGEpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogSUNvbGxlY3Rpb25zRGF0YSkge1xuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZUlkKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gZ2FtZUlkKSB7XG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uWydpbmZvJ10/LlsnbmFtZSddICE9PSB1bmRlZmluZWQgPyBjb2xsZWN0aW9uWydpbmZvJ11bJ25hbWUnXSA6ICdXaXRjaGVyIDMgQ29sbGVjdGlvbic7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uUGFyc2VFcnJvcihjb2xsZWN0aW9uTmFtZSxcbiAgICAgICdMYXN0IGFjdGl2ZSBwcm9maWxlIGlzIG1pc3NpbmcnKSk7XG4gIH1cbiAgdHJ5IHtcbiAgICBhd2FpdCBpbXBvcnRMb2FkT3JkZXIoYXBpLCBjb2xsZWN0aW9uKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cbiJdfQ==