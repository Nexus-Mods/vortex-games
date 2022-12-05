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
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const walk = require('turbowalk').default;
const loadorder_1 = require("./loadorder");
const constants_1 = require("./constants");
const collections_1 = require("./collections");
const MorrowindCollectionsDataView_1 = __importDefault(require("./views/MorrowindCollectionsDataView"));
const migrations_1 = require("./migrations");
const STEAMAPP_ID = '22320';
const GOG_ID = '1435828767';
const MS_ID = 'BethesdaSoftworks.TESMorrowind-PC';
const GAME_ID = constants_1.MORROWIND_ID;
const localeFoldersXbox = {
    en: 'Morrowind GOTY English',
    fr: 'Morrowind GOTY French',
    de: 'Morrowind GOTY German',
};
const gameStoreIds = {
    steam: [{ id: STEAMAPP_ID, prefer: 0 }],
    xbox: [{ id: MS_ID }],
    gog: [{ id: GOG_ID }],
    registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\oblivion:Installed Path' }],
};
const tools = [
    {
        id: 'tes3edit',
        name: 'TES3Edit',
        executable: () => 'TES3Edit.exe',
        requiredFiles: []
    },
    {
        id: 'mw-construction-set',
        name: 'Construction Set',
        logo: 'constructionset.png',
        executable: () => 'TES Construction Set.exe',
        requiredFiles: [
            'TES Construction Set.exe',
        ],
        relative: true,
        exclusive: true
    }
];
function findGame() {
    return __awaiter(this, void 0, void 0, function* () {
        const storeGames = yield vortex_api_1.util.GameStoreHelper.find(gameStoreIds).catch(() => []);
        if (!storeGames.length)
            return;
        if (storeGames.length > 1)
            (0, vortex_api_1.log)('debug', 'Mutliple copies of Oblivion found', storeGames.map(s => s.gameStoreId));
        const selectedGame = storeGames[0];
        if (['epic', 'xbox'].includes(selectedGame.gameStoreId)) {
            (0, vortex_api_1.log)('debug', 'Defaulting to the English game version', { store: selectedGame.gameStoreId, folder: localeFoldersXbox['en'] });
            selectedGame.gamePath = path_1.default.join(selectedGame.gamePath, localeFoldersXbox['en']);
        }
        return selectedGame;
    });
}
function prepareForModding(api, discovery) {
    var _a;
    const gameName = ((_a = vortex_api_1.util.getGame(GAME_ID)) === null || _a === void 0 ? void 0 : _a.name) || 'This game';
    if (discovery.store && ['epic', 'xbox'].includes(discovery.store)) {
        const storeName = discovery.store === 'epic' ? 'Epic Games' : 'Xbox Game Pass';
        api.sendNotification({
            id: `${GAME_ID}-locale-message`,
            type: 'info',
            title: 'Multiple Languages Available',
            message: 'Default: English',
            allowSuppress: true,
            actions: [
                {
                    title: 'More',
                    action: (dismiss) => {
                        dismiss();
                        api.showDialog('info', 'Mutliple Languages Available', {
                            bbcode: '{{gameName}} has multiple language options when downloaded from {{storeName}}. [br][/br][br][/br]' +
                                'Vortex has selected the English variant by default. [br][/br][br][/br]' +
                                'If you would prefer to manage a different language you can change the path to the game using the "Manually Set Location" option in the games tab.',
                            parameters: { gameName, storeName }
                        }, [
                            { label: 'Close', action: () => api.suppressNotification(`${GAME_ID}-locale-message`) }
                        ]);
                    }
                }
            ]
        });
    }
}
function CollectionDataWrap(api, props) {
    return React.createElement(MorrowindCollectionsDataView_1.default, Object.assign(Object.assign({}, props), { api }));
}
function main(context) {
    context.registerGame({
        id: constants_1.MORROWIND_ID,
        name: 'Morrowind',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: tools,
        setup: (discovery) => prepareForModding(context.api, discovery),
        queryModPath: () => 'Data Files',
        logo: 'gameart.jpg',
        executable: () => 'morrowind.exe',
        requiredFiles: [
            'morrowind.exe',
        ],
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: parseInt(STEAMAPP_ID, 10),
            gogAppId: GOG_ID
        },
    });
    context.registerLoadOrder({
        gameId: constants_1.MORROWIND_ID,
        deserializeLoadOrder: () => (0, loadorder_1.deserializeLoadOrder)(context.api),
        serializeLoadOrder: (loadOrder) => (0, loadorder_1.serializeLoadOrder)(context.api, loadOrder),
        validate: loadorder_1.validate,
        noCollectionGeneration: true,
        toggleableEntries: true,
        usageInstructions: (() => 'Drag your plugins as needed - the game will load '
            + 'load them from top to bottom.'),
    });
    context.optional.registerCollectionFeature('morrowind_collection_data', (gameId, includedMods, collection) => (0, collections_1.genCollectionsData)(context, gameId, includedMods, collection), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Load Order'), (state, gameId) => gameId === constants_1.MORROWIND_ID, (props) => CollectionDataWrap(context.api, props));
    context.registerMigration(old => (0, migrations_1.migrate103)(context.api, old));
    context.once(() => {
        context.api.events.on('did-install-mod', (gameId, archiveId, modId) => __awaiter(this, void 0, void 0, function* () {
            if (gameId !== constants_1.MORROWIND_ID) {
                return;
            }
            const state = context.api.getState();
            const installPath = vortex_api_1.selectors.installPathForGame(state, constants_1.MORROWIND_ID);
            const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', constants_1.MORROWIND_ID, modId], undefined);
            if (installPath === undefined || mod === undefined) {
                return;
            }
            const modPath = path_1.default.join(installPath, mod.installationPath);
            const plugins = [];
            yield walk(modPath, entries => {
                for (let entry of entries) {
                    if (['.esp', '.esm'].includes(path_1.default.extname(entry.filePath.toLowerCase()))) {
                        plugins.push(path_1.default.basename(entry.filePath));
                    }
                }
            }, { recurse: true, skipLinks: true, skipInaccessible: true });
            if (plugins.length > 0) {
                context.api.store.dispatch(vortex_api_1.actions.setModAttribute(constants_1.MORROWIND_ID, mod.id, 'plugins', plugins));
            }
        }));
    });
    return true;
}
module.exports = {
    default: main
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUFrRTtBQUVsRSw2Q0FBK0I7QUFFL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUUxQywyQ0FBaUY7QUFDakYsMkNBQTJDO0FBSTNDLCtDQUF5RTtBQUV6RSx3R0FBZ0Y7QUFFaEYsNkNBQTBDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsbUNBQW1DLENBQUM7QUFFbEQsTUFBTSxPQUFPLEdBQUcsd0JBQVksQ0FBQztBQUU3QixNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLEVBQUUsRUFBRSx3QkFBd0I7SUFDNUIsRUFBRSxFQUFFLHVCQUF1QjtJQUMzQixFQUFFLEVBQUUsdUJBQXVCO0NBQzVCLENBQUE7QUFFRCxNQUFNLFlBQVksR0FBUTtJQUN4QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3JCLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ3JCLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLHVGQUF1RixFQUFFLENBQUM7Q0FDNUcsQ0FBQztBQUVGLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRSxFQUFFO0tBQ2xCO0lBQ0Q7UUFDRSxFQUFFLEVBQUUscUJBQXFCO1FBQ3pCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQTBCO1FBQzVDLGFBQWEsRUFBRTtZQUNiLDBCQUEwQjtTQUMzQjtRQUNELFFBQVEsRUFBRSxJQUFJO1FBQ2QsU0FBUyxFQUFFLElBQUk7S0FDaEI7Q0FDRixDQUFDO0FBRUYsU0FBZSxRQUFROztRQUNyQixNQUFNLFVBQVUsR0FBRyxNQUFNLGlCQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFakYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO1lBQUUsT0FBTztRQUUvQixJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUFFLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsbUNBQW1DLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRWpILE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFHdkQsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3Q0FBd0MsRUFBRSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0gsWUFBWSxDQUFDLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNuRjtRQUNELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7Q0FBQTtBQW9CRCxTQUFTLGlCQUFpQixDQUFDLEdBQXdCLEVBQUUsU0FBaUM7O0lBQ3BGLE1BQU0sUUFBUSxHQUFHLENBQUEsTUFBQSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsMENBQUUsSUFBSSxLQUFJLFdBQVcsQ0FBQztJQUk1RCxJQUFJLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNqRSxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztRQUUvRSxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDbkIsRUFBRSxFQUFFLEdBQUcsT0FBTyxpQkFBaUI7WUFDL0IsSUFBSSxFQUFFLE1BQU07WUFDWixLQUFLLEVBQUUsOEJBQThCO1lBQ3JDLE9BQU8sRUFBRSxrQkFBa0I7WUFDM0IsYUFBYSxFQUFFLElBQUk7WUFDbkIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLEtBQUssRUFBRSxNQUFNO29CQUNiLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFO3dCQUNsQixPQUFPLEVBQUUsQ0FBQzt3QkFDVixHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSw4QkFBOEIsRUFBRTs0QkFDckQsTUFBTSxFQUFFLG1HQUFtRztnQ0FDekcsd0VBQXdFO2dDQUN4RSxtSkFBbUo7NEJBQ3JKLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7eUJBQ3BDLEVBQ0Q7NEJBQ0UsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsR0FBRyxPQUFPLGlCQUFpQixDQUFDLEVBQUU7eUJBQ3hGLENBQ0EsQ0FBQztvQkFDSixDQUFDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7S0FDSjtBQUNILENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLEdBQXdCLEVBQUUsS0FBOEI7SUFDbEYsT0FBTyxLQUFLLENBQUMsYUFBYSxDQUFDLHNDQUE0QixrQ0FBTyxLQUFLLEtBQUUsR0FBRyxJQUFJLENBQUM7QUFDL0UsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFDLE9BQU87SUFDbkIsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUNuQixFQUFFLEVBQUUsd0JBQVk7UUFDaEIsSUFBSSxFQUFFLFdBQVc7UUFDakIsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsUUFBUTtRQUNuQixjQUFjLEVBQUUsS0FBSztRQUNyQixLQUFLLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDO1FBQy9ELFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZO1FBQ2hDLElBQUksRUFBRSxhQUFhO1FBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlO1FBQ2pDLGFBQWEsRUFBRTtZQUNiLGVBQWU7U0FDaEI7UUFFRCxXQUFXLEVBQUU7WUFDWCxVQUFVLEVBQUUsV0FBVztTQUN4QjtRQUNELE9BQU8sRUFBRTtZQUNQLFVBQVUsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUNyQyxRQUFRLEVBQUUsTUFBTTtTQUNqQjtLQUNGLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUN4QixNQUFNLEVBQUUsd0JBQVk7UUFDcEIsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSxnQ0FBb0IsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQzdELGtCQUFrQixFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFBLDhCQUFrQixFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDO1FBQzdFLFFBQVEsRUFBUixvQkFBUTtRQUNSLHNCQUFzQixFQUFFLElBQUk7UUFDNUIsaUJBQWlCLEVBQUUsSUFBSTtRQUN2QixpQkFBaUIsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLG1EQUFtRDtjQUNuRCwrQkFBK0IsQ0FBQztLQUMzRCxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUN4QywyQkFBMkIsRUFDM0IsQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQ25DLElBQUEsZ0NBQWtCLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLEVBQy9ELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQ3JCLElBQUEsa0NBQW9CLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFDbkQsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUN2QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUN0QixDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sS0FBSyx3QkFBWSxFQUMxQyxDQUFDLEtBQThCLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUU5RSxPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQy9ELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFPLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDMUUsSUFBSSxNQUFNLEtBQUssd0JBQVksRUFBRTtnQkFDM0IsT0FBTzthQUNSO1lBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSx3QkFBWSxDQUFDLENBQUM7WUFDdEUsTUFBTSxHQUFHLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSx3QkFBWSxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3hGLElBQUksV0FBVyxLQUFLLFNBQVMsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO2dCQUNsRCxPQUFPO2FBQ1I7WUFDRCxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM3RCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDbkIsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUM1QixLQUFLLElBQUksS0FBSyxJQUFJLE9BQU8sRUFBRTtvQkFDekIsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRTt3QkFDekUsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO3FCQUM3QztpQkFDRjtZQUNILENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELElBQUssT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGVBQWUsQ0FBQyx3QkFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDL0Y7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB3aW5hcGkgZnJvbSAnd2luYXBpLWJpbmRpbmdzJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5cclxuY29uc3Qgd2FsayA9IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQ7XHJcblxyXG5pbXBvcnQgeyB2YWxpZGF0ZSwgZGVzZXJpYWxpemVMb2FkT3JkZXIsIHNlcmlhbGl6ZUxvYWRPcmRlciB9IGZyb20gJy4vbG9hZG9yZGVyJztcclxuaW1wb3J0IHsgTU9SUk9XSU5EX0lEIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgfSBmcm9tICcuL3R5cGVzL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zJztcclxuXHJcbmltcG9ydCBNb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vdmlld3MvTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldyc7XHJcblxyXG5pbXBvcnQgeyBtaWdyYXRlMTAzIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmNvbnN0IFNURUFNQVBQX0lEID0gJzIyMzIwJztcclxuY29uc3QgR09HX0lEID0gJzE0MzU4Mjg3NjcnO1xyXG5jb25zdCBNU19JRCA9ICdCZXRoZXNkYVNvZnR3b3Jrcy5URVNNb3Jyb3dpbmQtUEMnO1xyXG5cclxuY29uc3QgR0FNRV9JRCA9IE1PUlJPV0lORF9JRDtcclxuXHJcbmNvbnN0IGxvY2FsZUZvbGRlcnNYYm94ID0ge1xyXG4gIGVuOiAnTW9ycm93aW5kIEdPVFkgRW5nbGlzaCcsXHJcbiAgZnI6ICdNb3Jyb3dpbmQgR09UWSBGcmVuY2gnLFxyXG4gIGRlOiAnTW9ycm93aW5kIEdPVFkgR2VybWFuJyxcclxufVxyXG5cclxuY29uc3QgZ2FtZVN0b3JlSWRzOiBhbnkgPSB7XHJcbiAgc3RlYW06IFt7IGlkOiBTVEVBTUFQUF9JRCwgcHJlZmVyOiAwIH1dLFxyXG4gIHhib3g6IFt7IGlkOiBNU19JRCB9XSxcclxuICBnb2c6IFt7IGlkOiBHT0dfSUQgfV0sXHJcbiAgcmVnaXN0cnk6IFt7IGlkOiAnSEtFWV9MT0NBTF9NQUNISU5FOlNvZnR3YXJlXFxcXFdvdzY0MzJOb2RlXFxcXEJldGhlc2RhIFNvZnR3b3Jrc1xcXFxvYmxpdmlvbjpJbnN0YWxsZWQgUGF0aCcgfV0sXHJcbn07XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICB7XHJcbiAgICBpZDogJ3RlczNlZGl0JyxcclxuICAgIG5hbWU6ICdURVMzRWRpdCcsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTM0VkaXQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogJ213LWNvbnN0cnVjdGlvbi1zZXQnLFxyXG4gICAgbmFtZTogJ0NvbnN0cnVjdGlvbiBTZXQnLFxyXG4gICAgbG9nbzogJ2NvbnN0cnVjdGlvbnNldC5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdURVMgQ29uc3RydWN0aW9uIFNldC5leGUnLFxyXG4gICAgXSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhjbHVzaXZlOiB0cnVlXHJcbiAgfVxyXG5dO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgY29uc3Qgc3RvcmVHYW1lcyA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmQoZ2FtZVN0b3JlSWRzKS5jYXRjaCgoKSA9PiBbXSk7XHJcblxyXG4gIGlmICghc3RvcmVHYW1lcy5sZW5ndGgpIHJldHVybjtcclxuICBcclxuICBpZiAoc3RvcmVHYW1lcy5sZW5ndGggPiAxKSBsb2coJ2RlYnVnJywgJ011dGxpcGxlIGNvcGllcyBvZiBPYmxpdmlvbiBmb3VuZCcsIHN0b3JlR2FtZXMubWFwKHMgPT4gcy5nYW1lU3RvcmVJZCkpO1xyXG5cclxuICBjb25zdCBzZWxlY3RlZEdhbWUgPSBzdG9yZUdhbWVzWzBdO1xyXG4gIGlmIChbJ2VwaWMnLCAneGJveCddLmluY2x1ZGVzKHNlbGVjdGVkR2FtZS5nYW1lU3RvcmVJZCkpIHtcclxuICAgIC8vIEdldCB0aGUgdXNlcidzIGNob3NlbiBsYW5ndWFnZVxyXG4gICAgLy8gc3RhdGUuaW50ZXJmYWNlLmxhbmd1YWdlIHx8ICdlbic7XHJcbiAgICBsb2coJ2RlYnVnJywgJ0RlZmF1bHRpbmcgdG8gdGhlIEVuZ2xpc2ggZ2FtZSB2ZXJzaW9uJywgeyBzdG9yZTogc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkLCBmb2xkZXI6IGxvY2FsZUZvbGRlcnNYYm94WydlbiddIH0pO1xyXG4gICAgc2VsZWN0ZWRHYW1lLmdhbWVQYXRoID0gcGF0aC5qb2luKHNlbGVjdGVkR2FtZS5nYW1lUGF0aCwgbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10pO1xyXG4gIH1cclxuICByZXR1cm4gc2VsZWN0ZWRHYW1lO1xyXG59XHJcblxyXG4vKiBNb3Jyb3dpbmQgc2VlbXMgdG8gc3RhcnQgZmluZSB3aGVuIHJ1bm5pbmcgZGlyZWN0bHkuIElmIHdlIGRvIGdvIHRocm91Z2ggdGhlIGxhdW5jaGVyIHRoZW4gdGhlIGxhbmd1YWdlIHZlcnNpb24gYmVpbmdcclxuICAgc3RhcnRlZCBtaWdodCBub3QgYmUgdGhlIG9uZSB3ZSdyZSBtb2RkaW5nXHJcblxyXG5mdW5jdGlvbiByZXF1aXJlc0xhdW5jaGVyKGdhbWVQYXRoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtNU19JRF0sICd4Ym94JylcclxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIGxhdW5jaGVyOiAneGJveCcsXHJcbiAgICAgIGFkZEluZm86IHtcclxuICAgICAgICBhcHBJZDogTVNfSUQsXHJcbiAgICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgICAgeyBhcHBFeGVjTmFtZTogJ0dhbWUnIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcclxufVxyXG4qL1xyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcclxuICBjb25zdCBnYW1lTmFtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKT8ubmFtZSB8fCAnVGhpcyBnYW1lJztcclxuXHJcbiAgLy8gdGhlIGdhbWUgZG9lc24ndCBhY3R1YWxseSBleGlzdCBvbiB0aGUgZXBpYyBnYW1lIHN0b3JlLCB0aGlzIGNodW5rIGlzIGNvcHkmcGFzdGVkLCBkb2Vzbid0IGh1cnRcclxuICAvLyBrZWVwaW5nIGl0IGlkZW50aWNhbFxyXG4gIGlmIChkaXNjb3Zlcnkuc3RvcmUgJiYgWydlcGljJywgJ3hib3gnXS5pbmNsdWRlcyhkaXNjb3Zlcnkuc3RvcmUpKSB7XHJcbiAgICBjb25zdCBzdG9yZU5hbWUgPSBkaXNjb3Zlcnkuc3RvcmUgPT09ICdlcGljJyA/ICdFcGljIEdhbWVzJyA6ICdYYm94IEdhbWUgUGFzcyc7XHJcbiAgICAvLyBJZiB0aGlzIGlzIGFuIEVwaWMgb3IgWGJveCBnYW1lIHdlJ3ZlIGRlZmF1bHRlZCB0byBFbmdsaXNoLCBzbyB3ZSBzaG91bGQgbGV0IHRoZSB1c2VyIGtub3cuXHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiBgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWAsXHJcbiAgICAgIHR5cGU6ICdpbmZvJyxcclxuICAgICAgdGl0bGU6ICdNdWx0aXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJyxcclxuICAgICAgbWVzc2FnZTogJ0RlZmF1bHQ6IEVuZ2xpc2gnLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcclxuICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdNdXRsaXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJywge1xyXG4gICAgICAgICAgICAgIGJiY29kZTogJ3t7Z2FtZU5hbWV9fSBoYXMgbXVsdGlwbGUgbGFuZ3VhZ2Ugb3B0aW9ucyB3aGVuIGRvd25sb2FkZWQgZnJvbSB7e3N0b3JlTmFtZX19LiBbYnJdWy9icl1bYnJdWy9icl0nK1xyXG4gICAgICAgICAgICAgICAgJ1ZvcnRleCBoYXMgc2VsZWN0ZWQgdGhlIEVuZ2xpc2ggdmFyaWFudCBieSBkZWZhdWx0LiBbYnJdWy9icl1bYnJdWy9icl0nK1xyXG4gICAgICAgICAgICAgICAgJ0lmIHlvdSB3b3VsZCBwcmVmZXIgdG8gbWFuYWdlIGEgZGlmZmVyZW50IGxhbmd1YWdlIHlvdSBjYW4gY2hhbmdlIHRoZSBwYXRoIHRvIHRoZSBnYW1lIHVzaW5nIHRoZSBcIk1hbnVhbGx5IFNldCBMb2NhdGlvblwiIG9wdGlvbiBpbiB0aGUgZ2FtZXMgdGFiLicsXHJcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczogeyBnYW1lTmFtZSwgc3RvcmVOYW1lIH1cclxuICAgICAgICAgICAgfSwgXHJcbiAgICAgICAgICAgIFsgXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiBhcGkuc3VwcHJlc3NOb3RpZmljYXRpb24oYCR7R0FNRV9JRH0tbG9jYWxlLW1lc3NhZ2VgKSB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ29sbGVjdGlvbkRhdGFXcmFwKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvcHM6IElFeHRlbmRlZEludGVyZmFjZVByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcsIHsgLi4ucHJvcHMsIGFwaSwgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBNT1JST1dJTkRfSUQsXHJcbiAgICBuYW1lOiAnTW9ycm93aW5kJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXHJcbiAgICBzZXR1cDogKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSksXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdEYXRhIEZpbGVzJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnbW9ycm93aW5kLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdtb3Jyb3dpbmQuZXhlJyxcclxuICAgIF0sXHJcbiAgICAvLyByZXF1aXJlc0xhdW5jaGVyLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiBwYXJzZUludChTVEVBTUFQUF9JRCwgMTApLFxyXG4gICAgICBnb2dBcHBJZDogR09HX0lEXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcclxuICAgIGdhbWVJZDogTU9SUk9XSU5EX0lELFxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpKSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IHRydWUsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+ICdEcmFnIHlvdXIgcGx1Z2lucyBhcyBuZWVkZWQgLSB0aGUgZ2FtZSB3aWxsIGxvYWQgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnbG9hZCB0aGVtIGZyb20gdG9wIHRvIGJvdHRvbS4nKSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ21vcnJvd2luZF9jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZCwgY29sbGVjdGlvbikgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ0xvYWQgT3JkZXInKSxcclxuICAgIChzdGF0ZSwgZ2FtZUlkKSA9PiBnYW1lSWQgPT09IE1PUlJPV0lORF9JRCxcclxuICAgIChwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpID0+IENvbGxlY3Rpb25EYXRhV3JhcChjb250ZXh0LmFwaSwgcHJvcHMpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTEwMyhjb250ZXh0LmFwaSwgb2xkKSk7XHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgYXN5bmMgKGdhbWVJZCwgYXJjaGl2ZUlkLCBtb2RJZCkgPT4ge1xyXG4gICAgICBpZiAoZ2FtZUlkICE9PSBNT1JST1dJTkRfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBNT1JST1dJTkRfSUQpO1xyXG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgTU9SUk9XSU5EX0lELCBtb2RJZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChpbnN0YWxsUGF0aCA9PT0gdW5kZWZpbmVkIHx8IG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgY29uc3QgcGx1Z2lucyA9IFtdO1xyXG4gICAgICBhd2FpdCB3YWxrKG1vZFBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgICAgIGlmIChbJy5lc3AnLCAnLmVzbSddLmluY2x1ZGVzKHBhdGguZXh0bmFtZShlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpKSkpIHtcclxuICAgICAgICAgICAgcGx1Z2lucy5wdXNoKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH0pO1xyXG4gICAgICBpZiAoIHBsdWdpbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKE1PUlJPV0lORF9JRCwgbW9kLmlkLCAncGx1Z2lucycsIHBsdWdpbnMpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluXHJcbn07XHJcbiJdfQ==