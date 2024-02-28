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
    const useRecommendations = (0, react_redux_1.useSelector)((state) => { var _a; return (_a = state.settings['SDV']) === null || _a === void 0 ? void 0 : _a.useRecommendations; });
    const store = (0, react_redux_1.useStore)();
    const setUseRecommendations = react_1.default.useCallback((enabled) => {
        store.dispatch((0, actions_1.setRecommendations)(enabled));
    }, []);
    const { t } = (0, react_i18next_1.useTranslation)();
    return (react_1.default.createElement("form", null,
        react_1.default.createElement(react_bootstrap_1.FormGroup, { controlId: 'default-enable' },
            react_1.default.createElement(react_bootstrap_1.Panel, null,
                react_1.default.createElement(react_bootstrap_1.Panel.Body, null,
                    react_1.default.createElement(react_bootstrap_1.ControlLabel, null, t('Stardew Valley')),
                    react_1.default.createElement(vortex_api_1.Toggle, { checked: useRecommendations, onToggle: setUseRecommendations }, t('Use recommendations from the mod manifests')),
                    react_1.default.createElement(react_bootstrap_1.HelpBlock, null, t('If checked, when you install a mod for Stardew Valley you may get '
                        + 'suggestions for installing further mods, required or recommended by it.'
                        + 'This information could be wrong or incomplete so please carefully '
                        + 'consider before accepting them.')))))));
}
exports.default = Settings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQTRFO0FBQzVFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQW9DO0FBQ3BDLHVDQUErQztBQUUvQyxTQUFTLFFBQVE7SUFDZixNQUFNLGtCQUFrQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLFdBQ3BELE9BQUEsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxrQkFBa0IsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUU3QyxNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLHFCQUFxQixHQUFHLGVBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFnQixFQUFFLEVBQUU7UUFDbkUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLDRCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyx1QkFBSztnQkFDSiw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksUUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBZ0I7b0JBQ2xELDhCQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLGtCQUFrQixFQUMzQixRQUFRLEVBQUUscUJBQXFCLElBRTlCLENBQUMsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUN6QztvQkFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQyxvRUFBb0U7MEJBQ25FLHlFQUF5RTswQkFDekUsb0VBQW9FOzBCQUNwRSxpQ0FBaUMsQ0FBQyxDQUM1QixDQUNELENBQ1AsQ0FDRSxDQUNQLENBQ1IsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBDb250cm9sTGFiZWwsIEZvcm1Hcm91cCwgSGVscEJsb2NrLCBQYW5lbCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IHVzZVNlbGVjdG9yLCB1c2VTdG9yZSB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgVG9nZ2xlIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IHNldFJlY29tbWVuZGF0aW9ucyB9IGZyb20gJy4vYWN0aW9ucyc7XHJcblxyXG5mdW5jdGlvbiBTZXR0aW5ncygpIHtcclxuICBjb25zdCB1c2VSZWNvbW1lbmRhdGlvbnMgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IGFueSkgPT5cclxuICAgIHN0YXRlLnNldHRpbmdzWydTRFYnXT8udXNlUmVjb21tZW5kYXRpb25zKTtcclxuXHJcbiAgY29uc3Qgc3RvcmUgPSB1c2VTdG9yZSgpO1xyXG5cclxuICBjb25zdCBzZXRVc2VSZWNvbW1lbmRhdGlvbnMgPSBSZWFjdC51c2VDYWxsYmFjaygoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xyXG4gICAgc3RvcmUuZGlzcGF0Y2goc2V0UmVjb21tZW5kYXRpb25zKGVuYWJsZWQpKTtcclxuICB9LCBbXSk7XHJcbiAgXHJcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGZvcm0+XHJcbiAgICAgIDxGb3JtR3JvdXAgY29udHJvbElkPSdkZWZhdWx0LWVuYWJsZSc+XHJcbiAgICAgICAgPFBhbmVsPlxyXG4gICAgICAgICAgPFBhbmVsLkJvZHk+XHJcbiAgICAgICAgICAgIDxDb250cm9sTGFiZWw+e3QoJ1N0YXJkZXcgVmFsbGV5Jyl9PC9Db250cm9sTGFiZWw+XHJcbiAgICAgICAgICAgIDxUb2dnbGVcclxuICAgICAgICAgICAgICBjaGVja2VkPXt1c2VSZWNvbW1lbmRhdGlvbnN9XHJcbiAgICAgICAgICAgICAgb25Ub2dnbGU9e3NldFVzZVJlY29tbWVuZGF0aW9uc31cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIHt0KCdVc2UgcmVjb21tZW5kYXRpb25zIGZyb20gdGhlIG1vZCBtYW5pZmVzdHMnKX1cclxuICAgICAgICAgICAgPC9Ub2dnbGU+XHJcbiAgICAgICAgICAgIDxIZWxwQmxvY2s+XHJcbiAgICAgICAgICAgICAge3QoJ0lmIGNoZWNrZWQsIHdoZW4geW91IGluc3RhbGwgYSBtb2QgZm9yIFN0YXJkZXcgVmFsbGV5IHlvdSBtYXkgZ2V0ICdcclxuICAgICAgICAgICAgICAgICsgJ3N1Z2dlc3Rpb25zIGZvciBpbnN0YWxsaW5nIGZ1cnRoZXIgbW9kcywgcmVxdWlyZWQgb3IgcmVjb21tZW5kZWQgYnkgaXQuJ1xyXG4gICAgICAgICAgICAgICAgKyAnVGhpcyBpbmZvcm1hdGlvbiBjb3VsZCBiZSB3cm9uZyBvciBpbmNvbXBsZXRlIHNvIHBsZWFzZSBjYXJlZnVsbHkgJ1xyXG4gICAgICAgICAgICAgICAgKyAnY29uc2lkZXIgYmVmb3JlIGFjY2VwdGluZyB0aGVtLicpfVxyXG4gICAgICAgICAgICA8L0hlbHBCbG9jaz5cclxuICAgICAgICAgIDwvUGFuZWwuQm9keT5cclxuICAgICAgICA8L1BhbmVsPlxyXG4gICAgICA8L0Zvcm1Hcm91cD5cclxuICAgIDwvZm9ybT5cclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTZXR0aW5ncztcclxuIl19