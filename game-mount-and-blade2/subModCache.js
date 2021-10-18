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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViTW9kQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJNb2RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFFaEMsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBeUQ7QUFDekQscUNBQ2tEO0FBRWxELGlDQUFnRTtBQUVoRSxNQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO0FBQy9DLE1BQU0sa0JBQWtCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSwrQkFBK0IsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUN0SSxNQUFNLGFBQWEsR0FBRztJQUNwQixtQkFBbUIsRUFBRSxFQUFFO0lBQ3ZCLGtCQUFrQixFQUFFLEVBQUU7Q0FDdkIsQ0FBQztBQUVGLFNBQWdCLGVBQWU7SUFDN0IsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUZELDBDQUVDO0FBRUQsSUFBSSxLQUFLLEdBQWlCLEVBQUUsQ0FBQztBQUM3QixTQUFnQixRQUFRO0lBQ3RCLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWdDOztRQUNqRSxJQUFJO1lBQ0YsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNYLE1BQU0sa0JBQWtCLEdBQWEsTUFBTSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRSxLQUFLLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztTQUMvRDtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBUkQsb0NBUUM7QUFFRCxTQUFlLHNCQUFzQixDQUFDLE9BQWdDOztRQUNwRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEcsSUFBSSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFO1lBQ2pDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztTQUNqRjtRQUNELE1BQU0sVUFBVSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDdEQsSUFBSSxXQUFXLENBQUM7UUFDaEIsSUFBSTtZQUNGLFdBQVcsR0FBRyxNQUFNLElBQUEsZ0JBQVMsRUFBQyxVQUFVLENBQUMsQ0FBQztTQUMzQztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osSUFBSSxHQUFHLFlBQVksaUJBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ3BDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUM1QjtZQUNELE1BQU0sd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO21CQUNwRCxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBRSxnQkFBTyxDQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyx5QkFBZ0IsQ0FBQyxDQUFDLENBQUM7cUJBQ2xELE9BQU8sQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxRQUFRLEdBQUcsd0JBQXdCO2dCQUN2QyxDQUFDLENBQUMscURBQXFEO2dCQUN2RCxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNqRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFDRCxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxvQkFBVyxDQUFDLENBQUM7UUFDakcsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FBQTtBQUVELFNBQWUsa0JBQWtCLENBQUMsT0FBZ0MsRUFBRSxrQkFBNEI7O1FBQzlGLE1BQU0sVUFBVSxHQUFHLE1BQU0sYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hELE1BQU0sZUFBZSxHQUFHLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxFQUFFO1lBQ2hELElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2hCLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsbUNBQW1DLEVBQUUsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDN0UsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFDRCxJQUFJO2dCQUNGLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLE9BQU8sR0FBRyxnQkFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDekMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO2FBQ3hCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxtQ0FBbUMsRUFDOUMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDakQsT0FBTyxTQUFTLENBQUM7YUFDbEI7UUFDSCxDQUFDLENBQUM7UUFFRixPQUFPLGtCQUFRLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQU8sS0FBSyxFQUFFLFVBQWtCLEVBQUUsRUFBRTtZQUM3RSxJQUFJO2dCQUNGLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSxpQkFBVSxFQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFVLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdkUsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBVSxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pGLE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQzNELE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQVUsa0JBQWtCLENBQUMsQ0FBQztnQkFDOUQsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO2dCQUN0QixJQUFJO29CQUNGLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUNwQyxJQUFJLFVBQVUsQ0FBQzt3QkFDZixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUN6QyxJQUFJOzRCQUNGLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0QkFDN0QsVUFBVSxHQUFHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7eUJBQ3JEO3dCQUFDLE9BQU8sR0FBRyxFQUFFOzRCQUdaLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsc0NBQXNDLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO3lCQUN4Rjt3QkFFRCxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDO29CQUMvQixDQUFDLENBQUMsQ0FBQztpQkFDSjtnQkFBQyxPQUFPLEdBQUcsRUFBRTtvQkFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLDZDQUE2QyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUNsRTtnQkFDRCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFVLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFM0UsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHO29CQUNoQixRQUFRO29CQUNSLFVBQVU7b0JBQ1YsU0FBUztvQkFDVCxVQUFVO29CQUNWLFFBQVEsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRO29CQUMzRCxVQUFVLEVBQUUseUJBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztvQkFDMUMsUUFBUSxFQUFFLHVCQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztvQkFDdEMsYUFBYTtvQkFDYixZQUFZO29CQUNaLE9BQU8sRUFBRTt3QkFFUCxNQUFNLEVBQUUsRUFBRTt3QkFHVixPQUFPLEVBQUUsRUFBRTt3QkFHWCxnQkFBZ0IsRUFBRSxFQUFFO3FCQUNyQjtpQkFDRixDQUFDO2FBQ0g7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixNQUFNLFlBQVksR0FBRyw4QkFBOEIsR0FBRyxVQUFVLEdBQUcsT0FBTztzQkFDckQsNERBQTREO3NCQUM1RCwwREFBMEQ7c0JBQzFELGlCQUFpQixDQUFDO2dCQUt2QyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxFQUNoRSxZQUFZLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDeEMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUMxQztZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUEsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNULENBQUM7Q0FBQTtBQUVELFNBQXNCLGlCQUFpQjs7UUFDckMsTUFBTSxRQUFRLEdBQUcsdUJBQXVCLENBQUM7UUFDekMsTUFBTSxhQUFhLEdBQUcsdUNBQXVDLENBQUM7UUFDOUQsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDO1FBRXBDLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUNwQyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUU7Z0JBQ2hCLE9BQU87b0JBQ0wsUUFBUSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUM7b0JBQ25FLE9BQU8sRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDeEMsV0FBVyxFQUFFO3lCQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLEtBQUssTUFBTTtpQkFDMUMsQ0FBQzthQUNIO2lCQUFNO2dCQUNMLE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLGlCQUFVLEVBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUMxRCxJQUFJO1lBQ0YsTUFBTSxnQkFBZ0IsR0FDcEIsWUFBWSxDQUFDLEdBQUcsQ0FBVSxzQ0FBc0MsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2pGLE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQVUscUNBQXFDLENBQUM7aUJBQ3JGLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLGFBQWEsQ0FBQyxtQkFBbUIsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQ3pFLE1BQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUU7b0JBQ2pCLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQ3pCO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsYUFBYSxDQUFDLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQ3ZFLE1BQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUU7b0JBQ2pCLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQ3pCO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ1I7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQU1aLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsK0JBQStCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsYUFBYSxDQUFDLG1CQUFtQixHQUFHO2dCQUNsQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDckMsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7Z0JBQzFDLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUMzQyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtnQkFDdEMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDekMsQ0FBQztZQUNGLGFBQWEsQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7WUFDdEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7SUFDSCxDQUFDO0NBQUE7QUF4REQsOENBd0RDO0FBRUQsU0FBZSxhQUFhLENBQUMsT0FBZ0M7O1FBQzNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNDLE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JELElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUcvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFFRCxNQUFNLFFBQVEsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2pDLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxhQUFhLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2FBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQzthQUNuRCxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV6QixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDdkIsTUFBTSxlQUFlLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ3JFLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRTtZQUNqQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLDJCQUEyQixFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFDdEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxrQkFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBTyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDekQsSUFBSSxDQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxnQkFBZ0IsTUFBSyxTQUFTLEVBQUU7Z0JBRXpDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMvQjtZQUNELE1BQU0sbUJBQW1CLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDL0UsSUFBSSxLQUFLLENBQUM7WUFDVixJQUFJO2dCQUNGLEtBQUssR0FBRyxNQUFNLElBQUEsZ0JBQVMsRUFBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNqRDtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUlaLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMzQixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLG1DQUFtQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDL0I7WUFFRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxvQkFBVyxDQUFDLENBQUM7WUFDekYsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUU1QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDL0I7WUFFRCxJQUFJLFFBQVEsQ0FBQztZQUNiLElBQUk7Z0JBQ0YsUUFBUSxHQUFHLE1BQU0sSUFBQSxzQkFBZSxFQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNwRDtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQU1aLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsdUNBQXVDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMvQjtZQUNELEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ1QsUUFBUTtnQkFDUixVQUFVO2dCQUNWLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRTthQUNuQixDQUFDLENBQUM7WUFFSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFDO2FBQ0wsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDWCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUMxQixNQUFNLFVBQVUsR0FBRyxxREFBcUQ7c0JBQ3BFLDRCQUE0QixHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQW9CO3NCQUM1RSxxRUFBcUU7c0JBQ3JFLG9GQUFvRjtzQkFDcEYsa0ZBQWtGLENBQUM7Z0JBQ3ZGLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMseUJBQXlCLEVBQ3pCLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7YUFDbEY7WUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFFRCxTQUFnQixTQUFTLENBQUMsUUFBZ0I7SUFDeEMsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzlFLE1BQU0sV0FBVyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5RSxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7QUFKRCw4QkFJQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLFFBQWdCO0lBSWhELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQztJQUNsRixNQUFNLE1BQU0sR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEUsTUFBTSxPQUFPLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sWUFBWSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hGLE9BQU87UUFDTCxNQUFNO1FBQ04sT0FBTztRQUNQLFlBQVk7S0FDYixDQUFDO0FBQ0osQ0FBQztBQWJELDhDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgRWxlbWVudCB9IGZyb20gJ2xpYnhtbGpzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQsIExPQ0tFRF9NT0RVTEVTLCBNT0RVTEVTLFxyXG4gIE9GRklDSUFMX01PRFVMRVMsIFNVQk1PRF9GSUxFIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJU3ViTW9kQ2FjaGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2V0RWxlbWVudFZhbHVlLCBnZXRYTUxEYXRhLCB3YWxrQXN5bmMgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgWE1MX0VMX01VTFRJUExBWUVSID0gJ011bHRpcGxheWVyTW9kdWxlJztcclxuY29uc3QgTEFVTkNIRVJfREFUQV9QQVRIID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnZG9jdW1lbnRzJyksICdNb3VudCBhbmQgQmxhZGUgSUkgQmFubmVybG9yZCcsICdDb25maWdzJywgJ0xhdW5jaGVyRGF0YS54bWwnKTtcclxuY29uc3QgTEFVTkNIRVJfREFUQSA9IHtcclxuICBzaW5nbGVQbGF5ZXJTdWJNb2RzOiBbXSxcclxuICBtdWx0aXBsYXllclN1Yk1vZHM6IFtdLFxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExhdW5jaGVyRGF0YSgpIHtcclxuICByZXR1cm4gTEFVTkNIRVJfREFUQTtcclxufVxyXG5cclxubGV0IENBQ0hFOiBJU3ViTW9kQ2FjaGUgPSB7fTtcclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhY2hlKCkge1xyXG4gIHJldHVybiBDQUNIRTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hDYWNoZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIHRyeSB7XHJcbiAgICBDQUNIRSA9IHt9O1xyXG4gICAgY29uc3Qgc3ViTW9kdWxlRmlsZVBhdGhzOiBzdHJpbmdbXSA9IGF3YWl0IGdldERlcGxveWVkU3ViTW9kUGF0aHMoY29udGV4dCk7XHJcbiAgICBDQUNIRSA9IGF3YWl0IGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0LCBzdWJNb2R1bGVGaWxlUGF0aHMpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXREZXBsb3llZFN1Yk1vZFBhdGhzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdnYW1lIGRpc2NvdmVyeSBpcyBpbmNvbXBsZXRlJykpO1xyXG4gIH1cclxuICBjb25zdCBtb2R1bGVQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RVTEVTKTtcclxuICBsZXQgbW9kdWxlRmlsZXM7XHJcbiAgdHJ5IHtcclxuICAgIG1vZHVsZUZpbGVzID0gYXdhaXQgd2Fsa0FzeW5jKG1vZHVsZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzID0gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICYmIChbXS5jb25jYXQoWyBNT0RVTEVTIF0sIEFycmF5LmZyb20oT0ZGSUNJQUxfTU9EVUxFUykpKVxyXG4gICAgICAgICAgICAuaW5kZXhPZihwYXRoLmJhc2VuYW1lKGVyci5wYXRoKSkgIT09IC0xKTtcclxuICAgIGNvbnN0IGVycm9yTXNnID0gaXNNaXNzaW5nT2ZmaWNpYWxNb2R1bGVzXHJcbiAgICAgID8gJ0dhbWUgZmlsZXMgYXJlIG1pc3NpbmcgLSBwbGVhc2UgcmUtaW5zdGFsbCB0aGUgZ2FtZSdcclxuICAgICAgOiBlcnIubWVzc2FnZTtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJvck1zZywgZXJyKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuICBjb25zdCBzdWJNb2R1bGVzID0gbW9kdWxlRmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzdWJNb2R1bGVzKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95ZWRNb2REYXRhKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBzdWJNb2R1bGVGaWxlUGF0aHM6IHN0cmluZ1tdKSB7XHJcbiAgY29uc3QgbWFuYWdlZElkcyA9IGF3YWl0IGdldE1hbmFnZWRJZHMoY29udGV4dCk7XHJcbiAgY29uc3QgZ2V0Q2xlYW5WZXJzaW9uID0gKHN1Yk1vZElkLCB1bnNhbml0aXplZCkgPT4ge1xyXG4gICAgaWYgKCF1bnNhbml0aXplZCkge1xyXG4gICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byBzYW5pdGl6ZS9jb2VyY2UgdmVyc2lvbicsIHsgc3ViTW9kSWQsIHVuc2FuaXRpemVkIH0pO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc2FuaXRpemVkID0gdW5zYW5pdGl6ZWQucmVwbGFjZSgvW2Etel18W0EtWl0vZywgJycpO1xyXG4gICAgICBjb25zdCBjb2VyY2VkID0gc2VtdmVyLmNvZXJjZShzYW5pdGl6ZWQpO1xyXG4gICAgICByZXR1cm4gY29lcmNlZC52ZXJzaW9uO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHNhbml0aXplL2NvZXJjZSB2ZXJzaW9uJyxcclxuICAgICAgICB7IHN1Yk1vZElkLCB1bnNhbml0aXplZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2Uoc3ViTW9kdWxlRmlsZVBhdGhzLCBhc3luYyAoYWNjdW0sIHN1Yk1vZEZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc3ViTW9kRGF0YSA9IGF3YWl0IGdldFhNTERhdGEoc3ViTW9kRmlsZSk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZElkID0gc3ViTW9kRGF0YS5nZXQ8RWxlbWVudD4oJy8vSWQnKS5hdHRyKCd2YWx1ZScpLnZhbHVlKCk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZFZlckRhdGEgPSBzdWJNb2REYXRhLmdldDxFbGVtZW50PignLy9WZXJzaW9uJykuYXR0cigndmFsdWUnKS52YWx1ZSgpO1xyXG4gICAgICBjb25zdCBzdWJNb2RWZXIgPSBnZXRDbGVhblZlcnNpb24oc3ViTW9kSWQsIHN1Yk1vZFZlckRhdGEpO1xyXG4gICAgICBjb25zdCBtYW5hZ2VkRW50cnkgPSBtYW5hZ2VkSWRzLmZpbmQoZW50cnkgPT4gZW50cnkuc3ViTW9kSWQgPT09IHN1Yk1vZElkKTtcclxuICAgICAgY29uc3QgaXNNdWx0aXBsYXllciA9ICghIXN1Yk1vZERhdGEuZ2V0KGAvLyR7WE1MX0VMX01VTFRJUExBWUVSfWApKTtcclxuICAgICAgY29uc3QgZGVwTm9kZXMgPSBzdWJNb2REYXRhLmZpbmQ8RWxlbWVudD4oJy8vRGVwZW5kZWRNb2R1bGUnKTtcclxuICAgICAgbGV0IGRlcGVuZGVuY2llcyA9IFtdO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGRlcGVuZGVuY2llcyA9IGRlcE5vZGVzLm1hcChkZXBOb2RlID0+IHtcclxuICAgICAgICAgIGxldCBkZXBWZXJzaW9uO1xyXG4gICAgICAgICAgY29uc3QgZGVwSWQgPSBkZXBOb2RlLmF0dHIoJ0lkJykudmFsdWUoKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVuc2FuaXRpemVkID0gZGVwTm9kZS5hdHRyKCdEZXBlbmRlbnRWZXJzaW9uJykudmFsdWUoKTtcclxuICAgICAgICAgICAgZGVwVmVyc2lvbiA9IGdldENsZWFuVmVyc2lvbihzdWJNb2RJZCwgdW5zYW5pdGl6ZWQpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIC8vIERlcGVuZGVudFZlcnNpb24gaXMgYW4gb3B0aW9uYWwgYXR0cmlidXRlLCBpdCdzIG5vdCBhIGJpZyBkZWFsIGlmXHJcbiAgICAgICAgICAgIC8vICBpdCdzIG1pc3NpbmcuXHJcbiAgICAgICAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHJlc29sdmUgZGVwZW5kZW5jeSB2ZXJzaW9uJywgeyBzdWJNb2RJZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB7IGRlcElkLCBkZXBWZXJzaW9uIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnZGVidWcnLCAnc3VibW9kdWxlIGhhcyBubyBkZXBlbmRlbmNpZXMgb3IgaXMgaW52YWxpZCcsIGVycik7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3ViTW9kTmFtZSA9IHN1Yk1vZERhdGEuZ2V0PEVsZW1lbnQ+KCcvL05hbWUnKS5hdHRyKCd2YWx1ZScpLnZhbHVlKCk7XHJcblxyXG4gICAgICBhY2N1bVtzdWJNb2RJZF0gPSB7XHJcbiAgICAgICAgc3ViTW9kSWQsXHJcbiAgICAgICAgc3ViTW9kTmFtZSxcclxuICAgICAgICBzdWJNb2RWZXIsXHJcbiAgICAgICAgc3ViTW9kRmlsZSxcclxuICAgICAgICB2b3J0ZXhJZDogISFtYW5hZ2VkRW50cnkgPyBtYW5hZ2VkRW50cnkudm9ydGV4SWQgOiBzdWJNb2RJZCxcclxuICAgICAgICBpc09mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhzdWJNb2RJZCksXHJcbiAgICAgICAgaXNMb2NrZWQ6IExPQ0tFRF9NT0RVTEVTLmhhcyhzdWJNb2RJZCksXHJcbiAgICAgICAgaXNNdWx0aXBsYXllcixcclxuICAgICAgICBkZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgaW52YWxpZDoge1xyXG4gICAgICAgICAgLy8gV2lsbCBob2xkIHRoZSBzdWJtb2QgaWRzIG9mIGFueSBkZXRlY3RlZCBjeWNsaWMgZGVwZW5kZW5jaWVzLlxyXG4gICAgICAgICAgY3ljbGljOiBbXSxcclxuXHJcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2YgYW55IG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gICAgICAgICAgbWlzc2luZzogW10sXHJcblxyXG4gICAgICAgICAgLy8gV2lsbCBob2xkIHRoZSBzdWJtb2QgaWRzIG9mIHN1cHBvc2VkbHkgaW5jb21wYXRpYmxlIGRlcGVuZGVuY2llcyAodmVyc2lvbi13aXNlKVxyXG4gICAgICAgICAgaW5jb21wYXRpYmxlRGVwczogW10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAnVm9ydGV4IHdhcyB1bmFibGUgdG8gcGFyc2U6ICcgKyBzdWJNb2RGaWxlICsgJztcXG5cXG4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICdZb3UgY2FuIGVpdGhlciBpbmZvcm0gdGhlIG1vZCBhdXRob3IgYW5kIHdhaXQgZm9yIGZpeCwgb3IgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyAneW91IGNhbiB1c2UgYW4gb25saW5lIHhtbCB2YWxpZGF0b3IgdG8gZmluZCBhbmQgZml4IHRoZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICdlcnJvciB5b3Vyc2VsZi4nO1xyXG4gICAgICAvLyBsaWJ4bWxqcyByYXJlbHkgcHJvZHVjZXMgdXNlZnVsIGVycm9yIG1lc3NhZ2VzIC0gaXQgdXN1YWxseSBwb2ludHNcclxuICAgICAgLy8gIHRvIHRoZSBwYXJlbnQgbm9kZSBvZiB0aGUgYWN0dWFsIHByb2JsZW0gYW5kIGluIHRoaXMgY2FzZSBuZWFybHlcclxuICAgICAgLy8gIGFsd2F5cyB3aWxsIHBvaW50IHRvIHRoZSByb290IG9mIHRoZSBYTUwgZmlsZSAoTW9kdWxlKSB3aGljaCBpcyBjb21wbGV0ZWx5IHVzZWxlc3MuXHJcbiAgICAgIC8vICBXZSdyZSBnb2luZyB0byBwcm92aWRlIGEgaHVtYW4gcmVhZGFibGUgZXJyb3IgdG8gdGhlIHVzZXIuXHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJyxcclxuICAgICAgICBlcnJvck1lc3NhZ2UsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ01OQjI6IHBhcnNpbmcgZXJyb3InLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgfSwge30pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VMYXVuY2hlckRhdGEoKSB7XHJcbiAgY29uc3QgaWRSZWdleHAgPSAvXFw8SWRcXD4oLio/KVxcPFxcL0lkXFw+L2dtO1xyXG4gIGNvbnN0IGVuYWJsZWRSZWdleHAgPSAvXFw8SXNTZWxlY3RlZFxcPiguKj8pXFw8XFwvSXNTZWxlY3RlZFxcPi9nbTtcclxuICBjb25zdCB0cmltVGFnc1JlZ2V4cCA9IC88W14+XSo+Py9nbTtcclxuXHJcbiAgY29uc3QgY3JlYXRlRGF0YUVsZW1lbnQgPSAoeG1sTm9kZSkgPT4ge1xyXG4gICAgY29uc3Qgbm9kZVN0cmluZyA9IHhtbE5vZGUudG9TdHJpbmcoeyB3aGl0ZXNwYWNlOiBmYWxzZSB9KS5yZXBsYWNlKC9bIFxcdFxcclxcbl0vZ20sICcnKTtcclxuICAgIGlmICghIW5vZGVTdHJpbmcpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdWJNb2RJZDogbm9kZVN0cmluZy5tYXRjaChpZFJlZ2V4cClbMF0ucmVwbGFjZSh0cmltVGFnc1JlZ2V4cCwgJycpLFxyXG4gICAgICAgIGVuYWJsZWQ6IG5vZGVTdHJpbmcubWF0Y2goZW5hYmxlZFJlZ2V4cClbMF1cclxuICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAucmVwbGFjZSh0cmltVGFnc1JlZ2V4cCwgJycpID09PSAndHJ1ZScsXHJcbiAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGxhdW5jaGVyRGF0YSA9IGF3YWl0IGdldFhNTERhdGEoTEFVTkNIRVJfREFUQV9QQVRIKTtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc2luZ2xlUGxheWVyTW9kcyA9XHJcbiAgICAgIGxhdW5jaGVyRGF0YS5nZXQ8RWxlbWVudD4oJy8vVXNlckRhdGEvU2luZ2xlcGxheWVyRGF0YS9Nb2REYXRhcycpLmNoaWxkTm9kZXMoKTtcclxuICAgIGNvbnN0IG11bHRpUGxheWVyTW9kcyA9IGxhdW5jaGVyRGF0YS5nZXQ8RWxlbWVudD4oJy8vVXNlckRhdGEvTXVsdGlwbGF5ZXJEYXRhL01vZERhdGFzJylcclxuICAgICAgLmNoaWxkTm9kZXMoKTtcclxuICAgIExBVU5DSEVSX0RBVEEuc2luZ2xlUGxheWVyU3ViTW9kcyA9IHNpbmdsZVBsYXllck1vZHMucmVkdWNlKChhY2N1bSwgc3BtKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGFFbGVtZW50ID0gY3JlYXRlRGF0YUVsZW1lbnQoc3BtKTtcclxuICAgICAgaWYgKCEhZGF0YUVsZW1lbnQpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKGRhdGFFbGVtZW50KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgICBMQVVOQ0hFUl9EQVRBLm11bHRpcGxheWVyU3ViTW9kcyA9IG11bHRpUGxheWVyTW9kcy5yZWR1Y2UoKGFjY3VtLCBtcG0pID0+IHtcclxuICAgICAgY29uc3QgZGF0YUVsZW1lbnQgPSBjcmVhdGVEYXRhRWxlbWVudChtcG0pO1xyXG4gICAgICBpZiAoISFkYXRhRWxlbWVudCkge1xyXG4gICAgICAgIGFjY3VtLnB1c2goZGF0YUVsZW1lbnQpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIFRoaXMgaXMgcG90ZW50aWFsbHkgZHVlIHRvIHRoZSBnYW1lIG5vdCBiZWluZyBpbnN0YWxsZWQgY29ycmVjdGx5XHJcbiAgICAvLyAgb3IgcGVyaGFwcyB0aGUgdXNlcnMgYXJlIHVzaW5nIGEgM3JkIHBhcnR5IGxhdW5jaGVyIHdoaWNoIG92ZXJ3cml0ZXNcclxuICAgIC8vICB0aGUgZGVmYXVsdCBsYXVuY2hlciBjb25maWd1cmF0aW9uLi4uIExldHMganVzdCBkZWZhdWx0IHRvIHRoZSBkYXRhXHJcbiAgICAvLyAgd2UgZXhwZWN0IGFuZCBsZXQgdGhlIHVzZXIgZGVhbCB3aXRoIHdoYXRldmVyIGlzIGJyb2tlbiBsYXRlciBvblxyXG4gICAgLy8gIGhpcyBlbnZpcm9ubWVudCBsYXRlci5cclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIGxhdW5jaGVyIGRhdGEnLCBlcnIpO1xyXG4gICAgTEFVTkNIRVJfREFUQS5zaW5nbGVQbGF5ZXJTdWJNb2RzID0gW1xyXG4gICAgICB7IHN1Yk1vZElkOiAnTmF0aXZlJywgZW5hYmxlZDogdHJ1ZSB9LFxyXG4gICAgICB7IHN1Yk1vZElkOiAnU2FuZEJveENvcmUnLCBlbmFibGVkOiB0cnVlIH0sXHJcbiAgICAgIHsgc3ViTW9kSWQ6ICdDdXN0b21CYXR0bGUnLCBlbmFibGVkOiB0cnVlIH0sXHJcbiAgICAgIHsgc3ViTW9kSWQ6ICdTYW5kYm94JywgZW5hYmxlZDogdHJ1ZSB9LFxyXG4gICAgICB7IHN1Yk1vZElkOiAnU3RvcnlNb2RlJywgZW5hYmxlZDogdHJ1ZSB9LFxyXG4gICAgXTtcclxuICAgIExBVU5DSEVSX0RBVEEubXVsdGlwbGF5ZXJTdWJNb2RzID0gW107XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRNYW5hZ2VkSWRzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVGhpcyBpcyBhIHZhbGlkIHVzZSBjYXNlIGlmIHRoZSBnYW1lbW9kZVxyXG4gICAgLy8gIGhhcyBmYWlsZWQgYWN0aXZhdGlvbi5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBhY3RpdmVQcm9maWxlLmlkLCAnbW9kU3RhdGUnXSwge30pO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZFN0YXRlKVxyXG4gICAgLmZpbHRlcihrZXkgPT4gISFtb2RzW2tleV0gJiYgbW9kU3RhdGVba2V5XS5lbmFibGVkKVxyXG4gICAgLm1hcChrZXkgPT4gbW9kc1trZXldKTtcclxuXHJcbiAgY29uc3QgaW52YWxpZE1vZHMgPSBbXTtcclxuICBjb25zdCBpbnN0YWxsYXRpb25EaXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAoaW5zdGFsbGF0aW9uRGlyID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGdldCBtYW5hZ2VkIGlkcycsICd1bmRlZmluZWQgc3RhZ2luZyBmb2xkZXInKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWRNb2RzLCBhc3luYyAoYWNjdW0sIGVudHJ5KSA9PiB7XHJcbiAgICBpZiAoZW50cnk/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBJbnZhbGlkIG1vZCBlbnRyeSAtIHNraXAgaXQuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kSW5zdGFsbGF0aW9uUGF0aCA9IHBhdGguam9pbihpbnN0YWxsYXRpb25EaXIsIGVudHJ5Lmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgbGV0IGZpbGVzO1xyXG4gICAgdHJ5IHtcclxuICAgICAgZmlsZXMgPSBhd2FpdCB3YWxrQXN5bmMobW9kSW5zdGFsbGF0aW9uUGF0aCwgMyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8gVGhlIG1vZCBtdXN0J3ZlIGJlZW4gcmVtb3ZlZCBtYW51YWxseSBieSB0aGUgdXNlciBmcm9tXHJcbiAgICAgIC8vICB0aGUgc3RhZ2luZyBmb2xkZXIgLSBnb29kIGpvYiBidWRkeSFcclxuICAgICAgLy8gIEdvaW5nIHRvIGxvZyB0aGlzLCBidXQgb3RoZXJ3aXNlIGFsbG93IGl0IHRvIHByb2NlZWQuXHJcbiAgICAgIGludmFsaWRNb2RzLnB1c2goZW50cnkuaWQpO1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZWFkIG1vZCBzdGFnaW5nIGZvbGRlcicsIHsgbW9kSWQ6IGVudHJ5LmlkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN1Yk1vZEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgICBpZiAoc3ViTW9kRmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIE5vIHN1Ym1vZCBmaWxlIC0gbm8gTE9cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHN1Yk1vZElkO1xyXG4gICAgdHJ5IHtcclxuICAgICAgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUoc3ViTW9kRmlsZSwgJ0lkJyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8gVGhlIHN1Ym1vZHVsZSB3b3VsZCd2ZSBuZXZlciBtYW5hZ2VkIHRvIGluc3RhbGwgY29ycmVjdGx5XHJcbiAgICAgIC8vICBpZiB0aGUgeG1sIGZpbGUgaGFkIGJlZW4gaW52YWxpZCAtIHRoaXMgc3VnZ2VzdHMgdGhhdCB0aGUgdXNlclxyXG4gICAgICAvLyAgb3IgYSAzcmQgcGFydHkgYXBwbGljYXRpb24gaGFzIHRhbXBlcmVkIHdpdGggdGhlIGZpbGUuLi5cclxuICAgICAgLy8gIFdlIHNpbXBseSBsb2cgdGhpcyBoZXJlIGFzIHRoZSBwYXJzZS1pbmcgZmFpbHVyZSB3aWxsIGJlIGhpZ2hsaWdodGVkXHJcbiAgICAgIC8vICBieSB0aGUgQ0FDSEUgbG9naWMuXHJcbiAgICAgIGxvZygnZXJyb3InLCAnW01uQjJdIFVuYWJsZSB0byBwYXJzZSBzdWJtb2R1bGUgZmlsZScsIGVycik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfVxyXG4gICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgIHN1Yk1vZElkLFxyXG4gICAgICBzdWJNb2RGaWxlLFxyXG4gICAgICB2b3J0ZXhJZDogZW50cnkuaWQsXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICB9LCBbXSlcclxuICAudGFwKChyZXMpID0+IHtcclxuICAgIGlmIChpbnZhbGlkTW9kcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbnN0IGVyck1lc3NhZ2UgPSAnVGhlIGZvbGxvd2luZyBtb2RzIGFyZSBpbmFjY2Vzc2libGUgb3IgYXJlIG1pc3NpbmcgJ1xyXG4gICAgICAgICsgJ2luIHRoZSBzdGFnaW5nIGZvbGRlcjpcXG5cXG4nICsgaW52YWxpZE1vZHMuam9pbignXFxuJykgKyAnXFxuXFxuUGxlYXNlIGVuc3VyZSAnXHJcbiAgICAgICAgKyAndGhlc2UgbW9kcyBhbmQgdGhlaXIgY29udGVudCBhcmUgbm90IG9wZW4gaW4gYW55IG90aGVyIGFwcGxpY2F0aW9uICdcclxuICAgICAgICArICcoaW5jbHVkaW5nIHRoZSBnYW1lIGl0c2VsZikuIElmIHRoZSBtb2QgaXMgbWlzc2luZyBlbnRpcmVseSwgcGxlYXNlIHJlLWluc3RhbGwgaXQgJ1xyXG4gICAgICAgICsgJ29yIHJlbW92ZSBpdCBmcm9tIHlvdXIgbW9kcyBwYWdlLiBQbGVhc2UgY2hlY2sgeW91ciB2b3J0ZXggbG9nIGZpbGUgZm9yIGRldGFpbHMuJztcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIE1vZHMgaW4gU3RhZ2luZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoZXJyTWVzc2FnZSksIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXMpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNJbnZhbGlkKHN1Yk1vZElkOiBzdHJpbmcpIHtcclxuICBjb25zdCBjeWNsaWNFcnJvcnMgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnY3ljbGljJ10sIFtdKTtcclxuICBjb25zdCBtaXNzaW5nRGVwcyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdtaXNzaW5nJ10sIFtdKTtcclxuICByZXR1cm4gKChjeWNsaWNFcnJvcnMubGVuZ3RoID4gMCkgfHwgKG1pc3NpbmdEZXBzLmxlbmd0aCA+IDApKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbGlkYXRpb25JbmZvKHZvcnRleElkOiBzdHJpbmcpIHtcclxuICAvLyBXZSBleHBlY3QgdGhlIG1ldGhvZCBjYWxsZXIgdG8gcHJvdmlkZSB0aGUgdm9ydGV4SWQgb2YgdGhlIHN1Yk1vZCwgYXNcclxuICAvLyAgdGhpcyBpcyBob3cgd2Ugc3RvcmUgdGhpcyBpbmZvcm1hdGlvbiBpbiB0aGUgbG9hZCBvcmRlciBvYmplY3QuXHJcbiAgLy8gIFJlYXNvbiB3aHkgd2UgbmVlZCB0byBzZWFyY2ggdGhlIGNhY2hlIGJ5IHZvcnRleElkIHJhdGhlciB0aGFuIHN1Yk1vZElkLlxyXG4gIGNvbnN0IHN1Yk1vZElkID0gT2JqZWN0LmtleXMoQ0FDSEUpLmZpbmQoa2V5ID0+IENBQ0hFW2tleV0udm9ydGV4SWQgPT09IHZvcnRleElkKTtcclxuICBjb25zdCBjeWNsaWMgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnY3ljbGljJ10sIFtdKTtcclxuICBjb25zdCBtaXNzaW5nID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ21pc3NpbmcnXSwgW10pO1xyXG4gIGNvbnN0IGluY29tcGF0aWJsZSA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdpbmNvbXBhdGlibGVEZXBzJ10sIFtdKTtcclxuICByZXR1cm4ge1xyXG4gICAgY3ljbGljLFxyXG4gICAgbWlzc2luZyxcclxuICAgIGluY29tcGF0aWJsZSxcclxuICB9O1xyXG59XHJcbiJdfQ==