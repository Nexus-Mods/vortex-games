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
const bluebird_1 = require("bluebird");
const React = __importStar(require("react"));
const BS = __importStar(require("react-bootstrap"));
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
const LAUNCHER_EXEC = path_1.default.join('bin', 'Win64_Shipping_Client', 'TaleWorlds.MountAndBlade.Launcher.exe');
const MODDING_KIT_EXEC = path_1.default.join('bin', 'Win64_Shipping_wEditor', 'TaleWorlds.MountAndBlade.Launcher.exe');
let STORE_ID;
const STEAMAPP_ID = 261550;
const EPICAPP_ID = 'Chickadee';
const I18N_NAMESPACE = 'game-mount-and-blade2';
const ROOT_FOLDERS = new Set(['bin', 'data', 'gui', 'icons', 'modules',
    'music', 'shaders', 'sounds', 'xmlschemas']);
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([EPICAPP_ID, STEAMAPP_ID.toString()])
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
            const subModId = yield util_1.getElementValue(path_1.default.join(destinationPath, modFile), 'Id');
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
        return startSteam().then(() => subModCache_1.parseLauncherData()).then(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield subModCache_1.refreshCache(context);
            }
            catch (err) {
                return Promise.reject(err);
            }
            const CACHE = subModCache_1.getCache();
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
                return util_1.refreshGameParams(context, {});
            }
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
            return util_1.refreshGameParams(context, loadOrder);
        });
    });
}
function tSort(sortProps, test = false) {
    const { subModIds, allowLocked, loadOrder, metaManager } = sortProps;
    const CACHE = subModCache_1.getCache();
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
                    vortex_api_1.log('debug', 'failed to compare versions', err);
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
        if (!subModCache_1.isInvalid(node)) {
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
            yield subModCache_1.refreshCache(context);
        }
        catch (err) {
            return (err instanceof vortex_api_1.util.ProcessCanceled)
                ? Promise.resolve()
                : Promise.reject(err);
        }
        const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], {});
        const CACHE = subModCache_1.getCache();
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
        return util_1.refreshGameParams(context, loadOrder);
    });
}
function preSort(context, items, direction, updateType, metaManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const CACHE = subModCache_1.getCache();
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
        const LAUNCHER_DATA = subModCache_1.getLauncherData();
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
    return React.createElement(BS.Panel, { id: 'loadorderinfo' }, React.createElement('h2', {}, t('Managing your load order', { ns: I18N_NAMESPACE })), React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement('div', {}, React.createElement('p', {}, t('You can adjust the load order for Bannerlord by dragging and dropping mods up or down on this page. '
        + 'Please keep in mind that Bannerlord is still in Early Access, which means that there might be significant '
        + 'changes to the game as time goes on. Please notify us of any Vortex related issues you encounter with this '
        + 'extension so we can fix it. For more information and help see: ', { ns: I18N_NAMESPACE }), React.createElement('a', { onClick: () => vortex_api_1.util.opn('https://wiki.nexusmods.com/index.php/Modding_Bannerlord_with_Vortex') }, t('Modding Bannerlord with Vortex.', { ns: I18N_NAMESPACE }))))), React.createElement('div', {}, React.createElement('p', {}, t('How to use:', { ns: I18N_NAMESPACE })), React.createElement('ul', {}, React.createElement('li', {}, t('Check the box next to the mods you want to be active in the game.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Click Auto Sort in the toolbar. (See below for details).', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Make sure to run the game directly via the Play button in the top left corner '
        + '(on the Bannerlord tile). Your Vortex load order may not be loaded if you run the Single Player game through the game launcher.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Optional: Manually drag and drop mods to different positions in the load order (for testing different overrides). Mods further down the list override mods further up.', { ns: I18N_NAMESPACE })))), React.createElement('div', {}, React.createElement('p', {}, t('Please note:', { ns: I18N_NAMESPACE })), React.createElement('ul', {}, React.createElement('li', {}, t('The load order reflected here will only be loaded if you run the game via the play button in '
        + 'the top left corner. Do not run the Single Player game through the launcher, as that will ignore '
        + 'the Vortex load order and go by what is shown in the launcher instead.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('For Bannerlord, mods sorted further towards the bottom of the list will override mods further up (if they conflict). '
        + 'Note: Harmony patches may be the exception to this rule.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Auto Sort uses the SubModule.xml files (the entries under <DependedModules>) to detect '
        + 'dependencies to sort by. ', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('If you cannot see your mod in this load order, Vortex may have been unable to find or parse its SubModule.xml file. '
        + 'Most - but not all mods - come with or need a SubModule.xml file.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Hit the deploy button whenever you install and enable a new mod.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('The game will not launch unless the game store (Steam, Epic, etc) is started beforehand. If you\'re getting the '
        + '"Unable to Initialize Steam API" error, restart Steam.', { ns: I18N_NAMESPACE })), React.createElement('li', {}, t('Right clicking an entry will open the context menu which can be used to lock LO entries into position; entry will '
        + 'be ignored by auto-sort maintaining its locked position.', { ns: I18N_NAMESPACE })))));
}
let _IS_SORTING = false;
function main(context) {
    const metaManager = new ComMetadataManager_1.default(context.api);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Mount & Blade II:\tBannerlord',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => '.',
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
    context['registerCollectionFeature']('mountandblade2_collection_data', (gameId, includedMods) => collections_1.genCollectionsData(context, gameId, includedMods), (gameId, collection) => collections_1.parseCollectionsData(context, gameId, collection), (t) => t('Mount and Blade 2 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
    context.registerLoadOrderPage({
        gameId: common_1.GAME_ID,
        createInfoPanel: (props) => {
            refreshFunc = props.refresh;
            return infoComponent(context, props);
        },
        noCollectionGeneration: true,
        gameArtURL: `${__dirname}/gameart.jpg`,
        preSort: (items, direction, updateType) => preSort(context, items, direction, updateType, metaManager),
        callback: (loadOrder) => util_1.refreshGameParams(context, loadOrder),
        itemRenderer: customItemRenderer_1.default.default,
    });
    context.registerInstaller('bannerlordrootmod', 20, testRootMod, installRootMod);
    context.registerInstaller('bannerlordsubmodules', 25, testForSubmodules, installSubModules);
    context.registerMigration(old => migrations_1.migrate026(context.api, old));
    context.registerAction('generic-load-order-icons', 200, _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', () => __awaiter(this, void 0, void 0, function* () {
        if (_IS_SORTING) {
            return Promise.resolve();
        }
        _IS_SORTING = true;
        try {
            yield metaManager.updateDependencyMap();
            yield subModCache_1.refreshCache(context);
        }
        catch (err) {
            context.api.showErrorNotification('Failed to resolve submodule file data', err);
            _IS_SORTING = false;
            return;
        }
        const CACHE = subModCache_1.getCache();
        const modIds = Object.keys(CACHE);
        const lockedIds = modIds.filter(id => CACHE[id].isLocked);
        const subModIds = modIds.filter(id => !CACHE[id].isLocked);
        let sortedLocked = [];
        let sortedSubMods = [];
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
            vortex_api_1.log('error', 'Failed to sort mods', { reason: 'No active profile' });
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
        return util_1.refreshGameParams(context, newOrder)
            .then(() => context.api.sendNotification({
            id: 'mnb2-sort-finished',
            type: 'info',
            message: context.api.translate('Finished sorting', { ns: I18N_NAMESPACE }),
            displayMS: 3000,
        })).finally(() => _IS_SORTING = false);
    }), () => {
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
                        .catch(err => vortex_api_1.log('error', 'failed to import added file to mod', err.message));
                }
            }));
        }));
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUV0QyxnREFBd0I7QUFDeEIsb0RBQTRCO0FBQzVCLDJDQUFrRjtBQUNsRixpQ0FBdUU7QUFFdkUscUNBQTRHO0FBQzVHLDhFQUFzRDtBQUN0RCw2Q0FBMEM7QUFFMUMsOEVBQXNEO0FBQ3RELCtDQUFzRztBQUV0RywyREFBcUY7QUFDckYsc0ZBQThEO0FBRzlELE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7QUFDekcsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBRTdHLElBQUksUUFBUSxDQUFDO0FBRWIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQzNCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQztBQUUvQixNQUFNLGNBQWMsR0FBRyx1QkFBdUIsQ0FBQztBQU0vQyxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTO0lBQ3BFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFFL0MsU0FBUyxRQUFRO0lBQ2YsT0FBTyxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ1gsUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDNUIs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QU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb21pc2UgYXMgQmx1ZWJpcmQgfSBmcm9tICdibHVlYmlyZCc7XHJcblxyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcblxyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IGdldEVsZW1lbnRWYWx1ZSwgcmVmcmVzaEdhbWVQYXJhbXMsIHdhbGtBc3luYyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQgeyBCQU5ORVJMT1JEX0VYRUMsIEdBTUVfSUQsIExPQ0tFRF9NT0RVTEVTLCBNT0RVTEVTLCBPRkZJQ0lBTF9NT0RVTEVTLCBTVUJNT0RfRklMRSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IEN1c3RvbUl0ZW1SZW5kZXJlciBmcm9tICcuL2N1c3RvbUl0ZW1SZW5kZXJlcic7XHJcbmltcG9ydCB7IG1pZ3JhdGUwMjYgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuaW1wb3J0IENvbU1ldGFkYXRhTWFuYWdlciBmcm9tICcuL0NvbU1ldGFkYXRhTWFuYWdlcic7XHJcbmltcG9ydCB7IGdldENhY2hlLCBnZXRMYXVuY2hlckRhdGEsIGlzSW52YWxpZCwgcGFyc2VMYXVuY2hlckRhdGEsIHJlZnJlc2hDYWNoZSB9IGZyb20gJy4vc3ViTW9kQ2FjaGUnO1xyXG5pbXBvcnQgeyBJU29ydFByb3BzLCBJU3ViTW9kQ2FjaGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xyXG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5pbXBvcnQgeyBJQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XHJcblxyXG5jb25zdCBMQVVOQ0hFUl9FWEVDID0gcGF0aC5qb2luKCdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1RhbGVXb3JsZHMuTW91bnRBbmRCbGFkZS5MYXVuY2hlci5leGUnKTtcclxuY29uc3QgTU9ERElOR19LSVRfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX3dFZGl0b3InLCAnVGFsZVdvcmxkcy5Nb3VudEFuZEJsYWRlLkxhdW5jaGVyLmV4ZScpO1xyXG5cclxubGV0IFNUT1JFX0lEO1xyXG5cclxuY29uc3QgU1RFQU1BUFBfSUQgPSAyNjE1NTA7XHJcbmNvbnN0IEVQSUNBUFBfSUQgPSAnQ2hpY2thZGVlJztcclxuXHJcbmNvbnN0IEkxOE5fTkFNRVNQQUNFID0gJ2dhbWUtbW91bnQtYW5kLWJsYWRlMic7XHJcblxyXG4vLyBBIHNldCBvZiBmb2xkZXIgbmFtZXMgKGxvd2VyY2FzZWQpIHdoaWNoIGFyZSBhdmFpbGFibGUgYWxvbmdzaWRlIHRoZVxyXG4vLyAgZ2FtZSdzIG1vZHVsZXMgZm9sZGVyLiBXZSBjb3VsZCd2ZSB1c2VkIHRoZSBmb21vZCBpbnN0YWxsZXIgc3RvcCBwYXR0ZXJuc1xyXG4vLyAgZnVuY3Rpb25hbGl0eSBmb3IgdGhpcywgYnV0IGl0J3MgYmV0dGVyIGlmIHRoaXMgZXh0ZW5zaW9uIGlzIHNlbGYgY29udGFpbmVkO1xyXG4vLyAgZXNwZWNpYWxseSBnaXZlbiB0aGF0IHRoZSBnYW1lJ3MgbW9kZGluZyBwYXR0ZXJuIGNoYW5nZXMgcXVpdGUgb2Z0ZW4uXHJcbmNvbnN0IFJPT1RfRk9MREVSUyA9IG5ldyBTZXQoWydiaW4nLCAnZGF0YScsICdndWknLCAnaWNvbnMnLCAnbW9kdWxlcycsXHJcbiAgJ211c2ljJywgJ3NoYWRlcnMnLCAnc291bmRzJywgJ3htbHNjaGVtYXMnXSk7XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0VQSUNBUFBfSUQsIFNURUFNQVBQX0lELnRvU3RyaW5nKCldKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiB7XHJcbiAgICAgIFNUT1JFX0lEID0gZ2FtZS5nYW1lU3RvcmVJZDtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShnYW1lLmdhbWVQYXRoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Um9vdE1vZChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgbm90U3VwcG9ydGVkID0geyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9O1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIERpZmZlcmVudCBnYW1lLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XHJcbiAgY29uc3QgbW9kc0ZpbGUgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSkgIT09IC0xKTtcclxuICBpZiAobW9kc0ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVGhlcmUncyBubyBNb2R1bGVzIGZvbGRlci5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGlkeCA9IG1vZHNGaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSk7XHJcbiAgY29uc3Qgcm9vdEZvbGRlck1hdGNoZXMgPSBsb3dlcmVkLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4gKCgoc2VnbWVudHMubGVuZ3RoIC0gMSkgPiBpZHgpICYmIFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSkpO1xyXG4gIH0pIHx8IFtdO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiAocm9vdEZvbGRlck1hdGNoZXMubGVuZ3RoID4gMCksIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUm9vdE1vZChmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgY29uc3QgbW9kdWxlRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMpICE9PSAtMSk7XHJcbiAgY29uc3QgaWR4ID0gbW9kdWxlRmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICBjb25zdCBsYXN0RWxlbWVudElkeCA9IHNlZ21lbnRzLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgLy8gSWdub3JlIGRpcmVjdG9yaWVzIGFuZCBlbnN1cmUgdGhhdCB0aGUgZmlsZSBjb250YWlucyBhIGtub3duIHJvb3QgZm9sZGVyIGF0XHJcbiAgICAvLyAgdGhlIGV4cGVjdGVkIGluZGV4LlxyXG4gICAgcmV0dXJuIChST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pXHJcbiAgICAgICYmIChwYXRoLmV4dG5hbWUoc2VnbWVudHNbbGFzdEVsZW1lbnRJZHhdKSAhPT0gJycpKTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgY29uc3QgZGVzdGluYXRpb24gPSBmaWxlLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGlkeClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKHBhdGguc2VwKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbixcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RGb3JTdWJtb2R1bGVzKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBDaGVjayB0aGlzIGlzIGEgbW9kIGZvciBCYW5uZXJsb3JkIGFuZCBpdCBjb250YWlucyBhIFN1Yk1vZHVsZS54bWxcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKSAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFN1Yk1vZHVsZXMoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFJlbW92ZSBkaXJlY3RvcmllcyBzdHJhaWdodCBhd2F5LlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIHJldHVybiBwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pICE9PSAnJztcclxuICB9KTtcclxuICBjb25zdCBzdWJNb2RJZHMgPSBbXTtcclxuICBjb25zdCBzdWJNb2RzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShzdWJNb2RzLCBhc3luYyAoYWNjdW0sIG1vZEZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBtb2RGaWxlLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICAgIGNvbnN0IHN1Yk1vZElkID0gYXdhaXQgZ2V0RWxlbWVudFZhbHVlKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEZpbGUpLCAnSWQnKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSAoc2VnbWVudHMubGVuZ3RoID4gMSlcclxuICAgICAgPyBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAyXVxyXG4gICAgICA6IHN1Yk1vZElkO1xyXG5cclxuICAgIHN1Yk1vZElkcy5wdXNoKHN1Yk1vZElkKTtcclxuICAgIGNvbnN0IGlkeCA9IG1vZEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKFNVQk1PRF9GSUxFKTtcclxuICAgIC8vIEZpbHRlciB0aGUgbW9kIGZpbGVzIGZvciB0aGlzIHNwZWNpZmljIHN1Ym1vZHVsZS5cclxuICAgIGNvbnN0IHN1Yk1vZEZpbGVzOiBzdHJpbmdbXVxyXG4gICAgICA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IGZpbGUuc2xpY2UoMCwgaWR4KSA9PT0gbW9kRmlsZS5zbGljZSgwLCBpZHgpKTtcclxuICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IHN1Yk1vZEZpbGVzLm1hcCgobW9kRmlsZTogc3RyaW5nKSA9PiAoe1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogbW9kRmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihNT0RVTEVTLCBtb2ROYW1lLCBtb2RGaWxlLnNsaWNlKGlkeCkpLFxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIGFjY3VtLmNvbmNhdChpbnN0cnVjdGlvbnMpO1xyXG4gIH0sIFtdKVxyXG4gIC50aGVuKG1lcmdlZCA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZHNBdHRyID0ge1xyXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAga2V5OiAnc3ViTW9kSWRzJyxcclxuICAgICAgdmFsdWU6IHN1Yk1vZElkcyxcclxuICAgIH07XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zOiBbXS5jb25jYXQobWVyZ2VkLCBbc3ViTW9kSWRzQXR0cl0pIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlbnN1cmVPZmZpY2lhbExhdW5jaGVyKGNvbnRleHQsIGRpc2NvdmVyeSkge1xyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woR0FNRV9JRCwgJ1RhbGVXb3JsZHNCYW5uZXJsb3JkTGF1bmNoZXInLCB7XHJcbiAgICBpZDogJ1RhbGVXb3JsZHNCYW5uZXJsb3JkTGF1bmNoZXInLFxyXG4gICAgbmFtZTogJ09mZmljaWFsIExhdW5jaGVyJyxcclxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBwYXRoLmJhc2VuYW1lKExBVU5DSEVSX0VYRUMpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICBwYXRoLmJhc2VuYW1lKExBVU5DSEVSX0VYRUMpLFxyXG4gICAgXSxcclxuICAgIHBhdGg6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTEFVTkNIRVJfRVhFQyksXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ2JpbicsICdXaW42NF9TaGlwcGluZ19DbGllbnQnKSxcclxuICAgIGhpZGRlbjogZmFsc2UsXHJcbiAgICBjdXN0b206IGZhbHNlLFxyXG4gIH0sIGZhbHNlKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldE1vZGRpbmdUb29sKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZGRlbj86IGJvb2xlYW4pIHtcclxuICBjb25zdCB0b29sSWQgPSAnYmFubmVybG9yZC1zZGsnO1xyXG4gIGNvbnN0IGV4ZWMgPSBwYXRoLmJhc2VuYW1lKE1PRERJTkdfS0lUX0VYRUMpO1xyXG4gIGNvbnN0IHRvb2wgPSB7XHJcbiAgICBpZDogdG9vbElkLFxyXG4gICAgbmFtZTogJ01vZGRpbmcgS2l0JyxcclxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBleGVjLFxyXG4gICAgcmVxdWlyZWRGaWxlczogWyBleGVjIF0sXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRERJTkdfS0lUX0VYRUMpLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIHBhdGguZGlybmFtZShNT0RESU5HX0tJVF9FWEVDKSksXHJcbiAgICBoaWRkZW4sXHJcbiAgICBjdXN0b206IGZhbHNlLFxyXG4gIH07XHJcblxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woR0FNRV9JRCwgdG9vbElkLCB0b29sLCBmYWxzZSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnksIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICAvLyBRdWlja2x5IGVuc3VyZSB0aGF0IHRoZSBvZmZpY2lhbCBMYXVuY2hlciBpcyBhZGRlZC5cclxuICBlbnN1cmVPZmZpY2lhbExhdW5jaGVyKGNvbnRleHQsIGRpc2NvdmVyeSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRERJTkdfS0lUX0VYRUMpKTtcclxuICAgIHNldE1vZGRpbmdUb29sKGNvbnRleHQsIGRpc2NvdmVyeSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCB0b29scyA9IGRpc2NvdmVyeT8udG9vbHM7XHJcbiAgICBpZiAoKHRvb2xzICE9PSB1bmRlZmluZWQpXHJcbiAgICAmJiAodXRpbC5nZXRTYWZlKHRvb2xzLCBbJ2Jhbm5lcmxvcmQtc2RrJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgc2V0TW9kZGluZ1Rvb2woY29udGV4dCwgZGlzY292ZXJ5LCB0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIElmIGdhbWUgc3RvcmUgbm90IGZvdW5kLCBsb2NhdGlvbiBtYXkgYmUgc2V0IG1hbnVhbGx5IC0gYWxsb3cgc2V0dXBcclxuICAvLyAgZnVuY3Rpb24gdG8gY29udGludWUuXHJcbiAgY29uc3QgZmluZFN0b3JlSWQgPSAoKSA9PiBmaW5kR2FtZSgpLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUoKSk7XHJcbiAgY29uc3Qgc3RhcnRTdGVhbSA9ICgpID0+IGZpbmRTdG9yZUlkKClcclxuICAgIC50aGVuKCgpID0+IChTVE9SRV9JRCA9PT0gJ3N0ZWFtJylcclxuICAgICAgPyB1dGlsLkdhbWVTdG9yZUhlbHBlci5sYXVuY2hHYW1lU3RvcmUoY29udGV4dC5hcGksIFNUT1JFX0lELCB1bmRlZmluZWQsIHRydWUpXHJcbiAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG5cclxuICAvLyBDaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHNldCB0aGUgbG9hZCBvcmRlciBvYmplY3QgZm9yIHRoaXMgcHJvZmlsZVxyXG4gIC8vICBhbmQgY3JlYXRlIGl0IGlmIHdlIGhhdmVuJ3QuXHJcbiAgcmV0dXJuIHN0YXJ0U3RlYW0oKS50aGVuKCgpID0+IHBhcnNlTGF1bmNoZXJEYXRhKCkpLnRoZW4oYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgcmVmcmVzaENhY2hlKGNvbnRleHQpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGRvIGEgcXVpY2sgdFNvcnQgYXQgdGhpcyBwb2ludCAtIG5vdCBnb2luZyB0b1xyXG4gICAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxyXG4gICAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIGNvbnN0IHNvcnRlZCA9IHRTb3J0KHsgc3ViTW9kSWRzOiBtb2RJZHMsIGFsbG93TG9ja2VkOiB0cnVlLCBtZXRhTWFuYWdlciB9KTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuTm90Rm91bmQpIHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxyXG4gICAgICAgICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgdGhyb3VnaCB0aGUgb2ZmaWNpYWwgZ2FtZSBsYXVuY2hlciBhbmQgJ1xyXG4gICAgICArICd0cnkgYWdhaW4nLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBmaW5kIGdhbWUgbGF1bmNoZXIgZGF0YScsXHJcbiAgICAgICAgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9KVxyXG4gIC5maW5hbGx5KCgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFZhbGlkIHVzZSBjYXNlIHdoZW4gYXR0ZW1wdGluZyB0byBzd2l0Y2ggdG9cclxuICAgICAgLy8gIEJhbm5lcmxvcmQgd2l0aG91dCBhbnkgYWN0aXZlIHByb2ZpbGUuXHJcbiAgICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCB7fSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRTb3J0KHNvcnRQcm9wczogSVNvcnRQcm9wcywgdGVzdDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgY29uc3QgeyBzdWJNb2RJZHMsIGFsbG93TG9ja2VkLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0gPSBzb3J0UHJvcHM7XHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIC8vIFRvcG9sb2dpY2FsIHNvcnQgLSB3ZSBuZWVkIHRvOlxyXG4gIC8vICAtIElkZW50aWZ5IGN5Y2xpYyBkZXBlbmRlbmNpZXMuXHJcbiAgLy8gIC0gSWRlbnRpZnkgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgLy8gIC0gV2Ugd2lsbCB0cnkgdG8gaWRlbnRpZnkgaW5jb21wYXRpYmxlIGRlcGVuZGVuY2llcyAodmVyc2lvbi13aXNlKVxyXG5cclxuICAvLyBUaGVzZSBhcmUgbWFudWFsbHkgbG9ja2VkIG1vZCBlbnRyaWVzLlxyXG4gIGNvbnN0IGxvY2tlZFN1Yk1vZHMgPSAoISFsb2FkT3JkZXIpXHJcbiAgICA/IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kSWQgPT4ge1xyXG4gICAgICBjb25zdCBlbnRyeSA9IENBQ0hFW3N1Yk1vZElkXTtcclxuICAgICAgcmV0dXJuICghIWVudHJ5KVxyXG4gICAgICAgID8gISFsb2FkT3JkZXJbZW50cnkudm9ydGV4SWRdPy5sb2NrZWRcclxuICAgICAgICA6IGZhbHNlO1xyXG4gICAgfSlcclxuICAgIDogW107XHJcbiAgY29uc3QgYWxwaGFiZXRpY2FsID0gc3ViTW9kSWRzLmZpbHRlcihzdWJNb2QgPT4gIWxvY2tlZFN1Yk1vZHMuaW5jbHVkZXMoc3ViTW9kKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgpO1xyXG4gIGNvbnN0IGdyYXBoID0gYWxwaGFiZXRpY2FsLnJlZHVjZSgoYWNjdW0sIGVudHJ5KSA9PiB7XHJcbiAgICBjb25zdCBkZXBJZHMgPSBbLi4uQ0FDSEVbZW50cnldLmRlcGVuZGVuY2llc10ubWFwKGRlcCA9PiBkZXAuZGVwSWQpO1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBub2RlIGdyYXBoLlxyXG4gICAgYWNjdW1bZW50cnldID0gZGVwSWRzLnNvcnQoKTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIC8vIFdpbGwgc3RvcmUgdGhlIGZpbmFsIExPIHJlc3VsdFxyXG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG5cclxuICAvLyBUaGUgbm9kZXMgd2UgaGF2ZSB2aXNpdGVkL3Byb2Nlc3NlZC5cclxuICBjb25zdCB2aXNpdGVkID0gW107XHJcblxyXG4gIC8vIFRoZSBub2RlcyB3aGljaCBhcmUgc3RpbGwgcHJvY2Vzc2luZy5cclxuICBjb25zdCBwcm9jZXNzaW5nID0gW107XHJcblxyXG4gIGNvbnN0IHRvcFNvcnQgPSAobm9kZSkgPT4ge1xyXG4gICAgcHJvY2Vzc2luZ1tub2RlXSA9IHRydWU7XHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSAoISFhbGxvd0xvY2tlZClcclxuICAgICAgPyBncmFwaFtub2RlXVxyXG4gICAgICA6IGdyYXBoW25vZGVdLmZpbHRlcihlbGVtZW50ID0+ICFMT0NLRURfTU9EVUxFUy5oYXMoZWxlbWVudCkpO1xyXG5cclxuICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcGVuZGVuY2llcykge1xyXG4gICAgICBpZiAocHJvY2Vzc2luZ1tkZXBdKSB7XHJcbiAgICAgICAgLy8gQ3ljbGljIGRlcGVuZGVuY3kgZGV0ZWN0ZWQgLSBoaWdobGlnaHQgYm90aCBtb2RzIGFzIGludmFsaWRcclxuICAgICAgICAvLyAgd2l0aGluIHRoZSBjYWNoZSBpdHNlbGYgLSB3ZSBhbHNvIG5lZWQgdG8gaGlnaGxpZ2h0IHdoaWNoIG1vZHMuXHJcbiAgICAgICAgQ0FDSEVbbm9kZV0uaW52YWxpZC5jeWNsaWMucHVzaChkZXApO1xyXG4gICAgICAgIENBQ0hFW2RlcF0uaW52YWxpZC5jeWNsaWMucHVzaChub2RlKTtcclxuXHJcbiAgICAgICAgdmlzaXRlZFtub2RlXSA9IHRydWU7XHJcbiAgICAgICAgcHJvY2Vzc2luZ1tub2RlXSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBpbmNvbXBhdGlibGVEZXBzID0gQ0FDSEVbbm9kZV0uaW52YWxpZC5pbmNvbXBhdGlibGVEZXBzO1xyXG4gICAgICBjb25zdCBpbmNEZXAgPSBpbmNvbXBhdGlibGVEZXBzLmZpbmQoZCA9PiBkLmRlcElkID09PSBkZXApO1xyXG4gICAgICBpZiAoT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKGRlcCkgJiYgKGluY0RlcCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIGNvbnN0IGRlcFZlciA9IENBQ0hFW2RlcF0uc3ViTW9kVmVyO1xyXG4gICAgICAgIGNvbnN0IGRlcEluc3QgPSBDQUNIRVtub2RlXS5kZXBlbmRlbmNpZXMuZmluZChkID0+IGQuZGVwSWQgPT09IGRlcCk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IG1hdGNoID0gc2VtdmVyLnNhdGlzZmllcyhkZXBJbnN0LmRlcFZlcnNpb24sIGRlcFZlcik7XHJcbiAgICAgICAgICBpZiAoIW1hdGNoICYmICEhZGVwSW5zdD8uZGVwVmVyc2lvbiAmJiAhIWRlcFZlcikge1xyXG4gICAgICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmluY29tcGF0aWJsZURlcHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgZGVwSWQ6IGRlcCxcclxuICAgICAgICAgICAgICByZXF1aXJlZFZlcnNpb246IGRlcEluc3QuZGVwVmVyc2lvbixcclxuICAgICAgICAgICAgICBjdXJyZW50VmVyc2lvbjogZGVwVmVyLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIC8vIE9rIHNvIHdlIGRpZG4ndCBtYW5hZ2UgdG8gY29tcGFyZSB0aGUgdmVyc2lvbnMsIHdlIGxvZyB0aGlzIGFuZFxyXG4gICAgICAgICAgLy8gIGNvbnRpbnVlLlxyXG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gY29tcGFyZSB2ZXJzaW9ucycsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXZpc2l0ZWRbZGVwXSAmJiAhbG9ja2VkU3ViTW9kcy5pbmNsdWRlcyhkZXApKSB7XHJcbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhncmFwaCkuaW5jbHVkZXMoZGVwKSkge1xyXG4gICAgICAgICAgQ0FDSEVbbm9kZV0uaW52YWxpZC5taXNzaW5nLnB1c2goZGVwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdG9wU29ydChkZXApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3Npbmdbbm9kZV0gPSBmYWxzZTtcclxuICAgIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xyXG5cclxuICAgIGlmICghaXNJbnZhbGlkKG5vZGUpKSB7XHJcbiAgICAgIHJlc3VsdC5wdXNoKG5vZGUpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGZvciAoY29uc3Qgbm9kZSBpbiBncmFwaCkge1xyXG4gICAgaWYgKCF2aXNpdGVkW25vZGVdICYmICFwcm9jZXNzaW5nW25vZGVdKSB7XHJcbiAgICAgIHRvcFNvcnQobm9kZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoYWxsb3dMb2NrZWQpIHtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvLyBQcm9wZXIgdG9wb2xvZ2ljYWwgc29ydCBkaWN0YXRlcyB3ZSBzaW1wbHkgcmV0dXJuIHRoZVxyXG4gIC8vICByZXN1bHQgYXQgdGhpcyBwb2ludC4gQnV0LCBtb2QgYXV0aG9ycyB3YW50IG1vZHVsZXNcclxuICAvLyAgd2l0aCBubyBkZXBlbmRlbmNpZXMgdG8gYnViYmxlIHVwIHRvIHRoZSB0b3Agb2YgdGhlIExPLlxyXG4gIC8vICAoVGhpcyB3aWxsIG9ubHkgYXBwbHkgdG8gbm9uIGxvY2tlZCBlbnRyaWVzKVxyXG4gIGNvbnN0IHN1Yk1vZHNXaXRoTm9EZXBzID0gcmVzdWx0LmZpbHRlcihkZXAgPT4gKGdyYXBoW2RlcF0ubGVuZ3RoID09PSAwKVxyXG4gICAgfHwgKGdyYXBoW2RlcF0uZmluZChkID0+ICFMT0NLRURfTU9EVUxFUy5oYXMoZCkpID09PSB1bmRlZmluZWQpKS5zb3J0KCkgfHwgW107XHJcbiAgY29uc3QgdGFtcGVyZWRSZXN1bHQgPSBbXS5jb25jYXQoc3ViTW9kc1dpdGhOb0RlcHMsXHJcbiAgICByZXN1bHQuZmlsdGVyKGVudHJ5ID0+ICFzdWJNb2RzV2l0aE5vRGVwcy5pbmNsdWRlcyhlbnRyeSkpKTtcclxuICBsb2NrZWRTdWJNb2RzLmZvckVhY2goc3ViTW9kSWQgPT4ge1xyXG4gICAgY29uc3QgcG9zID0gbG9hZE9yZGVyW0NBQ0hFW3N1Yk1vZElkXS52b3J0ZXhJZF0ucG9zO1xyXG4gICAgdGFtcGVyZWRSZXN1bHQuc3BsaWNlKHBvcywgMCwgW3N1Yk1vZElkXSk7XHJcbiAgfSk7XHJcblxyXG4gIGlmICh0ZXN0ID09PSB0cnVlKSB7XHJcbiAgICBjb25zdCBtZXRhU29ydGVkID0gbWV0YU1hbmFnZXIuc29ydCh0YW1wZXJlZFJlc3VsdCk7XHJcbiAgICByZXR1cm4gbWV0YVNvcnRlZDtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHRhbXBlcmVkUmVzdWx0O1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNFeHRlcm5hbChjb250ZXh0LCBzdWJNb2RJZCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMobW9kcyk7XHJcbiAgbW9kSWRzLmZvckVhY2gobW9kSWQgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWRzID0gdXRpbC5nZXRTYWZlKG1vZHNbbW9kSWRdLCBbJ2F0dHJpYnV0ZXMnLCAnc3ViTW9kSWRzJ10sIFtdKTtcclxuICAgIGlmIChzdWJNb2RJZHMuaW5jbHVkZXMoc3ViTW9kSWQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubGV0IHJlZnJlc2hGdW5jO1xyXG5hc3luYyBmdW5jdGlvbiByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IGRlcGxveVByb2ZpbGU/LmdhbWVJZCkgfHwgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkpIHtcclxuICAgIC8vIERlcGxveW1lbnQgZXZlbnQgc2VlbXMgdG8gYmUgZXhlY3V0ZWQgZm9yIGEgcHJvZmlsZSBvdGhlclxyXG4gICAgLy8gIHRoYW4gdGhlIGN1cnJlbnRseSBhY3RpdmUgb25lLiBOb3QgZ29pbmcgdG8gY29udGludWUuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKHByb2ZpbGVJZCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCByZWZyZXNoQ2FjaGUoY29udGV4dCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBQcm9jZXNzQ2FuY2VsZWQgbWVhbnMgdGhhdCB3ZSB3ZXJlIHVuYWJsZSB0byBzY2FuIGZvciBkZXBsb3llZFxyXG4gICAgLy8gIHN1Yk1vZHVsZXMsIHByb2JhYmx5IGJlY2F1c2UgZ2FtZSBkaXNjb3ZlcnkgaXMgaW5jb21wbGV0ZS5cclxuICAgIC8vIEl0J3MgYmV5b25kIHRoZSBzY29wZSBvZiB0aGlzIGZ1bmN0aW9uIHRvIHJlcG9ydCBkaXNjb3ZlcnlcclxuICAgIC8vICByZWxhdGVkIGlzc3Vlcy5cclxuICAgIHJldHVybiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwge30pO1xyXG5cclxuICAvLyBXZSdyZSBnb2luZyB0byBkbyBhIHF1aWNrIHRTb3J0IGF0IHRoaXMgcG9pbnQgLSBub3QgZ29pbmcgdG9cclxuICAvLyAgY2hhbmdlIHRoZSB1c2VyJ3MgbG9hZCBvcmRlciwgYnV0IHRoaXMgd2lsbCBoaWdobGlnaHQgYW55XHJcbiAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gIGNvbnN0IHNvcnRQcm9wczogSVNvcnRQcm9wcyA9IHtcclxuICAgIHN1Yk1vZElkczogbW9kSWRzLFxyXG4gICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICBsb2FkT3JkZXIsXHJcbiAgICBtZXRhTWFuYWdlcixcclxuICB9O1xyXG4gIGNvbnN0IHNvcnRlZCA9IHRTb3J0KHNvcnRQcm9wcyk7XHJcblxyXG4gIGlmIChyZWZyZXNoRnVuYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZWZyZXNoRnVuYygpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgbWV0YU1hbmFnZXIpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQgfHwgYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBSYWNlIGNvbmRpdGlvbiA/XHJcbiAgICByZXR1cm4gaXRlbXM7XHJcbiAgfVxyXG5cclxuICBsZXQgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gIGlmIChpdGVtcy5sZW5ndGggPiAwICYmIG1vZElkcy5sZW5ndGggPT09IDApIHtcclxuICAgIC8vIENhY2hlIGhhc24ndCBiZWVuIHBvcHVsYXRlZCB5ZXQuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBSZWZyZXNoIHRoZSBjYWNoZS5cclxuICAgICAgYXdhaXQgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBhY3RpdmVQcm9maWxlLmlkLCBtZXRhTWFuYWdlcik7XHJcbiAgICAgIG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIExvY2tlZCBpZHMgYXJlIGFsd2F5cyBhdCB0aGUgdG9wIG9mIHRoZSBsaXN0IGFzIGFsbFxyXG4gIC8vICBvdGhlciBtb2R1bGVzIGRlcGVuZCBvbiB0aGVzZS5cclxuICBsZXQgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG5cclxuICB0cnkge1xyXG4gICAgLy8gU29ydCB0aGUgbG9ja2VkIGlkcyBhbW9uZ3N0IHRoZW1zZWx2ZXMgdG8gZW5zdXJlXHJcbiAgICAvLyAgdGhhdCB0aGUgZ2FtZSByZWNlaXZlcyB0aGVzZSBpbiB0aGUgcmlnaHQgb3JkZXIuXHJcbiAgICBjb25zdCBzb3J0UHJvcHM6IElTb3J0UHJvcHMgPSB7XHJcbiAgICAgIHN1Yk1vZElkczogbG9ja2VkSWRzLFxyXG4gICAgICBhbGxvd0xvY2tlZDogdHJ1ZSxcclxuICAgICAgbWV0YU1hbmFnZXIsXHJcbiAgICB9O1xyXG4gICAgbG9ja2VkSWRzID0gdFNvcnQoc29ydFByb3BzKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy8gQ3JlYXRlIHRoZSBsb2NrZWQgZW50cmllcy5cclxuICBjb25zdCBsb2NrZWRJdGVtcyA9IGxvY2tlZElkcy5tYXAoaWQgPT4gKHtcclxuICAgIGlkOiBDQUNIRVtpZF0udm9ydGV4SWQsXHJcbiAgICBuYW1lOiBDQUNIRVtpZF0uc3ViTW9kTmFtZSxcclxuICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBsb2NrZWQ6IHRydWUsXHJcbiAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoaWQpLFxyXG4gIH0pKTtcclxuXHJcbiAgY29uc3QgTEFVTkNIRVJfREFUQSA9IGdldExhdW5jaGVyRGF0YSgpO1xyXG5cclxuICAvLyBFeHRlcm5hbCBpZHMgd2lsbCBpbmNsdWRlIG9mZmljaWFsIG1vZHVsZXMgYXMgd2VsbCBidXQgbm90IGxvY2tlZCBlbnRyaWVzLlxyXG4gIGNvbnN0IGV4dGVybmFsSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiAoIUNBQ0hFW2lkXS5pc0xvY2tlZCkgJiYgKENBQ0hFW2lkXS52b3J0ZXhJZCA9PT0gaWQpKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IExPa2V5cyA9ICgoT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPiAwKVxyXG4gICAgPyBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXHJcbiAgICA6IExBVU5DSEVSX0RBVEEuc2luZ2xlUGxheWVyU3ViTW9kcy5tYXAobW9kID0+IG1vZC5zdWJNb2RJZCkpO1xyXG5cclxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHRoYXQgYXJlIGFscmVhZHkgaW4gdGhlIGxvYWQgb3JkZXIuXHJcbiAgY29uc3Qga25vd25FeHQgPSBleHRlcm5hbElkcy5maWx0ZXIoaWQgPT4gTE9rZXlzLmluY2x1ZGVzKGlkKSkgfHwgW107XHJcblxyXG4gIC8vIEV4dGVybmFsIG1vZHVsZXMgd2hpY2ggYXJlIG5ldyBhbmQgaGF2ZSB5ZXQgdG8gYmUgYWRkZWQgdG8gdGhlIExPLlxyXG4gIGNvbnN0IHVua25vd25FeHQgPSBleHRlcm5hbElkcy5maWx0ZXIoaWQgPT4gIUxPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xyXG5cclxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+IHtcclxuICAgIC8vIFJlbW92ZSBhbnkgbG9ja2VkSWRzLCBidXQgYWxzbyBlbnN1cmUgdGhhdCB0aGVcclxuICAgIC8vICBlbnRyeSBjYW4gYmUgZm91bmQgaW4gdGhlIGNhY2hlLiBJZiBpdCdzIG5vdCBpbiB0aGVcclxuICAgIC8vICBjYWNoZSwgdGhpcyBtYXkgbWVhbiB0aGF0IHRoZSBzdWJtb2QgeG1sIGZpbGUgZmFpbGVkXHJcbiAgICAvLyAgcGFyc2UtaW5nIGFuZCB0aGVyZWZvcmUgc2hvdWxkIG5vdCBiZSBkaXNwbGF5ZWQuXHJcbiAgICBjb25zdCBpc0xvY2tlZCA9IGxvY2tlZElkcy5pbmNsdWRlcyhpdGVtLmlkKTtcclxuICAgIGNvbnN0IGhhc0NhY2hlRW50cnkgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT5cclxuICAgICAgQ0FDSEVba2V5XS52b3J0ZXhJZCA9PT0gaXRlbS5pZCkgIT09IHVuZGVmaW5lZDtcclxuICAgIHJldHVybiAhaXNMb2NrZWQgJiYgaGFzQ2FjaGVFbnRyeTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgcG9zTWFwID0ge307XHJcbiAgbGV0IG5leHRBdmFpbGFibGUgPSBMT2tleXMubGVuZ3RoO1xyXG4gIGNvbnN0IGdldE5leHRQb3MgPSAobG9JZCkgPT4ge1xyXG4gICAgaWYgKExPQ0tFRF9NT0RVTEVTLmhhcyhsb0lkKSkge1xyXG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShMT0NLRURfTU9EVUxFUykuaW5kZXhPZihsb0lkKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocG9zTWFwW2xvSWRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcG9zTWFwW2xvSWRdID0gbmV4dEF2YWlsYWJsZTtcclxuICAgICAgcmV0dXJuIG5leHRBdmFpbGFibGUrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBwb3NNYXBbbG9JZF07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAga25vd25FeHQubWFwKGtleSA9PiAoe1xyXG4gICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXHJcbiAgICBuYW1lOiBDQUNIRVtrZXldLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXHJcbiAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoa2V5KSxcclxuICB9KSlcclxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWF4LWxpbmUtbGVuZ3RoXHJcbiAgICAuc29ydCgoYSwgYikgPT4gKGxvYWRPcmRlclthLmlkXT8ucG9zIHx8IGdldE5leHRQb3MoYS5pZCkpIC0gKGxvYWRPcmRlcltiLmlkXT8ucG9zIHx8IGdldE5leHRQb3MoYi5pZCkpKVxyXG4gICAgLmZvckVhY2goa25vd24gPT4ge1xyXG4gICAgICAvLyBJZiB0aGlzIGEga25vd24gZXh0ZXJuYWwgbW9kdWxlIGFuZCBpcyBOT1QgaW4gdGhlIGl0ZW0gbGlzdCBhbHJlYWR5XHJcbiAgICAgIC8vICB3ZSBuZWVkIHRvIHJlLWluc2VydCBpbiB0aGUgY29ycmVjdCBpbmRleCBhcyBhbGwga25vd24gZXh0ZXJuYWwgbW9kdWxlc1xyXG4gICAgICAvLyAgYXQgdGhpcyBwb2ludCBhcmUgYWN0dWFsbHkgZGVwbG95ZWQgaW5zaWRlIHRoZSBtb2RzIGZvbGRlciBhbmQgc2hvdWxkXHJcbiAgICAgIC8vICBiZSBpbiB0aGUgaXRlbXMgbGlzdCFcclxuICAgICAgY29uc3QgZGlmZiA9IChMT2tleXMubGVuZ3RoKSAtIChMT2tleXMubGVuZ3RoIC0gQXJyYXkuZnJvbShMT0NLRURfTU9EVUxFUykubGVuZ3RoKTtcclxuICAgICAgaWYgKGl0ZW1zLmZpbmQoaXRlbSA9PiBpdGVtLmlkID09PSBrbm93bi5pZCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnN0IHBvcyA9IGxvYWRPcmRlcltrbm93bi5pZF0/LnBvcztcclxuICAgICAgICBjb25zdCBpZHggPSAocG9zICE9PSB1bmRlZmluZWQpID8gKHBvcyAtIGRpZmYpIDogKGdldE5leHRQb3Moa25vd24uaWQpIC0gZGlmZik7XHJcbiAgICAgICAgaXRlbXMuc3BsaWNlKGlkeCwgMCwga25vd24pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgdW5rbm93bkl0ZW1zID0gW10uY29uY2F0KHVua25vd25FeHQpXHJcbiAgICAubWFwKGtleSA9PiAoe1xyXG4gICAgICBpZDogQ0FDSEVba2V5XS52b3J0ZXhJZCxcclxuICAgICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxyXG4gICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICBleHRlcm5hbDogaXNFeHRlcm5hbChjb250ZXh0LCBDQUNIRVtrZXldLnZvcnRleElkKSxcclxuICAgICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXHJcbiAgICB9KSk7XHJcblxyXG4gIGNvbnN0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChsb2NrZWRJdGVtcywgaXRlbXMsIHVua25vd25JdGVtcyk7XHJcbiAgcmV0dXJuIChkaXJlY3Rpb24gPT09ICdkZXNjZW5kaW5nJylcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHByZVNvcnRlZC5yZXZlcnNlKCkpXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSB7XHJcbiAgY29uc3QgdCA9IGNvbnRleHQuYXBpLnRyYW5zbGF0ZTtcclxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2xvYWRvcmRlcmluZm8nIH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LCB0KCdNYW5hZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnWW91IGNhbiBhZGp1c3QgdGhlIGxvYWQgb3JkZXIgZm9yIEJhbm5lcmxvcmQgYnkgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIG1vZHMgdXAgb3IgZG93biBvbiB0aGlzIHBhZ2UuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIGtlZXAgaW4gbWluZCB0aGF0IEJhbm5lcmxvcmQgaXMgc3RpbGwgaW4gRWFybHkgQWNjZXNzLCB3aGljaCBtZWFucyB0aGF0IHRoZXJlIG1pZ2h0IGJlIHNpZ25pZmljYW50ICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnY2hhbmdlcyB0byB0aGUgZ2FtZSBhcyB0aW1lIGdvZXMgb24uIFBsZWFzZSBub3RpZnkgdXMgb2YgYW55IFZvcnRleCByZWxhdGVkIGlzc3VlcyB5b3UgZW5jb3VudGVyIHdpdGggdGhpcyAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2V4dGVuc2lvbiBzbyB3ZSBjYW4gZml4IGl0LiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhbmQgaGVscCBzZWU6ICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYScsIHsgb25DbGljazogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Nb2RkaW5nX0Jhbm5lcmxvcmRfd2l0aF9Wb3J0ZXgnKSB9LCB0KCdNb2RkaW5nIEJhbm5lcmxvcmQgd2l0aCBWb3J0ZXguJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnSG93IHRvIHVzZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQ2hlY2sgdGhlIGJveCBuZXh0IHRvIHRoZSBtb2RzIHlvdSB3YW50IHRvIGJlIGFjdGl2ZSBpbiB0aGUgZ2FtZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQ2xpY2sgQXV0byBTb3J0IGluIHRoZSB0b29sYmFyLiAoU2VlIGJlbG93IGZvciBkZXRhaWxzKS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnTWFrZSBzdXJlIHRvIHJ1biB0aGUgZ2FtZSBkaXJlY3RseSB2aWEgdGhlIFBsYXkgYnV0dG9uIGluIHRoZSB0b3AgbGVmdCBjb3JuZXIgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJyhvbiB0aGUgQmFubmVybG9yZCB0aWxlKS4gWW91ciBWb3J0ZXggbG9hZCBvcmRlciBtYXkgbm90IGJlIGxvYWRlZCBpZiB5b3UgcnVuIHRoZSBTaW5nbGUgUGxheWVyIGdhbWUgdGhyb3VnaCB0aGUgZ2FtZSBsYXVuY2hlci4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnT3B0aW9uYWw6IE1hbnVhbGx5IGRyYWcgYW5kIGRyb3AgbW9kcyB0byBkaWZmZXJlbnQgcG9zaXRpb25zIGluIHRoZSBsb2FkIG9yZGVyIChmb3IgdGVzdGluZyBkaWZmZXJlbnQgb3ZlcnJpZGVzKS4gTW9kcyBmdXJ0aGVyIGRvd24gdGhlIGxpc3Qgb3ZlcnJpZGUgbW9kcyBmdXJ0aGVyIHVwLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnUGxlYXNlIG5vdGU6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1RoZSBsb2FkIG9yZGVyIHJlZmxlY3RlZCBoZXJlIHdpbGwgb25seSBiZSBsb2FkZWQgaWYgeW91IHJ1biB0aGUgZ2FtZSB2aWEgdGhlIHBsYXkgYnV0dG9uIGluICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICd0aGUgdG9wIGxlZnQgY29ybmVyLiBEbyBub3QgcnVuIHRoZSBTaW5nbGUgUGxheWVyIGdhbWUgdGhyb3VnaCB0aGUgbGF1bmNoZXIsIGFzIHRoYXQgd2lsbCBpZ25vcmUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3RoZSBWb3J0ZXggbG9hZCBvcmRlciBhbmQgZ28gYnkgd2hhdCBpcyBzaG93biBpbiB0aGUgbGF1bmNoZXIgaW5zdGVhZC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnRm9yIEJhbm5lcmxvcmQsIG1vZHMgc29ydGVkIGZ1cnRoZXIgdG93YXJkcyB0aGUgYm90dG9tIG9mIHRoZSBsaXN0IHdpbGwgb3ZlcnJpZGUgbW9kcyBmdXJ0aGVyIHVwIChpZiB0aGV5IGNvbmZsaWN0KS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ05vdGU6IEhhcm1vbnkgcGF0Y2hlcyBtYXkgYmUgdGhlIGV4Y2VwdGlvbiB0byB0aGlzIHJ1bGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0F1dG8gU29ydCB1c2VzIHRoZSBTdWJNb2R1bGUueG1sIGZpbGVzICh0aGUgZW50cmllcyB1bmRlciA8RGVwZW5kZWRNb2R1bGVzPikgdG8gZGV0ZWN0ICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdkZXBlbmRlbmNpZXMgdG8gc29ydCBieS4gJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0lmIHlvdSBjYW5ub3Qgc2VlIHlvdXIgbW9kIGluIHRoaXMgbG9hZCBvcmRlciwgVm9ydGV4IG1heSBoYXZlIGJlZW4gdW5hYmxlIHRvIGZpbmQgb3IgcGFyc2UgaXRzIFN1Yk1vZHVsZS54bWwgZmlsZS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ01vc3QgLSBidXQgbm90IGFsbCBtb2RzIC0gY29tZSB3aXRoIG9yIG5lZWQgYSBTdWJNb2R1bGUueG1sIGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0hpdCB0aGUgZGVwbG95IGJ1dHRvbiB3aGVuZXZlciB5b3UgaW5zdGFsbCBhbmQgZW5hYmxlIGEgbmV3IG1vZC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnVGhlIGdhbWUgd2lsbCBub3QgbGF1bmNoIHVubGVzcyB0aGUgZ2FtZSBzdG9yZSAoU3RlYW0sIEVwaWMsIGV0YykgaXMgc3RhcnRlZCBiZWZvcmVoYW5kLiBJZiB5b3VcXCdyZSBnZXR0aW5nIHRoZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnXCJVbmFibGUgdG8gSW5pdGlhbGl6ZSBTdGVhbSBBUElcIiBlcnJvciwgcmVzdGFydCBTdGVhbS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnUmlnaHQgY2xpY2tpbmcgYW4gZW50cnkgd2lsbCBvcGVuIHRoZSBjb250ZXh0IG1lbnUgd2hpY2ggY2FuIGJlIHVzZWQgdG8gbG9jayBMTyBlbnRyaWVzIGludG8gcG9zaXRpb247IGVudHJ5IHdpbGwgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2JlIGlnbm9yZWQgYnkgYXV0by1zb3J0IG1haW50YWluaW5nIGl0cyBsb2NrZWQgcG9zaXRpb24uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpO1xyXG59XHJcblxyXG5sZXQgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuZnVuY3Rpb24gbWFpbihjb250ZXh0KSB7XHJcbiAgY29uc3QgbWV0YU1hbmFnZXIgPSBuZXcgQ29tTWV0YWRhdGFNYW5hZ2VyKGNvbnRleHQuYXBpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdNb3VudCAmIEJsYWRlIElJOlxcdEJhbm5lcmxvcmQnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJy4nLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IEJBTk5FUkxPUkRfRVhFQyxcclxuICAgIHNldHVwOiAoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnksIG1ldGFNYW5hZ2VyKSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgXSxcclxuICAgIHBhcmFtZXRlcnM6IFtdLFxyXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQudG9TdHJpbmcoKSxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IFNURUFNQVBQX0lELFxyXG4gICAgICBlcGljQXBwSWQ6IEVQSUNBUFBfSUQsXHJcbiAgICAgIGN1c3RvbU9wZW5Nb2RzUGF0aDogTU9EVUxFUyxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHRbJ3JlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUnXShcclxuICAgICdtb3VudGFuZGJsYWRlMl9jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMpLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJQ29sbGVjdGlvbnNEYXRhKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKHQpID0+IHQoJ01vdW50IGFuZCBCbGFkZSAyIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICAvLyBSZWdpc3RlciB0aGUgTE8gcGFnZS5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKTtcclxuICAgIH0sXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBwcmVTb3J0OiAoaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSkgPT5cclxuICAgICAgcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlciksXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcikgPT4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIGl0ZW1SZW5kZXJlcjogQ3VzdG9tSXRlbVJlbmRlcmVyLmRlZmF1bHQsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2Jhbm5lcmxvcmRyb290bW9kJywgMjAsIHRlc3RSb290TW9kLCBpbnN0YWxsUm9vdE1vZCk7XHJcblxyXG4gIC8vIEluc3RhbGxzIG9uZSBvciBtb3JlIHN1Ym1vZHVsZXMuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHN1Ym1vZHVsZXMnLCAyNSwgdGVzdEZvclN1Ym1vZHVsZXMsIGluc3RhbGxTdWJNb2R1bGVzKTtcclxuXHJcbiAgLy8gQSB2ZXJ5IHNpbXBsZSBtaWdyYXRpb24gdGhhdCBpbnRlbmRzIHRvIGFkZCB0aGUgc3ViTW9kSWRzIGF0dHJpYnV0ZVxyXG4gIC8vICB0byBtb2RzIHRoYXQgYWN0IGFzIFwibW9kIHBhY2tzXCIuIFRoaXMgbWlncmF0aW9uIGlzIG5vbi1pbnZhc2l2ZSBhbmQgd2lsbFxyXG4gIC8vICBub3QgcmVwb3J0IGFueSBlcnJvcnMuIFNpZGUgZWZmZWN0cyBvZiB0aGUgbWlncmF0aW9uIG5vdCB3b3JraW5nIGNvcnJlY3RseVxyXG4gIC8vICB3aWxsIG5vdCBhZmZlY3QgdGhlIHVzZXIncyBleGlzdGluZyBlbnZpcm9ubWVudC5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDI2KGNvbnRleHQuYXBpLCBvbGQpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZ2VuZXJpYy1sb2FkLW9yZGVyLWljb25zJywgMjAwLFxyXG4gICAgX0lTX1NPUlRJTkcgPyAnc3Bpbm5lcicgOiAnbG9vdC1zb3J0Jywge30sICdBdXRvIFNvcnQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmIChfSVNfU09SVElORykge1xyXG4gICAgICAgIC8vIEFscmVhZHkgc29ydGluZyAtIGRvbid0IGRvIGFueXRoaW5nLlxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgX0lTX1NPUlRJTkcgPSB0cnVlO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKCk7XHJcbiAgICAgICAgYXdhaXQgcmVmcmVzaENhY2hlKGNvbnRleHQpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZXNvbHZlIHN1Ym1vZHVsZSBmaWxlIGRhdGEnLCBlcnIpO1xyXG4gICAgICAgIF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgICAgY29uc3QgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG4gICAgICBjb25zdCBzdWJNb2RJZHMgPSBtb2RJZHMuZmlsdGVyKGlkID0+ICFDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG5cclxuICAgICAgbGV0IHNvcnRlZExvY2tlZCA9IFtdO1xyXG4gICAgICBsZXQgc29ydGVkU3ViTW9kcyA9IFtdO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFByb2JhYmx5IGJlc3QgdGhhdCB3ZSBkb24ndCByZXBvcnQgdGhpcyB2aWEgbm90aWZpY2F0aW9uIGFzIGEgbnVtYmVyXHJcbiAgICAgICAgLy8gIG9mIHRoaW5ncyBtYXkgaGF2ZSBvY2N1cnJlZCB0aGF0IGNhdXNlZCB0aGlzIGlzc3VlLiBXZSBsb2cgaXQgaW5zdGVhZC5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ05vIGFjdGl2ZSBwcm9maWxlJyB9KTtcclxuICAgICAgICBfSVNfU09SVElORyA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgc29ydGVkTG9ja2VkID0gdFNvcnQoeyBzdWJNb2RJZHM6IGxvY2tlZElkcywgYWxsb3dMb2NrZWQ6IHRydWUsIG1ldGFNYW5hZ2VyIH0pO1xyXG4gICAgICAgIHNvcnRlZFN1Yk1vZHMgPSB0U29ydCh7IHN1Yk1vZElkcywgYWxsb3dMb2NrZWQ6IGZhbHNlLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0sIHRydWUpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCBlcnIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbmV3T3JkZXIgPSBbXS5jb25jYXQoc29ydGVkTG9ja2VkLCBzb3J0ZWRTdWJNb2RzKS5yZWR1Y2UoKGFjY3VtLCBpZCwgaWR4KSA9PiB7XHJcbiAgICAgICAgY29uc3Qgdm9ydGV4SWQgPSBDQUNIRVtpZF0udm9ydGV4SWQ7XHJcbiAgICAgICAgY29uc3QgbmV3RW50cnkgPSB7XHJcbiAgICAgICAgICBwb3M6IGlkeCxcclxuICAgICAgICAgIGVuYWJsZWQ6IENBQ0hFW2lkXS5pc09mZmljaWFsXHJcbiAgICAgICAgICAgID8gdHJ1ZVxyXG4gICAgICAgICAgICA6ICghIWxvYWRPcmRlclt2b3J0ZXhJZF0pXHJcbiAgICAgICAgICAgICAgPyBsb2FkT3JkZXJbdm9ydGV4SWRdLmVuYWJsZWRcclxuICAgICAgICAgICAgICA6IHRydWUsXHJcbiAgICAgICAgICBsb2NrZWQ6IChsb2FkT3JkZXJbdm9ydGV4SWRdPy5sb2NrZWQgPT09IHRydWUpLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFjY3VtW3ZvcnRleElkXSA9IG5ld0VudHJ5O1xyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwge30pO1xyXG5cclxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIoYWN0aXZlUHJvZmlsZS5pZCwgbmV3T3JkZXIpKTtcclxuICAgICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIG5ld09yZGVyKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgaWQ6ICdtbmIyLXNvcnQtZmluaXNoZWQnLFxyXG4gICAgICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICAgICAgbWVzc2FnZTogY29udGV4dC5hcGkudHJhbnNsYXRlKCdGaW5pc2hlZCBzb3J0aW5nJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgICAgICBkaXNwbGF5TVM6IDMwMDAsXHJcbiAgICAgICAgfSkpLmZpbmFsbHkoKCkgPT4gX0lTX1NPUlRJTkcgPSBmYWxzZSk7XHJcbiAgfSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCAoZ2FtZU1vZGUpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2Y/LmlkLCBtZXRhTWFuYWdlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcblxyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIChlbnRyeTogeyBmaWxlUGF0aDogc3RyaW5nLCBjYW5kaWRhdGVzOiBzdHJpbmdbXSB9KSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ10sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC5cclxuICAgICAgICAgIC8vICBUaGF0IHdheSwgdm9ydGV4IHdpbGwgY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0XHJcbiAgICAgICAgICAvLyAgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHRhcmdldCBkZXN0aW5hdGlvbiBmaWxlIGlmIGl0IGV4aXN0cy5cclxuICAgICAgICAgIC8vICB0aGlzIGlzIHRvIGNvbXBsZXRlbHkgYXZvaWQgYSBzY2VuYXJpbyB3aGVyZSB3ZSBtYXkgYXR0ZW1wdCB0b1xyXG4gICAgICAgICAgLy8gIGNvcHkgdGhlIHNhbWUgZmlsZSBvbnRvIGl0c2VsZi5cclxuICAgICAgICAgIHJldHVybiBmcy5yZW1vdmVBc3luYyh0YXJnZXRQYXRoKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19