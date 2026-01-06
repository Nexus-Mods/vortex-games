"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Settings;
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const react_i18next_1 = require("react-i18next");
const react_bootstrap_1 = require("react-bootstrap");
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function Settings(props) {
    const { t } = (0, react_i18next_1.useTranslation)(common_1.I18N_NAMESPACE);
    const { onSelectUDF } = props;
    const connectedProps = (0, react_redux_1.useSelector)(mapStateToProps);
    const [currentUDF, setUDF] = react_1.default.useState(path_1.default.join(connectedProps.udf, 'Mods'));
    const onSelectUDFHandler = react_1.default.useCallback(() => {
        onSelectUDF().then((res) => {
            if (res) {
                setUDF(path_1.default.join(res, 'Mods'));
            }
        });
    }, [onSelectUDF]);
    return (react_1.default.createElement("form", { id: `${common_1.GAME_ID}-settings-form` },
        react_1.default.createElement(react_bootstrap_1.FormGroup, { controlId: 'default-enable' },
            react_1.default.createElement(react_bootstrap_1.ControlLabel, { className: `${common_1.GAME_ID}-settings-heading` }, t('7DTD Settings')),
            react_1.default.createElement(react_bootstrap_1.Panel, { key: `${common_1.GAME_ID}-user-default-folder` },
                react_1.default.createElement(react_bootstrap_1.Panel.Body, null,
                    react_1.default.createElement(react_bootstrap_1.ControlLabel, { className: `${common_1.GAME_ID}-settings-subheading` },
                        t('Current User Default Folder'),
                        react_1.default.createElement(vortex_api_1.More, { id: 'more-udf', name: t('Set User Data Folder') }, t('This will allow you to re-select the User Data Folder (UDF) for 7 Days to Die.'))),
                    react_1.default.createElement(react_bootstrap_1.InputGroup, null,
                        react_1.default.createElement(react_bootstrap_1.FormControl, { className: 'install-path-input', disabled: true, value: currentUDF }),
                        react_1.default.createElement(react_bootstrap_1.Button, { onClick: onSelectUDFHandler },
                            react_1.default.createElement(vortex_api_1.Icon, { name: 'browse' }))))))));
}
function mapStateToProps(state) {
    return {
        udf: vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'udf'], ''),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFpQkEsMkJBMENDO0FBM0RELGdEQUF3QjtBQUN4QixrREFBMEI7QUFDMUIsNkNBQTBDO0FBQzFDLGlEQUErQztBQUMvQyxxREFBb0g7QUFDcEgsMkNBQThDO0FBRTlDLHFDQUFtRDtBQVVuRCxTQUF3QixRQUFRLENBQUMsS0FBYTtJQUM1QyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBQSw4QkFBYyxFQUFDLHVCQUFjLENBQUMsQ0FBQztJQUM3QyxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQzlCLE1BQU0sY0FBYyxHQUFHLElBQUEseUJBQVcsRUFBQyxlQUFlLENBQUMsQ0FBQztJQUNwRCxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxHQUFHLGVBQUssQ0FBQyxRQUFRLENBQVMsY0FBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFM0YsTUFBTSxrQkFBa0IsR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtRQUNoRCxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUN6QixJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNSLE1BQU0sQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEIsT0FBTyxDQUNMLHdDQUFNLEVBQUUsRUFBRSxHQUFHLGdCQUFPLGdCQUFnQjtRQUNsQyw4QkFBQywyQkFBUyxJQUFDLFNBQVMsRUFBQyxnQkFBZ0I7WUFDbkMsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxtQkFBbUIsSUFBRyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQWdCO1lBQzNGLDhCQUFDLHVCQUFLLElBQUMsR0FBRyxFQUFFLEdBQUcsZ0JBQU8sc0JBQXNCO2dCQUMxQyw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxzQkFBc0I7d0JBQ3RELENBQUMsQ0FBQyw2QkFBNkIsQ0FBQzt3QkFDakMsOEJBQUMsaUJBQUksSUFBQyxFQUFFLEVBQUMsVUFBVSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsc0JBQXNCLENBQUMsSUFDaEQsQ0FBQyxDQUFDLGdGQUFnRixDQUFDLENBQy9FLENBQ007b0JBQ2YsOEJBQUMsNEJBQVU7d0JBQ1QsOEJBQUMsNkJBQVcsSUFDVixTQUFTLEVBQUMsb0JBQW9CLEVBQzlCLFFBQVEsRUFBRSxJQUFJLEVBQ2QsS0FBSyxFQUFFLFVBQVUsR0FDakI7d0JBQ0YsOEJBQUMsd0JBQU0sSUFDTCxPQUFPLEVBQUUsa0JBQWtCOzRCQUUzQiw4QkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxRQUFRLEdBQUcsQ0FDZixDQUNFLENBQ0YsQ0FDUCxDQUNFLENBQ1AsQ0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQVU7SUFDakMsT0FBTztRQUNMLEdBQUcsRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQztLQUNoRSxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcclxuaW1wb3J0IHsgQnV0dG9uLCBGb3JtR3JvdXAsIENvbnRyb2xMYWJlbCwgSW5wdXRHcm91cCwgRm9ybUNvbnRyb2wsIEhlbHBCbG9jaywgUGFuZWwsIExhYmVsIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgSWNvbiwgTW9yZSwgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSTE4Tl9OQU1FU1BBQ0UgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbnRlcmZhY2UgSVByb3BzIHtcclxuICBvblNlbGVjdFVERjogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcclxuICB1ZGY6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU2V0dGluZ3MocHJvcHM6IElQcm9wcykge1xyXG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oSTE4Tl9OQU1FU1BBQ0UpO1xyXG4gIGNvbnN0IHsgb25TZWxlY3RVREYgfSA9IHByb3BzO1xyXG4gIGNvbnN0IGNvbm5lY3RlZFByb3BzID0gdXNlU2VsZWN0b3IobWFwU3RhdGVUb1Byb3BzKTtcclxuICBjb25zdCBbY3VycmVudFVERiwgc2V0VURGXSA9IFJlYWN0LnVzZVN0YXRlPHN0cmluZz4ocGF0aC5qb2luKGNvbm5lY3RlZFByb3BzLnVkZiwgJ01vZHMnKSk7XHJcblxyXG4gIGNvbnN0IG9uU2VsZWN0VURGSGFuZGxlciA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcclxuICAgIG9uU2VsZWN0VURGKCkudGhlbigocmVzKSA9PiB7XHJcbiAgICAgIGlmIChyZXMpIHtcclxuICAgICAgICBzZXRVREYocGF0aC5qb2luKHJlcywgJ01vZHMnKSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sIFtvblNlbGVjdFVERl0pO1xyXG4gIHJldHVybiAoXHJcbiAgICA8Zm9ybSBpZD17YCR7R0FNRV9JRH0tc2V0dGluZ3MtZm9ybWB9PlxyXG4gICAgICA8Rm9ybUdyb3VwIGNvbnRyb2xJZD0nZGVmYXVsdC1lbmFibGUnPlxyXG4gICAgICAgIDxDb250cm9sTGFiZWwgY2xhc3NOYW1lPXtgJHtHQU1FX0lEfS1zZXR0aW5ncy1oZWFkaW5nYH0+e3QoJzdEVEQgU2V0dGluZ3MnKX08L0NvbnRyb2xMYWJlbD5cclxuICAgICAgICA8UGFuZWwga2V5PXtgJHtHQU1FX0lEfS11c2VyLWRlZmF1bHQtZm9sZGVyYH0+XHJcbiAgICAgICAgICA8UGFuZWwuQm9keT5cclxuICAgICAgICAgICAgPENvbnRyb2xMYWJlbCBjbGFzc05hbWU9e2Ake0dBTUVfSUR9LXNldHRpbmdzLXN1YmhlYWRpbmdgfT5cclxuICAgICAgICAgICAgICB7dCgnQ3VycmVudCBVc2VyIERlZmF1bHQgRm9sZGVyJyl9XHJcbiAgICAgICAgICAgICAgPE1vcmUgaWQ9J21vcmUtdWRmJyBuYW1lPXt0KCdTZXQgVXNlciBEYXRhIEZvbGRlcicpfSA+XHJcbiAgICAgICAgICAgICAgICB7dCgnVGhpcyB3aWxsIGFsbG93IHlvdSB0byByZS1zZWxlY3QgdGhlIFVzZXIgRGF0YSBGb2xkZXIgKFVERikgZm9yIDcgRGF5cyB0byBEaWUuJyl9XHJcbiAgICAgICAgICAgICAgPC9Nb3JlPlxyXG4gICAgICAgICAgICA8L0NvbnRyb2xMYWJlbD5cclxuICAgICAgICAgICAgPElucHV0R3JvdXA+XHJcbiAgICAgICAgICAgICAgPEZvcm1Db250cm9sXHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9J2luc3RhbGwtcGF0aC1pbnB1dCdcclxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0cnVlfVxyXG4gICAgICAgICAgICAgICAgdmFsdWU9e2N1cnJlbnRVREZ9XHJcbiAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICA8QnV0dG9uXHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXtvblNlbGVjdFVERkhhbmRsZXJ9XHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPEljb24gbmFtZT0nYnJvd3NlJyAvPlxyXG4gICAgICAgICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICAgICAgICA8L0lucHV0R3JvdXA+XHJcbiAgICAgICAgICA8L1BhbmVsLkJvZHk+XHJcbiAgICAgICAgPC9QYW5lbD5cclxuICAgICAgPC9Gb3JtR3JvdXA+XHJcbiAgICA8L2Zvcm0+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiBhbnkpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIHJldHVybiB7XHJcbiAgICB1ZGY6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3VkZiddLCAnJyksXHJcbiAgfTtcclxufSJdfQ==