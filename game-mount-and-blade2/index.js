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
    context['registerCollectionFeature']('mountandblade2_collection_data', (gameId, includedMods) => (0, collections_1.genCollectionsData)(context, gameId, includedMods), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Mount and Blade 2 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
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
    context.registerAction('generic-load-order-icons', 200, _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', () => __awaiter(this, void 0, void 0, function* () {
        if (_IS_SORTING) {
            return Promise.resolve();
        }
        _IS_SORTING = true;
        try {
            yield metaManager.updateDependencyMap();
            yield (0, subModCache_1.refreshCache)(context);
        }
        catch (err) {
            context.api.showErrorNotification('Failed to resolve submodule file data', err);
            _IS_SORTING = false;
            return;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUV0QyxnREFBd0I7QUFDeEIsb0RBQTRCO0FBQzVCLDJDQUFrRjtBQUNsRixpQ0FBdUU7QUFFdkUscUNBQTRHO0FBQzVHLDhFQUFzRDtBQUN0RCw2Q0FBMEM7QUFFMUMsOEVBQXNEO0FBQ3RELCtDQUFzRztBQUV0RywyREFBcUY7QUFDckYsc0ZBQThEO0FBRzlELE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7QUFDekcsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBRTdHLElBQUksUUFBUSxDQUFDO0FBRWIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQzNCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQztBQUUvQixNQUFNLGNBQWMsR0FBRyx1QkFBdUIsQ0FBQztBQU0vQyxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTO0lBQ3BFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFFL0MsU0FBUyxRQUFRO0lBQ2YsT0FBTyxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ1gsUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDNUIs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QUFDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsb0NBQW9DLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQ2xGO1lBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcm9taXNlIGFzIEJsdWViaXJkIH0gZnJvbSAnYmx1ZWJpcmQnO1xyXG5cclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgRmxleExheW91dCwgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBnZXRFbGVtZW50VmFsdWUsIHJlZnJlc2hHYW1lUGFyYW1zLCB3YWxrQXN5bmMgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgQkFOTkVSTE9SRF9FWEVDLCBHQU1FX0lELCBMT0NLRURfTU9EVUxFUywgTU9EVUxFUywgT0ZGSUNJQUxfTU9EVUxFUywgU1VCTU9EX0ZJTEUgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBDdXN0b21JdGVtUmVuZGVyZXIgZnJvbSAnLi9jdXN0b21JdGVtUmVuZGVyZXInO1xyXG5pbXBvcnQgeyBtaWdyYXRlMDI2IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCBDb21NZXRhZGF0YU1hbmFnZXIgZnJvbSAnLi9Db21NZXRhZGF0YU1hbmFnZXInO1xyXG5pbXBvcnQgeyBnZXRDYWNoZSwgZ2V0TGF1bmNoZXJEYXRhLCBpc0ludmFsaWQsIHBhcnNlTGF1bmNoZXJEYXRhLCByZWZyZXNoQ2FjaGUgfSBmcm9tICcuL3N1Yk1vZENhY2hlJztcclxuaW1wb3J0IHsgSVNvcnRQcm9wcywgSVN1Yk1vZENhY2hlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuaW1wb3J0IHsgSUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5cclxuY29uc3QgTEFVTkNIRVJfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XHJcbmNvbnN0IE1PRERJTkdfS0lUX0VYRUMgPSBwYXRoLmpvaW4oJ2JpbicsICdXaW42NF9TaGlwcGluZ193RWRpdG9yJywgJ1RhbGVXb3JsZHMuTW91bnRBbmRCbGFkZS5MYXVuY2hlci5leGUnKTtcclxuXHJcbmxldCBTVE9SRV9JRDtcclxuXHJcbmNvbnN0IFNURUFNQVBQX0lEID0gMjYxNTUwO1xyXG5jb25zdCBFUElDQVBQX0lEID0gJ0NoaWNrYWRlZSc7XHJcblxyXG5jb25zdCBJMThOX05BTUVTUEFDRSA9ICdnYW1lLW1vdW50LWFuZC1ibGFkZTInO1xyXG5cclxuLy8gQSBzZXQgb2YgZm9sZGVyIG5hbWVzIChsb3dlcmNhc2VkKSB3aGljaCBhcmUgYXZhaWxhYmxlIGFsb25nc2lkZSB0aGVcclxuLy8gIGdhbWUncyBtb2R1bGVzIGZvbGRlci4gV2UgY291bGQndmUgdXNlZCB0aGUgZm9tb2QgaW5zdGFsbGVyIHN0b3AgcGF0dGVybnNcclxuLy8gIGZ1bmN0aW9uYWxpdHkgZm9yIHRoaXMsIGJ1dCBpdCdzIGJldHRlciBpZiB0aGlzIGV4dGVuc2lvbiBpcyBzZWxmIGNvbnRhaW5lZDtcclxuLy8gIGVzcGVjaWFsbHkgZ2l2ZW4gdGhhdCB0aGUgZ2FtZSdzIG1vZGRpbmcgcGF0dGVybiBjaGFuZ2VzIHF1aXRlIG9mdGVuLlxyXG5jb25zdCBST09UX0ZPTERFUlMgPSBuZXcgU2V0KFsnYmluJywgJ2RhdGEnLCAnZ3VpJywgJ2ljb25zJywgJ21vZHVsZXMnLFxyXG4gICdtdXNpYycsICdzaGFkZXJzJywgJ3NvdW5kcycsICd4bWxzY2hlbWFzJ10pO1xyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtFUElDQVBQX0lELCBTVEVBTUFQUF9JRC50b1N0cmluZygpXSlcclxuICAgIC50aGVuKGdhbWUgPT4ge1xyXG4gICAgICBTVE9SRV9JRCA9IGdhbWUuZ2FtZVN0b3JlSWQ7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZ2FtZS5nYW1lUGF0aCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RNb2QoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBEaWZmZXJlbnQgZ2FtZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IG1vZHNGaWxlID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpICE9PSAtMSk7XHJcbiAgaWYgKG1vZHNGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFRoZXJlJ3Mgbm8gTW9kdWxlcyBmb2xkZXIuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpZHggPSBtb2RzRmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IHJvb3RGb2xkZXJNYXRjaGVzID0gbG93ZXJlZC5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuICgoKHNlZ21lbnRzLmxlbmd0aCAtIDEpID4gaWR4KSAmJiBST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pKTtcclxuICB9KSB8fCBbXTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogKHJvb3RGb2xkZXJNYXRjaGVzLmxlbmd0aCA+IDApLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IG1vZHVsZUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKSAhPT0gLTEpO1xyXG4gIGNvbnN0IGlkeCA9IG1vZHVsZUZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUyk7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgY29uc3QgbGFzdEVsZW1lbnRJZHggPSBzZWdtZW50cy5sZW5ndGggLSAxO1xyXG5cclxuICAgIC8vIElnbm9yZSBkaXJlY3RvcmllcyBhbmQgZW5zdXJlIHRoYXQgdGhlIGZpbGUgY29udGFpbnMgYSBrbm93biByb290IGZvbGRlciBhdFxyXG4gICAgLy8gIHRoZSBleHBlY3RlZCBpbmRleC5cclxuICAgIHJldHVybiAoUk9PVF9GT0xERVJTLmhhcyhzZWdtZW50c1tpZHhdKVxyXG4gICAgICAmJiAocGF0aC5leHRuYW1lKHNlZ21lbnRzW2xhc3RFbGVtZW50SWR4XSkgIT09ICcnKSk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLm1hcChmaWxlID0+IHtcclxuICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gZmlsZS5zcGxpdChwYXRoLnNlcClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zbGljZShpZHgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuam9pbihwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb24sXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Rm9yU3VibW9kdWxlcyhmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gQ2hlY2sgdGhpcyBpcyBhIG1vZCBmb3IgQmFubmVybG9yZCBhbmQgaXQgY29udGFpbnMgYSBTdWJNb2R1bGUueG1sXHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSkgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTdWJNb2R1bGVzKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBSZW1vdmUgZGlyZWN0b3JpZXMgc3RyYWlnaHQgYXdheS5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4gcGF0aC5leHRuYW1lKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdKSAhPT0gJyc7XHJcbiAgfSk7XHJcbiAgY29uc3Qgc3ViTW9kSWRzID0gW107XHJcbiAgY29uc3Qgc3ViTW9kcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2Uoc3ViTW9kcywgYXN5bmMgKGFjY3VtLCBtb2RGaWxlOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gbW9kRmlsZS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICBjb25zdCBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtb2RGaWxlKSwgJ0lkJyk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gKHNlZ21lbnRzLmxlbmd0aCA+IDEpXHJcbiAgICAgID8gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMl1cclxuICAgICAgOiBzdWJNb2RJZDtcclxuXHJcbiAgICBzdWJNb2RJZHMucHVzaChzdWJNb2RJZCk7XHJcbiAgICBjb25zdCBpZHggPSBtb2RGaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihTVUJNT0RfRklMRSk7XHJcbiAgICAvLyBGaWx0ZXIgdGhlIG1vZCBmaWxlcyBmb3IgdGhpcyBzcGVjaWZpYyBzdWJtb2R1bGUuXHJcbiAgICBjb25zdCBzdWJNb2RGaWxlczogc3RyaW5nW11cclxuICAgICAgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBmaWxlLnNsaWNlKDAsIGlkeCkgPT09IG1vZEZpbGUuc2xpY2UoMCwgaWR4KSk7XHJcbiAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBzdWJNb2RGaWxlcy5tYXAoKG1vZEZpbGU6IHN0cmluZykgPT4gKHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IG1vZEZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oTU9EVUxFUywgbW9kTmFtZSwgbW9kRmlsZS5zbGljZShpZHgpKSxcclxuICAgIH0pKTtcclxuICAgIHJldHVybiBhY2N1bS5jb25jYXQoaW5zdHJ1Y3Rpb25zKTtcclxuICB9LCBbXSlcclxuICAudGhlbihtZXJnZWQgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWRzQXR0ciA9IHtcclxuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgIGtleTogJ3N1Yk1vZElkcycsXHJcbiAgICAgIHZhbHVlOiBzdWJNb2RJZHMsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9uczogW10uY29uY2F0KG1lcmdlZCwgW3N1Yk1vZElkc0F0dHJdKSB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZW5zdXJlT2ZmaWNpYWxMYXVuY2hlcihjb250ZXh0LCBkaXNjb3ZlcnkpIHtcclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLmFkZERpc2NvdmVyZWRUb29sKEdBTUVfSUQsICdUYWxlV29ybGRzQmFubmVybG9yZExhdW5jaGVyJywge1xyXG4gICAgaWQ6ICdUYWxlV29ybGRzQmFubmVybG9yZExhdW5jaGVyJyxcclxuICAgIG5hbWU6ICdPZmZpY2lhbCBMYXVuY2hlcicsXHJcbiAgICBsb2dvOiAndHdsYXVuY2hlci5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gcGF0aC5iYXNlbmFtZShMQVVOQ0hFUl9FWEVDKSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgcGF0aC5iYXNlbmFtZShMQVVOQ0hFUl9FWEVDKSxcclxuICAgIF0sXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIExBVU5DSEVSX0VYRUMpLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JyksXHJcbiAgICBoaWRkZW46IGZhbHNlLFxyXG4gICAgY3VzdG9tOiBmYWxzZSxcclxuICB9LCBmYWxzZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRNb2RkaW5nVG9vbChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWRkZW4/OiBib29sZWFuKSB7XHJcbiAgY29uc3QgdG9vbElkID0gJ2Jhbm5lcmxvcmQtc2RrJztcclxuICBjb25zdCBleGVjID0gcGF0aC5iYXNlbmFtZShNT0RESU5HX0tJVF9FWEVDKTtcclxuICBjb25zdCB0b29sID0ge1xyXG4gICAgaWQ6IHRvb2xJZCxcclxuICAgIG5hbWU6ICdNb2RkaW5nIEtpdCcsXHJcbiAgICBsb2dvOiAndHdsYXVuY2hlci5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gZXhlYyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFsgZXhlYyBdLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RESU5HX0tJVF9FWEVDKSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhjbHVzaXZlOiB0cnVlLFxyXG4gICAgd29ya2luZ0RpcmVjdG9yeTogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBwYXRoLmRpcm5hbWUoTU9ERElOR19LSVRfRVhFQykpLFxyXG4gICAgaGlkZGVuLFxyXG4gICAgY3VzdG9tOiBmYWxzZSxcclxuICB9O1xyXG5cclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLmFkZERpc2NvdmVyZWRUb29sKEdBTUVfSUQsIHRvb2xJZCwgdG9vbCwgZmFsc2UpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5LCBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XHJcbiAgLy8gUXVpY2tseSBlbnN1cmUgdGhhdCB0aGUgb2ZmaWNpYWwgTGF1bmNoZXIgaXMgYWRkZWQuXHJcbiAgZW5zdXJlT2ZmaWNpYWxMYXVuY2hlcihjb250ZXh0LCBkaXNjb3ZlcnkpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RESU5HX0tJVF9FWEVDKSk7XHJcbiAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgdG9vbHMgPSBkaXNjb3Zlcnk/LnRvb2xzO1xyXG4gICAgaWYgKCh0b29scyAhPT0gdW5kZWZpbmVkKVxyXG4gICAgJiYgKHV0aWwuZ2V0U2FmZSh0b29scywgWydiYW5uZXJsb3JkLXNkayddLCB1bmRlZmluZWQpICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIHNldE1vZGRpbmdUb29sKGNvbnRleHQsIGRpc2NvdmVyeSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBJZiBnYW1lIHN0b3JlIG5vdCBmb3VuZCwgbG9jYXRpb24gbWF5IGJlIHNldCBtYW51YWxseSAtIGFsbG93IHNldHVwXHJcbiAgLy8gIGZ1bmN0aW9uIHRvIGNvbnRpbnVlLlxyXG4gIGNvbnN0IGZpbmRTdG9yZUlkID0gKCkgPT4gZmluZEdhbWUoKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGNvbnN0IHN0YXJ0U3RlYW0gPSAoKSA9PiBmaW5kU3RvcmVJZCgpXHJcbiAgICAudGhlbigoKSA9PiAoU1RPUkVfSUQgPT09ICdzdGVhbScpXHJcbiAgICAgID8gdXRpbC5HYW1lU3RvcmVIZWxwZXIubGF1bmNoR2FtZVN0b3JlKGNvbnRleHQuYXBpLCBTVE9SRV9JRCwgdW5kZWZpbmVkLCB0cnVlKVxyXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSgpKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgd2UndmUgYWxyZWFkeSBzZXQgdGhlIGxvYWQgb3JkZXIgb2JqZWN0IGZvciB0aGlzIHByb2ZpbGVcclxuICAvLyAgYW5kIGNyZWF0ZSBpdCBpZiB3ZSBoYXZlbid0LlxyXG4gIHJldHVybiBzdGFydFN0ZWFtKCkudGhlbigoKSA9PiBwYXJzZUxhdW5jaGVyRGF0YSgpKS50aGVuKGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSdyZSBnb2luZyB0byBkbyBhIHF1aWNrIHRTb3J0IGF0IHRoaXMgcG9pbnQgLSBub3QgZ29pbmcgdG9cclxuICAgIC8vICBjaGFuZ2UgdGhlIHVzZXIncyBsb2FkIG9yZGVyLCBidXQgdGhpcyB3aWxsIGhpZ2hsaWdodCBhbnlcclxuICAgIC8vICBjeWNsaWMgb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICBjb25zdCBzb3J0ZWQgPSB0U29ydCh7IHN1Yk1vZElkczogbW9kSWRzLCBhbGxvd0xvY2tlZDogdHJ1ZSwgbWV0YU1hbmFnZXIgfSk7XHJcbiAgfSlcclxuICAuY2F0Y2goZXJyID0+IHtcclxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLk5vdEZvdW5kKSB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGZpbmQgZ2FtZSBsYXVuY2hlciBkYXRhJyxcclxuICAgICAgICAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIHRocm91Z2ggdGhlIG9mZmljaWFsIGdhbWUgbGF1bmNoZXIgYW5kICdcclxuICAgICAgKyAndHJ5IGFnYWluJywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxyXG4gICAgICAgIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfSlcclxuICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBWYWxpZCB1c2UgY2FzZSB3aGVuIGF0dGVtcHRpbmcgdG8gc3dpdGNoIHRvXHJcbiAgICAgIC8vICBCYW5uZXJsb3JkIHdpdGhvdXQgYW55IGFjdGl2ZSBwcm9maWxlLlxyXG4gICAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwge30pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0U29ydChzb3J0UHJvcHM6IElTb3J0UHJvcHMsIHRlc3Q6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gIGNvbnN0IHsgc3ViTW9kSWRzLCBhbGxvd0xvY2tlZCwgbG9hZE9yZGVyLCBtZXRhTWFuYWdlciB9ID0gc29ydFByb3BzO1xyXG4gIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAvLyBUb3BvbG9naWNhbCBzb3J0IC0gd2UgbmVlZCB0bzpcclxuICAvLyAgLSBJZGVudGlmeSBjeWNsaWMgZGVwZW5kZW5jaWVzLlxyXG4gIC8vICAtIElkZW50aWZ5IG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gIC8vICAtIFdlIHdpbGwgdHJ5IHRvIGlkZW50aWZ5IGluY29tcGF0aWJsZSBkZXBlbmRlbmNpZXMgKHZlcnNpb24td2lzZSlcclxuXHJcbiAgLy8gVGhlc2UgYXJlIG1hbnVhbGx5IGxvY2tlZCBtb2QgZW50cmllcy5cclxuICBjb25zdCBsb2NrZWRTdWJNb2RzID0gKCEhbG9hZE9yZGVyKVxyXG4gICAgPyBzdWJNb2RJZHMuZmlsdGVyKHN1Yk1vZElkID0+IHtcclxuICAgICAgY29uc3QgZW50cnkgPSBDQUNIRVtzdWJNb2RJZF07XHJcbiAgICAgIHJldHVybiAoISFlbnRyeSlcclxuICAgICAgICA/ICEhbG9hZE9yZGVyW2VudHJ5LnZvcnRleElkXT8ubG9ja2VkXHJcbiAgICAgICAgOiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICA6IFtdO1xyXG4gIGNvbnN0IGFscGhhYmV0aWNhbCA9IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kID0+ICFsb2NrZWRTdWJNb2RzLmluY2x1ZGVzKHN1Yk1vZCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKTtcclxuICBjb25zdCBncmFwaCA9IGFscGhhYmV0aWNhbC5yZWR1Y2UoKGFjY3VtLCBlbnRyeSkgPT4ge1xyXG4gICAgY29uc3QgZGVwSWRzID0gWy4uLkNBQ0hFW2VudHJ5XS5kZXBlbmRlbmNpZXNdLm1hcChkZXAgPT4gZGVwLmRlcElkKTtcclxuICAgIC8vIENyZWF0ZSB0aGUgbm9kZSBncmFwaC5cclxuICAgIGFjY3VtW2VudHJ5XSA9IGRlcElkcy5zb3J0KCk7XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG5cclxuICAvLyBXaWxsIHN0b3JlIHRoZSBmaW5hbCBMTyByZXN1bHRcclxuICBjb25zdCByZXN1bHQgPSBbXTtcclxuXHJcbiAgLy8gVGhlIG5vZGVzIHdlIGhhdmUgdmlzaXRlZC9wcm9jZXNzZWQuXHJcbiAgY29uc3QgdmlzaXRlZCA9IFtdO1xyXG5cclxuICAvLyBUaGUgbm9kZXMgd2hpY2ggYXJlIHN0aWxsIHByb2Nlc3NpbmcuXHJcbiAgY29uc3QgcHJvY2Vzc2luZyA9IFtdO1xyXG5cclxuICBjb25zdCB0b3BTb3J0ID0gKG5vZGUpID0+IHtcclxuICAgIHByb2Nlc3Npbmdbbm9kZV0gPSB0cnVlO1xyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gKCEhYWxsb3dMb2NrZWQpXHJcbiAgICAgID8gZ3JhcGhbbm9kZV1cclxuICAgICAgOiBncmFwaFtub2RlXS5maWx0ZXIoZWxlbWVudCA9PiAhTE9DS0VEX01PRFVMRVMuaGFzKGVsZW1lbnQpKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgaWYgKHByb2Nlc3NpbmdbZGVwXSkge1xyXG4gICAgICAgIC8vIEN5Y2xpYyBkZXBlbmRlbmN5IGRldGVjdGVkIC0gaGlnaGxpZ2h0IGJvdGggbW9kcyBhcyBpbnZhbGlkXHJcbiAgICAgICAgLy8gIHdpdGhpbiB0aGUgY2FjaGUgaXRzZWxmIC0gd2UgYWxzbyBuZWVkIHRvIGhpZ2hsaWdodCB3aGljaCBtb2RzLlxyXG4gICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQuY3ljbGljLnB1c2goZGVwKTtcclxuICAgICAgICBDQUNIRVtkZXBdLmludmFsaWQuY3ljbGljLnB1c2gobm9kZSk7XHJcblxyXG4gICAgICAgIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xyXG4gICAgICAgIHByb2Nlc3Npbmdbbm9kZV0gPSBmYWxzZTtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgaW5jb21wYXRpYmxlRGVwcyA9IENBQ0hFW25vZGVdLmludmFsaWQuaW5jb21wYXRpYmxlRGVwcztcclxuICAgICAgY29uc3QgaW5jRGVwID0gaW5jb21wYXRpYmxlRGVwcy5maW5kKGQgPT4gZC5kZXBJZCA9PT0gZGVwKTtcclxuICAgICAgaWYgKE9iamVjdC5rZXlzKGdyYXBoKS5pbmNsdWRlcyhkZXApICYmIChpbmNEZXAgPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICBjb25zdCBkZXBWZXIgPSBDQUNIRVtkZXBdLnN1Yk1vZFZlcjtcclxuICAgICAgICBjb25zdCBkZXBJbnN0ID0gQ0FDSEVbbm9kZV0uZGVwZW5kZW5jaWVzLmZpbmQoZCA9PiBkLmRlcElkID09PSBkZXApO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHNlbXZlci5zYXRpc2ZpZXMoZGVwSW5zdC5kZXBWZXJzaW9uLCBkZXBWZXIpO1xyXG4gICAgICAgICAgaWYgKCFtYXRjaCAmJiAhIWRlcEluc3Q/LmRlcFZlcnNpb24gJiYgISFkZXBWZXIpIHtcclxuICAgICAgICAgICAgQ0FDSEVbbm9kZV0uaW52YWxpZC5pbmNvbXBhdGlibGVEZXBzLnB1c2goe1xyXG4gICAgICAgICAgICAgIGRlcElkOiBkZXAsXHJcbiAgICAgICAgICAgICAgcmVxdWlyZWRWZXJzaW9uOiBkZXBJbnN0LmRlcFZlcnNpb24sXHJcbiAgICAgICAgICAgICAgY3VycmVudFZlcnNpb246IGRlcFZlcixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAvLyBPayBzbyB3ZSBkaWRuJ3QgbWFuYWdlIHRvIGNvbXBhcmUgdGhlIHZlcnNpb25zLCB3ZSBsb2cgdGhpcyBhbmRcclxuICAgICAgICAgIC8vICBjb250aW51ZS5cclxuICAgICAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIGNvbXBhcmUgdmVyc2lvbnMnLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCF2aXNpdGVkW2RlcF0gJiYgIWxvY2tlZFN1Yk1vZHMuaW5jbHVkZXMoZGVwKSkge1xyXG4gICAgICAgIGlmICghT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKGRlcCkpIHtcclxuICAgICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQubWlzc2luZy5wdXNoKGRlcCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRvcFNvcnQoZGVwKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzaW5nW25vZGVdID0gZmFsc2U7XHJcbiAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoIWlzSW52YWxpZChub2RlKSkge1xyXG4gICAgICByZXN1bHQucHVzaChub2RlKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBmb3IgKGNvbnN0IG5vZGUgaW4gZ3JhcGgpIHtcclxuICAgIGlmICghdmlzaXRlZFtub2RlXSAmJiAhcHJvY2Vzc2luZ1tub2RlXSkge1xyXG4gICAgICB0b3BTb3J0KG5vZGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKGFsbG93TG9ja2VkKSB7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLy8gUHJvcGVyIHRvcG9sb2dpY2FsIHNvcnQgZGljdGF0ZXMgd2Ugc2ltcGx5IHJldHVybiB0aGVcclxuICAvLyAgcmVzdWx0IGF0IHRoaXMgcG9pbnQuIEJ1dCwgbW9kIGF1dGhvcnMgd2FudCBtb2R1bGVzXHJcbiAgLy8gIHdpdGggbm8gZGVwZW5kZW5jaWVzIHRvIGJ1YmJsZSB1cCB0byB0aGUgdG9wIG9mIHRoZSBMTy5cclxuICAvLyAgKFRoaXMgd2lsbCBvbmx5IGFwcGx5IHRvIG5vbiBsb2NrZWQgZW50cmllcylcclxuICBjb25zdCBzdWJNb2RzV2l0aE5vRGVwcyA9IHJlc3VsdC5maWx0ZXIoZGVwID0+IChncmFwaFtkZXBdLmxlbmd0aCA9PT0gMClcclxuICAgIHx8IChncmFwaFtkZXBdLmZpbmQoZCA9PiAhTE9DS0VEX01PRFVMRVMuaGFzKGQpKSA9PT0gdW5kZWZpbmVkKSkuc29ydCgpIHx8IFtdO1xyXG4gIGNvbnN0IHRhbXBlcmVkUmVzdWx0ID0gW10uY29uY2F0KHN1Yk1vZHNXaXRoTm9EZXBzLFxyXG4gICAgcmVzdWx0LmZpbHRlcihlbnRyeSA9PiAhc3ViTW9kc1dpdGhOb0RlcHMuaW5jbHVkZXMoZW50cnkpKSk7XHJcbiAgbG9ja2VkU3ViTW9kcy5mb3JFYWNoKHN1Yk1vZElkID0+IHtcclxuICAgIGNvbnN0IHBvcyA9IGxvYWRPcmRlcltDQUNIRVtzdWJNb2RJZF0udm9ydGV4SWRdLnBvcztcclxuICAgIHRhbXBlcmVkUmVzdWx0LnNwbGljZShwb3MsIDAsIFtzdWJNb2RJZF0pO1xyXG4gIH0pO1xyXG5cclxuICBpZiAodGVzdCA9PT0gdHJ1ZSkge1xyXG4gICAgY29uc3QgbWV0YVNvcnRlZCA9IG1ldGFNYW5hZ2VyLnNvcnQodGFtcGVyZWRSZXN1bHQpO1xyXG4gICAgcmV0dXJuIG1ldGFTb3J0ZWQ7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiB0YW1wZXJlZFJlc3VsdDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRXh0ZXJuYWwoY29udGV4dCwgc3ViTW9kSWQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gIG1vZElkcy5mb3JFYWNoKG1vZElkID0+IHtcclxuICAgIGNvbnN0IHN1Yk1vZElkcyA9IHV0aWwuZ2V0U2FmZShtb2RzW21vZElkXSwgWydhdHRyaWJ1dGVzJywgJ3N1Yk1vZElkcyddLCBbXSk7XHJcbiAgICBpZiAoc3ViTW9kSWRzLmluY2x1ZGVzKHN1Yk1vZElkKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmxldCByZWZyZXNoRnVuYztcclxuYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmICgoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBkZXBsb3lQcm9maWxlPy5nYW1lSWQpIHx8IChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpKSB7XHJcbiAgICAvLyBEZXBsb3ltZW50IGV2ZW50IHNlZW1zIHRvIGJlIGV4ZWN1dGVkIGZvciBhIHByb2ZpbGUgb3RoZXJcclxuICAgIC8vICB0aGFuIHRoZSBjdXJyZW50bHkgYWN0aXZlIG9uZS4gTm90IGdvaW5nIHRvIGNvbnRpbnVlLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgbWV0YU1hbmFnZXIudXBkYXRlRGVwZW5kZW5jeU1hcChwcm9maWxlSWQpO1xyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcmVmcmVzaENhY2hlKGNvbnRleHQpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgLy8gUHJvY2Vzc0NhbmNlbGVkIG1lYW5zIHRoYXQgd2Ugd2VyZSB1bmFibGUgdG8gc2NhbiBmb3IgZGVwbG95ZWRcclxuICAgIC8vICBzdWJNb2R1bGVzLCBwcm9iYWJseSBiZWNhdXNlIGdhbWUgZGlzY292ZXJ5IGlzIGluY29tcGxldGUuXHJcbiAgICAvLyBJdCdzIGJleW9uZCB0aGUgc2NvcGUgb2YgdGhpcyBmdW5jdGlvbiB0byByZXBvcnQgZGlzY292ZXJ5XHJcbiAgICAvLyAgcmVsYXRlZCBpc3N1ZXMuXHJcbiAgICByZXR1cm4gKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIHt9KTtcclxuXHJcbiAgLy8gV2UncmUgZ29pbmcgdG8gZG8gYSBxdWljayB0U29ydCBhdCB0aGlzIHBvaW50IC0gbm90IGdvaW5nIHRvXHJcbiAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxyXG4gIC8vICBjeWNsaWMgb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBjb25zdCBzb3J0UHJvcHM6IElTb3J0UHJvcHMgPSB7XHJcbiAgICBzdWJNb2RJZHM6IG1vZElkcyxcclxuICAgIGFsbG93TG9ja2VkOiB0cnVlLFxyXG4gICAgbG9hZE9yZGVyLFxyXG4gICAgbWV0YU1hbmFnZXIsXHJcbiAgfTtcclxuICBjb25zdCBzb3J0ZWQgPSB0U29ydChzb3J0UHJvcHMpO1xyXG5cclxuICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmVmcmVzaEZ1bmMoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIG1ldGFNYW5hZ2VyKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gUmFjZSBjb25kaXRpb24gP1xyXG4gICAgcmV0dXJuIGl0ZW1zO1xyXG4gIH1cclxuXHJcbiAgbGV0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBpZiAoaXRlbXMubGVuZ3RoID4gMCAmJiBtb2RJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBDYWNoZSBoYXNuJ3QgYmVlbiBwb3B1bGF0ZWQgeWV0LlxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gUmVmcmVzaCB0aGUgY2FjaGUuXHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgYWN0aXZlUHJvZmlsZS5pZCwgbWV0YU1hbmFnZXIpO1xyXG4gICAgICBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBMb2NrZWQgaWRzIGFyZSBhbHdheXMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdCBhcyBhbGxcclxuICAvLyAgb3RoZXIgbW9kdWxlcyBkZXBlbmQgb24gdGhlc2UuXHJcbiAgbGV0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIFNvcnQgdGhlIGxvY2tlZCBpZHMgYW1vbmdzdCB0aGVtc2VsdmVzIHRvIGVuc3VyZVxyXG4gICAgLy8gIHRoYXQgdGhlIGdhbWUgcmVjZWl2ZXMgdGhlc2UgaW4gdGhlIHJpZ2h0IG9yZGVyLlxyXG4gICAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xyXG4gICAgICBzdWJNb2RJZHM6IGxvY2tlZElkcyxcclxuICAgICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICAgIG1ldGFNYW5hZ2VyLFxyXG4gICAgfTtcclxuICAgIGxvY2tlZElkcyA9IHRTb3J0KHNvcnRQcm9wcyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgbG9ja2VkIGVudHJpZXMuXHJcbiAgY29uc3QgbG9ja2VkSXRlbXMgPSBsb2NrZWRJZHMubWFwKGlkID0+ICh7XHJcbiAgICBpZDogQ0FDSEVbaWRdLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVbaWRdLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGlkKSxcclxuICB9KSk7XHJcblxyXG4gIGNvbnN0IExBVU5DSEVSX0RBVEEgPSBnZXRMYXVuY2hlckRhdGEoKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgaWRzIHdpbGwgaW5jbHVkZSBvZmZpY2lhbCBtb2R1bGVzIGFzIHdlbGwgYnV0IG5vdCBsb2NrZWQgZW50cmllcy5cclxuICBjb25zdCBleHRlcm5hbElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gKCFDQUNIRVtpZF0uaXNMb2NrZWQpICYmIChDQUNIRVtpZF0udm9ydGV4SWQgPT09IGlkKSk7XHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBMT2tleXMgPSAoKE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoID4gMClcclxuICAgID8gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgOiBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMubWFwKG1vZCA9PiBtb2Quc3ViTW9kSWQpKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgbW9kdWxlcyB0aGF0IGFyZSBhbHJlYWR5IGluIHRoZSBsb2FkIG9yZGVyLlxyXG4gIGNvbnN0IGtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+IExPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xyXG5cclxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHdoaWNoIGFyZSBuZXcgYW5kIGhhdmUgeWV0IHRvIGJlIGFkZGVkIHRvIHRoZSBMTy5cclxuICBjb25zdCB1bmtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+ICFMT2tleXMuaW5jbHVkZXMoaWQpKSB8fCBbXTtcclxuXHJcbiAgaXRlbXMgPSBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAvLyBSZW1vdmUgYW55IGxvY2tlZElkcywgYnV0IGFsc28gZW5zdXJlIHRoYXQgdGhlXHJcbiAgICAvLyAgZW50cnkgY2FuIGJlIGZvdW5kIGluIHRoZSBjYWNoZS4gSWYgaXQncyBub3QgaW4gdGhlXHJcbiAgICAvLyAgY2FjaGUsIHRoaXMgbWF5IG1lYW4gdGhhdCB0aGUgc3VibW9kIHhtbCBmaWxlIGZhaWxlZFxyXG4gICAgLy8gIHBhcnNlLWluZyBhbmQgdGhlcmVmb3JlIHNob3VsZCBub3QgYmUgZGlzcGxheWVkLlxyXG4gICAgY29uc3QgaXNMb2NrZWQgPSBsb2NrZWRJZHMuaW5jbHVkZXMoaXRlbS5pZCk7XHJcbiAgICBjb25zdCBoYXNDYWNoZUVudHJ5ID0gT2JqZWN0LmtleXMoQ0FDSEUpLmZpbmQoa2V5ID0+XHJcbiAgICAgIENBQ0hFW2tleV0udm9ydGV4SWQgPT09IGl0ZW0uaWQpICE9PSB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gIWlzTG9ja2VkICYmIGhhc0NhY2hlRW50cnk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHBvc01hcCA9IHt9O1xyXG4gIGxldCBuZXh0QXZhaWxhYmxlID0gTE9rZXlzLmxlbmd0aDtcclxuICBjb25zdCBnZXROZXh0UG9zID0gKGxvSWQpID0+IHtcclxuICAgIGlmIChMT0NLRURfTU9EVUxFUy5oYXMobG9JZCkpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmluZGV4T2YobG9JZCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHBvc01hcFtsb0lkXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHBvc01hcFtsb0lkXSA9IG5leHRBdmFpbGFibGU7XHJcbiAgICAgIHJldHVybiBuZXh0QXZhaWxhYmxlKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcG9zTWFwW2xvSWRdO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGtub3duRXh0Lm1hcChrZXkgPT4gKHtcclxuICAgIGlkOiBDQUNIRVtrZXldLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxyXG4gICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGNvbnRleHQsIENBQ0hFW2tleV0udm9ydGV4SWQpLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXHJcbiAgfSkpXHJcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1heC1saW5lLWxlbmd0aFxyXG4gICAgLnNvcnQoKGEsIGIpID0+IChsb2FkT3JkZXJbYS5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGEuaWQpKSAtIChsb2FkT3JkZXJbYi5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGIuaWQpKSlcclxuICAgIC5mb3JFYWNoKGtub3duID0+IHtcclxuICAgICAgLy8gSWYgdGhpcyBhIGtub3duIGV4dGVybmFsIG1vZHVsZSBhbmQgaXMgTk9UIGluIHRoZSBpdGVtIGxpc3QgYWxyZWFkeVxyXG4gICAgICAvLyAgd2UgbmVlZCB0byByZS1pbnNlcnQgaW4gdGhlIGNvcnJlY3QgaW5kZXggYXMgYWxsIGtub3duIGV4dGVybmFsIG1vZHVsZXNcclxuICAgICAgLy8gIGF0IHRoaXMgcG9pbnQgYXJlIGFjdHVhbGx5IGRlcGxveWVkIGluc2lkZSB0aGUgbW9kcyBmb2xkZXIgYW5kIHNob3VsZFxyXG4gICAgICAvLyAgYmUgaW4gdGhlIGl0ZW1zIGxpc3QhXHJcbiAgICAgIGNvbnN0IGRpZmYgPSAoTE9rZXlzLmxlbmd0aCkgLSAoTE9rZXlzLmxlbmd0aCAtIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmxlbmd0aCk7XHJcbiAgICAgIGlmIChpdGVtcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga25vd24uaWQpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb25zdCBwb3MgPSBsb2FkT3JkZXJba25vd24uaWRdPy5wb3M7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gKHBvcyAhPT0gdW5kZWZpbmVkKSA/IChwb3MgLSBkaWZmKSA6IChnZXROZXh0UG9zKGtub3duLmlkKSAtIGRpZmYpO1xyXG4gICAgICAgIGl0ZW1zLnNwbGljZShpZHgsIDAsIGtub3duKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHVua25vd25JdGVtcyA9IFtdLmNvbmNhdCh1bmtub3duRXh0KVxyXG4gICAgLm1hcChrZXkgPT4gKHtcclxuICAgICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXHJcbiAgICAgIG5hbWU6IENBQ0hFW2tleV0uc3ViTW9kTmFtZSxcclxuICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXHJcbiAgICAgIG9mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhrZXkpLFxyXG4gICAgfSkpO1xyXG5cclxuICBjb25zdCBwcmVTb3J0ZWQgPSBbXS5jb25jYXQobG9ja2VkSXRlbXMsIGl0ZW1zLCB1bmtub3duSXRlbXMpO1xyXG4gIHJldHVybiAoZGlyZWN0aW9uID09PSAnZGVzY2VuZGluZycpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQucmV2ZXJzZSgpKVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcykge1xyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdsb2Fkb3JkZXJpbmZvJyB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSwgdCgnTWFuYWdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1lvdSBjYW4gYWRqdXN0IHRoZSBsb2FkIG9yZGVyIGZvciBCYW5uZXJsb3JkIGJ5IGRyYWdnaW5nIGFuZCBkcm9wcGluZyBtb2RzIHVwIG9yIGRvd24gb24gdGhpcyBwYWdlLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBrZWVwIGluIG1pbmQgdGhhdCBCYW5uZXJsb3JkIGlzIHN0aWxsIGluIEVhcmx5IEFjY2Vzcywgd2hpY2ggbWVhbnMgdGhhdCB0aGVyZSBtaWdodCBiZSBzaWduaWZpY2FudCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2NoYW5nZXMgdG8gdGhlIGdhbWUgYXMgdGltZSBnb2VzIG9uLiBQbGVhc2Ugbm90aWZ5IHVzIG9mIGFueSBWb3J0ZXggcmVsYXRlZCBpc3N1ZXMgeW91IGVuY291bnRlciB3aXRoIHRoaXMgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdleHRlbnNpb24gc28gd2UgY2FuIGZpeCBpdC4gRm9yIG1vcmUgaW5mb3JtYXRpb24gYW5kIGhlbHAgc2VlOiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19CYW5uZXJsb3JkX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBCYW5uZXJsb3JkIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ0hvdyB0byB1c2U6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NoZWNrIHRoZSBib3ggbmV4dCB0byB0aGUgbW9kcyB5b3Ugd2FudCB0byBiZSBhY3RpdmUgaW4gdGhlIGdhbWUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NsaWNrIEF1dG8gU29ydCBpbiB0aGUgdG9vbGJhci4gKFNlZSBiZWxvdyBmb3IgZGV0YWlscykuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01ha2Ugc3VyZSB0byBydW4gdGhlIGdhbWUgZGlyZWN0bHkgdmlhIHRoZSBQbGF5IGJ1dHRvbiBpbiB0aGUgdG9wIGxlZnQgY29ybmVyICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcob24gdGhlIEJhbm5lcmxvcmQgdGlsZSkuIFlvdXIgVm9ydGV4IGxvYWQgb3JkZXIgbWF5IG5vdCBiZSBsb2FkZWQgaWYgeW91IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGdhbWUgbGF1bmNoZXIuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ09wdGlvbmFsOiBNYW51YWxseSBkcmFnIGFuZCBkcm9wIG1vZHMgdG8gZGlmZmVyZW50IHBvc2l0aW9ucyBpbiB0aGUgbG9hZCBvcmRlciAoZm9yIHRlc3RpbmcgZGlmZmVyZW50IG92ZXJyaWRlcykuIE1vZHMgZnVydGhlciBkb3duIHRoZSBsaXN0IG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1BsZWFzZSBub3RlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgbG9hZCBvcmRlciByZWZsZWN0ZWQgaGVyZSB3aWxsIG9ubHkgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIGdhbWUgdmlhIHRoZSBwbGF5IGJ1dHRvbiBpbiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAndGhlIHRvcCBsZWZ0IGNvcm5lci4gRG8gbm90IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGxhdW5jaGVyLCBhcyB0aGF0IHdpbGwgaWdub3JlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICd0aGUgVm9ydGV4IGxvYWQgb3JkZXIgYW5kIGdvIGJ5IHdoYXQgaXMgc2hvd24gaW4gdGhlIGxhdW5jaGVyIGluc3RlYWQuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0ZvciBCYW5uZXJsb3JkLCBtb2RzIHNvcnRlZCBmdXJ0aGVyIHRvd2FyZHMgdGhlIGJvdHRvbSBvZiB0aGUgbGlzdCB3aWxsIG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cCAoaWYgdGhleSBjb25mbGljdCkuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdOb3RlOiBIYXJtb255IHBhdGNoZXMgbWF5IGJlIHRoZSBleGNlcHRpb24gdG8gdGhpcyBydWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdBdXRvIFNvcnQgdXNlcyB0aGUgU3ViTW9kdWxlLnhtbCBmaWxlcyAodGhlIGVudHJpZXMgdW5kZXIgPERlcGVuZGVkTW9kdWxlcz4pIHRvIGRldGVjdCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnZGVwZW5kZW5jaWVzIHRvIHNvcnQgYnkuICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdJZiB5b3UgY2Fubm90IHNlZSB5b3VyIG1vZCBpbiB0aGlzIGxvYWQgb3JkZXIsIFZvcnRleCBtYXkgaGF2ZSBiZWVuIHVuYWJsZSB0byBmaW5kIG9yIHBhcnNlIGl0cyBTdWJNb2R1bGUueG1sIGZpbGUuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdNb3N0IC0gYnV0IG5vdCBhbGwgbW9kcyAtIGNvbWUgd2l0aCBvciBuZWVkIGEgU3ViTW9kdWxlLnhtbCBmaWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdIaXQgdGhlIGRlcGxveSBidXR0b24gd2hlbmV2ZXIgeW91IGluc3RhbGwgYW5kIGVuYWJsZSBhIG5ldyBtb2QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1RoZSBnYW1lIHdpbGwgbm90IGxhdW5jaCB1bmxlc3MgdGhlIGdhbWUgc3RvcmUgKFN0ZWFtLCBFcGljLCBldGMpIGlzIHN0YXJ0ZWQgYmVmb3JlaGFuZC4gSWYgeW91XFwncmUgZ2V0dGluZyB0aGUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1wiVW5hYmxlIHRvIEluaXRpYWxpemUgU3RlYW0gQVBJXCIgZXJyb3IsIHJlc3RhcnQgU3RlYW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1JpZ2h0IGNsaWNraW5nIGFuIGVudHJ5IHdpbGwgb3BlbiB0aGUgY29udGV4dCBtZW51IHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvY2sgTE8gZW50cmllcyBpbnRvIHBvc2l0aW9uOyBlbnRyeSB3aWxsICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdiZSBpZ25vcmVkIGJ5IGF1dG8tc29ydCBtYWludGFpbmluZyBpdHMgbG9ja2VkIHBvc2l0aW9uLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKTtcclxufVxyXG5cclxubGV0IF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnN0IG1ldGFNYW5hZ2VyID0gbmV3IENvbU1ldGFkYXRhTWFuYWdlcihjb250ZXh0LmFwaSk7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnTW91bnQgJiBCbGFkZSBJSTpcXHRCYW5uZXJsb3JkJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICcuJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBCQU5ORVJMT1JEX0VYRUMsXHJcbiAgICBzZXR1cDogKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5LCBtZXRhTWFuYWdlciksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgIEJBTk5FUkxPUkRfRVhFQyxcclxuICAgIF0sXHJcbiAgICBwYXJhbWV0ZXJzOiBbXSxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNQVBQX0lELnRvU3RyaW5nKCksXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiBTVEVBTUFQUF9JRCxcclxuICAgICAgZXBpY0FwcElkOiBFUElDQVBQX0lELFxyXG4gICAgICBjdXN0b21PcGVuTW9kc1BhdGg6IE1PRFVMRVMsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0WydyZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlJ10oXHJcbiAgICAnbW91bnRhbmRibGFkZTJfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSUNvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ01vdW50IGFuZCBCbGFkZSAyIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICAvLyBSZWdpc3RlciB0aGUgTE8gcGFnZS5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKTtcclxuICAgIH0sXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBwcmVTb3J0OiAoaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSkgPT5cclxuICAgICAgcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlciksXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcikgPT4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIGl0ZW1SZW5kZXJlcjogQ3VzdG9tSXRlbVJlbmRlcmVyLmRlZmF1bHQsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2Jhbm5lcmxvcmRyb290bW9kJywgMjAsIHRlc3RSb290TW9kLCBpbnN0YWxsUm9vdE1vZCk7XHJcblxyXG4gIC8vIEluc3RhbGxzIG9uZSBvciBtb3JlIHN1Ym1vZHVsZXMuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHN1Ym1vZHVsZXMnLCAyNSwgdGVzdEZvclN1Ym1vZHVsZXMsIGluc3RhbGxTdWJNb2R1bGVzKTtcclxuXHJcbiAgLy8gQSB2ZXJ5IHNpbXBsZSBtaWdyYXRpb24gdGhhdCBpbnRlbmRzIHRvIGFkZCB0aGUgc3ViTW9kSWRzIGF0dHJpYnV0ZVxyXG4gIC8vICB0byBtb2RzIHRoYXQgYWN0IGFzIFwibW9kIHBhY2tzXCIuIFRoaXMgbWlncmF0aW9uIGlzIG5vbi1pbnZhc2l2ZSBhbmQgd2lsbFxyXG4gIC8vICBub3QgcmVwb3J0IGFueSBlcnJvcnMuIFNpZGUgZWZmZWN0cyBvZiB0aGUgbWlncmF0aW9uIG5vdCB3b3JraW5nIGNvcnJlY3RseVxyXG4gIC8vICB3aWxsIG5vdCBhZmZlY3QgdGhlIHVzZXIncyBleGlzdGluZyBlbnZpcm9ubWVudC5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDI2KGNvbnRleHQuYXBpLCBvbGQpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZ2VuZXJpYy1sb2FkLW9yZGVyLWljb25zJywgMjAwLFxyXG4gICAgX0lTX1NPUlRJTkcgPyAnc3Bpbm5lcicgOiAnbG9vdC1zb3J0Jywge30sICdBdXRvIFNvcnQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmIChfSVNfU09SVElORykge1xyXG4gICAgICAgIC8vIEFscmVhZHkgc29ydGluZyAtIGRvbid0IGRvIGFueXRoaW5nLlxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgX0lTX1NPUlRJTkcgPSB0cnVlO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKCk7XHJcbiAgICAgICAgYXdhaXQgcmVmcmVzaENhY2hlKGNvbnRleHQpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZXNvbHZlIHN1Ym1vZHVsZSBmaWxlIGRhdGEnLCBlcnIpO1xyXG4gICAgICAgIF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgICAgY29uc3QgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG4gICAgICBjb25zdCBzdWJNb2RJZHMgPSBtb2RJZHMuZmlsdGVyKGlkID0+ICFDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG5cclxuICAgICAgbGV0IHNvcnRlZExvY2tlZCA9IFtdO1xyXG4gICAgICBsZXQgc29ydGVkU3ViTW9kcyA9IFtdO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFByb2JhYmx5IGJlc3QgdGhhdCB3ZSBkb24ndCByZXBvcnQgdGhpcyB2aWEgbm90aWZpY2F0aW9uIGFzIGEgbnVtYmVyXHJcbiAgICAgICAgLy8gIG9mIHRoaW5ncyBtYXkgaGF2ZSBvY2N1cnJlZCB0aGF0IGNhdXNlZCB0aGlzIGlzc3VlLiBXZSBsb2cgaXQgaW5zdGVhZC5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ05vIGFjdGl2ZSBwcm9maWxlJyB9KTtcclxuICAgICAgICBfSVNfU09SVElORyA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgc29ydGVkTG9ja2VkID0gdFNvcnQoeyBzdWJNb2RJZHM6IGxvY2tlZElkcywgYWxsb3dMb2NrZWQ6IHRydWUsIG1ldGFNYW5hZ2VyIH0pO1xyXG4gICAgICAgIHNvcnRlZFN1Yk1vZHMgPSB0U29ydCh7IHN1Yk1vZElkcywgYWxsb3dMb2NrZWQ6IGZhbHNlLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0sIHRydWUpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCBlcnIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbmV3T3JkZXIgPSBbXS5jb25jYXQoc29ydGVkTG9ja2VkLCBzb3J0ZWRTdWJNb2RzKS5yZWR1Y2UoKGFjY3VtLCBpZCwgaWR4KSA9PiB7XHJcbiAgICAgICAgY29uc3Qgdm9ydGV4SWQgPSBDQUNIRVtpZF0udm9ydGV4SWQ7XHJcbiAgICAgICAgY29uc3QgbmV3RW50cnkgPSB7XHJcbiAgICAgICAgICBwb3M6IGlkeCxcclxuICAgICAgICAgIGVuYWJsZWQ6IENBQ0hFW2lkXS5pc09mZmljaWFsXHJcbiAgICAgICAgICAgID8gdHJ1ZVxyXG4gICAgICAgICAgICA6ICghIWxvYWRPcmRlclt2b3J0ZXhJZF0pXHJcbiAgICAgICAgICAgICAgPyBsb2FkT3JkZXJbdm9ydGV4SWRdLmVuYWJsZWRcclxuICAgICAgICAgICAgICA6IHRydWUsXHJcbiAgICAgICAgICBsb2NrZWQ6IChsb2FkT3JkZXJbdm9ydGV4SWRdPy5sb2NrZWQgPT09IHRydWUpLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFjY3VtW3ZvcnRleElkXSA9IG5ld0VudHJ5O1xyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwge30pO1xyXG5cclxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIoYWN0aXZlUHJvZmlsZS5pZCwgbmV3T3JkZXIpKTtcclxuICAgICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIG5ld09yZGVyKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgaWQ6ICdtbmIyLXNvcnQtZmluaXNoZWQnLFxyXG4gICAgICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICAgICAgbWVzc2FnZTogY29udGV4dC5hcGkudHJhbnNsYXRlKCdGaW5pc2hlZCBzb3J0aW5nJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgICAgICBkaXNwbGF5TVM6IDMwMDAsXHJcbiAgICAgICAgfSkpLmZpbmFsbHkoKCkgPT4gX0lTX1NPUlRJTkcgPSBmYWxzZSk7XHJcbiAgfSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT5cclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCAoZ2FtZU1vZGUpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2Y/LmlkLCBtZXRhTWFuYWdlcik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdhZGRlZC1maWxlcycsIGFzeW5jIChwcm9maWxlSWQsIGZpbGVzKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcblxyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5tYXAoZmlsZXMsIGFzeW5jIChlbnRyeTogeyBmaWxlUGF0aDogc3RyaW5nLCBjYW5kaWRhdGVzOiBzdHJpbmdbXSB9KSA9PiB7XHJcbiAgICAgICAgLy8gb25seSBhY3QgaWYgd2UgZGVmaW5pdGl2ZWx5IGtub3cgd2hpY2ggbW9kIG93bnMgdGhlIGZpbGVcclxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXHJcbiAgICAgICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ10sIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XHJcbiAgICAgICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC5cclxuICAgICAgICAgIC8vICBUaGF0IHdheSwgdm9ydGV4IHdpbGwgY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0XHJcbiAgICAgICAgICAvLyAgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xyXG4gICAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHRhcmdldCBkZXN0aW5hdGlvbiBmaWxlIGlmIGl0IGV4aXN0cy5cclxuICAgICAgICAgIC8vICB0aGlzIGlzIHRvIGNvbXBsZXRlbHkgYXZvaWQgYSBzY2VuYXJpbyB3aGVyZSB3ZSBtYXkgYXR0ZW1wdCB0b1xyXG4gICAgICAgICAgLy8gIGNvcHkgdGhlIHNhbWUgZmlsZSBvbnRvIGl0c2VsZi5cclxuICAgICAgICAgIHJldHVybiBmcy5yZW1vdmVBc3luYyh0YXJnZXRQYXRoKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19