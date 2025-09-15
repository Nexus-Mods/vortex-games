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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkNBQStCO0FBQy9CLHFEQUFtRTtBQUNuRSxpREFBaUU7QUFDakUsNkNBQXNDO0FBRXRDLDJDQUM2QztBQUk3Qyw0Q0FBOEM7QUFFOUMsNENBQW9EO0FBRXBELE1BQU0sU0FBUyxHQUFXLGdCQUFnQixDQUFDO0FBdUIzQyxNQUFNLDRCQUE2QixTQUFRLHdCQUFvQztJQUM3RSxZQUFZLEtBQWE7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBa0RQLDRCQUF1QixHQUFHLEdBQUcsRUFBRTtZQUNyQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQ0wsb0JBQUMsdUJBQVUsSUFBQyxJQUFJLEVBQUMsS0FBSyxFQUFDLEVBQUUsRUFBQywrQ0FBK0M7Z0JBQ3ZFLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQywwQkFBMEI7b0JBQ3BELG9CQUFDLGlCQUFJLElBQUMsSUFBSSxFQUFDLGFBQWEsR0FBRSxDQUNUO2dCQUNuQixvQkFBQyx1QkFBVSxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMscUNBQXFDO29CQUM5RCxDQUFDLENBQUMsNkNBQTZDLENBQUM7b0JBQ2pELDJCQUNFLFNBQVMsRUFBQyxXQUFXLEVBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQy9CLEtBQUssRUFBRSxDQUFDLENBQUMsdUJBQXVCLENBQUMsSUFFaEMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQ3BCO29CQUNILENBQUMsQ0FBQyxtRUFBbUU7MEJBQ3BFLCtEQUErRCxDQUFDLENBQ2pELENBQ1IsQ0FDZCxDQUFD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YXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBCdXR0b24sIExpc3RHcm91cCwgTGlzdEdyb3VwSXRlbSB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IFdpdGhUcmFuc2xhdGlvbiwgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBDb21wb25lbnRFeCwgRW1wdHlQbGFjZWhvbGRlciwgRmxleExheW91dCwgSWNvbixcclxuICBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcywgSUxvYWRPcmRlckVudHJ5IH0gZnJvbSAnLi4vdHlwZXMvdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgTkFUSVZFX1BMVUdJTlMgfSBmcm9tICcuLi9jb25zdGFudHMnO1xyXG5cclxuaW1wb3J0IHsgZGVzZXJpYWxpemVMb2FkT3JkZXIgfSBmcm9tICcuLi9sb2Fkb3JkZXInO1xyXG5cclxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2FtZS1tb3Jyb3dpbmQnO1xyXG5cclxuaW50ZXJmYWNlIElCYXNlU3RhdGUge1xyXG4gIHNvcnRlZE1vZHM6IElMb2FkT3JkZXJFbnRyeVtdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcclxuICBnYW1lSWQ6IHN0cmluZztcclxuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xyXG4gIGxvYWRPcmRlcjogSUxvYWRPcmRlckVudHJ5W107XHJcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElCYXNlUHJvcHMgJiBJQWN0aW9uUHJvcHMgJiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyAmIElDb25uZWN0ZWRQcm9wcztcclxudHlwZSBJQ29tcG9uZW50U3RhdGUgPSBJQmFzZVN0YXRlO1xyXG5cclxuY2xhc3MgTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldyBleHRlbmRzIENvbXBvbmVudEV4PElQcm9wcywgSUNvbXBvbmVudFN0YXRlPiB7XHJcbiAgY29uc3RydWN0b3IocHJvcHM6IElQcm9wcykge1xyXG4gICAgc3VwZXIocHJvcHMpO1xyXG4gICAgdGhpcy5pbml0U3RhdGUoe1xyXG4gICAgICBzb3J0ZWRNb2RzOiBbXSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xyXG4gICAgdGhpcy51cGRhdGVTb3J0ZWRNb2RzKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wczogSVByb3BzLCBwcmV2U3RhdGU6IElCYXNlU3RhdGUpOiB2b2lkIHtcclxuICAgIGlmIChKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlLnNvcnRlZE1vZHMpICE9PSBKU09OLnN0cmluZ2lmeSh0aGlzLnByb3BzLmxvYWRPcmRlcikpe1xyXG4gICAgICB0aGlzLnVwZGF0ZVNvcnRlZE1vZHMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW5kZXIoKTogSlNYLkVsZW1lbnQge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xyXG4gICAgcmV0dXJuICghIXNvcnRlZE1vZHMgJiYgT2JqZWN0LmtleXMoc29ydGVkTW9kcykubGVuZ3RoICE9PSAwKVxyXG4gICAgICA/IChcclxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XHJcbiAgICAgICAgICA8aDQ+e3QoJ0xvYWQgT3JkZXInKX08L2g0PlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnVGhpcyBpcyBhIHNuYXBzaG90IG9mIHRoZSBsb2FkIG9yZGVyIGluZm9ybWF0aW9uIHRoYXQgJ1xyXG4gICAgICAgICAgICsgJ3dpbGwgYmUgZXhwb3J0ZWQgd2l0aCB0aGlzIGNvbGxlY3Rpb24uJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICB7dGhpcy5yZW5kZXJMb2FkT3JkZXJFZGl0SW5mbygpfVxyXG4gICAgICAgICAgPExpc3RHcm91cCBpZD0nY29sbGVjdGlvbnMtbG9hZC1vcmRlci1saXN0Jz5cclxuICAgICAgICAgICAge3NvcnRlZE1vZHMubWFwKChlbnRyeSwgaWR4KSA9PiB0aGlzLnJlbmRlck1vZEVudHJ5KGVudHJ5LCBpZHgpKX1cclxuICAgICAgICAgIDwvTGlzdEdyb3VwPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlU29ydGVkTW9kcygpIHtcclxuICAgIGNvbnN0IGluY2x1ZGVkTW9kSWRzID0gKHRoaXMucHJvcHMuY29sbGVjdGlvbj8ucnVsZXMgfHwgW10pLm1hcChydWxlID0+IHJ1bGUucmVmZXJlbmNlLmlkKTtcclxuICAgIGNvbnN0IG1vZHMgPSBPYmplY3Qua2V5cyh0aGlzLnByb3BzLm1vZHMpLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcclxuICAgICAgaWYgKGluY2x1ZGVkTW9kSWRzLmluY2x1ZGVzKGl0ZXIpKSB7XHJcbiAgICAgICAgYWNjdW1baXRlcl0gPSB0aGlzLnByb3BzLm1vZHNbaXRlcl07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwge30pXHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcih0aGlzLnByb3BzLmFwaSwgbW9kcylcclxuICAgICAgLnRoZW4obG8gPT4ge1xyXG4gICAgICAgIGNvbnN0IGZpbHRlcmVkID0gbG8uZmlsdGVyKGVudHJ5ID0+IChOQVRJVkVfUExVR0lOUy5pbmNsdWRlcyhlbnRyeS5pZCkgfHwgZW50cnkubW9kSWQgIT09IHVuZGVmaW5lZCkpO1xyXG4gICAgICAgIHRoaXMubmV4dFN0YXRlLnNvcnRlZE1vZHMgPSBmaWx0ZXJlZDtcclxuICAgICAgfSlcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyTG9hZE9yZGVyRWRpdEluZm8gPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnIGlkPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mby1jb250YWluZXInPlxyXG4gICAgICAgIDxGbGV4TGF5b3V0LkZpeGVkIGNsYXNzTmFtZT0nbG9hZG9yZGVyLWVkaXQtaW5mby1pY29uJz5cclxuICAgICAgICAgIDxJY29uIG5hbWU9J2RpYWxvZy1pbmZvJy8+XHJcbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxyXG4gICAgICAgIDxGbGV4TGF5b3V0LkZpeGVkIGNsYXNzTmFtZT0nY29sbGVjdGlvbi1lZGl0LWxvYWRvcmRlci1lZGl0LWluZm8nPlxyXG4gICAgICAgICAge3QoJ1lvdSBjYW4gbWFrZSBjaGFuZ2VzIHRvIHRoaXMgZGF0YSBmcm9tIHRoZSAnKX1cclxuICAgICAgICAgIDxhXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT0nZmFrZS1saW5rJ1xyXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9wZW5Mb2FkT3JkZXJQYWdlfVxyXG4gICAgICAgICAgICB0aXRsZT17dCgnR28gdG8gTG9hZCBPcmRlciBQYWdlJyl9XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIHt0KCdMb2FkIE9yZGVyIHBhZ2UuJyl9XHJcbiAgICAgICAgICA8L2E+XHJcbiAgICAgICAgICB7dCgnIElmIHlvdSBiZWxpZXZlIGEgbG9hZCBvcmRlciBlbnRyeSBpcyBtaXNzaW5nLCBwbGVhc2UgZW5zdXJlIHRoZSAnXHJcbiAgICAgICAgICArICdyZWxldmFudCBtb2QgaXMgZW5hYmxlZCBhbmQgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIGNvbGxlY3Rpb24uJyl9XHJcbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxyXG4gICAgICA8L0ZsZXhMYXlvdXQ+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvcGVuTG9hZE9yZGVyUGFnZSA9ICgpID0+IHtcclxuICAgIHRoaXMucHJvcHMuYXBpLmV2ZW50cy5lbWl0KCdzaG93LW1haW4tcGFnZScsICdmaWxlLWJhc2VkLWxvYWRvcmRlcicpO1xyXG4gIH1cclxuICBwcml2YXRlIHJlbmRlck9wZW5MT0J1dHRvbiA9ICgpID0+IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoPEJ1dHRvblxyXG4gICAgICBpZD0nYnRuLW1vcmUtbW9kcydcclxuICAgICAgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWFkZC1tb2RzLWJ0bidcclxuICAgICAgb25DbGljaz17dGhpcy5vcGVuTG9hZE9yZGVyUGFnZX1cclxuICAgICAgYnNTdHlsZT0nZ2hvc3QnXHJcbiAgICA+XHJcbiAgICAgIHt0KCdPcGVuIExvYWQgT3JkZXIgUGFnZScpfVxyXG4gICAgPC9CdXR0b24+KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyUGxhY2Vob2xkZXIgPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8RW1wdHlQbGFjZWhvbGRlclxyXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcclxuICAgICAgICB0ZXh0PXt0KCdZb3UgaGF2ZSBubyBsb2FkIG9yZGVyIGVudHJpZXMgKGZvciB0aGUgY3VycmVudCBtb2RzIGluIHRoZSBjb2xsZWN0aW9uKScpfVxyXG4gICAgICAgIHN1YnRleHQ9e3RoaXMucmVuZGVyT3BlbkxPQnV0dG9uKCl9XHJcbiAgICAgIC8+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJNb2RFbnRyeSA9IChsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnksIGlkeDogbnVtYmVyKSA9PiB7XHJcbiAgICBjb25zdCBrZXkgPSBsb0VudHJ5LmlkICsgSlNPTi5zdHJpbmdpZnkobG9FbnRyeSk7XHJcbiAgICBjb25zdCBjbGFzc2VzID0gWydsb2FkLW9yZGVyLWVudHJ5JywgJ2NvbGxlY3Rpb24tdGFiJ107XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8TGlzdEdyb3VwSXRlbVxyXG4gICAgICAgIGtleT17a2V5fVxyXG4gICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlcy5qb2luKCcgJyl9XHJcbiAgICAgID5cclxuICAgICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnPlxyXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLWluZGV4Jz57aWR4fTwvcD5cclxuICAgICAgICAgIDxwPntsb0VudHJ5Lm5hbWV9PC9wPlxyXG4gICAgICAgIDwvRmxleExheW91dD5cclxuICAgICAgPC9MaXN0R3JvdXBJdGVtPlxyXG4gICAgKTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGVtcHR5ID0gW107XHJcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogdHlwZXMuSVN0YXRlLCBvd25Qcm9wczogSVByb3BzKTogSUNvbm5lY3RlZFByb3BzIHtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpIHx8IHVuZGVmaW5lZDtcclxuICBsZXQgbG9hZE9yZGVyOiBJTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xyXG4gIGlmICghIXByb2ZpbGU/LmdhbWVJZCkge1xyXG4gICAgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIGVtcHR5KTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBnYW1lSWQ6IHByb2ZpbGU/LmdhbWVJZCxcclxuICAgIGxvYWRPcmRlcixcclxuICAgIG1vZHM6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBwcm9maWxlLmdhbWVJZF0sIHt9KSxcclxuICAgIHByb2ZpbGUsXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoOiBhbnkpOiBJQWN0aW9uUHJvcHMge1xyXG4gIHJldHVybiB7fTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgd2l0aFRyYW5zbGF0aW9uKFsnY29tbW9uJywgTkFNRVNQQUNFXSkoXHJcbiAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoXHJcbiAgICBNb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3KSBhcyBhbnkpIGFzIFJlYWN0LkNvbXBvbmVudENsYXNzPElCYXNlUHJvcHMgJiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcz47XHJcbiJdfQ==