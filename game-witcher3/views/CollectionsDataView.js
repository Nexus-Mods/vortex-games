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
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const util_1 = require("../collections/util");
const NAMESPACE = 'generic-load-order-extension';
class CollectionsDataView extends vortex_api_1.ComponentEx {
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
            sortedMods: util_1.genCollectionLoadOrder(loadOrder, mods, collection) || {},
        });
    }
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = util_1.genCollectionLoadOrder(loadOrder, mods, collection);
        return (sortedMods !== state.sortedMods) ? { sortedMods } : null;
    }
    componentDidMount() {
        const { loadOrder, mods, collection } = this.props;
        this.nextState.sortedMods = util_1.genCollectionLoadOrder(loadOrder, mods, collection);
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
exports.default = react_i18next_1.withTranslation(['common', NAMESPACE])(react_redux_1.connect(mapStateToProps, mapDispatchToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQixxREFBbUU7QUFDbkUsaURBQWdEO0FBQ2hELDZDQUFzQztBQUV0QywyQ0FDNkM7QUFHN0MsOENBQTZEO0FBRTdELE1BQU0sU0FBUyxHQUFXLDhCQUE4QixDQUFDO0FBbUJ6RCxNQUFNLG1CQUFvQixTQUFRLHdCQUFvQztJQU9wRSxZQUFZLEtBQWE7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBK0NQLDRCQUF1QixHQUFHLEdBQUcsRUFBRTtZQUNyQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQ0wsb0JBQUMsdUJBQVUsSUFBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLEVBQUUsRUFBQywrQ0FBK0M7Z0JBQ3ZFLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQywwQkFBMEI7b0JBQ3BELG9CQUFDLGlCQUFJLElBQUMsSUFBSSxFQUFDLGFBQWEsR0FBRSxDQUNUO2dCQUNuQixvQkFBQyx1QkFBVSxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMscUNBQXFDO29CQUM5RCxDQUFDLENBQUMsNkNBQTZDLENBQUM7b0JBQ2pELDJCQUNFLFNBQVMsRUFBQyxXQUFXLEVBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQy9CLEtBQUssRUFBRSxDQUFDLENBQUMsdUJBQXVCLENBQUMsSUFFaEMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQ3BCO29CQUNILENBQUMsQ0FBQyxtRUFBbUU7MEJBQ3BFLCtEQUErRCxDQUFDLENBQ2pELENBQ1IsQ0FDZCxDQUFDO1FBQ0osQ0FBQyxDQUFBO1FBRU8sc0JBQWlCLEdBQUcsR0FBRyxFQUFFO1lB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TUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDO0lBQzVELElBQUksU0FBUyxHQUFlLEVBQUUsQ0FBQztJQUMvQixJQUFJLENBQUMsRUFBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxDQUFBLEVBQUU7UUFDckIsU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pGO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTTtRQUN2QixTQUFTO1FBQ1QsSUFBSSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyRSxPQUFPO0tBQ1IsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQWE7SUFDdkMsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDO0FBRUQsa0JBQWUsK0JBQWUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUNuRCxxQkFBTyxDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUMxQyxtQkFBbUIsQ0FBUSxDQUFrRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBDb21wb25lbnRFeCwgRW1wdHlQbGFjZWhvbGRlciwgRmxleExheW91dCwgSWNvbixcclxuICBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcywgSUxvYWRPcmRlciwgSUxvYWRPcmRlckVudHJ5IH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvdXRpbCc7XHJcblxyXG5jb25zdCBOQU1FU1BBQ0U6IHN0cmluZyA9ICdnZW5lcmljLWxvYWQtb3JkZXItZXh0ZW5zaW9uJztcclxuXHJcbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcclxuICBzb3J0ZWRNb2RzOiBJTG9hZE9yZGVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcclxuICBnYW1lSWQ6IHN0cmluZztcclxuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xyXG4gIGxvYWRPcmRlcjogSUxvYWRPcmRlcjtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XHJcbn1cclxuXHJcbnR5cGUgSVByb3BzID0gSUFjdGlvblByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XHJcbnR5cGUgSUNvbXBvbmVudFN0YXRlID0gSUJhc2VTdGF0ZTtcclxuXHJcbmNsYXNzIENvbGxlY3Rpb25zRGF0YVZpZXcgZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIElDb21wb25lbnRTdGF0ZT4ge1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKG5ld1Byb3BzOiBJUHJvcHMsIHN0YXRlOiBJQ29tcG9uZW50U3RhdGUpIHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBuZXdQcm9wcztcclxuICAgIGNvbnN0IHNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XHJcbiAgICByZXR1cm4gKHNvcnRlZE1vZHMgIT09IHN0YXRlLnNvcnRlZE1vZHMpID8geyBzb3J0ZWRNb2RzIH0gOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM6IElQcm9wcykge1xyXG4gICAgc3VwZXIocHJvcHMpO1xyXG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24gfSA9IHByb3BzO1xyXG4gICAgdGhpcy5pbml0U3RhdGUoe1xyXG4gICAgICBzb3J0ZWRNb2RzOiBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbikgfHwge30sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjb21wb25lbnREaWRNb3VudCgpIHtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSB0aGlzLnByb3BzO1xyXG4gICAgdGhpcy5uZXh0U3RhdGUuc29ydGVkTW9kcyA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW5kZXIoKTogSlNYLkVsZW1lbnQge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xyXG4gICAgcmV0dXJuICghIXNvcnRlZE1vZHMgJiYgT2JqZWN0LmtleXMoc29ydGVkTW9kcykubGVuZ3RoICE9PSAwKVxyXG4gICAgICA/IChcclxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XHJcbiAgICAgICAgICA8aDQ+e3QoJ1dpdGNoZXIgMyBNZXJnZWQgRGF0YScpfTwvaDQ+XHJcbiAgICAgICAgICA8cD5cclxuICAgICAgICAgIHt0KCdUaGUgV2l0Y2hlciAzIGdhbWUgZXh0ZW5zaW9uIGV4ZWN1dGVzIGEgc2VyaWVzIG9mIGZpbGUgbWVyZ2VzIGZvciBVSS9tZW51IG1vZHMgJ1xyXG4gICAgICAgICAgICsgJ3doZW5ldmVyIHRoZSBtb2RzIGFyZSBkZXBsb3llZCAtIHRoZXNlIHdpbGwgYmUgaW5jbHVkZWQgaW4gdGhlIGNvbGxlY3Rpb24uICdcclxuICAgICAgICAgICArICcoc2VwYXJhdGUgZnJvbSB0aGUgb25lcyBkb25lIHVzaW5nIHRoZSBzY3JpcHQgJ1xyXG4gICAgICAgICAgICsgJ21lcmdlciB1dGlsaXR5KSBUbyBlbnN1cmUgdGhhdCBWb3J0ZXggaW5jbHVkZXMgdGhlIGNvcnJlY3QgZGF0YSB3aGVuICdcclxuICAgICAgICAgICArICd1cGxvYWRpbmcgdGhpcyBjb2xsZWN0aW9uLCBwbGVhc2UgbWFrZSBzdXJlIHRoYXQgdGhlIG1vZHMgYXJlIGVuYWJsZWQgYW5kICdcclxuICAgICAgICAgICArICdkZXBsb3llZCBiZWZvcmUgYXR0ZW1wdGluZyB0byB1cGxvYWQgdGhlIGNvbGxlY3Rpb24uJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8cD5cclxuICAgICAgICAgIHt0KCdBZGRpdGlvbmFsbHkgLSBwbGVhc2UgcmVtZW1iZXIgdGhhdCBhbnkgc2NyaXB0IG1lcmdlcyAoaWYgYXBwbGljYWJsZSkgZG9uZSAnXHJcbiAgICAgICAgICAgKyAndGhyb3VnaCB0aGUgc2NyaXB0IG1lcmdlciB1dGlsaXR5LCBzaG91bGQgYmUgcmV2aWV3ZWQgYmVmb3JlIHVwbG9hZGluZywgdG8gJ1xyXG4gICAgICAgICAgICsgJ29ubHkgaW5jbHVkZSBtZXJnZXMgdGhhdCBhcmUgbmVjZXNzYXJ5IGZvciB0aGUgY29sbGVjdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkuICdcclxuICAgICAgICAgICArICdNZXJnZWQgc2NyaXB0cyByZWZlcmVuY2luZyBhIG1vZCB0aGF0IGlzIG5vdCBpbmNsdWRlZCBpbiB5b3VyIGNvbGxlY3Rpb24gd2lsbCBtb3N0ICdcclxuICAgICAgICAgICArICdkZWZpbml0aXZlbHkgY2F1c2UgdGhlIGdhbWUgdG8gY3Jhc2ghJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8aDQ+e3QoJ0xvYWQgT3JkZXInKX08L2g0PlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnVGhpcyBpcyBhIHNuYXBzaG90IG9mIHRoZSBsb2FkIG9yZGVyIGluZm9ybWF0aW9uIHRoYXQgJ1xyXG4gICAgICAgICAgICsgJ3dpbGwgYmUgZXhwb3J0ZWQgd2l0aCB0aGlzIGNvbGxlY3Rpb24uJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICB7dGhpcy5yZW5kZXJMb2FkT3JkZXJFZGl0SW5mbygpfVxyXG4gICAgICAgICAgPExpc3RHcm91cCBpZD0nY29sbGVjdGlvbnMtbG9hZC1vcmRlci1saXN0Jz5cclxuICAgICAgICAgICAge09iamVjdC5rZXlzKHNvcnRlZE1vZHMpLm1hcCh0aGlzLnJlbmRlck1vZEVudHJ5KX1cclxuICAgICAgICAgIDwvTGlzdEdyb3VwPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyTG9hZE9yZGVyRWRpdEluZm8gPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnIGlkPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mby1jb250YWluZXInPlxyXG4gICAgICAgIDxGbGV4TGF5b3V0LkZpeGVkIGNsYXNzTmFtZT0nbG9hZG9yZGVyLWVkaXQtaW5mby1pY29uJz5cclxuICAgICAgICAgIDxJY29uIG5hbWU9J2RpYWxvZy1pbmZvJy8+XHJcbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxyXG4gICAgICAgIDxGbGV4TGF5b3V0LkZpeGVkIGNsYXNzTmFtZT0nY29sbGVjdGlvbi1lZGl0LWxvYWRvcmRlci1lZGl0LWluZm8nPlxyXG4gICAgICAgICAge3QoJ1lvdSBjYW4gbWFrZSBjaGFuZ2VzIHRvIHRoaXMgZGF0YSBmcm9tIHRoZSAnKX1cclxuICAgICAgICAgIDxhXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT0nZmFrZS1saW5rJ1xyXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9wZW5Mb2FkT3JkZXJQYWdlfVxyXG4gICAgICAgICAgICB0aXRsZT17dCgnR28gdG8gTG9hZCBPcmRlciBQYWdlJyl9XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIHt0KCdMb2FkIE9yZGVyIHBhZ2UuJyl9XHJcbiAgICAgICAgICA8L2E+XHJcbiAgICAgICAgICB7dCgnIElmIHlvdSBiZWxpZXZlIGEgbG9hZCBvcmRlciBlbnRyeSBpcyBtaXNzaW5nLCBwbGVhc2UgZW5zdXJlIHRoZSAnXHJcbiAgICAgICAgICArICdyZWxldmFudCBtb2QgaXMgZW5hYmxlZCBhbmQgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIGNvbGxlY3Rpb24uJyl9XHJcbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxyXG4gICAgICA8L0ZsZXhMYXlvdXQ+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvcGVuTG9hZE9yZGVyUGFnZSA9ICgpID0+IHtcclxuICAgIHRoaXMuY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ2dlbmVyaWMtbG9hZG9yZGVyJyk7XHJcbiAgfVxyXG4gIHByaXZhdGUgcmVuZGVyT3BlbkxPQnV0dG9uID0gKCkgPT4ge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuICg8QnV0dG9uXHJcbiAgICAgIGlkPSdidG4tbW9yZS1tb2RzJ1xyXG4gICAgICBjbGFzc05hbWU9J2NvbGxlY3Rpb24tYWRkLW1vZHMtYnRuJ1xyXG4gICAgICBvbkNsaWNrPXt0aGlzLm9wZW5Mb2FkT3JkZXJQYWdlfVxyXG4gICAgICBic1N0eWxlPSdnaG9zdCdcclxuICAgID5cclxuICAgICAge3QoJ09wZW4gTG9hZCBPcmRlciBQYWdlJyl9XHJcbiAgICA8L0J1dHRvbj4pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJQbGFjZWhvbGRlciA9ICgpID0+IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxFbXB0eVBsYWNlaG9sZGVyXHJcbiAgICAgICAgaWNvbj0nc29ydC1ub25lJ1xyXG4gICAgICAgIHRleHQ9e3QoJ1lvdSBoYXZlIG5vIGxvYWQgb3JkZXIgZW50cmllcyAoZm9yIHRoZSBjdXJyZW50IG1vZHMgaW4gdGhlIGNvbGxlY3Rpb24pJyl9XHJcbiAgICAgICAgc3VidGV4dD17dGhpcy5yZW5kZXJPcGVuTE9CdXR0b24oKX1cclxuICAgICAgLz5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlck1vZEVudHJ5ID0gKG1vZElkOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSA9IHRoaXMuc3RhdGUuc29ydGVkTW9kc1ttb2RJZF07XHJcbiAgICBjb25zdCBrZXkgPSBtb2RJZCArIEpTT04uc3RyaW5naWZ5KGxvRW50cnkpO1xyXG4gICAgY29uc3QgbmFtZSA9IHV0aWwucmVuZGVyTW9kTmFtZSh0aGlzLnByb3BzLm1vZHNbbW9kSWRdKSB8fCBtb2RJZDtcclxuICAgIGNvbnN0IGNsYXNzZXMgPSBbJ2xvYWQtb3JkZXItZW50cnknLCAnY29sbGVjdGlvbi10YWInXTtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxMaXN0R3JvdXBJdGVtXHJcbiAgICAgICAga2V5PXtrZXl9XHJcbiAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzLmpvaW4oJyAnKX1cclxuICAgICAgPlxyXG4gICAgICAgIDxGbGV4TGF5b3V0IHR5cGU9J3Jvdyc+XHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnPntsb0VudHJ5LnBvc308L3A+XHJcbiAgICAgICAgICA8cD57bmFtZX08L3A+XHJcbiAgICAgICAgPC9GbGV4TGF5b3V0PlxyXG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgZW1wdHkgPSB7fTtcclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSkgfHwgdW5kZWZpbmVkO1xyXG4gIGxldCBsb2FkT3JkZXI6IElMb2FkT3JkZXIgPSB7fTtcclxuICBpZiAoISFwcm9maWxlPy5nYW1lSWQpIHtcclxuICAgIGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCBlbXB0eSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZ2FtZUlkOiBwcm9maWxlPy5nYW1lSWQsXHJcbiAgICBsb2FkT3JkZXIsXHJcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWRdLCB7fSksXHJcbiAgICBwcm9maWxlLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcclxuICByZXR1cm4ge307XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHdpdGhUcmFuc2xhdGlvbihbJ2NvbW1vbicsIE5BTUVTUEFDRV0pKFxyXG4gIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMpKFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldykgYXMgYW55KSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczxJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcz47XHJcbiJdfQ==