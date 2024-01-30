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
            ignoreConflicts: common_1.IGNORE_PATTERNS,
            ignoreDeploy: common_1.IGNORE_PATTERNS,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLHdEQUFnQztBQUNoQyxpREFBc0M7QUFDdEMsOERBQXFDO0FBRXJDLDJDQUE2QjtBQUM3Qiw2Q0FBK0I7QUFDL0IscURBQXdDO0FBQ3hDLDZDQUEwQztBQUMxQywrQ0FBaUM7QUFDakMscUNBQThDO0FBQzlDLDBEQUE2QjtBQUM3QiwyQ0FBK0U7QUFDL0UsbUNBQXFEO0FBR3JELHFDQUFxRjtBQUNyRixxRUFBdUQ7QUFDdkQsMkNBQStIO0FBQy9ILDBEQUFrQztBQUNsQyx1Q0FBOEQ7QUFDOUQsMERBQWlDO0FBQ2pDLDZDQUF3QztBQUV4QyxNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXZDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFFM0IsU0FBUyxTQUFTLENBQUMsS0FBSztJQUN0QixPQUFPLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLGFBQWE7SUFDcEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxZQUFZO0lBQ25CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxTQUFTLGlCQUFpQjtJQUN4QixPQUFPLElBQUksQ0FBQyxJQUFJLENB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QyxDQUFPLFFBQWdCLEVBQUUsRUFBRSxnREFBQyxPQUFBLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5cclxuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0IGdldFZlcnNpb24gZnJvbSAnZXhlLXZlcnNpb24nO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgQWxlcnQgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGdlbmVyYXRlIGFzIHNob3J0aWQgfSBmcm9tICdzaG9ydGlkJztcclxuaW1wb3J0IHdhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0b29sdGlwLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgeyBEaXZpbmVBY3Rpb24sIElEaXZpbmVPcHRpb25zLCBJRGl2aW5lT3V0cHV0LCBJTW9kTm9kZSwgSU1vZFNldHRpbmdzLCBJUGFrSW5mbywgSVhtbE5vZGUgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IERFRkFVTFRfTU9EX1NFVFRJTkdTLCBHQU1FX0lELCBJR05PUkVfUEFUVEVSTlMsIExTTElCX1VSTCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xyXG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgaW1wb3J0TW9kU2V0dGluZ3NGaWxlLCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUsIHNlcmlhbGl6ZSwgZXhwb3J0VG9HYW1lLCBleHBvcnRUb0ZpbGUgfSBmcm9tICcuL2xvYWRPcmRlcic7XHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IHsgc2V0UGxheWVyUHJvZmlsZSwgc2V0dGluZ3NXcml0dGVuIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHJlZHVjZXIgZnJvbSAnLi9yZWR1Y2Vycyc7XHJcbmltcG9ydCB7IG1pZ3JhdGUgIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTQ1NjQ2MDY2OSc7XHJcbmNvbnN0IFNURUFNX0lEID0gJzEwODY5NDAnO1xyXG5cclxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XHJcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRvY3VtZW50c1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2xvY2FsQXBwRGF0YScpLCAnTGFyaWFuIFN0dWRpb3MnLCAnQmFsZHVyXFwncyBHYXRlIDMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdNb2RzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb2ZpbGVzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ1BsYXllclByb2ZpbGVzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdsb2JhbFByb2ZpbGVQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnZ2xvYmFsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IGFueSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtHT0dfSUQsIFNURUFNX0lEXSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICBjb25zdCBwcm9maWxlUGF0aCA9IGdsb2JhbFByb2ZpbGVQYXRoKCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHByb2ZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgbW9kU2V0dGluZ3NGaWxlUGF0aCA9IHBhdGguam9pbihwcm9maWxlUGF0aCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCwgREVGQVVMVF9NT0RfU0VUVElOR1MsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpOiBhbnkge1xyXG5cclxuICBjb25zdCBtcCA9IG1vZHNQYXRoKCk7ICBcclxuXHJcbiAgY2hlY2tGb3JTY3JpcHRFeHRlbmRlcihhcGkpO1xyXG4gIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpKTsgXHJcbiAgXHJcbiAgY29uc29sZS5sb2coYGN1cnJlbnQgZXh0ZW5zaW9uIHZlcnNpb24gPSBgKVxyXG5cclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ2JnMy11c2VzLWxzbGliJyxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIHRpdGxlOiAnQkczIHN1cHBvcnQgdXNlcyBMU0xpYicsXHJcbiAgICBtZXNzYWdlOiBMU0xJQl9VUkwsXHJcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgYWN0aW9uczogW1xyXG4gICAgICB7IHRpdGxlOiAnVmlzaXQgUGFnZScsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oTFNMSUJfVVJMKS5jYXRjaCgoKSA9PiBudWxsKSB9LFxyXG4gICAgXSxcclxuICB9KTtcclxuICByZXR1cm4gZnMuc3RhdEFzeW5jKG1wKVxyXG4gICAgLmNhdGNoKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobXAsICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSBhcyBhbnkpKVxyXG4gICAgLmZpbmFsbHkoKCkgPT4gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGksIGRpc2NvdmVyeSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0ZvclNjcmlwdEV4dGVuZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG5cclxuICAvL1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaG93RnVsbFJlbGVhc2VNb2RGaXhlclJlY29tbWVuZGF0aW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG5cclxuICAvLyBjaGVjayB0byBzZWUgaWYgbW9kIGlzIGluc3RhbGxlZCBmaXJzdD9cclxuICAvL29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShhcGkuc3RvcmUuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCAnYmFsZHVyc2dhdGUzJ10sIHVuZGVmaW5lZCk7XHJcblxyXG4gIGNvbnN0IG1vZHMgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Py5tb2RzPy5iYWxkdXJzZ2F0ZTM7XHJcbiAgY29uc29sZS5sb2coJ21vZHMnLCBtb2RzKTtcclxuXHJcbiAgaWYobW9kcyAhPT0gdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgY29uc3QgbW9kQXJyYXk6IHR5cGVzLklNb2RbXSA9IG1vZHMgPyBPYmplY3QudmFsdWVzKG1vZHMpIDogW107ICAgIFxyXG4gICAgY29uc29sZS5sb2coJ21vZEFycmF5JywgbW9kQXJyYXkpO1xyXG4gIFxyXG4gICAgY29uc3QgbW9kRml4ZXJJbnN0YWxsZWQ6Ym9vbGVhbiA9ICBtb2RBcnJheS5maWx0ZXIobW9kID0+ICEhbW9kPy5hdHRyaWJ1dGVzPy5tb2RGaXhlcikubGVuZ3RoICE9IDA7ICBcclxuICAgIGNvbnNvbGUubG9nKCdtb2RGaXhlckluc3RhbGxlZCcsIG1vZEZpeGVySW5zdGFsbGVkKTtcclxuXHJcbiAgICAvLyBpZiB3ZSd2ZSBmb3VuZCBhbiBpbnN0YWxsZWQgbW9kZml4ZXIsIHRoZW4gZG9uJ3QgYm90aGVyIHNob3dpbmcgbm90aWZpY2F0aW9uIFxyXG4gICAgaWYobW9kRml4ZXJJbnN0YWxsZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gbm8gbW9kcyBmb3VuZFxyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgIHRpdGxlOiAnUmVjb21tZW5kZWQgTW9kJyxcclxuICAgIG1lc3NhZ2U6ICdNb3N0IG1vZHMgcmVxdWlyZSB0aGlzIG1vZC4nLFxyXG4gICAgaWQ6ICdiZzMtcmVjb21tZW5kZWQtbW9kJyxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ01vcmUnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xyXG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1JlY29tbWVuZGVkIE1vZHMnLCB7XHJcbiAgICAgICAgICAgIHRleHQ6XHJcbiAgICAgICAgICAgICAgJ1dlIHJlY29tbWVuZCBpbnN0YWxsaW5nIFwiQmFsZHVyXFwncyBHYXRlIDMgTW9kIEZpeGVyXCIgdG8gYmUgYWJsZSB0byBtb2QgQmFsZHVyXFwncyBHYXRlIDMuXFxuXFxuJyArIFxyXG4gICAgICAgICAgICAgICdUaGlzIGNhbiBiZSBkb3dubG9hZGVkIGZyb20gTmV4dXMgTW9kcyBhbmQgaW5zdGFsbGVkIHVzaW5nIFZvcnRleCBieSBwcmVzc2luZyBcIk9wZW4gTmV4dXMgTW9kcydcclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0Rpc21pc3MnIH0sXHJcbiAgICAgICAgICAgIHsgbGFiZWw6ICdPcGVuIE5leHVzIE1vZHMnLCBkZWZhdWx0OiB0cnVlIH0sXHJcbiAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgICAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ09wZW4gTmV4dXMgTW9kcycpIHtcclxuICAgICAgICAgICAgICAgIHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL2JhbGR1cnNnYXRlMy9tb2RzLzE0MT90YWI9ZGVzY3JpcHRpb24nKS5jYXRjaCgoKSA9PiBudWxsKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIGRpc21pc3MgYW55d2F5XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICBdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRHYW1lUGF0aChhcGkpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgcmV0dXJuIHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aCBhcyBzdHJpbmc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEdhbWVEYXRhUGF0aChhcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgY29uc3QgZ2FtZVBhdGggPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGg7XHJcbiAgaWYgKGdhbWVQYXRoICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oZ2FtZVBhdGgsICdEYXRhJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBPUklHSU5BTF9GSUxFUyA9IG5ldyBTZXQoW1xyXG4gICdhc3NldHMucGFrJyxcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2VmZmVjdHMucGFrJyxcclxuICAnZW5naW5lLnBhaycsXHJcbiAgJ2VuZ2luZXNoYWRlcnMucGFrJyxcclxuICAnZ2FtZS5wYWsnLFxyXG4gICdnYW1lcGxhdGZvcm0ucGFrJyxcclxuICAnZ3VzdGF2LnBhaycsXHJcbiAgJ2d1c3Rhdl90ZXh0dXJlcy5wYWsnLFxyXG4gICdpY29ucy5wYWsnLFxyXG4gICdsb3d0ZXgucGFrJyxcclxuICAnbWF0ZXJpYWxzLnBhaycsXHJcbiAgJ21pbmltYXBzLnBhaycsXHJcbiAgJ21vZGVscy5wYWsnLFxyXG4gICdzaGFyZWQucGFrJyxcclxuICAnc2hhcmVkc291bmRiYW5rcy5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZHMucGFrJyxcclxuICAndGV4dHVyZXMucGFrJyxcclxuICAndmlydHVhbHRleHR1cmVzLnBhaycsXHJcbl0pO1xyXG5cclxuY29uc3QgTFNMSUJfRklMRVMgPSBuZXcgU2V0KFtcclxuICAnZGl2aW5lLmV4ZScsXHJcbiAgJ2xzbGliLmRsbCcsXHJcbl0pO1xyXG5cclxuZnVuY3Rpb24gaXNMU0xpYihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xyXG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XHJcbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIExTTElCX0ZJTEVTLmhhcyhwYXRoLmJhc2VuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkpKTtcclxuICByZXR1cm4gb3JpZ0ZpbGUgIT09IHVuZGVmaW5lZFxyXG4gICAgPyBCbHVlYmlyZC5yZXNvbHZlKHRydWUpXHJcbiAgICA6IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaXNCRzNTRShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xyXG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XHJcbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIChwYXRoLmJhc2VuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkgPT09ICdkd3JpdGUuZGxsJykpO1xyXG4gIHJldHVybiBvcmlnRmlsZSAhPT0gdW5kZWZpbmVkXHJcbiAgICA/IEJsdWViaXJkLnJlc29sdmUodHJ1ZSlcclxuICAgIDogQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RMU0xpYihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbiAgfVxyXG4gIGNvbnN0IG1hdGNoZWRGaWxlcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IExTTElCX0ZJTEVTLmhhcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiBtYXRjaGVkRmlsZXMubGVuZ3RoID49IDIsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdEJHM1NFKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgXHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGhhc0RXcml0ZURsbCA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICdkd3JpdGUuZGxsJykgIT09IHVuZGVmaW5lZDtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiBoYXNEV3JpdGVEbGwsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbExTTGliKGZpbGVzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgY29uc3QgZXhlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZS50b0xvd2VyQ2FzZSgpKSA9PT0gJ2RpdmluZS5leGUnKTtcclxuICBjb25zdCBleGVQYXRoID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgZXhlKTtcclxuICBsZXQgdmVyOiBzdHJpbmcgPSBhd2FpdCBnZXRWZXJzaW9uKGV4ZVBhdGgpO1xyXG4gIHZlciA9IHZlci5zcGxpdCgnLicpLnNsaWNlKDAsIDMpLmpvaW4oJy4nKTtcclxuXHJcbiAgLy8gVW5mb3J0dW5hdGVseSB0aGUgTFNMaWIgZGV2ZWxvcGVyIGlzIG5vdCBjb25zaXN0ZW50IHdoZW4gY2hhbmdpbmdcclxuICAvLyAgZmlsZSB2ZXJzaW9ucyAtIHRoZSBleGVjdXRhYmxlIGF0dHJpYnV0ZSBtaWdodCBoYXZlIGFuIG9sZGVyIHZlcnNpb25cclxuICAvLyAgdmFsdWUgdGhhbiB0aGUgb25lIHNwZWNpZmllZCBieSB0aGUgZmlsZW5hbWUgLSB3ZSdyZSBnb2luZyB0byB1c2VcclxuICAvLyAgdGhlIGZpbGVuYW1lIGFzIHRoZSBwb2ludCBvZiB0cnV0aCAqdWdoKlxyXG4gIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShkZXN0aW5hdGlvblBhdGgsIHBhdGguZXh0bmFtZShkZXN0aW5hdGlvblBhdGgpKTtcclxuICBjb25zdCBpZHggPSBmaWxlTmFtZS5pbmRleE9mKCctdicpO1xyXG4gIGNvbnN0IGZpbGVOYW1lVmVyID0gZmlsZU5hbWUuc2xpY2UoaWR4ICsgMik7XHJcbiAgaWYgKHNlbXZlci52YWxpZChmaWxlTmFtZVZlcikgJiYgdmVyICE9PSBmaWxlTmFtZVZlcikge1xyXG4gICAgdmVyID0gZmlsZU5hbWVWZXI7XHJcbiAgfVxyXG4gIGNvbnN0IHZlcnNpb25BdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdhdHRyaWJ1dGUnLCBrZXk6ICd2ZXJzaW9uJywgdmFsdWU6IHZlciB9O1xyXG4gIGNvbnN0IG1vZHR5cGVBdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdzZXRtb2R0eXBlJywgdmFsdWU6ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnIH07XHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9XHJcbiAgICBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZmlsZVBhdGgudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgICAuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgICAgICAgICAgIC5pbmRleE9mKCd0b29scycpICE9PSAtMVxyXG4gICAgICAmJiAhZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbigndG9vbHMnLCBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgWyBtb2R0eXBlQXR0ciwgdmVyc2lvbkF0dHIgXSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0VuZ2luZUluamVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xyXG4gICAgXHJcbiAgY29uc29sZS5sb2coJ2lzRW5naW5lSW5qZWN0b3IgaW5zdHJ1Y3Rpb25zOicsIGluc3RydWN0aW9ucyk7XHJcblxyXG4gIGlmIChpbnN0cnVjdGlvbnMuZmluZChpbnN0ID0+IGluc3QuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKS5pbmRleE9mKCdiaW4nKSA9PT0gMCkpIHsgLy8gaWYgdGhpcyBzdGFydHMgaW4gYSBiaW4gZm9sZGVyP1xyXG5cclxuICAgIFxyXG4gICAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdDb25maXJtIG1vZCBpbnN0YWxsYXRpb24nLCB7XHJcbiAgICAgIHRleHQ6ICdUaGUgbW9kIHlvdVxcJ3JlIGFib3V0IHRvIGluc3RhbGwgY29udGFpbnMgZGxsIGZpbGVzIHRoYXQgd2lsbCBydW4gd2l0aCB0aGUgJyArXHJcbiAgICAgICAgJ2dhbWUsIGhhdmUgdGhlIHNhbWUgYWNjZXNzIHRvIHlvdXIgc3lzdGVtIGFuZCBjYW4gdGh1cyBjYXVzZSBjb25zaWRlcmFibGUgJyArXHJcbiAgICAgICAgJ2RhbWFnZSBvciBpbmZlY3QgeW91ciBzeXN0ZW0gd2l0aCBhIHZpcnVzIGlmIGl0XFwncyBtYWxpY2lvdXMuXFxuJyArXHJcbiAgICAgICAgJ1BsZWFzZSBpbnN0YWxsIHRoaXMgbW9kIG9ubHkgaWYgeW91IHJlY2VpdmVkIGl0IGZyb20gYSB0cnVzdHdvcnRoeSBzb3VyY2UgJyArXHJcbiAgICAgICAgJ2FuZCBpZiB5b3UgaGF2ZSBhIHZpcnVzIHNjYW5uZXIgYWN0aXZlIHJpZ2h0IG5vdy4nLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnQ29udGludWUnLCBkZWZhdWx0OiB0cnVlICB9LFxyXG4gICAgXSkudGhlbihyZXN1bHQgPT4gcmVzdWx0LmFjdGlvbiA9PT0gJ0NvbnRpbnVlJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzTG9vc2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdKTogQmx1ZWJpcmQ8Ym9vbGVhbj4geyBcclxuXHJcbiAgLy8gb25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zXHJcbiAgY29uc3QgY29weUluc3RydWN0aW9ucyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gaW5zdHIudHlwZSA9PT0gJ2NvcHknKTtcclxuXHJcbiAgLy8gZG8gd2UgaGF2ZSBhIGRhdGEgZm9sZGVyPyBcclxuICBjb25zdCBoYXNEYXRhRm9sZGVyOmJvb2xlYW4gPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cclxuICAgIGluc3RyLnNvdXJjZS5pbmRleE9mKCdEYXRhJyArIHBhdGguc2VwKSAhPT0gLTEpICE9PSB1bmRlZmluZWQ7XHJcblxyXG4gIC8vIGRvIHdlIGhhdmUgYSBwdWJsaWMgb3IgZ2VuZXJhdGVkIGZvbGRlcj9cclxuICBjb25zdCBoYXNHZW5PclB1YmxpY0ZvbGRlcjpib29sZWFuID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XHJcbiAgICBpbnN0ci5zb3VyY2UuaW5kZXhPZignR2VuZXJhdGVkJyArIHBhdGguc2VwKSAhPT0gLTEgfHwgXHJcbiAgICBpbnN0ci5zb3VyY2UuaW5kZXhPZignUHVibGljJyArIHBhdGguc2VwKSAhPT0gLTFcclxuICAgICkgIT09IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc29sZS5sb2coJ2lzTG9vc2UnLCB7IGluc3RydWN0aW9uczogaW5zdHJ1Y3Rpb25zLCBoYXNEYXRhRm9sZGVyOiBoYXNEYXRhRm9sZGVyIHx8IGhhc0dlbk9yUHVibGljRm9sZGVyIH0pO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShoYXNEYXRhRm9sZGVyIHx8IGhhc0dlbk9yUHVibGljRm9sZGVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNSZXBsYWNlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSk6IEJsdWViaXJkPGJvb2xlYW4+IHtcclxuXHJcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xyXG5cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpKTtcclxuXHJcbiAgY29uc29sZS5sb2coJ2lzUmVwbGFjZXInLCAge29yaWdGaWxlOiBvcmlnRmlsZSwgcGFrczogcGFrc30pO1xyXG5cclxuICAvL2lmICgob3JpZ0ZpbGUgIT09IHVuZGVmaW5lZCkgfHwgKHBha3MubGVuZ3RoID09PSAwKSkge1xyXG4gIGlmICgob3JpZ0ZpbGUgIT09IHVuZGVmaW5lZCkpIHtcclxuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIGxvb2tzIGxpa2UgYSByZXBsYWNlcicsIHtcclxuICAgICAgYmJjb2RlOiAnVGhlIG1vZCB5b3UganVzdCBpbnN0YWxsZWQgbG9va3MgbGlrZSBhIFwicmVwbGFjZXJcIiwgbWVhbmluZyBpdCBpcyBpbnRlbmRlZCB0byByZXBsYWNlICdcclxuICAgICAgICAgICsgJ29uZSBvZiB0aGUgZmlsZXMgc2hpcHBlZCB3aXRoIHRoZSBnYW1lLjxici8+J1xyXG4gICAgICAgICAgKyAnWW91IHNob3VsZCBiZSBhd2FyZSB0aGF0IHN1Y2ggYSByZXBsYWNlciBpbmNsdWRlcyBhIGNvcHkgb2Ygc29tZSBnYW1lIGRhdGEgZnJvbSBhICdcclxuICAgICAgICAgICsgJ3NwZWNpZmljIHZlcnNpb24gb2YgdGhlIGdhbWUgYW5kIG1heSB0aGVyZWZvcmUgYnJlYWsgYXMgc29vbiBhcyB0aGUgZ2FtZSBnZXRzIHVwZGF0ZWQuPGJyLz4nXHJcbiAgICAgICAgICArICdFdmVuIGlmIGRvZXNuXFwndCBicmVhaywgaXQgbWF5IHJldmVydCBidWdmaXhlcyB0aGF0IHRoZSBnYW1lICdcclxuICAgICAgICAgICsgJ2RldmVsb3BlcnMgaGF2ZSBtYWRlLjxici8+PGJyLz4nXHJcbiAgICAgICAgICArICdUaGVyZWZvcmUgW2NvbG9yPVwicmVkXCJdcGxlYXNlIHRha2UgZXh0cmEgY2FyZSB0byBrZWVwIHRoaXMgbW9kIHVwZGF0ZWRbL2NvbG9yXSBhbmQgcmVtb3ZlIGl0IHdoZW4gaXQgJ1xyXG4gICAgICAgICAgKyAnbm8gbG9uZ2VyIG1hdGNoZXMgdGhlIGdhbWUgdmVyc2lvbi4nLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBNb2QgKHdpbGwgbGlrZWx5IG5vdCB3b3JrKScgfSxcclxuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgUmVwbGFjZXInLCBkZWZhdWx0OiB0cnVlIH0sXHJcbiAgICBdKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuYWN0aW9uID09PSAnSW5zdGFsbCBhcyBSZXBsYWNlcicpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IEJsdWViaXJkPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZDogcGFrcy5sZW5ndGggPT09IDAsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IEJsdWViaXJkPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoZmlsZXMubWFwKGZpbGUgPT4gcGF0aC5kaXJuYW1lKGZpbGUpLnRvVXBwZXJDYXNlKCkpKSk7XHJcbiAgbGV0IGRhdGFQYXRoOiBzdHJpbmcgPSBkaXJlY3Rvcmllcy5maW5kKGRpciA9PiBwYXRoLmJhc2VuYW1lKGRpcikgPT09ICdEQVRBJyk7XHJcbiAgaWYgKGRhdGFQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGNvbnN0IGdlbk9yUHVibGljID0gZGlyZWN0b3JpZXNcclxuICAgICAgLmZpbmQoZGlyID0+IFsnUFVCTElDJywgJ0dFTkVSQVRFRCddLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZGlyKSkpO1xyXG4gICAgaWYgKGdlbk9yUHVibGljICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGF0YVBhdGggPSBwYXRoLmRpcm5hbWUoZ2VuT3JQdWJsaWMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IChkYXRhUGF0aCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBmaWxlcy5yZWR1Y2UoKHByZXY6IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcclxuICAgICAgICByZXR1cm4gcHJldjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkYXRhUGF0aCwgZmlsZVBhdGgpO1xyXG4gICAgICBpZiAoIXJlbFBhdGguc3RhcnRzV2l0aCgnLi4nKSkge1xyXG4gICAgICAgIHByZXYucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHJlbFBhdGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LCBbXSlcclxuICAgIDogZmlsZXMubWFwKChmaWxlUGF0aDogc3RyaW5nKTogdHlwZXMuSUluc3RydWN0aW9uID0+ICh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgZGVzdGluYXRpb246IGZpbGVQYXRoLFxyXG4gICAgICB9KSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgIGluc3RydWN0aW9ucyxcclxuICB9KTtcclxufVxyXG5cclxuY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xyXG4gIGxldCBjYWNoZWQgPSBbXTtcclxuICB0cnkge1xyXG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXHJcbiAgICAgICAgLmZpbHRlcihuYW1lID0+IChwYXRoLmV4dG5hbWUobmFtZSkgPT09ICcnKSAmJiAobmFtZSAhPT0gJ0RlZmF1bHQnKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICgpID0+IGNhY2hlZDtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIGdhbWVTdXBwb3J0c1Byb2ZpbGUoZ2FtZVZlcnNpb246IHN0cmluZykge1xyXG4gIHJldHVybiBzZW12ZXIubHQoc2VtdmVyLmNvZXJjZShnYW1lVmVyc2lvbiksICc0LjEuMjA2Jyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbChwcm9wcykge1xyXG4gIGNvbnN0IHsgdCwgZ2FtZVZlcnNpb24sIG9uSW5zdGFsbExTTGliLFxyXG4gICAgICAgICAgb25TZXRQbGF5ZXJQcm9maWxlLCBpc0xzTGliSW5zdGFsbGVkIH0gPSBwcm9wcztcclxuXHJcbiAgY29uc3Qgc3VwcG9ydHNQcm9maWxlcyA9IGdhbWVTdXBwb3J0c1Byb2ZpbGUoZ2FtZVZlcnNpb24pO1xyXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gc3VwcG9ydHNQcm9maWxlcyA/IHByb3BzLmN1cnJlbnRQcm9maWxlIDogJ1B1YmxpYyc7XHJcblxyXG4gIGNvbnN0IG9uU2VsZWN0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2KSA9PiB7XHJcbiAgICBvblNldFBsYXllclByb2ZpbGUoZXYuY3VycmVudFRhcmdldC52YWx1ZSk7XHJcbiAgfSwgW29uU2V0UGxheWVyUHJvZmlsZV0pO1xyXG5cclxuICByZXR1cm4gaXNMc0xpYkluc3RhbGxlZCgpID8gKFxyXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICcxMnB4JywgbWFyZ2luUmlnaHQ6ICcxNnB4JyB9fT4gICAgICBcclxuICAgICAgPEFsZXJ0IGJzU3R5bGU9J3dhcm5pbmcnIHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzhweCcgfX0+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYFZlcnNpb24gMC4zIG9mIHRoZSBleHRlbnNpb24gaXMgYWxtb3N0IGEgY29tcGxldGUgcmV3cml0ZSBvZiBsb2FkIG9yZGVyIGFuZCBtaWdyYXRpb24gZnJvbSBwcmV2aW91cyB2ZXJzaW9ucyBtYXkgY2F1c2UgaXNzdWVzLlxyXG4gICAgICAgIEEgUHVyZ2UgdGhlbiBhIERlcGxveSB3aWxsIG5vcm1hbGx5IHNvbHZlIGFsbCBpc3N1ZXMgYnV0IHBsZWFzZSBtYWtlIGEgYmFja3VwIGZpcnN0IHVzaW5nIEV4cG9ydC4uLiBhcyB0aGUgbG9hZCBvcmRlciB3aWxsIGJlIHJlc2V0LmApfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYEEgYmFja3VwIGlzIG1hZGUgb2YgdGhlIGdhbWUncyBtb2RzZXR0aW5ncy5sc3ggZmlsZSBiZWZvcmUgYW55dGhpbmcgaXMgY2hhbmdlZC5cclxuICAgICAgICBUaGlzIGNhbiBiZSBmb3VuZCBhdCAlQVBQREFUQSVcXFxcTG9jYWxcXFxcTGFyaWFuIFN0dWRpb3NcXFxcQmFsZHVyJ3MgR2F0ZSAzXFxcXFBsYXllclByb2ZpbGVzXFxcXFB1YmxpY1xcXFxtb2RzZXR0aW5ncy5sc3guYmFja3VwYCl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvQWxlcnQ+ICAgIFxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBEcmFnIGFuZCBEcm9wIFBBSyBmaWxlcyB0byByZW9yZGVyIGhvdyB0aGUgZ2FtZSBsb2FkcyB0aGVtLiBQbGVhc2Ugbm90ZSwgc29tZSBtb2RzIGNvbnRhaW4gbXVsdGlwbGUgUEFLIGZpbGVzLmApfVxyXG4gICAgICA8L2Rpdj4gIFxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBNb2QgZGVzY3JpcHRpb25zIGZyb20gbW9kIGF1dGhvcnMgbWF5IGhhdmUgaW5mb3JtYXRpb24gdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IG9yZGVyLmApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBnYW1lIGFuZCBjYW4gdGhlcmVmb3JlIG5vdCBiZSBsb2FkLW9yZGVyZWQgYnkgbW9kIG1hbmFnZXJzLiBcclxuICAgICAgICBJZiB5b3UgbmVlZCB0byBkaXNhYmxlIHN1Y2ggYSBtb2QsIHBsZWFzZSBkbyBzbyBpbiBWb3J0ZXhcXCdzIE1vZHMgcGFnZS5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XHJcbiAgICAgICAge3QoJ0ltcG9ydCBhbmQgRXhwb3J0Jyl9XHJcbiAgICAgIDwvaDQ+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYEltcG9ydCBpcyBhbiBleHBlcmltZW50YWwgdG9vbCB0byBoZWxwIG1pZ3JhdGlvbiBmcm9tIGEgZ2FtZSBsb2FkIG9yZGVyICgubHN4IGZpbGUpIHRvIFZvcnRleC4gSXQgd29ya3MgYnkgaW1wb3J0aW5nIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MgZmlsZVxyXG4gICAgICAgIGFuZCBhdHRlbXB0cyB0byBtYXRjaCB1cCBtb2RzIHRoYXQgaGF2ZSBiZWVuIGluc3RhbGxlZCBieSBWb3J0ZXguYCl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBFeHBvcnQgY2FuIGJlIHVzZWQgdG8gbWFudWFsbHkgdXBkYXRlIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MubHN4IGZpbGUgaWYgJ1NldHRpbmdzID4gTW9kcyA+IEF1dG8gZXhwb3J0IGxvYWQgb3JkZXInIGlzbid0IHNldCB0byBkbyB0aGlzIGF1dG9tYXRpY2FsbHkuIFxyXG4gICAgICAgIEl0IGNhbiBhbHNvIGJlIHVzZWQgdG8gZXhwb3J0IHRvIGEgZGlmZmVyZW50IGZpbGUgYXMgYSBiYWNrdXAuYCl9XHJcbiAgICAgIDwvZGl2PlxyXG4gIFxyXG4gICAgPC9kaXY+XHJcbiAgKSA6IChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMTJweCcgfX0+XHJcbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XHJcbiAgICAgICAge3QoJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKX1cclxuICAgICAgPC9oND5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnVG8gdGFrZSBmdWxsIGFkdmFudGFnZSBvZiBWb3J0ZXhcXCdzIEJhbGR1clxccyBHYXRlIDMgbW9kZGluZyBjYXBhYmlsaXRpZXMgc3VjaCBhcyBtYW5hZ2luZyB0aGUgJ1xyXG4gICAgICAgICArICdvcmRlciBpbiB3aGljaCBtb2RzIGFyZSBsb2FkZWQgaW50byB0aGUgZ2FtZTsgVm9ydGV4IHJlcXVpcmVzIGEgM3JkIHBhcnR5IHRvb2wgY2FsbGVkIExTTGliLicpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnUGxlYXNlIGluc3RhbGwgdGhlIGxpYnJhcnkgdXNpbmcgdGhlIGJ1dHRvbnMgYmVsb3cgdG8gbWFuYWdlIHlvdXIgbG9hZCBvcmRlci4nKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgICAgPHRvb2x0aXAuQnV0dG9uXHJcbiAgICAgICAgdG9vbHRpcD17J0luc3RhbGwgTFNMaWInfVxyXG4gICAgICAgIG9uQ2xpY2s9e29uSW5zdGFsbExTTGlifVxyXG4gICAgICA+XHJcbiAgICAgICAge3QoJ0luc3RhbGwgTFNMaWInKX1cclxuICAgICAgPC90b29sdGlwLkJ1dHRvbj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE93bkdhbWVWZXJzaW9uKHN0YXRlOiB0eXBlcy5JU3RhdGUpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIHJldHVybiBhd2FpdCB1dGlsLmdldEdhbWUoR0FNRV9JRCkuZ2V0SW5zdGFsbGVkVmVyc2lvbihkaXNjb3ZlcnkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIHJldHVybiBnYW1lU3VwcG9ydHNQcm9maWxlKGF3YWl0IGdldE93bkdhbWVWZXJzaW9uKGFwaS5nZXRTdGF0ZSgpKSlcclxuICAgID8gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlIHx8ICdnbG9iYWwnXHJcbiAgICA6ICdQdWJsaWMnO1xyXG59XHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMb2FkT3JkZXJPbGQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogYW55IH0pIHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSAoYmczcHJvZmlsZSA9PT0gJ2dsb2JhbCcpID8gZ2V0UGxheWVyUHJvZmlsZXMoKSA6IFtiZzNwcm9maWxlXTtcclxuICBpZiAocGxheWVyUHJvZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnYmczLW5vLXByb2ZpbGVzJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZTogJ05vIHBsYXllciBwcm9maWxlcycsXHJcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1uby1wcm9maWxlcycpO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcclxuXHJcbiAgICBjb25zdCByZWdpb24gPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RzTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgICBjb25zdCBsb05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKSA/PyB7IGNoaWxkcmVuOiBbXSB9O1xyXG4gICAgaWYgKChsb05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChsb05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XHJcbiAgICAgIGxvTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xyXG4gICAgfVxyXG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xyXG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xyXG4gICAgfVxyXG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxyXG4gICAgY29uc3QgZGVzY3JpcHRpb25Ob2RlcyA9IG1vZHNOb2RlPy5jaGlsZHJlbj8uWzBdPy5ub2RlPy5maWx0ZXI/LihpdGVyID0+XHJcbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09ICdHdXN0YXZEZXYnKSkpID8/IFtdO1xyXG5cclxuICAgIGNvbnN0IGVuYWJsZWRQYWtzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICEhbG9hZE9yZGVyW2tleV0uZGF0YT8udXVpZFxyXG4gICAgICAgICAgICAgICAgICAgICYmIGxvYWRPcmRlcltrZXldLmVuYWJsZWRcclxuICAgICAgICAgICAgICAgICAgICAmJiAhbG9hZE9yZGVyW2tleV0uZGF0YT8uaXNMaXN0ZWQpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdlbmFibGVkUGFrcycsIGVuYWJsZWRQYWtzKTtcclxuXHJcbiAgICAvLyBhZGQgbmV3IG5vZGVzIGZvciB0aGUgZW5hYmxlZCBtb2RzXHJcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBlbmFibGVkUGFrcykge1xyXG4gICAgICAvLyBjb25zdCBtZDUgPSBhd2FpdCB1dGlsLmZpbGVNRDUocGF0aC5qb2luKG1vZHNQYXRoKCksIGtleSkpO1xyXG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xyXG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXHJcbiAgICAgICAgYXR0cmlidXRlOiBbXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdGb2xkZXInLCB0eXBlOiAnTFNXU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEuZm9sZGVyIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm1kNSB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdOYW1lJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEubmFtZSB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdVVUlEJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudXVpZCB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdWZXJzaW9uJywgdHlwZTogJ2ludDMyJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudmVyc2lvbiB9IH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9hZE9yZGVyTm9kZXMgPSBlbmFibGVkUGFrc1xyXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcclxuICAgICAgLm1hcCgoa2V5OiBzdHJpbmcpOiBJTW9kTm9kZSA9PiAoe1xyXG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGUnIH0sXHJcbiAgICAgICAgYXR0cmlidXRlOiBbXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdVVUlEJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudXVpZCB9IH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSkpO1xyXG5cclxuICAgIG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBkZXNjcmlwdGlvbk5vZGVzO1xyXG4gICAgbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBsb2FkT3JkZXJOb2RlcztcclxuXHJcbiAgICBpZiAoYmczcHJvZmlsZSA9PT0gJ2dsb2JhbCcpIHtcclxuICAgICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzLCBiZzNwcm9maWxlKTtcclxuICAgIH1cclxuICAgIGZvciAoY29uc3QgcHJvZmlsZSBvZiBwbGF5ZXJQcm9maWxlcykge1xyXG4gICAgICB3cml0ZU1vZFNldHRpbmdzKGFwaSwgbW9kU2V0dGluZ3MsIHByb2ZpbGUpO1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0dGluZ3NXcml0dGVuKHByb2ZpbGUsIERhdGUubm93KCksIGVuYWJsZWRQYWtzLmxlbmd0aCkpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGdldExhdGVzdExTTGliTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXTtcclxuICBpZiAobW9kcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBsYXRlc3RWZXIgPSB1dGlsLmdldFNhZmUocHJldiwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmIChzZW12ZXIuZ3QoY3VycmVudFZlciwgbGF0ZXN0VmVyKSkge1xyXG4gICAgICAgICAgcHJldiA9IG1vZHNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgbW9kIHZlcnNpb24nLCB7IG1vZElkOiBpZCwgdmVyc2lvbjogY3VycmVudFZlciB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGxzTGliO1xyXG59XHJcblxyXG5jbGFzcyBEaXZpbmVFeGVjTWlzc2luZyBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJyk7XHJcbiAgICB0aGlzLm5hbWUgPSAnRGl2aW5lRXhlY01pc3NpbmcnO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGl2aW5lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogSURpdmluZU9wdGlvbnMpOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SURpdmluZU91dHB1dD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgbGV0IHJldHVybmVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBsZXQgc3Rkb3V0OiBzdHJpbmcgPSAnJztcclxuXHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xyXG4gICAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdMU0xpYi9EaXZpbmUgdG9vbCBpcyBtaXNzaW5nJyk7XHJcbiAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICBjb25zdCBleGUgPSBwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbHNMaWIuaW5zdGFsbGF0aW9uUGF0aCwgJ3Rvb2xzJywgJ2RpdmluZS5leGUnKTtcclxuICAgIGNvbnN0IGFyZ3MgPSBbXHJcbiAgICAgICctLWFjdGlvbicsIGFjdGlvbixcclxuICAgICAgJy0tc291cmNlJywgb3B0aW9ucy5zb3VyY2UsXHJcbiAgICAgICctLWxvZ2xldmVsJywgJ29mZicsXHJcbiAgICAgICctLWdhbWUnLCAnYmczJyxcclxuICAgIF07XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuZGVzdGluYXRpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcmdzLnB1c2goJy0tZGVzdGluYXRpb24nLCBvcHRpb25zLmRlc3RpbmF0aW9uKTtcclxuICAgIH1cclxuICAgIGlmIChvcHRpb25zLmV4cHJlc3Npb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcmdzLnB1c2goJy0tZXhwcmVzc2lvbicsIG9wdGlvbnMuZXhwcmVzc2lvbik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcHJvYyA9IHNwYXduKGV4ZSwgYXJncyk7XHJcblxyXG4gICAgcHJvYy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHN0ZG91dCArPSBkYXRhKTtcclxuICAgIHByb2Muc3RkZXJyLm9uKCdkYXRhJywgZGF0YSA9PiBsb2coJ3dhcm4nLCBkYXRhKSk7XHJcblxyXG4gICAgcHJvYy5vbignZXJyb3InLCAoZXJySW46IEVycm9yKSA9PiB7XHJcbiAgICAgIGlmICghcmV0dXJuZWQpIHtcclxuICAgICAgICBpZiAoZXJySW5bJ2NvZGUnXSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgICAgIHJlamVjdChuZXcgRGl2aW5lRXhlY01pc3NpbmcoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ2RpdmluZS5leGUgZmFpbGVkOiAnICsgZXJySW4ubWVzc2FnZSk7XHJcbiAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBwcm9jLm9uKCdleGl0JywgKGNvZGU6IG51bWJlcikgPT4ge1xyXG4gICAgICBpZiAoIXJldHVybmVkKSB7XHJcbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dCwgcmV0dXJuQ29kZTogMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKFsyLCAxMDJdLmluY2x1ZGVzKGNvZGUpKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dDogJycsIHJldHVybkNvZGU6IDIgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIGRpdmluZS5leGUgcmV0dXJucyB0aGUgYWN0dWFsIGVycm9yIGNvZGUgKyAxMDAgaWYgYSBmYXRhbCBlcnJvciBvY2N1cmVkXHJcbiAgICAgICAgICBpZiAoY29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICBjb2RlIC09IDEwMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7Y29kZX1gKTtcclxuICAgICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XHJcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBhayhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGgsIGRlc3RQYXRoLCBwYXR0ZXJuKSB7XHJcbiAgcmV0dXJuIGRpdmluZShhcGksICdleHRyYWN0LXBhY2thZ2UnLFxyXG4gICAgeyBzb3VyY2U6IHBha1BhdGgsIGRlc3RpbmF0aW9uOiBkZXN0UGF0aCwgZXhwcmVzc2lvbjogcGF0dGVybiB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdE1ldGEoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgY29uc3QgbWV0YVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdsc21ldGEnLCBzaG9ydGlkKCkpO1xyXG4gIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKG1ldGFQYXRoKTtcclxuICBhd2FpdCBleHRyYWN0UGFrKGFwaSwgcGFrUGF0aCwgbWV0YVBhdGgsICcqL21ldGEubHN4Jyk7XHJcbiAgdHJ5IHtcclxuICAgIC8vIHRoZSBtZXRhLmxzeCBtYXkgYmUgaW4gYSBzdWJkaXJlY3RvcnkuIFRoZXJlIGlzIHByb2JhYmx5IGEgcGF0dGVybiBoZXJlXHJcbiAgICAvLyBidXQgd2UnbGwganVzdCB1c2UgaXQgZnJvbSB3aGVyZXZlclxyXG4gICAgbGV0IG1ldGFMU1hQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4obWV0YVBhdGgsICdtZXRhLmxzeCcpO1xyXG4gICAgYXdhaXQgd2FsayhtZXRhUGF0aCwgZW50cmllcyA9PiB7XHJcbiAgICAgIGNvbnN0IHRlbXAgPSBlbnRyaWVzLmZpbmQoZSA9PiBwYXRoLmJhc2VuYW1lKGUuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09ICdtZXRhLmxzeCcpO1xyXG4gICAgICBpZiAodGVtcCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgbWV0YUxTWFBhdGggPSB0ZW1wLmZpbGVQYXRoO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobWV0YUxTWFBhdGgpO1xyXG4gICAgY29uc3QgbWV0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobWV0YVBhdGgpO1xyXG4gICAgcmV0dXJuIG1ldGE7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XHJcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH0gZWxzZSBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvbHVtbicpICYmIChlcnIubWVzc2FnZS5pbmNsdWRlcygnTGluZScpKSkge1xyXG4gICAgICAvLyBhbiBlcnJvciBtZXNzYWdlIHNwZWNpZnlpbmcgY29sdW1uIGFuZCByb3cgaW5kaWNhdGUgYSBwcm9ibGVtIHBhcnNpbmcgdGhlIHhtbCBmaWxlXHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgbWVzc2FnZTogJ1RoZSBtZXRhLmxzeCBmaWxlIGluIFwie3ttb2ROYW1lfX1cIiBpcyBpbnZhbGlkLCBwbGVhc2UgcmVwb3J0IHRoaXMgdG8gdGhlIGF1dGhvcicsXHJcbiAgICAgICAgYWN0aW9uczogW3tcclxuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0ludmFsaWQgbWV0YS5sc3ggZmlsZScsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICAgfSwgW3sgbGFiZWw6ICdDbG9zZScgfV0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfV0sXHJcbiAgICAgICAgcmVwbGFjZToge1xyXG4gICAgICAgICAgbW9kTmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kTm9kZTxUIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nIH0+LCBVPihub2RlczogVFtdLCBpZDogc3RyaW5nKTogVCB7XHJcbiAgcmV0dXJuIG5vZGVzPy5maW5kKGl0ZXIgPT4gaXRlci4kLmlkID09PSBpZCkgPz8gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5jb25zdCBsaXN0Q2FjaGU6IHsgW3BhdGg6IHN0cmluZ106IFByb21pc2U8c3RyaW5nW10+IH0gPSB7fTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxpc3RQYWNrYWdlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGRpdmluZShhcGksICdsaXN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCB9KTtcclxuICBjb25zdCBsaW5lcyA9IHJlcy5zdGRvdXQuc3BsaXQoJ1xcbicpLm1hcChsaW5lID0+IGxpbmUudHJpbSgpKS5maWx0ZXIobGluZSA9PiBsaW5lLmxlbmd0aCAhPT0gMCk7XHJcblxyXG4gIHJldHVybiBsaW5lcztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaXNMT0xpc3RlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIFxyXG4gIGlmIChsaXN0Q2FjaGVbcGFrUGF0aF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbGlzdENhY2hlW3Bha1BhdGhdID0gbGlzdFBhY2thZ2UoYXBpLCBwYWtQYXRoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxpbmVzID0gYXdhaXQgbGlzdENhY2hlW3Bha1BhdGhdO1xyXG4gIC8vIGNvbnN0IG5vbkdVSSA9IGxpbmVzLmZpbmQobGluZSA9PiAhbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKTtcclxuICBcclxuICBjb25zdCBtZXRhTFNYID0gbGluZXMuZmluZChsaW5lID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcclxuICBcclxuICAgIHJldHVybiBtZXRhTFNYID09PSB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWtJbmZvSW1wbChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJUGFrSW5mbz4ge1xyXG4gIGNvbnN0IG1ldGEgPSBhd2FpdCBleHRyYWN0TWV0YShhcGksIHBha1BhdGgsIG1vZCk7XHJcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobWV0YT8uc2F2ZT8ucmVnaW9uLCAnQ29uZmlnJyk7XHJcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICBjb25zdCBtb2R1bGVJbmZvID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHVsZUluZm8nKTtcclxuXHJcbiAgY29uc29sZS5sb2coJ21ldGEnLCBtZXRhKTtcclxuXHJcbiAgY29uc3QgYXR0ciA9IChuYW1lOiBzdHJpbmcsIGZhbGxiYWNrOiAoKSA9PiBhbnkpID0+XHJcbiAgICBmaW5kTm9kZShtb2R1bGVJbmZvPy5hdHRyaWJ1dGUsIG5hbWUpPy4kPy52YWx1ZSA/PyBmYWxsYmFjaygpO1xyXG5cclxuICBjb25zdCBnZW5OYW1lID0gcGF0aC5iYXNlbmFtZShwYWtQYXRoLCBwYXRoLmV4dG5hbWUocGFrUGF0aCkpO1xyXG5cclxuICBsZXQgaXNMaXN0ZWQgPSBhd2FpdCBpc0xPTGlzdGVkKGFwaSwgcGFrUGF0aCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBhdXRob3I6IGF0dHIoJ0F1dGhvcicsICgpID0+ICdVbmtub3duJyksXHJcbiAgICBkZXNjcmlwdGlvbjogYXR0cignRGVzY3JpcHRpb24nLCAoKSA9PiAnTWlzc2luZycpLFxyXG4gICAgZm9sZGVyOiBhdHRyKCdGb2xkZXInLCAoKSA9PiBnZW5OYW1lKSxcclxuICAgIG1kNTogYXR0cignTUQ1JywgKCkgPT4gJycpLFxyXG4gICAgbmFtZTogYXR0cignTmFtZScsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgdHlwZTogYXR0cignVHlwZScsICgpID0+ICdBZHZlbnR1cmUnKSxcclxuICAgIHV1aWQ6IGF0dHIoJ1VVSUQnLCAoKSA9PiByZXF1aXJlKCd1dWlkJykudjQoKSksXHJcbiAgICB2ZXJzaW9uOiBhdHRyKCdWZXJzaW9uJywgKCkgPT4gJzEnKSxcclxuICAgIGlzTGlzdGVkOiBpc0xpc3RlZFxyXG4gIH07XHJcbn1cclxuXHJcbmNvbnN0IGZhbGxiYWNrUGljdHVyZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdnYW1lYXJ0LmpwZycpO1xyXG5cclxubGV0IHN0b3JlZExPOiBhbnlbXTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xyXG4gIGNvbnN0IG5hbWUgPSBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ05hbWUnKS4kLnZhbHVlO1xyXG4gIHJldHVybiB7XHJcbiAgICBpZDogbmFtZSxcclxuICAgIG5hbWUsXHJcbiAgICBkYXRhOiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kLnZhbHVlLFxyXG4gIH07XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IGdldFBsYXllclByb2ZpbGVzKCk7XHJcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgc3RvcmVkTE8gPSBbXTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJylcclxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcclxuICAgIDogcGF0aC5qb2luKGdsb2JhbFByb2ZpbGVQYXRoKCksICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHNldHRpbmdzUGF0aCk7XHJcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBiZzNwcm9maWxlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBpZiAoIWJnM3Byb2ZpbGUpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJykgXHJcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXHJcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcblxyXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKHNldHRpbmdzUGF0aCkpO1xyXG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoc2V0dGluZ3NQYXRoLCB4bWwpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgc3RvcmVkTE8gPSBbXTtcclxuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIHNldHRpbmdzJywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFN0b3JlZExPKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICBjb25zdCBtb2RzUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuICBjb25zdCBtb2ROb2RlcyA9IG1vZHNSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG5cclxuICBjb25zdCBtb2RPcmRlciA9IG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xyXG5cclxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgdlByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGVuYWJsZWQgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIoaWQgPT5cclxuICAgIHV0aWwuZ2V0U2FmZSh2UHJvZmlsZSwgWydtb2RTdGF0ZScsIGlkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAoZW5hYmxlZC5sZW5ndGggPiAwICYmIG1vZE5vZGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgY29uc3QgbGFzdFdyaXRlID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5zZXR0aW5nc1dyaXR0ZW4/LltiZzNwcm9maWxlXTtcclxuICAgIGlmICgobGFzdFdyaXRlICE9PSB1bmRlZmluZWQpICYmIChsYXN0V3JpdGUuY291bnQgPiAxKSkge1xyXG4gICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdcIm1vZHNldHRpbmdzLmxzeFwiIGZpbGUgd2FzIHJlc2V0Jywge1xyXG4gICAgICAgIHRleHQ6ICdUaGUgZ2FtZSByZXNldCB0aGUgbGlzdCBvZiBhY3RpdmUgbW9kcyBhbmQgcmFuIHdpdGhvdXQgdGhlbS5cXG4nXHJcbiAgICAgICAgICAgICsgJ1RoaXMgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgb3IgaW5jb21wYXRpYmxlIG1vZCBpcyBpbnN0YWxsZWQuICdcclxuICAgICAgICAgICAgKyAnVGhlIGdhbWUgd2lsbCBub3QgbG9hZCBhbnkgbW9kcyBpZiBvbmUgb2YgdGhlbSBpcyBpbmNvbXBhdGlibGUsIHVuZm9ydHVuYXRlbHkgJ1xyXG4gICAgICAgICAgICArICd0aGVyZSBpcyBubyBlYXN5IHdheSB0byBmaW5kIG91dCB3aGljaCBvbmUgY2F1c2VkIHRoZSBwcm9ibGVtLicsXHJcbiAgICAgIH0sIFtcclxuICAgICAgICB7IGxhYmVsOiAnQ29udGludWUnIH0sXHJcbiAgICAgIF0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xyXG4gICAgLm1hcChub2RlID0+IHBhcnNlTW9kTm9kZShub2RlKSlcclxuICAgIC8vIEd1c3RhdiBpcyB0aGUgY29yZSBnYW1lXHJcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcclxuICAgIC8vIHNvcnQgYnkgdGhlIGluZGV4IG9mIGVhY2ggbW9kIGluIHRoZSBtb2RPcmRlciBsaXN0XHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG1vZE9yZGVyXHJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLTGlzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBsZXQgcGFrczogc3RyaW5nW107XHJcbiAgdHJ5IHtcclxuICAgIHBha3MgPSAoYXdhaXQgZnMucmVhZGRpckFzeW5jKG1vZHNQYXRoKCkpKVxyXG4gICAgICAuZmlsdGVyKGZpbGVOYW1lID0+IHBhdGguZXh0bmFtZShmaWxlTmFtZSkudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKCksICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gbm9wXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZHMgZGlyZWN0b3J5JywgZXJyLCB7XHJcbiAgICAgICAgaWQ6ICdiZzMtZmFpbGVkLXJlYWQtbW9kcycsXHJcbiAgICAgICAgbWVzc2FnZTogbW9kc1BhdGgoKSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBwYWtzID0gW107XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFrcztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKVxyXG4gICAgOiBQcm9taXNlPEFycmF5PHsgZmlsZU5hbWU6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kLCBpbmZvOiBJUGFrSW5mbyB9Pj4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbHNMaWIgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xyXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG4gIFxyXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLTGlzdChhcGkpO1xyXG5cclxuICBjb25zb2xlLmxvZygncGFrcycsIHsgcGFrczogcGFrcyB9KTtcclxuXHJcbiAgbGV0IG1hbmlmZXN0O1xyXG4gIHRyeSB7XHJcbiAgICBtYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCAnJywgR0FNRV9JRCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgZGVwbG95bWVudCBtYW5pZmVzdCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IFByb21pc2UuYWxsKHBha3MubWFwKGFzeW5jIGZpbGVOYW1lID0+IHtcclxuICAgIHJldHVybiB1dGlsLndpdGhFcnJvckNvbnRleHQoJ3JlYWRpbmcgcGFrJywgZmlsZU5hbWUsICgpID0+IHtcclxuICAgICAgY29uc3QgZnVuYyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IG1hbmlmZXN0LmZpbGVzLmZpbmQoZW50cnkgPT4gZW50cnkucmVsUGF0aCA9PT0gZmlsZU5hbWUpO1xyXG4gICAgICAgICAgY29uc3QgbW9kID0gKG1hbmlmZXN0RW50cnkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgPyBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF0/LlttYW5pZmVzdEVudHJ5LnNvdXJjZV1cclxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgY29uc3QgcGFrUGF0aCA9IHBhdGguam9pbihtb2RzUGF0aCgpLCBmaWxlTmFtZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZmlsZU5hbWUsXHJcbiAgICAgICAgICAgIG1vZCxcclxuICAgICAgICAgICAgaW5mbzogYXdhaXQgZXh0cmFjdFBha0luZm9JbXBsKGFwaSwgcGFrUGF0aCwgbW9kKSxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGl2aW5lRXhlY01pc3NpbmcpIHtcclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdUaGUgaW5zdGFsbGVkIGNvcHkgb2YgTFNMaWIvRGl2aW5lIGlzIGNvcnJ1cHRlZCAtIHBsZWFzZSAnXHJcbiAgICAgICAgICAgICAgKyAnZGVsZXRlIHRoZSBleGlzdGluZyBMU0xpYiBtb2QgZW50cnkgYW5kIHJlLWluc3RhbGwgaXQuIE1ha2Ugc3VyZSB0byAnXHJcbiAgICAgICAgICAgICAgKyAnZGlzYWJsZSBvciBhZGQgYW55IG5lY2Vzc2FyeSBleGNlcHRpb25zIHRvIHlvdXIgc2VjdXJpdHkgc29mdHdhcmUgdG8gJ1xyXG4gICAgICAgICAgICAgICsgJ2Vuc3VyZSBpdCBkb2VzIG5vdCBpbnRlcmZlcmUgd2l0aCBWb3J0ZXgvTFNMaWIgZmlsZSBvcGVyYXRpb25zLic7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0RpdmluZSBleGVjdXRhYmxlIGlzIG1pc3NpbmcnLCBtZXNzYWdlLFxyXG4gICAgICAgICAgICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gY291bGQgaGFwcGVuIGlmIHRoZSBmaWxlIGdvdCBkZWxldGVkIHNpbmNlIHJlYWRpbmcgdGhlIGxpc3Qgb2YgcGFrcy5cclxuICAgICAgICAgIC8vIGFjdHVhbGx5LCB0aGlzIHNlZW1zIHRvIGJlIGZhaXJseSBjb21tb24gd2hlbiB1cGRhdGluZyBhIG1vZFxyXG4gICAgICAgICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBwYWsuIFBsZWFzZSBtYWtlIHN1cmUgeW91IGFyZSB1c2luZyB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgTFNMaWIgYnkgdXNpbmcgdGhlIFwiUmUtaW5zdGFsbCBMU0xpYi9EaXZpbmVcIiB0b29sYmFyIGJ1dHRvbiBvbiB0aGUgTW9kcyBwYWdlLicsIGVyciwge1xyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgICBtZXNzYWdlOiBmaWxlTmFtZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZnVuYygpKTtcclxuICAgIH0pO1xyXG4gIH0pKTtcclxuXHJcbiAgcmV0dXJuIHJlcy5maWx0ZXIoaXRlciA9PiBpdGVyICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkTE8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG4gICAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xyXG4gICAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcbiAgICBjb25zdCBtb2RPcmRlck5vZGVzID0gbW9kT3JkZXJSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG4gICAgcmV0dXJuIG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbW9kc2V0dGluZ3MubHN4JywgZXJyLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgY3JlYXRlIGEgcHJvZmlsZSBpbi1nYW1lJyxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZUxvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG9yZGVyKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gIGNvbnNvbGUubG9nKCdzZXJpYWxpemVMb2FkT3JkZXInKTtcclxuXHJcbiAgcmV0dXJuIHdyaXRlTG9hZE9yZGVyT2xkKGFwaSwgb3JkZXIpO1xyXG59XHJcblxyXG5jb25zdCBkZXNlcmlhbGl6ZURlYm91bmNlciA9IG5ldyB1dGlsLkRlYm91bmNlcigoKSA9PiB7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59LCAxMDAwKTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRlc2VyaWFsaXplTG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8YW55PiB7XHJcblxyXG4gIC8vIHRoaXMgZnVuY3Rpb24gbWlnaHQgYmUgaW52b2tlZCBieSB0aGUgbHNsaWIgbW9kIGJlaW5nICh1bilpbnN0YWxsZWQgaW4gd2hpY2ggY2FzZSBpdCBtaWdodCBiZVxyXG4gIC8vIGluIHRoZSBtaWRkbGUgb2YgYmVpbmcgdW5wYWNrZWQgb3IgcmVtb3ZlZCB3aGljaCBsZWFkcyB0byB3ZWlyZCBlcnJvciBtZXNzYWdlcy5cclxuICAvLyB0aGlzIGlzIGEgaGFjayBob3BlZnVsbHkgZW5zdXJlaW5nIHRoZSBpdCdzIGVpdGhlciBmdWxseSB0aGVyZSBvciBub3QgYXQgYWxsXHJcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gZGVzZXJpYWxpemVEZWJvdW5jZXIuc2NoZWR1bGUoY2IpKTtcclxuXHJcbiAgY29uc29sZS5sb2coJ2Rlc2VyaWFsaXplTG9hZE9yZGVyJyk7XHJcblxyXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLcyhhcGkpO1xyXG4gIGNvbnN0IG9yZGVyID0gYXdhaXQgcmVhZExPKGFwaSk7XHJcbiAgXHJcbiAgY29uc29sZS5sb2coJ3Bha3MnLCBwYWtzKTtcclxuICBjb25zb2xlLmxvZygnb3JkZXInLCBvcmRlcik7XHJcblxyXG4gIGNvbnN0IG9yZGVyVmFsdWUgPSAoaW5mbzogSVBha0luZm8pID0+IHtcclxuICAgIHJldHVybiBvcmRlci5pbmRleE9mKGluZm8udXVpZCkgKyAoaW5mby5pc0xpc3RlZCA/IDAgOiAxMDAwKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gcGFrc1xyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBvcmRlclZhbHVlKGxocy5pbmZvKSAtIG9yZGVyVmFsdWUocmhzLmluZm8pKVxyXG4gICAgLm1hcCgoeyBmaWxlTmFtZSwgbW9kLCBpbmZvIH0pID0+ICh7XHJcbiAgICAgIGlkOiBmaWxlTmFtZSxcclxuICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgbmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXHJcbiAgICAgIG1vZElkOiBtb2Q/LmlkLFxyXG4gICAgICBsb2NrZWQ6IGluZm8uaXNMaXN0ZWQsXHJcbiAgICAgIGRhdGE6IGluZm8sXHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlKGJlZm9yZSwgYWZ0ZXIpOiBQcm9taXNlPGFueT4ge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxubGV0IGZvcmNlUmVmcmVzaDogKCkgPT4gdm9pZDtcclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCByZWZyZXNoOiAoKSA9PiB2b2lkIH0pIHtcclxuICBjb25zdCB7IGFwaSB9ID0gcHJvcHM7XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XHJcbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LnBsYXllclByb2ZpbGUpO1xyXG5cclxuICBjb25zdCBbZ2FtZVZlcnNpb24sIHNldEdhbWVWZXJzaW9uXSA9IFJlYWN0LnVzZVN0YXRlPHN0cmluZz4oKTtcclxuXHJcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGZvcmNlUmVmcmVzaCA9IHByb3BzLnJlZnJlc2g7XHJcbiAgfSwgW10pO1xyXG5cclxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgc2V0R2FtZVZlcnNpb24oYXdhaXQgZ2V0T3duR2FtZVZlcnNpb24oYXBpLmdldFN0YXRlKCkpKTtcclxuICAgIH0pKCk7XHJcbiAgfSwgW10pO1xyXG5cclxuICBjb25zdCBvblNldFByb2ZpbGUgPSBSZWFjdC51c2VDYWxsYmFjaygocHJvZmlsZU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3QgaW1wbCA9IGFzeW5jICgpID0+IHtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFBsYXllclByb2ZpbGUocHJvZmlsZU5hbWUpKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBmb3JjZVJlZnJlc2g/LigpO1xyXG4gICAgfTtcclxuICAgIGltcGwoKTtcclxuICB9LCBbIGFwaSBdKTtcclxuXHJcbiAgY29uc3QgaXNMc0xpYkluc3RhbGxlZCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcclxuICAgIHJldHVybiBnZXRMYXRlc3RMU0xpYk1vZChhcGkpICE9PSB1bmRlZmluZWQ7XHJcbiAgfSwgWyBhcGkgXSk7XHJcblxyXG4gIGNvbnN0IG9uSW5zdGFsbExTTGliID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xyXG4gICAgb25HYW1lTW9kZUFjdGl2YXRlZChhcGksIEdBTUVfSUQpO1xyXG4gIH0sIFthcGldKTtcclxuXHJcbiAgaWYgKCFnYW1lVmVyc2lvbikge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPEluZm9QYW5lbFxyXG4gICAgICB0PXthcGkudHJhbnNsYXRlfVxyXG4gICAgICBnYW1lVmVyc2lvbj17Z2FtZVZlcnNpb259XHJcbiAgICAgIGN1cnJlbnRQcm9maWxlPXtjdXJyZW50UHJvZmlsZX1cclxuICAgICAgb25TZXRQbGF5ZXJQcm9maWxlPXtvblNldFByb2ZpbGV9XHJcbiAgICAgIGlzTHNMaWJJbnN0YWxsZWQ9e2lzTHNMaWJJbnN0YWxsZWR9XHJcbiAgICAgIG9uSW5zdGFsbExTTGliPXtvbkluc3RhbGxMU0xpYn1cclxuICAgIC8+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cclxuICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG5cclxuICByZXR1cm4gT2JqZWN0LmtleXMobW9kcykucmVkdWNlKChwcmV2LCBpZCkgPT4ge1xyXG4gICAgaWYgKG1vZHNbaWRdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKSB7XHJcbiAgICAgIGNvbnN0IGFyY0lkID0gbW9kc1tpZF0uYXJjaGl2ZUlkO1xyXG4gICAgICBjb25zdCBkbDogdHlwZXMuSURvd25sb2FkID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsncGVyc2lzdGVudCcsICdkb3dubG9hZHMnLCAnZmlsZXMnLCBhcmNJZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGNvbnN0IHN0b3JlZFZlciA9IHV0aWwuZ2V0U2FmZShtb2RzW2lkXSwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmIChzZW12ZXIuZ3Qoc3RvcmVkVmVyLCBwcmV2KSkge1xyXG4gICAgICAgICAgcHJldiA9IHN0b3JlZFZlcjtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnd2FybicsICdpbnZhbGlkIHZlcnNpb24gc3RvcmVkIGZvciBsc2xpYiBtb2QnLCB7IGlkLCB2ZXJzaW9uOiBzdG9yZWRWZXIgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChkbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gVGhlIExTTGliIGRldmVsb3BlciBkb2Vzbid0IGFsd2F5cyB1cGRhdGUgdGhlIHZlcnNpb24gb24gdGhlIGV4ZWN1dGFibGVcclxuICAgICAgICAvLyAgaXRzZWxmIC0gd2UncmUgZ29pbmcgdG8gdHJ5IHRvIGV4dHJhY3QgaXQgZnJvbSB0aGUgYXJjaGl2ZSB3aGljaCB0ZW5kc1xyXG4gICAgICAgIC8vICB0byB1c2UgdGhlIGNvcnJlY3QgdmVyc2lvbi5cclxuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGwubG9jYWxQYXRoLCBwYXRoLmV4dG5hbWUoZGwubG9jYWxQYXRoKSk7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gZmlsZU5hbWUuaW5kZXhPZignLXYnKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgdmVyID0gc2VtdmVyLmNvZXJjZShmaWxlTmFtZS5zbGljZShpZHggKyAyKSkudmVyc2lvbjtcclxuICAgICAgICAgIGlmIChzZW12ZXIudmFsaWQodmVyKSAmJiB2ZXIgIT09IHN0b3JlZFZlcikge1xyXG4gICAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgaWQsICd2ZXJzaW9uJywgdmVyKSk7XHJcbiAgICAgICAgICAgIHByZXYgPSB2ZXI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAvLyBXZSBmYWlsZWQgdG8gZ2V0IHRoZSB2ZXJzaW9uLi4uIE9oIHdlbGwuLiBTZXQgYSBib2d1cyB2ZXJzaW9uIHNpbmNlXHJcbiAgICAgICAgICAvLyAgd2UgY2xlYXJseSBoYXZlIGxzbGliIGluc3RhbGxlZCAtIHRoZSB1cGRhdGUgZnVuY3Rpb25hbGl0eSBzaG91bGQgdGFrZVxyXG4gICAgICAgICAgLy8gIGNhcmUgb2YgdGhlIHJlc3QgKHdoZW4gdGhlIHVzZXIgY2xpY2tzIHRoZSBjaGVjayBmb3IgdXBkYXRlcyBidXR0b24pXHJcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgaWQsICd2ZXJzaW9uJywgJzEuMC4wJykpO1xyXG4gICAgICAgICAgcHJldiA9ICcxLjAuMCc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJldjtcclxuICB9LCAnMC4wLjAnKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25DaGVja01vZFZlcnNpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSB7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKGFwaS5nZXRTdGF0ZSgpKTtcclxuICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQgfHwgZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XHJcblxyXG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcclxuICAgIC8vIE5vdGhpbmcgdG8gdXBkYXRlLlxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbmV3ZXN0VmVyOiBzdHJpbmcgPSBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmNoZWNrRm9yVXBkYXRlcyhhcGksIGxhdGVzdFZlcik7XHJcbiAgaWYgKCFuZXdlc3RWZXIgfHwgbmV3ZXN0VmVyID09PSBsYXRlc3RWZXIpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcCgpIHtcclxuICAvLyBub3BcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25HYW1lTW9kZUFjdGl2YXRlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nKSB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IG1pZ3JhdGUoYXBpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdGYWlsZWQgdG8gbWlncmF0ZScsIGVyciwge1xyXG4gICAgICAgIC8vbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdE1vZEZpeGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcblxyXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcclxuXHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gZGlmZmVyZW50IGdhbWUuXHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XHJcbiAgLy9jb25zdCBiaW5Gb2xkZXIgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdiaW4nKSAhPT0gLTEpO1xyXG5cclxuICBjb25zdCBoYXNNb2RGaXhlclBhayA9IGxvd2VyZWQuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkgPT09ICdtb2RmaXhlci5wYWsnKSAhPT0gdW5kZWZpbmVkO1xyXG5cclxuICBpZiAoIWhhc01vZEZpeGVyUGFrKSB7XHJcbiAgICAvLyB0aGVyZSdzIG5vIG1vZGZpeGVyLnBhayBmb2xkZXIuXHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgICBzdXBwb3J0ZWQ6IHRydWUsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtdXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RFbmdpbmVJbmplY3RvcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG5cclxuICBjb25zdCBub3RTdXBwb3J0ZWQgPSB7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH07XHJcblxyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIGRpZmZlcmVudCBnYW1lLlxyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xyXG4gIC8vY29uc3QgYmluRm9sZGVyID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJykgIT09IC0xKTtcclxuXHJcbiAgY29uc3QgaGFzQmluRm9sZGVyID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5pbmRleE9mKCdiaW4nICsgcGF0aC5zZXApICE9PSAtMSkgIT09IHVuZGVmaW5lZDtcclxuXHJcbiAgaWYgKCFoYXNCaW5Gb2xkZXIpIHtcclxuICAgIC8vIHRoZXJlJ3Mgbm8gYmluIGZvbGRlci5cclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICAgIHN1cHBvcnRlZDogdHJ1ZSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW11cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbEJHM1NFKGZpbGVzOiBzdHJpbmdbXSxcclxuICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICBnYW1lSWQ6IHN0cmluZyxcclxuICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxyXG4gIDogQmx1ZWJpcmQ8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBcclxuICBjb25zb2xlLmxvZygnaW5zdGFsbEJHM1NFIGZpbGVzOicsIGZpbGVzKTtcclxuXHJcbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcblxyXG4gIC8vIEZpbHRlciBvbmx5IGRsbCBmaWxlcy5cclxuICBmaWxlcyA9IGZpbGVzLmZpbHRlcihmID0+IHBhdGguZXh0bmFtZShmKSA9PT0gJy5kbGwnKTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7ICAgIFxyXG4gICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXHJcbiAgICAgIH0pOyAgICBcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcblxyXG4gIGNvbnNvbGUubG9nKCdpbnN0YWxsQkczU0UgaW5zdHJ1Y3Rpb25zOicsIGluc3RydWN0aW9ucyk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59IFxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbE1vZEZpeGVyKGZpbGVzOiBzdHJpbmdbXSxcclxuICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICBnYW1lSWQ6IHN0cmluZyxcclxuICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxyXG4gIDogQmx1ZWJpcmQ8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBcclxuICBjb25zb2xlLmxvZygnaW5zdGFsbE1vZEZpeGVyIGZpbGVzOicsIGZpbGVzKTtcclxuXHJcbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcblxyXG4gIC8vIEZpbHRlciBvbmx5IHBhayBmaWxlcy5cclxuICBmaWxlcyA9IGZpbGVzLmZpbHRlcihmID0+IHBhdGguZXh0bmFtZShmKSA9PT0gJy5wYWsnKTtcclxuXHJcbiAgY29uc3QgbW9kRml4ZXJBdHRyaWJ1dGU6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ2F0dHJpYnV0ZScsIGtleTogJ21vZEZpeGVyJywgdmFsdWU6IHRydWUgfVxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHsgICAgXHJcbiAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcclxuICAgICAgfSk7ICAgIFxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIFsgbW9kRml4ZXJBdHRyaWJ1dGUgXSk7XHJcblxyXG4gIGNvbnNvbGUubG9nKCdpbnN0YWxsTW9kRml4ZXIgaW5zdHJ1Y3Rpb25zOicsIGluc3RydWN0aW9ucyk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59IFxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbEVuZ2luZUluamVjdG9yKGZpbGVzOiBzdHJpbmdbXSxcclxuICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICBnYW1lSWQ6IHN0cmluZyxcclxuICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxyXG4gIDogQmx1ZWJpcmQ8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBcclxuICBjb25zb2xlLmxvZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGZpbGVzOicsIGZpbGVzKTtcclxuXHJcbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcblxyXG4gIGNvbnN0IG1vZHR5cGVBdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdzZXRtb2R0eXBlJywgdmFsdWU6ICdkaW5wdXQnIH0gXHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgXHJcbiAgICAvLyBzZWUgaWYgd2UgaGF2ZSBhIGJpbiBmb2xkZXJcclxuICAgIC8vIHRoZW4gd2UgbmVlZCB0byB1c2UgdGhhdCBhcyBhIG5ldyByb290IGluY2FzZSB0aGUgL2JpbiBpcyBuZXN0ZWRcclxuXHJcbiAgICBjb25zdCBiaW5JbmRleCA9IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYmluJyArIHBhdGguc2VwKTtcclxuXHJcbiAgICBpZiAoYmluSW5kZXggIT09IC0xKSB7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhmaWxlUGF0aC5zdWJzdHJpbmcoYmluSW5kZXgpKTtcclxuXHJcbiAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBmaWxlUGF0aC5zdWJzdHJpbmcoYmluSW5kZXgpLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbIG1vZHR5cGVBdHRyIF0pO1xyXG5cclxuICBjb25zb2xlLmxvZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGluc3RydWN0aW9uczonLCBpbnN0cnVjdGlvbnMpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAnZXhldnVsa2FuJyxcclxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxyXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogbW9kc1BhdGgsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzNfZHgxMS5leGUnLFxyXG4gICAgc2V0dXA6IGRpc2NvdmVyeSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi9iZzNfZHgxMS5leGUnLFxyXG4gICAgXSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogSUdOT1JFX1BBVFRFUk5TLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IElHTk9SRV9QQVRURVJOUyxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDMwMCwgJ3NldHRpbmdzJywge30sICdSZS1pbnN0YWxsIExTTGliL0RpdmluZScsICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxyXG4gICAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IGxzbGlicyA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihtb2QgPT4gbW9kc1ttb2RdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kcycsIEdBTUVfSUQsIGxzbGlicywgKGVycikgPT4ge1xyXG4gICAgICBpZiAoZXJyICE9PSBudWxsKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVpbnN0YWxsIGxzbGliJyxcclxuICAgICAgICAgICdQbGVhc2UgcmUtaW5zdGFsbCBtYW51YWxseScsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGNvbnRleHQuYXBpKTtcclxuICAgIH0pO1xyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gZ2FtZU1vZGUgPT09IEdBTUVfSUQ7XHJcbiAgfSk7ICBcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIHRlc3RMU0xpYiwgaW5zdGFsbExTTGliIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWJnM3NlJywgMTUsIHRlc3RCRzNTRSwgaW5zdGFsbEJHM1NFIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWVuZ2luZS1pbmplY3RvcicsIDIwLCB0ZXN0RW5naW5lSW5qZWN0b3IsIGluc3RhbGxFbmdpbmVJbmplY3RvciBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1yZXBsYWNlcicsIDI1LCB0ZXN0UmVwbGFjZXIsIGluc3RhbGxSZXBsYWNlcik7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLW1vZGZpeGVyJywgMjUsIHRlc3RNb2RGaXhlciwgaW5zdGFsbE1vZEZpeGVyKTtcclxuXHJcbiAgLypcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLWVuZ2luZS1pbmplY3RvcicsIDIwLCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsIFxyXG4gICAgKCkgPT4gZ2V0R2FtZVBhdGgoY29udGV4dC5hcGkpLCBcclxuICAgIGluc3RydWN0aW9ucyA9PiBpc0VuZ2luZUluamVjdG9yKGNvbnRleHQuYXBpLCBpbnN0cnVjdGlvbnMpLFxyXG4gICAgeyBuYW1lOiAnQkczIEVuZ2luZSBJbmplY3Rvcid9KTsqL1xyXG4gICAgXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsIDE1LCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICAoKSA9PiB1bmRlZmluZWQsIFxyXG4gICAgaW5zdHJ1Y3Rpb25zID0+IGlzTFNMaWIoY29udGV4dC5hcGksIGluc3RydWN0aW9ucyksXHJcbiAgICB7IG5hbWU6ICdCRzMgTFNMaWInIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLWJnM3NlJywgMTUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IHBhdGguam9pbihnZXRHYW1lUGF0aChjb250ZXh0LmFwaSksICdiaW4nKSwgXHJcbiAgICBpbnN0cnVjdGlvbnMgPT4gaXNCRzNTRShjb250ZXh0LmFwaSwgaW5zdHJ1Y3Rpb25zKSxcclxuICAgIHsgbmFtZTogJ0JHMyBCRzNTRScgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdiZzMtcmVwbGFjZXInLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSwgXHJcbiAgICBpbnN0cnVjdGlvbnMgPT4gaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgaW5zdHJ1Y3Rpb25zKSxcclxuICAgIHsgbmFtZTogJ0JHMyBSZXBsYWNlcicgfSBhcyBhbnkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLWxvb3NlJywgMjAsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxyXG4gICAgaW5zdHJ1Y3Rpb25zID0+IGlzTG9vc2UoY29udGV4dC5hcGksIGluc3RydWN0aW9ucyksXHJcbiAgICB7IG5hbWU6ICdCRzMgTG9vc2UnIH0gYXMgYW55KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemUoY29udGV4dCksXHJcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIsIHByZXYpID0+IHNlcmlhbGl6ZShjb250ZXh0LCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+ICg8SW5mb1BhbmVsV3JhcCBhcGk9e2NvbnRleHQuYXBpfSByZWZyZXNoPXtub3B9IC8+KSkgYXMgYW55LFxyXG4gIH0pO1xyXG5cclxuICAvKlxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNDUsICdyZWZyZXNoJywge30sICdEZWVwIFJlZnJlc2gnLCAoKSA9PiB7IGRlZXBSZWZyZXNoKGNvbnRleHQuYXBpKTsgfSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlR2FtZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XHJcbiAgfSk7Ki9cclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MCwgJ2NoYW5nZWxvZycsIHt9LCAnRXhwb3J0IHRvIEdhbWUnLCAoKSA9PiB7IGV4cG9ydFRvR2FtZShjb250ZXh0LmFwaSk7IH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUxLCAnY2hhbmdlbG9nJywge30sICdFeHBvcnQgdG8gRmlsZS4uLicsICgpID0+IHsgZXhwb3J0VG9GaWxlKGNvbnRleHQuYXBpKTsgfSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlR2FtZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNjAsICdpbXBvcnQnLCB7fSwgJ0ltcG9ydCBmcm9tIEdhbWUnLCAoKSA9PiB7IGltcG9ydE1vZFNldHRpbmdzR2FtZShjb250ZXh0LmFwaSk7IH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTYxLCAnaW1wb3J0Jywge30sICdJbXBvcnQgZnJvbSBGaWxlLi4uJywgKCkgPT4geyBcclxuICAgIGltcG9ydE1vZFNldHRpbmdzRmlsZShjb250ZXh0LmFwaSk7IFxyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyU2V0dGluZ3MoJ01vZHMnLCBTZXR0aW5ncywgdW5kZWZpbmVkLCAoKSA9PlxyXG4gICAgc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSA9PT0gR0FNRV9JRCwgMTUwKTtcclxuXHJcbiAgLy9jb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKChvbGRWZXJzaW9uKSA9PiBCbHVlYmlyZC5yZXNvbHZlKG1pZ3JhdGUxMyhjb250ZXh0LmFwaSwgb2xkVmVyc2lvbikpKTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXNzaW9uJywgJ2Jhc2UnLCAndG9vbHNSdW5uaW5nJ10sXHJcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXHJcbiAgICAgICAgLy8gY2hhbmdlZFxyXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKChwcm9maWxlPy5nYW1lSWQgPT09IEdBTUVfSUQpICYmIChmb3JjZVJlZnJlc2ggIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICBmb3JjZVJlZnJlc2goKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2NoZWNrLW1vZHMtdmVyc2lvbicsXHJcbiAgICAgIChnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSA9PiBvbkNoZWNrTW9kVmVyc2lvbihjb250ZXh0LmFwaSwgZ2FtZUlkLCBtb2RzKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgICBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4gb25HYW1lTW9kZUFjdGl2YXRlZChjb250ZXh0LmFwaSwgZ2FtZU1vZGUpKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1haW47XHJcbiJdfQ==