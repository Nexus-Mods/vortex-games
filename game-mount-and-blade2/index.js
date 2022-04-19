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
const bluebird_1 = require("bluebird");
const React = __importStar(require("react"));
const BS = __importStar(require("react-bootstrap"));
const index_1 = require("./bmm/index");
const exe_version_1 = __importDefault(require("exe-version"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const util_1 = require("./util");
const common_1 = require("./common");
const customItemRenderer_1 = __importDefault(require("./customItemRenderer"));
const migrations_1 = require("./migrations");
const collections_1 = require("./collections/collections");
const subModCache_1 = require("./subModCache");
const CollectionsDataView_1 = __importDefault(require("./views/CollectionsDataView"));
const redux_act_1 = require("redux-act");
const Settings_1 = __importDefault(require("./views/Settings"));
const LAUNCHER_EXEC = path_1.default.join('bin', 'Win64_Shipping_Client', 'TaleWorlds.MountAndBlade.Launcher.exe');
const MODDING_KIT_EXEC = path_1.default.join('bin', 'Win64_Shipping_wEditor', 'TaleWorlds.MountAndBlade.Launcher.exe');
let STORE_ID;
const GOG_IDS = ['1802539526', '1564781494'];
const STEAMAPP_ID = 261550;
const EPICAPP_ID = 'Chickadee';
const ROOT_FOLDERS = new Set(['bin', 'data', 'gui', 'icons', 'modules',
    'music', 'shaders', 'sounds', 'xmlschemas']);
const setSortOnDeploy = (0, redux_act_1.createAction)('MNB2_SET_SORT_ON_DEPLOY', (profileId, sort) => ({ profileId, sort }));
const reducer = {
    reducers: {
        [setSortOnDeploy]: (state, payload) => vortex_api_1.util.setSafe(state, ['sortOnDeploy', payload.profileId], payload.sort),
    },
    defaults: {
        sortOnDeploy: {},
    },
};
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([EPICAPP_ID, STEAMAPP_ID.toString(), ...GOG_IDS])
        .then(game => {
        STORE_ID = game.gameStoreId;
        return Promise.resolve(game.gamePath);
    });
}
function testRootMod(files, gameId) {
    const notSupported = { supported: false, requiredFiles: [] };
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve(notSupported);
    }
    const lowered = files.map(file => file.toLowerCase());
    const modsFile = lowered.find(file => file.split(path_1.default.sep).indexOf(common_1.MODULES.toLowerCase()) !== -1);
    if (modsFile === undefined) {
        return Promise.resolve(notSupported);
    }
    const idx = modsFile.split(path_1.default.sep).indexOf(common_1.MODULES.toLowerCase());
    const rootFolderMatches = lowered.filter(file => {
        const segments = file.split(path_1.default.sep);
        return (((segments.length - 1) > idx) && ROOT_FOLDERS.has(segments[idx]));
    }) || [];
    return Promise.resolve({ supported: (rootFolderMatches.length > 0), requiredFiles: [] });
}
function installRootMod(files, destinationPath) {
    const moduleFile = files.find(file => file.split(path_1.default.sep).indexOf(common_1.MODULES) !== -1);
    const idx = moduleFile.split(path_1.default.sep).indexOf(common_1.MODULES);
    const subMods = files.filter(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE);
    return bluebird_1.Promise.map(subMods, (modFile) => __awaiter(this, void 0, void 0, function* () {
        const subModId = yield (0, util_1.getElementValue)(path_1.default.join(destinationPath, modFile), 'Id');
        return bluebird_1.Promise.resolve(subModId);
    }))
        .then((subModIds) => {
        const filtered = files.filter(file => {
            const segments = file.split(path_1.default.sep).map(seg => seg.toLowerCase());
            const lastElementIdx = segments.length - 1;
            return (ROOT_FOLDERS.has(segments[idx])
                && (path_1.default.extname(segments[lastElementIdx]) !== ''));
        });
        const attributes = subModIds.length > 0
            ? [
                {
                    type: 'attribute',
                    key: 'subModIds',
                    value: subModIds,
                },
            ]
            : [];
        const instructions = attributes.concat(filtered.map(file => {
            const destination = file.split(path_1.default.sep)
                .slice(idx)
                .join(path_1.default.sep);
            return {
                type: 'copy',
                source: file,
                destination,
            };
        }));
        return bluebird_1.Promise.resolve({ instructions });
    });
}
function testForSubmodules(files, gameId) {
    const supported = ((gameId === common_1.GAME_ID)
        && files.find(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE) !== undefined);
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function installSubModules(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const filtered = files.filter(file => {
            const segments = file.split(path_1.default.sep);
            return path_1.default.extname(segments[segments.length - 1]) !== '';
        });
        const subModIds = [];
        const subMods = filtered.filter(file => path_1.default.basename(file).toLowerCase() === common_1.SUBMOD_FILE);
        return bluebird_1.Promise.reduce(subMods, (accum, modFile) => __awaiter(this, void 0, void 0, function* () {
            const segments = modFile.split(path_1.default.sep).filter(seg => !!seg);
            const subModId = yield (0, util_1.getElementValue)(path_1.default.join(destinationPath, modFile), 'Id');
            const modName = (segments.length > 1)
                ? segments[segments.length - 2]
                : subModId;
            if (modName === undefined) {
                return Promise.reject(new vortex_api_1.util.DataInvalid('Invalid Submodule.xml file - inform the mod author'));
            }
            subModIds.push(subModId);
            const idx = modFile.toLowerCase().indexOf(common_1.SUBMOD_FILE);
            const subModFiles = filtered.filter(file => file.slice(0, idx) === modFile.slice(0, idx));
            const instructions = subModFiles.map((modFile) => ({
                type: 'copy',
                source: modFile,
                destination: path_1.default.join(common_1.MODULES, modName, modFile.slice(idx)),
            }));
            return accum.concat(instructions);
        }), [])
            .then(merged => {
            const subModIdsAttr = {
                type: 'attribute',
                key: 'subModIds',
                value: subModIds,
            };
            return Promise.resolve({ instructions: [].concat(merged, [subModIdsAttr]) });
        });
    });
}
function ensureOfficialLauncher(context, discovery) {
    context.api.store.dispatch(vortex_api_1.actions.addDiscoveredTool(common_1.GAME_ID, 'TaleWorldsBannerlordLauncher', {
        id: 'TaleWorldsBannerlordLauncher',
        name: 'Official Launcher',
        logo: 'twlauncher.png',
        executable: () => path_1.default.basename(LAUNCHER_EXEC),
        requiredFiles: [
            path_1.default.basename(LAUNCHER_EXEC),
        ],
        path: path_1.default.join(discovery.path, LAUNCHER_EXEC),
        relative: true,
        workingDirectory: path_1.default.join(discovery.path, 'bin', 'Win64_Shipping_Client'),
        hidden: false,
        custom: false,
    }, false));
}
function setModdingTool(context, discovery, hidden) {
    const toolId = 'bannerlord-sdk';
    const exec = path_1.default.basename(MODDING_KIT_EXEC);
    const tool = {
        id: toolId,
        name: 'Modding Kit',
        logo: 'twlauncher.png',
        executable: () => exec,
        requiredFiles: [exec],
        path: path_1.default.join(discovery.path, MODDING_KIT_EXEC),
        relative: true,
        exclusive: true,
        workingDirectory: path_1.default.join(discovery.path, path_1.default.dirname(MODDING_KIT_EXEC)),
        hidden,
        custom: false,
    };
    context.api.store.dispatch(vortex_api_1.actions.addDiscoveredTool(common_1.GAME_ID, toolId, tool, false));
}
function prepareForModding(context, discovery, bmm) {
    return __awaiter(this, void 0, void 0, function* () {
        if (bmm === undefined) {
            bmm = yield index_1.BannerlordModuleManager.createAsync();
        }
        ensureOfficialLauncher(context, discovery);
        try {
            yield vortex_api_1.fs.statAsync(path_1.default.join(discovery.path, MODDING_KIT_EXEC));
            setModdingTool(context, discovery);
        }
        catch (err) {
            const tools = discovery === null || discovery === void 0 ? void 0 : discovery.tools;
            if ((tools !== undefined)
                && (vortex_api_1.util.getSafe(tools, ['bannerlord-sdk'], undefined) !== undefined)) {
                setModdingTool(context, discovery, true);
            }
        }
        const findStoreId = () => findGame().catch(err => Promise.resolve());
        const startSteam = () => findStoreId()
            .then(() => (STORE_ID === 'steam')
            ? vortex_api_1.util.GameStoreHelper.launchGameStore(context.api, STORE_ID, undefined, true)
            : Promise.resolve());
        return startSteam().then(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, subModCache_1.refreshCache)(context, bmm);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }))
            .finally(() => {
            const state = context.api.store.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            if (activeProfile === undefined) {
                return (0, util_1.refreshGameParams)(context, {});
            }
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
            return (0, util_1.refreshGameParams)(context, loadOrder);
        });
    });
}
function tSort(sortProps) {
    const { bmm } = sortProps;
    const CACHE = (0, subModCache_1.getCache)();
    const sorted = bmm.sort(Object.values(CACHE));
    return sorted;
}
function isExternal(context, subModId) {
    const state = context.api.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const modIds = Object.keys(mods);
    modIds.forEach(modId => {
        const subModIds = vortex_api_1.util.getSafe(mods[modId], ['attributes', 'subModIds'], []);
        if (subModIds.includes(subModId)) {
            return false;
        }
    });
    return true;
}
let refreshFunc;
function refreshCacheOnEvent(context, profileId, bmm) {
    return __awaiter(this, void 0, void 0, function* () {
        if (profileId === undefined) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const deployProfile = vortex_api_1.selectors.profileById(state, profileId);
        if (((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== (deployProfile === null || deployProfile === void 0 ? void 0 : deployProfile.gameId)) || ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID)) {
            return Promise.resolve();
        }
        try {
            yield (0, subModCache_1.refreshCache)(context, bmm);
        }
        catch (err) {
            return (err instanceof vortex_api_1.util.ProcessCanceled)
                ? Promise.resolve()
                : Promise.reject(err);
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], {});
        if (vortex_api_1.util.getSafe(state, ['settings', 'mountandblade2', 'sortOnDeploy', activeProfile.id], true)) {
            return sortImpl(context, bmm);
        }
        else {
            if (refreshFunc !== undefined) {
                refreshFunc();
            }
            return (0, util_1.refreshGameParams)(context, loadOrder);
        }
    });
}
function preSort(context, items, direction, updateType, bmm) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined || (activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID) {
            return Promise.resolve(items);
        }
        const CACHE = (0, subModCache_1.getCache)();
        if (Object.keys(CACHE).length !== items.length) {
            const displayItems = Object.values(CACHE).map(iter => ({
                id: iter.id,
                name: iter.name,
                imgUrl: `${__dirname}/gameart.jpg`,
                external: isExternal(context, iter.id),
                official: iter.isOfficial,
            }));
            return Promise.resolve(displayItems);
        }
        else {
            let ordered = [];
            if (updateType !== 'drag-n-drop') {
                const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
                ordered = items.filter(item => loadOrder[item.id] !== undefined)
                    .sort((lhs, rhs) => loadOrder[lhs.id].pos - loadOrder[rhs.id].pos);
                const unOrdered = items.filter(item => loadOrder[item.id] === undefined);
                ordered = [].concat(ordered, unOrdered);
            }
            else {
                ordered = items;
            }
            return Promise.resolve(ordered);
        }
    });
}
function infoComponent(context, props) {
    const t = context.api.translate;
    return React.createElement(BS.Panel, { id: 'loadorderinfo' }, React.createElement('h2', {}, t('Managing your load order', { ns: common_1.I18N_NAMESPACE })), React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement('div', {}, React.createElement('p', {}, t('You can adjust the load order for Bannerlord by dragging and dropping mods up or down on this page. '
        + 'Please keep in mind that Bannerlord is still in Early Access, which means that there might be significant '
        + 'changes to the game as time goes on. Please notify us of any Vortex related issues you encounter with this '
        + 'extension so we can fix it. For more information and help see: ', { ns: common_1.I18N_NAMESPACE }), React.createElement('a', { onClick: () => vortex_api_1.util.opn('https://wiki.nexusmods.com/index.php/Modding_Bannerlord_with_Vortex') }, t('Modding Bannerlord with Vortex.', { ns: common_1.I18N_NAMESPACE }))))), React.createElement('div', {}, React.createElement('p', {}, t('How to use:', { ns: common_1.I18N_NAMESPACE })), React.createElement('ul', {}, React.createElement('li', {}, t('Check the box next to the mods you want to be active in the game.', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('Click Auto Sort in the toolbar. (See below for details).', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('Make sure to run the game directly via the Play button in the top left corner '
        + '(on the Bannerlord tile). Your Vortex load order may not be loaded if you run the Single Player game through the game launcher.', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('Optional: Manually drag and drop mods to different positions in the load order (for testing different overrides). Mods further down the list override mods further up.', { ns: common_1.I18N_NAMESPACE })))), React.createElement('div', {}, React.createElement('p', {}, t('Please note:', { ns: common_1.I18N_NAMESPACE })), React.createElement('ul', {}, React.createElement('li', {}, t('The load order reflected here will only be loaded if you run the game via the play button in '
        + 'the top left corner. Do not run the Single Player game through the launcher, as that will ignore '
        + 'the Vortex load order and go by what is shown in the launcher instead.', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('For Bannerlord, mods sorted further towards the bottom of the list will override mods further up (if they conflict). '
        + 'Note: Harmony patches may be the exception to this rule.', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('Auto Sort uses the SubModule.xml files (the entries under <DependedModules>) to detect '
        + 'dependencies to sort by. ', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('If you cannot see your mod in this load order, Vortex may have been unable to find or parse its SubModule.xml file. '
        + 'Most - but not all mods - come with or need a SubModule.xml file.', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('Hit the deploy button whenever you install and enable a new mod.', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('The game will not launch unless the game store (Steam, Epic, etc) is started beforehand. If you\'re getting the '
        + '"Unable to Initialize Steam API" error, restart Steam.', { ns: common_1.I18N_NAMESPACE })))));
}
function resolveGameVersion(discoveryPath) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV !== 'development' && semver_1.default.satisfies(vortex_api_1.util.getApplication().version, '<1.4.0')) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('not supported in older Vortex versions'));
        }
        try {
            const data = yield (0, util_1.getXMLData)(path_1.default.join(discoveryPath, 'bin', 'Win64_Shipping_Client', 'Version.xml'));
            const exePath = path_1.default.join(discoveryPath, common_1.BANNERLORD_EXEC);
            const value = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.Version) === null || _a === void 0 ? void 0 : _a.Singleplayer) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.$) === null || _d === void 0 ? void 0 : _d.Value.slice(1).split('.').slice(0, 3).join('.');
            return (semver_1.default.valid(value)) ? Promise.resolve(value) : (0, exe_version_1.default)(exePath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
let _IS_SORTING = false;
function sortImpl(context, bmm) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
            (0, vortex_api_1.log)('error', 'Failed to sort mods', { reason: 'No active profile' });
            _IS_SORTING = false;
            return;
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
        let sorted;
        try {
            yield (0, subModCache_1.refreshCache)(context, bmm);
            sorted = tSort({ loadOrder, bmm });
        }
        catch (err) {
            context.api.showErrorNotification('Failed to sort mods', err);
            return;
        }
        const newOrder = sorted.reduce((accum, mod, idx) => {
            var _a;
            if (mod === undefined) {
                return accum;
            }
            accum[mod.vortexId || mod.id] = {
                pos: idx,
                enabled: ((_a = loadOrder[mod.vortexId || mod.id]) === null || _a === void 0 ? void 0 : _a.enabled) || true,
                external: isExternal(context, mod.id),
                data: mod,
            };
            return accum;
        }, {});
        context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(activeProfile.id, newOrder));
        return (0, util_1.refreshGameParams)(context, newOrder)
            .then(() => context.api.sendNotification({
            id: 'mnb2-sort-finished',
            type: 'info',
            message: context.api.translate('Finished sorting', { ns: common_1.I18N_NAMESPACE }),
            displayMS: 3000,
        })).finally(() => _IS_SORTING = false);
    });
}
function main(context) {
    context.registerReducer(['settings', 'mountandblade2'], reducer);
    let bmm;
    context.registerSettings('Interface', Settings_1.default, () => ({
        t: context.api.translate,
        onSetSortOnDeploy: (profileId, sort) => context.api.store.dispatch(setSortOnDeploy(profileId, sort)),
    }), () => {
        const state = context.api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        return profile !== undefined && (profile === null || profile === void 0 ? void 0 : profile.gameId) === common_1.GAME_ID;
    }, 51);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Mount & Blade II:\tBannerlord',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => '.',
        getGameVersion: resolveGameVersion,
        logo: 'gameart.jpg',
        executable: () => common_1.BANNERLORD_EXEC,
        setup: (discovery) => prepareForModding(context, discovery, bmm),
        requiredFiles: [
            common_1.BANNERLORD_EXEC,
        ],
        parameters: [],
        requiresCleanup: true,
        environment: {
            SteamAPPId: STEAMAPP_ID.toString(),
        },
        details: {
            steamAppId: STEAMAPP_ID,
            epicAppId: EPICAPP_ID,
            customOpenModsPath: common_1.MODULES,
        },
    });
    context.optional.registerCollectionFeature('mountandblade2_collection_data', (gameId, includedMods) => (0, collections_1.genCollectionsData)(context, gameId, includedMods), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Mount and Blade 2 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
    context.registerLoadOrderPage({
        gameId: common_1.GAME_ID,
        createInfoPanel: (props) => {
            refreshFunc = props.refresh;
            return infoComponent(context, props);
        },
        noCollectionGeneration: true,
        gameArtURL: `${__dirname}/gameart.jpg`,
        preSort: (items, direction, updateType) => preSort(context, items, direction, updateType, bmm),
        callback: (loadOrder) => (0, util_1.refreshGameParams)(context, loadOrder),
        itemRenderer: (props) => React.createElement(customItemRenderer_1.default.default, Object.assign(Object.assign({}, props), { moduleManager: bmm })),
    });
    context.registerInstaller('bannerlordrootmod', 20, testRootMod, installRootMod);
    context.registerInstaller('bannerlordsubmodules', 25, testForSubmodules, installSubModules);
    context.registerMigration(old => (0, migrations_1.migrate026)(context.api, old));
    context.registerMigration(old => (0, migrations_1.migrate045)(context.api, old));
    context.registerAction('generic-load-order-icons', 200, _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', () => {
        sortImpl(context, bmm);
    }, () => {
        const state = context.api.store.getState();
        const gameId = vortex_api_1.selectors.activeGameId(state);
        return (gameId === common_1.GAME_ID);
    });
    context.once(() => __awaiter(this, void 0, void 0, function* () {
        bmm = yield index_1.BannerlordModuleManager.createAsync();
        context.api.onAsync('did-deploy', (profileId, deployment) => __awaiter(this, void 0, void 0, function* () { return refreshCacheOnEvent(context, profileId, bmm); }));
        context.api.onAsync('did-purge', (profileId) => __awaiter(this, void 0, void 0, function* () { return refreshCacheOnEvent(context, profileId, bmm); }));
        context.api.events.on('gamemode-activated', (gameMode) => {
            const state = context.api.getState();
            const prof = vortex_api_1.selectors.activeProfile(state);
            refreshCacheOnEvent(context, prof === null || prof === void 0 ? void 0 : prof.id, bmm);
        });
        context.api.onAsync('added-files', (profileId, files) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.store.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile.gameId !== common_1.GAME_ID) {
                return;
            }
            const game = vortex_api_1.util.getGame(common_1.GAME_ID);
            const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
            const modPaths = game.getModPaths(discovery.path);
            const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            yield bluebird_1.Promise.map(files, (entry) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (entry.candidates.length === 1) {
                    const mod = vortex_api_1.util.getSafe(state.persistent.mods, [common_1.GAME_ID, entry.candidates[0]], undefined);
                    if (mod === undefined) {
                        return Promise.resolve();
                    }
                    const relPath = path_1.default.relative(modPaths[(_a = mod.type) !== null && _a !== void 0 ? _a : ''], entry.filePath);
                    const targetPath = path_1.default.join(installPath, mod.id, relPath);
                    yield vortex_api_1.fs.ensureDirAsync(path_1.default.dirname(targetPath));
                    return vortex_api_1.fs.removeAsync(targetPath)
                        .catch(err => (err.code === 'ENOENT')
                        ? Promise.resolve()
                        : Promise.reject(err))
                        .then(() => vortex_api_1.fs.copyAsync(entry.filePath, targetPath))
                        .then(() => vortex_api_1.fs.removeAsync(entry.filePath))
                        .catch(err => (0, vortex_api_1.log)('error', 'failed to import added file to mod', err.message));
                }
            }));
        }));
    }));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUV0Qyx1Q0FBc0Q7QUFFdEQsOERBQXFDO0FBRXJDLGdEQUF3QjtBQUN4QixvREFBc0M7QUFDdEMsMkNBQWtGO0FBQ2xGLGlDQUFtRjtBQUVuRixxQ0FHa0I7QUFDbEIsOEVBQXNEO0FBQ3RELDZDQUFzRDtBQUV0RCwyREFBcUY7QUFFckYsK0NBQXVEO0FBRXZELHNGQUE4RDtBQUU5RCx5Q0FBeUM7QUFFekMsZ0VBQXdDO0FBRXhDLE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7QUFDekcsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBRTdHLElBQUksUUFBUSxDQUFDO0FBRWIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDN0MsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQzNCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQztBQU0vQixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTO0lBQ3BFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFFL0MsTUFBTSxlQUFlLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHlCQUF5QixFQUM1RCxDQUFDLFNBQWlCLEVBQUUsSUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxD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Q0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvbWlzZSBhcyBCbHVlYmlyZCB9IGZyb20gJ2JsdWViaXJkJztcclxuXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgQlMgZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuXHJcbmltcG9ydCB7IEJhbm5lcmxvcmRNb2R1bGVNYW5hZ2VyIH0gZnJvbSAnLi9ibW0vaW5kZXgnO1xyXG5cclxuaW1wb3J0IGdldFZlcnNpb24gZnJvbSAnZXhlLXZlcnNpb24nO1xyXG5cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIsIHsgc29ydCB9IGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGFjdGlvbnMsIEZsZXhMYXlvdXQsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgZ2V0RWxlbWVudFZhbHVlLCBnZXRYTUxEYXRhLCByZWZyZXNoR2FtZVBhcmFtcywgd2Fsa0FzeW5jIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7XHJcbiAgQkFOTkVSTE9SRF9FWEVDLCBHQU1FX0lELCBJMThOX05BTUVTUEFDRSxcclxuICBNT0RVTEVTLCBPRkZJQ0lBTF9NT0RVTEVTLCBTVUJNT0RfRklMRSxcclxufSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBDdXN0b21JdGVtUmVuZGVyZXIgZnJvbSAnLi9jdXN0b21JdGVtUmVuZGVyZXInO1xyXG5pbXBvcnQgeyBtaWdyYXRlMDI2LCBtaWdyYXRlMDQ1IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IHsgSUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgeyBnZXRDYWNoZSwgcmVmcmVzaENhY2hlIH0gZnJvbSAnLi9zdWJNb2RDYWNoZSc7XHJcbmltcG9ydCB7IElMb2FkT3JkZXIsIElNb2R1bGVDYWNoZSwgSU1vZHVsZUluZm9FeHRlbmRlZEV4dCwgSVNvcnRQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5cclxuaW1wb3J0IHsgY3JlYXRlQWN0aW9uIH0gZnJvbSAncmVkdXgtYWN0JztcclxuXHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL3ZpZXdzL1NldHRpbmdzJztcclxuXHJcbmNvbnN0IExBVU5DSEVSX0VYRUMgPSBwYXRoLmpvaW4oJ2JpbicsICdXaW42NF9TaGlwcGluZ19DbGllbnQnLCAnVGFsZVdvcmxkcy5Nb3VudEFuZEJsYWRlLkxhdW5jaGVyLmV4ZScpO1xyXG5jb25zdCBNT0RESU5HX0tJVF9FWEVDID0gcGF0aC5qb2luKCdiaW4nLCAnV2luNjRfU2hpcHBpbmdfd0VkaXRvcicsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XHJcblxyXG5sZXQgU1RPUkVfSUQ7XHJcblxyXG5jb25zdCBHT0dfSURTID0gWycxODAyNTM5NTI2JywgJzE1NjQ3ODE0OTQnXTtcclxuY29uc3QgU1RFQU1BUFBfSUQgPSAyNjE1NTA7XHJcbmNvbnN0IEVQSUNBUFBfSUQgPSAnQ2hpY2thZGVlJztcclxuXHJcbi8vIEEgc2V0IG9mIGZvbGRlciBuYW1lcyAobG93ZXJjYXNlZCkgd2hpY2ggYXJlIGF2YWlsYWJsZSBhbG9uZ3NpZGUgdGhlXHJcbi8vICBnYW1lJ3MgbW9kdWxlcyBmb2xkZXIuIFdlIGNvdWxkJ3ZlIHVzZWQgdGhlIGZvbW9kIGluc3RhbGxlciBzdG9wIHBhdHRlcm5zXHJcbi8vICBmdW5jdGlvbmFsaXR5IGZvciB0aGlzLCBidXQgaXQncyBiZXR0ZXIgaWYgdGhpcyBleHRlbnNpb24gaXMgc2VsZiBjb250YWluZWQ7XHJcbi8vICBlc3BlY2lhbGx5IGdpdmVuIHRoYXQgdGhlIGdhbWUncyBtb2RkaW5nIHBhdHRlcm4gY2hhbmdlcyBxdWl0ZSBvZnRlbi5cclxuY29uc3QgUk9PVF9GT0xERVJTID0gbmV3IFNldChbJ2JpbicsICdkYXRhJywgJ2d1aScsICdpY29ucycsICdtb2R1bGVzJyxcclxuICAnbXVzaWMnLCAnc2hhZGVycycsICdzb3VuZHMnLCAneG1sc2NoZW1hcyddKTtcclxuXHJcbmNvbnN0IHNldFNvcnRPbkRlcGxveSA9IGNyZWF0ZUFjdGlvbignTU5CMl9TRVRfU09SVF9PTl9ERVBMT1knLFxyXG4gIChwcm9maWxlSWQ6IHN0cmluZywgc29ydDogYm9vbGVhbikgPT4gKHsgcHJvZmlsZUlkLCBzb3J0IH0pKTtcclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0U29ydE9uRGVwbG95IGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT5cclxuICAgICAgdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NvcnRPbkRlcGxveScsIHBheWxvYWQucHJvZmlsZUlkXSwgcGF5bG9hZC5zb3J0KSxcclxuICB9LFxyXG4gIGRlZmF1bHRzOiB7XHJcbiAgICBzb3J0T25EZXBsb3k6IHt9LFxyXG4gIH0sXHJcbn07XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0VQSUNBUFBfSUQsIFNURUFNQVBQX0lELnRvU3RyaW5nKCksIC4uLkdPR19JRFNdKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiB7XHJcbiAgICAgIFNUT1JFX0lEID0gZ2FtZS5nYW1lU3RvcmVJZDtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShnYW1lLmdhbWVQYXRoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Um9vdE1vZChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgbm90U3VwcG9ydGVkID0geyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9O1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIERpZmZlcmVudCBnYW1lLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XHJcbiAgY29uc3QgbW9kc0ZpbGUgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSkgIT09IC0xKTtcclxuICBpZiAobW9kc0ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVGhlcmUncyBubyBNb2R1bGVzIGZvbGRlci5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGlkeCA9IG1vZHNGaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSk7XHJcbiAgY29uc3Qgcm9vdEZvbGRlck1hdGNoZXMgPSBsb3dlcmVkLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4gKCgoc2VnbWVudHMubGVuZ3RoIC0gMSkgPiBpZHgpICYmIFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSkpO1xyXG4gIH0pIHx8IFtdO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiAocm9vdEZvbGRlck1hdGNoZXMubGVuZ3RoID4gMCksIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUm9vdE1vZChmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgY29uc3QgbW9kdWxlRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMpICE9PSAtMSk7XHJcbiAgY29uc3QgaWR4ID0gbW9kdWxlRmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKTtcclxuICBjb25zdCBzdWJNb2RzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLm1hcChzdWJNb2RzLCBhc3luYyAobW9kRmlsZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtb2RGaWxlKSwgJ0lkJyk7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShzdWJNb2RJZCk7XHJcbiAgfSlcclxuICAudGhlbigoc3ViTW9kSWRzOiBzdHJpbmdbXSkgPT4ge1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIGNvbnN0IGxhc3RFbGVtZW50SWR4ID0gc2VnbWVudHMubGVuZ3RoIC0gMTtcclxuXHJcbiAgICAgIC8vIElnbm9yZSBkaXJlY3RvcmllcyBhbmQgZW5zdXJlIHRoYXQgdGhlIGZpbGUgY29udGFpbnMgYSBrbm93biByb290IGZvbGRlciBhdFxyXG4gICAgICAvLyAgdGhlIGV4cGVjdGVkIGluZGV4LlxyXG4gICAgICByZXR1cm4gKFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSlcclxuICAgICAgICAmJiAocGF0aC5leHRuYW1lKHNlZ21lbnRzW2xhc3RFbGVtZW50SWR4XSkgIT09ICcnKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHN1Yk1vZElkcy5sZW5ndGggPiAwXHJcbiAgICAgID8gW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAgICAgICAga2V5OiAnc3ViTW9kSWRzJyxcclxuICAgICAgICAgICAgdmFsdWU6IHN1Yk1vZElkcyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXVxyXG4gICAgICA6IFtdO1xyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gYXR0cmlidXRlcy5jb25jYXQoZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBkZXN0aW5hdGlvbiA9IGZpbGUuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zbGljZShpZHgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKHBhdGguc2VwKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uLFxyXG4gICAgICB9O1xyXG4gICAgfSkpO1xyXG5cclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Rm9yU3VibW9kdWxlcyhmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gQ2hlY2sgdGhpcyBpcyBhIG1vZCBmb3IgQmFubmVybG9yZCBhbmQgaXQgY29udGFpbnMgYSBTdWJNb2R1bGUueG1sXHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSkgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTdWJNb2R1bGVzKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBSZW1vdmUgZGlyZWN0b3JpZXMgc3RyYWlnaHQgYXdheS5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4gcGF0aC5leHRuYW1lKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdKSAhPT0gJyc7XHJcbiAgfSk7XHJcbiAgY29uc3Qgc3ViTW9kSWRzID0gW107XHJcbiAgY29uc3Qgc3ViTW9kcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2Uoc3ViTW9kcywgYXN5bmMgKGFjY3VtLCBtb2RGaWxlOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gbW9kRmlsZS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICBjb25zdCBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtb2RGaWxlKSwgJ0lkJyk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gKHNlZ21lbnRzLmxlbmd0aCA+IDEpXHJcbiAgICAgID8gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMl1cclxuICAgICAgOiBzdWJNb2RJZDtcclxuICAgIGlmIChtb2ROYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdJbnZhbGlkIFN1Ym1vZHVsZS54bWwgZmlsZSAtIGluZm9ybSB0aGUgbW9kIGF1dGhvcicpKTtcclxuICAgIH1cclxuICAgIHN1Yk1vZElkcy5wdXNoKHN1Yk1vZElkKTtcclxuICAgIGNvbnN0IGlkeCA9IG1vZEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKFNVQk1PRF9GSUxFKTtcclxuICAgIC8vIEZpbHRlciB0aGUgbW9kIGZpbGVzIGZvciB0aGlzIHNwZWNpZmljIHN1Ym1vZHVsZS5cclxuICAgIGNvbnN0IHN1Yk1vZEZpbGVzOiBzdHJpbmdbXVxyXG4gICAgICA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IGZpbGUuc2xpY2UoMCwgaWR4KSA9PT0gbW9kRmlsZS5zbGljZSgwLCBpZHgpKTtcclxuICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IHN1Yk1vZEZpbGVzLm1hcCgobW9kRmlsZTogc3RyaW5nKSA9PiAoe1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogbW9kRmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihNT0RVTEVTLCBtb2ROYW1lLCBtb2RGaWxlLnNsaWNlKGlkeCkpLFxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIGFjY3VtLmNvbmNhdChpbnN0cnVjdGlvbnMpO1xyXG4gIH0sIFtdKVxyXG4gIC50aGVuKG1lcmdlZCA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZHNBdHRyID0ge1xyXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAga2V5OiAnc3ViTW9kSWRzJyxcclxuICAgICAgdmFsdWU6IHN1Yk1vZElkcyxcclxuICAgIH07XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zOiBbXS5jb25jYXQobWVyZ2VkLCBbc3ViTW9kSWRzQXR0cl0pIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlbnN1cmVPZmZpY2lhbExhdW5jaGVyKGNvbnRleHQsIGRpc2NvdmVyeSkge1xyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woR0FNRV9JRCwgJ1RhbGVXb3JsZHNCYW5uZXJsb3JkTGF1bmNoZXInLCB7XHJcbiAgICBpZDogJ1RhbGVXb3JsZHNCYW5uZXJsb3JkTGF1bmNoZXInLFxyXG4gICAgbmFtZTogJ09mZmljaWFsIExhdW5jaGVyJyxcclxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBwYXRoLmJhc2VuYW1lKExBVU5DSEVSX0VYRUMpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICBwYXRoLmJhc2VuYW1lKExBVU5DSEVSX0VYRUMpLFxyXG4gICAgXSxcclxuICAgIHBhdGg6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTEFVTkNIRVJfRVhFQyksXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ2JpbicsICdXaW42NF9TaGlwcGluZ19DbGllbnQnKSxcclxuICAgIGhpZGRlbjogZmFsc2UsXHJcbiAgICBjdXN0b206IGZhbHNlLFxyXG4gIH0sIGZhbHNlKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldE1vZGRpbmdUb29sKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZGRlbj86IGJvb2xlYW4pIHtcclxuICBjb25zdCB0b29sSWQgPSAnYmFubmVybG9yZC1zZGsnO1xyXG4gIGNvbnN0IGV4ZWMgPSBwYXRoLmJhc2VuYW1lKE1PRERJTkdfS0lUX0VYRUMpO1xyXG4gIGNvbnN0IHRvb2wgPSB7XHJcbiAgICBpZDogdG9vbElkLFxyXG4gICAgbmFtZTogJ01vZGRpbmcgS2l0JyxcclxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBleGVjLFxyXG4gICAgcmVxdWlyZWRGaWxlczogWyBleGVjIF0sXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRERJTkdfS0lUX0VYRUMpLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIHBhdGguZGlybmFtZShNT0RESU5HX0tJVF9FWEVDKSksXHJcbiAgICBoaWRkZW4sXHJcbiAgICBjdXN0b206IGZhbHNlLFxyXG4gIH07XHJcblxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woR0FNRV9JRCwgdG9vbElkLCB0b29sLCBmYWxzZSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnksIGJtbTogQmFubmVybG9yZE1vZHVsZU1hbmFnZXIpIHtcclxuICBpZiAoYm1tID09PSB1bmRlZmluZWQpIHtcclxuICAgIGJtbSA9IGF3YWl0IEJhbm5lcmxvcmRNb2R1bGVNYW5hZ2VyLmNyZWF0ZUFzeW5jKCk7XHJcbiAgfVxyXG4gIC8vIFF1aWNrbHkgZW5zdXJlIHRoYXQgdGhlIG9mZmljaWFsIExhdW5jaGVyIGlzIGFkZGVkLlxyXG4gIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9ERElOR19LSVRfRVhFQykpO1xyXG4gICAgc2V0TW9kZGluZ1Rvb2woY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHRvb2xzID0gZGlzY292ZXJ5Py50b29scztcclxuICAgIGlmICgodG9vbHMgIT09IHVuZGVmaW5lZClcclxuICAgICYmICh1dGlsLmdldFNhZmUodG9vbHMsIFsnYmFubmVybG9yZC1zZGsnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnksIHRydWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSWYgZ2FtZSBzdG9yZSBub3QgZm91bmQsIGxvY2F0aW9uIG1heSBiZSBzZXQgbWFudWFsbHkgLSBhbGxvdyBzZXR1cFxyXG4gIC8vICBmdW5jdGlvbiB0byBjb250aW51ZS5cclxuICBjb25zdCBmaW5kU3RvcmVJZCA9ICgpID0+IGZpbmRHYW1lKCkuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBjb25zdCBzdGFydFN0ZWFtID0gKCkgPT4gZmluZFN0b3JlSWQoKVxyXG4gICAgLnRoZW4oKCkgPT4gKFNUT1JFX0lEID09PSAnc3RlYW0nKVxyXG4gICAgICA/IHV0aWwuR2FtZVN0b3JlSGVscGVyLmxhdW5jaEdhbWVTdG9yZShjb250ZXh0LmFwaSwgU1RPUkVfSUQsIHVuZGVmaW5lZCwgdHJ1ZSlcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKSk7XHJcblxyXG4gIC8vIENoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgc2V0IHRoZSBsb2FkIG9yZGVyIG9iamVjdCBmb3IgdGhpcyBwcm9maWxlXHJcbiAgLy8gIGFuZCBjcmVhdGUgaXQgaWYgd2UgaGF2ZW4ndC5cclxuICByZXR1cm4gc3RhcnRTdGVhbSgpLnRoZW4oYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgcmVmcmVzaENhY2hlKGNvbnRleHQsIGJtbSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfSlcclxuICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBWYWxpZCB1c2UgY2FzZSB3aGVuIGF0dGVtcHRpbmcgdG8gc3dpdGNoIHRvXHJcbiAgICAgIC8vICBCYW5uZXJsb3JkIHdpdGhvdXQgYW55IGFjdGl2ZSBwcm9maWxlLlxyXG4gICAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwge30pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0U29ydChzb3J0UHJvcHM6IElTb3J0UHJvcHMpIHtcclxuICBjb25zdCB7IGJtbSB9ID0gc29ydFByb3BzO1xyXG4gIGNvbnN0IENBQ0hFOiBJTW9kdWxlQ2FjaGUgPSBnZXRDYWNoZSgpO1xyXG4gIGNvbnN0IHNvcnRlZCA9IGJtbS5zb3J0KE9iamVjdC52YWx1ZXMoQ0FDSEUpKTtcclxuICByZXR1cm4gc29ydGVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0V4dGVybmFsKGNvbnRleHQsIHN1Yk1vZElkKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICBtb2RJZHMuZm9yRWFjaChtb2RJZCA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZHMgPSB1dGlsLmdldFNhZmUobW9kc1ttb2RJZF0sIFsnYXR0cmlidXRlcycsICdzdWJNb2RJZHMnXSwgW10pO1xyXG4gICAgaWYgKHN1Yk1vZElkcy5pbmNsdWRlcyhzdWJNb2RJZCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm1tOiBCYW5uZXJsb3JkTW9kdWxlTWFuYWdlcikge1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgZGVwbG95UHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAoKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gZGVwbG95UHJvZmlsZT8uZ2FtZUlkKSB8fCAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSkge1xyXG4gICAgLy8gRGVwbG95bWVudCBldmVudCBzZWVtcyB0byBiZSBleGVjdXRlZCBmb3IgYSBwcm9maWxlIG90aGVyXHJcbiAgICAvLyAgdGhhbiB0aGUgY3VycmVudGx5IGFjdGl2ZSBvbmUuIE5vdCBnb2luZyB0byBjb250aW51ZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0LCBibW0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgLy8gUHJvY2Vzc0NhbmNlbGVkIG1lYW5zIHRoYXQgd2Ugd2VyZSB1bmFibGUgdG8gc2NhbiBmb3IgZGVwbG95ZWRcclxuICAgIC8vICBzdWJNb2R1bGVzLCBwcm9iYWJseSBiZWNhdXNlIGdhbWUgZGlzY292ZXJ5IGlzIGluY29tcGxldGUuXHJcbiAgICAvLyBJdCdzIGJleW9uZCB0aGUgc2NvcGUgb2YgdGhpcyBmdW5jdGlvbiB0byByZXBvcnQgZGlzY292ZXJ5XHJcbiAgICAvLyAgcmVsYXRlZCBpc3N1ZXMuXHJcbiAgICByZXR1cm4gKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIHt9KTtcclxuXHJcbiAgaWYgKHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdtb3VudGFuZGJsYWRlMicsICdzb3J0T25EZXBsb3knLCBhY3RpdmVQcm9maWxlLmlkXSwgdHJ1ZSkpIHtcclxuICAgIHJldHVybiBzb3J0SW1wbChjb250ZXh0LCBibW0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZWZyZXNoRnVuYygpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIGJtbSkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gUmFjZSBjb25kaXRpb24gP1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpdGVtcyk7XHJcbiAgfVxyXG4gIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICBpZiAoT2JqZWN0LmtleXMoQ0FDSEUpLmxlbmd0aCAhPT0gaXRlbXMubGVuZ3RoKSB7XHJcbiAgICBjb25zdCBkaXNwbGF5SXRlbXMgPSBPYmplY3QudmFsdWVzKENBQ0hFKS5tYXAoaXRlciA9PiAoe1xyXG4gICAgICBpZDogaXRlci5pZCxcclxuICAgICAgbmFtZTogaXRlci5uYW1lLFxyXG4gICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICBleHRlcm5hbDogaXNFeHRlcm5hbChjb250ZXh0LCBpdGVyLmlkKSxcclxuICAgICAgb2ZmaWNpYWw6IGl0ZXIuaXNPZmZpY2lhbCxcclxuICAgIH0pKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGlzcGxheUl0ZW1zKTtcclxuICB9IGVsc2Uge1xyXG4gICAgbGV0IG9yZGVyZWQgPSBbXTtcclxuICAgIGlmICh1cGRhdGVUeXBlICE9PSAnZHJhZy1uLWRyb3AnKSB7XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICAgIG9yZGVyZWQgPSBpdGVtcy5maWx0ZXIoaXRlbSA9PiBsb2FkT3JkZXJbaXRlbS5pZF0gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHMuaWRdLnBvcyAtIGxvYWRPcmRlcltyaHMuaWRdLnBvcyk7XHJcbiAgICAgIGNvbnN0IHVuT3JkZXJlZCA9IGl0ZW1zLmZpbHRlcihpdGVtID0+IGxvYWRPcmRlcltpdGVtLmlkXSA9PT0gdW5kZWZpbmVkKTtcclxuICAgICAgb3JkZXJlZCA9IFtdLmNvbmNhdChvcmRlcmVkLCB1bk9yZGVyZWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3JkZXJlZCA9IGl0ZW1zO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvcmRlcmVkKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpIHtcclxuICBjb25zdCB0ID0gY29udGV4dC5hcGkudHJhbnNsYXRlO1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLCB7IGlkOiAnbG9hZG9yZGVyaW5mbycgfSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2gyJywge30sIHQoJ01hbmFnaW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdZb3UgY2FuIGFkanVzdCB0aGUgbG9hZCBvcmRlciBmb3IgQmFubmVybG9yZCBieSBkcmFnZ2luZyBhbmQgZHJvcHBpbmcgbW9kcyB1cCBvciBkb3duIG9uIHRoaXMgcGFnZS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdQbGVhc2Uga2VlcCBpbiBtaW5kIHRoYXQgQmFubmVybG9yZCBpcyBzdGlsbCBpbiBFYXJseSBBY2Nlc3MsIHdoaWNoIG1lYW5zIHRoYXQgdGhlcmUgbWlnaHQgYmUgc2lnbmlmaWNhbnQgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdjaGFuZ2VzIHRvIHRoZSBnYW1lIGFzIHRpbWUgZ29lcyBvbi4gUGxlYXNlIG5vdGlmeSB1cyBvZiBhbnkgVm9ydGV4IHJlbGF0ZWQgaXNzdWVzIHlvdSBlbmNvdW50ZXIgd2l0aCB0aGlzICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnZXh0ZW5zaW9uIHNvIHdlIGNhbiBmaXggaXQuIEZvciBtb3JlIGluZm9ybWF0aW9uIGFuZCBoZWxwIHNlZTogJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdhJywgeyBvbkNsaWNrOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL01vZGRpbmdfQmFubmVybG9yZF93aXRoX1ZvcnRleCcpIH0sIHQoJ01vZGRpbmcgQmFubmVybG9yZCB3aXRoIFZvcnRleC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdIb3cgdG8gdXNlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdDaGVjayB0aGUgYm94IG5leHQgdG8gdGhlIG1vZHMgeW91IHdhbnQgdG8gYmUgYWN0aXZlIGluIHRoZSBnYW1lLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdDbGljayBBdXRvIFNvcnQgaW4gdGhlIHRvb2xiYXIuIChTZWUgYmVsb3cgZm9yIGRldGFpbHMpLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdNYWtlIHN1cmUgdG8gcnVuIHRoZSBnYW1lIGRpcmVjdGx5IHZpYSB0aGUgUGxheSBidXR0b24gaW4gdGhlIHRvcCBsZWZ0IGNvcm5lciAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnKG9uIHRoZSBCYW5uZXJsb3JkIHRpbGUpLiBZb3VyIFZvcnRleCBsb2FkIG9yZGVyIG1heSBub3QgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIFNpbmdsZSBQbGF5ZXIgZ2FtZSB0aHJvdWdoIHRoZSBnYW1lIGxhdW5jaGVyLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdPcHRpb25hbDogTWFudWFsbHkgZHJhZyBhbmQgZHJvcCBtb2RzIHRvIGRpZmZlcmVudCBwb3NpdGlvbnMgaW4gdGhlIGxvYWQgb3JkZXIgKGZvciB0ZXN0aW5nIGRpZmZlcmVudCBvdmVycmlkZXMpLiBNb2RzIGZ1cnRoZXIgZG93biB0aGUgbGlzdCBvdmVycmlkZSBtb2RzIGZ1cnRoZXIgdXAuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdQbGVhc2Ugbm90ZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnVGhlIGxvYWQgb3JkZXIgcmVmbGVjdGVkIGhlcmUgd2lsbCBvbmx5IGJlIGxvYWRlZCBpZiB5b3UgcnVuIHRoZSBnYW1lIHZpYSB0aGUgcGxheSBidXR0b24gaW4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3RoZSB0b3AgbGVmdCBjb3JuZXIuIERvIG5vdCBydW4gdGhlIFNpbmdsZSBQbGF5ZXIgZ2FtZSB0aHJvdWdoIHRoZSBsYXVuY2hlciwgYXMgdGhhdCB3aWxsIGlnbm9yZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAndGhlIFZvcnRleCBsb2FkIG9yZGVyIGFuZCBnbyBieSB3aGF0IGlzIHNob3duIGluIHRoZSBsYXVuY2hlciBpbnN0ZWFkLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdGb3IgQmFubmVybG9yZCwgbW9kcyBzb3J0ZWQgZnVydGhlciB0b3dhcmRzIHRoZSBib3R0b20gb2YgdGhlIGxpc3Qgd2lsbCBvdmVycmlkZSBtb2RzIGZ1cnRoZXIgdXAgKGlmIHRoZXkgY29uZmxpY3QpLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnTm90ZTogSGFybW9ueSBwYXRjaGVzIG1heSBiZSB0aGUgZXhjZXB0aW9uIHRvIHRoaXMgcnVsZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQXV0byBTb3J0IHVzZXMgdGhlIFN1Yk1vZHVsZS54bWwgZmlsZXMgKHRoZSBlbnRyaWVzIHVuZGVyIDxEZXBlbmRlZE1vZHVsZXM+KSB0byBkZXRlY3QgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2RlcGVuZGVuY2llcyB0byBzb3J0IGJ5LiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSWYgeW91IGNhbm5vdCBzZWUgeW91ciBtb2QgaW4gdGhpcyBsb2FkIG9yZGVyLCBWb3J0ZXggbWF5IGhhdmUgYmVlbiB1bmFibGUgdG8gZmluZCBvciBwYXJzZSBpdHMgU3ViTW9kdWxlLnhtbCBmaWxlLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnTW9zdCAtIGJ1dCBub3QgYWxsIG1vZHMgLSBjb21lIHdpdGggb3IgbmVlZCBhIFN1Yk1vZHVsZS54bWwgZmlsZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSGl0IHRoZSBkZXBsb3kgYnV0dG9uIHdoZW5ldmVyIHlvdSBpbnN0YWxsIGFuZCBlbmFibGUgYSBuZXcgbW9kLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgZ2FtZSB3aWxsIG5vdCBsYXVuY2ggdW5sZXNzIHRoZSBnYW1lIHN0b3JlIChTdGVhbSwgRXBpYywgZXRjKSBpcyBzdGFydGVkIGJlZm9yZWhhbmQuIElmIHlvdVxcJ3JlIGdldHRpbmcgdGhlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdcIlVuYWJsZSB0byBJbml0aWFsaXplIFN0ZWFtIEFQSVwiIGVycm9yLCByZXN0YXJ0IFN0ZWFtLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUdhbWVWZXJzaW9uKGRpc2NvdmVyeVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ2RldmVsb3BtZW50JyAmJiBzZW12ZXIuc2F0aXNmaWVzKHV0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9uLCAnPDEuNC4wJykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ25vdCBzdXBwb3J0ZWQgaW4gb2xkZXIgVm9ydGV4IHZlcnNpb25zJykpO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEocGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1ZlcnNpb24ueG1sJykpO1xyXG4gICAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBCQU5ORVJMT1JEX0VYRUMpO1xyXG4gICAgY29uc3QgdmFsdWUgPSBkYXRhPy5WZXJzaW9uPy5TaW5nbGVwbGF5ZXI/LlswXT8uJD8uVmFsdWVcclxuICAgICAgLnNsaWNlKDEpXHJcbiAgICAgIC5zcGxpdCgnLicpXHJcbiAgICAgIC5zbGljZSgwLCAzKVxyXG4gICAgICAuam9pbignLicpO1xyXG4gICAgcmV0dXJuIChzZW12ZXIudmFsaWQodmFsdWUpKSA/IFByb21pc2UucmVzb2x2ZSh2YWx1ZSkgOiBnZXRWZXJzaW9uKGV4ZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5sZXQgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuYXN5bmMgZnVuY3Rpb24gc29ydEltcGwoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIGJtbTogQmFubmVybG9yZE1vZHVsZU1hbmFnZXIpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gUHJvYmFibHkgYmVzdCB0aGF0IHdlIGRvbid0IHJlcG9ydCB0aGlzIHZpYSBub3RpZmljYXRpb24gYXMgYSBudW1iZXJcclxuICAgIC8vICBvZiB0aGluZ3MgbWF5IGhhdmUgb2NjdXJyZWQgdGhhdCBjYXVzZWQgdGhpcyBpc3N1ZS4gV2UgbG9nIGl0IGluc3RlYWQuXHJcbiAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ05vIGFjdGl2ZSBwcm9maWxlJyB9KTtcclxuICAgIF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG5cclxuICBsZXQgc29ydGVkOiBJTW9kdWxlSW5mb0V4dGVuZGVkRXh0W107XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0LCBibW0pO1xyXG4gICAgc29ydGVkID0gdFNvcnQoeyBsb2FkT3JkZXIsIGJtbSB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNvcnQgbW9kcycsIGVycik7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBuZXdPcmRlcjogSUxvYWRPcmRlciA9IHNvcnRlZC5yZWR1Y2UoKGFjY3VtOiBJTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kOiBJTW9kdWxlSW5mb0V4dGVuZGVkRXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWR4OiBudW1iZXIpID0+IHtcclxuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9XHJcbiAgICBhY2N1bVttb2Qudm9ydGV4SWQgfHwgbW9kLmlkXSA9IHtcclxuICAgICAgcG9zOiBpZHgsXHJcbiAgICAgIGVuYWJsZWQ6IGxvYWRPcmRlclttb2Qudm9ydGV4SWQgfHwgbW9kLmlkXT8uZW5hYmxlZCB8fCB0cnVlLFxyXG4gICAgICBleHRlcm5hbDogaXNFeHRlcm5hbChjb250ZXh0LCBtb2QuaWQpLFxyXG4gICAgICBkYXRhOiBtb2QsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIoYWN0aXZlUHJvZmlsZS5pZCwgbmV3T3JkZXIgYXMgYW55KSk7XHJcbiAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIG5ld09yZGVyKVxyXG4gICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnbW5iMi1zb3J0LWZpbmlzaGVkJyxcclxuICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICBtZXNzYWdlOiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0ZpbmlzaGVkIHNvcnRpbmcnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgfSkpLmZpbmFsbHkoKCkgPT4gX0lTX1NPUlRJTkcgPSBmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnbW91bnRhbmRibGFkZTInXSwgcmVkdWNlcik7XHJcbiAgbGV0IGJtbTogQmFubmVybG9yZE1vZHVsZU1hbmFnZXI7XHJcbiAgKGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncyBhcyBhbnkpKCdJbnRlcmZhY2UnLCBTZXR0aW5ncywgKCkgPT4gKHtcclxuICAgIHQ6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSxcclxuICAgIG9uU2V0U29ydE9uRGVwbG95OiAocHJvZmlsZUlkOiBzdHJpbmcsIHNvcnQ6IGJvb2xlYW4pID0+XHJcbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFNvcnRPbkRlcGxveShwcm9maWxlSWQsIHNvcnQpKSxcclxuICB9KSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIHJldHVybiBwcm9maWxlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEO1xyXG4gIH0sIDUxKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnTW91bnQgJiBCbGFkZSBJSTpcXHRCYW5uZXJsb3JkJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICcuJyxcclxuICAgIGdldEdhbWVWZXJzaW9uOiByZXNvbHZlR2FtZVZlcnNpb24sXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgYm1tKSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgXSxcclxuICAgIHBhcmFtZXRlcnM6IFtdLFxyXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQudG9TdHJpbmcoKSxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IFNURUFNQVBQX0lELFxyXG4gICAgICBlcGljQXBwSWQ6IEVQSUNBUFBfSUQsXHJcbiAgICAgIGN1c3RvbU9wZW5Nb2RzUGF0aDogTU9EVUxFUyxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcclxuICAgICdtb3VudGFuZGJsYWRlMl9jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMpLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJQ29sbGVjdGlvbnNEYXRhKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXHJcbiAgICAodCkgPT4gdCgnTW91bnQgYW5kIEJsYWRlIDIgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIC8vIFJlZ2lzdGVyIHRoZSBMTyBwYWdlLlxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXJQYWdlKHtcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIGNyZWF0ZUluZm9QYW5lbDogKHByb3BzKSA9PiB7XHJcbiAgICAgIHJlZnJlc2hGdW5jID0gcHJvcHMucmVmcmVzaDtcclxuICAgICAgcmV0dXJuIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpO1xyXG4gICAgfSxcclxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXHJcbiAgICBnYW1lQXJ0VVJMOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIHByZVNvcnQ6IChpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlKSA9PlxyXG4gICAgICBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIGJtbSksXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcikgPT4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIGl0ZW1SZW5kZXJlcjogKHByb3BzKSA9PiBSZWFjdC5jcmVhdGVFbGVtZW50KEN1c3RvbUl0ZW1SZW5kZXJlci5kZWZhdWx0LCB7XHJcbiAgICAgIC4uLnByb3BzLFxyXG4gICAgICBtb2R1bGVNYW5hZ2VyOiBibW0sXHJcbiAgICB9KSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHJvb3Rtb2QnLCAyMCwgdGVzdFJvb3RNb2QsIGluc3RhbGxSb290TW9kKTtcclxuXHJcbiAgLy8gSW5zdGFsbHMgb25lIG9yIG1vcmUgc3VibW9kdWxlcy5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiYW5uZXJsb3Jkc3VibW9kdWxlcycsIDI1LCB0ZXN0Rm9yU3VibW9kdWxlcywgaW5zdGFsbFN1Yk1vZHVsZXMpO1xyXG5cclxuICAvLyBBIHZlcnkgc2ltcGxlIG1pZ3JhdGlvbiB0aGF0IGludGVuZHMgdG8gYWRkIHRoZSBzdWJNb2RJZHMgYXR0cmlidXRlXHJcbiAgLy8gIHRvIG1vZHMgdGhhdCBhY3QgYXMgXCJtb2QgcGFja3NcIi4gVGhpcyBtaWdyYXRpb24gaXMgbm9uLWludmFzaXZlIGFuZCB3aWxsXHJcbiAgLy8gIG5vdCByZXBvcnQgYW55IGVycm9ycy4gU2lkZSBlZmZlY3RzIG9mIHRoZSBtaWdyYXRpb24gbm90IHdvcmtpbmcgY29ycmVjdGx5XHJcbiAgLy8gIHdpbGwgbm90IGFmZmVjdCB0aGUgdXNlcidzIGV4aXN0aW5nIGVudmlyb25tZW50LlxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24ob2xkID0+IG1pZ3JhdGUwMjYoY29udGV4dC5hcGksIG9sZCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24ob2xkID0+IG1pZ3JhdGUwNDUoY29udGV4dC5hcGksIG9sZCkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdnZW5lcmljLWxvYWQtb3JkZXItaWNvbnMnLCAyMDAsXHJcbiAgICBfSVNfU09SVElORyA/ICdzcGlubmVyJyA6ICdsb290LXNvcnQnLCB7fSwgJ0F1dG8gU29ydCcsICgpID0+IHtcclxuICAgICAgc29ydEltcGwoY29udGV4dCwgYm1tKTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKGFzeW5jICgpID0+IHtcclxuICAgIGJtbSA9IGF3YWl0IEJhbm5lcmxvcmRNb2R1bGVNYW5hZ2VyLmNyZWF0ZUFzeW5jKCk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIGJtbSkpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+XHJcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZmlsZUlkLCBibW0pKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZSkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZj8uaWQsIGJtbSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcblxyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIChlbnRyeTogeyBmaWxlUGF0aDogc3RyaW5nLCBjYW5kaWRhdGVzOiBzdHJpbmdbXSB9KSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ10sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC5cclxuICAgICAgICAgIC8vICBUaGF0IHdheSwgdm9ydGV4IHdpbGwgY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0XHJcbiAgICAgICAgICAvLyAgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHRhcmdldCBkZXN0aW5hdGlvbiBmaWxlIGlmIGl0IGV4aXN0cy5cclxuICAgICAgICAgIC8vICB0aGlzIGlzIHRvIGNvbXBsZXRlbHkgYXZvaWQgYSBzY2VuYXJpbyB3aGVyZSB3ZSBtYXkgYXR0ZW1wdCB0b1xyXG4gICAgICAgICAgLy8gIGNvcHkgdGhlIHNhbWUgZmlsZSBvbnRvIGl0c2VsZi5cclxuICAgICAgICAgIHJldHVybiBmcy5yZW1vdmVBc3luYyh0YXJnZXRQYXRoKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19