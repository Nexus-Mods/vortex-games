"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importLoadOrder = importLoadOrder;
const react_1 = __importDefault(require("react"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const InfoComponent_1 = __importDefault(require("./views/InfoComponent"));
const iniParser_1 = __importDefault(require("./iniParser"));
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const ItemRenderer_1 = __importDefault(require("./views/ItemRenderer"));
;
class TW3LoadOrder {
    constructor(props) {
        this.readableNames = { [common_1.UNI_PATCH]: 'Unification/Community Patch' };
        this.gameId = common_1.GAME_ID;
        this.clearStateOnPurge = true;
        this.toggleableEntries = true;
        this.noCollectionGeneration = true;
        this.usageInstructions = () => (react_1.default.createElement(InfoComponent_1.default, { onToggleModsState: props.onToggleModsState }));
        this.customItemRenderer = (props) => {
            return (react_1.default.createElement(ItemRenderer_1.default, { className: props.className, item: props.item }));
        };
        this.mApi = props.api;
        this.mPriorityManager = props.getPriorityManager();
        this.deserializeLoadOrder = this.deserializeLoadOrder.bind(this);
        this.serializeLoadOrder = this.serializeLoadOrder.bind(this);
        this.validate = this.validate.bind(this);
    }
    serializeLoadOrder(loadOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            return iniParser_1.default.getInstance(this.mApi, () => this.mPriorityManager)
                .setINIStruct(loadOrder);
        });
    }
    deserializeLoadOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
                return Promise.resolve([]);
            }
            const findName = (entry) => {
                var _a;
                if (((_a = this.readableNames) === null || _a === void 0 ? void 0 : _a[entry.name]) !== undefined) {
                    return this.readableNames[entry.name];
                }
                if (entry.VK === undefined) {
                    return entry.name;
                }
                const state = this.mApi.getState();
                const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
                const mod = mods[entry.VK];
                if (mod === undefined) {
                    return entry.name;
                }
                return `${vortex_api_1.util.renderModName(mod)} (${entry.name})`;
            };
            try {
                const unsorted = yield iniParser_1.default.getInstance(this.mApi, () => this.mPriorityManager).readStructure();
                const entries = Object.keys(unsorted).sort((a, b) => unsorted[a].Priority - unsorted[b].Priority).reduce((accum, iter, idx) => {
                    var _a, _b;
                    const entry = unsorted[iter];
                    accum[iter.startsWith(common_1.LOCKED_PREFIX) ? 'locked' : 'regular'].push({
                        id: iter,
                        name: findName({ name: iter, VK: entry.VK }),
                        enabled: entry.Enabled === '1',
                        modId: (_a = entry === null || entry === void 0 ? void 0 : entry.VK) !== null && _a !== void 0 ? _a : iter,
                        locked: iter.startsWith(common_1.LOCKED_PREFIX),
                        data: {
                            prefix: iter.startsWith(common_1.LOCKED_PREFIX) ? accum.locked.length : (_b = entry === null || entry === void 0 ? void 0 : entry.Priority) !== null && _b !== void 0 ? _b : idx + 1,
                        }
                    });
                    return accum;
                }, { locked: [], regular: [] });
                const finalEntries = [].concat(entries.locked, entries.regular);
                return Promise.resolve(finalEntries);
            }
            catch (err) {
                return;
            }
        });
    }
    validate(prev, current) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(undefined);
        });
    }
}
function importLoadOrder(api, collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        api.sendNotification({
            type: 'activity',
            id: common_1.ACTIVITY_ID_IMPORTING_LOADORDER,
            title: 'Importing Load Order',
            message: 'Parsing collection data',
            allowSuppress: false,
            noDismiss: true,
        });
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const collectionMod = mods[collectionId];
        if ((collectionMod === null || collectionMod === void 0 ? void 0 : collectionMod.installationPath) === undefined) {
            api.dismissNotification(common_1.ACTIVITY_ID_IMPORTING_LOADORDER);
            api.showErrorNotification('collection mod is missing', collectionId);
            return;
        }
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        try {
            api.sendNotification({
                type: 'activity',
                id: common_1.ACTIVITY_ID_IMPORTING_LOADORDER,
                title: 'Importing Load Order',
                message: 'Ensuring mods are deployed...',
                allowSuppress: false,
                noDismiss: true,
            });
            yield vortex_api_1.util.toPromise(cb => api.events.emit('deploy-mods', cb));
            const fileData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(stagingFolder, collectionMod.installationPath, 'collection.json'), { encoding: 'utf8' });
            const collection = JSON.parse(fileData);
            const loadOrder = (collection === null || collection === void 0 ? void 0 : collection.loadOrder) || {};
            if (Object.keys(loadOrder).length === 0) {
                api.sendNotification({
                    type: 'success',
                    message: 'Collection does not include load order to import',
                    displayMS: 3000,
                });
                return;
            }
            const converted = (0, migrations_1.getPersistentLoadOrder)(api, loadOrder);
            api.sendNotification({
                type: 'activity',
                id: common_1.ACTIVITY_ID_IMPORTING_LOADORDER,
                title: 'Importing Load Order',
                message: 'Writing Load Order...',
                allowSuppress: false,
                noDismiss: true,
            });
            yield iniParser_1.default.getInstance().setINIStruct(converted)
                .then(() => (0, util_1.forceRefresh)(api));
            api.sendNotification({
                type: 'success',
                message: 'Collection load order has been imported',
                displayMS: 3000,
            });
            return;
        }
        catch (err) {
            api.showErrorNotification('Failed to import load order', err);
            return;
        }
        finally {
            api.dismissNotification(common_1.ACTIVITY_ID_IMPORTING_LOADORDER);
        }
    });
}
exports.default = TW3LoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQTBHQSwwQ0FrRUM7QUEzS0Qsa0RBQTBCO0FBQzFCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUscUNBQThGO0FBQzlGLDBFQUFrRDtBQUNsRCw0REFBdUM7QUFFdkMsNkNBQXNEO0FBQ3RELGlDQUFzQztBQUN0Qyx3RUFBZ0Q7QUFPL0MsQ0FBQztBQUVGLE1BQU0sWUFBWTtJQVdoQixZQUFZLEtBQWlCO1FBcUJyQixrQkFBYSxHQUFHLEVBQUUsQ0FBQyxrQkFBUyxDQUFDLEVBQUUsNkJBQTZCLEVBQUUsQ0FBQztRQXBCckUsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBTyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLDhCQUFDLHVCQUFhLElBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixHQUFJLENBQUMsQ0FBQztRQUMvRixJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNsQyxPQUFPLENBQUMsOEJBQUMsc0JBQVksSUFBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksR0FBSSxDQUFDLENBQUE7UUFDekUsQ0FBQyxDQUFDO1FBQ0YsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNuRCxJQUFJLENBQUMsb0JBQW9C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RSxDQUFDLElBQUEsbUJBQVksRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLHlDQUF5QztnQkFDbEQsU0FBUyxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1lBQ0gsT0FBTztRQUNULENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE9BQU87UUFDVCxDQUFDO2dCQUFTLENBQUM7WUFDVCxHQUFHLENBQUMsbUJBQW1CLENBQUMsd0NBQStCLENBQUMsQ0FBQztRQUMzRCxDQUFDO0lBQ0gsQ0FBQztDQUFBO0FBRUQsa0JBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLCBHQU1FX0lELCBMT0NLRURfUFJFRklYLCBVTklfUEFUQ0ggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBJbmZvQ29tcG9uZW50IGZyb20gJy4vdmlld3MvSW5mb0NvbXBvbmVudCc7XHJcbmltcG9ydCBJbmlTdHJ1Y3R1cmUgZnJvbSAnLi9pbmlQYXJzZXInO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBmb3JjZVJlZnJlc2ggfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgSXRlbVJlbmRlcmVyIGZyb20gJy4vdmlld3MvSXRlbVJlbmRlcmVyJztcclxuaW1wb3J0IHsgSUl0ZW1SZW5kZXJlclByb3BzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBnZXRQcmlvcml0eU1hbmFnZXI6ICgpID0+IFByaW9yaXR5TWFuYWdlcjtcclxuICBvblRvZ2dsZU1vZHNTdGF0ZTogKGVuYWJsZTogYm9vbGVhbikgPT4gdm9pZDtcclxufTtcclxuXHJcbmNsYXNzIFRXM0xvYWRPcmRlciBpbXBsZW1lbnRzIHR5cGVzLklMb2FkT3JkZXJHYW1lSW5mbyB7XHJcbiAgcHVibGljIGdhbWVJZDogc3RyaW5nO1xyXG4gIHB1YmxpYyB0b2dnbGVhYmxlRW50cmllcz86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGNsZWFyU3RhdGVPblB1cmdlPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgdXNhZ2VJbnN0cnVjdGlvbnM/OiBSZWFjdC5Db21wb25lbnRUeXBlPHt9PjtcclxuICBwdWJsaWMgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbj86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGN1c3RvbUl0ZW1SZW5kZXJlcj86IFJlYWN0LkNvbXBvbmVudFR5cGU8eyBjbGFzc05hbWU/OiBzdHJpbmcsIGl0ZW06IElJdGVtUmVuZGVyZXJQcm9wcywgZm9yd2FyZGVkUmVmPzogKHJlZjogYW55KSA9PiB2b2lkIH0+O1xyXG5cclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtUHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJQmFzZVByb3BzKSB7XHJcbiAgICB0aGlzLmdhbWVJZCA9IEdBTUVfSUQ7XHJcbiAgICB0aGlzLmNsZWFyU3RhdGVPblB1cmdlID0gdHJ1ZTtcclxuICAgIHRoaXMudG9nZ2xlYWJsZUVudHJpZXMgPSB0cnVlO1xyXG4gICAgdGhpcy5ub0NvbGxlY3Rpb25HZW5lcmF0aW9uID0gdHJ1ZTtcclxuICAgIHRoaXMudXNhZ2VJbnN0cnVjdGlvbnMgPSAoKSA9PiAoPEluZm9Db21wb25lbnQgb25Ub2dnbGVNb2RzU3RhdGU9e3Byb3BzLm9uVG9nZ2xlTW9kc1N0YXRlfSAvPik7XHJcbiAgICB0aGlzLmN1c3RvbUl0ZW1SZW5kZXJlciA9IChwcm9wcykgPT4ge1xyXG4gICAgICByZXR1cm4gKDxJdGVtUmVuZGVyZXIgY2xhc3NOYW1lPXtwcm9wcy5jbGFzc05hbWV9IGl0ZW09e3Byb3BzLml0ZW19IC8+KVxyXG4gICAgfTtcclxuICAgIHRoaXMubUFwaSA9IHByb3BzLmFwaTtcclxuICAgIHRoaXMubVByaW9yaXR5TWFuYWdlciA9IHByb3BzLmdldFByaW9yaXR5TWFuYWdlcigpO1xyXG4gICAgdGhpcy5kZXNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyID0gdGhpcy5zZXJpYWxpemVMb2FkT3JkZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMudmFsaWRhdGUgPSB0aGlzLnZhbGlkYXRlLmJpbmQodGhpcyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2VyaWFsaXplTG9hZE9yZGVyKGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKHRoaXMubUFwaSwgKCkgPT4gdGhpcy5tUHJpb3JpdHlNYW5hZ2VyKVxyXG4gICAgICAuc2V0SU5JU3RydWN0KGxvYWRPcmRlcik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlYWRhYmxlTmFtZXMgPSB7IFtVTklfUEFUQ0hdOiAnVW5pZmljYXRpb24vQ29tbXVuaXR5IFBhdGNoJyB9O1xyXG4gIHB1YmxpYyBhc3luYyBkZXNlcmlhbGl6ZUxvYWRPcmRlcigpOiBQcm9taXNlPHR5cGVzLkxvYWRPcmRlcj4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGZpbmROYW1lID0gKGVudHJ5OiB7IG5hbWU6IHN0cmluZywgVks/OiBzdHJpbmcgfSkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5yZWFkYWJsZU5hbWVzPy5bZW50cnkubmFtZV0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRhYmxlTmFtZXNbZW50cnkubmFtZV07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChlbnRyeS5WSyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGVudHJ5Lm5hbWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgICAgY29uc3QgbW9kOiB0eXBlcy5JTW9kID0gbW9kc1tlbnRyeS5WS107XHJcbiAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBlbnRyeS5uYW1lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYCR7dXRpbC5yZW5kZXJNb2ROYW1lKG1vZCl9ICgke2VudHJ5Lm5hbWV9KWA7XHJcbiAgICB9O1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHVuc29ydGVkOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0gYXdhaXQgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKHRoaXMubUFwaSwgKCkgPT4gdGhpcy5tUHJpb3JpdHlNYW5hZ2VyKS5yZWFkU3RydWN0dXJlKCk7XHJcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3Qua2V5cyh1bnNvcnRlZCkuc29ydCgoYSwgYikgPT4gdW5zb3J0ZWRbYV0uUHJpb3JpdHkgLSB1bnNvcnRlZFtiXS5Qcmlvcml0eSkucmVkdWNlKChhY2N1bSwgaXRlciwgaWR4KSA9PiB7XHJcbiAgICAgICAgY29uc3QgZW50cnkgPSB1bnNvcnRlZFtpdGVyXTtcclxuICAgICAgICBhY2N1bVtpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkgPyAnbG9ja2VkJyA6ICdyZWd1bGFyJ10ucHVzaCh7XHJcbiAgICAgICAgICBpZDogaXRlcixcclxuICAgICAgICAgIG5hbWU6IGZpbmROYW1lKHsgbmFtZTogaXRlciwgVks6IGVudHJ5LlZLIH0pLFxyXG4gICAgICAgICAgZW5hYmxlZDogZW50cnkuRW5hYmxlZCA9PT0gJzEnLFxyXG4gICAgICAgICAgbW9kSWQ6IGVudHJ5Py5WSyA/PyBpdGVyLFxyXG4gICAgICAgICAgbG9ja2VkOiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCksXHJcbiAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgIHByZWZpeDogaXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpID8gYWNjdW0ubG9ja2VkLmxlbmd0aCA6IGVudHJ5Py5Qcmlvcml0eSA/PyBpZHggKyAxLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCB7IGxvY2tlZDogW10sIHJlZ3VsYXI6IFtdIH0pO1xyXG4gICAgICBjb25zdCBmaW5hbEVudHJpZXMgPSBbXS5jb25jYXQoZW50cmllcy5sb2NrZWQsIGVudHJpZXMucmVndWxhcik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmluYWxFbnRyaWVzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgdmFsaWRhdGUocHJldjogdHlwZXMuTG9hZE9yZGVyLCBjdXJyZW50OiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPHR5cGVzLklWYWxpZGF0aW9uUmVzdWx0PiB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29sbGVjdGlvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAvLyBpbXBvcnQgbG9hZCBvcmRlciBmcm9tIGNvbGxlY3Rpb24uXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXHJcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBMb2FkIE9yZGVyJyxcclxuICAgIG1lc3NhZ2U6ICdQYXJzaW5nIGNvbGxlY3Rpb24gZGF0YScsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGNvbGxlY3Rpb25Nb2QgPSBtb2RzW2NvbGxlY3Rpb25JZF07XHJcbiAgaWYgKGNvbGxlY3Rpb25Nb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUik7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdjb2xsZWN0aW9uIG1vZCBpcyBtaXNzaW5nJywgY29sbGVjdGlvbklkKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICB0cnkge1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgICBpZDogQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUixcclxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFbnN1cmluZyBtb2RzIGFyZSBkZXBsb3llZC4uLicsXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gICAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICB9KTtcclxuICAgIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCBjYikpO1xyXG4gICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBjb2xsZWN0aW9uTW9kLmluc3RhbGxhdGlvblBhdGgsICdjb2xsZWN0aW9uLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgY29sbGVjdGlvbiA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gY29sbGVjdGlvbj8ubG9hZE9yZGVyIHx8IHt9O1xyXG4gICAgaWYgKE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICAgICAgbWVzc2FnZTogJ0NvbGxlY3Rpb24gZG9lcyBub3QgaW5jbHVkZSBsb2FkIG9yZGVyIHRvIGltcG9ydCcsXHJcbiAgICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnZlcnRlZCA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpLCBsb2FkT3JkZXIpO1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgICBpZDogQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUixcclxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdXcml0aW5nIExvYWQgT3JkZXIuLi4nLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS5zZXRJTklTdHJ1Y3QoY29udmVydGVkKVxyXG4gICAgICAudGhlbigoKSA9PiBmb3JjZVJlZnJlc2goYXBpKSk7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbG9hZCBvcmRlciBoYXMgYmVlbiBpbXBvcnRlZCcsXHJcbiAgICAgIGRpc3BsYXlNUzogMzAwMCxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBsb2FkIG9yZGVyJywgZXJyKTtcclxuICAgIHJldHVybjtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBUVzNMb2FkT3JkZXI7Il19