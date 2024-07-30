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
                const unsorted = yield iniParser_1.default.getInstance(this.mApi, () => this.mPriorityManager).readStructure();
                const entries = Object.keys(unsorted).sort((a, b) => unsorted[a].Priority - unsorted[b].Priority).reduce((accum, iter, idx) => {
                    var _a, _b;
                    const entry = unsorted[iter];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJDQUFpRTtBQUVqRSxxQ0FBOEY7QUFDOUYsMEVBQWtEO0FBQ2xELDREQUF1QztBQUV2Qyw2Q0FBc0Q7QUFDdEQsaUNBQXNDO0FBQ3RDLHdFQUFnRDtBQU8vQyxDQUFDO0FBRUYsTUFBTSxZQUFZO0lBV2hCLFlBQVksS0FBaUI7UUFxQnJCLGtCQUFhLEdBQUcsRUFBRSxDQUFDLGtCQUFTLENBQUMsRUFBRSw2QkFBNkIsRUFBRSxDQUFDO1FBcEJyRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFPLENBQUM7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsOEJBQUMsdUJBQWEsSUFBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEdBQUksQ0FBQyxDQUFDO1FBQy9GLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyw4QkFBQyxzQkFBWSxJQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFJLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENB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VUFBVTtnQkFDaEIsRUFBRSxFQUFFLHdDQUErQjtnQkFDbkMsS0FBSyxFQUFFLHNCQUFzQjtnQkFDN0IsT0FBTyxFQUFFLHVCQUF1QjtnQkFDaEMsYUFBYSxFQUFFLEtBQUs7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUNILE1BQU0sbUJBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDO2lCQUNyRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxtQkFBWSxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuQixJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUseUNBQXlDO2dCQUNsRCxTQUFTLEVBQUUsSUFBSTthQUNoQixDQUFDLENBQUM7WUFDSCxPQUFPO1NBQ1I7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM5RCxPQUFPO1NBQ1I7Z0JBQVM7WUFDUixHQUFHLENBQUMsbUJBQW1CLENBQUMsd0NBQStCLENBQUMsQ0FBQztTQUMxRDtJQUNILENBQUM7Q0FBQTtBQWxFRCwwQ0FrRUM7QUFFRCxrQkFBZSxZQUFZLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsIEdBTUVfSUQsIExPQ0tFRF9QUkVGSVgsIFVOSV9QQVRDSCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IEluZm9Db21wb25lbnQgZnJvbSAnLi92aWV3cy9JbmZvQ29tcG9uZW50JztcclxuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcbmltcG9ydCB7IGZvcmNlUmVmcmVzaCB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCBJdGVtUmVuZGVyZXIgZnJvbSAnLi92aWV3cy9JdGVtUmVuZGVyZXInO1xyXG5pbXBvcnQgeyBJSXRlbVJlbmRlcmVyUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIGdldFByaW9yaXR5TWFuYWdlcjogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyO1xyXG4gIG9uVG9nZ2xlTW9kc1N0YXRlOiAoZW5hYmxlOiBib29sZWFuKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuY2xhc3MgVFczTG9hZE9yZGVyIGltcGxlbWVudHMgdHlwZXMuSUxvYWRPcmRlckdhbWVJbmZvIHtcclxuICBwdWJsaWMgZ2FtZUlkOiBzdHJpbmc7XHJcbiAgcHVibGljIHRvZ2dsZWFibGVFbnRyaWVzPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgY2xlYXJTdGF0ZU9uUHVyZ2U/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyB1c2FnZUluc3RydWN0aW9ucz86IFJlYWN0LkNvbXBvbmVudFR5cGU8e30+O1xyXG4gIHB1YmxpYyBub0NvbGxlY3Rpb25HZW5lcmF0aW9uPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgY3VzdG9tSXRlbVJlbmRlcmVyPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7IGNsYXNzTmFtZT86IHN0cmluZywgaXRlbTogSUl0ZW1SZW5kZXJlclByb3BzLCBmb3J3YXJkZWRSZWY/OiAocmVmOiBhbnkpID0+IHZvaWQgfT47XHJcblxyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM6IElCYXNlUHJvcHMpIHtcclxuICAgIHRoaXMuZ2FtZUlkID0gR0FNRV9JRDtcclxuICAgIHRoaXMuY2xlYXJTdGF0ZU9uUHVyZ2UgPSB0cnVlO1xyXG4gICAgdGhpcy50b2dnbGVhYmxlRW50cmllcyA9IHRydWU7XHJcbiAgICB0aGlzLm5vQ29sbGVjdGlvbkdlbmVyYXRpb24gPSB0cnVlO1xyXG4gICAgdGhpcy51c2FnZUluc3RydWN0aW9ucyA9ICgpID0+ICg8SW5mb0NvbXBvbmVudCBvblRvZ2dsZU1vZHNTdGF0ZT17cHJvcHMub25Ub2dnbGVNb2RzU3RhdGV9IC8+KTtcclxuICAgIHRoaXMuY3VzdG9tSXRlbVJlbmRlcmVyID0gKHByb3BzKSA9PiB7XHJcbiAgICAgIHJldHVybiAoPEl0ZW1SZW5kZXJlciBjbGFzc05hbWU9e3Byb3BzLmNsYXNzTmFtZX0gaXRlbT17cHJvcHMuaXRlbX0gLz4pXHJcbiAgICB9O1xyXG4gICAgdGhpcy5tQXBpID0gcHJvcHMuYXBpO1xyXG4gICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyID0gcHJvcHMuZ2V0UHJpb3JpdHlNYW5hZ2VyKCk7XHJcbiAgICB0aGlzLmRlc2VyaWFsaXplTG9hZE9yZGVyID0gdGhpcy5kZXNlcmlhbGl6ZUxvYWRPcmRlci5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy5zZXJpYWxpemVMb2FkT3JkZXIgPSB0aGlzLnNlcmlhbGl6ZUxvYWRPcmRlci5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy52YWxpZGF0ZSA9IHRoaXMudmFsaWRhdGUuYmluZCh0aGlzKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBzZXJpYWxpemVMb2FkT3JkZXIobG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UodGhpcy5tQXBpLCAoKSA9PiB0aGlzLm1Qcmlvcml0eU1hbmFnZXIpXHJcbiAgICAgIC5zZXRJTklTdHJ1Y3QobG9hZE9yZGVyKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVhZGFibGVOYW1lcyA9IHsgW1VOSV9QQVRDSF06ICdVbmlmaWNhdGlvbi9Db21tdW5pdHkgUGF0Y2gnIH07XHJcbiAgcHVibGljIGFzeW5jIGRlc2VyaWFsaXplTG9hZE9yZGVyKCk6IFByb21pc2U8dHlwZXMuTG9hZE9yZGVyPiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZmluZE5hbWUgPSAodmFsOiBzdHJpbmcpID0+IHRoaXMucmVhZGFibGVOYW1lcz8uW3ZhbF0gfHwgdmFsO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdW5zb3J0ZWQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UodGhpcy5tQXBpLCAoKSA9PiB0aGlzLm1Qcmlvcml0eU1hbmFnZXIpLnJlYWRTdHJ1Y3R1cmUoKTtcclxuICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5rZXlzKHVuc29ydGVkKS5zb3J0KChhLCBiKSA9PiB1bnNvcnRlZFthXS5Qcmlvcml0eSAtIHVuc29ydGVkW2JdLlByaW9yaXR5KS5yZWR1Y2UoKGFjY3VtLCBpdGVyLCBpZHgpID0+IHtcclxuICAgICAgICBjb25zdCBlbnRyeSA9IHVuc29ydGVkW2l0ZXJdO1xyXG4gICAgICAgIGFjY3VtW2l0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/ICdsb2NrZWQnIDogJ3JlZ3VsYXInXS5wdXNoKHtcclxuICAgICAgICAgIGlkOiBpdGVyLFxyXG4gICAgICAgICAgbmFtZTogZmluZE5hbWUoaXRlciksXHJcbiAgICAgICAgICBlbmFibGVkOiBlbnRyeS5FbmFibGVkID09PSAnMScsXHJcbiAgICAgICAgICBtb2RJZDogZW50cnk/LlZLID8/IGl0ZXIsXHJcbiAgICAgICAgICBsb2NrZWQ6IGl0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSxcclxuICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgcHJlZml4OiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkgPyBhY2N1bS5sb2NrZWQubGVuZ3RoIDogZW50cnk/LlByaW9yaXR5ID8/IGlkeCArIDEsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIHsgbG9ja2VkOiBbXSwgcmVndWxhcjogW10gfSk7XHJcbiAgICAgIGNvbnN0IGZpbmFsRW50cmllcyA9IFtdLmNvbmNhdChlbnRyaWVzLmxvY2tlZCwgZW50cmllcy5yZWd1bGFyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaW5hbEVudHJpZXMpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyB2YWxpZGF0ZShwcmV2OiB0eXBlcy5Mb2FkT3JkZXIsIGN1cnJlbnQ6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dHlwZXMuSVZhbGlkYXRpb25SZXN1bHQ+IHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb2xsZWN0aW9uSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIC8vIGltcG9ydCBsb2FkIG9yZGVyIGZyb20gY29sbGVjdGlvbi5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBpZDogQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUixcclxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxyXG4gICAgbWVzc2FnZTogJ1BhcnNpbmcgY29sbGVjdGlvbiBkYXRhJyxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgY29sbGVjdGlvbk1vZCA9IG1vZHNbY29sbGVjdGlvbklkXTtcclxuICBpZiAoY29sbGVjdGlvbk1vZD8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKTtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ2NvbGxlY3Rpb24gbW9kIGlzIG1pc3NpbmcnLCBjb2xsZWN0aW9uSWQpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIHRyeSB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxyXG4gICAgICB0aXRsZTogJ0ltcG9ydGluZyBMb2FkIE9yZGVyJyxcclxuICAgICAgbWVzc2FnZTogJ0Vuc3VyaW5nIG1vZHMgYXJlIGRlcGxveWVkLi4uJyxcclxuICAgICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIH0pO1xyXG4gICAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIGNiKSk7XHJcbiAgICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIGNvbGxlY3Rpb25Nb2QuaW5zdGFsbGF0aW9uUGF0aCwgJ2NvbGxlY3Rpb24uanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBjb2xsZWN0aW9uPy5sb2FkT3JkZXIgfHwge307XHJcbiAgICBpZiAoT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgICBtZXNzYWdlOiAnQ29sbGVjdGlvbiBkb2VzIG5vdCBpbmNsdWRlIGxvYWQgb3JkZXIgdG8gaW1wb3J0JyxcclxuICAgICAgICBkaXNwbGF5TVM6IDMwMDAsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29udmVydGVkID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGksIGxvYWRPcmRlcik7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxyXG4gICAgICB0aXRsZTogJ0ltcG9ydGluZyBMb2FkIE9yZGVyJyxcclxuICAgICAgbWVzc2FnZTogJ1dyaXRpbmcgTG9hZCBPcmRlci4uLicsXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gICAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICB9KTtcclxuICAgIGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLnNldElOSVN0cnVjdChjb252ZXJ0ZWQpXHJcbiAgICAgIC50aGVuKCgpID0+IGZvcmNlUmVmcmVzaChhcGkpKTtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgICBtZXNzYWdlOiAnQ29sbGVjdGlvbiBsb2FkIG9yZGVyIGhhcyBiZWVuIGltcG9ydGVkJyxcclxuICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IGxvYWQgb3JkZXInLCBlcnIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFRXM0xvYWRPcmRlcjsiXX0=