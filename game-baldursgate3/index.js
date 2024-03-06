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
            cache_1.default.getInstance().save(api);
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
            yield (0, util_1.readStoredLO)(api);
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
            yield cache_1.default.getInstance().save(context.api);
            return Promise.resolve();
        }));
        context.api.events.on('check-mods-version', (gameId, mods) => onCheckModVersion(context.api, gameId, mods));
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () { return onGameModeActivated(context.api, gameMode); }));
    });
    return true;
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVBLHdEQUFnQztBQUVoQywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLDJDQUF3RDtBQUV4RCxxQ0FHa0I7QUFDbEIscUVBQXVEO0FBQ3ZELDBEQUFrQztBQUNsQywwREFBaUM7QUFDakMsNkNBQXVDO0FBRXZDLGlDQUlnQjtBQUVoQiw2Q0FHc0I7QUFFdEIseUNBRW9CO0FBRXBCLDJDQUdxQjtBQUVyQiwyQ0FBMkM7QUFDM0Msb0RBQW1DO0FBRW5DLE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUUzQixTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBZSxtQkFBbUIsQ0FBQyxHQUF3QixFQUFFLFNBQWlDOztRQUM1RixJQUFJLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLEVBQUU7WUFDbkIsTUFBTSxXQUFXLEdBQUcsSUFBQSx3QkFBaUIsR0FBRSxDQUFDO1lBQ3hDLElBQUk7Z0JBQ0YsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FB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LENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFBLEdBQUEsQ0FBQyxDQUFDO0lBQzVFLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbi8qKlxuICogSW1wb3J0YW50IC0gYWx0aG91Z2ggd2Ugbm8gbG9uZ2VyIGRlZmluZSB0aGUgaW5mbyBwYW5lbCBoZXJlLFxuICogIHdlIHN0aWxsIG5lZWQgdG8ga2VlcCB0aGUgaW5kZXggZmlsZSdzICcudHN4JyBleHRlbnNpb24uXG4gKiAgQXQgbGVhc3Qgd2hpbGUgb3VyIHVwZGF0ZSBwcm9jZXNzIGZvciBidW5kbGVkIHBsdWdpbnMgcmVtYWluc1xuICogIHRocm91Z2ggdGhlICdyZWxlYXNlJyBicmFuY2guXG4gKiBcbiAqIFJlbW92aW5nIGZpbGVzIGZyb20gYnVuZGxlZCBwbHVnaW5zIHdpdGhvdXQgc3R1YmJpbmcgdGhlIGV4dGVuc2lvblxuICogIGNhbiBwb3RlbnRpYWxseSBicmVhayB0aGUgZXh0ZW5zaW9uIG9uIHRoZSB1c2VyJ3MgZW5kLlxuICovXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7XG4gIERFRkFVTFRfTU9EX1NFVFRJTkdTLCBHQU1FX0lELCBMU0xJQl9VUkwsIElHTk9SRV9QQVRURVJOUyxcbiAgTU9EX1RZUEVfQkczU0UsIE1PRF9UWVBFX0xPT1NFLCBNT0RfVFlQRV9MU0xJQiwgTU9EX1RZUEVfUkVQTEFDRVIsXG59IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCAqIGFzIGdpdEh1YkRvd25sb2FkZXIgZnJvbSAnLi9naXRodWJEb3dubG9hZGVyJztcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcbmltcG9ydCByZWR1Y2VyIGZyb20gJy4vcmVkdWNlcnMnO1xuaW1wb3J0IHsgbWlncmF0ZSB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5cbmltcG9ydCB7XG4gIGxvZ0RlYnVnLCBmb3JjZVJlZnJlc2gsIGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyLFxuICBnZXRHYW1lRGF0YVBhdGgsIGdldEdhbWVQYXRoLCBnbG9iYWxQcm9maWxlUGF0aCwgbW9kc1BhdGgsXG4gIGdldExhdGVzdExTTGliTW9kLCBnZXRPd25HYW1lVmVyc2lvbiwgcmVhZFN0b3JlZExPLFxufSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQge1xuICB0ZXN0TFNMaWIsIHRlc3RCRzNTRSwgdGVzdEVuZ2luZUluamVjdG9yLCB0ZXN0TW9kRml4ZXIsIHRlc3RSZXBsYWNlcixcbiAgaW5zdGFsbExTTGliLCBpbnN0YWxsQkczU0UsIGluc3RhbGxFbmdpbmVJbmplY3RvciwgaW5zdGFsbE1vZEZpeGVyLCBpbnN0YWxsUmVwbGFjZXIsXG59IGZyb20gJy4vaW5zdGFsbGVycyc7XG5cbmltcG9ydCB7XG4gIGlzQkczU0UsIGlzTFNMaWIsIGlzTG9vc2UsIGlzUmVwbGFjZXIsXG59IGZyb20gJy4vbW9kVHlwZXMnO1xuXG5pbXBvcnQge1xuICBkZXNlcmlhbGl6ZSwgaW1wb3J0TW9kU2V0dGluZ3NGaWxlLCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUsXG4gIHNlcmlhbGl6ZSwgZXhwb3J0VG9HYW1lLCBleHBvcnRUb0ZpbGUsIHZhbGlkYXRlLFxufSBmcm9tICcuL2xvYWRPcmRlcic7XG5cbmltcG9ydCB7IEluZm9QYW5lbFdyYXAgfSBmcm9tICcuL0luZm9QYW5lbCdcbmltcG9ydCBQYWtJbmZvQ2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5cbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XG5cbmNvbnN0IEdPR19JRCA9ICcxNDU2NDYwNjY5JztcbmNvbnN0IFNURUFNX0lEID0gJzEwODY5NDAnO1xuXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XG59XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IGFueSB7XG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbR09HX0lELCBTVEVBTV9JRF0pXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoKSB7XG4gICAgY29uc3QgcHJvZmlsZVBhdGggPSBnbG9iYWxQcm9maWxlUGF0aCgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHByb2ZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IG1vZFNldHRpbmdzRmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoLCBERUZBVUxUX01PRF9TRVRUSU5HUywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KTogYW55IHtcbiAgY29uc3QgbXAgPSBtb2RzUGF0aCgpOyAgXG5cbiAgc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGkpOyBcblxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgaWQ6ICdiZzMtdXNlcy1sc2xpYicsXG4gICAgdHlwZTogJ2luZm8nLFxuICAgIHRpdGxlOiAnQkczIHN1cHBvcnQgdXNlcyBMU0xpYicsXG4gICAgbWVzc2FnZTogTFNMSUJfVVJMLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAgeyB0aXRsZTogJ1Zpc2l0IFBhZ2UnLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKExTTElCX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCkgfSxcbiAgICBdLFxuICB9KTtcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcbiAgICAuY2F0Y2goKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtcCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpIGFzIGFueSkpXG4gICAgLmZpbmFsbHkoKCkgPT4gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGksIGRpc2NvdmVyeSkpO1xufVxuXG5mdW5jdGlvbiBzaG93RnVsbFJlbGVhc2VNb2RGaXhlclJlY29tbWVuZGF0aW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAvLyBjaGVjayB0byBzZWUgaWYgbW9kIGlzIGluc3RhbGxlZCBmaXJzdD9cbiAgY29uc3QgbW9kcyA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpLnBlcnNpc3RlbnQ/Lm1vZHM/LmJhbGR1cnNnYXRlMztcbiAgaWYobW9kcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgbW9kQXJyYXk6IHR5cGVzLklNb2RbXSA9IG1vZHMgPyBPYmplY3QudmFsdWVzKG1vZHMpIDogW107XG4gICAgbG9nRGVidWcoJ21vZEFycmF5JywgbW9kQXJyYXkpO1xuICBcbiAgICBjb25zdCBtb2RGaXhlckluc3RhbGxlZDpib29sZWFuID0gIG1vZEFycmF5LmZpbHRlcihtb2QgPT4gISFtb2Q/LmF0dHJpYnV0ZXM/Lm1vZEZpeGVyKS5sZW5ndGggIT0gMDsgIFxuICAgIGxvZ0RlYnVnKCdtb2RGaXhlckluc3RhbGxlZCcsIG1vZEZpeGVySW5zdGFsbGVkKTtcblxuICAgIC8vIGlmIHdlJ3ZlIGZvdW5kIGFuIGluc3RhbGxlZCBtb2RmaXhlciwgdGhlbiBkb24ndCBib3RoZXIgc2hvd2luZyBub3RpZmljYXRpb24gXG4gICAgaWYobW9kRml4ZXJJbnN0YWxsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICAvLyBubyBtb2RzIGZvdW5kXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnd2FybmluZycsXG4gICAgdGl0bGU6ICdSZWNvbW1lbmRlZCBNb2QnLFxuICAgIG1lc3NhZ2U6ICdNb3N0IG1vZHMgcmVxdWlyZSB0aGlzIG1vZC4nLFxuICAgIGlkOiAnYmczLXJlY29tbWVuZGVkLW1vZCcsXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcbiAgICBhY3Rpb25zOiBbXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnTW9yZScsIGFjdGlvbjogZGlzbWlzcyA9PiB7XG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1JlY29tbWVuZGVkIE1vZHMnLCB7XG4gICAgICAgICAgICB0ZXh0OlxuICAgICAgICAgICAgICAnV2UgcmVjb21tZW5kIGluc3RhbGxpbmcgXCJCYWxkdXJcXCdzIEdhdGUgMyBNb2QgRml4ZXJcIiB0byBiZSBhYmxlIHRvIG1vZCBCYWxkdXJcXCdzIEdhdGUgMy5cXG5cXG4nICsgXG4gICAgICAgICAgICAgICdUaGlzIGNhbiBiZSBkb3dubG9hZGVkIGZyb20gTmV4dXMgTW9kcyBhbmQgaW5zdGFsbGVkIHVzaW5nIFZvcnRleCBieSBwcmVzc2luZyBcIk9wZW4gTmV4dXMgTW9kcydcbiAgICAgICAgICB9LCBbXG4gICAgICAgICAgICB7IGxhYmVsOiAnRGlzbWlzcycgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdPcGVuIE5leHVzIE1vZHMnLCBkZWZhdWx0OiB0cnVlIH0sXG4gICAgICAgICAgXSlcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICAgIGRpc21pc3MoKTtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdPcGVuIE5leHVzIE1vZHMnKSB7XG4gICAgICAgICAgICAgICAgdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vYmFsZHVyc2dhdGUzL21vZHMvMTQxP3RhYj1kZXNjcmlwdGlvbicpLmNhdGNoKCgpID0+IG51bGwpXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcbiAgICAgICAgICAgICAgICAvLyBkaXNtaXNzIGFueXdheVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSxcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uQ2hlY2tNb2RWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoYXBpLmdldFN0YXRlKCkpO1xuICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQgfHwgZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xuXG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcbiAgICAvLyBOb3RoaW5nIHRvIHVwZGF0ZS5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBuZXdlc3RWZXI6IHN0cmluZyA9IGF3YWl0IGdpdEh1YkRvd25sb2FkZXIuY2hlY2tGb3JVcGRhdGVzKGFwaSwgbGF0ZXN0VmVyKTtcbiAgaWYgKCFuZXdlc3RWZXIgfHwgbmV3ZXN0VmVyID09PSBsYXRlc3RWZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gb25HYW1lTW9kZUFjdGl2YXRlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nKSB7XG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoKS5zYXZlKGFwaSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgYXdhaXQgbWlncmF0ZShhcGkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxuICAgICAgJ0ZhaWxlZCB0byBtaWdyYXRlJywgZXJyLCB7XG4gICAgICAgIC8vbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcbiAgaWYgKGxhdGVzdFZlciA9PT0gJzAuMC4wJykge1xuICAgIGF3YWl0IGdpdEh1YkRvd25sb2FkZXIuZG93bmxvYWREaXZpbmUoYXBpKTtcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICdiYWxkdXJzZ2F0ZTMnXSwgcmVkdWNlcik7XG5cbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBHQU1FX0lELFxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnMy5leGUnLFxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgIF0sXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczX2R4MTEuZXhlJyxcbiAgICBzZXR1cDogZGlzY292ZXJ5ID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcbiAgICBdLFxuICAgIGVudmlyb25tZW50OiB7XG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9JRCxcbiAgICAgIHN0b3BQYXR0ZXJuczogU1RPUF9QQVRURVJOUy5tYXAodG9Xb3JkRXhwKSxcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogSUdOT1JFX1BBVFRFUk5TLFxuICAgICAgaWdub3JlRGVwbG95OiBJR05PUkVfUEFUVEVSTlMsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgMzAwLCAnc2V0dGluZ3MnLCB7fSwgJ1JlLWluc3RhbGwgTFNMaWIvRGl2aW5lJywgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cbiAgICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICAgIGNvbnN0IGxzbGlicyA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihtb2QgPT4gbW9kc1ttb2RdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKTtcbiAgICBjb250ZXh0LmFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZHMnLCBHQU1FX0lELCBsc2xpYnMsIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIgIT09IG51bGwpIHtcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVpbnN0YWxsIGxzbGliJyxcbiAgICAgICAgICAnUGxlYXNlIHJlLWluc3RhbGwgbWFudWFsbHknLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZ2l0SHViRG93bmxvYWRlci5kb3dubG9hZERpdmluZShjb250ZXh0LmFwaSk7XG4gICAgfSk7XG4gIH0sICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gZ2FtZU1vZGUgPT09IEdBTUVfSUQ7XG4gIH0pOyAgXG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIHRlc3RMU0xpYiBhcyBhbnksIGluc3RhbGxMU0xpYiBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtYmczc2UnLCAxNSwgdGVzdEJHM1NFIGFzIGFueSwgaW5zdGFsbEJHM1NFIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1lbmdpbmUtaW5qZWN0b3InLCAyMCwgdGVzdEVuZ2luZUluamVjdG9yIGFzIGFueSwgaW5zdGFsbEVuZ2luZUluamVjdG9yIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1yZXBsYWNlcicsIDI1LCB0ZXN0UmVwbGFjZXIgYXMgYW55LCBpbnN0YWxsUmVwbGFjZXIgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLW1vZGZpeGVyJywgMjUsIHRlc3RNb2RGaXhlciBhcyBhbnksIGluc3RhbGxNb2RGaXhlciBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xTTElCLCAxNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IHVuZGVmaW5lZCwgXG4gICAgaXNMU0xpYiBhcyBhbnksXG4gICAgeyBuYW1lOiAnQkczIExTTGliJywgbm9Db25mbGljdHM6IHRydWUgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfQkczU0UsIDE1LCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKCkgPT4gcGF0aC5qb2luKGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSwgJ2JpbicpLCBcbiAgICBpc0JHM1NFIGFzIGFueSxcbiAgICB7IG5hbWU6ICdCRzMgQkczU0UnIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xPT1NFLCAyMCwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxuICAgIGlzTG9vc2UgYXMgYW55LFxuICAgIHsgbmFtZTogJ0JHMyBMb29zZScgfSBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX1JFUExBQ0VSLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxuICAgIGluc3RydWN0aW9ucyA9PiBpc1JlcGxhY2VyKGNvbnRleHQuYXBpLCBpbnN0cnVjdGlvbnMpIGFzIGFueSxcbiAgICB7IG5hbWU6ICdCRzMgUmVwbGFjZXInIH0gYXMgYW55KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcbiAgICBjbGVhclN0YXRlT25QdXJnZTogZmFsc2UsXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZShjb250ZXh0KSxcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIsIHByZXYpID0+IHNlcmlhbGl6ZShjb250ZXh0LCBsb2FkT3JkZXIpLFxuICAgIHZhbGlkYXRlLFxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiBmYWxzZSxcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+IChcbiAgICAgIDxJbmZvUGFuZWxXcmFwXG4gICAgICAgIGFwaT17Y29udGV4dC5hcGl9XG4gICAgICAgIGdldE93bkdhbWVWZXJzaW9uPXtnZXRPd25HYW1lVmVyc2lvbn1cbiAgICAgICAgcmVhZFN0b3JlZExPPXtyZWFkU3RvcmVkTE99XG4gICAgICAgIGluc3RhbGxMU0xpYj17b25HYW1lTW9kZUFjdGl2YXRlZH1cbiAgICAgICAgZ2V0TGF0ZXN0TFNMaWJNb2Q9e2dldExhdGVzdExTTGliTW9kfVxuICAgICAgLz4pXG4gICAgKSBhcyBhbnksXG4gIH0pO1xuXG4gIGNvbnN0IGlzQkczID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XG4gIH07XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MCwgJ2NoYW5nZWxvZycsIHt9LCAnRXhwb3J0IHRvIEdhbWUnLCAoKSA9PiB7IGV4cG9ydFRvR2FtZShjb250ZXh0LmFwaSk7IH0sIGlzQkczKTtcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MSwgJ2NoYW5nZWxvZycsIHt9LCAnRXhwb3J0IHRvIEZpbGUuLi4nLCAoKSA9PiB7IGV4cG9ydFRvRmlsZShjb250ZXh0LmFwaSk7IH0sIGlzQkczKTtcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE2MCwgJ2ltcG9ydCcsIHt9LCAnSW1wb3J0IGZyb20gR2FtZScsICgpID0+IHsgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGNvbnRleHQuYXBpKTsgfSwgaXNCRzMpO1xuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTYxLCAnaW1wb3J0Jywge30sICdJbXBvcnQgZnJvbSBGaWxlLi4uJywgKCkgPT4geyBcbiAgICBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUoY29udGV4dC5hcGkpOyBcbiAgfSwgaXNCRzMpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzLCB1bmRlZmluZWQsIGlzQkczLCAxNTApO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29udGV4dC5hcGkub25TdGF0ZUNoYW5nZShbJ3Nlc3Npb24nLCAnYmFzZScsICd0b29sc1J1bm5pbmcnXSxcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xuICAgICAgICAvLyB3aGVuIGEgdG9vbCBleGl0cywgcmUtcmVhZCB0aGUgbG9hZCBvcmRlciBmcm9tIGRpc2sgYXMgaXQgbWF5IGhhdmUgYmVlblxuICAgICAgICAvLyBjaGFuZ2VkXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcbiAgICAgICAgaWYgKChnYW1lTW9kZSA9PT0gR0FNRV9JRCkgJiYgKE9iamVjdC5rZXlzKGN1cnJlbnQpLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudCkgPT4ge1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpLCBwcm9maWxlSWQpO1xuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCA9PT0gR0FNRV9JRCkge1xuICAgICAgICBmb3JjZVJlZnJlc2goY29udGV4dC5hcGkpO1xuICAgICAgfVxuICAgICAgYXdhaXQgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKCkuc2F2ZShjb250ZXh0LmFwaSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2NoZWNrLW1vZHMtdmVyc2lvbicsXG4gICAgICAoZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkgPT4gb25DaGVja01vZFZlcnNpb24oY29udGV4dC5hcGksIGdhbWVJZCwgbW9kcykpO1xuXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxuICAgICAgYXN5bmMgKGdhbWVNb2RlOiBzdHJpbmcpID0+IG9uR2FtZU1vZGVBY3RpdmF0ZWQoY29udGV4dC5hcGksIGdhbWVNb2RlKSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19