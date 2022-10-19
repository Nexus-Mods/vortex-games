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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFFaEMsa0RBQTBCO0FBQzFCLCtDQUFpQztBQUNqQywwREFBa0M7QUFDbEMsMkNBQXNFO0FBQ3RFLHdEQUEwQztBQUMxQyw0RUFBb0Q7QUFDcEQsMkNBQW9EO0FBRXBELDRFQUFvRDtBQUNwRCw4REFBc0M7QUFDdEMsbUNBQTRDO0FBQzVDLG1DQUFtSDtBQUNuSCxpQ0FBdUM7QUFFdkMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUMxQixFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDbkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFDL0IsRUFBRSxRQUFRLEVBQUUsR0FBRyxpQkFBSSxFQUNuQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUNqRSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVwQyxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNyRCxNQUFNLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQztBQUMxQyxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyxDQUFDLHFCQUFxQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRTFELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDOUUsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO0lBQzFCLE9BQU8sS0FBSyxD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RUFBRSxDQUFDLFFBQWdCLEVBQUUsRUFBRTs7WUFDL0QsSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFO2dCQUN4QixPQUFPO2FBQ1I7WUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztZQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBQSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsbUNBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQ3pFLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUN4RCxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBJUXVlcnkgfSBmcm9tICdtb2RtZXRhLWRiJztcclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB1dGlsLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgKiBhcyB3aW5hcGkgZnJvbSAnd2luYXBpLWJpbmRpbmdzJztcclxuaW1wb3J0IENvbXBhdGliaWxpdHlJY29uIGZyb20gJy4vQ29tcGF0aWJpbGl0eUljb24nO1xyXG5pbXBvcnQgeyBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kgfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgRGVwZW5kZW5jeU1hbmFnZXIgZnJvbSAnLi9EZXBlbmRlbmN5TWFuYWdlcic7XHJcbmltcG9ydCBTTUFQSVByb3h5IGZyb20gJy4vc21hcGlQcm94eSc7XHJcbmltcG9ydCB7IHRlc3RTTUFQSU91dGRhdGVkIH0gZnJvbSAnLi90ZXN0cyc7XHJcbmltcG9ydCB7IGNvbXBhdGliaWxpdHlPcHRpb25zLCBDb21wYXRpYmlsaXR5U3RhdHVzLCBJU0RWRGVwZW5kZW5jeSwgSVNEVk1vZE1hbmlmZXN0LCBJU01BUElSZXN1bHQgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgcGFyc2VNYW5pZmVzdCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpLFxyXG4gIHsgY2xpcGJvYXJkIH0gPSByZXF1aXJlKCdlbGVjdHJvbicpLFxyXG4gIHJqc29uID0gcmVxdWlyZSgncmVsYXhlZC1qc29uJyksXHJcbiAgeyBTZXZlblppcCB9ID0gdXRpbCxcclxuICB7IGRlcGxveVNNQVBJLCBkb3dubG9hZFNNQVBJLCBmaW5kU01BUElNb2QgfSA9IHJlcXVpcmUoJy4vU01BUEknKSxcclxuICB7IEdBTUVfSUQgfSA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XHJcblxyXG5jb25zdCBNQU5JRkVTVF9GSUxFID0gJ21hbmlmZXN0Lmpzb24nO1xyXG5jb25zdCBQVFJOX0NPTlRFTlQgPSBwYXRoLnNlcCArICdDb250ZW50JyArIHBhdGguc2VwO1xyXG5jb25zdCBTTUFQSV9FWEUgPSAnU3RhcmRld01vZGRpbmdBUEkuZXhlJztcclxuY29uc3QgU01BUElfRExMID0gJ1NNQVBJLkluc3RhbGxlci5kbGwnO1xyXG5jb25zdCBTTUFQSV9EQVRBID0gWyd3aW5kb3dzLWluc3RhbGwuZGF0JywgJ2luc3RhbGwuZGF0J107XHJcblxyXG5jb25zdCBfU01BUElfQlVORExFRF9NT0RTID0gWydFcnJvckhhbmRsZXInLCAnQ29uc29sZUNvbW1hbmRzJywgJ1NhdmVCYWNrdXAnXTtcclxuY29uc3QgZ2V0QnVuZGxlZE1vZHMgPSAoKSA9PiB7XHJcbiAgcmV0dXJuIEFycmF5LmZyb20obmV3IFNldChfU01BUElfQlVORExFRF9NT0RTLm1hcChtb2ROYW1lID0+IG1vZE5hbWUudG9Mb3dlckNhc2UoKSkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmNsYXNzIFN0YXJkZXdWYWxsZXkgaW1wbGVtZW50cyB0eXBlcy5JR2FtZSB7XHJcbiAgcHVibGljIGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0O1xyXG4gIHB1YmxpYyBpZDogc3RyaW5nID0gR0FNRV9JRDtcclxuICBwdWJsaWMgbmFtZTogc3RyaW5nID0gJ1N0YXJkZXcgVmFsbGV5JztcclxuICBwdWJsaWMgbG9nbzogc3RyaW5nID0gJ2dhbWVhcnQuanBnJztcclxuICBwdWJsaWMgcmVxdWlyZWRGaWxlczogc3RyaW5nW107XHJcbiAgcHVibGljIGVudmlyb25tZW50OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xyXG4gICAgU3RlYW1BUFBJZDogJzQxMzE1MCcsXHJcbiAgfTtcclxuICBwdWJsaWMgZGV0YWlsczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHtcclxuICAgIHN0ZWFtQXBwSWQ6IDQxMzE1MFxyXG4gIH07XHJcbiAgcHVibGljIHN1cHBvcnRlZFRvb2xzOiBhbnlbXSA9IFtcclxuICAgIHtcclxuICAgICAgaWQ6ICdzbWFwaScsXHJcbiAgICAgIG5hbWU6ICdTTUFQSScsXHJcbiAgICAgIGxvZ286ICdzbWFwaS5wbmcnLFxyXG4gICAgICBleGVjdXRhYmxlOiAoKSA9PiBTTUFQSV9FWEUsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtTTUFQSV9FWEVdLFxyXG4gICAgICBzaGVsbDogdHJ1ZSxcclxuICAgICAgZXhjbHVzaXZlOiB0cnVlLFxyXG4gICAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgICAgZGVmYXVsdFByaW1hcnk6IHRydWUsXHJcbiAgICB9XHJcbiAgXTtcclxuICBwdWJsaWMgbWVyZ2VNb2RzOiBib29sZWFuID0gdHJ1ZTtcclxuICBwdWJsaWMgcmVxdWlyZXNDbGVhbnVwOiBib29sZWFuID0gdHJ1ZTtcclxuICBwdWJsaWMgc2hlbGw6IGJvb2xlYW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xyXG4gIHB1YmxpYyBkZWZhdWx0UGF0aHM6IHN0cmluZ1tdO1xyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogVm9ydGV4IEFQSVxyXG4gICoqKioqKioqKi9cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3QgYW4gaW5zdGFuY2UuXHJcbiAgICogQHBhcmFtIHtJRXh0ZW5zaW9uQ29udGV4dH0gY29udGV4dCAtLSBUaGUgVm9ydGV4IGV4dGVuc2lvbiBjb250ZXh0LlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgICAvLyBwcm9wZXJ0aWVzIHVzZWQgYnkgVm9ydGV4XHJcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgdGhpcy5yZXF1aXJlZEZpbGVzID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInXHJcbiAgICAgID8gWydTdGFyZGV3IFZhbGxleS5leGUnXVxyXG4gICAgICA6IFsnU3RhcmRld1ZhbGxleScsICdTdGFyZGV3VmFsbGV5LmV4ZSddO1xyXG5cclxuICAgIC8vIGN1c3RvbSBwcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmRlZmF1bHRQYXRocyA9IFtcclxuICAgICAgLy8gTGludXhcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvR09HIEdhbWVzL1N0YXJkZXcgVmFsbGV5L2dhbWUnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy8ubG9jYWwvc2hhcmUvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleScsXHJcblxyXG4gICAgICAvLyBNYWNcclxuICAgICAgJy9BcHBsaWNhdGlvbnMvU3RhcmRldyBWYWxsZXkuYXBwL0NvbnRlbnRzL01hY09TJyxcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0L1N0ZWFtL3N0ZWFtYXBwcy9jb21tb24vU3RhcmRldyBWYWxsZXkvQ29udGVudHMvTWFjT1MnLFxyXG5cclxuICAgICAgLy8gV2luZG93c1xyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxHYWxheHlDbGllbnRcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxHT0cgR2FsYXh5XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcU3RlYW1cXFxcc3RlYW1hcHBzXFxcXGNvbW1vblxcXFxTdGFyZGV3IFZhbGxleSdcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBc3luY2hyb25vdXNseSBmaW5kIHRoZSBnYW1lIGluc3RhbGwgcGF0aC5cclxuICAgKlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBxdWlja2x5IGFuZCwgaWYgaXQgcmV0dXJucyBhIHZhbHVlLCBpdCBzaG91bGQgZGVmaW5pdGl2ZWx5IGJlIHRoZVxyXG4gICAqIHZhbGlkIGdhbWUgcGF0aC4gVXN1YWxseSB0aGlzIGZ1bmN0aW9uIHdpbGwgcXVlcnkgdGhlIHBhdGggZnJvbSB0aGUgcmVnaXN0cnkgb3IgZnJvbSBzdGVhbS5cclxuICAgKiBUaGlzIGZ1bmN0aW9uIG1heSByZXR1cm4gYSBwcm9taXNlIGFuZCBpdCBzaG91bGQgZG8gdGhhdCBpZiBpdCdzIGRvaW5nIEkvTy5cclxuICAgKlxyXG4gICAqIFRoaXMgbWF5IGJlIGxlZnQgdW5kZWZpbmVkIGJ1dCB0aGVuIHRoZSB0b29sL2dhbWUgY2FuIG9ubHkgYmUgZGlzY292ZXJlZCBieSBzZWFyY2hpbmcgdGhlIGRpc2tcclxuICAgKiB3aGljaCBpcyBzbG93IGFuZCBvbmx5IGhhcHBlbnMgbWFudWFsbHkuXHJcbiAgICovXHJcbiAgcHVibGljIHF1ZXJ5UGF0aCA9IHRvQmx1ZShhc3luYyAoKSA9PiB7XHJcbiAgICAvLyBjaGVjayBTdGVhbVxyXG4gICAgY29uc3QgZ2FtZSA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFsnNDEzMTUwJywgJzE0NTMzNzUyNTMnXSk7XHJcbiAgICBpZiAoZ2FtZSlcclxuICAgICAgcmV0dXJuIGdhbWUuZ2FtZVBhdGg7XHJcblxyXG4gICAgLy8gY2hlY2sgZGVmYXVsdCBwYXRoc1xyXG4gICAgZm9yIChjb25zdCBkZWZhdWx0UGF0aCBvZiB0aGlzLmRlZmF1bHRQYXRocylcclxuICAgIHtcclxuICAgICAgaWYgKGF3YWl0IHRoaXMuZ2V0UGF0aEV4aXN0c0FzeW5jKGRlZmF1bHRQYXRoKSlcclxuICAgICAgICByZXR1cm4gZGVmYXVsdFBhdGg7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgcGF0aCBvZiB0aGUgdG9vbCBleGVjdXRhYmxlIHJlbGF0aXZlIHRvIHRoZSB0b29sIGJhc2UgcGF0aCwgaS5lLiBiaW5hcmllcy9VVDMuZXhlIG9yXHJcbiAgICogVEVTVi5leGUuIFRoaXMgaXMgYSBmdW5jdGlvbiBzbyB0aGF0IHlvdSBjYW4gcmV0dXJuIGRpZmZlcmVudCB0aGluZ3MgYmFzZWQgb24gdGhlIG9wZXJhdGluZ1xyXG4gICAqIHN5c3RlbSBmb3IgZXhhbXBsZSBidXQgYmUgYXdhcmUgdGhhdCBpdCB3aWxsIGJlIGV2YWx1YXRlZCBhdCBhcHBsaWNhdGlvbiBzdGFydCBhbmQgb25seSBvbmNlLFxyXG4gICAqIHNvIHRoZSByZXR1cm4gdmFsdWUgY2FuIG5vdCBkZXBlbmQgb24gdGhpbmdzIHRoYXQgY2hhbmdlIGF0IHJ1bnRpbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGV4ZWN1dGFibGUoKSB7XHJcbiAgICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInXHJcbiAgICAgID8gJ1N0YXJkZXcgVmFsbGV5LmV4ZSdcclxuICAgICAgOiAnU3RhcmRld1ZhbGxleSc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGRlZmF1bHQgZGlyZWN0b3J5IHdoZXJlIG1vZHMgZm9yIHRoaXMgZ2FtZSBzaG91bGQgYmUgc3RvcmVkLlxyXG4gICAqIFxyXG4gICAqIElmIHRoaXMgcmV0dXJucyBhIHJlbGF0aXZlIHBhdGggdGhlbiB0aGUgcGF0aCBpcyB0cmVhdGVkIGFzIHJlbGF0aXZlIHRvIHRoZSBnYW1lIGluc3RhbGxhdGlvblxyXG4gICAqIGRpcmVjdG9yeS4gU2ltcGx5IHJldHVybiBhIGRvdCAoICgpID0+ICcuJyApIGlmIG1vZHMgYXJlIGluc3RhbGxlZCBkaXJlY3RseSBpbnRvIHRoZSBnYW1lXHJcbiAgICogZGlyZWN0b3J5LlxyXG4gICAqLyBcclxuICBwdWJsaWMgcXVlcnlNb2RQYXRoKClcclxuICB7XHJcbiAgICByZXR1cm4gJ01vZHMnO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3B0aW9uYWwgc2V0dXAgZnVuY3Rpb24uIElmIHRoaXMgZ2FtZSByZXF1aXJlcyBzb21lIGZvcm0gb2Ygc2V0dXAgYmVmb3JlIGl0IGNhbiBiZSBtb2RkZWQgKGxpa2VcclxuICAgKiBjcmVhdGluZyBhIGRpcmVjdG9yeSwgY2hhbmdpbmcgYSByZWdpc3RyeSBrZXksIC4uLikgZG8gaXQgaGVyZS4gSXQgd2lsbCBiZSBjYWxsZWQgZXZlcnkgdGltZVxyXG4gICAqIGJlZm9yZSB0aGUgZ2FtZSBtb2RlIGlzIGFjdGl2YXRlZC5cclxuICAgKiBAcGFyYW0ge0lEaXNjb3ZlcnlSZXN1bHR9IGRpc2NvdmVyeSAtLSBiYXNpYyBpbmZvIGFib3V0IHRoZSBnYW1lIGJlaW5nIGxvYWRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0dXAgPSB0b0JsdWUoYXN5bmMgKGRpc2NvdmVyeSkgPT4ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBmb2xkZXIgZm9yIFNNQVBJIG1vZHMgZXhpc3RzLlxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gICAgLy8gc2tpcCBpZiBTTUFQSSBmb3VuZFxyXG4gICAgY29uc3Qgc21hcGlQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBTTUFQSV9FWEUpO1xyXG4gICAgY29uc3Qgc21hcGlGb3VuZCA9IGF3YWl0IHRoaXMuZ2V0UGF0aEV4aXN0c0FzeW5jKHNtYXBpUGF0aCk7XHJcbiAgICBpZiAoc21hcGlGb3VuZClcclxuICAgICAgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKHRoaXMuY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgdGl0bGUgPSBzbWFwaU1vZCA/ICdTTUFQSSBpcyBub3QgZGVwbG95ZWQnIDogJ1NNQVBJIGlzIG5vdCBpbnN0YWxsZWQnO1xyXG4gICAgY29uc3QgYWN0aW9uVGl0bGUgPSBzbWFwaU1vZCA/ICdEZXBsb3knIDogJ0dldCBTTUFQSSc7XHJcbiAgICBjb25zdCBhY3Rpb24gPSAoKSA9PiAoc21hcGlNb2RcclxuICAgICAgPyBkZXBsb3lTTUFQSSh0aGlzLmNvbnRleHQuYXBpKVxyXG4gICAgICA6IGRvd25sb2FkU01BUEkodGhpcy5jb250ZXh0LmFwaSkpXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpKTtcclxuXHJcbiAgICB0aGlzLmNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ3NtYXBpLW1pc3NpbmcnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBtZXNzYWdlOiAnU01BUEkgaXMgcmVxdWlyZWQgdG8gbW9kIFN0YXJkZXcgVmFsbGV5LicsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogYWN0aW9uVGl0bGUsXHJcbiAgICAgICAgICBhY3Rpb24sXHJcbiAgICAgICAgfSxcclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKioqKioqKioqXHJcbiAgKiogSW50ZXJuYWwgbWV0aG9kc1xyXG4gICoqKioqKioqKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgY2hlY2sgd2hldGhlciBhIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGggZXhpc3RzLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gVGhlIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGguXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0UGF0aEV4aXN0c0FzeW5jKHBhdGgpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aCk7XHJcbiAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBjYXRjaChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgcmVhZCBhIHJlZ2lzdHJ5IGtleSB2YWx1ZS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGl2ZSAtIFRoZSByZWdpc3RyeSBoaXZlIHRvIGFjY2Vzcy4gVGhpcyBzaG91bGQgYmUgYSBjb25zdGFudCBsaWtlIFJlZ2lzdHJ5LkhLTE0uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIFRoZSByZWdpc3RyeSBrZXkuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdG8gcmVhZC5cclxuICAgKi9cclxuICBhc3luYyByZWFkUmVnaXN0cnlLZXlBc3luYyhoaXZlLCBrZXksIG5hbWUpXHJcbiAge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoaGl2ZSwga2V5LCBuYW1lKTtcclxuICAgICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RGb2xkZXIoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIFdlIGFzc3VtZSB0aGF0IGFueSBtb2QgY29udGFpbmluZyBcIi9Db250ZW50L1wiIGluIGl0cyBkaXJlY3RvcnlcclxuICAvLyAgc3RydWN0dXJlIGlzIG1lYW50IHRvIGJlIGRlcGxveWVkIHRvIHRoZSByb290IGZvbGRlci5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpKTtcclxuICBjb25zdCBjb250ZW50RGlyID0gZmlsdGVyZWQuZmluZChmaWxlID0+IGZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoY29udGVudERpciAhPT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RGb2xkZXIoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFdlJ3JlIGdvaW5nIHRvIGRlcGxveSBcIi9Db250ZW50L1wiIGFuZCB3aGF0ZXZlciBmb2xkZXJzIGNvbWUgYWxvbmdzaWRlIGl0LlxyXG4gIC8vICBpLmUuIFNvbWVNb2QuN3pcclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Db250ZW50L1xyXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL01vZHMvXHJcbiAgLy8gIFdpbGwgTk9UIGJlIGRlcGxveWVkID0+IC4uL1JlYWRtZS5kb2NcclxuICBjb25zdCBjb250ZW50RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICBjb25zdCBpZHggPSBjb250ZW50RmlsZS5pbmRleE9mKFBUUk5fQ09OVEVOVCkgKyAxO1xyXG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLmJhc2VuYW1lKGNvbnRlbnRGaWxlLnN1YnN0cmluZygwLCBpZHgpKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKVxyXG4gICAgJiYgKGZpbGUuaW5kZXhPZihyb290RGlyKSAhPT0gLTEpXHJcbiAgICAmJiAocGF0aC5leHRuYW1lKGZpbGUpICE9PSAnLnR4dCcpKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc3Vic3RyKGlkeCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KGZpbGVQYXRoKSB7XHJcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICBjb25zdCBpc01hbmlmZXN0RmlsZSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID09PSBNQU5JRkVTVF9GSUxFO1xyXG4gIGNvbnN0IGlzTG9jYWxlID0gc2VnbWVudHMuaW5jbHVkZXMoJ2xvY2FsZScpO1xyXG4gIHJldHVybiBpc01hbmlmZXN0RmlsZSAmJiAhaXNMb2NhbGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWQoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChpc1ZhbGlkTWFuaWZlc3QpICE9PSB1bmRlZmluZWQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgICAgLy8gV2UgY3JlYXRlIGEgcHJlZml4IGZha2UgZGlyZWN0b3J5IGp1c3QgaW4gY2FzZSB0aGUgY29udGVudFxyXG4gICAgICAvLyAgZm9sZGVyIGlzIGluIHRoZSBhcmNoaXZlJ3Mgcm9vdCBmb2xkZXIuIFRoaXMgaXMgdG8gZW5zdXJlIHdlXHJcbiAgICAgIC8vICBmaW5kIGEgbWF0Y2ggZm9yIFwiL0NvbnRlbnQvXCJcclxuICAgICAgY29uc3QgdGVzdEZpbGUgPSBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKTtcclxuICAgICAgcmV0dXJuICh0ZXN0RmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICAgIH0pID09PSB1bmRlZmluZWQpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbChhcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeU1hbmFnZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gVGhlIGFyY2hpdmUgbWF5IGNvbnRhaW4gbXVsdGlwbGUgbWFuaWZlc3QgZmlsZXMgd2hpY2ggd291bGRcclxuICAvLyAgaW1wbHkgdGhhdCB3ZSdyZSBpbnN0YWxsaW5nIG11bHRpcGxlIG1vZHMuXHJcbiAgY29uc3QgbWFuaWZlc3RGaWxlcyA9IGZpbGVzLmZpbHRlcihpc1ZhbGlkTWFuaWZlc3QpO1xyXG5cclxuICBpbnRlcmZhY2UgSU1vZEluZm8ge1xyXG4gICAgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdDtcclxuICAgIHJvb3RGb2xkZXI6IHN0cmluZztcclxuICAgIG1hbmlmZXN0SW5kZXg6IG51bWJlcjtcclxuICAgIG1vZEZpbGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGF3YWl0IGRlcGVuZGVuY3lNYW5hZ2VyLnNjYW5NYW5pZmVzdHModHJ1ZSk7XHJcbiAgY29uc3QgbW9kczogSU1vZEluZm9bXSA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0RmlsZXMubWFwKGFzeW5jIG1hbmlmZXN0RmlsZSA9PiB7XHJcbiAgICBjb25zdCByb290Rm9sZGVyID0gcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdEluZGV4ID0gbWFuaWZlc3RGaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihNQU5JRkVTVF9GSUxFKTtcclxuICAgIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZSkgPT4gKHJvb3RGb2xkZXIgIT09ICcuJylcclxuICAgICAgPyAoKGZpbGUuaW5kZXhPZihyb290Rm9sZGVyKSAhPT0gLTEpXHJcbiAgICAgICAgJiYgKHBhdGguZGlybmFtZShmaWxlKSAhPT0gJy4nKVxyXG4gICAgICAgICYmICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgICAgOiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCk7XHJcbiAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID0gYXdhaXQgcGFyc2VNYW5pZmVzdChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtYW5pZmVzdEZpbGUpKTtcclxuICAgIGNvbnN0IG1vZEZpbGVzID0gZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbWFuaWZlc3QsXHJcbiAgICAgIHJvb3RGb2xkZXIsXHJcbiAgICAgIG1hbmlmZXN0SW5kZXgsXHJcbiAgICAgIG1vZEZpbGVzLFxyXG4gICAgfTtcclxuICB9KSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5tYXAobW9kcywgbW9kID0+IHtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSAobW9kLnJvb3RGb2xkZXIgIT09ICcuJylcclxuICAgICAgPyBtb2Qucm9vdEZvbGRlclxyXG4gICAgICA6IG1vZC5tYW5pZmVzdC5OYW1lO1xyXG5cclxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1vZC5tYW5pZmVzdC5EZXBlbmRlbmNpZXMgfHwgW107XHJcblxyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBtb2QubW9kRmlsZXMpIHtcclxuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4obW9kTmFtZSwgZmlsZS5zdWJzdHIobW9kLm1hbmlmZXN0SW5kZXgpKTtcclxuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhZGRSdWxlRm9yRGVwZW5kZW5jeSA9IChkZXA6IElTRFZEZXBlbmRlbmN5KSA9PiB7XHJcbiAgICAgIGNvbnN0IHZlcnNpb25NYXRjaCA9IGRlcC5NaW5pbXVtVmVyc2lvbiAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgPyBgPj0ke2RlcC5NaW5pbXVtVmVyc2lvbn1gXHJcbiAgICAgICAgOiAnKic7XHJcbiAgICAgIGNvbnN0IHJ1bGU6IHR5cGVzLklNb2RSdWxlID0ge1xyXG4gICAgICAgIHR5cGU6IChkZXAuSXNSZXF1aXJlZCA/PyB0cnVlKSA/ICdyZXF1aXJlcycgOiAncmVjb21tZW5kcycsXHJcbiAgICAgICAgcmVmZXJlbmNlOiB7XHJcbiAgICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgdmVyc2lvbk1hdGNoLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXh0cmE6IHtcclxuICAgICAgICAgIG9ubHlJZkZ1bGZpbGxhYmxlOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH07XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAncnVsZScsXHJcbiAgICAgICAgcnVsZSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KGRlcCk7XHJcbiAgICB9XHJcbiAgICBpZiAobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3kobW9kLm1hbmlmZXN0LkNvbnRlbnRQYWNrRm9yKTtcclxuICAgIH1cclxuICAgIHJldHVybiBpbnN0cnVjdGlvbnM7XHJcbiAgfSlcclxuICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBbXS5jb25jYXQoZGF0YSkucmVkdWNlKChhY2N1bSwgaXRlcikgPT4gYWNjdW0uY29uY2F0KGl0ZXIpLCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNTTUFQSU1vZFR5cGUoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuXHJcbiAgY29uc3Qgc21hcGlEYXRhID0gaW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdCA9PiAoaW5zdC50eXBlID09PSAnY29weScpICYmIGluc3Quc291cmNlLmVuZHNXaXRoKFNNQVBJX0VYRSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShzbWFwaURhdGEgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTTUFQSShmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBkb3dubG9hZCBjb250YWlucyB0aGUgU01BUEkgZGF0YSBhcmNoaXZlLnNcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBTTUFQSV9ETEwpICE9PSB1bmRlZmluZWQpXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgICBzdXBwb3J0ZWQsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IGZvbGRlciA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMidcclxuICAgID8gJ3dpbmRvd3MnXHJcbiAgICA6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCdcclxuICAgICAgPyAnbGludXgnXHJcbiAgICAgIDogJ21hY29zJztcclxuICBjb25zdCBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtID0gKGZpbGUpID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICByZXR1cm4gKHNlZ21lbnRzLmluY2x1ZGVzKGZvbGRlcikpO1xyXG4gIH1cclxuICAvLyBGaW5kIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmVcclxuICBjb25zdCBkYXRhRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBpc0NvcnJlY3RQbGF0Zm9ybSA9IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0oZmlsZSk7XHJcbiAgICByZXR1cm4gaXNDb3JyZWN0UGxhdGZvcm0gJiYgU01BUElfREFUQS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpXHJcbiAgfSk7XHJcbiAgaWYgKGRhdGFGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIGZpbmQgdGhlIFNNQVBJIGRhdGEgZmlsZXMgLSBkb3dubG9hZCBhcHBlYXJzICdcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgbGV0IGRhdGEgPSAnJztcclxuICB0cnkge1xyXG4gICAgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgJ1N0YXJkZXcgVmFsbGV5LmRlcHMuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBTRFYgZGVwZW5kZW5jaWVzJywgZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIGZpbGUgd2lsbCBiZSBvdXRkYXRlZCBhZnRlciB0aGUgd2FsayBvcGVyYXRpb24gc28gcHJlcGFyZSBhIHJlcGxhY2VtZW50LiBcclxuICBjb25zdCB1cGRhdGVkRmlsZXMgPSBbXTtcclxuXHJcbiAgY29uc3Qgc3ppcCA9IG5ldyBTZXZlblppcCgpO1xyXG4gIC8vIFVuemlwIHRoZSBmaWxlcyBmcm9tIHRoZSBkYXRhIGFyY2hpdmUuIFRoaXMgZG9lc24ndCBzZWVtIHRvIGJlaGF2ZSBhcyBkZXNjcmliZWQgaGVyZTogaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvbm9kZS03eiNldmVudHNcclxuICBhd2FpdCBzemlwLmV4dHJhY3RGdWxsKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGRhdGFGaWxlKSwgZGVzdGluYXRpb25QYXRoKTtcclxuXHJcbiAgLy8gRmluZCBhbnkgZmlsZXMgdGhhdCBhcmUgbm90IGluIHRoZSBwYXJlbnQgZm9sZGVyLiBcclxuICBhd2FpdCB1dGlsLndhbGsoZGVzdGluYXRpb25QYXRoLCAoaXRlciwgc3RhdHMpID0+IHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGVzdGluYXRpb25QYXRoLCBpdGVyKTtcclxuICAgICAgLy8gRmlsdGVyIG91dCBmaWxlcyBmcm9tIHRoZSBvcmlnaW5hbCBpbnN0YWxsIGFzIHRoZXkncmUgbm8gbG9uZ2VyIHJlcXVpcmVkLlxyXG4gICAgICBpZiAoIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgpICYmIHN0YXRzLmlzRmlsZSgpICYmICFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoK3BhdGguc2VwKSkgdXBkYXRlZEZpbGVzLnB1c2gocmVsUGF0aCk7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gcmVsUGF0aC50b0xvY2FsZUxvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgY29uc3QgbW9kc0ZvbGRlcklkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgICAgaWYgKChtb2RzRm9sZGVySWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNGb2xkZXJJZHggKyAxKSkge1xyXG4gICAgICAgIF9TTUFQSV9CVU5ETEVEX01PRFMucHVzaChzZWdtZW50c1ttb2RzRm9sZGVySWR4ICsgMV0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGV4ZSBmaWxlLiBcclxuICBjb25zdCBzbWFwaUV4ZSA9IHVwZGF0ZWRGaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKFNNQVBJX0VYRS50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgaWYgKHNtYXBpRXhlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChgRmFpbGVkIHRvIGV4dHJhY3QgJHtTTUFQSV9FWEV9IC0gZG93bmxvYWQgYXBwZWFycyBgXHJcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XHJcbiAgfVxyXG4gIGNvbnN0IGlkeCA9IHNtYXBpRXhlLmluZGV4T2YocGF0aC5iYXNlbmFtZShzbWFwaUV4ZSkpO1xyXG5cclxuICAvLyBCdWlsZCB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBpbnN0YWxsYXRpb24uIFxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSB1cGRhdGVkRmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihmaWxlLnN1YnN0cihpZHgpKSxcclxuICAgICAgfVxyXG4gIH0pO1xyXG5cclxuICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgIGtleTogJ3NtYXBpQnVuZGxlZE1vZHMnLFxyXG4gICAgdmFsdWU6IGdldEJ1bmRsZWRNb2RzKCksXHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdnZW5lcmF0ZWZpbGUnLFxyXG4gICAgZGF0YSxcclxuICAgIGRlc3RpbmF0aW9uOiAnU3RhcmRld01vZGRpbmdBUEkuZGVwcy5qc29uJyxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIGxvZ0ZpbGUpIHtcclxuICBjb25zdCBsb2dEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsIGxvZ0ZpbGUpLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xyXG4gIGF3YWl0IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1NNQVBJIExvZycsIHtcclxuICAgIHRleHQ6ICdZb3VyIFNNQVBJIGxvZyBpcyBkaXNwbGF5ZWQgYmVsb3cuIFRvIHNoYXJlIGl0LCBjbGljayBcIkNvcHkgJiBTaGFyZVwiIHdoaWNoIHdpbGwgY29weSBpdCB0byB5b3VyIGNsaXBib2FyZCBhbmQgb3BlbiB0aGUgU01BUEkgbG9nIHNoYXJpbmcgd2Vic2l0ZS4gJyArXHJcbiAgICAgICdOZXh0LCBwYXN0ZSB5b3VyIGNvZGUgaW50byB0aGUgdGV4dCBib3ggYW5kIHByZXNzIFwic2F2ZSAmIHBhcnNlIGxvZ1wiLiBZb3UgY2FuIG5vdyBzaGFyZSBhIGxpbmsgdG8gdGhpcyBwYWdlIHdpdGggb3RoZXJzIHNvIHRoZXkgY2FuIHNlZSB5b3VyIGxvZyBmaWxlLlxcblxcbicgKyBsb2dEYXRhXHJcbiAgfSwgW3tcclxuICAgIGxhYmVsOiAnQ29weSAmIFNoYXJlIGxvZycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvXi4rVChbXlxcLl0rKS4rLywgJyQxJyk7XHJcbiAgICAgIGNsaXBib2FyZC53cml0ZVRleHQoYFske3RpbWVzdGFtcH0gSU5GTyBWb3J0ZXhdIExvZyBleHBvcnRlZCBieSBWb3J0ZXggJHt1dGlsLmdldEFwcGxpY2F0aW9uKCkudmVyc2lvbn0uXFxuYCArIGxvZ0RhdGEpO1xyXG4gICAgICByZXR1cm4gdXRpbC5vcG4oJ2h0dHBzOi8vc21hcGkuaW8vbG9nJykuY2F0Y2goZXJyID0+IHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgfSwgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiB1bmRlZmluZWQgfV0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvblNob3dTTUFQSUxvZyhhcGkpIHtcclxuICAvL1JlYWQgYW5kIGRpc3BsYXkgdGhlIGxvZy5cclxuICBjb25zdCBiYXNlUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJ3N0YXJkZXd2YWxsZXknLCAnZXJyb3Jsb2dzJyk7XHJcbiAgdHJ5IHtcclxuICAgIC8vSWYgdGhlIGNyYXNoIGxvZyBleGlzdHMsIHNob3cgdGhhdC5cclxuICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWNyYXNoLnR4dFwiKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vT3RoZXJ3aXNlIHNob3cgdGhlIG5vcm1hbCBsb2cuXHJcbiAgICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWxhdGVzdC50eHRcIik7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy9PciBJbmZvcm0gdGhlIHVzZXIgdGhlcmUgYXJlIG5vIGxvZ3MuXHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHsgdHlwZTogJ2luZm8nLCB0aXRsZTogJ05vIFNNQVBJIGxvZ3MgZm91bmQuJywgbWVzc2FnZTogJycsIGRpc3BsYXlNUzogNTAwMCB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGNvbnN0IG1hbmlmZXN0czogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgaWYgKG1vZFBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdHVyYm93YWxrKG1vZFBhdGgsIGFzeW5jIGVudHJpZXMgPT4ge1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gJ21hbmlmZXN0Lmpzb24nKSB7XHJcbiAgICAgICAgbWFuaWZlc3RzLnB1c2goZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgeyBza2lwSGlkZGVuOiBmYWxzZSwgcmVjdXJzZTogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXHJcbiAgICAudGhlbigoKSA9PiBtYW5pZmVzdHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVDb25mbGljdEluZm8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcGk6IFNNQVBJUHJveHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkOiBzdHJpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IG1vZCA9IGFwaS5nZXRTdGF0ZSgpLnBlcnNpc3RlbnQubW9kc1tnYW1lSWRdW21vZElkXTtcclxuXHJcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgaWYgKChub3cgLSBtb2QuYXR0cmlidXRlcz8ubGFzdFNNQVBJUXVlcnkgPz8gMCkgPCBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGxldCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IG1vZC5hdHRyaWJ1dGVzPy5hZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcztcclxuICBpZiAoYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKG1vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWUpIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbbW9kLmF0dHJpYnV0ZXM/LmxvZ2ljYWxGaWxlTmFtZV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcXVlcnkgPSBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lc1xyXG4gICAgLm1hcChuYW1lID0+ICh7XHJcbiAgICAgIGlkOiBuYW1lLFxyXG4gICAgICBpbnN0YWxsZWRWZXJzaW9uOiBtb2QuYXR0cmlidXRlcz8ubWFuaWZlc3RWZXJzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgID8/IHNlbXZlci5jb2VyY2UobW9kLmF0dHJpYnV0ZXM/LnZlcnNpb24pLnZlcnNpb24sXHJcbiAgICB9KSk7XHJcblxyXG4gIGNvbnN0IHN0YXQgPSAoaXRlbTogSVNNQVBJUmVzdWx0KTogQ29tcGF0aWJpbGl0eVN0YXR1cyA9PiB7XHJcbiAgICBjb25zdCBzdGF0dXMgPSBpdGVtLm1ldGFkYXRhPy5jb21wYXRpYmlsaXR5U3RhdHVzPy50b0xvd2VyQ2FzZT8uKCk7XHJcbiAgICBpZiAoIWNvbXBhdGliaWxpdHlPcHRpb25zLmluY2x1ZGVzKHN0YXR1cyBhcyBhbnkpKSB7XHJcbiAgICAgIHJldHVybiAndW5rbm93bic7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc3RhdHVzIGFzIENvbXBhdGliaWxpdHlTdGF0dXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgY29tcGF0aWJpbGl0eVByaW8gPSAoaXRlbTogSVNNQVBJUmVzdWx0KSA9PiBjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmRleE9mKHN0YXQoaXRlbSkpO1xyXG5cclxuICByZXR1cm4gc21hcGkuZmluZEJ5TmFtZXMocXVlcnkpXHJcbiAgICAudGhlbihyZXN1bHRzID0+IHtcclxuICAgICAgY29uc3Qgd29yc3RTdGF0dXM6IElTTUFQSVJlc3VsdFtdID0gcmVzdWx0c1xyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gY29tcGF0aWJpbGl0eVByaW8obGhzKSAtIGNvbXBhdGliaWxpdHlQcmlvKHJocykpO1xyXG4gICAgICBpZiAod29yc3RTdGF0dXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZXMoZ2FtZUlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgbGFzdFNNQVBJUXVlcnk6IG5vdyxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlTdGF0dXM6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5TWVzc2FnZTogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN1bW1hcnksXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5VXBkYXRlOiB3b3JzdFN0YXR1c1swXS5zdWdnZXN0ZWRVcGRhdGU/LnZlcnNpb24sXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvZygnZGVidWcnLCAnbm8gbWFuaWZlc3QnKTtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCd3YXJuJywgJ2Vycm9yIHJlYWRpbmcgbWFuaWZlc3QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgbGV0IGRlcGVuZGVuY3lNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcjtcclxuICBjb25zdCBnZXREaXNjb3ZlcnlQYXRoID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXHJcbiAgICAgIGxvZygnZXJyb3InLCAnc3RhcmRld3ZhbGxleSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfVxyXG5cclxuICBjb25zdCBnZXRTTUFQSVBhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9O1xyXG5cclxuICBjb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcclxuICAgIGlmIChtb2Q/LmlkID09PSB1bmRlZmluZWQgfHwgbW9kLnR5cGUgPT09ICdzZHZyb290Zm9sZGVyJykge1xyXG4gICAgICAvLyBUaGVyZSBpcyBubyByZWxpYWJsZSB3YXkgdG8gYXNjZXJ0YWluIHdoZXRoZXIgYSBuZXcgZmlsZSBlbnRyeVxyXG4gICAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcclxuICAgICAgLy8gIGFzIHJlcGxhY2VtZW50IG1vZHMuIFRoaXMgb2J2aW91c2x5IG1lYW5zIHRoYXQgaWYgdGhlIGdhbWUgaGFzXHJcbiAgICAgIC8vICBhIHN1YnN0YW50aWFsIHVwZGF0ZSB3aGljaCBpbnRyb2R1Y2VzIG5ldyBmaWxlcyB3ZSBjb3VsZCBwb3RlbnRpYWxseVxyXG4gICAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxyXG4gICAgICAvLyAgY29udGVudGlvbiBiZXR3ZWVuIHRoZSBnYW1lIGl0c2VsZiAod2hlbiBpdCB1cGRhdGVzKSBhbmQgdGhlIG1vZC5cclxuICAgICAgLy9cclxuICAgICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXHJcbiAgICAgIC8vICBtb2RzLCB3aGljaCBpcyB3aHkgaXQncyBub3Qgc2FmZSB0byBhc3N1bWUgdGhhdCBhbnkgYWRkaXRpb24gaW5zaWRlIHRoZVxyXG4gICAgICAvLyAgbW9kcyBkaXJlY3RvcnkgY2FuIGJlIHNhZmVseSBhZGRlZCB0byB0aGlzIG1vZCdzIHN0YWdpbmcgZm9sZGVyIGVpdGhlci5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChtb2QudHlwZSAhPT0gJ1NNQVBJJykge1xyXG4gICAgICAvLyBPdGhlciBtb2QgdHlwZXMgZG8gbm90IHJlcXVpcmUgZnVydGhlciB2YWxpZGF0aW9uIC0gaXQgc2hvdWxkIGJlIGZpbmVcclxuICAgICAgLy8gIHRvIGFkZCB0aGlzIGVudHJ5LlxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgY29uc3QgbW9kc1NlZ0lkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgIGNvbnN0IG1vZEZvbGRlck5hbWUgPSAoKG1vZHNTZWdJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc1NlZ0lkeCArIDEpKVxyXG4gICAgICA/IHNlZ21lbnRzW21vZHNTZWdJZHggKyAxXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICBsZXQgYnVuZGxlZE1vZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnc21hcGlCdW5kbGVkTW9kcyddLCBbXSk7XHJcbiAgICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XHJcbiAgICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ2NvbnRlbnQnKSkge1xyXG4gICAgICAvLyBTTUFQSSBpcyBub3Qgc3VwcG9zZWQgdG8gb3ZlcndyaXRlIHRoZSBnYW1lJ3MgY29udGVudCBkaXJlY3RseS5cclxuICAgICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKG1vZEZvbGRlck5hbWUgIT09IHVuZGVmaW5lZCkgJiYgYnVuZGxlZE1vZHMuaW5jbHVkZXMobW9kRm9sZGVyTmFtZSk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWFuaWZlc3RFeHRyYWN0b3IgPSB0b0JsdWUoXHJcbiAgICBhc3luYyAobW9kSW5mbzogYW55LCBtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueTsgfT4gPT4ge1xyXG4gICAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aCk7XHJcbiAgICAgIGlmIChtYW5pZmVzdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHBhcnNlZE1hbmlmZXN0cyA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0cy5tYXAoXHJcbiAgICAgICAgYXN5bmMgbWFuID0+IGF3YWl0IHBhcnNlTWFuaWZlc3QobWFuKSkpO1xyXG5cclxuICAgICAgLy8gd2UgY2FuIG9ubHkgdXNlIG9uZSBtYW5pZmVzdCB0byBnZXQgdGhlIGlkIGZyb21cclxuICAgICAgY29uc3QgcmVmTWFuaWZlc3QgPSBwYXJzZWRNYW5pZmVzdHNbMF07XHJcblxyXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIGNvbnN0IG1pblNNQVBJVmVyc2lvbiA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuTWluaW11bUFwaVZlcnNpb24pXHJcbiAgICAgICAgLmZpbHRlcih2ZXJzaW9uID0+IHNlbXZlci52YWxpZCh2ZXJzaW9uKSlcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IHNlbXZlci5jb21wYXJlKHJocywgbGhzKSlbMF07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSB7XHJcbiAgICAgICAgY3VzdG9tRmlsZU5hbWU6IHJlZk1hbmlmZXN0Lk5hbWUsXHJcbiAgICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMsXHJcbiAgICAgICAgbWluU01BUElWZXJzaW9uLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKHR5cGVvZihyZWZNYW5pZmVzdC5WZXJzaW9uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXN1bHRbJ21hbmlmZXN0VmVyc2lvbiddID0gcmVmTWFuaWZlc3QuVmVyc2lvbjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBTdGFyZGV3VmFsbGV5KGNvbnRleHQpKTtcclxuICAvLyBSZWdpc3RlciBvdXIgU01BUEkgbW9kIHR5cGUgYW5kIGluc3RhbGxlci4gTm90ZTogVGhpcyBjdXJyZW50bHkgZmxhZ3MgYW4gZXJyb3IgaW4gVm9ydGV4IG9uIGluc3RhbGxpbmcgY29ycmVjdGx5LlxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NtYXBpLWluc3RhbGxlcicsIDMwLCB0ZXN0U01BUEksIChmaWxlcywgZGVzdCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3QpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ1NNQVBJJywgMzAsIGdhbWVJZCA9PiBnYW1lSWQgPT09IEdBTUVfSUQsIGdldFNNQVBJUGF0aCwgaXNTTUFQSU1vZFR5cGUpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3N0YXJkZXctdmFsbGV5LWluc3RhbGxlcicsIDUwLCB0ZXN0U3VwcG9ydGVkLFxyXG4gICAgKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2R2cm9vdGZvbGRlcicsIDUwLCB0ZXN0Um9vdEZvbGRlciwgaW5zdGFsbFJvb3RGb2xkZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdzZHZyb290Zm9sZGVyJywgMjUsIChnYW1lSWQpID0+IChnYW1lSWQgPT09IEdBTUVfSUQpLFxyXG4gICAgKCkgPT4gZ2V0RGlzY292ZXJ5UGF0aCgpLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XHJcbiAgICAgIC8vIE9ubHkgaW50ZXJlc3RlZCBpbiBjb3B5IGluc3RydWN0aW9ucy5cclxuICAgICAgY29uc3QgY29weUluc3RydWN0aW9ucyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gaW5zdHIudHlwZSA9PT0gJ2NvcHknKTtcclxuICAgICAgLy8gVGhpcyBpcyBhIHRyaWNreSBwYXR0ZXJuIHNvIHdlJ3JlIGdvaW5nIHRvIDFzdCBwcmVzZW50IHRoZSBkaWZmZXJlbnQgcGFja2FnaW5nXHJcbiAgICAgIC8vICBwYXR0ZXJucyB3ZSBuZWVkIHRvIGNhdGVyIGZvcjpcclxuICAgICAgLy8gIDEuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlci4gRG9lcyBub3QgcmVxdWlyZSBTTUFQSSBzbyBub1xyXG4gICAgICAvLyAgICBtYW5pZmVzdCBmaWxlcyBhcmUgaW5jbHVkZWQuXHJcbiAgICAgIC8vICAyLiBSZXBsYWNlbWVudCBtb2Qgd2l0aCBcIkNvbnRlbnRcIiBmb2xkZXIgKyBvbmUgb3IgbW9yZSBTTUFQSSBtb2RzIGluY2x1ZGVkXHJcbiAgICAgIC8vICAgIGFsb25nc2lkZSB0aGUgQ29udGVudCBmb2xkZXIgaW5zaWRlIGEgXCJNb2RzXCIgZm9sZGVyLlxyXG4gICAgICAvLyAgMy4gQSByZWd1bGFyIFNNQVBJIG1vZCB3aXRoIGEgXCJDb250ZW50XCIgZm9sZGVyIGluc2lkZSB0aGUgbW9kJ3Mgcm9vdCBkaXIuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIHBhdHRlcm4gMTpcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGRvbid0IGhhdmUgbWFuaWZlc3QgZmlsZXNcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGhhdmUgYSBcIkNvbnRlbnRcIiBmb2xkZXJcclxuICAgICAgLy9cclxuICAgICAgLy8gVG8gc29sdmUgcGF0dGVybnMgMiBhbmQgMyB3ZSdyZSBnb2luZyB0bzpcclxuICAgICAgLy8gIENoZWNrIHdoZXRoZXIgd2UgaGF2ZSBhbnkgbWFuaWZlc3QgZmlsZXMsIGlmIHdlIGRvLCB3ZSBleHBlY3QgdGhlIGZvbGxvd2luZ1xyXG4gICAgICAvLyAgICBhcmNoaXZlIHN0cnVjdHVyZSBpbiBvcmRlciBmb3IgdGhlIG1vZFR5cGUgdG8gZnVuY3Rpb24gY29ycmVjdGx5OlxyXG4gICAgICAvLyAgICBhcmNoaXZlLnppcCA9PlxyXG4gICAgICAvLyAgICAgIC4uL0NvbnRlbnQvXHJcbiAgICAgIC8vICAgICAgLi4vTW9kcy9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL0FfU01BUElfTU9EXFxtYW5pZmVzdC5qc29uXHJcbiAgICAgIGNvbnN0IGhhc01hbmlmZXN0ID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uZW5kc1dpdGgoTUFOSUZFU1RfRklMRSkpXHJcbiAgICAgIGNvbnN0IGhhc01vZHNGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5zdGFydHNXaXRoKCdNb2RzJyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgaGFzQ29udGVudEZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ0NvbnRlbnQnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkXHJcblxyXG4gICAgICByZXR1cm4gKGhhc01hbmlmZXN0KVxyXG4gICAgICAgID8gQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyICYmIGhhc01vZHNGb2xkZXIpXHJcbiAgICAgICAgOiBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDk5OSwgJ2NoYW5nZWxvZycsIHt9LCAnU01BUEkgTG9nJyxcclxuICAgICgpID0+IHsgb25TaG93U01BUElMb2coY29udGV4dC5hcGkpOyB9LFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICAvL09ubHkgc2hvdyB0aGUgU01BUEkgbG9nIGJ1dHRvbiBmb3IgU0RWLiBcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcclxuICAgIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQXR0cmlidXRlRXh0cmFjdG9yKDI1LCBtYW5pZmVzdEV4dHJhY3Rvcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJUYWJsZUF0dHJpYnV0ZSgnbW9kcycsIHtcclxuICAgIGlkOiAnc2R2LWNvbXBhdGliaWxpdHknLFxyXG4gICAgcG9zaXRpb246IDEwMCxcclxuICAgIGNvbmRpdGlvbjogKCkgPT4gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSA9PT0gR0FNRV9JRCxcclxuICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcclxuICAgIGNhbGM6IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgY3VzdG9tUmVuZGVyZXI6IChtb2Q6IHR5cGVzLklNb2QsIGRldGFpbENlbGw6IGJvb2xlYW4sIHQ6IHR5cGVzLlRGdW5jdGlvbikgPT4ge1xyXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb21wYXRpYmlsaXR5SWNvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0LCBtb2QsIGRldGFpbENlbGwgfSwgW10pO1xyXG4gICAgfSxcclxuICAgIG5hbWU6ICdDb21wYXRpYmlsaXR5JyxcclxuICAgIGlzRGVmYXVsdFZpc2libGU6IHRydWUsXHJcbiAgICBlZGl0OiB7fSxcclxuICB9KTtcclxuXHJcbiAgLypcclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LW1pc3NpbmctZGVwZW5kZW5jaWVzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiB0ZXN0TWlzc2luZ0RlcGVuZGVuY2llcyhjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKTtcclxuICAqL1xyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtaW5jb21wYXRpYmxlLW1vZHMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdFNNQVBJT3V0ZGF0ZWQoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSkpO1xyXG5cclxuICBpbnRlcmZhY2UgSUFkZGVkRmlsZSB7XHJcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xyXG4gICAgY2FuZGlkYXRlczogc3RyaW5nW107XHJcbiAgfVxyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29uc3QgcHJveHkgPSBuZXcgU01BUElQcm94eShjb250ZXh0LmFwaSk7XHJcbiAgICBjb250ZXh0LmFwaS5zZXRTdHlsZXNoZWV0KCdzZHYnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnc2R2c3R5bGUuc2NzcycpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5hZGRNZXRhU2VydmVyKCdzbWFwaS5pbycsIHtcclxuICAgICAgdXJsOiAnJyxcclxuICAgICAgbG9vcGJhY2tDQjogKHF1ZXJ5OiBJUXVlcnkpID0+IEJsdWViaXJkLnJlc29sdmUocHJveHkuZmluZChxdWVyeSkpLFxyXG4gICAgICBjYWNoZUR1cmF0aW9uU2VjOiA4NjQwMCxcclxuICAgICAgcHJpb3JpdHk6IDI1LFxyXG4gICAgfSk7XHJcbiAgICBkZXBlbmRlbmN5TWFuYWdlciA9IG5ldyBEZXBlbmRlbmN5TWFuYWdlcihjb250ZXh0LmFwaSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzOiBJQWRkZWRGaWxlW10pID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcblxyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIGVudHJ5ID0+IHtcclxuICAgICAgICAvLyBvbmx5IGFjdCBpZiB3ZSBkZWZpbml0aXZlbHkga25vdyB3aGljaCBtb2Qgb3ducyB0aGUgZmlsZVxyXG4gICAgICAgIGlmIChlbnRyeS5jYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLnBlcnNpc3RlbnQubW9kcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbR0FNRV9JRCwgZW50cnkuY2FuZGlkYXRlc1swXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGlmICghaXNNb2RDYW5kaWRhdGVWYWxpZChtb2QsIGVudHJ5KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBmcm9tID0gbW9kUGF0aHNbbW9kLnR5cGUgPz8gJyddO1xyXG4gICAgICAgICAgaWYgKGZyb20gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyBIb3cgaXMgdGhpcyBldmVuIHBvc3NpYmxlPyByZWdhcmRsZXNzIGl0J3Mgbm90IHRoaXNcclxuICAgICAgICAgICAgLy8gIGZ1bmN0aW9uJ3Mgam9iIHRvIHJlcG9ydCB0aGlzLlxyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZXNvbHZlIG1vZCBwYXRoIGZvciBtb2QgdHlwZScsIG1vZC50eXBlKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZnJvbSwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmlkLCByZWxQYXRoKTtcclxuICAgICAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LiBUaGF0IHdheSwgdm9ydGV4IHdpbGxcclxuICAgICAgICAgIC8vIGNyZWF0ZSBhIGxpbmsgdG8gaXQgd2l0aCB0aGUgY29ycmVjdCBkZXBsb3ltZW50IG1ldGhvZCBhbmQgbm90IGFzayB0aGUgdXNlciBhbnkgcXVlc3Rpb25zXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIHRhcmdldFBhdGgpO1xyXG4gICAgICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKCFlcnIubWVzc2FnZS5pbmNsdWRlcygnYXJlIHRoZSBzYW1lIGZpbGUnKSkge1xyXG4gICAgICAgICAgICAgIC8vIHNob3VsZCB3ZSBiZSByZXBvcnRpbmcgdGhpcyB0byB0aGUgdXNlcj8gVGhpcyBpcyBhIGNvbXBsZXRlbHlcclxuICAgICAgICAgICAgICAvLyBhdXRvbWF0ZWQgcHJvY2VzcyBhbmQgaWYgaXQgZmFpbHMgbW9yZSBvZnRlbiB0aGFuIG5vdCB0aGVcclxuICAgICAgICAgICAgICAvLyB1c2VyIHByb2JhYmx5IGRvZXNuJ3QgY2FyZVxyXG4gICAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlLWltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QoY29udGV4dC5hcGkpO1xyXG4gICAgICBjb25zdCBwcmltYXJ5VG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdpbnRlcmZhY2UnLCAncHJpbWFyeVRvb2wnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNtYXBpTW9kICYmIHByaW1hcnlUb29sID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsICdzbWFwaScpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSlcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09ICdzbWFwaScpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lSWQsIG1vZElkKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGxvZygnZGVidWcnLCAnYWRkZWQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCB9KSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGxvZygnZGVidWcnLCAndXBkYXRpbmcgU0RWIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZU1vZGVdID8/IHt9KS5tYXAobW9kSWQgPT5cclxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2RvbmUgdXBkYXRpbmcgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHVwZGF0ZSBjb25mbGljdCBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGluaXQ7XHJcbiJdfQ==