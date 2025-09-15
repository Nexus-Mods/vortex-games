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
exports.ItemRenderer = ItemRenderer;
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
        React.createElement(vortex_api_1.LoadOrderIndexInput, { className: 'load-order-index', api: context.api, item: item.loEntry, currentPosition: currentPosition(props), lockedEntriesCount: lockedEntriesCount(props), loadOrder: loadOrder, isLocked: isLocked, onApplyIndex: onApplyIndex }),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSXRlbVJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSXRlbVJlbmRlcmVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxvQ0FhQztBQXhDRCw2Q0FBK0I7QUFDL0IscURBQTBEO0FBQzFELGlEQUErQztBQUMvQyw2Q0FBdUQ7QUFFdkQsMkNBQThHO0FBQzlHLHNDQUFvRDtBQXFCcEQsU0FBZ0IsWUFBWSxDQUFDLEtBQWlCOztJQUM1QyxJQUFJLENBQUEsTUFBQSxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsSUFBSSwwQ0FBRSxPQUFPLE1BQUssU0FBUyxFQUFFLENBQUM7UUFDdkMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBQSx5QkFBVyxFQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sUUFBUSxHQUFHLElBQUEseUJBQVcsR0FBRSxDQUFDO0lBQy9CLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQ3RDLENBQUMsU0FBaUIsRUFBRSxTQUEwQixFQUFFLEVBQUU7UUFDaEQsUUFBUSxDQUFDLG9CQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUMsRUFDRCxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQ3hELENBQUE7SUFDRCxPQUFPLGVBQWUsK0NBQU0sS0FBSyxHQUFLLFVBQVUsS0FBRSxjQUFjLElBQUcsQ0FBQztBQUN0RSxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFhO0lBQzFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUMvQyxNQUFNLFlBQVksR0FBRyxDQUFDLGNBQWMsS0FBSyxT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YSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9ELE9BQU87UUFDTCxPQUFPO1FBQ1AsU0FBUyxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMzRSxRQUFRLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDO1FBQ3BELElBQUksRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDL0QsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxZQUFZLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IENoZWNrYm94LCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcclxuaW1wb3J0IHsgdXNlRGlzcGF0Y2gsIHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucywgSWNvbiwgTG9hZE9yZGVySW5kZXhJbnB1dCwgdG9vbHRpcCwgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCwgTWFpbkNvbnRleHQgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgSTE4Tl9OQU1FU1BBQ0UsIEdBTUVfSUQgfSBmcm9tICcuLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJSXRlbVJlbmRlcmVyUHJvcHMgfSBmcm9tICcuLi90eXBlcyc7XHJcblxyXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcclxuICBvblNldExvYWRPcmRlcjogKHByb2ZpbGVJZDogc3RyaW5nLCBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcikgPT4gdm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgbW9kU3RhdGU6IGFueTtcclxuICBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcjtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xyXG4gIGl0ZW06IElJdGVtUmVuZGVyZXJQcm9wcztcclxufVxyXG5cclxudHlwZSBJUHJvcHMgPSBJQmFzZVByb3BzICYgSUNvbm5lY3RlZFByb3BzICYgSUFjdGlvblByb3BzO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEl0ZW1SZW5kZXJlcihwcm9wczogSUJhc2VQcm9wcykge1xyXG4gIGlmIChwcm9wcz8uaXRlbT8ubG9FbnRyeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgY29uc3Qgc3RhdGVQcm9wcyA9IHVzZVNlbGVjdG9yKG1hcFN0YXRlVG9Qcm9wcyk7XHJcbiAgY29uc3QgZGlzcGF0Y2ggPSB1c2VEaXNwYXRjaCgpO1xyXG4gIGNvbnN0IG9uU2V0TG9hZE9yZGVyID0gUmVhY3QudXNlQ2FsbGJhY2soXHJcbiAgICAocHJvZmlsZUlkOiBzdHJpbmcsIGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKSA9PiB7XHJcbiAgICAgIGRpc3BhdGNoKGFjdGlvbnMuc2V0RkJMb2FkT3JkZXIocHJvZmlsZUlkLCBsb2FkT3JkZXIpKTtcclxuICAgIH0sXHJcbiAgICBbZGlzcGF0Y2gsIHN0YXRlUHJvcHMucHJvZmlsZS5pZCwgc3RhdGVQcm9wcy5sb2FkT3JkZXJdXHJcbiAgKVxyXG4gIHJldHVybiByZW5kZXJEcmFnZ2FibGUoeyAuLi5wcm9wcywgLi4uc3RhdGVQcm9wcywgb25TZXRMb2FkT3JkZXIgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlclZhbGlkYXRpb25FcnJvcihwcm9wczogSVByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIGNvbnN0IHsgaW52YWxpZEVudHJpZXMsIGxvRW50cnkgfSA9IHByb3BzLml0ZW07XHJcbiAgY29uc3QgaW52YWxpZEVudHJ5ID0gKGludmFsaWRFbnRyaWVzICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IGludmFsaWRFbnRyaWVzLmZpbmQoaW52ID0+IGludi5pZC50b0xvd2VyQ2FzZSgpID09PSBsb0VudHJ5LmlkLnRvTG93ZXJDYXNlKCkpXHJcbiAgICA6IHVuZGVmaW5lZDtcclxuICByZXR1cm4gKGludmFsaWRFbnRyeSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyAoXHJcbiAgICAgIDx0b29sdGlwLkljb25cclxuICAgICAgICBjbGFzc05hbWU9J2ZibG8taW52YWxpZC1lbnRyeSdcclxuICAgICAgICBuYW1lPSdmZWVkYmFjay1lcnJvcidcclxuICAgICAgICB0b29sdGlwPXtpbnZhbGlkRW50cnkucmVhc29ufVxyXG4gICAgICAvPlxyXG4gICAgKSA6IG51bGw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlclZpZXdNb2RJY29uKHByb3BzOiBJUHJvcHMpOiBKU1guRWxlbWVudCB7XHJcbiAgY29uc3QgeyBpdGVtLCBtb2RzIH0gPSBwcm9wcztcclxuICBpZiAoaXNFeHRlcm5hbChpdGVtLmxvRW50cnkpIHx8IGl0ZW0ubG9FbnRyeS5tb2RJZCA9PT0gaXRlbS5sb0VudHJ5Lm5hbWUpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChNYWluQ29udGV4dCk7XHJcbiAgY29uc3QgW3RdID0gdXNlVHJhbnNsYXRpb24oSTE4Tl9OQU1FU1BBQ0UpO1xyXG4gIGNvbnN0IG9uQ2xpY2sgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XHJcbiAgICBjb25zdCB7IG1vZElkIH0gPSBpdGVtLmxvRW50cnk7XHJcbiAgICBjb25zdCBtb2QgPSBtb2RzPy5bbW9kSWRdO1xyXG4gICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGJhdGNoZWQgPSBbXHJcbiAgICAgIGFjdGlvbnMuc2V0QXR0cmlidXRlRmlsdGVyKCdtb2RzJywgJ25hbWUnLCB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSksXHJcbiAgICBdO1xyXG4gICAgdXRpbC5iYXRjaERpc3BhdGNoKGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoLCBiYXRjaGVkKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdzaG93LW1haW4tcGFnZScsICdNb2RzJyk7XHJcbiAgfSwgW2l0ZW0sIG1vZHMsIGNvbnRleHRdKTtcclxuICByZXR1cm4gaXRlbS5sb0VudHJ5Lm1vZElkICE9PSB1bmRlZmluZWQgPyAoXHJcbiAgICA8dG9vbHRpcC5JY29uQnV0dG9uXHJcbiAgICAgIGNsYXNzTmFtZT0nd2l0Y2hlcjMtdmlldy1tb2QtaWNvbidcclxuICAgICAgaWNvbj0nb3Blbi1leHQnXHJcbiAgICAgIHRvb2x0aXA9e3QoJ1ZpZXcgc291cmNlIE1vZCcpfVxyXG4gICAgICBvbkNsaWNrPXtvbkNsaWNrfVxyXG4gICAgLz5cclxuICApIDogbnVsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyRXh0ZXJuYWxCYW5uZXIoaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KTogSlNYLkVsZW1lbnQge1xyXG4gIGNvbnN0IFt0XSA9IHVzZVRyYW5zbGF0aW9uKEkxOE5fTkFNRVNQQUNFKTtcclxuICByZXR1cm4gaXNFeHRlcm5hbChpdGVtKSA/IChcclxuICAgIDxkaXYgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLXVubWFuYWdlZC1iYW5uZXInPlxyXG4gICAgICA8SWNvbiBjbGFzc05hbWU9J2V4dGVybmFsLWNhdXRpb24tbG9nbycgbmFtZT0nZmVlZGJhY2std2FybmluZycgLz5cclxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdleHRlcm5hbC10ZXh0LWFyZWEnPnt0KCdOb3QgbWFuYWdlZCBieSBWb3J0ZXgnKX08L3NwYW4+XHJcbiAgICA8L2Rpdj5cclxuICApIDogbnVsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyRHJhZ2dhYmxlKHByb3BzOiBJUHJvcHMpOiBKU1guRWxlbWVudCB7XHJcbiAgY29uc3QgeyBsb2FkT3JkZXIsIGNsYXNzTmFtZSwgaXRlbSwgcHJvZmlsZSB9ID0gcHJvcHM7XHJcbiAgY29uc3Qga2V5ID0gISFpdGVtPy5sb0VudHJ5Py5uYW1lID8gYCR7aXRlbS5sb0VudHJ5Lm5hbWV9YCA6IGAke2l0ZW0ubG9FbnRyeS5pZH1gO1xyXG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KE1haW5Db250ZXh0KTtcclxuICBjb25zdCBkaXNwYXRjaCA9IHVzZURpc3BhdGNoKCk7XHJcbiAgY29uc3QgcG9zaXRpb24gPSBsb2FkT3JkZXIuZmluZEluZGV4KGVudHJ5ID0+IGVudHJ5LmlkID09PSBpdGVtLmxvRW50cnkuaWQpICsgMTtcclxuXHJcbiAgbGV0IGNsYXNzZXMgPSBbJ2xvYWQtb3JkZXItZW50cnknXTtcclxuICBpZiAoY2xhc3NOYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGNsYXNzZXMgPSBjbGFzc2VzLmNvbmNhdChjbGFzc05hbWUuc3BsaXQoJyAnKSk7XHJcbiAgfVxyXG5cclxuICBpZiAoaXNFeHRlcm5hbChpdGVtLmxvRW50cnkpKSB7XHJcbiAgICBjbGFzc2VzID0gY2xhc3Nlcy5jb25jYXQoJ2V4dGVybmFsJyk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBvblN0YXR1c0NoYW5nZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChldnQ6IGFueSkgPT4ge1xyXG4gICAgY29uc3QgZW50cnkgPSB7XHJcbiAgICAgIC4uLml0ZW0ubG9FbnRyeSxcclxuICAgICAgZW5hYmxlZDogZXZ0LnRhcmdldC5jaGVja2VkLFxyXG4gICAgfTtcclxuICAgIGRpc3BhdGNoKGFjdGlvbnMuc2V0RkJMb2FkT3JkZXJFbnRyeShwcm9maWxlLmlkLCBlbnRyeSkpXHJcbiAgfSwgW2Rpc3BhdGNoLCBwcm9maWxlLCBpdGVtXSk7XHJcblxyXG4gIGNvbnN0IG9uQXBwbHlJbmRleCA9IFJlYWN0LnVzZUNhbGxiYWNrKChpZHg6IG51bWJlcikgPT4ge1xyXG4gICAgY29uc3QgeyBpdGVtLCBvblNldExvYWRPcmRlciwgcHJvZmlsZSwgbG9hZE9yZGVyIH0gPSBwcm9wcztcclxuICAgIGNvbnN0IGN1cnJlbnRJZHggPSBjdXJyZW50UG9zaXRpb24ocHJvcHMpO1xyXG4gICAgaWYgKGN1cnJlbnRJZHggPT09IGlkeCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgXHJcbiAgICBjb25zdCBlbnRyeSA9IHtcclxuICAgICAgLi4uaXRlbS5sb0VudHJ5LFxyXG4gICAgICBpbmRleDogaWR4LFxyXG4gICAgfTtcclxuICBcclxuICAgIGNvbnN0IG5ld0xPID0gbG9hZE9yZGVyLmZpbHRlcigoZW50cnkpID0+IGVudHJ5LmlkICE9PSBpdGVtLmxvRW50cnkuaWQpO1xyXG4gICAgbmV3TE8uc3BsaWNlKGlkeCAtIDEsIDAsIGVudHJ5KTtcclxuICAgIG9uU2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIG5ld0xPKTtcclxuICB9LCBbZGlzcGF0Y2gsIHByb2ZpbGUsIGl0ZW1dKTtcclxuXHJcbiAgY29uc3QgY2hlY2tCb3ggPSAoKSA9PiAoaXRlbS5kaXNwbGF5Q2hlY2tib3hlcylcclxuICAgID8gKFxyXG4gICAgICA8Q2hlY2tib3hcclxuICAgICAgICBjbGFzc05hbWU9J2VudHJ5LWNoZWNrYm94J1xyXG4gICAgICAgIGNoZWNrZWQ9e2l0ZW0ubG9FbnRyeS5lbmFibGVkfVxyXG4gICAgICAgIGRpc2FibGVkPXtpc0xvY2tlZChpdGVtLmxvRW50cnkpfVxyXG4gICAgICAgIG9uQ2hhbmdlPXtvblN0YXR1c0NoYW5nZX1cclxuICAgICAgLz5cclxuICAgIClcclxuICAgIDogbnVsbDtcclxuXHJcbiAgY29uc3QgbG9jayA9ICgpID0+IChpc0xvY2tlZChpdGVtLmxvRW50cnkpKVxyXG4gICAgPyAoXHJcbiAgICAgIDxJY29uIGNsYXNzTmFtZT0nbG9ja2VkLWVudHJ5LWxvZ28nIG5hbWU9J2xvY2tlZCcgLz5cclxuICAgICkgOiBudWxsO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPExpc3RHcm91cEl0ZW1cclxuICAgICAga2V5PXtrZXl9XHJcbiAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlcy5qb2luKCcgJyl9XHJcbiAgICAgIHJlZj17cHJvcHMuaXRlbS5zZXRSZWZ9XHJcbiAgICA+XHJcbiAgICAgIDxJY29uIGNsYXNzTmFtZT0nZHJhZy1oYW5kbGUtaWNvbicgbmFtZT0nZHJhZy1oYW5kbGUnIC8+XHJcbiAgICAgIDxMb2FkT3JkZXJJbmRleElucHV0XHJcbiAgICAgICAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLWluZGV4J1xyXG4gICAgICAgIGFwaT17Y29udGV4dC5hcGl9XHJcbiAgICAgICAgaXRlbT17aXRlbS5sb0VudHJ5fVxyXG4gICAgICAgIGN1cnJlbnRQb3NpdGlvbj17Y3VycmVudFBvc2l0aW9uKHByb3BzKX1cclxuICAgICAgICBsb2NrZWRFbnRyaWVzQ291bnQ9e2xvY2tlZEVudHJpZXNDb3VudChwcm9wcyl9XHJcbiAgICAgICAgbG9hZE9yZGVyPXtsb2FkT3JkZXJ9XHJcbiAgICAgICAgaXNMb2NrZWQ9e2lzTG9ja2VkfVxyXG4gICAgICAgIG9uQXBwbHlJbmRleD17b25BcHBseUluZGV4fVxyXG4gICAgICAvPlxyXG4gICAgICB7cmVuZGVyVmFsaWRhdGlvbkVycm9yKHByb3BzKX1cclxuICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLW5hbWUnPntrZXl9PC9wPlxyXG4gICAgICB7cmVuZGVyRXh0ZXJuYWxCYW5uZXIoaXRlbS5sb0VudHJ5KX1cclxuICAgICAge3JlbmRlclZpZXdNb2RJY29uKHByb3BzKX1cclxuICAgICAge2NoZWNrQm94KCl9XHJcbiAgICAgIHtsb2NrKCl9XHJcbiAgICA8L0xpc3RHcm91cEl0ZW0+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNMb2NrZWQoaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIFt0cnVlLCAndHJ1ZScsICdhbHdheXMnXS5pbmNsdWRlcyhpdGVtLmxvY2tlZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRXh0ZXJuYWwoaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChpdGVtLm1vZElkICE9PSB1bmRlZmluZWQpID8gZmFsc2UgOiB0cnVlO1xyXG59XHJcblxyXG5jb25zdCBjdXJyZW50UG9zaXRpb24gPSAocHJvcHM6IElQcm9wcyk6IG51bWJlciA9PiB7XHJcbiAgY29uc3QgeyBpdGVtLCBsb2FkT3JkZXIgfSA9IHByb3BzO1xyXG4gIHJldHVybiBsb2FkT3JkZXIuZmluZEluZGV4KGVudHJ5ID0+IGVudHJ5LmlkID09PSBpdGVtLmxvRW50cnkuaWQpICsgMTtcclxufVxyXG5cclxuY29uc3QgbG9ja2VkRW50cmllc0NvdW50ID0gKHByb3BzOiB7IGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyIH0pOiBudW1iZXIgPT4ge1xyXG4gIGNvbnN0IHsgbG9hZE9yZGVyIH0gPSBwcm9wcztcclxuICBjb25zdCBsb2NrZWQgPSBsb2FkT3JkZXIuZmlsdGVyKGl0ZW0gPT4gaXNMb2NrZWQoaXRlbSkpO1xyXG4gIHJldHVybiBsb2NrZWQubGVuZ3RoO1xyXG59XHJcblxyXG5jb25zdCBlbXB0eSA9IHt9O1xyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSk6IElDb25uZWN0ZWRQcm9wcyB7XHJcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByb2ZpbGUsXHJcbiAgICBsb2FkT3JkZXI6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCBbXSksXHJcbiAgICBtb2RTdGF0ZTogdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwgZW1wdHkpLFxyXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSksXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgSXRlbVJlbmRlcmVyO1xyXG4iXX0=