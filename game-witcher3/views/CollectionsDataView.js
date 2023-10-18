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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBK0I7QUFDL0IscURBQW1FO0FBQ25FLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFFdEMsMkNBQzZDO0FBRzdDLDhDQUE2RDtBQUU3RCxNQUFNLFNBQVMsR0FBVyw4QkFBOEIsQ0FBQztBQW1CekQsTUFBTSxtQkFBb0IsU0FBUSx3QkFBb0M7SUFDN0QsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFFBQWdCLEVBQUUsS0FBc0I7UUFDN0UsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsUUFBUSxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN2RSxPQUFPLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ25FLENBQUM7SUFFRCxZQUFZLEtBQWE7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBK0NQLDRCQUF1QixHQUFHLEdBQUcsRUFBRTtZQUNyQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQ0wsb0JBQUMsdUJBQVUsSUFBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLEVBQUUsRUFBQywrQ0FBK0M7Z0JBQ3ZFLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQywwQkFBMEI7b0JBQ3BELG9CQUFDLGlCQUFJLElBQUMsSUFBSSxFQUFDLGFBQWEsR0FBRSxDQUNUO2dCQUNuQixvQkFBQyx1QkFBVSxDQUFDLEtB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QixFQUFFLFFBQWdCO0lBQzVELE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUM1RCxJQUFJLFNBQVMsR0FBZSxFQUFFLENBQUM7SUFDL0IsSUFBSSxDQUFDLENBQUMsQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxDQUFBLEVBQUU7UUFDckIsU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pGO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTTtRQUN2QixTQUFTO1FBQ1QsSUFBSSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyRSxPQUFPO0tBQ1IsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQWE7SUFDdkMsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDO0FBRUQsa0JBQWUsSUFBQSwrQkFBZSxFQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQ25ELElBQUEscUJBQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FDMUMsbUJBQW1CLENBQVEsQ0FBa0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcblxuaW1wb3J0IHsgQ29tcG9uZW50RXgsIEVtcHR5UGxhY2Vob2xkZXIsIEZsZXhMYXlvdXQsIEljb24sXG4gIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMsIElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4uL2NvbGxlY3Rpb25zL3R5cGVzJztcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy91dGlsJztcblxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XG5cbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcbiAgc29ydGVkTW9kczogSUxvYWRPcmRlcjtcbn1cblxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XG4gIGdhbWVJZDogc3RyaW5nO1xuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xuICBsb2FkT3JkZXI6IElMb2FkT3JkZXI7XG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xufVxuXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcbn1cblxudHlwZSBJUHJvcHMgPSBJQWN0aW9uUHJvcHMgJiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyAmIElDb25uZWN0ZWRQcm9wcztcbnR5cGUgSUNvbXBvbmVudFN0YXRlID0gSUJhc2VTdGF0ZTtcblxuY2xhc3MgQ29sbGVjdGlvbnNEYXRhVmlldyBleHRlbmRzIENvbXBvbmVudEV4PElQcm9wcywgSUNvbXBvbmVudFN0YXRlPiB7XG4gIHB1YmxpYyBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKG5ld1Byb3BzOiBJUHJvcHMsIHN0YXRlOiBJQ29tcG9uZW50U3RhdGUpIHtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gbmV3UHJvcHM7XG4gICAgY29uc3Qgc29ydGVkTW9kcyA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uKTtcbiAgICByZXR1cm4gKHNvcnRlZE1vZHMgIT09IHN0YXRlLnNvcnRlZE1vZHMpID8geyBzb3J0ZWRNb2RzIH0gOiBudWxsO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IElQcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gcHJvcHM7XG4gICAgdGhpcy5pbml0U3RhdGUoe1xuICAgICAgc29ydGVkTW9kczogZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pIHx8IHt9LFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSB0aGlzLnByb3BzO1xuICAgIHRoaXMubmV4dFN0YXRlLnNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcbiAgICAgID8gKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XG4gICAgICAgICAgPGg0Pnt0KCdXaXRjaGVyIDMgTWVyZ2VkIERhdGEnKX08L2g0PlxuICAgICAgICAgIDxwPlxuICAgICAgICAgIHt0KCdUaGUgV2l0Y2hlciAzIGdhbWUgZXh0ZW5zaW9uIGV4ZWN1dGVzIGEgc2VyaWVzIG9mIGZpbGUgbWVyZ2VzIGZvciBVSS9tZW51IG1vZHMgJ1xuICAgICAgICAgICArICd3aGVuZXZlciB0aGUgbW9kcyBhcmUgZGVwbG95ZWQgLSB0aGVzZSB3aWxsIGJlIGluY2x1ZGVkIGluIHRoZSBjb2xsZWN0aW9uLiAnXG4gICAgICAgICAgICsgJyhzZXBhcmF0ZSBmcm9tIHRoZSBvbmVzIGRvbmUgdXNpbmcgdGhlIHNjcmlwdCAnXG4gICAgICAgICAgICsgJ21lcmdlciB1dGlsaXR5KSBUbyBlbnN1cmUgdGhhdCBWb3J0ZXggaW5jbHVkZXMgdGhlIGNvcnJlY3QgZGF0YSB3aGVuICdcbiAgICAgICAgICAgKyAndXBsb2FkaW5nIHRoaXMgY29sbGVjdGlvbiwgcGxlYXNlIG1ha2Ugc3VyZSB0aGF0IHRoZSBtb2RzIGFyZSBlbmFibGVkIGFuZCAnXG4gICAgICAgICAgICsgJ2RlcGxveWVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIHVwbG9hZCB0aGUgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPHA+XG4gICAgICAgICAge3QoJ0FkZGl0aW9uYWxseSAtIHBsZWFzZSByZW1lbWJlciB0aGF0IGFueSBzY3JpcHQgbWVyZ2VzIChpZiBhcHBsaWNhYmxlKSBkb25lICdcbiAgICAgICAgICAgKyAndGhyb3VnaCB0aGUgc2NyaXB0IG1lcmdlciB1dGlsaXR5LCBzaG91bGQgYmUgcmV2aWV3ZWQgYmVmb3JlIHVwbG9hZGluZywgdG8gJ1xuICAgICAgICAgICArICdvbmx5IGluY2x1ZGUgbWVyZ2VzIHRoYXQgYXJlIG5lY2Vzc2FyeSBmb3IgdGhlIGNvbGxlY3Rpb24gdG8gZnVuY3Rpb24gY29ycmVjdGx5LiAnXG4gICAgICAgICAgICsgJ01lcmdlZCBzY3JpcHRzIHJlZmVyZW5jaW5nIGEgbW9kIHRoYXQgaXMgbm90IGluY2x1ZGVkIGluIHlvdXIgY29sbGVjdGlvbiB3aWxsIG1vc3QgJ1xuICAgICAgICAgICArICdkZWZpbml0aXZlbHkgY2F1c2UgdGhlIGdhbWUgdG8gY3Jhc2ghJyl9XG4gICAgICAgICAgPC9wPlxuICAgICAgICAgIDxoND57dCgnTG9hZCBPcmRlcicpfTwvaDQ+XG4gICAgICAgICAgPHA+XG4gICAgICAgICAge3QoJ1RoaXMgaXMgYSBzbmFwc2hvdCBvZiB0aGUgbG9hZCBvcmRlciBpbmZvcm1hdGlvbiB0aGF0ICdcbiAgICAgICAgICAgKyAnd2lsbCBiZSBleHBvcnRlZCB3aXRoIHRoaXMgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAge3RoaXMucmVuZGVyTG9hZE9yZGVyRWRpdEluZm8oKX1cbiAgICAgICAgICA8TGlzdEdyb3VwIGlkPSdjb2xsZWN0aW9ucy1sb2FkLW9yZGVyLWxpc3QnPlxuICAgICAgICAgICAge09iamVjdC5rZXlzKHNvcnRlZE1vZHMpLm1hcCh0aGlzLnJlbmRlck1vZEVudHJ5KX1cbiAgICAgICAgICA8L0xpc3RHcm91cD5cbiAgICAgICAgPC9kaXY+XG4gICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTG9hZE9yZGVyRWRpdEluZm8gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnIGlkPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mby1jb250YWluZXInPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2xvYWRvcmRlci1lZGl0LWluZm8taWNvbic+XG4gICAgICAgICAgPEljb24gbmFtZT0nZGlhbG9nLWluZm8nLz5cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvJz5cbiAgICAgICAgICB7dCgnWW91IGNhbiBtYWtlIGNoYW5nZXMgdG8gdGhpcyBkYXRhIGZyb20gdGhlICcpfVxuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzc05hbWU9J2Zha2UtbGluaydcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XG4gICAgICAgICAgICB0aXRsZT17dCgnR28gdG8gTG9hZCBPcmRlciBQYWdlJyl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAge3QoJ0xvYWQgT3JkZXIgcGFnZS4nKX1cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAge3QoJyBJZiB5b3UgYmVsaWV2ZSBhIGxvYWQgb3JkZXIgZW50cnkgaXMgbWlzc2luZywgcGxlYXNlIGVuc3VyZSB0aGUgJ1xuICAgICAgICAgICsgJ3JlbGV2YW50IG1vZCBpcyBlbmFibGVkIGFuZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgPC9GbGV4TGF5b3V0PlxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xuICAgIHRoaXMuY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ2dlbmVyaWMtbG9hZG9yZGVyJyk7XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoPEJ1dHRvblxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXG4gICAgICBjbGFzc05hbWU9J2NvbGxlY3Rpb24tYWRkLW1vZHMtYnRuJ1xuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cbiAgICAgIGJzU3R5bGU9J2dob3N0J1xuICAgID5cbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxuICAgIDwvQnV0dG9uPik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcbiAgICAgICAgaWNvbj0nc29ydC1ub25lJ1xuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChtb2RJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbG9FbnRyeTogSUxvYWRPcmRlckVudHJ5ID0gdGhpcy5zdGF0ZS5zb3J0ZWRNb2RzW21vZElkXTtcbiAgICBjb25zdCBrZXkgPSBtb2RJZCArIEpTT04uc3RyaW5naWZ5KGxvRW50cnkpO1xuICAgIGNvbnN0IG5hbWUgPSB1dGlsLnJlbmRlck1vZE5hbWUodGhpcy5wcm9wcy5tb2RzW21vZElkXSkgfHwgbW9kSWQ7XG4gICAgY29uc3QgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeScsICdjb2xsZWN0aW9uLXRhYiddO1xuICAgIHJldHVybiAoXG4gICAgICA8TGlzdEdyb3VwSXRlbVxuICAgICAgICBrZXk9e2tleX1cbiAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzLmpvaW4oJyAnKX1cbiAgICAgID5cbiAgICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93Jz5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnPntsb0VudHJ5LnBvc308L3A+XG4gICAgICAgICAgPHA+e25hbWV9PC9wPlxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XG4gICAgKTtcbiAgfVxufVxuXG5jb25zdCBlbXB0eSA9IHt9O1xuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpIHx8IHVuZGVmaW5lZDtcbiAgbGV0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IHt9O1xuICBpZiAoISFwcm9maWxlPy5nYW1lSWQpIHtcbiAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgZW1wdHkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnYW1lSWQ6IHByb2ZpbGU/LmdhbWVJZCxcbiAgICBsb2FkT3JkZXIsXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkXSwge30pLFxuICAgIHByb2ZpbGUsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcbiAgcmV0dXJuIHt9O1xufVxuXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcbiAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldykgYXMgYW55KSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczxJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcz47XG4iXX0=