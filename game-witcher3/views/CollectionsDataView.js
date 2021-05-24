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
                React.createElement("p", null, t('The Witcher 3 game extension executes a series of file merges for menu mods '
                    + 'whenever mods are deployed. (separate from the ones done using the script '
                    + 'merger utility) To ensure that Vortex includes the correct data when '
                    + 'uploading this collection, please make sure that the mods are enabled and '
                    + 'deployed before attempting to upload the collection.')),
                React.createElement("p", null, t('Additionally - please remember that any script merges (if applicable) done '
                    + 'through the script merger utility, should be reviewed before uploading to '
                    + 'only include merges that are necessary for the collection to function correctly. '
                    + 'Merged scripts referencing a mod that is not included in your collection will most '
                    + 'definitively cause the game to crash!')),
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('A preview of the load order for the mods that ' +
                    'are included in the current collection. If you wish to modify the load ' +
                    'please do so by opening the Load Order page; any changes made there ' +
                    'will be reflected in this collection.')),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQixxREFBbUU7QUFDbkUsaURBQWdEO0FBQ2hELDZDQUFzQztBQUV0QywyQ0FDb0Q7QUFHcEQsOENBQTZEO0FBRTdELE1BQU0sU0FBUyxHQUFXLDhCQUE4QixDQUFDO0FBbUJ6RCxNQUFNLG1CQUFvQixTQUFRLHdCQUFvQztJQU9wRSxZQUFZLEtBQWE7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBK0NQLHNCQUFpQixHQUFHLEdBQUcsRUFBRTtZQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDdEUsQ0FBQyxDQUFBO1FBQ08sdUJBQWtCLEdBQUcsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxvQkFBQyx3QkFBTSxJQUNiLEVBQUUsRUFBQyxlQUFlLEVBQ2xCLFNBQVMsRUFBQyx5QkFBeUIsRUFDbkMsT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFDL0IsT0FBTyxFQUFDLE9BQU8sSUFFZCxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FDbkIsQ0FBQyxDQUFDO1FBQ2IsQ0FBQyxDQUFBO1FBRU8sc0JBQWlCLEdBQUcsR0FBRyxFQUFFO1lBQy9CLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLE9BQU8sQ0FDTCxvQkFBQyw2QkFBZ0IsSUFDZixJQUFJLEVBQUMsV0FBVyxFQUNoQixJQUFJLEVBQUUsQ0FBQyxDQUFDLHlFQUF5RSxDQUFDLEVBQ2xGLE9BQU8sRUFB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QyxDQUNuRCxxQkFBTyxDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUMxQyxtQkFBbUIsQ0FBUSxDQUFrRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgd2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBDb21wb25lbnRFeCwgRW1wdHlQbGFjZWhvbGRlciwgRmxleExheW91dCxcclxuICBzZWxlY3RvcnMsIHR5cGVzLCBVc2FnZSwgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMsIElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4uL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbkxvYWRPcmRlciB9IGZyb20gJy4uL2NvbGxlY3Rpb25zL3V0aWwnO1xyXG5cclxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VTdGF0ZSB7XHJcbiAgc29ydGVkTW9kczogSUxvYWRPcmRlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgZ2FtZUlkOiBzdHJpbmc7XHJcbiAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfTtcclxuICBsb2FkT3JkZXI6IElMb2FkT3JkZXI7XHJcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElBY3Rpb25Qcm9wcyAmIElFeHRlbmRlZEludGVyZmFjZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xyXG50eXBlIElDb21wb25lbnRTdGF0ZSA9IElCYXNlU3RhdGU7XHJcblxyXG5jbGFzcyBDb2xsZWN0aW9uc0RhdGFWaWV3IGV4dGVuZHMgQ29tcG9uZW50RXg8SVByb3BzLCBJQ29tcG9uZW50U3RhdGU+IHtcclxuICBwdWJsaWMgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyhuZXdQcm9wczogSVByb3BzLCBzdGF0ZTogSUNvbXBvbmVudFN0YXRlKSB7XHJcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gbmV3UHJvcHM7XHJcbiAgICBjb25zdCBzb3J0ZWRNb2RzID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pO1xyXG4gICAgcmV0dXJuIChzb3J0ZWRNb2RzICE9PSBzdGF0ZS5zb3J0ZWRNb2RzKSA/IHsgc29ydGVkTW9kcyB9IDogbnVsbDtcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJUHJvcHMpIHtcclxuICAgIHN1cGVyKHByb3BzKTtcclxuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBwcm9wcztcclxuICAgIHRoaXMuaW5pdFN0YXRlKHtcclxuICAgICAgc29ydGVkTW9kczogZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pIHx8IHt9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY29tcG9uZW50RGlkTW91bnQoKSB7XHJcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gdGhpcy5wcm9wcztcclxuICAgIHRoaXMubmV4dFN0YXRlLnNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcclxuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcclxuICAgIGNvbnN0IHsgc29ydGVkTW9kcyB9ID0gdGhpcy5zdGF0ZTtcclxuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcclxuICAgICAgPyAoXHJcbiAgICAgICAgPGRpdiBzdHlsZT17eyBvdmVyZmxvdzogJ2F1dG8nIH19PlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnVGhlIFdpdGNoZXIgMyBnYW1lIGV4dGVuc2lvbiBleGVjdXRlcyBhIHNlcmllcyBvZiBmaWxlIG1lcmdlcyBmb3IgbWVudSBtb2RzICdcclxuICAgICAgICAgICArICd3aGVuZXZlciBtb2RzIGFyZSBkZXBsb3llZC4gKHNlcGFyYXRlIGZyb20gdGhlIG9uZXMgZG9uZSB1c2luZyB0aGUgc2NyaXB0ICdcclxuICAgICAgICAgICArICdtZXJnZXIgdXRpbGl0eSkgVG8gZW5zdXJlIHRoYXQgVm9ydGV4IGluY2x1ZGVzIHRoZSBjb3JyZWN0IGRhdGEgd2hlbiAnXHJcbiAgICAgICAgICAgKyAndXBsb2FkaW5nIHRoaXMgY29sbGVjdGlvbiwgcGxlYXNlIG1ha2Ugc3VyZSB0aGF0IHRoZSBtb2RzIGFyZSBlbmFibGVkIGFuZCAnXHJcbiAgICAgICAgICAgKyAnZGVwbG95ZWQgYmVmb3JlIGF0dGVtcHRpbmcgdG8gdXBsb2FkIHRoZSBjb2xsZWN0aW9uLicpfVxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnQWRkaXRpb25hbGx5IC0gcGxlYXNlIHJlbWVtYmVyIHRoYXQgYW55IHNjcmlwdCBtZXJnZXMgKGlmIGFwcGxpY2FibGUpIGRvbmUgJ1xyXG4gICAgICAgICAgICsgJ3Rocm91Z2ggdGhlIHNjcmlwdCBtZXJnZXIgdXRpbGl0eSwgc2hvdWxkIGJlIHJldmlld2VkIGJlZm9yZSB1cGxvYWRpbmcgdG8gJ1xyXG4gICAgICAgICAgICsgJ29ubHkgaW5jbHVkZSBtZXJnZXMgdGhhdCBhcmUgbmVjZXNzYXJ5IGZvciB0aGUgY29sbGVjdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkuICdcclxuICAgICAgICAgICArICdNZXJnZWQgc2NyaXB0cyByZWZlcmVuY2luZyBhIG1vZCB0aGF0IGlzIG5vdCBpbmNsdWRlZCBpbiB5b3VyIGNvbGxlY3Rpb24gd2lsbCBtb3N0ICdcclxuICAgICAgICAgICArICdkZWZpbml0aXZlbHkgY2F1c2UgdGhlIGdhbWUgdG8gY3Jhc2ghJyl9XHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8aDQ+e3QoJ0xvYWQgT3JkZXInKX08L2g0PlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICB7dCgnQSBwcmV2aWV3IG9mIHRoZSBsb2FkIG9yZGVyIGZvciB0aGUgbW9kcyB0aGF0ICcgK1xyXG4gICAgICAgICAgICAgJ2FyZSBpbmNsdWRlZCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLiBJZiB5b3Ugd2lzaCB0byBtb2RpZnkgdGhlIGxvYWQgJyArXHJcbiAgICAgICAgICAgICAncGxlYXNlIGRvIHNvIGJ5IG9wZW5pbmcgdGhlIExvYWQgT3JkZXIgcGFnZTsgYW55IGNoYW5nZXMgbWFkZSB0aGVyZSAnICtcclxuICAgICAgICAgICAgICd3aWxsIGJlIHJlZmxlY3RlZCBpbiB0aGlzIGNvbGxlY3Rpb24uJylcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDxMaXN0R3JvdXAgaWQ9J2NvbGxlY3Rpb25zLWxvYWQtb3JkZXItbGlzdCc+XHJcbiAgICAgICAgICAgIHtPYmplY3Qua2V5cyhzb3J0ZWRNb2RzKS5tYXAodGhpcy5yZW5kZXJNb2RFbnRyeSl9XHJcbiAgICAgICAgICA8L0xpc3RHcm91cD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICkgOiB0aGlzLnJlbmRlclBsYWNlaG9sZGVyKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xyXG4gICAgdGhpcy5jb250ZXh0LmFwaS5ldmVudHMuZW1pdCgnc2hvdy1tYWluLXBhZ2UnLCAnZ2VuZXJpYy1sb2Fkb3JkZXInKTtcclxuICB9XHJcbiAgcHJpdmF0ZSByZW5kZXJPcGVuTE9CdXR0b24gPSAoKSA9PiB7XHJcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XHJcbiAgICByZXR1cm4gKDxCdXR0b25cclxuICAgICAgaWQ9J2J0bi1tb3JlLW1vZHMnXHJcbiAgICAgIGNsYXNzTmFtZT0nY29sbGVjdGlvbi1hZGQtbW9kcy1idG4nXHJcbiAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XHJcbiAgICAgIGJzU3R5bGU9J2dob3N0J1xyXG4gICAgPlxyXG4gICAgICB7dCgnT3BlbiBMb2FkIE9yZGVyIFBhZ2UnKX1cclxuICAgIDwvQnV0dG9uPik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlclBsYWNlaG9sZGVyID0gKCkgPT4ge1xyXG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPEVtcHR5UGxhY2Vob2xkZXJcclxuICAgICAgICBpY29uPSdzb3J0LW5vbmUnXHJcbiAgICAgICAgdGV4dD17dCgnWW91IGhhdmUgbm8gbG9hZCBvcmRlciBlbnRyaWVzIChmb3IgdGhlIGN1cnJlbnQgbW9kcyBpbiB0aGUgY29sbGVjdGlvbiknKX1cclxuICAgICAgICBzdWJ0ZXh0PXt0aGlzLnJlbmRlck9wZW5MT0J1dHRvbigpfVxyXG4gICAgICAvPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyTW9kRW50cnkgPSAobW9kSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3QgbG9FbnRyeTogSUxvYWRPcmRlckVudHJ5ID0gdGhpcy5zdGF0ZS5zb3J0ZWRNb2RzW21vZElkXTtcclxuICAgIGNvbnN0IGtleSA9IG1vZElkICsgSlNPTi5zdHJpbmdpZnkobG9FbnRyeSk7XHJcbiAgICBjb25zdCBuYW1lID0gdXRpbC5yZW5kZXJNb2ROYW1lKHRoaXMucHJvcHMubW9kc1ttb2RJZF0pIHx8IG1vZElkO1xyXG4gICAgY29uc3QgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeScsICdjb2xsZWN0aW9uLXRhYiddO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPExpc3RHcm91cEl0ZW1cclxuICAgICAgICBrZXk9e2tleX1cclxuICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxyXG4gICAgICA+XHJcbiAgICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93Jz5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT0nbG9hZC1vcmRlci1pbmRleCc+e2xvRW50cnkucG9zfTwvcD5cclxuICAgICAgICAgIDxwPntuYW1lfTwvcD5cclxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XHJcbiAgICAgIDwvTGlzdEdyb3VwSXRlbT5cclxuICAgICk7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBlbXB0eSA9IHt9O1xyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKSB8fCB1bmRlZmluZWQ7XHJcbiAgbGV0IGxvYWRPcmRlcjogSUxvYWRPcmRlciA9IHt9O1xyXG4gIGlmICghIXByb2ZpbGU/LmdhbWVJZCkge1xyXG4gICAgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIGVtcHR5KTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBnYW1lSWQ6IHByb2ZpbGU/LmdhbWVJZCxcclxuICAgIGxvYWRPcmRlcixcclxuICAgIG1vZHM6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBwcm9maWxlLmdhbWVJZF0sIHt9KSxcclxuICAgIHByb2ZpbGUsXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoOiBhbnkpOiBJQWN0aW9uUHJvcHMge1xyXG4gIHJldHVybiB7fTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgd2l0aFRyYW5zbGF0aW9uKFsnY29tbW9uJywgTkFNRVNQQUNFXSkoXHJcbiAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3KSBhcyBhbnkpIGFzIFJlYWN0LkNvbXBvbmVudENsYXNzPElFeHRlbmRlZEludGVyZmFjZVByb3BzPjtcclxuIl19