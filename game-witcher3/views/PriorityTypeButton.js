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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJpb3JpdHlUeXBlQnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUHJpb3JpdHlUeXBlQnV0dG9uLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkNBQStCO0FBQy9CLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFDdEMsMkNBQW1FO0FBRW5FLHdDQUE2QztBQUM3QyxzQ0FBa0Q7QUFZbEQsTUFBTSxHQUFHLEdBQUcsd0JBQWtCLENBQUM7QUFDL0IsTUFBTSxrQkFBbUIsU0FBUSx3QkFBdUI7SUFBeEQ7O1FBa0JVLFdBQU0sR0FBRyxHQUFHLEVBQUU7WUFDcEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7WUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sS0FBSyxnQkFBZ0IsQ0FBQztnQkFDekQsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUE7SUFDSCxDQUFDO0lBdEJRLE1BQU07UUFDWCxNQUFNLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFFdkMsT0FBTyxDQUNMLG9CQUFDLEdBQUcsSUFDRixFQUFFLEVBQUMsNkJBQTZCLEVBQ2hDLElBQUksRUFBQyxXQUFXLEVBQ2hCLElBQUksRUFBRSxZQUFZLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsRUFDdkYsT0FBTyxFQUFFLENBQUMsQ0FBQyw2REFBNkQ7a0JBQzlELGtFQUFrRTtrQkFDbEUsaUVBQWlFO2tCQUNqRSw0REFBNEQsQ0FBQyxFQUN2RSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FDcEIsQ0FDSCxDQUFDO0lBQ0osQ0FBQztDQU9GO0FBRUQsU0FBUyxlQUFlLENBQUMsS0FBbUIsRUFBRSxRQUFnQjtJQUM1RCxPQUFPO1FBQ0wsWUFBWSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFBLDhCQUFxQixHQUFFLEVBQUUsY0FBYyxDQUFDO0tBQzNFLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxRQUFhO0lBQ3ZDLE9BQU87UUFDTCxpQkFBaUIsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxJQUFJLENBQUMsQ0FBQztLQUNyRSxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUNFLElBQUEsK0JBQWUsRUFBQyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUNyQyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsa0JBQXlCLENBQUMsQ0FDNUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IENvbXBvbmVudEV4LCBUb29sYmFySWNvbiwgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IHNldFByaW9yaXR5VHlwZSB9IGZyb20gJy4uL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyBnZXRQcmlvcml0eVR5cGVCcmFuY2ggfSBmcm9tICcuLi9jb21tb24nO1xyXG5pbXBvcnQgeyBQcmlvcml0eVR5cGUgfSBmcm9tICcuLi9wcmlvcml0eU1hbmFnZXInO1xyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgcHJpb3JpdHlUeXBlOiBQcmlvcml0eVR5cGU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xyXG4gIG9uU2V0UHJpb3JpdHlUeXBlOiAodHlwZTogc3RyaW5nKSA9PiB2b2lkO1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElDb25uZWN0ZWRQcm9wcyAmIElBY3Rpb25Qcm9wcztcclxuY29uc3QgVEJJID0gVG9vbGJhckljb24gYXMgYW55O1xyXG5jbGFzcyBQcmlvcml0eVR5cGVCdXR0b24gZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIHt9PiB7XHJcbiAgcHVibGljIHJlbmRlcigpOiBKU1guRWxlbWVudCB7XHJcbiAgICBjb25zdCB7IHQsIHByaW9yaXR5VHlwZSB9ID0gdGhpcy5wcm9wcztcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8VEJJXHJcbiAgICAgICAgaWQ9J3N3aXRjaC1wcmlvcml0eS10eXBlLWJ1dHRvbidcclxuICAgICAgICBpY29uPSdzb3J0LW5vbmUnXHJcbiAgICAgICAgdGV4dD17cHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnID8gdCgnVG8gUHJlZml4IEJhc2VkJykgOiB0KCdUbyBQb3NpdGlvbiBCYXNlZCcpfVxyXG4gICAgICAgIHRvb2x0aXA9e3QoJ0NoYW5nZXMgcHJpb3JpdHkgYXNzaWdubWVudCByZXN0cmljdGlvbnMgLSBwcmVmaXggYmFzZWQgaXMgJ1xyXG4gICAgICAgICAgICAgICAgKyAnbGVzcyByZXN0cmljdGl2ZSBhbmQgYWxsb3dzIHlvdSB0byBtYW51YWxseSBzZXQgcHJpb3JpdGllcyBsaWtlICdcclxuICAgICAgICAgICAgICAgICsgJ1wiNTAwMFwiLCB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsIHJlc3RyaWN0IHByaW9yaXRpZXMgdG8gdGhlaXIgJ1xyXG4gICAgICAgICAgICAgICAgKyAncG9zaXRpb24gaW4gdGhlIGxvYWQgb3JkZXIgcGFnZSAoaW4gYW4gaW5jcmVtZW50YWwgbWFubmVyKScpfVxyXG4gICAgICAgIG9uQ2xpY2s9e3RoaXMuc3dpdGNofVxyXG4gICAgICAvPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3dpdGNoID0gKCkgPT4ge1xyXG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMucHJvcHMucHJpb3JpdHlUeXBlO1xyXG4gICAgdGhpcy5wcm9wcy5vblNldFByaW9yaXR5VHlwZSgoY3VycmVudCA9PT0gJ3Bvc2l0aW9uLWJhc2VkJylcclxuICAgICAgPyAncHJlZml4LWJhc2VkJyA6ICdwb3NpdGlvbi1iYXNlZCcpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIHJldHVybiB7XHJcbiAgICBwcmlvcml0eVR5cGU6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uU2V0UHJpb3JpdHlUeXBlOiAodHlwZTogc3RyaW5nKSA9PiBkaXNwYXRjaChzZXRQcmlvcml0eVR5cGUodHlwZSkpLFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0XHJcbiAgd2l0aFRyYW5zbGF0aW9uKFsnY29tbW9uJywgJ3dpdGNoZXIzJ10pKFxyXG4gICAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoUHJpb3JpdHlUeXBlQnV0dG9uIGFzIGFueSksXHJcbiAgKSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczx7fT47XHJcbiJdfQ==