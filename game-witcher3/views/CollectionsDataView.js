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
        this.renderModEntry = (loEntry, index) => {
            var _a, _b;
            const key = loEntry.modId + JSON.stringify(loEntry);
            const name = loEntry.modId
                ? `${(_a = vortex_api_1.util.renderModName(this.props.mods[loEntry.modId])) !== null && _a !== void 0 ? _a : loEntry.id} (${loEntry.name})`
                : (_b = loEntry.name) !== null && _b !== void 0 ? _b : loEntry.id;
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, index + 1),
                    React.createElement("p", null, name))));
        };
        const { loadOrder, mods, collection } = props;
        this.initState({
            sortedMods: (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection) || [],
        });
    }
    componentDidMount() {
        const { loadOrder, mods, collection } = this.props;
        this.nextState.sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && sortedMods.length !== 0)
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
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBK0I7QUFDL0IscURBQW1FO0FBQ25FLGlEQUFnRDtBQUNoRCw2Q0FBc0M7QUFFdEMsMkNBQzZDO0FBRzdDLDhDQUE2RDtBQUc3RCxNQUFNLFNBQVMsR0FBVyw4QkFBOEIsQ0FBQztBQWdCekQsTUFBTSxtQkFBb0IsU0FBUSx3QkFBb0M7SUFDN0QsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFFBQWdCLEVBQUUsS0FBc0I7UUFDN0UsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsUUFBUSxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN2RSxPQUFPLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ25FLENBQUM7SUFFRCxZQUFZLEtBQWE7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBK0NQLDRCQUF1QixHQUFHLEdBQUcsRUFBRTtZQUNyQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQ0wsb0JBQUMsdUJBQVUsSUFBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLEVBQUUsRUFBQywrQ0FBK0M7Z0JBQ3ZFLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQywwQkFBMEI7b0JBQ3BELG9CQUFDLGlCQUFJLElBQUMsSUFBSSxFQUFDLGFBQWEsR0FBRSxDQUNUO2dCQUNuQixvQkFBQyx1QkFBVSxDQUFDLEtB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LFNBQVMsZUFBZSxDQUFDLEtBQW1CLEVBQUUsUUFBZ0I7SUFDNUQsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDO0lBQzVELElBQUksU0FBUyxHQUFvQixFQUFFLENBQUM7SUFDcEMsSUFBSSxDQUFDLENBQUMsQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxDQUFBLEVBQUU7UUFDckIsU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQzlFO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTTtRQUN2QixTQUFTO1FBQ1QsSUFBSSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyRSxPQUFPO0tBQ1IsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxJQUFBLCtCQUFlLEVBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FDbkQsSUFBQSxxQkFBTyxFQUFDLGVBQWUsQ0FBQyxDQUN0QixtQkFBbUIsQ0FBUSxDQUFrRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBDb21wb25lbnRFeCwgRW1wdHlQbGFjZWhvbGRlciwgRmxleExheW91dCwgSWNvbixcclxuICBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcywgSUxvYWRPcmRlciwgSUxvYWRPcmRlckVudHJ5IH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvdXRpbCc7XHJcbmltcG9ydCB7IElGQkxPTG9hZE9yZGVyRW50cnkgfSBmcm9tICd2b3J0ZXgtYXBpL2xpYi90eXBlcy9hcGknO1xyXG5cclxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VTdGF0ZSB7XHJcbiAgc29ydGVkTW9kczogdHlwZXMuSUZCTE9Mb2FkT3JkZXJFbnRyeVtdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcclxuICBnYW1lSWQ6IHN0cmluZztcclxuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xyXG4gIGxvYWRPcmRlcjogdHlwZXMuSUZCTE9Mb2FkT3JkZXJFbnRyeVtdO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElFeHRlbmRlZEludGVyZmFjZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xyXG50eXBlIElDb21wb25lbnRTdGF0ZSA9IElCYXNlU3RhdGU7XHJcblxyXG5jbGFzcyBDb2xsZWN0aW9uc0RhdGFWaWV3IGV4dGVuZHMgQ29tcG9uZW50RXg8SVByb3BzLCBJQ29tcG9uZW50U3RhdGU+IHtcclxuICBwdWJsaWMgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyhuZXdQcm9wczogSVByb3BzLCBzdGF0ZTogSUNvbXBvbmVudFN0YXRlKSB7XHJcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gbmV3UHJvcHM7XHJcbiAgICBjb25zdCBzb3J0ZWRNb2RzID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pO1xyXG4gICAgcmV0dXJuIChzb3J0ZWRNb2RzICE9PSBzdGF0ZS5zb3J0ZWRNb2RzKSA/IHsgc29ydGVkTW9kcyB9IDogbnVsbDtcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJUHJvcHMpIHtcclxuICAgIHN1cGVyKHByb3BzKTtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBwcm9wcztcclxuICAgIHRoaXMuaW5pdFN0YXRlKHtcclxuICAgICAgc29ydGVkTW9kczogZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pIHx8IFtdLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY29tcG9uZW50RGlkTW91bnQoKSB7XHJcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gdGhpcy5wcm9wcztcclxuICAgIHRoaXMubmV4dFN0YXRlLnNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIGNvbnN0IHsgc29ydGVkTW9kcyB9ID0gdGhpcy5zdGF0ZTtcclxuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIHNvcnRlZE1vZHMubGVuZ3RoICE9PSAwKVxyXG4gICAgICA/IChcclxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XHJcbiAgICAgICAgICA8aDQ+e3QoJ1dpdGNoZXIgMyBNZXJnZWQgRGF0YScpfTwvaDQ+XHJcbiAgICAgICAgICA8cD5cclxuICAgICAgICAgIHt0KCdUaGUgV2l0Y2hlciAzIGdhbWUgZXh0ZW5zaW9uIGV4ZWN1dGVzIGEgc2VyaWVzIG9mIGZpbGUgbWVyZ2VzIGZvciBVSS9tZW51IG1vZHMgJ1xyXG4gICAgICAgICAgICsgJ3doZW5ldmVyIHRoZSBtb2RzIGFyZSBkZXBsb3llZCAtIHRoZXNlIHdpbGwgYmUgaW5jbHVkZWQgaW4gdGhlIGNvbGxlY3Rpb24uICdcclxuICAgICAgICAgICArICcoc2VwYXJhdGUgZnJvbSB0aGUgb25lcyBkb25lIHVzaW5nIHRoZSBzY3JpcHQgJ1xyXG4gICAgICAgICAgICsgJ21lcmdlciB1dGlsaXR5KSBUbyBlbnN1cmUgdGhhdCBWb3J0ZXggaW5jbHVkZXMgdGhlIGNvcnJlY3QgZGF0YSB3aGVuICdcclxuICAgICAgICAgICArICd1cGxvYWRpbmcgdGhpcyBjb2xsZWN0aW9uLCBwbGVhc2UgbWFrZSBzdXJlIHRoYXQgdGhlIG1vZHMgYXJlIGVuYWJsZWQgYW5kICdcclxuICAgICAgICAgICArICdkZXBsb3llZCBiZWZvcmUgYXR0ZW1wdGluZyB0byB1cGxvYWQgdGhlIGNvbGxlY3Rpb24uJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8cD5cclxuICAgICAgICAgIHt0KCdBZGRpdGlvbmFsbHkgLSBwbGVhc2UgcmVtZW1iZXIgdGhhdCBhbnkgc2NyaXB0IG1lcmdlcyAoaWYgYXBwbGljYWJsZSkgZG9uZSAnXHJcbiAgICAgICAgICAgKyAndGhyb3VnaCB0aGUgc2NyaXB0IG1lcmdlciB1dGlsaXR5LCBzaG91bGQgYmUgcmV2aWV3ZWQgYmVmb3JlIHVwbG9hZGluZywgdG8gJ1xyXG4gICAgICAgICAgICsgJ29ubHkgaW5jbHVkZSBtZXJnZXMgdGhhdCBhcmUgbmVjZXNzYXJ5IGZvciB0aGUgY29sbGVjdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkuICdcclxuICAgICAgICAgICArICdNZXJnZWQgc2NyaXB0cyByZWZlcmVuY2luZyBhIG1vZCB0aGF0IGlzIG5vdCBpbmNsdWRlZCBpbiB5b3VyIGNvbGxlY3Rpb24gd2lsbCBtb3N0ICdcclxuICAgICAgICAgICArICdkZWZpbml0aXZlbHkgY2F1c2UgdGhlIGdhbWUgdG8gY3Jhc2ghJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8aDQ+e3QoJ0xvYWQgT3JkZXInKX08L2g0PlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnVGhpcyBpcyBhIHNuYXBzaG90IG9mIHRoZSBsb2FkIG9yZGVyIGluZm9ybWF0aW9uIHRoYXQgJ1xyXG4gICAgICAgICAgICsgJ3dpbGwgYmUgZXhwb3J0ZWQgd2l0aCB0aGlzIGNvbGxlY3Rpb24uJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICB7dGhpcy5yZW5kZXJMb2FkT3JkZXJFZGl0SW5mbygpfVxyXG4gICAgICAgICAgPExpc3RHcm91cCBpZD0nY29sbGVjdGlvbnMtbG9hZC1vcmRlci1saXN0Jz5cclxuICAgICAgICAgICAge3NvcnRlZE1vZHMubWFwKHRoaXMucmVuZGVyTW9kRW50cnkpfVxyXG4gICAgICAgICAgPC9MaXN0R3JvdXA+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICApIDogdGhpcy5yZW5kZXJQbGFjZWhvbGRlcigpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJMb2FkT3JkZXJFZGl0SW5mbyA9ICgpID0+IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxGbGV4TGF5b3V0IHR5cGU9J3JvdycgaWQ9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvLWNvbnRhaW5lcic+XHJcbiAgICAgICAgPEZsZXhMYXlvdXQuRml4ZWQgY2xhc3NOYW1lPSdsb2Fkb3JkZXItZWRpdC1pbmZvLWljb24nPlxyXG4gICAgICAgICAgPEljb24gbmFtZT0nZGlhbG9nLWluZm8nLz5cclxuICAgICAgICA8L0ZsZXhMYXlvdXQuRml4ZWQ+XHJcbiAgICAgICAgPEZsZXhMYXlvdXQuRml4ZWQgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mbyc+XHJcbiAgICAgICAgICB7dCgnWW91IGNhbiBtYWtlIGNoYW5nZXMgdG8gdGhpcyBkYXRhIGZyb20gdGhlICcpfVxyXG4gICAgICAgICAgPGFcclxuICAgICAgICAgICAgY2xhc3NOYW1lPSdmYWtlLWxpbmsnXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XHJcbiAgICAgICAgICAgIHRpdGxlPXt0KCdHbyB0byBMb2FkIE9yZGVyIFBhZ2UnKX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge3QoJ0xvYWQgT3JkZXIgcGFnZS4nKX1cclxuICAgICAgICAgIDwvYT5cclxuICAgICAgICAgIHt0KCcgSWYgeW91IGJlbGlldmUgYSBsb2FkIG9yZGVyIGVudHJ5IGlzIG1pc3NpbmcsIHBsZWFzZSBlbnN1cmUgdGhlICdcclxuICAgICAgICAgICsgJ3JlbGV2YW50IG1vZCBpcyBlbmFibGVkIGFuZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgY29sbGVjdGlvbi4nKX1cclxuICAgICAgICA8L0ZsZXhMYXlvdXQuRml4ZWQ+XHJcbiAgICAgIDwvRmxleExheW91dD5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xyXG4gICAgdGhpcy5jb250ZXh0LmFwaS5ldmVudHMuZW1pdCgnc2hvdy1tYWluLXBhZ2UnLCAnZ2VuZXJpYy1sb2Fkb3JkZXInKTtcclxuICB9XHJcbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKDxCdXR0b25cclxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXHJcbiAgICAgIGNsYXNzTmFtZT0nY29sbGVjdGlvbi1hZGQtbW9kcy1idG4nXHJcbiAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XHJcbiAgICAgIGJzU3R5bGU9J2dob3N0J1xyXG4gICAgPlxyXG4gICAgICB7dCgnT3BlbiBMb2FkIE9yZGVyIFBhZ2UnKX1cclxuICAgIDwvQnV0dG9uPik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcclxuICAgICAgICBpY29uPSdzb3J0LW5vbmUnXHJcbiAgICAgICAgdGV4dD17dCgnWW91IGhhdmUgbm8gbG9hZCBvcmRlciBlbnRyaWVzIChmb3IgdGhlIGN1cnJlbnQgbW9kcyBpbiB0aGUgY29sbGVjdGlvbiknKX1cclxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxyXG4gICAgICAvPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyTW9kRW50cnkgPSAobG9FbnRyeTogSUZCTE9Mb2FkT3JkZXJFbnRyeSwgaW5kZXg6IG51bWJlcikgPT4ge1xyXG4gICAgY29uc3Qga2V5ID0gbG9FbnRyeS5tb2RJZCArIEpTT04uc3RyaW5naWZ5KGxvRW50cnkpO1xyXG4gICAgY29uc3QgbmFtZSA9IGxvRW50cnkubW9kSWRcclxuICAgICAgPyBgJHt1dGlsLnJlbmRlck1vZE5hbWUodGhpcy5wcm9wcy5tb2RzW2xvRW50cnkubW9kSWRdKSA/PyBsb0VudHJ5LmlkfSAoJHtsb0VudHJ5Lm5hbWV9KWBcclxuICAgICAgOiBsb0VudHJ5Lm5hbWUgPz8gbG9FbnRyeS5pZDtcclxuXHJcbiAgICBjb25zdCBjbGFzc2VzID0gWydsb2FkLW9yZGVyLWVudHJ5JywgJ2NvbGxlY3Rpb24tdGFiJ107XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8TGlzdEdyb3VwSXRlbVxyXG4gICAgICAgIGtleT17a2V5fVxyXG4gICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlcy5qb2luKCcgJyl9XHJcbiAgICAgID5cclxuICAgICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnPlxyXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLWluZGV4Jz57aW5kZXggKyAxfTwvcD5cclxuICAgICAgICAgIDxwPntuYW1lfTwvcD5cclxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XHJcbiAgICAgIDwvTGlzdEdyb3VwSXRlbT5cclxuICAgICk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKSB8fCB1bmRlZmluZWQ7XHJcbiAgbGV0IGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyID0gW107XHJcbiAgaWYgKCEhcHJvZmlsZT8uZ2FtZUlkKSB7XHJcbiAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgW10pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGdhbWVJZDogcHJvZmlsZT8uZ2FtZUlkLFxyXG4gICAgbG9hZE9yZGVyLFxyXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkXSwge30pLFxyXG4gICAgcHJvZmlsZSxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcclxuICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcykoXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3KSBhcyBhbnkpIGFzIFJlYWN0LkNvbXBvbmVudENsYXNzPElFeHRlbmRlZEludGVyZmFjZVByb3BzPjtcclxuIl19