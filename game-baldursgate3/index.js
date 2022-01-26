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
    return path.join(vortex_api_1.util.getVortexPath('documents'), 'Larian Studios', 'Baldur\'s Gate 3');
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
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    const lsLib = Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const latestVer = vortex_api_1.util.getSafe(prev, ['attributes', 'version'], '0.0.0');
            const currentVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            if (semver.gt(currentVer, latestVer)) {
                prev = mods[id];
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
        console.log('spawn', exe, args);
        const proc = (0, child_process_1.spawn)(exe, args);
        proc.stdout.on('data', data => stdout += data);
        proc.stderr.on('data', data => (0, vortex_api_1.log)('warn', data));
        proc.on('error', (errIn) => {
            if (!returned) {
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
                        return {
                            fileName,
                            mod,
                            info: yield extractPakInfoImpl(api, path.join(modsPath(), fileName)),
                        };
                    }
                    catch (err) {
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
    const currentProfile = (0, react_redux_1.useSelector)((state) => { var _a; return (_a = state.settings['baldursgate3']) === null || _a === void 0 ? void 0 : _a.playerProfile; });
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
            if (semver.gt(storedVer, prev)) {
                prev = storedVer;
            }
            if (dl !== undefined) {
                const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
                const idx = fileName.indexOf('-v');
                const ver = fileName.slice(idx + 2);
                if (semver.valid(ver) && ver !== storedVer) {
                    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', ver));
                    prev = ver;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGlEQUFzQztBQUN0Qyw4REFBcUM7QUFFckMsMkNBQTZCO0FBQzdCLDZDQUErQjtBQUMvQixxREFBOEM7QUFDOUMsNkNBQTBDO0FBQzFDLHlDQUF5QztBQUN6QywrQ0FBaUM7QUFDakMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6QywyQ0FBK0U7QUFDL0UsbUNBQXFEO0FBR3JELHFDQUFvRTtBQUNwRSxxRUFBdUQ7QUFFdkQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUV2QyxTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUdELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsTUFBTSxlQUFlLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHNCQUFzQixFQUN6RCxDQUFDLE9BQWUsRUFBRSxJQUFZLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFHaEYsTUFBTSxPQUFPLEdBQXVCO0lBQ2xDLFFBQVEsRUFBRTtRQUNSLENBQUMsZ0JBQXVCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFLE9BQU8sQ0FBQztRQUM5RixDQUFDLGVBQXNCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUMzQyxN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LENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEZvcm1Db250cm9sIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IGNyZWF0ZUFjdGlvbiB9IGZyb20gJ3JlZHV4LWFjdCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBnZW5lcmF0ZSBhcyBzaG9ydGlkIH0gZnJvbSAnc2hvcnRpZCc7XHJcbmltcG9ydCB3YWxrLCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdG9vbHRpcCwgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgQnVpbGRlciwgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJTW9kTm9kZSwgSU1vZFNldHRpbmdzLCBJUGFrSW5mbywgSVhtbE5vZGUgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IERFRkFVTFRfTU9EX1NFVFRJTkdTLCBHQU1FX0lELCBMU0xJQl9VUkwgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCAqIGFzIGdpdEh1YkRvd25sb2FkZXIgZnJvbSAnLi9naXRodWJEb3dubG9hZGVyJztcclxuXHJcbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XHJcblxyXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcclxuICByZXR1cm4gJyhefC8pJyArIGlucHV0ICsgJygvfCQpJztcclxufVxyXG5cclxuLy8gYWN0aW9uc1xyXG5jb25zdCBzZXRQbGF5ZXJQcm9maWxlID0gY3JlYXRlQWN0aW9uKCdCRzNfU0VUX1BMQVlFUlBST0ZJTEUnLCBuYW1lID0+IG5hbWUpO1xyXG5jb25zdCBzZXR0aW5nc1dyaXR0ZW4gPSBjcmVhdGVBY3Rpb24oJ0JHM19TRVRUSU5HU19XUklUVEVOJyxcclxuICAocHJvZmlsZTogc3RyaW5nLCB0aW1lOiBudW1iZXIsIGNvdW50OiBudW1iZXIpID0+ICh7IHByb2ZpbGUsIHRpbWUsIGNvdW50IH0pKTtcclxuXHJcbi8vIHJlZHVjZXJcclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0UGxheWVyUHJvZmlsZSBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwbGF5ZXJQcm9maWxlJ10sIHBheWxvYWQpLFxyXG4gICAgW3NldHRpbmdzV3JpdHRlbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgcGxheWVyUHJvZmlsZTogJ2dsb2JhbCcsXHJcbiAgICBzZXR0aW5nc1dyaXR0ZW46IHt9LFxyXG4gIH0sXHJcbn07XHJcblxyXG5mdW5jdGlvbiBkb2N1bWVudHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnTW9kcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9maWxlc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdQbGF5ZXJQcm9maWxlcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnbG9iYWxQcm9maWxlUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ2dsb2JhbCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBhbnkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzE0NTY0NjA2NjknLCAnMTA4Njk0MCddKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGgpIHtcclxuICAgIGNvbnN0IHByb2ZpbGVQYXRoID0gZ2xvYmFsUHJvZmlsZVBhdGgoKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocHJvZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBtb2RTZXR0aW5nc0ZpbGVQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVQYXRoLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoLCBERUZBVUxUX01PRF9TRVRUSU5HUywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeSk6IGFueSB7XHJcbiAgY29uc3QgbXAgPSBtb2RzUGF0aCgpO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiAnYmczLXVzZXMtbHNsaWInLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgdGl0bGU6ICdCRzMgc3VwcG9ydCB1c2VzIExTTGliJyxcclxuICAgIG1lc3NhZ2U6IExTTElCX1VSTCxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHsgdGl0bGU6ICdWaXNpdCBQYWdlJywgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbihMU0xJQl9VUkwpLmNhdGNoKCgpID0+IG51bGwpIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG4gIHJldHVybiBmcy5zdGF0QXN5bmMobXApXHJcbiAgICAuY2F0Y2goKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtcCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpIGFzIGFueSlcclxuICAgICAgLnRoZW4oKCkgPT4gYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnRWFybHkgQWNjZXNzIEdhbWUnLCB7XHJcbiAgICAgICAgYmJjb2RlOiAnQmFsZHVyXFwncyBHYXRlIDMgaXMgY3VycmVudGx5IGluIEVhcmx5IEFjY2Vzcy4gSXQgZG9lc25cXCd0IG9mZmljaWFsbHkgJ1xyXG4gICAgICAgICAgICArICdzdXBwb3J0IG1vZGRpbmcsIGRvZXNuXFwndCBpbmNsdWRlIGFueSBtb2RkaW5nIHRvb2xzIGFuZCB3aWxsIHJlY2VpdmUgJ1xyXG4gICAgICAgICAgICArICdmcmVxdWVudCB1cGRhdGVzLjxici8+J1xyXG4gICAgICAgICAgICArICdNb2RzIG1heSBiZWNvbWUgaW5jb21wYXRpYmxlIHdpdGhpbiBkYXlzIG9mIGJlaW5nIHJlbGVhc2VkLCBnZW5lcmFsbHkgJ1xyXG4gICAgICAgICAgICArICdub3Qgd29yayBhbmQvb3IgYnJlYWsgdW5yZWxhdGVkIHRoaW5ncyB3aXRoaW4gdGhlIGdhbWUuPGJyLz48YnIvPidcclxuICAgICAgICAgICAgKyAnW2NvbG9yPVwicmVkXCJdUGxlYXNlIGRvblxcJ3QgcmVwb3J0IGlzc3VlcyB0aGF0IGhhcHBlbiBpbiBjb25uZWN0aW9uIHdpdGggbW9kcyB0byB0aGUgJ1xyXG4gICAgICAgICAgICArICdnYW1lIGRldmVsb3BlcnMgKExhcmlhbiBTdHVkaW9zKSBvciB0aHJvdWdoIHRoZSBWb3J0ZXggZmVlZGJhY2sgc3lzdGVtLlsvY29sb3JdJyxcclxuICAgICAgfSwgWyB7IGxhYmVsOiAnSSB1bmRlcnN0YW5kJyB9IF0pKSlcclxuICAgIC5maW5hbGx5KCgpID0+IGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpLCBkaXNjb3ZlcnkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0R2FtZVBhdGgoYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICByZXR1cm4gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZD8uW0dBTUVfSURdPy5wYXRoO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRHYW1lRGF0YVBhdGgoYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gIGNvbnN0IGdhbWVQYXRoID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZD8uW0dBTUVfSURdPy5wYXRoO1xyXG4gIGlmIChnYW1lUGF0aCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKGdhbWVQYXRoLCAnRGF0YScpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgT1JJR0lOQUxfRklMRVMgPSBuZXcgU2V0KFtcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdlZmZlY3RzLnBhaycsXHJcbiAgJ2VuZ2luZS5wYWsnLFxyXG4gICdlbmdpbmVzaGFkZXJzLnBhaycsXHJcbiAgJ2dhbWUucGFrJyxcclxuICAnZ2FtZXBsYXRmb3JtLnBhaycsXHJcbiAgJ2d1c3Rhdi5wYWsnLFxyXG4gICdndXN0YXZfdGV4dHVyZXMucGFrJyxcclxuICAnaWNvbnMucGFrJyxcclxuICAnbG93dGV4LnBhaycsXHJcbiAgJ21hdGVyaWFscy5wYWsnLFxyXG4gICdtaW5pbWFwcy5wYWsnLFxyXG4gICdtb2RlbHMucGFrJyxcclxuICAnc2hhcmVkLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kYmFua3MucGFrJyxcclxuICAnc2hhcmVkc291bmRzLnBhaycsXHJcbiAgJ3RleHR1cmVzLnBhaycsXHJcbiAgJ3ZpcnR1YWx0ZXh0dXJlcy5wYWsnLFxyXG5dKTtcclxuXHJcbmNvbnN0IExTTElCX0ZJTEVTID0gbmV3IFNldChbXHJcbiAgJ2RpdmluZS5leGUnLFxyXG4gICdsc2xpYi5kbGwnLFxyXG5dKTtcclxuXHJcbmZ1bmN0aW9uIGlzTFNMaWIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcclxuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PlxyXG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgcmV0dXJuIG9yaWdGaWxlICE9PSB1bmRlZmluZWRcclxuICAgID8gQmx1ZWJpcmQucmVzb2x2ZSh0cnVlKVxyXG4gICAgOiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdExTTGliKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcbiAgY29uc3QgbWF0Y2hlZEZpbGVzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gTFNMSUJfRklMRVMuaGFzKHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQ6IG1hdGNoZWRGaWxlcy5sZW5ndGggPj0gMixcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsTFNMaWIoZmlsZXM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBjb25zdCBleGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlLnRvTG93ZXJDYXNlKCkpID09PSAnZGl2aW5lLmV4ZScpO1xyXG4gIGNvbnN0IGV4ZVBhdGggPSBwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBleGUpO1xyXG4gIGxldCB2ZXI6IHN0cmluZyA9IGF3YWl0IGdldFZlcnNpb24oZXhlUGF0aCk7XHJcbiAgdmVyID0gdmVyLnNwbGl0KCcuJykuc2xpY2UoMCwgMykuam9pbignLicpO1xyXG5cclxuICAvLyBVbmZvcnR1bmF0ZWx5IHRoZSBMU0xpYiBkZXZlbG9wZXIgaXMgbm90IGNvbnNpc3RlbnQgd2hlbiBjaGFuZ2luZ1xyXG4gIC8vICBmaWxlIHZlcnNpb25zIC0gdGhlIGV4ZWN1dGFibGUgYXR0cmlidXRlIG1pZ2h0IGhhdmUgYW4gb2xkZXIgdmVyc2lvblxyXG4gIC8vICB2YWx1ZSB0aGFuIHRoZSBvbmUgc3BlY2lmaWVkIGJ5IHRoZSBmaWxlbmFtZSAtIHdlJ3JlIGdvaW5nIHRvIHVzZVxyXG4gIC8vICB0aGUgZmlsZW5hbWUgYXMgdGhlIHBvaW50IG9mIHRydXRoICp1Z2gqXHJcbiAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRlc3RpbmF0aW9uUGF0aCwgcGF0aC5leHRuYW1lKGRlc3RpbmF0aW9uUGF0aCkpO1xyXG4gIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XHJcbiAgY29uc3QgZmlsZU5hbWVWZXIgPSBmaWxlTmFtZS5zbGljZShpZHggKyAyKTtcclxuICBpZiAoc2VtdmVyLnZhbGlkKGZpbGVOYW1lVmVyKSAmJiB2ZXIgIT09IGZpbGVOYW1lVmVyKSB7XHJcbiAgICB2ZXIgPSBmaWxlTmFtZVZlcjtcclxuICB9XHJcbiAgY29uc3QgdmVyc2lvbkF0dHI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ2F0dHJpYnV0ZScsIGtleTogJ3ZlcnNpb24nLCB2YWx1ZTogdmVyIH07XHJcbiAgY29uc3QgbW9kdHlwZUF0dHI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ3NldG1vZHR5cGUnLCB2YWx1ZTogJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcgfTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID1cclxuICAgIGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChmaWxlUGF0aC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgIC5zcGxpdChwYXRoLnNlcClcclxuICAgICAgICAgICAgICAgICAgLmluZGV4T2YoJ3Rvb2xzJykgIT09IC0xXHJcbiAgICAgICYmICFmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKCd0b29scycsIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpKSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbIG1vZHR5cGVBdHRyLCB2ZXJzaW9uQXR0ciBdKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNSZXBsYWNlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xyXG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XHJcbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIE9SSUdJTkFMX0ZJTEVTLmhhcyhpdGVyLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkpKTtcclxuXHJcbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihpdGVyID0+XHJcbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIChwYXRoLmV4dG5hbWUoaXRlci5kZXN0aW5hdGlvbikudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKSk7XHJcblxyXG4gIGlmICgob3JpZ0ZpbGUgIT09IHVuZGVmaW5lZCkgfHwgKHBha3MubGVuZ3RoID09PSAwKSkge1xyXG4gICAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdNb2QgbG9va3MgbGlrZSBhIHJlcGxhY2VyJywge1xyXG4gICAgICBiYmNvZGU6ICdUaGUgbW9kIHlvdSBqdXN0IGluc3RhbGxlZCBsb29rcyBsaWtlIGEgXCJyZXBsYWNlclwiLCBtZWFuaW5nIGl0IGlzIGludGVuZGVkIHRvIHJlcGxhY2UgJ1xyXG4gICAgICAgICAgKyAnb25lIG9mIHRoZSBmaWxlcyBzaGlwcGVkIHdpdGggdGhlIGdhbWUuPGJyLz4nXHJcbiAgICAgICAgICArICdZb3Ugc2hvdWxkIGJlIGF3YXJlIHRoYXQgc3VjaCBhIHJlcGxhY2VyIGluY2x1ZGVzIGEgY29weSBvZiBzb21lIGdhbWUgZGF0YSBmcm9tIGEgJ1xyXG4gICAgICAgICAgKyAnc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgZ2FtZSBhbmQgbWF5IHRoZXJlZm9yZSBicmVhayBhcyBzb29uIGFzIHRoZSBnYW1lIGdldHMgdXBkYXRlZC48YnIvPidcclxuICAgICAgICAgICsgJ0V2ZW4gaWYgZG9lc25cXCd0IGJyZWFrLCBpdCBtYXkgcmV2ZXJ0IGJ1Z2ZpeGVzIHRoYXQgdGhlIGdhbWUgJ1xyXG4gICAgICAgICAgKyAnZGV2ZWxvcGVycyBoYXZlIG1hZGUuPGJyLz48YnIvPidcclxuICAgICAgICAgICsgJ1RoZXJlZm9yZSBbY29sb3I9XCJyZWRcIl1wbGVhc2UgdGFrZSBleHRyYSBjYXJlIHRvIGtlZXAgdGhpcyBtb2QgdXBkYXRlZFsvY29sb3JdIGFuZCByZW1vdmUgaXQgd2hlbiBpdCAnXHJcbiAgICAgICAgICArICdubyBsb25nZXIgbWF0Y2hlcyB0aGUgZ2FtZSB2ZXJzaW9uLicsXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdJbnN0YWxsIGFzIE1vZCAod2lsbCBsaWtlbHkgbm90IHdvcmspJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBSZXBsYWNlcicgfSxcclxuICAgIF0pLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5hY3Rpb24gPT09ICdJbnN0YWxsIGFzIFJlcGxhY2VyJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSZXBsYWNlcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbiAgfVxyXG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiBwYWtzLmxlbmd0aCA9PT0gMCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IEJsdWViaXJkPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoZmlsZXMubWFwKGZpbGUgPT4gcGF0aC5kaXJuYW1lKGZpbGUpLnRvVXBwZXJDYXNlKCkpKSk7XHJcbiAgbGV0IGRhdGFQYXRoOiBzdHJpbmcgPSBkaXJlY3Rvcmllcy5maW5kKGRpciA9PiBwYXRoLmJhc2VuYW1lKGRpcikgPT09ICdEQVRBJyk7XHJcbiAgaWYgKGRhdGFQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGNvbnN0IGdlbk9yUHVibGljID0gZGlyZWN0b3JpZXNcclxuICAgICAgLmZpbmQoZGlyID0+IFsnUFVCTElDJywgJ0dFTkVSQVRFRCddLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZGlyKSkpO1xyXG4gICAgaWYgKGdlbk9yUHVibGljICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGF0YVBhdGggPSBwYXRoLmRpcm5hbWUoZ2VuT3JQdWJsaWMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IChkYXRhUGF0aCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBmaWxlcy5yZWR1Y2UoKHByZXY6IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcclxuICAgICAgICByZXR1cm4gcHJldjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkYXRhUGF0aCwgZmlsZVBhdGgpO1xyXG4gICAgICBpZiAoIXJlbFBhdGguc3RhcnRzV2l0aCgnLi4nKSkge1xyXG4gICAgICAgIHByZXYucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHJlbFBhdGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LCBbXSlcclxuICAgIDogZmlsZXMubWFwKChmaWxlUGF0aDogc3RyaW5nKTogdHlwZXMuSUluc3RydWN0aW9uID0+ICh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgZGVzdGluYXRpb246IGZpbGVQYXRoLFxyXG4gICAgICB9KSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgIGluc3RydWN0aW9ucyxcclxuICB9KTtcclxufVxyXG5cclxuY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xyXG4gIGxldCBjYWNoZWQgPSBbXTtcclxuICB0cnkge1xyXG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXHJcbiAgICAgICAgLmZpbHRlcihuYW1lID0+IChwYXRoLmV4dG5hbWUobmFtZSkgPT09ICcnKSAmJiAobmFtZSAhPT0gJ0RlZmF1bHQnKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICgpID0+IGNhY2hlZDtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbChwcm9wcykge1xyXG4gIGNvbnN0IHsgdCwgY3VycmVudFByb2ZpbGUsIG9uSW5zdGFsbExTTGliLFxyXG4gICAgICAgICAgb25TZXRQbGF5ZXJQcm9maWxlLCBpc0xzTGliSW5zdGFsbGVkIH0gPSBwcm9wcztcclxuXHJcbiAgY29uc3Qgb25TZWxlY3QgPSBSZWFjdC51c2VDYWxsYmFjaygoZXYpID0+IHtcclxuICAgIG9uU2V0UGxheWVyUHJvZmlsZShldi5jdXJyZW50VGFyZ2V0LnZhbHVlKTtcclxuICB9LCBbb25TZXRQbGF5ZXJQcm9maWxlXSk7XHJcblxyXG4gIHJldHVybiBpc0xzTGliSW5zdGFsbGVkKCkgPyAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIHBhZGRpbmc6ICcxNnB4JyB9fT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cclxuICAgICAgICB7dCgnSW5nYW1lIFByb2ZpbGU6ICcpfVxyXG4gICAgICAgIDxGb3JtQ29udHJvbFxyXG4gICAgICAgICAgY29tcG9uZW50Q2xhc3M9J3NlbGVjdCdcclxuICAgICAgICAgIG5hbWU9J3VzZXJQcm9maWxlJ1xyXG4gICAgICAgICAgY2xhc3NOYW1lPSdmb3JtLWNvbnRyb2wnXHJcbiAgICAgICAgICB2YWx1ZT17Y3VycmVudFByb2ZpbGV9XHJcbiAgICAgICAgICBvbkNoYW5nZT17b25TZWxlY3R9XHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPG9wdGlvbiBrZXk9J2dsb2JhbCcgdmFsdWU9J2dsb2JhbCc+e3QoJ0FsbCBQcm9maWxlcycpfTwvb3B0aW9uPlxyXG4gICAgICAgICAge2dldFBsYXllclByb2ZpbGVzKCkubWFwKHByb2YgPT4gKDxvcHRpb24ga2V5PXtwcm9mfSB2YWx1ZT17cHJvZn0+e3Byb2Z9PC9vcHRpb24+KSl9XHJcbiAgICAgICAgPC9Gb3JtQ29udHJvbD5cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxoci8+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJ1BsZWFzZSByZWZlciB0byBtb2QgZGVzY3JpcHRpb25zIGZyb20gbW9kIGF1dGhvcnMgdG8gZGV0ZXJtaW5lIHRoZSByaWdodCBvcmRlci4gJ1xyXG4gICAgICAgICAgKyAnSWYgeW91IGNhblxcJ3QgZmluZCBhbnkgc3VnZ2VzdGlvbnMgZm9yIGEgbW9kLCBpdCBwcm9iYWJseSBkb2VzblxcJ3QgbWF0dGVyLicpfVxyXG4gICAgICAgIDxoci8+XHJcbiAgICAgICAge3QoJ1NvbWUgbW9kcyBtYXkgYmUgbG9ja2VkIGluIHRoaXMgbGlzdCBiZWNhdXNlIHRoZXkgYXJlIGxvYWRlZCBkaWZmZXJlbnRseSBieSB0aGUgZW5naW5lICdcclxuICAgICAgICAgICsgJ2FuZCBjYW4gdGhlcmVmb3JlIG5vdCBiZSBsb2FkLW9yZGVyZWQgYnkgbW9kIG1hbmFnZXJzLiBJZiB5b3Ugd2FudCB0byBkaXNhYmxlICdcclxuICAgICAgICAgICsgJ3N1Y2ggYSBtb2QsIHBsZWFzZSBkbyBzbyBvbiB0aGUgXCJNb2RzXCIgc2NyZWVuLicpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICkgOiAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIHBhZGRpbmc6ICcxNnB4JyB9fT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cclxuICAgICAgICB7dCgnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGhyLz5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnVG8gdGFrZSBmdWxsIGFkdmFudGFnZSBvZiBWb3J0ZXhcXCdzIEJHMyBtb2RkaW5nIGNhcGFiaWxpdGllcyBzdWNoIGFzIG1hbmFnaW5nIHRoZSAnXHJcbiAgICAgICAgICsgJ29yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCBpbnRvIHRoZSBnYW1lOyBWb3J0ZXggcmVxdWlyZXMgYSAzcmQgcGFydHkgdG9vbCBcIkxTTGliXCIsICdcclxuICAgICAgICAgKyAncGxlYXNlIGluc3RhbGwgdGhlIGxpYnJhcnkgdXNpbmcgdGhlIGJ1dHRvbnMgYmVsb3cgdG8gbWFuYWdlIHlvdXIgbG9hZCBvcmRlci4nKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDx0b29sdGlwLkJ1dHRvblxyXG4gICAgICAgIHRvb2x0aXA9eydJbnN0YWxsIExTTGliJ31cclxuICAgICAgICBvbkNsaWNrPXtvbkluc3RhbGxMU0xpYn1cclxuICAgICAgPlxyXG4gICAgICAgIHt0KCdJbnN0YWxsIExTTGliJyl9XHJcbiAgICAgIDwvdG9vbHRpcC5CdXR0b24+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIHJldHVybiBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGUgfHwgJ2dsb2JhbCc7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHdyaXRlTG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE9yZGVyOiB7IFtrZXk6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9KSB7XHJcbiAgY29uc3QgYmczcHJvZmlsZTogc3RyaW5nID0gZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xyXG4gIGNvbnN0IHBsYXllclByb2ZpbGVzID0gKGJnM3Byb2ZpbGUgPT09ICdnbG9iYWwnKSA/IGdldFBsYXllclByb2ZpbGVzKCkgOiBbYmczcHJvZmlsZV07XHJcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ2JnMy1uby1wcm9maWxlcycsXHJcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgdGl0bGU6ICdObyBwbGF5ZXIgcHJvZmlsZXMnLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtbm8tcHJvZmlsZXMnKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcblxyXG4gICAgY29uc3QgcmVnaW9uID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgICBjb25zdCByb290ID0gZmluZE5vZGUocmVnaW9uPy5ub2RlLCAncm9vdCcpO1xyXG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xyXG4gICAgY29uc3QgbG9Ob2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJykgPz8geyBjaGlsZHJlbjogW10gfTtcclxuICAgIGlmICgobG9Ob2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobG9Ob2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xyXG4gICAgICBsb05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcclxuICAgIH1cclxuICAgIC8vIGRyb3AgYWxsIG5vZGVzIGV4Y2VwdCBmb3IgdGhlIGdhbWUgZW50cnlcclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTm9kZXMgPSBtb2RzTm9kZT8uY2hpbGRyZW4/LlswXT8ubm9kZT8uZmlsdGVyPy4oaXRlciA9PlxyXG4gICAgICBpdGVyLmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ05hbWUnKSAmJiAoYXR0ci4kLnZhbHVlID09PSAnR3VzdGF2JykpKSA/PyBbXTtcclxuXHJcbiAgICBjb25zdCBlbmFibGVkUGFrcyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiAhIWxvYWRPcmRlcltrZXldLmRhdGE/LnV1aWRcclxuICAgICAgICAgICAgICAgICAgICAmJiBsb2FkT3JkZXJba2V5XS5lbmFibGVkXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgIWxvYWRPcmRlcltrZXldLmRhdGE/LmlzTGlzdGVkKTtcclxuXHJcbiAgICAvLyBhZGQgbmV3IG5vZGVzIGZvciB0aGUgZW5hYmxlZCBtb2RzXHJcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBlbmFibGVkUGFrcykge1xyXG4gICAgICAvLyBjb25zdCBtZDUgPSBhd2FpdCB1dGlsLmZpbGVNRDUocGF0aC5qb2luKG1vZHNQYXRoKCksIGtleSkpO1xyXG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xyXG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXHJcbiAgICAgICAgYXR0cmlidXRlOiBbXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdGb2xkZXInLCB0eXBlOiAnTFNXU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEuZm9sZGVyIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm1kNSB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdOYW1lJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEubmFtZSB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdVVUlEJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudXVpZCB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdWZXJzaW9uJywgdHlwZTogJ2ludDMyJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudmVyc2lvbiB9IH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9hZE9yZGVyTm9kZXMgPSBlbmFibGVkUGFrc1xyXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcclxuICAgICAgLm1hcCgoa2V5OiBzdHJpbmcpOiBJTW9kTm9kZSA9PiAoe1xyXG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGUnIH0sXHJcbiAgICAgICAgYXR0cmlidXRlOiBbXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdVVUlEJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEudXVpZCB9IH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSkpO1xyXG5cclxuICAgIG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBkZXNjcmlwdGlvbk5vZGVzO1xyXG4gICAgbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBsb2FkT3JkZXJOb2RlcztcclxuXHJcbiAgICBpZiAoYmczcHJvZmlsZSA9PT0gJ2dsb2JhbCcpIHtcclxuICAgICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzLCBiZzNwcm9maWxlKTtcclxuICAgIH1cclxuICAgIGZvciAoY29uc3QgcHJvZmlsZSBvZiBwbGF5ZXJQcm9maWxlcykge1xyXG4gICAgICB3cml0ZU1vZFNldHRpbmdzKGFwaSwgbW9kU2V0dGluZ3MsIHByb2ZpbGUpO1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0dGluZ3NXcml0dGVuKHByb2ZpbGUsIERhdGUubm93KCksIGVuYWJsZWRQYWtzLmxlbmd0aCkpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG50eXBlIERpdmluZUFjdGlvbiA9ICdjcmVhdGUtcGFja2FnZScgfCAnbGlzdC1wYWNrYWdlJyB8ICdleHRyYWN0LXNpbmdsZS1maWxlJ1xyXG4gICAgICAgICAgICAgICAgICB8ICdleHRyYWN0LXBhY2thZ2UnIHwgJ2V4dHJhY3QtcGFja2FnZXMnIHwgJ2NvbnZlcnQtbW9kZWwnXHJcbiAgICAgICAgICAgICAgICAgIHwgJ2NvbnZlcnQtbW9kZWxzJyB8ICdjb252ZXJ0LXJlc291cmNlJyB8ICdjb252ZXJ0LXJlc291cmNlcyc7XHJcblxyXG5pbnRlcmZhY2UgSURpdmluZU9wdGlvbnMge1xyXG4gIHNvdXJjZTogc3RyaW5nO1xyXG4gIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xyXG4gIGV4cHJlc3Npb24/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJRGl2aW5lT3V0cHV0IHtcclxuICBzdGRvdXQ6IHN0cmluZztcclxuICByZXR1cm5Db2RlOiBudW1iZXI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExhdGVzdExTTGliTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXTtcclxuICBpZiAobW9kcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBsYXRlc3RWZXIgPSB1dGlsLmdldFNhZmUocHJldiwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG4gICAgICBpZiAoc2VtdmVyLmd0KGN1cnJlbnRWZXIsIGxhdGVzdFZlcikpIHtcclxuICAgICAgICBwcmV2ID0gbW9kc1tpZF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBwcmV2O1xyXG4gIH0sIHVuZGVmaW5lZCk7XHJcblxyXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiBsc0xpYjtcclxufVxyXG5cclxuZnVuY3Rpb24gZGl2aW5lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogSURpdmluZU9wdGlvbnMpOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SURpdmluZU91dHB1dD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgbGV0IHJldHVybmVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBsZXQgc3Rkb3V0OiBzdHJpbmcgPSAnJztcclxuXHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xyXG4gICAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdMU0xpYi9EaXZpbmUgdG9vbCBpcyBtaXNzaW5nJyk7XHJcbiAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICBjb25zdCBleGUgPSBwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbHNMaWIuaW5zdGFsbGF0aW9uUGF0aCwgJ3Rvb2xzJywgJ2RpdmluZS5leGUnKTtcclxuICAgIGNvbnN0IGFyZ3MgPSBbXHJcbiAgICAgICctLWFjdGlvbicsIGFjdGlvbixcclxuICAgICAgJy0tc291cmNlJywgb3B0aW9ucy5zb3VyY2UsXHJcbiAgICAgICctLWxvZ2xldmVsJywgJ29mZicsXHJcbiAgICAgICctLWdhbWUnLCAnYmczJyxcclxuICAgIF07XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuZGVzdGluYXRpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcmdzLnB1c2goJy0tZGVzdGluYXRpb24nLCBvcHRpb25zLmRlc3RpbmF0aW9uKTtcclxuICAgIH1cclxuICAgIGlmIChvcHRpb25zLmV4cHJlc3Npb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcmdzLnB1c2goJy0tZXhwcmVzc2lvbicsIG9wdGlvbnMuZXhwcmVzc2lvbik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coJ3NwYXduJywgZXhlLCBhcmdzKTtcclxuXHJcbiAgICBjb25zdCBwcm9jID0gc3Bhd24oZXhlLCBhcmdzKTtcclxuXHJcbiAgICBwcm9jLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4gc3Rkb3V0ICs9IGRhdGEpO1xyXG4gICAgcHJvYy5zdGRlcnIub24oJ2RhdGEnLCBkYXRhID0+IGxvZygnd2FybicsIGRhdGEpKTtcclxuXHJcbiAgICBwcm9jLm9uKCdlcnJvcicsIChlcnJJbjogRXJyb3IpID0+IHtcclxuICAgICAgaWYgKCFyZXR1cm5lZCkge1xyXG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ2RpdmluZS5leGUgZmFpbGVkOiAnICsgZXJySW4ubWVzc2FnZSk7XHJcbiAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBwcm9jLm9uKCdleGl0JywgKGNvZGU6IG51bWJlcikgPT4ge1xyXG4gICAgICBpZiAoIXJldHVybmVkKSB7XHJcbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dCwgcmV0dXJuQ29kZTogMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDIpIHtcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHsgc3Rkb3V0OiAnJywgcmV0dXJuQ29kZTogMiB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gZGl2aW5lLmV4ZSByZXR1cm5zIHRoZSBhY3R1YWwgZXJyb3IgY29kZSArIDEwMCBpZiBhIGZhdGFsIGVycm9yIG9jY3VyZWRcclxuICAgICAgICAgIGlmIChjb2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIGNvZGUgLT0gMTAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtjb2RlfWApO1xyXG4gICAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aCwgZGVzdFBhdGgsIHBhdHRlcm4pIHtcclxuICByZXR1cm4gZGl2aW5lKGFwaSwgJ2V4dHJhY3QtcGFja2FnZScsXHJcbiAgICB7IHNvdXJjZTogcGFrUGF0aCwgZGVzdGluYXRpb246IGRlc3RQYXRoLCBleHByZXNzaW9uOiBwYXR0ZXJuIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgY29uc3QgbWV0YVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdsc21ldGEnLCBzaG9ydGlkKCkpO1xyXG4gIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKG1ldGFQYXRoKTtcclxuICBhd2FpdCBleHRyYWN0UGFrKGFwaSwgcGFrUGF0aCwgbWV0YVBhdGgsICcqL21ldGEubHN4Jyk7XHJcbiAgdHJ5IHtcclxuICAgIC8vIHRoZSBtZXRhLmxzeCBtYXkgYmUgaW4gYSBzdWJkaXJlY3RvcnkuIFRoZXJlIGlzIHByb2JhYmx5IGEgcGF0dGVybiBoZXJlXHJcbiAgICAvLyBidXQgd2UnbGwganVzdCB1c2UgaXQgZnJvbSB3aGVyZXZlclxyXG4gICAgbGV0IG1ldGFMU1hQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4obWV0YVBhdGgsICdtZXRhLmxzeCcpO1xyXG4gICAgYXdhaXQgd2FsayhtZXRhUGF0aCwgZW50cmllcyA9PiB7XHJcbiAgICAgIGNvbnN0IHRlbXAgPSBlbnRyaWVzLmZpbmQoZSA9PiBwYXRoLmJhc2VuYW1lKGUuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09ICdtZXRhLmxzeCcpO1xyXG4gICAgICBpZiAodGVtcCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgbWV0YUxTWFBhdGggPSB0ZW1wLmZpbGVQYXRoO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobWV0YUxTWFBhdGgpO1xyXG4gICAgY29uc3QgbWV0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobWV0YVBhdGgpO1xyXG4gICAgcmV0dXJuIG1ldGE7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XHJcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmROb2RlPFQgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiBzdHJpbmcgfT4sIFU+KG5vZGVzOiBUW10sIGlkOiBzdHJpbmcpOiBUIHtcclxuICByZXR1cm4gbm9kZXM/LmZpbmQoaXRlciA9PiBpdGVyLiQuaWQgPT09IGlkKSA/PyB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmNvbnN0IGxpc3RDYWNoZTogeyBbcGF0aDogc3RyaW5nXTogUHJvbWlzZTxzdHJpbmdbXT4gfSA9IHt9O1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gbGlzdFBhY2thZ2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgY29uc3QgcmVzID0gYXdhaXQgZGl2aW5lKGFwaSwgJ2xpc3QtcGFja2FnZScsIHsgc291cmNlOiBwYWtQYXRoIH0pO1xyXG4gIGNvbnN0IGxpbmVzID0gcmVzLnN0ZG91dC5zcGxpdCgnXFxuJykubWFwKGxpbmUgPT4gbGluZS50cmltKCkpLmZpbHRlcihsaW5lID0+IGxpbmUubGVuZ3RoICE9PSAwKTtcclxuXHJcbiAgcmV0dXJuIGxpbmVzO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpc0xPTGlzdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgaWYgKGxpc3RDYWNoZVtwYWtQYXRoXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsaXN0Q2FjaGVbcGFrUGF0aF0gPSBsaXN0UGFja2FnZShhcGksIHBha1BhdGgpO1xyXG4gIH1cclxuICBjb25zdCBsaW5lcyA9IGF3YWl0IGxpc3RDYWNoZVtwYWtQYXRoXTtcclxuICAvLyBjb25zdCBub25HVUkgPSBsaW5lcy5maW5kKGxpbmUgPT4gIWxpbmUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdwdWJsaWMvZ2FtZS9ndWknKSk7XHJcbiAgY29uc3QgbWV0YUxTWCA9IGxpbmVzLmZpbmQobGluZSA9PlxyXG4gICAgcGF0aC5iYXNlbmFtZShsaW5lLnNwbGl0KCdcXHQnKVswXSkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XHJcbiAgcmV0dXJuIG1ldGFMU1ggPT09IHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBha0luZm9JbXBsKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJUGFrSW5mbz4ge1xyXG4gIGNvbnN0IG1ldGEgPSBhd2FpdCBleHRyYWN0TWV0YShhcGksIHBha1BhdGgpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XHJcblxyXG4gIGNvbnN0IGF0dHIgPSAobmFtZTogc3RyaW5nLCBmYWxsYmFjazogKCkgPT4gYW55KSA9PlxyXG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcclxuXHJcbiAgY29uc3QgZ2VuTmFtZSA9IHBhdGguYmFzZW5hbWUocGFrUGF0aCwgcGF0aC5leHRuYW1lKHBha1BhdGgpKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcclxuICAgIGRlc2NyaXB0aW9uOiBhdHRyKCdEZXNjcmlwdGlvbicsICgpID0+ICdNaXNzaW5nJyksXHJcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXHJcbiAgICBuYW1lOiBhdHRyKCdOYW1lJywgKCkgPT4gZ2VuTmFtZSksXHJcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxyXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcclxuICAgIHZlcnNpb246IGF0dHIoJ1ZlcnNpb24nLCAoKSA9PiAnMScpLFxyXG4gICAgaXNMaXN0ZWQ6IGF3YWl0IGlzTE9MaXN0ZWQoYXBpLCBwYWtQYXRoKSxcclxuICB9O1xyXG59XHJcblxyXG5jb25zdCBmYWxsYmFja1BpY3R1cmUgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZ2FtZWFydC5qcGcnKTtcclxuXHJcbmxldCBzdG9yZWRMTzogYW55W107XHJcblxyXG5mdW5jdGlvbiBwYXJzZU1vZE5vZGUobm9kZTogSU1vZE5vZGUpIHtcclxuICBjb25zdCBuYW1lID0gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdOYW1lJykuJC52YWx1ZTtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IG5hbWUsXHJcbiAgICBuYW1lLFxyXG4gICAgZGF0YTogZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJC52YWx1ZSxcclxuICB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSBnZXRQbGF5ZXJQcm9maWxlcygpO1xyXG4gIGlmIChwbGF5ZXJQcm9maWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgIHN0b3JlZExPID0gW107XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSAoYmczcHJvZmlsZSAhPT0gJ2dsb2JhbCcpXHJcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXHJcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZXR0aW5nc1BhdGgpO1xyXG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRhdGE6IElNb2RTZXR0aW5ncywgYmczcHJvZmlsZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKCFiZzNwcm9maWxlKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSAoYmczcHJvZmlsZSAhPT0gJ2dsb2JhbCcpIFxyXG4gICAgPyBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKVxyXG4gICAgOiBwYXRoLmpvaW4oZ2xvYmFsUHJvZmlsZVBhdGgoKSwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcclxuICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGRhdGEpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShzZXR0aW5nc1BhdGgpKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHNldHRpbmdzUGF0aCwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHN0b3JlZExPID0gW107XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBzZXR0aW5ncycsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRTdG9yZWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcbiAgY29uc3QgbW9kc1Jvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xyXG4gIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuXHJcbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcclxuXHJcbiAgLy8gcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHZQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XHJcbiAgICB1dGlsLmdldFNhZmUodlByb2ZpbGUsIFsnbW9kU3RhdGUnLCBpZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID4gMCAmJiBtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcclxuICAgIGNvbnN0IGxhc3RXcml0ZSA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8uc2V0dGluZ3NXcml0dGVuPy5bYmczcHJvZmlsZV07XHJcbiAgICBpZiAoKGxhc3RXcml0ZSAhPT0gdW5kZWZpbmVkKSAmJiAobGFzdFdyaXRlLmNvdW50ID4gMSkpIHtcclxuICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlIHdhcyByZXNldCcsIHtcclxuICAgICAgICB0ZXh0OiAnVGhlIGdhbWUgcmVzZXQgdGhlIGxpc3Qgb2YgYWN0aXZlIG1vZHMgYW5kIHJhbiB3aXRob3V0IHRoZW0uXFxuJ1xyXG4gICAgICAgICAgICArICdUaGlzIGhhcHBlbnMgd2hlbiBhbiBpbnZhbGlkIG9yIGluY29tcGF0aWJsZSBtb2QgaXMgaW5zdGFsbGVkLiAnXHJcbiAgICAgICAgICAgICsgJ1RoZSBnYW1lIHdpbGwgbm90IGxvYWQgYW55IG1vZHMgaWYgb25lIG9mIHRoZW0gaXMgaW5jb21wYXRpYmxlLCB1bmZvcnR1bmF0ZWx5ICdcclxuICAgICAgICAgICAgKyAndGhlcmUgaXMgbm8gZWFzeSB3YXkgdG8gZmluZCBvdXQgd2hpY2ggb25lIGNhdXNlZCB0aGUgcHJvYmxlbS4nLFxyXG4gICAgICB9LCBbXHJcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlJyB9LFxyXG4gICAgICBdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHN0b3JlZExPID0gbW9kTm9kZXNcclxuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXHJcbiAgICAvLyBHdXN0YXYgaXMgdGhlIGNvcmUgZ2FtZVxyXG4gICAgLmZpbHRlcihlbnRyeSA9PiBlbnRyeS5pZCA9PT0gJ0d1c3RhdicpXHJcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBtb2RPcmRlclxyXG4gICAgICAuZmluZEluZGV4KGkgPT4gaSA9PT0gbGhzLmRhdGEpIC0gbW9kT3JkZXIuZmluZEluZGV4KGkgPT4gaSA9PT0gcmhzLmRhdGEpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS0xpc3QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xyXG4gIHRyeSB7XHJcbiAgICBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgIC5maWx0ZXIoZmlsZU5hbWUgPT4gcGF0aC5leHRuYW1lKGZpbGVOYW1lKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKCksICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIG5vcFxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzIGRpcmVjdG9yeScsIGVyciwge1xyXG4gICAgICAgIGlkOiAnYmczLWZhaWxlZC1yZWFkLW1vZHMnLFxyXG4gICAgICAgIG1lc3NhZ2U6IG1vZHNQYXRoKCksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcGFrcyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBha3M7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRQQUtzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSlcclxuICAgIDogUHJvbWlzZTxBcnJheTx7IGZpbGVOYW1lOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCwgaW5mbzogSVBha0luZm8gfT4+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGxzTGliID0gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKTtcclxuICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS0xpc3QoYXBpKTtcclxuXHJcbiAgbGV0IG1hbmlmZXN0O1xyXG4gIHRyeSB7XHJcbiAgICBtYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCAnJywgR0FNRV9JRCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgZGVwbG95bWVudCBtYW5pZmVzdCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IFByb21pc2UuYWxsKHBha3MubWFwKGFzeW5jIGZpbGVOYW1lID0+IHtcclxuICAgIHJldHVybiB1dGlsLndpdGhFcnJvckNvbnRleHQoJ3JlYWRpbmcgcGFrJywgZmlsZU5hbWUsICgpID0+IHtcclxuICAgICAgY29uc3QgZnVuYyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IG1hbmlmZXN0LmZpbGVzLmZpbmQoZW50cnkgPT4gZW50cnkucmVsUGF0aCA9PT0gZmlsZU5hbWUpO1xyXG4gICAgICAgICAgY29uc3QgbW9kID0gKG1hbmlmZXN0RW50cnkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgPyBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF0/LlttYW5pZmVzdEVudHJ5LnNvdXJjZV1cclxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZmlsZU5hbWUsXHJcbiAgICAgICAgICAgIG1vZCxcclxuICAgICAgICAgICAgaW5mbzogYXdhaXQgZXh0cmFjdFBha0luZm9JbXBsKGFwaSwgcGF0aC5qb2luKG1vZHNQYXRoKCksIGZpbGVOYW1lKSksXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gY291bGQgaGFwcGVuIGlmIHRoZSBmaWxlIGdvdCBkZWxldGVkIHNpbmNlIHJlYWRpbmcgdGhlIGxpc3Qgb2YgcGFrcy5cclxuICAgICAgICAgIC8vIGFjdHVhbGx5LCB0aGlzIHNlZW1zIHRvIGJlIGZhaXJseSBjb21tb24gd2hlbiB1cGRhdGluZyBhIG1vZFxyXG4gICAgICAgICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBwYWsnLCBlcnIsIHtcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcclxuICAgICAgICAgICAgICBtZXNzYWdlOiBmaWxlTmFtZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZnVuYygpKTtcclxuICAgIH0pO1xyXG4gIH0pKTtcclxuICByZXR1cm4gcmVzLmZpbHRlcihpdGVyID0+IGl0ZXIgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICAgIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgICByZXR1cm4gbW9kT3JkZXJOb2Rlcy5tYXAobm9kZSA9PiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kPy52YWx1ZSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzZXR0aW5ncy5sc3gnLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvcmRlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gIHJldHVybiB3cml0ZUxvYWRPcmRlcihhcGksIG9yZGVyKTtcclxufVxyXG5cclxuY29uc3QgZGVzZXJpYWxpemVEZWJvdW5jZXIgPSBuZXcgdXRpbC5EZWJvdW5jZXIoKCkgPT4ge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufSwgMTAwMCk7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZUxvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGFueT4ge1xyXG4gIC8vIHRoaXMgZnVuY3Rpb24gbWlnaHQgYmUgaW52b2tlZCBieSB0aGUgbHNsaWIgbW9kIGJlaW5nICh1bilpbnN0YWxsZWQgaW4gd2hpY2ggY2FzZSBpdCBtaWdodCBiZVxyXG4gIC8vIGluIHRoZSBtaWRkbGUgb2YgYmVpbmcgdW5wYWNrZWQgb3IgcmVtb3ZlZCB3aGljaCBsZWFkcyB0byB3ZWlyZCBlcnJvciBtZXNzYWdlcy5cclxuICAvLyB0aGlzIGlzIGEgaGFjayBob3BlZnVsbHkgZW5zdXJlaW5nIHRoZSBpdCdzIGVpdGhlciBmdWxseSB0aGVyZSBvciBub3QgYXQgYWxsXHJcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gZGVzZXJpYWxpemVEZWJvdW5jZXIuc2NoZWR1bGUoY2IpKTtcclxuXHJcbiAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtzKGFwaSk7XHJcblxyXG4gIGNvbnN0IG9yZGVyID0gYXdhaXQgcmVhZExPKGFwaSk7XHJcblxyXG4gIGNvbnN0IG9yZGVyVmFsdWUgPSAoaW5mbzogSVBha0luZm8pID0+IHtcclxuICAgIHJldHVybiBvcmRlci5pbmRleE9mKGluZm8udXVpZCkgKyAoaW5mby5pc0xpc3RlZCA/IDAgOiAxMDAwKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gcGFrc1xyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBvcmRlclZhbHVlKGxocy5pbmZvKSAtIG9yZGVyVmFsdWUocmhzLmluZm8pKVxyXG4gICAgLm1hcCgoeyBmaWxlTmFtZSwgbW9kLCBpbmZvIH0pID0+ICh7XHJcbiAgICAgIGlkOiBmaWxlTmFtZSxcclxuICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgbmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXHJcbiAgICAgIG1vZElkOiBtb2Q/LmlkLFxyXG4gICAgICBsb2NrZWQ6IGluZm8uaXNMaXN0ZWQsXHJcbiAgICAgIGRhdGE6IGluZm8sXHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlKGJlZm9yZSwgYWZ0ZXIpOiBQcm9taXNlPGFueT4ge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxubGV0IGZvcmNlUmVmcmVzaDogKCkgPT4gdm9pZDtcclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCByZWZyZXNoOiAoKSA9PiB2b2lkIH0pIHtcclxuICBjb25zdCB7IGFwaSB9ID0gcHJvcHM7XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XHJcbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LnBsYXllclByb2ZpbGUpO1xyXG5cclxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgZm9yY2VSZWZyZXNoID0gcHJvcHMucmVmcmVzaDtcclxuICB9LCBbXSk7XHJcblxyXG4gIGNvbnN0IG9uU2V0UHJvZmlsZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBpbXBsID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlTmFtZSkpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhhcGkpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGZvcmNlUmVmcmVzaD8uKCk7XHJcbiAgICB9O1xyXG4gICAgaW1wbCgpO1xyXG4gIH0sIFsgYXBpIF0pO1xyXG5cclxuICBjb25zdCBpc0xzTGliSW5zdGFsbGVkID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xyXG4gICAgcmV0dXJuIGdldExhdGVzdExTTGliTW9kKGFwaSkgIT09IHVuZGVmaW5lZDtcclxuICB9LCBbIGFwaSBdKTtcclxuXHJcbiAgY29uc3Qgb25JbnN0YWxsTFNMaWIgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XHJcbiAgICBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaSwgR0FNRV9JRCk7XHJcbiAgfSwgW2FwaV0pO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPEluZm9QYW5lbFxyXG4gICAgICB0PXthcGkudHJhbnNsYXRlfVxyXG4gICAgICBjdXJyZW50UHJvZmlsZT17Y3VycmVudFByb2ZpbGV9XHJcbiAgICAgIG9uU2V0UGxheWVyUHJvZmlsZT17b25TZXRQcm9maWxlfVxyXG4gICAgICBpc0xzTGliSW5zdGFsbGVkPXtpc0xzTGliSW5zdGFsbGVkfVxyXG4gICAgICBvbkluc3RhbGxMU0xpYj17b25JbnN0YWxsTFNMaWJ9XHJcbiAgICAvPlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XHJcbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldiwgaWQpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBhcmNJZCA9IG1vZHNbaWRdLmFyY2hpdmVJZDtcclxuICAgICAgY29uc3QgZGw6IHR5cGVzLklEb3dubG9hZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnZG93bmxvYWRzJywgJ2ZpbGVzJywgYXJjSWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBzdG9yZWRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG4gICAgICBpZiAoc2VtdmVyLmd0KHN0b3JlZFZlciwgcHJldikpIHtcclxuICAgICAgICBwcmV2ID0gc3RvcmVkVmVyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFRoZSBMU0xpYiBkZXZlbG9wZXIgZG9lc24ndCBhbHdheXMgdXBkYXRlIHRoZSB2ZXJzaW9uIG9uIHRoZSBleGVjdXRhYmxlXHJcbiAgICAgICAgLy8gIGl0c2VsZiAtIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBleHRyYWN0IGl0IGZyb20gdGhlIGFyY2hpdmUgd2hpY2ggdGVuZHNcclxuICAgICAgICAvLyAgdG8gdXNlIHRoZSBjb3JyZWN0IHZlcnNpb24uXHJcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRsLmxvY2FsUGF0aCwgcGF0aC5leHRuYW1lKGRsLmxvY2FsUGF0aCkpO1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XHJcbiAgICAgICAgY29uc3QgdmVyID0gZmlsZU5hbWUuc2xpY2UoaWR4ICsgMik7XHJcbiAgICAgICAgaWYgKHNlbXZlci52YWxpZCh2ZXIpICYmIHZlciAhPT0gc3RvcmVkVmVyKSB7XHJcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgaWQsICd2ZXJzaW9uJywgdmVyKSk7XHJcbiAgICAgICAgICBwcmV2ID0gdmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgJzAuMC4wJyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uQ2hlY2tNb2RWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuZ2V0U3RhdGUoKSk7XHJcbiAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xyXG5cclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICAvLyBOb3RoaW5nIHRvIHVwZGF0ZS5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG5ld2VzdFZlcjogc3RyaW5nID0gYXdhaXQgZ2l0SHViRG93bmxvYWRlci5jaGVja0ZvclVwZGF0ZXMoYXBpLCBsYXRlc3RWZXIpO1xyXG4gIGlmICghbmV3ZXN0VmVyIHx8IG5ld2VzdFZlciA9PT0gbGF0ZXN0VmVyKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3AoKSB7XHJcbiAgLy8gbm9wXHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uR2FtZU1vZGVBY3RpdmF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICdiYWxkdXJzZ2F0ZTMnXSwgcmVkdWNlcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxyXG4gICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXHJcbiAgICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICAgICAnYmluL2JnMy5leGUnLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBzZXR1cDogZGlzY292ZXJ5ID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogJzEwODY5NDAnLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogMTA4Njk0MCxcclxuICAgICAgc3RvcFBhdHRlcm5zOiBTVE9QX1BBVFRFUk5TLm1hcCh0b1dvcmRFeHApLFxyXG4gICAgICBpZ25vcmVDb25mbGljdHM6IFtcclxuICAgICAgICAnaW5mby5qc29uJyxcclxuICAgICAgXSxcclxuICAgICAgaWdub3JlRGVwbG95OiBbXHJcbiAgICAgICAgJ2luZm8uanNvbicsXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtcmVwbGFjZXInLCAyNSwgdGVzdFJlcGxhY2VyLCBpbnN0YWxsUmVwbGFjZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsIDE1LCB0ZXN0TFNMaWIsIGluc3RhbGxMU0xpYiBhcyBhbnkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLXJlcGxhY2VyJywgMjUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIGZpbGVzID0+IGlzUmVwbGFjZXIoY29udGV4dC5hcGksIGZpbGVzKSxcclxuICAgIHsgbmFtZTogJ0JHMyBSZXBsYWNlcicgfSBhcyBhbnkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IHVuZGVmaW5lZCwgZmlsZXMgPT4gaXNMU0xpYihjb250ZXh0LmFwaSwgZmlsZXMpLFxyXG4gICAgeyBuYW1lOiAnQkczIExTTGliJyB9IGFzIGFueSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpKSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogdHJ1ZSxcclxuICAgIHVzYWdlSW5zdHJ1Y3Rpb25zOiAoKCkgPT4gKDxJbmZvUGFuZWxXcmFwIGFwaT17Y29udGV4dC5hcGl9IHJlZnJlc2g9e25vcH0gLz4pKSBhcyBhbnksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2Vzc2lvbicsICdiYXNlJywgJ3Rvb2xzUnVubmluZyddLFxyXG4gICAgICBhc3luYyAocHJldjogYW55LCBjdXJyZW50OiBhbnkpID0+IHtcclxuICAgICAgICAvLyB3aGVuIGEgdG9vbCBleGl0cywgcmUtcmVhZCB0aGUgbG9hZCBvcmRlciBmcm9tIGRpc2sgYXMgaXQgbWF5IGhhdmUgYmVlblxyXG4gICAgICAgIC8vIGNoYW5nZWRcclxuICAgICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgICAgaWYgKChnYW1lTW9kZSA9PT0gR0FNRV9JRCkgJiYgKE9iamVjdC5rZXlzKGN1cnJlbnQpLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCksIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmICgocHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZm9yY2VSZWZyZXNoICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgZm9yY2VSZWZyZXNoKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdjaGVjay1tb2RzLXZlcnNpb24nLFxyXG4gICAgICAoZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkgPT4gb25DaGVja01vZFZlcnNpb24oY29udGV4dC5hcGksIGdhbWVJZCwgbW9kcykpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICAgYXN5bmMgKGdhbWVNb2RlOiBzdHJpbmcpID0+IG9uR2FtZU1vZGVBY3RpdmF0ZWQoY29udGV4dC5hcGksIGdhbWVNb2RlKSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYWluO1xyXG4iXX0=