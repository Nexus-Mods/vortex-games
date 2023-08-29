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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViTW9kQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJNb2RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFDaEMsZ0RBQXdCO0FBQ3hCLDJDQUF5RDtBQUV6RCxxQ0FDa0Q7QUFFbEQsaUNBQWlGO0FBRWpGLE1BQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7QUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLCtCQUErQixFQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3RJLE1BQU0sYUFBYSxHQUFHO0lBQ3BCLG1CQUFtQixFQUFFLEVBQUU7SUFDdkIsa0JBQWtCLEVBQUUsRUFBRTtDQUN2QixDQUFDO0FBRUYsU0FBZ0IsZUFBZTtJQUM3QixPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBRkQsMENBRUM7QUFFRCxJQUFJLEtBQUssR0FBaUIsRUFBRSxDQUFDO0FBQzdCLFNBQWdCLFFBQVE7SUFDdEIsT0FBTyxLQUFLLGFBQUwsS0FBSyxjQUFMLEtBQUssR0FBSSxFQUFFLENBQUM7QUFDckIsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWdDLEVBQ2hDLFdBQStCOztRQUNoRSxJQUFJO1lBQ0YsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNYLE1BQU0sa0JBQWtCLEdBQWEsTUFBTSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRSxLQUFLLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDNUU7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQVRELG9DQVNDO0FB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QUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUpELDhCQUlDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsUUFBZ0I7SUFJaEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDO0lBQ2xGLE1BQU0sTUFBTSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4RSxNQUFNLE9BQU8sR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUUsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEYsT0FBTztRQUNMLE1BQU07UUFDTixPQUFPO1FBQ1AsWUFBWTtLQUNiLENBQUM7QUFDSixDQUFDO0FBYkQsOENBYUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCBDb21NZXRhZGF0YU1hbmFnZXIgZnJvbSAnLi9Db21NZXRhZGF0YU1hbmFnZXInO1xuaW1wb3J0IHsgR0FNRV9JRCwgTE9DS0VEX01PRFVMRVMsIE1PRFVMRVMsXG4gIE9GRklDSUFMX01PRFVMRVMsIFNVQk1PRF9GSUxFIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgSURlcGVuZGVuY3ksIElTdWJNb2RDYWNoZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZ2V0Q2xlYW5WZXJzaW9uLCBnZXRFbGVtZW50VmFsdWUsIGdldFhNTERhdGEsIHdhbGtBc3luYyB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IFhNTF9FTF9NVUxUSVBMQVlFUiA9ICdNdWx0aXBsYXllck1vZHVsZSc7XG5jb25zdCBMQVVOQ0hFUl9EQVRBX1BBVEggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ01vdW50IGFuZCBCbGFkZSBJSSBCYW5uZXJsb3JkJywgJ0NvbmZpZ3MnLCAnTGF1bmNoZXJEYXRhLnhtbCcpO1xuY29uc3QgTEFVTkNIRVJfREFUQSA9IHtcbiAgc2luZ2xlUGxheWVyU3ViTW9kczogW10sXG4gIG11bHRpcGxheWVyU3ViTW9kczogW10sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGF1bmNoZXJEYXRhKCkge1xuICByZXR1cm4gTEFVTkNIRVJfREFUQTtcbn1cblxubGV0IENBQ0hFOiBJU3ViTW9kQ2FjaGUgPSB7fTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYWNoZSgpIHtcbiAgcmV0dXJuIENBQ0hFID8/IHt9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENhY2hlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XG4gIHRyeSB7XG4gICAgQ0FDSEUgPSB7fTtcbiAgICBjb25zdCBzdWJNb2R1bGVGaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RGVwbG95ZWRTdWJNb2RQYXRocyhjb250ZXh0KTtcbiAgICBDQUNIRSA9IGF3YWl0IGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0LCBzdWJNb2R1bGVGaWxlUGF0aHMsIG1ldGFNYW5hZ2VyKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95ZWRTdWJNb2RQYXRocyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2dhbWUgZGlzY292ZXJ5IGlzIGluY29tcGxldGUnKSk7XG4gIH1cbiAgY29uc3QgbW9kdWxlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9EVUxFUyk7XG4gIGxldCBtb2R1bGVGaWxlcztcbiAgdHJ5IHtcbiAgICBtb2R1bGVGaWxlcyA9IGF3YWl0IHdhbGtBc3luYyhtb2R1bGVQYXRoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG4gICAgY29uc3QgaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzID0gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXG4gICAgICAmJiAoW10uY29uY2F0KFsgTU9EVUxFUyBdLCBBcnJheS5mcm9tKE9GRklDSUFMX01PRFVMRVMpKSlcbiAgICAgICAgICAgIC5pbmRleE9mKHBhdGguYmFzZW5hbWUoZXJyLnBhdGgpKSAhPT0gLTEpO1xuICAgIGNvbnN0IGVycm9yTXNnID0gaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzXG4gICAgICA/ICdHYW1lIGZpbGVzIGFyZSBtaXNzaW5nIC0gcGxlYXNlIHJlLWluc3RhbGwgdGhlIGdhbWUnXG4gICAgICA6IGVyci5tZXNzYWdlO1xuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJvck1zZywgZXJyKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgfVxuICBjb25zdCBzdWJNb2R1bGVzID0gbW9kdWxlRmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoc3ViTW9kdWxlcyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJNb2R1bGVGaWxlUGF0aHM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGF3YWl0IG1ldGFNYW5hZ2VyLnVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkKTtcbiAgY29uc3QgbWFuYWdlZElkcyA9IGF3YWl0IGdldE1hbmFnZWRJZHMoY29udGV4dCk7XG5cbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShzdWJNb2R1bGVGaWxlUGF0aHMsIGFzeW5jIChhY2N1bSwgc3ViTW9kRmlsZTogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGdldEF0dHJWYWx1ZSA9IChub2RlLCBhdHRyKSA9PiBub2RlPy5bYXR0cl0/LlswXT8uJD8udmFsdWU7XG4gICAgICBjb25zdCBzdWJNb2REYXRhID0gYXdhaXQgZ2V0WE1MRGF0YShzdWJNb2RGaWxlKTtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IHN1Yk1vZERhdGE/Lk1vZHVsZTtcbiAgICAgIGNvbnN0IHN1Yk1vZElkID0gZ2V0QXR0clZhbHVlKG1vZHVsZSwgJ0lkJyk7XG4gICAgICBjb25zdCBjb21EZXBlbmRlbmNpZXMgPSBtZXRhTWFuYWdlci5nZXREZXBlbmRlbmNpZXMoc3ViTW9kSWQpO1xuICAgICAgY29uc3Qgc3ViTW9kVmVyRGF0YSA9IGdldEF0dHJWYWx1ZShtb2R1bGUsICdWZXJzaW9uJyk7XG4gICAgICBjb25zdCBzdWJNb2RWZXIgPSBnZXRDbGVhblZlcnNpb24oc3ViTW9kSWQsIHN1Yk1vZFZlckRhdGEpO1xuICAgICAgY29uc3QgbWFuYWdlZEVudHJ5ID0gbWFuYWdlZElkcy5maW5kKGVudHJ5ID0+IGVudHJ5LnN1Yk1vZElkID09PSBzdWJNb2RJZCk7XG4gICAgICBjb25zdCBpc011bHRpcGxheWVyID0gZ2V0QXR0clZhbHVlKG1vZHVsZSwgWE1MX0VMX01VTFRJUExBWUVSKSAhPT0gdW5kZWZpbmVkO1xuICAgICAgY29uc3Qgb2ZmaWNpYWxEZXBOb2RlcyA9IG1vZHVsZT8uRGVwZW5kZWRNb2R1bGVzPy5bMF0/LkRlcGVuZGVkTW9kdWxlIHx8IFtdO1xuICAgICAgbGV0IGRlcGVuZGVuY2llczogSURlcGVuZGVuY3lbXSA9IFtdO1xuICAgICAgY29uc3QgZ2V0T2ZmaWNpYWxEZXBOb2RlcyA9ICgpID0+IG9mZmljaWFsRGVwTm9kZXNcbiAgICAgICAgLmZpbHRlcihkZXBOb2RlID0+IGNvbURlcGVuZGVuY2llcy5maW5kKGRlcCA9PiBkZXAuaWQgPT09IGRlcE5vZGU/LiQ/LklkKSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAubWFwKGRlcE5vZGUgPT4ge1xuICAgICAgICBsZXQgZGVwVmVyc2lvbjtcbiAgICAgICAgY29uc3QgZGVwSWQgPSBkZXBOb2RlPy4kPy5JZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB1bnNhbml0aXplZCA9IGRlcE5vZGU/LiQ/LkRlcGVuZGVudFZlcnNpb247XG4gICAgICAgICAgZGVwVmVyc2lvbiA9IGdldENsZWFuVmVyc2lvbihzdWJNb2RJZCwgdW5zYW5pdGl6ZWQpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBEZXBlbmRlbnRWZXJzaW9uIGlzIGFuIG9wdGlvbmFsIGF0dHJpYnV0ZSwgaXQncyBub3QgYSBiaWcgZGVhbCBpZlxuICAgICAgICAgIC8vICBpdCdzIG1pc3NpbmcuXG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IHZlcnNpb24nLCB7IHN1Yk1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZXBlbmRlbmN5OiBJRGVwZW5kZW5jeSA9IHtcbiAgICAgICAgICBpZDogZGVwSWQsXG4gICAgICAgICAgaW5jb21wYXRpYmxlOiBmYWxzZSxcbiAgICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6ICdMb2FkQWZ0ZXJUaGlzJyxcbiAgICAgICAgICB2ZXJzaW9uOiBkZXBWZXJzaW9uLFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBkZXBlbmRlbmN5O1xuICAgICAgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBkZXBlbmRlbmNpZXMgPSAoY29tRGVwZW5kZW5jaWVzLmxlbmd0aCA+IDApXG4gICAgICAgICAgPyBbXS5jb25jYXQoZ2V0T2ZmaWNpYWxEZXBOb2RlcygpLCBjb21EZXBlbmRlbmNpZXMpXG4gICAgICAgICAgOiBnZXRPZmZpY2lhbERlcE5vZGVzKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdzdWJtb2R1bGUgaGFzIG5vIGRlcGVuZGVuY2llcyBvciBpcyBpbnZhbGlkJywgZXJyKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN1Yk1vZE5hbWUgPSBnZXRBdHRyVmFsdWUobW9kdWxlLCAnTmFtZScpO1xuXG4gICAgICBhY2N1bVtzdWJNb2RJZF0gPSB7XG4gICAgICAgIHN1Yk1vZElkLFxuICAgICAgICBzdWJNb2ROYW1lLFxuICAgICAgICBzdWJNb2RWZXIsXG4gICAgICAgIHN1Yk1vZEZpbGUsXG4gICAgICAgIHZvcnRleElkOiAhIW1hbmFnZWRFbnRyeSA/IG1hbmFnZWRFbnRyeS52b3J0ZXhJZCA6IHN1Yk1vZElkLFxuICAgICAgICBpc09mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhzdWJNb2RJZCksXG4gICAgICAgIGlzTG9ja2VkOiBMT0NLRURfTU9EVUxFUy5oYXMoc3ViTW9kSWQpLFxuICAgICAgICBpc011bHRpcGxheWVyLFxuICAgICAgICBkZXBlbmRlbmNpZXMsXG4gICAgICAgIGludmFsaWQ6IHtcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2YgYW55IGRldGVjdGVkIGN5Y2xpYyBkZXBlbmRlbmNpZXMuXG4gICAgICAgICAgY3ljbGljOiBbXSxcblxuICAgICAgICAgIC8vIFdpbGwgaG9sZCB0aGUgc3VibW9kIGlkcyBvZiBhbnkgbWlzc2luZyBkZXBlbmRlbmNpZXMuXG4gICAgICAgICAgbWlzc2luZzogW10sXG5cbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2Ygc3VwcG9zZWRseSBpbmNvbXBhdGlibGUgZGVwZW5kZW5jaWVzICh2ZXJzaW9uLXdpc2UpXG4gICAgICAgICAgaW5jb21wYXRpYmxlRGVwczogW10sXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gJ1ZvcnRleCB3YXMgdW5hYmxlIHRvIHBhcnNlOiAnICsgc3ViTW9kRmlsZSArICc7XFxuXFxuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1lvdSBjYW4gZWl0aGVyIGluZm9ybSB0aGUgbW9kIGF1dGhvciBhbmQgd2FpdCBmb3IgZml4LCBvciAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyAneW91IGNhbiB1c2UgYW4gb25saW5lIHhtbCB2YWxpZGF0b3IgdG8gZmluZCBhbmQgZml4IHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyAnZXJyb3IgeW91cnNlbGYuJztcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJyxcbiAgICAgICAgZXJyb3JNZXNzYWdlLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgIGxvZygnZXJyb3InLCAnTU5CMjogcGFyc2luZyBlcnJvcicsIGVycik7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICB9LCB7fSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUxhdW5jaGVyRGF0YSgpIHtcbiAgY29uc3QgY3JlYXRlRGF0YUVsZW1lbnQgPSAoeG1sTm9kZSkgPT4ge1xuICAgIGlmICh4bWxOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBzdWJNb2RJZDogeG1sTm9kZT8uSWRbMF0sXG4gICAgICBlbmFibGVkOiB4bWxOb2RlPy5Jc1NlbGVjdGVkWzBdID09PSAndHJ1ZScsXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBsYXVuY2hlckRhdGEgPSBhd2FpdCBnZXRYTUxEYXRhKExBVU5DSEVSX0RBVEFfUEFUSCk7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2luZ2xlUGxheWVyTW9kcyA9IGxhdW5jaGVyRGF0YT8uVXNlckRhdGE/LlNpbmdsZXBsYXllckRhdGE/LlswXT8uTW9kRGF0YXM/LlswXT8uVXNlck1vZERhdGEgfHwgW107XG4gICAgY29uc3QgbXVsdGlQbGF5ZXJNb2RzID0gbGF1bmNoZXJEYXRhPy5Vc2VyRGF0YT8uTXVsdGlwbGF5ZXJEYXRhPy5bMF0/Lk1vZERhdGFzPy5bMF0/LlVzZXJNb2REYXRhIHx8IFtdO1xuICAgIExBVU5DSEVSX0RBVEEuc2luZ2xlUGxheWVyU3ViTW9kcyA9IHNpbmdsZVBsYXllck1vZHMucmVkdWNlKChhY2N1bSwgc3BtKSA9PiB7XG4gICAgICBjb25zdCBkYXRhRWxlbWVudCA9IGNyZWF0ZURhdGFFbGVtZW50KHNwbSk7XG4gICAgICBpZiAoISFkYXRhRWxlbWVudCkge1xuICAgICAgICBhY2N1bS5wdXNoKGRhdGFFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9LCBbXSk7XG4gICAgTEFVTkNIRVJfREFUQS5tdWx0aXBsYXllclN1Yk1vZHMgPSBtdWx0aVBsYXllck1vZHMucmVkdWNlKChhY2N1bSwgbXBtKSA9PiB7XG4gICAgICBjb25zdCBkYXRhRWxlbWVudCA9IGNyZWF0ZURhdGFFbGVtZW50KG1wbSk7XG4gICAgICBpZiAoISFkYXRhRWxlbWVudCkge1xuICAgICAgICBhY2N1bS5wdXNoKGRhdGFFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9LCBbXSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIFRoaXMgaXMgcG90ZW50aWFsbHkgZHVlIHRvIHRoZSBnYW1lIG5vdCBiZWluZyBpbnN0YWxsZWQgY29ycmVjdGx5XG4gICAgLy8gIG9yIHBlcmhhcHMgdGhlIHVzZXJzIGFyZSB1c2luZyBhIDNyZCBwYXJ0eSBsYXVuY2hlciB3aGljaCBvdmVyd3JpdGVzXG4gICAgLy8gIHRoZSBkZWZhdWx0IGxhdW5jaGVyIGNvbmZpZ3VyYXRpb24uLi4gTGV0cyBqdXN0IGRlZmF1bHQgdG8gdGhlIGRhdGFcbiAgICAvLyAgd2UgZXhwZWN0IGFuZCBsZXQgdGhlIHVzZXIgZGVhbCB3aXRoIHdoYXRldmVyIGlzIGJyb2tlbiBsYXRlciBvblxuICAgIC8vICBoaXMgZW52aXJvbm1lbnQgbGF0ZXIuXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgbGF1bmNoZXIgZGF0YScsIGVycik7XG4gICAgTEFVTkNIRVJfREFUQS5zaW5nbGVQbGF5ZXJTdWJNb2RzID0gW1xuICAgICAgeyBzdWJNb2RJZDogJ05hdGl2ZScsIGVuYWJsZWQ6IHRydWUgfSxcbiAgICAgIHsgc3ViTW9kSWQ6ICdTYW5kQm94Q29yZScsIGVuYWJsZWQ6IHRydWUgfSxcbiAgICAgIHsgc3ViTW9kSWQ6ICdDdXN0b21CYXR0bGUnLCBlbmFibGVkOiB0cnVlIH0sXG4gICAgICB7IHN1Yk1vZElkOiAnU2FuZGJveCcsIGVuYWJsZWQ6IHRydWUgfSxcbiAgICAgIHsgc3ViTW9kSWQ6ICdTdG9yeU1vZGUnLCBlbmFibGVkOiB0cnVlIH0sXG4gICAgXTtcbiAgICBMQVVOQ0hFUl9EQVRBLm11bHRpcGxheWVyU3ViTW9kcyA9IFtdO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRNYW5hZ2VkSWRzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFRoaXMgaXMgYSB2YWxpZCB1c2UgY2FzZSBpZiB0aGUgZ2FtZW1vZGVcbiAgICAvLyAgaGFzIGZhaWxlZCBhY3RpdmF0aW9uLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9XG5cbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgYWN0aXZlUHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZFN0YXRlKVxuICAgIC5maWx0ZXIoa2V5ID0+ICEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZClcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xuXG4gIGNvbnN0IGludmFsaWRNb2RzID0gW107XG4gIGNvbnN0IGluc3RhbGxhdGlvbkRpciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBpZiAoaW5zdGFsbGF0aW9uRGlyID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBnZXQgbWFuYWdlZCBpZHMnLCAndW5kZWZpbmVkIHN0YWdpbmcgZm9sZGVyJyk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gIH1cbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShlbmFibGVkTW9kcywgYXN5bmMgKGFjY3VtLCBlbnRyeSkgPT4ge1xuICAgIGlmIChlbnRyeT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBJbnZhbGlkIG1vZCBlbnRyeSAtIHNraXAgaXQuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICB9XG4gICAgY29uc3QgbW9kSW5zdGFsbGF0aW9uUGF0aCA9IHBhdGguam9pbihpbnN0YWxsYXRpb25EaXIsIGVudHJ5Lmluc3RhbGxhdGlvblBhdGgpO1xuICAgIGxldCBmaWxlcztcbiAgICB0cnkge1xuICAgICAgZmlsZXMgPSBhd2FpdCB3YWxrQXN5bmMobW9kSW5zdGFsbGF0aW9uUGF0aCwgMyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBUaGUgbW9kIG11c3QndmUgYmVlbiByZW1vdmVkIG1hbnVhbGx5IGJ5IHRoZSB1c2VyIGZyb21cbiAgICAgIC8vICB0aGUgc3RhZ2luZyBmb2xkZXIgLSBnb29kIGpvYiBidWRkeSFcbiAgICAgIC8vICBHb2luZyB0byBsb2cgdGhpcywgYnV0IG90aGVyd2lzZSBhbGxvdyBpdCB0byBwcm9jZWVkLlxuICAgICAgaW52YWxpZE1vZHMucHVzaChlbnRyeS5pZCk7XG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZWFkIG1vZCBzdGFnaW5nIGZvbGRlcicsIHsgbW9kSWQ6IGVudHJ5LmlkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdWJNb2RGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xuICAgIGlmIChzdWJNb2RGaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE5vIHN1Ym1vZCBmaWxlIC0gbm8gTE9cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICAgIH1cblxuICAgIGxldCBzdWJNb2RJZDtcbiAgICB0cnkge1xuICAgICAgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUoc3ViTW9kRmlsZSwgJ0lkJyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBUaGUgc3VibW9kdWxlIHdvdWxkJ3ZlIG5ldmVyIG1hbmFnZWQgdG8gaW5zdGFsbCBjb3JyZWN0bHlcbiAgICAgIC8vICBpZiB0aGUgeG1sIGZpbGUgaGFkIGJlZW4gaW52YWxpZCAtIHRoaXMgc3VnZ2VzdHMgdGhhdCB0aGUgdXNlclxuICAgICAgLy8gIG9yIGEgM3JkIHBhcnR5IGFwcGxpY2F0aW9uIGhhcyB0YW1wZXJlZCB3aXRoIHRoZSBmaWxlLi4uXG4gICAgICAvLyAgV2Ugc2ltcGx5IGxvZyB0aGlzIGhlcmUgYXMgdGhlIHBhcnNlLWluZyBmYWlsdXJlIHdpbGwgYmUgaGlnaGxpZ2h0ZWRcbiAgICAgIC8vICBieSB0aGUgQ0FDSEUgbG9naWMuXG4gICAgICBsb2coJ2Vycm9yJywgJ1tNbkIyXSBVbmFibGUgdG8gcGFyc2Ugc3VibW9kdWxlIGZpbGUnLCBlcnIpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgfVxuICAgIGFjY3VtLnB1c2goe1xuICAgICAgc3ViTW9kSWQsXG4gICAgICBzdWJNb2RGaWxlLFxuICAgICAgdm9ydGV4SWQ6IGVudHJ5LmlkLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gIH0sIFtdKVxuICAudGFwKChyZXMpID0+IHtcbiAgICBpZiAoaW52YWxpZE1vZHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgZXJyTWVzc2FnZSA9ICdUaGUgZm9sbG93aW5nIG1vZHMgYXJlIGluYWNjZXNzaWJsZSBvciBhcmUgbWlzc2luZyAnXG4gICAgICAgICsgJ2luIHRoZSBzdGFnaW5nIGZvbGRlcjpcXG5cXG4nICsgaW52YWxpZE1vZHMuam9pbignXFxuJykgKyAnXFxuXFxuUGxlYXNlIGVuc3VyZSAnXG4gICAgICAgICsgJ3RoZXNlIG1vZHMgYW5kIHRoZWlyIGNvbnRlbnQgYXJlIG5vdCBvcGVuIGluIGFueSBvdGhlciBhcHBsaWNhdGlvbiAnXG4gICAgICAgICsgJyhpbmNsdWRpbmcgdGhlIGdhbWUgaXRzZWxmKS4gSWYgdGhlIG1vZCBpcyBtaXNzaW5nIGVudGlyZWx5LCBwbGVhc2UgcmUtaW5zdGFsbCBpdCAnXG4gICAgICAgICsgJ29yIHJlbW92ZSBpdCBmcm9tIHlvdXIgbW9kcyBwYWdlLiBQbGVhc2UgY2hlY2sgeW91ciB2b3J0ZXggbG9nIGZpbGUgZm9yIGRldGFpbHMuJztcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBNb2RzIGluIFN0YWdpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihlcnJNZXNzYWdlKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ludmFsaWQoc3ViTW9kSWQ6IHN0cmluZykge1xuICBjb25zdCBjeWNsaWNFcnJvcnMgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnY3ljbGljJ10sIFtdKTtcbiAgY29uc3QgbWlzc2luZ0RlcHMgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnbWlzc2luZyddLCBbXSk7XG4gIHJldHVybiAoKGN5Y2xpY0Vycm9ycy5sZW5ndGggPiAwKSB8fCAobWlzc2luZ0RlcHMubGVuZ3RoID4gMCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsaWRhdGlvbkluZm8odm9ydGV4SWQ6IHN0cmluZykge1xuICAvLyBXZSBleHBlY3QgdGhlIG1ldGhvZCBjYWxsZXIgdG8gcHJvdmlkZSB0aGUgdm9ydGV4SWQgb2YgdGhlIHN1Yk1vZCwgYXNcbiAgLy8gIHRoaXMgaXMgaG93IHdlIHN0b3JlIHRoaXMgaW5mb3JtYXRpb24gaW4gdGhlIGxvYWQgb3JkZXIgb2JqZWN0LlxuICAvLyAgUmVhc29uIHdoeSB3ZSBuZWVkIHRvIHNlYXJjaCB0aGUgY2FjaGUgYnkgdm9ydGV4SWQgcmF0aGVyIHRoYW4gc3ViTW9kSWQuXG4gIGNvbnN0IHN1Yk1vZElkID0gT2JqZWN0LmtleXMoQ0FDSEUpLmZpbmQoa2V5ID0+IENBQ0hFW2tleV0udm9ydGV4SWQgPT09IHZvcnRleElkKTtcbiAgY29uc3QgY3ljbGljID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ2N5Y2xpYyddLCBbXSk7XG4gIGNvbnN0IG1pc3NpbmcgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnbWlzc2luZyddLCBbXSk7XG4gIGNvbnN0IGluY29tcGF0aWJsZSA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdpbmNvbXBhdGlibGVEZXBzJ10sIFtdKTtcbiAgcmV0dXJuIHtcbiAgICBjeWNsaWMsXG4gICAgbWlzc2luZyxcbiAgICBpbmNvbXBhdGlibGUsXG4gIH07XG59XG4iXX0=