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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate100 = void 0;
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const loadOrder_1 = require("./loadOrder");
const common_1 = require("./common");
function migrate100(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.0.0')) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const discoveryPath = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'path'], undefined);
        const activatorId = vortex_api_1.selectors.activatorForGame(state, common_1.GAME_ID);
        const activator = vortex_api_1.util.getActivator(activatorId);
        if (discoveryPath === undefined || activator === undefined) {
            return Promise.resolve();
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        if (Object.keys(mods).length === 0) {
            return Promise.resolve();
        }
        const profiles = vortex_api_1.util.getSafe(state, ['persistent', 'profiles'], {});
        const loProfiles = Object.keys(profiles).filter(id => { var _a; return ((_a = profiles[id]) === null || _a === void 0 ? void 0 : _a.gameId) === common_1.GAME_ID; });
        const loMap = loProfiles.reduce((accum, iter) => {
            const current = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', iter], []);
            const newLO = current.map(entry => {
                return {
                    enabled: true,
                    name: (mods[entry] !== undefined)
                        ? vortex_api_1.util.renderModName(mods[entry])
                        : entry,
                    id: entry,
                    modId: entry,
                };
            });
            accum[iter] = newLO;
            return accum;
        }, {});
        for (const profileId of Object.keys(loMap)) {
            yield (0, loadOrder_1.serialize)(context, loMap[profileId], profileId);
        }
        const modsPath = path_1.default.join(discoveryPath, (0, common_1.modsRelPath)());
        return context.api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(modsPath))
            .then(() => context.api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', modsPath))
            .then(() => context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true)));
    });
}
exports.migrate100 = migrate100;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBaUU7QUFDakUsMkNBQXdDO0FBRXhDLHFDQUFnRDtBQUdoRCxTQUFzQixVQUFVLENBQUMsT0FBTyxFQUFFLFVBQVU7O1FBQ2xELElBQUksZ0JBQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQ25DLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0MsTUFBTSxhQUFhLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN0QyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLEVBQUUsTUFBTSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdEUsTUFBTSxXQUFXLEdBQUcsc0JBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQy9ELE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pELElBQUksYUFBYSxLQUFLLFNBQVMsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQzFELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsTUFBTSxJQUFJLEdBQW9DLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDOUQsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNsQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sUUFBUSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNyRSxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxXQUFDLE9BQUEsQ0FBQSxNQUFBLFFBQVEsQ0FBQyxFQUFFLENBQUMsMENBQUUsTUFBTSxNQUFLLGdCQUFPLENBQUEsRUFBQSxDQUFDLENBQUM7UUFDeEYsTUFBTSxLQUFLLEdBQW9DLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDL0UsTUFBTSxPQUFPLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzRSxNQUFNLEtBQUssR0FBYyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMzQyxPQUFPO29CQUNMLE9BQU8sRUFBRSxJQUFJO29CQUNiLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLENBQUM7d0JBQy9CLENBQUMsQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ2pDLENBQUMsQ0FBQyxLQUFLO29CQUNULEVBQUUsRUFBRSxLQUFLO29CQUNULEtBQUssRUFBRSxLQUFLO2lCQUNiLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDcEIsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFUCxLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDMUMsTUFBTSxJQUFBLHFCQUFTLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUN2RDtRQUVELE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUEsb0JBQVcsR0FBRSxDQUFDLENBQUM7UUFDekQsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRTthQUN6QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBRSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQy9DLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxnQkFBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNqRixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsc0JBQXNCLENBQUMsZ0JBQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0YsQ0FBQztDQUFBO0FBL0NELGdDQStDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IHNlcmlhbGl6ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgbW9kc1JlbFBhdGggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMDAoY29udGV4dCwgb2xkVmVyc2lvbikge1xuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCAnMS4wLjAnKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5UGF0aCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAncGF0aCddLCB1bmRlZmluZWQpO1xuICBjb25zdCBhY3RpdmF0b3JJZCA9IHNlbGVjdG9ycy5hY3RpdmF0b3JGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgYWN0aXZhdG9yID0gdXRpbC5nZXRBY3RpdmF0b3IoYWN0aXZhdG9ySWQpO1xuICBpZiAoZGlzY292ZXJ5UGF0aCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2YXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGlmIChPYmplY3Qua2V5cyhtb2RzKS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBwcm9maWxlcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJ10sIHt9KTtcbiAgY29uc3QgbG9Qcm9maWxlcyA9IE9iamVjdC5rZXlzKHByb2ZpbGVzKS5maWx0ZXIoaWQgPT4gcHJvZmlsZXNbaWRdPy5nYW1lSWQgPT09IEdBTUVfSUQpO1xuICBjb25zdCBsb01hcDogeyBbcHJvZklkOiBzdHJpbmddOiBMb2FkT3JkZXIgfSA9IGxvUHJvZmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBpdGVyXSwgW10pO1xuICAgIGNvbnN0IG5ld0xPOiBMb2FkT3JkZXIgPSBjdXJyZW50Lm1hcChlbnRyeSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBuYW1lOiAobW9kc1tlbnRyeV0gIT09IHVuZGVmaW5lZClcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW2VudHJ5XSlcbiAgICAgICAgICA6IGVudHJ5LFxuICAgICAgICBpZDogZW50cnksXG4gICAgICAgIG1vZElkOiBlbnRyeSxcbiAgICAgIH07XG4gICAgfSk7XG4gICAgYWNjdW1baXRlcl0gPSBuZXdMTztcbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcblxuICBmb3IgKGNvbnN0IHByb2ZpbGVJZCBvZiBPYmplY3Qua2V5cyhsb01hcCkpIHtcbiAgICBhd2FpdCBzZXJpYWxpemUoY29udGV4dCwgbG9NYXBbcHJvZmlsZUlkXSwgcHJvZmlsZUlkKTtcbiAgfVxuXG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsIG1vZHNSZWxQYXRoKCkpO1xuICByZXR1cm4gY29udGV4dC5hcGkuYXdhaXRVSSgpXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCkpXG4gICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuZW1pdEFuZEF3YWl0KCdwdXJnZS1tb2RzLWluLXBhdGgnLCBHQU1FX0lELCAnJywgbW9kc1BhdGgpKVxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSkpO1xufVxuIl19