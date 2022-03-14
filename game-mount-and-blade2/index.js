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
            var _a;
            try {
                yield (0, subModCache_1.refreshCache)(context, metaManager);
                const state = context.api.store.getState();
                const lastActive = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
                yield metaManager.updateDependencyMap(lastActive);
            }
            catch (err) {
                return Promise.reject(err);
            }
            const CACHE = (_a = (0, subModCache_1.getCache)()) !== null && _a !== void 0 ? _a : {};
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
        const depIds = [...CACHE[entry].dependencies].map(dep => dep.id);
        accum[entry] = depIds.sort();
        return accum;
    }, {});
    const result = [];
    const visited = [];
    const processing = [];
    const topSort = (node, isOptional = false) => {
        if (isOptional && !Object.keys(graph).includes(node)) {
            visited[node] = true;
            return;
        }
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
            const incDep = incompatibleDeps.find(d => d.id === dep);
            if (Object.keys(graph).includes(dep) && (incDep === undefined)) {
                const depVer = CACHE[dep].subModVer;
                const depInst = CACHE[node].dependencies.find(d => d.id === dep);
                try {
                    const match = semver_1.default.satisfies(depInst.version, depVer);
                    if (!match && !!(depInst === null || depInst === void 0 ? void 0 : depInst.version) && !!depVer) {
                        CACHE[node].invalid.incompatibleDeps.push({
                            id: dep,
                            requiredVersion: depInst.version,
                            currentVersion: depVer,
                            incompatible: depInst.incompatible,
                            optional: depInst.optional,
                            order: depInst.order,
                            version: depInst.version,
                        });
                    }
                }
                catch (err) {
                    (0, vortex_api_1.log)('debug', 'failed to compare versions', err);
                }
            }
            const optional = metaManager.isOptional(node, dep);
            if (!visited[dep] && !lockedSubMods.includes(dep)) {
                if (!Object.keys(graph).includes(dep) && !optional) {
                    CACHE[node].invalid.missing.push(dep);
                }
                else {
                    topSort(dep, optional);
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
    return tamperedResult;
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
            yield (0, subModCache_1.refreshCache)(context, metaManager);
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
            const sorted = tSort(sortProps, true);
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
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined || (activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID || !CACHE) {
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
    if (!CACHE) {
        (0, vortex_api_1.log)('error', 'Failed to sort mods', { reason: 'Cache is unavailable' });
        _IS_SORTING = false;
        return;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUV0Qyw4REFBcUM7QUFFckMsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBa0Y7QUFDbEYsaUNBQW1GO0FBRW5GLHFDQUdrQjtBQUNsQiw4RUFBc0Q7QUFDdEQsNkNBQXNEO0FBRXRELDhFQUFzRDtBQUN0RCwrQ0FBc0c7QUFFdEcsMkRBQXFGO0FBQ3JGLHNGQUE4RDtBQUU5RCx5Q0FBeUM7QUFFekMsZ0VBQXdDO0FBRXhDLE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7QUFDekcsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBRTdHLElBQUksUUFBUSxDQUFDO0FBRWIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDN0MsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQzNCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQztBQU0vQixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTO0lBQ3BFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFFL0MsTUFBTSxlQUFlLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHlCQUF5QixFQUM1RCxDQUFDLFNBQWlCLEVBQUUsSUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxD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QUMsUUFBUSxDQUFDLENBQUM7b0JBQ3hFLE1BQU0sVUFBVSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBSTNELE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBS2xELE9BQU8sZUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUM7eUJBQzlCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7d0JBQ25DLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO3dCQUNuQixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzt5QkFDdkIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQzt5QkFDcEQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3lCQUMxQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLG9DQUFvQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNsRjtZQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvbWlzZSBhcyBCbHVlYmlyZCB9IGZyb20gJ2JsdWViaXJkJztcclxuXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgQlMgZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuXHJcbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGFjdGlvbnMsIEZsZXhMYXlvdXQsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgZ2V0RWxlbWVudFZhbHVlLCBnZXRYTUxEYXRhLCByZWZyZXNoR2FtZVBhcmFtcywgd2Fsa0FzeW5jIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7XHJcbiAgQkFOTkVSTE9SRF9FWEVDLCBHQU1FX0lELCBJMThOX05BTUVTUEFDRSwgTE9DS0VEX01PRFVMRVMsXHJcbiAgTU9EVUxFUywgT0ZGSUNJQUxfTU9EVUxFUywgU1VCTU9EX0ZJTEVcclxufSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBDdXN0b21JdGVtUmVuZGVyZXIgZnJvbSAnLi9jdXN0b21JdGVtUmVuZGVyZXInO1xyXG5pbXBvcnQgeyBtaWdyYXRlMDI2LCBtaWdyYXRlMDQ1IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCBDb21NZXRhZGF0YU1hbmFnZXIgZnJvbSAnLi9Db21NZXRhZGF0YU1hbmFnZXInO1xyXG5pbXBvcnQgeyBnZXRDYWNoZSwgZ2V0TGF1bmNoZXJEYXRhLCBpc0ludmFsaWQsIHBhcnNlTGF1bmNoZXJEYXRhLCByZWZyZXNoQ2FjaGUgfSBmcm9tICcuL3N1Yk1vZENhY2hlJztcclxuaW1wb3J0IHsgSVNvcnRQcm9wcywgSVN1Yk1vZENhY2hlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuaW1wb3J0IHsgSUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgeyBjcmVhdGVBY3Rpb24gfSBmcm9tICdyZWR1eC1hY3QnO1xyXG5cclxuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vdmlld3MvU2V0dGluZ3MnO1xyXG5cclxuY29uc3QgTEFVTkNIRVJfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XHJcbmNvbnN0IE1PRERJTkdfS0lUX0VYRUMgPSBwYXRoLmpvaW4oJ2JpbicsICdXaW42NF9TaGlwcGluZ193RWRpdG9yJywgJ1RhbGVXb3JsZHMuTW91bnRBbmRCbGFkZS5MYXVuY2hlci5leGUnKTtcclxuXHJcbmxldCBTVE9SRV9JRDtcclxuXHJcbmNvbnN0IEdPR19JRFMgPSBbJzE4MDI1Mzk1MjYnLCAnMTU2NDc4MTQ5NCddO1xyXG5jb25zdCBTVEVBTUFQUF9JRCA9IDI2MTU1MDtcclxuY29uc3QgRVBJQ0FQUF9JRCA9ICdDaGlja2FkZWUnO1xyXG5cclxuLy8gQSBzZXQgb2YgZm9sZGVyIG5hbWVzIChsb3dlcmNhc2VkKSB3aGljaCBhcmUgYXZhaWxhYmxlIGFsb25nc2lkZSB0aGVcclxuLy8gIGdhbWUncyBtb2R1bGVzIGZvbGRlci4gV2UgY291bGQndmUgdXNlZCB0aGUgZm9tb2QgaW5zdGFsbGVyIHN0b3AgcGF0dGVybnNcclxuLy8gIGZ1bmN0aW9uYWxpdHkgZm9yIHRoaXMsIGJ1dCBpdCdzIGJldHRlciBpZiB0aGlzIGV4dGVuc2lvbiBpcyBzZWxmIGNvbnRhaW5lZDtcclxuLy8gIGVzcGVjaWFsbHkgZ2l2ZW4gdGhhdCB0aGUgZ2FtZSdzIG1vZGRpbmcgcGF0dGVybiBjaGFuZ2VzIHF1aXRlIG9mdGVuLlxyXG5jb25zdCBST09UX0ZPTERFUlMgPSBuZXcgU2V0KFsnYmluJywgJ2RhdGEnLCAnZ3VpJywgJ2ljb25zJywgJ21vZHVsZXMnLFxyXG4gICdtdXNpYycsICdzaGFkZXJzJywgJ3NvdW5kcycsICd4bWxzY2hlbWFzJ10pO1xyXG5cclxuY29uc3Qgc2V0U29ydE9uRGVwbG95ID0gY3JlYXRlQWN0aW9uKCdNTkIyX1NFVF9TT1JUX09OX0RFUExPWScsXHJcbiAgKHByb2ZpbGVJZDogc3RyaW5nLCBzb3J0OiBib29sZWFuKSA9PiAoeyBwcm9maWxlSWQsIHNvcnQgfSkpO1xyXG5jb25zdCByZWR1Y2VyOiB0eXBlcy5JUmVkdWNlclNwZWMgPSB7XHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIFtzZXRTb3J0T25EZXBsb3kgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PlxyXG4gICAgICB1dGlsLnNldFNhZmUoc3RhdGUsIFsnc29ydE9uRGVwbG95JywgcGF5bG9hZC5wcm9maWxlSWRdLCBwYXlsb2FkLnNvcnQpXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgc29ydE9uRGVwbG95OiB7fSxcclxuICB9LFxyXG59O1xyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtFUElDQVBQX0lELCBTVEVBTUFQUF9JRC50b1N0cmluZygpLCAuLi5HT0dfSURTXSlcclxuICAgIC50aGVuKGdhbWUgPT4ge1xyXG4gICAgICBTVE9SRV9JRCA9IGdhbWUuZ2FtZVN0b3JlSWQ7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZ2FtZS5nYW1lUGF0aCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RNb2QoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBEaWZmZXJlbnQgZ2FtZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IG1vZHNGaWxlID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpICE9PSAtMSk7XHJcbiAgaWYgKG1vZHNGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFRoZXJlJ3Mgbm8gTW9kdWxlcyBmb2xkZXIuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpZHggPSBtb2RzRmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IHJvb3RGb2xkZXJNYXRjaGVzID0gbG93ZXJlZC5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuICgoKHNlZ21lbnRzLmxlbmd0aCAtIDEpID4gaWR4KSAmJiBST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pKTtcclxuICB9KSB8fCBbXTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogKHJvb3RGb2xkZXJNYXRjaGVzLmxlbmd0aCA+IDApLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IG1vZHVsZUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKSAhPT0gLTEpO1xyXG4gIGNvbnN0IGlkeCA9IG1vZHVsZUZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUyk7XHJcbiAgY29uc3Qgc3ViTW9kcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5tYXAoc3ViTW9kcywgYXN5bmMgKG1vZEZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSksICdJZCcpO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoc3ViTW9kSWQpO1xyXG4gIH0pXHJcbiAgLnRoZW4oKHN1Yk1vZElkczogc3RyaW5nW10pID0+IHtcclxuICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICBjb25zdCBsYXN0RWxlbWVudElkeCA9IHNlZ21lbnRzLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgICAvLyBJZ25vcmUgZGlyZWN0b3JpZXMgYW5kIGVuc3VyZSB0aGF0IHRoZSBmaWxlIGNvbnRhaW5zIGEga25vd24gcm9vdCBmb2xkZXIgYXRcclxuICAgICAgLy8gIHRoZSBleHBlY3RlZCBpbmRleC5cclxuICAgICAgcmV0dXJuIChST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pXHJcbiAgICAgICAgJiYgKHBhdGguZXh0bmFtZShzZWdtZW50c1tsYXN0RWxlbWVudElkeF0pICE9PSAnJykpO1xyXG4gICAgICB9KTtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBzdWJNb2RJZHMubGVuZ3RoID4gMFxyXG4gICAgICA/IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgICAgICAgIGtleTogJ3N1Yk1vZElkcycsXHJcbiAgICAgICAgICAgIHZhbHVlOiBzdWJNb2RJZHMsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF1cclxuICAgICAgOiBbXTtcclxuICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IGF0dHJpYnV0ZXMuY29uY2F0KGZpbHRlcmVkLm1hcChmaWxlID0+IHtcclxuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBmaWxlLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoaWR4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbixcclxuICAgICAgfTtcclxuICAgIH0pKTtcclxuXHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdEZvclN1Ym1vZHVsZXMoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIENoZWNrIHRoaXMgaXMgYSBtb2QgZm9yIEJhbm5lcmxvcmQgYW5kIGl0IGNvbnRhaW5zIGEgU3ViTW9kdWxlLnhtbFxyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU3ViTW9kdWxlcyhmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIHN0cmFpZ2h0IGF3YXkuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuIHBhdGguZXh0bmFtZShzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSkgIT09ICcnO1xyXG4gIH0pO1xyXG4gIGNvbnN0IHN1Yk1vZElkcyA9IFtdO1xyXG4gIGNvbnN0IHN1Yk1vZHMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKHN1Yk1vZHMsIGFzeW5jIChhY2N1bSwgbW9kRmlsZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IG1vZEZpbGUuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgY29uc3Qgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSksICdJZCcpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IChzZWdtZW50cy5sZW5ndGggPiAxKVxyXG4gICAgICA/IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDJdXHJcbiAgICAgIDogc3ViTW9kSWQ7XHJcblxyXG4gICAgc3ViTW9kSWRzLnB1c2goc3ViTW9kSWQpO1xyXG4gICAgY29uc3QgaWR4ID0gbW9kRmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoU1VCTU9EX0ZJTEUpO1xyXG4gICAgLy8gRmlsdGVyIHRoZSBtb2QgZmlsZXMgZm9yIHRoaXMgc3BlY2lmaWMgc3VibW9kdWxlLlxyXG4gICAgY29uc3Qgc3ViTW9kRmlsZXM6IHN0cmluZ1tdXHJcbiAgICAgID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gZmlsZS5zbGljZSgwLCBpZHgpID09PSBtb2RGaWxlLnNsaWNlKDAsIGlkeCkpO1xyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gc3ViTW9kRmlsZXMubWFwKChtb2RGaWxlOiBzdHJpbmcpID0+ICh7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBtb2RGaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKE1PRFVMRVMsIG1vZE5hbWUsIG1vZEZpbGUuc2xpY2UoaWR4KSksXHJcbiAgICB9KSk7XHJcbiAgICByZXR1cm4gYWNjdW0uY29uY2F0KGluc3RydWN0aW9ucyk7XHJcbiAgfSwgW10pXHJcbiAgLnRoZW4obWVyZ2VkID0+IHtcclxuICAgIGNvbnN0IHN1Yk1vZElkc0F0dHIgPSB7XHJcbiAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICBrZXk6ICdzdWJNb2RJZHMnLFxyXG4gICAgICB2YWx1ZTogc3ViTW9kSWRzLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnM6IFtdLmNvbmNhdChtZXJnZWQsIFtzdWJNb2RJZHNBdHRyXSkgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KSB7XHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbChHQU1FX0lELCAnVGFsZVdvcmxkc0Jhbm5lcmxvcmRMYXVuY2hlcicsIHtcclxuICAgIGlkOiAnVGFsZVdvcmxkc0Jhbm5lcmxvcmRMYXVuY2hlcicsXHJcbiAgICBuYW1lOiAnT2ZmaWNpYWwgTGF1bmNoZXInLFxyXG4gICAgbG9nbzogJ3R3bGF1bmNoZXIucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IHBhdGguYmFzZW5hbWUoTEFVTkNIRVJfRVhFQyksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgIHBhdGguYmFzZW5hbWUoTEFVTkNIRVJfRVhFQyksXHJcbiAgICBdLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBMQVVOQ0hFUl9FWEVDKSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgd29ya2luZ0RpcmVjdG9yeTogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcpLFxyXG4gICAgaGlkZGVuOiBmYWxzZSxcclxuICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgfSwgZmFsc2UpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0TW9kZGluZ1Rvb2woY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGlkZGVuPzogYm9vbGVhbikge1xyXG4gIGNvbnN0IHRvb2xJZCA9ICdiYW5uZXJsb3JkLXNkayc7XHJcbiAgY29uc3QgZXhlYyA9IHBhdGguYmFzZW5hbWUoTU9ERElOR19LSVRfRVhFQyk7XHJcbiAgY29uc3QgdG9vbCA9IHtcclxuICAgIGlkOiB0b29sSWQsXHJcbiAgICBuYW1lOiAnTW9kZGluZyBLaXQnLFxyXG4gICAgbG9nbzogJ3R3bGF1bmNoZXIucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IGV4ZWMsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbIGV4ZWMgXSxcclxuICAgIHBhdGg6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9ERElOR19LSVRfRVhFQyksXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcclxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgcGF0aC5kaXJuYW1lKE1PRERJTkdfS0lUX0VYRUMpKSxcclxuICAgIGhpZGRlbixcclxuICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgfTtcclxuXHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbChHQU1FX0lELCB0b29sSWQsIHRvb2wsIGZhbHNlKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIC8vIFF1aWNrbHkgZW5zdXJlIHRoYXQgdGhlIG9mZmljaWFsIExhdW5jaGVyIGlzIGFkZGVkLlxyXG4gIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTU9ERElOR19LSVRfRVhFQykpO1xyXG4gICAgc2V0TW9kZGluZ1Rvb2woY29udGV4dCwgZGlzY292ZXJ5KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHRvb2xzID0gZGlzY292ZXJ5Py50b29scztcclxuICAgIGlmICgodG9vbHMgIT09IHVuZGVmaW5lZClcclxuICAgICYmICh1dGlsLmdldFNhZmUodG9vbHMsIFsnYmFubmVybG9yZC1zZGsnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnksIHRydWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSWYgZ2FtZSBzdG9yZSBub3QgZm91bmQsIGxvY2F0aW9uIG1heSBiZSBzZXQgbWFudWFsbHkgLSBhbGxvdyBzZXR1cFxyXG4gIC8vICBmdW5jdGlvbiB0byBjb250aW51ZS5cclxuICBjb25zdCBmaW5kU3RvcmVJZCA9ICgpID0+IGZpbmRHYW1lKCkuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBjb25zdCBzdGFydFN0ZWFtID0gKCkgPT4gZmluZFN0b3JlSWQoKVxyXG4gICAgLnRoZW4oKCkgPT4gKFNUT1JFX0lEID09PSAnc3RlYW0nKVxyXG4gICAgICA/IHV0aWwuR2FtZVN0b3JlSGVscGVyLmxhdW5jaEdhbWVTdG9yZShjb250ZXh0LmFwaSwgU1RPUkVfSUQsIHVuZGVmaW5lZCwgdHJ1ZSlcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKSk7XHJcblxyXG4gIC8vIENoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgc2V0IHRoZSBsb2FkIG9yZGVyIG9iamVjdCBmb3IgdGhpcyBwcm9maWxlXHJcbiAgLy8gIGFuZCBjcmVhdGUgaXQgaWYgd2UgaGF2ZW4ndC5cclxuICByZXR1cm4gc3RhcnRTdGVhbSgpLnRoZW4oKCkgPT4gcGFyc2VMYXVuY2hlckRhdGEoKSkudGhlbihhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCByZWZyZXNoQ2FjaGUoY29udGV4dCwgbWV0YU1hbmFnZXIpO1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGxhc3RBY3RpdmUgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgICAgYXdhaXQgbWV0YU1hbmFnZXIudXBkYXRlRGVwZW5kZW5jeU1hcChsYXN0QWN0aXZlKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSdyZSBnb2luZyB0byBkbyBhIHF1aWNrIHRTb3J0IGF0IHRoaXMgcG9pbnQgLSBub3QgZ29pbmcgdG9cclxuICAgIC8vICBjaGFuZ2UgdGhlIHVzZXIncyBsb2FkIG9yZGVyLCBidXQgdGhpcyB3aWxsIGhpZ2hsaWdodCBhbnlcclxuICAgIC8vICBjeWNsaWMgb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCkgPz8ge307XHJcbiAgICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICBjb25zdCBzb3J0ZWQgPSB0U29ydCh7IHN1Yk1vZElkczogbW9kSWRzLCBhbGxvd0xvY2tlZDogdHJ1ZSwgbWV0YU1hbmFnZXIgfSk7XHJcbiAgfSlcclxuICAuY2F0Y2goZXJyID0+IHtcclxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLk5vdEZvdW5kKSB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGZpbmQgZ2FtZSBsYXVuY2hlciBkYXRhJyxcclxuICAgICAgICAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIHRocm91Z2ggdGhlIG9mZmljaWFsIGdhbWUgbGF1bmNoZXIgYW5kICdcclxuICAgICAgKyAndHJ5IGFnYWluJywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxyXG4gICAgICAgIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfSlcclxuICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBWYWxpZCB1c2UgY2FzZSB3aGVuIGF0dGVtcHRpbmcgdG8gc3dpdGNoIHRvXHJcbiAgICAgIC8vICBCYW5uZXJsb3JkIHdpdGhvdXQgYW55IGFjdGl2ZSBwcm9maWxlLlxyXG4gICAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwge30pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0U29ydChzb3J0UHJvcHM6IElTb3J0UHJvcHMsIHRlc3Q6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gIGNvbnN0IHsgc3ViTW9kSWRzLCBhbGxvd0xvY2tlZCwgbG9hZE9yZGVyLCBtZXRhTWFuYWdlciB9ID0gc29ydFByb3BzO1xyXG4gIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAvLyBUb3BvbG9naWNhbCBzb3J0IC0gd2UgbmVlZCB0bzpcclxuICAvLyAgLSBJZGVudGlmeSBjeWNsaWMgZGVwZW5kZW5jaWVzLlxyXG4gIC8vICAtIElkZW50aWZ5IG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gIC8vICAtIFdlIHdpbGwgdHJ5IHRvIGlkZW50aWZ5IGluY29tcGF0aWJsZSBkZXBlbmRlbmNpZXMgKHZlcnNpb24td2lzZSlcclxuXHJcbiAgLy8gVGhlc2UgYXJlIG1hbnVhbGx5IGxvY2tlZCBtb2QgZW50cmllcy5cclxuICBjb25zdCBsb2NrZWRTdWJNb2RzID0gKCEhbG9hZE9yZGVyKVxyXG4gICAgPyBzdWJNb2RJZHMuZmlsdGVyKHN1Yk1vZElkID0+IHtcclxuICAgICAgY29uc3QgZW50cnkgPSBDQUNIRVtzdWJNb2RJZF07XHJcbiAgICAgIHJldHVybiAoISFlbnRyeSlcclxuICAgICAgICA/ICEhbG9hZE9yZGVyW2VudHJ5LnZvcnRleElkXT8ubG9ja2VkXHJcbiAgICAgICAgOiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICA6IFtdO1xyXG4gIGNvbnN0IGFscGhhYmV0aWNhbCA9IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kID0+ICFsb2NrZWRTdWJNb2RzLmluY2x1ZGVzKHN1Yk1vZCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKTtcclxuICBjb25zdCBncmFwaCA9IGFscGhhYmV0aWNhbC5yZWR1Y2UoKGFjY3VtLCBlbnRyeSkgPT4ge1xyXG4gICAgY29uc3QgZGVwSWRzID0gWy4uLkNBQ0hFW2VudHJ5XS5kZXBlbmRlbmNpZXNdLm1hcChkZXAgPT4gZGVwLmlkKTtcclxuICAgIC8vIENyZWF0ZSB0aGUgbm9kZSBncmFwaC5cclxuICAgIGFjY3VtW2VudHJ5XSA9IGRlcElkcy5zb3J0KCk7XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG5cclxuICAvLyBXaWxsIHN0b3JlIHRoZSBmaW5hbCBMTyByZXN1bHRcclxuICBjb25zdCByZXN1bHQgPSBbXTtcclxuXHJcbiAgLy8gVGhlIG5vZGVzIHdlIGhhdmUgdmlzaXRlZC9wcm9jZXNzZWQuXHJcbiAgY29uc3QgdmlzaXRlZCA9IFtdO1xyXG5cclxuICAvLyBUaGUgbm9kZXMgd2hpY2ggYXJlIHN0aWxsIHByb2Nlc3NpbmcuXHJcbiAgY29uc3QgcHJvY2Vzc2luZyA9IFtdO1xyXG5cclxuICBjb25zdCB0b3BTb3J0ID0gKG5vZGUsIGlzT3B0aW9uYWwgPSBmYWxzZSkgPT4ge1xyXG4gICAgaWYgKGlzT3B0aW9uYWwgJiYgIU9iamVjdC5rZXlzKGdyYXBoKS5pbmNsdWRlcyhub2RlKSkge1xyXG4gICAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcHJvY2Vzc2luZ1tub2RlXSA9IHRydWU7XHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSAoISFhbGxvd0xvY2tlZClcclxuICAgICAgPyBncmFwaFtub2RlXVxyXG4gICAgICA6IGdyYXBoW25vZGVdLmZpbHRlcihlbGVtZW50ID0+ICFMT0NLRURfTU9EVUxFUy5oYXMoZWxlbWVudCkpO1xyXG5cclxuICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcGVuZGVuY2llcykge1xyXG4gICAgICBpZiAocHJvY2Vzc2luZ1tkZXBdKSB7XHJcbiAgICAgICAgLy8gQ3ljbGljIGRlcGVuZGVuY3kgZGV0ZWN0ZWQgLSBoaWdobGlnaHQgYm90aCBtb2RzIGFzIGludmFsaWRcclxuICAgICAgICAvLyAgd2l0aGluIHRoZSBjYWNoZSBpdHNlbGYgLSB3ZSBhbHNvIG5lZWQgdG8gaGlnaGxpZ2h0IHdoaWNoIG1vZHMuXHJcbiAgICAgICAgQ0FDSEVbbm9kZV0uaW52YWxpZC5jeWNsaWMucHVzaChkZXApO1xyXG4gICAgICAgIENBQ0hFW2RlcF0uaW52YWxpZC5jeWNsaWMucHVzaChub2RlKTtcclxuXHJcbiAgICAgICAgdmlzaXRlZFtub2RlXSA9IHRydWU7XHJcbiAgICAgICAgcHJvY2Vzc2luZ1tub2RlXSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBpbmNvbXBhdGlibGVEZXBzID0gQ0FDSEVbbm9kZV0uaW52YWxpZC5pbmNvbXBhdGlibGVEZXBzO1xyXG4gICAgICBjb25zdCBpbmNEZXAgPSBpbmNvbXBhdGlibGVEZXBzLmZpbmQoZCA9PiBkLmlkID09PSBkZXApO1xyXG4gICAgICBpZiAoT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKGRlcCkgJiYgKGluY0RlcCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIGNvbnN0IGRlcFZlciA9IENBQ0hFW2RlcF0uc3ViTW9kVmVyO1xyXG4gICAgICAgIGNvbnN0IGRlcEluc3QgPSBDQUNIRVtub2RlXS5kZXBlbmRlbmNpZXMuZmluZChkID0+IGQuaWQgPT09IGRlcCk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IG1hdGNoID0gc2VtdmVyLnNhdGlzZmllcyhkZXBJbnN0LnZlcnNpb24sIGRlcFZlcik7XHJcbiAgICAgICAgICBpZiAoIW1hdGNoICYmICEhZGVwSW5zdD8udmVyc2lvbiAmJiAhIWRlcFZlcikge1xyXG4gICAgICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmluY29tcGF0aWJsZURlcHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgaWQ6IGRlcCxcclxuICAgICAgICAgICAgICByZXF1aXJlZFZlcnNpb246IGRlcEluc3QudmVyc2lvbixcclxuICAgICAgICAgICAgICBjdXJyZW50VmVyc2lvbjogZGVwVmVyLFxyXG4gICAgICAgICAgICAgIGluY29tcGF0aWJsZTogZGVwSW5zdC5pbmNvbXBhdGlibGUsXHJcbiAgICAgICAgICAgICAgb3B0aW9uYWw6IGRlcEluc3Qub3B0aW9uYWwsXHJcbiAgICAgICAgICAgICAgb3JkZXI6IGRlcEluc3Qub3JkZXIsXHJcbiAgICAgICAgICAgICAgdmVyc2lvbjogZGVwSW5zdC52ZXJzaW9uLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIC8vIE9rIHNvIHdlIGRpZG4ndCBtYW5hZ2UgdG8gY29tcGFyZSB0aGUgdmVyc2lvbnMsIHdlIGxvZyB0aGlzIGFuZFxyXG4gICAgICAgICAgLy8gIGNvbnRpbnVlLlxyXG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gY29tcGFyZSB2ZXJzaW9ucycsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBvcHRpb25hbCA9IG1ldGFNYW5hZ2VyLmlzT3B0aW9uYWwobm9kZSwgZGVwKTtcclxuICAgICAgaWYgKCF2aXNpdGVkW2RlcF0gJiYgIWxvY2tlZFN1Yk1vZHMuaW5jbHVkZXMoZGVwKSkge1xyXG4gICAgICAgIGlmICghT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKGRlcCkgJiYgIW9wdGlvbmFsKSB7XHJcbiAgICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLm1pc3NpbmcucHVzaChkZXApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0b3BTb3J0KGRlcCwgb3B0aW9uYWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3Npbmdbbm9kZV0gPSBmYWxzZTtcclxuICAgIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xyXG5cclxuICAgIGlmICghaXNJbnZhbGlkKG5vZGUpKSB7XHJcbiAgICAgIHJlc3VsdC5wdXNoKG5vZGUpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGZvciAoY29uc3Qgbm9kZSBpbiBncmFwaCkge1xyXG4gICAgaWYgKCF2aXNpdGVkW25vZGVdICYmICFwcm9jZXNzaW5nW25vZGVdKSB7XHJcbiAgICAgIHRvcFNvcnQobm9kZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoYWxsb3dMb2NrZWQpIHtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvLyBQcm9wZXIgdG9wb2xvZ2ljYWwgc29ydCBkaWN0YXRlcyB3ZSBzaW1wbHkgcmV0dXJuIHRoZVxyXG4gIC8vICByZXN1bHQgYXQgdGhpcyBwb2ludC4gQnV0LCBtb2QgYXV0aG9ycyB3YW50IG1vZHVsZXNcclxuICAvLyAgd2l0aCBubyBkZXBlbmRlbmNpZXMgdG8gYnViYmxlIHVwIHRvIHRoZSB0b3Agb2YgdGhlIExPLlxyXG4gIC8vICAoVGhpcyB3aWxsIG9ubHkgYXBwbHkgdG8gbm9uIGxvY2tlZCBlbnRyaWVzKVxyXG4gIGNvbnN0IHN1Yk1vZHNXaXRoTm9EZXBzID0gcmVzdWx0LmZpbHRlcihkZXAgPT4gKGdyYXBoW2RlcF0ubGVuZ3RoID09PSAwKVxyXG4gICAgfHwgKGdyYXBoW2RlcF0uZmluZChkID0+ICFMT0NLRURfTU9EVUxFUy5oYXMoZCkpID09PSB1bmRlZmluZWQpKS5zb3J0KCkgfHwgW107XHJcbiAgY29uc3QgdGFtcGVyZWRSZXN1bHQgPSBbXS5jb25jYXQoc3ViTW9kc1dpdGhOb0RlcHMsXHJcbiAgICByZXN1bHQuZmlsdGVyKGVudHJ5ID0+ICFzdWJNb2RzV2l0aE5vRGVwcy5pbmNsdWRlcyhlbnRyeSkpKTtcclxuICBsb2NrZWRTdWJNb2RzLmZvckVhY2goc3ViTW9kSWQgPT4ge1xyXG4gICAgY29uc3QgcG9zID0gbG9hZE9yZGVyW0NBQ0hFW3N1Yk1vZElkXS52b3J0ZXhJZF0ucG9zO1xyXG4gICAgdGFtcGVyZWRSZXN1bHQuc3BsaWNlKHBvcywgMCwgW3N1Yk1vZElkXSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0YW1wZXJlZFJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNFeHRlcm5hbChjb250ZXh0LCBzdWJNb2RJZCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMobW9kcyk7XHJcbiAgbW9kSWRzLmZvckVhY2gobW9kSWQgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWRzID0gdXRpbC5nZXRTYWZlKG1vZHNbbW9kSWRdLCBbJ2F0dHJpYnV0ZXMnLCAnc3ViTW9kSWRzJ10sIFtdKTtcclxuICAgIGlmIChzdWJNb2RJZHMuaW5jbHVkZXMoc3ViTW9kSWQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubGV0IHJlZnJlc2hGdW5jO1xyXG5hc3luYyBmdW5jdGlvbiByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IGRlcGxveVByb2ZpbGU/LmdhbWVJZCkgfHwgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkpIHtcclxuICAgIC8vIERlcGxveW1lbnQgZXZlbnQgc2VlbXMgdG8gYmUgZXhlY3V0ZWQgZm9yIGEgcHJvZmlsZSBvdGhlclxyXG4gICAgLy8gIHRoYW4gdGhlIGN1cnJlbnRseSBhY3RpdmUgb25lLiBOb3QgZ29pbmcgdG8gY29udGludWUuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKHByb2ZpbGVJZCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCByZWZyZXNoQ2FjaGUoY29udGV4dCwgbWV0YU1hbmFnZXIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgLy8gUHJvY2Vzc0NhbmNlbGVkIG1lYW5zIHRoYXQgd2Ugd2VyZSB1bmFibGUgdG8gc2NhbiBmb3IgZGVwbG95ZWRcclxuICAgIC8vICBzdWJNb2R1bGVzLCBwcm9iYWJseSBiZWNhdXNlIGdhbWUgZGlzY292ZXJ5IGlzIGluY29tcGxldGUuXHJcbiAgICAvLyBJdCdzIGJleW9uZCB0aGUgc2NvcGUgb2YgdGhpcyBmdW5jdGlvbiB0byByZXBvcnQgZGlzY292ZXJ5XHJcbiAgICAvLyAgcmVsYXRlZCBpc3N1ZXMuXHJcbiAgICByZXR1cm4gKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIHt9KTtcclxuXHJcbiAgaWYgKHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdtb3VudGFuZGJsYWRlMicsICdzb3J0T25EZXBsb3knLCBhY3RpdmVQcm9maWxlLmlkXSwgdHJ1ZSkpIHtcclxuICAgIHJldHVybiBzb3J0SW1wbChjb250ZXh0LCBtZXRhTWFuYWdlcik7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGRvIGEgcXVpY2sgdFNvcnQgYXQgdGhpcyBwb2ludCAtIG5vdCBnb2luZyB0b1xyXG4gICAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxyXG4gICAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIGNvbnN0IHNvcnRQcm9wczogSVNvcnRQcm9wcyA9IHtcclxuICAgICAgc3ViTW9kSWRzOiBtb2RJZHMsXHJcbiAgICAgIGFsbG93TG9ja2VkOiB0cnVlLFxyXG4gICAgICBsb2FkT3JkZXIsXHJcbiAgICAgIG1ldGFNYW5hZ2VyLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IHNvcnRlZCA9IHRTb3J0KHNvcnRQcm9wcywgdHJ1ZSk7XHJcblxyXG4gICAgaWYgKHJlZnJlc2hGdW5jICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmVmcmVzaEZ1bmMoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgbWV0YU1hbmFnZXIpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQgfHwgYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8ICFDQUNIRSkge1xyXG4gICAgLy8gUmFjZSBjb25kaXRpb24gP1xyXG4gICAgcmV0dXJuIGl0ZW1zO1xyXG4gIH1cclxuXHJcbiAgbGV0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBpZiAoaXRlbXMubGVuZ3RoID4gMCAmJiBtb2RJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBDYWNoZSBoYXNuJ3QgYmVlbiBwb3B1bGF0ZWQgeWV0LlxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gUmVmcmVzaCB0aGUgY2FjaGUuXHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgYWN0aXZlUHJvZmlsZS5pZCwgbWV0YU1hbmFnZXIpO1xyXG4gICAgICBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBMb2NrZWQgaWRzIGFyZSBhbHdheXMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdCBhcyBhbGxcclxuICAvLyAgb3RoZXIgbW9kdWxlcyBkZXBlbmQgb24gdGhlc2UuXHJcbiAgbGV0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIFNvcnQgdGhlIGxvY2tlZCBpZHMgYW1vbmdzdCB0aGVtc2VsdmVzIHRvIGVuc3VyZVxyXG4gICAgLy8gIHRoYXQgdGhlIGdhbWUgcmVjZWl2ZXMgdGhlc2UgaW4gdGhlIHJpZ2h0IG9yZGVyLlxyXG4gICAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xyXG4gICAgICBzdWJNb2RJZHM6IGxvY2tlZElkcyxcclxuICAgICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICAgIG1ldGFNYW5hZ2VyLFxyXG4gICAgfTtcclxuICAgIGxvY2tlZElkcyA9IHRTb3J0KHNvcnRQcm9wcyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgbG9ja2VkIGVudHJpZXMuXHJcbiAgY29uc3QgbG9ja2VkSXRlbXMgPSBsb2NrZWRJZHMubWFwKGlkID0+ICh7XHJcbiAgICBpZDogQ0FDSEVbaWRdLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVbaWRdLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGlkKSxcclxuICB9KSk7XHJcblxyXG4gIGNvbnN0IExBVU5DSEVSX0RBVEEgPSBnZXRMYXVuY2hlckRhdGEoKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgaWRzIHdpbGwgaW5jbHVkZSBvZmZpY2lhbCBtb2R1bGVzIGFzIHdlbGwgYnV0IG5vdCBsb2NrZWQgZW50cmllcy5cclxuICBjb25zdCBleHRlcm5hbElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gKCFDQUNIRVtpZF0uaXNMb2NrZWQpICYmIChDQUNIRVtpZF0udm9ydGV4SWQgPT09IGlkKSk7XHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBMT2tleXMgPSAoKE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoID4gMClcclxuICAgID8gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgOiBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMubWFwKG1vZCA9PiBtb2Quc3ViTW9kSWQpKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgbW9kdWxlcyB0aGF0IGFyZSBhbHJlYWR5IGluIHRoZSBsb2FkIG9yZGVyLlxyXG4gIGNvbnN0IGtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+IExPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xyXG5cclxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHdoaWNoIGFyZSBuZXcgYW5kIGhhdmUgeWV0IHRvIGJlIGFkZGVkIHRvIHRoZSBMTy5cclxuICBjb25zdCB1bmtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+ICFMT2tleXMuaW5jbHVkZXMoaWQpKSB8fCBbXTtcclxuXHJcbiAgaXRlbXMgPSBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAvLyBSZW1vdmUgYW55IGxvY2tlZElkcywgYnV0IGFsc28gZW5zdXJlIHRoYXQgdGhlXHJcbiAgICAvLyAgZW50cnkgY2FuIGJlIGZvdW5kIGluIHRoZSBjYWNoZS4gSWYgaXQncyBub3QgaW4gdGhlXHJcbiAgICAvLyAgY2FjaGUsIHRoaXMgbWF5IG1lYW4gdGhhdCB0aGUgc3VibW9kIHhtbCBmaWxlIGZhaWxlZFxyXG4gICAgLy8gIHBhcnNlLWluZyBhbmQgdGhlcmVmb3JlIHNob3VsZCBub3QgYmUgZGlzcGxheWVkLlxyXG4gICAgY29uc3QgaXNMb2NrZWQgPSBsb2NrZWRJZHMuaW5jbHVkZXMoaXRlbS5pZCk7XHJcbiAgICBjb25zdCBoYXNDYWNoZUVudHJ5ID0gT2JqZWN0LmtleXMoQ0FDSEUpLmZpbmQoa2V5ID0+XHJcbiAgICAgIENBQ0hFW2tleV0udm9ydGV4SWQgPT09IGl0ZW0uaWQpICE9PSB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gIWlzTG9ja2VkICYmIGhhc0NhY2hlRW50cnk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHBvc01hcCA9IHt9O1xyXG4gIGxldCBuZXh0QXZhaWxhYmxlID0gTE9rZXlzLmxlbmd0aDtcclxuICBjb25zdCBnZXROZXh0UG9zID0gKGxvSWQpID0+IHtcclxuICAgIGlmIChMT0NLRURfTU9EVUxFUy5oYXMobG9JZCkpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmluZGV4T2YobG9JZCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHBvc01hcFtsb0lkXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHBvc01hcFtsb0lkXSA9IG5leHRBdmFpbGFibGU7XHJcbiAgICAgIHJldHVybiBuZXh0QXZhaWxhYmxlKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcG9zTWFwW2xvSWRdO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGtub3duRXh0Lm1hcChrZXkgPT4gKHtcclxuICAgIGlkOiBDQUNIRVtrZXldLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxyXG4gICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGNvbnRleHQsIENBQ0hFW2tleV0udm9ydGV4SWQpLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXHJcbiAgfSkpXHJcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1heC1saW5lLWxlbmd0aFxyXG4gICAgLnNvcnQoKGEsIGIpID0+IChsb2FkT3JkZXJbYS5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGEuaWQpKSAtIChsb2FkT3JkZXJbYi5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGIuaWQpKSlcclxuICAgIC5mb3JFYWNoKGtub3duID0+IHtcclxuICAgICAgLy8gSWYgdGhpcyBhIGtub3duIGV4dGVybmFsIG1vZHVsZSBhbmQgaXMgTk9UIGluIHRoZSBpdGVtIGxpc3QgYWxyZWFkeVxyXG4gICAgICAvLyAgd2UgbmVlZCB0byByZS1pbnNlcnQgaW4gdGhlIGNvcnJlY3QgaW5kZXggYXMgYWxsIGtub3duIGV4dGVybmFsIG1vZHVsZXNcclxuICAgICAgLy8gIGF0IHRoaXMgcG9pbnQgYXJlIGFjdHVhbGx5IGRlcGxveWVkIGluc2lkZSB0aGUgbW9kcyBmb2xkZXIgYW5kIHNob3VsZFxyXG4gICAgICAvLyAgYmUgaW4gdGhlIGl0ZW1zIGxpc3QhXHJcbiAgICAgIGNvbnN0IGRpZmYgPSAoTE9rZXlzLmxlbmd0aCkgLSAoTE9rZXlzLmxlbmd0aCAtIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmxlbmd0aCk7XHJcbiAgICAgIGlmIChpdGVtcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga25vd24uaWQpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb25zdCBwb3MgPSBsb2FkT3JkZXJba25vd24uaWRdPy5wb3M7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gKHBvcyAhPT0gdW5kZWZpbmVkKSA/IChwb3MgLSBkaWZmKSA6IChnZXROZXh0UG9zKGtub3duLmlkKSAtIGRpZmYpO1xyXG4gICAgICAgIGl0ZW1zLnNwbGljZShpZHgsIDAsIGtub3duKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHVua25vd25JdGVtcyA9IFtdLmNvbmNhdCh1bmtub3duRXh0KVxyXG4gICAgLm1hcChrZXkgPT4gKHtcclxuICAgICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXHJcbiAgICAgIG5hbWU6IENBQ0hFW2tleV0uc3ViTW9kTmFtZSxcclxuICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXHJcbiAgICAgIG9mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhrZXkpLFxyXG4gICAgfSkpO1xyXG5cclxuICBjb25zdCBwcmVTb3J0ZWQgPSBbXS5jb25jYXQobG9ja2VkSXRlbXMsIGl0ZW1zLCB1bmtub3duSXRlbXMpO1xyXG4gIHJldHVybiAoZGlyZWN0aW9uID09PSAnZGVzY2VuZGluZycpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQucmV2ZXJzZSgpKVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcykge1xyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdsb2Fkb3JkZXJpbmZvJyB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSwgdCgnTWFuYWdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1lvdSBjYW4gYWRqdXN0IHRoZSBsb2FkIG9yZGVyIGZvciBCYW5uZXJsb3JkIGJ5IGRyYWdnaW5nIGFuZCBkcm9wcGluZyBtb2RzIHVwIG9yIGRvd24gb24gdGhpcyBwYWdlLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBrZWVwIGluIG1pbmQgdGhhdCBCYW5uZXJsb3JkIGlzIHN0aWxsIGluIEVhcmx5IEFjY2Vzcywgd2hpY2ggbWVhbnMgdGhhdCB0aGVyZSBtaWdodCBiZSBzaWduaWZpY2FudCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2NoYW5nZXMgdG8gdGhlIGdhbWUgYXMgdGltZSBnb2VzIG9uLiBQbGVhc2Ugbm90aWZ5IHVzIG9mIGFueSBWb3J0ZXggcmVsYXRlZCBpc3N1ZXMgeW91IGVuY291bnRlciB3aXRoIHRoaXMgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdleHRlbnNpb24gc28gd2UgY2FuIGZpeCBpdC4gRm9yIG1vcmUgaW5mb3JtYXRpb24gYW5kIGhlbHAgc2VlOiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19CYW5uZXJsb3JkX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBCYW5uZXJsb3JkIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ0hvdyB0byB1c2U6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NoZWNrIHRoZSBib3ggbmV4dCB0byB0aGUgbW9kcyB5b3Ugd2FudCB0byBiZSBhY3RpdmUgaW4gdGhlIGdhbWUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NsaWNrIEF1dG8gU29ydCBpbiB0aGUgdG9vbGJhci4gKFNlZSBiZWxvdyBmb3IgZGV0YWlscykuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01ha2Ugc3VyZSB0byBydW4gdGhlIGdhbWUgZGlyZWN0bHkgdmlhIHRoZSBQbGF5IGJ1dHRvbiBpbiB0aGUgdG9wIGxlZnQgY29ybmVyICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcob24gdGhlIEJhbm5lcmxvcmQgdGlsZSkuIFlvdXIgVm9ydGV4IGxvYWQgb3JkZXIgbWF5IG5vdCBiZSBsb2FkZWQgaWYgeW91IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGdhbWUgbGF1bmNoZXIuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ09wdGlvbmFsOiBNYW51YWxseSBkcmFnIGFuZCBkcm9wIG1vZHMgdG8gZGlmZmVyZW50IHBvc2l0aW9ucyBpbiB0aGUgbG9hZCBvcmRlciAoZm9yIHRlc3RpbmcgZGlmZmVyZW50IG92ZXJyaWRlcykuIE1vZHMgZnVydGhlciBkb3duIHRoZSBsaXN0IG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1BsZWFzZSBub3RlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgbG9hZCBvcmRlciByZWZsZWN0ZWQgaGVyZSB3aWxsIG9ubHkgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIGdhbWUgdmlhIHRoZSBwbGF5IGJ1dHRvbiBpbiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAndGhlIHRvcCBsZWZ0IGNvcm5lci4gRG8gbm90IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGxhdW5jaGVyLCBhcyB0aGF0IHdpbGwgaWdub3JlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICd0aGUgVm9ydGV4IGxvYWQgb3JkZXIgYW5kIGdvIGJ5IHdoYXQgaXMgc2hvd24gaW4gdGhlIGxhdW5jaGVyIGluc3RlYWQuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0ZvciBCYW5uZXJsb3JkLCBtb2RzIHNvcnRlZCBmdXJ0aGVyIHRvd2FyZHMgdGhlIGJvdHRvbSBvZiB0aGUgbGlzdCB3aWxsIG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cCAoaWYgdGhleSBjb25mbGljdCkuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdOb3RlOiBIYXJtb255IHBhdGNoZXMgbWF5IGJlIHRoZSBleGNlcHRpb24gdG8gdGhpcyBydWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdBdXRvIFNvcnQgdXNlcyB0aGUgU3ViTW9kdWxlLnhtbCBmaWxlcyAodGhlIGVudHJpZXMgdW5kZXIgPERlcGVuZGVkTW9kdWxlcz4pIHRvIGRldGVjdCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnZGVwZW5kZW5jaWVzIHRvIHNvcnQgYnkuICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdJZiB5b3UgY2Fubm90IHNlZSB5b3VyIG1vZCBpbiB0aGlzIGxvYWQgb3JkZXIsIFZvcnRleCBtYXkgaGF2ZSBiZWVuIHVuYWJsZSB0byBmaW5kIG9yIHBhcnNlIGl0cyBTdWJNb2R1bGUueG1sIGZpbGUuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdNb3N0IC0gYnV0IG5vdCBhbGwgbW9kcyAtIGNvbWUgd2l0aCBvciBuZWVkIGEgU3ViTW9kdWxlLnhtbCBmaWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdIaXQgdGhlIGRlcGxveSBidXR0b24gd2hlbmV2ZXIgeW91IGluc3RhbGwgYW5kIGVuYWJsZSBhIG5ldyBtb2QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1RoZSBnYW1lIHdpbGwgbm90IGxhdW5jaCB1bmxlc3MgdGhlIGdhbWUgc3RvcmUgKFN0ZWFtLCBFcGljLCBldGMpIGlzIHN0YXJ0ZWQgYmVmb3JlaGFuZC4gSWYgeW91XFwncmUgZ2V0dGluZyB0aGUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1wiVW5hYmxlIHRvIEluaXRpYWxpemUgU3RlYW0gQVBJXCIgZXJyb3IsIHJlc3RhcnQgU3RlYW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1JpZ2h0IGNsaWNraW5nIGFuIGVudHJ5IHdpbGwgb3BlbiB0aGUgY29udGV4dCBtZW51IHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvY2sgTE8gZW50cmllcyBpbnRvIHBvc2l0aW9uOyBlbnRyeSB3aWxsICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdiZSBpZ25vcmVkIGJ5IGF1dG8tc29ydCBtYWludGFpbmluZyBpdHMgbG9ja2VkIHBvc2l0aW9uLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUdhbWVWZXJzaW9uKGRpc2NvdmVyeVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ2RldmVsb3BtZW50JyAmJiBzZW12ZXIuc2F0aXNmaWVzKHV0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9uLCAnPDEuNC4wJykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ25vdCBzdXBwb3J0ZWQgaW4gb2xkZXIgVm9ydGV4IHZlcnNpb25zJykpO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEocGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1ZlcnNpb24ueG1sJykpO1xyXG4gICAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBCQU5ORVJMT1JEX0VYRUMpO1xyXG4gICAgY29uc3QgdmFsdWUgPSBkYXRhPy5WZXJzaW9uPy5TaW5nbGVwbGF5ZXI/LlswXT8uJD8uVmFsdWVcclxuICAgICAgLnNsaWNlKDEpXHJcbiAgICAgIC5zcGxpdCgnLicpXHJcbiAgICAgIC5zbGljZSgwLCAzKVxyXG4gICAgICAuam9pbignLicpO1xyXG4gICAgcmV0dXJuIChzZW12ZXIudmFsaWQodmFsdWUpKSA/IFByb21pc2UucmVzb2x2ZSh2YWx1ZSkgOiBnZXRWZXJzaW9uKGV4ZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5sZXQgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuZnVuY3Rpb24gc29ydEltcGwoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgaWYgKCFDQUNIRSkge1xyXG4gICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gc29ydCBtb2RzJywgeyByZWFzb246ICdDYWNoZSBpcyB1bmF2YWlsYWJsZScgfSk7XHJcbiAgICBfSVNfU09SVElORyA9IGZhbHNlO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgY29uc3QgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG4gIGNvbnN0IHN1Yk1vZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gIUNBQ0hFW2lkXS5pc0xvY2tlZCk7XHJcblxyXG4gIGxldCBzb3J0ZWRMb2NrZWQgPSBbXTtcclxuICBsZXQgc29ydGVkU3ViTW9kcyA9IFtdO1xyXG5cclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gUHJvYmFibHkgYmVzdCB0aGF0IHdlIGRvbid0IHJlcG9ydCB0aGlzIHZpYSBub3RpZmljYXRpb24gYXMgYSBudW1iZXJcclxuICAgIC8vICBvZiB0aGluZ3MgbWF5IGhhdmUgb2NjdXJyZWQgdGhhdCBjYXVzZWQgdGhpcyBpc3N1ZS4gV2UgbG9nIGl0IGluc3RlYWQuXHJcbiAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ05vIGFjdGl2ZSBwcm9maWxlJyB9KTtcclxuICAgIF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG5cclxuICB0cnkge1xyXG4gICAgc29ydGVkTG9ja2VkID0gdFNvcnQoeyBzdWJNb2RJZHM6IGxvY2tlZElkcywgYWxsb3dMb2NrZWQ6IHRydWUsIG1ldGFNYW5hZ2VyIH0pO1xyXG4gICAgc29ydGVkU3ViTW9kcyA9IHRTb3J0KHsgc3ViTW9kSWRzLCBhbGxvd0xvY2tlZDogZmFsc2UsIGxvYWRPcmRlciwgbWV0YU1hbmFnZXIgfSwgdHJ1ZSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCBlcnIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbmV3T3JkZXIgPSBbXS5jb25jYXQoc29ydGVkTG9ja2VkLCBzb3J0ZWRTdWJNb2RzKS5yZWR1Y2UoKGFjY3VtLCBpZCwgaWR4KSA9PiB7XHJcbiAgICBjb25zdCB2b3J0ZXhJZCA9IENBQ0hFW2lkXS52b3J0ZXhJZDtcclxuICAgIGNvbnN0IG5ld0VudHJ5ID0ge1xyXG4gICAgICBwb3M6IGlkeCxcclxuICAgICAgZW5hYmxlZDogQ0FDSEVbaWRdLmlzT2ZmaWNpYWxcclxuICAgICAgICA/IHRydWVcclxuICAgICAgICA6ICghIWxvYWRPcmRlclt2b3J0ZXhJZF0pXHJcbiAgICAgICAgICA/IGxvYWRPcmRlclt2b3J0ZXhJZF0uZW5hYmxlZFxyXG4gICAgICAgICAgOiB0cnVlLFxyXG4gICAgICBsb2NrZWQ6IChsb2FkT3JkZXJbdm9ydGV4SWRdPy5sb2NrZWQgPT09IHRydWUpLFxyXG4gICAgfTtcclxuXHJcbiAgICBhY2N1bVt2b3J0ZXhJZF0gPSBuZXdFbnRyeTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKGFjdGl2ZVByb2ZpbGUuaWQsIG5ld09yZGVyKSk7XHJcbiAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIG5ld09yZGVyKVxyXG4gICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnbW5iMi1zb3J0LWZpbmlzaGVkJyxcclxuICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICBtZXNzYWdlOiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0ZpbmlzaGVkIHNvcnRpbmcnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgfSkpLmZpbmFsbHkoKCkgPT4gX0lTX1NPUlRJTkcgPSBmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnbW91bnRhbmRibGFkZTInXSwgcmVkdWNlcik7XHJcbiAgKGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncyBhcyBhbnkpKCdJbnRlcmZhY2UnLCBTZXR0aW5ncywgKCkgPT4gKHtcclxuICAgIHQ6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSxcclxuICAgIG9uU2V0U29ydE9uRGVwbG95OiAocHJvZmlsZUlkOiBzdHJpbmcsIHNvcnQ6IGJvb2xlYW4pID0+XHJcbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFNvcnRPbkRlcGxveShwcm9maWxlSWQsIHNvcnQpKSxcclxuICB9KSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIHJldHVybiBwcm9maWxlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEO1xyXG4gIH0sIDUxKTtcclxuXHJcbiAgY29uc3QgbWV0YU1hbmFnZXIgPSBuZXcgQ29tTWV0YWRhdGFNYW5hZ2VyKGNvbnRleHQuYXBpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdNb3VudCAmIEJsYWRlIElJOlxcdEJhbm5lcmxvcmQnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJy4nLFxyXG4gICAgZ2V0R2FtZVZlcnNpb246IHJlc29sdmVHYW1lVmVyc2lvbixcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBCQU5ORVJMT1JEX0VYRUMsXHJcbiAgICBzZXR1cDogKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5LCBtZXRhTWFuYWdlciksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgIEJBTk5FUkxPUkRfRVhFQyxcclxuICAgIF0sXHJcbiAgICBwYXJhbWV0ZXJzOiBbXSxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNQVBQX0lELnRvU3RyaW5nKCksXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiBTVEVBTUFQUF9JRCxcclxuICAgICAgZXBpY0FwcElkOiBFUElDQVBQX0lELFxyXG4gICAgICBjdXN0b21PcGVuTW9kc1BhdGg6IE1PRFVMRVMsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXHJcbiAgICAnbW91bnRhbmRibGFkZTJfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSUNvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ01vdW50IGFuZCBCbGFkZSAyIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICAvLyBSZWdpc3RlciB0aGUgTE8gcGFnZS5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKTtcclxuICAgIH0sXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBwcmVTb3J0OiAoaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSkgPT5cclxuICAgICAgcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlciksXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcikgPT4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIGl0ZW1SZW5kZXJlcjogQ3VzdG9tSXRlbVJlbmRlcmVyLmRlZmF1bHQsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2Jhbm5lcmxvcmRyb290bW9kJywgMjAsIHRlc3RSb290TW9kLCBpbnN0YWxsUm9vdE1vZCk7XHJcblxyXG4gIC8vIEluc3RhbGxzIG9uZSBvciBtb3JlIHN1Ym1vZHVsZXMuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHN1Ym1vZHVsZXMnLCAyNSwgdGVzdEZvclN1Ym1vZHVsZXMsIGluc3RhbGxTdWJNb2R1bGVzKTtcclxuXHJcbiAgLy8gQSB2ZXJ5IHNpbXBsZSBtaWdyYXRpb24gdGhhdCBpbnRlbmRzIHRvIGFkZCB0aGUgc3ViTW9kSWRzIGF0dHJpYnV0ZVxyXG4gIC8vICB0byBtb2RzIHRoYXQgYWN0IGFzIFwibW9kIHBhY2tzXCIuIFRoaXMgbWlncmF0aW9uIGlzIG5vbi1pbnZhc2l2ZSBhbmQgd2lsbFxyXG4gIC8vICBub3QgcmVwb3J0IGFueSBlcnJvcnMuIFNpZGUgZWZmZWN0cyBvZiB0aGUgbWlncmF0aW9uIG5vdCB3b3JraW5nIGNvcnJlY3RseVxyXG4gIC8vICB3aWxsIG5vdCBhZmZlY3QgdGhlIHVzZXIncyBleGlzdGluZyBlbnZpcm9ubWVudC5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDI2KGNvbnRleHQuYXBpLCBvbGQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDQ1KGNvbnRleHQuYXBpLCBvbGQpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZ2VuZXJpYy1sb2FkLW9yZGVyLWljb25zJywgMjAwLFxyXG4gICAgX0lTX1NPUlRJTkcgPyAnc3Bpbm5lcicgOiAnbG9vdC1zb3J0Jywge30sICdBdXRvIFNvcnQnLCAoKSA9PiB7XHJcbiAgICAgIHNvcnRJbXBsKGNvbnRleHQsIG1ldGFNYW5hZ2VyKTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PlxyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2ZpbGVJZCwgbWV0YU1hbmFnZXIpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PlxyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2ZpbGVJZCwgbWV0YU1hbmFnZXIpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZSkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZj8uaWQsIG1ldGFNYW5hZ2VyKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgYXN5bmMgKHByb2ZpbGVJZCwgZmlsZXMpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICAvLyBkb24ndCBjYXJlIGFib3V0IGFueSBvdGhlciBnYW1lc1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgICAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuXHJcbiAgICAgIGF3YWl0IEJsdWViaXJkLm1hcChmaWxlcywgYXN5bmMgKGVudHJ5OiB7IGZpbGVQYXRoOiBzdHJpbmcsIGNhbmRpZGF0ZXM6IHN0cmluZ1tdIH0pID0+IHtcclxuICAgICAgICAvLyBvbmx5IGFjdCBpZiB3ZSBkZWZpbml0aXZlbHkga25vdyB3aGljaCBtb2Qgb3ducyB0aGUgZmlsZVxyXG4gICAgICAgIGlmIChlbnRyeS5jYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLnBlcnNpc3RlbnQubW9kcyxcclxuICAgICAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLCB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZFBhdGhzW21vZC50eXBlID8/ICcnXSwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmlkLCByZWxQYXRoKTtcclxuICAgICAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LlxyXG4gICAgICAgICAgLy8gIFRoYXQgd2F5LCB2b3J0ZXggd2lsbCBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3RcclxuICAgICAgICAgIC8vICBkZXBsb3ltZW50IG1ldGhvZCBhbmQgbm90IGFzayB0aGUgdXNlciBhbnkgcXVlc3Rpb25zXHJcbiAgICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgdGFyZ2V0IGRlc3RpbmF0aW9uIGZpbGUgaWYgaXQgZXhpc3RzLlxyXG4gICAgICAgICAgLy8gIHRoaXMgaXMgdG8gY29tcGxldGVseSBhdm9pZCBhIHNjZW5hcmlvIHdoZXJlIHdlIG1heSBhdHRlbXB0IHRvXHJcbiAgICAgICAgICAvLyAgY29weSB0aGUgc2FtZSBmaWxlIG9udG8gaXRzZWxmLlxyXG4gICAgICAgICAgcmV0dXJuIGZzLnJlbW92ZUFzeW5jKHRhcmdldFBhdGgpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIHRhcmdldFBhdGgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCkpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gaW1wb3J0IGFkZGVkIGZpbGUgdG8gbW9kJywgZXJyLm1lc3NhZ2UpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=