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
exports.ItemRenderer = void 0;
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
function ItemRenderer(props) {
    var _a;
    if (((_a = props === null || props === void 0 ? void 0 : props.item) === null || _a === void 0 ? void 0 : _a.loEntry) === undefined) {
        return null;
    }
    const stateProps = (0, react_redux_1.useSelector)(mapStateToProps);
    return renderDraggable(Object.assign(Object.assign({}, props), stateProps));
}
exports.ItemRenderer = ItemRenderer;
function renderValidationError(props) {
    const { invalidEntries, loEntry } = props.item;
    const invalidEntry = (invalidEntries !== undefined)
        ? invalidEntries.find(inv => inv.id.toLowerCase() === loEntry.id.toLowerCase())
        : undefined;
    return (invalidEntry !== undefined)
        ? (React.createElement(vortex_api_1.tooltip.Icon, { className: 'fblo-invalid-entry', name: 'feedback-error', tooltip: invalidEntry.reason })) : null;
}
function renderViewModIcon(props) {
    const { item, mods } = props;
    if (isExternal(item.loEntry) || item.loEntry.modId === item.loEntry.name) {
        return null;
    }
    const context = React.useContext(vortex_api_1.MainContext);
    const [t] = (0, react_i18next_1.useTranslation)(common_1.I18N_NAMESPACE);
    const onClick = React.useCallback(() => {
        const { modId } = item.loEntry;
        const mod = mods === null || mods === void 0 ? void 0 : mods[modId];
        if (mod === undefined) {
            return;
        }
        const batched = [
            vortex_api_1.actions.setAttributeFilter('mods', 'name', vortex_api_1.util.renderModName(mod)),
        ];
        vortex_api_1.util.batchDispatch(context.api.store.dispatch, batched);
        context.api.events.emit('show-main-page', 'Mods');
    }, [item, mods, context]);
    return item.loEntry.modId !== undefined ? (React.createElement(vortex_api_1.tooltip.IconButton, { className: 'witcher3-view-mod-icon', icon: 'open-ext', tooltip: t('View source Mod'), onClick: onClick })) : null;
}
function renderExternalBanner(item) {
    const [t] = (0, react_i18next_1.useTranslation)(common_1.I18N_NAMESPACE);
    return isExternal(item) ? (React.createElement("div", { className: 'load-order-unmanaged-banner' },
        React.createElement(vortex_api_1.Icon, { className: 'external-caution-logo', name: 'feedback-warning' }),
        React.createElement("span", { className: 'external-text-area' }, t('Not managed by Vortex')))) : null;
}
function renderDraggable(props) {
    var _a;
    const { loadOrder, className, item, profile } = props;
    const key = !!((_a = item === null || item === void 0 ? void 0 : item.loEntry) === null || _a === void 0 ? void 0 : _a.name) ? `${item.loEntry.name}` : `${item.loEntry.id}`;
    const dispatch = (0, react_redux_1.useDispatch)();
    const position = loadOrder.findIndex(entry => entry.id === item.loEntry.id) + 1;
    let classes = ['load-order-entry'];
    if (className !== undefined) {
        classes = classes.concat(className.split(' '));
    }
    if (isExternal(item.loEntry)) {
        classes = classes.concat('external');
    }
    const onStatusChange = React.useCallback((evt) => {
        const entry = Object.assign(Object.assign({}, item.loEntry), { enabled: evt.target.checked });
        dispatch(vortex_api_1.actions.setFBLoadOrderEntry(profile.id, entry));
    }, [dispatch, profile, item]);
    const checkBox = () => (item.displayCheckboxes)
        ? (React.createElement(react_bootstrap_1.Checkbox, { className: 'entry-checkbox', checked: item.loEntry.enabled, disabled: isLocked(item.loEntry), onChange: onStatusChange }))
        : null;
    const lock = () => (isLocked(item.loEntry))
        ? (React.createElement(vortex_api_1.Icon, { className: 'locked-entry-logo', name: 'locked' })) : null;
    return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' '), ref: props.item.setRef },
        React.createElement(vortex_api_1.Icon, { className: 'drag-handle-icon', name: 'drag-handle' }),
        React.createElement("p", { className: 'load-order-index' }, position),
        renderValidationError(props),
        React.createElement("p", { className: 'load-order-name' }, key),
        renderExternalBanner(item.loEntry),
        renderViewModIcon(props),
        checkBox(),
        lock()));
}
function isLocked(item) {
    return [true, 'true', 'always'].includes(item.locked);
}
function isExternal(item) {
    return (item.modId !== undefined) ? false : true;
}
const empty = {};
function mapStateToProps(state) {
    const profile = vortex_api_1.selectors.activeProfile(state);
    return {
        profile,
        loadOrder: vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], []),
        modState: vortex_api_1.util.getSafe(profile, ['modState'], empty),
        mods: vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {}),
    };
}
exports.default = ItemRenderer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSXRlbVJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSXRlbVJlbmRlcmVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQixxREFBMEQ7QUFDMUQsaURBQStDO0FBQy9DLDZDQUF1RDtBQUV2RCwyQ0FBeUY7QUFDekYsc0NBQW9EO0FBaUJwRCxTQUFnQixZQUFZLENBQUMsS0FBaUI7O0lBQzVDLElBQUksQ0FBQSxNQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxJQUFJLDBDQUFFLE9BQU8sTUFBSyxTQUFTLEVBQUU7UUFDdEMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE1BQU0sVUFBVSxHQUFHLElBQUEseUJBQVcsRUFBQyxlQUFlLENBQUMsQ0FBQztJQUNoRCxPQUFPLGVBQWUsaUNBQU0sS0FBSyxHQUFLLFVBQVUsRUFBRyxDQUFDO0FBQ3RELENBQUM7QUFORCxvQ0FNQztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBYTtJQUMxQyxNQUFNLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDL0MsTUFBTSxZQUFZLEdBQUcsQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxPQUFPLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQy9FLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDZCxPQUFPLENBQUMsWUFBWSxLQUFLLFNBQVMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FDQSxvQkFBQyxvQkFBTyxDQUFDLElBQUksSUFDWCxTQUFTLEVBQUMsb0JBQW9CLEVBQzlCLElBQUksRUFBQyxnQkFBZ0IsRUFDckIsT0FBTyxFQUFFLFlBQVksQ0FBQyxNQUFNLEdBQzVCLENBQ0gsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBYTtJQUN0QyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQztJQUM3QixJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7UUFDeEUsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsd0JBQVcsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFBLDhCQUFjLEVBQUMsdUJBQWMsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO1FBQ3JDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQy9CLE1BQU0sR0FBRyxHQUFHLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRyxLQUFLLENBQUMsQ0FBQztRQUMxQixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7WUFDckIsT0FBTztTQUNSO1FBQ0QsTUFBTSxPQUFPLEdBQUc7WUFDZCxvQkFBTyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsaUJBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDcEUsQ0FBQztRQUNGLGlCQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDcEQsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzFCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUN4QyxvQkFBQyxvQkFBTyxDQUFDLFVBQVUsSUFDakIsU0FBUyxFQUFDLHdCQUF3QixFQUNsQyxJQUFJLEVBQUMsVUFBVSxFQUNmLE9BQU8sRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsRUFDN0IsT0FBTyxFQUFFLE9BQU8sR0FDaEIsQ0FDSCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDWCxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUEyQjtJQUN2RCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBQSw4QkFBYyxFQUFDLHVCQUFjLENBQUMsQ0FBQztJQUMzQyxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDeEIsNkJBQUssU0FBUyxFQUFDLDZCQUE2QjtRQUMxQyxvQkFBQyxpQkFBSSxJQUFDLFNBQVMsRUFBQyx1QkFBdUIsRUFBQyxJQUFJLEVBQUMsa0JBQWtCLEdBQUc7UUFDbEUsOEJBQU0sU0FBUyxFQUFDLG9CQUFvQixJQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFRLENBQ3BFLENBQ1AsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ1gsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQWE7O0lBQ3BDLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7SUFDdEQsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUEsTUFBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsT0FBTywwQ0FBRSxJQUFJLENBQUEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDbEYsTUFBTSxRQUFRLEdBQUcsSUFBQSx5QkFBVyxHQUFFLENBQUM7SUFDL0IsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFaEYsSUFBSSxPQUFPLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ25DLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtRQUMzQixPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDaEQ7SUFFRCxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDNUIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDdEM7SUFFRCxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBUSxFQUFFLEVBQUU7UUFDcEQsTUFBTSxLQUFLLG1DQUNOLElBQUksQ0FBQyxPQUFPLEtBQ2YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUM1QixDQUFDO1FBQ0YsUUFBUSxDQUFDLG9CQUFPLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFBO0lBQzFELENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUU5QixNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FDQSxvQkFBQywwQkFBUSxJQUNQLFNBQVMsRUFBQyxnQkFBZ0IsRUFDMUIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUM3QixRQUFRLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFDaEMsUUFBUSxFQUFFLGNBQWMsR0FDeEIsQ0FDSDtRQUNELENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFVCxNQUFNLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQ0Esb0JBQUMsaUJBQUksSUFBQyxTQUFTLEVBQUMsbUJBQW1CLEVBQUMsSUFBSSxFQUFDLFFBQVEsR0FBRyxDQUNyRCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFWCxPQUFPLENBQ0wsb0JBQUMsK0JBQWEsSUFDWixHQUFHLEVBQUUsR0FBRyxFQUNSLFNBQVMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUM1QixHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNO1FBRXRCLG9CQUFDLGlCQUFJLElBQUMsU0FBUyxFQUFDLGtCQUFrQixFQUFDLElBQUksRUFBQyxhQUFhLEdBQUc7UUFDeEQsMkJBQUcsU0FBUyxFQUFDLGtCQUFrQixJQUFFLFFBQVEsQ0FBSztRQUM3QyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7UUFDN0IsMkJBQUcsU0FBUyxFQUFDLGlCQUFpQixJQUFFLEdBQUcsQ0FBSztRQUN2QyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ2xDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQUN4QixRQUFRLEVBQUU7UUFDVixJQUFJLEVBQUUsQ0FDTyxDQUNqQixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLElBQTJCO0lBQzNDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLElBQTJCO0lBQzdDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNuRCxDQUFDO0FBRUQsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLFNBQVMsZUFBZSxDQUFDLEtBQW1CO0lBQzFDLE1BQU0sT0FBTyxHQUFtQixzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvRCxPQUFPO1FBQ0wsT0FBTztRQUNQLFNBQVMsRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDM0UsUUFBUSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQztRQUNwRCxJQUFJLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDO0tBQy9ELENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBDaGVja2JveCwgTGlzdEdyb3VwSXRlbSB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XHJcbmltcG9ydCB7IHVzZURpc3BhdGNoLCB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuXHJcbmltcG9ydCB7IGFjdGlvbnMsIEljb24sIHRvb2x0aXAsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwsIE1haW5Db250ZXh0IH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEkxOE5fTkFNRVNQQUNFLCBHQU1FX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcclxuaW1wb3J0IHsgSUl0ZW1SZW5kZXJlclByb3BzIH0gZnJvbSAnLi4vdHlwZXMnO1xyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgbW9kU3RhdGU6IGFueTtcclxuICBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcjtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xyXG4gIGl0ZW06IElJdGVtUmVuZGVyZXJQcm9wcztcclxufVxyXG5cclxudHlwZSBJUHJvcHMgPSBJQmFzZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEl0ZW1SZW5kZXJlcihwcm9wczogSUJhc2VQcm9wcykge1xyXG4gIGlmIChwcm9wcz8uaXRlbT8ubG9FbnRyeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgY29uc3Qgc3RhdGVQcm9wcyA9IHVzZVNlbGVjdG9yKG1hcFN0YXRlVG9Qcm9wcyk7XHJcbiAgcmV0dXJuIHJlbmRlckRyYWdnYWJsZSh7IC4uLnByb3BzLCAuLi5zdGF0ZVByb3BzIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJWYWxpZGF0aW9uRXJyb3IocHJvcHM6IElQcm9wcyk6IEpTWC5FbGVtZW50IHtcclxuICBjb25zdCB7IGludmFsaWRFbnRyaWVzLCBsb0VudHJ5IH0gPSBwcm9wcy5pdGVtO1xyXG4gIGNvbnN0IGludmFsaWRFbnRyeSA9IChpbnZhbGlkRW50cmllcyAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBpbnZhbGlkRW50cmllcy5maW5kKGludiA9PiBpbnYuaWQudG9Mb3dlckNhc2UoKSA9PT0gbG9FbnRyeS5pZC50b0xvd2VyQ2FzZSgpKVxyXG4gICAgOiB1bmRlZmluZWQ7XHJcbiAgcmV0dXJuIChpbnZhbGlkRW50cnkgIT09IHVuZGVmaW5lZClcclxuICAgID8gKFxyXG4gICAgICA8dG9vbHRpcC5JY29uXHJcbiAgICAgICAgY2xhc3NOYW1lPSdmYmxvLWludmFsaWQtZW50cnknXHJcbiAgICAgICAgbmFtZT0nZmVlZGJhY2stZXJyb3InXHJcbiAgICAgICAgdG9vbHRpcD17aW52YWxpZEVudHJ5LnJlYXNvbn1cclxuICAgICAgLz5cclxuICAgICkgOiBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJWaWV3TW9kSWNvbihwcm9wczogSVByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIGNvbnN0IHsgaXRlbSwgbW9kcyB9ID0gcHJvcHM7XHJcbiAgaWYgKGlzRXh0ZXJuYWwoaXRlbS5sb0VudHJ5KSB8fCBpdGVtLmxvRW50cnkubW9kSWQgPT09IGl0ZW0ubG9FbnRyeS5uYW1lKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgY29uc3QgY29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoTWFpbkNvbnRleHQpO1xyXG4gIGNvbnN0IFt0XSA9IHVzZVRyYW5zbGF0aW9uKEkxOE5fTkFNRVNQQUNFKTtcclxuICBjb25zdCBvbkNsaWNrID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xyXG4gICAgY29uc3QgeyBtb2RJZCB9ID0gaXRlbS5sb0VudHJ5O1xyXG4gICAgY29uc3QgbW9kID0gbW9kcz8uW21vZElkXTtcclxuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBiYXRjaGVkID0gW1xyXG4gICAgICBhY3Rpb25zLnNldEF0dHJpYnV0ZUZpbHRlcignbW9kcycsICduYW1lJywgdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCkpLFxyXG4gICAgXTtcclxuICAgIHV0aWwuYmF0Y2hEaXNwYXRjaChjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaCwgYmF0Y2hlZCk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMuZW1pdCgnc2hvdy1tYWluLXBhZ2UnLCAnTW9kcycpO1xyXG4gIH0sIFtpdGVtLCBtb2RzLCBjb250ZXh0XSk7XHJcbiAgcmV0dXJuIGl0ZW0ubG9FbnRyeS5tb2RJZCAhPT0gdW5kZWZpbmVkID8gKFxyXG4gICAgPHRvb2x0aXAuSWNvbkJ1dHRvblxyXG4gICAgICBjbGFzc05hbWU9J3dpdGNoZXIzLXZpZXctbW9kLWljb24nXHJcbiAgICAgIGljb249J29wZW4tZXh0J1xyXG4gICAgICB0b29sdGlwPXt0KCdWaWV3IHNvdXJjZSBNb2QnKX1cclxuICAgICAgb25DbGljaz17b25DbGlja31cclxuICAgIC8+XHJcbiAgKSA6IG51bGw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckV4dGVybmFsQmFubmVyKGl0ZW06IHR5cGVzLklMb2FkT3JkZXJFbnRyeSk6IEpTWC5FbGVtZW50IHtcclxuICBjb25zdCBbdF0gPSB1c2VUcmFuc2xhdGlvbihJMThOX05BTUVTUEFDRSk7XHJcbiAgcmV0dXJuIGlzRXh0ZXJuYWwoaXRlbSkgPyAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT0nbG9hZC1vcmRlci11bm1hbmFnZWQtYmFubmVyJz5cclxuICAgICAgPEljb24gY2xhc3NOYW1lPSdleHRlcm5hbC1jYXV0aW9uLWxvZ28nIG5hbWU9J2ZlZWRiYWNrLXdhcm5pbmcnIC8+XHJcbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZXh0ZXJuYWwtdGV4dC1hcmVhJz57dCgnTm90IG1hbmFnZWQgYnkgVm9ydGV4Jyl9PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgKSA6IG51bGw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckRyYWdnYWJsZShwcm9wczogSVByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIGNvbnN0IHsgbG9hZE9yZGVyLCBjbGFzc05hbWUsIGl0ZW0sIHByb2ZpbGUgfSA9IHByb3BzO1xyXG4gIGNvbnN0IGtleSA9ICEhaXRlbT8ubG9FbnRyeT8ubmFtZSA/IGAke2l0ZW0ubG9FbnRyeS5uYW1lfWAgOiBgJHtpdGVtLmxvRW50cnkuaWR9YDtcclxuICBjb25zdCBkaXNwYXRjaCA9IHVzZURpc3BhdGNoKCk7XHJcbiAgY29uc3QgcG9zaXRpb24gPSBsb2FkT3JkZXIuZmluZEluZGV4KGVudHJ5ID0+IGVudHJ5LmlkID09PSBpdGVtLmxvRW50cnkuaWQpICsgMTtcclxuXHJcbiAgbGV0IGNsYXNzZXMgPSBbJ2xvYWQtb3JkZXItZW50cnknXTtcclxuICBpZiAoY2xhc3NOYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGNsYXNzZXMgPSBjbGFzc2VzLmNvbmNhdChjbGFzc05hbWUuc3BsaXQoJyAnKSk7XHJcbiAgfVxyXG5cclxuICBpZiAoaXNFeHRlcm5hbChpdGVtLmxvRW50cnkpKSB7XHJcbiAgICBjbGFzc2VzID0gY2xhc3Nlcy5jb25jYXQoJ2V4dGVybmFsJyk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBvblN0YXR1c0NoYW5nZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChldnQ6IGFueSkgPT4ge1xyXG4gICAgY29uc3QgZW50cnkgPSB7XHJcbiAgICAgIC4uLml0ZW0ubG9FbnRyeSxcclxuICAgICAgZW5hYmxlZDogZXZ0LnRhcmdldC5jaGVja2VkLFxyXG4gICAgfTtcclxuICAgIGRpc3BhdGNoKGFjdGlvbnMuc2V0RkJMb2FkT3JkZXJFbnRyeShwcm9maWxlLmlkLCBlbnRyeSkpXHJcbiAgfSwgW2Rpc3BhdGNoLCBwcm9maWxlLCBpdGVtXSk7XHJcblxyXG4gIGNvbnN0IGNoZWNrQm94ID0gKCkgPT4gKGl0ZW0uZGlzcGxheUNoZWNrYm94ZXMpXHJcbiAgICA/IChcclxuICAgICAgPENoZWNrYm94XHJcbiAgICAgICAgY2xhc3NOYW1lPSdlbnRyeS1jaGVja2JveCdcclxuICAgICAgICBjaGVja2VkPXtpdGVtLmxvRW50cnkuZW5hYmxlZH1cclxuICAgICAgICBkaXNhYmxlZD17aXNMb2NrZWQoaXRlbS5sb0VudHJ5KX1cclxuICAgICAgICBvbkNoYW5nZT17b25TdGF0dXNDaGFuZ2V9XHJcbiAgICAgIC8+XHJcbiAgICApXHJcbiAgICA6IG51bGw7XHJcblxyXG4gIGNvbnN0IGxvY2sgPSAoKSA9PiAoaXNMb2NrZWQoaXRlbS5sb0VudHJ5KSlcclxuICAgID8gKFxyXG4gICAgICA8SWNvbiBjbGFzc05hbWU9J2xvY2tlZC1lbnRyeS1sb2dvJyBuYW1lPSdsb2NrZWQnIC8+XHJcbiAgICApIDogbnVsbDtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxMaXN0R3JvdXBJdGVtXHJcbiAgICAgIGtleT17a2V5fVxyXG4gICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxyXG4gICAgICByZWY9e3Byb3BzLml0ZW0uc2V0UmVmfVxyXG4gICAgPlxyXG4gICAgICA8SWNvbiBjbGFzc05hbWU9J2RyYWctaGFuZGxlLWljb24nIG5hbWU9J2RyYWctaGFuZGxlJyAvPlxyXG4gICAgICA8cCBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnPntwb3NpdGlvbn08L3A+XHJcbiAgICAgIHtyZW5kZXJWYWxpZGF0aW9uRXJyb3IocHJvcHMpfVxyXG4gICAgICA8cCBjbGFzc05hbWU9J2xvYWQtb3JkZXItbmFtZSc+e2tleX08L3A+XHJcbiAgICAgIHtyZW5kZXJFeHRlcm5hbEJhbm5lcihpdGVtLmxvRW50cnkpfVxyXG4gICAgICB7cmVuZGVyVmlld01vZEljb24ocHJvcHMpfVxyXG4gICAgICB7Y2hlY2tCb3goKX1cclxuICAgICAge2xvY2soKX1cclxuICAgIDwvTGlzdEdyb3VwSXRlbT5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xvY2tlZChpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRW50cnkpOiBib29sZWFuIHtcclxuICByZXR1cm4gW3RydWUsICd0cnVlJywgJ2Fsd2F5cyddLmluY2x1ZGVzKGl0ZW0ubG9ja2VkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNFeHRlcm5hbChpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRW50cnkpOiBib29sZWFuIHtcclxuICByZXR1cm4gKGl0ZW0ubW9kSWQgIT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IHRydWU7XHJcbn1cclxuXHJcbmNvbnN0IGVtcHR5ID0ge307XHJcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogdHlwZXMuSVN0YXRlKTogSUNvbm5lY3RlZFByb3BzIHtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICByZXR1cm4ge1xyXG4gICAgcHJvZmlsZSxcclxuICAgIGxvYWRPcmRlcjogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIFtdKSxcclxuICAgIG1vZFN0YXRlOiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCBlbXB0eSksXHJcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KSxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBJdGVtUmVuZGVyZXI7XHJcbiJdfQ==