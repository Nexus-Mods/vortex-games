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
const util_1 = require("./util");
const vortex_api_1 = require("vortex-api");
const NAMESPACE = 'generic-load-order-extension';
class CollectionsDataView extends vortex_api_1.ComponentEx {
    constructor(props) {
        super(props);
        this.openLoadOrderPage = () => {
            this.context.api.events.emit('show-main-page', 'generic-loadorder');
        };
        this.renderOpenLOButton = () => {
            const { t } = this.props;
            return (React.createElement(react_bootstrap_1.Button, { id: 'btn-more-mods', className: 'collection-add-mods-btn', onClick: this.openLoadOrderPage, bsStyle: 'ghost' }, t('Open Load Order Page')));
        };
        this.renderPlaceholder = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.EmptyPlaceholder, { icon: 'sort-none', text: t('You have no load order entries (for the current mods in the collection)'), subtext: this.renderOpenLOButton() }));
        };
        this.renderModEntry = (loId) => {
            const { mods } = this.props;
            const { sortedMods } = this.state;
            const loEntry = this.state.sortedMods[loId];
            const idx = this.state.sortedMods.indexOf(loId);
            const key = `${idx}-${loId}`;
            const modId = (0, util_1.getModId)(mods, loId);
            const name = vortex_api_1.util.renderModName(this.props.mods[modId]) || modId;
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, idx),
                    React.createElement("p", null, name))));
        };
        const { loadOrder, mods, collection } = props;
        this.initState({
            sortedMods: (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection) || [],
        });
    }
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
        return (sortedMods !== state.sortedMods) ? { sortedMods } : null;
    }
    componentDidMount() {
        const { loadOrder, mods, collection } = this.props;
        this.nextState.sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && Object.keys(sortedMods).length !== 0)
            ? (React.createElement("div", { style: { overflow: 'auto' } },
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('Below is a preview of the load order for the mods that ' +
                    'are included in the current collection. If you wish to modify the load ' +
                    'please do so by opening the Load Order page; any changes made there ' +
                    'will be reflected in this collection.')),
                React.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, sortedMods.map(this.renderModEntry)))) : this.renderPlaceholder();
    }
}
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    let loadOrder = [];
    if (!!(profile === null || profile === void 0 ? void 0 : profile.gameId)) {
        loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], []);
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
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQixxREFBbUU7QUFDbkUsaURBQWdEO0FBQ2hELDZDQUFzQztBQUV0QyxpQ0FBMEQ7QUFFMUQsMkNBQ29EO0FBRXBELE1BQU0sU0FBUyxHQUFXLDhCQUE4QixDQUFDO0FBdUJ6RCxNQUFNLG1CQUFvQixTQUFRLHdCQUFvQztJQU9wRSxZQUFZLEtBQWE7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBaUNQLHNCQUFpQixHQUFHLEdBQUcsRUFBRTtZQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDdEUsQ0FBQyxDQUFBO1FBQ08sdUJBQWtCLEdBQUcsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxvQkFBQyx3QkFBTSxJQUNiLEVBQUUsRUFBQyxlQUFlLEVBQ2xCLFNBQVMsRUFBQyx5QkFBeUIsRUFDbkMsT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFDL0IsT0FBTyxFQUFDLE9BQU8sSUFFZCxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FDbkIsQ0FBQyxDQUFDO1FBQ2IsQ0FBQyxDQUFBO1FBRU8sc0JBQWlCLEdBQUcsR0FBRyxFQUFFO1lBQy9CLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLE9BQU8sQ0FDTCxvQkFBQyw2QkFBZ0IsSUFDZixJQUFJLEVBQUMsV0FBVyxFQUNoQixJQUFJLEVBQUUsQ0FBQyxDQUFDLHlFQUF5RSxDQUFDLEVBQ2xGLE9BQU8sRUFB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QUEscUJBQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FDMUMsbUJBQW1CLENBQVEsQ0FBa0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBCdXR0b24sIExpc3RHcm91cCwgTGlzdEdyb3VwSXRlbSB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbkxvYWRPcmRlciwgZ2V0TW9kSWQgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgQ29tcG9uZW50RXgsIEVtcHR5UGxhY2Vob2xkZXIsIEZsZXhMYXlvdXQsXHJcbiAgc2VsZWN0b3JzLCB0eXBlcywgVXNhZ2UsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmNvbnN0IE5BTUVTUEFDRTogc3RyaW5nID0gJ2dlbmVyaWMtbG9hZC1vcmRlci1leHRlbnNpb24nO1xyXG5cclxuaW50ZXJmYWNlIElFeHRlbmRlZEludGVyZmFjZVByb3BzIHtcclxuICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VTdGF0ZSB7XHJcbiAgc29ydGVkTW9kczogc3RyaW5nW107XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIGdhbWVJZDogc3RyaW5nO1xyXG4gIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH07XHJcbiAgbG9hZE9yZGVyOiBzdHJpbmdbXTtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XHJcbn1cclxuXHJcbnR5cGUgSVByb3BzID0gSUFjdGlvblByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XHJcbnR5cGUgSUNvbXBvbmVudFN0YXRlID0gSUJhc2VTdGF0ZTtcclxuXHJcbmNsYXNzIENvbGxlY3Rpb25zRGF0YVZpZXcgZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIElDb21wb25lbnRTdGF0ZT4ge1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKG5ld1Byb3BzOiBJUHJvcHMsIHN0YXRlOiBJQ29tcG9uZW50U3RhdGUpIHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBuZXdQcm9wcztcclxuICAgIGNvbnN0IHNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XHJcbiAgICByZXR1cm4gKHNvcnRlZE1vZHMgIT09IHN0YXRlLnNvcnRlZE1vZHMpID8geyBzb3J0ZWRNb2RzIH0gOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM6IElQcm9wcykge1xyXG4gICAgc3VwZXIocHJvcHMpO1xyXG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24gfSA9IHByb3BzO1xyXG4gICAgdGhpcy5pbml0U3RhdGUoe1xyXG4gICAgICBzb3J0ZWRNb2RzOiBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbikgfHwgW10sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjb21wb25lbnREaWRNb3VudCgpIHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSB0aGlzLnByb3BzO1xyXG4gICAgdGhpcy5uZXh0U3RhdGUuc29ydGVkTW9kcyA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW5kZXIoKTogSlNYLkVsZW1lbnQge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xyXG4gICAgcmV0dXJuICghIXNvcnRlZE1vZHMgJiYgT2JqZWN0LmtleXMoc29ydGVkTW9kcykubGVuZ3RoICE9PSAwKVxyXG4gICAgICA/IChcclxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XHJcbiAgICAgICAgICA8aDQ+e3QoJ0xvYWQgT3JkZXInKX08L2g0PlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnQmVsb3cgaXMgYSBwcmV2aWV3IG9mIHRoZSBsb2FkIG9yZGVyIGZvciB0aGUgbW9kcyB0aGF0ICcgK1xyXG4gICAgICAgICAgICAgJ2FyZSBpbmNsdWRlZCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLiBJZiB5b3Ugd2lzaCB0byBtb2RpZnkgdGhlIGxvYWQgJyArXHJcbiAgICAgICAgICAgICAncGxlYXNlIGRvIHNvIGJ5IG9wZW5pbmcgdGhlIExvYWQgT3JkZXIgcGFnZTsgYW55IGNoYW5nZXMgbWFkZSB0aGVyZSAnICtcclxuICAgICAgICAgICAgICd3aWxsIGJlIHJlZmxlY3RlZCBpbiB0aGlzIGNvbGxlY3Rpb24uJylcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDxMaXN0R3JvdXAgaWQ9J2NvbGxlY3Rpb25zLWxvYWQtb3JkZXItbGlzdCc+XHJcbiAgICAgICAgICAgIHtzb3J0ZWRNb2RzLm1hcCh0aGlzLnJlbmRlck1vZEVudHJ5KX1cclxuICAgICAgICAgIDwvTGlzdEdyb3VwPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3BlbkxvYWRPcmRlclBhZ2UgPSAoKSA9PiB7XHJcbiAgICB0aGlzLmNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdzaG93LW1haW4tcGFnZScsICdnZW5lcmljLWxvYWRvcmRlcicpO1xyXG4gIH1cclxuICBwcml2YXRlIHJlbmRlck9wZW5MT0J1dHRvbiA9ICgpID0+IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoPEJ1dHRvblxyXG4gICAgICBpZD0nYnRuLW1vcmUtbW9kcydcclxuICAgICAgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWFkZC1tb2RzLWJ0bidcclxuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cclxuICAgICAgYnNTdHlsZT0nZ2hvc3QnXHJcbiAgICA+XHJcbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxyXG4gICAgPC9CdXR0b24+KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyUGxhY2Vob2xkZXIgPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8RW1wdHlQbGFjZWhvbGRlclxyXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcclxuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxyXG4gICAgICAgIHN1YnRleHQ9e3RoaXMucmVuZGVyT3BlbkxPQnV0dG9uKCl9XHJcbiAgICAgIC8+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChsb0lkOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IHsgbW9kcyB9ID0gdGhpcy5wcm9wcztcclxuICAgIGNvbnN0IHsgc29ydGVkTW9kcyB9ID0gdGhpcy5zdGF0ZTtcclxuICAgIGNvbnN0IGxvRW50cnk6IHN0cmluZyA9IHRoaXMuc3RhdGUuc29ydGVkTW9kc1tsb0lkXTtcclxuICAgIGNvbnN0IGlkeCA9IHRoaXMuc3RhdGUuc29ydGVkTW9kcy5pbmRleE9mKGxvSWQpO1xyXG4gICAgY29uc3Qga2V5ID0gYCR7aWR4fS0ke2xvSWR9YDtcclxuICAgIGNvbnN0IG1vZElkID0gZ2V0TW9kSWQobW9kcywgbG9JZCk7XHJcbiAgICBjb25zdCBuYW1lID0gdXRpbC5yZW5kZXJNb2ROYW1lKHRoaXMucHJvcHMubW9kc1ttb2RJZF0pIHx8IG1vZElkO1xyXG4gICAgY29uc3QgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeScsICdjb2xsZWN0aW9uLXRhYiddO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPExpc3RHcm91cEl0ZW1cclxuICAgICAgICBrZXk9e2tleX1cclxuICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxyXG4gICAgICA+XHJcbiAgICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93Jz5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT0nbG9hZC1vcmRlci1pbmRleCc+e2lkeH08L3A+XHJcbiAgICAgICAgICA8cD57bmFtZX08L3A+XHJcbiAgICAgICAgPC9GbGV4TGF5b3V0PlxyXG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSkgfHwgdW5kZWZpbmVkO1xyXG4gIGxldCBsb2FkT3JkZXI6IHN0cmluZ1tdID0gW107XHJcbiAgaWYgKCEhcHJvZmlsZT8uZ2FtZUlkKSB7XHJcbiAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgW10pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGdhbWVJZDogcHJvZmlsZT8uZ2FtZUlkLFxyXG4gICAgbG9hZE9yZGVyLFxyXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkXSwge30pLFxyXG4gICAgcHJvZmlsZSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XHJcbiAgcmV0dXJuIHt9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcclxuICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShcclxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcpIGFzIGFueSkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8SUV4dGVuZGVkSW50ZXJmYWNlUHJvcHM+O1xyXG4iXX0=