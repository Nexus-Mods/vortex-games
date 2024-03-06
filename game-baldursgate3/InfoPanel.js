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
        It can also be used to export to a different file as a backup.`)))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5mb1BhbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5mb1BhbmVsLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQiwyQ0FBNEM7QUFFNUMscURBQXdDO0FBQ3hDLDZDQUEwQztBQUcxQyxpQ0FBc0M7QUFHdEMsdUNBQTZDO0FBQzdDLHFDQUFtQztBQWNuQyxTQUFnQixhQUFhLENBQUMsS0FBaUI7SUFDN0MsTUFBTSxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQzFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUU1QyxNQUFNLGNBQWMsR0FBRyxJQUFBLHlCQUFXLEVBQUMsQ0FBQyxLQUFtQixFQUFFLEVBQUUsV0FDekQsT0FBQSxNQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLDBDQUFFLGFBQWEsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUVqRCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQVUsQ0FBQztJQUUvRCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNuQixDQUFDLEdBQVMsRUFBRTtZQUNWLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2hCLGNBQWMsQ0FBQyxNQUFNLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDekQ7UUFDSCxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUM7SUFDUCxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBbUIsRUFBRSxFQUFFO1FBQzdELE1BQU0sSUFBSSxHQUFHLEdBQVMsRUFBRTtZQUN0QixHQUFHLENBQUMsS0FBSyxDQUFDLFFB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QyxDQUFDLGdHQUFnRztjQUMvRiw4RkFBOEYsQ0FBQyxDQUMvRjtRQUNOLGlDQUNHLENBQUMsQ0FBQywrRUFBK0UsQ0FBQyxDQUMvRTtRQUNOLG9CQUFDLG9CQUFPLENBQUMsTUFBTSxJQUNiLE9BQU8sRUFBRSxlQUFlLEVBQ3hCLE9BQU8sRUFBRSxjQUFjLElBRXRCLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FDSixDQUNiLENBQ1AsQ0FBQztBQUNKLENBQUM7QUFRRCxTQUFTLGtCQUFrQixDQUFDLFFBQStDO0lBQ3pFLE9BQU87UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFBLDBCQUFnQixFQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3ZFLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyB0eXBlcywgdG9vbHRpcCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgQWxlcnQgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0ICogYXMgUmVkdXggZnJvbSAncmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgZm9yY2VSZWZyZXNoIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IHsgVGh1bmtEaXNwYXRjaCB9IGZyb20gJ3JlZHV4LXRodW5rJztcclxuXHJcbmltcG9ydCB7IHNldFBsYXllclByb2ZpbGUgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBnZXRPd25HYW1lVmVyc2lvbjogKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+IFByb21pc2U8c3RyaW5nPjtcclxuICByZWFkU3RvcmVkTE86IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IFByb21pc2U8dm9pZD47XHJcbiAgaW5zdGFsbExTTGliOiAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcclxuICBnZXRMYXRlc3RMU0xpYk1vZDogKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gdHlwZXMuSU1vZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XHJcbiAgb25TZXRQcm9maWxlOiAocHJvZmlsZU5hbWU6IHN0cmluZykgPT4gdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IElCYXNlUHJvcHMpIHtcclxuICBjb25zdCB7IGFwaSwgZ2V0T3duR2FtZVZlcnNpb24sIHJlYWRTdG9yZWRMTyxcclxuICAgIGluc3RhbGxMU0xpYiwgZ2V0TGF0ZXN0TFNMaWJNb2QgfSA9IHByb3BzO1xyXG5cclxuICBjb25zdCBjdXJyZW50UHJvZmlsZSA9IHVzZVNlbGVjdG9yKChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PlxyXG4gICAgc3RhdGUuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddPy5wbGF5ZXJQcm9maWxlKTtcclxuXHJcbiAgY29uc3QgW2dhbWVWZXJzaW9uLCBzZXRHYW1lVmVyc2lvbl0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KCk7XHJcblxyXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICBpZiAoIWdhbWVWZXJzaW9uKSB7XHJcbiAgICAgICAgc2V0R2FtZVZlcnNpb24oYXdhaXQgZ2V0T3duR2FtZVZlcnNpb24oYXBpLmdldFN0YXRlKCkpKTtcclxuICAgICAgfVxyXG4gICAgfSkoKTtcclxuICB9LCBbZ2FtZVZlcnNpb24sIHNldEdhbWVWZXJzaW9uXSk7XHJcblxyXG4gIGNvbnN0IG9uU2V0UHJvZmlsZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBpbXBsID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlTmFtZSkpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhhcGkpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxyXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGZvcmNlUmVmcmVzaChhcGkpO1xyXG4gICAgfTtcclxuICAgIGltcGwoKTtcclxuICB9LCBbYXBpXSk7XHJcblxyXG4gIGNvbnN0IGlzTHNMaWJJbnN0YWxsZWQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XHJcbiAgICByZXR1cm4gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKSAhPT0gdW5kZWZpbmVkO1xyXG4gIH0sIFthcGldKTtcclxuXHJcbiAgY29uc3Qgb25JbnN0YWxsTFNMaWIgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XHJcbiAgICBpbnN0YWxsTFNMaWIoYXBpLCBHQU1FX0lEKTtcclxuICB9LCBbYXBpXSk7XHJcblxyXG4gIGlmICghZ2FtZVZlcnNpb24pIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxJbmZvUGFuZWxcclxuICAgICAgdD17YXBpLnRyYW5zbGF0ZX1cclxuICAgICAgZ2FtZVZlcnNpb249e2dhbWVWZXJzaW9ufVxyXG4gICAgICBjdXJyZW50UHJvZmlsZT17Y3VycmVudFByb2ZpbGV9XHJcbiAgICAgIG9uU2V0UGxheWVyUHJvZmlsZT17b25TZXRQcm9maWxlfVxyXG4gICAgICBpc0xzTGliSW5zdGFsbGVkPXtpc0xzTGliSW5zdGFsbGVkfVxyXG4gICAgICBvbkluc3RhbGxMU0xpYj17b25JbnN0YWxsTFNMaWJ9XHJcbiAgICAvPlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbChwcm9wczogYW55KSB7XHJcbiAgY29uc3QgeyB0LCBvbkluc3RhbGxMU0xpYiwgaXNMc0xpYkluc3RhbGxlZCB9ID0gcHJvcHM7XHJcblxyXG4gIHJldHVybiBpc0xzTGliSW5zdGFsbGVkKCkgPyAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzEycHgnLCBtYXJnaW5SaWdodDogJzE2cHgnIH19PlxyXG4gICAgICA8QWxlcnQgYnNTdHlsZT0nd2FybmluZycgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnOHB4JyB9fT5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAge3QoYFZlcnNpb24gMC4zIG9mIHRoZSBleHRlbnNpb24gaXMgYWxtb3N0IGEgY29tcGxldGUgcmV3cml0ZSBvZiBsb2FkIG9yZGVyIGFuZCBtaWdyYXRpb24gZnJvbSBwcmV2aW91cyB2ZXJzaW9ucyBtYXkgY2F1c2UgaXNzdWVzLlxyXG4gICAgICAgIEEgUHVyZ2UgdGhlbiBhIERlcGxveSB3aWxsIG5vcm1hbGx5IHNvbHZlIGFsbCBpc3N1ZXMgYnV0IHBsZWFzZSBtYWtlIGEgYmFja3VwIGZpcnN0IHVzaW5nIEV4cG9ydC4uLiBhcyB0aGUgbG9hZCBvcmRlciB3aWxsIGJlIHJlc2V0LmApfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICB7dChgQSBiYWNrdXAgaXMgbWFkZSBvZiB0aGUgZ2FtZSdzIG1vZHNldHRpbmdzLmxzeCBmaWxlIGJlZm9yZSBhbnl0aGluZyBpcyBjaGFuZ2VkLlxyXG4gICAgICAgIFRoaXMgY2FuIGJlIGZvdW5kIGF0ICVBUFBEQVRBJVxcXFxMb2NhbFxcXFxMYXJpYW4gU3R1ZGlvc1xcXFxCYWxkdXIncyBHYXRlIDNcXFxcUGxheWVyUHJvZmlsZXNcXFxcUHVibGljXFxcXG1vZHNldHRpbmdzLmxzeC5iYWNrdXBgKX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9BbGVydD5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgRHJhZyBhbmQgRHJvcCBQQUsgZmlsZXMgdG8gcmVvcmRlciBob3cgdGhlIGdhbWUgbG9hZHMgdGhlbS4gUGxlYXNlIG5vdGUsIHNvbWUgbW9kcyBjb250YWluIG11bHRpcGxlIFBBSyBmaWxlcy5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYE1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyBtYXkgaGF2ZSBpbmZvcm1hdGlvbiB0byBkZXRlcm1pbmUgdGhlIGJlc3Qgb3JkZXIuYCl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBTb21lIG1vZHMgbWF5IGJlIGxvY2tlZCBpbiB0aGlzIGxpc3QgYmVjYXVzZSB0aGV5IGFyZSBsb2FkZWQgZGlmZmVyZW50bHkgYnkgdGhlIGdhbWUgYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGxvYWQtb3JkZXJlZCBieSBtb2QgbWFuYWdlcnMuIFxyXG4gICAgICAgIElmIHlvdSBuZWVkIHRvIGRpc2FibGUgc3VjaCBhIG1vZCwgcGxlYXNlIGRvIHNvIGluIFZvcnRleFxcJ3MgTW9kcyBwYWdlLmApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGg0IHN0eWxlPXt7IG1hcmdpbjogMCB9fT5cclxuICAgICAgICB7dCgnSW1wb3J0IGFuZCBFeHBvcnQnKX1cclxuICAgICAgPC9oND5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgSW1wb3J0IGlzIGFuIGV4cGVyaW1lbnRhbCB0b29sIHRvIGhlbHAgbWlncmF0aW9uIGZyb20gYSBnYW1lIGxvYWQgb3JkZXIgKC5sc3ggZmlsZSkgdG8gVm9ydGV4LiBJdCB3b3JrcyBieSBpbXBvcnRpbmcgdGhlIGdhbWUncyBtb2RzZXR0aW5ncyBmaWxlXHJcbiAgICAgICAgYW5kIGF0dGVtcHRzIHRvIG1hdGNoIHVwIG1vZHMgdGhhdCBoYXZlIGJlZW4gaW5zdGFsbGVkIGJ5IFZvcnRleC5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYEV4cG9ydCBjYW4gYmUgdXNlZCB0byBtYW51YWxseSB1cGRhdGUgdGhlIGdhbWUncyBtb2RzZXR0aW5ncy5sc3ggZmlsZSBpZiAnU2V0dGluZ3MgPiBNb2RzID4gQXV0byBleHBvcnQgbG9hZCBvcmRlcicgaXNuJ3Qgc2V0IHRvIGRvIHRoaXMgYXV0b21hdGljYWxseS4gXHJcbiAgICAgICAgSXQgY2FuIGFsc28gYmUgdXNlZCB0byBleHBvcnQgdG8gYSBkaWZmZXJlbnQgZmlsZSBhcyBhIGJhY2t1cC5gKX1cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgPC9kaXY+XHJcbiAgKSA6IChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMTJweCcgfX0+XHJcbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XHJcbiAgICAgICAge3QoJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKX1cclxuICAgICAgPC9oND5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnVG8gdGFrZSBmdWxsIGFkdmFudGFnZSBvZiBWb3J0ZXhcXCdzIEJhbGR1clxccyBHYXRlIDMgbW9kZGluZyBjYXBhYmlsaXRpZXMgc3VjaCBhcyBtYW5hZ2luZyB0aGUgJ1xyXG4gICAgICAgICAgKyAnb3JkZXIgaW4gd2hpY2ggbW9kcyBhcmUgbG9hZGVkIGludG8gdGhlIGdhbWU7IFZvcnRleCByZXF1aXJlcyBhIDNyZCBwYXJ0eSB0b29sIGNhbGxlZCBMU0xpYi4nKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJ1BsZWFzZSBpbnN0YWxsIHRoZSBsaWJyYXJ5IHVzaW5nIHRoZSBidXR0b25zIGJlbG93IHRvIG1hbmFnZSB5b3VyIGxvYWQgb3JkZXIuJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8dG9vbHRpcC5CdXR0b25cclxuICAgICAgICB0b29sdGlwPXsnSW5zdGFsbCBMU0xpYid9XHJcbiAgICAgICAgb25DbGljaz17b25JbnN0YWxsTFNMaWJ9XHJcbiAgICAgID5cclxuICAgICAgICB7dCgnSW5zdGFsbCBMU0xpYicpfVxyXG4gICAgICA8L3Rvb2x0aXAuQnV0dG9uPlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuLy8gZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiBhbnkpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4vLyAgIHJldHVybiB7XHJcbi8vICAgICBjdXJyZW50VGhlbWU6IHN0YXRlLnNldHRpbmdzLmludGVyZmFjZS5jdXJyZW50VGhlbWUsXHJcbi8vICAgfTtcclxuLy8gfVxyXG5cclxuZnVuY3Rpb24gbWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoOiBUaHVua0Rpc3BhdGNoPGFueSwgYW55LCBSZWR1eC5BY3Rpb24+KTogSUFjdGlvblByb3BzIHtcclxuICByZXR1cm4ge1xyXG4gICAgb25TZXRQcm9maWxlOiAocHJvZmlsZTogc3RyaW5nKSA9PiBkaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGUpKSxcclxuICB9O1xyXG59Il19