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
    const dispatch = (0, react_redux_1.useDispatch)();
    const onSetLoadOrder = React.useCallback((profileId, loadOrder) => {
        dispatch(vortex_api_1.actions.setFBLoadOrder(profileId, loadOrder));
    }, [dispatch, stateProps.profile.id, stateProps.loadOrder]);
    return renderDraggable(Object.assign(Object.assign(Object.assign({}, props), stateProps), { onSetLoadOrder }));
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
    const context = React.useContext(vortex_api_1.MainContext);
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
    const onApplyIndex = React.useCallback((idx) => {
        const { item, onSetLoadOrder, profile, loadOrder } = props;
        const currentIdx = currentPosition(props);
        if (currentIdx === idx) {
            return;
        }
        const entry = Object.assign(Object.assign({}, item.loEntry), { index: idx });
        const newLO = loadOrder.filter((entry) => entry.id !== item.loEntry.id);
        newLO.splice(idx - 1, 0, entry);
        onSetLoadOrder(profile.id, newLO);
    }, [dispatch, profile, item]);
    const checkBox = () => (item.displayCheckboxes)
        ? (React.createElement(react_bootstrap_1.Checkbox, { className: 'entry-checkbox', checked: item.loEntry.enabled, disabled: isLocked(item.loEntry), onChange: onStatusChange }))
        : null;
    const lock = () => (isLocked(item.loEntry))
        ? (React.createElement(vortex_api_1.Icon, { className: 'locked-entry-logo', name: 'locked' })) : null;
    return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' '), ref: props.item.setRef },
        React.createElement(vortex_api_1.Icon, { className: 'drag-handle-icon', name: 'drag-handle' }),
        React.createElement(vortex_api_1.LoadOrderIndexInput, { className: 'load-order-index', api: context.api, item: item, currentPosition: currentPosition(props), lockedEntriesCount: lockedEntriesCount(props), loadOrder: loadOrder, isLocked: isLocked, onApplyIndex: onApplyIndex }),
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
const currentPosition = (props) => {
    const { item, loadOrder } = props;
    return loadOrder.findIndex(entry => entry.id === item.loEntry.id) + 1;
};
const lockedEntriesCount = (props) => {
    const { loadOrder } = props;
    const locked = loadOrder.filter(item => isLocked(item));
    return locked.length;
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSXRlbVJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSXRlbVJlbmRlcmVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQixxREFBMEQ7QUFDMUQsaURBQStDO0FBQy9DLDZDQUF1RDtBQUV2RCwyQ0FBOEc7QUFDOUcsc0NBQW9EO0FBcUJwRCxTQUFnQixZQUFZLENBQUMsS0FBaUI7O0lBQzVDLElBQUksQ0FBQSxNQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxJQUFJLDBDQUFFLE9BQU8sTUFBSyxTQUFTLEVBQUU7UUFDdEMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE1BQU0sVUFBVSxHQUFHLElBQUEseUJBQVcsRUFBQyxlQUFlLENBQUMsQ0FBQztJQUNoRCxNQUFNLFFBQVEsR0FBRyxJQUFBLHlCQUFXLEdBQUUsQ0FBQztJQUMvQixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUN0QyxDQUFDLFNBQWlCLEVBQUUsU0FBMEIsRUFBRSxFQUFFO1FBQ2hELFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDLEVBQ0QsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUN4RCxDQUFBO0lBQ0QsT0FBTyxlQUFlLCtDQUFNLEtBQUssR0FBSyxVQUFVLEtBQUUsY0FBYyxJQUFHLENBQUM7QUFDdEUsQ0FBQztBQWJELG9DQWFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFhO0lBQzFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUMvQyxNQUFNLFlBQVksR0FBRyxDQUFDLGNBQWMsS0FBSyxTQUFTLENBQUM7UUFDakQsQ0FBQyxD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SyxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzNFLFFBQVEsRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLENBQUM7UUFDcEQsSUFBSSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQztLQUMvRCxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgQ2hlY2tib3gsIExpc3RHcm91cEl0ZW0gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xyXG5pbXBvcnQgeyB1c2VEaXNwYXRjaCwgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBhY3Rpb25zLCBJY29uLCBMb2FkT3JkZXJJbmRleElucHV0LCB0b29sdGlwLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsLCBNYWluQ29udGV4dCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBJMThOX05BTUVTUEFDRSwgR0FNRV9JRCB9IGZyb20gJy4uL2NvbW1vbic7XHJcbmltcG9ydCB7IElJdGVtUmVuZGVyZXJQcm9wcyB9IGZyb20gJy4uL3R5cGVzJztcclxuXHJcbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xyXG4gIG9uU2V0TG9hZE9yZGVyOiAocHJvZmlsZUlkOiBzdHJpbmcsIGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKSA9PiB2b2lkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcclxuICBtb2RTdGF0ZTogYW55O1xyXG4gIGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG4gIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBjbGFzc05hbWU/OiBzdHJpbmc7XHJcbiAgaXRlbTogSUl0ZW1SZW5kZXJlclByb3BzO1xyXG59XHJcblxyXG50eXBlIElQcm9wcyA9IElCYXNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHMgJiBJQWN0aW9uUHJvcHM7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSXRlbVJlbmRlcmVyKHByb3BzOiBJQmFzZVByb3BzKSB7XHJcbiAgaWYgKHByb3BzPy5pdGVtPy5sb0VudHJ5ID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBjb25zdCBzdGF0ZVByb3BzID0gdXNlU2VsZWN0b3IobWFwU3RhdGVUb1Byb3BzKTtcclxuICBjb25zdCBkaXNwYXRjaCA9IHVzZURpc3BhdGNoKCk7XHJcbiAgY29uc3Qgb25TZXRMb2FkT3JkZXIgPSBSZWFjdC51c2VDYWxsYmFjayhcclxuICAgIChwcm9maWxlSWQ6IHN0cmluZywgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIpID0+IHtcclxuICAgICAgZGlzcGF0Y2goYWN0aW9ucy5zZXRGQkxvYWRPcmRlcihwcm9maWxlSWQsIGxvYWRPcmRlcikpO1xyXG4gICAgfSxcclxuICAgIFtkaXNwYXRjaCwgc3RhdGVQcm9wcy5wcm9maWxlLmlkLCBzdGF0ZVByb3BzLmxvYWRPcmRlcl1cclxuICApXHJcbiAgcmV0dXJuIHJlbmRlckRyYWdnYWJsZSh7IC4uLnByb3BzLCAuLi5zdGF0ZVByb3BzLCBvblNldExvYWRPcmRlciB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyVmFsaWRhdGlvbkVycm9yKHByb3BzOiBJUHJvcHMpOiBKU1guRWxlbWVudCB7XHJcbiAgY29uc3QgeyBpbnZhbGlkRW50cmllcywgbG9FbnRyeSB9ID0gcHJvcHMuaXRlbTtcclxuICBjb25zdCBpbnZhbGlkRW50cnkgPSAoaW52YWxpZEVudHJpZXMgIT09IHVuZGVmaW5lZClcclxuICAgID8gaW52YWxpZEVudHJpZXMuZmluZChpbnYgPT4gaW52LmlkLnRvTG93ZXJDYXNlKCkgPT09IGxvRW50cnkuaWQudG9Mb3dlckNhc2UoKSlcclxuICAgIDogdW5kZWZpbmVkO1xyXG4gIHJldHVybiAoaW52YWxpZEVudHJ5ICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IChcclxuICAgICAgPHRvb2x0aXAuSWNvblxyXG4gICAgICAgIGNsYXNzTmFtZT0nZmJsby1pbnZhbGlkLWVudHJ5J1xyXG4gICAgICAgIG5hbWU9J2ZlZWRiYWNrLWVycm9yJ1xyXG4gICAgICAgIHRvb2x0aXA9e2ludmFsaWRFbnRyeS5yZWFzb259XHJcbiAgICAgIC8+XHJcbiAgICApIDogbnVsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyVmlld01vZEljb24ocHJvcHM6IElQcm9wcyk6IEpTWC5FbGVtZW50IHtcclxuICBjb25zdCB7IGl0ZW0sIG1vZHMgfSA9IHByb3BzO1xyXG4gIGlmIChpc0V4dGVybmFsKGl0ZW0ubG9FbnRyeSkgfHwgaXRlbS5sb0VudHJ5Lm1vZElkID09PSBpdGVtLmxvRW50cnkubmFtZSkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KE1haW5Db250ZXh0KTtcclxuICBjb25zdCBbdF0gPSB1c2VUcmFuc2xhdGlvbihJMThOX05BTUVTUEFDRSk7XHJcbiAgY29uc3Qgb25DbGljayA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcclxuICAgIGNvbnN0IHsgbW9kSWQgfSA9IGl0ZW0ubG9FbnRyeTtcclxuICAgIGNvbnN0IG1vZCA9IG1vZHM/Llttb2RJZF07XHJcbiAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYmF0Y2hlZCA9IFtcclxuICAgICAgYWN0aW9ucy5zZXRBdHRyaWJ1dGVGaWx0ZXIoJ21vZHMnLCAnbmFtZScsIHV0aWwucmVuZGVyTW9kTmFtZShtb2QpKSxcclxuICAgIF07XHJcbiAgICB1dGlsLmJhdGNoRGlzcGF0Y2goY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2gsIGJhdGNoZWQpO1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ01vZHMnKTtcclxuICB9LCBbaXRlbSwgbW9kcywgY29udGV4dF0pO1xyXG4gIHJldHVybiBpdGVtLmxvRW50cnkubW9kSWQgIT09IHVuZGVmaW5lZCA/IChcclxuICAgIDx0b29sdGlwLkljb25CdXR0b25cclxuICAgICAgY2xhc3NOYW1lPSd3aXRjaGVyMy12aWV3LW1vZC1pY29uJ1xyXG4gICAgICBpY29uPSdvcGVuLWV4dCdcclxuICAgICAgdG9vbHRpcD17dCgnVmlldyBzb3VyY2UgTW9kJyl9XHJcbiAgICAgIG9uQ2xpY2s9e29uQ2xpY2t9XHJcbiAgICAvPlxyXG4gICkgOiBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJFeHRlcm5hbEJhbm5lcihpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRW50cnkpOiBKU1guRWxlbWVudCB7XHJcbiAgY29uc3QgW3RdID0gdXNlVHJhbnNsYXRpb24oSTE4Tl9OQU1FU1BBQ0UpO1xyXG4gIHJldHVybiBpc0V4dGVybmFsKGl0ZW0pID8gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9J2xvYWQtb3JkZXItdW5tYW5hZ2VkLWJhbm5lcic+XHJcbiAgICAgIDxJY29uIGNsYXNzTmFtZT0nZXh0ZXJuYWwtY2F1dGlvbi1sb2dvJyBuYW1lPSdmZWVkYmFjay13YXJuaW5nJyAvPlxyXG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2V4dGVybmFsLXRleHQtYXJlYSc+e3QoJ05vdCBtYW5hZ2VkIGJ5IFZvcnRleCcpfTwvc3Bhbj5cclxuICAgIDwvZGl2PlxyXG4gICkgOiBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJEcmFnZ2FibGUocHJvcHM6IElQcm9wcyk6IEpTWC5FbGVtZW50IHtcclxuICBjb25zdCB7IGxvYWRPcmRlciwgY2xhc3NOYW1lLCBpdGVtLCBwcm9maWxlIH0gPSBwcm9wcztcclxuICBjb25zdCBrZXkgPSAhIWl0ZW0/LmxvRW50cnk/Lm5hbWUgPyBgJHtpdGVtLmxvRW50cnkubmFtZX1gIDogYCR7aXRlbS5sb0VudHJ5LmlkfWA7XHJcbiAgY29uc3QgY29udGV4dCA9IFJlYWN0LnVzZUNvbnRleHQoTWFpbkNvbnRleHQpO1xyXG4gIGNvbnN0IGRpc3BhdGNoID0gdXNlRGlzcGF0Y2goKTtcclxuICBjb25zdCBwb3NpdGlvbiA9IGxvYWRPcmRlci5maW5kSW5kZXgoZW50cnkgPT4gZW50cnkuaWQgPT09IGl0ZW0ubG9FbnRyeS5pZCkgKyAxO1xyXG5cclxuICBsZXQgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeSddO1xyXG4gIGlmIChjbGFzc05hbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgY2xhc3NlcyA9IGNsYXNzZXMuY29uY2F0KGNsYXNzTmFtZS5zcGxpdCgnICcpKTtcclxuICB9XHJcblxyXG4gIGlmIChpc0V4dGVybmFsKGl0ZW0ubG9FbnRyeSkpIHtcclxuICAgIGNsYXNzZXMgPSBjbGFzc2VzLmNvbmNhdCgnZXh0ZXJuYWwnKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG9uU3RhdHVzQ2hhbmdlID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2dDogYW55KSA9PiB7XHJcbiAgICBjb25zdCBlbnRyeSA9IHtcclxuICAgICAgLi4uaXRlbS5sb0VudHJ5LFxyXG4gICAgICBlbmFibGVkOiBldnQudGFyZ2V0LmNoZWNrZWQsXHJcbiAgICB9O1xyXG4gICAgZGlzcGF0Y2goYWN0aW9ucy5zZXRGQkxvYWRPcmRlckVudHJ5KHByb2ZpbGUuaWQsIGVudHJ5KSlcclxuICB9LCBbZGlzcGF0Y2gsIHByb2ZpbGUsIGl0ZW1dKTtcclxuXHJcbiAgY29uc3Qgb25BcHBseUluZGV4ID0gUmVhY3QudXNlQ2FsbGJhY2soKGlkeDogbnVtYmVyKSA9PiB7XHJcbiAgICBjb25zdCB7IGl0ZW0sIG9uU2V0TG9hZE9yZGVyLCBwcm9maWxlLCBsb2FkT3JkZXIgfSA9IHByb3BzO1xyXG4gICAgY29uc3QgY3VycmVudElkeCA9IGN1cnJlbnRQb3NpdGlvbihwcm9wcyk7XHJcbiAgICBpZiAoY3VycmVudElkeCA9PT0gaWR4KSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICBcclxuICAgIGNvbnN0IGVudHJ5ID0ge1xyXG4gICAgICAuLi5pdGVtLmxvRW50cnksXHJcbiAgICAgIGluZGV4OiBpZHgsXHJcbiAgICB9O1xyXG4gIFxyXG4gICAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIuZmlsdGVyKChlbnRyeSkgPT4gZW50cnkuaWQgIT09IGl0ZW0ubG9FbnRyeS5pZCk7XHJcbiAgICBuZXdMTy5zcGxpY2UoaWR4IC0gMSwgMCwgZW50cnkpO1xyXG4gICAgb25TZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8pO1xyXG4gIH0sIFtkaXNwYXRjaCwgcHJvZmlsZSwgaXRlbV0pO1xyXG5cclxuICBjb25zdCBjaGVja0JveCA9ICgpID0+IChpdGVtLmRpc3BsYXlDaGVja2JveGVzKVxyXG4gICAgPyAoXHJcbiAgICAgIDxDaGVja2JveFxyXG4gICAgICAgIGNsYXNzTmFtZT0nZW50cnktY2hlY2tib3gnXHJcbiAgICAgICAgY2hlY2tlZD17aXRlbS5sb0VudHJ5LmVuYWJsZWR9XHJcbiAgICAgICAgZGlzYWJsZWQ9e2lzTG9ja2VkKGl0ZW0ubG9FbnRyeSl9XHJcbiAgICAgICAgb25DaGFuZ2U9e29uU3RhdHVzQ2hhbmdlfVxyXG4gICAgICAvPlxyXG4gICAgKVxyXG4gICAgOiBudWxsO1xyXG5cclxuICBjb25zdCBsb2NrID0gKCkgPT4gKGlzTG9ja2VkKGl0ZW0ubG9FbnRyeSkpXHJcbiAgICA/IChcclxuICAgICAgPEljb24gY2xhc3NOYW1lPSdsb2NrZWQtZW50cnktbG9nbycgbmFtZT0nbG9ja2VkJyAvPlxyXG4gICAgKSA6IG51bGw7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8TGlzdEdyb3VwSXRlbVxyXG4gICAgICBrZXk9e2tleX1cclxuICAgICAgY2xhc3NOYW1lPXtjbGFzc2VzLmpvaW4oJyAnKX1cclxuICAgICAgcmVmPXtwcm9wcy5pdGVtLnNldFJlZn1cclxuICAgID5cclxuICAgICAgPEljb24gY2xhc3NOYW1lPSdkcmFnLWhhbmRsZS1pY29uJyBuYW1lPSdkcmFnLWhhbmRsZScgLz5cclxuICAgICAgPExvYWRPcmRlckluZGV4SW5wdXRcclxuICAgICAgICBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnXHJcbiAgICAgICAgYXBpPXtjb250ZXh0LmFwaX1cclxuICAgICAgICBpdGVtPXtpdGVtfVxyXG4gICAgICAgIGN1cnJlbnRQb3NpdGlvbj17Y3VycmVudFBvc2l0aW9uKHByb3BzKX1cclxuICAgICAgICBsb2NrZWRFbnRyaWVzQ291bnQ9e2xvY2tlZEVudHJpZXNDb3VudChwcm9wcyl9XHJcbiAgICAgICAgbG9hZE9yZGVyPXtsb2FkT3JkZXJ9XHJcbiAgICAgICAgaXNMb2NrZWQ9e2lzTG9ja2VkfVxyXG4gICAgICAgIG9uQXBwbHlJbmRleD17b25BcHBseUluZGV4fVxyXG4gICAgICAvPlxyXG4gICAgICB7cmVuZGVyVmFsaWRhdGlvbkVycm9yKHByb3BzKX1cclxuICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLW5hbWUnPntrZXl9PC9wPlxyXG4gICAgICB7cmVuZGVyRXh0ZXJuYWxCYW5uZXIoaXRlbS5sb0VudHJ5KX1cclxuICAgICAge3JlbmRlclZpZXdNb2RJY29uKHByb3BzKX1cclxuICAgICAge2NoZWNrQm94KCl9XHJcbiAgICAgIHtsb2NrKCl9XHJcbiAgICA8L0xpc3RHcm91cEl0ZW0+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNMb2NrZWQoaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIFt0cnVlLCAndHJ1ZScsICdhbHdheXMnXS5pbmNsdWRlcyhpdGVtLmxvY2tlZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRXh0ZXJuYWwoaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChpdGVtLm1vZElkICE9PSB1bmRlZmluZWQpID8gZmFsc2UgOiB0cnVlO1xyXG59XHJcblxyXG5jb25zdCBjdXJyZW50UG9zaXRpb24gPSAocHJvcHM6IElQcm9wcyk6IG51bWJlciA9PiB7XHJcbiAgY29uc3QgeyBpdGVtLCBsb2FkT3JkZXIgfSA9IHByb3BzO1xyXG4gIHJldHVybiBsb2FkT3JkZXIuZmluZEluZGV4KGVudHJ5ID0+IGVudHJ5LmlkID09PSBpdGVtLmxvRW50cnkuaWQpICsgMTtcclxufVxyXG5cclxuY29uc3QgbG9ja2VkRW50cmllc0NvdW50ID0gKHByb3BzOiB7IGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyIH0pOiBudW1iZXIgPT4ge1xyXG4gIGNvbnN0IHsgbG9hZE9yZGVyIH0gPSBwcm9wcztcclxuICBjb25zdCBsb2NrZWQgPSBsb2FkT3JkZXIuZmlsdGVyKGl0ZW0gPT4gaXNMb2NrZWQoaXRlbSkpO1xyXG4gIHJldHVybiBsb2NrZWQubGVuZ3RoO1xyXG59XHJcblxyXG5jb25zdCBlbXB0eSA9IHt9O1xyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByb2ZpbGUsXHJcbiAgICBsb2FkT3JkZXI6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCBbXSksXHJcbiAgICBtb2RTdGF0ZTogdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwgZW1wdHkpLFxyXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSksXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgSXRlbVJlbmRlcmVyO1xyXG4iXX0=