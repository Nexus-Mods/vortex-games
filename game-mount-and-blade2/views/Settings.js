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
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
function Settings(props) {
    const { t, autoSortOnDeploy, onSetSortOnDeploy, profileId } = props;
    const onSetSort = React.useCallback((value) => {
        if (profileId !== undefined) {
            onSetSortOnDeploy(profileId, value);
        }
    }, [onSetSortOnDeploy]);
    return (React.createElement("div", null,
        React.createElement(vortex_api_1.Toggle, { checked: autoSortOnDeploy, onToggle: onSetSort },
            t('Sort Bannerlord mods automatically on deployment'),
            React.createElement(vortex_api_1.More, { id: 'mnb2-sort-setting', name: t('Running sort on deploy') }, t('Any time you deploy, Vortex will attempt to automatically sort your load order '
                + 'for you to reduce game crashes caused by incorrect module order.\n\n'
                + 'Important: Please ensure to lock any load order entries you wish to stop from '
                + 'shifting positions.')))));
}
function mapStateToProps(state) {
    var _a;
    const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
    return {
        profileId,
        autoSortOnDeploy: vortex_api_1.util.getSafe(state, ['settings', 'mountandblade2', 'sortOnDeploy', profileId], true),
    };
}
exports.default = (0, react_i18next_1.withTranslation)(['common', 'mnb2-settings'])((0, react_redux_1.connect)(mapStateToProps)(Settings));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQixpREFBZ0Q7QUFDaEQsNkNBQXNDO0FBQ3RDLDJDQUFrRTtBQWNsRSxTQUFTLFFBQVEsQ0FBQyxLQUFhO0lBQzdCLE1BQU0sRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQ3BFLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM1QyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO0lBQ0gsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBRXhCLE9BQU8sQ0FDTDtRQUNFLG9CQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLGdCQUFnQixFQUN6QixRQUFRLEVBQUUsU0FBUztZQUVsQixDQUFDLENBQUMsa0RBQWtELENBQUM7WUFDdEQsb0JBQUMsaUJBQUksSUFBQyxFQUFFLEVBQUMsbUJBQW1CLEVBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxJQUMzRCxDQUFDLENBQUMsaUZBQWlGO2tCQUNqRixzRUFBc0U7a0JBQ3RFLGdGQUFnRjtrQkFDaEYscUJBQXFCLENBQUMsQ0FDcEIsQ0FDQSxDQUNMLENBQ1AsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFVOztJQUNqQyxNQUFNLFNBQVMsR0FBVyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7SUFDN0QsT0FBTztRQUNMLFNBQVM7UUFDVCxnQkFBZ0IsRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUM7S0FDbkUsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFDRSxJQUFBLCtCQUFlLEVBQUMsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FDMUMsSUFBQSxxQkFBTyxFQUFDLGVBQWUsQ0FBQyxDQUN0QixRQUFRLENBQVEsQ0FBNkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJMThuZXh0IGZyb20gJ2kxOG5leHQnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5pbXBvcnQgeyBNb3JlLCBUb2dnbGUsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICB0OiB0eXBlb2YgSTE4bmV4dC50O1xyXG4gIG9uU2V0U29ydE9uRGVwbG95OiAocHJvZmlsZUlkOiBzdHJpbmcsIHNvcnQ6IGJvb2xlYW4pID0+IHZvaWQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIHByb2ZpbGVJZDogc3RyaW5nO1xyXG4gIGF1dG9Tb3J0T25EZXBsb3k6IGJvb2xlYW47XHJcbn1cclxuXHJcbnR5cGUgSVByb3BzID0gSUJhc2VQcm9wcyAmIElDb25uZWN0ZWRQcm9wcztcclxuXHJcbmZ1bmN0aW9uIFNldHRpbmdzKHByb3BzOiBJUHJvcHMpIHtcclxuICBjb25zdCB7IHQsIGF1dG9Tb3J0T25EZXBsb3ksIG9uU2V0U29ydE9uRGVwbG95LCBwcm9maWxlSWQgfSA9IHByb3BzO1xyXG4gIGNvbnN0IG9uU2V0U29ydCA9IFJlYWN0LnVzZUNhbGxiYWNrKCh2YWx1ZSkgPT4ge1xyXG4gICAgaWYgKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIG9uU2V0U29ydE9uRGVwbG95KHByb2ZpbGVJZCwgdmFsdWUpO1xyXG4gICAgfVxyXG4gIH0sIFtvblNldFNvcnRPbkRlcGxveV0pO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGRpdj5cclxuICAgICAgPFRvZ2dsZVxyXG4gICAgICAgIGNoZWNrZWQ9e2F1dG9Tb3J0T25EZXBsb3l9XHJcbiAgICAgICAgb25Ub2dnbGU9e29uU2V0U29ydH1cclxuICAgICAgPlxyXG4gICAgICAgIHt0KCdTb3J0IEJhbm5lcmxvcmQgbW9kcyBhdXRvbWF0aWNhbGx5IG9uIGRlcGxveW1lbnQnKX1cclxuICAgICAgICA8TW9yZSBpZD0nbW5iMi1zb3J0LXNldHRpbmcnIG5hbWU9e3QoJ1J1bm5pbmcgc29ydCBvbiBkZXBsb3knKX0+XHJcbiAgICAgICAgICB7dCgnQW55IHRpbWUgeW91IGRlcGxveSwgVm9ydGV4IHdpbGwgYXR0ZW1wdCB0byBhdXRvbWF0aWNhbGx5IHNvcnQgeW91ciBsb2FkIG9yZGVyICdcclxuICAgICAgICAgICArICdmb3IgeW91IHRvIHJlZHVjZSBnYW1lIGNyYXNoZXMgY2F1c2VkIGJ5IGluY29ycmVjdCBtb2R1bGUgb3JkZXIuXFxuXFxuJ1xyXG4gICAgICAgICAgICsgJ0ltcG9ydGFudDogUGxlYXNlIGVuc3VyZSB0byBsb2NrIGFueSBsb2FkIG9yZGVyIGVudHJpZXMgeW91IHdpc2ggdG8gc3RvcCBmcm9tICdcclxuICAgICAgICAgICArICdzaGlmdGluZyBwb3NpdGlvbnMuJyl9XHJcbiAgICAgICAgPC9Nb3JlPlxyXG4gICAgICA8L1RvZ2dsZT5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogYW55KTogSUNvbm5lY3RlZFByb3BzIHtcclxuICBjb25zdCBwcm9maWxlSWQ6IHN0cmluZyA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByb2ZpbGVJZCxcclxuICAgIGF1dG9Tb3J0T25EZXBsb3k6IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgWydzZXR0aW5ncycsICdtb3VudGFuZGJsYWRlMicsICdzb3J0T25EZXBsb3knLCBwcm9maWxlSWRdLCB0cnVlKSxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBcclxuICB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCAnbW5iMi1zZXR0aW5ncyddKShcclxuICAgIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzKShcclxuICAgICAgU2V0dGluZ3MpIGFzIGFueSkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8e30+O1xyXG4iXX0=