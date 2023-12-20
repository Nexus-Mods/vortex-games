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
const child_process_1 = require("child_process");
const exe_version_1 = __importDefault(require("exe-version"));
const path = __importStar(require("path"));
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_redux_1 = require("react-redux");
const semver = __importStar(require("semver"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const gitHubDownloader = __importStar(require("./githubDownloader"));
const loadOrder_1 = require("./loadOrder");
const Settings_1 = __importDefault(require("./Settings"));
const actions_1 = require("./actions");
const reducers_1 = __importDefault(require("./reducers"));
const migrations_1 = require("./migrations");
const STOP_PATTERNS = ['[^/]*\\.pak$'];
const GOG_ID = '1456460669';
const STEAM_ID = '1086940';
function toWordExp(input) {
    return '(^|/)' + input + '(/|$)';
}
function documentsPath() {
    return path.join(vortex_api_1.util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}
function modsPath() {
    return path.join(documentsPath(), 'Mods');
}
function profilesPath() {
    return path.join(documentsPath(), 'PlayerProfiles');
}
function globalProfilePath() {
    return path.join(documentsPath(), 'global');
}
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID])
        .then(game => game.gamePath);
}
function ensureGlobalProfile(api, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        if (discovery === null || discovery === void 0 ? void 0 : discovery.path) {
            const profilePath = globalProfilePath();
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(profilePath);
                const modSettingsFilePath = path.join(profilePath, 'modsettings.lsx');
                try {
                    yield vortex_api_1.fs.statAsync(modSettingsFilePath);
                }
                catch (err) {
                    yield vortex_api_1.fs.writeFileAsync(modSettingsFilePath, common_1.DEFAULT_MOD_SETTINGS, { encoding: 'utf8' });
                }
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    });
}
function prepareForModding(api, discovery) {
    const mp = modsPath();
    checkForScriptExtender(api);
    showFullReleaseModFixerRecommendation(api);
    console.log(`current extension version = `);
    api.sendNotification({
        id: 'bg3-uses-lslib',
        type: 'info',
        title: 'BG3 support uses LSLib',
        message: common_1.LSLIB_URL,
        allowSuppress: true,
        actions: [
            { title: 'Visit Page', action: () => vortex_api_1.util.opn(common_1.LSLIB_URL).catch(() => null) },
        ],
    });
    return vortex_api_1.fs.statAsync(mp)
        .catch(() => vortex_api_1.fs.ensureDirWritableAsync(mp, () => bluebird_1.default.resolve()))
        .finally(() => ensureGlobalProfile(api, discovery));
}
function checkForScriptExtender(api) {
}
function showFullReleaseModFixerRecommendation(api) {
    var _a, _b;
    const mods = (_b = (_a = api.store.getState().persistent) === null || _a === void 0 ? void 0 : _a.mods) === null || _b === void 0 ? void 0 : _b.baldursgate3;
    console.log('mods', mods);
    if (mods !== undefined) {
        const modArray = mods ? Object.values(mods) : [];
        console.log('modArray', modArray);
        const modFixerInstalled = modArray.filter(mod => { var _a; return !!((_a = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _a === void 0 ? void 0 : _a.modFixer); }).length != 0;
        console.log('modFixerInstalled', modFixerInstalled);
        if (modFixerInstalled) {
            return;
        }
    }
    api.sendNotification({
        type: 'warning',
        title: 'Recommended Mod',
        message: 'Most mods require this mod.',
        id: 'bg3-recommended-mod',
        allowSuppress: true,
        actions: [
            {
                title: 'More', action: dismiss => {
                    api.showDialog('question', 'Recommended Mods', {
                        text: 'We recommend installing "Baldur\'s Gate 3 Mod Fixer" to be able to mod Baldur\'s Gate 3.\n\n' +
                            'This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods'
                    }, [
                        { label: 'Dismiss' },
                        { label: 'Open Nexus Mods', default: true },
                    ])
                        .then(result => {
                        dismiss();
                        if (result.action === 'Open Nexus Mods') {
                            vortex_api_1.util.opn('https://www.nexusmods.com/baldursgate3/mods/141?tab=description').catch(() => null);
                        }
                        else if (result.action === 'Cancel') {
                        }
                        return Promise.resolve();
                    });
                }
            }
        ],
    });
}
function getGamePath(api) {
    var _a, _b;
    const state = api.getState();
    return (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
}
function getGameDataPath(api) {
    var _a, _b;
    const state = api.getState();
    const gameMode = vortex_api_1.selectors.activeGameId(state);
    const gamePath = (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
    if (gamePath !== undefined) {
        return path.join(gamePath, 'Data');
    }
    else {
        return undefined;
    }
}
const ORIGINAL_FILES = new Set([
    'assets.pak',
    'assets.pak',
    'effects.pak',
    'engine.pak',
    'engineshaders.pak',
    'game.pak',
    'gameplatform.pak',
    'gustav.pak',
    'gustav_textures.pak',
    'icons.pak',
    'lowtex.pak',
    'materials.pak',
    'minimaps.pak',
    'models.pak',
    'shared.pak',
    'sharedsoundbanks.pak',
    'sharedsounds.pak',
    'textures.pak',
    'virtualtextures.pak',
]);
const LSLIB_FILES = new Set([
    'divine.exe',
    'lslib.dll',
]);
function isLSLib(api, files) {
    const origFile = files.find(iter => (iter.type === 'copy') && LSLIB_FILES.has(path.basename(iter.destination).toLowerCase()));
    return origFile !== undefined
        ? bluebird_1.default.resolve(true)
        : bluebird_1.default.resolve(false);
}
function isBG3SE(api, files) {
    const origFile = files.find(iter => (iter.type === 'copy') && (path.basename(iter.destination).toLowerCase() === 'dwrite.dll'));
    return origFile !== undefined
        ? bluebird_1.default.resolve(true)
        : bluebird_1.default.resolve(false);
}
function testLSLib(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return bluebird_1.default.resolve({ supported: false, requiredFiles: [] });
    }
    const matchedFiles = files.filter(file => LSLIB_FILES.has(path.basename(file).toLowerCase()));
    return bluebird_1.default.resolve({
        supported: matchedFiles.length >= 2,
        requiredFiles: [],
    });
}
function testBG3SE(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return bluebird_1.default.resolve({ supported: false, requiredFiles: [] });
    }
    const hasDWriteDll = files.find(file => path.basename(file).toLowerCase() === 'dwrite.dll') !== undefined;
    return bluebird_1.default.resolve({
        supported: hasDWriteDll,
        requiredFiles: [],
    });
}
function installLSLib(files, destinationPath, gameId, progressDelegate) {
    return __awaiter(this, void 0, void 0, function* () {
        const exe = files.find(file => path.basename(file.toLowerCase()) === 'divine.exe');
        const exePath = path.join(destinationPath, exe);
        let ver = yield (0, exe_version_1.default)(exePath);
        ver = ver.split('.').slice(0, 3).join('.');
        const fileName = path.basename(destinationPath, path.extname(destinationPath));
        const idx = fileName.indexOf('-v');
        const fileNameVer = fileName.slice(idx + 2);
        if (semver.valid(fileNameVer) && ver !== fileNameVer) {
            ver = fileNameVer;
        }
        const versionAttr = { type: 'attribute', key: 'version', value: ver };
        const modtypeAttr = { type: 'setmodtype', value: 'bg3-lslib-divine-tool' };
        const instructions = files.reduce((accum, filePath) => {
            if (filePath.toLowerCase()
                .split(path.sep)
                .indexOf('tools') !== -1
                && !filePath.endsWith(path.sep)) {
                accum.push({
                    type: 'copy',
                    source: filePath,
                    destination: path.join('tools', path.basename(filePath)),
                });
            }
            return accum;
        }, [modtypeAttr, versionAttr]);
        return bluebird_1.default.resolve({ instructions });
    });
}
function isEngineInjector(api, instructions) {
    console.log('isEngineInjector instructions:', instructions);
    if (instructions.find(inst => inst.destination.toLowerCase().indexOf('bin') === 0)) {
        return api.showDialog('question', 'Confirm mod installation', {
            text: 'The mod you\'re about to install contains dll files that will run with the ' +
                'game, have the same access to your system and can thus cause considerable ' +
                'damage or infect your system with a virus if it\'s malicious.\n' +
                'Please install this mod only if you received it from a trustworthy source ' +
                'and if you have a virus scanner active right now.',
        }, [
            { label: 'Cancel' },
            { label: 'Continue', default: true },
        ]).then(result => result.action === 'Continue');
    }
    else {
        return bluebird_1.default.resolve(false);
    }
}
function isLoose(api, instructions) {
    const copyInstructions = instructions.filter(instr => instr.type === 'copy');
    const hasDataFolder = copyInstructions.find(instr => instr.source.indexOf('Data' + path.sep) !== -1) !== undefined;
    const hasGenOrPublicFolder = copyInstructions.find(instr => instr.source.indexOf('Generated' + path.sep) !== -1 ||
        instr.source.indexOf('Public' + path.sep) !== -1) !== undefined;
    console.log('isLoose', { instructions: instructions, hasDataFolder: hasDataFolder || hasGenOrPublicFolder });
    return bluebird_1.default.resolve(hasDataFolder || hasGenOrPublicFolder);
}
function isReplacer(api, files) {
    const origFile = files.find(iter => (iter.type === 'copy') && ORIGINAL_FILES.has(iter.destination.toLowerCase()));
    const paks = files.filter(iter => (iter.type === 'copy') && (path.extname(iter.destination).toLowerCase() === '.pak'));
    console.log('isReplacer', { origFile: origFile, paks: paks });
    if ((origFile !== undefined)) {
        return api.showDialog('question', 'Mod looks like a replacer', {
            bbcode: 'The mod you just installed looks like a "replacer", meaning it is intended to replace '
                + 'one of the files shipped with the game.<br/>'
                + 'You should be aware that such a replacer includes a copy of some game data from a '
                + 'specific version of the game and may therefore break as soon as the game gets updated.<br/>'
                + 'Even if doesn\'t break, it may revert bugfixes that the game '
                + 'developers have made.<br/><br/>'
                + 'Therefore [color="red"]please take extra care to keep this mod updated[/color] and remove it when it '
                + 'no longer matches the game version.',
        }, [
            { label: 'Install as Mod (will likely not work)' },
            { label: 'Install as Replacer', default: true },
        ]).then(result => result.action === 'Install as Replacer');
    }
    else {
        return bluebird_1.default.resolve(false);
    }
}
function testReplacer(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return bluebird_1.default.resolve({ supported: false, requiredFiles: [] });
    }
    const paks = files.filter(file => path.extname(file).toLowerCase() === '.pak');
    return bluebird_1.default.resolve({
        supported: paks.length === 0,
        requiredFiles: [],
    });
}
function installReplacer(files, destinationPath, gameId, progressDelegate) {
    const directories = Array.from(new Set(files.map(file => path.dirname(file).toUpperCase())));
    let dataPath = directories.find(dir => path.basename(dir) === 'DATA');
    if (dataPath === undefined) {
        const genOrPublic = directories
            .find(dir => ['PUBLIC', 'GENERATED'].includes(path.basename(dir)));
        if (genOrPublic !== undefined) {
            dataPath = path.dirname(genOrPublic);
        }
    }
    const instructions = (dataPath !== undefined)
        ? files.reduce((prev, filePath) => {
            if (filePath.endsWith(path.sep)) {
                return prev;
            }
            const relPath = path.relative(dataPath, filePath);
            if (!relPath.startsWith('..')) {
                prev.push({
                    type: 'copy',
                    source: filePath,
                    destination: relPath,
                });
            }
            return prev;
        }, [])
        : files.map((filePath) => ({
            type: 'copy',
            source: filePath,
            destination: filePath,
        }));
    return bluebird_1.default.resolve({
        instructions,
    });
}
const getPlayerProfiles = (() => {
    let cached = [];
    try {
        cached = vortex_api_1.fs.readdirSync(profilesPath())
            .filter(name => (path.extname(name) === '') && (name !== 'Default'));
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    return () => cached;
})();
function gameSupportsProfile(gameVersion) {
    return semver.lt(semver.coerce(gameVersion), '4.1.206');
}
function InfoPanel(props) {
    const { t, gameVersion, onInstallLSLib, onSetPlayerProfile, isLsLibInstalled } = props;
    const supportsProfiles = gameSupportsProfile(gameVersion);
    const currentProfile = supportsProfiles ? props.currentProfile : 'Public';
    const onSelect = React.useCallback((ev) => {
        onSetPlayerProfile(ev.currentTarget.value);
    }, [onSetPlayerProfile]);
    return isLsLibInstalled() ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginRight: '16px' } },
        React.createElement(react_bootstrap_1.Alert, { bsStyle: 'warning', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement("div", null, t(`Version 0.3 of the extension is almost a complete rewrite of load order and migration from previous versions may cause issues.
        A Purge then a Deploy will normally solve all issues but please make a backup first using Export... as the load order will be reset.`)),
            React.createElement("div", null, t(`A backup is made of the game's modsettings.lsx file before anything is changed.
        This can be found at %APPDATA%\\Local\\Larian Studios\\Baldur's Gate 3\\PlayerProfiles\\Public\\modsettings.lsx.backup`))),
        React.createElement("div", null, t(`Drag and Drop PAK files to reorder how the game loads them. Please note, some mods contain multiple PAK files.`)),
        React.createElement("div", null, t(`Mod descriptions from mod authors may have information to determine the best order.`)),
        React.createElement("div", null, t(`Some mods may be locked in this list because they are loaded differently by the game and can therefore not be load-ordered by mod managers. 
        If you need to disable such a mod, please do so in Vortex\'s Mods page.`)),
        React.createElement("h4", { style: { margin: 0 } }, t('Import and Export')),
        React.createElement("div", null, t(`Import is an experimental tool to help migration from a game load order (.lsx file) to Vortex. It works by importing the game's modsettings file
        and attempts to match up mods that have been installed by Vortex.`)),
        React.createElement("div", null, t(`Export can be used to manually update the game's modsettings.lsx file if 'Settings > Mods > Auto export load order' isn't set to do this automatically. 
        It can also be used to export to a different file as a backup.`)))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        React.createElement("h4", { style: { margin: 0 } }, t('LSLib is not installed')),
        React.createElement("div", null, t('To take full advantage of Vortex\'s Baldur\s Gate 3 modding capabilities such as managing the '
            + 'order in which mods are loaded into the game; Vortex requires a 3rd party tool called LSLib.')),
        React.createElement("div", null, t('Please install the library using the buttons below to manage your load order.')),
        React.createElement(vortex_api_1.tooltip.Button, { tooltip: 'Install LSLib', onClick: onInstallLSLib }, t('Install LSLib'))));
}
function getOwnGameVersion(state) {
    return __awaiter(this, void 0, void 0, function* () {
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        return yield vortex_api_1.util.getGame(common_1.GAME_ID).getInstalledVersion(discovery);
    });
}
function getActivePlayerProfile(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        return gameSupportsProfile(yield getOwnGameVersion(api.getState()))
            ? ((_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile) || 'global'
            : 'Public';
    });
}
function writeLoadOrderOld(api, loadOrder) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = yield getActivePlayerProfile(api);
        const playerProfiles = (bg3profile === 'global') ? getPlayerProfiles() : [bg3profile];
        if (playerProfiles.length === 0) {
            api.sendNotification({
                id: 'bg3-no-profiles',
                type: 'warning',
                title: 'No player profiles',
                message: 'Please run the game at least once and create a profile in-game',
            });
            return;
        }
        api.dismissNotification('bg3-no-profiles');
        try {
            const modSettings = yield readModSettings(api);
            const region = findNode((_a = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
            const root = findNode(region === null || region === void 0 ? void 0 : region.node, 'root');
            const modsNode = findNode((_c = (_b = root === null || root === void 0 ? void 0 : root.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'Mods');
            const loNode = (_f = findNode((_e = (_d = root === null || root === void 0 ? void 0 : root.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'ModOrder')) !== null && _f !== void 0 ? _f : { children: [] };
            if ((loNode.children === undefined) || (loNode.children[0] === '')) {
                loNode.children = [{ node: [] }];
            }
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            const descriptionNodes = (_l = (_k = (_j = (_h = (_g = modsNode === null || modsNode === void 0 ? void 0 : modsNode.children) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.node) === null || _j === void 0 ? void 0 : _j.filter) === null || _k === void 0 ? void 0 : _k.call(_j, iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'GustavDev')))) !== null && _l !== void 0 ? _l : [];
            const enabledPaks = Object.keys(loadOrder)
                .filter(key => {
                var _a, _b;
                return !!((_a = loadOrder[key].data) === null || _a === void 0 ? void 0 : _a.uuid)
                    && loadOrder[key].enabled
                    && !((_b = loadOrder[key].data) === null || _b === void 0 ? void 0 : _b.isListed);
            });
            console.log('enabledPaks', enabledPaks);
            for (const key of enabledPaks) {
                descriptionNodes.push({
                    $: { id: 'ModuleShortDesc' },
                    attribute: [
                        { $: { id: 'Folder', type: 'LSWString', value: loadOrder[key].data.folder } },
                        { $: { id: 'MD5', type: 'LSString', value: loadOrder[key].data.md5 } },
                        { $: { id: 'Name', type: 'FixedString', value: loadOrder[key].data.name } },
                        { $: { id: 'UUID', type: 'FixedString', value: loadOrder[key].data.uuid } },
                        { $: { id: 'Version', type: 'int32', value: loadOrder[key].data.version } },
                    ],
                });
            }
            const loadOrderNodes = enabledPaks
                .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
                .map((key) => ({
                $: { id: 'Module' },
                attribute: [
                    { $: { id: 'UUID', type: 'FixedString', value: loadOrder[key].data.uuid } },
                ],
            }));
            modsNode.children[0].node = descriptionNodes;
            loNode.children[0].node = loadOrderNodes;
            if (bg3profile === 'global') {
                writeModSettings(api, modSettings, bg3profile);
            }
            for (const profile of playerProfiles) {
                writeModSettings(api, modSettings, profile);
                api.store.dispatch((0, actions_1.settingsWritten)(profile, Date.now(), enabledPaks.length));
            }
        }
        catch (err) {
            api.showErrorNotification('Failed to write load order', err, {
                allowReport: false,
                message: 'Please run the game at least once and create a profile in-game',
            });
        }
    });
}
function getLatestLSLibMod(api) {
    const state = api.getState();
    const mods = state.persistent.mods[common_1.GAME_ID];
    if (mods === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    const lsLib = Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const latestVer = vortex_api_1.util.getSafe(prev, ['attributes', 'version'], '0.0.0');
            const currentVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(currentVer, latestVer)) {
                    prev = mods[id];
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid mod version', { modId: id, version: currentVer });
            }
        }
        return prev;
    }, undefined);
    if (lsLib === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    return lsLib;
}
class DivineExecMissing extends Error {
    constructor() {
        super('Divine executable is missing');
        this.name = 'DivineExecMissing';
    }
}
function divine(api, action, options) {
    return new Promise((resolve, reject) => {
        let returned = false;
        let stdout = '';
        const state = api.getState();
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const lsLib = getLatestLSLibMod(api);
        if (lsLib === undefined) {
            const err = new Error('LSLib/Divine tool is missing');
            err['attachLogOnReport'] = false;
            return reject(err);
        }
        const exe = path.join(stagingFolder, lsLib.installationPath, 'tools', 'divine.exe');
        const args = [
            '--action', action,
            '--source', options.source,
            '--loglevel', 'off',
            '--game', 'bg3',
        ];
        if (options.destination !== undefined) {
            args.push('--destination', options.destination);
        }
        if (options.expression !== undefined) {
            args.push('--expression', options.expression);
        }
        const proc = (0, child_process_1.spawn)(exe, args);
        proc.stdout.on('data', data => stdout += data);
        proc.stderr.on('data', data => (0, vortex_api_1.log)('warn', data));
        proc.on('error', (errIn) => {
            if (!returned) {
                if (errIn['code'] === 'ENOENT') {
                    reject(new DivineExecMissing());
                }
                returned = true;
                const err = new Error('divine.exe failed: ' + errIn.message);
                err['attachLogOnReport'] = true;
                reject(err);
            }
        });
        proc.on('exit', (code) => {
            if (!returned) {
                returned = true;
                if (code === 0) {
                    return resolve({ stdout, returnCode: 0 });
                }
                else if ([2, 102].includes(code)) {
                    return resolve({ stdout: '', returnCode: 2 });
                }
                else {
                    if (code > 100) {
                        code -= 100;
                    }
                    const err = new Error(`divine.exe failed: ${code}`);
                    err['attachLogOnReport'] = true;
                    return reject(err);
                }
            }
        });
    });
}
function extractPak(api, pakPath, destPath, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        return divine(api, 'extract-package', { source: pakPath, destination: destPath, expression: pattern });
    });
}
function extractMeta(api, pakPath, mod) {
    return __awaiter(this, void 0, void 0, function* () {
        const metaPath = path.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', (0, shortid_1.generate)());
        yield vortex_api_1.fs.ensureDirAsync(metaPath);
        yield extractPak(api, pakPath, metaPath, '*/meta.lsx');
        try {
            let metaLSXPath = path.join(metaPath, 'meta.lsx');
            yield (0, turbowalk_1.default)(metaPath, entries => {
                const temp = entries.find(e => path.basename(e.filePath).toLowerCase() === 'meta.lsx');
                if (temp !== undefined) {
                    metaLSXPath = temp.filePath;
                }
            });
            const dat = yield vortex_api_1.fs.readFileAsync(metaLSXPath);
            const meta = yield (0, xml2js_1.parseStringPromise)(dat);
            yield vortex_api_1.fs.removeAsync(metaPath);
            return meta;
        }
        catch (err) {
            yield vortex_api_1.fs.removeAsync(metaPath);
            if (err.code === 'ENOENT') {
                return Promise.resolve(undefined);
            }
            else if (err.message.includes('Column') && (err.message.includes('Line'))) {
                api.sendNotification({
                    type: 'warning',
                    message: 'The meta.lsx file in "{{modName}}" is invalid, please report this to the author',
                    actions: [{
                            title: 'More',
                            action: () => {
                                api.showDialog('error', 'Invalid meta.lsx file', {
                                    message: err.message,
                                }, [{ label: 'Close' }]);
                            }
                        }],
                    replace: {
                        modName: vortex_api_1.util.renderModName(mod),
                    }
                });
                return Promise.resolve(undefined);
            }
            else {
                throw err;
            }
        }
    });
}
function findNode(nodes, id) {
    var _a;
    return (_a = nodes === null || nodes === void 0 ? void 0 : nodes.find(iter => iter.$.id === id)) !== null && _a !== void 0 ? _a : undefined;
}
const listCache = {};
function listPackage(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield divine(api, 'list-package', { source: pakPath });
        const lines = res.stdout.split('\n').map(line => line.trim()).filter(line => line.length !== 0);
        return lines;
    });
}
function isLOListed(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (listCache[pakPath] === undefined) {
            listCache[pakPath] = listPackage(api, pakPath);
        }
        const lines = yield listCache[pakPath];
        const metaLSX = lines.find(line => path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx');
        return metaLSX === undefined;
    });
}
function extractPakInfoImpl(api, pakPath, mod) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const meta = yield extractMeta(api, pakPath, mod);
        const config = findNode((_a = meta === null || meta === void 0 ? void 0 : meta.save) === null || _a === void 0 ? void 0 : _a.region, 'Config');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const moduleInfo = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModuleInfo');
        console.log('meta', meta);
        const attr = (name, fallback) => { var _a, _b, _c; return (_c = (_b = (_a = findNode(moduleInfo === null || moduleInfo === void 0 ? void 0 : moduleInfo.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback(); };
        const genName = path.basename(pakPath, path.extname(pakPath));
        let isListed = yield isLOListed(api, pakPath);
        return {
            author: attr('Author', () => 'Unknown'),
            description: attr('Description', () => 'Missing'),
            folder: attr('Folder', () => genName),
            md5: attr('MD5', () => ''),
            name: attr('Name', () => genName),
            type: attr('Type', () => 'Adventure'),
            uuid: attr('UUID', () => require('uuid').v4()),
            version: attr('Version', () => '1'),
            isListed: isListed
        };
    });
}
const fallbackPicture = path.join(__dirname, 'gameart.jpg');
let storedLO;
function parseModNode(node) {
    const name = findNode(node.attribute, 'Name').$.value;
    return {
        id: name,
        name,
        data: findNode(node.attribute, 'UUID').$.value,
    };
}
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = yield getActivePlayerProfile(api);
        const playerProfiles = getPlayerProfiles();
        if (playerProfiles.length === 0) {
            storedLO = [];
            return;
        }
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfilePath(), 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function writeModSettings(api, data, bg3profile) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bg3profile) {
            return;
        }
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfilePath(), 'modsettings.lsx');
        const builder = new xml2js_1.Builder();
        const xml = builder.buildObject(data);
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(settingsPath));
            yield vortex_api_1.fs.writeFileAsync(settingsPath, xml);
        }
        catch (err) {
            storedLO = [];
            const allowReport = ['ENOENT', 'EPERM'].includes(err.code);
            api.showErrorNotification('Failed to write mod settings', err, { allowReport });
            return;
        }
    });
}
function readStoredLO(api) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    return __awaiter(this, void 0, void 0, function* () {
        const modSettings = yield readModSettings(api);
        const config = findNode((_a = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const modOrderRoot = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModOrder');
        const modsRoot = findNode((_e = (_d = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'Mods');
        const modOrderNodes = (_h = (_g = (_f = modOrderRoot === null || modOrderRoot === void 0 ? void 0 : modOrderRoot.children) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.node) !== null && _h !== void 0 ? _h : [];
        const modNodes = (_l = (_k = (_j = modsRoot === null || modsRoot === void 0 ? void 0 : modsRoot.children) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.node) !== null && _l !== void 0 ? _l : [];
        const modOrder = modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
        const state = api.store.getState();
        const vProfile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabled = Object.keys(mods).filter(id => vortex_api_1.util.getSafe(vProfile, ['modState', id, 'enabled'], false));
        const bg3profile = (_m = state.settings.baldursgate3) === null || _m === void 0 ? void 0 : _m.playerProfile;
        if (enabled.length > 0 && modNodes.length === 1) {
            const lastWrite = (_p = (_o = state.settings.baldursgate3) === null || _o === void 0 ? void 0 : _o.settingsWritten) === null || _p === void 0 ? void 0 : _p[bg3profile];
            if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
                api.showDialog('info', '"modsettings.lsx" file was reset', {
                    text: 'The game reset the list of active mods and ran without them.\n'
                        + 'This happens when an invalid or incompatible mod is installed. '
                        + 'The game will not load any mods if one of them is incompatible, unfortunately '
                        + 'there is no easy way to find out which one caused the problem.',
                }, [
                    { label: 'Continue' },
                ]);
            }
        }
        storedLO = modNodes
            .map(node => parseModNode(node))
            .filter(entry => entry.id === 'Gustav')
            .sort((lhs, rhs) => modOrder
            .findIndex(i => i === lhs.data) - modOrder.findIndex(i => i === rhs.data));
    });
}
function readPAKList(api) {
    return __awaiter(this, void 0, void 0, function* () {
        let paks;
        try {
            paks = (yield vortex_api_1.fs.readdirAsync(modsPath()))
                .filter(fileName => path.extname(fileName).toLowerCase() === '.pak');
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                try {
                    yield vortex_api_1.fs.ensureDirWritableAsync(modsPath(), () => Promise.resolve());
                }
                catch (err) {
                }
            }
            else {
                api.showErrorNotification('Failed to read mods directory', err, {
                    id: 'bg3-failed-read-mods',
                    message: modsPath(),
                });
            }
            paks = [];
        }
        return paks;
    });
}
function readPAKs(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const lsLib = getLatestLSLibMod(api);
        if (lsLib === undefined) {
            return [];
        }
        const paks = yield readPAKList(api);
        console.log('paks', { paks: paks });
        let manifest;
        try {
            manifest = yield vortex_api_1.util.getManifest(api, '', common_1.GAME_ID);
        }
        catch (err) {
            const allowReport = !['EPERM'].includes(err.code);
            api.showErrorNotification('Failed to read deployment manifest', err, { allowReport });
            return [];
        }
        const res = yield Promise.all(paks.map((fileName) => __awaiter(this, void 0, void 0, function* () {
            return vortex_api_1.util.withErrorContext('reading pak', fileName, () => {
                const func = () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
                        const mod = (manifestEntry !== undefined)
                            ? (_a = state.persistent.mods[common_1.GAME_ID]) === null || _a === void 0 ? void 0 : _a[manifestEntry.source]
                            : undefined;
                        const pakPath = path.join(modsPath(), fileName);
                        return {
                            fileName,
                            mod,
                            info: yield extractPakInfoImpl(api, pakPath, mod),
                        };
                    }
                    catch (err) {
                        if (err instanceof DivineExecMissing) {
                            const message = 'The installed copy of LSLib/Divine is corrupted - please '
                                + 'delete the existing LSLib mod entry and re-install it. Make sure to '
                                + 'disable or add any necessary exceptions to your security software to '
                                + 'ensure it does not interfere with Vortex/LSLib file operations.';
                            api.showErrorNotification('Divine executable is missing', message, { allowReport: false });
                            return undefined;
                        }
                        if (err.code !== 'ENOENT') {
                            api.showErrorNotification('Failed to read pak. Please make sure you are using the latest version of LSLib by using the "Re-install LSLib/Divine" toolbar button on the Mods page.', err, {
                                allowReport: false,
                                message: fileName,
                            });
                        }
                        return undefined;
                    }
                });
                return bluebird_1.default.resolve(func());
            });
        })));
        return res.filter(iter => iter !== undefined);
    });
}
function readLO(api) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const modSettings = yield readModSettings(api);
            const config = findNode((_a = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
            const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
            const modOrderRoot = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModOrder');
            const modOrderNodes = (_f = (_e = (_d = modOrderRoot === null || modOrderRoot === void 0 ? void 0 : modOrderRoot.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node) !== null && _f !== void 0 ? _f : [];
            return modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
        }
        catch (err) {
            api.showErrorNotification('Failed to read modsettings.lsx', err, {
                allowReport: false,
                message: 'Please run the game at least once and create a profile in-game',
            });
            return [];
        }
    });
}
function serializeLoadOrder(api, order) {
    console.log('serializeLoadOrder');
    return writeLoadOrderOld(api, order);
}
const deserializeDebouncer = new vortex_api_1.util.Debouncer(() => {
    return Promise.resolve();
}, 1000);
function deserializeLoadOrder(api) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vortex_api_1.util.toPromise(cb => deserializeDebouncer.schedule(cb));
        console.log('deserializeLoadOrder');
        const paks = yield readPAKs(api);
        const order = yield readLO(api);
        console.log('paks', paks);
        console.log('order', order);
        const orderValue = (info) => {
            return order.indexOf(info.uuid) + (info.isListed ? 0 : 1000);
        };
        return paks
            .sort((lhs, rhs) => orderValue(lhs.info) - orderValue(rhs.info))
            .map(({ fileName, mod, info }) => ({
            id: fileName,
            enabled: true,
            name: vortex_api_1.util.renderModName(mod),
            modId: mod === null || mod === void 0 ? void 0 : mod.id,
            locked: info.isListed,
            data: info,
        }));
    });
}
function validate(before, after) {
    return Promise.resolve();
}
let forceRefresh;
function InfoPanelWrap(props) {
    const { api } = props;
    const currentProfile = (0, react_redux_1.useSelector)((state) => { var _a; return (_a = state.settings['baldursgate3']) === null || _a === void 0 ? void 0 : _a.playerProfile; });
    const [gameVersion, setGameVersion] = React.useState();
    React.useEffect(() => {
        forceRefresh = props.refresh;
    }, []);
    React.useEffect(() => {
        (() => __awaiter(this, void 0, void 0, function* () {
            setGameVersion(yield getOwnGameVersion(api.getState()));
        }))();
    }, []);
    const onSetProfile = React.useCallback((profileName) => {
        const impl = () => __awaiter(this, void 0, void 0, function* () {
            api.store.dispatch((0, actions_1.setPlayerProfile)(profileName));
            try {
                yield readStoredLO(api);
            }
            catch (err) {
                api.showErrorNotification('Failed to read load order', err, {
                    message: 'Please run the game before you start modding',
                    allowReport: false,
                });
            }
            forceRefresh === null || forceRefresh === void 0 ? void 0 : forceRefresh();
        });
        impl();
    }, [api]);
    const isLsLibInstalled = React.useCallback(() => {
        return getLatestLSLibMod(api) !== undefined;
    }, [api]);
    const onInstallLSLib = React.useCallback(() => {
        onGameModeActivated(api, common_1.GAME_ID);
    }, [api]);
    if (!gameVersion) {
        return null;
    }
    return (React.createElement(InfoPanel, { t: api.translate, gameVersion: gameVersion, currentProfile: currentProfile, onSetPlayerProfile: onSetProfile, isLsLibInstalled: isLsLibInstalled, onInstallLSLib: onInstallLSLib }));
}
function getLatestInstalledLSLibVer(api) {
    const state = api.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    return Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const arcId = mods[id].archiveId;
            const dl = vortex_api_1.util.getSafe(state, ['persistent', 'downloads', 'files', arcId], undefined);
            const storedVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(storedVer, prev)) {
                    prev = storedVer;
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
            }
            if (dl !== undefined) {
                const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
                const idx = fileName.indexOf('-v');
                try {
                    const ver = semver.coerce(fileName.slice(idx + 2)).version;
                    if (semver.valid(ver) && ver !== storedVer) {
                        api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', ver));
                        prev = ver;
                    }
                }
                catch (err) {
                    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', '1.0.0'));
                    prev = '1.0.0';
                }
            }
        }
        return prev;
    }, '0.0.0');
}
function onCheckModVersion(api, gameId, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = vortex_api_1.selectors.activeProfile(api.getState());
        if (profile.gameId !== common_1.GAME_ID || gameId !== common_1.GAME_ID) {
            return;
        }
        const latestVer = getLatestInstalledLSLibVer(api);
        if (latestVer === '0.0.0') {
            return;
        }
        const newestVer = yield gitHubDownloader.checkForUpdates(api, latestVer);
        if (!newestVer || newestVer === latestVer) {
            return;
        }
    });
}
function nop() {
}
function onGameModeActivated(api, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID) {
            return;
        }
        try {
            yield (0, migrations_1.migrate)(api);
        }
        catch (err) {
            api.showErrorNotification('Failed to migrate', err, {
                allowReport: false,
            });
        }
        try {
            yield readStoredLO(api);
        }
        catch (err) {
            api.showErrorNotification('Failed to read load order', err, {
                message: 'Please run the game before you start modding',
                allowReport: false,
            });
        }
        const latestVer = getLatestInstalledLSLibVer(api);
        if (latestVer === '0.0.0') {
            yield gitHubDownloader.downloadDivine(api);
        }
    });
}
function testModFixer(files, gameId) {
    const notSupported = { supported: false, requiredFiles: [] };
    if (gameId !== common_1.GAME_ID) {
        return bluebird_1.default.resolve(notSupported);
    }
    const lowered = files.map(file => file.toLowerCase());
    const hasModFixerPak = lowered.find(file => path.basename(file) === 'modfixer.pak') !== undefined;
    if (!hasModFixerPak) {
        return bluebird_1.default.resolve(notSupported);
    }
    return bluebird_1.default.resolve({
        supported: true,
        requiredFiles: []
    });
}
function testEngineInjector(files, gameId) {
    const notSupported = { supported: false, requiredFiles: [] };
    if (gameId !== common_1.GAME_ID) {
        return bluebird_1.default.resolve(notSupported);
    }
    const lowered = files.map(file => file.toLowerCase());
    const hasBinFolder = lowered.find(file => file.indexOf('bin' + path.sep) !== -1) !== undefined;
    if (!hasBinFolder) {
        return bluebird_1.default.resolve(notSupported);
    }
    return bluebird_1.default.resolve({
        supported: true,
        requiredFiles: []
    });
}
function installBG3SE(files, destinationPath, gameId, progressDelegate) {
    console.log('installBG3SE files:', files);
    files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
    files = files.filter(f => path.extname(f) === '.dll');
    const instructions = files.reduce((accum, filePath) => {
        accum.push({
            type: 'copy',
            source: filePath,
            destination: path.basename(filePath),
        });
        return accum;
    }, []);
    console.log('installBG3SE instructions:', instructions);
    return bluebird_1.default.resolve({ instructions });
}
function installModFixer(files, destinationPath, gameId, progressDelegate) {
    console.log('installModFixer files:', files);
    files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
    files = files.filter(f => path.extname(f) === '.pak');
    const modFixerAttribute = { type: 'attribute', key: 'modFixer', value: true };
    const instructions = files.reduce((accum, filePath) => {
        accum.push({
            type: 'copy',
            source: filePath,
            destination: path.basename(filePath),
        });
        return accum;
    }, [modFixerAttribute]);
    console.log('installModFixer instructions:', instructions);
    return bluebird_1.default.resolve({ instructions });
}
function installEngineInjector(files, destinationPath, gameId, progressDelegate) {
    console.log('installEngineInjector files:', files);
    files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
    const modtypeAttr = { type: 'setmodtype', value: 'dinput' };
    const instructions = files.reduce((accum, filePath) => {
        const binIndex = filePath.toLowerCase().indexOf('bin' + path.sep);
        if (binIndex !== -1) {
            console.log(filePath.substring(binIndex));
            accum.push({
                type: 'copy',
                source: filePath,
                destination: filePath.substring(binIndex),
            });
        }
        return accum;
    }, [modtypeAttr]);
    console.log('installEngineInjector instructions:', instructions);
    return bluebird_1.default.resolve({ instructions });
}
function main(context) {
    context.registerReducer(['settings', 'baldursgate3'], reducers_1.default);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Baldur\'s Gate 3',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: [
            {
                id: 'exevulkan',
                name: 'Baldur\'s Gate 3 (Vulkan)',
                executable: () => 'bin/bg3.exe',
                requiredFiles: [
                    'bin/bg3.exe',
                ],
                relative: true,
            },
        ],
        queryModPath: modsPath,
        logo: 'gameart.jpg',
        executable: () => 'bin/bg3_dx11.exe',
        setup: discovery => prepareForModding(context.api, discovery),
        requiredFiles: [
            'bin/bg3_dx11.exe',
        ],
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
            stopPatterns: STOP_PATTERNS.map(toWordExp),
            ignoreConflicts: [
                'info.json',
            ],
            ignoreDeploy: [
                'info.json',
            ],
        },
    });
    context.registerAction('mod-icons', 300, 'settings', {}, 'Re-install LSLib/Divine', () => {
        const state = context.api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const lslibs = Object.keys(mods).filter(mod => mods[mod].type === 'bg3-lslib-divine-tool');
        context.api.events.emit('remove-mods', common_1.GAME_ID, lslibs, (err) => {
            if (err !== null) {
                context.api.showErrorNotification('Failed to reinstall lslib', 'Please re-install manually', { allowReport: false });
                return;
            }
            gitHubDownloader.downloadDivine(context.api);
        });
    }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return gameMode === common_1.GAME_ID;
    });
    context.registerInstaller('bg3-lslib-divine-tool', 15, testLSLib, installLSLib);
    context.registerInstaller('bg3-bg3se', 15, testBG3SE, installBG3SE);
    context.registerInstaller('bg3-engine-injector', 20, testEngineInjector, installEngineInjector);
    context.registerInstaller('bg3-replacer', 25, testReplacer, installReplacer);
    context.registerInstaller('bg3-modfixer', 25, testModFixer, installModFixer);
    context.registerModType('bg3-lslib-divine-tool', 15, (gameId) => gameId === common_1.GAME_ID, () => undefined, instructions => isLSLib(context.api, instructions), { name: 'BG3 LSLib' });
    context.registerModType('bg3-bg3se', 15, (gameId) => gameId === common_1.GAME_ID, () => path.join(getGamePath(context.api), 'bin'), instructions => isBG3SE(context.api, instructions), { name: 'BG3 BG3SE' });
    context.registerModType('bg3-replacer', 25, (gameId) => gameId === common_1.GAME_ID, () => getGameDataPath(context.api), instructions => isReplacer(context.api, instructions), { name: 'BG3 Replacer' });
    context.registerModType('bg3-loose', 20, (gameId) => gameId === common_1.GAME_ID, () => getGameDataPath(context.api), instructions => isLoose(context.api, instructions), { name: 'BG3 Loose' });
    context.registerLoadOrder({
        gameId: common_1.GAME_ID,
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: (loadOrder, prev) => (0, loadOrder_1.serialize)(context, loadOrder),
        validate,
        toggleableEntries: false,
        usageInstructions: (() => (React.createElement(InfoPanelWrap, { api: context.api, refresh: nop }))),
    });
    context.registerAction('fb-load-order-icons', 150, 'changelog', {}, 'Export to Game', () => { (0, loadOrder_1.exportToGame)(context.api); }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerAction('fb-load-order-icons', 151, 'changelog', {}, 'Export to File...', () => { (0, loadOrder_1.exportToFile)(context.api); }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerAction('fb-load-order-icons', 160, 'import', {}, 'Import from Game', () => { (0, loadOrder_1.importModSettingsGame)(context.api); }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerAction('fb-load-order-icons', 161, 'import', {}, 'Import from File...', () => {
        (0, loadOrder_1.importModSettingsFile)(context.api);
    }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerSettings('Mods', Settings_1.default, undefined, () => vortex_api_1.selectors.activeGameId(context.api.getState()) === common_1.GAME_ID, 150);
    context.once(() => {
        context.api.onStateChange(['session', 'base', 'toolsRunning'], (prev, current) => __awaiter(this, void 0, void 0, function* () {
            const gameMode = vortex_api_1.selectors.activeGameId(context.api.getState());
            if ((gameMode === common_1.GAME_ID) && (Object.keys(current).length === 0)) {
                try {
                    yield readStoredLO(context.api);
                }
                catch (err) {
                    context.api.showErrorNotification('Failed to read load order', err, {
                        message: 'Please run the game before you start modding',
                        allowReport: false,
                    });
                }
            }
        }));
        context.api.onAsync('did-deploy', (profileId, deployment) => {
            const profile = vortex_api_1.selectors.profileById(context.api.getState(), profileId);
            if (((profile === null || profile === void 0 ? void 0 : profile.gameId) === common_1.GAME_ID) && (forceRefresh !== undefined)) {
                forceRefresh();
            }
            return Promise.resolve();
        });
        context.api.events.on('check-mods-version', (gameId, mods) => onCheckModVersion(context.api, gameId, mods));
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () { return onGameModeActivated(context.api, gameMode); }));
    });
    return true;
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxpREFBc0M7QUFDdEMsOERBQXFDO0FBRXJDLDJDQUE2QjtBQUM3Qiw2Q0FBK0I7QUFDL0IscURBQXFEO0FBQ3JELDZDQUEwQztBQUUxQywrQ0FBaUM7QUFDakMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6QywyQ0FBK0U7QUFDL0UsbUNBQXFEO0FBR3JELHFDQUF3RztBQUN4RyxxRUFBdUQ7QUFJdkQsMkNBQTRJO0FBQzVJLDBEQUFrQztBQUNsQyx1Q0FBOEQ7QUFDOUQsMERBQWlDO0FBQ2pDLDZDQUFrRDtBQUVsRCxNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXZDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFFM0IsU0FBUyxTQUFTLENBQUMsS0FBSztJQUN0QixPQUFPLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLGFBQWE7SUFDcEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxZQUFZO0lBQ25CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxTQUFTLGlCQUFpQjtJQUN4QixPQUFPLElBQUksQ0FBQyxJQUFJLENB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RSxDQUFDLG9CQUFvQixFQUN4QyxDQUFPLFFBQWdCLEVBQUUsRUFBRSxnREFBQyxPQUFBLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBBbGVydCwgRm9ybUNvbnRyb2wgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgeyBjcmVhdGVBY3Rpb24gfSBmcm9tICdyZWR1eC1hY3QnO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBnZW5lcmF0ZSBhcyBzaG9ydGlkIH0gZnJvbSAnc2hvcnRpZCc7XG5pbXBvcnQgd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0b29sdGlwLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgQnVpbGRlciwgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcbmltcG9ydCB7IERpdmluZUFjdGlvbiwgSURpdmluZU9wdGlvbnMsIElEaXZpbmVPdXRwdXQsIElNb2ROb2RlLCBJTW9kU2V0dGluZ3MsIElQYWtJbmZvLCBJWG1sTm9kZSB9IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgeyBERUZBVUxUX01PRF9TRVRUSU5HUywgR0FNRV9JRCwgSU5WQUxJRF9MT19NT0RfVFlQRVMsIExPX0ZJTEVfTkFNRSwgTFNMSUJfVVJMIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xuaW1wb3J0IHsgSU1vZCwgSU1vZFRhYmxlIH0gZnJvbSAndm9ydGV4LWFwaS9saWIvdHlwZXMvSVN0YXRlJztcbmltcG9ydCB7IHJlaW50ZXJwcmV0VW50aWxaZXJvcyB9IGZyb20gJ3JlZic7XG5pbXBvcnQgeyBlbnN1cmVGaWxlQXN5bmMgfSBmcm9tICd2b3J0ZXgtYXBpL2xpYi91dGlsL2ZzJztcbmltcG9ydCB7IGRlc2VyaWFsaXplLCBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUsIGltcG9ydE1vZFNldHRpbmdzR2FtZSwgc2VyaWFsaXplLCBleHBvcnRUb0dhbWUsIGV4cG9ydFRvRmlsZSwgZGVlcFJlZnJlc2ggfSBmcm9tICcuL2xvYWRPcmRlcic7XG5pbXBvcnQgU2V0dGluZ3MgZnJvbSAnLi9TZXR0aW5ncyc7XG5pbXBvcnQgeyBzZXRQbGF5ZXJQcm9maWxlLCBzZXR0aW5nc1dyaXR0ZW4gfSBmcm9tICcuL2FjdGlvbnMnO1xuaW1wb3J0IHJlZHVjZXIgZnJvbSAnLi9yZWR1Y2Vycyc7XG5pbXBvcnQgeyBtaWdyYXRlLCBtaWdyYXRlMTMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuXG5jb25zdCBTVE9QX1BBVFRFUk5TID0gWydbXi9dKlxcXFwucGFrJCddO1xuXG5jb25zdCBHT0dfSUQgPSAnMTQ1NjQ2MDY2OSc7XG5jb25zdCBTVEVBTV9JRCA9ICcxMDg2OTQwJztcblxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XG4gIHJldHVybiAnKF58LyknICsgaW5wdXQgKyAnKC98JCknO1xufVxuXG5mdW5jdGlvbiBkb2N1bWVudHNQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnbG9jYWxBcHBEYXRhJyksICdMYXJpYW4gU3R1ZGlvcycsICdCYWxkdXJcXCdzIEdhdGUgMycpO1xufVxuXG5mdW5jdGlvbiBtb2RzUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdNb2RzJyk7XG59XG5cbmZ1bmN0aW9uIHByb2ZpbGVzUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdQbGF5ZXJQcm9maWxlcycpO1xufVxuXG5mdW5jdGlvbiBnbG9iYWxQcm9maWxlUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdnbG9iYWwnKTtcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKTogYW55IHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtHT0dfSUQsIFNURUFNX0lEXSlcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVHbG9iYWxQcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGgpIHtcbiAgICBjb25zdCBwcm9maWxlUGF0aCA9IGdsb2JhbFByb2ZpbGVQYXRoKCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocHJvZmlsZVBhdGgpO1xuICAgICAgY29uc3QgbW9kU2V0dGluZ3NGaWxlUGF0aCA9IHBhdGguam9pbihwcm9maWxlUGF0aCwgJ21vZHNldHRpbmdzLmxzeCcpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgsIERFRkFVTFRfTU9EX1NFVFRJTkdTLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpOiBhbnkge1xuXG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTsgIFxuXG4gIGNoZWNrRm9yU2NyaXB0RXh0ZW5kZXIoYXBpKTtcbiAgc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGkpOyBcbiAgXG4gIGNvbnNvbGUubG9nKGBjdXJyZW50IGV4dGVuc2lvbiB2ZXJzaW9uID0gYClcblxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgaWQ6ICdiZzMtdXNlcy1sc2xpYicsXG4gICAgdHlwZTogJ2luZm8nLFxuICAgIHRpdGxlOiAnQkczIHN1cHBvcnQgdXNlcyBMU0xpYicsXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcbiAgICBdLFxuICB9KTtcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcbiAgICAuY2F0Y2goKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtcCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpIGFzIGFueSkpXG4gICAgLmZpbmFsbHkoKCkgPT4gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGksIGRpc2NvdmVyeSkpO1xufVxuXG5mdW5jdGlvbiBjaGVja0ZvclNjcmlwdEV4dGVuZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuXG4gIC8vXG59XG5cbmZ1bmN0aW9uIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG5cbiAgLy8gY2hlY2sgdG8gc2VlIGlmIG1vZCBpcyBpbnN0YWxsZWQgZmlyc3Q/XG4gIC8vb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKGFwaS5zdG9yZS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsICdiYWxkdXJzZ2F0ZTMnXSwgdW5kZWZpbmVkKTtcblxuICBjb25zdCBtb2RzID0gYXBpLnN0b3JlLmdldFN0YXRlKCkucGVyc2lzdGVudD8ubW9kcz8uYmFsZHVyc2dhdGUzO1xuICBjb25zb2xlLmxvZygnbW9kcycsIG1vZHMpO1xuXG4gIGlmKG1vZHMgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgY29uc3QgbW9kQXJyYXk6IHR5cGVzLklNb2RbXSA9IG1vZHMgPyBPYmplY3QudmFsdWVzKG1vZHMpIDogW107ICAgIFxuICAgIGNvbnNvbGUubG9nKCdtb2RBcnJheScsIG1vZEFycmF5KTtcbiAgXG4gICAgY29uc3QgbW9kRml4ZXJJbnN0YWxsZWQ6Ym9vbGVhbiA9ICBtb2RBcnJheS5maWx0ZXIobW9kID0+ICEhbW9kPy5hdHRyaWJ1dGVzPy5tb2RGaXhlcikubGVuZ3RoICE9IDA7ICBcbiAgICBjb25zb2xlLmxvZygnbW9kRml4ZXJJbnN0YWxsZWQnLCBtb2RGaXhlckluc3RhbGxlZCk7XG5cbiAgICAvLyBpZiB3ZSd2ZSBmb3VuZCBhbiBpbnN0YWxsZWQgbW9kZml4ZXIsIHRoZW4gZG9uJ3QgYm90aGVyIHNob3dpbmcgbm90aWZpY2F0aW9uIFxuICAgIGlmKG1vZEZpeGVySW5zdGFsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gbm8gbW9kcyBmb3VuZFxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgIHRpdGxlOiAnUmVjb21tZW5kZWQgTW9kJyxcbiAgICBtZXNzYWdlOiAnTW9zdCBtb2RzIHJlcXVpcmUgdGhpcyBtb2QuJyxcbiAgICBpZDogJ2JnMy1yZWNvbW1lbmRlZC1tb2QnLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAge1xuICAgICAgICB0aXRsZTogJ01vcmUnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdSZWNvbW1lbmRlZCBNb2RzJywge1xuICAgICAgICAgICAgdGV4dDpcbiAgICAgICAgICAgICAgJ1dlIHJlY29tbWVuZCBpbnN0YWxsaW5nIFwiQmFsZHVyXFwncyBHYXRlIDMgTW9kIEZpeGVyXCIgdG8gYmUgYWJsZSB0byBtb2QgQmFsZHVyXFwncyBHYXRlIDMuXFxuXFxuJyArIFxuICAgICAgICAgICAgICAnVGhpcyBjYW4gYmUgZG93bmxvYWRlZCBmcm9tIE5leHVzIE1vZHMgYW5kIGluc3RhbGxlZCB1c2luZyBWb3J0ZXggYnkgcHJlc3NpbmcgXCJPcGVuIE5leHVzIE1vZHMnXG4gICAgICAgICAgfSwgW1xuICAgICAgICAgICAgeyBsYWJlbDogJ0Rpc21pc3MnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnT3BlbiBOZXh1cyBNb2RzJywgZGVmYXVsdDogdHJ1ZSB9LFxuICAgICAgICAgIF0pXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnT3BlbiBOZXh1cyBNb2RzJykge1xuICAgICAgICAgICAgICAgIHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL2JhbGR1cnNnYXRlMy9tb2RzLzE0MT90YWI9ZGVzY3JpcHRpb24nKS5jYXRjaCgoKSA9PiBudWxsKVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgLy8gZGlzbWlzcyBhbnl3YXlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRHYW1lUGF0aChhcGkpOiBzdHJpbmcge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICByZXR1cm4gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZD8uW0dBTUVfSURdPy5wYXRoIGFzIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0R2FtZURhdGFQYXRoKGFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICBjb25zdCBnYW1lUGF0aCA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aDtcbiAgaWYgKGdhbWVQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKGdhbWVQYXRoLCAnRGF0YScpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuY29uc3QgT1JJR0lOQUxfRklMRVMgPSBuZXcgU2V0KFtcbiAgJ2Fzc2V0cy5wYWsnLFxuICAnYXNzZXRzLnBhaycsXG4gICdlZmZlY3RzLnBhaycsXG4gICdlbmdpbmUucGFrJyxcbiAgJ2VuZ2luZXNoYWRlcnMucGFrJyxcbiAgJ2dhbWUucGFrJyxcbiAgJ2dhbWVwbGF0Zm9ybS5wYWsnLFxuICAnZ3VzdGF2LnBhaycsXG4gICdndXN0YXZfdGV4dHVyZXMucGFrJyxcbiAgJ2ljb25zLnBhaycsXG4gICdsb3d0ZXgucGFrJyxcbiAgJ21hdGVyaWFscy5wYWsnLFxuICAnbWluaW1hcHMucGFrJyxcbiAgJ21vZGVscy5wYWsnLFxuICAnc2hhcmVkLnBhaycsXG4gICdzaGFyZWRzb3VuZGJhbmtzLnBhaycsXG4gICdzaGFyZWRzb3VuZHMucGFrJyxcbiAgJ3RleHR1cmVzLnBhaycsXG4gICd2aXJ0dWFsdGV4dHVyZXMucGFrJyxcbl0pO1xuXG5jb25zdCBMU0xJQl9GSUxFUyA9IG5ldyBTZXQoW1xuICAnZGl2aW5lLmV4ZScsXG4gICdsc2xpYi5kbGwnLFxuXSk7XG5cbmZ1bmN0aW9uIGlzTFNMaWIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIExTTElCX0ZJTEVTLmhhcyhwYXRoLmJhc2VuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkpKTtcbiAgcmV0dXJuIG9yaWdGaWxlICE9PSB1bmRlZmluZWRcbiAgICA/IEJsdWViaXJkLnJlc29sdmUodHJ1ZSlcbiAgICA6IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpO1xufVxuXG5cbmZ1bmN0aW9uIGlzQkczU0UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIChwYXRoLmJhc2VuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkgPT09ICdkd3JpdGUuZGxsJykpO1xuICByZXR1cm4gb3JpZ0ZpbGUgIT09IHVuZGVmaW5lZFxuICAgID8gQmx1ZWJpcmQucmVzb2x2ZSh0cnVlKVxuICAgIDogQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHRlc3RMU0xpYihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuICBjb25zdCBtYXRjaGVkRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKSk7XG5cbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xuICAgIHN1cHBvcnRlZDogbWF0Y2hlZEZpbGVzLmxlbmd0aCA+PSAyLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gdGVzdEJHM1NFKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XG4gIFxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuXG4gIGNvbnN0IGhhc0RXcml0ZURsbCA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICdkd3JpdGUuZGxsJykgIT09IHVuZGVmaW5lZDtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkOiBoYXNEV3JpdGVEbGwsXG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsTFNMaWIoZmlsZXM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIGNvbnN0IGV4ZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUudG9Mb3dlckNhc2UoKSkgPT09ICdkaXZpbmUuZXhlJyk7XG4gIGNvbnN0IGV4ZVBhdGggPSBwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBleGUpO1xuICBsZXQgdmVyOiBzdHJpbmcgPSBhd2FpdCBnZXRWZXJzaW9uKGV4ZVBhdGgpO1xuICB2ZXIgPSB2ZXIuc3BsaXQoJy4nKS5zbGljZSgwLCAzKS5qb2luKCcuJyk7XG5cbiAgLy8gVW5mb3J0dW5hdGVseSB0aGUgTFNMaWIgZGV2ZWxvcGVyIGlzIG5vdCBjb25zaXN0ZW50IHdoZW4gY2hhbmdpbmdcbiAgLy8gIGZpbGUgdmVyc2lvbnMgLSB0aGUgZXhlY3V0YWJsZSBhdHRyaWJ1dGUgbWlnaHQgaGF2ZSBhbiBvbGRlciB2ZXJzaW9uXG4gIC8vICB2YWx1ZSB0aGFuIHRoZSBvbmUgc3BlY2lmaWVkIGJ5IHRoZSBmaWxlbmFtZSAtIHdlJ3JlIGdvaW5nIHRvIHVzZVxuICAvLyAgdGhlIGZpbGVuYW1lIGFzIHRoZSBwb2ludCBvZiB0cnV0aCAqdWdoKlxuICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGVzdGluYXRpb25QYXRoLCBwYXRoLmV4dG5hbWUoZGVzdGluYXRpb25QYXRoKSk7XG4gIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XG4gIGNvbnN0IGZpbGVOYW1lVmVyID0gZmlsZU5hbWUuc2xpY2UoaWR4ICsgMik7XG4gIGlmIChzZW12ZXIudmFsaWQoZmlsZU5hbWVWZXIpICYmIHZlciAhPT0gZmlsZU5hbWVWZXIpIHtcbiAgICB2ZXIgPSBmaWxlTmFtZVZlcjtcbiAgfVxuICBjb25zdCB2ZXJzaW9uQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnYXR0cmlidXRlJywga2V5OiAndmVyc2lvbicsIHZhbHVlOiB2ZXIgfTtcbiAgY29uc3QgbW9kdHlwZUF0dHI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ3NldG1vZHR5cGUnLCB2YWx1ZTogJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcgfTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9XG4gICAgZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChmaWxlUGF0aC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAuc3BsaXQocGF0aC5zZXApXG4gICAgICAgICAgICAgICAgICAuaW5kZXhPZigndG9vbHMnKSAhPT0gLTFcbiAgICAgICYmICFmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcbiAgICAgICAgYWNjdW0ucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbigndG9vbHMnLCBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFsgbW9kdHlwZUF0dHIsIHZlcnNpb25BdHRyIF0pO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufVxuXG5mdW5jdGlvbiBpc0VuZ2luZUluamVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xuICAgIFxuICBjb25zb2xlLmxvZygnaXNFbmdpbmVJbmplY3RvciBpbnN0cnVjdGlvbnM6JywgaW5zdHJ1Y3Rpb25zKTtcblxuICBpZiAoaW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdCA9PiBpbnN0LmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYmluJykgPT09IDApKSB7IC8vIGlmIHRoaXMgc3RhcnRzIGluIGEgYmluIGZvbGRlcj9cblxuICAgIFxuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnQ29uZmlybSBtb2QgaW5zdGFsbGF0aW9uJywge1xuICAgICAgdGV4dDogJ1RoZSBtb2QgeW91XFwncmUgYWJvdXQgdG8gaW5zdGFsbCBjb250YWlucyBkbGwgZmlsZXMgdGhhdCB3aWxsIHJ1biB3aXRoIHRoZSAnICtcbiAgICAgICAgJ2dhbWUsIGhhdmUgdGhlIHNhbWUgYWNjZXNzIHRvIHlvdXIgc3lzdGVtIGFuZCBjYW4gdGh1cyBjYXVzZSBjb25zaWRlcmFibGUgJyArXG4gICAgICAgICdkYW1hZ2Ugb3IgaW5mZWN0IHlvdXIgc3lzdGVtIHdpdGggYSB2aXJ1cyBpZiBpdFxcJ3MgbWFsaWNpb3VzLlxcbicgK1xuICAgICAgICAnUGxlYXNlIGluc3RhbGwgdGhpcyBtb2Qgb25seSBpZiB5b3UgcmVjZWl2ZWQgaXQgZnJvbSBhIHRydXN0d29ydGh5IHNvdXJjZSAnICtcbiAgICAgICAgJ2FuZCBpZiB5b3UgaGF2ZSBhIHZpcnVzIHNjYW5uZXIgYWN0aXZlIHJpZ2h0IG5vdy4nLFxuICAgIH0sIFtcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXG4gICAgICB7IGxhYmVsOiAnQ29udGludWUnLCBkZWZhdWx0OiB0cnVlICB9LFxuICAgIF0pLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5hY3Rpb24gPT09ICdDb250aW51ZScpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0xvb3NlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSk6IEJsdWViaXJkPGJvb2xlYW4+IHsgXG5cbiAgLy8gb25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zXG4gIGNvbnN0IGNvcHlJbnN0cnVjdGlvbnMgPSBpbnN0cnVjdGlvbnMuZmlsdGVyKGluc3RyID0+IGluc3RyLnR5cGUgPT09ICdjb3B5Jyk7XG5cbiAgLy8gZG8gd2UgaGF2ZSBhIGRhdGEgZm9sZGVyPyBcbiAgY29uc3QgaGFzRGF0YUZvbGRlcjpib29sZWFuID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XG4gICAgaW5zdHIuc291cmNlLmluZGV4T2YoJ0RhdGEnICsgcGF0aC5zZXApICE9PSAtMSkgIT09IHVuZGVmaW5lZDtcblxuICAvLyBkbyB3ZSBoYXZlIGEgcHVibGljIG9yIGdlbmVyYXRlZCBmb2xkZXI/XG4gIGNvbnN0IGhhc0dlbk9yUHVibGljRm9sZGVyOmJvb2xlYW4gPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cbiAgICBpbnN0ci5zb3VyY2UuaW5kZXhPZignR2VuZXJhdGVkJyArIHBhdGguc2VwKSAhPT0gLTEgfHwgXG4gICAgaW5zdHIuc291cmNlLmluZGV4T2YoJ1B1YmxpYycgKyBwYXRoLnNlcCkgIT09IC0xXG4gICAgKSAhPT0gdW5kZWZpbmVkO1xuXG4gIGNvbnNvbGUubG9nKCdpc0xvb3NlJywgeyBpbnN0cnVjdGlvbnM6IGluc3RydWN0aW9ucywgaGFzRGF0YUZvbGRlcjogaGFzRGF0YUZvbGRlciB8fCBoYXNHZW5PclB1YmxpY0ZvbGRlciB9KTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShoYXNEYXRhRm9sZGVyIHx8IGhhc0dlbk9yUHVibGljRm9sZGVyKTtcbn1cblxuZnVuY3Rpb24gaXNSZXBsYWNlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSk6IEJsdWViaXJkPGJvb2xlYW4+IHtcblxuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xuXG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpKTtcblxuICBjb25zb2xlLmxvZygnaXNSZXBsYWNlcicsICB7b3JpZ0ZpbGU6IG9yaWdGaWxlLCBwYWtzOiBwYWtzfSk7XG5cbiAgLy9pZiAoKG9yaWdGaWxlICE9PSB1bmRlZmluZWQpIHx8IChwYWtzLmxlbmd0aCA9PT0gMCkpIHtcbiAgaWYgKChvcmlnRmlsZSAhPT0gdW5kZWZpbmVkKSkge1xuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIGxvb2tzIGxpa2UgYSByZXBsYWNlcicsIHtcbiAgICAgIGJiY29kZTogJ1RoZSBtb2QgeW91IGp1c3QgaW5zdGFsbGVkIGxvb2tzIGxpa2UgYSBcInJlcGxhY2VyXCIsIG1lYW5pbmcgaXQgaXMgaW50ZW5kZWQgdG8gcmVwbGFjZSAnXG4gICAgICAgICAgKyAnb25lIG9mIHRoZSBmaWxlcyBzaGlwcGVkIHdpdGggdGhlIGdhbWUuPGJyLz4nXG4gICAgICAgICAgKyAnWW91IHNob3VsZCBiZSBhd2FyZSB0aGF0IHN1Y2ggYSByZXBsYWNlciBpbmNsdWRlcyBhIGNvcHkgb2Ygc29tZSBnYW1lIGRhdGEgZnJvbSBhICdcbiAgICAgICAgICArICdzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBnYW1lIGFuZCBtYXkgdGhlcmVmb3JlIGJyZWFrIGFzIHNvb24gYXMgdGhlIGdhbWUgZ2V0cyB1cGRhdGVkLjxici8+J1xuICAgICAgICAgICsgJ0V2ZW4gaWYgZG9lc25cXCd0IGJyZWFrLCBpdCBtYXkgcmV2ZXJ0IGJ1Z2ZpeGVzIHRoYXQgdGhlIGdhbWUgJ1xuICAgICAgICAgICsgJ2RldmVsb3BlcnMgaGF2ZSBtYWRlLjxici8+PGJyLz4nXG4gICAgICAgICAgKyAnVGhlcmVmb3JlIFtjb2xvcj1cInJlZFwiXXBsZWFzZSB0YWtlIGV4dHJhIGNhcmUgdG8ga2VlcCB0aGlzIG1vZCB1cGRhdGVkWy9jb2xvcl0gYW5kIHJlbW92ZSBpdCB3aGVuIGl0ICdcbiAgICAgICAgICArICdubyBsb25nZXIgbWF0Y2hlcyB0aGUgZ2FtZSB2ZXJzaW9uLicsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgTW9kICh3aWxsIGxpa2VseSBub3Qgd29yayknIH0sXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBSZXBsYWNlcicsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICBdKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuYWN0aW9uID09PSAnSW5zdGFsbCBhcyBSZXBsYWNlcicpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IEJsdWViaXJkPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XG4gIH1cbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcbiAgICBzdXBwb3J0ZWQ6IHBha3MubGVuZ3RoID09PSAwLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuXG5cbmZ1bmN0aW9uIGluc3RhbGxSZXBsYWNlcihmaWxlczogc3RyaW5nW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IEJsdWViaXJkPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGZpbGVzLm1hcChmaWxlID0+IHBhdGguZGlybmFtZShmaWxlKS50b1VwcGVyQ2FzZSgpKSkpO1xuICBsZXQgZGF0YVBhdGg6IHN0cmluZyA9IGRpcmVjdG9yaWVzLmZpbmQoZGlyID0+IHBhdGguYmFzZW5hbWUoZGlyKSA9PT0gJ0RBVEEnKTtcbiAgaWYgKGRhdGFQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBnZW5PclB1YmxpYyA9IGRpcmVjdG9yaWVzXG4gICAgICAuZmluZChkaXIgPT4gWydQVUJMSUMnLCAnR0VORVJBVEVEJ10uaW5jbHVkZXMocGF0aC5iYXNlbmFtZShkaXIpKSk7XG4gICAgaWYgKGdlbk9yUHVibGljICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRhdGFQYXRoID0gcGF0aC5kaXJuYW1lKGdlbk9yUHVibGljKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gKGRhdGFQYXRoICE9PSB1bmRlZmluZWQpXG4gICAgPyBmaWxlcy5yZWR1Y2UoKHByZXY6IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKSB7XG4gICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgfVxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGF0YVBhdGgsIGZpbGVQYXRoKTtcbiAgICAgIGlmICghcmVsUGF0aC5zdGFydHNXaXRoKCcuLicpKSB7XG4gICAgICAgIHByZXYucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgZGVzdGluYXRpb246IHJlbFBhdGgsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfSwgW10pXG4gICAgOiBmaWxlcy5tYXAoKGZpbGVQYXRoOiBzdHJpbmcpOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPT4gKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGgsXG4gICAgICB9KSk7XG5cbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xuICAgIGluc3RydWN0aW9ucyxcbiAgfSk7XG59XG5cbmNvbnN0IGdldFBsYXllclByb2ZpbGVzID0gKCgpID0+IHtcbiAgbGV0IGNhY2hlZCA9IFtdO1xuICB0cnkge1xuICAgIGNhY2hlZCA9IChmcyBhcyBhbnkpLnJlYWRkaXJTeW5jKHByb2ZpbGVzUGF0aCgpKVxuICAgICAgICAuZmlsdGVyKG5hbWUgPT4gKHBhdGguZXh0bmFtZShuYW1lKSA9PT0gJycpICYmIChuYW1lICE9PSAnRGVmYXVsdCcpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gKCkgPT4gY2FjaGVkO1xufSkoKTtcblxuZnVuY3Rpb24gZ2FtZVN1cHBvcnRzUHJvZmlsZShnYW1lVmVyc2lvbjogc3RyaW5nKSB7XG4gIHJldHVybiBzZW12ZXIubHQoc2VtdmVyLmNvZXJjZShnYW1lVmVyc2lvbiksICc0LjEuMjA2Jyk7XG59XG5cbmZ1bmN0aW9uIEluZm9QYW5lbChwcm9wcykge1xuICBjb25zdCB7IHQsIGdhbWVWZXJzaW9uLCBvbkluc3RhbGxMU0xpYixcbiAgICAgICAgICBvblNldFBsYXllclByb2ZpbGUsIGlzTHNMaWJJbnN0YWxsZWQgfSA9IHByb3BzO1xuXG4gIGNvbnN0IHN1cHBvcnRzUHJvZmlsZXMgPSBnYW1lU3VwcG9ydHNQcm9maWxlKGdhbWVWZXJzaW9uKTtcbiAgY29uc3QgY3VycmVudFByb2ZpbGUgPSBzdXBwb3J0c1Byb2ZpbGVzID8gcHJvcHMuY3VycmVudFByb2ZpbGUgOiAnUHVibGljJztcblxuICBjb25zdCBvblNlbGVjdCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldikgPT4ge1xuICAgIG9uU2V0UGxheWVyUHJvZmlsZShldi5jdXJyZW50VGFyZ2V0LnZhbHVlKTtcbiAgfSwgW29uU2V0UGxheWVyUHJvZmlsZV0pO1xuXG4gIHJldHVybiBpc0xzTGliSW5zdGFsbGVkKCkgPyAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICcxMnB4JywgbWFyZ2luUmlnaHQ6ICcxNnB4JyB9fT4gICAgICBcbiAgICAgIDxBbGVydCBic1N0eWxlPSd3YXJuaW5nJyBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc4cHgnIH19PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoYFZlcnNpb24gMC4zIG9mIHRoZSBleHRlbnNpb24gaXMgYWxtb3N0IGEgY29tcGxldGUgcmV3cml0ZSBvZiBsb2FkIG9yZGVyIGFuZCBtaWdyYXRpb24gZnJvbSBwcmV2aW91cyB2ZXJzaW9ucyBtYXkgY2F1c2UgaXNzdWVzLlxuICAgICAgICBBIFB1cmdlIHRoZW4gYSBEZXBsb3kgd2lsbCBub3JtYWxseSBzb2x2ZSBhbGwgaXNzdWVzIGJ1dCBwbGVhc2UgbWFrZSBhIGJhY2t1cCBmaXJzdCB1c2luZyBFeHBvcnQuLi4gYXMgdGhlIGxvYWQgb3JkZXIgd2lsbCBiZSByZXNldC5gKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBBIGJhY2t1cCBpcyBtYWRlIG9mIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MubHN4IGZpbGUgYmVmb3JlIGFueXRoaW5nIGlzIGNoYW5nZWQuXG4gICAgICAgIFRoaXMgY2FuIGJlIGZvdW5kIGF0ICVBUFBEQVRBJVxcXFxMb2NhbFxcXFxMYXJpYW4gU3R1ZGlvc1xcXFxCYWxkdXIncyBHYXRlIDNcXFxcUGxheWVyUHJvZmlsZXNcXFxcUHVibGljXFxcXG1vZHNldHRpbmdzLmxzeC5iYWNrdXBgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L0FsZXJ0PiAgICBcbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBEcmFnIGFuZCBEcm9wIFBBSyBmaWxlcyB0byByZW9yZGVyIGhvdyB0aGUgZ2FtZSBsb2FkcyB0aGVtLiBQbGVhc2Ugbm90ZSwgc29tZSBtb2RzIGNvbnRhaW4gbXVsdGlwbGUgUEFLIGZpbGVzLmApfVxuICAgICAgPC9kaXY+ICBcbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBNb2QgZGVzY3JpcHRpb25zIGZyb20gbW9kIGF1dGhvcnMgbWF5IGhhdmUgaW5mb3JtYXRpb24gdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IG9yZGVyLmApfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dChgU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBnYW1lIGFuZCBjYW4gdGhlcmVmb3JlIG5vdCBiZSBsb2FkLW9yZGVyZWQgYnkgbW9kIG1hbmFnZXJzLiBcbiAgICAgICAgSWYgeW91IG5lZWQgdG8gZGlzYWJsZSBzdWNoIGEgbW9kLCBwbGVhc2UgZG8gc28gaW4gVm9ydGV4XFwncyBNb2RzIHBhZ2UuYCl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XG4gICAgICAgIHt0KCdJbXBvcnQgYW5kIEV4cG9ydCcpfVxuICAgICAgPC9oND5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBJbXBvcnQgaXMgYW4gZXhwZXJpbWVudGFsIHRvb2wgdG8gaGVscCBtaWdyYXRpb24gZnJvbSBhIGdhbWUgbG9hZCBvcmRlciAoLmxzeCBmaWxlKSB0byBWb3J0ZXguIEl0IHdvcmtzIGJ5IGltcG9ydGluZyB0aGUgZ2FtZSdzIG1vZHNldHRpbmdzIGZpbGVcbiAgICAgICAgYW5kIGF0dGVtcHRzIHRvIG1hdGNoIHVwIG1vZHMgdGhhdCBoYXZlIGJlZW4gaW5zdGFsbGVkIGJ5IFZvcnRleC5gKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoYEV4cG9ydCBjYW4gYmUgdXNlZCB0byBtYW51YWxseSB1cGRhdGUgdGhlIGdhbWUncyBtb2RzZXR0aW5ncy5sc3ggZmlsZSBpZiAnU2V0dGluZ3MgPiBNb2RzID4gQXV0byBleHBvcnQgbG9hZCBvcmRlcicgaXNuJ3Qgc2V0IHRvIGRvIHRoaXMgYXV0b21hdGljYWxseS4gXG4gICAgICAgIEl0IGNhbiBhbHNvIGJlIHVzZWQgdG8gZXhwb3J0IHRvIGEgZGlmZmVyZW50IGZpbGUgYXMgYSBiYWNrdXAuYCl9XG4gICAgICA8L2Rpdj5cbiAgXG4gICAgPC9kaXY+XG4gICkgOiAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICcxMnB4JyB9fT5cbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XG4gICAgICAgIHt0KCdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyl9XG4gICAgICA8L2g0PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoJ1RvIHRha2UgZnVsbCBhZHZhbnRhZ2Ugb2YgVm9ydGV4XFwncyBCYWxkdXJcXHMgR2F0ZSAzIG1vZGRpbmcgY2FwYWJpbGl0aWVzIHN1Y2ggYXMgbWFuYWdpbmcgdGhlICdcbiAgICAgICAgICsgJ29yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCBpbnRvIHRoZSBnYW1lOyBWb3J0ZXggcmVxdWlyZXMgYSAzcmQgcGFydHkgdG9vbCBjYWxsZWQgTFNMaWIuJyl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCdQbGVhc2UgaW5zdGFsbCB0aGUgbGlicmFyeSB1c2luZyB0aGUgYnV0dG9ucyBiZWxvdyB0byBtYW5hZ2UgeW91ciBsb2FkIG9yZGVyLicpfVxuICAgICAgPC9kaXY+XG4gICAgICAgIDx0b29sdGlwLkJ1dHRvblxuICAgICAgICB0b29sdGlwPXsnSW5zdGFsbCBMU0xpYid9XG4gICAgICAgIG9uQ2xpY2s9e29uSW5zdGFsbExTTGlifVxuICAgICAgPlxuICAgICAgICB7dCgnSW5zdGFsbCBMU0xpYicpfVxuICAgICAgPC90b29sdGlwLkJ1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0T3duR2FtZVZlcnNpb24oc3RhdGU6IHR5cGVzLklTdGF0ZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICByZXR1cm4gYXdhaXQgdXRpbC5nZXRHYW1lKEdBTUVfSUQpLmdldEluc3RhbGxlZFZlcnNpb24oZGlzY292ZXJ5KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgcmV0dXJuIGdhbWVTdXBwb3J0c1Byb2ZpbGUoYXdhaXQgZ2V0T3duR2FtZVZlcnNpb24oYXBpLmdldFN0YXRlKCkpKVxuICAgID8gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlIHx8ICdnbG9iYWwnXG4gICAgOiAnUHVibGljJztcbn1cblxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZUxvYWRPcmRlck9sZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogYW55IH0pIHtcbiAgY29uc3QgYmczcHJvZmlsZTogc3RyaW5nID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xuICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IChiZzNwcm9maWxlID09PSAnZ2xvYmFsJykgPyBnZXRQbGF5ZXJQcm9maWxlcygpIDogW2JnM3Byb2ZpbGVdO1xuICBpZiAocGxheWVyUHJvZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgaWQ6ICdiZzMtbm8tcHJvZmlsZXMnLFxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgdGl0bGU6ICdObyBwbGF5ZXIgcHJvZmlsZXMnLFxuICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgY3JlYXRlIGEgcHJvZmlsZSBpbi1nYW1lJyxcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1uby1wcm9maWxlcycpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcblxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xuICAgIGNvbnN0IGxvTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpID8/IHsgY2hpbGRyZW46IFtdIH07XG4gICAgaWYgKChsb05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChsb05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBsb05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTm9kZXMgPSBtb2RzTm9kZT8uY2hpbGRyZW4/LlswXT8ubm9kZT8uZmlsdGVyPy4oaXRlciA9PlxuICAgICAgaXRlci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gJ0d1c3RhdkRldicpKSkgPz8gW107XG5cbiAgICBjb25zdCBlbmFibGVkUGFrcyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gISFsb2FkT3JkZXJba2V5XS5kYXRhPy51dWlkXG4gICAgICAgICAgICAgICAgICAgICYmIGxvYWRPcmRlcltrZXldLmVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgJiYgIWxvYWRPcmRlcltrZXldLmRhdGE/LmlzTGlzdGVkKTtcblxuICAgIGNvbnNvbGUubG9nKCdlbmFibGVkUGFrcycsIGVuYWJsZWRQYWtzKTtcblxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBlbmFibGVkUGFrcykge1xuICAgICAgLy8gY29uc3QgbWQ1ID0gYXdhaXQgdXRpbC5maWxlTUQ1KHBhdGguam9pbihtb2RzUGF0aCgpLCBrZXkpKTtcbiAgICAgIGRlc2NyaXB0aW9uTm9kZXMucHVzaCh7XG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXG4gICAgICAgIGF0dHJpYnV0ZTogW1xuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5mb2xkZXIgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm1kNSB9IH0sXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm5hbWUgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdWZXJzaW9uJywgdHlwZTogJ2ludDMyJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudmVyc2lvbiB9IH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGVuYWJsZWRQYWtzXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcbiAgICAgIC5tYXAoKGtleTogc3RyaW5nKTogSU1vZE5vZGUgPT4gKHtcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcbiAgICAgICAgYXR0cmlidXRlOiBbXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnV1aWQgfSB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XG4gICAgbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBsb2FkT3JkZXJOb2RlcztcblxuICAgIGlmIChiZzNwcm9maWxlID09PSAnZ2xvYmFsJykge1xuICAgICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzLCBiZzNwcm9maWxlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBwcm9maWxlIG9mIHBsYXllclByb2ZpbGVzKSB7XG4gICAgICB3cml0ZU1vZFNldHRpbmdzKGFwaSwgbW9kU2V0dGluZ3MsIHByb2ZpbGUpO1xuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldHRpbmdzV3JpdHRlbihwcm9maWxlLCBEYXRlLm5vdygpLCBlbmFibGVkUGFrcy5sZW5ndGgpKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxuICAgIH0pO1xuICB9XG59XG5cblxuXG5mdW5jdGlvbiBnZXRMYXRlc3RMU0xpYk1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXTtcbiAgaWYgKG1vZHMgPT09IHVuZGVmaW5lZCkge1xuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldjogdHlwZXMuSU1vZCwgaWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xuICAgICAgY29uc3QgbGF0ZXN0VmVyID0gdXRpbC5nZXRTYWZlKHByZXYsIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuICAgICAgY29uc3QgY3VycmVudFZlciA9IHV0aWwuZ2V0U2FmZShtb2RzW2lkXSwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2VtdmVyLmd0KGN1cnJlbnRWZXIsIGxhdGVzdFZlcikpIHtcbiAgICAgICAgICBwcmV2ID0gbW9kc1tpZF07XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCBtb2QgdmVyc2lvbicsIHsgbW9kSWQ6IGlkLCB2ZXJzaW9uOiBjdXJyZW50VmVyIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSwgdW5kZWZpbmVkKTtcblxuICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBsc0xpYjtcbn1cblxuY2xhc3MgRGl2aW5lRXhlY01pc3NpbmcgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJyk7XG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZUV4ZWNNaXNzaW5nJztcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IElEaXZpbmVPcHRpb25zKTogUHJvbWlzZTxJRGl2aW5lT3V0cHV0PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRGl2aW5lT3V0cHV0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHJldHVybmVkOiBib29sZWFuID0gZmFsc2U7XG4gICAgbGV0IHN0ZG91dDogc3RyaW5nID0gJyc7XG5cbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XG4gICAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignTFNMaWIvRGl2aW5lIHRvb2wgaXMgbWlzc2luZycpO1xuICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgfVxuICAgIGNvbnN0IGV4ZSA9IHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBsc0xpYi5pbnN0YWxsYXRpb25QYXRoLCAndG9vbHMnLCAnZGl2aW5lLmV4ZScpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICAnLS1hY3Rpb24nLCBhY3Rpb24sXG4gICAgICAnLS1zb3VyY2UnLCBvcHRpb25zLnNvdXJjZSxcbiAgICAgICctLWxvZ2xldmVsJywgJ29mZicsXG4gICAgICAnLS1nYW1lJywgJ2JnMycsXG4gICAgXTtcblxuICAgIGlmIChvcHRpb25zLmRlc3RpbmF0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1kZXN0aW5hdGlvbicsIG9wdGlvbnMuZGVzdGluYXRpb24pO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5leHByZXNzaW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1leHByZXNzaW9uJywgb3B0aW9ucy5leHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9jID0gc3Bhd24oZXhlLCBhcmdzKTtcblxuICAgIHByb2Muc3Rkb3V0Lm9uKCdkYXRhJywgZGF0YSA9PiBzdGRvdXQgKz0gZGF0YSk7XG4gICAgcHJvYy5zdGRlcnIub24oJ2RhdGEnLCBkYXRhID0+IGxvZygnd2FybicsIGRhdGEpKTtcblxuICAgIHByb2Mub24oJ2Vycm9yJywgKGVyckluOiBFcnJvcikgPT4ge1xuICAgICAgaWYgKCFyZXR1cm5lZCkge1xuICAgICAgICBpZiAoZXJySW5bJ2NvZGUnXSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICByZWplY3QobmV3IERpdmluZUV4ZWNNaXNzaW5nKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdkaXZpbmUuZXhlIGZhaWxlZDogJyArIGVyckluLm1lc3NhZ2UpO1xuICAgICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBwcm9jLm9uKCdleGl0JywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgaWYgKCFyZXR1cm5lZCkge1xuICAgICAgICByZXR1cm5lZCA9IHRydWU7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQsIHJldHVybkNvZGU6IDAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoWzIsIDEwMl0uaW5jbHVkZXMoY29kZSkpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dDogJycsIHJldHVybkNvZGU6IDIgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZGl2aW5lLmV4ZSByZXR1cm5zIHRoZSBhY3R1YWwgZXJyb3IgY29kZSArIDEwMCBpZiBhIGZhdGFsIGVycm9yIG9jY3VyZWRcbiAgICAgICAgICBpZiAoY29kZSA+IDEwMCkge1xuICAgICAgICAgICAgY29kZSAtPSAxMDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7Y29kZX1gKTtcbiAgICAgICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBhayhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGgsIGRlc3RQYXRoLCBwYXR0ZXJuKSB7XG4gIHJldHVybiBkaXZpbmUoYXBpLCAnZXh0cmFjdC1wYWNrYWdlJyxcbiAgICB7IHNvdXJjZTogcGFrUGF0aCwgZGVzdGluYXRpb246IGRlc3RQYXRoLCBleHByZXNzaW9uOiBwYXR0ZXJuIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcbiAgY29uc3QgbWV0YVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdsc21ldGEnLCBzaG9ydGlkKCkpO1xuICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhtZXRhUGF0aCk7XG4gIGF3YWl0IGV4dHJhY3RQYWsoYXBpLCBwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcbiAgdHJ5IHtcbiAgICAvLyB0aGUgbWV0YS5sc3ggbWF5IGJlIGluIGEgc3ViZGlyZWN0b3J5LiBUaGVyZSBpcyBwcm9iYWJseSBhIHBhdHRlcm4gaGVyZVxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXG4gICAgbGV0IG1ldGFMU1hQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4obWV0YVBhdGgsICdtZXRhLmxzeCcpO1xuICAgIGF3YWl0IHdhbGsobWV0YVBhdGgsIGVudHJpZXMgPT4ge1xuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XG4gICAgICBpZiAodGVtcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1ldGFMU1hQYXRoID0gdGVtcC5maWxlUGF0aDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1ldGFMU1hQYXRoKTtcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobWV0YVBhdGgpO1xuICAgIHJldHVybiBtZXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH0gZWxzZSBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvbHVtbicpICYmIChlcnIubWVzc2FnZS5pbmNsdWRlcygnTGluZScpKSkge1xuICAgICAgLy8gYW4gZXJyb3IgbWVzc2FnZSBzcGVjaWZ5aW5nIGNvbHVtbiBhbmQgcm93IGluZGljYXRlIGEgcHJvYmxlbSBwYXJzaW5nIHRoZSB4bWwgZmlsZVxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgIG1lc3NhZ2U6ICdUaGUgbWV0YS5sc3ggZmlsZSBpbiBcInt7bW9kTmFtZX19XCIgaXMgaW52YWxpZCwgcGxlYXNlIHJlcG9ydCB0aGlzIHRvIHRoZSBhdXRob3InLFxuICAgICAgICBhY3Rpb25zOiBbe1xuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnSW52YWxpZCBtZXRhLmxzeCBmaWxlJywge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIH0sIFt7IGxhYmVsOiAnQ2xvc2UnIH1dKVxuICAgICAgICAgIH1cbiAgICAgICAgfV0sXG4gICAgICAgIHJlcGxhY2U6IHtcbiAgICAgICAgICBtb2ROYW1lOiB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSxcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kTm9kZTxUIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nIH0+LCBVPihub2RlczogVFtdLCBpZDogc3RyaW5nKTogVCB7XG4gIHJldHVybiBub2Rlcz8uZmluZChpdGVyID0+IGl0ZXIuJC5pZCA9PT0gaWQpID8/IHVuZGVmaW5lZDtcbn1cblxuY29uc3QgbGlzdENhY2hlOiB7IFtwYXRoOiBzdHJpbmddOiBQcm9taXNlPHN0cmluZ1tdPiB9ID0ge307XG5cbmFzeW5jIGZ1bmN0aW9uIGxpc3RQYWNrYWdlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCBkaXZpbmUoYXBpLCAnbGlzdC1wYWNrYWdlJywgeyBzb3VyY2U6IHBha1BhdGggfSk7XG4gIGNvbnN0IGxpbmVzID0gcmVzLnN0ZG91dC5zcGxpdCgnXFxuJykubWFwKGxpbmUgPT4gbGluZS50cmltKCkpLmZpbHRlcihsaW5lID0+IGxpbmUubGVuZ3RoICE9PSAwKTtcblxuICByZXR1cm4gbGluZXM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGlzTE9MaXN0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgXG4gIGlmIChsaXN0Q2FjaGVbcGFrUGF0aF0gPT09IHVuZGVmaW5lZCkge1xuICAgIGxpc3RDYWNoZVtwYWtQYXRoXSA9IGxpc3RQYWNrYWdlKGFwaSwgcGFrUGF0aCk7XG4gIH1cblxuICBjb25zdCBsaW5lcyA9IGF3YWl0IGxpc3RDYWNoZVtwYWtQYXRoXTtcbiAgLy8gY29uc3Qgbm9uR1VJID0gbGluZXMuZmluZChsaW5lID0+ICFsaW5lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgncHVibGljL2dhbWUvZ3VpJykpO1xuICBcbiAgY29uc3QgbWV0YUxTWCA9IGxpbmVzLmZpbmQobGluZSA9PlxuICAgIHBhdGguYmFzZW5hbWUobGluZS5zcGxpdCgnXFx0JylbMF0pLnRvTG93ZXJDYXNlKCkgPT09ICdtZXRhLmxzeCcpO1xuICBcbiAgICByZXR1cm4gbWV0YUxTWCA9PT0gdW5kZWZpbmVkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mb0ltcGwoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IFByb21pc2U8SVBha0luZm8+IHtcbiAgY29uc3QgbWV0YSA9IGF3YWl0IGV4dHJhY3RNZXRhKGFwaSwgcGFrUGF0aCwgbW9kKTtcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobWV0YT8uc2F2ZT8ucmVnaW9uLCAnQ29uZmlnJyk7XG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XG4gIGNvbnN0IG1vZHVsZUluZm8gPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kdWxlSW5mbycpO1xuXG4gIGNvbnNvbGUubG9nKCdtZXRhJywgbWV0YSk7XG5cbiAgY29uc3QgYXR0ciA9IChuYW1lOiBzdHJpbmcsIGZhbGxiYWNrOiAoKSA9PiBhbnkpID0+XG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcblxuICBjb25zdCBnZW5OYW1lID0gcGF0aC5iYXNlbmFtZShwYWtQYXRoLCBwYXRoLmV4dG5hbWUocGFrUGF0aCkpO1xuXG4gIGxldCBpc0xpc3RlZCA9IGF3YWl0IGlzTE9MaXN0ZWQoYXBpLCBwYWtQYXRoKTtcblxuICByZXR1cm4ge1xuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcbiAgICBkZXNjcmlwdGlvbjogYXR0cignRGVzY3JpcHRpb24nLCAoKSA9PiAnTWlzc2luZycpLFxuICAgIGZvbGRlcjogYXR0cignRm9sZGVyJywgKCkgPT4gZ2VuTmFtZSksXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXG4gICAgbmFtZTogYXR0cignTmFtZScsICgpID0+IGdlbk5hbWUpLFxuICAgIHR5cGU6IGF0dHIoJ1R5cGUnLCAoKSA9PiAnQWR2ZW50dXJlJyksXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcbiAgICB2ZXJzaW9uOiBhdHRyKCdWZXJzaW9uJywgKCkgPT4gJzEnKSxcbiAgICBpc0xpc3RlZDogaXNMaXN0ZWRcbiAgfTtcbn1cblxuY29uc3QgZmFsbGJhY2tQaWN0dXJlID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2dhbWVhcnQuanBnJyk7XG5cbmxldCBzdG9yZWRMTzogYW55W107XG5cbmZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xuICBjb25zdCBuYW1lID0gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdOYW1lJykuJC52YWx1ZTtcbiAgcmV0dXJuIHtcbiAgICBpZDogbmFtZSxcbiAgICBuYW1lLFxuICAgIGRhdGE6IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQudmFsdWUsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHN0b3JlZExPID0gW107XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gKGJnM3Byb2ZpbGUgIT09ICdnbG9iYWwnKVxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2V0dGluZ3NQYXRoKTtcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBiZzNwcm9maWxlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFiZzNwcm9maWxlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gKGJnM3Byb2ZpbGUgIT09ICdnbG9iYWwnKSBcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXG4gICAgOiBwYXRoLmpvaW4oZ2xvYmFsUHJvZmlsZVBhdGgoKSwgJ21vZHNldHRpbmdzLmxzeCcpO1xuXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xuICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGRhdGEpO1xuICB0cnkge1xuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKHNldHRpbmdzUGF0aCkpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHNldHRpbmdzUGF0aCwgeG1sKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgc3RvcmVkTE8gPSBbXTtcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2Qgc2V0dGluZ3MnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRTdG9yZWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XG4gIGNvbnN0IG1vZE9yZGVyUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpO1xuICBjb25zdCBtb2RzUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XG4gIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XG4gIGNvbnN0IG1vZE5vZGVzID0gbW9kc1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XG5cbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcblxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCB2UHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XG4gICAgdXRpbC5nZXRTYWZlKHZQcm9maWxlLCBbJ21vZFN0YXRlJywgaWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID4gMCAmJiBtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcbiAgICBjb25zdCBsYXN0V3JpdGUgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnNldHRpbmdzV3JpdHRlbj8uW2JnM3Byb2ZpbGVdO1xuICAgIGlmICgobGFzdFdyaXRlICE9PSB1bmRlZmluZWQpICYmIChsYXN0V3JpdGUuY291bnQgPiAxKSkge1xuICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlIHdhcyByZXNldCcsIHtcbiAgICAgICAgdGV4dDogJ1RoZSBnYW1lIHJlc2V0IHRoZSBsaXN0IG9mIGFjdGl2ZSBtb2RzIGFuZCByYW4gd2l0aG91dCB0aGVtLlxcbidcbiAgICAgICAgICAgICsgJ1RoaXMgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgb3IgaW5jb21wYXRpYmxlIG1vZCBpcyBpbnN0YWxsZWQuICdcbiAgICAgICAgICAgICsgJ1RoZSBnYW1lIHdpbGwgbm90IGxvYWQgYW55IG1vZHMgaWYgb25lIG9mIHRoZW0gaXMgaW5jb21wYXRpYmxlLCB1bmZvcnR1bmF0ZWx5ICdcbiAgICAgICAgICAgICsgJ3RoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIGZpbmQgb3V0IHdoaWNoIG9uZSBjYXVzZWQgdGhlIHByb2JsZW0uJyxcbiAgICAgIH0sIFtcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlJyB9LFxuICAgICAgXSk7XG4gICAgfVxuICB9XG5cbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXG4gICAgLy8gR3VzdGF2IGlzIHRoZSBjb3JlIGdhbWVcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxuICAgIC5zb3J0KChsaHMsIHJocykgPT4gbW9kT3JkZXJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLTGlzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xuICB0cnkge1xuICAgIHBha3MgPSAoYXdhaXQgZnMucmVhZGRpckFzeW5jKG1vZHNQYXRoKCkpKVxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgoKSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIG5vcFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzIGRpcmVjdG9yeScsIGVyciwge1xuICAgICAgICBpZDogJ2JnMy1mYWlsZWQtcmVhZC1tb2RzJyxcbiAgICAgICAgbWVzc2FnZTogbW9kc1BhdGgoKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwYWtzID0gW107XG4gIH1cblxuICByZXR1cm4gcGFrcztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKVxuICAgIDogUHJvbWlzZTxBcnJheTx7IGZpbGVOYW1lOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCwgaW5mbzogSVBha0luZm8gfT4+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbHNMaWIgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xuICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBcbiAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtMaXN0KGFwaSk7XG5cbiAgY29uc29sZS5sb2coJ3Bha3MnLCB7IHBha3M6IHBha3MgfSk7XG5cbiAgbGV0IG1hbmlmZXN0O1xuICB0cnkge1xuICAgIG1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksICcnLCBHQU1FX0lEKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc3QgYWxsb3dSZXBvcnQgPSAhWydFUEVSTSddLmluY2x1ZGVzKGVyci5jb2RlKTtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBkZXBsb3ltZW50IG1hbmlmZXN0JywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IFByb21pc2UuYWxsKHBha3MubWFwKGFzeW5jIGZpbGVOYW1lID0+IHtcbiAgICByZXR1cm4gdXRpbC53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCAoKSA9PiB7XG4gICAgICBjb25zdCBmdW5jID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBtYW5pZmVzdC5maWxlcy5maW5kKGVudHJ5ID0+IGVudHJ5LnJlbFBhdGggPT09IGZpbGVOYW1lKTtcbiAgICAgICAgICBjb25zdCBtb2QgPSAobWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgPyBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF0/LlttYW5pZmVzdEVudHJ5LnNvdXJjZV1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgY29uc3QgcGFrUGF0aCA9IHBhdGguam9pbihtb2RzUGF0aCgpLCBmaWxlTmFtZSk7XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgICAgICBtb2QsXG4gICAgICAgICAgICBpbmZvOiBhd2FpdCBleHRyYWN0UGFrSW5mb0ltcGwoYXBpLCBwYWtQYXRoLCBtb2QpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEaXZpbmVFeGVjTWlzc2luZykge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdUaGUgaW5zdGFsbGVkIGNvcHkgb2YgTFNMaWIvRGl2aW5lIGlzIGNvcnJ1cHRlZCAtIHBsZWFzZSAnXG4gICAgICAgICAgICAgICsgJ2RlbGV0ZSB0aGUgZXhpc3RpbmcgTFNMaWIgbW9kIGVudHJ5IGFuZCByZS1pbnN0YWxsIGl0LiBNYWtlIHN1cmUgdG8gJ1xuICAgICAgICAgICAgICArICdkaXNhYmxlIG9yIGFkZCBhbnkgbmVjZXNzYXJ5IGV4Y2VwdGlvbnMgdG8geW91ciBzZWN1cml0eSBzb2Z0d2FyZSB0byAnXG4gICAgICAgICAgICAgICsgJ2Vuc3VyZSBpdCBkb2VzIG5vdCBpbnRlcmZlcmUgd2l0aCBWb3J0ZXgvTFNMaWIgZmlsZSBvcGVyYXRpb25zLic7XG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJywgbWVzc2FnZSxcbiAgICAgICAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBjb3VsZCBoYXBwZW4gaWYgdGhlIGZpbGUgZ290IGRlbGV0ZWQgc2luY2UgcmVhZGluZyB0aGUgbGlzdCBvZiBwYWtzLlxuICAgICAgICAgIC8vIGFjdHVhbGx5LCB0aGlzIHNlZW1zIHRvIGJlIGZhaXJseSBjb21tb24gd2hlbiB1cGRhdGluZyBhIG1vZFxuICAgICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhay4gUGxlYXNlIG1ha2Ugc3VyZSB5b3UgYXJlIHVzaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBMU0xpYiBieSB1c2luZyB0aGUgXCJSZS1pbnN0YWxsIExTTGliL0RpdmluZVwiIHRvb2xiYXIgYnV0dG9uIG9uIHRoZSBNb2RzIHBhZ2UuJywgZXJyLCB7XG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogZmlsZU5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoKSk7XG4gICAgfSk7XG4gIH0pKTtcblxuICByZXR1cm4gcmVzLmZpbHRlcihpdGVyID0+IGl0ZXIgIT09IHVuZGVmaW5lZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcbiAgICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcbiAgICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xuICAgIGNvbnN0IG1vZE9yZGVyUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpO1xuICAgIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XG4gICAgcmV0dXJuIG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzZXR0aW5ncy5sc3gnLCBlcnIsIHtcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXG4gICAgfSk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc2VyaWFsaXplTG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgb3JkZXIpOiBQcm9taXNlPHZvaWQ+IHtcblxuICBjb25zb2xlLmxvZygnc2VyaWFsaXplTG9hZE9yZGVyJyk7XG5cbiAgcmV0dXJuIHdyaXRlTG9hZE9yZGVyT2xkKGFwaSwgb3JkZXIpO1xufVxuXG5jb25zdCBkZXNlcmlhbGl6ZURlYm91bmNlciA9IG5ldyB1dGlsLkRlYm91bmNlcigoKSA9PiB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn0sIDEwMDApO1xuXG5hc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZUxvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGFueT4ge1xuXG4gIC8vIHRoaXMgZnVuY3Rpb24gbWlnaHQgYmUgaW52b2tlZCBieSB0aGUgbHNsaWIgbW9kIGJlaW5nICh1bilpbnN0YWxsZWQgaW4gd2hpY2ggY2FzZSBpdCBtaWdodCBiZVxuICAvLyBpbiB0aGUgbWlkZGxlIG9mIGJlaW5nIHVucGFja2VkIG9yIHJlbW92ZWQgd2hpY2ggbGVhZHMgdG8gd2VpcmQgZXJyb3IgbWVzc2FnZXMuXG4gIC8vIHRoaXMgaXMgYSBoYWNrIGhvcGVmdWxseSBlbnN1cmVpbmcgdGhlIGl0J3MgZWl0aGVyIGZ1bGx5IHRoZXJlIG9yIG5vdCBhdCBhbGxcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gZGVzZXJpYWxpemVEZWJvdW5jZXIuc2NoZWR1bGUoY2IpKTtcblxuICBjb25zb2xlLmxvZygnZGVzZXJpYWxpemVMb2FkT3JkZXInKTtcblxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS3MoYXBpKTtcbiAgY29uc3Qgb3JkZXIgPSBhd2FpdCByZWFkTE8oYXBpKTtcbiAgXG4gIGNvbnNvbGUubG9nKCdwYWtzJywgcGFrcyk7XG4gIGNvbnNvbGUubG9nKCdvcmRlcicsIG9yZGVyKTtcblxuICBjb25zdCBvcmRlclZhbHVlID0gKGluZm86IElQYWtJbmZvKSA9PiB7XG4gICAgcmV0dXJuIG9yZGVyLmluZGV4T2YoaW5mby51dWlkKSArIChpbmZvLmlzTGlzdGVkID8gMCA6IDEwMDApO1xuICB9O1xuXG4gIHJldHVybiBwYWtzXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBvcmRlclZhbHVlKGxocy5pbmZvKSAtIG9yZGVyVmFsdWUocmhzLmluZm8pKVxuICAgIC5tYXAoKHsgZmlsZU5hbWUsIG1vZCwgaW5mbyB9KSA9PiAoe1xuICAgICAgaWQ6IGZpbGVOYW1lLFxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIG5hbWU6IHV0aWwucmVuZGVyTW9kTmFtZShtb2QpLFxuICAgICAgbW9kSWQ6IG1vZD8uaWQsXG4gICAgICBsb2NrZWQ6IGluZm8uaXNMaXN0ZWQsXG4gICAgICBkYXRhOiBpbmZvLFxuICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGUoYmVmb3JlLCBhZnRlcik6IFByb21pc2U8YW55PiB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cblxubGV0IGZvcmNlUmVmcmVzaDogKCkgPT4gdm9pZDtcblxuZnVuY3Rpb24gSW5mb1BhbmVsV3JhcChwcm9wczogeyBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHJlZnJlc2g6ICgpID0+IHZvaWQgfSkge1xuICBjb25zdCB7IGFwaSB9ID0gcHJvcHM7XG5cbiAgY29uc3QgY3VycmVudFByb2ZpbGUgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT5cbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LnBsYXllclByb2ZpbGUpO1xuXG4gIGNvbnN0IFtnYW1lVmVyc2lvbiwgc2V0R2FtZVZlcnNpb25dID0gUmVhY3QudXNlU3RhdGU8c3RyaW5nPigpO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZm9yY2VSZWZyZXNoID0gcHJvcHMucmVmcmVzaDtcbiAgfSwgW10pO1xuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgKGFzeW5jICgpID0+IHtcbiAgICAgIHNldEdhbWVWZXJzaW9uKGF3YWl0IGdldE93bkdhbWVWZXJzaW9uKGFwaS5nZXRTdGF0ZSgpKSk7XG4gICAgfSkoKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IG9uU2V0UHJvZmlsZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgaW1wbCA9IGFzeW5jICgpID0+IHtcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGVOYW1lKSk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZm9yY2VSZWZyZXNoPy4oKTtcbiAgICB9O1xuICAgIGltcGwoKTtcbiAgfSwgWyBhcGkgXSk7XG5cbiAgY29uc3QgaXNMc0xpYkluc3RhbGxlZCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICByZXR1cm4gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKSAhPT0gdW5kZWZpbmVkO1xuICB9LCBbIGFwaSBdKTtcblxuICBjb25zdCBvbkluc3RhbGxMU0xpYiA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaSwgR0FNRV9JRCk7XG4gIH0sIFthcGldKTtcblxuICBpZiAoIWdhbWVWZXJzaW9uKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxJbmZvUGFuZWxcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XG4gICAgICBnYW1lVmVyc2lvbj17Z2FtZVZlcnNpb259XG4gICAgICBjdXJyZW50UHJvZmlsZT17Y3VycmVudFByb2ZpbGV9XG4gICAgICBvblNldFBsYXllclByb2ZpbGU9e29uU2V0UHJvZmlsZX1cbiAgICAgIGlzTHNMaWJJbnN0YWxsZWQ9e2lzTHNMaWJJbnN0YWxsZWR9XG4gICAgICBvbkluc3RhbGxMU0xpYj17b25JbnN0YWxsTFNMaWJ9XG4gICAgLz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxuICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG4gIHJldHVybiBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXYsIGlkKSA9PiB7XG4gICAgaWYgKG1vZHNbaWRdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKSB7XG4gICAgICBjb25zdCBhcmNJZCA9IG1vZHNbaWRdLmFyY2hpdmVJZDtcbiAgICAgIGNvbnN0IGRsOiB0eXBlcy5JRG93bmxvYWQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgIFsncGVyc2lzdGVudCcsICdkb3dubG9hZHMnLCAnZmlsZXMnLCBhcmNJZF0sIHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBzdG9yZWRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2VtdmVyLmd0KHN0b3JlZFZlciwgcHJldikpIHtcbiAgICAgICAgICBwcmV2ID0gc3RvcmVkVmVyO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgdmVyc2lvbiBzdG9yZWQgZm9yIGxzbGliIG1vZCcsIHsgaWQsIHZlcnNpb246IHN0b3JlZFZlciB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVGhlIExTTGliIGRldmVsb3BlciBkb2Vzbid0IGFsd2F5cyB1cGRhdGUgdGhlIHZlcnNpb24gb24gdGhlIGV4ZWN1dGFibGVcbiAgICAgICAgLy8gIGl0c2VsZiAtIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBleHRyYWN0IGl0IGZyb20gdGhlIGFyY2hpdmUgd2hpY2ggdGVuZHNcbiAgICAgICAgLy8gIHRvIHVzZSB0aGUgY29ycmVjdCB2ZXJzaW9uLlxuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGwubG9jYWxQYXRoLCBwYXRoLmV4dG5hbWUoZGwubG9jYWxQYXRoKSk7XG4gICAgICAgIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdmVyID0gc2VtdmVyLmNvZXJjZShmaWxlTmFtZS5zbGljZShpZHggKyAyKSkudmVyc2lvbjtcbiAgICAgICAgICBpZiAoc2VtdmVyLnZhbGlkKHZlcikgJiYgdmVyICE9PSBzdG9yZWRWZXIpIHtcbiAgICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShHQU1FX0lELCBpZCwgJ3ZlcnNpb24nLCB2ZXIpKTtcbiAgICAgICAgICAgIHByZXYgPSB2ZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBXZSBmYWlsZWQgdG8gZ2V0IHRoZSB2ZXJzaW9uLi4uIE9oIHdlbGwuLiBTZXQgYSBib2d1cyB2ZXJzaW9uIHNpbmNlXG4gICAgICAgICAgLy8gIHdlIGNsZWFybHkgaGF2ZSBsc2xpYiBpbnN0YWxsZWQgLSB0aGUgdXBkYXRlIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIHRha2VcbiAgICAgICAgICAvLyAgY2FyZSBvZiB0aGUgcmVzdCAod2hlbiB0aGUgdXNlciBjbGlja3MgdGhlIGNoZWNrIGZvciB1cGRhdGVzIGJ1dHRvbilcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgaWQsICd2ZXJzaW9uJywgJzEuMC4wJykpO1xuICAgICAgICAgIHByZXYgPSAnMS4wLjAnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9LCAnMC4wLjAnKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25DaGVja01vZFZlcnNpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSB7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuZ2V0U3RhdGUoKSk7XG4gIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XG5cbiAgaWYgKGxhdGVzdFZlciA9PT0gJzAuMC4wJykge1xuICAgIC8vIE5vdGhpbmcgdG8gdXBkYXRlLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5ld2VzdFZlcjogc3RyaW5nID0gYXdhaXQgZ2l0SHViRG93bmxvYWRlci5jaGVja0ZvclVwZGF0ZXMoYXBpLCBsYXRlc3RWZXIpO1xuICBpZiAoIW5ld2VzdFZlciB8fCBuZXdlc3RWZXIgPT09IGxhdGVzdFZlcikge1xuICAgIHJldHVybjtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3AoKSB7XG4gIC8vIG5vcFxufVxuXG5hc3luYyBmdW5jdGlvbiBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgbWlncmF0ZShhcGkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxuICAgICAgJ0ZhaWxlZCB0byBtaWdyYXRlJywgZXJyLCB7XG4gICAgICAgIC8vbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcbiAgaWYgKGxhdGVzdFZlciA9PT0gJzAuMC4wJykge1xuICAgIGF3YWl0IGdpdEh1YkRvd25sb2FkZXIuZG93bmxvYWREaXZpbmUoYXBpKTtcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIHRlc3RNb2RGaXhlcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcblxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgLy8gZGlmZmVyZW50IGdhbWUuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xuICAvL2NvbnN0IGJpbkZvbGRlciA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpICE9PSAtMSk7XG5cbiAgY29uc3QgaGFzTW9kRml4ZXJQYWsgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSAnbW9kZml4ZXIucGFrJykgIT09IHVuZGVmaW5lZDtcblxuICBpZiAoIWhhc01vZEZpeGVyUGFrKSB7XG4gICAgLy8gdGhlcmUncyBubyBtb2RmaXhlci5wYWsgZm9sZGVyLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XG4gIH1cblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XG4gICAgICBzdXBwb3J0ZWQ6IHRydWUsXG4gICAgICByZXF1aXJlZEZpbGVzOiBbXVxuICB9KTtcbn1cblxuZnVuY3Rpb24gdGVzdEVuZ2luZUluamVjdG9yKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XG5cbiAgY29uc3Qgbm90U3VwcG9ydGVkID0geyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9O1xuXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAvLyBkaWZmZXJlbnQgZ2FtZS5cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xuICB9XG5cbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XG4gIC8vY29uc3QgYmluRm9sZGVyID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJykgIT09IC0xKTtcblxuICBjb25zdCBoYXNCaW5Gb2xkZXIgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmluZGV4T2YoJ2JpbicgKyBwYXRoLnNlcCkgIT09IC0xKSAhPT0gdW5kZWZpbmVkO1xuXG4gIGlmICghaGFzQmluRm9sZGVyKSB7XG4gICAgLy8gdGhlcmUncyBubyBiaW4gZm9sZGVyLlxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XG4gIH1cblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XG4gICAgICBzdXBwb3J0ZWQ6IHRydWUsXG4gICAgICByZXF1aXJlZEZpbGVzOiBbXVxuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbEJHM1NFKGZpbGVzOiBzdHJpbmdbXSxcbiAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXG4gIGdhbWVJZDogc3RyaW5nLFxuICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxuICA6IEJsdWViaXJkPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIFxuICBjb25zb2xlLmxvZygnaW5zdGFsbEJHM1NFIGZpbGVzOicsIGZpbGVzKTtcblxuICAvLyBGaWx0ZXIgb3V0IGZvbGRlcnMgYXMgdGhpcyBicmVha3MgdGhlIGluc3RhbGxlci5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XG5cbiAgLy8gRmlsdGVyIG9ubHkgZGxsIGZpbGVzLlxuICBmaWxlcyA9IGZpbGVzLmZpbHRlcihmID0+IHBhdGguZXh0bmFtZShmKSA9PT0gJy5kbGwnKTtcblxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHsgICAgXG4gICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXG4gICAgICB9KTsgICAgXG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbXSk7XG5cbiAgY29uc29sZS5sb2coJ2luc3RhbGxCRzNTRSBpbnN0cnVjdGlvbnM6JywgaW5zdHJ1Y3Rpb25zKTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn0gXG5cbmZ1bmN0aW9uIGluc3RhbGxNb2RGaXhlcihmaWxlczogc3RyaW5nW10sXG4gIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICBnYW1lSWQ6IHN0cmluZyxcbiAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSlcbiAgOiBCbHVlYmlyZDx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBcbiAgY29uc29sZS5sb2coJ2luc3RhbGxNb2RGaXhlciBmaWxlczonLCBmaWxlcyk7XG5cbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xuXG4gIC8vIEZpbHRlciBvbmx5IHBhayBmaWxlcy5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgPT09ICcucGFrJyk7XG5cbiAgY29uc3QgbW9kRml4ZXJBdHRyaWJ1dGU6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ2F0dHJpYnV0ZScsIGtleTogJ21vZEZpeGVyJywgdmFsdWU6IHRydWUgfVxuXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4geyAgICBcbiAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcbiAgICAgIH0pOyAgICBcbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIFsgbW9kRml4ZXJBdHRyaWJ1dGUgXSk7XG5cbiAgY29uc29sZS5sb2coJ2luc3RhbGxNb2RGaXhlciBpbnN0cnVjdGlvbnM6JywgaW5zdHJ1Y3Rpb25zKTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn0gXG5cbmZ1bmN0aW9uIGluc3RhbGxFbmdpbmVJbmplY3RvcihmaWxlczogc3RyaW5nW10sXG4gIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICBnYW1lSWQ6IHN0cmluZyxcbiAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSlcbiAgOiBCbHVlYmlyZDx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBcbiAgY29uc29sZS5sb2coJ2luc3RhbGxFbmdpbmVJbmplY3RvciBmaWxlczonLCBmaWxlcyk7XG5cbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xuXG4gIGNvbnN0IG1vZHR5cGVBdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdzZXRtb2R0eXBlJywgdmFsdWU6ICdkaW5wdXQnIH0gXG5cbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgXG4gICAgLy8gc2VlIGlmIHdlIGhhdmUgYSBiaW4gZm9sZGVyXG4gICAgLy8gdGhlbiB3ZSBuZWVkIHRvIHVzZSB0aGF0IGFzIGEgbmV3IHJvb3QgaW5jYXNlIHRoZSAvYmluIGlzIG5lc3RlZFxuXG4gICAgY29uc3QgYmluSW5kZXggPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2JpbicgKyBwYXRoLnNlcCk7XG5cbiAgICBpZiAoYmluSW5kZXggIT09IC0xKSB7XG5cbiAgICAgIGNvbnNvbGUubG9nKGZpbGVQYXRoLnN1YnN0cmluZyhiaW5JbmRleCkpO1xuXG4gICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGguc3Vic3RyaW5nKGJpbkluZGV4KSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIFsgbW9kdHlwZUF0dHIgXSk7XG5cbiAgY29uc29sZS5sb2coJ2luc3RhbGxFbmdpbmVJbmplY3RvciBpbnN0cnVjdGlvbnM6JywgaW5zdHJ1Y3Rpb25zKTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMnLFxuICAgIG1lcmdlTW9kczogdHJ1ZSxcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxuICAgIHN1cHBvcnRlZFRvb2xzOiBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnZXhldnVsa2FuJyxcbiAgICAgICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIChWdWxrYW4pJyxcbiAgICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzMuZXhlJyxcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgICAgICdiaW4vYmczLmV4ZScsXG4gICAgICAgIF0sXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgICAgfSxcbiAgICBdLFxuICAgIHF1ZXJ5TW9kUGF0aDogbW9kc1BhdGgsXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnM19keDExLmV4ZScsXG4gICAgc2V0dXA6IGRpc2NvdmVyeSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSxcbiAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAnYmluL2JnM19keDExLmV4ZScsXG4gICAgXSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXG4gICAgICBpZ25vcmVDb25mbGljdHM6IFtcbiAgICAgICAgJ2luZm8uanNvbicsXG4gICAgICBdLFxuICAgICAgaWdub3JlRGVwbG95OiBbXG4gICAgICAgICdpbmZvLmpzb24nLFxuICAgICAgXSxcbiAgICB9LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCAzMDAsICdzZXR0aW5ncycsIHt9LCAnUmUtaW5zdGFsbCBMU0xpYi9EaXZpbmUnLCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxuICAgICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gICAgY29uc3QgbHNsaWJzID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKG1vZCA9PiBtb2RzW21vZF0udHlwZSA9PT0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcpO1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kcycsIEdBTUVfSUQsIGxzbGlicywgKGVycikgPT4ge1xuICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWluc3RhbGwgbHNsaWInLFxuICAgICAgICAgICdQbGVhc2UgcmUtaW5zdGFsbCBtYW51YWxseScsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGNvbnRleHQuYXBpKTtcbiAgICB9KTtcbiAgfSwgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgIHJldHVybiBnYW1lTW9kZSA9PT0gR0FNRV9JRDtcbiAgfSk7ICBcblxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtbHNsaWItZGl2aW5lLXRvb2wnLCAxNSwgdGVzdExTTGliLCBpbnN0YWxsTFNMaWIgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWJnM3NlJywgMTUsIHRlc3RCRzNTRSwgaW5zdGFsbEJHM1NFIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1lbmdpbmUtaW5qZWN0b3InLCAyMCwgdGVzdEVuZ2luZUluamVjdG9yLCBpbnN0YWxsRW5naW5lSW5qZWN0b3IgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLXJlcGxhY2VyJywgMjUsIHRlc3RSZXBsYWNlciwgaW5zdGFsbFJlcGxhY2VyKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLW1vZGZpeGVyJywgMjUsIHRlc3RNb2RGaXhlciwgaW5zdGFsbE1vZEZpeGVyKTtcblxuICAvKlxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLWVuZ2luZS1pbmplY3RvcicsIDIwLCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsIFxuICAgICgpID0+IGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSwgXG4gICAgaW5zdHJ1Y3Rpb25zID0+IGlzRW5naW5lSW5qZWN0b3IoY29udGV4dC5hcGksIGluc3RydWN0aW9ucyksXG4gICAgeyBuYW1lOiAnQkczIEVuZ2luZSBJbmplY3Rvcid9KTsqL1xuICAgIFxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoKSA9PiB1bmRlZmluZWQsIFxuICAgIGluc3RydWN0aW9ucyA9PiBpc0xTTGliKGNvbnRleHQuYXBpLCBpbnN0cnVjdGlvbnMpLFxuICAgIHsgbmFtZTogJ0JHMyBMU0xpYicgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ2JnMy1iZzNzZScsIDE1LCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKCkgPT4gcGF0aC5qb2luKGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSwgJ2JpbicpLCBcbiAgICBpbnN0cnVjdGlvbnMgPT4gaXNCRzNTRShjb250ZXh0LmFwaSwgaW5zdHJ1Y3Rpb25zKSxcbiAgICB7IG5hbWU6ICdCRzMgQkczU0UnIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdiZzMtcmVwbGFjZXInLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxuICAgIGluc3RydWN0aW9ucyA9PiBpc1JlcGxhY2VyKGNvbnRleHQuYXBpLCBpbnN0cnVjdGlvbnMpLFxuICAgIHsgbmFtZTogJ0JHMyBSZXBsYWNlcicgfSBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdiZzMtbG9vc2UnLCAyMCwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxuICAgIGluc3RydWN0aW9ucyA9PiBpc0xvb3NlKGNvbnRleHQuYXBpLCBpbnN0cnVjdGlvbnMpLFxuICAgIHsgbmFtZTogJ0JHMyBMb29zZScgfSBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xuICAgIGdhbWVJZDogR0FNRV9JRCxcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemUoY29udGV4dCksXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyLCBwcmV2KSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyKSxcbiAgICB2YWxpZGF0ZSxcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICgoKSA9PiAoPEluZm9QYW5lbFdyYXAgYXBpPXtjb250ZXh0LmFwaX0gcmVmcmVzaD17bm9wfSAvPikpIGFzIGFueSxcbiAgfSk7XG5cbiAgLypcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE0NSwgJ3JlZnJlc2gnLCB7fSwgJ0RlZXAgUmVmcmVzaCcsICgpID0+IHsgZGVlcFJlZnJlc2goY29udGV4dC5hcGkpOyB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcbiAgfSk7Ki9cblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnY2hhbmdlbG9nJywge30sICdFeHBvcnQgdG8gR2FtZScsICgpID0+IHsgZXhwb3J0VG9HYW1lKGNvbnRleHQuYXBpKTsgfSwgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNTEsICdjaGFuZ2Vsb2cnLCB7fSwgJ0V4cG9ydCB0byBGaWxlLi4uJywgKCkgPT4geyBleHBvcnRUb0ZpbGUoY29udGV4dC5hcGkpOyB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE2MCwgJ2ltcG9ydCcsIHt9LCAnSW1wb3J0IGZyb20gR2FtZScsICgpID0+IHsgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGNvbnRleHQuYXBpKTsgfSwgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNjEsICdpbXBvcnQnLCB7fSwgJ0ltcG9ydCBmcm9tIEZpbGUuLi4nLCAoKSA9PiB7IFxuICAgIGltcG9ydE1vZFNldHRpbmdzRmlsZShjb250ZXh0LmFwaSk7IFxuICB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MsIHVuZGVmaW5lZCwgKCkgPT5cbiAgICBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELCAxNTApO1xuXG4gIC8vY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbigob2xkVmVyc2lvbikgPT4gQmx1ZWJpcmQucmVzb2x2ZShtaWdyYXRlMTMoY29udGV4dC5hcGksIG9sZFZlcnNpb24pKSk7XG5cbiAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2Vzc2lvbicsICdiYXNlJywgJ3Rvb2xzUnVubmluZyddLFxuICAgICAgYXN5bmMgKHByZXY6IGFueSwgY3VycmVudDogYW55KSA9PiB7XG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGNoYW5nZWRcbiAgICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oY29udGV4dC5hcGkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCksIHByb2ZpbGVJZCk7XG4gICAgICBpZiAoKHByb2ZpbGU/LmdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZvcmNlUmVmcmVzaCAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICBmb3JjZVJlZnJlc2goKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignY2hlY2stbW9kcy12ZXJzaW9uJyxcbiAgICAgIChnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSA9PiBvbkNoZWNrTW9kVmVyc2lvbihjb250ZXh0LmFwaSwgZ2FtZUlkLCBtb2RzKSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXG4gICAgICBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4gb25HYW1lTW9kZUFjdGl2YXRlZChjb250ZXh0LmFwaSwgZ2FtZU1vZGUpKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47XG4iXX0=