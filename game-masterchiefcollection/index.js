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
const common_1 = require("./common");
const modTypes_1 = require("./modTypes");
const installers_1 = require("./installers");
const tests_1 = require("./tests");
const util_1 = require("./util");
class MasterChiefCollectionGame {
    constructor(context) {
        this.requiresLauncher = vortex_api_1.util.toBlue((gamePath, store) => this.checkLauncher(gamePath, store));
        this.context = context;
        this.id = common_1.GAME_ID;
        this.name = 'Halo: The Master Chief Collection';
        this.shortName = 'Halo: MCC';
        this.logo = 'gameart.jpg';
        this.api = context.api;
        this.getGameVersion = resolveGameVersion,
            this.requiredFiles = [
                this.executable(),
            ];
        this.supportedTools = [
            {
                id: 'haloassemblytool',
                name: 'Assembly',
                logo: 'assemblytool.png',
                executable: () => 'Assembly.exe',
                requiredFiles: [
                    'Assembly.exe',
                ],
                relative: true,
            },
        ];
        this.environment = {
            SteamAPPId: common_1.STEAM_ID,
        };
        this.details = {
            steamAppId: +common_1.STEAM_ID,
        };
        this.mergeMods = true;
    }
    queryModPath(gamePath) {
        return '.';
    }
    executable() {
        return 'mcclauncher.exe';
    }
    prepare(discovery) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    queryPath() {
        return vortex_api_1.util.GameStoreHelper.findByAppId([common_1.STEAM_ID, common_1.MS_APPID])
            .then(game => game.gamePath);
    }
    checkLauncher(gamePath, store) {
        return __awaiter(this, void 0, void 0, function* () {
            if (store === 'xbox') {
                return Promise.resolve({
                    launcher: 'xbox',
                    addInfo: {
                        appId: common_1.MS_APPID,
                        parameters: [
                            { appExecName: 'HaloMCCShippingNoEAC' },
                        ],
                    }
                });
            }
            else if (store === 'steam') {
                return Promise.resolve({
                    launcher: 'steam',
                    addInfo: {
                        appId: common_1.STEAM_ID,
                        parameters: ['option2'],
                        launchType: 'gamestore',
                    }
                });
            }
            return Promise.resolve(undefined);
        });
    }
}
const resolveGameVersion = (discoveryPath) => __awaiter(void 0, void 0, void 0, function* () {
    const versionPath = path_1.default.join(discoveryPath, 'build_tag.txt');
    return vortex_api_1.fs.readFileAsync(versionPath, { encoding: 'utf8' })
        .then((res) => Promise.resolve(res.split('\r\n')[0].trim()));
});
module.exports = {
    default: (context) => {
        context.registerGame(new MasterChiefCollectionGame(context));
        context.registerModType(common_1.MODTYPE_PLUG_AND_PLAY, 15, (gameId) => gameId === common_1.GAME_ID, () => undefined, modTypes_1.testPlugAndPlayModType, {
            deploymentEssential: false,
            mergeMods: true,
            name: 'MCC Plug and Play mod',
            noConflicts: true,
        });
        context.registerInstaller('mcc-plug-and-play-installer', 15, installers_1.testPlugAndPlayInstaller, installers_1.installPlugAndPlay);
        context.registerInstaller('masterchiefmodconfiginstaller', 20, installers_1.testModConfigInstaller, installers_1.installModConfig);
        context.registerInstaller('masterchiefinstaller', 25, installers_1.testInstaller, installers_1.install);
        context.registerTest('mcc-ce-mp-test', 'gamemode-activated', vortex_api_1.util.toBlue(() => (0, tests_1.testCEMP)(context.api)));
        context.registerTableAttribute('mods', {
            id: 'gameType',
            name: 'Game(s)',
            description: 'Target Halo game(s) for this mod',
            icon: 'inspect',
            placement: 'table',
            customRenderer: (mod) => {
                const createImgDiv = (entry, idx) => {
                    return React.createElement('div', { className: 'halo-img-div', key: `${entry.internalId}-${idx}` }, React.createElement('img', { className: 'halogameimg', src: `file://${entry.img}` }), React.createElement('span', {}, entry.name));
                };
                const internalIds = vortex_api_1.util.getSafe(mod, ['attributes', 'haloGames'], []);
                const haloEntries = Object.keys(common_1.HALO_GAMES)
                    .filter(key => internalIds.includes(common_1.HALO_GAMES[key].internalId))
                    .map(key => common_1.HALO_GAMES[key]);
                return React.createElement(vortex_api_1.FlexLayout, { type: 'row' }, React.createElement(vortex_api_1.FlexLayout.Flex, { className: 'haloimglayout' }, haloEntries.map((entry, idx) => createImgDiv(entry, idx))));
            },
            calc: (mod) => vortex_api_1.util.getSafe(mod, ['attributes', 'haloGames'], undefined),
            filter: new vortex_api_1.OptionsFilter([].concat([{ value: vortex_api_1.OptionsFilter.EMPTY, label: '<None>' }], Object.keys(common_1.HALO_GAMES)
                .map(key => {
                return { value: common_1.HALO_GAMES[key].internalId, label: common_1.HALO_GAMES[key].name };
            })), true, false),
            isToggleable: true,
            edit: {},
            isSortable: false,
            isGroupable: (mod) => {
                const internalIds = vortex_api_1.util.getSafe(mod, ['attributes', 'haloGames'], []);
                const haloEntries = Object.keys(common_1.HALO_GAMES)
                    .filter(key => internalIds.includes(common_1.HALO_GAMES[key].internalId))
                    .map(key => common_1.HALO_GAMES[key]);
                if (haloEntries.length > 1) {
                    return 'Multiple';
                }
                else {
                    return (!!haloEntries && (haloEntries.length > 0))
                        ? haloEntries[0].name
                        : 'None';
                }
            },
            isDefaultVisible: true,
            condition: () => {
                const activeGameId = vortex_api_1.selectors.activeGameId(context.api.store.getState());
                return (activeGameId === common_1.GAME_ID);
            }
        });
        context.once(() => {
            context.api.setStylesheet('masterchiefstyle', path_1.default.join(__dirname, 'masterchief.scss'));
            context.api.onAsync('did-deploy', (profileId) => __awaiter(void 0, void 0, void 0, function* () { return (0, util_1.applyToManifest)(context.api, true); }));
            context.api.onAsync('did-purge', (profileId) => __awaiter(void 0, void 0, void 0, function* () { return (0, util_1.applyToManifest)(context.api, false); }));
        });
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUFtRjtBQUVuRiw2Q0FBK0I7QUFFL0IscUNBQTBGO0FBRTFGLHlDQUFvRDtBQUNwRCw2Q0FBOEk7QUFDOUksbUNBQW1DO0FBQ25DLGlDQUF5QztBQUd6QyxNQUFNLHlCQUF5QjtJQWM3QixZQUFZLE9BQU87UUFpRFoscUJBQWdCLEdBQUcsaUJBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFnQixFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQWhEOUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxnQkFBTyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsbUNBQW1DLENBQUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7UUFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7UUFDMUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsa0JBQWtCO1lBQ3hDLElBQUksQ0FBQyxhQUFhLEdBQUc7Z0JBQ25CLElBQUksQ0FBQyxVQUFVLEVBQUU7YUFDbEIsQ0FBQztRQUNGLElBQUksQ0FBQyxjQUFjLEdBQUc7WUFDcEI7Z0JBQ0UsRUFBRSxFQUFFLGtCQUFrQjtnQkFDdEIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO2dCQUNoQyxhQUFhLEVBQUU7b0JBQ2IsY0FBYztpQkFDZjtnQkFDRCxRQUFR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QUFLLGdCQUFPLENBQUMsQ0FBQztZQUNwQyxDQUFDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFPLFNBQWlCLEVBQUUsRUFBRSxrREFBQyxPQUFBLElBQUEsc0JBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBLEdBQUEsQ0FBQyxDQUFDO1lBQ25HLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFPLFNBQWlCLEVBQUUsRUFBRSxrREFBQyxPQUFBLElBQUEsc0JBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBLEdBQUEsQ0FBQyxDQUFDO1FBQ3JHLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZnMsIHR5cGVzLCBGbGV4TGF5b3V0LCBPcHRpb25zRmlsdGVyLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIEhBTE9fR0FNRVMsIE1TX0FQUElELCBTVEVBTV9JRCwgTU9EVFlQRV9QTFVHX0FORF9QTEFZIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBMYXVuY2hlckNvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyB0ZXN0UGx1Z0FuZFBsYXlNb2RUeXBlIH0gZnJvbSAnLi9tb2RUeXBlcyc7XHJcbmltcG9ydCB7IGluc3RhbGxQbHVnQW5kUGxheSwgdGVzdE1vZENvbmZpZ0luc3RhbGxlciwgdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyLCBpbnN0YWxsTW9kQ29uZmlnLCBpbnN0YWxsLCB0ZXN0SW5zdGFsbGVyIH0gZnJvbSAnLi9pbnN0YWxsZXJzJztcclxuaW1wb3J0IHsgdGVzdENFTVAgfSBmcm9tICcuL3Rlc3RzJztcclxuaW1wb3J0IHsgYXBwbHlUb01hbmlmZXN0IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbi8vIE1hc3RlciBjaGVmIGNvbGxlY3Rpb25cclxuY2xhc3MgTWFzdGVyQ2hpZWZDb2xsZWN0aW9uR2FtZSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcclxuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XHJcbiAgcHVibGljIGlkOiBzdHJpbmc7XHJcbiAgcHVibGljIG5hbWU6IHN0cmluZztcclxuICBwdWJsaWMgc2hvcnROYW1lOiBzdHJpbmc7XHJcbiAgcHVibGljIGxvZ286IHN0cmluZztcclxuICBwdWJsaWMgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHB1YmxpYyBnZXRHYW1lVmVyc2lvbjogKGRpc2NvdmVyeVBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+O1xyXG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdO1xyXG4gIHB1YmxpYyBlbnZpcm9ubWVudDogYW55O1xyXG4gIHB1YmxpYyBkZXRhaWxzOiBhbnk7XHJcbiAgcHVibGljIG1lcmdlTW9kczogYm9vbGVhbjtcclxuXHJcbiAgY29uc3RydWN0b3IoY29udGV4dCkge1xyXG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgIHRoaXMuaWQgPSBHQU1FX0lEO1xyXG4gICAgdGhpcy5uYW1lID0gJ0hhbG86IFRoZSBNYXN0ZXIgQ2hpZWYgQ29sbGVjdGlvbic7XHJcbiAgICB0aGlzLnNob3J0TmFtZSA9ICdIYWxvOiBNQ0MnO1xyXG4gICAgdGhpcy5sb2dvID0gJ2dhbWVhcnQuanBnJztcclxuICAgIHRoaXMuYXBpID0gY29udGV4dC5hcGk7XHJcbiAgICB0aGlzLmdldEdhbWVWZXJzaW9uID0gcmVzb2x2ZUdhbWVWZXJzaW9uLFxyXG4gICAgdGhpcy5yZXF1aXJlZEZpbGVzID0gW1xyXG4gICAgICB0aGlzLmV4ZWN1dGFibGUoKSxcclxuICAgIF07XHJcbiAgICB0aGlzLnN1cHBvcnRlZFRvb2xzID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdoYWxvYXNzZW1ibHl0b29sJyxcclxuICAgICAgICBuYW1lOiAnQXNzZW1ibHknLFxyXG4gICAgICAgIGxvZ286ICdhc3NlbWJseXRvb2wucG5nJyxcclxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnQXNzZW1ibHkuZXhlJyxcclxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICAgICAnQXNzZW1ibHkuZXhlJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuICAgIHRoaXMuZW52aXJvbm1lbnQgPSB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfTtcclxuICAgIHRoaXMuZGV0YWlscyA9IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgfTtcclxuICAgIHRoaXMubWVyZ2VNb2RzID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHF1ZXJ5TW9kUGF0aChnYW1lUGF0aCkge1xyXG4gICAgcmV0dXJuICcuJztcclxuICB9XHJcblxyXG4gIGV4ZWN1dGFibGUoKSB7XHJcbiAgICByZXR1cm4gJ21jY2xhdW5jaGVyLmV4ZSc7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgcHJlcGFyZShkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBxdWVyeVBhdGgoKSB7XHJcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1NURUFNX0lELCBNU19BUFBJRF0pXHJcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVxdWlyZXNMYXVuY2hlciA9IHV0aWwudG9CbHVlKChnYW1lUGF0aDogc3RyaW5nLCBzdG9yZTogc3RyaW5nKSA9PiB0aGlzLmNoZWNrTGF1bmNoZXIoZ2FtZVBhdGgsIHN0b3JlKSk7XHJcbiAgcHVibGljIGFzeW5jIGNoZWNrTGF1bmNoZXIoZ2FtZVBhdGg6IHN0cmluZywgc3RvcmU6IHN0cmluZyk6IExhdW5jaGVyQ29uZmlnIHwgdW5kZWZpbmVkIHtcclxuICAgIGlmIChzdG9yZSA9PT0gJ3hib3gnKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgIGxhdW5jaGVyOiAneGJveCcsXHJcbiAgICAgICAgYWRkSW5mbzoge1xyXG4gICAgICAgICAgYXBwSWQ6IE1TX0FQUElELFxyXG4gICAgICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgICAgICB7IGFwcEV4ZWNOYW1lOiAnSGFsb01DQ1NoaXBwaW5nTm9FQUMnIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKHN0b3JlID09PSAnc3RlYW0nKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgIGxhdW5jaGVyOiAnc3RlYW0nLFxyXG4gICAgICAgIGFkZEluZm86IHtcclxuICAgICAgICAgIGFwcElkOiBTVEVBTV9JRCxcclxuICAgICAgICAgIHBhcmFtZXRlcnM6IFsnb3B0aW9uMiddLFxyXG4gICAgICAgICAgbGF1bmNoVHlwZTogJ2dhbWVzdG9yZScsXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBmdW5jdGlvbiBnZXRYYm94SWQoaW50ZXJuYWxJZCwgZmlsZVBhdGgsIGVuY29kaW5nKSB7XHJcbi8vICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgeGJveCBpZCBvZiB0aGUgbGFzdCBwbGF5ZXJcclxuLy8gICAvLyAgd2hvIHJhbiB0aGUgZ2FtZS4gVGhpcyBjYW4gcG90ZW50aWFsbHkgYmUgdXNlZCB0byBtb2QgdGhlIGdhbWVcclxuLy8gICAvLyAgb25seSBmb3Igc3BlY2lmaWMgeGJveCBpZHMgd2hpbGUgbGVhdmluZyBvdGhlcnMgaW4gYW4gdW50YW1wZXJlZCBzdGF0ZS4gKFdJUClcclxuLy8gICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aCwgeyBlbmNvZGluZyB9KVxyXG4vLyAgICAgLnRoZW4oZmlsZURhdGEgPT4ge1xyXG4vLyAgICAgICBsZXQgeG1sRG9jO1xyXG4vLyAgICAgICB0cnkge1xyXG4vLyAgICAgICAgIHhtbERvYyA9IHBhcnNlWG1sU3RyaW5nKGZpbGVEYXRhKTtcclxuLy8gICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbi8vICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbi8vICAgICAgIH1cclxuXHJcbi8vICAgICAgIGNvbnN0IGdlbmVyYWxEYXRhID0geG1sRG9jLmZpbmQoJy8vQ2FtcGFpZ25DYXJuYWdlUmVwb3J0L0dlbmVyYWxEYXRhJyk7XHJcbi8vICAgICAgIGlmIChnZW5lcmFsRGF0YVswXS5hdHRyKCdHYW1lSWQnKS52YWx1ZSgpID09PSBpbnRlcm5hbElkKSB7XHJcbi8vICAgICAgICAgY29uc3QgcGxheWVycyA9IHhtbERvYy5maW5kKCcvL0NhbXBhaWduQ2FybmFnZVJlcG9ydC9QbGF5ZXJzL1BsYXllckluZm8nKTtcclxuLy8gICAgICAgICBjb25zdCBtYWluUGxheWVyID0gcGxheWVycy5maW5kKHBsYXllciA9PiBwbGF5ZXIuYXR0cignaXNHdWVzdCcpLnZhbHVlKCkgPT09ICdmYWxzZScpO1xyXG4vLyAgICAgICAgIGNvbnN0IHhib3hJZCA9IG1haW5QbGF5ZXIuYXR0cignbVhib3hVc2VySWQnKS52YWx1ZSgpO1xyXG4vLyAgICAgICAgIC8vIFRoZSB1c2VySWQgaXMgcHJlZml4ZWQgd2l0aCBcIjB4XCIgd2hpY2ggaXMgbm90IG5lZWRlZC5cclxuLy8gICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHhib3hJZC5zdWJzdHJpbmcoMikpO1xyXG4vLyAgICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnV3JvbmcgaW50ZXJuYWwgZ2FtZUlkJykpO1xyXG4vLyAgICAgICB9XHJcbi8vICAgICB9KTtcclxuLy8gfVxyXG5cclxuY29uc3QgcmVzb2x2ZUdhbWVWZXJzaW9uID0gYXN5bmMgKGRpc2NvdmVyeVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgY29uc3QgdmVyc2lvblBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgJ2J1aWxkX3RhZy50eHQnKTtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyh2ZXJzaW9uUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXHJcbiAgICAudGhlbigocmVzKSA9PiBQcm9taXNlLnJlc29sdmUocmVzLnNwbGl0KCdcXHJcXG4nKVswXS50cmltKCkpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSA9PiB7XHJcbiAgICBjb250ZXh0LnJlZ2lzdGVyR2FtZShuZXcgTWFzdGVyQ2hpZWZDb2xsZWN0aW9uR2FtZShjb250ZXh0KSk7XHJcblxyXG4gICAgLy8gbGV0IGNvbGxhdG9yO1xyXG4gICAgLy8gY29uc3QgZ2V0Q29sbGF0b3IgPSAobG9jYWxlKSA9PiB7XHJcbiAgICAvLyAgIGlmICgoY29sbGF0b3IgPT09IHVuZGVmaW5lZCkgfHwgKGxvY2FsZSAhPT0gbGFuZykpIHtcclxuICAgIC8vICAgICBsYW5nID0gbG9jYWxlO1xyXG4gICAgLy8gICAgIGNvbGxhdG9yID0gbmV3IEludGwuQ29sbGF0b3IobG9jYWxlLCB7IHNlbnNpdGl2aXR5OiAnYmFzZScgfSk7XHJcbiAgICAvLyAgIH1cclxuICAgIC8vICAgcmV0dXJuIGNvbGxhdG9yO1xyXG4gICAgLy8gfTtcclxuXHJcbiAgICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RUWVBFX1BMVUdfQU5EX1BMQVksIDE1LFxyXG4gICAgICAoZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgKCkgPT4gdW5kZWZpbmVkLCB0ZXN0UGx1Z0FuZFBsYXlNb2RUeXBlIGFzIGFueSwge1xyXG4gICAgICBkZXBsb3ltZW50RXNzZW50aWFsOiBmYWxzZSxcclxuICAgICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgICBuYW1lOiAnTUNDIFBsdWcgYW5kIFBsYXkgbW9kJyxcclxuICAgICAgbm9Db25mbGljdHM6IHRydWUsXHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ21jYy1wbHVnLWFuZC1wbGF5LWluc3RhbGxlcicsXHJcbiAgICAgIDE1LCB0ZXN0UGx1Z0FuZFBsYXlJbnN0YWxsZXIgYXMgYW55LCBpbnN0YWxsUGx1Z0FuZFBsYXkgYXMgYW55KTtcclxuXHJcbiAgICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdtYXN0ZXJjaGllZm1vZGNvbmZpZ2luc3RhbGxlcicsXHJcbiAgICAgIDIwLCB0ZXN0TW9kQ29uZmlnSW5zdGFsbGVyIGFzIGFueSwgaW5zdGFsbE1vZENvbmZpZyBhcyBhbnkpO1xyXG5cclxuICAgIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ21hc3RlcmNoaWVmaW5zdGFsbGVyJyxcclxuICAgICAgMjUsIHRlc3RJbnN0YWxsZXIgYXMgYW55LCBpbnN0YWxsIGFzIGFueSk7XHJcblxyXG4gICAgY29udGV4dC5yZWdpc3RlclRlc3QoJ21jYy1jZS1tcC10ZXN0JywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIHV0aWwudG9CbHVlKCgpID0+IHRlc3RDRU1QKGNvbnRleHQuYXBpKSkpO1xyXG5cclxuICAgIGNvbnRleHQucmVnaXN0ZXJUYWJsZUF0dHJpYnV0ZSgnbW9kcycsIHtcclxuICAgICAgaWQ6ICdnYW1lVHlwZScsXHJcbiAgICAgIG5hbWU6ICdHYW1lKHMpJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgSGFsbyBnYW1lKHMpIGZvciB0aGlzIG1vZCcsXHJcbiAgICAgIGljb246ICdpbnNwZWN0JyxcclxuICAgICAgcGxhY2VtZW50OiAndGFibGUnLFxyXG4gICAgICBjdXN0b21SZW5kZXJlcjogKG1vZCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNyZWF0ZUltZ0RpdiA9IChlbnRyeSwgaWR4KSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdoYWxvLWltZy1kaXYnLCBrZXk6IGAke2VudHJ5LmludGVybmFsSWR9LSR7aWR4fWAgfSwgXHJcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2ltZycsIHsgY2xhc3NOYW1lOiAnaGFsb2dhbWVpbWcnLCBzcmM6IGBmaWxlOi8vJHtlbnRyeS5pbWd9YCB9KSxcclxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnc3BhbicsIHt9LCBlbnRyeS5uYW1lKSlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBpbnRlcm5hbElkcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdoYWxvR2FtZXMnXSwgW10pO1xyXG4gICAgICAgIGNvbnN0IGhhbG9FbnRyaWVzID0gT2JqZWN0LmtleXMoSEFMT19HQU1FUylcclxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+IGludGVybmFsSWRzLmluY2x1ZGVzKEhBTE9fR0FNRVNba2V5XS5pbnRlcm5hbElkKSlcclxuICAgICAgICAgIC5tYXAoa2V5ID0+IEhBTE9fR0FNRVNba2V5XSk7XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQsIHsgdHlwZTogJ3JvdycgfSwgXHJcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwgeyBjbGFzc05hbWU6ICdoYWxvaW1nbGF5b3V0JyB9LCBoYWxvRW50cmllcy5tYXAoKGVudHJ5LCBpZHgpID0+IGNyZWF0ZUltZ0RpdihlbnRyeSwgaWR4KSkpKTtcclxuICAgICAgfSxcclxuICAgICAgY2FsYzogKG1vZCkgPT4gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ2hhbG9HYW1lcyddLCB1bmRlZmluZWQpLFxyXG4gICAgICBmaWx0ZXI6IG5ldyBPcHRpb25zRmlsdGVyKFxyXG4gICAgICAgIFtdLmNvbmNhdChbeyB2YWx1ZTogT3B0aW9uc0ZpbHRlci5FTVBUWSwgbGFiZWw6ICc8Tm9uZT4nIH1dLFxyXG4gICAgICAgIE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpXHJcbiAgICAgICAgICAubWFwKGtleSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBIQUxPX0dBTUVTW2tleV0uaW50ZXJuYWxJZCwgbGFiZWw6IEhBTE9fR0FNRVNba2V5XS5uYW1lIH07XHJcbiAgICAgICAgICB9KSlcclxuICAgICAgICAsIHRydWUsIGZhbHNlKSxcclxuICAgICAgaXNUb2dnbGVhYmxlOiB0cnVlLFxyXG4gICAgICBlZGl0OiB7fSxcclxuICAgICAgaXNTb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgIGlzR3JvdXBhYmxlOiAobW9kKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW50ZXJuYWxJZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnaGFsb0dhbWVzJ10sIFtdKTtcclxuICAgICAgICBjb25zdCBoYWxvRW50cmllcyA9IE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpXHJcbiAgICAgICAgICAuZmlsdGVyKGtleSA9PiBpbnRlcm5hbElkcy5pbmNsdWRlcyhIQUxPX0dBTUVTW2tleV0uaW50ZXJuYWxJZCkpXHJcbiAgICAgICAgICAubWFwKGtleSA9PiBIQUxPX0dBTUVTW2tleV0pO1xyXG5cclxuICAgICAgICBpZiAoaGFsb0VudHJpZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgcmV0dXJuICdNdWx0aXBsZSc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiAoISFoYWxvRW50cmllcyAmJiAoaGFsb0VudHJpZXMubGVuZ3RoID4gMCkpXHJcbiAgICAgICAgICAgID8gaGFsb0VudHJpZXNbMF0ubmFtZVxyXG4gICAgICAgICAgICA6ICdOb25lJztcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGlzRGVmYXVsdFZpc2libGU6IHRydWUsXHJcbiAgICAgIC8vc29ydEZ1bmM6IChsaHMsIHJocykgPT4gZ2V0Q29sbGF0b3IobG9jYWxlKS5jb21wYXJlKGxocywgcmhzKSxcclxuICAgICAgY29uZGl0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICByZXR1cm4gKGFjdGl2ZUdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ21hc3RlcmNoaWVmc3R5bGUnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnbWFzdGVyY2hpZWYuc2NzcycpKTtcclxuICAgICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZykgPT4gYXBwbHlUb01hbmlmZXN0KGNvbnRleHQuYXBpLCB0cnVlKSk7XHJcbiAgICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZykgPT4gYXBwbHlUb01hbmlmZXN0KGNvbnRleHQuYXBpLCBmYWxzZSkpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG4iXX0=