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
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const APPUNI = electron_1.app || electron_1.remote.app;
const XML_EL_MULTIPLAYER = 'MultiplayerModule';
const LAUNCHER_DATA_PATH = path_1.default.join(APPUNI.getPath('documents'), 'Mount and Blade II Bannerlord', 'Configs', 'LauncherData.xml');
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
            moduleFiles = yield util_1.walkAsync(modulePath);
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
                vortex_api_1.log('debug', 'failed to sanitize/coerce version', { subModId, unsanitized });
                return undefined;
            }
            try {
                const sanitized = unsanitized.replace(/[a-z]|[A-Z]/g, '');
                const coerced = semver_1.default.coerce(sanitized);
                return coerced.version;
            }
            catch (err) {
                vortex_api_1.log('debug', 'failed to sanitize/coerce version', { subModId, unsanitized, error: err.message });
                return undefined;
            }
        };
        return bluebird_1.default.reduce(subModuleFilePaths, (accum, subModFile) => __awaiter(this, void 0, void 0, function* () {
            try {
                const subModData = yield util_1.getXMLData(subModFile);
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
                            vortex_api_1.log('debug', 'failed to resolve dependency version', { subModId, error: err.message });
                        }
                        return { depId, depVersion };
                    });
                }
                catch (err) {
                    vortex_api_1.log('debug', 'submodule has no dependencies or is invalid', err);
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
                vortex_api_1.log('error', 'MNB2: parsing error', err);
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
        const launcherData = yield util_1.getXMLData(LAUNCHER_DATA_PATH);
        try {
            const singlePlayerMods = launcherData.get('//UserData/SingleplayerData/ModDatas').childNodes();
            const multiPlayerMods = launcherData.get('//UserData/MultiplayerData/ModDatas').childNodes();
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
            vortex_api_1.log('error', 'failed to get managed ids', 'undefined staging folder');
            return Promise.resolve([]);
        }
        return bluebird_1.default.reduce(enabledMods, (accum, entry) => __awaiter(this, void 0, void 0, function* () {
            if ((entry === null || entry === void 0 ? void 0 : entry.installationPath) === undefined) {
                return Promise.resolve(accum);
            }
            const modInstallationPath = path_1.default.join(installationDir, entry.installationPath);
            let files;
            try {
                files = yield util_1.walkAsync(modInstallationPath, 3);
            }
            catch (err) {
                invalidMods.push(entry.id);
                vortex_api_1.log('error', 'failed to read mod staging folder', { modId: entry.id, error: err.message });
                return Promise.resolve(accum);
            }
            const subModFile = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE);
            if (subModFile === undefined) {
                return Promise.resolve(accum);
            }
            let subModId;
            try {
                subModId = yield util_1.getElementValue(subModFile, 'Id');
            }
            catch (err) {
                vortex_api_1.log('error', '[MnB2] Unable to parse submodule file', err);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViTW9kQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJNb2RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFDaEMsdUNBQXVDO0FBQ3ZDLGdEQUF3QjtBQUN4QixvREFBNEI7QUFDNUIsMkNBQXlEO0FBQ3pELHFDQUNrRDtBQUVsRCxpQ0FBZ0U7QUFFaEUsTUFBTSxNQUFNLEdBQUcsY0FBRyxJQUFJLGlCQUFNLENBQUMsR0FBRyxDQUFDO0FBQ2pDLE1BQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7QUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsK0JBQStCLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDbEksTUFBTSxhQUFhLEdBQUc7SUFDcEIsbUJBQW1CLEVBQUUsRUFBRTtJQUN2QixrQkFBa0IsRUFBRSxFQUFFO0NBQ3ZCLENBQUM7QUFFRixTQUFnQixlQUFlO0lBQzdCLE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFGRCwwQ0FFQztBQUVELElBQUksS0FBSyxHQUFpQixFQUFFLENBQUM7QUFDN0IsU0FBZ0IsUUFBUTtJQUN0QixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFGRCw0QkFFQztBQUVELFNBQXNCLFlBQVksQ0FBQyxPQUFnQzs7UUFDakUsSUFBSTtZQUNGLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDWCxNQUFNLGtCQUFrQixHQUFhLE1BQU0sc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0UsS0FBSyxHQUFHLE1BQU0sa0JBQWtCLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLENBQUM7U0FDL0Q7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNI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bHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IGFwcCwgcmVtb3RlIH0gZnJvbSAnZWxlY3Ryb24nO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCwgTE9DS0VEX01PRFVMRVMsIE1PRFVMRVMsXHJcbiAgT0ZGSUNJQUxfTU9EVUxFUywgU1VCTU9EX0ZJTEUgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElTdWJNb2RDYWNoZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZXRFbGVtZW50VmFsdWUsIGdldFhNTERhdGEsIHdhbGtBc3luYyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBBUFBVTkkgPSBhcHAgfHwgcmVtb3RlLmFwcDtcclxuY29uc3QgWE1MX0VMX01VTFRJUExBWUVSID0gJ011bHRpcGxheWVyTW9kdWxlJztcclxuY29uc3QgTEFVTkNIRVJfREFUQV9QQVRIID0gcGF0aC5qb2luKEFQUFVOSS5nZXRQYXRoKCdkb2N1bWVudHMnKSwgJ01vdW50IGFuZCBCbGFkZSBJSSBCYW5uZXJsb3JkJywgJ0NvbmZpZ3MnLCAnTGF1bmNoZXJEYXRhLnhtbCcpO1xyXG5jb25zdCBMQVVOQ0hFUl9EQVRBID0ge1xyXG4gIHNpbmdsZVBsYXllclN1Yk1vZHM6IFtdLFxyXG4gIG11bHRpcGxheWVyU3ViTW9kczogW10sXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGF1bmNoZXJEYXRhKCkge1xyXG4gIHJldHVybiBMQVVOQ0hFUl9EQVRBO1xyXG59XHJcblxyXG5sZXQgQ0FDSEU6IElTdWJNb2RDYWNoZSA9IHt9O1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FjaGUoKSB7XHJcbiAgcmV0dXJuIENBQ0hFO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENhY2hlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgdHJ5IHtcclxuICAgIENBQ0hFID0ge307XHJcbiAgICBjb25zdCBzdWJNb2R1bGVGaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RGVwbG95ZWRTdWJNb2RQYXRocyhjb250ZXh0KTtcclxuICAgIENBQ0hFID0gYXdhaXQgZ2V0RGVwbG95ZWRNb2REYXRhKGNvbnRleHQsIHN1Yk1vZHVsZUZpbGVQYXRocyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldERlcGxveWVkU3ViTW9kUGF0aHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2dhbWUgZGlzY292ZXJ5IGlzIGluY29tcGxldGUnKSk7XHJcbiAgfVxyXG4gIGNvbnN0IG1vZHVsZVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRFVMRVMpO1xyXG4gIGxldCBtb2R1bGVGaWxlcztcclxuICB0cnkge1xyXG4gICAgbW9kdWxlRmlsZXMgPSBhd2FpdCB3YWxrQXN5bmMobW9kdWxlUGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpc01pc3NpbmdPZmZpY2lhbE1vZHVsZXMgPSAoKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgJiYgKFtdLmNvbmNhdChbIE1PRFVMRVMgXSwgQXJyYXkuZnJvbShPRkZJQ0lBTF9NT0RVTEVTKSkpXHJcbiAgICAgICAgICAgIC5pbmRleE9mKHBhdGguYmFzZW5hbWUoZXJyLnBhdGgpKSAhPT0gLTEpO1xyXG4gICAgY29uc3QgZXJyb3JNc2cgPSBpc01pc3NpbmdPZmZpY2lhbE1vZHVsZXNcclxuICAgICAgPyAnR2FtZSBmaWxlcyBhcmUgbWlzc2luZyAtIHBsZWFzZSByZS1pbnN0YWxsIHRoZSBnYW1lJ1xyXG4gICAgICA6IGVyci5tZXNzYWdlO1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKGVycm9yTXNnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG4gIGNvbnN0IHN1Yk1vZHVsZXMgPSBtb2R1bGVGaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHN1Yk1vZHVsZXMpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXREZXBsb3llZE1vZERhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHN1Yk1vZHVsZUZpbGVQYXRoczogc3RyaW5nW10pIHtcclxuICBjb25zdCBtYW5hZ2VkSWRzID0gYXdhaXQgZ2V0TWFuYWdlZElkcyhjb250ZXh0KTtcclxuICBjb25zdCBnZXRDbGVhblZlcnNpb24gPSAoc3ViTW9kSWQsIHVuc2FuaXRpemVkKSA9PiB7XHJcbiAgICBpZiAoIXVuc2FuaXRpemVkKSB7XHJcbiAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHNhbml0aXplL2NvZXJjZSB2ZXJzaW9uJywgeyBzdWJNb2RJZCwgdW5zYW5pdGl6ZWQgfSk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzYW5pdGl6ZWQgPSB1bnNhbml0aXplZC5yZXBsYWNlKC9bYS16XXxbQS1aXS9nLCAnJyk7XHJcbiAgICAgIGNvbnN0IGNvZXJjZWQgPSBzZW12ZXIuY29lcmNlKHNhbml0aXplZCk7XHJcbiAgICAgIHJldHVybiBjb2VyY2VkLnZlcnNpb247XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gc2FuaXRpemUvY29lcmNlIHZlcnNpb24nLFxyXG4gICAgICAgIHsgc3ViTW9kSWQsIHVuc2FuaXRpemVkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShzdWJNb2R1bGVGaWxlUGF0aHMsIGFzeW5jIChhY2N1bSwgc3ViTW9kRmlsZTogc3RyaW5nKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzdWJNb2REYXRhID0gYXdhaXQgZ2V0WE1MRGF0YShzdWJNb2RGaWxlKTtcclxuICAgICAgY29uc3Qgc3ViTW9kSWQgPSBzdWJNb2REYXRhLmdldCgnLy9JZCcpLmF0dHIoJ3ZhbHVlJykudmFsdWUoKTtcclxuICAgICAgY29uc3Qgc3ViTW9kVmVyRGF0YSA9IHN1Yk1vZERhdGEuZ2V0KCcvL1ZlcnNpb24nKS5hdHRyKCd2YWx1ZScpLnZhbHVlKCk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZFZlciA9IGdldENsZWFuVmVyc2lvbihzdWJNb2RJZCwgc3ViTW9kVmVyRGF0YSk7XHJcbiAgICAgIGNvbnN0IG1hbmFnZWRFbnRyeSA9IG1hbmFnZWRJZHMuZmluZChlbnRyeSA9PiBlbnRyeS5zdWJNb2RJZCA9PT0gc3ViTW9kSWQpO1xyXG4gICAgICBjb25zdCBpc011bHRpcGxheWVyID0gKCEhc3ViTW9kRGF0YS5nZXQoYC8vJHtYTUxfRUxfTVVMVElQTEFZRVJ9YCkpO1xyXG4gICAgICBjb25zdCBkZXBOb2RlcyA9IHN1Yk1vZERhdGEuZmluZCgnLy9EZXBlbmRlZE1vZHVsZScpO1xyXG4gICAgICBsZXQgZGVwZW5kZW5jaWVzID0gW107XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgZGVwZW5kZW5jaWVzID0gZGVwTm9kZXMubWFwKGRlcE5vZGUgPT4ge1xyXG4gICAgICAgICAgbGV0IGRlcFZlcnNpb247XHJcbiAgICAgICAgICBjb25zdCBkZXBJZCA9IGRlcE5vZGUuYXR0cignSWQnKS52YWx1ZSgpO1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdW5zYW5pdGl6ZWQgPSBkZXBOb2RlLmF0dHIoJ0RlcGVuZGVudFZlcnNpb24nKS52YWx1ZSgpO1xyXG4gICAgICAgICAgICBkZXBWZXJzaW9uID0gZ2V0Q2xlYW5WZXJzaW9uKHN1Yk1vZElkLCB1bnNhbml0aXplZCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgLy8gRGVwZW5kZW50VmVyc2lvbiBpcyBhbiBvcHRpb25hbCBhdHRyaWJ1dGUsIGl0J3Mgbm90IGEgYmlnIGRlYWwgaWZcclxuICAgICAgICAgICAgLy8gIGl0J3MgbWlzc2luZy5cclxuICAgICAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IHZlcnNpb24nLCB7IHN1Yk1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHsgZGVwSWQsIGRlcFZlcnNpb24gfTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdzdWJtb2R1bGUgaGFzIG5vIGRlcGVuZGVuY2llcyBvciBpcyBpbnZhbGlkJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzdWJNb2ROYW1lID0gc3ViTW9kRGF0YS5nZXQoJy8vTmFtZScpLmF0dHIoJ3ZhbHVlJykudmFsdWUoKTtcclxuXHJcbiAgICAgIGFjY3VtW3N1Yk1vZElkXSA9IHtcclxuICAgICAgICBzdWJNb2RJZCxcclxuICAgICAgICBzdWJNb2ROYW1lLFxyXG4gICAgICAgIHN1Yk1vZFZlcixcclxuICAgICAgICBzdWJNb2RGaWxlLFxyXG4gICAgICAgIHZvcnRleElkOiAhIW1hbmFnZWRFbnRyeSA/IG1hbmFnZWRFbnRyeS52b3J0ZXhJZCA6IHN1Yk1vZElkLFxyXG4gICAgICAgIGlzT2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKHN1Yk1vZElkKSxcclxuICAgICAgICBpc0xvY2tlZDogTE9DS0VEX01PRFVMRVMuaGFzKHN1Yk1vZElkKSxcclxuICAgICAgICBpc011bHRpcGxheWVyLFxyXG4gICAgICAgIGRlcGVuZGVuY2llcyxcclxuICAgICAgICBpbnZhbGlkOiB7XHJcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2YgYW55IGRldGVjdGVkIGN5Y2xpYyBkZXBlbmRlbmNpZXMuXHJcbiAgICAgICAgICBjeWNsaWM6IFtdLFxyXG5cclxuICAgICAgICAgIC8vIFdpbGwgaG9sZCB0aGUgc3VibW9kIGlkcyBvZiBhbnkgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgICAgICAgICBtaXNzaW5nOiBbXSxcclxuXHJcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2Ygc3VwcG9zZWRseSBpbmNvbXBhdGlibGUgZGVwZW5kZW5jaWVzICh2ZXJzaW9uLXdpc2UpXHJcbiAgICAgICAgICBpbmNvbXBhdGlibGVEZXBzOiBbXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICdWb3J0ZXggd2FzIHVuYWJsZSB0byBwYXJzZTogJyArIHN1Yk1vZEZpbGUgKyAnO1xcblxcbidcclxuICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1lvdSBjYW4gZWl0aGVyIGluZm9ybSB0aGUgbW9kIGF1dGhvciBhbmQgd2FpdCBmb3IgZml4LCBvciAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICd5b3UgY2FuIHVzZSBhbiBvbmxpbmUgeG1sIHZhbGlkYXRvciB0byBmaW5kIGFuZCBmaXggdGhlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2Vycm9yIHlvdXJzZWxmLic7XHJcbiAgICAgIC8vIGxpYnhtbGpzIHJhcmVseSBwcm9kdWNlcyB1c2VmdWwgZXJyb3IgbWVzc2FnZXMgLSBpdCB1c3VhbGx5IHBvaW50c1xyXG4gICAgICAvLyAgdG8gdGhlIHBhcmVudCBub2RlIG9mIHRoZSBhY3R1YWwgcHJvYmxlbSBhbmQgaW4gdGhpcyBjYXNlIG5lYXJseVxyXG4gICAgICAvLyAgYWx3YXlzIHdpbGwgcG9pbnQgdG8gdGhlIHJvb3Qgb2YgdGhlIFhNTCBmaWxlIChNb2R1bGUpIHdoaWNoIGlzIGNvbXBsZXRlbHkgdXNlbGVzcy5cclxuICAgICAgLy8gIFdlJ3JlIGdvaW5nIHRvIHByb3ZpZGUgYSBodW1hbiByZWFkYWJsZSBlcnJvciB0byB0aGUgdXNlci5cclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdVbmFibGUgdG8gcGFyc2Ugc3VibW9kdWxlIGZpbGUnLFxyXG4gICAgICAgIGVycm9yTWVzc2FnZSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnTU5CMjogcGFyc2luZyBlcnJvcicsIGVycik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICB9LCB7fSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUxhdW5jaGVyRGF0YSgpIHtcclxuICBjb25zdCBpZFJlZ2V4cCA9IC9cXDxJZFxcPiguKj8pXFw8XFwvSWRcXD4vZ207XHJcbiAgY29uc3QgZW5hYmxlZFJlZ2V4cCA9IC9cXDxJc1NlbGVjdGVkXFw+KC4qPylcXDxcXC9Jc1NlbGVjdGVkXFw+L2dtO1xyXG4gIGNvbnN0IHRyaW1UYWdzUmVnZXhwID0gLzxbXj5dKj4/L2dtO1xyXG5cclxuICBjb25zdCBjcmVhdGVEYXRhRWxlbWVudCA9ICh4bWxOb2RlKSA9PiB7XHJcbiAgICBjb25zdCBub2RlU3RyaW5nID0geG1sTm9kZS50b1N0cmluZyh7IHdoaXRlc3BhY2U6IGZhbHNlIH0pLnJlcGxhY2UoL1sgXFx0XFxyXFxuXS9nbSwgJycpO1xyXG4gICAgaWYgKCEhbm9kZVN0cmluZykge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN1Yk1vZElkOiBub2RlU3RyaW5nLm1hdGNoKGlkUmVnZXhwKVswXS5yZXBsYWNlKHRyaW1UYWdzUmVnZXhwLCAnJyksXHJcbiAgICAgICAgZW5hYmxlZDogbm9kZVN0cmluZy5tYXRjaChlbmFibGVkUmVnZXhwKVswXVxyXG4gICAgICAgICAgLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgIC5yZXBsYWNlKHRyaW1UYWdzUmVnZXhwLCAnJykgPT09ICd0cnVlJyxcclxuICAgICAgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbGF1bmNoZXJEYXRhID0gYXdhaXQgZ2V0WE1MRGF0YShMQVVOQ0hFUl9EQVRBX1BBVEgpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBzaW5nbGVQbGF5ZXJNb2RzID1cclxuICAgICAgbGF1bmNoZXJEYXRhLmdldCgnLy9Vc2VyRGF0YS9TaW5nbGVwbGF5ZXJEYXRhL01vZERhdGFzJykuY2hpbGROb2RlcygpO1xyXG4gICAgY29uc3QgbXVsdGlQbGF5ZXJNb2RzID0gbGF1bmNoZXJEYXRhLmdldCgnLy9Vc2VyRGF0YS9NdWx0aXBsYXllckRhdGEvTW9kRGF0YXMnKS5jaGlsZE5vZGVzKCk7XHJcbiAgICBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMgPSBzaW5nbGVQbGF5ZXJNb2RzLnJlZHVjZSgoYWNjdW0sIHNwbSkgPT4ge1xyXG4gICAgICBjb25zdCBkYXRhRWxlbWVudCA9IGNyZWF0ZURhdGFFbGVtZW50KHNwbSk7XHJcbiAgICAgIGlmICghIWRhdGFFbGVtZW50KSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChkYXRhRWxlbWVudCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gICAgTEFVTkNIRVJfREFUQS5tdWx0aXBsYXllclN1Yk1vZHMgPSBtdWx0aVBsYXllck1vZHMucmVkdWNlKChhY2N1bSwgbXBtKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGFFbGVtZW50ID0gY3JlYXRlRGF0YUVsZW1lbnQobXBtKTtcclxuICAgICAgaWYgKCEhZGF0YUVsZW1lbnQpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKGRhdGFFbGVtZW50KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE1hbmFnZWRJZHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGlzIGlzIGEgdmFsaWQgdXNlIGNhc2UgaWYgdGhlIGdhbWVtb2RlXHJcbiAgICAvLyAgaGFzIGZhaWxlZCBhY3RpdmF0aW9uLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIGFjdGl2ZVByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpXHJcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQpXHJcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xyXG5cclxuICBjb25zdCBpbnZhbGlkTW9kcyA9IFtdO1xyXG4gIGNvbnN0IGluc3RhbGxhdGlvbkRpciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChpbnN0YWxsYXRpb25EaXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmFnZWQgaWRzJywgJ3VuZGVmaW5lZCBzdGFnaW5nIGZvbGRlcicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoZW5hYmxlZE1vZHMsIGFzeW5jIChhY2N1bSwgZW50cnkpID0+IHtcclxuICAgIGlmIChlbnRyeT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIEludmFsaWQgbW9kIGVudHJ5IC0gc2tpcCBpdC5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RJbnN0YWxsYXRpb25QYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvbkRpciwgZW50cnkuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICBsZXQgZmlsZXM7XHJcbiAgICB0cnkge1xyXG4gICAgICBmaWxlcyA9IGF3YWl0IHdhbGtBc3luYyhtb2RJbnN0YWxsYXRpb25QYXRoLCAzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgbW9kIG11c3QndmUgYmVlbiByZW1vdmVkIG1hbnVhbGx5IGJ5IHRoZSB1c2VyIGZyb21cclxuICAgICAgLy8gIHRoZSBzdGFnaW5nIGZvbGRlciAtIGdvb2Qgam9iIGJ1ZGR5IVxyXG4gICAgICAvLyAgR29pbmcgdG8gbG9nIHRoaXMsIGJ1dCBvdGhlcndpc2UgYWxsb3cgaXQgdG8gcHJvY2VlZC5cclxuICAgICAgaW52YWxpZE1vZHMucHVzaChlbnRyeS5pZCk7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlYWQgbW9kIHN0YWdpbmcgZm9sZGVyJywgeyBtb2RJZDogZW50cnkuaWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3ViTW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICAgIGlmIChzdWJNb2RGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gTm8gc3VibW9kIGZpbGUgLSBubyBMT1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc3ViTW9kSWQ7XHJcbiAgICB0cnkge1xyXG4gICAgICBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShzdWJNb2RGaWxlLCAnSWQnKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgc3VibW9kdWxlIHdvdWxkJ3ZlIG5ldmVyIG1hbmFnZWQgdG8gaW5zdGFsbCBjb3JyZWN0bHlcclxuICAgICAgLy8gIGlmIHRoZSB4bWwgZmlsZSBoYWQgYmVlbiBpbnZhbGlkIC0gdGhpcyBzdWdnZXN0cyB0aGF0IHRoZSB1c2VyXHJcbiAgICAgIC8vICBvciBhIDNyZCBwYXJ0eSBhcHBsaWNhdGlvbiBoYXMgdGFtcGVyZWQgd2l0aCB0aGUgZmlsZS4uLlxyXG4gICAgICAvLyAgV2Ugc2ltcGx5IGxvZyB0aGlzIGhlcmUgYXMgdGhlIHBhcnNlLWluZyBmYWlsdXJlIHdpbGwgYmUgaGlnaGxpZ2h0ZWRcclxuICAgICAgLy8gIGJ5IHRoZSBDQUNIRSBsb2dpYy5cclxuICAgICAgbG9nKCdlcnJvcicsICdbTW5CMl0gVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgc3ViTW9kSWQsXHJcbiAgICAgIHN1Yk1vZEZpbGUsXHJcbiAgICAgIHZvcnRleElkOiBlbnRyeS5pZCxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIFtdKVxyXG4gIC50YXAoKHJlcykgPT4ge1xyXG4gICAgaWYgKGludmFsaWRNb2RzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgZXJyTWVzc2FnZSA9ICdUaGUgZm9sbG93aW5nIG1vZHMgYXJlIGluYWNjZXNzaWJsZSBvciBhcmUgbWlzc2luZyAnXHJcbiAgICAgICAgKyAnaW4gdGhlIHN0YWdpbmcgZm9sZGVyOlxcblxcbicgKyBpbnZhbGlkTW9kcy5qb2luKCdcXG4nKSArICdcXG5cXG5QbGVhc2UgZW5zdXJlICdcclxuICAgICAgICArICd0aGVzZSBtb2RzIGFuZCB0aGVpciBjb250ZW50IGFyZSBub3Qgb3BlbiBpbiBhbnkgb3RoZXIgYXBwbGljYXRpb24gJ1xyXG4gICAgICAgICsgJyhpbmNsdWRpbmcgdGhlIGdhbWUgaXRzZWxmKS4gSWYgdGhlIG1vZCBpcyBtaXNzaW5nIGVudGlyZWx5LCBwbGVhc2UgcmUtaW5zdGFsbCBpdCAnXHJcbiAgICAgICAgKyAnb3IgcmVtb3ZlIGl0IGZyb20geW91ciBtb2RzIHBhZ2UuIFBsZWFzZSBjaGVjayB5b3VyIHZvcnRleCBsb2cgZmlsZSBmb3IgZGV0YWlscy4nO1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTW9kcyBpbiBTdGFnaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihlcnJNZXNzYWdlKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0ludmFsaWQoc3ViTW9kSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IGN5Y2xpY0Vycm9ycyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmdEZXBzID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ21pc3NpbmcnXSwgW10pO1xyXG4gIHJldHVybiAoKGN5Y2xpY0Vycm9ycy5sZW5ndGggPiAwKSB8fCAobWlzc2luZ0RlcHMubGVuZ3RoID4gMCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsaWRhdGlvbkluZm8odm9ydGV4SWQ6IHN0cmluZykge1xyXG4gIC8vIFdlIGV4cGVjdCB0aGUgbWV0aG9kIGNhbGxlciB0byBwcm92aWRlIHRoZSB2b3J0ZXhJZCBvZiB0aGUgc3ViTW9kLCBhc1xyXG4gIC8vICB0aGlzIGlzIGhvdyB3ZSBzdG9yZSB0aGlzIGluZm9ybWF0aW9uIGluIHRoZSBsb2FkIG9yZGVyIG9iamVjdC5cclxuICAvLyAgUmVhc29uIHdoeSB3ZSBuZWVkIHRvIHNlYXJjaCB0aGUgY2FjaGUgYnkgdm9ydGV4SWQgcmF0aGVyIHRoYW4gc3ViTW9kSWQuXHJcbiAgY29uc3Qgc3ViTW9kSWQgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT4gQ0FDSEVba2V5XS52b3J0ZXhJZCA9PT0gdm9ydGV4SWQpO1xyXG4gIGNvbnN0IGN5Y2xpYyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmcgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnbWlzc2luZyddLCBbXSk7XHJcbiAgY29uc3QgaW5jb21wYXRpYmxlID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ2luY29tcGF0aWJsZURlcHMnXSwgW10pO1xyXG4gIHJldHVybiB7XHJcbiAgICBjeWNsaWMsXHJcbiAgICBtaXNzaW5nLFxyXG4gICAgaW5jb21wYXRpYmxlLFxyXG4gIH07XHJcbn1cclxuIl19