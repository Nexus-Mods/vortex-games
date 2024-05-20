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
;
class TW3LoadOrder {
    constructor(props) {
        this.readableNames = { [common_1.UNI_PATCH]: 'Unification/Community Patch' };
        this.gameId = common_1.GAME_ID;
        this.clearStateOnPurge = true;
        this.toggleableEntries = true;
        this.noCollectionGeneration = true;
        this.usageInstructions = () => (react_1.default.createElement(InfoComponent_1.default, { onToggleModsState: props.onToggleModsState }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJDQUFpRTtBQUVqRSxxQ0FBOEY7QUFDOUYsMEVBQWtEO0FBQ2xELDREQUF1QztBQUV2Qyw2Q0FBc0Q7QUFDdEQsaUNBQXNDO0FBTXJDLENBQUM7QUFFRixNQUFNLFlBQVk7SUFVaEIsWUFBWSxLQUFpQjtRQWtCckIsa0JBQWEsR0FBRyxFQUFDLENBQUMsa0JBQVMsQ0FBQyxFQUFFLDZCQUE2QixFQUFDLENBQUM7UUFqQm5FLElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQU8sQ0FBQztRQUN0QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFDOUIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztRQUNuQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyw4QkFBQyx1QkFBYSxJQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7UUFDOUYsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNuRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FB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SCxNQUFNLG1CQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQztpQkFDckQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsbUJBQVksRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLHlDQUF5QztnQkFDbEQsU0FBUyxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1lBQ0gsT0FBTztTQUNSO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMscUJBQXFCLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDOUQsT0FBTztTQUNSO2dCQUFTO1lBQ1IsR0FBRyxDQUFDLG1CQUFtQixDQUFDLHdDQUErQixDQUFDLENBQUM7U0FDMUQ7SUFDSCxDQUFDO0NBQUE7QUFsRUQsMENBa0VDO0FBRUQsa0JBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLCBHQU1FX0lELCBMT0NLRURfUFJFRklYLCBVTklfUEFUQ0ggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBJbmZvQ29tcG9uZW50IGZyb20gJy4vdmlld3MvSW5mb0NvbXBvbmVudCc7XHJcbmltcG9ydCBJbmlTdHJ1Y3R1cmUgZnJvbSAnLi9pbmlQYXJzZXInO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBmb3JjZVJlZnJlc2ggfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgZ2V0UHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBQcmlvcml0eU1hbmFnZXI7XHJcbiAgb25Ub2dnbGVNb2RzU3RhdGU6IChlbmFibGU6IGJvb2xlYW4pID0+IHZvaWQ7XHJcbn07XHJcblxyXG5jbGFzcyBUVzNMb2FkT3JkZXIgaW1wbGVtZW50cyB0eXBlcy5JTG9hZE9yZGVyR2FtZUluZm8ge1xyXG4gIHB1YmxpYyBnYW1lSWQ6IHN0cmluZztcclxuICBwdWJsaWMgdG9nZ2xlYWJsZUVudHJpZXM/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyBjbGVhclN0YXRlT25QdXJnZT86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHVzYWdlSW5zdHJ1Y3Rpb25zPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7fT47XHJcbiAgcHVibGljIG5vQ29sbGVjdGlvbkdlbmVyYXRpb24/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG5cclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtUHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJQmFzZVByb3BzKSB7XHJcbiAgICB0aGlzLmdhbWVJZCA9IEdBTUVfSUQ7XHJcbiAgICB0aGlzLmNsZWFyU3RhdGVPblB1cmdlID0gdHJ1ZTtcclxuICAgIHRoaXMudG9nZ2xlYWJsZUVudHJpZXMgPSB0cnVlO1xyXG4gICAgdGhpcy5ub0NvbGxlY3Rpb25HZW5lcmF0aW9uID0gdHJ1ZTtcclxuICAgIHRoaXMudXNhZ2VJbnN0cnVjdGlvbnMgPSAoKSA9PiAoPEluZm9Db21wb25lbnQgb25Ub2dnbGVNb2RzU3RhdGU9e3Byb3BzLm9uVG9nZ2xlTW9kc1N0YXRlfS8+KTtcclxuICAgIHRoaXMubUFwaSA9IHByb3BzLmFwaTtcclxuICAgIHRoaXMubVByaW9yaXR5TWFuYWdlciA9IHByb3BzLmdldFByaW9yaXR5TWFuYWdlcigpO1xyXG4gICAgdGhpcy5kZXNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyID0gdGhpcy5zZXJpYWxpemVMb2FkT3JkZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMudmFsaWRhdGUgPSB0aGlzLnZhbGlkYXRlLmJpbmQodGhpcyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2VyaWFsaXplTG9hZE9yZGVyKGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKHRoaXMubUFwaSwgKCkgPT4gdGhpcy5tUHJpb3JpdHlNYW5hZ2VyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgIC5zZXRJTklTdHJ1Y3QobG9hZE9yZGVyKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVhZGFibGVOYW1lcyA9IHtbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCd9O1xyXG4gIHB1YmxpYyBhc3luYyBkZXNlcmlhbGl6ZUxvYWRPcmRlcigpOiBQcm9taXNlPHR5cGVzLkxvYWRPcmRlcj4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGZpbmROYW1lID0gKHZhbDogc3RyaW5nKSA9PiB0aGlzLnJlYWRhYmxlTmFtZXM/Llt2YWxdIHx8IHZhbDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGluaSA9IGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksICgpID0+IHRoaXMubVByaW9yaXR5TWFuYWdlcikucmVhZFN0cnVjdHVyZSgpO1xyXG4gICAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmtleXMoaW5pLmRhdGEpLnNvcnQoKGEsIGIpID0+IGluaS5kYXRhW2FdLlByaW9yaXR5IC0gaW5pLmRhdGFbYl0uUHJpb3JpdHkpLnJlZHVjZSgoYWNjdW0sIGl0ZXIsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZW50cnkgPSBpbmkuZGF0YVtpdGVyXTtcclxuICAgICAgICAgIGFjY3VtW2l0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/ICdsb2NrZWQnIDogJ3JlZ3VsYXInXS5wdXNoKHtcclxuICAgICAgICAgICAgaWQ6IGl0ZXIsXHJcbiAgICAgICAgICAgIG5hbWU6IGZpbmROYW1lKGl0ZXIpLFxyXG4gICAgICAgICAgICBlbmFibGVkOiBlbnRyeS5FbmFibGVkID09PSAnMScsXHJcbiAgICAgICAgICAgIG1vZElkOiBlbnRyeT8uVksgPz8gaXRlcixcclxuICAgICAgICAgICAgbG9ja2VkOiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCksXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICBwcmVmaXg6IGl0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/IGFjY3VtLmxvY2tlZC5sZW5ndGggOiBlbnRyeT8uUHJpb3JpdHkgPz8gaWR4ICsgMSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9LCB7IGxvY2tlZDogW10sIHJlZ3VsYXI6IFtdIH0pO1xyXG4gICAgICBjb25zdCBmaW5hbEVudHJpZXMgPSBbXS5jb25jYXQoZW50cmllcy5sb2NrZWQsIGVudHJpZXMucmVndWxhcik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmluYWxFbnRyaWVzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgdmFsaWRhdGUocHJldjogdHlwZXMuTG9hZE9yZGVyLCBjdXJyZW50OiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPHR5cGVzLklWYWxpZGF0aW9uUmVzdWx0PiB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29sbGVjdGlvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAvLyBpbXBvcnQgbG9hZCBvcmRlciBmcm9tIGNvbGxlY3Rpb24uXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXHJcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBMb2FkIE9yZGVyJyxcclxuICAgIG1lc3NhZ2U6ICdQYXJzaW5nIGNvbGxlY3Rpb24gZGF0YScsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGNvbGxlY3Rpb25Nb2QgPSBtb2RzW2NvbGxlY3Rpb25JZF07XHJcbiAgaWYgKGNvbGxlY3Rpb25Nb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUik7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdjb2xsZWN0aW9uIG1vZCBpcyBtaXNzaW5nJywgY29sbGVjdGlvbklkKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICB0cnkge1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgICBpZDogQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUixcclxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFbnN1cmluZyBtb2RzIGFyZSBkZXBsb3llZC4uLicsXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gICAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICB9KTtcclxuICAgIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCBjYikpO1xyXG4gICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBjb2xsZWN0aW9uTW9kLmluc3RhbGxhdGlvblBhdGgsICdjb2xsZWN0aW9uLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgY29sbGVjdGlvbiA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gY29sbGVjdGlvbj8ubG9hZE9yZGVyIHx8IHt9O1xyXG4gICAgaWYgKE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICAgICAgbWVzc2FnZTogJ0NvbGxlY3Rpb24gZG9lcyBub3QgaW5jbHVkZSBsb2FkIG9yZGVyIHRvIGltcG9ydCcsXHJcbiAgICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnZlcnRlZCA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpLCBsb2FkT3JkZXIpO1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgICBpZDogQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUixcclxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdXcml0aW5nIExvYWQgT3JkZXIuLi4nLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS5zZXRJTklTdHJ1Y3QoY29udmVydGVkKVxyXG4gICAgICAudGhlbigoKSA9PiBmb3JjZVJlZnJlc2goYXBpKSk7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbG9hZCBvcmRlciBoYXMgYmVlbiBpbXBvcnRlZCcsXHJcbiAgICAgIGRpc3BsYXlNUzogMzAwMCxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBsb2FkIG9yZGVyJywgZXJyKTtcclxuICAgIHJldHVybjtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBUVzNMb2FkT3JkZXI7Il19