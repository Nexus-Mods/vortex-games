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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJpb3JpdHlUeXBlQnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUHJpb3JpdHlUeXBlQnV0dG9uLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkNBQStCO0FBQy9CLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFDdEMsMkNBQW1FO0FBRW5FLHdDQUE2QztBQUM3QyxzQ0FBa0Q7QUFZbEQsTUFBTSxHQUFHLEdBQUcsd0JBQWtCLENBQUM7QUFDL0IsTUFBTSxrQkFBbUIsU0FBUSx3QkFBdUI7SUFBeEQ7O1FBa0JVLFdBQU0sR0FBRyxHQUFHLEVBQUU7WUFDcEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7WUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sS0FBSyxnQkFBZ0IsQ0FBQztnQkFDekQsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUE7SUFDSCxDQUFDO0lBdEJRLE1BQU07UUFDWCxNQUFNLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFFdkMsT0FBTyxDQUNMLG9CQUFDLEdBQUcsSUFDRixFQUFFLEVBQUMsNkJBQTZCLEVBQ2hDLElBQUksRUFBQyxXQUFXLEVBQ2hCLElBQUksRUFBRSxZQUFZLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsRUFDdkYsT0FBTyxFQUFFLENBQUMsQ0FBQyw2REFBNkQ7a0JBQzlELGtFQUFrRTtrQkFDbEUsaUVBQWlFO2tCQUNqRSw0REFBNEQsQ0FBQyxFQUN2RSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FDcEIsQ0FDSCxDQUFDO0lBQ0osQ0FBQztDQU9GO0FBRUQsU0FBUyxlQUFlLENBQUMsS0FBbUIsRUFBRSxRQUFnQjtJQUM1RCxPQUFPO1FBQ0wsWUFBWSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFBLDhCQUFxQixHQUFFLEVBQUUsY0FBYyxDQUFDO0tBQzNFLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxRQUFhO0lBQ3ZDLE9BQU87UUFDTCxpQkFBaUIsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxJQUFJLENBQUMsQ0FBQztLQUNyRSxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUNFLElBQUEsK0JBQWUsRUFBQyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUNyQyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsa0JBQXlCLENBQUMsQ0FDNUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IENvbXBvbmVudEV4LCBUb29sYmFySWNvbiwgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi4vYWN0aW9ucyc7XG5pbXBvcnQgeyBnZXRQcmlvcml0eVR5cGVCcmFuY2ggfSBmcm9tICcuLi9jb21tb24nO1xuaW1wb3J0IHsgUHJpb3JpdHlUeXBlIH0gZnJvbSAnLi4vcHJpb3JpdHlNYW5hZ2VyJztcblxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XG4gIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlO1xufVxuXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcbiAgb25TZXRQcmlvcml0eVR5cGU6ICh0eXBlOiBzdHJpbmcpID0+IHZvaWQ7XG59XG5cbnR5cGUgSVByb3BzID0gSUNvbm5lY3RlZFByb3BzICYgSUFjdGlvblByb3BzO1xuY29uc3QgVEJJID0gVG9vbGJhckljb24gYXMgYW55O1xuY2xhc3MgUHJpb3JpdHlUeXBlQnV0dG9uIGV4dGVuZHMgQ29tcG9uZW50RXg8SVByb3BzLCB7fT4ge1xuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQsIHByaW9yaXR5VHlwZSB9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8VEJJXG4gICAgICAgIGlkPSdzd2l0Y2gtcHJpb3JpdHktdHlwZS1idXR0b24nXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcbiAgICAgICAgdGV4dD17cHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnID8gdCgnVG8gUHJlZml4IEJhc2VkJykgOiB0KCdUbyBQb3NpdGlvbiBCYXNlZCcpfVxuICAgICAgICB0b29sdGlwPXt0KCdDaGFuZ2VzIHByaW9yaXR5IGFzc2lnbm1lbnQgcmVzdHJpY3Rpb25zIC0gcHJlZml4IGJhc2VkIGlzICdcbiAgICAgICAgICAgICAgICArICdsZXNzIHJlc3RyaWN0aXZlIGFuZCBhbGxvd3MgeW91IHRvIG1hbnVhbGx5IHNldCBwcmlvcml0aWVzIGxpa2UgJ1xuICAgICAgICAgICAgICAgICsgJ1wiNTAwMFwiLCB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsIHJlc3RyaWN0IHByaW9yaXRpZXMgdG8gdGhlaXIgJ1xuICAgICAgICAgICAgICAgICsgJ3Bvc2l0aW9uIGluIHRoZSBsb2FkIG9yZGVyIHBhZ2UgKGluIGFuIGluY3JlbWVudGFsIG1hbm5lciknKX1cbiAgICAgICAgb25DbGljaz17dGhpcy5zd2l0Y2h9XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHN3aXRjaCA9ICgpID0+IHtcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5wcm9wcy5wcmlvcml0eVR5cGU7XG4gICAgdGhpcy5wcm9wcy5vblNldFByaW9yaXR5VHlwZSgoY3VycmVudCA9PT0gJ3Bvc2l0aW9uLWJhc2VkJylcbiAgICAgID8gJ3ByZWZpeC1iYXNlZCcgOiAncG9zaXRpb24tYmFzZWQnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XG4gIHJldHVybiB7XG4gICAgcHJpb3JpdHlUeXBlOiB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcbiAgcmV0dXJuIHtcbiAgICBvblNldFByaW9yaXR5VHlwZTogKHR5cGU6IHN0cmluZykgPT4gZGlzcGF0Y2goc2V0UHJpb3JpdHlUeXBlKHR5cGUpKSxcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHRcbiAgd2l0aFRyYW5zbGF0aW9uKFsnY29tbW9uJywgJ3dpdGNoZXIzJ10pKFxuICAgIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMpKFByaW9yaXR5VHlwZUJ1dHRvbiBhcyBhbnkpLFxuICApIGFzIFJlYWN0LkNvbXBvbmVudENsYXNzPHt9PjtcbiJdfQ==