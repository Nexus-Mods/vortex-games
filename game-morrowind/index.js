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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRTtBQUNsRSw2Q0FBK0I7QUFFL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUUxQywyQ0FBaUY7QUFDakYsMkNBQTJDO0FBSTNDLCtDQUF5RTtBQUV6RSx3R0FBZ0Y7QUFFaEYsNkNBQTBDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsbUNBQW1DLENBQUM7QUFFbEQsTUFBTSxPQUFPLEdBQUcsd0JBQVksQ0FBQztBQUU3QixNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLEVBQUUsRUFBRSx3QkFBd0I7SUFDNUIsRUFBRSxFQUFFLHVCQUF1QjtJQUMzQixFQUFFLEVBQUUsdUJBQXVCO0NBQzVCLENBQUE7QUFFRCxNQUFNLFlBQVksR0FBUTtJQUN4QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3JCLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ3JCLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLHdGQUF3RixFQUFFLENBQUM7Q0FDN0csQ0FBQztBQUVGLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRSxFQUFFO0tB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WSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDL0Y7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcblxyXG5jb25zdCB3YWxrID0gcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdDtcclxuXHJcbmltcG9ydCB7IHZhbGlkYXRlLCBkZXNlcmlhbGl6ZUxvYWRPcmRlciwgc2VyaWFsaXplTG9hZE9yZGVyIH0gZnJvbSAnLi9sb2Fkb3JkZXInO1xyXG5pbXBvcnQgeyBNT1JST1dJTkRfSUQgfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgeyBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyB9IGZyb20gJy4vdHlwZXMvdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMnO1xyXG5cclxuaW1wb3J0IE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Nb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCB7IG1pZ3JhdGUxMDMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuY29uc3QgU1RFQU1BUFBfSUQgPSAnMjIzMjAnO1xyXG5jb25zdCBHT0dfSUQgPSAnMTQzNTgyODc2Nyc7XHJcbmNvbnN0IE1TX0lEID0gJ0JldGhlc2RhU29mdHdvcmtzLlRFU01vcnJvd2luZC1QQyc7XHJcblxyXG5jb25zdCBHQU1FX0lEID0gTU9SUk9XSU5EX0lEO1xyXG5cclxuY29uc3QgbG9jYWxlRm9sZGVyc1hib3ggPSB7XHJcbiAgZW46ICdNb3Jyb3dpbmQgR09UWSBFbmdsaXNoJyxcclxuICBmcjogJ01vcnJvd2luZCBHT1RZIEZyZW5jaCcsXHJcbiAgZGU6ICdNb3Jyb3dpbmQgR09UWSBHZXJtYW4nLFxyXG59XHJcblxyXG5jb25zdCBnYW1lU3RvcmVJZHM6IGFueSA9IHtcclxuICBzdGVhbTogW3sgaWQ6IFNURUFNQVBQX0lELCBwcmVmZXI6IDAgfV0sXHJcbiAgeGJveDogW3sgaWQ6IE1TX0lEIH1dLFxyXG4gIGdvZzogW3sgaWQ6IEdPR19JRCB9XSxcclxuICByZWdpc3RyeTogW3sgaWQ6ICdIS0VZX0xPQ0FMX01BQ0hJTkU6U29mdHdhcmVcXFxcV293NjQzMk5vZGVcXFxcQmV0aGVzZGEgU29mdHdvcmtzXFxcXE1vcnJvd2luZDpJbnN0YWxsZWQgUGF0aCcgfV0sXHJcbn07XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICB7XHJcbiAgICBpZDogJ3RlczNlZGl0JyxcclxuICAgIG5hbWU6ICdURVMzRWRpdCcsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTM0VkaXQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogJ213LWNvbnN0cnVjdGlvbi1zZXQnLFxyXG4gICAgbmFtZTogJ0NvbnN0cnVjdGlvbiBTZXQnLFxyXG4gICAgbG9nbzogJ2NvbnN0cnVjdGlvbnNldC5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdURVMgQ29uc3RydWN0aW9uIFNldC5leGUnLFxyXG4gICAgXSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhjbHVzaXZlOiB0cnVlXHJcbiAgfVxyXG5dO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgY29uc3Qgc3RvcmVHYW1lcyA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmQoZ2FtZVN0b3JlSWRzKS5jYXRjaCgoKSA9PiBbXSk7XHJcblxyXG4gIGlmICghc3RvcmVHYW1lcy5sZW5ndGgpIHJldHVybjtcclxuICBcclxuICBpZiAoc3RvcmVHYW1lcy5sZW5ndGggPiAxKSBsb2coJ2RlYnVnJywgJ011dGxpcGxlIGNvcGllcyBvZiBPYmxpdmlvbiBmb3VuZCcsIHN0b3JlR2FtZXMubWFwKHMgPT4gcy5nYW1lU3RvcmVJZCkpO1xyXG5cclxuICBjb25zdCBzZWxlY3RlZEdhbWUgPSBzdG9yZUdhbWVzWzBdO1xyXG4gIGlmIChbJ2VwaWMnLCAneGJveCddLmluY2x1ZGVzKHNlbGVjdGVkR2FtZS5nYW1lU3RvcmVJZCkpIHtcclxuICAgIC8vIEdldCB0aGUgdXNlcidzIGNob3NlbiBsYW5ndWFnZVxyXG4gICAgLy8gc3RhdGUuaW50ZXJmYWNlLmxhbmd1YWdlIHx8ICdlbic7XHJcbiAgICBsb2coJ2RlYnVnJywgJ0RlZmF1bHRpbmcgdG8gdGhlIEVuZ2xpc2ggZ2FtZSB2ZXJzaW9uJywgeyBzdG9yZTogc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkLCBmb2xkZXI6IGxvY2FsZUZvbGRlcnNYYm94WydlbiddIH0pO1xyXG4gICAgc2VsZWN0ZWRHYW1lLmdhbWVQYXRoID0gcGF0aC5qb2luKHNlbGVjdGVkR2FtZS5nYW1lUGF0aCwgbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10pO1xyXG4gIH1cclxuICByZXR1cm4gc2VsZWN0ZWRHYW1lO1xyXG59XHJcblxyXG4vKiBNb3Jyb3dpbmQgc2VlbXMgdG8gc3RhcnQgZmluZSB3aGVuIHJ1bm5pbmcgZGlyZWN0bHkuIElmIHdlIGRvIGdvIHRocm91Z2ggdGhlIGxhdW5jaGVyIHRoZW4gdGhlIGxhbmd1YWdlIHZlcnNpb24gYmVpbmdcclxuICAgc3RhcnRlZCBtaWdodCBub3QgYmUgdGhlIG9uZSB3ZSdyZSBtb2RkaW5nXHJcblxyXG5mdW5jdGlvbiByZXF1aXJlc0xhdW5jaGVyKGdhbWVQYXRoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtNU19JRF0sICd4Ym94JylcclxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIGxhdW5jaGVyOiAneGJveCcsXHJcbiAgICAgIGFkZEluZm86IHtcclxuICAgICAgICBhcHBJZDogTVNfSUQsXHJcbiAgICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgICAgeyBhcHBFeGVjTmFtZTogJ0dhbWUnIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcclxufVxyXG4qL1xyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcclxuICBjb25zdCBnYW1lTmFtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKT8ubmFtZSB8fCAnVGhpcyBnYW1lJztcclxuXHJcbiAgLy8gdGhlIGdhbWUgZG9lc24ndCBhY3R1YWxseSBleGlzdCBvbiB0aGUgZXBpYyBnYW1lIHN0b3JlLCB0aGlzIGNodW5rIGlzIGNvcHkmcGFzdGVkLCBkb2Vzbid0IGh1cnRcclxuICAvLyBrZWVwaW5nIGl0IGlkZW50aWNhbFxyXG4gIGlmIChkaXNjb3Zlcnkuc3RvcmUgJiYgWydlcGljJywgJ3hib3gnXS5pbmNsdWRlcyhkaXNjb3Zlcnkuc3RvcmUpKSB7XHJcbiAgICBjb25zdCBzdG9yZU5hbWUgPSBkaXNjb3Zlcnkuc3RvcmUgPT09ICdlcGljJyA/ICdFcGljIEdhbWVzJyA6ICdYYm94IEdhbWUgUGFzcyc7XHJcbiAgICAvLyBJZiB0aGlzIGlzIGFuIEVwaWMgb3IgWGJveCBnYW1lIHdlJ3ZlIGRlZmF1bHRlZCB0byBFbmdsaXNoLCBzbyB3ZSBzaG91bGQgbGV0IHRoZSB1c2VyIGtub3cuXHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiBgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWAsXHJcbiAgICAgIHR5cGU6ICdpbmZvJyxcclxuICAgICAgdGl0bGU6ICdNdWx0aXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJyxcclxuICAgICAgbWVzc2FnZTogJ0RlZmF1bHQ6IEVuZ2xpc2gnLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcclxuICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdNdXRsaXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJywge1xyXG4gICAgICAgICAgICAgIGJiY29kZTogJ3t7Z2FtZU5hbWV9fSBoYXMgbXVsdGlwbGUgbGFuZ3VhZ2Ugb3B0aW9ucyB3aGVuIGRvd25sb2FkZWQgZnJvbSB7e3N0b3JlTmFtZX19LiBbYnJdWy9icl1bYnJdWy9icl0nK1xyXG4gICAgICAgICAgICAgICAgJ1ZvcnRleCBoYXMgc2VsZWN0ZWQgdGhlIEVuZ2xpc2ggdmFyaWFudCBieSBkZWZhdWx0LiBbYnJdWy9icl1bYnJdWy9icl0nK1xyXG4gICAgICAgICAgICAgICAgJ0lmIHlvdSB3b3VsZCBwcmVmZXIgdG8gbWFuYWdlIGEgZGlmZmVyZW50IGxhbmd1YWdlIHlvdSBjYW4gY2hhbmdlIHRoZSBwYXRoIHRvIHRoZSBnYW1lIHVzaW5nIHRoZSBcIk1hbnVhbGx5IFNldCBMb2NhdGlvblwiIG9wdGlvbiBpbiB0aGUgZ2FtZXMgdGFiLicsXHJcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczogeyBnYW1lTmFtZSwgc3RvcmVOYW1lIH1cclxuICAgICAgICAgICAgfSwgXHJcbiAgICAgICAgICAgIFsgXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiBhcGkuc3VwcHJlc3NOb3RpZmljYXRpb24oYCR7R0FNRV9JRH0tbG9jYWxlLW1lc3NhZ2VgKSB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENvbGxlY3Rpb25EYXRhV3JhcChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb3BzOiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyk6IEpTWC5FbGVtZW50IHtcclxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChNb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3LCB7IC4uLnByb3BzLCBhcGksIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogTU9SUk9XSU5EX0lELFxyXG4gICAgbmFtZTogJ01vcnJvd2luZCcsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IHRvb2xzLFxyXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpLFxyXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiAnRGF0YSBGaWxlcycsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ21vcnJvd2luZC5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnbW9ycm93aW5kLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgLy8gcmVxdWlyZXNMYXVuY2hlcixcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNQVBQX0lELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogcGFyc2VJbnQoU1RFQU1BUFBfSUQsIDEwKSxcclxuICAgICAgZ29nQXBwSWQ6IEdPR19JRFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XHJcbiAgICBnYW1lSWQ6IE1PUlJPV0lORF9JRCxcclxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZUxvYWRPcmRlcihjb250ZXh0LmFwaSksXHJcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIpID0+IHNlcmlhbGl6ZUxvYWRPcmRlcihjb250ZXh0LmFwaSwgbG9hZE9yZGVyKSxcclxuICAgIHZhbGlkYXRlLFxyXG4gICAgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbjogdHJ1ZSxcclxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiB0cnVlLFxyXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICgoKSA9PiAnRHJhZyB5b3VyIHBsdWdpbnMgYXMgbmVlZGVkIC0gdGhlIGdhbWUgd2lsbCBsb2FkICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ2xvYWQgdGhlbSBmcm9tIHRvcCB0byBib3R0b20uJyksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcclxuICAgICdtb3Jyb3dpbmRfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbikgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSxcclxuICAgIChnYW1lSWQsIGNvbGxlY3Rpb24pID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdMb2FkIE9yZGVyJyksXHJcbiAgICAoc3RhdGUsIGdhbWVJZCkgPT4gZ2FtZUlkID09PSBNT1JST1dJTkRfSUQsXHJcbiAgICAocHJvcHM6IElFeHRlbmRlZEludGVyZmFjZVByb3BzKSA9PiBDb2xsZWN0aW9uRGF0YVdyYXAoY29udGV4dC5hcGksIHByb3BzKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24ob2xkID0+IG1pZ3JhdGUxMDMoY29udGV4dC5hcGksIG9sZCkpO1xyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIGFzeW5jIChnYW1lSWQsIGFyY2hpdmVJZCwgbW9kSWQpID0+IHtcclxuICAgICAgaWYgKGdhbWVJZCAhPT0gTU9SUk9XSU5EX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgTU9SUk9XSU5EX0lEKTtcclxuICAgICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIE1PUlJPV0lORF9JRCwgbW9kSWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoaW5zdGFsbFBhdGggPT09IHVuZGVmaW5lZCB8fCBtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICAgIGNvbnN0IHBsdWdpbnMgPSBbXTtcclxuICAgICAgYXdhaXQgd2Fsayhtb2RQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgICAgICBpZiAoWycuZXNwJywgJy5lc20nXS5pbmNsdWRlcyhwYXRoLmV4dG5hbWUoZW50cnkuZmlsZVBhdGgudG9Mb3dlckNhc2UoKSkpKSB7XHJcbiAgICAgICAgICAgIHBsdWdpbnMucHVzaChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB7IHJlY3Vyc2U6IHRydWUsIHNraXBMaW5rczogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9KTtcclxuICAgICAgaWYgKCBwbHVnaW5zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShNT1JST1dJTkRfSUQsIG1vZC5pZCwgJ3BsdWdpbnMnLCBwbHVnaW5zKSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpblxyXG59O1xyXG4iXX0=