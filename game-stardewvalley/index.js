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
            if (smapiFound)
                return;
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
        yield dependencyManager.scanManifests(true);
        const mods = yield Promise.all(manifestFiles.map((manifestFile) => __awaiter(this, void 0, void 0, function* () {
            const rootFolder = path.dirname(manifestFile);
            const manifestIndex = manifestFile.toLowerCase().indexOf(MANIFEST_FILE);
            const filterFunc = (file) => (rootFolder !== '.')
                ? ((file.indexOf(rootFolder) !== -1)
                    && (path.dirname(file) !== '.')
                    && !file.endsWith(path.sep))
                : !file.endsWith(path.sep);
            const manifest = yield (0, util_1.parseManifest)(path.join(destinationPath, manifestFile));
            const modFiles = files.filter(filterFunc);
            return {
                manifest,
                rootFolder,
                manifestIndex,
                modFiles,
            };
        })));
        return bluebird_1.default.map(mods, mod => {
            const modName = (mod.rootFolder !== '.')
                ? mod.rootFolder
                : mod.manifest.Name;
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
                var _a;
                const versionMatch = dep.MinimumVersion !== undefined
                    ? `>=${dep.MinimumVersion}`
                    : '*';
                const rule = {
                    type: ((_a = dep.IsRequired) !== null && _a !== void 0 ? _a : true) ? 'requires' : 'recommends',
                    reference: {
                        logicalFileName: dep.UniqueID.toLowerCase(),
                        versionMatch,
                    },
                    extra: {
                        onlyIfFulfillable: true,
                    },
                };
                instructions.push({
                    type: 'rule',
                    rule,
                });
            };
            for (const dep of dependencies) {
                addRuleForDependency(dep);
            }
            if (mod.manifest.ContentPackFor !== undefined) {
                addRuleForDependency(mod.manifest.ContentPackFor);
            }
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
        if (vortex_api_1.selectors.activeGameId(context.api.getState()) !== GAME_ID) {
            return Promise.resolve({});
        }
        const manifests = yield getModManifests(modPath);
        if (manifests.length === 0) {
            return Promise.resolve({});
        }
        const parsedManifests = yield Promise.all(manifests.map((man) => __awaiter(this, void 0, void 0, function* () { return yield (0, util_1.parseManifest)(man); })));
        const refManifest = parsedManifests[0];
        const additionalLogicalFileNames = parsedManifests
            .map(manifest => manifest.UniqueID.toLowerCase());
        const minSMAPIVersion = parsedManifests
            .map(manifest => manifest.MinimumApiVersion)
            .filter(version => semver.valid(version))
            .sort((lhs, rhs) => semver.compare(rhs, lhs))[0];
        const result = {
            additionalLogicalFileNames,
            minSMAPIVersion,
        };
        if (modInfo.download.modInfo.nexus.ids.modId !== 2400) {
            result['customFileName'] = refManifest.Name;
        }
        if (typeof (refManifest.Version) === 'string') {
            result['manifestVersion'] = refManifest.Version;
        }
        return Promise.resolve(result);
    }));
    context.registerGame(new StardewValley(context));
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
            loopbackCB: (query) => bluebird_1.default.resolve(proxy.find(query)),
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
            if (profile.gameId !== GAME_ID) {
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
            if (profile.gameId !== GAME_ID) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFFaEMsa0RBQTBCO0FBQzFCLCtDQUFpQztBQUNqQywwREFBa0M7QUFDbEMsMkNBQXNFO0FBQ3RFLHdEQUEwQztBQUMxQyw0RUFBb0Q7QUFDcEQsMkNBQW9EO0FBRXBELDRFQUFvRDtBQUNwRCw4REFBc0M7QUFDdEMsbUNBQTRDO0FBQzVDLG1DQUFtSDtBQUNuSCxpQ0FBdUM7QUFFdkMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUMxQixFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDbkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFDL0IsRUFBRSxRQUFRLEVBQUUsR0FBRyxpQkFBSSxFQUNuQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUNqRSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVwQyxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNyRCxNQUFNLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQztBQUMxQyxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyxDQUFDLHFCQUFxQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRTFELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDOUUsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO0lBQzFCLE9BQU8sS0FBSyxD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RSxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHV0aWwsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5pbXBvcnQgQ29tcGF0aWJpbGl0eUljb24gZnJvbSAnLi9Db21wYXRpYmlsaXR5SWNvbic7XHJcbmltcG9ydCB7IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcclxuaW1wb3J0IFNNQVBJUHJveHkgZnJvbSAnLi9zbWFwaVByb3h5JztcclxuaW1wb3J0IHsgdGVzdFNNQVBJT3V0ZGF0ZWQgfSBmcm9tICcuL3Rlc3RzJztcclxuaW1wb3J0IHsgY29tcGF0aWJpbGl0eU9wdGlvbnMsIENvbXBhdGliaWxpdHlTdGF0dXMsIElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QsIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBwYXJzZU1hbmlmZXN0IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyksXHJcbiAgeyBjbGlwYm9hcmQgfSA9IHJlcXVpcmUoJ2VsZWN0cm9uJyksXHJcbiAgcmpzb24gPSByZXF1aXJlKCdyZWxheGVkLWpzb24nKSxcclxuICB7IFNldmVuWmlwIH0gPSB1dGlsLFxyXG4gIHsgZGVwbG95U01BUEksIGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9ID0gcmVxdWlyZSgnLi9TTUFQSScpLFxyXG4gIHsgR0FNRV9JRCB9ID0gcmVxdWlyZSgnLi9jb21tb24nKTtcclxuXHJcbmNvbnN0IE1BTklGRVNUX0ZJTEUgPSAnbWFuaWZlc3QuanNvbic7XHJcbmNvbnN0IFBUUk5fQ09OVEVOVCA9IHBhdGguc2VwICsgJ0NvbnRlbnQnICsgcGF0aC5zZXA7XHJcbmNvbnN0IFNNQVBJX0VYRSA9ICdTdGFyZGV3TW9kZGluZ0FQSS5leGUnO1xyXG5jb25zdCBTTUFQSV9ETEwgPSAnU01BUEkuSW5zdGFsbGVyLmRsbCc7XHJcbmNvbnN0IFNNQVBJX0RBVEEgPSBbJ3dpbmRvd3MtaW5zdGFsbC5kYXQnLCAnaW5zdGFsbC5kYXQnXTtcclxuXHJcbmNvbnN0IF9TTUFQSV9CVU5ETEVEX01PRFMgPSBbJ0Vycm9ySGFuZGxlcicsICdDb25zb2xlQ29tbWFuZHMnLCAnU2F2ZUJhY2t1cCddO1xyXG5jb25zdCBnZXRCdW5kbGVkTW9kcyA9ICgpID0+IHtcclxuICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KF9TTUFQSV9CVU5ETEVEX01PRFMubWFwKG1vZE5hbWUgPT4gbW9kTmFtZS50b0xvd2VyQ2FzZSgpKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuY2xhc3MgU3RhcmRld1ZhbGxleSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcclxuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XHJcbiAgcHVibGljIGlkOiBzdHJpbmcgPSBHQU1FX0lEO1xyXG4gIHB1YmxpYyBuYW1lOiBzdHJpbmcgPSAnU3RhcmRldyBWYWxsZXknO1xyXG4gIHB1YmxpYyBsb2dvOiBzdHJpbmcgPSAnZ2FtZWFydC5qcGcnO1xyXG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgZW52aXJvbm1lbnQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XHJcbiAgICBTdGVhbUFQUElkOiAnNDEzMTUwJyxcclxuICB9O1xyXG4gIHB1YmxpYyBkZXRhaWxzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xyXG4gICAgc3RlYW1BcHBJZDogNDEzMTUwXHJcbiAgfTtcclxuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogJ3NtYXBpJyxcclxuICAgICAgbmFtZTogJ1NNQVBJJyxcclxuICAgICAgbG9nbzogJ3NtYXBpLnBuZycsXHJcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+IFNNQVBJX0VYRSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW1NNQVBJX0VYRV0sXHJcbiAgICAgIHNoZWxsOiB0cnVlLFxyXG4gICAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICBkZWZhdWx0UHJpbWFyeTogdHJ1ZSxcclxuICAgIH1cclxuICBdO1xyXG4gIHB1YmxpYyBtZXJnZU1vZHM6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyByZXF1aXJlc0NsZWFudXA6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyBzaGVsbDogYm9vbGVhbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XHJcbiAgcHVibGljIGRlZmF1bHRQYXRoczogc3RyaW5nW107XHJcblxyXG4gIC8qKioqKioqKipcclxuICAqKiBWb3J0ZXggQVBJXHJcbiAgKioqKioqKioqL1xyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdCBhbiBpbnN0YW5jZS5cclxuICAgKiBAcGFyYW0ge0lFeHRlbnNpb25Db250ZXh0fSBjb250ZXh0IC0tIFRoZSBWb3J0ZXggZXh0ZW5zaW9uIGNvbnRleHQuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICAgIC8vIHByb3BlcnRpZXMgdXNlZCBieSBWb3J0ZXhcclxuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICB0aGlzLnJlcXVpcmVkRmlsZXMgPSBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyBbJ1N0YXJkZXcgVmFsbGV5LmV4ZSddXHJcbiAgICAgIDogWydTdGFyZGV3VmFsbGV5JywgJ1N0YXJkZXdWYWxsZXkuZXhlJ107XHJcblxyXG4gICAgLy8gY3VzdG9tIHByb3BlcnRpZXNcclxuICAgIHRoaXMuZGVmYXVsdFBhdGhzID0gW1xyXG4gICAgICAvLyBMaW51eFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9HT0cgR2FtZXMvU3RhcmRldyBWYWxsZXkvZ2FtZScsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnLy5sb2NhbC9zaGFyZS9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5JyxcclxuXHJcbiAgICAgIC8vIE1hY1xyXG4gICAgICAnL0FwcGxpY2F0aW9ucy9TdGFyZGV3IFZhbGxleS5hcHAvQ29udGVudHMvTWFjT1MnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnQvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleS9Db250ZW50cy9NYWNPUycsXHJcblxyXG4gICAgICAvLyBXaW5kb3dzXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdhbGF4eUNsaWVudFxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdPRyBHYWxheHlcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxTdGVhbVxcXFxzdGVhbWFwcHNcXFxcY29tbW9uXFxcXFN0YXJkZXcgVmFsbGV5J1xyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGZpbmQgdGhlIGdhbWUgaW5zdGFsbCBwYXRoLlxyXG4gICAqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHF1aWNrbHkgYW5kLCBpZiBpdCByZXR1cm5zIGEgdmFsdWUsIGl0IHNob3VsZCBkZWZpbml0aXZlbHkgYmUgdGhlXHJcbiAgICogdmFsaWQgZ2FtZSBwYXRoLiBVc3VhbGx5IHRoaXMgZnVuY3Rpb24gd2lsbCBxdWVyeSB0aGUgcGF0aCBmcm9tIHRoZSByZWdpc3RyeSBvciBmcm9tIHN0ZWFtLlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gbWF5IHJldHVybiBhIHByb21pc2UgYW5kIGl0IHNob3VsZCBkbyB0aGF0IGlmIGl0J3MgZG9pbmcgSS9PLlxyXG4gICAqXHJcbiAgICogVGhpcyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgYnV0IHRoZW4gdGhlIHRvb2wvZ2FtZSBjYW4gb25seSBiZSBkaXNjb3ZlcmVkIGJ5IHNlYXJjaGluZyB0aGUgZGlza1xyXG4gICAqIHdoaWNoIGlzIHNsb3cgYW5kIG9ubHkgaGFwcGVucyBtYW51YWxseS5cclxuICAgKi9cclxuICBwdWJsaWMgcXVlcnlQYXRoID0gdG9CbHVlKGFzeW5jICgpID0+IHtcclxuICAgIC8vIGNoZWNrIFN0ZWFtXHJcbiAgICBjb25zdCBnYW1lID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoWyc0MTMxNTAnLCAnMTQ1MzM3NTI1MyddKTtcclxuICAgIGlmIChnYW1lKVxyXG4gICAgICByZXR1cm4gZ2FtZS5nYW1lUGF0aDtcclxuXHJcbiAgICAvLyBjaGVjayBkZWZhdWx0IHBhdGhzXHJcbiAgICBmb3IgKGNvbnN0IGRlZmF1bHRQYXRoIG9mIHRoaXMuZGVmYXVsdFBhdGhzKVxyXG4gICAge1xyXG4gICAgICBpZiAoYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoZGVmYXVsdFBhdGgpKVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0UGF0aDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwYXRoIG9mIHRoZSB0b29sIGV4ZWN1dGFibGUgcmVsYXRpdmUgdG8gdGhlIHRvb2wgYmFzZSBwYXRoLCBpLmUuIGJpbmFyaWVzL1VUMy5leGUgb3JcclxuICAgKiBURVNWLmV4ZS4gVGhpcyBpcyBhIGZ1bmN0aW9uIHNvIHRoYXQgeW91IGNhbiByZXR1cm4gZGlmZmVyZW50IHRoaW5ncyBiYXNlZCBvbiB0aGUgb3BlcmF0aW5nXHJcbiAgICogc3lzdGVtIGZvciBleGFtcGxlIGJ1dCBiZSBhd2FyZSB0aGF0IGl0IHdpbGwgYmUgZXZhbHVhdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0IGFuZCBvbmx5IG9uY2UsXHJcbiAgICogc28gdGhlIHJldHVybiB2YWx1ZSBjYW4gbm90IGRlcGVuZCBvbiB0aGluZ3MgdGhhdCBjaGFuZ2UgYXQgcnVudGltZS5cclxuICAgKi9cclxuICBwdWJsaWMgZXhlY3V0YWJsZSgpIHtcclxuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyAnU3RhcmRldyBWYWxsZXkuZXhlJ1xyXG4gICAgICA6ICdTdGFyZGV3VmFsbGV5JztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgZGVmYXVsdCBkaXJlY3Rvcnkgd2hlcmUgbW9kcyBmb3IgdGhpcyBnYW1lIHNob3VsZCBiZSBzdG9yZWQuXHJcbiAgICogXHJcbiAgICogSWYgdGhpcyByZXR1cm5zIGEgcmVsYXRpdmUgcGF0aCB0aGVuIHRoZSBwYXRoIGlzIHRyZWF0ZWQgYXMgcmVsYXRpdmUgdG8gdGhlIGdhbWUgaW5zdGFsbGF0aW9uXHJcbiAgICogZGlyZWN0b3J5LiBTaW1wbHkgcmV0dXJuIGEgZG90ICggKCkgPT4gJy4nICkgaWYgbW9kcyBhcmUgaW5zdGFsbGVkIGRpcmVjdGx5IGludG8gdGhlIGdhbWVcclxuICAgKiBkaXJlY3RvcnkuXHJcbiAgICovIFxyXG4gIHB1YmxpYyBxdWVyeU1vZFBhdGgoKVxyXG4gIHtcclxuICAgIHJldHVybiAnTW9kcyc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcHRpb25hbCBzZXR1cCBmdW5jdGlvbi4gSWYgdGhpcyBnYW1lIHJlcXVpcmVzIHNvbWUgZm9ybSBvZiBzZXR1cCBiZWZvcmUgaXQgY2FuIGJlIG1vZGRlZCAobGlrZVxyXG4gICAqIGNyZWF0aW5nIGEgZGlyZWN0b3J5LCBjaGFuZ2luZyBhIHJlZ2lzdHJ5IGtleSwgLi4uKSBkbyBpdCBoZXJlLiBJdCB3aWxsIGJlIGNhbGxlZCBldmVyeSB0aW1lXHJcbiAgICogYmVmb3JlIHRoZSBnYW1lIG1vZGUgaXMgYWN0aXZhdGVkLlxyXG4gICAqIEBwYXJhbSB7SURpc2NvdmVyeVJlc3VsdH0gZGlzY292ZXJ5IC0tIGJhc2ljIGluZm8gYWJvdXQgdGhlIGdhbWUgYmVpbmcgbG9hZGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXR1cCA9IHRvQmx1ZShhc3luYyAoZGlzY292ZXJ5KSA9PiB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGZvbGRlciBmb3IgU01BUEkgbW9kcyBleGlzdHMuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBza2lwIGlmIFNNQVBJIGZvdW5kXHJcbiAgICBjb25zdCBzbWFwaVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIFNNQVBJX0VYRSk7XHJcbiAgICBjb25zdCBzbWFwaUZvdW5kID0gYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoc21hcGlQYXRoKTtcclxuICAgIGlmIChzbWFwaUZvdW5kKVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QodGhpcy5jb250ZXh0LmFwaSk7XHJcbiAgICBjb25zdCB0aXRsZSA9IHNtYXBpTW9kID8gJ1NNQVBJIGlzIG5vdCBkZXBsb3llZCcgOiAnU01BUEkgaXMgbm90IGluc3RhbGxlZCc7XHJcbiAgICBjb25zdCBhY3Rpb25UaXRsZSA9IHNtYXBpTW9kID8gJ0RlcGxveScgOiAnR2V0IFNNQVBJJztcclxuICAgIGNvbnN0IGFjdGlvbiA9ICgpID0+IChzbWFwaU1vZFxyXG4gICAgICA/IGRlcGxveVNNQVBJKHRoaXMuY29udGV4dC5hcGkpXHJcbiAgICAgIDogZG93bmxvYWRTTUFQSSh0aGlzLmNvbnRleHQuYXBpKSlcclxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5jb250ZXh0LmFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdzbWFwaS1taXNzaW5nJykpO1xyXG5cclxuICAgIHRoaXMuY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnc21hcGktbWlzc2luZycsXHJcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgdGl0bGUsXHJcbiAgICAgIG1lc3NhZ2U6ICdTTUFQSSBpcyByZXF1aXJlZCB0byBtb2QgU3RhcmRldyBWYWxsZXkuJyxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiBhY3Rpb25UaXRsZSxcclxuICAgICAgICAgIGFjdGlvbixcclxuICAgICAgICB9LFxyXG4gICAgICBdXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcblxyXG4gIC8qKioqKioqKipcclxuICAqKiBJbnRlcm5hbCBtZXRob2RzXHJcbiAgKioqKioqKioqL1xyXG5cclxuICAvKipcclxuICAgKiBBc3luY2hyb25vdXNseSBjaGVjayB3aGV0aGVyIGEgZmlsZSBvciBkaXJlY3RvcnkgcGF0aCBleGlzdHMuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBUaGUgZmlsZSBvciBkaXJlY3RvcnkgcGF0aC5cclxuICAgKi9cclxuICBhc3luYyBnZXRQYXRoRXhpc3RzQXN5bmMocGF0aClcclxuICB7XHJcbiAgICB0cnkge1xyXG4gICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoKTtcclxuICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGNhdGNoKGVycikge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBc3luY2hyb25vdXNseSByZWFkIGEgcmVnaXN0cnkga2V5IHZhbHVlLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoaXZlIC0gVGhlIHJlZ2lzdHJ5IGhpdmUgdG8gYWNjZXNzLiBUaGlzIHNob3VsZCBiZSBhIGNvbnN0YW50IGxpa2UgUmVnaXN0cnkuSEtMTS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gVGhlIHJlZ2lzdHJ5IGtleS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0byByZWFkLlxyXG4gICAqL1xyXG4gIGFzeW5jIHJlYWRSZWdpc3RyeUtleUFzeW5jKGhpdmUsIGtleSwgbmFtZSlcclxuICB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShoaXZlLCBrZXksIG5hbWUpO1xyXG4gICAgICBpZiAoIWluc3RQYXRoKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RQYXRoLnZhbHVlKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Um9vdEZvbGRlcihmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gV2UgYXNzdW1lIHRoYXQgYW55IG1vZCBjb250YWluaW5nIFwiL0NvbnRlbnQvXCIgaW4gaXRzIGRpcmVjdG9yeVxyXG4gIC8vICBzdHJ1Y3R1cmUgaXMgbWVhbnQgdG8gYmUgZGVwbG95ZWQgdG8gdGhlIHJvb3QgZm9sZGVyLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkpXHJcbiAgICAubWFwKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkpO1xyXG4gIGNvbnN0IGNvbnRlbnREaXIgPSBmaWx0ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIChjb250ZW50RGlyICE9PSB1bmRlZmluZWQpKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUm9vdEZvbGRlcihmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gV2UncmUgZ29pbmcgdG8gZGVwbG95IFwiL0NvbnRlbnQvXCIgYW5kIHdoYXRldmVyIGZvbGRlcnMgY29tZSBhbG9uZ3NpZGUgaXQuXHJcbiAgLy8gIGkuZS4gU29tZU1vZC43elxyXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL0NvbnRlbnQvXHJcbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvTW9kcy9cclxuICAvLyAgV2lsbCBOT1QgYmUgZGVwbG95ZWQgPT4gLi4vUmVhZG1lLmRvY1xyXG4gIGNvbnN0IGNvbnRlbnRGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gIGNvbnN0IGlkeCA9IGNvbnRlbnRGaWxlLmluZGV4T2YoUFRSTl9DT05URU5UKSArIDE7XHJcbiAgY29uc3Qgcm9vdERpciA9IHBhdGguYmFzZW5hbWUoY29udGVudEZpbGUuc3Vic3RyaW5nKDAsIGlkeCkpO1xyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApXHJcbiAgICAmJiAoZmlsZS5pbmRleE9mKHJvb3REaXIpICE9PSAtMSlcclxuICAgICYmIChwYXRoLmV4dG5hbWUoZmlsZSkgIT09ICcudHh0JykpO1xyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLm1hcChmaWxlID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbjogZmlsZS5zdWJzdHIoaWR4KSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1ZhbGlkTWFuaWZlc3QoZmlsZVBhdGgpIHtcclxuICBjb25zdCBzZWdtZW50cyA9IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gIGNvbnN0IGlzTWFuaWZlc3RGaWxlID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0gPT09IE1BTklGRVNUX0ZJTEU7XHJcbiAgY29uc3QgaXNMb2NhbGUgPSBzZWdtZW50cy5pbmNsdWRlcygnbG9jYWxlJyk7XHJcbiAgcmV0dXJuIGlzTWFuaWZlc3RGaWxlICYmICFpc0xvY2FsZTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIChmaWxlcy5maW5kKGlzVmFsaWRNYW5pZmVzdCkgIT09IHVuZGVmaW5lZClcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4ge1xyXG4gICAgICAvLyBXZSBjcmVhdGUgYSBwcmVmaXggZmFrZSBkaXJlY3RvcnkganVzdCBpbiBjYXNlIHRoZSBjb250ZW50XHJcbiAgICAgIC8vICBmb2xkZXIgaXMgaW4gdGhlIGFyY2hpdmUncyByb290IGZvbGRlci4gVGhpcyBpcyB0byBlbnN1cmUgd2VcclxuICAgICAgLy8gIGZpbmQgYSBtYXRjaCBmb3IgXCIvQ29udGVudC9cIlxyXG4gICAgICBjb25zdCB0ZXN0RmlsZSA9IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpO1xyXG4gICAgICByZXR1cm4gKHRlc3RGaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gICAgfSkgPT09IHVuZGVmaW5lZCk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsKGFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmN5TWFuYWdlcixcclxuICAgICAgICAgICAgICAgICAgICAgICBmaWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBUaGUgYXJjaGl2ZSBtYXkgY29udGFpbiBtdWx0aXBsZSBtYW5pZmVzdCBmaWxlcyB3aGljaCB3b3VsZFxyXG4gIC8vICBpbXBseSB0aGF0IHdlJ3JlIGluc3RhbGxpbmcgbXVsdGlwbGUgbW9kcy5cclxuICBjb25zdCBtYW5pZmVzdEZpbGVzID0gZmlsZXMuZmlsdGVyKGlzVmFsaWRNYW5pZmVzdCk7XHJcblxyXG4gIGludGVyZmFjZSBJTW9kSW5mbyB7XHJcbiAgICBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0O1xyXG4gICAgcm9vdEZvbGRlcjogc3RyaW5nO1xyXG4gICAgbWFuaWZlc3RJbmRleDogbnVtYmVyO1xyXG4gICAgbW9kRmlsZXM6IHN0cmluZ1tdO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgZGVwZW5kZW5jeU1hbmFnZXIuc2Nhbk1hbmlmZXN0cyh0cnVlKTtcclxuICBjb25zdCBtb2RzOiBJTW9kSW5mb1tdID0gYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RGaWxlcy5tYXAoYXN5bmMgbWFuaWZlc3RGaWxlID0+IHtcclxuICAgIGNvbnN0IHJvb3RGb2xkZXIgPSBwYXRoLmRpcm5hbWUobWFuaWZlc3RGaWxlKTtcclxuICAgIGNvbnN0IG1hbmlmZXN0SW5kZXggPSBtYW5pZmVzdEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKE1BTklGRVNUX0ZJTEUpO1xyXG4gICAgY29uc3QgZmlsdGVyRnVuYyA9IChmaWxlKSA9PiAocm9vdEZvbGRlciAhPT0gJy4nKVxyXG4gICAgICA/ICgoZmlsZS5pbmRleE9mKHJvb3RGb2xkZXIpICE9PSAtMSlcclxuICAgICAgICAmJiAocGF0aC5kaXJuYW1lKGZpbGUpICE9PSAnLicpXHJcbiAgICAgICAgJiYgIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgICA6ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKTtcclxuICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPSBhd2FpdCBwYXJzZU1hbmlmZXN0KHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1hbmlmZXN0RmlsZSkpO1xyXG4gICAgY29uc3QgbW9kRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsdGVyRnVuYyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBtYW5pZmVzdCxcclxuICAgICAgcm9vdEZvbGRlcixcclxuICAgICAgbWFuaWZlc3RJbmRleCxcclxuICAgICAgbW9kRmlsZXMsXHJcbiAgICB9O1xyXG4gIH0pKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLm1hcChtb2RzLCBtb2QgPT4ge1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IChtb2Qucm9vdEZvbGRlciAhPT0gJy4nKVxyXG4gICAgICA/IG1vZC5yb290Rm9sZGVyXHJcbiAgICAgIDogbW9kLm1hbmlmZXN0Lk5hbWU7XHJcblxyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbW9kLm1hbmlmZXN0LkRlcGVuZGVuY2llcyB8fCBbXTtcclxuXHJcbiAgICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIG1vZC5tb2RGaWxlcykge1xyXG4gICAgICBjb25zdCBkZXN0aW5hdGlvbiA9IHBhdGguam9pbihtb2ROYW1lLCBmaWxlLnN1YnN0cihtb2QubWFuaWZlc3RJbmRleCkpO1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZGVzdGluYXRpb24sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFkZFJ1bGVGb3JEZXBlbmRlbmN5ID0gKGRlcDogSVNEVkRlcGVuZGVuY3kpID0+IHtcclxuICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGVwLk1pbmltdW1WZXJzaW9uICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IGA+PSR7ZGVwLk1pbmltdW1WZXJzaW9ufWBcclxuICAgICAgICA6ICcqJztcclxuICAgICAgY29uc3QgcnVsZTogdHlwZXMuSU1vZFJ1bGUgPSB7XHJcbiAgICAgICAgdHlwZTogKGRlcC5Jc1JlcXVpcmVkID8/IHRydWUpID8gJ3JlcXVpcmVzJyA6ICdyZWNvbW1lbmRzJyxcclxuICAgICAgICByZWZlcmVuY2U6IHtcclxuICAgICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogZGVwLlVuaXF1ZUlELnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICB2ZXJzaW9uTWF0Y2gsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBleHRyYToge1xyXG4gICAgICAgICAgb25seUlmRnVsZmlsbGFibGU6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfTtcclxuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdydWxlJyxcclxuICAgICAgICBydWxlLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3koZGVwKTtcclxuICAgIH1cclxuICAgIGlmIChtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGluc3RydWN0aW9ucztcclxuICB9KVxyXG4gICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChkYXRhKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiBhY2N1bS5jb25jYXQoaXRlciksIFtdKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1NNQVBJTW9kVHlwZShpbnN0cnVjdGlvbnMpIHtcclxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS5cclxuICBjb25zdCBzbWFwaURhdGEgPSBpbnN0cnVjdGlvbnMuZmluZChpbnN0ID0+IChpbnN0LnR5cGUgPT09ICdjb3B5JykgJiYgaW5zdC5zb3VyY2UuZW5kc1dpdGgoU01BUElfRVhFKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHNtYXBpRGF0YSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFNNQVBJKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBNYWtlIHN1cmUgdGhlIGRvd25sb2FkIGNvbnRhaW5zIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmUuc1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmIChmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgIHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IFNNQVBJX0RMTCkgIT09IHVuZGVmaW5lZClcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICAgIHN1cHBvcnRlZCxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgY29uc3QgZm9sZGVyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJ1xyXG4gICAgPyAnd2luZG93cydcclxuICAgIDogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2xpbnV4J1xyXG4gICAgICA/ICdsaW51eCdcclxuICAgICAgOiAnbWFjb3MnO1xyXG4gIGNvbnN0IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0gPSAoZmlsZSkgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcclxuICAgIHJldHVybiAoc2VnbWVudHMuaW5jbHVkZXMoZm9sZGVyKSk7XHJcbiAgfVxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGRhdGEgYXJjaGl2ZVxyXG4gIGNvbnN0IGRhdGFGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgIGNvbnN0IGlzQ29ycmVjdFBsYXRmb3JtID0gZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybShmaWxlKTtcclxuICAgIHJldHVybiBpc0NvcnJlY3RQbGF0Zm9ybSAmJiBTTUFQSV9EQVRBLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSlcclxuICB9KTtcclxuICBpZiAoZGF0YUZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gZmluZCB0aGUgU01BUEkgZGF0YSBmaWxlcyAtIGRvd25sb2FkIGFwcGVhcnMgJ1xyXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xyXG4gIH1cclxuICBsZXQgZGF0YSA9ICcnO1xyXG4gIHRyeSB7XHJcbiAgICBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oZ2V0RGlzY292ZXJ5UGF0aCgpLCAnU3RhcmRldyBWYWxsZXkuZGVwcy5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFNEViBkZXBlbmRlbmNpZXMnLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy8gZmlsZSB3aWxsIGJlIG91dGRhdGVkIGFmdGVyIHRoZSB3YWxrIG9wZXJhdGlvbiBzbyBwcmVwYXJlIGEgcmVwbGFjZW1lbnQuIFxyXG4gIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IFtdO1xyXG5cclxuICBjb25zdCBzemlwID0gbmV3IFNldmVuWmlwKCk7XHJcbiAgLy8gVW56aXAgdGhlIGZpbGVzIGZyb20gdGhlIGRhdGEgYXJjaGl2ZS4gVGhpcyBkb2Vzbid0IHNlZW0gdG8gYmVoYXZlIGFzIGRlc2NyaWJlZCBoZXJlOiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9ub2RlLTd6I2V2ZW50c1xyXG4gIGF3YWl0IHN6aXAuZXh0cmFjdEZ1bGwocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgZGF0YUZpbGUpLCBkZXN0aW5hdGlvblBhdGgpO1xyXG5cclxuICAvLyBGaW5kIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgaW4gdGhlIHBhcmVudCBmb2xkZXIuIFxyXG4gIGF3YWl0IHV0aWwud2FsayhkZXN0aW5hdGlvblBhdGgsIChpdGVyLCBzdGF0cykgPT4ge1xyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkZXN0aW5hdGlvblBhdGgsIGl0ZXIpO1xyXG4gICAgICAvLyBGaWx0ZXIgb3V0IGZpbGVzIGZyb20gdGhlIG9yaWdpbmFsIGluc3RhbGwgYXMgdGhleSdyZSBubyBsb25nZXIgcmVxdWlyZWQuXHJcbiAgICAgIGlmICghZmlsZXMuaW5jbHVkZXMocmVsUGF0aCkgJiYgc3RhdHMuaXNGaWxlKCkgJiYgIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgrcGF0aC5zZXApKSB1cGRhdGVkRmlsZXMucHVzaChyZWxQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICBjb25zdCBtb2RzRm9sZGVySWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgICBpZiAoKG1vZHNGb2xkZXJJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc0ZvbGRlcklkeCArIDEpKSB7XHJcbiAgICAgICAgX1NNQVBJX0JVTkRMRURfTU9EUy5wdXNoKHNlZ21lbnRzW21vZHNGb2xkZXJJZHggKyAxXSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuIFxyXG4gIGNvbnN0IHNtYXBpRXhlID0gdXBkYXRlZEZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoU01BUElfRVhFLnRvTG93ZXJDYXNlKCkpKTtcclxuICBpZiAoc21hcGlFeGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGBGYWlsZWQgdG8gZXh0cmFjdCAke1NNQVBJX0VYRX0gLSBkb3dubG9hZCBhcHBlYXJzIGBcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgY29uc3QgaWR4ID0gc21hcGlFeGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKHNtYXBpRXhlKSk7XHJcblxyXG4gIC8vIEJ1aWxkIHRoZSBpbnN0cnVjdGlvbnMgZm9yIGluc3RhbGxhdGlvbi4gXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IHVwZGF0ZWRGaWxlcy5tYXAoZmlsZSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKGZpbGUuc3Vic3RyKGlkeCkpLFxyXG4gICAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAga2V5OiAnc21hcGlCdW5kbGVkTW9kcycsXHJcbiAgICB2YWx1ZTogZ2V0QnVuZGxlZE1vZHMoKSxcclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgdHlwZTogJ2dlbmVyYXRlZmlsZScsXHJcbiAgICBkYXRhLFxyXG4gICAgZGVzdGluYXRpb246ICdTdGFyZGV3TW9kZGluZ0FQSS5kZXBzLmpzb24nLFxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgbG9nRmlsZSkge1xyXG4gIGNvbnN0IGxvZ0RhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihiYXNlUGF0aCwgbG9nRmlsZSksIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XHJcbiAgYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnU01BUEkgTG9nJywge1xyXG4gICAgdGV4dDogJ1lvdXIgU01BUEkgbG9nIGlzIGRpc3BsYXllZCBiZWxvdy4gVG8gc2hhcmUgaXQsIGNsaWNrIFwiQ29weSAmIFNoYXJlXCIgd2hpY2ggd2lsbCBjb3B5IGl0IHRvIHlvdXIgY2xpcGJvYXJkIGFuZCBvcGVuIHRoZSBTTUFQSSBsb2cgc2hhcmluZyB3ZWJzaXRlLiAnICtcclxuICAgICAgJ05leHQsIHBhc3RlIHlvdXIgY29kZSBpbnRvIHRoZSB0ZXh0IGJveCBhbmQgcHJlc3MgXCJzYXZlICYgcGFyc2UgbG9nXCIuIFlvdSBjYW4gbm93IHNoYXJlIGEgbGluayB0byB0aGlzIHBhZ2Ugd2l0aCBvdGhlcnMgc28gdGhleSBjYW4gc2VlIHlvdXIgbG9nIGZpbGUuXFxuXFxuJyArIGxvZ0RhdGFcclxuICB9LCBbe1xyXG4gICAgbGFiZWw6ICdDb3B5ICYgU2hhcmUgbG9nJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9eLitUKFteXFwuXSspLisvLCAnJDEnKTtcclxuICAgICAgY2xpcGJvYXJkLndyaXRlVGV4dChgWyR7dGltZXN0YW1wfSBJTkZPIFZvcnRleF0gTG9nIGV4cG9ydGVkIGJ5IFZvcnRleCAke3V0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9ufS5cXG5gICsgbG9nRGF0YSk7XHJcbiAgICAgIHJldHVybiB1dGlsLm9wbignaHR0cHM6Ly9zbWFwaS5pby9sb2cnKS5jYXRjaChlcnIgPT4gdW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9LCB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHVuZGVmaW5lZCB9XSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uU2hvd1NNQVBJTG9nKGFwaSkge1xyXG4gIC8vUmVhZCBhbmQgZGlzcGxheSB0aGUgbG9nLlxyXG4gIGNvbnN0IGJhc2VQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnYXBwRGF0YScpLCAnc3RhcmRld3ZhbGxleScsICdlcnJvcmxvZ3MnKTtcclxuICB0cnkge1xyXG4gICAgLy9JZiB0aGUgY3Jhc2ggbG9nIGV4aXN0cywgc2hvdyB0aGF0LlxyXG4gICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktY3Jhc2gudHh0XCIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy9PdGhlcndpc2Ugc2hvdyB0aGUgbm9ybWFsIGxvZy5cclxuICAgICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktbGF0ZXN0LnR4dFwiKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvL09yIEluZm9ybSB0aGUgdXNlciB0aGVyZSBhcmUgbm8gbG9ncy5cclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oeyB0eXBlOiAnaW5mbycsIHRpdGxlOiAnTm8gU01BUEkgbG9ncyBmb3VuZC4nLCBtZXNzYWdlOiAnJywgZGlzcGxheU1TOiA1MDAwIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TW9kTWFuaWZlc3RzKG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgY29uc3QgbWFuaWZlc3RzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuICBpZiAobW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XHJcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcclxuICAgICAgICBtYW5pZmVzdHMucHVzaChlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcclxuICAgIC50aGVuKCgpID0+IG1hbmlmZXN0cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZUNvbmZsaWN0SW5mbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFwaTogU01BUElQcm94eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWQ6IHN0cmluZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgbW9kID0gYXBpLmdldFN0YXRlKCkucGVyc2lzdGVudC5tb2RzW2dhbWVJZF1bbW9kSWRdO1xyXG5cclxuICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG5cclxuICBpZiAoKG5vdyAtIG1vZC5hdHRyaWJ1dGVzPy5sYXN0U01BUElRdWVyeSA/PyAwKSA8IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgbGV0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gbW9kLmF0dHJpYnV0ZXM/LmFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzO1xyXG4gIGlmICghYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMpIHtcclxuICAgIGlmIChtb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lKSB7XHJcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW21vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWVdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHF1ZXJ5ID0gYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXNcclxuICAgIC5tYXAobmFtZSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcyA9IHtcclxuICAgICAgICBpZDogbmFtZSxcclxuICAgICAgfTtcclxuICAgICAgY29uc3QgdmVyID0gbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxyXG4gICAgICAgICAgICAgICAgICAgICA/PyBzZW12ZXIuY29lcmNlKG1vZC5hdHRyaWJ1dGVzPy52ZXJzaW9uKT8udmVyc2lvbjtcclxuICAgICAgaWYgKCEhdmVyKSB7XHJcbiAgICAgICAgcmVzWydpbnN0YWxsZWRWZXJzaW9uJ10gPSB2ZXI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3Qgc3RhdCA9IChpdGVtOiBJU01BUElSZXN1bHQpOiBDb21wYXRpYmlsaXR5U3RhdHVzID0+IHtcclxuICAgIGNvbnN0IHN0YXR1cyA9IGl0ZW0ubWV0YWRhdGE/LmNvbXBhdGliaWxpdHlTdGF0dXM/LnRvTG93ZXJDYXNlPy4oKTtcclxuICAgIGlmICghY29tcGF0aWJpbGl0eU9wdGlvbnMuaW5jbHVkZXMoc3RhdHVzIGFzIGFueSkpIHtcclxuICAgICAgcmV0dXJuICd1bmtub3duJztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzdGF0dXMgYXMgQ29tcGF0aWJpbGl0eVN0YXR1cztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBjb21wYXRpYmlsaXR5UHJpbyA9IChpdGVtOiBJU01BUElSZXN1bHQpID0+IGNvbXBhdGliaWxpdHlPcHRpb25zLmluZGV4T2Yoc3RhdChpdGVtKSk7XHJcblxyXG4gIHJldHVybiBzbWFwaS5maW5kQnlOYW1lcyhxdWVyeSlcclxuICAgIC50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICBjb25zdCB3b3JzdFN0YXR1czogSVNNQVBJUmVzdWx0W10gPSByZXN1bHRzXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBjb21wYXRpYmlsaXR5UHJpbyhsaHMpIC0gY29tcGF0aWJpbGl0eVByaW8ocmhzKSk7XHJcbiAgICAgIGlmICh3b3JzdFN0YXR1cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlcyhnYW1lSWQsIG1vZElkLCB7XHJcbiAgICAgICAgICBsYXN0U01BUElRdWVyeTogbm93LFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVN0YXR1czogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN0YXR1cyxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlNZXNzYWdlOiB3b3JzdFN0YXR1c1swXS5tZXRhZGF0YS5jb21wYXRpYmlsaXR5U3VtbWFyeSxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlVcGRhdGU6IHdvcnN0U3RhdHVzWzBdLnN1Z2dlc3RlZFVwZGF0ZT8udmVyc2lvbixcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdubyBtYW5pZmVzdCcpO1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ3dhcm4nLCAnZXJyb3IgcmVhZGluZyBtYW5pZmVzdCcsIGVyci5tZXNzYWdlKTtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBsZXQgZGVwZW5kZW5jeU1hbmFnZXI6IERlcGVuZGVuY3lNYW5hZ2VyO1xyXG4gIGNvbnN0IGdldERpc2NvdmVyeVBhdGggPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcclxuICAgICAgbG9nKCdlcnJvcicsICdzdGFyZGV3dmFsbGV5IHdhcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGdldFNNQVBJUGF0aCA9IChnYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGlzTW9kQ2FuZGlkYXRlVmFsaWQgPSAobW9kLCBlbnRyeSkgPT4ge1xyXG4gICAgaWYgKG1vZD8uaWQgPT09IHVuZGVmaW5lZCB8fCBtb2QudHlwZSA9PT0gJ3NkdnJvb3Rmb2xkZXInKSB7XHJcbiAgICAgIC8vIFRoZXJlIGlzIG5vIHJlbGlhYmxlIHdheSB0byBhc2NlcnRhaW4gd2hldGhlciBhIG5ldyBmaWxlIGVudHJ5XHJcbiAgICAgIC8vICBhY3R1YWxseSBiZWxvbmdzIHRvIGEgcm9vdCBtb2RUeXBlIGFzIHNvbWUgb2YgdGhlc2UgbW9kcyB3aWxsIGFjdFxyXG4gICAgICAvLyAgYXMgcmVwbGFjZW1lbnQgbW9kcy4gVGhpcyBvYnZpb3VzbHkgbWVhbnMgdGhhdCBpZiB0aGUgZ2FtZSBoYXNcclxuICAgICAgLy8gIGEgc3Vic3RhbnRpYWwgdXBkYXRlIHdoaWNoIGludHJvZHVjZXMgbmV3IGZpbGVzIHdlIGNvdWxkIHBvdGVudGlhbGx5XHJcbiAgICAgIC8vICBhZGQgYSB2YW5pbGxhIGdhbWUgZmlsZSBpbnRvIHRoZSBtb2QncyBzdGFnaW5nIGZvbGRlciBjYXVzaW5nIGNvbnN0YW50XHJcbiAgICAgIC8vICBjb250ZW50aW9uIGJldHdlZW4gdGhlIGdhbWUgaXRzZWxmICh3aGVuIGl0IHVwZGF0ZXMpIGFuZCB0aGUgbW9kLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUaGVyZSBpcyBhbHNvIGEgcG90ZW50aWFsIGNoYW5jZSBmb3Igcm9vdCBtb2RUeXBlcyB0byBjb25mbGljdCB3aXRoIHJlZ3VsYXJcclxuICAgICAgLy8gIG1vZHMsIHdoaWNoIGlzIHdoeSBpdCdzIG5vdCBzYWZlIHRvIGFzc3VtZSB0aGF0IGFueSBhZGRpdGlvbiBpbnNpZGUgdGhlXHJcbiAgICAgIC8vICBtb2RzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IGFkZGVkIHRvIHRoaXMgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgZWl0aGVyLlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1vZC50eXBlICE9PSAnU01BUEknKSB7XHJcbiAgICAgIC8vIE90aGVyIG1vZCB0eXBlcyBkbyBub3QgcmVxdWlyZSBmdXJ0aGVyIHZhbGlkYXRpb24gLSBpdCBzaG91bGQgYmUgZmluZVxyXG4gICAgICAvLyAgdG8gYWRkIHRoaXMgZW50cnkuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZW50cnkuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICBjb25zdCBtb2RzU2VnSWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXHJcbiAgICAgID8gc2VnbWVudHNbbW9kc1NlZ0lkeCArIDFdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIGxldCBidW5kbGVkTW9kcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdzbWFwaUJ1bmRsZWRNb2RzJ10sIFtdKTtcclxuICAgIGJ1bmRsZWRNb2RzID0gYnVuZGxlZE1vZHMubGVuZ3RoID4gMCA/IGJ1bmRsZWRNb2RzIDogZ2V0QnVuZGxlZE1vZHMoKTtcclxuICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcygnY29udGVudCcpKSB7XHJcbiAgICAgIC8vIFNNQVBJIGlzIG5vdCBzdXBwb3NlZCB0byBvdmVyd3JpdGUgdGhlIGdhbWUncyBjb250ZW50IGRpcmVjdGx5LlxyXG4gICAgICAvLyAgdGhpcyBpcyBjbGVhcmx5IG5vdCBhIFNNQVBJIGZpbGUgYW5kIHNob3VsZCBfbm90XyBiZSBhZGRlZCB0byBpdC5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAobW9kRm9sZGVyTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiBidW5kbGVkTW9kcy5pbmNsdWRlcyhtb2RGb2xkZXJOYW1lKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBtYW5pZmVzdEV4dHJhY3RvciA9IHRvQmx1ZShcclxuICAgIGFzeW5jIChtb2RJbmZvOiBhbnksIG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHsgW2tleTogc3RyaW5nXTogYW55OyB9PiA9PiB7XHJcbiAgICAgIGlmIChzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoKTtcclxuICAgICAgaWYgKG1hbmlmZXN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcGFyc2VkTWFuaWZlc3RzID0gYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RzLm1hcChcclxuICAgICAgICBhc3luYyBtYW4gPT4gYXdhaXQgcGFyc2VNYW5pZmVzdChtYW4pKSk7XHJcblxyXG4gICAgICAvLyB3ZSBjYW4gb25seSB1c2Ugb25lIG1hbmlmZXN0IHRvIGdldCB0aGUgaWQgZnJvbVxyXG4gICAgICBjb25zdCByZWZNYW5pZmVzdCA9IHBhcnNlZE1hbmlmZXN0c1swXTtcclxuXHJcbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gcGFyc2VkTWFuaWZlc3RzXHJcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpKTtcclxuXHJcbiAgICAgIGNvbnN0IG1pblNNQVBJVmVyc2lvbiA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuTWluaW11bUFwaVZlcnNpb24pXHJcbiAgICAgICAgLmZpbHRlcih2ZXJzaW9uID0+IHNlbXZlci52YWxpZCh2ZXJzaW9uKSlcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IHNlbXZlci5jb21wYXJlKHJocywgbGhzKSlbMF07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSB7XHJcbiAgICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMsXHJcbiAgICAgICAgbWluU01BUElWZXJzaW9uLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gZG9uJ3Qgc2V0IGEgY3VzdG9tIGZpbGUgbmFtZSBmb3IgU01BUElcclxuICAgICAgaWYgKG1vZEluZm8uZG93bmxvYWQubW9kSW5mby5uZXh1cy5pZHMubW9kSWQgIT09IDI0MDApIHtcclxuICAgICAgICByZXN1bHRbJ2N1c3RvbUZpbGVOYW1lJ10gPSByZWZNYW5pZmVzdC5OYW1lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodHlwZW9mKHJlZk1hbmlmZXN0LlZlcnNpb24pID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJlc3VsdFsnbWFuaWZlc3RWZXJzaW9uJ10gPSByZWZNYW5pZmVzdC5WZXJzaW9uO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUobmV3IFN0YXJkZXdWYWxsZXkoY29udGV4dCkpO1xyXG4gIC8vIFJlZ2lzdGVyIG91ciBTTUFQSSBtb2QgdHlwZSBhbmQgaW5zdGFsbGVyLiBOb3RlOiBUaGlzIGN1cnJlbnRseSBmbGFncyBhbiBlcnJvciBpbiBWb3J0ZXggb24gaW5zdGFsbGluZyBjb3JyZWN0bHkuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc21hcGktaW5zdGFsbGVyJywgMzAsIHRlc3RTTUFQSSwgKGZpbGVzLCBkZXN0KSA9PiBCbHVlYmlyZC5yZXNvbHZlKGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnU01BUEknLCAzMCwgZ2FtZUlkID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgZ2V0U01BUElQYXRoLCBpc1NNQVBJTW9kVHlwZSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRlc3RTdXBwb3J0ZWQsXHJcbiAgICAoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlciwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzZHZyb290Zm9sZGVyJywgNTAsIHRlc3RSb290Rm9sZGVyLCBpbnN0YWxsUm9vdEZvbGRlcik7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3NkdnJvb3Rmb2xkZXInLCAyNSwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXHJcbiAgICAoKSA9PiBnZXREaXNjb3ZlcnlQYXRoKCksIChpbnN0cnVjdGlvbnMpID0+IHtcclxuICAgICAgLy8gT25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zLlxyXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xyXG4gICAgICAvLyBUaGlzIGlzIGEgdHJpY2t5IHBhdHRlcm4gc28gd2UncmUgZ29pbmcgdG8gMXN0IHByZXNlbnQgdGhlIGRpZmZlcmVudCBwYWNrYWdpbmdcclxuICAgICAgLy8gIHBhdHRlcm5zIHdlIG5lZWQgdG8gY2F0ZXIgZm9yOlxyXG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXHJcbiAgICAgIC8vICAgIG1hbmlmZXN0IGZpbGVzIGFyZSBpbmNsdWRlZC5cclxuICAgICAgLy8gIDIuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlciArIG9uZSBvciBtb3JlIFNNQVBJIG1vZHMgaW5jbHVkZWRcclxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXHJcbiAgICAgIC8vICAzLiBBIHJlZ3VsYXIgU01BUEkgbW9kIHdpdGggYSBcIkNvbnRlbnRcIiBmb2xkZXIgaW5zaWRlIHRoZSBtb2QncyByb290IGRpci5cclxuICAgICAgLy9cclxuICAgICAgLy8gcGF0dGVybiAxOlxyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgZG9uJ3QgaGF2ZSBtYW5pZmVzdCBmaWxlc1xyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgaGF2ZSBhIFwiQ29udGVudFwiIGZvbGRlclxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUbyBzb2x2ZSBwYXR0ZXJucyAyIGFuZCAzIHdlJ3JlIGdvaW5nIHRvOlxyXG4gICAgICAvLyAgQ2hlY2sgd2hldGhlciB3ZSBoYXZlIGFueSBtYW5pZmVzdCBmaWxlcywgaWYgd2UgZG8sIHdlIGV4cGVjdCB0aGUgZm9sbG93aW5nXHJcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XHJcbiAgICAgIC8vICAgIGFyY2hpdmUuemlwID0+XHJcbiAgICAgIC8vICAgICAgLi4vQ29udGVudC9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL1xyXG4gICAgICAvLyAgICAgIC4uL01vZHMvQV9TTUFQSV9NT0RcXG1hbmlmZXN0Lmpzb25cclxuICAgICAgY29uc3QgaGFzTWFuaWZlc3QgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcclxuICAgICAgY29uc3QgaGFzTW9kc0ZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ01vZHMnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBoYXNDb250ZW50Rm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnQ29udGVudCcgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWRcclxuXHJcbiAgICAgIHJldHVybiAoaGFzTWFuaWZlc3QpXHJcbiAgICAgICAgPyBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIgJiYgaGFzTW9kc0ZvbGRlcilcclxuICAgICAgICA6IEJsdWViaXJkLnJlc29sdmUoaGFzQ29udGVudEZvbGRlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnY2hhbmdlbG9nJywge30sICdTTUFQSSBMb2cnLFxyXG4gICAgKCkgPT4geyBvblNob3dTTUFQSUxvZyhjb250ZXh0LmFwaSk7IH0sXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIC8vT25seSBzaG93IHRoZSBTTUFQSSBsb2cgYnV0dG9uIGZvciBTRFYuIFxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBdHRyaWJ1dGVFeHRyYWN0b3IoMjUsIG1hbmlmZXN0RXh0cmFjdG9yKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xyXG4gICAgaWQ6ICdzZHYtY29tcGF0aWJpbGl0eScsXHJcbiAgICBwb3NpdGlvbjogMTAwLFxyXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxyXG4gICAgcGxhY2VtZW50OiAndGFibGUnLFxyXG4gICAgY2FsYzogKG1vZDogdHlwZXMuSU1vZCkgPT4gbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XHJcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KENvbXBhdGliaWxpdHlJY29uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHQsIG1vZCwgZGV0YWlsQ2VsbCB9LCBbXSk7XHJcbiAgICB9LFxyXG4gICAgbmFtZTogJ0NvbXBhdGliaWxpdHknLFxyXG4gICAgaXNEZWZhdWx0VmlzaWJsZTogdHJ1ZSxcclxuICAgIGVkaXQ6IHt9LFxyXG4gIH0pO1xyXG5cclxuICAvKlxyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtbWlzc2luZy1kZXBlbmRlbmNpZXMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IHRlc3RNaXNzaW5nRGVwZW5kZW5jaWVzKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpO1xyXG4gICovXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3Nkdi1pbmNvbXBhdGlibGUtbW9kcycsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0U01BUElPdXRkYXRlZChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKSk7XHJcblxyXG4gIGludGVyZmFjZSBJQWRkZWRGaWxlIHtcclxuICAgIGZpbGVQYXRoOiBzdHJpbmc7XHJcbiAgICBjYW5kaWRhdGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb25zdCBwcm94eSA9IG5ldyBTTUFQSVByb3h5KGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ3NkdicsIHBhdGguam9pbihfX2Rpcm5hbWUsICdzZHZzdHlsZS5zY3NzJykpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmFkZE1ldGFTZXJ2ZXIoJ3NtYXBpLmlvJywge1xyXG4gICAgICB1cmw6ICcnLFxyXG4gICAgICBsb29wYmFja0NCOiAocXVlcnk6IElRdWVyeSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShwcm94eS5maW5kKHF1ZXJ5KSksXHJcbiAgICAgIGNhY2hlRHVyYXRpb25TZWM6IDg2NDAwLFxyXG4gICAgICBwcmlvcml0eTogMjUsXHJcbiAgICB9KTtcclxuICAgIGRlcGVuZGVuY3lNYW5hZ2VyID0gbmV3IERlcGVuZGVuY3lNYW5hZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgYXN5bmMgKHByb2ZpbGVJZCwgZmlsZXM6IElBZGRlZEZpbGVbXSkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICAvLyBkb24ndCBjYXJlIGFib3V0IGFueSBvdGhlciBnYW1lc1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgICAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuXHJcbiAgICAgIGF3YWl0IEJsdWViaXJkLm1hcChmaWxlcywgYXN5bmMgZW50cnkgPT4ge1xyXG4gICAgICAgIC8vIG9ubHkgYWN0IGlmIHdlIGRlZmluaXRpdmVseSBrbm93IHdoaWNoIG1vZCBvd25zIHRoZSBmaWxlXHJcbiAgICAgICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgaWYgKCFpc01vZENhbmRpZGF0ZVZhbGlkKG1vZCwgZW50cnkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IGZyb20gPSBtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ107XHJcbiAgICAgICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIEhvdyBpcyB0aGlzIGV2ZW4gcG9zc2libGU/IHJlZ2FyZGxlc3MgaXQncyBub3QgdGhpc1xyXG4gICAgICAgICAgICAvLyAgZnVuY3Rpb24ncyBqb2IgdG8gcmVwb3J0IHRoaXMuXHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlc29sdmUgbW9kIHBhdGggZm9yIG1vZCB0eXBlJywgbW9kLnR5cGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShmcm9tLCBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xyXG4gICAgICAgICAgLy8gY29weSB0aGUgbmV3IGZpbGUgYmFjayBpbnRvIHRoZSBjb3JyZXNwb25kaW5nIG1vZCwgdGhlbiBkZWxldGUgaXQuIFRoYXQgd2F5LCB2b3J0ZXggd2lsbFxyXG4gICAgICAgICAgLy8gY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0IGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSk7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBpZiAoIWVyci5tZXNzYWdlLmluY2x1ZGVzKCdhcmUgdGhlIHNhbWUgZmlsZScpKSB7XHJcbiAgICAgICAgICAgICAgLy8gc2hvdWxkIHdlIGJlIHJlcG9ydGluZyB0aGlzIHRvIHRoZSB1c2VyPyBUaGlzIGlzIGEgY29tcGxldGVseVxyXG4gICAgICAgICAgICAgIC8vIGF1dG9tYXRlZCBwcm9jZXNzIGFuZCBpZiBpdCBmYWlscyBtb3JlIG9mdGVuIHRoYW4gbm90IHRoZVxyXG4gICAgICAgICAgICAgIC8vIHVzZXIgcHJvYmFibHkgZG9lc24ndCBjYXJlXHJcbiAgICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmUtaW1wb3J0IGFkZGVkIGZpbGUgdG8gbW9kJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgJ3NtYXBpJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcclxuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnaW50ZXJmYWNlJywgJ3ByaW1hcnlUb29sJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gJ3NtYXBpJykge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdW5kZWZpbmVkKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgKGdhbWVJZDogc3RyaW5nLCBhcmNoaXZlSWQ6IHN0cmluZywgbW9kSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHVwZGF0ZUNvbmZsaWN0SW5mbyhjb250ZXh0LmFwaSwgcHJveHksIGdhbWVJZCwgbW9kSWQpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gbG9nKCdkZWJ1ZycsICdhZGRlZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkIH0pKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gYWRkIGNvbXBhdGliaWxpdHkgaW5mbycsIHsgbW9kSWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCAoZ2FtZU1vZGU6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgbG9nKCdkZWJ1ZycsICd1cGRhdGluZyBTRFYgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKHN0YXRlLnBlcnNpc3RlbnQubW9kc1tnYW1lTW9kZV0gPz8ge30pLm1hcChtb2RJZCA9PlxyXG4gICAgICAgIHVwZGF0ZUNvbmZsaWN0SW5mbyhjb250ZXh0LmFwaSwgcHJveHksIGdhbWVNb2RlLCBtb2RJZCkpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGxvZygnZGVidWcnLCAnZG9uZSB1cGRhdGluZyBjb21wYXRpYmlsaXR5IGluZm8nKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gdXBkYXRlIGNvbmZsaWN0IGluZm8nLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW5pdDtcclxuIl19