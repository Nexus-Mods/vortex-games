"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
function Settings() {
    const store = (0, react_redux_1.useStore)();
    const autoExportLoadOrder = (0, react_redux_1.useSelector)((state) => { var _a; return (_a = state.settings['baldursgate3']) === null || _a === void 0 ? void 0 : _a.autoExportLoadOrder; });
    const setUseAutoExportLoadOrderToGame = react_1.default.useCallback((enabled) => {
        console.log(`setAutoExportLoadOrder=${enabled}`);
        store.dispatch((0, actions_1.setAutoExportLoadOrder)(enabled));
    }, []);
    const { t } = (0, react_i18next_1.useTranslation)();
    return (react_1.default.createElement("form", null,
        react_1.default.createElement(react_bootstrap_1.FormGroup, { controlId: 'default-enable' },
            react_1.default.createElement(react_bootstrap_1.Panel, null,
                react_1.default.createElement(react_bootstrap_1.Panel.Body, null,
                    react_1.default.createElement(react_bootstrap_1.ControlLabel, null, t('Baldur\'s Gate 3')),
                    react_1.default.createElement(vortex_api_1.Toggle, { checked: autoExportLoadOrder, onToggle: setUseAutoExportLoadOrderToGame }, t('Auto export load order')),
                    react_1.default.createElement(react_bootstrap_1.HelpBlock, null, t(`If enabled, when Vortex saves it's load order, it will also update the games load order. 
              If disabled, and you wish the game to use your load order, then this will need to be completed 
              manually using the Export to Game button on the load order screen`)))))));
}
exports.default = Settings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQTRFO0FBQzVFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQTJDO0FBQzNDLHVDQUFtRDtBQUVuRCxTQUFTLFFBQVE7SUFFZixNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLG1CQUFtQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQW1CLEVBQUUsRUFBRSxXQUM5RCxPQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsMENBQUUsbUJBQW1CLENBQUEsRUFBQSxDQUFDLENBQUM7SUFFdkQsTUFBTSwrQkFBK0IsR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFO1FBQzdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyx1QkFBSztnQkFDSiw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksUUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBZ0I7b0JBQ3BELDhCQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLG1CQUFtQixFQUM1QixRQUFRLEVBQUUsK0JBQStCLElBRXhDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUNyQjtvQkFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQzs7Z0ZBRStELENBQUMsQ0FDekQsQ0FDRCxDQUNQLENBQ0UsQ0FDUCxDQUNSLENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgQ29udHJvbExhYmVsLCBGb3JtR3JvdXAsIEhlbHBCbG9jaywgUGFuZWwgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyB1c2VTZWxlY3RvciwgdXNlU3RvcmUgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IFRvZ2dsZSwgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgc2V0QXV0b0V4cG9ydExvYWRPcmRlciB9IGZyb20gJy4vYWN0aW9ucyc7XHJcblxyXG5mdW5jdGlvbiBTZXR0aW5ncygpIHtcclxuXHJcbiAgY29uc3Qgc3RvcmUgPSB1c2VTdG9yZSgpO1xyXG5cclxuICBjb25zdCBhdXRvRXhwb3J0TG9hZE9yZGVyID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XHJcbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LmF1dG9FeHBvcnRMb2FkT3JkZXIpO1xyXG5cclxuICBjb25zdCBzZXRVc2VBdXRvRXhwb3J0TG9hZE9yZGVyVG9HYW1lID0gUmVhY3QudXNlQ2FsbGJhY2soKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgIGNvbnNvbGUubG9nKGBzZXRBdXRvRXhwb3J0TG9hZE9yZGVyPSR7ZW5hYmxlZH1gKVxyXG4gICAgc3RvcmUuZGlzcGF0Y2goc2V0QXV0b0V4cG9ydExvYWRPcmRlcihlbmFibGVkKSk7XHJcbiAgfSwgW10pO1xyXG4gIFxyXG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxmb3JtPlxyXG4gICAgICA8Rm9ybUdyb3VwIGNvbnRyb2xJZD0nZGVmYXVsdC1lbmFibGUnPlxyXG4gICAgICAgIDxQYW5lbD5cclxuICAgICAgICAgIDxQYW5lbC5Cb2R5PlxyXG4gICAgICAgICAgICA8Q29udHJvbExhYmVsPnt0KCdCYWxkdXJcXCdzIEdhdGUgMycpfTwvQ29udHJvbExhYmVsPlxyXG4gICAgICAgICAgICA8VG9nZ2xlXHJcbiAgICAgICAgICAgICAgY2hlY2tlZD17YXV0b0V4cG9ydExvYWRPcmRlcn1cclxuICAgICAgICAgICAgICBvblRvZ2dsZT17c2V0VXNlQXV0b0V4cG9ydExvYWRPcmRlclRvR2FtZX1cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIHt0KCdBdXRvIGV4cG9ydCBsb2FkIG9yZGVyJyl9XHJcbiAgICAgICAgICAgIDwvVG9nZ2xlPlxyXG4gICAgICAgICAgICA8SGVscEJsb2NrPlxyXG4gICAgICAgICAgICAgIHt0KGBJZiBlbmFibGVkLCB3aGVuIFZvcnRleCBzYXZlcyBpdCdzIGxvYWQgb3JkZXIsIGl0IHdpbGwgYWxzbyB1cGRhdGUgdGhlIGdhbWVzIGxvYWQgb3JkZXIuIFxyXG4gICAgICAgICAgICAgIElmIGRpc2FibGVkLCBhbmQgeW91IHdpc2ggdGhlIGdhbWUgdG8gdXNlIHlvdXIgbG9hZCBvcmRlciwgdGhlbiB0aGlzIHdpbGwgbmVlZCB0byBiZSBjb21wbGV0ZWQgXHJcbiAgICAgICAgICAgICAgbWFudWFsbHkgdXNpbmcgdGhlIEV4cG9ydCB0byBHYW1lIGJ1dHRvbiBvbiB0aGUgbG9hZCBvcmRlciBzY3JlZW5gKX1cclxuICAgICAgICAgICAgPC9IZWxwQmxvY2s+XHJcbiAgICAgICAgICA8L1BhbmVsLkJvZHk+XHJcbiAgICAgICAgPC9QYW5lbD5cclxuICAgICAgPC9Gb3JtR3JvdXA+XHJcbiAgICA8L2Zvcm0+XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2V0dGluZ3M7XHJcbiJdfQ==