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
function resolveGameVersion(discoveryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV !== 'development' && semver_1.default.satisfies(vortex_api_1.util.getApplication().version, '<1.4.0')) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('not supported in older Vortex versions'));
        }
        try {
            const data = yield (0, util_1.getXMLData)(path_1.default.join(discoveryPath, 'bin', 'Win64_Shipping_Client', 'Version.xml'));
            const exePath = path_1.default.join(discoveryPath, common_1.BANNERLORD_EXEC);
            const value = data.get('//Singleplayer')
                .attr('Value')
                .value()
                .slice(1)
                .split('.')
                .slice(0, 3)
                .join('.');
            return (semver_1.default.valid(value)) ? Promise.resolve(value) : (0, exe_version_1.default)(exePath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUd0Qyw4REFBcUM7QUFFckMsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBa0Y7QUFDbEYsaUNBQW1GO0FBRW5GLHFDQUE0RztBQUM1Ryw4RUFBc0Q7QUFDdEQsNkNBQTBDO0FBRTFDLDhFQUFzRDtBQUN0RCwrQ0FBc0c7QUFFdEcsMkRBQXFGO0FBQ3JGLHNGQUE4RDtBQUc5RCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx1QkFBdUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBQ3pHLE1BQU0sZ0JBQWdCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztBQUU3RyxJQUFJLFFBQVEsQ0FBQztBQUViLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQztBQUMzQixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUM7QUFFL0IsTUFBTSxjQUFjLEdBQUcsdUJBQXVCLENBQUM7QUFNL0MsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUztJQUNwRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO0FBRS9DLFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNYLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FB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LEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDbEY7WUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb21pc2UgYXMgQmx1ZWJpcmQgfSBmcm9tICdibHVlYmlyZCc7XHJcblxyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcblxyXG5pbXBvcnQgeyBFbGVtZW50IH0gZnJvbSAnbGlieG1sanMnO1xyXG5pbXBvcnQgZ2V0VmVyc2lvbiBmcm9tICdleGUtdmVyc2lvbic7XHJcblxyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IGdldEVsZW1lbnRWYWx1ZSwgZ2V0WE1MRGF0YSwgcmVmcmVzaEdhbWVQYXJhbXMsIHdhbGtBc3luYyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQgeyBCQU5ORVJMT1JEX0VYRUMsIEdBTUVfSUQsIExPQ0tFRF9NT0RVTEVTLCBNT0RVTEVTLCBPRkZJQ0lBTF9NT0RVTEVTLCBTVUJNT0RfRklMRSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IEN1c3RvbUl0ZW1SZW5kZXJlciBmcm9tICcuL2N1c3RvbUl0ZW1SZW5kZXJlcic7XHJcbmltcG9ydCB7IG1pZ3JhdGUwMjYgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuaW1wb3J0IENvbU1ldGFkYXRhTWFuYWdlciBmcm9tICcuL0NvbU1ldGFkYXRhTWFuYWdlcic7XHJcbmltcG9ydCB7IGdldENhY2hlLCBnZXRMYXVuY2hlckRhdGEsIGlzSW52YWxpZCwgcGFyc2VMYXVuY2hlckRhdGEsIHJlZnJlc2hDYWNoZSB9IGZyb20gJy4vc3ViTW9kQ2FjaGUnO1xyXG5pbXBvcnQgeyBJU29ydFByb3BzLCBJU3ViTW9kQ2FjaGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xyXG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5pbXBvcnQgeyBJQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XHJcblxyXG5jb25zdCBMQVVOQ0hFUl9FWEVDID0gcGF0aC5qb2luKCdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1RhbGVXb3JsZHMuTW91bnRBbmRCbGFkZS5MYXVuY2hlci5leGUnKTtcclxuY29uc3QgTU9ERElOR19LSVRfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX3dFZGl0b3InLCAnVGFsZVdvcmxkcy5Nb3VudEFuZEJsYWRlLkxhdW5jaGVyLmV4ZScpO1xyXG5cclxubGV0IFNUT1JFX0lEO1xyXG5cclxuY29uc3QgU1RFQU1BUFBfSUQgPSAyNjE1NTA7XHJcbmNvbnN0IEVQSUNBUFBfSUQgPSAnQ2hpY2thZGVlJztcclxuXHJcbmNvbnN0IEkxOE5fTkFNRVNQQUNFID0gJ2dhbWUtbW91bnQtYW5kLWJsYWRlMic7XHJcblxyXG4vLyBBIHNldCBvZiBmb2xkZXIgbmFtZXMgKGxvd2VyY2FzZWQpIHdoaWNoIGFyZSBhdmFpbGFibGUgYWxvbmdzaWRlIHRoZVxyXG4vLyAgZ2FtZSdzIG1vZHVsZXMgZm9sZGVyLiBXZSBjb3VsZCd2ZSB1c2VkIHRoZSBmb21vZCBpbnN0YWxsZXIgc3RvcCBwYXR0ZXJuc1xyXG4vLyAgZnVuY3Rpb25hbGl0eSBmb3IgdGhpcywgYnV0IGl0J3MgYmV0dGVyIGlmIHRoaXMgZXh0ZW5zaW9uIGlzIHNlbGYgY29udGFpbmVkO1xyXG4vLyAgZXNwZWNpYWxseSBnaXZlbiB0aGF0IHRoZSBnYW1lJ3MgbW9kZGluZyBwYXR0ZXJuIGNoYW5nZXMgcXVpdGUgb2Z0ZW4uXHJcbmNvbnN0IFJPT1RfRk9MREVSUyA9IG5ldyBTZXQoWydiaW4nLCAnZGF0YScsICdndWknLCAnaWNvbnMnLCAnbW9kdWxlcycsXHJcbiAgJ211c2ljJywgJ3NoYWRlcnMnLCAnc291bmRzJywgJ3htbHNjaGVtYXMnXSk7XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0VQSUNBUFBfSUQsIFNURUFNQVBQX0lELnRvU3RyaW5nKCldKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiB7XHJcbiAgICAgIFNUT1JFX0lEID0gZ2FtZS5nYW1lU3RvcmVJZDtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShnYW1lLmdhbWVQYXRoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Um9vdE1vZChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgbm90U3VwcG9ydGVkID0geyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9O1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIERpZmZlcmVudCBnYW1lLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XHJcbiAgY29uc3QgbW9kc0ZpbGUgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSkgIT09IC0xKTtcclxuICBpZiAobW9kc0ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVGhlcmUncyBubyBNb2R1bGVzIGZvbGRlci5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGlkeCA9IG1vZHNGaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMudG9Mb3dlckNhc2UoKSk7XHJcbiAgY29uc3Qgcm9vdEZvbGRlck1hdGNoZXMgPSBsb3dlcmVkLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4gKCgoc2VnbWVudHMubGVuZ3RoIC0gMSkgPiBpZHgpICYmIFJPT1RfRk9MREVSUy5oYXMoc2VnbWVudHNbaWR4XSkpO1xyXG4gIH0pIHx8IFtdO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiAocm9vdEZvbGRlck1hdGNoZXMubGVuZ3RoID4gMCksIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsUm9vdE1vZChmaWxlcywgZGVzdGluYXRpb25QYXRoKSB7XHJcbiAgY29uc3QgbW9kdWxlRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKE1PRFVMRVMpICE9PSAtMSk7XHJcbiAgY29uc3QgaWR4ID0gbW9kdWxlRmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XHJcbiAgICBjb25zdCBsYXN0RWxlbWVudElkeCA9IHNlZ21lbnRzLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgLy8gSWdub3JlIGRpcmVjdG9yaWVzIGFuZCBlbnN1cmUgdGhhdCB0aGUgZmlsZSBjb250YWlucyBhIGtub3duIHJvb3QgZm9sZGVyIGF0XHJcbiAgICAvLyAgdGhlIGV4cGVjdGVkIGluZGV4LlxyXG4gICAgcmV0dXJuIChST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pXHJcbiAgICAgICYmIChwYXRoLmV4dG5hbWUoc2VnbWVudHNbbGFzdEVsZW1lbnRJZHhdKSAhPT0gJycpKTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgY29uc3QgZGVzdGluYXRpb24gPSBmaWxlLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGlkeClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKHBhdGguc2VwKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbixcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RGb3JTdWJtb2R1bGVzKGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBDaGVjayB0aGlzIGlzIGEgbW9kIGZvciBCYW5uZXJsb3JkIGFuZCBpdCBjb250YWlucyBhIFN1Yk1vZHVsZS54bWxcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKSAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFN1Yk1vZHVsZXMoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIC8vIFJlbW92ZSBkaXJlY3RvcmllcyBzdHJhaWdodCBhd2F5LlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIHJldHVybiBwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pICE9PSAnJztcclxuICB9KTtcclxuICBjb25zdCBzdWJNb2RJZHMgPSBbXTtcclxuICBjb25zdCBzdWJNb2RzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShzdWJNb2RzLCBhc3luYyAoYWNjdW0sIG1vZEZpbGU6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBtb2RGaWxlLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICAgIGNvbnN0IHN1Yk1vZElkID0gYXdhaXQgZ2V0RWxlbWVudFZhbHVlKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEZpbGUpLCAnSWQnKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSAoc2VnbWVudHMubGVuZ3RoID4gMSlcclxuICAgICAgPyBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAyXVxyXG4gICAgICA6IHN1Yk1vZElkO1xyXG5cclxuICAgIHN1Yk1vZElkcy5wdXNoKHN1Yk1vZElkKTtcclxuICAgIGNvbnN0IGlkeCA9IG1vZEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKFNVQk1PRF9GSUxFKTtcclxuICAgIC8vIEZpbHRlciB0aGUgbW9kIGZpbGVzIGZvciB0aGlzIHNwZWNpZmljIHN1Ym1vZHVsZS5cclxuICAgIGNvbnN0IHN1Yk1vZEZpbGVzOiBzdHJpbmdbXVxyXG4gICAgICA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IGZpbGUuc2xpY2UoMCwgaWR4KSA9PT0gbW9kRmlsZS5zbGljZSgwLCBpZHgpKTtcclxuICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IHN1Yk1vZEZpbGVzLm1hcCgobW9kRmlsZTogc3RyaW5nKSA9PiAoe1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogbW9kRmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihNT0RVTEVTLCBtb2ROYW1lLCBtb2RGaWxlLnNsaWNlKGlkeCkpLFxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIGFjY3VtLmNvbmNhdChpbnN0cnVjdGlvbnMpO1xyXG4gIH0sIFtdKVxyXG4gIC50aGVuKG1lcmdlZCA9PiB7XHJcbiAgICBjb25zdCBzdWJNb2RJZHNBdHRyID0ge1xyXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAga2V5OiAnc3ViTW9kSWRzJyxcclxuICAgICAgdmFsdWU6IHN1Yk1vZElkcyxcclxuICAgIH07XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zOiBbXS5jb25jYXQobWVyZ2VkLCBbc3ViTW9kSWRzQXR0cl0pIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlbnN1cmVPZmZpY2lhbExhdW5jaGVyKGNvbnRleHQsIGRpc2NvdmVyeSkge1xyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woR0FNRV9JRCwgJ1RhbGVXb3JsZHNCYW5uZXJsb3JkTGF1bmNoZXInLCB7XHJcbiAgICBpZDogJ1RhbGVXb3JsZHNCYW5uZXJsb3JkTGF1bmNoZXInLFxyXG4gICAgbmFtZTogJ09mZmljaWFsIExhdW5jaGVyJyxcclxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBwYXRoLmJhc2VuYW1lKExBVU5DSEVSX0VYRUMpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICBwYXRoLmJhc2VuYW1lKExBVU5DSEVSX0VYRUMpLFxyXG4gICAgXSxcclxuICAgIHBhdGg6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTEFVTkNIRVJfRVhFQyksXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ2JpbicsICdXaW42NF9TaGlwcGluZ19DbGllbnQnKSxcclxuICAgIGhpZGRlbjogZmFsc2UsXHJcbiAgICBjdXN0b206IGZhbHNlLFxyXG4gIH0sIGZhbHNlKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldE1vZGRpbmdUb29sKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZGRlbj86IGJvb2xlYW4pIHtcclxuICBjb25zdCB0b29sSWQgPSAnYmFubmVybG9yZC1zZGsnO1xyXG4gIGNvbnN0IGV4ZWMgPSBwYXRoLmJhc2VuYW1lKE1PRERJTkdfS0lUX0VYRUMpO1xyXG4gIGNvbnN0IHRvb2wgPSB7XHJcbiAgICBpZDogdG9vbElkLFxyXG4gICAgbmFtZTogJ01vZGRpbmcgS2l0JyxcclxuICAgIGxvZ286ICd0d2xhdW5jaGVyLnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBleGVjLFxyXG4gICAgcmVxdWlyZWRGaWxlczogWyBleGVjIF0sXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRERJTkdfS0lUX0VYRUMpLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIHBhdGguZGlybmFtZShNT0RESU5HX0tJVF9FWEVDKSksXHJcbiAgICBoaWRkZW4sXHJcbiAgICBjdXN0b206IGZhbHNlLFxyXG4gIH07XHJcblxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woR0FNRV9JRCwgdG9vbElkLCB0b29sLCBmYWxzZSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnksIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICAvLyBRdWlja2x5IGVuc3VyZSB0aGF0IHRoZSBvZmZpY2lhbCBMYXVuY2hlciBpcyBhZGRlZC5cclxuICBlbnN1cmVPZmZpY2lhbExhdW5jaGVyKGNvbnRleHQsIGRpc2NvdmVyeSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1PRERJTkdfS0lUX0VYRUMpKTtcclxuICAgIHNldE1vZGRpbmdUb29sKGNvbnRleHQsIGRpc2NvdmVyeSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCB0b29scyA9IGRpc2NvdmVyeT8udG9vbHM7XHJcbiAgICBpZiAoKHRvb2xzICE9PSB1bmRlZmluZWQpXHJcbiAgICAmJiAodXRpbC5nZXRTYWZlKHRvb2xzLCBbJ2Jhbm5lcmxvcmQtc2RrJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgc2V0TW9kZGluZ1Rvb2woY29udGV4dCwgZGlzY292ZXJ5LCB0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIElmIGdhbWUgc3RvcmUgbm90IGZvdW5kLCBsb2NhdGlvbiBtYXkgYmUgc2V0IG1hbnVhbGx5IC0gYWxsb3cgc2V0dXBcclxuICAvLyAgZnVuY3Rpb24gdG8gY29udGludWUuXHJcbiAgY29uc3QgZmluZFN0b3JlSWQgPSAoKSA9PiBmaW5kR2FtZSgpLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUoKSk7XHJcbiAgY29uc3Qgc3RhcnRTdGVhbSA9ICgpID0+IGZpbmRTdG9yZUlkKClcclxuICAgIC50aGVuKCgpID0+IChTVE9SRV9JRCA9PT0gJ3N0ZWFtJylcclxuICAgICAgPyB1dGlsLkdhbWVTdG9yZUhlbHBlci5sYXVuY2hHYW1lU3RvcmUoY29udGV4dC5hcGksIFNUT1JFX0lELCB1bmRlZmluZWQsIHRydWUpXHJcbiAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG5cclxuICAvLyBDaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHNldCB0aGUgbG9hZCBvcmRlciBvYmplY3QgZm9yIHRoaXMgcHJvZmlsZVxyXG4gIC8vICBhbmQgY3JlYXRlIGl0IGlmIHdlIGhhdmVuJ3QuXHJcbiAgcmV0dXJuIHN0YXJ0U3RlYW0oKS50aGVuKCgpID0+IHBhcnNlTGF1bmNoZXJEYXRhKCkpLnRoZW4oYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgcmVmcmVzaENhY2hlKGNvbnRleHQpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGRvIGEgcXVpY2sgdFNvcnQgYXQgdGhpcyBwb2ludCAtIG5vdCBnb2luZyB0b1xyXG4gICAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxyXG4gICAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAgIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIGNvbnN0IHNvcnRlZCA9IHRTb3J0KHsgc3ViTW9kSWRzOiBtb2RJZHMsIGFsbG93TG9ja2VkOiB0cnVlLCBtZXRhTWFuYWdlciB9KTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuTm90Rm91bmQpIHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxyXG4gICAgICAgICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgdGhyb3VnaCB0aGUgb2ZmaWNpYWwgZ2FtZSBsYXVuY2hlciBhbmQgJ1xyXG4gICAgICArICd0cnkgYWdhaW4nLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xyXG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBmaW5kIGdhbWUgbGF1bmNoZXIgZGF0YScsXHJcbiAgICAgICAgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9KVxyXG4gIC5maW5hbGx5KCgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFZhbGlkIHVzZSBjYXNlIHdoZW4gYXR0ZW1wdGluZyB0byBzd2l0Y2ggdG9cclxuICAgICAgLy8gIEJhbm5lcmxvcmQgd2l0aG91dCBhbnkgYWN0aXZlIHByb2ZpbGUuXHJcbiAgICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCB7fSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRTb3J0KHNvcnRQcm9wczogSVNvcnRQcm9wcywgdGVzdDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgY29uc3QgeyBzdWJNb2RJZHMsIGFsbG93TG9ja2VkLCBsb2FkT3JkZXIsIG1ldGFNYW5hZ2VyIH0gPSBzb3J0UHJvcHM7XHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIC8vIFRvcG9sb2dpY2FsIHNvcnQgLSB3ZSBuZWVkIHRvOlxyXG4gIC8vICAtIElkZW50aWZ5IGN5Y2xpYyBkZXBlbmRlbmNpZXMuXHJcbiAgLy8gIC0gSWRlbnRpZnkgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgLy8gIC0gV2Ugd2lsbCB0cnkgdG8gaWRlbnRpZnkgaW5jb21wYXRpYmxlIGRlcGVuZGVuY2llcyAodmVyc2lvbi13aXNlKVxyXG5cclxuICAvLyBUaGVzZSBhcmUgbWFudWFsbHkgbG9ja2VkIG1vZCBlbnRyaWVzLlxyXG4gIGNvbnN0IGxvY2tlZFN1Yk1vZHMgPSAoISFsb2FkT3JkZXIpXHJcbiAgICA/IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kSWQgPT4ge1xyXG4gICAgICBjb25zdCBlbnRyeSA9IENBQ0hFW3N1Yk1vZElkXTtcclxuICAgICAgcmV0dXJuICghIWVudHJ5KVxyXG4gICAgICAgID8gISFsb2FkT3JkZXJbZW50cnkudm9ydGV4SWRdPy5sb2NrZWRcclxuICAgICAgICA6IGZhbHNlO1xyXG4gICAgfSlcclxuICAgIDogW107XHJcbiAgY29uc3QgYWxwaGFiZXRpY2FsID0gc3ViTW9kSWRzLmZpbHRlcihzdWJNb2QgPT4gIWxvY2tlZFN1Yk1vZHMuaW5jbHVkZXMoc3ViTW9kKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgpO1xyXG4gIGNvbnN0IGdyYXBoID0gYWxwaGFiZXRpY2FsLnJlZHVjZSgoYWNjdW0sIGVudHJ5KSA9PiB7XHJcbiAgICBjb25zdCBkZXBJZHMgPSBbLi4uQ0FDSEVbZW50cnldLmRlcGVuZGVuY2llc10ubWFwKGRlcCA9PiBkZXAuZGVwSWQpO1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBub2RlIGdyYXBoLlxyXG4gICAgYWNjdW1bZW50cnldID0gZGVwSWRzLnNvcnQoKTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIC8vIFdpbGwgc3RvcmUgdGhlIGZpbmFsIExPIHJlc3VsdFxyXG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG5cclxuICAvLyBUaGUgbm9kZXMgd2UgaGF2ZSB2aXNpdGVkL3Byb2Nlc3NlZC5cclxuICBjb25zdCB2aXNpdGVkID0gW107XHJcblxyXG4gIC8vIFRoZSBub2RlcyB3aGljaCBhcmUgc3RpbGwgcHJvY2Vzc2luZy5cclxuICBjb25zdCBwcm9jZXNzaW5nID0gW107XHJcblxyXG4gIGNvbnN0IHRvcFNvcnQgPSAobm9kZSkgPT4ge1xyXG4gICAgcHJvY2Vzc2luZ1tub2RlXSA9IHRydWU7XHJcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSAoISFhbGxvd0xvY2tlZClcclxuICAgICAgPyBncmFwaFtub2RlXVxyXG4gICAgICA6IGdyYXBoW25vZGVdLmZpbHRlcihlbGVtZW50ID0+ICFMT0NLRURfTU9EVUxFUy5oYXMoZWxlbWVudCkpO1xyXG5cclxuICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcGVuZGVuY2llcykge1xyXG4gICAgICBpZiAocHJvY2Vzc2luZ1tkZXBdKSB7XHJcbiAgICAgICAgLy8gQ3ljbGljIGRlcGVuZGVuY3kgZGV0ZWN0ZWQgLSBoaWdobGlnaHQgYm90aCBtb2RzIGFzIGludmFsaWRcclxuICAgICAgICAvLyAgd2l0aGluIHRoZSBjYWNoZSBpdHNlbGYgLSB3ZSBhbHNvIG5lZWQgdG8gaGlnaGxpZ2h0IHdoaWNoIG1vZHMuXHJcbiAgICAgICAgQ0FDSEVbbm9kZV0uaW52YWxpZC5jeWNsaWMucHVzaChkZXApO1xyXG4gICAgICAgIENBQ0hFW2RlcF0uaW52YWxpZC5jeWNsaWMucHVzaChub2RlKTtcclxuXHJcbiAgICAgICAgdmlzaXRlZFtub2RlXSA9IHRydWU7XHJcbiAgICAgICAgcHJvY2Vzc2luZ1tub2RlXSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBpbmNvbXBhdGlibGVEZXBzID0gQ0FDSEVbbm9kZV0uaW52YWxpZC5pbmNvbXBhdGlibGVEZXBzO1xyXG4gICAgICBjb25zdCBpbmNEZXAgPSBpbmNvbXBhdGlibGVEZXBzLmZpbmQoZCA9PiBkLmRlcElkID09PSBkZXApO1xyXG4gICAgICBpZiAoT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKGRlcCkgJiYgKGluY0RlcCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIGNvbnN0IGRlcFZlciA9IENBQ0hFW2RlcF0uc3ViTW9kVmVyO1xyXG4gICAgICAgIGNvbnN0IGRlcEluc3QgPSBDQUNIRVtub2RlXS5kZXBlbmRlbmNpZXMuZmluZChkID0+IGQuZGVwSWQgPT09IGRlcCk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IG1hdGNoID0gc2VtdmVyLnNhdGlzZmllcyhkZXBJbnN0LmRlcFZlcnNpb24sIGRlcFZlcik7XHJcbiAgICAgICAgICBpZiAoIW1hdGNoICYmICEhZGVwSW5zdD8uZGVwVmVyc2lvbiAmJiAhIWRlcFZlcikge1xyXG4gICAgICAgICAgICBDQUNIRVtub2RlXS5pbnZhbGlkLmluY29tcGF0aWJsZURlcHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgZGVwSWQ6IGRlcCxcclxuICAgICAgICAgICAgICByZXF1aXJlZFZlcnNpb246IGRlcEluc3QuZGVwVmVyc2lvbixcclxuICAgICAgICAgICAgICBjdXJyZW50VmVyc2lvbjogZGVwVmVyLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIC8vIE9rIHNvIHdlIGRpZG4ndCBtYW5hZ2UgdG8gY29tcGFyZSB0aGUgdmVyc2lvbnMsIHdlIGxvZyB0aGlzIGFuZFxyXG4gICAgICAgICAgLy8gIGNvbnRpbnVlLlxyXG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gY29tcGFyZSB2ZXJzaW9ucycsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXZpc2l0ZWRbZGVwXSAmJiAhbG9ja2VkU3ViTW9kcy5pbmNsdWRlcyhkZXApKSB7XHJcbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhncmFwaCkuaW5jbHVkZXMoZGVwKSkge1xyXG4gICAgICAgICAgQ0FDSEVbbm9kZV0uaW52YWxpZC5taXNzaW5nLnB1c2goZGVwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdG9wU29ydChkZXApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3Npbmdbbm9kZV0gPSBmYWxzZTtcclxuICAgIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xyXG5cclxuICAgIGlmICghaXNJbnZhbGlkKG5vZGUpKSB7XHJcbiAgICAgIHJlc3VsdC5wdXNoKG5vZGUpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGZvciAoY29uc3Qgbm9kZSBpbiBncmFwaCkge1xyXG4gICAgaWYgKCF2aXNpdGVkW25vZGVdICYmICFwcm9jZXNzaW5nW25vZGVdKSB7XHJcbiAgICAgIHRvcFNvcnQobm9kZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoYWxsb3dMb2NrZWQpIHtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvLyBQcm9wZXIgdG9wb2xvZ2ljYWwgc29ydCBkaWN0YXRlcyB3ZSBzaW1wbHkgcmV0dXJuIHRoZVxyXG4gIC8vICByZXN1bHQgYXQgdGhpcyBwb2ludC4gQnV0LCBtb2QgYXV0aG9ycyB3YW50IG1vZHVsZXNcclxuICAvLyAgd2l0aCBubyBkZXBlbmRlbmNpZXMgdG8gYnViYmxlIHVwIHRvIHRoZSB0b3Agb2YgdGhlIExPLlxyXG4gIC8vICAoVGhpcyB3aWxsIG9ubHkgYXBwbHkgdG8gbm9uIGxvY2tlZCBlbnRyaWVzKVxyXG4gIGNvbnN0IHN1Yk1vZHNXaXRoTm9EZXBzID0gcmVzdWx0LmZpbHRlcihkZXAgPT4gKGdyYXBoW2RlcF0ubGVuZ3RoID09PSAwKVxyXG4gICAgfHwgKGdyYXBoW2RlcF0uZmluZChkID0+ICFMT0NLRURfTU9EVUxFUy5oYXMoZCkpID09PSB1bmRlZmluZWQpKS5zb3J0KCkgfHwgW107XHJcbiAgY29uc3QgdGFtcGVyZWRSZXN1bHQgPSBbXS5jb25jYXQoc3ViTW9kc1dpdGhOb0RlcHMsXHJcbiAgICByZXN1bHQuZmlsdGVyKGVudHJ5ID0+ICFzdWJNb2RzV2l0aE5vRGVwcy5pbmNsdWRlcyhlbnRyeSkpKTtcclxuICBsb2NrZWRTdWJNb2RzLmZvckVhY2goc3ViTW9kSWQgPT4ge1xyXG4gICAgY29uc3QgcG9zID0gbG9hZE9yZGVyW0NBQ0hFW3N1Yk1vZElkXS52b3J0ZXhJZF0ucG9zO1xyXG4gICAgdGFtcGVyZWRSZXN1bHQuc3BsaWNlKHBvcywgMCwgW3N1Yk1vZElkXSk7XHJcbiAgfSk7XHJcblxyXG4gIGlmICh0ZXN0ID09PSB0cnVlKSB7XHJcbiAgICBjb25zdCBtZXRhU29ydGVkID0gbWV0YU1hbmFnZXIuc29ydCh0YW1wZXJlZFJlc3VsdCk7XHJcbiAgICByZXR1cm4gbWV0YVNvcnRlZDtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHRhbXBlcmVkUmVzdWx0O1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNFeHRlcm5hbChjb250ZXh0LCBzdWJNb2RJZCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMobW9kcyk7XHJcbiAgbW9kSWRzLmZvckVhY2gobW9kSWQgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWRzID0gdXRpbC5nZXRTYWZlKG1vZHNbbW9kSWRdLCBbJ2F0dHJpYnV0ZXMnLCAnc3ViTW9kSWRzJ10sIFtdKTtcclxuICAgIGlmIChzdWJNb2RJZHMuaW5jbHVkZXMoc3ViTW9kSWQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubGV0IHJlZnJlc2hGdW5jO1xyXG5hc3luYyBmdW5jdGlvbiByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFNYW5hZ2VyOiBDb21NZXRhZGF0YU1hbmFnZXIpIHtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IGRlcGxveVByb2ZpbGU/LmdhbWVJZCkgfHwgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkpIHtcclxuICAgIC8vIERlcGxveW1lbnQgZXZlbnQgc2VlbXMgdG8gYmUgZXhlY3V0ZWQgZm9yIGEgcHJvZmlsZSBvdGhlclxyXG4gICAgLy8gIHRoYW4gdGhlIGN1cnJlbnRseSBhY3RpdmUgb25lLiBOb3QgZ29pbmcgdG8gY29udGludWUuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBtZXRhTWFuYWdlci51cGRhdGVEZXBlbmRlbmN5TWFwKHByb2ZpbGVJZCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCByZWZyZXNoQ2FjaGUoY29udGV4dCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBQcm9jZXNzQ2FuY2VsZWQgbWVhbnMgdGhhdCB3ZSB3ZXJlIHVuYWJsZSB0byBzY2FuIGZvciBkZXBsb3llZFxyXG4gICAgLy8gIHN1Yk1vZHVsZXMsIHByb2JhYmx5IGJlY2F1c2UgZ2FtZSBkaXNjb3ZlcnkgaXMgaW5jb21wbGV0ZS5cclxuICAgIC8vIEl0J3MgYmV5b25kIHRoZSBzY29wZSBvZiB0aGlzIGZ1bmN0aW9uIHRvIHJlcG9ydCBkaXNjb3ZlcnlcclxuICAgIC8vICByZWxhdGVkIGlzc3Vlcy5cclxuICAgIHJldHVybiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwge30pO1xyXG5cclxuICAvLyBXZSdyZSBnb2luZyB0byBkbyBhIHF1aWNrIHRTb3J0IGF0IHRoaXMgcG9pbnQgLSBub3QgZ29pbmcgdG9cclxuICAvLyAgY2hhbmdlIHRoZSB1c2VyJ3MgbG9hZCBvcmRlciwgYnV0IHRoaXMgd2lsbCBoaWdobGlnaHQgYW55XHJcbiAgLy8gIGN5Y2xpYyBvciBtaXNzaW5nIGRlcGVuZGVuY2llcy5cclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gIGNvbnN0IHNvcnRQcm9wczogSVNvcnRQcm9wcyA9IHtcclxuICAgIHN1Yk1vZElkczogbW9kSWRzLFxyXG4gICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICBsb2FkT3JkZXIsXHJcbiAgICBtZXRhTWFuYWdlcixcclxuICB9O1xyXG4gIGNvbnN0IHNvcnRlZCA9IHRTb3J0KHNvcnRQcm9wcyk7XHJcblxyXG4gIGlmIChyZWZyZXNoRnVuYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZWZyZXNoRnVuYygpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlcik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgbWV0YU1hbmFnZXIpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQgfHwgYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBSYWNlIGNvbmRpdGlvbiA/XHJcbiAgICByZXR1cm4gaXRlbXM7XHJcbiAgfVxyXG5cclxuICBsZXQgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gIGlmIChpdGVtcy5sZW5ndGggPiAwICYmIG1vZElkcy5sZW5ndGggPT09IDApIHtcclxuICAgIC8vIENhY2hlIGhhc24ndCBiZWVuIHBvcHVsYXRlZCB5ZXQuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBSZWZyZXNoIHRoZSBjYWNoZS5cclxuICAgICAgYXdhaXQgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBhY3RpdmVQcm9maWxlLmlkLCBtZXRhTWFuYWdlcik7XHJcbiAgICAgIG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIExvY2tlZCBpZHMgYXJlIGFsd2F5cyBhdCB0aGUgdG9wIG9mIHRoZSBsaXN0IGFzIGFsbFxyXG4gIC8vICBvdGhlciBtb2R1bGVzIGRlcGVuZCBvbiB0aGVzZS5cclxuICBsZXQgbG9ja2VkSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiBDQUNIRVtpZF0uaXNMb2NrZWQpO1xyXG5cclxuICB0cnkge1xyXG4gICAgLy8gU29ydCB0aGUgbG9ja2VkIGlkcyBhbW9uZ3N0IHRoZW1zZWx2ZXMgdG8gZW5zdXJlXHJcbiAgICAvLyAgdGhhdCB0aGUgZ2FtZSByZWNlaXZlcyB0aGVzZSBpbiB0aGUgcmlnaHQgb3JkZXIuXHJcbiAgICBjb25zdCBzb3J0UHJvcHM6IElTb3J0UHJvcHMgPSB7XHJcbiAgICAgIHN1Yk1vZElkczogbG9ja2VkSWRzLFxyXG4gICAgICBhbGxvd0xvY2tlZDogdHJ1ZSxcclxuICAgICAgbWV0YU1hbmFnZXIsXHJcbiAgICB9O1xyXG4gICAgbG9ja2VkSWRzID0gdFNvcnQoc29ydFByb3BzKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy8gQ3JlYXRlIHRoZSBsb2NrZWQgZW50cmllcy5cclxuICBjb25zdCBsb2NrZWRJdGVtcyA9IGxvY2tlZElkcy5tYXAoaWQgPT4gKHtcclxuICAgIGlkOiBDQUNIRVtpZF0udm9ydGV4SWQsXHJcbiAgICBuYW1lOiBDQUNIRVtpZF0uc3ViTW9kTmFtZSxcclxuICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBsb2NrZWQ6IHRydWUsXHJcbiAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoaWQpLFxyXG4gIH0pKTtcclxuXHJcbiAgY29uc3QgTEFVTkNIRVJfREFUQSA9IGdldExhdW5jaGVyRGF0YSgpO1xyXG5cclxuICAvLyBFeHRlcm5hbCBpZHMgd2lsbCBpbmNsdWRlIG9mZmljaWFsIG1vZHVsZXMgYXMgd2VsbCBidXQgbm90IGxvY2tlZCBlbnRyaWVzLlxyXG4gIGNvbnN0IGV4dGVybmFsSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiAoIUNBQ0hFW2lkXS5pc0xvY2tlZCkgJiYgKENBQ0hFW2lkXS52b3J0ZXhJZCA9PT0gaWQpKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IExPa2V5cyA9ICgoT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPiAwKVxyXG4gICAgPyBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXHJcbiAgICA6IExBVU5DSEVSX0RBVEEuc2luZ2xlUGxheWVyU3ViTW9kcy5tYXAobW9kID0+IG1vZC5zdWJNb2RJZCkpO1xyXG5cclxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHRoYXQgYXJlIGFscmVhZHkgaW4gdGhlIGxvYWQgb3JkZXIuXHJcbiAgY29uc3Qga25vd25FeHQgPSBleHRlcm5hbElkcy5maWx0ZXIoaWQgPT4gTE9rZXlzLmluY2x1ZGVzKGlkKSkgfHwgW107XHJcblxyXG4gIC8vIEV4dGVybmFsIG1vZHVsZXMgd2hpY2ggYXJlIG5ldyBhbmQgaGF2ZSB5ZXQgdG8gYmUgYWRkZWQgdG8gdGhlIExPLlxyXG4gIGNvbnN0IHVua25vd25FeHQgPSBleHRlcm5hbElkcy5maWx0ZXIoaWQgPT4gIUxPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xyXG5cclxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+IHtcclxuICAgIC8vIFJlbW92ZSBhbnkgbG9ja2VkSWRzLCBidXQgYWxzbyBlbnN1cmUgdGhhdCB0aGVcclxuICAgIC8vICBlbnRyeSBjYW4gYmUgZm91bmQgaW4gdGhlIGNhY2hlLiBJZiBpdCdzIG5vdCBpbiB0aGVcclxuICAgIC8vICBjYWNoZSwgdGhpcyBtYXkgbWVhbiB0aGF0IHRoZSBzdWJtb2QgeG1sIGZpbGUgZmFpbGVkXHJcbiAgICAvLyAgcGFyc2UtaW5nIGFuZCB0aGVyZWZvcmUgc2hvdWxkIG5vdCBiZSBkaXNwbGF5ZWQuXHJcbiAgICBjb25zdCBpc0xvY2tlZCA9IGxvY2tlZElkcy5pbmNsdWRlcyhpdGVtLmlkKTtcclxuICAgIGNvbnN0IGhhc0NhY2hlRW50cnkgPSBPYmplY3Qua2V5cyhDQUNIRSkuZmluZChrZXkgPT5cclxuICAgICAgQ0FDSEVba2V5XS52b3J0ZXhJZCA9PT0gaXRlbS5pZCkgIT09IHVuZGVmaW5lZDtcclxuICAgIHJldHVybiAhaXNMb2NrZWQgJiYgaGFzQ2FjaGVFbnRyeTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgcG9zTWFwID0ge307XHJcbiAgbGV0IG5leHRBdmFpbGFibGUgPSBMT2tleXMubGVuZ3RoO1xyXG4gIGNvbnN0IGdldE5leHRQb3MgPSAobG9JZCkgPT4ge1xyXG4gICAgaWYgKExPQ0tFRF9NT0RVTEVTLmhhcyhsb0lkKSkge1xyXG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShMT0NLRURfTU9EVUxFUykuaW5kZXhPZihsb0lkKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocG9zTWFwW2xvSWRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcG9zTWFwW2xvSWRdID0gbmV4dEF2YWlsYWJsZTtcclxuICAgICAgcmV0dXJuIG5leHRBdmFpbGFibGUrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBwb3NNYXBbbG9JZF07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAga25vd25FeHQubWFwKGtleSA9PiAoe1xyXG4gICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXHJcbiAgICBuYW1lOiBDQUNIRVtrZXldLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXHJcbiAgICBvZmZpY2lhbDogT0ZGSUNJQUxfTU9EVUxFUy5oYXMoa2V5KSxcclxuICB9KSlcclxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWF4LWxpbmUtbGVuZ3RoXHJcbiAgICAuc29ydCgoYSwgYikgPT4gKGxvYWRPcmRlclthLmlkXT8ucG9zIHx8IGdldE5leHRQb3MoYS5pZCkpIC0gKGxvYWRPcmRlcltiLmlkXT8ucG9zIHx8IGdldE5leHRQb3MoYi5pZCkpKVxyXG4gICAgLmZvckVhY2goa25vd24gPT4ge1xyXG4gICAgICAvLyBJZiB0aGlzIGEga25vd24gZXh0ZXJuYWwgbW9kdWxlIGFuZCBpcyBOT1QgaW4gdGhlIGl0ZW0gbGlzdCBhbHJlYWR5XHJcbiAgICAgIC8vICB3ZSBuZWVkIHRvIHJlLWluc2VydCBpbiB0aGUgY29ycmVjdCBpbmRleCBhcyBhbGwga25vd24gZXh0ZXJuYWwgbW9kdWxlc1xyXG4gICAgICAvLyAgYXQgdGhpcyBwb2ludCBhcmUgYWN0dWFsbHkgZGVwbG95ZWQgaW5zaWRlIHRoZSBtb2RzIGZvbGRlciBhbmQgc2hvdWxkXHJcbiAgICAgIC8vICBiZSBpbiB0aGUgaXRlbXMgbGlzdCFcclxuICAgICAgY29uc3QgZGlmZiA9IChMT2tleXMubGVuZ3RoKSAtIChMT2tleXMubGVuZ3RoIC0gQXJyYXkuZnJvbShMT0NLRURfTU9EVUxFUykubGVuZ3RoKTtcclxuICAgICAgaWYgKGl0ZW1zLmZpbmQoaXRlbSA9PiBpdGVtLmlkID09PSBrbm93bi5pZCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnN0IHBvcyA9IGxvYWRPcmRlcltrbm93bi5pZF0/LnBvcztcclxuICAgICAgICBjb25zdCBpZHggPSAocG9zICE9PSB1bmRlZmluZWQpID8gKHBvcyAtIGRpZmYpIDogKGdldE5leHRQb3Moa25vd24uaWQpIC0gZGlmZik7XHJcbiAgICAgICAgaXRlbXMuc3BsaWNlKGlkeCwgMCwga25vd24pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgdW5rbm93bkl0ZW1zID0gW10uY29uY2F0KHVua25vd25FeHQpXHJcbiAgICAubWFwKGtleSA9PiAoe1xyXG4gICAgICBpZDogQ0FDSEVba2V5XS52b3J0ZXhJZCxcclxuICAgICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxyXG4gICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICBleHRlcm5hbDogaXNFeHRlcm5hbChjb250ZXh0LCBDQUNIRVtrZXldLnZvcnRleElkKSxcclxuICAgICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXHJcbiAgICB9KSk7XHJcblxyXG4gIGNvbnN0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChsb2NrZWRJdGVtcywgaXRlbXMsIHVua25vd25JdGVtcyk7XHJcbiAgcmV0dXJuIChkaXJlY3Rpb24gPT09ICdkZXNjZW5kaW5nJylcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHByZVNvcnRlZC5yZXZlcnNlKCkpXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSB7XHJcbiAgY29uc3QgdCA9IGNvbnRleHQuYXBpLnRyYW5zbGF0ZTtcclxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2xvYWRvcmRlcmluZm8nIH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LCB0KCdNYW5hZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnWW91IGNhbiBhZGp1c3QgdGhlIGxvYWQgb3JkZXIgZm9yIEJhbm5lcmxvcmQgYnkgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIG1vZHMgdXAgb3IgZG93biBvbiB0aGlzIHBhZ2UuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIGtlZXAgaW4gbWluZCB0aGF0IEJhbm5lcmxvcmQgaXMgc3RpbGwgaW4gRWFybHkgQWNjZXNzLCB3aGljaCBtZWFucyB0aGF0IHRoZXJlIG1pZ2h0IGJlIHNpZ25pZmljYW50ICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnY2hhbmdlcyB0byB0aGUgZ2FtZSBhcyB0aW1lIGdvZXMgb24uIFBsZWFzZSBub3RpZnkgdXMgb2YgYW55IFZvcnRleCByZWxhdGVkIGlzc3VlcyB5b3UgZW5jb3VudGVyIHdpdGggdGhpcyAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2V4dGVuc2lvbiBzbyB3ZSBjYW4gZml4IGl0LiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhbmQgaGVscCBzZWU6ICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYScsIHsgb25DbGljazogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Nb2RkaW5nX0Jhbm5lcmxvcmRfd2l0aF9Wb3J0ZXgnKSB9LCB0KCdNb2RkaW5nIEJhbm5lcmxvcmQgd2l0aCBWb3J0ZXguJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnSG93IHRvIHVzZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQ2hlY2sgdGhlIGJveCBuZXh0IHRvIHRoZSBtb2RzIHlvdSB3YW50IHRvIGJlIGFjdGl2ZSBpbiB0aGUgZ2FtZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnQ2xpY2sgQXV0byBTb3J0IGluIHRoZSB0b29sYmFyLiAoU2VlIGJlbG93IGZvciBkZXRhaWxzKS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnTWFrZSBzdXJlIHRvIHJ1biB0aGUgZ2FtZSBkaXJlY3RseSB2aWEgdGhlIFBsYXkgYnV0dG9uIGluIHRoZSB0b3AgbGVmdCBjb3JuZXIgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJyhvbiB0aGUgQmFubmVybG9yZCB0aWxlKS4gWW91ciBWb3J0ZXggbG9hZCBvcmRlciBtYXkgbm90IGJlIGxvYWRlZCBpZiB5b3UgcnVuIHRoZSBTaW5nbGUgUGxheWVyIGdhbWUgdGhyb3VnaCB0aGUgZ2FtZSBsYXVuY2hlci4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnT3B0aW9uYWw6IE1hbnVhbGx5IGRyYWcgYW5kIGRyb3AgbW9kcyB0byBkaWZmZXJlbnQgcG9zaXRpb25zIGluIHRoZSBsb2FkIG9yZGVyIChmb3IgdGVzdGluZyBkaWZmZXJlbnQgb3ZlcnJpZGVzKS4gTW9kcyBmdXJ0aGVyIGRvd24gdGhlIGxpc3Qgb3ZlcnJpZGUgbW9kcyBmdXJ0aGVyIHVwLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnUGxlYXNlIG5vdGU6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1RoZSBsb2FkIG9yZGVyIHJlZmxlY3RlZCBoZXJlIHdpbGwgb25seSBiZSBsb2FkZWQgaWYgeW91IHJ1biB0aGUgZ2FtZSB2aWEgdGhlIHBsYXkgYnV0dG9uIGluICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICd0aGUgdG9wIGxlZnQgY29ybmVyLiBEbyBub3QgcnVuIHRoZSBTaW5nbGUgUGxheWVyIGdhbWUgdGhyb3VnaCB0aGUgbGF1bmNoZXIsIGFzIHRoYXQgd2lsbCBpZ25vcmUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3RoZSBWb3J0ZXggbG9hZCBvcmRlciBhbmQgZ28gYnkgd2hhdCBpcyBzaG93biBpbiB0aGUgbGF1bmNoZXIgaW5zdGVhZC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnRm9yIEJhbm5lcmxvcmQsIG1vZHMgc29ydGVkIGZ1cnRoZXIgdG93YXJkcyB0aGUgYm90dG9tIG9mIHRoZSBsaXN0IHdpbGwgb3ZlcnJpZGUgbW9kcyBmdXJ0aGVyIHVwIChpZiB0aGV5IGNvbmZsaWN0KS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ05vdGU6IEhhcm1vbnkgcGF0Y2hlcyBtYXkgYmUgdGhlIGV4Y2VwdGlvbiB0byB0aGlzIHJ1bGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0F1dG8gU29ydCB1c2VzIHRoZSBTdWJNb2R1bGUueG1sIGZpbGVzICh0aGUgZW50cmllcyB1bmRlciA8RGVwZW5kZWRNb2R1bGVzPikgdG8gZGV0ZWN0ICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdkZXBlbmRlbmNpZXMgdG8gc29ydCBieS4gJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0lmIHlvdSBjYW5ub3Qgc2VlIHlvdXIgbW9kIGluIHRoaXMgbG9hZCBvcmRlciwgVm9ydGV4IG1heSBoYXZlIGJlZW4gdW5hYmxlIHRvIGZpbmQgb3IgcGFyc2UgaXRzIFN1Yk1vZHVsZS54bWwgZmlsZS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ01vc3QgLSBidXQgbm90IGFsbCBtb2RzIC0gY29tZSB3aXRoIG9yIG5lZWQgYSBTdWJNb2R1bGUueG1sIGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0hpdCB0aGUgZGVwbG95IGJ1dHRvbiB3aGVuZXZlciB5b3UgaW5zdGFsbCBhbmQgZW5hYmxlIGEgbmV3IG1vZC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnVGhlIGdhbWUgd2lsbCBub3QgbGF1bmNoIHVubGVzcyB0aGUgZ2FtZSBzdG9yZSAoU3RlYW0sIEVwaWMsIGV0YykgaXMgc3RhcnRlZCBiZWZvcmVoYW5kLiBJZiB5b3VcXCdyZSBnZXR0aW5nIHRoZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnXCJVbmFibGUgdG8gSW5pdGlhbGl6ZSBTdGVhbSBBUElcIiBlcnJvciwgcmVzdGFydCBTdGVhbS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnUmlnaHQgY2xpY2tpbmcgYW4gZW50cnkgd2lsbCBvcGVuIHRoZSBjb250ZXh0IG1lbnUgd2hpY2ggY2FuIGJlIHVzZWQgdG8gbG9jayBMTyBlbnRyaWVzIGludG8gcG9zaXRpb247IGVudHJ5IHdpbGwgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2JlIGlnbm9yZWQgYnkgYXV0by1zb3J0IG1haW50YWluaW5nIGl0cyBsb2NrZWQgcG9zaXRpb24uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlR2FtZVZlcnNpb24oZGlzY292ZXJ5UGF0aDogc3RyaW5nKSB7XHJcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAnZGV2ZWxvcG1lbnQnICYmIHNlbXZlci5zYXRpc2ZpZXModXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb24sICc8MS40LjAnKSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnbm90IHN1cHBvcnRlZCBpbiBvbGRlciBWb3J0ZXggdmVyc2lvbnMnKSk7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2V0WE1MRGF0YShwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgJ2JpbicsICdXaW42NF9TaGlwcGluZ19DbGllbnQnLCAnVmVyc2lvbi54bWwnKSk7XHJcbiAgICBjb25zdCBleGVQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsIEJBTk5FUkxPUkRfRVhFQyk7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGRhdGEuZ2V0PEVsZW1lbnQ+KCcvL1NpbmdsZXBsYXllcicpXHJcbiAgICAgIC5hdHRyKCdWYWx1ZScpXHJcbiAgICAgIC52YWx1ZSgpXHJcbiAgICAgIC5zbGljZSgxKVxyXG4gICAgICAuc3BsaXQoJy4nKVxyXG4gICAgICAuc2xpY2UoMCwgMylcclxuICAgICAgLmpvaW4oJy4nKTtcclxuICAgIHJldHVybiAoc2VtdmVyLnZhbGlkKHZhbHVlKSkgPyBQcm9taXNlLnJlc29sdmUodmFsdWUpIDogZ2V0VmVyc2lvbihleGVQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxubGV0IF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnN0IG1ldGFNYW5hZ2VyID0gbmV3IENvbU1ldGFkYXRhTWFuYWdlcihjb250ZXh0LmFwaSk7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnTW91bnQgJiBCbGFkZSBJSTpcXHRCYW5uZXJsb3JkJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICcuJyxcclxuICAgIGdldEdhbWVWZXJzaW9uOiByZXNvbHZlR2FtZVZlcnNpb24sXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSwgbWV0YU1hbmFnZXIpLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICBCQU5ORVJMT1JEX0VYRUMsXHJcbiAgICBdLFxyXG4gICAgcGFyYW1ldGVyczogW10sXHJcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTUFQUF9JRC50b1N0cmluZygpLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogU1RFQU1BUFBfSUQsXHJcbiAgICAgIGVwaWNBcHBJZDogRVBJQ0FQUF9JRCxcclxuICAgICAgY3VzdG9tT3Blbk1vZHNQYXRoOiBNT0RVTEVTLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ21vdW50YW5kYmxhZGUyX2NvbGxlY3Rpb25fZGF0YScsXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10pID0+XHJcbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcyksXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdNb3VudCBhbmQgQmxhZGUgMiBEYXRhJyksXHJcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcsXHJcbiAgKTtcclxuXHJcbiAgLy8gUmVnaXN0ZXIgdGhlIExPIHBhZ2UuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlclBhZ2Uoe1xyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgY3JlYXRlSW5mb1BhbmVsOiAocHJvcHMpID0+IHtcclxuICAgICAgcmVmcmVzaEZ1bmMgPSBwcm9wcy5yZWZyZXNoO1xyXG4gICAgICByZXR1cm4gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcyk7XHJcbiAgICB9LFxyXG4gICAgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbjogdHJ1ZSxcclxuICAgIGdhbWVBcnRVUkw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgcHJlU29ydDogKGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUpID0+XHJcbiAgICAgIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgbWV0YU1hbmFnZXIpLFxyXG4gICAgY2FsbGJhY2s6IChsb2FkT3JkZXIpID0+IHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQsIGxvYWRPcmRlciksXHJcbiAgICBpdGVtUmVuZGVyZXI6IEN1c3RvbUl0ZW1SZW5kZXJlci5kZWZhdWx0LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiYW5uZXJsb3Jkcm9vdG1vZCcsIDIwLCB0ZXN0Um9vdE1vZCwgaW5zdGFsbFJvb3RNb2QpO1xyXG5cclxuICAvLyBJbnN0YWxscyBvbmUgb3IgbW9yZSBzdWJtb2R1bGVzLlxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2Jhbm5lcmxvcmRzdWJtb2R1bGVzJywgMjUsIHRlc3RGb3JTdWJtb2R1bGVzLCBpbnN0YWxsU3ViTW9kdWxlcyk7XHJcblxyXG4gIC8vIEEgdmVyeSBzaW1wbGUgbWlncmF0aW9uIHRoYXQgaW50ZW5kcyB0byBhZGQgdGhlIHN1Yk1vZElkcyBhdHRyaWJ1dGVcclxuICAvLyAgdG8gbW9kcyB0aGF0IGFjdCBhcyBcIm1vZCBwYWNrc1wiLiBUaGlzIG1pZ3JhdGlvbiBpcyBub24taW52YXNpdmUgYW5kIHdpbGxcclxuICAvLyAgbm90IHJlcG9ydCBhbnkgZXJyb3JzLiBTaWRlIGVmZmVjdHMgb2YgdGhlIG1pZ3JhdGlvbiBub3Qgd29ya2luZyBjb3JyZWN0bHlcclxuICAvLyAgd2lsbCBub3QgYWZmZWN0IHRoZSB1c2VyJ3MgZXhpc3RpbmcgZW52aXJvbm1lbnQuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTAyNihjb250ZXh0LmFwaSwgb2xkKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2dlbmVyaWMtbG9hZC1vcmRlci1pY29ucycsIDIwMCxcclxuICAgIF9JU19TT1JUSU5HID8gJ3NwaW5uZXInIDogJ2xvb3Qtc29ydCcsIHt9LCAnQXV0byBTb3J0JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBpZiAoX0lTX1NPUlRJTkcpIHtcclxuICAgICAgICAvLyBBbHJlYWR5IHNvcnRpbmcgLSBkb24ndCBkbyBhbnl0aGluZy5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIF9JU19TT1JUSU5HID0gdHJ1ZTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgbWV0YU1hbmFnZXIudXBkYXRlRGVwZW5kZW5jeU1hcCgpO1xyXG4gICAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0KTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzb2x2ZSBzdWJtb2R1bGUgZmlsZSBkYXRhJywgZXJyKTtcclxuICAgICAgICBfSVNfU09SVElORyA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gICAgICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICAgIGNvbnN0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuICAgICAgY29uc3Qgc3ViTW9kSWRzID0gbW9kSWRzLmZpbHRlcihpZCA9PiAhQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuXHJcbiAgICAgIGxldCBzb3J0ZWRMb2NrZWQgPSBbXTtcclxuICAgICAgbGV0IHNvcnRlZFN1Yk1vZHMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAvLyBQcm9iYWJseSBiZXN0IHRoYXQgd2UgZG9uJ3QgcmVwb3J0IHRoaXMgdmlhIG5vdGlmaWNhdGlvbiBhcyBhIG51bWJlclxyXG4gICAgICAgIC8vICBvZiB0aGluZ3MgbWF5IGhhdmUgb2NjdXJyZWQgdGhhdCBjYXVzZWQgdGhpcyBpc3N1ZS4gV2UgbG9nIGl0IGluc3RlYWQuXHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gc29ydCBtb2RzJywgeyByZWFzb246ICdObyBhY3RpdmUgcHJvZmlsZScgfSk7XHJcbiAgICAgICAgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHNvcnRlZExvY2tlZCA9IHRTb3J0KHsgc3ViTW9kSWRzOiBsb2NrZWRJZHMsIGFsbG93TG9ja2VkOiB0cnVlLCBtZXRhTWFuYWdlciB9KTtcclxuICAgICAgICBzb3J0ZWRTdWJNb2RzID0gdFNvcnQoeyBzdWJNb2RJZHMsIGFsbG93TG9ja2VkOiBmYWxzZSwgbG9hZE9yZGVyLCBtZXRhTWFuYWdlciB9LCB0cnVlKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc29ydCBtb2RzJywgZXJyKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG5ld09yZGVyID0gW10uY29uY2F0KHNvcnRlZExvY2tlZCwgc29ydGVkU3ViTW9kcykucmVkdWNlKChhY2N1bSwgaWQsIGlkeCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZvcnRleElkID0gQ0FDSEVbaWRdLnZvcnRleElkO1xyXG4gICAgICAgIGNvbnN0IG5ld0VudHJ5ID0ge1xyXG4gICAgICAgICAgcG9zOiBpZHgsXHJcbiAgICAgICAgICBlbmFibGVkOiBDQUNIRVtpZF0uaXNPZmZpY2lhbFxyXG4gICAgICAgICAgICA/IHRydWVcclxuICAgICAgICAgICAgOiAoISFsb2FkT3JkZXJbdm9ydGV4SWRdKVxyXG4gICAgICAgICAgICAgID8gbG9hZE9yZGVyW3ZvcnRleElkXS5lbmFibGVkXHJcbiAgICAgICAgICAgICAgOiB0cnVlLFxyXG4gICAgICAgICAgbG9ja2VkOiAobG9hZE9yZGVyW3ZvcnRleElkXT8ubG9ja2VkID09PSB0cnVlKSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhY2N1bVt2b3J0ZXhJZF0gPSBuZXdFbnRyeTtcclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIHt9KTtcclxuXHJcbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKGFjdGl2ZVByb2ZpbGUuaWQsIG5ld09yZGVyKSk7XHJcbiAgICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBuZXdPcmRlcilcclxuICAgICAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICAgIGlkOiAnbW5iMi1zb3J0LWZpbmlzaGVkJyxcclxuICAgICAgICAgIHR5cGU6ICdpbmZvJyxcclxuICAgICAgICAgIG1lc3NhZ2U6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSgnRmluaXNoZWQgc29ydGluZycsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgICAgIH0pKS5maW5hbGx5KCgpID0+IF9JU19TT1JUSU5HID0gZmFsc2UpO1xyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIChnYW1lSWQgPT09IEdBTUVfSUQpO1xyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+XHJcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZmlsZUlkLCBtZXRhTWFuYWdlcikpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQpID0+XHJcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZmlsZUlkLCBtZXRhTWFuYWdlcikpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZiA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0LCBwcm9mPy5pZCwgbWV0YU1hbmFnZXIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnYWRkZWQtZmlsZXMnLCBhc3luYyAocHJvZmlsZUlkLCBmaWxlcykgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG5cclxuICAgICAgYXdhaXQgQmx1ZWJpcmQubWFwKGZpbGVzLCBhc3luYyAoZW50cnk6IHsgZmlsZVBhdGg6IHN0cmluZywgY2FuZGlkYXRlczogc3RyaW5nW10gfSkgPT4ge1xyXG4gICAgICAgIC8vIG9ubHkgYWN0IGlmIHdlIGRlZmluaXRpdmVseSBrbm93IHdoaWNoIG1vZCBvd25zIHRoZSBmaWxlXHJcbiAgICAgICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxyXG4gICAgICAgICAgICBbR0FNRV9JRCwgZW50cnkuY2FuZGlkYXRlc1swXV0sIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kUGF0aHNbbW9kLnR5cGUgPz8gJyddLCBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xyXG4gICAgICAgICAgLy8gY29weSB0aGUgbmV3IGZpbGUgYmFjayBpbnRvIHRoZSBjb3JyZXNwb25kaW5nIG1vZCwgdGhlbiBkZWxldGUgaXQuXHJcbiAgICAgICAgICAvLyAgVGhhdCB3YXksIHZvcnRleCB3aWxsIGNyZWF0ZSBhIGxpbmsgdG8gaXQgd2l0aCB0aGUgY29ycmVjdFxyXG4gICAgICAgICAgLy8gIGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcclxuICAgICAgICAgIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSk7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSB0YXJnZXQgZGVzdGluYXRpb24gZmlsZSBpZiBpdCBleGlzdHMuXHJcbiAgICAgICAgICAvLyAgdGhpcyBpcyB0byBjb21wbGV0ZWx5IGF2b2lkIGEgc2NlbmFyaW8gd2hlcmUgd2UgbWF5IGF0dGVtcHQgdG9cclxuICAgICAgICAgIC8vICBjb3B5IHRoZSBzYW1lIGZpbGUgb250byBpdHNlbGYuXHJcbiAgICAgICAgICByZXR1cm4gZnMucmVtb3ZlQXN5bmModGFyZ2V0UGF0aClcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKSlcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBpbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW4sXHJcbn07XHJcbiJdfQ==