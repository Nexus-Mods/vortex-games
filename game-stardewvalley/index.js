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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
    if (((_b = now - ((_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.lastSMAPIQuery)) !== null && _b !== void 0 ? _b : 0) < constants_1.SMAPI_QUERY_FREQUENCY) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFDMUMsNEVBQW9EO0FBQ3BELDJDQUFvRDtBQUVwRCw0RUFBb0Q7QUFDcEQsMERBQXFDO0FBQ3JDLDhEQUFzQztBQUN0QyxtQ0FBNEM7QUFDNUMsbUNBQW1IO0FBQ25ILGlDQUEyRDtBQUUzRCwwREFBa0M7QUFFbEMsdUNBQTRDO0FBRTVDLDJDQUErRjtBQUUvRixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUNuQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUMvQixFQUFFLFFBQVEsRUFBRSxHQUFHLGlCQUFJLEVBQ25CLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQ2pFLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFMUYsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDckQsTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUcxRCxTQUFTLE1BQU0sQ0FBSSxJQUFv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QyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBJUXVlcnkgfSBmcm9tICdtb2RtZXRhLWRiJztcclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB1dGlsLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgKiBhcyB3aW5hcGkgZnJvbSAnd2luYXBpLWJpbmRpbmdzJztcclxuaW1wb3J0IENvbXBhdGliaWxpdHlJY29uIGZyb20gJy4vQ29tcGF0aWJpbGl0eUljb24nO1xyXG5pbXBvcnQgeyBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kgfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgRGVwZW5kZW5jeU1hbmFnZXIgZnJvbSAnLi9EZXBlbmRlbmN5TWFuYWdlcic7XHJcbmltcG9ydCBzZHZSZWR1Y2VycyBmcm9tICcuL3JlZHVjZXJzJztcclxuaW1wb3J0IFNNQVBJUHJveHkgZnJvbSAnLi9zbWFwaVByb3h5JztcclxuaW1wb3J0IHsgdGVzdFNNQVBJT3V0ZGF0ZWQgfSBmcm9tICcuL3Rlc3RzJztcclxuaW1wb3J0IHsgY29tcGF0aWJpbGl0eU9wdGlvbnMsIENvbXBhdGliaWxpdHlTdGF0dXMsIElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QsIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBwYXJzZU1hbmlmZXN0LCBkZWZhdWx0TW9kc1JlbFBhdGggfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vU2V0dGluZ3MnO1xyXG5cclxuaW1wb3J0IHsgc2V0TWVyZ2VDb25maWdzIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmltcG9ydCB7IG9uQWRkZWRGaWxlcywgb25SZXZlcnRGaWxlcywgb25XaWxsRW5hYmxlTW9kcywgcmVnaXN0ZXJDb25maWdNb2QgfSBmcm9tICcuL2NvbmZpZ01vZCc7XHJcblxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpLFxyXG4gIHsgY2xpcGJvYXJkIH0gPSByZXF1aXJlKCdlbGVjdHJvbicpLFxyXG4gIHJqc29uID0gcmVxdWlyZSgncmVsYXhlZC1qc29uJyksXHJcbiAgeyBTZXZlblppcCB9ID0gdXRpbCxcclxuICB7IGRlcGxveVNNQVBJLCBkb3dubG9hZFNNQVBJLCBmaW5kU01BUElNb2QgfSA9IHJlcXVpcmUoJy4vU01BUEknKSxcclxuICB7IEdBTUVfSUQsIF9TTUFQSV9CVU5ETEVEX01PRFMsIGdldEJ1bmRsZWRNb2RzLCBNT0RfVFlQRV9DT05GSUcgfSA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XHJcblxyXG5jb25zdCBNQU5JRkVTVF9GSUxFID0gJ21hbmlmZXN0Lmpzb24nO1xyXG5jb25zdCBQVFJOX0NPTlRFTlQgPSBwYXRoLnNlcCArICdDb250ZW50JyArIHBhdGguc2VwO1xyXG5jb25zdCBTTUFQSV9FWEUgPSAnU3RhcmRld01vZGRpbmdBUEkuZXhlJztcclxuY29uc3QgU01BUElfRExMID0gJ1NNQVBJLkluc3RhbGxlci5kbGwnO1xyXG5jb25zdCBTTUFQSV9EQVRBID0gWyd3aW5kb3dzLWluc3RhbGwuZGF0JywgJ2luc3RhbGwuZGF0J107XHJcblxyXG5cclxuZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmNsYXNzIFN0YXJkZXdWYWxsZXkgaW1wbGVtZW50cyB0eXBlcy5JR2FtZSB7XHJcbiAgcHVibGljIGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0O1xyXG4gIHB1YmxpYyBpZDogc3RyaW5nID0gR0FNRV9JRDtcclxuICBwdWJsaWMgbmFtZTogc3RyaW5nID0gJ1N0YXJkZXcgVmFsbGV5JztcclxuICBwdWJsaWMgbG9nbzogc3RyaW5nID0gJ2dhbWVhcnQuanBnJztcclxuICBwdWJsaWMgcmVxdWlyZWRGaWxlczogc3RyaW5nW107XHJcbiAgcHVibGljIGVudmlyb25tZW50OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xyXG4gICAgU3RlYW1BUFBJZDogJzQxMzE1MCcsXHJcbiAgfTtcclxuICBwdWJsaWMgZGV0YWlsczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHtcclxuICAgIHN0ZWFtQXBwSWQ6IDQxMzE1MFxyXG4gIH07XHJcbiAgcHVibGljIHN1cHBvcnRlZFRvb2xzOiBhbnlbXSA9IFtcclxuICAgIHtcclxuICAgICAgaWQ6ICdzbWFwaScsXHJcbiAgICAgIG5hbWU6ICdTTUFQSScsXHJcbiAgICAgIGxvZ286ICdzbWFwaS5wbmcnLFxyXG4gICAgICBleGVjdXRhYmxlOiAoKSA9PiBTTUFQSV9FWEUsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtTTUFQSV9FWEVdLFxyXG4gICAgICBzaGVsbDogdHJ1ZSxcclxuICAgICAgZXhjbHVzaXZlOiB0cnVlLFxyXG4gICAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgICAgZGVmYXVsdFByaW1hcnk6IHRydWUsXHJcbiAgICB9XHJcbiAgXTtcclxuICBwdWJsaWMgbWVyZ2VNb2RzOiBib29sZWFuID0gdHJ1ZTtcclxuICBwdWJsaWMgcmVxdWlyZXNDbGVhbnVwOiBib29sZWFuID0gdHJ1ZTtcclxuICBwdWJsaWMgc2hlbGw6IGJvb2xlYW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xyXG4gIHB1YmxpYyBkZWZhdWx0UGF0aHM6IHN0cmluZ1tdO1xyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogVm9ydGV4IEFQSVxyXG4gICoqKioqKioqKi9cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3QgYW4gaW5zdGFuY2UuXHJcbiAgICogQHBhcmFtIHtJRXh0ZW5zaW9uQ29udGV4dH0gY29udGV4dCAtLSBUaGUgVm9ydGV4IGV4dGVuc2lvbiBjb250ZXh0LlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgICAvLyBwcm9wZXJ0aWVzIHVzZWQgYnkgVm9ydGV4XHJcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgdGhpcy5yZXF1aXJlZEZpbGVzID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInXHJcbiAgICAgID8gWydTdGFyZGV3IFZhbGxleS5leGUnXVxyXG4gICAgICA6IFsnU3RhcmRld1ZhbGxleScsICdTdGFyZGV3VmFsbGV5LmV4ZSddO1xyXG5cclxuICAgIC8vIGN1c3RvbSBwcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmRlZmF1bHRQYXRocyA9IFtcclxuICAgICAgLy8gTGludXhcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvR09HIEdhbWVzL1N0YXJkZXcgVmFsbGV5L2dhbWUnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy8ubG9jYWwvc2hhcmUvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleScsXHJcblxyXG4gICAgICAvLyBNYWNcclxuICAgICAgJy9BcHBsaWNhdGlvbnMvU3RhcmRldyBWYWxsZXkuYXBwL0NvbnRlbnRzL01hY09TJyxcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0L1N0ZWFtL3N0ZWFtYXBwcy9jb21tb24vU3RhcmRldyBWYWxsZXkvQ29udGVudHMvTWFjT1MnLFxyXG5cclxuICAgICAgLy8gV2luZG93c1xyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxHYWxheHlDbGllbnRcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxHT0cgR2FsYXh5XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcU3RlYW1cXFxcc3RlYW1hcHBzXFxcXGNvbW1vblxcXFxTdGFyZGV3IFZhbGxleSdcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBc3luY2hyb25vdXNseSBmaW5kIHRoZSBnYW1lIGluc3RhbGwgcGF0aC5cclxuICAgKlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBxdWlja2x5IGFuZCwgaWYgaXQgcmV0dXJucyBhIHZhbHVlLCBpdCBzaG91bGQgZGVmaW5pdGl2ZWx5IGJlIHRoZVxyXG4gICAqIHZhbGlkIGdhbWUgcGF0aC4gVXN1YWxseSB0aGlzIGZ1bmN0aW9uIHdpbGwgcXVlcnkgdGhlIHBhdGggZnJvbSB0aGUgcmVnaXN0cnkgb3IgZnJvbSBzdGVhbS5cclxuICAgKiBUaGlzIGZ1bmN0aW9uIG1heSByZXR1cm4gYSBwcm9taXNlIGFuZCBpdCBzaG91bGQgZG8gdGhhdCBpZiBpdCdzIGRvaW5nIEkvTy5cclxuICAgKlxyXG4gICAqIFRoaXMgbWF5IGJlIGxlZnQgdW5kZWZpbmVkIGJ1dCB0aGVuIHRoZSB0b29sL2dhbWUgY2FuIG9ubHkgYmUgZGlzY292ZXJlZCBieSBzZWFyY2hpbmcgdGhlIGRpc2tcclxuICAgKiB3aGljaCBpcyBzbG93IGFuZCBvbmx5IGhhcHBlbnMgbWFudWFsbHkuXHJcbiAgICovXHJcbiAgcHVibGljIHF1ZXJ5UGF0aCA9IHRvQmx1ZShhc3luYyAoKSA9PiB7XHJcbiAgICAvLyBjaGVjayBTdGVhbVxyXG4gICAgY29uc3QgZ2FtZSA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFsnNDEzMTUwJywgJzE0NTMzNzUyNTMnLCAnQ29uY2VybmVkQXBlLlN0YXJkZXdWYWxsZXlQQyddKTtcclxuICAgIGlmIChnYW1lKVxyXG4gICAgICByZXR1cm4gZ2FtZS5nYW1lUGF0aDtcclxuXHJcbiAgICAvLyBjaGVjayBkZWZhdWx0IHBhdGhzXHJcbiAgICBmb3IgKGNvbnN0IGRlZmF1bHRQYXRoIG9mIHRoaXMuZGVmYXVsdFBhdGhzKVxyXG4gICAge1xyXG4gICAgICBpZiAoYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoZGVmYXVsdFBhdGgpKVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0UGF0aDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwYXRoIG9mIHRoZSB0b29sIGV4ZWN1dGFibGUgcmVsYXRpdmUgdG8gdGhlIHRvb2wgYmFzZSBwYXRoLCBpLmUuIGJpbmFyaWVzL1VUMy5leGUgb3JcclxuICAgKiBURVNWLmV4ZS4gVGhpcyBpcyBhIGZ1bmN0aW9uIHNvIHRoYXQgeW91IGNhbiByZXR1cm4gZGlmZmVyZW50IHRoaW5ncyBiYXNlZCBvbiB0aGUgb3BlcmF0aW5nXHJcbiAgICogc3lzdGVtIGZvciBleGFtcGxlIGJ1dCBiZSBhd2FyZSB0aGF0IGl0IHdpbGwgYmUgZXZhbHVhdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0IGFuZCBvbmx5IG9uY2UsXHJcbiAgICogc28gdGhlIHJldHVybiB2YWx1ZSBjYW4gbm90IGRlcGVuZCBvbiB0aGluZ3MgdGhhdCBjaGFuZ2UgYXQgcnVudGltZS5cclxuICAgKi9cclxuICBwdWJsaWMgZXhlY3V0YWJsZSgpIHtcclxuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyAnU3RhcmRldyBWYWxsZXkuZXhlJ1xyXG4gICAgICA6ICdTdGFyZGV3VmFsbGV5JztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgZGVmYXVsdCBkaXJlY3Rvcnkgd2hlcmUgbW9kcyBmb3IgdGhpcyBnYW1lIHNob3VsZCBiZSBzdG9yZWQuXHJcbiAgICogXHJcbiAgICogSWYgdGhpcyByZXR1cm5zIGEgcmVsYXRpdmUgcGF0aCB0aGVuIHRoZSBwYXRoIGlzIHRyZWF0ZWQgYXMgcmVsYXRpdmUgdG8gdGhlIGdhbWUgaW5zdGFsbGF0aW9uXHJcbiAgICogZGlyZWN0b3J5LiBTaW1wbHkgcmV0dXJuIGEgZG90ICggKCkgPT4gJy4nICkgaWYgbW9kcyBhcmUgaW5zdGFsbGVkIGRpcmVjdGx5IGludG8gdGhlIGdhbWVcclxuICAgKiBkaXJlY3RvcnkuXHJcbiAgICovIFxyXG4gIHB1YmxpYyBxdWVyeU1vZFBhdGgoKVxyXG4gIHtcclxuICAgIHJldHVybiBkZWZhdWx0TW9kc1JlbFBhdGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wdGlvbmFsIHNldHVwIGZ1bmN0aW9uLiBJZiB0aGlzIGdhbWUgcmVxdWlyZXMgc29tZSBmb3JtIG9mIHNldHVwIGJlZm9yZSBpdCBjYW4gYmUgbW9kZGVkIChsaWtlXHJcbiAgICogY3JlYXRpbmcgYSBkaXJlY3RvcnksIGNoYW5naW5nIGEgcmVnaXN0cnkga2V5LCAuLi4pIGRvIGl0IGhlcmUuIEl0IHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IHRpbWVcclxuICAgKiBiZWZvcmUgdGhlIGdhbWUgbW9kZSBpcyBhY3RpdmF0ZWQuXHJcbiAgICogQHBhcmFtIHtJRGlzY292ZXJ5UmVzdWx0fSBkaXNjb3ZlcnkgLS0gYmFzaWMgaW5mbyBhYm91dCB0aGUgZ2FtZSBiZWluZyBsb2FkZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldHVwID0gdG9CbHVlKGFzeW5jIChkaXNjb3ZlcnkpID0+IHtcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgZm9sZGVyIGZvciBTTUFQSSBtb2RzIGV4aXN0cy5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBkZWZhdWx0TW9kc1JlbFBhdGgoKSkpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gICAgLy8gc2tpcCBpZiBTTUFQSSBmb3VuZFxyXG4gICAgY29uc3Qgc21hcGlQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBTTUFQSV9FWEUpO1xyXG4gICAgY29uc3Qgc21hcGlGb3VuZCA9IGF3YWl0IHRoaXMuZ2V0UGF0aEV4aXN0c0FzeW5jKHNtYXBpUGF0aCk7XHJcbiAgICBpZiAoIXNtYXBpRm91bmQpIHtcclxuICAgICAgdGhpcy5yZWNvbW1lbmRTbWFwaSgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuXHJcbiAgICAvKlxyXG4gICAgaWYgKHN0YXRlLnNldHRpbmdzWydTRFYnXS51c2VSZWNvbW1lbmRhdGlvbnMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLmNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1Nob3cgUmVjb21tZW5kYXRpb25zPycsIHtcclxuICAgICAgICB0ZXh0OiAnVm9ydGV4IGNhbiBvcHRpb25hbGx5IHVzZSBkYXRhIGZyb20gU01BUElcXCdzIGRhdGFiYXNlIGFuZCAnXHJcbiAgICAgICAgICAgICsgJ3RoZSBtYW5pZmVzdCBmaWxlcyBpbmNsdWRlZCB3aXRoIG1vZHMgdG8gcmVjb21tZW5kIGFkZGl0aW9uYWwgJ1xyXG4gICAgICAgICAgICArICdjb21wYXRpYmxlIG1vZHMgdGhhdCB3b3JrIHdpdGggdGhvc2UgdGhhdCB5b3UgaGF2ZSBpbnN0YWxsZWQuICdcclxuICAgICAgICAgICAgKyAnSW4gc29tZSBjYXNlcywgdGhpcyBpbmZvcm1hdGlvbiBjb3VsZCBiZSB3cm9uZyBvciBpbmNvbXBsZXRlICdcclxuICAgICAgICAgICAgKyAnd2hpY2ggbWF5IGxlYWQgdG8gdW5yZWxpYWJsZSBwcm9tcHRzIHNob3dpbmcgaW4gdGhlIGFwcC5cXG4nXHJcbiAgICAgICAgICAgICsgJ0FsbCByZWNvbW1lbmRhdGlvbnMgc2hvd24gc2hvdWxkIGJlIGNhcmVmdWxseSBjb25zaWRlcmVkICdcclxuICAgICAgICAgICAgKyAnYmVmb3JlIGFjY2VwdGluZyB0aGVtIC0gaWYgeW91IGFyZSB1bnN1cmUgcGxlYXNlIGNoZWNrIHRoZSAnXHJcbiAgICAgICAgICAgICsgJ21vZCBwYWdlIHRvIHNlZSBpZiB0aGUgYXV0aG9yIGhhcyBwcm92aWRlZCBhbnkgZnVydGhlciBpbnN0cnVjdGlvbnMuICdcclxuICAgICAgICAgICAgKyAnV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIHRoaXMgZmVhdHVyZT8gWW91IGNhbiB1cGRhdGUgeW91ciBjaG9pY2UgJ1xyXG4gICAgICAgICAgICArICdmcm9tIHRoZSBTZXR0aW5ncyBtZW51IGF0IGFueSB0aW1lLidcclxuICAgICAgfSwgW1xyXG4gICAgICAgIHsgbGFiZWw6ICdDb250aW51ZSB3aXRob3V0IHJlY29tbWVuZGF0aW9ucycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRSZWNvbW1lbmRhdGlvbnMoZmFsc2UpKTtcclxuICAgICAgICB9IH0sXHJcbiAgICAgICAgeyBsYWJlbDogJ0VuYWJsZSByZWNvbW1lbmRhdGlvbnMnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UmVjb21tZW5kYXRpb25zKHRydWUpKTtcclxuICAgICAgICB9IH0sXHJcbiAgICAgIF0pXHJcbiAgICB9Ki9cclxuICB9KTtcclxuXHJcblxyXG4gIHByaXZhdGUgcmVjb21tZW5kU21hcGkoKSB7XHJcbiAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZCh0aGlzLmNvbnRleHQuYXBpKTtcclxuICAgIGNvbnN0IHRpdGxlID0gc21hcGlNb2QgPyAnU01BUEkgaXMgbm90IGRlcGxveWVkJyA6ICdTTUFQSSBpcyBub3QgaW5zdGFsbGVkJztcclxuICAgIGNvbnN0IGFjdGlvblRpdGxlID0gc21hcGlNb2QgPyAnRGVwbG95JyA6ICdHZXQgU01BUEknO1xyXG4gICAgY29uc3QgYWN0aW9uID0gKCkgPT4gKHNtYXBpTW9kXHJcbiAgICAgID8gZGVwbG95U01BUEkodGhpcy5jb250ZXh0LmFwaSlcclxuICAgICAgOiBkb3dubG9hZFNNQVBJKHRoaXMuY29udGV4dC5hcGkpKVxyXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmNvbnRleHQuYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKSk7XHJcblxyXG4gICAgdGhpcy5jb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6ICdzbWFwaS1taXNzaW5nJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZSxcclxuICAgICAgbWVzc2FnZTogJ1NNQVBJIGlzIHJlcXVpcmVkIHRvIG1vZCBTdGFyZGV3IFZhbGxleS4nLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6IGFjdGlvblRpdGxlLFxyXG4gICAgICAgICAgYWN0aW9uLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqKioqKioqKlxyXG4gICoqIEludGVybmFsIG1ldGhvZHNcclxuICAqKioqKioqKiovXHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGNoZWNrIHdoZXRoZXIgYSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoIGV4aXN0cy5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFRoZSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoLlxyXG4gICAqL1xyXG4gIGFzeW5jIGdldFBhdGhFeGlzdHNBc3luYyhwYXRoKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGgpO1xyXG4gICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZXJyKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IHJlYWQgYSByZWdpc3RyeSBrZXkgdmFsdWUuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhpdmUgLSBUaGUgcmVnaXN0cnkgaGl2ZSB0byBhY2Nlc3MuIFRoaXMgc2hvdWxkIGJlIGEgY29uc3RhbnQgbGlrZSBSZWdpc3RyeS5IS0xNLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgcmVnaXN0cnkga2V5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRvIHJlYWQuXHJcbiAgICovXHJcbiAgYXN5bmMgcmVhZFJlZ2lzdHJ5S2V5QXN5bmMoaGl2ZSwga2V5LCBuYW1lKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKGhpdmUsIGtleSwgbmFtZSk7XHJcbiAgICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdFBhdGgudmFsdWUpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSb290Rm9sZGVyKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBXZSBhc3N1bWUgdGhhdCBhbnkgbW9kIGNvbnRhaW5pbmcgXCIvQ29udGVudC9cIiBpbiBpdHMgZGlyZWN0b3J5XHJcbiAgLy8gIHN0cnVjdHVyZSBpcyBtZWFudCB0byBiZSBkZXBsb3llZCB0byB0aGUgcm9vdCBmb2xkZXIuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgIC5tYXAoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKSk7XHJcbiAgY29uc3QgY29udGVudERpciA9IGZpbHRlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGNvbnRlbnREaXIgIT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSb290Rm9sZGVyKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBXZSdyZSBnb2luZyB0byBkZXBsb3kgXCIvQ29udGVudC9cIiBhbmQgd2hhdGV2ZXIgZm9sZGVycyBjb21lIGFsb25nc2lkZSBpdC5cclxuICAvLyAgaS5lLiBTb21lTW9kLjd6XHJcbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvQ29udGVudC9cclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Nb2RzL1xyXG4gIC8vICBXaWxsIE5PVCBiZSBkZXBsb3llZCA9PiAuLi9SZWFkbWUuZG9jXHJcbiAgY29uc3QgY29udGVudEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3QgaWR4ID0gY29udGVudEZpbGUuaW5kZXhPZihQVFJOX0NPTlRFTlQpICsgMTtcclxuICBjb25zdCByb290RGlyID0gcGF0aC5iYXNlbmFtZShjb250ZW50RmlsZS5zdWJzdHJpbmcoMCwgaWR4KSk7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcClcclxuICAgICYmIChmaWxlLmluZGV4T2Yocm9vdERpcikgIT09IC0xKVxyXG4gICAgJiYgKHBhdGguZXh0bmFtZShmaWxlKSAhPT0gJy50eHQnKSk7XHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnN1YnN0cihpZHgpLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVmFsaWRNYW5pZmVzdChmaWxlUGF0aCkge1xyXG4gIGNvbnN0IHNlZ21lbnRzID0gZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgY29uc3QgaXNNYW5pZmVzdEZpbGUgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gTUFOSUZFU1RfRklMRTtcclxuICBjb25zdCBpc0xvY2FsZSA9IHNlZ21lbnRzLmluY2x1ZGVzKCdsb2NhbGUnKTtcclxuICByZXR1cm4gaXNNYW5pZmVzdEZpbGUgJiYgIWlzTG9jYWxlO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoaXNWYWxpZE1hbmlmZXN0KSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIHByZWZpeCBmYWtlIGRpcmVjdG9yeSBqdXN0IGluIGNhc2UgdGhlIGNvbnRlbnRcclxuICAgICAgLy8gIGZvbGRlciBpcyBpbiB0aGUgYXJjaGl2ZSdzIHJvb3QgZm9sZGVyLiBUaGlzIGlzIHRvIGVuc3VyZSB3ZVxyXG4gICAgICAvLyAgZmluZCBhIG1hdGNoIGZvciBcIi9Db250ZW50L1wiXHJcbiAgICAgIGNvbnN0IHRlc3RGaWxlID0gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSk7XHJcbiAgICAgIHJldHVybiAodGVzdEZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgICB9KSA9PT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoYXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lNYW5hZ2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFRoZSBhcmNoaXZlIG1heSBjb250YWluIG11bHRpcGxlIG1hbmlmZXN0IGZpbGVzIHdoaWNoIHdvdWxkXHJcbiAgLy8gIGltcGx5IHRoYXQgd2UncmUgaW5zdGFsbGluZyBtdWx0aXBsZSBtb2RzLlxyXG4gIGNvbnN0IG1hbmlmZXN0RmlsZXMgPSBmaWxlcy5maWx0ZXIoaXNWYWxpZE1hbmlmZXN0KTtcclxuXHJcbiAgaW50ZXJmYWNlIElNb2RJbmZvIHtcclxuICAgIG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3Q7XHJcbiAgICByb290Rm9sZGVyOiBzdHJpbmc7XHJcbiAgICBtYW5pZmVzdEluZGV4OiBudW1iZXI7XHJcbiAgICBtb2RGaWxlczogc3RyaW5nW107XHJcbiAgfVxyXG5cclxuICBsZXQgcGFyc2VFcnJvcjogRXJyb3I7XHJcblxyXG4gIGF3YWl0IGRlcGVuZGVuY3lNYW5hZ2VyLnNjYW5NYW5pZmVzdHModHJ1ZSk7XHJcbiAgbGV0IG1vZHM6IElNb2RJbmZvW10gPSBhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdEZpbGVzLm1hcChhc3luYyBtYW5pZmVzdEZpbGUgPT4ge1xyXG4gICAgY29uc3Qgcm9vdEZvbGRlciA9IHBhdGguZGlybmFtZShtYW5pZmVzdEZpbGUpO1xyXG4gICAgY29uc3Qgcm9vdFNlZ21lbnRzID0gcm9vdEZvbGRlci50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIGNvbnN0IG1hbmlmZXN0SW5kZXggPSBtYW5pZmVzdEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKE1BTklGRVNUX0ZJTEUpO1xyXG4gICAgY29uc3QgZmlsdGVyRnVuYyA9IChmaWxlOiBzdHJpbmcpID0+IHtcclxuICAgICAgY29uc3QgaXNGaWxlID0gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApICYmIHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGZpbGUpKSAhPT0gJyc7XHJcbiAgICAgIGNvbnN0IGZpbGVTZWdtZW50cyA9IGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGNvbnN0IGlzSW5Sb290Rm9sZGVyID0gKHJvb3RTZWdtZW50cy5sZW5ndGggPiAwKVxyXG4gICAgICAgID8gZmlsZVNlZ21lbnRzPy5bcm9vdFNlZ21lbnRzLmxlbmd0aCAtIDFdID09PSByb290U2VnbWVudHNbcm9vdFNlZ21lbnRzLmxlbmd0aCAtIDFdXHJcbiAgICAgICAgOiB0cnVlO1xyXG4gICAgICByZXR1cm4gaXNJblJvb3RGb2xkZXIgJiYgaXNGaWxlO1xyXG4gICAgfTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPVxyXG4gICAgICAgIGF3YWl0IHBhcnNlTWFuaWZlc3QocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbWFuaWZlc3RGaWxlKSk7XHJcbiAgICAgIGNvbnN0IG1vZEZpbGVzID0gZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIG1hbmlmZXN0LFxyXG4gICAgICAgIHJvb3RGb2xkZXIsXHJcbiAgICAgICAgbWFuaWZlc3RJbmRleCxcclxuICAgICAgICBtb2RGaWxlcyxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBqdXN0IGEgd2FybmluZyBhdCB0aGlzIHBvaW50IGFzIHRoaXMgbWF5IG5vdCBiZSB0aGUgbWFpbiBtYW5pZmVzdCBmb3IgdGhlIG1vZFxyXG4gICAgICBsb2coJ3dhcm4nLCAnRmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBtYW5pZmVzdEZpbGUsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgcGFyc2VFcnJvciA9IGVycjtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICB9KSk7XHJcblxyXG4gIG1vZHMgPSBtb2RzLmZpbHRlcih4ID0+IHggIT09IHVuZGVmaW5lZCk7XHJcbiAgXHJcbiAgaWYgKG1vZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxyXG4gICAgICAnVGhlIG1vZCBtYW5pZmVzdCBpcyBpbnZhbGlkIGFuZCBjYW5cXCd0IGJlIHJlYWQuIFlvdSBjYW4gdHJ5IHRvIGluc3RhbGwgdGhlIG1vZCBhbnl3YXkgdmlhIHJpZ2h0LWNsaWNrIC0+IFwiVW5wYWNrIChhcy1pcylcIicsXHJcbiAgICAgIHBhcnNlRXJyb3IsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQubWFwKG1vZHMsIG1vZCA9PiB7XHJcbiAgICAvLyBUT0RPOiB3ZSBtaWdodCBnZXQgaGVyZSB3aXRoIGEgbW9kIHRoYXQgaGFzIGEgbWFuaWZlc3QuanNvbiBmaWxlIGJ1dCB3YXNuJ3QgaW50ZW5kZWQgZm9yIFN0YXJkZXcgVmFsbGV5LCBhbGxcclxuICAgIC8vICB0aHVuZGVyc3RvcmUgbW9kcyB3aWxsIGNvbnRhaW4gYSBtYW5pZmVzdC5qc29uIGZpbGVcclxuICAgIGNvbnN0IG1vZE5hbWUgPSAobW9kLnJvb3RGb2xkZXIgIT09ICcuJylcclxuICAgICAgPyBtb2Qucm9vdEZvbGRlclxyXG4gICAgICA6IG1vZC5tYW5pZmVzdC5OYW1lID8/IG1vZC5yb290Rm9sZGVyO1xyXG5cclxuICAgIGlmIChtb2ROYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1vZC5tYW5pZmVzdC5EZXBlbmRlbmNpZXMgfHwgW107XHJcblxyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBtb2QubW9kRmlsZXMpIHtcclxuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4obW9kTmFtZSwgZmlsZS5zdWJzdHIobW9kLm1hbmlmZXN0SW5kZXgpKTtcclxuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhZGRSdWxlRm9yRGVwZW5kZW5jeSA9IChkZXA6IElTRFZEZXBlbmRlbmN5KSA9PiB7XHJcbiAgICAgIGlmICgoZGVwLlVuaXF1ZUlEID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICB8fCAoZGVwLlVuaXF1ZUlELnRvTG93ZXJDYXNlKCkgPT09ICd5b3VybmFtZS55b3Vyb3RoZXJzcGFja3NhbmRtb2RzJykpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHZlcnNpb25NYXRjaCA9IGRlcC5NaW5pbXVtVmVyc2lvbiAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgPyBgPj0ke2RlcC5NaW5pbXVtVmVyc2lvbn1gXHJcbiAgICAgICAgOiAnKic7XHJcbiAgICAgIGNvbnN0IHJ1bGU6IHR5cGVzLklNb2RSdWxlID0ge1xyXG4gICAgICAgIC8vIHRyZWF0aW5nIGFsbCBkZXBlbmRlbmNpZXMgYXMgcmVjb21tZW5kYXRpb25zIGJlY2F1c2UgdGhlIGRlcGVuZGVuY3kgaW5mb3JtYXRpb25cclxuICAgICAgICAvLyBwcm92aWRlZCBieSBzb21lIG1vZCBhdXRob3JzIGlzIGEgYml0IGhpdC1hbmQtbWlzcyBhbmQgVm9ydGV4IGZhaXJseSBhZ2dyZXNzaXZlbHlcclxuICAgICAgICAvLyBlbmZvcmNlcyByZXF1aXJlbWVudHNcclxuICAgICAgICAvLyB0eXBlOiAoZGVwLklzUmVxdWlyZWQgPz8gdHJ1ZSkgPyAncmVxdWlyZXMnIDogJ3JlY29tbWVuZHMnLFxyXG4gICAgICAgIHR5cGU6ICdyZWNvbW1lbmRzJyxcclxuICAgICAgICByZWZlcmVuY2U6IHtcclxuICAgICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogZGVwLlVuaXF1ZUlELnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICB2ZXJzaW9uTWF0Y2gsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBleHRyYToge1xyXG4gICAgICAgICAgb25seUlmRnVsZmlsbGFibGU6IHRydWUsXHJcbiAgICAgICAgICBhdXRvbWF0aWM6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfTtcclxuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdydWxlJyxcclxuICAgICAgICBydWxlLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgaWYgKGFwaS5nZXRTdGF0ZSgpLnNldHRpbmdzWydTRFYnXT8udXNlUmVjb21tZW5kYXRpb25zID8/IGZhbHNlKSB7XHJcbiAgICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcGVuZGVuY2llcykge1xyXG4gICAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KGRlcCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0ZvciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3kobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yKTtcclxuICAgICAgfVxyXG4gICAgfSovXHJcbiAgICByZXR1cm4gaW5zdHJ1Y3Rpb25zO1xyXG4gIH0pXHJcbiAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gW10uY29uY2F0KGRhdGEpLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IGFjY3VtLmNvbmNhdChpdGVyKSwgW10pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzU01BUElNb2RUeXBlKGluc3RydWN0aW9ucykge1xyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGV4ZSBmaWxlLlxyXG4gIGNvbnN0IHNtYXBpRGF0YSA9IGluc3RydWN0aW9ucy5maW5kKGluc3QgPT4gKGluc3QudHlwZSA9PT0gJ2NvcHknKSAmJiBpbnN0LnNvdXJjZS5lbmRzV2l0aChTTUFQSV9FWEUpKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoc21hcGlEYXRhICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U01BUEkoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIE1ha2Ugc3VyZSB0aGUgZG93bmxvYWQgY29udGFpbnMgdGhlIFNNQVBJIGRhdGEgYXJjaGl2ZS5zXHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PlxyXG4gICAgcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gU01BUElfRExMKSAhPT0gdW5kZWZpbmVkKVxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgICAgc3VwcG9ydGVkLFxyXG4gICAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFNNQVBJKGdldERpc2NvdmVyeVBhdGgsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICBjb25zdCBmb2xkZXIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInXHJcbiAgICA/ICd3aW5kb3dzJ1xyXG4gICAgOiBwcm9jZXNzLnBsYXRmb3JtID09PSAnbGludXgnXHJcbiAgICAgID8gJ2xpbnV4J1xyXG4gICAgICA6ICdtYWNvcyc7XHJcbiAgY29uc3QgZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybSA9IChmaWxlKSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgcmV0dXJuIChzZWdtZW50cy5pbmNsdWRlcyhmb2xkZXIpKTtcclxuICB9XHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZGF0YSBhcmNoaXZlXHJcbiAgY29uc3QgZGF0YUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4ge1xyXG4gICAgY29uc3QgaXNDb3JyZWN0UGxhdGZvcm0gPSBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtKGZpbGUpO1xyXG4gICAgcmV0dXJuIGlzQ29ycmVjdFBsYXRmb3JtICYmIFNNQVBJX0RBVEEuaW5jbHVkZXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKVxyXG4gIH0pO1xyXG4gIGlmIChkYXRhRmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBmaW5kIHRoZSBTTUFQSSBkYXRhIGZpbGVzIC0gZG93bmxvYWQgYXBwZWFycyAnXHJcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XHJcbiAgfVxyXG4gIGxldCBkYXRhID0gJyc7XHJcbiAgdHJ5IHtcclxuICAgIGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihnZXREaXNjb3ZlcnlQYXRoKCksICdTdGFyZGV3IFZhbGxleS5kZXBzLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgU0RWIGRlcGVuZGVuY2llcycsIGVycik7XHJcbiAgfVxyXG5cclxuICAvLyBmaWxlIHdpbGwgYmUgb3V0ZGF0ZWQgYWZ0ZXIgdGhlIHdhbGsgb3BlcmF0aW9uIHNvIHByZXBhcmUgYSByZXBsYWNlbWVudC4gXHJcbiAgY29uc3QgdXBkYXRlZEZpbGVzID0gW107XHJcblxyXG4gIGNvbnN0IHN6aXAgPSBuZXcgU2V2ZW5aaXAoKTtcclxuICAvLyBVbnppcCB0aGUgZmlsZXMgZnJvbSB0aGUgZGF0YSBhcmNoaXZlLiBUaGlzIGRvZXNuJ3Qgc2VlbSB0byBiZWhhdmUgYXMgZGVzY3JpYmVkIGhlcmU6IGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL25vZGUtN3ojZXZlbnRzXHJcbiAgYXdhaXQgc3ppcC5leHRyYWN0RnVsbChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBkYXRhRmlsZSksIGRlc3RpbmF0aW9uUGF0aCk7XHJcblxyXG4gIC8vIEZpbmQgYW55IGZpbGVzIHRoYXQgYXJlIG5vdCBpbiB0aGUgcGFyZW50IGZvbGRlci4gXHJcbiAgYXdhaXQgdXRpbC53YWxrKGRlc3RpbmF0aW9uUGF0aCwgKGl0ZXIsIHN0YXRzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRlc3RpbmF0aW9uUGF0aCwgaXRlcik7XHJcbiAgICAgIC8vIEZpbHRlciBvdXQgZmlsZXMgZnJvbSB0aGUgb3JpZ2luYWwgaW5zdGFsbCBhcyB0aGV5J3JlIG5vIGxvbmdlciByZXF1aXJlZC5cclxuICAgICAgaWYgKCFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoKSAmJiBzdGF0cy5pc0ZpbGUoKSAmJiAhZmlsZXMuaW5jbHVkZXMocmVsUGF0aCtwYXRoLnNlcCkpIHVwZGF0ZWRGaWxlcy5wdXNoKHJlbFBhdGgpO1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IHJlbFBhdGgudG9Mb2NhbGVMb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGNvbnN0IG1vZHNGb2xkZXJJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICAgIGlmICgobW9kc0ZvbGRlcklkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzRm9sZGVySWR4ICsgMSkpIHtcclxuICAgICAgICBfU01BUElfQlVORExFRF9NT0RTLnB1c2goc2VnbWVudHNbbW9kc0ZvbGRlcklkeCArIDFdKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS4gXHJcbiAgY29uc3Qgc21hcGlFeGUgPSB1cGRhdGVkRmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5lbmRzV2l0aChTTUFQSV9FWEUudG9Mb3dlckNhc2UoKSkpO1xyXG4gIGlmIChzbWFwaUV4ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBleHRyYWN0ICR7U01BUElfRVhFfSAtIGRvd25sb2FkIGFwcGVhcnMgYFxyXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xyXG4gIH1cclxuICBjb25zdCBpZHggPSBzbWFwaUV4ZS5pbmRleE9mKHBhdGguYmFzZW5hbWUoc21hcGlFeGUpKTtcclxuXHJcbiAgLy8gQnVpbGQgdGhlIGluc3RydWN0aW9ucyBmb3IgaW5zdGFsbGF0aW9uLiBcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gdXBkYXRlZEZpbGVzLm1hcChmaWxlID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oZmlsZS5zdWJzdHIoaWR4KSksXHJcbiAgICAgIH1cclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICBrZXk6ICdzbWFwaUJ1bmRsZWRNb2RzJyxcclxuICAgIHZhbHVlOiBnZXRCdW5kbGVkTW9kcygpLFxyXG4gIH0pO1xyXG5cclxuICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICB0eXBlOiAnZ2VuZXJhdGVmaWxlJyxcclxuICAgIGRhdGEsXHJcbiAgICBkZXN0aW5hdGlvbjogJ1N0YXJkZXdNb2RkaW5nQVBJLmRlcHMuanNvbicsXHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBsb2dGaWxlKSB7XHJcbiAgY29uc3QgbG9nRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGJhc2VQYXRoLCBsb2dGaWxlKSwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KTtcclxuICBhd2FpdCBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdTTUFQSSBMb2cnLCB7XHJcbiAgICB0ZXh0OiAnWW91ciBTTUFQSSBsb2cgaXMgZGlzcGxheWVkIGJlbG93LiBUbyBzaGFyZSBpdCwgY2xpY2sgXCJDb3B5ICYgU2hhcmVcIiB3aGljaCB3aWxsIGNvcHkgaXQgdG8geW91ciBjbGlwYm9hcmQgYW5kIG9wZW4gdGhlIFNNQVBJIGxvZyBzaGFyaW5nIHdlYnNpdGUuICcgK1xyXG4gICAgICAnTmV4dCwgcGFzdGUgeW91ciBjb2RlIGludG8gdGhlIHRleHQgYm94IGFuZCBwcmVzcyBcInNhdmUgJiBwYXJzZSBsb2dcIi4gWW91IGNhbiBub3cgc2hhcmUgYSBsaW5rIHRvIHRoaXMgcGFnZSB3aXRoIG90aGVycyBzbyB0aGV5IGNhbiBzZWUgeW91ciBsb2cgZmlsZS5cXG5cXG4nICsgbG9nRGF0YVxyXG4gIH0sIFt7XHJcbiAgICBsYWJlbDogJ0NvcHkgJiBTaGFyZSBsb2cnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL14uK1QoW15cXC5dKykuKy8sICckMScpO1xyXG4gICAgICBjbGlwYm9hcmQud3JpdGVUZXh0KGBbJHt0aW1lc3RhbXB9IElORk8gVm9ydGV4XSBMb2cgZXhwb3J0ZWQgYnkgVm9ydGV4ICR7dXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb259LlxcbmAgKyBsb2dEYXRhKTtcclxuICAgICAgcmV0dXJuIHV0aWwub3BuKCdodHRwczovL3NtYXBpLmlvL2xvZycpLmNhdGNoKGVyciA9PiB1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH0sIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gdW5kZWZpbmVkIH1dKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25TaG93U01BUElMb2coYXBpKSB7XHJcbiAgLy9SZWFkIGFuZCBkaXNwbGF5IHRoZSBsb2cuXHJcbiAgY29uc3QgYmFzZVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdhcHBEYXRhJyksICdzdGFyZGV3dmFsbGV5JywgJ2Vycm9ybG9ncycpO1xyXG4gIHRyeSB7XHJcbiAgICAvL0lmIHRoZSBjcmFzaCBsb2cgZXhpc3RzLCBzaG93IHRoYXQuXHJcbiAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1jcmFzaC50eHRcIik7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAvL090aGVyd2lzZSBzaG93IHRoZSBub3JtYWwgbG9nLlxyXG4gICAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1sYXRlc3QudHh0XCIpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vT3IgSW5mb3JtIHRoZSB1c2VyIHRoZXJlIGFyZSBubyBsb2dzLlxyXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7IHR5cGU6ICdpbmZvJywgdGl0bGU6ICdObyBTTUFQSSBsb2dzIGZvdW5kLicsIG1lc3NhZ2U6ICcnLCBkaXNwbGF5TVM6IDUwMDAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBjb25zdCBtYW5pZmVzdHM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gIGlmIChtb2RQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xyXG4gICAgICBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09ICdtYW5pZmVzdC5qc29uJykge1xyXG4gICAgICAgIG1hbmlmZXN0cy5wdXNoKGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KVxyXG4gICAgLnRoZW4oKCkgPT4gbWFuaWZlc3RzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlQ29uZmxpY3RJbmZvKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYXBpOiBTTUFQSVByb3h5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RJZDogc3RyaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBtb2QgPSBhcGkuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZUlkXVttb2RJZF07XHJcblxyXG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgaWYgKChub3cgLSBtb2QuYXR0cmlidXRlcz8ubGFzdFNNQVBJUXVlcnkgPz8gMCkgPCBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGxldCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IG1vZC5hdHRyaWJ1dGVzPy5hZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcztcclxuICBpZiAoIWFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzKSB7XHJcbiAgICBpZiAobW9kLmF0dHJpYnV0ZXM/LmxvZ2ljYWxGaWxlTmFtZSkge1xyXG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFttb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBxdWVyeSA9IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzXHJcbiAgICAubWFwKG5hbWUgPT4ge1xyXG4gICAgICBjb25zdCByZXMgPSB7XHJcbiAgICAgICAgaWQ6IG5hbWUsXHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IHZlciA9IG1vZC5hdHRyaWJ1dGVzPy5tYW5pZmVzdFZlcnNpb25cclxuICAgICAgICAgICAgICAgICAgICAgPz8gc2VtdmVyLmNvZXJjZShtb2QuYXR0cmlidXRlcz8udmVyc2lvbik/LnZlcnNpb247XHJcbiAgICAgIGlmICghIXZlcikge1xyXG4gICAgICAgIHJlc1snaW5zdGFsbGVkVmVyc2lvbiddID0gdmVyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHN0YXQgPSAoaXRlbTogSVNNQVBJUmVzdWx0KTogQ29tcGF0aWJpbGl0eVN0YXR1cyA9PiB7XHJcbiAgICBjb25zdCBzdGF0dXMgPSBpdGVtLm1ldGFkYXRhPy5jb21wYXRpYmlsaXR5U3RhdHVzPy50b0xvd2VyQ2FzZT8uKCk7XHJcbiAgICBpZiAoIWNvbXBhdGliaWxpdHlPcHRpb25zLmluY2x1ZGVzKHN0YXR1cyBhcyBhbnkpKSB7XHJcbiAgICAgIHJldHVybiAndW5rbm93bic7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc3RhdHVzIGFzIENvbXBhdGliaWxpdHlTdGF0dXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgY29tcGF0aWJpbGl0eVByaW8gPSAoaXRlbTogSVNNQVBJUmVzdWx0KSA9PiBjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmRleE9mKHN0YXQoaXRlbSkpO1xyXG5cclxuICByZXR1cm4gc21hcGkuZmluZEJ5TmFtZXMocXVlcnkpXHJcbiAgICAudGhlbihyZXN1bHRzID0+IHtcclxuICAgICAgY29uc3Qgd29yc3RTdGF0dXM6IElTTUFQSVJlc3VsdFtdID0gcmVzdWx0c1xyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gY29tcGF0aWJpbGl0eVByaW8obGhzKSAtIGNvbXBhdGliaWxpdHlQcmlvKHJocykpO1xyXG4gICAgICBpZiAod29yc3RTdGF0dXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZXMoZ2FtZUlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgbGFzdFNNQVBJUXVlcnk6IG5vdyxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlTdGF0dXM6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5TWVzc2FnZTogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN1bW1hcnksXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5VXBkYXRlOiB3b3JzdFN0YXR1c1swXS5zdWdnZXN0ZWRVcGRhdGU/LnZlcnNpb24sXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvZygnZGVidWcnLCAnbm8gbWFuaWZlc3QnKTtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCd3YXJuJywgJ2Vycm9yIHJlYWRpbmcgbWFuaWZlc3QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgbGV0IGRlcGVuZGVuY3lNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcjtcclxuICBjb25zdCBnZXREaXNjb3ZlcnlQYXRoID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXHJcbiAgICAgIGxvZygnZXJyb3InLCAnc3RhcmRld3ZhbGxleSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfVxyXG5cclxuICBjb25zdCBnZXRTTUFQSVBhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9O1xyXG5cclxuICBjb25zdCBtYW5pZmVzdEV4dHJhY3RvciA9IHRvQmx1ZShcclxuICAgIGFzeW5jIChtb2RJbmZvOiBhbnksIG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHsgW2tleTogc3RyaW5nXTogYW55OyB9PiA9PiB7XHJcbiAgICAgIGlmIChzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhcnNlZE1hbmlmZXN0cyA9IChhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdHMubWFwKFxyXG4gICAgICAgIGFzeW5jIG1hbmlmZXN0ID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBwYXJzZU1hbmlmZXN0KG1hbmlmZXN0KTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBsb2coJ3dhcm4nLCAnRmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBtYW5pZmVzdEZpbGU6IG1hbmlmZXN0LCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSkpKS5maWx0ZXIobWFuaWZlc3QgPT4gbWFuaWZlc3QgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gICAgICBpZiAocGFyc2VkTWFuaWZlc3RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3ZSBjYW4gb25seSB1c2Ugb25lIG1hbmlmZXN0IHRvIGdldCB0aGUgaWQgZnJvbVxyXG4gICAgICBjb25zdCByZWZNYW5pZmVzdCA9IHBhcnNlZE1hbmlmZXN0c1swXTtcclxuXHJcbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gcGFyc2VkTWFuaWZlc3RzXHJcbiAgICAgICAgLmZpbHRlcihtYW5pZmVzdCA9PiBtYW5pZmVzdC5VbmlxdWVJRCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSk7XHJcblxyXG4gICAgICBjb25zdCBtaW5TTUFQSVZlcnNpb24gPSBwYXJzZWRNYW5pZmVzdHNcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0Lk1pbmltdW1BcGlWZXJzaW9uKVxyXG4gICAgICAgIC5maWx0ZXIodmVyc2lvbiA9PiBzZW12ZXIudmFsaWQodmVyc2lvbikpXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMsIGxocykpWzBdO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0ge1xyXG4gICAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzLFxyXG4gICAgICAgIG1pblNNQVBJVmVyc2lvbixcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChyZWZNYW5pZmVzdCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gZG9uJ3Qgc2V0IGEgY3VzdG9tIGZpbGUgbmFtZSBmb3IgU01BUElcclxuICAgICAgICBpZiAobW9kSW5mby5kb3dubG9hZC5tb2RJbmZvPy5uZXh1cz8uaWRzPy5tb2RJZCAhPT0gMjQwMCkge1xyXG4gICAgICAgICAgcmVzdWx0WydjdXN0b21GaWxlTmFtZSddID0gcmVmTWFuaWZlc3QuTmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgKHJlZk1hbmlmZXN0LlZlcnNpb24pID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgcmVzdWx0WydtYW5pZmVzdFZlcnNpb24nXSA9IHJlZk1hbmlmZXN0LlZlcnNpb247XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUobmV3IFN0YXJkZXdWYWxsZXkoY29udGV4dCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnU0RWJ10sIHNkdlJlZHVjZXJzKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MsICgpID0+ICh7XHJcbiAgICBvbk1lcmdlQ29uZmlnVG9nZ2xlOiBhc3luYyAocHJvZmlsZUlkOiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgaWYgKCFlbmFibGVkKSB7XHJcbiAgICAgICAgYXdhaXQgb25SZXZlcnRGaWxlcyhjb250ZXh0LmFwaSwgcHJvZmlsZUlkKTtcclxuICAgICAgICBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHsgdHlwZTogJ2luZm8nLCBtZXNzYWdlOiAnTW9kIGNvbmZpZ3MgcmV0dXJuZWQgdG8gdGhlaXIgcmVzcGVjdGl2ZSBtb2RzJywgZGlzcGxheU1TOiA1MDAwIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldE1lcmdlQ29uZmlncyhwcm9maWxlSWQsIGVuYWJsZWQpKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG4gIH0pLCAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELCAxNTApO1xyXG5cclxuICAvLyBSZWdpc3RlciBvdXIgU01BUEkgbW9kIHR5cGUgYW5kIGluc3RhbGxlci4gTm90ZTogVGhpcyBjdXJyZW50bHkgZmxhZ3MgYW4gZXJyb3IgaW4gVm9ydGV4IG9uIGluc3RhbGxpbmcgY29ycmVjdGx5LlxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NtYXBpLWluc3RhbGxlcicsIDMwLCB0ZXN0U01BUEksIChmaWxlcywgZGVzdCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3QpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2R2cm9vdGZvbGRlcicsIDUwLCB0ZXN0Um9vdEZvbGRlciwgaW5zdGFsbFJvb3RGb2xkZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3N0YXJkZXctdmFsbGV5LWluc3RhbGxlcicsIDUwLCB0ZXN0U3VwcG9ydGVkLFxyXG4gICAgKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdTTUFQSScsIDMwLCBnYW1lSWQgPT4gZ2FtZUlkID09PSBHQU1FX0lELCBnZXRTTUFQSVBhdGgsIGlzU01BUElNb2RUeXBlKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9DT05GSUcsIDMwLCAoZ2FtZUlkKSA9PiAoZ2FtZUlkID09PSBHQU1FX0lEKSxcclxuICAgICgpID0+IHBhdGguam9pbihnZXREaXNjb3ZlcnlQYXRoKCksIGRlZmF1bHRNb2RzUmVsUGF0aCgpKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdzZHZyb290Zm9sZGVyJywgMjUsIChnYW1lSWQpID0+IChnYW1lSWQgPT09IEdBTUVfSUQpLFxyXG4gICAgKCkgPT4gZ2V0RGlzY292ZXJ5UGF0aCgpLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XHJcbiAgICAgIC8vIE9ubHkgaW50ZXJlc3RlZCBpbiBjb3B5IGluc3RydWN0aW9ucy5cclxuICAgICAgY29uc3QgY29weUluc3RydWN0aW9ucyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gaW5zdHIudHlwZSA9PT0gJ2NvcHknKTtcclxuICAgICAgLy8gVGhpcyBpcyBhIHRyaWNreSBwYXR0ZXJuIHNvIHdlJ3JlIGdvaW5nIHRvIDFzdCBwcmVzZW50IHRoZSBkaWZmZXJlbnQgcGFja2FnaW5nXHJcbiAgICAgIC8vICBwYXR0ZXJucyB3ZSBuZWVkIHRvIGNhdGVyIGZvcjpcclxuICAgICAgLy8gIDEuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlci4gRG9lcyBub3QgcmVxdWlyZSBTTUFQSSBzbyBub1xyXG4gICAgICAvLyAgICBtYW5pZmVzdCBmaWxlcyBhcmUgaW5jbHVkZWQuXHJcbiAgICAgIC8vICAyLiBSZXBsYWNlbWVudCBtb2Qgd2l0aCBcIkNvbnRlbnRcIiBmb2xkZXIgKyBvbmUgb3IgbW9yZSBTTUFQSSBtb2RzIGluY2x1ZGVkXHJcbiAgICAgIC8vICAgIGFsb25nc2lkZSB0aGUgQ29udGVudCBmb2xkZXIgaW5zaWRlIGEgXCJNb2RzXCIgZm9sZGVyLlxyXG4gICAgICAvLyAgMy4gQSByZWd1bGFyIFNNQVBJIG1vZCB3aXRoIGEgXCJDb250ZW50XCIgZm9sZGVyIGluc2lkZSB0aGUgbW9kJ3Mgcm9vdCBkaXIuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIHBhdHRlcm4gMTpcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGRvbid0IGhhdmUgbWFuaWZlc3QgZmlsZXNcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGhhdmUgYSBcIkNvbnRlbnRcIiBmb2xkZXJcclxuICAgICAgLy9cclxuICAgICAgLy8gVG8gc29sdmUgcGF0dGVybnMgMiBhbmQgMyB3ZSdyZSBnb2luZyB0bzpcclxuICAgICAgLy8gIENoZWNrIHdoZXRoZXIgd2UgaGF2ZSBhbnkgbWFuaWZlc3QgZmlsZXMsIGlmIHdlIGRvLCB3ZSBleHBlY3QgdGhlIGZvbGxvd2luZ1xyXG4gICAgICAvLyAgICBhcmNoaXZlIHN0cnVjdHVyZSBpbiBvcmRlciBmb3IgdGhlIG1vZFR5cGUgdG8gZnVuY3Rpb24gY29ycmVjdGx5OlxyXG4gICAgICAvLyAgICBhcmNoaXZlLnppcCA9PlxyXG4gICAgICAvLyAgICAgIC4uL0NvbnRlbnQvXHJcbiAgICAgIC8vICAgICAgLi4vTW9kcy9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL0FfU01BUElfTU9EXFxtYW5pZmVzdC5qc29uXHJcbiAgICAgIGNvbnN0IGhhc01hbmlmZXN0ID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uZW5kc1dpdGgoTUFOSUZFU1RfRklMRSkpXHJcbiAgICAgIGNvbnN0IGhhc01vZHNGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5zdGFydHNXaXRoKGRlZmF1bHRNb2RzUmVsUGF0aCgpICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBoYXNDb250ZW50Rm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnQ29udGVudCcgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWRcclxuXHJcbiAgICAgIHJldHVybiAoaGFzTWFuaWZlc3QpXHJcbiAgICAgICAgPyBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIgJiYgaGFzTW9kc0ZvbGRlcilcclxuICAgICAgICA6IEJsdWViaXJkLnJlc29sdmUoaGFzQ29udGVudEZvbGRlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgcmVnaXN0ZXJDb25maWdNb2QoY29udGV4dClcclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCA5OTksICdjaGFuZ2Vsb2cnLCB7fSwgJ1NNQVBJIExvZycsXHJcbiAgICAoKSA9PiB7IG9uU2hvd1NNQVBJTG9nKGNvbnRleHQuYXBpKTsgfSxcclxuICAgICgpID0+IHtcclxuICAgICAgLy9Pbmx5IHNob3cgdGhlIFNNQVBJIGxvZyBidXR0b24gZm9yIFNEVi4gXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckF0dHJpYnV0ZUV4dHJhY3RvcigyNSwgbWFuaWZlc3RFeHRyYWN0b3IpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyVGFibGVBdHRyaWJ1dGUoJ21vZHMnLCB7XHJcbiAgICBpZDogJ3Nkdi1jb21wYXRpYmlsaXR5JyxcclxuICAgIHBvc2l0aW9uOiAxMDAsXHJcbiAgICBjb25kaXRpb246ICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsXHJcbiAgICBwbGFjZW1lbnQ6ICd0YWJsZScsXHJcbiAgICBjYWxjOiAobW9kOiB0eXBlcy5JTW9kKSA9PiBtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVN0YXR1cyxcclxuICAgIGN1c3RvbVJlbmRlcmVyOiAobW9kOiB0eXBlcy5JTW9kLCBkZXRhaWxDZWxsOiBib29sZWFuLCB0OiB0eXBlcy5URnVuY3Rpb24pID0+IHtcclxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tcGF0aWJpbGl0eUljb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdCwgbW9kLCBkZXRhaWxDZWxsIH0sIFtdKTtcclxuICAgIH0sXHJcbiAgICBuYW1lOiAnQ29tcGF0aWJpbGl0eScsXHJcbiAgICBpc0RlZmF1bHRWaXNpYmxlOiB0cnVlLFxyXG4gICAgZWRpdDoge30sXHJcbiAgfSk7XHJcblxyXG4gIC8qXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3Nkdi1taXNzaW5nLWRlcGVuZGVuY2llcycsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gdGVzdE1pc3NpbmdEZXBlbmRlbmNpZXMoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSk7XHJcbiAgKi9cclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LWluY29tcGF0aWJsZS1tb2RzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RTTUFQSU91dGRhdGVkKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpKTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnN0IHByb3h5ID0gbmV3IFNNQVBJUHJveHkoY29udGV4dC5hcGkpO1xyXG4gICAgY29udGV4dC5hcGkuc2V0U3R5bGVzaGVldCgnc2R2JywgcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NkdnN0eWxlLnNjc3MnKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuYWRkTWV0YVNlcnZlcignc21hcGkuaW8nLCB7XHJcbiAgICAgIHVybDogJycsXHJcbiAgICAgIGxvb3BiYWNrQ0I6IChxdWVyeTogSVF1ZXJ5KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUocHJveHkuZmluZChxdWVyeSkpXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbG9vayB1cCBzbWFwaSBtZXRhIGluZm8nLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKFtdKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9LFxyXG4gICAgICBjYWNoZUR1cmF0aW9uU2VjOiA4NjQwMCxcclxuICAgICAgcHJpb3JpdHk6IDI1LFxyXG4gICAgfSk7XHJcbiAgICBkZXBlbmRlbmN5TWFuYWdlciA9IG5ldyBEZXBlbmRlbmN5TWFuYWdlcihjb250ZXh0LmFwaSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIChwcm9maWxlSWQ6IHN0cmluZywgZmlsZXM6IGFueVtdKSA9PiBvbkFkZGVkRmlsZXMoY29udGV4dC5hcGksIHByb2ZpbGVJZCwgZmlsZXMpIGFzIGFueSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnd2lsbC1lbmFibGUtbW9kcycsIChwcm9maWxlSWQ6IHN0cmluZywgbW9kSWRzOiBzdHJpbmdbXSwgZW5hYmxlZDogYm9vbGVhbiwgb3B0aW9uczogYW55KSA9PiBvbldpbGxFbmFibGVNb2RzKGNvbnRleHQuYXBpLCBwcm9maWxlSWQsIG1vZElkcywgZW5hYmxlZCwgb3B0aW9ucykgYXMgYW55KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcclxuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnaW50ZXJmYWNlJywgJ3ByaW1hcnlUb29sJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCAnc21hcGknKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pXHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcclxuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnaW50ZXJmYWNlJywgJ3ByaW1hcnlUb29sJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gJ3NtYXBpJykge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdW5kZWZpbmVkKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgKGdhbWVJZDogc3RyaW5nLCBhcmNoaXZlSWQ6IHN0cmluZywgbW9kSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHVwZGF0ZUNvbmZsaWN0SW5mbyhjb250ZXh0LmFwaSwgcHJveHksIGdhbWVJZCwgbW9kSWQpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gbG9nKCdkZWJ1ZycsICdhZGRlZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkIH0pKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gYWRkIGNvbXBhdGliaWxpdHkgaW5mbycsIHsgbW9kSWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCAoZ2FtZU1vZGU6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgbG9nKCdkZWJ1ZycsICd1cGRhdGluZyBTRFYgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKHN0YXRlLnBlcnNpc3RlbnQubW9kc1tnYW1lTW9kZV0gPz8ge30pLm1hcChtb2RJZCA9PlxyXG4gICAgICAgIHVwZGF0ZUNvbmZsaWN0SW5mbyhjb250ZXh0LmFwaSwgcHJveHksIGdhbWVNb2RlLCBtb2RJZCkpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGxvZygnZGVidWcnLCAnZG9uZSB1cGRhdGluZyBjb21wYXRpYmlsaXR5IGluZm8nKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gdXBkYXRlIGNvbmZsaWN0IGluZm8nLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW5pdDtcclxuIl19