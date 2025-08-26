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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IscURBQW1FO0FBQ25FLGlEQUFpRTtBQUNqRSw2Q0FBc0M7QUFFdEMsMkNBQzZDO0FBSTdDLDRDQUE4QztBQUU5Qyw0Q0FBb0Q7QUFFcEQsTUFBTSxTQUFTLEdBQVcsZ0JBQWdCLENBQUM7QUF1QjNDLE1BQU0sNEJBQTZCLFNBQVEsd0JBQW9DO0lBQzdFLFlBQVksS0FBYTtRQUN2QixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFrRFAsNEJBQXVCLEdBQUcsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLE9BQU8sQ0FDTCxvQkFBQyx1QkFBVSxJQUFDLElBQUksRUFBQyxLQUFLLEVBQUMsRUFBRSxFQUFDLCtDQUErQztnQkFDdkUsb0JBQUMsdUJBQVUsQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLDBCQUEwQjtvQkFDcEQsb0JBQUMsaUJBQUksSUFBQyxJQUFJLEVBQUMsYUFBYSxHQUFFLENBQ1Q7Z0JBQ25CLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQyxxQ0FBcUM7b0JBQzlELENBQUMsQ0FBQyw2Q0FBNkMsQ0FBQztvQkFDakQsMkJBQ0UsU0FBUyxFQUFDLFdBQVcsRUFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFDL0IsS0FBSyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUVoQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FDcEI7b0JBQ0gsQ0FBQyxDQUFDLG1FQUFtRTswQkFDcEUsK0RBQStELENBQUMsQ0FDakQsQ0FDUixDQUNkLENBQUM7UUFDSixDQUFD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biwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgV2l0aFRyYW5zbGF0aW9uLCB3aXRoVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcclxuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuXHJcbmltcG9ydCB7IENvbXBvbmVudEV4LCBFbXB0eVBsYWNlaG9sZGVyLCBGbGV4TGF5b3V0LCBJY29uLFxyXG4gIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IElFeHRlbmRlZEludGVyZmFjZVByb3BzLCBJTG9hZE9yZGVyRW50cnkgfSBmcm9tICcuLi90eXBlcy90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBOQVRJVkVfUExVR0lOUyB9IGZyb20gJy4uL2NvbnN0YW50cyc7XHJcblxyXG5pbXBvcnQgeyBkZXNlcmlhbGl6ZUxvYWRPcmRlciB9IGZyb20gJy4uL2xvYWRvcmRlcic7XHJcblxyXG5jb25zdCBOQU1FU1BBQ0U6IHN0cmluZyA9ICdnYW1lLW1vcnJvd2luZCc7XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VTdGF0ZSB7XHJcbiAgc29ydGVkTW9kczogSUxvYWRPcmRlckVudHJ5W107XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIGdhbWVJZDogc3RyaW5nO1xyXG4gIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH07XHJcbiAgbG9hZE9yZGVyOiBJTG9hZE9yZGVyRW50cnlbXTtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XHJcbn1cclxuXHJcbnR5cGUgSVByb3BzID0gSUJhc2VQcm9wcyAmIElBY3Rpb25Qcm9wcyAmIElFeHRlbmRlZEludGVyZmFjZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xyXG50eXBlIElDb21wb25lbnRTdGF0ZSA9IElCYXNlU3RhdGU7XHJcblxyXG5jbGFzcyBNb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3IGV4dGVuZHMgQ29tcG9uZW50RXg8SVByb3BzLCBJQ29tcG9uZW50U3RhdGU+IHtcclxuICBjb25zdHJ1Y3Rvcihwcm9wczogSVByb3BzKSB7XHJcbiAgICBzdXBlcihwcm9wcyk7XHJcbiAgICB0aGlzLmluaXRTdGF0ZSh7XHJcbiAgICAgIHNvcnRlZE1vZHM6IFtdLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY29tcG9uZW50RGlkTW91bnQoKSB7XHJcbiAgICB0aGlzLnVwZGF0ZVNvcnRlZE1vZHMoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBJUHJvcHMsIHByZXZTdGF0ZTogSUJhc2VTdGF0ZSk6IHZvaWQge1xyXG4gICAgaWYgKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUuc29ydGVkTW9kcykgIT09IEpTT04uc3RyaW5naWZ5KHRoaXMucHJvcHMubG9hZE9yZGVyKSl7XHJcbiAgICAgIHRoaXMudXBkYXRlU29ydGVkTW9kcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlbmRlcigpOiBKU1guRWxlbWVudCB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICBjb25zdCB7IHNvcnRlZE1vZHMgfSA9IHRoaXMuc3RhdGU7XHJcbiAgICByZXR1cm4gKCEhc29ydGVkTW9kcyAmJiBPYmplY3Qua2V5cyhzb3J0ZWRNb2RzKS5sZW5ndGggIT09IDApXHJcbiAgICAgID8gKFxyXG4gICAgICAgIDxkaXYgc3R5bGU9e3sgb3ZlcmZsb3c6ICdhdXRvJyB9fT5cclxuICAgICAgICAgIDxoND57dCgnTG9hZCBPcmRlcicpfTwvaDQ+XHJcbiAgICAgICAgICA8cD5cclxuICAgICAgICAgIHt0KCdUaGlzIGlzIGEgc25hcHNob3Qgb2YgdGhlIGxvYWQgb3JkZXIgaW5mb3JtYXRpb24gdGhhdCAnXHJcbiAgICAgICAgICAgKyAnd2lsbCBiZSBleHBvcnRlZCB3aXRoIHRoaXMgY29sbGVjdGlvbi4nKX1cclxuICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIHt0aGlzLnJlbmRlckxvYWRPcmRlckVkaXRJbmZvKCl9XHJcbiAgICAgICAgICA8TGlzdEdyb3VwIGlkPSdjb2xsZWN0aW9ucy1sb2FkLW9yZGVyLWxpc3QnPlxyXG4gICAgICAgICAgICB7c29ydGVkTW9kcy5tYXAoKGVudHJ5LCBpZHgpID0+IHRoaXMucmVuZGVyTW9kRW50cnkoZW50cnksIGlkeCkpfVxyXG4gICAgICAgICAgPC9MaXN0R3JvdXA+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICApIDogdGhpcy5yZW5kZXJQbGFjZWhvbGRlcigpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVTb3J0ZWRNb2RzKCkge1xyXG4gICAgY29uc3QgaW5jbHVkZWRNb2RJZHMgPSAodGhpcy5wcm9wcy5jb2xsZWN0aW9uPy5ydWxlcyB8fCBbXSkubWFwKHJ1bGUgPT4gcnVsZS5yZWZlcmVuY2UuaWQpO1xyXG4gICAgY29uc3QgbW9kcyA9IE9iamVjdC5rZXlzKHRoaXMucHJvcHMubW9kcykucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgICBpZiAoaW5jbHVkZWRNb2RJZHMuaW5jbHVkZXMoaXRlcikpIHtcclxuICAgICAgICBhY2N1bVtpdGVyXSA9IHRoaXMucHJvcHMubW9kc1tpdGVyXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCB7fSlcclxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyKHRoaXMucHJvcHMuYXBpLCBtb2RzKVxyXG4gICAgICAudGhlbihsbyA9PiB7XHJcbiAgICAgICAgY29uc3QgZmlsdGVyZWQgPSBsby5maWx0ZXIoZW50cnkgPT4gKE5BVElWRV9QTFVHSU5TLmluY2x1ZGVzKGVudHJ5LmlkKSB8fCBlbnRyeS5tb2RJZCAhPT0gdW5kZWZpbmVkKSk7XHJcbiAgICAgICAgdGhpcy5uZXh0U3RhdGUuc29ydGVkTW9kcyA9IGZpbHRlcmVkO1xyXG4gICAgICB9KVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJMb2FkT3JkZXJFZGl0SW5mbyA9ICgpID0+IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxGbGV4TGF5b3V0IHR5cGU9J3JvdycgaWQ9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvLWNvbnRhaW5lcic+XHJcbiAgICAgICAgPEZsZXhMYXlvdXQuRml4ZWQgY2xhc3NOYW1lPSdsb2Fkb3JkZXItZWRpdC1pbmZvLWljb24nPlxyXG4gICAgICAgICAgPEljb24gbmFtZT0nZGlhbG9nLWluZm8nLz5cclxuICAgICAgICA8L0ZsZXhMYXlvdXQuRml4ZWQ+XHJcbiAgICAgICAgPEZsZXhMYXlvdXQuRml4ZWQgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mbyc+XHJcbiAgICAgICAgICB7dCgnWW91IGNhbiBtYWtlIGNoYW5nZXMgdG8gdGhpcyBkYXRhIGZyb20gdGhlICcpfVxyXG4gICAgICAgICAgPGFcclxuICAgICAgICAgICAgY2xhc3NOYW1lPSdmYWtlLWxpbmsnXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XHJcbiAgICAgICAgICAgIHRpdGxlPXt0KCdHbyB0byBMb2FkIE9yZGVyIFBhZ2UnKX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge3QoJ0xvYWQgT3JkZXIgcGFnZS4nKX1cclxuICAgICAgICAgIDwvYT5cclxuICAgICAgICAgIHt0KCcgSWYgeW91IGJlbGlldmUgYSBsb2FkIG9yZGVyIGVudHJ5IGlzIG1pc3NpbmcsIHBsZWFzZSBlbnN1cmUgdGhlICdcclxuICAgICAgICAgICsgJ3JlbGV2YW50IG1vZCBpcyBlbmFibGVkIGFuZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgY29sbGVjdGlvbi4nKX1cclxuICAgICAgICA8L0ZsZXhMYXlvdXQuRml4ZWQ+XHJcbiAgICAgIDwvRmxleExheW91dD5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xyXG4gICAgdGhpcy5wcm9wcy5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ2ZpbGUtYmFzZWQtbG9hZG9yZGVyJyk7XHJcbiAgfVxyXG4gIHByaXZhdGUgcmVuZGVyT3BlbkxPQnV0dG9uID0gKCkgPT4ge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuICg8QnV0dG9uXHJcbiAgICAgIGlkPSdidG4tbW9yZS1tb2RzJ1xyXG4gICAgICBjbGFzc05hbWU9J2NvbGxlY3Rpb24tYWRkLW1vZHMtYnRuJ1xyXG4gICAgICBvbkNsaWNrPXt0aGlzLm9wZW5Mb2FkT3JkZXJQYWdlfVxyXG4gICAgICBic1N0eWxlPSdnaG9zdCdcclxuICAgID5cclxuICAgICAge3QoJ09wZW4gTG9hZCBPcmRlciBQYWdlJyl9XHJcbiAgICA8L0J1dHRvbj4pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJQbGFjZWhvbGRlciA9ICgpID0+IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxFbXB0eVBsYWNlaG9sZGVyXHJcbiAgICAgICAgaWNvbj0nc29ydC1ub25lJ1xyXG4gICAgICAgIHRleHQ9e3QoJ1lvdSBoYXZlIG5vIGxvYWQgb3JkZXIgZW50cmllcyAoZm9yIHRoZSBjdXJyZW50IG1vZHMgaW4gdGhlIGNvbGxlY3Rpb24pJyl9XHJcbiAgICAgICAgc3VidGV4dD17dGhpcy5yZW5kZXJPcGVuTE9CdXR0b24oKX1cclxuICAgICAgLz5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlck1vZEVudHJ5ID0gKGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSwgaWR4OiBudW1iZXIpID0+IHtcclxuICAgIGNvbnN0IGtleSA9IGxvRW50cnkuaWQgKyBKU09OLnN0cmluZ2lmeShsb0VudHJ5KTtcclxuICAgIGNvbnN0IGNsYXNzZXMgPSBbJ2xvYWQtb3JkZXItZW50cnknLCAnY29sbGVjdGlvbi10YWInXTtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxMaXN0R3JvdXBJdGVtXHJcbiAgICAgICAga2V5PXtrZXl9XHJcbiAgICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzLmpvaW4oJyAnKX1cclxuICAgICAgPlxyXG4gICAgICAgIDxGbGV4TGF5b3V0IHR5cGU9J3Jvdyc+XHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnPntpZHh9PC9wPlxyXG4gICAgICAgICAgPHA+e2xvRW50cnkubmFtZX08L3A+XHJcbiAgICAgICAgPC9GbGV4TGF5b3V0PlxyXG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgZW1wdHkgPSBbXTtcclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIG93blByb3BzOiBJUHJvcHMpOiBJQ29ubmVjdGVkUHJvcHMge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSkgfHwgdW5kZWZpbmVkO1xyXG4gIGxldCBsb2FkT3JkZXI6IElMb2FkT3JkZXJFbnRyeVtdID0gW107XHJcbiAgaWYgKCEhcHJvZmlsZT8uZ2FtZUlkKSB7XHJcbiAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgZW1wdHkpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGdhbWVJZDogcHJvZmlsZT8uZ2FtZUlkLFxyXG4gICAgbG9hZE9yZGVyLFxyXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkXSwge30pLFxyXG4gICAgcHJvZmlsZSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IGFueSk6IElBY3Rpb25Qcm9wcyB7XHJcbiAgcmV0dXJuIHt9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcclxuICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShcclxuICAgIE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcpIGFzIGFueSkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8SUJhc2VQcm9wcyAmIElFeHRlbmRlZEludGVyZmFjZVByb3BzPjtcclxuIl19