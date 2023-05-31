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
const actions_1 = require("./actions");
const CompatibilityIcon_1 = __importDefault(require("./CompatibilityIcon"));
const constants_1 = require("./constants");
const DependencyManager_1 = __importDefault(require("./DependencyManager"));
const reducers_1 = __importDefault(require("./reducers"));
const Settings_1 = __importDefault(require("./Settings"));
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
            if (state.settings['SDV'].useRecommendations === undefined) {
                this.context.api.showDialog('question', 'Show Recommendations?', {
                    text: 'Vortex can optionally use data from SMAPI\'s database and '
                        + 'the manifest files included with mods to recommend additional '
                        + 'compatible mods that work with those that you have installed. '
                        + 'In some cases, this information could be wrong or incomplete '
                        + 'which may lead to unreliable prompts showing in the app.\n'
                        + 'All recommendations shown should be carefully considered '
                        + 'before accepting them - if you are unsure please check the '
                        + 'mod page to see if the author has provided any further instructions. '
                        + 'Would you like to enable this feature? You can update your choice '
                        + 'from the Settings menu at any time.'
                }, [
                    { label: 'Continue without recommendations', action: () => {
                            this.context.api.store.dispatch((0, actions_1.setRecommendations)(false));
                        } },
                    { label: 'Enable recommendations', action: () => {
                            this.context.api.store.dispatch((0, actions_1.setRecommendations)(true));
                        } },
                ]);
            }
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
            var _a, _b, _c;
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
            if ((_c = (_b = api.getState().settings['SDV']) === null || _b === void 0 ? void 0 : _b.useRecommendations) !== null && _c !== void 0 ? _c : false) {
                for (const dep of dependencies) {
                    addRuleForDependency(dep);
                }
                if (mod.manifest.ContentPackFor !== undefined) {
                    addRuleForDependency(mod.manifest.ContentPackFor);
                }
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
    context.registerReducer(['settings', 'SDV'], reducers_1.default);
    context.registerSettings('Mods', Settings_1.default, undefined, () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID, 150);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBRWhDLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx3REFBMEM7QUFDMUMsdUNBQStDO0FBQy9DLDRFQUFvRDtBQUNwRCwyQ0FBb0Q7QUFFcEQsNEVBQW9EO0FBQ3BELDBEQUFxQztBQUNyQywwREFBa0M7QUFDbEMsOERBQXNDO0FBQ3RDLG1DQUE0QztBQUM1QyxtQ0FBbUg7QUFDbkgsaUNBQXVDO0FBRXZDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDMUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ25DLEtBQUssR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQy9CLEVBQUUsUUFBUSxFQUFFLEdBQUcsaUJBQUksRUFDbkIsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFDakUsRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFcEMsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDckQsTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUUxRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzlF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Q0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxRQUFnQixFQUFFLEVBQUU7O1lBQy9ELElBQUksUUFBUSxLQUFLLE9BQU8sRUFBRTtnQkFDeEIsT0FBTzthQUNSO1lBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7WUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLG1DQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUN6RSxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDeEQsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDWCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdXRpbCwgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcbmltcG9ydCB7IHNldFJlY29tbWVuZGF0aW9ucyB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCBDb21wYXRpYmlsaXR5SWNvbiBmcm9tICcuL0NvbXBhdGliaWxpdHlJY29uJztcclxuaW1wb3J0IHsgU01BUElfUVVFUllfRlJFUVVFTkNZIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuaW1wb3J0IERlcGVuZGVuY3lNYW5hZ2VyIGZyb20gJy4vRGVwZW5kZW5jeU1hbmFnZXInO1xyXG5pbXBvcnQgc2R2UmVkdWNlcnMgZnJvbSAnLi9yZWR1Y2Vycyc7XHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IFNNQVBJUHJveHkgZnJvbSAnLi9zbWFwaVByb3h5JztcclxuaW1wb3J0IHsgdGVzdFNNQVBJT3V0ZGF0ZWQgfSBmcm9tICcuL3Rlc3RzJztcclxuaW1wb3J0IHsgY29tcGF0aWJpbGl0eU9wdGlvbnMsIENvbXBhdGliaWxpdHlTdGF0dXMsIElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QsIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBwYXJzZU1hbmlmZXN0IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyksXHJcbiAgeyBjbGlwYm9hcmQgfSA9IHJlcXVpcmUoJ2VsZWN0cm9uJyksXHJcbiAgcmpzb24gPSByZXF1aXJlKCdyZWxheGVkLWpzb24nKSxcclxuICB7IFNldmVuWmlwIH0gPSB1dGlsLFxyXG4gIHsgZGVwbG95U01BUEksIGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9ID0gcmVxdWlyZSgnLi9TTUFQSScpLFxyXG4gIHsgR0FNRV9JRCB9ID0gcmVxdWlyZSgnLi9jb21tb24nKTtcclxuXHJcbmNvbnN0IE1BTklGRVNUX0ZJTEUgPSAnbWFuaWZlc3QuanNvbic7XHJcbmNvbnN0IFBUUk5fQ09OVEVOVCA9IHBhdGguc2VwICsgJ0NvbnRlbnQnICsgcGF0aC5zZXA7XHJcbmNvbnN0IFNNQVBJX0VYRSA9ICdTdGFyZGV3TW9kZGluZ0FQSS5leGUnO1xyXG5jb25zdCBTTUFQSV9ETEwgPSAnU01BUEkuSW5zdGFsbGVyLmRsbCc7XHJcbmNvbnN0IFNNQVBJX0RBVEEgPSBbJ3dpbmRvd3MtaW5zdGFsbC5kYXQnLCAnaW5zdGFsbC5kYXQnXTtcclxuXHJcbmNvbnN0IF9TTUFQSV9CVU5ETEVEX01PRFMgPSBbJ0Vycm9ySGFuZGxlcicsICdDb25zb2xlQ29tbWFuZHMnLCAnU2F2ZUJhY2t1cCddO1xyXG5jb25zdCBnZXRCdW5kbGVkTW9kcyA9ICgpID0+IHtcclxuICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KF9TTUFQSV9CVU5ETEVEX01PRFMubWFwKG1vZE5hbWUgPT4gbW9kTmFtZS50b0xvd2VyQ2FzZSgpKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuY2xhc3MgU3RhcmRld1ZhbGxleSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcclxuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XHJcbiAgcHVibGljIGlkOiBzdHJpbmcgPSBHQU1FX0lEO1xyXG4gIHB1YmxpYyBuYW1lOiBzdHJpbmcgPSAnU3RhcmRldyBWYWxsZXknO1xyXG4gIHB1YmxpYyBsb2dvOiBzdHJpbmcgPSAnZ2FtZWFydC5qcGcnO1xyXG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgZW52aXJvbm1lbnQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XHJcbiAgICBTdGVhbUFQUElkOiAnNDEzMTUwJyxcclxuICB9O1xyXG4gIHB1YmxpYyBkZXRhaWxzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xyXG4gICAgc3RlYW1BcHBJZDogNDEzMTUwXHJcbiAgfTtcclxuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogJ3NtYXBpJyxcclxuICAgICAgbmFtZTogJ1NNQVBJJyxcclxuICAgICAgbG9nbzogJ3NtYXBpLnBuZycsXHJcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+IFNNQVBJX0VYRSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW1NNQVBJX0VYRV0sXHJcbiAgICAgIHNoZWxsOiB0cnVlLFxyXG4gICAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICBkZWZhdWx0UHJpbWFyeTogdHJ1ZSxcclxuICAgIH1cclxuICBdO1xyXG4gIHB1YmxpYyBtZXJnZU1vZHM6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyByZXF1aXJlc0NsZWFudXA6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHB1YmxpYyBzaGVsbDogYm9vbGVhbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XHJcbiAgcHVibGljIGRlZmF1bHRQYXRoczogc3RyaW5nW107XHJcblxyXG4gIC8qKioqKioqKipcclxuICAqKiBWb3J0ZXggQVBJXHJcbiAgKioqKioqKioqL1xyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdCBhbiBpbnN0YW5jZS5cclxuICAgKiBAcGFyYW0ge0lFeHRlbnNpb25Db250ZXh0fSBjb250ZXh0IC0tIFRoZSBWb3J0ZXggZXh0ZW5zaW9uIGNvbnRleHQuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICAgIC8vIHByb3BlcnRpZXMgdXNlZCBieSBWb3J0ZXhcclxuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICB0aGlzLnJlcXVpcmVkRmlsZXMgPSBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyBbJ1N0YXJkZXcgVmFsbGV5LmV4ZSddXHJcbiAgICAgIDogWydTdGFyZGV3VmFsbGV5JywgJ1N0YXJkZXdWYWxsZXkuZXhlJ107XHJcblxyXG4gICAgLy8gY3VzdG9tIHByb3BlcnRpZXNcclxuICAgIHRoaXMuZGVmYXVsdFBhdGhzID0gW1xyXG4gICAgICAvLyBMaW51eFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9HT0cgR2FtZXMvU3RhcmRldyBWYWxsZXkvZ2FtZScsXHJcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnLy5sb2NhbC9zaGFyZS9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5JyxcclxuXHJcbiAgICAgIC8vIE1hY1xyXG4gICAgICAnL0FwcGxpY2F0aW9ucy9TdGFyZGV3IFZhbGxleS5hcHAvQ29udGVudHMvTWFjT1MnLFxyXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnQvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleS9Db250ZW50cy9NYWNPUycsXHJcblxyXG4gICAgICAvLyBXaW5kb3dzXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdhbGF4eUNsaWVudFxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXHJcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdPRyBHYWxheHlcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxyXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxTdGVhbVxcXFxzdGVhbWFwcHNcXFxcY29tbW9uXFxcXFN0YXJkZXcgVmFsbGV5J1xyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGZpbmQgdGhlIGdhbWUgaW5zdGFsbCBwYXRoLlxyXG4gICAqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHF1aWNrbHkgYW5kLCBpZiBpdCByZXR1cm5zIGEgdmFsdWUsIGl0IHNob3VsZCBkZWZpbml0aXZlbHkgYmUgdGhlXHJcbiAgICogdmFsaWQgZ2FtZSBwYXRoLiBVc3VhbGx5IHRoaXMgZnVuY3Rpb24gd2lsbCBxdWVyeSB0aGUgcGF0aCBmcm9tIHRoZSByZWdpc3RyeSBvciBmcm9tIHN0ZWFtLlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gbWF5IHJldHVybiBhIHByb21pc2UgYW5kIGl0IHNob3VsZCBkbyB0aGF0IGlmIGl0J3MgZG9pbmcgSS9PLlxyXG4gICAqXHJcbiAgICogVGhpcyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgYnV0IHRoZW4gdGhlIHRvb2wvZ2FtZSBjYW4gb25seSBiZSBkaXNjb3ZlcmVkIGJ5IHNlYXJjaGluZyB0aGUgZGlza1xyXG4gICAqIHdoaWNoIGlzIHNsb3cgYW5kIG9ubHkgaGFwcGVucyBtYW51YWxseS5cclxuICAgKi9cclxuICBwdWJsaWMgcXVlcnlQYXRoID0gdG9CbHVlKGFzeW5jICgpID0+IHtcclxuICAgIC8vIGNoZWNrIFN0ZWFtXHJcbiAgICBjb25zdCBnYW1lID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoWyc0MTMxNTAnLCAnMTQ1MzM3NTI1MyddKTtcclxuICAgIGlmIChnYW1lKVxyXG4gICAgICByZXR1cm4gZ2FtZS5nYW1lUGF0aDtcclxuXHJcbiAgICAvLyBjaGVjayBkZWZhdWx0IHBhdGhzXHJcbiAgICBmb3IgKGNvbnN0IGRlZmF1bHRQYXRoIG9mIHRoaXMuZGVmYXVsdFBhdGhzKVxyXG4gICAge1xyXG4gICAgICBpZiAoYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoZGVmYXVsdFBhdGgpKVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0UGF0aDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBwYXRoIG9mIHRoZSB0b29sIGV4ZWN1dGFibGUgcmVsYXRpdmUgdG8gdGhlIHRvb2wgYmFzZSBwYXRoLCBpLmUuIGJpbmFyaWVzL1VUMy5leGUgb3JcclxuICAgKiBURVNWLmV4ZS4gVGhpcyBpcyBhIGZ1bmN0aW9uIHNvIHRoYXQgeW91IGNhbiByZXR1cm4gZGlmZmVyZW50IHRoaW5ncyBiYXNlZCBvbiB0aGUgb3BlcmF0aW5nXHJcbiAgICogc3lzdGVtIGZvciBleGFtcGxlIGJ1dCBiZSBhd2FyZSB0aGF0IGl0IHdpbGwgYmUgZXZhbHVhdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0IGFuZCBvbmx5IG9uY2UsXHJcbiAgICogc28gdGhlIHJldHVybiB2YWx1ZSBjYW4gbm90IGRlcGVuZCBvbiB0aGluZ3MgdGhhdCBjaGFuZ2UgYXQgcnVudGltZS5cclxuICAgKi9cclxuICBwdWJsaWMgZXhlY3V0YWJsZSgpIHtcclxuICAgIHJldHVybiBwcm9jZXNzLnBsYXRmb3JtID09ICd3aW4zMidcclxuICAgICAgPyAnU3RhcmRldyBWYWxsZXkuZXhlJ1xyXG4gICAgICA6ICdTdGFyZGV3VmFsbGV5JztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgZGVmYXVsdCBkaXJlY3Rvcnkgd2hlcmUgbW9kcyBmb3IgdGhpcyBnYW1lIHNob3VsZCBiZSBzdG9yZWQuXHJcbiAgICogXHJcbiAgICogSWYgdGhpcyByZXR1cm5zIGEgcmVsYXRpdmUgcGF0aCB0aGVuIHRoZSBwYXRoIGlzIHRyZWF0ZWQgYXMgcmVsYXRpdmUgdG8gdGhlIGdhbWUgaW5zdGFsbGF0aW9uXHJcbiAgICogZGlyZWN0b3J5LiBTaW1wbHkgcmV0dXJuIGEgZG90ICggKCkgPT4gJy4nICkgaWYgbW9kcyBhcmUgaW5zdGFsbGVkIGRpcmVjdGx5IGludG8gdGhlIGdhbWVcclxuICAgKiBkaXJlY3RvcnkuXHJcbiAgICovIFxyXG4gIHB1YmxpYyBxdWVyeU1vZFBhdGgoKVxyXG4gIHtcclxuICAgIHJldHVybiAnTW9kcyc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcHRpb25hbCBzZXR1cCBmdW5jdGlvbi4gSWYgdGhpcyBnYW1lIHJlcXVpcmVzIHNvbWUgZm9ybSBvZiBzZXR1cCBiZWZvcmUgaXQgY2FuIGJlIG1vZGRlZCAobGlrZVxyXG4gICAqIGNyZWF0aW5nIGEgZGlyZWN0b3J5LCBjaGFuZ2luZyBhIHJlZ2lzdHJ5IGtleSwgLi4uKSBkbyBpdCBoZXJlLiBJdCB3aWxsIGJlIGNhbGxlZCBldmVyeSB0aW1lXHJcbiAgICogYmVmb3JlIHRoZSBnYW1lIG1vZGUgaXMgYWN0aXZhdGVkLlxyXG4gICAqIEBwYXJhbSB7SURpc2NvdmVyeVJlc3VsdH0gZGlzY292ZXJ5IC0tIGJhc2ljIGluZm8gYWJvdXQgdGhlIGdhbWUgYmVpbmcgbG9hZGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXR1cCA9IHRvQmx1ZShhc3luYyAoZGlzY292ZXJ5KSA9PiB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGZvbGRlciBmb3IgU01BUEkgbW9kcyBleGlzdHMuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICAvLyBza2lwIGlmIFNNQVBJIGZvdW5kXHJcbiAgICBjb25zdCBzbWFwaVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIFNNQVBJX0VYRSk7XHJcbiAgICBjb25zdCBzbWFwaUZvdW5kID0gYXdhaXQgdGhpcy5nZXRQYXRoRXhpc3RzQXN5bmMoc21hcGlQYXRoKTtcclxuICAgIGlmICghc21hcGlGb3VuZCkge1xyXG4gICAgICB0aGlzLnJlY29tbWVuZFNtYXBpKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5jb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgaWYgKHN0YXRlLnNldHRpbmdzWydTRFYnXS51c2VSZWNvbW1lbmRhdGlvbnMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLmNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1Nob3cgUmVjb21tZW5kYXRpb25zPycsIHtcclxuICAgICAgICB0ZXh0OiAnVm9ydGV4IGNhbiBvcHRpb25hbGx5IHVzZSBkYXRhIGZyb20gU01BUElcXCdzIGRhdGFiYXNlIGFuZCAnXHJcbiAgICAgICAgICAgICsgJ3RoZSBtYW5pZmVzdCBmaWxlcyBpbmNsdWRlZCB3aXRoIG1vZHMgdG8gcmVjb21tZW5kIGFkZGl0aW9uYWwgJ1xyXG4gICAgICAgICAgICArICdjb21wYXRpYmxlIG1vZHMgdGhhdCB3b3JrIHdpdGggdGhvc2UgdGhhdCB5b3UgaGF2ZSBpbnN0YWxsZWQuICdcclxuICAgICAgICAgICAgKyAnSW4gc29tZSBjYXNlcywgdGhpcyBpbmZvcm1hdGlvbiBjb3VsZCBiZSB3cm9uZyBvciBpbmNvbXBsZXRlICdcclxuICAgICAgICAgICAgKyAnd2hpY2ggbWF5IGxlYWQgdG8gdW5yZWxpYWJsZSBwcm9tcHRzIHNob3dpbmcgaW4gdGhlIGFwcC5cXG4nXHJcbiAgICAgICAgICAgICsgJ0FsbCByZWNvbW1lbmRhdGlvbnMgc2hvd24gc2hvdWxkIGJlIGNhcmVmdWxseSBjb25zaWRlcmVkICdcclxuICAgICAgICAgICAgKyAnYmVmb3JlIGFjY2VwdGluZyB0aGVtIC0gaWYgeW91IGFyZSB1bnN1cmUgcGxlYXNlIGNoZWNrIHRoZSAnXHJcbiAgICAgICAgICAgICsgJ21vZCBwYWdlIHRvIHNlZSBpZiB0aGUgYXV0aG9yIGhhcyBwcm92aWRlZCBhbnkgZnVydGhlciBpbnN0cnVjdGlvbnMuICdcclxuICAgICAgICAgICAgKyAnV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIHRoaXMgZmVhdHVyZT8gWW91IGNhbiB1cGRhdGUgeW91ciBjaG9pY2UgJ1xyXG4gICAgICAgICAgICArICdmcm9tIHRoZSBTZXR0aW5ncyBtZW51IGF0IGFueSB0aW1lLidcclxuICAgICAgfSwgW1xyXG4gICAgICAgIHsgbGFiZWw6ICdDb250aW51ZSB3aXRob3V0IHJlY29tbWVuZGF0aW9ucycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRSZWNvbW1lbmRhdGlvbnMoZmFsc2UpKTtcclxuICAgICAgICB9IH0sXHJcbiAgICAgICAgeyBsYWJlbDogJ0VuYWJsZSByZWNvbW1lbmRhdGlvbnMnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UmVjb21tZW5kYXRpb25zKHRydWUpKTtcclxuICAgICAgICB9IH0sXHJcbiAgICAgIF0pXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHByaXZhdGUgcmVjb21tZW5kU21hcGkoKSB7XHJcbiAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZCh0aGlzLmNvbnRleHQuYXBpKTtcclxuICAgIGNvbnN0IHRpdGxlID0gc21hcGlNb2QgPyAnU01BUEkgaXMgbm90IGRlcGxveWVkJyA6ICdTTUFQSSBpcyBub3QgaW5zdGFsbGVkJztcclxuICAgIGNvbnN0IGFjdGlvblRpdGxlID0gc21hcGlNb2QgPyAnRGVwbG95JyA6ICdHZXQgU01BUEknO1xyXG4gICAgY29uc3QgYWN0aW9uID0gKCkgPT4gKHNtYXBpTW9kXHJcbiAgICAgID8gZGVwbG95U01BUEkodGhpcy5jb250ZXh0LmFwaSlcclxuICAgICAgOiBkb3dubG9hZFNNQVBJKHRoaXMuY29udGV4dC5hcGkpKVxyXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmNvbnRleHQuYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLW1pc3NpbmcnKSk7XHJcblxyXG4gICAgdGhpcy5jb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6ICdzbWFwaS1taXNzaW5nJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZSxcclxuICAgICAgbWVzc2FnZTogJ1NNQVBJIGlzIHJlcXVpcmVkIHRvIG1vZCBTdGFyZGV3IFZhbGxleS4nLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6IGFjdGlvblRpdGxlLFxyXG4gICAgICAgICAgYWN0aW9uLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqKioqKioqKlxyXG4gICoqIEludGVybmFsIG1ldGhvZHNcclxuICAqKioqKioqKiovXHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IGNoZWNrIHdoZXRoZXIgYSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoIGV4aXN0cy5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFRoZSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoLlxyXG4gICAqL1xyXG4gIGFzeW5jIGdldFBhdGhFeGlzdHNBc3luYyhwYXRoKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGgpO1xyXG4gICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZXJyKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzeW5jaHJvbm91c2x5IHJlYWQgYSByZWdpc3RyeSBrZXkgdmFsdWUuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhpdmUgLSBUaGUgcmVnaXN0cnkgaGl2ZSB0byBhY2Nlc3MuIFRoaXMgc2hvdWxkIGJlIGEgY29uc3RhbnQgbGlrZSBSZWdpc3RyeS5IS0xNLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgcmVnaXN0cnkga2V5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRvIHJlYWQuXHJcbiAgICovXHJcbiAgYXN5bmMgcmVhZFJlZ2lzdHJ5S2V5QXN5bmMoaGl2ZSwga2V5LCBuYW1lKVxyXG4gIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKGhpdmUsIGtleSwgbmFtZSk7XHJcbiAgICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdFBhdGgudmFsdWUpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSb290Rm9sZGVyKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBXZSBhc3N1bWUgdGhhdCBhbnkgbW9kIGNvbnRhaW5pbmcgXCIvQ29udGVudC9cIiBpbiBpdHMgZGlyZWN0b3J5XHJcbiAgLy8gIHN0cnVjdHVyZSBpcyBtZWFudCB0byBiZSBkZXBsb3llZCB0byB0aGUgcm9vdCBmb2xkZXIuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSlcclxuICAgIC5tYXAoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKSk7XHJcbiAgY29uc3QgY29udGVudERpciA9IGZpbHRlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGNvbnRlbnREaXIgIT09IHVuZGVmaW5lZCkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSb290Rm9sZGVyKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBXZSdyZSBnb2luZyB0byBkZXBsb3kgXCIvQ29udGVudC9cIiBhbmQgd2hhdGV2ZXIgZm9sZGVycyBjb21lIGFsb25nc2lkZSBpdC5cclxuICAvLyAgaS5lLiBTb21lTW9kLjd6XHJcbiAgLy8gIFdpbGwgYmUgZGVwbG95ZWQgICAgID0+IC4uL1NvbWVNb2QvQ29udGVudC9cclxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Nb2RzL1xyXG4gIC8vICBXaWxsIE5PVCBiZSBkZXBsb3llZCA9PiAuLi9SZWFkbWUuZG9jXHJcbiAgY29uc3QgY29udGVudEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSkuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgY29uc3QgaWR4ID0gY29udGVudEZpbGUuaW5kZXhPZihQVFJOX0NPTlRFTlQpICsgMTtcclxuICBjb25zdCByb290RGlyID0gcGF0aC5iYXNlbmFtZShjb250ZW50RmlsZS5zdWJzdHJpbmcoMCwgaWR4KSk7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcClcclxuICAgICYmIChmaWxlLmluZGV4T2Yocm9vdERpcikgIT09IC0xKVxyXG4gICAgJiYgKHBhdGguZXh0bmFtZShmaWxlKSAhPT0gJy50eHQnKSk7XHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnN1YnN0cihpZHgpLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVmFsaWRNYW5pZmVzdChmaWxlUGF0aCkge1xyXG4gIGNvbnN0IHNlZ21lbnRzID0gZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgY29uc3QgaXNNYW5pZmVzdEZpbGUgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gTUFOSUZFU1RfRklMRTtcclxuICBjb25zdCBpc0xvY2FsZSA9IHNlZ21lbnRzLmluY2x1ZGVzKCdsb2NhbGUnKTtcclxuICByZXR1cm4gaXNNYW5pZmVzdEZpbGUgJiYgIWlzTG9jYWxlO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoaXNWYWxpZE1hbmlmZXN0KSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIHByZWZpeCBmYWtlIGRpcmVjdG9yeSBqdXN0IGluIGNhc2UgdGhlIGNvbnRlbnRcclxuICAgICAgLy8gIGZvbGRlciBpcyBpbiB0aGUgYXJjaGl2ZSdzIHJvb3QgZm9sZGVyLiBUaGlzIGlzIHRvIGVuc3VyZSB3ZVxyXG4gICAgICAvLyAgZmluZCBhIG1hdGNoIGZvciBcIi9Db250ZW50L1wiXHJcbiAgICAgIGNvbnN0IHRlc3RGaWxlID0gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSk7XHJcbiAgICAgIHJldHVybiAodGVzdEZpbGUuZW5kc1dpdGgoUFRSTl9DT05URU5UKSk7XHJcbiAgICB9KSA9PT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoYXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lNYW5hZ2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFRoZSBhcmNoaXZlIG1heSBjb250YWluIG11bHRpcGxlIG1hbmlmZXN0IGZpbGVzIHdoaWNoIHdvdWxkXHJcbiAgLy8gIGltcGx5IHRoYXQgd2UncmUgaW5zdGFsbGluZyBtdWx0aXBsZSBtb2RzLlxyXG4gIGNvbnN0IG1hbmlmZXN0RmlsZXMgPSBmaWxlcy5maWx0ZXIoaXNWYWxpZE1hbmlmZXN0KTtcclxuXHJcbiAgaW50ZXJmYWNlIElNb2RJbmZvIHtcclxuICAgIG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3Q7XHJcbiAgICByb290Rm9sZGVyOiBzdHJpbmc7XHJcbiAgICBtYW5pZmVzdEluZGV4OiBudW1iZXI7XHJcbiAgICBtb2RGaWxlczogc3RyaW5nW107XHJcbiAgfVxyXG5cclxuICBsZXQgcGFyc2VFcnJvcjogRXJyb3I7XHJcblxyXG4gIGF3YWl0IGRlcGVuZGVuY3lNYW5hZ2VyLnNjYW5NYW5pZmVzdHModHJ1ZSk7XHJcbiAgbGV0IG1vZHM6IElNb2RJbmZvW10gPSBhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdEZpbGVzLm1hcChhc3luYyBtYW5pZmVzdEZpbGUgPT4ge1xyXG4gICAgY29uc3Qgcm9vdEZvbGRlciA9IHBhdGguZGlybmFtZShtYW5pZmVzdEZpbGUpO1xyXG4gICAgY29uc3QgbWFuaWZlc3RJbmRleCA9IG1hbmlmZXN0RmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoTUFOSUZFU1RfRklMRSk7XHJcbiAgICBjb25zdCBmaWx0ZXJGdW5jID0gKGZpbGUpID0+IChyb290Rm9sZGVyICE9PSAnLicpXHJcbiAgICAgID8gKChmaWxlLmluZGV4T2Yocm9vdEZvbGRlcikgIT09IC0xKVxyXG4gICAgICAgICYmIChwYXRoLmRpcm5hbWUoZmlsZSkgIT09ICcuJylcclxuICAgICAgICAmJiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkpXHJcbiAgICAgIDogIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdCA9XHJcbiAgICAgICAgYXdhaXQgcGFyc2VNYW5pZmVzdChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtYW5pZmVzdEZpbGUpKTtcclxuICAgICAgY29uc3QgbW9kRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsdGVyRnVuYyk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbWFuaWZlc3QsXHJcbiAgICAgICAgcm9vdEZvbGRlcixcclxuICAgICAgICBtYW5pZmVzdEluZGV4LFxyXG4gICAgICAgIG1vZEZpbGVzLFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIGp1c3QgYSB3YXJuaW5nIGF0IHRoaXMgcG9pbnQgYXMgdGhpcyBtYXkgbm90IGJlIHRoZSBtYWluIG1hbmlmZXN0IGZvciB0aGUgbW9kXHJcbiAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IG1hbmlmZXN0RmlsZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICBwYXJzZUVycm9yID0gZXJyO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH0pKTtcclxuXHJcbiAgbW9kcyA9IG1vZHMuZmlsdGVyKHggPT4geCAhPT0gdW5kZWZpbmVkKTtcclxuICBcclxuICBpZiAobW9kcy5sZW5ndGggPT09IDApIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdUaGUgbW9kIG1hbmlmZXN0IGlzIGludmFsaWQgYW5kIGNhblxcJ3QgYmUgcmVhZC4gWW91IGNhbiB0cnkgdG8gaW5zdGFsbCB0aGUgbW9kIGFueXdheSB2aWEgcmlnaHQtY2xpY2sgLT4gXCJVbnBhY2sgKGFzLWlzKVwiJyxcclxuICAgICAgcGFyc2VFcnJvciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5tYXAobW9kcywgbW9kID0+IHtcclxuICAgIC8vIFRPRE86IHdlIG1pZ2h0IGdldCBoZXJlIHdpdGggYSBtb2QgdGhhdCBoYXMgYSBtYW5pZmVzdC5qc29uIGZpbGUgYnV0IHdhc24ndCBpbnRlbmRlZCBmb3IgU3RhcmRldyBWYWxsZXksIGFsbFxyXG4gICAgLy8gIHRodW5kZXJzdG9yZSBtb2RzIHdpbGwgY29udGFpbiBhIG1hbmlmZXN0Lmpzb24gZmlsZVxyXG4gICAgY29uc3QgbW9kTmFtZSA9IChtb2Qucm9vdEZvbGRlciAhPT0gJy4nKVxyXG4gICAgICA/IG1vZC5yb290Rm9sZGVyXHJcbiAgICAgIDogbW9kLm1hbmlmZXN0Lk5hbWUgPz8gbW9kLnJvb3RGb2xkZXI7XHJcblxyXG4gICAgaWYgKG1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbW9kLm1hbmlmZXN0LkRlcGVuZGVuY2llcyB8fCBbXTtcclxuXHJcbiAgICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIG1vZC5tb2RGaWxlcykge1xyXG4gICAgICBjb25zdCBkZXN0aW5hdGlvbiA9IHBhdGguam9pbihtb2ROYW1lLCBmaWxlLnN1YnN0cihtb2QubWFuaWZlc3RJbmRleCkpO1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZGVzdGluYXRpb24sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFkZFJ1bGVGb3JEZXBlbmRlbmN5ID0gKGRlcDogSVNEVkRlcGVuZGVuY3kpID0+IHtcclxuICAgICAgaWYgKChkZXAuVW5pcXVlSUQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgIHx8IChkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSA9PT0gJ3lvdXJuYW1lLnlvdXJvdGhlcnNwYWNrc2FuZG1vZHMnKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGVwLk1pbmltdW1WZXJzaW9uICE9PSB1bmRlZmluZWRcclxuICAgICAgICA/IGA+PSR7ZGVwLk1pbmltdW1WZXJzaW9ufWBcclxuICAgICAgICA6ICcqJztcclxuICAgICAgY29uc3QgcnVsZTogdHlwZXMuSU1vZFJ1bGUgPSB7XHJcbiAgICAgICAgLy8gdHJlYXRpbmcgYWxsIGRlcGVuZGVuY2llcyBhcyByZWNvbW1lbmRhdGlvbnMgYmVjYXVzZSB0aGUgZGVwZW5kZW5jeSBpbmZvcm1hdGlvblxyXG4gICAgICAgIC8vIHByb3ZpZGVkIGJ5IHNvbWUgbW9kIGF1dGhvcnMgaXMgYSBiaXQgaGl0LWFuZC1taXNzIGFuZCBWb3J0ZXggZmFpcmx5IGFnZ3Jlc3NpdmVseVxyXG4gICAgICAgIC8vIGVuZm9yY2VzIHJlcXVpcmVtZW50c1xyXG4gICAgICAgIC8vIHR5cGU6IChkZXAuSXNSZXF1aXJlZCA/PyB0cnVlKSA/ICdyZXF1aXJlcycgOiAncmVjb21tZW5kcycsXHJcbiAgICAgICAgdHlwZTogJ3JlY29tbWVuZHMnLFxyXG4gICAgICAgIHJlZmVyZW5jZToge1xyXG4gICAgICAgICAgbG9naWNhbEZpbGVOYW1lOiBkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgIHZlcnNpb25NYXRjaCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGV4dHJhOiB7XHJcbiAgICAgICAgICBvbmx5SWZGdWxmaWxsYWJsZTogdHJ1ZSxcclxuICAgICAgICAgIGF1dG9tYXRpYzogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9O1xyXG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ3J1bGUnLFxyXG4gICAgICAgIHJ1bGUsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhcGkuZ2V0U3RhdGUoKS5zZXR0aW5nc1snU0RWJ10/LnVzZVJlY29tbWVuZGF0aW9ucyA/PyBmYWxzZSkge1xyXG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShkZXApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0Zvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpbnN0cnVjdGlvbnM7XHJcbiAgfSlcclxuICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBbXS5jb25jYXQoZGF0YSkucmVkdWNlKChhY2N1bSwgaXRlcikgPT4gYWNjdW0uY29uY2F0KGl0ZXIpLCBbXSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNTTUFQSU1vZFR5cGUoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuXHJcbiAgY29uc3Qgc21hcGlEYXRhID0gaW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdCA9PiAoaW5zdC50eXBlID09PSAnY29weScpICYmIGluc3Quc291cmNlLmVuZHNXaXRoKFNNQVBJX0VYRSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShzbWFwaURhdGEgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTTUFQSShmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBkb3dubG9hZCBjb250YWlucyB0aGUgU01BUEkgZGF0YSBhcmNoaXZlLnNcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBTTUFQSV9ETEwpICE9PSB1bmRlZmluZWQpXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgICBzdXBwb3J0ZWQsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IGZvbGRlciA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMidcclxuICAgID8gJ3dpbmRvd3MnXHJcbiAgICA6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCdcclxuICAgICAgPyAnbGludXgnXHJcbiAgICAgIDogJ21hY29zJztcclxuICBjb25zdCBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtID0gKGZpbGUpID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICByZXR1cm4gKHNlZ21lbnRzLmluY2x1ZGVzKGZvbGRlcikpO1xyXG4gIH1cclxuICAvLyBGaW5kIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmVcclxuICBjb25zdCBkYXRhRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBpc0NvcnJlY3RQbGF0Zm9ybSA9IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0oZmlsZSk7XHJcbiAgICByZXR1cm4gaXNDb3JyZWN0UGxhdGZvcm0gJiYgU01BUElfREFUQS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpXHJcbiAgfSk7XHJcbiAgaWYgKGRhdGFGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIGZpbmQgdGhlIFNNQVBJIGRhdGEgZmlsZXMgLSBkb3dubG9hZCBhcHBlYXJzICdcclxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcclxuICB9XHJcbiAgbGV0IGRhdGEgPSAnJztcclxuICB0cnkge1xyXG4gICAgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgJ1N0YXJkZXcgVmFsbGV5LmRlcHMuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBTRFYgZGVwZW5kZW5jaWVzJywgZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIGZpbGUgd2lsbCBiZSBvdXRkYXRlZCBhZnRlciB0aGUgd2FsayBvcGVyYXRpb24gc28gcHJlcGFyZSBhIHJlcGxhY2VtZW50LiBcclxuICBjb25zdCB1cGRhdGVkRmlsZXMgPSBbXTtcclxuXHJcbiAgY29uc3Qgc3ppcCA9IG5ldyBTZXZlblppcCgpO1xyXG4gIC8vIFVuemlwIHRoZSBmaWxlcyBmcm9tIHRoZSBkYXRhIGFyY2hpdmUuIFRoaXMgZG9lc24ndCBzZWVtIHRvIGJlaGF2ZSBhcyBkZXNjcmliZWQgaGVyZTogaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvbm9kZS03eiNldmVudHNcclxuICBhd2FpdCBzemlwLmV4dHJhY3RGdWxsKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGRhdGFGaWxlKSwgZGVzdGluYXRpb25QYXRoKTtcclxuXHJcbiAgLy8gRmluZCBhbnkgZmlsZXMgdGhhdCBhcmUgbm90IGluIHRoZSBwYXJlbnQgZm9sZGVyLiBcclxuICBhd2FpdCB1dGlsLndhbGsoZGVzdGluYXRpb25QYXRoLCAoaXRlciwgc3RhdHMpID0+IHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGVzdGluYXRpb25QYXRoLCBpdGVyKTtcclxuICAgICAgLy8gRmlsdGVyIG91dCBmaWxlcyBmcm9tIHRoZSBvcmlnaW5hbCBpbnN0YWxsIGFzIHRoZXkncmUgbm8gbG9uZ2VyIHJlcXVpcmVkLlxyXG4gICAgICBpZiAoIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgpICYmIHN0YXRzLmlzRmlsZSgpICYmICFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoK3BhdGguc2VwKSkgdXBkYXRlZEZpbGVzLnB1c2gocmVsUGF0aCk7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gcmVsUGF0aC50b0xvY2FsZUxvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgY29uc3QgbW9kc0ZvbGRlcklkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgICAgaWYgKChtb2RzRm9sZGVySWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNGb2xkZXJJZHggKyAxKSkge1xyXG4gICAgICAgIF9TTUFQSV9CVU5ETEVEX01PRFMucHVzaChzZWdtZW50c1ttb2RzRm9sZGVySWR4ICsgMV0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIEZpbmQgdGhlIFNNQVBJIGV4ZSBmaWxlLiBcclxuICBjb25zdCBzbWFwaUV4ZSA9IHVwZGF0ZWRGaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKFNNQVBJX0VYRS50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgaWYgKHNtYXBpRXhlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChgRmFpbGVkIHRvIGV4dHJhY3QgJHtTTUFQSV9FWEV9IC0gZG93bmxvYWQgYXBwZWFycyBgXHJcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XHJcbiAgfVxyXG4gIGNvbnN0IGlkeCA9IHNtYXBpRXhlLmluZGV4T2YocGF0aC5iYXNlbmFtZShzbWFwaUV4ZSkpO1xyXG5cclxuICAvLyBCdWlsZCB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBpbnN0YWxsYXRpb24uIFxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSB1cGRhdGVkRmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihmaWxlLnN1YnN0cihpZHgpKSxcclxuICAgICAgfVxyXG4gIH0pO1xyXG5cclxuICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgIGtleTogJ3NtYXBpQnVuZGxlZE1vZHMnLFxyXG4gICAgdmFsdWU6IGdldEJ1bmRsZWRNb2RzKCksXHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgIHR5cGU6ICdnZW5lcmF0ZWZpbGUnLFxyXG4gICAgZGF0YSxcclxuICAgIGRlc3RpbmF0aW9uOiAnU3RhcmRld01vZGRpbmdBUEkuZGVwcy5qc29uJyxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIGxvZ0ZpbGUpIHtcclxuICBjb25zdCBsb2dEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsIGxvZ0ZpbGUpLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xyXG4gIGF3YWl0IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1NNQVBJIExvZycsIHtcclxuICAgIHRleHQ6ICdZb3VyIFNNQVBJIGxvZyBpcyBkaXNwbGF5ZWQgYmVsb3cuIFRvIHNoYXJlIGl0LCBjbGljayBcIkNvcHkgJiBTaGFyZVwiIHdoaWNoIHdpbGwgY29weSBpdCB0byB5b3VyIGNsaXBib2FyZCBhbmQgb3BlbiB0aGUgU01BUEkgbG9nIHNoYXJpbmcgd2Vic2l0ZS4gJyArXHJcbiAgICAgICdOZXh0LCBwYXN0ZSB5b3VyIGNvZGUgaW50byB0aGUgdGV4dCBib3ggYW5kIHByZXNzIFwic2F2ZSAmIHBhcnNlIGxvZ1wiLiBZb3UgY2FuIG5vdyBzaGFyZSBhIGxpbmsgdG8gdGhpcyBwYWdlIHdpdGggb3RoZXJzIHNvIHRoZXkgY2FuIHNlZSB5b3VyIGxvZyBmaWxlLlxcblxcbicgKyBsb2dEYXRhXHJcbiAgfSwgW3tcclxuICAgIGxhYmVsOiAnQ29weSAmIFNoYXJlIGxvZycsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvXi4rVChbXlxcLl0rKS4rLywgJyQxJyk7XHJcbiAgICAgIGNsaXBib2FyZC53cml0ZVRleHQoYFske3RpbWVzdGFtcH0gSU5GTyBWb3J0ZXhdIExvZyBleHBvcnRlZCBieSBWb3J0ZXggJHt1dGlsLmdldEFwcGxpY2F0aW9uKCkudmVyc2lvbn0uXFxuYCArIGxvZ0RhdGEpO1xyXG4gICAgICByZXR1cm4gdXRpbC5vcG4oJ2h0dHBzOi8vc21hcGkuaW8vbG9nJykuY2F0Y2goZXJyID0+IHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgfSwgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiB1bmRlZmluZWQgfV0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvblNob3dTTUFQSUxvZyhhcGkpIHtcclxuICAvL1JlYWQgYW5kIGRpc3BsYXkgdGhlIGxvZy5cclxuICBjb25zdCBiYXNlUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJ3N0YXJkZXd2YWxsZXknLCAnZXJyb3Jsb2dzJyk7XHJcbiAgdHJ5IHtcclxuICAgIC8vSWYgdGhlIGNyYXNoIGxvZyBleGlzdHMsIHNob3cgdGhhdC5cclxuICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWNyYXNoLnR4dFwiKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vT3RoZXJ3aXNlIHNob3cgdGhlIG5vcm1hbCBsb2cuXHJcbiAgICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWxhdGVzdC50eHRcIik7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy9PciBJbmZvcm0gdGhlIHVzZXIgdGhlcmUgYXJlIG5vIGxvZ3MuXHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHsgdHlwZTogJ2luZm8nLCB0aXRsZTogJ05vIFNNQVBJIGxvZ3MgZm91bmQuJywgbWVzc2FnZTogJycsIGRpc3BsYXlNUzogNTAwMCB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGNvbnN0IG1hbmlmZXN0czogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgaWYgKG1vZFBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdHVyYm93YWxrKG1vZFBhdGgsIGFzeW5jIGVudHJpZXMgPT4ge1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gJ21hbmlmZXN0Lmpzb24nKSB7XHJcbiAgICAgICAgbWFuaWZlc3RzLnB1c2goZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgeyBza2lwSGlkZGVuOiBmYWxzZSwgcmVjdXJzZTogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXHJcbiAgICAudGhlbigoKSA9PiBtYW5pZmVzdHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVDb25mbGljdEluZm8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcGk6IFNNQVBJUHJveHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkOiBzdHJpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IG1vZCA9IGFwaS5nZXRTdGF0ZSgpLnBlcnNpc3RlbnQubW9kc1tnYW1lSWRdW21vZElkXTtcclxuXHJcbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG5cclxuICBpZiAoKG5vdyAtIG1vZC5hdHRyaWJ1dGVzPy5sYXN0U01BUElRdWVyeSA/PyAwKSA8IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgbGV0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gbW9kLmF0dHJpYnV0ZXM/LmFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzO1xyXG4gIGlmICghYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMpIHtcclxuICAgIGlmIChtb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lKSB7XHJcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW21vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWVdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHF1ZXJ5ID0gYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXNcclxuICAgIC5tYXAobmFtZSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcyA9IHtcclxuICAgICAgICBpZDogbmFtZSxcclxuICAgICAgfTtcclxuICAgICAgY29uc3QgdmVyID0gbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxyXG4gICAgICAgICAgICAgICAgICAgICA/PyBzZW12ZXIuY29lcmNlKG1vZC5hdHRyaWJ1dGVzPy52ZXJzaW9uKT8udmVyc2lvbjtcclxuICAgICAgaWYgKCEhdmVyKSB7XHJcbiAgICAgICAgcmVzWydpbnN0YWxsZWRWZXJzaW9uJ10gPSB2ZXI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3Qgc3RhdCA9IChpdGVtOiBJU01BUElSZXN1bHQpOiBDb21wYXRpYmlsaXR5U3RhdHVzID0+IHtcclxuICAgIGNvbnN0IHN0YXR1cyA9IGl0ZW0ubWV0YWRhdGE/LmNvbXBhdGliaWxpdHlTdGF0dXM/LnRvTG93ZXJDYXNlPy4oKTtcclxuICAgIGlmICghY29tcGF0aWJpbGl0eU9wdGlvbnMuaW5jbHVkZXMoc3RhdHVzIGFzIGFueSkpIHtcclxuICAgICAgcmV0dXJuICd1bmtub3duJztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBzdGF0dXMgYXMgQ29tcGF0aWJpbGl0eVN0YXR1cztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBjb21wYXRpYmlsaXR5UHJpbyA9IChpdGVtOiBJU01BUElSZXN1bHQpID0+IGNvbXBhdGliaWxpdHlPcHRpb25zLmluZGV4T2Yoc3RhdChpdGVtKSk7XHJcblxyXG4gIHJldHVybiBzbWFwaS5maW5kQnlOYW1lcyhxdWVyeSlcclxuICAgIC50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICBjb25zdCB3b3JzdFN0YXR1czogSVNNQVBJUmVzdWx0W10gPSByZXN1bHRzXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBjb21wYXRpYmlsaXR5UHJpbyhsaHMpIC0gY29tcGF0aWJpbGl0eVByaW8ocmhzKSk7XHJcbiAgICAgIGlmICh3b3JzdFN0YXR1cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlcyhnYW1lSWQsIG1vZElkLCB7XHJcbiAgICAgICAgICBsYXN0U01BUElRdWVyeTogbm93LFxyXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVN0YXR1czogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN0YXR1cyxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlNZXNzYWdlOiB3b3JzdFN0YXR1c1swXS5tZXRhZGF0YS5jb21wYXRpYmlsaXR5U3VtbWFyeSxcclxuICAgICAgICAgIGNvbXBhdGliaWxpdHlVcGRhdGU6IHdvcnN0U3RhdHVzWzBdLnN1Z2dlc3RlZFVwZGF0ZT8udmVyc2lvbixcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdubyBtYW5pZmVzdCcpO1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ3dhcm4nLCAnZXJyb3IgcmVhZGluZyBtYW5pZmVzdCcsIGVyci5tZXNzYWdlKTtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBsZXQgZGVwZW5kZW5jeU1hbmFnZXI6IERlcGVuZGVuY3lNYW5hZ2VyO1xyXG4gIGNvbnN0IGdldERpc2NvdmVyeVBhdGggPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcclxuICAgICAgbG9nKCdlcnJvcicsICdzdGFyZGV3dmFsbGV5IHdhcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGdldFNNQVBJUGF0aCA9IChnYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGlzTW9kQ2FuZGlkYXRlVmFsaWQgPSAobW9kLCBlbnRyeSkgPT4ge1xyXG4gICAgaWYgKG1vZD8uaWQgPT09IHVuZGVmaW5lZCB8fCBtb2QudHlwZSA9PT0gJ3NkdnJvb3Rmb2xkZXInKSB7XHJcbiAgICAgIC8vIFRoZXJlIGlzIG5vIHJlbGlhYmxlIHdheSB0byBhc2NlcnRhaW4gd2hldGhlciBhIG5ldyBmaWxlIGVudHJ5XHJcbiAgICAgIC8vICBhY3R1YWxseSBiZWxvbmdzIHRvIGEgcm9vdCBtb2RUeXBlIGFzIHNvbWUgb2YgdGhlc2UgbW9kcyB3aWxsIGFjdFxyXG4gICAgICAvLyAgYXMgcmVwbGFjZW1lbnQgbW9kcy4gVGhpcyBvYnZpb3VzbHkgbWVhbnMgdGhhdCBpZiB0aGUgZ2FtZSBoYXNcclxuICAgICAgLy8gIGEgc3Vic3RhbnRpYWwgdXBkYXRlIHdoaWNoIGludHJvZHVjZXMgbmV3IGZpbGVzIHdlIGNvdWxkIHBvdGVudGlhbGx5XHJcbiAgICAgIC8vICBhZGQgYSB2YW5pbGxhIGdhbWUgZmlsZSBpbnRvIHRoZSBtb2QncyBzdGFnaW5nIGZvbGRlciBjYXVzaW5nIGNvbnN0YW50XHJcbiAgICAgIC8vICBjb250ZW50aW9uIGJldHdlZW4gdGhlIGdhbWUgaXRzZWxmICh3aGVuIGl0IHVwZGF0ZXMpIGFuZCB0aGUgbW9kLlxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUaGVyZSBpcyBhbHNvIGEgcG90ZW50aWFsIGNoYW5jZSBmb3Igcm9vdCBtb2RUeXBlcyB0byBjb25mbGljdCB3aXRoIHJlZ3VsYXJcclxuICAgICAgLy8gIG1vZHMsIHdoaWNoIGlzIHdoeSBpdCdzIG5vdCBzYWZlIHRvIGFzc3VtZSB0aGF0IGFueSBhZGRpdGlvbiBpbnNpZGUgdGhlXHJcbiAgICAgIC8vICBtb2RzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IGFkZGVkIHRvIHRoaXMgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgZWl0aGVyLlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1vZC50eXBlICE9PSAnU01BUEknKSB7XHJcbiAgICAgIC8vIE90aGVyIG1vZCB0eXBlcyBkbyBub3QgcmVxdWlyZSBmdXJ0aGVyIHZhbGlkYXRpb24gLSBpdCBzaG91bGQgYmUgZmluZVxyXG4gICAgICAvLyAgdG8gYWRkIHRoaXMgZW50cnkuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZW50cnkuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICBjb25zdCBtb2RzU2VnSWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXHJcbiAgICAgID8gc2VnbWVudHNbbW9kc1NlZ0lkeCArIDFdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIGxldCBidW5kbGVkTW9kcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdzbWFwaUJ1bmRsZWRNb2RzJ10sIFtdKTtcclxuICAgIGJ1bmRsZWRNb2RzID0gYnVuZGxlZE1vZHMubGVuZ3RoID4gMCA/IGJ1bmRsZWRNb2RzIDogZ2V0QnVuZGxlZE1vZHMoKTtcclxuICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcygnY29udGVudCcpKSB7XHJcbiAgICAgIC8vIFNNQVBJIGlzIG5vdCBzdXBwb3NlZCB0byBvdmVyd3JpdGUgdGhlIGdhbWUncyBjb250ZW50IGRpcmVjdGx5LlxyXG4gICAgICAvLyAgdGhpcyBpcyBjbGVhcmx5IG5vdCBhIFNNQVBJIGZpbGUgYW5kIHNob3VsZCBfbm90XyBiZSBhZGRlZCB0byBpdC5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAobW9kRm9sZGVyTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiBidW5kbGVkTW9kcy5pbmNsdWRlcyhtb2RGb2xkZXJOYW1lKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBtYW5pZmVzdEV4dHJhY3RvciA9IHRvQmx1ZShcclxuICAgIGFzeW5jIChtb2RJbmZvOiBhbnksIG1vZFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPHsgW2tleTogc3RyaW5nXTogYW55OyB9PiA9PiB7XHJcbiAgICAgIGlmIChzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhcnNlZE1hbmlmZXN0cyA9IChhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdHMubWFwKFxyXG4gICAgICAgIGFzeW5jIG1hbmlmZXN0ID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBwYXJzZU1hbmlmZXN0KG1hbmlmZXN0KTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBsb2coJ3dhcm4nLCAnRmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBtYW5pZmVzdEZpbGU6IG1hbmlmZXN0LCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSkpKS5maWx0ZXIobWFuaWZlc3QgPT4gbWFuaWZlc3QgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gICAgICBpZiAocGFyc2VkTWFuaWZlc3RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3ZSBjYW4gb25seSB1c2Ugb25lIG1hbmlmZXN0IHRvIGdldCB0aGUgaWQgZnJvbVxyXG4gICAgICBjb25zdCByZWZNYW5pZmVzdCA9IHBhcnNlZE1hbmlmZXN0c1swXTtcclxuXHJcbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gcGFyc2VkTWFuaWZlc3RzXHJcbiAgICAgICAgLmZpbHRlcihtYW5pZmVzdCA9PiBtYW5pZmVzdC5VbmlxdWVJRCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSk7XHJcblxyXG4gICAgICBjb25zdCBtaW5TTUFQSVZlcnNpb24gPSBwYXJzZWRNYW5pZmVzdHNcclxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0Lk1pbmltdW1BcGlWZXJzaW9uKVxyXG4gICAgICAgIC5maWx0ZXIodmVyc2lvbiA9PiBzZW12ZXIudmFsaWQodmVyc2lvbikpXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMsIGxocykpWzBdO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0ge1xyXG4gICAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzLFxyXG4gICAgICAgIG1pblNNQVBJVmVyc2lvbixcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChyZWZNYW5pZmVzdCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gZG9uJ3Qgc2V0IGEgY3VzdG9tIGZpbGUgbmFtZSBmb3IgU01BUElcclxuICAgICAgICBpZiAobW9kSW5mby5kb3dubG9hZC5tb2RJbmZvPy5uZXh1cz8uaWRzPy5tb2RJZCAhPT0gMjQwMCkge1xyXG4gICAgICAgICAgcmVzdWx0WydjdXN0b21GaWxlTmFtZSddID0gcmVmTWFuaWZlc3QuTmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgKHJlZk1hbmlmZXN0LlZlcnNpb24pID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgcmVzdWx0WydtYW5pZmVzdFZlcnNpb24nXSA9IHJlZk1hbmlmZXN0LlZlcnNpb247XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUobmV3IFN0YXJkZXdWYWxsZXkoY29udGV4dCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnU0RWJ10sIHNkdlJlZHVjZXJzKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MsIHVuZGVmaW5lZCwgKCkgPT5cclxuICAgIHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsIDE1MCk7XHJcblxyXG4gIC8vIFJlZ2lzdGVyIG91ciBTTUFQSSBtb2QgdHlwZSBhbmQgaW5zdGFsbGVyLiBOb3RlOiBUaGlzIGN1cnJlbnRseSBmbGFncyBhbiBlcnJvciBpbiBWb3J0ZXggb24gaW5zdGFsbGluZyBjb3JyZWN0bHkuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc21hcGktaW5zdGFsbGVyJywgMzAsIHRlc3RTTUFQSSwgKGZpbGVzLCBkZXN0KSA9PiBCbHVlYmlyZC5yZXNvbHZlKGluc3RhbGxTTUFQSShnZXREaXNjb3ZlcnlQYXRoLCBmaWxlcywgZGVzdCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnU01BUEknLCAzMCwgZ2FtZUlkID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgZ2V0U01BUElQYXRoLCBpc1NNQVBJTW9kVHlwZSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRlc3RTdXBwb3J0ZWQsXHJcbiAgICAoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlciwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzZHZyb290Zm9sZGVyJywgNTAsIHRlc3RSb290Rm9sZGVyLCBpbnN0YWxsUm9vdEZvbGRlcik7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3NkdnJvb3Rmb2xkZXInLCAyNSwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXHJcbiAgICAoKSA9PiBnZXREaXNjb3ZlcnlQYXRoKCksIChpbnN0cnVjdGlvbnMpID0+IHtcclxuICAgICAgLy8gT25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zLlxyXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xyXG4gICAgICAvLyBUaGlzIGlzIGEgdHJpY2t5IHBhdHRlcm4gc28gd2UncmUgZ29pbmcgdG8gMXN0IHByZXNlbnQgdGhlIGRpZmZlcmVudCBwYWNrYWdpbmdcclxuICAgICAgLy8gIHBhdHRlcm5zIHdlIG5lZWQgdG8gY2F0ZXIgZm9yOlxyXG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXHJcbiAgICAgIC8vICAgIG1hbmlmZXN0IGZpbGVzIGFyZSBpbmNsdWRlZC5cclxuICAgICAgLy8gIDIuIFJlcGxhY2VtZW50IG1vZCB3aXRoIFwiQ29udGVudFwiIGZvbGRlciArIG9uZSBvciBtb3JlIFNNQVBJIG1vZHMgaW5jbHVkZWRcclxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXHJcbiAgICAgIC8vICAzLiBBIHJlZ3VsYXIgU01BUEkgbW9kIHdpdGggYSBcIkNvbnRlbnRcIiBmb2xkZXIgaW5zaWRlIHRoZSBtb2QncyByb290IGRpci5cclxuICAgICAgLy9cclxuICAgICAgLy8gcGF0dGVybiAxOlxyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgZG9uJ3QgaGF2ZSBtYW5pZmVzdCBmaWxlc1xyXG4gICAgICAvLyAgLSBFbnN1cmUgd2UgaGF2ZSBhIFwiQ29udGVudFwiIGZvbGRlclxyXG4gICAgICAvL1xyXG4gICAgICAvLyBUbyBzb2x2ZSBwYXR0ZXJucyAyIGFuZCAzIHdlJ3JlIGdvaW5nIHRvOlxyXG4gICAgICAvLyAgQ2hlY2sgd2hldGhlciB3ZSBoYXZlIGFueSBtYW5pZmVzdCBmaWxlcywgaWYgd2UgZG8sIHdlIGV4cGVjdCB0aGUgZm9sbG93aW5nXHJcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XHJcbiAgICAgIC8vICAgIGFyY2hpdmUuemlwID0+XHJcbiAgICAgIC8vICAgICAgLi4vQ29udGVudC9cclxuICAgICAgLy8gICAgICAuLi9Nb2RzL1xyXG4gICAgICAvLyAgICAgIC4uL01vZHMvQV9TTUFQSV9NT0RcXG1hbmlmZXN0Lmpzb25cclxuICAgICAgY29uc3QgaGFzTWFuaWZlc3QgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcclxuICAgICAgY29uc3QgaGFzTW9kc0ZvbGRlciA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxyXG4gICAgICAgIGluc3RyLmRlc3RpbmF0aW9uLnN0YXJ0c1dpdGgoJ01vZHMnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBoYXNDb250ZW50Rm9sZGVyID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnQ29udGVudCcgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWRcclxuXHJcbiAgICAgIHJldHVybiAoaGFzTWFuaWZlc3QpXHJcbiAgICAgICAgPyBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIgJiYgaGFzTW9kc0ZvbGRlcilcclxuICAgICAgICA6IEJsdWViaXJkLnJlc29sdmUoaGFzQ29udGVudEZvbGRlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnY2hhbmdlbG9nJywge30sICdTTUFQSSBMb2cnLFxyXG4gICAgKCkgPT4geyBvblNob3dTTUFQSUxvZyhjb250ZXh0LmFwaSk7IH0sXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIC8vT25seSBzaG93IHRoZSBTTUFQSSBsb2cgYnV0dG9uIGZvciBTRFYuIFxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBdHRyaWJ1dGVFeHRyYWN0b3IoMjUsIG1hbmlmZXN0RXh0cmFjdG9yKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xyXG4gICAgaWQ6ICdzZHYtY29tcGF0aWJpbGl0eScsXHJcbiAgICBwb3NpdGlvbjogMTAwLFxyXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxyXG4gICAgcGxhY2VtZW50OiAndGFibGUnLFxyXG4gICAgY2FsYzogKG1vZDogdHlwZXMuSU1vZCkgPT4gbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMsXHJcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XHJcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KENvbXBhdGliaWxpdHlJY29uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHQsIG1vZCwgZGV0YWlsQ2VsbCB9LCBbXSk7XHJcbiAgICB9LFxyXG4gICAgbmFtZTogJ0NvbXBhdGliaWxpdHknLFxyXG4gICAgaXNEZWZhdWx0VmlzaWJsZTogdHJ1ZSxcclxuICAgIGVkaXQ6IHt9LFxyXG4gIH0pO1xyXG5cclxuICAvKlxyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtbWlzc2luZy1kZXBlbmRlbmNpZXMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IHRlc3RNaXNzaW5nRGVwZW5kZW5jaWVzKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpO1xyXG4gICovXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3Nkdi1pbmNvbXBhdGlibGUtbW9kcycsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0U01BUElPdXRkYXRlZChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIpKSk7XHJcblxyXG4gIGludGVyZmFjZSBJQWRkZWRGaWxlIHtcclxuICAgIGZpbGVQYXRoOiBzdHJpbmc7XHJcbiAgICBjYW5kaWRhdGVzOiBzdHJpbmdbXTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb25zdCBwcm94eSA9IG5ldyBTTUFQSVByb3h5KGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ3NkdicsIHBhdGguam9pbihfX2Rpcm5hbWUsICdzZHZzdHlsZS5zY3NzJykpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmFkZE1ldGFTZXJ2ZXIoJ3NtYXBpLmlvJywge1xyXG4gICAgICB1cmw6ICcnLFxyXG4gICAgICBsb29wYmFja0NCOiAocXVlcnk6IElRdWVyeSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHByb3h5LmZpbmQocXVlcnkpKVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvb2sgdXAgc21hcGkgbWV0YSBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgY2FjaGVEdXJhdGlvblNlYzogODY0MDAsXHJcbiAgICAgIHByaW9yaXR5OiAyNSxcclxuICAgIH0pO1xyXG4gICAgZGVwZW5kZW5jeU1hbmFnZXIgPSBuZXcgRGVwZW5kZW5jeU1hbmFnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnYWRkZWQtZmlsZXMnLCBhc3luYyAocHJvZmlsZUlkLCBmaWxlczogSUFkZGVkRmlsZVtdKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG5cclxuICAgICAgYXdhaXQgQmx1ZWJpcmQubWFwKGZpbGVzLCBhc3luYyBlbnRyeSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcclxuICAgICAgICAgIGlmIChmcm9tID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXHJcbiAgICAgICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVzb2x2ZSBtb2QgcGF0aCBmb3IgbW9kIHR5cGUnLCBtb2QudHlwZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGZyb20sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXHJcbiAgICAgICAgICAvLyBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3QgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ2FyZSB0aGUgc2FtZSBmaWxlJykpIHtcclxuICAgICAgICAgICAgICAvLyBzaG91bGQgd2UgYmUgcmVwb3J0aW5nIHRoaXMgdG8gdGhlIHVzZXI/IFRoaXMgaXMgYSBjb21wbGV0ZWx5XHJcbiAgICAgICAgICAgICAgLy8gYXV0b21hdGVkIHByb2Nlc3MgYW5kIGlmIGl0IGZhaWxzIG1vcmUgb2Z0ZW4gdGhhbiBub3QgdGhlXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBwcm9iYWJseSBkb2Vzbid0IGNhcmVcclxuICAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZS1pbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgJ3NtYXBpJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XHJcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc21hcGlNb2QgJiYgcHJpbWFyeVRvb2wgPT09ICdzbWFwaScpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lSWQsIG1vZElkKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGxvZygnZGVidWcnLCAnYWRkZWQgY29tcGF0aWJpbGl0eSBpbmZvJywgeyBtb2RJZCB9KSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGxvZygnZGVidWcnLCAndXBkYXRpbmcgU0RWIGNvbXBhdGliaWxpdHkgaW5mbycpO1xyXG4gICAgICBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZU1vZGVdID8/IHt9KS5tYXAobW9kSWQgPT5cclxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2RvbmUgdXBkYXRpbmcgY29tcGF0aWJpbGl0eSBpbmZvJyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHVwZGF0ZSBjb25mbGljdCBpbmZvJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGluaXQ7XHJcbiJdfQ==