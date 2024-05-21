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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJDQUFpRTtBQUVqRSxxQ0FBOEY7QUFDOUYsMEVBQWtEO0FBQ2xELDREQUF1QztBQUV2Qyw2Q0FBc0Q7QUFDdEQsaUNBQXNDO0FBQ3RDLHdFQUFnRDtBQU8vQyxDQUFDO0FBRUYsTUFBTSxZQUFZO0lBV2hCLFlBQVksS0FBaUI7UUFxQnJCLGtCQUFhLEdBQUcsRUFBQyxDQUFDLGtCQUFTLENBQUMsRUFBRSw2QkFBNkIsRUFBQyxDQUFDO1FBcEJuRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFPLENBQUM7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsOEJBQUMsdUJBQWEsSUFBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBQzlGLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyw4QkFBQyxzQkFBWSxJQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFJLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENB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R0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuQixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsRUFBRSxFQUFFLHdDQUErQjtnQkFDbkMsS0FBSyxFQUFFLHNCQUFzQjtnQkFDN0IsT0FBTyxFQUFFLHVCQUF1QjtnQkFDaEMsYUFBYSxFQUFFLEtBQUs7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUNILE1BQU0sbUJBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDO2lCQUNyRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxtQkFBWSxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuQixJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUseUNBQXlDO2dCQUNsRCxTQUFTLEVBQUUsSUFBSTthQUNoQixDQUFDLENBQUM7WUFDSCxPQUFPO1NBQ1I7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM5RCxPQUFPO1NBQ1I7Z0JBQVM7WUFDUixHQUFHLENBQUMsbUJBQW1CLENBQUMsd0NBQStCLENBQUMsQ0FBQztTQUMxRDtJQUNILENBQUM7Q0FBQTtBQWxFRCwwQ0FrRUM7QUFFRCxrQkFBZSxZQUFZLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsIEdBTUVfSUQsIExPQ0tFRF9QUkVGSVgsIFVOSV9QQVRDSCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IEluZm9Db21wb25lbnQgZnJvbSAnLi92aWV3cy9JbmZvQ29tcG9uZW50JztcclxuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcbmltcG9ydCB7IGZvcmNlUmVmcmVzaCB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCBJdGVtUmVuZGVyZXIgZnJvbSAnLi92aWV3cy9JdGVtUmVuZGVyZXInO1xyXG5pbXBvcnQgeyBJSXRlbVJlbmRlcmVyUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUJhc2VQcm9wcyB7XHJcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIGdldFByaW9yaXR5TWFuYWdlcjogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyO1xyXG4gIG9uVG9nZ2xlTW9kc1N0YXRlOiAoZW5hYmxlOiBib29sZWFuKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuY2xhc3MgVFczTG9hZE9yZGVyIGltcGxlbWVudHMgdHlwZXMuSUxvYWRPcmRlckdhbWVJbmZvIHtcclxuICBwdWJsaWMgZ2FtZUlkOiBzdHJpbmc7XHJcbiAgcHVibGljIHRvZ2dsZWFibGVFbnRyaWVzPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgY2xlYXJTdGF0ZU9uUHVyZ2U/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyB1c2FnZUluc3RydWN0aW9ucz86IFJlYWN0LkNvbXBvbmVudFR5cGU8e30+O1xyXG4gIHB1YmxpYyBub0NvbGxlY3Rpb25HZW5lcmF0aW9uPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgY3VzdG9tSXRlbVJlbmRlcmVyPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7IGNsYXNzTmFtZT86IHN0cmluZywgaXRlbTogSUl0ZW1SZW5kZXJlclByb3BzLCBmb3J3YXJkZWRSZWY/OiAocmVmOiBhbnkpID0+IHZvaWQgfT47XHJcblxyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM6IElCYXNlUHJvcHMpIHtcclxuICAgIHRoaXMuZ2FtZUlkID0gR0FNRV9JRDtcclxuICAgIHRoaXMuY2xlYXJTdGF0ZU9uUHVyZ2UgPSB0cnVlO1xyXG4gICAgdGhpcy50b2dnbGVhYmxlRW50cmllcyA9IHRydWU7XHJcbiAgICB0aGlzLm5vQ29sbGVjdGlvbkdlbmVyYXRpb24gPSB0cnVlO1xyXG4gICAgdGhpcy51c2FnZUluc3RydWN0aW9ucyA9ICgpID0+ICg8SW5mb0NvbXBvbmVudCBvblRvZ2dsZU1vZHNTdGF0ZT17cHJvcHMub25Ub2dnbGVNb2RzU3RhdGV9Lz4pO1xyXG4gICAgdGhpcy5jdXN0b21JdGVtUmVuZGVyZXIgPSAocHJvcHMpID0+IHtcclxuICAgICAgcmV0dXJuICg8SXRlbVJlbmRlcmVyIGNsYXNzTmFtZT17cHJvcHMuY2xhc3NOYW1lfSBpdGVtPXtwcm9wcy5pdGVtfSAvPilcclxuICAgIH07XHJcbiAgICB0aGlzLm1BcGkgPSBwcm9wcy5hcGk7XHJcbiAgICB0aGlzLm1Qcmlvcml0eU1hbmFnZXIgPSBwcm9wcy5nZXRQcmlvcml0eU1hbmFnZXIoKTtcclxuICAgIHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIgPSB0aGlzLmRlc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnZhbGlkYXRlID0gdGhpcy52YWxpZGF0ZS5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNlcmlhbGl6ZUxvYWRPcmRlcihsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksICgpID0+IHRoaXMubVByaW9yaXR5TWFuYWdlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAuc2V0SU5JU3RydWN0KGxvYWRPcmRlcik7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlYWRhYmxlTmFtZXMgPSB7W1VOSV9QQVRDSF06ICdVbmlmaWNhdGlvbi9Db21tdW5pdHkgUGF0Y2gnfTtcclxuICBwdWJsaWMgYXN5bmMgZGVzZXJpYWxpemVMb2FkT3JkZXIoKTogUHJvbWlzZTx0eXBlcy5Mb2FkT3JkZXI+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBmaW5kTmFtZSA9ICh2YWw6IHN0cmluZykgPT4gdGhpcy5yZWFkYWJsZU5hbWVzPy5bdmFsXSB8fCB2YWw7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBpbmkgPSBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UodGhpcy5tQXBpLCAoKSA9PiB0aGlzLm1Qcmlvcml0eU1hbmFnZXIpLnJlYWRTdHJ1Y3R1cmUoKTtcclxuICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5rZXlzKGluaS5kYXRhKS5zb3J0KChhLCBiKSA9PiBpbmkuZGF0YVthXS5Qcmlvcml0eSAtIGluaS5kYXRhW2JdLlByaW9yaXR5KS5yZWR1Y2UoKGFjY3VtLCBpdGVyLCBpZHgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IGVudHJ5ID0gaW5pLmRhdGFbaXRlcl07XHJcbiAgICAgICAgICBhY2N1bVtpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkgPyAnbG9ja2VkJyA6ICdyZWd1bGFyJ10ucHVzaCh7XHJcbiAgICAgICAgICAgIGlkOiBpdGVyLFxyXG4gICAgICAgICAgICBuYW1lOiBmaW5kTmFtZShpdGVyKSxcclxuICAgICAgICAgICAgZW5hYmxlZDogZW50cnkuRW5hYmxlZCA9PT0gJzEnLFxyXG4gICAgICAgICAgICBtb2RJZDogZW50cnk/LlZLID8/IGl0ZXIsXHJcbiAgICAgICAgICAgIGxvY2tlZDogaXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgcHJlZml4OiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkgPyBhY2N1bS5sb2NrZWQubGVuZ3RoIDogZW50cnk/LlByaW9yaXR5ID8/IGlkeCArIDEsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgICAgfSwgeyBsb2NrZWQ6IFtdLCByZWd1bGFyOiBbXSB9KTtcclxuICAgICAgY29uc3QgZmluYWxFbnRyaWVzID0gW10uY29uY2F0KGVudHJpZXMubG9ja2VkLCBlbnRyaWVzLnJlZ3VsYXIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbmFsRW50cmllcyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHZhbGlkYXRlKHByZXY6IHR5cGVzLkxvYWRPcmRlciwgY3VycmVudDogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTx0eXBlcy5JVmFsaWRhdGlvblJlc3VsdD4ge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNvbGxlY3Rpb25JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgLy8gaW1wb3J0IGxvYWQgb3JkZXIgZnJvbSBjb2xsZWN0aW9uLlxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxyXG4gICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXHJcbiAgICBtZXNzYWdlOiAnUGFyc2luZyBjb2xsZWN0aW9uIGRhdGEnLFxyXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBjb2xsZWN0aW9uTW9kID0gbW9kc1tjb2xsZWN0aW9uSWRdO1xyXG4gIGlmIChjb2xsZWN0aW9uTW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignY29sbGVjdGlvbiBtb2QgaXMgbWlzc2luZycsIGNvbGxlY3Rpb25JZCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgdHJ5IHtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXHJcbiAgICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxyXG4gICAgICBtZXNzYWdlOiAnRW5zdXJpbmcgbW9kcyBhcmUgZGVwbG95ZWQuLi4nLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBhd2FpdCB1dGlsLnRvUHJvbWlzZShjYiA9PiBhcGkuZXZlbnRzLmVtaXQoJ2RlcGxveS1tb2RzJywgY2IpKTtcclxuICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgY29sbGVjdGlvbk1vZC5pbnN0YWxsYXRpb25QYXRoLCAnY29sbGVjdGlvbi5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGNvbGxlY3Rpb24/LmxvYWRPcmRlciB8fCB7fTtcclxuICAgIGlmIChPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIGRvZXMgbm90IGluY2x1ZGUgbG9hZCBvcmRlciB0byBpbXBvcnQnLFxyXG4gICAgICAgIGRpc3BsYXlNUzogMzAwMCxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb252ZXJ0ZWQgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSwgbG9hZE9yZGVyKTtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXHJcbiAgICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxyXG4gICAgICBtZXNzYWdlOiAnV3JpdGluZyBMb2FkIE9yZGVyLi4uJyxcclxuICAgICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIH0pO1xyXG4gICAgYXdhaXQgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkuc2V0SU5JU3RydWN0KGNvbnZlcnRlZClcclxuICAgICAgLnRoZW4oKCkgPT4gZm9yY2VSZWZyZXNoKGFwaSkpO1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICAgIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIGxvYWQgb3JkZXIgaGFzIGJlZW4gaW1wb3J0ZWQnLFxyXG4gICAgICBkaXNwbGF5TVM6IDMwMDAsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbXBvcnQgbG9hZCBvcmRlcicsIGVycik7XHJcbiAgICByZXR1cm47XHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVFczTG9hZE9yZGVyOyJdfQ==