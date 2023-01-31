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
            react_1.default.createElement(react_bootstrap_1.ControlLabel, null, t('Stardew Valley')),
            react_1.default.createElement(vortex_api_1.Toggle, { checked: useRecommendations, onToggle: setUseRecommendations }, t('Use recommendations from the mod manifests')),
            react_1.default.createElement(react_bootstrap_1.HelpBlock, null, t('If checked, when you install a mod for Stardew Valley you may get '
                + 'suggestions for installing further mods, required or recommended by it.'
                + 'This information could be wrong or incomplete so please carefully '
                + 'consider before accepting them.')))));
}
exports.default = Settings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQXFFO0FBQ3JFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQW9DO0FBQ3BDLHVDQUErQztBQUUvQyxTQUFTLFFBQVE7SUFDZixNQUFNLGtCQUFrQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLFdBQ3BELE9BQUEsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxrQkFBa0IsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUU3QyxNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLHFCQUFxQixHQUFHLGVBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFnQixFQUFFLEVBQUU7UUFDbkUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLDRCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyw4QkFBWSxRQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFnQjtZQUNsRCw4QkFBQyxtQkFBTSxJQUNMLE9BQU8sRUFBRSxrQkFBa0IsRUFDM0IsUUFBUSxFQUFFLHFCQUFxQixJQUU5QixDQUFDLENBQUMsNENBQTRDLENBQUMsQ0FDekM7WUFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQyxvRUFBb0U7a0JBQ2xFLHlFQUF5RTtrQkFDekUsb0VBQW9FO2tCQUNwRSxpQ0FBaUMsQ0FBQyxDQUM3QixDQUNGLENBQ1AsQ0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IENvbnRyb2xMYWJlbCwgRm9ybUdyb3VwLCBIZWxwQmxvY2sgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyB1c2VTZWxlY3RvciwgdXNlU3RvcmUgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IFRvZ2dsZSB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBzZXRSZWNvbW1lbmRhdGlvbnMgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuZnVuY3Rpb24gU2V0dGluZ3MoKSB7XHJcbiAgY29uc3QgdXNlUmVjb21tZW5kYXRpb25zID0gdXNlU2VsZWN0b3IoKHN0YXRlOiBhbnkpID0+XHJcbiAgICBzdGF0ZS5zZXR0aW5nc1snU0RWJ10/LnVzZVJlY29tbWVuZGF0aW9ucyk7XHJcblxyXG4gIGNvbnN0IHN0b3JlID0gdXNlU3RvcmUoKTtcclxuXHJcbiAgY29uc3Qgc2V0VXNlUmVjb21tZW5kYXRpb25zID0gUmVhY3QudXNlQ2FsbGJhY2soKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgIHN0b3JlLmRpc3BhdGNoKHNldFJlY29tbWVuZGF0aW9ucyhlbmFibGVkKSk7XHJcbiAgfSwgW10pO1xyXG4gIFxyXG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxmb3JtPlxyXG4gICAgICA8Rm9ybUdyb3VwIGNvbnRyb2xJZD0nZGVmYXVsdC1lbmFibGUnPlxyXG4gICAgICAgIDxDb250cm9sTGFiZWw+e3QoJ1N0YXJkZXcgVmFsbGV5Jyl9PC9Db250cm9sTGFiZWw+XHJcbiAgICAgICAgPFRvZ2dsZVxyXG4gICAgICAgICAgY2hlY2tlZD17dXNlUmVjb21tZW5kYXRpb25zfVxyXG4gICAgICAgICAgb25Ub2dnbGU9e3NldFVzZVJlY29tbWVuZGF0aW9uc31cclxuICAgICAgICA+XHJcbiAgICAgICAgICB7dCgnVXNlIHJlY29tbWVuZGF0aW9ucyBmcm9tIHRoZSBtb2QgbWFuaWZlc3RzJyl9XHJcbiAgICAgICAgPC9Ub2dnbGU+XHJcbiAgICAgICAgPEhlbHBCbG9jaz5cclxuICAgICAgICAgIHt0KCdJZiBjaGVja2VkLCB3aGVuIHlvdSBpbnN0YWxsIGEgbW9kIGZvciBTdGFyZGV3IFZhbGxleSB5b3UgbWF5IGdldCAnXHJcbiAgICAgICAgICAgICArICdzdWdnZXN0aW9ucyBmb3IgaW5zdGFsbGluZyBmdXJ0aGVyIG1vZHMsIHJlcXVpcmVkIG9yIHJlY29tbWVuZGVkIGJ5IGl0LidcclxuICAgICAgICAgICAgICsgJ1RoaXMgaW5mb3JtYXRpb24gY291bGQgYmUgd3Jvbmcgb3IgaW5jb21wbGV0ZSBzbyBwbGVhc2UgY2FyZWZ1bGx5ICdcclxuICAgICAgICAgICAgICsgJ2NvbnNpZGVyIGJlZm9yZSBhY2NlcHRpbmcgdGhlbS4nKX1cclxuICAgICAgICA8L0hlbHBCbG9jaz5cclxuICAgICAgPC9Gb3JtR3JvdXA+XHJcbiAgICA8L2Zvcm0+XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2V0dGluZ3M7XHJcbiJdfQ==