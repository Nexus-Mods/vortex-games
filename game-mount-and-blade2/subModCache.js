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
exports.getValidationInfo = exports.getIncompatibilities = exports.missingDependencies = exports.refreshCache = exports.getCache = void 0;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
let CACHE = {};
function getCache() {
    return CACHE;
}
exports.getCache = getCache;
function refreshCache(context, bmm) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const subModuleFilePaths = yield getDeployedSubModPaths(context);
            CACHE = yield getDeployedModData(context.api, subModuleFilePaths, bmm);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.refreshCache = refreshCache;
function getDeployedSubModPaths(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('game discovery is incomplete'));
        }
        const modulePath = path_1.default.join(discovery.path, common_1.MODULES);
        let moduleFiles;
        try {
            moduleFiles = yield (0, util_1.walkAsync)(modulePath);
        }
        catch (err) {
            if (err instanceof vortex_api_1.util.UserCanceled) {
                return Promise.resolve([]);
            }
            const isMissingOfficialModules = ((err.code === 'ENOENT')
                && ([].concat([common_1.MODULES], Array.from(common_1.OFFICIAL_MODULES)))
                    .indexOf(path_1.default.basename(err.path)) !== -1);
            const errorMsg = isMissingOfficialModules
                ? 'Game files are missing - please re-install the game'
                : err.message;
            context.api.showErrorNotification(errorMsg, err);
            return Promise.resolve([]);
        }
        const subModules = moduleFiles.filter(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE);
        return Promise.resolve(subModules);
    });
}
function getDeployedModData(api, subModuleFilePaths, bmm) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const getVortexId = (subModId) => {
            for (const mod of Object.values(mods)) {
                const subModIds = vortex_api_1.util.getSafe(mod, ['attributes', 'subModIds'], []);
                if (subModIds.includes(subModId)) {
                    return mod.id;
                }
            }
            return undefined;
        };
        const modules = {};
        const invalidSubMods = [];
        for (const subMod of subModuleFilePaths) {
            const data = yield vortex_api_1.fs.readFileAsync(subMod, { encoding: 'utf8' });
            const module = bmm.getModuleInfo(data);
            if (!module) {
                invalidSubMods.push(subMod);
                continue;
            }
            const vortexId = getVortexId(module.id);
            modules[module.id] = Object.assign(Object.assign({}, module), { vortexId });
        }
        if (invalidSubMods.length > 0) {
            api.showErrorNotification('Invalid submodule files - inform the mod authors', Array.from(new Set(invalidSubMods)).join('\n'), { allowReport: false, id: 'invalidSubMods' });
        }
        return modules;
    });
}
function missingDependencies(bmm, subMod) {
    const depsFulfilled = bmm.areAllDependenciesOfModulePresent(Object.values(CACHE), subMod);
    if (depsFulfilled) {
        return false;
    }
    const subModIds = Object.keys(CACHE);
    const missing = subMod.dependentModules.filter(dep => !subModIds.includes(dep.id))
        .map(dep => dep.id);
    return missing;
}
exports.missingDependencies = missingDependencies;
function versionToDisplay(ver) {
    return `${ver.major}.${ver.minor}.${ver.revision}`;
}
function getIncompatibilities(bmm, subMod) {
    const dependencies = subMod.dependentModules;
    const incorrectVersions = [];
    for (const dep of dependencies) {
        const depMod = CACHE[dep.id];
        if (!depMod) {
            continue;
        }
        const comparisonRes = bmm.compareVersions(depMod.version, dep.version);
        if (comparisonRes !== 1) {
            incorrectVersions.push({
                currentVersion: versionToDisplay(depMod.version),
                requiredVersion: versionToDisplay(dep.version),
            });
        }
    }
    return incorrectVersions;
}
exports.getIncompatibilities = getIncompatibilities;
function getValidationInfo(bmm, id) {
    const subModule = Object.values(CACHE)
        .find(entry => (entry.vortexId === id) || (entry.id === id));
    if (!subModule) {
        return { missing: [], incompatible: [] };
    }
    const missing = missingDependencies(bmm, subModule);
    const incompatible = getIncompatibilities(bmm, subModule);
    return { missing, incompatible };
}
exports.getValidationInfo = getValidationInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViTW9kQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJNb2RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsMkNBQTZEO0FBRzdELHFDQUEyRTtBQUUzRSxpQ0FBaUY7QUFFakYsSUFBSSxLQUFLLEdBQWlCLEVBQUUsQ0FBQztBQUM3QixTQUFnQixRQUFRO0lBQ3RCLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWdDLEVBQ2hDLEdBQTRCOztRQUM3RCxJQUFJO1lBQ0YsTUFBTSxrQkFBa0IsR0FBYSxNQUFNLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLEtBQUssR0FBRyxNQUFNLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDeEU7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQVJELG9DQVFDO0FBRUQsU0FBZSxzQkFBc0IsQ0FBQyxPQUFnQzs7UUFDcEUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0MsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2xHLElBQUksQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsRUFBRTtZQUNqQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyw4QkFBOEIsQ0FBQyxD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RSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUM7S0FDMUM7SUFDRCxNQUFNLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDcEQsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzFELE9BQU8sRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUM7QUFDbkMsQ0FBQztBQVZELDhDQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgQmFubmVybG9yZE1vZHVsZU1hbmFnZXIgfSBmcm9tICcuL2JtbS9pbmRleCc7XHJcbmltcG9ydCAqIGFzIGJtbVR5cGVzIGZyb20gJy4vYm1tL2xpYi90eXBlcyc7XHJcbmltcG9ydCB7IEdBTUVfSUQsIE1PRFVMRVMsIE9GRklDSUFMX01PRFVMRVMsIFNVQk1PRF9GSUxFIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJTW9kdWxlQ2FjaGUsIElNb2R1bGVJbmZvRXh0ZW5kZWRFeHQgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2V0Q2xlYW5WZXJzaW9uLCBnZXRFbGVtZW50VmFsdWUsIGdldFhNTERhdGEsIHdhbGtBc3luYyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5sZXQgQ0FDSEU6IElNb2R1bGVDYWNoZSA9IHt9O1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FjaGUoKSB7XHJcbiAgcmV0dXJuIENBQ0hFO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENhY2hlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJtbTogQmFubmVybG9yZE1vZHVsZU1hbmFnZXIpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc3ViTW9kdWxlRmlsZVBhdGhzOiBzdHJpbmdbXSA9IGF3YWl0IGdldERlcGxveWVkU3ViTW9kUGF0aHMoY29udGV4dCk7XHJcbiAgICBDQUNIRSA9IGF3YWl0IGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0LmFwaSwgc3ViTW9kdWxlRmlsZVBhdGhzLCBibW0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXREZXBsb3llZFN1Yk1vZFBhdGhzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdnYW1lIGRpc2NvdmVyeSBpcyBpbmNvbXBsZXRlJykpO1xyXG4gIH1cclxuICBjb25zdCBtb2R1bGVQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RVTEVTKTtcclxuICBsZXQgbW9kdWxlRmlsZXM7XHJcbiAgdHJ5IHtcclxuICAgIG1vZHVsZUZpbGVzID0gYXdhaXQgd2Fsa0FzeW5jKG1vZHVsZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzID0gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICYmIChbXS5jb25jYXQoWyBNT0RVTEVTIF0sIEFycmF5LmZyb20oT0ZGSUNJQUxfTU9EVUxFUykpKVxyXG4gICAgICAgICAgICAuaW5kZXhPZihwYXRoLmJhc2VuYW1lKGVyci5wYXRoKSkgIT09IC0xKTtcclxuICAgIGNvbnN0IGVycm9yTXNnID0gaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzXHJcbiAgICAgID8gJ0dhbWUgZmlsZXMgYXJlIG1pc3NpbmcgLSBwbGVhc2UgcmUtaW5zdGFsbCB0aGUgZ2FtZSdcclxuICAgICAgOiBlcnIubWVzc2FnZTtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJvck1zZywgZXJyKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuICBjb25zdCBzdWJNb2R1bGVzID0gbW9kdWxlRmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzdWJNb2R1bGVzKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95ZWRNb2REYXRhKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Yk1vZHVsZUZpbGVQYXRoczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibW06IEJhbm5lcmxvcmRNb2R1bGVNYW5hZ2VyKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGdldFZvcnRleElkID0gKHN1Yk1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgIGZvciAoY29uc3QgbW9kIG9mIE9iamVjdC52YWx1ZXMobW9kcykpIHtcclxuICAgICAgY29uc3Qgc3ViTW9kSWRzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ3N1Yk1vZElkcyddLCBbXSk7XHJcbiAgICAgIGlmIChzdWJNb2RJZHMuaW5jbHVkZXMoc3ViTW9kSWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vZC5pZDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9O1xyXG5cclxuICBjb25zdCBtb2R1bGVzOiB7IFtzdWJNb2RJZDogc3RyaW5nXTogSU1vZHVsZUluZm9FeHRlbmRlZEV4dCB9ID0ge307XHJcbiAgY29uc3QgaW52YWxpZFN1Yk1vZHMgPSBbXTtcclxuICBmb3IgKGNvbnN0IHN1Yk1vZCBvZiBzdWJNb2R1bGVGaWxlUGF0aHMpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHN1Yk1vZCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgbW9kdWxlID0gYm1tLmdldE1vZHVsZUluZm8oZGF0YSk7XHJcbiAgICBpZiAoIW1vZHVsZSkge1xyXG4gICAgICBpbnZhbGlkU3ViTW9kcy5wdXNoKHN1Yk1vZCk7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgdm9ydGV4SWQgPSBnZXRWb3J0ZXhJZChtb2R1bGUuaWQpO1xyXG4gICAgbW9kdWxlc1ttb2R1bGUuaWRdID0ge1xyXG4gICAgICAuLi5tb2R1bGUsXHJcbiAgICAgIHZvcnRleElkLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGlmIChpbnZhbGlkU3ViTW9kcy5sZW5ndGggPiAwKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIHN1Ym1vZHVsZSBmaWxlcyAtIGluZm9ybSB0aGUgbW9kIGF1dGhvcnMnLFxyXG4gICAgICBBcnJheS5mcm9tKG5ldyBTZXQoaW52YWxpZFN1Yk1vZHMpKS5qb2luKCdcXG4nKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UsIGlkOiAnaW52YWxpZFN1Yk1vZHMnIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG1vZHVsZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtaXNzaW5nRGVwZW5kZW5jaWVzKGJtbTogQmFubmVybG9yZE1vZHVsZU1hbmFnZXIsIHN1Yk1vZDogSU1vZHVsZUluZm9FeHRlbmRlZEV4dCkge1xyXG4gIGNvbnN0IGRlcHNGdWxmaWxsZWQgPSBibW0uYXJlQWxsRGVwZW5kZW5jaWVzT2ZNb2R1bGVQcmVzZW50KE9iamVjdC52YWx1ZXMoQ0FDSEUpLCBzdWJNb2QpO1xyXG4gIGlmIChkZXBzRnVsZmlsbGVkKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdWJNb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgY29uc3QgbWlzc2luZyA9IHN1Yk1vZC5kZXBlbmRlbnRNb2R1bGVzLmZpbHRlcihkZXAgPT4gIXN1Yk1vZElkcy5pbmNsdWRlcyhkZXAuaWQpKVxyXG4gICAgLm1hcChkZXAgPT4gZGVwLmlkKTtcclxuICByZXR1cm4gbWlzc2luZztcclxufVxyXG5cclxuZnVuY3Rpb24gdmVyc2lvblRvRGlzcGxheSh2ZXI6IGJtbVR5cGVzLkFwcGxpY2F0aW9uVmVyc2lvbikge1xyXG4gIHJldHVybiBgJHt2ZXIubWFqb3J9LiR7dmVyLm1pbm9yfS4ke3Zlci5yZXZpc2lvbn1gO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5jb21wYXRpYmlsaXRpZXMoYm1tOiBCYW5uZXJsb3JkTW9kdWxlTWFuYWdlciwgc3ViTW9kOiBJTW9kdWxlSW5mb0V4dGVuZGVkRXh0KSB7XHJcbiAgY29uc3QgZGVwZW5kZW5jaWVzID0gc3ViTW9kLmRlcGVuZGVudE1vZHVsZXM7XHJcbiAgY29uc3QgaW5jb3JyZWN0VmVyc2lvbnMgPSBbXTtcclxuICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgIGNvbnN0IGRlcE1vZCA9IENBQ0hFW2RlcC5pZF07XHJcbiAgICBpZiAoIWRlcE1vZCkge1xyXG4gICAgICAvLyBkZXBlbmRlbmN5IGlzIG1pc3NpbmcgZW50aXJlbHlcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCBjb21wYXJpc29uUmVzID0gYm1tLmNvbXBhcmVWZXJzaW9ucyhkZXBNb2QudmVyc2lvbiwgZGVwLnZlcnNpb24pO1xyXG4gICAgaWYgKGNvbXBhcmlzb25SZXMgIT09IDEpIHtcclxuICAgICAgaW5jb3JyZWN0VmVyc2lvbnMucHVzaChcclxuICAgICAgICB7XHJcbiAgICAgICAgICBjdXJyZW50VmVyc2lvbjogdmVyc2lvblRvRGlzcGxheShkZXBNb2QudmVyc2lvbiksXHJcbiAgICAgICAgICByZXF1aXJlZFZlcnNpb246IHZlcnNpb25Ub0Rpc3BsYXkoZGVwLnZlcnNpb24pLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gaW5jb3JyZWN0VmVyc2lvbnM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWxpZGF0aW9uSW5mbyhibW06IEJhbm5lcmxvcmRNb2R1bGVNYW5hZ2VyLCBpZDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3ViTW9kdWxlID0gT2JqZWN0LnZhbHVlcyhDQUNIRSlcclxuICAgIC5maW5kKGVudHJ5ID0+IChlbnRyeS52b3J0ZXhJZCA9PT0gaWQpIHx8IChlbnRyeS5pZCA9PT0gaWQpKTtcclxuICBpZiAoIXN1Yk1vZHVsZSkge1xyXG4gICAgLy8gUHJvYmFibHkgbm90IGRlcGxveWVkIHlldFxyXG4gICAgcmV0dXJuIHsgbWlzc2luZzogW10sIGluY29tcGF0aWJsZTogW10gfTtcclxuICB9XHJcbiAgY29uc3QgbWlzc2luZyA9IG1pc3NpbmdEZXBlbmRlbmNpZXMoYm1tLCBzdWJNb2R1bGUpO1xyXG4gIGNvbnN0IGluY29tcGF0aWJsZSA9IGdldEluY29tcGF0aWJpbGl0aWVzKGJtbSwgc3ViTW9kdWxlKTtcclxuICByZXR1cm4geyBtaXNzaW5nLCBpbmNvbXBhdGlibGUgfTtcclxufVxyXG4iXX0=