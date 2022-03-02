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
    return CACHE;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViTW9kQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJNb2RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFDaEMsZ0RBQXdCO0FBQ3hCLDJDQUF5RDtBQUV6RCxxQ0FDa0Q7QUFFbEQsaUNBQWlGO0FBRWpGLE1BQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7QUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLCtCQUErQixFQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3RJLE1BQU0sYUFBYSxHQUFHO0lBQ3BCLG1CQUFtQixFQUFFLEVBQUU7SUFDdkIsa0JBQWtCLEVBQUUsRUFBRTtDQUN2QixDQUFDO0FBRUYsU0FBZ0IsZUFBZTtJQUM3QixPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBRkQsMENBRUM7QUFFRCxJQUFJLEtBQUssR0FBaUIsRUFBRSxDQUFDO0FBQzdCLFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRkQsNEJBRUM7QUFFRCxTQUFzQixZQUFZLENBQUMsT0FBZ0MsRUFDaEMsV0FBK0I7O1FBQ2hFLElBQUk7WUFDRixLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ1gsTUFBTSxrQkFBa0IsR0FBYSxNQUFNLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLEtBQUssR0FBRyxNQUFNLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUM1RTtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBVEQsb0NBU0M7QUFFRCxTQUFlLHNCQUFzQixDQUFDLE9BQWdDOztRQUNw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QUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBSkQsOEJBSUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxRQUFnQjtJQUloRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDbEYsTUFBTSxNQUFNLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hFLE1BQU0sT0FBTyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMxRSxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4RixPQUFPO1FBQ0wsTUFBTTtRQUNOLE9BQU87UUFDUCxZQUFZO0tBQ2IsQ0FBQztBQUNKLENBQUM7QUFiRCw4Q0FhQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IENvbU1ldGFkYXRhTWFuYWdlciBmcm9tICcuL0NvbU1ldGFkYXRhTWFuYWdlcic7XHJcbmltcG9ydCB7IEdBTUVfSUQsIExPQ0tFRF9NT0RVTEVTLCBNT0RVTEVTLFxyXG4gIE9GRklDSUFMX01PRFVMRVMsIFNVQk1PRF9GSUxFIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJRGVwZW5kZW5jeSwgSVN1Yk1vZENhY2hlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdldENsZWFuVmVyc2lvbiwgZ2V0RWxlbWVudFZhbHVlLCBnZXRYTUxEYXRhLCB3YWxrQXN5bmMgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgWE1MX0VMX01VTFRJUExBWUVSID0gJ011bHRpcGxheWVyTW9kdWxlJztcclxuY29uc3QgTEFVTkNIRVJfREFUQV9QQVRIID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnZG9jdW1lbnRzJyksICdNb3VudCBhbmQgQmxhZGUgSUkgQmFubmVybG9yZCcsICdDb25maWdzJywgJ0xhdW5jaGVyRGF0YS54bWwnKTtcclxuY29uc3QgTEFVTkNIRVJfREFUQSA9IHtcclxuICBzaW5nbGVQbGF5ZXJTdWJNb2RzOiBbXSxcclxuICBtdWx0aXBsYXllclN1Yk1vZHM6IFtdLFxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExhdW5jaGVyRGF0YSgpIHtcclxuICByZXR1cm4gTEFVTkNIRVJfREFUQTtcclxufVxyXG5cclxubGV0IENBQ0hFOiBJU3ViTW9kQ2FjaGUgPSB7fTtcclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhY2hlKCkge1xyXG4gIHJldHVybiBDQUNIRTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hDYWNoZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XHJcbiAgdHJ5IHtcclxuICAgIENBQ0hFID0ge307XHJcbiAgICBjb25zdCBzdWJNb2R1bGVGaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RGVwbG95ZWRTdWJNb2RQYXRocyhjb250ZXh0KTtcclxuICAgIENBQ0hFID0gYXdhaXQgZ2V0RGVwbG95ZWRNb2REYXRhKGNvbnRleHQsIHN1Yk1vZHVsZUZpbGVQYXRocywgbWV0YU1hbmFnZXIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXREZXBsb3llZFN1Yk1vZFBhdGhzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdnYW1lIGRpc2NvdmVyeSBpcyBpbmNvbXBsZXRlJykpO1xyXG4gIH1cclxuICBjb25zdCBtb2R1bGVQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RVTEVTKTtcclxuICBsZXQgbW9kdWxlRmlsZXM7XHJcbiAgdHJ5IHtcclxuICAgIG1vZHVsZUZpbGVzID0gYXdhaXQgd2Fsa0FzeW5jKG1vZHVsZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzID0gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICYmIChbXS5jb25jYXQoWyBNT0RVTEVTIF0sIEFycmF5LmZyb20oT0ZGSUNJQUxfTU9EVUxFUykpKVxyXG4gICAgICAgICAgICAuaW5kZXhPZihwYXRoLmJhc2VuYW1lKGVyci5wYXRoKSkgIT09IC0xKTtcclxuICAgIGNvbnN0IGVycm9yTXNnID0gaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzXHJcbiAgICAgID8gJ0dhbWUgZmlsZXMgYXJlIG1pc3NpbmcgLSBwbGVhc2UgcmUtaW5zdGFsbCB0aGUgZ2FtZSdcclxuICAgICAgOiBlcnIubWVzc2FnZTtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJvck1zZywgZXJyKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuICBjb25zdCBzdWJNb2R1bGVzID0gbW9kdWxlRmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzdWJNb2R1bGVzKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95ZWRNb2REYXRhKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViTW9kdWxlRmlsZVBhdGhzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIGF3YWl0IG1ldGFNYW5hZ2VyLnVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkKTtcclxuICBjb25zdCBtYW5hZ2VkSWRzID0gYXdhaXQgZ2V0TWFuYWdlZElkcyhjb250ZXh0KTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShzdWJNb2R1bGVGaWxlUGF0aHMsIGFzeW5jIChhY2N1bSwgc3ViTW9kRmlsZTogc3RyaW5nKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBnZXRBdHRyVmFsdWUgPSAobm9kZSwgYXR0cikgPT4gbm9kZT8uW2F0dHJdPy5bMF0/LiQ/LnZhbHVlO1xyXG4gICAgICBjb25zdCBzdWJNb2REYXRhID0gYXdhaXQgZ2V0WE1MRGF0YShzdWJNb2RGaWxlKTtcclxuICAgICAgY29uc3QgbW9kdWxlID0gc3ViTW9kRGF0YT8uTW9kdWxlO1xyXG4gICAgICBjb25zdCBzdWJNb2RJZCA9IGdldEF0dHJWYWx1ZShtb2R1bGUsICdJZCcpO1xyXG4gICAgICBjb25zdCBjb21EZXBlbmRlbmNpZXMgPSBtZXRhTWFuYWdlci5nZXREZXBlbmRlbmNpZXMoc3ViTW9kSWQpO1xyXG4gICAgICBjb25zdCBzdWJNb2RWZXJEYXRhID0gZ2V0QXR0clZhbHVlKG1vZHVsZSwgJ1ZlcnNpb24nKTtcclxuICAgICAgY29uc3Qgc3ViTW9kVmVyID0gZ2V0Q2xlYW5WZXJzaW9uKHN1Yk1vZElkLCBzdWJNb2RWZXJEYXRhKTtcclxuICAgICAgY29uc3QgbWFuYWdlZEVudHJ5ID0gbWFuYWdlZElkcy5maW5kKGVudHJ5ID0+IGVudHJ5LnN1Yk1vZElkID09PSBzdWJNb2RJZCk7XHJcbiAgICAgIGNvbnN0IGlzTXVsdGlwbGF5ZXIgPSBnZXRBdHRyVmFsdWUobW9kdWxlLCBYTUxfRUxfTVVMVElQTEFZRVIpICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnN0IG9mZmljaWFsRGVwTm9kZXMgPSBtb2R1bGU/LkRlcGVuZGVkTW9kdWxlcz8uWzBdPy5EZXBlbmRlZE1vZHVsZSB8fCBbXTtcclxuICAgICAgbGV0IGRlcGVuZGVuY2llczogSURlcGVuZGVuY3lbXSA9IFtdO1xyXG4gICAgICBjb25zdCBnZXRPZmZpY2lhbERlcE5vZGVzID0gKCkgPT4gb2ZmaWNpYWxEZXBOb2Rlc1xyXG4gICAgICAgIC5maWx0ZXIoZGVwTm9kZSA9PiBjb21EZXBlbmRlbmNpZXMuZmluZChkZXAgPT4gZGVwLmlkID09PSBkZXBOb2RlPy4kPy5JZCkgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAubWFwKGRlcE5vZGUgPT4ge1xyXG4gICAgICAgIGxldCBkZXBWZXJzaW9uO1xyXG4gICAgICAgIGNvbnN0IGRlcElkID0gZGVwTm9kZT8uJD8uSWQ7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHVuc2FuaXRpemVkID0gZGVwTm9kZT8uJD8uRGVwZW5kZW50VmVyc2lvbjtcclxuICAgICAgICAgIGRlcFZlcnNpb24gPSBnZXRDbGVhblZlcnNpb24oc3ViTW9kSWQsIHVuc2FuaXRpemVkKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIC8vIERlcGVuZGVudFZlcnNpb24gaXMgYW4gb3B0aW9uYWwgYXR0cmlidXRlLCBpdCdzIG5vdCBhIGJpZyBkZWFsIGlmXHJcbiAgICAgICAgICAvLyAgaXQncyBtaXNzaW5nLlxyXG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IHZlcnNpb24nLCB7IHN1Yk1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBkZXBlbmRlbmN5OiBJRGVwZW5kZW5jeSA9IHtcclxuICAgICAgICAgIGlkOiBkZXBJZCxcclxuICAgICAgICAgIGluY29tcGF0aWJsZTogZmFsc2UsXHJcbiAgICAgICAgICBvcHRpb25hbDogZmFsc2UsXHJcbiAgICAgICAgICBvcmRlcjogJ0xvYWRBZnRlclRoaXMnLFxyXG4gICAgICAgICAgdmVyc2lvbjogZGVwVmVyc2lvbixcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZGVwZW5kZW5jeTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgZGVwZW5kZW5jaWVzID0gKGNvbURlcGVuZGVuY2llcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgPyBbXS5jb25jYXQoZ2V0T2ZmaWNpYWxEZXBOb2RlcygpLCBjb21EZXBlbmRlbmNpZXMpXHJcbiAgICAgICAgICA6IGdldE9mZmljaWFsRGVwTm9kZXMoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdzdWJtb2R1bGUgaGFzIG5vIGRlcGVuZGVuY2llcyBvciBpcyBpbnZhbGlkJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzdWJNb2ROYW1lID0gZ2V0QXR0clZhbHVlKG1vZHVsZSwgJ05hbWUnKTtcclxuXHJcbiAgICAgIGFjY3VtW3N1Yk1vZElkXSA9IHtcclxuICAgICAgICBzdWJNb2RJZCxcclxuICAgICAgICBzdWJNb2ROYW1lLFxyXG4gICAgICAgIHN1Yk1vZFZlcixcclxuICAgICAgICBzdWJNb2RGaWxlLFxyXG4gICAgICAgIHZvcnRleElkOiAhIW1hbmFnZWRFbnRyeSA/IG1hbmFnZWRFbnRyeS52b3J0ZXhJZCA6IHN1Yk1vZElkLFxyXG4gICAgICAgIGlzT2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKHN1Yk1vZElkKSxcclxuICAgICAgICBpc0xvY2tlZDogTE9DS0VEX01PRFVMRVMuaGFzKHN1Yk1vZElkKSxcclxuICAgICAgICBpc011bHRpcGxheWVyLFxyXG4gICAgICAgIGRlcGVuZGVuY2llcyxcclxuICAgICAgICBpbnZhbGlkOiB7XHJcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2YgYW55IGRldGVjdGVkIGN5Y2xpYyBkZXBlbmRlbmNpZXMuXHJcbiAgICAgICAgICBjeWNsaWM6IFtdLFxyXG5cclxuICAgICAgICAgIC8vIFdpbGwgaG9sZCB0aGUgc3VibW9kIGlkcyBvZiBhbnkgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgICAgICAgICBtaXNzaW5nOiBbXSxcclxuXHJcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2Ygc3VwcG9zZWRseSBpbmNvbXBhdGlibGUgZGVwZW5kZW5jaWVzICh2ZXJzaW9uLXdpc2UpXHJcbiAgICAgICAgICBpbmNvbXBhdGlibGVEZXBzOiBbXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICdWb3J0ZXggd2FzIHVuYWJsZSB0byBwYXJzZTogJyArIHN1Yk1vZEZpbGUgKyAnO1xcblxcbidcclxuICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1lvdSBjYW4gZWl0aGVyIGluZm9ybSB0aGUgbW9kIGF1dGhvciBhbmQgd2FpdCBmb3IgZml4LCBvciAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICd5b3UgY2FuIHVzZSBhbiBvbmxpbmUgeG1sIHZhbGlkYXRvciB0byBmaW5kIGFuZCBmaXggdGhlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2Vycm9yIHlvdXJzZWxmLic7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJyxcclxuICAgICAgICBlcnJvck1lc3NhZ2UsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ01OQjI6IHBhcnNpbmcgZXJyb3InLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgfSwge30pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VMYXVuY2hlckRhdGEoKSB7XHJcbiAgY29uc3QgY3JlYXRlRGF0YUVsZW1lbnQgPSAoeG1sTm9kZSkgPT4ge1xyXG4gICAgaWYgKHhtbE5vZGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3ViTW9kSWQ6IHhtbE5vZGU/LklkWzBdLFxyXG4gICAgICBlbmFibGVkOiB4bWxOb2RlPy5Jc1NlbGVjdGVkWzBdID09PSAndHJ1ZScsXHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGxhdW5jaGVyRGF0YSA9IGF3YWl0IGdldFhNTERhdGEoTEFVTkNIRVJfREFUQV9QQVRIKTtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc2luZ2xlUGxheWVyTW9kcyA9IGxhdW5jaGVyRGF0YT8uVXNlckRhdGE/LlNpbmdsZXBsYXllckRhdGE/LlswXT8uTW9kRGF0YXM/LlswXT8uVXNlck1vZERhdGEgfHwgW107XHJcbiAgICBjb25zdCBtdWx0aVBsYXllck1vZHMgPSBsYXVuY2hlckRhdGE/LlVzZXJEYXRhPy5NdWx0aXBsYXllckRhdGE/LlswXT8uTW9kRGF0YXM/LlswXT8uVXNlck1vZERhdGEgfHwgW107XHJcbiAgICBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMgPSBzaW5nbGVQbGF5ZXJNb2RzLnJlZHVjZSgoYWNjdW0sIHNwbSkgPT4ge1xyXG4gICAgICBjb25zdCBkYXRhRWxlbWVudCA9IGNyZWF0ZURhdGFFbGVtZW50KHNwbSk7XHJcbiAgICAgIGlmICghIWRhdGFFbGVtZW50KSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChkYXRhRWxlbWVudCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gICAgTEFVTkNIRVJfREFUQS5tdWx0aXBsYXllclN1Yk1vZHMgPSBtdWx0aVBsYXllck1vZHMucmVkdWNlKChhY2N1bSwgbXBtKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGFFbGVtZW50ID0gY3JlYXRlRGF0YUVsZW1lbnQobXBtKTtcclxuICAgICAgaWYgKCEhZGF0YUVsZW1lbnQpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKGRhdGFFbGVtZW50KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBUaGlzIGlzIHBvdGVudGlhbGx5IGR1ZSB0byB0aGUgZ2FtZSBub3QgYmVpbmcgaW5zdGFsbGVkIGNvcnJlY3RseVxyXG4gICAgLy8gIG9yIHBlcmhhcHMgdGhlIHVzZXJzIGFyZSB1c2luZyBhIDNyZCBwYXJ0eSBsYXVuY2hlciB3aGljaCBvdmVyd3JpdGVzXHJcbiAgICAvLyAgdGhlIGRlZmF1bHQgbGF1bmNoZXIgY29uZmlndXJhdGlvbi4uLiBMZXRzIGp1c3QgZGVmYXVsdCB0byB0aGUgZGF0YVxyXG4gICAgLy8gIHdlIGV4cGVjdCBhbmQgbGV0IHRoZSB1c2VyIGRlYWwgd2l0aCB3aGF0ZXZlciBpcyBicm9rZW4gbGF0ZXIgb25cclxuICAgIC8vICBoaXMgZW52aXJvbm1lbnQgbGF0ZXIuXHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBsYXVuY2hlciBkYXRhJywgZXJyKTtcclxuICAgIExBVU5DSEVSX0RBVEEuc2luZ2xlUGxheWVyU3ViTW9kcyA9IFtcclxuICAgICAgeyBzdWJNb2RJZDogJ05hdGl2ZScsIGVuYWJsZWQ6IHRydWUgfSxcclxuICAgICAgeyBzdWJNb2RJZDogJ1NhbmRCb3hDb3JlJywgZW5hYmxlZDogdHJ1ZSB9LFxyXG4gICAgICB7IHN1Yk1vZElkOiAnQ3VzdG9tQmF0dGxlJywgZW5hYmxlZDogdHJ1ZSB9LFxyXG4gICAgICB7IHN1Yk1vZElkOiAnU2FuZGJveCcsIGVuYWJsZWQ6IHRydWUgfSxcclxuICAgICAgeyBzdWJNb2RJZDogJ1N0b3J5TW9kZScsIGVuYWJsZWQ6IHRydWUgfSxcclxuICAgIF07XHJcbiAgICBMQVVOQ0hFUl9EQVRBLm11bHRpcGxheWVyU3ViTW9kcyA9IFtdO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWFuYWdlZElkcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFRoaXMgaXMgYSB2YWxpZCB1c2UgY2FzZSBpZiB0aGUgZ2FtZW1vZGVcclxuICAgIC8vICBoYXMgZmFpbGVkIGFjdGl2YXRpb24uXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgYWN0aXZlUHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RTdGF0ZSlcclxuICAgIC5maWx0ZXIoa2V5ID0+ICEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZClcclxuICAgIC5tYXAoa2V5ID0+IG1vZHNba2V5XSk7XHJcblxyXG4gIGNvbnN0IGludmFsaWRNb2RzID0gW107XHJcbiAgY29uc3QgaW5zdGFsbGF0aW9uRGlyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgaWYgKGluc3RhbGxhdGlvbkRpciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBnZXQgbWFuYWdlZCBpZHMnLCAndW5kZWZpbmVkIHN0YWdpbmcgZm9sZGVyJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShlbmFibGVkTW9kcywgYXN5bmMgKGFjY3VtLCBlbnRyeSkgPT4ge1xyXG4gICAgaWYgKGVudHJ5Py5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gSW52YWxpZCBtb2QgZW50cnkgLSBza2lwIGl0LlxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1vZEluc3RhbGxhdGlvblBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uRGlyLCBlbnRyeS5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgIGxldCBmaWxlcztcclxuICAgIHRyeSB7XHJcbiAgICAgIGZpbGVzID0gYXdhaXQgd2Fsa0FzeW5jKG1vZEluc3RhbGxhdGlvblBhdGgsIDMpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIFRoZSBtb2QgbXVzdCd2ZSBiZWVuIHJlbW92ZWQgbWFudWFsbHkgYnkgdGhlIHVzZXIgZnJvbVxyXG4gICAgICAvLyAgdGhlIHN0YWdpbmcgZm9sZGVyIC0gZ29vZCBqb2IgYnVkZHkhXHJcbiAgICAgIC8vICBHb2luZyB0byBsb2cgdGhpcywgYnV0IG90aGVyd2lzZSBhbGxvdyBpdCB0byBwcm9jZWVkLlxyXG4gICAgICBpbnZhbGlkTW9kcy5wdXNoKGVudHJ5LmlkKTtcclxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVhZCBtb2Qgc3RhZ2luZyBmb2xkZXInLCB7IG1vZElkOiBlbnRyeS5pZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdWJNb2RGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gICAgaWYgKHN1Yk1vZEZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBObyBzdWJtb2QgZmlsZSAtIG5vIExPXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBzdWJNb2RJZDtcclxuICAgIHRyeSB7XHJcbiAgICAgIHN1Yk1vZElkID0gYXdhaXQgZ2V0RWxlbWVudFZhbHVlKHN1Yk1vZEZpbGUsICdJZCcpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIFRoZSBzdWJtb2R1bGUgd291bGQndmUgbmV2ZXIgbWFuYWdlZCB0byBpbnN0YWxsIGNvcnJlY3RseVxyXG4gICAgICAvLyAgaWYgdGhlIHhtbCBmaWxlIGhhZCBiZWVuIGludmFsaWQgLSB0aGlzIHN1Z2dlc3RzIHRoYXQgdGhlIHVzZXJcclxuICAgICAgLy8gIG9yIGEgM3JkIHBhcnR5IGFwcGxpY2F0aW9uIGhhcyB0YW1wZXJlZCB3aXRoIHRoZSBmaWxlLi4uXHJcbiAgICAgIC8vICBXZSBzaW1wbHkgbG9nIHRoaXMgaGVyZSBhcyB0aGUgcGFyc2UtaW5nIGZhaWx1cmUgd2lsbCBiZSBoaWdobGlnaHRlZFxyXG4gICAgICAvLyAgYnkgdGhlIENBQ0hFIGxvZ2ljLlxyXG4gICAgICBsb2coJ2Vycm9yJywgJ1tNbkIyXSBVbmFibGUgdG8gcGFyc2Ugc3VibW9kdWxlIGZpbGUnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICBzdWJNb2RJZCxcclxuICAgICAgc3ViTW9kRmlsZSxcclxuICAgICAgdm9ydGV4SWQ6IGVudHJ5LmlkLFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgfSwgW10pXHJcbiAgLnRhcCgocmVzKSA9PiB7XHJcbiAgICBpZiAoaW52YWxpZE1vZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBjb25zdCBlcnJNZXNzYWdlID0gJ1RoZSBmb2xsb3dpbmcgbW9kcyBhcmUgaW5hY2Nlc3NpYmxlIG9yIGFyZSBtaXNzaW5nICdcclxuICAgICAgICArICdpbiB0aGUgc3RhZ2luZyBmb2xkZXI6XFxuXFxuJyArIGludmFsaWRNb2RzLmpvaW4oJ1xcbicpICsgJ1xcblxcblBsZWFzZSBlbnN1cmUgJ1xyXG4gICAgICAgICsgJ3RoZXNlIG1vZHMgYW5kIHRoZWlyIGNvbnRlbnQgYXJlIG5vdCBvcGVuIGluIGFueSBvdGhlciBhcHBsaWNhdGlvbiAnXHJcbiAgICAgICAgKyAnKGluY2x1ZGluZyB0aGUgZ2FtZSBpdHNlbGYpLiBJZiB0aGUgbW9kIGlzIG1pc3NpbmcgZW50aXJlbHksIHBsZWFzZSByZS1pbnN0YWxsIGl0ICdcclxuICAgICAgICArICdvciByZW1vdmUgaXQgZnJvbSB5b3VyIG1vZHMgcGFnZS4gUGxlYXNlIGNoZWNrIHlvdXIgdm9ydGV4IGxvZyBmaWxlIGZvciBkZXRhaWxzLic7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBNb2RzIGluIFN0YWdpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKGVyck1lc3NhZ2UpLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzSW52YWxpZChzdWJNb2RJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgY3ljbGljRXJyb3JzID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ2N5Y2xpYyddLCBbXSk7XHJcbiAgY29uc3QgbWlzc2luZ0RlcHMgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnbWlzc2luZyddLCBbXSk7XHJcbiAgcmV0dXJuICgoY3ljbGljRXJyb3JzLmxlbmd0aCA+IDApIHx8IChtaXNzaW5nRGVwcy5sZW5ndGggPiAwKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWxpZGF0aW9uSW5mbyh2b3J0ZXhJZDogc3RyaW5nKSB7XHJcbiAgLy8gV2UgZXhwZWN0IHRoZSBtZXRob2QgY2FsbGVyIHRvIHByb3ZpZGUgdGhlIHZvcnRleElkIG9mIHRoZSBzdWJNb2QsIGFzXHJcbiAgLy8gIHRoaXMgaXMgaG93IHdlIHN0b3JlIHRoaXMgaW5mb3JtYXRpb24gaW4gdGhlIGxvYWQgb3JkZXIgb2JqZWN0LlxyXG4gIC8vICBSZWFzb24gd2h5IHdlIG5lZWQgdG8gc2VhcmNoIHRoZSBjYWNoZSBieSB2b3J0ZXhJZCByYXRoZXIgdGhhbiBzdWJNb2RJZC5cclxuICBjb25zdCBzdWJNb2RJZCA9IE9iamVjdC5rZXlzKENBQ0hFKS5maW5kKGtleSA9PiBDQUNIRVtrZXldLnZvcnRleElkID09PSB2b3J0ZXhJZCk7XHJcbiAgY29uc3QgY3ljbGljID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ2N5Y2xpYyddLCBbXSk7XHJcbiAgY29uc3QgbWlzc2luZyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdtaXNzaW5nJ10sIFtdKTtcclxuICBjb25zdCBpbmNvbXBhdGlibGUgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnaW5jb21wYXRpYmxlRGVwcyddLCBbXSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIGN5Y2xpYyxcclxuICAgIG1pc3NpbmcsXHJcbiAgICBpbmNvbXBhdGlibGUsXHJcbiAgfTtcclxufVxyXG4iXX0=