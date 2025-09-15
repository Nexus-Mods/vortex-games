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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QiwyQ0FBa0U7QUFDbEUsNkNBQStCO0FBRS9CLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFFMUMsMkNBQWlGO0FBQ2pGLDJDQUEyQztBQUkzQywrQ0FBeUU7QUFFekUsd0dBQWdGO0FBRWhGLDZDQUEwQztBQUUxQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7QUFDNUIsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sS0FBSyxHQUFHLG1DQUFtQyxDQUFDO0FBRWxELE1BQU0sT0FBTyxHQUFHLHdCQUFZLENBQUM7QUFFN0IsTUFBTSxpQkFBaUIsR0FBRztJQUN4QixFQUFFLEVBQUUsd0JBQXdCO0lBQzVCLEVBQUUsRUFBRSx1QkFBdUI7SUFDM0IsRUFBRSxFQUFFLHVCQUF1QjtDQUM1QixDQUFBO0FBRUQsTUFBTSxZQUFZLEdBQVE7SUFDeEIsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUN2QyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQztJQUNyQixHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQztJQUNyQixRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSx3RkFBd0YsRUFBRSxDQUFDO0NBQzdHLENBQUM7QUFFRixNQUFNLEtBQUssR0FBRztJQUNaO1FBQ0UsRUFBRSxFQUFFLFVBQVU7UUFDZCxJQUFJLEVBQUUsVUFBVTtRQUNoQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztRQUNoQyxhQUFhLEVB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QztZQUNqRSxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ25HLENBQUM7WUFDRCxJQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGVBQWUsQ0FBQyx3QkFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEcsQ0FBQztRQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmNvbnN0IHdhbGsgPSByZXF1aXJlKCd0dXJib3dhbGsnKS5kZWZhdWx0O1xyXG5cclxuaW1wb3J0IHsgdmFsaWRhdGUsIGRlc2VyaWFsaXplTG9hZE9yZGVyLCBzZXJpYWxpemVMb2FkT3JkZXIgfSBmcm9tICcuL2xvYWRvcmRlcic7XHJcbmltcG9ydCB7IE1PUlJPV0lORF9JRCB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCB7IElFeHRlbmRlZEludGVyZmFjZVByb3BzIH0gZnJvbSAnLi90eXBlcy90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucyc7XHJcblxyXG5pbXBvcnQgTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL01vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5cclxuaW1wb3J0IHsgbWlncmF0ZTEwMyB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5jb25zdCBTVEVBTUFQUF9JRCA9ICcyMjMyMCc7XHJcbmNvbnN0IEdPR19JRCA9ICcxNDM1ODI4NzY3JztcclxuY29uc3QgTVNfSUQgPSAnQmV0aGVzZGFTb2Z0d29ya3MuVEVTTW9ycm93aW5kLVBDJztcclxuXHJcbmNvbnN0IEdBTUVfSUQgPSBNT1JST1dJTkRfSUQ7XHJcblxyXG5jb25zdCBsb2NhbGVGb2xkZXJzWGJveCA9IHtcclxuICBlbjogJ01vcnJvd2luZCBHT1RZIEVuZ2xpc2gnLFxyXG4gIGZyOiAnTW9ycm93aW5kIEdPVFkgRnJlbmNoJyxcclxuICBkZTogJ01vcnJvd2luZCBHT1RZIEdlcm1hbicsXHJcbn1cclxuXHJcbmNvbnN0IGdhbWVTdG9yZUlkczogYW55ID0ge1xyXG4gIHN0ZWFtOiBbeyBpZDogU1RFQU1BUFBfSUQsIHByZWZlcjogMCB9XSxcclxuICB4Ym94OiBbeyBpZDogTVNfSUQgfV0sXHJcbiAgZ29nOiBbeyBpZDogR09HX0lEIH1dLFxyXG4gIHJlZ2lzdHJ5OiBbeyBpZDogJ0hLRVlfTE9DQUxfTUFDSElORTpTb2Z0d2FyZVxcXFxXb3c2NDMyTm9kZVxcXFxCZXRoZXNkYSBTb2Z0d29ya3NcXFxcTW9ycm93aW5kOkluc3RhbGxlZCBQYXRoJyB9XSxcclxufTtcclxuXHJcbmNvbnN0IHRvb2xzID0gW1xyXG4gIHtcclxuICAgIGlkOiAndGVzM2VkaXQnLFxyXG4gICAgbmFtZTogJ1RFUzNFZGl0JyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdURVMzRWRpdC5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW11cclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAnbXctY29uc3RydWN0aW9uLXNldCcsXHJcbiAgICBuYW1lOiAnQ29uc3RydWN0aW9uIFNldCcsXHJcbiAgICBsb2dvOiAnY29uc3RydWN0aW9uc2V0LnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTIENvbnN0cnVjdGlvbiBTZXQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXHJcbiAgICBdLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGNsdXNpdmU6IHRydWVcclxuICB9XHJcbl07XHJcblxyXG5hc3luYyBmdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICBjb25zdCBzdG9yZUdhbWVzID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZChnYW1lU3RvcmVJZHMpLmNhdGNoKCgpID0+IFtdKTtcclxuXHJcbiAgaWYgKCFzdG9yZUdhbWVzLmxlbmd0aCkgcmV0dXJuO1xyXG4gIFxyXG4gIGlmIChzdG9yZUdhbWVzLmxlbmd0aCA+IDEpIGxvZygnZGVidWcnLCAnTXV0bGlwbGUgY29waWVzIG9mIE9ibGl2aW9uIGZvdW5kJywgc3RvcmVHYW1lcy5tYXAocyA9PiBzLmdhbWVTdG9yZUlkKSk7XHJcblxyXG4gIGNvbnN0IHNlbGVjdGVkR2FtZSA9IHN0b3JlR2FtZXNbMF07XHJcbiAgaWYgKFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkKSkge1xyXG4gICAgLy8gR2V0IHRoZSB1c2VyJ3MgY2hvc2VuIGxhbmd1YWdlXHJcbiAgICAvLyBzdGF0ZS5pbnRlcmZhY2UubGFuZ3VhZ2UgfHwgJ2VuJztcclxuICAgIGxvZygnZGVidWcnLCAnRGVmYXVsdGluZyB0byB0aGUgRW5nbGlzaCBnYW1lIHZlcnNpb24nLCB7IHN0b3JlOiBzZWxlY3RlZEdhbWUuZ2FtZVN0b3JlSWQsIGZvbGRlcjogbG9jYWxlRm9sZGVyc1hib3hbJ2VuJ10gfSk7XHJcbiAgICBzZWxlY3RlZEdhbWUuZ2FtZVBhdGggPSBwYXRoLmpvaW4oc2VsZWN0ZWRHYW1lLmdhbWVQYXRoLCBsb2NhbGVGb2xkZXJzWGJveFsnZW4nXSk7XHJcbiAgfVxyXG4gIHJldHVybiBzZWxlY3RlZEdhbWU7XHJcbn1cclxuXHJcbi8qIE1vcnJvd2luZCBzZWVtcyB0byBzdGFydCBmaW5lIHdoZW4gcnVubmluZyBkaXJlY3RseS4gSWYgd2UgZG8gZ28gdGhyb3VnaCB0aGUgbGF1bmNoZXIgdGhlbiB0aGUgbGFuZ3VhZ2UgdmVyc2lvbiBiZWluZ1xyXG4gICBzdGFydGVkIG1pZ2h0IG5vdCBiZSB0aGUgb25lIHdlJ3JlIG1vZGRpbmdcclxuXHJcbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW01TX0lEXSwgJ3hib3gnKVxyXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcclxuICAgICAgYWRkSW5mbzoge1xyXG4gICAgICAgIGFwcElkOiBNU19JRCxcclxuICAgICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgICB7IGFwcEV4ZWNOYW1lOiAnR2FtZScgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xyXG59XHJcbiovXHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xyXG4gIGNvbnN0IGdhbWVOYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpPy5uYW1lIHx8ICdUaGlzIGdhbWUnO1xyXG5cclxuICAvLyB0aGUgZ2FtZSBkb2Vzbid0IGFjdHVhbGx5IGV4aXN0IG9uIHRoZSBlcGljIGdhbWUgc3RvcmUsIHRoaXMgY2h1bmsgaXMgY29weSZwYXN0ZWQsIGRvZXNuJ3QgaHVydFxyXG4gIC8vIGtlZXBpbmcgaXQgaWRlbnRpY2FsXHJcbiAgaWYgKGRpc2NvdmVyeS5zdG9yZSAmJiBbJ2VwaWMnLCAneGJveCddLmluY2x1ZGVzKGRpc2NvdmVyeS5zdG9yZSkpIHtcclxuICAgIGNvbnN0IHN0b3JlTmFtZSA9IGRpc2NvdmVyeS5zdG9yZSA9PT0gJ2VwaWMnID8gJ0VwaWMgR2FtZXMnIDogJ1hib3ggR2FtZSBQYXNzJztcclxuICAgIC8vIElmIHRoaXMgaXMgYW4gRXBpYyBvciBYYm94IGdhbWUgd2UndmUgZGVmYXVsdGVkIHRvIEVuZ2xpc2gsIHNvIHdlIHNob3VsZCBsZXQgdGhlIHVzZXIga25vdy5cclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6IGAke0dBTUVfSUR9LWxvY2FsZS1tZXNzYWdlYCxcclxuICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICB0aXRsZTogJ011bHRpcGxlIExhbmd1YWdlcyBBdmFpbGFibGUnLFxyXG4gICAgICBtZXNzYWdlOiAnRGVmYXVsdDogRW5nbGlzaCcsXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgICAgYWN0aW9uOiAoZGlzbWlzcykgPT4ge1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ011dGxpcGxlIExhbmd1YWdlcyBBdmFpbGFibGUnLCB7XHJcbiAgICAgICAgICAgICAgYmJjb2RlOiAne3tnYW1lTmFtZX19IGhhcyBtdWx0aXBsZSBsYW5ndWFnZSBvcHRpb25zIHdoZW4gZG93bmxvYWRlZCBmcm9tIHt7c3RvcmVOYW1lfX0uIFticl1bL2JyXVticl1bL2JyXScrXHJcbiAgICAgICAgICAgICAgICAnVm9ydGV4IGhhcyBzZWxlY3RlZCB0aGUgRW5nbGlzaCB2YXJpYW50IGJ5IGRlZmF1bHQuIFticl1bL2JyXVticl1bL2JyXScrXHJcbiAgICAgICAgICAgICAgICAnSWYgeW91IHdvdWxkIHByZWZlciB0byBtYW5hZ2UgYSBkaWZmZXJlbnQgbGFuZ3VhZ2UgeW91IGNhbiBjaGFuZ2UgdGhlIHBhdGggdG8gdGhlIGdhbWUgdXNpbmcgdGhlIFwiTWFudWFsbHkgU2V0IExvY2F0aW9uXCIgb3B0aW9uIGluIHRoZSBnYW1lcyB0YWIuJyxcclxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7IGdhbWVOYW1lLCBzdG9yZU5hbWUgfVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICAgICAgWyBcclxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IGFwaS5zdXBwcmVzc05vdGlmaWNhdGlvbihgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWApIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gQ29sbGVjdGlvbkRhdGFXcmFwKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvcHM6IElFeHRlbmRlZEludGVyZmFjZVByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcsIHsgLi4ucHJvcHMsIGFwaSwgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogTU9SUk9XSU5EX0lELFxyXG4gICAgbmFtZTogJ01vcnJvd2luZCcsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IHV0aWwudG9CbHVlKGZpbmRHYW1lKSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHNldHVwOiB1dGlsLnRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSksXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdEYXRhIEZpbGVzJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnbW9ycm93aW5kLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdtb3Jyb3dpbmQuZXhlJyxcclxuICAgIF0sXHJcbiAgICAvLyByZXF1aXJlc0xhdW5jaGVyLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiBwYXJzZUludChTVEVBTUFQUF9JRCwgMTApLFxyXG4gICAgICBnb2dBcHBJZDogR09HX0lEXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcclxuICAgIGdhbWVJZDogTU9SUk9XSU5EX0lELFxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpKSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IHRydWUsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogJ0RyYWcgeW91ciBwbHVnaW5zIGFzIG5lZWRlZCAtIHRoZSBnYW1lIHdpbGwgbG9hZCAnXHJcbiAgICAgICsgJ2xvYWQgdGhlbSBmcm9tIHRvcCB0byBib3R0b20uJyxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ21vcnJvd2luZF9jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZCwgY29sbGVjdGlvbikgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ0xvYWQgT3JkZXInKSxcclxuICAgIChzdGF0ZSwgZ2FtZUlkKSA9PiBnYW1lSWQgPT09IE1PUlJPV0lORF9JRCxcclxuICAgIChwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpID0+IENvbGxlY3Rpb25EYXRhV3JhcChjb250ZXh0LmFwaSwgcHJvcHMpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTEwMyhjb250ZXh0LmFwaSwgb2xkKSk7XHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgYXN5bmMgKGdhbWVJZCwgYXJjaGl2ZUlkLCBtb2RJZCkgPT4ge1xyXG4gICAgICBpZiAoZ2FtZUlkICE9PSBNT1JST1dJTkRfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBNT1JST1dJTkRfSUQpO1xyXG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgTU9SUk9XSU5EX0lELCBtb2RJZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChpbnN0YWxsUGF0aCA9PT0gdW5kZWZpbmVkIHx8IG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgY29uc3QgcGx1Z2lucyA9IFtdO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHdhbGsobW9kUGF0aCwgZW50cmllcyA9PiB7XHJcbiAgICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgICAgICAgIGlmIChbJy5lc3AnLCAnLmVzbSddLmluY2x1ZGVzKHBhdGguZXh0bmFtZShlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpKSkpIHtcclxuICAgICAgICAgICAgICBwbHVnaW5zLnB1c2gocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwTGlua3M6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbGlzdCBvZiBwbHVnaW5zJywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHBsdWdpbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKE1PUlJPV0lORF9JRCwgbW9kLmlkLCAncGx1Z2lucycsIHBsdWdpbnMpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluXHJcbn07XHJcbiJdfQ==