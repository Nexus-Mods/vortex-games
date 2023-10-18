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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQTRFO0FBQzVFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQTJDO0FBQzNDLHVDQUFtRDtBQUVuRCxTQUFTLFFBQVE7SUFFZixNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLG1CQUFtQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQW1CLEVBQUUsRUFBRSxXQUM5RCxPQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsMENBQUUsbUJBQW1CLENBQUEsRUFBQSxDQUFDLENBQUM7SUFFdkQsTUFBTSwrQkFBK0IsR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFO1FBQzdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyx1QkFBSztnQkFDSiw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksUUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBZ0I7b0JBQ3BELDhCQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLG1CQUFtQixFQUM1QixRQUFRLEVBQUUsK0JBQStCLElBRXhDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUNyQjtvQkFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQzs7Z0ZBRStELENBQUMsQ0FDekQsQ0FDRCxDQUNQLENBQ0UsQ0FDUCxDQUNSLENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IENvbnRyb2xMYWJlbCwgRm9ybUdyb3VwLCBIZWxwQmxvY2ssIFBhbmVsIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RvciwgdXNlU3RvcmUgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgeyBUb2dnbGUsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBzZXRBdXRvRXhwb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9hY3Rpb25zJztcblxuZnVuY3Rpb24gU2V0dGluZ3MoKSB7XG5cbiAgY29uc3Qgc3RvcmUgPSB1c2VTdG9yZSgpO1xuXG4gIGNvbnN0IGF1dG9FeHBvcnRMb2FkT3JkZXIgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT5cbiAgICBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10/LmF1dG9FeHBvcnRMb2FkT3JkZXIpO1xuXG4gIGNvbnN0IHNldFVzZUF1dG9FeHBvcnRMb2FkT3JkZXJUb0dhbWUgPSBSZWFjdC51c2VDYWxsYmFjaygoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xuICAgIGNvbnNvbGUubG9nKGBzZXRBdXRvRXhwb3J0TG9hZE9yZGVyPSR7ZW5hYmxlZH1gKVxuICAgIHN0b3JlLmRpc3BhdGNoKHNldEF1dG9FeHBvcnRMb2FkT3JkZXIoZW5hYmxlZCkpO1xuICB9LCBbXSk7XG4gIFxuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8Zm9ybT5cbiAgICAgIDxGb3JtR3JvdXAgY29udHJvbElkPSdkZWZhdWx0LWVuYWJsZSc+XG4gICAgICAgIDxQYW5lbD5cbiAgICAgICAgICA8UGFuZWwuQm9keT5cbiAgICAgICAgICAgIDxDb250cm9sTGFiZWw+e3QoJ0JhbGR1clxcJ3MgR2F0ZSAzJyl9PC9Db250cm9sTGFiZWw+XG4gICAgICAgICAgICA8VG9nZ2xlXG4gICAgICAgICAgICAgIGNoZWNrZWQ9e2F1dG9FeHBvcnRMb2FkT3JkZXJ9XG4gICAgICAgICAgICAgIG9uVG9nZ2xlPXtzZXRVc2VBdXRvRXhwb3J0TG9hZE9yZGVyVG9HYW1lfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7dCgnQXV0byBleHBvcnQgbG9hZCBvcmRlcicpfVxuICAgICAgICAgICAgPC9Ub2dnbGU+XG4gICAgICAgICAgICA8SGVscEJsb2NrPlxuICAgICAgICAgICAgICB7dChgSWYgZW5hYmxlZCwgd2hlbiBWb3J0ZXggc2F2ZXMgaXQncyBsb2FkIG9yZGVyLCBpdCB3aWxsIGFsc28gdXBkYXRlIHRoZSBnYW1lcyBsb2FkIG9yZGVyLiBcbiAgICAgICAgICAgICAgSWYgZGlzYWJsZWQsIGFuZCB5b3Ugd2lzaCB0aGUgZ2FtZSB0byB1c2UgeW91ciBsb2FkIG9yZGVyLCB0aGVuIHRoaXMgd2lsbCBuZWVkIHRvIGJlIGNvbXBsZXRlZCBcbiAgICAgICAgICAgICAgbWFudWFsbHkgdXNpbmcgdGhlIEV4cG9ydCB0byBHYW1lIGJ1dHRvbiBvbiB0aGUgbG9hZCBvcmRlciBzY3JlZW5gKX1cbiAgICAgICAgICAgIDwvSGVscEJsb2NrPlxuICAgICAgICAgIDwvUGFuZWwuQm9keT5cbiAgICAgICAgPC9QYW5lbD5cbiAgICAgIDwvRm9ybUdyb3VwPlxuICAgIDwvZm9ybT5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgU2V0dGluZ3M7XG4iXX0=