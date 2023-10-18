"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQStDO0FBRS9DLDZDQUErQjtBQUMvQixvREFBc0M7QUFFdEMsOERBQXFDO0FBRXJDLGdEQUF3QjtBQUN4QixvREFBNEI7QUFDNUIsMkNBQWtGO0FBQ2xGLGlDQUFtRjtBQUVuRixxQ0FHa0I7QUFDbEIsOEVBQXNEO0FBQ3RELDZDQUFzRDtBQUV0RCw4RUFBc0Q7QUFDdEQsK0NBQXNHO0FBRXRHLDJEQUFxRjtBQUNyRixzRkFBOEQ7QUFFOUQseUNBQXlDO0FBRXpDLGdFQUF3QztBQUV4QyxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx1QkFBdUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBQ3pHLE1BQU0sZ0JBQWdCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztBQUU3RyxJQUFJLFFBQVEsQ0FBQztBQUViLE1BQU0sT0FBTyxHQUFHLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzdDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQztBQUMzQixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUM7QUFNL0IsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUztJQUNwRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO0FBRS9DLE1BQU0sZUFBZSxHQUFHLElBQUEsd0JBQVksRUFBQyx5QkFBeUIsRUFDNUQsQ0FBQyxTQUFpQixFQUFFLElBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVB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QUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7eUJBQ3BELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzt5QkFDMUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDbEY7WUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb21pc2UgYXMgQmx1ZWJpcmQgfSBmcm9tICdibHVlYmlyZCc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5cbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcblxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBnZXRFbGVtZW50VmFsdWUsIGdldFhNTERhdGEsIHJlZnJlc2hHYW1lUGFyYW1zLCB3YWxrQXN5bmMgfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQge1xuICBCQU5ORVJMT1JEX0VYRUMsIEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFLCBMT0NLRURfTU9EVUxFUyxcbiAgTU9EVUxFUywgT0ZGSUNJQUxfTU9EVUxFUywgU1VCTU9EX0ZJTEVcbn0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IEN1c3RvbUl0ZW1SZW5kZXJlciBmcm9tICcuL2N1c3RvbUl0ZW1SZW5kZXJlcic7XG5pbXBvcnQgeyBtaWdyYXRlMDI2LCBtaWdyYXRlMDQ1IH0gZnJvbSAnLi9taWdyYXRpb25zJztcblxuaW1wb3J0IENvbU1ldGFkYXRhTWFuYWdlciBmcm9tICcuL0NvbU1ldGFkYXRhTWFuYWdlcic7XG5pbXBvcnQgeyBnZXRDYWNoZSwgZ2V0TGF1bmNoZXJEYXRhLCBpc0ludmFsaWQsIHBhcnNlTGF1bmNoZXJEYXRhLCByZWZyZXNoQ2FjaGUgfSBmcm9tICcuL3N1Yk1vZENhY2hlJztcbmltcG9ydCB7IElTb3J0UHJvcHMsIElTdWJNb2RDYWNoZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcbmltcG9ydCB7IElDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcbmltcG9ydCB7IGNyZWF0ZUFjdGlvbiB9IGZyb20gJ3JlZHV4LWFjdCc7XG5cbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL3ZpZXdzL1NldHRpbmdzJztcblxuY29uc3QgTEFVTkNIRVJfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XG5jb25zdCBNT0RESU5HX0tJVF9FWEVDID0gcGF0aC5qb2luKCdiaW4nLCAnV2luNjRfU2hpcHBpbmdfd0VkaXRvcicsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XG5cbmxldCBTVE9SRV9JRDtcblxuY29uc3QgR09HX0lEUyA9IFsnMTgwMjUzOTUyNicsICcxNTY0NzgxNDk0J107XG5jb25zdCBTVEVBTUFQUF9JRCA9IDI2MTU1MDtcbmNvbnN0IEVQSUNBUFBfSUQgPSAnQ2hpY2thZGVlJztcblxuLy8gQSBzZXQgb2YgZm9sZGVyIG5hbWVzIChsb3dlcmNhc2VkKSB3aGljaCBhcmUgYXZhaWxhYmxlIGFsb25nc2lkZSB0aGVcbi8vICBnYW1lJ3MgbW9kdWxlcyBmb2xkZXIuIFdlIGNvdWxkJ3ZlIHVzZWQgdGhlIGZvbW9kIGluc3RhbGxlciBzdG9wIHBhdHRlcm5zXG4vLyAgZnVuY3Rpb25hbGl0eSBmb3IgdGhpcywgYnV0IGl0J3MgYmV0dGVyIGlmIHRoaXMgZXh0ZW5zaW9uIGlzIHNlbGYgY29udGFpbmVkO1xuLy8gIGVzcGVjaWFsbHkgZ2l2ZW4gdGhhdCB0aGUgZ2FtZSdzIG1vZGRpbmcgcGF0dGVybiBjaGFuZ2VzIHF1aXRlIG9mdGVuLlxuY29uc3QgUk9PVF9GT0xERVJTID0gbmV3IFNldChbJ2JpbicsICdkYXRhJywgJ2d1aScsICdpY29ucycsICdtb2R1bGVzJyxcbiAgJ211c2ljJywgJ3NoYWRlcnMnLCAnc291bmRzJywgJ3htbHNjaGVtYXMnXSk7XG5cbmNvbnN0IHNldFNvcnRPbkRlcGxveSA9IGNyZWF0ZUFjdGlvbignTU5CMl9TRVRfU09SVF9PTl9ERVBMT1knLFxuICAocHJvZmlsZUlkOiBzdHJpbmcsIHNvcnQ6IGJvb2xlYW4pID0+ICh7IHByb2ZpbGVJZCwgc29ydCB9KSk7XG5jb25zdCByZWR1Y2VyOiB0eXBlcy5JUmVkdWNlclNwZWMgPSB7XG4gIHJlZHVjZXJzOiB7XG4gICAgW3NldFNvcnRPbkRlcGxveSBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+XG4gICAgICB1dGlsLnNldFNhZmUoc3RhdGUsIFsnc29ydE9uRGVwbG95JywgcGF5bG9hZC5wcm9maWxlSWRdLCBwYXlsb2FkLnNvcnQpXG4gIH0sXG4gIGRlZmF1bHRzOiB7XG4gICAgc29ydE9uRGVwbG95OiB7fSxcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0VQSUNBUFBfSUQsIFNURUFNQVBQX0lELnRvU3RyaW5nKCksIC4uLkdPR19JRFNdKVxuICAgIC50aGVuKGdhbWUgPT4ge1xuICAgICAgU1RPUkVfSUQgPSBnYW1lLmdhbWVTdG9yZUlkO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShnYW1lLmdhbWVQYXRoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdGVzdFJvb3RNb2QoZmlsZXMsIGdhbWVJZCkge1xuICBjb25zdCBub3RTdXBwb3J0ZWQgPSB7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH07XG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAvLyBEaWZmZXJlbnQgZ2FtZS5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XG4gIH1cblxuICBjb25zdCBsb3dlcmVkID0gZmlsZXMubWFwKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpKTtcbiAgY29uc3QgbW9kc0ZpbGUgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSkgIT09IC0xKTtcbiAgaWYgKG1vZHNGaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBUaGVyZSdzIG5vIE1vZHVsZXMgZm9sZGVyLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIGNvbnN0IGlkeCA9IG1vZHNGaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSk7XG4gIGNvbnN0IHJvb3RGb2xkZXJNYXRjaGVzID0gbG93ZXJlZC5maWx0ZXIoZmlsZSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcbiAgICByZXR1cm4gKCgoc2VnbWVudHMubGVuZ3RoIC0gMSkgPiBpZHgpICYmIFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSkpO1xuICB9KSB8fCBbXTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiAocm9vdEZvbGRlck1hdGNoZXMubGVuZ3RoID4gMCksIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsUm9vdE1vZChmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XG4gIGNvbnN0IG1vZHVsZUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKSAhPT0gLTEpO1xuICBjb25zdCBpZHggPSBtb2R1bGVGaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMpO1xuICBjb25zdCBzdWJNb2RzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XG4gIHJldHVybiBCbHVlYmlyZC5tYXAoc3ViTW9kcywgYXN5bmMgKG1vZEZpbGU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHN1Yk1vZElkID0gYXdhaXQgZ2V0RWxlbWVudFZhbHVlKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEZpbGUpLCAnSWQnKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShzdWJNb2RJZCk7XG4gIH0pXG4gIC50aGVuKChzdWJNb2RJZHM6IHN0cmluZ1tdKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgY29uc3QgbGFzdEVsZW1lbnRJZHggPSBzZWdtZW50cy5sZW5ndGggLSAxO1xuXG4gICAgICAvLyBJZ25vcmUgZGlyZWN0b3JpZXMgYW5kIGVuc3VyZSB0aGF0IHRoZSBmaWxlIGNvbnRhaW5zIGEga25vd24gcm9vdCBmb2xkZXIgYXRcbiAgICAgIC8vICB0aGUgZXhwZWN0ZWQgaW5kZXguXG4gICAgICByZXR1cm4gKFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSlcbiAgICAgICAgJiYgKHBhdGguZXh0bmFtZShzZWdtZW50c1tsYXN0RWxlbWVudElkeF0pICE9PSAnJykpO1xuICAgICAgfSk7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHN1Yk1vZElkcy5sZW5ndGggPiAwXG4gICAgICA/IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICAgICAgICAgIGtleTogJ3N1Yk1vZElkcycsXG4gICAgICAgICAgICB2YWx1ZTogc3ViTW9kSWRzLFxuICAgICAgICAgIH0sXG4gICAgICAgIF1cbiAgICAgIDogW107XG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gYXR0cmlidXRlcy5jb25jYXQoZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBmaWxlLnNwbGl0KHBhdGguc2VwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGlkeClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKHBhdGguc2VwKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgICBkZXN0aW5hdGlvbixcbiAgICAgIH07XG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXN0Rm9yU3VibW9kdWxlcyhmaWxlcywgZ2FtZUlkKSB7XG4gIC8vIENoZWNrIHRoaXMgaXMgYSBtb2QgZm9yIEJhbm5lcmxvcmQgYW5kIGl0IGNvbnRhaW5zIGEgU3ViTW9kdWxlLnhtbFxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGdhbWVJZCA9PT0gR0FNRV9JRClcbiAgICAmJiBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSkgIT09IHVuZGVmaW5lZCk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFN1Yk1vZHVsZXMoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xuICAvLyBSZW1vdmUgZGlyZWN0b3JpZXMgc3RyYWlnaHQgYXdheS5cbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcbiAgICByZXR1cm4gcGF0aC5leHRuYW1lKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdKSAhPT0gJyc7XG4gIH0pO1xuICBjb25zdCBzdWJNb2RJZHMgPSBbXTtcbiAgY29uc3Qgc3ViTW9kcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKHN1Yk1vZHMsIGFzeW5jIChhY2N1bSwgbW9kRmlsZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBtb2RGaWxlLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcbiAgICBjb25zdCBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtb2RGaWxlKSwgJ0lkJyk7XG4gICAgY29uc3QgbW9kTmFtZSA9IChzZWdtZW50cy5sZW5ndGggPiAxKVxuICAgICAgPyBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAyXVxuICAgICAgOiBzdWJNb2RJZDtcbiAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ludmFsaWQgU3VibW9kdWxlLnhtbCBmaWxlIC0gaW5mb3JtIHRoZSBtb2QgYXV0aG9yJykpO1xuICAgIH1cbiAgICBzdWJNb2RJZHMucHVzaChzdWJNb2RJZCk7XG4gICAgY29uc3QgaWR4ID0gbW9kRmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoU1VCTU9EX0ZJTEUpO1xuICAgIC8vIEZpbHRlciB0aGUgbW9kIGZpbGVzIGZvciB0aGlzIHNwZWNpZmljIHN1Ym1vZHVsZS5cbiAgICBjb25zdCBzdWJNb2RGaWxlczogc3RyaW5nW11cbiAgICAgID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gZmlsZS5zbGljZSgwLCBpZHgpID09PSBtb2RGaWxlLnNsaWNlKDAsIGlkeCkpO1xuICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IHN1Yk1vZEZpbGVzLm1hcCgobW9kRmlsZTogc3RyaW5nKSA9PiAoe1xuICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgc291cmNlOiBtb2RGaWxlLFxuICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihNT0RVTEVTLCBtb2ROYW1lLCBtb2RGaWxlLnNsaWNlKGlkeCkpLFxuICAgIH0pKTtcbiAgICByZXR1cm4gYWNjdW0uY29uY2F0KGluc3RydWN0aW9ucyk7XG4gIH0sIFtdKVxuICAudGhlbihtZXJnZWQgPT4ge1xuICAgIGNvbnN0IHN1Yk1vZElkc0F0dHIgPSB7XG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICAgIGtleTogJ3N1Yk1vZElkcycsXG4gICAgICB2YWx1ZTogc3ViTW9kSWRzLFxuICAgIH07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9uczogW10uY29uY2F0KG1lcmdlZCwgW3N1Yk1vZElkc0F0dHJdKSB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU9mZmljaWFsTGF1bmNoZXIoY29udGV4dCwgZGlzY292ZXJ5KSB7XG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woR0FNRV9JRCwgJ1RhbGVXb3JsZHNCYW5uZXJsb3JkTGF1bmNoZXInLCB7XG4gICAgaWQ6ICdUYWxlV29ybGRzQmFubmVybG9yZExhdW5jaGVyJyxcbiAgICBuYW1lOiAnT2ZmaWNpYWwgTGF1bmNoZXInLFxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gcGF0aC5iYXNlbmFtZShMQVVOQ0hFUl9FWEVDKSxcbiAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICBwYXRoLmJhc2VuYW1lKExBVU5DSEVSX0VYRUMpLFxuICAgIF0sXG4gICAgcGF0aDogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBMQVVOQ0hFUl9FWEVDKSxcbiAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JyksXG4gICAgaGlkZGVuOiBmYWxzZSxcbiAgICBjdXN0b206IGZhbHNlLFxuICB9LCBmYWxzZSkpO1xufVxuXG5mdW5jdGlvbiBzZXRNb2RkaW5nVG9vbChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZGRlbj86IGJvb2xlYW4pIHtcbiAgY29uc3QgdG9vbElkID0gJ2Jhbm5lcmxvcmQtc2RrJztcbiAgY29uc3QgZXhlYyA9IHBhdGguYmFzZW5hbWUoTU9ERElOR19LSVRfRVhFQyk7XG4gIGNvbnN0IHRvb2wgPSB7XG4gICAgaWQ6IHRvb2xJZCxcbiAgICBuYW1lOiAnTW9kZGluZyBLaXQnLFxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gZXhlYyxcbiAgICByZXF1aXJlZEZpbGVzOiBbIGV4ZWMgXSxcbiAgICBwYXRoOiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRERJTkdfS0lUX0VYRUMpLFxuICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIHBhdGguZGlybmFtZShNT0RESU5HX0tJVF9FWEVDKSksXG4gICAgaGlkZGVuLFxuICAgIGN1c3RvbTogZmFsc2UsXG4gIH07XG5cbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbChHQU1FX0lELCB0b29sSWQsIHRvb2wsIGZhbHNlKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xuICAvLyBRdWlja2x5IGVuc3VyZSB0aGF0IHRoZSBvZmZpY2lhbCBMYXVuY2hlciBpcyBhZGRlZC5cbiAgZW5zdXJlT2ZmaWNpYWxMYXVuY2hlcihjb250ZXh0LCBkaXNjb3ZlcnkpO1xuICB0cnkge1xuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRERJTkdfS0lUX0VYRUMpKTtcbiAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCB0b29scyA9IGRpc2NvdmVyeT8udG9vbHM7XG4gICAgaWYgKCh0b29scyAhPT0gdW5kZWZpbmVkKVxuICAgICYmICh1dGlsLmdldFNhZmUodG9vbHMsIFsnYmFubmVybG9yZC1zZGsnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgc2V0TW9kZGluZ1Rvb2woY29udGV4dCwgZGlzY292ZXJ5LCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvLyBJZiBnYW1lIHN0b3JlIG5vdCBmb3VuZCwgbG9jYXRpb24gbWF5IGJlIHNldCBtYW51YWxseSAtIGFsbG93IHNldHVwXG4gIC8vICBmdW5jdGlvbiB0byBjb250aW51ZS5cbiAgY29uc3QgZmluZFN0b3JlSWQgPSAoKSA9PiBmaW5kR2FtZSgpLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUoKSk7XG4gIGNvbnN0IHN0YXJ0U3RlYW0gPSAoKSA9PiBmaW5kU3RvcmVJZCgpXG4gICAgLnRoZW4oKCkgPT4gKFNUT1JFX0lEID09PSAnc3RlYW0nKVxuICAgICAgPyB1dGlsLkdhbWVTdG9yZUhlbHBlci5sYXVuY2hHYW1lU3RvcmUoY29udGV4dC5hcGksIFNUT1JFX0lELCB1bmRlZmluZWQsIHRydWUpXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSgpKTtcblxuICAvLyBDaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHNldCB0aGUgbG9hZCBvcmRlciBvYmplY3QgZm9yIHRoaXMgcHJvZmlsZVxuICAvLyAgYW5kIGNyZWF0ZSBpdCBpZiB3ZSBoYXZlbid0LlxuICByZXR1cm4gc3RhcnRTdGVhbSgpLnRoZW4oKCkgPT4gcGFyc2VMYXVuY2hlckRhdGEoKSkudGhlbihhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0LCBtZXRhTWFuYWdlcik7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBsYXN0QWN0aXZlID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKGxhc3RBY3RpdmUpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuXG4gICAgLy8gV2UncmUgZ29pbmcgdG8gZG8gYSBxdWljayB0U29ydCBhdCB0aGlzIHBvaW50IC0gbm90IGdvaW5nIHRvXG4gICAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxuICAgIC8vICBjeWNsaWMgb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMuXG4gICAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpID8/IHt9O1xuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcbiAgICBjb25zdCBzb3J0ZWQgPSB0U29ydCh7IHN1Yk1vZElkczogbW9kSWRzLCBhbGxvd0xvY2tlZDogdHJ1ZSwgbWV0YU1hbmFnZXIgfSk7XG4gIH0pXG4gIC5jYXRjaChlcnIgPT4ge1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLk5vdEZvdW5kKSB7XG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBmaW5kIGdhbWUgbGF1bmNoZXIgZGF0YScsXG4gICAgICAgICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgdGhyb3VnaCB0aGUgb2ZmaWNpYWwgZ2FtZSBsYXVuY2hlciBhbmQgJ1xuICAgICAgKyAndHJ5IGFnYWluJywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxuICAgICAgICBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9KVxuICAuZmluYWxseSgoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVmFsaWQgdXNlIGNhc2Ugd2hlbiBhdHRlbXB0aW5nIHRvIHN3aXRjaCB0b1xuICAgICAgLy8gIEJhbm5lcmxvcmQgd2l0aG91dCBhbnkgYWN0aXZlIHByb2ZpbGUuXG4gICAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwge30pO1xuICAgIH1cbiAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xuICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdFNvcnQoc29ydFByb3BzOiBJU29ydFByb3BzLCB0ZXN0OiBib29sZWFuID0gZmFsc2UpIHtcbiAgY29uc3QgeyBzdWJNb2RJZHMsIGFsbG93TG9ja2VkLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0gPSBzb3J0UHJvcHM7XG4gIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcbiAgLy8gVG9wb2xvZ2ljYWwgc29ydCAtIHdlIG5lZWQgdG86XG4gIC8vICAtIElkZW50aWZ5IGN5Y2xpYyBkZXBlbmRlbmNpZXMuXG4gIC8vICAtIElkZW50aWZ5IG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxuICAvLyAgLSBXZSB3aWxsIHRyeSB0byBpZGVudGlmeSBpbmNvbXBhdGlibGUgZGVwZW5kZW5jaWVzICh2ZXJzaW9uLXdpc2UpXG5cbiAgLy8gVGhlc2UgYXJlIG1hbnVhbGx5IGxvY2tlZCBtb2QgZW50cmllcy5cbiAgY29uc3QgbG9ja2VkU3ViTW9kcyA9ICghIWxvYWRPcmRlcilcbiAgICA/IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kSWQgPT4ge1xuICAgICAgY29uc3QgZW50cnkgPSBDQUNIRVtzdWJNb2RJZF07XG4gICAgICByZXR1cm4gKCEhZW50cnkpXG4gICAgICAgID8gISFsb2FkT3JkZXJbZW50cnkudm9ydGV4SWRdPy5sb2NrZWRcbiAgICAgICAgOiBmYWxzZTtcbiAgICB9KVxuICAgIDogW107XG4gIGNvbnN0IGFscGhhYmV0aWNhbCA9IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kID0+ICFsb2NrZWRTdWJNb2RzLmluY2x1ZGVzKHN1Yk1vZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zb3J0KCk7XG4gIGNvbnN0IGdyYXBoID0gYWxwaGFiZXRpY2FsLnJlZHVjZSgoYWNjdW0sIGVudHJ5KSA9PiB7XG4gICAgY29uc3QgZGVwSWRzID0gWy4uLkNBQ0hFW2VudHJ5XS5kZXBlbmRlbmNpZXNdLm1hcChkZXAgPT4gZGVwLmlkKTtcbiAgICAvLyBDcmVhdGUgdGhlIG5vZGUgZ3JhcGguXG4gICAgYWNjdW1bZW50cnldID0gZGVwSWRzLnNvcnQoKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcblxuICAvLyBXaWxsIHN0b3JlIHRoZSBmaW5hbCBMTyByZXN1bHRcbiAgY29uc3QgcmVzdWx0ID0gW107XG5cbiAgLy8gVGhlIG5vZGVzIHdlIGhhdmUgdmlzaXRlZC9wcm9jZXNzZWQuXG4gIGNvbnN0IHZpc2l0ZWQgPSBbXTtcblxuICAvLyBUaGUgbm9kZXMgd2hpY2ggYXJlIHN0aWxsIHByb2Nlc3NpbmcuXG4gIGNvbnN0IHByb2Nlc3NpbmcgPSBbXTtcblxuICBjb25zdCB0b3BTb3J0ID0gKG5vZGUsIGlzT3B0aW9uYWwgPSBmYWxzZSkgPT4ge1xuICAgIGlmIChpc09wdGlvbmFsICYmICFPYmplY3Qua2V5cyhncmFwaCkuaW5jbHVkZXMobm9kZSkpIHtcbiAgICAgIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwcm9jZXNzaW5nW25vZGVdID0gdHJ1ZTtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSAoISFhbGxvd0xvY2tlZClcbiAgICAgID8gZ3JhcGhbbm9kZV1cbiAgICAgIDogZ3JhcGhbbm9kZV0uZmlsdGVyKGVsZW1lbnQgPT4gIUxPQ0tFRF9NT0RVTEVTLmhhcyhlbGVtZW50KSk7XG5cbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcbiAgICAgIGlmIChwcm9jZXNzaW5nW2RlcF0pIHtcbiAgICAgICAgLy8gQ3ljbGljIGRlcGVuZGVuY3kgZGV0ZWN0ZWQgLSBoaWdobGlnaHQgYm90aCBtb2RzIGFzIGludmFsaWRcbiAgICAgICAgLy8gIHdpdGhpbiB0aGUgY2FjaGUgaXRzZWxmIC0gd2UgYWxzbyBuZWVkIHRvIGhpZ2hsaWdodCB3aGljaCBtb2RzLlxuICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmN5Y2xpYy5wdXNoKGRlcCk7XG4gICAgICAgIENBQ0hFW2RlcF0uaW52YWxpZC5jeWNsaWMucHVzaChub2RlKTtcblxuICAgICAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcbiAgICAgICAgcHJvY2Vzc2luZ1tub2RlXSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW5jb21wYXRpYmxlRGVwcyA9IENBQ0hFW25vZGVdLmludmFsaWQuaW5jb21wYXRpYmxlRGVwcztcbiAgICAgIGNvbnN0IGluY0RlcCA9IGluY29tcGF0aWJsZURlcHMuZmluZChkID0+IGQuaWQgPT09IGRlcCk7XG4gICAgICBpZiAoT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKGRlcCkgJiYgKGluY0RlcCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICBjb25zdCBkZXBWZXIgPSBDQUNIRVtkZXBdLnN1Yk1vZFZlcjtcbiAgICAgICAgY29uc3QgZGVwSW5zdCA9IENBQ0hFW25vZGVdLmRlcGVuZGVuY2llcy5maW5kKGQgPT4gZC5pZCA9PT0gZGVwKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHNlbXZlci5zYXRpc2ZpZXMoZGVwSW5zdC52ZXJzaW9uLCBkZXBWZXIpO1xuICAgICAgICAgIGlmICghbWF0Y2ggJiYgISFkZXBJbnN0Py52ZXJzaW9uICYmICEhZGVwVmVyKSB7XG4gICAgICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmluY29tcGF0aWJsZURlcHMucHVzaCh7XG4gICAgICAgICAgICAgIGlkOiBkZXAsXG4gICAgICAgICAgICAgIHJlcXVpcmVkVmVyc2lvbjogZGVwSW5zdC52ZXJzaW9uLFxuICAgICAgICAgICAgICBjdXJyZW50VmVyc2lvbjogZGVwVmVyLFxuICAgICAgICAgICAgICBpbmNvbXBhdGlibGU6IGRlcEluc3QuaW5jb21wYXRpYmxlLFxuICAgICAgICAgICAgICBvcHRpb25hbDogZGVwSW5zdC5vcHRpb25hbCxcbiAgICAgICAgICAgICAgb3JkZXI6IGRlcEluc3Qub3JkZXIsXG4gICAgICAgICAgICAgIHZlcnNpb246IGRlcEluc3QudmVyc2lvbixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gT2sgc28gd2UgZGlkbid0IG1hbmFnZSB0byBjb21wYXJlIHRoZSB2ZXJzaW9ucywgd2UgbG9nIHRoaXMgYW5kXG4gICAgICAgICAgLy8gIGNvbnRpbnVlLlxuICAgICAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIGNvbXBhcmUgdmVyc2lvbnMnLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9wdGlvbmFsID0gbWV0YU1hbmFnZXIuaXNPcHRpb25hbChub2RlLCBkZXApO1xuICAgICAgaWYgKCF2aXNpdGVkW2RlcF0gJiYgIWxvY2tlZFN1Yk1vZHMuaW5jbHVkZXMoZGVwKSkge1xuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGdyYXBoKS5pbmNsdWRlcyhkZXApICYmICFvcHRpb25hbCkge1xuICAgICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQubWlzc2luZy5wdXNoKGRlcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9wU29ydChkZXAsIG9wdGlvbmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHByb2Nlc3Npbmdbbm9kZV0gPSBmYWxzZTtcbiAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcblxuICAgIHJlc3VsdC5wdXNoKG5vZGUpO1xuICB9O1xuXG4gIGZvciAoY29uc3Qgbm9kZSBpbiBncmFwaCkge1xuICAgIGlmICghdmlzaXRlZFtub2RlXSAmJiAhcHJvY2Vzc2luZ1tub2RlXSkge1xuICAgICAgdG9wU29ydChub2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoYWxsb3dMb2NrZWQpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gUHJvcGVyIHRvcG9sb2dpY2FsIHNvcnQgZGljdGF0ZXMgd2Ugc2ltcGx5IHJldHVybiB0aGVcbiAgLy8gIHJlc3VsdCBhdCB0aGlzIHBvaW50LiBCdXQsIG1vZCBhdXRob3JzIHdhbnQgbW9kdWxlc1xuICAvLyAgd2l0aCBubyBkZXBlbmRlbmNpZXMgdG8gYnViYmxlIHVwIHRvIHRoZSB0b3Agb2YgdGhlIExPLlxuICAvLyAgKFRoaXMgd2lsbCBvbmx5IGFwcGx5IHRvIG5vbiBsb2NrZWQgZW50cmllcylcbiAgY29uc3Qgc3ViTW9kc1dpdGhOb0RlcHMgPSByZXN1bHQuZmlsdGVyKGRlcCA9PiAoZ3JhcGhbZGVwXS5sZW5ndGggPT09IDApXG4gICAgfHwgKGdyYXBoW2RlcF0uZmluZChkID0+ICFMT0NLRURfTU9EVUxFUy5oYXMoZCkpID09PSB1bmRlZmluZWQpKS5zb3J0KCkgfHwgW107XG4gIGNvbnN0IHRhbXBlcmVkUmVzdWx0ID0gW10uY29uY2F0KHN1Yk1vZHNXaXRoTm9EZXBzLFxuICAgIHJlc3VsdC5maWx0ZXIoZW50cnkgPT4gIXN1Yk1vZHNXaXRoTm9EZXBzLmluY2x1ZGVzKGVudHJ5KSkpO1xuICBsb2NrZWRTdWJNb2RzLmZvckVhY2goc3ViTW9kSWQgPT4ge1xuICAgIGNvbnN0IHBvcyA9IGxvYWRPcmRlcltDQUNIRVtzdWJNb2RJZF0udm9ydGV4SWRdLnBvcztcbiAgICB0YW1wZXJlZFJlc3VsdC5zcGxpY2UocG9zLCAwLCBbc3ViTW9kSWRdKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRhbXBlcmVkUmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpc0V4dGVybmFsKGNvbnRleHQsIHN1Yk1vZElkKSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhtb2RzKTtcbiAgbW9kSWRzLmZvckVhY2gobW9kSWQgPT4ge1xuICAgIGNvbnN0IHN1Yk1vZElkcyA9IHV0aWwuZ2V0U2FmZShtb2RzW21vZElkXSwgWydhdHRyaWJ1dGVzJywgJ3N1Yk1vZElkcyddLCBbXSk7XG4gICAgaWYgKHN1Yk1vZElkcy5pbmNsdWRlcyhzdWJNb2RJZCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxubGV0IHJlZnJlc2hGdW5jO1xuYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAoKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gZGVwbG95UHJvZmlsZT8uZ2FtZUlkKSB8fCAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSkge1xuICAgIC8vIERlcGxveW1lbnQgZXZlbnQgc2VlbXMgdG8gYmUgZXhlY3V0ZWQgZm9yIGEgcHJvZmlsZSBvdGhlclxuICAgIC8vICB0aGFuIHRoZSBjdXJyZW50bHkgYWN0aXZlIG9uZS4gTm90IGdvaW5nIHRvIGNvbnRpbnVlLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGF3YWl0IG1ldGFNYW5hZ2VyLnVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkKTtcblxuICB0cnkge1xuICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0LCBtZXRhTWFuYWdlcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIFByb2Nlc3NDYW5jZWxlZCBtZWFucyB0aGF0IHdlIHdlcmUgdW5hYmxlIHRvIHNjYW4gZm9yIGRlcGxveWVkXG4gICAgLy8gIHN1Yk1vZHVsZXMsIHByb2JhYmx5IGJlY2F1c2UgZ2FtZSBkaXNjb3ZlcnkgaXMgaW5jb21wbGV0ZS5cbiAgICAvLyBJdCdzIGJleW9uZCB0aGUgc2NvcGUgb2YgdGhpcyBmdW5jdGlvbiB0byByZXBvcnQgZGlzY292ZXJ5XG4gICAgLy8gIHJlbGF0ZWQgaXNzdWVzLlxuICAgIHJldHVybiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cblxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCB7fSk7XG5cbiAgaWYgKHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdtb3VudGFuZGJsYWRlMicsICdzb3J0T25EZXBsb3knLCBhY3RpdmVQcm9maWxlLmlkXSwgdHJ1ZSkpIHtcbiAgICByZXR1cm4gc29ydEltcGwoY29udGV4dCwgbWV0YU1hbmFnZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGRvIGEgcXVpY2sgdFNvcnQgYXQgdGhpcyBwb2ludCAtIG5vdCBnb2luZyB0b1xuICAgIC8vICBjaGFuZ2UgdGhlIHVzZXIncyBsb2FkIG9yZGVyLCBidXQgdGhpcyB3aWxsIGhpZ2hsaWdodCBhbnlcbiAgICAvLyAgY3ljbGljIG9yIG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxuICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcbiAgICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XG4gICAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xuICAgICAgc3ViTW9kSWRzOiBtb2RJZHMsXG4gICAgICBhbGxvd0xvY2tlZDogdHJ1ZSxcbiAgICAgIGxvYWRPcmRlcixcbiAgICAgIG1ldGFNYW5hZ2VyLFxuICAgIH07XG4gICAgY29uc3Qgc29ydGVkID0gdFNvcnQoc29ydFByb3BzLCB0cnVlKTtcblxuICAgIGlmIChyZWZyZXNoRnVuYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZWZyZXNoRnVuYygpO1xuICAgIH1cblxuICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgbWV0YU1hbmFnZXIpIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCAhQ0FDSEUpIHtcbiAgICAvLyBSYWNlIGNvbmRpdGlvbiA/XG4gICAgcmV0dXJuIGl0ZW1zO1xuICB9XG5cbiAgbGV0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcbiAgaWYgKGl0ZW1zLmxlbmd0aCA+IDAgJiYgbW9kSWRzLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIENhY2hlIGhhc24ndCBiZWVuIHBvcHVsYXRlZCB5ZXQuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFJlZnJlc2ggdGhlIGNhY2hlLlxuICAgICAgYXdhaXQgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBhY3RpdmVQcm9maWxlLmlkLCBtZXRhTWFuYWdlcik7XG4gICAgICBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH1cblxuICAvLyBMb2NrZWQgaWRzIGFyZSBhbHdheXMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdCBhcyBhbGxcbiAgLy8gIG90aGVyIG1vZHVsZXMgZGVwZW5kIG9uIHRoZXNlLlxuICBsZXQgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xuXG4gIHRyeSB7XG4gICAgLy8gU29ydCB0aGUgbG9ja2VkIGlkcyBhbW9uZ3N0IHRoZW1zZWx2ZXMgdG8gZW5zdXJlXG4gICAgLy8gIHRoYXQgdGhlIGdhbWUgcmVjZWl2ZXMgdGhlc2UgaW4gdGhlIHJpZ2h0IG9yZGVyLlxuICAgIGNvbnN0IHNvcnRQcm9wczogSVNvcnRQcm9wcyA9IHtcbiAgICAgIHN1Yk1vZElkczogbG9ja2VkSWRzLFxuICAgICAgYWxsb3dMb2NrZWQ6IHRydWUsXG4gICAgICBtZXRhTWFuYWdlcixcbiAgICB9O1xuICAgIGxvY2tlZElkcyA9IHRTb3J0KHNvcnRQcm9wcyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIHRoZSBsb2NrZWQgZW50cmllcy5cbiAgY29uc3QgbG9ja2VkSXRlbXMgPSBsb2NrZWRJZHMubWFwKGlkID0+ICh7XG4gICAgaWQ6IENBQ0hFW2lkXS52b3J0ZXhJZCxcbiAgICBuYW1lOiBDQUNIRVtpZF0uc3ViTW9kTmFtZSxcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxuICAgIGxvY2tlZDogdHJ1ZSxcbiAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoaWQpLFxuICB9KSk7XG5cbiAgY29uc3QgTEFVTkNIRVJfREFUQSA9IGdldExhdW5jaGVyRGF0YSgpO1xuXG4gIC8vIEV4dGVybmFsIGlkcyB3aWxsIGluY2x1ZGUgb2ZmaWNpYWwgbW9kdWxlcyBhcyB3ZWxsIGJ1dCBub3QgbG9ja2VkIGVudHJpZXMuXG4gIGNvbnN0IGV4dGVybmFsSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiAoIUNBQ0hFW2lkXS5pc0xvY2tlZCkgJiYgKENBQ0hFW2lkXS52b3J0ZXhJZCA9PT0gaWQpKTtcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcbiAgY29uc3QgTE9rZXlzID0gKChPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aCA+IDApXG4gICAgPyBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXG4gICAgOiBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMubWFwKG1vZCA9PiBtb2Quc3ViTW9kSWQpKTtcblxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHRoYXQgYXJlIGFscmVhZHkgaW4gdGhlIGxvYWQgb3JkZXIuXG4gIGNvbnN0IGtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+IExPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xuXG4gIC8vIEV4dGVybmFsIG1vZHVsZXMgd2hpY2ggYXJlIG5ldyBhbmQgaGF2ZSB5ZXQgdG8gYmUgYWRkZWQgdG8gdGhlIExPLlxuICBjb25zdCB1bmtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+ICFMT2tleXMuaW5jbHVkZXMoaWQpKSB8fCBbXTtcblxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+IHtcbiAgICAvLyBSZW1vdmUgYW55IGxvY2tlZElkcywgYnV0IGFsc28gZW5zdXJlIHRoYXQgdGhlXG4gICAgLy8gIGVudHJ5IGNhbiBiZSBmb3VuZCBpbiB0aGUgY2FjaGUuIElmIGl0J3Mgbm90IGluIHRoZVxuICAgIC8vICBjYWNoZSwgdGhpcyBtYXkgbWVhbiB0aGF0IHRoZSBzdWJtb2QgeG1sIGZpbGUgZmFpbGVkXG4gICAgLy8gIHBhcnNlLWluZyBhbmQgdGhlcmVmb3JlIHNob3VsZCBub3QgYmUgZGlzcGxheWVkLlxuICAgIGNvbnN0IGlzTG9ja2VkID0gbG9ja2VkSWRzLmluY2x1ZGVzKGl0ZW0uaWQpO1xuICAgIGNvbnN0IGhhc0NhY2hlRW50cnkgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT5cbiAgICAgIENBQ0hFW2tleV0udm9ydGV4SWQgPT09IGl0ZW0uaWQpICE9PSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuICFpc0xvY2tlZCAmJiBoYXNDYWNoZUVudHJ5O1xuICB9KTtcblxuICBjb25zdCBwb3NNYXAgPSB7fTtcbiAgbGV0IG5leHRBdmFpbGFibGUgPSBMT2tleXMubGVuZ3RoO1xuICBjb25zdCBnZXROZXh0UG9zID0gKGxvSWQpID0+IHtcbiAgICBpZiAoTE9DS0VEX01PRFVMRVMuaGFzKGxvSWQpKSB7XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShMT0NLRURfTU9EVUxFUykuaW5kZXhPZihsb0lkKTtcbiAgICB9XG5cbiAgICBpZiAocG9zTWFwW2xvSWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBvc01hcFtsb0lkXSA9IG5leHRBdmFpbGFibGU7XG4gICAgICByZXR1cm4gbmV4dEF2YWlsYWJsZSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcG9zTWFwW2xvSWRdO1xuICAgIH1cbiAgfTtcblxuICBrbm93bkV4dC5tYXAoa2V5ID0+ICh7XG4gICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXG4gICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxuICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXG4gICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXG4gIH0pKVxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWF4LWxpbmUtbGVuZ3RoXG4gICAgLnNvcnQoKGEsIGIpID0+IChsb2FkT3JkZXJbYS5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGEuaWQpKSAtIChsb2FkT3JkZXJbYi5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGIuaWQpKSlcbiAgICAuZm9yRWFjaChrbm93biA9PiB7XG4gICAgICAvLyBJZiB0aGlzIGEga25vd24gZXh0ZXJuYWwgbW9kdWxlIGFuZCBpcyBOT1QgaW4gdGhlIGl0ZW0gbGlzdCBhbHJlYWR5XG4gICAgICAvLyAgd2UgbmVlZCB0byByZS1pbnNlcnQgaW4gdGhlIGNvcnJlY3QgaW5kZXggYXMgYWxsIGtub3duIGV4dGVybmFsIG1vZHVsZXNcbiAgICAgIC8vICBhdCB0aGlzIHBvaW50IGFyZSBhY3R1YWxseSBkZXBsb3llZCBpbnNpZGUgdGhlIG1vZHMgZm9sZGVyIGFuZCBzaG91bGRcbiAgICAgIC8vICBiZSBpbiB0aGUgaXRlbXMgbGlzdCFcbiAgICAgIGNvbnN0IGRpZmYgPSAoTE9rZXlzLmxlbmd0aCkgLSAoTE9rZXlzLmxlbmd0aCAtIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmxlbmd0aCk7XG4gICAgICBpZiAoaXRlbXMuZmluZChpdGVtID0+IGl0ZW0uaWQgPT09IGtub3duLmlkKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHBvcyA9IGxvYWRPcmRlcltrbm93bi5pZF0/LnBvcztcbiAgICAgICAgY29uc3QgaWR4ID0gKHBvcyAhPT0gdW5kZWZpbmVkKSA/IChwb3MgLSBkaWZmKSA6IChnZXROZXh0UG9zKGtub3duLmlkKSAtIGRpZmYpO1xuICAgICAgICBpdGVtcy5zcGxpY2UoaWR4LCAwLCBrbm93bik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgY29uc3QgdW5rbm93bkl0ZW1zID0gW10uY29uY2F0KHVua25vd25FeHQpXG4gICAgLm1hcChrZXkgPT4gKHtcbiAgICAgIGlkOiBDQUNIRVtrZXldLnZvcnRleElkLFxuICAgICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxuICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcbiAgICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGNvbnRleHQsIENBQ0hFW2tleV0udm9ydGV4SWQpLFxuICAgICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXG4gICAgfSkpO1xuXG4gIGNvbnN0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChsb2NrZWRJdGVtcywgaXRlbXMsIHVua25vd25JdGVtcyk7XG4gIHJldHVybiAoZGlyZWN0aW9uID09PSAnZGVzY2VuZGluZycpXG4gICAgPyBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkLnJldmVyc2UoKSlcbiAgICA6IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQpO1xufVxuXG5mdW5jdGlvbiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSB7XG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLCB7IGlkOiAnbG9hZG9yZGVyaW5mbycgfSxcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LCB0KCdNYW5hZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnWW91IGNhbiBhZGp1c3QgdGhlIGxvYWQgb3JkZXIgZm9yIEJhbm5lcmxvcmQgYnkgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIG1vZHMgdXAgb3IgZG93biBvbiB0aGlzIHBhZ2UuICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBrZWVwIGluIG1pbmQgdGhhdCBCYW5uZXJsb3JkIGlzIHN0aWxsIGluIEVhcmx5IEFjY2Vzcywgd2hpY2ggbWVhbnMgdGhhdCB0aGVyZSBtaWdodCBiZSBzaWduaWZpY2FudCAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdjaGFuZ2VzIHRvIHRoZSBnYW1lIGFzIHRpbWUgZ29lcyBvbi4gUGxlYXNlIG5vdGlmeSB1cyBvZiBhbnkgVm9ydGV4IHJlbGF0ZWQgaXNzdWVzIHlvdSBlbmNvdW50ZXIgd2l0aCB0aGlzICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2V4dGVuc2lvbiBzbyB3ZSBjYW4gZml4IGl0LiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhbmQgaGVscCBzZWU6ICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19CYW5uZXJsb3JkX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBCYW5uZXJsb3JkIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnSG93IHRvIHVzZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdDaGVjayB0aGUgYm94IG5leHQgdG8gdGhlIG1vZHMgeW91IHdhbnQgdG8gYmUgYWN0aXZlIGluIHRoZSBnYW1lLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQ2xpY2sgQXV0byBTb3J0IGluIHRoZSB0b29sYmFyLiAoU2VlIGJlbG93IGZvciBkZXRhaWxzKS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01ha2Ugc3VyZSB0byBydW4gdGhlIGdhbWUgZGlyZWN0bHkgdmlhIHRoZSBQbGF5IGJ1dHRvbiBpbiB0aGUgdG9wIGxlZnQgY29ybmVyICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnKG9uIHRoZSBCYW5uZXJsb3JkIHRpbGUpLiBZb3VyIFZvcnRleCBsb2FkIG9yZGVyIG1heSBub3QgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIFNpbmdsZSBQbGF5ZXIgZ2FtZSB0aHJvdWdoIHRoZSBnYW1lIGxhdW5jaGVyLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnT3B0aW9uYWw6IE1hbnVhbGx5IGRyYWcgYW5kIGRyb3AgbW9kcyB0byBkaWZmZXJlbnQgcG9zaXRpb25zIGluIHRoZSBsb2FkIG9yZGVyIChmb3IgdGVzdGluZyBkaWZmZXJlbnQgb3ZlcnJpZGVzKS4gTW9kcyBmdXJ0aGVyIGRvd24gdGhlIGxpc3Qgb3ZlcnJpZGUgbW9kcyBmdXJ0aGVyIHVwLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpLFxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdQbGVhc2Ugbm90ZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgbG9hZCBvcmRlciByZWZsZWN0ZWQgaGVyZSB3aWxsIG9ubHkgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIGdhbWUgdmlhIHRoZSBwbGF5IGJ1dHRvbiBpbiAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3RoZSB0b3AgbGVmdCBjb3JuZXIuIERvIG5vdCBydW4gdGhlIFNpbmdsZSBQbGF5ZXIgZ2FtZSB0aHJvdWdoIHRoZSBsYXVuY2hlciwgYXMgdGhhdCB3aWxsIGlnbm9yZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3RoZSBWb3J0ZXggbG9hZCBvcmRlciBhbmQgZ28gYnkgd2hhdCBpcyBzaG93biBpbiB0aGUgbGF1bmNoZXIgaW5zdGVhZC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0ZvciBCYW5uZXJsb3JkLCBtb2RzIHNvcnRlZCBmdXJ0aGVyIHRvd2FyZHMgdGhlIGJvdHRvbSBvZiB0aGUgbGlzdCB3aWxsIG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cCAoaWYgdGhleSBjb25mbGljdCkuICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnTm90ZTogSGFybW9ueSBwYXRjaGVzIG1heSBiZSB0aGUgZXhjZXB0aW9uIHRvIHRoaXMgcnVsZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0F1dG8gU29ydCB1c2VzIHRoZSBTdWJNb2R1bGUueG1sIGZpbGVzICh0aGUgZW50cmllcyB1bmRlciA8RGVwZW5kZWRNb2R1bGVzPikgdG8gZGV0ZWN0ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnZGVwZW5kZW5jaWVzIHRvIHNvcnQgYnkuICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSWYgeW91IGNhbm5vdCBzZWUgeW91ciBtb2QgaW4gdGhpcyBsb2FkIG9yZGVyLCBWb3J0ZXggbWF5IGhhdmUgYmVlbiB1bmFibGUgdG8gZmluZCBvciBwYXJzZSBpdHMgU3ViTW9kdWxlLnhtbCBmaWxlLiAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ01vc3QgLSBidXQgbm90IGFsbCBtb2RzIC0gY29tZSB3aXRoIG9yIG5lZWQgYSBTdWJNb2R1bGUueG1sIGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdIaXQgdGhlIGRlcGxveSBidXR0b24gd2hlbmV2ZXIgeW91IGluc3RhbGwgYW5kIGVuYWJsZSBhIG5ldyBtb2QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgZ2FtZSB3aWxsIG5vdCBsYXVuY2ggdW5sZXNzIHRoZSBnYW1lIHN0b3JlIChTdGVhbSwgRXBpYywgZXRjKSBpcyBzdGFydGVkIGJlZm9yZWhhbmQuIElmIHlvdVxcJ3JlIGdldHRpbmcgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnXCJVbmFibGUgdG8gSW5pdGlhbGl6ZSBTdGVhbSBBUElcIiBlcnJvciwgcmVzdGFydCBTdGVhbS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1JpZ2h0IGNsaWNraW5nIGFuIGVudHJ5IHdpbGwgb3BlbiB0aGUgY29udGV4dCBtZW51IHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvY2sgTE8gZW50cmllcyBpbnRvIHBvc2l0aW9uOyBlbnRyeSB3aWxsICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnYmUgaWdub3JlZCBieSBhdXRvLXNvcnQgbWFpbnRhaW5pbmcgaXRzIGxvY2tlZCBwb3NpdGlvbi4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVHYW1lVmVyc2lvbihkaXNjb3ZlcnlQYXRoOiBzdHJpbmcpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAnZGV2ZWxvcG1lbnQnICYmIHNlbXZlci5zYXRpc2ZpZXModXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb24sICc8MS40LjAnKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ25vdCBzdXBwb3J0ZWQgaW4gb2xkZXIgVm9ydGV4IHZlcnNpb25zJykpO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEocGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1ZlcnNpb24ueG1sJykpO1xuICAgIGNvbnN0IGV4ZVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgQkFOTkVSTE9SRF9FWEVDKTtcbiAgICBjb25zdCB2YWx1ZSA9IGRhdGE/LlZlcnNpb24/LlNpbmdsZXBsYXllcj8uWzBdPy4kPy5WYWx1ZVxuICAgICAgLnNsaWNlKDEpXG4gICAgICAuc3BsaXQoJy4nKVxuICAgICAgLnNsaWNlKDAsIDMpXG4gICAgICAuam9pbignLicpO1xuICAgIHJldHVybiAoc2VtdmVyLnZhbGlkKHZhbHVlKSkgPyBQcm9taXNlLnJlc29sdmUodmFsdWUpIDogZ2V0VmVyc2lvbihleGVQYXRoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxubGV0IF9JU19TT1JUSU5HID0gZmFsc2U7XG5mdW5jdGlvbiBzb3J0SW1wbChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgbWV0YU1hbmFnZXI6IENvbU1ldGFkYXRhTWFuYWdlcikge1xuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XG4gIGlmICghQ0FDSEUpIHtcbiAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ0NhY2hlIGlzIHVuYXZhaWxhYmxlJyB9KTtcbiAgICBfSVNfU09SVElORyA9IGZhbHNlO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XG4gIGNvbnN0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcbiAgY29uc3Qgc3ViTW9kSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiAhQ0FDSEVbaWRdLmlzTG9ja2VkKTtcblxuICBsZXQgc29ydGVkTG9ja2VkID0gW107XG4gIGxldCBzb3J0ZWRTdWJNb2RzID0gW107XG5cbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFByb2JhYmx5IGJlc3QgdGhhdCB3ZSBkb24ndCByZXBvcnQgdGhpcyB2aWEgbm90aWZpY2F0aW9uIGFzIGEgbnVtYmVyXG4gICAgLy8gIG9mIHRoaW5ncyBtYXkgaGF2ZSBvY2N1cnJlZCB0aGF0IGNhdXNlZCB0aGlzIGlzc3VlLiBXZSBsb2cgaXQgaW5zdGVhZC5cbiAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzb3J0IG1vZHMnLCB7IHJlYXNvbjogJ05vIGFjdGl2ZSBwcm9maWxlJyB9KTtcbiAgICBfSVNfU09SVElORyA9IGZhbHNlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XG5cbiAgdHJ5IHtcbiAgICBzb3J0ZWRMb2NrZWQgPSB0U29ydCh7IHN1Yk1vZElkczogbG9ja2VkSWRzLCBhbGxvd0xvY2tlZDogdHJ1ZSwgbWV0YU1hbmFnZXIgfSk7XG4gICAgc29ydGVkU3ViTW9kcyA9IHRTb3J0KHsgc3ViTW9kSWRzLCBhbGxvd0xvY2tlZDogZmFsc2UsIGxvYWRPcmRlciwgbWV0YU1hbmFnZXIgfSwgdHJ1ZSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNvcnQgbW9kcycsIGVycik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZ2V0TmV4dEF2YWlsYWJsZSA9IChhY2N1bSwgaWR4KSA9PiB7XG4gICAgY29uc3QgZW50cmllcyA9IE9iamVjdC52YWx1ZXMoYWNjdW0pO1xuICAgIHdoaWxlIChlbnRyaWVzLmZpbmQoZW50cnkgPT4gKGVudHJ5IGFzIGFueSkucG9zID09PSBpZHgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlkeCsrO1xuICAgIH1cbiAgICByZXR1cm4gaWR4O1xuICB9XG4gIGNvbnN0IG5ld09yZGVyID0gW10uY29uY2F0KHNvcnRlZExvY2tlZCwgc29ydGVkU3ViTW9kcykucmVkdWNlKChhY2N1bSwgaWQsIGlkeCkgPT4ge1xuICAgIGNvbnN0IHZvcnRleElkID0gQ0FDSEVbaWRdLnZvcnRleElkO1xuICAgIGNvbnN0IG5ld0VudHJ5ID0ge1xuICAgICAgcG9zOiBsb2FkT3JkZXJbdm9ydGV4SWRdPy5sb2NrZWQgPT09IHRydWVcbiAgICAgICAgPyBsb2FkT3JkZXJbdm9ydGV4SWRdLnBvc1xuICAgICAgICA6IGdldE5leHRBdmFpbGFibGUoYWNjdW0sIGlkeCksXG4gICAgICBlbmFibGVkOiBDQUNIRVtpZF0uaXNPZmZpY2lhbFxuICAgICAgICA/IHRydWVcbiAgICAgICAgOiAoISFsb2FkT3JkZXJbdm9ydGV4SWRdKVxuICAgICAgICAgID8gbG9hZE9yZGVyW3ZvcnRleElkXS5lbmFibGVkXG4gICAgICAgICAgOiB0cnVlLFxuICAgICAgbG9ja2VkOiAobG9hZE9yZGVyW3ZvcnRleElkXT8ubG9ja2VkID09PSB0cnVlKSxcbiAgICB9O1xuXG4gICAgYWNjdW1bdm9ydGV4SWRdID0gbmV3RW50cnk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCB7fSk7XG5cbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIoYWN0aXZlUHJvZmlsZS5pZCwgbmV3T3JkZXIpKTtcbiAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIG5ld09yZGVyKVxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgaWQ6ICdtbmIyLXNvcnQtZmluaXNoZWQnLFxuICAgICAgdHlwZTogJ2luZm8nLFxuICAgICAgbWVzc2FnZTogY29udGV4dC5hcGkudHJhbnNsYXRlKCdGaW5pc2hlZCBzb3J0aW5nJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXG4gICAgICBkaXNwbGF5TVM6IDMwMDAsXG4gICAgfSkpLmZpbmFsbHkoKCkgPT4gX0lTX1NPUlRJTkcgPSBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ21vdW50YW5kYmxhZGUyJ10sIHJlZHVjZXIpO1xuICAoY29udGV4dC5yZWdpc3RlclNldHRpbmdzIGFzIGFueSkoJ0ludGVyZmFjZScsIFNldHRpbmdzLCAoKSA9PiAoe1xuICAgIHQ6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSxcbiAgICBvblNldFNvcnRPbkRlcGxveTogKHByb2ZpbGVJZDogc3RyaW5nLCBzb3J0OiBib29sZWFuKSA9PlxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0U29ydE9uRGVwbG95KHByb2ZpbGVJZCwgc29ydCkpLFxuICB9KSwgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIHJldHVybiBwcm9maWxlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEO1xuICB9LCA1MSk7XG5cbiAgY29uc3QgbWV0YU1hbmFnZXIgPSBuZXcgQ29tTWV0YWRhdGFNYW5hZ2VyKGNvbnRleHQuYXBpKTtcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBHQU1FX0lELFxuICAgIG5hbWU6ICdNb3VudCAmIEJsYWRlIElJOlxcdEJhbm5lcmxvcmQnLFxuICAgIG1lcmdlTW9kczogdHJ1ZSxcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJy4nLFxuICAgIGdldEdhbWVWZXJzaW9uOiByZXNvbHZlR2FtZVZlcnNpb24sXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBCQU5ORVJMT1JEX0VYRUMsXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXIpLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgIEJBTk5FUkxPUkRfRVhFQyxcbiAgICBdLFxuICAgIHBhcmFtZXRlcnM6IFtdLFxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQudG9TdHJpbmcoKSxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIHN0ZWFtQXBwSWQ6IFNURUFNQVBQX0lELFxuICAgICAgZXBpY0FwcElkOiBFUElDQVBQX0lELFxuICAgICAgY3VzdG9tT3Blbk1vZHNQYXRoOiBNT0RVTEVTLFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcbiAgICAnbW91bnRhbmRibGFkZTJfY29sbGVjdGlvbl9kYXRhJyxcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10pID0+XG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMpLFxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSUNvbGxlY3Rpb25zRGF0YSkgPT5cbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgKHQpID0+IHQoJ01vdW50IGFuZCBCbGFkZSAyIERhdGEnKSxcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxuICApO1xuXG4gIC8vIFJlZ2lzdGVyIHRoZSBMTyBwYWdlLlxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XG4gICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgIGNyZWF0ZUluZm9QYW5lbDogKHByb3BzKSA9PiB7XG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XG4gICAgICByZXR1cm4gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcyk7XG4gICAgfSxcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxuICAgIGdhbWVBcnRVUkw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxuICAgIHByZVNvcnQ6IChpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlKSA9PlxuICAgICAgcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBtZXRhTWFuYWdlciksXG4gICAgY2FsbGJhY2s6IChsb2FkT3JkZXIpID0+IHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlciksXG4gICAgaXRlbVJlbmRlcmVyOiBDdXN0b21JdGVtUmVuZGVyZXIuZGVmYXVsdCxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHJvb3Rtb2QnLCAyMCwgdGVzdFJvb3RNb2QsIGluc3RhbGxSb290TW9kKTtcblxuICAvLyBJbnN0YWxscyBvbmUgb3IgbW9yZSBzdWJtb2R1bGVzLlxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiYW5uZXJsb3Jkc3VibW9kdWxlcycsIDI1LCB0ZXN0Rm9yU3VibW9kdWxlcywgaW5zdGFsbFN1Yk1vZHVsZXMpO1xuXG4gIC8vIEEgdmVyeSBzaW1wbGUgbWlncmF0aW9uIHRoYXQgaW50ZW5kcyB0byBhZGQgdGhlIHN1Yk1vZElkcyBhdHRyaWJ1dGVcbiAgLy8gIHRvIG1vZHMgdGhhdCBhY3QgYXMgXCJtb2QgcGFja3NcIi4gVGhpcyBtaWdyYXRpb24gaXMgbm9uLWludmFzaXZlIGFuZCB3aWxsXG4gIC8vICBub3QgcmVwb3J0IGFueSBlcnJvcnMuIFNpZGUgZWZmZWN0cyBvZiB0aGUgbWlncmF0aW9uIG5vdCB3b3JraW5nIGNvcnJlY3RseVxuICAvLyAgd2lsbCBub3QgYWZmZWN0IHRoZSB1c2VyJ3MgZXhpc3RpbmcgZW52aXJvbm1lbnQuXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24ob2xkID0+IG1pZ3JhdGUwMjYoY29udGV4dC5hcGksIG9sZCkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMDQ1KGNvbnRleHQuYXBpLCBvbGQpKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdnZW5lcmljLWxvYWQtb3JkZXItaWNvbnMnLCAyMDAsXG4gICAgX0lTX1NPUlRJTkcgPyAnc3Bpbm5lcicgOiAnbG9vdC1zb3J0Jywge30sICdBdXRvIFNvcnQnLCAoKSA9PiB7XG4gICAgICBzb3J0SW1wbChjb250ZXh0LCBtZXRhTWFuYWdlcik7XG4gIH0sICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIChnYW1lSWQgPT09IEdBTUVfSUQpO1xuICB9KTtcblxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PlxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PlxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9maWxlSWQsIG1ldGFNYW5hZ2VyKSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZSkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZiA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZj8uaWQsIG1ldGFNYW5hZ2VyKTtcbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgYXN5bmMgKHByb2ZpbGVJZCwgZmlsZXMpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzIC0gb3IgaWYgdGhlIHByb2ZpbGUgaXMgbm8gbG9uZ2VyIHZhbGlkLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcblxuICAgICAgYXdhaXQgQmx1ZWJpcmQubWFwKGZpbGVzLCBhc3luYyAoZW50cnk6IHsgZmlsZVBhdGg6IHN0cmluZywgY2FuZGlkYXRlczogc3RyaW5nW10gfSkgPT4ge1xuICAgICAgICAvLyBvbmx5IGFjdCBpZiB3ZSBkZWZpbml0aXZlbHkga25vdyB3aGljaCBtb2Qgb3ducyB0aGUgZmlsZVxuICAgICAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxuICAgICAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLCB1bmRlZmluZWQpO1xuICAgICAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ10sIGVudHJ5LmZpbGVQYXRoKTtcbiAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xuICAgICAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LlxuICAgICAgICAgIC8vICBUaGF0IHdheSwgdm9ydGV4IHdpbGwgY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0XG4gICAgICAgICAgLy8gIGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcbiAgICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xuXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSB0YXJnZXQgZGVzdGluYXRpb24gZmlsZSBpZiBpdCBleGlzdHMuXG4gICAgICAgICAgLy8gIHRoaXMgaXMgdG8gY29tcGxldGVseSBhdm9pZCBhIHNjZW5hcmlvIHdoZXJlIHdlIG1heSBhdHRlbXB0IHRvXG4gICAgICAgICAgLy8gIGNvcHkgdGhlIHNhbWUgZmlsZSBvbnRvIGl0c2VsZi5cbiAgICAgICAgICByZXR1cm4gZnMucmVtb3ZlQXN5bmModGFyZ2V0UGF0aClcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIHRhcmdldFBhdGgpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpKVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBpbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluLFxufTtcbiJdfQ==