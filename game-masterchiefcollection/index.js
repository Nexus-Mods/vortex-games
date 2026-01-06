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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBbUY7QUFFbkYsNkNBQStCO0FBRS9CLHFDQUEwRjtBQUUxRix5Q0FBb0Q7QUFDcEQsNkNBQThJO0FBQzlJLG1DQUFtQztBQUNuQyxpQ0FBeUM7QUFHekMsTUFBTSx5QkFBeUI7SUFjN0IsWUFBWSxPQUFPO1FBaURaLHFCQUFnQixHQUFHLGlCQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFoRDlHLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxFQUFFLEdBQUcsZ0JBQU8sQ0FBQztRQUNsQixJQUFJLENBQUMsSUFBSSxHQUFHLG1DQUFtQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDO1FBQzFCLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN2QixJQUFJLENBQUMsY0FBYyxHQUFHLGtCQUFrQjtZQUN4QyxJQUFJLENBQUMsYUFBYSxHQUFHO2dCQUNuQixJQUFJLENBQUMsVUFBVSxFQUFFO2FBQ2xCLENBQUM7UUFDRixJQUFJLENBQUMsY0FBYyxHQUFHO1lBQ3BCO2dCQUNFLEVBQUUsRUFBRSxrQkFBa0I7Z0JBQ3RCLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztnQkFDaEMsYUFBYSxFQUFFO29CQUNiLGNBQWM7aUJBQ2Y7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SyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzFFLE9BQU8sQ0FBQyxZQUFZLEtBQUssZ0JBQU8sQ0FBQyxDQUFDO1lBQ3BDLENBQUM7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDeEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQU8sU0FBaUIsRUFBRSxFQUFFLGtEQUFDLE9BQUEsSUFBQSxzQkFBZSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7WUFDbkcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQU8sU0FBaUIsRUFBRSxFQUFFLGtEQUFDLE9BQUEsSUFBQSxzQkFBZSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgdHlwZXMsIEZsZXhMYXlvdXQsIE9wdGlvbnNGaWx0ZXIsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSEFMT19HQU1FUywgTVNfQVBQSUQsIFNURUFNX0lELCBNT0RUWVBFX1BMVUdfQU5EX1BMQVkgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IExhdW5jaGVyQ29uZmlnIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IHRlc3RQbHVnQW5kUGxheU1vZFR5cGUgfSBmcm9tICcuL21vZFR5cGVzJztcclxuaW1wb3J0IHsgaW5zdGFsbFBsdWdBbmRQbGF5LCB0ZXN0TW9kQ29uZmlnSW5zdGFsbGVyLCB0ZXN0UGx1Z0FuZFBsYXlJbnN0YWxsZXIsIGluc3RhbGxNb2RDb25maWcsIGluc3RhbGwsIHRlc3RJbnN0YWxsZXIgfSBmcm9tICcuL2luc3RhbGxlcnMnO1xyXG5pbXBvcnQgeyB0ZXN0Q0VNUCB9IGZyb20gJy4vdGVzdHMnO1xyXG5pbXBvcnQgeyBhcHBseVRvTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuLy8gTWFzdGVyIGNoZWYgY29sbGVjdGlvblxyXG5jbGFzcyBNYXN0ZXJDaGllZkNvbGxlY3Rpb25HYW1lIGltcGxlbWVudHMgdHlwZXMuSUdhbWUge1xyXG4gIHB1YmxpYyBjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dDtcclxuICBwdWJsaWMgaWQ6IHN0cmluZztcclxuICBwdWJsaWMgbmFtZTogc3RyaW5nO1xyXG4gIHB1YmxpYyBzaG9ydE5hbWU6IHN0cmluZztcclxuICBwdWJsaWMgbG9nbzogc3RyaW5nO1xyXG4gIHB1YmxpYyBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHVibGljIGdldEdhbWVWZXJzaW9uOiAoZGlzY292ZXJ5UGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XHJcbiAgcHVibGljIHJlcXVpcmVkRmlsZXM6IHN0cmluZ1tdO1xyXG4gIHB1YmxpYyBzdXBwb3J0ZWRUb29sczogYW55W107XHJcbiAgcHVibGljIGVudmlyb25tZW50OiBhbnk7XHJcbiAgcHVibGljIGRldGFpbHM6IGFueTtcclxuICBwdWJsaWMgbWVyZ2VNb2RzOiBib29sZWFuO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XHJcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgdGhpcy5pZCA9IEdBTUVfSUQ7XHJcbiAgICB0aGlzLm5hbWUgPSAnSGFsbzogVGhlIE1hc3RlciBDaGllZiBDb2xsZWN0aW9uJztcclxuICAgIHRoaXMuc2hvcnROYW1lID0gJ0hhbG86IE1DQyc7XHJcbiAgICB0aGlzLmxvZ28gPSAnZ2FtZWFydC5qcGcnO1xyXG4gICAgdGhpcy5hcGkgPSBjb250ZXh0LmFwaTtcclxuICAgIHRoaXMuZ2V0R2FtZVZlcnNpb24gPSByZXNvbHZlR2FtZVZlcnNpb24sXHJcbiAgICB0aGlzLnJlcXVpcmVkRmlsZXMgPSBbXHJcbiAgICAgIHRoaXMuZXhlY3V0YWJsZSgpLFxyXG4gICAgXTtcclxuICAgIHRoaXMuc3VwcG9ydGVkVG9vbHMgPSBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ2hhbG9hc3NlbWJseXRvb2wnLFxyXG4gICAgICAgIG5hbWU6ICdBc3NlbWJseScsXHJcbiAgICAgICAgbG9nbzogJ2Fzc2VtYmx5dG9vbC5wbmcnLFxyXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdBc3NlbWJseS5leGUnLFxyXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgICAgICdBc3NlbWJseS5leGUnLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICBdO1xyXG4gICAgdGhpcy5lbnZpcm9ubWVudCA9IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXHJcbiAgICB9O1xyXG4gICAgdGhpcy5kZXRhaWxzID0ge1xyXG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXHJcbiAgICB9O1xyXG4gICAgdGhpcy5tZXJnZU1vZHMgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcXVlcnlNb2RQYXRoKGdhbWVQYXRoKSB7XHJcbiAgICByZXR1cm4gJy4nO1xyXG4gIH1cclxuXHJcbiAgZXhlY3V0YWJsZSgpIHtcclxuICAgIHJldHVybiAnbWNjbGF1bmNoZXIuZXhlJztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBwcmVwYXJlKGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHF1ZXJ5UGF0aCgpIHtcclxuICAgIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fSUQsIE1TX0FQUElEXSlcclxuICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXF1aXJlc0xhdW5jaGVyID0gdXRpbC50b0JsdWUoKGdhbWVQYXRoOiBzdHJpbmcsIHN0b3JlOiBzdHJpbmcpID0+IHRoaXMuY2hlY2tMYXVuY2hlcihnYW1lUGF0aCwgc3RvcmUpKTtcclxuICBwdWJsaWMgYXN5bmMgY2hlY2tMYXVuY2hlcihnYW1lUGF0aDogc3RyaW5nLCBzdG9yZTogc3RyaW5nKTogTGF1bmNoZXJDb25maWcgfCB1bmRlZmluZWQge1xyXG4gICAgaWYgKHN0b3JlID09PSAneGJveCcpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcclxuICAgICAgICBhZGRJbmZvOiB7XHJcbiAgICAgICAgICBhcHBJZDogTVNfQVBQSUQsXHJcbiAgICAgICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgICAgIHsgYXBwRXhlY05hbWU6ICdIYWxvTUNDU2hpcHBpbmdOb0VBQycgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoc3RvcmUgPT09ICdzdGVhbScpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgbGF1bmNoZXI6ICdzdGVhbScsXHJcbiAgICAgICAgYWRkSW5mbzoge1xyXG4gICAgICAgICAgYXBwSWQ6IFNURUFNX0lELFxyXG4gICAgICAgICAgcGFyYW1ldGVyczogWydvcHRpb24yJ10sXHJcbiAgICAgICAgICBsYXVuY2hUeXBlOiAnZ2FtZXN0b3JlJyxcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIGZ1bmN0aW9uIGdldFhib3hJZChpbnRlcm5hbElkLCBmaWxlUGF0aCwgZW5jb2RpbmcpIHtcclxuLy8gICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSB4Ym94IGlkIG9mIHRoZSBsYXN0IHBsYXllclxyXG4vLyAgIC8vICB3aG8gcmFuIHRoZSBnYW1lLiBUaGlzIGNhbiBwb3RlbnRpYWxseSBiZSB1c2VkIHRvIG1vZCB0aGUgZ2FtZVxyXG4vLyAgIC8vICBvbmx5IGZvciBzcGVjaWZpYyB4Ym94IGlkcyB3aGlsZSBsZWF2aW5nIG90aGVycyBpbiBhbiB1bnRhbXBlcmVkIHN0YXRlLiAoV0lQKVxyXG4vLyAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGVQYXRoLCB7IGVuY29kaW5nIH0pXHJcbi8vICAgICAudGhlbihmaWxlRGF0YSA9PiB7XHJcbi8vICAgICAgIGxldCB4bWxEb2M7XHJcbi8vICAgICAgIHRyeSB7XHJcbi8vICAgICAgICAgeG1sRG9jID0gcGFyc2VYbWxTdHJpbmcoZmlsZURhdGEpO1xyXG4vLyAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuLy8gICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuLy8gICAgICAgfVxyXG5cclxuLy8gICAgICAgY29uc3QgZ2VuZXJhbERhdGEgPSB4bWxEb2MuZmluZCgnLy9DYW1wYWlnbkNhcm5hZ2VSZXBvcnQvR2VuZXJhbERhdGEnKTtcclxuLy8gICAgICAgaWYgKGdlbmVyYWxEYXRhWzBdLmF0dHIoJ0dhbWVJZCcpLnZhbHVlKCkgPT09IGludGVybmFsSWQpIHtcclxuLy8gICAgICAgICBjb25zdCBwbGF5ZXJzID0geG1sRG9jLmZpbmQoJy8vQ2FtcGFpZ25DYXJuYWdlUmVwb3J0L1BsYXllcnMvUGxheWVySW5mbycpO1xyXG4vLyAgICAgICAgIGNvbnN0IG1haW5QbGF5ZXIgPSBwbGF5ZXJzLmZpbmQocGxheWVyID0+IHBsYXllci5hdHRyKCdpc0d1ZXN0JykudmFsdWUoKSA9PT0gJ2ZhbHNlJyk7XHJcbi8vICAgICAgICAgY29uc3QgeGJveElkID0gbWFpblBsYXllci5hdHRyKCdtWGJveFVzZXJJZCcpLnZhbHVlKCk7XHJcbi8vICAgICAgICAgLy8gVGhlIHVzZXJJZCBpcyBwcmVmaXhlZCB3aXRoIFwiMHhcIiB3aGljaCBpcyBub3QgbmVlZGVkLlxyXG4vLyAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeGJveElkLnN1YnN0cmluZygyKSk7XHJcbi8vICAgICAgIH0gZWxzZSB7XHJcbi8vICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdXcm9uZyBpbnRlcm5hbCBnYW1lSWQnKSk7XHJcbi8vICAgICAgIH1cclxuLy8gICAgIH0pO1xyXG4vLyB9XHJcblxyXG5jb25zdCByZXNvbHZlR2FtZVZlcnNpb24gPSBhc3luYyAoZGlzY292ZXJ5UGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICBjb25zdCB2ZXJzaW9uUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCAnYnVpbGRfdGFnLnR4dCcpO1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKHZlcnNpb25QYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSlcclxuICAgIC50aGVuKChyZXMpID0+IFByb21pc2UucmVzb2x2ZShyZXMuc3BsaXQoJ1xcclxcbicpWzBdLnRyaW0oKSkpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiAoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpID0+IHtcclxuICAgIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBNYXN0ZXJDaGllZkNvbGxlY3Rpb25HYW1lKGNvbnRleHQpKTtcclxuXHJcbiAgICAvLyBsZXQgY29sbGF0b3I7XHJcbiAgICAvLyBjb25zdCBnZXRDb2xsYXRvciA9IChsb2NhbGUpID0+IHtcclxuICAgIC8vICAgaWYgKChjb2xsYXRvciA9PT0gdW5kZWZpbmVkKSB8fCAobG9jYWxlICE9PSBsYW5nKSkge1xyXG4gICAgLy8gICAgIGxhbmcgPSBsb2NhbGU7XHJcbiAgICAvLyAgICAgY29sbGF0b3IgPSBuZXcgSW50bC5Db2xsYXRvcihsb2NhbGUsIHsgc2Vuc2l0aXZpdHk6ICdiYXNlJyB9KTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gICByZXR1cm4gY29sbGF0b3I7XHJcbiAgICAvLyB9O1xyXG5cclxuICAgIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRFRZUEVfUExVR19BTkRfUExBWSwgMTUsXHJcbiAgICAgIChnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELCAoKSA9PiB1bmRlZmluZWQsIHRlc3RQbHVnQW5kUGxheU1vZFR5cGUgYXMgYW55LCB7XHJcbiAgICAgIGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlLFxyXG4gICAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICAgIG5hbWU6ICdNQ0MgUGx1ZyBhbmQgUGxheSBtb2QnLFxyXG4gICAgICBub0NvbmZsaWN0czogdHJ1ZSxcclxuICAgIH0pXHJcblxyXG4gICAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignbWNjLXBsdWctYW5kLXBsYXktaW5zdGFsbGVyJyxcclxuICAgICAgMTUsIHRlc3RQbHVnQW5kUGxheUluc3RhbGxlciBhcyBhbnksIGluc3RhbGxQbHVnQW5kUGxheSBhcyBhbnkpO1xyXG5cclxuICAgIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ21hc3RlcmNoaWVmbW9kY29uZmlnaW5zdGFsbGVyJyxcclxuICAgICAgMjAsIHRlc3RNb2RDb25maWdJbnN0YWxsZXIgYXMgYW55LCBpbnN0YWxsTW9kQ29uZmlnIGFzIGFueSk7XHJcblxyXG4gICAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignbWFzdGVyY2hpZWZpbnN0YWxsZXInLFxyXG4gICAgICAyNSwgdGVzdEluc3RhbGxlciBhcyBhbnksIGluc3RhbGwgYXMgYW55KTtcclxuXHJcbiAgICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnbWNjLWNlLW1wLXRlc3QnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJywgdXRpbC50b0JsdWUoKCkgPT4gdGVzdENFTVAoY29udGV4dC5hcGkpKSk7XHJcblxyXG4gICAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xyXG4gICAgICBpZDogJ2dhbWVUeXBlJyxcclxuICAgICAgbmFtZTogJ0dhbWUocyknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBIYWxvIGdhbWUocykgZm9yIHRoaXMgbW9kJyxcclxuICAgICAgaWNvbjogJ2luc3BlY3QnLFxyXG4gICAgICBwbGFjZW1lbnQ6ICd0YWJsZScsXHJcbiAgICAgIGN1c3RvbVJlbmRlcmVyOiAobW9kKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY3JlYXRlSW1nRGl2ID0gKGVudHJ5LCBpZHgpID0+IHtcclxuICAgICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2hhbG8taW1nLWRpdicsIGtleTogYCR7ZW50cnkuaW50ZXJuYWxJZH0tJHtpZHh9YCB9LCBcclxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaW1nJywgeyBjbGFzc05hbWU6ICdoYWxvZ2FtZWltZycsIHNyYzogYGZpbGU6Ly8ke2VudHJ5LmltZ31gIH0pLFxyXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdzcGFuJywge30sIGVudHJ5Lm5hbWUpKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGludGVybmFsSWRzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ2hhbG9HYW1lcyddLCBbXSk7XHJcbiAgICAgICAgY29uc3QgaGFsb0VudHJpZXMgPSBPYmplY3Qua2V5cyhIQUxPX0dBTUVTKVxyXG4gICAgICAgICAgLmZpbHRlcihrZXkgPT4gaW50ZXJuYWxJZHMuaW5jbHVkZXMoSEFMT19HQU1FU1trZXldLmludGVybmFsSWQpKVxyXG4gICAgICAgICAgLm1hcChrZXkgPT4gSEFMT19HQU1FU1trZXldKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dCwgeyB0eXBlOiAncm93JyB9LCBcclxuICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7IGNsYXNzTmFtZTogJ2hhbG9pbWdsYXlvdXQnIH0sIGhhbG9FbnRyaWVzLm1hcCgoZW50cnksIGlkeCkgPT4gY3JlYXRlSW1nRGl2KGVudHJ5LCBpZHgpKSkpO1xyXG4gICAgICB9LFxyXG4gICAgICBjYWxjOiAobW9kKSA9PiB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnaGFsb0dhbWVzJ10sIHVuZGVmaW5lZCksXHJcbiAgICAgIGZpbHRlcjogbmV3IE9wdGlvbnNGaWx0ZXIoXHJcbiAgICAgICAgW10uY29uY2F0KFt7IHZhbHVlOiBPcHRpb25zRmlsdGVyLkVNUFRZLCBsYWJlbDogJzxOb25lPicgfV0sXHJcbiAgICAgICAgT2JqZWN0LmtleXMoSEFMT19HQU1FUylcclxuICAgICAgICAgIC5tYXAoa2V5ID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IEhBTE9fR0FNRVNba2V5XS5pbnRlcm5hbElkLCBsYWJlbDogSEFMT19HQU1FU1trZXldLm5hbWUgfTtcclxuICAgICAgICAgIH0pKVxyXG4gICAgICAgICwgdHJ1ZSwgZmFsc2UpLFxyXG4gICAgICBpc1RvZ2dsZWFibGU6IHRydWUsXHJcbiAgICAgIGVkaXQ6IHt9LFxyXG4gICAgICBpc1NvcnRhYmxlOiBmYWxzZSxcclxuICAgICAgaXNHcm91cGFibGU6IChtb2QpID0+IHtcclxuICAgICAgICBjb25zdCBpbnRlcm5hbElkcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdoYWxvR2FtZXMnXSwgW10pO1xyXG4gICAgICAgIGNvbnN0IGhhbG9FbnRyaWVzID0gT2JqZWN0LmtleXMoSEFMT19HQU1FUylcclxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+IGludGVybmFsSWRzLmluY2x1ZGVzKEhBTE9fR0FNRVNba2V5XS5pbnRlcm5hbElkKSlcclxuICAgICAgICAgIC5tYXAoa2V5ID0+IEhBTE9fR0FNRVNba2V5XSk7XHJcblxyXG4gICAgICAgIGlmIChoYWxvRW50cmllcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICByZXR1cm4gJ011bHRpcGxlJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuICghIWhhbG9FbnRyaWVzICYmIChoYWxvRW50cmllcy5sZW5ndGggPiAwKSlcclxuICAgICAgICAgICAgPyBoYWxvRW50cmllc1swXS5uYW1lXHJcbiAgICAgICAgICAgIDogJ05vbmUnO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgaXNEZWZhdWx0VmlzaWJsZTogdHJ1ZSxcclxuICAgICAgLy9zb3J0RnVuYzogKGxocywgcmhzKSA9PiBnZXRDb2xsYXRvcihsb2NhbGUpLmNvbXBhcmUobGhzLCByaHMpLFxyXG4gICAgICBjb25kaXRpb246ICgpID0+IHtcclxuICAgICAgICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCkpO1xyXG4gICAgICAgIHJldHVybiAoYWN0aXZlR2FtZUlkID09PSBHQU1FX0lEKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgICAgY29udGV4dC5hcGkuc2V0U3R5bGVzaGVldCgnbWFzdGVyY2hpZWZzdHlsZScsIHBhdGguam9pbihfX2Rpcm5hbWUsICdtYXN0ZXJjaGllZi5zY3NzJykpO1xyXG4gICAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nKSA9PiBhcHBseVRvTWFuaWZlc3QoY29udGV4dC5hcGksIHRydWUpKTtcclxuICAgICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nKSA9PiBhcHBseVRvTWFuaWZlc3QoY29udGV4dC5hcGksIGZhbHNlKSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcbiJdfQ==