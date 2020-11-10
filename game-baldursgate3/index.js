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
                    let res;
                    if (mod !== undefined) {
                        res = {
                            id: fileName,
                            name: vortex_api_1.util.renderModName(mod),
                            imgUrl: (_c = (_b = mod.attributes) === null || _b === void 0 ? void 0 : _b.pictureUrl, (_c !== null && _c !== void 0 ? _c : fallbackPicture)),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGlEQUFzQztBQUV0QywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLHFEQUE4QztBQUM5Qyx5Q0FBeUM7QUFDekMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6QywyQ0FBc0U7QUFDdEUsbUNBQXFEO0FBR3JELE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztBQUMvQixNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sU0FBUyxHQUFHLGtDQUFrQyxDQUFDO0FBRXJELFNBQVMsU0FBUyxDQUFDLEtBQUs7SUFDdEIsT0FBTyxPQUFPLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUNuQyxDQUFDO0FBR0QsTUFBTSxnQkFBZ0IsR0FBRyx3QkFBWSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsTUFBTSxlQUFlLEdBQUcsd0JBQVksQ0FBQyxzQkFBc0IsRUFDekQsQ0FBQyxPQUFlLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBR2hGLE1BQU0sT0FBTyxHQUF1QjtJQUNsQyxRQUFRLEVBQUU7UUFDUixDQUFDLGdCQUF1QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLENBQUMsRUFBRSxPQUFPLENBQUM7UUFDOUYsQ0FBQyxlQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJ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UUFBUSxLQUFLLE9BQU8sRUFBRTtnQkFDeEIsSUFBSTtvQkFDRixNQUFNLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2pDO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQy9CLDJCQUEyQixFQUFFLEdBQUcsRUFBRTt3QkFDaEMsT0FBTyxFQUFFLDhDQUE4Qzt3QkFDdkQsV0FBVyxFQUFFLEtBQUs7cUJBQ25CLENBQUMsQ0FBQztpQkFDTjthQUNGO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEZvcm1Db250cm9sIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgY3JlYXRlQWN0aW9uIH0gZnJvbSAncmVkdXgtYWN0JztcclxuaW1wb3J0IHsgZ2VuZXJhdGUgYXMgc2hvcnRpZCB9IGZyb20gJ3Nob3J0aWQnO1xyXG5pbXBvcnQgd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSU1vZE5vZGUsIElNb2RTZXR0aW5ncywgSVBha0luZm8sIElYbWxOb2RlIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5jb25zdCBHQU1FX0lEID0gJ2JhbGR1cnNnYXRlMyc7XHJcbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XHJcbmNvbnN0IExTTElCX1VSTCA9ICdodHRwczovL2dpdGh1Yi5jb20vTm9yYnl0ZS9sc2xpYic7XHJcblxyXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcclxuICByZXR1cm4gJyhefC8pJyArIGlucHV0ICsgJygvfCQpJztcclxufVxyXG5cclxuLy8gYWN0aW9uc1xyXG5jb25zdCBzZXRQbGF5ZXJQcm9maWxlID0gY3JlYXRlQWN0aW9uKCdCRzNfU0VUX1BMQVlFUlBST0ZJTEUnLCBuYW1lID0+IG5hbWUpO1xyXG5jb25zdCBzZXR0aW5nc1dyaXR0ZW4gPSBjcmVhdGVBY3Rpb24oJ0JHM19TRVRUSU5HU19XUklUVEVOJyxcclxuICAocHJvZmlsZTogc3RyaW5nLCB0aW1lOiBudW1iZXIsIGNvdW50OiBudW1iZXIpID0+ICh7IHByb2ZpbGUsIHRpbWUsIGNvdW50IH0pKTtcclxuXHJcbi8vIHJlZHVjZXJcclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0UGxheWVyUHJvZmlsZSBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwbGF5ZXJQcm9maWxlJ10sIHBheWxvYWQpLFxyXG4gICAgW3NldHRpbmdzV3JpdHRlbiBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcclxuICAgICAgY29uc3QgeyBwcm9maWxlLCB0aW1lLCBjb3VudCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgcGxheWVyUHJvZmlsZTogJycsXHJcbiAgICBzZXR0aW5nc1dyaXR0ZW46IHt9LFxyXG4gIH0sXHJcbn07XHJcblxyXG5mdW5jdGlvbiBkb2N1bWVudHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnTW9kcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9maWxlc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdQbGF5ZXJQcm9maWxlcycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBhbnkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzE0NTY0NjA2NjknLCAnMTA4Njk0MCddKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpOiBhbnkge1xyXG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ2JnMy11c2VzLWxzbGliJyxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIHRpdGxlOiAnQkczIHN1cHBvcnQgdXNlcyBMU0xpYicsXHJcbiAgICBtZXNzYWdlOiBMU0xJQl9VUkwsXHJcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgYWN0aW9uczogW1xyXG4gICAgICB7IHRpdGxlOiAnVmlzaXQgUGFnZScsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oTFNMSUJfVVJMKS5jYXRjaCgoKSA9PiBudWxsKSB9LFxyXG4gICAgXSxcclxuICB9KTtcclxuICByZXR1cm4gZnMuc3RhdEFzeW5jKG1wKVxyXG4gICAgLmNhdGNoKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobXAsICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSBhcyBhbnkpXHJcbiAgICAgIC50aGVuKCgpID0+IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0Vhcmx5IEFjY2VzcyBHYW1lJywge1xyXG4gICAgICAgIGJiY29kZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIGlzIGN1cnJlbnRseSBpbiBFYXJseSBBY2Nlc3MuIEl0IGRvZXNuXFwndCBvZmZpY2lhbGx5ICdcclxuICAgICAgICAgICAgKyAnc3VwcG9ydCBtb2RkaW5nLCBkb2VzblxcJ3QgaW5jbHVkZSBhbnkgbW9kZGluZyB0b29scyBhbmQgd2lsbCByZWNlaXZlICdcclxuICAgICAgICAgICAgKyAnZnJlcXVlbnQgdXBkYXRlcy48YnIvPidcclxuICAgICAgICAgICAgKyAnTW9kcyBtYXkgYmVjb21lIGluY29tcGF0aWJsZSB3aXRoaW4gZGF5cyBvZiBiZWluZyByZWxlYXNlZCwgZ2VuZXJhbGx5ICdcclxuICAgICAgICAgICAgKyAnbm90IHdvcmsgYW5kL29yIGJyZWFrIHVucmVsYXRlZCB0aGluZ3Mgd2l0aGluIHRoZSBnYW1lLjxici8+PGJyLz4nXHJcbiAgICAgICAgICAgICsgJ1tjb2xvcj1cInJlZFwiXVBsZWFzZSBkb25cXCd0IHJlcG9ydCBpc3N1ZXMgdGhhdCBoYXBwZW4gaW4gY29ubmVjdGlvbiB3aXRoIG1vZHMgdG8gdGhlICdcclxuICAgICAgICAgICAgKyAnZ2FtZSBkZXZlbG9wZXJzIChMYXJpYW4gU3R1ZGlvcykgb3IgdGhyb3VnaCB0aGUgVm9ydGV4IGZlZWRiYWNrIHN5c3RlbS5bL2NvbG9yXScsXHJcbiAgICAgIH0sIFsgeyBsYWJlbDogJ0kgdW5kZXJzdGFuZCcgfSBdKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRHYW1lRGF0YVBhdGgoYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gIGNvbnN0IGdhbWVQYXRoID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZD8uW0dBTUVfSURdPy5wYXRoO1xyXG4gIGlmIChnYW1lUGF0aCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKGdhbWVQYXRoLCAnRGF0YScpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgT1JJR0lOQUxfRklMRVMgPSBuZXcgU2V0KFtcclxuICAnYXNzZXRzLnBhaycsXHJcbiAgJ2Fzc2V0cy5wYWsnLFxyXG4gICdlZmZlY3RzLnBhaycsXHJcbiAgJ2VuZ2luZS5wYWsnLFxyXG4gICdlbmdpbmVzaGFkZXJzLnBhaycsXHJcbiAgJ2dhbWUucGFrJyxcclxuICAnZ2FtZXBsYXRmb3JtLnBhaycsXHJcbiAgJ2d1c3Rhdi5wYWsnLFxyXG4gICdndXN0YXZfdGV4dHVyZXMucGFrJyxcclxuICAnaWNvbnMucGFrJyxcclxuICAnbG93dGV4LnBhaycsXHJcbiAgJ21hdGVyaWFscy5wYWsnLFxyXG4gICdtaW5pbWFwcy5wYWsnLFxyXG4gICdtb2RlbHMucGFrJyxcclxuICAnc2hhcmVkLnBhaycsXHJcbiAgJ3NoYXJlZHNvdW5kYmFua3MucGFrJyxcclxuICAnc2hhcmVkc291bmRzLnBhaycsXHJcbiAgJ3RleHR1cmVzLnBhaycsXHJcbiAgJ3ZpcnR1YWx0ZXh0dXJlcy5wYWsnLFxyXG5dKTtcclxuXHJcbmZ1bmN0aW9uIGlzUmVwbGFjZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcclxuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PiBPUklHSU5BTF9GSUxFUy5oYXMoaXRlci5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihpdGVyID0+IHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xyXG4gIGlmICgob3JpZ0ZpbGUgIT09IHVuZGVmaW5lZCkgfHwgKHBha3MubGVuZ3RoID09PSAwKSkge1xyXG4gICAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdNb2QgbG9va3MgbGlrZSBhIHJlcGxhY2VyJywge1xyXG4gICAgICBiYmNvZGU6ICdUaGUgbW9kIHlvdSBqdXN0IGluc3RhbGxlZCBsb29rcyBsaWtlIGEgXCJyZXBsYWNlclwiLCBtZWFuaW5nIGl0IGlzIGludGVuZGVkIHRvIHJlcGxhY2UgJ1xyXG4gICAgICAgICAgKyAnb25lIG9mIHRoZSBmaWxlcyBzaGlwcGVkIHdpdGggdGhlIGdhbWUuPGJyLz4nXHJcbiAgICAgICAgICArICdZb3Ugc2hvdWxkIGJlIGF3YXJlIHRoYXQgc3VjaCBhIHJlcGxhY2VyIGluY2x1ZGVzIGEgY29weSBvZiBzb21lIGdhbWUgZGF0YSBmcm9tIGEgJ1xyXG4gICAgICAgICAgKyAnc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgZ2FtZSBhbmQgbWF5IHRoZXJlZm9yZSBicmVhayBhcyBzb29uIGFzIHRoZSBnYW1lIGdldHMgdXBkYXRlZC48YnIvPidcclxuICAgICAgICAgICsgJ0V2ZW4gaWYgZG9lc25cXCd0IGJyZWFrLCBpdCBtYXkgcmV2ZXJ0IGJ1Z2ZpeGVzIHRoYXQgdGhlIGdhbWUgJ1xyXG4gICAgICAgICAgKyAnZGV2ZWxvcGVycyBoYXZlIG1hZGUuPGJyLz48YnIvPidcclxuICAgICAgICAgICsgJ1RoZXJlZm9yZSBbY29sb3I9XCJyZWRcIl1wbGVhc2UgdGFrZSBleHRyYSBjYXJlIHRvIGtlZXAgdGhpcyBtb2QgdXBkYXRlZFsvY29sb3JdIGFuZCByZW1vdmUgaXQgd2hlbiBpdCAnXHJcbiAgICAgICAgICArICdubyBsb25nZXIgbWF0Y2hlcyB0aGUgZ2FtZSB2ZXJzaW9uLicsXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdJbnN0YWxsIGFzIE1vZCAod2lsbCBsaWtlbHkgbm90IHdvcmspJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBSZXBsYWNlcicgfSxcclxuICAgIF0pLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC5hY3Rpb24gPT09ICdJbnN0YWxsIGFzIFJlcGxhY2VyJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSZXBsYWNlcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogQmx1ZWJpcmQ8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbiAgfVxyXG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcclxuXHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiBwYWtzLmxlbmd0aCA9PT0gMCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IEJsdWViaXJkPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoZmlsZXMubWFwKGZpbGUgPT4gcGF0aC5kaXJuYW1lKGZpbGUpLnRvVXBwZXJDYXNlKCkpKSk7XHJcbiAgbGV0IGRhdGFQYXRoOiBzdHJpbmcgPSBkaXJlY3Rvcmllcy5maW5kKGRpciA9PiBwYXRoLmJhc2VuYW1lKGRpcikgPT09ICdEQVRBJyk7XHJcbiAgaWYgKGRhdGFQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGNvbnN0IGdlbk9yUHVibGljID0gZGlyZWN0b3JpZXNcclxuICAgICAgLmZpbmQoZGlyID0+IFsnUFVCTElDJywgJ0dFTkVSQVRFRCddLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZGlyKSkpO1xyXG4gICAgaWYgKGdlbk9yUHVibGljICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGF0YVBhdGggPSBwYXRoLmRpcm5hbWUoZ2VuT3JQdWJsaWMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IChkYXRhUGF0aCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBmaWxlcy5yZWR1Y2UoKHByZXY6IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcclxuICAgICAgICByZXR1cm4gcHJldjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkYXRhUGF0aCwgZmlsZVBhdGgpO1xyXG4gICAgICBpZiAoIXJlbFBhdGguc3RhcnRzV2l0aCgnLi4nKSkge1xyXG4gICAgICAgIHByZXYucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHJlbFBhdGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LCBbXSlcclxuICAgIDogZmlsZXMubWFwKChmaWxlUGF0aDogc3RyaW5nKTogdHlwZXMuSUluc3RydWN0aW9uID0+ICh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgZGVzdGluYXRpb246IGZpbGVQYXRoLFxyXG4gICAgICB9KSk7XHJcblxyXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHtcclxuICAgIGluc3RydWN0aW9ucyxcclxuICB9KTtcclxufVxyXG5cclxuY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xyXG4gIGxldCBjYWNoZWQgPSBbXTtcclxuICB0cnkge1xyXG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXHJcbiAgICAgICAgLmZpbHRlcihuYW1lID0+IChwYXRoLmV4dG5hbWUobmFtZSkgPT09ICcnKSAmJiAobmFtZSAhPT0gJ0RlZmF1bHQnKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICgpID0+IGNhY2hlZDtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbChwcm9wcykge1xyXG4gIGNvbnN0IHsgdCwgY3VycmVudFByb2ZpbGUsIG9uU2V0UGxheWVyUHJvZmlsZSB9ID0gcHJvcHM7XHJcblxyXG4gIGNvbnN0IG9uU2VsZWN0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2KSA9PiB7XHJcbiAgICBvblNldFBsYXllclByb2ZpbGUoZXYuY3VycmVudFRhcmdldC52YWx1ZSk7XHJcbiAgfSwgW29uU2V0UGxheWVyUHJvZmlsZV0pO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBwYWRkaW5nOiAnMTZweCcgfX0+XHJcbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgYWxpZ25JdGVtczogJ2NlbnRlcicgfX0+XHJcbiAgICAgICAge3QoJ0luZ2FtZSBQcm9maWxlOiAnKX1cclxuICAgICAgICA8Rm9ybUNvbnRyb2xcclxuICAgICAgICAgIGNvbXBvbmVudENsYXNzPSdzZWxlY3QnXHJcbiAgICAgICAgICBuYW1lPSd1c2VyUHJvZmlsZSdcclxuICAgICAgICAgIGNsYXNzTmFtZT0nZm9ybS1jb250cm9sJ1xyXG4gICAgICAgICAgdmFsdWU9e2N1cnJlbnRQcm9maWxlfVxyXG4gICAgICAgICAgb25DaGFuZ2U9e29uU2VsZWN0fVxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxvcHRpb24ga2V5PScnIHZhbHVlPScnPnt0KCdQbGVhc2Ugc2VsZWN0IG9uZScpfTwvb3B0aW9uPlxyXG4gICAgICAgICAge2dldFBsYXllclByb2ZpbGVzKCkubWFwKHByb2YgPT4gKDxvcHRpb24ga2V5PXtwcm9mfSB2YWx1ZT17cHJvZn0+e3Byb2Z9PC9vcHRpb24+KSl9XHJcbiAgICAgICAgPC9Gb3JtQ29udHJvbD5cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxoci8+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJ1BsZWFzZSByZWZlciB0byBtb2QgZGVzY3JpcHRpb25zIGZyb20gbW9kIGF1dGhvcnMgdG8gZGV0ZXJtaW5lIHRoZSByaWdodCBvcmRlci4gJ1xyXG4gICAgICAgICAgKyAnSWYgeW91IGNhblxcJ3QgZmluZCBhbnkgc3VnZ2VzdGlvbnMgZm9yIGEgbW9kLCBpdCBwcm9iYWJseSBkb2VzblxcJ3QgbWF0dGVyLicpfVxyXG4gICAgICAgIDxoci8+XHJcbiAgICAgICAge3QoJ0dVSSBtb2RzIGFyZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBlbmdpbmUgJ1xyXG4gICAgICAgICAgKyAnYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGRpc2FibGVkIG9yIGxvYWQgb3JkZXJlZCBvbiB0aGlzIHNjcmVlbi4nKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZUxvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRPcmRlcjogeyBba2V5OiBzdHJpbmddOiBJTG9hZE9yZGVyRW50cnkgfSkge1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuXHJcbiAgaWYgKCFiZzNwcm9maWxlKSB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnYmczLW5vLXByb2ZpbGUtc2VsZWN0ZWQnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIHRpdGxlOiAnTm8gcHJvZmlsZSBzZWxlY3RlZCcsXHJcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2Ugc2VsZWN0IHRoZSBpbi1nYW1lIHByb2ZpbGUgdG8gbW9kIG9uIHRoZSBcIkxvYWQgT3JkZXJcIiBwYWdlJyxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignYmczLW5vLXByb2ZpbGUtc2VsZWN0ZWQnKTtcclxuXHJcbiAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzLnNhdmUucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24ubm9kZSwgJ3Jvb3QnKTtcclxuICAgIGNvbnN0IG1vZHNOb2RlID0gZmluZE5vZGUocm9vdC5jaGlsZHJlblswXS5ub2RlLCAnTW9kcycpO1xyXG4gICAgY29uc3QgbG9Ob2RlID0gZmluZE5vZGUocm9vdC5jaGlsZHJlblswXS5ub2RlLCAnTW9kT3JkZXInKTtcclxuICAgIGlmICgobG9Ob2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobG9Ob2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xyXG4gICAgICBsb05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcclxuICAgIH1cclxuICAgIC8vIGRyb3AgYWxsIG5vZGVzIGV4Y2VwdCBmb3IgdGhlIGdhbWUgZW50cnlcclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTm9kZXMgPSBtb2RzTm9kZS5jaGlsZHJlblswXS5ub2RlLmZpbHRlcihpdGVyID0+XHJcbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09ICdHdXN0YXYnKSkpO1xyXG5cclxuICAgIGNvbnN0IGVuYWJsZWRQYWtzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICEhbG9hZE9yZGVyW2tleV0uZGF0YT8udXVpZFxyXG4gICAgICAgICAgICAgICAgICAgICYmIGxvYWRPcmRlcltrZXldLmVuYWJsZWRcclxuICAgICAgICAgICAgICAgICAgICAmJiAhbG9hZE9yZGVyW2tleV0uZGF0YT8uaXNHVUkpO1xyXG5cclxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIGVuYWJsZWRQYWtzKSB7XHJcbiAgICAgIC8vIGNvbnN0IG1kNSA9IGF3YWl0IHV0aWwuZmlsZU1ENShwYXRoLmpvaW4obW9kc1BhdGgoKSwga2V5KSk7XHJcbiAgICAgIGRlc2NyaXB0aW9uTm9kZXMucHVzaCh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZVNob3J0RGVzYycgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5mb2xkZXIgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTUQ1JywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6IGxvYWRPcmRlcltrZXldLmRhdGEubWQ1IH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ05hbWUnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS5uYW1lIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb24nLCB0eXBlOiAnaW50MzInLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS52ZXJzaW9uIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGVuYWJsZWRQYWtzXHJcbiAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gbG9hZE9yZGVyW2xoc10ucG9zIC0gbG9hZE9yZGVyW3Joc10ucG9zKVxyXG4gICAgICAubWFwKChrZXk6IHN0cmluZyk6IElNb2ROb2RlID0+ICh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogbG9hZE9yZGVyW2tleV0uZGF0YS51dWlkIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XHJcbiAgICBsb05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGxvYWRPcmRlck5vZGVzO1xyXG5cclxuICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncyk7XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0dGluZ3NXcml0dGVuKGJnM3Byb2ZpbGUsIERhdGUubm93KCksIGVuYWJsZWRQYWtzLmxlbmd0aCkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG50eXBlIERpdmluZUFjdGlvbiA9ICdjcmVhdGUtcGFja2FnZScgfCAnbGlzdC1wYWNrYWdlJyB8ICdleHRyYWN0LXNpbmdsZS1maWxlJ1xyXG4gICAgICAgICAgICAgICAgICB8ICdleHRyYWN0LXBhY2thZ2UnIHwgJ2V4dHJhY3QtcGFja2FnZXMnIHwgJ2NvbnZlcnQtbW9kZWwnXHJcbiAgICAgICAgICAgICAgICAgIHwgJ2NvbnZlcnQtbW9kZWxzJyB8ICdjb252ZXJ0LXJlc291cmNlJyB8ICdjb252ZXJ0LXJlc291cmNlcyc7XHJcblxyXG5pbnRlcmZhY2UgSURpdmluZU9wdGlvbnMge1xyXG4gIHNvdXJjZTogc3RyaW5nO1xyXG4gIGRlc3RpbmF0aW9uPzogc3RyaW5nO1xyXG4gIGV4cHJlc3Npb24/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJRGl2aW5lT3V0cHV0IHtcclxuICBzdGRvdXQ6IHN0cmluZztcclxuICByZXR1cm5Db2RlOiBudW1iZXI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpdmluZShhY3Rpb246IERpdmluZUFjdGlvbiwgb3B0aW9uczogSURpdmluZU9wdGlvbnMpOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SURpdmluZU91dHB1dD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgbGV0IHJldHVybmVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBsZXQgc3Rkb3V0OiBzdHJpbmcgPSAnJztcclxuXHJcbiAgICBjb25zdCBleGUgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAndG9vbHMnLCAnZGl2aW5lLmV4ZScpO1xyXG4gICAgY29uc3QgYXJncyA9IFtcclxuICAgICAgJy0tYWN0aW9uJywgYWN0aW9uLFxyXG4gICAgICAnLS1zb3VyY2UnLCBvcHRpb25zLnNvdXJjZSxcclxuICAgICAgJy0tbG9nbGV2ZWwnLCAnb2ZmJyxcclxuICAgICAgJy0tZ2FtZScsICdiZzMnLFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5kZXN0aW5hdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1kZXN0aW5hdGlvbicsIG9wdGlvbnMuZGVzdGluYXRpb24pO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdGlvbnMuZXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1leHByZXNzaW9uJywgb3B0aW9ucy5leHByZXNzaW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwcm9jID0gc3Bhd24oZXhlLCBhcmdzLCB7IGN3ZDogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3Rvb2xzJykgfSk7XHJcblxyXG4gICAgcHJvYy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHN0ZG91dCArPSBkYXRhKTtcclxuICAgIHByb2Muc3RkZXJyLm9uKCdkYXRhJywgZGF0YSA9PiBsb2coJ3dhcm4nLCBkYXRhKSk7XHJcblxyXG4gICAgcHJvYy5vbignZXJyb3InLCAoZXJySW46IEVycm9yKSA9PiB7XHJcbiAgICAgIGlmICghcmV0dXJuZWQpIHtcclxuICAgICAgICByZXR1cm5lZCA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdkaXZpbmUuZXhlIGZhaWxlZDogJyArIGVyckluLm1lc3NhZ2UpO1xyXG4gICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XHJcbiAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcHJvYy5vbignZXhpdCcsIChjb2RlOiBudW1iZXIpID0+IHtcclxuICAgICAgaWYgKCFyZXR1cm5lZCkge1xyXG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgcmVzb2x2ZSh7IHN0ZG91dCwgcmV0dXJuQ29kZTogMCB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gZGl2aW5lLmV4ZSByZXR1cm5zIHRoZSBhY3R1YWwgZXJyb3IgY29kZSArIDEwMCBpZiBhIGZhdGFsIGVycm9yIG9jY3VyZWRcclxuICAgICAgICAgIGlmIChjb2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIGNvZGUgLT0gMTAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtjb2RlfWApO1xyXG4gICAgICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gdHJ1ZTtcclxuICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWsocGFrUGF0aCwgZGVzdFBhdGgsIHBhdHRlcm4pIHtcclxuICByZXR1cm4gZGl2aW5lKCdleHRyYWN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCwgZGVzdGluYXRpb246IGRlc3RQYXRoLCBleHByZXNzaW9uOiBwYXR0ZXJuIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IG1ldGFQYXRoID0gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndGVtcCcpLCAnbHNtZXRhJywgc2hvcnRpZCgpKTtcclxuICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhtZXRhUGF0aCk7XHJcbiAgYXdhaXQgZXh0cmFjdFBhayhwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcclxuICB0cnkge1xyXG4gICAgLy8gdGhlIG1ldGEubHN4IG1heSBiZSBpbiBhIHN1YmRpcmVjdG9yeS4gVGhlcmUgaXMgcHJvYmFibHkgYSBwYXR0ZXJuIGhlcmVcclxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXHJcbiAgICBsZXQgbWV0YUxTWFBhdGg6IHN0cmluZyA9IHBhdGguam9pbihtZXRhUGF0aCwgJ21ldGEubHN4Jyk7XHJcbiAgICBhd2FpdCB3YWxrKG1ldGFQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XHJcbiAgICAgIGlmICh0ZW1wICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBtZXRhTFNYUGF0aCA9IHRlbXAuZmlsZVBhdGg7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtZXRhTFNYUGF0aCk7XHJcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XHJcbiAgICByZXR1cm4gbWV0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE5vZGU8VCBleHRlbmRzIElYbWxOb2RlPHsgaWQ6IHN0cmluZyB9PiwgVT4obm9kZXM6IFRbXSwgaWQ6IHN0cmluZyk6IFQge1xyXG4gIHJldHVybiBub2Rlcz8uZmluZChpdGVyID0+IGl0ZXIuJC5pZCA9PT0gaWQpID8/IHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaXNHVUlNb2QocGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgY29uc3QgcmVzID0gYXdhaXQgZGl2aW5lKCdsaXN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCB9KTtcclxuICBjb25zdCBsaW5lcyA9IHJlcy5zdGRvdXQuc3BsaXQoJ1xcbicpO1xyXG4gIHJldHVybiBsaW5lcy5maW5kKGxpbmUgPT4gbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKSAhPT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mbyhwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElQYWtJbmZvPiB7XHJcbiAgY29uc3QgbWV0YSA9IGF3YWl0IGV4dHJhY3RNZXRhKHBha1BhdGgpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XHJcblxyXG4gIGNvbnN0IGF0dHIgPSAobmFtZTogc3RyaW5nLCBmYWxsYmFjazogKCkgPT4gYW55KSA9PlxyXG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcclxuXHJcbiAgY29uc3QgZ2VuTmFtZSA9IHBhdGguYmFzZW5hbWUocGFrUGF0aCwgcGF0aC5leHRuYW1lKHBha1BhdGgpKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcclxuICAgIGRlc2NyaXB0aW9uOiBhdHRyKCdEZXNjcmlwdGlvbicsICgpID0+ICdNaXNzaW5nJyksXHJcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXHJcbiAgICBuYW1lOiBhdHRyKCdOYW1lJywgKCkgPT4gZ2VuTmFtZSksXHJcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxyXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcclxuICAgIHZlcnNpb246IGF0dHIoJ1ZlcnNpb24nLCAoKSA9PiAnMScpLFxyXG4gICAgaXNHVUk6IGF3YWl0IGlzR1VJTW9kKHBha1BhdGgpLFxyXG4gIH07XHJcbn1cclxuXHJcbmNvbnN0IGZhbGxiYWNrUGljdHVyZSA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdnYW1lYXJ0LmpwZycpO1xyXG5cclxubGV0IHN0b3JlZExPOiBhbnlbXTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xyXG4gIGNvbnN0IG5hbWUgPSBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ05hbWUnKS4kLnZhbHVlO1xyXG4gIHJldHVybiB7XHJcbiAgICBpZDogbmFtZSxcclxuICAgIG5hbWUsXHJcbiAgICBkYXRhOiBmaW5kTm9kZShub2RlLmF0dHJpYnV0ZSwgJ1VVSUQnKS4kLnZhbHVlLFxyXG4gIH07XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgbGV0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAoIWJnM3Byb2ZpbGUpIHtcclxuICAgIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcclxuICAgIGlmIChwbGF5ZXJQcm9maWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgc3RvcmVkTE8gPSBbXTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYmczcHJvZmlsZSA9IGdldFBsYXllclByb2ZpbGVzKClbMF07XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHNldHRpbmdzUGF0aCk7XHJcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgbGV0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcclxuICBpZiAoIWJnM3Byb2ZpbGUpIHtcclxuICAgIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcclxuICAgIGlmIChwbGF5ZXJQcm9maWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgc3RvcmVkTE8gPSBbXTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYmczcHJvZmlsZSA9IGdldFBsYXllclByb2ZpbGVzKClbMF07XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuXHJcbiAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XHJcbiAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChkYXRhKTtcclxuICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhzZXR0aW5nc1BhdGgsIHhtbCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRTdG9yZWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1vZFNldHRpbmdzLnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcclxuICBjb25zdCBtb2RPcmRlclJvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kT3JkZXInKTtcclxuICBjb25zdCBtb2RzUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3QuY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcclxuICBjb25zdCBtb2RPcmRlck5vZGVzID0gbW9kT3JkZXJSb290LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdC5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG5cclxuICBjb25zdCBtb2RPcmRlciA9IG1vZE9yZGVyTm9kZXMubWFwKG5vZGUgPT4gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJD8udmFsdWUpO1xyXG5cclxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYmczcHJvZmlsZTogc3RyaW5nID0gc3RhdGUuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlO1xyXG4gIGlmIChtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcclxuICAgIGNvbnN0IGxhc3RXcml0ZSA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8uc2V0dGluZ3NXcml0dGVuPy5bYmczcHJvZmlsZV07XHJcbiAgICBpZiAoKGxhc3RXcml0ZSAhPT0gdW5kZWZpbmVkKSAmJiAobGFzdFdyaXRlLmNvdW50ID4gMSkpIHtcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIGlkOiAnYmczLW1vZHNldHRpbmdzLXJlc2V0JyxcclxuICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgICB0aXRsZTogJ1wibW9kc2V0dGluZ3MubHN4XCIgZmlsZSB3YXMgcmVzZXQnLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdUaGlzIHVzdWFsbHkgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgbW9kIGlzIGluc3RhbGxlZCcsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xyXG4gICAgLm1hcChub2RlID0+IHBhcnNlTW9kTm9kZShub2RlKSlcclxuICAgIC8vIEd1c3RhdiBpcyB0aGUgY29yZSBnYW1lXHJcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcclxuICAgIC8vIHNvcnQgYnkgdGhlIGluZGV4IG9mIGVhY2ggbW9kIGluIHRoZSBtb2RPcmRlciBsaXN0XHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IG1vZE9yZGVyXHJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlUHJlU29ydChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyB3b3JrYXJvdW5kIGZvciBtb2RfbG9hZF9vcmRlciBiZWluZyBidWdnZWQgYWYsIGl0IHdpbGwgb2NjYXNpb25hbGx5IGNhbGwgcHJlU29ydFxyXG4gIC8vIHdpdGggYSBmcmVzaCBsaXN0IG9mIG1vZHMgZnJvbSBmaWx0ZXIsIGNvbXBsZXRlbHkgaWdub3JpbmcgcHJldmlvdXMgc29ydCByZXN1bHRzXHJcblxyXG4gIHJldHVybiBhc3luYyAoaXRlbXM6IGFueVtdLCBzb3J0RGlyOiBhbnksIHVwZGF0ZVR5cGU6IGFueSk6IFByb21pc2U8YW55W10+ID0+IHtcclxuICAgIGlmICgoaXRlbXMubGVuZ3RoID09PSAwKSAmJiAoc3RvcmVkTE8gIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgcmV0dXJuIHN0b3JlZExPO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcblxyXG4gICAgY29uc3QgbWFuaWZlc3QgPSBhd2FpdCB1dGlsLmdldE1hbmlmZXN0KGFwaSwgJycsIEdBTUVfSUQpO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpbGVOYW1lIG9mIHBha3MpIHtcclxuICAgICAgYXdhaXQgKHV0aWwgYXMgYW55KS53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSXRlbSA9IGl0ZW1zLmZpbmQoaXRlciA9PiBpdGVyLmlkID09PSBmaWxlTmFtZSk7XHJcbiAgICAgICAgICBpZiAoKGV4aXN0aW5nSXRlbSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICYmICh1cGRhdGVUeXBlICE9PSAncmVmcmVzaCcpXHJcbiAgICAgICAgICAgICAgJiYgKGV4aXN0aW5nSXRlbS5pbWdVcmwgIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZXhpc3RpbmdJdGVtKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBtYW5pZmVzdC5maWxlcy5maW5kKGVudHJ5ID0+IGVudHJ5LnJlbFBhdGggPT09IGZpbGVOYW1lKTtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IG1hbmlmZXN0RW50cnkgIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXVttYW5pZmVzdEVudHJ5LnNvdXJjZV1cclxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgbGV0IG1vZEluZm8gPSBleGlzdGluZ0l0ZW0/LmRhdGE7XHJcbiAgICAgICAgICBpZiAobW9kSW5mbyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1vZEluZm8gPSBhd2FpdCBleHRyYWN0UGFrSW5mbyhwYXRoLmpvaW4obW9kc1BhdGgoKSwgZmlsZU5hbWUpKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgcmVzOiB0eXBlcy5JTG9hZE9yZGVyRGlzcGxheUl0ZW07XHJcbiAgICAgICAgICBpZiAobW9kICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gcGFrIGlzIGZyb20gYSBtb2QgKGFuIGluc3RhbGxlZCBvbmUpXHJcbiAgICAgICAgICAgIHJlcyA9IHtcclxuICAgICAgICAgICAgICBpZDogZmlsZU5hbWUsXHJcbiAgICAgICAgICAgICAgbmFtZTogdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCksXHJcbiAgICAgICAgICAgICAgaW1nVXJsOiBtb2QuYXR0cmlidXRlcz8ucGljdHVyZVVybCA/PyBmYWxsYmFja1BpY3R1cmUsXHJcbiAgICAgICAgICAgICAgZGF0YTogbW9kSW5mbyxcclxuICAgICAgICAgICAgICBleHRlcm5hbDogZmFsc2UsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXMgPSB7XHJcbiAgICAgICAgICAgICAgaWQ6IGZpbGVOYW1lLFxyXG4gICAgICAgICAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUoZmlsZU5hbWUsIHBhdGguZXh0bmFtZShmaWxlTmFtZSkpLFxyXG4gICAgICAgICAgICAgIGltZ1VybDogZmFsbGJhY2tQaWN0dXJlLFxyXG4gICAgICAgICAgICAgIGRhdGE6IG1vZEluZm8sXHJcbiAgICAgICAgICAgICAgZXh0ZXJuYWw6IHRydWUsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKG1vZEluZm8uaXNHVUkpIHtcclxuICAgICAgICAgICAgcmVzLmxvY2tlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0KHJlcyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChyZXMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgcGFrJywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc3RvcmVkTE8gPSByZXN1bHQuc29ydCgobGhzLCByaHMpID0+IGl0ZW1zLmluZGV4T2YobGhzKSAtIGl0ZW1zLmluZGV4T2YocmhzKSk7XHJcbiAgICByZXR1cm4gc3RvcmVkTE87XHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxyXG4gICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXHJcbiAgICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICAgICAnZ2FtZS9iaW4vVFM0LmV4ZScsXHJcbiAgICAgICAgXSxcclxuICAgICAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczX2R4MTEuZXhlJyxcclxuICAgIHNldHVwOiBkaXNjb3ZlcnkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMTA4Njk0MCcsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiAxMDg2OTQwLFxyXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogW1xyXG4gICAgICAgICdpbmZvLmpzb24nLFxyXG4gICAgICBdLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IFtcclxuICAgICAgICAnaW5mby5qc29uJyxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGxldCBmb3JjZVJlZnJlc2g6ICgpID0+IHZvaWQ7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtcmVwbGFjZXInLCAyNSwgdGVzdFJlcGxhY2VyLCBpbnN0YWxsUmVwbGFjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnYmczLXJlcGxhY2VyJywgMjUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIGZpbGVzID0+IGlzUmVwbGFjZXIoY29udGV4dC5hcGksIGZpbGVzKSxcclxuICAgIHsgbmFtZTogJ0JHMyBSZXBsYWNlcicgfSBhcyBhbnkpO1xyXG5cclxuICAoY29udGV4dCBhcyBhbnkpLnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICBmb3JjZVJlZnJlc2ggPSBwcm9wcy5yZWZyZXNoO1xyXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChJbmZvUGFuZWwsIHtcclxuICAgICAgICB0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUsXHJcbiAgICAgICAgY3VycmVudFByb2ZpbGU6IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlLFxyXG4gICAgICAgIG9uU2V0UGxheWVyUHJvZmlsZTogYXN5bmMgKHByb2ZpbGVOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFBsYXllclByb2ZpbGUocHJvZmlsZU5hbWUpKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZm9yY2VSZWZyZXNoPy4oKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBmaWx0ZXI6ICgpID0+IFtdLFxyXG4gICAgcHJlU29ydDogbWFrZVByZVNvcnQoY29udGV4dC5hcGkpLFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBkaXNwbGF5Q2hlY2tib3hlczogdHJ1ZSxcclxuICAgIGNhbGxiYWNrOiAobG9hZE9yZGVyOiBhbnkpID0+IHdyaXRlTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29udGV4dC5hcGkub25TdGF0ZUNoYW5nZShbJ3Nlc3Npb24nLCAnYmFzZScsICd0b29sc1J1bm5pbmcnXSxcclxuICAgICAgYXN5bmMgKHByZXY6IGFueSwgY3VycmVudDogYW55KSA9PiB7XHJcbiAgICAgICAgLy8gd2hlbiBhIHRvb2wgZXhpdHMsIHJlLXJlYWQgdGhlIGxvYWQgb3JkZXIgZnJvbSBkaXNrIGFzIGl0IG1heSBoYXZlIGJlZW5cclxuICAgICAgICAvLyBjaGFuZ2VkXHJcbiAgICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xyXG4gICAgICAgIGlmICgoZ2FtZU1vZGUgPT09IEdBTUVfSUQpICYmIChPYmplY3Qua2V5cyhjdXJyZW50KS5sZW5ndGggPT09IDApKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oY29udGV4dC5hcGkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCAocHJvZmlsZUlkOiBzdHJpbmcsIGRlcGxveW1lbnQpID0+IHtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAoKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZm9yY2VSZWZyZXNoICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgZm9yY2VSZWZyZXNoKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcclxuICAgICAgICAgICAgJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1haW47XHJcbiJdfQ==