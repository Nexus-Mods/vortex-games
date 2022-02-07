"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    const profileId = vortex_api_1.selectors.activeProfile(state).id;
    return {
        profileId,
        autoSortOnDeploy: vortex_api_1.util.getSafe(state, ['settings', 'mountandblade2', 'sortOnDeploy', profileId], true),
    };
}
exports.default = (0, react_i18next_1.withTranslation)(['common', 'mnb2-settings'])((0, react_redux_1.connect)(mapStateToProps)(Settings));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBQy9CLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFDdEMsMkNBQWtFO0FBY2xFLFNBQVMsUUFBUSxDQUFDLEtBQWE7SUFDN0IsTUFBTSxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxLQUFLLENBQUM7SUFFcEUsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzVDLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckM7SUFDSCxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7SUFFeEIsT0FBTyxDQUNMO1FBQ0Usb0JBQUMsbUJBQU0sSUFDTCxPQUFPLEVBQUUsZ0JBQWdCLEVBQ3pCLFFBQVEsRUFBRSxTQUFTO1lBRWxCLENBQUMsQ0FBQyxrREFBa0QsQ0FBQztZQUN0RCxvQkFBQyxpQkFBSSxJQUFDLEVBQUUsRUFBQyxtQkFBbUIsRUFBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLElBQzNELENBQUMsQ0FBQyxpRkFBaUY7a0JBQ2pGLHNFQUFzRTtrQkFDdEUsZ0ZBQWdGO2tCQUNoRixxQkFBcUIsQ0FBQyxDQUNwQixDQUNBLENBQ0wsQ0FDUCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQVU7SUFDakMsTUFBTSxTQUFTLEdBQVcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzVELE9BQU87UUFDTCxTQUFTO1FBQ1QsZ0JBQWdCLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNsQyxDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDO0tBQ25FLENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQ0UsSUFBQSwrQkFBZSxFQUFDLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQzFDLElBQUEscUJBQU8sRUFBQyxlQUFlLENBQUMsQ0FDdEIsUUFBUSxDQUFRLENBQTZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSTE4bmV4dCBmcm9tICdpMThuZXh0JztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyB3aXRoVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcclxuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgTW9yZSwgVG9nZ2xlLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgdDogdHlwZW9mIEkxOG5leHQudDtcclxuICBvblNldFNvcnRPbkRlcGxveTogKHByb2ZpbGVJZDogc3RyaW5nLCBzb3J0OiBib29sZWFuKSA9PiB2b2lkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcclxuICBwcm9maWxlSWQ6IHN0cmluZztcclxuICBhdXRvU29ydE9uRGVwbG95OiBib29sZWFuO1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElCYXNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XHJcblxyXG5mdW5jdGlvbiBTZXR0aW5ncyhwcm9wczogSVByb3BzKSB7XHJcbiAgY29uc3QgeyB0LCBhdXRvU29ydE9uRGVwbG95LCBvblNldFNvcnRPbkRlcGxveSwgcHJvZmlsZUlkIH0gPSBwcm9wcztcclxuICBcclxuICBjb25zdCBvblNldFNvcnQgPSBSZWFjdC51c2VDYWxsYmFjaygodmFsdWUpID0+IHtcclxuICAgIGlmIChwcm9maWxlSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBvblNldFNvcnRPbkRlcGxveShwcm9maWxlSWQsIHZhbHVlKTtcclxuICAgIH1cclxuICB9LCBbb25TZXRTb3J0T25EZXBsb3ldKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXY+XHJcbiAgICAgIDxUb2dnbGVcclxuICAgICAgICBjaGVja2VkPXthdXRvU29ydE9uRGVwbG95fVxyXG4gICAgICAgIG9uVG9nZ2xlPXtvblNldFNvcnR9XHJcbiAgICAgID5cclxuICAgICAgICB7dCgnU29ydCBCYW5uZXJsb3JkIG1vZHMgYXV0b21hdGljYWxseSBvbiBkZXBsb3ltZW50Jyl9XHJcbiAgICAgICAgPE1vcmUgaWQ9J21uYjItc29ydC1zZXR0aW5nJyBuYW1lPXt0KCdSdW5uaW5nIHNvcnQgb24gZGVwbG95Jyl9PlxyXG4gICAgICAgICAge3QoJ0FueSB0aW1lIHlvdSBkZXBsb3ksIFZvcnRleCB3aWxsIGF0dGVtcHQgdG8gYXV0b21hdGljYWxseSBzb3J0IHlvdXIgbG9hZCBvcmRlciAnXHJcbiAgICAgICAgICAgKyAnZm9yIHlvdSB0byByZWR1Y2UgZ2FtZSBjcmFzaGVzIGNhdXNlZCBieSBpbmNvcnJlY3QgbW9kdWxlIG9yZGVyLlxcblxcbidcclxuICAgICAgICAgICArICdJbXBvcnRhbnQ6IFBsZWFzZSBlbnN1cmUgdG8gbG9jayBhbnkgbG9hZCBvcmRlciBlbnRyaWVzIHlvdSB3aXNoIHRvIHN0b3AgZnJvbSAnXHJcbiAgICAgICAgICAgKyAnc2hpZnRpbmcgcG9zaXRpb25zLicpfVxyXG4gICAgICAgIDwvTW9yZT5cclxuICAgICAgPC9Ub2dnbGU+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IGFueSk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgY29uc3QgcHJvZmlsZUlkOiBzdHJpbmcgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSkuaWQ7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByb2ZpbGVJZCxcclxuICAgIGF1dG9Tb3J0T25EZXBsb3k6IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgWydzZXR0aW5ncycsICdtb3VudGFuZGJsYWRlMicsICdzb3J0T25EZXBsb3knLCBwcm9maWxlSWRdLCB0cnVlKSxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBcclxuICB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCAnbW5iMi1zZXR0aW5ncyddKShcclxuICAgIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzKShcclxuICAgICAgU2V0dGluZ3MpIGFzIGFueSkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8e30+O1xyXG4iXX0=