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
const common_1 = require("./common");
const oldModRelPath = path_1.default.join('BloodstainedRotN', 'Content', 'Paks', '~mod');
function migrate100(api, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion || '0.0.1', '1.0.0')) {
            return Promise.resolve();
        }
        const state = api.store.getState();
        const activatorId = vortex_api_1.selectors.activatorForGame(state, common_1.GAME_ID);
        const activator = vortex_api_1.util.getActivator(activatorId);
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if ((discovery === undefined)
            || (discovery.path === undefined)
            || (activator === undefined)) {
            vortex_api_1.log('debug', 'skipping bloodstained migration because no deployment set up for it');
            return Promise.resolve();
        }
        return api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, common_1.modsRelPath())))
            .then(() => api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', path_1.default.join(discovery.path, oldModRelPath)))
            .then(() => {
            api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true));
        });
    });
}
exports.migrate100 = migrate100;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBc0U7QUFFdEUscUNBQWdEO0FBRWhELE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUUvRSxTQUFzQixVQUFVLENBQUMsR0FBd0IsRUFBRSxVQUFrQjs7UUFDM0UsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQzlDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDL0QsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFakQsTUFBTSxTQUFTLEdBQ2IsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRWxGLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDO2VBQ3RCLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7ZUFDOUIsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLEVBQUU7WUFFaEMsZ0JBQUcsQ0FBQyxPQUFPLEVBQUUscUVBQXFFLENBQUMsQ0FBQztZQUNwRixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUtELE9BQU8sR0FBRyxDQUFDLE9BQU8sRUFBRTthQUNqQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQy9FLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUNwQixnQkFBTyxFQUNQLEVBQUUsRUFDRixjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQzthQUN0RSxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1QsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxzQkFBc0IsQ0FBQyxnQkFBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQUE7QUFoQ0QsZ0NBZ0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgbW9kc1JlbFBhdGggfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5jb25zdCBvbGRNb2RSZWxQYXRoID0gcGF0aC5qb2luKCdCbG9vZHN0YWluZWRSb3ROJywgJ0NvbnRlbnQnLCAnUGFrcycsICd+bW9kJyk7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTEwMChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG9sZFZlcnNpb246IHN0cmluZykge1xyXG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24gfHwgJzAuMC4xJywgJzEuMC4wJykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZhdG9ySWQgPSBzZWxlY3RvcnMuYWN0aXZhdG9yRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgYWN0aXZhdG9yID0gdXRpbC5nZXRBY3RpdmF0b3IoYWN0aXZhdG9ySWQpO1xyXG5cclxuICBjb25zdCBkaXNjb3ZlcnkgPVxyXG4gICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZClcclxuICAgICAgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpXHJcbiAgICAgIHx8IChhY3RpdmF0b3IgPT09IHVuZGVmaW5lZCkpIHtcclxuICAgIC8vIGlmIHRoaXMgZ2FtZSBpcyBub3QgZGlzY292ZXJlZCBvciBkZXBsb3llZCB0aGVyZSBpcyBubyBuZWVkIHRvIG1pZ3JhdGVcclxuICAgIGxvZygnZGVidWcnLCAnc2tpcHBpbmcgYmxvb2RzdGFpbmVkIG1pZ3JhdGlvbiBiZWNhdXNlIG5vIGRlcGxveW1lbnQgc2V0IHVwIGZvciBpdCcpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgLy8gd291bGQgYmUgZ29vZCB0byBpbmZvcm0gdGhlIHVzZXIgYmVmb3JlaGFuZCBidXQgc2luY2UgdGhpcyBpcyBydW4gaW4gdGhlIG1haW4gcHJvY2Vzc1xyXG4gIC8vIGFuZCB3ZSBjYW4ndCBjdXJyZW50bHkgc2hvdyBhICh3b3JraW5nKSBkaWFsb2cgZnJvbSB0aGUgbWFpbiBwcm9jZXNzIGl0IGhhcyB0byBiZVxyXG4gIC8vIHRoaXMgd2F5LlxyXG4gIHJldHVybiBhcGkuYXdhaXRVSSgpXHJcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1JlbFBhdGgoKSkpKVxyXG4gICAgLnRoZW4oKCkgPT4gYXBpLmVtaXRBbmRBd2FpdCgncHVyZ2UtbW9kcy1pbi1wYXRoJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgR0FNRV9JRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgb2xkTW9kUmVsUGF0aCkpKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpKTtcclxuICAgIH0pO1xyXG59XHJcbiJdfQ==