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
const redux_act_1 = require("redux-act");
const semver = __importStar(require("semver"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const gitHubDownloader = __importStar(require("./githubDownloader"));
const STOP_PATTERNS = ['[^/]*\\.pak$'];
const GOG_ID = '1456460669';
const STEAM_ID = '1086940';
function toWordExp(input) {
    return '(^|/)' + input + '(/|$)';
}
const setPlayerProfile = (0, redux_act_1.createAction)('BG3_SET_PLAYERPROFILE', name => name);
const settingsWritten = (0, redux_act_1.createAction)('BG3_SETTINGS_WRITTEN', (profile, time, count) => ({ profile, time, count }));
const reducer = {
    reducers: {
        [setPlayerProfile]: (state, payload) => vortex_api_1.util.setSafe(state, ['playerProfile'], payload),
        [settingsWritten]: (state, payload) => {
            const { profile, time, count } = payload;
            return vortex_api_1.util.setSafe(state, ['settingsWritten', profile], { time, count });
        },
    },
    defaults: {
        playerProfile: 'global',
        settingsWritten: {},
    },
};
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
    showFullReleaseModFixerRecommendation(api);
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
function showFullReleaseModFixerRecommendation(api) {
    api.sendNotification({
        type: 'warning',
        title: 'Recommended Mod',
        message: 'Most mods require this mod.',
        allowSuppress: true,
        actions: [
            {
                title: 'More', action: dismiss => {
                    api.showDialog('question', 'Recommended Mods', {
                        text: 'We recommend installing "Full Release Mod Fixer" to be able to mod Baldur\'s Gate 3.\n\n' +
                            'This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods'
                    }, [
                        { label: 'Dismiss' },
                        { label: 'Open Nexus Mods', default: true },
                    ])
                        .then(result => {
                        dismiss();
                        if (result.action === 'Open Nexus Mods') {
                            vortex_api_1.util.opn('https://www.nexusmods.com/baldursgate3/mods/550?tab=description').catch(() => null);
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
        return Promise.resolve({ instructions });
    });
}
function isReplacer(api, files) {
    const origFile = files.find(iter => (iter.type === 'copy') && ORIGINAL_FILES.has(iter.destination.toLowerCase()));
    const paks = files.filter(iter => (iter.type === 'copy') && (path.extname(iter.destination).toLowerCase() === '.pak'));
    if ((origFile !== undefined) || (paks.length === 0)) {
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
            { label: 'Install as Replacer',
                default: true },
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
    return isLsLibInstalled() ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } },
            t('Ingame Profile: '),
            supportsProfiles ? (React.createElement(react_bootstrap_1.FormControl, { componentClass: 'select', name: 'userProfile', className: 'form-control', value: currentProfile, onChange: onSelect },
                React.createElement("option", { key: 'global', value: 'global' }, t('All Profiles')),
                getPlayerProfiles().map(prof => (React.createElement("option", { key: prof, value: prof }, prof))))) : null),
        supportsProfiles ? null : (React.createElement("div", null,
            React.createElement(react_bootstrap_1.Alert, { bsStyle: 'info' }, t('Patch 9 removed the feature of switching profiles inside the game, savegames are '
                + 'now tied to the character.\n It is currently unknown if these profiles will '
                + 'return but of course you can continue to use Vortex profiles.')))),
        React.createElement("hr", null),
        React.createElement("div", null,
            t('Please refer to mod descriptions from mod authors to determine the right order. '
                + 'If you can\'t find any suggestions for a mod, it probably doesn\'t matter.'),
            React.createElement("hr", null),
            t('Some mods may be locked in this list because they are loaded differently by the engine '
                + 'and can therefore not be load-ordered by mod managers. If you want to disable '
                + 'such a mod, please do so on the "Mods" screen.')))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } }, t('LSLib is not installed')),
        React.createElement("hr", null),
        React.createElement("div", null, t('To take full advantage of Vortex\'s BG3 modding capabilities such as managing the '
            + 'order in which mods are loaded into the game; Vortex requires a 3rd party tool "LSLib", '
            + 'please install the library using the buttons below to manage your load order.')),
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
function writeLoadOrder(api, loadOrder) {
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
                api.store.dispatch(settingsWritten(profile, Date.now(), enabledPaks.length));
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
                    yield vortex_api_1.fs.ensureDirWritableAsync(modsPath(), () => bluebird_1.default.resolve());
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
    return writeLoadOrder(api, order);
}
const deserializeDebouncer = new vortex_api_1.util.Debouncer(() => {
    return Promise.resolve();
}, 1000);
function deserializeLoadOrder(api) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vortex_api_1.util.toPromise(cb => deserializeDebouncer.schedule(cb));
        const paks = yield readPAKs(api);
        const order = yield readLO(api);
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
            api.store.dispatch(setPlayerProfile(profileName));
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
function main(context) {
    context.registerReducer(['settings', 'baldursgate3'], reducer);
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
    context.registerInstaller('bg3-replacer', 25, testReplacer, installReplacer);
    context.registerInstaller('bg3-lslib-divine-tool', 15, testLSLib, installLSLib);
    context.registerModType('bg3-replacer', 25, (gameId) => gameId === common_1.GAME_ID, () => getGameDataPath(context.api), files => isReplacer(context.api, files), { name: 'BG3 Replacer' });
    context.registerModType('bg3-lslib-divine-tool', 15, (gameId) => gameId === common_1.GAME_ID, () => undefined, files => isLSLib(context.api, files), { name: 'BG3 LSLib' });
    context.registerLoadOrder({
        gameId: common_1.GAME_ID,
        deserializeLoadOrder: () => deserializeLoadOrder(context.api),
        serializeLoadOrder: (loadOrder) => serializeLoadOrder(context.api, loadOrder),
        validate,
        toggleableEntries: true,
        usageInstructions: (() => (React.createElement(InfoPanelWrap, { api: context.api, refresh: nop }))),
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxpREFBc0M7QUFDdEMsOERBQXFDO0FBRXJDLDJDQUE2QjtBQUM3Qiw2Q0FBK0I7QUFDL0IscURBQXFEO0FBQ3JELDZDQUEwQztBQUMxQyx5Q0FBeUM7QUFDekMsK0NBQWlDO0FBQ2pDLHFDQUE4QztBQUM5QywwREFBeUM7QUFDekMsMkNBQStFO0FBQy9FLG1DQUFxRDtBQUdyRCxxQ0FBb0U7QUFDcEUscUVBQXVEO0FBRXZELE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUUzQixTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUdELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsTUFBTSxlQUFlLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHNCQUFzQixFQUN6RCxDQUFDLE9BQWUsRUFBRSxJQUFZLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFHaEYsTUFBTSxPQUFPLEdBQXVCO0lBQ2xDLFFBQVEsRUFBRTtRQUNSLENBQUMsZ0JBQXVCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFLE9BQU8sQ0FB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cGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IGdldFZlcnNpb24gZnJvbSAnZXhlLXZlcnNpb24nO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEFsZXJ0LCBGb3JtQ29udHJvbCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IGNyZWF0ZUFjdGlvbiB9IGZyb20gJ3JlZHV4LWFjdCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGdlbmVyYXRlIGFzIHNob3J0aWQgfSBmcm9tICdzaG9ydGlkJztcbmltcG9ydCB3YWxrLCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHRvb2x0aXAsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJTW9kTm9kZSwgSU1vZFNldHRpbmdzLCBJUGFrSW5mbywgSVhtbE5vZGUgfSBmcm9tICcuL3R5cGVzJztcblxuaW1wb3J0IHsgREVGQVVMVF9NT0RfU0VUVElOR1MsIEdBTUVfSUQsIExTTElCX1VSTCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCAqIGFzIGdpdEh1YkRvd25sb2FkZXIgZnJvbSAnLi9naXRodWJEb3dubG9hZGVyJztcblxuY29uc3QgU1RPUF9QQVRURVJOUyA9IFsnW14vXSpcXFxcLnBhayQnXTtcblxuY29uc3QgR09HX0lEID0gJzE0NTY0NjA2NjknO1xuY29uc3QgU1RFQU1fSUQgPSAnMTA4Njk0MCc7XG5cbmZ1bmN0aW9uIHRvV29yZEV4cChpbnB1dCkge1xuICByZXR1cm4gJyhefC8pJyArIGlucHV0ICsgJygvfCQpJztcbn1cblxuLy8gYWN0aW9uc1xuY29uc3Qgc2V0UGxheWVyUHJvZmlsZSA9IGNyZWF0ZUFjdGlvbignQkczX1NFVF9QTEFZRVJQUk9GSUxFJywgbmFtZSA9PiBuYW1lKTtcbmNvbnN0IHNldHRpbmdzV3JpdHRlbiA9IGNyZWF0ZUFjdGlvbignQkczX1NFVFRJTkdTX1dSSVRURU4nLFxuICAocHJvZmlsZTogc3RyaW5nLCB0aW1lOiBudW1iZXIsIGNvdW50OiBudW1iZXIpID0+ICh7IHByb2ZpbGUsIHRpbWUsIGNvdW50IH0pKTtcblxuLy8gcmVkdWNlclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xuICByZWR1Y2Vyczoge1xuICAgIFtzZXRQbGF5ZXJQcm9maWxlIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3BsYXllclByb2ZpbGUnXSwgcGF5bG9hZCksXG4gICAgW3NldHRpbmdzV3JpdHRlbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcbiAgICAgIGNvbnN0IHsgcHJvZmlsZSwgdGltZSwgY291bnQgfSA9IHBheWxvYWQ7XG4gICAgICByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xuICAgIH0sXG4gIH0sXG4gIGRlZmF1bHRzOiB7XG4gICAgcGxheWVyUHJvZmlsZTogJ2dsb2JhbCcsXG4gICAgc2V0dGluZ3NXcml0dGVuOiB7fSxcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIGRvY3VtZW50c1BhdGgoKSB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdsb2NhbEFwcERhdGEnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XG59XG5cbmZ1bmN0aW9uIG1vZHNQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ01vZHMnKTtcbn1cblxuZnVuY3Rpb24gcHJvZmlsZXNQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ1BsYXllclByb2ZpbGVzJyk7XG59XG5cbmZ1bmN0aW9uIGdsb2JhbFByb2ZpbGVQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ2dsb2JhbCcpO1xufVxuXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBhbnkge1xuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRCwgU1RFQU1fSURdKVxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCkge1xuICAgIGNvbnN0IHByb2ZpbGVQYXRoID0gZ2xvYmFsUHJvZmlsZVBhdGgoKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwcm9maWxlUGF0aCk7XG4gICAgICBjb25zdCBtb2RTZXR0aW5nc0ZpbGVQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVQYXRoLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCwgREVGQVVMVF9NT0RfU0VUVElOR1MsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeSk6IGFueSB7XG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTsgIFxuXG4gIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpKTtcblxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgaWQ6ICdiZzMtdXNlcy1sc2xpYicsXG4gICAgdHlwZTogJ2luZm8nLFxuICAgIHRpdGxlOiAnQkczIHN1cHBvcnQgdXNlcyBMU0xpYicsXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcbiAgICBdLFxuICB9KTtcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcbiAgICAuY2F0Y2goKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtcCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpIGFzIGFueSkpXG4gICAgLmZpbmFsbHkoKCkgPT4gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGksIGRpc2NvdmVyeSkpO1xufVxuXG5cbmZ1bmN0aW9uIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnd2FybmluZycsXG4gICAgdGl0bGU6ICdSZWNvbW1lbmRlZCBNb2QnLFxuICAgIG1lc3NhZ2U6ICdNb3N0IG1vZHMgcmVxdWlyZSB0aGlzIG1vZC4nLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAge1xuICAgICAgICB0aXRsZTogJ01vcmUnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdSZWNvbW1lbmRlZCBNb2RzJywge1xuICAgICAgICAgICAgdGV4dDpcbiAgICAgICAgICAgICAgJ1dlIHJlY29tbWVuZCBpbnN0YWxsaW5nIFwiRnVsbCBSZWxlYXNlIE1vZCBGaXhlclwiIHRvIGJlIGFibGUgdG8gbW9kIEJhbGR1clxcJ3MgR2F0ZSAzLlxcblxcbicgKyBcbiAgICAgICAgICAgICAgJ1RoaXMgY2FuIGJlIGRvd25sb2FkZWQgZnJvbSBOZXh1cyBNb2RzIGFuZCBpbnN0YWxsZWQgdXNpbmcgVm9ydGV4IGJ5IHByZXNzaW5nIFwiT3BlbiBOZXh1cyBNb2RzJ1xuICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgIHsgbGFiZWw6ICdEaXNtaXNzJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ09wZW4gTmV4dXMgTW9kcycsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICAgICAgICBdKVxuICAgICAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICAgICAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ09wZW4gTmV4dXMgTW9kcycpIHtcbiAgICAgICAgICAgICAgICB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS9iYWxkdXJzZ2F0ZTMvbW9kcy81NTA/dGFiPWRlc2NyaXB0aW9uJykuY2F0Y2goKCkgPT4gbnVsbClcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuYWN0aW9uID09PSAnQ2FuY2VsJykge1xuICAgICAgICAgICAgICAgIC8vIGRpc21pc3MgYW55d2F5XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0R2FtZVBhdGgoYXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIHJldHVybiBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGg7XG59XG5cbmZ1bmN0aW9uIGdldEdhbWVEYXRhUGF0aChhcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgY29uc3QgZ2FtZVBhdGggPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGg7XG4gIGlmIChnYW1lUGF0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHBhdGguam9pbihnYW1lUGF0aCwgJ0RhdGEnKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbmNvbnN0IE9SSUdJTkFMX0ZJTEVTID0gbmV3IFNldChbXG4gICdhc3NldHMucGFrJyxcbiAgJ2Fzc2V0cy5wYWsnLFxuICAnZWZmZWN0cy5wYWsnLFxuICAnZW5naW5lLnBhaycsXG4gICdlbmdpbmVzaGFkZXJzLnBhaycsXG4gICdnYW1lLnBhaycsXG4gICdnYW1lcGxhdGZvcm0ucGFrJyxcbiAgJ2d1c3Rhdi5wYWsnLFxuICAnZ3VzdGF2X3RleHR1cmVzLnBhaycsXG4gICdpY29ucy5wYWsnLFxuICAnbG93dGV4LnBhaycsXG4gICdtYXRlcmlhbHMucGFrJyxcbiAgJ21pbmltYXBzLnBhaycsXG4gICdtb2RlbHMucGFrJyxcbiAgJ3NoYXJlZC5wYWsnLFxuICAnc2hhcmVkc291bmRiYW5rcy5wYWsnLFxuICAnc2hhcmVkc291bmRzLnBhaycsXG4gICd0ZXh0dXJlcy5wYWsnLFxuICAndmlydHVhbHRleHR1cmVzLnBhaycsXG5dKTtcblxuY29uc3QgTFNMSUJfRklMRVMgPSBuZXcgU2V0KFtcbiAgJ2RpdmluZS5leGUnLFxuICAnbHNsaWIuZGxsJyxcbl0pO1xuXG5mdW5jdGlvbiBpc0xTTGliKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpKSk7XG4gIHJldHVybiBvcmlnRmlsZSAhPT0gdW5kZWZpbmVkXG4gICAgPyBCbHVlYmlyZC5yZXNvbHZlKHRydWUpXG4gICAgOiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gdGVzdExTTGliKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xuICB9XG4gIGNvbnN0IG1hdGNoZWRGaWxlcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IExTTElCX0ZJTEVTLmhhcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpKTtcblxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkOiBtYXRjaGVkRmlsZXMubGVuZ3RoID49IDIsXG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsTFNMaWIoZmlsZXM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIGNvbnN0IGV4ZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUudG9Mb3dlckNhc2UoKSkgPT09ICdkaXZpbmUuZXhlJyk7XG4gIGNvbnN0IGV4ZVBhdGggPSBwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBleGUpO1xuICBsZXQgdmVyOiBzdHJpbmcgPSBhd2FpdCBnZXRWZXJzaW9uKGV4ZVBhdGgpO1xuICB2ZXIgPSB2ZXIuc3BsaXQoJy4nKS5zbGljZSgwLCAzKS5qb2luKCcuJyk7XG5cbiAgLy8gVW5mb3J0dW5hdGVseSB0aGUgTFNMaWIgZGV2ZWxvcGVyIGlzIG5vdCBjb25zaXN0ZW50IHdoZW4gY2hhbmdpbmdcbiAgLy8gIGZpbGUgdmVyc2lvbnMgLSB0aGUgZXhlY3V0YWJsZSBhdHRyaWJ1dGUgbWlnaHQgaGF2ZSBhbiBvbGRlciB2ZXJzaW9uXG4gIC8vICB2YWx1ZSB0aGFuIHRoZSBvbmUgc3BlY2lmaWVkIGJ5IHRoZSBmaWxlbmFtZSAtIHdlJ3JlIGdvaW5nIHRvIHVzZVxuICAvLyAgdGhlIGZpbGVuYW1lIGFzIHRoZSBwb2ludCBvZiB0cnV0aCAqdWdoKlxuICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGVzdGluYXRpb25QYXRoLCBwYXRoLmV4dG5hbWUoZGVzdGluYXRpb25QYXRoKSk7XG4gIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XG4gIGNvbnN0IGZpbGVOYW1lVmVyID0gZmlsZU5hbWUuc2xpY2UoaWR4ICsgMik7XG4gIGlmIChzZW12ZXIudmFsaWQoZmlsZU5hbWVWZXIpICYmIHZlciAhPT0gZmlsZU5hbWVWZXIpIHtcbiAgICB2ZXIgPSBmaWxlTmFtZVZlcjtcbiAgfVxuICBjb25zdCB2ZXJzaW9uQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnYXR0cmlidXRlJywga2V5OiAndmVyc2lvbicsIHZhbHVlOiB2ZXIgfTtcbiAgY29uc3QgbW9kdHlwZUF0dHI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ3NldG1vZHR5cGUnLCB2YWx1ZTogJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcgfTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9XG4gICAgZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChmaWxlUGF0aC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAuc3BsaXQocGF0aC5zZXApXG4gICAgICAgICAgICAgICAgICAuaW5kZXhPZigndG9vbHMnKSAhPT0gLTFcbiAgICAgICYmICFmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcbiAgICAgICAgYWNjdW0ucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbigndG9vbHMnLCBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFsgbW9kdHlwZUF0dHIsIHZlcnNpb25BdHRyIF0pO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmZ1bmN0aW9uIGlzUmVwbGFjZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIE9SSUdJTkFMX0ZJTEVTLmhhcyhpdGVyLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkpKTtcblxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGl0ZXIgPT5cbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIChwYXRoLmV4dG5hbWUoaXRlci5kZXN0aW5hdGlvbikudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKSk7XG5cbiAgaWYgKChvcmlnRmlsZSAhPT0gdW5kZWZpbmVkKSB8fCAocGFrcy5sZW5ndGggPT09IDApKSB7XG4gICAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdNb2QgbG9va3MgbGlrZSBhIHJlcGxhY2VyJywge1xuICAgICAgYmJjb2RlOiAnVGhlIG1vZCB5b3UganVzdCBpbnN0YWxsZWQgbG9va3MgbGlrZSBhIFwicmVwbGFjZXJcIiwgbWVhbmluZyBpdCBpcyBpbnRlbmRlZCB0byByZXBsYWNlICdcbiAgICAgICAgICArICdvbmUgb2YgdGhlIGZpbGVzIHNoaXBwZWQgd2l0aCB0aGUgZ2FtZS48YnIvPidcbiAgICAgICAgICArICdZb3Ugc2hvdWxkIGJlIGF3YXJlIHRoYXQgc3VjaCBhIHJlcGxhY2VyIGluY2x1ZGVzIGEgY29weSBvZiBzb21lIGdhbWUgZGF0YSBmcm9tIGEgJ1xuICAgICAgICAgICsgJ3NwZWNpZmljIHZlcnNpb24gb2YgdGhlIGdhbWUgYW5kIG1heSB0aGVyZWZvcmUgYnJlYWsgYXMgc29vbiBhcyB0aGUgZ2FtZSBnZXRzIHVwZGF0ZWQuPGJyLz4nXG4gICAgICAgICAgKyAnRXZlbiBpZiBkb2VzblxcJ3QgYnJlYWssIGl0IG1heSByZXZlcnQgYnVnZml4ZXMgdGhhdCB0aGUgZ2FtZSAnXG4gICAgICAgICAgKyAnZGV2ZWxvcGVycyBoYXZlIG1hZGUuPGJyLz48YnIvPidcbiAgICAgICAgICArICdUaGVyZWZvcmUgW2NvbG9yPVwicmVkXCJdcGxlYXNlIHRha2UgZXh0cmEgY2FyZSB0byBrZWVwIHRoaXMgbW9kIHVwZGF0ZWRbL2NvbG9yXSBhbmQgcmVtb3ZlIGl0IHdoZW4gaXQgJ1xuICAgICAgICAgICsgJ25vIGxvbmdlciBtYXRjaGVzIHRoZSBnYW1lIHZlcnNpb24uJyxcbiAgICB9LCBbXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBNb2QgKHdpbGwgbGlrZWx5IG5vdCB3b3JrKScgfSxcbiAgICAgIHsgbGFiZWw6ICdJbnN0YWxsIGFzIFJlcGxhY2VyJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSB9LFxuICAgIF0pLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5hY3Rpb24gPT09ICdJbnN0YWxsIGFzIFJlcGxhY2VyJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZmFsc2UpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRlc3RSZXBsYWNlcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XG5cbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xuICAgIHN1cHBvcnRlZDogcGFrcy5sZW5ndGggPT09IDAsXG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsUmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBCbHVlYmlyZDx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBjb25zdCBkaXJlY3RvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChmaWxlcy5tYXAoZmlsZSA9PiBwYXRoLmRpcm5hbWUoZmlsZSkudG9VcHBlckNhc2UoKSkpKTtcbiAgbGV0IGRhdGFQYXRoOiBzdHJpbmcgPSBkaXJlY3Rvcmllcy5maW5kKGRpciA9PiBwYXRoLmJhc2VuYW1lKGRpcikgPT09ICdEQVRBJyk7XG4gIGlmIChkYXRhUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgZ2VuT3JQdWJsaWMgPSBkaXJlY3Rvcmllc1xuICAgICAgLmZpbmQoZGlyID0+IFsnUFVCTElDJywgJ0dFTkVSQVRFRCddLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZGlyKSkpO1xuICAgIGlmIChnZW5PclB1YmxpYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkYXRhUGF0aCA9IHBhdGguZGlybmFtZShnZW5PclB1YmxpYyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IChkYXRhUGF0aCAhPT0gdW5kZWZpbmVkKVxuICAgID8gZmlsZXMucmVkdWNlKChwcmV2OiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xuICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRhdGFQYXRoLCBmaWxlUGF0aCk7XG4gICAgICBpZiAoIXJlbFBhdGguc3RhcnRzV2l0aCgnLi4nKSkge1xuICAgICAgICBwcmV2LnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICAgIGRlc3RpbmF0aW9uOiByZWxQYXRoLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH0sIFtdKVxuICAgIDogZmlsZXMubWFwKChmaWxlUGF0aDogc3RyaW5nKTogdHlwZXMuSUluc3RydWN0aW9uID0+ICh7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcbiAgICAgICAgZGVzdGluYXRpb246IGZpbGVQYXRoLFxuICAgICAgfSkpO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcbiAgICBpbnN0cnVjdGlvbnMsXG4gIH0pO1xufVxuXG5jb25zdCBnZXRQbGF5ZXJQcm9maWxlcyA9ICgoKSA9PiB7XG4gIGxldCBjYWNoZWQgPSBbXTtcbiAgdHJ5IHtcbiAgICBjYWNoZWQgPSAoZnMgYXMgYW55KS5yZWFkZGlyU3luYyhwcm9maWxlc1BhdGgoKSlcbiAgICAgICAgLmZpbHRlcihuYW1lID0+IChwYXRoLmV4dG5hbWUobmFtZSkgPT09ICcnKSAmJiAobmFtZSAhPT0gJ0RlZmF1bHQnKSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICgpID0+IGNhY2hlZDtcbn0pKCk7XG5cbmZ1bmN0aW9uIGdhbWVTdXBwb3J0c1Byb2ZpbGUoZ2FtZVZlcnNpb246IHN0cmluZykge1xuICByZXR1cm4gc2VtdmVyLmx0KHNlbXZlci5jb2VyY2UoZ2FtZVZlcnNpb24pLCAnNC4xLjIwNicpO1xufVxuXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHMpIHtcbiAgY29uc3QgeyB0LCBnYW1lVmVyc2lvbiwgb25JbnN0YWxsTFNMaWIsXG4gICAgICAgICAgb25TZXRQbGF5ZXJQcm9maWxlLCBpc0xzTGliSW5zdGFsbGVkIH0gPSBwcm9wcztcblxuICBjb25zdCBzdXBwb3J0c1Byb2ZpbGVzID0gZ2FtZVN1cHBvcnRzUHJvZmlsZShnYW1lVmVyc2lvbik7XG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gc3VwcG9ydHNQcm9maWxlcyA/IHByb3BzLmN1cnJlbnRQcm9maWxlIDogJ1B1YmxpYyc7XG5cbiAgY29uc3Qgb25TZWxlY3QgPSBSZWFjdC51c2VDYWxsYmFjaygoZXYpID0+IHtcbiAgICBvblNldFBsYXllclByb2ZpbGUoZXYuY3VycmVudFRhcmdldC52YWx1ZSk7XG4gIH0sIFtvblNldFBsYXllclByb2ZpbGVdKTtcblxuICByZXR1cm4gaXNMc0xpYkluc3RhbGxlZCgpID8gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cbiAgICAgICAge3QoJ0luZ2FtZSBQcm9maWxlOiAnKX1cbiAgICAgICAge3N1cHBvcnRzUHJvZmlsZXMgPyAoXG4gICAgICAgICAgPEZvcm1Db250cm9sXG4gICAgICAgICAgICBjb21wb25lbnRDbGFzcz0nc2VsZWN0J1xuICAgICAgICAgICAgbmFtZT0ndXNlclByb2ZpbGUnXG4gICAgICAgICAgICBjbGFzc05hbWU9J2Zvcm0tY29udHJvbCdcbiAgICAgICAgICAgIHZhbHVlPXtjdXJyZW50UHJvZmlsZX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtvblNlbGVjdH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8b3B0aW9uIGtleT0nZ2xvYmFsJyB2YWx1ZT0nZ2xvYmFsJz57dCgnQWxsIFByb2ZpbGVzJyl9PC9vcHRpb24+XG4gICAgICAgICAgICB7Z2V0UGxheWVyUHJvZmlsZXMoKS5tYXAocHJvZiA9PiAoPG9wdGlvbiBrZXk9e3Byb2Z9IHZhbHVlPXtwcm9mfT57cHJvZn08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L0Zvcm1Db250cm9sPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICAge3N1cHBvcnRzUHJvZmlsZXMgPyBudWxsIDogKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxBbGVydCBic1N0eWxlPSdpbmZvJz5cbiAgICAgICAgICAgIHt0KCdQYXRjaCA5IHJlbW92ZWQgdGhlIGZlYXR1cmUgb2Ygc3dpdGNoaW5nIHByb2ZpbGVzIGluc2lkZSB0aGUgZ2FtZSwgc2F2ZWdhbWVzIGFyZSAnXG4gICAgICAgICAgICAgICsgJ25vdyB0aWVkIHRvIHRoZSBjaGFyYWN0ZXIuXFxuIEl0IGlzIGN1cnJlbnRseSB1bmtub3duIGlmIHRoZXNlIHByb2ZpbGVzIHdpbGwgJ1xuICAgICAgICAgICAgICArICdyZXR1cm4gYnV0IG9mIGNvdXJzZSB5b3UgY2FuIGNvbnRpbnVlIHRvIHVzZSBWb3J0ZXggcHJvZmlsZXMuJyl9XG4gICAgICAgICAgPC9BbGVydD5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgICAgPGhyLz5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCdQbGVhc2UgcmVmZXIgdG8gbW9kIGRlc2NyaXB0aW9ucyBmcm9tIG1vZCBhdXRob3JzIHRvIGRldGVybWluZSB0aGUgcmlnaHQgb3JkZXIuICdcbiAgICAgICAgICArICdJZiB5b3UgY2FuXFwndCBmaW5kIGFueSBzdWdnZXN0aW9ucyBmb3IgYSBtb2QsIGl0IHByb2JhYmx5IGRvZXNuXFwndCBtYXR0ZXIuJyl9XG4gICAgICAgIDxoci8+XG4gICAgICAgIHt0KCdTb21lIG1vZHMgbWF5IGJlIGxvY2tlZCBpbiB0aGlzIGxpc3QgYmVjYXVzZSB0aGV5IGFyZSBsb2FkZWQgZGlmZmVyZW50bHkgYnkgdGhlIGVuZ2luZSAnXG4gICAgICAgICAgKyAnYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGxvYWQtb3JkZXJlZCBieSBtb2QgbWFuYWdlcnMuIElmIHlvdSB3YW50IHRvIGRpc2FibGUgJ1xuICAgICAgICAgICsgJ3N1Y2ggYSBtb2QsIHBsZWFzZSBkbyBzbyBvbiB0aGUgXCJNb2RzXCIgc2NyZWVuLicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICkgOiAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBwYWRkaW5nOiAnMTZweCcgfX0+XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4Jywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19PlxuICAgICAgICB7dCgnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpfVxuICAgICAgPC9kaXY+XG4gICAgICA8aHIvPlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoJ1RvIHRha2UgZnVsbCBhZHZhbnRhZ2Ugb2YgVm9ydGV4XFwncyBCRzMgbW9kZGluZyBjYXBhYmlsaXRpZXMgc3VjaCBhcyBtYW5hZ2luZyB0aGUgJ1xuICAgICAgICAgKyAnb3JkZXIgaW4gd2hpY2ggbW9kcyBhcmUgbG9hZGVkIGludG8gdGhlIGdhbWU7IFZvcnRleCByZXF1aXJlcyBhIDNyZCBwYXJ0eSB0b29sIFwiTFNMaWJcIiwgJ1xuICAgICAgICAgKyAncGxlYXNlIGluc3RhbGwgdGhlIGxpYnJhcnkgdXNpbmcgdGhlIGJ1dHRvbnMgYmVsb3cgdG8gbWFuYWdlIHlvdXIgbG9hZCBvcmRlci4nKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPHRvb2x0aXAuQnV0dG9uXG4gICAgICAgIHRvb2x0aXA9eydJbnN0YWxsIExTTGliJ31cbiAgICAgICAgb25DbGljaz17b25JbnN0YWxsTFNMaWJ9XG4gICAgICA+XG4gICAgICAgIHt0KCdJbnN0YWxsIExTTGliJyl9XG4gICAgICA8L3Rvb2x0aXAuQnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRPd25HYW1lVmVyc2lvbihzdGF0ZTogdHlwZXMuSVN0YXRlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIHJldHVybiBhd2FpdCB1dGlsLmdldEdhbWUoR0FNRV9JRCkuZ2V0SW5zdGFsbGVkVmVyc2lvbihkaXNjb3ZlcnkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICByZXR1cm4gZ2FtZVN1cHBvcnRzUHJvZmlsZShhd2FpdCBnZXRPd25HYW1lVmVyc2lvbihhcGkuZ2V0U3RhdGUoKSkpXG4gICAgPyBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGUgfHwgJ2dsb2JhbCdcbiAgICA6ICdQdWJsaWMnO1xufVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZUxvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0pIHtcbiAgY29uc3QgYmczcHJvZmlsZTogc3RyaW5nID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xuICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IChiZzNwcm9maWxlID09PSAnZ2xvYmFsJykgPyBnZXRQbGF5ZXJQcm9maWxlcygpIDogW2JnM3Byb2ZpbGVdO1xuICBpZiAocGxheWVyUHJvZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgaWQ6ICdiZzMtbm8tcHJvZmlsZXMnLFxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgdGl0bGU6ICdObyBwbGF5ZXIgcHJvZmlsZXMnLFxuICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgY3JlYXRlIGEgcHJvZmlsZSBpbi1nYW1lJyxcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1uby1wcm9maWxlcycpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcblxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xuICAgIGNvbnN0IGxvTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpID8/IHsgY2hpbGRyZW46IFtdIH07XG4gICAgaWYgKChsb05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChsb05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBsb05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTm9kZXMgPSBtb2RzTm9kZT8uY2hpbGRyZW4/LlswXT8ubm9kZT8uZmlsdGVyPy4oaXRlciA9PlxuICAgICAgaXRlci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gJ0d1c3RhdkRldicpKSkgPz8gW107XG5cbiAgICBjb25zdCBlbmFibGVkUGFrcyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gISFsb2FkT3JkZXJba2V5XS5kYXRhPy51dWlkXG4gICAgICAgICAgICAgICAgICAgICYmIGxvYWRPcmRlcltrZXldLmVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgJiYgIWxvYWRPcmRlcltrZXldLmRhdGE/LmlzTGlzdGVkKTtcblxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBlbmFibGVkUGFrcykge1xuICAgICAgLy8gY29uc3QgbWQ1ID0gYXdhaXQgdXRpbC5maWxlTUQ1KHBhdGguam9pbihtb2RzUGF0aCgpLCBrZXkpKTtcbiAgICAgIGRlc2NyaXB0aW9uTm9kZXMucHVzaCh7XG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXG4gICAgICAgIGF0dHJpYnV0ZTogW1xuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5mb2xkZXIgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm1kNSB9IH0sXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm5hbWUgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdWZXJzaW9uJywgdHlwZTogJ2ludDMyJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudmVyc2lvbiB9IH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGVuYWJsZWRQYWtzXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcbiAgICAgIC5tYXAoKGtleTogc3RyaW5nKTogSU1vZE5vZGUgPT4gKHtcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcbiAgICAgICAgYXR0cmlidXRlOiBbXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnV1aWQgfSB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XG4gICAgbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBsb2FkT3JkZXJOb2RlcztcblxuICAgIGlmIChiZzNwcm9maWxlID09PSAnZ2xvYmFsJykge1xuICAgICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzLCBiZzNwcm9maWxlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBwcm9maWxlIG9mIHBsYXllclByb2ZpbGVzKSB7XG4gICAgICB3cml0ZU1vZFNldHRpbmdzKGFwaSwgbW9kU2V0dGluZ3MsIHByb2ZpbGUpO1xuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldHRpbmdzV3JpdHRlbihwcm9maWxlLCBEYXRlLm5vdygpLCBlbmFibGVkUGFrcy5sZW5ndGgpKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxuICAgIH0pO1xuICB9XG59XG5cbnR5cGUgRGl2aW5lQWN0aW9uID0gJ2NyZWF0ZS1wYWNrYWdlJyB8ICdsaXN0LXBhY2thZ2UnIHwgJ2V4dHJhY3Qtc2luZ2xlLWZpbGUnXG4gICAgICAgICAgICAgICAgICB8ICdleHRyYWN0LXBhY2thZ2UnIHwgJ2V4dHJhY3QtcGFja2FnZXMnIHwgJ2NvbnZlcnQtbW9kZWwnXG4gICAgICAgICAgICAgICAgICB8ICdjb252ZXJ0LW1vZGVscycgfCAnY29udmVydC1yZXNvdXJjZScgfCAnY29udmVydC1yZXNvdXJjZXMnO1xuXG5pbnRlcmZhY2UgSURpdmluZU9wdGlvbnMge1xuICBzb3VyY2U6IHN0cmluZztcbiAgZGVzdGluYXRpb24/OiBzdHJpbmc7XG4gIGV4cHJlc3Npb24/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJRGl2aW5lT3V0cHV0IHtcbiAgc3Rkb3V0OiBzdHJpbmc7XG4gIHJldHVybkNvZGU6IG51bWJlcjtcbn1cblxuZnVuY3Rpb24gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XG4gIGlmIChtb2RzID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcpIHtcbiAgICAgIGNvbnN0IGxhdGVzdFZlciA9IHV0aWwuZ2V0U2FmZShwcmV2LCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNlbXZlci5ndChjdXJyZW50VmVyLCBsYXRlc3RWZXIpKSB7XG4gICAgICAgICAgcHJldiA9IG1vZHNbaWRdO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgbW9kIHZlcnNpb24nLCB7IG1vZElkOiBpZCwgdmVyc2lvbjogY3VycmVudFZlciB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIHVuZGVmaW5lZCk7XG5cbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gbHNMaWI7XG59XG5cbmNsYXNzIERpdmluZUV4ZWNNaXNzaW5nIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignRGl2aW5lIGV4ZWN1dGFibGUgaXMgbWlzc2luZycpO1xuICAgIHRoaXMubmFtZSA9ICdEaXZpbmVFeGVjTWlzc2luZyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGl2aW5lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICBhY3Rpb246IERpdmluZUFjdGlvbixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBJRGl2aW5lT3B0aW9ucyk6IFByb21pc2U8SURpdmluZU91dHB1dD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8SURpdmluZU91dHB1dD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCByZXR1cm5lZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIGxldCBzdGRvdXQ6IHN0cmluZyA9ICcnO1xuXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xuICAgIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0xTTGliL0RpdmluZSB0b29sIGlzIG1pc3NpbmcnKTtcbiAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgIH1cbiAgICBjb25zdCBleGUgPSBwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbHNMaWIuaW5zdGFsbGF0aW9uUGF0aCwgJ3Rvb2xzJywgJ2RpdmluZS5leGUnKTtcbiAgICBjb25zdCBhcmdzID0gW1xuICAgICAgJy0tYWN0aW9uJywgYWN0aW9uLFxuICAgICAgJy0tc291cmNlJywgb3B0aW9ucy5zb3VyY2UsXG4gICAgICAnLS1sb2dsZXZlbCcsICdvZmYnLFxuICAgICAgJy0tZ2FtZScsICdiZzMnLFxuICAgIF07XG5cbiAgICBpZiAob3B0aW9ucy5kZXN0aW5hdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZGVzdGluYXRpb24nLCBvcHRpb25zLmRlc3RpbmF0aW9uKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZXhwcmVzc2lvbicsIG9wdGlvbnMuZXhwcmVzc2lvbik7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvYyA9IHNwYXduKGV4ZSwgYXJncyk7XG5cbiAgICBwcm9jLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4gc3Rkb3V0ICs9IGRhdGEpO1xuICAgIHByb2Muc3RkZXJyLm9uKCdkYXRhJywgZGF0YSA9PiBsb2coJ3dhcm4nLCBkYXRhKSk7XG5cbiAgICBwcm9jLm9uKCdlcnJvcicsIChlcnJJbjogRXJyb3IpID0+IHtcbiAgICAgIGlmICghcmV0dXJuZWQpIHtcbiAgICAgICAgaWYgKGVyckluWydjb2RlJ10gPT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBEaXZpbmVFeGVjTWlzc2luZygpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5lZCA9IHRydWU7XG4gICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignZGl2aW5lLmV4ZSBmYWlsZWQ6ICcgKyBlcnJJbi5tZXNzYWdlKTtcbiAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcHJvYy5vbignZXhpdCcsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgIGlmICghcmV0dXJuZWQpIHtcbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHsgc3Rkb3V0LCByZXR1cm5Db2RlOiAwIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKFsyLCAxMDJdLmluY2x1ZGVzKGNvZGUpKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQ6ICcnLCByZXR1cm5Db2RlOiAyIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGRpdmluZS5leGUgcmV0dXJucyB0aGUgYWN0dWFsIGVycm9yIGNvZGUgKyAxMDAgaWYgYSBmYXRhbCBlcnJvciBvY2N1cmVkXG4gICAgICAgICAgaWYgKGNvZGUgPiAxMDApIHtcbiAgICAgICAgICAgIGNvZGUgLT0gMTAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoYGRpdmluZS5leGUgZmFpbGVkOiAke2NvZGV9YCk7XG4gICAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWsoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoLCBkZXN0UGF0aCwgcGF0dGVybikge1xuICByZXR1cm4gZGl2aW5lKGFwaSwgJ2V4dHJhY3QtcGFja2FnZScsXG4gICAgeyBzb3VyY2U6IHBha1BhdGgsIGRlc3RpbmF0aW9uOiBkZXN0UGF0aCwgZXhwcmVzc2lvbjogcGF0dGVybiB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdE1ldGEoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XG4gIGNvbnN0IG1ldGFQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndGVtcCcpLCAnbHNtZXRhJywgc2hvcnRpZCgpKTtcbiAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMobWV0YVBhdGgpO1xuICBhd2FpdCBleHRyYWN0UGFrKGFwaSwgcGFrUGF0aCwgbWV0YVBhdGgsICcqL21ldGEubHN4Jyk7XG4gIHRyeSB7XG4gICAgLy8gdGhlIG1ldGEubHN4IG1heSBiZSBpbiBhIHN1YmRpcmVjdG9yeS4gVGhlcmUgaXMgcHJvYmFibHkgYSBwYXR0ZXJuIGhlcmVcbiAgICAvLyBidXQgd2UnbGwganVzdCB1c2UgaXQgZnJvbSB3aGVyZXZlclxuICAgIGxldCBtZXRhTFNYUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKG1ldGFQYXRoLCAnbWV0YS5sc3gnKTtcbiAgICBhd2FpdCB3YWxrKG1ldGFQYXRoLCBlbnRyaWVzID0+IHtcbiAgICAgIGNvbnN0IHRlbXAgPSBlbnRyaWVzLmZpbmQoZSA9PiBwYXRoLmJhc2VuYW1lKGUuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09ICdtZXRhLmxzeCcpO1xuICAgICAgaWYgKHRlbXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtZXRhTFNYUGF0aCA9IHRlbXAuZmlsZVBhdGg7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtZXRhTFNYUGF0aCk7XG4gICAgY29uc3QgbWV0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1ldGFQYXRoKTtcbiAgICByZXR1cm4gbWV0YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobWV0YVBhdGgpO1xuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICB9IGVsc2UgaWYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKCdDb2x1bW4nKSAmJiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ0xpbmUnKSkpIHtcbiAgICAgIC8vIGFuIGVycm9yIG1lc3NhZ2Ugc3BlY2lmeWluZyBjb2x1bW4gYW5kIHJvdyBpbmRpY2F0ZSBhIHByb2JsZW0gcGFyc2luZyB0aGUgeG1sIGZpbGVcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgICBtZXNzYWdlOiAnVGhlIG1ldGEubHN4IGZpbGUgaW4gXCJ7e21vZE5hbWV9fVwiIGlzIGludmFsaWQsIHBsZWFzZSByZXBvcnQgdGhpcyB0byB0aGUgYXV0aG9yJyxcbiAgICAgICAgYWN0aW9uczogW3tcbiAgICAgICAgICB0aXRsZTogJ01vcmUnLFxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0ludmFsaWQgbWV0YS5sc3ggZmlsZScsIHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICB9LCBbeyBsYWJlbDogJ0Nsb3NlJyB9XSlcbiAgICAgICAgICB9XG4gICAgICAgIH1dLFxuICAgICAgICByZXBsYWNlOiB7XG4gICAgICAgICAgbW9kTmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZE5vZGU8VCBleHRlbmRzIElYbWxOb2RlPHsgaWQ6IHN0cmluZyB9PiwgVT4obm9kZXM6IFRbXSwgaWQ6IHN0cmluZyk6IFQge1xuICByZXR1cm4gbm9kZXM/LmZpbmQoaXRlciA9PiBpdGVyLiQuaWQgPT09IGlkKSA/PyB1bmRlZmluZWQ7XG59XG5cbmNvbnN0IGxpc3RDYWNoZTogeyBbcGF0aDogc3RyaW5nXTogUHJvbWlzZTxzdHJpbmdbXT4gfSA9IHt9O1xuXG5hc3luYyBmdW5jdGlvbiBsaXN0UGFja2FnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgZGl2aW5lKGFwaSwgJ2xpc3QtcGFja2FnZScsIHsgc291cmNlOiBwYWtQYXRoIH0pO1xuICBjb25zdCBsaW5lcyA9IHJlcy5zdGRvdXQuc3BsaXQoJ1xcbicpLm1hcChsaW5lID0+IGxpbmUudHJpbSgpKS5maWx0ZXIobGluZSA9PiBsaW5lLmxlbmd0aCAhPT0gMCk7XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpc0xPTGlzdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGlmIChsaXN0Q2FjaGVbcGFrUGF0aF0gPT09IHVuZGVmaW5lZCkge1xuICAgIGxpc3RDYWNoZVtwYWtQYXRoXSA9IGxpc3RQYWNrYWdlKGFwaSwgcGFrUGF0aCk7XG4gIH1cbiAgY29uc3QgbGluZXMgPSBhd2FpdCBsaXN0Q2FjaGVbcGFrUGF0aF07XG4gIC8vIGNvbnN0IG5vbkdVSSA9IGxpbmVzLmZpbmQobGluZSA9PiAhbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKTtcbiAgY29uc3QgbWV0YUxTWCA9IGxpbmVzLmZpbmQobGluZSA9PlxuICAgIHBhdGguYmFzZW5hbWUobGluZS5zcGxpdCgnXFx0JylbMF0pLnRvTG93ZXJDYXNlKCkgPT09ICdtZXRhLmxzeCcpO1xuICBcbiAgICByZXR1cm4gbWV0YUxTWCA9PT0gdW5kZWZpbmVkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mb0ltcGwoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IFByb21pc2U8SVBha0luZm8+IHtcbiAgY29uc3QgbWV0YSA9IGF3YWl0IGV4dHJhY3RNZXRhKGFwaSwgcGFrUGF0aCwgbW9kKTtcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobWV0YT8uc2F2ZT8ucmVnaW9uLCAnQ29uZmlnJyk7XG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XG4gIGNvbnN0IG1vZHVsZUluZm8gPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kdWxlSW5mbycpO1xuXG4gIGNvbnN0IGF0dHIgPSAobmFtZTogc3RyaW5nLCBmYWxsYmFjazogKCkgPT4gYW55KSA9PlxuICAgIGZpbmROb2RlKG1vZHVsZUluZm8/LmF0dHJpYnV0ZSwgbmFtZSk/LiQ/LnZhbHVlID8/IGZhbGxiYWNrKCk7XG5cbiAgY29uc3QgZ2VuTmFtZSA9IHBhdGguYmFzZW5hbWUocGFrUGF0aCwgcGF0aC5leHRuYW1lKHBha1BhdGgpKTtcblxuICBsZXQgaXNMaXN0ZWQgPSBhd2FpdCBpc0xPTGlzdGVkKGFwaSwgcGFrUGF0aCk7XG5cbiAgcmV0dXJuIHtcbiAgICBhdXRob3I6IGF0dHIoJ0F1dGhvcicsICgpID0+ICdVbmtub3duJyksXG4gICAgZGVzY3JpcHRpb246IGF0dHIoJ0Rlc2NyaXB0aW9uJywgKCkgPT4gJ01pc3NpbmcnKSxcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxuICAgIG1kNTogYXR0cignTUQ1JywgKCkgPT4gJycpLFxuICAgIG5hbWU6IGF0dHIoJ05hbWUnLCAoKSA9PiBnZW5OYW1lKSxcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxuICAgIHV1aWQ6IGF0dHIoJ1VVSUQnLCAoKSA9PiByZXF1aXJlKCd1dWlkJykudjQoKSksXG4gICAgdmVyc2lvbjogYXR0cignVmVyc2lvbicsICgpID0+ICcxJyksXG4gICAgaXNMaXN0ZWQ6IGlzTGlzdGVkXG4gIH07XG59XG5cbmNvbnN0IGZhbGxiYWNrUGljdHVyZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdnYW1lYXJ0LmpwZycpO1xuXG5sZXQgc3RvcmVkTE86IGFueVtdO1xuXG5mdW5jdGlvbiBwYXJzZU1vZE5vZGUobm9kZTogSU1vZE5vZGUpIHtcbiAgY29uc3QgbmFtZSA9IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnTmFtZScpLiQudmFsdWU7XG4gIHJldHVybiB7XG4gICAgaWQ6IG5hbWUsXG4gICAgbmFtZSxcbiAgICBkYXRhOiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kLnZhbHVlLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcbiAgY29uc3QgYmczcHJvZmlsZTogc3RyaW5nID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xuICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IGdldFBsYXllclByb2ZpbGVzKCk7XG4gIGlmIChwbGF5ZXJQcm9maWxlcy5sZW5ndGggPT09IDApIHtcbiAgICBzdG9yZWRMTyA9IFtdO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJylcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXG4gICAgOiBwYXRoLmpvaW4oZ2xvYmFsUHJvZmlsZVBhdGgoKSwgJ21vZHNldHRpbmdzLmxzeCcpO1xuICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHNldHRpbmdzUGF0aCk7XG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd3JpdGVNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRhdGE6IElNb2RTZXR0aW5ncywgYmczcHJvZmlsZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghYmczcHJvZmlsZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJykgXG4gICAgPyBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKVxuICAgIDogcGF0aC5qb2luKGdsb2JhbFByb2ZpbGVQYXRoKCksICdtb2RzZXR0aW5ncy5sc3gnKTtcblxuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcbiAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChkYXRhKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShzZXR0aW5nc1BhdGgpKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhzZXR0aW5nc1BhdGgsIHhtbCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHN0b3JlZExPID0gW107XG4gICAgY29uc3QgYWxsb3dSZXBvcnQgPSBbJ0VOT0VOVCcsICdFUEVSTSddLmluY2x1ZGVzKGVyci5jb2RlKTtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIHNldHRpbmdzJywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgIHJldHVybjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkU3RvcmVkTE8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xuICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xuICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcbiAgY29uc3QgbW9kc1Jvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xuICBjb25zdCBtb2RPcmRlck5vZGVzID0gbW9kT3JkZXJSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xuICBjb25zdCBtb2ROb2RlcyA9IG1vZHNSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xuXG4gIGNvbnN0IG1vZE9yZGVyID0gbW9kT3JkZXJOb2Rlcy5tYXAobm9kZSA9PiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kPy52YWx1ZSk7XG5cbiAgLy8gcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgdlByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgZW5hYmxlZCA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihpZCA9PlxuICAgIHV0aWwuZ2V0U2FmZSh2UHJvZmlsZSwgWydtb2RTdGF0ZScsIGlkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XG4gIGlmIChlbmFibGVkLmxlbmd0aCA+IDAgJiYgbW9kTm9kZXMubGVuZ3RoID09PSAxKSB7XG4gICAgY29uc3QgbGFzdFdyaXRlID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5zZXR0aW5nc1dyaXR0ZW4/LltiZzNwcm9maWxlXTtcbiAgICBpZiAoKGxhc3RXcml0ZSAhPT0gdW5kZWZpbmVkKSAmJiAobGFzdFdyaXRlLmNvdW50ID4gMSkpIHtcbiAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1wibW9kc2V0dGluZ3MubHN4XCIgZmlsZSB3YXMgcmVzZXQnLCB7XG4gICAgICAgIHRleHQ6ICdUaGUgZ2FtZSByZXNldCB0aGUgbGlzdCBvZiBhY3RpdmUgbW9kcyBhbmQgcmFuIHdpdGhvdXQgdGhlbS5cXG4nXG4gICAgICAgICAgICArICdUaGlzIGhhcHBlbnMgd2hlbiBhbiBpbnZhbGlkIG9yIGluY29tcGF0aWJsZSBtb2QgaXMgaW5zdGFsbGVkLiAnXG4gICAgICAgICAgICArICdUaGUgZ2FtZSB3aWxsIG5vdCBsb2FkIGFueSBtb2RzIGlmIG9uZSBvZiB0aGVtIGlzIGluY29tcGF0aWJsZSwgdW5mb3J0dW5hdGVseSAnXG4gICAgICAgICAgICArICd0aGVyZSBpcyBubyBlYXN5IHdheSB0byBmaW5kIG91dCB3aGljaCBvbmUgY2F1c2VkIHRoZSBwcm9ibGVtLicsXG4gICAgICB9LCBbXG4gICAgICAgIHsgbGFiZWw6ICdDb250aW51ZScgfSxcbiAgICAgIF0pO1xuICAgIH1cbiAgfVxuXG4gIHN0b3JlZExPID0gbW9kTm9kZXNcbiAgICAubWFwKG5vZGUgPT4gcGFyc2VNb2ROb2RlKG5vZGUpKVxuICAgIC8vIEd1c3RhdiBpcyB0aGUgY29yZSBnYW1lXG4gICAgLmZpbHRlcihlbnRyeSA9PiBlbnRyeS5pZCA9PT0gJ0d1c3RhdicpXG4gICAgLy8gc29ydCBieSB0aGUgaW5kZXggb2YgZWFjaCBtb2QgaW4gdGhlIG1vZE9yZGVyIGxpc3RcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG1vZE9yZGVyXG4gICAgICAuZmluZEluZGV4KGkgPT4gaSA9PT0gbGhzLmRhdGEpIC0gbW9kT3JkZXIuZmluZEluZGV4KGkgPT4gaSA9PT0gcmhzLmRhdGEpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS0xpc3QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGxldCBwYWtzOiBzdHJpbmdbXTtcbiAgdHJ5IHtcbiAgICBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcbiAgICAgIC5maWx0ZXIoZmlsZU5hbWUgPT4gcGF0aC5leHRuYW1lKGZpbGVOYW1lKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKCksICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gbm9wXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZHMgZGlyZWN0b3J5JywgZXJyLCB7XG4gICAgICAgIGlkOiAnYmczLWZhaWxlZC1yZWFkLW1vZHMnLFxuICAgICAgICBtZXNzYWdlOiBtb2RzUGF0aCgpLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHBha3MgPSBbXTtcbiAgfVxuXG4gIHJldHVybiBwYWtzO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpXG4gICAgOiBQcm9taXNlPEFycmF5PHsgZmlsZU5hbWU6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kLCBpbmZvOiBJUGFrSW5mbyB9Pj4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBsc0xpYiA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIFxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS0xpc3QoYXBpKTtcblxuICBsZXQgbWFuaWZlc3Q7XG4gIHRyeSB7XG4gICAgbWFuaWZlc3QgPSBhd2FpdCB1dGlsLmdldE1hbmlmZXN0KGFwaSwgJycsIEdBTUVfSUQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGRlcGxveW1lbnQgbWFuaWZlc3QnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgcmVzID0gYXdhaXQgUHJvbWlzZS5hbGwocGFrcy5tYXAoYXN5bmMgZmlsZU5hbWUgPT4ge1xuICAgIHJldHVybiB1dGlsLndpdGhFcnJvckNvbnRleHQoJ3JlYWRpbmcgcGFrJywgZmlsZU5hbWUsICgpID0+IHtcbiAgICAgIGNvbnN0IGZ1bmMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IG1hbmlmZXN0LmZpbGVzLmZpbmQoZW50cnkgPT4gZW50cnkucmVsUGF0aCA9PT0gZmlsZU5hbWUpO1xuICAgICAgICAgIGNvbnN0IG1vZCA9IChtYW5pZmVzdEVudHJ5ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXT8uW21hbmlmZXN0RW50cnkuc291cmNlXVxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICBjb25zdCBwYWtQYXRoID0gcGF0aC5qb2luKG1vZHNQYXRoKCksIGZpbGVOYW1lKTtcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgICAgIG1vZCxcbiAgICAgICAgICAgIGluZm86IGF3YWl0IGV4dHJhY3RQYWtJbmZvSW1wbChhcGksIHBha1BhdGgsIG1vZCksXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIERpdmluZUV4ZWNNaXNzaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gJ1RoZSBpbnN0YWxsZWQgY29weSBvZiBMU0xpYi9EaXZpbmUgaXMgY29ycnVwdGVkIC0gcGxlYXNlICdcbiAgICAgICAgICAgICAgKyAnZGVsZXRlIHRoZSBleGlzdGluZyBMU0xpYiBtb2QgZW50cnkgYW5kIHJlLWluc3RhbGwgaXQuIE1ha2Ugc3VyZSB0byAnXG4gICAgICAgICAgICAgICsgJ2Rpc2FibGUgb3IgYWRkIGFueSBuZWNlc3NhcnkgZXhjZXB0aW9ucyB0byB5b3VyIHNlY3VyaXR5IHNvZnR3YXJlIHRvICdcbiAgICAgICAgICAgICAgKyAnZW5zdXJlIGl0IGRvZXMgbm90IGludGVyZmVyZSB3aXRoIFZvcnRleC9MU0xpYiBmaWxlIG9wZXJhdGlvbnMuJztcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0RpdmluZSBleGVjdXRhYmxlIGlzIG1pc3NpbmcnLCBtZXNzYWdlLFxuICAgICAgICAgICAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGNvdWxkIGhhcHBlbiBpZiB0aGUgZmlsZSBnb3QgZGVsZXRlZCBzaW5jZSByZWFkaW5nIHRoZSBsaXN0IG9mIHBha3MuXG4gICAgICAgICAgLy8gYWN0dWFsbHksIHRoaXMgc2VlbXMgdG8gYmUgZmFpcmx5IGNvbW1vbiB3aGVuIHVwZGF0aW5nIGEgbW9kXG4gICAgICAgICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgcGFrLiBQbGVhc2UgbWFrZSBzdXJlIHlvdSBhcmUgdXNpbmcgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIExTTGliIGJ5IHVzaW5nIHRoZSBcIlJlLWluc3RhbGwgTFNMaWIvRGl2aW5lXCIgdG9vbGJhciBidXR0b24gb24gdGhlIE1vZHMgcGFnZS4nLCBlcnIsIHtcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZnVuYygpKTtcbiAgICB9KTtcbiAgfSkpO1xuICByZXR1cm4gcmVzLmZpbHRlcihpdGVyID0+IGl0ZXIgIT09IHVuZGVmaW5lZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcbiAgICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcbiAgICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xuICAgIGNvbnN0IG1vZE9yZGVyUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpO1xuICAgIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XG4gICAgcmV0dXJuIG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzZXR0aW5ncy5sc3gnLCBlcnIsIHtcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXG4gICAgfSk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG9yZGVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiB3cml0ZUxvYWRPcmRlcihhcGksIG9yZGVyKTtcbn1cblxuY29uc3QgZGVzZXJpYWxpemVEZWJvdW5jZXIgPSBuZXcgdXRpbC5EZWJvdW5jZXIoKCkgPT4ge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59LCAxMDAwKTtcblxuYXN5bmMgZnVuY3Rpb24gZGVzZXJpYWxpemVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxhbnk+IHtcbiAgLy8gdGhpcyBmdW5jdGlvbiBtaWdodCBiZSBpbnZva2VkIGJ5IHRoZSBsc2xpYiBtb2QgYmVpbmcgKHVuKWluc3RhbGxlZCBpbiB3aGljaCBjYXNlIGl0IG1pZ2h0IGJlXG4gIC8vIGluIHRoZSBtaWRkbGUgb2YgYmVpbmcgdW5wYWNrZWQgb3IgcmVtb3ZlZCB3aGljaCBsZWFkcyB0byB3ZWlyZCBlcnJvciBtZXNzYWdlcy5cbiAgLy8gdGhpcyBpcyBhIGhhY2sgaG9wZWZ1bGx5IGVuc3VyZWluZyB0aGUgaXQncyBlaXRoZXIgZnVsbHkgdGhlcmUgb3Igbm90IGF0IGFsbFxuICBhd2FpdCB1dGlsLnRvUHJvbWlzZShjYiA9PiBkZXNlcmlhbGl6ZURlYm91bmNlci5zY2hlZHVsZShjYikpO1xuXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLcyhhcGkpO1xuXG4gIGNvbnN0IG9yZGVyID0gYXdhaXQgcmVhZExPKGFwaSk7XG5cbiAgY29uc3Qgb3JkZXJWYWx1ZSA9IChpbmZvOiBJUGFrSW5mbykgPT4ge1xuICAgIHJldHVybiBvcmRlci5pbmRleE9mKGluZm8udXVpZCkgKyAoaW5mby5pc0xpc3RlZCA/IDAgOiAxMDAwKTtcbiAgfTtcblxuICByZXR1cm4gcGFrc1xuICAgIC5zb3J0KChsaHMsIHJocykgPT4gb3JkZXJWYWx1ZShsaHMuaW5mbykgLSBvcmRlclZhbHVlKHJocy5pbmZvKSlcbiAgICAubWFwKCh7IGZpbGVOYW1lLCBtb2QsIGluZm8gfSkgPT4gKHtcbiAgICAgIGlkOiBmaWxlTmFtZSxcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBuYW1lOiB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSxcbiAgICAgIG1vZElkOiBtb2Q/LmlkLFxuICAgICAgbG9ja2VkOiBpbmZvLmlzTGlzdGVkLFxuICAgICAgZGF0YTogaW5mbyxcbiAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlKGJlZm9yZSwgYWZ0ZXIpOiBQcm9taXNlPGFueT4ge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmxldCBmb3JjZVJlZnJlc2g6ICgpID0+IHZvaWQ7XG5cbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCByZWZyZXNoOiAoKSA9PiB2b2lkIH0pIHtcbiAgY29uc3QgeyBhcGkgfSA9IHByb3BzO1xuXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XG4gICAgc3RhdGUuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddPy5wbGF5ZXJQcm9maWxlKTtcblxuICBjb25zdCBbZ2FtZVZlcnNpb24sIHNldEdhbWVWZXJzaW9uXSA9IFJlYWN0LnVzZVN0YXRlPHN0cmluZz4oKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZvcmNlUmVmcmVzaCA9IHByb3BzLnJlZnJlc2g7XG4gIH0sIFtdKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIChhc3luYyAoKSA9PiB7XG4gICAgICBzZXRHYW1lVmVyc2lvbihhd2FpdCBnZXRPd25HYW1lVmVyc2lvbihhcGkuZ2V0U3RhdGUoKSkpO1xuICAgIH0pKCk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBvblNldFByb2ZpbGUgPSBSZWFjdC51c2VDYWxsYmFjaygocHJvZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGltcGwgPSBhc3luYyAoKSA9PiB7XG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlTmFtZSkpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZvcmNlUmVmcmVzaD8uKCk7XG4gICAgfTtcbiAgICBpbXBsKCk7XG4gIH0sIFsgYXBpIF0pO1xuXG4gIGNvbnN0IGlzTHNMaWJJbnN0YWxsZWQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgcmV0dXJuIGdldExhdGVzdExTTGliTW9kKGFwaSkgIT09IHVuZGVmaW5lZDtcbiAgfSwgWyBhcGkgXSk7XG5cbiAgY29uc3Qgb25JbnN0YWxsTFNMaWIgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgb25HYW1lTW9kZUFjdGl2YXRlZChhcGksIEdBTUVfSUQpO1xuICB9LCBbYXBpXSk7XG5cbiAgaWYgKCFnYW1lVmVyc2lvbikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8SW5mb1BhbmVsXG4gICAgICB0PXthcGkudHJhbnNsYXRlfVxuICAgICAgZ2FtZVZlcnNpb249e2dhbWVWZXJzaW9ufVxuICAgICAgY3VycmVudFByb2ZpbGU9e2N1cnJlbnRQcm9maWxlfVxuICAgICAgb25TZXRQbGF5ZXJQcm9maWxlPXtvblNldFByb2ZpbGV9XG4gICAgICBpc0xzTGliSW5zdGFsbGVkPXtpc0xzTGliSW5zdGFsbGVkfVxuICAgICAgb25JbnN0YWxsTFNMaWI9e29uSW5zdGFsbExTTGlifVxuICAgIC8+XG4gICk7XG59XG5cbmZ1bmN0aW9uIGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcblxuICByZXR1cm4gT2JqZWN0LmtleXMobW9kcykucmVkdWNlKChwcmV2LCBpZCkgPT4ge1xuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xuICAgICAgY29uc3QgYXJjSWQgPSBtb2RzW2lkXS5hcmNoaXZlSWQ7XG4gICAgICBjb25zdCBkbDogdHlwZXMuSURvd25sb2FkID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnZG93bmxvYWRzJywgJ2ZpbGVzJywgYXJjSWRdLCB1bmRlZmluZWQpO1xuICAgICAgY29uc3Qgc3RvcmVkVmVyID0gdXRpbC5nZXRTYWZlKG1vZHNbaWRdLCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNlbXZlci5ndChzdG9yZWRWZXIsIHByZXYpKSB7XG4gICAgICAgICAgcHJldiA9IHN0b3JlZFZlcjtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZygnd2FybicsICdpbnZhbGlkIHZlcnNpb24gc3RvcmVkIGZvciBsc2xpYiBtb2QnLCB7IGlkLCB2ZXJzaW9uOiBzdG9yZWRWZXIgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIFRoZSBMU0xpYiBkZXZlbG9wZXIgZG9lc24ndCBhbHdheXMgdXBkYXRlIHRoZSB2ZXJzaW9uIG9uIHRoZSBleGVjdXRhYmxlXG4gICAgICAgIC8vICBpdHNlbGYgLSB3ZSdyZSBnb2luZyB0byB0cnkgdG8gZXh0cmFjdCBpdCBmcm9tIHRoZSBhcmNoaXZlIHdoaWNoIHRlbmRzXG4gICAgICAgIC8vICB0byB1c2UgdGhlIGNvcnJlY3QgdmVyc2lvbi5cbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRsLmxvY2FsUGF0aCwgcGF0aC5leHRuYW1lKGRsLmxvY2FsUGF0aCkpO1xuICAgICAgICBjb25zdCBpZHggPSBmaWxlTmFtZS5pbmRleE9mKCctdicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHZlciA9IHNlbXZlci5jb2VyY2UoZmlsZU5hbWUuc2xpY2UoaWR4ICsgMikpLnZlcnNpb247XG4gICAgICAgICAgaWYgKHNlbXZlci52YWxpZCh2ZXIpICYmIHZlciAhPT0gc3RvcmVkVmVyKSB7XG4gICAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgaWQsICd2ZXJzaW9uJywgdmVyKSk7XG4gICAgICAgICAgICBwcmV2ID0gdmVyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGdldCB0aGUgdmVyc2lvbi4uLiBPaCB3ZWxsLi4gU2V0IGEgYm9ndXMgdmVyc2lvbiBzaW5jZVxuICAgICAgICAgIC8vICB3ZSBjbGVhcmx5IGhhdmUgbHNsaWIgaW5zdGFsbGVkIC0gdGhlIHVwZGF0ZSBmdW5jdGlvbmFsaXR5IHNob3VsZCB0YWtlXG4gICAgICAgICAgLy8gIGNhcmUgb2YgdGhlIHJlc3QgKHdoZW4gdGhlIHVzZXIgY2xpY2tzIHRoZSBjaGVjayBmb3IgdXBkYXRlcyBidXR0b24pXG4gICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsICcxLjAuMCcpKTtcbiAgICAgICAgICBwcmV2ID0gJzEuMC4wJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSwgJzAuMC4wJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uQ2hlY2tNb2RWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoYXBpLmdldFN0YXRlKCkpO1xuICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQgfHwgZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xuXG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcbiAgICAvLyBOb3RoaW5nIHRvIHVwZGF0ZS5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBuZXdlc3RWZXI6IHN0cmluZyA9IGF3YWl0IGdpdEh1YkRvd25sb2FkZXIuY2hlY2tGb3JVcGRhdGVzKGFwaSwgbGF0ZXN0VmVyKTtcbiAgaWYgKCFuZXdlc3RWZXIgfHwgbmV3ZXN0VmVyID09PSBsYXRlc3RWZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9wKCkge1xuICAvLyBub3Bcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25HYW1lTW9kZUFjdGl2YXRlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nKSB7XG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhhcGkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxuICAgICAgJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XG4gICAgYXdhaXQgZ2l0SHViRG93bmxvYWRlci5kb3dubG9hZERpdmluZShhcGkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICdiYWxkdXJzZ2F0ZTMnXSwgcmVkdWNlcik7XG5cbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBHQU1FX0lELFxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnMy5leGUnLFxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgIF0sXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczX2R4MTEuZXhlJyxcbiAgICBzZXR1cDogZGlzY292ZXJ5ID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcbiAgICBdLFxuICAgIGVudmlyb25tZW50OiB7XG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9JRCxcbiAgICAgIHN0b3BQYXR0ZXJuczogU1RPUF9QQVRURVJOUy5tYXAodG9Xb3JkRXhwKSxcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogW1xuICAgICAgICAnaW5mby5qc29uJyxcbiAgICAgIF0sXG4gICAgICBpZ25vcmVEZXBsb3k6IFtcbiAgICAgICAgJ2luZm8uanNvbicsXG4gICAgICBdLFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDMwMCwgJ3NldHRpbmdzJywge30sICdSZS1pbnN0YWxsIExTTGliL0RpdmluZScsICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XG4gICAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgICBjb25zdCBsc2xpYnMgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIobW9kID0+IG1vZHNbbW9kXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJyk7XG4gICAgY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3JlbW92ZS1tb2RzJywgR0FNRV9JRCwgbHNsaWJzLCAoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlaW5zdGFsbCBsc2xpYicsXG4gICAgICAgICAgJ1BsZWFzZSByZS1pbnN0YWxsIG1hbnVhbGx5JywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGdpdEh1YkRvd25sb2FkZXIuZG93bmxvYWREaXZpbmUoY29udGV4dC5hcGkpO1xuICAgIH0pO1xuICB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIGdhbWVNb2RlID09PSBHQU1FX0lEO1xuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtcmVwbGFjZXInLCAyNSwgdGVzdFJlcGxhY2VyLCBpbnN0YWxsUmVwbGFjZXIpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtbHNsaWItZGl2aW5lLXRvb2wnLCAxNSwgdGVzdExTTGliLCBpbnN0YWxsTFNMaWIgYXMgYW55KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLXJlcGxhY2VyJywgMjUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoKSA9PiBnZXRHYW1lRGF0YVBhdGgoY29udGV4dC5hcGkpLCBmaWxlcyA9PiBpc1JlcGxhY2VyKGNvbnRleHQuYXBpLCBmaWxlcyksXG4gICAgeyBuYW1lOiAnQkczIFJlcGxhY2VyJyB9IGFzIGFueSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsIDE1LCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKCkgPT4gdW5kZWZpbmVkLCBmaWxlcyA9PiBpc0xTTGliKGNvbnRleHQuYXBpLCBmaWxlcyksXG4gICAgeyBuYW1lOiAnQkczIExTTGliJyB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpKSxcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIpID0+IHNlcmlhbGl6ZUxvYWRPcmRlcihjb250ZXh0LmFwaSwgbG9hZE9yZGVyKSxcbiAgICB2YWxpZGF0ZSxcbiAgICB0b2dnbGVhYmxlRW50cmllczogdHJ1ZSxcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+ICg8SW5mb1BhbmVsV3JhcCBhcGk9e2NvbnRleHQuYXBpfSByZWZyZXNoPXtub3B9IC8+KSkgYXMgYW55LFxuICB9KTtcblxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXNzaW9uJywgJ2Jhc2UnLCAndG9vbHNSdW5uaW5nJ10sXG4gICAgICBhc3luYyAocHJldjogYW55LCBjdXJyZW50OiBhbnkpID0+IHtcbiAgICAgICAgLy8gd2hlbiBhIHRvb2wgZXhpdHMsIHJlLXJlYWQgdGhlIGxvYWQgb3JkZXIgZnJvbSBkaXNrIGFzIGl0IG1heSBoYXZlIGJlZW5cbiAgICAgICAgLy8gY2hhbmdlZFxuICAgICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XG4gICAgICAgIGlmICgoZ2FtZU1vZGUgPT09IEdBTUVfSUQpICYmIChPYmplY3Qua2V5cyhjdXJyZW50KS5sZW5ndGggPT09IDApKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhjb250ZXh0LmFwaSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCAocHJvZmlsZUlkOiBzdHJpbmcsIGRlcGxveW1lbnQpID0+IHtcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSwgcHJvZmlsZUlkKTtcbiAgICAgIGlmICgocHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZm9yY2VSZWZyZXNoICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIGZvcmNlUmVmcmVzaCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0pO1xuXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdjaGVjay1tb2RzLXZlcnNpb24nLFxuICAgICAgKGdhbWVJZDogc3RyaW5nLCBtb2RzOiB0eXBlcy5JTW9kW10pID0+IG9uQ2hlY2tNb2RWZXJzaW9uKGNvbnRleHQuYXBpLCBnYW1lSWQsIG1vZHMpKTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJyxcbiAgICAgIGFzeW5jIChnYW1lTW9kZTogc3RyaW5nKSA9PiBvbkdhbWVNb2RlQWN0aXZhdGVkKGNvbnRleHQuYXBpLCBnYW1lTW9kZSkpO1xuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==