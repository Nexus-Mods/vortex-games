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
    var _a;
    const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
    return {
        profileId,
        autoSortOnDeploy: vortex_api_1.util.getSafe(state, ['settings', 'mountandblade2', 'sortOnDeploy', profileId], true),
    };
}
exports.default = (0, react_i18next_1.withTranslation)(['common', 'mnb2-settings'])((0, react_redux_1.connect)(mapStateToProps)(Settings));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBQy9CLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFDdEMsMkNBQWtFO0FBY2xFLFNBQVMsUUFBUSxDQUFDLEtBQWE7SUFDN0IsTUFBTSxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxLQUFLLENBQUM7SUFDcEUsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzVDLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckM7SUFDSCxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7SUFFeEIsT0FBTyxDQUNMO1FBQ0Usb0JBQUMsbUJBQU0sSUFDTCxPQUFPLEVBQUUsZ0JBQWdCLEVBQ3pCLFFBQVEsRUFBRSxTQUFTO1lBRWxCLENBQUMsQ0FBQyxrREFBa0QsQ0FBQztZQUN0RCxvQkFBQyxpQkFBSSxJQUFDLEVBQUUsRUFBQyxtQkFBbUIsRUFBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLElBQzNELENBQUMsQ0FBQyxpRkFBaUY7a0JBQ2pGLHNFQUFzRTtrQkFDdEUsZ0ZBQWdGO2tCQUNoRixxQkFBcUIsQ0FBQyxDQUNwQixDQUNBLENBQ0wsQ0FDUCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQVU7O0lBQ2pDLE1BQU0sU0FBUyxHQUFXLE1BQUEsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLDBDQUFFLEVBQUUsQ0FBQztJQUM3RCxPQUFPO1FBQ0wsU0FBUztRQUNULGdCQUFnQixFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDbEMsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQztLQUNuRSxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUNFLElBQUEsK0JBQWUsRUFBQyxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUMxQyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxDQUFDLENBQ3RCLFFBQVEsQ0FBUSxDQUE2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEkxOG5leHQgZnJvbSAnaTE4bmV4dCc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IE1vcmUsIFRvZ2dsZSwgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIHQ6IHR5cGVvZiBJMThuZXh0LnQ7XHJcbiAgb25TZXRTb3J0T25EZXBsb3k6IChwcm9maWxlSWQ6IHN0cmluZywgc29ydDogYm9vbGVhbikgPT4gdm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgcHJvZmlsZUlkOiBzdHJpbmc7XHJcbiAgYXV0b1NvcnRPbkRlcGxveTogYm9vbGVhbjtcclxufVxyXG5cclxudHlwZSBJUHJvcHMgPSBJQmFzZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xyXG5cclxuZnVuY3Rpb24gU2V0dGluZ3MocHJvcHM6IElQcm9wcykge1xyXG4gIGNvbnN0IHsgdCwgYXV0b1NvcnRPbkRlcGxveSwgb25TZXRTb3J0T25EZXBsb3ksIHByb2ZpbGVJZCB9ID0gcHJvcHM7XHJcbiAgY29uc3Qgb25TZXRTb3J0ID0gUmVhY3QudXNlQ2FsbGJhY2soKHZhbHVlKSA9PiB7XHJcbiAgICBpZiAocHJvZmlsZUlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgb25TZXRTb3J0T25EZXBsb3kocHJvZmlsZUlkLCB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgfSwgW29uU2V0U29ydE9uRGVwbG95XSk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2PlxyXG4gICAgICA8VG9nZ2xlXHJcbiAgICAgICAgY2hlY2tlZD17YXV0b1NvcnRPbkRlcGxveX1cclxuICAgICAgICBvblRvZ2dsZT17b25TZXRTb3J0fVxyXG4gICAgICA+XHJcbiAgICAgICAge3QoJ1NvcnQgQmFubmVybG9yZCBtb2RzIGF1dG9tYXRpY2FsbHkgb24gZGVwbG95bWVudCcpfVxyXG4gICAgICAgIDxNb3JlIGlkPSdtbmIyLXNvcnQtc2V0dGluZycgbmFtZT17dCgnUnVubmluZyBzb3J0IG9uIGRlcGxveScpfT5cclxuICAgICAgICAgIHt0KCdBbnkgdGltZSB5b3UgZGVwbG95LCBWb3J0ZXggd2lsbCBhdHRlbXB0IHRvIGF1dG9tYXRpY2FsbHkgc29ydCB5b3VyIGxvYWQgb3JkZXIgJ1xyXG4gICAgICAgICAgICsgJ2ZvciB5b3UgdG8gcmVkdWNlIGdhbWUgY3Jhc2hlcyBjYXVzZWQgYnkgaW5jb3JyZWN0IG1vZHVsZSBvcmRlci5cXG5cXG4nXHJcbiAgICAgICAgICAgKyAnSW1wb3J0YW50OiBQbGVhc2UgZW5zdXJlIHRvIGxvY2sgYW55IGxvYWQgb3JkZXIgZW50cmllcyB5b3Ugd2lzaCB0byBzdG9wIGZyb20gJ1xyXG4gICAgICAgICAgICsgJ3NoaWZ0aW5nIHBvc2l0aW9ucy4nKX1cclxuICAgICAgICA8L01vcmU+XHJcbiAgICAgIDwvVG9nZ2xlPlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiBhbnkpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIGNvbnN0IHByb2ZpbGVJZDogc3RyaW5nID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuICByZXR1cm4ge1xyXG4gICAgcHJvZmlsZUlkLFxyXG4gICAgYXV0b1NvcnRPbkRlcGxveTogdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJ21vdW50YW5kYmxhZGUyJywgJ3NvcnRPbkRlcGxveScsIHByb2ZpbGVJZF0sIHRydWUpLFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFxyXG4gIHdpdGhUcmFuc2xhdGlvbihbJ2NvbW1vbicsICdtbmIyLXNldHRpbmdzJ10pKFxyXG4gICAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMpKFxyXG4gICAgICBTZXR0aW5ncykgYXMgYW55KSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczx7fT47XHJcbiJdfQ==