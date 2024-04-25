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
    context.registerSettings('Mods', Settings_1.default, undefined, () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID, 150);
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
        context.api.onAsync('will-enable-mods', (profileId, modIds, enabled) => (0, configMod_1.onWillEnableMods)(context.api, profileId, modIds, enabled));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFDMUMsNEVBQW9EO0FBQ3BELDJDQUFvRDtBQUVwRCw0RUFBb0Q7QUFDcEQsMERBQXFDO0FBQ3JDLDhEQUFzQztBQUN0QyxtQ0FBNEM7QUFDNUMsbUNBQW1IO0FBQ25ILGlDQUEyRDtBQUUzRCwwREFBa0M7QUFFbEMsMkNBQWdGO0FBRWhGLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDMUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ25DLEtBQUssR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQy9CLEVBQUUsUUFBUSxFQUFFLEdBQUcsaUJBQUksRUFDbkIsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFDakUsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUUxRixNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNyRCxNQUFNLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQztBQUMxQyxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyxDQUFDLHFCQUFxQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRzFELFNBQVMsTUFBTSxDQUFJLElBQW9DO0lBQ3JELE9BQU8s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RUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ1gsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHV0aWwsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5pbXBvcnQgQ29tcGF0aWJpbGl0eUljb24gZnJvbSAnLi9Db21wYXRpYmlsaXR5SWNvbic7XHJcbmltcG9ydCB7IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcclxuaW1wb3J0IHNkdlJlZHVjZXJzIGZyb20gJy4vcmVkdWNlcnMnO1xyXG5pbXBvcnQgU01BUElQcm94eSBmcm9tICcuL3NtYXBpUHJveHknO1xyXG5pbXBvcnQgeyB0ZXN0U01BUElPdXRkYXRlZCB9IGZyb20gJy4vdGVzdHMnO1xyXG5pbXBvcnQgeyBjb21wYXRpYmlsaXR5T3B0aW9ucywgQ29tcGF0aWJpbGl0eVN0YXR1cywgSVNEVkRlcGVuZGVuY3ksIElTRFZNb2RNYW5pZmVzdCwgSVNNQVBJUmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QsIGRlZmF1bHRNb2RzUmVsUGF0aCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQgU2V0dGluZ3MgZnJvbSAnLi9TZXR0aW5ncyc7XHJcblxyXG5pbXBvcnQgeyBvbkFkZGVkRmlsZXMsIG9uV2lsbEVuYWJsZU1vZHMsIHJlZ2lzdGVyQ29uZmlnTW9kIH0gZnJvbSAnLi9jb25maWdNb2QnO1xyXG5cclxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKSxcclxuICB7IGNsaXBib2FyZCB9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKSxcclxuICByanNvbiA9IHJlcXVpcmUoJ3JlbGF4ZWQtanNvbicpLFxyXG4gIHsgU2V2ZW5aaXAgfSA9IHV0aWwsXHJcbiAgeyBkZXBsb3lTTUFQSSwgZG93bmxvYWRTTUFQSSwgZmluZFNNQVBJTW9kIH0gPSByZXF1aXJlKCcuL1NNQVBJJyksXHJcbiAgeyBHQU1FX0lELCBfU01BUElfQlVORExFRF9NT0RTLCBnZXRCdW5kbGVkTW9kcywgTU9EX1RZUEVfQ09ORklHIH0gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xyXG5cclxuY29uc3QgTUFOSUZFU1RfRklMRSA9ICdtYW5pZmVzdC5qc29uJztcclxuY29uc3QgUFRSTl9DT05URU5UID0gcGF0aC5zZXAgKyAnQ29udGVudCcgKyBwYXRoLnNlcDtcclxuY29uc3QgU01BUElfRVhFID0gJ1N0YXJkZXdNb2RkaW5nQVBJLmV4ZSc7XHJcbmNvbnN0IFNNQVBJX0RMTCA9ICdTTUFQSS5JbnN0YWxsZXIuZGxsJztcclxuY29uc3QgU01BUElfREFUQSA9IFsnd2luZG93cy1pbnN0YWxsLmRhdCcsICdpbnN0YWxsLmRhdCddO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcblxyXG5jbGFzcyBTdGFyZGV3VmFsbGV5IGltcGxlbWVudHMgdHlwZXMuSUdhbWUge1xyXG4gIHB1YmxpYyBjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dDtcclxuICBwdWJsaWMgaWQ6IHN0cmluZyA9IEdBTUVfSUQ7XHJcbiAgcHVibGljIG5hbWU6IHN0cmluZyA9ICdTdGFyZGV3IFZhbGxleSc7XHJcbiAgcHVibGljIGxvZ286IHN0cmluZyA9ICdnYW1lYXJ0LmpwZyc7XHJcbiAgcHVibGljIHJlcXVpcmVkRmlsZXM6IHN0cmluZ1tdO1xyXG4gIHB1YmxpYyBlbnZpcm9ubWVudDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcclxuICAgIFN0ZWFtQVBQSWQ6ICc0MTMxNTAnLFxyXG4gIH07XHJcbiAgcHVibGljIGRldGFpbHM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7XHJcbiAgICBzdGVhbUFwcElkOiA0MTMxNTBcclxuICB9O1xyXG4gIHB1YmxpYyBzdXBwb3J0ZWRUb29sczogYW55W10gPSBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiAnc21hcGknLFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgICBsb2dvOiAnc21hcGkucG5nJyxcclxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gU01BUElfRVhFLFxyXG4gICAgICByZXF1aXJlZEZpbGVzOiBbU01BUElfRVhFXSxcclxuICAgICAgc2hlbGw6IHRydWUsXHJcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcclxuICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIGRlZmF1bHRQcmltYXJ5OiB0cnVlLFxyXG4gICAgfVxyXG4gIF07XHJcbiAgcHVibGljIG1lcmdlTW9kczogYm9vbGVhbiA9IHRydWU7XHJcbiAgcHVibGljIHJlcXVpcmVzQ2xlYW51cDogYm9vbGVhbiA9IHRydWU7XHJcbiAgcHVibGljIHNoZWxsOiBib29sZWFuID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcclxuICBwdWJsaWMgZGVmYXVsdFBhdGhzOiBzdHJpbmdbXTtcclxuXHJcbiAgLyoqKioqKioqKlxyXG4gICoqIFZvcnRleCBBUElcclxuICAqKioqKioqKiovXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0IGFuIGluc3RhbmNlLlxyXG4gICAqIEBwYXJhbSB7SUV4dGVuc2lvbkNvbnRleHR9IGNvbnRleHQgLS0gVGhlIFZvcnRleCBleHRlbnNpb24gY29udGV4dC5cclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gICAgLy8gcHJvcGVydGllcyB1c2VkIGJ5IFZvcnRleFxyXG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgIHRoaXMucmVxdWlyZWRGaWxlcyA9IHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xyXG4gICAgICA/IFsnU3RhcmRldyBWYWxsZXkuZXhlJ11cclxuICAgICAgOiBbJ1N0YXJkZXdWYWxsZXknLCAnU3RhcmRld1ZhbGxleS5leGUnXTtcclxuXHJcbiAgICAvLyBjdXN0b20gcHJvcGVydGllc1xyXG4gICAgdGhpcy5kZWZhdWx0UGF0aHMgPSBbXHJcbiAgICAgIC8vIExpbnV4XHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0dPRyBHYW1lcy9TdGFyZGV3IFZhbGxleS9nYW1lJyxcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvLmxvY2FsL3NoYXJlL1N0ZWFtL3N0ZWFtYXBwcy9jb21tb24vU3RhcmRldyBWYWxsZXknLFxyXG5cclxuICAgICAgLy8gTWFjXHJcbiAgICAgICcvQXBwbGljYXRpb25zL1N0YXJkZXcgVmFsbGV5LmFwcC9Db250ZW50cy9NYWNPUycsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5L0NvbnRlbnRzL01hY09TJyxcclxuXHJcbiAgICAgIC8vIFdpbmRvd3NcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR2FsYXh5Q2xpZW50XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR09HIEdhbGF4eVxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXFN0ZWFtXFxcXHN0ZWFtYXBwc1xcXFxjb21tb25cXFxcU3RhcmRldyBWYWxsZXknXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgZmluZCB0aGUgZ2FtZSBpbnN0YWxsIHBhdGguXHJcbiAgICpcclxuICAgKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gcXVpY2tseSBhbmQsIGlmIGl0IHJldHVybnMgYSB2YWx1ZSwgaXQgc2hvdWxkIGRlZmluaXRpdmVseSBiZSB0aGVcclxuICAgKiB2YWxpZCBnYW1lIHBhdGguIFVzdWFsbHkgdGhpcyBmdW5jdGlvbiB3aWxsIHF1ZXJ5IHRoZSBwYXRoIGZyb20gdGhlIHJlZ2lzdHJ5IG9yIGZyb20gc3RlYW0uXHJcbiAgICogVGhpcyBmdW5jdGlvbiBtYXkgcmV0dXJuIGEgcHJvbWlzZSBhbmQgaXQgc2hvdWxkIGRvIHRoYXQgaWYgaXQncyBkb2luZyBJL08uXHJcbiAgICpcclxuICAgKiBUaGlzIG1heSBiZSBsZWZ0IHVuZGVmaW5lZCBidXQgdGhlbiB0aGUgdG9vbC9nYW1lIGNhbiBvbmx5IGJlIGRpc2NvdmVyZWQgYnkgc2VhcmNoaW5nIHRoZSBkaXNrXHJcbiAgICogd2hpY2ggaXMgc2xvdyBhbmQgb25seSBoYXBwZW5zIG1hbnVhbGx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBxdWVyeVBhdGggPSB0b0JsdWUoYXN5bmMgKCkgPT4ge1xyXG4gICAgLy8gY2hlY2sgU3RlYW1cclxuICAgIGNvbnN0IGdhbWUgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzQxMzE1MCcsICcxNDUzMzc1MjUzJ10pO1xyXG4gICAgaWYgKGdhbWUpXHJcbiAgICAgIHJldHVybiBnYW1lLmdhbWVQYXRoO1xyXG5cclxuICAgIC8vIGNoZWNrIGRlZmF1bHQgcGF0aHNcclxuICAgIGZvciAoY29uc3QgZGVmYXVsdFBhdGggb2YgdGhpcy5kZWZhdWx0UGF0aHMpXHJcbiAgICB7XHJcbiAgICAgIGlmIChhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhkZWZhdWx0UGF0aCkpXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRQYXRoO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHBhdGggb2YgdGhlIHRvb2wgZXhlY3V0YWJsZSByZWxhdGl2ZSB0byB0aGUgdG9vbCBiYXNlIHBhdGgsIGkuZS4gYmluYXJpZXMvVVQzLmV4ZSBvclxyXG4gICAqIFRFU1YuZXhlLiBUaGlzIGlzIGEgZnVuY3Rpb24gc28gdGhhdCB5b3UgY2FuIHJldHVybiBkaWZmZXJlbnQgdGhpbmdzIGJhc2VkIG9uIHRoZSBvcGVyYXRpbmdcclxuICAgKiBzeXN0ZW0gZm9yIGV4YW1wbGUgYnV0IGJlIGF3YXJlIHRoYXQgaXQgd2lsbCBiZSBldmFsdWF0ZWQgYXQgYXBwbGljYXRpb24gc3RhcnQgYW5kIG9ubHkgb25jZSxcclxuICAgKiBzbyB0aGUgcmV0dXJuIHZhbHVlIGNhbiBub3QgZGVwZW5kIG9uIHRoaW5ncyB0aGF0IGNoYW5nZSBhdCBydW50aW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBleGVjdXRhYmxlKCkge1xyXG4gICAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xyXG4gICAgICA/ICdTdGFyZGV3IFZhbGxleS5leGUnXHJcbiAgICAgIDogJ1N0YXJkZXdWYWxsZXknO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBkZWZhdWx0IGRpcmVjdG9yeSB3aGVyZSBtb2RzIGZvciB0aGlzIGdhbWUgc2hvdWxkIGJlIHN0b3JlZC5cclxuICAgKiBcclxuICAgKiBJZiB0aGlzIHJldHVybnMgYSByZWxhdGl2ZSBwYXRoIHRoZW4gdGhlIHBhdGggaXMgdHJlYXRlZCBhcyByZWxhdGl2ZSB0byB0aGUgZ2FtZSBpbnN0YWxsYXRpb25cclxuICAgKiBkaXJlY3RvcnkuIFNpbXBseSByZXR1cm4gYSBkb3QgKCAoKSA9PiAnLicgKSBpZiBtb2RzIGFyZSBpbnN0YWxsZWQgZGlyZWN0bHkgaW50byB0aGUgZ2FtZVxyXG4gICAqIGRpcmVjdG9yeS5cclxuICAgKi8gXHJcbiAgcHVibGljIHF1ZXJ5TW9kUGF0aCgpXHJcbiAge1xyXG4gICAgcmV0dXJuIGRlZmF1bHRNb2RzUmVsUGF0aCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3B0aW9uYWwgc2V0dXAgZnVuY3Rpb24uIElmIHRoaXMgZ2FtZSByZXF1aXJlcyBzb21lIGZvcm0gb2Ygc2V0dXAgYmVmb3JlIGl0IGNhbiBiZSBtb2RkZWQgKGxpa2VcclxuICAgKiBjcmVhdGluZyBhIGRpcmVjdG9yeSwgY2hhbmdpbmcgYSByZWdpc3RyeSBrZXksIC4uLikgZG8gaXQgaGVyZS4gSXQgd2lsbCBiZSBjYWxsZWQgZXZlcnkgdGltZVxyXG4gICAqIGJlZm9yZSB0aGUgZ2FtZSBtb2RlIGlzIGFjdGl2YXRlZC5cclxuICAgKiBAcGFyYW0ge0lEaXNjb3ZlcnlSZXN1bHR9IGRpc2NvdmVyeSAtLSBiYXNpYyBpbmZvIGFib3V0IHRoZSBnYW1lIGJlaW5nIGxvYWRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0dXAgPSB0b0JsdWUoYXN5bmMgKGRpc2NvdmVyeSkgPT4ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBmb2xkZXIgZm9yIFNNQVBJIG1vZHMgZXhpc3RzLlxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCgpKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBza2lwIGlmIFNNQVBJIGZvdW5kXHJcbiAgICBjb25zdCBzbWFwaVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIFNNQVBJX0VYRSk7XHJcbiAgICBjb25zdCBzbWFwaUZvdW5kID0gYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoc21hcGlQYXRoKTtcclxuICAgIGlmICghc21hcGlGb3VuZCkge1xyXG4gICAgICB0aGlzLnJlY29tbWVuZFNtYXBpKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5jb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG5cclxuICAgIC8qXHJcbiAgICBpZiAoc3RhdGUuc2V0dGluZ3NbJ1NEViddLnVzZVJlY29tbWVuZGF0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2hvdyBSZWNvbW1lbmRhdGlvbnM/Jywge1xyXG4gICAgICAgIHRleHQ6ICdWb3J0ZXggY2FuIG9wdGlvbmFsbHkgdXNlIGRhdGEgZnJvbSBTTUFQSVxcJ3MgZGF0YWJhc2UgYW5kICdcclxuICAgICAgICAgICAgKyAndGhlIG1hbmlmZXN0IGZpbGVzIGluY2x1ZGVkIHdpdGggbW9kcyB0byByZWNvbW1lbmQgYWRkaXRpb25hbCAnXHJcbiAgICAgICAgICAgICsgJ2NvbXBhdGlibGUgbW9kcyB0aGF0IHdvcmsgd2l0aCB0aG9zZSB0aGF0IHlvdSBoYXZlIGluc3RhbGxlZC4gJ1xyXG4gICAgICAgICAgICArICdJbiBzb21lIGNhc2VzLCB0aGlzIGluZm9ybWF0aW9uIGNvdWxkIGJlIHdyb25nIG9yIGluY29tcGxldGUgJ1xyXG4gICAgICAgICAgICArICd3aGljaCBtYXkgbGVhZCB0byB1bnJlbGlhYmxlIHByb21wdHMgc2hvd2luZyBpbiB0aGUgYXBwLlxcbidcclxuICAgICAgICAgICAgKyAnQWxsIHJlY29tbWVuZGF0aW9ucyBzaG93biBzaG91bGQgYmUgY2FyZWZ1bGx5IGNvbnNpZGVyZWQgJ1xyXG4gICAgICAgICAgICArICdiZWZvcmUgYWNjZXB0aW5nIHRoZW0gLSBpZiB5b3UgYXJlIHVuc3VyZSBwbGVhc2UgY2hlY2sgdGhlICdcclxuICAgICAgICAgICAgKyAnbW9kIHBhZ2UgdG8gc2VlIGlmIHRoZSBhdXRob3IgaGFzIHByb3ZpZGVkIGFueSBmdXJ0aGVyIGluc3RydWN0aW9ucy4gJ1xyXG4gICAgICAgICAgICArICdXb3VsZCB5b3UgbGlrZSB0byBlbmFibGUgdGhpcyBmZWF0dXJlPyBZb3UgY2FuIHVwZGF0ZSB5b3VyIGNob2ljZSAnXHJcbiAgICAgICAgICAgICsgJ2Zyb20gdGhlIFNldHRpbmdzIG1lbnUgYXQgYW55IHRpbWUuJ1xyXG4gICAgICB9LCBbXHJcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlIHdpdGhvdXQgcmVjb21tZW5kYXRpb25zJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFJlY29tbWVuZGF0aW9ucyhmYWxzZSkpO1xyXG4gICAgICAgIH0gfSxcclxuICAgICAgICB7IGxhYmVsOiAnRW5hYmxlIHJlY29tbWVuZGF0aW9ucycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRSZWNvbW1lbmRhdGlvbnModHJ1ZSkpO1xyXG4gICAgICAgIH0gfSxcclxuICAgICAgXSlcclxuICAgIH0qL1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgcHJpdmF0ZSByZWNvbW1lbmRTbWFwaSgpIHtcclxuICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKHRoaXMuY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgdGl0bGUgPSBzbWFwaU1vZCA/ICdTTUFQSSBpcyBub3QgZGVwbG95ZWQnIDogJ1NNQVBJIGlzIG5vdCBpbnN0YWxsZWQnO1xyXG4gICAgY29uc3QgYWN0aW9uVGl0bGUgPSBzbWFwaU1vZCA/ICdEZXBsb3knIDogJ0dldCBTTUFQSSc7XHJcbiAgICBjb25zdCBhY3Rpb24gPSAoKSA9PiAoc21hcGlNb2RcclxuICAgICAgPyBkZXBsb3lTTUFQSSh0aGlzLmNvbnRleHQuYXBpKVxyXG4gICAgICA6IGRvd25sb2FkU01BUEkodGhpcy5jb250ZXh0LmFwaSkpXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpKTtcclxuXHJcbiAgICB0aGlzLmNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ3NtYXBpLW1pc3NpbmcnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBtZXNzYWdlOiAnU01BUEkgaXMgcmVxdWlyZWQgdG8gbW9kIFN0YXJkZXcgVmFsbGV5LicsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogYWN0aW9uVGl0bGUsXHJcbiAgICAgICAgICBhY3Rpb24sXHJcbiAgICAgICAgfSxcclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogSW50ZXJuYWwgbWV0aG9kc1xyXG4gICoqKioqKioqKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgY2hlY2sgd2hldGhlciBhIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGggZXhpc3RzLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gVGhlIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGguXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0UGF0aEV4aXN0c0FzeW5jKHBhdGgpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aCk7XHJcbiAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBjYXRjaChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgcmVhZCBhIHJlZ2lzdHJ5IGtleSB2YWx1ZS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGl2ZSAtIFRoZSByZWdpc3RyeSBoaXZlIHRvIGFjY2Vzcy4gVGhpcyBzaG91bGQgYmUgYSBjb25zdGFudCBsaWtlIFJlZ2lzdHJ5LkhLTE0uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIFRoZSByZWdpc3RyeSBrZXkuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdG8gcmVhZC5cclxuICAgKi9cclxuICBhc3luYyByZWFkUmVnaXN0cnlLZXlBc3luYyhoaXZlLCBrZXksIG5hbWUpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoaGl2ZSwga2V5LCBuYW1lKTtcclxuICAgICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RGb2xkZXIoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIFdlIGFzc3VtZSB0aGF0IGFueSBtb2QgY29udGFpbmluZyBcIi9Db250ZW50L1wiIGluIGl0cyBkaXJlY3RvcnlcclxuICAvLyAgc3RydWN0dXJlIGlzIG1lYW50IHRvIGJlIGRlcGxveWVkIHRvIHRoZSByb290IGZvbGRlci5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpKTtcclxuICBjb25zdCBjb250ZW50RGlyID0gZmlsdGVyZWQuZmluZChmaWxlID0+IGZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoY29udGVudERpciAhPT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RGb2xkZXIoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFdlJ3JlIGdvaW5nIHRvIGRlcGxveSBcIi9Db250ZW50L1wiIGFuZCB3aGF0ZXZlciBmb2xkZXJzIGNvbWUgYWxvbmdzaWRlIGl0LlxyXG4gIC8vICBpLmUuIFNvbWVNb2QuN3pcclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Db250ZW50L1xyXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL01vZHMvXHJcbiAgLy8gIFdpbGwgTk9UIGJlIGRlcGxveWVkID0+IC4uL1JlYWRtZS5kb2NcclxuICBjb25zdCBjb250ZW50RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICBjb25zdCBpZHggPSBjb250ZW50RmlsZS5pbmRleE9mKFBUUk5fQ09OVEVOVCkgKyAxO1xyXG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLmJhc2VuYW1lKGNvbnRlbnRGaWxlLnN1YnN0cmluZygwLCBpZHgpKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKVxyXG4gICAgJiYgKGZpbGUuaW5kZXhPZihyb290RGlyKSAhPT0gLTEpXHJcbiAgICAmJiAocGF0aC5leHRuYW1lKGZpbGUpICE9PSAnLnR4dCcpKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc3Vic3RyKGlkeCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KGZpbGVQYXRoKSB7XHJcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICBjb25zdCBpc01hbmlmZXN0RmlsZSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID09PSBNQU5JRkVTVF9GSUxFO1xyXG4gIGNvbnN0IGlzTG9jYWxlID0gc2VnbWVudHMuaW5jbHVkZXMoJ2xvY2FsZScpO1xyXG4gIHJldHVybiBpc01hbmlmZXN0RmlsZSAmJiAhaXNMb2NhbGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWQoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChpc1ZhbGlkTWFuaWZlc3QpICE9PSB1bmRlZmluZWQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgICAgLy8gV2UgY3JlYXRlIGEgcHJlZml4IGZha2UgZGlyZWN0b3J5IGp1c3QgaW4gY2FzZSB0aGUgY29udGVudFxyXG4gICAgICAvLyAgZm9sZGVyIGlzIGluIHRoZSBhcmNoaXZlJ3Mgcm9vdCBmb2xkZXIuIFRoaXMgaXMgdG8gZW5zdXJlIHdlXHJcbiAgICAgIC8vICBmaW5kIGEgbWF0Y2ggZm9yIFwiL0NvbnRlbnQvXCJcclxuICAgICAgY29uc3QgdGVzdEZpbGUgPSBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKTtcclxuICAgICAgcmV0dXJuICh0ZXN0RmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICAgIH0pID09PSB1bmRlZmluZWQpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbChhcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeU1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gVGhlIGFyY2hpdmUgbWF5IGNvbnRhaW4gbXVsdGlwbGUgbWFuaWZlc3QgZmlsZXMgd2hpY2ggd291bGRcclxuICAvLyAgaW1wbHkgdGhhdCB3ZSdyZSBpbnN0YWxsaW5nIG11bHRpcGxlIG1vZHMuXHJcbiAgY29uc3QgbWFuaWZlc3RGaWxlcyA9IGZpbGVzLmZpbHRlcihpc1ZhbGlkTWFuaWZlc3QpO1xyXG5cclxuICBpbnRlcmZhY2UgSU1vZEluZm8ge1xyXG4gICAgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdDtcclxuICAgIHJvb3RGb2xkZXI6IHN0cmluZztcclxuICAgIG1hbmlmZXN0SW5kZXg6IG51bWJlcjtcclxuICAgIG1vZEZpbGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGxldCBwYXJzZUVycm9yOiBFcnJvcjtcclxuXHJcbiAgYXdhaXQgZGVwZW5kZW5jeU1hbmFnZXIuc2Nhbk1hbmlmZXN0cyh0cnVlKTtcclxuICBsZXQgbW9kczogSU1vZEluZm9bXSA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0RmlsZXMubWFwKGFzeW5jIG1hbmlmZXN0RmlsZSA9PiB7XHJcbiAgICBjb25zdCByb290Rm9sZGVyID0gcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdEluZGV4ID0gbWFuaWZlc3RGaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihNQU5JRkVTVF9GSUxFKTtcclxuICAgIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZSkgPT4gKHJvb3RGb2xkZXIgIT09ICcuJylcclxuICAgICAgPyAoKGZpbGUuaW5kZXhPZihyb290Rm9sZGVyKSAhPT0gLTEpXHJcbiAgICAgICAgJiYgKHBhdGguZGlybmFtZShmaWxlKSAhPT0gJy4nKVxyXG4gICAgICAgICYmICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgICAgOiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID1cclxuICAgICAgICBhd2FpdCBwYXJzZU1hbmlmZXN0KHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1hbmlmZXN0RmlsZSkpO1xyXG4gICAgICBjb25zdCBtb2RGaWxlcyA9IGZpbGVzLmZpbHRlcihmaWx0ZXJGdW5jKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBtYW5pZmVzdCxcclxuICAgICAgICByb290Rm9sZGVyLFxyXG4gICAgICAgIG1hbmlmZXN0SW5kZXgsXHJcbiAgICAgICAgbW9kRmlsZXMsXHJcbiAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8ganVzdCBhIHdhcm5pbmcgYXQgdGhpcyBwb2ludCBhcyB0aGlzIG1heSBub3QgYmUgdGhlIG1haW4gbWFuaWZlc3QgZm9yIHRoZSBtb2RcclxuICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgbWFuaWZlc3RGaWxlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgIHBhcnNlRXJyb3IgPSBlcnI7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgfSkpO1xyXG5cclxuICBtb2RzID0gbW9kcy5maWx0ZXIoeCA9PiB4ICE9PSB1bmRlZmluZWQpO1xyXG4gIFxyXG4gIGlmIChtb2RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcclxuICAgICAgJ1RoZSBtb2QgbWFuaWZlc3QgaXMgaW52YWxpZCBhbmQgY2FuXFwndCBiZSByZWFkLiBZb3UgY2FuIHRyeSB0byBpbnN0YWxsIHRoZSBtb2QgYW55d2F5IHZpYSByaWdodC1jbGljayAtPiBcIlVucGFjayAoYXMtaXMpXCInLFxyXG4gICAgICBwYXJzZUVycm9yLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLm1hcChtb2RzLCBtb2QgPT4ge1xyXG4gICAgLy8gVE9ETzogd2UgbWlnaHQgZ2V0IGhlcmUgd2l0aCBhIG1vZCB0aGF0IGhhcyBhIG1hbmlmZXN0Lmpzb24gZmlsZSBidXQgd2Fzbid0IGludGVuZGVkIGZvciBTdGFyZGV3IFZhbGxleSwgYWxsXHJcbiAgICAvLyAgdGh1bmRlcnN0b3JlIG1vZHMgd2lsbCBjb250YWluIGEgbWFuaWZlc3QuanNvbiBmaWxlXHJcbiAgICBjb25zdCBtb2ROYW1lID0gKG1vZC5yb290Rm9sZGVyICE9PSAnLicpXHJcbiAgICAgID8gbW9kLnJvb3RGb2xkZXJcclxuICAgICAgOiBtb2QubWFuaWZlc3QuTmFtZSA/PyBtb2Qucm9vdEZvbGRlcjtcclxuXHJcbiAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtb2QubWFuaWZlc3QuRGVwZW5kZW5jaWVzIHx8IFtdO1xyXG5cclxuICAgIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbW9kLm1vZEZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gcGF0aC5qb2luKG1vZE5hbWUsIGZpbGUuc3Vic3RyKG1vZC5tYW5pZmVzdEluZGV4KSk7XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWRkUnVsZUZvckRlcGVuZGVuY3kgPSAoZGVwOiBJU0RWRGVwZW5kZW5jeSkgPT4ge1xyXG4gICAgICBpZiAoKGRlcC5VbmlxdWVJRCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgfHwgKGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpID09PSAneW91cm5hbWUueW91cm90aGVyc3BhY2tzYW5kbW9kcycpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSBkZXAuTWluaW11bVZlcnNpb24gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gYD49JHtkZXAuTWluaW11bVZlcnNpb259YFxyXG4gICAgICAgIDogJyonO1xyXG4gICAgICBjb25zdCBydWxlOiB0eXBlcy5JTW9kUnVsZSA9IHtcclxuICAgICAgICAvLyB0cmVhdGluZyBhbGwgZGVwZW5kZW5jaWVzIGFzIHJlY29tbWVuZGF0aW9ucyBiZWNhdXNlIHRoZSBkZXBlbmRlbmN5IGluZm9ybWF0aW9uXHJcbiAgICAgICAgLy8gcHJvdmlkZWQgYnkgc29tZSBtb2QgYXV0aG9ycyBpcyBhIGJpdCBoaXQtYW5kLW1pc3MgYW5kIFZvcnRleCBmYWlybHkgYWdncmVzc2l2ZWx5XHJcbiAgICAgICAgLy8gZW5mb3JjZXMgcmVxdWlyZW1lbnRzXHJcbiAgICAgICAgLy8gdHlwZTogKGRlcC5Jc1JlcXVpcmVkID8/IHRydWUpID8gJ3JlcXVpcmVzJyA6ICdyZWNvbW1lbmRzJyxcclxuICAgICAgICB0eXBlOiAncmVjb21tZW5kcycsXHJcbiAgICAgICAgcmVmZXJlbmNlOiB7XHJcbiAgICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgdmVyc2lvbk1hdGNoLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXh0cmE6IHtcclxuICAgICAgICAgIG9ubHlJZkZ1bGZpbGxhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgYXV0b21hdGljOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH07XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAncnVsZScsXHJcbiAgICAgICAgcnVsZSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgIGlmIChhcGkuZ2V0U3RhdGUoKS5zZXR0aW5nc1snU0RWJ10/LnVzZVJlY29tbWVuZGF0aW9ucyA/PyBmYWxzZSkge1xyXG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShkZXApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0Zvcik7XHJcbiAgICAgIH1cclxuICAgIH0qL1xyXG4gICAgcmV0dXJuIGluc3RydWN0aW9ucztcclxuICB9KVxyXG4gICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChkYXRhKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiBhY2N1bS5jb25jYXQoaXRlciksIFtdKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1NNQVBJTW9kVHlwZShpbnN0cnVjdGlvbnMpIHtcclxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS5cclxuICBjb25zdCBzbWFwaURhdGEgPSBpbnN0cnVjdGlvbnMuZmluZChpbnN0ID0+IChpbnN0LnR5cGUgPT09ICdjb3B5JykgJiYgaW5zdC5zb3VyY2UuZW5kc1dpdGgoU01BUElfRVhFKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHNtYXBpRGF0YSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFNNQVBJKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBNYWtlIHN1cmUgdGhlIGRvd25sb2FkIGNvbnRhaW5zIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmUuc1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmIChmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgIHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IFNNQVBJX0RMTCkgIT09IHVuZGVmaW5lZClcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICAgIHN1cHBvcnRlZCxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgY29uc3QgZm9sZGVyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJ1xyXG4gICAgPyAnd2luZG93cydcclxuICAgIDogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2xpbnV4J1xyXG4gICAgICA/ICdsaW51eCdcclxuICAgICAgOiAnbWFjb3MnO1xyXG4gIGNvbnN0IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0gPSAoZmlsZSkgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcclxuICAgIHJldHVybiAoc2VnbWVudHMuaW5jbHVkZXMoZm9sZGVyKSk7XHJcbiAgfVxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGRhdGEgYXJjaGl2ZVxyXG4gIGNvbnN0IGRhdGFGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgIGNvbnN0IGlzQ29ycmVjdFBsYXRmb3JtID0gZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybShmaWxlKTtcclxuICAgIHJldHVybiBpc0NvcnJlY3RQbGF0Zm9ybSAmJiBTTUFQSV9EQVRBLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSlcclxuICB9KTtcclxuICBpZiAoZGF0YUZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gZmluZCB0aGUgU01BUEkgZGF0YSBmaWxlcyAtIGRvd25sb2FkIGFwcGVhcnMgJ1xyXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xyXG4gIH1cclxuICBsZXQgZGF0YSA9ICcnO1xyXG4gIHRyeSB7XHJcbiAgICBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oZ2V0RGlzY292ZXJ5UGF0aCgpLCAnU3RhcmRldyBWYWxsZXkuZGVwcy5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFNEViBkZXBlbmRlbmNpZXMnLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy8gZmlsZSB3aWxsIGJlIG91dGRhdGVkIGFmdGVyIHRoZSB3YWxrIG9wZXJhdGlvbiBzbyBwcmVwYXJlIGEgcmVwbGFjZW1lbnQuIFxyXG4gIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IFtdO1xyXG5cclxuICBjb25zdCBzemlwID0gbmV3IFNldmVuWmlwKCk7XHJcbiAgLy8gVW56aXAgdGhlIGZpbGVzIGZyb20gdGhlIGRhdGEgYXJjaGl2ZS4gVGhpcyBkb2Vzbid0IHNlZW0gdG8gYmVoYXZlIGFzIGRlc2NyaWJlZCBoZXJlOiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9ub2RlLTd6I2V2ZW50c1xyXG4gIGF3YWl0IHN6aXAuZXh0cmFjdEZ1bGwocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgZGF0YUZpbGUpLCBkZXN0aW5hdGlvblBhdGgpO1xyXG5cclxuICAvLyBGaW5kIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgaW4gdGhlIHBhcmVudCBmb2xkZXIuIFxyXG4gIGF3YWl0IHV0aWwud2FsayhkZXN0aW5hdGlvblBhdGgsIChpdGVyLCBzdGF0cykgPT4ge1xyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkZXN0aW5hdGlvblBhdGgsIGl0ZXIpO1xyXG4gICAgICAvLyBGaWx0ZXIgb3V0IGZpbGVzIGZyb20gdGhlIG9yaWdpbmFsIGluc3RhbGwgYXMgdGhleSdyZSBubyBsb25nZXIgcmVxdWlyZWQuXHJcbiAgICAgIGlmICghZmlsZXMuaW5jbHVkZXMocmVsUGF0aCkgJiYgc3RhdHMuaXNGaWxlKCkgJiYgIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgrcGF0aC5zZXApKSB1cGRhdGVkRmlsZXMucHVzaChyZWxQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICBjb25zdCBtb2RzRm9sZGVySWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgICBpZiAoKG1vZHNGb2xkZXJJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc0ZvbGRlcklkeCArIDEpKSB7XHJcbiAgICAgICAgX1NNQVBJX0JVTkRMRURfTU9EUy5wdXNoKHNlZ21lbnRzW21vZHNGb2xkZXJJZHggKyAxXSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuIFxyXG4gIGNvbnN0IHNtYXBpRXhlID0gdXBkYXRlZEZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoU01BUElfRVhFLnRvTG93ZXJDYXNlKCkpKTtcclxuICBpZiAoc21hcGlFeGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGBGYWlsZWQgdG8gZXh0cmFjdCAke1NNQVBJX0VYRX0gLSBkb3dubG9hZCBhcHBlYXJzIGBcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgY29uc3QgaWR4ID0gc21hcGlFeGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKHNtYXBpRXhlKSk7XHJcblxyXG4gIC8vIEJ1aWxkIHRoZSBpbnN0cnVjdGlvbnMgZm9yIGluc3RhbGxhdGlvbi4gXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IHVwZGF0ZWRGaWxlcy5tYXAoZmlsZSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKGZpbGUuc3Vic3RyKGlkeCkpLFxyXG4gICAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAga2V5OiAnc21hcGlCdW5kbGVkTW9kcycsXHJcbiAgICB2YWx1ZTogZ2V0QnVuZGxlZE1vZHMoKSxcclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgdHlwZTogJ2dlbmVyYXRlZmlsZScsXHJcbiAgICBkYXRhLFxyXG4gICAgZGVzdGluYXRpb246ICdTdGFyZGV3TW9kZGluZ0FQSS5kZXBzLmpzb24nLFxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgbG9nRmlsZSkge1xyXG4gIGNvbnN0IGxvZ0RhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihiYXNlUGF0aCwgbG9nRmlsZSksIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XHJcbiAgYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnU01BUEkgTG9nJywge1xyXG4gICAgdGV4dDogJ1lvdXIgU01BUEkgbG9nIGlzIGRpc3BsYXllZCBiZWxvdy4gVG8gc2hhcmUgaXQsIGNsaWNrIFwiQ29weSAmIFNoYXJlXCIgd2hpY2ggd2lsbCBjb3B5IGl0IHRvIHlvdXIgY2xpcGJvYXJkIGFuZCBvcGVuIHRoZSBTTUFQSSBsb2cgc2hhcmluZyB3ZWJzaXRlLiAnICtcclxuICAgICAgJ05leHQsIHBhc3RlIHlvdXIgY29kZSBpbnRvIHRoZSB0ZXh0IGJveCBhbmQgcHJlc3MgXCJzYXZlICYgcGFyc2UgbG9nXCIuIFlvdSBjYW4gbm93IHNoYXJlIGEgbGluayB0byB0aGlzIHBhZ2Ugd2l0aCBvdGhlcnMgc28gdGhleSBjYW4gc2VlIHlvdXIgbG9nIGZpbGUuXFxuXFxuJyArIGxvZ0RhdGFcclxuICB9LCBbe1xyXG4gICAgbGFiZWw6ICdDb3B5ICYgU2hhcmUgbG9nJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9eLitUKFteXFwuXSspLisvLCAnJDEnKTtcclxuICAgICAgY2xpcGJvYXJkLndyaXRlVGV4dChgWyR7dGltZXN0YW1wfSBJTkZPIFZvcnRleF0gTG9nIGV4cG9ydGVkIGJ5IFZvcnRleCAke3V0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9ufS5cXG5gICsgbG9nRGF0YSk7XHJcbiAgICAgIHJldHVybiB1dGlsLm9wbignaHR0cHM6Ly9zbWFwaS5pby9sb2cnKS5jYXRjaChlcnIgPT4gdW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9LCB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHVuZGVmaW5lZCB9XSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uU2hvd1NNQVBJTG9nKGFwaSkge1xyXG4gIC8vUmVhZCBhbmQgZGlzcGxheSB0aGUgbG9nLlxyXG4gIGNvbnN0IGJhc2VQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnYXBwRGF0YScpLCAnc3RhcmRld3ZhbGxleScsICdlcnJvcmxvZ3MnKTtcclxuICB0cnkge1xyXG4gICAgLy9JZiB0aGUgY3Jhc2ggbG9nIGV4aXN0cywgc2hvdyB0aGF0LlxyXG4gICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktY3Jhc2gudHh0XCIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy9PdGhlcndpc2Ugc2hvdyB0aGUgbm9ybWFsIGxvZy5cclxuICAgICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktbGF0ZXN0LnR4dFwiKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvL09yIEluZm9ybSB0aGUgdXNlciB0aGVyZSBhcmUgbm8gbG9ncy5cclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oeyB0eXBlOiAnaW5mbycsIHRpdGxlOiAnTm8gU01BUEkgbG9ncyBmb3VuZC4nLCBtZXNzYWdlOiAnJywgZGlzcGxheU1TOiA1MDAwIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TW9kTWFuaWZlc3RzKG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgY29uc3QgbWFuaWZlc3RzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuICBpZiAobW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XHJcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcclxuICAgICAgICBtYW5pZmVzdHMucHVzaChlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcclxuICAgIC50aGVuKCgpID0+IG1hbmlmZXN0cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZUNvbmZsaWN0SW5mbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFwaTogU01BUElQcm94eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWQ6IHN0cmluZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgbW9kID0gYXBpLmdldFN0YXRlKCkucGVyc2lzdGVudC5tb2RzW2dhbWVJZF1bbW9kSWRdO1xyXG5cclxuICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcblxyXG4gIGlmICgobm93IC0gbW9kLmF0dHJpYnV0ZXM/Lmxhc3RTTUFQSVF1ZXJ5ID8/IDApIDwgU01BUElfUVVFUllfRlJFUVVFTkNZKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBsZXQgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBtb2QuYXR0cmlidXRlcz8uYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXM7XHJcbiAgaWYgKCFhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcykge1xyXG4gICAgaWYgKG1vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWUpIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbbW9kLmF0dHJpYnV0ZXM/LmxvZ2ljYWxGaWxlTmFtZV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcXVlcnkgPSBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lc1xyXG4gICAgLm1hcChuYW1lID0+IHtcclxuICAgICAgY29uc3QgcmVzID0ge1xyXG4gICAgICAgIGlkOiBuYW1lLFxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCB2ZXIgPSBtb2QuYXR0cmlidXRlcz8ubWFuaWZlc3RWZXJzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgID8/IHNlbXZlci5jb2VyY2UobW9kLmF0dHJpYnV0ZXM/LnZlcnNpb24pPy52ZXJzaW9uO1xyXG4gICAgICBpZiAoISF2ZXIpIHtcclxuICAgICAgICByZXNbJ2luc3RhbGxlZFZlcnNpb24nXSA9IHZlcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBzdGF0ID0gKGl0ZW06IElTTUFQSVJlc3VsdCk6IENvbXBhdGliaWxpdHlTdGF0dXMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdHVzID0gaXRlbS5tZXRhZGF0YT8uY29tcGF0aWJpbGl0eVN0YXR1cz8udG9Mb3dlckNhc2U/LigpO1xyXG4gICAgaWYgKCFjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmNsdWRlcyhzdGF0dXMgYXMgYW55KSkge1xyXG4gICAgICByZXR1cm4gJ3Vua25vd24nO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHN0YXR1cyBhcyBDb21wYXRpYmlsaXR5U3RhdHVzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNvbXBhdGliaWxpdHlQcmlvID0gKGl0ZW06IElTTUFQSVJlc3VsdCkgPT4gY29tcGF0aWJpbGl0eU9wdGlvbnMuaW5kZXhPZihzdGF0KGl0ZW0pKTtcclxuXHJcbiAgcmV0dXJuIHNtYXBpLmZpbmRCeU5hbWVzKHF1ZXJ5KVxyXG4gICAgLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICAgIGNvbnN0IHdvcnN0U3RhdHVzOiBJU01BUElSZXN1bHRbXSA9IHJlc3VsdHNcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGNvbXBhdGliaWxpdHlQcmlvKGxocykgLSBjb21wYXRpYmlsaXR5UHJpbyhyaHMpKTtcclxuICAgICAgaWYgKHdvcnN0U3RhdHVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGVzKGdhbWVJZCwgbW9kSWQsIHtcclxuICAgICAgICAgIGxhc3RTTUFQSVF1ZXJ5OiBub3csXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5U3RhdHVzOiB3b3JzdFN0YXR1c1swXS5tZXRhZGF0YS5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eU1lc3NhZ2U6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdW1tYXJ5LFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVVwZGF0ZTogd29yc3RTdGF0dXNbMF0uc3VnZ2VzdGVkVXBkYXRlPy52ZXJzaW9uLFxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb2coJ2RlYnVnJywgJ25vIG1hbmlmZXN0Jyk7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnd2FybicsICdlcnJvciByZWFkaW5nIG1hbmlmZXN0JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGxldCBkZXBlbmRlbmN5TWFuYWdlcjogRGVwZW5kZW5jeU1hbmFnZXI7XHJcbiAgY29uc3QgZ2V0RGlzY292ZXJ5UGF0aCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxyXG4gICAgICBsb2coJ2Vycm9yJywgJ3N0YXJkZXd2YWxsZXkgd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZ2V0U01BUElQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWFuaWZlc3RFeHRyYWN0b3IgPSB0b0JsdWUoXHJcbiAgICBhc3luYyAobW9kSW5mbzogYW55LCBtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueTsgfT4gPT4ge1xyXG4gICAgICBpZiAoc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aCk7XHJcblxyXG4gICAgICBjb25zdCBwYXJzZWRNYW5pZmVzdHMgPSAoYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RzLm1hcChcclxuICAgICAgICBhc3luYyBtYW5pZmVzdCA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcGFyc2VNYW5pZmVzdChtYW5pZmVzdCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgbWFuaWZlc3RGaWxlOiBtYW5pZmVzdCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pKSkuZmlsdGVyKG1hbmlmZXN0ID0+IG1hbmlmZXN0ICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICAgICAgaWYgKHBhcnNlZE1hbmlmZXN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gd2UgY2FuIG9ubHkgdXNlIG9uZSBtYW5pZmVzdCB0byBnZXQgdGhlIGlkIGZyb21cclxuICAgICAgY29uc3QgcmVmTWFuaWZlc3QgPSBwYXJzZWRNYW5pZmVzdHNbMF07XHJcblxyXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5maWx0ZXIobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlELnRvTG93ZXJDYXNlKCkpO1xyXG5cclxuICAgICAgY29uc3QgbWluU01BUElWZXJzaW9uID0gcGFyc2VkTWFuaWZlc3RzXHJcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5NaW5pbXVtQXBpVmVyc2lvbilcclxuICAgICAgICAuZmlsdGVyKHZlcnNpb24gPT4gc2VtdmVyLnZhbGlkKHZlcnNpb24pKVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLCBsaHMpKVswXTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyxcclxuICAgICAgICBtaW5TTUFQSVZlcnNpb24sXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAocmVmTWFuaWZlc3QgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIGRvbid0IHNldCBhIGN1c3RvbSBmaWxlIG5hbWUgZm9yIFNNQVBJXHJcbiAgICAgICAgaWYgKG1vZEluZm8uZG93bmxvYWQubW9kSW5mbz8ubmV4dXM/Lmlkcz8ubW9kSWQgIT09IDI0MDApIHtcclxuICAgICAgICAgIHJlc3VsdFsnY3VzdG9tRmlsZU5hbWUnXSA9IHJlZk1hbmlmZXN0Lk5hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIChyZWZNYW5pZmVzdC5WZXJzaW9uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIHJlc3VsdFsnbWFuaWZlc3RWZXJzaW9uJ10gPSByZWZNYW5pZmVzdC5WZXJzaW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBTdGFyZGV3VmFsbGV5KGNvbnRleHQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ1NEViddLCBzZHZSZWR1Y2Vycyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzLCB1bmRlZmluZWQsICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsIDE1MCk7XHJcblxyXG4gIC8vIFJlZ2lzdGVyIG91ciBTTUFQSSBtb2QgdHlwZSBhbmQgaW5zdGFsbGVyLiBOb3RlOiBUaGlzIGN1cnJlbnRseSBmbGFncyBhbiBlcnJvciBpbiBWb3J0ZXggb24gaW5zdGFsbGluZyBjb3JyZWN0bHkuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc21hcGktaW5zdGFsbGVyJywgMzAsIHRlc3RTTUFQSSwgKGZpbGVzLCBkZXN0KSA9PiBCbHVlYmlyZC5yZXNvbHZlKGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzZHZyb290Zm9sZGVyJywgNTAsIHRlc3RSb290Rm9sZGVyLCBpbnN0YWxsUm9vdEZvbGRlcik7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRlc3RTdXBwb3J0ZWQsXHJcbiAgICAoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlciwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ1NNQVBJJywgMzAsIGdhbWVJZCA9PiBnYW1lSWQgPT09IEdBTUVfSUQsIGdldFNNQVBJUGF0aCwgaXNTTUFQSU1vZFR5cGUpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0NPTkZJRywgMzAsIChnYW1lSWQpID0+IChnYW1lSWQgPT09IEdBTUVfSUQpLFxyXG4gICAgKCkgPT4gcGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgZGVmYXVsdE1vZHNSZWxQYXRoKCkpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3NkdnJvb3Rmb2xkZXInLCAyNSwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXHJcbiAgICAoKSA9PiBnZXREaXNjb3ZlcnlQYXRoKCksIChpbnN0cnVjdGlvbnMpID0+IHtcclxuICAgICAgLy8gT25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zLlxyXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xyXG4gICAgICAvLyBUaGlzIGlzIGEgdHJpY2t5IHBhdHRlcm4gc28gd2UncmUgZ29pbmcgdG8gMXN0IHByZXNlbnQgdGhlIGRpZmZlcmVudCBwYWNrYWdpbmdcclxuICAgICAgLy8gIHBhdHRlcm5zIHdlIG5lZWQgdG8gY2F0ZXIgZm9yOlxyXG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXHJcbiAgICAgIC8vICAgIG1hbmlmZXN0IGZpbGVzIGFyZSBpbmNsdWRlZC5cclxuICAgICAgLy8gIDIuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlciArIG9uZSBvciBtb3JlIFNNQVBJIG1vZHMgaW5jbHVkZWRcclxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXHJcbiAgICAgIC8vICAzLiBBIHJlZ3VsYXIgU01BUEkgbW9kIHdpdGggYSBcIkNvbnRlbnRcIiBmb2xkZXIgaW5zaWRlIHRoZSBtb2QncyByb290IGRpci5cclxuICAgICAgLy9cclxuICAgICAgLy8gcGF0dGVybiAxOlxyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgZG9uJ3QgaGF2ZSBtYW5pZmVzdCBmaWxlc1xyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgaGF2ZSBhIFwiQ29udGVudFwiIGZvbGRlclxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUbyBzb2x2ZSBwYXR0ZXJucyAyIGFuZCAzIHdlJ3JlIGdvaW5nIHRvOlxyXG4gICAgICAvLyAgQ2hlY2sgd2hldGhlciB3ZSBoYXZlIGFueSBtYW5pZmVzdCBmaWxlcywgaWYgd2UgZG8sIHdlIGV4cGVjdCB0aGUgZm9sbG93aW5nXHJcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XHJcbiAgICAgIC8vICAgIGFyY2hpdmUuemlwID0+XHJcbiAgICAgIC8vICAgICAgLi4vQ29udGVudC9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL1xyXG4gICAgICAvLyAgICAgIC4uL01vZHMvQV9TTUFQSV9NT0RcXG1hbmlmZXN0Lmpzb25cclxuICAgICAgY29uc3QgaGFzTWFuaWZlc3QgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcclxuICAgICAgY29uc3QgaGFzTW9kc0ZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoZGVmYXVsdE1vZHNSZWxQYXRoKCkgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnN0IGhhc0NvbnRlbnRGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5zdGFydHNXaXRoKCdDb250ZW50JyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZFxyXG5cclxuICAgICAgcmV0dXJuIChoYXNNYW5pZmVzdClcclxuICAgICAgICA/IEJsdWViaXJkLnJlc29sdmUoaGFzQ29udGVudEZvbGRlciAmJiBoYXNNb2RzRm9sZGVyKVxyXG4gICAgICAgIDogQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyKTtcclxuICAgIH0pO1xyXG5cclxuICByZWdpc3RlckNvbmZpZ01vZChjb250ZXh0KVxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDk5OSwgJ2NoYW5nZWxvZycsIHt9LCAnU01BUEkgTG9nJyxcclxuICAgICgpID0+IHsgb25TaG93U01BUElMb2coY29udGV4dC5hcGkpOyB9LFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICAvL09ubHkgc2hvdyB0aGUgU01BUEkgbG9nIGJ1dHRvbiBmb3IgU0RWLiBcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcclxuICAgIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQXR0cmlidXRlRXh0cmFjdG9yKDI1LCBtYW5pZmVzdEV4dHJhY3Rvcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJUYWJsZUF0dHJpYnV0ZSgnbW9kcycsIHtcclxuICAgIGlkOiAnc2R2LWNvbXBhdGliaWxpdHknLFxyXG4gICAgcG9zaXRpb246IDEwMCxcclxuICAgIGNvbmRpdGlvbjogKCkgPT4gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSA9PT0gR0FNRV9JRCxcclxuICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcclxuICAgIGNhbGM6IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgY3VzdG9tUmVuZGVyZXI6IChtb2Q6IHR5cGVzLklNb2QsIGRldGFpbENlbGw6IGJvb2xlYW4sIHQ6IHR5cGVzLlRGdW5jdGlvbikgPT4ge1xyXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb21wYXRpYmlsaXR5SWNvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0LCBtb2QsIGRldGFpbENlbGwgfSwgW10pO1xyXG4gICAgfSxcclxuICAgIG5hbWU6ICdDb21wYXRpYmlsaXR5JyxcclxuICAgIGlzRGVmYXVsdFZpc2libGU6IHRydWUsXHJcbiAgICBlZGl0OiB7fSxcclxuICB9KTtcclxuXHJcbiAgLypcclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LW1pc3NpbmctZGVwZW5kZW5jaWVzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiB0ZXN0TWlzc2luZ0RlcGVuZGVuY2llcyhjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKTtcclxuICAqL1xyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtaW5jb21wYXRpYmxlLW1vZHMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdFNNQVBJT3V0ZGF0ZWQoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSkpO1xyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29uc3QgcHJveHkgPSBuZXcgU01BUElQcm94eShjb250ZXh0LmFwaSk7XHJcbiAgICBjb250ZXh0LmFwaS5zZXRTdHlsZXNoZWV0KCdzZHYnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnc2R2c3R5bGUuc2NzcycpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5hZGRNZXRhU2VydmVyKCdzbWFwaS5pbycsIHtcclxuICAgICAgdXJsOiAnJyxcclxuICAgICAgbG9vcGJhY2tDQjogKHF1ZXJ5OiBJUXVlcnkpID0+IHtcclxuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShwcm94eS5maW5kKHF1ZXJ5KSlcclxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBsb29rIHVwIHNtYXBpIG1ldGEgaW5mbycsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoW10pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGNhY2hlRHVyYXRpb25TZWM6IDg2NDAwLFxyXG4gICAgICBwcmlvcml0eTogMjUsXHJcbiAgICB9KTtcclxuICAgIGRlcGVuZGVuY3lNYW5hZ2VyID0gbmV3IERlcGVuZGVuY3lNYW5hZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgKHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogYW55W10pID0+IG9uQWRkZWRGaWxlcyhjb250ZXh0LmFwaSwgcHJvZmlsZUlkLCBmaWxlcykgYXMgYW55KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCd3aWxsLWVuYWJsZS1tb2RzJywgKHByb2ZpbGVJZDogc3RyaW5nLCBtb2RJZHM6IHN0cmluZ1tdLCBlbmFibGVkOiBib29sZWFuKSA9PiBvbldpbGxFbmFibGVNb2RzKGNvbnRleHQuYXBpLCBwcm9maWxlSWQsIG1vZElkcywgZW5hYmxlZCkgYXMgYW55KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcclxuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnaW50ZXJmYWNlJywgJ3ByaW1hcnlUb29sJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCAnc21hcGknKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pXHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcclxuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnaW50ZXJmYWNlJywgJ3ByaW1hcnlUb29sJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gJ3NtYXBpJykge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdW5kZWZpbmVkKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgKGdhbWVJZDogc3RyaW5nLCBhcmNoaXZlSWQ6IHN0cmluZywgbW9kSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHVwZGF0ZUNvbmZsaWN0SW5mbyhjb250ZXh0LmFwaSwgcHJveHksIGdhbWVJZCwgbW9kSWQpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gbG9nKCdkZWJ1ZycsICdhZGRlZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkIH0pKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gYWRkIGNvbXBhdGliaWxpdHkgaW5mbycsIHsgbW9kSWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCAoZ2FtZU1vZGU6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgbG9nKCdkZWJ1ZycsICd1cGRhdGluZyBTRFYgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKHN0YXRlLnBlcnNpc3RlbnQubW9kc1tnYW1lTW9kZV0gPz8ge30pLm1hcChtb2RJZCA9PlxyXG4gICAgICAgIHVwZGF0ZUNvbmZsaWN0SW5mbyhjb250ZXh0LmFwaSwgcHJveHksIGdhbWVNb2RlLCBtb2RJZCkpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGxvZygnZGVidWcnLCAnZG9uZSB1cGRhdGluZyBjb21wYXRpYmlsaXR5IGluZm8nKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gdXBkYXRlIGNvbmZsaWN0IGluZm8nLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW5pdDtcclxuIl19