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
exports.migrate100 = migrate100;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFRQSxnQ0FnQ0M7QUF4Q0QsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBc0U7QUFFdEUscUNBQWdEO0FBRWhELE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUUvRSxTQUFzQixVQUFVLENBQUMsR0FBd0IsRUFBRSxVQUFrQjs7UUFDM0UsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDL0MsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQUcsc0JBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQy9ELE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRWpELE1BQU0sU0FBUyxHQUNiLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUVsRixJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQztlQUN0QixDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO2VBQzlCLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFFakMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxxRUFBcUUsQ0FBQyxDQUFDO1lBQ3BGLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFLRCxPQUFPLEdBQUcsQ0FBQyxPQUFPLEVBQUU7YUFDakIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBQSxvQkFBVyxHQUFFLENBQUMsQ0FBQyxDQUFDO2FBQy9FLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUNwQixnQkFBTyxFQUNQLEVBQUUsRUFDRixjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQzthQUN0RSxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1QsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxzQkFBc0IsQ0FBQyxnQkFBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBtb2RzUmVsUGF0aCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmNvbnN0IG9sZE1vZFJlbFBhdGggPSBwYXRoLmpvaW4oJ0Jsb29kc3RhaW5lZFJvdE4nLCAnQ29udGVudCcsICdQYWtzJywgJ35tb2QnKTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTAwKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgb2xkVmVyc2lvbjogc3RyaW5nKSB7XHJcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiB8fCAnMC4wLjEnLCAnMS4wLjAnKSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmF0b3JJZCA9IHNlbGVjdG9ycy5hY3RpdmF0b3JGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBhY3RpdmF0b3IgPSB1dGlsLmdldEFjdGl2YXRvcihhY3RpdmF0b3JJZCk7XHJcblxyXG4gIGNvbnN0IGRpc2NvdmVyeSA9XHJcbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG5cclxuICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZClcclxuICAgICAgfHwgKGFjdGl2YXRvciA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgLy8gaWYgdGhpcyBnYW1lIGlzIG5vdCBkaXNjb3ZlcmVkIG9yIGRlcGxveWVkIHRoZXJlIGlzIG5vIG5lZWQgdG8gbWlncmF0ZVxyXG4gICAgbG9nKCdkZWJ1ZycsICdza2lwcGluZyBibG9vZHN0YWluZWQgbWlncmF0aW9uIGJlY2F1c2Ugbm8gZGVwbG95bWVudCBzZXQgdXAgZm9yIGl0Jyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyB3b3VsZCBiZSBnb29kIHRvIGluZm9ybSB0aGUgdXNlciBiZWZvcmVoYW5kIGJ1dCBzaW5jZSB0aGlzIGlzIHJ1biBpbiB0aGUgbWFpbiBwcm9jZXNzXHJcbiAgLy8gYW5kIHdlIGNhbid0IGN1cnJlbnRseSBzaG93IGEgKHdvcmtpbmcpIGRpYWxvZyBmcm9tIHRoZSBtYWluIHByb2Nlc3MgaXQgaGFzIHRvIGJlXHJcbiAgLy8gdGhpcyB3YXkuXHJcbiAgcmV0dXJuIGFwaS5hd2FpdFVJKClcclxuICAgIC50aGVuKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUmVsUGF0aCgpKSkpXHJcbiAgICAudGhlbigoKSA9PiBhcGkuZW1pdEFuZEF3YWl0KCdwdXJnZS1tb2RzLWluLXBhdGgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBHQU1FX0lELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBvbGRNb2RSZWxQYXRoKSkpXHJcbiAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpO1xyXG4gICAgfSk7XHJcbn1cclxuIl19