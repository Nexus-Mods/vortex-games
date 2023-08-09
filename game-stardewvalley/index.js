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
const path = require('path'), { clipboard } = require('electron'), rjson = require('relaxed-json'), { SevenZip } = vortex_api_1.util, { deploySMAPI, downloadSMAPI, findSMAPIMod } = require('./SMAPI'), { GAME_ID } = require('./common');
const MANIFEST_FILE = 'manifest.json';
const PTRN_CONTENT = path.sep + 'Content' + path.sep;
const SMAPI_EXE = 'StardewModdingAPI.exe';
const SMAPI_DLL = 'SMAPI.Installer.dll';
const SMAPI_DATA = ['windows-install.dat', 'install.dat'];
const _SMAPI_BUNDLED_MODS = ['ErrorHandler', 'ConsoleCommands', 'SaveBackup'];
const getBundledMods = () => {
    return Array.from(new Set(_SMAPI_BUNDLED_MODS.map(modName => modName.toLowerCase())));
};
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
            const game = yield vortex_api_1.util.GameStoreHelper.findByAppId(['413150', '1453375253']);
            if (game)
                return game.gamePath;
            for (const defaultPath of this.defaultPaths) {
                if (yield this.getPathExistsAsync(defaultPath))
                    return defaultPath;
            }
        }));
        this.setup = toBlue((discovery) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'));
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
        return 'Mods';
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
            const manifestIndex = manifestFile.toLowerCase().indexOf(MANIFEST_FILE);
            const filterFunc = (file) => (rootFolder !== '.')
                ? ((file.indexOf(rootFolder) !== -1)
                    && (path.dirname(file) !== '.')
                    && !file.endsWith(path.sep))
                : !file.endsWith(path.sep);
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
    const isModCandidateValid = (mod, entry) => {
        if ((mod === null || mod === void 0 ? void 0 : mod.id) === undefined || mod.type === 'sdvrootfolder') {
            return false;
        }
        if (mod.type !== 'SMAPI') {
            return true;
        }
        const segments = entry.filePath.toLowerCase().split(path.sep).filter(seg => !!seg);
        const modsSegIdx = segments.indexOf('mods');
        const modFolderName = ((modsSegIdx !== -1) && (segments.length > modsSegIdx + 1))
            ? segments[modsSegIdx + 1] : undefined;
        let bundledMods = vortex_api_1.util.getSafe(mod, ['attributes', 'smapiBundledMods'], []);
        bundledMods = bundledMods.length > 0 ? bundledMods : getBundledMods();
        if (segments.includes('content')) {
            return false;
        }
        return (modFolderName !== undefined) && bundledMods.includes(modFolderName);
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
    context.registerInstaller('smapi-installer', 30, testSMAPI, (files, dest) => bluebird_1.default.resolve(installSMAPI(getDiscoveryPath, files, dest)));
    context.registerModType('SMAPI', 30, gameId => gameId === GAME_ID, getSMAPIPath, isSMAPIModType);
    context.registerInstaller('stardew-valley-installer', 50, testSupported, (files, destinationPath) => bluebird_1.default.resolve(install(context.api, dependencyManager, files, destinationPath)));
    context.registerInstaller('sdvrootfolder', 50, testRootFolder, installRootFolder);
    context.registerModType('sdvrootfolder', 25, (gameId) => (gameId === GAME_ID), () => getDiscoveryPath(), (instructions) => {
        const copyInstructions = instructions.filter(instr => instr.type === 'copy');
        const hasManifest = copyInstructions.find(instr => instr.destination.endsWith(MANIFEST_FILE));
        const hasModsFolder = copyInstructions.find(instr => instr.destination.startsWith('Mods' + path.sep)) !== undefined;
        const hasContentFolder = copyInstructions.find(instr => instr.destination.startsWith('Content' + path.sep)) !== undefined;
        return (hasManifest)
            ? bluebird_1.default.resolve(hasContentFolder && hasModsFolder)
            : bluebird_1.default.resolve(hasContentFolder);
    });
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
        context.api.onAsync('added-files', (profileId, files) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.store.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== GAME_ID) {
                return;
            }
            const game = vortex_api_1.util.getGame(GAME_ID);
            const discovery = vortex_api_1.selectors.discoveryByGame(state, GAME_ID);
            const modPaths = game.getModPaths(discovery.path);
            const installPath = vortex_api_1.selectors.installPathForGame(state, GAME_ID);
            yield bluebird_1.default.map(files, (entry) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (entry.candidates.length === 1) {
                    const mod = vortex_api_1.util.getSafe(state.persistent.mods, [GAME_ID, entry.candidates[0]], undefined);
                    if (!isModCandidateValid(mod, entry)) {
                        return Promise.resolve();
                    }
                    const from = modPaths[(_a = mod.type) !== null && _a !== void 0 ? _a : ''];
                    if (from === undefined) {
                        (0, vortex_api_1.log)('error', 'failed to resolve mod path for mod type', mod.type);
                        return Promise.resolve();
                    }
                    const relPath = path.relative(from, entry.filePath);
                    const targetPath = path.join(installPath, mod.id, relPath);
                    try {
                        yield vortex_api_1.fs.ensureDirAsync(path.dirname(targetPath));
                        yield vortex_api_1.fs.copyAsync(entry.filePath, targetPath);
                        yield vortex_api_1.fs.removeAsync(entry.filePath);
                    }
                    catch (err) {
                        if (!err.message.includes('are the same file')) {
                            (0, vortex_api_1.log)('error', 'failed to re-import added file to mod', err.message);
                        }
                    }
                }
            }));
        }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFFMUMsNEVBQW9EO0FBQ3BELDJDQUFvRDtBQUVwRCw0RUFBb0Q7QUFDcEQsMERBQXFDO0FBRXJDLDhEQUFzQztBQUN0QyxtQ0FBNEM7QUFDNUMsbUNBQW1IO0FBQ25ILGlDQUF1QztBQUV2QyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUNuQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUMvQixFQUFFLFFBQVEsRUFBRSxHQUFHLGlCQUFJLEVBQ25CLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQ2pFLEVBQUUsT0FBTyxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRXBDLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQztBQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ3JELE1BQU0sU0FBUyxHQUFHLHVCQUF1QixDQUFDO0FBQzFDLE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLENBQUMscUJBQXFCLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFFMUQsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUM5RSxNQUFNLGNBQWMsR0FBRyxHQUFHLEVBQUU7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TyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7WUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLG1DQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUN6RSxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDeEQsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDWCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdXRpbCwgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcbmltcG9ydCB7IHNldFJlY29tbWVuZGF0aW9ucyB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCBDb21wYXRpYmlsaXR5SWNvbiBmcm9tICcuL0NvbXBhdGliaWxpdHlJY29uJztcclxuaW1wb3J0IHsgU01BUElfUVVFUllfRlJFUVVFTkNZIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuaW1wb3J0IERlcGVuZGVuY3lNYW5hZ2VyIGZyb20gJy4vRGVwZW5kZW5jeU1hbmFnZXInO1xyXG5pbXBvcnQgc2R2UmVkdWNlcnMgZnJvbSAnLi9yZWR1Y2Vycyc7XHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IFNNQVBJUHJveHkgZnJvbSAnLi9zbWFwaVByb3h5JztcclxuaW1wb3J0IHsgdGVzdFNNQVBJT3V0ZGF0ZWQgfSBmcm9tICcuL3Rlc3RzJztcclxuaW1wb3J0IHsgY29tcGF0aWJpbGl0eU9wdGlvbnMsIENvbXBhdGliaWxpdHlTdGF0dXMsIElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QsIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBwYXJzZU1hbmlmZXN0IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyksXHJcbiAgeyBjbGlwYm9hcmQgfSA9IHJlcXVpcmUoJ2VsZWN0cm9uJyksXHJcbiAgcmpzb24gPSByZXF1aXJlKCdyZWxheGVkLWpzb24nKSxcclxuICB7IFNldmVuWmlwIH0gPSB1dGlsLFxyXG4gIHsgZGVwbG95U01BUEksIGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9ID0gcmVxdWlyZSgnLi9TTUFQSScpLFxyXG4gIHsgR0FNRV9JRCB9ID0gcmVxdWlyZSgnLi9jb21tb24nKTtcclxuXHJcbmNvbnN0IE1BTklGRVNUX0ZJTEUgPSAnbWFuaWZlc3QuanNvbic7XHJcbmNvbnN0IFBUUk5fQ09OVEVOVCA9IHBhdGguc2VwICsgJ0NvbnRlbnQnICsgcGF0aC5zZXA7XHJcbmNvbnN0IFNNQVBJX0VYRSA9ICdTdGFyZGV3TW9kZGluZ0FQSS5leGUnO1xyXG5jb25zdCBTTUFQSV9ETEwgPSAnU01BUEkuSW5zdGFsbGVyLmRsbCc7XHJcbmNvbnN0IFNNQVBJX0RBVEEgPSBbJ3dpbmRvd3MtaW5zdGFsbC5kYXQnLCAnaW5zdGFsbC5kYXQnXTtcclxuXHJcbmNvbnN0IF9TTUFQSV9CVU5ETEVEX01PRFMgPSBbJ0Vycm9ySGFuZGxlcicsICdDb25zb2xlQ29tbWFuZHMnLCAnU2F2ZUJhY2t1cCddO1xyXG5jb25zdCBnZXRCdW5kbGVkTW9kcyA9ICgpID0+IHtcclxuICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KF9TTUFQSV9CVU5ETEVEX01PRFMubWFwKG1vZE5hbWUgPT4gbW9kTmFtZS50b0xvd2VyQ2FzZSgpKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuY2xhc3MgU3RhcmRld1ZhbGxleSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcclxuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XHJcbiAgcHVibGljIGlkOiBzdHJpbmcgPSBHQU1FX0lEO1xyXG4gIHB1YmxpYyBuYW1lOiBzdHJpbmcgPSAnU3RhcmRldyBWYWxsZXknO1xyXG4gIHB1YmxpYyBsb2dvOiBzdHJpbmcgPSAnZ2FtZWFydC5qcGcnO1xyXG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgZW52aXJvbm1lbnQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XHJcbiAgICBTdGVhbUFQUElkOiAnNDEzMTUwJyxcclxuICB9O1xyXG4gIHB1YmxpYyBkZXRhaWxzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xyXG4gICAgc3RlYW1BcHBJZDogNDEzMTUwXHJcbiAgfTtcclxuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogJ3NtYXBpJyxcclxuICAgICAgbmFtZTogJ1NNQVBJJyxcclxuICAgICAgbG9nbzogJ3NtYXBpLnBuZycsXHJcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+IFNNQVBJX0VYRSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW1NNQVBJX0VYRV0sXHJcbiAgICAgIHNoZWxsOiB0cnVlLFxyXG4gICAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICBkZWZhdWx0UHJpbWFyeTogdHJ1ZSxcclxuICAgIH1cclxuICBdO1xyXG4gIHB1YmxpYyBtZXJnZU1vZHM6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyByZXF1aXJlc0NsZWFudXA6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyBzaGVsbDogYm9vbGVhbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XHJcbiAgcHVibGljIGRlZmF1bHRQYXRoczogc3RyaW5nW107XHJcblxyXG4gIC8qKioqKioqKipcclxuICAqKiBWb3J0ZXggQVBJXHJcbiAgKioqKioqKioqL1xyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdCBhbiBpbnN0YW5jZS5cclxuICAgKiBAcGFyYW0ge0lFeHRlbnNpb25Db250ZXh0fSBjb250ZXh0IC0tIFRoZSBWb3J0ZXggZXh0ZW5zaW9uIGNvbnRleHQuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICAgIC8vIHByb3BlcnRpZXMgdXNlZCBieSBWb3J0ZXhcclxuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICB0aGlzLnJlcXVpcmVkRmlsZXMgPSBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyBbJ1N0YXJkZXcgVmFsbGV5LmV4ZSddXHJcbiAgICAgIDogWydTdGFyZGV3VmFsbGV5JywgJ1N0YXJkZXdWYWxsZXkuZXhlJ107XHJcblxyXG4gICAgLy8gY3VzdG9tIHByb3BlcnRpZXNcclxuICAgIHRoaXMuZGVmYXVsdFBhdGhzID0gW1xyXG4gICAgICAvLyBMaW51eFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9HT0cgR2FtZXMvU3RhcmRldyBWYWxsZXkvZ2FtZScsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnLy5sb2NhbC9zaGFyZS9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5JyxcclxuXHJcbiAgICAgIC8vIE1hY1xyXG4gICAgICAnL0FwcGxpY2F0aW9ucy9TdGFyZGV3IFZhbGxleS5hcHAvQ29udGVudHMvTWFjT1MnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnQvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleS9Db250ZW50cy9NYWNPUycsXHJcblxyXG4gICAgICAvLyBXaW5kb3dzXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdhbGF4eUNsaWVudFxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdPRyBHYWxheHlcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxTdGVhbVxcXFxzdGVhbWFwcHNcXFxcY29tbW9uXFxcXFN0YXJkZXcgVmFsbGV5J1xyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGZpbmQgdGhlIGdhbWUgaW5zdGFsbCBwYXRoLlxyXG4gICAqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHF1aWNrbHkgYW5kLCBpZiBpdCByZXR1cm5zIGEgdmFsdWUsIGl0IHNob3VsZCBkZWZpbml0aXZlbHkgYmUgdGhlXHJcbiAgICogdmFsaWQgZ2FtZSBwYXRoLiBVc3VhbGx5IHRoaXMgZnVuY3Rpb24gd2lsbCBxdWVyeSB0aGUgcGF0aCBmcm9tIHRoZSByZWdpc3RyeSBvciBmcm9tIHN0ZWFtLlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gbWF5IHJldHVybiBhIHByb21pc2UgYW5kIGl0IHNob3VsZCBkbyB0aGF0IGlmIGl0J3MgZG9pbmcgSS9PLlxyXG4gICAqXHJcbiAgICogVGhpcyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgYnV0IHRoZW4gdGhlIHRvb2wvZ2FtZSBjYW4gb25seSBiZSBkaXNjb3ZlcmVkIGJ5IHNlYXJjaGluZyB0aGUgZGlza1xyXG4gICAqIHdoaWNoIGlzIHNsb3cgYW5kIG9ubHkgaGFwcGVucyBtYW51YWxseS5cclxuICAgKi9cclxuICBwdWJsaWMgcXVlcnlQYXRoID0gdG9CbHVlKGFzeW5jICgpID0+IHtcclxuICAgIC8vIGNoZWNrIFN0ZWFtXHJcbiAgICBjb25zdCBnYW1lID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoWyc0MTMxNTAnLCAnMTQ1MzM3NTI1MyddKTtcclxuICAgIGlmIChnYW1lKVxyXG4gICAgICByZXR1cm4gZ2FtZS5nYW1lUGF0aDtcclxuXHJcbiAgICAvLyBjaGVjayBkZWZhdWx0IHBhdGhzXHJcbiAgICBmb3IgKGNvbnN0IGRlZmF1bHRQYXRoIG9mIHRoaXMuZGVmYXVsdFBhdGhzKVxyXG4gICAge1xyXG4gICAgICBpZiAoYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoZGVmYXVsdFBhdGgpKVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0UGF0aDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwYXRoIG9mIHRoZSB0b29sIGV4ZWN1dGFibGUgcmVsYXRpdmUgdG8gdGhlIHRvb2wgYmFzZSBwYXRoLCBpLmUuIGJpbmFyaWVzL1VUMy5leGUgb3JcclxuICAgKiBURVNWLmV4ZS4gVGhpcyBpcyBhIGZ1bmN0aW9uIHNvIHRoYXQgeW91IGNhbiByZXR1cm4gZGlmZmVyZW50IHRoaW5ncyBiYXNlZCBvbiB0aGUgb3BlcmF0aW5nXHJcbiAgICogc3lzdGVtIGZvciBleGFtcGxlIGJ1dCBiZSBhd2FyZSB0aGF0IGl0IHdpbGwgYmUgZXZhbHVhdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0IGFuZCBvbmx5IG9uY2UsXHJcbiAgICogc28gdGhlIHJldHVybiB2YWx1ZSBjYW4gbm90IGRlcGVuZCBvbiB0aGluZ3MgdGhhdCBjaGFuZ2UgYXQgcnVudGltZS5cclxuICAgKi9cclxuICBwdWJsaWMgZXhlY3V0YWJsZSgpIHtcclxuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyAnU3RhcmRldyBWYWxsZXkuZXhlJ1xyXG4gICAgICA6ICdTdGFyZGV3VmFsbGV5JztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgZGVmYXVsdCBkaXJlY3Rvcnkgd2hlcmUgbW9kcyBmb3IgdGhpcyBnYW1lIHNob3VsZCBiZSBzdG9yZWQuXHJcbiAgICogXHJcbiAgICogSWYgdGhpcyByZXR1cm5zIGEgcmVsYXRpdmUgcGF0aCB0aGVuIHRoZSBwYXRoIGlzIHRyZWF0ZWQgYXMgcmVsYXRpdmUgdG8gdGhlIGdhbWUgaW5zdGFsbGF0aW9uXHJcbiAgICogZGlyZWN0b3J5LiBTaW1wbHkgcmV0dXJuIGEgZG90ICggKCkgPT4gJy4nICkgaWYgbW9kcyBhcmUgaW5zdGFsbGVkIGRpcmVjdGx5IGludG8gdGhlIGdhbWVcclxuICAgKiBkaXJlY3RvcnkuXHJcbiAgICovIFxyXG4gIHB1YmxpYyBxdWVyeU1vZFBhdGgoKVxyXG4gIHtcclxuICAgIHJldHVybiAnTW9kcyc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcHRpb25hbCBzZXR1cCBmdW5jdGlvbi4gSWYgdGhpcyBnYW1lIHJlcXVpcmVzIHNvbWUgZm9ybSBvZiBzZXR1cCBiZWZvcmUgaXQgY2FuIGJlIG1vZGRlZCAobGlrZVxyXG4gICAqIGNyZWF0aW5nIGEgZGlyZWN0b3J5LCBjaGFuZ2luZyBhIHJlZ2lzdHJ5IGtleSwgLi4uKSBkbyBpdCBoZXJlLiBJdCB3aWxsIGJlIGNhbGxlZCBldmVyeSB0aW1lXHJcbiAgICogYmVmb3JlIHRoZSBnYW1lIG1vZGUgaXMgYWN0aXZhdGVkLlxyXG4gICAqIEBwYXJhbSB7SURpc2NvdmVyeVJlc3VsdH0gZGlzY292ZXJ5IC0tIGJhc2ljIGluZm8gYWJvdXQgdGhlIGdhbWUgYmVpbmcgbG9hZGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXR1cCA9IHRvQmx1ZShhc3luYyAoZGlzY292ZXJ5KSA9PiB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGZvbGRlciBmb3IgU01BUEkgbW9kcyBleGlzdHMuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBza2lwIGlmIFNNQVBJIGZvdW5kXHJcbiAgICBjb25zdCBzbWFwaVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIFNNQVBJX0VYRSk7XHJcbiAgICBjb25zdCBzbWFwaUZvdW5kID0gYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoc21hcGlQYXRoKTtcclxuICAgIGlmICghc21hcGlGb3VuZCkge1xyXG4gICAgICB0aGlzLnJlY29tbWVuZFNtYXBpKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5jb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG5cclxuICAgIC8qXHJcbiAgICBpZiAoc3RhdGUuc2V0dGluZ3NbJ1NEViddLnVzZVJlY29tbWVuZGF0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2hvdyBSZWNvbW1lbmRhdGlvbnM/Jywge1xyXG4gICAgICAgIHRleHQ6ICdWb3J0ZXggY2FuIG9wdGlvbmFsbHkgdXNlIGRhdGEgZnJvbSBTTUFQSVxcJ3MgZGF0YWJhc2UgYW5kICdcclxuICAgICAgICAgICAgKyAndGhlIG1hbmlmZXN0IGZpbGVzIGluY2x1ZGVkIHdpdGggbW9kcyB0byByZWNvbW1lbmQgYWRkaXRpb25hbCAnXHJcbiAgICAgICAgICAgICsgJ2NvbXBhdGlibGUgbW9kcyB0aGF0IHdvcmsgd2l0aCB0aG9zZSB0aGF0IHlvdSBoYXZlIGluc3RhbGxlZC4gJ1xyXG4gICAgICAgICAgICArICdJbiBzb21lIGNhc2VzLCB0aGlzIGluZm9ybWF0aW9uIGNvdWxkIGJlIHdyb25nIG9yIGluY29tcGxldGUgJ1xyXG4gICAgICAgICAgICArICd3aGljaCBtYXkgbGVhZCB0byB1bnJlbGlhYmxlIHByb21wdHMgc2hvd2luZyBpbiB0aGUgYXBwLlxcbidcclxuICAgICAgICAgICAgKyAnQWxsIHJlY29tbWVuZGF0aW9ucyBzaG93biBzaG91bGQgYmUgY2FyZWZ1bGx5IGNvbnNpZGVyZWQgJ1xyXG4gICAgICAgICAgICArICdiZWZvcmUgYWNjZXB0aW5nIHRoZW0gLSBpZiB5b3UgYXJlIHVuc3VyZSBwbGVhc2UgY2hlY2sgdGhlICdcclxuICAgICAgICAgICAgKyAnbW9kIHBhZ2UgdG8gc2VlIGlmIHRoZSBhdXRob3IgaGFzIHByb3ZpZGVkIGFueSBmdXJ0aGVyIGluc3RydWN0aW9ucy4gJ1xyXG4gICAgICAgICAgICArICdXb3VsZCB5b3UgbGlrZSB0byBlbmFibGUgdGhpcyBmZWF0dXJlPyBZb3UgY2FuIHVwZGF0ZSB5b3VyIGNob2ljZSAnXHJcbiAgICAgICAgICAgICsgJ2Zyb20gdGhlIFNldHRpbmdzIG1lbnUgYXQgYW55IHRpbWUuJ1xyXG4gICAgICB9LCBbXHJcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlIHdpdGhvdXQgcmVjb21tZW5kYXRpb25zJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFJlY29tbWVuZGF0aW9ucyhmYWxzZSkpO1xyXG4gICAgICAgIH0gfSxcclxuICAgICAgICB7IGxhYmVsOiAnRW5hYmxlIHJlY29tbWVuZGF0aW9ucycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRSZWNvbW1lbmRhdGlvbnModHJ1ZSkpO1xyXG4gICAgICAgIH0gfSxcclxuICAgICAgXSlcclxuICAgIH0qL1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgcHJpdmF0ZSByZWNvbW1lbmRTbWFwaSgpIHtcclxuICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKHRoaXMuY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgdGl0bGUgPSBzbWFwaU1vZCA/ICdTTUFQSSBpcyBub3QgZGVwbG95ZWQnIDogJ1NNQVBJIGlzIG5vdCBpbnN0YWxsZWQnO1xyXG4gICAgY29uc3QgYWN0aW9uVGl0bGUgPSBzbWFwaU1vZCA/ICdEZXBsb3knIDogJ0dldCBTTUFQSSc7XHJcbiAgICBjb25zdCBhY3Rpb24gPSAoKSA9PiAoc21hcGlNb2RcclxuICAgICAgPyBkZXBsb3lTTUFQSSh0aGlzLmNvbnRleHQuYXBpKVxyXG4gICAgICA6IGRvd25sb2FkU01BUEkodGhpcy5jb250ZXh0LmFwaSkpXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpKTtcclxuXHJcbiAgICB0aGlzLmNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ3NtYXBpLW1pc3NpbmcnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBtZXNzYWdlOiAnU01BUEkgaXMgcmVxdWlyZWQgdG8gbW9kIFN0YXJkZXcgVmFsbGV5LicsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogYWN0aW9uVGl0bGUsXHJcbiAgICAgICAgICBhY3Rpb24sXHJcbiAgICAgICAgfSxcclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogSW50ZXJuYWwgbWV0aG9kc1xyXG4gICoqKioqKioqKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgY2hlY2sgd2hldGhlciBhIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGggZXhpc3RzLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gVGhlIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGguXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0UGF0aEV4aXN0c0FzeW5jKHBhdGgpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aCk7XHJcbiAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBjYXRjaChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgcmVhZCBhIHJlZ2lzdHJ5IGtleSB2YWx1ZS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGl2ZSAtIFRoZSByZWdpc3RyeSBoaXZlIHRvIGFjY2Vzcy4gVGhpcyBzaG91bGQgYmUgYSBjb25zdGFudCBsaWtlIFJlZ2lzdHJ5LkhLTE0uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIFRoZSByZWdpc3RyeSBrZXkuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdG8gcmVhZC5cclxuICAgKi9cclxuICBhc3luYyByZWFkUmVnaXN0cnlLZXlBc3luYyhoaXZlLCBrZXksIG5hbWUpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoaGl2ZSwga2V5LCBuYW1lKTtcclxuICAgICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RGb2xkZXIoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIFdlIGFzc3VtZSB0aGF0IGFueSBtb2QgY29udGFpbmluZyBcIi9Db250ZW50L1wiIGluIGl0cyBkaXJlY3RvcnlcclxuICAvLyAgc3RydWN0dXJlIGlzIG1lYW50IHRvIGJlIGRlcGxveWVkIHRvIHRoZSByb290IGZvbGRlci5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpKTtcclxuICBjb25zdCBjb250ZW50RGlyID0gZmlsdGVyZWQuZmluZChmaWxlID0+IGZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoY29udGVudERpciAhPT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RGb2xkZXIoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFdlJ3JlIGdvaW5nIHRvIGRlcGxveSBcIi9Db250ZW50L1wiIGFuZCB3aGF0ZXZlciBmb2xkZXJzIGNvbWUgYWxvbmdzaWRlIGl0LlxyXG4gIC8vICBpLmUuIFNvbWVNb2QuN3pcclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Db250ZW50L1xyXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL01vZHMvXHJcbiAgLy8gIFdpbGwgTk9UIGJlIGRlcGxveWVkID0+IC4uL1JlYWRtZS5kb2NcclxuICBjb25zdCBjb250ZW50RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICBjb25zdCBpZHggPSBjb250ZW50RmlsZS5pbmRleE9mKFBUUk5fQ09OVEVOVCkgKyAxO1xyXG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLmJhc2VuYW1lKGNvbnRlbnRGaWxlLnN1YnN0cmluZygwLCBpZHgpKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKVxyXG4gICAgJiYgKGZpbGUuaW5kZXhPZihyb290RGlyKSAhPT0gLTEpXHJcbiAgICAmJiAocGF0aC5leHRuYW1lKGZpbGUpICE9PSAnLnR4dCcpKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc3Vic3RyKGlkeCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KGZpbGVQYXRoKSB7XHJcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICBjb25zdCBpc01hbmlmZXN0RmlsZSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID09PSBNQU5JRkVTVF9GSUxFO1xyXG4gIGNvbnN0IGlzTG9jYWxlID0gc2VnbWVudHMuaW5jbHVkZXMoJ2xvY2FsZScpO1xyXG4gIHJldHVybiBpc01hbmlmZXN0RmlsZSAmJiAhaXNMb2NhbGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWQoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChpc1ZhbGlkTWFuaWZlc3QpICE9PSB1bmRlZmluZWQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgICAgLy8gV2UgY3JlYXRlIGEgcHJlZml4IGZha2UgZGlyZWN0b3J5IGp1c3QgaW4gY2FzZSB0aGUgY29udGVudFxyXG4gICAgICAvLyAgZm9sZGVyIGlzIGluIHRoZSBhcmNoaXZlJ3Mgcm9vdCBmb2xkZXIuIFRoaXMgaXMgdG8gZW5zdXJlIHdlXHJcbiAgICAgIC8vICBmaW5kIGEgbWF0Y2ggZm9yIFwiL0NvbnRlbnQvXCJcclxuICAgICAgY29uc3QgdGVzdEZpbGUgPSBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKTtcclxuICAgICAgcmV0dXJuICh0ZXN0RmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICAgIH0pID09PSB1bmRlZmluZWQpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbChhcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeU1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gVGhlIGFyY2hpdmUgbWF5IGNvbnRhaW4gbXVsdGlwbGUgbWFuaWZlc3QgZmlsZXMgd2hpY2ggd291bGRcclxuICAvLyAgaW1wbHkgdGhhdCB3ZSdyZSBpbnN0YWxsaW5nIG11bHRpcGxlIG1vZHMuXHJcbiAgY29uc3QgbWFuaWZlc3RGaWxlcyA9IGZpbGVzLmZpbHRlcihpc1ZhbGlkTWFuaWZlc3QpO1xyXG5cclxuICBpbnRlcmZhY2UgSU1vZEluZm8ge1xyXG4gICAgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdDtcclxuICAgIHJvb3RGb2xkZXI6IHN0cmluZztcclxuICAgIG1hbmlmZXN0SW5kZXg6IG51bWJlcjtcclxuICAgIG1vZEZpbGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGxldCBwYXJzZUVycm9yOiBFcnJvcjtcclxuXHJcbiAgYXdhaXQgZGVwZW5kZW5jeU1hbmFnZXIuc2Nhbk1hbmlmZXN0cyh0cnVlKTtcclxuICBsZXQgbW9kczogSU1vZEluZm9bXSA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0RmlsZXMubWFwKGFzeW5jIG1hbmlmZXN0RmlsZSA9PiB7XHJcbiAgICBjb25zdCByb290Rm9sZGVyID0gcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdEluZGV4ID0gbWFuaWZlc3RGaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihNQU5JRkVTVF9GSUxFKTtcclxuICAgIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZSkgPT4gKHJvb3RGb2xkZXIgIT09ICcuJylcclxuICAgICAgPyAoKGZpbGUuaW5kZXhPZihyb290Rm9sZGVyKSAhPT0gLTEpXHJcbiAgICAgICAgJiYgKHBhdGguZGlybmFtZShmaWxlKSAhPT0gJy4nKVxyXG4gICAgICAgICYmICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgICAgOiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID1cclxuICAgICAgICBhd2FpdCBwYXJzZU1hbmlmZXN0KHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1hbmlmZXN0RmlsZSkpO1xyXG4gICAgICBjb25zdCBtb2RGaWxlcyA9IGZpbGVzLmZpbHRlcihmaWx0ZXJGdW5jKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBtYW5pZmVzdCxcclxuICAgICAgICByb290Rm9sZGVyLFxyXG4gICAgICAgIG1hbmlmZXN0SW5kZXgsXHJcbiAgICAgICAgbW9kRmlsZXMsXHJcbiAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8ganVzdCBhIHdhcm5pbmcgYXQgdGhpcyBwb2ludCBhcyB0aGlzIG1heSBub3QgYmUgdGhlIG1haW4gbWFuaWZlc3QgZm9yIHRoZSBtb2RcclxuICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgbWFuaWZlc3RGaWxlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgIHBhcnNlRXJyb3IgPSBlcnI7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgfSkpO1xyXG5cclxuICBtb2RzID0gbW9kcy5maWx0ZXIoeCA9PiB4ICE9PSB1bmRlZmluZWQpO1xyXG4gIFxyXG4gIGlmIChtb2RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcclxuICAgICAgJ1RoZSBtb2QgbWFuaWZlc3QgaXMgaW52YWxpZCBhbmQgY2FuXFwndCBiZSByZWFkLiBZb3UgY2FuIHRyeSB0byBpbnN0YWxsIHRoZSBtb2QgYW55d2F5IHZpYSByaWdodC1jbGljayAtPiBcIlVucGFjayAoYXMtaXMpXCInLFxyXG4gICAgICBwYXJzZUVycm9yLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLm1hcChtb2RzLCBtb2QgPT4ge1xyXG4gICAgLy8gVE9ETzogd2UgbWlnaHQgZ2V0IGhlcmUgd2l0aCBhIG1vZCB0aGF0IGhhcyBhIG1hbmlmZXN0Lmpzb24gZmlsZSBidXQgd2Fzbid0IGludGVuZGVkIGZvciBTdGFyZGV3IFZhbGxleSwgYWxsXHJcbiAgICAvLyAgdGh1bmRlcnN0b3JlIG1vZHMgd2lsbCBjb250YWluIGEgbWFuaWZlc3QuanNvbiBmaWxlXHJcbiAgICBjb25zdCBtb2ROYW1lID0gKG1vZC5yb290Rm9sZGVyICE9PSAnLicpXHJcbiAgICAgID8gbW9kLnJvb3RGb2xkZXJcclxuICAgICAgOiBtb2QubWFuaWZlc3QuTmFtZSA/PyBtb2Qucm9vdEZvbGRlcjtcclxuXHJcbiAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtb2QubWFuaWZlc3QuRGVwZW5kZW5jaWVzIHx8IFtdO1xyXG5cclxuICAgIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbW9kLm1vZEZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gcGF0aC5qb2luKG1vZE5hbWUsIGZpbGUuc3Vic3RyKG1vZC5tYW5pZmVzdEluZGV4KSk7XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWRkUnVsZUZvckRlcGVuZGVuY3kgPSAoZGVwOiBJU0RWRGVwZW5kZW5jeSkgPT4ge1xyXG4gICAgICBpZiAoKGRlcC5VbmlxdWVJRCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgfHwgKGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpID09PSAneW91cm5hbWUueW91cm90aGVyc3BhY2tzYW5kbW9kcycpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSBkZXAuTWluaW11bVZlcnNpb24gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gYD49JHtkZXAuTWluaW11bVZlcnNpb259YFxyXG4gICAgICAgIDogJyonO1xyXG4gICAgICBjb25zdCBydWxlOiB0eXBlcy5JTW9kUnVsZSA9IHtcclxuICAgICAgICAvLyB0cmVhdGluZyBhbGwgZGVwZW5kZW5jaWVzIGFzIHJlY29tbWVuZGF0aW9ucyBiZWNhdXNlIHRoZSBkZXBlbmRlbmN5IGluZm9ybWF0aW9uXHJcbiAgICAgICAgLy8gcHJvdmlkZWQgYnkgc29tZSBtb2QgYXV0aG9ycyBpcyBhIGJpdCBoaXQtYW5kLW1pc3MgYW5kIFZvcnRleCBmYWlybHkgYWdncmVzc2l2ZWx5XHJcbiAgICAgICAgLy8gZW5mb3JjZXMgcmVxdWlyZW1lbnRzXHJcbiAgICAgICAgLy8gdHlwZTogKGRlcC5Jc1JlcXVpcmVkID8/IHRydWUpID8gJ3JlcXVpcmVzJyA6ICdyZWNvbW1lbmRzJyxcclxuICAgICAgICB0eXBlOiAncmVjb21tZW5kcycsXHJcbiAgICAgICAgcmVmZXJlbmNlOiB7XHJcbiAgICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgdmVyc2lvbk1hdGNoLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXh0cmE6IHtcclxuICAgICAgICAgIG9ubHlJZkZ1bGZpbGxhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgYXV0b21hdGljOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH07XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAncnVsZScsXHJcbiAgICAgICAgcnVsZSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgIGlmIChhcGkuZ2V0U3RhdGUoKS5zZXR0aW5nc1snU0RWJ10/LnVzZVJlY29tbWVuZGF0aW9ucyA/PyBmYWxzZSkge1xyXG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShkZXApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0Zvcik7XHJcbiAgICAgIH1cclxuICAgIH0qL1xyXG4gICAgcmV0dXJuIGluc3RydWN0aW9ucztcclxuICB9KVxyXG4gICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChkYXRhKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiBhY2N1bS5jb25jYXQoaXRlciksIFtdKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1NNQVBJTW9kVHlwZShpbnN0cnVjdGlvbnMpIHtcclxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS5cclxuICBjb25zdCBzbWFwaURhdGEgPSBpbnN0cnVjdGlvbnMuZmluZChpbnN0ID0+IChpbnN0LnR5cGUgPT09ICdjb3B5JykgJiYgaW5zdC5zb3VyY2UuZW5kc1dpdGgoU01BUElfRVhFKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHNtYXBpRGF0YSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFNNQVBJKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBNYWtlIHN1cmUgdGhlIGRvd25sb2FkIGNvbnRhaW5zIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmUuc1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmIChmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgIHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IFNNQVBJX0RMTCkgIT09IHVuZGVmaW5lZClcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICAgIHN1cHBvcnRlZCxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgY29uc3QgZm9sZGVyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJ1xyXG4gICAgPyAnd2luZG93cydcclxuICAgIDogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2xpbnV4J1xyXG4gICAgICA/ICdsaW51eCdcclxuICAgICAgOiAnbWFjb3MnO1xyXG4gIGNvbnN0IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0gPSAoZmlsZSkgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcclxuICAgIHJldHVybiAoc2VnbWVudHMuaW5jbHVkZXMoZm9sZGVyKSk7XHJcbiAgfVxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGRhdGEgYXJjaGl2ZVxyXG4gIGNvbnN0IGRhdGFGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgIGNvbnN0IGlzQ29ycmVjdFBsYXRmb3JtID0gZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybShmaWxlKTtcclxuICAgIHJldHVybiBpc0NvcnJlY3RQbGF0Zm9ybSAmJiBTTUFQSV9EQVRBLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSlcclxuICB9KTtcclxuICBpZiAoZGF0YUZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gZmluZCB0aGUgU01BUEkgZGF0YSBmaWxlcyAtIGRvd25sb2FkIGFwcGVhcnMgJ1xyXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xyXG4gIH1cclxuICBsZXQgZGF0YSA9ICcnO1xyXG4gIHRyeSB7XHJcbiAgICBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oZ2V0RGlzY292ZXJ5UGF0aCgpLCAnU3RhcmRldyBWYWxsZXkuZGVwcy5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFNEViBkZXBlbmRlbmNpZXMnLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy8gZmlsZSB3aWxsIGJlIG91dGRhdGVkIGFmdGVyIHRoZSB3YWxrIG9wZXJhdGlvbiBzbyBwcmVwYXJlIGEgcmVwbGFjZW1lbnQuIFxyXG4gIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IFtdO1xyXG5cclxuICBjb25zdCBzemlwID0gbmV3IFNldmVuWmlwKCk7XHJcbiAgLy8gVW56aXAgdGhlIGZpbGVzIGZyb20gdGhlIGRhdGEgYXJjaGl2ZS4gVGhpcyBkb2Vzbid0IHNlZW0gdG8gYmVoYXZlIGFzIGRlc2NyaWJlZCBoZXJlOiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9ub2RlLTd6I2V2ZW50c1xyXG4gIGF3YWl0IHN6aXAuZXh0cmFjdEZ1bGwocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgZGF0YUZpbGUpLCBkZXN0aW5hdGlvblBhdGgpO1xyXG5cclxuICAvLyBGaW5kIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgaW4gdGhlIHBhcmVudCBmb2xkZXIuIFxyXG4gIGF3YWl0IHV0aWwud2FsayhkZXN0aW5hdGlvblBhdGgsIChpdGVyLCBzdGF0cykgPT4ge1xyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkZXN0aW5hdGlvblBhdGgsIGl0ZXIpO1xyXG4gICAgICAvLyBGaWx0ZXIgb3V0IGZpbGVzIGZyb20gdGhlIG9yaWdpbmFsIGluc3RhbGwgYXMgdGhleSdyZSBubyBsb25nZXIgcmVxdWlyZWQuXHJcbiAgICAgIGlmICghZmlsZXMuaW5jbHVkZXMocmVsUGF0aCkgJiYgc3RhdHMuaXNGaWxlKCkgJiYgIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgrcGF0aC5zZXApKSB1cGRhdGVkRmlsZXMucHVzaChyZWxQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICBjb25zdCBtb2RzRm9sZGVySWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgICBpZiAoKG1vZHNGb2xkZXJJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc0ZvbGRlcklkeCArIDEpKSB7XHJcbiAgICAgICAgX1NNQVBJX0JVTkRMRURfTU9EUy5wdXNoKHNlZ21lbnRzW21vZHNGb2xkZXJJZHggKyAxXSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuIFxyXG4gIGNvbnN0IHNtYXBpRXhlID0gdXBkYXRlZEZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoU01BUElfRVhFLnRvTG93ZXJDYXNlKCkpKTtcclxuICBpZiAoc21hcGlFeGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGBGYWlsZWQgdG8gZXh0cmFjdCAke1NNQVBJX0VYRX0gLSBkb3dubG9hZCBhcHBlYXJzIGBcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgY29uc3QgaWR4ID0gc21hcGlFeGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKHNtYXBpRXhlKSk7XHJcblxyXG4gIC8vIEJ1aWxkIHRoZSBpbnN0cnVjdGlvbnMgZm9yIGluc3RhbGxhdGlvbi4gXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IHVwZGF0ZWRGaWxlcy5tYXAoZmlsZSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKGZpbGUuc3Vic3RyKGlkeCkpLFxyXG4gICAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAga2V5OiAnc21hcGlCdW5kbGVkTW9kcycsXHJcbiAgICB2YWx1ZTogZ2V0QnVuZGxlZE1vZHMoKSxcclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgdHlwZTogJ2dlbmVyYXRlZmlsZScsXHJcbiAgICBkYXRhLFxyXG4gICAgZGVzdGluYXRpb246ICdTdGFyZGV3TW9kZGluZ0FQSS5kZXBzLmpzb24nLFxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgbG9nRmlsZSkge1xyXG4gIGNvbnN0IGxvZ0RhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihiYXNlUGF0aCwgbG9nRmlsZSksIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XHJcbiAgYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnU01BUEkgTG9nJywge1xyXG4gICAgdGV4dDogJ1lvdXIgU01BUEkgbG9nIGlzIGRpc3BsYXllZCBiZWxvdy4gVG8gc2hhcmUgaXQsIGNsaWNrIFwiQ29weSAmIFNoYXJlXCIgd2hpY2ggd2lsbCBjb3B5IGl0IHRvIHlvdXIgY2xpcGJvYXJkIGFuZCBvcGVuIHRoZSBTTUFQSSBsb2cgc2hhcmluZyB3ZWJzaXRlLiAnICtcclxuICAgICAgJ05leHQsIHBhc3RlIHlvdXIgY29kZSBpbnRvIHRoZSB0ZXh0IGJveCBhbmQgcHJlc3MgXCJzYXZlICYgcGFyc2UgbG9nXCIuIFlvdSBjYW4gbm93IHNoYXJlIGEgbGluayB0byB0aGlzIHBhZ2Ugd2l0aCBvdGhlcnMgc28gdGhleSBjYW4gc2VlIHlvdXIgbG9nIGZpbGUuXFxuXFxuJyArIGxvZ0RhdGFcclxuICB9LCBbe1xyXG4gICAgbGFiZWw6ICdDb3B5ICYgU2hhcmUgbG9nJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9eLitUKFteXFwuXSspLisvLCAnJDEnKTtcclxuICAgICAgY2xpcGJvYXJkLndyaXRlVGV4dChgWyR7dGltZXN0YW1wfSBJTkZPIFZvcnRleF0gTG9nIGV4cG9ydGVkIGJ5IFZvcnRleCAke3V0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9ufS5cXG5gICsgbG9nRGF0YSk7XHJcbiAgICAgIHJldHVybiB1dGlsLm9wbignaHR0cHM6Ly9zbWFwaS5pby9sb2cnKS5jYXRjaChlcnIgPT4gdW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9LCB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHVuZGVmaW5lZCB9XSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uU2hvd1NNQVBJTG9nKGFwaSkge1xyXG4gIC8vUmVhZCBhbmQgZGlzcGxheSB0aGUgbG9nLlxyXG4gIGNvbnN0IGJhc2VQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnYXBwRGF0YScpLCAnc3RhcmRld3ZhbGxleScsICdlcnJvcmxvZ3MnKTtcclxuICB0cnkge1xyXG4gICAgLy9JZiB0aGUgY3Jhc2ggbG9nIGV4aXN0cywgc2hvdyB0aGF0LlxyXG4gICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktY3Jhc2gudHh0XCIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy9PdGhlcndpc2Ugc2hvdyB0aGUgbm9ybWFsIGxvZy5cclxuICAgICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktbGF0ZXN0LnR4dFwiKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvL09yIEluZm9ybSB0aGUgdXNlciB0aGVyZSBhcmUgbm8gbG9ncy5cclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oeyB0eXBlOiAnaW5mbycsIHRpdGxlOiAnTm8gU01BUEkgbG9ncyBmb3VuZC4nLCBtZXNzYWdlOiAnJywgZGlzcGxheU1TOiA1MDAwIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TW9kTWFuaWZlc3RzKG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgY29uc3QgbWFuaWZlc3RzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuICBpZiAobW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XHJcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcclxuICAgICAgICBtYW5pZmVzdHMucHVzaChlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcclxuICAgIC50aGVuKCgpID0+IG1hbmlmZXN0cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZUNvbmZsaWN0SW5mbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFwaTogU01BUElQcm94eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWQ6IHN0cmluZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgbW9kID0gYXBpLmdldFN0YXRlKCkucGVyc2lzdGVudC5tb2RzW2dhbWVJZF1bbW9kSWRdO1xyXG5cclxuICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcblxyXG4gIGlmICgobm93IC0gbW9kLmF0dHJpYnV0ZXM/Lmxhc3RTTUFQSVF1ZXJ5ID8/IDApIDwgU01BUElfUVVFUllfRlJFUVVFTkNZKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBsZXQgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBtb2QuYXR0cmlidXRlcz8uYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXM7XHJcbiAgaWYgKCFhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcykge1xyXG4gICAgaWYgKG1vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWUpIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbbW9kLmF0dHJpYnV0ZXM/LmxvZ2ljYWxGaWxlTmFtZV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcXVlcnkgPSBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lc1xyXG4gICAgLm1hcChuYW1lID0+IHtcclxuICAgICAgY29uc3QgcmVzID0ge1xyXG4gICAgICAgIGlkOiBuYW1lLFxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCB2ZXIgPSBtb2QuYXR0cmlidXRlcz8ubWFuaWZlc3RWZXJzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgID8/IHNlbXZlci5jb2VyY2UobW9kLmF0dHJpYnV0ZXM/LnZlcnNpb24pPy52ZXJzaW9uO1xyXG4gICAgICBpZiAoISF2ZXIpIHtcclxuICAgICAgICByZXNbJ2luc3RhbGxlZFZlcnNpb24nXSA9IHZlcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBzdGF0ID0gKGl0ZW06IElTTUFQSVJlc3VsdCk6IENvbXBhdGliaWxpdHlTdGF0dXMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdHVzID0gaXRlbS5tZXRhZGF0YT8uY29tcGF0aWJpbGl0eVN0YXR1cz8udG9Mb3dlckNhc2U/LigpO1xyXG4gICAgaWYgKCFjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmNsdWRlcyhzdGF0dXMgYXMgYW55KSkge1xyXG4gICAgICByZXR1cm4gJ3Vua25vd24nO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHN0YXR1cyBhcyBDb21wYXRpYmlsaXR5U3RhdHVzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNvbXBhdGliaWxpdHlQcmlvID0gKGl0ZW06IElTTUFQSVJlc3VsdCkgPT4gY29tcGF0aWJpbGl0eU9wdGlvbnMuaW5kZXhPZihzdGF0KGl0ZW0pKTtcclxuXHJcbiAgcmV0dXJuIHNtYXBpLmZpbmRCeU5hbWVzKHF1ZXJ5KVxyXG4gICAgLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICAgIGNvbnN0IHdvcnN0U3RhdHVzOiBJU01BUElSZXN1bHRbXSA9IHJlc3VsdHNcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGNvbXBhdGliaWxpdHlQcmlvKGxocykgLSBjb21wYXRpYmlsaXR5UHJpbyhyaHMpKTtcclxuICAgICAgaWYgKHdvcnN0U3RhdHVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGVzKGdhbWVJZCwgbW9kSWQsIHtcclxuICAgICAgICAgIGxhc3RTTUFQSVF1ZXJ5OiBub3csXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5U3RhdHVzOiB3b3JzdFN0YXR1c1swXS5tZXRhZGF0YS5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eU1lc3NhZ2U6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdW1tYXJ5LFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVVwZGF0ZTogd29yc3RTdGF0dXNbMF0uc3VnZ2VzdGVkVXBkYXRlPy52ZXJzaW9uLFxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb2coJ2RlYnVnJywgJ25vIG1hbmlmZXN0Jyk7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnd2FybicsICdlcnJvciByZWFkaW5nIG1hbmlmZXN0JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGxldCBkZXBlbmRlbmN5TWFuYWdlcjogRGVwZW5kZW5jeU1hbmFnZXI7XHJcbiAgY29uc3QgZ2V0RGlzY292ZXJ5UGF0aCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxyXG4gICAgICBsb2coJ2Vycm9yJywgJ3N0YXJkZXd2YWxsZXkgd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZ2V0U01BUElQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaXNNb2RDYW5kaWRhdGVWYWxpZCA9IChtb2QsIGVudHJ5KSA9PiB7XHJcbiAgICBpZiAobW9kPy5pZCA9PT0gdW5kZWZpbmVkIHx8IG1vZC50eXBlID09PSAnc2R2cm9vdGZvbGRlcicpIHtcclxuICAgICAgLy8gVGhlcmUgaXMgbm8gcmVsaWFibGUgd2F5IHRvIGFzY2VydGFpbiB3aGV0aGVyIGEgbmV3IGZpbGUgZW50cnlcclxuICAgICAgLy8gIGFjdHVhbGx5IGJlbG9uZ3MgdG8gYSByb290IG1vZFR5cGUgYXMgc29tZSBvZiB0aGVzZSBtb2RzIHdpbGwgYWN0XHJcbiAgICAgIC8vICBhcyByZXBsYWNlbWVudCBtb2RzLiBUaGlzIG9idmlvdXNseSBtZWFucyB0aGF0IGlmIHRoZSBnYW1lIGhhc1xyXG4gICAgICAvLyAgYSBzdWJzdGFudGlhbCB1cGRhdGUgd2hpY2ggaW50cm9kdWNlcyBuZXcgZmlsZXMgd2UgY291bGQgcG90ZW50aWFsbHlcclxuICAgICAgLy8gIGFkZCBhIHZhbmlsbGEgZ2FtZSBmaWxlIGludG8gdGhlIG1vZCdzIHN0YWdpbmcgZm9sZGVyIGNhdXNpbmcgY29uc3RhbnRcclxuICAgICAgLy8gIGNvbnRlbnRpb24gYmV0d2VlbiB0aGUgZ2FtZSBpdHNlbGYgKHdoZW4gaXQgdXBkYXRlcykgYW5kIHRoZSBtb2QuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFRoZXJlIGlzIGFsc28gYSBwb3RlbnRpYWwgY2hhbmNlIGZvciByb290IG1vZFR5cGVzIHRvIGNvbmZsaWN0IHdpdGggcmVndWxhclxyXG4gICAgICAvLyAgbW9kcywgd2hpY2ggaXMgd2h5IGl0J3Mgbm90IHNhZmUgdG8gYXNzdW1lIHRoYXQgYW55IGFkZGl0aW9uIGluc2lkZSB0aGVcclxuICAgICAgLy8gIG1vZHMgZGlyZWN0b3J5IGNhbiBiZSBzYWZlbHkgYWRkZWQgdG8gdGhpcyBtb2QncyBzdGFnaW5nIGZvbGRlciBlaXRoZXIuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobW9kLnR5cGUgIT09ICdTTUFQSScpIHtcclxuICAgICAgLy8gT3RoZXIgbW9kIHR5cGVzIGRvIG5vdCByZXF1aXJlIGZ1cnRoZXIgdmFsaWRhdGlvbiAtIGl0IHNob3VsZCBiZSBmaW5lXHJcbiAgICAgIC8vICB0byBhZGQgdGhpcyBlbnRyeS5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICAgIGNvbnN0IG1vZHNTZWdJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICBjb25zdCBtb2RGb2xkZXJOYW1lID0gKChtb2RzU2VnSWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNTZWdJZHggKyAxKSlcclxuICAgICAgPyBzZWdtZW50c1ttb2RzU2VnSWR4ICsgMV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgbGV0IGJ1bmRsZWRNb2RzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ3NtYXBpQnVuZGxlZE1vZHMnXSwgW10pO1xyXG4gICAgYnVuZGxlZE1vZHMgPSBidW5kbGVkTW9kcy5sZW5ndGggPiAwID8gYnVuZGxlZE1vZHMgOiBnZXRCdW5kbGVkTW9kcygpO1xyXG4gICAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCdjb250ZW50JykpIHtcclxuICAgICAgLy8gU01BUEkgaXMgbm90IHN1cHBvc2VkIHRvIG92ZXJ3cml0ZSB0aGUgZ2FtZSdzIGNvbnRlbnQgZGlyZWN0bHkuXHJcbiAgICAgIC8vICB0aGlzIGlzIGNsZWFybHkgbm90IGEgU01BUEkgZmlsZSBhbmQgc2hvdWxkIF9ub3RfIGJlIGFkZGVkIHRvIGl0LlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChtb2RGb2xkZXJOYW1lICE9PSB1bmRlZmluZWQpICYmIGJ1bmRsZWRNb2RzLmluY2x1ZGVzKG1vZEZvbGRlck5hbWUpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IG1hbmlmZXN0RXh0cmFjdG9yID0gdG9CbHVlKFxyXG4gICAgYXN5bmMgKG1vZEluZm86IGFueSwgbW9kUGF0aD86IHN0cmluZyk6IFByb21pc2U8eyBba2V5OiBzdHJpbmddOiBhbnk7IH0+ID0+IHtcclxuICAgICAgaWYgKHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSkgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbWFuaWZlc3RzID0gYXdhaXQgZ2V0TW9kTWFuaWZlc3RzKG1vZFBhdGgpO1xyXG5cclxuICAgICAgY29uc3QgcGFyc2VkTWFuaWZlc3RzID0gKGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0cy5tYXAoXHJcbiAgICAgICAgYXN5bmMgbWFuaWZlc3QgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHBhcnNlTWFuaWZlc3QobWFuaWZlc3QpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IG1hbmlmZXN0RmlsZTogbWFuaWZlc3QsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KSkpLmZpbHRlcihtYW5pZmVzdCA9PiBtYW5pZmVzdCAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIGlmIChwYXJzZWRNYW5pZmVzdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHdlIGNhbiBvbmx5IHVzZSBvbmUgbWFuaWZlc3QgdG8gZ2V0IHRoZSBpZCBmcm9tXHJcbiAgICAgIGNvbnN0IHJlZk1hbmlmZXN0ID0gcGFyc2VkTWFuaWZlc3RzWzBdO1xyXG5cclxuICAgICAgY29uc3QgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBwYXJzZWRNYW5pZmVzdHNcclxuICAgICAgICAuZmlsdGVyKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlEICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpKTtcclxuXHJcbiAgICAgIGNvbnN0IG1pblNNQVBJVmVyc2lvbiA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuTWluaW11bUFwaVZlcnNpb24pXHJcbiAgICAgICAgLmZpbHRlcih2ZXJzaW9uID0+IHNlbXZlci52YWxpZCh2ZXJzaW9uKSlcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IHNlbXZlci5jb21wYXJlKHJocywgbGhzKSlbMF07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSB7XHJcbiAgICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMsXHJcbiAgICAgICAgbWluU01BUElWZXJzaW9uLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKHJlZk1hbmlmZXN0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAvLyBkb24ndCBzZXQgYSBjdXN0b20gZmlsZSBuYW1lIGZvciBTTUFQSVxyXG4gICAgICAgIGlmIChtb2RJbmZvLmRvd25sb2FkLm1vZEluZm8/Lm5leHVzPy5pZHM/Lm1vZElkICE9PSAyNDAwKSB7XHJcbiAgICAgICAgICByZXN1bHRbJ2N1c3RvbUZpbGVOYW1lJ10gPSByZWZNYW5pZmVzdC5OYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiAocmVmTWFuaWZlc3QuVmVyc2lvbikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICByZXN1bHRbJ21hbmlmZXN0VmVyc2lvbiddID0gcmVmTWFuaWZlc3QuVmVyc2lvbjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KTtcclxuICAgIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZShuZXcgU3RhcmRld1ZhbGxleShjb250ZXh0KSk7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICdTRFYnXSwgc2R2UmVkdWNlcnMpO1xyXG5cclxuICAvKlxyXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzLCB1bmRlZmluZWQsICgpID0+XHJcbiAgICBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELCAxNTApOyovXHJcblxyXG4gIC8vIFJlZ2lzdGVyIG91ciBTTUFQSSBtb2QgdHlwZSBhbmQgaW5zdGFsbGVyLiBOb3RlOiBUaGlzIGN1cnJlbnRseSBmbGFncyBhbiBlcnJvciBpbiBWb3J0ZXggb24gaW5zdGFsbGluZyBjb3JyZWN0bHkuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc21hcGktaW5zdGFsbGVyJywgMzAsIHRlc3RTTUFQSSwgKGZpbGVzLCBkZXN0KSA9PiBCbHVlYmlyZC5yZXNvbHZlKGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnU01BUEknLCAzMCwgZ2FtZUlkID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgZ2V0U01BUElQYXRoLCBpc1NNQVBJTW9kVHlwZSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRlc3RTdXBwb3J0ZWQsXHJcbiAgICAoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlciwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzZHZyb290Zm9sZGVyJywgNTAsIHRlc3RSb290Rm9sZGVyLCBpbnN0YWxsUm9vdEZvbGRlcik7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3NkdnJvb3Rmb2xkZXInLCAyNSwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXHJcbiAgICAoKSA9PiBnZXREaXNjb3ZlcnlQYXRoKCksIChpbnN0cnVjdGlvbnMpID0+IHtcclxuICAgICAgLy8gT25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zLlxyXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xyXG4gICAgICAvLyBUaGlzIGlzIGEgdHJpY2t5IHBhdHRlcm4gc28gd2UncmUgZ29pbmcgdG8gMXN0IHByZXNlbnQgdGhlIGRpZmZlcmVudCBwYWNrYWdpbmdcclxuICAgICAgLy8gIHBhdHRlcm5zIHdlIG5lZWQgdG8gY2F0ZXIgZm9yOlxyXG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXHJcbiAgICAgIC8vICAgIG1hbmlmZXN0IGZpbGVzIGFyZSBpbmNsdWRlZC5cclxuICAgICAgLy8gIDIuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlciArIG9uZSBvciBtb3JlIFNNQVBJIG1vZHMgaW5jbHVkZWRcclxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXHJcbiAgICAgIC8vICAzLiBBIHJlZ3VsYXIgU01BUEkgbW9kIHdpdGggYSBcIkNvbnRlbnRcIiBmb2xkZXIgaW5zaWRlIHRoZSBtb2QncyByb290IGRpci5cclxuICAgICAgLy9cclxuICAgICAgLy8gcGF0dGVybiAxOlxyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgZG9uJ3QgaGF2ZSBtYW5pZmVzdCBmaWxlc1xyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgaGF2ZSBhIFwiQ29udGVudFwiIGZvbGRlclxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUbyBzb2x2ZSBwYXR0ZXJucyAyIGFuZCAzIHdlJ3JlIGdvaW5nIHRvOlxyXG4gICAgICAvLyAgQ2hlY2sgd2hldGhlciB3ZSBoYXZlIGFueSBtYW5pZmVzdCBmaWxlcywgaWYgd2UgZG8sIHdlIGV4cGVjdCB0aGUgZm9sbG93aW5nXHJcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XHJcbiAgICAgIC8vICAgIGFyY2hpdmUuemlwID0+XHJcbiAgICAgIC8vICAgICAgLi4vQ29udGVudC9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL1xyXG4gICAgICAvLyAgICAgIC4uL01vZHMvQV9TTUFQSV9NT0RcXG1hbmlmZXN0Lmpzb25cclxuICAgICAgY29uc3QgaGFzTWFuaWZlc3QgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcclxuICAgICAgY29uc3QgaGFzTW9kc0ZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ01vZHMnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBoYXNDb250ZW50Rm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnQ29udGVudCcgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWRcclxuXHJcbiAgICAgIHJldHVybiAoaGFzTWFuaWZlc3QpXHJcbiAgICAgICAgPyBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIgJiYgaGFzTW9kc0ZvbGRlcilcclxuICAgICAgICA6IEJsdWViaXJkLnJlc29sdmUoaGFzQ29udGVudEZvbGRlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnY2hhbmdlbG9nJywge30sICdTTUFQSSBMb2cnLFxyXG4gICAgKCkgPT4geyBvblNob3dTTUFQSUxvZyhjb250ZXh0LmFwaSk7IH0sXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIC8vT25seSBzaG93IHRoZSBTTUFQSSBsb2cgYnV0dG9uIGZvciBTRFYuIFxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBdHRyaWJ1dGVFeHRyYWN0b3IoMjUsIG1hbmlmZXN0RXh0cmFjdG9yKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xyXG4gICAgaWQ6ICdzZHYtY29tcGF0aWJpbGl0eScsXHJcbiAgICBwb3NpdGlvbjogMTAwLFxyXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxyXG4gICAgcGxhY2VtZW50OiAndGFibGUnLFxyXG4gICAgY2FsYzogKG1vZDogdHlwZXMuSU1vZCkgPT4gbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XHJcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KENvbXBhdGliaWxpdHlJY29uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHQsIG1vZCwgZGV0YWlsQ2VsbCB9LCBbXSk7XHJcbiAgICB9LFxyXG4gICAgbmFtZTogJ0NvbXBhdGliaWxpdHknLFxyXG4gICAgaXNEZWZhdWx0VmlzaWJsZTogdHJ1ZSxcclxuICAgIGVkaXQ6IHt9LFxyXG4gIH0pO1xyXG5cclxuICAvKlxyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtbWlzc2luZy1kZXBlbmRlbmNpZXMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IHRlc3RNaXNzaW5nRGVwZW5kZW5jaWVzKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpO1xyXG4gICovXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3Nkdi1pbmNvbXBhdGlibGUtbW9kcycsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0U01BUElPdXRkYXRlZChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKSk7XHJcblxyXG4gIGludGVyZmFjZSBJQWRkZWRGaWxlIHtcclxuICAgIGZpbGVQYXRoOiBzdHJpbmc7XHJcbiAgICBjYW5kaWRhdGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb25zdCBwcm94eSA9IG5ldyBTTUFQSVByb3h5KGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ3NkdicsIHBhdGguam9pbihfX2Rpcm5hbWUsICdzZHZzdHlsZS5zY3NzJykpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmFkZE1ldGFTZXJ2ZXIoJ3NtYXBpLmlvJywge1xyXG4gICAgICB1cmw6ICcnLFxyXG4gICAgICBsb29wYmFja0NCOiAocXVlcnk6IElRdWVyeSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHByb3h5LmZpbmQocXVlcnkpKVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvb2sgdXAgc21hcGkgbWV0YSBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgY2FjaGVEdXJhdGlvblNlYzogODY0MDAsXHJcbiAgICAgIHByaW9yaXR5OiAyNSxcclxuICAgIH0pO1xyXG4gICAgZGVwZW5kZW5jeU1hbmFnZXIgPSBuZXcgRGVwZW5kZW5jeU1hbmFnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnYWRkZWQtZmlsZXMnLCBhc3luYyAocHJvZmlsZUlkLCBmaWxlczogSUFkZGVkRmlsZVtdKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG5cclxuICAgICAgYXdhaXQgQmx1ZWJpcmQubWFwKGZpbGVzLCBhc3luYyBlbnRyeSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcclxuICAgICAgICAgIGlmIChmcm9tID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXHJcbiAgICAgICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVzb2x2ZSBtb2QgcGF0aCBmb3IgbW9kIHR5cGUnLCBtb2QudHlwZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGZyb20sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXHJcbiAgICAgICAgICAvLyBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3QgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ2FyZSB0aGUgc2FtZSBmaWxlJykpIHtcclxuICAgICAgICAgICAgICAvLyBzaG91bGQgd2UgYmUgcmVwb3J0aW5nIHRoaXMgdG8gdGhlIHVzZXI/IFRoaXMgaXMgYSBjb21wbGV0ZWx5XHJcbiAgICAgICAgICAgICAgLy8gYXV0b21hdGVkIHByb2Nlc3MgYW5kIGlmIGl0IGZhaWxzIG1vcmUgb2Z0ZW4gdGhhbiBub3QgdGhlXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBwcm9iYWJseSBkb2Vzbid0IGNhcmVcclxuICAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZS1pbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgJ3NtYXBpJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09ICdzbWFwaScpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lSWQsIG1vZElkKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGxvZygnZGVidWcnLCAnYWRkZWQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCB9KSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGxvZygnZGVidWcnLCAndXBkYXRpbmcgU0RWIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZU1vZGVdID8/IHt9KS5tYXAobW9kSWQgPT5cclxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2RvbmUgdXBkYXRpbmcgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHVwZGF0ZSBjb25mbGljdCBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGluaXQ7XHJcbiJdfQ==