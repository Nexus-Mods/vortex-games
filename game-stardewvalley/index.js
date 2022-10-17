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
    if (additionalLogicalFileNames === undefined) {
        if ((_d = mod.attributes) === null || _d === void 0 ? void 0 : _d.logicalFileName) {
            additionalLogicalFileNames = [(_e = mod.attributes) === null || _e === void 0 ? void 0 : _e.logicalFileName];
        }
        else {
            additionalLogicalFileNames = [];
        }
    }
    const query = additionalLogicalFileNames
        .map(name => {
        var _a, _b, _c;
        return ({
            id: name,
            installedVersion: (_b = (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.manifestVersion) !== null && _b !== void 0 ? _b : semver.coerce((_c = mod.attributes) === null || _c === void 0 ? void 0 : _c.version).version,
        });
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
            customFileName: refManifest.Name,
            additionalLogicalFileNames,
            minSMAPIVersion,
        };
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
            if (gameMode !== GAME_ID) {
                return;
            }
            const state = context.api.getState();
            (0, vortex_api_1.log)('debug', 'updating SDV compatibility info');
            Promise.all(Object.keys(state.persistent.mods[gameMode]).map(modId => updateConflictInfo(context.api, proxy, gameMode, modId)))
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFFaEMsa0RBQTBCO0FBQzFCLCtDQUFpQztBQUNqQywwREFBa0M7QUFDbEMsMkNBQXNFO0FBQ3RFLHdEQUEwQztBQUMxQyw0RUFBb0Q7QUFDcEQsMkNBQW9EO0FBRXBELDRFQUFvRDtBQUNwRCw4REFBc0M7QUFDdEMsbUNBQTRDO0FBQzVDLG1DQUFtSDtBQUNuSCxpQ0FBdUM7QUFFdkMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUMxQixFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDbkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFDL0IsRUFBRSxRQUFRLEVBQUUsR0FBRyxpQkFBSSxFQUNuQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUNqRSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVwQyxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNyRCxNQUFNLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQztBQUMxQyxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyxDQUFDLHFCQUFxQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRTFELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDOUUsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO0lBQzFCLE9BQU8sS0FBSyxD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RUFBRSxDQUFDLFFBQWdCLEVBQUUsRUFBRTtZQUMvRCxJQUFJLFFBQVEsS0FBSyxPQUFPLEVBQUU7Z0JBQ3hCLE9BQU87YUFDUjtZQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO1lBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUNuRSxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDeEQsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDWCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdXRpbCwgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcbmltcG9ydCBDb21wYXRpYmlsaXR5SWNvbiBmcm9tICcuL0NvbXBhdGliaWxpdHlJY29uJztcclxuaW1wb3J0IHsgU01BUElfUVVFUllfRlJFUVVFTkNZIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuaW1wb3J0IERlcGVuZGVuY3lNYW5hZ2VyIGZyb20gJy4vRGVwZW5kZW5jeU1hbmFnZXInO1xyXG5pbXBvcnQgU01BUElQcm94eSBmcm9tICcuL3NtYXBpUHJveHknO1xyXG5pbXBvcnQgeyB0ZXN0U01BUElPdXRkYXRlZCB9IGZyb20gJy4vdGVzdHMnO1xyXG5pbXBvcnQgeyBjb21wYXRpYmlsaXR5T3B0aW9ucywgQ29tcGF0aWJpbGl0eVN0YXR1cywgSVNEVkRlcGVuZGVuY3ksIElTRFZNb2RNYW5pZmVzdCwgSVNNQVBJUmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKSxcclxuICB7IGNsaXBib2FyZCB9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKSxcclxuICByanNvbiA9IHJlcXVpcmUoJ3JlbGF4ZWQtanNvbicpLFxyXG4gIHsgU2V2ZW5aaXAgfSA9IHV0aWwsXHJcbiAgeyBkZXBsb3lTTUFQSSwgZG93bmxvYWRTTUFQSSwgZmluZFNNQVBJTW9kIH0gPSByZXF1aXJlKCcuL1NNQVBJJyksXHJcbiAgeyBHQU1FX0lEIH0gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xyXG5cclxuY29uc3QgTUFOSUZFU1RfRklMRSA9ICdtYW5pZmVzdC5qc29uJztcclxuY29uc3QgUFRSTl9DT05URU5UID0gcGF0aC5zZXAgKyAnQ29udGVudCcgKyBwYXRoLnNlcDtcclxuY29uc3QgU01BUElfRVhFID0gJ1N0YXJkZXdNb2RkaW5nQVBJLmV4ZSc7XHJcbmNvbnN0IFNNQVBJX0RMTCA9ICdTTUFQSS5JbnN0YWxsZXIuZGxsJztcclxuY29uc3QgU01BUElfREFUQSA9IFsnd2luZG93cy1pbnN0YWxsLmRhdCcsICdpbnN0YWxsLmRhdCddO1xyXG5cclxuY29uc3QgX1NNQVBJX0JVTkRMRURfTU9EUyA9IFsnRXJyb3JIYW5kbGVyJywgJ0NvbnNvbGVDb21tYW5kcycsICdTYXZlQmFja3VwJ107XHJcbmNvbnN0IGdldEJ1bmRsZWRNb2RzID0gKCkgPT4ge1xyXG4gIHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQoX1NNQVBJX0JVTkRMRURfTU9EUy5tYXAobW9kTmFtZSA9PiBtb2ROYW1lLnRvTG93ZXJDYXNlKCkpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcblxyXG5jbGFzcyBTdGFyZGV3VmFsbGV5IGltcGxlbWVudHMgdHlwZXMuSUdhbWUge1xyXG4gIHB1YmxpYyBjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dDtcclxuICBwdWJsaWMgaWQ6IHN0cmluZyA9IEdBTUVfSUQ7XHJcbiAgcHVibGljIG5hbWU6IHN0cmluZyA9ICdTdGFyZGV3IFZhbGxleSc7XHJcbiAgcHVibGljIGxvZ286IHN0cmluZyA9ICdnYW1lYXJ0LmpwZyc7XHJcbiAgcHVibGljIHJlcXVpcmVkRmlsZXM6IHN0cmluZ1tdO1xyXG4gIHB1YmxpYyBlbnZpcm9ubWVudDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcclxuICAgIFN0ZWFtQVBQSWQ6ICc0MTMxNTAnLFxyXG4gIH07XHJcbiAgcHVibGljIGRldGFpbHM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7XHJcbiAgICBzdGVhbUFwcElkOiA0MTMxNTBcclxuICB9O1xyXG4gIHB1YmxpYyBzdXBwb3J0ZWRUb29sczogYW55W10gPSBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiAnc21hcGknLFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgICBsb2dvOiAnc21hcGkucG5nJyxcclxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gU01BUElfRVhFLFxyXG4gICAgICByZXF1aXJlZEZpbGVzOiBbU01BUElfRVhFXSxcclxuICAgICAgc2hlbGw6IHRydWUsXHJcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcclxuICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIGRlZmF1bHRQcmltYXJ5OiB0cnVlLFxyXG4gICAgfVxyXG4gIF07XHJcbiAgcHVibGljIG1lcmdlTW9kczogYm9vbGVhbiA9IHRydWU7XHJcbiAgcHVibGljIHJlcXVpcmVzQ2xlYW51cDogYm9vbGVhbiA9IHRydWU7XHJcbiAgcHVibGljIHNoZWxsOiBib29sZWFuID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcclxuICBwdWJsaWMgZGVmYXVsdFBhdGhzOiBzdHJpbmdbXTtcclxuXHJcbiAgLyoqKioqKioqKlxyXG4gICoqIFZvcnRleCBBUElcclxuICAqKioqKioqKiovXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0IGFuIGluc3RhbmNlLlxyXG4gICAqIEBwYXJhbSB7SUV4dGVuc2lvbkNvbnRleHR9IGNvbnRleHQgLS0gVGhlIFZvcnRleCBleHRlbnNpb24gY29udGV4dC5cclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gICAgLy8gcHJvcGVydGllcyB1c2VkIGJ5IFZvcnRleFxyXG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgIHRoaXMucmVxdWlyZWRGaWxlcyA9IHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xyXG4gICAgICA/IFsnU3RhcmRldyBWYWxsZXkuZXhlJ11cclxuICAgICAgOiBbJ1N0YXJkZXdWYWxsZXknLCAnU3RhcmRld1ZhbGxleS5leGUnXTtcclxuXHJcbiAgICAvLyBjdXN0b20gcHJvcGVydGllc1xyXG4gICAgdGhpcy5kZWZhdWx0UGF0aHMgPSBbXHJcbiAgICAgIC8vIExpbnV4XHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0dPRyBHYW1lcy9TdGFyZGV3IFZhbGxleS9nYW1lJyxcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvLmxvY2FsL3NoYXJlL1N0ZWFtL3N0ZWFtYXBwcy9jb21tb24vU3RhcmRldyBWYWxsZXknLFxyXG5cclxuICAgICAgLy8gTWFjXHJcbiAgICAgICcvQXBwbGljYXRpb25zL1N0YXJkZXcgVmFsbGV5LmFwcC9Db250ZW50cy9NYWNPUycsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5L0NvbnRlbnRzL01hY09TJyxcclxuXHJcbiAgICAgIC8vIFdpbmRvd3NcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR2FsYXh5Q2xpZW50XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR09HIEdhbGF4eVxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXFN0ZWFtXFxcXHN0ZWFtYXBwc1xcXFxjb21tb25cXFxcU3RhcmRldyBWYWxsZXknXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgZmluZCB0aGUgZ2FtZSBpbnN0YWxsIHBhdGguXHJcbiAgICpcclxuICAgKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gcXVpY2tseSBhbmQsIGlmIGl0IHJldHVybnMgYSB2YWx1ZSwgaXQgc2hvdWxkIGRlZmluaXRpdmVseSBiZSB0aGVcclxuICAgKiB2YWxpZCBnYW1lIHBhdGguIFVzdWFsbHkgdGhpcyBmdW5jdGlvbiB3aWxsIHF1ZXJ5IHRoZSBwYXRoIGZyb20gdGhlIHJlZ2lzdHJ5IG9yIGZyb20gc3RlYW0uXHJcbiAgICogVGhpcyBmdW5jdGlvbiBtYXkgcmV0dXJuIGEgcHJvbWlzZSBhbmQgaXQgc2hvdWxkIGRvIHRoYXQgaWYgaXQncyBkb2luZyBJL08uXHJcbiAgICpcclxuICAgKiBUaGlzIG1heSBiZSBsZWZ0IHVuZGVmaW5lZCBidXQgdGhlbiB0aGUgdG9vbC9nYW1lIGNhbiBvbmx5IGJlIGRpc2NvdmVyZWQgYnkgc2VhcmNoaW5nIHRoZSBkaXNrXHJcbiAgICogd2hpY2ggaXMgc2xvdyBhbmQgb25seSBoYXBwZW5zIG1hbnVhbGx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBxdWVyeVBhdGggPSB0b0JsdWUoYXN5bmMgKCkgPT4ge1xyXG4gICAgLy8gY2hlY2sgU3RlYW1cclxuICAgIGNvbnN0IGdhbWUgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzQxMzE1MCcsICcxNDUzMzc1MjUzJ10pO1xyXG4gICAgaWYgKGdhbWUpXHJcbiAgICAgIHJldHVybiBnYW1lLmdhbWVQYXRoO1xyXG5cclxuICAgIC8vIGNoZWNrIGRlZmF1bHQgcGF0aHNcclxuICAgIGZvciAoY29uc3QgZGVmYXVsdFBhdGggb2YgdGhpcy5kZWZhdWx0UGF0aHMpXHJcbiAgICB7XHJcbiAgICAgIGlmIChhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhkZWZhdWx0UGF0aCkpXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRQYXRoO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHBhdGggb2YgdGhlIHRvb2wgZXhlY3V0YWJsZSByZWxhdGl2ZSB0byB0aGUgdG9vbCBiYXNlIHBhdGgsIGkuZS4gYmluYXJpZXMvVVQzLmV4ZSBvclxyXG4gICAqIFRFU1YuZXhlLiBUaGlzIGlzIGEgZnVuY3Rpb24gc28gdGhhdCB5b3UgY2FuIHJldHVybiBkaWZmZXJlbnQgdGhpbmdzIGJhc2VkIG9uIHRoZSBvcGVyYXRpbmdcclxuICAgKiBzeXN0ZW0gZm9yIGV4YW1wbGUgYnV0IGJlIGF3YXJlIHRoYXQgaXQgd2lsbCBiZSBldmFsdWF0ZWQgYXQgYXBwbGljYXRpb24gc3RhcnQgYW5kIG9ubHkgb25jZSxcclxuICAgKiBzbyB0aGUgcmV0dXJuIHZhbHVlIGNhbiBub3QgZGVwZW5kIG9uIHRoaW5ncyB0aGF0IGNoYW5nZSBhdCBydW50aW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBleGVjdXRhYmxlKCkge1xyXG4gICAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xyXG4gICAgICA/ICdTdGFyZGV3IFZhbGxleS5leGUnXHJcbiAgICAgIDogJ1N0YXJkZXdWYWxsZXknO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBkZWZhdWx0IGRpcmVjdG9yeSB3aGVyZSBtb2RzIGZvciB0aGlzIGdhbWUgc2hvdWxkIGJlIHN0b3JlZC5cclxuICAgKiBcclxuICAgKiBJZiB0aGlzIHJldHVybnMgYSByZWxhdGl2ZSBwYXRoIHRoZW4gdGhlIHBhdGggaXMgdHJlYXRlZCBhcyByZWxhdGl2ZSB0byB0aGUgZ2FtZSBpbnN0YWxsYXRpb25cclxuICAgKiBkaXJlY3RvcnkuIFNpbXBseSByZXR1cm4gYSBkb3QgKCAoKSA9PiAnLicgKSBpZiBtb2RzIGFyZSBpbnN0YWxsZWQgZGlyZWN0bHkgaW50byB0aGUgZ2FtZVxyXG4gICAqIGRpcmVjdG9yeS5cclxuICAgKi8gXHJcbiAgcHVibGljIHF1ZXJ5TW9kUGF0aCgpXHJcbiAge1xyXG4gICAgcmV0dXJuICdNb2RzJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wdGlvbmFsIHNldHVwIGZ1bmN0aW9uLiBJZiB0aGlzIGdhbWUgcmVxdWlyZXMgc29tZSBmb3JtIG9mIHNldHVwIGJlZm9yZSBpdCBjYW4gYmUgbW9kZGVkIChsaWtlXHJcbiAgICogY3JlYXRpbmcgYSBkaXJlY3RvcnksIGNoYW5naW5nIGEgcmVnaXN0cnkga2V5LCAuLi4pIGRvIGl0IGhlcmUuIEl0IHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IHRpbWVcclxuICAgKiBiZWZvcmUgdGhlIGdhbWUgbW9kZSBpcyBhY3RpdmF0ZWQuXHJcbiAgICogQHBhcmFtIHtJRGlzY292ZXJ5UmVzdWx0fSBkaXNjb3ZlcnkgLS0gYmFzaWMgaW5mbyBhYm91dCB0aGUgZ2FtZSBiZWluZyBsb2FkZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldHVwID0gdG9CbHVlKGFzeW5jIChkaXNjb3ZlcnkpID0+IHtcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgZm9sZGVyIGZvciBTTUFQSSBtb2RzIGV4aXN0cy5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICAgIC8vIHNraXAgaWYgU01BUEkgZm91bmRcclxuICAgIGNvbnN0IHNtYXBpUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgU01BUElfRVhFKTtcclxuICAgIGNvbnN0IHNtYXBpRm91bmQgPSBhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhzbWFwaVBhdGgpO1xyXG4gICAgaWYgKHNtYXBpRm91bmQpXHJcbiAgICAgIHJldHVybjtcclxuXHJcbiAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZCh0aGlzLmNvbnRleHQuYXBpKTtcclxuICAgIGNvbnN0IHRpdGxlID0gc21hcGlNb2QgPyAnU01BUEkgaXMgbm90IGRlcGxveWVkJyA6ICdTTUFQSSBpcyBub3QgaW5zdGFsbGVkJztcclxuICAgIGNvbnN0IGFjdGlvblRpdGxlID0gc21hcGlNb2QgPyAnRGVwbG95JyA6ICdHZXQgU01BUEknO1xyXG4gICAgY29uc3QgYWN0aW9uID0gKCkgPT4gKHNtYXBpTW9kXHJcbiAgICAgID8gZGVwbG95U01BUEkodGhpcy5jb250ZXh0LmFwaSlcclxuICAgICAgOiBkb3dubG9hZFNNQVBJKHRoaXMuY29udGV4dC5hcGkpKVxyXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmNvbnRleHQuYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKSk7XHJcblxyXG4gICAgdGhpcy5jb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6ICdzbWFwaS1taXNzaW5nJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZSxcclxuICAgICAgbWVzc2FnZTogJ1NNQVBJIGlzIHJlcXVpcmVkIHRvIG1vZCBTdGFyZGV3IFZhbGxleS4nLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6IGFjdGlvblRpdGxlLFxyXG4gICAgICAgICAgYWN0aW9uLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgLyoqKioqKioqKlxyXG4gICoqIEludGVybmFsIG1ldGhvZHNcclxuICAqKioqKioqKiovXHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGNoZWNrIHdoZXRoZXIgYSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoIGV4aXN0cy5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFRoZSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoLlxyXG4gICAqL1xyXG4gIGFzeW5jIGdldFBhdGhFeGlzdHNBc3luYyhwYXRoKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGgpO1xyXG4gICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZXJyKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IHJlYWQgYSByZWdpc3RyeSBrZXkgdmFsdWUuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhpdmUgLSBUaGUgcmVnaXN0cnkgaGl2ZSB0byBhY2Nlc3MuIFRoaXMgc2hvdWxkIGJlIGEgY29uc3RhbnQgbGlrZSBSZWdpc3RyeS5IS0xNLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgcmVnaXN0cnkga2V5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRvIHJlYWQuXHJcbiAgICovXHJcbiAgYXN5bmMgcmVhZFJlZ2lzdHJ5S2V5QXN5bmMoaGl2ZSwga2V5LCBuYW1lKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKGhpdmUsIGtleSwgbmFtZSk7XHJcbiAgICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdFBhdGgudmFsdWUpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSb290Rm9sZGVyKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBXZSBhc3N1bWUgdGhhdCBhbnkgbW9kIGNvbnRhaW5pbmcgXCIvQ29udGVudC9cIiBpbiBpdHMgZGlyZWN0b3J5XHJcbiAgLy8gIHN0cnVjdHVyZSBpcyBtZWFudCB0byBiZSBkZXBsb3llZCB0byB0aGUgcm9vdCBmb2xkZXIuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgIC5tYXAoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKSk7XHJcbiAgY29uc3QgY29udGVudERpciA9IGZpbHRlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGNvbnRlbnREaXIgIT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSb290Rm9sZGVyKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBXZSdyZSBnb2luZyB0byBkZXBsb3kgXCIvQ29udGVudC9cIiBhbmQgd2hhdGV2ZXIgZm9sZGVycyBjb21lIGFsb25nc2lkZSBpdC5cclxuICAvLyAgaS5lLiBTb21lTW9kLjd6XHJcbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvQ29udGVudC9cclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Nb2RzL1xyXG4gIC8vICBXaWxsIE5PVCBiZSBkZXBsb3llZCA9PiAuLi9SZWFkbWUuZG9jXHJcbiAgY29uc3QgY29udGVudEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3QgaWR4ID0gY29udGVudEZpbGUuaW5kZXhPZihQVFJOX0NPTlRFTlQpICsgMTtcclxuICBjb25zdCByb290RGlyID0gcGF0aC5iYXNlbmFtZShjb250ZW50RmlsZS5zdWJzdHJpbmcoMCwgaWR4KSk7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcClcclxuICAgICYmIChmaWxlLmluZGV4T2Yocm9vdERpcikgIT09IC0xKVxyXG4gICAgJiYgKHBhdGguZXh0bmFtZShmaWxlKSAhPT0gJy50eHQnKSk7XHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnN1YnN0cihpZHgpLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVmFsaWRNYW5pZmVzdChmaWxlUGF0aCkge1xyXG4gIGNvbnN0IHNlZ21lbnRzID0gZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgY29uc3QgaXNNYW5pZmVzdEZpbGUgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gTUFOSUZFU1RfRklMRTtcclxuICBjb25zdCBpc0xvY2FsZSA9IHNlZ21lbnRzLmluY2x1ZGVzKCdsb2NhbGUnKTtcclxuICByZXR1cm4gaXNNYW5pZmVzdEZpbGUgJiYgIWlzTG9jYWxlO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoaXNWYWxpZE1hbmlmZXN0KSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIHByZWZpeCBmYWtlIGRpcmVjdG9yeSBqdXN0IGluIGNhc2UgdGhlIGNvbnRlbnRcclxuICAgICAgLy8gIGZvbGRlciBpcyBpbiB0aGUgYXJjaGl2ZSdzIHJvb3QgZm9sZGVyLiBUaGlzIGlzIHRvIGVuc3VyZSB3ZVxyXG4gICAgICAvLyAgZmluZCBhIG1hdGNoIGZvciBcIi9Db250ZW50L1wiXHJcbiAgICAgIGNvbnN0IHRlc3RGaWxlID0gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSk7XHJcbiAgICAgIHJldHVybiAodGVzdEZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgICB9KSA9PT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoYXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lNYW5hZ2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFRoZSBhcmNoaXZlIG1heSBjb250YWluIG11bHRpcGxlIG1hbmlmZXN0IGZpbGVzIHdoaWNoIHdvdWxkXHJcbiAgLy8gIGltcGx5IHRoYXQgd2UncmUgaW5zdGFsbGluZyBtdWx0aXBsZSBtb2RzLlxyXG4gIGNvbnN0IG1hbmlmZXN0RmlsZXMgPSBmaWxlcy5maWx0ZXIoaXNWYWxpZE1hbmlmZXN0KTtcclxuXHJcbiAgaW50ZXJmYWNlIElNb2RJbmZvIHtcclxuICAgIG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3Q7XHJcbiAgICByb290Rm9sZGVyOiBzdHJpbmc7XHJcbiAgICBtYW5pZmVzdEluZGV4OiBudW1iZXI7XHJcbiAgICBtb2RGaWxlczogc3RyaW5nW107XHJcbiAgfVxyXG5cclxuICBhd2FpdCBkZXBlbmRlbmN5TWFuYWdlci5zY2FuTWFuaWZlc3RzKHRydWUpO1xyXG4gIGNvbnN0IG1vZHM6IElNb2RJbmZvW10gPSBhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdEZpbGVzLm1hcChhc3luYyBtYW5pZmVzdEZpbGUgPT4ge1xyXG4gICAgY29uc3Qgcm9vdEZvbGRlciA9IHBhdGguZGlybmFtZShtYW5pZmVzdEZpbGUpO1xyXG4gICAgY29uc3QgbWFuaWZlc3RJbmRleCA9IG1hbmlmZXN0RmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoTUFOSUZFU1RfRklMRSk7XHJcbiAgICBjb25zdCBmaWx0ZXJGdW5jID0gKGZpbGUpID0+IChyb290Rm9sZGVyICE9PSAnLicpXHJcbiAgICAgID8gKChmaWxlLmluZGV4T2Yocm9vdEZvbGRlcikgIT09IC0xKVxyXG4gICAgICAgICYmIChwYXRoLmRpcm5hbWUoZmlsZSkgIT09ICcuJylcclxuICAgICAgICAmJiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkpXHJcbiAgICAgIDogIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApO1xyXG4gICAgY29uc3QgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdCA9IGF3YWl0IHBhcnNlTWFuaWZlc3QocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbWFuaWZlc3RGaWxlKSk7XHJcbiAgICBjb25zdCBtb2RGaWxlcyA9IGZpbGVzLmZpbHRlcihmaWx0ZXJGdW5jKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG1hbmlmZXN0LFxyXG4gICAgICByb290Rm9sZGVyLFxyXG4gICAgICBtYW5pZmVzdEluZGV4LFxyXG4gICAgICBtb2RGaWxlcyxcclxuICAgIH07XHJcbiAgfSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQubWFwKG1vZHMsIG1vZCA9PiB7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gKG1vZC5yb290Rm9sZGVyICE9PSAnLicpXHJcbiAgICAgID8gbW9kLnJvb3RGb2xkZXJcclxuICAgICAgOiBtb2QubWFuaWZlc3QuTmFtZTtcclxuXHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtb2QubWFuaWZlc3QuRGVwZW5kZW5jaWVzIHx8IFtdO1xyXG5cclxuICAgIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbW9kLm1vZEZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gcGF0aC5qb2luKG1vZE5hbWUsIGZpbGUuc3Vic3RyKG1vZC5tYW5pZmVzdEluZGV4KSk7XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWRkUnVsZUZvckRlcGVuZGVuY3kgPSAoZGVwOiBJU0RWRGVwZW5kZW5jeSkgPT4ge1xyXG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSBkZXAuTWluaW11bVZlcnNpb24gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gYD49JHtkZXAuTWluaW11bVZlcnNpb259YFxyXG4gICAgICAgIDogJyonO1xyXG4gICAgICBjb25zdCBydWxlOiB0eXBlcy5JTW9kUnVsZSA9IHtcclxuICAgICAgICB0eXBlOiAoZGVwLklzUmVxdWlyZWQgPz8gdHJ1ZSkgPyAncmVxdWlyZXMnIDogJ3JlY29tbWVuZHMnLFxyXG4gICAgICAgIHJlZmVyZW5jZToge1xyXG4gICAgICAgICAgbG9naWNhbEZpbGVOYW1lOiBkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgIHZlcnNpb25NYXRjaCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGV4dHJhOiB7XHJcbiAgICAgICAgICBvbmx5SWZGdWxmaWxsYWJsZTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9O1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ3J1bGUnLFxyXG4gICAgICAgIHJ1bGUsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcGVuZGVuY2llcykge1xyXG4gICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShkZXApO1xyXG4gICAgfVxyXG4gICAgaWYgKG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0ZvciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0Zvcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5zdHJ1Y3Rpb25zO1xyXG4gIH0pXHJcbiAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gW10uY29uY2F0KGRhdGEpLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IGFjY3VtLmNvbmNhdChpdGVyKSwgW10pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzU01BUElNb2RUeXBlKGluc3RydWN0aW9ucykge1xyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGV4ZSBmaWxlLlxyXG4gIGNvbnN0IHNtYXBpRGF0YSA9IGluc3RydWN0aW9ucy5maW5kKGluc3QgPT4gKGluc3QudHlwZSA9PT0gJ2NvcHknKSAmJiBpbnN0LnNvdXJjZS5lbmRzV2l0aChTTUFQSV9FWEUpKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoc21hcGlEYXRhICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U01BUEkoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIE1ha2Ugc3VyZSB0aGUgZG93bmxvYWQgY29udGFpbnMgdGhlIFNNQVBJIGRhdGEgYXJjaGl2ZS5zXHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PlxyXG4gICAgcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gU01BUElfRExMKSAhPT0gdW5kZWZpbmVkKVxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgICAgc3VwcG9ydGVkLFxyXG4gICAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFNNQVBJKGdldERpc2NvdmVyeVBhdGgsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICBjb25zdCBmb2xkZXIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInXHJcbiAgICA/ICd3aW5kb3dzJ1xyXG4gICAgOiBwcm9jZXNzLnBsYXRmb3JtID09PSAnbGludXgnXHJcbiAgICAgID8gJ2xpbnV4J1xyXG4gICAgICA6ICdtYWNvcyc7XHJcbiAgY29uc3QgZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybSA9IChmaWxlKSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgcmV0dXJuIChzZWdtZW50cy5pbmNsdWRlcyhmb2xkZXIpKTtcclxuICB9XHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZGF0YSBhcmNoaXZlXHJcbiAgY29uc3QgZGF0YUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4ge1xyXG4gICAgY29uc3QgaXNDb3JyZWN0UGxhdGZvcm0gPSBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtKGZpbGUpO1xyXG4gICAgcmV0dXJuIGlzQ29ycmVjdFBsYXRmb3JtICYmIFNNQVBJX0RBVEEuaW5jbHVkZXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKVxyXG4gIH0pO1xyXG4gIGlmIChkYXRhRmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBmaW5kIHRoZSBTTUFQSSBkYXRhIGZpbGVzIC0gZG93bmxvYWQgYXBwZWFycyAnXHJcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XHJcbiAgfVxyXG4gIGxldCBkYXRhID0gJyc7XHJcbiAgdHJ5IHtcclxuICAgIGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihnZXREaXNjb3ZlcnlQYXRoKCksICdTdGFyZGV3IFZhbGxleS5kZXBzLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgU0RWIGRlcGVuZGVuY2llcycsIGVycik7XHJcbiAgfVxyXG5cclxuICAvLyBmaWxlIHdpbGwgYmUgb3V0ZGF0ZWQgYWZ0ZXIgdGhlIHdhbGsgb3BlcmF0aW9uIHNvIHByZXBhcmUgYSByZXBsYWNlbWVudC4gXHJcbiAgY29uc3QgdXBkYXRlZEZpbGVzID0gW107XHJcblxyXG4gIGNvbnN0IHN6aXAgPSBuZXcgU2V2ZW5aaXAoKTtcclxuICAvLyBVbnppcCB0aGUgZmlsZXMgZnJvbSB0aGUgZGF0YSBhcmNoaXZlLiBUaGlzIGRvZXNuJ3Qgc2VlbSB0byBiZWhhdmUgYXMgZGVzY3JpYmVkIGhlcmU6IGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL25vZGUtN3ojZXZlbnRzXHJcbiAgYXdhaXQgc3ppcC5leHRyYWN0RnVsbChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBkYXRhRmlsZSksIGRlc3RpbmF0aW9uUGF0aCk7XHJcblxyXG4gIC8vIEZpbmQgYW55IGZpbGVzIHRoYXQgYXJlIG5vdCBpbiB0aGUgcGFyZW50IGZvbGRlci4gXHJcbiAgYXdhaXQgdXRpbC53YWxrKGRlc3RpbmF0aW9uUGF0aCwgKGl0ZXIsIHN0YXRzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRlc3RpbmF0aW9uUGF0aCwgaXRlcik7XHJcbiAgICAgIC8vIEZpbHRlciBvdXQgZmlsZXMgZnJvbSB0aGUgb3JpZ2luYWwgaW5zdGFsbCBhcyB0aGV5J3JlIG5vIGxvbmdlciByZXF1aXJlZC5cclxuICAgICAgaWYgKCFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoKSAmJiBzdGF0cy5pc0ZpbGUoKSAmJiAhZmlsZXMuaW5jbHVkZXMocmVsUGF0aCtwYXRoLnNlcCkpIHVwZGF0ZWRGaWxlcy5wdXNoKHJlbFBhdGgpO1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IHJlbFBhdGgudG9Mb2NhbGVMb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGNvbnN0IG1vZHNGb2xkZXJJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICAgIGlmICgobW9kc0ZvbGRlcklkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzRm9sZGVySWR4ICsgMSkpIHtcclxuICAgICAgICBfU01BUElfQlVORExFRF9NT0RTLnB1c2goc2VnbWVudHNbbW9kc0ZvbGRlcklkeCArIDFdKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS4gXHJcbiAgY29uc3Qgc21hcGlFeGUgPSB1cGRhdGVkRmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5lbmRzV2l0aChTTUFQSV9FWEUudG9Mb3dlckNhc2UoKSkpO1xyXG4gIGlmIChzbWFwaUV4ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBleHRyYWN0ICR7U01BUElfRVhFfSAtIGRvd25sb2FkIGFwcGVhcnMgYFxyXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xyXG4gIH1cclxuICBjb25zdCBpZHggPSBzbWFwaUV4ZS5pbmRleE9mKHBhdGguYmFzZW5hbWUoc21hcGlFeGUpKTtcclxuXHJcbiAgLy8gQnVpbGQgdGhlIGluc3RydWN0aW9ucyBmb3IgaW5zdGFsbGF0aW9uLiBcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gdXBkYXRlZEZpbGVzLm1hcChmaWxlID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oZmlsZS5zdWJzdHIoaWR4KSksXHJcbiAgICAgIH1cclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICBrZXk6ICdzbWFwaUJ1bmRsZWRNb2RzJyxcclxuICAgIHZhbHVlOiBnZXRCdW5kbGVkTW9kcygpLFxyXG4gIH0pO1xyXG5cclxuICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICB0eXBlOiAnZ2VuZXJhdGVmaWxlJyxcclxuICAgIGRhdGEsXHJcbiAgICBkZXN0aW5hdGlvbjogJ1N0YXJkZXdNb2RkaW5nQVBJLmRlcHMuanNvbicsXHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBsb2dGaWxlKSB7XHJcbiAgY29uc3QgbG9nRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGJhc2VQYXRoLCBsb2dGaWxlKSwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KTtcclxuICBhd2FpdCBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdTTUFQSSBMb2cnLCB7XHJcbiAgICB0ZXh0OiAnWW91ciBTTUFQSSBsb2cgaXMgZGlzcGxheWVkIGJlbG93LiBUbyBzaGFyZSBpdCwgY2xpY2sgXCJDb3B5ICYgU2hhcmVcIiB3aGljaCB3aWxsIGNvcHkgaXQgdG8geW91ciBjbGlwYm9hcmQgYW5kIG9wZW4gdGhlIFNNQVBJIGxvZyBzaGFyaW5nIHdlYnNpdGUuICcgK1xyXG4gICAgICAnTmV4dCwgcGFzdGUgeW91ciBjb2RlIGludG8gdGhlIHRleHQgYm94IGFuZCBwcmVzcyBcInNhdmUgJiBwYXJzZSBsb2dcIi4gWW91IGNhbiBub3cgc2hhcmUgYSBsaW5rIHRvIHRoaXMgcGFnZSB3aXRoIG90aGVycyBzbyB0aGV5IGNhbiBzZWUgeW91ciBsb2cgZmlsZS5cXG5cXG4nICsgbG9nRGF0YVxyXG4gIH0sIFt7XHJcbiAgICBsYWJlbDogJ0NvcHkgJiBTaGFyZSBsb2cnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL14uK1QoW15cXC5dKykuKy8sICckMScpO1xyXG4gICAgICBjbGlwYm9hcmQud3JpdGVUZXh0KGBbJHt0aW1lc3RhbXB9IElORk8gVm9ydGV4XSBMb2cgZXhwb3J0ZWQgYnkgVm9ydGV4ICR7dXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb259LlxcbmAgKyBsb2dEYXRhKTtcclxuICAgICAgcmV0dXJuIHV0aWwub3BuKCdodHRwczovL3NtYXBpLmlvL2xvZycpLmNhdGNoKGVyciA9PiB1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH0sIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gdW5kZWZpbmVkIH1dKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25TaG93U01BUElMb2coYXBpKSB7XHJcbiAgLy9SZWFkIGFuZCBkaXNwbGF5IHRoZSBsb2cuXHJcbiAgY29uc3QgYmFzZVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdhcHBEYXRhJyksICdzdGFyZGV3dmFsbGV5JywgJ2Vycm9ybG9ncycpO1xyXG4gIHRyeSB7XHJcbiAgICAvL0lmIHRoZSBjcmFzaCBsb2cgZXhpc3RzLCBzaG93IHRoYXQuXHJcbiAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1jcmFzaC50eHRcIik7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAvL090aGVyd2lzZSBzaG93IHRoZSBub3JtYWwgbG9nLlxyXG4gICAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1sYXRlc3QudHh0XCIpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vT3IgSW5mb3JtIHRoZSB1c2VyIHRoZXJlIGFyZSBubyBsb2dzLlxyXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7IHR5cGU6ICdpbmZvJywgdGl0bGU6ICdObyBTTUFQSSBsb2dzIGZvdW5kLicsIG1lc3NhZ2U6ICcnLCBkaXNwbGF5TVM6IDUwMDAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBjb25zdCBtYW5pZmVzdHM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gIGlmIChtb2RQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xyXG4gICAgICBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09ICdtYW5pZmVzdC5qc29uJykge1xyXG4gICAgICAgIG1hbmlmZXN0cy5wdXNoKGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KVxyXG4gICAgLnRoZW4oKCkgPT4gbWFuaWZlc3RzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlQ29uZmxpY3RJbmZvKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYXBpOiBTTUFQSVByb3h5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RJZDogc3RyaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBtb2QgPSBhcGkuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZUlkXVttb2RJZF07XHJcblxyXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcblxyXG4gIGlmICgobm93IC0gbW9kLmF0dHJpYnV0ZXM/Lmxhc3RTTUFQSVF1ZXJ5ID8/IDApIDwgU01BUElfUVVFUllfRlJFUVVFTkNZKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBsZXQgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBtb2QuYXR0cmlidXRlcz8uYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXM7XHJcbiAgaWYgKGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID09PSB1bmRlZmluZWQpIHtcclxuICAgIGlmIChtb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lKSB7XHJcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW21vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWVdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHF1ZXJ5ID0gYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXNcclxuICAgIC5tYXAobmFtZSA9PiAoe1xyXG4gICAgICBpZDogbmFtZSxcclxuICAgICAgaW5zdGFsbGVkVmVyc2lvbjogbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxyXG4gICAgICAgICAgICAgICAgICAgICA/PyBzZW12ZXIuY29lcmNlKG1vZC5hdHRyaWJ1dGVzPy52ZXJzaW9uKS52ZXJzaW9uLFxyXG4gICAgfSkpO1xyXG5cclxuICBjb25zdCBzdGF0ID0gKGl0ZW06IElTTUFQSVJlc3VsdCk6IENvbXBhdGliaWxpdHlTdGF0dXMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdHVzID0gaXRlbS5tZXRhZGF0YT8uY29tcGF0aWJpbGl0eVN0YXR1cz8udG9Mb3dlckNhc2U/LigpO1xyXG4gICAgaWYgKCFjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmNsdWRlcyhzdGF0dXMgYXMgYW55KSkge1xyXG4gICAgICByZXR1cm4gJ3Vua25vd24nO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHN0YXR1cyBhcyBDb21wYXRpYmlsaXR5U3RhdHVzO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNvbXBhdGliaWxpdHlQcmlvID0gKGl0ZW06IElTTUFQSVJlc3VsdCkgPT4gY29tcGF0aWJpbGl0eU9wdGlvbnMuaW5kZXhPZihzdGF0KGl0ZW0pKTtcclxuXHJcbiAgcmV0dXJuIHNtYXBpLmZpbmRCeU5hbWVzKHF1ZXJ5KVxyXG4gICAgLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICAgIGNvbnN0IHdvcnN0U3RhdHVzOiBJU01BUElSZXN1bHRbXSA9IHJlc3VsdHNcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGNvbXBhdGliaWxpdHlQcmlvKGxocykgLSBjb21wYXRpYmlsaXR5UHJpbyhyaHMpKTtcclxuICAgICAgaWYgKHdvcnN0U3RhdHVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGVzKGdhbWVJZCwgbW9kSWQsIHtcclxuICAgICAgICAgIGxhc3RTTUFQSVF1ZXJ5OiBub3csXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5U3RhdHVzOiB3b3JzdFN0YXR1c1swXS5tZXRhZGF0YS5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eU1lc3NhZ2U6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdW1tYXJ5LFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVVwZGF0ZTogd29yc3RTdGF0dXNbMF0uc3VnZ2VzdGVkVXBkYXRlPy52ZXJzaW9uLFxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb2coJ2RlYnVnJywgJ25vIG1hbmlmZXN0Jyk7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnd2FybicsICdlcnJvciByZWFkaW5nIG1hbmlmZXN0JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGxldCBkZXBlbmRlbmN5TWFuYWdlcjogRGVwZW5kZW5jeU1hbmFnZXI7XHJcbiAgY29uc3QgZ2V0RGlzY292ZXJ5UGF0aCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxyXG4gICAgICBsb2coJ2Vycm9yJywgJ3N0YXJkZXd2YWxsZXkgd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZ2V0U01BUElQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaXNNb2RDYW5kaWRhdGVWYWxpZCA9IChtb2QsIGVudHJ5KSA9PiB7XHJcbiAgICBpZiAobW9kPy5pZCA9PT0gdW5kZWZpbmVkIHx8IG1vZC50eXBlID09PSAnc2R2cm9vdGZvbGRlcicpIHtcclxuICAgICAgLy8gVGhlcmUgaXMgbm8gcmVsaWFibGUgd2F5IHRvIGFzY2VydGFpbiB3aGV0aGVyIGEgbmV3IGZpbGUgZW50cnlcclxuICAgICAgLy8gIGFjdHVhbGx5IGJlbG9uZ3MgdG8gYSByb290IG1vZFR5cGUgYXMgc29tZSBvZiB0aGVzZSBtb2RzIHdpbGwgYWN0XHJcbiAgICAgIC8vICBhcyByZXBsYWNlbWVudCBtb2RzLiBUaGlzIG9idmlvdXNseSBtZWFucyB0aGF0IGlmIHRoZSBnYW1lIGhhc1xyXG4gICAgICAvLyAgYSBzdWJzdGFudGlhbCB1cGRhdGUgd2hpY2ggaW50cm9kdWNlcyBuZXcgZmlsZXMgd2UgY291bGQgcG90ZW50aWFsbHlcclxuICAgICAgLy8gIGFkZCBhIHZhbmlsbGEgZ2FtZSBmaWxlIGludG8gdGhlIG1vZCdzIHN0YWdpbmcgZm9sZGVyIGNhdXNpbmcgY29uc3RhbnRcclxuICAgICAgLy8gIGNvbnRlbnRpb24gYmV0d2VlbiB0aGUgZ2FtZSBpdHNlbGYgKHdoZW4gaXQgdXBkYXRlcykgYW5kIHRoZSBtb2QuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFRoZXJlIGlzIGFsc28gYSBwb3RlbnRpYWwgY2hhbmNlIGZvciByb290IG1vZFR5cGVzIHRvIGNvbmZsaWN0IHdpdGggcmVndWxhclxyXG4gICAgICAvLyAgbW9kcywgd2hpY2ggaXMgd2h5IGl0J3Mgbm90IHNhZmUgdG8gYXNzdW1lIHRoYXQgYW55IGFkZGl0aW9uIGluc2lkZSB0aGVcclxuICAgICAgLy8gIG1vZHMgZGlyZWN0b3J5IGNhbiBiZSBzYWZlbHkgYWRkZWQgdG8gdGhpcyBtb2QncyBzdGFnaW5nIGZvbGRlciBlaXRoZXIuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobW9kLnR5cGUgIT09ICdTTUFQSScpIHtcclxuICAgICAgLy8gT3RoZXIgbW9kIHR5cGVzIGRvIG5vdCByZXF1aXJlIGZ1cnRoZXIgdmFsaWRhdGlvbiAtIGl0IHNob3VsZCBiZSBmaW5lXHJcbiAgICAgIC8vICB0byBhZGQgdGhpcyBlbnRyeS5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICAgIGNvbnN0IG1vZHNTZWdJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICBjb25zdCBtb2RGb2xkZXJOYW1lID0gKChtb2RzU2VnSWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNTZWdJZHggKyAxKSlcclxuICAgICAgPyBzZWdtZW50c1ttb2RzU2VnSWR4ICsgMV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgbGV0IGJ1bmRsZWRNb2RzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ3NtYXBpQnVuZGxlZE1vZHMnXSwgW10pO1xyXG4gICAgYnVuZGxlZE1vZHMgPSBidW5kbGVkTW9kcy5sZW5ndGggPiAwID8gYnVuZGxlZE1vZHMgOiBnZXRCdW5kbGVkTW9kcygpO1xyXG4gICAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCdjb250ZW50JykpIHtcclxuICAgICAgLy8gU01BUEkgaXMgbm90IHN1cHBvc2VkIHRvIG92ZXJ3cml0ZSB0aGUgZ2FtZSdzIGNvbnRlbnQgZGlyZWN0bHkuXHJcbiAgICAgIC8vICB0aGlzIGlzIGNsZWFybHkgbm90IGEgU01BUEkgZmlsZSBhbmQgc2hvdWxkIF9ub3RfIGJlIGFkZGVkIHRvIGl0LlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChtb2RGb2xkZXJOYW1lICE9PSB1bmRlZmluZWQpICYmIGJ1bmRsZWRNb2RzLmluY2x1ZGVzKG1vZEZvbGRlck5hbWUpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IG1hbmlmZXN0RXh0cmFjdG9yID0gdG9CbHVlKFxyXG4gICAgYXN5bmMgKG1vZEluZm86IGFueSwgbW9kUGF0aD86IHN0cmluZyk6IFByb21pc2U8eyBba2V5OiBzdHJpbmddOiBhbnk7IH0+ID0+IHtcclxuICAgICAgY29uc3QgbWFuaWZlc3RzID0gYXdhaXQgZ2V0TW9kTWFuaWZlc3RzKG1vZFBhdGgpO1xyXG4gICAgICBpZiAobWFuaWZlc3RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBwYXJzZWRNYW5pZmVzdHMgPSBhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdHMubWFwKFxyXG4gICAgICAgIGFzeW5jIG1hbiA9PiBhd2FpdCBwYXJzZU1hbmlmZXN0KG1hbikpKTtcclxuXHJcbiAgICAgIC8vIHdlIGNhbiBvbmx5IHVzZSBvbmUgbWFuaWZlc3QgdG8gZ2V0IHRoZSBpZCBmcm9tXHJcbiAgICAgIGNvbnN0IHJlZk1hbmlmZXN0ID0gcGFyc2VkTWFuaWZlc3RzWzBdO1xyXG5cclxuICAgICAgY29uc3QgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBwYXJzZWRNYW5pZmVzdHNcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlELnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICBjb25zdCBtaW5TTUFQSVZlcnNpb24gPSBwYXJzZWRNYW5pZmVzdHNcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0Lk1pbmltdW1BcGlWZXJzaW9uKVxyXG4gICAgICAgIC5maWx0ZXIodmVyc2lvbiA9PiBzZW12ZXIudmFsaWQodmVyc2lvbikpXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMsIGxocykpWzBdO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0ge1xyXG4gICAgICAgIGN1c3RvbUZpbGVOYW1lOiByZWZNYW5pZmVzdC5OYW1lLFxyXG4gICAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzLFxyXG4gICAgICAgIG1pblNNQVBJVmVyc2lvbixcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICh0eXBlb2YocmVmTWFuaWZlc3QuVmVyc2lvbikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgcmVzdWx0WydtYW5pZmVzdFZlcnNpb24nXSA9IHJlZk1hbmlmZXN0LlZlcnNpb247XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KTtcclxuICAgIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZShuZXcgU3RhcmRld1ZhbGxleShjb250ZXh0KSk7XHJcbiAgLy8gUmVnaXN0ZXIgb3VyIFNNQVBJIG1vZCB0eXBlIGFuZCBpbnN0YWxsZXIuIE5vdGU6IFRoaXMgY3VycmVudGx5IGZsYWdzIGFuIGVycm9yIGluIFZvcnRleCBvbiBpbnN0YWxsaW5nIGNvcnJlY3RseS5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzbWFwaS1pbnN0YWxsZXInLCAzMCwgdGVzdFNNQVBJLCAoZmlsZXMsIGRlc3QpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbFNNQVBJKGdldERpc2NvdmVyeVBhdGgsIGZpbGVzLCBkZXN0KSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdTTUFQSScsIDMwLCBnYW1lSWQgPT4gZ2FtZUlkID09PSBHQU1FX0lELCBnZXRTTUFQSVBhdGgsIGlzU01BUElNb2RUeXBlKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzdGFyZGV3LXZhbGxleS1pbnN0YWxsZXInLCA1MCwgdGVzdFN1cHBvcnRlZCxcclxuICAgIChmaWxlcywgZGVzdGluYXRpb25QYXRoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGluc3RhbGwoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyLCBmaWxlcywgZGVzdGluYXRpb25QYXRoKSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NkdnJvb3Rmb2xkZXInLCA1MCwgdGVzdFJvb3RGb2xkZXIsIGluc3RhbGxSb290Rm9sZGVyKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnc2R2cm9vdGZvbGRlcicsIDI1LCAoZ2FtZUlkKSA9PiAoZ2FtZUlkID09PSBHQU1FX0lEKSxcclxuICAgICgpID0+IGdldERpc2NvdmVyeVBhdGgoKSwgKGluc3RydWN0aW9ucykgPT4ge1xyXG4gICAgICAvLyBPbmx5IGludGVyZXN0ZWQgaW4gY29weSBpbnN0cnVjdGlvbnMuXHJcbiAgICAgIGNvbnN0IGNvcHlJbnN0cnVjdGlvbnMgPSBpbnN0cnVjdGlvbnMuZmlsdGVyKGluc3RyID0+IGluc3RyLnR5cGUgPT09ICdjb3B5Jyk7XHJcbiAgICAgIC8vIFRoaXMgaXMgYSB0cmlja3kgcGF0dGVybiBzbyB3ZSdyZSBnb2luZyB0byAxc3QgcHJlc2VudCB0aGUgZGlmZmVyZW50IHBhY2thZ2luZ1xyXG4gICAgICAvLyAgcGF0dGVybnMgd2UgbmVlZCB0byBjYXRlciBmb3I6XHJcbiAgICAgIC8vICAxLiBSZXBsYWNlbWVudCBtb2Qgd2l0aCBcIkNvbnRlbnRcIiBmb2xkZXIuIERvZXMgbm90IHJlcXVpcmUgU01BUEkgc28gbm9cclxuICAgICAgLy8gICAgbWFuaWZlc3QgZmlsZXMgYXJlIGluY2x1ZGVkLlxyXG4gICAgICAvLyAgMi4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyICsgb25lIG9yIG1vcmUgU01BUEkgbW9kcyBpbmNsdWRlZFxyXG4gICAgICAvLyAgICBhbG9uZ3NpZGUgdGhlIENvbnRlbnQgZm9sZGVyIGluc2lkZSBhIFwiTW9kc1wiIGZvbGRlci5cclxuICAgICAgLy8gIDMuIEEgcmVndWxhciBTTUFQSSBtb2Qgd2l0aCBhIFwiQ29udGVudFwiIGZvbGRlciBpbnNpZGUgdGhlIG1vZCdzIHJvb3QgZGlyLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBwYXR0ZXJuIDE6XHJcbiAgICAgIC8vICAtIEVuc3VyZSB3ZSBkb24ndCBoYXZlIG1hbmlmZXN0IGZpbGVzXHJcbiAgICAgIC8vICAtIEVuc3VyZSB3ZSBoYXZlIGEgXCJDb250ZW50XCIgZm9sZGVyXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFRvIHNvbHZlIHBhdHRlcm5zIDIgYW5kIDMgd2UncmUgZ29pbmcgdG86XHJcbiAgICAgIC8vICBDaGVjayB3aGV0aGVyIHdlIGhhdmUgYW55IG1hbmlmZXN0IGZpbGVzLCBpZiB3ZSBkbywgd2UgZXhwZWN0IHRoZSBmb2xsb3dpbmdcclxuICAgICAgLy8gICAgYXJjaGl2ZSBzdHJ1Y3R1cmUgaW4gb3JkZXIgZm9yIHRoZSBtb2RUeXBlIHRvIGZ1bmN0aW9uIGNvcnJlY3RseTpcclxuICAgICAgLy8gICAgYXJjaGl2ZS56aXAgPT5cclxuICAgICAgLy8gICAgICAuLi9Db250ZW50L1xyXG4gICAgICAvLyAgICAgIC4uL01vZHMvXHJcbiAgICAgIC8vICAgICAgLi4vTW9kcy9BX1NNQVBJX01PRFxcbWFuaWZlc3QuanNvblxyXG4gICAgICBjb25zdCBoYXNNYW5pZmVzdCA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLmVuZHNXaXRoKE1BTklGRVNUX0ZJTEUpKVxyXG4gICAgICBjb25zdCBoYXNNb2RzRm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnTW9kcycgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnN0IGhhc0NvbnRlbnRGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5zdGFydHNXaXRoKCdDb250ZW50JyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZFxyXG5cclxuICAgICAgcmV0dXJuIChoYXNNYW5pZmVzdClcclxuICAgICAgICA/IEJsdWViaXJkLnJlc29sdmUoaGFzQ29udGVudEZvbGRlciAmJiBoYXNNb2RzRm9sZGVyKVxyXG4gICAgICAgIDogQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyKTtcclxuICAgIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCA5OTksICdjaGFuZ2Vsb2cnLCB7fSwgJ1NNQVBJIExvZycsXHJcbiAgICAoKSA9PiB7IG9uU2hvd1NNQVBJTG9nKGNvbnRleHQuYXBpKTsgfSxcclxuICAgICgpID0+IHtcclxuICAgICAgLy9Pbmx5IHNob3cgdGhlIFNNQVBJIGxvZyBidXR0b24gZm9yIFNEVi4gXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckF0dHJpYnV0ZUV4dHJhY3RvcigyNSwgbWFuaWZlc3RFeHRyYWN0b3IpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyVGFibGVBdHRyaWJ1dGUoJ21vZHMnLCB7XHJcbiAgICBpZDogJ3Nkdi1jb21wYXRpYmlsaXR5JyxcclxuICAgIHBvc2l0aW9uOiAxMDAsXHJcbiAgICBjb25kaXRpb246ICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsXHJcbiAgICBwbGFjZW1lbnQ6ICd0YWJsZScsXHJcbiAgICBjYWxjOiAobW9kOiB0eXBlcy5JTW9kKSA9PiBtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVN0YXR1cyxcclxuICAgIGN1c3RvbVJlbmRlcmVyOiAobW9kOiB0eXBlcy5JTW9kLCBkZXRhaWxDZWxsOiBib29sZWFuLCB0OiB0eXBlcy5URnVuY3Rpb24pID0+IHtcclxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tcGF0aWJpbGl0eUljb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdCwgbW9kLCBkZXRhaWxDZWxsIH0sIFtdKTtcclxuICAgIH0sXHJcbiAgICBuYW1lOiAnQ29tcGF0aWJpbGl0eScsXHJcbiAgICBpc0RlZmF1bHRWaXNpYmxlOiB0cnVlLFxyXG4gICAgZWRpdDoge30sXHJcbiAgfSk7XHJcblxyXG4gIC8qXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3Nkdi1taXNzaW5nLWRlcGVuZGVuY2llcycsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gdGVzdE1pc3NpbmdEZXBlbmRlbmNpZXMoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSk7XHJcbiAgKi9cclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LWluY29tcGF0aWJsZS1tb2RzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RTTUFQSU91dGRhdGVkKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpKTtcclxuXHJcbiAgaW50ZXJmYWNlIElBZGRlZEZpbGUge1xyXG4gICAgZmlsZVBhdGg6IHN0cmluZztcclxuICAgIGNhbmRpZGF0ZXM6IHN0cmluZ1tdO1xyXG4gIH1cclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnN0IHByb3h5ID0gbmV3IFNNQVBJUHJveHkoY29udGV4dC5hcGkpO1xyXG4gICAgY29udGV4dC5hcGkuc2V0U3R5bGVzaGVldCgnc2R2JywgcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NkdnN0eWxlLnNjc3MnKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuYWRkTWV0YVNlcnZlcignc21hcGkuaW8nLCB7XHJcbiAgICAgIHVybDogJycsXHJcbiAgICAgIGxvb3BiYWNrQ0I6IChxdWVyeTogSVF1ZXJ5KSA9PiBCbHVlYmlyZC5yZXNvbHZlKHByb3h5LmZpbmQocXVlcnkpKSxcclxuICAgICAgY2FjaGVEdXJhdGlvblNlYzogODY0MDAsXHJcbiAgICAgIHByaW9yaXR5OiAyNSxcclxuICAgIH0pO1xyXG4gICAgZGVwZW5kZW5jeU1hbmFnZXIgPSBuZXcgRGVwZW5kZW5jeU1hbmFnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnYWRkZWQtZmlsZXMnLCBhc3luYyAocHJvZmlsZUlkLCBmaWxlczogSUFkZGVkRmlsZVtdKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG5cclxuICAgICAgYXdhaXQgQmx1ZWJpcmQubWFwKGZpbGVzLCBhc3luYyBlbnRyeSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcclxuICAgICAgICAgIGlmIChmcm9tID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXHJcbiAgICAgICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVzb2x2ZSBtb2QgcGF0aCBmb3IgbW9kIHR5cGUnLCBtb2QudHlwZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGZyb20sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXHJcbiAgICAgICAgICAvLyBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3QgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ2FyZSB0aGUgc2FtZSBmaWxlJykpIHtcclxuICAgICAgICAgICAgICAvLyBzaG91bGQgd2UgYmUgcmVwb3J0aW5nIHRoaXMgdG8gdGhlIHVzZXI/IFRoaXMgaXMgYSBjb21wbGV0ZWx5XHJcbiAgICAgICAgICAgICAgLy8gYXV0b21hdGVkIHByb2Nlc3MgYW5kIGlmIGl0IGZhaWxzIG1vcmUgb2Z0ZW4gdGhhbiBub3QgdGhlXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBwcm9iYWJseSBkb2Vzbid0IGNhcmVcclxuICAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZS1pbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcclxuICAgICAgY29uc3QgcHJpbWFyeVRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnaW50ZXJmYWNlJywgJ3ByaW1hcnlUb29sJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCAnc21hcGknKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pXHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QoY29udGV4dC5hcGkpO1xyXG4gICAgICBjb25zdCBwcmltYXJ5VG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdpbnRlcmZhY2UnLCAncHJpbWFyeVRvb2wnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNtYXBpTW9kICYmIHByaW1hcnlUb29sID09PSAnc21hcGknKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCB1bmRlZmluZWQpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdkaWQtaW5zdGFsbC1tb2QnLCAoZ2FtZUlkOiBzdHJpbmcsIGFyY2hpdmVJZDogc3RyaW5nLCBtb2RJZDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdXBkYXRlQ29uZmxpY3RJbmZvKGNvbnRleHQuYXBpLCBwcm94eSwgZ2FtZUlkLCBtb2RJZClcclxuICAgICAgICAudGhlbigoKSA9PiBsb2coJ2RlYnVnJywgJ2FkZGVkIGNvbXBhdGliaWxpdHkgaW5mbycsIHsgbW9kSWQgfSkpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBhZGQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBsb2coJ2RlYnVnJywgJ3VwZGF0aW5nIFNEViBjb21wYXRpYmlsaXR5IGluZm8nKTtcclxuICAgICAgUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoc3RhdGUucGVyc2lzdGVudC5tb2RzW2dhbWVNb2RlXSkubWFwKG1vZElkID0+XHJcbiAgICAgICAgdXBkYXRlQ29uZmxpY3RJbmZvKGNvbnRleHQuYXBpLCBwcm94eSwgZ2FtZU1vZGUsIG1vZElkKSkpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdkb25lIHVwZGF0aW5nIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byB1cGRhdGUgY29uZmxpY3QgaW5mbycsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbml0O1xyXG4iXX0=