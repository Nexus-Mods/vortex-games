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
    registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\Morrowind:Installed Path' }],
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
    return Promise.resolve();
}
function CollectionDataWrap(api, props) {
    return React.createElement(MorrowindCollectionsDataView_1.default, Object.assign(Object.assign({}, props), { api }));
}
function main(context) {
    context.registerGame({
        id: constants_1.MORROWIND_ID,
        name: 'Morrowind',
        mergeMods: true,
        queryPath: vortex_api_1.util.toBlue(findGame),
        supportedTools: tools,
        setup: vortex_api_1.util.toBlue((discovery) => prepareForModding(context.api, discovery)),
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
        usageInstructions: 'Drag your plugins as needed - the game will load '
            + 'load them from top to bottom.',
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
            try {
                yield walk(modPath, entries => {
                    for (let entry of entries) {
                        if (['.esp', '.esm'].includes(path_1.default.extname(entry.filePath.toLowerCase()))) {
                            plugins.push(path_1.default.basename(entry.filePath));
                        }
                    }
                }, { recurse: true, skipLinks: true, skipInaccessible: true });
            }
            catch (err) {
                context.api.showErrorNotification('Failed to read list of plugins', err, { allowReport: false });
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRTtBQUNsRSw2Q0FBK0I7QUFFL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUUxQywyQ0FBaUY7QUFDakYsMkNBQTJDO0FBSTNDLCtDQUF5RTtBQUV6RSx3R0FBZ0Y7QUFFaEYsNkNBQTBDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsbUNBQW1DLENBQUM7QUFFbEQsTUFBTSxPQUFPLEdBQUcsd0JBQVksQ0FBQztBQUU3QixNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLEVBQUUsRUFBRSx3QkFBd0I7SUFDNUIsRUFBRSxFQUFFLHVCQUF1QjtJQUMzQixFQUFFLEVBQUUsdUJBQXVCO0NBQzVCLENBQUE7QUFFRCxNQUFNLFlBQVksR0FBUTtJQUN4QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3JCLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ3JCLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLHdGQUF3RixFQUFFLENBQUM7Q0FDN0csQ0FBQztBQUVGLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRSxFQUFFO0tBQ2xCO0lBQ0Q7UUFDRSxFQUFFLEVBQUUscUJBQXFCO1FBQ3pCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQTBCO1FBQzVDLGFBQWEsRUFBRTtZQUNiLDBCQUEwQjtTQUMzQjtRQUNELFFBQVEsRUFBRSxJQUFJO1FBQ2QsU0FBUyxFQUFFLElBQUk7S0FDaEI7Q0FDRixDQUFDO0FBRUYsU0FBZSxRQUFROztRQUNyQixNQUFNLFVBQVUsR0FBRyxNQUFNLGlCQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFakYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO1lBQUUsT0FBTztRQUUvQixJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUFFLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsbUNBQW1DLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRWpILE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFHdkQsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3Q0FBd0MsRUFBRSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0gsWUFBWSxDQUFDLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNuRjtRQUNELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7Q0FBQTtBQW9CRCxTQUFTLGlCQUFpQixDQUFDLEdBQXdCLEVBQUUsU0FBaUM7O0lBQ3BGLE1BQU0sUUFBUSxHQUFHLENBQUEsTUFBQSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsMENBQUUsSUFBSSxLQUFJLFdBQVcsQ0FBQztJQUk1RCxJQUFJLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNqRSxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztRQUUvRSxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDbkIsRUFBRSxFQUFFLEdBQUcsT0FBTyxpQkFBaUI7WUFDL0IsSUFBSSxFQUFFLE1BQU07WUFDWixLQUFLLEVBQUUsOEJBQThCO1lBQ3JDLE9BQU8sRUFBRSxrQkFBa0I7WUFDM0IsYUFBYSxFQUFFLElBQUk7WUFDbkIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLEtBQUssRUFBRSxNQUFNO29CQUNiLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFO3dCQUNsQixPQUFPLEVBQUUsQ0FBQzt3QkFDVixHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSw4QkFBOEIsRUFBRTs0QkFDckQsTUFBTSxFQUFFLG1HQUFtRztnQ0FDekcsd0VBQXdFO2dDQUN4RSxtSkFBbUo7NEJBQ3JKLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7eUJBQ3BDLEVBQ0Q7NEJBQ0UsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsR0FBRyxPQUFPLGlCQUFpQixDQUFDLEVBQUU7eUJBQ3hGLENBQ0EsQ0FBQztvQkFDSixDQUFDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7S0FDSjtJQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzNCLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLEdBQXdCLEVBQUUsS0FBOEI7SUFDbEYsT0FBTyxLQUFLLENBQUMsYUFBYSxDQUFDLHNDQUE0QixrQ0FBTyxLQUFLLEtBQUUsR0FBRyxJQUFJLENBQUM7QUFDL0UsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFDLE9BQWdDO0lBQzVDLE9BQU8sQ0FBQyxZQUFZLENBQUM7UUFDbkIsRUFBRSxFQUFFLHdCQUFZO1FBQ2hCLElBQUksRUFBRSxXQUFXO1FBQ2pCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLGlCQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxjQUFjLEVBQUUsS0FBSztRQUNyQixLQUFLLEVBQUUsaUJBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDNUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVk7UUFDaEMsSUFBSSxFQUFFLGFBQWE7UUFDbkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWU7UUFDakMsYUFBYSxFQUFFO1lBQ2IsZUFBZTtTQUNoQjtRQUVELFdBQVcsRUFBRTtZQUNYLFVBQVUsRUFBRSxXQUFXO1NBQ3hCO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsVUFBVSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQ3JDLFFBQVEsRUFBRSxNQUFNO1NBQ2pCO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLGlCQUFpQixDQUFDO1FBQ3hCLE1BQU0sRUFBRSx3QkFBWTtRQUNwQixvQkFBb0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLGdDQUFvQixFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDN0Qsa0JBQWtCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLElBQUEsOEJBQWtCLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUM7UUFDN0UsUUFBUSxFQUFSLG9CQUFRO1FBQ1Isc0JBQXNCLEVBQUUsSUFBSTtRQUM1QixpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLGlCQUFpQixFQUFFLG1EQUFtRDtjQUNsRSwrQkFBK0I7S0FDcEMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FDeEMsMkJBQTJCLEVBQzNCLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUNuQyxJQUFBLGdDQUFrQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUMvRCxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUNyQixJQUFBLGtDQUFvQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQ25ELEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFDdkIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFDdEIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEtBQUssd0JBQVksRUFDMUMsQ0FBQyxLQUE4QixFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFOUUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSx1QkFBVSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMvRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBTyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzFFLElBQUksTUFBTSxLQUFLLHdCQUFZLEVBQUU7Z0JBQzNCLE9BQU87YUFDUjtZQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckMsTUFBTSxXQUFXLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsd0JBQVksQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sR0FBRyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsd0JBQVksRUFBRSxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RixJQUFJLFdBQVcsS0FBSyxTQUFTLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTtnQkFDbEQsT0FBTzthQUNSO1lBQ0QsTUFBTSxPQUFPLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDN0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ25CLElBQUk7Z0JBQ0YsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO29CQUM1QixLQUFLLElBQUksS0FBSyxJQUFJLE9BQU8sRUFBRTt3QkFDekIsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRTs0QkFDekUsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO3lCQUM3QztxQkFDRjtnQkFDSCxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQzthQUNoRTtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7YUFDbEc7WUFDRCxJQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxlQUFlLENBQUMsd0JBQVksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQy9GO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5cclxuY29uc3Qgd2FsayA9IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQ7XHJcblxyXG5pbXBvcnQgeyB2YWxpZGF0ZSwgZGVzZXJpYWxpemVMb2FkT3JkZXIsIHNlcmlhbGl6ZUxvYWRPcmRlciB9IGZyb20gJy4vbG9hZG9yZGVyJztcclxuaW1wb3J0IHsgTU9SUk9XSU5EX0lEIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5cclxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgfSBmcm9tICcuL3R5cGVzL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zJztcclxuXHJcbmltcG9ydCBNb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vdmlld3MvTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldyc7XHJcblxyXG5pbXBvcnQgeyBtaWdyYXRlMTAzIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmNvbnN0IFNURUFNQVBQX0lEID0gJzIyMzIwJztcclxuY29uc3QgR09HX0lEID0gJzE0MzU4Mjg3NjcnO1xyXG5jb25zdCBNU19JRCA9ICdCZXRoZXNkYVNvZnR3b3Jrcy5URVNNb3Jyb3dpbmQtUEMnO1xyXG5cclxuY29uc3QgR0FNRV9JRCA9IE1PUlJPV0lORF9JRDtcclxuXHJcbmNvbnN0IGxvY2FsZUZvbGRlcnNYYm94ID0ge1xyXG4gIGVuOiAnTW9ycm93aW5kIEdPVFkgRW5nbGlzaCcsXHJcbiAgZnI6ICdNb3Jyb3dpbmQgR09UWSBGcmVuY2gnLFxyXG4gIGRlOiAnTW9ycm93aW5kIEdPVFkgR2VybWFuJyxcclxufVxyXG5cclxuY29uc3QgZ2FtZVN0b3JlSWRzOiBhbnkgPSB7XHJcbiAgc3RlYW06IFt7IGlkOiBTVEVBTUFQUF9JRCwgcHJlZmVyOiAwIH1dLFxyXG4gIHhib3g6IFt7IGlkOiBNU19JRCB9XSxcclxuICBnb2c6IFt7IGlkOiBHT0dfSUQgfV0sXHJcbiAgcmVnaXN0cnk6IFt7IGlkOiAnSEtFWV9MT0NBTF9NQUNISU5FOlNvZnR3YXJlXFxcXFdvdzY0MzJOb2RlXFxcXEJldGhlc2RhIFNvZnR3b3Jrc1xcXFxNb3Jyb3dpbmQ6SW5zdGFsbGVkIFBhdGgnIH1dLFxyXG59O1xyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAge1xyXG4gICAgaWQ6ICd0ZXMzZWRpdCcsXHJcbiAgICBuYW1lOiAnVEVTM0VkaXQnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1RFUzNFZGl0LmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXVxyXG4gIH0sXHJcbiAge1xyXG4gICAgaWQ6ICdtdy1jb25zdHJ1Y3Rpb24tc2V0JyxcclxuICAgIG5hbWU6ICdDb25zdHJ1Y3Rpb24gU2V0JyxcclxuICAgIGxvZ286ICdjb25zdHJ1Y3Rpb25zZXQucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdURVMgQ29uc3RydWN0aW9uIFNldC5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnVEVTIENvbnN0cnVjdGlvbiBTZXQuZXhlJyxcclxuICAgIF0sXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIGV4Y2x1c2l2ZTogdHJ1ZVxyXG4gIH1cclxuXTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIGNvbnN0IHN0b3JlR2FtZXMgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kKGdhbWVTdG9yZUlkcykuY2F0Y2goKCkgPT4gW10pO1xyXG5cclxuICBpZiAoIXN0b3JlR2FtZXMubGVuZ3RoKSByZXR1cm47XHJcbiAgXHJcbiAgaWYgKHN0b3JlR2FtZXMubGVuZ3RoID4gMSkgbG9nKCdkZWJ1ZycsICdNdXRsaXBsZSBjb3BpZXMgb2YgT2JsaXZpb24gZm91bmQnLCBzdG9yZUdhbWVzLm1hcChzID0+IHMuZ2FtZVN0b3JlSWQpKTtcclxuXHJcbiAgY29uc3Qgc2VsZWN0ZWRHYW1lID0gc3RvcmVHYW1lc1swXTtcclxuICBpZiAoWydlcGljJywgJ3hib3gnXS5pbmNsdWRlcyhzZWxlY3RlZEdhbWUuZ2FtZVN0b3JlSWQpKSB7XHJcbiAgICAvLyBHZXQgdGhlIHVzZXIncyBjaG9zZW4gbGFuZ3VhZ2VcclxuICAgIC8vIHN0YXRlLmludGVyZmFjZS5sYW5ndWFnZSB8fCAnZW4nO1xyXG4gICAgbG9nKCdkZWJ1ZycsICdEZWZhdWx0aW5nIHRvIHRoZSBFbmdsaXNoIGdhbWUgdmVyc2lvbicsIHsgc3RvcmU6IHNlbGVjdGVkR2FtZS5nYW1lU3RvcmVJZCwgZm9sZGVyOiBsb2NhbGVGb2xkZXJzWGJveFsnZW4nXSB9KTtcclxuICAgIHNlbGVjdGVkR2FtZS5nYW1lUGF0aCA9IHBhdGguam9pbihzZWxlY3RlZEdhbWUuZ2FtZVBhdGgsIGxvY2FsZUZvbGRlcnNYYm94WydlbiddKTtcclxuICB9XHJcbiAgcmV0dXJuIHNlbGVjdGVkR2FtZTtcclxufVxyXG5cclxuLyogTW9ycm93aW5kIHNlZW1zIHRvIHN0YXJ0IGZpbmUgd2hlbiBydW5uaW5nIGRpcmVjdGx5LiBJZiB3ZSBkbyBnbyB0aHJvdWdoIHRoZSBsYXVuY2hlciB0aGVuIHRoZSBsYW5ndWFnZSB2ZXJzaW9uIGJlaW5nXHJcbiAgIHN0YXJ0ZWQgbWlnaHQgbm90IGJlIHRoZSBvbmUgd2UncmUgbW9kZGluZ1xyXG5cclxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcihnYW1lUGF0aCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbTVNfSURdLCAneGJveCcpXHJcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBsYXVuY2hlcjogJ3hib3gnLFxyXG4gICAgICBhZGRJbmZvOiB7XHJcbiAgICAgICAgYXBwSWQ6IE1TX0lELFxyXG4gICAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICAgIHsgYXBwRXhlY05hbWU6ICdHYW1lJyB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH1cclxuICAgIH0pKVxyXG4gICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSk7XHJcbn1cclxuKi9cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XHJcbiAgY29uc3QgZ2FtZU5hbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk/Lm5hbWUgfHwgJ1RoaXMgZ2FtZSc7XHJcblxyXG4gIC8vIHRoZSBnYW1lIGRvZXNuJ3QgYWN0dWFsbHkgZXhpc3Qgb24gdGhlIGVwaWMgZ2FtZSBzdG9yZSwgdGhpcyBjaHVuayBpcyBjb3B5JnBhc3RlZCwgZG9lc24ndCBodXJ0XHJcbiAgLy8ga2VlcGluZyBpdCBpZGVudGljYWxcclxuICBpZiAoZGlzY292ZXJ5LnN0b3JlICYmIFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoZGlzY292ZXJ5LnN0b3JlKSkge1xyXG4gICAgY29uc3Qgc3RvcmVOYW1lID0gZGlzY292ZXJ5LnN0b3JlID09PSAnZXBpYycgPyAnRXBpYyBHYW1lcycgOiAnWGJveCBHYW1lIFBhc3MnO1xyXG4gICAgLy8gSWYgdGhpcyBpcyBhbiBFcGljIG9yIFhib3ggZ2FtZSB3ZSd2ZSBkZWZhdWx0ZWQgdG8gRW5nbGlzaCwgc28gd2Ugc2hvdWxkIGxldCB0aGUgdXNlciBrbm93LlxyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogYCR7R0FNRV9JRH0tbG9jYWxlLW1lc3NhZ2VgLFxyXG4gICAgICB0eXBlOiAnaW5mbycsXHJcbiAgICAgIHRpdGxlOiAnTXVsdGlwbGUgTGFuZ3VhZ2VzIEF2YWlsYWJsZScsXHJcbiAgICAgIG1lc3NhZ2U6ICdEZWZhdWx0OiBFbmdsaXNoJyxcclxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnTXV0bGlwbGUgTGFuZ3VhZ2VzIEF2YWlsYWJsZScsIHtcclxuICAgICAgICAgICAgICBiYmNvZGU6ICd7e2dhbWVOYW1lfX0gaGFzIG11bHRpcGxlIGxhbmd1YWdlIG9wdGlvbnMgd2hlbiBkb3dubG9hZGVkIGZyb20ge3tzdG9yZU5hbWV9fS4gW2JyXVsvYnJdW2JyXVsvYnJdJytcclxuICAgICAgICAgICAgICAgICdWb3J0ZXggaGFzIHNlbGVjdGVkIHRoZSBFbmdsaXNoIHZhcmlhbnQgYnkgZGVmYXVsdC4gW2JyXVsvYnJdW2JyXVsvYnJdJytcclxuICAgICAgICAgICAgICAgICdJZiB5b3Ugd291bGQgcHJlZmVyIHRvIG1hbmFnZSBhIGRpZmZlcmVudCBsYW5ndWFnZSB5b3UgY2FuIGNoYW5nZSB0aGUgcGF0aCB0byB0aGUgZ2FtZSB1c2luZyB0aGUgXCJNYW51YWxseSBTZXQgTG9jYXRpb25cIiBvcHRpb24gaW4gdGhlIGdhbWVzIHRhYi4nLFxyXG4gICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHsgZ2FtZU5hbWUsIHN0b3JlTmFtZSB9XHJcbiAgICAgICAgICAgIH0sIFxyXG4gICAgICAgICAgICBbIFxyXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gYXBpLnN1cHByZXNzTm90aWZpY2F0aW9uKGAke0dBTUVfSUR9LWxvY2FsZS1tZXNzYWdlYCkgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBDb2xsZWN0aW9uRGF0YVdyYXAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpOiBKU1guRWxlbWVudCB7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldywgeyAuLi5wcm9wcywgYXBpLCB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBNT1JST1dJTkRfSUQsXHJcbiAgICBuYW1lOiAnTW9ycm93aW5kJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogdXRpbC50b0JsdWUoZmluZEdhbWUpLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IHRvb2xzLFxyXG4gICAgc2V0dXA6IHV0aWwudG9CbHVlKChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpKSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ0RhdGEgRmlsZXMnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdtb3Jyb3dpbmQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ21vcnJvd2luZC5leGUnLFxyXG4gICAgXSxcclxuICAgIC8vIHJlcXVpcmVzTGF1bmNoZXIsXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTUFQUF9JRCxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IHBhcnNlSW50KFNURUFNQVBQX0lELCAxMCksXHJcbiAgICAgIGdvZ0FwcElkOiBHT0dfSURcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xyXG4gICAgZ2FtZUlkOiBNT1JST1dJTkRfSUQsXHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGkpLFxyXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGksIGxvYWRPcmRlciksXHJcbiAgICB2YWxpZGF0ZSxcclxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogdHJ1ZSxcclxuICAgIHVzYWdlSW5zdHJ1Y3Rpb25zOiAnRHJhZyB5b3VyIHBsdWdpbnMgYXMgbmVlZGVkIC0gdGhlIGdhbWUgd2lsbCBsb2FkICdcclxuICAgICAgKyAnbG9hZCB0aGVtIGZyb20gdG9wIHRvIGJvdHRvbS4nLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXHJcbiAgICAnbW9ycm93aW5kX2NvbGxlY3Rpb25fZGF0YScsXHJcbiAgICAoZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pID0+XHJcbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbiksXHJcbiAgICAoZ2FtZUlkLCBjb2xsZWN0aW9uKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXHJcbiAgICAodCkgPT4gdCgnTG9hZCBPcmRlcicpLFxyXG4gICAgKHN0YXRlLCBnYW1lSWQpID0+IGdhbWVJZCA9PT0gTU9SUk9XSU5EX0lELFxyXG4gICAgKHByb3BzOiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcykgPT4gQ29sbGVjdGlvbkRhdGFXcmFwKGNvbnRleHQuYXBpLCBwcm9wcykpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMTAzKGNvbnRleHQuYXBpLCBvbGQpKTtcclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdkaWQtaW5zdGFsbC1tb2QnLCBhc3luYyAoZ2FtZUlkLCBhcmNoaXZlSWQsIG1vZElkKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lSWQgIT09IE1PUlJPV0lORF9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIE1PUlJPV0lORF9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBNT1JST1dJTkRfSUQsIG1vZElkXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKGluc3RhbGxQYXRoID09PSB1bmRlZmluZWQgfHwgbW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgICBjb25zdCBwbHVnaW5zID0gW107XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgd2Fsayhtb2RQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgICAgICAgaWYgKFsnLmVzcCcsICcuZXNtJ10uaW5jbHVkZXMocGF0aC5leHRuYW1lKGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkpKSkge1xyXG4gICAgICAgICAgICAgIHBsdWdpbnMucHVzaChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB7IHJlY3Vyc2U6IHRydWUsIHNraXBMaW5rczogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9KTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsaXN0IG9mIHBsdWdpbnMnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggcGx1Z2lucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoTU9SUk9XSU5EX0lELCBtb2QuaWQsICdwbHVnaW5zJywgcGx1Z2lucykpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW5cclxufTtcclxuIl19