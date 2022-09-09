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
            return found ? true : dep.IsRequired === false;
        };
        const missingDeps = dependencies.filter(dep => !depSatisfied(dep));
        return missingDeps;
    }
}
exports.default = DependencyManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFDeEIsbUNBQXFDO0FBR3JDLE1BQXFCLGlCQUFpQjtJQUtwQyxZQUFZLEdBQXdCO1FBRjVCLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFHaEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDbEIsQ0FBQztJQUVZLFlBQVk7O1lBQ3ZCLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN6QixDQUFDO0tBQUE7SUFFWSxPQUFPOztZQUNsQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2pCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDO0tBQUE7SUFFWSxhQUFhLENBQUMsS0FBZTs7WUFDeEMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDM0MsT0FBTzthQUNSO1lBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDN0QsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3JFLE1B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QUNqQyxDQUFDLENBQUMsS0FBSyxDQUFBO2FBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVuQixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQW1CLEVBQUUsRUFBRTtZQUMzQyxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFOztnQkFDdkMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDO2dCQUM5QyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsY0FBYztvQkFDckMsQ0FBQyxDQUFDLElBQUEsWUFBRyxFQUFDLElBQUEsZUFBTSxFQUFDLE1BQUEsR0FBRyxDQUFDLE9BQU8sbUNBQUksT0FBTyxDQUFDLEVBQUUsSUFBQSxlQUFNLEVBQUMsTUFBQSxHQUFHLENBQUMsY0FBYyxtQ0FBSSxPQUFPLENBQUMsQ0FBQztvQkFDNUUsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDVCxPQUFPLE9BQU8sSUFBSSxZQUFZLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQztRQUNqRCxDQUFDLENBQUM7UUFFRixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuRSxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUE5RkQsb0NBOEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSVNEVkRlcGVuZGVuY3ksIElTRFZNb2RNYW5pZmVzdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGNvZXJjZSwgZ3RlIH0gZnJvbSAnc2VtdmVyJztcclxuXHJcbnR5cGUgTWFuaWZlc3RNYXAgPSB7IFttb2RJZDogc3RyaW5nXTogSVNEVk1vZE1hbmlmZXN0W10gfTtcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVwZW5kZW5jeU1hbmFnZXIge1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1NYW5pZmVzdHM6IE1hbmlmZXN0TWFwO1xyXG4gIHByaXZhdGUgbUxvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZ2V0TWFuaWZlc3RzKCk6IFByb21pc2U8TWFuaWZlc3RNYXA+IHtcclxuICAgIGF3YWl0IHRoaXMuc2Nhbk1hbmlmZXN0cygpO1xyXG4gICAgcmV0dXJuIHRoaXMubU1hbmlmZXN0cztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyByZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKHRoaXMubUxvYWRpbmcpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tTG9hZGluZyA9IHRydWU7XHJcbiAgICBhd2FpdCB0aGlzLnNjYW5NYW5pZmVzdHModHJ1ZSk7XHJcbiAgICB0aGlzLm1Mb2FkaW5nID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2Nhbk1hbmlmZXN0cyhmb3JjZT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghZm9yY2UgJiYgdGhpcy5tTWFuaWZlc3RzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgIGNvbnN0IGlzQWN0aXZlID0gKG1vZElkOiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKTtcclxuICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IE9iamVjdC52YWx1ZXMobW9kcykucmVkdWNlKGFzeW5jIChhY2N1bVAsIGl0ZXIpID0+IHtcclxuICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7ICAgICAgXHJcbiAgICAgIGlmICghaXNBY3RpdmUoaXRlci5pZCkpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKHN0YWdpbmcsIGl0ZXIuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICAgIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XHJcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xyXG4gICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gJ21hbmlmZXN0Lmpzb24nKSB7XHJcbiAgICAgICAgICBsZXQgbWFuaWZlc3Q7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBtYW5pZmVzdCA9IGF3YWl0IHBhcnNlTWFuaWZlc3QoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBlcnJvcjogZXJyLm1lc3NhZ2UsIG1hbmlmZXN0OiBlbnRyeS5maWxlUGF0aCB9KTtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBsaXN0ID0gYWNjdW1baXRlci5pZF0gPz8gW107XHJcbiAgICAgICAgICBsaXN0LnB1c2gobWFuaWZlc3QpO1xyXG4gICAgICAgICAgYWNjdW1baXRlci5pZF0gPSBsaXN0O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWV9KVxyXG4gICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoYWNjdW0pKTtcclxuICAgIH0sIHt9KTtcclxuICAgIHRoaXMubU1hbmlmZXN0cyA9IG1hbmlmZXN0cztcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBmaW5kTWlzc2luZ0RlcGVuZGVuY2llcyhkZXBzPzogc3RyaW5nW10pOiBJU0RWRGVwZW5kZW5jeVtdIHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICBjb25zdCBpc0FjdGl2ZSA9IChtb2RJZDogc3RyaW5nKSA9PiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIG1vZElkLCAnZW5hYmxlZCddLCBmYWxzZSk7XHJcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICAgIGNvbnN0IGFjdGl2ZU1vZHMgPSBtb2RJZHMuZmlsdGVyKGlzQWN0aXZlKTtcclxuICAgIGNvbnN0IGFjdGl2ZU1hbmlmZXN0czogSVNEVk1vZE1hbmlmZXN0W10gPSBhY3RpdmVNb2RzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+XHJcbiAgICAgIHRoaXMubU1hbmlmZXN0cz8uW2l0ZXJdICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IGFjY3VtLmNvbmNhdCh0aGlzLm1NYW5pZmVzdHNbaXRlcl0pXHJcbiAgICAgICAgOiBhY2N1bSwgW10pO1xyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzOiBJU0RWRGVwZW5kZW5jeVtdID0gKGRlcHM/Lmxlbmd0aCA/PyAwID4gMClcclxuICAgICAgPyBkZXBzXHJcbiAgICAgIDogYWN0aXZlTWFuaWZlc3RzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+XHJcbiAgICAgICAgKGl0ZXI/LkRlcGVuZGVuY2llcz8ubGVuZ3RoID8/IDAgPiAwKVxyXG4gICAgICAgICAgPyBhY2N1bS5jb25jYXQoaXRlci5EZXBlbmRlbmNpZXMpXHJcbiAgICAgICAgICA6IGFjY3VtLCBbXSk7XHJcblxyXG4gICAgY29uc3QgZGVwU2F0aXNmaWVkID0gKGRlcDogSVNEVkRlcGVuZGVuY3kpID0+IHtcclxuICAgICAgY29uc3QgZm91bmQgPSBhY3RpdmVNYW5pZmVzdHMuZmluZChtYW4gPT4ge1xyXG4gICAgICAgIGNvbnN0IGlkTWF0Y2ggPSBtYW4uVW5pcXVlSUQgPT09IGRlcC5VbmlxdWVJRDtcclxuICAgICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSBkZXAuTWluaW11bVZlcnNpb25cclxuICAgICAgICAgID8gZ3RlKGNvZXJjZShtYW4uVmVyc2lvbiA/PyAnMC4wLjAnKSwgY29lcmNlKGRlcC5NaW5pbXVtVmVyc2lvbiA/PyAnMC4wLjAnKSlcclxuICAgICAgICAgIDogdHJ1ZTtcclxuICAgICAgICByZXR1cm4gaWRNYXRjaCAmJiB2ZXJzaW9uTWF0Y2g7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gZm91bmQgPyB0cnVlIDogZGVwLklzUmVxdWlyZWQgPT09IGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBtaXNzaW5nRGVwcyA9IGRlcGVuZGVuY2llcy5maWx0ZXIoZGVwID0+ICFkZXBTYXRpc2ZpZWQoZGVwKSk7XHJcbiAgICByZXR1cm4gbWlzc2luZ0RlcHM7XHJcbiAgfVxyXG59XHJcbiJdfQ==