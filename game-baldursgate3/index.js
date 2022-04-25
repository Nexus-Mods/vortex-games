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
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
function toWordExp(input) {
    return '(^|/)' + input + '(/|$)';
}
const setPlayerProfile = redux_act_1.createAction('BG3_SET_PLAYERPROFILE', name => name);
const settingsWritten = redux_act_1.createAction('BG3_SETTINGS_WRITTEN', (profile, time, count) => ({ profile, time, count }));
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
    return vortex_api_1.util.GameStoreHelper.findByAppId(['1456460669', '1086940'])
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
        .catch(() => vortex_api_1.fs.ensureDirWritableAsync(mp, () => bluebird_1.default.resolve())
        .then(() => api.showDialog('info', 'Early Access Game', {
        bbcode: 'Baldur\'s Gate 3 is currently in Early Access. It doesn\'t officially '
            + 'support modding, doesn\'t include any modding tools and will receive '
            + 'frequent updates.<br/>'
            + 'Mods may become incompatible within days of being released, generally '
            + 'not work and/or break unrelated things within the game.<br/><br/>'
            + '[color="red"]Please don\'t report issues that happen in connection with mods to the '
            + 'game developers (Larian Studios) or through the Vortex feedback system.[/color]',
    }, [{ label: 'I understand' }])))
        .finally(() => ensureGlobalProfile(api, discovery));
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
        let ver = yield exe_version_1.default(exePath);
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
            { label: 'Install as Replacer' },
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
function InfoPanel(props) {
    const { t, currentProfile, onInstallLSLib, onSetPlayerProfile, isLsLibInstalled } = props;
    const onSelect = React.useCallback((ev) => {
        onSetPlayerProfile(ev.currentTarget.value);
    }, [onSetPlayerProfile]);
    return isLsLibInstalled() ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } },
            t('Ingame Profile: '),
            React.createElement(react_bootstrap_1.FormControl, { componentClass: 'select', name: 'userProfile', className: 'form-control', value: currentProfile, onChange: onSelect },
                React.createElement("option", { key: 'global', value: 'global' }, t('All Profiles')),
                getPlayerProfiles().map(prof => (React.createElement("option", { key: prof, value: prof }, prof))))),
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
function getActivePlayerProfile(api) {
    var _a;
    return ((_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile) || 'global';
}
function writeLoadOrder(api, loadOrder) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = getActivePlayerProfile(api);
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
            const descriptionNodes = (_l = (_k = (_j = (_h = (_g = modsNode === null || modsNode === void 0 ? void 0 : modsNode.children) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.node) === null || _j === void 0 ? void 0 : _j.filter) === null || _k === void 0 ? void 0 : _k.call(_j, iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'Gustav')))) !== null && _l !== void 0 ? _l : [];
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
        vortex_api_1.log('warn', 'LSLib is not installed');
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
                vortex_api_1.log('warn', 'invalid mod version', { modId: id, version: currentVer });
            }
        }
        return prev;
    }, undefined);
    if (lsLib === undefined) {
        vortex_api_1.log('warn', 'LSLib is not installed');
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
        const proc = child_process_1.spawn(exe, args);
        proc.stdout.on('data', data => stdout += data);
        proc.stderr.on('data', data => vortex_api_1.log('warn', data));
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
                else if (code === 2) {
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
function extractMeta(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const metaPath = path.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', shortid_1.generate());
        yield vortex_api_1.fs.ensureDirAsync(metaPath);
        yield extractPak(api, pakPath, metaPath, '*/meta.lsx');
        try {
            let metaLSXPath = path.join(metaPath, 'meta.lsx');
            yield turbowalk_1.default(metaPath, entries => {
                const temp = entries.find(e => path.basename(e.filePath).toLowerCase() === 'meta.lsx');
                if (temp !== undefined) {
                    metaLSXPath = temp.filePath;
                }
            });
            const dat = yield vortex_api_1.fs.readFileAsync(metaLSXPath);
            const meta = yield xml2js_1.parseStringPromise(dat);
            yield vortex_api_1.fs.removeAsync(metaPath);
            return meta;
        }
        catch (err) {
            yield vortex_api_1.fs.removeAsync(metaPath);
            if (err.code === 'ENOENT') {
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
function extractPakInfoImpl(api, pakPath) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const meta = yield extractMeta(api, pakPath);
        const config = findNode((_a = meta === null || meta === void 0 ? void 0 : meta.save) === null || _a === void 0 ? void 0 : _a.region, 'Config');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const moduleInfo = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModuleInfo');
        const attr = (name, fallback) => { var _a, _b, _c; return (_c = (_b = (_a = findNode(moduleInfo === null || moduleInfo === void 0 ? void 0 : moduleInfo.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback(); };
        const genName = path.basename(pakPath, path.extname(pakPath));
        return {
            author: attr('Author', () => 'Unknown'),
            description: attr('Description', () => 'Missing'),
            folder: attr('Folder', () => genName),
            md5: attr('MD5', () => ''),
            name: attr('Name', () => genName),
            type: attr('Type', () => 'Adventure'),
            uuid: attr('UUID', () => require('uuid').v4()),
            version: attr('Version', () => '1'),
            isListed: yield isLOListed(api, pakPath),
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
        const bg3profile = getActivePlayerProfile(api);
        const playerProfiles = getPlayerProfiles();
        if (playerProfiles.length === 0) {
            storedLO = [];
            return;
        }
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfilePath(), 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
        return xml2js_1.parseStringPromise(dat);
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
                            ? (_a = state.persistent.mods[common_1.GAME_ID]) === null || _a === void 0 ? void 0 : _a[manifestEntry.source] : undefined;
                        return {
                            fileName,
                            mod,
                            info: yield extractPakInfoImpl(api, path.join(modsPath(), fileName)),
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
                            api.showErrorNotification('Failed to read pak', err, {
                                allowReport: true,
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
    const currentProfile = react_redux_1.useSelector((state) => { var _a; return (_a = state.settings['baldursgate3']) === null || _a === void 0 ? void 0 : _a.playerProfile; });
    React.useEffect(() => {
        forceRefresh = props.refresh;
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
    return (React.createElement(InfoPanel, { t: api.translate, currentProfile: currentProfile, onSetPlayerProfile: onSetProfile, isLsLibInstalled: isLsLibInstalled, onInstallLSLib: onInstallLSLib }));
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
                vortex_api_1.log('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
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
            SteamAPPId: '1086940',
        },
        details: {
            steamAppId: 1086940,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGlEQUFzQztBQUN0Qyw4REFBcUM7QUFFckMsMkNBQTZCO0FBQzdCLDZDQUErQjtBQUMvQixxREFBOEM7QUFDOUMsNkNBQTBDO0FBQzFDLHlDQUF5QztBQUN6QywrQ0FBaUM7QUFDakMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6QywyQ0FBK0U7QUFDL0UsbUNBQXFEO0FBR3JELHFDQUFvRTtBQUNwRSxxRUFBdUQ7QUFFdkQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUV2QyxTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUdELE1BQU0sZ0JBQWdCLEdBQUcsd0JBQVksQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdFLE1BQU0sZUFBZSxHQUFHLHdCQUFZLENBQUMsc0JBQXNCLEVBQ3pELENBQUMsT0FBZSxFQUFFLElBQVksRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztBQUdoRixNQUFNLE9BQU8sR0FBdUI7SUFDbEMsUUFBUSxFQUFFO1FBQ1IsQ0FBQyxnQkFBdUIsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsZUFBZSxDQUFDLEVBQUUsT0FBTyxDQUFDO1FBQzlGLENBQUMsZUFBc0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzNDLE1BQU0sRUFBRSxP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QUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsQ0FBQyxFQUFFO2dCQUNqRSxZQUFZLEVBQUUsQ0FBQzthQUNoQjtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUN4QyxDQUFDLE1BQWMsRUFBRSxJQUFrQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXhGLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFDeEMsQ0FBTyxRQUFnQixFQUFFLEVBQUUsZ0RBQUMsT0FBQSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFBLEdBQUEsQ0FBQyxDQUFDO0lBQzVFLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0IGdldFZlcnNpb24gZnJvbSAnZXhlLXZlcnNpb24nO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgRm9ybUNvbnRyb2wgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgY3JlYXRlQWN0aW9uIH0gZnJvbSAncmVkdXgtYWN0JztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGdlbmVyYXRlIGFzIHNob3J0aWQgfSBmcm9tICdzaG9ydGlkJztcclxuaW1wb3J0IHdhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0b29sdGlwLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElNb2ROb2RlLCBJTW9kU2V0dGluZ3MsIElQYWtJbmZvLCBJWG1sTm9kZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgREVGQVVMVF9NT0RfU0VUVElOR1MsIEdBTUVfSUQsIExTTElCX1VSTCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xyXG5cclxuY29uc3QgU1RPUF9QQVRURVJOUyA9IFsnW14vXSpcXFxcLnBhayQnXTtcclxuXHJcbmZ1bmN0aW9uIHRvV29yZEV4cChpbnB1dCkge1xyXG4gIHJldHVybiAnKF58LyknICsgaW5wdXQgKyAnKC98JCknO1xyXG59XHJcblxyXG4vLyBhY3Rpb25zXHJcbmNvbnN0IHNldFBsYXllclByb2ZpbGUgPSBjcmVhdGVBY3Rpb24oJ0JHM19TRVRfUExBWUVSUFJPRklMRScsIG5hbWUgPT4gbmFtZSk7XHJcbmNvbnN0IHNldHRpbmdzV3JpdHRlbiA9IGNyZWF0ZUFjdGlvbignQkczX1NFVFRJTkdTX1dSSVRURU4nLFxyXG4gIChwcm9maWxlOiBzdHJpbmcsIHRpbWU6IG51bWJlciwgY291bnQ6IG51bWJlcikgPT4gKHsgcHJvZmlsZSwgdGltZSwgY291bnQgfSkpO1xyXG5cclxuLy8gcmVkdWNlclxyXG5jb25zdCByZWR1Y2VyOiB0eXBlcy5JUmVkdWNlclNwZWMgPSB7XHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIFtzZXRQbGF5ZXJQcm9maWxlIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3BsYXllclByb2ZpbGUnXSwgcGF5bG9hZCksXHJcbiAgICBbc2V0dGluZ3NXcml0dGVuIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xyXG4gICAgICBjb25zdCB7IHByb2ZpbGUsIHRpbWUsIGNvdW50IH0gPSBwYXlsb2FkO1xyXG4gICAgICByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIGRlZmF1bHRzOiB7XHJcbiAgICBwbGF5ZXJQcm9maWxlOiAnZ2xvYmFsJyxcclxuICAgIHNldHRpbmdzV3JpdHRlbjoge30sXHJcbiAgfSxcclxufTtcclxuXHJcbmZ1bmN0aW9uIGRvY3VtZW50c1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2xvY2FsQXBwRGF0YScpLCAnTGFyaWFuIFN0dWRpb3MnLCAnQmFsZHVyXFwncyBHYXRlIDMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdNb2RzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb2ZpbGVzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ1BsYXllclByb2ZpbGVzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdsb2JhbFByb2ZpbGVQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnZ2xvYmFsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IGFueSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFsnMTQ1NjQ2MDY2OScsICcxMDg2OTQwJ10pXHJcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVHbG9iYWxQcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCkge1xyXG4gICAgY29uc3QgcHJvZmlsZVBhdGggPSBnbG9iYWxQcm9maWxlUGF0aCgpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwcm9maWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IG1vZFNldHRpbmdzRmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgsIERFRkFVTFRfTU9EX1NFVFRJTkdTLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KTogYW55IHtcclxuICBjb25zdCBtcCA9IG1vZHNQYXRoKCk7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6ICdiZzMtdXNlcy1sc2xpYicsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICB0aXRsZTogJ0JHMyBzdXBwb3J0IHVzZXMgTFNMaWInLFxyXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcclxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkgYXMgYW55KVxyXG4gICAgICAudGhlbigoKSA9PiBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdFYXJseSBBY2Nlc3MgR2FtZScsIHtcclxuICAgICAgICBiYmNvZGU6ICdCYWxkdXJcXCdzIEdhdGUgMyBpcyBjdXJyZW50bHkgaW4gRWFybHkgQWNjZXNzLiBJdCBkb2VzblxcJ3Qgb2ZmaWNpYWxseSAnXHJcbiAgICAgICAgICAgICsgJ3N1cHBvcnQgbW9kZGluZywgZG9lc25cXCd0IGluY2x1ZGUgYW55IG1vZGRpbmcgdG9vbHMgYW5kIHdpbGwgcmVjZWl2ZSAnXHJcbiAgICAgICAgICAgICsgJ2ZyZXF1ZW50IHVwZGF0ZXMuPGJyLz4nXHJcbiAgICAgICAgICAgICsgJ01vZHMgbWF5IGJlY29tZSBpbmNvbXBhdGlibGUgd2l0aGluIGRheXMgb2YgYmVpbmcgcmVsZWFzZWQsIGdlbmVyYWxseSAnXHJcbiAgICAgICAgICAgICsgJ25vdCB3b3JrIGFuZC9vciBicmVhayB1bnJlbGF0ZWQgdGhpbmdzIHdpdGhpbiB0aGUgZ2FtZS48YnIvPjxici8+J1xyXG4gICAgICAgICAgICArICdbY29sb3I9XCJyZWRcIl1QbGVhc2UgZG9uXFwndCByZXBvcnQgaXNzdWVzIHRoYXQgaGFwcGVuIGluIGNvbm5lY3Rpb24gd2l0aCBtb2RzIHRvIHRoZSAnXHJcbiAgICAgICAgICAgICsgJ2dhbWUgZGV2ZWxvcGVycyAoTGFyaWFuIFN0dWRpb3MpIG9yIHRocm91Z2ggdGhlIFZvcnRleCBmZWVkYmFjayBzeXN0ZW0uWy9jb2xvcl0nLFxyXG4gICAgICB9LCBbIHsgbGFiZWw6ICdJIHVuZGVyc3RhbmQnIH0gXSkpKVxyXG4gICAgLmZpbmFsbHkoKCkgPT4gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGksIGRpc2NvdmVyeSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRHYW1lUGF0aChhcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIHJldHVybiBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGg7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEdhbWVEYXRhUGF0aChhcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgY29uc3QgZ2FtZVBhdGggPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGg7XHJcbiAgaWYgKGdhbWVQYXRoICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oZ2FtZVBhdGgsICdEYXRhJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBPUklHSU5BTF9GSUxFUyA9IG5ldyBTZXQoW1xyXG4gICdhc3NldHMucGFrJyxcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2VmZmVjdHMucGFrJyxcclxuICAnZW5naW5lLnBhaycsXHJcbiAgJ2VuZ2luZXNoYWRlcnMucGFrJyxcclxuICAnZ2FtZS5wYWsnLFxyXG4gICdnYW1lcGxhdGZvcm0ucGFrJyxcclxuICAnZ3VzdGF2LnBhaycsXHJcbiAgJ2d1c3Rhdl90ZXh0dXJlcy5wYWsnLFxyXG4gICdpY29ucy5wYWsnLFxyXG4gICdsb3d0ZXgucGFrJyxcclxuICAnbWF0ZXJpYWxzLnBhaycsXHJcbiAgJ21pbmltYXBzLnBhaycsXHJcbiAgJ21vZGVscy5wYWsnLFxyXG4gICdzaGFyZWQucGFrJyxcclxuICAnc2hhcmVkc291bmRiYW5rcy5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZHMucGFrJyxcclxuICAndGV4dHVyZXMucGFrJyxcclxuICAndmlydHVhbHRleHR1cmVzLnBhaycsXHJcbl0pO1xyXG5cclxuY29uc3QgTFNMSUJfRklMRVMgPSBuZXcgU2V0KFtcclxuICAnZGl2aW5lLmV4ZScsXHJcbiAgJ2xzbGliLmRsbCcsXHJcbl0pO1xyXG5cclxuZnVuY3Rpb24gaXNMU0xpYihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xyXG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XHJcbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIExTTElCX0ZJTEVTLmhhcyhwYXRoLmJhc2VuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkpKTtcclxuICByZXR1cm4gb3JpZ0ZpbGUgIT09IHVuZGVmaW5lZFxyXG4gICAgPyBCbHVlYmlyZC5yZXNvbHZlKHRydWUpXHJcbiAgICA6IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0TFNMaWIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IEJsdWViaXJkPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuICBjb25zdCBtYXRjaGVkRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZDogbWF0Y2hlZEZpbGVzLmxlbmd0aCA+PSAyLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxMU0xpYihmaWxlczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xyXG4gIGNvbnN0IGV4ZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUudG9Mb3dlckNhc2UoKSkgPT09ICdkaXZpbmUuZXhlJyk7XHJcbiAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGV4ZSk7XHJcbiAgbGV0IHZlcjogc3RyaW5nID0gYXdhaXQgZ2V0VmVyc2lvbihleGVQYXRoKTtcclxuICB2ZXIgPSB2ZXIuc3BsaXQoJy4nKS5zbGljZSgwLCAzKS5qb2luKCcuJyk7XHJcblxyXG4gIC8vIFVuZm9ydHVuYXRlbHkgdGhlIExTTGliIGRldmVsb3BlciBpcyBub3QgY29uc2lzdGVudCB3aGVuIGNoYW5naW5nXHJcbiAgLy8gIGZpbGUgdmVyc2lvbnMgLSB0aGUgZXhlY3V0YWJsZSBhdHRyaWJ1dGUgbWlnaHQgaGF2ZSBhbiBvbGRlciB2ZXJzaW9uXHJcbiAgLy8gIHZhbHVlIHRoYW4gdGhlIG9uZSBzcGVjaWZpZWQgYnkgdGhlIGZpbGVuYW1lIC0gd2UncmUgZ29pbmcgdG8gdXNlXHJcbiAgLy8gIHRoZSBmaWxlbmFtZSBhcyB0aGUgcG9pbnQgb2YgdHJ1dGggKnVnaCpcclxuICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGVzdGluYXRpb25QYXRoLCBwYXRoLmV4dG5hbWUoZGVzdGluYXRpb25QYXRoKSk7XHJcbiAgY29uc3QgaWR4ID0gZmlsZU5hbWUuaW5kZXhPZignLXYnKTtcclxuICBjb25zdCBmaWxlTmFtZVZlciA9IGZpbGVOYW1lLnNsaWNlKGlkeCArIDIpO1xyXG4gIGlmIChzZW12ZXIudmFsaWQoZmlsZU5hbWVWZXIpICYmIHZlciAhPT0gZmlsZU5hbWVWZXIpIHtcclxuICAgIHZlciA9IGZpbGVOYW1lVmVyO1xyXG4gIH1cclxuICBjb25zdCB2ZXJzaW9uQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnYXR0cmlidXRlJywga2V5OiAndmVyc2lvbicsIHZhbHVlOiB2ZXIgfTtcclxuICBjb25zdCBtb2R0eXBlQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnc2V0bW9kdHlwZScsIHZhbHVlOiAnYmczLWxzbGliLWRpdmluZS10b29sJyB9O1xyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPVxyXG4gICAgZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGZpbGVQYXRoLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgICAgICAgICAgICAgICAuaW5kZXhPZigndG9vbHMnKSAhPT0gLTFcclxuICAgICAgJiYgIWZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xyXG4gICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oJ3Rvb2xzJywgcGF0aC5iYXNlbmFtZShmaWxlUGF0aCkpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFsgbW9kdHlwZUF0dHIsIHZlcnNpb25BdHRyIF0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1JlcGxhY2VyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XHJcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xyXG5cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpKTtcclxuXHJcbiAgaWYgKChvcmlnRmlsZSAhPT0gdW5kZWZpbmVkKSB8fCAocGFrcy5sZW5ndGggPT09IDApKSB7XHJcbiAgICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ01vZCBsb29rcyBsaWtlIGEgcmVwbGFjZXInLCB7XHJcbiAgICAgIGJiY29kZTogJ1RoZSBtb2QgeW91IGp1c3QgaW5zdGFsbGVkIGxvb2tzIGxpa2UgYSBcInJlcGxhY2VyXCIsIG1lYW5pbmcgaXQgaXMgaW50ZW5kZWQgdG8gcmVwbGFjZSAnXHJcbiAgICAgICAgICArICdvbmUgb2YgdGhlIGZpbGVzIHNoaXBwZWQgd2l0aCB0aGUgZ2FtZS48YnIvPidcclxuICAgICAgICAgICsgJ1lvdSBzaG91bGQgYmUgYXdhcmUgdGhhdCBzdWNoIGEgcmVwbGFjZXIgaW5jbHVkZXMgYSBjb3B5IG9mIHNvbWUgZ2FtZSBkYXRhIGZyb20gYSAnXHJcbiAgICAgICAgICArICdzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBnYW1lIGFuZCBtYXkgdGhlcmVmb3JlIGJyZWFrIGFzIHNvb24gYXMgdGhlIGdhbWUgZ2V0cyB1cGRhdGVkLjxici8+J1xyXG4gICAgICAgICAgKyAnRXZlbiBpZiBkb2VzblxcJ3QgYnJlYWssIGl0IG1heSByZXZlcnQgYnVnZml4ZXMgdGhhdCB0aGUgZ2FtZSAnXHJcbiAgICAgICAgICArICdkZXZlbG9wZXJzIGhhdmUgbWFkZS48YnIvPjxici8+J1xyXG4gICAgICAgICAgKyAnVGhlcmVmb3JlIFtjb2xvcj1cInJlZFwiXXBsZWFzZSB0YWtlIGV4dHJhIGNhcmUgdG8ga2VlcCB0aGlzIG1vZCB1cGRhdGVkWy9jb2xvcl0gYW5kIHJlbW92ZSBpdCB3aGVuIGl0ICdcclxuICAgICAgICAgICsgJ25vIGxvbmdlciBtYXRjaGVzIHRoZSBnYW1lIHZlcnNpb24uJyxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgTW9kICh3aWxsIGxpa2VseSBub3Qgd29yayknIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdJbnN0YWxsIGFzIFJlcGxhY2VyJyB9LFxyXG4gICAgXSkudGhlbihyZXN1bHQgPT4gcmVzdWx0LmFjdGlvbiA9PT0gJ0luc3RhbGwgYXMgUmVwbGFjZXInKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZmFsc2UpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJlcGxhY2VyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQ6IHBha3MubGVuZ3RoID09PSAwLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSZXBsYWNlcihmaWxlczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIDogQmx1ZWJpcmQ8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBjb25zdCBkaXJlY3RvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChmaWxlcy5tYXAoZmlsZSA9PiBwYXRoLmRpcm5hbWUoZmlsZSkudG9VcHBlckNhc2UoKSkpKTtcclxuICBsZXQgZGF0YVBhdGg6IHN0cmluZyA9IGRpcmVjdG9yaWVzLmZpbmQoZGlyID0+IHBhdGguYmFzZW5hbWUoZGlyKSA9PT0gJ0RBVEEnKTtcclxuICBpZiAoZGF0YVBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3QgZ2VuT3JQdWJsaWMgPSBkaXJlY3Rvcmllc1xyXG4gICAgICAuZmluZChkaXIgPT4gWydQVUJMSUMnLCAnR0VORVJBVEVEJ10uaW5jbHVkZXMocGF0aC5iYXNlbmFtZShkaXIpKSk7XHJcbiAgICBpZiAoZ2VuT3JQdWJsaWMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRhUGF0aCA9IHBhdGguZGlybmFtZShnZW5PclB1YmxpYyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gKGRhdGFQYXRoICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IGZpbGVzLnJlZHVjZSgocHJldjogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRhdGFQYXRoLCBmaWxlUGF0aCk7XHJcbiAgICAgIGlmICghcmVsUGF0aC5zdGFydHNXaXRoKCcuLicpKSB7XHJcbiAgICAgICAgcHJldi5wdXNoKHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcmVsUGF0aCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sIFtdKVxyXG4gICAgOiBmaWxlcy5tYXAoKGZpbGVQYXRoOiBzdHJpbmcpOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPT4gKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGgsXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgaW5zdHJ1Y3Rpb25zLFxyXG4gIH0pO1xyXG59XHJcblxyXG5jb25zdCBnZXRQbGF5ZXJQcm9maWxlcyA9ICgoKSA9PiB7XHJcbiAgbGV0IGNhY2hlZCA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBjYWNoZWQgPSAoZnMgYXMgYW55KS5yZWFkZGlyU3luYyhwcm9maWxlc1BhdGgoKSlcclxuICAgICAgICAuZmlsdGVyKG5hbWUgPT4gKHBhdGguZXh0bmFtZShuYW1lKSA9PT0gJycpICYmIChuYW1lICE9PSAnRGVmYXVsdCcpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gKCkgPT4gY2FjaGVkO1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzKSB7XHJcbiAgY29uc3QgeyB0LCBjdXJyZW50UHJvZmlsZSwgb25JbnN0YWxsTFNMaWIsXHJcbiAgICAgICAgICBvblNldFBsYXllclByb2ZpbGUsIGlzTHNMaWJJbnN0YWxsZWQgfSA9IHByb3BzO1xyXG5cclxuICBjb25zdCBvblNlbGVjdCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldikgPT4ge1xyXG4gICAgb25TZXRQbGF5ZXJQcm9maWxlKGV2LmN1cnJlbnRUYXJnZXQudmFsdWUpO1xyXG4gIH0sIFtvblNldFBsYXllclByb2ZpbGVdKTtcclxuXHJcbiAgcmV0dXJuIGlzTHNMaWJJbnN0YWxsZWQoKSA/IChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxyXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4Jywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19PlxyXG4gICAgICAgIHt0KCdJbmdhbWUgUHJvZmlsZTogJyl9XHJcbiAgICAgICAgPEZvcm1Db250cm9sXHJcbiAgICAgICAgICBjb21wb25lbnRDbGFzcz0nc2VsZWN0J1xyXG4gICAgICAgICAgbmFtZT0ndXNlclByb2ZpbGUnXHJcbiAgICAgICAgICBjbGFzc05hbWU9J2Zvcm0tY29udHJvbCdcclxuICAgICAgICAgIHZhbHVlPXtjdXJyZW50UHJvZmlsZX1cclxuICAgICAgICAgIG9uQ2hhbmdlPXtvblNlbGVjdH1cclxuICAgICAgICA+XHJcbiAgICAgICAgICA8b3B0aW9uIGtleT0nZ2xvYmFsJyB2YWx1ZT0nZ2xvYmFsJz57dCgnQWxsIFByb2ZpbGVzJyl9PC9vcHRpb24+XHJcbiAgICAgICAgICB7Z2V0UGxheWVyUHJvZmlsZXMoKS5tYXAocHJvZiA9PiAoPG9wdGlvbiBrZXk9e3Byb2Z9IHZhbHVlPXtwcm9mfT57cHJvZn08L29wdGlvbj4pKX1cclxuICAgICAgICA8L0Zvcm1Db250cm9sPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGhyLz5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnUGxlYXNlIHJlZmVyIHRvIG1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyB0byBkZXRlcm1pbmUgdGhlIHJpZ2h0IG9yZGVyLiAnXHJcbiAgICAgICAgICArICdJZiB5b3UgY2FuXFwndCBmaW5kIGFueSBzdWdnZXN0aW9ucyBmb3IgYSBtb2QsIGl0IHByb2JhYmx5IGRvZXNuXFwndCBtYXR0ZXIuJyl9XHJcbiAgICAgICAgPGhyLz5cclxuICAgICAgICB7dCgnU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBlbmdpbmUgJ1xyXG4gICAgICAgICAgKyAnYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGxvYWQtb3JkZXJlZCBieSBtb2QgbWFuYWdlcnMuIElmIHlvdSB3YW50IHRvIGRpc2FibGUgJ1xyXG4gICAgICAgICAgKyAnc3VjaCBhIG1vZCwgcGxlYXNlIGRvIHNvIG9uIHRoZSBcIk1vZHNcIiBzY3JlZW4uJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKSA6IChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxyXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4Jywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19PlxyXG4gICAgICAgIHt0KCdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8aHIvPlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KCdUbyB0YWtlIGZ1bGwgYWR2YW50YWdlIG9mIFZvcnRleFxcJ3MgQkczIG1vZGRpbmcgY2FwYWJpbGl0aWVzIHN1Y2ggYXMgbWFuYWdpbmcgdGhlICdcclxuICAgICAgICAgKyAnb3JkZXIgaW4gd2hpY2ggbW9kcyBhcmUgbG9hZGVkIGludG8gdGhlIGdhbWU7IFZvcnRleCByZXF1aXJlcyBhIDNyZCBwYXJ0eSB0b29sIFwiTFNMaWJcIiwgJ1xyXG4gICAgICAgICArICdwbGVhc2UgaW5zdGFsbCB0aGUgbGlicmFyeSB1c2luZyB0aGUgYnV0dG9ucyBiZWxvdyB0byBtYW5hZ2UgeW91ciBsb2FkIG9yZGVyLicpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPHRvb2x0aXAuQnV0dG9uXHJcbiAgICAgICAgdG9vbHRpcD17J0luc3RhbGwgTFNMaWInfVxyXG4gICAgICAgIG9uQ2xpY2s9e29uSW5zdGFsbExTTGlifVxyXG4gICAgICA+XHJcbiAgICAgICAge3QoJ0luc3RhbGwgTFNMaWInKX1cclxuICAgICAgPC90b29sdGlwLkJ1dHRvbj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIGFwaS5zdG9yZS5nZXRTdGF0ZSgpLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZSB8fCAnZ2xvYmFsJztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0pIHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSAoYmczcHJvZmlsZSA9PT0gJ2dsb2JhbCcpID8gZ2V0UGxheWVyUHJvZmlsZXMoKSA6IFtiZzNwcm9maWxlXTtcclxuICBpZiAocGxheWVyUHJvZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnYmczLW5vLXByb2ZpbGVzJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZTogJ05vIHBsYXllciBwcm9maWxlcycsXHJcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1uby1wcm9maWxlcycpO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcclxuXHJcbiAgICBjb25zdCByZWdpb24gPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RzTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgICBjb25zdCBsb05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKSA/PyB7IGNoaWxkcmVuOiBbXSB9O1xyXG4gICAgaWYgKChsb05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChsb05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XHJcbiAgICAgIGxvTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xyXG4gICAgfVxyXG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxyXG4gICAgY29uc3QgZGVzY3JpcHRpb25Ob2RlcyA9IG1vZHNOb2RlPy5jaGlsZHJlbj8uWzBdPy5ub2RlPy5maWx0ZXI/LihpdGVyID0+XHJcbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09ICdHdXN0YXYnKSkpID8/IFtdO1xyXG5cclxuICAgIGNvbnN0IGVuYWJsZWRQYWtzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICEhbG9hZE9yZGVyW2tleV0uZGF0YT8udXVpZFxyXG4gICAgICAgICAgICAgICAgICAgICYmIGxvYWRPcmRlcltrZXldLmVuYWJsZWRcclxuICAgICAgICAgICAgICAgICAgICAmJiAhbG9hZE9yZGVyW2tleV0uZGF0YT8uaXNMaXN0ZWQpO1xyXG5cclxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIGVuYWJsZWRQYWtzKSB7XHJcbiAgICAgIC8vIGNvbnN0IG1kNSA9IGF3YWl0IHV0aWwuZmlsZU1ENShwYXRoLmpvaW4obW9kc1BhdGgoKSwga2V5KSk7XHJcbiAgICAgIGRlc2NyaXB0aW9uTm9kZXMucHVzaCh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZVNob3J0RGVzYycgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5mb2xkZXIgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTUQ1JywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEubWQ1IH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ05hbWUnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5uYW1lIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb24nLCB0eXBlOiAnaW50MzInLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS52ZXJzaW9uIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGVuYWJsZWRQYWtzXHJcbiAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gbG9hZE9yZGVyW2xoc10ucG9zIC0gbG9hZE9yZGVyW3Joc10ucG9zKVxyXG4gICAgICAubWFwKChrZXk6IHN0cmluZyk6IElNb2ROb2RlID0+ICh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XHJcbiAgICBsb05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGxvYWRPcmRlck5vZGVzO1xyXG5cclxuICAgIGlmIChiZzNwcm9maWxlID09PSAnZ2xvYmFsJykge1xyXG4gICAgICB3cml0ZU1vZFNldHRpbmdzKGFwaSwgbW9kU2V0dGluZ3MsIGJnM3Byb2ZpbGUpO1xyXG4gICAgfVxyXG4gICAgZm9yIChjb25zdCBwcm9maWxlIG9mIHBsYXllclByb2ZpbGVzKSB7XHJcbiAgICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncywgcHJvZmlsZSk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXR0aW5nc1dyaXR0ZW4ocHJvZmlsZSwgRGF0ZS5ub3coKSwgZW5hYmxlZFBha3MubGVuZ3RoKSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbnR5cGUgRGl2aW5lQWN0aW9uID0gJ2NyZWF0ZS1wYWNrYWdlJyB8ICdsaXN0LXBhY2thZ2UnIHwgJ2V4dHJhY3Qtc2luZ2xlLWZpbGUnXHJcbiAgICAgICAgICAgICAgICAgIHwgJ2V4dHJhY3QtcGFja2FnZScgfCAnZXh0cmFjdC1wYWNrYWdlcycgfCAnY29udmVydC1tb2RlbCdcclxuICAgICAgICAgICAgICAgICAgfCAnY29udmVydC1tb2RlbHMnIHwgJ2NvbnZlcnQtcmVzb3VyY2UnIHwgJ2NvbnZlcnQtcmVzb3VyY2VzJztcclxuXHJcbmludGVyZmFjZSBJRGl2aW5lT3B0aW9ucyB7XHJcbiAgc291cmNlOiBzdHJpbmc7XHJcbiAgZGVzdGluYXRpb24/OiBzdHJpbmc7XHJcbiAgZXhwcmVzc2lvbj86IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIElEaXZpbmVPdXRwdXQge1xyXG4gIHN0ZG91dDogc3RyaW5nO1xyXG4gIHJldHVybkNvZGU6IG51bWJlcjtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdO1xyXG4gIGlmIChtb2RzID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldjogdHlwZXMuSU1vZCwgaWQ6IHN0cmluZykgPT4ge1xyXG4gICAgaWYgKG1vZHNbaWRdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKSB7XHJcbiAgICAgIGNvbnN0IGxhdGVzdFZlciA9IHV0aWwuZ2V0U2FmZShwcmV2LCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcclxuICAgICAgY29uc3QgY3VycmVudFZlciA9IHV0aWwuZ2V0U2FmZShtb2RzW2lkXSwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKHNlbXZlci5ndChjdXJyZW50VmVyLCBsYXRlc3RWZXIpKSB7XHJcbiAgICAgICAgICBwcmV2ID0gbW9kc1tpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCBtb2QgdmVyc2lvbicsIHsgbW9kSWQ6IGlkLCB2ZXJzaW9uOiBjdXJyZW50VmVyIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJldjtcclxuICB9LCB1bmRlZmluZWQpO1xyXG5cclxuICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbHNMaWI7XHJcbn1cclxuXHJcbmNsYXNzIERpdmluZUV4ZWNNaXNzaW5nIGV4dGVuZHMgRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoJ0RpdmluZSBleGVjdXRhYmxlIGlzIG1pc3NpbmcnKTtcclxuICAgIHRoaXMubmFtZSA9ICdEaXZpbmVFeGVjTWlzc2luZyc7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBEaXZpbmVBY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBJRGl2aW5lT3B0aW9ucyk6IFByb21pc2U8SURpdmluZU91dHB1dD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRGl2aW5lT3V0cHV0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBsZXQgcmV0dXJuZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIGxldCBzdGRvdXQ6IHN0cmluZyA9ICcnO1xyXG5cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XHJcbiAgICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0xTTGliL0RpdmluZSB0b29sIGlzIG1pc3NpbmcnKTtcclxuICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGV4ZSA9IHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBsc0xpYi5pbnN0YWxsYXRpb25QYXRoLCAndG9vbHMnLCAnZGl2aW5lLmV4ZScpO1xyXG4gICAgY29uc3QgYXJncyA9IFtcclxuICAgICAgJy0tYWN0aW9uJywgYWN0aW9uLFxyXG4gICAgICAnLS1zb3VyY2UnLCBvcHRpb25zLnNvdXJjZSxcclxuICAgICAgJy0tbG9nbGV2ZWwnLCAnb2ZmJyxcclxuICAgICAgJy0tZ2FtZScsICdiZzMnLFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5kZXN0aW5hdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1kZXN0aW5hdGlvbicsIG9wdGlvbnMuZGVzdGluYXRpb24pO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdGlvbnMuZXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1leHByZXNzaW9uJywgb3B0aW9ucy5leHByZXNzaW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwcm9jID0gc3Bhd24oZXhlLCBhcmdzKTtcclxuXHJcbiAgICBwcm9jLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4gc3Rkb3V0ICs9IGRhdGEpO1xyXG4gICAgcHJvYy5zdGRlcnIub24oJ2RhdGEnLCBkYXRhID0+IGxvZygnd2FybicsIGRhdGEpKTtcclxuXHJcbiAgICBwcm9jLm9uKCdlcnJvcicsIChlcnJJbjogRXJyb3IpID0+IHtcclxuICAgICAgaWYgKCFyZXR1cm5lZCkge1xyXG4gICAgICAgIGlmIChlcnJJblsnY29kZSddID09PSAnRU5PRU5UJykge1xyXG4gICAgICAgICAgcmVqZWN0KG5ldyBEaXZpbmVFeGVjTWlzc2luZygpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignZGl2aW5lLmV4ZSBmYWlsZWQ6ICcgKyBlcnJJbi5tZXNzYWdlKTtcclxuICAgICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xyXG4gICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHByb2Mub24oJ2V4aXQnLCAoY29kZTogbnVtYmVyKSA9PiB7XHJcbiAgICAgIGlmICghcmV0dXJuZWQpIHtcclxuICAgICAgICByZXR1cm5lZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHsgc3Rkb3V0LCByZXR1cm5Db2RlOiAwIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMikge1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQ6ICcnLCByZXR1cm5Db2RlOiAyIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBkaXZpbmUuZXhlIHJldHVybnMgdGhlIGFjdHVhbCBlcnJvciBjb2RlICsgMTAwIGlmIGEgZmF0YWwgZXJyb3Igb2NjdXJlZFxyXG4gICAgICAgICAgaWYgKGNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgY29kZSAtPSAxMDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoYGRpdmluZS5leGUgZmFpbGVkOiAke2NvZGV9YCk7XHJcbiAgICAgICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xyXG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWsoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoLCBkZXN0UGF0aCwgcGF0dGVybikge1xyXG4gIHJldHVybiBkaXZpbmUoYXBpLCAnZXh0cmFjdC1wYWNrYWdlJyxcclxuICAgIHsgc291cmNlOiBwYWtQYXRoLCBkZXN0aW5hdGlvbjogZGVzdFBhdGgsIGV4cHJlc3Npb246IHBhdHRlcm4gfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RNZXRhKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcclxuICBjb25zdCBtZXRhUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ3RlbXAnKSwgJ2xzbWV0YScsIHNob3J0aWQoKSk7XHJcbiAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMobWV0YVBhdGgpO1xyXG4gIGF3YWl0IGV4dHJhY3RQYWsoYXBpLCBwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcclxuICB0cnkge1xyXG4gICAgLy8gdGhlIG1ldGEubHN4IG1heSBiZSBpbiBhIHN1YmRpcmVjdG9yeS4gVGhlcmUgaXMgcHJvYmFibHkgYSBwYXR0ZXJuIGhlcmVcclxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXHJcbiAgICBsZXQgbWV0YUxTWFBhdGg6IHN0cmluZyA9IHBhdGguam9pbihtZXRhUGF0aCwgJ21ldGEubHN4Jyk7XHJcbiAgICBhd2FpdCB3YWxrKG1ldGFQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XHJcbiAgICAgIGlmICh0ZW1wICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBtZXRhTFNYUGF0aCA9IHRlbXAuZmlsZVBhdGg7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtZXRhTFNYUGF0aCk7XHJcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XHJcbiAgICByZXR1cm4gbWV0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1ldGFQYXRoKTtcclxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE5vZGU8VCBleHRlbmRzIElYbWxOb2RlPHsgaWQ6IHN0cmluZyB9PiwgVT4obm9kZXM6IFRbXSwgaWQ6IHN0cmluZyk6IFQge1xyXG4gIHJldHVybiBub2Rlcz8uZmluZChpdGVyID0+IGl0ZXIuJC5pZCA9PT0gaWQpID8/IHVuZGVmaW5lZDtcclxufVxyXG5cclxuY29uc3QgbGlzdENhY2hlOiB7IFtwYXRoOiBzdHJpbmddOiBQcm9taXNlPHN0cmluZ1tdPiB9ID0ge307XHJcblxyXG5hc3luYyBmdW5jdGlvbiBsaXN0UGFja2FnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBkaXZpbmUoYXBpLCAnbGlzdC1wYWNrYWdlJywgeyBzb3VyY2U6IHBha1BhdGggfSk7XHJcbiAgY29uc3QgbGluZXMgPSByZXMuc3Rkb3V0LnNwbGl0KCdcXG4nKS5tYXAobGluZSA9PiBsaW5lLnRyaW0oKSkuZmlsdGVyKGxpbmUgPT4gbGluZS5sZW5ndGggIT09IDApO1xyXG5cclxuICByZXR1cm4gbGluZXM7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGlzTE9MaXN0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICBpZiAobGlzdENhY2hlW3Bha1BhdGhdID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxpc3RDYWNoZVtwYWtQYXRoXSA9IGxpc3RQYWNrYWdlKGFwaSwgcGFrUGF0aCk7XHJcbiAgfVxyXG4gIGNvbnN0IGxpbmVzID0gYXdhaXQgbGlzdENhY2hlW3Bha1BhdGhdO1xyXG4gIC8vIGNvbnN0IG5vbkdVSSA9IGxpbmVzLmZpbmQobGluZSA9PiAhbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKTtcclxuICBjb25zdCBtZXRhTFNYID0gbGluZXMuZmluZChsaW5lID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcclxuICByZXR1cm4gbWV0YUxTWCA9PT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mb0ltcGwoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElQYWtJbmZvPiB7XHJcbiAgY29uc3QgbWV0YSA9IGF3YWl0IGV4dHJhY3RNZXRhKGFwaSwgcGFrUGF0aCk7XHJcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobWV0YT8uc2F2ZT8ucmVnaW9uLCAnQ29uZmlnJyk7XHJcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICBjb25zdCBtb2R1bGVJbmZvID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHVsZUluZm8nKTtcclxuXHJcbiAgY29uc3QgYXR0ciA9IChuYW1lOiBzdHJpbmcsIGZhbGxiYWNrOiAoKSA9PiBhbnkpID0+XHJcbiAgICBmaW5kTm9kZShtb2R1bGVJbmZvPy5hdHRyaWJ1dGUsIG5hbWUpPy4kPy52YWx1ZSA/PyBmYWxsYmFjaygpO1xyXG5cclxuICBjb25zdCBnZW5OYW1lID0gcGF0aC5iYXNlbmFtZShwYWtQYXRoLCBwYXRoLmV4dG5hbWUocGFrUGF0aCkpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYXV0aG9yOiBhdHRyKCdBdXRob3InLCAoKSA9PiAnVW5rbm93bicpLFxyXG4gICAgZGVzY3JpcHRpb246IGF0dHIoJ0Rlc2NyaXB0aW9uJywgKCkgPT4gJ01pc3NpbmcnKSxcclxuICAgIGZvbGRlcjogYXR0cignRm9sZGVyJywgKCkgPT4gZ2VuTmFtZSksXHJcbiAgICBtZDU6IGF0dHIoJ01ENScsICgpID0+ICcnKSxcclxuICAgIG5hbWU6IGF0dHIoJ05hbWUnLCAoKSA9PiBnZW5OYW1lKSxcclxuICAgIHR5cGU6IGF0dHIoJ1R5cGUnLCAoKSA9PiAnQWR2ZW50dXJlJyksXHJcbiAgICB1dWlkOiBhdHRyKCdVVUlEJywgKCkgPT4gcmVxdWlyZSgndXVpZCcpLnY0KCkpLFxyXG4gICAgdmVyc2lvbjogYXR0cignVmVyc2lvbicsICgpID0+ICcxJyksXHJcbiAgICBpc0xpc3RlZDogYXdhaXQgaXNMT0xpc3RlZChhcGksIHBha1BhdGgpLFxyXG4gIH07XHJcbn1cclxuXHJcbmNvbnN0IGZhbGxiYWNrUGljdHVyZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdnYW1lYXJ0LmpwZycpO1xyXG5cclxubGV0IHN0b3JlZExPOiBhbnlbXTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xyXG4gIGNvbnN0IG5hbWUgPSBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ05hbWUnKS4kLnZhbHVlO1xyXG4gIHJldHVybiB7XHJcbiAgICBpZDogbmFtZSxcclxuICAgIG5hbWUsXHJcbiAgICBkYXRhOiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kLnZhbHVlLFxyXG4gIH07XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IGdldFBsYXllclByb2ZpbGVzKCk7XHJcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgc3RvcmVkTE8gPSBbXTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJylcclxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcclxuICAgIDogcGF0aC5qb2luKGdsb2JhbFByb2ZpbGVQYXRoKCksICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHNldHRpbmdzUGF0aCk7XHJcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBiZzNwcm9maWxlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBpZiAoIWJnM3Byb2ZpbGUpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJykgXHJcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXHJcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcblxyXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKHNldHRpbmdzUGF0aCkpO1xyXG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoc2V0dGluZ3NQYXRoLCB4bWwpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgc3RvcmVkTE8gPSBbXTtcclxuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIHNldHRpbmdzJywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFN0b3JlZExPKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICBjb25zdCBtb2RzUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuICBjb25zdCBtb2ROb2RlcyA9IG1vZHNSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG5cclxuICBjb25zdCBtb2RPcmRlciA9IG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xyXG5cclxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgdlByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGVuYWJsZWQgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIoaWQgPT5cclxuICAgIHV0aWwuZ2V0U2FmZSh2UHJvZmlsZSwgWydtb2RTdGF0ZScsIGlkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAoZW5hYmxlZC5sZW5ndGggPiAwICYmIG1vZE5vZGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgY29uc3QgbGFzdFdyaXRlID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5zZXR0aW5nc1dyaXR0ZW4/LltiZzNwcm9maWxlXTtcclxuICAgIGlmICgobGFzdFdyaXRlICE9PSB1bmRlZmluZWQpICYmIChsYXN0V3JpdGUuY291bnQgPiAxKSkge1xyXG4gICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdcIm1vZHNldHRpbmdzLmxzeFwiIGZpbGUgd2FzIHJlc2V0Jywge1xyXG4gICAgICAgIHRleHQ6ICdUaGUgZ2FtZSByZXNldCB0aGUgbGlzdCBvZiBhY3RpdmUgbW9kcyBhbmQgcmFuIHdpdGhvdXQgdGhlbS5cXG4nXHJcbiAgICAgICAgICAgICsgJ1RoaXMgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgb3IgaW5jb21wYXRpYmxlIG1vZCBpcyBpbnN0YWxsZWQuICdcclxuICAgICAgICAgICAgKyAnVGhlIGdhbWUgd2lsbCBub3QgbG9hZCBhbnkgbW9kcyBpZiBvbmUgb2YgdGhlbSBpcyBpbmNvbXBhdGlibGUsIHVuZm9ydHVuYXRlbHkgJ1xyXG4gICAgICAgICAgICArICd0aGVyZSBpcyBubyBlYXN5IHdheSB0byBmaW5kIG91dCB3aGljaCBvbmUgY2F1c2VkIHRoZSBwcm9ibGVtLicsXHJcbiAgICAgIH0sIFtcclxuICAgICAgICB7IGxhYmVsOiAnQ29udGludWUnIH0sXHJcbiAgICAgIF0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xyXG4gICAgLm1hcChub2RlID0+IHBhcnNlTW9kTm9kZShub2RlKSlcclxuICAgIC8vIEd1c3RhdiBpcyB0aGUgY29yZSBnYW1lXHJcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcclxuICAgIC8vIHNvcnQgYnkgdGhlIGluZGV4IG9mIGVhY2ggbW9kIGluIHRoZSBtb2RPcmRlciBsaXN0XHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG1vZE9yZGVyXHJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLTGlzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBsZXQgcGFrczogc3RyaW5nW107XHJcbiAgdHJ5IHtcclxuICAgIHBha3MgPSAoYXdhaXQgZnMucmVhZGRpckFzeW5jKG1vZHNQYXRoKCkpKVxyXG4gICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgoKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gbm9wXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZHMgZGlyZWN0b3J5JywgZXJyLCB7XHJcbiAgICAgICAgaWQ6ICdiZzMtZmFpbGVkLXJlYWQtbW9kcycsXHJcbiAgICAgICAgbWVzc2FnZTogbW9kc1BhdGgoKSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBwYWtzID0gW107XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFrcztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKVxyXG4gICAgOiBQcm9taXNlPEFycmF5PHsgZmlsZU5hbWU6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kLCBpbmZvOiBJUGFrSW5mbyB9Pj4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbHNMaWIgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xyXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLTGlzdChhcGkpO1xyXG5cclxuICBsZXQgbWFuaWZlc3Q7XHJcbiAgdHJ5IHtcclxuICAgIG1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksICcnLCBHQU1FX0lEKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gIVsnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBkZXBsb3ltZW50IG1hbmlmZXN0JywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcmVzID0gYXdhaXQgUHJvbWlzZS5hbGwocGFrcy5tYXAoYXN5bmMgZmlsZU5hbWUgPT4ge1xyXG4gICAgcmV0dXJuIHV0aWwud2l0aEVycm9yQ29udGV4dCgncmVhZGluZyBwYWsnLCBmaWxlTmFtZSwgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmdW5jID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBtYW5pZmVzdEVudHJ5ID0gbWFuaWZlc3QuZmlsZXMuZmluZChlbnRyeSA9PiBlbnRyeS5yZWxQYXRoID09PSBmaWxlTmFtZSk7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSAobWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXT8uW21hbmlmZXN0RW50cnkuc291cmNlXVxyXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBmaWxlTmFtZSxcclxuICAgICAgICAgICAgbW9kLFxyXG4gICAgICAgICAgICBpbmZvOiBhd2FpdCBleHRyYWN0UGFrSW5mb0ltcGwoYXBpLCBwYXRoLmpvaW4obW9kc1BhdGgoKSwgZmlsZU5hbWUpKSxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGl2aW5lRXhlY01pc3NpbmcpIHtcclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdUaGUgaW5zdGFsbGVkIGNvcHkgb2YgTFNMaWIvRGl2aW5lIGlzIGNvcnJ1cHRlZCAtIHBsZWFzZSAnXHJcbiAgICAgICAgICAgICAgKyAnZGVsZXRlIHRoZSBleGlzdGluZyBMU0xpYiBtb2QgZW50cnkgYW5kIHJlLWluc3RhbGwgaXQuIE1ha2Ugc3VyZSB0byAnXHJcbiAgICAgICAgICAgICAgKyAnZGlzYWJsZSBvciBhZGQgYW55IG5lY2Vzc2FyeSBleGNlcHRpb25zIHRvIHlvdXIgc2VjdXJpdHkgc29mdHdhcmUgdG8gJ1xyXG4gICAgICAgICAgICAgICsgJ2Vuc3VyZSBpdCBkb2VzIG5vdCBpbnRlcmZlcmUgd2l0aCBWb3J0ZXgvTFNMaWIgZmlsZSBvcGVyYXRpb25zLic7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0RpdmluZSBleGVjdXRhYmxlIGlzIG1pc3NpbmcnLCBtZXNzYWdlLFxyXG4gICAgICAgICAgICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gY291bGQgaGFwcGVuIGlmIHRoZSBmaWxlIGdvdCBkZWxldGVkIHNpbmNlIHJlYWRpbmcgdGhlIGxpc3Qgb2YgcGFrcy5cclxuICAgICAgICAgIC8vIGFjdHVhbGx5LCB0aGlzIHNlZW1zIHRvIGJlIGZhaXJseSBjb21tb24gd2hlbiB1cGRhdGluZyBhIG1vZFxyXG4gICAgICAgICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBwYWsnLCBlcnIsIHtcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcclxuICAgICAgICAgICAgICBtZXNzYWdlOiBmaWxlTmFtZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZnVuYygpKTtcclxuICAgIH0pO1xyXG4gIH0pKTtcclxuICByZXR1cm4gcmVzLmZpbHRlcihpdGVyID0+IGl0ZXIgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICAgIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgICByZXR1cm4gbW9kT3JkZXJOb2Rlcy5tYXAobm9kZSA9PiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kPy52YWx1ZSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzZXR0aW5ncy5sc3gnLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvcmRlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gIHJldHVybiB3cml0ZUxvYWRPcmRlcihhcGksIG9yZGVyKTtcclxufVxyXG5cclxuY29uc3QgZGVzZXJpYWxpemVEZWJvdW5jZXIgPSBuZXcgdXRpbC5EZWJvdW5jZXIoKCkgPT4ge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufSwgMTAwMCk7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZUxvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGFueT4ge1xyXG4gIC8vIHRoaXMgZnVuY3Rpb24gbWlnaHQgYmUgaW52b2tlZCBieSB0aGUgbHNsaWIgbW9kIGJlaW5nICh1bilpbnN0YWxsZWQgaW4gd2hpY2ggY2FzZSBpdCBtaWdodCBiZVxyXG4gIC8vIGluIHRoZSBtaWRkbGUgb2YgYmVpbmcgdW5wYWNrZWQgb3IgcmVtb3ZlZCB3aGljaCBsZWFkcyB0byB3ZWlyZCBlcnJvciBtZXNzYWdlcy5cclxuICAvLyB0aGlzIGlzIGEgaGFjayBob3BlZnVsbHkgZW5zdXJlaW5nIHRoZSBpdCdzIGVpdGhlciBmdWxseSB0aGVyZSBvciBub3QgYXQgYWxsXHJcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gZGVzZXJpYWxpemVEZWJvdW5jZXIuc2NoZWR1bGUoY2IpKTtcclxuXHJcbiAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtzKGFwaSk7XHJcblxyXG4gIGNvbnN0IG9yZGVyID0gYXdhaXQgcmVhZExPKGFwaSk7XHJcblxyXG4gIGNvbnN0IG9yZGVyVmFsdWUgPSAoaW5mbzogSVBha0luZm8pID0+IHtcclxuICAgIHJldHVybiBvcmRlci5pbmRleE9mKGluZm8udXVpZCkgKyAoaW5mby5pc0xpc3RlZCA/IDAgOiAxMDAwKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gcGFrc1xyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBvcmRlclZhbHVlKGxocy5pbmZvKSAtIG9yZGVyVmFsdWUocmhzLmluZm8pKVxyXG4gICAgLm1hcCgoeyBmaWxlTmFtZSwgbW9kLCBpbmZvIH0pID0+ICh7XHJcbiAgICAgIGlkOiBmaWxlTmFtZSxcclxuICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgbmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXHJcbiAgICAgIG1vZElkOiBtb2Q/LmlkLFxyXG4gICAgICBsb2NrZWQ6IGluZm8uaXNMaXN0ZWQsXHJcbiAgICAgIGRhdGE6IGluZm8sXHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlKGJlZm9yZSwgYWZ0ZXIpOiBQcm9taXNlPGFueT4ge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxubGV0IGZvcmNlUmVmcmVzaDogKCkgPT4gdm9pZDtcclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCByZWZyZXNoOiAoKSA9PiB2b2lkIH0pIHtcclxuICBjb25zdCB7IGFwaSB9ID0gcHJvcHM7XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XHJcbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LnBsYXllclByb2ZpbGUpO1xyXG5cclxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgZm9yY2VSZWZyZXNoID0gcHJvcHMucmVmcmVzaDtcclxuICB9LCBbXSk7XHJcblxyXG4gIGNvbnN0IG9uU2V0UHJvZmlsZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBpbXBsID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlTmFtZSkpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhhcGkpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGZvcmNlUmVmcmVzaD8uKCk7XHJcbiAgICB9O1xyXG4gICAgaW1wbCgpO1xyXG4gIH0sIFsgYXBpIF0pO1xyXG5cclxuICBjb25zdCBpc0xzTGliSW5zdGFsbGVkID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xyXG4gICAgcmV0dXJuIGdldExhdGVzdExTTGliTW9kKGFwaSkgIT09IHVuZGVmaW5lZDtcclxuICB9LCBbIGFwaSBdKTtcclxuXHJcbiAgY29uc3Qgb25JbnN0YWxsTFNMaWIgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XHJcbiAgICBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaSwgR0FNRV9JRCk7XHJcbiAgfSwgW2FwaV0pO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPEluZm9QYW5lbFxyXG4gICAgICB0PXthcGkudHJhbnNsYXRlfVxyXG4gICAgICBjdXJyZW50UHJvZmlsZT17Y3VycmVudFByb2ZpbGV9XHJcbiAgICAgIG9uU2V0UGxheWVyUHJvZmlsZT17b25TZXRQcm9maWxlfVxyXG4gICAgICBpc0xzTGliSW5zdGFsbGVkPXtpc0xzTGliSW5zdGFsbGVkfVxyXG4gICAgICBvbkluc3RhbGxMU0xpYj17b25JbnN0YWxsTFNMaWJ9XHJcbiAgICAvPlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XHJcbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldiwgaWQpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBhcmNJZCA9IG1vZHNbaWRdLmFyY2hpdmVJZDtcclxuICAgICAgY29uc3QgZGw6IHR5cGVzLklEb3dubG9hZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnZG93bmxvYWRzJywgJ2ZpbGVzJywgYXJjSWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBzdG9yZWRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZiAoc2VtdmVyLmd0KHN0b3JlZFZlciwgcHJldikpIHtcclxuICAgICAgICAgIHByZXYgPSBzdG9yZWRWZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCB2ZXJzaW9uIHN0b3JlZCBmb3IgbHNsaWIgbW9kJywgeyBpZCwgdmVyc2lvbjogc3RvcmVkVmVyIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFRoZSBMU0xpYiBkZXZlbG9wZXIgZG9lc24ndCBhbHdheXMgdXBkYXRlIHRoZSB2ZXJzaW9uIG9uIHRoZSBleGVjdXRhYmxlXHJcbiAgICAgICAgLy8gIGl0c2VsZiAtIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBleHRyYWN0IGl0IGZyb20gdGhlIGFyY2hpdmUgd2hpY2ggdGVuZHNcclxuICAgICAgICAvLyAgdG8gdXNlIHRoZSBjb3JyZWN0IHZlcnNpb24uXHJcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRsLmxvY2FsUGF0aCwgcGF0aC5leHRuYW1lKGRsLmxvY2FsUGF0aCkpO1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHZlciA9IHNlbXZlci5jb2VyY2UoZmlsZU5hbWUuc2xpY2UoaWR4ICsgMikpLnZlcnNpb247XHJcbiAgICAgICAgICBpZiAoc2VtdmVyLnZhbGlkKHZlcikgJiYgdmVyICE9PSBzdG9yZWRWZXIpIHtcclxuICAgICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsIHZlcikpO1xyXG4gICAgICAgICAgICBwcmV2ID0gdmVyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGdldCB0aGUgdmVyc2lvbi4uLiBPaCB3ZWxsLi4gU2V0IGEgYm9ndXMgdmVyc2lvbiBzaW5jZVxyXG4gICAgICAgICAgLy8gIHdlIGNsZWFybHkgaGF2ZSBsc2xpYiBpbnN0YWxsZWQgLSB0aGUgdXBkYXRlIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIHRha2VcclxuICAgICAgICAgIC8vICBjYXJlIG9mIHRoZSByZXN0ICh3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgY2hlY2sgZm9yIHVwZGF0ZXMgYnV0dG9uKVxyXG4gICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsICcxLjAuMCcpKTtcclxuICAgICAgICAgIHByZXYgPSAnMS4wLjAnO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgJzAuMC4wJyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uQ2hlY2tNb2RWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuZ2V0U3RhdGUoKSk7XHJcbiAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xyXG5cclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICAvLyBOb3RoaW5nIHRvIHVwZGF0ZS5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG5ld2VzdFZlcjogc3RyaW5nID0gYXdhaXQgZ2l0SHViRG93bmxvYWRlci5jaGVja0ZvclVwZGF0ZXMoYXBpLCBsYXRlc3RWZXIpO1xyXG4gIGlmICghbmV3ZXN0VmVyIHx8IG5ld2VzdFZlciA9PT0gbGF0ZXN0VmVyKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3AoKSB7XHJcbiAgLy8gbm9wXHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uR2FtZU1vZGVBY3RpdmF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICdiYWxkdXJzZ2F0ZTMnXSwgcmVkdWNlcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxyXG4gICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXHJcbiAgICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICAgICAnYmluL2JnMy5leGUnLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBzZXR1cDogZGlzY292ZXJ5ID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogJzEwODY5NDAnLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogMTA4Njk0MCxcclxuICAgICAgc3RvcFBhdHRlcm5zOiBTVE9QX1BBVFRFUk5TLm1hcCh0b1dvcmRFeHApLFxyXG4gICAgICBpZ25vcmVDb25mbGljdHM6IFtcclxuICAgICAgICAnaW5mby5qc29uJyxcclxuICAgICAgXSxcclxuICAgICAgaWdub3JlRGVwbG95OiBbXHJcbiAgICAgICAgJ2luZm8uanNvbicsXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCAzMDAsICdzZXR0aW5ncycsIHt9LCAnUmUtaW5zdGFsbCBMU0xpYi9EaXZpbmUnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cclxuICAgICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICBjb25zdCBsc2xpYnMgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIobW9kID0+IG1vZHNbbW9kXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJyk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZHMnLCBHQU1FX0lELCBsc2xpYnMsIChlcnIpID0+IHtcclxuICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlaW5zdGFsbCBsc2xpYicsXHJcbiAgICAgICAgICAnUGxlYXNlIHJlLWluc3RhbGwgbWFudWFsbHknLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgZ2l0SHViRG93bmxvYWRlci5kb3dubG9hZERpdmluZShjb250ZXh0LmFwaSk7XHJcbiAgICB9KTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIGdhbWVNb2RlID09PSBHQU1FX0lEO1xyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtcmVwbGFjZXInLCAyNSwgdGVzdFJlcGxhY2VyLCBpbnN0YWxsUmVwbGFjZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsIDE1LCB0ZXN0TFNMaWIsIGluc3RhbGxMU0xpYiBhcyBhbnkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLXJlcGxhY2VyJywgMjUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIGZpbGVzID0+IGlzUmVwbGFjZXIoY29udGV4dC5hcGksIGZpbGVzKSxcclxuICAgIHsgbmFtZTogJ0JHMyBSZXBsYWNlcicgfSBhcyBhbnkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IHVuZGVmaW5lZCwgZmlsZXMgPT4gaXNMU0xpYihjb250ZXh0LmFwaSwgZmlsZXMpLFxyXG4gICAgeyBuYW1lOiAnQkczIExTTGliJyB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGkpLFxyXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGksIGxvYWRPcmRlciksXHJcbiAgICB2YWxpZGF0ZSxcclxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiB0cnVlLFxyXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICgoKSA9PiAoPEluZm9QYW5lbFdyYXAgYXBpPXtjb250ZXh0LmFwaX0gcmVmcmVzaD17bm9wfSAvPikpIGFzIGFueSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXNzaW9uJywgJ2Jhc2UnLCAndG9vbHNSdW5uaW5nJ10sXHJcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXHJcbiAgICAgICAgLy8gY2hhbmdlZFxyXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKChwcm9maWxlPy5nYW1lSWQgPT09IEdBTUVfSUQpICYmIChmb3JjZVJlZnJlc2ggIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICBmb3JjZVJlZnJlc2goKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2NoZWNrLW1vZHMtdmVyc2lvbicsXHJcbiAgICAgIChnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSA9PiBvbkNoZWNrTW9kVmVyc2lvbihjb250ZXh0LmFwaSwgZ2FtZUlkLCBtb2RzKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgICBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4gb25HYW1lTW9kZUFjdGl2YXRlZChjb250ZXh0LmFwaSwgZ2FtZU1vZGUpKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1haW47XHJcbiJdfQ==