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
const path = __importStar(require("path"));
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_redux_1 = require("react-redux");
const redux_act_1 = require("redux-act");
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const GAME_ID = 'baldursgate3';
const STOP_PATTERNS = ['[^/]*\\.pak$'];
const LSLIB_URL = 'https://github.com/Norbyte/lslib';
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
        playerProfile: '',
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
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId(['1456460669', '1086940'])
        .then(game => game.gamePath);
}
function prepareForModding(api, discovery) {
    const mp = modsPath();
    api.sendNotification({
        id: 'bg3-uses-lslib',
        type: 'info',
        title: 'BG3 support uses LSLib',
        message: LSLIB_URL,
        allowSuppress: true,
        actions: [
            { title: 'Visit Page', action: () => vortex_api_1.util.opn(LSLIB_URL).catch(() => null) },
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
    }, [{ label: 'I understand' }])));
}
function getGameDataPath(api) {
    var _a, _b;
    const state = api.getState();
    const gameMode = vortex_api_1.selectors.activeGameId(state);
    const gamePath = (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
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
    if (gameId !== GAME_ID) {
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
    const { t, currentProfile, onSetPlayerProfile } = props;
    const onSelect = React.useCallback((ev) => {
        onSetPlayerProfile(ev.currentTarget.value);
    }, [onSetPlayerProfile]);
    return (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } },
            t('Ingame Profile: '),
            React.createElement(react_bootstrap_1.FormControl, { componentClass: 'select', name: 'userProfile', className: 'form-control', value: currentProfile, onChange: onSelect },
                React.createElement("option", { key: '', value: '' }, t('Please select one')),
                getPlayerProfiles().map(prof => (React.createElement("option", { key: prof, value: prof }, prof))))),
        React.createElement("hr", null),
        React.createElement("div", null,
            t('Please refer to mod descriptions from mod authors to determine the right order. '
                + 'If you can\'t find any suggestions for a mod, it probably doesn\'t matter.'),
            React.createElement("hr", null),
            t('Some mods may be locked in this list because they are loaded differently by the engine '
                + 'and can therefore not be load-ordered by mod managers. If you want to disable '
                + 'such a mod, please do so on the "Mods" screen.'))));
}
function writeLoadOrder(api, loadOrder) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = (_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile;
        if (!bg3profile) {
            api.sendNotification({
                id: 'bg3-no-profile-selected',
                type: 'warning',
                title: 'No profile selected',
                message: 'Please select the in-game profile to mod on the "Load Order" page',
            });
            return;
        }
        api.dismissNotification('bg3-no-profile-selected');
        try {
            const modSettings = yield readModSettings(api);
            const region = findNode((_b = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _b === void 0 ? void 0 : _b.region, 'ModuleSettings');
            const root = findNode(region === null || region === void 0 ? void 0 : region.node, 'root');
            const modsNode = findNode((_d = (_c = root === null || root === void 0 ? void 0 : root.children) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.node, 'Mods');
            const loNode = (_g = findNode((_f = (_e = root === null || root === void 0 ? void 0 : root.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node, 'ModOrder')) !== null && _g !== void 0 ? _g : { children: [] };
            if ((loNode.children === undefined) || (loNode.children[0] === '')) {
                loNode.children = [{ node: [] }];
            }
            const descriptionNodes = (_m = (_l = (_k = (_j = (_h = modsNode === null || modsNode === void 0 ? void 0 : modsNode.children) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.node) === null || _k === void 0 ? void 0 : _k.filter) === null || _l === void 0 ? void 0 : _l.call(_k, iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'Gustav')))) !== null && _m !== void 0 ? _m : [];
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
            writeModSettings(api, modSettings);
            api.store.dispatch(settingsWritten(bg3profile, Date.now(), enabledPaks.length));
        }
        catch (err) {
            api.showErrorNotification('Failed to write load order', err, {
                allowReport: false,
                message: 'Please run the game at least once and create a profile in-game',
            });
        }
    });
}
function divine(action, options) {
    return new Promise((resolve, reject) => {
        let returned = false;
        let stdout = '';
        const exe = path.join(__dirname, 'tools', 'divine.exe');
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
        const proc = (0, child_process_1.spawn)(exe, args, { cwd: path.join(__dirname, 'tools') });
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
                    resolve({ stdout, returnCode: 0 });
                }
                else {
                    if (code > 100) {
                        code -= 100;
                    }
                    const err = new Error(`divine.exe failed: ${code}`);
                    err['attachLogOnReport'] = true;
                    reject(err);
                }
            }
        });
    });
}
function extractPak(pakPath, destPath, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        return divine('extract-package', { source: pakPath, destination: destPath, expression: pattern });
    });
}
function extractMeta(pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const metaPath = path.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', (0, shortid_1.generate)());
        yield vortex_api_1.fs.ensureDirAsync(metaPath);
        yield extractPak(pakPath, metaPath, '*/meta.lsx');
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
function listPackage(pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield divine('list-package', { source: pakPath });
        const lines = res.stdout.split('\n').map(line => line.trim()).filter(line => line.length !== 0);
        return lines;
    });
}
function isLOListed(pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (listCache[pakPath] === undefined) {
            listCache[pakPath] = listPackage(pakPath);
        }
        const lines = yield listCache[pakPath];
        const metaLSX = lines.find(line => path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx');
        return metaLSX === undefined;
    });
}
function extractPakInfo(pakPath) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const meta = yield extractMeta(pakPath);
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
            isListed: yield isLOListed(pakPath),
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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        let bg3profile = (_a = state.settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile;
        if (!bg3profile) {
            const playerProfiles = getPlayerProfiles();
            if (playerProfiles.length === 0) {
                storedLO = [];
                return;
            }
            bg3profile = getPlayerProfiles()[0];
        }
        const settingsPath = path.join(profilesPath(), bg3profile, 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function writeModSettings(api, data) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let bg3profile = (_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile;
        if (!bg3profile) {
            const playerProfiles = getPlayerProfiles();
            if (playerProfiles.length === 0) {
                storedLO = [];
                return;
            }
            bg3profile = getPlayerProfiles()[0];
        }
        const settingsPath = path.join(profilesPath(), bg3profile, 'modsettings.lsx');
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
        const bg3profile = (_m = state.settings.baldursgate3) === null || _m === void 0 ? void 0 : _m.playerProfile;
        if (modNodes.length === 1) {
            const lastWrite = (_p = (_o = state.settings.baldursgate3) === null || _o === void 0 ? void 0 : _o.settingsWritten) === null || _p === void 0 ? void 0 : _p[bg3profile];
            if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
                api.sendNotification({
                    id: 'bg3-modsettings-reset',
                    type: 'warning',
                    allowSuppress: true,
                    title: '"modsettings.lsx" file was reset',
                    message: 'This usually happens when an invalid mod is installed',
                });
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
        const paks = yield readPAKList(api);
        let manifest;
        try {
            manifest = yield vortex_api_1.util.getManifest(api, '', GAME_ID);
        }
        catch (err) {
            const allowReport = !['EPERM'].includes(err.code);
            api.showErrorNotification('Failed to read deployment manifest', err, { allowReport });
            return [];
        }
        return Promise.all(paks.map((fileName) => __awaiter(this, void 0, void 0, function* () {
            return vortex_api_1.util.withErrorContext('reading pak', fileName, () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
                    const mod = (manifestEntry !== undefined)
                        ? (_a = state.persistent.mods[GAME_ID]) === null || _a === void 0 ? void 0 : _a[manifestEntry.source]
                        : undefined;
                    return { fileName, mod, info: yield extractPakInfo(path.join(modsPath(), fileName)) };
                }
                catch (err) {
                    api.showErrorNotification('Failed to read pak', err, { allowReport: true });
                    return undefined;
                }
            }));
        })));
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
function deserializeLoadOrder(api) {
    return __awaiter(this, void 0, void 0, function* () {
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
    return (React.createElement(InfoPanel, { t: api.translate, currentProfile: currentProfile, onSetPlayerProfile: onSetProfile }));
}
function main(context) {
    context.registerReducer(['settings', 'baldursgate3'], reducer);
    context.registerGame({
        id: GAME_ID,
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
    context.registerModType('bg3-replacer', 25, (gameId) => gameId === GAME_ID, () => getGameDataPath(context.api), files => isReplacer(context.api, files), { name: 'BG3 Replacer' });
    context.registerLoadOrder({
        gameId: GAME_ID,
        deserializeLoadOrder: () => deserializeLoadOrder(context.api),
        serializeLoadOrder: (loadOrder) => serializeLoadOrder(context.api, loadOrder),
        validate,
        toggleableEntries: true,
        usageInstructions: (() => (React.createElement(InfoPanelWrap, { api: context.api, refresh: () => { } }))),
    });
    context.once(() => {
        context.api.onStateChange(['session', 'base', 'toolsRunning'], (prev, current) => __awaiter(this, void 0, void 0, function* () {
            const gameMode = vortex_api_1.selectors.activeGameId(context.api.getState());
            if ((gameMode === GAME_ID) && (Object.keys(current).length === 0)) {
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
            if (((profile === null || profile === void 0 ? void 0 : profile.gameId) === GAME_ID) && (forceRefresh !== undefined)) {
                forceRefresh();
            }
            return Promise.resolve();
        });
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () {
            if (gameMode === GAME_ID) {
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
    });
    return true;
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGlEQUFzQztBQUV0QywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLHFEQUE4QztBQUM5Qyw2Q0FBMEM7QUFDMUMseUNBQXlDO0FBQ3pDLHFDQUE4QztBQUM5QywwREFBeUM7QUFDekMsMkNBQXNFO0FBQ3RFLG1DQUFxRDtBQUdyRCxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUM7QUFDL0IsTUFBTSxhQUFhLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN2QyxNQUFNLFNBQVMsR0FBRyxrQ0FBa0MsQ0FBQztBQUVyRCxTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUdELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsTUFBTSxlQUFlLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHNCQUFzQixFQUN6RCxDQUFDLE9BQWUsRUFBRSxJQUFZLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFHaEYsTUFBTSxPQUFPLEdBQXVCO0lBQ2xDLFFBQVEsRUFBRTtRQUNSLENBQUMsZ0JBQXVCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFLE9BQU8sQ0FBQztRQUM5RixDQUFDLGVBQXNCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUs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bnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEZvcm1Db250cm9sIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IGNyZWF0ZUFjdGlvbiB9IGZyb20gJ3JlZHV4LWFjdCc7XHJcbmltcG9ydCB7IGdlbmVyYXRlIGFzIHNob3J0aWQgfSBmcm9tICdzaG9ydGlkJztcclxuaW1wb3J0IHdhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElNb2ROb2RlLCBJTW9kU2V0dGluZ3MsIElQYWtJbmZvLCBJWG1sTm9kZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuY29uc3QgR0FNRV9JRCA9ICdiYWxkdXJzZ2F0ZTMnO1xyXG5jb25zdCBTVE9QX1BBVFRFUk5TID0gWydbXi9dKlxcXFwucGFrJCddO1xyXG5jb25zdCBMU0xJQl9VUkwgPSAnaHR0cHM6Ly9naXRodWIuY29tL05vcmJ5dGUvbHNsaWInO1xyXG5cclxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XHJcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XHJcbn1cclxuXHJcbi8vIGFjdGlvbnNcclxuY29uc3Qgc2V0UGxheWVyUHJvZmlsZSA9IGNyZWF0ZUFjdGlvbignQkczX1NFVF9QTEFZRVJQUk9GSUxFJywgbmFtZSA9PiBuYW1lKTtcclxuY29uc3Qgc2V0dGluZ3NXcml0dGVuID0gY3JlYXRlQWN0aW9uKCdCRzNfU0VUVElOR1NfV1JJVFRFTicsXHJcbiAgKHByb2ZpbGU6IHN0cmluZywgdGltZTogbnVtYmVyLCBjb3VudDogbnVtYmVyKSA9PiAoeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9KSk7XHJcblxyXG4vLyByZWR1Y2VyXHJcbmNvbnN0IHJlZHVjZXI6IHR5cGVzLklSZWR1Y2VyU3BlYyA9IHtcclxuICByZWR1Y2Vyczoge1xyXG4gICAgW3NldFBsYXllclByb2ZpbGUgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB1dGlsLnNldFNhZmUoc3RhdGUsIFsncGxheWVyUHJvZmlsZSddLCBwYXlsb2FkKSxcclxuICAgIFtzZXR0aW5nc1dyaXR0ZW4gYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHsgcHJvZmlsZSwgdGltZSwgY291bnQgfSA9IHBheWxvYWQ7XHJcbiAgICAgIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3NXcml0dGVuJywgcHJvZmlsZV0sIHsgdGltZSwgY291bnQgfSk7XHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgZGVmYXVsdHM6IHtcclxuICAgIHBsYXllclByb2ZpbGU6ICcnLFxyXG4gICAgc2V0dGluZ3NXcml0dGVuOiB7fSxcclxuICB9LFxyXG59O1xyXG5cclxuZnVuY3Rpb24gZG9jdW1lbnRzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnZG9jdW1lbnRzJyksICdMYXJpYW4gU3R1ZGlvcycsICdCYWxkdXJcXCdzIEdhdGUgMycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ01vZHMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvZmlsZXNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnUGxheWVyUHJvZmlsZXMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKTogYW55IHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoWycxNDU2NDYwNjY5JywgJzEwODY5NDAnXSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KTogYW55IHtcclxuICBjb25zdCBtcCA9IG1vZHNQYXRoKCk7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6ICdiZzMtdXNlcy1sc2xpYicsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICB0aXRsZTogJ0JHMyBzdXBwb3J0IHVzZXMgTFNMaWInLFxyXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcclxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkgYXMgYW55KVxyXG4gICAgICAudGhlbigoKSA9PiBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdFYXJseSBBY2Nlc3MgR2FtZScsIHtcclxuICAgICAgICBiYmNvZGU6ICdCYWxkdXJcXCdzIEdhdGUgMyBpcyBjdXJyZW50bHkgaW4gRWFybHkgQWNjZXNzLiBJdCBkb2VzblxcJ3Qgb2ZmaWNpYWxseSAnXHJcbiAgICAgICAgICAgICsgJ3N1cHBvcnQgbW9kZGluZywgZG9lc25cXCd0IGluY2x1ZGUgYW55IG1vZGRpbmcgdG9vbHMgYW5kIHdpbGwgcmVjZWl2ZSAnXHJcbiAgICAgICAgICAgICsgJ2ZyZXF1ZW50IHVwZGF0ZXMuPGJyLz4nXHJcbiAgICAgICAgICAgICsgJ01vZHMgbWF5IGJlY29tZSBpbmNvbXBhdGlibGUgd2l0aGluIGRheXMgb2YgYmVpbmcgcmVsZWFzZWQsIGdlbmVyYWxseSAnXHJcbiAgICAgICAgICAgICsgJ25vdCB3b3JrIGFuZC9vciBicmVhayB1bnJlbGF0ZWQgdGhpbmdzIHdpdGhpbiB0aGUgZ2FtZS48YnIvPjxici8+J1xyXG4gICAgICAgICAgICArICdbY29sb3I9XCJyZWRcIl1QbGVhc2UgZG9uXFwndCByZXBvcnQgaXNzdWVzIHRoYXQgaGFwcGVuIGluIGNvbm5lY3Rpb24gd2l0aCBtb2RzIHRvIHRoZSAnXHJcbiAgICAgICAgICAgICsgJ2dhbWUgZGV2ZWxvcGVycyAoTGFyaWFuIFN0dWRpb3MpIG9yIHRocm91Z2ggdGhlIFZvcnRleCBmZWVkYmFjayBzeXN0ZW0uWy9jb2xvcl0nLFxyXG4gICAgICB9LCBbIHsgbGFiZWw6ICdJIHVuZGVyc3RhbmQnIH0gXSkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0R2FtZURhdGFQYXRoKGFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICBjb25zdCBnYW1lUGF0aCA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aDtcclxuICBpZiAoZ2FtZVBhdGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihnYW1lUGF0aCwgJ0RhdGEnKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IE9SSUdJTkFMX0ZJTEVTID0gbmV3IFNldChbXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdhc3NldHMucGFrJyxcclxuICAnZWZmZWN0cy5wYWsnLFxyXG4gICdlbmdpbmUucGFrJyxcclxuICAnZW5naW5lc2hhZGVycy5wYWsnLFxyXG4gICdnYW1lLnBhaycsXHJcbiAgJ2dhbWVwbGF0Zm9ybS5wYWsnLFxyXG4gICdndXN0YXYucGFrJyxcclxuICAnZ3VzdGF2X3RleHR1cmVzLnBhaycsXHJcbiAgJ2ljb25zLnBhaycsXHJcbiAgJ2xvd3RleC5wYWsnLFxyXG4gICdtYXRlcmlhbHMucGFrJyxcclxuICAnbWluaW1hcHMucGFrJyxcclxuICAnbW9kZWxzLnBhaycsXHJcbiAgJ3NoYXJlZC5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZGJhbmtzLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kcy5wYWsnLFxyXG4gICd0ZXh0dXJlcy5wYWsnLFxyXG4gICd2aXJ0dWFsdGV4dHVyZXMucGFrJyxcclxuXSk7XHJcblxyXG5mdW5jdGlvbiBpc1JlcGxhY2VyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XHJcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xyXG5cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpKTtcclxuXHJcbiAgaWYgKChvcmlnRmlsZSAhPT0gdW5kZWZpbmVkKSB8fCAocGFrcy5sZW5ndGggPT09IDApKSB7XHJcbiAgICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ01vZCBsb29rcyBsaWtlIGEgcmVwbGFjZXInLCB7XHJcbiAgICAgIGJiY29kZTogJ1RoZSBtb2QgeW91IGp1c3QgaW5zdGFsbGVkIGxvb2tzIGxpa2UgYSBcInJlcGxhY2VyXCIsIG1lYW5pbmcgaXQgaXMgaW50ZW5kZWQgdG8gcmVwbGFjZSAnXHJcbiAgICAgICAgICArICdvbmUgb2YgdGhlIGZpbGVzIHNoaXBwZWQgd2l0aCB0aGUgZ2FtZS48YnIvPidcclxuICAgICAgICAgICsgJ1lvdSBzaG91bGQgYmUgYXdhcmUgdGhhdCBzdWNoIGEgcmVwbGFjZXIgaW5jbHVkZXMgYSBjb3B5IG9mIHNvbWUgZ2FtZSBkYXRhIGZyb20gYSAnXHJcbiAgICAgICAgICArICdzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBnYW1lIGFuZCBtYXkgdGhlcmVmb3JlIGJyZWFrIGFzIHNvb24gYXMgdGhlIGdhbWUgZ2V0cyB1cGRhdGVkLjxici8+J1xyXG4gICAgICAgICAgKyAnRXZlbiBpZiBkb2VzblxcJ3QgYnJlYWssIGl0IG1heSByZXZlcnQgYnVnZml4ZXMgdGhhdCB0aGUgZ2FtZSAnXHJcbiAgICAgICAgICArICdkZXZlbG9wZXJzIGhhdmUgbWFkZS48YnIvPjxici8+J1xyXG4gICAgICAgICAgKyAnVGhlcmVmb3JlIFtjb2xvcj1cInJlZFwiXXBsZWFzZSB0YWtlIGV4dHJhIGNhcmUgdG8ga2VlcCB0aGlzIG1vZCB1cGRhdGVkWy9jb2xvcl0gYW5kIHJlbW92ZSBpdCB3aGVuIGl0ICdcclxuICAgICAgICAgICsgJ25vIGxvbmdlciBtYXRjaGVzIHRoZSBnYW1lIHZlcnNpb24uJyxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgTW9kICh3aWxsIGxpa2VseSBub3Qgd29yayknIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdJbnN0YWxsIGFzIFJlcGxhY2VyJyB9LFxyXG4gICAgXSkudGhlbihyZXN1bHQgPT4gcmVzdWx0LmFjdGlvbiA9PT0gJ0luc3RhbGwgYXMgUmVwbGFjZXInKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZmFsc2UpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJlcGxhY2VyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQ6IHBha3MubGVuZ3RoID09PSAwLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSZXBsYWNlcihmaWxlczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIDogQmx1ZWJpcmQ8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBjb25zdCBkaXJlY3RvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChmaWxlcy5tYXAoZmlsZSA9PiBwYXRoLmRpcm5hbWUoZmlsZSkudG9VcHBlckNhc2UoKSkpKTtcclxuICBsZXQgZGF0YVBhdGg6IHN0cmluZyA9IGRpcmVjdG9yaWVzLmZpbmQoZGlyID0+IHBhdGguYmFzZW5hbWUoZGlyKSA9PT0gJ0RBVEEnKTtcclxuICBpZiAoZGF0YVBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3QgZ2VuT3JQdWJsaWMgPSBkaXJlY3Rvcmllc1xyXG4gICAgICAuZmluZChkaXIgPT4gWydQVUJMSUMnLCAnR0VORVJBVEVEJ10uaW5jbHVkZXMocGF0aC5iYXNlbmFtZShkaXIpKSk7XHJcbiAgICBpZiAoZ2VuT3JQdWJsaWMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRhUGF0aCA9IHBhdGguZGlybmFtZShnZW5PclB1YmxpYyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gKGRhdGFQYXRoICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IGZpbGVzLnJlZHVjZSgocHJldjogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRhdGFQYXRoLCBmaWxlUGF0aCk7XHJcbiAgICAgIGlmICghcmVsUGF0aC5zdGFydHNXaXRoKCcuLicpKSB7XHJcbiAgICAgICAgcHJldi5wdXNoKHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcmVsUGF0aCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sIFtdKVxyXG4gICAgOiBmaWxlcy5tYXAoKGZpbGVQYXRoOiBzdHJpbmcpOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPT4gKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGgsXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgaW5zdHJ1Y3Rpb25zLFxyXG4gIH0pO1xyXG59XHJcblxyXG5jb25zdCBnZXRQbGF5ZXJQcm9maWxlcyA9ICgoKSA9PiB7XHJcbiAgbGV0IGNhY2hlZCA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBjYWNoZWQgPSAoZnMgYXMgYW55KS5yZWFkZGlyU3luYyhwcm9maWxlc1BhdGgoKSlcclxuICAgICAgICAuZmlsdGVyKG5hbWUgPT4gKHBhdGguZXh0bmFtZShuYW1lKSA9PT0gJycpICYmIChuYW1lICE9PSAnRGVmYXVsdCcpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gKCkgPT4gY2FjaGVkO1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzKSB7XHJcbiAgY29uc3QgeyB0LCBjdXJyZW50UHJvZmlsZSwgb25TZXRQbGF5ZXJQcm9maWxlIH0gPSBwcm9wcztcclxuXHJcbiAgY29uc3Qgb25TZWxlY3QgPSBSZWFjdC51c2VDYWxsYmFjaygoZXYpID0+IHtcclxuICAgIG9uU2V0UGxheWVyUHJvZmlsZShldi5jdXJyZW50VGFyZ2V0LnZhbHVlKTtcclxuICB9LCBbb25TZXRQbGF5ZXJQcm9maWxlXSk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIHBhZGRpbmc6ICcxNnB4JyB9fT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cclxuICAgICAgICB7dCgnSW5nYW1lIFByb2ZpbGU6ICcpfVxyXG4gICAgICAgIDxGb3JtQ29udHJvbFxyXG4gICAgICAgICAgY29tcG9uZW50Q2xhc3M9J3NlbGVjdCdcclxuICAgICAgICAgIG5hbWU9J3VzZXJQcm9maWxlJ1xyXG4gICAgICAgICAgY2xhc3NOYW1lPSdmb3JtLWNvbnRyb2wnXHJcbiAgICAgICAgICB2YWx1ZT17Y3VycmVudFByb2ZpbGV9XHJcbiAgICAgICAgICBvbkNoYW5nZT17b25TZWxlY3R9XHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPG9wdGlvbiBrZXk9JycgdmFsdWU9Jyc+e3QoJ1BsZWFzZSBzZWxlY3Qgb25lJyl9PC9vcHRpb24+XHJcbiAgICAgICAgICB7Z2V0UGxheWVyUHJvZmlsZXMoKS5tYXAocHJvZiA9PiAoPG9wdGlvbiBrZXk9e3Byb2Z9IHZhbHVlPXtwcm9mfT57cHJvZn08L29wdGlvbj4pKX1cclxuICAgICAgICA8L0Zvcm1Db250cm9sPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGhyLz5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnUGxlYXNlIHJlZmVyIHRvIG1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyB0byBkZXRlcm1pbmUgdGhlIHJpZ2h0IG9yZGVyLiAnXHJcbiAgICAgICAgICArICdJZiB5b3UgY2FuXFwndCBmaW5kIGFueSBzdWdnZXN0aW9ucyBmb3IgYSBtb2QsIGl0IHByb2JhYmx5IGRvZXNuXFwndCBtYXR0ZXIuJyl9XHJcbiAgICAgICAgPGhyLz5cclxuICAgICAgICB7dCgnU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBlbmdpbmUgJ1xyXG4gICAgICAgICAgKyAnYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGxvYWQtb3JkZXJlZCBieSBtb2QgbWFuYWdlcnMuIElmIHlvdSB3YW50IHRvIGRpc2FibGUgJ1xyXG4gICAgICAgICAgKyAnc3VjaCBhIG1vZCwgcGxlYXNlIGRvIHNvIG9uIHRoZSBcIk1vZHNcIiBzY3JlZW4uJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0pIHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcblxyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ2JnMy1uby1wcm9maWxlLXNlbGVjdGVkJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZTogJ05vIHByb2ZpbGUgc2VsZWN0ZWQnLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHNlbGVjdCB0aGUgaW4tZ2FtZSBwcm9maWxlIHRvIG1vZCBvbiB0aGUgXCJMb2FkIE9yZGVyXCIgcGFnZScsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1uby1wcm9maWxlLXNlbGVjdGVkJyk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG5cclxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gICAgY29uc3Qgcm9vdCA9IGZpbmROb2RlKHJlZ2lvbj8ubm9kZSwgJ3Jvb3QnKTtcclxuICAgIGNvbnN0IG1vZHNOb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcclxuICAgIGNvbnN0IGxvTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpID8/IHsgY2hpbGRyZW46IFtdIH07XHJcbiAgICBpZiAoKGxvTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKGxvTm9kZS5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcclxuICAgICAgbG9Ob2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XHJcbiAgICB9XHJcbiAgICAvLyBkcm9wIGFsbCBub2RlcyBleGNlcHQgZm9yIHRoZSBnYW1lIGVudHJ5XHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbk5vZGVzID0gbW9kc05vZGU/LmNoaWxkcmVuPy5bMF0/Lm5vZGU/LmZpbHRlcj8uKGl0ZXIgPT5cclxuICAgICAgaXRlci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gJ0d1c3RhdicpKSkgPz8gW107XHJcblxyXG4gICAgY29uc3QgZW5hYmxlZFBha3MgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gISFsb2FkT3JkZXJba2V5XS5kYXRhPy51dWlkXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgbG9hZE9yZGVyW2tleV0uZW5hYmxlZFxyXG4gICAgICAgICAgICAgICAgICAgICYmICFsb2FkT3JkZXJba2V5XS5kYXRhPy5pc0xpc3RlZCk7XHJcblxyXG4gICAgLy8gYWRkIG5ldyBub2RlcyBmb3IgdGhlIGVuYWJsZWQgbW9kc1xyXG4gICAgZm9yIChjb25zdCBrZXkgb2YgZW5hYmxlZFBha3MpIHtcclxuICAgICAgLy8gY29uc3QgbWQ1ID0gYXdhaXQgdXRpbC5maWxlTUQ1KHBhdGguam9pbihtb2RzUGF0aCgpLCBrZXkpKTtcclxuICAgICAgZGVzY3JpcHRpb25Ob2Rlcy5wdXNoKHtcclxuICAgICAgICAkOiB7IGlkOiAnTW9kdWxlU2hvcnREZXNjJyB9LFxyXG4gICAgICAgIGF0dHJpYnV0ZTogW1xyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnRm9sZGVyJywgdHlwZTogJ0xTV1N0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLmZvbGRlciB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdNRDUnLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5tZDUgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm5hbWUgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnV1aWQgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVmVyc2lvbicsIHR5cGU6ICdpbnQzMicsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnZlcnNpb24gfSB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxvYWRPcmRlck5vZGVzID0gZW5hYmxlZFBha3NcclxuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBsb2FkT3JkZXJbbGhzXS5wb3MgLSBsb2FkT3JkZXJbcmhzXS5wb3MpXHJcbiAgICAgIC5tYXAoKGtleTogc3RyaW5nKTogSU1vZE5vZGUgPT4gKHtcclxuICAgICAgICAkOiB7IGlkOiAnTW9kdWxlJyB9LFxyXG4gICAgICAgIGF0dHJpYnV0ZTogW1xyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnV1aWQgfSB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICBtb2RzTm9kZS5jaGlsZHJlblswXS5ub2RlID0gZGVzY3JpcHRpb25Ob2RlcztcclxuICAgIGxvTm9kZS5jaGlsZHJlblswXS5ub2RlID0gbG9hZE9yZGVyTm9kZXM7XHJcblxyXG4gICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzKTtcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXR0aW5nc1dyaXR0ZW4oYmczcHJvZmlsZSwgRGF0ZS5ub3coKSwgZW5hYmxlZFBha3MubGVuZ3RoKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbnR5cGUgRGl2aW5lQWN0aW9uID0gJ2NyZWF0ZS1wYWNrYWdlJyB8ICdsaXN0LXBhY2thZ2UnIHwgJ2V4dHJhY3Qtc2luZ2xlLWZpbGUnXHJcbiAgICAgICAgICAgICAgICAgIHwgJ2V4dHJhY3QtcGFja2FnZScgfCAnZXh0cmFjdC1wYWNrYWdlcycgfCAnY29udmVydC1tb2RlbCdcclxuICAgICAgICAgICAgICAgICAgfCAnY29udmVydC1tb2RlbHMnIHwgJ2NvbnZlcnQtcmVzb3VyY2UnIHwgJ2NvbnZlcnQtcmVzb3VyY2VzJztcclxuXHJcbmludGVyZmFjZSBJRGl2aW5lT3B0aW9ucyB7XHJcbiAgc291cmNlOiBzdHJpbmc7XHJcbiAgZGVzdGluYXRpb24/OiBzdHJpbmc7XHJcbiAgZXhwcmVzc2lvbj86IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIElEaXZpbmVPdXRwdXQge1xyXG4gIHN0ZG91dDogc3RyaW5nO1xyXG4gIHJldHVybkNvZGU6IG51bWJlcjtcclxufVxyXG5cclxuZnVuY3Rpb24gZGl2aW5lKGFjdGlvbjogRGl2aW5lQWN0aW9uLCBvcHRpb25zOiBJRGl2aW5lT3B0aW9ucyk6IFByb21pc2U8SURpdmluZU91dHB1dD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRGl2aW5lT3V0cHV0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBsZXQgcmV0dXJuZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIGxldCBzdGRvdXQ6IHN0cmluZyA9ICcnO1xyXG5cclxuICAgIGNvbnN0IGV4ZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICd0b29scycsICdkaXZpbmUuZXhlJyk7XHJcbiAgICBjb25zdCBhcmdzID0gW1xyXG4gICAgICAnLS1hY3Rpb24nLCBhY3Rpb24sXHJcbiAgICAgICctLXNvdXJjZScsIG9wdGlvbnMuc291cmNlLFxyXG4gICAgICAnLS1sb2dsZXZlbCcsICdvZmYnLFxyXG4gICAgICAnLS1nYW1lJywgJ2JnMycsXHJcbiAgICBdO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmRlc3RpbmF0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWRlc3RpbmF0aW9uJywgb3B0aW9ucy5kZXN0aW5hdGlvbik7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0aW9ucy5leHByZXNzaW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWV4cHJlc3Npb24nLCBvcHRpb25zLmV4cHJlc3Npb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHByb2MgPSBzcGF3bihleGUsIGFyZ3MsIHsgY3dkOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAndG9vbHMnKSB9KTtcclxuXHJcbiAgICBwcm9jLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4gc3Rkb3V0ICs9IGRhdGEpO1xyXG4gICAgcHJvYy5zdGRlcnIub24oJ2RhdGEnLCBkYXRhID0+IGxvZygnd2FybicsIGRhdGEpKTtcclxuXHJcbiAgICBwcm9jLm9uKCdlcnJvcicsIChlcnJJbjogRXJyb3IpID0+IHtcclxuICAgICAgaWYgKCFyZXR1cm5lZCkge1xyXG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ2RpdmluZS5leGUgZmFpbGVkOiAnICsgZXJySW4ubWVzc2FnZSk7XHJcbiAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBwcm9jLm9uKCdleGl0JywgKGNvZGU6IG51bWJlcikgPT4ge1xyXG4gICAgICBpZiAoIXJldHVybmVkKSB7XHJcbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICByZXNvbHZlKHsgc3Rkb3V0LCByZXR1cm5Db2RlOiAwIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBkaXZpbmUuZXhlIHJldHVybnMgdGhlIGFjdHVhbCBlcnJvciBjb2RlICsgMTAwIGlmIGEgZmF0YWwgZXJyb3Igb2NjdXJlZFxyXG4gICAgICAgICAgaWYgKGNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgY29kZSAtPSAxMDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoYGRpdmluZS5leGUgZmFpbGVkOiAke2NvZGV9YCk7XHJcbiAgICAgICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xyXG4gICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBhayhwYWtQYXRoLCBkZXN0UGF0aCwgcGF0dGVybikge1xyXG4gIHJldHVybiBkaXZpbmUoJ2V4dHJhY3QtcGFja2FnZScsIHsgc291cmNlOiBwYWtQYXRoLCBkZXN0aW5hdGlvbjogZGVzdFBhdGgsIGV4cHJlc3Npb246IHBhdHRlcm4gfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RNZXRhKHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgY29uc3QgbWV0YVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdsc21ldGEnLCBzaG9ydGlkKCkpO1xyXG4gIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKG1ldGFQYXRoKTtcclxuICBhd2FpdCBleHRyYWN0UGFrKHBha1BhdGgsIG1ldGFQYXRoLCAnKi9tZXRhLmxzeCcpO1xyXG4gIHRyeSB7XHJcbiAgICAvLyB0aGUgbWV0YS5sc3ggbWF5IGJlIGluIGEgc3ViZGlyZWN0b3J5LiBUaGVyZSBpcyBwcm9iYWJseSBhIHBhdHRlcm4gaGVyZVxyXG4gICAgLy8gYnV0IHdlJ2xsIGp1c3QgdXNlIGl0IGZyb20gd2hlcmV2ZXJcclxuICAgIGxldCBtZXRhTFNYUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKG1ldGFQYXRoLCAnbWV0YS5sc3gnKTtcclxuICAgIGF3YWl0IHdhbGsobWV0YVBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgICBjb25zdCB0ZW1wID0gZW50cmllcy5maW5kKGUgPT4gcGF0aC5iYXNlbmFtZShlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcclxuICAgICAgaWYgKHRlbXAgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIG1ldGFMU1hQYXRoID0gdGVtcC5maWxlUGF0aDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1ldGFMU1hQYXRoKTtcclxuICAgIGNvbnN0IG1ldGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1ldGFQYXRoKTtcclxuICAgIHJldHVybiBtZXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kTm9kZTxUIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nIH0+LCBVPihub2RlczogVFtdLCBpZDogc3RyaW5nKTogVCB7XHJcbiAgcmV0dXJuIG5vZGVzPy5maW5kKGl0ZXIgPT4gaXRlci4kLmlkID09PSBpZCkgPz8gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5jb25zdCBsaXN0Q2FjaGU6IHsgW3BhdGg6IHN0cmluZ106IFByb21pc2U8c3RyaW5nW10+IH0gPSB7fTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxpc3RQYWNrYWdlKHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBkaXZpbmUoJ2xpc3QtcGFja2FnZScsIHsgc291cmNlOiBwYWtQYXRoIH0pO1xyXG4gIGNvbnN0IGxpbmVzID0gcmVzLnN0ZG91dC5zcGxpdCgnXFxuJykubWFwKGxpbmUgPT4gbGluZS50cmltKCkpLmZpbHRlcihsaW5lID0+IGxpbmUubGVuZ3RoICE9PSAwKTtcclxuXHJcbiAgcmV0dXJuIGxpbmVzO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpc0xPTGlzdGVkKHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIGlmIChsaXN0Q2FjaGVbcGFrUGF0aF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbGlzdENhY2hlW3Bha1BhdGhdID0gbGlzdFBhY2thZ2UocGFrUGF0aCk7XHJcbiAgfVxyXG4gIGNvbnN0IGxpbmVzID0gYXdhaXQgbGlzdENhY2hlW3Bha1BhdGhdO1xyXG4gIC8vIGNvbnN0IG5vbkdVSSA9IGxpbmVzLmZpbmQobGluZSA9PiAhbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKTtcclxuICBjb25zdCBtZXRhTFNYID0gbGluZXMuZmluZChsaW5lID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcclxuICByZXR1cm4gbWV0YUxTWCA9PT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mbyhwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElQYWtJbmZvPiB7XHJcbiAgY29uc3QgbWV0YSA9IGF3YWl0IGV4dHJhY3RNZXRhKHBha1BhdGgpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XHJcblxyXG4gIGNvbnN0IGF0dHIgPSAobmFtZTogc3RyaW5nLCBmYWxsYmFjazogKCkgPT4gYW55KSA9PlxyXG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcclxuXHJcbiAgY29uc3QgZ2VuTmFtZSA9IHBhdGguYmFzZW5hbWUocGFrUGF0aCwgcGF0aC5leHRuYW1lKHBha1BhdGgpKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcclxuICAgIGRlc2NyaXB0aW9uOiBhdHRyKCdEZXNjcmlwdGlvbicsICgpID0+ICdNaXNzaW5nJyksXHJcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXHJcbiAgICBuYW1lOiBhdHRyKCdOYW1lJywgKCkgPT4gZ2VuTmFtZSksXHJcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxyXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcclxuICAgIHZlcnNpb246IGF0dHIoJ1ZlcnNpb24nLCAoKSA9PiAnMScpLFxyXG4gICAgaXNMaXN0ZWQ6IGF3YWl0IGlzTE9MaXN0ZWQocGFrUGF0aCksXHJcbiAgfTtcclxufVxyXG5cclxuY29uc3QgZmFsbGJhY2tQaWN0dXJlID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2dhbWVhcnQuanBnJyk7XHJcblxyXG5sZXQgc3RvcmVkTE86IGFueVtdO1xyXG5cclxuZnVuY3Rpb24gcGFyc2VNb2ROb2RlKG5vZGU6IElNb2ROb2RlKSB7XHJcbiAgY29uc3QgbmFtZSA9IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnTmFtZScpLiQudmFsdWU7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBuYW1lLFxyXG4gICAgbmFtZSxcclxuICAgIGRhdGE6IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQudmFsdWUsXHJcbiAgfTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZE1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBsZXQgYmczcHJvZmlsZTogc3RyaW5nID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlO1xyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSBnZXRQbGF5ZXJQcm9maWxlcygpO1xyXG4gICAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBzdG9yZWRMTyA9IFtdO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBiZzNwcm9maWxlID0gZ2V0UGxheWVyUHJvZmlsZXMoKVswXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2V0dGluZ3NQYXRoKTtcclxuICByZXR1cm4gcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHdyaXRlTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkYXRhOiBJTW9kU2V0dGluZ3MpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBsZXQgYmczcHJvZmlsZTogc3RyaW5nID0gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlO1xyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSBnZXRQbGF5ZXJQcm9maWxlcygpO1xyXG4gICAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBzdG9yZWRMTyA9IFtdO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBiZzNwcm9maWxlID0gZ2V0UGxheWVyUHJvZmlsZXMoKVswXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcclxuICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGRhdGEpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShzZXR0aW5nc1BhdGgpKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHNldHRpbmdzUGF0aCwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHN0b3JlZExPID0gW107XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBzZXR0aW5ncycsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRTdG9yZWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcbiAgY29uc3QgbW9kc1Jvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xyXG4gIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuXHJcbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcclxuXHJcbiAgLy8gcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAobW9kTm9kZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICBjb25zdCBsYXN0V3JpdGUgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnNldHRpbmdzV3JpdHRlbj8uW2JnM3Byb2ZpbGVdO1xyXG4gICAgaWYgKChsYXN0V3JpdGUgIT09IHVuZGVmaW5lZCkgJiYgKGxhc3RXcml0ZS5jb3VudCA+IDEpKSB7XHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICBpZDogJ2JnMy1tb2RzZXR0aW5ncy1yZXNldCcsXHJcbiAgICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICAgICAgdGl0bGU6ICdcIm1vZHNldHRpbmdzLmxzeFwiIGZpbGUgd2FzIHJlc2V0JyxcclxuICAgICAgICBtZXNzYWdlOiAnVGhpcyB1c3VhbGx5IGhhcHBlbnMgd2hlbiBhbiBpbnZhbGlkIG1vZCBpcyBpbnN0YWxsZWQnLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHN0b3JlZExPID0gbW9kTm9kZXNcclxuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXHJcbiAgICAvLyBHdXN0YXYgaXMgdGhlIGNvcmUgZ2FtZVxyXG4gICAgLmZpbHRlcihlbnRyeSA9PiBlbnRyeS5pZCA9PT0gJ0d1c3RhdicpXHJcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBtb2RPcmRlclxyXG4gICAgICAuZmluZEluZGV4KGkgPT4gaSA9PT0gbGhzLmRhdGEpIC0gbW9kT3JkZXIuZmluZEluZGV4KGkgPT4gaSA9PT0gcmhzLmRhdGEpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS0xpc3QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xyXG4gIHRyeSB7XHJcbiAgICBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgIC5maWx0ZXIoZmlsZU5hbWUgPT4gcGF0aC5leHRuYW1lKGZpbGVOYW1lKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKCksICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIG5vcFxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzIGRpcmVjdG9yeScsIGVyciwge1xyXG4gICAgICAgIGlkOiAnYmczLWZhaWxlZC1yZWFkLW1vZHMnLFxyXG4gICAgICAgIG1lc3NhZ2U6IG1vZHNQYXRoKCksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcGFrcyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBha3M7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRQQUtzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSlcclxuICAgIDogUHJvbWlzZTxBcnJheTx7IGZpbGVOYW1lOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCwgaW5mbzogSVBha0luZm8gfT4+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG5cclxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS0xpc3QoYXBpKTtcclxuXHJcbiAgbGV0IG1hbmlmZXN0O1xyXG4gIHRyeSB7XHJcbiAgICBtYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCAnJywgR0FNRV9JRCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgZGVwbG95bWVudCBtYW5pZmVzdCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLmFsbChwYWtzLm1hcChhc3luYyBmaWxlTmFtZSA9PiB7XHJcbiAgICByZXR1cm4gKHV0aWwgYXMgYW55KS53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IG1hbmlmZXN0LmZpbGVzLmZpbmQoZW50cnkgPT4gZW50cnkucmVsUGF0aCA9PT0gZmlsZU5hbWUpO1xyXG4gICAgICAgIGNvbnN0IG1vZCA9IChtYW5pZmVzdEVudHJ5ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXT8uW21hbmlmZXN0RW50cnkuc291cmNlXVxyXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIHJldHVybiB7IGZpbGVOYW1lLCBtb2QsIGluZm86IGF3YWl0IGV4dHJhY3RQYWtJbmZvKHBhdGguam9pbihtb2RzUGF0aCgpLCBmaWxlTmFtZSkpIH07XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhaycsIGVyciwgeyBhbGxvd1JlcG9ydDogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICAgIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgICByZXR1cm4gbW9kT3JkZXJOb2Rlcy5tYXAobm9kZSA9PiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kPy52YWx1ZSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzZXR0aW5ncy5sc3gnLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvcmRlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gIHJldHVybiB3cml0ZUxvYWRPcmRlcihhcGksIG9yZGVyKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZGVzZXJpYWxpemVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxhbnk+IHtcclxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS3MoYXBpKTtcclxuXHJcbiAgY29uc3Qgb3JkZXIgPSBhd2FpdCByZWFkTE8oYXBpKTtcclxuXHJcbiAgY29uc3Qgb3JkZXJWYWx1ZSA9IChpbmZvOiBJUGFrSW5mbykgPT4ge1xyXG4gICAgcmV0dXJuIG9yZGVyLmluZGV4T2YoaW5mby51dWlkKSArIChpbmZvLmlzTGlzdGVkID8gMCA6IDEwMDApO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBwYWtzXHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG9yZGVyVmFsdWUobGhzLmluZm8pIC0gb3JkZXJWYWx1ZShyaHMuaW5mbykpXHJcbiAgICAubWFwKCh7IGZpbGVOYW1lLCBtb2QsIGluZm8gfSkgPT4gKHtcclxuICAgICAgaWQ6IGZpbGVOYW1lLFxyXG4gICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICBuYW1lOiB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSxcclxuICAgICAgbW9kSWQ6IG1vZD8uaWQsXHJcbiAgICAgIGxvY2tlZDogaW5mby5pc0xpc3RlZCxcclxuICAgICAgZGF0YTogaW5mbyxcclxuICAgIH0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdmFsaWRhdGUoYmVmb3JlLCBhZnRlcik6IFByb21pc2U8YW55PiB7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59XHJcblxyXG5sZXQgZm9yY2VSZWZyZXNoOiAoKSA9PiB2b2lkO1xyXG5cclxuZnVuY3Rpb24gSW5mb1BhbmVsV3JhcChwcm9wczogeyBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHJlZnJlc2g6ICgpID0+IHZvaWQgfSkge1xyXG4gIGNvbnN0IHsgYXBpIH0gPSBwcm9wcztcclxuXHJcbiAgY29uc3QgY3VycmVudFByb2ZpbGUgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT5cclxuICAgIHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXT8ucGxheWVyUHJvZmlsZSk7XHJcblxyXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBmb3JjZVJlZnJlc2ggPSBwcm9wcy5yZWZyZXNoO1xyXG4gIH0sIFtdKTtcclxuXHJcbiAgY29uc3Qgb25TZXRQcm9maWxlID0gUmVhY3QudXNlQ2FsbGJhY2soKHByb2ZpbGVOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IGltcGwgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGVOYW1lKSk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZm9yY2VSZWZyZXNoPy4oKTtcclxuICAgIH07XHJcbiAgICBpbXBsKCk7XHJcbiAgfSwgWyBhcGkgXSk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8SW5mb1BhbmVsXHJcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XHJcbiAgICAgIGN1cnJlbnRQcm9maWxlPXtjdXJyZW50UHJvZmlsZX1cclxuICAgICAgb25TZXRQbGF5ZXJQcm9maWxlPXtvblNldFByb2ZpbGV9XHJcbiAgICAvPlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMyddLCByZWR1Y2VyKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ2V4ZXZ1bGthbicsXHJcbiAgICAgICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIChWdWxrYW4pJyxcclxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnMy5leGUnLFxyXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgICAgICdiaW4vYmczLmV4ZScsXHJcbiAgICAgICAgXSxcclxuICAgICAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczX2R4MTEuZXhlJyxcclxuICAgIHNldHVwOiBkaXNjb3ZlcnkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMTA4Njk0MCcsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiAxMDg2OTQwLFxyXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogW1xyXG4gICAgICAgICdpbmZvLmpzb24nLFxyXG4gICAgICBdLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IFtcclxuICAgICAgICAnaW5mby5qc29uJyxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1yZXBsYWNlcicsIDI1LCB0ZXN0UmVwbGFjZXIsIGluc3RhbGxSZXBsYWNlcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdiZzMtcmVwbGFjZXInLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSwgZmlsZXMgPT4gaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgZmlsZXMpLFxyXG4gICAgeyBuYW1lOiAnQkczIFJlcGxhY2VyJyB9IGFzIGFueSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpKSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogdHJ1ZSxcclxuICAgIHVzYWdlSW5zdHJ1Y3Rpb25zOiAoKCkgPT4gKDxJbmZvUGFuZWxXcmFwIGFwaT17Y29udGV4dC5hcGl9IHJlZnJlc2g9eygpID0+IHt9fSAvPikpIGFzIGFueSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXNzaW9uJywgJ2Jhc2UnLCAndG9vbHNSdW5uaW5nJ10sXHJcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXHJcbiAgICAgICAgLy8gY2hhbmdlZFxyXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKChwcm9maWxlPy5nYW1lSWQgPT09IEdBTUVfSUQpICYmIChmb3JjZVJlZnJlc2ggIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICBmb3JjZVJlZnJlc2goKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIGFzeW5jIChnYW1lTW9kZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lTW9kZSA9PT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oY29udGV4dC5hcGkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxyXG4gICAgICAgICAgICAnRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcclxuIl19