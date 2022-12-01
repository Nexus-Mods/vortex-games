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
const winapi_bindings_1 = __importDefault(require("winapi-bindings"));
const React = __importStar(require("react"));
const walk = require('turbowalk').default;
const loadorder_1 = require("./loadorder");
const constants_1 = require("./constants");
const collections_1 = require("./collections");
const MorrowindCollectionsDataView_1 = __importDefault(require("./views/MorrowindCollectionsDataView"));
const migrations_1 = require("./migrations");
const STEAMAPP_ID = '22320';
const GOGAPP_ID = '1435828767';
const MS_ID = 'BethesdaSoftworks.TESMorrowind-PC';
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
    return vortex_api_1.util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID, MS_ID])
        .then(game => {
        const isXbox = game.gameStoreId === 'xbox';
        return (isXbox)
            ? Promise.resolve(path_1.default.join(game.gamePath, 'Morrowind GOTY English'))
            : Promise.resolve(game.gamePath);
    })
        .catch(() => {
        const instPath = winapi_bindings_1.default.RegGetValue('HKEY_LOCAL_MACHINE', 'Software\\Wow6432Node\\Bethesda Softworks\\Morrowind', 'Installed Path');
        if (!instPath)
            throw new Error('empty registry key');
        return Promise.resolve(instPath.value);
    });
}
function requiresLauncher(gamePath) {
    return vortex_api_1.util.GameStoreHelper.findByAppId([MS_ID], 'xbox')
        .then(() => Promise.resolve({
        launcher: 'xbox',
        addInfo: {
            appId: MS_ID,
            parameters: [
                { appExecName: 'Game' },
            ],
        }
    }))
        .catch(err => Promise.resolve(undefined));
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
        queryModPath: () => 'Data Files',
        logo: 'gameart.jpg',
        executable: () => 'morrowind.exe',
        requiredFiles: [
            'morrowind.exe',
        ],
        requiresLauncher,
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: parseInt(STEAMAPP_ID, 10),
            gogAppId: GOGAPP_ID
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUE2RDtBQUM3RCxzRUFBcUM7QUFDckMsNkNBQStCO0FBRS9CLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFFMUMsMkNBQWlGO0FBQ2pGLDJDQUEyQztBQUkzQywrQ0FBeUU7QUFFekUsd0dBQWdGO0FBRWhGLDZDQUEwQztBQUUxQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7QUFDNUIsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDO0FBQy9CLE1BQU0sS0FBSyxHQUFHLG1DQUFtQyxDQUFDO0FBRWxELE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRSxFQUFFO0tBQ2xCO0lBQ0Q7UUFDRSxFQUFFLEVBQUUscUJBQXFCO1FBQ3pCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQTBCO1FBQzVDLGFBQWEsRUFBRTtZQUNiLDBCQUEwQjtTQUMzQjtRQUNELFFBQVEsRUFBRSxJQUFJO1FBQ2QsU0FBUyxFQUFFLElBQUk7S0FDaEI7Q0FDRixDQUFDO0FBRUYsU0FBUyxRQUFRO0lBQ2YsT0FBTyxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNYLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxD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Q0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcblxyXG5jb25zdCB3YWxrID0gcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdDtcclxuXHJcbmltcG9ydCB7IHZhbGlkYXRlLCBkZXNlcmlhbGl6ZUxvYWRPcmRlciwgc2VyaWFsaXplTG9hZE9yZGVyIH0gZnJvbSAnLi9sb2Fkb3JkZXInO1xyXG5pbXBvcnQgeyBNT1JST1dJTkRfSUQgfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgeyBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyB9IGZyb20gJy4vdHlwZXMvdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMnO1xyXG5cclxuaW1wb3J0IE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Nb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCB7IG1pZ3JhdGUxMDMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuY29uc3QgU1RFQU1BUFBfSUQgPSAnMjIzMjAnO1xyXG5jb25zdCBHT0dBUFBfSUQgPSAnMTQzNTgyODc2Nyc7XHJcbmNvbnN0IE1TX0lEID0gJ0JldGhlc2RhU29mdHdvcmtzLlRFU01vcnJvd2luZC1QQyc7XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICB7XHJcbiAgICBpZDogJ3RlczNlZGl0JyxcclxuICAgIG5hbWU6ICdURVMzRWRpdCcsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTM0VkaXQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogJ213LWNvbnN0cnVjdGlvbi1zZXQnLFxyXG4gICAgbmFtZTogJ0NvbnN0cnVjdGlvbiBTZXQnLFxyXG4gICAgbG9nbzogJ2NvbnN0cnVjdGlvbnNldC5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdURVMgQ29uc3RydWN0aW9uIFNldC5leGUnLFxyXG4gICAgXSxcclxuICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgZXhjbHVzaXZlOiB0cnVlXHJcbiAgfVxyXG5dO1xyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTUFQUF9JRCwgR09HQVBQX0lELCBNU19JRF0pXHJcbiAgICAudGhlbihnYW1lID0+IHtcclxuICAgICAgY29uc3QgaXNYYm94ID0gZ2FtZS5nYW1lU3RvcmVJZCA9PT0gJ3hib3gnO1xyXG4gICAgICAvLyBUaGUgeGJveCBwYXNzIHZhcmlhbnQgaGFzIGEgZGlmZmVyZW50IGZpbGUgc3RydWN0dXJlOyB3ZSdyZSBuYWl2ZWx5XHJcbiAgICAgIC8vICBhc3N1bWluZyB0aGF0IGFsbCBYQk9YIGNvcGllcyAocmVnYXJkbGVzcyBvZiBsb2NhbGUpIHdpbGwgY29udGFpblxyXG4gICAgICAvLyAgdGhlIEVuZ2xpc2ggdmFyaWFudCBhcyB3ZWxsIChmaW5nZXJzIGNyb3NzZWQpXHJcbiAgICAgIHJldHVybiAoaXNYYm94KVxyXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHBhdGguam9pbihnYW1lLmdhbWVQYXRoLCAnTW9ycm93aW5kIEdPVFkgRW5nbGlzaCcpKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKGdhbWUuZ2FtZVBhdGgpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKFxyXG4gICAgICAgICdIS0VZX0xPQ0FMX01BQ0hJTkUnLFxyXG4gICAgICAgICdTb2Z0d2FyZVxcXFxXb3c2NDMyTm9kZVxcXFxCZXRoZXNkYSBTb2Z0d29ya3NcXFxcTW9ycm93aW5kJyxcclxuICAgICAgICAnSW5zdGFsbGVkIFBhdGgnXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoIWluc3RQYXRoKSB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RQYXRoLnZhbHVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXF1aXJlc0xhdW5jaGVyKGdhbWVQYXRoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtNU19JRF0sICd4Ym94JylcclxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIGxhdW5jaGVyOiAneGJveCcsXHJcbiAgICAgIGFkZEluZm86IHtcclxuICAgICAgICBhcHBJZDogTVNfSUQsXHJcbiAgICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgICAgeyBhcHBFeGVjTmFtZTogJ0dhbWUnIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gQ29sbGVjdGlvbkRhdGFXcmFwKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvcHM6IElFeHRlbmRlZEludGVyZmFjZVByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcsIHsgLi4ucHJvcHMsIGFwaSwgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBNT1JST1dJTkRfSUQsXHJcbiAgICBuYW1lOiAnTW9ycm93aW5kJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdEYXRhIEZpbGVzJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnbW9ycm93aW5kLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdtb3Jyb3dpbmQuZXhlJyxcclxuICAgIF0sXHJcbiAgICByZXF1aXJlc0xhdW5jaGVyLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1BUFBfSUQsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiBwYXJzZUludChTVEVBTUFQUF9JRCwgMTApLFxyXG4gICAgICBnb2dBcHBJZDogR09HQVBQX0lEXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcclxuICAgIGdhbWVJZDogTU9SUk9XSU5EX0lELFxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpKSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IHRydWUsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+ICdEcmFnIHlvdXIgcGx1Z2lucyBhcyBuZWVkZWQgLSB0aGUgZ2FtZSB3aWxsIGxvYWQgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnbG9hZCB0aGVtIGZyb20gdG9wIHRvIGJvdHRvbS4nKSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ21vcnJvd2luZF9jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZCwgY29sbGVjdGlvbikgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ0xvYWQgT3JkZXInKSxcclxuICAgIChzdGF0ZSwgZ2FtZUlkKSA9PiBnYW1lSWQgPT09IE1PUlJPV0lORF9JRCxcclxuICAgIChwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpID0+IENvbGxlY3Rpb25EYXRhV3JhcChjb250ZXh0LmFwaSwgcHJvcHMpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbihvbGQgPT4gbWlncmF0ZTEwMyhjb250ZXh0LmFwaSwgb2xkKSk7XHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgYXN5bmMgKGdhbWVJZCwgYXJjaGl2ZUlkLCBtb2RJZCkgPT4ge1xyXG4gICAgICBpZiAoZ2FtZUlkICE9PSBNT1JST1dJTkRfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBNT1JST1dJTkRfSUQpO1xyXG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgTU9SUk9XSU5EX0lELCBtb2RJZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChpbnN0YWxsUGF0aCA9PT0gdW5kZWZpbmVkIHx8IG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgY29uc3QgcGx1Z2lucyA9IFtdO1xyXG4gICAgICBhd2FpdCB3YWxrKG1vZFBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgICAgIGlmIChbJy5lc3AnLCAnLmVzbSddLmluY2x1ZGVzKHBhdGguZXh0bmFtZShlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpKSkpIHtcclxuICAgICAgICAgICAgcGx1Z2lucy5wdXNoKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH0pO1xyXG4gICAgICBpZiAoIHBsdWdpbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKE1PUlJPV0lORF9JRCwgbW9kLmlkLCAncGx1Z2lucycsIHBsdWdpbnMpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluXHJcbn07XHJcbiJdfQ==