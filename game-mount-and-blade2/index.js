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
        result.push(node);
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
    const getNextAvailable = (accum, idx) => {
        const entries = Object.values(accum);
        while (entries.find(entry => entry.pos === idx) !== undefined) {
            idx++;
        }
        return idx;
    };
    const newOrder = [].concat(sortedLocked, sortedSubMods).reduce((accum, id, idx) => {
        var _a, _b;
        const vortexId = CACHE[id].vortexId;
        const newEntry = {
            pos: ((_a = loadOrder[vortexId]) === null || _a === void 0 ? void 0 : _a.locked) === true
                ? loadOrder[vortexId].pos
                : getNextAvailable(accum, idx),
            enabled: CACHE[id].isOfficial
                ? true
                : (!!loadOrder[vortexId])
                    ? loadOrder[vortexId].enabled
                    : true,
            locked: (((_b = loadOrder[vortexId]) === null || _b === void 0 ? void 0 : _b.locked) === true),
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
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUV0Qyw4REFBcUM7QUFFckMsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBa0Y7QUFDbEYsaUNBQW1GO0FBRW5GLHFDQUdrQjtBQUNsQiw4RUFBc0Q7QUFDdEQsNkNBQXNEO0FBRXRELDhFQUFzRDtBQUN0RCwrQ0FBc0c7QUFFdEcsMkRBQXFGO0FBQ3JGLHNGQUE4RDtBQUU5RCx5Q0FBeUM7QUFFekMsZ0VBQXdDO0FBRXhDLE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7QUFDekcsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBRTdHLElBQUksUUFBUSxDQUFDO0FBRWIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDN0MsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQzNCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQztBQU0vQixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTO0lBQ3BFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFFL0MsTUFBTSxlQUFlLEdBQUcsSUFBQSx3QkFBWSxFQUFDLHlCQUF5QixFQUM1RCxDQUFDLFNBQWlCLEVBQUUsSUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxD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RUFBRSxDQUFDLGVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQzt5QkFDcEQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3lCQUMxQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLG9DQUFvQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUNsRjtZQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvbWlzZSBhcyBCbHVlYmlyZCB9IGZyb20gJ2JsdWViaXJkJztcclxuXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgQlMgZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuXHJcbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGFjdGlvbnMsIEZsZXhMYXlvdXQsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgZ2V0RWxlbWVudFZhbHVlLCBnZXRYTUxEYXRhLCByZWZyZXNoR2FtZVBhcmFtcywgd2Fsa0FzeW5jIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7XHJcbiAgQkFOTkVSTE9SRF9FWEVDLCBHQU1FX0lELCBJMThOX05BTUVTUEFDRSwgTE9DS0VEX01PRFVMRVMsXHJcbiAgTU9EVUxFUywgT0ZGSUNJQUxfTU9EVUxFUywgU1VCTU9EX0ZJTEVcclxufSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBDdXN0b21JdGVtUmVuZGVyZXIgZnJvbSAnLi9jdXN0b21JdGVtUmVuZGVyZXInO1xyXG5pbXBvcnQgeyBtaWdyYXRlMDI2LCBtaWdyYXRlMDQ1IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCBDb21NZXRhZGF0YU1hbmFnZXIgZnJvbSAnLi9Db21NZXRhZGF0YU1hbmFnZXInO1xyXG5pbXBvcnQgeyBnZXRDYWNoZSwgZ2V0TGF1bmNoZXJEYXRhLCBpc0ludmFsaWQsIHBhcnNlTGF1bmNoZXJEYXRhLCByZWZyZXNoQ2FjaGUgfSBmcm9tICcuL3N1Yk1vZENhY2hlJztcclxuaW1wb3J0IHsgSVNvcnRQcm9wcywgSVN1Yk1vZENhY2hlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuaW1wb3J0IHsgSUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgeyBjcmVhdGVBY3Rpb24gfSBmcm9tICdyZWR1eC1hY3QnO1xyXG5cclxuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vdmlld3MvU2V0dGluZ3MnO1xyXG5cclxuY29uc3QgTEFVTkNIRVJfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XHJcbmNvbnN0IE1PRERJTkdfS0lUX0VYRUMgPSBwYXRoLmpvaW4oJ2JpbicsICdXaW42NF9TaGlwcGluZ193RWRpdG9yJywgJ1RhbGVXb3JsZHMuTW91bnRBbmRCbGFkZS5MYXVuY2hlci5leGUnKTtcclxuXHJcbmxldCBTVE9SRV9JRDtcclxuXHJcbmNvbnN0IEdPR19JRFMgPSBbJzE4MDI1Mzk1MjYnLCAnMTU2NDc4MTQ5NCddO1xyXG5jb25zdCBTVEVBTUFQUF9JRCA9IDI2MTU1MDtcclxuY29uc3QgRVBJQ0FQUF9JRCA9ICdDaGlja2FkZWUnO1xyXG5cclxuLy8gQSBzZXQgb2YgZm9sZGVyIG5hbWVzIChsb3dlcmNhc2VkKSB3aGljaCBhcmUgYXZhaWxhYmxlIGFsb25nc2lkZSB0aGVcclxuLy8gIGdhbWUncyBtb2R1bGVzIGZvbGRlci4gV2UgY291bGQndmUgdXNlZCB0aGUgZm9tb2QgaW5zdGFsbGVyIHN0b3AgcGF0dGVybnNcclxuLy8gIGZ1bmN0aW9uYWxpdHkgZm9yIHRoaXMsIGJ1dCBpdCdzIGJldHRlciBpZiB0aGlzIGV4dGVuc2lvbiBpcyBzZWxmIGNvbnRhaW5lZDtcclxuLy8gIGVzcGVjaWFsbHkgZ2l2ZW4gdGhhdCB0aGUgZ2FtZSdzIG1vZGRpbmcgcGF0dGVybiBjaGFuZ2VzIHF1aXRlIG9mdGVuLlxyXG5jb25zdCBST09UX0ZPTERFUlMgPSBuZXcgU2V0KFsnYmluJywgJ2RhdGEnLCAnZ3VpJywgJ2ljb25zJywgJ21vZHVsZXMnLFxyXG4gICdtdXNpYycsICdzaGFkZXJzJywgJ3NvdW5kcycsICd4bWxzY2hlbWFzJ10pO1xyXG5cclxuY29uc3Qgc2V0U29ydE9uRGVwbG95ID0gY3JlYXRlQWN0aW9uKCdNTkIyX1NFVF9TT1JUX09OX0RFUExPWScsXHJcbiAgKHByb2ZpbGVJZDogc3RyaW5nLCBzb3J0OiBib29sZWFuKSA9PiAoeyBwcm9maWxlSWQsIHNvcnQgfSkpO1xyXG5jb25zdCByZWR1Y2VyOiB0eXBlcy5JUmVkdWNlclNwZWMgPSB7XHJcbiAgcmVkdWNlcnM6IHtcclxuICAgIFtzZXRTb3J0T25EZXBsb3kgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PlxyXG4gICAgICB1dGlsLnNldFNhZmUoc3RhdGUsIFsnc29ydE9uRGVwbG95JywgcGF5bG9hZC5wcm9maWxlSWRdLCBwYXlsb2FkLnNvcnQpXHJcbiAgfSxcclxuICBkZWZhdWx0czoge1xyXG4gICAgc29ydE9uRGVwbG95OiB7fSxcclxuICB9LFxyXG59O1xyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtFUElDQVBQX0lELCBTVEVBTUFQUF9JRC50b1N0cmluZygpLCAuLi5HT0dfSURTXSlcclxuICAgIC50aGVuKGdhbWUgPT4ge1xyXG4gICAgICBTVE9SRV9JRCA9IGdhbWUuZ2FtZVN0b3JlSWQ7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZ2FtZS5nYW1lUGF0aCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RNb2QoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBEaWZmZXJlbnQgZ2FtZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IG1vZHNGaWxlID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpICE9PSAtMSk7XHJcbiAgaWYgKG1vZHNGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFRoZXJlJ3Mgbm8gTW9kdWxlcyBmb2xkZXIuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpZHggPSBtb2RzRmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IHJvb3RGb2xkZXJNYXRjaGVzID0gbG93ZXJlZC5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuICgoKHNlZ21lbnRzLmxlbmd0aCAtIDEpID4gaWR4KSAmJiBST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pKTtcclxuICB9KSB8fCBbXTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogKHJvb3RGb2xkZXJNYXRjaGVzLmxlbmd0aCA+IDApLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IG1vZHVsZUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKSAhPT0gLTEpO1xyXG4gIGNvbnN0IGlkeCA9IG1vZHVsZUZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUyk7XHJcbiAgY29uc3Qgc3ViTW9kcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5tYXAoc3ViTW9kcywgYXN5bmMgKG1vZEZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSksICdJZCcpO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoc3ViTW9kSWQpO1xyXG4gIH0pXHJcbiAgLnRoZW4oKHN1Yk1vZElkczogc3RyaW5nW10pID0+IHtcclxuICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICBjb25zdCBsYXN0RWxlbWVudElkeCA9IHNlZ21lbnRzLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgICAvLyBJZ25vcmUgZGlyZWN0b3JpZXMgYW5kIGVuc3VyZSB0aGF0IHRoZSBmaWxlIGNvbnRhaW5zIGEga25vd24gcm9vdCBmb2xkZXIgYXRcclxuICAgICAgLy8gIHRoZSBleHBlY3RlZCBpbmRleC5cclxuICAgICAgcmV0dXJuIChST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pXHJcbiAgICAgICAgJiYgKHBhdGguZXh0bmFtZShzZWdtZW50c1tsYXN0RWxlbWVudElkeF0pICE9PSAnJykpO1xyXG4gICAgICB9KTtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBzdWJNb2RJZHMubGVuZ3RoID4gMFxyXG4gICAgICA/IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgICAgICAgIGtleTogJ3N1Yk1vZElkcycsXHJcbiAgICAgICAgICAgIHZhbHVlOiBzdWJNb2RJZHMsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF1cclxuICAgICAgOiBbXTtcclxuICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IGF0dHJpYnV0ZXMuY29uY2F0KGZpbHRlcmVkLm1hcChmaWxlID0+IHtcclxuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBmaWxlLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoaWR4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbixcclxuICAgICAgfTtcclxuICAgIH0pKTtcclxuXHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdEZvclN1Ym1vZHVsZXMoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIENoZWNrIHRoaXMgaXMgYSBtb2QgZm9yIEJhbm5lcmxvcmQgYW5kIGl0IGNvbnRhaW5zIGEgU3ViTW9kdWxlLnhtbFxyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU3ViTW9kdWxlcyhmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIHN0cmFpZ2h0IGF3YXkuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuIHBhdGguZXh0bmFtZShzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSkgIT09ICcnO1xyXG4gIH0pO1xyXG4gIGNvbnN0IHN1Yk1vZElkcyA9IFtdO1xyXG4gIGNvbnN0IHN1Yk1vZHMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKHN1Yk1vZHMsIGFzeW5jIChhY2N1bSwgbW9kRmlsZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IG1vZEZpbGUuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgY29uc3Qgc3ViTW9kSWQgPSBhd2FpdCBnZXRFbGVtZW50VmFsdWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSksICdJZCcpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IChzZWdtZW50cy5sZW5ndGggPiAxKVxyXG4gICAgICA/IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDJdXHJcbiAgICAgIDogc3ViTW9kSWQ7XHJcbiAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBTdWJtb2R1bGUueG1sIGZpbGUgLSBpbmZvcm0gdGhlIG1vZCBhdXRob3InKSk7XHJcbiAgICB9XHJcbiAgICBzdWJNb2RJZHMucHVzaChzdWJNb2RJZCk7XHJcbiAgICBjb25zdCBpZHggPSBtb2RGaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihTVUJNT0RfRklMRSk7XHJcbiAgICAvLyBGaWx0ZXIgdGhlIG1vZCBmaWxlcyBmb3IgdGhpcyBzcGVjaWZpYyBzdWJtb2R1bGUuXHJcbiAgICBjb25zdCBzdWJNb2RGaWxlczogc3RyaW5nW11cclxuICAgICAgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBmaWxlLnNsaWNlKDAsIGlkeCkgPT09IG1vZEZpbGUuc2xpY2UoMCwgaWR4KSk7XHJcbiAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBzdWJNb2RGaWxlcy5tYXAoKG1vZEZpbGU6IHN0cmluZykgPT4gKHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IG1vZEZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oTU9EVUxFUywgbW9kTmFtZSwgbW9kRmlsZS5zbGljZShpZHgpKSxcclxuICAgIH0pKTtcclxuICAgIHJldHVybiBhY2N1bS5jb25jYXQoaW5zdHJ1Y3Rpb25zKTtcclxuICB9LCBbXSlcclxuICAudGhlbihtZXJnZWQgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWRzQXR0ciA9IHtcclxuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgIGtleTogJ3N1Yk1vZElkcycsXHJcbiAgICAgIHZhbHVlOiBzdWJNb2RJZHMsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9uczogW10uY29uY2F0KG1lcmdlZCwgW3N1Yk1vZElkc0F0dHJdKSB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZW5zdXJlT2ZmaWNpYWxMYXVuY2hlcihjb250ZXh0LCBkaXNjb3ZlcnkpIHtcclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLmFkZERpc2NvdmVyZWRUb29sKEdBTUVfSUQsICdUYWxlV29ybGRzQmFubmVybG9yZExhdW5jaGVyJywge1xyXG4gICAgaWQ6ICdUYWxlV29ybGRzQmFubmVybG9yZExhdW5jaGVyJyxcclxuICAgIG5hbWU6ICdPZmZpY2lhbCBMYXVuY2hlcicsXHJcbiAgICBsb2dvOiAndHdsYXVuY2hlci5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gcGF0aC5iYXNlbmFtZShMQVVOQ0hFUl9FWEVDKSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgcGF0aC5iYXNlbmFtZShMQVVOQ0hFUl9FWEVDKSxcclxuICAgIF0sXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIExBVU5DSEVSX0VYRUMpLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JyksXHJcbiAgICBoaWRkZW46IGZhbHNlLFxyXG4gICAgY3VzdG9tOiBmYWxzZSxcclxuICB9LCBmYWxzZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRNb2RkaW5nVG9vbChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWRkZW4/OiBib29sZWFuKSB7XHJcbiAgY29uc3QgdG9vbElkID0gJ2Jhbm5lcmxvcmQtc2RrJztcclxuICBjb25zdCBleGVjID0gcGF0aC5iYXNlbmFtZShNT0RESU5HX0tJVF9FWEVDKTtcclxuICBjb25zdCB0b29sID0ge1xyXG4gICAgaWQ6IHRvb2xJZCxcclxuICAgIG5hbWU6ICdNb2RkaW5nIEtpdCcsXHJcbiAgICBsb2dvOiAndHdsYXVuY2hlci5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gZXhlYyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFsgZXhlYyBdLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RESU5HX0tJVF9FWEVDKSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhjbHVzaXZlOiB0cnVlLFxyXG4gICAgd29ya2luZ0RpcmVjdG9yeTogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBwYXRoLmRpcm5hbWUoTU9ERElOR19LSVRfRVhFQykpLFxyXG4gICAgaGlkZGVuLFxyXG4gICAgY3VzdG9tOiBmYWxzZSxcclxuICB9O1xyXG5cclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLmFkZERpc2NvdmVyZWRUb29sKEdBTUVfSUQsIHRvb2xJZCwgdG9vbCwgZmFsc2UpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5LCBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XHJcbiAgLy8gUXVpY2tseSBlbnN1cmUgdGhhdCB0aGUgb2ZmaWNpYWwgTGF1bmNoZXIgaXMgYWRkZWQuXHJcbiAgZW5zdXJlT2ZmaWNpYWxMYXVuY2hlcihjb250ZXh0LCBkaXNjb3ZlcnkpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RESU5HX0tJVF9FWEVDKSk7XHJcbiAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgdG9vbHMgPSBkaXNjb3Zlcnk/LnRvb2xzO1xyXG4gICAgaWYgKCh0b29scyAhPT0gdW5kZWZpbmVkKVxyXG4gICAgJiYgKHV0aWwuZ2V0U2FmZSh0b29scywgWydiYW5uZXJsb3JkLXNkayddLCB1bmRlZmluZWQpICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIHNldE1vZGRpbmdUb29sKGNvbnRleHQsIGRpc2NvdmVyeSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBJZiBnYW1lIHN0b3JlIG5vdCBmb3VuZCwgbG9jYXRpb24gbWF5IGJlIHNldCBtYW51YWxseSAtIGFsbG93IHNldHVwXHJcbiAgLy8gIGZ1bmN0aW9uIHRvIGNvbnRpbnVlLlxyXG4gIGNvbnN0IGZpbmRTdG9yZUlkID0gKCkgPT4gZmluZEdhbWUoKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGNvbnN0IHN0YXJ0U3RlYW0gPSAoKSA9PiBmaW5kU3RvcmVJZCgpXHJcbiAgICAudGhlbigoKSA9PiAoU1RPUkVfSUQgPT09ICdzdGVhbScpXHJcbiAgICAgID8gdXRpbC5HYW1lU3RvcmVIZWxwZXIubGF1bmNoR2FtZVN0b3JlKGNvbnRleHQuYXBpLCBTVE9SRV9JRCwgdW5kZWZpbmVkLCB0cnVlKVxyXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSgpKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgd2UndmUgYWxyZWFkeSBzZXQgdGhlIGxvYWQgb3JkZXIgb2JqZWN0IGZvciB0aGlzIHByb2ZpbGVcclxuICAvLyAgYW5kIGNyZWF0ZSBpdCBpZiB3ZSBoYXZlbid0LlxyXG4gIHJldHVybiBzdGFydFN0ZWFtKCkudGhlbigoKSA9PiBwYXJzZUxhdW5jaGVyRGF0YSgpKS50aGVuKGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0LCBtZXRhTWFuYWdlcik7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgbGFzdEFjdGl2ZSA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKGxhc3RBY3RpdmUpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGRvIGEgcXVpY2sgdFNvcnQgYXQgdGhpcyBwb2ludCAtIG5vdCBnb2luZyB0b1xyXG4gICAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxyXG4gICAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKSA/PyB7fTtcclxuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIGNvbnN0IHNvcnRlZCA9IHRTb3J0KHsgc3ViTW9kSWRzOiBtb2RJZHMsIGFsbG93TG9ja2VkOiB0cnVlLCBtZXRhTWFuYWdlciB9KTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuTm90Rm91bmQpIHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxyXG4gICAgICAgICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgdGhyb3VnaCB0aGUgb2ZmaWNpYWwgZ2FtZSBsYXVuY2hlciBhbmQgJ1xyXG4gICAgICArICd0cnkgYWdhaW4nLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBmaW5kIGdhbWUgbGF1bmNoZXIgZGF0YScsXHJcbiAgICAgICAgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9KVxyXG4gIC5maW5hbGx5KCgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFZhbGlkIHVzZSBjYXNlIHdoZW4gYXR0ZW1wdGluZyB0byBzd2l0Y2ggdG9cclxuICAgICAgLy8gIEJhbm5lcmxvcmQgd2l0aG91dCBhbnkgYWN0aXZlIHByb2ZpbGUuXHJcbiAgICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCB7fSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRTb3J0KHNvcnRQcm9wczogSVNvcnRQcm9wcywgdGVzdDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgY29uc3QgeyBzdWJNb2RJZHMsIGFsbG93TG9ja2VkLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0gPSBzb3J0UHJvcHM7XHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIC8vIFRvcG9sb2dpY2FsIHNvcnQgLSB3ZSBuZWVkIHRvOlxyXG4gIC8vICAtIElkZW50aWZ5IGN5Y2xpYyBkZXBlbmRlbmNpZXMuXHJcbiAgLy8gIC0gSWRlbnRpZnkgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgLy8gIC0gV2Ugd2lsbCB0cnkgdG8gaWRlbnRpZnkgaW5jb21wYXRpYmxlIGRlcGVuZGVuY2llcyAodmVyc2lvbi13aXNlKVxyXG5cclxuICAvLyBUaGVzZSBhcmUgbWFudWFsbHkgbG9ja2VkIG1vZCBlbnRyaWVzLlxyXG4gIGNvbnN0IGxvY2tlZFN1Yk1vZHMgPSAoISFsb2FkT3JkZXIpXHJcbiAgICA/IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kSWQgPT4ge1xyXG4gICAgICBjb25zdCBlbnRyeSA9IENBQ0hFW3N1Yk1vZElkXTtcclxuICAgICAgcmV0dXJuICghIWVudHJ5KVxyXG4gICAgICAgID8gISFsb2FkT3JkZXJbZW50cnkudm9ydGV4SWRdPy5sb2NrZWRcclxuICAgICAgICA6IGZhbHNlO1xyXG4gICAgfSlcclxuICAgIDogW107XHJcbiAgY29uc3QgYWxwaGFiZXRpY2FsID0gc3ViTW9kSWRzLmZpbHRlcihzdWJNb2QgPT4gIWxvY2tlZFN1Yk1vZHMuaW5jbHVkZXMoc3ViTW9kKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgpO1xyXG4gIGNvbnN0IGdyYXBoID0gYWxwaGFiZXRpY2FsLnJlZHVjZSgoYWNjdW0sIGVudHJ5KSA9PiB7XHJcbiAgICBjb25zdCBkZXBJZHMgPSBbLi4uQ0FDSEVbZW50cnldLmRlcGVuZGVuY2llc10ubWFwKGRlcCA9PiBkZXAuaWQpO1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBub2RlIGdyYXBoLlxyXG4gICAgYWNjdW1bZW50cnldID0gZGVwSWRzLnNvcnQoKTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIC8vIFdpbGwgc3RvcmUgdGhlIGZpbmFsIExPIHJlc3VsdFxyXG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG5cclxuICAvLyBUaGUgbm9kZXMgd2UgaGF2ZSB2aXNpdGVkL3Byb2Nlc3NlZC5cclxuICBjb25zdCB2aXNpdGVkID0gW107XHJcblxyXG4gIC8vIFRoZSBub2RlcyB3aGljaCBhcmUgc3RpbGwgcHJvY2Vzc2luZy5cclxuICBjb25zdCBwcm9jZXNzaW5nID0gW107XHJcblxyXG4gIGNvbnN0IHRvcFNvcnQgPSAobm9kZSwgaXNPcHRpb25hbCA9IGZhbHNlKSA9PiB7XHJcbiAgICBpZiAoaXNPcHRpb25hbCAmJiAhT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKG5vZGUpKSB7XHJcbiAgICAgIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzaW5nW25vZGVdID0gdHJ1ZTtcclxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9ICghIWFsbG93TG9ja2VkKVxyXG4gICAgICA/IGdyYXBoW25vZGVdXHJcbiAgICAgIDogZ3JhcGhbbm9kZV0uZmlsdGVyKGVsZW1lbnQgPT4gIUxPQ0tFRF9NT0RVTEVTLmhhcyhlbGVtZW50KSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgIGlmIChwcm9jZXNzaW5nW2RlcF0pIHtcclxuICAgICAgICAvLyBDeWNsaWMgZGVwZW5kZW5jeSBkZXRlY3RlZCAtIGhpZ2hsaWdodCBib3RoIG1vZHMgYXMgaW52YWxpZFxyXG4gICAgICAgIC8vICB3aXRoaW4gdGhlIGNhY2hlIGl0c2VsZiAtIHdlIGFsc28gbmVlZCB0byBoaWdobGlnaHQgd2hpY2ggbW9kcy5cclxuICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmN5Y2xpYy5wdXNoKGRlcCk7XHJcbiAgICAgICAgQ0FDSEVbZGVwXS5pbnZhbGlkLmN5Y2xpYy5wdXNoKG5vZGUpO1xyXG5cclxuICAgICAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcclxuICAgICAgICBwcm9jZXNzaW5nW25vZGVdID0gZmFsc2U7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGluY29tcGF0aWJsZURlcHMgPSBDQUNIRVtub2RlXS5pbnZhbGlkLmluY29tcGF0aWJsZURlcHM7XHJcbiAgICAgIGNvbnN0IGluY0RlcCA9IGluY29tcGF0aWJsZURlcHMuZmluZChkID0+IGQuaWQgPT09IGRlcCk7XHJcbiAgICAgIGlmIChPYmplY3Qua2V5cyhncmFwaCkuaW5jbHVkZXMoZGVwKSAmJiAoaW5jRGVwID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgY29uc3QgZGVwVmVyID0gQ0FDSEVbZGVwXS5zdWJNb2RWZXI7XHJcbiAgICAgICAgY29uc3QgZGVwSW5zdCA9IENBQ0hFW25vZGVdLmRlcGVuZGVuY2llcy5maW5kKGQgPT4gZC5pZCA9PT0gZGVwKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBzZW12ZXIuc2F0aXNmaWVzKGRlcEluc3QudmVyc2lvbiwgZGVwVmVyKTtcclxuICAgICAgICAgIGlmICghbWF0Y2ggJiYgISFkZXBJbnN0Py52ZXJzaW9uICYmICEhZGVwVmVyKSB7XHJcbiAgICAgICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQuaW5jb21wYXRpYmxlRGVwcy5wdXNoKHtcclxuICAgICAgICAgICAgICBpZDogZGVwLFxyXG4gICAgICAgICAgICAgIHJlcXVpcmVkVmVyc2lvbjogZGVwSW5zdC52ZXJzaW9uLFxyXG4gICAgICAgICAgICAgIGN1cnJlbnRWZXJzaW9uOiBkZXBWZXIsXHJcbiAgICAgICAgICAgICAgaW5jb21wYXRpYmxlOiBkZXBJbnN0LmluY29tcGF0aWJsZSxcclxuICAgICAgICAgICAgICBvcHRpb25hbDogZGVwSW5zdC5vcHRpb25hbCxcclxuICAgICAgICAgICAgICBvcmRlcjogZGVwSW5zdC5vcmRlcixcclxuICAgICAgICAgICAgICB2ZXJzaW9uOiBkZXBJbnN0LnZlcnNpb24sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gT2sgc28gd2UgZGlkbid0IG1hbmFnZSB0byBjb21wYXJlIHRoZSB2ZXJzaW9ucywgd2UgbG9nIHRoaXMgYW5kXHJcbiAgICAgICAgICAvLyAgY29udGludWUuXHJcbiAgICAgICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byBjb21wYXJlIHZlcnNpb25zJywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG9wdGlvbmFsID0gbWV0YU1hbmFnZXIuaXNPcHRpb25hbChub2RlLCBkZXApO1xyXG4gICAgICBpZiAoIXZpc2l0ZWRbZGVwXSAmJiAhbG9ja2VkU3ViTW9kcy5pbmNsdWRlcyhkZXApKSB7XHJcbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhncmFwaCkuaW5jbHVkZXMoZGVwKSAmJiAhb3B0aW9uYWwpIHtcclxuICAgICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQubWlzc2luZy5wdXNoKGRlcCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRvcFNvcnQoZGVwLCBvcHRpb25hbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc2luZ1tub2RlXSA9IGZhbHNlO1xyXG4gICAgdmlzaXRlZFtub2RlXSA9IHRydWU7XHJcblxyXG4gICAgcmVzdWx0LnB1c2gobm9kZSk7XHJcbiAgfTtcclxuXHJcbiAgZm9yIChjb25zdCBub2RlIGluIGdyYXBoKSB7XHJcbiAgICBpZiAoIXZpc2l0ZWRbbm9kZV0gJiYgIXByb2Nlc3Npbmdbbm9kZV0pIHtcclxuICAgICAgdG9wU29ydChub2RlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChhbGxvd0xvY2tlZCkge1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8vIFByb3BlciB0b3BvbG9naWNhbCBzb3J0IGRpY3RhdGVzIHdlIHNpbXBseSByZXR1cm4gdGhlXHJcbiAgLy8gIHJlc3VsdCBhdCB0aGlzIHBvaW50LiBCdXQsIG1vZCBhdXRob3JzIHdhbnQgbW9kdWxlc1xyXG4gIC8vICB3aXRoIG5vIGRlcGVuZGVuY2llcyB0byBidWJibGUgdXAgdG8gdGhlIHRvcCBvZiB0aGUgTE8uXHJcbiAgLy8gIChUaGlzIHdpbGwgb25seSBhcHBseSB0byBub24gbG9ja2VkIGVudHJpZXMpXHJcbiAgY29uc3Qgc3ViTW9kc1dpdGhOb0RlcHMgPSByZXN1bHQuZmlsdGVyKGRlcCA9PiAoZ3JhcGhbZGVwXS5sZW5ndGggPT09IDApXHJcbiAgICB8fCAoZ3JhcGhbZGVwXS5maW5kKGQgPT4gIUxPQ0tFRF9NT0RVTEVTLmhhcyhkKSkgPT09IHVuZGVmaW5lZCkpLnNvcnQoKSB8fCBbXTtcclxuICBjb25zdCB0YW1wZXJlZFJlc3VsdCA9IFtdLmNvbmNhdChzdWJNb2RzV2l0aE5vRGVwcyxcclxuICAgIHJlc3VsdC5maWx0ZXIoZW50cnkgPT4gIXN1Yk1vZHNXaXRoTm9EZXBzLmluY2x1ZGVzKGVudHJ5KSkpO1xyXG4gIGxvY2tlZFN1Yk1vZHMuZm9yRWFjaChzdWJNb2RJZCA9PiB7XHJcbiAgICBjb25zdCBwb3MgPSBsb2FkT3JkZXJbQ0FDSEVbc3ViTW9kSWRdLnZvcnRleElkXS5wb3M7XHJcbiAgICB0YW1wZXJlZFJlc3VsdC5zcGxpY2UocG9zLCAwLCBbc3ViTW9kSWRdKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRhbXBlcmVkUmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0V4dGVybmFsKGNvbnRleHQsIHN1Yk1vZElkKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICBtb2RJZHMuZm9yRWFjaChtb2RJZCA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZHMgPSB1dGlsLmdldFNhZmUobW9kc1ttb2RJZF0sIFsnYXR0cmlidXRlcycsICdzdWJNb2RJZHMnXSwgW10pO1xyXG4gICAgaWYgKHN1Yk1vZElkcy5pbmNsdWRlcyhzdWJNb2RJZCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbmFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgZGVwbG95UHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAoKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gZGVwbG95UHJvZmlsZT8uZ2FtZUlkKSB8fCAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSkge1xyXG4gICAgLy8gRGVwbG95bWVudCBldmVudCBzZWVtcyB0byBiZSBleGVjdXRlZCBmb3IgYSBwcm9maWxlIG90aGVyXHJcbiAgICAvLyAgdGhhbiB0aGUgY3VycmVudGx5IGFjdGl2ZSBvbmUuIE5vdCBnb2luZyB0byBjb250aW51ZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGF3YWl0IG1ldGFNYW5hZ2VyLnVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0LCBtZXRhTWFuYWdlcik7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBQcm9jZXNzQ2FuY2VsZWQgbWVhbnMgdGhhdCB3ZSB3ZXJlIHVuYWJsZSB0byBzY2FuIGZvciBkZXBsb3llZFxyXG4gICAgLy8gIHN1Yk1vZHVsZXMsIHByb2JhYmx5IGJlY2F1c2UgZ2FtZSBkaXNjb3ZlcnkgaXMgaW5jb21wbGV0ZS5cclxuICAgIC8vIEl0J3MgYmV5b25kIHRoZSBzY29wZSBvZiB0aGlzIGZ1bmN0aW9uIHRvIHJlcG9ydCBkaXNjb3ZlcnlcclxuICAgIC8vICByZWxhdGVkIGlzc3Vlcy5cclxuICAgIHJldHVybiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwge30pO1xyXG5cclxuICBpZiAodXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ21vdW50YW5kYmxhZGUyJywgJ3NvcnRPbkRlcGxveScsIGFjdGl2ZVByb2ZpbGUuaWRdLCB0cnVlKSkge1xyXG4gICAgcmV0dXJuIHNvcnRJbXBsKGNvbnRleHQsIG1ldGFNYW5hZ2VyKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gV2UncmUgZ29pbmcgdG8gZG8gYSBxdWljayB0U29ydCBhdCB0aGlzIHBvaW50IC0gbm90IGdvaW5nIHRvXHJcbiAgICAvLyAgY2hhbmdlIHRoZSB1c2VyJ3MgbG9hZCBvcmRlciwgYnV0IHRoaXMgd2lsbCBoaWdobGlnaHQgYW55XHJcbiAgICAvLyAgY3ljbGljIG9yIG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gICAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gICAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gICAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xyXG4gICAgICBzdWJNb2RJZHM6IG1vZElkcyxcclxuICAgICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICAgIGxvYWRPcmRlcixcclxuICAgICAgbWV0YU1hbmFnZXIsXHJcbiAgICB9O1xyXG4gICAgY29uc3Qgc29ydGVkID0gdFNvcnQoc29ydFByb3BzLCB0cnVlKTtcclxuXHJcbiAgICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZWZyZXNoRnVuYygpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlcikge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCB8fCBhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgIUNBQ0hFKSB7XHJcbiAgICAvLyBSYWNlIGNvbmRpdGlvbiA/XHJcbiAgICByZXR1cm4gaXRlbXM7XHJcbiAgfVxyXG5cclxuICBsZXQgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gIGlmIChpdGVtcy5sZW5ndGggPiAwICYmIG1vZElkcy5sZW5ndGggPT09IDApIHtcclxuICAgIC8vIENhY2hlIGhhc24ndCBiZWVuIHBvcHVsYXRlZCB5ZXQuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBSZWZyZXNoIHRoZSBjYWNoZS5cclxuICAgICAgYXdhaXQgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBhY3RpdmVQcm9maWxlLmlkLCBtZXRhTWFuYWdlcik7XHJcbiAgICAgIG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIExvY2tlZCBpZHMgYXJlIGFsd2F5cyBhdCB0aGUgdG9wIG9mIHRoZSBsaXN0IGFzIGFsbFxyXG4gIC8vICBvdGhlciBtb2R1bGVzIGRlcGVuZCBvbiB0aGVzZS5cclxuICBsZXQgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG5cclxuICB0cnkge1xyXG4gICAgLy8gU29ydCB0aGUgbG9ja2VkIGlkcyBhbW9uZ3N0IHRoZW1zZWx2ZXMgdG8gZW5zdXJlXHJcbiAgICAvLyAgdGhhdCB0aGUgZ2FtZSByZWNlaXZlcyB0aGVzZSBpbiB0aGUgcmlnaHQgb3JkZXIuXHJcbiAgICBjb25zdCBzb3J0UHJvcHM6IElTb3J0UHJvcHMgPSB7XHJcbiAgICAgIHN1Yk1vZElkczogbG9ja2VkSWRzLFxyXG4gICAgICBhbGxvd0xvY2tlZDogdHJ1ZSxcclxuICAgICAgbWV0YU1hbmFnZXIsXHJcbiAgICB9O1xyXG4gICAgbG9ja2VkSWRzID0gdFNvcnQoc29ydFByb3BzKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy8gQ3JlYXRlIHRoZSBsb2NrZWQgZW50cmllcy5cclxuICBjb25zdCBsb2NrZWRJdGVtcyA9IGxvY2tlZElkcy5tYXAoaWQgPT4gKHtcclxuICAgIGlkOiBDQUNIRVtpZF0udm9ydGV4SWQsXHJcbiAgICBuYW1lOiBDQUNIRVtpZF0uc3ViTW9kTmFtZSxcclxuICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBsb2NrZWQ6IHRydWUsXHJcbiAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoaWQpLFxyXG4gIH0pKTtcclxuXHJcbiAgY29uc3QgTEFVTkNIRVJfREFUQSA9IGdldExhdW5jaGVyRGF0YSgpO1xyXG5cclxuICAvLyBFeHRlcm5hbCBpZHMgd2lsbCBpbmNsdWRlIG9mZmljaWFsIG1vZHVsZXMgYXMgd2VsbCBidXQgbm90IGxvY2tlZCBlbnRyaWVzLlxyXG4gIGNvbnN0IGV4dGVybmFsSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiAoIUNBQ0hFW2lkXS5pc0xvY2tlZCkgJiYgKENBQ0hFW2lkXS52b3J0ZXhJZCA9PT0gaWQpKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IExPa2V5cyA9ICgoT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPiAwKVxyXG4gICAgPyBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXHJcbiAgICA6IExBVU5DSEVSX0RBVEEuc2luZ2xlUGxheWVyU3ViTW9kcy5tYXAobW9kID0+IG1vZC5zdWJNb2RJZCkpO1xyXG5cclxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHRoYXQgYXJlIGFscmVhZHkgaW4gdGhlIGxvYWQgb3JkZXIuXHJcbiAgY29uc3Qga25vd25FeHQgPSBleHRlcm5hbElkcy5maWx0ZXIoaWQgPT4gTE9rZXlzLmluY2x1ZGVzKGlkKSkgfHwgW107XHJcblxyXG4gIC8vIEV4dGVybmFsIG1vZHVsZXMgd2hpY2ggYXJlIG5ldyBhbmQgaGF2ZSB5ZXQgdG8gYmUgYWRkZWQgdG8gdGhlIExPLlxyXG4gIGNvbnN0IHVua25vd25FeHQgPSBleHRlcm5hbElkcy5maWx0ZXIoaWQgPT4gIUxPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xyXG5cclxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+IHtcclxuICAgIC8vIFJlbW92ZSBhbnkgbG9ja2VkSWRzLCBidXQgYWxzbyBlbnN1cmUgdGhhdCB0aGVcclxuICAgIC8vICBlbnRyeSBjYW4gYmUgZm91bmQgaW4gdGhlIGNhY2hlLiBJZiBpdCdzIG5vdCBpbiB0aGVcclxuICAgIC8vICBjYWNoZSwgdGhpcyBtYXkgbWVhbiB0aGF0IHRoZSBzdWJtb2QgeG1sIGZpbGUgZmFpbGVkXHJcbiAgICAvLyAgcGFyc2UtaW5nIGFuZCB0aGVyZWZvcmUgc2hvdWxkIG5vdCBiZSBkaXNwbGF5ZWQuXHJcbiAgICBjb25zdCBpc0xvY2tlZCA9IGxvY2tlZElkcy5pbmNsdWRlcyhpdGVtLmlkKTtcclxuICAgIGNvbnN0IGhhc0NhY2hlRW50cnkgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT5cclxuICAgICAgQ0FDSEVba2V5XS52b3J0ZXhJZCA9PT0gaXRlbS5pZCkgIT09IHVuZGVmaW5lZDtcclxuICAgIHJldHVybiAhaXNMb2NrZWQgJiYgaGFzQ2FjaGVFbnRyeTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgcG9zTWFwID0ge307XHJcbiAgbGV0IG5leHRBdmFpbGFibGUgPSBMT2tleXMubGVuZ3RoO1xyXG4gIGNvbnN0IGdldE5leHRQb3MgPSAobG9JZCkgPT4ge1xyXG4gICAgaWYgKExPQ0tFRF9NT0RVTEVTLmhhcyhsb0lkKSkge1xyXG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShMT0NLRURfTU9EVUxFUykuaW5kZXhPZihsb0lkKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocG9zTWFwW2xvSWRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcG9zTWFwW2xvSWRdID0gbmV4dEF2YWlsYWJsZTtcclxuICAgICAgcmV0dXJuIG5leHRBdmFpbGFibGUrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBwb3NNYXBbbG9JZF07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAga25vd25FeHQubWFwKGtleSA9PiAoe1xyXG4gICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXHJcbiAgICBuYW1lOiBDQUNIRVtrZXldLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXHJcbiAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoa2V5KSxcclxuICB9KSlcclxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWF4LWxpbmUtbGVuZ3RoXHJcbiAgICAuc29ydCgoYSwgYikgPT4gKGxvYWRPcmRlclthLmlkXT8ucG9zIHx8IGdldE5leHRQb3MoYS5pZCkpIC0gKGxvYWRPcmRlcltiLmlkXT8ucG9zIHx8IGdldE5leHRQb3MoYi5pZCkpKVxyXG4gICAgLmZvckVhY2goa25vd24gPT4ge1xyXG4gICAgICAvLyBJZiB0aGlzIGEga25vd24gZXh0ZXJuYWwgbW9kdWxlIGFuZCBpcyBOT1QgaW4gdGhlIGl0ZW0gbGlzdCBhbHJlYWR5XHJcbiAgICAgIC8vICB3ZSBuZWVkIHRvIHJlLWluc2VydCBpbiB0aGUgY29ycmVjdCBpbmRleCBhcyBhbGwga25vd24gZXh0ZXJuYWwgbW9kdWxlc1xyXG4gICAgICAvLyAgYXQgdGhpcyBwb2ludCBhcmUgYWN0dWFsbHkgZGVwbG95ZWQgaW5zaWRlIHRoZSBtb2RzIGZvbGRlciBhbmQgc2hvdWxkXHJcbiAgICAgIC8vICBiZSBpbiB0aGUgaXRlbXMgbGlzdCFcclxuICAgICAgY29uc3QgZGlmZiA9IChMT2tleXMubGVuZ3RoKSAtIChMT2tleXMubGVuZ3RoIC0gQXJyYXkuZnJvbShMT0NLRURfTU9EVUxFUykubGVuZ3RoKTtcclxuICAgICAgaWYgKGl0ZW1zLmZpbmQoaXRlbSA9PiBpdGVtLmlkID09PSBrbm93bi5pZCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnN0IHBvcyA9IGxvYWRPcmRlcltrbm93bi5pZF0/LnBvcztcclxuICAgICAgICBjb25zdCBpZHggPSAocG9zICE9PSB1bmRlZmluZWQpID8gKHBvcyAtIGRpZmYpIDogKGdldE5leHRQb3Moa25vd24uaWQpIC0gZGlmZik7XHJcbiAgICAgICAgaXRlbXMuc3BsaWNlKGlkeCwgMCwga25vd24pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgdW5rbm93bkl0ZW1zID0gW10uY29uY2F0KHVua25vd25FeHQpXHJcbiAgICAubWFwKGtleSA9PiAoe1xyXG4gICAgICBpZDogQ0FDSEVba2V5XS52b3J0ZXhJZCxcclxuICAgICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxyXG4gICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICBleHRlcm5hbDogaXNFeHRlcm5hbChjb250ZXh0LCBDQUNIRVtrZXldLnZvcnRleElkKSxcclxuICAgICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXHJcbiAgICB9KSk7XHJcblxyXG4gIGNvbnN0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChsb2NrZWRJdGVtcywgaXRlbXMsIHVua25vd25JdGVtcyk7XHJcbiAgcmV0dXJuIChkaXJlY3Rpb24gPT09ICdkZXNjZW5kaW5nJylcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHByZVNvcnRlZC5yZXZlcnNlKCkpXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSB7XHJcbiAgY29uc3QgdCA9IGNvbnRleHQuYXBpLnRyYW5zbGF0ZTtcclxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2xvYWRvcmRlcmluZm8nIH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LCB0KCdNYW5hZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnWW91IGNhbiBhZGp1c3QgdGhlIGxvYWQgb3JkZXIgZm9yIEJhbm5lcmxvcmQgYnkgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIG1vZHMgdXAgb3IgZG93biBvbiB0aGlzIHBhZ2UuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIGtlZXAgaW4gbWluZCB0aGF0IEJhbm5lcmxvcmQgaXMgc3RpbGwgaW4gRWFybHkgQWNjZXNzLCB3aGljaCBtZWFucyB0aGF0IHRoZXJlIG1pZ2h0IGJlIHNpZ25pZmljYW50ICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnY2hhbmdlcyB0byB0aGUgZ2FtZSBhcyB0aW1lIGdvZXMgb24uIFBsZWFzZSBub3RpZnkgdXMgb2YgYW55IFZvcnRleCByZWxhdGVkIGlzc3VlcyB5b3UgZW5jb3VudGVyIHdpdGggdGhpcyAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2V4dGVuc2lvbiBzbyB3ZSBjYW4gZml4IGl0LiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhbmQgaGVscCBzZWU6ICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYScsIHsgb25DbGljazogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Nb2RkaW5nX0Jhbm5lcmxvcmRfd2l0aF9Wb3J0ZXgnKSB9LCB0KCdNb2RkaW5nIEJhbm5lcmxvcmQgd2l0aCBWb3J0ZXguJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnSG93IHRvIHVzZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQ2hlY2sgdGhlIGJveCBuZXh0IHRvIHRoZSBtb2RzIHlvdSB3YW50IHRvIGJlIGFjdGl2ZSBpbiB0aGUgZ2FtZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQ2xpY2sgQXV0byBTb3J0IGluIHRoZSB0b29sYmFyLiAoU2VlIGJlbG93IGZvciBkZXRhaWxzKS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnTWFrZSBzdXJlIHRvIHJ1biB0aGUgZ2FtZSBkaXJlY3RseSB2aWEgdGhlIFBsYXkgYnV0dG9uIGluIHRoZSB0b3AgbGVmdCBjb3JuZXIgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJyhvbiB0aGUgQmFubmVybG9yZCB0aWxlKS4gWW91ciBWb3J0ZXggbG9hZCBvcmRlciBtYXkgbm90IGJlIGxvYWRlZCBpZiB5b3UgcnVuIHRoZSBTaW5nbGUgUGxheWVyIGdhbWUgdGhyb3VnaCB0aGUgZ2FtZSBsYXVuY2hlci4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnT3B0aW9uYWw6IE1hbnVhbGx5IGRyYWcgYW5kIGRyb3AgbW9kcyB0byBkaWZmZXJlbnQgcG9zaXRpb25zIGluIHRoZSBsb2FkIG9yZGVyIChmb3IgdGVzdGluZyBkaWZmZXJlbnQgb3ZlcnJpZGVzKS4gTW9kcyBmdXJ0aGVyIGRvd24gdGhlIGxpc3Qgb3ZlcnJpZGUgbW9kcyBmdXJ0aGVyIHVwLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnUGxlYXNlIG5vdGU6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1RoZSBsb2FkIG9yZGVyIHJlZmxlY3RlZCBoZXJlIHdpbGwgb25seSBiZSBsb2FkZWQgaWYgeW91IHJ1biB0aGUgZ2FtZSB2aWEgdGhlIHBsYXkgYnV0dG9uIGluICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICd0aGUgdG9wIGxlZnQgY29ybmVyLiBEbyBub3QgcnVuIHRoZSBTaW5nbGUgUGxheWVyIGdhbWUgdGhyb3VnaCB0aGUgbGF1bmNoZXIsIGFzIHRoYXQgd2lsbCBpZ25vcmUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3RoZSBWb3J0ZXggbG9hZCBvcmRlciBhbmQgZ28gYnkgd2hhdCBpcyBzaG93biBpbiB0aGUgbGF1bmNoZXIgaW5zdGVhZC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnRm9yIEJhbm5lcmxvcmQsIG1vZHMgc29ydGVkIGZ1cnRoZXIgdG93YXJkcyB0aGUgYm90dG9tIG9mIHRoZSBsaXN0IHdpbGwgb3ZlcnJpZGUgbW9kcyBmdXJ0aGVyIHVwIChpZiB0aGV5IGNvbmZsaWN0KS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ05vdGU6IEhhcm1vbnkgcGF0Y2hlcyBtYXkgYmUgdGhlIGV4Y2VwdGlvbiB0byB0aGlzIHJ1bGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0F1dG8gU29ydCB1c2VzIHRoZSBTdWJNb2R1bGUueG1sIGZpbGVzICh0aGUgZW50cmllcyB1bmRlciA8RGVwZW5kZWRNb2R1bGVzPikgdG8gZGV0ZWN0ICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdkZXBlbmRlbmNpZXMgdG8gc29ydCBieS4gJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0lmIHlvdSBjYW5ub3Qgc2VlIHlvdXIgbW9kIGluIHRoaXMgbG9hZCBvcmRlciwgVm9ydGV4IG1heSBoYXZlIGJlZW4gdW5hYmxlIHRvIGZpbmQgb3IgcGFyc2UgaXRzIFN1Yk1vZHVsZS54bWwgZmlsZS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ01vc3QgLSBidXQgbm90IGFsbCBtb2RzIC0gY29tZSB3aXRoIG9yIG5lZWQgYSBTdWJNb2R1bGUueG1sIGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0hpdCB0aGUgZGVwbG95IGJ1dHRvbiB3aGVuZXZlciB5b3UgaW5zdGFsbCBhbmQgZW5hYmxlIGEgbmV3IG1vZC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnVGhlIGdhbWUgd2lsbCBub3QgbGF1bmNoIHVubGVzcyB0aGUgZ2FtZSBzdG9yZSAoU3RlYW0sIEVwaWMsIGV0YykgaXMgc3RhcnRlZCBiZWZvcmVoYW5kLiBJZiB5b3VcXCdyZSBnZXR0aW5nIHRoZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnXCJVbmFibGUgdG8gSW5pdGlhbGl6ZSBTdGVhbSBBUElcIiBlcnJvciwgcmVzdGFydCBTdGVhbS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnUmlnaHQgY2xpY2tpbmcgYW4gZW50cnkgd2lsbCBvcGVuIHRoZSBjb250ZXh0IG1lbnUgd2hpY2ggY2FuIGJlIHVzZWQgdG8gbG9jayBMTyBlbnRyaWVzIGludG8gcG9zaXRpb247IGVudHJ5IHdpbGwgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2JlIGlnbm9yZWQgYnkgYXV0by1zb3J0IG1haW50YWluaW5nIGl0cyBsb2NrZWQgcG9zaXRpb24uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlR2FtZVZlcnNpb24oZGlzY292ZXJ5UGF0aDogc3RyaW5nKSB7XHJcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAnZGV2ZWxvcG1lbnQnICYmIHNlbXZlci5zYXRpc2ZpZXModXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb24sICc8MS40LjAnKSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnbm90IHN1cHBvcnRlZCBpbiBvbGRlciBWb3J0ZXggdmVyc2lvbnMnKSk7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2V0WE1MRGF0YShwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgJ2JpbicsICdXaW42NF9TaGlwcGluZ19DbGllbnQnLCAnVmVyc2lvbi54bWwnKSk7XHJcbiAgICBjb25zdCBleGVQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsIEJBTk5FUkxPUkRfRVhFQyk7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGRhdGE/LlZlcnNpb24/LlNpbmdsZXBsYXllcj8uWzBdPy4kPy5WYWx1ZVxyXG4gICAgICAuc2xpY2UoMSlcclxuICAgICAgLnNwbGl0KCcuJylcclxuICAgICAgLnNsaWNlKDAsIDMpXHJcbiAgICAgIC5qb2luKCcuJyk7XHJcbiAgICByZXR1cm4gKHNlbXZlci52YWxpZCh2YWx1ZSkpID8gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKSA6IGdldFZlcnNpb24oZXhlUGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmxldCBfSVNfU09SVElORyA9IGZhbHNlO1xyXG5mdW5jdGlvbiBzb3J0SW1wbChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xyXG4gIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICBpZiAoIUNBQ0hFKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ0NhY2hlIGlzIHVuYXZhaWxhYmxlJyB9KTtcclxuICAgIF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBjb25zdCBsb2NrZWRJZHMgPSBtb2RJZHMuZmlsdGVyKGlkID0+IENBQ0hFW2lkXS5pc0xvY2tlZCk7XHJcbiAgY29uc3Qgc3ViTW9kSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiAhQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuXHJcbiAgbGV0IHNvcnRlZExvY2tlZCA9IFtdO1xyXG4gIGxldCBzb3J0ZWRTdWJNb2RzID0gW107XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBQcm9iYWJseSBiZXN0IHRoYXQgd2UgZG9uJ3QgcmVwb3J0IHRoaXMgdmlhIG5vdGlmaWNhdGlvbiBhcyBhIG51bWJlclxyXG4gICAgLy8gIG9mIHRoaW5ncyBtYXkgaGF2ZSBvY2N1cnJlZCB0aGF0IGNhdXNlZCB0aGlzIGlzc3VlLiBXZSBsb2cgaXQgaW5zdGVhZC5cclxuICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHNvcnQgbW9kcycsIHsgcmVhc29uOiAnTm8gYWN0aXZlIHByb2ZpbGUnIH0pO1xyXG4gICAgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBzb3J0ZWRMb2NrZWQgPSB0U29ydCh7IHN1Yk1vZElkczogbG9ja2VkSWRzLCBhbGxvd0xvY2tlZDogdHJ1ZSwgbWV0YU1hbmFnZXIgfSk7XHJcbiAgICBzb3J0ZWRTdWJNb2RzID0gdFNvcnQoeyBzdWJNb2RJZHMsIGFsbG93TG9ja2VkOiBmYWxzZSwgbG9hZE9yZGVyLCBtZXRhTWFuYWdlciB9LCB0cnVlKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNvcnQgbW9kcycsIGVycik7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBnZXROZXh0QXZhaWxhYmxlID0gKGFjY3VtLCBpZHgpID0+IHtcclxuICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3QudmFsdWVzKGFjY3VtKTtcclxuICAgIHdoaWxlIChlbnRyaWVzLmZpbmQoZW50cnkgPT4gKGVudHJ5IGFzIGFueSkucG9zID09PSBpZHgpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWR4Kys7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaWR4O1xyXG4gIH1cclxuICBjb25zdCBuZXdPcmRlciA9IFtdLmNvbmNhdChzb3J0ZWRMb2NrZWQsIHNvcnRlZFN1Yk1vZHMpLnJlZHVjZSgoYWNjdW0sIGlkLCBpZHgpID0+IHtcclxuICAgIGNvbnN0IHZvcnRleElkID0gQ0FDSEVbaWRdLnZvcnRleElkO1xyXG4gICAgY29uc3QgbmV3RW50cnkgPSB7XHJcbiAgICAgIHBvczogbG9hZE9yZGVyW3ZvcnRleElkXT8ubG9ja2VkID09PSB0cnVlXHJcbiAgICAgICAgPyBsb2FkT3JkZXJbdm9ydGV4SWRdLnBvc1xyXG4gICAgICAgIDogZ2V0TmV4dEF2YWlsYWJsZShhY2N1bSwgaWR4KSxcclxuICAgICAgZW5hYmxlZDogQ0FDSEVbaWRdLmlzT2ZmaWNpYWxcclxuICAgICAgICA/IHRydWVcclxuICAgICAgICA6ICghIWxvYWRPcmRlclt2b3J0ZXhJZF0pXHJcbiAgICAgICAgICA/IGxvYWRPcmRlclt2b3J0ZXhJZF0uZW5hYmxlZFxyXG4gICAgICAgICAgOiB0cnVlLFxyXG4gICAgICBsb2NrZWQ6IChsb2FkT3JkZXJbdm9ydGV4SWRdPy5sb2NrZWQgPT09IHRydWUpLFxyXG4gICAgfTtcclxuXHJcbiAgICBhY2N1bVt2b3J0ZXhJZF0gPSBuZXdFbnRyeTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKGFjdGl2ZVByb2ZpbGUuaWQsIG5ld09yZGVyKSk7XHJcbiAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIG5ld09yZGVyKVxyXG4gICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnbW5iMi1zb3J0LWZpbmlzaGVkJyxcclxuICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICBtZXNzYWdlOiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0ZpbmlzaGVkIHNvcnRpbmcnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgfSkpLmZpbmFsbHkoKCkgPT4gX0lTX1NPUlRJTkcgPSBmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnbW91bnRhbmRibGFkZTInXSwgcmVkdWNlcik7XHJcbiAgKGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncyBhcyBhbnkpKCdJbnRlcmZhY2UnLCBTZXR0aW5ncywgKCkgPT4gKHtcclxuICAgIHQ6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSxcclxuICAgIG9uU2V0U29ydE9uRGVwbG95OiAocHJvZmlsZUlkOiBzdHJpbmcsIHNvcnQ6IGJvb2xlYW4pID0+XHJcbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFNvcnRPbkRlcGxveShwcm9maWxlSWQsIHNvcnQpKSxcclxuICB9KSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIHJldHVybiBwcm9maWxlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEO1xyXG4gIH0sIDUxKTtcclxuXHJcbiAgY29uc3QgbWV0YU1hbmFnZXIgPSBuZXcgQ29tTWV0YWRhdGFNYW5hZ2VyKGNvbnRleHQuYXBpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdNb3VudCAmIEJsYWRlIElJOlxcdEJhbm5lcmxvcmQnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJy4nLFxyXG4gICAgZ2V0R2FtZVZlcnNpb246IHJlc29sdmVHYW1lVmVyc2lvbixcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBCQU5ORVJMT1JEX0VYRUMsXHJcbiAgICBzZXR1cDogKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5LCBtZXRhTWFuYWdlciksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgIEJBTk5FUkxPUkRfRVhFQyxcclxuICAgIF0sXHJcbiAgICBwYXJhbWV0ZXJzOiBbXSxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNQVBQX0lELnRvU3RyaW5nKCksXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiBTVEVBTUFQUF9JRCxcclxuICAgICAgZXBpY0FwcElkOiBFUElDQVBQX0lELFxyXG4gICAgICBjdXN0b21PcGVuTW9kc1BhdGg6IE1PRFVMRVMsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXHJcbiAgICAnbW91bnRhbmRibGFkZTJfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSUNvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ01vdW50IGFuZCBCbGFkZSAyIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICAvLyBSZWdpc3RlciB0aGUgTE8gcGFnZS5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKTtcclxuICAgIH0sXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBwcmVTb3J0OiAoaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSkgPT5cclxuICAgICAgcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlciksXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlcikgPT4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIGl0ZW1SZW5kZXJlcjogQ3VzdG9tSXRlbVJlbmRlcmVyLmRlZmF1bHQsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2Jhbm5lcmxvcmRyb290bW9kJywgMjAsIHRlc3RSb290TW9kLCBpbnN0YWxsUm9vdE1vZCk7XHJcblxyXG4gIC8vIEluc3RhbGxzIG9uZSBvciBtb3JlIHN1Ym1vZHVsZXMuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHN1Ym1vZHVsZXMnLCAyNSwgdGVzdEZvclN1Ym1vZHVsZXMsIGluc3RhbGxTdWJNb2R1bGVzKTtcclxuXHJcbiAgLy8gQSB2ZXJ5IHNpbXBsZSBtaWdyYXRpb24gdGhhdCBpbnRlbmRzIHRvIGFkZCB0aGUgc3ViTW9kSWRzIGF0dHJpYnV0ZVxyXG4gIC8vICB0byBtb2RzIHRoYXQgYWN0IGFzIFwibW9kIHBhY2tzXCIuIFRoaXMgbWlncmF0aW9uIGlzIG5vbi1pbnZhc2l2ZSBhbmQgd2lsbFxyXG4gIC8vICBub3QgcmVwb3J0IGFueSBlcnJvcnMuIFNpZGUgZWZmZWN0cyBvZiB0aGUgbWlncmF0aW9uIG5vdCB3b3JraW5nIGNvcnJlY3RseVxyXG4gIC8vICB3aWxsIG5vdCBhZmZlY3QgdGhlIHVzZXIncyBleGlzdGluZyBlbnZpcm9ubWVudC5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDI2KGNvbnRleHQuYXBpLCBvbGQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDQ1KGNvbnRleHQuYXBpLCBvbGQpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZ2VuZXJpYy1sb2FkLW9yZGVyLWljb25zJywgMjAwLFxyXG4gICAgX0lTX1NPUlRJTkcgPyAnc3Bpbm5lcicgOiAnbG9vdC1zb3J0Jywge30sICdBdXRvIFNvcnQnLCAoKSA9PiB7XHJcbiAgICAgIHNvcnRJbXBsKGNvbnRleHQsIG1ldGFNYW5hZ2VyKTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PlxyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2ZpbGVJZCwgbWV0YU1hbmFnZXIpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PlxyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2ZpbGVJZCwgbWV0YU1hbmFnZXIpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZSkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZj8uaWQsIG1ldGFNYW5hZ2VyKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgYXN5bmMgKHByb2ZpbGVJZCwgZmlsZXMpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXMgLSBvciBpZiB0aGUgcHJvZmlsZSBpcyBubyBsb25nZXIgdmFsaWQuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG5cclxuICAgICAgYXdhaXQgQmx1ZWJpcmQubWFwKGZpbGVzLCBhc3luYyAoZW50cnk6IHsgZmlsZVBhdGg6IHN0cmluZywgY2FuZGlkYXRlczogc3RyaW5nW10gfSkgPT4ge1xyXG4gICAgICAgIC8vIG9ubHkgYWN0IGlmIHdlIGRlZmluaXRpdmVseSBrbm93IHdoaWNoIG1vZCBvd25zIHRoZSBmaWxlXHJcbiAgICAgICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxyXG4gICAgICAgICAgICBbR0FNRV9JRCwgZW50cnkuY2FuZGlkYXRlc1swXV0sIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kUGF0aHNbbW9kLnR5cGUgPz8gJyddLCBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xyXG4gICAgICAgICAgLy8gY29weSB0aGUgbmV3IGZpbGUgYmFjayBpbnRvIHRoZSBjb3JyZXNwb25kaW5nIG1vZCwgdGhlbiBkZWxldGUgaXQuXHJcbiAgICAgICAgICAvLyAgVGhhdCB3YXksIHZvcnRleCB3aWxsIGNyZWF0ZSBhIGxpbmsgdG8gaXQgd2l0aCB0aGUgY29ycmVjdFxyXG4gICAgICAgICAgLy8gIGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcclxuICAgICAgICAgIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSk7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSB0YXJnZXQgZGVzdGluYXRpb24gZmlsZSBpZiBpdCBleGlzdHMuXHJcbiAgICAgICAgICAvLyAgdGhpcyBpcyB0byBjb21wbGV0ZWx5IGF2b2lkIGEgc2NlbmFyaW8gd2hlcmUgd2UgbWF5IGF0dGVtcHQgdG9cclxuICAgICAgICAgIC8vICBjb3B5IHRoZSBzYW1lIGZpbGUgb250byBpdHNlbGYuXHJcbiAgICAgICAgICByZXR1cm4gZnMucmVtb3ZlQXN5bmModGFyZ2V0UGF0aClcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKSlcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBpbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW4sXHJcbn07XHJcbiJdfQ==