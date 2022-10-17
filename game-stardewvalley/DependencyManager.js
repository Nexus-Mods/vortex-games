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
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const path_1 = __importDefault(require("path"));
class DependencyManager {
    constructor(api) {
        this.mLoading = false;
        this.mApi = api;
    }
    getManifests() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.scanManifests();
            return this.mManifests;
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mLoading) {
                return;
            }
            this.mLoading = true;
            yield this.scanManifests(true);
            this.mLoading = false;
        });
    }
    scanManifests(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!force && this.mManifests !== undefined) {
                return;
            }
            const state = this.mApi.getState();
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
            const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
            const manifests = yield Object.values(mods).reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
                const accum = yield accumP;
                if (!isActive(iter.id)) {
                    return Promise.resolve(accum);
                }
                const modPath = path_1.default.join(staging, iter.installationPath);
                return (0, turbowalk_1.default)(modPath, (entries) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    for (const entry of entries) {
                        if (path_1.default.basename(entry.filePath) === 'manifest.json') {
                            let manifest;
                            try {
                                manifest = yield (0, util_1.parseManifest)(entry.filePath);
                            }
                            catch (err) {
                                (0, vortex_api_1.log)('error', 'failed to parse manifest', { error: err.message, manifest: entry.filePath });
                                continue;
                            }
                            const list = (_a = accum[iter.id]) !== null && _a !== void 0 ? _a : [];
                            list.push(manifest);
                            accum[iter.id] = list;
                        }
                    }
                }), { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
                    .then(() => Promise.resolve(accum))
                    .catch(err => {
                    if (err['code'] === 'ENOENT') {
                        return Promise.resolve([]);
                    }
                    else {
                        return Promise.reject(err);
                    }
                });
            }), {});
            this.mManifests = manifests;
            return Promise.resolve();
        });
    }
}
exports.default = DependencyManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLDBEQUFrQztBQUNsQywyQ0FBeUQ7QUFDekQscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFHeEIsTUFBcUIsaUJBQWlCO0lBS3BDLFlBQVksR0FBd0I7UUFGNUIsYUFBUSxHQUFZLEtBQUssQ0FBQztRQUdoQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUNsQixDQUFDO0lBRVksWUFBWTs7WUFDdkIsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVZLE9BQU87O1lBQ2xCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDakIsT0FBTzthQUNSO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDckIsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLENBQUM7S0FBQTtJQUVZLGFBQWEsQ0FBQyxLQUFlOztZQUN4QyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUMzQyxPQUFPO2FBQ1I7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztZQUM3RCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDckUsTUFBTSxPQUFPLEdBQUcs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cGVzJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG50eXBlIE1hbmlmZXN0TWFwID0geyBbbW9kSWQ6IHN0cmluZ106IElTRFZNb2RNYW5pZmVzdFtdIH07XHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlcGVuZGVuY3lNYW5hZ2VyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtTWFuaWZlc3RzOiBNYW5pZmVzdE1hcDtcclxuICBwcml2YXRlIG1Mb2FkaW5nOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGdldE1hbmlmZXN0cygpOiBQcm9taXNlPE1hbmlmZXN0TWFwPiB7XHJcbiAgICBhd2FpdCB0aGlzLnNjYW5NYW5pZmVzdHMoKTtcclxuICAgIHJldHVybiB0aGlzLm1NYW5pZmVzdHM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICh0aGlzLm1Mb2FkaW5nKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMubUxvYWRpbmcgPSB0cnVlO1xyXG4gICAgYXdhaXQgdGhpcy5zY2FuTWFuaWZlc3RzKHRydWUpO1xyXG4gICAgdGhpcy5tTG9hZGluZyA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNjYW5NYW5pZmVzdHMoZm9yY2U/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAoIWZvcmNlICYmIHRoaXMubU1hbmlmZXN0cyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBzdGFnaW5nID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICBjb25zdCBpc0FjdGl2ZSA9IChtb2RJZDogc3RyaW5nKSA9PiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIG1vZElkLCAnZW5hYmxlZCddLCBmYWxzZSk7XHJcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBPYmplY3QudmFsdWVzKG1vZHMpLnJlZHVjZShhc3luYyAoYWNjdW1QLCBpdGVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QOyAgICAgIFxyXG4gICAgICBpZiAoIWlzQWN0aXZlKGl0ZXIuaWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihzdGFnaW5nLCBpdGVyLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgICByZXR1cm4gdHVyYm93YWxrKG1vZFBhdGgsIGFzeW5jIGVudHJpZXMgPT4ge1xyXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09ICdtYW5pZmVzdC5qc29uJykge1xyXG4gICAgICAgICAgbGV0IG1hbmlmZXN0O1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbWFuaWZlc3QgPSBhd2FpdCBwYXJzZU1hbmlmZXN0KGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgZXJyb3I6IGVyci5tZXNzYWdlLCBtYW5pZmVzdDogZW50cnkuZmlsZVBhdGggfSk7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgbGlzdCA9IGFjY3VtW2l0ZXIuaWRdID8/IFtdO1xyXG4gICAgICAgICAgbGlzdC5wdXNoKG1hbmlmZXN0KTtcclxuICAgICAgICAgIGFjY3VtW2l0ZXIuaWRdID0gbGlzdDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgfSwgeyBza2lwSGlkZGVuOiBmYWxzZSwgcmVjdXJzZTogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlfSlcclxuICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcclxuICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgaWYgKGVyclsnY29kZSddID09PSAnRU5PRU5UJykge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9LCB7fSk7XHJcbiAgICB0aGlzLm1NYW5pZmVzdHMgPSBtYW5pZmVzdHM7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==