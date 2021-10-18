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
const actions_1 = require("../actions");
const common_1 = require("../common");
const TBI = vortex_api_1.ToolbarIcon;
class PriorityTypeButton extends vortex_api_1.ComponentEx {
    constructor() {
        super(...arguments);
        this.switch = () => {
            const current = this.props.priorityType;
            this.props.onSetPriorityType((current === 'position-based')
                ? 'prefix-based' : 'position-based');
        };
    }
    render() {
        const { t, priorityType } = this.props;
        return (React.createElement(TBI, { id: 'switch-priority-type-button', icon: 'sort-none', text: priorityType === 'position-based' ? t('To Prefix Based') : t('To Position Based'), tooltip: t('Changes priority assignment restrictions - prefix based is '
                + 'less restrictive and allows you to manually set priorities like '
                + '"5000", while position based will restrict priorities to their '
                + 'position in the load order page (in an incremental manner)'), onClick: this.switch }));
    }
}
function mapStateToProps(state, ownProps) {
    return {
        priorityType: vortex_api_1.util.getSafe(state, (0, common_1.getPriorityTypeBranch)(), 'prefix-based'),
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onSetPriorityType: (type) => dispatch((0, actions_1.setPriorityType)(type)),
    };
}
exports.default = (0, react_i18next_1.withTranslation)(['common', 'witcher3'])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(PriorityTypeButton));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJpb3JpdHlUeXBlQnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUHJpb3JpdHlUeXBlQnV0dG9uLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsaURBQWdEO0FBQ2hELDZDQUFzQztBQUN0QywyQ0FBbUU7QUFFbkUsd0NBQTZDO0FBQzdDLHNDQUFrRDtBQVlsRCxNQUFNLEdBQUcsR0FBRyx3QkFBa0IsQ0FBQztBQUMvQixNQUFNLGtCQUFtQixTQUFRLHdCQUF1QjtJQUF4RDs7UUFrQlUsV0FBTSxHQUFHLEdBQUcsRUFBRTtZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztZQUN4QyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxLQUFLLGdCQUFnQixDQUFDO2dCQUN6RCxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQTtJQUNILENBQUM7SUF0QlEsTUFBTTtRQUNYLE1BQU0sRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUV2QyxPQUFPLENBQ0wsb0JBQUMsR0FBRyxJQUNGLEVBQUUsRUFBQyw2QkFBNkIsRUFDaEMsSUFBSSxFQUFDLFdBQVcsRUFDaEIsSUFBSSxFQUFFLFlBQVksS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUN2RixPQUFPLEVBQUUsQ0FBQyxDQUFDLDZEQUE2RDtrQkFDOUQsa0VBQWtFO2tCQUNsRSxpRUFBaUU7a0JBQ2pFLDREQUE0RCxDQUFDLEVBQ3ZFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUNwQixDQUNILENBQUM7SUFDSixDQUFDO0NBT0Y7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFtQixFQUFFLFFBQWdCO0lBQzVELE9BQU87UUFDTCxZQUFZLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsOEJBQXFCLEdBQUUsRUFBRSxjQUFjLENBQUM7S0FDM0UsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQWE7SUFDdkMsT0FBTztRQUNMLGlCQUFpQixFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBQSx5QkFBZSxFQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3JFLENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQ0UsSUFBQSwrQkFBZSxFQUFDLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQ3JDLElBQUEscUJBQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxrQkFBeUIsQ0FBQyxDQUM1QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyB3aXRoVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcclxuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgQ29tcG9uZW50RXgsIFRvb2xiYXJJY29uLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IGdldFByaW9yaXR5VHlwZUJyYW5jaCB9IGZyb20gJy4uL2NvbW1vbic7XHJcbmltcG9ydCB7IFByaW9yaXR5VHlwZSB9IGZyb20gJy4uL3ByaW9yaXR5TWFuYWdlcic7XHJcblxyXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcclxuICBwcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XHJcbiAgb25TZXRQcmlvcml0eVR5cGU6ICh0eXBlOiBzdHJpbmcpID0+IHZvaWQ7XHJcbn1cclxuXHJcbnR5cGUgSVByb3BzID0gSUNvbm5lY3RlZFByb3BzICYgSUFjdGlvblByb3BzO1xyXG5jb25zdCBUQkkgPSBUb29sYmFySWNvbiBhcyBhbnk7XHJcbmNsYXNzIFByaW9yaXR5VHlwZUJ1dHRvbiBleHRlbmRzIENvbXBvbmVudEV4PElQcm9wcywge30+IHtcclxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcclxuICAgIGNvbnN0IHsgdCwgcHJpb3JpdHlUeXBlIH0gPSB0aGlzLnByb3BzO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxUQklcclxuICAgICAgICBpZD0nc3dpdGNoLXByaW9yaXR5LXR5cGUtYnV0dG9uJ1xyXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcclxuICAgICAgICB0ZXh0PXtwcmlvcml0eVR5cGUgPT09ICdwb3NpdGlvbi1iYXNlZCcgPyB0KCdUbyBQcmVmaXggQmFzZWQnKSA6IHQoJ1RvIFBvc2l0aW9uIEJhc2VkJyl9XHJcbiAgICAgICAgdG9vbHRpcD17dCgnQ2hhbmdlcyBwcmlvcml0eSBhc3NpZ25tZW50IHJlc3RyaWN0aW9ucyAtIHByZWZpeCBiYXNlZCBpcyAnXHJcbiAgICAgICAgICAgICAgICArICdsZXNzIHJlc3RyaWN0aXZlIGFuZCBhbGxvd3MgeW91IHRvIG1hbnVhbGx5IHNldCBwcmlvcml0aWVzIGxpa2UgJ1xyXG4gICAgICAgICAgICAgICAgKyAnXCI1MDAwXCIsIHdoaWxlIHBvc2l0aW9uIGJhc2VkIHdpbGwgcmVzdHJpY3QgcHJpb3JpdGllcyB0byB0aGVpciAnXHJcbiAgICAgICAgICAgICAgICArICdwb3NpdGlvbiBpbiB0aGUgbG9hZCBvcmRlciBwYWdlIChpbiBhbiBpbmNyZW1lbnRhbCBtYW5uZXIpJyl9XHJcbiAgICAgICAgb25DbGljaz17dGhpcy5zd2l0Y2h9XHJcbiAgICAgIC8+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzd2l0Y2ggPSAoKSA9PiB7XHJcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5wcm9wcy5wcmlvcml0eVR5cGU7XHJcbiAgICB0aGlzLnByb3BzLm9uU2V0UHJpb3JpdHlUeXBlKChjdXJyZW50ID09PSAncG9zaXRpb24tYmFzZWQnKVxyXG4gICAgICA/ICdwcmVmaXgtYmFzZWQnIDogJ3Bvc2l0aW9uLWJhc2VkJyk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByaW9yaXR5VHlwZTogdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcclxuICByZXR1cm4ge1xyXG4gICAgb25TZXRQcmlvcml0eVR5cGU6ICh0eXBlOiBzdHJpbmcpID0+IGRpc3BhdGNoKHNldFByaW9yaXR5VHlwZSh0eXBlKSksXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHRcclxuICB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCAnd2l0Y2hlcjMnXSkoXHJcbiAgICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShQcmlvcml0eVR5cGVCdXR0b24gYXMgYW55KSxcclxuICApIGFzIFJlYWN0LkNvbXBvbmVudENsYXNzPHt9PjtcclxuIl19