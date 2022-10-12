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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFDeEIsbUNBQXFDO0FBR3JDLE1BQXFCLGlCQUFpQjtJQUtwQyxZQUFZLEdBQXdCO1FBRjVCLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFHaEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDbEIsQ0FBQztJQUVZLFlBQVk7O1lBQ3ZCLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN6QixDQUFDO0tBQUE7SUFFWSxPQUFPOztZQUNsQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2pCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDO0tBQUE7SUFFWSxhQUFhLENBQUMsS0FBZTs7WUFDeEMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDM0MsT0FBTzthQUNSO1lBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDN0QsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3JFLE1B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Q0FDRjtBQXJHRCxvQ0FxR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJU0RWRGVwZW5kZW5jeSwgSVNEVk1vZE1hbmlmZXN0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgcGFyc2VNYW5pZmVzdCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgY29lcmNlLCBndGUgfSBmcm9tICdzZW12ZXInO1xyXG5cclxudHlwZSBNYW5pZmVzdE1hcCA9IHsgW21vZElkOiBzdHJpbmddOiBJU0RWTW9kTWFuaWZlc3RbXSB9O1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXBlbmRlbmN5TWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbU1hbmlmZXN0czogTWFuaWZlc3RNYXA7XHJcbiAgcHJpdmF0ZSBtTG9hZGluZzogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBnZXRNYW5pZmVzdHMoKTogUHJvbWlzZTxNYW5pZmVzdE1hcD4ge1xyXG4gICAgYXdhaXQgdGhpcy5zY2FuTWFuaWZlc3RzKCk7XHJcbiAgICByZXR1cm4gdGhpcy5tTWFuaWZlc3RzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAodGhpcy5tTG9hZGluZykge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLm1Mb2FkaW5nID0gdHJ1ZTtcclxuICAgIGF3YWl0IHRoaXMuc2Nhbk1hbmlmZXN0cyh0cnVlKTtcclxuICAgIHRoaXMubUxvYWRpbmcgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBzY2FuTWFuaWZlc3RzKGZvcmNlPzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLm1NYW5pZmVzdHMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3Qgc3RhZ2luZyA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gICAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgY29uc3QgbWFuaWZlc3RzID0gYXdhaXQgT2JqZWN0LnZhbHVlcyhtb2RzKS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xyXG4gICAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDsgICAgICBcclxuICAgICAgaWYgKCFpc0FjdGl2ZShpdGVyLmlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oc3RhZ2luZywgaXRlci5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcclxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcclxuICAgICAgICAgIGxldCBtYW5pZmVzdDtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIG1hbmlmZXN0ID0gYXdhaXQgcGFyc2VNYW5pZmVzdChlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IGVycm9yOiBlcnIubWVzc2FnZSwgbWFuaWZlc3Q6IGVudHJ5LmZpbGVQYXRoIH0pO1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IGxpc3QgPSBhY2N1bVtpdGVyLmlkXSA/PyBbXTtcclxuICAgICAgICAgIGxpc3QucHVzaChtYW5pZmVzdCk7XHJcbiAgICAgICAgICBhY2N1bVtpdGVyLmlkXSA9IGxpc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZX0pXHJcbiAgICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShhY2N1bSkpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgIGlmIChlcnJbJ2NvZGUnXSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSwge30pO1xyXG4gICAgdGhpcy5tTWFuaWZlc3RzID0gbWFuaWZlc3RzO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGZpbmRNaXNzaW5nRGVwZW5kZW5jaWVzKGRlcHM/OiBzdHJpbmdbXSk6IElTRFZEZXBlbmRlbmN5W10ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgIGNvbnN0IGlzQWN0aXZlID0gKG1vZElkOiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKTtcclxuICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gICAgY29uc3QgYWN0aXZlTW9kcyA9IG1vZElkcy5maWx0ZXIoaXNBY3RpdmUpO1xyXG4gICAgY29uc3QgYWN0aXZlTWFuaWZlc3RzOiBJU0RWTW9kTWFuaWZlc3RbXSA9IGFjdGl2ZU1vZHMucmVkdWNlKChhY2N1bSwgaXRlcikgPT5cclxuICAgICAgdGhpcy5tTWFuaWZlc3RzPy5baXRlcl0gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gYWNjdW0uY29uY2F0KHRoaXMubU1hbmlmZXN0c1tpdGVyXSlcclxuICAgICAgICA6IGFjY3VtLCBbXSk7XHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXM6IElTRFZEZXBlbmRlbmN5W10gPSAoZGVwcz8ubGVuZ3RoID8/IDAgPiAwKVxyXG4gICAgICA/IGRlcHNcclxuICAgICAgOiBhY3RpdmVNYW5pZmVzdHMucmVkdWNlKChhY2N1bSwgaXRlcikgPT5cclxuICAgICAgICAoaXRlcj8uRGVwZW5kZW5jaWVzPy5sZW5ndGggPz8gMCA+IDApXHJcbiAgICAgICAgICA/IGFjY3VtLmNvbmNhdChpdGVyLkRlcGVuZGVuY2llcylcclxuICAgICAgICAgIDogYWNjdW0sIFtdKTtcclxuXHJcbiAgICBjb25zdCBkZXBTYXRpc2ZpZWQgPSAoZGVwOiBJU0RWRGVwZW5kZW5jeSkgPT4ge1xyXG4gICAgICBjb25zdCBmb3VuZCA9IGFjdGl2ZU1hbmlmZXN0cy5maW5kKG1hbiA9PiB7XHJcbiAgICAgICAgY29uc3QgaWRNYXRjaCA9IG1hbi5VbmlxdWVJRCA9PT0gZGVwLlVuaXF1ZUlEO1xyXG4gICAgICAgIGNvbnN0IHZlcnNpb25NYXRjaCA9IGRlcC5NaW5pbXVtVmVyc2lvblxyXG4gICAgICAgICAgPyBndGUoY29lcmNlKG1hbi5WZXJzaW9uID8/ICcwLjAuMCcpLCBjb2VyY2UoZGVwLk1pbmltdW1WZXJzaW9uID8/ICcwLjAuMCcpKVxyXG4gICAgICAgICAgOiB0cnVlO1xyXG4gICAgICAgIHJldHVybiBpZE1hdGNoICYmIHZlcnNpb25NYXRjaDtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBmb3VuZCA/IHRydWUgOiBkZXAuSXNSZXF1aXJlZCA9PT0gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IG1pc3NpbmdEZXBzID0gZGVwZW5kZW5jaWVzLmZpbHRlcihkZXAgPT4gIWRlcFNhdGlzZmllZChkZXApKTtcclxuICAgIHJldHVybiBtaXNzaW5nRGVwcztcclxuICB9XHJcbn1cclxuIl19