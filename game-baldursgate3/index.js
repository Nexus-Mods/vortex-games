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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const vortex_api_1 = require("vortex-api");
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
const cache_1 = __importDefault(require("./cache"));
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
            const profilePath = yield (0, util_1.globalProfilePath)(api);
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(profilePath);
                const modSettingsFilePath = path.join(profilePath, 'modsettings.lsx');
                try {
                    yield vortex_api_1.fs.statAsync(modSettingsFilePath);
                }
                catch (err) {
                    const defaultModSettings = yield (0, util_1.getDefaultModSettings)(api);
                    yield vortex_api_1.fs.writeFileAsync(modSettingsFilePath, defaultModSettings, { encoding: 'utf8' });
                }
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    });
}
function prepareForModding(api, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        const mp = (0, util_1.modsPath)();
        const format = yield (0, util_1.getDefaultModSettingsFormat)(api);
        if (!['v7', 'v8'].includes(format)) {
            showFullReleaseModFixerRecommendation(api);
        }
        return vortex_api_1.fs.statAsync(mp)
            .catch(() => vortex_api_1.fs.ensureDirWritableAsync(mp, () => bluebird_1.default.resolve()))
            .finally(() => ensureGlobalProfile(api, discovery));
    });
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
            cache_1.default.getInstance(api).save();
            return;
        }
        try {
            yield (0, migrations_1.migrate)(api);
            const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
            const gameSettingsPath = path.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
            let nodes = yield (0, loadOrder_1.getNodes)(gameSettingsPath);
            const { modsNode, modsOrderNode } = nodes;
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            const format = yield (0, util_1.getDefaultModSettingsFormat)(api);
            if (modsOrderNode === undefined && ['v7', 'v8'].includes(format)) {
                const convFunc = format === 'v7' ? util_1.convertV6toV7 : util_1.convertToV8;
                const data = yield vortex_api_1.fs.readFileAsync(gameSettingsPath, { encoding: 'utf8' });
                const newData = yield convFunc(data);
                yield vortex_api_1.fs.removeAsync(gameSettingsPath).catch(err => Promise.resolve());
                yield vortex_api_1.fs.writeFileAsync(gameSettingsPath, newData, { encoding: 'utf8' });
            }
        }
        catch (err) {
            api.showErrorNotification('Failed to migrate', err, {
                allowReport: false,
            });
        }
        try {
            yield (0, util_1.readStoredLO)(api);
            cache_1.default.getInstance(api);
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
        usageInstructions: (() => (React.createElement(InfoPanel_1.InfoPanelWrap, { api: context.api, getOwnGameVersion: util_1.getOwnGameVersion, readStoredLO: util_1.readStoredLO, installLSLib: onGameModeActivated, getLatestLSLibMod: util_1.getLatestLSLibMod }))),
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
    context.registerAction('fb-load-order-icons', 170, 'import', {}, 'Import from BG3MM...', () => { (0, loadOrder_1.importFromBG3MM)(context); }, isBG3);
    context.registerAction('fb-load-order-icons', 190, 'open-ext', {}, 'Open Load Order File', () => {
        (0, util_1.getActivePlayerProfile)(context.api)
            .then(bg3ProfileId => {
            const gameSettingsPath = path.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
            vortex_api_1.util.opn(gameSettingsPath).catch(() => null);
        });
    }, isBG3);
    context.registerSettings('Mods', Settings_1.default, undefined, isBG3, 150);
    context.once(() => {
        context.api.onStateChange(['session', 'base', 'toolsRunning'], (prev, current) => __awaiter(this, void 0, void 0, function* () {
            const gameMode = vortex_api_1.selectors.activeGameId(context.api.getState());
            if ((gameMode === common_1.GAME_ID) && (Object.keys(current).length === 0)) {
                try {
                    yield (0, util_1.readStoredLO)(context.api);
                }
                catch (err) {
                    context.api.showErrorNotification('Failed to read load order', err, {
                        message: 'Please run the game before you start modding',
                        allowReport: false,
                    });
                }
            }
        }));
        context.api.onAsync('did-deploy', (profileId, deployment) => __awaiter(this, void 0, void 0, function* () {
            const profile = vortex_api_1.selectors.profileById(context.api.getState(), profileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) === common_1.GAME_ID) {
                (0, util_1.forceRefresh)(context.api);
            }
            yield cache_1.default.getInstance(context.api).save();
            return Promise.resolve();
        }));
        context.api.events.on('check-mods-version', (gameId, mods) => onCheckModVersion(context.api, gameId, mods));
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () { return onGameModeActivated(context.api, gameMode); }));
    });
    return true;
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFVQSx3REFBZ0M7QUFFaEMsMkNBQTZCO0FBQzdCLDZDQUErQjtBQUMvQiwyQ0FBd0Q7QUFFeEQscUNBRWtCO0FBQ2xCLHFFQUF1RDtBQUN2RCwwREFBa0M7QUFDbEMsMERBQWlDO0FBQ2pDLDZDQUF1QztBQUV2QyxpQ0FVZ0I7QUFFaEIsNkNBR3NCO0FBRXRCLHlDQUVvQjtBQUVwQiwyQ0FJcUI7QUFFckIsMkNBQTJDO0FBQzNDLG9EQUFtQztBQUVuQyxNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXZDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFFM0IsU0FBUyxTQUFTLENBQUMsS0FBSztJQUN0QixPQUFPLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQWUsbUJBQW1CLENBQUMsR0FBd0IsRUFBRSxTQUFpQzs7UUFDNUYsSUFBSSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxFQUFFLENBQUM7WUFDcEIsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHdCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQztnQkFDSCxNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDN0Ms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USxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG4vKipcclxuICogSW1wb3J0YW50IC0gYWx0aG91Z2ggd2Ugbm8gbG9uZ2VyIGRlZmluZSB0aGUgaW5mbyBwYW5lbCBoZXJlLFxyXG4gKiAgd2Ugc3RpbGwgbmVlZCB0byBrZWVwIHRoZSBpbmRleCBmaWxlJ3MgJy50c3gnIGV4dGVuc2lvbi5cclxuICogIEF0IGxlYXN0IHdoaWxlIG91ciB1cGRhdGUgcHJvY2VzcyBmb3IgYnVuZGxlZCBwbHVnaW5zIHJlbWFpbnNcclxuICogIHRocm91Z2ggdGhlICdyZWxlYXNlJyBicmFuY2guXHJcbiAqIFxyXG4gKiBSZW1vdmluZyBmaWxlcyBmcm9tIGJ1bmRsZWQgcGx1Z2lucyB3aXRob3V0IHN0dWJiaW5nIHRoZSBleHRlbnNpb25cclxuICogIGNhbiBwb3RlbnRpYWxseSBicmVhayB0aGUgZXh0ZW5zaW9uIG9uIHRoZSB1c2VyJ3MgZW5kLlxyXG4gKi9cclxuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBJR05PUkVfUEFUVEVSTlMsXHJcbiAgTU9EX1RZUEVfQkczU0UsIE1PRF9UWVBFX0xPT1NFLCBNT0RfVFlQRV9MU0xJQiwgTU9EX1RZUEVfUkVQTEFDRVIsXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgKiBhcyBnaXRIdWJEb3dubG9hZGVyIGZyb20gJy4vZ2l0aHViRG93bmxvYWRlcic7XHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcclxuaW1wb3J0IHJlZHVjZXIgZnJvbSAnLi9yZWR1Y2Vycyc7XHJcbmltcG9ydCB7IG1pZ3JhdGUgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBsb2dEZWJ1ZywgZm9yY2VSZWZyZXNoLCBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcixcclxuICBnZXRHYW1lRGF0YVBhdGgsIGdldEdhbWVQYXRoLCBnbG9iYWxQcm9maWxlUGF0aCwgbW9kc1BhdGgsXHJcbiAgZ2V0TGF0ZXN0TFNMaWJNb2QsIGdldE93bkdhbWVWZXJzaW9uLCByZWFkU3RvcmVkTE8sXHJcbiAgZ2V0RGVmYXVsdE1vZFNldHRpbmdzLFxyXG4gIGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdCxcclxuICBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlLFxyXG4gIHByb2ZpbGVzUGF0aCxcclxuICBjb252ZXJ0VjZ0b1Y3LFxyXG4gIGNvbnZlcnRUb1Y4LFxyXG59IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQge1xyXG4gIHRlc3RMU0xpYiwgdGVzdEJHM1NFLCB0ZXN0RW5naW5lSW5qZWN0b3IsIHRlc3RNb2RGaXhlciwgdGVzdFJlcGxhY2VyLFxyXG4gIGluc3RhbGxMU0xpYiwgaW5zdGFsbEJHM1NFLCBpbnN0YWxsRW5naW5lSW5qZWN0b3IsIGluc3RhbGxNb2RGaXhlciwgaW5zdGFsbFJlcGxhY2VyLFxyXG59IGZyb20gJy4vaW5zdGFsbGVycyc7XHJcblxyXG5pbXBvcnQge1xyXG4gIGlzQkczU0UsIGlzTFNMaWIsIGlzTG9vc2UsIGlzUmVwbGFjZXIsXHJcbn0gZnJvbSAnLi9tb2RUeXBlcyc7XHJcblxyXG5pbXBvcnQge1xyXG4gIGRlc2VyaWFsaXplLCBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUsIGltcG9ydE1vZFNldHRpbmdzR2FtZSxcclxuICBpbXBvcnRGcm9tQkczTU0sIHNlcmlhbGl6ZSwgZXhwb3J0VG9HYW1lLCBleHBvcnRUb0ZpbGUsIHZhbGlkYXRlLFxyXG4gIGdldE5vZGVzLFxyXG59IGZyb20gJy4vbG9hZE9yZGVyJztcclxuXHJcbmltcG9ydCB7IEluZm9QYW5lbFdyYXAgfSBmcm9tICcuL0luZm9QYW5lbCdcclxuaW1wb3J0IFBha0luZm9DYWNoZSBmcm9tICcuL2NhY2hlJztcclxuXHJcbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTQ1NjQ2MDY2OSc7XHJcbmNvbnN0IFNURUFNX0lEID0gJzEwODY5NDAnO1xyXG5cclxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XHJcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IGFueSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtHT0dfSUQsIFNURUFNX0lEXSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICBjb25zdCBwcm9maWxlUGF0aCA9IGF3YWl0IGdsb2JhbFByb2ZpbGVQYXRoKGFwaSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHByb2ZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgbW9kU2V0dGluZ3NGaWxlUGF0aCA9IHBhdGguam9pbihwcm9maWxlUGF0aCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29uc3QgZGVmYXVsdE1vZFNldHRpbmdzID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCwgZGVmYXVsdE1vZFNldHRpbmdzLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KSB7XHJcbiAgY29uc3QgbXAgPSBtb2RzUGF0aCgpOyAgXHJcblxyXG4gIGNvbnN0IGZvcm1hdCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xyXG4gIGlmICghWyd2NycsICd2OCddLmluY2x1ZGVzKGZvcm1hdCkpIHtcclxuICAgIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpKTtcclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcclxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkgYXMgYW55KSlcclxuICAgIC5maW5hbGx5KCgpID0+IGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpLCBkaXNjb3ZlcnkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyBjaGVjayB0byBzZWUgaWYgbW9kIGlzIGluc3RhbGxlZCBmaXJzdD9cclxuICBjb25zdCBtb2RzID0gYXBpLnN0b3JlLmdldFN0YXRlKCkucGVyc2lzdGVudD8ubW9kcz8uYmFsZHVyc2dhdGUzO1xyXG4gIGlmKG1vZHMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3QgbW9kQXJyYXk6IHR5cGVzLklNb2RbXSA9IG1vZHMgPyBPYmplY3QudmFsdWVzKG1vZHMpIDogW107XHJcbiAgICBsb2dEZWJ1ZygnbW9kQXJyYXknLCBtb2RBcnJheSk7XHJcbiAgXHJcbiAgICBjb25zdCBtb2RGaXhlckluc3RhbGxlZDpib29sZWFuID0gIG1vZEFycmF5LmZpbHRlcihtb2QgPT4gISFtb2Q/LmF0dHJpYnV0ZXM/Lm1vZEZpeGVyKS5sZW5ndGggIT0gMDsgIFxyXG4gICAgbG9nRGVidWcoJ21vZEZpeGVySW5zdGFsbGVkJywgbW9kRml4ZXJJbnN0YWxsZWQpO1xyXG5cclxuICAgIC8vIGlmIHdlJ3ZlIGZvdW5kIGFuIGluc3RhbGxlZCBtb2RmaXhlciwgdGhlbiBkb24ndCBib3RoZXIgc2hvd2luZyBub3RpZmljYXRpb24gXHJcbiAgICBpZihtb2RGaXhlckluc3RhbGxlZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBubyBtb2RzIGZvdW5kXHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgdGl0bGU6ICdSZWNvbW1lbmRlZCBNb2QnLFxyXG4gICAgbWVzc2FnZTogJ01vc3QgbW9kcyByZXF1aXJlIHRoaXMgbW9kLicsXHJcbiAgICBpZDogJ2JnMy1yZWNvbW1lbmRlZC1tb2QnLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTW9yZScsIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnUmVjb21tZW5kZWQgTW9kcycsIHtcclxuICAgICAgICAgICAgdGV4dDpcclxuICAgICAgICAgICAgICAnV2UgcmVjb21tZW5kIGluc3RhbGxpbmcgXCJCYWxkdXJcXCdzIEdhdGUgMyBNb2QgRml4ZXJcIiB0byBiZSBhYmxlIHRvIG1vZCBCYWxkdXJcXCdzIEdhdGUgMy5cXG5cXG4nICsgXHJcbiAgICAgICAgICAgICAgJ1RoaXMgY2FuIGJlIGRvd25sb2FkZWQgZnJvbSBOZXh1cyBNb2RzIGFuZCBpbnN0YWxsZWQgdXNpbmcgVm9ydGV4IGJ5IHByZXNzaW5nIFwiT3BlbiBOZXh1cyBNb2RzJ1xyXG4gICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICB7IGxhYmVsOiAnRGlzbWlzcycgfSxcclxuICAgICAgICAgICAgeyBsYWJlbDogJ09wZW4gTmV4dXMgTW9kcycsIGRlZmF1bHQ6IHRydWUgfSxcclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnT3BlbiBOZXh1cyBNb2RzJykge1xyXG4gICAgICAgICAgICAgICAgdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vYmFsZHVyc2dhdGUzL21vZHMvMTQxP3RhYj1kZXNjcmlwdGlvbicpLmNhdGNoKCgpID0+IG51bGwpXHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuYWN0aW9uID09PSAnQ2FuY2VsJykge1xyXG4gICAgICAgICAgICAgICAgLy8gZGlzbWlzcyBhbnl3YXlcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIF0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uQ2hlY2tNb2RWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuZ2V0U3RhdGUoKSk7XHJcbiAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xyXG5cclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICAvLyBOb3RoaW5nIHRvIHVwZGF0ZS5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG5ld2VzdFZlcjogc3RyaW5nID0gYXdhaXQgZ2l0SHViRG93bmxvYWRlci5jaGVja0ZvclVwZGF0ZXMoYXBpLCBsYXRlc3RWZXIpO1xyXG4gIGlmICghbmV3ZXN0VmVyIHx8IG5ld2VzdFZlciA9PT0gbGF0ZXN0VmVyKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcpIHtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoYXBpKS5zYXZlKCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBtaWdyYXRlKGFwaSk7XHJcbiAgICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgICBjb25zdCBnYW1lU2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gICAgbGV0IG5vZGVzID0gYXdhaXQgZ2V0Tm9kZXMoZ2FtZVNldHRpbmdzUGF0aCk7XHJcbiAgICBjb25zdCB7IG1vZHNOb2RlLCBtb2RzT3JkZXJOb2RlIH0gPSBub2RlcztcclxuICAgIGlmICgobW9kc05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChtb2RzTm9kZS5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcclxuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XHJcbiAgICBpZiAobW9kc09yZGVyTm9kZSA9PT0gdW5kZWZpbmVkICYmIFsndjcnLCAndjgnXS5pbmNsdWRlcyhmb3JtYXQpKSB7XHJcbiAgICAgIGNvbnN0IGNvbnZGdW5jID0gZm9ybWF0ID09PSAndjcnID8gY29udmVydFY2dG9WNyA6IGNvbnZlcnRUb1Y4O1xyXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhnYW1lU2V0dGluZ3NQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICAgIGNvbnN0IG5ld0RhdGEgPSBhd2FpdCBjb252RnVuYyhkYXRhKTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZ2FtZVNldHRpbmdzUGF0aCkuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoZ2FtZVNldHRpbmdzUGF0aCwgbmV3RGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcclxuICAgICAgJ0ZhaWxlZCB0byBtaWdyYXRlJywgZXJyLCB7XHJcbiAgICAgICAgLy9tZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhhcGkpO1xyXG4gICAgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGFwaSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxyXG4gICAgICAnRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XHJcbiAgaWYgKGxhdGVzdFZlciA9PT0gJzAuMC4wJykge1xyXG4gICAgYXdhaXQgZ2l0SHViRG93bmxvYWRlci5kb3dubG9hZERpdmluZShhcGkpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAnZXhldnVsa2FuJyxcclxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxyXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogbW9kc1BhdGgsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzNfZHgxMS5leGUnLFxyXG4gICAgc2V0dXA6IGRpc2NvdmVyeSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSBhcyBhbnksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9JRCxcclxuICAgICAgc3RvcFBhdHRlcm5zOiBTVE9QX1BBVFRFUk5TLm1hcCh0b1dvcmRFeHApLFxyXG4gICAgICBpZ25vcmVDb25mbGljdHM6IElHTk9SRV9QQVRURVJOUyxcclxuICAgICAgaWdub3JlRGVwbG95OiBJR05PUkVfUEFUVEVSTlMsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCAzMDAsICdzZXR0aW5ncycsIHt9LCAnUmUtaW5zdGFsbCBMU0xpYi9EaXZpbmUnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cclxuICAgICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICBjb25zdCBsc2xpYnMgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIobW9kID0+IG1vZHNbbW9kXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJyk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZHMnLCBHQU1FX0lELCBsc2xpYnMsIChlcnIpID0+IHtcclxuICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlaW5zdGFsbCBsc2xpYicsXHJcbiAgICAgICAgICAnUGxlYXNlIHJlLWluc3RhbGwgbWFudWFsbHknLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgZ2l0SHViRG93bmxvYWRlci5kb3dubG9hZERpdmluZShjb250ZXh0LmFwaSk7XHJcbiAgICB9KTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIGdhbWVNb2RlID09PSBHQU1FX0lEO1xyXG4gIH0pOyAgXHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcsIDE1LCB0ZXN0TFNMaWIgYXMgYW55LCBpbnN0YWxsTFNMaWIgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtYmczc2UnLCAxNSwgdGVzdEJHM1NFIGFzIGFueSwgaW5zdGFsbEJHM1NFIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWVuZ2luZS1pbmplY3RvcicsIDIwLCB0ZXN0RW5naW5lSW5qZWN0b3IgYXMgYW55LCBpbnN0YWxsRW5naW5lSW5qZWN0b3IgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtcmVwbGFjZXInLCAyNSwgdGVzdFJlcGxhY2VyIGFzIGFueSwgaW5zdGFsbFJlcGxhY2VyIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLW1vZGZpeGVyJywgMjUsIHRlc3RNb2RGaXhlciBhcyBhbnksIGluc3RhbGxNb2RGaXhlciBhcyBhbnkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9MU0xJQiwgMTUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IHVuZGVmaW5lZCwgXHJcbiAgICBpc0xTTGliIGFzIGFueSxcclxuICAgIHsgbmFtZTogJ0JHMyBMU0xpYicsIG5vQ29uZmxpY3RzOiB0cnVlIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9CRzNTRSwgMTUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IHBhdGguam9pbihnZXRHYW1lUGF0aChjb250ZXh0LmFwaSksICdiaW4nKSwgXHJcbiAgICBpc0JHM1NFIGFzIGFueSxcclxuICAgIHsgbmFtZTogJ0JHMyBCRzNTRScgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xPT1NFLCAyMCwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSwgXHJcbiAgICBpc0xvb3NlIGFzIGFueSxcclxuICAgIHsgbmFtZTogJ0JHMyBMb29zZScgfSBhcyBhbnkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9SRVBMQUNFUiwgMjUsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxyXG4gICAgaW5zdHJ1Y3Rpb25zID0+IGlzUmVwbGFjZXIoY29udGV4dC5hcGksIGluc3RydWN0aW9ucykgYXMgYW55LFxyXG4gICAgeyBuYW1lOiAnQkczIFJlcGxhY2VyJyB9IGFzIGFueSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xyXG4gICAgY2xlYXJTdGF0ZU9uUHVyZ2U6IGZhbHNlLFxyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplKGNvbnRleHQpLFxyXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyLCBwcmV2KSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIHZhbGlkYXRlLFxyXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IGZhbHNlLFxyXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICgoKSA9PiAoXHJcbiAgICAgIDxJbmZvUGFuZWxXcmFwXHJcbiAgICAgICAgYXBpPXtjb250ZXh0LmFwaX1cclxuICAgICAgICBnZXRPd25HYW1lVmVyc2lvbj17Z2V0T3duR2FtZVZlcnNpb259XHJcbiAgICAgICAgcmVhZFN0b3JlZExPPXtyZWFkU3RvcmVkTE99XHJcbiAgICAgICAgaW5zdGFsbExTTGliPXtvbkdhbWVNb2RlQWN0aXZhdGVkfVxyXG4gICAgICAgIGdldExhdGVzdExTTGliTW9kPXtnZXRMYXRlc3RMU0xpYk1vZH1cclxuICAgICAgLz4pXHJcbiAgICApIGFzIGFueSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgaXNCRzMgPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcclxuICB9O1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnY2hhbmdlbG9nJywge30sICdFeHBvcnQgdG8gR2FtZScsICgpID0+IHsgZXhwb3J0VG9HYW1lKGNvbnRleHQuYXBpKTsgfSwgaXNCRzMpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNTEsICdjaGFuZ2Vsb2cnLCB7fSwgJ0V4cG9ydCB0byBGaWxlLi4uJywgKCkgPT4geyBleHBvcnRUb0ZpbGUoY29udGV4dC5hcGkpOyB9LCBpc0JHMyk7XHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE2MCwgJ2ltcG9ydCcsIHt9LCAnSW1wb3J0IGZyb20gR2FtZScsICgpID0+IHsgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGNvbnRleHQuYXBpKTsgfSwgaXNCRzMpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNjEsICdpbXBvcnQnLCB7fSwgJ0ltcG9ydCBmcm9tIEZpbGUuLi4nLCAoKSA9PiB7IFxyXG4gICAgaW1wb3J0TW9kU2V0dGluZ3NGaWxlKGNvbnRleHQuYXBpKTsgXHJcbiAgfSwgaXNCRzMpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNzAsICdpbXBvcnQnLCB7fSwgJ0ltcG9ydCBmcm9tIEJHM01NLi4uJywgKCkgPT4geyBpbXBvcnRGcm9tQkczTU0oY29udGV4dCk7IH0sIGlzQkczKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTkwLCAnb3Blbi1leHQnLCB7fSwgJ09wZW4gTG9hZCBPcmRlciBGaWxlJywgKCkgPT4ge1xyXG4gICAgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShjb250ZXh0LmFwaSlcclxuICAgICAgLnRoZW4oYmczUHJvZmlsZUlkID0+IHtcclxuICAgICAgICBjb25zdCBnYW1lU2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gICAgICAgIHV0aWwub3BuKGdhbWVTZXR0aW5nc1BhdGgpLmNhdGNoKCgpID0+IG51bGwpXHJcbiAgICAgIH0pO1xyXG4gIH0sIGlzQkczKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MsIHVuZGVmaW5lZCwgaXNCRzMsIDE1MCk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2Vzc2lvbicsICdiYXNlJywgJ3Rvb2xzUnVubmluZyddLFxyXG4gICAgICBhc3luYyAocHJldjogYW55LCBjdXJyZW50OiBhbnkpID0+IHtcclxuICAgICAgICAvLyB3aGVuIGEgdG9vbCBleGl0cywgcmUtcmVhZCB0aGUgbG9hZCBvcmRlciBmcm9tIGRpc2sgYXMgaXQgbWF5IGhhdmUgYmVlblxyXG4gICAgICAgIC8vIGNoYW5nZWRcclxuICAgICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgICAgaWYgKChnYW1lTW9kZSA9PT0gR0FNRV9JRCkgJiYgKE9iamVjdC5rZXlzKGN1cnJlbnQpLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCksIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgPT09IEdBTUVfSUQpIHtcclxuICAgICAgICBmb3JjZVJlZnJlc2goY29udGV4dC5hcGkpO1xyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IFBha0luZm9DYWNoZS5nZXRJbnN0YW5jZShjb250ZXh0LmFwaSkuc2F2ZSgpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2NoZWNrLW1vZHMtdmVyc2lvbicsXHJcbiAgICAgIChnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSA9PiBvbkNoZWNrTW9kVmVyc2lvbihjb250ZXh0LmFwaSwgZ2FtZUlkLCBtb2RzKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgICBhc3luYyAoZ2FtZU1vZGU6IHN0cmluZykgPT4gb25HYW1lTW9kZUFjdGl2YXRlZChjb250ZXh0LmFwaSwgZ2FtZU1vZGUpKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1haW47XHJcbiJdfQ==