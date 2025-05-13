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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQXNFO0FBQ3RFLHNFQUFxQztBQUVyQyw2Q0FBa0U7QUFFbEUsMkRBQXFGO0FBRXJGLHNGQUE4RDtBQUU5RCxpREFBMkY7QUFFM0YscUNBRWtCO0FBRWxCLHlDQUE2QztBQUM3Qyx1Q0FBdUY7QUFFdkYscURBQW1EO0FBQ25ELHVEQUFvRDtBQUVwRCw2Q0FFd0U7QUFFeEUseUNBQXVDO0FBRXZDLGlDQUM4RDtBQUM5RCw0REFBdUM7QUFHdkMsbURBQytFO0FBQy9FLDREQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxrQ0FBa0MsQ0FBQztBQUVuRCxNQUFNLEtBQUssR0FBa0I7SUFDM0I7UUFDRSxFQUFFLEVBQUUseUJBQWdCO1FBQ3BCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHlCQUF5QjtRQUMvQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMseUJBQXlCO1FBQzNDLGFBQWEsRUFBRTtZQUNiLHlCQUF5QjtTQUMxQjtLQUNGO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsZ0JBQU8sR0FBRyxPQUFPO1FBQ3JCLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsSUFBSSxFQUFFLE1BQU07UUFDWixRQUFRLEVBQUUsSUFBSTtRQUNkLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBc0I7UUFDeEMsYUFBYSxFQUFFO1lBQ2Isc0JBQXNCO1NBQ3ZCO0tBQ0Y7SUFDRDtRQUNFLEVBQUUsRUFBRSxnQkFBTyxHQUFHLE9BQU87UUFDckIsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixJQUFJLEVBQUUsTUFBTTtRQUNaLFFBQVEsRUFBRSxJQUFJO1FBQ2QsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLDJCQUEyQjtRQUM3QyxhQUFhLEVBQUU7WUFDYiwyQkFBMkI7U0FDNUI7S0FDRjtDQUNGLENBQUM7QUFFRixTQUFTLFFBQVE7SUFDZixJQUFJO1FBQ0YsTUFBTSxRQUFRLEdBQUcseUJBQU0sQ0FBQyxXQUFXLENBQ2pDLG9CQUFvQixFQUNwQix5Q0FBeUMsRUFDekMsZUFBZSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztTQUN2QztRQUNELE9BQU8sa0JBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQWUsQ0FBQyxDQUFDO0tBQ25EO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQztZQUN0QyxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXO1lBQzNDLFFBQVEsRUFBRSxXQUFXLEVBQUUsT0FBTztTQUMvQixDQUFDO2FBQ0MsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2hDO0FBQ0gsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsR0FBd0I7SUFDakQsT0FBTyxDQUFDLFNBQWlDLEVBQUUsRUFBRTtRQUMzQyxNQUFNLGdCQUFnQixHQUFHLENBQU8sS0FBSyxFQUFFLEVBQUU7O1lBQ3ZDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsMENBQTBDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEUsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUEsaUNBQWtCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkQsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUU7Z0JBQ2xDLElBQUEsZ0NBQXlCLEVBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQy9CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzFCO2lCQUFNO2dCQUNMLElBQUksQ0FBQSxNQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxLQUFLLDBDQUFFLGNBQWMsTUFBSyxTQUFTLEVBQUU7b0JBQ2xELE9BQU8sSUFBQSw4QkFBZSxFQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztpQkFDMUQ7YUFDRjtRQUNILENBQUMsQ0FBQSxDQUFDO1FBQ0YsTUFBTSxVQUFVLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUM3QixlQUFFLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDO2FBQy9CLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7WUFDbkMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUU3QixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDakIsVUFBVSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3QyxVQUFVLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLFVBQVUsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUEsNkJBQW9CLEdBQUUsQ0FBQyxDQUFDO1NBQUMsQ0FBQzthQUMvQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxtQ0FBb0IsRUFBQyxHQUFHLENBQUM7YUFDbEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFlBQVksaUJBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDbkIsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQyxDQUFDLENBQUE7QUFDSCxDQUFDO0FBRUQsSUFBSSxlQUFnQyxDQUFDO0FBQ3JDLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDO0FBR2pELFNBQVMsSUFBSSxDQUFDLE9BQWdDO0lBQzVDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUUsb0JBQVMsQ0FBQyxDQUFDO0lBQzdELE9BQU8sQ0FBQyxZQUFZLENBQUM7UUFDbkIsRUFBRSxFQUFFLGdCQUFPO1FBQ1gsSUFBSSxFQUFFLGVBQWU7UUFDckIsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsUUFBUTtRQUNuQixZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTTtRQUMxQixJQUFJLEVBQUUsYUFBYTtRQUNuQixVQUFVLEVBQUUsMEJBQW1CO1FBQy9CLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFRO1FBQzVDLGNBQWMsRUFBRSxLQUFLO1FBQ3JCLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLGFBQWEsRUFBRTtZQUNiLHNCQUFzQjtTQUN2QjtRQUNELFdBQVcsRUFBRTtZQUNYLFVBQVUsRUFBRSxRQUFRO1NBQ3JCO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsVUFBVSxFQUFFLE1BQU07WUFDbEIsZUFBZSxFQUFFLHNCQUFhO1lBQzlCLFlBQVksRUFBRSxzQkFBYTtTQUM1QjtLQUNGLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsNkJBQXVCLEVBQUUsdUNBQWlDLENBQUMsQ0FBQztJQUMvRyxPQUFPLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLEVBQUUsRUFBRSxFQUFFLDRCQUFzQixFQUFFLDJCQUFxQixDQUFDLENBQUM7SUFDcEcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxFQUFFLEVBQUUsK0JBQXlCLEVBQUUseUJBQW1CLENBQUMsQ0FBQztJQUMvRixPQUFPLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSw0QkFBc0IsRUFBRSxzQkFBZ0IsQ0FBQyxDQUFDO0lBQ3RGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsaUNBQTJCLEVBQUUsMkJBQXFCLENBQUMsQ0FBQztJQUNyRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxFQUFFLHVCQUFpQixFQUFFLDBCQUFvQixDQUFDLENBQUM7SUFFekYsT0FBTyxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLEVBQUUsSUFBQSxZQUFLLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUEsZ0JBQVMsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsNEJBQXNCLENBQUMsQ0FBQztJQUN2SCxPQUFPLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsSUFBQSxZQUFLLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUEsZ0JBQVMsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsaUJBQWEsQ0FBQyxDQUFDO0lBQ3JHLE9BQU8sQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUUsRUFBRSxJQUFBLFlBQUssRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBQSxpQkFBVSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxrQkFBYyxDQUFDLENBQUM7SUFDeEcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsSUFBQSxZQUFLLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUEsZ0JBQVMsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQ3hILEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSw0QkFBNEIsRUFBRSxDQUFDLENBQUM7SUFDdEUsT0FBTyxDQUFDLGVBQWUsQ0FBQywwQkFBMEIsRUFBRSxFQUFFLEVBQUUsSUFBQSxZQUFLLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLHVCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLGtCQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFN0gsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFBLHFCQUFXLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUEsb0JBQVUsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFRLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUd2RyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFFLElBQUEsdUJBQVUsRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFTLENBQUMsQ0FBQztJQUVwRixJQUFBLGdDQUFlLEVBQUMsRUFBRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO0lBRWpELE9BQU8sQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQ3hDLDBCQUEwQixFQUMxQixDQUFDLE1BQWMsRUFBRSxZQUFzQixFQUFFLFVBQXNCLEVBQUUsRUFBRSxDQUNqRSxJQUFBLGdDQUFrQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUMvRCxDQUFDLE1BQWMsRUFBRSxVQUE4QixFQUFFLEVBQUUsQ0FDakQsSUFBQSxrQ0FBb0IsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxFQUNuRCxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQ3ZCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFDMUIsQ0FBQyxLQUFtQixFQUFFLE1BQWMsRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLGdCQUFPLEVBQzNELDZCQUFtQixDQUNwQixDQUFDO0lBRUYsT0FBTyxDQUFDLHNCQUFzQixDQUM1QixjQUFjLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQ3JELG9IQUFvSCxFQUNwSCxHQUFHLEVBQUU7UUFDSCxNQUFNLFlBQVksR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEUsT0FBTyxZQUFZLEtBQUssZ0JBQU8sQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztJQUVMLE1BQU0sZUFBZSxHQUFHLENBQU8sT0FBTyxFQUFFLEVBQUU7UUFDeEMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0MsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsTUFBTSxTQUFTLEdBQUcsSUFBQSxtQ0FBc0IsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGlCQUFVLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxzQkFBYSxDQUFDLENBQUMsQ0FBQztRQUN4RixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDM0QsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDakQsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM3QixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzVCO2lCQUFNO2dCQUNMLEtBQUssQ0FBQyxJQUFJLGlDQUNMLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FDakIsT0FBTyxJQUNQLENBQUM7YUFDSjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBWSxDQUFDLENBQUMsQ0FBQztJQUM3RSxDQUFDLENBQUEsQ0FBQztJQUNGLE1BQU0sS0FBSyxHQUFHO1FBQ1osaUJBQWlCLEVBQUUsZUFBZTtRQUNsQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7UUFDaEIsa0JBQWtCO0tBQ25CLENBQUE7SUFDRCxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxtQkFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFNbkQsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDaEIsZUFBZSxHQUFHLElBQUksaUNBQWUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ25FLG1CQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUcxRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsSUFBQSxvQ0FBb0IsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvRSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsSUFBQSxtQ0FBbUIsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvRSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLElBQUEsOEJBQWMsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUV2RixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQVEsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxJQUFBLDJCQUFXLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBUSxDQUFDLENBQUM7UUFDbkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUEsMEJBQVUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFRLENBQUMsQ0FBQztRQUNyRixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxJQUFBLDhCQUFjLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsQ0FBUSxDQUFDLENBQUM7UUFFOUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUUsSUFBQSxnQ0FBZ0IsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFRLENBQUMsQ0FBQztJQUNoSCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcblxyXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyLCBtaWdyYXRlMTQ4IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IHsgSVczQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XHJcbmltcG9ydCBDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vdmlld3MvQ29sbGVjdGlvbnNEYXRhVmlldyc7XHJcblxyXG5pbXBvcnQgeyBkb3dubG9hZFNjcmlwdE1lcmdlciwgZ2V0U2NyaXB0TWVyZ2VyRGlyLCBzZXRNZXJnZXJDb25maWcgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XHJcblxyXG5pbXBvcnQgeyBET19OT1RfREVQTE9ZLCBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCxcclxuICBMT0NLRURfUFJFRklYLCBTQ1JJUFRfTUVSR0VSX0lEXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgdGVzdERMQywgdGVzdFRMIH0gZnJvbSAnLi9tb2RUeXBlcyc7XHJcbmltcG9ydCB7IGNhbk1lcmdlWE1MLCBkb01lcmdlWE1MLCBjYW5NZXJnZVNldHRpbmdzLCBkb01lcmdlU2V0dGluZ3MgfSBmcm9tICcuL21lcmdlcnMnO1xyXG5cclxuaW1wb3J0IHsgcmVnaXN0ZXJBY3Rpb25zIH0gZnJvbSAnLi9pY29uYmFyQWN0aW9ucyc7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IGluc3RhbGxDb250ZW50LCBpbnN0YWxsTWVudU1vZCwgaW5zdGFsbFRMLCBpbnN0YWxsRExDTW9kLCBpbnN0YWxsTWl4ZWQsXHJcbiAgc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIsIHNjcmlwdE1lcmdlclRlc3QsIHRlc3RNZW51TW9kUm9vdCwgdGVzdFN1cHBvcnRlZENvbnRlbnQsXHJcbiAgdGVzdFN1cHBvcnRlZFRMLCB0ZXN0U3VwcG9ydGVkTWl4ZWQsIHRlc3RETENNb2QgfSBmcm9tICcuL2luc3RhbGxlcnMnO1xyXG5cclxuaW1wb3J0IHsgVzNSZWR1Y2VyIH0gZnJvbSAnLi9yZWR1Y2Vycyc7XHJcblxyXG5pbXBvcnQgeyBnZXRETENQYXRoLCBnZXRBbGxNb2RzLCBkZXRlcm1pbmVFeGVjdXRhYmxlLCBnZXREb2N1bWVudHNQYXRoLFxyXG4gIGdldFRMUGF0aCwgaXNUVzMsIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIgfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgVFczTG9hZE9yZGVyIGZyb20gJy4vbG9hZE9yZGVyJztcclxuXHJcblxyXG5pbXBvcnQgeyBvbkRpZERlcGxveSwgb25EaWRQdXJnZSwgb25EaWRSZW1vdmVNb2QsIG9uR2FtZU1vZGVBY3RpdmF0aW9uLCBvbk1vZHNEaXNhYmxlZCxcclxuICBvblByb2ZpbGVXaWxsQ2hhbmdlLCBvblNldHRpbmdzQ2hhbmdlLCBvbldpbGxEZXBsb3kgfSBmcm9tICcuL2V2ZW50SGFuZGxlcnMnO1xyXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcclxuXHJcbmNvbnN0IEdPR19JRCA9ICcxMjA3NjY0NjYzJztcclxuY29uc3QgR09HX0lEX0dPVFkgPSAnMTQ5NTEzNDMyMCc7XHJcbmNvbnN0IEdPR19XSF9JRCA9ICcxMjA3NjY0NjQzJztcclxuY29uc3QgR09HX1dIX0dPVFkgPSAnMTY0MDQyNDc0Nyc7XHJcbmNvbnN0IFNURUFNX0lEID0gJzQ5OTQ1MCc7XHJcbmNvbnN0IFNURUFNX0lEX1dIID0gJzI5MjAzMCc7XHJcbmNvbnN0IEVQSUNfSUQgPSAnNzI1YTIyZTE1ZWQ3NDczNWJiMGQ2YTE5ZjNjYzgyZDAnO1xyXG5cclxuY29uc3QgdG9vbHM6IHR5cGVzLklUb29sW10gPSBbXHJcbiAge1xyXG4gICAgaWQ6IFNDUklQVF9NRVJHRVJfSUQsXHJcbiAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXHJcbiAgICBsb2dvOiAnV2l0Y2hlclNjcmlwdE1lcmdlci5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogR0FNRV9JRCArICdfRFgxMScsXHJcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMyAoRFgxMSknLFxyXG4gICAgbG9nbzogJ2F1dG8nLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiBHQU1FX0lEICsgJ19EWDEyJyxcclxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzIChEWDEyKScsXHJcbiAgICBsb2dvOiAnYXV0bycsXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4veDY0X0RYMTIvd2l0Y2hlcjMuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjRfRFgxMi93aXRjaGVyMy5leGUnLFxyXG4gICAgXSxcclxuICB9LFxyXG5dO1xyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKTogQmx1ZWJpcmQ8c3RyaW5nPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKFxyXG4gICAgICAnSEtFWV9MT0NBTF9NQUNISU5FJyxcclxuICAgICAgJ1NvZnR3YXJlXFxcXENEIFByb2plY3QgUmVkXFxcXFRoZSBXaXRjaGVyIDMnLFxyXG4gICAgICAnSW5zdGFsbEZvbGRlcicpO1xyXG4gICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoaW5zdFBhdGgudmFsdWUgYXMgc3RyaW5nKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbXHJcbiAgICAgIEdPR19JRF9HT1RZLCBHT0dfSUQsIEdPR19XSF9JRCwgR09HX1dIX0dPVFksXHJcbiAgICAgIFNURUFNX0lELCBTVEVBTV9JRF9XSCwgRVBJQ19JRFxyXG4gICAgXSlcclxuICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIHJldHVybiAoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSA9PiB7XHJcbiAgICBjb25zdCBmaW5kU2NyaXB0TWVyZ2VyID0gYXN5bmMgKGVycm9yKSA9PiB7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgc2NyaXB0IG1lcmdlcicsIGVycm9yKTtcclxuICAgICAgY29uc3Qgc2NyaXB0TWVyZ2VyUGF0aCA9IGF3YWl0IGdldFNjcmlwdE1lcmdlckRpcihhcGkpO1xyXG4gICAgICBpZiAoc2NyaXB0TWVyZ2VyUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmV0dXJuIHNldE1lcmdlckNvbmZpZyhkaXNjb3ZlcnkucGF0aCwgc2NyaXB0TWVyZ2VyUGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgY29uc3QgZW5zdXJlUGF0aCA9IChkaXJwYXRoKSA9PlxyXG4gICAgICBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKGRpcnBhdGgpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFRVhJU1QnKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICBcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChbXHJcbiAgICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKSxcclxuICAgICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKSksXHJcbiAgICAgIGVuc3VyZVBhdGgocGF0aC5kaXJuYW1lKGdldExvYWRPcmRlckZpbGVQYXRoKCkpKV0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gZG93bmxvYWRTY3JpcHRNZXJnZXIoYXBpKVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgICAgOiBmaW5kU2NyaXB0TWVyZ2VyKGVycikpKTtcclxuICB9XHJcbn1cclxuXHJcbmxldCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuY29uc3QgZ2V0UHJpb3JpdHlNYW5hZ2VyID0gKCkgPT4gcHJpb3JpdHlNYW5hZ2VyO1xyXG4vLyBsZXQgbW9kTGltaXRQYXRjaGVyOiBNb2RMaW1pdFBhdGNoZXI7XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBXM1JlZHVjZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ01vZHMnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6IGRldGVybWluZUV4ZWN1dGFibGUsXHJcbiAgICBzZXR1cDogcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGkpIGFzIGFueSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMjkyMDMwJyxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IDI5MjAzMCxcclxuICAgICAgaWdub3JlQ29uZmxpY3RzOiBET19OT1RfREVQTE9ZLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzY3JpcHRtZXJnZXJkdW1teScsIDE1LCBzY3JpcHRNZXJnZXJUZXN0IGFzIGFueSwgc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsIHRlc3RNZW51TW9kUm9vdCBhcyBhbnksIGluc3RhbGxNZW51TW9kIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtaXhlZCcsIDI1LCB0ZXN0U3VwcG9ydGVkTWl4ZWQgYXMgYW55LCBpbnN0YWxsTWl4ZWQgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM3RsJywgMzAsIHRlc3RTdXBwb3J0ZWRUTCBhcyBhbnksIGluc3RhbGxUTCBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzY29udGVudCcsIDUwLCB0ZXN0U3VwcG9ydGVkQ29udGVudCBhcyBhbnksIGluc3RhbGxDb250ZW50IGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNkbGNtb2QnLCA2MCwgdGVzdERMQ01vZCBhcyBhbnksIGluc3RhbGxETENNb2QgYXMgYW55KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXRUTFBhdGgoY29udGV4dC5hcGkpLCB0ZXN0TWVudU1vZFJvb3QgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjN0bCcsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldFRMUGF0aChjb250ZXh0LmFwaSksIHRlc3RUTCBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM2RsYycsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldERMQ1BhdGgoY29udGV4dC5hcGkpLCB0ZXN0RExDIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3czbW9kbGltaXRwYXRjaGVyJywgMjUsIGlzVFczKGNvbnRleHQuYXBpKSwgZ2V0VExQYXRoKGNvbnRleHQuYXBpKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSksXHJcbiAgICB7IGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlLCBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXIgTW9kIFR5cGUnIH0pO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXREb2N1bWVudHNQYXRoLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNZXJnZShjYW5NZXJnZVhNTChjb250ZXh0LmFwaSksIGRvTWVyZ2VYTUwoY29udGV4dC5hcGkpIGFzIGFueSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcclxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTWVyZ2UoY2FuTWVyZ2VTZXR0aW5ncyhjb250ZXh0LmFwaSksIGRvTWVyZ2VTZXR0aW5ncyhjb250ZXh0LmFwaSkgYXMgYW55LCAnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24oKG9sZFZlcnNpb24pID0+IChtaWdyYXRlMTQ4KGNvbnRleHQsIG9sZFZlcnNpb24pIGFzIGFueSkpO1xyXG5cclxuICByZWdpc3RlckFjdGlvbnMoeyBjb250ZXh0LCBnZXRQcmlvcml0eU1hbmFnZXIgfSk7XHJcblxyXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcclxuICAgICd3aXRjaGVyM19jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLCBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdXaXRjaGVyIDMgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJQcm9maWxlRmVhdHVyZShcclxuICAgICdsb2NhbF9tZXJnZXMnLCAnYm9vbGVhbicsICdzZXR0aW5ncycsICdQcm9maWxlIERhdGEnLFxyXG4gICAgJ1RoaXMgcHJvZmlsZSB3aWxsIHN0b3JlIGFuZCByZXN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgZGF0YSAobWVyZ2VkIHNjcmlwdHMsIGxvYWRvcmRlciwgZXRjKSB3aGVuIHN3aXRjaGluZyBwcm9maWxlcycsXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgIHJldHVybiBhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQ7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgdG9nZ2xlTW9kc1N0YXRlID0gYXN5bmMgKGVuYWJsZWQpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGNvbnRleHQuYXBpKTtcclxuICAgIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIobW9kTmFtZSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkpO1xyXG4gICAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkKTtcclxuICAgIGNvbnN0IG5ld0xPID0gbG9hZE9yZGVyLnJlZHVjZSgoYWNjdW0sIGtleSwgaWR4KSA9PiB7XHJcbiAgICAgIGlmICh0b3RhbExvY2tlZC5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChsb2FkT3JkZXJbaWR4XSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgICAuLi5sb2FkT3JkZXJbaWR4XSxcclxuICAgICAgICAgIGVuYWJsZWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8gYXMgYW55KSk7XHJcbiAgfTtcclxuICBjb25zdCBwcm9wcyA9IHtcclxuICAgIG9uVG9nZ2xlTW9kc1N0YXRlOiB0b2dnbGVNb2RzU3RhdGUsXHJcbiAgICBhcGk6IGNvbnRleHQuYXBpLFxyXG4gICAgZ2V0UHJpb3JpdHlNYW5hZ2VyLFxyXG4gIH1cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKG5ldyBUVzNMb2FkT3JkZXIocHJvcHMpKTtcclxuICAvLyBjb250ZXh0LnJlZ2lzdGVyVGVzdCgndHczLW1vZC1saW1pdC1icmVhY2gnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAvLyAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XHJcbiAgLy8gY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ21vZC1hY3RpdmF0ZWQnLFxyXG4gIC8vICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIHByaW9yaXR5TWFuYWdlciA9IG5ldyBQcmlvcml0eU1hbmFnZXIoY29udGV4dC5hcGksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZShjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKTtcclxuICAgIC8vIG1vZExpbWl0UGF0Y2hlciA9IG5ldyBNb2RMaW1pdFBhdGNoZXIoY29udGV4dC5hcGkpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgb25HYW1lTW9kZUFjdGl2YXRpb24oY29udGV4dC5hcGkpKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHJvZmlsZS13aWxsLWNoYW5nZScsIG9uUHJvZmlsZVdpbGxDaGFuZ2UoY29udGV4dC5hcGkpKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignbW9kcy1lbmFibGVkJywgb25Nb2RzRGlzYWJsZWQoY29udGV4dC5hcGksIGdldFByaW9yaXR5TWFuYWdlcikpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ3dpbGwtZGVwbG95Jywgb25XaWxsRGVwbG95KGNvbnRleHQuYXBpKSBhcyBhbnkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIG9uRGlkRGVwbG95KGNvbnRleHQuYXBpKSBhcyBhbnkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgb25EaWRQdXJnZShjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKSBhcyBhbnkpO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXJlbW92ZS1tb2QnLCBvbkRpZFJlbW92ZU1vZChjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKSBhcyBhbnkpO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBvblNldHRpbmdzQ2hhbmdlKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpIGFzIGFueSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW4sXHJcbn07XHJcbiJdfQ==