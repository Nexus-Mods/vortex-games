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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
        const proc = child_process_1.spawn(exe, args, { cwd: path.join(__dirname, 'tools') });
        proc.stdout.on('data', data => stdout += data);
        proc.stderr.on('data', data => vortex_api_1.log('warn', data));
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
        const metaPath = path.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', shortid_1.generate());
        yield vortex_api_1.fs.ensureDirAsync(metaPath);
        yield extractPak(pakPath, metaPath, '*/meta.lsx');
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
        return xml2js_1.parseStringPromise(dat);
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
        yield vortex_api_1.fs.writeFileAsync(settingsPath, xml);
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
function makePreSort(api) {
    return (items, sortDir, updateType) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        if ((items.length === 0) && (storedLO !== undefined)) {
            return storedLO;
        }
        const state = api.getState();
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
        let manifest;
        try {
            manifest = yield vortex_api_1.util.getManifest(api, '', GAME_ID);
        }
        catch (err) {
            const allowReport = !['EPERM'].includes(err.code);
            api.showErrorNotification('Failed to read deployment manifest', err, { allowReport });
            return items;
        }
        const result = [];
        for (const fileName of paks) {
            yield vortex_api_1.util.withErrorContext('reading pak', fileName, () => __awaiter(this, void 0, void 0, function* () {
                var _g, _h, _j;
                try {
                    const existingItem = items.find(iter => iter.id === fileName);
                    if ((existingItem !== undefined)
                        && (updateType !== 'refresh')
                        && (existingItem.imgUrl !== undefined)) {
                        result.push(existingItem);
                        return;
                    }
                    const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
                    const mod = manifestEntry !== undefined
                        ? (_g = state.persistent.mods[GAME_ID]) === null || _g === void 0 ? void 0 : _g[manifestEntry.source] : undefined;
                    let modInfo = existingItem === null || existingItem === void 0 ? void 0 : existingItem.data;
                    if (modInfo === undefined) {
                        modInfo = yield extractPakInfo(path.join(modsPath(), fileName));
                    }
                    let res;
                    if (mod !== undefined) {
                        res = {
                            id: fileName,
                            name: vortex_api_1.util.renderModName(mod),
                            imgUrl: (_j = (_h = mod.attributes) === null || _h === void 0 ? void 0 : _h.pictureUrl) !== null && _j !== void 0 ? _j : fallbackPicture,
                            data: modInfo,
                            external: false,
                        };
                    }
                    else {
                        res = {
                            id: fileName,
                            name: path.basename(fileName, path.extname(fileName)),
                            imgUrl: fallbackPicture,
                            data: modInfo,
                            external: true,
                        };
                    }
                    if (modInfo.isListed) {
                        res.locked = true;
                        result.unshift(res);
                    }
                    else {
                        result.push(res);
                    }
                }
                catch (err) {
                    api.showErrorNotification('Failed to read pak', err, { allowReport: true });
                }
            }));
        }
        try {
            const modSettings = yield readModSettings(api);
            const config = findNode((_a = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
            const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
            const modOrderRoot = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModOrder');
            const modOrderNodes = (_f = (_e = (_d = modOrderRoot === null || modOrderRoot === void 0 ? void 0 : modOrderRoot.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node) !== null && _f !== void 0 ? _f : [];
            const modOrder = modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
            storedLO = (updateType !== 'refresh')
                ? result.sort((lhs, rhs) => items.indexOf(lhs) - items.indexOf(rhs))
                : result.sort((lhs, rhs) => {
                    const lhsIdx = modOrder.findIndex(i => i === lhs.data.uuid);
                    const rhsIdx = modOrder.findIndex(i => i === rhs.data.uuid);
                    return lhsIdx - rhsIdx;
                });
        }
        catch (err) {
            api.showErrorNotification('Failed to read modsettings.lsx', err, {
                allowReport: false,
                message: 'Please run the game at least once and create a profile in-game',
            });
        }
        return storedLO;
    });
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
    let forceRefresh;
    context.registerInstaller('bg3-replacer', 25, testReplacer, installReplacer);
    context.registerModType('bg3-replacer', 25, (gameId) => gameId === GAME_ID, () => getGameDataPath(context.api), files => isReplacer(context.api, files), { name: 'BG3 Replacer' });
    context.registerLoadOrderPage({
        gameId: GAME_ID,
        createInfoPanel: (props) => {
            var _a;
            forceRefresh = props.refresh;
            return React.createElement(InfoPanel, {
                t: context.api.translate,
                currentProfile: (_a = context.api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile,
                onSetPlayerProfile: (profileName) => __awaiter(this, void 0, void 0, function* () {
                    context.api.store.dispatch(setPlayerProfile(profileName));
                    try {
                        yield readStoredLO(context.api);
                    }
                    catch (err) {
                        context.api.showErrorNotification('Failed to read load order', err, {
                            message: 'Please run the game before you start modding',
                            allowReport: false,
                        });
                    }
                    forceRefresh === null || forceRefresh === void 0 ? void 0 : forceRefresh();
                }),
            });
        },
        filter: () => [],
        preSort: makePreSort(context.api),
        gameArtURL: `${__dirname}/gameart.jpg`,
        displayCheckboxes: true,
        callback: (loadOrder) => writeLoadOrder(context.api, loadOrder),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGlEQUFzQztBQUV0QywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLHFEQUE4QztBQUM5Qyx5Q0FBeUM7QUFDekMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6QywyQ0FBc0U7QUFDdEUsbUNBQXFEO0FBR3JELE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztBQUMvQixNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBRXJELFNBQVMsU0FBUyxDQUFDLEtBQUs7SUFDdEIsT0FBTyxPQUFPLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUNuQyxDQUFDO0FBR0QsTUFBTSxnQkFBZ0IsR0FBRyx3QkFBWSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsTUFBTSxlQUFlLEdBQUcsd0JBQVksQ0FBQyxzQkFBc0IsRUFDekQsQ0FBQyxPQUFlLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBR2hGLE1BQU0sT0FBTyxHQUF1QjtJQUNsQyxRQUFRLEVBQUU7UUFDUixDQUFDLGdCQUF1QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLENBQUMsRUFBRSxPQUFPLENBQUM7UUFDOUYsQ0FBQyxlQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxFQUFFLE9B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QUFPLFFBQWdCLEVBQUUsRUFBRTtZQUNyRSxJQUFJLFFBQVEsS0FBSyxPQUFPLEVBQUU7Z0JBQ3hCLElBQUk7b0JBQ0YsTUFBTSxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNqQztnQkFBQyxPQUFPLEdBQUcsRUFBRTtvQkFDWixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUMvQiwyQkFBMkIsRUFBRSxHQUFHLEVBQUU7d0JBQ2hDLE9BQU8sRUFBRSw4Q0FBOEM7d0JBQ3ZELFdBQVcsRUFBRSxLQUFLO3FCQUNuQixDQUFDLENBQUM7aUJBQ047YUFDRjtRQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBGb3JtQ29udHJvbCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IGNyZWF0ZUFjdGlvbiB9IGZyb20gJ3JlZHV4LWFjdCc7XHJcbmltcG9ydCB7IGdlbmVyYXRlIGFzIHNob3J0aWQgfSBmcm9tICdzaG9ydGlkJztcclxuaW1wb3J0IHdhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElNb2ROb2RlLCBJTW9kU2V0dGluZ3MsIElQYWtJbmZvLCBJWG1sTm9kZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuY29uc3QgR0FNRV9JRCA9ICdiYWxkdXJzZ2F0ZTMnO1xyXG5jb25zdCBTVE9QX1BBVFRFUk5TID0gWydbXi9dKlxcXFwucGFrJCddO1xyXG5jb25zdCBMU0xJQl9VUkwgPSAnaHR0cHM6Ly9naXRodWIuY29tL05vcmJ5dGUvbHNsaWInO1xyXG5cclxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XHJcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XHJcbn1cclxuXHJcbi8vIGFjdGlvbnNcclxuY29uc3Qgc2V0UGxheWVyUHJvZmlsZSA9IGNyZWF0ZUFjdGlvbignQkczX1NFVF9QTEFZRVJQUk9GSUxFJywgbmFtZSA9PiBuYW1lKTtcclxuY29uc3Qgc2V0dGluZ3NXcml0dGVuID0gY3JlYXRlQWN0aW9uKCdCRzNfU0VUVElOR1NfV1JJVFRFTicsXHJcbiAgKHByb2ZpbGU6IHN0cmluZywgdGltZTogbnVtYmVyLCBjb3VudDogbnVtYmVyKSA9PiAoeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9KSk7XHJcblxyXG4vLyByZWR1Y2VyXHJcbmNvbnN0IHJlZHVjZXI6IHR5cGVzLklSZWR1Y2VyU3BlYyA9IHtcclxuICByZWR1Y2Vyczoge1xyXG4gICAgW3NldFBsYXllclByb2ZpbGUgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB1dGlsLnNldFNhZmUoc3RhdGUsIFsncGxheWVyUHJvZmlsZSddLCBwYXlsb2FkKSxcclxuICAgIFtzZXR0aW5nc1dyaXR0ZW4gYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHsgcHJvZmlsZSwgdGltZSwgY291bnQgfSA9IHBheWxvYWQ7XHJcbiAgICAgIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3NXcml0dGVuJywgcHJvZmlsZV0sIHsgdGltZSwgY291bnQgfSk7XHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgZGVmYXVsdHM6IHtcclxuICAgIHBsYXllclByb2ZpbGU6ICcnLFxyXG4gICAgc2V0dGluZ3NXcml0dGVuOiB7fSxcclxuICB9LFxyXG59O1xyXG5cclxuZnVuY3Rpb24gZG9jdW1lbnRzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnZG9jdW1lbnRzJyksICdMYXJpYW4gU3R1ZGlvcycsICdCYWxkdXJcXCdzIEdhdGUgMycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ01vZHMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvZmlsZXNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnUGxheWVyUHJvZmlsZXMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKTogYW55IHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoWycxNDU2NDYwNjY5JywgJzEwODY5NDAnXSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KTogYW55IHtcclxuICBjb25zdCBtcCA9IG1vZHNQYXRoKCk7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6ICdiZzMtdXNlcy1sc2xpYicsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICB0aXRsZTogJ0JHMyBzdXBwb3J0IHVzZXMgTFNMaWInLFxyXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcclxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkgYXMgYW55KVxyXG4gICAgICAudGhlbigoKSA9PiBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdFYXJseSBBY2Nlc3MgR2FtZScsIHtcclxuICAgICAgICBiYmNvZGU6ICdCYWxkdXJcXCdzIEdhdGUgMyBpcyBjdXJyZW50bHkgaW4gRWFybHkgQWNjZXNzLiBJdCBkb2VzblxcJ3Qgb2ZmaWNpYWxseSAnXHJcbiAgICAgICAgICAgICsgJ3N1cHBvcnQgbW9kZGluZywgZG9lc25cXCd0IGluY2x1ZGUgYW55IG1vZGRpbmcgdG9vbHMgYW5kIHdpbGwgcmVjZWl2ZSAnXHJcbiAgICAgICAgICAgICsgJ2ZyZXF1ZW50IHVwZGF0ZXMuPGJyLz4nXHJcbiAgICAgICAgICAgICsgJ01vZHMgbWF5IGJlY29tZSBpbmNvbXBhdGlibGUgd2l0aGluIGRheXMgb2YgYmVpbmcgcmVsZWFzZWQsIGdlbmVyYWxseSAnXHJcbiAgICAgICAgICAgICsgJ25vdCB3b3JrIGFuZC9vciBicmVhayB1bnJlbGF0ZWQgdGhpbmdzIHdpdGhpbiB0aGUgZ2FtZS48YnIvPjxici8+J1xyXG4gICAgICAgICAgICArICdbY29sb3I9XCJyZWRcIl1QbGVhc2UgZG9uXFwndCByZXBvcnQgaXNzdWVzIHRoYXQgaGFwcGVuIGluIGNvbm5lY3Rpb24gd2l0aCBtb2RzIHRvIHRoZSAnXHJcbiAgICAgICAgICAgICsgJ2dhbWUgZGV2ZWxvcGVycyAoTGFyaWFuIFN0dWRpb3MpIG9yIHRocm91Z2ggdGhlIFZvcnRleCBmZWVkYmFjayBzeXN0ZW0uWy9jb2xvcl0nLFxyXG4gICAgICB9LCBbIHsgbGFiZWw6ICdJIHVuZGVyc3RhbmQnIH0gXSkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0R2FtZURhdGFQYXRoKGFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICBjb25zdCBnYW1lUGF0aCA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aDtcclxuICBpZiAoZ2FtZVBhdGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihnYW1lUGF0aCwgJ0RhdGEnKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IE9SSUdJTkFMX0ZJTEVTID0gbmV3IFNldChbXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdhc3NldHMucGFrJyxcclxuICAnZWZmZWN0cy5wYWsnLFxyXG4gICdlbmdpbmUucGFrJyxcclxuICAnZW5naW5lc2hhZGVycy5wYWsnLFxyXG4gICdnYW1lLnBhaycsXHJcbiAgJ2dhbWVwbGF0Zm9ybS5wYWsnLFxyXG4gICdndXN0YXYucGFrJyxcclxuICAnZ3VzdGF2X3RleHR1cmVzLnBhaycsXHJcbiAgJ2ljb25zLnBhaycsXHJcbiAgJ2xvd3RleC5wYWsnLFxyXG4gICdtYXRlcmlhbHMucGFrJyxcclxuICAnbWluaW1hcHMucGFrJyxcclxuICAnbW9kZWxzLnBhaycsXHJcbiAgJ3NoYXJlZC5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZGJhbmtzLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kcy5wYWsnLFxyXG4gICd0ZXh0dXJlcy5wYWsnLFxyXG4gICd2aXJ0dWFsdGV4dHVyZXMucGFrJyxcclxuXSk7XHJcblxyXG5mdW5jdGlvbiBpc1JlcGxhY2VyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XHJcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xyXG5cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGl0ZXIgPT5cclxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpKTtcclxuXHJcbiAgaWYgKChvcmlnRmlsZSAhPT0gdW5kZWZpbmVkKSB8fCAocGFrcy5sZW5ndGggPT09IDApKSB7XHJcbiAgICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ01vZCBsb29rcyBsaWtlIGEgcmVwbGFjZXInLCB7XHJcbiAgICAgIGJiY29kZTogJ1RoZSBtb2QgeW91IGp1c3QgaW5zdGFsbGVkIGxvb2tzIGxpa2UgYSBcInJlcGxhY2VyXCIsIG1lYW5pbmcgaXQgaXMgaW50ZW5kZWQgdG8gcmVwbGFjZSAnXHJcbiAgICAgICAgICArICdvbmUgb2YgdGhlIGZpbGVzIHNoaXBwZWQgd2l0aCB0aGUgZ2FtZS48YnIvPidcclxuICAgICAgICAgICsgJ1lvdSBzaG91bGQgYmUgYXdhcmUgdGhhdCBzdWNoIGEgcmVwbGFjZXIgaW5jbHVkZXMgYSBjb3B5IG9mIHNvbWUgZ2FtZSBkYXRhIGZyb20gYSAnXHJcbiAgICAgICAgICArICdzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBnYW1lIGFuZCBtYXkgdGhlcmVmb3JlIGJyZWFrIGFzIHNvb24gYXMgdGhlIGdhbWUgZ2V0cyB1cGRhdGVkLjxici8+J1xyXG4gICAgICAgICAgKyAnRXZlbiBpZiBkb2VzblxcJ3QgYnJlYWssIGl0IG1heSByZXZlcnQgYnVnZml4ZXMgdGhhdCB0aGUgZ2FtZSAnXHJcbiAgICAgICAgICArICdkZXZlbG9wZXJzIGhhdmUgbWFkZS48YnIvPjxici8+J1xyXG4gICAgICAgICAgKyAnVGhlcmVmb3JlIFtjb2xvcj1cInJlZFwiXXBsZWFzZSB0YWtlIGV4dHJhIGNhcmUgdG8ga2VlcCB0aGlzIG1vZCB1cGRhdGVkWy9jb2xvcl0gYW5kIHJlbW92ZSBpdCB3aGVuIGl0ICdcclxuICAgICAgICAgICsgJ25vIGxvbmdlciBtYXRjaGVzIHRoZSBnYW1lIHZlcnNpb24uJyxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgTW9kICh3aWxsIGxpa2VseSBub3Qgd29yayknIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdJbnN0YWxsIGFzIFJlcGxhY2VyJyB9LFxyXG4gICAgXSkudGhlbihyZXN1bHQgPT4gcmVzdWx0LmFjdGlvbiA9PT0gJ0luc3RhbGwgYXMgUmVwbGFjZXInKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoZmFsc2UpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJlcGxhY2VyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBCbHVlYmlyZDx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQ6IHBha3MubGVuZ3RoID09PSAwLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSZXBsYWNlcihmaWxlczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIDogQmx1ZWJpcmQ8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBjb25zdCBkaXJlY3RvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChmaWxlcy5tYXAoZmlsZSA9PiBwYXRoLmRpcm5hbWUoZmlsZSkudG9VcHBlckNhc2UoKSkpKTtcclxuICBsZXQgZGF0YVBhdGg6IHN0cmluZyA9IGRpcmVjdG9yaWVzLmZpbmQoZGlyID0+IHBhdGguYmFzZW5hbWUoZGlyKSA9PT0gJ0RBVEEnKTtcclxuICBpZiAoZGF0YVBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3QgZ2VuT3JQdWJsaWMgPSBkaXJlY3Rvcmllc1xyXG4gICAgICAuZmluZChkaXIgPT4gWydQVUJMSUMnLCAnR0VORVJBVEVEJ10uaW5jbHVkZXMocGF0aC5iYXNlbmFtZShkaXIpKSk7XHJcbiAgICBpZiAoZ2VuT3JQdWJsaWMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRhUGF0aCA9IHBhdGguZGlybmFtZShnZW5PclB1YmxpYyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gKGRhdGFQYXRoICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IGZpbGVzLnJlZHVjZSgocHJldjogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRhdGFQYXRoLCBmaWxlUGF0aCk7XHJcbiAgICAgIGlmICghcmVsUGF0aC5zdGFydHNXaXRoKCcuLicpKSB7XHJcbiAgICAgICAgcHJldi5wdXNoKHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcmVsUGF0aCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sIFtdKVxyXG4gICAgOiBmaWxlcy5tYXAoKGZpbGVQYXRoOiBzdHJpbmcpOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPT4gKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGgsXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgaW5zdHJ1Y3Rpb25zLFxyXG4gIH0pO1xyXG59XHJcblxyXG5jb25zdCBnZXRQbGF5ZXJQcm9maWxlcyA9ICgoKSA9PiB7XHJcbiAgbGV0IGNhY2hlZCA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBjYWNoZWQgPSAoZnMgYXMgYW55KS5yZWFkZGlyU3luYyhwcm9maWxlc1BhdGgoKSlcclxuICAgICAgICAuZmlsdGVyKG5hbWUgPT4gKHBhdGguZXh0bmFtZShuYW1lKSA9PT0gJycpICYmIChuYW1lICE9PSAnRGVmYXVsdCcpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gKCkgPT4gY2FjaGVkO1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzKSB7XHJcbiAgY29uc3QgeyB0LCBjdXJyZW50UHJvZmlsZSwgb25TZXRQbGF5ZXJQcm9maWxlIH0gPSBwcm9wcztcclxuXHJcbiAgY29uc3Qgb25TZWxlY3QgPSBSZWFjdC51c2VDYWxsYmFjaygoZXYpID0+IHtcclxuICAgIG9uU2V0UGxheWVyUHJvZmlsZShldi5jdXJyZW50VGFyZ2V0LnZhbHVlKTtcclxuICB9LCBbb25TZXRQbGF5ZXJQcm9maWxlXSk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIHBhZGRpbmc6ICcxNnB4JyB9fT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cclxuICAgICAgICB7dCgnSW5nYW1lIFByb2ZpbGU6ICcpfVxyXG4gICAgICAgIDxGb3JtQ29udHJvbFxyXG4gICAgICAgICAgY29tcG9uZW50Q2xhc3M9J3NlbGVjdCdcclxuICAgICAgICAgIG5hbWU9J3VzZXJQcm9maWxlJ1xyXG4gICAgICAgICAgY2xhc3NOYW1lPSdmb3JtLWNvbnRyb2wnXHJcbiAgICAgICAgICB2YWx1ZT17Y3VycmVudFByb2ZpbGV9XHJcbiAgICAgICAgICBvbkNoYW5nZT17b25TZWxlY3R9XHJcbiAgICAgICAgPlxyXG4gICAgICAgICAgPG9wdGlvbiBrZXk9JycgdmFsdWU9Jyc+e3QoJ1BsZWFzZSBzZWxlY3Qgb25lJyl9PC9vcHRpb24+XHJcbiAgICAgICAgICB7Z2V0UGxheWVyUHJvZmlsZXMoKS5tYXAocHJvZiA9PiAoPG9wdGlvbiBrZXk9e3Byb2Z9IHZhbHVlPXtwcm9mfT57cHJvZn08L29wdGlvbj4pKX1cclxuICAgICAgICA8L0Zvcm1Db250cm9sPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGhyLz5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnUGxlYXNlIHJlZmVyIHRvIG1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyB0byBkZXRlcm1pbmUgdGhlIHJpZ2h0IG9yZGVyLiAnXHJcbiAgICAgICAgICArICdJZiB5b3UgY2FuXFwndCBmaW5kIGFueSBzdWdnZXN0aW9ucyBmb3IgYSBtb2QsIGl0IHByb2JhYmx5IGRvZXNuXFwndCBtYXR0ZXIuJyl9XHJcbiAgICAgICAgPGhyLz5cclxuICAgICAgICB7dCgnU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBlbmdpbmUgJ1xyXG4gICAgICAgICAgKyAnYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGxvYWQtb3JkZXJlZCBieSBtb2QgbWFuYWdlcnMuIElmIHlvdSB3YW50IHRvIGRpc2FibGUgJ1xyXG4gICAgICAgICAgKyAnc3VjaCBhIG1vZCwgcGxlYXNlIGRvIHNvIG9uIHRoZSBcIk1vZHNcIiBzY3JlZW4uJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0pIHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcblxyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ2JnMy1uby1wcm9maWxlLXNlbGVjdGVkJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZTogJ05vIHByb2ZpbGUgc2VsZWN0ZWQnLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHNlbGVjdCB0aGUgaW4tZ2FtZSBwcm9maWxlIHRvIG1vZCBvbiB0aGUgXCJMb2FkIE9yZGVyXCIgcGFnZScsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1uby1wcm9maWxlLXNlbGVjdGVkJyk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG5cclxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gICAgY29uc3Qgcm9vdCA9IGZpbmROb2RlKHJlZ2lvbj8ubm9kZSwgJ3Jvb3QnKTtcclxuICAgIGNvbnN0IG1vZHNOb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcclxuICAgIGNvbnN0IGxvTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpID8/IHsgY2hpbGRyZW46IFtdIH07XHJcbiAgICBpZiAoKGxvTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKGxvTm9kZS5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcclxuICAgICAgbG9Ob2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XHJcbiAgICB9XHJcbiAgICAvLyBkcm9wIGFsbCBub2RlcyBleGNlcHQgZm9yIHRoZSBnYW1lIGVudHJ5XHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbk5vZGVzID0gbW9kc05vZGU/LmNoaWxkcmVuPy5bMF0/Lm5vZGU/LmZpbHRlcj8uKGl0ZXIgPT5cclxuICAgICAgaXRlci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gJ0d1c3RhdicpKSkgPz8gW107XHJcblxyXG4gICAgY29uc3QgZW5hYmxlZFBha3MgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gISFsb2FkT3JkZXJba2V5XS5kYXRhPy51dWlkXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgbG9hZE9yZGVyW2tleV0uZW5hYmxlZFxyXG4gICAgICAgICAgICAgICAgICAgICYmICFsb2FkT3JkZXJba2V5XS5kYXRhPy5pc0xpc3RlZCk7XHJcblxyXG4gICAgLy8gYWRkIG5ldyBub2RlcyBmb3IgdGhlIGVuYWJsZWQgbW9kc1xyXG4gICAgZm9yIChjb25zdCBrZXkgb2YgZW5hYmxlZFBha3MpIHtcclxuICAgICAgLy8gY29uc3QgbWQ1ID0gYXdhaXQgdXRpbC5maWxlTUQ1KHBhdGguam9pbihtb2RzUGF0aCgpLCBrZXkpKTtcclxuICAgICAgZGVzY3JpcHRpb25Ob2Rlcy5wdXNoKHtcclxuICAgICAgICAkOiB7IGlkOiAnTW9kdWxlU2hvcnREZXNjJyB9LFxyXG4gICAgICAgIGF0dHJpYnV0ZTogW1xyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnRm9sZGVyJywgdHlwZTogJ0xTV1N0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLmZvbGRlciB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdNRDUnLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5tZDUgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLm5hbWUgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnV1aWQgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVmVyc2lvbicsIHR5cGU6ICdpbnQzMicsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnZlcnNpb24gfSB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxvYWRPcmRlck5vZGVzID0gZW5hYmxlZFBha3NcclxuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBsb2FkT3JkZXJbbGhzXS5wb3MgLSBsb2FkT3JkZXJbcmhzXS5wb3MpXHJcbiAgICAgIC5tYXAoKGtleTogc3RyaW5nKTogSU1vZE5vZGUgPT4gKHtcclxuICAgICAgICAkOiB7IGlkOiAnTW9kdWxlJyB9LFxyXG4gICAgICAgIGF0dHJpYnV0ZTogW1xyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBsb2FkT3JkZXJba2V5XS5kYXRhLnV1aWQgfSB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICBtb2RzTm9kZS5jaGlsZHJlblswXS5ub2RlID0gZGVzY3JpcHRpb25Ob2RlcztcclxuICAgIGxvTm9kZS5jaGlsZHJlblswXS5ub2RlID0gbG9hZE9yZGVyTm9kZXM7XHJcblxyXG4gICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzKTtcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXR0aW5nc1dyaXR0ZW4oYmczcHJvZmlsZSwgRGF0ZS5ub3coKSwgZW5hYmxlZFBha3MubGVuZ3RoKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbnR5cGUgRGl2aW5lQWN0aW9uID0gJ2NyZWF0ZS1wYWNrYWdlJyB8ICdsaXN0LXBhY2thZ2UnIHwgJ2V4dHJhY3Qtc2luZ2xlLWZpbGUnXHJcbiAgICAgICAgICAgICAgICAgIHwgJ2V4dHJhY3QtcGFja2FnZScgfCAnZXh0cmFjdC1wYWNrYWdlcycgfCAnY29udmVydC1tb2RlbCdcclxuICAgICAgICAgICAgICAgICAgfCAnY29udmVydC1tb2RlbHMnIHwgJ2NvbnZlcnQtcmVzb3VyY2UnIHwgJ2NvbnZlcnQtcmVzb3VyY2VzJztcclxuXHJcbmludGVyZmFjZSBJRGl2aW5lT3B0aW9ucyB7XHJcbiAgc291cmNlOiBzdHJpbmc7XHJcbiAgZGVzdGluYXRpb24/OiBzdHJpbmc7XHJcbiAgZXhwcmVzc2lvbj86IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIElEaXZpbmVPdXRwdXQge1xyXG4gIHN0ZG91dDogc3RyaW5nO1xyXG4gIHJldHVybkNvZGU6IG51bWJlcjtcclxufVxyXG5cclxuZnVuY3Rpb24gZGl2aW5lKGFjdGlvbjogRGl2aW5lQWN0aW9uLCBvcHRpb25zOiBJRGl2aW5lT3B0aW9ucyk6IFByb21pc2U8SURpdmluZU91dHB1dD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRGl2aW5lT3V0cHV0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBsZXQgcmV0dXJuZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIGxldCBzdGRvdXQ6IHN0cmluZyA9ICcnO1xyXG5cclxuICAgIGNvbnN0IGV4ZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICd0b29scycsICdkaXZpbmUuZXhlJyk7XHJcbiAgICBjb25zdCBhcmdzID0gW1xyXG4gICAgICAnLS1hY3Rpb24nLCBhY3Rpb24sXHJcbiAgICAgICctLXNvdXJjZScsIG9wdGlvbnMuc291cmNlLFxyXG4gICAgICAnLS1sb2dsZXZlbCcsICdvZmYnLFxyXG4gICAgICAnLS1nYW1lJywgJ2JnMycsXHJcbiAgICBdO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmRlc3RpbmF0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWRlc3RpbmF0aW9uJywgb3B0aW9ucy5kZXN0aW5hdGlvbik7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0aW9ucy5leHByZXNzaW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWV4cHJlc3Npb24nLCBvcHRpb25zLmV4cHJlc3Npb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHByb2MgPSBzcGF3bihleGUsIGFyZ3MsIHsgY3dkOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAndG9vbHMnKSB9KTtcclxuXHJcbiAgICBwcm9jLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4gc3Rkb3V0ICs9IGRhdGEpO1xyXG4gICAgcHJvYy5zdGRlcnIub24oJ2RhdGEnLCBkYXRhID0+IGxvZygnd2FybicsIGRhdGEpKTtcclxuXHJcbiAgICBwcm9jLm9uKCdlcnJvcicsIChlcnJJbjogRXJyb3IpID0+IHtcclxuICAgICAgaWYgKCFyZXR1cm5lZCkge1xyXG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ2RpdmluZS5leGUgZmFpbGVkOiAnICsgZXJySW4ubWVzc2FnZSk7XHJcbiAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBwcm9jLm9uKCdleGl0JywgKGNvZGU6IG51bWJlcikgPT4ge1xyXG4gICAgICBpZiAoIXJldHVybmVkKSB7XHJcbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICByZXNvbHZlKHsgc3Rkb3V0LCByZXR1cm5Db2RlOiAwIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBkaXZpbmUuZXhlIHJldHVybnMgdGhlIGFjdHVhbCBlcnJvciBjb2RlICsgMTAwIGlmIGEgZmF0YWwgZXJyb3Igb2NjdXJlZFxyXG4gICAgICAgICAgaWYgKGNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgY29kZSAtPSAxMDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoYGRpdmluZS5leGUgZmFpbGVkOiAke2NvZGV9YCk7XHJcbiAgICAgICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xyXG4gICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBhayhwYWtQYXRoLCBkZXN0UGF0aCwgcGF0dGVybikge1xyXG4gIHJldHVybiBkaXZpbmUoJ2V4dHJhY3QtcGFja2FnZScsIHsgc291cmNlOiBwYWtQYXRoLCBkZXN0aW5hdGlvbjogZGVzdFBhdGgsIGV4cHJlc3Npb246IHBhdHRlcm4gfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RNZXRhKHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgY29uc3QgbWV0YVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdsc21ldGEnLCBzaG9ydGlkKCkpO1xyXG4gIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKG1ldGFQYXRoKTtcclxuICBhd2FpdCBleHRyYWN0UGFrKHBha1BhdGgsIG1ldGFQYXRoLCAnKi9tZXRhLmxzeCcpO1xyXG4gIHRyeSB7XHJcbiAgICAvLyB0aGUgbWV0YS5sc3ggbWF5IGJlIGluIGEgc3ViZGlyZWN0b3J5LiBUaGVyZSBpcyBwcm9iYWJseSBhIHBhdHRlcm4gaGVyZVxyXG4gICAgLy8gYnV0IHdlJ2xsIGp1c3QgdXNlIGl0IGZyb20gd2hlcmV2ZXJcclxuICAgIGxldCBtZXRhTFNYUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKG1ldGFQYXRoLCAnbWV0YS5sc3gnKTtcclxuICAgIGF3YWl0IHdhbGsobWV0YVBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgICBjb25zdCB0ZW1wID0gZW50cmllcy5maW5kKGUgPT4gcGF0aC5iYXNlbmFtZShlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcclxuICAgICAgaWYgKHRlbXAgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIG1ldGFMU1hQYXRoID0gdGVtcC5maWxlUGF0aDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1ldGFMU1hQYXRoKTtcclxuICAgIGNvbnN0IG1ldGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1ldGFQYXRoKTtcclxuICAgIHJldHVybiBtZXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kTm9kZTxUIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nIH0+LCBVPihub2RlczogVFtdLCBpZDogc3RyaW5nKTogVCB7XHJcbiAgcmV0dXJuIG5vZGVzPy5maW5kKGl0ZXIgPT4gaXRlci4kLmlkID09PSBpZCkgPz8gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5jb25zdCBsaXN0Q2FjaGU6IHsgW3BhdGg6IHN0cmluZ106IFByb21pc2U8c3RyaW5nW10+IH0gPSB7fTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxpc3RQYWNrYWdlKHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBkaXZpbmUoJ2xpc3QtcGFja2FnZScsIHsgc291cmNlOiBwYWtQYXRoIH0pO1xyXG4gIGNvbnN0IGxpbmVzID0gcmVzLnN0ZG91dC5zcGxpdCgnXFxuJykubWFwKGxpbmUgPT4gbGluZS50cmltKCkpLmZpbHRlcihsaW5lID0+IGxpbmUubGVuZ3RoICE9PSAwKTtcclxuXHJcbiAgcmV0dXJuIGxpbmVzO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpc0xPTGlzdGVkKHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIGlmIChsaXN0Q2FjaGVbcGFrUGF0aF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbGlzdENhY2hlW3Bha1BhdGhdID0gbGlzdFBhY2thZ2UocGFrUGF0aCk7XHJcbiAgfVxyXG4gIGNvbnN0IGxpbmVzID0gYXdhaXQgbGlzdENhY2hlW3Bha1BhdGhdO1xyXG4gIC8vIGNvbnN0IG5vbkdVSSA9IGxpbmVzLmZpbmQobGluZSA9PiAhbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKTtcclxuICBjb25zdCBtZXRhTFNYID0gbGluZXMuZmluZChsaW5lID0+XHJcbiAgICBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcclxuICByZXR1cm4gbWV0YUxTWCA9PT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mbyhwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElQYWtJbmZvPiB7XHJcbiAgY29uc3QgbWV0YSA9IGF3YWl0IGV4dHJhY3RNZXRhKHBha1BhdGgpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XHJcblxyXG4gIGNvbnN0IGF0dHIgPSAobmFtZTogc3RyaW5nLCBmYWxsYmFjazogKCkgPT4gYW55KSA9PlxyXG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcclxuXHJcbiAgY29uc3QgZ2VuTmFtZSA9IHBhdGguYmFzZW5hbWUocGFrUGF0aCwgcGF0aC5leHRuYW1lKHBha1BhdGgpKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcclxuICAgIGRlc2NyaXB0aW9uOiBhdHRyKCdEZXNjcmlwdGlvbicsICgpID0+ICdNaXNzaW5nJyksXHJcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXHJcbiAgICBuYW1lOiBhdHRyKCdOYW1lJywgKCkgPT4gZ2VuTmFtZSksXHJcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxyXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcclxuICAgIHZlcnNpb246IGF0dHIoJ1ZlcnNpb24nLCAoKSA9PiAnMScpLFxyXG4gICAgaXNMaXN0ZWQ6IGF3YWl0IGlzTE9MaXN0ZWQocGFrUGF0aCksXHJcbiAgfTtcclxufVxyXG5cclxuY29uc3QgZmFsbGJhY2tQaWN0dXJlID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2dhbWVhcnQuanBnJyk7XHJcblxyXG5sZXQgc3RvcmVkTE86IGFueVtdO1xyXG5cclxuZnVuY3Rpb24gcGFyc2VNb2ROb2RlKG5vZGU6IElNb2ROb2RlKSB7XHJcbiAgY29uc3QgbmFtZSA9IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnTmFtZScpLiQudmFsdWU7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBuYW1lLFxyXG4gICAgbmFtZSxcclxuICAgIGRhdGE6IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQudmFsdWUsXHJcbiAgfTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZE1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBsZXQgYmczcHJvZmlsZTogc3RyaW5nID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlO1xyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSBnZXRQbGF5ZXJQcm9maWxlcygpO1xyXG4gICAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBzdG9yZWRMTyA9IFtdO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBiZzNwcm9maWxlID0gZ2V0UGxheWVyUHJvZmlsZXMoKVswXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2V0dGluZ3NQYXRoKTtcclxuICByZXR1cm4gcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHdyaXRlTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkYXRhOiBJTW9kU2V0dGluZ3MpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBsZXQgYmczcHJvZmlsZTogc3RyaW5nID0gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlO1xyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSBnZXRQbGF5ZXJQcm9maWxlcygpO1xyXG4gICAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBzdG9yZWRMTyA9IFtdO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBiZzNwcm9maWxlID0gZ2V0UGxheWVyUHJvZmlsZXMoKVswXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcclxuICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGRhdGEpO1xyXG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHNldHRpbmdzUGF0aCwgeG1sKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFN0b3JlZExPKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgY29uc3QgY29uZmlnID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICBjb25zdCBtb2RzUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuICBjb25zdCBtb2ROb2RlcyA9IG1vZHNSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG5cclxuICBjb25zdCBtb2RPcmRlciA9IG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xyXG5cclxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYmczcHJvZmlsZTogc3RyaW5nID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlO1xyXG4gIGlmIChtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcclxuICAgIGNvbnN0IGxhc3RXcml0ZSA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8uc2V0dGluZ3NXcml0dGVuPy5bYmczcHJvZmlsZV07XHJcbiAgICBpZiAoKGxhc3RXcml0ZSAhPT0gdW5kZWZpbmVkKSAmJiAobGFzdFdyaXRlLmNvdW50ID4gMSkpIHtcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIGlkOiAnYmczLW1vZHNldHRpbmdzLXJlc2V0JyxcclxuICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgICB0aXRsZTogJ1wibW9kc2V0dGluZ3MubHN4XCIgZmlsZSB3YXMgcmVzZXQnLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdUaGlzIHVzdWFsbHkgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgbW9kIGlzIGluc3RhbGxlZCcsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xyXG4gICAgLm1hcChub2RlID0+IHBhcnNlTW9kTm9kZShub2RlKSlcclxuICAgIC8vIEd1c3RhdiBpcyB0aGUgY29yZSBnYW1lXHJcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcclxuICAgIC8vIHNvcnQgYnkgdGhlIGluZGV4IG9mIGVhY2ggbW9kIGluIHRoZSBtb2RPcmRlciBsaXN0XHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG1vZE9yZGVyXHJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlUHJlU29ydChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyB3b3JrYXJvdW5kIGZvciBtb2RfbG9hZF9vcmRlciBiZWluZyBidWdnZWQgYWYsIGl0IHdpbGwgb2NjYXNpb25hbGx5IGNhbGwgcHJlU29ydFxyXG4gIC8vIHdpdGggYSBmcmVzaCBsaXN0IG9mIG1vZHMgZnJvbSBmaWx0ZXIsIGNvbXBsZXRlbHkgaWdub3JpbmcgcHJldmlvdXMgc29ydCByZXN1bHRzXHJcblxyXG4gIHJldHVybiBhc3luYyAoaXRlbXM6IGFueVtdLCBzb3J0RGlyOiBhbnksIHVwZGF0ZVR5cGU6IGFueSk6IFByb21pc2U8YW55W10+ID0+IHtcclxuICAgIGlmICgoaXRlbXMubGVuZ3RoID09PSAwKSAmJiAoc3RvcmVkTE8gIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgcmV0dXJuIHN0b3JlZExPO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBsZXQgcGFrczogc3RyaW5nW107XHJcbiAgICB0cnkge1xyXG4gICAgICBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCgpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gbm9wXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZHMgZGlyZWN0b3J5JywgZXJyLCB7XHJcbiAgICAgICAgICBpZDogJ2JnMy1mYWlsZWQtcmVhZC1tb2RzJyxcclxuICAgICAgICAgIG1lc3NhZ2U6IG1vZHNQYXRoKCksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcGFrcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBtYW5pZmVzdDtcclxuICAgIHRyeSB7XHJcbiAgICAgIG1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksICcnLCBHQU1FX0lEKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBkZXBsb3ltZW50IG1hbmlmZXN0JywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzdWx0OiBhbnlbXSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZmlsZU5hbWUgb2YgcGFrcykge1xyXG4gICAgICBhd2FpdCAodXRpbCBhcyBhbnkpLndpdGhFcnJvckNvbnRleHQoJ3JlYWRpbmcgcGFrJywgZmlsZU5hbWUsIGFzeW5jICgpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgZXhpc3RpbmdJdGVtID0gaXRlbXMuZmluZChpdGVyID0+IGl0ZXIuaWQgPT09IGZpbGVOYW1lKTtcclxuICAgICAgICAgIGlmICgoZXhpc3RpbmdJdGVtICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgJiYgKHVwZGF0ZVR5cGUgIT09ICdyZWZyZXNoJylcclxuICAgICAgICAgICAgICAmJiAoZXhpc3RpbmdJdGVtLmltZ1VybCAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChleGlzdGluZ0l0ZW0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IG1hbmlmZXN0LmZpbGVzLmZpbmQoZW50cnkgPT4gZW50cnkucmVsUGF0aCA9PT0gZmlsZU5hbWUpO1xyXG4gICAgICAgICAgY29uc3QgbW9kID0gbWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgID8gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdPy5bbWFuaWZlc3RFbnRyeS5zb3VyY2VdXHJcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgIGxldCBtb2RJbmZvID0gZXhpc3RpbmdJdGVtPy5kYXRhO1xyXG4gICAgICAgICAgaWYgKG1vZEluZm8gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBtb2RJbmZvID0gYXdhaXQgZXh0cmFjdFBha0luZm8ocGF0aC5qb2luKG1vZHNQYXRoKCksIGZpbGVOYW1lKSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGV0IHJlczogdHlwZXMuSUxvYWRPcmRlckRpc3BsYXlJdGVtO1xyXG4gICAgICAgICAgaWYgKG1vZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIHBhayBpcyBmcm9tIGEgbW9kIChhbiBpbnN0YWxsZWQgb25lKVxyXG4gICAgICAgICAgICByZXMgPSB7XHJcbiAgICAgICAgICAgICAgaWQ6IGZpbGVOYW1lLFxyXG4gICAgICAgICAgICAgIG5hbWU6IHV0aWwucmVuZGVyTW9kTmFtZShtb2QpLFxyXG4gICAgICAgICAgICAgIGltZ1VybDogbW9kLmF0dHJpYnV0ZXM/LnBpY3R1cmVVcmwgPz8gZmFsbGJhY2tQaWN0dXJlLFxyXG4gICAgICAgICAgICAgIGRhdGE6IG1vZEluZm8sXHJcbiAgICAgICAgICAgICAgZXh0ZXJuYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzID0ge1xyXG4gICAgICAgICAgICAgIGlkOiBmaWxlTmFtZSxcclxuICAgICAgICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVOYW1lLCBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpKSxcclxuICAgICAgICAgICAgICBpbWdVcmw6IGZhbGxiYWNrUGljdHVyZSxcclxuICAgICAgICAgICAgICBkYXRhOiBtb2RJbmZvLFxyXG4gICAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChtb2RJbmZvLmlzTGlzdGVkKSB7XHJcbiAgICAgICAgICAgIHJlcy5sb2NrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXN1bHQudW5zaGlmdChyZXMpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocmVzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhaycsIGVyciwgeyBhbGxvd1JlcG9ydDogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgICAgIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gICAgICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xyXG4gICAgICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICAgICAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuICAgICAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcclxuXHJcbiAgICAgIHN0b3JlZExPID0gKHVwZGF0ZVR5cGUgIT09ICdyZWZyZXNoJylcclxuICAgICAgICA/IHJlc3VsdC5zb3J0KChsaHMsIHJocykgPT4gaXRlbXMuaW5kZXhPZihsaHMpIC0gaXRlbXMuaW5kZXhPZihyaHMpKVxyXG4gICAgICAgIDogcmVzdWx0LnNvcnQoKGxocywgcmhzKSA9PiB7XHJcbiAgICAgICAgICAvLyBBIHJlZnJlc2ggc3VnZ2VzdHMgdGhhdCB3ZSdyZSBlaXRoZXIgZGVwbG95aW5nIG9yIHRoZSB1c2VyIGRlY2lkZWQgdG8gcmVmcmVzaFxyXG4gICAgICAgICAgLy8gIHRoZSBsaXN0IGZvcmNlZnVsbHkgLSBpbiBib3RoIGNhc2VzIHdlJ3JlIG1vcmUgaW50cmVzdGVkIGluIHRoZSBMTyBzcGVjaWZlZFxyXG4gICAgICAgICAgLy8gIGJ5IHRoZSBtb2QgbGlzdCBmaWxlIHJhdGhlciB0aGFuIHdoYXQgd2Ugc3RvcmVkIGluIG91ciBzdGF0ZSBhcyB3ZSBhc3N1bWVcclxuICAgICAgICAgIC8vICB0aGF0IHRoZSBMTyBoYWQgYWxyZWFkeSBiZWVuIHNhdmVkIHRvIGZpbGUuXHJcbiAgICAgICAgICBjb25zdCBsaHNJZHggPSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YS51dWlkKTtcclxuICAgICAgICAgIGNvbnN0IHJoc0lkeCA9IG1vZE9yZGVyLmZpbmRJbmRleChpID0+IGkgPT09IHJocy5kYXRhLnV1aWQpO1xyXG4gICAgICAgICAgcmV0dXJuIGxoc0lkeCAtIHJoc0lkeDtcclxuICAgICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzZXR0aW5ncy5sc3gnLCBlcnIsIHtcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgY3JlYXRlIGEgcHJvZmlsZSBpbi1nYW1lJyxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN0b3JlZExPO1xyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMyddLCByZWR1Y2VyKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ2V4ZXZ1bGthbicsXHJcbiAgICAgICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIChWdWxrYW4pJyxcclxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnMy5leGUnLFxyXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgICAgICdiaW4vYmczLmV4ZScsXHJcbiAgICAgICAgXSxcclxuICAgICAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczX2R4MTEuZXhlJyxcclxuICAgIHNldHVwOiBkaXNjb3ZlcnkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMTA4Njk0MCcsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiAxMDg2OTQwLFxyXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogW1xyXG4gICAgICAgICdpbmZvLmpzb24nLFxyXG4gICAgICBdLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IFtcclxuICAgICAgICAnaW5mby5qc29uJyxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGxldCBmb3JjZVJlZnJlc2g6ICgpID0+IHZvaWQ7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1yZXBsYWNlcicsIDI1LCB0ZXN0UmVwbGFjZXIsIGluc3RhbGxSZXBsYWNlcik7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCdiZzMtcmVwbGFjZXInLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSwgZmlsZXMgPT4gaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgZmlsZXMpLFxyXG4gICAgeyBuYW1lOiAnQkczIFJlcGxhY2VyJyB9IGFzIGFueSk7XHJcblxyXG4gIChjb250ZXh0IGFzIGFueSkucmVnaXN0ZXJMb2FkT3JkZXJQYWdlKHtcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIGNyZWF0ZUluZm9QYW5lbDogKHByb3BzKSA9PiB7XHJcbiAgICAgIGZvcmNlUmVmcmVzaCA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEluZm9QYW5lbCwge1xyXG4gICAgICAgIHQ6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSxcclxuICAgICAgICBjdXJyZW50UHJvZmlsZTogY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGUsXHJcbiAgICAgICAgb25TZXRQbGF5ZXJQcm9maWxlOiBhc3luYyAocHJvZmlsZU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlTmFtZSkpO1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBmb3JjZVJlZnJlc2g/LigpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGZpbHRlcjogKCkgPT4gW10sXHJcbiAgICBwcmVTb3J0OiBtYWtlUHJlU29ydChjb250ZXh0LmFwaSksXHJcbiAgICBnYW1lQXJ0VVJMOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGRpc3BsYXlDaGVja2JveGVzOiB0cnVlLFxyXG4gICAgY2FsbGJhY2s6IChsb2FkT3JkZXI6IGFueSkgPT4gd3JpdGVMb2FkT3JkZXIoY29udGV4dC5hcGksIGxvYWRPcmRlciksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2Vzc2lvbicsICdiYXNlJywgJ3Rvb2xzUnVubmluZyddLFxyXG4gICAgICBhc3luYyAocHJldjogYW55LCBjdXJyZW50OiBhbnkpID0+IHtcclxuICAgICAgICAvLyB3aGVuIGEgdG9vbCBleGl0cywgcmUtcmVhZCB0aGUgbG9hZCBvcmRlciBmcm9tIGRpc2sgYXMgaXQgbWF5IGhhdmUgYmVlblxyXG4gICAgICAgIC8vIGNoYW5nZWRcclxuICAgICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgICAgaWYgKChnYW1lTW9kZSA9PT0gR0FNRV9JRCkgJiYgKE9iamVjdC5rZXlzKGN1cnJlbnQpLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCksIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmICgocHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZm9yY2VSZWZyZXNoICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgZm9yY2VSZWZyZXNoKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcclxuICAgICAgICAgICAgJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1haW47XHJcbiJdfQ==