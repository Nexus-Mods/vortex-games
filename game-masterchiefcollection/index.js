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
const util_1 = require("./util");
let _GAME_STORE_ID;
class MasterChiefCollectionGame {
    constructor(context) {
        this.requiresLauncer = vortex_api_1.util.toBlue((gamePath) => this.checkLauncher(gamePath));
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
            const xboxWarning = () => {
                this.context.api.showDialog('info', 'Xbox Store Permissions', {
                    bbcode: 'Halo: MCC appears to be installed through the Xbox game store and your account '
                        + 'does not have permissions to write new files. This needs to be resolved manually '
                        + 'before mods can be deployed [url=https://wiki.nexusmods.com/index.php/Modding_Halo:_The_Master_Chief_Collection_with_Vortex]as seen here.[/url]',
                }, [
                    { label: 'Close' },
                ]);
                return Promise.resolve();
            };
            const createXboxModsPath = () => {
                const segments = discovery.path.split(path_1.default.sep).filter(seg => !!seg);
                const idx = segments.indexOf('WindowsApps');
                const progFiles = segments.splice(0, idx).join(path_1.default.sep);
                return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(progFiles, 'ModifiableWindowsApps', 'HaloMCC'), () => {
                    return this.api.showDialog('info', 'Need to change file permissions', {
                        text: 'Vortex needs to change the file permissions on the game mod directory so it '
                            + 'can install mods. Windows will ask if you want to allow Vortex to make changes to your system. ',
                    }, [
                        { label: 'Cancel' },
                        { label: 'Continue' },
                    ])
                        .then(result => {
                        if (result.action === 'Cancel') {
                            return Promise.reject(new vortex_api_1.util.UserCanceled());
                        }
                        else {
                            return Promise.resolve();
                        }
                    });
                })
                    .catch(err => (err.code === 'EPERM')
                    ? xboxWarning() : Promise.reject(err));
            };
            return (_GAME_STORE_ID === 'xbox')
                ? createXboxModsPath()
                : Promise.resolve();
        });
    }
    queryPath() {
        return vortex_api_1.util.GameStoreHelper.findByAppId([common_1.STEAM_ID, common_1.MS_APPID])
            .then(game => {
            _GAME_STORE_ID = game.gameStoreId;
            return game.gamePath;
        });
    }
    checkLauncher(gamePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_GAME_STORE_ID === 'xbox') {
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
            else if (_GAME_STORE_ID === 'steam') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUFtRjtBQUVuRiw2Q0FBK0I7QUFFL0IscUNBQTBGO0FBRTFGLHlDQUFvRDtBQUNwRCw2Q0FBOEk7QUFDOUksaUNBQXlDO0FBRXpDLElBQUksY0FBYyxDQUFDO0FBR25CLE1BQU0seUJBQXlCO0lBYzdCLFlBQVksT0FBTztRQTBGWixvQkFBZSxHQUFHLGlCQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBekZ2RixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsRUFBRSxHQUFHLGdCQUFPLENBQUM7UUFDbEIsSUFBSSxDQUFDLElBQUksR0FBRyxtQ0FBbUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQztRQUMxQixJQUFJLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDdkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxrQkFBa0I7WUFDeEMsSUFBSSxDQUFDLGFBQWEsR0FBRztnQkFDbkIsSUFBSSxDQUFDLFVBQVUsRUFBRTthQUNsQixDQUFDO1FBQ0YsSUFBSSxDQUFDLGNBQWMsR0FBRztZQUNwQjtnQkFDRSxFQUFFLEVBQUUsa0JBQWtCO2dCQUN0QixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsSUFBSSxFQUFFLGtCQUFrQjtnQkFDeEIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWM7Z0JBQ2hDLGFBQWEsRUFBRTtvQkFDYixjQUFjO2lCQUNmO2dCQUNELFFBQVEsRUFBRSxJQUFJO2FB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bXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZnMsIHR5cGVzLCBGbGV4TGF5b3V0LCBPcHRpb25zRmlsdGVyLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIEhBTE9fR0FNRVMsIE1TX0FQUElELCBTVEVBTV9JRCwgTU9EVFlQRV9QTFVHX0FORF9QTEFZIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBMYXVuY2hlckNvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyB0ZXN0UGx1Z0FuZFBsYXlNb2RUeXBlIH0gZnJvbSAnLi9tb2RUeXBlcyc7XHJcbmltcG9ydCB7IGluc3RhbGxQbHVnQW5kUGxheSwgdGVzdE1vZENvbmZpZ0luc3RhbGxlciwgdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyLCBpbnN0YWxsTW9kQ29uZmlnLCBpbnN0YWxsLCB0ZXN0SW5zdGFsbGVyIH0gZnJvbSAnLi9pbnN0YWxsZXJzJztcclxuaW1wb3J0IHsgYXBwbHlUb01hbmlmZXN0IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmxldCBfR0FNRV9TVE9SRV9JRDtcclxuXHJcbi8vIE1hc3RlciBjaGVmIGNvbGxlY3Rpb25cclxuY2xhc3MgTWFzdGVyQ2hpZWZDb2xsZWN0aW9uR2FtZSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcclxuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XHJcbiAgcHVibGljIGlkOiBzdHJpbmc7XHJcbiAgcHVibGljIG5hbWU6IHN0cmluZztcclxuICBwdWJsaWMgc2hvcnROYW1lOiBzdHJpbmc7XHJcbiAgcHVibGljIGxvZ286IHN0cmluZztcclxuICBwdWJsaWMgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHB1YmxpYyBnZXRHYW1lVmVyc2lvbjogKGRpc2NvdmVyeVBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+O1xyXG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdO1xyXG4gIHB1YmxpYyBlbnZpcm9ubWVudDogYW55O1xyXG4gIHB1YmxpYyBkZXRhaWxzOiBhbnk7XHJcbiAgcHVibGljIG1lcmdlTW9kczogYm9vbGVhbjtcclxuXHJcbiAgY29uc3RydWN0b3IoY29udGV4dCkge1xyXG4gICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgIHRoaXMuaWQgPSBHQU1FX0lEO1xyXG4gICAgdGhpcy5uYW1lID0gJ0hhbG86IFRoZSBNYXN0ZXIgQ2hpZWYgQ29sbGVjdGlvbic7XHJcbiAgICB0aGlzLnNob3J0TmFtZSA9ICdIYWxvOiBNQ0MnO1xyXG4gICAgdGhpcy5sb2dvID0gJ2dhbWVhcnQuanBnJztcclxuICAgIHRoaXMuYXBpID0gY29udGV4dC5hcGk7XHJcbiAgICB0aGlzLmdldEdhbWVWZXJzaW9uID0gcmVzb2x2ZUdhbWVWZXJzaW9uLFxyXG4gICAgdGhpcy5yZXF1aXJlZEZpbGVzID0gW1xyXG4gICAgICB0aGlzLmV4ZWN1dGFibGUoKSxcclxuICAgIF07XHJcbiAgICB0aGlzLnN1cHBvcnRlZFRvb2xzID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdoYWxvYXNzZW1ibHl0b29sJyxcclxuICAgICAgICBuYW1lOiAnQXNzZW1ibHknLFxyXG4gICAgICAgIGxvZ286ICdhc3NlbWJseXRvb2wucG5nJyxcclxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnQXNzZW1ibHkuZXhlJyxcclxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICAgICAnQXNzZW1ibHkuZXhlJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuICAgIHRoaXMuZW52aXJvbm1lbnQgPSB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfTtcclxuICAgIHRoaXMuZGV0YWlscyA9IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgfTtcclxuICAgIHRoaXMubWVyZ2VNb2RzID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHF1ZXJ5TW9kUGF0aChnYW1lUGF0aCkge1xyXG4gICAgcmV0dXJuICcuJztcclxuICB9XHJcblxyXG4gIGV4ZWN1dGFibGUoKSB7XHJcbiAgICByZXR1cm4gJ21jY2xhdW5jaGVyLmV4ZSc7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgcHJlcGFyZShkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IHhib3hXYXJuaW5nID0gKCkgPT4ge1xyXG4gICAgICB0aGlzLmNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnWGJveCBTdG9yZSBQZXJtaXNzaW9ucycsIHtcclxuICAgICAgICBiYmNvZGU6ICdIYWxvOiBNQ0MgYXBwZWFycyB0byBiZSBpbnN0YWxsZWQgdGhyb3VnaCB0aGUgWGJveCBnYW1lIHN0b3JlIGFuZCB5b3VyIGFjY291bnQgJyBcclxuICAgICAgICAgICAgICArICdkb2VzIG5vdCBoYXZlIHBlcm1pc3Npb25zIHRvIHdyaXRlIG5ldyBmaWxlcy4gVGhpcyBuZWVkcyB0byBiZSByZXNvbHZlZCBtYW51YWxseSAnXHJcbiAgICAgICAgICAgICAgKyAnYmVmb3JlIG1vZHMgY2FuIGJlIGRlcGxveWVkIFt1cmw9aHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL01vZGRpbmdfSGFsbzpfVGhlX01hc3Rlcl9DaGllZl9Db2xsZWN0aW9uX3dpdGhfVm9ydGV4XWFzIHNlZW4gaGVyZS5bL3VybF0nLFxyXG4gICAgICB9LCBbXHJcbiAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICBdKTtcclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjcmVhdGVYYm94TW9kc1BhdGggPSAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gZGlzY292ZXJ5LnBhdGguc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgICBjb25zdCBpZHggPSBzZWdtZW50cy5pbmRleE9mKCdXaW5kb3dzQXBwcycpO1xyXG4gICAgICBjb25zdCBwcm9nRmlsZXMgPSBzZWdtZW50cy5zcGxpY2UoMCwgaWR4KS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKHByb2dGaWxlcywgJ01vZGlmaWFibGVXaW5kb3dzQXBwcycsICdIYWxvTUNDJyksICgpID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdOZWVkIHRvIGNoYW5nZSBmaWxlIHBlcm1pc3Npb25zJywge1xyXG4gICAgICAgICAgdGV4dDogJ1ZvcnRleCBuZWVkcyB0byBjaGFuZ2UgdGhlIGZpbGUgcGVybWlzc2lvbnMgb24gdGhlIGdhbWUgbW9kIGRpcmVjdG9yeSBzbyBpdCAnXHJcbiAgICAgICAgICAgICAgKyAnY2FuIGluc3RhbGwgbW9kcy4gV2luZG93cyB3aWxsIGFzayBpZiB5b3Ugd2FudCB0byBhbGxvdyBWb3J0ZXggdG8gbWFrZSBjaGFuZ2VzIHRvIHlvdXIgc3lzdGVtLiAnLFxyXG4gICAgICAgIH0sIFtcclxuICAgICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgICAgICB7IGxhYmVsOiAnQ29udGludWUnIH0sXHJcbiAgICAgICAgXSlcclxuICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDYW5jZWwnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFUEVSTScpXHJcbiAgICAgICAgICA/IHhib3hXYXJuaW5nKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKF9HQU1FX1NUT1JFX0lEID09PSAneGJveCcpIFxyXG4gICAgICA/IGNyZWF0ZVhib3hNb2RzUGF0aCgpXHJcbiAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcXVlcnlQYXRoKCkge1xyXG4gICAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRCwgTVNfQVBQSURdKVxyXG4gICAgICAudGhlbihnYW1lID0+IHtcclxuICAgICAgICBfR0FNRV9TVE9SRV9JRCA9IGdhbWUuZ2FtZVN0b3JlSWQ7XHJcbiAgICAgICAgcmV0dXJuIGdhbWUuZ2FtZVBhdGhcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVxdWlyZXNMYXVuY2VyID0gdXRpbC50b0JsdWUoKGdhbWVQYXRoOiBzdHJpbmcpID0+IHRoaXMuY2hlY2tMYXVuY2hlcihnYW1lUGF0aCkpO1xyXG4gIHB1YmxpYyBhc3luYyBjaGVja0xhdW5jaGVyKGdhbWVQYXRoOiBzdHJpbmcpOiBMYXVuY2hlckNvbmZpZyB8IHVuZGVmaW5lZCB7XHJcbiAgICBpZiAoX0dBTUVfU1RPUkVfSUQgPT09ICd4Ym94Jykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICBsYXVuY2hlcjogJ3hib3gnLFxyXG4gICAgICAgIGFkZEluZm86IHtcclxuICAgICAgICAgIGFwcElkOiBNU19BUFBJRCxcclxuICAgICAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICAgICAgeyBhcHBFeGVjTmFtZTogJ0hhbG9NQ0NTaGlwcGluZ05vRUFDJyB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChfR0FNRV9TVE9SRV9JRCA9PT0gJ3N0ZWFtJykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICBsYXVuY2hlcjogJ3N0ZWFtJyxcclxuICAgICAgICBhZGRJbmZvOiB7XHJcbiAgICAgICAgICBhcHBJZDogU1RFQU1fSUQsXHJcbiAgICAgICAgICBwYXJhbWV0ZXJzOiBbJ29wdGlvbjInXSxcclxuICAgICAgICAgIGxhdW5jaFR5cGU6ICdnYW1lc3RvcmUnLFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gZnVuY3Rpb24gZ2V0WGJveElkKGludGVybmFsSWQsIGZpbGVQYXRoLCBlbmNvZGluZykge1xyXG4vLyAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm4gdGhlIHhib3ggaWQgb2YgdGhlIGxhc3QgcGxheWVyXHJcbi8vICAgLy8gIHdobyByYW4gdGhlIGdhbWUuIFRoaXMgY2FuIHBvdGVudGlhbGx5IGJlIHVzZWQgdG8gbW9kIHRoZSBnYW1lXHJcbi8vICAgLy8gIG9ubHkgZm9yIHNwZWNpZmljIHhib3ggaWRzIHdoaWxlIGxlYXZpbmcgb3RoZXJzIGluIGFuIHVudGFtcGVyZWQgc3RhdGUuIChXSVApXHJcbi8vICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoZmlsZVBhdGgsIHsgZW5jb2RpbmcgfSlcclxuLy8gICAgIC50aGVuKGZpbGVEYXRhID0+IHtcclxuLy8gICAgICAgbGV0IHhtbERvYztcclxuLy8gICAgICAgdHJ5IHtcclxuLy8gICAgICAgICB4bWxEb2MgPSBwYXJzZVhtbFN0cmluZyhmaWxlRGF0YSk7XHJcbi8vICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4vLyAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4vLyAgICAgICB9XHJcblxyXG4vLyAgICAgICBjb25zdCBnZW5lcmFsRGF0YSA9IHhtbERvYy5maW5kKCcvL0NhbXBhaWduQ2FybmFnZVJlcG9ydC9HZW5lcmFsRGF0YScpO1xyXG4vLyAgICAgICBpZiAoZ2VuZXJhbERhdGFbMF0uYXR0cignR2FtZUlkJykudmFsdWUoKSA9PT0gaW50ZXJuYWxJZCkge1xyXG4vLyAgICAgICAgIGNvbnN0IHBsYXllcnMgPSB4bWxEb2MuZmluZCgnLy9DYW1wYWlnbkNhcm5hZ2VSZXBvcnQvUGxheWVycy9QbGF5ZXJJbmZvJyk7XHJcbi8vICAgICAgICAgY29uc3QgbWFpblBsYXllciA9IHBsYXllcnMuZmluZChwbGF5ZXIgPT4gcGxheWVyLmF0dHIoJ2lzR3Vlc3QnKS52YWx1ZSgpID09PSAnZmFsc2UnKTtcclxuLy8gICAgICAgICBjb25zdCB4Ym94SWQgPSBtYWluUGxheWVyLmF0dHIoJ21YYm94VXNlcklkJykudmFsdWUoKTtcclxuLy8gICAgICAgICAvLyBUaGUgdXNlcklkIGlzIHByZWZpeGVkIHdpdGggXCIweFwiIHdoaWNoIGlzIG5vdCBuZWVkZWQuXHJcbi8vICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh4Ym94SWQuc3Vic3RyaW5nKDIpKTtcclxuLy8gICAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ1dyb25nIGludGVybmFsIGdhbWVJZCcpKTtcclxuLy8gICAgICAgfVxyXG4vLyAgICAgfSk7XHJcbi8vIH1cclxuXHJcbmNvbnN0IHJlc29sdmVHYW1lVmVyc2lvbiA9IGFzeW5jIChkaXNjb3ZlcnlQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gIGNvbnN0IHZlcnNpb25QYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdidWlsZF90YWcudHh0Jyk7XHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmModmVyc2lvblBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KVxyXG4gICAgLnRoZW4oKHJlcykgPT4gUHJvbWlzZS5yZXNvbHZlKHJlcy5zcGxpdCgnXFxyXFxuJylbMF0udHJpbSgpKSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkgPT4ge1xyXG4gICAgY29udGV4dC5yZWdpc3RlckdhbWUobmV3IE1hc3RlckNoaWVmQ29sbGVjdGlvbkdhbWUoY29udGV4dCkpO1xyXG5cclxuICAgIC8vIGxldCBjb2xsYXRvcjtcclxuICAgIC8vIGNvbnN0IGdldENvbGxhdG9yID0gKGxvY2FsZSkgPT4ge1xyXG4gICAgLy8gICBpZiAoKGNvbGxhdG9yID09PSB1bmRlZmluZWQpIHx8IChsb2NhbGUgIT09IGxhbmcpKSB7XHJcbiAgICAvLyAgICAgbGFuZyA9IGxvY2FsZTtcclxuICAgIC8vICAgICBjb2xsYXRvciA9IG5ldyBJbnRsLkNvbGxhdG9yKGxvY2FsZSwgeyBzZW5zaXRpdml0eTogJ2Jhc2UnIH0pO1xyXG4gICAgLy8gICB9XHJcbiAgICAvLyAgIHJldHVybiBjb2xsYXRvcjtcclxuICAgIC8vIH07XHJcblxyXG4gICAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EVFlQRV9QTFVHX0FORF9QTEFZLCAxNSxcclxuICAgICAgKGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsICgpID0+IHVuZGVmaW5lZCwgdGVzdFBsdWdBbmRQbGF5TW9kVHlwZSBhcyBhbnksIHtcclxuICAgICAgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UsXHJcbiAgICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgICAgbmFtZTogJ01DQyBQbHVnIGFuZCBQbGF5IG1vZCcsXHJcbiAgICAgIG5vQ29uZmxpY3RzOiB0cnVlLFxyXG4gICAgfSlcclxuXHJcbiAgICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdtY2MtcGx1Zy1hbmQtcGxheS1pbnN0YWxsZXInLFxyXG4gICAgICAxNSwgdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyIGFzIGFueSwgaW5zdGFsbFBsdWdBbmRQbGF5IGFzIGFueSk7XHJcblxyXG4gICAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignbWFzdGVyY2hpZWZtb2Rjb25maWdpbnN0YWxsZXInLFxyXG4gICAgICAyMCwgdGVzdE1vZENvbmZpZ0luc3RhbGxlciBhcyBhbnksIGluc3RhbGxNb2RDb25maWcgYXMgYW55KTtcclxuXHJcbiAgICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdtYXN0ZXJjaGllZmluc3RhbGxlcicsXHJcbiAgICAgIDI1LCB0ZXN0SW5zdGFsbGVyIGFzIGFueSwgaW5zdGFsbCBhcyBhbnkpO1xyXG5cclxuICAgIGNvbnRleHQucmVnaXN0ZXJUYWJsZUF0dHJpYnV0ZSgnbW9kcycsIHtcclxuICAgICAgaWQ6ICdnYW1lVHlwZScsXHJcbiAgICAgIG5hbWU6ICdHYW1lKHMpJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgSGFsbyBnYW1lKHMpIGZvciB0aGlzIG1vZCcsXHJcbiAgICAgIGljb246ICdpbnNwZWN0JyxcclxuICAgICAgcGxhY2VtZW50OiAndGFibGUnLFxyXG4gICAgICBjdXN0b21SZW5kZXJlcjogKG1vZCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNyZWF0ZUltZ0RpdiA9IChlbnRyeSwgaWR4KSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdoYWxvLWltZy1kaXYnLCBrZXk6IGAke2VudHJ5LmludGVybmFsSWR9LSR7aWR4fWAgfSwgXHJcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2ltZycsIHsgY2xhc3NOYW1lOiAnaGFsb2dhbWVpbWcnLCBzcmM6IGBmaWxlOi8vJHtlbnRyeS5pbWd9YCB9KSxcclxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnc3BhbicsIHt9LCBlbnRyeS5uYW1lKSlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBpbnRlcm5hbElkcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdoYWxvR2FtZXMnXSwgW10pO1xyXG4gICAgICAgIGNvbnN0IGhhbG9FbnRyaWVzID0gT2JqZWN0LmtleXMoSEFMT19HQU1FUylcclxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+IGludGVybmFsSWRzLmluY2x1ZGVzKEhBTE9fR0FNRVNba2V5XS5pbnRlcm5hbElkKSlcclxuICAgICAgICAgIC5tYXAoa2V5ID0+IEhBTE9fR0FNRVNba2V5XSk7XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQsIHsgdHlwZTogJ3JvdycgfSwgXHJcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwgeyBjbGFzc05hbWU6ICdoYWxvaW1nbGF5b3V0JyB9LCBoYWxvRW50cmllcy5tYXAoKGVudHJ5LCBpZHgpID0+IGNyZWF0ZUltZ0RpdihlbnRyeSwgaWR4KSkpKTtcclxuICAgICAgfSxcclxuICAgICAgY2FsYzogKG1vZCkgPT4gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ2hhbG9HYW1lcyddLCB1bmRlZmluZWQpLFxyXG4gICAgICBmaWx0ZXI6IG5ldyBPcHRpb25zRmlsdGVyKFxyXG4gICAgICAgIFtdLmNvbmNhdChbeyB2YWx1ZTogT3B0aW9uc0ZpbHRlci5FTVBUWSwgbGFiZWw6ICc8Tm9uZT4nIH1dLFxyXG4gICAgICAgIE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpXHJcbiAgICAgICAgICAubWFwKGtleSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBIQUxPX0dBTUVTW2tleV0uaW50ZXJuYWxJZCwgbGFiZWw6IEhBTE9fR0FNRVNba2V5XS5uYW1lIH07XHJcbiAgICAgICAgICB9KSlcclxuICAgICAgICAsIHRydWUsIGZhbHNlKSxcclxuICAgICAgaXNUb2dnbGVhYmxlOiB0cnVlLFxyXG4gICAgICBlZGl0OiB7fSxcclxuICAgICAgaXNTb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgIGlzR3JvdXBhYmxlOiAobW9kKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW50ZXJuYWxJZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnaGFsb0dhbWVzJ10sIFtdKTtcclxuICAgICAgICBjb25zdCBoYWxvRW50cmllcyA9IE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpXHJcbiAgICAgICAgICAuZmlsdGVyKGtleSA9PiBpbnRlcm5hbElkcy5pbmNsdWRlcyhIQUxPX0dBTUVTW2tleV0uaW50ZXJuYWxJZCkpXHJcbiAgICAgICAgICAubWFwKGtleSA9PiBIQUxPX0dBTUVTW2tleV0pO1xyXG5cclxuICAgICAgICBpZiAoaGFsb0VudHJpZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgcmV0dXJuICdNdWx0aXBsZSc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiAoISFoYWxvRW50cmllcyAmJiAoaGFsb0VudHJpZXMubGVuZ3RoID4gMCkpXHJcbiAgICAgICAgICAgID8gaGFsb0VudHJpZXNbMF0ubmFtZVxyXG4gICAgICAgICAgICA6ICdOb25lJztcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGlzRGVmYXVsdFZpc2libGU6IHRydWUsXHJcbiAgICAgIC8vc29ydEZ1bmM6IChsaHMsIHJocykgPT4gZ2V0Q29sbGF0b3IobG9jYWxlKS5jb21wYXJlKGxocywgcmhzKSxcclxuICAgICAgY29uZGl0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcclxuICAgICAgICByZXR1cm4gKGFjdGl2ZUdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ21hc3RlcmNoaWVmc3R5bGUnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnbWFzdGVyY2hpZWYuc2NzcycpKTtcclxuICAgICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZykgPT4gYXBwbHlUb01hbmlmZXN0KGNvbnRleHQuYXBpLCB0cnVlKSk7XHJcbiAgICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZykgPT4gYXBwbHlUb01hbmlmZXN0KGNvbnRleHQuYXBpLCBmYWxzZSkpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG4iXX0=