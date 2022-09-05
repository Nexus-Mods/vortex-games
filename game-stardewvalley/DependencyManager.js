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
        this.mSMAPIMod = this.findSMAPIMod();
    }
    findSMAPIMod() {
        const state = this.mApi.getState();
        const profile = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const SMAPIMods = Object.values(mods).filter((mod) => mod.type === 'SMAPI' && isActive(mod.id));
        return (SMAPIMods.length === 0)
            ? undefined
            : SMAPIMods.length > 1
                ? SMAPIMods.reduce((prev, iter) => {
                    if (prev === undefined) {
                        return iter;
                    }
                    return ((0, semver_1.gte)(iter.attributes.version, prev.attributes.version)) ? iter : prev;
                }, undefined)
                : SMAPIMods[0];
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
            const something = yield Object.values(mods).reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
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
            this.mManifests = something;
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
                const idMatch = man.UniqueID === dep.UniqueID;
                const versionMatch = dep.MinimumVersion
                    ? false
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFDeEIsbUNBQXFDO0FBR3JDLE1BQXFCLGlCQUFpQjtJQU1wQyxZQUFZLEdBQXdCO1FBRjVCLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFHaEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVPLFlBQVk7UUFDbEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDbkUsTUFBTSxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakcsTUFBTSxJQUFJLEdBQW9DLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZHLE1BQU0sU0FBUyxHQUFpQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQWUsRUFBRSxFQUFFLENBQzdFLEdBQUcsQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU1QyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDLFNBQVM7WUFDWCxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUNwQixDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtvQkFDaEMsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO3dCQUN0QixPQUFPLElBQUksQ0FBQztxQkFDYjtvQkFDRCxPQUFPLENBQUMsSUFBQSxZQUFHLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDL0UsQ0FBQyxFQUFFLFNBQVMsQ0FBQztnQkFDYixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFWSxPQUFPOztZQUNsQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2pCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDO0tBQUE7SUFFWSxhQUFhLENBQUMsS0FBZTs7WUFDeEMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDM0MsT0FBTzthQUNSO1lBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDN0QsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RCxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkcsTUFBTSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFPLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFDeEUsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO29CQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQy9CO2dCQUNELE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUMxRCxPQUFPLElBQUEsbUJBQVMsRUFBQyxPQUFPLEVBQUUsQ0FBTSxPQUFPLEVBQUMsRUFBRTs7b0JBQzFDLEtBQUssTUFBTSxLQUFLLElBQUksT0FBTyxFQUFFO3dCQUMzQixJQUFJLGNBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLGVBQWUsRUFBRTs0QkFDckQsSUFBSSxRQUFRLENBQUM7NEJBQ2IsSUFBSTtnQ0FDRixRQUFRLEdBQUcsTUFBTSxJQUFBLG9CQUFhLEVBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDOzZCQUNoRDs0QkFBQyxPQUFPLEdBQUcsRUFBRTtnQ0FDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dDQUMzRixTQUFTOzZCQUNWOzRCQUNELE1BQU0sSUFBSSxHQUFHLE1BQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsbUNBQUksRUFBRSxDQUFDOzRCQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOzRCQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQzt5QkFDdkI7cUJBQ0Y7Z0JBQ0QsQ0FBQyxDQUFBLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUMsQ0FBQztxQkFDL0UsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0QyxDQUFDLENBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUM7S0FBQTtJQUVNLHVCQUF1QixDQUFDLElBQWU7O1FBQzVDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkMsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4RCxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqRyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdkcsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sZUFBZSxHQUFzQixVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFOztZQUMzRSxPQUFBLENBQUEsTUFBQSxJQUFJLENBQUMsVUFBVSwwQ0FBRyxJQUFJLENBQUMsTUFBSyxTQUFTO2dCQUNuQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyQyxDQUFDLENBQUMsS0FBSyxDQUFBO1NBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqQixNQUFNLFlBQVksR0FBcUIsQ0FBQyxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxNQUFNLG1DQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUQsQ0FBQyxDQUFDLElBQUk7WUFDTixDQUFDLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTs7Z0JBQ3ZDLE9BQUEsQ0FBQyxNQUFBLE1BQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFlBQVksMENBQUUsTUFBTSxtQ0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNuQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO29CQUNqQyxDQUFDLENBQUMsS0FBSyxDQUFBO2FBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVuQixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQW1CLEVBQUUsRUFBRTtZQUMzQyxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN2QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxRQUFRLENBQUM7Z0JBQzlDLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxjQUFjO29CQUNyQyxDQUFDLENBQUMsS0FBSztvQkFFUCxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNULE9BQU8sT0FBTyxJQUFJLFlBQVksQ0FBQztZQUNqQyxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUN4QyxDQUFDLENBQUM7UUFFRixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuRSxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUFoSEQsb0NBZ0hDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSVNEVkRlcGVuZGVuY3ksIElTRFZNb2RNYW5pZmVzdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGNvZXJjZSwgZ3RlIH0gZnJvbSAnc2VtdmVyJztcclxuXHJcbnR5cGUgTWFuaWZlc3RNYXAgPSB7IFttb2RJZDogc3RyaW5nXTogSVNEVk1vZE1hbmlmZXN0W10gfTtcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVwZW5kZW5jeU1hbmFnZXIge1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1TTUFQSU1vZDogdHlwZXMuSU1vZDtcclxuICBwcml2YXRlIG1NYW5pZmVzdHM6IE1hbmlmZXN0TWFwO1xyXG4gIHByaXZhdGUgbUxvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1TTUFQSU1vZCA9IHRoaXMuZmluZFNNQVBJTW9kKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZpbmRTTUFQSU1vZCgpOiB0eXBlcy5JTW9kIHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBpc0FjdGl2ZSA9IChtb2RJZDogc3RyaW5nKSA9PiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIG1vZElkLCAnZW5hYmxlZCddLCBmYWxzZSk7XHJcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICBjb25zdCBTTUFQSU1vZHM6IHR5cGVzLklNb2RbXSA9IE9iamVjdC52YWx1ZXMobW9kcykuZmlsdGVyKChtb2Q6IHR5cGVzLklNb2QpID0+XHJcbiAgICAgIG1vZC50eXBlID09PSAnU01BUEknICYmIGlzQWN0aXZlKG1vZC5pZCkpO1xyXG5cclxuICAgIHJldHVybiAoU01BUElNb2RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgPyB1bmRlZmluZWRcclxuICAgICAgOiBTTUFQSU1vZHMubGVuZ3RoID4gMVxyXG4gICAgICAgID8gU01BUElNb2RzLnJlZHVjZSgocHJldiwgaXRlcikgPT4ge1xyXG4gICAgICAgICAgaWYgKHByZXYgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXRlcjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiAoZ3RlKGl0ZXIuYXR0cmlidXRlcy52ZXJzaW9uLCBwcmV2LmF0dHJpYnV0ZXMudmVyc2lvbikpID8gaXRlciA6IHByZXY7XHJcbiAgICAgICAgfSwgdW5kZWZpbmVkKVxyXG4gICAgICAgIDogU01BUElNb2RzWzBdO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAodGhpcy5tTG9hZGluZykge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLm1Mb2FkaW5nID0gdHJ1ZTtcclxuICAgIGF3YWl0IHRoaXMuc2Nhbk1hbmlmZXN0cyh0cnVlKTtcclxuICAgIHRoaXMubUxvYWRpbmcgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBzY2FuTWFuaWZlc3RzKGZvcmNlPzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLm1NYW5pZmVzdHMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3Qgc3RhZ2luZyA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xyXG4gICAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgY29uc3Qgc29tZXRoaW5nID0gYXdhaXQgT2JqZWN0LnZhbHVlcyhtb2RzKS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xyXG4gICAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDsgICAgICBcclxuICAgICAgaWYgKCFpc0FjdGl2ZShpdGVyLmlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oc3RhZ2luZywgaXRlci5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcclxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcclxuICAgICAgICAgIGxldCBtYW5pZmVzdDtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIG1hbmlmZXN0ID0gYXdhaXQgcGFyc2VNYW5pZmVzdChlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IGVycm9yOiBlcnIubWVzc2FnZSwgbWFuaWZlc3Q6IGVudHJ5LmZpbGVQYXRoIH0pO1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IGxpc3QgPSBhY2N1bVtpdGVyLmlkXSA/PyBbXTtcclxuICAgICAgICAgIGxpc3QucHVzaChtYW5pZmVzdCk7XHJcbiAgICAgICAgICBhY2N1bVtpdGVyLmlkXSA9IGxpc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZX0pXHJcbiAgICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShhY2N1bSkpO1xyXG4gICAgfSwge30pO1xyXG4gICAgdGhpcy5tTWFuaWZlc3RzID0gc29tZXRoaW5nO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGZpbmRNaXNzaW5nRGVwZW5kZW5jaWVzKGRlcHM/OiBzdHJpbmdbXSk6IElTRFZEZXBlbmRlbmN5W10ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgIGNvbnN0IGlzQWN0aXZlID0gKG1vZElkOiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKTtcclxuICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gICAgY29uc3QgYWN0aXZlTW9kcyA9IG1vZElkcy5maWx0ZXIoaXNBY3RpdmUpO1xyXG4gICAgY29uc3QgYWN0aXZlTWFuaWZlc3RzOiBJU0RWTW9kTWFuaWZlc3RbXSA9IGFjdGl2ZU1vZHMucmVkdWNlKChhY2N1bSwgaXRlcikgPT5cclxuICAgICAgdGhpcy5tTWFuaWZlc3RzPy5baXRlcl0gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gYWNjdW0uY29uY2F0KHRoaXMubU1hbmlmZXN0c1tpdGVyXSlcclxuICAgICAgICA6IGFjY3VtLCBbXSk7XHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXM6IElTRFZEZXBlbmRlbmN5W10gPSAoZGVwcz8ubGVuZ3RoID8/IDAgPiAwKVxyXG4gICAgICA/IGRlcHNcclxuICAgICAgOiBhY3RpdmVNYW5pZmVzdHMucmVkdWNlKChhY2N1bSwgaXRlcikgPT5cclxuICAgICAgICAoaXRlcj8uRGVwZW5kZW5jaWVzPy5sZW5ndGggPz8gMCA+IDApXHJcbiAgICAgICAgICA/IGFjY3VtLmNvbmNhdChpdGVyLkRlcGVuZGVuY2llcylcclxuICAgICAgICAgIDogYWNjdW0sIFtdKTtcclxuXHJcbiAgICBjb25zdCBkZXBTYXRpc2ZpZWQgPSAoZGVwOiBJU0RWRGVwZW5kZW5jeSkgPT4ge1xyXG4gICAgICBjb25zdCBmb3VuZCA9IGFjdGl2ZU1hbmlmZXN0cy5maW5kKG1hbiA9PiB7XHJcbiAgICAgICAgY29uc3QgaWRNYXRjaCA9IG1hbi5VbmlxdWVJRCA9PT0gZGVwLlVuaXF1ZUlEO1xyXG4gICAgICAgIGNvbnN0IHZlcnNpb25NYXRjaCA9IGRlcC5NaW5pbXVtVmVyc2lvblxyXG4gICAgICAgICAgPyBmYWxzZVxyXG4gICAgICAgICAgLy8/IGd0ZShjb2VyY2UobWFuLlZlcnNpb24gPz8gJzAuMC4wJyksIGNvZXJjZShkZXAuTWluaW11bVZlcnNpb24gPz8gJzAuMC4wJykpXHJcbiAgICAgICAgICA6IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGlkTWF0Y2ggJiYgdmVyc2lvbk1hdGNoO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGZvdW5kID8gdHJ1ZSA6ICFkZXAuSXNSZXF1aXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgbWlzc2luZ0RlcHMgPSBkZXBlbmRlbmNpZXMuZmlsdGVyKGRlcCA9PiAhZGVwU2F0aXNmaWVkKGRlcCkpO1xyXG4gICAgcmV0dXJuIG1pc3NpbmdEZXBzO1xyXG4gIH1cclxufVxyXG4iXX0=