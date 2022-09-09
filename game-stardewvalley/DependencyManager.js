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
const semver_1 = require("semver");
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
                    .then(() => Promise.resolve(accum));
            }), {});
            this.mManifests = manifests;
            return Promise.resolve();
        });
    }
    findMissingDependencies(deps) {
        var _a;
        const state = this.mApi.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modIds = Object.keys(mods);
        const activeMods = modIds.filter(isActive);
        const activeManifests = activeMods.reduce((accum, iter) => {
            var _a;
            return ((_a = this.mManifests) === null || _a === void 0 ? void 0 : _a[iter]) !== undefined
                ? accum.concat(this.mManifests[iter])
                : accum;
        }, []);
        const dependencies = ((_a = deps === null || deps === void 0 ? void 0 : deps.length) !== null && _a !== void 0 ? _a : 0 > 0)
            ? deps
            : activeManifests.reduce((accum, iter) => {
                var _a, _b;
                return ((_b = (_a = iter === null || iter === void 0 ? void 0 : iter.Dependencies) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 0)
                    ? accum.concat(iter.Dependencies)
                    : accum;
            }, []);
        const depSatisfied = (dep) => {
            const found = activeManifests.find(man => {
                var _a, _b;
                const idMatch = man.UniqueID === dep.UniqueID;
                const versionMatch = dep.MinimumVersion
                    ? (0, semver_1.gte)((0, semver_1.coerce)((_a = man.Version) !== null && _a !== void 0 ? _a : '0.0.0'), (0, semver_1.coerce)((_b = dep.MinimumVersion) !== null && _b !== void 0 ? _b : '0.0.0'))
                    : true;
                return idMatch && versionMatch;
            });
            return found ? true : !dep.IsRequired;
        };
        const missingDeps = dependencies.filter(dep => !depSatisfied(dep));
        return missingDeps;
    }
}
exports.default = DependencyManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFDeEIsbUNBQXFDO0FBR3JDLE1BQXFCLGlCQUFpQjtJQUtwQyxZQUFZLEdBQXdCO1FBRjVCLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFHaEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDbEIsQ0FBQztJQUVZLFlBQVk7O1lBQ3ZCLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN6QixDQUFDO0tBQUE7SUFFWSxPQUFPOztZQUNsQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2pCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDO0tBQUE7SUFFWSxhQUFhLENBQUMsS0FBZTs7WUFDeEMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDM0MsT0FBTzthQUNSO1lBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDN0QsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3JFLE1B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QUNqQyxDQUFDLENBQUMsS0FBSyxDQUFBO2FBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVuQixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQW1CLEVBQUUsRUFBRTtZQUMzQyxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFOztnQkFDdkMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDO2dCQUM5QyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsY0FBYztvQkFDckMsQ0FBQyxDQUFDLElBQUEsWUFBRyxFQUFDLElBQUEsZUFBTSxFQUFDLE1BQUEsR0FBRyxDQUFDLE9BQU8sbUNBQUksT0FBTyxDQUFDLEVBQUUsSUFBQSxlQUFNLEVBQUMsTUFBQSxHQUFHLENBQUMsY0FBYyxtQ0FBSSxPQUFPLENBQUMsQ0FBQztvQkFDNUUsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDVCxPQUFPLE9BQU8sSUFBSSxZQUFZLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDeEMsQ0FBQyxDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkUsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQztDQUNGO0FBOUZELG9DQThGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBwYXJzZU1hbmlmZXN0IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBjb2VyY2UsIGd0ZSB9IGZyb20gJ3NlbXZlcic7XHJcblxyXG50eXBlIE1hbmlmZXN0TWFwID0geyBbbW9kSWQ6IHN0cmluZ106IElTRFZNb2RNYW5pZmVzdFtdIH07XHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlcGVuZGVuY3lNYW5hZ2VyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtTWFuaWZlc3RzOiBNYW5pZmVzdE1hcDtcclxuICBwcml2YXRlIG1Mb2FkaW5nOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGdldE1hbmlmZXN0cygpOiBQcm9taXNlPE1hbmlmZXN0TWFwPiB7XHJcbiAgICBhd2FpdCB0aGlzLnNjYW5NYW5pZmVzdHMoKTtcclxuICAgIHJldHVybiB0aGlzLm1NYW5pZmVzdHM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICh0aGlzLm1Mb2FkaW5nKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMubUxvYWRpbmcgPSB0cnVlO1xyXG4gICAgYXdhaXQgdGhpcy5zY2FuTWFuaWZlc3RzKHRydWUpO1xyXG4gICAgdGhpcy5tTG9hZGluZyA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNjYW5NYW5pZmVzdHMoZm9yY2U/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAoIWZvcmNlICYmIHRoaXMubU1hbmlmZXN0cyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBzdGFnaW5nID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICBjb25zdCBpc0FjdGl2ZSA9IChtb2RJZDogc3RyaW5nKSA9PiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIG1vZElkLCAnZW5hYmxlZCddLCBmYWxzZSk7XHJcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBPYmplY3QudmFsdWVzKG1vZHMpLnJlZHVjZShhc3luYyAoYWNjdW1QLCBpdGVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QOyAgICAgIFxyXG4gICAgICBpZiAoIWlzQWN0aXZlKGl0ZXIuaWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihzdGFnaW5nLCBpdGVyLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgICByZXR1cm4gdHVyYm93YWxrKG1vZFBhdGgsIGFzeW5jIGVudHJpZXMgPT4ge1xyXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09ICdtYW5pZmVzdC5qc29uJykge1xyXG4gICAgICAgICAgbGV0IG1hbmlmZXN0O1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbWFuaWZlc3QgPSBhd2FpdCBwYXJzZU1hbmlmZXN0KGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgZXJyb3I6IGVyci5tZXNzYWdlLCBtYW5pZmVzdDogZW50cnkuZmlsZVBhdGggfSk7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgbGlzdCA9IGFjY3VtW2l0ZXIuaWRdID8/IFtdO1xyXG4gICAgICAgICAgbGlzdC5wdXNoKG1hbmlmZXN0KTtcclxuICAgICAgICAgIGFjY3VtW2l0ZXIuaWRdID0gbGlzdDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgfSwgeyBza2lwSGlkZGVuOiBmYWxzZSwgcmVjdXJzZTogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlfSlcclxuICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSk7XHJcbiAgICB9LCB7fSk7XHJcbiAgICB0aGlzLm1NYW5pZmVzdHMgPSBtYW5pZmVzdHM7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZmluZE1pc3NpbmdEZXBlbmRlbmNpZXMoZGVwcz86IHN0cmluZ1tdKTogSVNEVkRlcGVuZGVuY3lbXSB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gICAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMobW9kcyk7XHJcbiAgICBjb25zdCBhY3RpdmVNb2RzID0gbW9kSWRzLmZpbHRlcihpc0FjdGl2ZSk7XHJcbiAgICBjb25zdCBhY3RpdmVNYW5pZmVzdHM6IElTRFZNb2RNYW5pZmVzdFtdID0gYWN0aXZlTW9kcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PlxyXG4gICAgICB0aGlzLm1NYW5pZmVzdHM/LltpdGVyXSAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgPyBhY2N1bS5jb25jYXQodGhpcy5tTWFuaWZlc3RzW2l0ZXJdKVxyXG4gICAgICAgIDogYWNjdW0sIFtdKTtcclxuICAgIGNvbnN0IGRlcGVuZGVuY2llczogSVNEVkRlcGVuZGVuY3lbXSA9IChkZXBzPy5sZW5ndGggPz8gMCA+IDApXHJcbiAgICAgID8gZGVwc1xyXG4gICAgICA6IGFjdGl2ZU1hbmlmZXN0cy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PlxyXG4gICAgICAgIChpdGVyPy5EZXBlbmRlbmNpZXM/Lmxlbmd0aCA/PyAwID4gMClcclxuICAgICAgICAgID8gYWNjdW0uY29uY2F0KGl0ZXIuRGVwZW5kZW5jaWVzKVxyXG4gICAgICAgICAgOiBhY2N1bSwgW10pO1xyXG5cclxuICAgIGNvbnN0IGRlcFNhdGlzZmllZCA9IChkZXA6IElTRFZEZXBlbmRlbmN5KSA9PiB7XHJcbiAgICAgIGNvbnN0IGZvdW5kID0gYWN0aXZlTWFuaWZlc3RzLmZpbmQobWFuID0+IHtcclxuICAgICAgICBjb25zdCBpZE1hdGNoID0gbWFuLlVuaXF1ZUlEID09PSBkZXAuVW5pcXVlSUQ7XHJcbiAgICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGVwLk1pbmltdW1WZXJzaW9uXHJcbiAgICAgICAgICA/IGd0ZShjb2VyY2UobWFuLlZlcnNpb24gPz8gJzAuMC4wJyksIGNvZXJjZShkZXAuTWluaW11bVZlcnNpb24gPz8gJzAuMC4wJykpXHJcbiAgICAgICAgICA6IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGlkTWF0Y2ggJiYgdmVyc2lvbk1hdGNoO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGZvdW5kID8gdHJ1ZSA6ICFkZXAuSXNSZXF1aXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgbWlzc2luZ0RlcHMgPSBkZXBlbmRlbmNpZXMuZmlsdGVyKGRlcCA9PiAhZGVwU2F0aXNmaWVkKGRlcCkpO1xyXG4gICAgcmV0dXJuIG1pc3NpbmdEZXBzO1xyXG4gIH1cclxufVxyXG4iXX0=