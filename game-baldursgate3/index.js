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
            cache_1.default.getInstance(api).save();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVBLHdEQUFnQztBQUVoQywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLDJDQUF3RDtBQUV4RCxxQ0FHa0I7QUFDbEIscUVBQXVEO0FBQ3ZELDBEQUFrQztBQUNsQywwREFBaUM7QUFDakMsNkNBQXVDO0FBRXZDLGlDQUlnQjtBQUVoQiw2Q0FHc0I7QUFFdEIseUNBRW9CO0FBRXBCLDJDQUdxQjtBQUVyQiwyQ0FBMkM7QUFDM0Msb0RBQW1DO0FBRW5DLE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUUzQixTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBZSxtQkFBbUIsQ0FBQyxHQUF3QixFQUFFLFNBQWlDOztRQUM1RixJQUFJLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLEVBQUU7WUFDbkIsTUFBTSxXQUFXLEdBQUcsSUFBQSx3QkFBaUIsR0FBRSxDQUFDO1lBQ3hDLElBQUk7Z0JBQ0YsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FB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SUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuLyoqXHJcbiAqIEltcG9ydGFudCAtIGFsdGhvdWdoIHdlIG5vIGxvbmdlciBkZWZpbmUgdGhlIGluZm8gcGFuZWwgaGVyZSxcclxuICogIHdlIHN0aWxsIG5lZWQgdG8ga2VlcCB0aGUgaW5kZXggZmlsZSdzICcudHN4JyBleHRlbnNpb24uXHJcbiAqICBBdCBsZWFzdCB3aGlsZSBvdXIgdXBkYXRlIHByb2Nlc3MgZm9yIGJ1bmRsZWQgcGx1Z2lucyByZW1haW5zXHJcbiAqICB0aHJvdWdoIHRoZSAncmVsZWFzZScgYnJhbmNoLlxyXG4gKiBcclxuICogUmVtb3ZpbmcgZmlsZXMgZnJvbSBidW5kbGVkIHBsdWdpbnMgd2l0aG91dCBzdHViYmluZyB0aGUgZXh0ZW5zaW9uXHJcbiAqICBjYW4gcG90ZW50aWFsbHkgYnJlYWsgdGhlIGV4dGVuc2lvbiBvbiB0aGUgdXNlcidzIGVuZC5cclxuICovXHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHtcclxuICBERUZBVUxUX01PRF9TRVRUSU5HUywgR0FNRV9JRCwgSUdOT1JFX1BBVFRFUk5TLFxyXG4gIE1PRF9UWVBFX0JHM1NFLCBNT0RfVFlQRV9MT09TRSwgTU9EX1RZUEVfTFNMSUIsIE1PRF9UWVBFX1JFUExBQ0VSLFxyXG59IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xyXG5pbXBvcnQgU2V0dGluZ3MgZnJvbSAnLi9TZXR0aW5ncyc7XHJcbmltcG9ydCByZWR1Y2VyIGZyb20gJy4vcmVkdWNlcnMnO1xyXG5pbXBvcnQgeyBtaWdyYXRlIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCB7XHJcbiAgbG9nRGVidWcsIGZvcmNlUmVmcmVzaCwgZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIsXHJcbiAgZ2V0R2FtZURhdGFQYXRoLCBnZXRHYW1lUGF0aCwgZ2xvYmFsUHJvZmlsZVBhdGgsIG1vZHNQYXRoLFxyXG4gIGdldExhdGVzdExTTGliTW9kLCBnZXRPd25HYW1lVmVyc2lvbiwgcmVhZFN0b3JlZExPLFxyXG59IGZyb20gJy4vdXRpbCc7XHJcblxyXG5pbXBvcnQge1xyXG4gIHRlc3RMU0xpYiwgdGVzdEJHM1NFLCB0ZXN0RW5naW5lSW5qZWN0b3IsIHRlc3RNb2RGaXhlciwgdGVzdFJlcGxhY2VyLFxyXG4gIGluc3RhbGxMU0xpYiwgaW5zdGFsbEJHM1NFLCBpbnN0YWxsRW5naW5lSW5qZWN0b3IsIGluc3RhbGxNb2RGaXhlciwgaW5zdGFsbFJlcGxhY2VyLFxyXG59IGZyb20gJy4vaW5zdGFsbGVycyc7XHJcblxyXG5pbXBvcnQge1xyXG4gIGlzQkczU0UsIGlzTFNMaWIsIGlzTG9vc2UsIGlzUmVwbGFjZXIsXHJcbn0gZnJvbSAnLi9tb2RUeXBlcyc7XHJcblxyXG5pbXBvcnQge1xyXG4gIGRlc2VyaWFsaXplLCBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUsIGltcG9ydE1vZFNldHRpbmdzR2FtZSxcclxuICBpbXBvcnRGcm9tQkczTU0sIHNlcmlhbGl6ZSwgZXhwb3J0VG9HYW1lLCBleHBvcnRUb0ZpbGUsIHZhbGlkYXRlLFxyXG59IGZyb20gJy4vbG9hZE9yZGVyJztcclxuXHJcbmltcG9ydCB7IEluZm9QYW5lbFdyYXAgfSBmcm9tICcuL0luZm9QYW5lbCdcclxuaW1wb3J0IFBha0luZm9DYWNoZSBmcm9tICcuL2NhY2hlJztcclxuXHJcbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTQ1NjQ2MDY2OSc7XHJcbmNvbnN0IFNURUFNX0lEID0gJzEwODY5NDAnO1xyXG5cclxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XHJcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IGFueSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtHT0dfSUQsIFNURUFNX0lEXSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICBjb25zdCBwcm9maWxlUGF0aCA9IGdsb2JhbFByb2ZpbGVQYXRoKCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHByb2ZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgbW9kU2V0dGluZ3NGaWxlUGF0aCA9IHBhdGguam9pbihwcm9maWxlUGF0aCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCwgREVGQVVMVF9NT0RfU0VUVElOR1MsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpOiBhbnkge1xyXG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTsgIFxyXG5cclxuICBzaG93RnVsbFJlbGVhc2VNb2RGaXhlclJlY29tbWVuZGF0aW9uKGFwaSk7IFxyXG5cclxuICAvKlxyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiAnYmczLXVzZXMtbHNsaWInLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgdGl0bGU6ICdCRzMgc3VwcG9ydCB1c2VzIExTTGliJyxcclxuICAgIG1lc3NhZ2U6IExTTElCX1VSTCxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHsgdGl0bGU6ICdWaXNpdCBQYWdlJywgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbihMU0xJQl9VUkwpLmNhdGNoKCgpID0+IG51bGwpIH0sXHJcbiAgICBdLFxyXG4gIH0pOyovXHJcbiAgXHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcclxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkgYXMgYW55KSlcclxuICAgIC5maW5hbGx5KCgpID0+IGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpLCBkaXNjb3ZlcnkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAvLyBjaGVjayB0byBzZWUgaWYgbW9kIGlzIGluc3RhbGxlZCBmaXJzdD9cclxuICBjb25zdCBtb2RzID0gYXBpLnN0b3JlLmdldFN0YXRlKCkucGVyc2lzdGVudD8ubW9kcz8uYmFsZHVyc2dhdGUzO1xyXG4gIGlmKG1vZHMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3QgbW9kQXJyYXk6IHR5cGVzLklNb2RbXSA9IG1vZHMgPyBPYmplY3QudmFsdWVzKG1vZHMpIDogW107XHJcbiAgICBsb2dEZWJ1ZygnbW9kQXJyYXknLCBtb2RBcnJheSk7XHJcbiAgXHJcbiAgICBjb25zdCBtb2RGaXhlckluc3RhbGxlZDpib29sZWFuID0gIG1vZEFycmF5LmZpbHRlcihtb2QgPT4gISFtb2Q/LmF0dHJpYnV0ZXM/Lm1vZEZpeGVyKS5sZW5ndGggIT0gMDsgIFxyXG4gICAgbG9nRGVidWcoJ21vZEZpeGVySW5zdGFsbGVkJywgbW9kRml4ZXJJbnN0YWxsZWQpO1xyXG5cclxuICAgIC8vIGlmIHdlJ3ZlIGZvdW5kIGFuIGluc3RhbGxlZCBtb2RmaXhlciwgdGhlbiBkb24ndCBib3RoZXIgc2hvd2luZyBub3RpZmljYXRpb24gXHJcbiAgICBpZihtb2RGaXhlckluc3RhbGxlZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBubyBtb2RzIGZvdW5kXHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgdGl0bGU6ICdSZWNvbW1lbmRlZCBNb2QnLFxyXG4gICAgbWVzc2FnZTogJ01vc3QgbW9kcyByZXF1aXJlIHRoaXMgbW9kLicsXHJcbiAgICBpZDogJ2JnMy1yZWNvbW1lbmRlZC1tb2QnLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTW9yZScsIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnUmVjb21tZW5kZWQgTW9kcycsIHtcclxuICAgICAgICAgICAgdGV4dDpcclxuICAgICAgICAgICAgICAnV2UgcmVjb21tZW5kIGluc3RhbGxpbmcgXCJCYWxkdXJcXCdzIEdhdGUgMyBNb2QgRml4ZXJcIiB0byBiZSBhYmxlIHRvIG1vZCBCYWxkdXJcXCdzIEdhdGUgMy5cXG5cXG4nICsgXHJcbiAgICAgICAgICAgICAgJ1RoaXMgY2FuIGJlIGRvd25sb2FkZWQgZnJvbSBOZXh1cyBNb2RzIGFuZCBpbnN0YWxsZWQgdXNpbmcgVm9ydGV4IGJ5IHByZXNzaW5nIFwiT3BlbiBOZXh1cyBNb2RzJ1xyXG4gICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICB7IGxhYmVsOiAnRGlzbWlzcycgfSxcclxuICAgICAgICAgICAgeyBsYWJlbDogJ09wZW4gTmV4dXMgTW9kcycsIGRlZmF1bHQ6IHRydWUgfSxcclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnT3BlbiBOZXh1cyBNb2RzJykge1xyXG4gICAgICAgICAgICAgICAgdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vYmFsZHVyc2dhdGUzL21vZHMvMTQxP3RhYj1kZXNjcmlwdGlvbicpLmNhdGNoKCgpID0+IG51bGwpXHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuYWN0aW9uID09PSAnQ2FuY2VsJykge1xyXG4gICAgICAgICAgICAgICAgLy8gZGlzbWlzcyBhbnl3YXlcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIF0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG9uQ2hlY2tNb2RWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuZ2V0U3RhdGUoKSk7XHJcbiAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xyXG5cclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICAvLyBOb3RoaW5nIHRvIHVwZGF0ZS5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG5ld2VzdFZlcjogc3RyaW5nID0gYXdhaXQgZ2l0SHViRG93bmxvYWRlci5jaGVja0ZvclVwZGF0ZXMoYXBpLCBsYXRlc3RWZXIpO1xyXG4gIGlmICghbmV3ZXN0VmVyIHx8IG5ld2VzdFZlciA9PT0gbGF0ZXN0VmVyKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcpIHtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoYXBpKS5zYXZlKCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBtaWdyYXRlKGFwaSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxyXG4gICAgICAnRmFpbGVkIHRvIG1pZ3JhdGUnLCBlcnIsIHtcclxuICAgICAgICAvL21lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XHJcbiAgICBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoYXBpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXHJcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcclxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XHJcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAnZXhldnVsa2FuJyxcclxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxyXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogbW9kc1BhdGgsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzNfZHgxMS5leGUnLFxyXG4gICAgc2V0dXA6IGRpc2NvdmVyeSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi9iZzNfZHgxMS5leGUnLFxyXG4gICAgXSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogSUdOT1JFX1BBVFRFUk5TLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IElHTk9SRV9QQVRURVJOUyxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDMwMCwgJ3NldHRpbmdzJywge30sICdSZS1pbnN0YWxsIExTTGliL0RpdmluZScsICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxyXG4gICAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IGxzbGlicyA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihtb2QgPT4gbW9kc1ttb2RdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kcycsIEdBTUVfSUQsIGxzbGlicywgKGVycikgPT4ge1xyXG4gICAgICBpZiAoZXJyICE9PSBudWxsKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVpbnN0YWxsIGxzbGliJyxcclxuICAgICAgICAgICdQbGVhc2UgcmUtaW5zdGFsbCBtYW51YWxseScsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGNvbnRleHQuYXBpKTtcclxuICAgIH0pO1xyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gZ2FtZU1vZGUgPT09IEdBTUVfSUQ7XHJcbiAgfSk7ICBcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIHRlc3RMU0xpYiBhcyBhbnksIGluc3RhbGxMU0xpYiBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1iZzNzZScsIDE1LCB0ZXN0QkczU0UgYXMgYW55LCBpbnN0YWxsQkczU0UgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtZW5naW5lLWluamVjdG9yJywgMjAsIHRlc3RFbmdpbmVJbmplY3RvciBhcyBhbnksIGluc3RhbGxFbmdpbmVJbmplY3RvciBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1yZXBsYWNlcicsIDI1LCB0ZXN0UmVwbGFjZXIgYXMgYW55LCBpbnN0YWxsUmVwbGFjZXIgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtbW9kZml4ZXInLCAyNSwgdGVzdE1vZEZpeGVyIGFzIGFueSwgaW5zdGFsbE1vZEZpeGVyIGFzIGFueSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xTTElCLCAxNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gdW5kZWZpbmVkLCBcclxuICAgIGlzTFNMaWIgYXMgYW55LFxyXG4gICAgeyBuYW1lOiAnQkczIExTTGliJywgbm9Db25mbGljdHM6IHRydWUgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0JHM1NFLCAxNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gcGF0aC5qb2luKGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSwgJ2JpbicpLCBcclxuICAgIGlzQkczU0UgYXMgYW55LFxyXG4gICAgeyBuYW1lOiAnQkczIEJHM1NFJyB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfTE9PU0UsIDIwLCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICAoKSA9PiBnZXRHYW1lRGF0YVBhdGgoY29udGV4dC5hcGkpLCBcclxuICAgIGlzTG9vc2UgYXMgYW55LFxyXG4gICAgeyBuYW1lOiAnQkczIExvb3NlJyB9IGFzIGFueSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX1JFUExBQ0VSLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgKCkgPT4gZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSwgXHJcbiAgICBpbnN0cnVjdGlvbnMgPT4gaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgaW5zdHJ1Y3Rpb25zKSBhcyBhbnksXHJcbiAgICB7IG5hbWU6ICdCRzMgUmVwbGFjZXInIH0gYXMgYW55KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XHJcbiAgICBjbGVhclN0YXRlT25QdXJnZTogZmFsc2UsXHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemUoY29udGV4dCksXHJcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIsIHByZXYpID0+IHNlcmlhbGl6ZShjb250ZXh0LCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+IChcclxuICAgICAgPEluZm9QYW5lbFdyYXBcclxuICAgICAgICBhcGk9e2NvbnRleHQuYXBpfVxyXG4gICAgICAgIGdldE93bkdhbWVWZXJzaW9uPXtnZXRPd25HYW1lVmVyc2lvbn1cclxuICAgICAgICByZWFkU3RvcmVkTE89e3JlYWRTdG9yZWRMT31cclxuICAgICAgICBpbnN0YWxsTFNMaWI9e29uR2FtZU1vZGVBY3RpdmF0ZWR9XHJcbiAgICAgICAgZ2V0TGF0ZXN0TFNMaWJNb2Q9e2dldExhdGVzdExTTGliTW9kfVxyXG4gICAgICAvPilcclxuICAgICkgYXMgYW55LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBpc0JHMyA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH07XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNTAsICdjaGFuZ2Vsb2cnLCB7fSwgJ0V4cG9ydCB0byBHYW1lJywgKCkgPT4geyBleHBvcnRUb0dhbWUoY29udGV4dC5hcGkpOyB9LCBpc0JHMyk7XHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MSwgJ2NoYW5nZWxvZycsIHt9LCAnRXhwb3J0IHRvIEZpbGUuLi4nLCAoKSA9PiB7IGV4cG9ydFRvRmlsZShjb250ZXh0LmFwaSk7IH0sIGlzQkczKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTYwLCAnaW1wb3J0Jywge30sICdJbXBvcnQgZnJvbSBHYW1lJywgKCkgPT4geyBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoY29udGV4dC5hcGkpOyB9LCBpc0JHMyk7XHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE2MSwgJ2ltcG9ydCcsIHt9LCAnSW1wb3J0IGZyb20gRmlsZS4uLicsICgpID0+IHsgXHJcbiAgICBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUoY29udGV4dC5hcGkpOyBcclxuICB9LCBpc0JHMyk7XHJcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE3MCwgJ2ltcG9ydCcsIHt9LCAnSW1wb3J0IGZyb20gQkczTU0uLi4nLCAoKSA9PiB7IGltcG9ydEZyb21CRzNNTShjb250ZXh0KTsgfSwgaXNCRzMpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyU2V0dGluZ3MoJ01vZHMnLCBTZXR0aW5ncywgdW5kZWZpbmVkLCBpc0JHMywgMTUwKTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXNzaW9uJywgJ2Jhc2UnLCAndG9vbHNSdW5uaW5nJ10sXHJcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIC8vIHdoZW4gYSB0b29sIGV4aXRzLCByZS1yZWFkIHRoZSBsb2FkIG9yZGVyIGZyb20gZGlzayBhcyBpdCBtYXkgaGF2ZSBiZWVuXHJcbiAgICAgICAgLy8gY2hhbmdlZFxyXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICBpZiAoKGdhbWVNb2RlID09PSBHQU1FX0lEKSAmJiAoT2JqZWN0LmtleXMoY3VycmVudCkubGVuZ3RoID09PSAwKSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCA9PT0gR0FNRV9JRCkge1xyXG4gICAgICAgIGZvcmNlUmVmcmVzaChjb250ZXh0LmFwaSk7XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGNvbnRleHQuYXBpKS5zYXZlKCk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignY2hlY2stbW9kcy12ZXJzaW9uJyxcclxuICAgICAgKGdhbWVJZDogc3RyaW5nLCBtb2RzOiB0eXBlcy5JTW9kW10pID0+IG9uQ2hlY2tNb2RWZXJzaW9uKGNvbnRleHQuYXBpLCBnYW1lSWQsIG1vZHMpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAgIGFzeW5jIChnYW1lTW9kZTogc3RyaW5nKSA9PiBvbkdhbWVNb2RlQWN0aXZhdGVkKGNvbnRleHQuYXBpLCBnYW1lTW9kZSkpO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcclxuIl19