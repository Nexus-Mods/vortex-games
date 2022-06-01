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
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const constants_1 = require("../constants");
const loadorder_1 = require("../loadorder");
const NAMESPACE = 'game-morrowind';
class MorrowindCollectionsDataView extends vortex_api_1.ComponentEx {
    constructor(props) {
        super(props);
        this.renderLoadOrderEditInfo = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.FlexLayout, { type: 'row', id: 'collection-edit-loadorder-edit-info-container' },
                React.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'loadorder-edit-info-icon' },
                    React.createElement(vortex_api_1.Icon, { name: 'dialog-info' })),
                React.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'collection-edit-loadorder-edit-info' },
                    t('You can make changes to this data from the '),
                    React.createElement("a", { className: 'fake-link', onClick: this.openLoadOrderPage, title: t('Go to Load Order Page') }, t('Load Order page.')),
                    t(' If you believe a load order entry is missing, please ensure the '
                        + 'relevant mod is enabled and has been added to the collection.'))));
        };
        this.openLoadOrderPage = () => {
            this.props.api.events.emit('show-main-page', 'file-based-loadorder');
        };
        this.renderOpenLOButton = () => {
            const { t } = this.props;
            return (React.createElement(react_bootstrap_1.Button, { id: 'btn-more-mods', className: 'collection-add-mods-btn', onClick: this.openLoadOrderPage, bsStyle: 'ghost' }, t('Open Load Order Page')));
        };
        this.renderPlaceholder = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.EmptyPlaceholder, { icon: 'sort-none', text: t('You have no load order entries (for the current mods in the collection)'), subtext: this.renderOpenLOButton() }));
        };
        this.renderModEntry = (loEntry, idx) => {
            const key = loEntry.id + JSON.stringify(loEntry);
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, idx),
                    React.createElement("p", null, loEntry.name))));
        };
        this.initState({
            sortedMods: [],
        });
    }
    componentDidMount() {
        this.updateSortedMods();
    }
    componentDidUpdate(prevProps, prevState) {
        if (JSON.stringify(this.state.sortedMods) !== JSON.stringify(this.props.loadOrder)) {
            this.updateSortedMods();
        }
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && Object.keys(sortedMods).length !== 0)
            ? (React.createElement("div", { style: { overflow: 'auto' } },
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('This is a snapshot of the load order information that '
                    + 'will be exported with this collection.')),
                this.renderLoadOrderEditInfo(),
                React.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, sortedMods.map((entry, idx) => this.renderModEntry(entry, idx))))) : this.renderPlaceholder();
    }
    updateSortedMods() {
        var _a;
        const includedModIds = (((_a = this.props.collection) === null || _a === void 0 ? void 0 : _a.rules) || []).map(rule => rule.reference.id);
        const mods = Object.keys(this.props.mods).reduce((accum, iter) => {
            if (includedModIds.includes(iter)) {
                accum[iter] = this.props.mods[iter];
            }
            return accum;
        }, {});
        (0, loadorder_1.deserializeLoadOrder)(this.props.api, mods)
            .then(lo => {
            const filtered = lo.filter(entry => (constants_1.NATIVE_PLUGINS.includes(entry.id) || entry.modId !== undefined));
            this.nextState.sortedMods = filtered;
        });
    }
}
const empty = [];
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    let loadOrder = [];
    if (!!(profile === null || profile === void 0 ? void 0 : profile.gameId)) {
        loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], empty);
    }
    return {
        gameId: profile === null || profile === void 0 ? void 0 : profile.gameId,
        loadOrder,
        mods: vortex_api_1.util.getSafe(state, ['persistent', 'mods', profile.gameId], {}),
        profile,
    };
}
function mapDispatchToProps(dispatch) {
    return {};
}
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(MorrowindCollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQixxREFBbUU7QUFDbkUsaURBQWlFO0FBQ2pFLDZDQUFzQztBQUV0QywyQ0FDNkM7QUFJN0MsNENBQThDO0FBRTlDLDRDQUFvRDtBQUVwRCxNQUFNLFNBQVMsR0FBVyxnQkFBZ0IsQ0FBQztBQXVCM0MsTUFBTSw0QkFBNkIsU0FBUSx3QkFBb0M7SUFDN0UsWUFBWSxLQUFhO1FBQ3ZCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQWtEUCw0QkFBdUIsR0FBRyxHQUFHLEVBQUU7WUFDckMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDekIsT0FBTyxDQUNMLG9CQUFDLHVCQUFVLElBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsK0NBQStDO2dCQUN2RSxvQkFBQyx1QkFBVSxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMsMEJBQTBCO29CQUNwRCxvQkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxhQUFhLEdBQUUsQ0FDVDtnQkFDbkIsb0JBQUMsdUJBQVUsQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLHFDQUFxQztvQkFDOUQsQ0FBQyxDQUFDLDZDQUE2QyxDQUFDO29CQUNqRCwyQkFDRSxTQUFTLEVBQUMsV0FBVyxFQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUMvQixLQUFLLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLElBRWhDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUNwQjtvQkFDSCxDQUFDLENBQUMsbUVBQW1FOzBCQUNwRSwrREFBK0QsQ0FBQyxDQUNqRCxDQUNSLENBQ2QsQ0FBQztRQUNKLENBQUMsQ0FB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LENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0NBa0VGO0FBRUQsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLFNBQVMsZUFBZSxDQUFDLEtBQW1CLEVBQUUsUUFBZ0I7SUFDNUQsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDO0lBQzVELElBQUksU0FBUyxHQUFzQixFQUFFLENBQUM7SUFDdEMsSUFBSSxDQUFDLENBQUMsQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxDQUFBLEVBQUU7UUFDckIsU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pGO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTTtRQUN2QixTQUFTO1FBQ1QsSUFBSSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyRSxPQUFPO0tBQ1IsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQWE7SUFDdkMsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDO0FBRUQsa0JBQWUsSUFBQSwrQkFBZSxFQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQ25ELElBQUEscUJBQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FDMUMsNEJBQTRCLENBQVEsQ0FBK0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgQnV0dG9uLCBMaXN0R3JvdXAsIExpc3RHcm91cEl0ZW0gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBXaXRoVHJhbnNsYXRpb24sIHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgQ29tcG9uZW50RXgsIEVtcHR5UGxhY2Vob2xkZXIsIEZsZXhMYXlvdXQsIEljb24sXHJcbiAgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4uL3R5cGVzL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IE5BVElWRV9QTFVHSU5TIH0gZnJvbSAnLi4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCB7IGRlc2VyaWFsaXplTG9hZE9yZGVyIH0gZnJvbSAnLi4vbG9hZG9yZGVyJztcclxuXHJcbmNvbnN0IE5BTUVTUEFDRTogc3RyaW5nID0gJ2dhbWUtbW9ycm93aW5kJztcclxuXHJcbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcclxuICBzb3J0ZWRNb2RzOiBJTG9hZE9yZGVyRW50cnlbXTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgZ2FtZUlkOiBzdHJpbmc7XHJcbiAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfTtcclxuICBsb2FkT3JkZXI6IElMb2FkT3JkZXJFbnRyeVtdO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcclxufVxyXG5cclxudHlwZSBJUHJvcHMgPSBJQmFzZVByb3BzICYgSUFjdGlvblByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XHJcbnR5cGUgSUNvbXBvbmVudFN0YXRlID0gSUJhc2VTdGF0ZTtcclxuXHJcbmNsYXNzIE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcgZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIElDb21wb25lbnRTdGF0ZT4ge1xyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJUHJvcHMpIHtcclxuICAgIHN1cGVyKHByb3BzKTtcclxuICAgIHRoaXMuaW5pdFN0YXRlKHtcclxuICAgICAgc29ydGVkTW9kczogW10sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjb21wb25lbnREaWRNb3VudCgpIHtcclxuICAgIHRoaXMudXBkYXRlU29ydGVkTW9kcygpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IElQcm9wcywgcHJldlN0YXRlOiBJQmFzZVN0YXRlKTogdm9pZCB7XHJcbiAgICBpZiAoSlNPTi5zdHJpbmdpZnkodGhpcy5zdGF0ZS5zb3J0ZWRNb2RzKSAhPT0gSlNPTi5zdHJpbmdpZnkodGhpcy5wcm9wcy5sb2FkT3JkZXIpKXtcclxuICAgICAgdGhpcy51cGRhdGVTb3J0ZWRNb2RzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIGNvbnN0IHsgc29ydGVkTW9kcyB9ID0gdGhpcy5zdGF0ZTtcclxuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcclxuICAgICAgPyAoXHJcbiAgICAgICAgPGRpdiBzdHlsZT17eyBvdmVyZmxvdzogJ2F1dG8nIH19PlxyXG4gICAgICAgICAgPGg0Pnt0KCdMb2FkIE9yZGVyJyl9PC9oND5cclxuICAgICAgICAgIDxwPlxyXG4gICAgICAgICAge3QoJ1RoaXMgaXMgYSBzbmFwc2hvdCBvZiB0aGUgbG9hZCBvcmRlciBpbmZvcm1hdGlvbiB0aGF0ICdcclxuICAgICAgICAgICArICd3aWxsIGJlIGV4cG9ydGVkIHdpdGggdGhpcyBjb2xsZWN0aW9uLicpfVxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAge3RoaXMucmVuZGVyTG9hZE9yZGVyRWRpdEluZm8oKX1cclxuICAgICAgICAgIDxMaXN0R3JvdXAgaWQ9J2NvbGxlY3Rpb25zLWxvYWQtb3JkZXItbGlzdCc+XHJcbiAgICAgICAgICAgIHtzb3J0ZWRNb2RzLm1hcCgoZW50cnksIGlkeCkgPT4gdGhpcy5yZW5kZXJNb2RFbnRyeShlbnRyeSwgaWR4KSl9XHJcbiAgICAgICAgICA8L0xpc3RHcm91cD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICkgOiB0aGlzLnJlbmRlclBsYWNlaG9sZGVyKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZVNvcnRlZE1vZHMoKSB7XHJcbiAgICBjb25zdCBpbmNsdWRlZE1vZElkcyA9ICh0aGlzLnByb3BzLmNvbGxlY3Rpb24/LnJ1bGVzIHx8IFtdKS5tYXAocnVsZSA9PiBydWxlLnJlZmVyZW5jZS5pZCk7XHJcbiAgICBjb25zdCBtb2RzID0gT2JqZWN0LmtleXModGhpcy5wcm9wcy5tb2RzKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICAgIGlmIChpbmNsdWRlZE1vZElkcy5pbmNsdWRlcyhpdGVyKSkge1xyXG4gICAgICAgIGFjY3VtW2l0ZXJdID0gdGhpcy5wcm9wcy5tb2RzW2l0ZXJdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIHt9KVxyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXIodGhpcy5wcm9wcy5hcGksIG1vZHMpXHJcbiAgICAgIC50aGVuKGxvID0+IHtcclxuICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IGxvLmZpbHRlcihlbnRyeSA9PiAoTkFUSVZFX1BMVUdJTlMuaW5jbHVkZXMoZW50cnkuaWQpIHx8IGVudHJ5Lm1vZElkICE9PSB1bmRlZmluZWQpKTtcclxuICAgICAgICB0aGlzLm5leHRTdGF0ZS5zb3J0ZWRNb2RzID0gZmlsdGVyZWQ7XHJcbiAgICAgIH0pXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlckxvYWRPcmRlckVkaXRJbmZvID0gKCkgPT4ge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93JyBpZD0nY29sbGVjdGlvbi1lZGl0LWxvYWRvcmRlci1lZGl0LWluZm8tY29udGFpbmVyJz5cclxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2xvYWRvcmRlci1lZGl0LWluZm8taWNvbic+XHJcbiAgICAgICAgICA8SWNvbiBuYW1lPSdkaWFsb2ctaW5mbycvPlxyXG4gICAgICAgIDwvRmxleExheW91dC5GaXhlZD5cclxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvJz5cclxuICAgICAgICAgIHt0KCdZb3UgY2FuIG1ha2UgY2hhbmdlcyB0byB0aGlzIGRhdGEgZnJvbSB0aGUgJyl9XHJcbiAgICAgICAgICA8YVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9J2Zha2UtbGluaydcclxuICAgICAgICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cclxuICAgICAgICAgICAgdGl0bGU9e3QoJ0dvIHRvIExvYWQgT3JkZXIgUGFnZScpfVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICB7dCgnTG9hZCBPcmRlciBwYWdlLicpfVxyXG4gICAgICAgICAgPC9hPlxyXG4gICAgICAgICAge3QoJyBJZiB5b3UgYmVsaWV2ZSBhIGxvYWQgb3JkZXIgZW50cnkgaXMgbWlzc2luZywgcGxlYXNlIGVuc3VyZSB0aGUgJ1xyXG4gICAgICAgICAgKyAncmVsZXZhbnQgbW9kIGlzIGVuYWJsZWQgYW5kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBjb2xsZWN0aW9uLicpfVxyXG4gICAgICAgIDwvRmxleExheW91dC5GaXhlZD5cclxuICAgICAgPC9GbGV4TGF5b3V0PlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3BlbkxvYWRPcmRlclBhZ2UgPSAoKSA9PiB7XHJcbiAgICB0aGlzLnByb3BzLmFwaS5ldmVudHMuZW1pdCgnc2hvdy1tYWluLXBhZ2UnLCAnZmlsZS1iYXNlZC1sb2Fkb3JkZXInKTtcclxuICB9XHJcbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKDxCdXR0b25cclxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXHJcbiAgICAgIGNsYXNzTmFtZT0nY29sbGVjdGlvbi1hZGQtbW9kcy1idG4nXHJcbiAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XHJcbiAgICAgIGJzU3R5bGU9J2dob3N0J1xyXG4gICAgPlxyXG4gICAgICB7dCgnT3BlbiBMb2FkIE9yZGVyIFBhZ2UnKX1cclxuICAgIDwvQnV0dG9uPik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcclxuICAgICAgICBpY29uPSdzb3J0LW5vbmUnXHJcbiAgICAgICAgdGV4dD17dCgnWW91IGhhdmUgbm8gbG9hZCBvcmRlciBlbnRyaWVzIChmb3IgdGhlIGN1cnJlbnQgbW9kcyBpbiB0aGUgY29sbGVjdGlvbiknKX1cclxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxyXG4gICAgICAvPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyTW9kRW50cnkgPSAobG9FbnRyeTogSUxvYWRPcmRlckVudHJ5LCBpZHg6IG51bWJlcikgPT4ge1xyXG4gICAgY29uc3Qga2V5ID0gbG9FbnRyeS5pZCArIEpTT04uc3RyaW5naWZ5KGxvRW50cnkpO1xyXG4gICAgY29uc3QgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeScsICdjb2xsZWN0aW9uLXRhYiddO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPExpc3RHcm91cEl0ZW1cclxuICAgICAgICBrZXk9e2tleX1cclxuICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxyXG4gICAgICA+XHJcbiAgICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93Jz5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT0nbG9hZC1vcmRlci1pbmRleCc+e2lkeH08L3A+XHJcbiAgICAgICAgICA8cD57bG9FbnRyeS5uYW1lfTwvcD5cclxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XHJcbiAgICAgIDwvTGlzdEdyb3VwSXRlbT5cclxuICAgICk7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBlbXB0eSA9IFtdO1xyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKSB8fCB1bmRlZmluZWQ7XHJcbiAgbGV0IGxvYWRPcmRlcjogSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcclxuICBpZiAoISFwcm9maWxlPy5nYW1lSWQpIHtcclxuICAgIGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCBlbXB0eSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZ2FtZUlkOiBwcm9maWxlPy5nYW1lSWQsXHJcbiAgICBsb2FkT3JkZXIsXHJcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWRdLCB7fSksXHJcbiAgICBwcm9maWxlLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcclxuICByZXR1cm4ge307XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHdpdGhUcmFuc2xhdGlvbihbJ2NvbW1vbicsIE5BTUVTUEFDRV0pKFxyXG4gIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMpKFxyXG4gICAgTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldykgYXMgYW55KSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczxJQmFzZVByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHM+O1xyXG4iXX0=