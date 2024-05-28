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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoPanelWrap = void 0;
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
exports.InfoPanelWrap = InfoPanelWrap;
function InfoPanel(props) {
    const { t, onInstallLSLib, isLsLibInstalled } = props;
    return isLsLibInstalled() ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginRight: '16px' } },
        React.createElement(react_bootstrap_1.Alert, { bsStyle: 'warning', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement("div", null, t(`Version 0.3 of the extension is almost a complete rewrite of load order and migration from previous versions may cause issues.
        A Purge then a Deploy will normally solve all issues but please make a backup first using Export... as the load order will be reset.`)),
            React.createElement("div", null, t(`A backup is made of the game's modsettings.lsx file before anything is changed.
        This can be found at %APPDATA%\\Local\\Larian Studios\\Baldur's Gate 3\\PlayerProfiles\\Public\\modsettings.lsx.backup`))),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5mb1BhbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5mb1BhbmVsLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQiwyQ0FBNEM7QUFFNUMscURBQXdDO0FBQ3hDLDZDQUEwQztBQUcxQyxpQ0FBc0M7QUFHdEMsdUNBQTZDO0FBQzdDLHFDQUFtQztBQWNuQyxTQUFnQixhQUFhLENBQUMsS0FBaUI7SUFDN0MsTUFBTSxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQzFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUU1QyxNQUFNLGNBQWMsR0FBRyxJQUFBLHlCQUFXLEVBQUMsQ0FBQyxLQUFtQixFQUFFLEVBQUUsV0FDekQsT0FBQSxNQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLDBDQUFFLGFBQWEsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUVqRCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQVUsQ0FBQztJQUUvRCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNuQixDQUFDLEdBQVMsRUFBRTtZQUNWLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2hCLGNBQWMsQ0FBQyxNQUFNLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDekQ7UUFDSCxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUM7SUFDUCxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBbUIsRUFBRSxFQUFFO1FBQzdELE1BQU0sSUFBSSxHQUFHLEdBQVMsRUFBRTtZQUN0QixHQUFHLENBQUMsS0FBSyxDQUFDLFFB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QUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUU7UUFDbkUsNEJBQUksS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUNyQixDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FDekI7UUFDTCxpQ0FDRyxDQUFDLENBQUMsZ0dBQWdHO2NBQy9GLDhGQUE4RixDQUFDLENBQy9GO1FBQ04saUNBQ0csQ0FBQyxDQUFDLCtFQUErRSxDQUFDLENBQy9FO1FBQ04sb0JBQUMsb0JBQU8sQ0FBQyxNQUFNLElBQ2IsT0FBTyxFQUFFLGVBQWUsRUFDeEIsT0FBTyxFQUFFLGNBQWMsSUFFdEIsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUNKLENBQ2IsQ0FDUCxDQUFDO0FBQ0osQ0FBQztBQVFELFNBQVMsa0JBQWtCLENBQUMsUUFBK0M7SUFDekUsT0FBTztRQUNMLFlBQVksRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUEsMEJBQWdCLEVBQUMsT0FBTyxDQUFDLENBQUM7S0FDdkUsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IHR5cGVzLCB0b29sdGlwIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBBbGVydCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5pbXBvcnQgKiBhcyBSZWR1eCBmcm9tICdyZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBmb3JjZVJlZnJlc2ggfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBUaHVua0Rpc3BhdGNoIH0gZnJvbSAncmVkdXgtdGh1bmsnO1xyXG5cclxuaW1wb3J0IHsgc2V0UGxheWVyUHJvZmlsZSB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIGdldE93bkdhbWVWZXJzaW9uOiAoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT4gUHJvbWlzZTxzdHJpbmc+O1xyXG4gIHJlYWRTdG9yZWRMTzogKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gUHJvbWlzZTx2b2lkPjtcclxuICBpbnN0YWxsTFNMaWI6IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xyXG4gIGdldExhdGVzdExTTGliTW9kOiAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB0eXBlcy5JTW9kO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcclxuICBvblNldFByb2ZpbGU6IChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSW5mb1BhbmVsV3JhcChwcm9wczogSUJhc2VQcm9wcykge1xyXG4gIGNvbnN0IHsgYXBpLCBnZXRPd25HYW1lVmVyc2lvbiwgcmVhZFN0b3JlZExPLFxyXG4gICAgaW5zdGFsbExTTGliLCBnZXRMYXRlc3RMU0xpYk1vZCB9ID0gcHJvcHM7XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XHJcbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LnBsYXllclByb2ZpbGUpO1xyXG5cclxuICBjb25zdCBbZ2FtZVZlcnNpb24sIHNldEdhbWVWZXJzaW9uXSA9IFJlYWN0LnVzZVN0YXRlPHN0cmluZz4oKTtcclxuXHJcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcclxuICAgIChhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmICghZ2FtZVZlcnNpb24pIHtcclxuICAgICAgICBzZXRHYW1lVmVyc2lvbihhd2FpdCBnZXRPd25HYW1lVmVyc2lvbihhcGkuZ2V0U3RhdGUoKSkpO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gIH0sIFtnYW1lVmVyc2lvbiwgc2V0R2FtZVZlcnNpb25dKTtcclxuXHJcbiAgY29uc3Qgb25TZXRQcm9maWxlID0gUmVhY3QudXNlQ2FsbGJhY2soKHByb2ZpbGVOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IGltcGwgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGVOYW1lKSk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXHJcbiAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZm9yY2VSZWZyZXNoKGFwaSk7XHJcbiAgICB9O1xyXG4gICAgaW1wbCgpO1xyXG4gIH0sIFthcGldKTtcclxuXHJcbiAgY29uc3QgaXNMc0xpYkluc3RhbGxlZCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcclxuICAgIHJldHVybiBnZXRMYXRlc3RMU0xpYk1vZChhcGkpICE9PSB1bmRlZmluZWQ7XHJcbiAgfSwgW2FwaV0pO1xyXG5cclxuICBjb25zdCBvbkluc3RhbGxMU0xpYiA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcclxuICAgIGluc3RhbGxMU0xpYihhcGksIEdBTUVfSUQpO1xyXG4gIH0sIFthcGldKTtcclxuXHJcbiAgaWYgKCFnYW1lVmVyc2lvbikge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPEluZm9QYW5lbFxyXG4gICAgICB0PXthcGkudHJhbnNsYXRlfVxyXG4gICAgICBnYW1lVmVyc2lvbj17Z2FtZVZlcnNpb259XHJcbiAgICAgIGN1cnJlbnRQcm9maWxlPXtjdXJyZW50UHJvZmlsZX1cclxuICAgICAgb25TZXRQbGF5ZXJQcm9maWxlPXtvblNldFByb2ZpbGV9XHJcbiAgICAgIGlzTHNMaWJJbnN0YWxsZWQ9e2lzTHNMaWJJbnN0YWxsZWR9XHJcbiAgICAgIG9uSW5zdGFsbExTTGliPXtvbkluc3RhbGxMU0xpYn1cclxuICAgIC8+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzOiBhbnkpIHtcclxuICBjb25zdCB7IHQsIG9uSW5zdGFsbExTTGliLCBpc0xzTGliSW5zdGFsbGVkIH0gPSBwcm9wcztcclxuXHJcbiAgcmV0dXJuIGlzTHNMaWJJbnN0YWxsZWQoKSA/IChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMTJweCcsIG1hcmdpblJpZ2h0OiAnMTZweCcgfX0+XHJcbiAgICAgIDxBbGVydCBic1N0eWxlPSd3YXJuaW5nJyBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICc4cHgnIH19PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICB7dChgVmVyc2lvbiAwLjMgb2YgdGhlIGV4dGVuc2lvbiBpcyBhbG1vc3QgYSBjb21wbGV0ZSByZXdyaXRlIG9mIGxvYWQgb3JkZXIgYW5kIG1pZ3JhdGlvbiBmcm9tIHByZXZpb3VzIHZlcnNpb25zIG1heSBjYXVzZSBpc3N1ZXMuXHJcbiAgICAgICAgQSBQdXJnZSB0aGVuIGEgRGVwbG95IHdpbGwgbm9ybWFsbHkgc29sdmUgYWxsIGlzc3VlcyBidXQgcGxlYXNlIG1ha2UgYSBiYWNrdXAgZmlyc3QgdXNpbmcgRXhwb3J0Li4uIGFzIHRoZSBsb2FkIG9yZGVyIHdpbGwgYmUgcmVzZXQuYCl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIHt0KGBBIGJhY2t1cCBpcyBtYWRlIG9mIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MubHN4IGZpbGUgYmVmb3JlIGFueXRoaW5nIGlzIGNoYW5nZWQuXHJcbiAgICAgICAgVGhpcyBjYW4gYmUgZm91bmQgYXQgJUFQUERBVEElXFxcXExvY2FsXFxcXExhcmlhbiBTdHVkaW9zXFxcXEJhbGR1cidzIEdhdGUgM1xcXFxQbGF5ZXJQcm9maWxlc1xcXFxQdWJsaWNcXFxcbW9kc2V0dGluZ3MubHN4LmJhY2t1cGApfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L0FsZXJ0PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBEcmFnIGFuZCBEcm9wIFBBSyBmaWxlcyB0byByZW9yZGVyIGhvdyB0aGUgZ2FtZSBsb2FkcyB0aGVtLiBQbGVhc2Ugbm90ZSwgc29tZSBtb2RzIGNvbnRhaW4gbXVsdGlwbGUgUEFLIGZpbGVzLmApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgTW9kIGRlc2NyaXB0aW9ucyBmcm9tIG1vZCBhdXRob3JzIG1heSBoYXZlIGluZm9ybWF0aW9uIHRvIGRldGVybWluZSB0aGUgYmVzdCBvcmRlci5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYFNvbWUgbW9kcyBtYXkgYmUgbG9ja2VkIGluIHRoaXMgbGlzdCBiZWNhdXNlIHRoZXkgYXJlIGxvYWRlZCBkaWZmZXJlbnRseSBieSB0aGUgZ2FtZSBhbmQgY2FuIHRoZXJlZm9yZSBub3QgYmUgbG9hZC1vcmRlcmVkIGJ5IG1vZCBtYW5hZ2Vycy4gXHJcbiAgICAgICAgSWYgeW91IG5lZWQgdG8gZGlzYWJsZSBzdWNoIGEgbW9kLCBwbGVhc2UgZG8gc28gaW4gVm9ydGV4XFwncyBNb2RzIHBhZ2UuYCl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8aDQgc3R5bGU9e3sgbWFyZ2luOiAwIH19PlxyXG4gICAgICAgIHt0KCdJbXBvcnQgYW5kIEV4cG9ydCcpfVxyXG4gICAgICA8L2g0PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBJbXBvcnQgaXMgYW4gZXhwZXJpbWVudGFsIHRvb2wgdG8gaGVscCBtaWdyYXRpb24gZnJvbSBhIGdhbWUgbG9hZCBvcmRlciAoLmxzeCBmaWxlKSB0byBWb3J0ZXguIEl0IHdvcmtzIGJ5IGltcG9ydGluZyB0aGUgZ2FtZSdzIG1vZHNldHRpbmdzIGZpbGVcclxuICAgICAgICBhbmQgYXR0ZW1wdHMgdG8gbWF0Y2ggdXAgbW9kcyB0aGF0IGhhdmUgYmVlbiBpbnN0YWxsZWQgYnkgVm9ydGV4LmApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgRXhwb3J0IGNhbiBiZSB1c2VkIHRvIG1hbnVhbGx5IHVwZGF0ZSB0aGUgZ2FtZSdzIG1vZHNldHRpbmdzLmxzeCBmaWxlIGlmICdTZXR0aW5ncyA+IE1vZHMgPiBBdXRvIGV4cG9ydCBsb2FkIG9yZGVyJyBpc24ndCBzZXQgdG8gZG8gdGhpcyBhdXRvbWF0aWNhbGx5LiBcclxuICAgICAgICBJdCBjYW4gYWxzbyBiZSB1c2VkIHRvIGV4cG9ydCB0byBhIGRpZmZlcmVudCBmaWxlIGFzIGEgYmFja3VwLmApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGg0IHN0eWxlPXt7IG1hcmdpbjogMCB9fT5cclxuICAgICAgICB7dCgnSW1wb3J0IGZyb20gQmFsZHVyXFwncyBHYXRlIDMgTW9kIE1hbmFnZXInKX1cclxuICAgICAgPC9oND5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnVm9ydGV4IGNhbiBzb3J0IHlvdXIgbG9hZCBvcmRlciBiYXNlZCBvbiBhIEJHM01NIC5qc29uIGxvYWQgb3JkZXIgZmlsZS4gQW55IG1vZHMgdGhhdCBhcmUgbm90IGluc3RhbGxlZCB0aHJvdWdoIFZvcnRleCB3aWxsIGJlIGlnbm9yZWQuJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KCdQbGVhc2Ugbm90ZSB0aGF0IGFueSBtb2RzIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluIHRoZSBCRzNNTSBsb2FkIG9yZGVyIGZpbGUgd2lsbCBiZSBwbGFjZWQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgbG9hZCBvcmRlci4nKX1cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgPC9kaXY+XHJcbiAgKSA6IChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMTJweCcgfX0+XHJcbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XHJcbiAgICAgICAge3QoJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKX1cclxuICAgICAgPC9oND5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnVG8gdGFrZSBmdWxsIGFkdmFudGFnZSBvZiBWb3J0ZXhcXCdzIEJhbGR1clxccyBHYXRlIDMgbW9kZGluZyBjYXBhYmlsaXRpZXMgc3VjaCBhcyBtYW5hZ2luZyB0aGUgJ1xyXG4gICAgICAgICAgKyAnb3JkZXIgaW4gd2hpY2ggbW9kcyBhcmUgbG9hZGVkIGludG8gdGhlIGdhbWU7IFZvcnRleCByZXF1aXJlcyBhIDNyZCBwYXJ0eSB0b29sIGNhbGxlZCBMU0xpYi4nKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJ1BsZWFzZSBpbnN0YWxsIHRoZSBsaWJyYXJ5IHVzaW5nIHRoZSBidXR0b25zIGJlbG93IHRvIG1hbmFnZSB5b3VyIGxvYWQgb3JkZXIuJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8dG9vbHRpcC5CdXR0b25cclxuICAgICAgICB0b29sdGlwPXsnSW5zdGFsbCBMU0xpYid9XHJcbiAgICAgICAgb25DbGljaz17b25JbnN0YWxsTFNMaWJ9XHJcbiAgICAgID5cclxuICAgICAgICB7dCgnSW5zdGFsbCBMU0xpYicpfVxyXG4gICAgICA8L3Rvb2x0aXAuQnV0dG9uPlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuLy8gZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiBhbnkpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4vLyAgIHJldHVybiB7XHJcbi8vICAgICBjdXJyZW50VGhlbWU6IHN0YXRlLnNldHRpbmdzLmludGVyZmFjZS5jdXJyZW50VGhlbWUsXHJcbi8vICAgfTtcclxuLy8gfVxyXG5cclxuZnVuY3Rpb24gbWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoOiBUaHVua0Rpc3BhdGNoPGFueSwgYW55LCBSZWR1eC5BY3Rpb24+KTogSUFjdGlvblByb3BzIHtcclxuICByZXR1cm4ge1xyXG4gICAgb25TZXRQcm9maWxlOiAocHJvZmlsZTogc3RyaW5nKSA9PiBkaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGUpKSxcclxuICB9O1xyXG59Il19