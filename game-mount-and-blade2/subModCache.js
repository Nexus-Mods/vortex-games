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
const semver_1 = __importDefault(require("semver"));
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
function refreshCache(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            CACHE = {};
            const subModuleFilePaths = yield getDeployedSubModPaths(context);
            CACHE = yield getDeployedModData(context, subModuleFilePaths);
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
function getDeployedModData(context, subModuleFilePaths) {
    return __awaiter(this, void 0, void 0, function* () {
        const managedIds = yield getManagedIds(context);
        const getCleanVersion = (subModId, unsanitized) => {
            if (!unsanitized) {
                (0, vortex_api_1.log)('debug', 'failed to sanitize/coerce version', { subModId, unsanitized });
                return undefined;
            }
            try {
                const sanitized = unsanitized.replace(/[a-z]|[A-Z]/g, '');
                const coerced = semver_1.default.coerce(sanitized);
                return coerced.version;
            }
            catch (err) {
                (0, vortex_api_1.log)('debug', 'failed to sanitize/coerce version', { subModId, unsanitized, error: err.message });
                return undefined;
            }
        };
        return bluebird_1.default.reduce(subModuleFilePaths, (accum, subModFile) => __awaiter(this, void 0, void 0, function* () {
            try {
                const subModData = yield (0, util_1.getXMLData)(subModFile);
                const subModId = subModData.get('//Id').attr('value').value();
                const subModVerData = subModData.get('//Version').attr('value').value();
                const subModVer = getCleanVersion(subModId, subModVerData);
                const managedEntry = managedIds.find(entry => entry.subModId === subModId);
                const isMultiplayer = (!!subModData.get(`//${XML_EL_MULTIPLAYER}`));
                const depNodes = subModData.find('//DependedModule');
                let dependencies = [];
                try {
                    dependencies = depNodes.map(depNode => {
                        let depVersion;
                        const depId = depNode.attr('Id').value();
                        try {
                            const unsanitized = depNode.attr('DependentVersion').value();
                            depVersion = getCleanVersion(subModId, unsanitized);
                        }
                        catch (err) {
                            (0, vortex_api_1.log)('debug', 'failed to resolve dependency version', { subModId, error: err.message });
                        }
                        return { depId, depVersion };
                    });
                }
                catch (err) {
                    (0, vortex_api_1.log)('debug', 'submodule has no dependencies or is invalid', err);
                }
                const subModName = subModData.get('//Name').attr('value').value();
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
    return __awaiter(this, void 0, void 0, function* () {
        const idRegexp = /\<Id\>(.*?)\<\/Id\>/gm;
        const enabledRegexp = /\<IsSelected\>(.*?)\<\/IsSelected\>/gm;
        const trimTagsRegexp = /<[^>]*>?/gm;
        const createDataElement = (xmlNode) => {
            const nodeString = xmlNode.toString({ whitespace: false }).replace(/[ \t\r\n]/gm, '');
            if (!!nodeString) {
                return {
                    subModId: nodeString.match(idRegexp)[0].replace(trimTagsRegexp, ''),
                    enabled: nodeString.match(enabledRegexp)[0]
                        .toLowerCase()
                        .replace(trimTagsRegexp, '') === 'true',
                };
            }
            else {
                return undefined;
            }
        };
        const launcherData = yield (0, util_1.getXMLData)(LAUNCHER_DATA_PATH);
        try {
            const singlePlayerMods = launcherData.get('//UserData/SingleplayerData/ModDatas').childNodes();
            const multiPlayerMods = launcherData.get('//UserData/MultiplayerData/ModDatas')
                .childNodes();
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
            return Promise.reject(new vortex_api_1.util.DataInvalid(err.message));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViTW9kQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJNb2RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFFaEMsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBeUQ7QUFDekQscUNBQ2tEO0FBRWxELGlDQUFnRTtBQUVoRSxNQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO0FBQy9DLE1BQU0sa0JBQWtCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSwrQkFBK0IsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUN0SSxNQUFNLGFBQWEsR0FBRztJQUNwQixtQkFBbUIsRUFBRSxFQUFFO0lBQ3ZCLGtCQUFrQixFQUFFLEVBQUU7Q0FDdkIsQ0FBQztBQUVGLFNBQWdCLGVBQWU7SUFDN0IsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUZELDBDQUVDO0FBRUQsSUFBSSxLQUFLLEdBQWlCLEVBQUUsQ0FBQztBQUM3QixTQUFnQixRQUFRO0lBQ3RCLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWdDOztRQUNqRSxJQUFJO1lBQ0YsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNYLE1BQU0sa0JBQWtCLEdBQWEsTUFBTSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRSxLQUFLLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztTQUMvRDtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBUkQsb0NBUUM7QUFFRCxTQUFlLHNCQUFzQixDQUFDLE9BQWdDOztRQUNwRSxNQUFNLEtB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dCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IEVsZW1lbnQgfSBmcm9tICdsaWJ4bWxqcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lELCBMT0NLRURfTU9EVUxFUywgTU9EVUxFUyxcclxuICBPRkZJQ0lBTF9NT0RVTEVTLCBTVUJNT0RfRklMRSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSVN1Yk1vZENhY2hlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdldEVsZW1lbnRWYWx1ZSwgZ2V0WE1MRGF0YSwgd2Fsa0FzeW5jIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IFhNTF9FTF9NVUxUSVBMQVlFUiA9ICdNdWx0aXBsYXllck1vZHVsZSc7XHJcbmNvbnN0IExBVU5DSEVSX0RBVEFfUEFUSCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnTW91bnQgYW5kIEJsYWRlIElJIEJhbm5lcmxvcmQnLCAnQ29uZmlncycsICdMYXVuY2hlckRhdGEueG1sJyk7XHJcbmNvbnN0IExBVU5DSEVSX0RBVEEgPSB7XHJcbiAgc2luZ2xlUGxheWVyU3ViTW9kczogW10sXHJcbiAgbXVsdGlwbGF5ZXJTdWJNb2RzOiBbXSxcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXVuY2hlckRhdGEoKSB7XHJcbiAgcmV0dXJuIExBVU5DSEVSX0RBVEE7XHJcbn1cclxuXHJcbmxldCBDQUNIRTogSVN1Yk1vZENhY2hlID0ge307XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYWNoZSgpIHtcclxuICByZXR1cm4gQ0FDSEU7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWZyZXNoQ2FjaGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICB0cnkge1xyXG4gICAgQ0FDSEUgPSB7fTtcclxuICAgIGNvbnN0IHN1Yk1vZHVsZUZpbGVQYXRoczogc3RyaW5nW10gPSBhd2FpdCBnZXREZXBsb3llZFN1Yk1vZFBhdGhzKGNvbnRleHQpO1xyXG4gICAgQ0FDSEUgPSBhd2FpdCBnZXREZXBsb3llZE1vZERhdGEoY29udGV4dCwgc3ViTW9kdWxlRmlsZVBhdGhzKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95ZWRTdWJNb2RQYXRocyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZ2FtZSBkaXNjb3ZlcnkgaXMgaW5jb21wbGV0ZScpKTtcclxuICB9XHJcbiAgY29uc3QgbW9kdWxlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9EVUxFUyk7XHJcbiAgbGV0IG1vZHVsZUZpbGVzO1xyXG4gIHRyeSB7XHJcbiAgICBtb2R1bGVGaWxlcyA9IGF3YWl0IHdhbGtBc3luYyhtb2R1bGVQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGlzTWlzc2luZ09mZmljaWFsTW9kdWxlcyA9ICgoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAmJiAoW10uY29uY2F0KFsgTU9EVUxFUyBdLCBBcnJheS5mcm9tKE9GRklDSUFMX01PRFVMRVMpKSlcclxuICAgICAgICAgICAgLmluZGV4T2YocGF0aC5iYXNlbmFtZShlcnIucGF0aCkpICE9PSAtMSk7XHJcbiAgICBjb25zdCBlcnJvck1zZyA9IGlzTWlzc2luZ09mZmljaWFsTW9kdWxlc1xyXG4gICAgICA/ICdHYW1lIGZpbGVzIGFyZSBtaXNzaW5nIC0gcGxlYXNlIHJlLWluc3RhbGwgdGhlIGdhbWUnXHJcbiAgICAgIDogZXJyLm1lc3NhZ2U7XHJcbiAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyb3JNc2csIGVycik7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcbiAgY29uc3Qgc3ViTW9kdWxlcyA9IG1vZHVsZUZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoc3ViTW9kdWxlcyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgc3ViTW9kdWxlRmlsZVBhdGhzOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IG1hbmFnZWRJZHMgPSBhd2FpdCBnZXRNYW5hZ2VkSWRzKGNvbnRleHQpO1xyXG4gIGNvbnN0IGdldENsZWFuVmVyc2lvbiA9IChzdWJNb2RJZCwgdW5zYW5pdGl6ZWQpID0+IHtcclxuICAgIGlmICghdW5zYW5pdGl6ZWQpIHtcclxuICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gc2FuaXRpemUvY29lcmNlIHZlcnNpb24nLCB7IHN1Yk1vZElkLCB1bnNhbml0aXplZCB9KTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHNhbml0aXplZCA9IHVuc2FuaXRpemVkLnJlcGxhY2UoL1thLXpdfFtBLVpdL2csICcnKTtcclxuICAgICAgY29uc3QgY29lcmNlZCA9IHNlbXZlci5jb2VyY2Uoc2FuaXRpemVkKTtcclxuICAgICAgcmV0dXJuIGNvZXJjZWQudmVyc2lvbjtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byBzYW5pdGl6ZS9jb2VyY2UgdmVyc2lvbicsXHJcbiAgICAgICAgeyBzdWJNb2RJZCwgdW5zYW5pdGl6ZWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKHN1Yk1vZHVsZUZpbGVQYXRocywgYXN5bmMgKGFjY3VtLCBzdWJNb2RGaWxlOiBzdHJpbmcpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZERhdGEgPSBhd2FpdCBnZXRYTUxEYXRhKHN1Yk1vZEZpbGUpO1xyXG4gICAgICBjb25zdCBzdWJNb2RJZCA9IHN1Yk1vZERhdGEuZ2V0PEVsZW1lbnQ+KCcvL0lkJykuYXR0cigndmFsdWUnKS52YWx1ZSgpO1xyXG4gICAgICBjb25zdCBzdWJNb2RWZXJEYXRhID0gc3ViTW9kRGF0YS5nZXQ8RWxlbWVudD4oJy8vVmVyc2lvbicpLmF0dHIoJ3ZhbHVlJykudmFsdWUoKTtcclxuICAgICAgY29uc3Qgc3ViTW9kVmVyID0gZ2V0Q2xlYW5WZXJzaW9uKHN1Yk1vZElkLCBzdWJNb2RWZXJEYXRhKTtcclxuICAgICAgY29uc3QgbWFuYWdlZEVudHJ5ID0gbWFuYWdlZElkcy5maW5kKGVudHJ5ID0+IGVudHJ5LnN1Yk1vZElkID09PSBzdWJNb2RJZCk7XHJcbiAgICAgIGNvbnN0IGlzTXVsdGlwbGF5ZXIgPSAoISFzdWJNb2REYXRhLmdldChgLy8ke1hNTF9FTF9NVUxUSVBMQVlFUn1gKSk7XHJcbiAgICAgIGNvbnN0IGRlcE5vZGVzID0gc3ViTW9kRGF0YS5maW5kPEVsZW1lbnQ+KCcvL0RlcGVuZGVkTW9kdWxlJyk7XHJcbiAgICAgIGxldCBkZXBlbmRlbmNpZXMgPSBbXTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBkZXBlbmRlbmNpZXMgPSBkZXBOb2Rlcy5tYXAoZGVwTm9kZSA9PiB7XHJcbiAgICAgICAgICBsZXQgZGVwVmVyc2lvbjtcclxuICAgICAgICAgIGNvbnN0IGRlcElkID0gZGVwTm9kZS5hdHRyKCdJZCcpLnZhbHVlKCk7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB1bnNhbml0aXplZCA9IGRlcE5vZGUuYXR0cignRGVwZW5kZW50VmVyc2lvbicpLnZhbHVlKCk7XHJcbiAgICAgICAgICAgIGRlcFZlcnNpb24gPSBnZXRDbGVhblZlcnNpb24oc3ViTW9kSWQsIHVuc2FuaXRpemVkKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAvLyBEZXBlbmRlbnRWZXJzaW9uIGlzIGFuIG9wdGlvbmFsIGF0dHJpYnV0ZSwgaXQncyBub3QgYSBiaWcgZGVhbCBpZlxyXG4gICAgICAgICAgICAvLyAgaXQncyBtaXNzaW5nLlxyXG4gICAgICAgICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byByZXNvbHZlIGRlcGVuZGVuY3kgdmVyc2lvbicsIHsgc3ViTW9kSWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4geyBkZXBJZCwgZGVwVmVyc2lvbiB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBsb2coJ2RlYnVnJywgJ3N1Ym1vZHVsZSBoYXMgbm8gZGVwZW5kZW5jaWVzIG9yIGlzIGludmFsaWQnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHN1Yk1vZE5hbWUgPSBzdWJNb2REYXRhLmdldDxFbGVtZW50PignLy9OYW1lJykuYXR0cigndmFsdWUnKS52YWx1ZSgpO1xyXG5cclxuICAgICAgYWNjdW1bc3ViTW9kSWRdID0ge1xyXG4gICAgICAgIHN1Yk1vZElkLFxyXG4gICAgICAgIHN1Yk1vZE5hbWUsXHJcbiAgICAgICAgc3ViTW9kVmVyLFxyXG4gICAgICAgIHN1Yk1vZEZpbGUsXHJcbiAgICAgICAgdm9ydGV4SWQ6ICEhbWFuYWdlZEVudHJ5ID8gbWFuYWdlZEVudHJ5LnZvcnRleElkIDogc3ViTW9kSWQsXHJcbiAgICAgICAgaXNPZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoc3ViTW9kSWQpLFxyXG4gICAgICAgIGlzTG9ja2VkOiBMT0NLRURfTU9EVUxFUy5oYXMoc3ViTW9kSWQpLFxyXG4gICAgICAgIGlzTXVsdGlwbGF5ZXIsXHJcbiAgICAgICAgZGVwZW5kZW5jaWVzLFxyXG4gICAgICAgIGludmFsaWQ6IHtcclxuICAgICAgICAgIC8vIFdpbGwgaG9sZCB0aGUgc3VibW9kIGlkcyBvZiBhbnkgZGV0ZWN0ZWQgY3ljbGljIGRlcGVuZGVuY2llcy5cclxuICAgICAgICAgIGN5Y2xpYzogW10sXHJcblxyXG4gICAgICAgICAgLy8gV2lsbCBob2xkIHRoZSBzdWJtb2QgaWRzIG9mIGFueSBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAgICAgICAgIG1pc3Npbmc6IFtdLFxyXG5cclxuICAgICAgICAgIC8vIFdpbGwgaG9sZCB0aGUgc3VibW9kIGlkcyBvZiBzdXBwb3NlZGx5IGluY29tcGF0aWJsZSBkZXBlbmRlbmNpZXMgKHZlcnNpb24td2lzZSlcclxuICAgICAgICAgIGluY29tcGF0aWJsZURlcHM6IFtdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gJ1ZvcnRleCB3YXMgdW5hYmxlIHRvIHBhcnNlOiAnICsgc3ViTW9kRmlsZSArICc7XFxuXFxuJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyAnWW91IGNhbiBlaXRoZXIgaW5mb3JtIHRoZSBtb2QgYXV0aG9yIGFuZCB3YWl0IGZvciBmaXgsIG9yICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3lvdSBjYW4gdXNlIGFuIG9ubGluZSB4bWwgdmFsaWRhdG9yIHRvIGZpbmQgYW5kIGZpeCB0aGUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyAnZXJyb3IgeW91cnNlbGYuJztcclxuICAgICAgLy8gbGlieG1sanMgcmFyZWx5IHByb2R1Y2VzIHVzZWZ1bCBlcnJvciBtZXNzYWdlcyAtIGl0IHVzdWFsbHkgcG9pbnRzXHJcbiAgICAgIC8vICB0byB0aGUgcGFyZW50IG5vZGUgb2YgdGhlIGFjdHVhbCBwcm9ibGVtIGFuZCBpbiB0aGlzIGNhc2UgbmVhcmx5XHJcbiAgICAgIC8vICBhbHdheXMgd2lsbCBwb2ludCB0byB0aGUgcm9vdCBvZiB0aGUgWE1MIGZpbGUgKE1vZHVsZSkgd2hpY2ggaXMgY29tcGxldGVseSB1c2VsZXNzLlxyXG4gICAgICAvLyAgV2UncmUgZ29pbmcgdG8gcHJvdmlkZSBhIGh1bWFuIHJlYWRhYmxlIGVycm9yIHRvIHRoZSB1c2VyLlxyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ1VuYWJsZSB0byBwYXJzZSBzdWJtb2R1bGUgZmlsZScsXHJcbiAgICAgICAgZXJyb3JNZXNzYWdlLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgbG9nKCdlcnJvcicsICdNTkIyOiBwYXJzaW5nIGVycm9yJywgZXJyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIHt9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlTGF1bmNoZXJEYXRhKCkge1xyXG4gIGNvbnN0IGlkUmVnZXhwID0gL1xcPElkXFw+KC4qPylcXDxcXC9JZFxcPi9nbTtcclxuICBjb25zdCBlbmFibGVkUmVnZXhwID0gL1xcPElzU2VsZWN0ZWRcXD4oLio/KVxcPFxcL0lzU2VsZWN0ZWRcXD4vZ207XHJcbiAgY29uc3QgdHJpbVRhZ3NSZWdleHAgPSAvPFtePl0qPj8vZ207XHJcblxyXG4gIGNvbnN0IGNyZWF0ZURhdGFFbGVtZW50ID0gKHhtbE5vZGUpID0+IHtcclxuICAgIGNvbnN0IG5vZGVTdHJpbmcgPSB4bWxOb2RlLnRvU3RyaW5nKHsgd2hpdGVzcGFjZTogZmFsc2UgfSkucmVwbGFjZSgvWyBcXHRcXHJcXG5dL2dtLCAnJyk7XHJcbiAgICBpZiAoISFub2RlU3RyaW5nKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3ViTW9kSWQ6IG5vZGVTdHJpbmcubWF0Y2goaWRSZWdleHApWzBdLnJlcGxhY2UodHJpbVRhZ3NSZWdleHAsICcnKSxcclxuICAgICAgICBlbmFibGVkOiBub2RlU3RyaW5nLm1hdGNoKGVuYWJsZWRSZWdleHApWzBdXHJcbiAgICAgICAgICAudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgLnJlcGxhY2UodHJpbVRhZ3NSZWdleHAsICcnKSA9PT0gJ3RydWUnLFxyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBsYXVuY2hlckRhdGEgPSBhd2FpdCBnZXRYTUxEYXRhKExBVU5DSEVSX0RBVEFfUEFUSCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNpbmdsZVBsYXllck1vZHMgPVxyXG4gICAgICBsYXVuY2hlckRhdGEuZ2V0PEVsZW1lbnQ+KCcvL1VzZXJEYXRhL1NpbmdsZXBsYXllckRhdGEvTW9kRGF0YXMnKS5jaGlsZE5vZGVzKCk7XHJcbiAgICBjb25zdCBtdWx0aVBsYXllck1vZHMgPSBsYXVuY2hlckRhdGEuZ2V0PEVsZW1lbnQ+KCcvL1VzZXJEYXRhL011bHRpcGxheWVyRGF0YS9Nb2REYXRhcycpXHJcbiAgICAgIC5jaGlsZE5vZGVzKCk7XHJcbiAgICBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMgPSBzaW5nbGVQbGF5ZXJNb2RzLnJlZHVjZSgoYWNjdW0sIHNwbSkgPT4ge1xyXG4gICAgICBjb25zdCBkYXRhRWxlbWVudCA9IGNyZWF0ZURhdGFFbGVtZW50KHNwbSk7XHJcbiAgICAgIGlmICghIWRhdGFFbGVtZW50KSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChkYXRhRWxlbWVudCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gICAgTEFVTkNIRVJfREFUQS5tdWx0aXBsYXllclN1Yk1vZHMgPSBtdWx0aVBsYXllck1vZHMucmVkdWNlKChhY2N1bSwgbXBtKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGFFbGVtZW50ID0gY3JlYXRlRGF0YUVsZW1lbnQobXBtKTtcclxuICAgICAgaWYgKCEhZGF0YUVsZW1lbnQpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKGRhdGFFbGVtZW50KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE1hbmFnZWRJZHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGlzIGlzIGEgdmFsaWQgdXNlIGNhc2UgaWYgdGhlIGdhbWVtb2RlXHJcbiAgICAvLyAgaGFzIGZhaWxlZCBhY3RpdmF0aW9uLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIGFjdGl2ZVByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpXHJcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQpXHJcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xyXG5cclxuICBjb25zdCBpbnZhbGlkTW9kcyA9IFtdO1xyXG4gIGNvbnN0IGluc3RhbGxhdGlvbkRpciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChpbnN0YWxsYXRpb25EaXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmFnZWQgaWRzJywgJ3VuZGVmaW5lZCBzdGFnaW5nIGZvbGRlcicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoZW5hYmxlZE1vZHMsIGFzeW5jIChhY2N1bSwgZW50cnkpID0+IHtcclxuICAgIGlmIChlbnRyeT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIEludmFsaWQgbW9kIGVudHJ5IC0gc2tpcCBpdC5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RJbnN0YWxsYXRpb25QYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvbkRpciwgZW50cnkuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICBsZXQgZmlsZXM7XHJcbiAgICB0cnkge1xyXG4gICAgICBmaWxlcyA9IGF3YWl0IHdhbGtBc3luYyhtb2RJbnN0YWxsYXRpb25QYXRoLCAzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgbW9kIG11c3QndmUgYmVlbiByZW1vdmVkIG1hbnVhbGx5IGJ5IHRoZSB1c2VyIGZyb21cclxuICAgICAgLy8gIHRoZSBzdGFnaW5nIGZvbGRlciAtIGdvb2Qgam9iIGJ1ZGR5IVxyXG4gICAgICAvLyAgR29pbmcgdG8gbG9nIHRoaXMsIGJ1dCBvdGhlcndpc2UgYWxsb3cgaXQgdG8gcHJvY2VlZC5cclxuICAgICAgaW52YWxpZE1vZHMucHVzaChlbnRyeS5pZCk7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlYWQgbW9kIHN0YWdpbmcgZm9sZGVyJywgeyBtb2RJZDogZW50cnkuaWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3ViTW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICAgIGlmIChzdWJNb2RGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gTm8gc3VibW9kIGZpbGUgLSBubyBMT1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc3ViTW9kSWQ7XHJcbiAgICB0cnkge1xyXG4gICAgICBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShzdWJNb2RGaWxlLCAnSWQnKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgc3VibW9kdWxlIHdvdWxkJ3ZlIG5ldmVyIG1hbmFnZWQgdG8gaW5zdGFsbCBjb3JyZWN0bHlcclxuICAgICAgLy8gIGlmIHRoZSB4bWwgZmlsZSBoYWQgYmVlbiBpbnZhbGlkIC0gdGhpcyBzdWdnZXN0cyB0aGF0IHRoZSB1c2VyXHJcbiAgICAgIC8vICBvciBhIDNyZCBwYXJ0eSBhcHBsaWNhdGlvbiBoYXMgdGFtcGVyZWQgd2l0aCB0aGUgZmlsZS4uLlxyXG4gICAgICAvLyAgV2Ugc2ltcGx5IGxvZyB0aGlzIGhlcmUgYXMgdGhlIHBhcnNlLWluZyBmYWlsdXJlIHdpbGwgYmUgaGlnaGxpZ2h0ZWRcclxuICAgICAgLy8gIGJ5IHRoZSBDQUNIRSBsb2dpYy5cclxuICAgICAgbG9nKCdlcnJvcicsICdbTW5CMl0gVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgc3ViTW9kSWQsXHJcbiAgICAgIHN1Yk1vZEZpbGUsXHJcbiAgICAgIHZvcnRleElkOiBlbnRyeS5pZCxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIFtdKVxyXG4gIC50YXAoKHJlcykgPT4ge1xyXG4gICAgaWYgKGludmFsaWRNb2RzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgZXJyTWVzc2FnZSA9ICdUaGUgZm9sbG93aW5nIG1vZHMgYXJlIGluYWNjZXNzaWJsZSBvciBhcmUgbWlzc2luZyAnXHJcbiAgICAgICAgKyAnaW4gdGhlIHN0YWdpbmcgZm9sZGVyOlxcblxcbicgKyBpbnZhbGlkTW9kcy5qb2luKCdcXG4nKSArICdcXG5cXG5QbGVhc2UgZW5zdXJlICdcclxuICAgICAgICArICd0aGVzZSBtb2RzIGFuZCB0aGVpciBjb250ZW50IGFyZSBub3Qgb3BlbiBpbiBhbnkgb3RoZXIgYXBwbGljYXRpb24gJ1xyXG4gICAgICAgICsgJyhpbmNsdWRpbmcgdGhlIGdhbWUgaXRzZWxmKS4gSWYgdGhlIG1vZCBpcyBtaXNzaW5nIGVudGlyZWx5LCBwbGVhc2UgcmUtaW5zdGFsbCBpdCAnXHJcbiAgICAgICAgKyAnb3IgcmVtb3ZlIGl0IGZyb20geW91ciBtb2RzIHBhZ2UuIFBsZWFzZSBjaGVjayB5b3VyIHZvcnRleCBsb2cgZmlsZSBmb3IgZGV0YWlscy4nO1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTW9kcyBpbiBTdGFnaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihlcnJNZXNzYWdlKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0ludmFsaWQoc3ViTW9kSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IGN5Y2xpY0Vycm9ycyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmdEZXBzID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ21pc3NpbmcnXSwgW10pO1xyXG4gIHJldHVybiAoKGN5Y2xpY0Vycm9ycy5sZW5ndGggPiAwKSB8fCAobWlzc2luZ0RlcHMubGVuZ3RoID4gMCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsaWRhdGlvbkluZm8odm9ydGV4SWQ6IHN0cmluZykge1xyXG4gIC8vIFdlIGV4cGVjdCB0aGUgbWV0aG9kIGNhbGxlciB0byBwcm92aWRlIHRoZSB2b3J0ZXhJZCBvZiB0aGUgc3ViTW9kLCBhc1xyXG4gIC8vICB0aGlzIGlzIGhvdyB3ZSBzdG9yZSB0aGlzIGluZm9ybWF0aW9uIGluIHRoZSBsb2FkIG9yZGVyIG9iamVjdC5cclxuICAvLyAgUmVhc29uIHdoeSB3ZSBuZWVkIHRvIHNlYXJjaCB0aGUgY2FjaGUgYnkgdm9ydGV4SWQgcmF0aGVyIHRoYW4gc3ViTW9kSWQuXHJcbiAgY29uc3Qgc3ViTW9kSWQgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT4gQ0FDSEVba2V5XS52b3J0ZXhJZCA9PT0gdm9ydGV4SWQpO1xyXG4gIGNvbnN0IGN5Y2xpYyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmcgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnbWlzc2luZyddLCBbXSk7XHJcbiAgY29uc3QgaW5jb21wYXRpYmxlID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ2luY29tcGF0aWJsZURlcHMnXSwgW10pO1xyXG4gIHJldHVybiB7XHJcbiAgICBjeWNsaWMsXHJcbiAgICBtaXNzaW5nLFxyXG4gICAgaW5jb21wYXRpYmxlLFxyXG4gIH07XHJcbn1cclxuIl19