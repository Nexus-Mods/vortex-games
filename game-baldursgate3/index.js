"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
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
            t('GUI mods are locked in this list because they are loaded differently by the engine '
                + 'and can therefore not be disabled or load ordered on this screen.'))));
}
function writeLoadOrder(api, loadOrder) {
    var _a;
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
            const region = findNode(modSettings.save.region, 'ModuleSettings');
            const root = findNode(region.node, 'root');
            const modsNode = findNode(root.children[0].node, 'Mods');
            const loNode = findNode(root.children[0].node, 'ModOrder');
            if ((loNode.children === undefined) || (loNode.children[0] === '')) {
                loNode.children = [{ node: [] }];
            }
            const descriptionNodes = modsNode.children[0].node.filter(iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'Gustav')));
            const enabledPaks = Object.keys(loadOrder)
                .filter(key => {
                var _a, _b;
                return !!((_a = loadOrder[key].data) === null || _a === void 0 ? void 0 : _a.uuid)
                    && loadOrder[key].enabled
                    && !((_b = loadOrder[key].data) === null || _b === void 0 ? void 0 : _b.isGUI);
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
    var _a, _b;
    return _b = (_a = nodes) === null || _a === void 0 ? void 0 : _a.find(iter => iter.$.id === id), (_b !== null && _b !== void 0 ? _b : undefined);
}
function isGUIMod(pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield divine('list-package', { source: pakPath });
        const lines = res.stdout.split('\n');
        return lines.find(line => line.toLowerCase().startsWith('public/game/gui')) !== undefined;
    });
}
function extractPakInfo(pakPath) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const meta = yield extractMeta(pakPath);
        const config = findNode((_b = (_a = meta) === null || _a === void 0 ? void 0 : _a.save) === null || _b === void 0 ? void 0 : _b.region, 'Config');
        const configRoot = findNode((_c = config) === null || _c === void 0 ? void 0 : _c.node, 'root');
        const moduleInfo = findNode((_f = (_e = (_d = configRoot) === null || _d === void 0 ? void 0 : _d.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node, 'ModuleInfo');
        const attr = (name, fallback) => { var _a, _b, _c, _d; return _d = (_c = (_b = findNode((_a = moduleInfo) === null || _a === void 0 ? void 0 : _a.attribute, name)) === null || _b === void 0 ? void 0 : _b.$) === null || _c === void 0 ? void 0 : _c.value, (_d !== null && _d !== void 0 ? _d : fallback()); };
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
            isGUI: yield isGUIMod(pakPath),
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    return __awaiter(this, void 0, void 0, function* () {
        const modSettings = yield readModSettings(api);
        const config = findNode((_a = modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const configRoot = findNode((_b = config) === null || _b === void 0 ? void 0 : _b.node, 'root');
        const modOrderRoot = findNode((_e = (_d = (_c = configRoot) === null || _c === void 0 ? void 0 : _c.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'ModOrder');
        const modsRoot = findNode((_g = (_f = configRoot.children) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.node, 'Mods');
        const modOrderNodes = (_k = (_j = (_h = modOrderRoot.children) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.node, (_k !== null && _k !== void 0 ? _k : []));
        const modNodes = (_o = (_m = (_l = modsRoot.children) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.node, (_o !== null && _o !== void 0 ? _o : []));
        const modOrder = modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
        const state = api.store.getState();
        const bg3profile = (_p = state.settings.baldursgate3) === null || _p === void 0 ? void 0 : _p.playerProfile;
        if (modNodes.length === 1) {
            const lastWrite = (_r = (_q = state.settings.baldursgate3) === null || _q === void 0 ? void 0 : _q.settingsWritten) === null || _r === void 0 ? void 0 : _r[bg3profile];
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
        var _a, _b, _c, _d, _e, _f, _g, _h;
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
        const manifest = yield vortex_api_1.util.getManifest(api, '', GAME_ID);
        const result = [];
        for (const fileName of paks) {
            yield vortex_api_1.util.withErrorContext('reading pak', fileName, () => __awaiter(this, void 0, void 0, function* () {
                var _j, _k, _l;
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
                        ? state.persistent.mods[GAME_ID][manifestEntry.source]
                        : undefined;
                    let modInfo = (_j = existingItem) === null || _j === void 0 ? void 0 : _j.data;
                    if (modInfo === undefined) {
                        modInfo = yield extractPakInfo(path.join(modsPath(), fileName));
                    }
                    let res;
                    if (mod !== undefined) {
                        res = {
                            id: fileName,
                            name: vortex_api_1.util.renderModName(mod),
                            imgUrl: (_l = (_k = mod.attributes) === null || _k === void 0 ? void 0 : _k.pictureUrl, (_l !== null && _l !== void 0 ? _l : fallbackPicture)),
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
                    if (modInfo.isGUI) {
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
        const modSettings = yield readModSettings(api);
        const config = findNode((_a = modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const configRoot = findNode((_b = config) === null || _b === void 0 ? void 0 : _b.node, 'root');
        const modOrderRoot = findNode((_e = (_d = (_c = configRoot) === null || _c === void 0 ? void 0 : _c.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'ModOrder');
        const modOrderNodes = (_h = (_g = (_f = modOrderRoot.children) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.node, (_h !== null && _h !== void 0 ? _h : []));
        const modOrder = modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
        storedLO = (updateType !== 'refresh')
            ? result.sort((lhs, rhs) => items.indexOf(lhs) - items.indexOf(rhs))
            : result.sort((lhs, rhs) => {
                const lhsIdx = modOrder.findIndex(i => i === lhs.data.uuid);
                const rhsIdx = modOrder.findIndex(i => i === rhs.data.uuid);
                return lhsIdx - rhsIdx;
            });
        return storedLO;
    });
}
function main(context) {
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
    context.registerReducer(['settings', 'baldursgate3'], reducer);
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
                    var _b;
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
                    (_b = forceRefresh) === null || _b === void 0 ? void 0 : _b();
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
            if ((profile.gameId === GAME_ID) && (forceRefresh !== undefined)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGlEQUFzQztBQUV0QywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLHFEQUE4QztBQUM5Qyx5Q0FBeUM7QUFDekMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6QywyQ0FBc0U7QUFDdEUsbUNBQXFEO0FBR3JELE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztBQUMvQixNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBRXJELFNBQVMsU0FBUyxDQUFDLEtBQUs7SUFDdEIsT0FBTyxPQUFPLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUNuQyxDQUFDO0FBR0QsTUFBTSxnQkFBZ0IsR0FBRyx3QkFBWSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsTUFBTSxlQUFlLEdBQUcsd0JBQVksQ0FBQyxzQkFBc0IsRUFDekQsQ0FBQyxPQUFlLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBR2hGLE1BQU0sT0FBTyxHQUF1QjtJQUNsQyxRQUFRLEVBQUU7UUFDUixDQUFDLGdCQUF1QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLENBQUMsRUFBRSxPQUFPLENBQUM7UUFDOUYsQ0FBQyxlQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJ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QUFXLEVBQUUsS0FBSztxQkFDbkIsQ0FBQyxDQUFDO2lCQUNKO2FBQ0Y7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBRUwsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsU0FBaUIsRUFBRSxVQUFVLEVBQUUsRUFBRTtZQUNsRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsQ0FBQyxFQUFFO2dCQUNoRSxZQUFZLEVBQUUsQ0FBQzthQUNoQjtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQU8sUUFBZ0IsRUFBRSxFQUFFO1lBQ3JFLElBQUksUUFBUSxLQUFLLE9BQU8sRUFBRTtnQkFDeEIsSUFBSTtvQkFDRixNQUFNLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2pDO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQy9CLDJCQUEyQixFQUFFLEdBQUcsRUFBRTt3QkFDaEMsT0FBTyxFQUFFLDhDQUE4Qzt3QkFDdkQsV0FBVyxFQUFFLEtBQUs7cUJBQ25CLENBQUMsQ0FBQztpQkFDTjthQUNGO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEZvcm1Db250cm9sIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgY3JlYXRlQWN0aW9uIH0gZnJvbSAncmVkdXgtYWN0JztcclxuaW1wb3J0IHsgZ2VuZXJhdGUgYXMgc2hvcnRpZCB9IGZyb20gJ3Nob3J0aWQnO1xyXG5pbXBvcnQgd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSU1vZE5vZGUsIElNb2RTZXR0aW5ncywgSVBha0luZm8sIElYbWxOb2RlIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5jb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XHJcbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XHJcbmNvbnN0IExTTElCX1VSTCA9ICdodHRwczovL2dpdGh1Yi5jb20vTm9yYnl0ZS9sc2xpYic7XHJcblxyXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcclxuICByZXR1cm4gJyhefC8pJyArIGlucHV0ICsgJygvfCQpJztcclxufVxyXG5cclxuLy8gYWN0aW9uc1xyXG5jb25zdCBzZXRQbGF5ZXJQcm9maWxlID0gY3JlYXRlQWN0aW9uKCdCRzNfU0VUX1BMQVlFUlBST0ZJTEUnLCBuYW1lID0+IG5hbWUpO1xyXG5jb25zdCBzZXR0aW5nc1dyaXR0ZW4gPSBjcmVhdGVBY3Rpb24oJ0JHM19TRVRUSU5HU19XUklUVEVOJyxcclxuICAocHJvZmlsZTogc3RyaW5nLCB0aW1lOiBudW1iZXIsIGNvdW50OiBudW1iZXIpID0+ICh7IHByb2ZpbGUsIHRpbWUsIGNvdW50IH0pKTtcclxuXHJcbi8vIHJlZHVjZXJcclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0UGxheWVyUHJvZmlsZSBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwbGF5ZXJQcm9maWxlJ10sIHBheWxvYWQpLFxyXG4gICAgW3NldHRpbmdzV3JpdHRlbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgcGxheWVyUHJvZmlsZTogJycsXHJcbiAgICBzZXR0aW5nc1dyaXR0ZW46IHt9LFxyXG4gIH0sXHJcbn07XHJcblxyXG5mdW5jdGlvbiBkb2N1bWVudHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnTW9kcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9maWxlc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdQbGF5ZXJQcm9maWxlcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBhbnkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzE0NTY0NjA2NjknLCAnMTA4Njk0MCddKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpOiBhbnkge1xyXG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ2JnMy11c2VzLWxzbGliJyxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIHRpdGxlOiAnQkczIHN1cHBvcnQgdXNlcyBMU0xpYicsXHJcbiAgICBtZXNzYWdlOiBMU0xJQl9VUkwsXHJcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgYWN0aW9uczogW1xyXG4gICAgICB7IHRpdGxlOiAnVmlzaXQgUGFnZScsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oTFNMSUJfVVJMKS5jYXRjaCgoKSA9PiBudWxsKSB9LFxyXG4gICAgXSxcclxuICB9KTtcclxuICByZXR1cm4gZnMuc3RhdEFzeW5jKG1wKVxyXG4gICAgLmNhdGNoKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobXAsICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSBhcyBhbnkpXHJcbiAgICAgIC50aGVuKCgpID0+IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0Vhcmx5IEFjY2VzcyBHYW1lJywge1xyXG4gICAgICAgIGJiY29kZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIGlzIGN1cnJlbnRseSBpbiBFYXJseSBBY2Nlc3MuIEl0IGRvZXNuXFwndCBvZmZpY2lhbGx5ICdcclxuICAgICAgICAgICAgKyAnc3VwcG9ydCBtb2RkaW5nLCBkb2VzblxcJ3QgaW5jbHVkZSBhbnkgbW9kZGluZyB0b29scyBhbmQgd2lsbCByZWNlaXZlICdcclxuICAgICAgICAgICAgKyAnZnJlcXVlbnQgdXBkYXRlcy48YnIvPidcclxuICAgICAgICAgICAgKyAnTW9kcyBtYXkgYmVjb21lIGluY29tcGF0aWJsZSB3aXRoaW4gZGF5cyBvZiBiZWluZyByZWxlYXNlZCwgZ2VuZXJhbGx5ICdcclxuICAgICAgICAgICAgKyAnbm90IHdvcmsgYW5kL29yIGJyZWFrIHVucmVsYXRlZCB0aGluZ3Mgd2l0aGluIHRoZSBnYW1lLjxici8+PGJyLz4nXHJcbiAgICAgICAgICAgICsgJ1tjb2xvcj1cInJlZFwiXVBsZWFzZSBkb25cXCd0IHJlcG9ydCBpc3N1ZXMgdGhhdCBoYXBwZW4gaW4gY29ubmVjdGlvbiB3aXRoIG1vZHMgdG8gdGhlICdcclxuICAgICAgICAgICAgKyAnZ2FtZSBkZXZlbG9wZXJzIChMYXJpYW4gU3R1ZGlvcykgb3IgdGhyb3VnaCB0aGUgVm9ydGV4IGZlZWRiYWNrIHN5c3RlbS5bL2NvbG9yXScsXHJcbiAgICAgIH0sIFsgeyBsYWJlbDogJ0kgdW5kZXJzdGFuZCcgfSBdKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRHYW1lRGF0YVBhdGgoYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gIGNvbnN0IGdhbWVQYXRoID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZD8uW0dBTUVfSURdPy5wYXRoO1xyXG4gIGlmIChnYW1lUGF0aCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKGdhbWVQYXRoLCAnRGF0YScpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgT1JJR0lOQUxfRklMRVMgPSBuZXcgU2V0KFtcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdlZmZlY3RzLnBhaycsXHJcbiAgJ2VuZ2luZS5wYWsnLFxyXG4gICdlbmdpbmVzaGFkZXJzLnBhaycsXHJcbiAgJ2dhbWUucGFrJyxcclxuICAnZ2FtZXBsYXRmb3JtLnBhaycsXHJcbiAgJ2d1c3Rhdi5wYWsnLFxyXG4gICdndXN0YXZfdGV4dHVyZXMucGFrJyxcclxuICAnaWNvbnMucGFrJyxcclxuICAnbG93dGV4LnBhaycsXHJcbiAgJ21hdGVyaWFscy5wYWsnLFxyXG4gICdtaW5pbWFwcy5wYWsnLFxyXG4gICdtb2RlbHMucGFrJyxcclxuICAnc2hhcmVkLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kYmFua3MucGFrJyxcclxuICAnc2hhcmVkc291bmRzLnBhaycsXHJcbiAgJ3RleHR1cmVzLnBhaycsXHJcbiAgJ3ZpcnR1YWx0ZXh0dXJlcy5wYWsnLFxyXG5dKTtcclxuXHJcbmZ1bmN0aW9uIGlzUmVwbGFjZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcclxuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PlxyXG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiBPUklHSU5BTF9GSUxFUy5oYXMoaXRlci5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpKSk7XHJcblxyXG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoaXRlciA9PlxyXG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiAocGF0aC5leHRuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJykpO1xyXG5cclxuICBpZiAoKG9yaWdGaWxlICE9PSB1bmRlZmluZWQpIHx8IChwYWtzLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIGxvb2tzIGxpa2UgYSByZXBsYWNlcicsIHtcclxuICAgICAgYmJjb2RlOiAnVGhlIG1vZCB5b3UganVzdCBpbnN0YWxsZWQgbG9va3MgbGlrZSBhIFwicmVwbGFjZXJcIiwgbWVhbmluZyBpdCBpcyBpbnRlbmRlZCB0byByZXBsYWNlICdcclxuICAgICAgICAgICsgJ29uZSBvZiB0aGUgZmlsZXMgc2hpcHBlZCB3aXRoIHRoZSBnYW1lLjxici8+J1xyXG4gICAgICAgICAgKyAnWW91IHNob3VsZCBiZSBhd2FyZSB0aGF0IHN1Y2ggYSByZXBsYWNlciBpbmNsdWRlcyBhIGNvcHkgb2Ygc29tZSBnYW1lIGRhdGEgZnJvbSBhICdcclxuICAgICAgICAgICsgJ3NwZWNpZmljIHZlcnNpb24gb2YgdGhlIGdhbWUgYW5kIG1heSB0aGVyZWZvcmUgYnJlYWsgYXMgc29vbiBhcyB0aGUgZ2FtZSBnZXRzIHVwZGF0ZWQuPGJyLz4nXHJcbiAgICAgICAgICArICdFdmVuIGlmIGRvZXNuXFwndCBicmVhaywgaXQgbWF5IHJldmVydCBidWdmaXhlcyB0aGF0IHRoZSBnYW1lICdcclxuICAgICAgICAgICsgJ2RldmVsb3BlcnMgaGF2ZSBtYWRlLjxici8+PGJyLz4nXHJcbiAgICAgICAgICArICdUaGVyZWZvcmUgW2NvbG9yPVwicmVkXCJdcGxlYXNlIHRha2UgZXh0cmEgY2FyZSB0byBrZWVwIHRoaXMgbW9kIHVwZGF0ZWRbL2NvbG9yXSBhbmQgcmVtb3ZlIGl0IHdoZW4gaXQgJ1xyXG4gICAgICAgICAgKyAnbm8gbG9uZ2VyIG1hdGNoZXMgdGhlIGdhbWUgdmVyc2lvbi4nLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBNb2QgKHdpbGwgbGlrZWx5IG5vdCB3b3JrKScgfSxcclxuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgUmVwbGFjZXInIH0sXHJcbiAgICBdKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuYWN0aW9uID09PSAnSW5zdGFsbCBhcyBSZXBsYWNlcicpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IEJsdWViaXJkPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZDogcGFrcy5sZW5ndGggPT09IDAsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJlcGxhY2VyKGZpbGVzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBCbHVlYmlyZDx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xyXG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGZpbGVzLm1hcChmaWxlID0+IHBhdGguZGlybmFtZShmaWxlKS50b1VwcGVyQ2FzZSgpKSkpO1xyXG4gIGxldCBkYXRhUGF0aDogc3RyaW5nID0gZGlyZWN0b3JpZXMuZmluZChkaXIgPT4gcGF0aC5iYXNlbmFtZShkaXIpID09PSAnREFUQScpO1xyXG4gIGlmIChkYXRhUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBjb25zdCBnZW5PclB1YmxpYyA9IGRpcmVjdG9yaWVzXHJcbiAgICAgIC5maW5kKGRpciA9PiBbJ1BVQkxJQycsICdHRU5FUkFURUQnXS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGRpcikpKTtcclxuICAgIGlmIChnZW5PclB1YmxpYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRhdGFQYXRoID0gcGF0aC5kaXJuYW1lKGdlbk9yUHVibGljKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSAoZGF0YVBhdGggIT09IHVuZGVmaW5lZClcclxuICAgID8gZmlsZXMucmVkdWNlKChwcmV2OiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKSB7XHJcbiAgICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGF0YVBhdGgsIGZpbGVQYXRoKTtcclxuICAgICAgaWYgKCFyZWxQYXRoLnN0YXJ0c1dpdGgoJy4uJykpIHtcclxuICAgICAgICBwcmV2LnB1c2goe1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiByZWxQYXRoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSwgW10pXHJcbiAgICA6IGZpbGVzLm1hcCgoZmlsZVBhdGg6IHN0cmluZyk6IHR5cGVzLklJbnN0cnVjdGlvbiA9PiAoe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBmaWxlUGF0aCxcclxuICAgICAgfSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICBpbnN0cnVjdGlvbnMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmNvbnN0IGdldFBsYXllclByb2ZpbGVzID0gKCgpID0+IHtcclxuICBsZXQgY2FjaGVkID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGNhY2hlZCA9IChmcyBhcyBhbnkpLnJlYWRkaXJTeW5jKHByb2ZpbGVzUGF0aCgpKVxyXG4gICAgICAgIC5maWx0ZXIobmFtZSA9PiAocGF0aC5leHRuYW1lKG5hbWUpID09PSAnJykgJiYgKG5hbWUgIT09ICdEZWZhdWx0JykpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiAoKSA9PiBjYWNoZWQ7XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHMpIHtcclxuICBjb25zdCB7IHQsIGN1cnJlbnRQcm9maWxlLCBvblNldFBsYXllclByb2ZpbGUgfSA9IHByb3BzO1xyXG5cclxuICBjb25zdCBvblNlbGVjdCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldikgPT4ge1xyXG4gICAgb25TZXRQbGF5ZXJQcm9maWxlKGV2LmN1cnJlbnRUYXJnZXQudmFsdWUpO1xyXG4gIH0sIFtvblNldFBsYXllclByb2ZpbGVdKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxyXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4Jywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19PlxyXG4gICAgICAgIHt0KCdJbmdhbWUgUHJvZmlsZTogJyl9XHJcbiAgICAgICAgPEZvcm1Db250cm9sXHJcbiAgICAgICAgICBjb21wb25lbnRDbGFzcz0nc2VsZWN0J1xyXG4gICAgICAgICAgbmFtZT0ndXNlclByb2ZpbGUnXHJcbiAgICAgICAgICBjbGFzc05hbWU9J2Zvcm0tY29udHJvbCdcclxuICAgICAgICAgIHZhbHVlPXtjdXJyZW50UHJvZmlsZX1cclxuICAgICAgICAgIG9uQ2hhbmdlPXtvblNlbGVjdH1cclxuICAgICAgICA+XHJcbiAgICAgICAgICA8b3B0aW9uIGtleT0nJyB2YWx1ZT0nJz57dCgnUGxlYXNlIHNlbGVjdCBvbmUnKX08L29wdGlvbj5cclxuICAgICAgICAgIHtnZXRQbGF5ZXJQcm9maWxlcygpLm1hcChwcm9mID0+ICg8b3B0aW9uIGtleT17cHJvZn0gdmFsdWU9e3Byb2Z9Pntwcm9mfTwvb3B0aW9uPikpfVxyXG4gICAgICAgIDwvRm9ybUNvbnRyb2w+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8aHIvPlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KCdQbGVhc2UgcmVmZXIgdG8gbW9kIGRlc2NyaXB0aW9ucyBmcm9tIG1vZCBhdXRob3JzIHRvIGRldGVybWluZSB0aGUgcmlnaHQgb3JkZXIuICdcclxuICAgICAgICAgICsgJ0lmIHlvdSBjYW5cXCd0IGZpbmQgYW55IHN1Z2dlc3Rpb25zIGZvciBhIG1vZCwgaXQgcHJvYmFibHkgZG9lc25cXCd0IG1hdHRlci4nKX1cclxuICAgICAgICA8aHIvPlxyXG4gICAgICAgIHt0KCdHVUkgbW9kcyBhcmUgbG9ja2VkIGluIHRoaXMgbGlzdCBiZWNhdXNlIHRoZXkgYXJlIGxvYWRlZCBkaWZmZXJlbnRseSBieSB0aGUgZW5naW5lICdcclxuICAgICAgICAgICsgJ2FuZCBjYW4gdGhlcmVmb3JlIG5vdCBiZSBkaXNhYmxlZCBvciBsb2FkIG9yZGVyZWQgb24gdGhpcyBzY3JlZW4uJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0pIHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcblxyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ2JnMy1uby1wcm9maWxlLXNlbGVjdGVkJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICB0aXRsZTogJ05vIHByb2ZpbGUgc2VsZWN0ZWQnLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHNlbGVjdCB0aGUgaW4tZ2FtZSBwcm9maWxlIHRvIG1vZCBvbiB0aGUgXCJMb2FkIE9yZGVyXCIgcGFnZScsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1uby1wcm9maWxlLXNlbGVjdGVkJyk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG5cclxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzLnNhdmUucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24ubm9kZSwgJ3Jvb3QnKTtcclxuICAgIGNvbnN0IG1vZHNOb2RlID0gZmluZE5vZGUocm9vdC5jaGlsZHJlblswXS5ub2RlLCAnTW9kcycpO1xyXG4gICAgY29uc3QgbG9Ob2RlID0gZmluZE5vZGUocm9vdC5jaGlsZHJlblswXS5ub2RlLCAnTW9kT3JkZXInKTtcclxuICAgIGlmICgobG9Ob2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobG9Ob2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xyXG4gICAgICBsb05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcclxuICAgIH1cclxuICAgIC8vIGRyb3AgYWxsIG5vZGVzIGV4Y2VwdCBmb3IgdGhlIGdhbWUgZW50cnlcclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTm9kZXMgPSBtb2RzTm9kZS5jaGlsZHJlblswXS5ub2RlLmZpbHRlcihpdGVyID0+XHJcbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09ICdHdXN0YXYnKSkpO1xyXG5cclxuICAgIGNvbnN0IGVuYWJsZWRQYWtzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICEhbG9hZE9yZGVyW2tleV0uZGF0YT8udXVpZFxyXG4gICAgICAgICAgICAgICAgICAgICYmIGxvYWRPcmRlcltrZXldLmVuYWJsZWRcclxuICAgICAgICAgICAgICAgICAgICAmJiAhbG9hZE9yZGVyW2tleV0uZGF0YT8uaXNHVUkpO1xyXG5cclxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIGVuYWJsZWRQYWtzKSB7XHJcbiAgICAgIC8vIGNvbnN0IG1kNSA9IGF3YWl0IHV0aWwuZmlsZU1ENShwYXRoLmpvaW4obW9kc1BhdGgoKSwga2V5KSk7XHJcbiAgICAgIGRlc2NyaXB0aW9uTm9kZXMucHVzaCh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZVNob3J0RGVzYycgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5mb2xkZXIgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTUQ1JywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEubWQ1IH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ05hbWUnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5uYW1lIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb24nLCB0eXBlOiAnaW50MzInLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS52ZXJzaW9uIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGVuYWJsZWRQYWtzXHJcbiAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gbG9hZE9yZGVyW2xoc10ucG9zIC0gbG9hZE9yZGVyW3Joc10ucG9zKVxyXG4gICAgICAubWFwKChrZXk6IHN0cmluZyk6IElNb2ROb2RlID0+ICh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XHJcbiAgICBsb05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGxvYWRPcmRlck5vZGVzO1xyXG5cclxuICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncyk7XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0dGluZ3NXcml0dGVuKGJnM3Byb2ZpbGUsIERhdGUubm93KCksIGVuYWJsZWRQYWtzLmxlbmd0aCkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG50eXBlIERpdmluZUFjdGlvbiA9ICdjcmVhdGUtcGFja2FnZScgfCAnbGlzdC1wYWNrYWdlJyB8ICdleHRyYWN0LXNpbmdsZS1maWxlJ1xyXG4gICAgICAgICAgICAgICAgICB8ICdleHRyYWN0LXBhY2thZ2UnIHwgJ2V4dHJhY3QtcGFja2FnZXMnIHwgJ2NvbnZlcnQtbW9kZWwnXHJcbiAgICAgICAgICAgICAgICAgIHwgJ2NvbnZlcnQtbW9kZWxzJyB8ICdjb252ZXJ0LXJlc291cmNlJyB8ICdjb252ZXJ0LXJlc291cmNlcyc7XHJcblxyXG5pbnRlcmZhY2UgSURpdmluZU9wdGlvbnMge1xyXG4gIHNvdXJjZTogc3RyaW5nO1xyXG4gIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xyXG4gIGV4cHJlc3Npb24/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJRGl2aW5lT3V0cHV0IHtcclxuICBzdGRvdXQ6IHN0cmluZztcclxuICByZXR1cm5Db2RlOiBudW1iZXI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpdmluZShhY3Rpb246IERpdmluZUFjdGlvbiwgb3B0aW9uczogSURpdmluZU9wdGlvbnMpOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SURpdmluZU91dHB1dD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgbGV0IHJldHVybmVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBsZXQgc3Rkb3V0OiBzdHJpbmcgPSAnJztcclxuXHJcbiAgICBjb25zdCBleGUgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAndG9vbHMnLCAnZGl2aW5lLmV4ZScpO1xyXG4gICAgY29uc3QgYXJncyA9IFtcclxuICAgICAgJy0tYWN0aW9uJywgYWN0aW9uLFxyXG4gICAgICAnLS1zb3VyY2UnLCBvcHRpb25zLnNvdXJjZSxcclxuICAgICAgJy0tbG9nbGV2ZWwnLCAnb2ZmJyxcclxuICAgICAgJy0tZ2FtZScsICdiZzMnLFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5kZXN0aW5hdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1kZXN0aW5hdGlvbicsIG9wdGlvbnMuZGVzdGluYXRpb24pO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdGlvbnMuZXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1leHByZXNzaW9uJywgb3B0aW9ucy5leHByZXNzaW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwcm9jID0gc3Bhd24oZXhlLCBhcmdzLCB7IGN3ZDogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3Rvb2xzJykgfSk7XHJcblxyXG4gICAgcHJvYy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHN0ZG91dCArPSBkYXRhKTtcclxuICAgIHByb2Muc3RkZXJyLm9uKCdkYXRhJywgZGF0YSA9PiBsb2coJ3dhcm4nLCBkYXRhKSk7XHJcblxyXG4gICAgcHJvYy5vbignZXJyb3InLCAoZXJySW46IEVycm9yKSA9PiB7XHJcbiAgICAgIGlmICghcmV0dXJuZWQpIHtcclxuICAgICAgICByZXR1cm5lZCA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdkaXZpbmUuZXhlIGZhaWxlZDogJyArIGVyckluLm1lc3NhZ2UpO1xyXG4gICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XHJcbiAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcHJvYy5vbignZXhpdCcsIChjb2RlOiBudW1iZXIpID0+IHtcclxuICAgICAgaWYgKCFyZXR1cm5lZCkge1xyXG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgcmVzb2x2ZSh7IHN0ZG91dCwgcmV0dXJuQ29kZTogMCB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gZGl2aW5lLmV4ZSByZXR1cm5zIHRoZSBhY3R1YWwgZXJyb3IgY29kZSArIDEwMCBpZiBhIGZhdGFsIGVycm9yIG9jY3VyZWRcclxuICAgICAgICAgIGlmIChjb2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIGNvZGUgLT0gMTAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtjb2RlfWApO1xyXG4gICAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWsocGFrUGF0aCwgZGVzdFBhdGgsIHBhdHRlcm4pIHtcclxuICByZXR1cm4gZGl2aW5lKCdleHRyYWN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCwgZGVzdGluYXRpb246IGRlc3RQYXRoLCBleHByZXNzaW9uOiBwYXR0ZXJuIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IG1ldGFQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndGVtcCcpLCAnbHNtZXRhJywgc2hvcnRpZCgpKTtcclxuICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhtZXRhUGF0aCk7XHJcbiAgYXdhaXQgZXh0cmFjdFBhayhwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcclxuICB0cnkge1xyXG4gICAgLy8gdGhlIG1ldGEubHN4IG1heSBiZSBpbiBhIHN1YmRpcmVjdG9yeS4gVGhlcmUgaXMgcHJvYmFibHkgYSBwYXR0ZXJuIGhlcmVcclxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXHJcbiAgICBsZXQgbWV0YUxTWFBhdGg6IHN0cmluZyA9IHBhdGguam9pbihtZXRhUGF0aCwgJ21ldGEubHN4Jyk7XHJcbiAgICBhd2FpdCB3YWxrKG1ldGFQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XHJcbiAgICAgIGlmICh0ZW1wICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBtZXRhTFNYUGF0aCA9IHRlbXAuZmlsZVBhdGg7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtZXRhTFNYUGF0aCk7XHJcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XHJcbiAgICByZXR1cm4gbWV0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE5vZGU8VCBleHRlbmRzIElYbWxOb2RlPHsgaWQ6IHN0cmluZyB9PiwgVT4obm9kZXM6IFRbXSwgaWQ6IHN0cmluZyk6IFQge1xyXG4gIHJldHVybiBub2Rlcz8uZmluZChpdGVyID0+IGl0ZXIuJC5pZCA9PT0gaWQpID8/IHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaXNHVUlNb2QocGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgY29uc3QgcmVzID0gYXdhaXQgZGl2aW5lKCdsaXN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCB9KTtcclxuICBjb25zdCBsaW5lcyA9IHJlcy5zdGRvdXQuc3BsaXQoJ1xcbicpO1xyXG4gIHJldHVybiBsaW5lcy5maW5kKGxpbmUgPT4gbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKSAhPT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mbyhwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElQYWtJbmZvPiB7XHJcbiAgY29uc3QgbWV0YSA9IGF3YWl0IGV4dHJhY3RNZXRhKHBha1BhdGgpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XHJcblxyXG4gIGNvbnN0IGF0dHIgPSAobmFtZTogc3RyaW5nLCBmYWxsYmFjazogKCkgPT4gYW55KSA9PlxyXG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcclxuXHJcbiAgY29uc3QgZ2VuTmFtZSA9IHBhdGguYmFzZW5hbWUocGFrUGF0aCwgcGF0aC5leHRuYW1lKHBha1BhdGgpKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcclxuICAgIGRlc2NyaXB0aW9uOiBhdHRyKCdEZXNjcmlwdGlvbicsICgpID0+ICdNaXNzaW5nJyksXHJcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXHJcbiAgICBuYW1lOiBhdHRyKCdOYW1lJywgKCkgPT4gZ2VuTmFtZSksXHJcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxyXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcclxuICAgIHZlcnNpb246IGF0dHIoJ1ZlcnNpb24nLCAoKSA9PiAnMScpLFxyXG4gICAgaXNHVUk6IGF3YWl0IGlzR1VJTW9kKHBha1BhdGgpLFxyXG4gIH07XHJcbn1cclxuXHJcbmNvbnN0IGZhbGxiYWNrUGljdHVyZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdnYW1lYXJ0LmpwZycpO1xyXG5cclxubGV0IHN0b3JlZExPOiBhbnlbXTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xyXG4gIGNvbnN0IG5hbWUgPSBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ05hbWUnKS4kLnZhbHVlO1xyXG4gIHJldHVybiB7XHJcbiAgICBpZDogbmFtZSxcclxuICAgIG5hbWUsXHJcbiAgICBkYXRhOiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kLnZhbHVlLFxyXG4gIH07XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgbGV0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAoIWJnM3Byb2ZpbGUpIHtcclxuICAgIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcclxuICAgIGlmIChwbGF5ZXJQcm9maWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgc3RvcmVkTE8gPSBbXTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYmczcHJvZmlsZSA9IGdldFBsYXllclByb2ZpbGVzKClbMF07XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHNldHRpbmdzUGF0aCk7XHJcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgbGV0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAoIWJnM3Byb2ZpbGUpIHtcclxuICAgIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcclxuICAgIGlmIChwbGF5ZXJQcm9maWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgc3RvcmVkTE8gPSBbXTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYmczcHJvZmlsZSA9IGdldFBsYXllclByb2ZpbGVzKClbMF07XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuXHJcbiAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XHJcbiAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChkYXRhKTtcclxuICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhzZXR0aW5nc1BhdGgsIHhtbCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRTdG9yZWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1vZFNldHRpbmdzLnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICBjb25zdCBtb2RzUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3QuY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcclxuICBjb25zdCBtb2RPcmRlck5vZGVzID0gbW9kT3JkZXJSb290LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdC5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG5cclxuICBjb25zdCBtb2RPcmRlciA9IG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xyXG5cclxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYmczcHJvZmlsZTogc3RyaW5nID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlO1xyXG4gIGlmIChtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcclxuICAgIGNvbnN0IGxhc3RXcml0ZSA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8uc2V0dGluZ3NXcml0dGVuPy5bYmczcHJvZmlsZV07XHJcbiAgICBpZiAoKGxhc3RXcml0ZSAhPT0gdW5kZWZpbmVkKSAmJiAobGFzdFdyaXRlLmNvdW50ID4gMSkpIHtcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIGlkOiAnYmczLW1vZHNldHRpbmdzLXJlc2V0JyxcclxuICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgICB0aXRsZTogJ1wibW9kc2V0dGluZ3MubHN4XCIgZmlsZSB3YXMgcmVzZXQnLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdUaGlzIHVzdWFsbHkgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgbW9kIGlzIGluc3RhbGxlZCcsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xyXG4gICAgLm1hcChub2RlID0+IHBhcnNlTW9kTm9kZShub2RlKSlcclxuICAgIC8vIEd1c3RhdiBpcyB0aGUgY29yZSBnYW1lXHJcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcclxuICAgIC8vIHNvcnQgYnkgdGhlIGluZGV4IG9mIGVhY2ggbW9kIGluIHRoZSBtb2RPcmRlciBsaXN0XHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG1vZE9yZGVyXHJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlUHJlU29ydChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyB3b3JrYXJvdW5kIGZvciBtb2RfbG9hZF9vcmRlciBiZWluZyBidWdnZWQgYWYsIGl0IHdpbGwgb2NjYXNpb25hbGx5IGNhbGwgcHJlU29ydFxyXG4gIC8vIHdpdGggYSBmcmVzaCBsaXN0IG9mIG1vZHMgZnJvbSBmaWx0ZXIsIGNvbXBsZXRlbHkgaWdub3JpbmcgcHJldmlvdXMgc29ydCByZXN1bHRzXHJcblxyXG4gIHJldHVybiBhc3luYyAoaXRlbXM6IGFueVtdLCBzb3J0RGlyOiBhbnksIHVwZGF0ZVR5cGU6IGFueSk6IFByb21pc2U8YW55W10+ID0+IHtcclxuICAgIGlmICgoaXRlbXMubGVuZ3RoID09PSAwKSAmJiAoc3RvcmVkTE8gIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgcmV0dXJuIHN0b3JlZExPO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBsZXQgcGFrczogc3RyaW5nW107XHJcbiAgICB0cnkge1xyXG4gICAgICBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCgpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gbm9wXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZHMgZGlyZWN0b3J5JywgZXJyLCB7XHJcbiAgICAgICAgICBpZDogJ2JnMy1mYWlsZWQtcmVhZC1tb2RzJyxcclxuICAgICAgICAgIG1lc3NhZ2U6IG1vZHNQYXRoKCksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcGFrcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksICcnLCBHQU1FX0lEKTtcclxuXHJcbiAgICBjb25zdCByZXN1bHQ6IGFueVtdID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWxlTmFtZSBvZiBwYWtzKSB7XHJcbiAgICAgIGF3YWl0ICh1dGlsIGFzIGFueSkud2l0aEVycm9yQ29udGV4dCgncmVhZGluZyBwYWsnLCBmaWxlTmFtZSwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBleGlzdGluZ0l0ZW0gPSBpdGVtcy5maW5kKGl0ZXIgPT4gaXRlci5pZCA9PT0gZmlsZU5hbWUpO1xyXG4gICAgICAgICAgaWYgKChleGlzdGluZ0l0ZW0gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAmJiAodXBkYXRlVHlwZSAhPT0gJ3JlZnJlc2gnKVxyXG4gICAgICAgICAgICAgICYmIChleGlzdGluZ0l0ZW0uaW1nVXJsICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGV4aXN0aW5nSXRlbSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBtYW5pZmVzdEVudHJ5ID0gbWFuaWZlc3QuZmlsZXMuZmluZChlbnRyeSA9PiBlbnRyeS5yZWxQYXRoID09PSBmaWxlTmFtZSk7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSBtYW5pZmVzdEVudHJ5ICE9PSB1bmRlZmluZWRcclxuICAgICAgICAgICAgPyBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF1bbWFuaWZlc3RFbnRyeS5zb3VyY2VdXHJcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgIGxldCBtb2RJbmZvID0gZXhpc3RpbmdJdGVtPy5kYXRhO1xyXG4gICAgICAgICAgaWYgKG1vZEluZm8gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBtb2RJbmZvID0gYXdhaXQgZXh0cmFjdFBha0luZm8ocGF0aC5qb2luKG1vZHNQYXRoKCksIGZpbGVOYW1lKSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGV0IHJlczogdHlwZXMuSUxvYWRPcmRlckRpc3BsYXlJdGVtO1xyXG4gICAgICAgICAgaWYgKG1vZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIHBhayBpcyBmcm9tIGEgbW9kIChhbiBpbnN0YWxsZWQgb25lKVxyXG4gICAgICAgICAgICByZXMgPSB7XHJcbiAgICAgICAgICAgICAgaWQ6IGZpbGVOYW1lLFxyXG4gICAgICAgICAgICAgIG5hbWU6IHV0aWwucmVuZGVyTW9kTmFtZShtb2QpLFxyXG4gICAgICAgICAgICAgIGltZ1VybDogbW9kLmF0dHJpYnV0ZXM/LnBpY3R1cmVVcmwgPz8gZmFsbGJhY2tQaWN0dXJlLFxyXG4gICAgICAgICAgICAgIGRhdGE6IG1vZEluZm8sXHJcbiAgICAgICAgICAgICAgZXh0ZXJuYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzID0ge1xyXG4gICAgICAgICAgICAgIGlkOiBmaWxlTmFtZSxcclxuICAgICAgICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVOYW1lLCBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpKSxcclxuICAgICAgICAgICAgICBpbWdVcmw6IGZhbGxiYWNrUGljdHVyZSxcclxuICAgICAgICAgICAgICBkYXRhOiBtb2RJbmZvLFxyXG4gICAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChtb2RJbmZvLmlzR1VJKSB7XHJcbiAgICAgICAgICAgIHJlcy5sb2NrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXN1bHQudW5zaGlmdChyZXMpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocmVzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhaycsIGVyciwgeyBhbGxvd1JlcG9ydDogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gICAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICAgIGNvbnN0IG1vZE9yZGVyUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpO1xyXG4gICAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdC5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG4gICAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcclxuXHJcbiAgICBzdG9yZWRMTyA9ICh1cGRhdGVUeXBlICE9PSAncmVmcmVzaCcpXHJcbiAgICAgID8gcmVzdWx0LnNvcnQoKGxocywgcmhzKSA9PiBpdGVtcy5pbmRleE9mKGxocykgLSBpdGVtcy5pbmRleE9mKHJocykpXHJcbiAgICAgIDogcmVzdWx0LnNvcnQoKGxocywgcmhzKSA9PiB7XHJcbiAgICAgICAgLy8gQSByZWZyZXNoIHN1Z2dlc3RzIHRoYXQgd2UncmUgZWl0aGVyIGRlcGxveWluZyBvciB0aGUgdXNlciBkZWNpZGVkIHRvIHJlZnJlc2hcclxuICAgICAgICAvLyAgdGhlIGxpc3QgZm9yY2VmdWxseSAtIGluIGJvdGggY2FzZXMgd2UncmUgbW9yZSBpbnRyZXN0ZWQgaW4gdGhlIExPIHNwZWNpZmVkXHJcbiAgICAgICAgLy8gIGJ5IHRoZSBtb2QgbGlzdCBmaWxlIHJhdGhlciB0aGFuIHdoYXQgd2Ugc3RvcmVkIHBlcnNpc3RlbnRseS5cclxuICAgICAgICBjb25zdCBsaHNJZHggPSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YS51dWlkKTtcclxuICAgICAgICBjb25zdCByaHNJZHggPSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YS51dWlkKTtcclxuICAgICAgICByZXR1cm4gbGhzSWR4IC0gcmhzSWR4O1xyXG4gICAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gc3RvcmVkTE87XHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxyXG4gICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXHJcbiAgICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICAgICAnYmluL2JnMy5leGUnLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBzZXR1cDogZGlzY292ZXJ5ID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogJzEwODY5NDAnLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogMTA4Njk0MCxcclxuICAgICAgc3RvcFBhdHRlcm5zOiBTVE9QX1BBVFRFUk5TLm1hcCh0b1dvcmRFeHApLFxyXG4gICAgICBpZ25vcmVDb25mbGljdHM6IFtcclxuICAgICAgICAnaW5mby5qc29uJyxcclxuICAgICAgXSxcclxuICAgICAgaWdub3JlRGVwbG95OiBbXHJcbiAgICAgICAgJ2luZm8uanNvbicsXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBsZXQgZm9yY2VSZWZyZXNoOiAoKSA9PiB2b2lkO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMyddLCByZWR1Y2VyKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLXJlcGxhY2VyJywgMjUsIHRlc3RSZXBsYWNlciwgaW5zdGFsbFJlcGxhY2VyKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ2JnMy1yZXBsYWNlcicsIDI1LCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICAoKSA9PiBnZXRHYW1lRGF0YVBhdGgoY29udGV4dC5hcGkpLCBmaWxlcyA9PiBpc1JlcGxhY2VyKGNvbnRleHQuYXBpLCBmaWxlcyksXHJcbiAgICB7IG5hbWU6ICdCRzMgUmVwbGFjZXInIH0gYXMgYW55KTtcclxuXHJcbiAgKGNvbnRleHQgYXMgYW55KS5yZWdpc3RlckxvYWRPcmRlclBhZ2Uoe1xyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgY3JlYXRlSW5mb1BhbmVsOiAocHJvcHMpID0+IHtcclxuICAgICAgZm9yY2VSZWZyZXNoID0gcHJvcHMucmVmcmVzaDtcclxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSW5mb1BhbmVsLCB7XHJcbiAgICAgICAgdDogY29udGV4dC5hcGkudHJhbnNsYXRlLFxyXG4gICAgICAgIGN1cnJlbnRQcm9maWxlOiBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZSxcclxuICAgICAgICBvblNldFBsYXllclByb2ZpbGU6IGFzeW5jIChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGVOYW1lKSk7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oY29udGV4dC5hcGkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGZvcmNlUmVmcmVzaD8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgZmlsdGVyOiAoKSA9PiBbXSxcclxuICAgIHByZVNvcnQ6IG1ha2VQcmVTb3J0KGNvbnRleHQuYXBpKSxcclxuICAgIGdhbWVBcnRVUkw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgZGlzcGxheUNoZWNrYm94ZXM6IHRydWUsXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcjogYW55KSA9PiB3cml0ZUxvYWRPcmRlcihjb250ZXh0LmFwaSwgbG9hZE9yZGVyKSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXNzaW9uJywgJ2Jhc2UnLCAndG9vbHNSdW5uaW5nJ10sXHJcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXHJcbiAgICAgICAgLy8gY2hhbmdlZFxyXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZvcmNlUmVmcmVzaCAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIGZvcmNlUmVmcmVzaCgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgYXN5bmMgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlID09PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYWluO1xyXG4iXX0=