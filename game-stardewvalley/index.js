"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const bluebird_1 = __importDefault(require("bluebird"));
const react_1 = __importDefault(require("react"));
const semver = __importStar(require("semver"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const winapi = __importStar(require("winapi-bindings"));
const CompatibilityIcon_1 = __importDefault(require("./CompatibilityIcon"));
const constants_1 = require("./constants");
const DependencyManager_1 = __importDefault(require("./DependencyManager"));
const reducers_1 = __importDefault(require("./reducers"));
const smapiProxy_1 = __importDefault(require("./smapiProxy"));
const tests_1 = require("./tests");
const types_1 = require("./types");
const util_1 = require("./util");
const Settings_1 = __importDefault(require("./Settings"));
const actions_1 = require("./actions");
const configMod_1 = require("./configMod");
const path = require('path'), { clipboard } = require('electron'), rjson = require('relaxed-json'), { SevenZip } = vortex_api_1.util, { deploySMAPI, downloadSMAPI, findSMAPIMod } = require('./SMAPI'), { GAME_ID, _SMAPI_BUNDLED_MODS, getBundledMods, MOD_TYPE_CONFIG } = require('./common');
const MANIFEST_FILE = 'manifest.json';
const PTRN_CONTENT = path.sep + 'Content' + path.sep;
const SMAPI_EXE = 'StardewModdingAPI.exe';
const SMAPI_DLL = 'SMAPI.Installer.dll';
const SMAPI_DATA = ['windows-install.dat', 'install.dat'];
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
class StardewValley {
    constructor(context) {
        this.id = GAME_ID;
        this.name = 'Stardew Valley';
        this.logo = 'gameart.jpg';
        this.environment = {
            SteamAPPId: '413150',
        };
        this.details = {
            steamAppId: 413150
        };
        this.supportedTools = [
            {
                id: 'smapi',
                name: 'SMAPI',
                logo: 'smapi.png',
                executable: () => SMAPI_EXE,
                requiredFiles: [SMAPI_EXE],
                shell: true,
                exclusive: true,
                relative: true,
                defaultPrimary: true,
            }
        ];
        this.mergeMods = true;
        this.requiresCleanup = true;
        this.shell = process.platform === 'win32';
        this.queryPath = toBlue(() => __awaiter(this, void 0, void 0, function* () {
            const game = yield vortex_api_1.util.GameStoreHelper.findByAppId(['413150', '1453375253', 'ConcernedApe.StardewValleyPC']);
            if (game)
                return game.gamePath;
            for (const defaultPath of this.defaultPaths) {
                if (yield this.getPathExistsAsync(defaultPath))
                    return defaultPath;
            }
        }));
        this.setup = toBlue((discovery) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.join(discovery.path, (0, util_1.defaultModsRelPath)()));
            }
            catch (err) {
                return Promise.reject(err);
            }
            const smapiPath = path.join(discovery.path, SMAPI_EXE);
            const smapiFound = yield this.getPathExistsAsync(smapiPath);
            if (!smapiFound) {
                this.recommendSmapi();
            }
            const state = this.context.api.getState();
        }));
        this.context = context;
        this.requiredFiles = process.platform == 'win32'
            ? ['Stardew Valley.exe']
            : ['StardewValley', 'StardewValley.exe'];
        this.defaultPaths = [
            process.env.HOME + '/GOG Games/Stardew Valley/game',
            process.env.HOME + '/.local/share/Steam/steamapps/common/Stardew Valley',
            '/Applications/Stardew Valley.app/Contents/MacOS',
            process.env.HOME + '/Library/Application Support/Steam/steamapps/common/Stardew Valley/Contents/MacOS',
            'C:\\Program Files (x86)\\GalaxyClient\\Games\\Stardew Valley',
            'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Stardew Valley',
            'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley'
        ];
    }
    executable() {
        return process.platform == 'win32'
            ? 'Stardew Valley.exe'
            : 'StardewValley';
    }
    queryModPath() {
        return (0, util_1.defaultModsRelPath)();
    }
    recommendSmapi() {
        const smapiMod = findSMAPIMod(this.context.api);
        const title = smapiMod ? 'SMAPI is not deployed' : 'SMAPI is not installed';
        const actionTitle = smapiMod ? 'Deploy' : 'Get SMAPI';
        const action = () => (smapiMod
            ? deploySMAPI(this.context.api)
            : downloadSMAPI(this.context.api))
            .then(() => this.context.api.dismissNotification('smapi-missing'));
        this.context.api.sendNotification({
            id: 'smapi-missing',
            type: 'warning',
            title,
            message: 'SMAPI is required to mod Stardew Valley.',
            actions: [
                {
                    title: actionTitle,
                    action,
                },
            ]
        });
    }
    getPathExistsAsync(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield vortex_api_1.fs.statAsync(path);
                return true;
            }
            catch (err) {
                return false;
            }
        });
    }
    readRegistryKeyAsync(hive, key, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const instPath = winapi.RegGetValue(hive, key, name);
                if (!instPath) {
                    throw new Error('empty registry key');
                }
                return Promise.resolve(instPath.value);
            }
            catch (err) {
                return Promise.resolve(undefined);
            }
        });
    }
}
function testRootFolder(files, gameId) {
    const filtered = files.filter(file => file.endsWith(path.sep))
        .map(file => path.join('fakeDir', file));
    const contentDir = filtered.find(file => file.endsWith(PTRN_CONTENT));
    const supported = ((gameId === GAME_ID)
        && (contentDir !== undefined));
    return bluebird_1.default.resolve({ supported, requiredFiles: [] });
}
function installRootFolder(files, destinationPath) {
    const contentFile = files.find(file => path.join('fakeDir', file).endsWith(PTRN_CONTENT));
    const idx = contentFile.indexOf(PTRN_CONTENT) + 1;
    const rootDir = path.basename(contentFile.substring(0, idx));
    const filtered = files.filter(file => !file.endsWith(path.sep)
        && (file.indexOf(rootDir) !== -1)
        && (path.extname(file) !== '.txt'));
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: file.substr(idx),
        };
    });
    return bluebird_1.default.resolve({ instructions });
}
function isValidManifest(filePath) {
    const segments = filePath.toLowerCase().split(path.sep);
    const isManifestFile = segments[segments.length - 1] === MANIFEST_FILE;
    const isLocale = segments.includes('locale');
    return isManifestFile && !isLocale;
}
function testSupported(files, gameId) {
    const supported = (gameId === GAME_ID)
        && (files.find(isValidManifest) !== undefined)
        && (files.find(file => {
            const testFile = path.join('fakeDir', file);
            return (testFile.endsWith(PTRN_CONTENT));
        }) === undefined);
    return bluebird_1.default.resolve({ supported, requiredFiles: [] });
}
function install(api, dependencyManager, files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const manifestFiles = files.filter(isValidManifest);
        let parseError;
        yield dependencyManager.scanManifests(true);
        let mods = yield Promise.all(manifestFiles.map((manifestFile) => __awaiter(this, void 0, void 0, function* () {
            const rootFolder = path.dirname(manifestFile);
            const rootSegments = rootFolder.toLowerCase().split(path.sep);
            const manifestIndex = manifestFile.toLowerCase().indexOf(MANIFEST_FILE);
            const filterFunc = (file) => {
                const isFile = !file.endsWith(path.sep) && path.extname(path.basename(file)) !== '';
                const fileSegments = file.toLowerCase().split(path.sep);
                const isInRootFolder = (rootSegments.length > 0)
                    ? (fileSegments === null || fileSegments === void 0 ? void 0 : fileSegments[rootSegments.length - 1]) === rootSegments[rootSegments.length - 1]
                    : true;
                return isInRootFolder && isFile;
            };
            try {
                const manifest = yield (0, util_1.parseManifest)(path.join(destinationPath, manifestFile));
                const modFiles = files.filter(filterFunc);
                return {
                    manifest,
                    rootFolder,
                    manifestIndex,
                    modFiles,
                };
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile, error: err.message });
                parseError = err;
                return undefined;
            }
        })));
        mods = mods.filter(x => x !== undefined);
        if (mods.length === 0) {
            api.showErrorNotification('The mod manifest is invalid and can\'t be read. You can try to install the mod anyway via right-click -> "Unpack (as-is)"', parseError, {
                allowReport: false,
            });
        }
        return bluebird_1.default.map(mods, mod => {
            var _a;
            const modName = (mod.rootFolder !== '.')
                ? mod.rootFolder
                : (_a = mod.manifest.Name) !== null && _a !== void 0 ? _a : mod.rootFolder;
            if (modName === undefined) {
                return [];
            }
            const dependencies = mod.manifest.Dependencies || [];
            const instructions = [];
            for (const file of mod.modFiles) {
                const destination = path.join(modName, file.substr(mod.manifestIndex));
                instructions.push({
                    type: 'copy',
                    source: file,
                    destination: destination,
                });
            }
            const addRuleForDependency = (dep) => {
                if ((dep.UniqueID === undefined)
                    || (dep.UniqueID.toLowerCase() === 'yourname.yourotherspacksandmods')) {
                    return;
                }
                const versionMatch = dep.MinimumVersion !== undefined
                    ? `>=${dep.MinimumVersion}`
                    : '*';
                const rule = {
                    type: 'recommends',
                    reference: {
                        logicalFileName: dep.UniqueID.toLowerCase(),
                        versionMatch,
                    },
                    extra: {
                        onlyIfFulfillable: true,
                        automatic: true,
                    },
                };
                instructions.push({
                    type: 'rule',
                    rule,
                });
            };
            return instructions;
        })
            .then(data => {
            const instructions = [].concat(data).reduce((accum, iter) => accum.concat(iter), []);
            return Promise.resolve({ instructions });
        });
    });
}
function isSMAPIModType(instructions) {
    const smapiData = instructions.find(inst => (inst.type === 'copy') && inst.source.endsWith(SMAPI_EXE));
    return bluebird_1.default.resolve(smapiData !== undefined);
}
function testSMAPI(files, gameId) {
    const supported = (gameId === GAME_ID) && (files.find(file => path.basename(file) === SMAPI_DLL) !== undefined);
    return bluebird_1.default.resolve({
        supported,
        requiredFiles: [],
    });
}
function installSMAPI(getDiscoveryPath, files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = process.platform === 'win32'
            ? 'windows'
            : process.platform === 'linux'
                ? 'linux'
                : 'macos';
        const fileHasCorrectPlatform = (file) => {
            const segments = file.split(path.sep).map(seg => seg.toLowerCase());
            return (segments.includes(folder));
        };
        const dataFile = files.find(file => {
            const isCorrectPlatform = fileHasCorrectPlatform(file);
            return isCorrectPlatform && SMAPI_DATA.includes(path.basename(file).toLowerCase());
        });
        if (dataFile === undefined) {
            return Promise.reject(new vortex_api_1.util.DataInvalid('Failed to find the SMAPI data files - download appears '
                + 'to be corrupted; please re-download SMAPI and try again'));
        }
        let data = '';
        try {
            data = yield vortex_api_1.fs.readFileAsync(path.join(getDiscoveryPath(), 'Stardew Valley.deps.json'), { encoding: 'utf8' });
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to parse SDV dependencies', err);
        }
        const updatedFiles = [];
        const szip = new SevenZip();
        yield szip.extractFull(path.join(destinationPath, dataFile), destinationPath);
        yield vortex_api_1.util.walk(destinationPath, (iter, stats) => {
            const relPath = path.relative(destinationPath, iter);
            if (!files.includes(relPath) && stats.isFile() && !files.includes(relPath + path.sep))
                updatedFiles.push(relPath);
            const segments = relPath.toLocaleLowerCase().split(path.sep);
            const modsFolderIdx = segments.indexOf('mods');
            if ((modsFolderIdx !== -1) && (segments.length > modsFolderIdx + 1)) {
                _SMAPI_BUNDLED_MODS.push(segments[modsFolderIdx + 1]);
            }
            return bluebird_1.default.resolve();
        });
        const smapiExe = updatedFiles.find(file => file.toLowerCase().endsWith(SMAPI_EXE.toLowerCase()));
        if (smapiExe === undefined) {
            return Promise.reject(new vortex_api_1.util.DataInvalid(`Failed to extract ${SMAPI_EXE} - download appears `
                + 'to be corrupted; please re-download SMAPI and try again'));
        }
        const idx = smapiExe.indexOf(path.basename(smapiExe));
        const instructions = updatedFiles.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: path.join(file.substr(idx)),
            };
        });
        instructions.push({
            type: 'attribute',
            key: 'smapiBundledMods',
            value: getBundledMods(),
        });
        instructions.push({
            type: 'generatefile',
            data,
            destination: 'StardewModdingAPI.deps.json',
        });
        return Promise.resolve({ instructions });
    });
}
function showSMAPILog(api, basePath, logFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const logData = yield vortex_api_1.fs.readFileAsync(path.join(basePath, logFile), { encoding: 'utf-8' });
        yield api.showDialog('info', 'SMAPI Log', {
            text: 'Your SMAPI log is displayed below. To share it, click "Copy & Share" which will copy it to your clipboard and open the SMAPI log sharing website. ' +
                'Next, paste your code into the text box and press "save & parse log". You can now share a link to this page with others so they can see your log file.\n\n' + logData
        }, [{
                label: 'Copy & Share log', action: () => {
                    const timestamp = new Date().toISOString().replace(/^.+T([^\.]+).+/, '$1');
                    clipboard.writeText(`[${timestamp} INFO Vortex] Log exported by Vortex ${vortex_api_1.util.getApplication().version}.\n` + logData);
                    return vortex_api_1.util.opn('https://smapi.io/log').catch(err => undefined);
                }
            }, { label: 'Close', action: () => undefined }]);
    });
}
function onShowSMAPILog(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const basePath = path.join(vortex_api_1.util.getVortexPath('appData'), 'stardewvalley', 'errorlogs');
        try {
            yield showSMAPILog(api, basePath, "SMAPI-crash.txt");
        }
        catch (err) {
            try {
                yield showSMAPILog(api, basePath, "SMAPI-latest.txt");
            }
            catch (err) {
                api.sendNotification({ type: 'info', title: 'No SMAPI logs found.', message: '', displayMS: 5000 });
            }
        }
    });
}
function getModManifests(modPath) {
    const manifests = [];
    if (modPath === undefined) {
        return Promise.resolve([]);
    }
    return (0, turbowalk_1.default)(modPath, (entries) => __awaiter(this, void 0, void 0, function* () {
        for (const entry of entries) {
            if (path.basename(entry.filePath) === 'manifest.json') {
                manifests.push(entry.filePath);
            }
        }
    }), { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
        .then(() => manifests);
}
function updateConflictInfo(api, smapi, gameId, modId) {
    var _a, _b, _c, _d, _e;
    const mod = api.getState().persistent.mods[gameId][modId];
    if (mod === undefined) {
        return Promise.resolve();
    }
    const now = Date.now();
    if ((now - ((_b = (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.lastSMAPIQuery) !== null && _b !== void 0 ? _b : 0)) < constants_1.SMAPI_QUERY_FREQUENCY) {
        return Promise.resolve();
    }
    let additionalLogicalFileNames = (_c = mod.attributes) === null || _c === void 0 ? void 0 : _c.additionalLogicalFileNames;
    if (!additionalLogicalFileNames) {
        if ((_d = mod.attributes) === null || _d === void 0 ? void 0 : _d.logicalFileName) {
            additionalLogicalFileNames = [(_e = mod.attributes) === null || _e === void 0 ? void 0 : _e.logicalFileName];
        }
        else {
            additionalLogicalFileNames = [];
        }
    }
    const query = additionalLogicalFileNames
        .map(name => {
        var _a, _b, _c, _d;
        const res = {
            id: name,
        };
        const ver = (_b = (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.manifestVersion) !== null && _b !== void 0 ? _b : (_d = semver.coerce((_c = mod.attributes) === null || _c === void 0 ? void 0 : _c.version)) === null || _d === void 0 ? void 0 : _d.version;
        if (!!ver) {
            res['installedVersion'] = ver;
        }
        return res;
    });
    const stat = (item) => {
        var _a, _b, _c;
        const status = (_c = (_b = (_a = item.metadata) === null || _a === void 0 ? void 0 : _a.compatibilityStatus) === null || _b === void 0 ? void 0 : _b.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(_b);
        if (!types_1.compatibilityOptions.includes(status)) {
            return 'unknown';
        }
        else {
            return status;
        }
    };
    const compatibilityPrio = (item) => types_1.compatibilityOptions.indexOf(stat(item));
    return smapi.findByNames(query)
        .then(results => {
        var _a;
        const worstStatus = results
            .sort((lhs, rhs) => compatibilityPrio(lhs) - compatibilityPrio(rhs));
        if (worstStatus.length > 0) {
            api.store.dispatch(vortex_api_1.actions.setModAttributes(gameId, modId, {
                lastSMAPIQuery: now,
                compatibilityStatus: worstStatus[0].metadata.compatibilityStatus,
                compatibilityMessage: worstStatus[0].metadata.compatibilitySummary,
                compatibilityUpdate: (_a = worstStatus[0].suggestedUpdate) === null || _a === void 0 ? void 0 : _a.version,
            }));
        }
        else {
            (0, vortex_api_1.log)('debug', 'no manifest');
            api.store.dispatch(vortex_api_1.actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
        }
    })
        .catch(err => {
        (0, vortex_api_1.log)('warn', 'error reading manifest', err.message);
        api.store.dispatch(vortex_api_1.actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
    });
}
function init(context) {
    let dependencyManager;
    const getDiscoveryPath = () => {
        const state = context.api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
        if ((discovery === undefined) || (discovery.path === undefined)) {
            (0, vortex_api_1.log)('error', 'stardewvalley was not discovered');
            return undefined;
        }
        return discovery.path;
    };
    const getSMAPIPath = (game) => {
        const state = context.api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return discovery.path;
    };
    const manifestExtractor = toBlue((modInfo, modPath) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (vortex_api_1.selectors.activeGameId(context.api.getState()) !== GAME_ID) {
            return Promise.resolve({});
        }
        const manifests = yield getModManifests(modPath);
        const parsedManifests = (yield Promise.all(manifests.map((manifest) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, util_1.parseManifest)(manifest);
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile: manifest, error: err.message });
                return undefined;
            }
        })))).filter(manifest => manifest !== undefined);
        if (parsedManifests.length === 0) {
            return Promise.resolve({});
        }
        const refManifest = parsedManifests[0];
        const additionalLogicalFileNames = parsedManifests
            .filter(manifest => manifest.UniqueID !== undefined)
            .map(manifest => manifest.UniqueID.toLowerCase());
        const minSMAPIVersion = parsedManifests
            .map(manifest => manifest.MinimumApiVersion)
            .filter(version => semver.valid(version))
            .sort((lhs, rhs) => semver.compare(rhs, lhs))[0];
        const result = {
            additionalLogicalFileNames,
            minSMAPIVersion,
        };
        if (refManifest !== undefined) {
            if (((_c = (_b = (_a = modInfo.download.modInfo) === null || _a === void 0 ? void 0 : _a.nexus) === null || _b === void 0 ? void 0 : _b.ids) === null || _c === void 0 ? void 0 : _c.modId) !== 2400) {
                result['customFileName'] = refManifest.Name;
            }
            if (typeof (refManifest.Version) === 'string') {
                result['manifestVersion'] = refManifest.Version;
            }
        }
        return Promise.resolve(result);
    }));
    context.registerGame(new StardewValley(context));
    context.registerReducer(['settings', 'SDV'], reducers_1.default);
    context.registerSettings('Mods', Settings_1.default, () => ({
        onMergeConfigToggle: (profileId, enabled) => __awaiter(this, void 0, void 0, function* () {
            if (!enabled) {
                yield (0, configMod_1.onRevertFiles)(context.api, profileId);
                context.api.sendNotification({ type: 'info', message: 'Mod configs returned to their respective mods', displayMS: 5000 });
            }
            context.api.store.dispatch((0, actions_1.setMergeConfigs)(profileId, enabled));
            return Promise.resolve();
        })
    }), () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID, 150);
    context.registerInstaller('smapi-installer', 30, testSMAPI, (files, dest) => bluebird_1.default.resolve(installSMAPI(getDiscoveryPath, files, dest)));
    context.registerInstaller('sdvrootfolder', 50, testRootFolder, installRootFolder);
    context.registerInstaller('stardew-valley-installer', 50, testSupported, (files, destinationPath) => bluebird_1.default.resolve(install(context.api, dependencyManager, files, destinationPath)));
    context.registerModType('SMAPI', 30, gameId => gameId === GAME_ID, getSMAPIPath, isSMAPIModType);
    context.registerModType(MOD_TYPE_CONFIG, 30, (gameId) => (gameId === GAME_ID), () => path.join(getDiscoveryPath(), (0, util_1.defaultModsRelPath)()), () => bluebird_1.default.resolve(false));
    context.registerModType('sdvrootfolder', 25, (gameId) => (gameId === GAME_ID), () => getDiscoveryPath(), (instructions) => {
        const copyInstructions = instructions.filter(instr => instr.type === 'copy');
        const hasManifest = copyInstructions.find(instr => instr.destination.endsWith(MANIFEST_FILE));
        const hasModsFolder = copyInstructions.find(instr => instr.destination.startsWith((0, util_1.defaultModsRelPath)() + path.sep)) !== undefined;
        const hasContentFolder = copyInstructions.find(instr => instr.destination.startsWith('Content' + path.sep)) !== undefined;
        return (hasManifest)
            ? bluebird_1.default.resolve(hasContentFolder && hasModsFolder)
            : bluebird_1.default.resolve(hasContentFolder);
    });
    (0, configMod_1.registerConfigMod)(context);
    context.registerAction('mod-icons', 999, 'changelog', {}, 'SMAPI Log', () => { onShowSMAPILog(context.api); }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === GAME_ID);
    });
    context.registerAttributeExtractor(25, manifestExtractor);
    context.registerTableAttribute('mods', {
        id: 'sdv-compatibility',
        position: 100,
        condition: () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID,
        placement: 'table',
        calc: (mod) => { var _a; return (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.compatibilityStatus; },
        customRenderer: (mod, detailCell, t) => {
            return react_1.default.createElement(CompatibilityIcon_1.default, { t, mod, detailCell }, []);
        },
        name: 'Compatibility',
        isDefaultVisible: true,
        edit: {},
    });
    context.registerTest('sdv-incompatible-mods', 'gamemode-activated', () => bluebird_1.default.resolve((0, tests_1.testSMAPIOutdated)(context.api, dependencyManager)));
    context.once(() => {
        const proxy = new smapiProxy_1.default(context.api);
        context.api.setStylesheet('sdv', path.join(__dirname, 'sdvstyle.scss'));
        context.api.addMetaServer('smapi.io', {
            url: '',
            loopbackCB: (query) => {
                return bluebird_1.default.resolve(proxy.find(query))
                    .catch(err => {
                    (0, vortex_api_1.log)('error', 'failed to look up smapi meta info', err.message);
                    return bluebird_1.default.resolve([]);
                });
            },
            cacheDurationSec: 86400,
            priority: 25,
        });
        dependencyManager = new DependencyManager_1.default(context.api);
        context.api.onAsync('added-files', (profileId, files) => (0, configMod_1.onAddedFiles)(context.api, profileId, files));
        context.api.onAsync('will-enable-mods', (profileId, modIds, enabled, options) => (0, configMod_1.onWillEnableMods)(context.api, profileId, modIds, enabled, options));
        context.api.onAsync('did-deploy', (profileId) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== GAME_ID) {
                return Promise.resolve();
            }
            const smapiMod = findSMAPIMod(context.api);
            const primaryTool = vortex_api_1.util.getSafe(state, ['settings', 'interface', 'primaryTool', GAME_ID], undefined);
            if (smapiMod && primaryTool === undefined) {
                context.api.store.dispatch(vortex_api_1.actions.setPrimaryTool(GAME_ID, 'smapi'));
            }
            return Promise.resolve();
        }));
        context.api.onAsync('did-purge', (profileId) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== GAME_ID) {
                return Promise.resolve();
            }
            const smapiMod = findSMAPIMod(context.api);
            const primaryTool = vortex_api_1.util.getSafe(state, ['settings', 'interface', 'primaryTool', GAME_ID], undefined);
            if (smapiMod && primaryTool === 'smapi') {
                context.api.store.dispatch(vortex_api_1.actions.setPrimaryTool(GAME_ID, undefined));
            }
            return Promise.resolve();
        }));
        context.api.events.on('did-install-mod', (gameId, archiveId, modId) => {
            if (gameId !== GAME_ID) {
                return;
            }
            updateConflictInfo(context.api, proxy, gameId, modId)
                .then(() => (0, vortex_api_1.log)('debug', 'added compatibility info', { modId }))
                .catch(err => (0, vortex_api_1.log)('error', 'failed to add compatibility info', { modId, error: err.message }));
        });
        context.api.events.on('gamemode-activated', (gameMode) => {
            var _a;
            if (gameMode !== GAME_ID) {
                return;
            }
            const state = context.api.getState();
            (0, vortex_api_1.log)('debug', 'updating SDV compatibility info');
            Promise.all(Object.keys((_a = state.persistent.mods[gameMode]) !== null && _a !== void 0 ? _a : {}).map(modId => updateConflictInfo(context.api, proxy, gameMode, modId)))
                .then(() => {
                (0, vortex_api_1.log)('debug', 'done updating compatibility info');
            })
                .catch(err => {
                (0, vortex_api_1.log)('error', 'failed to update conflict info', err.message);
            });
        });
    });
}
exports.default = init;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUVoQyxrREFBMEI7QUFDMUIsK0NBQWlDO0FBQ2pDLDBEQUFrQztBQUNsQywyQ0FBc0U7QUFDdEUsd0RBQTBDO0FBQzFDLDRFQUFvRDtBQUNwRCwyQ0FBb0Q7QUFFcEQsNEVBQW9EO0FBQ3BELDBEQUFxQztBQUNyQyw4REFBc0M7QUFDdEMsbUNBQTRDO0FBQzVDLG1DQUFtSDtBQUNuSCxpQ0FBMkQ7QUFFM0QsMERBQWtDO0FBRWxDLHVDQUE0QztBQUU1QywyQ0FBK0Y7QUFFL0YsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUMxQixFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDbkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFDL0IsRUFBRSxRQUFRLEVBQUUsR0FBRyxpQkFBSSxFQUNuQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUNqRSxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRTFGLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQztBQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ3JELE1BQU0sU0FBUyxHQUFHLHVCQUF1QixDQUFDO0FBQzFDLE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLENBQUMscUJBQXFCLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFHMUQsU0FBUyxNQUFN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O1lBQ1QsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO1lBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQ0FBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDekUsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQ3hELElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ1gsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHV0aWwsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5pbXBvcnQgQ29tcGF0aWJpbGl0eUljb24gZnJvbSAnLi9Db21wYXRpYmlsaXR5SWNvbic7XHJcbmltcG9ydCB7IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcclxuaW1wb3J0IHNkdlJlZHVjZXJzIGZyb20gJy4vcmVkdWNlcnMnO1xyXG5pbXBvcnQgU01BUElQcm94eSBmcm9tICcuL3NtYXBpUHJveHknO1xyXG5pbXBvcnQgeyB0ZXN0U01BUElPdXRkYXRlZCB9IGZyb20gJy4vdGVzdHMnO1xyXG5pbXBvcnQgeyBjb21wYXRpYmlsaXR5T3B0aW9ucywgQ29tcGF0aWJpbGl0eVN0YXR1cywgSVNEVkRlcGVuZGVuY3ksIElTRFZNb2RNYW5pZmVzdCwgSVNNQVBJUmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QsIGRlZmF1bHRNb2RzUmVsUGF0aCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQgU2V0dGluZ3MgZnJvbSAnLi9TZXR0aW5ncyc7XHJcblxyXG5pbXBvcnQgeyBzZXRNZXJnZUNvbmZpZ3MgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgb25BZGRlZEZpbGVzLCBvblJldmVydEZpbGVzLCBvbldpbGxFbmFibGVNb2RzLCByZWdpc3RlckNvbmZpZ01vZCB9IGZyb20gJy4vY29uZmlnTW9kJztcclxuXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyksXHJcbiAgeyBjbGlwYm9hcmQgfSA9IHJlcXVpcmUoJ2VsZWN0cm9uJyksXHJcbiAgcmpzb24gPSByZXF1aXJlKCdyZWxheGVkLWpzb24nKSxcclxuICB7IFNldmVuWmlwIH0gPSB1dGlsLFxyXG4gIHsgZGVwbG95U01BUEksIGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9ID0gcmVxdWlyZSgnLi9TTUFQSScpLFxyXG4gIHsgR0FNRV9JRCwgX1NNQVBJX0JVTkRMRURfTU9EUywgZ2V0QnVuZGxlZE1vZHMsIE1PRF9UWVBFX0NPTkZJRyB9ID0gcmVxdWlyZSgnLi9jb21tb24nKTtcclxuXHJcbmNvbnN0IE1BTklGRVNUX0ZJTEUgPSAnbWFuaWZlc3QuanNvbic7XHJcbmNvbnN0IFBUUk5fQ09OVEVOVCA9IHBhdGguc2VwICsgJ0NvbnRlbnQnICsgcGF0aC5zZXA7XHJcbmNvbnN0IFNNQVBJX0VYRSA9ICdTdGFyZGV3TW9kZGluZ0FQSS5leGUnO1xyXG5jb25zdCBTTUFQSV9ETEwgPSAnU01BUEkuSW5zdGFsbGVyLmRsbCc7XHJcbmNvbnN0IFNNQVBJX0RBVEEgPSBbJ3dpbmRvd3MtaW5zdGFsbC5kYXQnLCAnaW5zdGFsbC5kYXQnXTtcclxuXHJcblxyXG5mdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuY2xhc3MgU3RhcmRld1ZhbGxleSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcclxuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XHJcbiAgcHVibGljIGlkOiBzdHJpbmcgPSBHQU1FX0lEO1xyXG4gIHB1YmxpYyBuYW1lOiBzdHJpbmcgPSAnU3RhcmRldyBWYWxsZXknO1xyXG4gIHB1YmxpYyBsb2dvOiBzdHJpbmcgPSAnZ2FtZWFydC5qcGcnO1xyXG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgZW52aXJvbm1lbnQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XHJcbiAgICBTdGVhbUFQUElkOiAnNDEzMTUwJyxcclxuICB9O1xyXG4gIHB1YmxpYyBkZXRhaWxzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xyXG4gICAgc3RlYW1BcHBJZDogNDEzMTUwXHJcbiAgfTtcclxuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogJ3NtYXBpJyxcclxuICAgICAgbmFtZTogJ1NNQVBJJyxcclxuICAgICAgbG9nbzogJ3NtYXBpLnBuZycsXHJcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+IFNNQVBJX0VYRSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW1NNQVBJX0VYRV0sXHJcbiAgICAgIHNoZWxsOiB0cnVlLFxyXG4gICAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICBkZWZhdWx0UHJpbWFyeTogdHJ1ZSxcclxuICAgIH1cclxuICBdO1xyXG4gIHB1YmxpYyBtZXJnZU1vZHM6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyByZXF1aXJlc0NsZWFudXA6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyBzaGVsbDogYm9vbGVhbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XHJcbiAgcHVibGljIGRlZmF1bHRQYXRoczogc3RyaW5nW107XHJcblxyXG4gIC8qKioqKioqKipcclxuICAqKiBWb3J0ZXggQVBJXHJcbiAgKioqKioqKioqL1xyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdCBhbiBpbnN0YW5jZS5cclxuICAgKiBAcGFyYW0ge0lFeHRlbnNpb25Db250ZXh0fSBjb250ZXh0IC0tIFRoZSBWb3J0ZXggZXh0ZW5zaW9uIGNvbnRleHQuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICAgIC8vIHByb3BlcnRpZXMgdXNlZCBieSBWb3J0ZXhcclxuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICB0aGlzLnJlcXVpcmVkRmlsZXMgPSBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyBbJ1N0YXJkZXcgVmFsbGV5LmV4ZSddXHJcbiAgICAgIDogWydTdGFyZGV3VmFsbGV5JywgJ1N0YXJkZXdWYWxsZXkuZXhlJ107XHJcblxyXG4gICAgLy8gY3VzdG9tIHByb3BlcnRpZXNcclxuICAgIHRoaXMuZGVmYXVsdFBhdGhzID0gW1xyXG4gICAgICAvLyBMaW51eFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9HT0cgR2FtZXMvU3RhcmRldyBWYWxsZXkvZ2FtZScsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnLy5sb2NhbC9zaGFyZS9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5JyxcclxuXHJcbiAgICAgIC8vIE1hY1xyXG4gICAgICAnL0FwcGxpY2F0aW9ucy9TdGFyZGV3IFZhbGxleS5hcHAvQ29udGVudHMvTWFjT1MnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnQvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleS9Db250ZW50cy9NYWNPUycsXHJcblxyXG4gICAgICAvLyBXaW5kb3dzXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdhbGF4eUNsaWVudFxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdPRyBHYWxheHlcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxTdGVhbVxcXFxzdGVhbWFwcHNcXFxcY29tbW9uXFxcXFN0YXJkZXcgVmFsbGV5J1xyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGZpbmQgdGhlIGdhbWUgaW5zdGFsbCBwYXRoLlxyXG4gICAqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHF1aWNrbHkgYW5kLCBpZiBpdCByZXR1cm5zIGEgdmFsdWUsIGl0IHNob3VsZCBkZWZpbml0aXZlbHkgYmUgdGhlXHJcbiAgICogdmFsaWQgZ2FtZSBwYXRoLiBVc3VhbGx5IHRoaXMgZnVuY3Rpb24gd2lsbCBxdWVyeSB0aGUgcGF0aCBmcm9tIHRoZSByZWdpc3RyeSBvciBmcm9tIHN0ZWFtLlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gbWF5IHJldHVybiBhIHByb21pc2UgYW5kIGl0IHNob3VsZCBkbyB0aGF0IGlmIGl0J3MgZG9pbmcgSS9PLlxyXG4gICAqXHJcbiAgICogVGhpcyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgYnV0IHRoZW4gdGhlIHRvb2wvZ2FtZSBjYW4gb25seSBiZSBkaXNjb3ZlcmVkIGJ5IHNlYXJjaGluZyB0aGUgZGlza1xyXG4gICAqIHdoaWNoIGlzIHNsb3cgYW5kIG9ubHkgaGFwcGVucyBtYW51YWxseS5cclxuICAgKi9cclxuICBwdWJsaWMgcXVlcnlQYXRoID0gdG9CbHVlKGFzeW5jICgpID0+IHtcclxuICAgIC8vIGNoZWNrIFN0ZWFtXHJcbiAgICBjb25zdCBnYW1lID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoWyc0MTMxNTAnLCAnMTQ1MzM3NTI1MycsICdDb25jZXJuZWRBcGUuU3RhcmRld1ZhbGxleVBDJ10pO1xyXG4gICAgaWYgKGdhbWUpXHJcbiAgICAgIHJldHVybiBnYW1lLmdhbWVQYXRoO1xyXG5cclxuICAgIC8vIGNoZWNrIGRlZmF1bHQgcGF0aHNcclxuICAgIGZvciAoY29uc3QgZGVmYXVsdFBhdGggb2YgdGhpcy5kZWZhdWx0UGF0aHMpXHJcbiAgICB7XHJcbiAgICAgIGlmIChhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhkZWZhdWx0UGF0aCkpXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRQYXRoO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHBhdGggb2YgdGhlIHRvb2wgZXhlY3V0YWJsZSByZWxhdGl2ZSB0byB0aGUgdG9vbCBiYXNlIHBhdGgsIGkuZS4gYmluYXJpZXMvVVQzLmV4ZSBvclxyXG4gICAqIFRFU1YuZXhlLiBUaGlzIGlzIGEgZnVuY3Rpb24gc28gdGhhdCB5b3UgY2FuIHJldHVybiBkaWZmZXJlbnQgdGhpbmdzIGJhc2VkIG9uIHRoZSBvcGVyYXRpbmdcclxuICAgKiBzeXN0ZW0gZm9yIGV4YW1wbGUgYnV0IGJlIGF3YXJlIHRoYXQgaXQgd2lsbCBiZSBldmFsdWF0ZWQgYXQgYXBwbGljYXRpb24gc3RhcnQgYW5kIG9ubHkgb25jZSxcclxuICAgKiBzbyB0aGUgcmV0dXJuIHZhbHVlIGNhbiBub3QgZGVwZW5kIG9uIHRoaW5ncyB0aGF0IGNoYW5nZSBhdCBydW50aW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBleGVjdXRhYmxlKCkge1xyXG4gICAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xyXG4gICAgICA/ICdTdGFyZGV3IFZhbGxleS5leGUnXHJcbiAgICAgIDogJ1N0YXJkZXdWYWxsZXknO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBkZWZhdWx0IGRpcmVjdG9yeSB3aGVyZSBtb2RzIGZvciB0aGlzIGdhbWUgc2hvdWxkIGJlIHN0b3JlZC5cclxuICAgKiBcclxuICAgKiBJZiB0aGlzIHJldHVybnMgYSByZWxhdGl2ZSBwYXRoIHRoZW4gdGhlIHBhdGggaXMgdHJlYXRlZCBhcyByZWxhdGl2ZSB0byB0aGUgZ2FtZSBpbnN0YWxsYXRpb25cclxuICAgKiBkaXJlY3RvcnkuIFNpbXBseSByZXR1cm4gYSBkb3QgKCAoKSA9PiAnLicgKSBpZiBtb2RzIGFyZSBpbnN0YWxsZWQgZGlyZWN0bHkgaW50byB0aGUgZ2FtZVxyXG4gICAqIGRpcmVjdG9yeS5cclxuICAgKi8gXHJcbiAgcHVibGljIHF1ZXJ5TW9kUGF0aCgpXHJcbiAge1xyXG4gICAgcmV0dXJuIGRlZmF1bHRNb2RzUmVsUGF0aCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3B0aW9uYWwgc2V0dXAgZnVuY3Rpb24uIElmIHRoaXMgZ2FtZSByZXF1aXJlcyBzb21lIGZvcm0gb2Ygc2V0dXAgYmVmb3JlIGl0IGNhbiBiZSBtb2RkZWQgKGxpa2VcclxuICAgKiBjcmVhdGluZyBhIGRpcmVjdG9yeSwgY2hhbmdpbmcgYSByZWdpc3RyeSBrZXksIC4uLikgZG8gaXQgaGVyZS4gSXQgd2lsbCBiZSBjYWxsZWQgZXZlcnkgdGltZVxyXG4gICAqIGJlZm9yZSB0aGUgZ2FtZSBtb2RlIGlzIGFjdGl2YXRlZC5cclxuICAgKiBAcGFyYW0ge0lEaXNjb3ZlcnlSZXN1bHR9IGRpc2NvdmVyeSAtLSBiYXNpYyBpbmZvIGFib3V0IHRoZSBnYW1lIGJlaW5nIGxvYWRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0dXAgPSB0b0JsdWUoYXN5bmMgKGRpc2NvdmVyeSkgPT4ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBmb2xkZXIgZm9yIFNNQVBJIG1vZHMgZXhpc3RzLlxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCgpKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBza2lwIGlmIFNNQVBJIGZvdW5kXHJcbiAgICBjb25zdCBzbWFwaVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIFNNQVBJX0VYRSk7XHJcbiAgICBjb25zdCBzbWFwaUZvdW5kID0gYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoc21hcGlQYXRoKTtcclxuICAgIGlmICghc21hcGlGb3VuZCkge1xyXG4gICAgICB0aGlzLnJlY29tbWVuZFNtYXBpKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5jb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG5cclxuICAgIC8qXHJcbiAgICBpZiAoc3RhdGUuc2V0dGluZ3NbJ1NEViddLnVzZVJlY29tbWVuZGF0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2hvdyBSZWNvbW1lbmRhdGlvbnM/Jywge1xyXG4gICAgICAgIHRleHQ6ICdWb3J0ZXggY2FuIG9wdGlvbmFsbHkgdXNlIGRhdGEgZnJvbSBTTUFQSVxcJ3MgZGF0YWJhc2UgYW5kICdcclxuICAgICAgICAgICAgKyAndGhlIG1hbmlmZXN0IGZpbGVzIGluY2x1ZGVkIHdpdGggbW9kcyB0byByZWNvbW1lbmQgYWRkaXRpb25hbCAnXHJcbiAgICAgICAgICAgICsgJ2NvbXBhdGlibGUgbW9kcyB0aGF0IHdvcmsgd2l0aCB0aG9zZSB0aGF0IHlvdSBoYXZlIGluc3RhbGxlZC4gJ1xyXG4gICAgICAgICAgICArICdJbiBzb21lIGNhc2VzLCB0aGlzIGluZm9ybWF0aW9uIGNvdWxkIGJlIHdyb25nIG9yIGluY29tcGxldGUgJ1xyXG4gICAgICAgICAgICArICd3aGljaCBtYXkgbGVhZCB0byB1bnJlbGlhYmxlIHByb21wdHMgc2hvd2luZyBpbiB0aGUgYXBwLlxcbidcclxuICAgICAgICAgICAgKyAnQWxsIHJlY29tbWVuZGF0aW9ucyBzaG93biBzaG91bGQgYmUgY2FyZWZ1bGx5IGNvbnNpZGVyZWQgJ1xyXG4gICAgICAgICAgICArICdiZWZvcmUgYWNjZXB0aW5nIHRoZW0gLSBpZiB5b3UgYXJlIHVuc3VyZSBwbGVhc2UgY2hlY2sgdGhlICdcclxuICAgICAgICAgICAgKyAnbW9kIHBhZ2UgdG8gc2VlIGlmIHRoZSBhdXRob3IgaGFzIHByb3ZpZGVkIGFueSBmdXJ0aGVyIGluc3RydWN0aW9ucy4gJ1xyXG4gICAgICAgICAgICArICdXb3VsZCB5b3UgbGlrZSB0byBlbmFibGUgdGhpcyBmZWF0dXJlPyBZb3UgY2FuIHVwZGF0ZSB5b3VyIGNob2ljZSAnXHJcbiAgICAgICAgICAgICsgJ2Zyb20gdGhlIFNldHRpbmdzIG1lbnUgYXQgYW55IHRpbWUuJ1xyXG4gICAgICB9LCBbXHJcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlIHdpdGhvdXQgcmVjb21tZW5kYXRpb25zJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFJlY29tbWVuZGF0aW9ucyhmYWxzZSkpO1xyXG4gICAgICAgIH0gfSxcclxuICAgICAgICB7IGxhYmVsOiAnRW5hYmxlIHJlY29tbWVuZGF0aW9ucycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRSZWNvbW1lbmRhdGlvbnModHJ1ZSkpO1xyXG4gICAgICAgIH0gfSxcclxuICAgICAgXSlcclxuICAgIH0qL1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgcHJpdmF0ZSByZWNvbW1lbmRTbWFwaSgpIHtcclxuICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKHRoaXMuY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgdGl0bGUgPSBzbWFwaU1vZCA/ICdTTUFQSSBpcyBub3QgZGVwbG95ZWQnIDogJ1NNQVBJIGlzIG5vdCBpbnN0YWxsZWQnO1xyXG4gICAgY29uc3QgYWN0aW9uVGl0bGUgPSBzbWFwaU1vZCA/ICdEZXBsb3knIDogJ0dldCBTTUFQSSc7XHJcbiAgICBjb25zdCBhY3Rpb24gPSAoKSA9PiAoc21hcGlNb2RcclxuICAgICAgPyBkZXBsb3lTTUFQSSh0aGlzLmNvbnRleHQuYXBpKVxyXG4gICAgICA6IGRvd25sb2FkU01BUEkodGhpcy5jb250ZXh0LmFwaSkpXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpKTtcclxuXHJcbiAgICB0aGlzLmNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ3NtYXBpLW1pc3NpbmcnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBtZXNzYWdlOiAnU01BUEkgaXMgcmVxdWlyZWQgdG8gbW9kIFN0YXJkZXcgVmFsbGV5LicsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogYWN0aW9uVGl0bGUsXHJcbiAgICAgICAgICBhY3Rpb24sXHJcbiAgICAgICAgfSxcclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogSW50ZXJuYWwgbWV0aG9kc1xyXG4gICoqKioqKioqKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgY2hlY2sgd2hldGhlciBhIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGggZXhpc3RzLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gVGhlIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGguXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0UGF0aEV4aXN0c0FzeW5jKHBhdGgpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aCk7XHJcbiAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBjYXRjaChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgcmVhZCBhIHJlZ2lzdHJ5IGtleSB2YWx1ZS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGl2ZSAtIFRoZSByZWdpc3RyeSBoaXZlIHRvIGFjY2Vzcy4gVGhpcyBzaG91bGQgYmUgYSBjb25zdGFudCBsaWtlIFJlZ2lzdHJ5LkhLTE0uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIFRoZSByZWdpc3RyeSBrZXkuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdG8gcmVhZC5cclxuICAgKi9cclxuICBhc3luYyByZWFkUmVnaXN0cnlLZXlBc3luYyhoaXZlLCBrZXksIG5hbWUpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoaGl2ZSwga2V5LCBuYW1lKTtcclxuICAgICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RGb2xkZXIoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIFdlIGFzc3VtZSB0aGF0IGFueSBtb2QgY29udGFpbmluZyBcIi9Db250ZW50L1wiIGluIGl0cyBkaXJlY3RvcnlcclxuICAvLyAgc3RydWN0dXJlIGlzIG1lYW50IHRvIGJlIGRlcGxveWVkIHRvIHRoZSByb290IGZvbGRlci5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpKTtcclxuICBjb25zdCBjb250ZW50RGlyID0gZmlsdGVyZWQuZmluZChmaWxlID0+IGZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoY29udGVudERpciAhPT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RGb2xkZXIoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFdlJ3JlIGdvaW5nIHRvIGRlcGxveSBcIi9Db250ZW50L1wiIGFuZCB3aGF0ZXZlciBmb2xkZXJzIGNvbWUgYWxvbmdzaWRlIGl0LlxyXG4gIC8vICBpLmUuIFNvbWVNb2QuN3pcclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Db250ZW50L1xyXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL01vZHMvXHJcbiAgLy8gIFdpbGwgTk9UIGJlIGRlcGxveWVkID0+IC4uL1JlYWRtZS5kb2NcclxuICBjb25zdCBjb250ZW50RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICBjb25zdCBpZHggPSBjb250ZW50RmlsZS5pbmRleE9mKFBUUk5fQ09OVEVOVCkgKyAxO1xyXG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLmJhc2VuYW1lKGNvbnRlbnRGaWxlLnN1YnN0cmluZygwLCBpZHgpKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKVxyXG4gICAgJiYgKGZpbGUuaW5kZXhPZihyb290RGlyKSAhPT0gLTEpXHJcbiAgICAmJiAocGF0aC5leHRuYW1lKGZpbGUpICE9PSAnLnR4dCcpKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc3Vic3RyKGlkeCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KGZpbGVQYXRoKSB7XHJcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICBjb25zdCBpc01hbmlmZXN0RmlsZSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID09PSBNQU5JRkVTVF9GSUxFO1xyXG4gIGNvbnN0IGlzTG9jYWxlID0gc2VnbWVudHMuaW5jbHVkZXMoJ2xvY2FsZScpO1xyXG4gIHJldHVybiBpc01hbmlmZXN0RmlsZSAmJiAhaXNMb2NhbGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWQoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChpc1ZhbGlkTWFuaWZlc3QpICE9PSB1bmRlZmluZWQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgICAgLy8gV2UgY3JlYXRlIGEgcHJlZml4IGZha2UgZGlyZWN0b3J5IGp1c3QgaW4gY2FzZSB0aGUgY29udGVudFxyXG4gICAgICAvLyAgZm9sZGVyIGlzIGluIHRoZSBhcmNoaXZlJ3Mgcm9vdCBmb2xkZXIuIFRoaXMgaXMgdG8gZW5zdXJlIHdlXHJcbiAgICAgIC8vICBmaW5kIGEgbWF0Y2ggZm9yIFwiL0NvbnRlbnQvXCJcclxuICAgICAgY29uc3QgdGVzdEZpbGUgPSBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKTtcclxuICAgICAgcmV0dXJuICh0ZXN0RmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICAgIH0pID09PSB1bmRlZmluZWQpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbChhcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeU1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gVGhlIGFyY2hpdmUgbWF5IGNvbnRhaW4gbXVsdGlwbGUgbWFuaWZlc3QgZmlsZXMgd2hpY2ggd291bGRcclxuICAvLyAgaW1wbHkgdGhhdCB3ZSdyZSBpbnN0YWxsaW5nIG11bHRpcGxlIG1vZHMuXHJcbiAgY29uc3QgbWFuaWZlc3RGaWxlcyA9IGZpbGVzLmZpbHRlcihpc1ZhbGlkTWFuaWZlc3QpO1xyXG5cclxuICBpbnRlcmZhY2UgSU1vZEluZm8ge1xyXG4gICAgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdDtcclxuICAgIHJvb3RGb2xkZXI6IHN0cmluZztcclxuICAgIG1hbmlmZXN0SW5kZXg6IG51bWJlcjtcclxuICAgIG1vZEZpbGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGxldCBwYXJzZUVycm9yOiBFcnJvcjtcclxuXHJcbiAgYXdhaXQgZGVwZW5kZW5jeU1hbmFnZXIuc2Nhbk1hbmlmZXN0cyh0cnVlKTtcclxuICBsZXQgbW9kczogSU1vZEluZm9bXSA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0RmlsZXMubWFwKGFzeW5jIG1hbmlmZXN0RmlsZSA9PiB7XHJcbiAgICBjb25zdCByb290Rm9sZGVyID0gcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZSk7XHJcbiAgICBjb25zdCByb290U2VnbWVudHMgPSByb290Rm9sZGVyLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgY29uc3QgbWFuaWZlc3RJbmRleCA9IG1hbmlmZXN0RmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoTUFOSUZFU1RfRklMRSk7XHJcbiAgICBjb25zdCBmaWx0ZXJGdW5jID0gKGZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgICBjb25zdCBpc0ZpbGUgPSAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkgJiYgcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZSkpICE9PSAnJztcclxuICAgICAgY29uc3QgZmlsZVNlZ21lbnRzID0gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgY29uc3QgaXNJblJvb3RGb2xkZXIgPSAocm9vdFNlZ21lbnRzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgPyBmaWxlU2VnbWVudHM/Lltyb290U2VnbWVudHMubGVuZ3RoIC0gMV0gPT09IHJvb3RTZWdtZW50c1tyb290U2VnbWVudHMubGVuZ3RoIC0gMV1cclxuICAgICAgICA6IHRydWU7XHJcbiAgICAgIHJldHVybiBpc0luUm9vdEZvbGRlciAmJiBpc0ZpbGU7XHJcbiAgICB9O1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdCA9XHJcbiAgICAgICAgYXdhaXQgcGFyc2VNYW5pZmVzdChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtYW5pZmVzdEZpbGUpKTtcclxuICAgICAgY29uc3QgbW9kRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsdGVyRnVuYyk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbWFuaWZlc3QsXHJcbiAgICAgICAgcm9vdEZvbGRlcixcclxuICAgICAgICBtYW5pZmVzdEluZGV4LFxyXG4gICAgICAgIG1vZEZpbGVzLFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIGp1c3QgYSB3YXJuaW5nIGF0IHRoaXMgcG9pbnQgYXMgdGhpcyBtYXkgbm90IGJlIHRoZSBtYWluIG1hbmlmZXN0IGZvciB0aGUgbW9kXHJcbiAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IG1hbmlmZXN0RmlsZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICBwYXJzZUVycm9yID0gZXJyO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH0pKTtcclxuXHJcbiAgbW9kcyA9IG1vZHMuZmlsdGVyKHggPT4geCAhPT0gdW5kZWZpbmVkKTtcclxuICBcclxuICBpZiAobW9kcy5sZW5ndGggPT09IDApIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdUaGUgbW9kIG1hbmlmZXN0IGlzIGludmFsaWQgYW5kIGNhblxcJ3QgYmUgcmVhZC4gWW91IGNhbiB0cnkgdG8gaW5zdGFsbCB0aGUgbW9kIGFueXdheSB2aWEgcmlnaHQtY2xpY2sgLT4gXCJVbnBhY2sgKGFzLWlzKVwiJyxcclxuICAgICAgcGFyc2VFcnJvciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5tYXAobW9kcywgbW9kID0+IHtcclxuICAgIC8vIFRPRE86IHdlIG1pZ2h0IGdldCBoZXJlIHdpdGggYSBtb2QgdGhhdCBoYXMgYSBtYW5pZmVzdC5qc29uIGZpbGUgYnV0IHdhc24ndCBpbnRlbmRlZCBmb3IgU3RhcmRldyBWYWxsZXksIGFsbFxyXG4gICAgLy8gIHRodW5kZXJzdG9yZSBtb2RzIHdpbGwgY29udGFpbiBhIG1hbmlmZXN0Lmpzb24gZmlsZVxyXG4gICAgY29uc3QgbW9kTmFtZSA9IChtb2Qucm9vdEZvbGRlciAhPT0gJy4nKVxyXG4gICAgICA/IG1vZC5yb290Rm9sZGVyXHJcbiAgICAgIDogbW9kLm1hbmlmZXN0Lk5hbWUgPz8gbW9kLnJvb3RGb2xkZXI7XHJcblxyXG4gICAgaWYgKG1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbW9kLm1hbmlmZXN0LkRlcGVuZGVuY2llcyB8fCBbXTtcclxuXHJcbiAgICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIG1vZC5tb2RGaWxlcykge1xyXG4gICAgICBjb25zdCBkZXN0aW5hdGlvbiA9IHBhdGguam9pbihtb2ROYW1lLCBmaWxlLnN1YnN0cihtb2QubWFuaWZlc3RJbmRleCkpO1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZGVzdGluYXRpb24sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFkZFJ1bGVGb3JEZXBlbmRlbmN5ID0gKGRlcDogSVNEVkRlcGVuZGVuY3kpID0+IHtcclxuICAgICAgaWYgKChkZXAuVW5pcXVlSUQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgIHx8IChkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSA9PT0gJ3lvdXJuYW1lLnlvdXJvdGhlcnNwYWNrc2FuZG1vZHMnKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGVwLk1pbmltdW1WZXJzaW9uICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IGA+PSR7ZGVwLk1pbmltdW1WZXJzaW9ufWBcclxuICAgICAgICA6ICcqJztcclxuICAgICAgY29uc3QgcnVsZTogdHlwZXMuSU1vZFJ1bGUgPSB7XHJcbiAgICAgICAgLy8gdHJlYXRpbmcgYWxsIGRlcGVuZGVuY2llcyBhcyByZWNvbW1lbmRhdGlvbnMgYmVjYXVzZSB0aGUgZGVwZW5kZW5jeSBpbmZvcm1hdGlvblxyXG4gICAgICAgIC8vIHByb3ZpZGVkIGJ5IHNvbWUgbW9kIGF1dGhvcnMgaXMgYSBiaXQgaGl0LWFuZC1taXNzIGFuZCBWb3J0ZXggZmFpcmx5IGFnZ3Jlc3NpdmVseVxyXG4gICAgICAgIC8vIGVuZm9yY2VzIHJlcXVpcmVtZW50c1xyXG4gICAgICAgIC8vIHR5cGU6IChkZXAuSXNSZXF1aXJlZCA/PyB0cnVlKSA/ICdyZXF1aXJlcycgOiAncmVjb21tZW5kcycsXHJcbiAgICAgICAgdHlwZTogJ3JlY29tbWVuZHMnLFxyXG4gICAgICAgIHJlZmVyZW5jZToge1xyXG4gICAgICAgICAgbG9naWNhbEZpbGVOYW1lOiBkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgIHZlcnNpb25NYXRjaCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGV4dHJhOiB7XHJcbiAgICAgICAgICBvbmx5SWZGdWxmaWxsYWJsZTogdHJ1ZSxcclxuICAgICAgICAgIGF1dG9tYXRpYzogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9O1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ3J1bGUnLFxyXG4gICAgICAgIHJ1bGUsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICBpZiAoYXBpLmdldFN0YXRlKCkuc2V0dGluZ3NbJ1NEViddPy51c2VSZWNvbW1lbmRhdGlvbnMgPz8gZmFsc2UpIHtcclxuICAgICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3koZGVwKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IpO1xyXG4gICAgICB9XHJcbiAgICB9Ki9cclxuICAgIHJldHVybiBpbnN0cnVjdGlvbnM7XHJcbiAgfSlcclxuICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBbXS5jb25jYXQoZGF0YSkucmVkdWNlKChhY2N1bSwgaXRlcikgPT4gYWNjdW0uY29uY2F0KGl0ZXIpLCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNTTUFQSU1vZFR5cGUoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuXHJcbiAgY29uc3Qgc21hcGlEYXRhID0gaW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdCA9PiAoaW5zdC50eXBlID09PSAnY29weScpICYmIGluc3Quc291cmNlLmVuZHNXaXRoKFNNQVBJX0VYRSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShzbWFwaURhdGEgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTTUFQSShmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBkb3dubG9hZCBjb250YWlucyB0aGUgU01BUEkgZGF0YSBhcmNoaXZlLnNcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBTTUFQSV9ETEwpICE9PSB1bmRlZmluZWQpXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgICBzdXBwb3J0ZWQsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IGZvbGRlciA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMidcclxuICAgID8gJ3dpbmRvd3MnXHJcbiAgICA6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCdcclxuICAgICAgPyAnbGludXgnXHJcbiAgICAgIDogJ21hY29zJztcclxuICBjb25zdCBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtID0gKGZpbGUpID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICByZXR1cm4gKHNlZ21lbnRzLmluY2x1ZGVzKGZvbGRlcikpO1xyXG4gIH1cclxuICAvLyBGaW5kIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmVcclxuICBjb25zdCBkYXRhRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBpc0NvcnJlY3RQbGF0Zm9ybSA9IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0oZmlsZSk7XHJcbiAgICByZXR1cm4gaXNDb3JyZWN0UGxhdGZvcm0gJiYgU01BUElfREFUQS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpXHJcbiAgfSk7XHJcbiAgaWYgKGRhdGFGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIGZpbmQgdGhlIFNNQVBJIGRhdGEgZmlsZXMgLSBkb3dubG9hZCBhcHBlYXJzICdcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgbGV0IGRhdGEgPSAnJztcclxuICB0cnkge1xyXG4gICAgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgJ1N0YXJkZXcgVmFsbGV5LmRlcHMuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBTRFYgZGVwZW5kZW5jaWVzJywgZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIGZpbGUgd2lsbCBiZSBvdXRkYXRlZCBhZnRlciB0aGUgd2FsayBvcGVyYXRpb24gc28gcHJlcGFyZSBhIHJlcGxhY2VtZW50LiBcclxuICBjb25zdCB1cGRhdGVkRmlsZXMgPSBbXTtcclxuXHJcbiAgY29uc3Qgc3ppcCA9IG5ldyBTZXZlblppcCgpO1xyXG4gIC8vIFVuemlwIHRoZSBmaWxlcyBmcm9tIHRoZSBkYXRhIGFyY2hpdmUuIFRoaXMgZG9lc24ndCBzZWVtIHRvIGJlaGF2ZSBhcyBkZXNjcmliZWQgaGVyZTogaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvbm9kZS03eiNldmVudHNcclxuICBhd2FpdCBzemlwLmV4dHJhY3RGdWxsKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGRhdGFGaWxlKSwgZGVzdGluYXRpb25QYXRoKTtcclxuXHJcbiAgLy8gRmluZCBhbnkgZmlsZXMgdGhhdCBhcmUgbm90IGluIHRoZSBwYXJlbnQgZm9sZGVyLiBcclxuICBhd2FpdCB1dGlsLndhbGsoZGVzdGluYXRpb25QYXRoLCAoaXRlciwgc3RhdHMpID0+IHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGVzdGluYXRpb25QYXRoLCBpdGVyKTtcclxuICAgICAgLy8gRmlsdGVyIG91dCBmaWxlcyBmcm9tIHRoZSBvcmlnaW5hbCBpbnN0YWxsIGFzIHRoZXkncmUgbm8gbG9uZ2VyIHJlcXVpcmVkLlxyXG4gICAgICBpZiAoIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgpICYmIHN0YXRzLmlzRmlsZSgpICYmICFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoK3BhdGguc2VwKSkgdXBkYXRlZEZpbGVzLnB1c2gocmVsUGF0aCk7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gcmVsUGF0aC50b0xvY2FsZUxvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgY29uc3QgbW9kc0ZvbGRlcklkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgICAgaWYgKChtb2RzRm9sZGVySWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNGb2xkZXJJZHggKyAxKSkge1xyXG4gICAgICAgIF9TTUFQSV9CVU5ETEVEX01PRFMucHVzaChzZWdtZW50c1ttb2RzRm9sZGVySWR4ICsgMV0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGV4ZSBmaWxlLiBcclxuICBjb25zdCBzbWFwaUV4ZSA9IHVwZGF0ZWRGaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKFNNQVBJX0VYRS50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgaWYgKHNtYXBpRXhlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChgRmFpbGVkIHRvIGV4dHJhY3QgJHtTTUFQSV9FWEV9IC0gZG93bmxvYWQgYXBwZWFycyBgXHJcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XHJcbiAgfVxyXG4gIGNvbnN0IGlkeCA9IHNtYXBpRXhlLmluZGV4T2YocGF0aC5iYXNlbmFtZShzbWFwaUV4ZSkpO1xyXG5cclxuICAvLyBCdWlsZCB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBpbnN0YWxsYXRpb24uIFxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSB1cGRhdGVkRmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihmaWxlLnN1YnN0cihpZHgpKSxcclxuICAgICAgfVxyXG4gIH0pO1xyXG5cclxuICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgIGtleTogJ3NtYXBpQnVuZGxlZE1vZHMnLFxyXG4gICAgdmFsdWU6IGdldEJ1bmRsZWRNb2RzKCksXHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdnZW5lcmF0ZWZpbGUnLFxyXG4gICAgZGF0YSxcclxuICAgIGRlc3RpbmF0aW9uOiAnU3RhcmRld01vZGRpbmdBUEkuZGVwcy5qc29uJyxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIGxvZ0ZpbGUpIHtcclxuICBjb25zdCBsb2dEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsIGxvZ0ZpbGUpLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xyXG4gIGF3YWl0IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1NNQVBJIExvZycsIHtcclxuICAgIHRleHQ6ICdZb3VyIFNNQVBJIGxvZyBpcyBkaXNwbGF5ZWQgYmVsb3cuIFRvIHNoYXJlIGl0LCBjbGljayBcIkNvcHkgJiBTaGFyZVwiIHdoaWNoIHdpbGwgY29weSBpdCB0byB5b3VyIGNsaXBib2FyZCBhbmQgb3BlbiB0aGUgU01BUEkgbG9nIHNoYXJpbmcgd2Vic2l0ZS4gJyArXHJcbiAgICAgICdOZXh0LCBwYXN0ZSB5b3VyIGNvZGUgaW50byB0aGUgdGV4dCBib3ggYW5kIHByZXNzIFwic2F2ZSAmIHBhcnNlIGxvZ1wiLiBZb3UgY2FuIG5vdyBzaGFyZSBhIGxpbmsgdG8gdGhpcyBwYWdlIHdpdGggb3RoZXJzIHNvIHRoZXkgY2FuIHNlZSB5b3VyIGxvZyBmaWxlLlxcblxcbicgKyBsb2dEYXRhXHJcbiAgfSwgW3tcclxuICAgIGxhYmVsOiAnQ29weSAmIFNoYXJlIGxvZycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvXi4rVChbXlxcLl0rKS4rLywgJyQxJyk7XHJcbiAgICAgIGNsaXBib2FyZC53cml0ZVRleHQoYFske3RpbWVzdGFtcH0gSU5GTyBWb3J0ZXhdIExvZyBleHBvcnRlZCBieSBWb3J0ZXggJHt1dGlsLmdldEFwcGxpY2F0aW9uKCkudmVyc2lvbn0uXFxuYCArIGxvZ0RhdGEpO1xyXG4gICAgICByZXR1cm4gdXRpbC5vcG4oJ2h0dHBzOi8vc21hcGkuaW8vbG9nJykuY2F0Y2goZXJyID0+IHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgfSwgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiB1bmRlZmluZWQgfV0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvblNob3dTTUFQSUxvZyhhcGkpIHtcclxuICAvL1JlYWQgYW5kIGRpc3BsYXkgdGhlIGxvZy5cclxuICBjb25zdCBiYXNlUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJ3N0YXJkZXd2YWxsZXknLCAnZXJyb3Jsb2dzJyk7XHJcbiAgdHJ5IHtcclxuICAgIC8vSWYgdGhlIGNyYXNoIGxvZyBleGlzdHMsIHNob3cgdGhhdC5cclxuICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWNyYXNoLnR4dFwiKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vT3RoZXJ3aXNlIHNob3cgdGhlIG5vcm1hbCBsb2cuXHJcbiAgICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWxhdGVzdC50eHRcIik7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy9PciBJbmZvcm0gdGhlIHVzZXIgdGhlcmUgYXJlIG5vIGxvZ3MuXHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHsgdHlwZTogJ2luZm8nLCB0aXRsZTogJ05vIFNNQVBJIGxvZ3MgZm91bmQuJywgbWVzc2FnZTogJycsIGRpc3BsYXlNUzogNTAwMCB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGNvbnN0IG1hbmlmZXN0czogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgaWYgKG1vZFBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdHVyYm93YWxrKG1vZFBhdGgsIGFzeW5jIGVudHJpZXMgPT4ge1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gJ21hbmlmZXN0Lmpzb24nKSB7XHJcbiAgICAgICAgbWFuaWZlc3RzLnB1c2goZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgeyBza2lwSGlkZGVuOiBmYWxzZSwgcmVjdXJzZTogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXHJcbiAgICAudGhlbigoKSA9PiBtYW5pZmVzdHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVDb25mbGljdEluZm8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcGk6IFNNQVBJUHJveHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkOiBzdHJpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IG1vZCA9IGFwaS5nZXRTdGF0ZSgpLnBlcnNpc3RlbnQubW9kc1tnYW1lSWRdW21vZElkXTtcclxuXHJcbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG5cclxuICBpZiAoKG5vdyAtIChtb2QuYXR0cmlidXRlcz8ubGFzdFNNQVBJUXVlcnkgPz8gMCkpIDwgU01BUElfUVVFUllfRlJFUVVFTkNZKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBsZXQgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBtb2QuYXR0cmlidXRlcz8uYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXM7XHJcbiAgaWYgKCFhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcykge1xyXG4gICAgaWYgKG1vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWUpIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbbW9kLmF0dHJpYnV0ZXM/LmxvZ2ljYWxGaWxlTmFtZV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcXVlcnkgPSBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lc1xyXG4gICAgLm1hcChuYW1lID0+IHtcclxuICAgICAgY29uc3QgcmVzID0ge1xyXG4gICAgICAgIGlkOiBuYW1lLFxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCB2ZXIgPSBtb2QuYXR0cmlidXRlcz8ubWFuaWZlc3RWZXJzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgID8/IHNlbXZlci5jb2VyY2UobW9kLmF0dHJpYnV0ZXM/LnZlcnNpb24pPy52ZXJzaW9uO1xyXG4gICAgICBpZiAoISF2ZXIpIHtcclxuICAgICAgICByZXNbJ2luc3RhbGxlZFZlcnNpb24nXSA9IHZlcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBzdGF0ID0gKGl0ZW06IElTTUFQSVJlc3VsdCk6IENvbXBhdGliaWxpdHlTdGF0dXMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdHVzID0gaXRlbS5tZXRhZGF0YT8uY29tcGF0aWJpbGl0eVN0YXR1cz8udG9Mb3dlckNhc2U/LigpO1xyXG4gICAgaWYgKCFjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmNsdWRlcyhzdGF0dXMgYXMgYW55KSkge1xyXG4gICAgICByZXR1cm4gJ3Vua25vd24nO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHN0YXR1cyBhcyBDb21wYXRpYmlsaXR5U3RhdHVzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNvbXBhdGliaWxpdHlQcmlvID0gKGl0ZW06IElTTUFQSVJlc3VsdCkgPT4gY29tcGF0aWJpbGl0eU9wdGlvbnMuaW5kZXhPZihzdGF0KGl0ZW0pKTtcclxuXHJcbiAgcmV0dXJuIHNtYXBpLmZpbmRCeU5hbWVzKHF1ZXJ5KVxyXG4gICAgLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICAgIGNvbnN0IHdvcnN0U3RhdHVzOiBJU01BUElSZXN1bHRbXSA9IHJlc3VsdHNcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGNvbXBhdGliaWxpdHlQcmlvKGxocykgLSBjb21wYXRpYmlsaXR5UHJpbyhyaHMpKTtcclxuICAgICAgaWYgKHdvcnN0U3RhdHVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGVzKGdhbWVJZCwgbW9kSWQsIHtcclxuICAgICAgICAgIGxhc3RTTUFQSVF1ZXJ5OiBub3csXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5U3RhdHVzOiB3b3JzdFN0YXR1c1swXS5tZXRhZGF0YS5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eU1lc3NhZ2U6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdW1tYXJ5LFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVVwZGF0ZTogd29yc3RTdGF0dXNbMF0uc3VnZ2VzdGVkVXBkYXRlPy52ZXJzaW9uLFxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb2coJ2RlYnVnJywgJ25vIG1hbmlmZXN0Jyk7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnd2FybicsICdlcnJvciByZWFkaW5nIG1hbmlmZXN0JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGxldCBkZXBlbmRlbmN5TWFuYWdlcjogRGVwZW5kZW5jeU1hbmFnZXI7XHJcbiAgY29uc3QgZ2V0RGlzY292ZXJ5UGF0aCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxyXG4gICAgICBsb2coJ2Vycm9yJywgJ3N0YXJkZXd2YWxsZXkgd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZ2V0U01BUElQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWFuaWZlc3RFeHRyYWN0b3IgPSB0b0JsdWUoXHJcbiAgICBhc3luYyAobW9kSW5mbzogYW55LCBtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueTsgfT4gPT4ge1xyXG4gICAgICBpZiAoc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aCk7XHJcblxyXG4gICAgICBjb25zdCBwYXJzZWRNYW5pZmVzdHMgPSAoYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RzLm1hcChcclxuICAgICAgICBhc3luYyBtYW5pZmVzdCA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcGFyc2VNYW5pZmVzdChtYW5pZmVzdCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgbWFuaWZlc3RGaWxlOiBtYW5pZmVzdCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pKSkuZmlsdGVyKG1hbmlmZXN0ID0+IG1hbmlmZXN0ICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICAgICAgaWYgKHBhcnNlZE1hbmlmZXN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gd2UgY2FuIG9ubHkgdXNlIG9uZSBtYW5pZmVzdCB0byBnZXQgdGhlIGlkIGZyb21cclxuICAgICAgY29uc3QgcmVmTWFuaWZlc3QgPSBwYXJzZWRNYW5pZmVzdHNbMF07XHJcblxyXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5maWx0ZXIobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlELnRvTG93ZXJDYXNlKCkpO1xyXG5cclxuICAgICAgY29uc3QgbWluU01BUElWZXJzaW9uID0gcGFyc2VkTWFuaWZlc3RzXHJcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5NaW5pbXVtQXBpVmVyc2lvbilcclxuICAgICAgICAuZmlsdGVyKHZlcnNpb24gPT4gc2VtdmVyLnZhbGlkKHZlcnNpb24pKVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLCBsaHMpKVswXTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyxcclxuICAgICAgICBtaW5TTUFQSVZlcnNpb24sXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAocmVmTWFuaWZlc3QgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIGRvbid0IHNldCBhIGN1c3RvbSBmaWxlIG5hbWUgZm9yIFNNQVBJXHJcbiAgICAgICAgaWYgKG1vZEluZm8uZG93bmxvYWQubW9kSW5mbz8ubmV4dXM/Lmlkcz8ubW9kSWQgIT09IDI0MDApIHtcclxuICAgICAgICAgIHJlc3VsdFsnY3VzdG9tRmlsZU5hbWUnXSA9IHJlZk1hbmlmZXN0Lk5hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIChyZWZNYW5pZmVzdC5WZXJzaW9uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIHJlc3VsdFsnbWFuaWZlc3RWZXJzaW9uJ10gPSByZWZNYW5pZmVzdC5WZXJzaW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBTdGFyZGV3VmFsbGV5KGNvbnRleHQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ1NEViddLCBzZHZSZWR1Y2Vycyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzLCAoKSA9PiAoe1xyXG4gICAgb25NZXJnZUNvbmZpZ1RvZ2dsZTogYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XHJcbiAgICAgIGlmICghZW5hYmxlZCkge1xyXG4gICAgICAgIGF3YWl0IG9uUmV2ZXJ0RmlsZXMoY29udGV4dC5hcGksIHByb2ZpbGVJZCk7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7IHR5cGU6ICdpbmZvJywgbWVzc2FnZTogJ01vZCBjb25maWdzIHJldHVybmVkIHRvIHRoZWlyIHJlc3BlY3RpdmUgbW9kcycsIGRpc3BsYXlNUzogNTAwMCB9KTtcclxuICAgICAgfVxyXG4gICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRNZXJnZUNvbmZpZ3MocHJvZmlsZUlkLCBlbmFibGVkKSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuICB9KSwgKCkgPT4gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSA9PT0gR0FNRV9JRCwgMTUwKTtcclxuXHJcbiAgLy8gUmVnaXN0ZXIgb3VyIFNNQVBJIG1vZCB0eXBlIGFuZCBpbnN0YWxsZXIuIE5vdGU6IFRoaXMgY3VycmVudGx5IGZsYWdzIGFuIGVycm9yIGluIFZvcnRleCBvbiBpbnN0YWxsaW5nIGNvcnJlY3RseS5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzbWFwaS1pbnN0YWxsZXInLCAzMCwgdGVzdFNNQVBJLCAoZmlsZXMsIGRlc3QpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbFNNQVBJKGdldERpc2NvdmVyeVBhdGgsIGZpbGVzLCBkZXN0KSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NkdnJvb3Rmb2xkZXInLCA1MCwgdGVzdFJvb3RGb2xkZXIsIGluc3RhbGxSb290Rm9sZGVyKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzdGFyZGV3LXZhbGxleS1pbnN0YWxsZXInLCA1MCwgdGVzdFN1cHBvcnRlZCxcclxuICAgIChmaWxlcywgZGVzdGluYXRpb25QYXRoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGluc3RhbGwoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyLCBmaWxlcywgZGVzdGluYXRpb25QYXRoKSkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnU01BUEknLCAzMCwgZ2FtZUlkID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgZ2V0U01BUElQYXRoLCBpc1NNQVBJTW9kVHlwZSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfQ09ORklHLCAzMCwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXHJcbiAgICAoKSA9PiBwYXRoLmpvaW4oZ2V0RGlzY292ZXJ5UGF0aCgpLCBkZWZhdWx0TW9kc1JlbFBhdGgoKSksICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnc2R2cm9vdGZvbGRlcicsIDI1LCAoZ2FtZUlkKSA9PiAoZ2FtZUlkID09PSBHQU1FX0lEKSxcclxuICAgICgpID0+IGdldERpc2NvdmVyeVBhdGgoKSwgKGluc3RydWN0aW9ucykgPT4ge1xyXG4gICAgICAvLyBPbmx5IGludGVyZXN0ZWQgaW4gY29weSBpbnN0cnVjdGlvbnMuXHJcbiAgICAgIGNvbnN0IGNvcHlJbnN0cnVjdGlvbnMgPSBpbnN0cnVjdGlvbnMuZmlsdGVyKGluc3RyID0+IGluc3RyLnR5cGUgPT09ICdjb3B5Jyk7XHJcbiAgICAgIC8vIFRoaXMgaXMgYSB0cmlja3kgcGF0dGVybiBzbyB3ZSdyZSBnb2luZyB0byAxc3QgcHJlc2VudCB0aGUgZGlmZmVyZW50IHBhY2thZ2luZ1xyXG4gICAgICAvLyAgcGF0dGVybnMgd2UgbmVlZCB0byBjYXRlciBmb3I6XHJcbiAgICAgIC8vICAxLiBSZXBsYWNlbWVudCBtb2Qgd2l0aCBcIkNvbnRlbnRcIiBmb2xkZXIuIERvZXMgbm90IHJlcXVpcmUgU01BUEkgc28gbm9cclxuICAgICAgLy8gICAgbWFuaWZlc3QgZmlsZXMgYXJlIGluY2x1ZGVkLlxyXG4gICAgICAvLyAgMi4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyICsgb25lIG9yIG1vcmUgU01BUEkgbW9kcyBpbmNsdWRlZFxyXG4gICAgICAvLyAgICBhbG9uZ3NpZGUgdGhlIENvbnRlbnQgZm9sZGVyIGluc2lkZSBhIFwiTW9kc1wiIGZvbGRlci5cclxuICAgICAgLy8gIDMuIEEgcmVndWxhciBTTUFQSSBtb2Qgd2l0aCBhIFwiQ29udGVudFwiIGZvbGRlciBpbnNpZGUgdGhlIG1vZCdzIHJvb3QgZGlyLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBwYXR0ZXJuIDE6XHJcbiAgICAgIC8vICAtIEVuc3VyZSB3ZSBkb24ndCBoYXZlIG1hbmlmZXN0IGZpbGVzXHJcbiAgICAgIC8vICAtIEVuc3VyZSB3ZSBoYXZlIGEgXCJDb250ZW50XCIgZm9sZGVyXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFRvIHNvbHZlIHBhdHRlcm5zIDIgYW5kIDMgd2UncmUgZ29pbmcgdG86XHJcbiAgICAgIC8vICBDaGVjayB3aGV0aGVyIHdlIGhhdmUgYW55IG1hbmlmZXN0IGZpbGVzLCBpZiB3ZSBkbywgd2UgZXhwZWN0IHRoZSBmb2xsb3dpbmdcclxuICAgICAgLy8gICAgYXJjaGl2ZSBzdHJ1Y3R1cmUgaW4gb3JkZXIgZm9yIHRoZSBtb2RUeXBlIHRvIGZ1bmN0aW9uIGNvcnJlY3RseTpcclxuICAgICAgLy8gICAgYXJjaGl2ZS56aXAgPT5cclxuICAgICAgLy8gICAgICAuLi9Db250ZW50L1xyXG4gICAgICAvLyAgICAgIC4uL01vZHMvXHJcbiAgICAgIC8vICAgICAgLi4vTW9kcy9BX1NNQVBJX01PRFxcbWFuaWZlc3QuanNvblxyXG4gICAgICBjb25zdCBoYXNNYW5pZmVzdCA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLmVuZHNXaXRoKE1BTklGRVNUX0ZJTEUpKVxyXG4gICAgICBjb25zdCBoYXNNb2RzRm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aChkZWZhdWx0TW9kc1JlbFBhdGgoKSArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgaGFzQ29udGVudEZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ0NvbnRlbnQnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkXHJcblxyXG4gICAgICByZXR1cm4gKGhhc01hbmlmZXN0KVxyXG4gICAgICAgID8gQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyICYmIGhhc01vZHNGb2xkZXIpXHJcbiAgICAgICAgOiBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIpO1xyXG4gICAgfSk7XHJcblxyXG4gIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQpXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnY2hhbmdlbG9nJywge30sICdTTUFQSSBMb2cnLFxyXG4gICAgKCkgPT4geyBvblNob3dTTUFQSUxvZyhjb250ZXh0LmFwaSk7IH0sXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIC8vT25seSBzaG93IHRoZSBTTUFQSSBsb2cgYnV0dG9uIGZvciBTRFYuIFxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBdHRyaWJ1dGVFeHRyYWN0b3IoMjUsIG1hbmlmZXN0RXh0cmFjdG9yKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xyXG4gICAgaWQ6ICdzZHYtY29tcGF0aWJpbGl0eScsXHJcbiAgICBwb3NpdGlvbjogMTAwLFxyXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxyXG4gICAgcGxhY2VtZW50OiAndGFibGUnLFxyXG4gICAgY2FsYzogKG1vZDogdHlwZXMuSU1vZCkgPT4gbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XHJcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KENvbXBhdGliaWxpdHlJY29uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHQsIG1vZCwgZGV0YWlsQ2VsbCB9LCBbXSk7XHJcbiAgICB9LFxyXG4gICAgbmFtZTogJ0NvbXBhdGliaWxpdHknLFxyXG4gICAgaXNEZWZhdWx0VmlzaWJsZTogdHJ1ZSxcclxuICAgIGVkaXQ6IHt9LFxyXG4gIH0pO1xyXG5cclxuICAvKlxyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtbWlzc2luZy1kZXBlbmRlbmNpZXMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IHRlc3RNaXNzaW5nRGVwZW5kZW5jaWVzKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpO1xyXG4gICovXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3Nkdi1pbmNvbXBhdGlibGUtbW9kcycsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0U01BUElPdXRkYXRlZChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb25zdCBwcm94eSA9IG5ldyBTTUFQSVByb3h5KGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ3NkdicsIHBhdGguam9pbihfX2Rpcm5hbWUsICdzZHZzdHlsZS5zY3NzJykpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmFkZE1ldGFTZXJ2ZXIoJ3NtYXBpLmlvJywge1xyXG4gICAgICB1cmw6ICcnLFxyXG4gICAgICBsb29wYmFja0NCOiAocXVlcnk6IElRdWVyeSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHByb3h5LmZpbmQocXVlcnkpKVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvb2sgdXAgc21hcGkgbWV0YSBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgY2FjaGVEdXJhdGlvblNlYzogODY0MDAsXHJcbiAgICAgIHByaW9yaXR5OiAyNSxcclxuICAgIH0pO1xyXG4gICAgZGVwZW5kZW5jeU1hbmFnZXIgPSBuZXcgRGVwZW5kZW5jeU1hbmFnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnYWRkZWQtZmlsZXMnLCAocHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBhbnlbXSkgPT4gb25BZGRlZEZpbGVzKGNvbnRleHQuYXBpLCBwcm9maWxlSWQsIGZpbGVzKSBhcyBhbnkpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ3dpbGwtZW5hYmxlLW1vZHMnLCAocHJvZmlsZUlkOiBzdHJpbmcsIG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4sIG9wdGlvbnM6IGFueSkgPT4gb25XaWxsRW5hYmxlTW9kcyhjb250ZXh0LmFwaSwgcHJvZmlsZUlkLCBtb2RJZHMsIGVuYWJsZWQsIG9wdGlvbnMpIGFzIGFueSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgJ3NtYXBpJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09ICdzbWFwaScpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lSWQsIG1vZElkKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGxvZygnZGVidWcnLCAnYWRkZWQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCB9KSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGxvZygnZGVidWcnLCAndXBkYXRpbmcgU0RWIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZU1vZGVdID8/IHt9KS5tYXAobW9kSWQgPT5cclxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2RvbmUgdXBkYXRpbmcgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHVwZGF0ZSBjb25mbGljdCBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGluaXQ7XHJcbiJdfQ==