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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRTtBQUNsRSw2Q0FBK0I7QUFFL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUUxQywyQ0FBaUY7QUFDakYsMkNBQTJDO0FBSTNDLCtDQUF5RTtBQUV6RSx3R0FBZ0Y7QUFFaEYsNkNBQTBDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsbUNBQW1DLENBQUM7QUFFbEQsTUFBTSxPQUFPLEdBQUcsd0JBQVksQ0FBQztBQUU3QixNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLEVBQUUsRUFBRSx3QkFBd0I7SUFDNUIsRUFBRSxFQUFFLHVCQUF1QjtJQUMzQixFQUFFLEVBQUUsdUJBQXVCO0NBQzVCLENBQUE7QUFFRCxNQUFNLFlBQVksR0FBUTtJQUN4QixLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3JCLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ3JCLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLHdGQUF3RixFQUFFLENBQUM7Q0FDN0csQ0FBQztBQUVGLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRSxFQUFFO0tB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QUUsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7YUFDbEc7WUFDRCxJQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxlQUFlLENBQUMsd0JBQVksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQy9GO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWN0aW9ucywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmNvbnN0IHdhbGsgPSByZXF1aXJlKCd0dXJib3dhbGsnKS5kZWZhdWx0O1xuXG5pbXBvcnQgeyB2YWxpZGF0ZSwgZGVzZXJpYWxpemVMb2FkT3JkZXIsIHNlcmlhbGl6ZUxvYWRPcmRlciB9IGZyb20gJy4vbG9hZG9yZGVyJztcbmltcG9ydCB7IE1PUlJPV0lORF9JRCB9IGZyb20gJy4vY29uc3RhbnRzJztcblxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgfSBmcm9tICcuL3R5cGVzL3R5cGVzJztcblxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMnO1xuXG5pbXBvcnQgTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL01vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcnO1xuXG5pbXBvcnQgeyBtaWdyYXRlMTAzIH0gZnJvbSAnLi9taWdyYXRpb25zJztcblxuY29uc3QgU1RFQU1BUFBfSUQgPSAnMjIzMjAnO1xuY29uc3QgR09HX0lEID0gJzE0MzU4Mjg3NjcnO1xuY29uc3QgTVNfSUQgPSAnQmV0aGVzZGFTb2Z0d29ya3MuVEVTTW9ycm93aW5kLVBDJztcblxuY29uc3QgR0FNRV9JRCA9IE1PUlJPV0lORF9JRDtcblxuY29uc3QgbG9jYWxlRm9sZGVyc1hib3ggPSB7XG4gIGVuOiAnTW9ycm93aW5kIEdPVFkgRW5nbGlzaCcsXG4gIGZyOiAnTW9ycm93aW5kIEdPVFkgRnJlbmNoJyxcbiAgZGU6ICdNb3Jyb3dpbmQgR09UWSBHZXJtYW4nLFxufVxuXG5jb25zdCBnYW1lU3RvcmVJZHM6IGFueSA9IHtcbiAgc3RlYW06IFt7IGlkOiBTVEVBTUFQUF9JRCwgcHJlZmVyOiAwIH1dLFxuICB4Ym94OiBbeyBpZDogTVNfSUQgfV0sXG4gIGdvZzogW3sgaWQ6IEdPR19JRCB9XSxcbiAgcmVnaXN0cnk6IFt7IGlkOiAnSEtFWV9MT0NBTF9NQUNISU5FOlNvZnR3YXJlXFxcXFdvdzY0MzJOb2RlXFxcXEJldGhlc2RhIFNvZnR3b3Jrc1xcXFxNb3Jyb3dpbmQ6SW5zdGFsbGVkIFBhdGgnIH1dLFxufTtcblxuY29uc3QgdG9vbHMgPSBbXG4gIHtcbiAgICBpZDogJ3RlczNlZGl0JyxcbiAgICBuYW1lOiAnVEVTM0VkaXQnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdURVMzRWRpdC5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdXG4gIH0sXG4gIHtcbiAgICBpZDogJ213LWNvbnN0cnVjdGlvbi1zZXQnLFxuICAgIG5hbWU6ICdDb25zdHJ1Y3Rpb24gU2V0JyxcbiAgICBsb2dvOiAnY29uc3RydWN0aW9uc2V0LnBuZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXG4gICAgXSxcbiAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICBleGNsdXNpdmU6IHRydWVcbiAgfVxuXTtcblxuYXN5bmMgZnVuY3Rpb24gZmluZEdhbWUoKSB7XG4gIGNvbnN0IHN0b3JlR2FtZXMgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kKGdhbWVTdG9yZUlkcykuY2F0Y2goKCkgPT4gW10pO1xuXG4gIGlmICghc3RvcmVHYW1lcy5sZW5ndGgpIHJldHVybjtcbiAgXG4gIGlmIChzdG9yZUdhbWVzLmxlbmd0aCA+IDEpIGxvZygnZGVidWcnLCAnTXV0bGlwbGUgY29waWVzIG9mIE9ibGl2aW9uIGZvdW5kJywgc3RvcmVHYW1lcy5tYXAocyA9PiBzLmdhbWVTdG9yZUlkKSk7XG5cbiAgY29uc3Qgc2VsZWN0ZWRHYW1lID0gc3RvcmVHYW1lc1swXTtcbiAgaWYgKFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkKSkge1xuICAgIC8vIEdldCB0aGUgdXNlcidzIGNob3NlbiBsYW5ndWFnZVxuICAgIC8vIHN0YXRlLmludGVyZmFjZS5sYW5ndWFnZSB8fCAnZW4nO1xuICAgIGxvZygnZGVidWcnLCAnRGVmYXVsdGluZyB0byB0aGUgRW5nbGlzaCBnYW1lIHZlcnNpb24nLCB7IHN0b3JlOiBzZWxlY3RlZEdhbWUuZ2FtZVN0b3JlSWQsIGZvbGRlcjogbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10gfSk7XG4gICAgc2VsZWN0ZWRHYW1lLmdhbWVQYXRoID0gcGF0aC5qb2luKHNlbGVjdGVkR2FtZS5nYW1lUGF0aCwgbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10pO1xuICB9XG4gIHJldHVybiBzZWxlY3RlZEdhbWU7XG59XG5cbi8qIE1vcnJvd2luZCBzZWVtcyB0byBzdGFydCBmaW5lIHdoZW4gcnVubmluZyBkaXJlY3RseS4gSWYgd2UgZG8gZ28gdGhyb3VnaCB0aGUgbGF1bmNoZXIgdGhlbiB0aGUgbGFuZ3VhZ2UgdmVyc2lvbiBiZWluZ1xuICAgc3RhcnRlZCBtaWdodCBub3QgYmUgdGhlIG9uZSB3ZSdyZSBtb2RkaW5nXG5cbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgpIHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtNU19JRF0sICd4Ym94JylcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcbiAgICAgIGFkZEluZm86IHtcbiAgICAgICAgYXBwSWQ6IE1TX0lELFxuICAgICAgICBwYXJhbWV0ZXJzOiBbXG4gICAgICAgICAgeyBhcHBFeGVjTmFtZTogJ0dhbWUnIH0sXG4gICAgICAgIF0sXG4gICAgICB9XG4gICAgfSkpXG4gICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSk7XG59XG4qL1xuXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBjb25zdCBnYW1lTmFtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKT8ubmFtZSB8fCAnVGhpcyBnYW1lJztcblxuICAvLyB0aGUgZ2FtZSBkb2Vzbid0IGFjdHVhbGx5IGV4aXN0IG9uIHRoZSBlcGljIGdhbWUgc3RvcmUsIHRoaXMgY2h1bmsgaXMgY29weSZwYXN0ZWQsIGRvZXNuJ3QgaHVydFxuICAvLyBrZWVwaW5nIGl0IGlkZW50aWNhbFxuICBpZiAoZGlzY292ZXJ5LnN0b3JlICYmIFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoZGlzY292ZXJ5LnN0b3JlKSkge1xuICAgIGNvbnN0IHN0b3JlTmFtZSA9IGRpc2NvdmVyeS5zdG9yZSA9PT0gJ2VwaWMnID8gJ0VwaWMgR2FtZXMnIDogJ1hib3ggR2FtZSBQYXNzJztcbiAgICAvLyBJZiB0aGlzIGlzIGFuIEVwaWMgb3IgWGJveCBnYW1lIHdlJ3ZlIGRlZmF1bHRlZCB0byBFbmdsaXNoLCBzbyB3ZSBzaG91bGQgbGV0IHRoZSB1c2VyIGtub3cuXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgaWQ6IGAke0dBTUVfSUR9LWxvY2FsZS1tZXNzYWdlYCxcbiAgICAgIHR5cGU6ICdpbmZvJyxcbiAgICAgIHRpdGxlOiAnTXVsdGlwbGUgTGFuZ3VhZ2VzIEF2YWlsYWJsZScsXG4gICAgICBtZXNzYWdlOiAnRGVmYXVsdDogRW5nbGlzaCcsXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcbiAgICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XG4gICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdNdXRsaXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJywge1xuICAgICAgICAgICAgICBiYmNvZGU6ICd7e2dhbWVOYW1lfX0gaGFzIG11bHRpcGxlIGxhbmd1YWdlIG9wdGlvbnMgd2hlbiBkb3dubG9hZGVkIGZyb20ge3tzdG9yZU5hbWV9fS4gW2JyXVsvYnJdW2JyXVsvYnJdJytcbiAgICAgICAgICAgICAgICAnVm9ydGV4IGhhcyBzZWxlY3RlZCB0aGUgRW5nbGlzaCB2YXJpYW50IGJ5IGRlZmF1bHQuIFticl1bL2JyXVticl1bL2JyXScrXG4gICAgICAgICAgICAgICAgJ0lmIHlvdSB3b3VsZCBwcmVmZXIgdG8gbWFuYWdlIGEgZGlmZmVyZW50IGxhbmd1YWdlIHlvdSBjYW4gY2hhbmdlIHRoZSBwYXRoIHRvIHRoZSBnYW1lIHVzaW5nIHRoZSBcIk1hbnVhbGx5IFNldCBMb2NhdGlvblwiIG9wdGlvbiBpbiB0aGUgZ2FtZXMgdGFiLicsXG4gICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHsgZ2FtZU5hbWUsIHN0b3JlTmFtZSB9XG4gICAgICAgICAgICB9LCBcbiAgICAgICAgICAgIFsgXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gYXBpLnN1cHByZXNzTm90aWZpY2F0aW9uKGAke0dBTUVfSUR9LWxvY2FsZS1tZXNzYWdlYCkgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmZ1bmN0aW9uIENvbGxlY3Rpb25EYXRhV3JhcChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb3BzOiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyk6IEpTWC5FbGVtZW50IHtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldywgeyAuLi5wcm9wcywgYXBpLCB9KTtcbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IE1PUlJPV0lORF9JRCxcbiAgICBuYW1lOiAnTW9ycm93aW5kJyxcbiAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgcXVlcnlQYXRoOiB1dGlsLnRvQmx1ZShmaW5kR2FtZSksXG4gICAgc3VwcG9ydGVkVG9vbHM6IHRvb2xzLFxuICAgIHNldHVwOiB1dGlsLnRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSksXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiAnRGF0YSBGaWxlcycsXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnbW9ycm93aW5kLmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ21vcnJvd2luZC5leGUnLFxuICAgIF0sXG4gICAgLy8gcmVxdWlyZXNMYXVuY2hlcixcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiBwYXJzZUludChTVEVBTUFQUF9JRCwgMTApLFxuICAgICAgZ29nQXBwSWQ6IEdPR19JRFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xuICAgIGdhbWVJZDogTU9SUk9XSU5EX0lELFxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZUxvYWRPcmRlcihjb250ZXh0LmFwaSksXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGksIGxvYWRPcmRlciksXG4gICAgdmFsaWRhdGUsXG4gICAgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbjogdHJ1ZSxcbiAgICB0b2dnbGVhYmxlRW50cmllczogdHJ1ZSxcbiAgICB1c2FnZUluc3RydWN0aW9uczogJ0RyYWcgeW91ciBwbHVnaW5zIGFzIG5lZWRlZCAtIHRoZSBnYW1lIHdpbGwgbG9hZCAnXG4gICAgICArICdsb2FkIHRoZW0gZnJvbSB0b3AgdG8gYm90dG9tLicsXG4gIH0pO1xuXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcbiAgICAnbW9ycm93aW5kX2NvbGxlY3Rpb25fZGF0YScsXG4gICAgKGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSA9PlxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSxcbiAgICAoZ2FtZUlkLCBjb2xsZWN0aW9uKSA9PlxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAodCkgPT4gdCgnTG9hZCBPcmRlcicpLFxuICAgIChzdGF0ZSwgZ2FtZUlkKSA9PiBnYW1lSWQgPT09IE1PUlJPV0lORF9JRCxcbiAgICAocHJvcHM6IElFeHRlbmRlZEludGVyZmFjZVByb3BzKSA9PiBDb2xsZWN0aW9uRGF0YVdyYXAoY29udGV4dC5hcGksIHByb3BzKSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTEwMyhjb250ZXh0LmFwaSwgb2xkKSk7XG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdkaWQtaW5zdGFsbC1tb2QnLCBhc3luYyAoZ2FtZUlkLCBhcmNoaXZlSWQsIG1vZElkKSA9PiB7XG4gICAgICBpZiAoZ2FtZUlkICE9PSBNT1JST1dJTkRfSUQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIE1PUlJPV0lORF9JRCk7XG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgTU9SUk9XSU5EX0lELCBtb2RJZF0sIHVuZGVmaW5lZCk7XG4gICAgICBpZiAoaW5zdGFsbFBhdGggPT09IHVuZGVmaW5lZCB8fCBtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XG4gICAgICBjb25zdCBwbHVnaW5zID0gW107XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB3YWxrKG1vZFBhdGgsIGVudHJpZXMgPT4ge1xuICAgICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgIGlmIChbJy5lc3AnLCAnLmVzbSddLmluY2x1ZGVzKHBhdGguZXh0bmFtZShlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpKSkpIHtcbiAgICAgICAgICAgICAgcGx1Z2lucy5wdXNoKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbGlzdCBvZiBwbHVnaW5zJywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgIH1cbiAgICAgIGlmICggcGx1Z2lucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKE1PUlJPV0lORF9JRCwgbW9kLmlkLCAncGx1Z2lucycsIHBsdWdpbnMpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluXG59O1xuIl19