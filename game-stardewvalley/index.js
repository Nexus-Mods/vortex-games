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
        var _a, _b, _c;
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
        if (((_c = (_b = (_a = modInfo.download.modInfo) === null || _a === void 0 ? void 0 : _a.nexus) === null || _b === void 0 ? void 0 : _b.ids) === null || _c === void 0 ? void 0 : _c.modId) !== 2400) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFDMUMsNEVBQW9EO0FBQ3BELDJDQUFvRDtBQUVwRCw0RUFBb0Q7QUFDcEQsOERBQXNDO0FBQ3RDLG1DQUE0QztBQUM1QyxtQ0FBbUg7QUFDbkgsaUNBQXVDO0FBRXZDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDMUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ25DLEtBQUssR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQy9CLEVBQUUsUUFBUSxFQUFFLEdBQUcsaUJBQUksRUFDbkIsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFDakUsRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFcEMsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDckQsTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUUxRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzlFLE1BQU0sY0FBYyxHQUFHLEdBQUcsRUFBRTtJQUMxQixPQUFPLEtB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QUNYLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBJUXVlcnkgfSBmcm9tICdtb2RtZXRhLWRiJztcclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB1dGlsLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgKiBhcyB3aW5hcGkgZnJvbSAnd2luYXBpLWJpbmRpbmdzJztcclxuaW1wb3J0IENvbXBhdGliaWxpdHlJY29uIGZyb20gJy4vQ29tcGF0aWJpbGl0eUljb24nO1xyXG5pbXBvcnQgeyBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kgfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgRGVwZW5kZW5jeU1hbmFnZXIgZnJvbSAnLi9EZXBlbmRlbmN5TWFuYWdlcic7XHJcbmltcG9ydCBTTUFQSVByb3h5IGZyb20gJy4vc21hcGlQcm94eSc7XHJcbmltcG9ydCB7IHRlc3RTTUFQSU91dGRhdGVkIH0gZnJvbSAnLi90ZXN0cyc7XHJcbmltcG9ydCB7IGNvbXBhdGliaWxpdHlPcHRpb25zLCBDb21wYXRpYmlsaXR5U3RhdHVzLCBJU0RWRGVwZW5kZW5jeSwgSVNEVk1vZE1hbmlmZXN0LCBJU01BUElSZXN1bHQgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgcGFyc2VNYW5pZmVzdCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpLFxyXG4gIHsgY2xpcGJvYXJkIH0gPSByZXF1aXJlKCdlbGVjdHJvbicpLFxyXG4gIHJqc29uID0gcmVxdWlyZSgncmVsYXhlZC1qc29uJyksXHJcbiAgeyBTZXZlblppcCB9ID0gdXRpbCxcclxuICB7IGRlcGxveVNNQVBJLCBkb3dubG9hZFNNQVBJLCBmaW5kU01BUElNb2QgfSA9IHJlcXVpcmUoJy4vU01BUEknKSxcclxuICB7IEdBTUVfSUQgfSA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XHJcblxyXG5jb25zdCBNQU5JRkVTVF9GSUxFID0gJ21hbmlmZXN0Lmpzb24nO1xyXG5jb25zdCBQVFJOX0NPTlRFTlQgPSBwYXRoLnNlcCArICdDb250ZW50JyArIHBhdGguc2VwO1xyXG5jb25zdCBTTUFQSV9FWEUgPSAnU3RhcmRld01vZGRpbmdBUEkuZXhlJztcclxuY29uc3QgU01BUElfRExMID0gJ1NNQVBJLkluc3RhbGxlci5kbGwnO1xyXG5jb25zdCBTTUFQSV9EQVRBID0gWyd3aW5kb3dzLWluc3RhbGwuZGF0JywgJ2luc3RhbGwuZGF0J107XHJcblxyXG5jb25zdCBfU01BUElfQlVORExFRF9NT0RTID0gWydFcnJvckhhbmRsZXInLCAnQ29uc29sZUNvbW1hbmRzJywgJ1NhdmVCYWNrdXAnXTtcclxuY29uc3QgZ2V0QnVuZGxlZE1vZHMgPSAoKSA9PiB7XHJcbiAgcmV0dXJuIEFycmF5LmZyb20obmV3IFNldChfU01BUElfQlVORExFRF9NT0RTLm1hcChtb2ROYW1lID0+IG1vZE5hbWUudG9Mb3dlckNhc2UoKSkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmNsYXNzIFN0YXJkZXdWYWxsZXkgaW1wbGVtZW50cyB0eXBlcy5JR2FtZSB7XHJcbiAgcHVibGljIGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0O1xyXG4gIHB1YmxpYyBpZDogc3RyaW5nID0gR0FNRV9JRDtcclxuICBwdWJsaWMgbmFtZTogc3RyaW5nID0gJ1N0YXJkZXcgVmFsbGV5JztcclxuICBwdWJsaWMgbG9nbzogc3RyaW5nID0gJ2dhbWVhcnQuanBnJztcclxuICBwdWJsaWMgcmVxdWlyZWRGaWxlczogc3RyaW5nW107XHJcbiAgcHVibGljIGVudmlyb25tZW50OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xyXG4gICAgU3RlYW1BUFBJZDogJzQxMzE1MCcsXHJcbiAgfTtcclxuICBwdWJsaWMgZGV0YWlsczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHtcclxuICAgIHN0ZWFtQXBwSWQ6IDQxMzE1MFxyXG4gIH07XHJcbiAgcHVibGljIHN1cHBvcnRlZFRvb2xzOiBhbnlbXSA9IFtcclxuICAgIHtcclxuICAgICAgaWQ6ICdzbWFwaScsXHJcbiAgICAgIG5hbWU6ICdTTUFQSScsXHJcbiAgICAgIGxvZ286ICdzbWFwaS5wbmcnLFxyXG4gICAgICBleGVjdXRhYmxlOiAoKSA9PiBTTUFQSV9FWEUsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtTTUFQSV9FWEVdLFxyXG4gICAgICBzaGVsbDogdHJ1ZSxcclxuICAgICAgZXhjbHVzaXZlOiB0cnVlLFxyXG4gICAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgICAgZGVmYXVsdFByaW1hcnk6IHRydWUsXHJcbiAgICB9XHJcbiAgXTtcclxuICBwdWJsaWMgbWVyZ2VNb2RzOiBib29sZWFuID0gdHJ1ZTtcclxuICBwdWJsaWMgcmVxdWlyZXNDbGVhbnVwOiBib29sZWFuID0gdHJ1ZTtcclxuICBwdWJsaWMgc2hlbGw6IGJvb2xlYW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xyXG4gIHB1YmxpYyBkZWZhdWx0UGF0aHM6IHN0cmluZ1tdO1xyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogVm9ydGV4IEFQSVxyXG4gICoqKioqKioqKi9cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3QgYW4gaW5zdGFuY2UuXHJcbiAgICogQHBhcmFtIHtJRXh0ZW5zaW9uQ29udGV4dH0gY29udGV4dCAtLSBUaGUgVm9ydGV4IGV4dGVuc2lvbiBjb250ZXh0LlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgICAvLyBwcm9wZXJ0aWVzIHVzZWQgYnkgVm9ydGV4XHJcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgdGhpcy5yZXF1aXJlZEZpbGVzID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInXHJcbiAgICAgID8gWydTdGFyZGV3IFZhbGxleS5leGUnXVxyXG4gICAgICA6IFsnU3RhcmRld1ZhbGxleScsICdTdGFyZGV3VmFsbGV5LmV4ZSddO1xyXG5cclxuICAgIC8vIGN1c3RvbSBwcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmRlZmF1bHRQYXRocyA9IFtcclxuICAgICAgLy8gTGludXhcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvR09HIEdhbWVzL1N0YXJkZXcgVmFsbGV5L2dhbWUnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy8ubG9jYWwvc2hhcmUvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleScsXHJcblxyXG4gICAgICAvLyBNYWNcclxuICAgICAgJy9BcHBsaWNhdGlvbnMvU3RhcmRldyBWYWxsZXkuYXBwL0NvbnRlbnRzL01hY09TJyxcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0L1N0ZWFtL3N0ZWFtYXBwcy9jb21tb24vU3RhcmRldyBWYWxsZXkvQ29udGVudHMvTWFjT1MnLFxyXG5cclxuICAgICAgLy8gV2luZG93c1xyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxHYWxheHlDbGllbnRcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxHT0cgR2FsYXh5XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcU3RlYW1cXFxcc3RlYW1hcHBzXFxcXGNvbW1vblxcXFxTdGFyZGV3IFZhbGxleSdcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBc3luY2hyb25vdXNseSBmaW5kIHRoZSBnYW1lIGluc3RhbGwgcGF0aC5cclxuICAgKlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBxdWlja2x5IGFuZCwgaWYgaXQgcmV0dXJucyBhIHZhbHVlLCBpdCBzaG91bGQgZGVmaW5pdGl2ZWx5IGJlIHRoZVxyXG4gICAqIHZhbGlkIGdhbWUgcGF0aC4gVXN1YWxseSB0aGlzIGZ1bmN0aW9uIHdpbGwgcXVlcnkgdGhlIHBhdGggZnJvbSB0aGUgcmVnaXN0cnkgb3IgZnJvbSBzdGVhbS5cclxuICAgKiBUaGlzIGZ1bmN0aW9uIG1heSByZXR1cm4gYSBwcm9taXNlIGFuZCBpdCBzaG91bGQgZG8gdGhhdCBpZiBpdCdzIGRvaW5nIEkvTy5cclxuICAgKlxyXG4gICAqIFRoaXMgbWF5IGJlIGxlZnQgdW5kZWZpbmVkIGJ1dCB0aGVuIHRoZSB0b29sL2dhbWUgY2FuIG9ubHkgYmUgZGlzY292ZXJlZCBieSBzZWFyY2hpbmcgdGhlIGRpc2tcclxuICAgKiB3aGljaCBpcyBzbG93IGFuZCBvbmx5IGhhcHBlbnMgbWFudWFsbHkuXHJcbiAgICovXHJcbiAgcHVibGljIHF1ZXJ5UGF0aCA9IHRvQmx1ZShhc3luYyAoKSA9PiB7XHJcbiAgICAvLyBjaGVjayBTdGVhbVxyXG4gICAgY29uc3QgZ2FtZSA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFsnNDEzMTUwJywgJzE0NTMzNzUyNTMnXSk7XHJcbiAgICBpZiAoZ2FtZSlcclxuICAgICAgcmV0dXJuIGdhbWUuZ2FtZVBhdGg7XHJcblxyXG4gICAgLy8gY2hlY2sgZGVmYXVsdCBwYXRoc1xyXG4gICAgZm9yIChjb25zdCBkZWZhdWx0UGF0aCBvZiB0aGlzLmRlZmF1bHRQYXRocylcclxuICAgIHtcclxuICAgICAgaWYgKGF3YWl0IHRoaXMuZ2V0UGF0aEV4aXN0c0FzeW5jKGRlZmF1bHRQYXRoKSlcclxuICAgICAgICByZXR1cm4gZGVmYXVsdFBhdGg7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgcGF0aCBvZiB0aGUgdG9vbCBleGVjdXRhYmxlIHJlbGF0aXZlIHRvIHRoZSB0b29sIGJhc2UgcGF0aCwgaS5lLiBiaW5hcmllcy9VVDMuZXhlIG9yXHJcbiAgICogVEVTVi5leGUuIFRoaXMgaXMgYSBmdW5jdGlvbiBzbyB0aGF0IHlvdSBjYW4gcmV0dXJuIGRpZmZlcmVudCB0aGluZ3MgYmFzZWQgb24gdGhlIG9wZXJhdGluZ1xyXG4gICAqIHN5c3RlbSBmb3IgZXhhbXBsZSBidXQgYmUgYXdhcmUgdGhhdCBpdCB3aWxsIGJlIGV2YWx1YXRlZCBhdCBhcHBsaWNhdGlvbiBzdGFydCBhbmQgb25seSBvbmNlLFxyXG4gICAqIHNvIHRoZSByZXR1cm4gdmFsdWUgY2FuIG5vdCBkZXBlbmQgb24gdGhpbmdzIHRoYXQgY2hhbmdlIGF0IHJ1bnRpbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGV4ZWN1dGFibGUoKSB7XHJcbiAgICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInXHJcbiAgICAgID8gJ1N0YXJkZXcgVmFsbGV5LmV4ZSdcclxuICAgICAgOiAnU3RhcmRld1ZhbGxleSc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGRlZmF1bHQgZGlyZWN0b3J5IHdoZXJlIG1vZHMgZm9yIHRoaXMgZ2FtZSBzaG91bGQgYmUgc3RvcmVkLlxyXG4gICAqIFxyXG4gICAqIElmIHRoaXMgcmV0dXJucyBhIHJlbGF0aXZlIHBhdGggdGhlbiB0aGUgcGF0aCBpcyB0cmVhdGVkIGFzIHJlbGF0aXZlIHRvIHRoZSBnYW1lIGluc3RhbGxhdGlvblxyXG4gICAqIGRpcmVjdG9yeS4gU2ltcGx5IHJldHVybiBhIGRvdCAoICgpID0+ICcuJyApIGlmIG1vZHMgYXJlIGluc3RhbGxlZCBkaXJlY3RseSBpbnRvIHRoZSBnYW1lXHJcbiAgICogZGlyZWN0b3J5LlxyXG4gICAqLyBcclxuICBwdWJsaWMgcXVlcnlNb2RQYXRoKClcclxuICB7XHJcbiAgICByZXR1cm4gJ01vZHMnO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3B0aW9uYWwgc2V0dXAgZnVuY3Rpb24uIElmIHRoaXMgZ2FtZSByZXF1aXJlcyBzb21lIGZvcm0gb2Ygc2V0dXAgYmVmb3JlIGl0IGNhbiBiZSBtb2RkZWQgKGxpa2VcclxuICAgKiBjcmVhdGluZyBhIGRpcmVjdG9yeSwgY2hhbmdpbmcgYSByZWdpc3RyeSBrZXksIC4uLikgZG8gaXQgaGVyZS4gSXQgd2lsbCBiZSBjYWxsZWQgZXZlcnkgdGltZVxyXG4gICAqIGJlZm9yZSB0aGUgZ2FtZSBtb2RlIGlzIGFjdGl2YXRlZC5cclxuICAgKiBAcGFyYW0ge0lEaXNjb3ZlcnlSZXN1bHR9IGRpc2NvdmVyeSAtLSBiYXNpYyBpbmZvIGFib3V0IHRoZSBnYW1lIGJlaW5nIGxvYWRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0dXAgPSB0b0JsdWUoYXN5bmMgKGRpc2NvdmVyeSkgPT4ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBmb2xkZXIgZm9yIFNNQVBJIG1vZHMgZXhpc3RzLlxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gICAgLy8gc2tpcCBpZiBTTUFQSSBmb3VuZFxyXG4gICAgY29uc3Qgc21hcGlQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBTTUFQSV9FWEUpO1xyXG4gICAgY29uc3Qgc21hcGlGb3VuZCA9IGF3YWl0IHRoaXMuZ2V0UGF0aEV4aXN0c0FzeW5jKHNtYXBpUGF0aCk7XHJcbiAgICBpZiAoc21hcGlGb3VuZClcclxuICAgICAgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKHRoaXMuY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgdGl0bGUgPSBzbWFwaU1vZCA/ICdTTUFQSSBpcyBub3QgZGVwbG95ZWQnIDogJ1NNQVBJIGlzIG5vdCBpbnN0YWxsZWQnO1xyXG4gICAgY29uc3QgYWN0aW9uVGl0bGUgPSBzbWFwaU1vZCA/ICdEZXBsb3knIDogJ0dldCBTTUFQSSc7XHJcbiAgICBjb25zdCBhY3Rpb24gPSAoKSA9PiAoc21hcGlNb2RcclxuICAgICAgPyBkZXBsb3lTTUFQSSh0aGlzLmNvbnRleHQuYXBpKVxyXG4gICAgICA6IGRvd25sb2FkU01BUEkodGhpcy5jb250ZXh0LmFwaSkpXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpKTtcclxuXHJcbiAgICB0aGlzLmNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ3NtYXBpLW1pc3NpbmcnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBtZXNzYWdlOiAnU01BUEkgaXMgcmVxdWlyZWQgdG8gbW9kIFN0YXJkZXcgVmFsbGV5LicsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogYWN0aW9uVGl0bGUsXHJcbiAgICAgICAgICBhY3Rpb24sXHJcbiAgICAgICAgfSxcclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogSW50ZXJuYWwgbWV0aG9kc1xyXG4gICoqKioqKioqKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgY2hlY2sgd2hldGhlciBhIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGggZXhpc3RzLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gVGhlIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGguXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0UGF0aEV4aXN0c0FzeW5jKHBhdGgpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aCk7XHJcbiAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBjYXRjaChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgcmVhZCBhIHJlZ2lzdHJ5IGtleSB2YWx1ZS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGl2ZSAtIFRoZSByZWdpc3RyeSBoaXZlIHRvIGFjY2Vzcy4gVGhpcyBzaG91bGQgYmUgYSBjb25zdGFudCBsaWtlIFJlZ2lzdHJ5LkhLTE0uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIFRoZSByZWdpc3RyeSBrZXkuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdG8gcmVhZC5cclxuICAgKi9cclxuICBhc3luYyByZWFkUmVnaXN0cnlLZXlBc3luYyhoaXZlLCBrZXksIG5hbWUpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoaGl2ZSwga2V5LCBuYW1lKTtcclxuICAgICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RGb2xkZXIoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIFdlIGFzc3VtZSB0aGF0IGFueSBtb2QgY29udGFpbmluZyBcIi9Db250ZW50L1wiIGluIGl0cyBkaXJlY3RvcnlcclxuICAvLyAgc3RydWN0dXJlIGlzIG1lYW50IHRvIGJlIGRlcGxveWVkIHRvIHRoZSByb290IGZvbGRlci5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpKTtcclxuICBjb25zdCBjb250ZW50RGlyID0gZmlsdGVyZWQuZmluZChmaWxlID0+IGZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoY29udGVudERpciAhPT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RGb2xkZXIoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFdlJ3JlIGdvaW5nIHRvIGRlcGxveSBcIi9Db250ZW50L1wiIGFuZCB3aGF0ZXZlciBmb2xkZXJzIGNvbWUgYWxvbmdzaWRlIGl0LlxyXG4gIC8vICBpLmUuIFNvbWVNb2QuN3pcclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Db250ZW50L1xyXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL01vZHMvXHJcbiAgLy8gIFdpbGwgTk9UIGJlIGRlcGxveWVkID0+IC4uL1JlYWRtZS5kb2NcclxuICBjb25zdCBjb250ZW50RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICBjb25zdCBpZHggPSBjb250ZW50RmlsZS5pbmRleE9mKFBUUk5fQ09OVEVOVCkgKyAxO1xyXG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLmJhc2VuYW1lKGNvbnRlbnRGaWxlLnN1YnN0cmluZygwLCBpZHgpKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKVxyXG4gICAgJiYgKGZpbGUuaW5kZXhPZihyb290RGlyKSAhPT0gLTEpXHJcbiAgICAmJiAocGF0aC5leHRuYW1lKGZpbGUpICE9PSAnLnR4dCcpKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc3Vic3RyKGlkeCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KGZpbGVQYXRoKSB7XHJcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICBjb25zdCBpc01hbmlmZXN0RmlsZSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID09PSBNQU5JRkVTVF9GSUxFO1xyXG4gIGNvbnN0IGlzTG9jYWxlID0gc2VnbWVudHMuaW5jbHVkZXMoJ2xvY2FsZScpO1xyXG4gIHJldHVybiBpc01hbmlmZXN0RmlsZSAmJiAhaXNMb2NhbGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWQoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChpc1ZhbGlkTWFuaWZlc3QpICE9PSB1bmRlZmluZWQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgICAgLy8gV2UgY3JlYXRlIGEgcHJlZml4IGZha2UgZGlyZWN0b3J5IGp1c3QgaW4gY2FzZSB0aGUgY29udGVudFxyXG4gICAgICAvLyAgZm9sZGVyIGlzIGluIHRoZSBhcmNoaXZlJ3Mgcm9vdCBmb2xkZXIuIFRoaXMgaXMgdG8gZW5zdXJlIHdlXHJcbiAgICAgIC8vICBmaW5kIGEgbWF0Y2ggZm9yIFwiL0NvbnRlbnQvXCJcclxuICAgICAgY29uc3QgdGVzdEZpbGUgPSBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKTtcclxuICAgICAgcmV0dXJuICh0ZXN0RmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICAgIH0pID09PSB1bmRlZmluZWQpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbChhcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeU1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gVGhlIGFyY2hpdmUgbWF5IGNvbnRhaW4gbXVsdGlwbGUgbWFuaWZlc3QgZmlsZXMgd2hpY2ggd291bGRcclxuICAvLyAgaW1wbHkgdGhhdCB3ZSdyZSBpbnN0YWxsaW5nIG11bHRpcGxlIG1vZHMuXHJcbiAgY29uc3QgbWFuaWZlc3RGaWxlcyA9IGZpbGVzLmZpbHRlcihpc1ZhbGlkTWFuaWZlc3QpO1xyXG5cclxuICBpbnRlcmZhY2UgSU1vZEluZm8ge1xyXG4gICAgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdDtcclxuICAgIHJvb3RGb2xkZXI6IHN0cmluZztcclxuICAgIG1hbmlmZXN0SW5kZXg6IG51bWJlcjtcclxuICAgIG1vZEZpbGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGF3YWl0IGRlcGVuZGVuY3lNYW5hZ2VyLnNjYW5NYW5pZmVzdHModHJ1ZSk7XHJcbiAgY29uc3QgbW9kczogSU1vZEluZm9bXSA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0RmlsZXMubWFwKGFzeW5jIG1hbmlmZXN0RmlsZSA9PiB7XHJcbiAgICBjb25zdCByb290Rm9sZGVyID0gcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdEluZGV4ID0gbWFuaWZlc3RGaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihNQU5JRkVTVF9GSUxFKTtcclxuICAgIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZSkgPT4gKHJvb3RGb2xkZXIgIT09ICcuJylcclxuICAgICAgPyAoKGZpbGUuaW5kZXhPZihyb290Rm9sZGVyKSAhPT0gLTEpXHJcbiAgICAgICAgJiYgKHBhdGguZGlybmFtZShmaWxlKSAhPT0gJy4nKVxyXG4gICAgICAgICYmICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgICAgOiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCk7XHJcbiAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID0gYXdhaXQgcGFyc2VNYW5pZmVzdChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtYW5pZmVzdEZpbGUpKTtcclxuICAgIGNvbnN0IG1vZEZpbGVzID0gZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbWFuaWZlc3QsXHJcbiAgICAgIHJvb3RGb2xkZXIsXHJcbiAgICAgIG1hbmlmZXN0SW5kZXgsXHJcbiAgICAgIG1vZEZpbGVzLFxyXG4gICAgfTtcclxuICB9KSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5tYXAobW9kcywgbW9kID0+IHtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSAobW9kLnJvb3RGb2xkZXIgIT09ICcuJylcclxuICAgICAgPyBtb2Qucm9vdEZvbGRlclxyXG4gICAgICA6IG1vZC5tYW5pZmVzdC5OYW1lO1xyXG5cclxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1vZC5tYW5pZmVzdC5EZXBlbmRlbmNpZXMgfHwgW107XHJcblxyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBtb2QubW9kRmlsZXMpIHtcclxuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4obW9kTmFtZSwgZmlsZS5zdWJzdHIobW9kLm1hbmlmZXN0SW5kZXgpKTtcclxuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhZGRSdWxlRm9yRGVwZW5kZW5jeSA9IChkZXA6IElTRFZEZXBlbmRlbmN5KSA9PiB7XHJcbiAgICAgIGNvbnN0IHZlcnNpb25NYXRjaCA9IGRlcC5NaW5pbXVtVmVyc2lvbiAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgPyBgPj0ke2RlcC5NaW5pbXVtVmVyc2lvbn1gXHJcbiAgICAgICAgOiAnKic7XHJcbiAgICAgIGNvbnN0IHJ1bGU6IHR5cGVzLklNb2RSdWxlID0ge1xyXG4gICAgICAgIHR5cGU6IChkZXAuSXNSZXF1aXJlZCA/PyB0cnVlKSA/ICdyZXF1aXJlcycgOiAncmVjb21tZW5kcycsXHJcbiAgICAgICAgcmVmZXJlbmNlOiB7XHJcbiAgICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgdmVyc2lvbk1hdGNoLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXh0cmE6IHtcclxuICAgICAgICAgIG9ubHlJZkZ1bGZpbGxhYmxlOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH07XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAncnVsZScsXHJcbiAgICAgICAgcnVsZSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KGRlcCk7XHJcbiAgICB9XHJcbiAgICBpZiAobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3kobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yKTtcclxuICAgIH1cclxuICAgIHJldHVybiBpbnN0cnVjdGlvbnM7XHJcbiAgfSlcclxuICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBbXS5jb25jYXQoZGF0YSkucmVkdWNlKChhY2N1bSwgaXRlcikgPT4gYWNjdW0uY29uY2F0KGl0ZXIpLCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNTTUFQSU1vZFR5cGUoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuXHJcbiAgY29uc3Qgc21hcGlEYXRhID0gaW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdCA9PiAoaW5zdC50eXBlID09PSAnY29weScpICYmIGluc3Quc291cmNlLmVuZHNXaXRoKFNNQVBJX0VYRSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShzbWFwaURhdGEgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTTUFQSShmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBkb3dubG9hZCBjb250YWlucyB0aGUgU01BUEkgZGF0YSBhcmNoaXZlLnNcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBTTUFQSV9ETEwpICE9PSB1bmRlZmluZWQpXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgICBzdXBwb3J0ZWQsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IGZvbGRlciA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMidcclxuICAgID8gJ3dpbmRvd3MnXHJcbiAgICA6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCdcclxuICAgICAgPyAnbGludXgnXHJcbiAgICAgIDogJ21hY29zJztcclxuICBjb25zdCBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtID0gKGZpbGUpID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICByZXR1cm4gKHNlZ21lbnRzLmluY2x1ZGVzKGZvbGRlcikpO1xyXG4gIH1cclxuICAvLyBGaW5kIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmVcclxuICBjb25zdCBkYXRhRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBpc0NvcnJlY3RQbGF0Zm9ybSA9IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0oZmlsZSk7XHJcbiAgICByZXR1cm4gaXNDb3JyZWN0UGxhdGZvcm0gJiYgU01BUElfREFUQS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpXHJcbiAgfSk7XHJcbiAgaWYgKGRhdGFGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIGZpbmQgdGhlIFNNQVBJIGRhdGEgZmlsZXMgLSBkb3dubG9hZCBhcHBlYXJzICdcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgbGV0IGRhdGEgPSAnJztcclxuICB0cnkge1xyXG4gICAgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgJ1N0YXJkZXcgVmFsbGV5LmRlcHMuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBTRFYgZGVwZW5kZW5jaWVzJywgZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIGZpbGUgd2lsbCBiZSBvdXRkYXRlZCBhZnRlciB0aGUgd2FsayBvcGVyYXRpb24gc28gcHJlcGFyZSBhIHJlcGxhY2VtZW50LiBcclxuICBjb25zdCB1cGRhdGVkRmlsZXMgPSBbXTtcclxuXHJcbiAgY29uc3Qgc3ppcCA9IG5ldyBTZXZlblppcCgpO1xyXG4gIC8vIFVuemlwIHRoZSBmaWxlcyBmcm9tIHRoZSBkYXRhIGFyY2hpdmUuIFRoaXMgZG9lc24ndCBzZWVtIHRvIGJlaGF2ZSBhcyBkZXNjcmliZWQgaGVyZTogaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvbm9kZS03eiNldmVudHNcclxuICBhd2FpdCBzemlwLmV4dHJhY3RGdWxsKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGRhdGFGaWxlKSwgZGVzdGluYXRpb25QYXRoKTtcclxuXHJcbiAgLy8gRmluZCBhbnkgZmlsZXMgdGhhdCBhcmUgbm90IGluIHRoZSBwYXJlbnQgZm9sZGVyLiBcclxuICBhd2FpdCB1dGlsLndhbGsoZGVzdGluYXRpb25QYXRoLCAoaXRlciwgc3RhdHMpID0+IHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGVzdGluYXRpb25QYXRoLCBpdGVyKTtcclxuICAgICAgLy8gRmlsdGVyIG91dCBmaWxlcyBmcm9tIHRoZSBvcmlnaW5hbCBpbnN0YWxsIGFzIHRoZXkncmUgbm8gbG9uZ2VyIHJlcXVpcmVkLlxyXG4gICAgICBpZiAoIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgpICYmIHN0YXRzLmlzRmlsZSgpICYmICFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoK3BhdGguc2VwKSkgdXBkYXRlZEZpbGVzLnB1c2gocmVsUGF0aCk7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gcmVsUGF0aC50b0xvY2FsZUxvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgY29uc3QgbW9kc0ZvbGRlcklkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgICAgaWYgKChtb2RzRm9sZGVySWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNGb2xkZXJJZHggKyAxKSkge1xyXG4gICAgICAgIF9TTUFQSV9CVU5ETEVEX01PRFMucHVzaChzZWdtZW50c1ttb2RzRm9sZGVySWR4ICsgMV0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGV4ZSBmaWxlLiBcclxuICBjb25zdCBzbWFwaUV4ZSA9IHVwZGF0ZWRGaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKFNNQVBJX0VYRS50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgaWYgKHNtYXBpRXhlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChgRmFpbGVkIHRvIGV4dHJhY3QgJHtTTUFQSV9FWEV9IC0gZG93bmxvYWQgYXBwZWFycyBgXHJcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XHJcbiAgfVxyXG4gIGNvbnN0IGlkeCA9IHNtYXBpRXhlLmluZGV4T2YocGF0aC5iYXNlbmFtZShzbWFwaUV4ZSkpO1xyXG5cclxuICAvLyBCdWlsZCB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBpbnN0YWxsYXRpb24uIFxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSB1cGRhdGVkRmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihmaWxlLnN1YnN0cihpZHgpKSxcclxuICAgICAgfVxyXG4gIH0pO1xyXG5cclxuICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgIGtleTogJ3NtYXBpQnVuZGxlZE1vZHMnLFxyXG4gICAgdmFsdWU6IGdldEJ1bmRsZWRNb2RzKCksXHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdnZW5lcmF0ZWZpbGUnLFxyXG4gICAgZGF0YSxcclxuICAgIGRlc3RpbmF0aW9uOiAnU3RhcmRld01vZGRpbmdBUEkuZGVwcy5qc29uJyxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIGxvZ0ZpbGUpIHtcclxuICBjb25zdCBsb2dEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsIGxvZ0ZpbGUpLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xyXG4gIGF3YWl0IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1NNQVBJIExvZycsIHtcclxuICAgIHRleHQ6ICdZb3VyIFNNQVBJIGxvZyBpcyBkaXNwbGF5ZWQgYmVsb3cuIFRvIHNoYXJlIGl0LCBjbGljayBcIkNvcHkgJiBTaGFyZVwiIHdoaWNoIHdpbGwgY29weSBpdCB0byB5b3VyIGNsaXBib2FyZCBhbmQgb3BlbiB0aGUgU01BUEkgbG9nIHNoYXJpbmcgd2Vic2l0ZS4gJyArXHJcbiAgICAgICdOZXh0LCBwYXN0ZSB5b3VyIGNvZGUgaW50byB0aGUgdGV4dCBib3ggYW5kIHByZXNzIFwic2F2ZSAmIHBhcnNlIGxvZ1wiLiBZb3UgY2FuIG5vdyBzaGFyZSBhIGxpbmsgdG8gdGhpcyBwYWdlIHdpdGggb3RoZXJzIHNvIHRoZXkgY2FuIHNlZSB5b3VyIGxvZyBmaWxlLlxcblxcbicgKyBsb2dEYXRhXHJcbiAgfSwgW3tcclxuICAgIGxhYmVsOiAnQ29weSAmIFNoYXJlIGxvZycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvXi4rVChbXlxcLl0rKS4rLywgJyQxJyk7XHJcbiAgICAgIGNsaXBib2FyZC53cml0ZVRleHQoYFske3RpbWVzdGFtcH0gSU5GTyBWb3J0ZXhdIExvZyBleHBvcnRlZCBieSBWb3J0ZXggJHt1dGlsLmdldEFwcGxpY2F0aW9uKCkudmVyc2lvbn0uXFxuYCArIGxvZ0RhdGEpO1xyXG4gICAgICByZXR1cm4gdXRpbC5vcG4oJ2h0dHBzOi8vc21hcGkuaW8vbG9nJykuY2F0Y2goZXJyID0+IHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgfSwgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiB1bmRlZmluZWQgfV0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvblNob3dTTUFQSUxvZyhhcGkpIHtcclxuICAvL1JlYWQgYW5kIGRpc3BsYXkgdGhlIGxvZy5cclxuICBjb25zdCBiYXNlUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJ3N0YXJkZXd2YWxsZXknLCAnZXJyb3Jsb2dzJyk7XHJcbiAgdHJ5IHtcclxuICAgIC8vSWYgdGhlIGNyYXNoIGxvZyBleGlzdHMsIHNob3cgdGhhdC5cclxuICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWNyYXNoLnR4dFwiKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vT3RoZXJ3aXNlIHNob3cgdGhlIG5vcm1hbCBsb2cuXHJcbiAgICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWxhdGVzdC50eHRcIik7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy9PciBJbmZvcm0gdGhlIHVzZXIgdGhlcmUgYXJlIG5vIGxvZ3MuXHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHsgdHlwZTogJ2luZm8nLCB0aXRsZTogJ05vIFNNQVBJIGxvZ3MgZm91bmQuJywgbWVzc2FnZTogJycsIGRpc3BsYXlNUzogNTAwMCB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGNvbnN0IG1hbmlmZXN0czogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgaWYgKG1vZFBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdHVyYm93YWxrKG1vZFBhdGgsIGFzeW5jIGVudHJpZXMgPT4ge1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gJ21hbmlmZXN0Lmpzb24nKSB7XHJcbiAgICAgICAgbWFuaWZlc3RzLnB1c2goZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgeyBza2lwSGlkZGVuOiBmYWxzZSwgcmVjdXJzZTogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXHJcbiAgICAudGhlbigoKSA9PiBtYW5pZmVzdHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVDb25mbGljdEluZm8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcGk6IFNNQVBJUHJveHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkOiBzdHJpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IG1vZCA9IGFwaS5nZXRTdGF0ZSgpLnBlcnNpc3RlbnQubW9kc1tnYW1lSWRdW21vZElkXTtcclxuXHJcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgaWYgKChub3cgLSBtb2QuYXR0cmlidXRlcz8ubGFzdFNNQVBJUXVlcnkgPz8gMCkgPCBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGxldCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IG1vZC5hdHRyaWJ1dGVzPy5hZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcztcclxuICBpZiAoIWFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzKSB7XHJcbiAgICBpZiAobW9kLmF0dHJpYnV0ZXM/LmxvZ2ljYWxGaWxlTmFtZSkge1xyXG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFttb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBxdWVyeSA9IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzXHJcbiAgICAubWFwKG5hbWUgPT4ge1xyXG4gICAgICBjb25zdCByZXMgPSB7XHJcbiAgICAgICAgaWQ6IG5hbWUsXHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IHZlciA9IG1vZC5hdHRyaWJ1dGVzPy5tYW5pZmVzdFZlcnNpb25cclxuICAgICAgICAgICAgICAgICAgICAgPz8gc2VtdmVyLmNvZXJjZShtb2QuYXR0cmlidXRlcz8udmVyc2lvbik/LnZlcnNpb247XHJcbiAgICAgIGlmICghIXZlcikge1xyXG4gICAgICAgIHJlc1snaW5zdGFsbGVkVmVyc2lvbiddID0gdmVyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHN0YXQgPSAoaXRlbTogSVNNQVBJUmVzdWx0KTogQ29tcGF0aWJpbGl0eVN0YXR1cyA9PiB7XHJcbiAgICBjb25zdCBzdGF0dXMgPSBpdGVtLm1ldGFkYXRhPy5jb21wYXRpYmlsaXR5U3RhdHVzPy50b0xvd2VyQ2FzZT8uKCk7XHJcbiAgICBpZiAoIWNvbXBhdGliaWxpdHlPcHRpb25zLmluY2x1ZGVzKHN0YXR1cyBhcyBhbnkpKSB7XHJcbiAgICAgIHJldHVybiAndW5rbm93bic7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc3RhdHVzIGFzIENvbXBhdGliaWxpdHlTdGF0dXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgY29tcGF0aWJpbGl0eVByaW8gPSAoaXRlbTogSVNNQVBJUmVzdWx0KSA9PiBjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmRleE9mKHN0YXQoaXRlbSkpO1xyXG5cclxuICByZXR1cm4gc21hcGkuZmluZEJ5TmFtZXMocXVlcnkpXHJcbiAgICAudGhlbihyZXN1bHRzID0+IHtcclxuICAgICAgY29uc3Qgd29yc3RTdGF0dXM6IElTTUFQSVJlc3VsdFtdID0gcmVzdWx0c1xyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gY29tcGF0aWJpbGl0eVByaW8obGhzKSAtIGNvbXBhdGliaWxpdHlQcmlvKHJocykpO1xyXG4gICAgICBpZiAod29yc3RTdGF0dXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZXMoZ2FtZUlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgbGFzdFNNQVBJUXVlcnk6IG5vdyxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlTdGF0dXM6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5TWVzc2FnZTogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN1bW1hcnksXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5VXBkYXRlOiB3b3JzdFN0YXR1c1swXS5zdWdnZXN0ZWRVcGRhdGU/LnZlcnNpb24sXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvZygnZGVidWcnLCAnbm8gbWFuaWZlc3QnKTtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCd3YXJuJywgJ2Vycm9yIHJlYWRpbmcgbWFuaWZlc3QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgbGV0IGRlcGVuZGVuY3lNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcjtcclxuICBjb25zdCBnZXREaXNjb3ZlcnlQYXRoID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXHJcbiAgICAgIGxvZygnZXJyb3InLCAnc3RhcmRld3ZhbGxleSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfVxyXG5cclxuICBjb25zdCBnZXRTTUFQSVBhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9O1xyXG5cclxuICBjb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcclxuICAgIGlmIChtb2Q/LmlkID09PSB1bmRlZmluZWQgfHwgbW9kLnR5cGUgPT09ICdzZHZyb290Zm9sZGVyJykge1xyXG4gICAgICAvLyBUaGVyZSBpcyBubyByZWxpYWJsZSB3YXkgdG8gYXNjZXJ0YWluIHdoZXRoZXIgYSBuZXcgZmlsZSBlbnRyeVxyXG4gICAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcclxuICAgICAgLy8gIGFzIHJlcGxhY2VtZW50IG1vZHMuIFRoaXMgb2J2aW91c2x5IG1lYW5zIHRoYXQgaWYgdGhlIGdhbWUgaGFzXHJcbiAgICAgIC8vICBhIHN1YnN0YW50aWFsIHVwZGF0ZSB3aGljaCBpbnRyb2R1Y2VzIG5ldyBmaWxlcyB3ZSBjb3VsZCBwb3RlbnRpYWxseVxyXG4gICAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxyXG4gICAgICAvLyAgY29udGVudGlvbiBiZXR3ZWVuIHRoZSBnYW1lIGl0c2VsZiAod2hlbiBpdCB1cGRhdGVzKSBhbmQgdGhlIG1vZC5cclxuICAgICAgLy9cclxuICAgICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXHJcbiAgICAgIC8vICBtb2RzLCB3aGljaCBpcyB3aHkgaXQncyBub3Qgc2FmZSB0byBhc3N1bWUgdGhhdCBhbnkgYWRkaXRpb24gaW5zaWRlIHRoZVxyXG4gICAgICAvLyAgbW9kcyBkaXJlY3RvcnkgY2FuIGJlIHNhZmVseSBhZGRlZCB0byB0aGlzIG1vZCdzIHN0YWdpbmcgZm9sZGVyIGVpdGhlci5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChtb2QudHlwZSAhPT0gJ1NNQVBJJykge1xyXG4gICAgICAvLyBPdGhlciBtb2QgdHlwZXMgZG8gbm90IHJlcXVpcmUgZnVydGhlciB2YWxpZGF0aW9uIC0gaXQgc2hvdWxkIGJlIGZpbmVcclxuICAgICAgLy8gIHRvIGFkZCB0aGlzIGVudHJ5LlxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgY29uc3QgbW9kc1NlZ0lkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgIGNvbnN0IG1vZEZvbGRlck5hbWUgPSAoKG1vZHNTZWdJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc1NlZ0lkeCArIDEpKVxyXG4gICAgICA/IHNlZ21lbnRzW21vZHNTZWdJZHggKyAxXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICBsZXQgYnVuZGxlZE1vZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnc21hcGlCdW5kbGVkTW9kcyddLCBbXSk7XHJcbiAgICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XHJcbiAgICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ2NvbnRlbnQnKSkge1xyXG4gICAgICAvLyBTTUFQSSBpcyBub3Qgc3VwcG9zZWQgdG8gb3ZlcndyaXRlIHRoZSBnYW1lJ3MgY29udGVudCBkaXJlY3RseS5cclxuICAgICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKG1vZEZvbGRlck5hbWUgIT09IHVuZGVmaW5lZCkgJiYgYnVuZGxlZE1vZHMuaW5jbHVkZXMobW9kRm9sZGVyTmFtZSk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWFuaWZlc3RFeHRyYWN0b3IgPSB0b0JsdWUoXHJcbiAgICBhc3luYyAobW9kSW5mbzogYW55LCBtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueTsgfT4gPT4ge1xyXG4gICAgICBpZiAoc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aCk7XHJcbiAgICAgIGlmIChtYW5pZmVzdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHBhcnNlZE1hbmlmZXN0cyA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0cy5tYXAoXHJcbiAgICAgICAgYXN5bmMgbWFuID0+IGF3YWl0IHBhcnNlTWFuaWZlc3QobWFuKSkpO1xyXG5cclxuICAgICAgLy8gd2UgY2FuIG9ubHkgdXNlIG9uZSBtYW5pZmVzdCB0byBnZXQgdGhlIGlkIGZyb21cclxuICAgICAgY29uc3QgcmVmTWFuaWZlc3QgPSBwYXJzZWRNYW5pZmVzdHNbMF07XHJcblxyXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSk7XHJcblxyXG4gICAgICBjb25zdCBtaW5TTUFQSVZlcnNpb24gPSBwYXJzZWRNYW5pZmVzdHNcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0Lk1pbmltdW1BcGlWZXJzaW9uKVxyXG4gICAgICAgIC5maWx0ZXIodmVyc2lvbiA9PiBzZW12ZXIudmFsaWQodmVyc2lvbikpXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMsIGxocykpWzBdO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0ge1xyXG4gICAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzLFxyXG4gICAgICAgIG1pblNNQVBJVmVyc2lvbixcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIGRvbid0IHNldCBhIGN1c3RvbSBmaWxlIG5hbWUgZm9yIFNNQVBJXHJcbiAgICAgIGlmIChtb2RJbmZvLmRvd25sb2FkLm1vZEluZm8/Lm5leHVzPy5pZHM/Lm1vZElkICE9PSAyNDAwKSB7XHJcbiAgICAgICAgcmVzdWx0WydjdXN0b21GaWxlTmFtZSddID0gcmVmTWFuaWZlc3QuTmFtZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGVvZihyZWZNYW5pZmVzdC5WZXJzaW9uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXN1bHRbJ21hbmlmZXN0VmVyc2lvbiddID0gcmVmTWFuaWZlc3QuVmVyc2lvbjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBTdGFyZGV3VmFsbGV5KGNvbnRleHQpKTtcclxuICAvLyBSZWdpc3RlciBvdXIgU01BUEkgbW9kIHR5cGUgYW5kIGluc3RhbGxlci4gTm90ZTogVGhpcyBjdXJyZW50bHkgZmxhZ3MgYW4gZXJyb3IgaW4gVm9ydGV4IG9uIGluc3RhbGxpbmcgY29ycmVjdGx5LlxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NtYXBpLWluc3RhbGxlcicsIDMwLCB0ZXN0U01BUEksIChmaWxlcywgZGVzdCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3QpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ1NNQVBJJywgMzAsIGdhbWVJZCA9PiBnYW1lSWQgPT09IEdBTUVfSUQsIGdldFNNQVBJUGF0aCwgaXNTTUFQSU1vZFR5cGUpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3N0YXJkZXctdmFsbGV5LWluc3RhbGxlcicsIDUwLCB0ZXN0U3VwcG9ydGVkLFxyXG4gICAgKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2R2cm9vdGZvbGRlcicsIDUwLCB0ZXN0Um9vdEZvbGRlciwgaW5zdGFsbFJvb3RGb2xkZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdzZHZyb290Zm9sZGVyJywgMjUsIChnYW1lSWQpID0+IChnYW1lSWQgPT09IEdBTUVfSUQpLFxyXG4gICAgKCkgPT4gZ2V0RGlzY292ZXJ5UGF0aCgpLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XHJcbiAgICAgIC8vIE9ubHkgaW50ZXJlc3RlZCBpbiBjb3B5IGluc3RydWN0aW9ucy5cclxuICAgICAgY29uc3QgY29weUluc3RydWN0aW9ucyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gaW5zdHIudHlwZSA9PT0gJ2NvcHknKTtcclxuICAgICAgLy8gVGhpcyBpcyBhIHRyaWNreSBwYXR0ZXJuIHNvIHdlJ3JlIGdvaW5nIHRvIDFzdCBwcmVzZW50IHRoZSBkaWZmZXJlbnQgcGFja2FnaW5nXHJcbiAgICAgIC8vICBwYXR0ZXJucyB3ZSBuZWVkIHRvIGNhdGVyIGZvcjpcclxuICAgICAgLy8gIDEuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlci4gRG9lcyBub3QgcmVxdWlyZSBTTUFQSSBzbyBub1xyXG4gICAgICAvLyAgICBtYW5pZmVzdCBmaWxlcyBhcmUgaW5jbHVkZWQuXHJcbiAgICAgIC8vICAyLiBSZXBsYWNlbWVudCBtb2Qgd2l0aCBcIkNvbnRlbnRcIiBmb2xkZXIgKyBvbmUgb3IgbW9yZSBTTUFQSSBtb2RzIGluY2x1ZGVkXHJcbiAgICAgIC8vICAgIGFsb25nc2lkZSB0aGUgQ29udGVudCBmb2xkZXIgaW5zaWRlIGEgXCJNb2RzXCIgZm9sZGVyLlxyXG4gICAgICAvLyAgMy4gQSByZWd1bGFyIFNNQVBJIG1vZCB3aXRoIGEgXCJDb250ZW50XCIgZm9sZGVyIGluc2lkZSB0aGUgbW9kJ3Mgcm9vdCBkaXIuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIHBhdHRlcm4gMTpcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGRvbid0IGhhdmUgbWFuaWZlc3QgZmlsZXNcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGhhdmUgYSBcIkNvbnRlbnRcIiBmb2xkZXJcclxuICAgICAgLy9cclxuICAgICAgLy8gVG8gc29sdmUgcGF0dGVybnMgMiBhbmQgMyB3ZSdyZSBnb2luZyB0bzpcclxuICAgICAgLy8gIENoZWNrIHdoZXRoZXIgd2UgaGF2ZSBhbnkgbWFuaWZlc3QgZmlsZXMsIGlmIHdlIGRvLCB3ZSBleHBlY3QgdGhlIGZvbGxvd2luZ1xyXG4gICAgICAvLyAgICBhcmNoaXZlIHN0cnVjdHVyZSBpbiBvcmRlciBmb3IgdGhlIG1vZFR5cGUgdG8gZnVuY3Rpb24gY29ycmVjdGx5OlxyXG4gICAgICAvLyAgICBhcmNoaXZlLnppcCA9PlxyXG4gICAgICAvLyAgICAgIC4uL0NvbnRlbnQvXHJcbiAgICAgIC8vICAgICAgLi4vTW9kcy9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL0FfU01BUElfTU9EXFxtYW5pZmVzdC5qc29uXHJcbiAgICAgIGNvbnN0IGhhc01hbmlmZXN0ID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uZW5kc1dpdGgoTUFOSUZFU1RfRklMRSkpXHJcbiAgICAgIGNvbnN0IGhhc01vZHNGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5zdGFydHNXaXRoKCdNb2RzJyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgaGFzQ29udGVudEZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ0NvbnRlbnQnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkXHJcblxyXG4gICAgICByZXR1cm4gKGhhc01hbmlmZXN0KVxyXG4gICAgICAgID8gQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyICYmIGhhc01vZHNGb2xkZXIpXHJcbiAgICAgICAgOiBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDk5OSwgJ2NoYW5nZWxvZycsIHt9LCAnU01BUEkgTG9nJyxcclxuICAgICgpID0+IHsgb25TaG93U01BUElMb2coY29udGV4dC5hcGkpOyB9LFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICAvL09ubHkgc2hvdyB0aGUgU01BUEkgbG9nIGJ1dHRvbiBmb3IgU0RWLiBcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcclxuICAgIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQXR0cmlidXRlRXh0cmFjdG9yKDI1LCBtYW5pZmVzdEV4dHJhY3Rvcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJUYWJsZUF0dHJpYnV0ZSgnbW9kcycsIHtcclxuICAgIGlkOiAnc2R2LWNvbXBhdGliaWxpdHknLFxyXG4gICAgcG9zaXRpb246IDEwMCxcclxuICAgIGNvbmRpdGlvbjogKCkgPT4gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSA9PT0gR0FNRV9JRCxcclxuICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcclxuICAgIGNhbGM6IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgY3VzdG9tUmVuZGVyZXI6IChtb2Q6IHR5cGVzLklNb2QsIGRldGFpbENlbGw6IGJvb2xlYW4sIHQ6IHR5cGVzLlRGdW5jdGlvbikgPT4ge1xyXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb21wYXRpYmlsaXR5SWNvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0LCBtb2QsIGRldGFpbENlbGwgfSwgW10pO1xyXG4gICAgfSxcclxuICAgIG5hbWU6ICdDb21wYXRpYmlsaXR5JyxcclxuICAgIGlzRGVmYXVsdFZpc2libGU6IHRydWUsXHJcbiAgICBlZGl0OiB7fSxcclxuICB9KTtcclxuXHJcbiAgLypcclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LW1pc3NpbmctZGVwZW5kZW5jaWVzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiB0ZXN0TWlzc2luZ0RlcGVuZGVuY2llcyhjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKTtcclxuICAqL1xyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtaW5jb21wYXRpYmxlLW1vZHMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdFNNQVBJT3V0ZGF0ZWQoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSkpO1xyXG5cclxuICBpbnRlcmZhY2UgSUFkZGVkRmlsZSB7XHJcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xyXG4gICAgY2FuZGlkYXRlczogc3RyaW5nW107XHJcbiAgfVxyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29uc3QgcHJveHkgPSBuZXcgU01BUElQcm94eShjb250ZXh0LmFwaSk7XHJcbiAgICBjb250ZXh0LmFwaS5zZXRTdHlsZXNoZWV0KCdzZHYnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnc2R2c3R5bGUuc2NzcycpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5hZGRNZXRhU2VydmVyKCdzbWFwaS5pbycsIHtcclxuICAgICAgdXJsOiAnJyxcclxuICAgICAgbG9vcGJhY2tDQjogKHF1ZXJ5OiBJUXVlcnkpID0+IEJsdWViaXJkLnJlc29sdmUocHJveHkuZmluZChxdWVyeSkpLFxyXG4gICAgICBjYWNoZUR1cmF0aW9uU2VjOiA4NjQwMCxcclxuICAgICAgcHJpb3JpdHk6IDI1LFxyXG4gICAgfSk7XHJcbiAgICBkZXBlbmRlbmN5TWFuYWdlciA9IG5ldyBEZXBlbmRlbmN5TWFuYWdlcihjb250ZXh0LmFwaSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzOiBJQWRkZWRGaWxlW10pID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcblxyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIGVudHJ5ID0+IHtcclxuICAgICAgICAvLyBvbmx5IGFjdCBpZiB3ZSBkZWZpbml0aXZlbHkga25vdyB3aGljaCBtb2Qgb3ducyB0aGUgZmlsZVxyXG4gICAgICAgIGlmIChlbnRyeS5jYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLnBlcnNpc3RlbnQubW9kcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbR0FNRV9JRCwgZW50cnkuY2FuZGlkYXRlc1swXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGlmICghaXNNb2RDYW5kaWRhdGVWYWxpZChtb2QsIGVudHJ5KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBmcm9tID0gbW9kUGF0aHNbbW9kLnR5cGUgPz8gJyddO1xyXG4gICAgICAgICAgaWYgKGZyb20gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyBIb3cgaXMgdGhpcyBldmVuIHBvc3NpYmxlPyByZWdhcmRsZXNzIGl0J3Mgbm90IHRoaXNcclxuICAgICAgICAgICAgLy8gIGZ1bmN0aW9uJ3Mgam9iIHRvIHJlcG9ydCB0aGlzLlxyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZXNvbHZlIG1vZCBwYXRoIGZvciBtb2QgdHlwZScsIG1vZC50eXBlKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZnJvbSwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmlkLCByZWxQYXRoKTtcclxuICAgICAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LiBUaGF0IHdheSwgdm9ydGV4IHdpbGxcclxuICAgICAgICAgIC8vIGNyZWF0ZSBhIGxpbmsgdG8gaXQgd2l0aCB0aGUgY29ycmVjdCBkZXBsb3ltZW50IG1ldGhvZCBhbmQgbm90IGFzayB0aGUgdXNlciBhbnkgcXVlc3Rpb25zXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIHRhcmdldFBhdGgpO1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKCFlcnIubWVzc2FnZS5pbmNsdWRlcygnYXJlIHRoZSBzYW1lIGZpbGUnKSkge1xyXG4gICAgICAgICAgICAgIC8vIHNob3VsZCB3ZSBiZSByZXBvcnRpbmcgdGhpcyB0byB0aGUgdXNlcj8gVGhpcyBpcyBhIGNvbXBsZXRlbHlcclxuICAgICAgICAgICAgICAvLyBhdXRvbWF0ZWQgcHJvY2VzcyBhbmQgaWYgaXQgZmFpbHMgbW9yZSBvZnRlbiB0aGFuIG5vdCB0aGVcclxuICAgICAgICAgICAgICAvLyB1c2VyIHByb2JhYmx5IGRvZXNuJ3QgY2FyZVxyXG4gICAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlLWltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QoY29udGV4dC5hcGkpO1xyXG4gICAgICBjb25zdCBwcmltYXJ5VG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdpbnRlcmZhY2UnLCAncHJpbWFyeVRvb2wnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNtYXBpTW9kICYmIHByaW1hcnlUb29sID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsICdzbWFwaScpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSlcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09ICdzbWFwaScpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lSWQsIG1vZElkKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGxvZygnZGVidWcnLCAnYWRkZWQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCB9KSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGxvZygnZGVidWcnLCAndXBkYXRpbmcgU0RWIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZU1vZGVdID8/IHt9KS5tYXAobW9kSWQgPT5cclxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2RvbmUgdXBkYXRpbmcgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHVwZGF0ZSBjb25mbGljdCBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGluaXQ7XHJcbiJdfQ==