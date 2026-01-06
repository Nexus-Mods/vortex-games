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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoPanelWrap = InfoPanelWrap;
const React = __importStar(require("react"));
const vortex_api_1 = require("vortex-api");
const react_bootstrap_1 = require("react-bootstrap");
const react_redux_1 = require("react-redux");
const util_1 = require("./util");
const actions_1 = require("./actions");
const common_1 = require("./common");
function InfoPanelWrap(props) {
    const { api, getOwnGameVersion, readStoredLO, installLSLib, getLatestLSLibMod } = props;
    const currentProfile = (0, react_redux_1.useSelector)((state) => { var _a; return (_a = state.settings['baldursgate3']) === null || _a === void 0 ? void 0 : _a.playerProfile; });
    const [gameVersion, setGameVersion] = React.useState();
    React.useEffect(() => {
        (() => __awaiter(this, void 0, void 0, function* () {
            if (!gameVersion) {
                setGameVersion(yield getOwnGameVersion(api.getState()));
            }
        }))();
    }, [gameVersion, setGameVersion]);
    const onSetProfile = React.useCallback((profileName) => {
        const impl = () => __awaiter(this, void 0, void 0, function* () {
            api.store.dispatch((0, actions_1.setPlayerProfile)(profileName));
            try {
                yield readStoredLO(api);
            }
            catch (err) {
                api.showErrorNotification('Failed to read load order', err, {
                    message: 'Please run the game before you start modding',
                    allowReport: false,
                });
            }
            (0, util_1.forceRefresh)(api);
        });
        impl();
    }, [api]);
    const isLsLibInstalled = React.useCallback(() => {
        return getLatestLSLibMod(api) !== undefined;
    }, [api]);
    const onInstallLSLib = React.useCallback(() => {
        installLSLib(api, common_1.GAME_ID);
    }, [api]);
    if (!gameVersion) {
        return null;
    }
    return (React.createElement(InfoPanel, { t: api.translate, gameVersion: gameVersion, currentProfile: currentProfile, onSetPlayerProfile: onSetProfile, isLsLibInstalled: isLsLibInstalled, onInstallLSLib: onInstallLSLib }));
}
function InfoPanel(props) {
    const { t, onInstallLSLib, isLsLibInstalled } = props;
    return isLsLibInstalled() ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginRight: '16px' } },
        React.createElement(react_bootstrap_1.Alert, { bsStyle: 'warning', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement("div", null,
                t('To successfully switch between different game versions/patches please follow these steps:'),
                React.createElement("ul", null,
                    React.createElement("li", null, t('Purge your mods')),
                    React.createElement("li", null, t('Run the game so that the modsettings.lsx file gets reset to the default values')),
                    React.createElement("li", null, t('Close the game')),
                    React.createElement("li", null, t('Deploy your mods')),
                    React.createElement("li", null, t('Run the game again - your load order will be maintained'))))),
        React.createElement("div", null, t(`A backup is made of the game's modsettings.lsx file before anything is changed.
        This can be found at %APPDATA%\\Local\\Larian Studios\\Baldur's Gate 3\\PlayerProfiles\\Public\\modsettings.lsx.backup`)),
        React.createElement("div", null, t(`Drag and Drop PAK files to reorder how the game loads them. Please note, some mods contain multiple PAK files.`)),
        React.createElement("div", null, t(`Mod descriptions from mod authors may have information to determine the best order.`)),
        React.createElement("div", null, t(`Some mods may be locked in this list because they are loaded differently by the game and can therefore not be load-ordered by mod managers. 
        If you need to disable such a mod, please do so in Vortex\'s Mods page.`)),
        React.createElement("h4", { style: { margin: 0 } }, t('Import and Export')),
        React.createElement("div", null, t(`Import is an experimental tool to help migration from a game load order (.lsx file) to Vortex. It works by importing the game's modsettings file
        and attempts to match up mods that have been installed by Vortex.`)),
        React.createElement("div", null, t(`Export can be used to manually update the game's modsettings.lsx file if 'Settings > Mods > Auto export load order' isn't set to do this automatically. 
        It can also be used to export to a different file as a backup.`)),
        React.createElement("h4", { style: { margin: 0 } }, t('Import from Baldur\'s Gate 3 Mod Manager')),
        React.createElement("div", null, t('Vortex can sort your load order based on a BG3MM .json load order file. Any mods that are not installed through Vortex will be ignored.')),
        React.createElement("div", null, t('Please note that any mods that are not present in the BG3MM load order file will be placed at the bottom of the load order.')))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        React.createElement("h4", { style: { margin: 0 } }, t('LSLib is not installed')),
        React.createElement("div", null, t('To take full advantage of Vortex\'s Baldur\s Gate 3 modding capabilities such as managing the '
            + 'order in which mods are loaded into the game; Vortex requires a 3rd party tool called LSLib.')),
        React.createElement("div", null, t('Please install the library using the buttons below to manage your load order.')),
        React.createElement(vortex_api_1.tooltip.Button, { tooltip: 'Install LSLib', onClick: onInstallLSLib }, t('Install LSLib'))));
}
function mapDispatchToProps(dispatch) {
    return {
        onSetProfile: (profile) => dispatch((0, actions_1.setPlayerProfile)(profile)),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5mb1BhbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5mb1BhbmVsLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBCQSxzQ0F1REM7QUFoRkQsNkNBQStCO0FBQy9CLDJDQUE0QztBQUU1QyxxREFBd0M7QUFDeEMsNkNBQTBDO0FBRzFDLGlDQUFzQztBQUd0Qyx1Q0FBNkM7QUFDN0MscUNBQW1DO0FBY25DLFNBQWdCLGFBQWEsQ0FBQyxLQUFpQjtJQUM3QyxNQUFNLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFDMUMsWUFBWSxFQUFFLGlCQUFpQixFQUFFLEdBQUcsS0FBSyxDQUFDO0lBRTVDLE1BQU0sY0FBYyxHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQW1CLEVBQUUsRUFBRSxXQUN6RCxPQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsMENBQUUsYUFBYSxDQUFBLEVBQUEsQ0FBQyxDQUFDO0lBRWpELE1BQU0sQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBVSxDQUFDO0lBRS9ELEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ25CLENBQUMsR0FBUyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixjQUFjLENBQUMsTUFBTSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDSCxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUM7SUFDUCxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBbUIsRUFBRSxFQUFFO1FBQzdELE1BQU0sSUFBSSxHQUFHLEdBQVMsRUFBRTtZQUN0QixHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLDBCQUFnQixFQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDO2dCQUNILE1BQU0sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNiLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7b0JBQzFELE9BQU8sRUFBRSw4Q0FBOEM7b0JBQ3ZELFdBQVcsRUFBRSxLQUFLO2lCQUNuQixDQUFDLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBQSxtQkFBWSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLENBQUMsQ0FBQSxDQUFDO1FBQ0YsSUFBSSxFQUFFLENBQUM7SUFDVCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVYsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtRQUM5QyxPQUFPLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsQ0FBQztJQUM5QyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVYsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7UUFDNUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxnQkFBTyxDQUFDLENBQUM7SUFDN0IsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVWLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNqQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLENBQ0wsb0JBQUMsU0FBUyxJQUNSLENBQUMsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUNoQixXQUFXLEVBQUUsV0FBVyxFQUN4QixjQUFjLEVBQUUsY0FBYyxFQUM5QixrQkFBa0IsRUFBRSxZQUFZLEVBQ2hDLGdCQUFnQixFQUFFLGdCQUFnQixFQUNsQyxjQUFjLEVBQUUsY0FBYyxHQUM5QixDQUNILENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBVTtJQUMzQixNQUFNLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUV0RCxPQUFPLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQzFCLDZCQUFLLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUU7UUFDeEYsb0JBQUMsdUJBQUssSUFBQyxPQUFPLEVBQUMsU0FBUyxFQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFO1lBQ3RGO2dCQUNHLENBQUMsQ0FBQywyRkFBMkYsQ0FBQztnQkFDL0Y7b0JBQ0UsZ0NBQ0csQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQ2xCO29CQUNMLGdDQUNHLENBQUMsQ0FBQyxnRkFBZ0YsQ0FBQyxDQUNqRjtvQkFDTCxnQ0FDRyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FDakI7b0JBQ0wsZ0NBQ0csQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQ25CO29CQUNMLGdDQUNHLENBQUMsQ0FBQyx5REFBeUQsQ0FBQyxDQUMxRCxDQUNGLENBQ0QsQ0FDQTtRQUNSLGlDQUNHLENBQUMsQ0FBQzsrSEFDb0gsQ0FBQyxDQUNwSDtRQUNOLGlDQUNHLENBQUMsQ0FBQyxnSEFBZ0gsQ0FBQyxDQUNoSDtRQUNOLGlDQUNHLENBQUMsQ0FBQyxxRkFBcUYsQ0FBQyxDQUNyRjtRQUNOLGlDQUNHLENBQUMsQ0FBQztnRkFDcUUsQ0FBQyxDQUNyRTtRQUNOLDRCQUFJLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFDckIsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQ3BCO1FBQ0wsaUNBQ0csQ0FBQyxDQUFDOzBFQUMrRCxDQUFDLENBQy9EO1FBQ04saUNBQ0csQ0FBQyxDQUFDO3VFQUM0RCxDQUFDLENBQzVEO1FBQ04sNEJBQUksS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUNyQixDQUFDLENBQUMsMENBQTBDLENBQUMsQ0FDM0M7UUFDTCxpQ0FDRyxDQUFDLENBQUMseUlBQXlJLENBQUMsQ0FDekk7UUFDTixpQ0FDRyxDQUFDLENBQUMsNkhBQTZILENBQUMsQ0FDN0gsQ0FFRixDQUNQLENBQUMsQ0FBQyxDQUFDLENBQ0YsNkJBQUssS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUU7UUFDbkUsNEJBQUksS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUNyQixDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FDekI7UUFDTCxpQ0FDRyxDQUFDLENBQUMsZ0dBQWdHO2NBQy9GLDhGQUE4RixDQUFDLENBQy9GO1FBQ04saUNBQ0csQ0FBQyxDQUFDLCtFQUErRSxDQUFDLENBQy9FO1FBQ04sb0JBQUMsb0JBQU8sQ0FBQyxNQUFNLElBQ2IsT0FBTyxFQUFFLGVBQWUsRUFDeEIsT0FBTyxFQUFFLGNBQWMsSUFFdEIsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUNKLENBQ2IsQ0FDUCxDQUFDO0FBQ0osQ0FBQztBQVFELFNBQVMsa0JBQWtCLENBQUMsUUFBK0M7SUFDekUsT0FBTztRQUNMLFlBQVksRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUEsMEJBQWdCLEVBQUMsT0FBTyxDQUFDLENBQUM7S0FDdkUsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IHR5cGVzLCB0b29sdGlwIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBBbGVydCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5pbXBvcnQgKiBhcyBSZWR1eCBmcm9tICdyZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBmb3JjZVJlZnJlc2ggfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBUaHVua0Rpc3BhdGNoIH0gZnJvbSAncmVkdXgtdGh1bmsnO1xyXG5cclxuaW1wb3J0IHsgc2V0UGxheWVyUHJvZmlsZSB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIGdldE93bkdhbWVWZXJzaW9uOiAoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT4gUHJvbWlzZTxzdHJpbmc+O1xyXG4gIHJlYWRTdG9yZWRMTzogKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gUHJvbWlzZTx2b2lkPjtcclxuICBpbnN0YWxsTFNMaWI6IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xyXG4gIGdldExhdGVzdExTTGliTW9kOiAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB0eXBlcy5JTW9kO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcclxuICBvblNldFByb2ZpbGU6IChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSW5mb1BhbmVsV3JhcChwcm9wczogSUJhc2VQcm9wcykge1xyXG4gIGNvbnN0IHsgYXBpLCBnZXRPd25HYW1lVmVyc2lvbiwgcmVhZFN0b3JlZExPLFxyXG4gICAgaW5zdGFsbExTTGliLCBnZXRMYXRlc3RMU0xpYk1vZCB9ID0gcHJvcHM7XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XHJcbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LnBsYXllclByb2ZpbGUpO1xyXG5cclxuICBjb25zdCBbZ2FtZVZlcnNpb24sIHNldEdhbWVWZXJzaW9uXSA9IFJlYWN0LnVzZVN0YXRlPHN0cmluZz4oKTtcclxuXHJcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcclxuICAgIChhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmICghZ2FtZVZlcnNpb24pIHtcclxuICAgICAgICBzZXRHYW1lVmVyc2lvbihhd2FpdCBnZXRPd25HYW1lVmVyc2lvbihhcGkuZ2V0U3RhdGUoKSkpO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gIH0sIFtnYW1lVmVyc2lvbiwgc2V0R2FtZVZlcnNpb25dKTtcclxuXHJcbiAgY29uc3Qgb25TZXRQcm9maWxlID0gUmVhY3QudXNlQ2FsbGJhY2soKHByb2ZpbGVOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IGltcGwgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGVOYW1lKSk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZm9yY2VSZWZyZXNoKGFwaSk7XHJcbiAgICB9O1xyXG4gICAgaW1wbCgpO1xyXG4gIH0sIFthcGldKTtcclxuXHJcbiAgY29uc3QgaXNMc0xpYkluc3RhbGxlZCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcclxuICAgIHJldHVybiBnZXRMYXRlc3RMU0xpYk1vZChhcGkpICE9PSB1bmRlZmluZWQ7XHJcbiAgfSwgW2FwaV0pO1xyXG5cclxuICBjb25zdCBvbkluc3RhbGxMU0xpYiA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcclxuICAgIGluc3RhbGxMU0xpYihhcGksIEdBTUVfSUQpO1xyXG4gIH0sIFthcGldKTtcclxuXHJcbiAgaWYgKCFnYW1lVmVyc2lvbikge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPEluZm9QYW5lbFxyXG4gICAgICB0PXthcGkudHJhbnNsYXRlfVxyXG4gICAgICBnYW1lVmVyc2lvbj17Z2FtZVZlcnNpb259XHJcbiAgICAgIGN1cnJlbnRQcm9maWxlPXtjdXJyZW50UHJvZmlsZX1cclxuICAgICAgb25TZXRQbGF5ZXJQcm9maWxlPXtvblNldFByb2ZpbGV9XHJcbiAgICAgIGlzTHNMaWJJbnN0YWxsZWQ9e2lzTHNMaWJJbnN0YWxsZWR9XHJcbiAgICAgIG9uSW5zdGFsbExTTGliPXtvbkluc3RhbGxMU0xpYn1cclxuICAgIC8+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzOiBhbnkpIHtcclxuICBjb25zdCB7IHQsIG9uSW5zdGFsbExTTGliLCBpc0xzTGliSW5zdGFsbGVkIH0gPSBwcm9wcztcclxuXHJcbiAgcmV0dXJuIGlzTHNMaWJJbnN0YWxsZWQoKSA/IChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMTJweCcsIG1hcmdpblJpZ2h0OiAnMTZweCcgfX0+XHJcbiAgICAgIDxBbGVydCBic1N0eWxlPSd3YXJuaW5nJyBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc4cHgnIH19PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICB7dCgnVG8gc3VjY2Vzc2Z1bGx5IHN3aXRjaCBiZXR3ZWVuIGRpZmZlcmVudCBnYW1lIHZlcnNpb25zL3BhdGNoZXMgcGxlYXNlIGZvbGxvdyB0aGVzZSBzdGVwczonKX1cclxuICAgICAgICAgIDx1bD5cclxuICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgIHt0KCdQdXJnZSB5b3VyIG1vZHMnKX1cclxuICAgICAgICAgICAgPC9saT5cclxuICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgIHt0KCdSdW4gdGhlIGdhbWUgc28gdGhhdCB0aGUgbW9kc2V0dGluZ3MubHN4IGZpbGUgZ2V0cyByZXNldCB0byB0aGUgZGVmYXVsdCB2YWx1ZXMnKX1cclxuICAgICAgICAgICAgPC9saT5cclxuICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgIHt0KCdDbG9zZSB0aGUgZ2FtZScpfVxyXG4gICAgICAgICAgICA8L2xpPlxyXG4gICAgICAgICAgICA8bGk+XHJcbiAgICAgICAgICAgICAge3QoJ0RlcGxveSB5b3VyIG1vZHMnKX1cclxuICAgICAgICAgICAgPC9saT5cclxuICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgIHt0KCdSdW4gdGhlIGdhbWUgYWdhaW4gLSB5b3VyIGxvYWQgb3JkZXIgd2lsbCBiZSBtYWludGFpbmVkJyl9XHJcbiAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICA8L3VsPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L0FsZXJ0PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBBIGJhY2t1cCBpcyBtYWRlIG9mIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MubHN4IGZpbGUgYmVmb3JlIGFueXRoaW5nIGlzIGNoYW5nZWQuXHJcbiAgICAgICAgVGhpcyBjYW4gYmUgZm91bmQgYXQgJUFQUERBVEElXFxcXExvY2FsXFxcXExhcmlhbiBTdHVkaW9zXFxcXEJhbGR1cidzIEdhdGUgM1xcXFxQbGF5ZXJQcm9maWxlc1xcXFxQdWJsaWNcXFxcbW9kc2V0dGluZ3MubHN4LmJhY2t1cGApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgRHJhZyBhbmQgRHJvcCBQQUsgZmlsZXMgdG8gcmVvcmRlciBob3cgdGhlIGdhbWUgbG9hZHMgdGhlbS4gUGxlYXNlIG5vdGUsIHNvbWUgbW9kcyBjb250YWluIG11bHRpcGxlIFBBSyBmaWxlcy5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYE1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyBtYXkgaGF2ZSBpbmZvcm1hdGlvbiB0byBkZXRlcm1pbmUgdGhlIGJlc3Qgb3JkZXIuYCl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBTb21lIG1vZHMgbWF5IGJlIGxvY2tlZCBpbiB0aGlzIGxpc3QgYmVjYXVzZSB0aGV5IGFyZSBsb2FkZWQgZGlmZmVyZW50bHkgYnkgdGhlIGdhbWUgYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGxvYWQtb3JkZXJlZCBieSBtb2QgbWFuYWdlcnMuIFxyXG4gICAgICAgIElmIHlvdSBuZWVkIHRvIGRpc2FibGUgc3VjaCBhIG1vZCwgcGxlYXNlIGRvIHNvIGluIFZvcnRleFxcJ3MgTW9kcyBwYWdlLmApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGg0IHN0eWxlPXt7IG1hcmdpbjogMCB9fT5cclxuICAgICAgICB7dCgnSW1wb3J0IGFuZCBFeHBvcnQnKX1cclxuICAgICAgPC9oND5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgSW1wb3J0IGlzIGFuIGV4cGVyaW1lbnRhbCB0b29sIHRvIGhlbHAgbWlncmF0aW9uIGZyb20gYSBnYW1lIGxvYWQgb3JkZXIgKC5sc3ggZmlsZSkgdG8gVm9ydGV4LiBJdCB3b3JrcyBieSBpbXBvcnRpbmcgdGhlIGdhbWUncyBtb2RzZXR0aW5ncyBmaWxlXHJcbiAgICAgICAgYW5kIGF0dGVtcHRzIHRvIG1hdGNoIHVwIG1vZHMgdGhhdCBoYXZlIGJlZW4gaW5zdGFsbGVkIGJ5IFZvcnRleC5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYEV4cG9ydCBjYW4gYmUgdXNlZCB0byBtYW51YWxseSB1cGRhdGUgdGhlIGdhbWUncyBtb2RzZXR0aW5ncy5sc3ggZmlsZSBpZiAnU2V0dGluZ3MgPiBNb2RzID4gQXV0byBleHBvcnQgbG9hZCBvcmRlcicgaXNuJ3Qgc2V0IHRvIGRvIHRoaXMgYXV0b21hdGljYWxseS4gXHJcbiAgICAgICAgSXQgY2FuIGFsc28gYmUgdXNlZCB0byBleHBvcnQgdG8gYSBkaWZmZXJlbnQgZmlsZSBhcyBhIGJhY2t1cC5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XHJcbiAgICAgICAge3QoJ0ltcG9ydCBmcm9tIEJhbGR1clxcJ3MgR2F0ZSAzIE1vZCBNYW5hZ2VyJyl9XHJcbiAgICAgIDwvaDQ+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJ1ZvcnRleCBjYW4gc29ydCB5b3VyIGxvYWQgb3JkZXIgYmFzZWQgb24gYSBCRzNNTSAuanNvbiBsb2FkIG9yZGVyIGZpbGUuIEFueSBtb2RzIHRoYXQgYXJlIG5vdCBpbnN0YWxsZWQgdGhyb3VnaCBWb3J0ZXggd2lsbCBiZSBpZ25vcmVkLicpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnUGxlYXNlIG5vdGUgdGhhdCBhbnkgbW9kcyB0aGF0IGFyZSBub3QgcHJlc2VudCBpbiB0aGUgQkczTU0gbG9hZCBvcmRlciBmaWxlIHdpbGwgYmUgcGxhY2VkIGF0IHRoZSBib3R0b20gb2YgdGhlIGxvYWQgb3JkZXIuJyl9XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgIDwvZGl2PlxyXG4gICkgOiAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzEycHgnIH19PlxyXG4gICAgICA8aDQgc3R5bGU9e3sgbWFyZ2luOiAwIH19PlxyXG4gICAgICAgIHt0KCdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyl9XHJcbiAgICAgIDwvaDQ+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJ1RvIHRha2UgZnVsbCBhZHZhbnRhZ2Ugb2YgVm9ydGV4XFwncyBCYWxkdXJcXHMgR2F0ZSAzIG1vZGRpbmcgY2FwYWJpbGl0aWVzIHN1Y2ggYXMgbWFuYWdpbmcgdGhlICdcclxuICAgICAgICAgICsgJ29yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCBpbnRvIHRoZSBnYW1lOyBWb3J0ZXggcmVxdWlyZXMgYSAzcmQgcGFydHkgdG9vbCBjYWxsZWQgTFNMaWIuJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KCdQbGVhc2UgaW5zdGFsbCB0aGUgbGlicmFyeSB1c2luZyB0aGUgYnV0dG9ucyBiZWxvdyB0byBtYW5hZ2UgeW91ciBsb2FkIG9yZGVyLicpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPHRvb2x0aXAuQnV0dG9uXHJcbiAgICAgICAgdG9vbHRpcD17J0luc3RhbGwgTFNMaWInfVxyXG4gICAgICAgIG9uQ2xpY2s9e29uSW5zdGFsbExTTGlifVxyXG4gICAgICA+XHJcbiAgICAgICAge3QoJ0luc3RhbGwgTFNMaWInKX1cclxuICAgICAgPC90b29sdGlwLkJ1dHRvbj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbi8vIGZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogYW55KTogSUNvbm5lY3RlZFByb3BzIHtcclxuLy8gICByZXR1cm4ge1xyXG4vLyAgICAgY3VycmVudFRoZW1lOiBzdGF0ZS5zZXR0aW5ncy5pbnRlcmZhY2UuY3VycmVudFRoZW1lLFxyXG4vLyAgIH07XHJcbi8vIH1cclxuXHJcbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogVGh1bmtEaXNwYXRjaDxhbnksIGFueSwgUmVkdXguQWN0aW9uPik6IElBY3Rpb25Qcm9wcyB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uU2V0UHJvZmlsZTogKHByb2ZpbGU6IHN0cmluZykgPT4gZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlKSksXHJcbiAgfTtcclxufSJdfQ==