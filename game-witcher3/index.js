"use strict";
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
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const winapi_bindings_1 = __importDefault(require("winapi-bindings"));
const migrations_1 = require("./migrations");
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./views/CollectionsDataView"));
const scriptmerger_1 = require("./scriptmerger");
const common_1 = require("./common");
const modTypes_1 = require("./modTypes");
const mergers_1 = require("./mergers");
const iconbarActions_1 = require("./iconbarActions");
const priorityManager_1 = require("./priorityManager");
const installers_1 = require("./installers");
const reducers_1 = require("./reducers");
const util_1 = require("./util");
const loadOrder_1 = __importDefault(require("./loadOrder"));
const eventHandlers_1 = require("./eventHandlers");
const iniParser_1 = __importDefault(require("./iniParser"));
const GOG_ID = '1207664663';
const GOG_ID_GOTY = '1495134320';
const GOG_WH_ID = '1207664643';
const GOG_WH_GOTY = '1640424747';
const STEAM_ID = '499450';
const STEAM_ID_WH = '292030';
const EPIC_ID = '725a22e15ed74735bb0d6a19f3cc82d0';
const tools = [
    {
        id: common_1.SCRIPT_MERGER_ID,
        name: 'W3 Script Merger',
        logo: 'WitcherScriptMerger.jpg',
        executable: () => 'WitcherScriptMerger.exe',
        requiredFiles: [
            'WitcherScriptMerger.exe',
        ],
    },
    {
        id: common_1.GAME_ID + '_DX11',
        name: 'The Witcher 3 (DX11)',
        logo: 'auto',
        relative: true,
        executable: () => 'bin/x64/witcher3.exe',
        requiredFiles: [
            'bin/x64/witcher3.exe',
        ],
    },
    {
        id: common_1.GAME_ID + '_DX12',
        name: 'The Witcher 3 (DX12)',
        logo: 'auto',
        relative: true,
        executable: () => 'bin/x64_DX12/witcher3.exe',
        requiredFiles: [
            'bin/x64_DX12/witcher3.exe',
        ],
    },
];
function findGame() {
    try {
        const instPath = winapi_bindings_1.default.RegGetValue('HKEY_LOCAL_MACHINE', 'Software\\CD Project Red\\The Witcher 3', 'InstallFolder');
        if (!instPath) {
            throw new Error('empty registry key');
        }
        return bluebird_1.default.resolve(instPath.value);
    }
    catch (err) {
        return vortex_api_1.util.GameStoreHelper.findByAppId([
            GOG_ID_GOTY, GOG_ID, GOG_WH_ID, GOG_WH_GOTY,
            STEAM_ID, STEAM_ID_WH, EPIC_ID
        ])
            .then(game => game.gamePath);
    }
}
function prepareForModding(api) {
    return (discovery) => {
        const findScriptMerger = (error) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            (0, vortex_api_1.log)('error', 'failed to download/install script merger', error);
            const scriptMergerPath = yield (0, scriptmerger_1.getScriptMergerDir)(api);
            if (scriptMergerPath === undefined) {
                (0, util_1.notifyMissingScriptMerger)(api);
                return Promise.resolve();
            }
            else {
                if (((_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger) === undefined) {
                    return (0, scriptmerger_1.setMergerConfig)(discovery.path, scriptMergerPath);
                }
            }
        });
        const ensurePath = (dirpath) => vortex_api_1.fs.ensureDirWritableAsync(dirpath)
            .catch(err => (err.code === 'EEXIST')
            ? Promise.resolve()
            : Promise.reject(err));
        return Promise.all([
            ensurePath(path_1.default.join(discovery.path, 'Mods')),
            ensurePath(path_1.default.join(discovery.path, 'DLC')),
            ensurePath(path_1.default.dirname((0, common_1.getLoadOrderFilePath)()))
        ])
            .then(() => (0, scriptmerger_1.downloadScriptMerger)(api)
            .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
            ? Promise.resolve()
            : findScriptMerger(err)));
    };
}
let loadOrder;
let priorityManager;
const getPriorityManager = () => priorityManager;
function main(context) {
    context.registerReducer(['settings', 'witcher3'], reducers_1.W3Reducer);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'The Witcher 3',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => 'Mods',
        logo: 'gameart.jpg',
        executable: util_1.determineExecutable,
        setup: prepareForModding(context.api),
        supportedTools: tools,
        requiresCleanup: true,
        requiredFiles: [
            'bin/x64/witcher3.exe',
        ],
        environment: {
            SteamAPPId: '292030',
        },
        details: {
            steamAppId: 292030,
            ignoreConflicts: common_1.DO_NOT_DEPLOY,
            ignoreDeploy: common_1.DO_NOT_DEPLOY,
        },
    });
    context.registerInstaller('scriptmergerdummy', 15, installers_1.scriptMergerTest, installers_1.scriptMergerDummyInstaller);
    context.registerInstaller('witcher3menumodroot', 20, installers_1.testMenuModRoot, installers_1.installMenuMod);
    context.registerInstaller('witcher3mixed', 25, installers_1.testSupportedMixed, installers_1.installMixed);
    context.registerInstaller('witcher3tl', 30, installers_1.testSupportedTL, installers_1.installTL);
    context.registerInstaller('witcher3content', 50, installers_1.testSupportedContent, installers_1.installContent);
    context.registerInstaller('witcher3dlcmod', 60, installers_1.testDLCMod, installers_1.installDLCMod);
    context.registerModType('witcher3menumodroot', 20, (0, util_1.isTW3)(context.api), (0, util_1.getTLPath)(context.api), installers_1.testMenuModRoot);
    context.registerModType('witcher3tl', 25, (0, util_1.isTW3)(context.api), (0, util_1.getTLPath)(context.api), modTypes_1.testTL);
    context.registerModType('witcher3dlc', 25, (0, util_1.isTW3)(context.api), (0, util_1.getDLCPath)(context.api), modTypes_1.testDLC);
    context.registerModType('w3modlimitpatcher', 25, (0, util_1.isTW3)(context.api), (0, util_1.getTLPath)(context.api), () => bluebird_1.default.resolve(false), { deploymentEssential: false, name: 'Mod Limit Patcher Mod Type' });
    context.registerModType('witcher3menumoddocuments', 60, (0, util_1.isTW3)(context.api), util_1.getDocumentsPath, () => bluebird_1.default.resolve(false));
    context.registerMerge((0, mergers_1.canMergeXML)(context.api), (0, mergers_1.doMergeXML)(context.api), 'witcher3menumodroot');
    context.registerMigration((oldVersion) => (0, migrations_1.migrate148)(context, oldVersion));
    (0, iconbarActions_1.registerActions)({ context, getPriorityManager });
    context.optional.registerCollectionFeature('witcher3_collection_data', (gameId, includedMods, collection) => (0, collections_1.genCollectionsData)(context, gameId, includedMods, collection), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Witcher 3 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
    context.registerProfileFeature('local_merges', 'boolean', 'settings', 'Profile Data', 'This profile will store and restore profile specific data (merged scripts, loadorder, etc) when switching profiles', () => {
        const activeGameId = vortex_api_1.selectors.activeGameId(context.api.getState());
        return activeGameId === common_1.GAME_ID;
    });
    const toggleModsState = (enabled) => __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(context.api);
        const modMap = yield (0, util_1.getAllMods)(context.api);
        const manualLocked = modMap.manual.filter(modName => modName.startsWith(common_1.LOCKED_PREFIX));
        const totalLocked = [].concat(modMap.merged, manualLocked);
        const newLO = loadOrder.reduce((accum, key, idx) => {
            if (totalLocked.includes(key)) {
                accum.push(loadOrder[idx]);
            }
            else {
                accum.push(Object.assign(Object.assign({}, loadOrder[idx]), { enabled }));
            }
            return accum;
        }, []);
        context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(profile.id, newLO));
    });
    const props = {
        onToggleModsState: toggleModsState,
        api: context.api,
        getPriorityManager,
    };
    context.registerLoadOrder(new loadOrder_1.default(props));
    context.once(() => {
        priorityManager = new priorityManager_1.PriorityManager(context.api, 'prefix-based');
        iniParser_1.default.getInstance(context.api, getPriorityManager);
        loadOrder = new loadOrder_1.default({
            api: context.api,
            getPriorityManager,
            onToggleModsState: toggleModsState
        });
        context.api.events.on('gamemode-activated', (0, eventHandlers_1.onGameModeActivation)(context.api));
        context.api.events.on('profile-will-change', (0, eventHandlers_1.onProfileWillChange)(context.api));
        context.api.events.on('mods-enabled', (0, eventHandlers_1.onModsDisabled)(context.api, getPriorityManager));
        context.api.onAsync('will-deploy', (0, eventHandlers_1.onWillDeploy)(context.api));
        context.api.onAsync('did-deploy', (0, eventHandlers_1.onDidDeploy)(context.api));
        context.api.onAsync('did-purge', (0, eventHandlers_1.onDidPurge)(context.api, getPriorityManager));
        context.api.onAsync('did-remove-mod', (0, eventHandlers_1.onDidRemoveMod)(context.api, getPriorityManager));
        context.api.onStateChange(['settings', 'witcher3'], (0, eventHandlers_1.onSettingsChange)(context.api, getPriorityManager));
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQXNFO0FBQ3RFLHNFQUFxQztBQUVyQyw2Q0FBa0U7QUFFbEUsMkRBQXFGO0FBRXJGLHNGQUE4RDtBQUU5RCxpREFBMkY7QUFFM0YscUNBRWtCO0FBRWxCLHlDQUE2QztBQUM3Qyx1Q0FBdUY7QUFFdkYscURBQW1EO0FBQ25ELHVEQUFvRDtBQUVwRCw2Q0FFd0U7QUFFeEUseUNBQXVDO0FBRXZDLGlDQUM4RDtBQUM5RCw0REFBdUM7QUFHdkMsbURBQytFO0FBQy9FLDREQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxrQ0FBa0MsQ0FBQztBQUVuRCxNQUFNLEtBQUssR0FBa0I7SUFDM0I7UUFDRSxFQUFFLEVBQUUseUJBQWdCO1FBQ3BCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHlCQUF5QjtRQUMvQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMseUJBQXlCO1FBQzNDLGFBQWEsRUFBRTtZQUNiLHlCQUF5QjtTQUMxQjtLQUNGO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsZ0JBQU8sR0FBRyxPQUFPO1FBQ3JCLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsSUFBSSxFQUFFLE1BQU07UUFDWixRQUFRLEVBQUUsSUFBSTtRQUNkLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBc0I7UUFDeEMsYUFBYSxFQUFFO1lB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QUFNLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLElBQUEsbUNBQW1CLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxJQUFBLDhCQUFjLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFFdkYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFRLENBQUMsQ0FBQztRQUNyRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsSUFBQSwyQkFBVyxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQVEsQ0FBQyxDQUFDO1FBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFBLDBCQUFVLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsQ0FBUSxDQUFDLENBQUM7UUFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsSUFBQSw4QkFBYyxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQVEsQ0FBQyxDQUFDO1FBRTlGLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFLElBQUEsZ0NBQWdCLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsQ0FBUSxDQUFDLENBQUM7SUFDaEgsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5cclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciwgbWlncmF0ZTE0OCB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XHJcbmltcG9ydCB7IElXM0NvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5cclxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIsIGdldFNjcmlwdE1lcmdlckRpciwgc2V0TWVyZ2VyQ29uZmlnIH0gZnJvbSAnLi9zY3JpcHRtZXJnZXInO1xyXG5cclxuaW1wb3J0IHsgRE9fTk9UX0RFUExPWSwgR0FNRV9JRCwgZ2V0TG9hZE9yZGVyRmlsZVBhdGgsXHJcbiAgTE9DS0VEX1BSRUZJWCwgU0NSSVBUX01FUkdFUl9JRFxyXG59IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IHRlc3RETEMsIHRlc3RUTCB9IGZyb20gJy4vbW9kVHlwZXMnO1xyXG5pbXBvcnQgeyBjYW5NZXJnZVhNTCwgZG9NZXJnZVhNTCwgY2FuTWVyZ2VTZXR0aW5ncywgZG9NZXJnZVNldHRpbmdzIH0gZnJvbSAnLi9tZXJnZXJzJztcclxuXHJcbmltcG9ydCB7IHJlZ2lzdGVyQWN0aW9ucyB9IGZyb20gJy4vaWNvbmJhckFjdGlvbnMnO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcblxyXG5pbXBvcnQgeyBpbnN0YWxsQ29udGVudCwgaW5zdGFsbE1lbnVNb2QsIGluc3RhbGxUTCwgaW5zdGFsbERMQ01vZCwgaW5zdGFsbE1peGVkLFxyXG4gIHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyLCBzY3JpcHRNZXJnZXJUZXN0LCB0ZXN0TWVudU1vZFJvb3QsIHRlc3RTdXBwb3J0ZWRDb250ZW50LFxyXG4gIHRlc3RTdXBwb3J0ZWRUTCwgdGVzdFN1cHBvcnRlZE1peGVkLCB0ZXN0RExDTW9kIH0gZnJvbSAnLi9pbnN0YWxsZXJzJztcclxuXHJcbmltcG9ydCB7IFczUmVkdWNlciB9IGZyb20gJy4vcmVkdWNlcnMnO1xyXG5cclxuaW1wb3J0IHsgZ2V0RExDUGF0aCwgZ2V0QWxsTW9kcywgZGV0ZXJtaW5lRXhlY3V0YWJsZSwgZ2V0RG9jdW1lbnRzUGF0aCxcclxuICBnZXRUTFBhdGgsIGlzVFczLCBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IFRXM0xvYWRPcmRlciBmcm9tICcuL2xvYWRPcmRlcic7XHJcblxyXG5cclxuaW1wb3J0IHsgb25EaWREZXBsb3ksIG9uRGlkUHVyZ2UsIG9uRGlkUmVtb3ZlTW9kLCBvbkdhbWVNb2RlQWN0aXZhdGlvbiwgb25Nb2RzRGlzYWJsZWQsXHJcbiAgb25Qcm9maWxlV2lsbENoYW5nZSwgb25TZXR0aW5nc0NoYW5nZSwgb25XaWxsRGVwbG95IH0gZnJvbSAnLi9ldmVudEhhbmRsZXJzJztcclxuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTIwNzY2NDY2Myc7XHJcbmNvbnN0IEdPR19JRF9HT1RZID0gJzE0OTUxMzQzMjAnO1xyXG5jb25zdCBHT0dfV0hfSUQgPSAnMTIwNzY2NDY0Myc7XHJcbmNvbnN0IEdPR19XSF9HT1RZID0gJzE2NDA0MjQ3NDcnO1xyXG5jb25zdCBTVEVBTV9JRCA9ICc0OTk0NTAnO1xyXG5jb25zdCBTVEVBTV9JRF9XSCA9ICcyOTIwMzAnO1xyXG5jb25zdCBFUElDX0lEID0gJzcyNWEyMmUxNWVkNzQ3MzViYjBkNmExOWYzY2M4MmQwJztcclxuXHJcbmNvbnN0IHRvb2xzOiB0eXBlcy5JVG9vbFtdID0gW1xyXG4gIHtcclxuICAgIGlkOiBTQ1JJUFRfTUVSR0VSX0lELFxyXG4gICAgbmFtZTogJ1czIFNjcmlwdCBNZXJnZXInLFxyXG4gICAgbG9nbzogJ1dpdGNoZXJTY3JpcHRNZXJnZXIuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaWQ6IEdBTUVfSUQgKyAnX0RYMTEnLFxyXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMgKERYMTEpJyxcclxuICAgIGxvZ286ICdhdXRvJyxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogR0FNRV9JRCArICdfRFgxMicsXHJcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMyAoRFgxMiknLFxyXG4gICAgbG9nbzogJ2F1dG8nLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4veDY0X0RYMTIvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuXTtcclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShcclxuICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXHJcbiAgICAgICdTb2Z0d2FyZVxcXFxDRCBQcm9qZWN0IFJlZFxcXFxUaGUgV2l0Y2hlciAzJyxcclxuICAgICAgJ0luc3RhbGxGb2xkZXInKTtcclxuICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcclxuICAgIH1cclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGluc3RQYXRoLnZhbHVlIGFzIHN0cmluZyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1xyXG4gICAgICBHT0dfSURfR09UWSwgR09HX0lELCBHT0dfV0hfSUQsIEdPR19XSF9HT1RZLFxyXG4gICAgICBTVEVBTV9JRCwgU1RFQU1fSURfV0gsIEVQSUNfSURcclxuICAgIF0pXHJcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICByZXR1cm4gKGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkgPT4ge1xyXG4gICAgY29uc3QgZmluZFNjcmlwdE1lcmdlciA9IGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBkb3dubG9hZC9pbnN0YWxsIHNjcmlwdCBtZXJnZXInLCBlcnJvcik7XHJcbiAgICAgIGNvbnN0IHNjcmlwdE1lcmdlclBhdGggPSBhd2FpdCBnZXRTY3JpcHRNZXJnZXJEaXIoYXBpKTtcclxuICAgICAgaWYgKHNjcmlwdE1lcmdlclBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBzZXRNZXJnZXJDb25maWcoZGlzY292ZXJ5LnBhdGgsIHNjcmlwdE1lcmdlclBhdGgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIGNvbnN0IGVuc3VyZVBhdGggPSAoZGlycGF0aCkgPT5cclxuICAgICAgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhkaXJwYXRoKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRUVYSVNUJylcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgICBlbnN1cmVQYXRoKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSksXHJcbiAgICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJykpLFxyXG4gICAgICBlbnN1cmVQYXRoKHBhdGguZGlybmFtZShnZXRMb2FkT3JkZXJGaWxlUGF0aCgpKSldKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGFwaSlcclxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxyXG4gICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICAgIDogZmluZFNjcmlwdE1lcmdlcihlcnIpKSk7XHJcbiAgfVxyXG59XHJcblxyXG5sZXQgbG9hZE9yZGVyOiBUVzNMb2FkT3JkZXI7XHJcbmxldCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuY29uc3QgZ2V0UHJpb3JpdHlNYW5hZ2VyID0gKCkgPT4gcHJpb3JpdHlNYW5hZ2VyO1xyXG4vLyBsZXQgbW9kTGltaXRQYXRjaGVyOiBNb2RMaW1pdFBhdGNoZXI7XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBXM1JlZHVjZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ01vZHMnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6IGRldGVybWluZUV4ZWN1dGFibGUsXHJcbiAgICBzZXR1cDogcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGkpIGFzIGFueSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMjkyMDMwJyxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IDI5MjAzMCxcclxuICAgICAgaWdub3JlQ29uZmxpY3RzOiBET19OT1RfREVQTE9ZLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzY3JpcHRtZXJnZXJkdW1teScsIDE1LCBzY3JpcHRNZXJnZXJUZXN0IGFzIGFueSwgc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsIHRlc3RNZW51TW9kUm9vdCBhcyBhbnksIGluc3RhbGxNZW51TW9kIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtaXhlZCcsIDI1LCB0ZXN0U3VwcG9ydGVkTWl4ZWQgYXMgYW55LCBpbnN0YWxsTWl4ZWQgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM3RsJywgMzAsIHRlc3RTdXBwb3J0ZWRUTCBhcyBhbnksIGluc3RhbGxUTCBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzY29udGVudCcsIDUwLCB0ZXN0U3VwcG9ydGVkQ29udGVudCBhcyBhbnksIGluc3RhbGxDb250ZW50IGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNkbGNtb2QnLCA2MCwgdGVzdERMQ01vZCBhcyBhbnksIGluc3RhbGxETENNb2QgYXMgYW55KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXRUTFBhdGgoY29udGV4dC5hcGkpLCB0ZXN0TWVudU1vZFJvb3QgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjN0bCcsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldFRMUGF0aChjb250ZXh0LmFwaSksIHRlc3RUTCBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM2RsYycsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldERMQ1BhdGgoY29udGV4dC5hcGkpLCB0ZXN0RExDIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3czbW9kbGltaXRwYXRjaGVyJywgMjUsIGlzVFczKGNvbnRleHQuYXBpKSwgZ2V0VExQYXRoKGNvbnRleHQuYXBpKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSksXHJcbiAgICB7IGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlLCBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXIgTW9kIFR5cGUnIH0pO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXREb2N1bWVudHNQYXRoLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNZXJnZShjYW5NZXJnZVhNTChjb250ZXh0LmFwaSksIGRvTWVyZ2VYTUwoY29udGV4dC5hcGkpIGFzIGFueSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcclxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTWVyZ2UoY2FuTWVyZ2VTZXR0aW5ncyhjb250ZXh0LmFwaSksIGRvTWVyZ2VTZXR0aW5ncyhjb250ZXh0LmFwaSkgYXMgYW55LCAnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24oKG9sZFZlcnNpb24pID0+IChtaWdyYXRlMTQ4KGNvbnRleHQsIG9sZFZlcnNpb24pIGFzIGFueSkpO1xyXG5cclxuICByZWdpc3RlckFjdGlvbnMoeyBjb250ZXh0LCBnZXRQcmlvcml0eU1hbmFnZXIgfSk7XHJcblxyXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcclxuICAgICd3aXRjaGVyM19jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLCBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdXaXRjaGVyIDMgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJQcm9maWxlRmVhdHVyZShcclxuICAgICdsb2NhbF9tZXJnZXMnLCAnYm9vbGVhbicsICdzZXR0aW5ncycsICdQcm9maWxlIERhdGEnLFxyXG4gICAgJ1RoaXMgcHJvZmlsZSB3aWxsIHN0b3JlIGFuZCByZXN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgZGF0YSAobWVyZ2VkIHNjcmlwdHMsIGxvYWRvcmRlciwgZXRjKSB3aGVuIHN3aXRjaGluZyBwcm9maWxlcycsXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgIHJldHVybiBhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQ7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgdG9nZ2xlTW9kc1N0YXRlID0gYXN5bmMgKGVuYWJsZWQpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIobW9kTmFtZSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkpO1xyXG4gICAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkKTtcclxuICAgIGNvbnN0IG5ld0xPID0gbG9hZE9yZGVyLnJlZHVjZSgoYWNjdW0sIGtleSwgaWR4KSA9PiB7XHJcbiAgICAgIGlmICh0b3RhbExvY2tlZC5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChsb2FkT3JkZXJbaWR4XSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgICAuLi5sb2FkT3JkZXJbaWR4XSxcclxuICAgICAgICAgIGVuYWJsZWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8gYXMgYW55KSk7XHJcbiAgfTtcclxuICBjb25zdCBwcm9wcyA9IHtcclxuICAgIG9uVG9nZ2xlTW9kc1N0YXRlOiB0b2dnbGVNb2RzU3RhdGUsXHJcbiAgICBhcGk6IGNvbnRleHQuYXBpLFxyXG4gICAgZ2V0UHJpb3JpdHlNYW5hZ2VyLFxyXG4gIH1cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKG5ldyBUVzNMb2FkT3JkZXIocHJvcHMpKTtcclxuICAvLyBjb250ZXh0LnJlZ2lzdGVyVGVzdCgndHczLW1vZC1saW1pdC1icmVhY2gnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAvLyAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XHJcbiAgLy8gY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ21vZC1hY3RpdmF0ZWQnLFxyXG4gIC8vICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIHByaW9yaXR5TWFuYWdlciA9IG5ldyBQcmlvcml0eU1hbmFnZXIoY29udGV4dC5hcGksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZShjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKTtcclxuICAgIC8vIG1vZExpbWl0UGF0Y2hlciA9IG5ldyBNb2RMaW1pdFBhdGNoZXIoY29udGV4dC5hcGkpO1xyXG4gICAgbG9hZE9yZGVyID0gbmV3IFRXM0xvYWRPcmRlcih7XHJcbiAgICAgIGFwaTogY29udGV4dC5hcGksXHJcbiAgICAgIGdldFByaW9yaXR5TWFuYWdlcixcclxuICAgICAgb25Ub2dnbGVNb2RzU3RhdGU6IHRvZ2dsZU1vZHNTdGF0ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCBvbkdhbWVNb2RlQWN0aXZhdGlvbihjb250ZXh0LmFwaSkpO1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdwcm9maWxlLXdpbGwtY2hhbmdlJywgb25Qcm9maWxlV2lsbENoYW5nZShjb250ZXh0LmFwaSkpO1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdtb2RzLWVuYWJsZWQnLCBvbk1vZHNEaXNhYmxlZChjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnd2lsbC1kZXBsb3knLCBvbldpbGxEZXBsb3koY29udGV4dC5hcGkpIGFzIGFueSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95Jywgb25EaWREZXBsb3koY29udGV4dC5hcGkpIGFzIGFueSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBvbkRpZFB1cmdlKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpIGFzIGFueSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcmVtb3ZlLW1vZCcsIG9uRGlkUmVtb3ZlTW9kKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpIGFzIGFueSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25TdGF0ZUNoYW5nZShbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJ10sIG9uU2V0dGluZ3NDaGFuZ2UoY29udGV4dC5hcGksIGdldFByaW9yaXR5TWFuYWdlcikgYXMgYW55KTtcclxuICB9KTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19