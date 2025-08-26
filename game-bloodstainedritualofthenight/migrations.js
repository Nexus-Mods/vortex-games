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
            (0, vortex_api_1.log)('debug', 'skipping bloodstained migration because no deployment set up for it');
            return Promise.resolve();
        }
        return api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, (0, common_1.modsRelPath)())))
            .then(() => api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', path_1.default.join(discovery.path, oldModRelPath)))
            .then(() => {
            api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true));
        });
    });
}
exports.migrate100 = migrate100;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBc0U7QUFFdEUscUNBQWdEO0FBRWhELE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUUvRSxTQUFzQixVQUFVLENBQUMsR0FBd0IsRUFBRSxVQUFrQjs7UUFDM0UsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQzlDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDL0QsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFakQsTUFBTSxTQUFTLEdBQ2IsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRWxGLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDO2VBQ3RCLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7ZUFDOUIsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLEVBQUU7WUFFaEMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxxRUFBcUUsQ0FBQyxDQUFDO1lBQ3BGLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBS0QsT0FBTyxHQUFHLENBQUMsT0FBTyxFQUFFO2FBQ2pCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsc0JBQXNCLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUEsb0JBQVcsR0FBRSxDQUFDLENBQUMsQ0FBQzthQUMvRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFDcEIsZ0JBQU8sRUFDUCxFQUFFLEVBQ0YsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7YUFDdEUsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNULEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsc0JBQXNCLENBQUMsZ0JBQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUFBO0FBaENELGdDQWdDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIG1vZHNSZWxQYXRoIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuY29uc3Qgb2xkTW9kUmVsUGF0aCA9IHBhdGguam9pbignQmxvb2RzdGFpbmVkUm90TicsICdDb250ZW50JywgJ1Bha3MnLCAnfm1vZCcpO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMDAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvbGRWZXJzaW9uOiBzdHJpbmcpIHtcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uIHx8ICcwLjAuMScsICcxLjAuMCcpKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2YXRvcklkID0gc2VsZWN0b3JzLmFjdGl2YXRvckZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGFjdGl2YXRvciA9IHV0aWwuZ2V0QWN0aXZhdG9yKGFjdGl2YXRvcklkKTtcclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5ID1cclxuICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcblxyXG4gIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpXHJcbiAgICAgIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICB8fCAoYWN0aXZhdG9yID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAvLyBpZiB0aGlzIGdhbWUgaXMgbm90IGRpc2NvdmVyZWQgb3IgZGVwbG95ZWQgdGhlcmUgaXMgbm8gbmVlZCB0byBtaWdyYXRlXHJcbiAgICBsb2coJ2RlYnVnJywgJ3NraXBwaW5nIGJsb29kc3RhaW5lZCBtaWdyYXRpb24gYmVjYXVzZSBubyBkZXBsb3ltZW50IHNldCB1cCBmb3IgaXQnKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIC8vIHdvdWxkIGJlIGdvb2QgdG8gaW5mb3JtIHRoZSB1c2VyIGJlZm9yZWhhbmQgYnV0IHNpbmNlIHRoaXMgaXMgcnVuIGluIHRoZSBtYWluIHByb2Nlc3NcclxuICAvLyBhbmQgd2UgY2FuJ3QgY3VycmVudGx5IHNob3cgYSAod29ya2luZykgZGlhbG9nIGZyb20gdGhlIG1haW4gcHJvY2VzcyBpdCBoYXMgdG8gYmVcclxuICAvLyB0aGlzIHdheS5cclxuICByZXR1cm4gYXBpLmF3YWl0VUkoKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNSZWxQYXRoKCkpKSlcclxuICAgIC50aGVuKCgpID0+IGFwaS5lbWl0QW5kQXdhaXQoJ3B1cmdlLW1vZHMtaW4tcGF0aCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdBTUVfSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG9sZE1vZFJlbFBhdGgpKSlcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSk7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=