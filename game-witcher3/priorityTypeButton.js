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
        return (React.createElement(vortex_api_1.ToolbarIcon, { id: 'switch-priority-type-button', icon: 'savegame', text: priorityType === 'position-based' ? t('To Prefix Based') : t('To Position Based'), tooltip: t('Changes priority assignment restrictions - prefix based is '
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlUeXBlQnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlUeXBlQnV0dG9uLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsaURBQWdEO0FBQ2hELDZDQUFzQztBQUN0QywyQ0FBbUU7QUFFbkUsdUNBQTRDO0FBQzVDLHFDQUFpRDtBQWFqRCxNQUFNLGtCQUFtQixTQUFRLHdCQUF1QjtJQUF4RDs7UUFrQlUsV0FBTSxHQUFHLEdBQUcsRUFBRTtZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztZQUN4QyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxLQUFLLGdCQUFnQixDQUFDO2dCQUN6RCxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQTtJQUNILENBQUM7SUF0QlEsTUFBTTtRQUNYLE1BQU0sRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUV2QyxPQUFPLENBQ0wsb0JBQUMsd0JBQVcsSUFDVixFQUFFLEVBQUMsNkJBQTZCLEVBQ2hDLElBQUksRUFBQyxVQUFVLEVBQ2YsSUFBSSxFQUFFLFlBQVksS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxFQUN2RixPQUFPLEVBQUUsQ0FBQyxDQUFDLDZEQUE2RDtrQkFDOUQsa0VBQWtFO2tCQUNsRSxpRUFBaUU7a0JBQ2pFLDREQUE0RCxDQUFDLEVBQ3ZFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUNwQixDQUNILENBQUM7SUFDSixDQUFDO0NBT0Y7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFtQixFQUFFLFFBQWdCO0lBQzVELE9BQU87UUFDTCxZQUFZLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLDhCQUFxQixFQUFFLEVBQUUsY0FBYyxDQUFDO0tBQzNFLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxRQUFhO0lBQ3ZDLE9BQU87UUFDTCxpQkFBaUIsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLHlCQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDckUsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFDRSwrQkFBZSxDQUFDLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQ3JDLHFCQUFPLENBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IENvbXBvbmVudEV4LCBUb29sYmFySWNvbiwgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IHNldFByaW9yaXR5VHlwZSB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IGdldFByaW9yaXR5VHlwZUJyYW5jaCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgUHJpb3JpdHlUeXBlIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgcHJpb3JpdHlUeXBlOiBQcmlvcml0eVR5cGU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xyXG4gIG9uU2V0UHJpb3JpdHlUeXBlOiAodHlwZTogc3RyaW5nKSA9PiB2b2lkO1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElDb25uZWN0ZWRQcm9wcyAmIElBY3Rpb25Qcm9wcztcclxuXHJcbmNsYXNzIFByaW9yaXR5VHlwZUJ1dHRvbiBleHRlbmRzIENvbXBvbmVudEV4PElQcm9wcywge30+IHtcclxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcclxuICAgIGNvbnN0IHsgdCwgcHJpb3JpdHlUeXBlIH0gPSB0aGlzLnByb3BzO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxUb29sYmFySWNvblxyXG4gICAgICAgIGlkPSdzd2l0Y2gtcHJpb3JpdHktdHlwZS1idXR0b24nXHJcbiAgICAgICAgaWNvbj0nc2F2ZWdhbWUnXHJcbiAgICAgICAgdGV4dD17cHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnID8gdCgnVG8gUHJlZml4IEJhc2VkJykgOiB0KCdUbyBQb3NpdGlvbiBCYXNlZCcpfVxyXG4gICAgICAgIHRvb2x0aXA9e3QoJ0NoYW5nZXMgcHJpb3JpdHkgYXNzaWdubWVudCByZXN0cmljdGlvbnMgLSBwcmVmaXggYmFzZWQgaXMgJ1xyXG4gICAgICAgICAgICAgICAgKyAnbGVzcyByZXN0cmljdGl2ZSBhbmQgYWxsb3dzIHlvdSB0byBtYW51YWxseSBzZXQgcHJpb3JpdGllcyBsaWtlICdcclxuICAgICAgICAgICAgICAgICsgJ1wiNTAwMFwiLCB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsIHJlc3RyaWN0IHByaW9yaXRpZXMgdG8gdGhlaXIgJ1xyXG4gICAgICAgICAgICAgICAgKyAncG9zaXRpb24gaW4gdGhlIGxvYWQgb3JkZXIgcGFnZSAoaW4gYW4gaW5jcmVtZW50YWwgbWFubmVyKScpfVxyXG4gICAgICAgIG9uQ2xpY2s9e3RoaXMuc3dpdGNofVxyXG4gICAgICAvPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3dpdGNoID0gKCkgPT4ge1xyXG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMucHJvcHMucHJpb3JpdHlUeXBlO1xyXG4gICAgdGhpcy5wcm9wcy5vblNldFByaW9yaXR5VHlwZSgoY3VycmVudCA9PT0gJ3Bvc2l0aW9uLWJhc2VkJylcclxuICAgICAgPyAncHJlZml4LWJhc2VkJyA6ICdwb3NpdGlvbi1iYXNlZCcpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIHJldHVybiB7XHJcbiAgICBwcmlvcml0eVR5cGU6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uU2V0UHJpb3JpdHlUeXBlOiAodHlwZTogc3RyaW5nKSA9PiBkaXNwYXRjaChzZXRQcmlvcml0eVR5cGUodHlwZSkpLFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0XHJcbiAgd2l0aFRyYW5zbGF0aW9uKFsnY29tbW9uJywgJ3dpdGNoZXIzJ10pKFxyXG4gICAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoUHJpb3JpdHlUeXBlQnV0dG9uKSxcclxuICApIGFzIFJlYWN0LkNvbXBvbmVudENsYXNzPHt9PjtcclxuIl19