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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRTtBQUNsRSw2Q0FBK0I7QUFFL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUUxQywyQ0FBaUY7QUFDakYsMkNBQTJDO0FBSTNDLCtDQUF5RTtBQUV6RSx3R0FBZ0Y7QUFFaEYsNkNBQTBDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsbUNBQW1DLENBQUM7QUFFbEQsTUFBTSxPQUFPLEdBQUcsd0JBQVksQ0FBQztBQUU3QixNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLEVBQUUsRUFBRSx3QkFBd0I7SUFDNUIsRUFBRSxFQUFFLHVCQUF1QjtJQUMzQixFQUFFLEVBQUUsdUJBQXVCO0NBQzVCLENBQUE7QUFFRCxNQUFNLFlBQVksR0FBUTtJQUN4QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3JCLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ3JCLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLHVGQUF1RixFQUFFLENBQUM7Q0FDNUcsQ0FBQztBQUVGLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRSxFQUFFO0tB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WSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDL0Y7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcblxyXG5jb25zdCB3YWxrID0gcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdDtcclxuXHJcbmltcG9ydCB7IHZhbGlkYXRlLCBkZXNlcmlhbGl6ZUxvYWRPcmRlciwgc2VyaWFsaXplTG9hZE9yZGVyIH0gZnJvbSAnLi9sb2Fkb3JkZXInO1xyXG5pbXBvcnQgeyBNT1JST1dJTkRfSUQgfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgeyBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyB9IGZyb20gJy4vdHlwZXMvdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMnO1xyXG5cclxuaW1wb3J0IE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Nb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCB7IG1pZ3JhdGUxMDMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuY29uc3QgU1RFQU1BUFBfSUQgPSAnMjIzMjAnO1xyXG5jb25zdCBHT0dfSUQgPSAnMTQzNTgyODc2Nyc7XHJcbmNvbnN0IE1TX0lEID0gJ0JldGhlc2RhU29mdHdvcmtzLlRFU01vcnJvd2luZC1QQyc7XHJcblxyXG5jb25zdCBHQU1FX0lEID0gTU9SUk9XSU5EX0lEO1xyXG5cclxuY29uc3QgbG9jYWxlRm9sZGVyc1hib3ggPSB7XHJcbiAgZW46ICdNb3Jyb3dpbmQgR09UWSBFbmdsaXNoJyxcclxuICBmcjogJ01vcnJvd2luZCBHT1RZIEZyZW5jaCcsXHJcbiAgZGU6ICdNb3Jyb3dpbmQgR09UWSBHZXJtYW4nLFxyXG59XHJcblxyXG5jb25zdCBnYW1lU3RvcmVJZHM6IGFueSA9IHtcclxuICBzdGVhbTogW3sgaWQ6IFNURUFNQVBQX0lELCBwcmVmZXI6IDAgfV0sXHJcbiAgeGJveDogW3sgaWQ6IE1TX0lEIH1dLFxyXG4gIGdvZzogW3sgaWQ6IEdPR19JRCB9XSxcclxuICByZWdpc3RyeTogW3sgaWQ6ICdIS0VZX0xPQ0FMX01BQ0hJTkU6U29mdHdhcmVcXFxcV293NjQzMk5vZGVcXFxcQmV0aGVzZGEgU29mdHdvcmtzXFxcXG9ibGl2aW9uOkluc3RhbGxlZCBQYXRoJyB9XSxcclxufTtcclxuXHJcbmNvbnN0IHRvb2xzID0gW1xyXG4gIHtcclxuICAgIGlkOiAndGVzM2VkaXQnLFxyXG4gICAgbmFtZTogJ1RFUzNFZGl0JyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdURVMzRWRpdC5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW11cclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAnbXctY29uc3RydWN0aW9uLXNldCcsXHJcbiAgICBuYW1lOiAnQ29uc3RydWN0aW9uIFNldCcsXHJcbiAgICBsb2dvOiAnY29uc3RydWN0aW9uc2V0LnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTIENvbnN0cnVjdGlvbiBTZXQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXHJcbiAgICBdLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGNsdXNpdmU6IHRydWVcclxuICB9XHJcbl07XHJcblxyXG5hc3luYyBmdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICBjb25zdCBzdG9yZUdhbWVzID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZChnYW1lU3RvcmVJZHMpLmNhdGNoKCgpID0+IFtdKTtcclxuXHJcbiAgaWYgKCFzdG9yZUdhbWVzLmxlbmd0aCkgcmV0dXJuO1xyXG4gIFxyXG4gIGlmIChzdG9yZUdhbWVzLmxlbmd0aCA+IDEpIGxvZygnZGVidWcnLCAnTXV0bGlwbGUgY29waWVzIG9mIE9ibGl2aW9uIGZvdW5kJywgc3RvcmVHYW1lcy5tYXAocyA9PiBzLmdhbWVTdG9yZUlkKSk7XHJcblxyXG4gIGNvbnN0IHNlbGVjdGVkR2FtZSA9IHN0b3JlR2FtZXNbMF07XHJcbiAgaWYgKFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkKSkge1xyXG4gICAgLy8gR2V0IHRoZSB1c2VyJ3MgY2hvc2VuIGxhbmd1YWdlXHJcbiAgICAvLyBzdGF0ZS5pbnRlcmZhY2UubGFuZ3VhZ2UgfHwgJ2VuJztcclxuICAgIGxvZygnZGVidWcnLCAnRGVmYXVsdGluZyB0byB0aGUgRW5nbGlzaCBnYW1lIHZlcnNpb24nLCB7IHN0b3JlOiBzZWxlY3RlZEdhbWUuZ2FtZVN0b3JlSWQsIGZvbGRlcjogbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10gfSk7XHJcbiAgICBzZWxlY3RlZEdhbWUuZ2FtZVBhdGggPSBwYXRoLmpvaW4oc2VsZWN0ZWRHYW1lLmdhbWVQYXRoLCBsb2NhbGVGb2xkZXJzWGJveFsnZW4nXSk7XHJcbiAgfVxyXG4gIHJldHVybiBzZWxlY3RlZEdhbWU7XHJcbn1cclxuXHJcbi8qIE1vcnJvd2luZCBzZWVtcyB0byBzdGFydCBmaW5lIHdoZW4gcnVubmluZyBkaXJlY3RseS4gSWYgd2UgZG8gZ28gdGhyb3VnaCB0aGUgbGF1bmNoZXIgdGhlbiB0aGUgbGFuZ3VhZ2UgdmVyc2lvbiBiZWluZ1xyXG4gICBzdGFydGVkIG1pZ2h0IG5vdCBiZSB0aGUgb25lIHdlJ3JlIG1vZGRpbmdcclxuXHJcbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW01TX0lEXSwgJ3hib3gnKVxyXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcclxuICAgICAgYWRkSW5mbzoge1xyXG4gICAgICAgIGFwcElkOiBNU19JRCxcclxuICAgICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgICB7IGFwcEV4ZWNOYW1lOiAnR2FtZScgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xyXG59XHJcbiovXHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xyXG4gIGNvbnN0IGdhbWVOYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpPy5uYW1lIHx8ICdUaGlzIGdhbWUnO1xyXG5cclxuICAvLyB0aGUgZ2FtZSBkb2Vzbid0IGFjdHVhbGx5IGV4aXN0IG9uIHRoZSBlcGljIGdhbWUgc3RvcmUsIHRoaXMgY2h1bmsgaXMgY29weSZwYXN0ZWQsIGRvZXNuJ3QgaHVydFxyXG4gIC8vIGtlZXBpbmcgaXQgaWRlbnRpY2FsXHJcbiAgaWYgKGRpc2NvdmVyeS5zdG9yZSAmJiBbJ2VwaWMnLCAneGJveCddLmluY2x1ZGVzKGRpc2NvdmVyeS5zdG9yZSkpIHtcclxuICAgIGNvbnN0IHN0b3JlTmFtZSA9IGRpc2NvdmVyeS5zdG9yZSA9PT0gJ2VwaWMnID8gJ0VwaWMgR2FtZXMnIDogJ1hib3ggR2FtZSBQYXNzJztcclxuICAgIC8vIElmIHRoaXMgaXMgYW4gRXBpYyBvciBYYm94IGdhbWUgd2UndmUgZGVmYXVsdGVkIHRvIEVuZ2xpc2gsIHNvIHdlIHNob3VsZCBsZXQgdGhlIHVzZXIga25vdy5cclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6IGAke0dBTUVfSUR9LWxvY2FsZS1tZXNzYWdlYCxcclxuICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICB0aXRsZTogJ011bHRpcGxlIExhbmd1YWdlcyBBdmFpbGFibGUnLFxyXG4gICAgICBtZXNzYWdlOiAnRGVmYXVsdDogRW5nbGlzaCcsXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgICAgYWN0aW9uOiAoZGlzbWlzcykgPT4ge1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ011dGxpcGxlIExhbmd1YWdlcyBBdmFpbGFibGUnLCB7XHJcbiAgICAgICAgICAgICAgYmJjb2RlOiAne3tnYW1lTmFtZX19IGhhcyBtdWx0aXBsZSBsYW5ndWFnZSBvcHRpb25zIHdoZW4gZG93bmxvYWRlZCBmcm9tIHt7c3RvcmVOYW1lfX0uIFticl1bL2JyXVticl1bL2JyXScrXHJcbiAgICAgICAgICAgICAgICAnVm9ydGV4IGhhcyBzZWxlY3RlZCB0aGUgRW5nbGlzaCB2YXJpYW50IGJ5IGRlZmF1bHQuIFticl1bL2JyXVticl1bL2JyXScrXHJcbiAgICAgICAgICAgICAgICAnSWYgeW91IHdvdWxkIHByZWZlciB0byBtYW5hZ2UgYSBkaWZmZXJlbnQgbGFuZ3VhZ2UgeW91IGNhbiBjaGFuZ2UgdGhlIHBhdGggdG8gdGhlIGdhbWUgdXNpbmcgdGhlIFwiTWFudWFsbHkgU2V0IExvY2F0aW9uXCIgb3B0aW9uIGluIHRoZSBnYW1lcyB0YWIuJyxcclxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7IGdhbWVOYW1lLCBzdG9yZU5hbWUgfVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICAgICAgWyBcclxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IGFwaS5zdXBwcmVzc05vdGlmaWNhdGlvbihgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWApIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gQ29sbGVjdGlvbkRhdGFXcmFwKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvcHM6IElFeHRlbmRlZEludGVyZmFjZVByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcsIHsgLi4ucHJvcHMsIGFwaSwgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBNT1JST1dJTkRfSUQsXHJcbiAgICBuYW1lOiAnTW9ycm93aW5kJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXHJcbiAgICBzZXR1cDogKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSksXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdEYXRhIEZpbGVzJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnbW9ycm93aW5kLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdtb3Jyb3dpbmQuZXhlJyxcclxuICAgIF0sXHJcbiAgICAvLyByZXF1aXJlc0xhdW5jaGVyLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiBwYXJzZUludChTVEVBTUFQUF9JRCwgMTApLFxyXG4gICAgICBnb2dBcHBJZDogR09HX0lEXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcclxuICAgIGdhbWVJZDogTU9SUk9XSU5EX0lELFxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpKSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IHRydWUsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+ICdEcmFnIHlvdXIgcGx1Z2lucyBhcyBuZWVkZWQgLSB0aGUgZ2FtZSB3aWxsIGxvYWQgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnbG9hZCB0aGVtIGZyb20gdG9wIHRvIGJvdHRvbS4nKSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ21vcnJvd2luZF9jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZCwgY29sbGVjdGlvbikgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ0xvYWQgT3JkZXInKSxcclxuICAgIChzdGF0ZSwgZ2FtZUlkKSA9PiBnYW1lSWQgPT09IE1PUlJPV0lORF9JRCxcclxuICAgIChwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpID0+IENvbGxlY3Rpb25EYXRhV3JhcChjb250ZXh0LmFwaSwgcHJvcHMpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTEwMyhjb250ZXh0LmFwaSwgb2xkKSk7XHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgYXN5bmMgKGdhbWVJZCwgYXJjaGl2ZUlkLCBtb2RJZCkgPT4ge1xyXG4gICAgICBpZiAoZ2FtZUlkICE9PSBNT1JST1dJTkRfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBNT1JST1dJTkRfSUQpO1xyXG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgTU9SUk9XSU5EX0lELCBtb2RJZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChpbnN0YWxsUGF0aCA9PT0gdW5kZWZpbmVkIHx8IG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgY29uc3QgcGx1Z2lucyA9IFtdO1xyXG4gICAgICBhd2FpdCB3YWxrKG1vZFBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgICAgIGlmIChbJy5lc3AnLCAnLmVzbSddLmluY2x1ZGVzKHBhdGguZXh0bmFtZShlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpKSkpIHtcclxuICAgICAgICAgICAgcGx1Z2lucy5wdXNoKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH0pO1xyXG4gICAgICBpZiAoIHBsdWdpbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKE1PUlJPV0lORF9JRCwgbW9kLmlkLCAncGx1Z2lucycsIHBsdWdpbnMpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluXHJcbn07XHJcbiJdfQ==