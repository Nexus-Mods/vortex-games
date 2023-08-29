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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQTRFO0FBQzVFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQW9DO0FBQ3BDLHVDQUErQztBQUUvQyxTQUFTLFFBQVE7SUFDZixNQUFNLGtCQUFrQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLFdBQ3BELE9BQUEsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxrQkFBa0IsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUU3QyxNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLHFCQUFxQixHQUFHLGVBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFnQixFQUFFLEVBQUU7UUFDbkUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLDRCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyx1QkFBSztnQkFDSiw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksUUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBZ0I7b0JBQ2xELDhCQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLGtCQUFrQixFQUMzQixRQUFRLEVBQUUscUJBQXFCLElBRTlCLENBQUMsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUN6QztvQkFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQyxvRUFBb0U7MEJBQ25FLHlFQUF5RTswQkFDekUsb0VBQW9FOzBCQUNwRSxpQ0FBaUMsQ0FBQyxDQUM1QixDQUNELENBQ1AsQ0FDRSxDQUNQLENBQ1IsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQ29udHJvbExhYmVsLCBGb3JtR3JvdXAsIEhlbHBCbG9jaywgUGFuZWwgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IHVzZVNlbGVjdG9yLCB1c2VTdG9yZSB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IFRvZ2dsZSB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgc2V0UmVjb21tZW5kYXRpb25zIH0gZnJvbSAnLi9hY3Rpb25zJztcblxuZnVuY3Rpb24gU2V0dGluZ3MoKSB7XG4gIGNvbnN0IHVzZVJlY29tbWVuZGF0aW9ucyA9IHVzZVNlbGVjdG9yKChzdGF0ZTogYW55KSA9PlxuICAgIHN0YXRlLnNldHRpbmdzWydTRFYnXT8udXNlUmVjb21tZW5kYXRpb25zKTtcblxuICBjb25zdCBzdG9yZSA9IHVzZVN0b3JlKCk7XG5cbiAgY29uc3Qgc2V0VXNlUmVjb21tZW5kYXRpb25zID0gUmVhY3QudXNlQ2FsbGJhY2soKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcbiAgICBzdG9yZS5kaXNwYXRjaChzZXRSZWNvbW1lbmRhdGlvbnMoZW5hYmxlZCkpO1xuICB9LCBbXSk7XG4gIFxuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8Zm9ybT5cbiAgICAgIDxGb3JtR3JvdXAgY29udHJvbElkPSdkZWZhdWx0LWVuYWJsZSc+XG4gICAgICAgIDxQYW5lbD5cbiAgICAgICAgICA8UGFuZWwuQm9keT5cbiAgICAgICAgICAgIDxDb250cm9sTGFiZWw+e3QoJ1N0YXJkZXcgVmFsbGV5Jyl9PC9Db250cm9sTGFiZWw+XG4gICAgICAgICAgICA8VG9nZ2xlXG4gICAgICAgICAgICAgIGNoZWNrZWQ9e3VzZVJlY29tbWVuZGF0aW9uc31cbiAgICAgICAgICAgICAgb25Ub2dnbGU9e3NldFVzZVJlY29tbWVuZGF0aW9uc31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3QoJ1VzZSByZWNvbW1lbmRhdGlvbnMgZnJvbSB0aGUgbW9kIG1hbmlmZXN0cycpfVxuICAgICAgICAgICAgPC9Ub2dnbGU+XG4gICAgICAgICAgICA8SGVscEJsb2NrPlxuICAgICAgICAgICAgICB7dCgnSWYgY2hlY2tlZCwgd2hlbiB5b3UgaW5zdGFsbCBhIG1vZCBmb3IgU3RhcmRldyBWYWxsZXkgeW91IG1heSBnZXQgJ1xuICAgICAgICAgICAgICAgICsgJ3N1Z2dlc3Rpb25zIGZvciBpbnN0YWxsaW5nIGZ1cnRoZXIgbW9kcywgcmVxdWlyZWQgb3IgcmVjb21tZW5kZWQgYnkgaXQuJ1xuICAgICAgICAgICAgICAgICsgJ1RoaXMgaW5mb3JtYXRpb24gY291bGQgYmUgd3Jvbmcgb3IgaW5jb21wbGV0ZSBzbyBwbGVhc2UgY2FyZWZ1bGx5ICdcbiAgICAgICAgICAgICAgICArICdjb25zaWRlciBiZWZvcmUgYWNjZXB0aW5nIHRoZW0uJyl9XG4gICAgICAgICAgICA8L0hlbHBCbG9jaz5cbiAgICAgICAgICA8L1BhbmVsLkJvZHk+XG4gICAgICAgIDwvUGFuZWw+XG4gICAgICA8L0Zvcm1Hcm91cD5cbiAgICA8L2Zvcm0+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNldHRpbmdzO1xuIl19