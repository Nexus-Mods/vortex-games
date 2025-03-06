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
const xml2js_1 = require("xml2js");
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./views/CollectionsDataView"));
const scriptmerger_1 = require("./scriptmerger");
const common_1 = require("./common");
const modTypes_1 = require("./modTypes");
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
const CONFIG_MATRIX_REL_PATH = path_1.default.join('bin', 'config', 'r4game', 'user_config_matrix', 'pc');
const CONFIG_MATRIX_FILES = ['audio', 'display', 'gameplay', 'gamma', 'graphics', 'graphicsdx11', 'hdr', 'hidden', 'hud', 'input', 'localization'];
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
function isXML(filePath) {
    return ['.xml'].includes(path_1.default.extname(filePath).toLowerCase());
}
function canMerge(api) {
    return (game, gameDiscovery) => {
        if (game.id !== common_1.GAME_ID) {
            return undefined;
        }
        return {
            baseFiles: (deployedFiles) => deployedFiles
                .filter(file => isXML(file.relPath))
                .map(file => ({
                in: path_1.default.join(gameDiscovery.path, CONFIG_MATRIX_REL_PATH, file.relPath),
                out: path_1.default.join(CONFIG_MATRIX_REL_PATH, file.relPath),
            })),
            filter: filePath => isXML(filePath) && CONFIG_MATRIX_FILES.includes(path_1.default.basename(filePath, path_1.default.extname(filePath))),
        };
    };
}
function readInputFile(api, modFilePath, mergeDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
            return Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
        }
        const gameInputFilepath = path_1.default.join(discovery.path, CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath));
        const mergedFilePath = path_1.default.join(mergeDirPath, CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath));
        const backupFilePath = gameInputFilepath + common_1.VORTEX_BACKUP_TAG;
        try {
            if (yield (0, util_1.fileExists)(mergedFilePath)) {
                return vortex_api_1.fs.readFileAsync(mergedFilePath);
            }
            if (yield (0, util_1.fileExists)(backupFilePath)) {
                return vortex_api_1.fs.readFileAsync(backupFilePath);
            }
            return vortex_api_1.fs.readFileAsync(gameInputFilepath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
class ModXMLDataInvalid extends vortex_api_1.util.DataInvalid {
    constructor(message, modFilePath) {
        super(`${message}:\n${modFilePath}`);
    }
}
const doMerge = (api) => (modFilePath, targetMergeDir) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const modData = yield vortex_api_1.fs.readFileAsync(modFilePath);
        const modXml = yield (0, xml2js_1.parseStringPromise)(modData);
        const modGroups = (_a = modXml === null || modXml === void 0 ? void 0 : modXml.UserConfig) === null || _a === void 0 ? void 0 : _a.Group;
        if (!modGroups) {
            const err = new ModXMLDataInvalid('Invalid XML data - inform mod author', modFilePath);
            api.showErrorNotification('Failed to merge XML data', err, { allowReport: false });
            return Promise.resolve();
        }
        const currentInputFile = yield readInputFile(api, modFilePath, targetMergeDir);
        const mergedXmlData = yield (0, xml2js_1.parseStringPromise)(currentInputFile);
        modGroups.forEach(modGroup => {
            var _a, _b, _c, _d, _e;
            const gameGroups = (_a = mergedXmlData === null || mergedXmlData === void 0 ? void 0 : mergedXmlData.UserConfig) === null || _a === void 0 ? void 0 : _a.Group;
            const modVars = (_c = (_b = modGroup === null || modGroup === void 0 ? void 0 : modGroup.VisibleVars) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.Var;
            const gameGroup = gameGroups.find(group => { var _a, _b; return ((_a = group === null || group === void 0 ? void 0 : group.$) === null || _a === void 0 ? void 0 : _a.id) === ((_b = modGroup === null || modGroup === void 0 ? void 0 : modGroup.$) === null || _b === void 0 ? void 0 : _b.id); });
            if (gameGroup) {
                const gameVars = (_e = (_d = gameGroup === null || gameGroup === void 0 ? void 0 : gameGroup.VisibleVars) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.Var;
                modVars.forEach(modVar => {
                    const gameVar = gameVars.find(v => { var _a, _b; return ((_a = v === null || v === void 0 ? void 0 : v.$) === null || _a === void 0 ? void 0 : _a.id) === ((_b = modVar === null || modVar === void 0 ? void 0 : modVar.$) === null || _b === void 0 ? void 0 : _b.id); });
                    if (gameVar) {
                        Object.assign(gameVar, modVar);
                    }
                    else {
                        gameVars.push(modVar);
                    }
                });
            }
            else {
                gameGroups.push(modGroup);
            }
        });
        const builder = new xml2js_1.Builder({ doctype: { dtd: 'UTF-16' } });
        const xml = builder.buildObject(mergedXmlData);
        yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(targetMergeDir, CONFIG_MATRIX_REL_PATH));
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(targetMergeDir, CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath)), xml);
    }
    catch (err) {
        const state = api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const extendedErr = vortex_api_1.util.deepMerge({ modFilePath, targetMergeDir, message: err.message, stack: err.stack }, err);
        api.showErrorNotification('Failed to merge XML data', extendedErr, {
            allowReport: true,
            attachments: [
                {
                    id: `${activeProfile.id}_loadOrder`,
                    type: 'data',
                    data: loadOrder,
                    description: 'Current load order'
                },
            ],
        });
        return Promise.resolve();
    }
});
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
    context.registerMerge(canMerge(context.api), doMerge(context.api), 'witcher3menumodroot');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQXNFO0FBQ3RFLHNFQUFxQztBQUVyQyw2Q0FBa0U7QUFFbEUsbUNBQXFEO0FBRXJELDJEQUFxRjtBQUVyRixzRkFBOEQ7QUFFOUQsaURBQTJGO0FBRTNGLHFDQUVrQjtBQUVsQix5Q0FBNkM7QUFFN0MscURBQW1EO0FBQ25ELHVEQUFvRDtBQUVwRCw2Q0FFd0U7QUFFeEUseUNBQXVDO0FBRXZDLGlDQUMwRTtBQUMxRSw0REFBdUM7QUFHdkMsbURBQytFO0FBQy9FLDREQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxrQ0FBa0MsQ0FBQztBQUVuRCxNQUFNLHNCQUFzQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDaEcsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztBQUVuSixNQUFNLEtBQUssR0FBa0I7SUFDM0I7UUFDRSxFQUFFLEVBQUUseUJBQWdCO1FBQ3BCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxF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QUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUUsSUFBQSxnQ0FBZ0IsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFRLENBQUMsQ0FBQztJQUNoSCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcblxyXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyLCBtaWdyYXRlMTQ4IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XHJcbmltcG9ydCB7IElXM0NvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5cclxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIsIGdldFNjcmlwdE1lcmdlckRpciwgc2V0TWVyZ2VyQ29uZmlnIH0gZnJvbSAnLi9zY3JpcHRtZXJnZXInO1xyXG5cclxuaW1wb3J0IHsgRE9fTk9UX0RFUExPWSwgR0FNRV9JRCwgZ2V0TG9hZE9yZGVyRmlsZVBhdGgsXHJcbiAgTE9DS0VEX1BSRUZJWCwgU0NSSVBUX01FUkdFUl9JRCwgVk9SVEVYX0JBQ0tVUF9UQUcsXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgdGVzdERMQywgdGVzdFRMIH0gZnJvbSAnLi9tb2RUeXBlcyc7XHJcblxyXG5pbXBvcnQgeyByZWdpc3RlckFjdGlvbnMgfSBmcm9tICcuL2ljb25iYXJBY3Rpb25zJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5cclxuaW1wb3J0IHsgaW5zdGFsbENvbnRlbnQsIGluc3RhbGxNZW51TW9kLCBpbnN0YWxsVEwsIGluc3RhbGxETENNb2QsIGluc3RhbGxNaXhlZCxcclxuICBzY3JpcHRNZXJnZXJEdW1teUluc3RhbGxlciwgc2NyaXB0TWVyZ2VyVGVzdCwgdGVzdE1lbnVNb2RSb290LCB0ZXN0U3VwcG9ydGVkQ29udGVudCxcclxuICB0ZXN0U3VwcG9ydGVkVEwsIHRlc3RTdXBwb3J0ZWRNaXhlZCwgdGVzdERMQ01vZCB9IGZyb20gJy4vaW5zdGFsbGVycyc7XHJcblxyXG5pbXBvcnQgeyBXM1JlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcclxuXHJcbmltcG9ydCB7IGdldERMQ1BhdGgsIGdldEFsbE1vZHMsIGRldGVybWluZUV4ZWN1dGFibGUsIGdldERvY3VtZW50c1BhdGgsXHJcbiAgZ2V0VExQYXRoLCBpc1RXMywgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlciwgZmlsZUV4aXN0cyB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCBUVzNMb2FkT3JkZXIgZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5cclxuXHJcbmltcG9ydCB7IG9uRGlkRGVwbG95LCBvbkRpZFB1cmdlLCBvbkRpZFJlbW92ZU1vZCwgb25HYW1lTW9kZUFjdGl2YXRpb24sIG9uTW9kc0Rpc2FibGVkLFxyXG4gIG9uUHJvZmlsZVdpbGxDaGFuZ2UsIG9uU2V0dGluZ3NDaGFuZ2UsIG9uV2lsbERlcGxveSB9IGZyb20gJy4vZXZlbnRIYW5kbGVycyc7XHJcbmltcG9ydCBJbmlTdHJ1Y3R1cmUgZnJvbSAnLi9pbmlQYXJzZXInO1xyXG5cclxuY29uc3QgR09HX0lEID0gJzEyMDc2NjQ2NjMnO1xyXG5jb25zdCBHT0dfSURfR09UWSA9ICcxNDk1MTM0MzIwJztcclxuY29uc3QgR09HX1dIX0lEID0gJzEyMDc2NjQ2NDMnO1xyXG5jb25zdCBHT0dfV0hfR09UWSA9ICcxNjQwNDI0NzQ3JztcclxuY29uc3QgU1RFQU1fSUQgPSAnNDk5NDUwJztcclxuY29uc3QgU1RFQU1fSURfV0ggPSAnMjkyMDMwJztcclxuY29uc3QgRVBJQ19JRCA9ICc3MjVhMjJlMTVlZDc0NzM1YmIwZDZhMTlmM2NjODJkMCc7XHJcblxyXG5jb25zdCBDT05GSUdfTUFUUklYX1JFTF9QQVRIID0gcGF0aC5qb2luKCdiaW4nLCAnY29uZmlnJywgJ3I0Z2FtZScsICd1c2VyX2NvbmZpZ19tYXRyaXgnLCAncGMnKTtcclxuY29uc3QgQ09ORklHX01BVFJJWF9GSUxFUyA9IFsnYXVkaW8nLCAnZGlzcGxheScsICdnYW1lcGxheScsICdnYW1tYScsICdncmFwaGljcycsICdncmFwaGljc2R4MTEnLCAnaGRyJywgJ2hpZGRlbicsICdodWQnLCAnaW5wdXQnLCAnbG9jYWxpemF0aW9uJ107XHJcblxyXG5jb25zdCB0b29sczogdHlwZXMuSVRvb2xbXSA9IFtcclxuICB7XHJcbiAgICBpZDogU0NSSVBUX01FUkdFUl9JRCxcclxuICAgIG5hbWU6ICdXMyBTY3JpcHQgTWVyZ2VyJyxcclxuICAgIGxvZ286ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiBHQU1FX0lEICsgJ19EWDExJyxcclxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzIChEWDExKScsXHJcbiAgICBsb2dvOiAnYXV0bycsXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaWQ6IEdBTUVfSUQgKyAnX0RYMTInLFxyXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMgKERYMTIpJyxcclxuICAgIGxvZ286ICdhdXRvJyxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi94NjRfRFgxMi93aXRjaGVyMy5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZScsXHJcbiAgICBdLFxyXG4gIH0sXHJcbl07XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBCbHVlYmlyZDxzdHJpbmc+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoXHJcbiAgICAgICdIS0VZX0xPQ0FMX01BQ0hJTkUnLFxyXG4gICAgICAnU29mdHdhcmVcXFxcQ0QgUHJvamVjdCBSZWRcXFxcVGhlIFdpdGNoZXIgMycsXHJcbiAgICAgICdJbnN0YWxsRm9sZGVyJyk7XHJcbiAgICBpZiAoIWluc3RQYXRoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSBhcyBzdHJpbmcpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtcclxuICAgICAgR09HX0lEX0dPVFksIEdPR19JRCwgR09HX1dIX0lELCBHT0dfV0hfR09UWSxcclxuICAgICAgU1RFQU1fSUQsIFNURUFNX0lEX1dILCBFUElDX0lEXHJcbiAgICBdKVxyXG4gICAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIChkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpID0+IHtcclxuICAgIGNvbnN0IGZpbmRTY3JpcHRNZXJnZXIgPSBhc3luYyAoZXJyb3IpID0+IHtcclxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBzY3JpcHQgbWVyZ2VyJywgZXJyb3IpO1xyXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJQYXRoID0gYXdhaXQgZ2V0U2NyaXB0TWVyZ2VyRGlyKGFwaSk7XHJcbiAgICAgIGlmIChzY3JpcHRNZXJnZXJQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICByZXR1cm4gc2V0TWVyZ2VyQ29uZmlnKGRpc2NvdmVyeS5wYXRoLCBzY3JpcHRNZXJnZXJQYXRoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgXHJcbiAgICBjb25zdCBlbnN1cmVQYXRoID0gKGRpcnBhdGgpID0+XHJcbiAgICAgIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoZGlycGF0aClcclxuICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VFWElTVCcpXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gIFxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpLFxyXG4gICAgICBlbnN1cmVQYXRoKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0RMQycpKSxcclxuICAgICAgZW5zdXJlUGF0aChwYXRoLmRpcm5hbWUoZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKSkpXSlcclxuICAgICAgICAudGhlbigoKSA9PiBkb3dubG9hZFNjcmlwdE1lcmdlcihhcGkpXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICA6IGZpbmRTY3JpcHRNZXJnZXIoZXJyKSkpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNYTUwoZmlsZVBhdGgpIHtcclxuICByZXR1cm4gWycueG1sJ10uaW5jbHVkZXMocGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2FuTWVyZ2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIChnYW1lLCBnYW1lRGlzY292ZXJ5KSA9PiB7XHJcbiAgICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGJhc2VGaWxlczogKGRlcGxveWVkRmlsZXM6IHR5cGVzLklEZXBsb3llZEZpbGVbXSkgPT4gZGVwbG95ZWRGaWxlc1xyXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBpc1hNTChmaWxlLnJlbFBhdGgpKVxyXG4gICAgICAgIC5tYXAoZmlsZSA9PiAoe1xyXG4gICAgICAgICAgaW46IHBhdGguam9pbihnYW1lRGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIGZpbGUucmVsUGF0aCksXHJcbiAgICAgICAgICBvdXQ6IHBhdGguam9pbihDT05GSUdfTUFUUklYX1JFTF9QQVRILCBmaWxlLnJlbFBhdGgpLFxyXG4gICAgICAgIH0pKSxcclxuICAgICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBpc1hNTChmaWxlUGF0aCkgJiYgQ09ORklHX01BVFJJWF9GSUxFUy5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpKSksXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZElucHV0RmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZEZpbGVQYXRoOiBzdHJpbmcsIG1lcmdlRGlyUGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xyXG4gIH1cclxuICBjb25zdCBnYW1lSW5wdXRGaWxlcGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xyXG4gIGNvbnN0IG1lcmdlZEZpbGVQYXRoID0gcGF0aC5qb2luKG1lcmdlRGlyUGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xyXG4gIGNvbnN0IGJhY2t1cEZpbGVQYXRoID0gZ2FtZUlucHV0RmlsZXBhdGggKyBWT1JURVhfQkFDS1VQX1RBRztcclxuICB0cnkge1xyXG4gICAgaWYgKGF3YWl0IGZpbGVFeGlzdHMobWVyZ2VkRmlsZVBhdGgpKSB7XHJcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKG1lcmdlZEZpbGVQYXRoKTtcclxuICAgIH1cclxuICAgIGlmIChhd2FpdCBmaWxlRXhpc3RzKGJhY2t1cEZpbGVQYXRoKSkge1xyXG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhiYWNrdXBGaWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhnYW1lSW5wdXRGaWxlcGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBQZXJoYXBzIHdlIHNob3VsZCBzaG93IGEgZGlhbG9nIGhlcmUgdG8gYXNrIHRoZSB1c2VyIHdoZXRoZXIgdGhleSB3YW50IHRvIHN0aWxsXHJcbiAgICAvLyAgZGVwbG95IHRoZSBtb2QncyB4bWwgZGF0YSB0byB0aGUgZ2FtZSdzIGRpcmVjdG9yeS5cclxuICAgIC8vIEZvciB0aGF0IHRvIGhhcHBlbiB3ZSBuZWVkIHRvIHRha2Ugb3V0IHRoZSBDT05GSUdfTUFUUklYX0ZJTEVTIGFycmF5LlxyXG4gICAgXHJcbiAgICAvLyBjb25zdCByZXN1bHQgPSBhd2FpdCBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnRmFpbGVkIHRvIHJlYWQgZ2FtZSBYTUwgZGF0YS4nLCB7XHJcbiAgICAvLyAgIHRleHQ6ICdPbmUgb2YgeW91ciBtb2RzIGlzIHRyeWluZycsXHJcbiAgICAvLyB9LFtcclxuICAgIC8vICAgeyBsYWJlbDogJ1JldHJ5JyB9LFxyXG4gICAgLy8gICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxyXG4gICAgLy8gXSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIE1vZFhNTERhdGFJbnZhbGlkIGV4dGVuZHMgdXRpbC5EYXRhSW52YWxpZCB7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBtb2RGaWxlUGF0aDogc3RyaW5nKSB7XHJcbiAgICBzdXBlcihgJHttZXNzYWdlfTpcXG4ke21vZEZpbGVQYXRofWApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gRXhhbXBsZSBvZiBob3cgd2UgZXhwZWN0IHRoZSB2YXJzIHRvIGJlIHdyYXBwZWQ6XHJcbi8vIDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi0xNlwiPz5cclxuLy8gPFVzZXJDb25maWc+XHJcbi8vIFx0PEdyb3VwIGJ1aWxkZXI9XCJJbnB1dFwiIGlkPVwiUENJbnB1dFwiIGRpc3BsYXlOYW1lPVwiY29udHJvbHNfcGNcIiB0YWdzPVwia2V5YmluZHNcIj5cclxuLy8gXHRcdDxWaXNpYmxlVmFycz5cclxuLy8gXHRcdFx0PFZhciBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIk1vdmVGd2RcIlx0XHRcdFx0XHRkaXNwbGF5TmFtZT1cIm1vdmVfZm9yd2FyZFwiXHRcdFx0XHRcdFx0ZGlzcGxheVR5cGU9XCJJTlBVVFBDXCIgYWN0aW9ucz1cIk1vdmVGb3J3YXJkO01vdmVtZW50RG91YmxlVGFwVztDaGFuZ2VDaG9pY2VVcFwiLz5cclxuLy8gXHRcdFx0PFZhciBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIk1vdmVCY2tcIlx0XHRcdFx0XHRkaXNwbGF5TmFtZT1cIm1vdmVfYmFja1wiXHRcdFx0XHRcdFx0XHRkaXNwbGF5VHlwZT1cIklOUFVUUENcIiBhY3Rpb25zPVwiTW92ZUJhY2t3YXJkO01vdmVtZW50RG91YmxlVGFwUztDaGFuZ2VDaG9pY2VEb3duO0dJX0RlY2VsZXJhdGVcIi8+XHJcbi8vICAgICA8L1Zpc2libGVWYXJzPlxyXG4vLyBcdDwvR3JvdXA+XHJcbi8vIDwvVXNlckNvbmZpZz5cclxuLy8gQWRkaW5nIGEgZ3JvdXAgd2l0aCBhIGRpZmZlcmVudCBpZCB3aWxsIGNyZWF0ZSBhIG5ldyBncm91cCBpbiB0aGUgZ2FtZSdzIGlucHV0LnhtbFxyXG4vLyAgZmlsZSwgaWYgdGhlIGdyb3VwIGFscmVhZHkgZXhpc3RzIGl0IHdpbGwgbWVyZ2UgdGhlIHZhcnMgaW50byB0aGUgZXhpc3RpbmcgZ3JvdXAuXHJcbmNvbnN0IGRvTWVyZ2UgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBhc3luYyAobW9kRmlsZVBhdGg6IHN0cmluZywgdGFyZ2V0TWVyZ2VEaXI6IHN0cmluZykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RGaWxlUGF0aCk7XHJcbiAgICBjb25zdCBtb2RYbWwgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UobW9kRGF0YSk7XHJcbiAgICBjb25zdCBtb2RHcm91cHMgPSBtb2RYbWw/LlVzZXJDb25maWc/Lkdyb3VwO1xyXG4gICAgaWYgKCFtb2RHcm91cHMpIHtcclxuICAgICAgY29uc3QgZXJyID0gbmV3IE1vZFhNTERhdGFJbnZhbGlkKCdJbnZhbGlkIFhNTCBkYXRhIC0gaW5mb3JtIG1vZCBhdXRob3InLCBtb2RGaWxlUGF0aCk7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBYTUwgZGF0YScsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGN1cnJlbnRJbnB1dEZpbGUgPSBhd2FpdCByZWFkSW5wdXRGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcclxuICAgIGNvbnN0IG1lcmdlZFhtbERhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoY3VycmVudElucHV0RmlsZSk7XHJcbiAgICBtb2RHcm91cHMuZm9yRWFjaChtb2RHcm91cCA9PiB7XHJcbiAgICAgIGNvbnN0IGdhbWVHcm91cHMgPSBtZXJnZWRYbWxEYXRhPy5Vc2VyQ29uZmlnPy5Hcm91cDtcclxuICAgICAgY29uc3QgbW9kVmFycyA9IG1vZEdyb3VwPy5WaXNpYmxlVmFycz8uWzBdPy5WYXI7XHJcbiAgICAgIGNvbnN0IGdhbWVHcm91cCA9IGdhbWVHcm91cHMuZmluZChncm91cCA9PiBncm91cD8uJD8uaWQgPT09IG1vZEdyb3VwPy4kPy5pZCk7XHJcbiAgICAgIGlmIChnYW1lR3JvdXApIHtcclxuICAgICAgICBjb25zdCBnYW1lVmFycyA9IGdhbWVHcm91cD8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xyXG4gICAgICAgIG1vZFZhcnMuZm9yRWFjaChtb2RWYXIgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZ2FtZVZhciA9IGdhbWVWYXJzLmZpbmQodiA9PiB2Py4kPy5pZCA9PT0gbW9kVmFyPy4kPy5pZCk7XHJcbiAgICAgICAgICBpZiAoZ2FtZVZhcikge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGdhbWVWYXIsIG1vZFZhcik7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnYW1lVmFycy5wdXNoKG1vZFZhcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZ2FtZUdyb3Vwcy5wdXNoKG1vZEdyb3VwKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoeyBkb2N0eXBlOiB7IGR0ZDogJ1VURi0xNicgfSB9KTtcclxuICAgIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QobWVyZ2VkWG1sRGF0YSk7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCkpO1xyXG4gICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpLCB4bWwpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XHJcbiAgICBjb25zdCBleHRlbmRlZEVyciA9IHV0aWwuZGVlcE1lcmdlKHsgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyLCBtZXNzYWdlOiBlcnIubWVzc2FnZSwgc3RhY2s6IGVyci5zdGFjayB9LCBlcnIpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIFhNTCBkYXRhJywgZXh0ZW5kZWRFcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXHJcbiAgICAgIGF0dGFjaG1lbnRzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X2xvYWRPcmRlcmAsXHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBkYXRhOiBsb2FkT3JkZXIsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcidcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5sZXQgbG9hZE9yZGVyOiBUVzNMb2FkT3JkZXI7XHJcbmxldCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuY29uc3QgZ2V0UHJpb3JpdHlNYW5hZ2VyID0gKCkgPT4gcHJpb3JpdHlNYW5hZ2VyO1xyXG4vLyBsZXQgbW9kTGltaXRQYXRjaGVyOiBNb2RMaW1pdFBhdGNoZXI7XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBXM1JlZHVjZXIpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ01vZHMnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6IGRldGVybWluZUV4ZWN1dGFibGUsXHJcbiAgICBzZXR1cDogcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGkpIGFzIGFueSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMjkyMDMwJyxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IDI5MjAzMCxcclxuICAgICAgaWdub3JlQ29uZmxpY3RzOiBET19OT1RfREVQTE9ZLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzY3JpcHRtZXJnZXJkdW1teScsIDE1LCBzY3JpcHRNZXJnZXJUZXN0IGFzIGFueSwgc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsIHRlc3RNZW51TW9kUm9vdCBhcyBhbnksIGluc3RhbGxNZW51TW9kIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtaXhlZCcsIDI1LCB0ZXN0U3VwcG9ydGVkTWl4ZWQgYXMgYW55LCBpbnN0YWxsTWl4ZWQgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM3RsJywgMzAsIHRlc3RTdXBwb3J0ZWRUTCBhcyBhbnksIGluc3RhbGxUTCBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzY29udGVudCcsIDUwLCB0ZXN0U3VwcG9ydGVkQ29udGVudCBhcyBhbnksIGluc3RhbGxDb250ZW50IGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNkbGNtb2QnLCA2MCwgdGVzdERMQ01vZCBhcyBhbnksIGluc3RhbGxETENNb2QgYXMgYW55KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXRUTFBhdGgoY29udGV4dC5hcGkpLCB0ZXN0TWVudU1vZFJvb3QgYXMgYW55KTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjN0bCcsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldFRMUGF0aChjb250ZXh0LmFwaSksIHRlc3RUTCBhcyBhbnkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM2RsYycsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldERMQ1BhdGgoY29udGV4dC5hcGkpLCB0ZXN0RExDIGFzIGFueSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3czbW9kbGltaXRwYXRjaGVyJywgMjUsIGlzVFczKGNvbnRleHQuYXBpKSwgZ2V0VExQYXRoKGNvbnRleHQuYXBpKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSksXHJcbiAgICB7IGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlLCBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXIgTW9kIFR5cGUnIH0pO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXREb2N1bWVudHNQYXRoLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNZXJnZShjYW5NZXJnZShjb250ZXh0LmFwaSksIGRvTWVyZ2UoY29udGV4dC5hcGkpIGFzIGFueSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbigob2xkVmVyc2lvbikgPT4gKG1pZ3JhdGUxNDgoY29udGV4dCwgb2xkVmVyc2lvbikgYXMgYW55KSk7XHJcblxyXG4gIHJlZ2lzdGVyQWN0aW9ucyh7IGNvbnRleHQsIGdldFByaW9yaXR5TWFuYWdlciB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ3dpdGNoZXIzX2NvbGxlY3Rpb25fZGF0YScsXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10sIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpID0+XHJcbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbiksXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ1dpdGNoZXIgMyBEYXRhJyksXHJcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcsXHJcbiAgKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclByb2ZpbGVGZWF0dXJlKFxyXG4gICAgJ2xvY2FsX21lcmdlcycsICdib29sZWFuJywgJ3NldHRpbmdzJywgJ1Byb2ZpbGUgRGF0YScsXHJcbiAgICAnVGhpcyBwcm9maWxlIHdpbGwgc3RvcmUgYW5kIHJlc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBkYXRhIChtZXJnZWQgc2NyaXB0cywgbG9hZG9yZGVyLCBldGMpIHdoZW4gc3dpdGNoaW5nIHByb2ZpbGVzJyxcclxuICAgICgpID0+IHtcclxuICAgICAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgcmV0dXJuIGFjdGl2ZUdhbWVJZCA9PT0gR0FNRV9JRDtcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCB0b2dnbGVNb2RzU3RhdGUgPSBhc3luYyAoZW5hYmxlZCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoY29udGV4dC5hcGkpO1xyXG4gICAgY29uc3QgbW9kTWFwID0gYXdhaXQgZ2V0QWxsTW9kcyhjb250ZXh0LmFwaSk7XHJcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihtb2ROYW1lID0+IG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSk7XHJcbiAgICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQpO1xyXG4gICAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIucmVkdWNlKChhY2N1bSwga2V5LCBpZHgpID0+IHtcclxuICAgICAgaWYgKHRvdGFsTG9ja2VkLmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKGxvYWRPcmRlcltpZHhdKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICAgIC4uLmxvYWRPcmRlcltpZHhdLFxyXG4gICAgICAgICAgZW5hYmxlZCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlLmlkLCBuZXdMTyBhcyBhbnkpKTtcclxuICB9O1xyXG4gIGNvbnN0IHByb3BzID0ge1xyXG4gICAgb25Ub2dnbGVNb2RzU3RhdGU6IHRvZ2dsZU1vZHNTdGF0ZSxcclxuICAgIGFwaTogY29udGV4dC5hcGksXHJcbiAgICBnZXRQcmlvcml0eU1hbmFnZXIsXHJcbiAgfVxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIobmV3IFRXM0xvYWRPcmRlcihwcm9wcykpO1xyXG4gIC8vIGNvbnRleHQucmVnaXN0ZXJUZXN0KCd0dzMtbW9kLWxpbWl0LWJyZWFjaCcsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gIC8vICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcclxuICAvLyBjb250ZXh0LnJlZ2lzdGVyVGVzdCgndHczLW1vZC1saW1pdC1icmVhY2gnLCAnbW9kLWFjdGl2YXRlZCcsXHJcbiAgLy8gICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RNb2RMaW1pdEJyZWFjaChjb250ZXh0LmFwaSwgbW9kTGltaXRQYXRjaGVyKSkpO1xyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgcHJpb3JpdHlNYW5hZ2VyID0gbmV3IFByaW9yaXR5TWFuYWdlcihjb250ZXh0LmFwaSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpO1xyXG4gICAgLy8gbW9kTGltaXRQYXRjaGVyID0gbmV3IE1vZExpbWl0UGF0Y2hlcihjb250ZXh0LmFwaSk7XHJcbiAgICBsb2FkT3JkZXIgPSBuZXcgVFczTG9hZE9yZGVyKHtcclxuICAgICAgYXBpOiBjb250ZXh0LmFwaSxcclxuICAgICAgZ2V0UHJpb3JpdHlNYW5hZ2VyLFxyXG4gICAgICBvblRvZ2dsZU1vZHNTdGF0ZTogdG9nZ2xlTW9kc1N0YXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIG9uR2FtZU1vZGVBY3RpdmF0aW9uKGNvbnRleHQuYXBpKSk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3Byb2ZpbGUtd2lsbC1jaGFuZ2UnLCBvblByb2ZpbGVXaWxsQ2hhbmdlKGNvbnRleHQuYXBpKSk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ21vZHMtZW5hYmxlZCcsIG9uTW9kc0Rpc2FibGVkKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpKTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCd3aWxsLWRlcGxveScsIG9uV2lsbERlcGxveShjb250ZXh0LmFwaSkgYXMgYW55KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBvbkRpZERlcGxveShjb250ZXh0LmFwaSkgYXMgYW55KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIG9uRGlkUHVyZ2UoY29udGV4dC5hcGksIGdldFByaW9yaXR5TWFuYWdlcikgYXMgYW55KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1yZW1vdmUtbW9kJywgb25EaWRSZW1vdmVNb2QoY29udGV4dC5hcGksIGdldFByaW9yaXR5TWFuYWdlcikgYXMgYW55KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2V0dGluZ3MnLCAnd2l0Y2hlcjMnXSwgb25TZXR0aW5nc0NoYW5nZShjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKSBhcyBhbnkpO1xyXG4gIH0pO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=