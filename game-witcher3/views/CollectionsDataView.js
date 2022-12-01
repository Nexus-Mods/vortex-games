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
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const util_1 = require("../collections/util");
const NAMESPACE = 'generic-load-order-extension';
class CollectionsDataView extends vortex_api_1.ComponentEx {
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
        return (sortedMods !== state.sortedMods) ? { sortedMods } : null;
    }
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
        this.renderModEntry = (modId) => {
            const loEntry = this.state.sortedMods[modId];
            const key = modId + JSON.stringify(loEntry);
            const name = vortex_api_1.util.renderModName(this.props.mods[modId]) || modId;
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, loEntry.pos),
                    React.createElement("p", null, name))));
        };
        const { loadOrder, mods, collection } = props;
        this.initState({
            sortedMods: (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection) || {},
        });
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
                React.createElement("h4", null, t('Witcher 3 Merged Data')),
                React.createElement("p", null, t('The Witcher 3 game extension executes a series of file merges for UI/menu mods '
                    + 'whenever the mods are deployed - these will be included in the collection. '
                    + '(separate from the ones done using the script '
                    + 'merger utility) To ensure that Vortex includes the correct data when '
                    + 'uploading this collection, please make sure that the mods are enabled and '
                    + 'deployed before attempting to upload the collection.')),
                React.createElement("p", null, t('Additionally - please remember that any script merges (if applicable) done '
                    + 'through the script merger utility, should be reviewed before uploading, to '
                    + 'only include merges that are necessary for the collection to function correctly. '
                    + 'Merged scripts referencing a mod that is not included in your collection will most '
                    + 'definitively cause the game to crash!')),
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('This is a snapshot of the load order information that '
                    + 'will be exported with this collection.')),
                this.renderLoadOrderEditInfo(),
                React.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, Object.keys(sortedMods).map(this.renderModEntry)))) : this.renderPlaceholder();
    }
}
const empty = {};
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    let loadOrder = {};
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
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBK0I7QUFDL0IscURBQW1FO0FBQ25FLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFFdEMsMkNBQzZDO0FBRzdDLDhDQUE2RDtBQUU3RCxNQUFNLFNBQVMsR0FBVyw4QkFBOEIsQ0FBQztBQW1CekQsTUFBTSxtQkFBb0IsU0FBUSx3QkFBb0M7SUFDN0QsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFFBQWdCLEVBQUUsS0FBc0I7UUFDN0UsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsUUFBUSxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN2RSxPQUFPLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ25FLENBQUM7SUFFRCxZQUFZLEtBQWE7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBK0NQLDRCQUF1QixHQUFHLEdBQUcsRUFBRTtZQUNyQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQ0wsb0JBQUMsdUJBQVUsSUFBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLEVBQUUsRUFBQywrQ0FBK0M7Z0JBQ3ZFLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQywwQkFBMEI7b0JBQ3BELG9CQUFDLGlCQUFJLElBQUMsSUFBSSxFQUFDLGFBQWEsR0FBRSxDQUNUO2dCQUNuQixvQkFBQyx1QkFBVSxDQUFDLEtB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QixFQUFFLFFBQWdCO0lBQzVELE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUM1RCxJQUFJLFNBQVMsR0FBZSxFQUFFLENBQUM7SUFDL0IsSUFBSSxDQUFDLENBQUMsQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxDQUFBLEVBQUU7UUFDckIsU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pGO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTTtRQUN2QixTQUFTO1FBQ1QsSUFBSSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyRSxPQUFPO0tBQ1IsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQWE7SUFDdkMsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDO0FBRUQsa0JBQWUsSUFBQSwrQkFBZSxFQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQ25ELElBQUEscUJBQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FDMUMsbUJBQW1CLENBQVEsQ0FBa0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBCdXR0b24sIExpc3RHcm91cCwgTGlzdEdyb3VwSXRlbSB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgQ29tcG9uZW50RXgsIEVtcHR5UGxhY2Vob2xkZXIsIEZsZXhMYXlvdXQsIEljb24sXHJcbiAgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMsIElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4uL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbkxvYWRPcmRlciB9IGZyb20gJy4uL2NvbGxlY3Rpb25zL3V0aWwnO1xyXG5cclxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VTdGF0ZSB7XHJcbiAgc29ydGVkTW9kczogSUxvYWRPcmRlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgZ2FtZUlkOiBzdHJpbmc7XHJcbiAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfTtcclxuICBsb2FkT3JkZXI6IElMb2FkT3JkZXI7XHJcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElBY3Rpb25Qcm9wcyAmIElFeHRlbmRlZEludGVyZmFjZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xyXG50eXBlIElDb21wb25lbnRTdGF0ZSA9IElCYXNlU3RhdGU7XHJcblxyXG5jbGFzcyBDb2xsZWN0aW9uc0RhdGFWaWV3IGV4dGVuZHMgQ29tcG9uZW50RXg8SVByb3BzLCBJQ29tcG9uZW50U3RhdGU+IHtcclxuICBwdWJsaWMgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyhuZXdQcm9wczogSVByb3BzLCBzdGF0ZTogSUNvbXBvbmVudFN0YXRlKSB7XHJcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gbmV3UHJvcHM7XHJcbiAgICBjb25zdCBzb3J0ZWRNb2RzID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pO1xyXG4gICAgcmV0dXJuIChzb3J0ZWRNb2RzICE9PSBzdGF0ZS5zb3J0ZWRNb2RzKSA/IHsgc29ydGVkTW9kcyB9IDogbnVsbDtcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJUHJvcHMpIHtcclxuICAgIHN1cGVyKHByb3BzKTtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBwcm9wcztcclxuICAgIHRoaXMuaW5pdFN0YXRlKHtcclxuICAgICAgc29ydGVkTW9kczogZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pIHx8IHt9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY29tcG9uZW50RGlkTW91bnQoKSB7XHJcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gdGhpcy5wcm9wcztcclxuICAgIHRoaXMubmV4dFN0YXRlLnNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIGNvbnN0IHsgc29ydGVkTW9kcyB9ID0gdGhpcy5zdGF0ZTtcclxuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcclxuICAgICAgPyAoXHJcbiAgICAgICAgPGRpdiBzdHlsZT17eyBvdmVyZmxvdzogJ2F1dG8nIH19PlxyXG4gICAgICAgICAgPGg0Pnt0KCdXaXRjaGVyIDMgTWVyZ2VkIERhdGEnKX08L2g0PlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnVGhlIFdpdGNoZXIgMyBnYW1lIGV4dGVuc2lvbiBleGVjdXRlcyBhIHNlcmllcyBvZiBmaWxlIG1lcmdlcyBmb3IgVUkvbWVudSBtb2RzICdcclxuICAgICAgICAgICArICd3aGVuZXZlciB0aGUgbW9kcyBhcmUgZGVwbG95ZWQgLSB0aGVzZSB3aWxsIGJlIGluY2x1ZGVkIGluIHRoZSBjb2xsZWN0aW9uLiAnXHJcbiAgICAgICAgICAgKyAnKHNlcGFyYXRlIGZyb20gdGhlIG9uZXMgZG9uZSB1c2luZyB0aGUgc2NyaXB0ICdcclxuICAgICAgICAgICArICdtZXJnZXIgdXRpbGl0eSkgVG8gZW5zdXJlIHRoYXQgVm9ydGV4IGluY2x1ZGVzIHRoZSBjb3JyZWN0IGRhdGEgd2hlbiAnXHJcbiAgICAgICAgICAgKyAndXBsb2FkaW5nIHRoaXMgY29sbGVjdGlvbiwgcGxlYXNlIG1ha2Ugc3VyZSB0aGF0IHRoZSBtb2RzIGFyZSBlbmFibGVkIGFuZCAnXHJcbiAgICAgICAgICAgKyAnZGVwbG95ZWQgYmVmb3JlIGF0dGVtcHRpbmcgdG8gdXBsb2FkIHRoZSBjb2xsZWN0aW9uLicpfVxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnQWRkaXRpb25hbGx5IC0gcGxlYXNlIHJlbWVtYmVyIHRoYXQgYW55IHNjcmlwdCBtZXJnZXMgKGlmIGFwcGxpY2FibGUpIGRvbmUgJ1xyXG4gICAgICAgICAgICsgJ3Rocm91Z2ggdGhlIHNjcmlwdCBtZXJnZXIgdXRpbGl0eSwgc2hvdWxkIGJlIHJldmlld2VkIGJlZm9yZSB1cGxvYWRpbmcsIHRvICdcclxuICAgICAgICAgICArICdvbmx5IGluY2x1ZGUgbWVyZ2VzIHRoYXQgYXJlIG5lY2Vzc2FyeSBmb3IgdGhlIGNvbGxlY3Rpb24gdG8gZnVuY3Rpb24gY29ycmVjdGx5LiAnXHJcbiAgICAgICAgICAgKyAnTWVyZ2VkIHNjcmlwdHMgcmVmZXJlbmNpbmcgYSBtb2QgdGhhdCBpcyBub3QgaW5jbHVkZWQgaW4geW91ciBjb2xsZWN0aW9uIHdpbGwgbW9zdCAnXHJcbiAgICAgICAgICAgKyAnZGVmaW5pdGl2ZWx5IGNhdXNlIHRoZSBnYW1lIHRvIGNyYXNoIScpfVxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPGg0Pnt0KCdMb2FkIE9yZGVyJyl9PC9oND5cclxuICAgICAgICAgIDxwPlxyXG4gICAgICAgICAge3QoJ1RoaXMgaXMgYSBzbmFwc2hvdCBvZiB0aGUgbG9hZCBvcmRlciBpbmZvcm1hdGlvbiB0aGF0ICdcclxuICAgICAgICAgICArICd3aWxsIGJlIGV4cG9ydGVkIHdpdGggdGhpcyBjb2xsZWN0aW9uLicpfVxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAge3RoaXMucmVuZGVyTG9hZE9yZGVyRWRpdEluZm8oKX1cclxuICAgICAgICAgIDxMaXN0R3JvdXAgaWQ9J2NvbGxlY3Rpb25zLWxvYWQtb3JkZXItbGlzdCc+XHJcbiAgICAgICAgICAgIHtPYmplY3Qua2V5cyhzb3J0ZWRNb2RzKS5tYXAodGhpcy5yZW5kZXJNb2RFbnRyeSl9XHJcbiAgICAgICAgICA8L0xpc3RHcm91cD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICkgOiB0aGlzLnJlbmRlclBsYWNlaG9sZGVyKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlckxvYWRPcmRlckVkaXRJbmZvID0gKCkgPT4ge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93JyBpZD0nY29sbGVjdGlvbi1lZGl0LWxvYWRvcmRlci1lZGl0LWluZm8tY29udGFpbmVyJz5cclxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2xvYWRvcmRlci1lZGl0LWluZm8taWNvbic+XHJcbiAgICAgICAgICA8SWNvbiBuYW1lPSdkaWFsb2ctaW5mbycvPlxyXG4gICAgICAgIDwvRmxleExheW91dC5GaXhlZD5cclxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvJz5cclxuICAgICAgICAgIHt0KCdZb3UgY2FuIG1ha2UgY2hhbmdlcyB0byB0aGlzIGRhdGEgZnJvbSB0aGUgJyl9XHJcbiAgICAgICAgICA8YVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9J2Zha2UtbGluaydcclxuICAgICAgICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cclxuICAgICAgICAgICAgdGl0bGU9e3QoJ0dvIHRvIExvYWQgT3JkZXIgUGFnZScpfVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICB7dCgnTG9hZCBPcmRlciBwYWdlLicpfVxyXG4gICAgICAgICAgPC9hPlxyXG4gICAgICAgICAge3QoJyBJZiB5b3UgYmVsaWV2ZSBhIGxvYWQgb3JkZXIgZW50cnkgaXMgbWlzc2luZywgcGxlYXNlIGVuc3VyZSB0aGUgJ1xyXG4gICAgICAgICAgKyAncmVsZXZhbnQgbW9kIGlzIGVuYWJsZWQgYW5kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBjb2xsZWN0aW9uLicpfVxyXG4gICAgICAgIDwvRmxleExheW91dC5GaXhlZD5cclxuICAgICAgPC9GbGV4TGF5b3V0PlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3BlbkxvYWRPcmRlclBhZ2UgPSAoKSA9PiB7XHJcbiAgICB0aGlzLmNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdzaG93LW1haW4tcGFnZScsICdnZW5lcmljLWxvYWRvcmRlcicpO1xyXG4gIH1cclxuICBwcml2YXRlIHJlbmRlck9wZW5MT0J1dHRvbiA9ICgpID0+IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoPEJ1dHRvblxyXG4gICAgICBpZD0nYnRuLW1vcmUtbW9kcydcclxuICAgICAgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWFkZC1tb2RzLWJ0bidcclxuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cclxuICAgICAgYnNTdHlsZT0nZ2hvc3QnXHJcbiAgICA+XHJcbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxyXG4gICAgPC9CdXR0b24+KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyUGxhY2Vob2xkZXIgPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8RW1wdHlQbGFjZWhvbGRlclxyXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcclxuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxyXG4gICAgICAgIHN1YnRleHQ9e3RoaXMucmVuZGVyT3BlbkxPQnV0dG9uKCl9XHJcbiAgICAgIC8+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChtb2RJZDogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnkgPSB0aGlzLnN0YXRlLnNvcnRlZE1vZHNbbW9kSWRdO1xyXG4gICAgY29uc3Qga2V5ID0gbW9kSWQgKyBKU09OLnN0cmluZ2lmeShsb0VudHJ5KTtcclxuICAgIGNvbnN0IG5hbWUgPSB1dGlsLnJlbmRlck1vZE5hbWUodGhpcy5wcm9wcy5tb2RzW21vZElkXSkgfHwgbW9kSWQ7XHJcbiAgICBjb25zdCBjbGFzc2VzID0gWydsb2FkLW9yZGVyLWVudHJ5JywgJ2NvbGxlY3Rpb24tdGFiJ107XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8TGlzdEdyb3VwSXRlbVxyXG4gICAgICAgIGtleT17a2V5fVxyXG4gICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlcy5qb2luKCcgJyl9XHJcbiAgICAgID5cclxuICAgICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnPlxyXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLWluZGV4Jz57bG9FbnRyeS5wb3N9PC9wPlxyXG4gICAgICAgICAgPHA+e25hbWV9PC9wPlxyXG4gICAgICAgIDwvRmxleExheW91dD5cclxuICAgICAgPC9MaXN0R3JvdXBJdGVtPlxyXG4gICAgKTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGVtcHR5ID0ge307XHJcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogdHlwZXMuSVN0YXRlLCBvd25Qcm9wczogSVByb3BzKTogSUNvbm5lY3RlZFByb3BzIHtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpIHx8IHVuZGVmaW5lZDtcclxuICBsZXQgbG9hZE9yZGVyOiBJTG9hZE9yZGVyID0ge307XHJcbiAgaWYgKCEhcHJvZmlsZT8uZ2FtZUlkKSB7XHJcbiAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgZW1wdHkpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGdhbWVJZDogcHJvZmlsZT8uZ2FtZUlkLFxyXG4gICAgbG9hZE9yZGVyLFxyXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkXSwge30pLFxyXG4gICAgcHJvZmlsZSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XHJcbiAgcmV0dXJuIHt9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcclxuICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShcclxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcpIGFzIGFueSkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8SUV4dGVuZGVkSW50ZXJmYWNlUHJvcHM+O1xyXG4iXX0=