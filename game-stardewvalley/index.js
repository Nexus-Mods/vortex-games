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
                (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile });
                return undefined;
            }
        })));
        mods = mods.filter(x => x !== undefined);
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
                if ((dep.UniqueID === undefined)
                    || (dep.UniqueID.toLowerCase() === 'yourname.yourotherspacksandmods')) {
                    return;
                }
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
        const parsedManifests = (yield Promise.all(manifests.map((manifest) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, util_1.parseManifest)(manifest);
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile: manifest, error: err.message });
                return undefined;
            }
        })))).filter(manifest => manifest !== undefined);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFDMUMsNEVBQW9EO0FBQ3BELDJDQUFvRDtBQUVwRCw0RUFBb0Q7QUFDcEQsOERBQXNDO0FBQ3RDLG1DQUE0QztBQUM1QyxtQ0FBbUg7QUFDbkgsaUNBQXVDO0FBRXZDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDMUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ25DLEtBQUssR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQy9CLEVBQUUsUUFBUSxFQUFFLEdBQUcsaUJBQUksRUFDbkIsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFDakUsRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFcEMsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDckQsTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUUxRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzlFLE1BQU0sY0FBYyxHQUFHLEdBQUcsRUFBRTtJQUMxQixPQUFPLEtB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WCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdXRpbCwgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcbmltcG9ydCBDb21wYXRpYmlsaXR5SWNvbiBmcm9tICcuL0NvbXBhdGliaWxpdHlJY29uJztcclxuaW1wb3J0IHsgU01BUElfUVVFUllfRlJFUVVFTkNZIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuaW1wb3J0IERlcGVuZGVuY3lNYW5hZ2VyIGZyb20gJy4vRGVwZW5kZW5jeU1hbmFnZXInO1xyXG5pbXBvcnQgU01BUElQcm94eSBmcm9tICcuL3NtYXBpUHJveHknO1xyXG5pbXBvcnQgeyB0ZXN0U01BUElPdXRkYXRlZCB9IGZyb20gJy4vdGVzdHMnO1xyXG5pbXBvcnQgeyBjb21wYXRpYmlsaXR5T3B0aW9ucywgQ29tcGF0aWJpbGl0eVN0YXR1cywgSVNEVkRlcGVuZGVuY3ksIElTRFZNb2RNYW5pZmVzdCwgSVNNQVBJUmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKSxcclxuICB7IGNsaXBib2FyZCB9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKSxcclxuICByanNvbiA9IHJlcXVpcmUoJ3JlbGF4ZWQtanNvbicpLFxyXG4gIHsgU2V2ZW5aaXAgfSA9IHV0aWwsXHJcbiAgeyBkZXBsb3lTTUFQSSwgZG93bmxvYWRTTUFQSSwgZmluZFNNQVBJTW9kIH0gPSByZXF1aXJlKCcuL1NNQVBJJyksXHJcbiAgeyBHQU1FX0lEIH0gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xyXG5cclxuY29uc3QgTUFOSUZFU1RfRklMRSA9ICdtYW5pZmVzdC5qc29uJztcclxuY29uc3QgUFRSTl9DT05URU5UID0gcGF0aC5zZXAgKyAnQ29udGVudCcgKyBwYXRoLnNlcDtcclxuY29uc3QgU01BUElfRVhFID0gJ1N0YXJkZXdNb2RkaW5nQVBJLmV4ZSc7XHJcbmNvbnN0IFNNQVBJX0RMTCA9ICdTTUFQSS5JbnN0YWxsZXIuZGxsJztcclxuY29uc3QgU01BUElfREFUQSA9IFsnd2luZG93cy1pbnN0YWxsLmRhdCcsICdpbnN0YWxsLmRhdCddO1xyXG5cclxuY29uc3QgX1NNQVBJX0JVTkRMRURfTU9EUyA9IFsnRXJyb3JIYW5kbGVyJywgJ0NvbnNvbGVDb21tYW5kcycsICdTYXZlQmFja3VwJ107XHJcbmNvbnN0IGdldEJ1bmRsZWRNb2RzID0gKCkgPT4ge1xyXG4gIHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQoX1NNQVBJX0JVTkRMRURfTU9EUy5tYXAobW9kTmFtZSA9PiBtb2ROYW1lLnRvTG93ZXJDYXNlKCkpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcblxyXG5jbGFzcyBTdGFyZGV3VmFsbGV5IGltcGxlbWVudHMgdHlwZXMuSUdhbWUge1xyXG4gIHB1YmxpYyBjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dDtcclxuICBwdWJsaWMgaWQ6IHN0cmluZyA9IEdBTUVfSUQ7XHJcbiAgcHVibGljIG5hbWU6IHN0cmluZyA9ICdTdGFyZGV3IFZhbGxleSc7XHJcbiAgcHVibGljIGxvZ286IHN0cmluZyA9ICdnYW1lYXJ0LmpwZyc7XHJcbiAgcHVibGljIHJlcXVpcmVkRmlsZXM6IHN0cmluZ1tdO1xyXG4gIHB1YmxpYyBlbnZpcm9ubWVudDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcclxuICAgIFN0ZWFtQVBQSWQ6ICc0MTMxNTAnLFxyXG4gIH07XHJcbiAgcHVibGljIGRldGFpbHM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7XHJcbiAgICBzdGVhbUFwcElkOiA0MTMxNTBcclxuICB9O1xyXG4gIHB1YmxpYyBzdXBwb3J0ZWRUb29sczogYW55W10gPSBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiAnc21hcGknLFxyXG4gICAgICBuYW1lOiAnU01BUEknLFxyXG4gICAgICBsb2dvOiAnc21hcGkucG5nJyxcclxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gU01BUElfRVhFLFxyXG4gICAgICByZXF1aXJlZEZpbGVzOiBbU01BUElfRVhFXSxcclxuICAgICAgc2hlbGw6IHRydWUsXHJcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcclxuICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIGRlZmF1bHRQcmltYXJ5OiB0cnVlLFxyXG4gICAgfVxyXG4gIF07XHJcbiAgcHVibGljIG1lcmdlTW9kczogYm9vbGVhbiA9IHRydWU7XHJcbiAgcHVibGljIHJlcXVpcmVzQ2xlYW51cDogYm9vbGVhbiA9IHRydWU7XHJcbiAgcHVibGljIHNoZWxsOiBib29sZWFuID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcclxuICBwdWJsaWMgZGVmYXVsdFBhdGhzOiBzdHJpbmdbXTtcclxuXHJcbiAgLyoqKioqKioqKlxyXG4gICoqIFZvcnRleCBBUElcclxuICAqKioqKioqKiovXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0IGFuIGluc3RhbmNlLlxyXG4gICAqIEBwYXJhbSB7SUV4dGVuc2lvbkNvbnRleHR9IGNvbnRleHQgLS0gVGhlIFZvcnRleCBleHRlbnNpb24gY29udGV4dC5cclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gICAgLy8gcHJvcGVydGllcyB1c2VkIGJ5IFZvcnRleFxyXG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgIHRoaXMucmVxdWlyZWRGaWxlcyA9IHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xyXG4gICAgICA/IFsnU3RhcmRldyBWYWxsZXkuZXhlJ11cclxuICAgICAgOiBbJ1N0YXJkZXdWYWxsZXknLCAnU3RhcmRld1ZhbGxleS5leGUnXTtcclxuXHJcbiAgICAvLyBjdXN0b20gcHJvcGVydGllc1xyXG4gICAgdGhpcy5kZWZhdWx0UGF0aHMgPSBbXHJcbiAgICAgIC8vIExpbnV4XHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0dPRyBHYW1lcy9TdGFyZGV3IFZhbGxleS9nYW1lJyxcclxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvLmxvY2FsL3NoYXJlL1N0ZWFtL3N0ZWFtYXBwcy9jb21tb24vU3RhcmRldyBWYWxsZXknLFxyXG5cclxuICAgICAgLy8gTWFjXHJcbiAgICAgICcvQXBwbGljYXRpb25zL1N0YXJkZXcgVmFsbGV5LmFwcC9Db250ZW50cy9NYWNPUycsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5L0NvbnRlbnRzL01hY09TJyxcclxuXHJcbiAgICAgIC8vIFdpbmRvd3NcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR2FsYXh5Q2xpZW50XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcclxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR09HIEdhbGF4eVxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXFN0ZWFtXFxcXHN0ZWFtYXBwc1xcXFxjb21tb25cXFxcU3RhcmRldyBWYWxsZXknXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXN5bmNocm9ub3VzbHkgZmluZCB0aGUgZ2FtZSBpbnN0YWxsIHBhdGguXHJcbiAgICpcclxuICAgKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gcXVpY2tseSBhbmQsIGlmIGl0IHJldHVybnMgYSB2YWx1ZSwgaXQgc2hvdWxkIGRlZmluaXRpdmVseSBiZSB0aGVcclxuICAgKiB2YWxpZCBnYW1lIHBhdGguIFVzdWFsbHkgdGhpcyBmdW5jdGlvbiB3aWxsIHF1ZXJ5IHRoZSBwYXRoIGZyb20gdGhlIHJlZ2lzdHJ5IG9yIGZyb20gc3RlYW0uXHJcbiAgICogVGhpcyBmdW5jdGlvbiBtYXkgcmV0dXJuIGEgcHJvbWlzZSBhbmQgaXQgc2hvdWxkIGRvIHRoYXQgaWYgaXQncyBkb2luZyBJL08uXHJcbiAgICpcclxuICAgKiBUaGlzIG1heSBiZSBsZWZ0IHVuZGVmaW5lZCBidXQgdGhlbiB0aGUgdG9vbC9nYW1lIGNhbiBvbmx5IGJlIGRpc2NvdmVyZWQgYnkgc2VhcmNoaW5nIHRoZSBkaXNrXHJcbiAgICogd2hpY2ggaXMgc2xvdyBhbmQgb25seSBoYXBwZW5zIG1hbnVhbGx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBxdWVyeVBhdGggPSB0b0JsdWUoYXN5bmMgKCkgPT4ge1xyXG4gICAgLy8gY2hlY2sgU3RlYW1cclxuICAgIGNvbnN0IGdhbWUgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzQxMzE1MCcsICcxNDUzMzc1MjUzJ10pO1xyXG4gICAgaWYgKGdhbWUpXHJcbiAgICAgIHJldHVybiBnYW1lLmdhbWVQYXRoO1xyXG5cclxuICAgIC8vIGNoZWNrIGRlZmF1bHQgcGF0aHNcclxuICAgIGZvciAoY29uc3QgZGVmYXVsdFBhdGggb2YgdGhpcy5kZWZhdWx0UGF0aHMpXHJcbiAgICB7XHJcbiAgICAgIGlmIChhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhkZWZhdWx0UGF0aCkpXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRQYXRoO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHBhdGggb2YgdGhlIHRvb2wgZXhlY3V0YWJsZSByZWxhdGl2ZSB0byB0aGUgdG9vbCBiYXNlIHBhdGgsIGkuZS4gYmluYXJpZXMvVVQzLmV4ZSBvclxyXG4gICAqIFRFU1YuZXhlLiBUaGlzIGlzIGEgZnVuY3Rpb24gc28gdGhhdCB5b3UgY2FuIHJldHVybiBkaWZmZXJlbnQgdGhpbmdzIGJhc2VkIG9uIHRoZSBvcGVyYXRpbmdcclxuICAgKiBzeXN0ZW0gZm9yIGV4YW1wbGUgYnV0IGJlIGF3YXJlIHRoYXQgaXQgd2lsbCBiZSBldmFsdWF0ZWQgYXQgYXBwbGljYXRpb24gc3RhcnQgYW5kIG9ubHkgb25jZSxcclxuICAgKiBzbyB0aGUgcmV0dXJuIHZhbHVlIGNhbiBub3QgZGVwZW5kIG9uIHRoaW5ncyB0aGF0IGNoYW5nZSBhdCBydW50aW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBleGVjdXRhYmxlKCkge1xyXG4gICAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xyXG4gICAgICA/ICdTdGFyZGV3IFZhbGxleS5leGUnXHJcbiAgICAgIDogJ1N0YXJkZXdWYWxsZXknO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBkZWZhdWx0IGRpcmVjdG9yeSB3aGVyZSBtb2RzIGZvciB0aGlzIGdhbWUgc2hvdWxkIGJlIHN0b3JlZC5cclxuICAgKiBcclxuICAgKiBJZiB0aGlzIHJldHVybnMgYSByZWxhdGl2ZSBwYXRoIHRoZW4gdGhlIHBhdGggaXMgdHJlYXRlZCBhcyByZWxhdGl2ZSB0byB0aGUgZ2FtZSBpbnN0YWxsYXRpb25cclxuICAgKiBkaXJlY3RvcnkuIFNpbXBseSByZXR1cm4gYSBkb3QgKCAoKSA9PiAnLicgKSBpZiBtb2RzIGFyZSBpbnN0YWxsZWQgZGlyZWN0bHkgaW50byB0aGUgZ2FtZVxyXG4gICAqIGRpcmVjdG9yeS5cclxuICAgKi8gXHJcbiAgcHVibGljIHF1ZXJ5TW9kUGF0aCgpXHJcbiAge1xyXG4gICAgcmV0dXJuICdNb2RzJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wdGlvbmFsIHNldHVwIGZ1bmN0aW9uLiBJZiB0aGlzIGdhbWUgcmVxdWlyZXMgc29tZSBmb3JtIG9mIHNldHVwIGJlZm9yZSBpdCBjYW4gYmUgbW9kZGVkIChsaWtlXHJcbiAgICogY3JlYXRpbmcgYSBkaXJlY3RvcnksIGNoYW5naW5nIGEgcmVnaXN0cnkga2V5LCAuLi4pIGRvIGl0IGhlcmUuIEl0IHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IHRpbWVcclxuICAgKiBiZWZvcmUgdGhlIGdhbWUgbW9kZSBpcyBhY3RpdmF0ZWQuXHJcbiAgICogQHBhcmFtIHtJRGlzY292ZXJ5UmVzdWx0fSBkaXNjb3ZlcnkgLS0gYmFzaWMgaW5mbyBhYm91dCB0aGUgZ2FtZSBiZWluZyBsb2FkZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldHVwID0gdG9CbHVlKGFzeW5jIChkaXNjb3ZlcnkpID0+IHtcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgZm9sZGVyIGZvciBTTUFQSSBtb2RzIGV4aXN0cy5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICAgIC8vIHNraXAgaWYgU01BUEkgZm91bmRcclxuICAgIGNvbnN0IHNtYXBpUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgU01BUElfRVhFKTtcclxuICAgIGNvbnN0IHNtYXBpRm91bmQgPSBhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhzbWFwaVBhdGgpO1xyXG4gICAgaWYgKHNtYXBpRm91bmQpXHJcbiAgICAgIHJldHVybjtcclxuXHJcbiAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZCh0aGlzLmNvbnRleHQuYXBpKTtcclxuICAgIGNvbnN0IHRpdGxlID0gc21hcGlNb2QgPyAnU01BUEkgaXMgbm90IGRlcGxveWVkJyA6ICdTTUFQSSBpcyBub3QgaW5zdGFsbGVkJztcclxuICAgIGNvbnN0IGFjdGlvblRpdGxlID0gc21hcGlNb2QgPyAnRGVwbG95JyA6ICdHZXQgU01BUEknO1xyXG4gICAgY29uc3QgYWN0aW9uID0gKCkgPT4gKHNtYXBpTW9kXHJcbiAgICAgID8gZGVwbG95U01BUEkodGhpcy5jb250ZXh0LmFwaSlcclxuICAgICAgOiBkb3dubG9hZFNNQVBJKHRoaXMuY29udGV4dC5hcGkpKVxyXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmNvbnRleHQuYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKSk7XHJcblxyXG4gICAgdGhpcy5jb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6ICdzbWFwaS1taXNzaW5nJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZSxcclxuICAgICAgbWVzc2FnZTogJ1NNQVBJIGlzIHJlcXVpcmVkIHRvIG1vZCBTdGFyZGV3IFZhbGxleS4nLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6IGFjdGlvblRpdGxlLFxyXG4gICAgICAgICAgYWN0aW9uLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgLyoqKioqKioqKlxyXG4gICoqIEludGVybmFsIG1ldGhvZHNcclxuICAqKioqKioqKiovXHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGNoZWNrIHdoZXRoZXIgYSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoIGV4aXN0cy5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFRoZSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoLlxyXG4gICAqL1xyXG4gIGFzeW5jIGdldFBhdGhFeGlzdHNBc3luYyhwYXRoKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGgpO1xyXG4gICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZXJyKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IHJlYWQgYSByZWdpc3RyeSBrZXkgdmFsdWUuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhpdmUgLSBUaGUgcmVnaXN0cnkgaGl2ZSB0byBhY2Nlc3MuIFRoaXMgc2hvdWxkIGJlIGEgY29uc3RhbnQgbGlrZSBSZWdpc3RyeS5IS0xNLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgcmVnaXN0cnkga2V5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRvIHJlYWQuXHJcbiAgICovXHJcbiAgYXN5bmMgcmVhZFJlZ2lzdHJ5S2V5QXN5bmMoaGl2ZSwga2V5LCBuYW1lKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKGhpdmUsIGtleSwgbmFtZSk7XHJcbiAgICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdFBhdGgudmFsdWUpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSb290Rm9sZGVyKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBXZSBhc3N1bWUgdGhhdCBhbnkgbW9kIGNvbnRhaW5pbmcgXCIvQ29udGVudC9cIiBpbiBpdHMgZGlyZWN0b3J5XHJcbiAgLy8gIHN0cnVjdHVyZSBpcyBtZWFudCB0byBiZSBkZXBsb3llZCB0byB0aGUgcm9vdCBmb2xkZXIuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgIC5tYXAoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKSk7XHJcbiAgY29uc3QgY29udGVudERpciA9IGZpbHRlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGNvbnRlbnREaXIgIT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSb290Rm9sZGVyKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBXZSdyZSBnb2luZyB0byBkZXBsb3kgXCIvQ29udGVudC9cIiBhbmQgd2hhdGV2ZXIgZm9sZGVycyBjb21lIGFsb25nc2lkZSBpdC5cclxuICAvLyAgaS5lLiBTb21lTW9kLjd6XHJcbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvQ29udGVudC9cclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Nb2RzL1xyXG4gIC8vICBXaWxsIE5PVCBiZSBkZXBsb3llZCA9PiAuLi9SZWFkbWUuZG9jXHJcbiAgY29uc3QgY29udGVudEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3QgaWR4ID0gY29udGVudEZpbGUuaW5kZXhPZihQVFJOX0NPTlRFTlQpICsgMTtcclxuICBjb25zdCByb290RGlyID0gcGF0aC5iYXNlbmFtZShjb250ZW50RmlsZS5zdWJzdHJpbmcoMCwgaWR4KSk7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcClcclxuICAgICYmIChmaWxlLmluZGV4T2Yocm9vdERpcikgIT09IC0xKVxyXG4gICAgJiYgKHBhdGguZXh0bmFtZShmaWxlKSAhPT0gJy50eHQnKSk7XHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnN1YnN0cihpZHgpLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVmFsaWRNYW5pZmVzdChmaWxlUGF0aCkge1xyXG4gIGNvbnN0IHNlZ21lbnRzID0gZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgY29uc3QgaXNNYW5pZmVzdEZpbGUgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gTUFOSUZFU1RfRklMRTtcclxuICBjb25zdCBpc0xvY2FsZSA9IHNlZ21lbnRzLmluY2x1ZGVzKCdsb2NhbGUnKTtcclxuICByZXR1cm4gaXNNYW5pZmVzdEZpbGUgJiYgIWlzTG9jYWxlO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoaXNWYWxpZE1hbmlmZXN0KSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIHByZWZpeCBmYWtlIGRpcmVjdG9yeSBqdXN0IGluIGNhc2UgdGhlIGNvbnRlbnRcclxuICAgICAgLy8gIGZvbGRlciBpcyBpbiB0aGUgYXJjaGl2ZSdzIHJvb3QgZm9sZGVyLiBUaGlzIGlzIHRvIGVuc3VyZSB3ZVxyXG4gICAgICAvLyAgZmluZCBhIG1hdGNoIGZvciBcIi9Db250ZW50L1wiXHJcbiAgICAgIGNvbnN0IHRlc3RGaWxlID0gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSk7XHJcbiAgICAgIHJldHVybiAodGVzdEZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgICB9KSA9PT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoYXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lNYW5hZ2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFRoZSBhcmNoaXZlIG1heSBjb250YWluIG11bHRpcGxlIG1hbmlmZXN0IGZpbGVzIHdoaWNoIHdvdWxkXHJcbiAgLy8gIGltcGx5IHRoYXQgd2UncmUgaW5zdGFsbGluZyBtdWx0aXBsZSBtb2RzLlxyXG4gIGNvbnN0IG1hbmlmZXN0RmlsZXMgPSBmaWxlcy5maWx0ZXIoaXNWYWxpZE1hbmlmZXN0KTtcclxuXHJcbiAgaW50ZXJmYWNlIElNb2RJbmZvIHtcclxuICAgIG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3Q7XHJcbiAgICByb290Rm9sZGVyOiBzdHJpbmc7XHJcbiAgICBtYW5pZmVzdEluZGV4OiBudW1iZXI7XHJcbiAgICBtb2RGaWxlczogc3RyaW5nW107XHJcbiAgfVxyXG5cclxuICBhd2FpdCBkZXBlbmRlbmN5TWFuYWdlci5zY2FuTWFuaWZlc3RzKHRydWUpO1xyXG4gIGxldCBtb2RzOiBJTW9kSW5mb1tdID0gYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RGaWxlcy5tYXAoYXN5bmMgbWFuaWZlc3RGaWxlID0+IHtcclxuICAgIGNvbnN0IHJvb3RGb2xkZXIgPSBwYXRoLmRpcm5hbWUobWFuaWZlc3RGaWxlKTtcclxuICAgIGNvbnN0IG1hbmlmZXN0SW5kZXggPSBtYW5pZmVzdEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKE1BTklGRVNUX0ZJTEUpO1xyXG4gICAgY29uc3QgZmlsdGVyRnVuYyA9IChmaWxlKSA9PiAocm9vdEZvbGRlciAhPT0gJy4nKVxyXG4gICAgICA/ICgoZmlsZS5pbmRleE9mKHJvb3RGb2xkZXIpICE9PSAtMSlcclxuICAgICAgICAmJiAocGF0aC5kaXJuYW1lKGZpbGUpICE9PSAnLicpXHJcbiAgICAgICAgJiYgIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgICA6ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPSBhd2FpdCBwYXJzZU1hbmlmZXN0KHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1hbmlmZXN0RmlsZSkpO1xyXG4gICAgICBjb25zdCBtb2RGaWxlcyA9IGZpbGVzLmZpbHRlcihmaWx0ZXJGdW5jKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBtYW5pZmVzdCxcclxuICAgICAgICByb290Rm9sZGVyLFxyXG4gICAgICAgIG1hbmlmZXN0SW5kZXgsXHJcbiAgICAgICAgbW9kRmlsZXMsXHJcbiAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgbWFuaWZlc3RGaWxlIH0pO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH0pKTtcclxuXHJcbiAgbW9kcyA9IG1vZHMuZmlsdGVyKHggPT4geCAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLm1hcChtb2RzLCBtb2QgPT4ge1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IChtb2Qucm9vdEZvbGRlciAhPT0gJy4nKVxyXG4gICAgICA/IG1vZC5yb290Rm9sZGVyXHJcbiAgICAgIDogbW9kLm1hbmlmZXN0Lk5hbWU7XHJcblxyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbW9kLm1hbmlmZXN0LkRlcGVuZGVuY2llcyB8fCBbXTtcclxuXHJcbiAgICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIG1vZC5tb2RGaWxlcykge1xyXG4gICAgICBjb25zdCBkZXN0aW5hdGlvbiA9IHBhdGguam9pbihtb2ROYW1lLCBmaWxlLnN1YnN0cihtb2QubWFuaWZlc3RJbmRleCkpO1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZGVzdGluYXRpb24sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFkZFJ1bGVGb3JEZXBlbmRlbmN5ID0gKGRlcDogSVNEVkRlcGVuZGVuY3kpID0+IHtcclxuICAgICAgaWYgKChkZXAuVW5pcXVlSUQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgIHx8IChkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSA9PT0gJ3lvdXJuYW1lLnlvdXJvdGhlcnNwYWNrc2FuZG1vZHMnKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGVwLk1pbmltdW1WZXJzaW9uICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IGA+PSR7ZGVwLk1pbmltdW1WZXJzaW9ufWBcclxuICAgICAgICA6ICcqJztcclxuICAgICAgY29uc3QgcnVsZTogdHlwZXMuSU1vZFJ1bGUgPSB7XHJcbiAgICAgICAgdHlwZTogKGRlcC5Jc1JlcXVpcmVkID8/IHRydWUpID8gJ3JlcXVpcmVzJyA6ICdyZWNvbW1lbmRzJyxcclxuICAgICAgICByZWZlcmVuY2U6IHtcclxuICAgICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogZGVwLlVuaXF1ZUlELnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICB2ZXJzaW9uTWF0Y2gsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBleHRyYToge1xyXG4gICAgICAgICAgb25seUlmRnVsZmlsbGFibGU6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfTtcclxuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdydWxlJyxcclxuICAgICAgICBydWxlLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3koZGVwKTtcclxuICAgIH1cclxuICAgIGlmIChtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGluc3RydWN0aW9ucztcclxuICB9KVxyXG4gICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChkYXRhKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiBhY2N1bS5jb25jYXQoaXRlciksIFtdKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1NNQVBJTW9kVHlwZShpbnN0cnVjdGlvbnMpIHtcclxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS5cclxuICBjb25zdCBzbWFwaURhdGEgPSBpbnN0cnVjdGlvbnMuZmluZChpbnN0ID0+IChpbnN0LnR5cGUgPT09ICdjb3B5JykgJiYgaW5zdC5zb3VyY2UuZW5kc1dpdGgoU01BUElfRVhFKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHNtYXBpRGF0YSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFNNQVBJKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBNYWtlIHN1cmUgdGhlIGRvd25sb2FkIGNvbnRhaW5zIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmUuc1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmIChmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgIHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IFNNQVBJX0RMTCkgIT09IHVuZGVmaW5lZClcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICAgIHN1cHBvcnRlZCxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgY29uc3QgZm9sZGVyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJ1xyXG4gICAgPyAnd2luZG93cydcclxuICAgIDogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2xpbnV4J1xyXG4gICAgICA/ICdsaW51eCdcclxuICAgICAgOiAnbWFjb3MnO1xyXG4gIGNvbnN0IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0gPSAoZmlsZSkgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcclxuICAgIHJldHVybiAoc2VnbWVudHMuaW5jbHVkZXMoZm9sZGVyKSk7XHJcbiAgfVxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGRhdGEgYXJjaGl2ZVxyXG4gIGNvbnN0IGRhdGFGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHtcclxuICAgIGNvbnN0IGlzQ29ycmVjdFBsYXRmb3JtID0gZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybShmaWxlKTtcclxuICAgIHJldHVybiBpc0NvcnJlY3RQbGF0Zm9ybSAmJiBTTUFQSV9EQVRBLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSlcclxuICB9KTtcclxuICBpZiAoZGF0YUZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gZmluZCB0aGUgU01BUEkgZGF0YSBmaWxlcyAtIGRvd25sb2FkIGFwcGVhcnMgJ1xyXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xyXG4gIH1cclxuICBsZXQgZGF0YSA9ICcnO1xyXG4gIHRyeSB7XHJcbiAgICBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oZ2V0RGlzY292ZXJ5UGF0aCgpLCAnU3RhcmRldyBWYWxsZXkuZGVwcy5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFNEViBkZXBlbmRlbmNpZXMnLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy8gZmlsZSB3aWxsIGJlIG91dGRhdGVkIGFmdGVyIHRoZSB3YWxrIG9wZXJhdGlvbiBzbyBwcmVwYXJlIGEgcmVwbGFjZW1lbnQuIFxyXG4gIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IFtdO1xyXG5cclxuICBjb25zdCBzemlwID0gbmV3IFNldmVuWmlwKCk7XHJcbiAgLy8gVW56aXAgdGhlIGZpbGVzIGZyb20gdGhlIGRhdGEgYXJjaGl2ZS4gVGhpcyBkb2Vzbid0IHNlZW0gdG8gYmVoYXZlIGFzIGRlc2NyaWJlZCBoZXJlOiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9ub2RlLTd6I2V2ZW50c1xyXG4gIGF3YWl0IHN6aXAuZXh0cmFjdEZ1bGwocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgZGF0YUZpbGUpLCBkZXN0aW5hdGlvblBhdGgpO1xyXG5cclxuICAvLyBGaW5kIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgaW4gdGhlIHBhcmVudCBmb2xkZXIuIFxyXG4gIGF3YWl0IHV0aWwud2FsayhkZXN0aW5hdGlvblBhdGgsIChpdGVyLCBzdGF0cykgPT4ge1xyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkZXN0aW5hdGlvblBhdGgsIGl0ZXIpO1xyXG4gICAgICAvLyBGaWx0ZXIgb3V0IGZpbGVzIGZyb20gdGhlIG9yaWdpbmFsIGluc3RhbGwgYXMgdGhleSdyZSBubyBsb25nZXIgcmVxdWlyZWQuXHJcbiAgICAgIGlmICghZmlsZXMuaW5jbHVkZXMocmVsUGF0aCkgJiYgc3RhdHMuaXNGaWxlKCkgJiYgIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgrcGF0aC5zZXApKSB1cGRhdGVkRmlsZXMucHVzaChyZWxQYXRoKTtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICBjb25zdCBtb2RzRm9sZGVySWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgICBpZiAoKG1vZHNGb2xkZXJJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc0ZvbGRlcklkeCArIDEpKSB7XHJcbiAgICAgICAgX1NNQVBJX0JVTkRMRURfTU9EUy5wdXNoKHNlZ21lbnRzW21vZHNGb2xkZXJJZHggKyAxXSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuIFxyXG4gIGNvbnN0IHNtYXBpRXhlID0gdXBkYXRlZEZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoU01BUElfRVhFLnRvTG93ZXJDYXNlKCkpKTtcclxuICBpZiAoc21hcGlFeGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGBGYWlsZWQgdG8gZXh0cmFjdCAke1NNQVBJX0VYRX0gLSBkb3dubG9hZCBhcHBlYXJzIGBcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgY29uc3QgaWR4ID0gc21hcGlFeGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKHNtYXBpRXhlKSk7XHJcblxyXG4gIC8vIEJ1aWxkIHRoZSBpbnN0cnVjdGlvbnMgZm9yIGluc3RhbGxhdGlvbi4gXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IHVwZGF0ZWRGaWxlcy5tYXAoZmlsZSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKGZpbGUuc3Vic3RyKGlkeCkpLFxyXG4gICAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAga2V5OiAnc21hcGlCdW5kbGVkTW9kcycsXHJcbiAgICB2YWx1ZTogZ2V0QnVuZGxlZE1vZHMoKSxcclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgdHlwZTogJ2dlbmVyYXRlZmlsZScsXHJcbiAgICBkYXRhLFxyXG4gICAgZGVzdGluYXRpb246ICdTdGFyZGV3TW9kZGluZ0FQSS5kZXBzLmpzb24nLFxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgbG9nRmlsZSkge1xyXG4gIGNvbnN0IGxvZ0RhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihiYXNlUGF0aCwgbG9nRmlsZSksIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XHJcbiAgYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnU01BUEkgTG9nJywge1xyXG4gICAgdGV4dDogJ1lvdXIgU01BUEkgbG9nIGlzIGRpc3BsYXllZCBiZWxvdy4gVG8gc2hhcmUgaXQsIGNsaWNrIFwiQ29weSAmIFNoYXJlXCIgd2hpY2ggd2lsbCBjb3B5IGl0IHRvIHlvdXIgY2xpcGJvYXJkIGFuZCBvcGVuIHRoZSBTTUFQSSBsb2cgc2hhcmluZyB3ZWJzaXRlLiAnICtcclxuICAgICAgJ05leHQsIHBhc3RlIHlvdXIgY29kZSBpbnRvIHRoZSB0ZXh0IGJveCBhbmQgcHJlc3MgXCJzYXZlICYgcGFyc2UgbG9nXCIuIFlvdSBjYW4gbm93IHNoYXJlIGEgbGluayB0byB0aGlzIHBhZ2Ugd2l0aCBvdGhlcnMgc28gdGhleSBjYW4gc2VlIHlvdXIgbG9nIGZpbGUuXFxuXFxuJyArIGxvZ0RhdGFcclxuICB9LCBbe1xyXG4gICAgbGFiZWw6ICdDb3B5ICYgU2hhcmUgbG9nJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9eLitUKFteXFwuXSspLisvLCAnJDEnKTtcclxuICAgICAgY2xpcGJvYXJkLndyaXRlVGV4dChgWyR7dGltZXN0YW1wfSBJTkZPIFZvcnRleF0gTG9nIGV4cG9ydGVkIGJ5IFZvcnRleCAke3V0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9ufS5cXG5gICsgbG9nRGF0YSk7XHJcbiAgICAgIHJldHVybiB1dGlsLm9wbignaHR0cHM6Ly9zbWFwaS5pby9sb2cnKS5jYXRjaChlcnIgPT4gdW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9LCB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHVuZGVmaW5lZCB9XSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uU2hvd1NNQVBJTG9nKGFwaSkge1xyXG4gIC8vUmVhZCBhbmQgZGlzcGxheSB0aGUgbG9nLlxyXG4gIGNvbnN0IGJhc2VQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnYXBwRGF0YScpLCAnc3RhcmRld3ZhbGxleScsICdlcnJvcmxvZ3MnKTtcclxuICB0cnkge1xyXG4gICAgLy9JZiB0aGUgY3Jhc2ggbG9nIGV4aXN0cywgc2hvdyB0aGF0LlxyXG4gICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktY3Jhc2gudHh0XCIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy9PdGhlcndpc2Ugc2hvdyB0aGUgbm9ybWFsIGxvZy5cclxuICAgICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktbGF0ZXN0LnR4dFwiKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvL09yIEluZm9ybSB0aGUgdXNlciB0aGVyZSBhcmUgbm8gbG9ncy5cclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oeyB0eXBlOiAnaW5mbycsIHRpdGxlOiAnTm8gU01BUEkgbG9ncyBmb3VuZC4nLCBtZXNzYWdlOiAnJywgZGlzcGxheU1TOiA1MDAwIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TW9kTWFuaWZlc3RzKG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgY29uc3QgbWFuaWZlc3RzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuICBpZiAobW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XHJcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcclxuICAgICAgICBtYW5pZmVzdHMucHVzaChlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcclxuICAgIC50aGVuKCgpID0+IG1hbmlmZXN0cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZUNvbmZsaWN0SW5mbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWFwaTogU01BUElQcm94eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWQ6IHN0cmluZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgbW9kID0gYXBpLmdldFN0YXRlKCkucGVyc2lzdGVudC5tb2RzW2dhbWVJZF1bbW9kSWRdO1xyXG5cclxuICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG5cclxuICBpZiAoKG5vdyAtIG1vZC5hdHRyaWJ1dGVzPy5sYXN0U01BUElRdWVyeSA/PyAwKSA8IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgbGV0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gbW9kLmF0dHJpYnV0ZXM/LmFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzO1xyXG4gIGlmICghYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMpIHtcclxuICAgIGlmIChtb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lKSB7XHJcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW21vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWVdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHF1ZXJ5ID0gYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXNcclxuICAgIC5tYXAobmFtZSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcyA9IHtcclxuICAgICAgICBpZDogbmFtZSxcclxuICAgICAgfTtcclxuICAgICAgY29uc3QgdmVyID0gbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxyXG4gICAgICAgICAgICAgICAgICAgICA/PyBzZW12ZXIuY29lcmNlKG1vZC5hdHRyaWJ1dGVzPy52ZXJzaW9uKT8udmVyc2lvbjtcclxuICAgICAgaWYgKCEhdmVyKSB7XHJcbiAgICAgICAgcmVzWydpbnN0YWxsZWRWZXJzaW9uJ10gPSB2ZXI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3Qgc3RhdCA9IChpdGVtOiBJU01BUElSZXN1bHQpOiBDb21wYXRpYmlsaXR5U3RhdHVzID0+IHtcclxuICAgIGNvbnN0IHN0YXR1cyA9IGl0ZW0ubWV0YWRhdGE/LmNvbXBhdGliaWxpdHlTdGF0dXM/LnRvTG93ZXJDYXNlPy4oKTtcclxuICAgIGlmICghY29tcGF0aWJpbGl0eU9wdGlvbnMuaW5jbHVkZXMoc3RhdHVzIGFzIGFueSkpIHtcclxuICAgICAgcmV0dXJuICd1bmtub3duJztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzdGF0dXMgYXMgQ29tcGF0aWJpbGl0eVN0YXR1cztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBjb21wYXRpYmlsaXR5UHJpbyA9IChpdGVtOiBJU01BUElSZXN1bHQpID0+IGNvbXBhdGliaWxpdHlPcHRpb25zLmluZGV4T2Yoc3RhdChpdGVtKSk7XHJcblxyXG4gIHJldHVybiBzbWFwaS5maW5kQnlOYW1lcyhxdWVyeSlcclxuICAgIC50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICBjb25zdCB3b3JzdFN0YXR1czogSVNNQVBJUmVzdWx0W10gPSByZXN1bHRzXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBjb21wYXRpYmlsaXR5UHJpbyhsaHMpIC0gY29tcGF0aWJpbGl0eVByaW8ocmhzKSk7XHJcbiAgICAgIGlmICh3b3JzdFN0YXR1cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlcyhnYW1lSWQsIG1vZElkLCB7XHJcbiAgICAgICAgICBsYXN0U01BUElRdWVyeTogbm93LFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVN0YXR1czogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN0YXR1cyxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlNZXNzYWdlOiB3b3JzdFN0YXR1c1swXS5tZXRhZGF0YS5jb21wYXRpYmlsaXR5U3VtbWFyeSxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlVcGRhdGU6IHdvcnN0U3RhdHVzWzBdLnN1Z2dlc3RlZFVwZGF0ZT8udmVyc2lvbixcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdubyBtYW5pZmVzdCcpO1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ3dhcm4nLCAnZXJyb3IgcmVhZGluZyBtYW5pZmVzdCcsIGVyci5tZXNzYWdlKTtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBsZXQgZGVwZW5kZW5jeU1hbmFnZXI6IERlcGVuZGVuY3lNYW5hZ2VyO1xyXG4gIGNvbnN0IGdldERpc2NvdmVyeVBhdGggPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcclxuICAgICAgbG9nKCdlcnJvcicsICdzdGFyZGV3dmFsbGV5IHdhcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGdldFNNQVBJUGF0aCA9IChnYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGlzTW9kQ2FuZGlkYXRlVmFsaWQgPSAobW9kLCBlbnRyeSkgPT4ge1xyXG4gICAgaWYgKG1vZD8uaWQgPT09IHVuZGVmaW5lZCB8fCBtb2QudHlwZSA9PT0gJ3NkdnJvb3Rmb2xkZXInKSB7XHJcbiAgICAgIC8vIFRoZXJlIGlzIG5vIHJlbGlhYmxlIHdheSB0byBhc2NlcnRhaW4gd2hldGhlciBhIG5ldyBmaWxlIGVudHJ5XHJcbiAgICAgIC8vICBhY3R1YWxseSBiZWxvbmdzIHRvIGEgcm9vdCBtb2RUeXBlIGFzIHNvbWUgb2YgdGhlc2UgbW9kcyB3aWxsIGFjdFxyXG4gICAgICAvLyAgYXMgcmVwbGFjZW1lbnQgbW9kcy4gVGhpcyBvYnZpb3VzbHkgbWVhbnMgdGhhdCBpZiB0aGUgZ2FtZSBoYXNcclxuICAgICAgLy8gIGEgc3Vic3RhbnRpYWwgdXBkYXRlIHdoaWNoIGludHJvZHVjZXMgbmV3IGZpbGVzIHdlIGNvdWxkIHBvdGVudGlhbGx5XHJcbiAgICAgIC8vICBhZGQgYSB2YW5pbGxhIGdhbWUgZmlsZSBpbnRvIHRoZSBtb2QncyBzdGFnaW5nIGZvbGRlciBjYXVzaW5nIGNvbnN0YW50XHJcbiAgICAgIC8vICBjb250ZW50aW9uIGJldHdlZW4gdGhlIGdhbWUgaXRzZWxmICh3aGVuIGl0IHVwZGF0ZXMpIGFuZCB0aGUgbW9kLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUaGVyZSBpcyBhbHNvIGEgcG90ZW50aWFsIGNoYW5jZSBmb3Igcm9vdCBtb2RUeXBlcyB0byBjb25mbGljdCB3aXRoIHJlZ3VsYXJcclxuICAgICAgLy8gIG1vZHMsIHdoaWNoIGlzIHdoeSBpdCdzIG5vdCBzYWZlIHRvIGFzc3VtZSB0aGF0IGFueSBhZGRpdGlvbiBpbnNpZGUgdGhlXHJcbiAgICAgIC8vICBtb2RzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IGFkZGVkIHRvIHRoaXMgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgZWl0aGVyLlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1vZC50eXBlICE9PSAnU01BUEknKSB7XHJcbiAgICAgIC8vIE90aGVyIG1vZCB0eXBlcyBkbyBub3QgcmVxdWlyZSBmdXJ0aGVyIHZhbGlkYXRpb24gLSBpdCBzaG91bGQgYmUgZmluZVxyXG4gICAgICAvLyAgdG8gYWRkIHRoaXMgZW50cnkuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZW50cnkuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICBjb25zdCBtb2RzU2VnSWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXHJcbiAgICAgID8gc2VnbWVudHNbbW9kc1NlZ0lkeCArIDFdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIGxldCBidW5kbGVkTW9kcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdzbWFwaUJ1bmRsZWRNb2RzJ10sIFtdKTtcclxuICAgIGJ1bmRsZWRNb2RzID0gYnVuZGxlZE1vZHMubGVuZ3RoID4gMCA/IGJ1bmRsZWRNb2RzIDogZ2V0QnVuZGxlZE1vZHMoKTtcclxuICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcygnY29udGVudCcpKSB7XHJcbiAgICAgIC8vIFNNQVBJIGlzIG5vdCBzdXBwb3NlZCB0byBvdmVyd3JpdGUgdGhlIGdhbWUncyBjb250ZW50IGRpcmVjdGx5LlxyXG4gICAgICAvLyAgdGhpcyBpcyBjbGVhcmx5IG5vdCBhIFNNQVBJIGZpbGUgYW5kIHNob3VsZCBfbm90XyBiZSBhZGRlZCB0byBpdC5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAobW9kRm9sZGVyTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiBidW5kbGVkTW9kcy5pbmNsdWRlcyhtb2RGb2xkZXJOYW1lKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBtYW5pZmVzdEV4dHJhY3RvciA9IHRvQmx1ZShcclxuICAgIGFzeW5jIChtb2RJbmZvOiBhbnksIG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHsgW2tleTogc3RyaW5nXTogYW55OyB9PiA9PiB7XHJcbiAgICAgIGlmIChzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoKTtcclxuICAgICAgaWYgKG1hbmlmZXN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcGFyc2VkTWFuaWZlc3RzID0gKGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0cy5tYXAoXHJcbiAgICAgICAgYXN5bmMgbWFuaWZlc3QgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHBhcnNlTWFuaWZlc3QobWFuaWZlc3QpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IG1hbmlmZXN0RmlsZTogbWFuaWZlc3QsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KSkpLmZpbHRlcihtYW5pZmVzdCA9PiBtYW5pZmVzdCAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIC8vIHdlIGNhbiBvbmx5IHVzZSBvbmUgbWFuaWZlc3QgdG8gZ2V0IHRoZSBpZCBmcm9tXHJcbiAgICAgIGNvbnN0IHJlZk1hbmlmZXN0ID0gcGFyc2VkTWFuaWZlc3RzWzBdO1xyXG5cclxuICAgICAgY29uc3QgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBwYXJzZWRNYW5pZmVzdHNcclxuICAgICAgICAuZmlsdGVyKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlEICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpKTtcclxuXHJcbiAgICAgIGNvbnN0IG1pblNNQVBJVmVyc2lvbiA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuTWluaW11bUFwaVZlcnNpb24pXHJcbiAgICAgICAgLmZpbHRlcih2ZXJzaW9uID0+IHNlbXZlci52YWxpZCh2ZXJzaW9uKSlcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IHNlbXZlci5jb21wYXJlKHJocywgbGhzKSlbMF07XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSB7XHJcbiAgICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMsXHJcbiAgICAgICAgbWluU01BUElWZXJzaW9uLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gZG9uJ3Qgc2V0IGEgY3VzdG9tIGZpbGUgbmFtZSBmb3IgU01BUElcclxuICAgICAgaWYgKG1vZEluZm8uZG93bmxvYWQubW9kSW5mbz8ubmV4dXM/Lmlkcz8ubW9kSWQgIT09IDI0MDApIHtcclxuICAgICAgICByZXN1bHRbJ2N1c3RvbUZpbGVOYW1lJ10gPSByZWZNYW5pZmVzdC5OYW1lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodHlwZW9mKHJlZk1hbmlmZXN0LlZlcnNpb24pID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJlc3VsdFsnbWFuaWZlc3RWZXJzaW9uJ10gPSByZWZNYW5pZmVzdC5WZXJzaW9uO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUobmV3IFN0YXJkZXdWYWxsZXkoY29udGV4dCkpO1xyXG4gIC8vIFJlZ2lzdGVyIG91ciBTTUFQSSBtb2QgdHlwZSBhbmQgaW5zdGFsbGVyLiBOb3RlOiBUaGlzIGN1cnJlbnRseSBmbGFncyBhbiBlcnJvciBpbiBWb3J0ZXggb24gaW5zdGFsbGluZyBjb3JyZWN0bHkuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc21hcGktaW5zdGFsbGVyJywgMzAsIHRlc3RTTUFQSSwgKGZpbGVzLCBkZXN0KSA9PiBCbHVlYmlyZC5yZXNvbHZlKGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnU01BUEknLCAzMCwgZ2FtZUlkID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgZ2V0U01BUElQYXRoLCBpc1NNQVBJTW9kVHlwZSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRlc3RTdXBwb3J0ZWQsXHJcbiAgICAoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlciwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzZHZyb290Zm9sZGVyJywgNTAsIHRlc3RSb290Rm9sZGVyLCBpbnN0YWxsUm9vdEZvbGRlcik7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3NkdnJvb3Rmb2xkZXInLCAyNSwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXHJcbiAgICAoKSA9PiBnZXREaXNjb3ZlcnlQYXRoKCksIChpbnN0cnVjdGlvbnMpID0+IHtcclxuICAgICAgLy8gT25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zLlxyXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xyXG4gICAgICAvLyBUaGlzIGlzIGEgdHJpY2t5IHBhdHRlcm4gc28gd2UncmUgZ29pbmcgdG8gMXN0IHByZXNlbnQgdGhlIGRpZmZlcmVudCBwYWNrYWdpbmdcclxuICAgICAgLy8gIHBhdHRlcm5zIHdlIG5lZWQgdG8gY2F0ZXIgZm9yOlxyXG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXHJcbiAgICAgIC8vICAgIG1hbmlmZXN0IGZpbGVzIGFyZSBpbmNsdWRlZC5cclxuICAgICAgLy8gIDIuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlciArIG9uZSBvciBtb3JlIFNNQVBJIG1vZHMgaW5jbHVkZWRcclxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXHJcbiAgICAgIC8vICAzLiBBIHJlZ3VsYXIgU01BUEkgbW9kIHdpdGggYSBcIkNvbnRlbnRcIiBmb2xkZXIgaW5zaWRlIHRoZSBtb2QncyByb290IGRpci5cclxuICAgICAgLy9cclxuICAgICAgLy8gcGF0dGVybiAxOlxyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgZG9uJ3QgaGF2ZSBtYW5pZmVzdCBmaWxlc1xyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgaGF2ZSBhIFwiQ29udGVudFwiIGZvbGRlclxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUbyBzb2x2ZSBwYXR0ZXJucyAyIGFuZCAzIHdlJ3JlIGdvaW5nIHRvOlxyXG4gICAgICAvLyAgQ2hlY2sgd2hldGhlciB3ZSBoYXZlIGFueSBtYW5pZmVzdCBmaWxlcywgaWYgd2UgZG8sIHdlIGV4cGVjdCB0aGUgZm9sbG93aW5nXHJcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XHJcbiAgICAgIC8vICAgIGFyY2hpdmUuemlwID0+XHJcbiAgICAgIC8vICAgICAgLi4vQ29udGVudC9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL1xyXG4gICAgICAvLyAgICAgIC4uL01vZHMvQV9TTUFQSV9NT0RcXG1hbmlmZXN0Lmpzb25cclxuICAgICAgY29uc3QgaGFzTWFuaWZlc3QgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcclxuICAgICAgY29uc3QgaGFzTW9kc0ZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ01vZHMnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBoYXNDb250ZW50Rm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnQ29udGVudCcgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWRcclxuXHJcbiAgICAgIHJldHVybiAoaGFzTWFuaWZlc3QpXHJcbiAgICAgICAgPyBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIgJiYgaGFzTW9kc0ZvbGRlcilcclxuICAgICAgICA6IEJsdWViaXJkLnJlc29sdmUoaGFzQ29udGVudEZvbGRlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnY2hhbmdlbG9nJywge30sICdTTUFQSSBMb2cnLFxyXG4gICAgKCkgPT4geyBvblNob3dTTUFQSUxvZyhjb250ZXh0LmFwaSk7IH0sXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIC8vT25seSBzaG93IHRoZSBTTUFQSSBsb2cgYnV0dG9uIGZvciBTRFYuIFxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBdHRyaWJ1dGVFeHRyYWN0b3IoMjUsIG1hbmlmZXN0RXh0cmFjdG9yKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xyXG4gICAgaWQ6ICdzZHYtY29tcGF0aWJpbGl0eScsXHJcbiAgICBwb3NpdGlvbjogMTAwLFxyXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxyXG4gICAgcGxhY2VtZW50OiAndGFibGUnLFxyXG4gICAgY2FsYzogKG1vZDogdHlwZXMuSU1vZCkgPT4gbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XHJcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KENvbXBhdGliaWxpdHlJY29uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHQsIG1vZCwgZGV0YWlsQ2VsbCB9LCBbXSk7XHJcbiAgICB9LFxyXG4gICAgbmFtZTogJ0NvbXBhdGliaWxpdHknLFxyXG4gICAgaXNEZWZhdWx0VmlzaWJsZTogdHJ1ZSxcclxuICAgIGVkaXQ6IHt9LFxyXG4gIH0pO1xyXG5cclxuICAvKlxyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtbWlzc2luZy1kZXBlbmRlbmNpZXMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IHRlc3RNaXNzaW5nRGVwZW5kZW5jaWVzKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpO1xyXG4gICovXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3Nkdi1pbmNvbXBhdGlibGUtbW9kcycsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0U01BUElPdXRkYXRlZChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKSk7XHJcblxyXG4gIGludGVyZmFjZSBJQWRkZWRGaWxlIHtcclxuICAgIGZpbGVQYXRoOiBzdHJpbmc7XHJcbiAgICBjYW5kaWRhdGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb25zdCBwcm94eSA9IG5ldyBTTUFQSVByb3h5KGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ3NkdicsIHBhdGguam9pbihfX2Rpcm5hbWUsICdzZHZzdHlsZS5zY3NzJykpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmFkZE1ldGFTZXJ2ZXIoJ3NtYXBpLmlvJywge1xyXG4gICAgICB1cmw6ICcnLFxyXG4gICAgICBsb29wYmFja0NCOiAocXVlcnk6IElRdWVyeSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHByb3h5LmZpbmQocXVlcnkpKVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvb2sgdXAgc21hcGkgbWV0YSBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgY2FjaGVEdXJhdGlvblNlYzogODY0MDAsXHJcbiAgICAgIHByaW9yaXR5OiAyNSxcclxuICAgIH0pO1xyXG4gICAgZGVwZW5kZW5jeU1hbmFnZXIgPSBuZXcgRGVwZW5kZW5jeU1hbmFnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnYWRkZWQtZmlsZXMnLCBhc3luYyAocHJvZmlsZUlkLCBmaWxlczogSUFkZGVkRmlsZVtdKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG5cclxuICAgICAgYXdhaXQgQmx1ZWJpcmQubWFwKGZpbGVzLCBhc3luYyBlbnRyeSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcclxuICAgICAgICAgIGlmIChmcm9tID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXHJcbiAgICAgICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVzb2x2ZSBtb2QgcGF0aCBmb3IgbW9kIHR5cGUnLCBtb2QudHlwZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGZyb20sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXHJcbiAgICAgICAgICAvLyBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3QgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ2FyZSB0aGUgc2FtZSBmaWxlJykpIHtcclxuICAgICAgICAgICAgICAvLyBzaG91bGQgd2UgYmUgcmVwb3J0aW5nIHRoaXMgdG8gdGhlIHVzZXI/IFRoaXMgaXMgYSBjb21wbGV0ZWx5XHJcbiAgICAgICAgICAgICAgLy8gYXV0b21hdGVkIHByb2Nlc3MgYW5kIGlmIGl0IGZhaWxzIG1vcmUgb2Z0ZW4gdGhhbiBub3QgdGhlXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBwcm9iYWJseSBkb2Vzbid0IGNhcmVcclxuICAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZS1pbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgJ3NtYXBpJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09ICdzbWFwaScpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lSWQsIG1vZElkKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGxvZygnZGVidWcnLCAnYWRkZWQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCB9KSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGxvZygnZGVidWcnLCAndXBkYXRpbmcgU0RWIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZU1vZGVdID8/IHt9KS5tYXAobW9kSWQgPT5cclxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2RvbmUgdXBkYXRpbmcgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHVwZGF0ZSBjb25mbGljdCBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGluaXQ7XHJcbiJdfQ==