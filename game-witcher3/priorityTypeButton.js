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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
const common_1 = require("./common");
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
        return (React.createElement(vortex_api_1.ToolbarIcon, { id: 'switch-priority-type-button', icon: 'sort-none', text: priorityType === 'position-based' ? t('To Prefix Based') : t('To Position Based'), tooltip: t('Changes priority assignment restrictions - prefix based is '
                + 'less restrictive and allows you to manually set priorities like '
                + '"5000", while position based will restrict priorities to their '
                + 'position in the load order page (in an incremental manner)'), onClick: this.switch }));
    }
}
function mapStateToProps(state, ownProps) {
    return {
        priorityType: vortex_api_1.util.getSafe(state, common_1.getPriorityTypeBranch(), 'prefix-based'),
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onSetPriorityType: (type) => dispatch(actions_1.setPriorityType(type)),
    };
}
exports.default = react_i18next_1.withTranslation(['common', 'witcher3'])(react_redux_1.connect(mapStateToProps, mapDispatchToProps)(PriorityTypeButton));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlUeXBlQnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlUeXBlQnV0dG9uLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsaURBQWdEO0FBQ2hELDZDQUFzQztBQUN0QywyQ0FBbUU7QUFFbkUsdUNBQTRDO0FBQzVDLHFDQUFpRDtBQWFqRCxNQUFNLGtCQUFtQixTQUFRLHdCQUF1QjtJQUF4RDs7UUFrQlUsV0FBTSxHQUFHLEdBQUcsRUFBRTtZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztZQUN4QyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxLQUFLLGdCQUFnQixDQUFDO2dCQUN6RCxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQTtJQUNILENBQUM7SUF0QlEsTUFBTTtRQUNYLE1BQU0sRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUV2QyxPQUFPLENBQ0wsb0JBQUMsd0JBQVcsSUFDVixFQUFFLEVBQUMsNkJBQTZCLEVBQ2hDLElBQUksRUFBQyxXQUFXLEVBQ2hCLElBQUksRUFBRSxZQUFZLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsRUFDdkYsT0FBTyxFQUFFLENBQUMsQ0FBQyw2REFBNkQ7a0JBQzlELGtFQUFrRTtrQkFDbEUsaUVBQWlFO2tCQUNqRSw0REFBNEQsQ0FBQyxFQUN2RSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FDcEIsQ0FDSCxDQUFDO0lBQ0osQ0FBQztDQU9GO0FBRUQsU0FBUyxlQUFlLENBQUMsS0FBbUIsRUFBRSxRQUFnQjtJQUM1RCxPQUFPO1FBQ0wsWUFBWSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSw4QkFBcUIsRUFBRSxFQUFFLGNBQWMsQ0FBQztLQUMzRSxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsUUFBYTtJQUN2QyxPQUFPO1FBQ0wsaUJBQWlCLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyx5QkFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3JFLENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQ0UsK0JBQWUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUNyQyxxQkFBTyxDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5pbXBvcnQgeyBDb21wb25lbnRFeCwgVG9vbGJhckljb24sIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBzZXRQcmlvcml0eVR5cGUgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyBnZXRQcmlvcml0eVR5cGVCcmFuY2ggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IFByaW9yaXR5VHlwZSB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuXHJcbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcclxuICBvblNldFByaW9yaXR5VHlwZTogKHR5cGU6IHN0cmluZykgPT4gdm9pZDtcclxufVxyXG5cclxudHlwZSBJUHJvcHMgPSBJQ29ubmVjdGVkUHJvcHMgJiBJQWN0aW9uUHJvcHM7XHJcblxyXG5jbGFzcyBQcmlvcml0eVR5cGVCdXR0b24gZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIHt9PiB7XHJcbiAgcHVibGljIHJlbmRlcigpOiBKU1guRWxlbWVudCB7XHJcbiAgICBjb25zdCB7IHQsIHByaW9yaXR5VHlwZSB9ID0gdGhpcy5wcm9wcztcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8VG9vbGJhckljb25cclxuICAgICAgICBpZD0nc3dpdGNoLXByaW9yaXR5LXR5cGUtYnV0dG9uJ1xyXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcclxuICAgICAgICB0ZXh0PXtwcmlvcml0eVR5cGUgPT09ICdwb3NpdGlvbi1iYXNlZCcgPyB0KCdUbyBQcmVmaXggQmFzZWQnKSA6IHQoJ1RvIFBvc2l0aW9uIEJhc2VkJyl9XHJcbiAgICAgICAgdG9vbHRpcD17dCgnQ2hhbmdlcyBwcmlvcml0eSBhc3NpZ25tZW50IHJlc3RyaWN0aW9ucyAtIHByZWZpeCBiYXNlZCBpcyAnXHJcbiAgICAgICAgICAgICAgICArICdsZXNzIHJlc3RyaWN0aXZlIGFuZCBhbGxvd3MgeW91IHRvIG1hbnVhbGx5IHNldCBwcmlvcml0aWVzIGxpa2UgJ1xyXG4gICAgICAgICAgICAgICAgKyAnXCI1MDAwXCIsIHdoaWxlIHBvc2l0aW9uIGJhc2VkIHdpbGwgcmVzdHJpY3QgcHJpb3JpdGllcyB0byB0aGVpciAnXHJcbiAgICAgICAgICAgICAgICArICdwb3NpdGlvbiBpbiB0aGUgbG9hZCBvcmRlciBwYWdlIChpbiBhbiBpbmNyZW1lbnRhbCBtYW5uZXIpJyl9XHJcbiAgICAgICAgb25DbGljaz17dGhpcy5zd2l0Y2h9XHJcbiAgICAgIC8+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzd2l0Y2ggPSAoKSA9PiB7XHJcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5wcm9wcy5wcmlvcml0eVR5cGU7XHJcbiAgICB0aGlzLnByb3BzLm9uU2V0UHJpb3JpdHlUeXBlKChjdXJyZW50ID09PSAncG9zaXRpb24tYmFzZWQnKVxyXG4gICAgICA/ICdwcmVmaXgtYmFzZWQnIDogJ3Bvc2l0aW9uLWJhc2VkJyk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByaW9yaXR5VHlwZTogdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcclxuICByZXR1cm4ge1xyXG4gICAgb25TZXRQcmlvcml0eVR5cGU6ICh0eXBlOiBzdHJpbmcpID0+IGRpc3BhdGNoKHNldFByaW9yaXR5VHlwZSh0eXBlKSksXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHRcclxuICB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCAnd2l0Y2hlcjMnXSkoXHJcbiAgICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShQcmlvcml0eVR5cGVCdXR0b24pLFxyXG4gICkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8e30+O1xyXG4iXX0=