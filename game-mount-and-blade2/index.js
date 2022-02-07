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
const exe_version_1 = __importDefault(require("exe-version"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const util_1 = require("./util");
const common_1 = require("./common");
const customItemRenderer_1 = __importDefault(require("./customItemRenderer"));
const migrations_1 = require("./migrations");
const ComMetadataManager_1 = __importDefault(require("./ComMetadataManager"));
const subModCache_1 = require("./subModCache");
const collections_1 = require("./collections/collections");
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
        [setSortOnDeploy]: (state, payload) => vortex_api_1.util.setSafe(state, ['sortOnDeploy', payload.profileId], payload.sort)
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
    const filtered = files.filter(file => {
        const segments = file.split(path_1.default.sep).map(seg => seg.toLowerCase());
        const lastElementIdx = segments.length - 1;
        return (ROOT_FOLDERS.has(segments[idx])
            && (path_1.default.extname(segments[lastElementIdx]) !== ''));
    });
    const instructions = filtered.map(file => {
        const destination = file.split(path_1.default.sep)
            .slice(idx)
            .join(path_1.default.sep);
        return {
            type: 'copy',
            source: file,
            destination,
        };
    });
    return Promise.resolve({ instructions });
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
function prepareForModding(context, discovery, metaManager) {
    return __awaiter(this, void 0, void 0, function* () {
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
        return startSteam().then(() => (0, subModCache_1.parseLauncherData)()).then(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, subModCache_1.refreshCache)(context);
            }
            catch (err) {
                return Promise.reject(err);
            }
            const CACHE = (0, subModCache_1.getCache)();
            const modIds = Object.keys(CACHE);
            const sorted = tSort({ subModIds: modIds, allowLocked: true, metaManager });
        }))
            .catch(err => {
            if (err instanceof vortex_api_1.util.NotFound) {
                context.api.showErrorNotification('Failed to find game launcher data', 'Please run the game at least once through the official game launcher and '
                    + 'try again', { allowReport: false });
                return Promise.resolve();
            }
            else if (err instanceof vortex_api_1.util.ProcessCanceled) {
                context.api.showErrorNotification('Failed to find game launcher data', err, { allowReport: false });
            }
            return Promise.reject(err);
        })
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
function tSort(sortProps, test = false) {
    const { subModIds, allowLocked, loadOrder, metaManager } = sortProps;
    const CACHE = (0, subModCache_1.getCache)();
    const lockedSubMods = (!!loadOrder)
        ? subModIds.filter(subModId => {
            var _a;
            const entry = CACHE[subModId];
            return (!!entry)
                ? !!((_a = loadOrder[entry.vortexId]) === null || _a === void 0 ? void 0 : _a.locked)
                : false;
        })
        : [];
    const alphabetical = subModIds.filter(subMod => !lockedSubMods.includes(subMod))
        .sort();
    const graph = alphabetical.reduce((accum, entry) => {
        const depIds = [...CACHE[entry].dependencies].map(dep => dep.depId);
        accum[entry] = depIds.sort();
        return accum;
    }, {});
    const result = [];
    const visited = [];
    const processing = [];
    const topSort = (node) => {
        processing[node] = true;
        const dependencies = (!!allowLocked)
            ? graph[node]
            : graph[node].filter(element => !common_1.LOCKED_MODULES.has(element));
        for (const dep of dependencies) {
            if (processing[dep]) {
                CACHE[node].invalid.cyclic.push(dep);
                CACHE[dep].invalid.cyclic.push(node);
                visited[node] = true;
                processing[node] = false;
                continue;
            }
            const incompatibleDeps = CACHE[node].invalid.incompatibleDeps;
            const incDep = incompatibleDeps.find(d => d.depId === dep);
            if (Object.keys(graph).includes(dep) && (incDep === undefined)) {
                const depVer = CACHE[dep].subModVer;
                const depInst = CACHE[node].dependencies.find(d => d.depId === dep);
                try {
                    const match = semver_1.default.satisfies(depInst.depVersion, depVer);
                    if (!match && !!(depInst === null || depInst === void 0 ? void 0 : depInst.depVersion) && !!depVer) {
                        CACHE[node].invalid.incompatibleDeps.push({
                            depId: dep,
                            requiredVersion: depInst.depVersion,
                            currentVersion: depVer,
                        });
                    }
                }
                catch (err) {
                    (0, vortex_api_1.log)('debug', 'failed to compare versions', err);
                }
            }
            if (!visited[dep] && !lockedSubMods.includes(dep)) {
                if (!Object.keys(graph).includes(dep)) {
                    CACHE[node].invalid.missing.push(dep);
                }
                else {
                    topSort(dep);
                }
            }
        }
        processing[node] = false;
        visited[node] = true;
        if (!(0, subModCache_1.isInvalid)(node)) {
            result.push(node);
        }
    };
    for (const node in graph) {
        if (!visited[node] && !processing[node]) {
            topSort(node);
        }
    }
    if (allowLocked) {
        return result;
    }
    const subModsWithNoDeps = result.filter(dep => (graph[dep].length === 0)
        || (graph[dep].find(d => !common_1.LOCKED_MODULES.has(d)) === undefined)).sort() || [];
    const tamperedResult = [].concat(subModsWithNoDeps, result.filter(entry => !subModsWithNoDeps.includes(entry)));
    lockedSubMods.forEach(subModId => {
        const pos = loadOrder[CACHE[subModId].vortexId].pos;
        tamperedResult.splice(pos, 0, [subModId]);
    });
    if (test === true) {
        const metaSorted = metaManager.sort(tamperedResult);
        return metaSorted;
    }
    else {
        return tamperedResult;
    }
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
function refreshCacheOnEvent(context, profileId, metaManager) {
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
        yield metaManager.updateDependencyMap(profileId);
        try {
            yield (0, subModCache_1.refreshCache)(context);
        }
        catch (err) {
            return (err instanceof vortex_api_1.util.ProcessCanceled)
                ? Promise.resolve()
                : Promise.reject(err);
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], {});
        if (vortex_api_1.util.getSafe(state, ['settings', 'mountandblade2', 'sortOnDeploy', activeProfile.id], true)) {
            return sortImpl(context, metaManager);
        }
        else {
            const CACHE = (0, subModCache_1.getCache)();
            const modIds = Object.keys(CACHE);
            const sortProps = {
                subModIds: modIds,
                allowLocked: true,
                loadOrder,
                metaManager,
            };
            const sorted = tSort(sortProps);
            if (refreshFunc !== undefined) {
                refreshFunc();
            }
            return (0, util_1.refreshGameParams)(context, loadOrder);
        }
    });
}
function preSort(context, items, direction, updateType, metaManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const CACHE = (0, subModCache_1.getCache)();
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined || (activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID) {
            return items;
        }
        let modIds = Object.keys(CACHE);
        if (items.length > 0 && modIds.length === 0) {
            try {
                yield refreshCacheOnEvent(context, activeProfile.id, metaManager);
                modIds = Object.keys(CACHE);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        let lockedIds = modIds.filter(id => CACHE[id].isLocked);
        try {
            const sortProps = {
                subModIds: lockedIds,
                allowLocked: true,
                metaManager,
            };
            lockedIds = tSort(sortProps);
        }
        catch (err) {
            return Promise.reject(err);
        }
        const lockedItems = lockedIds.map(id => ({
            id: CACHE[id].vortexId,
            name: CACHE[id].subModName,
            imgUrl: `${__dirname}/gameart.jpg`,
            locked: true,
            official: common_1.OFFICIAL_MODULES.has(id),
        }));
        const LAUNCHER_DATA = (0, subModCache_1.getLauncherData)();
        const externalIds = modIds.filter(id => (!CACHE[id].isLocked) && (CACHE[id].vortexId === id));
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
        const LOkeys = ((Object.keys(loadOrder).length > 0)
            ? Object.keys(loadOrder)
            : LAUNCHER_DATA.singlePlayerSubMods.map(mod => mod.subModId));
        const knownExt = externalIds.filter(id => LOkeys.includes(id)) || [];
        const unknownExt = externalIds.filter(id => !LOkeys.includes(id)) || [];
        items = items.filter(item => {
            const isLocked = lockedIds.includes(item.id);
            const hasCacheEntry = Object.keys(CACHE).find(key => CACHE[key].vortexId === item.id) !== undefined;
            return !isLocked && hasCacheEntry;
        });
        const posMap = {};
        let nextAvailable = LOkeys.length;
        const getNextPos = (loId) => {
            if (common_1.LOCKED_MODULES.has(loId)) {
                return Array.from(common_1.LOCKED_MODULES).indexOf(loId);
            }
            if (posMap[loId] === undefined) {
                posMap[loId] = nextAvailable;
                return nextAvailable++;
            }
            else {
                return posMap[loId];
            }
        };
        knownExt.map(key => ({
            id: CACHE[key].vortexId,
            name: CACHE[key].subModName,
            imgUrl: `${__dirname}/gameart.jpg`,
            external: isExternal(context, CACHE[key].vortexId),
            official: common_1.OFFICIAL_MODULES.has(key),
        }))
            .sort((a, b) => { var _a, _b; return (((_a = loadOrder[a.id]) === null || _a === void 0 ? void 0 : _a.pos) || getNextPos(a.id)) - (((_b = loadOrder[b.id]) === null || _b === void 0 ? void 0 : _b.pos) || getNextPos(b.id)); })
            .forEach(known => {
            var _a;
            const diff = (LOkeys.length) - (LOkeys.length - Array.from(common_1.LOCKED_MODULES).length);
            if (items.find(item => item.id === known.id) === undefined) {
                const pos = (_a = loadOrder[known.id]) === null || _a === void 0 ? void 0 : _a.pos;
                const idx = (pos !== undefined) ? (pos - diff) : (getNextPos(known.id) - diff);
                items.splice(idx, 0, known);
            }
        });
        const unknownItems = [].concat(unknownExt)
            .map(key => ({
            id: CACHE[key].vortexId,
            name: CACHE[key].subModName,
            imgUrl: `${__dirname}/gameart.jpg`,
            external: isExternal(context, CACHE[key].vortexId),
            official: common_1.OFFICIAL_MODULES.has(key),
        }));
        const preSorted = [].concat(lockedItems, items, unknownItems);
        return (direction === 'descending')
            ? Promise.resolve(preSorted.reverse())
            : Promise.resolve(preSorted);
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
        + '"Unable to Initialize Steam API" error, restart Steam.', { ns: common_1.I18N_NAMESPACE })), React.createElement('li', {}, t('Right clicking an entry will open the context menu which can be used to lock LO entries into position; entry will '
        + 'be ignored by auto-sort maintaining its locked position.', { ns: common_1.I18N_NAMESPACE })))));
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
function sortImpl(context, metaManager) {
    const CACHE = (0, subModCache_1.getCache)();
    const modIds = Object.keys(CACHE);
    const lockedIds = modIds.filter(id => CACHE[id].isLocked);
    const subModIds = modIds.filter(id => !CACHE[id].isLocked);
    let sortedLocked = [];
    let sortedSubMods = [];
    const state = context.api.store.getState();
    const activeProfile = vortex_api_1.selectors.activeProfile(state);
    if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
        (0, vortex_api_1.log)('error', 'Failed to sort mods', { reason: 'No active profile' });
        _IS_SORTING = false;
        return;
    }
    const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
    try {
        sortedLocked = tSort({ subModIds: lockedIds, allowLocked: true, metaManager });
        sortedSubMods = tSort({ subModIds, allowLocked: false, loadOrder, metaManager }, true);
    }
    catch (err) {
        context.api.showErrorNotification('Failed to sort mods', err);
        return;
    }
    const newOrder = [].concat(sortedLocked, sortedSubMods).reduce((accum, id, idx) => {
        var _a;
        const vortexId = CACHE[id].vortexId;
        const newEntry = {
            pos: idx,
            enabled: CACHE[id].isOfficial
                ? true
                : (!!loadOrder[vortexId])
                    ? loadOrder[vortexId].enabled
                    : true,
            locked: (((_a = loadOrder[vortexId]) === null || _a === void 0 ? void 0 : _a.locked) === true),
        };
        accum[vortexId] = newEntry;
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
}
function main(context) {
    context.registerReducer(['settings', 'mountandblade2'], reducer);
    context.registerSettings('Interface', Settings_1.default, () => ({
        t: context.api.translate,
        onSetSortOnDeploy: (profileId, sort) => context.api.store.dispatch(setSortOnDeploy(profileId, sort)),
    }), () => {
        const state = context.api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        return profile !== undefined && (profile === null || profile === void 0 ? void 0 : profile.gameId) === common_1.GAME_ID;
    }, 51);
    const metaManager = new ComMetadataManager_1.default(context.api);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Mount & Blade II:\tBannerlord',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => '.',
        getGameVersion: resolveGameVersion,
        logo: 'gameart.jpg',
        executable: () => common_1.BANNERLORD_EXEC,
        setup: (discovery) => prepareForModding(context, discovery, metaManager),
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
        preSort: (items, direction, updateType) => preSort(context, items, direction, updateType, metaManager),
        callback: (loadOrder) => (0, util_1.refreshGameParams)(context, loadOrder),
        itemRenderer: customItemRenderer_1.default.default,
    });
    context.registerInstaller('bannerlordrootmod', 20, testRootMod, installRootMod);
    context.registerInstaller('bannerlordsubmodules', 25, testForSubmodules, installSubModules);
    context.registerMigration(old => (0, migrations_1.migrate026)(context.api, old));
    context.registerMigration(old => (0, migrations_1.migrate045)(context.api, old));
    context.registerAction('generic-load-order-icons', 200, _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', () => {
        sortImpl(context, metaManager);
    }, () => {
        const state = context.api.store.getState();
        const gameId = vortex_api_1.selectors.activeGameId(state);
        return (gameId === common_1.GAME_ID);
    });
    context.once(() => {
        context.api.onAsync('did-deploy', (profileId, deployment) => __awaiter(this, void 0, void 0, function* () { return refreshCacheOnEvent(context, profileId, metaManager); }));
        context.api.onAsync('did-purge', (profileId) => __awaiter(this, void 0, void 0, function* () { return refreshCacheOnEvent(context, profileId, metaManager); }));
        context.api.events.on('gamemode-activated', (gameMode) => {
            const state = context.api.getState();
            const prof = vortex_api_1.selectors.activeProfile(state);
            refreshCacheOnEvent(context, prof === null || prof === void 0 ? void 0 : prof.id, metaManager);
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
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUV0Qyw4REFBcUM7QUFFckMsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBa0Y7QUFDbEYsaUNBQW1GO0FBRW5GLHFDQUdrQjtBQUNsQiw4RUFBc0Q7QUFDdEQsNkNBQXNEO0FBRXRELDhFQUFzRDtBQUN0RCwrQ0FBc0c7QUFFdEcsMkRBQXFGO0FBQ3JGLHNGQUE4RDtBQUU5RCx5Q0FBeUM7QUFFekMsZ0VBQXdDO0FBRXhDLE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7QUFDekcsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBRTdHLElBQUksUUFBUSxDQUFDO0FBRWIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDN0MsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQzNCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQztBQU0vQixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTO0lBQ3BFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFFL0MsTUFBTSxlQUFlLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHlCQUF5QixFQUM1RCxDQUFDLFNBQWlCLEVBQUUsSUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxD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QUFDLENBQUM7eUJBQ3ZCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7eUJBQ3BELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzt5QkFDMUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDbEY7WUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb21pc2UgYXMgQmx1ZWJpcmQgfSBmcm9tICdibHVlYmlyZCc7XHJcblxyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcblxyXG5pbXBvcnQgZ2V0VmVyc2lvbiBmcm9tICdleGUtdmVyc2lvbic7XHJcblxyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IGdldEVsZW1lbnRWYWx1ZSwgZ2V0WE1MRGF0YSwgcmVmcmVzaEdhbWVQYXJhbXMsIHdhbGtBc3luYyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQge1xyXG4gIEJBTk5FUkxPUkRfRVhFQywgR0FNRV9JRCwgSTE4Tl9OQU1FU1BBQ0UsIExPQ0tFRF9NT0RVTEVTLFxyXG4gIE1PRFVMRVMsIE9GRklDSUFMX01PRFVMRVMsIFNVQk1PRF9GSUxFXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgQ3VzdG9tSXRlbVJlbmRlcmVyIGZyb20gJy4vY3VzdG9tSXRlbVJlbmRlcmVyJztcclxuaW1wb3J0IHsgbWlncmF0ZTAyNiwgbWlncmF0ZTA0NSB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5pbXBvcnQgQ29tTWV0YWRhdGFNYW5hZ2VyIGZyb20gJy4vQ29tTWV0YWRhdGFNYW5hZ2VyJztcclxuaW1wb3J0IHsgZ2V0Q2FjaGUsIGdldExhdW5jaGVyRGF0YSwgaXNJbnZhbGlkLCBwYXJzZUxhdW5jaGVyRGF0YSwgcmVmcmVzaENhY2hlIH0gZnJvbSAnLi9zdWJNb2RDYWNoZSc7XHJcbmltcG9ydCB7IElTb3J0UHJvcHMsIElTdWJNb2RDYWNoZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XHJcbmltcG9ydCBDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vdmlld3MvQ29sbGVjdGlvbnNEYXRhVmlldyc7XHJcbmltcG9ydCB7IElDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IHsgY3JlYXRlQWN0aW9uIH0gZnJvbSAncmVkdXgtYWN0JztcclxuXHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL3ZpZXdzL1NldHRpbmdzJztcclxuXHJcbmNvbnN0IExBVU5DSEVSX0VYRUMgPSBwYXRoLmpvaW4oJ2JpbicsICdXaW42NF9TaGlwcGluZ19DbGllbnQnLCAnVGFsZVdvcmxkcy5Nb3VudEFuZEJsYWRlLkxhdW5jaGVyLmV4ZScpO1xyXG5jb25zdCBNT0RESU5HX0tJVF9FWEVDID0gcGF0aC5qb2luKCdiaW4nLCAnV2luNjRfU2hpcHBpbmdfd0VkaXRvcicsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XHJcblxyXG5sZXQgU1RPUkVfSUQ7XHJcblxyXG5jb25zdCBHT0dfSURTID0gWycxODAyNTM5NTI2JywgJzE1NjQ3ODE0OTQnXTtcclxuY29uc3QgU1RFQU1BUFBfSUQgPSAyNjE1NTA7XHJcbmNvbnN0IEVQSUNBUFBfSUQgPSAnQ2hpY2thZGVlJztcclxuXHJcbi8vIEEgc2V0IG9mIGZvbGRlciBuYW1lcyAobG93ZXJjYXNlZCkgd2hpY2ggYXJlIGF2YWlsYWJsZSBhbG9uZ3NpZGUgdGhlXHJcbi8vICBnYW1lJ3MgbW9kdWxlcyBmb2xkZXIuIFdlIGNvdWxkJ3ZlIHVzZWQgdGhlIGZvbW9kIGluc3RhbGxlciBzdG9wIHBhdHRlcm5zXHJcbi8vICBmdW5jdGlvbmFsaXR5IGZvciB0aGlzLCBidXQgaXQncyBiZXR0ZXIgaWYgdGhpcyBleHRlbnNpb24gaXMgc2VsZiBjb250YWluZWQ7XHJcbi8vICBlc3BlY2lhbGx5IGdpdmVuIHRoYXQgdGhlIGdhbWUncyBtb2RkaW5nIHBhdHRlcm4gY2hhbmdlcyBxdWl0ZSBvZnRlbi5cclxuY29uc3QgUk9PVF9GT0xERVJTID0gbmV3IFNldChbJ2JpbicsICdkYXRhJywgJ2d1aScsICdpY29ucycsICdtb2R1bGVzJyxcclxuICAnbXVzaWMnLCAnc2hhZGVycycsICdzb3VuZHMnLCAneG1sc2NoZW1hcyddKTtcclxuXHJcbmNvbnN0IHNldFNvcnRPbkRlcGxveSA9IGNyZWF0ZUFjdGlvbignTU5CMl9TRVRfU09SVF9PTl9ERVBMT1knLFxyXG4gIChwcm9maWxlSWQ6IHN0cmluZywgc29ydDogYm9vbGVhbikgPT4gKHsgcHJvZmlsZUlkLCBzb3J0IH0pKTtcclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0U29ydE9uRGVwbG95IGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT5cclxuICAgICAgdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NvcnRPbkRlcGxveScsIHBheWxvYWQucHJvZmlsZUlkXSwgcGF5bG9hZC5zb3J0KVxyXG4gIH0sXHJcbiAgZGVmYXVsdHM6IHtcclxuICAgIHNvcnRPbkRlcGxveToge30sXHJcbiAgfSxcclxufTtcclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbRVBJQ0FQUF9JRCwgU1RFQU1BUFBfSUQudG9TdHJpbmcoKSwgLi4uR09HX0lEU10pXHJcbiAgICAudGhlbihnYW1lID0+IHtcclxuICAgICAgU1RPUkVfSUQgPSBnYW1lLmdhbWVTdG9yZUlkO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGdhbWUuZ2FtZVBhdGgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RSb290TW9kKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBub3RTdXBwb3J0ZWQgPSB7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH07XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gRGlmZmVyZW50IGdhbWUuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb3dlcmVkID0gZmlsZXMubWFwKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpKTtcclxuICBjb25zdCBtb2RzRmlsZSA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUy50b0xvd2VyQ2FzZSgpKSAhPT0gLTEpO1xyXG4gIGlmIChtb2RzRmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGVyZSdzIG5vIE1vZHVsZXMgZm9sZGVyLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaWR4ID0gbW9kc0ZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUy50b0xvd2VyQ2FzZSgpKTtcclxuICBjb25zdCByb290Rm9sZGVyTWF0Y2hlcyA9IGxvd2VyZWQuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIHJldHVybiAoKChzZWdtZW50cy5sZW5ndGggLSAxKSA+IGlkeCkgJiYgUk9PVF9GT0xERVJTLmhhcyhzZWdtZW50c1tpZHhdKSk7XHJcbiAgfSkgfHwgW107XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IChyb290Rm9sZGVyTWF0Y2hlcy5sZW5ndGggPiAwKSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxSb290TW9kKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICBjb25zdCBtb2R1bGVGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUykgIT09IC0xKTtcclxuICBjb25zdCBpZHggPSBtb2R1bGVGaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMpO1xyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcclxuICAgIGNvbnN0IGxhc3RFbGVtZW50SWR4ID0gc2VnbWVudHMubGVuZ3RoIC0gMTtcclxuXHJcbiAgICAvLyBJZ25vcmUgZGlyZWN0b3JpZXMgYW5kIGVuc3VyZSB0aGF0IHRoZSBmaWxlIGNvbnRhaW5zIGEga25vd24gcm9vdCBmb2xkZXIgYXRcclxuICAgIC8vICB0aGUgZXhwZWN0ZWQgaW5kZXguXHJcbiAgICByZXR1cm4gKFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSlcclxuICAgICAgJiYgKHBhdGguZXh0bmFtZShzZWdtZW50c1tsYXN0RWxlbWVudElkeF0pICE9PSAnJykpO1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBkZXN0aW5hdGlvbiA9IGZpbGUuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoaWR4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4ocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdEZvclN1Ym1vZHVsZXMoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIENoZWNrIHRoaXMgaXMgYSBtb2QgZm9yIEJhbm5lcmxvcmQgYW5kIGl0IGNvbnRhaW5zIGEgU3ViTW9kdWxlLnhtbFxyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU3ViTW9kdWxlcyhmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIHN0cmFpZ2h0IGF3YXkuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuIHBhdGguZXh0bmFtZShzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSkgIT09ICcnO1xyXG4gIH0pO1xyXG4gIGNvbnN0IHN1Yk1vZElkcyA9IFtdO1xyXG4gIGNvbnN0IHN1Yk1vZHMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKHN1Yk1vZHMsIGFzeW5jIChhY2N1bSwgbW9kRmlsZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IG1vZEZpbGUuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgY29uc3Qgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSksICdJZCcpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IChzZWdtZW50cy5sZW5ndGggPiAxKVxyXG4gICAgICA/IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDJdXHJcbiAgICAgIDogc3ViTW9kSWQ7XHJcblxyXG4gICAgc3ViTW9kSWRzLnB1c2goc3ViTW9kSWQpO1xyXG4gICAgY29uc3QgaWR4ID0gbW9kRmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoU1VCTU9EX0ZJTEUpO1xyXG4gICAgLy8gRmlsdGVyIHRoZSBtb2QgZmlsZXMgZm9yIHRoaXMgc3BlY2lmaWMgc3VibW9kdWxlLlxyXG4gICAgY29uc3Qgc3ViTW9kRmlsZXM6IHN0cmluZ1tdXHJcbiAgICAgID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gZmlsZS5zbGljZSgwLCBpZHgpID09PSBtb2RGaWxlLnNsaWNlKDAsIGlkeCkpO1xyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gc3ViTW9kRmlsZXMubWFwKChtb2RGaWxlOiBzdHJpbmcpID0+ICh7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBtb2RGaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKE1PRFVMRVMsIG1vZE5hbWUsIG1vZEZpbGUuc2xpY2UoaWR4KSksXHJcbiAgICB9KSk7XHJcbiAgICByZXR1cm4gYWNjdW0uY29uY2F0KGluc3RydWN0aW9ucyk7XHJcbiAgfSwgW10pXHJcbiAgLnRoZW4obWVyZ2VkID0+IHtcclxuICAgIGNvbnN0IHN1Yk1vZElkc0F0dHIgPSB7XHJcbiAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICBrZXk6ICdzdWJNb2RJZHMnLFxyXG4gICAgICB2YWx1ZTogc3ViTW9kSWRzLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnM6IFtdLmNvbmNhdChtZXJnZWQsIFtzdWJNb2RJZHNBdHRyXSkgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KSB7XHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbChHQU1FX0lELCAnVGFsZVdvcmxkc0Jhbm5lcmxvcmRMYXVuY2hlcicsIHtcclxuICAgIGlkOiAnVGFsZVdvcmxkc0Jhbm5lcmxvcmRMYXVuY2hlcicsXHJcbiAgICBuYW1lOiAnT2ZmaWNpYWwgTGF1bmNoZXInLFxyXG4gICAgbG9nbzogJ3R3bGF1bmNoZXIucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IHBhdGguYmFzZW5hbWUoTEFVTkNIRVJfRVhFQyksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgIHBhdGguYmFzZW5hbWUoTEFVTkNIRVJfRVhFQyksXHJcbiAgICBdLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBMQVVOQ0hFUl9FWEVDKSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgd29ya2luZ0RpcmVjdG9yeTogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcpLFxyXG4gICAgaGlkZGVuOiBmYWxzZSxcclxuICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgfSwgZmFsc2UpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0TW9kZGluZ1Rvb2woY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGlkZGVuPzogYm9vbGVhbikge1xyXG4gIGNvbnN0IHRvb2xJZCA9ICdiYW5uZXJsb3JkLXNkayc7XHJcbiAgY29uc3QgZXhlYyA9IHBhdGguYmFzZW5hbWUoTU9ERElOR19LSVRfRVhFQyk7XHJcbiAgY29uc3QgdG9vbCA9IHtcclxuICAgIGlkOiB0b29sSWQsXHJcbiAgICBuYW1lOiAnTW9kZGluZyBLaXQnLFxyXG4gICAgbG9nbzogJ3R3bGF1bmNoZXIucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IGV4ZWMsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbIGV4ZWMgXSxcclxuICAgIHBhdGg6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9ERElOR19LSVRfRVhFQyksXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcclxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgcGF0aC5kaXJuYW1lKE1PRERJTkdfS0lUX0VYRUMpKSxcclxuICAgIGhpZGRlbixcclxuICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgfTtcclxuXHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbChHQU1FX0lELCB0b29sSWQsIHRvb2wsIGZhbHNlKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIC8vIFF1aWNrbHkgZW5zdXJlIHRoYXQgdGhlIG9mZmljaWFsIExhdW5jaGVyIGlzIGFkZGVkLlxyXG4gIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9ERElOR19LSVRfRVhFQykpO1xyXG4gICAgc2V0TW9kZGluZ1Rvb2woY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHRvb2xzID0gZGlzY292ZXJ5Py50b29scztcclxuICAgIGlmICgodG9vbHMgIT09IHVuZGVmaW5lZClcclxuICAgICYmICh1dGlsLmdldFNhZmUodG9vbHMsIFsnYmFubmVybG9yZC1zZGsnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnksIHRydWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSWYgZ2FtZSBzdG9yZSBub3QgZm91bmQsIGxvY2F0aW9uIG1heSBiZSBzZXQgbWFudWFsbHkgLSBhbGxvdyBzZXR1cFxyXG4gIC8vICBmdW5jdGlvbiB0byBjb250aW51ZS5cclxuICBjb25zdCBmaW5kU3RvcmVJZCA9ICgpID0+IGZpbmRHYW1lKCkuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBjb25zdCBzdGFydFN0ZWFtID0gKCkgPT4gZmluZFN0b3JlSWQoKVxyXG4gICAgLnRoZW4oKCkgPT4gKFNUT1JFX0lEID09PSAnc3RlYW0nKVxyXG4gICAgICA/IHV0aWwuR2FtZVN0b3JlSGVscGVyLmxhdW5jaEdhbWVTdG9yZShjb250ZXh0LmFwaSwgU1RPUkVfSUQsIHVuZGVmaW5lZCwgdHJ1ZSlcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKSk7XHJcblxyXG4gIC8vIENoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgc2V0IHRoZSBsb2FkIG9yZGVyIG9iamVjdCBmb3IgdGhpcyBwcm9maWxlXHJcbiAgLy8gIGFuZCBjcmVhdGUgaXQgaWYgd2UgaGF2ZW4ndC5cclxuICByZXR1cm4gc3RhcnRTdGVhbSgpLnRoZW4oKCkgPT4gcGFyc2VMYXVuY2hlckRhdGEoKSkudGhlbihhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCByZWZyZXNoQ2FjaGUoY29udGV4dCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2UncmUgZ29pbmcgdG8gZG8gYSBxdWljayB0U29ydCBhdCB0aGlzIHBvaW50IC0gbm90IGdvaW5nIHRvXHJcbiAgICAvLyAgY2hhbmdlIHRoZSB1c2VyJ3MgbG9hZCBvcmRlciwgYnV0IHRoaXMgd2lsbCBoaWdobGlnaHQgYW55XHJcbiAgICAvLyAgY3ljbGljIG9yIG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gICAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gICAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gICAgY29uc3Qgc29ydGVkID0gdFNvcnQoeyBzdWJNb2RJZHM6IG1vZElkcywgYWxsb3dMb2NrZWQ6IHRydWUsIG1ldGFNYW5hZ2VyIH0pO1xyXG4gIH0pXHJcbiAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Ob3RGb3VuZCkge1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBmaW5kIGdhbWUgbGF1bmNoZXIgZGF0YScsXHJcbiAgICAgICAgJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSB0aHJvdWdoIHRoZSBvZmZpY2lhbCBnYW1lIGxhdW5jaGVyIGFuZCAnXHJcbiAgICAgICsgJ3RyeSBhZ2FpbicsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9IGVsc2UgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGZpbmQgZ2FtZSBsYXVuY2hlciBkYXRhJyxcclxuICAgICAgICBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH0pXHJcbiAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gVmFsaWQgdXNlIGNhc2Ugd2hlbiBhdHRlbXB0aW5nIHRvIHN3aXRjaCB0b1xyXG4gICAgICAvLyAgQmFubmVybG9yZCB3aXRob3V0IGFueSBhY3RpdmUgcHJvZmlsZS5cclxuICAgICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIHt9KTtcclxuICAgIH1cclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdFNvcnQoc29ydFByb3BzOiBJU29ydFByb3BzLCB0ZXN0OiBib29sZWFuID0gZmFsc2UpIHtcclxuICBjb25zdCB7IHN1Yk1vZElkcywgYWxsb3dMb2NrZWQsIGxvYWRPcmRlciwgbWV0YU1hbmFnZXIgfSA9IHNvcnRQcm9wcztcclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgLy8gVG9wb2xvZ2ljYWwgc29ydCAtIHdlIG5lZWQgdG86XHJcbiAgLy8gIC0gSWRlbnRpZnkgY3ljbGljIGRlcGVuZGVuY2llcy5cclxuICAvLyAgLSBJZGVudGlmeSBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAvLyAgLSBXZSB3aWxsIHRyeSB0byBpZGVudGlmeSBpbmNvbXBhdGlibGUgZGVwZW5kZW5jaWVzICh2ZXJzaW9uLXdpc2UpXHJcblxyXG4gIC8vIFRoZXNlIGFyZSBtYW51YWxseSBsb2NrZWQgbW9kIGVudHJpZXMuXHJcbiAgY29uc3QgbG9ja2VkU3ViTW9kcyA9ICghIWxvYWRPcmRlcilcclxuICAgID8gc3ViTW9kSWRzLmZpbHRlcihzdWJNb2RJZCA9PiB7XHJcbiAgICAgIGNvbnN0IGVudHJ5ID0gQ0FDSEVbc3ViTW9kSWRdO1xyXG4gICAgICByZXR1cm4gKCEhZW50cnkpXHJcbiAgICAgICAgPyAhIWxvYWRPcmRlcltlbnRyeS52b3J0ZXhJZF0/LmxvY2tlZFxyXG4gICAgICAgIDogZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgOiBbXTtcclxuICBjb25zdCBhbHBoYWJldGljYWwgPSBzdWJNb2RJZHMuZmlsdGVyKHN1Yk1vZCA9PiAhbG9ja2VkU3ViTW9kcy5pbmNsdWRlcyhzdWJNb2QpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zb3J0KCk7XHJcbiAgY29uc3QgZ3JhcGggPSBhbHBoYWJldGljYWwucmVkdWNlKChhY2N1bSwgZW50cnkpID0+IHtcclxuICAgIGNvbnN0IGRlcElkcyA9IFsuLi5DQUNIRVtlbnRyeV0uZGVwZW5kZW5jaWVzXS5tYXAoZGVwID0+IGRlcC5kZXBJZCk7XHJcbiAgICAvLyBDcmVhdGUgdGhlIG5vZGUgZ3JhcGguXHJcbiAgICBhY2N1bVtlbnRyeV0gPSBkZXBJZHMuc29ydCgpO1xyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgLy8gV2lsbCBzdG9yZSB0aGUgZmluYWwgTE8gcmVzdWx0XHJcbiAgY29uc3QgcmVzdWx0ID0gW107XHJcblxyXG4gIC8vIFRoZSBub2RlcyB3ZSBoYXZlIHZpc2l0ZWQvcHJvY2Vzc2VkLlxyXG4gIGNvbnN0IHZpc2l0ZWQgPSBbXTtcclxuXHJcbiAgLy8gVGhlIG5vZGVzIHdoaWNoIGFyZSBzdGlsbCBwcm9jZXNzaW5nLlxyXG4gIGNvbnN0IHByb2Nlc3NpbmcgPSBbXTtcclxuXHJcbiAgY29uc3QgdG9wU29ydCA9IChub2RlKSA9PiB7XHJcbiAgICBwcm9jZXNzaW5nW25vZGVdID0gdHJ1ZTtcclxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9ICghIWFsbG93TG9ja2VkKVxyXG4gICAgICA/IGdyYXBoW25vZGVdXHJcbiAgICAgIDogZ3JhcGhbbm9kZV0uZmlsdGVyKGVsZW1lbnQgPT4gIUxPQ0tFRF9NT0RVTEVTLmhhcyhlbGVtZW50KSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgIGlmIChwcm9jZXNzaW5nW2RlcF0pIHtcclxuICAgICAgICAvLyBDeWNsaWMgZGVwZW5kZW5jeSBkZXRlY3RlZCAtIGhpZ2hsaWdodCBib3RoIG1vZHMgYXMgaW52YWxpZFxyXG4gICAgICAgIC8vICB3aXRoaW4gdGhlIGNhY2hlIGl0c2VsZiAtIHdlIGFsc28gbmVlZCB0byBoaWdobGlnaHQgd2hpY2ggbW9kcy5cclxuICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmN5Y2xpYy5wdXNoKGRlcCk7XHJcbiAgICAgICAgQ0FDSEVbZGVwXS5pbnZhbGlkLmN5Y2xpYy5wdXNoKG5vZGUpO1xyXG5cclxuICAgICAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcclxuICAgICAgICBwcm9jZXNzaW5nW25vZGVdID0gZmFsc2U7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGluY29tcGF0aWJsZURlcHMgPSBDQUNIRVtub2RlXS5pbnZhbGlkLmluY29tcGF0aWJsZURlcHM7XHJcbiAgICAgIGNvbnN0IGluY0RlcCA9IGluY29tcGF0aWJsZURlcHMuZmluZChkID0+IGQuZGVwSWQgPT09IGRlcCk7XHJcbiAgICAgIGlmIChPYmplY3Qua2V5cyhncmFwaCkuaW5jbHVkZXMoZGVwKSAmJiAoaW5jRGVwID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgY29uc3QgZGVwVmVyID0gQ0FDSEVbZGVwXS5zdWJNb2RWZXI7XHJcbiAgICAgICAgY29uc3QgZGVwSW5zdCA9IENBQ0hFW25vZGVdLmRlcGVuZGVuY2llcy5maW5kKGQgPT4gZC5kZXBJZCA9PT0gZGVwKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBzZW12ZXIuc2F0aXNmaWVzKGRlcEluc3QuZGVwVmVyc2lvbiwgZGVwVmVyKTtcclxuICAgICAgICAgIGlmICghbWF0Y2ggJiYgISFkZXBJbnN0Py5kZXBWZXJzaW9uICYmICEhZGVwVmVyKSB7XHJcbiAgICAgICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQuaW5jb21wYXRpYmxlRGVwcy5wdXNoKHtcclxuICAgICAgICAgICAgICBkZXBJZDogZGVwLFxyXG4gICAgICAgICAgICAgIHJlcXVpcmVkVmVyc2lvbjogZGVwSW5zdC5kZXBWZXJzaW9uLFxyXG4gICAgICAgICAgICAgIGN1cnJlbnRWZXJzaW9uOiBkZXBWZXIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gT2sgc28gd2UgZGlkbid0IG1hbmFnZSB0byBjb21wYXJlIHRoZSB2ZXJzaW9ucywgd2UgbG9nIHRoaXMgYW5kXHJcbiAgICAgICAgICAvLyAgY29udGludWUuXHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byBjb21wYXJlIHZlcnNpb25zJywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghdmlzaXRlZFtkZXBdICYmICFsb2NrZWRTdWJNb2RzLmluY2x1ZGVzKGRlcCkpIHtcclxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGdyYXBoKS5pbmNsdWRlcyhkZXApKSB7XHJcbiAgICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLm1pc3NpbmcucHVzaChkZXApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0b3BTb3J0KGRlcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc2luZ1tub2RlXSA9IGZhbHNlO1xyXG4gICAgdmlzaXRlZFtub2RlXSA9IHRydWU7XHJcblxyXG4gICAgaWYgKCFpc0ludmFsaWQobm9kZSkpIHtcclxuICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgZm9yIChjb25zdCBub2RlIGluIGdyYXBoKSB7XHJcbiAgICBpZiAoIXZpc2l0ZWRbbm9kZV0gJiYgIXByb2Nlc3Npbmdbbm9kZV0pIHtcclxuICAgICAgdG9wU29ydChub2RlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChhbGxvd0xvY2tlZCkge1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8vIFByb3BlciB0b3BvbG9naWNhbCBzb3J0IGRpY3RhdGVzIHdlIHNpbXBseSByZXR1cm4gdGhlXHJcbiAgLy8gIHJlc3VsdCBhdCB0aGlzIHBvaW50LiBCdXQsIG1vZCBhdXRob3JzIHdhbnQgbW9kdWxlc1xyXG4gIC8vICB3aXRoIG5vIGRlcGVuZGVuY2llcyB0byBidWJibGUgdXAgdG8gdGhlIHRvcCBvZiB0aGUgTE8uXHJcbiAgLy8gIChUaGlzIHdpbGwgb25seSBhcHBseSB0byBub24gbG9ja2VkIGVudHJpZXMpXHJcbiAgY29uc3Qgc3ViTW9kc1dpdGhOb0RlcHMgPSByZXN1bHQuZmlsdGVyKGRlcCA9PiAoZ3JhcGhbZGVwXS5sZW5ndGggPT09IDApXHJcbiAgICB8fCAoZ3JhcGhbZGVwXS5maW5kKGQgPT4gIUxPQ0tFRF9NT0RVTEVTLmhhcyhkKSkgPT09IHVuZGVmaW5lZCkpLnNvcnQoKSB8fCBbXTtcclxuICBjb25zdCB0YW1wZXJlZFJlc3VsdCA9IFtdLmNvbmNhdChzdWJNb2RzV2l0aE5vRGVwcyxcclxuICAgIHJlc3VsdC5maWx0ZXIoZW50cnkgPT4gIXN1Yk1vZHNXaXRoTm9EZXBzLmluY2x1ZGVzKGVudHJ5KSkpO1xyXG4gIGxvY2tlZFN1Yk1vZHMuZm9yRWFjaChzdWJNb2RJZCA9PiB7XHJcbiAgICBjb25zdCBwb3MgPSBsb2FkT3JkZXJbQ0FDSEVbc3ViTW9kSWRdLnZvcnRleElkXS5wb3M7XHJcbiAgICB0YW1wZXJlZFJlc3VsdC5zcGxpY2UocG9zLCAwLCBbc3ViTW9kSWRdKTtcclxuICB9KTtcclxuXHJcbiAgaWYgKHRlc3QgPT09IHRydWUpIHtcclxuICAgIGNvbnN0IG1ldGFTb3J0ZWQgPSBtZXRhTWFuYWdlci5zb3J0KHRhbXBlcmVkUmVzdWx0KTtcclxuICAgIHJldHVybiBtZXRhU29ydGVkO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdGFtcGVyZWRSZXN1bHQ7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc0V4dGVybmFsKGNvbnRleHQsIHN1Yk1vZElkKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICBtb2RJZHMuZm9yRWFjaChtb2RJZCA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZHMgPSB1dGlsLmdldFNhZmUobW9kc1ttb2RJZF0sIFsnYXR0cmlidXRlcycsICdzdWJNb2RJZHMnXSwgW10pO1xyXG4gICAgaWYgKHN1Yk1vZElkcy5pbmNsdWRlcyhzdWJNb2RJZCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgZGVwbG95UHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAoKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gZGVwbG95UHJvZmlsZT8uZ2FtZUlkKSB8fCAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSkge1xyXG4gICAgLy8gRGVwbG95bWVudCBldmVudCBzZWVtcyB0byBiZSBleGVjdXRlZCBmb3IgYSBwcm9maWxlIG90aGVyXHJcbiAgICAvLyAgdGhhbiB0aGUgY3VycmVudGx5IGFjdGl2ZSBvbmUuIE5vdCBnb2luZyB0byBjb250aW51ZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGF3YWl0IG1ldGFNYW5hZ2VyLnVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIFByb2Nlc3NDYW5jZWxlZCBtZWFucyB0aGF0IHdlIHdlcmUgdW5hYmxlIHRvIHNjYW4gZm9yIGRlcGxveWVkXHJcbiAgICAvLyAgc3ViTW9kdWxlcywgcHJvYmFibHkgYmVjYXVzZSBnYW1lIGRpc2NvdmVyeSBpcyBpbmNvbXBsZXRlLlxyXG4gICAgLy8gSXQncyBiZXlvbmQgdGhlIHNjb3BlIG9mIHRoaXMgZnVuY3Rpb24gdG8gcmVwb3J0IGRpc2NvdmVyeVxyXG4gICAgLy8gIHJlbGF0ZWQgaXNzdWVzLlxyXG4gICAgcmV0dXJuIChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZClcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCB7fSk7XHJcblxyXG4gIGlmICh1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnbW91bnRhbmRibGFkZTInLCAnc29ydE9uRGVwbG95JywgYWN0aXZlUHJvZmlsZS5pZF0sIHRydWUpKSB7XHJcbiAgICByZXR1cm4gc29ydEltcGwoY29udGV4dCwgbWV0YU1hbmFnZXIpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBXZSdyZSBnb2luZyB0byBkbyBhIHF1aWNrIHRTb3J0IGF0IHRoaXMgcG9pbnQgLSBub3QgZ29pbmcgdG9cclxuICAgIC8vICBjaGFuZ2UgdGhlIHVzZXIncyBsb2FkIG9yZGVyLCBidXQgdGhpcyB3aWxsIGhpZ2hsaWdodCBhbnlcclxuICAgIC8vICBjeWNsaWMgb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICBjb25zdCBzb3J0UHJvcHM6IElTb3J0UHJvcHMgPSB7XHJcbiAgICAgIHN1Yk1vZElkczogbW9kSWRzLFxyXG4gICAgICBhbGxvd0xvY2tlZDogdHJ1ZSxcclxuICAgICAgbG9hZE9yZGVyLFxyXG4gICAgICBtZXRhTWFuYWdlcixcclxuICAgIH07XHJcbiAgICBjb25zdCBzb3J0ZWQgPSB0U29ydChzb3J0UHJvcHMpO1xyXG5cclxuICAgIGlmIChyZWZyZXNoRnVuYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJlZnJlc2hGdW5jKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIG1ldGFNYW5hZ2VyKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gUmFjZSBjb25kaXRpb24gP1xyXG4gICAgcmV0dXJuIGl0ZW1zO1xyXG4gIH1cclxuXHJcbiAgbGV0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBpZiAoaXRlbXMubGVuZ3RoID4gMCAmJiBtb2RJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBDYWNoZSBoYXNuJ3QgYmVlbiBwb3B1bGF0ZWQgeWV0LlxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gUmVmcmVzaCB0aGUgY2FjaGUuXHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgYWN0aXZlUHJvZmlsZS5pZCwgbWV0YU1hbmFnZXIpO1xyXG4gICAgICBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBMb2NrZWQgaWRzIGFyZSBhbHdheXMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdCBhcyBhbGxcclxuICAvLyAgb3RoZXIgbW9kdWxlcyBkZXBlbmQgb24gdGhlc2UuXHJcbiAgbGV0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIFNvcnQgdGhlIGxvY2tlZCBpZHMgYW1vbmdzdCB0aGVtc2VsdmVzIHRvIGVuc3VyZVxyXG4gICAgLy8gIHRoYXQgdGhlIGdhbWUgcmVjZWl2ZXMgdGhlc2UgaW4gdGhlIHJpZ2h0IG9yZGVyLlxyXG4gICAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xyXG4gICAgICBzdWJNb2RJZHM6IGxvY2tlZElkcyxcclxuICAgICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICAgIG1ldGFNYW5hZ2VyLFxyXG4gICAgfTtcclxuICAgIGxvY2tlZElkcyA9IHRTb3J0KHNvcnRQcm9wcyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgbG9ja2VkIGVudHJpZXMuXHJcbiAgY29uc3QgbG9ja2VkSXRlbXMgPSBsb2NrZWRJZHMubWFwKGlkID0+ICh7XHJcbiAgICBpZDogQ0FDSEVbaWRdLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVbaWRdLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGlkKSxcclxuICB9KSk7XHJcblxyXG4gIGNvbnN0IExBVU5DSEVSX0RBVEEgPSBnZXRMYXVuY2hlckRhdGEoKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgaWRzIHdpbGwgaW5jbHVkZSBvZmZpY2lhbCBtb2R1bGVzIGFzIHdlbGwgYnV0IG5vdCBsb2NrZWQgZW50cmllcy5cclxuICBjb25zdCBleHRlcm5hbElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gKCFDQUNIRVtpZF0uaXNMb2NrZWQpICYmIChDQUNIRVtpZF0udm9ydGV4SWQgPT09IGlkKSk7XHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBMT2tleXMgPSAoKE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoID4gMClcclxuICAgID8gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgOiBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMubWFwKG1vZCA9PiBtb2Quc3ViTW9kSWQpKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgbW9kdWxlcyB0aGF0IGFyZSBhbHJlYWR5IGluIHRoZSBsb2FkIG9yZGVyLlxyXG4gIGNvbnN0IGtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+IExPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xyXG5cclxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHdoaWNoIGFyZSBuZXcgYW5kIGhhdmUgeWV0IHRvIGJlIGFkZGVkIHRvIHRoZSBMTy5cclxuICBjb25zdCB1bmtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+ICFMT2tleXMuaW5jbHVkZXMoaWQpKSB8fCBbXTtcclxuXHJcbiAgaXRlbXMgPSBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAvLyBSZW1vdmUgYW55IGxvY2tlZElkcywgYnV0IGFsc28gZW5zdXJlIHRoYXQgdGhlXHJcbiAgICAvLyAgZW50cnkgY2FuIGJlIGZvdW5kIGluIHRoZSBjYWNoZS4gSWYgaXQncyBub3QgaW4gdGhlXHJcbiAgICAvLyAgY2FjaGUsIHRoaXMgbWF5IG1lYW4gdGhhdCB0aGUgc3VibW9kIHhtbCBmaWxlIGZhaWxlZFxyXG4gICAgLy8gIHBhcnNlLWluZyBhbmQgdGhlcmVmb3JlIHNob3VsZCBub3QgYmUgZGlzcGxheWVkLlxyXG4gICAgY29uc3QgaXNMb2NrZWQgPSBsb2NrZWRJZHMuaW5jbHVkZXMoaXRlbS5pZCk7XHJcbiAgICBjb25zdCBoYXNDYWNoZUVudHJ5ID0gT2JqZWN0LmtleXMoQ0FDSEUpLmZpbmQoa2V5ID0+XHJcbiAgICAgIENBQ0hFW2tleV0udm9ydGV4SWQgPT09IGl0ZW0uaWQpICE9PSB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gIWlzTG9ja2VkICYmIGhhc0NhY2hlRW50cnk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHBvc01hcCA9IHt9O1xyXG4gIGxldCBuZXh0QXZhaWxhYmxlID0gTE9rZXlzLmxlbmd0aDtcclxuICBjb25zdCBnZXROZXh0UG9zID0gKGxvSWQpID0+IHtcclxuICAgIGlmIChMT0NLRURfTU9EVUxFUy5oYXMobG9JZCkpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmluZGV4T2YobG9JZCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHBvc01hcFtsb0lkXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHBvc01hcFtsb0lkXSA9IG5leHRBdmFpbGFibGU7XHJcbiAgICAgIHJldHVybiBuZXh0QXZhaWxhYmxlKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcG9zTWFwW2xvSWRdO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGtub3duRXh0Lm1hcChrZXkgPT4gKHtcclxuICAgIGlkOiBDQUNIRVtrZXldLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxyXG4gICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGNvbnRleHQsIENBQ0hFW2tleV0udm9ydGV4SWQpLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXHJcbiAgfSkpXHJcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1heC1saW5lLWxlbmd0aFxyXG4gICAgLnNvcnQoKGEsIGIpID0+IChsb2FkT3JkZXJbYS5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGEuaWQpKSAtIChsb2FkT3JkZXJbYi5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGIuaWQpKSlcclxuICAgIC5mb3JFYWNoKGtub3duID0+IHtcclxuICAgICAgLy8gSWYgdGhpcyBhIGtub3duIGV4dGVybmFsIG1vZHVsZSBhbmQgaXMgTk9UIGluIHRoZSBpdGVtIGxpc3QgYWxyZWFkeVxyXG4gICAgICAvLyAgd2UgbmVlZCB0byByZS1pbnNlcnQgaW4gdGhlIGNvcnJlY3QgaW5kZXggYXMgYWxsIGtub3duIGV4dGVybmFsIG1vZHVsZXNcclxuICAgICAgLy8gIGF0IHRoaXMgcG9pbnQgYXJlIGFjdHVhbGx5IGRlcGxveWVkIGluc2lkZSB0aGUgbW9kcyBmb2xkZXIgYW5kIHNob3VsZFxyXG4gICAgICAvLyAgYmUgaW4gdGhlIGl0ZW1zIGxpc3QhXHJcbiAgICAgIGNvbnN0IGRpZmYgPSAoTE9rZXlzLmxlbmd0aCkgLSAoTE9rZXlzLmxlbmd0aCAtIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmxlbmd0aCk7XHJcbiAgICAgIGlmIChpdGVtcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga25vd24uaWQpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb25zdCBwb3MgPSBsb2FkT3JkZXJba25vd24uaWRdPy5wb3M7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gKHBvcyAhPT0gdW5kZWZpbmVkKSA/IChwb3MgLSBkaWZmKSA6IChnZXROZXh0UG9zKGtub3duLmlkKSAtIGRpZmYpO1xyXG4gICAgICAgIGl0ZW1zLnNwbGljZShpZHgsIDAsIGtub3duKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHVua25vd25JdGVtcyA9IFtdLmNvbmNhdCh1bmtub3duRXh0KVxyXG4gICAgLm1hcChrZXkgPT4gKHtcclxuICAgICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXHJcbiAgICAgIG5hbWU6IENBQ0hFW2tleV0uc3ViTW9kTmFtZSxcclxuICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXHJcbiAgICAgIG9mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhrZXkpLFxyXG4gICAgfSkpO1xyXG5cclxuICBjb25zdCBwcmVTb3J0ZWQgPSBbXS5jb25jYXQobG9ja2VkSXRlbXMsIGl0ZW1zLCB1bmtub3duSXRlbXMpO1xyXG4gIHJldHVybiAoZGlyZWN0aW9uID09PSAnZGVzY2VuZGluZycpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQucmV2ZXJzZSgpKVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcykge1xyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdsb2Fkb3JkZXJpbmZvJyB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSwgdCgnTWFuYWdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1lvdSBjYW4gYWRqdXN0IHRoZSBsb2FkIG9yZGVyIGZvciBCYW5uZXJsb3JkIGJ5IGRyYWdnaW5nIGFuZCBkcm9wcGluZyBtb2RzIHVwIG9yIGRvd24gb24gdGhpcyBwYWdlLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBrZWVwIGluIG1pbmQgdGhhdCBCYW5uZXJsb3JkIGlzIHN0aWxsIGluIEVhcmx5IEFjY2Vzcywgd2hpY2ggbWVhbnMgdGhhdCB0aGVyZSBtaWdodCBiZSBzaWduaWZpY2FudCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2NoYW5nZXMgdG8gdGhlIGdhbWUgYXMgdGltZSBnb2VzIG9uLiBQbGVhc2Ugbm90aWZ5IHVzIG9mIGFueSBWb3J0ZXggcmVsYXRlZCBpc3N1ZXMgeW91IGVuY291bnRlciB3aXRoIHRoaXMgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdleHRlbnNpb24gc28gd2UgY2FuIGZpeCBpdC4gRm9yIG1vcmUgaW5mb3JtYXRpb24gYW5kIGhlbHAgc2VlOiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19CYW5uZXJsb3JkX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBCYW5uZXJsb3JkIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ0hvdyB0byB1c2U6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NoZWNrIHRoZSBib3ggbmV4dCB0byB0aGUgbW9kcyB5b3Ugd2FudCB0byBiZSBhY3RpdmUgaW4gdGhlIGdhbWUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NsaWNrIEF1dG8gU29ydCBpbiB0aGUgdG9vbGJhci4gKFNlZSBiZWxvdyBmb3IgZGV0YWlscykuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01ha2Ugc3VyZSB0byBydW4gdGhlIGdhbWUgZGlyZWN0bHkgdmlhIHRoZSBQbGF5IGJ1dHRvbiBpbiB0aGUgdG9wIGxlZnQgY29ybmVyICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcob24gdGhlIEJhbm5lcmxvcmQgdGlsZSkuIFlvdXIgVm9ydGV4IGxvYWQgb3JkZXIgbWF5IG5vdCBiZSBsb2FkZWQgaWYgeW91IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGdhbWUgbGF1bmNoZXIuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ09wdGlvbmFsOiBNYW51YWxseSBkcmFnIGFuZCBkcm9wIG1vZHMgdG8gZGlmZmVyZW50IHBvc2l0aW9ucyBpbiB0aGUgbG9hZCBvcmRlciAoZm9yIHRlc3RpbmcgZGlmZmVyZW50IG92ZXJyaWRlcykuIE1vZHMgZnVydGhlciBkb3duIHRoZSBsaXN0IG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1BsZWFzZSBub3RlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgbG9hZCBvcmRlciByZWZsZWN0ZWQgaGVyZSB3aWxsIG9ubHkgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIGdhbWUgdmlhIHRoZSBwbGF5IGJ1dHRvbiBpbiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAndGhlIHRvcCBsZWZ0IGNvcm5lci4gRG8gbm90IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGxhdW5jaGVyLCBhcyB0aGF0IHdpbGwgaWdub3JlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICd0aGUgVm9ydGV4IGxvYWQgb3JkZXIgYW5kIGdvIGJ5IHdoYXQgaXMgc2hvd24gaW4gdGhlIGxhdW5jaGVyIGluc3RlYWQuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0ZvciBCYW5uZXJsb3JkLCBtb2RzIHNvcnRlZCBmdXJ0aGVyIHRvd2FyZHMgdGhlIGJvdHRvbSBvZiB0aGUgbGlzdCB3aWxsIG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cCAoaWYgdGhleSBjb25mbGljdCkuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdOb3RlOiBIYXJtb255IHBhdGNoZXMgbWF5IGJlIHRoZSBleGNlcHRpb24gdG8gdGhpcyBydWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdBdXRvIFNvcnQgdXNlcyB0aGUgU3ViTW9kdWxlLnhtbCBmaWxlcyAodGhlIGVudHJpZXMgdW5kZXIgPERlcGVuZGVkTW9kdWxlcz4pIHRvIGRldGVjdCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnZGVwZW5kZW5jaWVzIHRvIHNvcnQgYnkuICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdJZiB5b3UgY2Fubm90IHNlZSB5b3VyIG1vZCBpbiB0aGlzIGxvYWQgb3JkZXIsIFZvcnRleCBtYXkgaGF2ZSBiZWVuIHVuYWJsZSB0byBmaW5kIG9yIHBhcnNlIGl0cyBTdWJNb2R1bGUueG1sIGZpbGUuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdNb3N0IC0gYnV0IG5vdCBhbGwgbW9kcyAtIGNvbWUgd2l0aCBvciBuZWVkIGEgU3ViTW9kdWxlLnhtbCBmaWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdIaXQgdGhlIGRlcGxveSBidXR0b24gd2hlbmV2ZXIgeW91IGluc3RhbGwgYW5kIGVuYWJsZSBhIG5ldyBtb2QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1RoZSBnYW1lIHdpbGwgbm90IGxhdW5jaCB1bmxlc3MgdGhlIGdhbWUgc3RvcmUgKFN0ZWFtLCBFcGljLCBldGMpIGlzIHN0YXJ0ZWQgYmVmb3JlaGFuZC4gSWYgeW91XFwncmUgZ2V0dGluZyB0aGUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1wiVW5hYmxlIHRvIEluaXRpYWxpemUgU3RlYW0gQVBJXCIgZXJyb3IsIHJlc3RhcnQgU3RlYW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1JpZ2h0IGNsaWNraW5nIGFuIGVudHJ5IHdpbGwgb3BlbiB0aGUgY29udGV4dCBtZW51IHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvY2sgTE8gZW50cmllcyBpbnRvIHBvc2l0aW9uOyBlbnRyeSB3aWxsICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdiZSBpZ25vcmVkIGJ5IGF1dG8tc29ydCBtYWludGFpbmluZyBpdHMgbG9ja2VkIHBvc2l0aW9uLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUdhbWVWZXJzaW9uKGRpc2NvdmVyeVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ2RldmVsb3BtZW50JyAmJiBzZW12ZXIuc2F0aXNmaWVzKHV0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9uLCAnPDEuNC4wJykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ25vdCBzdXBwb3J0ZWQgaW4gb2xkZXIgVm9ydGV4IHZlcnNpb25zJykpO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEocGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1ZlcnNpb24ueG1sJykpO1xyXG4gICAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBCQU5ORVJMT1JEX0VYRUMpO1xyXG4gICAgY29uc3QgdmFsdWUgPSBkYXRhPy5WZXJzaW9uPy5TaW5nbGVwbGF5ZXI/LlswXT8uJD8uVmFsdWVcclxuICAgICAgLnNsaWNlKDEpXHJcbiAgICAgIC5zcGxpdCgnLicpXHJcbiAgICAgIC5zbGljZSgwLCAzKVxyXG4gICAgICAuam9pbignLicpO1xyXG4gICAgcmV0dXJuIChzZW12ZXIudmFsaWQodmFsdWUpKSA/IFByb21pc2UucmVzb2x2ZSh2YWx1ZSkgOiBnZXRWZXJzaW9uKGV4ZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5sZXQgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuZnVuY3Rpb24gc29ydEltcGwoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gIGNvbnN0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuICBjb25zdCBzdWJNb2RJZHMgPSBtb2RJZHMuZmlsdGVyKGlkID0+ICFDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG5cclxuICBsZXQgc29ydGVkTG9ja2VkID0gW107XHJcbiAgbGV0IHNvcnRlZFN1Yk1vZHMgPSBbXTtcclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFByb2JhYmx5IGJlc3QgdGhhdCB3ZSBkb24ndCByZXBvcnQgdGhpcyB2aWEgbm90aWZpY2F0aW9uIGFzIGEgbnVtYmVyXHJcbiAgICAvLyAgb2YgdGhpbmdzIG1heSBoYXZlIG9jY3VycmVkIHRoYXQgY2F1c2VkIHRoaXMgaXNzdWUuIFdlIGxvZyBpdCBpbnN0ZWFkLlxyXG4gICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gc29ydCBtb2RzJywgeyByZWFzb246ICdObyBhY3RpdmUgcHJvZmlsZScgfSk7XHJcbiAgICBfSVNfU09SVElORyA9IGZhbHNlO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIHNvcnRlZExvY2tlZCA9IHRTb3J0KHsgc3ViTW9kSWRzOiBsb2NrZWRJZHMsIGFsbG93TG9ja2VkOiB0cnVlLCBtZXRhTWFuYWdlciB9KTtcclxuICAgIHNvcnRlZFN1Yk1vZHMgPSB0U29ydCh7IHN1Yk1vZElkcywgYWxsb3dMb2NrZWQ6IGZhbHNlLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0sIHRydWUpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc29ydCBtb2RzJywgZXJyKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG5ld09yZGVyID0gW10uY29uY2F0KHNvcnRlZExvY2tlZCwgc29ydGVkU3ViTW9kcykucmVkdWNlKChhY2N1bSwgaWQsIGlkeCkgPT4ge1xyXG4gICAgY29uc3Qgdm9ydGV4SWQgPSBDQUNIRVtpZF0udm9ydGV4SWQ7XHJcbiAgICBjb25zdCBuZXdFbnRyeSA9IHtcclxuICAgICAgcG9zOiBpZHgsXHJcbiAgICAgIGVuYWJsZWQ6IENBQ0hFW2lkXS5pc09mZmljaWFsXHJcbiAgICAgICAgPyB0cnVlXHJcbiAgICAgICAgOiAoISFsb2FkT3JkZXJbdm9ydGV4SWRdKVxyXG4gICAgICAgICAgPyBsb2FkT3JkZXJbdm9ydGV4SWRdLmVuYWJsZWRcclxuICAgICAgICAgIDogdHJ1ZSxcclxuICAgICAgbG9ja2VkOiAobG9hZE9yZGVyW3ZvcnRleElkXT8ubG9ja2VkID09PSB0cnVlKSxcclxuICAgIH07XHJcblxyXG4gICAgYWNjdW1bdm9ydGV4SWRdID0gbmV3RW50cnk7XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG5cclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihhY3RpdmVQcm9maWxlLmlkLCBuZXdPcmRlcikpO1xyXG4gIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBuZXdPcmRlcilcclxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ21uYjItc29ydC1maW5pc2hlZCcsXHJcbiAgICAgIHR5cGU6ICdpbmZvJyxcclxuICAgICAgbWVzc2FnZTogY29udGV4dC5hcGkudHJhbnNsYXRlKCdGaW5pc2hlZCBzb3J0aW5nJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgIGRpc3BsYXlNUzogMzAwMCxcclxuICAgIH0pKS5maW5hbGx5KCgpID0+IF9JU19TT1JUSU5HID0gZmFsc2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ21vdW50YW5kYmxhZGUyJ10sIHJlZHVjZXIpO1xyXG4gIChjb250ZXh0LnJlZ2lzdGVyU2V0dGluZ3MgYXMgYW55KSgnSW50ZXJmYWNlJywgU2V0dGluZ3MsICgpID0+ICh7XHJcbiAgICB0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUsXHJcbiAgICBvblNldFNvcnRPbkRlcGxveTogKHByb2ZpbGVJZDogc3RyaW5nLCBzb3J0OiBib29sZWFuKSA9PlxyXG4gICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRTb3J0T25EZXBsb3kocHJvZmlsZUlkLCBzb3J0KSksXHJcbiAgfSksICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICByZXR1cm4gcHJvZmlsZSAhPT0gdW5kZWZpbmVkICYmIHByb2ZpbGU/LmdhbWVJZCA9PT0gR0FNRV9JRDtcclxuICB9LCA1MSk7XHJcblxyXG4gIGNvbnN0IG1ldGFNYW5hZ2VyID0gbmV3IENvbU1ldGFkYXRhTWFuYWdlcihjb250ZXh0LmFwaSk7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnTW91bnQgJiBCbGFkZSBJSTpcXHRCYW5uZXJsb3JkJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICcuJyxcclxuICAgIGdldEdhbWVWZXJzaW9uOiByZXNvbHZlR2FtZVZlcnNpb24sXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXIpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICBCQU5ORVJMT1JEX0VYRUMsXHJcbiAgICBdLFxyXG4gICAgcGFyYW1ldGVyczogW10sXHJcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTUFQUF9JRC50b1N0cmluZygpLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogU1RFQU1BUFBfSUQsXHJcbiAgICAgIGVwaWNBcHBJZDogRVBJQ0FQUF9JRCxcclxuICAgICAgY3VzdG9tT3Blbk1vZHNQYXRoOiBNT0RVTEVTLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ21vdW50YW5kYmxhZGUyX2NvbGxlY3Rpb25fZGF0YScsXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10pID0+XHJcbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcyksXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdNb3VudCBhbmQgQmxhZGUgMiBEYXRhJyksXHJcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcsXHJcbiAgKTtcclxuXHJcbiAgLy8gUmVnaXN0ZXIgdGhlIExPIHBhZ2UuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlclBhZ2Uoe1xyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgY3JlYXRlSW5mb1BhbmVsOiAocHJvcHMpID0+IHtcclxuICAgICAgcmVmcmVzaEZ1bmMgPSBwcm9wcy5yZWZyZXNoO1xyXG4gICAgICByZXR1cm4gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcyk7XHJcbiAgICB9LFxyXG4gICAgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbjogdHJ1ZSxcclxuICAgIGdhbWVBcnRVUkw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgcHJlU29ydDogKGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUpID0+XHJcbiAgICAgIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgbWV0YU1hbmFnZXIpLFxyXG4gICAgY2FsbGJhY2s6IChsb2FkT3JkZXIpID0+IHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlciksXHJcbiAgICBpdGVtUmVuZGVyZXI6IEN1c3RvbUl0ZW1SZW5kZXJlci5kZWZhdWx0LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiYW5uZXJsb3Jkcm9vdG1vZCcsIDIwLCB0ZXN0Um9vdE1vZCwgaW5zdGFsbFJvb3RNb2QpO1xyXG5cclxuICAvLyBJbnN0YWxscyBvbmUgb3IgbW9yZSBzdWJtb2R1bGVzLlxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2Jhbm5lcmxvcmRzdWJtb2R1bGVzJywgMjUsIHRlc3RGb3JTdWJtb2R1bGVzLCBpbnN0YWxsU3ViTW9kdWxlcyk7XHJcblxyXG4gIC8vIEEgdmVyeSBzaW1wbGUgbWlncmF0aW9uIHRoYXQgaW50ZW5kcyB0byBhZGQgdGhlIHN1Yk1vZElkcyBhdHRyaWJ1dGVcclxuICAvLyAgdG8gbW9kcyB0aGF0IGFjdCBhcyBcIm1vZCBwYWNrc1wiLiBUaGlzIG1pZ3JhdGlvbiBpcyBub24taW52YXNpdmUgYW5kIHdpbGxcclxuICAvLyAgbm90IHJlcG9ydCBhbnkgZXJyb3JzLiBTaWRlIGVmZmVjdHMgb2YgdGhlIG1pZ3JhdGlvbiBub3Qgd29ya2luZyBjb3JyZWN0bHlcclxuICAvLyAgd2lsbCBub3QgYWZmZWN0IHRoZSB1c2VyJ3MgZXhpc3RpbmcgZW52aXJvbm1lbnQuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTAyNihjb250ZXh0LmFwaSwgb2xkKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTA0NShjb250ZXh0LmFwaSwgb2xkKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2dlbmVyaWMtbG9hZC1vcmRlci1pY29ucycsIDIwMCxcclxuICAgIF9JU19TT1JUSU5HID8gJ3NwaW5uZXInIDogJ2xvb3Qtc29ydCcsIHt9LCAnQXV0byBTb3J0JywgKCkgPT4ge1xyXG4gICAgICBzb3J0SW1wbChjb250ZXh0LCBtZXRhTWFuYWdlcik7XHJcbiAgfSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCAoZ2FtZU1vZGUpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2Y/LmlkLCBtZXRhTWFuYWdlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcblxyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIChlbnRyeTogeyBmaWxlUGF0aDogc3RyaW5nLCBjYW5kaWRhdGVzOiBzdHJpbmdbXSB9KSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ10sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC5cclxuICAgICAgICAgIC8vICBUaGF0IHdheSwgdm9ydGV4IHdpbGwgY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0XHJcbiAgICAgICAgICAvLyAgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHRhcmdldCBkZXN0aW5hdGlvbiBmaWxlIGlmIGl0IGV4aXN0cy5cclxuICAgICAgICAgIC8vICB0aGlzIGlzIHRvIGNvbXBsZXRlbHkgYXZvaWQgYSBzY2VuYXJpbyB3aGVyZSB3ZSBtYXkgYXR0ZW1wdCB0b1xyXG4gICAgICAgICAgLy8gIGNvcHkgdGhlIHNhbWUgZmlsZSBvbnRvIGl0c2VsZi5cclxuICAgICAgICAgIHJldHVybiBmcy5yZW1vdmVBc3luYyh0YXJnZXRQYXRoKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19