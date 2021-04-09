"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const bluebird_1 = require("bluebird");
const electron_1 = require("electron");
const React = __importStar(require("react"));
const BS = __importStar(require("react-bootstrap"));
const libxmljs_1 = require("libxmljs");
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const util_1 = require("./util");
const common_1 = require("./common");
const customItemRenderer_1 = __importDefault(require("./customItemRenderer"));
const migrations_1 = require("./migrations");
const ComMetadataManager_1 = __importDefault(require("./ComMetadataManager"));
const APPUNI = electron_1.app || electron_1.remote.app;
const LAUNCHER_EXEC = path_1.default.join('bin', 'Win64_Shipping_Client', 'TaleWorlds.MountAndBlade.Launcher.exe');
const MODDING_KIT_EXEC = path_1.default.join('bin', 'Win64_Shipping_wEditor', 'TaleWorlds.MountAndBlade.Launcher.exe');
const LAUNCHER_DATA_PATH = path_1.default.join(APPUNI.getPath('documents'), 'Mount and Blade II Bannerlord', 'Configs', 'LauncherData.xml');
const LAUNCHER_DATA = {
    singlePlayerSubMods: [],
    multiplayerSubMods: [],
};
let STORE_ID;
let CACHE = {};
const STEAMAPP_ID = 261550;
const EPICAPP_ID = 'Chickadee';
const MODULES = 'Modules';
const I18N_NAMESPACE = 'game-mount-and-blade2';
const XML_EL_MULTIPLAYER = 'MultiplayerModule';
const ROOT_FOLDERS = new Set(['bin', 'data', 'gui', 'icons', 'modules',
    'music', 'shaders', 'sounds', 'xmlschemas']);
const OFFICIAL_MODULES = new Set(['Native', 'CustomBattle', 'SandBoxCore', 'Sandbox', 'StoryMode']);
const LOCKED_MODULES = new Set([]);
const PARAMS_TEMPLATE = ['/{{gameMode}}', '_MODULES_{{subModIds}}*_MODULES_'];
const BANNERLORD_EXEC = path_1.default.join('bin', 'Win64_Shipping_Client', 'Bannerlord.exe');
function walkAsync(dir, levelsDeep = 2) {
    return __awaiter(this, void 0, void 0, function* () {
        let entries = [];
        return vortex_api_1.fs.readdirAsync(dir).then(files => {
            const filtered = files.filter(file => !file.endsWith('.vortex_backup'));
            return bluebird_1.Promise.each(filtered, file => {
                const fullPath = path_1.default.join(dir, file);
                return vortex_api_1.fs.statAsync(fullPath).then(stats => {
                    if (stats.isDirectory() && levelsDeep > 0) {
                        return walkAsync(fullPath, levelsDeep - 1)
                            .then(nestedFiles => {
                            entries = entries.concat(nestedFiles);
                            return Promise.resolve();
                        });
                    }
                    else {
                        entries.push(fullPath);
                        return Promise.resolve();
                    }
                }).catch(err => {
                    vortex_api_1.log('error', 'MnB2: invalid symlink', err);
                    return (err.code === 'ENOENT')
                        ? Promise.resolve()
                        : Promise.reject(err);
                });
            });
        })
            .then(() => Promise.resolve(entries));
    });
}
function getDeployedSubModPaths(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('game discovery is incomplete'));
        }
        const modulePath = path_1.default.join(discovery.path, MODULES);
        let moduleFiles;
        try {
            moduleFiles = yield walkAsync(modulePath);
        }
        catch (err) {
            if (err instanceof vortex_api_1.util.UserCanceled) {
                return Promise.resolve([]);
            }
            const isMissingOfficialModules = ((err.code === 'ENOENT')
                && ([].concat([MODULES], Array.from(OFFICIAL_MODULES)))
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
        return bluebird_1.Promise.reduce(subModuleFilePaths, (accum, subModFile) => __awaiter(this, void 0, void 0, function* () {
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
                    isOfficial: OFFICIAL_MODULES.has(subModId),
                    isLocked: LOCKED_MODULES.has(subModId),
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
        return bluebird_1.Promise.reduce(enabledMods, (accum, entry) => __awaiter(this, void 0, void 0, function* () {
            if ((entry === null || entry === void 0 ? void 0 : entry.installationPath) === undefined) {
                return Promise.resolve(accum);
            }
            const modInstallationPath = path_1.default.join(installationDir, entry.installationPath);
            let files;
            try {
                files = yield walkAsync(modInstallationPath, 3);
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
                subModId = yield getElementValue(subModFile, 'Id');
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
function refreshGameParams(context, loadOrder) {
    return __awaiter(this, void 0, void 0, function* () {
        const enabled = (!!loadOrder && Object.keys(loadOrder).length > 0)
            ? Object.keys(loadOrder)
                .filter(key => loadOrder[key].enabled)
                .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
                .reduce((accum, key) => {
                const cacheKeys = Object.keys(CACHE);
                const entry = cacheKeys.find(cacheElement => CACHE[cacheElement].vortexId === key);
                if (!!entry) {
                    accum.push(entry);
                }
                return accum;
            }, [])
            : LAUNCHER_DATA.singlePlayerSubMods
                .filter(subMod => subMod.enabled)
                .map(subMod => subMod.subModId);
        const parameters = [
            PARAMS_TEMPLATE[0].replace('{{gameMode}}', 'singleplayer'),
            PARAMS_TEMPLATE[1].replace('{{subModIds}}', enabled.map(key => `*${key}`).join('')),
        ];
        context.api.store.dispatch(vortex_api_1.actions.setGameParameters(common_1.GAME_ID, {
            executable: BANNERLORD_EXEC,
            parameters,
        }));
        return Promise.resolve();
    });
}
function getElementValue(subModuleFilePath, elementName) {
    return __awaiter(this, void 0, void 0, function* () {
        const logAndContinue = () => {
            vortex_api_1.log('error', 'Unable to parse xml element', elementName);
            return Promise.resolve(undefined);
        };
        return vortex_api_1.fs.readFileAsync(subModuleFilePath, { encoding: 'utf-8' })
            .then(xmlData => {
            try {
                const modInfo = libxmljs_1.parseXmlString(xmlData);
                const element = modInfo.get(`//${elementName}`);
                return ((element !== undefined) && (element.attr('value').value() !== undefined))
                    ? Promise.resolve(element.attr('value').value())
                    : logAndContinue();
            }
            catch (err) {
                const errorMessage = 'Vortex was unable to parse: ' + subModuleFilePath + '; please inform the mod author';
                return Promise.reject(new vortex_api_1.util.DataInvalid(errorMessage));
            }
        });
    });
}
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([EPICAPP_ID, STEAMAPP_ID.toString()])
        .then(game => {
        STORE_ID = game.gameStoreId;
        return Promise.resolve(game.gamePath);
    });
}
function testRootMod(files, gameId) {
    const notSupported = { supported: false, requiredFiles: [] };
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve(notSupported);
    }
    const lowered = files.map(file => file.toLowerCase());
    const modsFile = lowered.find(file => file.split(path_1.default.sep).indexOf(MODULES.toLowerCase()) !== -1);
    if (modsFile === undefined) {
        return Promise.resolve(notSupported);
    }
    const idx = modsFile.split(path_1.default.sep).indexOf(MODULES.toLowerCase());
    const rootFolderMatches = lowered.filter(file => {
        const segments = file.split(path_1.default.sep);
        return (((segments.length - 1) > idx) && ROOT_FOLDERS.has(segments[idx]));
    }) || [];
    return Promise.resolve({ supported: (rootFolderMatches.length > 0), requiredFiles: [] });
}
function installRootMod(files, destinationPath) {
    const moduleFile = files.find(file => file.split(path_1.default.sep).indexOf(MODULES) !== -1);
    const idx = moduleFile.split(path_1.default.sep).indexOf(MODULES);
    const filtered = files.filter(file => {
        const segments = file.split(path_1.default.sep).map(seg => seg.toLowerCase());
        const lastElementIdx = segments.length - 1;
        return (ROOT_FOLDERS.has(segments[idx])
            && (path_1.default.extname(segments[lastElementIdx]) !== ''));
    });
    const instructions = filtered.map(file => {
        const destination = file.split(path_1.default.sep)
            .slice(idx)
            .join(path_1.default.sep);
        return {
            type: 'copy',
            source: file,
            destination,
        };
    });
    return Promise.resolve({ instructions });
}
function testForSubmodules(files, gameId) {
    const supported = ((gameId === common_1.GAME_ID)
        && files.find(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE) !== undefined);
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function installSubModules(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const filtered = files.filter(file => {
            const segments = file.split(path_1.default.sep);
            return path_1.default.extname(segments[segments.length - 1]) !== '';
        });
        const subModIds = [];
        const subMods = filtered.filter(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE);
        return bluebird_1.Promise.reduce(subMods, (accum, modFile) => __awaiter(this, void 0, void 0, function* () {
            const segments = modFile.split(path_1.default.sep).filter(seg => !!seg);
            const subModId = yield getElementValue(path_1.default.join(destinationPath, modFile), 'Id');
            const modName = (segments.length > 1)
                ? segments[segments.length - 2]
                : subModId;
            subModIds.push(subModId);
            const idx = modFile.toLowerCase().indexOf(common_1.SUBMOD_FILE);
            const subModFiles = filtered.filter(file => file.slice(0, idx) === modFile.slice(0, idx));
            const instructions = subModFiles.map((modFile) => ({
                type: 'copy',
                source: modFile,
                destination: path_1.default.join(MODULES, modName, modFile.slice(idx)),
            }));
            return accum.concat(instructions);
        }), [])
            .then(merged => {
            const subModIdsAttr = {
                type: 'attribute',
                key: 'subModIds',
                value: subModIds,
            };
            return Promise.resolve({ instructions: [].concat(merged, [subModIdsAttr]) });
        });
    });
}
function ensureOfficialLauncher(context, discovery) {
    context.api.store.dispatch(vortex_api_1.actions.addDiscoveredTool(common_1.GAME_ID, 'TaleWorldsBannerlordLauncher', {
        id: 'TaleWorldsBannerlordLauncher',
        name: 'Official Launcher',
        logo: 'twlauncher.png',
        executable: () => path_1.default.basename(LAUNCHER_EXEC),
        requiredFiles: [
            path_1.default.basename(LAUNCHER_EXEC),
        ],
        path: path_1.default.join(discovery.path, LAUNCHER_EXEC),
        relative: true,
        workingDirectory: path_1.default.join(discovery.path, 'bin', 'Win64_Shipping_Client'),
        hidden: false,
        custom: false,
    }, false));
}
function setModdingTool(context, discovery, hidden) {
    const toolId = 'bannerlord-sdk';
    const exec = path_1.default.basename(MODDING_KIT_EXEC);
    const tool = {
        id: toolId,
        name: 'Modding Kit',
        logo: 'twlauncher.png',
        executable: () => exec,
        requiredFiles: [exec],
        path: path_1.default.join(discovery.path, MODDING_KIT_EXEC),
        relative: true,
        exclusive: true,
        workingDirectory: path_1.default.join(discovery.path, path_1.default.dirname(MODDING_KIT_EXEC)),
        hidden,
        custom: false,
    };
    context.api.store.dispatch(vortex_api_1.actions.addDiscoveredTool(common_1.GAME_ID, toolId, tool, false));
}
function prepareForModding(context, discovery, metaManager) {
    return __awaiter(this, void 0, void 0, function* () {
        ensureOfficialLauncher(context, discovery);
        try {
            yield vortex_api_1.fs.statAsync(path_1.default.join(discovery.path, MODDING_KIT_EXEC));
            setModdingTool(context, discovery);
        }
        catch (err) {
            const tools = discovery === null || discovery === void 0 ? void 0 : discovery.tools;
            if ((tools !== undefined)
                && (vortex_api_1.util.getSafe(tools, ['bannerlord-sdk'], undefined) !== undefined)) {
                setModdingTool(context, discovery, true);
            }
        }
        const findStoreId = () => findGame().catch(err => Promise.resolve());
        const startSteam = () => findStoreId()
            .then(() => (STORE_ID === 'steam')
            ? vortex_api_1.util.GameStoreHelper.launchGameStore(context.api, STORE_ID, undefined, true)
            : Promise.resolve());
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
        return startSteam().then(() => util_1.getXMLData(LAUNCHER_DATA_PATH)).then(launcherData => {
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
        }).then(() => __awaiter(this, void 0, void 0, function* () {
            const deployedSubModules = yield getDeployedSubModPaths(context);
            CACHE = yield getDeployedModData(context, deployedSubModules);
            const modIds = Object.keys(CACHE);
            const sorted = tSort({ subModIds: modIds, allowLocked: true, metaManager });
        }))
            .catch(err => {
            if (err instanceof vortex_api_1.util.NotFound) {
                context.api.showErrorNotification('Failed to find game launcher data', 'Please run the game at least once through the official game launcher and '
                    + 'try again', { allowReport: false });
                return Promise.resolve();
            }
            else if (err instanceof vortex_api_1.util.ProcessCanceled) {
                context.api.showErrorNotification('Failed to find game launcher data', err, { allowReport: false });
            }
            return Promise.reject(err);
        })
            .finally(() => {
            const state = context.api.store.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            if (activeProfile === undefined) {
                return refreshGameParams(context, {});
            }
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
            return refreshGameParams(context, loadOrder);
        });
    });
}
function isInvalid(subModId) {
    const cyclicErrors = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
    const missingDeps = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
    return ((cyclicErrors.length > 0) || (missingDeps.length > 0));
}
function getValidationInfo(modVortexId) {
    const subModId = Object.keys(CACHE).find(key => CACHE[key].vortexId === modVortexId);
    const cyclic = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
    const missing = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
    const incompatible = vortex_api_1.util.getSafe(CACHE[subModId], ['invalid', 'incompatibleDeps'], []);
    return {
        cyclic,
        missing,
        incompatible,
    };
}
function tSort(sortProps, test = false) {
    const { subModIds, allowLocked, loadOrder, metaManager } = sortProps;
    const lockedSubMods = (!!loadOrder)
        ? subModIds.filter(subModId => {
            var _a;
            const entry = CACHE[subModId];
            return (!!entry)
                ? !!((_a = loadOrder[entry.vortexId]) === null || _a === void 0 ? void 0 : _a.locked)
                : false;
        })
        : [];
    const alphabetical = subModIds.filter(subMod => !lockedSubMods.includes(subMod))
        .sort();
    const graph = alphabetical.reduce((accum, entry) => {
        const depIds = [...CACHE[entry].dependencies].map(dep => dep.depId);
        accum[entry] = depIds.sort();
        return accum;
    }, {});
    const result = [];
    const visited = [];
    const processing = [];
    const topSort = (node) => {
        processing[node] = true;
        const dependencies = (!!allowLocked)
            ? graph[node]
            : graph[node].filter(element => !LOCKED_MODULES.has(element));
        for (const dep of dependencies) {
            if (processing[dep]) {
                CACHE[node].invalid.cyclic.push(dep);
                CACHE[dep].invalid.cyclic.push(node);
                visited[node] = true;
                processing[node] = false;
                continue;
            }
            const incompatibleDeps = CACHE[node].invalid.incompatibleDeps;
            const incDep = incompatibleDeps.find(d => d.depId === dep);
            if (Object.keys(graph).includes(dep) && (incDep === undefined)) {
                const depVer = CACHE[dep].subModVer;
                const depInst = CACHE[node].dependencies.find(d => d.depId === dep);
                try {
                    const match = semver_1.default.satisfies(depInst.depVersion, depVer);
                    if (!match && !!(depInst === null || depInst === void 0 ? void 0 : depInst.depVersion) && !!depVer) {
                        CACHE[node].invalid.incompatibleDeps.push({
                            depId: dep,
                            requiredVersion: depInst.depVersion,
                            currentVersion: depVer,
                        });
                    }
                }
                catch (err) {
                    vortex_api_1.log('debug', 'failed to compare versions', err);
                }
            }
            if (!visited[dep] && !lockedSubMods.includes(dep)) {
                if (!Object.keys(graph).includes(dep)) {
                    CACHE[node].invalid.missing.push(dep);
                }
                else {
                    topSort(dep);
                }
            }
        }
        processing[node] = false;
        visited[node] = true;
        if (!isInvalid(node)) {
            result.push(node);
        }
    };
    for (const node in graph) {
        if (!visited[node] && !processing[node]) {
            topSort(node);
        }
    }
    if (allowLocked) {
        return result;
    }
    const subModsWithNoDeps = result.filter(dep => (graph[dep].length === 0)
        || (graph[dep].find(d => !LOCKED_MODULES.has(d)) === undefined)).sort() || [];
    const tamperedResult = [].concat(subModsWithNoDeps, result.filter(entry => !subModsWithNoDeps.includes(entry)));
    lockedSubMods.forEach(subModId => {
        const pos = loadOrder[CACHE[subModId].vortexId].pos;
        tamperedResult.splice(pos, 0, [subModId]);
    });
    if (test === true) {
        const metaSorted = metaManager.sort(tamperedResult);
        return metaSorted;
    }
    else {
        return tamperedResult;
    }
}
function isExternal(context, subModId) {
    const state = context.api.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const modIds = Object.keys(mods);
    modIds.forEach(modId => {
        const subModIds = vortex_api_1.util.getSafe(mods[modId], ['attributes', 'subModIds'], []);
        if (subModIds.includes(subModId)) {
            return false;
        }
    });
    return true;
}
let refreshFunc;
function refreshCacheOnEvent(context, profileId, metaManager) {
    return __awaiter(this, void 0, void 0, function* () {
        CACHE = {};
        if (profileId === undefined) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const deployProfile = vortex_api_1.selectors.profileById(state, profileId);
        if (((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== (deployProfile === null || deployProfile === void 0 ? void 0 : deployProfile.gameId)) || ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID)) {
            return Promise.resolve();
        }
        yield metaManager.updateDependencyMap(profileId);
        try {
            const deployedSubModules = yield getDeployedSubModPaths(context);
            CACHE = yield getDeployedModData(context, deployedSubModules);
        }
        catch (err) {
            return (err instanceof vortex_api_1.util.ProcessCanceled)
                ? Promise.resolve()
                : Promise.reject(err);
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], {});
        const modIds = Object.keys(CACHE);
        const sortProps = {
            subModIds: modIds,
            allowLocked: true,
            loadOrder,
            metaManager,
        };
        const sorted = tSort(sortProps);
        if (refreshFunc !== undefined) {
            refreshFunc();
        }
        return refreshGameParams(context, loadOrder);
    });
}
function preSort(context, items, direction, updateType, metaManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined || (activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID) {
            return items;
        }
        let modIds = Object.keys(CACHE);
        if (items.length > 0 && modIds.length === 0) {
            try {
                yield refreshCacheOnEvent(context, activeProfile.id, metaManager);
                modIds = Object.keys(CACHE);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        let lockedIds = modIds.filter(id => CACHE[id].isLocked);
        try {
            const sortProps = {
                subModIds: lockedIds,
                allowLocked: true,
                metaManager,
            };
            lockedIds = tSort(sortProps);
        }
        catch (err) {
            return Promise.reject(err);
        }
        const lockedItems = lockedIds.map(id => ({
            id: CACHE[id].vortexId,
            name: CACHE[id].subModName,
            imgUrl: `${__dirname}/gameart.jpg`,
            locked: true,
            official: OFFICIAL_MODULES.has(id),
        }));
        const externalIds = modIds.filter(id => (!CACHE[id].isLocked) && (CACHE[id].vortexId === id));
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
        const LOkeys = ((Object.keys(loadOrder).length > 0)
            ? Object.keys(loadOrder)
            : LAUNCHER_DATA.singlePlayerSubMods.map(mod => mod.subModId));
        const knownExt = externalIds.filter(id => LOkeys.includes(id)) || [];
        const unknownExt = externalIds.filter(id => !LOkeys.includes(id)) || [];
        items = items.filter(item => {
            const isLocked = lockedIds.includes(item.id);
            const hasCacheEntry = Object.keys(CACHE).find(key => CACHE[key].vortexId === item.id) !== undefined;
            return !isLocked && hasCacheEntry;
        });
        const posMap = {};
        let nextAvailable = LOkeys.length;
        const getNextPos = (loId) => {
            if (LOCKED_MODULES.has(loId)) {
                return Array.from(LOCKED_MODULES).indexOf(loId);
            }
            if (posMap[loId] === undefined) {
                posMap[loId] = nextAvailable;
                return nextAvailable++;
            }
            else {
                return posMap[loId];
            }
        };
        knownExt.map(key => ({
            id: CACHE[key].vortexId,
            name: CACHE[key].subModName,
            imgUrl: `${__dirname}/gameart.jpg`,
            external: isExternal(context, CACHE[key].vortexId),
            official: OFFICIAL_MODULES.has(key),
        }))
            .sort((a, b) => { var _a, _b; return (((_a = loadOrder[a.id]) === null || _a === void 0 ? void 0 : _a.pos) || getNextPos(a.id)) - (((_b = loadOrder[b.id]) === null || _b === void 0 ? void 0 : _b.pos) || getNextPos(b.id)); })
            .forEach(known => {
            var _a;
            const diff = (LOkeys.length) - (LOkeys.length - Array.from(LOCKED_MODULES).length);
            if (items.find(item => item.id === known.id) === undefined) {
                const pos = (_a = loadOrder[known.id]) === null || _a === void 0 ? void 0 : _a.pos;
                const idx = (pos !== undefined) ? (pos - diff) : (getNextPos(known.id) - diff);
                items.splice(idx, 0, known);
            }
        });
        const unknownItems = [].concat(unknownExt)
            .map(key => ({
            id: CACHE[key].vortexId,
            name: CACHE[key].subModName,
            imgUrl: `${__dirname}/gameart.jpg`,
            external: isExternal(context, CACHE[key].vortexId),
            official: OFFICIAL_MODULES.has(key),
        }));
        const preSorted = [].concat(lockedItems, items, unknownItems);
        return (direction === 'descending')
            ? Promise.resolve(preSorted.reverse())
            : Promise.resolve(preSorted);
    });
}
function infoComponent(context, props) {
    const t = context.api.translate;
    return React.createElement(BS.Panel, { id: 'loadorderinfo' }, React.createElement('h2', {}, t('Managing your load order', { ns: I18N_NAMESPACE })), React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement('div', {}, React.createElement('p', {}, t('You can adjust the load order for Bannerlord by dragging and dropping mods up or down on this page. '
        + 'Please keep in mind that Bannerlord is still in Early Access, which means that there might be significant '
        + 'changes to the game as time goes on. Please notify us of any Vortex related issues you encounter with this '
        + 'extension so we can fix it. For more information and help see: ', { ns: I18N_NAMESPACE }), React.createElement('a', { onClick: () => vortex_api_1.util.opn('https://wiki.nexusmods.com/index.php/Modding_Bannerlord_with_Vortex') }, t('Modding Bannerlord with Vortex.', { ns: I18N_NAMESPACE }))))), React.createElement('div', {}, React.createElement('p', {}, t('How to use:', { ns: I18N_NAMESPACE })), React.createElement('ul', {}, React.createElement('li', {}, t('Check the box next to the mods you want to be active in the game.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Click Auto Sort in the toolbar. (See below for details).', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Make sure to run the game directly via the Play button in the top left corner '
        + '(on the Bannerlord tile). Your Vortex load order may not be loaded if you run the Single Player game through the game launcher.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Optional: Manually drag and drop mods to different positions in the load order (for testing different overrides). Mods further down the list override mods further up.', { ns: I18N_NAMESPACE })))), React.createElement('div', {}, React.createElement('p', {}, t('Please note:', { ns: I18N_NAMESPACE })), React.createElement('ul', {}, React.createElement('li', {}, t('The load order reflected here will only be loaded if you run the game via the play button in '
        + 'the top left corner. Do not run the Single Player game through the launcher, as that will ignore '
        + 'the Vortex load order and go by what is shown in the launcher instead.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('For Bannerlord, mods sorted further towards the bottom of the list will override mods further up (if they conflict). '
        + 'Note: Harmony patches may be the exception to this rule.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Auto Sort uses the SubModule.xml files (the entries under <DependedModules>) to detect '
        + 'dependencies to sort by. ', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('If you cannot see your mod in this load order, Vortex may have been unable to find or parse its SubModule.xml file. '
        + 'Most - but not all mods - come with or need a SubModule.xml file.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Hit the deploy button whenever you install and enable a new mod.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('The game will not launch unless the game store (Steam, Epic, etc) is started beforehand. If you\'re getting the '
        + '"Unable to Initialize Steam API" error, restart Steam.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Right clicking an entry will open the context menu which can be used to lock LO entries into position; entry will '
        + 'be ignored by auto-sort maintaining its locked position.', { ns: I18N_NAMESPACE })))));
}
let _IS_SORTING = false;
function main(context) {
    const metaManager = new ComMetadataManager_1.default(context.api);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Mount & Blade II:\tBannerlord',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => '.',
        logo: 'gameart.jpg',
        executable: () => BANNERLORD_EXEC,
        setup: (discovery) => prepareForModding(context, discovery, metaManager),
        requiredFiles: [
            BANNERLORD_EXEC,
        ],
        parameters: [],
        requiresCleanup: true,
        environment: {
            SteamAPPId: STEAMAPP_ID.toString(),
        },
        details: {
            steamAppId: STEAMAPP_ID,
            epicAppId: EPICAPP_ID,
            customOpenModsPath: MODULES,
        },
    });
    context.registerLoadOrderPage({
        gameId: common_1.GAME_ID,
        createInfoPanel: (props) => {
            refreshFunc = props.refresh;
            return infoComponent(context, props);
        },
        gameArtURL: `${__dirname}/gameart.jpg`,
        preSort: (items, direction, updateType) => preSort(context, items, direction, updateType, metaManager),
        callback: (loadOrder) => refreshGameParams(context, loadOrder),
        itemRenderer: customItemRenderer_1.default.default,
    });
    context.registerInstaller('bannerlordrootmod', 20, testRootMod, installRootMod);
    context.registerInstaller('bannerlordsubmodules', 25, testForSubmodules, installSubModules);
    context.registerMigration(old => migrations_1.migrate026(context.api, old));
    context.registerAction('generic-load-order-icons', 200, _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', () => __awaiter(this, void 0, void 0, function* () {
        if (_IS_SORTING) {
            return Promise.resolve();
        }
        _IS_SORTING = true;
        try {
            yield metaManager.updateDependencyMap();
            CACHE = {};
            const deployedSubModules = yield getDeployedSubModPaths(context);
            CACHE = yield getDeployedModData(context, deployedSubModules);
        }
        catch (err) {
            context.api.showErrorNotification('Failed to resolve submodule file data', err);
            _IS_SORTING = false;
            return;
        }
        const modIds = Object.keys(CACHE);
        const lockedIds = modIds.filter(id => CACHE[id].isLocked);
        const subModIds = modIds.filter(id => !CACHE[id].isLocked);
        let sortedLocked = [];
        let sortedSubMods = [];
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
            vortex_api_1.log('error', 'Failed to sort mods', { reason: 'No active profile' });
            _IS_SORTING = false;
            return;
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
        try {
            sortedLocked = tSort({ subModIds: lockedIds, allowLocked: true, metaManager });
            sortedSubMods = tSort({ subModIds, allowLocked: false, loadOrder, metaManager }, true);
        }
        catch (err) {
            context.api.showErrorNotification('Failed to sort mods', err);
            return;
        }
        const newOrder = [].concat(sortedLocked, sortedSubMods).reduce((accum, id, idx) => {
            var _a;
            const vortexId = CACHE[id].vortexId;
            const newEntry = {
                pos: idx,
                enabled: CACHE[id].isOfficial
                    ? true
                    : (!!loadOrder[vortexId])
                        ? loadOrder[vortexId].enabled
                        : true,
                locked: (((_a = loadOrder[vortexId]) === null || _a === void 0 ? void 0 : _a.locked) === true),
            };
            accum[vortexId] = newEntry;
            return accum;
        }, {});
        context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(activeProfile.id, newOrder));
        return refreshGameParams(context, newOrder)
            .then(() => context.api.sendNotification({
            id: 'mnb2-sort-finished',
            type: 'info',
            message: context.api.translate('Finished sorting', { ns: I18N_NAMESPACE }),
            displayMS: 3000,
        })).finally(() => _IS_SORTING = false);
    }), () => {
        const state = context.api.store.getState();
        const gameId = vortex_api_1.selectors.activeGameId(state);
        return (gameId === common_1.GAME_ID);
    });
    context.once(() => {
        context.api.onAsync('did-deploy', (profileId, deployment) => __awaiter(this, void 0, void 0, function* () { return refreshCacheOnEvent(context, profileId, metaManager); }));
        context.api.onAsync('did-purge', (profileId) => __awaiter(this, void 0, void 0, function* () { return refreshCacheOnEvent(context, profileId, metaManager); }));
        context.api.events.on('gamemode-activated', (gameMode) => {
            const state = context.api.getState();
            const prof = vortex_api_1.selectors.activeProfile(state);
            refreshCacheOnEvent(context, prof === null || prof === void 0 ? void 0 : prof.id, metaManager);
        });
        context.api.onAsync('added-files', (profileId, files) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.store.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile.gameId !== common_1.GAME_ID) {
                return;
            }
            const game = vortex_api_1.util.getGame(common_1.GAME_ID);
            const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
            const modPaths = game.getModPaths(discovery.path);
            const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            yield bluebird_1.Promise.map(files, (entry) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (entry.candidates.length === 1) {
                    const mod = vortex_api_1.util.getSafe(state.persistent.mods, [common_1.GAME_ID, entry.candidates[0]], undefined);
                    if (mod === undefined) {
                        return Promise.resolve();
                    }
                    const relPath = path_1.default.relative(modPaths[(_a = mod.type) !== null && _a !== void 0 ? _a : ''], entry.filePath);
                    const targetPath = path_1.default.join(installPath, mod.id, relPath);
                    yield vortex_api_1.fs.ensureDirAsync(path_1.default.dirname(targetPath));
                    return vortex_api_1.fs.removeAsync(targetPath)
                        .catch(err => (err.code === 'ENOENT')
                        ? Promise.resolve()
                        : Promise.reject(err))
                        .then(() => vortex_api_1.fs.copyAsync(entry.filePath, targetPath))
                        .then(() => vortex_api_1.fs.removeAsync(entry.filePath))
                        .catch(err => vortex_api_1.log('error', 'failed to import added file to mod', err.message));
                }
            }));
        }));
    });
    return true;
}
module.exports = {
    default: main,
    getValidationInfo,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFDL0MsdUNBQXVDO0FBQ3ZDLDZDQUErQjtBQUMvQixvREFBc0M7QUFFdEMsdUNBQTBDO0FBQzFDLGdEQUF3QjtBQUN4QixvREFBNEI7QUFDNUIsMkNBQWtGO0FBQ2xGLGlDQUFvQztBQUVwQyxxQ0FBZ0Q7QUFDaEQsOEVBQXNEO0FBQ3RELDZDQUEwQztBQUUxQyw4RUFBc0Q7QUFHdEQsTUFBTSxNQUFNLEdBQUcsY0FBRyxJQUFJLGlCQUFNLENBQUMsR0FBRyxDQUFDO0FBQ2pDLE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7QUFDekcsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBQzdHLE1BQU0sa0JBQWtCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLCtCQUErQixFQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2xJLE1BQU0sYUFBYSxHQUFHO0lBQ3BCLG1CQUFtQixFQUFFLEVBQUU7SUFDdkIsa0JBQWtCLEVBQUUsRUFBRTtDQUN2QixDQUFDO0FBRUYsSUFBSSxRQUFRLENBQUM7QUFDYixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFFZixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUM7QUFDM0IsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDO0FBQy9CLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQztBQUUxQixNQUFNLGNBQWMsR0FBRyx1QkFBdUIsQ0FBQztBQUUvQyxNQUFNLGtCQUFrQixHQUFH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QUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBSTNELE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBS2xELE9BQU8sZUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUM7eUJBQzlCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7d0JBQ25DLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO3dCQUNuQixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzt5QkFDdkIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQzt5QkFDcEQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3lCQUMxQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxnQkFBRyxDQUFDLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDbEY7WUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0lBQ2IsaUJBQWlCO0NBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcm9taXNlIGFzIEJsdWViaXJkIH0gZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBhcHAsIHJlbW90ZSB9IGZyb20gJ2VsZWN0cm9uJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgcGFyc2VYbWxTdHJpbmcgfSBmcm9tICdsaWJ4bWxqcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGFjdGlvbnMsIEZsZXhMYXlvdXQsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgZ2V0WE1MRGF0YSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBTVUJNT0RfRklMRSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IEN1c3RvbUl0ZW1SZW5kZXJlciBmcm9tICcuL2N1c3RvbUl0ZW1SZW5kZXJlcic7XHJcbmltcG9ydCB7IG1pZ3JhdGUwMjYgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuaW1wb3J0IENvbU1ldGFkYXRhTWFuYWdlciBmcm9tICcuL0NvbU1ldGFkYXRhTWFuYWdlcic7XHJcbmltcG9ydCB7IElTb3J0UHJvcHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmNvbnN0IEFQUFVOSSA9IGFwcCB8fCByZW1vdGUuYXBwO1xyXG5jb25zdCBMQVVOQ0hFUl9FWEVDID0gcGF0aC5qb2luKCdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1RhbGVXb3JsZHMuTW91bnRBbmRCbGFkZS5MYXVuY2hlci5leGUnKTtcclxuY29uc3QgTU9ERElOR19LSVRfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX3dFZGl0b3InLCAnVGFsZVdvcmxkcy5Nb3VudEFuZEJsYWRlLkxhdW5jaGVyLmV4ZScpO1xyXG5jb25zdCBMQVVOQ0hFUl9EQVRBX1BBVEggPSBwYXRoLmpvaW4oQVBQVU5JLmdldFBhdGgoJ2RvY3VtZW50cycpLCAnTW91bnQgYW5kIEJsYWRlIElJIEJhbm5lcmxvcmQnLCAnQ29uZmlncycsICdMYXVuY2hlckRhdGEueG1sJyk7XHJcbmNvbnN0IExBVU5DSEVSX0RBVEEgPSB7XHJcbiAgc2luZ2xlUGxheWVyU3ViTW9kczogW10sXHJcbiAgbXVsdGlwbGF5ZXJTdWJNb2RzOiBbXSxcclxufTtcclxuXHJcbmxldCBTVE9SRV9JRDtcclxubGV0IENBQ0hFID0ge307XHJcblxyXG5jb25zdCBTVEVBTUFQUF9JRCA9IDI2MTU1MDtcclxuY29uc3QgRVBJQ0FQUF9JRCA9ICdDaGlja2FkZWUnO1xyXG5jb25zdCBNT0RVTEVTID0gJ01vZHVsZXMnO1xyXG5cclxuY29uc3QgSTE4Tl9OQU1FU1BBQ0UgPSAnZ2FtZS1tb3VudC1hbmQtYmxhZGUyJztcclxuXHJcbmNvbnN0IFhNTF9FTF9NVUxUSVBMQVlFUiA9ICdNdWx0aXBsYXllck1vZHVsZSc7XHJcblxyXG4vLyBBIHNldCBvZiBmb2xkZXIgbmFtZXMgKGxvd2VyY2FzZWQpIHdoaWNoIGFyZSBhdmFpbGFibGUgYWxvbmdzaWRlIHRoZVxyXG4vLyAgZ2FtZSdzIG1vZHVsZXMgZm9sZGVyLiBXZSBjb3VsZCd2ZSB1c2VkIHRoZSBmb21vZCBpbnN0YWxsZXIgc3RvcCBwYXR0ZXJuc1xyXG4vLyAgZnVuY3Rpb25hbGl0eSBmb3IgdGhpcywgYnV0IGl0J3MgYmV0dGVyIGlmIHRoaXMgZXh0ZW5zaW9uIGlzIHNlbGYgY29udGFpbmVkO1xyXG4vLyAgZXNwZWNpYWxseSBnaXZlbiB0aGF0IHRoZSBnYW1lJ3MgbW9kZGluZyBwYXR0ZXJuIGNoYW5nZXMgcXVpdGUgb2Z0ZW4uXHJcbmNvbnN0IFJPT1RfRk9MREVSUyA9IG5ldyBTZXQoWydiaW4nLCAnZGF0YScsICdndWknLCAnaWNvbnMnLCAnbW9kdWxlcycsXHJcbiAgJ211c2ljJywgJ3NoYWRlcnMnLCAnc291bmRzJywgJ3htbHNjaGVtYXMnXSk7XHJcblxyXG5jb25zdCBPRkZJQ0lBTF9NT0RVTEVTID0gbmV3IFNldChbJ05hdGl2ZScsICdDdXN0b21CYXR0bGUnLCAnU2FuZEJveENvcmUnLCAnU2FuZGJveCcsICdTdG9yeU1vZGUnXSk7XHJcbmNvbnN0IExPQ0tFRF9NT0RVTEVTID0gbmV3IFNldChbXSk7XHJcblxyXG4vLyBVc2VkIGZvciB0aGUgXCJjdXN0b20gbGF1bmNoZXJcIiB0b29scy5cclxuLy8gIGdhbWVNb2RlOiBzaW5nbGVwbGF5ZXIgb3IgbXVsdGlwbGF5ZXJcclxuLy8gIHN1Yk1vZElkczogdGhlIG1vZCBpZHMgd2Ugd2FudCB0byBsb2FkIGludG8gdGhlIGdhbWUuXHJcbmNvbnN0IFBBUkFNU19URU1QTEFURSA9IFsnL3t7Z2FtZU1vZGV9fScsICdfTU9EVUxFU197e3N1Yk1vZElkc319Kl9NT0RVTEVTXyddO1xyXG5cclxuLy8gVGhlIHJlbGF0aXZlIHBhdGggdG8gdGhlIGFjdHVhbCBnYW1lIGV4ZWN1dGFibGUsIG5vdCB0aGUgbGF1bmNoZXIuXHJcbmNvbnN0IEJBTk5FUkxPUkRfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcsICdCYW5uZXJsb3JkLmV4ZScpO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gd2Fsa0FzeW5jKGRpciwgbGV2ZWxzRGVlcCA9IDIpIHtcclxuICBsZXQgZW50cmllcyA9IFtdO1xyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZGlyKS50aGVuKGZpbGVzID0+IHtcclxuICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgoJy52b3J0ZXhfYmFja3VwJykpO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLmVhY2goZmlsdGVyZWQsIGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xyXG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZ1bGxQYXRoKS50aGVuKHN0YXRzID0+IHtcclxuICAgICAgICBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSAmJiBsZXZlbHNEZWVwID4gMCkge1xyXG4gICAgICAgICAgcmV0dXJuIHdhbGtBc3luYyhmdWxsUGF0aCwgbGV2ZWxzRGVlcCAtIDEpXHJcbiAgICAgICAgICAgIC50aGVuKG5lc3RlZEZpbGVzID0+IHtcclxuICAgICAgICAgICAgICBlbnRyaWVzID0gZW50cmllcy5jb25jYXQobmVzdGVkRmlsZXMpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGVudHJpZXMucHVzaChmdWxsUGF0aCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgIC8vIFRoaXMgaXMgYSB2YWxpZCB1c2UgY2FzZSwgcGFydGljdWxhcmx5IGlmIHRoZSBmaWxlXHJcbiAgICAgICAgLy8gIGlzIGRlcGxveWVkIGJ5IFZvcnRleCB1c2luZyBzeW1saW5rcywgYW5kIHRoZSBtb2QgZG9lc1xyXG4gICAgICAgIC8vICBub3QgZXhpc3Qgd2l0aGluIHRoZSBzdGFnaW5nIGZvbGRlci5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ01uQjI6IGludmFsaWQgc3ltbGluaycsIGVycik7XHJcbiAgICAgICAgcmV0dXJuIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSlcclxuICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZW50cmllcykpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXREZXBsb3llZFN1Yk1vZFBhdGhzKGNvbnRleHQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2dhbWUgZGlzY292ZXJ5IGlzIGluY29tcGxldGUnKSk7XHJcbiAgfVxyXG4gIGNvbnN0IG1vZHVsZVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRFVMRVMpO1xyXG4gIGxldCBtb2R1bGVGaWxlcztcclxuICB0cnkge1xyXG4gICAgbW9kdWxlRmlsZXMgPSBhd2FpdCB3YWxrQXN5bmMobW9kdWxlUGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpc01pc3NpbmdPZmZpY2lhbE1vZHVsZXMgPSAoKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgJiYgKFtdLmNvbmNhdChbIE1PRFVMRVMgXSwgQXJyYXkuZnJvbShPRkZJQ0lBTF9NT0RVTEVTKSkpXHJcbiAgICAgICAgICAgIC5pbmRleE9mKHBhdGguYmFzZW5hbWUoZXJyLnBhdGgpKSAhPT0gLTEpO1xyXG4gICAgY29uc3QgZXJyb3JNc2cgPSBpc01pc3NpbmdPZmZpY2lhbE1vZHVsZXNcclxuICAgICAgPyAnR2FtZSBmaWxlcyBhcmUgbWlzc2luZyAtIHBsZWFzZSByZS1pbnN0YWxsIHRoZSBnYW1lJ1xyXG4gICAgICA6IGVyci5tZXNzYWdlO1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKGVycm9yTXNnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG4gIGNvbnN0IHN1Yk1vZHVsZXMgPSBtb2R1bGVGaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHN1Yk1vZHVsZXMpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXREZXBsb3llZE1vZERhdGEoY29udGV4dCwgc3ViTW9kdWxlRmlsZVBhdGhzKSB7XHJcbiAgY29uc3QgbWFuYWdlZElkcyA9IGF3YWl0IGdldE1hbmFnZWRJZHMoY29udGV4dCk7XHJcbiAgY29uc3QgZ2V0Q2xlYW5WZXJzaW9uID0gKHN1Yk1vZElkLCB1bnNhbml0aXplZCkgPT4ge1xyXG4gICAgaWYgKCF1bnNhbml0aXplZCkge1xyXG4gICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byBzYW5pdGl6ZS9jb2VyY2UgdmVyc2lvbicsIHsgc3ViTW9kSWQsIHVuc2FuaXRpemVkIH0pO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc2FuaXRpemVkID0gdW5zYW5pdGl6ZWQucmVwbGFjZSgvW2Etel18W0EtWl0vZywgJycpO1xyXG4gICAgICBjb25zdCBjb2VyY2VkID0gc2VtdmVyLmNvZXJjZShzYW5pdGl6ZWQpO1xyXG4gICAgICByZXR1cm4gY29lcmNlZC52ZXJzaW9uO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHNhbml0aXplL2NvZXJjZSB2ZXJzaW9uJyxcclxuICAgICAgICB7IHN1Yk1vZElkLCB1bnNhbml0aXplZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2Uoc3ViTW9kdWxlRmlsZVBhdGhzLCBhc3luYyAoYWNjdW0sIHN1Yk1vZEZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc3ViTW9kRGF0YSA9IGF3YWl0IGdldFhNTERhdGEoc3ViTW9kRmlsZSk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZElkID0gc3ViTW9kRGF0YS5nZXQoJy8vSWQnKS5hdHRyKCd2YWx1ZScpLnZhbHVlKCk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZFZlckRhdGEgPSBzdWJNb2REYXRhLmdldCgnLy9WZXJzaW9uJykuYXR0cigndmFsdWUnKS52YWx1ZSgpO1xyXG4gICAgICBjb25zdCBzdWJNb2RWZXIgPSBnZXRDbGVhblZlcnNpb24oc3ViTW9kSWQsIHN1Yk1vZFZlckRhdGEpO1xyXG4gICAgICBjb25zdCBtYW5hZ2VkRW50cnkgPSBtYW5hZ2VkSWRzLmZpbmQoZW50cnkgPT4gZW50cnkuc3ViTW9kSWQgPT09IHN1Yk1vZElkKTtcclxuICAgICAgY29uc3QgaXNNdWx0aXBsYXllciA9ICghIXN1Yk1vZERhdGEuZ2V0KGAvLyR7WE1MX0VMX01VTFRJUExBWUVSfWApKTtcclxuICAgICAgY29uc3QgZGVwTm9kZXMgPSBzdWJNb2REYXRhLmZpbmQoJy8vRGVwZW5kZWRNb2R1bGUnKTtcclxuICAgICAgbGV0IGRlcGVuZGVuY2llcyA9IFtdO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGRlcGVuZGVuY2llcyA9IGRlcE5vZGVzLm1hcChkZXBOb2RlID0+IHtcclxuICAgICAgICAgIGxldCBkZXBWZXJzaW9uO1xyXG4gICAgICAgICAgY29uc3QgZGVwSWQgPSBkZXBOb2RlLmF0dHIoJ0lkJykudmFsdWUoKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVuc2FuaXRpemVkID0gZGVwTm9kZS5hdHRyKCdEZXBlbmRlbnRWZXJzaW9uJykudmFsdWUoKTtcclxuICAgICAgICAgICAgZGVwVmVyc2lvbiA9IGdldENsZWFuVmVyc2lvbihzdWJNb2RJZCwgdW5zYW5pdGl6ZWQpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIC8vIERlcGVuZGVudFZlcnNpb24gaXMgYW4gb3B0aW9uYWwgYXR0cmlidXRlLCBpdCdzIG5vdCBhIGJpZyBkZWFsIGlmXHJcbiAgICAgICAgICAgIC8vICBpdCdzIG1pc3NpbmcuXHJcbiAgICAgICAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHJlc29sdmUgZGVwZW5kZW5jeSB2ZXJzaW9uJywgeyBzdWJNb2RJZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB7IGRlcElkLCBkZXBWZXJzaW9uIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnZGVidWcnLCAnc3VibW9kdWxlIGhhcyBubyBkZXBlbmRlbmNpZXMgb3IgaXMgaW52YWxpZCcsIGVycik7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3ViTW9kTmFtZSA9IHN1Yk1vZERhdGEuZ2V0KCcvL05hbWUnKS5hdHRyKCd2YWx1ZScpLnZhbHVlKCk7XHJcblxyXG4gICAgICBhY2N1bVtzdWJNb2RJZF0gPSB7XHJcbiAgICAgICAgc3ViTW9kSWQsXHJcbiAgICAgICAgc3ViTW9kTmFtZSxcclxuICAgICAgICBzdWJNb2RWZXIsXHJcbiAgICAgICAgc3ViTW9kRmlsZSxcclxuICAgICAgICB2b3J0ZXhJZDogISFtYW5hZ2VkRW50cnkgPyBtYW5hZ2VkRW50cnkudm9ydGV4SWQgOiBzdWJNb2RJZCxcclxuICAgICAgICBpc09mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhzdWJNb2RJZCksXHJcbiAgICAgICAgaXNMb2NrZWQ6IExPQ0tFRF9NT0RVTEVTLmhhcyhzdWJNb2RJZCksXHJcbiAgICAgICAgaXNNdWx0aXBsYXllcixcclxuICAgICAgICBkZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgaW52YWxpZDoge1xyXG4gICAgICAgICAgLy8gV2lsbCBob2xkIHRoZSBzdWJtb2QgaWRzIG9mIGFueSBkZXRlY3RlZCBjeWNsaWMgZGVwZW5kZW5jaWVzLlxyXG4gICAgICAgICAgY3ljbGljOiBbXSxcclxuXHJcbiAgICAgICAgICAvLyBXaWxsIGhvbGQgdGhlIHN1Ym1vZCBpZHMgb2YgYW55IG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gICAgICAgICAgbWlzc2luZzogW10sXHJcblxyXG4gICAgICAgICAgLy8gV2lsbCBob2xkIHRoZSBzdWJtb2QgaWRzIG9mIHN1cHBvc2VkbHkgaW5jb21wYXRpYmxlIGRlcGVuZGVuY2llcyAodmVyc2lvbi13aXNlKVxyXG4gICAgICAgICAgaW5jb21wYXRpYmxlRGVwczogW10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAnVm9ydGV4IHdhcyB1bmFibGUgdG8gcGFyc2U6ICcgKyBzdWJNb2RGaWxlICsgJztcXG5cXG4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICdZb3UgY2FuIGVpdGhlciBpbmZvcm0gdGhlIG1vZCBhdXRob3IgYW5kIHdhaXQgZm9yIGZpeCwgb3IgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyAneW91IGNhbiB1c2UgYW4gb25saW5lIHhtbCB2YWxpZGF0b3IgdG8gZmluZCBhbmQgZml4IHRoZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICArICdlcnJvciB5b3Vyc2VsZi4nO1xyXG4gICAgICAvLyBsaWJ4bWxqcyByYXJlbHkgcHJvZHVjZXMgdXNlZnVsIGVycm9yIG1lc3NhZ2VzIC0gaXQgdXN1YWxseSBwb2ludHNcclxuICAgICAgLy8gIHRvIHRoZSBwYXJlbnQgbm9kZSBvZiB0aGUgYWN0dWFsIHByb2JsZW0gYW5kIGluIHRoaXMgY2FzZSBuZWFybHlcclxuICAgICAgLy8gIGFsd2F5cyB3aWxsIHBvaW50IHRvIHRoZSByb290IG9mIHRoZSBYTUwgZmlsZSAoTW9kdWxlKSB3aGljaCBpcyBjb21wbGV0ZWx5IHVzZWxlc3MuXHJcbiAgICAgIC8vICBXZSdyZSBnb2luZyB0byBwcm92aWRlIGEgaHVtYW4gcmVhZGFibGUgZXJyb3IgdG8gdGhlIHVzZXIuXHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJyxcclxuICAgICAgICBlcnJvck1lc3NhZ2UsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ01OQjI6IHBhcnNpbmcgZXJyb3InLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgfSwge30pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRNYW5hZ2VkSWRzKGNvbnRleHQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGlzIGlzIGEgdmFsaWQgdXNlIGNhc2UgaWYgdGhlIGdhbWVtb2RlXHJcbiAgICAvLyAgaGFzIGZhaWxlZCBhY3RpdmF0aW9uLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIGFjdGl2ZVByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpXHJcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQpXHJcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xyXG5cclxuICBjb25zdCBpbnZhbGlkTW9kcyA9IFtdO1xyXG4gIGNvbnN0IGluc3RhbGxhdGlvbkRpciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChpbnN0YWxsYXRpb25EaXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmFnZWQgaWRzJywgJ3VuZGVmaW5lZCBzdGFnaW5nIGZvbGRlcicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoZW5hYmxlZE1vZHMsIGFzeW5jIChhY2N1bSwgZW50cnkpID0+IHtcclxuICAgIGlmIChlbnRyeT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIEludmFsaWQgbW9kIGVudHJ5IC0gc2tpcCBpdC5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RJbnN0YWxsYXRpb25QYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvbkRpciwgZW50cnkuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICBsZXQgZmlsZXM7XHJcbiAgICB0cnkge1xyXG4gICAgICBmaWxlcyA9IGF3YWl0IHdhbGtBc3luYyhtb2RJbnN0YWxsYXRpb25QYXRoLCAzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgbW9kIG11c3QndmUgYmVlbiByZW1vdmVkIG1hbnVhbGx5IGJ5IHRoZSB1c2VyIGZyb21cclxuICAgICAgLy8gIHRoZSBzdGFnaW5nIGZvbGRlciAtIGdvb2Qgam9iIGJ1ZGR5IVxyXG4gICAgICAvLyAgR29pbmcgdG8gbG9nIHRoaXMsIGJ1dCBvdGhlcndpc2UgYWxsb3cgaXQgdG8gcHJvY2VlZC5cclxuICAgICAgaW52YWxpZE1vZHMucHVzaChlbnRyeS5pZCk7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlYWQgbW9kIHN0YWdpbmcgZm9sZGVyJywgeyBtb2RJZDogZW50cnkuaWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3ViTW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICAgIGlmIChzdWJNb2RGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gTm8gc3VibW9kIGZpbGUgLSBubyBMT1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc3ViTW9kSWQ7XHJcbiAgICB0cnkge1xyXG4gICAgICBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShzdWJNb2RGaWxlLCAnSWQnKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgc3VibW9kdWxlIHdvdWxkJ3ZlIG5ldmVyIG1hbmFnZWQgdG8gaW5zdGFsbCBjb3JyZWN0bHlcclxuICAgICAgLy8gIGlmIHRoZSB4bWwgZmlsZSBoYWQgYmVlbiBpbnZhbGlkIC0gdGhpcyBzdWdnZXN0cyB0aGF0IHRoZSB1c2VyXHJcbiAgICAgIC8vICBvciBhIDNyZCBwYXJ0eSBhcHBsaWNhdGlvbiBoYXMgdGFtcGVyZWQgd2l0aCB0aGUgZmlsZS4uLlxyXG4gICAgICAvLyAgV2Ugc2ltcGx5IGxvZyB0aGlzIGhlcmUgYXMgdGhlIHBhcnNlLWluZyBmYWlsdXJlIHdpbGwgYmUgaGlnaGxpZ2h0ZWRcclxuICAgICAgLy8gIGJ5IHRoZSBDQUNIRSBsb2dpYy5cclxuICAgICAgbG9nKCdlcnJvcicsICdbTW5CMl0gVW5hYmxlIHRvIHBhcnNlIHN1Ym1vZHVsZSBmaWxlJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9XHJcbiAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgc3ViTW9kSWQsXHJcbiAgICAgIHN1Yk1vZEZpbGUsXHJcbiAgICAgIHZvcnRleElkOiBlbnRyeS5pZCxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gIH0sIFtdKVxyXG4gIC50YXAoKHJlcykgPT4ge1xyXG4gICAgaWYgKGludmFsaWRNb2RzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgZXJyTWVzc2FnZSA9ICdUaGUgZm9sbG93aW5nIG1vZHMgYXJlIGluYWNjZXNzaWJsZSBvciBhcmUgbWlzc2luZyAnXHJcbiAgICAgICAgKyAnaW4gdGhlIHN0YWdpbmcgZm9sZGVyOlxcblxcbicgKyBpbnZhbGlkTW9kcy5qb2luKCdcXG4nKSArICdcXG5cXG5QbGVhc2UgZW5zdXJlICdcclxuICAgICAgICArICd0aGVzZSBtb2RzIGFuZCB0aGVpciBjb250ZW50IGFyZSBub3Qgb3BlbiBpbiBhbnkgb3RoZXIgYXBwbGljYXRpb24gJ1xyXG4gICAgICAgICsgJyhpbmNsdWRpbmcgdGhlIGdhbWUgaXRzZWxmKS4gSWYgdGhlIG1vZCBpcyBtaXNzaW5nIGVudGlyZWx5LCBwbGVhc2UgcmUtaW5zdGFsbCBpdCAnXHJcbiAgICAgICAgKyAnb3IgcmVtb3ZlIGl0IGZyb20geW91ciBtb2RzIHBhZ2UuIFBsZWFzZSBjaGVjayB5b3VyIHZvcnRleCBsb2cgZmlsZSBmb3IgZGV0YWlscy4nO1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTW9kcyBpbiBTdGFnaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihlcnJNZXNzYWdlKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcikge1xyXG4gIC8vIEdvIHRocm91Z2ggdGhlIGVuYWJsZWQgZW50cmllcyBzbyB3ZSBjYW4gZm9ybSBvdXIgZ2FtZSBwYXJhbWV0ZXJzLlxyXG4gIGNvbnN0IGVuYWJsZWQgPSAoISFsb2FkT3JkZXIgJiYgT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPiAwKVxyXG4gICAgPyBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gbG9hZE9yZGVyW2tleV0uZW5hYmxlZClcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcclxuICAgICAgICAucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICAgICAgICBjb25zdCBlbnRyeSA9IGNhY2hlS2V5cy5maW5kKGNhY2hlRWxlbWVudCA9PiBDQUNIRVtjYWNoZUVsZW1lbnRdLnZvcnRleElkID09PSBrZXkpO1xyXG4gICAgICAgICAgaWYgKCEhZW50cnkpIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgICAgfSwgW10pXHJcbiAgICA6IExBVU5DSEVSX0RBVEEuc2luZ2xlUGxheWVyU3ViTW9kc1xyXG4gICAgICAgIC5maWx0ZXIoc3ViTW9kID0+IHN1Yk1vZC5lbmFibGVkKVxyXG4gICAgICAgIC5tYXAoc3ViTW9kID0+IHN1Yk1vZC5zdWJNb2RJZCk7XHJcblxyXG4gIC8vIEN1cnJlbnRseSBTaW5nbGVwbGF5ZXIgb25seSEgKG1vcmUgcmVzZWFyY2ggaW50byBNUCBuZWVkcyB0byBiZSBkb25lKVxyXG4gIGNvbnN0IHBhcmFtZXRlcnMgPSBbXHJcbiAgICBQQVJBTVNfVEVNUExBVEVbMF0ucmVwbGFjZSgne3tnYW1lTW9kZX19JywgJ3NpbmdsZXBsYXllcicpLFxyXG4gICAgUEFSQU1TX1RFTVBMQVRFWzFdLnJlcGxhY2UoJ3t7c3ViTW9kSWRzfX0nLCBlbmFibGVkLm1hcChrZXkgPT4gYCoke2tleX1gKS5qb2luKCcnKSksXHJcbiAgXTtcclxuXHJcbiAgLy8gVGhpcyBsYXVuY2hlciB3aWxsIG5vdCBmdW5jdGlvbiB1bmxlc3MgdGhlIHBhdGggaXMgZ3VhcmFudGVlZCB0byBwb2ludFxyXG4gIC8vICB0b3dhcmRzIHRoZSBiYW5uZXJsb3JkIGV4ZWN1dGFibGUuIEdpdmVuIHRoYXQgZWFybGllciB2ZXJzaW9ucyBvZiB0aGlzXHJcbiAgLy8gIGV4dGVuc2lvbiBoYWQgdGFyZ2V0ZWQgVGFsZVdvcmxkcy5MYXVuY2hlci5leGUgaW5zdGVhZCAtIHdlIG5lZWQgdG8gbWFrZVxyXG4gIC8vICBzdXJlIHRoaXMgaXMgc2V0IGNvcnJlY3RseS5cclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldEdhbWVQYXJhbWV0ZXJzKEdBTUVfSUQsIHtcclxuICAgIGV4ZWN1dGFibGU6IEJBTk5FUkxPUkRfRVhFQyxcclxuICAgIHBhcmFtZXRlcnMsXHJcbiAgfSkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEVsZW1lbnRWYWx1ZShzdWJNb2R1bGVGaWxlUGF0aCwgZWxlbWVudE5hbWUpIHtcclxuICBjb25zdCBsb2dBbmRDb250aW51ZSA9ICgpID0+IHtcclxuICAgIGxvZygnZXJyb3InLCAnVW5hYmxlIHRvIHBhcnNlIHhtbCBlbGVtZW50JywgZWxlbWVudE5hbWUpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH07XHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoc3ViTW9kdWxlRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSlcclxuICAgIC50aGVuKHhtbERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG1vZEluZm8gPSBwYXJzZVhtbFN0cmluZyh4bWxEYXRhKTtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gbW9kSW5mby5nZXQoYC8vJHtlbGVtZW50TmFtZX1gKTtcclxuICAgICAgICByZXR1cm4gKChlbGVtZW50ICE9PSB1bmRlZmluZWQpICYmIChlbGVtZW50LmF0dHIoJ3ZhbHVlJykudmFsdWUoKSAhPT0gdW5kZWZpbmVkKSlcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGVsZW1lbnQuYXR0cigndmFsdWUnKS52YWx1ZSgpKVxyXG4gICAgICAgICAgOiBsb2dBbmRDb250aW51ZSgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAnVm9ydGV4IHdhcyB1bmFibGUgdG8gcGFyc2U6ICcgKyBzdWJNb2R1bGVGaWxlUGF0aCArICc7IHBsZWFzZSBpbmZvcm0gdGhlIG1vZCBhdXRob3InO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChlcnJvck1lc3NhZ2UpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbRVBJQ0FQUF9JRCwgU1RFQU1BUFBfSUQudG9TdHJpbmcoKV0pXHJcbiAgICAudGhlbihnYW1lID0+IHtcclxuICAgICAgU1RPUkVfSUQgPSBnYW1lLmdhbWVTdG9yZUlkO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGdhbWUuZ2FtZVBhdGgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSb290TW9kKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBub3RTdXBwb3J0ZWQgPSB7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH07XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gRGlmZmVyZW50IGdhbWUuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb3dlcmVkID0gZmlsZXMubWFwKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpKTtcclxuICBjb25zdCBtb2RzRmlsZSA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUy50b0xvd2VyQ2FzZSgpKSAhPT0gLTEpO1xyXG4gIGlmIChtb2RzRmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGVyZSdzIG5vIE1vZHVsZXMgZm9sZGVyLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaWR4ID0gbW9kc0ZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUy50b0xvd2VyQ2FzZSgpKTtcclxuICBjb25zdCByb290Rm9sZGVyTWF0Y2hlcyA9IGxvd2VyZWQuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIHJldHVybiAoKChzZWdtZW50cy5sZW5ndGggLSAxKSA+IGlkeCkgJiYgUk9PVF9GT0xERVJTLmhhcyhzZWdtZW50c1tpZHhdKSk7XHJcbiAgfSkgfHwgW107XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IChyb290Rm9sZGVyTWF0Y2hlcy5sZW5ndGggPiAwKSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSb290TW9kKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICBjb25zdCBtb2R1bGVGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUykgIT09IC0xKTtcclxuICBjb25zdCBpZHggPSBtb2R1bGVGaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMpO1xyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcclxuICAgIGNvbnN0IGxhc3RFbGVtZW50SWR4ID0gc2VnbWVudHMubGVuZ3RoIC0gMTtcclxuXHJcbiAgICAvLyBJZ25vcmUgZGlyZWN0b3JpZXMgYW5kIGVuc3VyZSB0aGF0IHRoZSBmaWxlIGNvbnRhaW5zIGEga25vd24gcm9vdCBmb2xkZXIgYXRcclxuICAgIC8vICB0aGUgZXhwZWN0ZWQgaW5kZXguXHJcbiAgICByZXR1cm4gKFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSlcclxuICAgICAgJiYgKHBhdGguZXh0bmFtZShzZWdtZW50c1tsYXN0RWxlbWVudElkeF0pICE9PSAnJykpO1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBkZXN0aW5hdGlvbiA9IGZpbGUuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoaWR4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4ocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdEZvclN1Ym1vZHVsZXMoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIENoZWNrIHRoaXMgaXMgYSBtb2QgZm9yIEJhbm5lcmxvcmQgYW5kIGl0IGNvbnRhaW5zIGEgU3ViTW9kdWxlLnhtbFxyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU3ViTW9kdWxlcyhmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIHN0cmFpZ2h0IGF3YXkuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuIHBhdGguZXh0bmFtZShzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSkgIT09ICcnO1xyXG4gIH0pO1xyXG4gIGNvbnN0IHN1Yk1vZElkcyA9IFtdO1xyXG4gIGNvbnN0IHN1Yk1vZHMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKHN1Yk1vZHMsIGFzeW5jIChhY2N1bSwgbW9kRmlsZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IG1vZEZpbGUuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgY29uc3Qgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSksICdJZCcpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IChzZWdtZW50cy5sZW5ndGggPiAxKVxyXG4gICAgICA/IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDJdXHJcbiAgICAgIDogc3ViTW9kSWQ7XHJcblxyXG4gICAgc3ViTW9kSWRzLnB1c2goc3ViTW9kSWQpO1xyXG4gICAgY29uc3QgaWR4ID0gbW9kRmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoU1VCTU9EX0ZJTEUpO1xyXG4gICAgLy8gRmlsdGVyIHRoZSBtb2QgZmlsZXMgZm9yIHRoaXMgc3BlY2lmaWMgc3VibW9kdWxlLlxyXG4gICAgY29uc3Qgc3ViTW9kRmlsZXM6IHN0cmluZ1tdXHJcbiAgICAgID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gZmlsZS5zbGljZSgwLCBpZHgpID09PSBtb2RGaWxlLnNsaWNlKDAsIGlkeCkpO1xyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gc3ViTW9kRmlsZXMubWFwKChtb2RGaWxlOiBzdHJpbmcpID0+ICh7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBtb2RGaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKE1PRFVMRVMsIG1vZE5hbWUsIG1vZEZpbGUuc2xpY2UoaWR4KSksXHJcbiAgICB9KSk7XHJcbiAgICByZXR1cm4gYWNjdW0uY29uY2F0KGluc3RydWN0aW9ucyk7XHJcbiAgfSwgW10pXHJcbiAgLnRoZW4obWVyZ2VkID0+IHtcclxuICAgIGNvbnN0IHN1Yk1vZElkc0F0dHIgPSB7XHJcbiAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICBrZXk6ICdzdWJNb2RJZHMnLFxyXG4gICAgICB2YWx1ZTogc3ViTW9kSWRzLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnM6IFtdLmNvbmNhdChtZXJnZWQsIFtzdWJNb2RJZHNBdHRyXSkgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KSB7XHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbChHQU1FX0lELCAnVGFsZVdvcmxkc0Jhbm5lcmxvcmRMYXVuY2hlcicsIHtcclxuICAgIGlkOiAnVGFsZVdvcmxkc0Jhbm5lcmxvcmRMYXVuY2hlcicsXHJcbiAgICBuYW1lOiAnT2ZmaWNpYWwgTGF1bmNoZXInLFxyXG4gICAgbG9nbzogJ3R3bGF1bmNoZXIucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IHBhdGguYmFzZW5hbWUoTEFVTkNIRVJfRVhFQyksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgIHBhdGguYmFzZW5hbWUoTEFVTkNIRVJfRVhFQyksXHJcbiAgICBdLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBMQVVOQ0hFUl9FWEVDKSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgd29ya2luZ0RpcmVjdG9yeTogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcpLFxyXG4gICAgaGlkZGVuOiBmYWxzZSxcclxuICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgfSwgZmFsc2UpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0TW9kZGluZ1Rvb2woY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGlkZGVuPzogYm9vbGVhbikge1xyXG4gIGNvbnN0IHRvb2xJZCA9ICdiYW5uZXJsb3JkLXNkayc7XHJcbiAgY29uc3QgZXhlYyA9IHBhdGguYmFzZW5hbWUoTU9ERElOR19LSVRfRVhFQyk7XHJcbiAgY29uc3QgdG9vbCA9IHtcclxuICAgIGlkOiB0b29sSWQsXHJcbiAgICBuYW1lOiAnTW9kZGluZyBLaXQnLFxyXG4gICAgbG9nbzogJ3R3bGF1bmNoZXIucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IGV4ZWMsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbIGV4ZWMgXSxcclxuICAgIHBhdGg6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9ERElOR19LSVRfRVhFQyksXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcclxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgcGF0aC5kaXJuYW1lKE1PRERJTkdfS0lUX0VYRUMpKSxcclxuICAgIGhpZGRlbixcclxuICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgfTtcclxuXHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbChHQU1FX0lELCB0b29sSWQsIHRvb2wsIGZhbHNlKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIC8vIFF1aWNrbHkgZW5zdXJlIHRoYXQgdGhlIG9mZmljaWFsIExhdW5jaGVyIGlzIGFkZGVkLlxyXG4gIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9ERElOR19LSVRfRVhFQykpO1xyXG4gICAgc2V0TW9kZGluZ1Rvb2woY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHRvb2xzID0gZGlzY292ZXJ5Py50b29scztcclxuICAgIGlmICgodG9vbHMgIT09IHVuZGVmaW5lZClcclxuICAgICYmICh1dGlsLmdldFNhZmUodG9vbHMsIFsnYmFubmVybG9yZC1zZGsnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnksIHRydWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSWYgZ2FtZSBzdG9yZSBub3QgZm91bmQsIGxvY2F0aW9uIG1heSBiZSBzZXQgbWFudWFsbHkgLSBhbGxvdyBzZXR1cFxyXG4gIC8vICBmdW5jdGlvbiB0byBjb250aW51ZS5cclxuICBjb25zdCBmaW5kU3RvcmVJZCA9ICgpID0+IGZpbmRHYW1lKCkuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBjb25zdCBzdGFydFN0ZWFtID0gKCkgPT4gZmluZFN0b3JlSWQoKVxyXG4gICAgLnRoZW4oKCkgPT4gKFNUT1JFX0lEID09PSAnc3RlYW0nKVxyXG4gICAgICA/IHV0aWwuR2FtZVN0b3JlSGVscGVyLmxhdW5jaEdhbWVTdG9yZShjb250ZXh0LmFwaSwgU1RPUkVfSUQsIHVuZGVmaW5lZCwgdHJ1ZSlcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKSk7XHJcblxyXG4gIGNvbnN0IGlkUmVnZXhwID0gL1xcPElkXFw+KC4qPylcXDxcXC9JZFxcPi9nbTtcclxuICBjb25zdCBlbmFibGVkUmVnZXhwID0gL1xcPElzU2VsZWN0ZWRcXD4oLio/KVxcPFxcL0lzU2VsZWN0ZWRcXD4vZ207XHJcbiAgY29uc3QgdHJpbVRhZ3NSZWdleHAgPSAvPFtePl0qPj8vZ207XHJcbiAgY29uc3QgY3JlYXRlRGF0YUVsZW1lbnQgPSAoeG1sTm9kZSkgPT4ge1xyXG4gICAgY29uc3Qgbm9kZVN0cmluZyA9IHhtbE5vZGUudG9TdHJpbmcoeyB3aGl0ZXNwYWNlOiBmYWxzZSB9KS5yZXBsYWNlKC9bIFxcdFxcclxcbl0vZ20sICcnKTtcclxuICAgIGlmICghIW5vZGVTdHJpbmcpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdWJNb2RJZDogbm9kZVN0cmluZy5tYXRjaChpZFJlZ2V4cClbMF0ucmVwbGFjZSh0cmltVGFnc1JlZ2V4cCwgJycpLFxyXG4gICAgICAgIGVuYWJsZWQ6IG5vZGVTdHJpbmcubWF0Y2goZW5hYmxlZFJlZ2V4cClbMF1cclxuICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAucmVwbGFjZSh0cmltVGFnc1JlZ2V4cCwgJycpID09PSAndHJ1ZScsXHJcbiAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIENoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgc2V0IHRoZSBsb2FkIG9yZGVyIG9iamVjdCBmb3IgdGhpcyBwcm9maWxlXHJcbiAgLy8gIGFuZCBjcmVhdGUgaXQgaWYgd2UgaGF2ZW4ndC5cclxuICByZXR1cm4gc3RhcnRTdGVhbSgpLnRoZW4oKCkgPT4gZ2V0WE1MRGF0YShMQVVOQ0hFUl9EQVRBX1BBVEgpKS50aGVuKGxhdW5jaGVyRGF0YSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzaW5nbGVQbGF5ZXJNb2RzID1cclxuICAgICAgICBsYXVuY2hlckRhdGEuZ2V0KCcvL1VzZXJEYXRhL1NpbmdsZXBsYXllckRhdGEvTW9kRGF0YXMnKS5jaGlsZE5vZGVzKCk7XHJcbiAgICAgIGNvbnN0IG11bHRpUGxheWVyTW9kcyA9IGxhdW5jaGVyRGF0YS5nZXQoJy8vVXNlckRhdGEvTXVsdGlwbGF5ZXJEYXRhL01vZERhdGFzJykuY2hpbGROb2RlcygpO1xyXG4gICAgICBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMgPSBzaW5nbGVQbGF5ZXJNb2RzLnJlZHVjZSgoYWNjdW0sIHNwbSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGRhdGFFbGVtZW50ID0gY3JlYXRlRGF0YUVsZW1lbnQoc3BtKTtcclxuICAgICAgICBpZiAoISFkYXRhRWxlbWVudCkge1xyXG4gICAgICAgICAgYWNjdW0ucHVzaChkYXRhRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gICAgICBMQVVOQ0hFUl9EQVRBLm11bHRpcGxheWVyU3ViTW9kcyA9IG11bHRpUGxheWVyTW9kcy5yZWR1Y2UoKGFjY3VtLCBtcG0pID0+IHtcclxuICAgICAgICBjb25zdCBkYXRhRWxlbWVudCA9IGNyZWF0ZURhdGFFbGVtZW50KG1wbSk7XHJcbiAgICAgICAgaWYgKCEhZGF0YUVsZW1lbnQpIHtcclxuICAgICAgICAgIGFjY3VtLnB1c2goZGF0YUVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIFtdKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKTtcclxuICAgIH1cclxuICB9KS50aGVuKGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IGRlcGxveWVkU3ViTW9kdWxlcyA9IGF3YWl0IGdldERlcGxveWVkU3ViTW9kUGF0aHMoY29udGV4dCk7XHJcbiAgICBDQUNIRSA9IGF3YWl0IGdldERlcGxveWVkTW9kRGF0YShjb250ZXh0LCBkZXBsb3llZFN1Yk1vZHVsZXMpO1xyXG5cclxuICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGRvIGEgcXVpY2sgdFNvcnQgYXQgdGhpcyBwb2ludCAtIG5vdCBnb2luZyB0b1xyXG4gICAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxyXG4gICAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIGNvbnN0IHNvcnRlZCA9IHRTb3J0KHsgc3ViTW9kSWRzOiBtb2RJZHMsIGFsbG93TG9ja2VkOiB0cnVlLCBtZXRhTWFuYWdlciB9KTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuTm90Rm91bmQpIHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxyXG4gICAgICAgICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgdGhyb3VnaCB0aGUgb2ZmaWNpYWwgZ2FtZSBsYXVuY2hlciBhbmQgJ1xyXG4gICAgICArICd0cnkgYWdhaW4nLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBmaW5kIGdhbWUgbGF1bmNoZXIgZGF0YScsXHJcbiAgICAgICAgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9KVxyXG4gIC5maW5hbGx5KCgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFZhbGlkIHVzZSBjYXNlIHdoZW4gYXR0ZW1wdGluZyB0byBzd2l0Y2ggdG9cclxuICAgICAgLy8gIEJhbm5lcmxvcmQgd2l0aG91dCBhbnkgYWN0aXZlIHByb2ZpbGUuXHJcbiAgICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCB7fSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW52YWxpZChzdWJNb2RJZCkge1xyXG4gIGNvbnN0IGN5Y2xpY0Vycm9ycyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmdEZXBzID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ21pc3NpbmcnXSwgW10pO1xyXG4gIHJldHVybiAoKGN5Y2xpY0Vycm9ycy5sZW5ndGggPiAwKSB8fCAobWlzc2luZ0RlcHMubGVuZ3RoID4gMCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRWYWxpZGF0aW9uSW5mbyhtb2RWb3J0ZXhJZCkge1xyXG4gIC8vIFdlIGV4cGVjdCB0aGUgbWV0aG9kIGNhbGxlciB0byBwcm92aWRlIHRoZSB2b3J0ZXhJZCBvZiB0aGUgc3ViTW9kLCBhc1xyXG4gIC8vICB0aGlzIGlzIGhvdyB3ZSBzdG9yZSB0aGlzIGluZm9ybWF0aW9uIGluIHRoZSBsb2FkIG9yZGVyIG9iamVjdC5cclxuICAvLyAgUmVhc29uIHdoeSB3ZSBuZWVkIHRvIHNlYXJjaCB0aGUgY2FjaGUgYnkgdm9ydGV4SWQgcmF0aGVyIHRoYW4gc3ViTW9kSWQuXHJcbiAgY29uc3Qgc3ViTW9kSWQgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT4gQ0FDSEVba2V5XS52b3J0ZXhJZCA9PT0gbW9kVm9ydGV4SWQpO1xyXG4gIGNvbnN0IGN5Y2xpYyA9IHV0aWwuZ2V0U2FmZShDQUNIRVtzdWJNb2RJZF0sIFsnaW52YWxpZCcsICdjeWNsaWMnXSwgW10pO1xyXG4gIGNvbnN0IG1pc3NpbmcgPSB1dGlsLmdldFNhZmUoQ0FDSEVbc3ViTW9kSWRdLCBbJ2ludmFsaWQnLCAnbWlzc2luZyddLCBbXSk7XHJcbiAgY29uc3QgaW5jb21wYXRpYmxlID0gdXRpbC5nZXRTYWZlKENBQ0hFW3N1Yk1vZElkXSwgWydpbnZhbGlkJywgJ2luY29tcGF0aWJsZURlcHMnXSwgW10pO1xyXG4gIHJldHVybiB7XHJcbiAgICBjeWNsaWMsXHJcbiAgICBtaXNzaW5nLFxyXG4gICAgaW5jb21wYXRpYmxlLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRTb3J0KHNvcnRQcm9wczogSVNvcnRQcm9wcywgdGVzdDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgY29uc3QgeyBzdWJNb2RJZHMsIGFsbG93TG9ja2VkLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0gPSBzb3J0UHJvcHM7XHJcbiAgLy8gVG9wb2xvZ2ljYWwgc29ydCAtIHdlIG5lZWQgdG86XHJcbiAgLy8gIC0gSWRlbnRpZnkgY3ljbGljIGRlcGVuZGVuY2llcy5cclxuICAvLyAgLSBJZGVudGlmeSBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAvLyAgLSBXZSB3aWxsIHRyeSB0byBpZGVudGlmeSBpbmNvbXBhdGlibGUgZGVwZW5kZW5jaWVzICh2ZXJzaW9uLXdpc2UpXHJcblxyXG4gIC8vIFRoZXNlIGFyZSBtYW51YWxseSBsb2NrZWQgbW9kIGVudHJpZXMuXHJcbiAgY29uc3QgbG9ja2VkU3ViTW9kcyA9ICghIWxvYWRPcmRlcilcclxuICAgID8gc3ViTW9kSWRzLmZpbHRlcihzdWJNb2RJZCA9PiB7XHJcbiAgICAgIGNvbnN0IGVudHJ5ID0gQ0FDSEVbc3ViTW9kSWRdO1xyXG4gICAgICByZXR1cm4gKCEhZW50cnkpXHJcbiAgICAgICAgPyAhIWxvYWRPcmRlcltlbnRyeS52b3J0ZXhJZF0/LmxvY2tlZFxyXG4gICAgICAgIDogZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgOiBbXTtcclxuICBjb25zdCBhbHBoYWJldGljYWwgPSBzdWJNb2RJZHMuZmlsdGVyKHN1Yk1vZCA9PiAhbG9ja2VkU3ViTW9kcy5pbmNsdWRlcyhzdWJNb2QpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zb3J0KCk7XHJcbiAgY29uc3QgZ3JhcGggPSBhbHBoYWJldGljYWwucmVkdWNlKChhY2N1bSwgZW50cnkpID0+IHtcclxuICAgIGNvbnN0IGRlcElkcyA9IFsuLi5DQUNIRVtlbnRyeV0uZGVwZW5kZW5jaWVzXS5tYXAoZGVwID0+IGRlcC5kZXBJZCk7XHJcbiAgICAvLyBDcmVhdGUgdGhlIG5vZGUgZ3JhcGguXHJcbiAgICBhY2N1bVtlbnRyeV0gPSBkZXBJZHMuc29ydCgpO1xyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgLy8gV2lsbCBzdG9yZSB0aGUgZmluYWwgTE8gcmVzdWx0XHJcbiAgY29uc3QgcmVzdWx0ID0gW107XHJcblxyXG4gIC8vIFRoZSBub2RlcyB3ZSBoYXZlIHZpc2l0ZWQvcHJvY2Vzc2VkLlxyXG4gIGNvbnN0IHZpc2l0ZWQgPSBbXTtcclxuXHJcbiAgLy8gVGhlIG5vZGVzIHdoaWNoIGFyZSBzdGlsbCBwcm9jZXNzaW5nLlxyXG4gIGNvbnN0IHByb2Nlc3NpbmcgPSBbXTtcclxuXHJcbiAgY29uc3QgdG9wU29ydCA9IChub2RlKSA9PiB7XHJcbiAgICBwcm9jZXNzaW5nW25vZGVdID0gdHJ1ZTtcclxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9ICghIWFsbG93TG9ja2VkKVxyXG4gICAgICA/IGdyYXBoW25vZGVdXHJcbiAgICAgIDogZ3JhcGhbbm9kZV0uZmlsdGVyKGVsZW1lbnQgPT4gIUxPQ0tFRF9NT0RVTEVTLmhhcyhlbGVtZW50KSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgIGlmIChwcm9jZXNzaW5nW2RlcF0pIHtcclxuICAgICAgICAvLyBDeWNsaWMgZGVwZW5kZW5jeSBkZXRlY3RlZCAtIGhpZ2hsaWdodCBib3RoIG1vZHMgYXMgaW52YWxpZFxyXG4gICAgICAgIC8vICB3aXRoaW4gdGhlIGNhY2hlIGl0c2VsZiAtIHdlIGFsc28gbmVlZCB0byBoaWdobGlnaHQgd2hpY2ggbW9kcy5cclxuICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmN5Y2xpYy5wdXNoKGRlcCk7XHJcbiAgICAgICAgQ0FDSEVbZGVwXS5pbnZhbGlkLmN5Y2xpYy5wdXNoKG5vZGUpO1xyXG5cclxuICAgICAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcclxuICAgICAgICBwcm9jZXNzaW5nW25vZGVdID0gZmFsc2U7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGluY29tcGF0aWJsZURlcHMgPSBDQUNIRVtub2RlXS5pbnZhbGlkLmluY29tcGF0aWJsZURlcHM7XHJcbiAgICAgIGNvbnN0IGluY0RlcCA9IGluY29tcGF0aWJsZURlcHMuZmluZChkID0+IGQuZGVwSWQgPT09IGRlcCk7XHJcbiAgICAgIGlmIChPYmplY3Qua2V5cyhncmFwaCkuaW5jbHVkZXMoZGVwKSAmJiAoaW5jRGVwID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgY29uc3QgZGVwVmVyID0gQ0FDSEVbZGVwXS5zdWJNb2RWZXI7XHJcbiAgICAgICAgY29uc3QgZGVwSW5zdCA9IENBQ0hFW25vZGVdLmRlcGVuZGVuY2llcy5maW5kKGQgPT4gZC5kZXBJZCA9PT0gZGVwKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBzZW12ZXIuc2F0aXNmaWVzKGRlcEluc3QuZGVwVmVyc2lvbiwgZGVwVmVyKTtcclxuICAgICAgICAgIGlmICghbWF0Y2ggJiYgISFkZXBJbnN0Py5kZXBWZXJzaW9uICYmICEhZGVwVmVyKSB7XHJcbiAgICAgICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQuaW5jb21wYXRpYmxlRGVwcy5wdXNoKHtcclxuICAgICAgICAgICAgICBkZXBJZDogZGVwLFxyXG4gICAgICAgICAgICAgIHJlcXVpcmVkVmVyc2lvbjogZGVwSW5zdC5kZXBWZXJzaW9uLFxyXG4gICAgICAgICAgICAgIGN1cnJlbnRWZXJzaW9uOiBkZXBWZXIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gT2sgc28gd2UgZGlkbid0IG1hbmFnZSB0byBjb21wYXJlIHRoZSB2ZXJzaW9ucywgd2UgbG9nIHRoaXMgYW5kXHJcbiAgICAgICAgICAvLyAgY29udGludWUuXHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byBjb21wYXJlIHZlcnNpb25zJywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghdmlzaXRlZFtkZXBdICYmICFsb2NrZWRTdWJNb2RzLmluY2x1ZGVzKGRlcCkpIHtcclxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGdyYXBoKS5pbmNsdWRlcyhkZXApKSB7XHJcbiAgICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLm1pc3NpbmcucHVzaChkZXApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0b3BTb3J0KGRlcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc2luZ1tub2RlXSA9IGZhbHNlO1xyXG4gICAgdmlzaXRlZFtub2RlXSA9IHRydWU7XHJcblxyXG4gICAgaWYgKCFpc0ludmFsaWQobm9kZSkpIHtcclxuICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZm9yIChjb25zdCBub2RlIGluIGdyYXBoKSB7XHJcbiAgICBpZiAoIXZpc2l0ZWRbbm9kZV0gJiYgIXByb2Nlc3Npbmdbbm9kZV0pIHtcclxuICAgICAgdG9wU29ydChub2RlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChhbGxvd0xvY2tlZCkge1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8vIFByb3BlciB0b3BvbG9naWNhbCBzb3J0IGRpY3RhdGVzIHdlIHNpbXBseSByZXR1cm4gdGhlXHJcbiAgLy8gIHJlc3VsdCBhdCB0aGlzIHBvaW50LiBCdXQsIG1vZCBhdXRob3JzIHdhbnQgbW9kdWxlc1xyXG4gIC8vICB3aXRoIG5vIGRlcGVuZGVuY2llcyB0byBidWJibGUgdXAgdG8gdGhlIHRvcCBvZiB0aGUgTE8uXHJcbiAgLy8gIChUaGlzIHdpbGwgb25seSBhcHBseSB0byBub24gbG9ja2VkIGVudHJpZXMpXHJcbiAgY29uc3Qgc3ViTW9kc1dpdGhOb0RlcHMgPSByZXN1bHQuZmlsdGVyKGRlcCA9PiAoZ3JhcGhbZGVwXS5sZW5ndGggPT09IDApXHJcbiAgICB8fCAoZ3JhcGhbZGVwXS5maW5kKGQgPT4gIUxPQ0tFRF9NT0RVTEVTLmhhcyhkKSkgPT09IHVuZGVmaW5lZCkpLnNvcnQoKSB8fCBbXTtcclxuICBjb25zdCB0YW1wZXJlZFJlc3VsdCA9IFtdLmNvbmNhdChzdWJNb2RzV2l0aE5vRGVwcyxcclxuICAgIHJlc3VsdC5maWx0ZXIoZW50cnkgPT4gIXN1Yk1vZHNXaXRoTm9EZXBzLmluY2x1ZGVzKGVudHJ5KSkpO1xyXG4gIGxvY2tlZFN1Yk1vZHMuZm9yRWFjaChzdWJNb2RJZCA9PiB7XHJcbiAgICBjb25zdCBwb3MgPSBsb2FkT3JkZXJbQ0FDSEVbc3ViTW9kSWRdLnZvcnRleElkXS5wb3M7XHJcbiAgICB0YW1wZXJlZFJlc3VsdC5zcGxpY2UocG9zLCAwLCBbc3ViTW9kSWRdKTtcclxuICB9KTtcclxuXHJcbiAgaWYgKHRlc3QgPT09IHRydWUpIHtcclxuICAgIGNvbnN0IG1ldGFTb3J0ZWQgPSBtZXRhTWFuYWdlci5zb3J0KHRhbXBlcmVkUmVzdWx0KTtcclxuICAgIHJldHVybiBtZXRhU29ydGVkO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdGFtcGVyZWRSZXN1bHQ7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc0V4dGVybmFsKGNvbnRleHQsIHN1Yk1vZElkKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICBtb2RJZHMuZm9yRWFjaChtb2RJZCA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZHMgPSB1dGlsLmdldFNhZmUobW9kc1ttb2RJZF0sIFsnYXR0cmlidXRlcycsICdzdWJNb2RJZHMnXSwgW10pO1xyXG4gICAgaWYgKHN1Yk1vZElkcy5pbmNsdWRlcyhzdWJNb2RJZCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIENBQ0hFID0ge307XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmICgoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBkZXBsb3lQcm9maWxlPy5nYW1lSWQpIHx8IChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpKSB7XHJcbiAgICAvLyBEZXBsb3ltZW50IGV2ZW50IHNlZW1zIHRvIGJlIGV4ZWN1dGVkIGZvciBhIHByb2ZpbGUgb3RoZXJcclxuICAgIC8vICB0aGFuIHRoZSBjdXJyZW50bHkgYWN0aXZlIG9uZS4gTm90IGdvaW5nIHRvIGNvbnRpbnVlLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgbWV0YU1hbmFnZXIudXBkYXRlRGVwZW5kZW5jeU1hcChwcm9maWxlSWQpO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGVwbG95ZWRTdWJNb2R1bGVzID0gYXdhaXQgZ2V0RGVwbG95ZWRTdWJNb2RQYXRocyhjb250ZXh0KTtcclxuICAgIENBQ0hFID0gYXdhaXQgZ2V0RGVwbG95ZWRNb2REYXRhKGNvbnRleHQsIGRlcGxveWVkU3ViTW9kdWxlcyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBQcm9jZXNzQ2FuY2VsZWQgbWVhbnMgdGhhdCB3ZSB3ZXJlIHVuYWJsZSB0byBzY2FuIGZvciBkZXBsb3llZFxyXG4gICAgLy8gIHN1Yk1vZHVsZXMsIHByb2JhYmx5IGJlY2F1c2UgZ2FtZSBkaXNjb3ZlcnkgaXMgaW5jb21wbGV0ZS5cclxuICAgIC8vIEl0J3MgYmV5b25kIHRoZSBzY29wZSBvZiB0aGlzIGZ1bmN0aW9uIHRvIHJlcG9ydCBkaXNjb3ZlcnlcclxuICAgIC8vICByZWxhdGVkIGlzc3Vlcy5cclxuICAgIHJldHVybiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwge30pO1xyXG5cclxuICAvLyBXZSdyZSBnb2luZyB0byBkbyBhIHF1aWNrIHRTb3J0IGF0IHRoaXMgcG9pbnQgLSBub3QgZ29pbmcgdG9cclxuICAvLyAgY2hhbmdlIHRoZSB1c2VyJ3MgbG9hZCBvcmRlciwgYnV0IHRoaXMgd2lsbCBoaWdobGlnaHQgYW55XHJcbiAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xyXG4gICAgc3ViTW9kSWRzOiBtb2RJZHMsXHJcbiAgICBhbGxvd0xvY2tlZDogdHJ1ZSxcclxuICAgIGxvYWRPcmRlcixcclxuICAgIG1ldGFNYW5hZ2VyLFxyXG4gIH07XHJcbiAgY29uc3Qgc29ydGVkID0gdFNvcnQoc29ydFByb3BzKTtcclxuXHJcbiAgaWYgKHJlZnJlc2hGdW5jICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHJlZnJlc2hGdW5jKCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlcikge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gUmFjZSBjb25kaXRpb24gP1xyXG4gICAgcmV0dXJuIGl0ZW1zO1xyXG4gIH1cclxuXHJcbiAgbGV0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBpZiAoaXRlbXMubGVuZ3RoID4gMCAmJiBtb2RJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBDYWNoZSBoYXNuJ3QgYmVlbiBwb3B1bGF0ZWQgeWV0LlxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gUmVmcmVzaCB0aGUgY2FjaGUuXHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgYWN0aXZlUHJvZmlsZS5pZCwgbWV0YU1hbmFnZXIpO1xyXG4gICAgICBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBMb2NrZWQgaWRzIGFyZSBhbHdheXMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdCBhcyBhbGxcclxuICAvLyAgb3RoZXIgbW9kdWxlcyBkZXBlbmQgb24gdGhlc2UuXHJcbiAgbGV0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIFNvcnQgdGhlIGxvY2tlZCBpZHMgYW1vbmdzdCB0aGVtc2VsdmVzIHRvIGVuc3VyZVxyXG4gICAgLy8gIHRoYXQgdGhlIGdhbWUgcmVjZWl2ZXMgdGhlc2UgaW4gdGhlIHJpZ2h0IG9yZGVyLlxyXG4gICAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xyXG4gICAgICBzdWJNb2RJZHM6IGxvY2tlZElkcyxcclxuICAgICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICAgIG1ldGFNYW5hZ2VyLFxyXG4gICAgfTtcclxuICAgIGxvY2tlZElkcyA9IHRTb3J0KHNvcnRQcm9wcyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgbG9ja2VkIGVudHJpZXMuXHJcbiAgY29uc3QgbG9ja2VkSXRlbXMgPSBsb2NrZWRJZHMubWFwKGlkID0+ICh7XHJcbiAgICBpZDogQ0FDSEVbaWRdLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVbaWRdLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGlkKSxcclxuICB9KSk7XHJcblxyXG4gIC8vIEV4dGVybmFsIGlkcyB3aWxsIGluY2x1ZGUgb2ZmaWNpYWwgbW9kdWxlcyBhcyB3ZWxsIGJ1dCBub3QgbG9ja2VkIGVudHJpZXMuXHJcbiAgY29uc3QgZXh0ZXJuYWxJZHMgPSBtb2RJZHMuZmlsdGVyKGlkID0+ICghQ0FDSEVbaWRdLmlzTG9ja2VkKSAmJiAoQ0FDSEVbaWRdLnZvcnRleElkID09PSBpZCkpO1xyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgY29uc3QgTE9rZXlzID0gKChPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aCA+IDApXHJcbiAgICA/IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcclxuICAgIDogTEFVTkNIRVJfREFUQS5zaW5nbGVQbGF5ZXJTdWJNb2RzLm1hcChtb2QgPT4gbW9kLnN1Yk1vZElkKSk7XHJcblxyXG4gIC8vIEV4dGVybmFsIG1vZHVsZXMgdGhhdCBhcmUgYWxyZWFkeSBpbiB0aGUgbG9hZCBvcmRlci5cclxuICBjb25zdCBrbm93bkV4dCA9IGV4dGVybmFsSWRzLmZpbHRlcihpZCA9PiBMT2tleXMuaW5jbHVkZXMoaWQpKSB8fCBbXTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgbW9kdWxlcyB3aGljaCBhcmUgbmV3IGFuZCBoYXZlIHlldCB0byBiZSBhZGRlZCB0byB0aGUgTE8uXHJcbiAgY29uc3QgdW5rbm93bkV4dCA9IGV4dGVybmFsSWRzLmZpbHRlcihpZCA9PiAhTE9rZXlzLmluY2x1ZGVzKGlkKSkgfHwgW107XHJcblxyXG4gIGl0ZW1zID0gaXRlbXMuZmlsdGVyKGl0ZW0gPT4ge1xyXG4gICAgLy8gUmVtb3ZlIGFueSBsb2NrZWRJZHMsIGJ1dCBhbHNvIGVuc3VyZSB0aGF0IHRoZVxyXG4gICAgLy8gIGVudHJ5IGNhbiBiZSBmb3VuZCBpbiB0aGUgY2FjaGUuIElmIGl0J3Mgbm90IGluIHRoZVxyXG4gICAgLy8gIGNhY2hlLCB0aGlzIG1heSBtZWFuIHRoYXQgdGhlIHN1Ym1vZCB4bWwgZmlsZSBmYWlsZWRcclxuICAgIC8vICBwYXJzZS1pbmcgYW5kIHRoZXJlZm9yZSBzaG91bGQgbm90IGJlIGRpc3BsYXllZC5cclxuICAgIGNvbnN0IGlzTG9ja2VkID0gbG9ja2VkSWRzLmluY2x1ZGVzKGl0ZW0uaWQpO1xyXG4gICAgY29uc3QgaGFzQ2FjaGVFbnRyeSA9IE9iamVjdC5rZXlzKENBQ0hFKS5maW5kKGtleSA9PlxyXG4gICAgICBDQUNIRVtrZXldLnZvcnRleElkID09PSBpdGVtLmlkKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuICFpc0xvY2tlZCAmJiBoYXNDYWNoZUVudHJ5O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBwb3NNYXAgPSB7fTtcclxuICBsZXQgbmV4dEF2YWlsYWJsZSA9IExPa2V5cy5sZW5ndGg7XHJcbiAgY29uc3QgZ2V0TmV4dFBvcyA9IChsb0lkKSA9PiB7XHJcbiAgICBpZiAoTE9DS0VEX01PRFVMRVMuaGFzKGxvSWQpKSB7XHJcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKExPQ0tFRF9NT0RVTEVTKS5pbmRleE9mKGxvSWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChwb3NNYXBbbG9JZF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBwb3NNYXBbbG9JZF0gPSBuZXh0QXZhaWxhYmxlO1xyXG4gICAgICByZXR1cm4gbmV4dEF2YWlsYWJsZSsrO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHBvc01hcFtsb0lkXTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBrbm93bkV4dC5tYXAoa2V5ID0+ICh7XHJcbiAgICBpZDogQ0FDSEVba2V5XS52b3J0ZXhJZCxcclxuICAgIG5hbWU6IENBQ0hFW2tleV0uc3ViTW9kTmFtZSxcclxuICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBleHRlcm5hbDogaXNFeHRlcm5hbChjb250ZXh0LCBDQUNIRVtrZXldLnZvcnRleElkKSxcclxuICAgIG9mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhrZXkpLFxyXG4gIH0pKVxyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtYXgtbGluZS1sZW5ndGhcclxuICAgIC5zb3J0KChhLCBiKSA9PiAobG9hZE9yZGVyW2EuaWRdPy5wb3MgfHwgZ2V0TmV4dFBvcyhhLmlkKSkgLSAobG9hZE9yZGVyW2IuaWRdPy5wb3MgfHwgZ2V0TmV4dFBvcyhiLmlkKSkpXHJcbiAgICAuZm9yRWFjaChrbm93biA9PiB7XHJcbiAgICAgIC8vIElmIHRoaXMgYSBrbm93biBleHRlcm5hbCBtb2R1bGUgYW5kIGlzIE5PVCBpbiB0aGUgaXRlbSBsaXN0IGFscmVhZHlcclxuICAgICAgLy8gIHdlIG5lZWQgdG8gcmUtaW5zZXJ0IGluIHRoZSBjb3JyZWN0IGluZGV4IGFzIGFsbCBrbm93biBleHRlcm5hbCBtb2R1bGVzXHJcbiAgICAgIC8vICBhdCB0aGlzIHBvaW50IGFyZSBhY3R1YWxseSBkZXBsb3llZCBpbnNpZGUgdGhlIG1vZHMgZm9sZGVyIGFuZCBzaG91bGRcclxuICAgICAgLy8gIGJlIGluIHRoZSBpdGVtcyBsaXN0IVxyXG4gICAgICBjb25zdCBkaWZmID0gKExPa2V5cy5sZW5ndGgpIC0gKExPa2V5cy5sZW5ndGggLSBBcnJheS5mcm9tKExPQ0tFRF9NT0RVTEVTKS5sZW5ndGgpO1xyXG4gICAgICBpZiAoaXRlbXMuZmluZChpdGVtID0+IGl0ZW0uaWQgPT09IGtub3duLmlkKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29uc3QgcG9zID0gbG9hZE9yZGVyW2tub3duLmlkXT8ucG9zO1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IChwb3MgIT09IHVuZGVmaW5lZCkgPyAocG9zIC0gZGlmZikgOiAoZ2V0TmV4dFBvcyhrbm93bi5pZCkgLSBkaWZmKTtcclxuICAgICAgICBpdGVtcy5zcGxpY2UoaWR4LCAwLCBrbm93bik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICBjb25zdCB1bmtub3duSXRlbXMgPSBbXS5jb25jYXQodW5rbm93bkV4dClcclxuICAgIC5tYXAoa2V5ID0+ICh7XHJcbiAgICAgIGlkOiBDQUNIRVtrZXldLnZvcnRleElkLFxyXG4gICAgICBuYW1lOiBDQUNIRVtrZXldLnN1Yk1vZE5hbWUsXHJcbiAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGNvbnRleHQsIENBQ0hFW2tleV0udm9ydGV4SWQpLFxyXG4gICAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoa2V5KSxcclxuICAgIH0pKTtcclxuXHJcbiAgY29uc3QgcHJlU29ydGVkID0gW10uY29uY2F0KGxvY2tlZEl0ZW1zLCBpdGVtcywgdW5rbm93bkl0ZW1zKTtcclxuICByZXR1cm4gKGRpcmVjdGlvbiA9PT0gJ2Rlc2NlbmRpbmcnKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkLnJldmVyc2UoKSlcclxuICAgIDogUHJvbWlzZS5yZXNvbHZlKHByZVNvcnRlZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpIHtcclxuICBjb25zdCB0ID0gY29udGV4dC5hcGkudHJhbnNsYXRlO1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLCB7IGlkOiAnbG9hZG9yZGVyaW5mbycgfSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2gyJywge30sIHQoJ01hbmFnaW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdZb3UgY2FuIGFkanVzdCB0aGUgbG9hZCBvcmRlciBmb3IgQmFubmVybG9yZCBieSBkcmFnZ2luZyBhbmQgZHJvcHBpbmcgbW9kcyB1cCBvciBkb3duIG9uIHRoaXMgcGFnZS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdQbGVhc2Uga2VlcCBpbiBtaW5kIHRoYXQgQmFubmVybG9yZCBpcyBzdGlsbCBpbiBFYXJseSBBY2Nlc3MsIHdoaWNoIG1lYW5zIHRoYXQgdGhlcmUgbWlnaHQgYmUgc2lnbmlmaWNhbnQgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdjaGFuZ2VzIHRvIHRoZSBnYW1lIGFzIHRpbWUgZ29lcyBvbi4gUGxlYXNlIG5vdGlmeSB1cyBvZiBhbnkgVm9ydGV4IHJlbGF0ZWQgaXNzdWVzIHlvdSBlbmNvdW50ZXIgd2l0aCB0aGlzICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnZXh0ZW5zaW9uIHNvIHdlIGNhbiBmaXggaXQuIEZvciBtb3JlIGluZm9ybWF0aW9uIGFuZCBoZWxwIHNlZTogJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdhJywgeyBvbkNsaWNrOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL01vZGRpbmdfQmFubmVybG9yZF93aXRoX1ZvcnRleCcpIH0sIHQoJ01vZGRpbmcgQmFubmVybG9yZCB3aXRoIFZvcnRleC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdIb3cgdG8gdXNlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdDaGVjayB0aGUgYm94IG5leHQgdG8gdGhlIG1vZHMgeW91IHdhbnQgdG8gYmUgYWN0aXZlIGluIHRoZSBnYW1lLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdDbGljayBBdXRvIFNvcnQgaW4gdGhlIHRvb2xiYXIuIChTZWUgYmVsb3cgZm9yIGRldGFpbHMpLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdNYWtlIHN1cmUgdG8gcnVuIHRoZSBnYW1lIGRpcmVjdGx5IHZpYSB0aGUgUGxheSBidXR0b24gaW4gdGhlIHRvcCBsZWZ0IGNvcm5lciAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnKG9uIHRoZSBCYW5uZXJsb3JkIHRpbGUpLiBZb3VyIFZvcnRleCBsb2FkIG9yZGVyIG1heSBub3QgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIFNpbmdsZSBQbGF5ZXIgZ2FtZSB0aHJvdWdoIHRoZSBnYW1lIGxhdW5jaGVyLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdPcHRpb25hbDogTWFudWFsbHkgZHJhZyBhbmQgZHJvcCBtb2RzIHRvIGRpZmZlcmVudCBwb3NpdGlvbnMgaW4gdGhlIGxvYWQgb3JkZXIgKGZvciB0ZXN0aW5nIGRpZmZlcmVudCBvdmVycmlkZXMpLiBNb2RzIGZ1cnRoZXIgZG93biB0aGUgbGlzdCBvdmVycmlkZSBtb2RzIGZ1cnRoZXIgdXAuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdQbGVhc2Ugbm90ZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnVGhlIGxvYWQgb3JkZXIgcmVmbGVjdGVkIGhlcmUgd2lsbCBvbmx5IGJlIGxvYWRlZCBpZiB5b3UgcnVuIHRoZSBnYW1lIHZpYSB0aGUgcGxheSBidXR0b24gaW4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3RoZSB0b3AgbGVmdCBjb3JuZXIuIERvIG5vdCBydW4gdGhlIFNpbmdsZSBQbGF5ZXIgZ2FtZSB0aHJvdWdoIHRoZSBsYXVuY2hlciwgYXMgdGhhdCB3aWxsIGlnbm9yZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAndGhlIFZvcnRleCBsb2FkIG9yZGVyIGFuZCBnbyBieSB3aGF0IGlzIHNob3duIGluIHRoZSBsYXVuY2hlciBpbnN0ZWFkLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdGb3IgQmFubmVybG9yZCwgbW9kcyBzb3J0ZWQgZnVydGhlciB0b3dhcmRzIHRoZSBib3R0b20gb2YgdGhlIGxpc3Qgd2lsbCBvdmVycmlkZSBtb2RzIGZ1cnRoZXIgdXAgKGlmIHRoZXkgY29uZmxpY3QpLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnTm90ZTogSGFybW9ueSBwYXRjaGVzIG1heSBiZSB0aGUgZXhjZXB0aW9uIHRvIHRoaXMgcnVsZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQXV0byBTb3J0IHVzZXMgdGhlIFN1Yk1vZHVsZS54bWwgZmlsZXMgKHRoZSBlbnRyaWVzIHVuZGVyIDxEZXBlbmRlZE1vZHVsZXM+KSB0byBkZXRlY3QgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2RlcGVuZGVuY2llcyB0byBzb3J0IGJ5LiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSWYgeW91IGNhbm5vdCBzZWUgeW91ciBtb2QgaW4gdGhpcyBsb2FkIG9yZGVyLCBWb3J0ZXggbWF5IGhhdmUgYmVlbiB1bmFibGUgdG8gZmluZCBvciBwYXJzZSBpdHMgU3ViTW9kdWxlLnhtbCBmaWxlLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnTW9zdCAtIGJ1dCBub3QgYWxsIG1vZHMgLSBjb21lIHdpdGggb3IgbmVlZCBhIFN1Yk1vZHVsZS54bWwgZmlsZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSGl0IHRoZSBkZXBsb3kgYnV0dG9uIHdoZW5ldmVyIHlvdSBpbnN0YWxsIGFuZCBlbmFibGUgYSBuZXcgbW9kLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgZ2FtZSB3aWxsIG5vdCBsYXVuY2ggdW5sZXNzIHRoZSBnYW1lIHN0b3JlIChTdGVhbSwgRXBpYywgZXRjKSBpcyBzdGFydGVkIGJlZm9yZWhhbmQuIElmIHlvdVxcJ3JlIGdldHRpbmcgdGhlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdcIlVuYWJsZSB0byBJbml0aWFsaXplIFN0ZWFtIEFQSVwiIGVycm9yLCByZXN0YXJ0IFN0ZWFtLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdSaWdodCBjbGlja2luZyBhbiBlbnRyeSB3aWxsIG9wZW4gdGhlIGNvbnRleHQgbWVudSB3aGljaCBjYW4gYmUgdXNlZCB0byBsb2NrIExPIGVudHJpZXMgaW50byBwb3NpdGlvbjsgZW50cnkgd2lsbCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnYmUgaWdub3JlZCBieSBhdXRvLXNvcnQgbWFpbnRhaW5pbmcgaXRzIGxvY2tlZCBwb3NpdGlvbi4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSk7XHJcbn1cclxuXHJcbmxldCBfSVNfU09SVElORyA9IGZhbHNlO1xyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQpIHtcclxuICBjb25zdCBtZXRhTWFuYWdlciA9IG5ldyBDb21NZXRhZGF0YU1hbmFnZXIoY29udGV4dC5hcGkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ01vdW50ICYgQmxhZGUgSUk6XFx0QmFubmVybG9yZCcsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiAnLicsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXIpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICBCQU5ORVJMT1JEX0VYRUMsXHJcbiAgICBdLFxyXG4gICAgcGFyYW1ldGVyczogW10sXHJcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTUFQUF9JRC50b1N0cmluZygpLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogU1RFQU1BUFBfSUQsXHJcbiAgICAgIGVwaWNBcHBJZDogRVBJQ0FQUF9JRCxcclxuICAgICAgY3VzdG9tT3Blbk1vZHNQYXRoOiBNT0RVTEVTLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgLy8gUmVnaXN0ZXIgdGhlIExPIHBhZ2UuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlclBhZ2Uoe1xyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgY3JlYXRlSW5mb1BhbmVsOiAocHJvcHMpID0+IHtcclxuICAgICAgcmVmcmVzaEZ1bmMgPSBwcm9wcy5yZWZyZXNoO1xyXG4gICAgICByZXR1cm4gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcyk7XHJcbiAgICB9LFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBwcmVTb3J0OiAoaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSkgPT5cclxuICAgICAgcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlciksXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcikgPT4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIGl0ZW1SZW5kZXJlcjogQ3VzdG9tSXRlbVJlbmRlcmVyLmRlZmF1bHQsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2Jhbm5lcmxvcmRyb290bW9kJywgMjAsIHRlc3RSb290TW9kLCBpbnN0YWxsUm9vdE1vZCk7XHJcblxyXG4gIC8vIEluc3RhbGxzIG9uZSBvciBtb3JlIHN1Ym1vZHVsZXMuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHN1Ym1vZHVsZXMnLCAyNSwgdGVzdEZvclN1Ym1vZHVsZXMsIGluc3RhbGxTdWJNb2R1bGVzKTtcclxuXHJcbiAgLy8gQSB2ZXJ5IHNpbXBsZSBtaWdyYXRpb24gdGhhdCBpbnRlbmRzIHRvIGFkZCB0aGUgc3ViTW9kSWRzIGF0dHJpYnV0ZVxyXG4gIC8vICB0byBtb2RzIHRoYXQgYWN0IGFzIFwibW9kIHBhY2tzXCIuIFRoaXMgbWlncmF0aW9uIGlzIG5vbi1pbnZhc2l2ZSBhbmQgd2lsbFxyXG4gIC8vICBub3QgcmVwb3J0IGFueSBlcnJvcnMuIFNpZGUgZWZmZWN0cyBvZiB0aGUgbWlncmF0aW9uIG5vdCB3b3JraW5nIGNvcnJlY3RseVxyXG4gIC8vICB3aWxsIG5vdCBhZmZlY3QgdGhlIHVzZXIncyBleGlzdGluZyBlbnZpcm9ubWVudC5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDI2KGNvbnRleHQuYXBpLCBvbGQpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZ2VuZXJpYy1sb2FkLW9yZGVyLWljb25zJywgMjAwLFxyXG4gICAgX0lTX1NPUlRJTkcgPyAnc3Bpbm5lcicgOiAnbG9vdC1zb3J0Jywge30sICdBdXRvIFNvcnQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmIChfSVNfU09SVElORykge1xyXG4gICAgICAgIC8vIEFscmVhZHkgc29ydGluZyAtIGRvbid0IGRvIGFueXRoaW5nLlxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgX0lTX1NPUlRJTkcgPSB0cnVlO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKCk7XHJcbiAgICAgICAgQ0FDSEUgPSB7fTtcclxuICAgICAgICBjb25zdCBkZXBsb3llZFN1Yk1vZHVsZXMgPSBhd2FpdCBnZXREZXBsb3llZFN1Yk1vZFBhdGhzKGNvbnRleHQpO1xyXG4gICAgICAgIENBQ0hFID0gYXdhaXQgZ2V0RGVwbG95ZWRNb2REYXRhKGNvbnRleHQsIGRlcGxveWVkU3ViTW9kdWxlcyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlc29sdmUgc3VibW9kdWxlIGZpbGUgZGF0YScsIGVycik7XHJcbiAgICAgICAgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgICAgY29uc3QgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG4gICAgICBjb25zdCBzdWJNb2RJZHMgPSBtb2RJZHMuZmlsdGVyKGlkID0+ICFDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG5cclxuICAgICAgbGV0IHNvcnRlZExvY2tlZCA9IFtdO1xyXG4gICAgICBsZXQgc29ydGVkU3ViTW9kcyA9IFtdO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFByb2JhYmx5IGJlc3QgdGhhdCB3ZSBkb24ndCByZXBvcnQgdGhpcyB2aWEgbm90aWZpY2F0aW9uIGFzIGEgbnVtYmVyXHJcbiAgICAgICAgLy8gIG9mIHRoaW5ncyBtYXkgaGF2ZSBvY2N1cnJlZCB0aGF0IGNhdXNlZCB0aGlzIGlzc3VlLiBXZSBsb2cgaXQgaW5zdGVhZC5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ05vIGFjdGl2ZSBwcm9maWxlJyB9KTtcclxuICAgICAgICBfSVNfU09SVElORyA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgc29ydGVkTG9ja2VkID0gdFNvcnQoeyBzdWJNb2RJZHM6IGxvY2tlZElkcywgYWxsb3dMb2NrZWQ6IHRydWUsIG1ldGFNYW5hZ2VyIH0pO1xyXG4gICAgICAgIHNvcnRlZFN1Yk1vZHMgPSB0U29ydCh7IHN1Yk1vZElkcywgYWxsb3dMb2NrZWQ6IGZhbHNlLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0sIHRydWUpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCBlcnIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbmV3T3JkZXIgPSBbXS5jb25jYXQoc29ydGVkTG9ja2VkLCBzb3J0ZWRTdWJNb2RzKS5yZWR1Y2UoKGFjY3VtLCBpZCwgaWR4KSA9PiB7XHJcbiAgICAgICAgY29uc3Qgdm9ydGV4SWQgPSBDQUNIRVtpZF0udm9ydGV4SWQ7XHJcbiAgICAgICAgY29uc3QgbmV3RW50cnkgPSB7XHJcbiAgICAgICAgICBwb3M6IGlkeCxcclxuICAgICAgICAgIGVuYWJsZWQ6IENBQ0hFW2lkXS5pc09mZmljaWFsXHJcbiAgICAgICAgICAgID8gdHJ1ZVxyXG4gICAgICAgICAgICA6ICghIWxvYWRPcmRlclt2b3J0ZXhJZF0pXHJcbiAgICAgICAgICAgICAgPyBsb2FkT3JkZXJbdm9ydGV4SWRdLmVuYWJsZWRcclxuICAgICAgICAgICAgICA6IHRydWUsXHJcbiAgICAgICAgICBsb2NrZWQ6IChsb2FkT3JkZXJbdm9ydGV4SWRdPy5sb2NrZWQgPT09IHRydWUpLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFjY3VtW3ZvcnRleElkXSA9IG5ld0VudHJ5O1xyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwge30pO1xyXG5cclxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIoYWN0aXZlUHJvZmlsZS5pZCwgbmV3T3JkZXIpKTtcclxuICAgICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIG5ld09yZGVyKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgaWQ6ICdtbmIyLXNvcnQtZmluaXNoZWQnLFxyXG4gICAgICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICAgICAgbWVzc2FnZTogY29udGV4dC5hcGkudHJhbnNsYXRlKCdGaW5pc2hlZCBzb3J0aW5nJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgICAgICBkaXNwbGF5TVM6IDMwMDAsXHJcbiAgICAgICAgfSkpLmZpbmFsbHkoKCkgPT4gX0lTX1NPUlRJTkcgPSBmYWxzZSk7XHJcbiAgfSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCAoZ2FtZU1vZGUpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2Y/LmlkLCBtZXRhTWFuYWdlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcblxyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIChlbnRyeTogeyBmaWxlUGF0aDogc3RyaW5nLCBjYW5kaWRhdGVzOiBzdHJpbmdbXSB9KSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ10sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC5cclxuICAgICAgICAgIC8vICBUaGF0IHdheSwgdm9ydGV4IHdpbGwgY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0XHJcbiAgICAgICAgICAvLyAgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHRhcmdldCBkZXN0aW5hdGlvbiBmaWxlIGlmIGl0IGV4aXN0cy5cclxuICAgICAgICAgIC8vICB0aGlzIGlzIHRvIGNvbXBsZXRlbHkgYXZvaWQgYSBzY2VuYXJpbyB3aGVyZSB3ZSBtYXkgYXR0ZW1wdCB0b1xyXG4gICAgICAgICAgLy8gIGNvcHkgdGhlIHNhbWUgZmlsZSBvbnRvIGl0c2VsZi5cclxuICAgICAgICAgIHJldHVybiBmcy5yZW1vdmVBc3luYyh0YXJnZXRQYXRoKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxuICBnZXRWYWxpZGF0aW9uSW5mbyxcclxufTtcclxuIl19