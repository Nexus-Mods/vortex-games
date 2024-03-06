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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5mb1BhbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5mb1BhbmVsLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQiwyQ0FBNEM7QUFFNUMscURBQXdDO0FBQ3hDLDZDQUEwQztBQUcxQyxpQ0FBc0M7QUFHdEMsdUNBQTZDO0FBQzdDLHFDQUFtQztBQWNuQyxTQUFnQixhQUFhLENBQUMsS0FBaUI7SUFDN0MsTUFBTSxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQzFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUU1QyxNQUFNLGNBQWMsR0FBRyxJQUFBLHlCQUFXLEVBQUMsQ0FBQyxLQUFtQixFQUFFLEVBQUUsV0FDekQsT0FBQSxNQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLDBDQUFFLGFBQWEsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUVqRCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQVUsQ0FBQztJQUUvRCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNuQixDQUFDLEdBQVMsRUFBRTtZQUNWLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2hCLGNBQWMsQ0FBQyxNQUFNLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDekQ7UUFDSCxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUM7SUFDUCxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBbUIsRUFBRSxFQUFFO1FBQzdELE1BQU0sSUFBSSxHQUFHLEdBQVMsRUFBRTtZQUN0QixHQUFHLENBQUMsS0FBSyxDQUFDLFFB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QyxDQUFDLGdHQUFnRztjQUMvRiw4RkFBOEYsQ0FBQyxDQUMvRjtRQUNOLGlDQUNHLENBQUMsQ0FBQywrRUFBK0UsQ0FBQyxDQUMvRTtRQUNOLG9CQUFDLG9CQUFPLENBQUMsTUFBTSxJQUNiLE9BQU8sRUFBRSxlQUFlLEVBQ3hCLE9BQU8sRUFBRSxjQUFjLElBRXRCLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FDSixDQUNiLENBQ1AsQ0FBQztBQUNKLENBQUM7QUFRRCxTQUFTLGtCQUFrQixDQUFDLFFBQStDO0lBQ3pFLE9BQU87UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFBLDBCQUFnQixFQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3ZFLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHR5cGVzLCB0b29sdGlwIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEFsZXJ0IH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0ICogYXMgUmVkdXggZnJvbSAncmVkdXgnO1xuXG5pbXBvcnQgeyBmb3JjZVJlZnJlc2ggfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgVGh1bmtEaXNwYXRjaCB9IGZyb20gJ3JlZHV4LXRodW5rJztcblxuaW1wb3J0IHsgc2V0UGxheWVyUHJvZmlsZSB9IGZyb20gJy4vYWN0aW9ucyc7XG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgZ2V0T3duR2FtZVZlcnNpb246IChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIHJlYWRTdG9yZWRMTzogKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgaW5zdGFsbExTTGliOiAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0TGF0ZXN0TFNMaWJNb2Q6IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHR5cGVzLklNb2Q7XG59XG5cbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xuICBvblNldFByb2ZpbGU6IChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gSW5mb1BhbmVsV3JhcChwcm9wczogSUJhc2VQcm9wcykge1xuICBjb25zdCB7IGFwaSwgZ2V0T3duR2FtZVZlcnNpb24sIHJlYWRTdG9yZWRMTyxcbiAgICBpbnN0YWxsTFNMaWIsIGdldExhdGVzdExTTGliTW9kIH0gPSBwcm9wcztcblxuICBjb25zdCBjdXJyZW50UHJvZmlsZSA9IHVzZVNlbGVjdG9yKChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PlxuICAgIHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXT8ucGxheWVyUHJvZmlsZSk7XG5cbiAgY29uc3QgW2dhbWVWZXJzaW9uLCBzZXRHYW1lVmVyc2lvbl0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCFnYW1lVmVyc2lvbikge1xuICAgICAgICBzZXRHYW1lVmVyc2lvbihhd2FpdCBnZXRPd25HYW1lVmVyc2lvbihhcGkuZ2V0U3RhdGUoKSkpO1xuICAgICAgfVxuICAgIH0pKCk7XG4gIH0sIFtnYW1lVmVyc2lvbiwgc2V0R2FtZVZlcnNpb25dKTtcblxuICBjb25zdCBvblNldFByb2ZpbGUgPSBSZWFjdC51c2VDYWxsYmFjaygocHJvZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGltcGwgPSBhc3luYyAoKSA9PiB7XG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlTmFtZSkpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZvcmNlUmVmcmVzaChhcGkpO1xuICAgIH07XG4gICAgaW1wbCgpO1xuICB9LCBbYXBpXSk7XG5cbiAgY29uc3QgaXNMc0xpYkluc3RhbGxlZCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICByZXR1cm4gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKSAhPT0gdW5kZWZpbmVkO1xuICB9LCBbYXBpXSk7XG5cbiAgY29uc3Qgb25JbnN0YWxsTFNMaWIgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaW5zdGFsbExTTGliKGFwaSwgR0FNRV9JRCk7XG4gIH0sIFthcGldKTtcblxuICBpZiAoIWdhbWVWZXJzaW9uKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxJbmZvUGFuZWxcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XG4gICAgICBnYW1lVmVyc2lvbj17Z2FtZVZlcnNpb259XG4gICAgICBjdXJyZW50UHJvZmlsZT17Y3VycmVudFByb2ZpbGV9XG4gICAgICBvblNldFBsYXllclByb2ZpbGU9e29uU2V0UHJvZmlsZX1cbiAgICAgIGlzTHNMaWJJbnN0YWxsZWQ9e2lzTHNMaWJJbnN0YWxsZWR9XG4gICAgICBvbkluc3RhbGxMU0xpYj17b25JbnN0YWxsTFNMaWJ9XG4gICAgLz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzOiBhbnkpIHtcbiAgY29uc3QgeyB0LCBvbkluc3RhbGxMU0xpYiwgaXNMc0xpYkluc3RhbGxlZCB9ID0gcHJvcHM7XG5cbiAgcmV0dXJuIGlzTHNMaWJJbnN0YWxsZWQoKSA/IChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzEycHgnLCBtYXJnaW5SaWdodDogJzE2cHgnIH19PlxuICAgICAgPEFsZXJ0IGJzU3R5bGU9J3dhcm5pbmcnIHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzhweCcgfX0+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAge3QoYFZlcnNpb24gMC4zIG9mIHRoZSBleHRlbnNpb24gaXMgYWxtb3N0IGEgY29tcGxldGUgcmV3cml0ZSBvZiBsb2FkIG9yZGVyIGFuZCBtaWdyYXRpb24gZnJvbSBwcmV2aW91cyB2ZXJzaW9ucyBtYXkgY2F1c2UgaXNzdWVzLlxuICAgICAgICBBIFB1cmdlIHRoZW4gYSBEZXBsb3kgd2lsbCBub3JtYWxseSBzb2x2ZSBhbGwgaXNzdWVzIGJ1dCBwbGVhc2UgbWFrZSBhIGJhY2t1cCBmaXJzdCB1c2luZyBFeHBvcnQuLi4gYXMgdGhlIGxvYWQgb3JkZXIgd2lsbCBiZSByZXNldC5gKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAge3QoYEEgYmFja3VwIGlzIG1hZGUgb2YgdGhlIGdhbWUncyBtb2RzZXR0aW5ncy5sc3ggZmlsZSBiZWZvcmUgYW55dGhpbmcgaXMgY2hhbmdlZC5cbiAgICAgICAgVGhpcyBjYW4gYmUgZm91bmQgYXQgJUFQUERBVEElXFxcXExvY2FsXFxcXExhcmlhbiBTdHVkaW9zXFxcXEJhbGR1cidzIEdhdGUgM1xcXFxQbGF5ZXJQcm9maWxlc1xcXFxQdWJsaWNcXFxcbW9kc2V0dGluZ3MubHN4LmJhY2t1cGApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvQWxlcnQ+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dChgRHJhZyBhbmQgRHJvcCBQQUsgZmlsZXMgdG8gcmVvcmRlciBob3cgdGhlIGdhbWUgbG9hZHMgdGhlbS4gUGxlYXNlIG5vdGUsIHNvbWUgbW9kcyBjb250YWluIG11bHRpcGxlIFBBSyBmaWxlcy5gKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoYE1vZCBkZXNjcmlwdGlvbnMgZnJvbSBtb2QgYXV0aG9ycyBtYXkgaGF2ZSBpbmZvcm1hdGlvbiB0byBkZXRlcm1pbmUgdGhlIGJlc3Qgb3JkZXIuYCl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBTb21lIG1vZHMgbWF5IGJlIGxvY2tlZCBpbiB0aGlzIGxpc3QgYmVjYXVzZSB0aGV5IGFyZSBsb2FkZWQgZGlmZmVyZW50bHkgYnkgdGhlIGdhbWUgYW5kIGNhbiB0aGVyZWZvcmUgbm90IGJlIGxvYWQtb3JkZXJlZCBieSBtb2QgbWFuYWdlcnMuIFxuICAgICAgICBJZiB5b3UgbmVlZCB0byBkaXNhYmxlIHN1Y2ggYSBtb2QsIHBsZWFzZSBkbyBzbyBpbiBWb3J0ZXhcXCdzIE1vZHMgcGFnZS5gKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGg0IHN0eWxlPXt7IG1hcmdpbjogMCB9fT5cbiAgICAgICAge3QoJ0ltcG9ydCBhbmQgRXhwb3J0Jyl9XG4gICAgICA8L2g0PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoYEltcG9ydCBpcyBhbiBleHBlcmltZW50YWwgdG9vbCB0byBoZWxwIG1pZ3JhdGlvbiBmcm9tIGEgZ2FtZSBsb2FkIG9yZGVyICgubHN4IGZpbGUpIHRvIFZvcnRleC4gSXQgd29ya3MgYnkgaW1wb3J0aW5nIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MgZmlsZVxuICAgICAgICBhbmQgYXR0ZW1wdHMgdG8gbWF0Y2ggdXAgbW9kcyB0aGF0IGhhdmUgYmVlbiBpbnN0YWxsZWQgYnkgVm9ydGV4LmApfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dChgRXhwb3J0IGNhbiBiZSB1c2VkIHRvIG1hbnVhbGx5IHVwZGF0ZSB0aGUgZ2FtZSdzIG1vZHNldHRpbmdzLmxzeCBmaWxlIGlmICdTZXR0aW5ncyA+IE1vZHMgPiBBdXRvIGV4cG9ydCBsb2FkIG9yZGVyJyBpc24ndCBzZXQgdG8gZG8gdGhpcyBhdXRvbWF0aWNhbGx5LiBcbiAgICAgICAgSXQgY2FuIGFsc28gYmUgdXNlZCB0byBleHBvcnQgdG8gYSBkaWZmZXJlbnQgZmlsZSBhcyBhIGJhY2t1cC5gKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgPC9kaXY+XG4gICkgOiAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICcxMnB4JyB9fT5cbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XG4gICAgICAgIHt0KCdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyl9XG4gICAgICA8L2g0PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoJ1RvIHRha2UgZnVsbCBhZHZhbnRhZ2Ugb2YgVm9ydGV4XFwncyBCYWxkdXJcXHMgR2F0ZSAzIG1vZGRpbmcgY2FwYWJpbGl0aWVzIHN1Y2ggYXMgbWFuYWdpbmcgdGhlICdcbiAgICAgICAgICArICdvcmRlciBpbiB3aGljaCBtb2RzIGFyZSBsb2FkZWQgaW50byB0aGUgZ2FtZTsgVm9ydGV4IHJlcXVpcmVzIGEgM3JkIHBhcnR5IHRvb2wgY2FsbGVkIExTTGliLicpfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dCgnUGxlYXNlIGluc3RhbGwgdGhlIGxpYnJhcnkgdXNpbmcgdGhlIGJ1dHRvbnMgYmVsb3cgdG8gbWFuYWdlIHlvdXIgbG9hZCBvcmRlci4nKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPHRvb2x0aXAuQnV0dG9uXG4gICAgICAgIHRvb2x0aXA9eydJbnN0YWxsIExTTGliJ31cbiAgICAgICAgb25DbGljaz17b25JbnN0YWxsTFNMaWJ9XG4gICAgICA+XG4gICAgICAgIHt0KCdJbnN0YWxsIExTTGliJyl9XG4gICAgICA8L3Rvb2x0aXAuQnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBmdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IGFueSk6IElDb25uZWN0ZWRQcm9wcyB7XG4vLyAgIHJldHVybiB7XG4vLyAgICAgY3VycmVudFRoZW1lOiBzdGF0ZS5zZXR0aW5ncy5pbnRlcmZhY2UuY3VycmVudFRoZW1lLFxuLy8gICB9O1xuLy8gfVxuXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IFRodW5rRGlzcGF0Y2g8YW55LCBhbnksIFJlZHV4LkFjdGlvbj4pOiBJQWN0aW9uUHJvcHMge1xuICByZXR1cm4ge1xuICAgIG9uU2V0UHJvZmlsZTogKHByb2ZpbGU6IHN0cmluZykgPT4gZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlKSksXG4gIH07XG59Il19