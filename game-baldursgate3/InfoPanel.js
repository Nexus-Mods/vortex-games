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
        installLSLib(api, GAME_ID);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5mb1BhbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5mb1BhbmVsLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQiwyQ0FBNEM7QUFFNUMscURBQXdDO0FBQ3hDLDZDQUEwQztBQUcxQyxpQ0FBc0M7QUFHdEMsdUNBQTZDO0FBYzdDLFNBQWdCLGFBQWEsQ0FBQyxLQUFpQjtJQUM3QyxNQUFNLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFDMUMsWUFBWSxFQUFFLGlCQUFpQixFQUFFLEdBQUcsS0FBSyxDQUFDO0lBRTVDLE1BQU0sY0FBYyxHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQW1CLEVBQUUsRUFBRSxXQUN6RCxPQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsMENBQUUsYUFBYSxDQUFBLEVBQUEsQ0FBQyxDQUFDO0lBRWpELE1BQU0sQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBVSxDQUFDO0lBRS9ELEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ25CLENBQUMsR0FBUyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDaEIsY0FBYyxDQUFDLE1BQU0saUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN6RDtRQUNILENBQUMsQ0FBQSxDQUFDLEVBQUUsQ0FBQztJQUNQLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBRWxDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFtQixFQUFFLEVBQUU7UUFDN0QsTUFBTSxJQUFJLEdBQUcsR0FBUyxFQUFFO1lBQ3RCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEs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Y0FDL0YsOEZBQThGLENBQUMsQ0FDL0Y7UUFDTixpQ0FDRyxDQUFDLENBQUMsK0VBQStFLENBQUMsQ0FDL0U7UUFDTixvQkFBQyxvQkFBTyxDQUFDLE1BQU0sSUFDYixPQUFPLEVBQUUsZUFBZSxFQUN4QixPQUFPLEVBQUUsY0FBYyxJQUV0QixDQUFDLENBQUMsZUFBZSxDQUFDLENBQ0osQ0FDYixDQUNQLENBQUM7QUFDSixDQUFDO0FBUUQsU0FBUyxrQkFBa0IsQ0FBQyxRQUErQztJQUN6RSxPQUFPO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBZSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBQSwwQkFBZ0IsRUFBQyxPQUFPLENBQUMsQ0FBQztLQUN2RSxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgdHlwZXMsIHRvb2x0aXAgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEFsZXJ0IH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCAqIGFzIFJlZHV4IGZyb20gJ3JlZHV4JztcclxuXHJcbmltcG9ydCB7IGZvcmNlUmVmcmVzaCB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7IFRodW5rRGlzcGF0Y2ggfSBmcm9tICdyZWR1eC10aHVuayc7XHJcblxyXG5pbXBvcnQgeyBzZXRQbGF5ZXJQcm9maWxlIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgZ2V0T3duR2FtZVZlcnNpb246IChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PiBQcm9taXNlPHN0cmluZz47XHJcbiAgcmVhZFN0b3JlZExPOiAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBQcm9taXNlPHZvaWQ+O1xyXG4gIGluc3RhbGxMU0xpYjogKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XHJcbiAgZ2V0TGF0ZXN0TFNMaWJNb2Q6IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHR5cGVzLklNb2Q7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xyXG4gIG9uU2V0UHJvZmlsZTogKHByb2ZpbGVOYW1lOiBzdHJpbmcpID0+IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJbmZvUGFuZWxXcmFwKHByb3BzOiBJQmFzZVByb3BzKSB7XHJcbiAgY29uc3QgeyBhcGksIGdldE93bkdhbWVWZXJzaW9uLCByZWFkU3RvcmVkTE8sXHJcbiAgICBpbnN0YWxsTFNMaWIsIGdldExhdGVzdExTTGliTW9kIH0gPSBwcm9wcztcclxuXHJcbiAgY29uc3QgY3VycmVudFByb2ZpbGUgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT5cclxuICAgIHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXT8ucGxheWVyUHJvZmlsZSk7XHJcblxyXG4gIGNvbnN0IFtnYW1lVmVyc2lvbiwgc2V0R2FtZVZlcnNpb25dID0gUmVhY3QudXNlU3RhdGU8c3RyaW5nPigpO1xyXG5cclxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKCFnYW1lVmVyc2lvbikge1xyXG4gICAgICAgIHNldEdhbWVWZXJzaW9uKGF3YWl0IGdldE93bkdhbWVWZXJzaW9uKGFwaS5nZXRTdGF0ZSgpKSk7XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcbiAgfSwgW2dhbWVWZXJzaW9uLCBzZXRHYW1lVmVyc2lvbl0pO1xyXG5cclxuICBjb25zdCBvblNldFByb2ZpbGUgPSBSZWFjdC51c2VDYWxsYmFjaygocHJvZmlsZU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3QgaW1wbCA9IGFzeW5jICgpID0+IHtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFBsYXllclByb2ZpbGUocHJvZmlsZU5hbWUpKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xyXG4gICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcclxuICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBmb3JjZVJlZnJlc2goYXBpKTtcclxuICAgIH07XHJcbiAgICBpbXBsKCk7XHJcbiAgfSwgW2FwaV0pO1xyXG5cclxuICBjb25zdCBpc0xzTGliSW5zdGFsbGVkID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xyXG4gICAgcmV0dXJuIGdldExhdGVzdExTTGliTW9kKGFwaSkgIT09IHVuZGVmaW5lZDtcclxuICB9LCBbYXBpXSk7XHJcblxyXG4gIGNvbnN0IG9uSW5zdGFsbExTTGliID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xyXG4gICAgaW5zdGFsbExTTGliKGFwaSwgR0FNRV9JRCk7XHJcbiAgfSwgW2FwaV0pO1xyXG5cclxuICBpZiAoIWdhbWVWZXJzaW9uKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8SW5mb1BhbmVsXHJcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XHJcbiAgICAgIGdhbWVWZXJzaW9uPXtnYW1lVmVyc2lvbn1cclxuICAgICAgY3VycmVudFByb2ZpbGU9e2N1cnJlbnRQcm9maWxlfVxyXG4gICAgICBvblNldFBsYXllclByb2ZpbGU9e29uU2V0UHJvZmlsZX1cclxuICAgICAgaXNMc0xpYkluc3RhbGxlZD17aXNMc0xpYkluc3RhbGxlZH1cclxuICAgICAgb25JbnN0YWxsTFNMaWI9e29uSW5zdGFsbExTTGlifVxyXG4gICAgLz5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHM6IGFueSkge1xyXG4gIGNvbnN0IHsgdCwgb25JbnN0YWxsTFNMaWIsIGlzTHNMaWJJbnN0YWxsZWQgfSA9IHByb3BzO1xyXG5cclxuICByZXR1cm4gaXNMc0xpYkluc3RhbGxlZCgpID8gKFxyXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICcxMnB4JywgbWFyZ2luUmlnaHQ6ICcxNnB4JyB9fT5cclxuICAgICAgPEFsZXJ0IGJzU3R5bGU9J3dhcm5pbmcnIHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzhweCcgfX0+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIHt0KGBWZXJzaW9uIDAuMyBvZiB0aGUgZXh0ZW5zaW9uIGlzIGFsbW9zdCBhIGNvbXBsZXRlIHJld3JpdGUgb2YgbG9hZCBvcmRlciBhbmQgbWlncmF0aW9uIGZyb20gcHJldmlvdXMgdmVyc2lvbnMgbWF5IGNhdXNlIGlzc3Vlcy5cclxuICAgICAgICBBIFB1cmdlIHRoZW4gYSBEZXBsb3kgd2lsbCBub3JtYWxseSBzb2x2ZSBhbGwgaXNzdWVzIGJ1dCBwbGVhc2UgbWFrZSBhIGJhY2t1cCBmaXJzdCB1c2luZyBFeHBvcnQuLi4gYXMgdGhlIGxvYWQgb3JkZXIgd2lsbCBiZSByZXNldC5gKX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAge3QoYEEgYmFja3VwIGlzIG1hZGUgb2YgdGhlIGdhbWUncyBtb2RzZXR0aW5ncy5sc3ggZmlsZSBiZWZvcmUgYW55dGhpbmcgaXMgY2hhbmdlZC5cclxuICAgICAgICBUaGlzIGNhbiBiZSBmb3VuZCBhdCAlQVBQREFUQSVcXFxcTG9jYWxcXFxcTGFyaWFuIFN0dWRpb3NcXFxcQmFsZHVyJ3MgR2F0ZSAzXFxcXFBsYXllclByb2ZpbGVzXFxcXFB1YmxpY1xcXFxtb2RzZXR0aW5ncy5sc3guYmFja3VwYCl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvQWxlcnQ+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYERyYWcgYW5kIERyb3AgUEFLIGZpbGVzIHRvIHJlb3JkZXIgaG93IHRoZSBnYW1lIGxvYWRzIHRoZW0uIFBsZWFzZSBub3RlLCBzb21lIG1vZHMgY29udGFpbiBtdWx0aXBsZSBQQUsgZmlsZXMuYCl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBNb2QgZGVzY3JpcHRpb25zIGZyb20gbW9kIGF1dGhvcnMgbWF5IGhhdmUgaW5mb3JtYXRpb24gdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IG9yZGVyLmApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dChgU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBnYW1lIGFuZCBjYW4gdGhlcmVmb3JlIG5vdCBiZSBsb2FkLW9yZGVyZWQgYnkgbW9kIG1hbmFnZXJzLiBcclxuICAgICAgICBJZiB5b3UgbmVlZCB0byBkaXNhYmxlIHN1Y2ggYSBtb2QsIHBsZWFzZSBkbyBzbyBpbiBWb3J0ZXhcXCdzIE1vZHMgcGFnZS5gKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XHJcbiAgICAgICAge3QoJ0ltcG9ydCBhbmQgRXhwb3J0Jyl9XHJcbiAgICAgIDwvaDQ+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoYEltcG9ydCBpcyBhbiBleHBlcmltZW50YWwgdG9vbCB0byBoZWxwIG1pZ3JhdGlvbiBmcm9tIGEgZ2FtZSBsb2FkIG9yZGVyICgubHN4IGZpbGUpIHRvIFZvcnRleC4gSXQgd29ya3MgYnkgaW1wb3J0aW5nIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MgZmlsZVxyXG4gICAgICAgIGFuZCBhdHRlbXB0cyB0byBtYXRjaCB1cCBtb2RzIHRoYXQgaGF2ZSBiZWVuIGluc3RhbGxlZCBieSBWb3J0ZXguYCl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KGBFeHBvcnQgY2FuIGJlIHVzZWQgdG8gbWFudWFsbHkgdXBkYXRlIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MubHN4IGZpbGUgaWYgJ1NldHRpbmdzID4gTW9kcyA+IEF1dG8gZXhwb3J0IGxvYWQgb3JkZXInIGlzbid0IHNldCB0byBkbyB0aGlzIGF1dG9tYXRpY2FsbHkuIFxyXG4gICAgICAgIEl0IGNhbiBhbHNvIGJlIHVzZWQgdG8gZXhwb3J0IHRvIGEgZGlmZmVyZW50IGZpbGUgYXMgYSBiYWNrdXAuYCl9XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgIDwvZGl2PlxyXG4gICkgOiAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzEycHgnIH19PlxyXG4gICAgICA8aDQgc3R5bGU9e3sgbWFyZ2luOiAwIH19PlxyXG4gICAgICAgIHt0KCdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyl9XHJcbiAgICAgIDwvaDQ+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJ1RvIHRha2UgZnVsbCBhZHZhbnRhZ2Ugb2YgVm9ydGV4XFwncyBCYWxkdXJcXHMgR2F0ZSAzIG1vZGRpbmcgY2FwYWJpbGl0aWVzIHN1Y2ggYXMgbWFuYWdpbmcgdGhlICdcclxuICAgICAgICAgICsgJ29yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCBpbnRvIHRoZSBnYW1lOyBWb3J0ZXggcmVxdWlyZXMgYSAzcmQgcGFydHkgdG9vbCBjYWxsZWQgTFNMaWIuJyl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIHt0KCdQbGVhc2UgaW5zdGFsbCB0aGUgbGlicmFyeSB1c2luZyB0aGUgYnV0dG9ucyBiZWxvdyB0byBtYW5hZ2UgeW91ciBsb2FkIG9yZGVyLicpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPHRvb2x0aXAuQnV0dG9uXHJcbiAgICAgICAgdG9vbHRpcD17J0luc3RhbGwgTFNMaWInfVxyXG4gICAgICAgIG9uQ2xpY2s9e29uSW5zdGFsbExTTGlifVxyXG4gICAgICA+XHJcbiAgICAgICAge3QoJ0luc3RhbGwgTFNMaWInKX1cclxuICAgICAgPC90b29sdGlwLkJ1dHRvbj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbi8vIGZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogYW55KTogSUNvbm5lY3RlZFByb3BzIHtcclxuLy8gICByZXR1cm4ge1xyXG4vLyAgICAgY3VycmVudFRoZW1lOiBzdGF0ZS5zZXR0aW5ncy5pbnRlcmZhY2UuY3VycmVudFRoZW1lLFxyXG4vLyAgIH07XHJcbi8vIH1cclxuXHJcbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogVGh1bmtEaXNwYXRjaDxhbnksIGFueSwgUmVkdXguQWN0aW9uPik6IElBY3Rpb25Qcm9wcyB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uU2V0UHJvZmlsZTogKHByb2ZpbGU6IHN0cmluZykgPT4gZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlKSksXHJcbiAgfTtcclxufSJdfQ==