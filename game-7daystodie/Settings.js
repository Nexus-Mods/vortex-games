"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = Settings;
function mapStateToProps(state) {
    return {
        udf: vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'udf'], ''),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLDZDQUEwQztBQUMxQyxpREFBK0M7QUFDL0MscURBQW9IO0FBQ3BILDJDQUE4QztBQUU5QyxxQ0FBbUQ7QUFVbkQsU0FBd0IsUUFBUSxDQUFDLEtBQWE7SUFDNUMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsRUFBQyx1QkFBYyxDQUFDLENBQUM7SUFDN0MsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUM5QixNQUFNLGNBQWMsR0FBRyxJQUFBLHlCQUFXLEVBQUMsZUFBZSxDQUFDLENBQUM7SUFDcEQsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsR0FBRyxlQUFLLENBQUMsUUFBUSxDQUFTLGNBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRTNGLE1BQU0sa0JBQWtCLEdBQUcsZUFBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7UUFDaEQsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDekIsSUFBSSxHQUFHLEVBQUU7Z0JBQ1AsTUFBTSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDaEM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEIsT0FBTyxDQUNMLHdDQUFNLEVBQUUsRUFBRSxHQUFHLGdCQUFPLGdCQUFnQjtRQUNsQyw4QkFBQywyQkFBUyxJQUFDLFNBQVMsRUFBQyxnQkFBZ0I7WUFDbkMsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxtQkFBbUIsSUFBRyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQWdCO1lBQzNGLDhCQUFDLHVCQUFLLElBQUMsR0FBRyxFQUFFLEdBQUcsZ0JBQU8sc0JBQXNCO2dCQUMxQyw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxzQkFBc0I7d0JBQ3RELENBQUMsQ0FBQyw2QkFBNkIsQ0FBQzt3QkFDakMsOEJBQUMsaUJBQUksSUFBQyxFQUFFLEVBQUMsVUFBVSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsc0JBQXNCLENBQUMsSUFDaEQsQ0FBQyxDQUFDLGdGQUFnRixDQUFDLENBQy9FLENBQ007b0JBQ2YsOEJBQUMsNEJBQVU7d0JBQ1QsOEJBQUMsNkJBQVcsSUFDVixTQUFTLEVBQUMsb0JBQW9CLEVBQzlCLFFBQVEsRUFBRSxJQUFJLEVBQ2QsS0FBSyxFQUFFLFVBQVUsR0FDakI7d0JBQ0YsOEJBQUMsd0JBQU0sSUFDTCxPQUFPLEVBQUUsa0JBQWtCOzRCQUUzQiw4QkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxRQUFRLEdBQUcsQ0FDZixDQUNFLENBQ0YsQ0FDUCxDQUNFLENBQ1AsQ0FDUixDQUFDO0FBQ0osQ0FBQztBQTFDRCwyQkEwQ0M7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFVO0lBQ2pDLE9BQU87UUFDTCxHQUFHLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDaEUsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IEJ1dHRvbiwgRm9ybUdyb3VwLCBDb250cm9sTGFiZWwsIElucHV0R3JvdXAsIEZvcm1Db250cm9sLCBIZWxwQmxvY2ssIFBhbmVsLCBMYWJlbCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IEljb24sIE1vcmUsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW50ZXJmYWNlIElQcm9wcyB7XHJcbiAgb25TZWxlY3RVREY6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcclxufVxyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgdWRmOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFNldHRpbmdzKHByb3BzOiBJUHJvcHMpIHtcclxuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKEkxOE5fTkFNRVNQQUNFKTtcclxuICBjb25zdCB7IG9uU2VsZWN0VURGIH0gPSBwcm9wcztcclxuICBjb25zdCBjb25uZWN0ZWRQcm9wcyA9IHVzZVNlbGVjdG9yKG1hcFN0YXRlVG9Qcm9wcyk7XHJcbiAgY29uc3QgW2N1cnJlbnRVREYsIHNldFVERl0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KHBhdGguam9pbihjb25uZWN0ZWRQcm9wcy51ZGYsICdNb2RzJykpO1xyXG5cclxuICBjb25zdCBvblNlbGVjdFVERkhhbmRsZXIgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XHJcbiAgICBvblNlbGVjdFVERigpLnRoZW4oKHJlcykgPT4ge1xyXG4gICAgICBpZiAocmVzKSB7XHJcbiAgICAgICAgc2V0VURGKHBhdGguam9pbihyZXMsICdNb2RzJykpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LCBbb25TZWxlY3RVREZdKTtcclxuICByZXR1cm4gKFxyXG4gICAgPGZvcm0gaWQ9e2Ake0dBTUVfSUR9LXNldHRpbmdzLWZvcm1gfT5cclxuICAgICAgPEZvcm1Hcm91cCBjb250cm9sSWQ9J2RlZmF1bHQtZW5hYmxlJz5cclxuICAgICAgICA8Q29udHJvbExhYmVsIGNsYXNzTmFtZT17YCR7R0FNRV9JRH0tc2V0dGluZ3MtaGVhZGluZ2B9Pnt0KCc3RFREIFNldHRpbmdzJyl9PC9Db250cm9sTGFiZWw+XHJcbiAgICAgICAgPFBhbmVsIGtleT17YCR7R0FNRV9JRH0tdXNlci1kZWZhdWx0LWZvbGRlcmB9PlxyXG4gICAgICAgICAgPFBhbmVsLkJvZHk+XHJcbiAgICAgICAgICAgIDxDb250cm9sTGFiZWwgY2xhc3NOYW1lPXtgJHtHQU1FX0lEfS1zZXR0aW5ncy1zdWJoZWFkaW5nYH0+XHJcbiAgICAgICAgICAgICAge3QoJ0N1cnJlbnQgVXNlciBEZWZhdWx0IEZvbGRlcicpfVxyXG4gICAgICAgICAgICAgIDxNb3JlIGlkPSdtb3JlLXVkZicgbmFtZT17dCgnU2V0IFVzZXIgRGF0YSBGb2xkZXInKX0gPlxyXG4gICAgICAgICAgICAgICAge3QoJ1RoaXMgd2lsbCBhbGxvdyB5b3UgdG8gcmUtc2VsZWN0IHRoZSBVc2VyIERhdGEgRm9sZGVyIChVREYpIGZvciA3IERheXMgdG8gRGllLicpfVxyXG4gICAgICAgICAgICAgIDwvTW9yZT5cclxuICAgICAgICAgICAgPC9Db250cm9sTGFiZWw+XHJcbiAgICAgICAgICAgIDxJbnB1dEdyb3VwPlxyXG4gICAgICAgICAgICAgIDxGb3JtQ29udHJvbFxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPSdpbnN0YWxsLXBhdGgtaW5wdXQnXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17dHJ1ZX1cclxuICAgICAgICAgICAgICAgIHZhbHVlPXtjdXJyZW50VURGfVxyXG4gICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgPEJ1dHRvblxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17b25TZWxlY3RVREZIYW5kbGVyfVxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIDxJY29uIG5hbWU9J2Jyb3dzZScgLz5cclxuICAgICAgICAgICAgICA8L0J1dHRvbj5cclxuICAgICAgICAgICAgPC9JbnB1dEdyb3VwPlxyXG4gICAgICAgICAgPC9QYW5lbC5Cb2R5PlxyXG4gICAgICAgIDwvUGFuZWw+XHJcbiAgICAgIDwvRm9ybUdyb3VwPlxyXG4gICAgPC9mb3JtPlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogYW55KTogSUNvbm5lY3RlZFByb3BzIHtcclxuICByZXR1cm4ge1xyXG4gICAgdWRmOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICd1ZGYnXSwgJycpLFxyXG4gIH07XHJcbn0iXX0=