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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFDMUMsNEVBQW9EO0FBQ3BELDJDQUFvRDtBQUVwRCw0RUFBb0Q7QUFDcEQsOERBQXNDO0FBQ3RDLG1DQUE0QztBQUM1QyxtQ0FBbUg7QUFDbkgsaUNBQXVDO0FBRXZDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDMUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ25DLEtBQUssR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQy9CLEVBQUUsUUFBUSxFQUFFLEdBQUcsaUJBQUksRUFDbkIsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFDakUsRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFcEMsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDckQsTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUUxRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzlFLE1BQU0sY0FBYyxHQUFHLEdBQUcsRUFBRTtJQUMxQixPQUFPLEtB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LENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQ0FBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDekUsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQ3hELElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ1gsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHV0aWwsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5pbXBvcnQgQ29tcGF0aWJpbGl0eUljb24gZnJvbSAnLi9Db21wYXRpYmlsaXR5SWNvbic7XHJcbmltcG9ydCB7IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcclxuaW1wb3J0IFNNQVBJUHJveHkgZnJvbSAnLi9zbWFwaVByb3h5JztcclxuaW1wb3J0IHsgdGVzdFNNQVBJT3V0ZGF0ZWQgfSBmcm9tICcuL3Rlc3RzJztcclxuaW1wb3J0IHsgY29tcGF0aWJpbGl0eU9wdGlvbnMsIENvbXBhdGliaWxpdHlTdGF0dXMsIElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QsIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBwYXJzZU1hbmlmZXN0IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyksXHJcbiAgeyBjbGlwYm9hcmQgfSA9IHJlcXVpcmUoJ2VsZWN0cm9uJyksXHJcbiAgcmpzb24gPSByZXF1aXJlKCdyZWxheGVkLWpzb24nKSxcclxuICB7IFNldmVuWmlwIH0gPSB1dGlsLFxyXG4gIHsgZGVwbG95U01BUEksIGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9ID0gcmVxdWlyZSgnLi9TTUFQSScpLFxyXG4gIHsgR0FNRV9JRCB9ID0gcmVxdWlyZSgnLi9jb21tb24nKTtcclxuXHJcbmNvbnN0IE1BTklGRVNUX0ZJTEUgPSAnbWFuaWZlc3QuanNvbic7XHJcbmNvbnN0IFBUUk5fQ09OVEVOVCA9IHBhdGguc2VwICsgJ0NvbnRlbnQnICsgcGF0aC5zZXA7XHJcbmNvbnN0IFNNQVBJX0VYRSA9ICdTdGFyZGV3TW9kZGluZ0FQSS5leGUnO1xyXG5jb25zdCBTTUFQSV9ETEwgPSAnU01BUEkuSW5zdGFsbGVyLmRsbCc7XHJcbmNvbnN0IFNNQVBJX0RBVEEgPSBbJ3dpbmRvd3MtaW5zdGFsbC5kYXQnLCAnaW5zdGFsbC5kYXQnXTtcclxuXHJcbmNvbnN0IF9TTUFQSV9CVU5ETEVEX01PRFMgPSBbJ0Vycm9ySGFuZGxlcicsICdDb25zb2xlQ29tbWFuZHMnLCAnU2F2ZUJhY2t1cCddO1xyXG5jb25zdCBnZXRCdW5kbGVkTW9kcyA9ICgpID0+IHtcclxuICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KF9TTUFQSV9CVU5ETEVEX01PRFMubWFwKG1vZE5hbWUgPT4gbW9kTmFtZS50b0xvd2VyQ2FzZSgpKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuY2xhc3MgU3RhcmRld1ZhbGxleSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcclxuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XHJcbiAgcHVibGljIGlkOiBzdHJpbmcgPSBHQU1FX0lEO1xyXG4gIHB1YmxpYyBuYW1lOiBzdHJpbmcgPSAnU3RhcmRldyBWYWxsZXknO1xyXG4gIHB1YmxpYyBsb2dvOiBzdHJpbmcgPSAnZ2FtZWFydC5qcGcnO1xyXG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgZW52aXJvbm1lbnQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XHJcbiAgICBTdGVhbUFQUElkOiAnNDEzMTUwJyxcclxuICB9O1xyXG4gIHB1YmxpYyBkZXRhaWxzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xyXG4gICAgc3RlYW1BcHBJZDogNDEzMTUwXHJcbiAgfTtcclxuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogJ3NtYXBpJyxcclxuICAgICAgbmFtZTogJ1NNQVBJJyxcclxuICAgICAgbG9nbzogJ3NtYXBpLnBuZycsXHJcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+IFNNQVBJX0VYRSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW1NNQVBJX0VYRV0sXHJcbiAgICAgIHNoZWxsOiB0cnVlLFxyXG4gICAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICBkZWZhdWx0UHJpbWFyeTogdHJ1ZSxcclxuICAgIH1cclxuICBdO1xyXG4gIHB1YmxpYyBtZXJnZU1vZHM6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyByZXF1aXJlc0NsZWFudXA6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyBzaGVsbDogYm9vbGVhbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XHJcbiAgcHVibGljIGRlZmF1bHRQYXRoczogc3RyaW5nW107XHJcblxyXG4gIC8qKioqKioqKipcclxuICAqKiBWb3J0ZXggQVBJXHJcbiAgKioqKioqKioqL1xyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdCBhbiBpbnN0YW5jZS5cclxuICAgKiBAcGFyYW0ge0lFeHRlbnNpb25Db250ZXh0fSBjb250ZXh0IC0tIFRoZSBWb3J0ZXggZXh0ZW5zaW9uIGNvbnRleHQuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICAgIC8vIHByb3BlcnRpZXMgdXNlZCBieSBWb3J0ZXhcclxuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICB0aGlzLnJlcXVpcmVkRmlsZXMgPSBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyBbJ1N0YXJkZXcgVmFsbGV5LmV4ZSddXHJcbiAgICAgIDogWydTdGFyZGV3VmFsbGV5JywgJ1N0YXJkZXdWYWxsZXkuZXhlJ107XHJcblxyXG4gICAgLy8gY3VzdG9tIHByb3BlcnRpZXNcclxuICAgIHRoaXMuZGVmYXVsdFBhdGhzID0gW1xyXG4gICAgICAvLyBMaW51eFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9HT0cgR2FtZXMvU3RhcmRldyBWYWxsZXkvZ2FtZScsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnLy5sb2NhbC9zaGFyZS9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5JyxcclxuXHJcbiAgICAgIC8vIE1hY1xyXG4gICAgICAnL0FwcGxpY2F0aW9ucy9TdGFyZGV3IFZhbGxleS5hcHAvQ29udGVudHMvTWFjT1MnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnQvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleS9Db250ZW50cy9NYWNPUycsXHJcblxyXG4gICAgICAvLyBXaW5kb3dzXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdhbGF4eUNsaWVudFxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdPRyBHYWxheHlcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxTdGVhbVxcXFxzdGVhbWFwcHNcXFxcY29tbW9uXFxcXFN0YXJkZXcgVmFsbGV5J1xyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGZpbmQgdGhlIGdhbWUgaW5zdGFsbCBwYXRoLlxyXG4gICAqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHF1aWNrbHkgYW5kLCBpZiBpdCByZXR1cm5zIGEgdmFsdWUsIGl0IHNob3VsZCBkZWZpbml0aXZlbHkgYmUgdGhlXHJcbiAgICogdmFsaWQgZ2FtZSBwYXRoLiBVc3VhbGx5IHRoaXMgZnVuY3Rpb24gd2lsbCBxdWVyeSB0aGUgcGF0aCBmcm9tIHRoZSByZWdpc3RyeSBvciBmcm9tIHN0ZWFtLlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gbWF5IHJldHVybiBhIHByb21pc2UgYW5kIGl0IHNob3VsZCBkbyB0aGF0IGlmIGl0J3MgZG9pbmcgSS9PLlxyXG4gICAqXHJcbiAgICogVGhpcyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgYnV0IHRoZW4gdGhlIHRvb2wvZ2FtZSBjYW4gb25seSBiZSBkaXNjb3ZlcmVkIGJ5IHNlYXJjaGluZyB0aGUgZGlza1xyXG4gICAqIHdoaWNoIGlzIHNsb3cgYW5kIG9ubHkgaGFwcGVucyBtYW51YWxseS5cclxuICAgKi9cclxuICBwdWJsaWMgcXVlcnlQYXRoID0gdG9CbHVlKGFzeW5jICgpID0+IHtcclxuICAgIC8vIGNoZWNrIFN0ZWFtXHJcbiAgICBjb25zdCBnYW1lID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoWyc0MTMxNTAnLCAnMTQ1MzM3NTI1MyddKTtcclxuICAgIGlmIChnYW1lKVxyXG4gICAgICByZXR1cm4gZ2FtZS5nYW1lUGF0aDtcclxuXHJcbiAgICAvLyBjaGVjayBkZWZhdWx0IHBhdGhzXHJcbiAgICBmb3IgKGNvbnN0IGRlZmF1bHRQYXRoIG9mIHRoaXMuZGVmYXVsdFBhdGhzKVxyXG4gICAge1xyXG4gICAgICBpZiAoYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoZGVmYXVsdFBhdGgpKVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0UGF0aDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwYXRoIG9mIHRoZSB0b29sIGV4ZWN1dGFibGUgcmVsYXRpdmUgdG8gdGhlIHRvb2wgYmFzZSBwYXRoLCBpLmUuIGJpbmFyaWVzL1VUMy5leGUgb3JcclxuICAgKiBURVNWLmV4ZS4gVGhpcyBpcyBhIGZ1bmN0aW9uIHNvIHRoYXQgeW91IGNhbiByZXR1cm4gZGlmZmVyZW50IHRoaW5ncyBiYXNlZCBvbiB0aGUgb3BlcmF0aW5nXHJcbiAgICogc3lzdGVtIGZvciBleGFtcGxlIGJ1dCBiZSBhd2FyZSB0aGF0IGl0IHdpbGwgYmUgZXZhbHVhdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0IGFuZCBvbmx5IG9uY2UsXHJcbiAgICogc28gdGhlIHJldHVybiB2YWx1ZSBjYW4gbm90IGRlcGVuZCBvbiB0aGluZ3MgdGhhdCBjaGFuZ2UgYXQgcnVudGltZS5cclxuICAgKi9cclxuICBwdWJsaWMgZXhlY3V0YWJsZSgpIHtcclxuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyAnU3RhcmRldyBWYWxsZXkuZXhlJ1xyXG4gICAgICA6ICdTdGFyZGV3VmFsbGV5JztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgZGVmYXVsdCBkaXJlY3Rvcnkgd2hlcmUgbW9kcyBmb3IgdGhpcyBnYW1lIHNob3VsZCBiZSBzdG9yZWQuXHJcbiAgICogXHJcbiAgICogSWYgdGhpcyByZXR1cm5zIGEgcmVsYXRpdmUgcGF0aCB0aGVuIHRoZSBwYXRoIGlzIHRyZWF0ZWQgYXMgcmVsYXRpdmUgdG8gdGhlIGdhbWUgaW5zdGFsbGF0aW9uXHJcbiAgICogZGlyZWN0b3J5LiBTaW1wbHkgcmV0dXJuIGEgZG90ICggKCkgPT4gJy4nICkgaWYgbW9kcyBhcmUgaW5zdGFsbGVkIGRpcmVjdGx5IGludG8gdGhlIGdhbWVcclxuICAgKiBkaXJlY3RvcnkuXHJcbiAgICovIFxyXG4gIHB1YmxpYyBxdWVyeU1vZFBhdGgoKVxyXG4gIHtcclxuICAgIHJldHVybiAnTW9kcyc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcHRpb25hbCBzZXR1cCBmdW5jdGlvbi4gSWYgdGhpcyBnYW1lIHJlcXVpcmVzIHNvbWUgZm9ybSBvZiBzZXR1cCBiZWZvcmUgaXQgY2FuIGJlIG1vZGRlZCAobGlrZVxyXG4gICAqIGNyZWF0aW5nIGEgZGlyZWN0b3J5LCBjaGFuZ2luZyBhIHJlZ2lzdHJ5IGtleSwgLi4uKSBkbyBpdCBoZXJlLiBJdCB3aWxsIGJlIGNhbGxlZCBldmVyeSB0aW1lXHJcbiAgICogYmVmb3JlIHRoZSBnYW1lIG1vZGUgaXMgYWN0aXZhdGVkLlxyXG4gICAqIEBwYXJhbSB7SURpc2NvdmVyeVJlc3VsdH0gZGlzY292ZXJ5IC0tIGJhc2ljIGluZm8gYWJvdXQgdGhlIGdhbWUgYmVpbmcgbG9hZGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXR1cCA9IHRvQmx1ZShhc3luYyAoZGlzY292ZXJ5KSA9PiB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGZvbGRlciBmb3IgU01BUEkgbW9kcyBleGlzdHMuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBza2lwIGlmIFNNQVBJIGZvdW5kXHJcbiAgICBjb25zdCBzbWFwaVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIFNNQVBJX0VYRSk7XHJcbiAgICBjb25zdCBzbWFwaUZvdW5kID0gYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoc21hcGlQYXRoKTtcclxuICAgIGlmIChzbWFwaUZvdW5kKVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QodGhpcy5jb250ZXh0LmFwaSk7XHJcbiAgICBjb25zdCB0aXRsZSA9IHNtYXBpTW9kID8gJ1NNQVBJIGlzIG5vdCBkZXBsb3llZCcgOiAnU01BUEkgaXMgbm90IGluc3RhbGxlZCc7XHJcbiAgICBjb25zdCBhY3Rpb25UaXRsZSA9IHNtYXBpTW9kID8gJ0RlcGxveScgOiAnR2V0IFNNQVBJJztcclxuICAgIGNvbnN0IGFjdGlvbiA9ICgpID0+IChzbWFwaU1vZFxyXG4gICAgICA/IGRlcGxveVNNQVBJKHRoaXMuY29udGV4dC5hcGkpXHJcbiAgICAgIDogZG93bmxvYWRTTUFQSSh0aGlzLmNvbnRleHQuYXBpKSlcclxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5jb250ZXh0LmFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdzbWFwaS1taXNzaW5nJykpO1xyXG5cclxuICAgIHRoaXMuY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnc21hcGktbWlzc2luZycsXHJcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgdGl0bGUsXHJcbiAgICAgIG1lc3NhZ2U6ICdTTUFQSSBpcyByZXF1aXJlZCB0byBtb2QgU3RhcmRldyBWYWxsZXkuJyxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiBhY3Rpb25UaXRsZSxcclxuICAgICAgICAgIGFjdGlvbixcclxuICAgICAgICB9LFxyXG4gICAgICBdXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcblxyXG4gIC8qKioqKioqKipcclxuICAqKiBJbnRlcm5hbCBtZXRob2RzXHJcbiAgKioqKioqKioqL1xyXG5cclxuICAvKipcclxuICAgKiBBc3luY2hyb25vdXNseSBjaGVjayB3aGV0aGVyIGEgZmlsZSBvciBkaXJlY3RvcnkgcGF0aCBleGlzdHMuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBUaGUgZmlsZSBvciBkaXJlY3RvcnkgcGF0aC5cclxuICAgKi9cclxuICBhc3luYyBnZXRQYXRoRXhpc3RzQXN5bmMocGF0aClcclxuICB7XHJcbiAgICB0cnkge1xyXG4gICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoKTtcclxuICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGNhdGNoKGVycikge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBc3luY2hyb25vdXNseSByZWFkIGEgcmVnaXN0cnkga2V5IHZhbHVlLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoaXZlIC0gVGhlIHJlZ2lzdHJ5IGhpdmUgdG8gYWNjZXNzLiBUaGlzIHNob3VsZCBiZSBhIGNvbnN0YW50IGxpa2UgUmVnaXN0cnkuSEtMTS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gVGhlIHJlZ2lzdHJ5IGtleS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0byByZWFkLlxyXG4gICAqL1xyXG4gIGFzeW5jIHJlYWRSZWdpc3RyeUtleUFzeW5jKGhpdmUsIGtleSwgbmFtZSlcclxuICB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShoaXZlLCBrZXksIG5hbWUpO1xyXG4gICAgICBpZiAoIWluc3RQYXRoKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RQYXRoLnZhbHVlKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Um9vdEZvbGRlcihmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gV2UgYXNzdW1lIHRoYXQgYW55IG1vZCBjb250YWluaW5nIFwiL0NvbnRlbnQvXCIgaW4gaXRzIGRpcmVjdG9yeVxyXG4gIC8vICBzdHJ1Y3R1cmUgaXMgbWVhbnQgdG8gYmUgZGVwbG95ZWQgdG8gdGhlIHJvb3QgZm9sZGVyLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkpXHJcbiAgICAubWFwKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkpO1xyXG4gIGNvbnN0IGNvbnRlbnREaXIgPSBmaWx0ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIChjb250ZW50RGlyICE9PSB1bmRlZmluZWQpKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUm9vdEZvbGRlcihmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gV2UncmUgZ29pbmcgdG8gZGVwbG95IFwiL0NvbnRlbnQvXCIgYW5kIHdoYXRldmVyIGZvbGRlcnMgY29tZSBhbG9uZ3NpZGUgaXQuXHJcbiAgLy8gIGkuZS4gU29tZU1vZC43elxyXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL0NvbnRlbnQvXHJcbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvTW9kcy9cclxuICAvLyAgV2lsbCBOT1QgYmUgZGVwbG95ZWQgPT4gLi4vUmVhZG1lLmRvY1xyXG4gIGNvbnN0IGNvbnRlbnRGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gIGNvbnN0IGlkeCA9IGNvbnRlbnRGaWxlLmluZGV4T2YoUFRSTl9DT05URU5UKSArIDE7XHJcbiAgY29uc3Qgcm9vdERpciA9IHBhdGguYmFzZW5hbWUoY29udGVudEZpbGUuc3Vic3RyaW5nKDAsIGlkeCkpO1xyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApXHJcbiAgICAmJiAoZmlsZS5pbmRleE9mKHJvb3REaXIpICE9PSAtMSlcclxuICAgICYmIChwYXRoLmV4dG5hbWUoZmlsZSkgIT09ICcudHh0JykpO1xyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLm1hcChmaWxlID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbjogZmlsZS5zdWJzdHIoaWR4KSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1ZhbGlkTWFuaWZlc3QoZmlsZVBhdGgpIHtcclxuICBjb25zdCBzZWdtZW50cyA9IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gIGNvbnN0IGlzTWFuaWZlc3RGaWxlID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0gPT09IE1BTklGRVNUX0ZJTEU7XHJcbiAgY29uc3QgaXNMb2NhbGUgPSBzZWdtZW50cy5pbmNsdWRlcygnbG9jYWxlJyk7XHJcbiAgcmV0dXJuIGlzTWFuaWZlc3RGaWxlICYmICFpc0xvY2FsZTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIChmaWxlcy5maW5kKGlzVmFsaWRNYW5pZmVzdCkgIT09IHVuZGVmaW5lZClcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4ge1xyXG4gICAgICAvLyBXZSBjcmVhdGUgYSBwcmVmaXggZmFrZSBkaXJlY3RvcnkganVzdCBpbiBjYXNlIHRoZSBjb250ZW50XHJcbiAgICAgIC8vICBmb2xkZXIgaXMgaW4gdGhlIGFyY2hpdmUncyByb290IGZvbGRlci4gVGhpcyBpcyB0byBlbnN1cmUgd2VcclxuICAgICAgLy8gIGZpbmQgYSBtYXRjaCBmb3IgXCIvQ29udGVudC9cIlxyXG4gICAgICBjb25zdCB0ZXN0RmlsZSA9IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpO1xyXG4gICAgICByZXR1cm4gKHRlc3RGaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gICAgfSkgPT09IHVuZGVmaW5lZCk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsKGFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmN5TWFuYWdlcixcclxuICAgICAgICAgICAgICAgICAgICAgICBmaWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBUaGUgYXJjaGl2ZSBtYXkgY29udGFpbiBtdWx0aXBsZSBtYW5pZmVzdCBmaWxlcyB3aGljaCB3b3VsZFxyXG4gIC8vICBpbXBseSB0aGF0IHdlJ3JlIGluc3RhbGxpbmcgbXVsdGlwbGUgbW9kcy5cclxuICBjb25zdCBtYW5pZmVzdEZpbGVzID0gZmlsZXMuZmlsdGVyKGlzVmFsaWRNYW5pZmVzdCk7XHJcblxyXG4gIGludGVyZmFjZSBJTW9kSW5mbyB7XHJcbiAgICBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0O1xyXG4gICAgcm9vdEZvbGRlcjogc3RyaW5nO1xyXG4gICAgbWFuaWZlc3RJbmRleDogbnVtYmVyO1xyXG4gICAgbW9kRmlsZXM6IHN0cmluZ1tdO1xyXG4gIH1cclxuXHJcbiAgbGV0IHBhcnNlRXJyb3I6IEVycm9yO1xyXG5cclxuICBhd2FpdCBkZXBlbmRlbmN5TWFuYWdlci5zY2FuTWFuaWZlc3RzKHRydWUpO1xyXG4gIGxldCBtb2RzOiBJTW9kSW5mb1tdID0gYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RGaWxlcy5tYXAoYXN5bmMgbWFuaWZlc3RGaWxlID0+IHtcclxuICAgIGNvbnN0IHJvb3RGb2xkZXIgPSBwYXRoLmRpcm5hbWUobWFuaWZlc3RGaWxlKTtcclxuICAgIGNvbnN0IG1hbmlmZXN0SW5kZXggPSBtYW5pZmVzdEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKE1BTklGRVNUX0ZJTEUpO1xyXG4gICAgY29uc3QgZmlsdGVyRnVuYyA9IChmaWxlKSA9PiAocm9vdEZvbGRlciAhPT0gJy4nKVxyXG4gICAgICA/ICgoZmlsZS5pbmRleE9mKHJvb3RGb2xkZXIpICE9PSAtMSlcclxuICAgICAgICAmJiAocGF0aC5kaXJuYW1lKGZpbGUpICE9PSAnLicpXHJcbiAgICAgICAgJiYgIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxyXG4gICAgICA6ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPVxyXG4gICAgICAgIGF3YWl0IHBhcnNlTWFuaWZlc3QocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbWFuaWZlc3RGaWxlKSk7XHJcbiAgICAgIGNvbnN0IG1vZEZpbGVzID0gZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIG1hbmlmZXN0LFxyXG4gICAgICAgIHJvb3RGb2xkZXIsXHJcbiAgICAgICAgbWFuaWZlc3RJbmRleCxcclxuICAgICAgICBtb2RGaWxlcyxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBqdXN0IGEgd2FybmluZyBhdCB0aGlzIHBvaW50IGFzIHRoaXMgbWF5IG5vdCBiZSB0aGUgbWFpbiBtYW5pZmVzdCBmb3IgdGhlIG1vZFxyXG4gICAgICBsb2coJ3dhcm4nLCAnRmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBtYW5pZmVzdEZpbGUsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgcGFyc2VFcnJvciA9IGVycjtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICB9KSk7XHJcblxyXG4gIG1vZHMgPSBtb2RzLmZpbHRlcih4ID0+IHggIT09IHVuZGVmaW5lZCk7XHJcbiAgXHJcbiAgaWYgKG1vZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxyXG4gICAgICAnVGhlIG1vZCBtYW5pZmVzdCBpcyBpbnZhbGlkIGFuZCBjYW5cXCd0IGJlIHJlYWQuIFlvdSBjYW4gdHJ5IHRvIGluc3RhbGwgdGhlIG1vZCBhbnl3YXkgdmlhIHJpZ2h0LWNsaWNrIC0+IFwiVW5wYWNrIChhcy1pcylcIicsXHJcbiAgICAgIHBhcnNlRXJyb3IsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQubWFwKG1vZHMsIG1vZCA9PiB7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gKG1vZC5yb290Rm9sZGVyICE9PSAnLicpXHJcbiAgICAgID8gbW9kLnJvb3RGb2xkZXJcclxuICAgICAgOiBtb2QubWFuaWZlc3QuTmFtZTtcclxuXHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtb2QubWFuaWZlc3QuRGVwZW5kZW5jaWVzIHx8IFtdO1xyXG5cclxuICAgIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbW9kLm1vZEZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gcGF0aC5qb2luKG1vZE5hbWUsIGZpbGUuc3Vic3RyKG1vZC5tYW5pZmVzdEluZGV4KSk7XHJcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWRkUnVsZUZvckRlcGVuZGVuY3kgPSAoZGVwOiBJU0RWRGVwZW5kZW5jeSkgPT4ge1xyXG4gICAgICBpZiAoKGRlcC5VbmlxdWVJRCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgfHwgKGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpID09PSAneW91cm5hbWUueW91cm90aGVyc3BhY2tzYW5kbW9kcycpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSBkZXAuTWluaW11bVZlcnNpb24gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gYD49JHtkZXAuTWluaW11bVZlcnNpb259YFxyXG4gICAgICAgIDogJyonO1xyXG4gICAgICBjb25zdCBydWxlOiB0eXBlcy5JTW9kUnVsZSA9IHtcclxuICAgICAgICB0eXBlOiAoZGVwLklzUmVxdWlyZWQgPz8gdHJ1ZSkgPyAncmVxdWlyZXMnIDogJ3JlY29tbWVuZHMnLFxyXG4gICAgICAgIHJlZmVyZW5jZToge1xyXG4gICAgICAgICAgbG9naWNhbEZpbGVOYW1lOiBkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgIHZlcnNpb25NYXRjaCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGV4dHJhOiB7XHJcbiAgICAgICAgICBvbmx5SWZGdWxmaWxsYWJsZTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9O1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ3J1bGUnLFxyXG4gICAgICAgIHJ1bGUsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcGVuZGVuY2llcykge1xyXG4gICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShkZXApO1xyXG4gICAgfVxyXG4gICAgaWYgKG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0ZvciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0Zvcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5zdHJ1Y3Rpb25zO1xyXG4gIH0pXHJcbiAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gW10uY29uY2F0KGRhdGEpLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IGFjY3VtLmNvbmNhdChpdGVyKSwgW10pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzU01BUElNb2RUeXBlKGluc3RydWN0aW9ucykge1xyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGV4ZSBmaWxlLlxyXG4gIGNvbnN0IHNtYXBpRGF0YSA9IGluc3RydWN0aW9ucy5maW5kKGluc3QgPT4gKGluc3QudHlwZSA9PT0gJ2NvcHknKSAmJiBpbnN0LnNvdXJjZS5lbmRzV2l0aChTTUFQSV9FWEUpKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoc21hcGlEYXRhICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U01BUEkoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIE1ha2Ugc3VyZSB0aGUgZG93bmxvYWQgY29udGFpbnMgdGhlIFNNQVBJIGRhdGEgYXJjaGl2ZS5zXHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PlxyXG4gICAgcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gU01BUElfRExMKSAhPT0gdW5kZWZpbmVkKVxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgICAgc3VwcG9ydGVkLFxyXG4gICAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFNNQVBJKGdldERpc2NvdmVyeVBhdGgsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICBjb25zdCBmb2xkZXIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInXHJcbiAgICA/ICd3aW5kb3dzJ1xyXG4gICAgOiBwcm9jZXNzLnBsYXRmb3JtID09PSAnbGludXgnXHJcbiAgICAgID8gJ2xpbnV4J1xyXG4gICAgICA6ICdtYWNvcyc7XHJcbiAgY29uc3QgZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybSA9IChmaWxlKSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgcmV0dXJuIChzZWdtZW50cy5pbmNsdWRlcyhmb2xkZXIpKTtcclxuICB9XHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZGF0YSBhcmNoaXZlXHJcbiAgY29uc3QgZGF0YUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4ge1xyXG4gICAgY29uc3QgaXNDb3JyZWN0UGxhdGZvcm0gPSBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtKGZpbGUpO1xyXG4gICAgcmV0dXJuIGlzQ29ycmVjdFBsYXRmb3JtICYmIFNNQVBJX0RBVEEuaW5jbHVkZXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKVxyXG4gIH0pO1xyXG4gIGlmIChkYXRhRmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBmaW5kIHRoZSBTTUFQSSBkYXRhIGZpbGVzIC0gZG93bmxvYWQgYXBwZWFycyAnXHJcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XHJcbiAgfVxyXG4gIGxldCBkYXRhID0gJyc7XHJcbiAgdHJ5IHtcclxuICAgIGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihnZXREaXNjb3ZlcnlQYXRoKCksICdTdGFyZGV3IFZhbGxleS5kZXBzLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgU0RWIGRlcGVuZGVuY2llcycsIGVycik7XHJcbiAgfVxyXG5cclxuICAvLyBmaWxlIHdpbGwgYmUgb3V0ZGF0ZWQgYWZ0ZXIgdGhlIHdhbGsgb3BlcmF0aW9uIHNvIHByZXBhcmUgYSByZXBsYWNlbWVudC4gXHJcbiAgY29uc3QgdXBkYXRlZEZpbGVzID0gW107XHJcblxyXG4gIGNvbnN0IHN6aXAgPSBuZXcgU2V2ZW5aaXAoKTtcclxuICAvLyBVbnppcCB0aGUgZmlsZXMgZnJvbSB0aGUgZGF0YSBhcmNoaXZlLiBUaGlzIGRvZXNuJ3Qgc2VlbSB0byBiZWhhdmUgYXMgZGVzY3JpYmVkIGhlcmU6IGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL25vZGUtN3ojZXZlbnRzXHJcbiAgYXdhaXQgc3ppcC5leHRyYWN0RnVsbChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBkYXRhRmlsZSksIGRlc3RpbmF0aW9uUGF0aCk7XHJcblxyXG4gIC8vIEZpbmQgYW55IGZpbGVzIHRoYXQgYXJlIG5vdCBpbiB0aGUgcGFyZW50IGZvbGRlci4gXHJcbiAgYXdhaXQgdXRpbC53YWxrKGRlc3RpbmF0aW9uUGF0aCwgKGl0ZXIsIHN0YXRzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRlc3RpbmF0aW9uUGF0aCwgaXRlcik7XHJcbiAgICAgIC8vIEZpbHRlciBvdXQgZmlsZXMgZnJvbSB0aGUgb3JpZ2luYWwgaW5zdGFsbCBhcyB0aGV5J3JlIG5vIGxvbmdlciByZXF1aXJlZC5cclxuICAgICAgaWYgKCFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoKSAmJiBzdGF0cy5pc0ZpbGUoKSAmJiAhZmlsZXMuaW5jbHVkZXMocmVsUGF0aCtwYXRoLnNlcCkpIHVwZGF0ZWRGaWxlcy5wdXNoKHJlbFBhdGgpO1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IHJlbFBhdGgudG9Mb2NhbGVMb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGNvbnN0IG1vZHNGb2xkZXJJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICAgIGlmICgobW9kc0ZvbGRlcklkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzRm9sZGVySWR4ICsgMSkpIHtcclxuICAgICAgICBfU01BUElfQlVORExFRF9NT0RTLnB1c2goc2VnbWVudHNbbW9kc0ZvbGRlcklkeCArIDFdKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS4gXHJcbiAgY29uc3Qgc21hcGlFeGUgPSB1cGRhdGVkRmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5lbmRzV2l0aChTTUFQSV9FWEUudG9Mb3dlckNhc2UoKSkpO1xyXG4gIGlmIChzbWFwaUV4ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBleHRyYWN0ICR7U01BUElfRVhFfSAtIGRvd25sb2FkIGFwcGVhcnMgYFxyXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xyXG4gIH1cclxuICBjb25zdCBpZHggPSBzbWFwaUV4ZS5pbmRleE9mKHBhdGguYmFzZW5hbWUoc21hcGlFeGUpKTtcclxuXHJcbiAgLy8gQnVpbGQgdGhlIGluc3RydWN0aW9ucyBmb3IgaW5zdGFsbGF0aW9uLiBcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gdXBkYXRlZEZpbGVzLm1hcChmaWxlID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oZmlsZS5zdWJzdHIoaWR4KSksXHJcbiAgICAgIH1cclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICBrZXk6ICdzbWFwaUJ1bmRsZWRNb2RzJyxcclxuICAgIHZhbHVlOiBnZXRCdW5kbGVkTW9kcygpLFxyXG4gIH0pO1xyXG5cclxuICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICB0eXBlOiAnZ2VuZXJhdGVmaWxlJyxcclxuICAgIGRhdGEsXHJcbiAgICBkZXN0aW5hdGlvbjogJ1N0YXJkZXdNb2RkaW5nQVBJLmRlcHMuanNvbicsXHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBsb2dGaWxlKSB7XHJcbiAgY29uc3QgbG9nRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGJhc2VQYXRoLCBsb2dGaWxlKSwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KTtcclxuICBhd2FpdCBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdTTUFQSSBMb2cnLCB7XHJcbiAgICB0ZXh0OiAnWW91ciBTTUFQSSBsb2cgaXMgZGlzcGxheWVkIGJlbG93LiBUbyBzaGFyZSBpdCwgY2xpY2sgXCJDb3B5ICYgU2hhcmVcIiB3aGljaCB3aWxsIGNvcHkgaXQgdG8geW91ciBjbGlwYm9hcmQgYW5kIG9wZW4gdGhlIFNNQVBJIGxvZyBzaGFyaW5nIHdlYnNpdGUuICcgK1xyXG4gICAgICAnTmV4dCwgcGFzdGUgeW91ciBjb2RlIGludG8gdGhlIHRleHQgYm94IGFuZCBwcmVzcyBcInNhdmUgJiBwYXJzZSBsb2dcIi4gWW91IGNhbiBub3cgc2hhcmUgYSBsaW5rIHRvIHRoaXMgcGFnZSB3aXRoIG90aGVycyBzbyB0aGV5IGNhbiBzZWUgeW91ciBsb2cgZmlsZS5cXG5cXG4nICsgbG9nRGF0YVxyXG4gIH0sIFt7XHJcbiAgICBsYWJlbDogJ0NvcHkgJiBTaGFyZSBsb2cnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL14uK1QoW15cXC5dKykuKy8sICckMScpO1xyXG4gICAgICBjbGlwYm9hcmQud3JpdGVUZXh0KGBbJHt0aW1lc3RhbXB9IElORk8gVm9ydGV4XSBMb2cgZXhwb3J0ZWQgYnkgVm9ydGV4ICR7dXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb259LlxcbmAgKyBsb2dEYXRhKTtcclxuICAgICAgcmV0dXJuIHV0aWwub3BuKCdodHRwczovL3NtYXBpLmlvL2xvZycpLmNhdGNoKGVyciA9PiB1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH0sIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gdW5kZWZpbmVkIH1dKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25TaG93U01BUElMb2coYXBpKSB7XHJcbiAgLy9SZWFkIGFuZCBkaXNwbGF5IHRoZSBsb2cuXHJcbiAgY29uc3QgYmFzZVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdhcHBEYXRhJyksICdzdGFyZGV3dmFsbGV5JywgJ2Vycm9ybG9ncycpO1xyXG4gIHRyeSB7XHJcbiAgICAvL0lmIHRoZSBjcmFzaCBsb2cgZXhpc3RzLCBzaG93IHRoYXQuXHJcbiAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1jcmFzaC50eHRcIik7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAvL090aGVyd2lzZSBzaG93IHRoZSBub3JtYWwgbG9nLlxyXG4gICAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1sYXRlc3QudHh0XCIpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vT3IgSW5mb3JtIHRoZSB1c2VyIHRoZXJlIGFyZSBubyBsb2dzLlxyXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7IHR5cGU6ICdpbmZvJywgdGl0bGU6ICdObyBTTUFQSSBsb2dzIGZvdW5kLicsIG1lc3NhZ2U6ICcnLCBkaXNwbGF5TVM6IDUwMDAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBjb25zdCBtYW5pZmVzdHM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gIGlmIChtb2RQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xyXG4gICAgICBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09ICdtYW5pZmVzdC5qc29uJykge1xyXG4gICAgICAgIG1hbmlmZXN0cy5wdXNoKGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KVxyXG4gICAgLnRoZW4oKCkgPT4gbWFuaWZlc3RzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlQ29uZmxpY3RJbmZvKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYXBpOiBTTUFQSVByb3h5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RJZDogc3RyaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBtb2QgPSBhcGkuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZUlkXVttb2RJZF07XHJcblxyXG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgaWYgKChub3cgLSBtb2QuYXR0cmlidXRlcz8ubGFzdFNNQVBJUXVlcnkgPz8gMCkgPCBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGxldCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IG1vZC5hdHRyaWJ1dGVzPy5hZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcztcclxuICBpZiAoIWFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzKSB7XHJcbiAgICBpZiAobW9kLmF0dHJpYnV0ZXM/LmxvZ2ljYWxGaWxlTmFtZSkge1xyXG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFttb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBxdWVyeSA9IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzXHJcbiAgICAubWFwKG5hbWUgPT4ge1xyXG4gICAgICBjb25zdCByZXMgPSB7XHJcbiAgICAgICAgaWQ6IG5hbWUsXHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IHZlciA9IG1vZC5hdHRyaWJ1dGVzPy5tYW5pZmVzdFZlcnNpb25cclxuICAgICAgICAgICAgICAgICAgICAgPz8gc2VtdmVyLmNvZXJjZShtb2QuYXR0cmlidXRlcz8udmVyc2lvbik/LnZlcnNpb247XHJcbiAgICAgIGlmICghIXZlcikge1xyXG4gICAgICAgIHJlc1snaW5zdGFsbGVkVmVyc2lvbiddID0gdmVyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHN0YXQgPSAoaXRlbTogSVNNQVBJUmVzdWx0KTogQ29tcGF0aWJpbGl0eVN0YXR1cyA9PiB7XHJcbiAgICBjb25zdCBzdGF0dXMgPSBpdGVtLm1ldGFkYXRhPy5jb21wYXRpYmlsaXR5U3RhdHVzPy50b0xvd2VyQ2FzZT8uKCk7XHJcbiAgICBpZiAoIWNvbXBhdGliaWxpdHlPcHRpb25zLmluY2x1ZGVzKHN0YXR1cyBhcyBhbnkpKSB7XHJcbiAgICAgIHJldHVybiAndW5rbm93bic7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gc3RhdHVzIGFzIENvbXBhdGliaWxpdHlTdGF0dXM7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgY29tcGF0aWJpbGl0eVByaW8gPSAoaXRlbTogSVNNQVBJUmVzdWx0KSA9PiBjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmRleE9mKHN0YXQoaXRlbSkpO1xyXG5cclxuICByZXR1cm4gc21hcGkuZmluZEJ5TmFtZXMocXVlcnkpXHJcbiAgICAudGhlbihyZXN1bHRzID0+IHtcclxuICAgICAgY29uc3Qgd29yc3RTdGF0dXM6IElTTUFQSVJlc3VsdFtdID0gcmVzdWx0c1xyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gY29tcGF0aWJpbGl0eVByaW8obGhzKSAtIGNvbXBhdGliaWxpdHlQcmlvKHJocykpO1xyXG4gICAgICBpZiAod29yc3RTdGF0dXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZXMoZ2FtZUlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgbGFzdFNNQVBJUXVlcnk6IG5vdyxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlTdGF0dXM6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5TWVzc2FnZTogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN1bW1hcnksXHJcbiAgICAgICAgICBjb21wYXRpYmlsaXR5VXBkYXRlOiB3b3JzdFN0YXR1c1swXS5zdWdnZXN0ZWRVcGRhdGU/LnZlcnNpb24sXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvZygnZGVidWcnLCAnbm8gbWFuaWZlc3QnKTtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCd3YXJuJywgJ2Vycm9yIHJlYWRpbmcgbWFuaWZlc3QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgbGV0IGRlcGVuZGVuY3lNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcjtcclxuICBjb25zdCBnZXREaXNjb3ZlcnlQYXRoID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXHJcbiAgICAgIGxvZygnZXJyb3InLCAnc3RhcmRld3ZhbGxleSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfVxyXG5cclxuICBjb25zdCBnZXRTTUFQSVBhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9O1xyXG5cclxuICBjb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcclxuICAgIGlmIChtb2Q/LmlkID09PSB1bmRlZmluZWQgfHwgbW9kLnR5cGUgPT09ICdzZHZyb290Zm9sZGVyJykge1xyXG4gICAgICAvLyBUaGVyZSBpcyBubyByZWxpYWJsZSB3YXkgdG8gYXNjZXJ0YWluIHdoZXRoZXIgYSBuZXcgZmlsZSBlbnRyeVxyXG4gICAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcclxuICAgICAgLy8gIGFzIHJlcGxhY2VtZW50IG1vZHMuIFRoaXMgb2J2aW91c2x5IG1lYW5zIHRoYXQgaWYgdGhlIGdhbWUgaGFzXHJcbiAgICAgIC8vICBhIHN1YnN0YW50aWFsIHVwZGF0ZSB3aGljaCBpbnRyb2R1Y2VzIG5ldyBmaWxlcyB3ZSBjb3VsZCBwb3RlbnRpYWxseVxyXG4gICAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxyXG4gICAgICAvLyAgY29udGVudGlvbiBiZXR3ZWVuIHRoZSBnYW1lIGl0c2VsZiAod2hlbiBpdCB1cGRhdGVzKSBhbmQgdGhlIG1vZC5cclxuICAgICAgLy9cclxuICAgICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXHJcbiAgICAgIC8vICBtb2RzLCB3aGljaCBpcyB3aHkgaXQncyBub3Qgc2FmZSB0byBhc3N1bWUgdGhhdCBhbnkgYWRkaXRpb24gaW5zaWRlIHRoZVxyXG4gICAgICAvLyAgbW9kcyBkaXJlY3RvcnkgY2FuIGJlIHNhZmVseSBhZGRlZCB0byB0aGlzIG1vZCdzIHN0YWdpbmcgZm9sZGVyIGVpdGhlci5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChtb2QudHlwZSAhPT0gJ1NNQVBJJykge1xyXG4gICAgICAvLyBPdGhlciBtb2QgdHlwZXMgZG8gbm90IHJlcXVpcmUgZnVydGhlciB2YWxpZGF0aW9uIC0gaXQgc2hvdWxkIGJlIGZpbmVcclxuICAgICAgLy8gIHRvIGFkZCB0aGlzIGVudHJ5LlxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgY29uc3QgbW9kc1NlZ0lkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgIGNvbnN0IG1vZEZvbGRlck5hbWUgPSAoKG1vZHNTZWdJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc1NlZ0lkeCArIDEpKVxyXG4gICAgICA/IHNlZ21lbnRzW21vZHNTZWdJZHggKyAxXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICBsZXQgYnVuZGxlZE1vZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnc21hcGlCdW5kbGVkTW9kcyddLCBbXSk7XHJcbiAgICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XHJcbiAgICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ2NvbnRlbnQnKSkge1xyXG4gICAgICAvLyBTTUFQSSBpcyBub3Qgc3VwcG9zZWQgdG8gb3ZlcndyaXRlIHRoZSBnYW1lJ3MgY29udGVudCBkaXJlY3RseS5cclxuICAgICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKG1vZEZvbGRlck5hbWUgIT09IHVuZGVmaW5lZCkgJiYgYnVuZGxlZE1vZHMuaW5jbHVkZXMobW9kRm9sZGVyTmFtZSk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWFuaWZlc3RFeHRyYWN0b3IgPSB0b0JsdWUoXHJcbiAgICBhc3luYyAobW9kSW5mbzogYW55LCBtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueTsgfT4gPT4ge1xyXG4gICAgICBpZiAoc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aCk7XHJcblxyXG4gICAgICBjb25zdCBwYXJzZWRNYW5pZmVzdHMgPSAoYXdhaXQgUHJvbWlzZS5hbGwobWFuaWZlc3RzLm1hcChcclxuICAgICAgICBhc3luYyBtYW5pZmVzdCA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcGFyc2VNYW5pZmVzdChtYW5pZmVzdCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgbWFuaWZlc3RGaWxlOiBtYW5pZmVzdCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pKSkuZmlsdGVyKG1hbmlmZXN0ID0+IG1hbmlmZXN0ICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICAgICAgaWYgKHBhcnNlZE1hbmlmZXN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gd2UgY2FuIG9ubHkgdXNlIG9uZSBtYW5pZmVzdCB0byBnZXQgdGhlIGlkIGZyb21cclxuICAgICAgY29uc3QgcmVmTWFuaWZlc3QgPSBwYXJzZWRNYW5pZmVzdHNbMF07XHJcblxyXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IHBhcnNlZE1hbmlmZXN0c1xyXG4gICAgICAgIC5maWx0ZXIobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlELnRvTG93ZXJDYXNlKCkpO1xyXG5cclxuICAgICAgY29uc3QgbWluU01BUElWZXJzaW9uID0gcGFyc2VkTWFuaWZlc3RzXHJcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5NaW5pbXVtQXBpVmVyc2lvbilcclxuICAgICAgICAuZmlsdGVyKHZlcnNpb24gPT4gc2VtdmVyLnZhbGlkKHZlcnNpb24pKVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLCBsaHMpKVswXTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyxcclxuICAgICAgICBtaW5TTUFQSVZlcnNpb24sXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAocmVmTWFuaWZlc3QgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIGRvbid0IHNldCBhIGN1c3RvbSBmaWxlIG5hbWUgZm9yIFNNQVBJXHJcbiAgICAgICAgaWYgKG1vZEluZm8uZG93bmxvYWQubW9kSW5mbz8ubmV4dXM/Lmlkcz8ubW9kSWQgIT09IDI0MDApIHtcclxuICAgICAgICAgIHJlc3VsdFsnY3VzdG9tRmlsZU5hbWUnXSA9IHJlZk1hbmlmZXN0Lk5hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIChyZWZNYW5pZmVzdC5WZXJzaW9uKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIHJlc3VsdFsnbWFuaWZlc3RWZXJzaW9uJ10gPSByZWZNYW5pZmVzdC5WZXJzaW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBTdGFyZGV3VmFsbGV5KGNvbnRleHQpKTtcclxuICAvLyBSZWdpc3RlciBvdXIgU01BUEkgbW9kIHR5cGUgYW5kIGluc3RhbGxlci4gTm90ZTogVGhpcyBjdXJyZW50bHkgZmxhZ3MgYW4gZXJyb3IgaW4gVm9ydGV4IG9uIGluc3RhbGxpbmcgY29ycmVjdGx5LlxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NtYXBpLWluc3RhbGxlcicsIDMwLCB0ZXN0U01BUEksIChmaWxlcywgZGVzdCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3QpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ1NNQVBJJywgMzAsIGdhbWVJZCA9PiBnYW1lSWQgPT09IEdBTUVfSUQsIGdldFNNQVBJUGF0aCwgaXNTTUFQSU1vZFR5cGUpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3N0YXJkZXctdmFsbGV5LWluc3RhbGxlcicsIDUwLCB0ZXN0U3VwcG9ydGVkLFxyXG4gICAgKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2R2cm9vdGZvbGRlcicsIDUwLCB0ZXN0Um9vdEZvbGRlciwgaW5zdGFsbFJvb3RGb2xkZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdzZHZyb290Zm9sZGVyJywgMjUsIChnYW1lSWQpID0+IChnYW1lSWQgPT09IEdBTUVfSUQpLFxyXG4gICAgKCkgPT4gZ2V0RGlzY292ZXJ5UGF0aCgpLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XHJcbiAgICAgIC8vIE9ubHkgaW50ZXJlc3RlZCBpbiBjb3B5IGluc3RydWN0aW9ucy5cclxuICAgICAgY29uc3QgY29weUluc3RydWN0aW9ucyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gaW5zdHIudHlwZSA9PT0gJ2NvcHknKTtcclxuICAgICAgLy8gVGhpcyBpcyBhIHRyaWNreSBwYXR0ZXJuIHNvIHdlJ3JlIGdvaW5nIHRvIDFzdCBwcmVzZW50IHRoZSBkaWZmZXJlbnQgcGFja2FnaW5nXHJcbiAgICAgIC8vICBwYXR0ZXJucyB3ZSBuZWVkIHRvIGNhdGVyIGZvcjpcclxuICAgICAgLy8gIDEuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlci4gRG9lcyBub3QgcmVxdWlyZSBTTUFQSSBzbyBub1xyXG4gICAgICAvLyAgICBtYW5pZmVzdCBmaWxlcyBhcmUgaW5jbHVkZWQuXHJcbiAgICAgIC8vICAyLiBSZXBsYWNlbWVudCBtb2Qgd2l0aCBcIkNvbnRlbnRcIiBmb2xkZXIgKyBvbmUgb3IgbW9yZSBTTUFQSSBtb2RzIGluY2x1ZGVkXHJcbiAgICAgIC8vICAgIGFsb25nc2lkZSB0aGUgQ29udGVudCBmb2xkZXIgaW5zaWRlIGEgXCJNb2RzXCIgZm9sZGVyLlxyXG4gICAgICAvLyAgMy4gQSByZWd1bGFyIFNNQVBJIG1vZCB3aXRoIGEgXCJDb250ZW50XCIgZm9sZGVyIGluc2lkZSB0aGUgbW9kJ3Mgcm9vdCBkaXIuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIHBhdHRlcm4gMTpcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGRvbid0IGhhdmUgbWFuaWZlc3QgZmlsZXNcclxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGhhdmUgYSBcIkNvbnRlbnRcIiBmb2xkZXJcclxuICAgICAgLy9cclxuICAgICAgLy8gVG8gc29sdmUgcGF0dGVybnMgMiBhbmQgMyB3ZSdyZSBnb2luZyB0bzpcclxuICAgICAgLy8gIENoZWNrIHdoZXRoZXIgd2UgaGF2ZSBhbnkgbWFuaWZlc3QgZmlsZXMsIGlmIHdlIGRvLCB3ZSBleHBlY3QgdGhlIGZvbGxvd2luZ1xyXG4gICAgICAvLyAgICBhcmNoaXZlIHN0cnVjdHVyZSBpbiBvcmRlciBmb3IgdGhlIG1vZFR5cGUgdG8gZnVuY3Rpb24gY29ycmVjdGx5OlxyXG4gICAgICAvLyAgICBhcmNoaXZlLnppcCA9PlxyXG4gICAgICAvLyAgICAgIC4uL0NvbnRlbnQvXHJcbiAgICAgIC8vICAgICAgLi4vTW9kcy9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL0FfU01BUElfTU9EXFxtYW5pZmVzdC5qc29uXHJcbiAgICAgIGNvbnN0IGhhc01hbmlmZXN0ID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uZW5kc1dpdGgoTUFOSUZFU1RfRklMRSkpXHJcbiAgICAgIGNvbnN0IGhhc01vZHNGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5zdGFydHNXaXRoKCdNb2RzJyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgaGFzQ29udGVudEZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ0NvbnRlbnQnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkXHJcblxyXG4gICAgICByZXR1cm4gKGhhc01hbmlmZXN0KVxyXG4gICAgICAgID8gQmx1ZWJpcmQucmVzb2x2ZShoYXNDb250ZW50Rm9sZGVyICYmIGhhc01vZHNGb2xkZXIpXHJcbiAgICAgICAgOiBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDk5OSwgJ2NoYW5nZWxvZycsIHt9LCAnU01BUEkgTG9nJyxcclxuICAgICgpID0+IHsgb25TaG93U01BUElMb2coY29udGV4dC5hcGkpOyB9LFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICAvL09ubHkgc2hvdyB0aGUgU01BUEkgbG9nIGJ1dHRvbiBmb3IgU0RWLiBcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcclxuICAgIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQXR0cmlidXRlRXh0cmFjdG9yKDI1LCBtYW5pZmVzdEV4dHJhY3Rvcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJUYWJsZUF0dHJpYnV0ZSgnbW9kcycsIHtcclxuICAgIGlkOiAnc2R2LWNvbXBhdGliaWxpdHknLFxyXG4gICAgcG9zaXRpb246IDEwMCxcclxuICAgIGNvbmRpdGlvbjogKCkgPT4gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSA9PT0gR0FNRV9JRCxcclxuICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcclxuICAgIGNhbGM6IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5U3RhdHVzLFxyXG4gICAgY3VzdG9tUmVuZGVyZXI6IChtb2Q6IHR5cGVzLklNb2QsIGRldGFpbENlbGw6IGJvb2xlYW4sIHQ6IHR5cGVzLlRGdW5jdGlvbikgPT4ge1xyXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb21wYXRpYmlsaXR5SWNvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0LCBtb2QsIGRldGFpbENlbGwgfSwgW10pO1xyXG4gICAgfSxcclxuICAgIG5hbWU6ICdDb21wYXRpYmlsaXR5JyxcclxuICAgIGlzRGVmYXVsdFZpc2libGU6IHRydWUsXHJcbiAgICBlZGl0OiB7fSxcclxuICB9KTtcclxuXHJcbiAgLypcclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LW1pc3NpbmctZGVwZW5kZW5jaWVzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiB0ZXN0TWlzc2luZ0RlcGVuZGVuY2llcyhjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKTtcclxuICAqL1xyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtaW5jb21wYXRpYmxlLW1vZHMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdFNNQVBJT3V0ZGF0ZWQoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSkpO1xyXG5cclxuICBpbnRlcmZhY2UgSUFkZGVkRmlsZSB7XHJcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xyXG4gICAgY2FuZGlkYXRlczogc3RyaW5nW107XHJcbiAgfVxyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29uc3QgcHJveHkgPSBuZXcgU01BUElQcm94eShjb250ZXh0LmFwaSk7XHJcbiAgICBjb250ZXh0LmFwaS5zZXRTdHlsZXNoZWV0KCdzZHYnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnc2R2c3R5bGUuc2NzcycpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5hZGRNZXRhU2VydmVyKCdzbWFwaS5pbycsIHtcclxuICAgICAgdXJsOiAnJyxcclxuICAgICAgbG9vcGJhY2tDQjogKHF1ZXJ5OiBJUXVlcnkpID0+IHtcclxuICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShwcm94eS5maW5kKHF1ZXJ5KSlcclxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBsb29rIHVwIHNtYXBpIG1ldGEgaW5mbycsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoW10pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGNhY2hlRHVyYXRpb25TZWM6IDg2NDAwLFxyXG4gICAgICBwcmlvcml0eTogMjUsXHJcbiAgICB9KTtcclxuICAgIGRlcGVuZGVuY3lNYW5hZ2VyID0gbmV3IERlcGVuZGVuY3lNYW5hZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgYXN5bmMgKHByb2ZpbGVJZCwgZmlsZXM6IElBZGRlZEZpbGVbXSkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICAvLyBkb24ndCBjYXJlIGFib3V0IGFueSBvdGhlciBnYW1lc1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgICAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuXHJcbiAgICAgIGF3YWl0IEJsdWViaXJkLm1hcChmaWxlcywgYXN5bmMgZW50cnkgPT4ge1xyXG4gICAgICAgIC8vIG9ubHkgYWN0IGlmIHdlIGRlZmluaXRpdmVseSBrbm93IHdoaWNoIG1vZCBvd25zIHRoZSBmaWxlXHJcbiAgICAgICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgaWYgKCFpc01vZENhbmRpZGF0ZVZhbGlkKG1vZCwgZW50cnkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IGZyb20gPSBtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ107XHJcbiAgICAgICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIEhvdyBpcyB0aGlzIGV2ZW4gcG9zc2libGU/IHJlZ2FyZGxlc3MgaXQncyBub3QgdGhpc1xyXG4gICAgICAgICAgICAvLyAgZnVuY3Rpb24ncyBqb2IgdG8gcmVwb3J0IHRoaXMuXHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlc29sdmUgbW9kIHBhdGggZm9yIG1vZCB0eXBlJywgbW9kLnR5cGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShmcm9tLCBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xyXG4gICAgICAgICAgLy8gY29weSB0aGUgbmV3IGZpbGUgYmFjayBpbnRvIHRoZSBjb3JyZXNwb25kaW5nIG1vZCwgdGhlbiBkZWxldGUgaXQuIFRoYXQgd2F5LCB2b3J0ZXggd2lsbFxyXG4gICAgICAgICAgLy8gY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0IGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSk7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBpZiAoIWVyci5tZXNzYWdlLmluY2x1ZGVzKCdhcmUgdGhlIHNhbWUgZmlsZScpKSB7XHJcbiAgICAgICAgICAgICAgLy8gc2hvdWxkIHdlIGJlIHJlcG9ydGluZyB0aGlzIHRvIHRoZSB1c2VyPyBUaGlzIGlzIGEgY29tcGxldGVseVxyXG4gICAgICAgICAgICAgIC8vIGF1dG9tYXRlZCBwcm9jZXNzIGFuZCBpZiBpdCBmYWlscyBtb3JlIG9mdGVuIHRoYW4gbm90IHRoZVxyXG4gICAgICAgICAgICAgIC8vIHVzZXIgcHJvYmFibHkgZG9lc24ndCBjYXJlXHJcbiAgICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmUtaW1wb3J0IGFkZGVkIGZpbGUgdG8gbW9kJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QoY29udGV4dC5hcGkpO1xyXG4gICAgICBjb25zdCBwcmltYXJ5VG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdpbnRlcmZhY2UnLCAncHJpbWFyeVRvb2wnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNtYXBpTW9kICYmIHByaW1hcnlUb29sID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsICdzbWFwaScpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSlcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QoY29udGV4dC5hcGkpO1xyXG4gICAgICBjb25zdCBwcmltYXJ5VG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdpbnRlcmZhY2UnLCAncHJpbWFyeVRvb2wnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNtYXBpTW9kICYmIHByaW1hcnlUb29sID09PSAnc21hcGknKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCB1bmRlZmluZWQpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdkaWQtaW5zdGFsbC1tb2QnLCAoZ2FtZUlkOiBzdHJpbmcsIGFyY2hpdmVJZDogc3RyaW5nLCBtb2RJZDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdXBkYXRlQ29uZmxpY3RJbmZvKGNvbnRleHQuYXBpLCBwcm94eSwgZ2FtZUlkLCBtb2RJZClcclxuICAgICAgICAudGhlbigoKSA9PiBsb2coJ2RlYnVnJywgJ2FkZGVkIGNvbXBhdGliaWxpdHkgaW5mbycsIHsgbW9kSWQgfSkpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBhZGQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBsb2coJ2RlYnVnJywgJ3VwZGF0aW5nIFNEViBjb21wYXRpYmlsaXR5IGluZm8nKTtcclxuICAgICAgUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoc3RhdGUucGVyc2lzdGVudC5tb2RzW2dhbWVNb2RlXSA/PyB7fSkubWFwKG1vZElkID0+XHJcbiAgICAgICAgdXBkYXRlQ29uZmxpY3RJbmZvKGNvbnRleHQuYXBpLCBwcm94eSwgZ2FtZU1vZGUsIG1vZElkKSkpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdkb25lIHVwZGF0aW5nIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byB1cGRhdGUgY29uZmxpY3QgaW5mbycsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbml0O1xyXG4iXX0=