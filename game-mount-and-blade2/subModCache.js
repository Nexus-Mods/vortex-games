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
exports.getValidationInfo = exports.isInvalid = exports.parseLauncherData = exports.refreshCache = exports.getCache = exports.getLauncherData = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const XML_EL_MULTIPLAYER = 'MultiplayerModule';
const LAUNCHER_DATA_PATH = path_1.default.join(vortex_api_1.util.getVortexPath('documents'), 'Mount and Blade II Bannerlord', 'Configs', 'LauncherData.xml');
const LAUNCHER_DATA = {
    singlePlayerSubMods: [],
    multiplayerSubMods: [],
};
function getLauncherData() {
    return LAUNCHER_DATA;
}
exports.getLauncherData = getLauncherData;
let CACHE = {};
function getCache() {
    return CACHE !== null && CACHE !== void 0 ? CACHE : {};
}
exports.getCache = getCache;
function refreshCache(context, metaManager) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            CACHE = {};
            const subModuleFilePaths = yield getDeployedSubModPaths(context);
            CACHE = yield getDeployedModData(context, subModuleFilePaths, metaManager);
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
function getDeployedModData(context, subModuleFilePaths, metaManager) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        if (profileId === undefined) {
            return undefined;
        }
        yield metaManager.updateDependencyMap(profileId);
        const managedIds = yield getManagedIds(context);
        return bluebird_1.default.reduce(subModuleFilePaths, (accum, subModFile) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            try {
                const getAttrValue = (node, attr) => { var _a, _b, _c; return (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node[attr]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.$) === null || _c === void 0 ? void 0 : _c.value; };
                const subModData = yield (0, util_1.getXMLData)(subModFile);
                const module = subModData === null || subModData === void 0 ? void 0 : subModData.Module;
                const subModId = getAttrValue(module, 'Id');
                const comDependencies = metaManager.getDependencies(subModId);
                const subModVerData = getAttrValue(module, 'Version');
                const subModVer = (0, util_1.getCleanVersion)(subModId, subModVerData);
                const managedEntry = managedIds.find(entry => entry.subModId === subModId);
                const isMultiplayer = getAttrValue(module, XML_EL_MULTIPLAYER) !== undefined;
                const officialDepNodes = ((_c = (_b = module === null || module === void 0 ? void 0 : module.DependedModules) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.DependedModule) || [];
                let dependencies = [];
                const getOfficialDepNodes = () => officialDepNodes
                    .filter(depNode => comDependencies.find(dep => { var _a; return dep.id === ((_a = depNode === null || depNode === void 0 ? void 0 : depNode.$) === null || _a === void 0 ? void 0 : _a.Id); }) === undefined)
                    .map(depNode => {
                    var _a, _b;
                    let depVersion;
                    const depId = (_a = depNode === null || depNode === void 0 ? void 0 : depNode.$) === null || _a === void 0 ? void 0 : _a.Id;
                    try {
                        const unsanitized = (_b = depNode === null || depNode === void 0 ? void 0 : depNode.$) === null || _b === void 0 ? void 0 : _b.DependentVersion;
                        depVersion = (0, util_1.getCleanVersion)(subModId, unsanitized);
                    }
                    catch (err) {
                        (0, vortex_api_1.log)('debug', 'failed to resolve dependency version', { subModId, error: err.message });
                    }
                    const dependency = {
                        id: depId,
                        incompatible: false,
                        optional: false,
                        order: 'LoadAfterThis',
                        version: depVersion,
                    };
                    return dependency;
                });
                try {
                    dependencies = (comDependencies.length > 0)
                        ? [].concat(getOfficialDepNodes(), comDependencies)
                        : getOfficialDepNodes();
                }
                catch (err) {
                    (0, vortex_api_1.log)('debug', 'submodule has no dependencies or is invalid', err);
                }
                const subModName = getAttrValue(module, 'Name');
                accum[subModId] = {
                    subModId,
                    subModName,
                    subModVer,
                    subModFile,
                    vortexId: !!managedEntry ? managedEntry.vortexId : subModId,
                    isOfficial: common_1.OFFICIAL_MODULES.has(subModId),
                    isLocked: common_1.LOCKED_MODULES.has(subModId),
                    isMultiplayer,
                    dependencies,
                    invalid: {
                        cyclic: [],
                        missing: [],
                        incompatibleDeps: [],
                    },
                };
            }
            catch (err) {
                const errorMessage = 'Vortex was unable to parse: ' + subModFile + ';\n\n'
                    + 'You can either inform the mod author and wait for fix, or '
                    + 'you can use an online xml validator to find and fix the '
                    + 'error yourself.';
                context.api.showErrorNotification('Unable to parse submodule file', errorMessage, { allowReport: false });
                (0, vortex_api_1.log)('error', 'MNB2: parsing error', err);
            }
            return Promise.resolve(accum);
        }), {});
    });
}
function parseLauncherData() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __awaiter(this, void 0, void 0, function* () {
        const createDataElement = (xmlNode) => {
            if (xmlNode === undefined) {
                return undefined;
            }
            return {
                subModId: xmlNode === null || xmlNode === void 0 ? void 0 : xmlNode.Id[0],
                enabled: (xmlNode === null || xmlNode === void 0 ? void 0 : xmlNode.IsSelected[0]) === 'true',
            };
        };
        const launcherData = yield (0, util_1.getXMLData)(LAUNCHER_DATA_PATH);
        try {
            const singlePlayerMods = ((_e = (_d = (_c = (_b = (_a = launcherData === null || launcherData === void 0 ? void 0 : launcherData.UserData) === null || _a === void 0 ? void 0 : _a.SingleplayerData) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.ModDatas) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.UserModData) || [];
            const multiPlayerMods = ((_k = (_j = (_h = (_g = (_f = launcherData === null || launcherData === void 0 ? void 0 : launcherData.UserData) === null || _f === void 0 ? void 0 : _f.MultiplayerData) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.ModDatas) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.UserModData) || [];
            LAUNCHER_DATA.singlePlayerSubMods = singlePlayerMods.reduce((accum, spm) => {
                const dataElement = createDataElement(spm);
                if (!!dataElement) {
                    accum.push(dataElement);
                }
                return accum;
            }, []);
            LAUNCHER_DATA.multiplayerSubMods = multiPlayerMods.reduce((accum, mpm) => {
                const dataElement = createDataElement(mpm);
                if (!!dataElement) {
                    accum.push(dataElement);
                }
                return accum;
            }, []);
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to parse launcher data', err);
            LAUNCHER_DATA.singlePlayerSubMods = [
                { subModId: 'Native', enabled: true },
                { subModId: 'SandBoxCore', enabled: true },
                { subModId: 'CustomBattle', enabled: true },
                { subModId: 'Sandbox', enabled: true },
                { subModId: 'StoryMode', enabled: true },
            ];
            LAUNCHER_DATA.multiplayerSubMods = [];
            return Promise.resolve();
        }
    });
}
exports.parseLauncherData = parseLauncherData;
function getManagedIds(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        if (activeProfile === undefined) {
            return Promise.resolve([]);
        }
        const modState = vortex_api_1.util.getSafe(state, ['persistent', 'profiles', activeProfile.id, 'modState'], {});
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabledMods = Object.keys(modState)
            .filter(key => !!mods[key] && modState[key].enabled)
            .map(key => mods[key]);
        const invalidMods = [];
        const installationDir = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        if (installationDir === undefined) {
            (0, vortex_api_1.log)('error', 'failed to get managed ids', 'undefined staging folder');
            return Promise.resolve([]);
        }
        return bluebird_1.default.reduce(enabledMods, (accum, entry) => __awaiter(this, void 0, void 0, function* () {
            if ((entry === null || entry === void 0 ? void 0 : entry.installationPath) === undefined) {
                return Promise.resolve(accum);
            }
            const modInstallationPath = path_1.default.join(installationDir, entry.installationPath);
            let files;
            try {
                files = yield (0, util_1.walkAsync)(modInstallationPath, 3);
            }
            catch (err) {
                invalidMods.push(entry.id);
                (0, vortex_api_1.log)('error', 'failed to read mod staging folder', { modId: entry.id, error: err.message });
                return Promise.resolve(accum);
            }
            const subModFile = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE);
            if (subModFile === undefined) {
                return Promise.resolve(accum);
            }
            let subModId;
            try {
                subModId = yield (0, util_1.getElementValue)(subModFile, 'Id');
            }
            catch (err) {
                (0, vortex_api_1.log)('error', '[MnB2] Unable to parse submodule file', err);
                return Promise.resolve(accum);
            }
            accum.push({
                subModId,
                subModFile,
                vortexId: entry.id,
            });
            return Promise.resolve(accum);
        }), [])
            .tap((res) => {
            if (invalidMods.length > 0) {
                const errMessage = 'The following mods are inaccessible or are missing '
                    + 'in the staging folder:\n\n' + invalidMods.join('\n') + '\n\nPlease ensure '
                    + 'these mods and their content are not open in any other application '
                    + '(including the game itself). If the mod is missing entirely, please re-install it '
                    + 'or remove it from your mods page. Please check your vortex log file for details.';
                context.api.showErrorNotification('Invalid Mods in Staging', new Error(errMessage), { allowReport: false });
            }
            return Promise.resolve(res);
        });
    });
}
function isInvalid(subModId) {
    const cyclicErrors = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
    const missingDeps = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
    return ((cyclicErrors.length > 0) || (missingDeps.length > 0));
}
exports.isInvalid = isInvalid;
function getValidationInfo(vortexId) {
    const subModId = Object.keys(CACHE).find(key => CACHE[key].vortexId === vortexId);
    const cyclic = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
    const missing = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
    const incompatible = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'incompatibleDeps'], []);
    return {
        cyclic,
        missing,
        incompatible,
    };
}
exports.getValidationInfo = getValidationInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViTW9kQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJNb2RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFDaEMsZ0RBQXdCO0FBQ3hCLDJDQUF5RDtBQUV6RCxxQ0FDa0Q7QUFFbEQsaUNBQWlGO0FBRWpGLE1BQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7QUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLCtCQUErQixFQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3RJLE1BQU0sYUFBYSxHQUFHO0lBQ3BCLG1CQUFtQixFQUFFLEVBQUU7SUFDdkIsa0JBQWtCLEVBQUUsRUFBRTtDQUN2QixDQUFDO0FBRUYsU0FBZ0IsZUFBZTtJQUM3QixPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBRkQsMENBRUM7QUFFRCxJQUFJLEtBQUssR0FBaUIsRUFBRSxDQUFDO0FBQzdCLFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxLQUFLLGFBQUwsS0FBSyxjQUFMLEtBQUssR0FBSSxFQUFFLENBQUM7QUFDckIsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWdDLEVBQ2hDLFdBQStCOztRQUNoRSxJQUFJO1lBQ0YsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNYLE1BQU0sa0JBQWtCLEdBQWEsTUFBTSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRSxLQUFLLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDNUU7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQVRELG9DQVNDO0FB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QUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUpELDhCQUlDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsUUFBZ0I7SUFJaEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDO0lBQ2xGLE1BQU0sTUFBTSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4RSxNQUFNLE9BQU8sR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUUsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEYsT0FBTztRQUNMLE1BQU07UUFDTixPQUFPO1FBQ1AsWUFBWTtLQUNiLENBQUM7QUFDSixDQUFDO0FBYkQsOENBYUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCBDb21NZXRhZGF0YU1hbmFnZXIgZnJvbSAnLi9Db21NZXRhZGF0YU1hbmFnZXInO1xyXG5pbXBvcnQgeyBHQU1FX0lELCBMT0NLRURfTU9EVUxFUywgTU9EVUxFUyxcclxuICBPRkZJQ0lBTF9NT0RVTEVTLCBTVUJNT0RfRklMRSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSURlcGVuZGVuY3ksIElTdWJNb2RDYWNoZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZXRDbGVhblZlcnNpb24sIGdldEVsZW1lbnRWYWx1ZSwgZ2V0WE1MRGF0YSwgd2Fsa0FzeW5jIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IFhNTF9FTF9NVUxUSVBMQVlFUiA9ICdNdWx0aXBsYXllck1vZHVsZSc7XHJcbmNvbnN0IExBVU5DSEVSX0RBVEFfUEFUSCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnTW91bnQgYW5kIEJsYWRlIElJIEJhbm5lcmxvcmQnLCAnQ29uZmlncycsICdMYXVuY2hlckRhdGEueG1sJyk7XHJcbmNvbnN0IExBVU5DSEVSX0RBVEEgPSB7XHJcbiAgc2luZ2xlUGxheWVyU3ViTW9kczogW10sXHJcbiAgbXVsdGlwbGF5ZXJTdWJNb2RzOiBbXSxcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXVuY2hlckRhdGEoKSB7XHJcbiAgcmV0dXJuIExBVU5DSEVSX0RBVEE7XHJcbn1cclxuXHJcbmxldCBDQUNIRTogSVN1Yk1vZENhY2hlID0ge307XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYWNoZSgpIHtcclxuICByZXR1cm4gQ0FDSEUgPz8ge307XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWZyZXNoQ2FjaGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIHRyeSB7XHJcbiAgICBDQUNIRSA9IHt9O1xyXG4gICAgY29uc3Qgc3ViTW9kdWxlRmlsZVBhdGhzOiBzdHJpbmdbXSA9IGF3YWl0IGdldERlcGxveWVkU3ViTW9kUGF0aHMoY29udGV4dCk7XHJcbiAgICBDQUNIRSA9IGF3YWl0IGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0LCBzdWJNb2R1bGVGaWxlUGF0aHMsIG1ldGFNYW5hZ2VyKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95ZWRTdWJNb2RQYXRocyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZ2FtZSBkaXNjb3ZlcnkgaXMgaW5jb21wbGV0ZScpKTtcclxuICB9XHJcbiAgY29uc3QgbW9kdWxlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9EVUxFUyk7XHJcbiAgbGV0IG1vZHVsZUZpbGVzO1xyXG4gIHRyeSB7XHJcbiAgICBtb2R1bGVGaWxlcyA9IGF3YWl0IHdhbGtBc3luYyhtb2R1bGVQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGlzTWlzc2luZ09mZmljaWFsTW9kdWxlcyA9ICgoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAmJiAoW10uY29uY2F0KFsgTU9EVUxFUyBdLCBBcnJheS5mcm9tKE9GRklDSUFMX01PRFVMRVMpKSlcclxuICAgICAgICAgICAgLmluZGV4T2YocGF0aC5iYXNlbmFtZShlcnIucGF0aCkpICE9PSAtMSk7XHJcbiAgICBjb25zdCBlcnJvck1zZyA9IGlzTWlzc2luZ09mZmljaWFsTW9kdWxlc1xyXG4gICAgICA/ICdHYW1lIGZpbGVzIGFyZSBtaXNzaW5nIC0gcGxlYXNlIHJlLWluc3RhbGwgdGhlIGdhbWUnXHJcbiAgICAgIDogZXJyLm1lc3NhZ2U7XHJcbiAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyb3JNc2csIGVycik7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcbiAgY29uc3Qgc3ViTW9kdWxlcyA9IG1vZHVsZUZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoc3ViTW9kdWxlcyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Yk1vZHVsZUZpbGVQYXRoczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKHByb2ZpbGVJZCk7XHJcbiAgY29uc3QgbWFuYWdlZElkcyA9IGF3YWl0IGdldE1hbmFnZWRJZHMoY29udGV4dCk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2Uoc3ViTW9kdWxlRmlsZVBhdGhzLCBhc3luYyAoYWNjdW0sIHN1Yk1vZEZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZ2V0QXR0clZhbHVlID0gKG5vZGUsIGF0dHIpID0+IG5vZGU/LlthdHRyXT8uWzBdPy4kPy52YWx1ZTtcclxuICAgICAgY29uc3Qgc3ViTW9kRGF0YSA9IGF3YWl0IGdldFhNTERhdGEoc3ViTW9kRmlsZSk7XHJcbiAgICAgIGNvbnN0IG1vZHVsZSA9IHN1Yk1vZERhdGE/Lk1vZHVsZTtcclxuICAgICAgY29uc3Qgc3ViTW9kSWQgPSBnZXRBdHRyVmFsdWUobW9kdWxlLCAnSWQnKTtcclxuICAgICAgY29uc3QgY29tRGVwZW5kZW5jaWVzID0gbWV0YU1hbmFnZXIuZ2V0RGVwZW5kZW5jaWVzKHN1Yk1vZElkKTtcclxuICAgICAgY29uc3Qgc3ViTW9kVmVyRGF0YSA9IGdldEF0dHJWYWx1ZShtb2R1bGUsICdWZXJzaW9uJyk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZFZlciA9IGdldENsZWFuVmVyc2lvbihzdWJNb2RJZCwgc3ViTW9kVmVyRGF0YSk7XHJcbiAgICAgIGNvbnN0IG1hbmFnZWRFbnRyeSA9IG1hbmFnZWRJZHMuZmluZChlbnRyeSA9PiBlbnRyeS5zdWJNb2RJZCA9PT0gc3ViTW9kSWQpO1xyXG4gICAgICBjb25zdCBpc011bHRpcGxheWVyID0gZ2V0QXR0clZhbHVlKG1vZHVsZSwgWE1MX0VMX01VTFRJUExBWUVSKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBvZmZpY2lhbERlcE5vZGVzID0gbW9kdWxlPy5EZXBlbmRlZE1vZHVsZXM/LlswXT8uRGVwZW5kZWRNb2R1bGUgfHwgW107XHJcbiAgICAgIGxldCBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmN5W10gPSBbXTtcclxuICAgICAgY29uc3QgZ2V0T2ZmaWNpYWxEZXBOb2RlcyA9ICgpID0+IG9mZmljaWFsRGVwTm9kZXNcclxuICAgICAgICAuZmlsdGVyKGRlcE5vZGUgPT4gY29tRGVwZW5kZW5jaWVzLmZpbmQoZGVwID0+IGRlcC5pZCA9PT0gZGVwTm9kZT8uJD8uSWQpID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgLm1hcChkZXBOb2RlID0+IHtcclxuICAgICAgICBsZXQgZGVwVmVyc2lvbjtcclxuICAgICAgICBjb25zdCBkZXBJZCA9IGRlcE5vZGU/LiQ/LklkO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCB1bnNhbml0aXplZCA9IGRlcE5vZGU/LiQ/LkRlcGVuZGVudFZlcnNpb247XHJcbiAgICAgICAgICBkZXBWZXJzaW9uID0gZ2V0Q2xlYW5WZXJzaW9uKHN1Yk1vZElkLCB1bnNhbml0aXplZCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAvLyBEZXBlbmRlbnRWZXJzaW9uIGlzIGFuIG9wdGlvbmFsIGF0dHJpYnV0ZSwgaXQncyBub3QgYSBiaWcgZGVhbCBpZlxyXG4gICAgICAgICAgLy8gIGl0J3MgbWlzc2luZy5cclxuICAgICAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHJlc29sdmUgZGVwZW5kZW5jeSB2ZXJzaW9uJywgeyBzdWJNb2RJZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeTogSURlcGVuZGVuY3kgPSB7XHJcbiAgICAgICAgICBpZDogZGVwSWQsXHJcbiAgICAgICAgICBpbmNvbXBhdGlibGU6IGZhbHNlLFxyXG4gICAgICAgICAgb3B0aW9uYWw6IGZhbHNlLFxyXG4gICAgICAgICAgb3JkZXI6ICdMb2FkQWZ0ZXJUaGlzJyxcclxuICAgICAgICAgIHZlcnNpb246IGRlcFZlcnNpb24sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlcGVuZGVuY3k7XHJcbiAgICAgIH0pO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGRlcGVuZGVuY2llcyA9IChjb21EZXBlbmRlbmNpZXMubGVuZ3RoID4gMClcclxuICAgICAgICAgID8gW10uY29uY2F0KGdldE9mZmljaWFsRGVwTm9kZXMoKSwgY29tRGVwZW5kZW5jaWVzKVxyXG4gICAgICAgICAgOiBnZXRPZmZpY2lhbERlcE5vZGVzKCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnZGVidWcnLCAnc3VibW9kdWxlIGhhcyBubyBkZXBlbmRlbmNpZXMgb3IgaXMgaW52YWxpZCcsIGVycik7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3ViTW9kTmFtZSA9IGdldEF0dHJWYWx1ZShtb2R1bGUsICdOYW1lJyk7XHJcblxyXG4gICAgICBhY2N1bVtzdWJNb2RJZF0gPSB7XHJcbiAgICAgICAgc3ViTW9kSWQsXHJcbiAgICAgICAgc3ViTW9kTmFtZSxcclxuICAgICAgICBzdWJNb2RWZXIsXHJcbiAgICAgICAgc3ViTW9kRmlsZSxcclxuICAgICAgICB2b3J0ZXhJZDogISFtYW5hZ2VkRW50cnkgPyBtYW5hZ2VkRW50cnkudm9ydGV4SWQgOiBzdWJNb2RJZCxcclxuICAgICAgICBpc09mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhzdWJNb2RJZCksXHJcbiAgICAgICAgaXNMb2NrZWQ6IExPQ0tFRF9NT0RVTEVTLmhhcyhzdWJNb2RJZCksXHJcbiAgICAgICAgaXNNdWx0aXBsYXllcixcclxuICAgICAgICBkZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgaW52YWxpZDoge1xyXG4gICAgICAgICAgLy8gV2lsbCBob2xkIHRoZSBzdWJtb2QgaWRzIG9mIGFueSBkZXRlY3RlZCBjeWNsaWMgZGVwZW5kZW5jaWVzLlxyXG4gICAgICAgICAgY3ljbGljOiBbXSxcclxuXHJcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2YgYW55IG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gICAgICAgICAgbWlzc2luZzogW10sXHJcblxyXG4gICAgICAgICAgLy8gV2lsbCBob2xkIHRoZSBzdWJtb2QgaWRzIG9mIHN1cHBvc2VkbHkgaW5jb21wYXRpYmxlIGRlcGVuZGVuY2llcyAodmVyc2lvbi13aXNlKVxyXG4gICAgICAgICAgaW5jb21wYXRpYmxlRGVwczogW10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAnVm9ydGV4IHdhcyB1bmFibGUgdG8gcGFyc2U6ICcgKyBzdWJNb2RGaWxlICsgJztcXG5cXG4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICdZb3UgY2FuIGVpdGhlciBpbmZvcm0gdGhlIG1vZCBhdXRob3IgYW5kIHdhaXQgZm9yIGZpeCwgb3IgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyAneW91IGNhbiB1c2UgYW4gb25saW5lIHhtbCB2YWxpZGF0b3IgdG8gZmluZCBhbmQgZml4IHRoZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICdlcnJvciB5b3Vyc2VsZi4nO1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ1VuYWJsZSB0byBwYXJzZSBzdWJtb2R1bGUgZmlsZScsXHJcbiAgICAgICAgZXJyb3JNZXNzYWdlLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgbG9nKCdlcnJvcicsICdNTkIyOiBwYXJzaW5nIGVycm9yJywgZXJyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIHt9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlTGF1bmNoZXJEYXRhKCkge1xyXG4gIGNvbnN0IGNyZWF0ZURhdGFFbGVtZW50ID0gKHhtbE5vZGUpID0+IHtcclxuICAgIGlmICh4bWxOb2RlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Yk1vZElkOiB4bWxOb2RlPy5JZFswXSxcclxuICAgICAgZW5hYmxlZDogeG1sTm9kZT8uSXNTZWxlY3RlZFswXSA9PT0gJ3RydWUnLFxyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBjb25zdCBsYXVuY2hlckRhdGEgPSBhd2FpdCBnZXRYTUxEYXRhKExBVU5DSEVSX0RBVEFfUEFUSCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNpbmdsZVBsYXllck1vZHMgPSBsYXVuY2hlckRhdGE/LlVzZXJEYXRhPy5TaW5nbGVwbGF5ZXJEYXRhPy5bMF0/Lk1vZERhdGFzPy5bMF0/LlVzZXJNb2REYXRhIHx8IFtdO1xyXG4gICAgY29uc3QgbXVsdGlQbGF5ZXJNb2RzID0gbGF1bmNoZXJEYXRhPy5Vc2VyRGF0YT8uTXVsdGlwbGF5ZXJEYXRhPy5bMF0/Lk1vZERhdGFzPy5bMF0/LlVzZXJNb2REYXRhIHx8IFtdO1xyXG4gICAgTEFVTkNIRVJfREFUQS5zaW5nbGVQbGF5ZXJTdWJNb2RzID0gc2luZ2xlUGxheWVyTW9kcy5yZWR1Y2UoKGFjY3VtLCBzcG0pID0+IHtcclxuICAgICAgY29uc3QgZGF0YUVsZW1lbnQgPSBjcmVhdGVEYXRhRWxlbWVudChzcG0pO1xyXG4gICAgICBpZiAoISFkYXRhRWxlbWVudCkge1xyXG4gICAgICAgIGFjY3VtLnB1c2goZGF0YUVsZW1lbnQpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICAgIExBVU5DSEVSX0RBVEEubXVsdGlwbGF5ZXJTdWJNb2RzID0gbXVsdGlQbGF5ZXJNb2RzLnJlZHVjZSgoYWNjdW0sIG1wbSkgPT4ge1xyXG4gICAgICBjb25zdCBkYXRhRWxlbWVudCA9IGNyZWF0ZURhdGFFbGVtZW50KG1wbSk7XHJcbiAgICAgIGlmICghIWRhdGFFbGVtZW50KSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChkYXRhRWxlbWVudCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgLy8gVGhpcyBpcyBwb3RlbnRpYWxseSBkdWUgdG8gdGhlIGdhbWUgbm90IGJlaW5nIGluc3RhbGxlZCBjb3JyZWN0bHlcclxuICAgIC8vICBvciBwZXJoYXBzIHRoZSB1c2VycyBhcmUgdXNpbmcgYSAzcmQgcGFydHkgbGF1bmNoZXIgd2hpY2ggb3ZlcndyaXRlc1xyXG4gICAgLy8gIHRoZSBkZWZhdWx0IGxhdW5jaGVyIGNvbmZpZ3VyYXRpb24uLi4gTGV0cyBqdXN0IGRlZmF1bHQgdG8gdGhlIGRhdGFcclxuICAgIC8vICB3ZSBleHBlY3QgYW5kIGxldCB0aGUgdXNlciBkZWFsIHdpdGggd2hhdGV2ZXIgaXMgYnJva2VuIGxhdGVyIG9uXHJcbiAgICAvLyAgaGlzIGVudmlyb25tZW50IGxhdGVyLlxyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgbGF1bmNoZXIgZGF0YScsIGVycik7XHJcbiAgICBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMgPSBbXHJcbiAgICAgIHsgc3ViTW9kSWQ6ICdOYXRpdmUnLCBlbmFibGVkOiB0cnVlIH0sXHJcbiAgICAgIHsgc3ViTW9kSWQ6ICdTYW5kQm94Q29yZScsIGVuYWJsZWQ6IHRydWUgfSxcclxuICAgICAgeyBzdWJNb2RJZDogJ0N1c3RvbUJhdHRsZScsIGVuYWJsZWQ6IHRydWUgfSxcclxuICAgICAgeyBzdWJNb2RJZDogJ1NhbmRib3gnLCBlbmFibGVkOiB0cnVlIH0sXHJcbiAgICAgIHsgc3ViTW9kSWQ6ICdTdG9yeU1vZGUnLCBlbmFibGVkOiB0cnVlIH0sXHJcbiAgICBdO1xyXG4gICAgTEFVTkNIRVJfREFUQS5tdWx0aXBsYXllclN1Yk1vZHMgPSBbXTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE1hbmFnZWRJZHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGlzIGlzIGEgdmFsaWQgdXNlIGNhc2UgaWYgdGhlIGdhbWVtb2RlXHJcbiAgICAvLyAgaGFzIGZhaWxlZCBhY3RpdmF0aW9uLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIGFjdGl2ZVByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpXHJcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQpXHJcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xyXG5cclxuICBjb25zdCBpbnZhbGlkTW9kcyA9IFtdO1xyXG4gIGNvbnN0IGluc3RhbGxhdGlvbkRpciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChpbnN0YWxsYXRpb25EaXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmFnZWQgaWRzJywgJ3VuZGVmaW5lZCBzdGFnaW5nIGZvbGRlcicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoZW5hYmxlZE1vZHMsIGFzeW5jIChhY2N1bSwgZW50cnkpID0+IHtcclxuICAgIGlmIChlbnRyeT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIEludmFsaWQgbW9kIGVudHJ5IC0gc2tpcCBpdC5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RJbnN0YWxsYXRpb25QYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvbkRpciwgZW50cnkuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICBsZXQgZmlsZXM7XHJcbiAgICB0cnkge1xyXG4gICAgICBmaWxlcyA9IGF3YWl0IHdhbGtBc3luYyhtb2RJbnN0YWxsYXRpb25QYXRoLCAzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgbW9kIG11c3QndmUgYmVlbiByZW1vdmVkIG1hbnVhbGx5IGJ5IHRoZSB1c2VyIGZyb21cclxuICAgICAgLy8gIHRoZSBzdGFnaW5nIGZvbGRlciAtIGdvb2Qgam9iIGJ1ZGR5IVxyXG4gICAgICAvLyAgR29pbmcgdG8gbG9nIHRoaXMsIGJ1dCBvdGhlcndpc2UgYWxsb3cgaXQgdG8gcHJvY2VlZC5cclxuICAgICAgaW52YWxpZE1vZHMucHVzaChlbnRyeS5pZCk7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlYWQgbW9kIHN0YWdpbmcgZm9sZGVyJywgeyBtb2RJZDogZW50cnkuaWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3ViTW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICAgIGlmIChzdWJNb2RGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gTm8gc3VibW9kIGZpbGUgLSBubyBMT1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc3ViTW9kSWQ7XHJcbiAgICB0cnkge1xyXG4gICAgICBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShzdWJNb2RGaWxlLCAnSWQnKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgc3VibW9kdWxlIHdvdWxkJ3ZlIG5ldmVyIG1hbmFnZWQgdG8gaW5zdGFsbCBjb3JyZWN0bHlcclxuICAgICAgLy8gIGlmIHRoZSB4bWwgZmlsZSBoYWQgYmVlbiBpbnZhbGlkIC0gdGhpcyBzdWdnZXN0cyB0aGF0IHRoZSB1c2VyXHJcbiAgICAgIC8vICBvciBhIDNyZCBwYXJ0eSBhcHBsaWNhdGlvbiBoYXMgdGFtcGVyZWQgd2l0aCB0aGUgZmlsZS4uLlxyXG4gICAgICAvLyAgV2Ugc2ltcGx5IGxvZyB0aGlzIGhlcmUgYXMgdGhlIHBhcnNlLWluZyBmYWlsdXJlIHdpbGwgYmUgaGlnaGxpZ2h0ZWRcclxuICAgICAgLy8gIGJ5IHRoZSBDQUNIRSBsb2dpYy5cclxuICAgICAgbG9nKCdlcnJvcicsICdbTW5CMl0gVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgc3ViTW9kSWQsXHJcbiAgICAgIHN1Yk1vZEZpbGUsXHJcbiAgICAgIHZvcnRleElkOiBlbnRyeS5pZCxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIFtdKVxyXG4gIC50YXAoKHJlcykgPT4ge1xyXG4gICAgaWYgKGludmFsaWRNb2RzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgZXJyTWVzc2FnZSA9ICdUaGUgZm9sbG93aW5nIG1vZHMgYXJlIGluYWNjZXNzaWJsZSBvciBhcmUgbWlzc2luZyAnXHJcbiAgICAgICAgKyAnaW4gdGhlIHN0YWdpbmcgZm9sZGVyOlxcblxcbicgKyBpbnZhbGlkTW9kcy5qb2luKCdcXG4nKSArICdcXG5cXG5QbGVhc2UgZW5zdXJlICdcclxuICAgICAgICArICd0aGVzZSBtb2RzIGFuZCB0aGVpciBjb250ZW50IGFyZSBub3Qgb3BlbiBpbiBhbnkgb3RoZXIgYXBwbGljYXRpb24gJ1xyXG4gICAgICAgICsgJyhpbmNsdWRpbmcgdGhlIGdhbWUgaXRzZWxmKS4gSWYgdGhlIG1vZCBpcyBtaXNzaW5nIGVudGlyZWx5LCBwbGVhc2UgcmUtaW5zdGFsbCBpdCAnXHJcbiAgICAgICAgKyAnb3IgcmVtb3ZlIGl0IGZyb20geW91ciBtb2RzIHBhZ2UuIFBsZWFzZSBjaGVjayB5b3VyIHZvcnRleCBsb2cgZmlsZSBmb3IgZGV0YWlscy4nO1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTW9kcyBpbiBTdGFnaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihlcnJNZXNzYWdlKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0ludmFsaWQoc3ViTW9kSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IGN5Y2xpY0Vycm9ycyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmdEZXBzID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ21pc3NpbmcnXSwgW10pO1xyXG4gIHJldHVybiAoKGN5Y2xpY0Vycm9ycy5sZW5ndGggPiAwKSB8fCAobWlzc2luZ0RlcHMubGVuZ3RoID4gMCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsaWRhdGlvbkluZm8odm9ydGV4SWQ6IHN0cmluZykge1xyXG4gIC8vIFdlIGV4cGVjdCB0aGUgbWV0aG9kIGNhbGxlciB0byBwcm92aWRlIHRoZSB2b3J0ZXhJZCBvZiB0aGUgc3ViTW9kLCBhc1xyXG4gIC8vICB0aGlzIGlzIGhvdyB3ZSBzdG9yZSB0aGlzIGluZm9ybWF0aW9uIGluIHRoZSBsb2FkIG9yZGVyIG9iamVjdC5cclxuICAvLyAgUmVhc29uIHdoeSB3ZSBuZWVkIHRvIHNlYXJjaCB0aGUgY2FjaGUgYnkgdm9ydGV4SWQgcmF0aGVyIHRoYW4gc3ViTW9kSWQuXHJcbiAgY29uc3Qgc3ViTW9kSWQgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT4gQ0FDSEVba2V5XS52b3J0ZXhJZCA9PT0gdm9ydGV4SWQpO1xyXG4gIGNvbnN0IGN5Y2xpYyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmcgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnbWlzc2luZyddLCBbXSk7XHJcbiAgY29uc3QgaW5jb21wYXRpYmxlID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ2luY29tcGF0aWJsZURlcHMnXSwgW10pO1xyXG4gIHJldHVybiB7XHJcbiAgICBjeWNsaWMsXHJcbiAgICBtaXNzaW5nLFxyXG4gICAgaW5jb21wYXRpYmxlLFxyXG4gIH07XHJcbn1cclxuIl19