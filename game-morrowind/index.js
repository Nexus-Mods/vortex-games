"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsMkNBQTZEO0FBQzdELHNFQUFxQztBQUNyQyw2Q0FBK0I7QUFFL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUUxQywyQ0FBaUY7QUFDakYsMkNBQTJDO0FBSTNDLCtDQUF5RTtBQUV6RSx3R0FBZ0Y7QUFFaEYsNkNBQTBDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUM7QUFDL0IsTUFBTSxLQUFLLEdBQUcsbUNBQW1DLENBQUM7QUFFbEQsTUFBTSxLQUFLLEdBQUc7SUFDWjtRQUNFLEVBQUUsRUFBRSxVQUFVO1FBQ2QsSUFBSSxFQUFFLFVBQVU7UUFDaEIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWM7UUFDaEMsYUFBYSxFQUFFLEVBQUU7S0FDbEI7SUFDRDtRQUNFLEVBQUUsRUFBRSxxQkFBcUI7UUFDekIsSUFBSSxFQUFFLGtCQUFrQjtRQUN4QixJQUFJLEVBQUUscUJBQXFCO1FBQzNCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQywwQkFBMEI7UUFDNUMsYUFBYSxFQUFFO1lBQ2IsMEJBQTBCO1NBQzNCO1FBQ0QsUUFBUSxFQUFFLElBQUk7UUFDZCxTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUM7QUFFRixTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ1gsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUM7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Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmNvbnN0IHdhbGsgPSByZXF1aXJlKCd0dXJib3dhbGsnKS5kZWZhdWx0O1xyXG5cclxuaW1wb3J0IHsgdmFsaWRhdGUsIGRlc2VyaWFsaXplTG9hZE9yZGVyLCBzZXJpYWxpemVMb2FkT3JkZXIgfSBmcm9tICcuL2xvYWRvcmRlcic7XHJcbmltcG9ydCB7IE1PUlJPV0lORF9JRCB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCB7IElFeHRlbmRlZEludGVyZmFjZVByb3BzIH0gZnJvbSAnLi90eXBlcy90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucyc7XHJcblxyXG5pbXBvcnQgTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL01vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5cclxuaW1wb3J0IHsgbWlncmF0ZTEwMyB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5jb25zdCBTVEVBTUFQUF9JRCA9ICcyMjMyMCc7XHJcbmNvbnN0IEdPR0FQUF9JRCA9ICcxNDM1ODI4NzY3JztcclxuY29uc3QgTVNfSUQgPSAnQmV0aGVzZGFTb2Z0d29ya3MuVEVTTW9ycm93aW5kLVBDJztcclxuXHJcbmNvbnN0IHRvb2xzID0gW1xyXG4gIHtcclxuICAgIGlkOiAndGVzM2VkaXQnLFxyXG4gICAgbmFtZTogJ1RFUzNFZGl0JyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdURVMzRWRpdC5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW11cclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAnbXctY29uc3RydWN0aW9uLXNldCcsXHJcbiAgICBuYW1lOiAnQ29uc3RydWN0aW9uIFNldCcsXHJcbiAgICBsb2dvOiAnY29uc3RydWN0aW9uc2V0LnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTIENvbnN0cnVjdGlvbiBTZXQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1RFUyBDb25zdHJ1Y3Rpb24gU2V0LmV4ZScsXHJcbiAgICBdLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGNsdXNpdmU6IHRydWVcclxuICB9XHJcbl07XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1NURUFNQVBQX0lELCBHT0dBUFBfSUQsIE1TX0lEXSlcclxuICAgIC50aGVuKGdhbWUgPT4ge1xyXG4gICAgICBjb25zdCBpc1hib3ggPSBnYW1lLmdhbWVTdG9yZUlkID09PSAneGJveCc7XHJcbiAgICAgIC8vIFRoZSB4Ym94IHBhc3MgdmFyaWFudCBoYXMgYSBkaWZmZXJlbnQgZmlsZSBzdHJ1Y3R1cmU7IHdlJ3JlIG5haXZlbHlcclxuICAgICAgLy8gIGFzc3VtaW5nIHRoYXQgYWxsIFhCT1ggY29waWVzIChyZWdhcmRsZXNzIG9mIGxvY2FsZSkgd2lsbCBjb250YWluXHJcbiAgICAgIC8vICB0aGUgRW5nbGlzaCB2YXJpYW50IGFzIHdlbGwgKGZpbmdlcnMgY3Jvc3NlZClcclxuICAgICAgcmV0dXJuIChpc1hib3gpXHJcbiAgICAgICAgPyBQcm9taXNlLnJlc29sdmUocGF0aC5qb2luKGdhbWUuZ2FtZVBhdGgsICdNb3Jyb3dpbmQgR09UWSBFbmdsaXNoJykpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlc29sdmUoZ2FtZS5nYW1lUGF0aCk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKCgpID0+IHtcclxuICAgICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoXHJcbiAgICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXHJcbiAgICAgICAgJ1NvZnR3YXJlXFxcXFdvdzY0MzJOb2RlXFxcXEJldGhlc2RhIFNvZnR3b3Jrc1xcXFxNb3Jyb3dpbmQnLFxyXG4gICAgICAgICdJbnN0YWxsZWQgUGF0aCdcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmICghaW5zdFBhdGgpIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdFBhdGgudmFsdWUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW01TX0lEXSwgJ3hib3gnKVxyXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcclxuICAgICAgYWRkSW5mbzoge1xyXG4gICAgICAgIGFwcElkOiBNU19JRCxcclxuICAgICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgICB7IGFwcEV4ZWNOYW1lOiAnR2FtZScgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBDb2xsZWN0aW9uRGF0YVdyYXAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpOiBKU1guRWxlbWVudCB7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldywgeyAuLi5wcm9wcywgYXBpLCB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IE1PUlJPV0lORF9JRCxcclxuICAgIG5hbWU6ICdNb3Jyb3dpbmQnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ0RhdGEgRmlsZXMnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdtb3Jyb3dpbmQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ21vcnJvd2luZC5leGUnLFxyXG4gICAgXSxcclxuICAgIHJlcXVpcmVzTGF1bmNoZXIsXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTUFQUF9JRCxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IHBhcnNlSW50KFNURUFNQVBQX0lELCAxMCksXHJcbiAgICAgIGdvZ0FwcElkOiBHT0dBUFBfSURcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xyXG4gICAgZ2FtZUlkOiBNT1JST1dJTkRfSUQsXHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGkpLFxyXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGksIGxvYWRPcmRlciksXHJcbiAgICB2YWxpZGF0ZSxcclxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogdHJ1ZSxcclxuICAgIHVzYWdlSW5zdHJ1Y3Rpb25zOiAoKCkgPT4gJ0RyYWcgeW91ciBwbHVnaW5zIGFzIG5lZWRlZCAtIHRoZSBnYW1lIHdpbGwgbG9hZCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdsb2FkIHRoZW0gZnJvbSB0b3AgdG8gYm90dG9tLicpLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXHJcbiAgICAnbW9ycm93aW5kX2NvbGxlY3Rpb25fZGF0YScsXHJcbiAgICAoZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pID0+XHJcbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbiksXHJcbiAgICAoZ2FtZUlkLCBjb2xsZWN0aW9uKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXHJcbiAgICAodCkgPT4gdCgnTG9hZCBPcmRlcicpLFxyXG4gICAgKHN0YXRlLCBnYW1lSWQpID0+IGdhbWVJZCA9PT0gTU9SUk9XSU5EX0lELFxyXG4gICAgKHByb3BzOiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcykgPT4gQ29sbGVjdGlvbkRhdGFXcmFwKGNvbnRleHQuYXBpLCBwcm9wcykpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKG9sZCA9PiBtaWdyYXRlMTAzKGNvbnRleHQuYXBpLCBvbGQpKTtcclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdkaWQtaW5zdGFsbC1tb2QnLCBhc3luYyAoZ2FtZUlkLCBhcmNoaXZlSWQsIG1vZElkKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lSWQgIT09IE1PUlJPV0lORF9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIE1PUlJPV0lORF9JRCk7XHJcbiAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBNT1JST1dJTkRfSUQsIG1vZElkXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKGluc3RhbGxQYXRoID09PSB1bmRlZmluZWQgfHwgbW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgICBjb25zdCBwbHVnaW5zID0gW107XHJcbiAgICAgIGF3YWl0IHdhbGsobW9kUGF0aCwgZW50cmllcyA9PiB7XHJcbiAgICAgICAgZm9yIChsZXQgZW50cnkgb2YgZW50cmllcykge1xyXG4gICAgICAgICAgaWYgKFsnLmVzcCcsICcuZXNtJ10uaW5jbHVkZXMocGF0aC5leHRuYW1lKGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkpKSkge1xyXG4gICAgICAgICAgICBwbHVnaW5zLnB1c2gocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwTGlua3M6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUgfSk7XHJcbiAgICAgIGlmICggcGx1Z2lucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoTU9SUk9XSU5EX0lELCBtb2QuaWQsICdwbHVnaW5zJywgcGx1Z2lucykpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW5cclxufTtcclxuIl19