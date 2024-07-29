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
exports.importLoadOrder = void 0;
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
            const findName = (val) => { var _a; return ((_a = this.readableNames) === null || _a === void 0 ? void 0 : _a[val]) || val; };
            try {
                const ini = yield iniParser_1.default.getInstance(this.mApi, () => this.mPriorityManager).readStructure();
                const entries = Object.keys(ini.data).sort((a, b) => ini.data[a].Priority - ini.data[b].Priority).reduce((accum, iter, idx) => {
                    var _a, _b;
                    if (iter.startsWith('dlc')) {
                        return accum;
                    }
                    const entry = ini.data[iter];
                    accum[iter.startsWith(common_1.LOCKED_PREFIX) ? 'locked' : 'regular'].push({
                        id: iter,
                        name: findName(iter),
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
exports.importLoadOrder = importLoadOrder;
exports.default = TW3LoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJDQUFpRTtBQUVqRSxxQ0FBOEY7QUFDOUYsMEVBQWtEO0FBQ2xELDREQUF1QztBQUV2Qyw2Q0FBc0Q7QUFDdEQsaUNBQXNDO0FBQ3RDLHdFQUFnRDtBQU8vQyxDQUFDO0FBRUYsTUFBTSxZQUFZO0lBV2hCLFlBQVksS0FBaUI7UUFxQnJCLGtCQUFhLEdBQUcsRUFBRSxDQUFDLGtCQUFTLENBQUMsRUFBRSw2QkFBNkIsRUFBRSxDQUFDO1FBcEJyRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFPLENBQUM7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsOEJBQUMsdUJBQWEsSUFBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEdBQUksQ0FBQyxDQUFDO1FBQy9GLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyw4QkFBQyxzQkFBWSxJQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFJLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENB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O2FBQ1I7WUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLG1DQUFzQixFQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RCxHQUFHLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ25CLElBQUksRUFBRSxVQUFVO2dCQUNoQixFQUFFLEVBQUUsd0NBQStCO2dCQUNuQyxLQUFLLEVBQUUsc0JBQXNCO2dCQUM3QixPQUFPLEVBQUUsdUJBQXVCO2dCQUNoQyxhQUFhLEVBQUUsS0FBSztnQkFDcEIsU0FBUyxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxtQkFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUM7aUJBQ3JELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLG1CQUFZLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ25CLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSx5Q0FBeUM7Z0JBQ2xELFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUNILE9BQU87U0FDUjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE9BQU87U0FDUjtnQkFBUztZQUNSLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyx3Q0FBK0IsQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQztDQUFBO0FBbEVELDBDQWtFQztBQUVELGtCQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUiwgR0FNRV9JRCwgTE9DS0VEX1BSRUZJWCwgVU5JX1BBVENIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgSW5mb0NvbXBvbmVudCBmcm9tICcuL3ZpZXdzL0luZm9Db21wb25lbnQnO1xyXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuaW1wb3J0IHsgZm9yY2VSZWZyZXNoIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IEl0ZW1SZW5kZXJlciBmcm9tICcuL3ZpZXdzL0l0ZW1SZW5kZXJlcic7XHJcbmltcG9ydCB7IElJdGVtUmVuZGVyZXJQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgZ2V0UHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBQcmlvcml0eU1hbmFnZXI7XHJcbiAgb25Ub2dnbGVNb2RzU3RhdGU6IChlbmFibGU6IGJvb2xlYW4pID0+IHZvaWQ7XHJcbn07XHJcblxyXG5jbGFzcyBUVzNMb2FkT3JkZXIgaW1wbGVtZW50cyB0eXBlcy5JTG9hZE9yZGVyR2FtZUluZm8ge1xyXG4gIHB1YmxpYyBnYW1lSWQ6IHN0cmluZztcclxuICBwdWJsaWMgdG9nZ2xlYWJsZUVudHJpZXM/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyBjbGVhclN0YXRlT25QdXJnZT86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHVzYWdlSW5zdHJ1Y3Rpb25zPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7fT47XHJcbiAgcHVibGljIG5vQ29sbGVjdGlvbkdlbmVyYXRpb24/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyBjdXN0b21JdGVtUmVuZGVyZXI/OiBSZWFjdC5Db21wb25lbnRUeXBlPHsgY2xhc3NOYW1lPzogc3RyaW5nLCBpdGVtOiBJSXRlbVJlbmRlcmVyUHJvcHMsIGZvcndhcmRlZFJlZj86IChyZWY6IGFueSkgPT4gdm9pZCB9PjtcclxuXHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbVByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wczogSUJhc2VQcm9wcykge1xyXG4gICAgdGhpcy5nYW1lSWQgPSBHQU1FX0lEO1xyXG4gICAgdGhpcy5jbGVhclN0YXRlT25QdXJnZSA9IHRydWU7XHJcbiAgICB0aGlzLnRvZ2dsZWFibGVFbnRyaWVzID0gdHJ1ZTtcclxuICAgIHRoaXMubm9Db2xsZWN0aW9uR2VuZXJhdGlvbiA9IHRydWU7XHJcbiAgICB0aGlzLnVzYWdlSW5zdHJ1Y3Rpb25zID0gKCkgPT4gKDxJbmZvQ29tcG9uZW50IG9uVG9nZ2xlTW9kc1N0YXRlPXtwcm9wcy5vblRvZ2dsZU1vZHNTdGF0ZX0gLz4pO1xyXG4gICAgdGhpcy5jdXN0b21JdGVtUmVuZGVyZXIgPSAocHJvcHMpID0+IHtcclxuICAgICAgcmV0dXJuICg8SXRlbVJlbmRlcmVyIGNsYXNzTmFtZT17cHJvcHMuY2xhc3NOYW1lfSBpdGVtPXtwcm9wcy5pdGVtfSAvPilcclxuICAgIH07XHJcbiAgICB0aGlzLm1BcGkgPSBwcm9wcy5hcGk7XHJcbiAgICB0aGlzLm1Qcmlvcml0eU1hbmFnZXIgPSBwcm9wcy5nZXRQcmlvcml0eU1hbmFnZXIoKTtcclxuICAgIHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIgPSB0aGlzLmRlc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnZhbGlkYXRlID0gdGhpcy52YWxpZGF0ZS5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNlcmlhbGl6ZUxvYWRPcmRlcihsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksICgpID0+IHRoaXMubVByaW9yaXR5TWFuYWdlcilcclxuICAgICAgLnNldElOSVN0cnVjdChsb2FkT3JkZXIpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZWFkYWJsZU5hbWVzID0geyBbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCcgfTtcclxuICBwdWJsaWMgYXN5bmMgZGVzZXJpYWxpemVMb2FkT3JkZXIoKTogUHJvbWlzZTx0eXBlcy5Mb2FkT3JkZXI+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBmaW5kTmFtZSA9ICh2YWw6IHN0cmluZykgPT4gdGhpcy5yZWFkYWJsZU5hbWVzPy5bdmFsXSB8fCB2YWw7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbmkgPSBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UodGhpcy5tQXBpLCAoKSA9PiB0aGlzLm1Qcmlvcml0eU1hbmFnZXIpLnJlYWRTdHJ1Y3R1cmUoKTtcclxuICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5rZXlzKGluaS5kYXRhKS5zb3J0KChhLCBiKSA9PiBpbmkuZGF0YVthXS5Qcmlvcml0eSAtIGluaS5kYXRhW2JdLlByaW9yaXR5KS5yZWR1Y2UoKGFjY3VtLCBpdGVyLCBpZHgpID0+IHtcclxuICAgICAgICBpZiAoaXRlci5zdGFydHNXaXRoKCdkbGMnKSkge1xyXG4gICAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBlbnRyeSA9IGluaS5kYXRhW2l0ZXJdO1xyXG4gICAgICAgIGFjY3VtW2l0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/ICdsb2NrZWQnIDogJ3JlZ3VsYXInXS5wdXNoKHtcclxuICAgICAgICAgIGlkOiBpdGVyLFxyXG4gICAgICAgICAgbmFtZTogZmluZE5hbWUoaXRlciksXHJcbiAgICAgICAgICBlbmFibGVkOiBlbnRyeS5FbmFibGVkID09PSAnMScsXHJcbiAgICAgICAgICBtb2RJZDogZW50cnk/LlZLID8/IGl0ZXIsXHJcbiAgICAgICAgICBsb2NrZWQ6IGl0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSxcclxuICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgcHJlZml4OiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkgPyBhY2N1bS5sb2NrZWQubGVuZ3RoIDogZW50cnk/LlByaW9yaXR5ID8/IGlkeCArIDEsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIHsgbG9ja2VkOiBbXSwgcmVndWxhcjogW10gfSk7XHJcbiAgICAgIGNvbnN0IGZpbmFsRW50cmllcyA9IFtdLmNvbmNhdChlbnRyaWVzLmxvY2tlZCwgZW50cmllcy5yZWd1bGFyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaW5hbEVudHJpZXMpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyB2YWxpZGF0ZShwcmV2OiB0eXBlcy5Mb2FkT3JkZXIsIGN1cnJlbnQ6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dHlwZXMuSVZhbGlkYXRpb25SZXN1bHQ+IHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb2xsZWN0aW9uSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIC8vIGltcG9ydCBsb2FkIG9yZGVyIGZyb20gY29sbGVjdGlvbi5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBpZDogQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUixcclxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxyXG4gICAgbWVzc2FnZTogJ1BhcnNpbmcgY29sbGVjdGlvbiBkYXRhJyxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgY29sbGVjdGlvbk1vZCA9IG1vZHNbY29sbGVjdGlvbklkXTtcclxuICBpZiAoY29sbGVjdGlvbk1vZD8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKTtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ2NvbGxlY3Rpb24gbW9kIGlzIG1pc3NpbmcnLCBjb2xsZWN0aW9uSWQpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIHRyeSB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxyXG4gICAgICB0aXRsZTogJ0ltcG9ydGluZyBMb2FkIE9yZGVyJyxcclxuICAgICAgbWVzc2FnZTogJ0Vuc3VyaW5nIG1vZHMgYXJlIGRlcGxveWVkLi4uJyxcclxuICAgICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIH0pO1xyXG4gICAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIGNiKSk7XHJcbiAgICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIGNvbGxlY3Rpb25Nb2QuaW5zdGFsbGF0aW9uUGF0aCwgJ2NvbGxlY3Rpb24uanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBjb2xsZWN0aW9uPy5sb2FkT3JkZXIgfHwge307XHJcbiAgICBpZiAoT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgICBtZXNzYWdlOiAnQ29sbGVjdGlvbiBkb2VzIG5vdCBpbmNsdWRlIGxvYWQgb3JkZXIgdG8gaW1wb3J0JyxcclxuICAgICAgICBkaXNwbGF5TVM6IDMwMDAsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29udmVydGVkID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGksIGxvYWRPcmRlcik7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxyXG4gICAgICB0aXRsZTogJ0ltcG9ydGluZyBMb2FkIE9yZGVyJyxcclxuICAgICAgbWVzc2FnZTogJ1dyaXRpbmcgTG9hZCBPcmRlci4uLicsXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gICAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICB9KTtcclxuICAgIGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLnNldElOSVN0cnVjdChjb252ZXJ0ZWQpXHJcbiAgICAgIC50aGVuKCgpID0+IGZvcmNlUmVmcmVzaChhcGkpKTtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgICBtZXNzYWdlOiAnQ29sbGVjdGlvbiBsb2FkIG9yZGVyIGhhcyBiZWVuIGltcG9ydGVkJyxcclxuICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IGxvYWQgb3JkZXInLCBlcnIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFRXM0xvYWRPcmRlcjsiXX0=