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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBK0M7QUFFL0MsNkNBQStCO0FBQy9CLG9EQUFzQztBQUd0Qyw4REFBcUM7QUFFckMsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBa0Y7QUFDbEYsaUNBQW1GO0FBRW5GLHFDQUE0RztBQUM1Ryw4RUFBc0Q7QUFDdEQsNkNBQTBDO0FBRTFDLDhFQUFzRDtBQUN0RCwrQ0FBc0c7QUFFdEcsMkRBQXFGO0FBQ3JGLHNGQUE4RDtBQUc5RCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSx1QkFBdUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0FBQ3pHLE1BQU0sZ0JBQWdCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztBQUU3RyxJQUFJLFFBQVEsQ0FBQztBQUViLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQztBQUMzQixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUM7QUFFL0IsTUFBTSxjQUFjLEdBQUcsdUJBQXVCLENBQUM7QUFNL0MsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUztJQUNwRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO0FBRS9DLFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNYLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FB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LENBQUMsRUFBRSxDQUFDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsb0NBQW9DLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQ2xGO1lBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcm9taXNlIGFzIEJsdWViaXJkIH0gZnJvbSAnYmx1ZWJpcmQnO1xyXG5cclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgRWxlbWVudCB9IGZyb20gJ2xpYnhtbGpzJztcclxuaW1wb3J0IGdldFZlcnNpb24gZnJvbSAnZXhlLXZlcnNpb24nO1xyXG5cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgRmxleExheW91dCwgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBnZXRFbGVtZW50VmFsdWUsIGdldFhNTERhdGEsIHJlZnJlc2hHYW1lUGFyYW1zLCB3YWxrQXN5bmMgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgQkFOTkVSTE9SRF9FWEVDLCBHQU1FX0lELCBMT0NLRURfTU9EVUxFUywgTU9EVUxFUywgT0ZGSUNJQUxfTU9EVUxFUywgU1VCTU9EX0ZJTEUgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBDdXN0b21JdGVtUmVuZGVyZXIgZnJvbSAnLi9jdXN0b21JdGVtUmVuZGVyZXInO1xyXG5pbXBvcnQgeyBtaWdyYXRlMDI2IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCBDb21NZXRhZGF0YU1hbmFnZXIgZnJvbSAnLi9Db21NZXRhZGF0YU1hbmFnZXInO1xyXG5pbXBvcnQgeyBnZXRDYWNoZSwgZ2V0TGF1bmNoZXJEYXRhLCBpc0ludmFsaWQsIHBhcnNlTGF1bmNoZXJEYXRhLCByZWZyZXNoQ2FjaGUgfSBmcm9tICcuL3N1Yk1vZENhY2hlJztcclxuaW1wb3J0IHsgSVNvcnRQcm9wcywgSVN1Yk1vZENhY2hlIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuaW1wb3J0IHsgSUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5cclxuY29uc3QgTEFVTkNIRVJfRVhFQyA9IHBhdGguam9pbignYmluJywgJ1dpbjY0X1NoaXBwaW5nX0NsaWVudCcsICdUYWxlV29ybGRzLk1vdW50QW5kQmxhZGUuTGF1bmNoZXIuZXhlJyk7XHJcbmNvbnN0IE1PRERJTkdfS0lUX0VYRUMgPSBwYXRoLmpvaW4oJ2JpbicsICdXaW42NF9TaGlwcGluZ193RWRpdG9yJywgJ1RhbGVXb3JsZHMuTW91bnRBbmRCbGFkZS5MYXVuY2hlci5leGUnKTtcclxuXHJcbmxldCBTVE9SRV9JRDtcclxuXHJcbmNvbnN0IFNURUFNQVBQX0lEID0gMjYxNTUwO1xyXG5jb25zdCBFUElDQVBQX0lEID0gJ0NoaWNrYWRlZSc7XHJcblxyXG5jb25zdCBJMThOX05BTUVTUEFDRSA9ICdnYW1lLW1vdW50LWFuZC1ibGFkZTInO1xyXG5cclxuLy8gQSBzZXQgb2YgZm9sZGVyIG5hbWVzIChsb3dlcmNhc2VkKSB3aGljaCBhcmUgYXZhaWxhYmxlIGFsb25nc2lkZSB0aGVcclxuLy8gIGdhbWUncyBtb2R1bGVzIGZvbGRlci4gV2UgY291bGQndmUgdXNlZCB0aGUgZm9tb2QgaW5zdGFsbGVyIHN0b3AgcGF0dGVybnNcclxuLy8gIGZ1bmN0aW9uYWxpdHkgZm9yIHRoaXMsIGJ1dCBpdCdzIGJldHRlciBpZiB0aGlzIGV4dGVuc2lvbiBpcyBzZWxmIGNvbnRhaW5lZDtcclxuLy8gIGVzcGVjaWFsbHkgZ2l2ZW4gdGhhdCB0aGUgZ2FtZSdzIG1vZGRpbmcgcGF0dGVybiBjaGFuZ2VzIHF1aXRlIG9mdGVuLlxyXG5jb25zdCBST09UX0ZPTERFUlMgPSBuZXcgU2V0KFsnYmluJywgJ2RhdGEnLCAnZ3VpJywgJ2ljb25zJywgJ21vZHVsZXMnLFxyXG4gICdtdXNpYycsICdzaGFkZXJzJywgJ3NvdW5kcycsICd4bWxzY2hlbWFzJ10pO1xyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtFUElDQVBQX0lELCBTVEVBTUFQUF9JRC50b1N0cmluZygpXSlcclxuICAgIC50aGVuKGdhbWUgPT4ge1xyXG4gICAgICBTVE9SRV9JRCA9IGdhbWUuZ2FtZVN0b3JlSWQ7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZ2FtZS5nYW1lUGF0aCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJvb3RNb2QoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBEaWZmZXJlbnQgZ2FtZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IG1vZHNGaWxlID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpICE9PSAtMSk7XHJcbiAgaWYgKG1vZHNGaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFRoZXJlJ3Mgbm8gTW9kdWxlcyBmb2xkZXIuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpZHggPSBtb2RzRmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGNvbnN0IHJvb3RGb2xkZXJNYXRjaGVzID0gbG93ZXJlZC5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgcmV0dXJuICgoKHNlZ21lbnRzLmxlbmd0aCAtIDEpID4gaWR4KSAmJiBST09UX0ZPTERFUlMuaGFzKHNlZ21lbnRzW2lkeF0pKTtcclxuICB9KSB8fCBbXTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogKHJvb3RGb2xkZXJNYXRjaGVzLmxlbmd0aCA+IDApLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xyXG4gIGNvbnN0IG1vZHVsZUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZihNT0RVTEVTKSAhPT0gLTEpO1xyXG4gIGNvbnN0IGlkeCA9IG1vZHVsZUZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoTU9EVUxFUyk7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgY29uc3QgbGFzdEVsZW1lbnRJZHggPSBzZWdtZW50cy5sZW5ndGggLSAxO1xyXG5cclxuICAgIC8vIElnbm9yZSBkaXJlY3RvcmllcyBhbmQgZW5zdXJlIHRoYXQgdGhlIGZpbGUgY29udGFpbnMgYSBrbm93biByb290IGZvbGRlciBhdFxyXG4gICAgLy8gIHRoZSBleHBlY3RlZCBpbmRleC5cclxuICAgIHJldHVybiAoUk9PVF9GT0xERVJTLmhhcyhzZWdtZW50c1tpZHhdKVxyXG4gICAgICAmJiAocGF0aC5leHRuYW1lKHNlZ21lbnRzW2xhc3RFbGVtZW50SWR4XSkgIT09ICcnKSk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLm1hcChmaWxlID0+IHtcclxuICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gZmlsZS5zcGxpdChwYXRoLnNlcClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zbGljZShpZHgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuam9pbihwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb24sXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0Rm9yU3VibW9kdWxlcyhmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gQ2hlY2sgdGhpcyBpcyBhIG1vZCBmb3IgQmFubmVybG9yZCBhbmQgaXQgY29udGFpbnMgYSBTdWJNb2R1bGUueG1sXHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSkgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTdWJNb2R1bGVzKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpIHtcclxuICAvLyBSZW1vdmUgZGlyZWN0b3JpZXMgc3RyYWlnaHQgYXdheS5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICByZXR1cm4gcGF0aC5leHRuYW1lKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdKSAhPT0gJyc7XHJcbiAgfSk7XHJcbiAgY29uc3Qgc3ViTW9kSWRzID0gW107XHJcbiAgY29uc3Qgc3ViTW9kcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2Uoc3ViTW9kcywgYXN5bmMgKGFjY3VtLCBtb2RGaWxlOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gbW9kRmlsZS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICBjb25zdCBzdWJNb2RJZCA9IGF3YWl0IGdldEVsZW1lbnRWYWx1ZShwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtb2RGaWxlKSwgJ0lkJyk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gKHNlZ21lbnRzLmxlbmd0aCA+IDEpXHJcbiAgICAgID8gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMl1cclxuICAgICAgOiBzdWJNb2RJZDtcclxuXHJcbiAgICBzdWJNb2RJZHMucHVzaChzdWJNb2RJZCk7XHJcbiAgICBjb25zdCBpZHggPSBtb2RGaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihTVUJNT0RfRklMRSk7XHJcbiAgICAvLyBGaWx0ZXIgdGhlIG1vZCBmaWxlcyBmb3IgdGhpcyBzcGVjaWZpYyBzdWJtb2R1bGUuXHJcbiAgICBjb25zdCBzdWJNb2RGaWxlczogc3RyaW5nW11cclxuICAgICAgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBmaWxlLnNsaWNlKDAsIGlkeCkgPT09IG1vZEZpbGUuc2xpY2UoMCwgaWR4KSk7XHJcbiAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBzdWJNb2RGaWxlcy5tYXAoKG1vZEZpbGU6IHN0cmluZykgPT4gKHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IG1vZEZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oTU9EVUxFUywgbW9kTmFtZSwgbW9kRmlsZS5zbGljZShpZHgpKSxcclxuICAgIH0pKTtcclxuICAgIHJldHVybiBhY2N1bS5jb25jYXQoaW5zdHJ1Y3Rpb25zKTtcclxuICB9LCBbXSlcclxuICAudGhlbihtZXJnZWQgPT4ge1xyXG4gICAgY29uc3Qgc3ViTW9kSWRzQXR0ciA9IHtcclxuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgIGtleTogJ3N1Yk1vZElkcycsXHJcbiAgICAgIHZhbHVlOiBzdWJNb2RJZHMsXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9uczogW10uY29uY2F0KG1lcmdlZCwgW3N1Yk1vZElkc0F0dHJdKSB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZW5zdXJlT2ZmaWNpYWxMYXVuY2hlcihjb250ZXh0LCBkaXNjb3ZlcnkpIHtcclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLmFkZERpc2NvdmVyZWRUb29sKEdBTUVfSUQsICdUYWxlV29ybGRzQmFubmVybG9yZExhdW5jaGVyJywge1xyXG4gICAgaWQ6ICdUYWxlV29ybGRzQmFubmVybG9yZExhdW5jaGVyJyxcclxuICAgIG5hbWU6ICdPZmZpY2lhbCBMYXVuY2hlcicsXHJcbiAgICBsb2dvOiAndHdsYXVuY2hlci5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gcGF0aC5iYXNlbmFtZShMQVVOQ0hFUl9FWEVDKSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgcGF0aC5iYXNlbmFtZShMQVVOQ0hFUl9FWEVDKSxcclxuICAgIF0sXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIExBVU5DSEVSX0VYRUMpLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICB3b3JraW5nRGlyZWN0b3J5OiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JyksXHJcbiAgICBoaWRkZW46IGZhbHNlLFxyXG4gICAgY3VzdG9tOiBmYWxzZSxcclxuICB9LCBmYWxzZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRNb2RkaW5nVG9vbChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWRkZW4/OiBib29sZWFuKSB7XHJcbiAgY29uc3QgdG9vbElkID0gJ2Jhbm5lcmxvcmQtc2RrJztcclxuICBjb25zdCBleGVjID0gcGF0aC5iYXNlbmFtZShNT0RESU5HX0tJVF9FWEVDKTtcclxuICBjb25zdCB0b29sID0ge1xyXG4gICAgaWQ6IHRvb2xJZCxcclxuICAgIG5hbWU6ICdNb2RkaW5nIEtpdCcsXHJcbiAgICBsb2dvOiAndHdsYXVuY2hlci5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gZXhlYyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFsgZXhlYyBdLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RESU5HX0tJVF9FWEVDKSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhjbHVzaXZlOiB0cnVlLFxyXG4gICAgd29ya2luZ0RpcmVjdG9yeTogcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBwYXRoLmRpcm5hbWUoTU9ERElOR19LSVRfRVhFQykpLFxyXG4gICAgaGlkZGVuLFxyXG4gICAgY3VzdG9tOiBmYWxzZSxcclxuICB9O1xyXG5cclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLmFkZERpc2NvdmVyZWRUb29sKEdBTUVfSUQsIHRvb2xJZCwgdG9vbCwgZmFsc2UpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5LCBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XHJcbiAgLy8gUXVpY2tseSBlbnN1cmUgdGhhdCB0aGUgb2ZmaWNpYWwgTGF1bmNoZXIgaXMgYWRkZWQuXHJcbiAgZW5zdXJlT2ZmaWNpYWxMYXVuY2hlcihjb250ZXh0LCBkaXNjb3ZlcnkpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBNT0RESU5HX0tJVF9FWEVDKSk7XHJcbiAgICBzZXRNb2RkaW5nVG9vbChjb250ZXh0LCBkaXNjb3ZlcnkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgdG9vbHMgPSBkaXNjb3Zlcnk/LnRvb2xzO1xyXG4gICAgaWYgKCh0b29scyAhPT0gdW5kZWZpbmVkKVxyXG4gICAgJiYgKHV0aWwuZ2V0U2FmZSh0b29scywgWydiYW5uZXJsb3JkLXNkayddLCB1bmRlZmluZWQpICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgIHNldE1vZGRpbmdUb29sKGNvbnRleHQsIGRpc2NvdmVyeSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBJZiBnYW1lIHN0b3JlIG5vdCBmb3VuZCwgbG9jYXRpb24gbWF5IGJlIHNldCBtYW51YWxseSAtIGFsbG93IHNldHVwXHJcbiAgLy8gIGZ1bmN0aW9uIHRvIGNvbnRpbnVlLlxyXG4gIGNvbnN0IGZpbmRTdG9yZUlkID0gKCkgPT4gZmluZEdhbWUoKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGNvbnN0IHN0YXJ0U3RlYW0gPSAoKSA9PiBmaW5kU3RvcmVJZCgpXHJcbiAgICAudGhlbigoKSA9PiAoU1RPUkVfSUQgPT09ICdzdGVhbScpXHJcbiAgICAgID8gdXRpbC5HYW1lU3RvcmVIZWxwZXIubGF1bmNoR2FtZVN0b3JlKGNvbnRleHQuYXBpLCBTVE9SRV9JRCwgdW5kZWZpbmVkLCB0cnVlKVxyXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSgpKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgd2UndmUgYWxyZWFkeSBzZXQgdGhlIGxvYWQgb3JkZXIgb2JqZWN0IGZvciB0aGlzIHByb2ZpbGVcclxuICAvLyAgYW5kIGNyZWF0ZSBpdCBpZiB3ZSBoYXZlbid0LlxyXG4gIHJldHVybiBzdGFydFN0ZWFtKCkudGhlbigoKSA9PiBwYXJzZUxhdW5jaGVyRGF0YSgpKS50aGVuKGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZShjb250ZXh0KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSdyZSBnb2luZyB0byBkbyBhIHF1aWNrIHRTb3J0IGF0IHRoaXMgcG9pbnQgLSBub3QgZ29pbmcgdG9cclxuICAgIC8vICBjaGFuZ2UgdGhlIHVzZXIncyBsb2FkIG9yZGVyLCBidXQgdGhpcyB3aWxsIGhpZ2hsaWdodCBhbnlcclxuICAgIC8vICBjeWNsaWMgb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgICBjb25zdCBDQUNIRSA9IGdldENhY2hlKCk7XHJcbiAgICBjb25zdCBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICBjb25zdCBzb3J0ZWQgPSB0U29ydCh7IHN1Yk1vZElkczogbW9kSWRzLCBhbGxvd0xvY2tlZDogdHJ1ZSwgbWV0YU1hbmFnZXIgfSk7XHJcbiAgfSlcclxuICAuY2F0Y2goZXJyID0+IHtcclxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLk5vdEZvdW5kKSB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGZpbmQgZ2FtZSBsYXVuY2hlciBkYXRhJyxcclxuICAgICAgICAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIHRocm91Z2ggdGhlIG9mZmljaWFsIGdhbWUgbGF1bmNoZXIgYW5kICdcclxuICAgICAgKyAndHJ5IGFnYWluJywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZmluZCBnYW1lIGxhdW5jaGVyIGRhdGEnLFxyXG4gICAgICAgIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfSlcclxuICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBWYWxpZCB1c2UgY2FzZSB3aGVuIGF0dGVtcHRpbmcgdG8gc3dpdGNoIHRvXHJcbiAgICAgIC8vICBCYW5uZXJsb3JkIHdpdGhvdXQgYW55IGFjdGl2ZSBwcm9maWxlLlxyXG4gICAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwge30pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0U29ydChzb3J0UHJvcHM6IElTb3J0UHJvcHMsIHRlc3Q6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gIGNvbnN0IHsgc3ViTW9kSWRzLCBhbGxvd0xvY2tlZCwgbG9hZE9yZGVyLCBtZXRhTWFuYWdlciB9ID0gc29ydFByb3BzO1xyXG4gIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAvLyBUb3BvbG9naWNhbCBzb3J0IC0gd2UgbmVlZCB0bzpcclxuICAvLyAgLSBJZGVudGlmeSBjeWNsaWMgZGVwZW5kZW5jaWVzLlxyXG4gIC8vICAtIElkZW50aWZ5IG1pc3NpbmcgZGVwZW5kZW5jaWVzLlxyXG4gIC8vICAtIFdlIHdpbGwgdHJ5IHRvIGlkZW50aWZ5IGluY29tcGF0aWJsZSBkZXBlbmRlbmNpZXMgKHZlcnNpb24td2lzZSlcclxuXHJcbiAgLy8gVGhlc2UgYXJlIG1hbnVhbGx5IGxvY2tlZCBtb2QgZW50cmllcy5cclxuICBjb25zdCBsb2NrZWRTdWJNb2RzID0gKCEhbG9hZE9yZGVyKVxyXG4gICAgPyBzdWJNb2RJZHMuZmlsdGVyKHN1Yk1vZElkID0+IHtcclxuICAgICAgY29uc3QgZW50cnkgPSBDQUNIRVtzdWJNb2RJZF07XHJcbiAgICAgIHJldHVybiAoISFlbnRyeSlcclxuICAgICAgICA/ICEhbG9hZE9yZGVyW2VudHJ5LnZvcnRleElkXT8ubG9ja2VkXHJcbiAgICAgICAgOiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICA6IFtdO1xyXG4gIGNvbnN0IGFscGhhYmV0aWNhbCA9IHN1Yk1vZElkcy5maWx0ZXIoc3ViTW9kID0+ICFsb2NrZWRTdWJNb2RzLmluY2x1ZGVzKHN1Yk1vZCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKTtcclxuICBjb25zdCBncmFwaCA9IGFscGhhYmV0aWNhbC5yZWR1Y2UoKGFjY3VtLCBlbnRyeSkgPT4ge1xyXG4gICAgY29uc3QgZGVwSWRzID0gWy4uLkNBQ0hFW2VudHJ5XS5kZXBlbmRlbmNpZXNdLm1hcChkZXAgPT4gZGVwLmRlcElkKTtcclxuICAgIC8vIENyZWF0ZSB0aGUgbm9kZSBncmFwaC5cclxuICAgIGFjY3VtW2VudHJ5XSA9IGRlcElkcy5zb3J0KCk7XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG5cclxuICAvLyBXaWxsIHN0b3JlIHRoZSBmaW5hbCBMTyByZXN1bHRcclxuICBjb25zdCByZXN1bHQgPSBbXTtcclxuXHJcbiAgLy8gVGhlIG5vZGVzIHdlIGhhdmUgdmlzaXRlZC9wcm9jZXNzZWQuXHJcbiAgY29uc3QgdmlzaXRlZCA9IFtdO1xyXG5cclxuICAvLyBUaGUgbm9kZXMgd2hpY2ggYXJlIHN0aWxsIHByb2Nlc3NpbmcuXHJcbiAgY29uc3QgcHJvY2Vzc2luZyA9IFtdO1xyXG5cclxuICBjb25zdCB0b3BTb3J0ID0gKG5vZGUpID0+IHtcclxuICAgIHByb2Nlc3Npbmdbbm9kZV0gPSB0cnVlO1xyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gKCEhYWxsb3dMb2NrZWQpXHJcbiAgICAgID8gZ3JhcGhbbm9kZV1cclxuICAgICAgOiBncmFwaFtub2RlXS5maWx0ZXIoZWxlbWVudCA9PiAhTE9DS0VEX01PRFVMRVMuaGFzKGVsZW1lbnQpKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcclxuICAgICAgaWYgKHByb2Nlc3NpbmdbZGVwXSkge1xyXG4gICAgICAgIC8vIEN5Y2xpYyBkZXBlbmRlbmN5IGRldGVjdGVkIC0gaGlnaGxpZ2h0IGJvdGggbW9kcyBhcyBpbnZhbGlkXHJcbiAgICAgICAgLy8gIHdpdGhpbiB0aGUgY2FjaGUgaXRzZWxmIC0gd2UgYWxzbyBuZWVkIHRvIGhpZ2hsaWdodCB3aGljaCBtb2RzLlxyXG4gICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQuY3ljbGljLnB1c2goZGVwKTtcclxuICAgICAgICBDQUNIRVtkZXBdLmludmFsaWQuY3ljbGljLnB1c2gobm9kZSk7XHJcblxyXG4gICAgICAgIHZpc2l0ZWRbbm9kZV0gPSB0cnVlO1xyXG4gICAgICAgIHByb2Nlc3Npbmdbbm9kZV0gPSBmYWxzZTtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgaW5jb21wYXRpYmxlRGVwcyA9IENBQ0hFW25vZGVdLmludmFsaWQuaW5jb21wYXRpYmxlRGVwcztcclxuICAgICAgY29uc3QgaW5jRGVwID0gaW5jb21wYXRpYmxlRGVwcy5maW5kKGQgPT4gZC5kZXBJZCA9PT0gZGVwKTtcclxuICAgICAgaWYgKE9iamVjdC5rZXlzKGdyYXBoKS5pbmNsdWRlcyhkZXApICYmIChpbmNEZXAgPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICBjb25zdCBkZXBWZXIgPSBDQUNIRVtkZXBdLnN1Yk1vZFZlcjtcclxuICAgICAgICBjb25zdCBkZXBJbnN0ID0gQ0FDSEVbbm9kZV0uZGVwZW5kZW5jaWVzLmZpbmQoZCA9PiBkLmRlcElkID09PSBkZXApO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHNlbXZlci5zYXRpc2ZpZXMoZGVwSW5zdC5kZXBWZXJzaW9uLCBkZXBWZXIpO1xyXG4gICAgICAgICAgaWYgKCFtYXRjaCAmJiAhIWRlcEluc3Q/LmRlcFZlcnNpb24gJiYgISFkZXBWZXIpIHtcclxuICAgICAgICAgICAgQ0FDSEVbbm9kZV0uaW52YWxpZC5pbmNvbXBhdGlibGVEZXBzLnB1c2goe1xyXG4gICAgICAgICAgICAgIGRlcElkOiBkZXAsXHJcbiAgICAgICAgICAgICAgcmVxdWlyZWRWZXJzaW9uOiBkZXBJbnN0LmRlcFZlcnNpb24sXHJcbiAgICAgICAgICAgICAgY3VycmVudFZlcnNpb246IGRlcFZlcixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAvLyBPayBzbyB3ZSBkaWRuJ3QgbWFuYWdlIHRvIGNvbXBhcmUgdGhlIHZlcnNpb25zLCB3ZSBsb2cgdGhpcyBhbmRcclxuICAgICAgICAgIC8vICBjb250aW51ZS5cclxuICAgICAgICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIGNvbXBhcmUgdmVyc2lvbnMnLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCF2aXNpdGVkW2RlcF0gJiYgIWxvY2tlZFN1Yk1vZHMuaW5jbHVkZXMoZGVwKSkge1xyXG4gICAgICAgIGlmICghT2JqZWN0LmtleXMoZ3JhcGgpLmluY2x1ZGVzKGRlcCkpIHtcclxuICAgICAgICAgIENBQ0hFW25vZGVdLmludmFsaWQubWlzc2luZy5wdXNoKGRlcCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRvcFNvcnQoZGVwKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzaW5nW25vZGVdID0gZmFsc2U7XHJcbiAgICB2aXNpdGVkW25vZGVdID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoIWlzSW52YWxpZChub2RlKSkge1xyXG4gICAgICByZXN1bHQucHVzaChub2RlKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBmb3IgKGNvbnN0IG5vZGUgaW4gZ3JhcGgpIHtcclxuICAgIGlmICghdmlzaXRlZFtub2RlXSAmJiAhcHJvY2Vzc2luZ1tub2RlXSkge1xyXG4gICAgICB0b3BTb3J0KG5vZGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKGFsbG93TG9ja2VkKSB7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLy8gUHJvcGVyIHRvcG9sb2dpY2FsIHNvcnQgZGljdGF0ZXMgd2Ugc2ltcGx5IHJldHVybiB0aGVcclxuICAvLyAgcmVzdWx0IGF0IHRoaXMgcG9pbnQuIEJ1dCwgbW9kIGF1dGhvcnMgd2FudCBtb2R1bGVzXHJcbiAgLy8gIHdpdGggbm8gZGVwZW5kZW5jaWVzIHRvIGJ1YmJsZSB1cCB0byB0aGUgdG9wIG9mIHRoZSBMTy5cclxuICAvLyAgKFRoaXMgd2lsbCBvbmx5IGFwcGx5IHRvIG5vbiBsb2NrZWQgZW50cmllcylcclxuICBjb25zdCBzdWJNb2RzV2l0aE5vRGVwcyA9IHJlc3VsdC5maWx0ZXIoZGVwID0+IChncmFwaFtkZXBdLmxlbmd0aCA9PT0gMClcclxuICAgIHx8IChncmFwaFtkZXBdLmZpbmQoZCA9PiAhTE9DS0VEX01PRFVMRVMuaGFzKGQpKSA9PT0gdW5kZWZpbmVkKSkuc29ydCgpIHx8IFtdO1xyXG4gIGNvbnN0IHRhbXBlcmVkUmVzdWx0ID0gW10uY29uY2F0KHN1Yk1vZHNXaXRoTm9EZXBzLFxyXG4gICAgcmVzdWx0LmZpbHRlcihlbnRyeSA9PiAhc3ViTW9kc1dpdGhOb0RlcHMuaW5jbHVkZXMoZW50cnkpKSk7XHJcbiAgbG9ja2VkU3ViTW9kcy5mb3JFYWNoKHN1Yk1vZElkID0+IHtcclxuICAgIGNvbnN0IHBvcyA9IGxvYWRPcmRlcltDQUNIRVtzdWJNb2RJZF0udm9ydGV4SWRdLnBvcztcclxuICAgIHRhbXBlcmVkUmVzdWx0LnNwbGljZShwb3MsIDAsIFtzdWJNb2RJZF0pO1xyXG4gIH0pO1xyXG5cclxuICBpZiAodGVzdCA9PT0gdHJ1ZSkge1xyXG4gICAgY29uc3QgbWV0YVNvcnRlZCA9IG1ldGFNYW5hZ2VyLnNvcnQodGFtcGVyZWRSZXN1bHQpO1xyXG4gICAgcmV0dXJuIG1ldGFTb3J0ZWQ7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiB0YW1wZXJlZFJlc3VsdDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRXh0ZXJuYWwoY29udGV4dCwgc3ViTW9kSWQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gIG1vZElkcy5mb3JFYWNoKG1vZElkID0+IHtcclxuICAgIGNvbnN0IHN1Yk1vZElkcyA9IHV0aWwuZ2V0U2FmZShtb2RzW21vZElkXSwgWydhdHRyaWJ1dGVzJywgJ3N1Yk1vZElkcyddLCBbXSk7XHJcbiAgICBpZiAoc3ViTW9kSWRzLmluY2x1ZGVzKHN1Yk1vZElkKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmxldCByZWZyZXNoRnVuYztcclxuYXN5bmMgZnVuY3Rpb24gcmVmcmVzaENhY2hlT25FdmVudChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhTWFuYWdlcjogQ29tTWV0YWRhdGFNYW5hZ2VyKSB7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmICgoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBkZXBsb3lQcm9maWxlPy5nYW1lSWQpIHx8IChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpKSB7XHJcbiAgICAvLyBEZXBsb3ltZW50IGV2ZW50IHNlZW1zIHRvIGJlIGV4ZWN1dGVkIGZvciBhIHByb2ZpbGUgb3RoZXJcclxuICAgIC8vICB0aGFuIHRoZSBjdXJyZW50bHkgYWN0aXZlIG9uZS4gTm90IGdvaW5nIHRvIGNvbnRpbnVlLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgbWV0YU1hbmFnZXIudXBkYXRlRGVwZW5kZW5jeU1hcChwcm9maWxlSWQpO1xyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcmVmcmVzaENhY2hlKGNvbnRleHQpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgLy8gUHJvY2Vzc0NhbmNlbGVkIG1lYW5zIHRoYXQgd2Ugd2VyZSB1bmFibGUgdG8gc2NhbiBmb3IgZGVwbG95ZWRcclxuICAgIC8vICBzdWJNb2R1bGVzLCBwcm9iYWJseSBiZWNhdXNlIGdhbWUgZGlzY292ZXJ5IGlzIGluY29tcGxldGUuXHJcbiAgICAvLyBJdCdzIGJleW9uZCB0aGUgc2NvcGUgb2YgdGhpcyBmdW5jdGlvbiB0byByZXBvcnQgZGlzY292ZXJ5XHJcbiAgICAvLyAgcmVsYXRlZCBpc3N1ZXMuXHJcbiAgICByZXR1cm4gKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIHt9KTtcclxuXHJcbiAgLy8gV2UncmUgZ29pbmcgdG8gZG8gYSBxdWljayB0U29ydCBhdCB0aGlzIHBvaW50IC0gbm90IGdvaW5nIHRvXHJcbiAgLy8gIGNoYW5nZSB0aGUgdXNlcidzIGxvYWQgb3JkZXIsIGJ1dCB0aGlzIHdpbGwgaGlnaGxpZ2h0IGFueVxyXG4gIC8vICBjeWNsaWMgb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMuXHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIGNvbnN0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBjb25zdCBzb3J0UHJvcHM6IElTb3J0UHJvcHMgPSB7XHJcbiAgICBzdWJNb2RJZHM6IG1vZElkcyxcclxuICAgIGFsbG93TG9ja2VkOiB0cnVlLFxyXG4gICAgbG9hZE9yZGVyLFxyXG4gICAgbWV0YU1hbmFnZXIsXHJcbiAgfTtcclxuICBjb25zdCBzb3J0ZWQgPSB0U29ydChzb3J0UHJvcHMpO1xyXG5cclxuICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmVmcmVzaEZ1bmMoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIG1ldGFNYW5hZ2VyKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgQ0FDSEUgPSBnZXRDYWNoZSgpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gUmFjZSBjb25kaXRpb24gP1xyXG4gICAgcmV0dXJuIGl0ZW1zO1xyXG4gIH1cclxuXHJcbiAgbGV0IG1vZElkcyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICBpZiAoaXRlbXMubGVuZ3RoID4gMCAmJiBtb2RJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBDYWNoZSBoYXNuJ3QgYmVlbiBwb3B1bGF0ZWQgeWV0LlxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gUmVmcmVzaCB0aGUgY2FjaGUuXHJcbiAgICAgIGF3YWl0IHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgYWN0aXZlUHJvZmlsZS5pZCwgbWV0YU1hbmFnZXIpO1xyXG4gICAgICBtb2RJZHMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBMb2NrZWQgaWRzIGFyZSBhbHdheXMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdCBhcyBhbGxcclxuICAvLyAgb3RoZXIgbW9kdWxlcyBkZXBlbmQgb24gdGhlc2UuXHJcbiAgbGV0IGxvY2tlZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gQ0FDSEVbaWRdLmlzTG9ja2VkKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIFNvcnQgdGhlIGxvY2tlZCBpZHMgYW1vbmdzdCB0aGVtc2VsdmVzIHRvIGVuc3VyZVxyXG4gICAgLy8gIHRoYXQgdGhlIGdhbWUgcmVjZWl2ZXMgdGhlc2UgaW4gdGhlIHJpZ2h0IG9yZGVyLlxyXG4gICAgY29uc3Qgc29ydFByb3BzOiBJU29ydFByb3BzID0ge1xyXG4gICAgICBzdWJNb2RJZHM6IGxvY2tlZElkcyxcclxuICAgICAgYWxsb3dMb2NrZWQ6IHRydWUsXHJcbiAgICAgIG1ldGFNYW5hZ2VyLFxyXG4gICAgfTtcclxuICAgIGxvY2tlZElkcyA9IHRTb3J0KHNvcnRQcm9wcyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgbG9ja2VkIGVudHJpZXMuXHJcbiAgY29uc3QgbG9ja2VkSXRlbXMgPSBsb2NrZWRJZHMubWFwKGlkID0+ICh7XHJcbiAgICBpZDogQ0FDSEVbaWRdLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVbaWRdLnN1Yk1vZE5hbWUsXHJcbiAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGlkKSxcclxuICB9KSk7XHJcblxyXG4gIGNvbnN0IExBVU5DSEVSX0RBVEEgPSBnZXRMYXVuY2hlckRhdGEoKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgaWRzIHdpbGwgaW5jbHVkZSBvZmZpY2lhbCBtb2R1bGVzIGFzIHdlbGwgYnV0IG5vdCBsb2NrZWQgZW50cmllcy5cclxuICBjb25zdCBleHRlcm5hbElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gKCFDQUNIRVtpZF0uaXNMb2NrZWQpICYmIChDQUNIRVtpZF0udm9ydGV4SWQgPT09IGlkKSk7XHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBMT2tleXMgPSAoKE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoID4gMClcclxuICAgID8gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgOiBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHMubWFwKG1vZCA9PiBtb2Quc3ViTW9kSWQpKTtcclxuXHJcbiAgLy8gRXh0ZXJuYWwgbW9kdWxlcyB0aGF0IGFyZSBhbHJlYWR5IGluIHRoZSBsb2FkIG9yZGVyLlxyXG4gIGNvbnN0IGtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+IExPa2V5cy5pbmNsdWRlcyhpZCkpIHx8IFtdO1xyXG5cclxuICAvLyBFeHRlcm5hbCBtb2R1bGVzIHdoaWNoIGFyZSBuZXcgYW5kIGhhdmUgeWV0IHRvIGJlIGFkZGVkIHRvIHRoZSBMTy5cclxuICBjb25zdCB1bmtub3duRXh0ID0gZXh0ZXJuYWxJZHMuZmlsdGVyKGlkID0+ICFMT2tleXMuaW5jbHVkZXMoaWQpKSB8fCBbXTtcclxuXHJcbiAgaXRlbXMgPSBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAvLyBSZW1vdmUgYW55IGxvY2tlZElkcywgYnV0IGFsc28gZW5zdXJlIHRoYXQgdGhlXHJcbiAgICAvLyAgZW50cnkgY2FuIGJlIGZvdW5kIGluIHRoZSBjYWNoZS4gSWYgaXQncyBub3QgaW4gdGhlXHJcbiAgICAvLyAgY2FjaGUsIHRoaXMgbWF5IG1lYW4gdGhhdCB0aGUgc3VibW9kIHhtbCBmaWxlIGZhaWxlZFxyXG4gICAgLy8gIHBhcnNlLWluZyBhbmQgdGhlcmVmb3JlIHNob3VsZCBub3QgYmUgZGlzcGxheWVkLlxyXG4gICAgY29uc3QgaXNMb2NrZWQgPSBsb2NrZWRJZHMuaW5jbHVkZXMoaXRlbS5pZCk7XHJcbiAgICBjb25zdCBoYXNDYWNoZUVudHJ5ID0gT2JqZWN0LmtleXMoQ0FDSEUpLmZpbmQoa2V5ID0+XHJcbiAgICAgIENBQ0hFW2tleV0udm9ydGV4SWQgPT09IGl0ZW0uaWQpICE9PSB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gIWlzTG9ja2VkICYmIGhhc0NhY2hlRW50cnk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHBvc01hcCA9IHt9O1xyXG4gIGxldCBuZXh0QXZhaWxhYmxlID0gTE9rZXlzLmxlbmd0aDtcclxuICBjb25zdCBnZXROZXh0UG9zID0gKGxvSWQpID0+IHtcclxuICAgIGlmIChMT0NLRURfTU9EVUxFUy5oYXMobG9JZCkpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmluZGV4T2YobG9JZCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHBvc01hcFtsb0lkXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHBvc01hcFtsb0lkXSA9IG5leHRBdmFpbGFibGU7XHJcbiAgICAgIHJldHVybiBuZXh0QXZhaWxhYmxlKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcG9zTWFwW2xvSWRdO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGtub3duRXh0Lm1hcChrZXkgPT4gKHtcclxuICAgIGlkOiBDQUNIRVtrZXldLnZvcnRleElkLFxyXG4gICAgbmFtZTogQ0FDSEVba2V5XS5zdWJNb2ROYW1lLFxyXG4gICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGNvbnRleHQsIENBQ0hFW2tleV0udm9ydGV4SWQpLFxyXG4gICAgb2ZmaWNpYWw6IE9GRklDSUFMX01PRFVMRVMuaGFzKGtleSksXHJcbiAgfSkpXHJcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1heC1saW5lLWxlbmd0aFxyXG4gICAgLnNvcnQoKGEsIGIpID0+IChsb2FkT3JkZXJbYS5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGEuaWQpKSAtIChsb2FkT3JkZXJbYi5pZF0/LnBvcyB8fCBnZXROZXh0UG9zKGIuaWQpKSlcclxuICAgIC5mb3JFYWNoKGtub3duID0+IHtcclxuICAgICAgLy8gSWYgdGhpcyBhIGtub3duIGV4dGVybmFsIG1vZHVsZSBhbmQgaXMgTk9UIGluIHRoZSBpdGVtIGxpc3QgYWxyZWFkeVxyXG4gICAgICAvLyAgd2UgbmVlZCB0byByZS1pbnNlcnQgaW4gdGhlIGNvcnJlY3QgaW5kZXggYXMgYWxsIGtub3duIGV4dGVybmFsIG1vZHVsZXNcclxuICAgICAgLy8gIGF0IHRoaXMgcG9pbnQgYXJlIGFjdHVhbGx5IGRlcGxveWVkIGluc2lkZSB0aGUgbW9kcyBmb2xkZXIgYW5kIHNob3VsZFxyXG4gICAgICAvLyAgYmUgaW4gdGhlIGl0ZW1zIGxpc3QhXHJcbiAgICAgIGNvbnN0IGRpZmYgPSAoTE9rZXlzLmxlbmd0aCkgLSAoTE9rZXlzLmxlbmd0aCAtIEFycmF5LmZyb20oTE9DS0VEX01PRFVMRVMpLmxlbmd0aCk7XHJcbiAgICAgIGlmIChpdGVtcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga25vd24uaWQpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb25zdCBwb3MgPSBsb2FkT3JkZXJba25vd24uaWRdPy5wb3M7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gKHBvcyAhPT0gdW5kZWZpbmVkKSA/IChwb3MgLSBkaWZmKSA6IChnZXROZXh0UG9zKGtub3duLmlkKSAtIGRpZmYpO1xyXG4gICAgICAgIGl0ZW1zLnNwbGljZShpZHgsIDAsIGtub3duKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHVua25vd25JdGVtcyA9IFtdLmNvbmNhdCh1bmtub3duRXh0KVxyXG4gICAgLm1hcChrZXkgPT4gKHtcclxuICAgICAgaWQ6IENBQ0hFW2tleV0udm9ydGV4SWQsXHJcbiAgICAgIG5hbWU6IENBQ0hFW2tleV0uc3ViTW9kTmFtZSxcclxuICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoY29udGV4dCwgQ0FDSEVba2V5XS52b3J0ZXhJZCksXHJcbiAgICAgIG9mZmljaWFsOiBPRkZJQ0lBTF9NT0RVTEVTLmhhcyhrZXkpLFxyXG4gICAgfSkpO1xyXG5cclxuICBjb25zdCBwcmVTb3J0ZWQgPSBbXS5jb25jYXQobG9ja2VkSXRlbXMsIGl0ZW1zLCB1bmtub3duSXRlbXMpO1xyXG4gIHJldHVybiAoZGlyZWN0aW9uID09PSAnZGVzY2VuZGluZycpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQucmV2ZXJzZSgpKVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcykge1xyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdsb2Fkb3JkZXJpbmZvJyB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSwgdCgnTWFuYWdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1lvdSBjYW4gYWRqdXN0IHRoZSBsb2FkIG9yZGVyIGZvciBCYW5uZXJsb3JkIGJ5IGRyYWdnaW5nIGFuZCBkcm9wcGluZyBtb2RzIHVwIG9yIGRvd24gb24gdGhpcyBwYWdlLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBrZWVwIGluIG1pbmQgdGhhdCBCYW5uZXJsb3JkIGlzIHN0aWxsIGluIEVhcmx5IEFjY2Vzcywgd2hpY2ggbWVhbnMgdGhhdCB0aGVyZSBtaWdodCBiZSBzaWduaWZpY2FudCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2NoYW5nZXMgdG8gdGhlIGdhbWUgYXMgdGltZSBnb2VzIG9uLiBQbGVhc2Ugbm90aWZ5IHVzIG9mIGFueSBWb3J0ZXggcmVsYXRlZCBpc3N1ZXMgeW91IGVuY291bnRlciB3aXRoIHRoaXMgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdleHRlbnNpb24gc28gd2UgY2FuIGZpeCBpdC4gRm9yIG1vcmUgaW5mb3JtYXRpb24gYW5kIGhlbHAgc2VlOiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19CYW5uZXJsb3JkX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBCYW5uZXJsb3JkIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ0hvdyB0byB1c2U6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NoZWNrIHRoZSBib3ggbmV4dCB0byB0aGUgbW9kcyB5b3Ugd2FudCB0byBiZSBhY3RpdmUgaW4gdGhlIGdhbWUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0NsaWNrIEF1dG8gU29ydCBpbiB0aGUgdG9vbGJhci4gKFNlZSBiZWxvdyBmb3IgZGV0YWlscykuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01ha2Ugc3VyZSB0byBydW4gdGhlIGdhbWUgZGlyZWN0bHkgdmlhIHRoZSBQbGF5IGJ1dHRvbiBpbiB0aGUgdG9wIGxlZnQgY29ybmVyICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcob24gdGhlIEJhbm5lcmxvcmQgdGlsZSkuIFlvdXIgVm9ydGV4IGxvYWQgb3JkZXIgbWF5IG5vdCBiZSBsb2FkZWQgaWYgeW91IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGdhbWUgbGF1bmNoZXIuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ09wdGlvbmFsOiBNYW51YWxseSBkcmFnIGFuZCBkcm9wIG1vZHMgdG8gZGlmZmVyZW50IHBvc2l0aW9ucyBpbiB0aGUgbG9hZCBvcmRlciAoZm9yIHRlc3RpbmcgZGlmZmVyZW50IG92ZXJyaWRlcykuIE1vZHMgZnVydGhlciBkb3duIHRoZSBsaXN0IG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1BsZWFzZSBub3RlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdUaGUgbG9hZCBvcmRlciByZWZsZWN0ZWQgaGVyZSB3aWxsIG9ubHkgYmUgbG9hZGVkIGlmIHlvdSBydW4gdGhlIGdhbWUgdmlhIHRoZSBwbGF5IGJ1dHRvbiBpbiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAndGhlIHRvcCBsZWZ0IGNvcm5lci4gRG8gbm90IHJ1biB0aGUgU2luZ2xlIFBsYXllciBnYW1lIHRocm91Z2ggdGhlIGxhdW5jaGVyLCBhcyB0aGF0IHdpbGwgaWdub3JlICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICd0aGUgVm9ydGV4IGxvYWQgb3JkZXIgYW5kIGdvIGJ5IHdoYXQgaXMgc2hvd24gaW4gdGhlIGxhdW5jaGVyIGluc3RlYWQuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0ZvciBCYW5uZXJsb3JkLCBtb2RzIHNvcnRlZCBmdXJ0aGVyIHRvd2FyZHMgdGhlIGJvdHRvbSBvZiB0aGUgbGlzdCB3aWxsIG92ZXJyaWRlIG1vZHMgZnVydGhlciB1cCAoaWYgdGhleSBjb25mbGljdCkuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdOb3RlOiBIYXJtb255IHBhdGNoZXMgbWF5IGJlIHRoZSBleGNlcHRpb24gdG8gdGhpcyBydWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdBdXRvIFNvcnQgdXNlcyB0aGUgU3ViTW9kdWxlLnhtbCBmaWxlcyAodGhlIGVudHJpZXMgdW5kZXIgPERlcGVuZGVkTW9kdWxlcz4pIHRvIGRldGVjdCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnZGVwZW5kZW5jaWVzIHRvIHNvcnQgYnkuICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdJZiB5b3UgY2Fubm90IHNlZSB5b3VyIG1vZCBpbiB0aGlzIGxvYWQgb3JkZXIsIFZvcnRleCBtYXkgaGF2ZSBiZWVuIHVuYWJsZSB0byBmaW5kIG9yIHBhcnNlIGl0cyBTdWJNb2R1bGUueG1sIGZpbGUuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdNb3N0IC0gYnV0IG5vdCBhbGwgbW9kcyAtIGNvbWUgd2l0aCBvciBuZWVkIGEgU3ViTW9kdWxlLnhtbCBmaWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdIaXQgdGhlIGRlcGxveSBidXR0b24gd2hlbmV2ZXIgeW91IGluc3RhbGwgYW5kIGVuYWJsZSBhIG5ldyBtb2QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1RoZSBnYW1lIHdpbGwgbm90IGxhdW5jaCB1bmxlc3MgdGhlIGdhbWUgc3RvcmUgKFN0ZWFtLCBFcGljLCBldGMpIGlzIHN0YXJ0ZWQgYmVmb3JlaGFuZC4gSWYgeW91XFwncmUgZ2V0dGluZyB0aGUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1wiVW5hYmxlIHRvIEluaXRpYWxpemUgU3RlYW0gQVBJXCIgZXJyb3IsIHJlc3RhcnQgU3RlYW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1JpZ2h0IGNsaWNraW5nIGFuIGVudHJ5IHdpbGwgb3BlbiB0aGUgY29udGV4dCBtZW51IHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvY2sgTE8gZW50cmllcyBpbnRvIHBvc2l0aW9uOyBlbnRyeSB3aWxsICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdiZSBpZ25vcmVkIGJ5IGF1dG8tc29ydCBtYWludGFpbmluZyBpdHMgbG9ja2VkIHBvc2l0aW9uLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUdhbWVWZXJzaW9uKGRpc2NvdmVyeVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ2RldmVsb3BtZW50JyAmJiBzZW12ZXIuc2F0aXNmaWVzKHV0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9uLCAnPDEuNC4wJykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ25vdCBzdXBwb3J0ZWQgaW4gb2xkZXIgVm9ydGV4IHZlcnNpb25zJykpO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEocGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdiaW4nLCAnV2luNjRfU2hpcHBpbmdfQ2xpZW50JywgJ1ZlcnNpb24ueG1sJykpO1xyXG4gICAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBCQU5ORVJMT1JEX0VYRUMpO1xyXG4gICAgY29uc3QgdmFsdWUgPSBkYXRhLmdldDxFbGVtZW50PignLy9TaW5nbGVwbGF5ZXInKVxyXG4gICAgICAuYXR0cignVmFsdWUnKVxyXG4gICAgICAudmFsdWUoKVxyXG4gICAgICAuc2xpY2UoMSlcclxuICAgICAgLnNwbGl0KCcuJylcclxuICAgICAgLnNsaWNlKDAsIDMpXHJcbiAgICAgIC5qb2luKCcuJyk7XHJcbiAgICByZXR1cm4gKHNlbXZlci52YWxpZCh2YWx1ZSkpID8gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKSA6IGdldFZlcnNpb24oZXhlUGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmxldCBfSVNfU09SVElORyA9IGZhbHNlO1xyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQpIHtcclxuICBjb25zdCBtZXRhTWFuYWdlciA9IG5ldyBDb21NZXRhZGF0YU1hbmFnZXIoY29udGV4dC5hcGkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ01vdW50ICYgQmxhZGUgSUk6XFx0QmFubmVybG9yZCcsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiAnLicsXHJcbiAgICBnZXRHYW1lVmVyc2lvbjogcmVzb2x2ZUdhbWVWZXJzaW9uLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+IEJBTk5FUkxPUkRfRVhFQyxcclxuICAgIHNldHVwOiAoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnksIG1ldGFNYW5hZ2VyKSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgXSxcclxuICAgIHBhcmFtZXRlcnM6IFtdLFxyXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQudG9TdHJpbmcoKSxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IFNURUFNQVBQX0lELFxyXG4gICAgICBlcGljQXBwSWQ6IEVQSUNBUFBfSUQsXHJcbiAgICAgIGN1c3RvbU9wZW5Nb2RzUGF0aDogTU9EVUxFUyxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHRbJ3JlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUnXShcclxuICAgICdtb3VudGFuZGJsYWRlMl9jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMpLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJQ29sbGVjdGlvbnNEYXRhKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXHJcbiAgICAodCkgPT4gdCgnTW91bnQgYW5kIEJsYWRlIDIgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIC8vIFJlZ2lzdGVyIHRoZSBMTyBwYWdlLlxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXJQYWdlKHtcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIGNyZWF0ZUluZm9QYW5lbDogKHByb3BzKSA9PiB7XHJcbiAgICAgIHJlZnJlc2hGdW5jID0gcHJvcHMucmVmcmVzaDtcclxuICAgICAgcmV0dXJuIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpO1xyXG4gICAgfSxcclxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXHJcbiAgICBnYW1lQXJ0VVJMOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIHByZVNvcnQ6IChpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlKSA9PlxyXG4gICAgICBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIG1ldGFNYW5hZ2VyKSxcclxuICAgIGNhbGxiYWNrOiAobG9hZE9yZGVyKSA9PiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0LCBsb2FkT3JkZXIpLFxyXG4gICAgaXRlbVJlbmRlcmVyOiBDdXN0b21JdGVtUmVuZGVyZXIuZGVmYXVsdCxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmFubmVybG9yZHJvb3Rtb2QnLCAyMCwgdGVzdFJvb3RNb2QsIGluc3RhbGxSb290TW9kKTtcclxuXHJcbiAgLy8gSW5zdGFsbHMgb25lIG9yIG1vcmUgc3VibW9kdWxlcy5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiYW5uZXJsb3Jkc3VibW9kdWxlcycsIDI1LCB0ZXN0Rm9yU3VibW9kdWxlcywgaW5zdGFsbFN1Yk1vZHVsZXMpO1xyXG5cclxuICAvLyBBIHZlcnkgc2ltcGxlIG1pZ3JhdGlvbiB0aGF0IGludGVuZHMgdG8gYWRkIHRoZSBzdWJNb2RJZHMgYXR0cmlidXRlXHJcbiAgLy8gIHRvIG1vZHMgdGhhdCBhY3QgYXMgXCJtb2QgcGFja3NcIi4gVGhpcyBtaWdyYXRpb24gaXMgbm9uLWludmFzaXZlIGFuZCB3aWxsXHJcbiAgLy8gIG5vdCByZXBvcnQgYW55IGVycm9ycy4gU2lkZSBlZmZlY3RzIG9mIHRoZSBtaWdyYXRpb24gbm90IHdvcmtpbmcgY29ycmVjdGx5XHJcbiAgLy8gIHdpbGwgbm90IGFmZmVjdCB0aGUgdXNlcidzIGV4aXN0aW5nIGVudmlyb25tZW50LlxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24ob2xkID0+IG1pZ3JhdGUwMjYoY29udGV4dC5hcGksIG9sZCkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdnZW5lcmljLWxvYWQtb3JkZXItaWNvbnMnLCAyMDAsXHJcbiAgICBfSVNfU09SVElORyA/ICdzcGlubmVyJyA6ICdsb290LXNvcnQnLCB7fSwgJ0F1dG8gU29ydCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKF9JU19TT1JUSU5HKSB7XHJcbiAgICAgICAgLy8gQWxyZWFkeSBzb3J0aW5nIC0gZG9uJ3QgZG8gYW55dGhpbmcuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBfSVNfU09SVElORyA9IHRydWU7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IG1ldGFNYW5hZ2VyLnVwZGF0ZURlcGVuZGVuY3lNYXAoKTtcclxuICAgICAgICBhd2FpdCByZWZyZXNoQ2FjaGUoY29udGV4dCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlc29sdmUgc3VibW9kdWxlIGZpbGUgZGF0YScsIGVycik7XHJcbiAgICAgICAgX0lTX1NPUlRJTkcgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAgICAgY29uc3QgbW9kSWRzID0gT2JqZWN0LmtleXMoQ0FDSEUpO1xyXG4gICAgICBjb25zdCBsb2NrZWRJZHMgPSBtb2RJZHMuZmlsdGVyKGlkID0+IENBQ0hFW2lkXS5pc0xvY2tlZCk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZElkcyA9IG1vZElkcy5maWx0ZXIoaWQgPT4gIUNBQ0hFW2lkXS5pc0xvY2tlZCk7XHJcblxyXG4gICAgICBsZXQgc29ydGVkTG9ja2VkID0gW107XHJcbiAgICAgIGxldCBzb3J0ZWRTdWJNb2RzID0gW107XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gUHJvYmFibHkgYmVzdCB0aGF0IHdlIGRvbid0IHJlcG9ydCB0aGlzIHZpYSBub3RpZmljYXRpb24gYXMgYSBudW1iZXJcclxuICAgICAgICAvLyAgb2YgdGhpbmdzIG1heSBoYXZlIG9jY3VycmVkIHRoYXQgY2F1c2VkIHRoaXMgaXNzdWUuIFdlIGxvZyBpdCBpbnN0ZWFkLlxyXG4gICAgICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHNvcnQgbW9kcycsIHsgcmVhc29uOiAnTm8gYWN0aXZlIHByb2ZpbGUnIH0pO1xyXG4gICAgICAgIF9JU19TT1JUSU5HID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBzb3J0ZWRMb2NrZWQgPSB0U29ydCh7IHN1Yk1vZElkczogbG9ja2VkSWRzLCBhbGxvd0xvY2tlZDogdHJ1ZSwgbWV0YU1hbmFnZXIgfSk7XHJcbiAgICAgICAgc29ydGVkU3ViTW9kcyA9IHRTb3J0KHsgc3ViTW9kSWRzLCBhbGxvd0xvY2tlZDogZmFsc2UsIGxvYWRPcmRlciwgbWV0YU1hbmFnZXIgfSwgdHJ1ZSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNvcnQgbW9kcycsIGVycik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBuZXdPcmRlciA9IFtdLmNvbmNhdChzb3J0ZWRMb2NrZWQsIHNvcnRlZFN1Yk1vZHMpLnJlZHVjZSgoYWNjdW0sIGlkLCBpZHgpID0+IHtcclxuICAgICAgICBjb25zdCB2b3J0ZXhJZCA9IENBQ0hFW2lkXS52b3J0ZXhJZDtcclxuICAgICAgICBjb25zdCBuZXdFbnRyeSA9IHtcclxuICAgICAgICAgIHBvczogaWR4LFxyXG4gICAgICAgICAgZW5hYmxlZDogQ0FDSEVbaWRdLmlzT2ZmaWNpYWxcclxuICAgICAgICAgICAgPyB0cnVlXHJcbiAgICAgICAgICAgIDogKCEhbG9hZE9yZGVyW3ZvcnRleElkXSlcclxuICAgICAgICAgICAgICA/IGxvYWRPcmRlclt2b3J0ZXhJZF0uZW5hYmxlZFxyXG4gICAgICAgICAgICAgIDogdHJ1ZSxcclxuICAgICAgICAgIGxvY2tlZDogKGxvYWRPcmRlclt2b3J0ZXhJZF0/LmxvY2tlZCA9PT0gdHJ1ZSksXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYWNjdW1bdm9ydGV4SWRdID0gbmV3RW50cnk7XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCB7fSk7XHJcblxyXG4gICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihhY3RpdmVQcm9maWxlLmlkLCBuZXdPcmRlcikpO1xyXG4gICAgICByZXR1cm4gcmVmcmVzaEdhbWVQYXJhbXMoY29udGV4dCwgbmV3T3JkZXIpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgICBpZDogJ21uYjItc29ydC1maW5pc2hlZCcsXHJcbiAgICAgICAgICB0eXBlOiAnaW5mbycsXHJcbiAgICAgICAgICBtZXNzYWdlOiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0ZpbmlzaGVkIHNvcnRpbmcnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgICAgIGRpc3BsYXlNUzogMzAwMCxcclxuICAgICAgICB9KSkuZmluYWxseSgoKSA9PiBfSVNfU09SVElORyA9IGZhbHNlKTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PlxyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2ZpbGVJZCwgbWV0YU1hbmFnZXIpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PlxyXG4gICAgICByZWZyZXNoQ2FjaGVPbkV2ZW50KGNvbnRleHQsIHByb2ZpbGVJZCwgbWV0YU1hbmFnZXIpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZSkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIHJlZnJlc2hDYWNoZU9uRXZlbnQoY29udGV4dCwgcHJvZj8uaWQsIG1ldGFNYW5hZ2VyKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgYXN5bmMgKHByb2ZpbGVJZCwgZmlsZXMpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICAvLyBkb24ndCBjYXJlIGFib3V0IGFueSBvdGhlciBnYW1lc1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgICAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuXHJcbiAgICAgIGF3YWl0IEJsdWViaXJkLm1hcChmaWxlcywgYXN5bmMgKGVudHJ5OiB7IGZpbGVQYXRoOiBzdHJpbmcsIGNhbmRpZGF0ZXM6IHN0cmluZ1tdIH0pID0+IHtcclxuICAgICAgICAvLyBvbmx5IGFjdCBpZiB3ZSBkZWZpbml0aXZlbHkga25vdyB3aGljaCBtb2Qgb3ducyB0aGUgZmlsZVxyXG4gICAgICAgIGlmIChlbnRyeS5jYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLnBlcnNpc3RlbnQubW9kcyxcclxuICAgICAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLCB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZFBhdGhzW21vZC50eXBlID8/ICcnXSwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmlkLCByZWxQYXRoKTtcclxuICAgICAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LlxyXG4gICAgICAgICAgLy8gIFRoYXQgd2F5LCB2b3J0ZXggd2lsbCBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3RcclxuICAgICAgICAgIC8vICBkZXBsb3ltZW50IG1ldGhvZCBhbmQgbm90IGFzayB0aGUgdXNlciBhbnkgcXVlc3Rpb25zXHJcbiAgICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgdGFyZ2V0IGRlc3RpbmF0aW9uIGZpbGUgaWYgaXQgZXhpc3RzLlxyXG4gICAgICAgICAgLy8gIHRoaXMgaXMgdG8gY29tcGxldGVseSBhdm9pZCBhIHNjZW5hcmlvIHdoZXJlIHdlIG1heSBhdHRlbXB0IHRvXHJcbiAgICAgICAgICAvLyAgY29weSB0aGUgc2FtZSBmaWxlIG9udG8gaXRzZWxmLlxyXG4gICAgICAgICAgcmV0dXJuIGZzLnJlbW92ZUFzeW5jKHRhcmdldFBhdGgpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIHRhcmdldFBhdGgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCkpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gaW1wb3J0IGFkZGVkIGZpbGUgdG8gbW9kJywgZXJyLm1lc3NhZ2UpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=