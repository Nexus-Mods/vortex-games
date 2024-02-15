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
const bluebird_1 = __importDefault(require("bluebird"));
const path = __importStar(require("path"));
const React = __importStar(require("react"));
const semver = __importStar(require("semver"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const gitHubDownloader = __importStar(require("./githubDownloader"));
const Settings_1 = __importDefault(require("./Settings"));
const reducers_1 = __importDefault(require("./reducers"));
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const installers_1 = require("./installers");
const modTypes_1 = require("./modTypes");
const loadOrder_1 = require("./loadOrder");
const InfoPanel_1 = require("./InfoPanel");
const STOP_PATTERNS = ['[^/]*\\.pak$'];
const GOG_ID = '1456460669';
const STEAM_ID = '1086940';
function toWordExp(input) {
    return '(^|/)' + input + '(/|$)';
}
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID])
        .then(game => game.gamePath);
}
function ensureGlobalProfile(api, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        if (discovery === null || discovery === void 0 ? void 0 : discovery.path) {
            const profilePath = (0, util_1.globalProfilePath)();
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(profilePath);
                const modSettingsFilePath = path.join(profilePath, 'modsettings.lsx');
                try {
                    yield vortex_api_1.fs.statAsync(modSettingsFilePath);
                }
                catch (err) {
                    yield vortex_api_1.fs.writeFileAsync(modSettingsFilePath, common_1.DEFAULT_MOD_SETTINGS, { encoding: 'utf8' });
                }
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    });
}
function prepareForModding(api, discovery) {
    const mp = (0, util_1.modsPath)();
    showFullReleaseModFixerRecommendation(api);
    api.sendNotification({
        id: 'bg3-uses-lslib',
        type: 'info',
        title: 'BG3 support uses LSLib',
        message: common_1.LSLIB_URL,
        allowSuppress: true,
        actions: [
            { title: 'Visit Page', action: () => vortex_api_1.util.opn(common_1.LSLIB_URL).catch(() => null) },
        ],
    });
    return vortex_api_1.fs.statAsync(mp)
        .catch(() => vortex_api_1.fs.ensureDirWritableAsync(mp, () => bluebird_1.default.resolve()))
        .finally(() => ensureGlobalProfile(api, discovery));
}
function showFullReleaseModFixerRecommendation(api) {
    var _a, _b;
    const mods = (_b = (_a = api.store.getState().persistent) === null || _a === void 0 ? void 0 : _a.mods) === null || _b === void 0 ? void 0 : _b.baldursgate3;
    if (mods !== undefined) {
        const modArray = mods ? Object.values(mods) : [];
        (0, util_1.logDebug)('modArray', modArray);
        const modFixerInstalled = modArray.filter(mod => { var _a; return !!((_a = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _a === void 0 ? void 0 : _a.modFixer); }).length != 0;
        (0, util_1.logDebug)('modFixerInstalled', modFixerInstalled);
        if (modFixerInstalled) {
            return;
        }
    }
    api.sendNotification({
        type: 'warning',
        title: 'Recommended Mod',
        message: 'Most mods require this mod.',
        id: 'bg3-recommended-mod',
        allowSuppress: true,
        actions: [
            {
                title: 'More', action: dismiss => {
                    api.showDialog('question', 'Recommended Mods', {
                        text: 'We recommend installing "Baldur\'s Gate 3 Mod Fixer" to be able to mod Baldur\'s Gate 3.\n\n' +
                            'This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods'
                    }, [
                        { label: 'Dismiss' },
                        { label: 'Open Nexus Mods', default: true },
                    ])
                        .then(result => {
                        dismiss();
                        if (result.action === 'Open Nexus Mods') {
                            vortex_api_1.util.opn('https://www.nexusmods.com/baldursgate3/mods/141?tab=description').catch(() => null);
                        }
                        else if (result.action === 'Cancel') {
                        }
                        return Promise.resolve();
                    });
                }
            }
        ],
    });
}
const getPlayerProfiles = (() => {
    let cached = [];
    try {
        cached = vortex_api_1.fs.readdirSync((0, util_1.profilesPath)())
            .filter(name => (path.extname(name) === '') && (name !== 'Default'));
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    return () => cached;
})();
function gameSupportsProfile(gameVersion) {
    return semver.lt(semver.coerce(gameVersion), '4.1.206');
}
function getOwnGameVersion(state) {
    return __awaiter(this, void 0, void 0, function* () {
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        return yield vortex_api_1.util.getGame(common_1.GAME_ID).getInstalledVersion(discovery);
    });
}
function getActivePlayerProfile(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        return gameSupportsProfile(yield getOwnGameVersion(api.getState()))
            ? ((_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile) || 'global'
            : 'Public';
    });
}
function findNode(nodes, id) {
    var _a;
    return (_a = nodes === null || nodes === void 0 ? void 0 : nodes.find(iter => iter.$.id === id)) !== null && _a !== void 0 ? _a : undefined;
}
function parseModNode(node) {
    const name = findNode(node.attribute, 'Name').$.value;
    return {
        id: name,
        name,
        data: findNode(node.attribute, 'UUID').$.value,
    };
}
let storedLO;
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = yield getActivePlayerProfile(api);
        const playerProfiles = getPlayerProfiles();
        if (playerProfiles.length === 0) {
            storedLO = [];
            return;
        }
        const settingsPath = (bg3profile !== 'global')
            ? path.join((0, util_1.profilesPath)(), bg3profile, 'modsettings.lsx')
            : path.join((0, util_1.globalProfilePath)(), 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function writeModSettings(api, data, bg3profile) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bg3profile) {
            return;
        }
        const settingsPath = (bg3profile !== 'global')
            ? path.join((0, util_1.profilesPath)(), bg3profile, 'modsettings.lsx')
            : path.join((0, util_1.globalProfilePath)(), 'modsettings.lsx');
        const builder = new xml2js_1.Builder();
        const xml = builder.buildObject(data);
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(settingsPath));
            yield vortex_api_1.fs.writeFileAsync(settingsPath, xml);
        }
        catch (err) {
            storedLO = [];
            const allowReport = ['ENOENT', 'EPERM'].includes(err.code);
            api.showErrorNotification('Failed to write mod settings', err, { allowReport });
            return;
        }
    });
}
function readStoredLO(api) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    return __awaiter(this, void 0, void 0, function* () {
        const modSettings = yield readModSettings(api);
        const config = findNode((_a = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const modOrderRoot = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModOrder');
        const modsRoot = findNode((_e = (_d = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'Mods');
        const modOrderNodes = (_h = (_g = (_f = modOrderRoot === null || modOrderRoot === void 0 ? void 0 : modOrderRoot.children) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.node) !== null && _h !== void 0 ? _h : [];
        const modNodes = (_l = (_k = (_j = modsRoot === null || modsRoot === void 0 ? void 0 : modsRoot.children) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.node) !== null && _l !== void 0 ? _l : [];
        const modOrder = modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
        const state = api.store.getState();
        const vProfile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabled = Object.keys(mods).filter(id => vortex_api_1.util.getSafe(vProfile, ['modState', id, 'enabled'], false));
        const bg3profile = (_m = state.settings.baldursgate3) === null || _m === void 0 ? void 0 : _m.playerProfile;
        if (enabled.length > 0 && modNodes.length === 1) {
            const lastWrite = (_p = (_o = state.settings.baldursgate3) === null || _o === void 0 ? void 0 : _o.settingsWritten) === null || _p === void 0 ? void 0 : _p[bg3profile];
            if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
                api.showDialog('info', '"modsettings.lsx" file was reset', {
                    text: 'The game reset the list of active mods and ran without them.\n'
                        + 'This happens when an invalid or incompatible mod is installed. '
                        + 'The game will not load any mods if one of them is incompatible, unfortunately '
                        + 'there is no easy way to find out which one caused the problem.',
                }, [
                    { label: 'Continue' },
                ]);
            }
        }
        storedLO = modNodes
            .map(node => parseModNode(node))
            .filter(entry => entry.id === 'Gustav')
            .sort((lhs, rhs) => modOrder
            .findIndex(i => i === lhs.data) - modOrder.findIndex(i => i === rhs.data));
    });
}
function onCheckModVersion(api, gameId, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = vortex_api_1.selectors.activeProfile(api.getState());
        if (profile.gameId !== common_1.GAME_ID || gameId !== common_1.GAME_ID) {
            return;
        }
        const latestVer = (0, util_1.getLatestInstalledLSLibVer)(api);
        if (latestVer === '0.0.0') {
            return;
        }
        const newestVer = yield gitHubDownloader.checkForUpdates(api, latestVer);
        if (!newestVer || newestVer === latestVer) {
            return;
        }
    });
}
function onGameModeActivated(api, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID) {
            return;
        }
        try {
            yield (0, migrations_1.migrate)(api);
        }
        catch (err) {
            api.showErrorNotification('Failed to migrate', err, {
                allowReport: false,
            });
        }
        try {
            yield readStoredLO(api);
        }
        catch (err) {
            api.showErrorNotification('Failed to read load order', err, {
                message: 'Please run the game before you start modding',
                allowReport: false,
            });
        }
        const latestVer = (0, util_1.getLatestInstalledLSLibVer)(api);
        if (latestVer === '0.0.0') {
            yield gitHubDownloader.downloadDivine(api);
        }
    });
}
function main(context) {
    context.registerReducer(['settings', 'baldursgate3'], reducers_1.default);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Baldur\'s Gate 3',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: [
            {
                id: 'exevulkan',
                name: 'Baldur\'s Gate 3 (Vulkan)',
                executable: () => 'bin/bg3.exe',
                requiredFiles: [
                    'bin/bg3.exe',
                ],
                relative: true,
            },
        ],
        queryModPath: util_1.modsPath,
        logo: 'gameart.jpg',
        executable: () => 'bin/bg3_dx11.exe',
        setup: discovery => prepareForModding(context.api, discovery),
        requiredFiles: [
            'bin/bg3_dx11.exe',
        ],
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
            stopPatterns: STOP_PATTERNS.map(toWordExp),
            ignoreConflicts: common_1.IGNORE_PATTERNS,
            ignoreDeploy: common_1.IGNORE_PATTERNS,
        },
    });
    context.registerAction('mod-icons', 300, 'settings', {}, 'Re-install LSLib/Divine', () => {
        const state = context.api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const lslibs = Object.keys(mods).filter(mod => mods[mod].type === 'bg3-lslib-divine-tool');
        context.api.events.emit('remove-mods', common_1.GAME_ID, lslibs, (err) => {
            if (err !== null) {
                context.api.showErrorNotification('Failed to reinstall lslib', 'Please re-install manually', { allowReport: false });
                return;
            }
            gitHubDownloader.downloadDivine(context.api);
        });
    }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return gameMode === common_1.GAME_ID;
    });
    context.registerInstaller('bg3-lslib-divine-tool', 15, installers_1.testLSLib, installers_1.installLSLib);
    context.registerInstaller('bg3-bg3se', 15, installers_1.testBG3SE, installers_1.installBG3SE);
    context.registerInstaller('bg3-engine-injector', 20, installers_1.testEngineInjector, installers_1.installEngineInjector);
    context.registerInstaller('bg3-replacer', 25, installers_1.testReplacer, installers_1.installReplacer);
    context.registerInstaller('bg3-modfixer', 25, installers_1.testModFixer, installers_1.installModFixer);
    context.registerModType(common_1.MOD_TYPE_LSLIB, 15, (gameId) => gameId === common_1.GAME_ID, () => undefined, modTypes_1.isLSLib, { name: 'BG3 LSLib', noConflicts: true });
    context.registerModType(common_1.MOD_TYPE_BG3SE, 15, (gameId) => gameId === common_1.GAME_ID, () => path.join((0, util_1.getGamePath)(context.api), 'bin'), modTypes_1.isBG3SE, { name: 'BG3 BG3SE' });
    context.registerModType(common_1.MOD_TYPE_LOOSE, 20, (gameId) => gameId === common_1.GAME_ID, () => (0, util_1.getGameDataPath)(context.api), modTypes_1.isLoose, { name: 'BG3 Loose' });
    context.registerModType(common_1.MOD_TYPE_REPLACER, 25, (gameId) => gameId === common_1.GAME_ID, () => (0, util_1.getGameDataPath)(context.api), instructions => (0, modTypes_1.isReplacer)(context.api, instructions), { name: 'BG3 Replacer' });
    context.registerLoadOrder({
        clearStateOnPurge: false,
        gameId: common_1.GAME_ID,
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: (loadOrder, prev) => (0, loadOrder_1.serialize)(context, loadOrder),
        validate: loadOrder_1.validate,
        toggleableEntries: false,
        usageInstructions: (() => (React.createElement(InfoPanel_1.InfoPanelWrap, { api: context.api, getOwnGameVersion: getOwnGameVersion, readStoredLO: readStoredLO, installLSLib: onGameModeActivated, getLatestLSLibMod: util_1.getLatestLSLibMod }))),
    });
    const isBG3 = () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    };
    context.registerAction('fb-load-order-icons', 150, 'changelog', {}, 'Export to Game', () => { (0, loadOrder_1.exportToGame)(context.api); }, isBG3);
    context.registerAction('fb-load-order-icons', 151, 'changelog', {}, 'Export to File...', () => { (0, loadOrder_1.exportToFile)(context.api); }, isBG3);
    context.registerAction('fb-load-order-icons', 160, 'import', {}, 'Import from Game', () => { (0, loadOrder_1.importModSettingsGame)(context.api); }, isBG3);
    context.registerAction('fb-load-order-icons', 161, 'import', {}, 'Import from File...', () => {
        (0, loadOrder_1.importModSettingsFile)(context.api);
    }, isBG3);
    context.registerSettings('Mods', Settings_1.default, undefined, isBG3, 150);
    context.once(() => {
        context.api.onStateChange(['session', 'base', 'toolsRunning'], (prev, current) => __awaiter(this, void 0, void 0, function* () {
            const gameMode = vortex_api_1.selectors.activeGameId(context.api.getState());
            if ((gameMode === common_1.GAME_ID) && (Object.keys(current).length === 0)) {
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
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) === common_1.GAME_ID) {
                (0, util_1.forceRefresh)(context.api);
            }
            return Promise.resolve();
        });
        context.api.events.on('check-mods-version', (gameId, mods) => onCheckModVersion(context.api, gameId, mods));
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () { return onGameModeActivated(context.api, gameMode); }));
    });
    return true;
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVBLHdEQUFnQztBQUVoQywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLCtDQUFpQztBQUNqQywyQ0FBd0Q7QUFDeEQsbUNBQXFEO0FBR3JELHFDQUdrQjtBQUNsQixxRUFBdUQ7QUFDdkQsMERBQWtDO0FBQ2xDLDBEQUFpQztBQUNqQyw2Q0FBdUM7QUFFdkMsaUNBSWdCO0FBRWhCLDZDQUdzQjtBQUV0Qix5Q0FFb0I7QUFFcEIsMkNBR3FCO0FBRXJCLDJDQUEyQztBQUUzQyxNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXZDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFFM0IsU0FBUyxTQUFTLENBQUMsS0FBSztJQUN0QixPQUFPLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQWUsbUJBQW1CLENBQUMsR0FBd0IsRUFBRSxTQUFpQzs7UUFDNUYsSUFBSSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxFQUFFO1lBQ25CLE1BQU0sV0FBVyxHQUFHLElBQUEsd0JBQWlCLEdBQUUsQ0FBQztZQUN4QyxJQUFJO2dCQUNGLE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLG1CQUFtQixHQUFHLElBQUks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QUMsb0JBQW9CLEVBQ3hDLENBQUMsTUFBYyxFQUFFLElBQWtCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFeEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUN4QyxDQUFPLFFBQWdCLEVBQUUsRUFBRSxnREFBQyxPQUFBLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG4vKipcclxuICogSW1wb3J0YW50IC0gYWx0aG91Z2ggd2Ugbm8gbG9uZ2VyIGRlZmluZSB0aGUgaW5mbyBwYW5lbCBoZXJlLFxyXG4gKiAgd2Ugc3RpbGwgbmVlZCB0byBrZWVwIHRoZSBpbmRleCBmaWxlJ3MgJy50c3gnIGV4dGVuc2lvbi5cclxuICogIEF0IGxlYXN0IHdoaWxlIG91ciB1cGRhdGUgcHJvY2VzcyBmb3IgYnVuZGxlZCBwbHVnaW5zIHJlbWFpbnNcclxuICogIHRocm91Z2ggdGhlICdyZWxlYXNlJyBicmFuY2guXHJcbiAqIFxyXG4gKiBSZW1vdmluZyBmaWxlcyBmcm9tIGJ1bmRsZWQgcGx1Z2lucyB3aXRob3V0IHN0dWJiaW5nIHRoZSBleHRlbnNpb25cclxuICogIGNhbiBwb3RlbnRpYWxseSBicmVhayB0aGUgZXh0ZW5zaW9uIG9uIHRoZSB1c2VyJ3MgZW5kLlxyXG4gKi9cclxuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgeyBJTW9kTm9kZSwgSU1vZFNldHRpbmdzLCBJWG1sTm9kZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBERUZBVUxUX01PRF9TRVRUSU5HUywgR0FNRV9JRCwgTFNMSUJfVVJMLCBJR05PUkVfUEFUVEVSTlMsXHJcbiAgTU9EX1RZUEVfQkczU0UsIE1PRF9UWVBFX0xPT1NFLCBNT0RfVFlQRV9MU0xJQiwgTU9EX1RZUEVfUkVQTEFDRVIsXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgKiBhcyBnaXRIdWJEb3dubG9hZGVyIGZyb20gJy4vZ2l0aHViRG93bmxvYWRlcic7XHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IHJlZHVjZXIgZnJvbSAnLi9yZWR1Y2Vycyc7XHJcbmltcG9ydCB7IG1pZ3JhdGUgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBsb2dEZWJ1ZywgZm9yY2VSZWZyZXNoLCBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcixcclxuICBnZXRHYW1lRGF0YVBhdGgsIGdldEdhbWVQYXRoLCBnbG9iYWxQcm9maWxlUGF0aCwgbW9kc1BhdGgsXHJcbiAgcHJvZmlsZXNQYXRoLCBnZXRMYXRlc3RMU0xpYk1vZCxcclxufSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHtcclxuICB0ZXN0TFNMaWIsIHRlc3RCRzNTRSwgdGVzdEVuZ2luZUluamVjdG9yLCB0ZXN0TW9kRml4ZXIsIHRlc3RSZXBsYWNlcixcclxuICBpbnN0YWxsTFNMaWIsIGluc3RhbGxCRzNTRSwgaW5zdGFsbEVuZ2luZUluamVjdG9yLCBpbnN0YWxsTW9kRml4ZXIsIGluc3RhbGxSZXBsYWNlcixcclxufSBmcm9tICcuL2luc3RhbGxlcnMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBpc0JHM1NFLCBpc0xTTGliLCBpc0xvb3NlLCBpc1JlcGxhY2VyLFxyXG59IGZyb20gJy4vbW9kVHlwZXMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBkZXNlcmlhbGl6ZSwgaW1wb3J0TW9kU2V0dGluZ3NGaWxlLCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUsXHJcbiAgc2VyaWFsaXplLCBleHBvcnRUb0dhbWUsIGV4cG9ydFRvRmlsZSwgdmFsaWRhdGUsXHJcbn0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5cclxuaW1wb3J0IHsgSW5mb1BhbmVsV3JhcCB9IGZyb20gJy4vSW5mb1BhbmVsJ1xyXG5cclxuY29uc3QgU1RPUF9QQVRURVJOUyA9IFsnW14vXSpcXFxcLnBhayQnXTtcclxuXHJcbmNvbnN0IEdPR19JRCA9ICcxNDU2NDYwNjY5JztcclxuY29uc3QgU1RFQU1fSUQgPSAnMTA4Njk0MCc7XHJcblxyXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcclxuICByZXR1cm4gJyhefC8pJyArIGlucHV0ICsgJygvfCQpJztcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKTogYW55IHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRCwgU1RFQU1fSURdKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGgpIHtcclxuICAgIGNvbnN0IHByb2ZpbGVQYXRoID0gZ2xvYmFsUHJvZmlsZVBhdGgoKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocHJvZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBtb2RTZXR0aW5nc0ZpbGVQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVQYXRoLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoLCBERUZBVUxUX01PRF9TRVRUSU5HUywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeSk6IGFueSB7XHJcbiAgY29uc3QgbXAgPSBtb2RzUGF0aCgpOyAgXHJcblxyXG4gIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpKTsgXHJcblxyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiAnYmczLXVzZXMtbHNsaWInLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgdGl0bGU6ICdCRzMgc3VwcG9ydCB1c2VzIExTTGliJyxcclxuICAgIG1lc3NhZ2U6IExTTElCX1VSTCxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHsgdGl0bGU6ICdWaXNpdCBQYWdlJywgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbihMU0xJQl9VUkwpLmNhdGNoKCgpID0+IG51bGwpIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG4gIHJldHVybiBmcy5zdGF0QXN5bmMobXApXHJcbiAgICAuY2F0Y2goKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtcCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpIGFzIGFueSkpXHJcbiAgICAuZmluYWxseSgoKSA9PiBlbnN1cmVHbG9iYWxQcm9maWxlKGFwaSwgZGlzY292ZXJ5KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgLy8gY2hlY2sgdG8gc2VlIGlmIG1vZCBpcyBpbnN0YWxsZWQgZmlyc3Q/XHJcbiAgY29uc3QgbW9kcyA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpLnBlcnNpc3RlbnQ/Lm1vZHM/LmJhbGR1cnNnYXRlMztcclxuICBpZihtb2RzICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGNvbnN0IG1vZEFycmF5OiB0eXBlcy5JTW9kW10gPSBtb2RzID8gT2JqZWN0LnZhbHVlcyhtb2RzKSA6IFtdO1xyXG4gICAgbG9nRGVidWcoJ21vZEFycmF5JywgbW9kQXJyYXkpO1xyXG4gIFxyXG4gICAgY29uc3QgbW9kRml4ZXJJbnN0YWxsZWQ6Ym9vbGVhbiA9ICBtb2RBcnJheS5maWx0ZXIobW9kID0+ICEhbW9kPy5hdHRyaWJ1dGVzPy5tb2RGaXhlcikubGVuZ3RoICE9IDA7ICBcclxuICAgIGxvZ0RlYnVnKCdtb2RGaXhlckluc3RhbGxlZCcsIG1vZEZpeGVySW5zdGFsbGVkKTtcclxuXHJcbiAgICAvLyBpZiB3ZSd2ZSBmb3VuZCBhbiBpbnN0YWxsZWQgbW9kZml4ZXIsIHRoZW4gZG9uJ3QgYm90aGVyIHNob3dpbmcgbm90aWZpY2F0aW9uIFxyXG4gICAgaWYobW9kRml4ZXJJbnN0YWxsZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gbm8gbW9kcyBmb3VuZFxyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgIHRpdGxlOiAnUmVjb21tZW5kZWQgTW9kJyxcclxuICAgIG1lc3NhZ2U6ICdNb3N0IG1vZHMgcmVxdWlyZSB0aGlzIG1vZC4nLFxyXG4gICAgaWQ6ICdiZzMtcmVjb21tZW5kZWQtbW9kJyxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ01vcmUnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xyXG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1JlY29tbWVuZGVkIE1vZHMnLCB7XHJcbiAgICAgICAgICAgIHRleHQ6XHJcbiAgICAgICAgICAgICAgJ1dlIHJlY29tbWVuZCBpbnN0YWxsaW5nIFwiQmFsZHVyXFwncyBHYXRlIDMgTW9kIEZpeGVyXCIgdG8gYmUgYWJsZSB0byBtb2QgQmFsZHVyXFwncyBHYXRlIDMuXFxuXFxuJyArIFxyXG4gICAgICAgICAgICAgICdUaGlzIGNhbiBiZSBkb3dubG9hZGVkIGZyb20gTmV4dXMgTW9kcyBhbmQgaW5zdGFsbGVkIHVzaW5nIFZvcnRleCBieSBwcmVzc2luZyBcIk9wZW4gTmV4dXMgTW9kcydcclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0Rpc21pc3MnIH0sXHJcbiAgICAgICAgICAgIHsgbGFiZWw6ICdPcGVuIE5leHVzIE1vZHMnLCBkZWZhdWx0OiB0cnVlIH0sXHJcbiAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgICAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ09wZW4gTmV4dXMgTW9kcycpIHtcclxuICAgICAgICAgICAgICAgIHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL2JhbGR1cnNnYXRlMy9tb2RzLzE0MT90YWI9ZGVzY3JpcHRpb24nKS5jYXRjaCgoKSA9PiBudWxsKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIGRpc21pc3MgYW55d2F5XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICBdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xyXG4gIGxldCBjYWNoZWQgPSBbXTtcclxuICB0cnkge1xyXG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXHJcbiAgICAgICAgLmZpbHRlcihuYW1lID0+IChwYXRoLmV4dG5hbWUobmFtZSkgPT09ICcnKSAmJiAobmFtZSAhPT0gJ0RlZmF1bHQnKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICgpID0+IGNhY2hlZDtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIGdhbWVTdXBwb3J0c1Byb2ZpbGUoZ2FtZVZlcnNpb246IHN0cmluZykge1xyXG4gIHJldHVybiBzZW12ZXIubHQoc2VtdmVyLmNvZXJjZShnYW1lVmVyc2lvbiksICc0LjEuMjA2Jyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE93bkdhbWVWZXJzaW9uKHN0YXRlOiB0eXBlcy5JU3RhdGUpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIHJldHVybiBhd2FpdCB1dGlsLmdldEdhbWUoR0FNRV9JRCkuZ2V0SW5zdGFsbGVkVmVyc2lvbihkaXNjb3ZlcnkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIHJldHVybiBnYW1lU3VwcG9ydHNQcm9maWxlKGF3YWl0IGdldE93bkdhbWVWZXJzaW9uKGFwaS5nZXRTdGF0ZSgpKSlcclxuICAgID8gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlIHx8ICdnbG9iYWwnXHJcbiAgICA6ICdQdWJsaWMnO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kTm9kZTxUIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nIH0+LCBVPihub2RlczogVFtdLCBpZDogc3RyaW5nKTogVCB7XHJcbiAgcmV0dXJuIG5vZGVzPy5maW5kKGl0ZXIgPT4gaXRlci4kLmlkID09PSBpZCkgPz8gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZU1vZE5vZGUobm9kZTogSU1vZE5vZGUpIHtcclxuICBjb25zdCBuYW1lID0gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdOYW1lJykuJC52YWx1ZTtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IG5hbWUsXHJcbiAgICBuYW1lLFxyXG4gICAgZGF0YTogZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdVVUlEJykuJC52YWx1ZSxcclxuICB9O1xyXG59XHJcblxyXG5sZXQgc3RvcmVkTE86IGFueVtdO1xyXG5hc3luYyBmdW5jdGlvbiByZWFkTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3QgcGxheWVyUHJvZmlsZXMgPSBnZXRQbGF5ZXJQcm9maWxlcygpO1xyXG4gIGlmIChwbGF5ZXJQcm9maWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgIHN0b3JlZExPID0gW107XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSAoYmczcHJvZmlsZSAhPT0gJ2dsb2JhbCcpXHJcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXHJcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZXR0aW5nc1BhdGgpO1xyXG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRhdGE6IElNb2RTZXR0aW5ncywgYmczcHJvZmlsZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKCFiZzNwcm9maWxlKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSAoYmczcHJvZmlsZSAhPT0gJ2dsb2JhbCcpIFxyXG4gICAgPyBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKVxyXG4gICAgOiBwYXRoLmpvaW4oZ2xvYmFsUHJvZmlsZVBhdGgoKSwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcclxuICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGRhdGEpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShzZXR0aW5nc1BhdGgpKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHNldHRpbmdzUGF0aCwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHN0b3JlZExPID0gW107XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBzZXR0aW5ncycsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRTdG9yZWRMTyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcbiAgY29uc3QgbW9kc1Jvb3QgPSBmaW5kTm9kZShjb25maWdSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xyXG4gIGNvbnN0IG1vZE9yZGVyTm9kZXMgPSBtb2RPcmRlclJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcclxuXHJcbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcclxuXHJcbiAgLy8gcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHZQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XHJcbiAgICB1dGlsLmdldFNhZmUodlByb2ZpbGUsIFsnbW9kU3RhdGUnLCBpZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID4gMCAmJiBtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcclxuICAgIGNvbnN0IGxhc3RXcml0ZSA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8uc2V0dGluZ3NXcml0dGVuPy5bYmczcHJvZmlsZV07XHJcbiAgICBpZiAoKGxhc3RXcml0ZSAhPT0gdW5kZWZpbmVkKSAmJiAobGFzdFdyaXRlLmNvdW50ID4gMSkpIHtcclxuICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlIHdhcyByZXNldCcsIHtcclxuICAgICAgICB0ZXh0OiAnVGhlIGdhbWUgcmVzZXQgdGhlIGxpc3Qgb2YgYWN0aXZlIG1vZHMgYW5kIHJhbiB3aXRob3V0IHRoZW0uXFxuJ1xyXG4gICAgICAgICAgICArICdUaGlzIGhhcHBlbnMgd2hlbiBhbiBpbnZhbGlkIG9yIGluY29tcGF0aWJsZSBtb2QgaXMgaW5zdGFsbGVkLiAnXHJcbiAgICAgICAgICAgICsgJ1RoZSBnYW1lIHdpbGwgbm90IGxvYWQgYW55IG1vZHMgaWYgb25lIG9mIHRoZW0gaXMgaW5jb21wYXRpYmxlLCB1bmZvcnR1bmF0ZWx5ICdcclxuICAgICAgICAgICAgKyAndGhlcmUgaXMgbm8gZWFzeSB3YXkgdG8gZmluZCBvdXQgd2hpY2ggb25lIGNhdXNlZCB0aGUgcHJvYmxlbS4nLFxyXG4gICAgICB9LCBbXHJcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlJyB9LFxyXG4gICAgICBdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHN0b3JlZExPID0gbW9kTm9kZXNcclxuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXHJcbiAgICAvLyBHdXN0YXYgaXMgdGhlIGNvcmUgZ2FtZVxyXG4gICAgLmZpbHRlcihlbnRyeSA9PiBlbnRyeS5pZCA9PT0gJ0d1c3RhdicpXHJcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBtb2RPcmRlclxyXG4gICAgICAuZmluZEluZGV4KGkgPT4gaSA9PT0gbGhzLmRhdGEpIC0gbW9kT3JkZXIuZmluZEluZGV4KGkgPT4gaSA9PT0gcmhzLmRhdGEpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25DaGVja01vZFZlcnNpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSB7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKGFwaS5nZXRTdGF0ZSgpKTtcclxuICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQgfHwgZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XHJcblxyXG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcclxuICAgIC8vIE5vdGhpbmcgdG8gdXBkYXRlLlxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbmV3ZXN0VmVyOiBzdHJpbmcgPSBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmNoZWNrRm9yVXBkYXRlcyhhcGksIGxhdGVzdFZlcik7XHJcbiAgaWYgKCFuZXdlc3RWZXIgfHwgbmV3ZXN0VmVyID09PSBsYXRlc3RWZXIpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uR2FtZU1vZGVBY3RpdmF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IG1pZ3JhdGUoYXBpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdGYWlsZWQgdG8gbWlncmF0ZScsIGVyciwge1xyXG4gICAgICAgIC8vbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAnZXhldnVsa2FuJyxcclxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxyXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogbW9kc1BhdGgsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzNfZHgxMS5leGUnLFxyXG4gICAgc2V0dXA6IGRpc2NvdmVyeSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi9iZzNfZHgxMS5leGUnLFxyXG4gICAgXSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogSUdOT1JFX1BBVFRFUk5TLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IElHTk9SRV9QQVRURVJOUyxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDMwMCwgJ3NldHRpbmdzJywge30sICdSZS1pbnN0YWxsIExTTGliL0RpdmluZScsICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxyXG4gICAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IGxzbGlicyA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihtb2QgPT4gbW9kc1ttb2RdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kcycsIEdBTUVfSUQsIGxzbGlicywgKGVycikgPT4ge1xyXG4gICAgICBpZiAoZXJyICE9PSBudWxsKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVpbnN0YWxsIGxzbGliJyxcclxuICAgICAgICAgICdQbGVhc2UgcmUtaW5zdGFsbCBtYW51YWxseScsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGNvbnRleHQuYXBpKTtcclxuICAgIH0pO1xyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gZ2FtZU1vZGUgPT09IEdBTUVfSUQ7XHJcbiAgfSk7ICBcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIHRlc3RMU0xpYiBhcyBhbnksIGluc3RhbGxMU0xpYiBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1iZzNzZScsIDE1LCB0ZXN0QkczU0UgYXMgYW55LCBpbnN0YWxsQkczU0UgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtZW5naW5lLWluamVjdG9yJywgMjAsIHRlc3RFbmdpbmVJbmplY3RvciBhcyBhbnksIGluc3RhbGxFbmdpbmVJbmplY3RvciBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1yZXBsYWNlcicsIDI1LCB0ZXN0UmVwbGFjZXIgYXMgYW55LCBpbnN0YWxsUmVwbGFjZXIgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtbW9kZml4ZXInLCAyNSwgdGVzdE1vZEZpeGVyIGFzIGFueSwgaW5zdGFsbE1vZEZpeGVyIGFzIGFueSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xTTElCLCAxNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gdW5kZWZpbmVkLCBcclxuICAgIGlzTFNMaWIgYXMgYW55LFxyXG4gICAgeyBuYW1lOiAnQkczIExTTGliJywgbm9Db25mbGljdHM6IHRydWUgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0JHM1NFLCAxNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gcGF0aC5qb2luKGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSwgJ2JpbicpLCBcclxuICAgIGlzQkczU0UgYXMgYW55LFxyXG4gICAgeyBuYW1lOiAnQkczIEJHM1NFJyB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfTE9PU0UsIDIwLCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICAoKSA9PiBnZXRHYW1lRGF0YVBhdGgoY29udGV4dC5hcGkpLCBcclxuICAgIGlzTG9vc2UgYXMgYW55LFxyXG4gICAgeyBuYW1lOiAnQkczIExvb3NlJyB9IGFzIGFueSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX1JFUExBQ0VSLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSwgXHJcbiAgICBpbnN0cnVjdGlvbnMgPT4gaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgaW5zdHJ1Y3Rpb25zKSBhcyBhbnksXHJcbiAgICB7IG5hbWU6ICdCRzMgUmVwbGFjZXInIH0gYXMgYW55KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XHJcbiAgICBjbGVhclN0YXRlT25QdXJnZTogZmFsc2UsXHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemUoY29udGV4dCksXHJcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIsIHByZXYpID0+IHNlcmlhbGl6ZShjb250ZXh0LCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+IChcclxuICAgICAgPEluZm9QYW5lbFdyYXBcclxuICAgICAgICBhcGk9e2NvbnRleHQuYXBpfVxyXG4gICAgICAgIGdldE93bkdhbWVWZXJzaW9uPXtnZXRPd25HYW1lVmVyc2lvbn1cclxuICAgICAgICByZWFkU3RvcmVkTE89e3JlYWRTdG9yZWRMT31cclxuICAgICAgICBpbnN0YWxsTFNMaWI9e29uR2FtZU1vZGVBY3RpdmF0ZWR9XHJcbiAgICAgICAgZ2V0TGF0ZXN0TFNMaWJNb2Q9e2dldExhdGVzdExTTGliTW9kfVxyXG4gICAgICAvPilcclxuICAgICkgYXMgYW55LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBpc0JHMyA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH07XHJcbiAgLypcclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTQ1LCAncmVmcmVzaCcsIHt9LCAnRGVlcCBSZWZyZXNoJywgKCkgPT4geyBkZWVwUmVmcmVzaChjb250ZXh0LmFwaSk7IH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH0pOyovXHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNTAsICdjaGFuZ2Vsb2cnLCB7fSwgJ0V4cG9ydCB0byBHYW1lJywgKCkgPT4geyBleHBvcnRUb0dhbWUoY29udGV4dC5hcGkpOyB9LCBpc0JHMyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNTEsICdjaGFuZ2Vsb2cnLCB7fSwgJ0V4cG9ydCB0byBGaWxlLi4uJywgKCkgPT4geyBleHBvcnRUb0ZpbGUoY29udGV4dC5hcGkpOyB9LCBpc0JHMyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNjAsICdpbXBvcnQnLCB7fSwgJ0ltcG9ydCBmcm9tIEdhbWUnLCAoKSA9PiB7IGltcG9ydE1vZFNldHRpbmdzR2FtZShjb250ZXh0LmFwaSk7IH0sIGlzQkczKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE2MSwgJ2ltcG9ydCcsIHt9LCAnSW1wb3J0IGZyb20gRmlsZS4uLicsICgpID0+IHsgXHJcbiAgICBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUoY29udGV4dC5hcGkpOyBcclxuICB9LCBpc0JHMyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzLCB1bmRlZmluZWQsIGlzQkczLCAxNTApO1xyXG5cclxuICAvL2NvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24oKG9sZFZlcnNpb24pID0+IEJsdWViaXJkLnJlc29sdmUobWlncmF0ZTEzKGNvbnRleHQuYXBpLCBvbGRWZXJzaW9uKSkpO1xyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29udGV4dC5hcGkub25TdGF0ZUNoYW5nZShbJ3Nlc3Npb24nLCAnYmFzZScsICd0b29sc1J1bm5pbmcnXSxcclxuICAgICAgYXN5bmMgKHByZXY6IGFueSwgY3VycmVudDogYW55KSA9PiB7XHJcbiAgICAgICAgLy8gd2hlbiBhIHRvb2wgZXhpdHMsIHJlLXJlYWQgdGhlIGxvYWQgb3JkZXIgZnJvbSBkaXNrIGFzIGl0IG1heSBoYXZlIGJlZW5cclxuICAgICAgICAvLyBjaGFuZ2VkXHJcbiAgICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xyXG4gICAgICAgIGlmICgoZ2FtZU1vZGUgPT09IEdBTUVfSUQpICYmIChPYmplY3Qua2V5cyhjdXJyZW50KS5sZW5ndGggPT09IDApKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oY29udGV4dC5hcGkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCAocHJvZmlsZUlkOiBzdHJpbmcsIGRlcGxveW1lbnQpID0+IHtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkID09PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgZm9yY2VSZWZyZXNoKGNvbnRleHQuYXBpKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2NoZWNrLW1vZHMtdmVyc2lvbicsXHJcbiAgICAgIChnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSA9PiBvbkNoZWNrTW9kVmVyc2lvbihjb250ZXh0LmFwaSwgZ2FtZUlkLCBtb2RzKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgICBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4gb25HYW1lTW9kZUFjdGl2YXRlZChjb250ZXh0LmFwaSwgZ2FtZU1vZGUpKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1haW47XHJcbiJdfQ==