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
    const origFile = files.find(iter => ORIGINAL_FILES.has(iter.destination.toLowerCase()));
    const paks = files.filter(iter => path.extname(iter.destination).toLowerCase() === '.pak');
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
    return (React.createElement("div", { style: { display: 'flex', flexDirection: 'column' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap' } },
            t('Ingame Profile: '),
            React.createElement(react_bootstrap_1.FormControl, { componentClass: 'select', name: 'userProfile', className: 'form-control', value: currentProfile, onChange: onSelect }, getPlayerProfiles().map(prof => (React.createElement("option", { key: prof, value: prof }, prof))))),
        React.createElement("div", null, t('Please refer to mod descriptions from mod authors to determine the right order. '
            + 'If you can\'t find any suggestions for a mod, it probably doesn\'t matter.'))));
}
function writeLoadOrder(api, loadOrder) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = (_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile;
        if (!bg3profile) {
            vortex_api_1.log('warn', 'No Baldur\'s Gate 3 profile to save load order to');
            return;
        }
        const modSettings = yield readModSettings(api);
        try {
            const region = findNode(modSettings.save.region, 'ModuleSettings');
            const root = findNode(region.node, 'root');
            const modsNode = findNode(root.children[0].node, 'Mods');
            const loNode = findNode(root.children[0].node, 'ModOrder');
            if ((loNode.children === undefined) || (loNode.children[0] === '')) {
                loNode.children = [{ node: [] }];
            }
            const descriptionNodes = modsNode.children[0].node.filter(iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'Gustav')));
            const enabledPaks = Object.keys(loadOrder)
                .filter(key => { var _a; return !!((_a = loadOrder[key].data) === null || _a === void 0 ? void 0 : _a.uuid) && loadOrder[key].enabled; });
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
function extractPak(pakPath, destPath, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let returned = false;
            const exe = path.join(__dirname, 'tools', 'divine.exe');
            const args = [
                '--action', 'extract-package',
                '--source', pakPath,
                '--destination', destPath,
                '--loglevel', 'off',
                '--game', 'bg3',
                '--expression', pattern,
            ];
            const proc = child_process_1.spawn(exe, args, { cwd: path.join(__dirname, 'tools') });
            proc.stdout.on('data', data => vortex_api_1.log('debug', data));
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
                        resolve();
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
        if ((items.length === 0) && (storedLO !== undefined)) {
            return storedLO;
        }
        const state = api.getState();
        const paks = (yield vortex_api_1.fs.readdirAsync(modsPath()))
            .filter(fileName => path.extname(fileName).toLowerCase() === '.pak');
        const manifest = yield vortex_api_1.util.getManifest(api, '', GAME_ID);
        const result = [];
        for (const fileName of paks) {
            yield vortex_api_1.util.withErrorContext('reading pak', fileName, () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
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
                    let modInfo = (_a = existingItem) === null || _a === void 0 ? void 0 : _a.data;
                    if (modInfo === undefined) {
                        modInfo = yield extractPakInfo(path.join(modsPath(), fileName));
                    }
                    if (mod !== undefined) {
                        result.push({
                            id: fileName,
                            name: vortex_api_1.util.renderModName(mod),
                            imgUrl: (_c = (_b = mod.attributes) === null || _b === void 0 ? void 0 : _b.pictureUrl, (_c !== null && _c !== void 0 ? _c : fallbackPicture)),
                            data: modInfo,
                            external: false,
                        });
                    }
                    else {
                        result.push({
                            id: fileName,
                            name: path.basename(fileName, path.extname(fileName)),
                            imgUrl: fallbackPicture,
                            data: modInfo,
                            external: true,
                        });
                    }
                }
                catch (err) {
                    api.showErrorNotification('Failed to read pak', err);
                }
            }));
        }
        storedLO = result.sort((lhs, rhs) => items.indexOf(lhs) - items.indexOf(rhs));
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
                    'game/bin/TS4.exe',
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
            forceRefresh = props.forceRefreshIn;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGlEQUFzQztBQUV0QywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLHFEQUE4QztBQUM5Qyx5Q0FBeUM7QUFDekMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6QywyQ0FBc0U7QUFDdEUsbUNBQXFEO0FBR3JELE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztBQUMvQixNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBRXJELFNBQVMsU0FBUyxDQUFDLEtBQUs7SUFDdEIsT0FBTyxPQUFPLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUNuQyxDQUFDO0FBR0QsTUFBTSxnQkFBZ0IsR0FBRyx3QkFBWSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsTUFBTSxlQUFlLEdBQUcsd0JBQVksQ0FBQyxzQkFBc0IsRUFDekQsQ0FBQyxPQUFlLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBR2hGLE1BQU0sT0FBTyxHQUF1QjtJQUNsQyxRQUFRLEVBQUU7UUFDUixDQUFDLGdCQUF1QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLENBQUMsRUFBRSxPQUFPLENBQUM7UUFDOUYsQ0FBQyxlQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJ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QUFDLENBQUEsQ0FBQyxDQUFDO1FBRUwsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsU0FBaUIsRUFBRSxVQUFVLEVBQUUsRUFBRTtZQUNsRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsQ0FBQyxFQUFFO2dCQUNoRSxZQUFZLEVBQUUsQ0FBQzthQUNoQjtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQU8sUUFBZ0IsRUFBRSxFQUFFO1lBQ3JFLElBQUksUUFBUSxLQUFLLE9BQU8sRUFBRTtnQkFDeEIsSUFBSTtvQkFDRixNQUFNLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2pDO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQy9CLDJCQUEyQixFQUFFLEdBQUcsRUFBRTt3QkFDaEMsT0FBTyxFQUFFLDhDQUE4Qzt3QkFDdkQsV0FBVyxFQUFFLEtBQUs7cUJBQ25CLENBQUMsQ0FBQztpQkFDTjthQUNGO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEZvcm1Db250cm9sIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgY3JlYXRlQWN0aW9uIH0gZnJvbSAncmVkdXgtYWN0JztcclxuaW1wb3J0IHsgZ2VuZXJhdGUgYXMgc2hvcnRpZCB9IGZyb20gJ3Nob3J0aWQnO1xyXG5pbXBvcnQgd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSU1vZE5vZGUsIElNb2RTZXR0aW5ncywgSVBha0luZm8sIElYbWxOb2RlIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5jb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XHJcbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XHJcbmNvbnN0IExTTElCX1VSTCA9ICdodHRwczovL2dpdGh1Yi5jb20vTm9yYnl0ZS9sc2xpYic7XHJcblxyXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcclxuICByZXR1cm4gJyhefC8pJyArIGlucHV0ICsgJygvfCQpJztcclxufVxyXG5cclxuLy8gYWN0aW9uc1xyXG5jb25zdCBzZXRQbGF5ZXJQcm9maWxlID0gY3JlYXRlQWN0aW9uKCdCRzNfU0VUX1BMQVlFUlBST0ZJTEUnLCBuYW1lID0+IG5hbWUpO1xyXG5jb25zdCBzZXR0aW5nc1dyaXR0ZW4gPSBjcmVhdGVBY3Rpb24oJ0JHM19TRVRUSU5HU19XUklUVEVOJyxcclxuICAocHJvZmlsZTogc3RyaW5nLCB0aW1lOiBudW1iZXIsIGNvdW50OiBudW1iZXIpID0+ICh7IHByb2ZpbGUsIHRpbWUsIGNvdW50IH0pKTtcclxuXHJcbi8vIHJlZHVjZXJcclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0UGxheWVyUHJvZmlsZSBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwbGF5ZXJQcm9maWxlJ10sIHBheWxvYWQpLFxyXG4gICAgW3NldHRpbmdzV3JpdHRlbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgcGxheWVyUHJvZmlsZTogJycsXHJcbiAgICBzZXR0aW5nc1dyaXR0ZW46IHt9LFxyXG4gIH0sXHJcbn07XHJcblxyXG5mdW5jdGlvbiBkb2N1bWVudHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnTW9kcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9maWxlc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdQbGF5ZXJQcm9maWxlcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBhbnkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzE0NTY0NjA2NjknLCAnMTA4Njk0MCddKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpOiBhbnkge1xyXG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICB0aXRsZTogJ0JHMyBzdXBwb3J0IHVzZXMgTFNMaWInLFxyXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcclxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkgYXMgYW55KVxyXG4gICAgICAudGhlbigoKSA9PiBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdFYXJseSBBY2Nlc3MgR2FtZScsIHtcclxuICAgICAgICBiYmNvZGU6ICdCYWxkdXJcXCdzIEdhdGUgMyBpcyBjdXJyZW50bHkgaW4gRWFybHkgQWNjZXNzLiBJdCBkb2VzblxcJ3Qgb2ZmaWNpYWxseSAnXHJcbiAgICAgICAgICAgICsgJ3N1cHBvcnQgbW9kZGluZywgZG9lc25cXCd0IGluY2x1ZGUgYW55IG1vZGRpbmcgdG9vbHMgYW5kIHdpbGwgcmVjZWl2ZSAnXHJcbiAgICAgICAgICAgICsgJ2ZyZXF1ZW50IHVwZGF0ZXMuPGJyLz4nXHJcbiAgICAgICAgICAgICsgJ01vZHMgbWF5IGJlY29tZSBpbmNvbXBhdGlibGUgd2l0aGluIGRheXMgb2YgYmVpbmcgcmVsZWFzZWQsIGdlbmVyYWxseSAnXHJcbiAgICAgICAgICAgICsgJ25vdCB3b3JrIGFuZC9vciBicmVhayB1bnJlbGF0ZWQgdGhpbmdzIHdpdGhpbiB0aGUgZ2FtZS48YnIvPjxici8+J1xyXG4gICAgICAgICAgICArICdbY29sb3I9XCJyZWRcIl1QbGVhc2UgZG9uXFwndCByZXBvcnQgaXNzdWVzIHRoYXQgaGFwcGVuIGluIGNvbm5lY3Rpb24gd2l0aCBtb2RzIHRvIHRoZSAnXHJcbiAgICAgICAgICAgICsgJ2dhbWUgZGV2ZWxvcGVycyAoTGFyaWFuIFN0dWRpb3MpIG9yIHRocm91Z2ggdGhlIFZvcnRleCBmZWVkYmFjayBzeXN0ZW0uWy9jb2xvcl0nLFxyXG4gICAgICB9LCBbIHsgbGFiZWw6ICdJIHVuZGVyc3RhbmQnIH0gXSkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0R2FtZURhdGFQYXRoKGFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICBjb25zdCBnYW1lUGF0aCA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aDtcclxuICBpZiAoZ2FtZVBhdGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihnYW1lUGF0aCwgJ0RhdGEnKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IE9SSUdJTkFMX0ZJTEVTID0gbmV3IFNldChbXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdhc3NldHMucGFrJyxcclxuICAnZWZmZWN0cy5wYWsnLFxyXG4gICdlbmdpbmUucGFrJyxcclxuICAnZW5naW5lc2hhZGVycy5wYWsnLFxyXG4gICdnYW1lLnBhaycsXHJcbiAgJ2dhbWVwbGF0Zm9ybS5wYWsnLFxyXG4gICdndXN0YXYucGFrJyxcclxuICAnZ3VzdGF2X3RleHR1cmVzLnBhaycsXHJcbiAgJ2ljb25zLnBhaycsXHJcbiAgJ2xvd3RleC5wYWsnLFxyXG4gICdtYXRlcmlhbHMucGFrJyxcclxuICAnbWluaW1hcHMucGFrJyxcclxuICAnbW9kZWxzLnBhaycsXHJcbiAgJ3NoYXJlZC5wYWsnLFxyXG4gICdzaGFyZWRzb3VuZGJhbmtzLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kcy5wYWsnLFxyXG4gICd0ZXh0dXJlcy5wYWsnLFxyXG4gICd2aXJ0dWFsdGV4dHVyZXMucGFrJyxcclxuXSk7XHJcblxyXG5mdW5jdGlvbiBpc1JlcGxhY2VyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XHJcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT4gT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xyXG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoaXRlciA9PiBwYXRoLmV4dG5hbWUoaXRlci5kZXN0aW5hdGlvbikudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcclxuICBpZiAoKG9yaWdGaWxlICE9PSB1bmRlZmluZWQpIHx8IChwYWtzLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIGxvb2tzIGxpa2UgYSByZXBsYWNlcicsIHtcclxuICAgICAgYmJjb2RlOiAnVGhlIG1vZCB5b3UganVzdCBpbnN0YWxsZWQgbG9va3MgbGlrZSBhIFwicmVwbGFjZXJcIiwgbWVhbmluZyBpdCBpcyBpbnRlbmRlZCB0byByZXBsYWNlICdcclxuICAgICAgICAgICsgJ29uZSBvZiB0aGUgZmlsZXMgc2hpcHBlZCB3aXRoIHRoZSBnYW1lLjxici8+J1xyXG4gICAgICAgICAgKyAnWW91IHNob3VsZCBiZSBhd2FyZSB0aGF0IHN1Y2ggYSByZXBsYWNlciBpbmNsdWRlcyBhIGNvcHkgb2Ygc29tZSBnYW1lIGRhdGEgZnJvbSBhICdcclxuICAgICAgICAgICsgJ3NwZWNpZmljIHZlcnNpb24gb2YgdGhlIGdhbWUgYW5kIG1heSB0aGVyZWZvcmUgYnJlYWsgYXMgc29vbiBhcyB0aGUgZ2FtZSBnZXRzIHVwZGF0ZWQuPGJyLz4nXHJcbiAgICAgICAgICArICdFdmVuIGlmIGRvZXNuXFwndCBicmVhaywgaXQgbWF5IHJldmVydCBidWdmaXhlcyB0aGF0IHRoZSBnYW1lICdcclxuICAgICAgICAgICsgJ2RldmVsb3BlcnMgaGF2ZSBtYWRlLjxici8+PGJyLz4nXHJcbiAgICAgICAgICArICdUaGVyZWZvcmUgW2NvbG9yPVwicmVkXCJdcGxlYXNlIHRha2UgZXh0cmEgY2FyZSB0byBrZWVwIHRoaXMgbW9kIHVwZGF0ZWRbL2NvbG9yXSBhbmQgcmVtb3ZlIGl0IHdoZW4gaXQgJ1xyXG4gICAgICAgICAgKyAnbm8gbG9uZ2VyIG1hdGNoZXMgdGhlIGdhbWUgdmVyc2lvbi4nLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBNb2QgKHdpbGwgbGlrZWx5IG5vdCB3b3JrKScgfSxcclxuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgUmVwbGFjZXInIH0sXHJcbiAgICBdKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuYWN0aW9uID09PSAnSW5zdGFsbCBhcyBSZXBsYWNlcicpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IEJsdWViaXJkPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZDogcGFrcy5sZW5ndGggPT09IDAsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJlcGxhY2VyKGZpbGVzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlOiB0eXBlcy5Qcm9ncmVzc0RlbGVnYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBCbHVlYmlyZDx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xyXG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGZpbGVzLm1hcChmaWxlID0+IHBhdGguZGlybmFtZShmaWxlKS50b1VwcGVyQ2FzZSgpKSkpO1xyXG4gIGxldCBkYXRhUGF0aDogc3RyaW5nID0gZGlyZWN0b3JpZXMuZmluZChkaXIgPT4gcGF0aC5iYXNlbmFtZShkaXIpID09PSAnREFUQScpO1xyXG4gIGlmIChkYXRhUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBjb25zdCBnZW5PclB1YmxpYyA9IGRpcmVjdG9yaWVzXHJcbiAgICAgIC5maW5kKGRpciA9PiBbJ1BVQkxJQycsICdHRU5FUkFURUQnXS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGRpcikpKTtcclxuICAgIGlmIChnZW5PclB1YmxpYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRhdGFQYXRoID0gcGF0aC5kaXJuYW1lKGdlbk9yUHVibGljKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSAoZGF0YVBhdGggIT09IHVuZGVmaW5lZClcclxuICAgID8gZmlsZXMucmVkdWNlKChwcmV2OiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKSB7XHJcbiAgICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGF0YVBhdGgsIGZpbGVQYXRoKTtcclxuICAgICAgaWYgKCFyZWxQYXRoLnN0YXJ0c1dpdGgoJy4uJykpIHtcclxuICAgICAgICBwcmV2LnB1c2goe1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiByZWxQYXRoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSwgW10pXHJcbiAgICA6IGZpbGVzLm1hcCgoZmlsZVBhdGg6IHN0cmluZyk6IHR5cGVzLklJbnN0cnVjdGlvbiA9PiAoe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBmaWxlUGF0aCxcclxuICAgICAgfSkpO1xyXG5cclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7XHJcbiAgICBpbnN0cnVjdGlvbnMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmNvbnN0IGdldFBsYXllclByb2ZpbGVzID0gKCgpID0+IHtcclxuICBsZXQgY2FjaGVkID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGNhY2hlZCA9IChmcyBhcyBhbnkpLnJlYWRkaXJTeW5jKHByb2ZpbGVzUGF0aCgpKVxyXG4gICAgICAgIC5maWx0ZXIobmFtZSA9PiAocGF0aC5leHRuYW1lKG5hbWUpID09PSAnJykgJiYgKG5hbWUgIT09ICdEZWZhdWx0JykpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiAoKSA9PiBjYWNoZWQ7XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHMpIHtcclxuICBjb25zdCB7IHQsIGN1cnJlbnRQcm9maWxlLCBvblNldFBsYXllclByb2ZpbGUgfSA9IHByb3BzO1xyXG5cclxuICBjb25zdCBvblNlbGVjdCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldikgPT4ge1xyXG4gICAgb25TZXRQbGF5ZXJQcm9maWxlKGV2LmN1cnJlbnRUYXJnZXQudmFsdWUpO1xyXG4gIH0sIFtvblNldFBsYXllclByb2ZpbGVdKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyB9fT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnIH19PlxyXG4gICAgICAgIHt0KCdJbmdhbWUgUHJvZmlsZTogJyl9XHJcbiAgICAgICAgPEZvcm1Db250cm9sXHJcbiAgICAgICAgICBjb21wb25lbnRDbGFzcz0nc2VsZWN0J1xyXG4gICAgICAgICAgbmFtZT0ndXNlclByb2ZpbGUnXHJcbiAgICAgICAgICBjbGFzc05hbWU9J2Zvcm0tY29udHJvbCdcclxuICAgICAgICAgIHZhbHVlPXtjdXJyZW50UHJvZmlsZX1cclxuICAgICAgICAgIG9uQ2hhbmdlPXtvblNlbGVjdH1cclxuICAgICAgICA+XHJcbiAgICAgICAgICB7Z2V0UGxheWVyUHJvZmlsZXMoKS5tYXAocHJvZiA9PiAoPG9wdGlvbiBrZXk9e3Byb2Z9IHZhbHVlPXtwcm9mfT57cHJvZn08L29wdGlvbj4pKX1cclxuICAgICAgICA8L0Zvcm1Db250cm9sPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnUGxlYXNlIHJlZmVyIHRvIG1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyB0byBkZXRlcm1pbmUgdGhlIHJpZ2h0IG9yZGVyLiAnXHJcbiAgICAgICAgICArICdJZiB5b3UgY2FuXFwndCBmaW5kIGFueSBzdWdnZXN0aW9ucyBmb3IgYSBtb2QsIGl0IHByb2JhYmx5IGRvZXNuXFwndCBtYXR0ZXIuJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHsgW2tleTogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0pIHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcblxyXG4gIGlmICghYmczcHJvZmlsZSkge1xyXG4gICAgbG9nKCd3YXJuJywgJ05vIEJhbGR1clxcJ3MgR2F0ZSAzIHByb2ZpbGUgdG8gc2F2ZSBsb2FkIG9yZGVyIHRvJyk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVnaW9uID0gZmluZE5vZGUobW9kU2V0dGluZ3Muc2F2ZS5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gICAgY29uc3Qgcm9vdCA9IGZpbmROb2RlKHJlZ2lvbi5ub2RlLCAncm9vdCcpO1xyXG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290LmNoaWxkcmVuWzBdLm5vZGUsICdNb2RzJyk7XHJcbiAgICBjb25zdCBsb05vZGUgPSBmaW5kTm9kZShyb290LmNoaWxkcmVuWzBdLm5vZGUsICdNb2RPcmRlcicpO1xyXG4gICAgaWYgKChsb05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChsb05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XHJcbiAgICAgIGxvTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xyXG4gICAgfVxyXG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxyXG4gICAgY29uc3QgZGVzY3JpcHRpb25Ob2RlcyA9IG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUuZmlsdGVyKGl0ZXIgPT5cclxuICAgICAgaXRlci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gJ0d1c3RhdicpKSk7XHJcblxyXG4gICAgY29uc3QgZW5hYmxlZFBha3MgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gISFsb2FkT3JkZXJba2V5XS5kYXRhPy51dWlkICYmIGxvYWRPcmRlcltrZXldLmVuYWJsZWQpO1xyXG5cclxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIGVuYWJsZWRQYWtzKSB7XHJcbiAgICAgIC8vIGNvbnN0IG1kNSA9IGF3YWl0IHV0aWwuZmlsZU1ENShwYXRoLmpvaW4obW9kc1BhdGgoKSwga2V5KSk7XHJcbiAgICAgIGRlc2NyaXB0aW9uTm9kZXMucHVzaCh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZVNob3J0RGVzYycgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5mb2xkZXIgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTUQ1JywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEubWQ1IH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ05hbWUnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5uYW1lIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb24nLCB0eXBlOiAnaW50MzInLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS52ZXJzaW9uIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGVuYWJsZWRQYWtzXHJcbiAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gbG9hZE9yZGVyW2xoc10ucG9zIC0gbG9hZE9yZGVyW3Joc10ucG9zKVxyXG4gICAgICAubWFwKChrZXk6IHN0cmluZyk6IElNb2ROb2RlID0+ICh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XHJcbiAgICBsb05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGxvYWRPcmRlck5vZGVzO1xyXG5cclxuICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncyk7XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0dGluZ3NXcml0dGVuKGJnM3Byb2ZpbGUsIERhdGUubm93KCksIGVuYWJsZWRQYWtzLmxlbmd0aCkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrKHBha1BhdGgsIGRlc3RQYXRoLCBwYXR0ZXJuKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGxldCByZXR1cm5lZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgY29uc3QgZXhlID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ3Rvb2xzJywgJ2RpdmluZS5leGUnKTtcclxuICAgIGNvbnN0IGFyZ3MgPSBbXHJcbiAgICAgICctLWFjdGlvbicsICdleHRyYWN0LXBhY2thZ2UnLFxyXG4gICAgICAnLS1zb3VyY2UnLCBwYWtQYXRoLFxyXG4gICAgICAnLS1kZXN0aW5hdGlvbicsIGRlc3RQYXRoLFxyXG4gICAgICAnLS1sb2dsZXZlbCcsICdvZmYnLFxyXG4gICAgICAnLS1nYW1lJywgJ2JnMycsXHJcbiAgICAgICctLWV4cHJlc3Npb24nLCBwYXR0ZXJuLFxyXG4gICAgXTtcclxuICAgIGNvbnN0IHByb2MgPSBzcGF3bihleGUsIGFyZ3MsIHsgY3dkOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAndG9vbHMnKSB9KTtcclxuXHJcbiAgICBwcm9jLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4gbG9nKCdkZWJ1ZycsIGRhdGEpKTtcclxuICAgIHByb2Muc3RkZXJyLm9uKCdkYXRhJywgZGF0YSA9PiBsb2coJ3dhcm4nLCBkYXRhKSk7XHJcbiAgICBwcm9jLm9uKCdlcnJvcicsIChlcnJJbjogRXJyb3IpID0+IHtcclxuICAgICAgaWYgKCFyZXR1cm5lZCkge1xyXG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ2RpdmluZS5leGUgZmFpbGVkOiAnICsgZXJySW4ubWVzc2FnZSk7XHJcbiAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBwcm9jLm9uKCdleGl0JywgKGNvZGU6IG51bWJlcikgPT4ge1xyXG4gICAgICBpZiAoIXJldHVybmVkKSB7XHJcbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIGRpdmluZS5leGUgcmV0dXJucyB0aGUgYWN0dWFsIGVycm9yIGNvZGUgKyAxMDAgaWYgYSBmYXRhbCBlcnJvciBvY2N1cmVkXHJcbiAgICAgICAgICBpZiAoY29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICBjb2RlIC09IDEwMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7Y29kZX1gKTtcclxuICAgICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XHJcbiAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IG1ldGFQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndGVtcCcpLCAnbHNtZXRhJywgc2hvcnRpZCgpKTtcclxuICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhtZXRhUGF0aCk7XHJcbiAgYXdhaXQgZXh0cmFjdFBhayhwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcclxuICB0cnkge1xyXG4gICAgLy8gdGhlIG1ldGEubHN4IG1heSBiZSBpbiBhIHN1YmRpcmVjdG9yeS4gVGhlcmUgaXMgcHJvYmFibHkgYSBwYXR0ZXJuIGhlcmVcclxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXHJcbiAgICBsZXQgbWV0YUxTWFBhdGg6IHN0cmluZyA9IHBhdGguam9pbihtZXRhUGF0aCwgJ21ldGEubHN4Jyk7XHJcbiAgICBhd2FpdCB3YWxrKG1ldGFQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XHJcbiAgICAgIGlmICh0ZW1wICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBtZXRhTFNYUGF0aCA9IHRlbXAuZmlsZVBhdGg7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtZXRhTFNYUGF0aCk7XHJcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XHJcbiAgICByZXR1cm4gbWV0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE5vZGU8VCBleHRlbmRzIElYbWxOb2RlPHsgaWQ6IHN0cmluZyB9PiwgVT4obm9kZXM6IFRbXSwgaWQ6IHN0cmluZyk6IFQge1xyXG4gIHJldHVybiBub2Rlcz8uZmluZChpdGVyID0+IGl0ZXIuJC5pZCA9PT0gaWQpID8/IHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBha0luZm8ocGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJUGFrSW5mbz4ge1xyXG4gIGNvbnN0IG1ldGEgPSBhd2FpdCBleHRyYWN0TWV0YShwYWtQYXRoKTtcclxuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtZXRhPy5zYXZlPy5yZWdpb24sICdDb25maWcnKTtcclxuICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xyXG4gIGNvbnN0IG1vZHVsZUluZm8gPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kdWxlSW5mbycpO1xyXG5cclxuICBjb25zdCBhdHRyID0gKG5hbWU6IHN0cmluZywgZmFsbGJhY2s6ICgpID0+IGFueSkgPT5cclxuICAgIGZpbmROb2RlKG1vZHVsZUluZm8/LmF0dHJpYnV0ZSwgbmFtZSk/LiQ/LnZhbHVlID8/IGZhbGxiYWNrKCk7XHJcblxyXG4gIGNvbnN0IGdlbk5hbWUgPSBwYXRoLmJhc2VuYW1lKHBha1BhdGgsIHBhdGguZXh0bmFtZShwYWtQYXRoKSk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBhdXRob3I6IGF0dHIoJ0F1dGhvcicsICgpID0+ICdVbmtub3duJyksXHJcbiAgICBkZXNjcmlwdGlvbjogYXR0cignRGVzY3JpcHRpb24nLCAoKSA9PiAnTWlzc2luZycpLFxyXG4gICAgZm9sZGVyOiBhdHRyKCdGb2xkZXInLCAoKSA9PiBnZW5OYW1lKSxcclxuICAgIG1kNTogYXR0cignTUQ1JywgKCkgPT4gJycpLFxyXG4gICAgbmFtZTogYXR0cignTmFtZScsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgdHlwZTogYXR0cignVHlwZScsICgpID0+ICdBZHZlbnR1cmUnKSxcclxuICAgIHV1aWQ6IGF0dHIoJ1VVSUQnLCAoKSA9PiByZXF1aXJlKCd1dWlkJykudjQoKSksXHJcbiAgICB2ZXJzaW9uOiBhdHRyKCdWZXJzaW9uJywgKCkgPT4gJzEnKSxcclxuICB9O1xyXG59XHJcblxyXG5jb25zdCBmYWxsYmFja1BpY3R1cmUgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZ2FtZWFydC5qcGcnKTtcclxuXHJcbmxldCBzdG9yZWRMTzogYW55W107XHJcblxyXG5mdW5jdGlvbiBwYXJzZU1vZE5vZGUobm9kZTogSU1vZE5vZGUpIHtcclxuICBjb25zdCBuYW1lID0gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdOYW1lJykuJC52YWx1ZTtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IG5hbWUsXHJcbiAgICBuYW1lLFxyXG4gICAgZGF0YTogZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJC52YWx1ZSxcclxuICB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGxldCBiZzNwcm9maWxlOiBzdHJpbmcgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcbiAgaWYgKCFiZzNwcm9maWxlKSB7XHJcbiAgICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IGdldFBsYXllclByb2ZpbGVzKCk7XHJcbiAgICBpZiAocGxheWVyUHJvZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHN0b3JlZExPID0gW107XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGJnM3Byb2ZpbGUgPSBnZXRQbGF5ZXJQcm9maWxlcygpWzBdO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZXR0aW5nc1BhdGgpO1xyXG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRhdGE6IElNb2RTZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGxldCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcbiAgaWYgKCFiZzNwcm9maWxlKSB7XHJcbiAgICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IGdldFBsYXllclByb2ZpbGVzKCk7XHJcbiAgICBpZiAocGxheWVyUHJvZmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHN0b3JlZExPID0gW107XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGJnM3Byb2ZpbGUgPSBnZXRQbGF5ZXJQcm9maWxlcygpWzBdO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcblxyXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XHJcbiAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoc2V0dGluZ3NQYXRoLCB4bWwpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkU3RvcmVkTE8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcclxuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcbiAgY29uc3QgbW9kc1Jvb3QgPSBmaW5kTm9kZShjb25maWdSb290LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdC5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG4gIGNvbnN0IG1vZE5vZGVzID0gbW9kc1Jvb3QuY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuXHJcbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcclxuXHJcbiAgLy8gcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAobW9kTm9kZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICBjb25zdCBsYXN0V3JpdGUgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnNldHRpbmdzV3JpdHRlbj8uW2JnM3Byb2ZpbGVdO1xyXG4gICAgaWYgKChsYXN0V3JpdGUgIT09IHVuZGVmaW5lZCkgJiYgKGxhc3RXcml0ZS5jb3VudCA+IDEpKSB7XHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgICB0aXRsZTogJ1wibW9kc2V0dGluZ3MubHN4XCIgZmlsZSB3YXMgcmVzZXQnLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdUaGlzIHVzdWFsbHkgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgbW9kIGlzIGluc3RhbGxlZCcsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xyXG4gICAgLm1hcChub2RlID0+IHBhcnNlTW9kTm9kZShub2RlKSlcclxuICAgIC8vIEd1c3RhdiBpcyB0aGUgY29yZSBnYW1lXHJcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcclxuICAgIC8vIHNvcnQgYnkgdGhlIGluZGV4IG9mIGVhY2ggbW9kIGluIHRoZSBtb2RPcmRlciBsaXN0XHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG1vZE9yZGVyXHJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlUHJlU29ydChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyB3b3JrYXJvdW5kIGZvciBtb2RfbG9hZF9vcmRlciBiZWluZyBidWdnZWQgYWYsIGl0IHdpbGwgb2NjYXNpb25hbGx5IGNhbGwgcHJlU29ydFxyXG4gIC8vIHdpdGggYSBmcmVzaCBsaXN0IG9mIG1vZHMgZnJvbSBmaWx0ZXIsIGNvbXBsZXRlbHkgaWdub3JpbmcgcHJldmlvdXMgc29ydCByZXN1bHRzXHJcblxyXG4gIHJldHVybiBhc3luYyAoaXRlbXM6IGFueVtdLCBzb3J0RGlyOiBhbnksIHVwZGF0ZVR5cGU6IGFueSk6IFByb21pc2U8YW55W10+ID0+IHtcclxuICAgIGlmICgoaXRlbXMubGVuZ3RoID09PSAwKSAmJiAoc3RvcmVkTE8gIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgcmV0dXJuIHN0b3JlZExPO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcblxyXG4gICAgY29uc3QgbWFuaWZlc3QgPSBhd2FpdCB1dGlsLmdldE1hbmlmZXN0KGFwaSwgJycsIEdBTUVfSUQpO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpbGVOYW1lIG9mIHBha3MpIHtcclxuICAgICAgYXdhaXQgKHV0aWwgYXMgYW55KS53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSXRlbSA9IGl0ZW1zLmZpbmQoaXRlciA9PiBpdGVyLmlkID09PSBmaWxlTmFtZSk7XHJcbiAgICAgICAgICBpZiAoKGV4aXN0aW5nSXRlbSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICYmICh1cGRhdGVUeXBlICE9PSAncmVmcmVzaCcpXHJcbiAgICAgICAgICAgICAgJiYgKGV4aXN0aW5nSXRlbS5pbWdVcmwgIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZXhpc3RpbmdJdGVtKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBtYW5pZmVzdC5maWxlcy5maW5kKGVudHJ5ID0+IGVudHJ5LnJlbFBhdGggPT09IGZpbGVOYW1lKTtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IG1hbmlmZXN0RW50cnkgIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXVttYW5pZmVzdEVudHJ5LnNvdXJjZV1cclxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgbGV0IG1vZEluZm8gPSBleGlzdGluZ0l0ZW0/LmRhdGE7XHJcbiAgICAgICAgICBpZiAobW9kSW5mbyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1vZEluZm8gPSBhd2FpdCBleHRyYWN0UGFrSW5mbyhwYXRoLmpvaW4obW9kc1BhdGgoKSwgZmlsZU5hbWUpKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAobW9kICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gcGFrIGlzIGZyb20gYSBtb2QgKGFuIGluc3RhbGxlZCBvbmUpXHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcclxuICAgICAgICAgICAgICBpZDogZmlsZU5hbWUsXHJcbiAgICAgICAgICAgICAgbmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXHJcbiAgICAgICAgICAgICAgaW1nVXJsOiBtb2QuYXR0cmlidXRlcz8ucGljdHVyZVVybCA/PyBmYWxsYmFja1BpY3R1cmUsXHJcbiAgICAgICAgICAgICAgZGF0YTogbW9kSW5mbyxcclxuICAgICAgICAgICAgICBleHRlcm5hbDogZmFsc2UsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xyXG4gICAgICAgICAgICAgIGlkOiBmaWxlTmFtZSxcclxuICAgICAgICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVOYW1lLCBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpKSxcclxuICAgICAgICAgICAgICBpbWdVcmw6IGZhbGxiYWNrUGljdHVyZSxcclxuICAgICAgICAgICAgICBkYXRhOiBtb2RJbmZvLFxyXG4gICAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhaycsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHN0b3JlZExPID0gcmVzdWx0LnNvcnQoKGxocywgcmhzKSA9PiBpdGVtcy5pbmRleE9mKGxocykgLSBpdGVtcy5pbmRleE9mKHJocykpO1xyXG4gICAgcmV0dXJuIHN0b3JlZExPO1xyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAnZXhldnVsa2FuJyxcclxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxyXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAgICAgJ2dhbWUvYmluL1RTNC5leGUnLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBzZXR1cDogZGlzY292ZXJ5ID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL2JnM19keDExLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogJzEwODY5NDAnLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogMTA4Njk0MCxcclxuICAgICAgc3RvcFBhdHRlcm5zOiBTVE9QX1BBVFRFUk5TLm1hcCh0b1dvcmRFeHApLFxyXG4gICAgICBpZ25vcmVDb25mbGljdHM6IFtcclxuICAgICAgICAnaW5mby5qc29uJyxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGxldCBmb3JjZVJlZnJlc2g6ICgpID0+IHZvaWQ7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtcmVwbGFjZXInLCAyNSwgdGVzdFJlcGxhY2VyLCBpbnN0YWxsUmVwbGFjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLXJlcGxhY2VyJywgMjUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIGZpbGVzID0+IGlzUmVwbGFjZXIoY29udGV4dC5hcGksIGZpbGVzKSxcclxuICAgIHsgbmFtZTogJ0JHMyBSZXBsYWNlcicgfSBhcyBhbnkpO1xyXG5cclxuICAoY29udGV4dCBhcyBhbnkpLnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICBmb3JjZVJlZnJlc2ggPSBwcm9wcy5mb3JjZVJlZnJlc2hJbjtcclxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSW5mb1BhbmVsLCB7XHJcbiAgICAgICAgdDogY29udGV4dC5hcGkudHJhbnNsYXRlLFxyXG4gICAgICAgIGN1cnJlbnRQcm9maWxlOiBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZSxcclxuICAgICAgICBvblNldFBsYXllclByb2ZpbGU6IGFzeW5jIChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGVOYW1lKSk7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oY29udGV4dC5hcGkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGZvcmNlUmVmcmVzaD8uKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgZmlsdGVyOiAoKSA9PiBbXSxcclxuICAgIHByZVNvcnQ6IG1ha2VQcmVTb3J0KGNvbnRleHQuYXBpKSxcclxuICAgIGdhbWVBcnRVUkw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgZGlzcGxheUNoZWNrYm94ZXM6IHRydWUsXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcjogYW55KSA9PiB3cml0ZUxvYWRPcmRlcihjb250ZXh0LmFwaSwgbG9hZE9yZGVyKSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXNzaW9uJywgJ2Jhc2UnLCAndG9vbHNSdW5uaW5nJ10sXHJcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXHJcbiAgICAgICAgLy8gY2hhbmdlZFxyXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZvcmNlUmVmcmVzaCAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIGZvcmNlUmVmcmVzaCgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgYXN5bmMgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlID09PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYWluO1xyXG4iXX0=