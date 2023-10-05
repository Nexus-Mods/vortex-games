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
                    react_1.default.createElement(vortex_api_1.Toggle, { checked: autoExportLoadOrder, onToggle: setUseAutoExportLoadOrderToGame }, t('Auto export load order to game on deploy')),
                    react_1.default.createElement(react_bootstrap_1.HelpBlock, null, t('If checked, when Vortex deploys mods to the game it will also export the load order. ' +
                        'If it\s not checked and you wish the game to use your load order, then this will need to be completed manually using the buttons on the load order screen')))))));
}
exports.default = Settings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQTRFO0FBQzVFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQTJDO0FBQzNDLHVDQUFtRDtBQUVuRCxTQUFTLFFBQVE7SUFFZixNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLG1CQUFtQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQW1CLEVBQUUsRUFBRSxXQUM5RCxPQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsMENBQUUsbUJBQW1CLENBQUEsRUFBQSxDQUFDLENBQUM7SUFFdkQsTUFBTSwrQkFBK0IsR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFO1FBQzdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyx1QkFBSztnQkFDSiw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksUUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBZ0I7b0JBQ3BELDhCQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLG1CQUFtQixFQUM1QixRQUFRLEVBQUUsK0JBQStCLElBRXhDLENBQUMsQ0FBQywwQ0FBMEMsQ0FBQyxDQUN2QztvQkFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQyx1RkFBdUY7d0JBQzFGLDJKQUEySixDQUFDLENBQ2xKLENBQ0QsQ0FDUCxDQUNFLENBQ1AsQ0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBDb250cm9sTGFiZWwsIEZvcm1Hcm91cCwgSGVscEJsb2NrLCBQYW5lbCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgdXNlU2VsZWN0b3IsIHVzZVN0b3JlIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0IHsgVG9nZ2xlLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgc2V0QXV0b0V4cG9ydExvYWRPcmRlciB9IGZyb20gJy4vYWN0aW9ucyc7XG5cbmZ1bmN0aW9uIFNldHRpbmdzKCkge1xuXG4gIGNvbnN0IHN0b3JlID0gdXNlU3RvcmUoKTtcblxuICBjb25zdCBhdXRvRXhwb3J0TG9hZE9yZGVyID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XG4gICAgc3RhdGUuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddPy5hdXRvRXhwb3J0TG9hZE9yZGVyKTtcblxuICBjb25zdCBzZXRVc2VBdXRvRXhwb3J0TG9hZE9yZGVyVG9HYW1lID0gUmVhY3QudXNlQ2FsbGJhY2soKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcbiAgICBjb25zb2xlLmxvZyhgc2V0QXV0b0V4cG9ydExvYWRPcmRlcj0ke2VuYWJsZWR9YClcbiAgICBzdG9yZS5kaXNwYXRjaChzZXRBdXRvRXhwb3J0TG9hZE9yZGVyKGVuYWJsZWQpKTtcbiAgfSwgW10pO1xuICBcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGZvcm0+XG4gICAgICA8Rm9ybUdyb3VwIGNvbnRyb2xJZD0nZGVmYXVsdC1lbmFibGUnPlxuICAgICAgICA8UGFuZWw+XG4gICAgICAgICAgPFBhbmVsLkJvZHk+XG4gICAgICAgICAgICA8Q29udHJvbExhYmVsPnt0KCdCYWxkdXJcXCdzIEdhdGUgMycpfTwvQ29udHJvbExhYmVsPlxuICAgICAgICAgICAgPFRvZ2dsZVxuICAgICAgICAgICAgICBjaGVja2VkPXthdXRvRXhwb3J0TG9hZE9yZGVyfVxuICAgICAgICAgICAgICBvblRvZ2dsZT17c2V0VXNlQXV0b0V4cG9ydExvYWRPcmRlclRvR2FtZX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3QoJ0F1dG8gZXhwb3J0IGxvYWQgb3JkZXIgdG8gZ2FtZSBvbiBkZXBsb3knKX1cbiAgICAgICAgICAgIDwvVG9nZ2xlPlxuICAgICAgICAgICAgPEhlbHBCbG9jaz5cbiAgICAgICAgICAgICAge3QoJ0lmIGNoZWNrZWQsIHdoZW4gVm9ydGV4IGRlcGxveXMgbW9kcyB0byB0aGUgZ2FtZSBpdCB3aWxsIGFsc28gZXhwb3J0IHRoZSBsb2FkIG9yZGVyLiAnICtcbiAgICAgICAgICAgICAgJ0lmIGl0XFxzIG5vdCBjaGVja2VkIGFuZCB5b3Ugd2lzaCB0aGUgZ2FtZSB0byB1c2UgeW91ciBsb2FkIG9yZGVyLCB0aGVuIHRoaXMgd2lsbCBuZWVkIHRvIGJlIGNvbXBsZXRlZCBtYW51YWxseSB1c2luZyB0aGUgYnV0dG9ucyBvbiB0aGUgbG9hZCBvcmRlciBzY3JlZW4nKX1cbiAgICAgICAgICAgIDwvSGVscEJsb2NrPlxuICAgICAgICAgIDwvUGFuZWwuQm9keT5cbiAgICAgICAgPC9QYW5lbD5cbiAgICAgIDwvRm9ybUdyb3VwPlxuICAgIDwvZm9ybT5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgU2V0dGluZ3M7XG4iXX0=