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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQixpREFBZ0Q7QUFDaEQsNkNBQXNDO0FBQ3RDLDJDQUFrRTtBQWNsRSxTQUFTLFFBQVEsQ0FBQyxLQUFhO0lBQzdCLE1BQU0sRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQ3BFLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM1QyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO0lBQ0gsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBRXhCLE9BQU8sQ0FDTDtRQUNFLG9CQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLGdCQUFnQixFQUN6QixRQUFRLEVBQUUsU0FBUztZQUVsQixDQUFDLENBQUMsa0RBQWtELENBQUM7WUFDdEQsb0JBQUMsaUJBQUksSUFBQyxFQUFFLEVBQUMsbUJBQW1CLEVBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxJQUMzRCxDQUFDLENBQUMsaUZBQWlGO2tCQUNqRixzRUFBc0U7a0JBQ3RFLGdGQUFnRjtrQkFDaEYscUJBQXFCLENBQUMsQ0FDcEIsQ0FDQSxDQUNMLENBQ1AsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFVOztJQUNqQyxNQUFNLFNBQVMsR0FBVyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7SUFDN0QsT0FBTztRQUNMLFNBQVM7UUFDVCxnQkFBZ0IsRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUM7S0FDbkUsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFDRSxJQUFBLCtCQUFlLEVBQUMsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FDMUMsSUFBQSxxQkFBTyxFQUFDLGVBQWUsQ0FBQyxDQUN0QixRQUFRLENBQVEsQ0FBNkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJMThuZXh0IGZyb20gJ2kxOG5leHQnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0IHsgTW9yZSwgVG9nZ2xlLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmludGVyZmFjZSBJQmFzZVByb3BzIHtcbiAgdDogdHlwZW9mIEkxOG5leHQudDtcbiAgb25TZXRTb3J0T25EZXBsb3k6IChwcm9maWxlSWQ6IHN0cmluZywgc29ydDogYm9vbGVhbikgPT4gdm9pZDtcbn1cblxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XG4gIHByb2ZpbGVJZDogc3RyaW5nO1xuICBhdXRvU29ydE9uRGVwbG95OiBib29sZWFuO1xufVxuXG50eXBlIElQcm9wcyA9IElCYXNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XG5cbmZ1bmN0aW9uIFNldHRpbmdzKHByb3BzOiBJUHJvcHMpIHtcbiAgY29uc3QgeyB0LCBhdXRvU29ydE9uRGVwbG95LCBvblNldFNvcnRPbkRlcGxveSwgcHJvZmlsZUlkIH0gPSBwcm9wcztcbiAgY29uc3Qgb25TZXRTb3J0ID0gUmVhY3QudXNlQ2FsbGJhY2soKHZhbHVlKSA9PiB7XG4gICAgaWYgKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBvblNldFNvcnRPbkRlcGxveShwcm9maWxlSWQsIHZhbHVlKTtcbiAgICB9XG4gIH0sIFtvblNldFNvcnRPbkRlcGxveV0pO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIDxUb2dnbGVcbiAgICAgICAgY2hlY2tlZD17YXV0b1NvcnRPbkRlcGxveX1cbiAgICAgICAgb25Ub2dnbGU9e29uU2V0U29ydH1cbiAgICAgID5cbiAgICAgICAge3QoJ1NvcnQgQmFubmVybG9yZCBtb2RzIGF1dG9tYXRpY2FsbHkgb24gZGVwbG95bWVudCcpfVxuICAgICAgICA8TW9yZSBpZD0nbW5iMi1zb3J0LXNldHRpbmcnIG5hbWU9e3QoJ1J1bm5pbmcgc29ydCBvbiBkZXBsb3knKX0+XG4gICAgICAgICAge3QoJ0FueSB0aW1lIHlvdSBkZXBsb3ksIFZvcnRleCB3aWxsIGF0dGVtcHQgdG8gYXV0b21hdGljYWxseSBzb3J0IHlvdXIgbG9hZCBvcmRlciAnXG4gICAgICAgICAgICsgJ2ZvciB5b3UgdG8gcmVkdWNlIGdhbWUgY3Jhc2hlcyBjYXVzZWQgYnkgaW5jb3JyZWN0IG1vZHVsZSBvcmRlci5cXG5cXG4nXG4gICAgICAgICAgICsgJ0ltcG9ydGFudDogUGxlYXNlIGVuc3VyZSB0byBsb2NrIGFueSBsb2FkIG9yZGVyIGVudHJpZXMgeW91IHdpc2ggdG8gc3RvcCBmcm9tICdcbiAgICAgICAgICAgKyAnc2hpZnRpbmcgcG9zaXRpb25zLicpfVxuICAgICAgICA8L01vcmU+XG4gICAgICA8L1RvZ2dsZT5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiBhbnkpOiBJQ29ubmVjdGVkUHJvcHMge1xuICBjb25zdCBwcm9maWxlSWQ6IHN0cmluZyA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG4gIHJldHVybiB7XG4gICAgcHJvZmlsZUlkLFxuICAgIGF1dG9Tb3J0T25EZXBsb3k6IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgIFsnc2V0dGluZ3MnLCAnbW91bnRhbmRibGFkZTInLCAnc29ydE9uRGVwbG95JywgcHJvZmlsZUlkXSwgdHJ1ZSksXG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IFxuICB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCAnbW5iMi1zZXR0aW5ncyddKShcbiAgICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcykoXG4gICAgICBTZXR0aW5ncykgYXMgYW55KSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczx7fT47XG4iXX0=