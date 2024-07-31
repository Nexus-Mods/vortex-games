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
exports.importLoadOrder = importLoadOrder;
exports.default = TW3LoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJDQUFpRTtBQUVqRSxxQ0FBOEY7QUFDOUYsMEVBQWtEO0FBQ2xELDREQUF1QztBQUV2Qyw2Q0FBc0Q7QUFDdEQsaUNBQXNDO0FBQ3RDLHdFQUFnRDtBQU8vQyxDQUFDO0FBRUYsTUFBTSxZQUFZO0lBV2hCLFlBQVksS0FBaUI7UUFxQnJCLGtCQUFhLEdBQUcsRUFBRSxDQUFDLGtCQUFTLENBQUMsRUFBRSw2QkFBNkIsRUFBRSxDQUFDO1FBcEJyRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFPLENBQUM7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsOEJBQUMsdUJBQWEsSUFBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEdBQUksQ0FBQyxDQUFDO1FBQy9GLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyw4QkFBQyxzQkFBWSxJQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFJLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENB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LE9BQU8sRUFBRSx5Q0FBeUM7Z0JBQ2xELFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUNILE9BQU87U0FDUjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE9BQU87U0FDUjtnQkFBUztZQUNSLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyx3Q0FBK0IsQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQztDQUFBO0FBbEVELDBDQWtFQztBQUVELGtCQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUiwgR0FNRV9JRCwgTE9DS0VEX1BSRUZJWCwgVU5JX1BBVENIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgSW5mb0NvbXBvbmVudCBmcm9tICcuL3ZpZXdzL0luZm9Db21wb25lbnQnO1xyXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuaW1wb3J0IHsgZm9yY2VSZWZyZXNoIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IEl0ZW1SZW5kZXJlciBmcm9tICcuL3ZpZXdzL0l0ZW1SZW5kZXJlcic7XHJcbmltcG9ydCB7IElJdGVtUmVuZGVyZXJQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgZ2V0UHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBQcmlvcml0eU1hbmFnZXI7XHJcbiAgb25Ub2dnbGVNb2RzU3RhdGU6IChlbmFibGU6IGJvb2xlYW4pID0+IHZvaWQ7XHJcbn07XHJcblxyXG5jbGFzcyBUVzNMb2FkT3JkZXIgaW1wbGVtZW50cyB0eXBlcy5JTG9hZE9yZGVyR2FtZUluZm8ge1xyXG4gIHB1YmxpYyBnYW1lSWQ6IHN0cmluZztcclxuICBwdWJsaWMgdG9nZ2xlYWJsZUVudHJpZXM/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyBjbGVhclN0YXRlT25QdXJnZT86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHVzYWdlSW5zdHJ1Y3Rpb25zPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7fT47XHJcbiAgcHVibGljIG5vQ29sbGVjdGlvbkdlbmVyYXRpb24/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyBjdXN0b21JdGVtUmVuZGVyZXI/OiBSZWFjdC5Db21wb25lbnRUeXBlPHsgY2xhc3NOYW1lPzogc3RyaW5nLCBpdGVtOiBJSXRlbVJlbmRlcmVyUHJvcHMsIGZvcndhcmRlZFJlZj86IChyZWY6IGFueSkgPT4gdm9pZCB9PjtcclxuXHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbVByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wczogSUJhc2VQcm9wcykge1xyXG4gICAgdGhpcy5nYW1lSWQgPSBHQU1FX0lEO1xyXG4gICAgdGhpcy5jbGVhclN0YXRlT25QdXJnZSA9IHRydWU7XHJcbiAgICB0aGlzLnRvZ2dsZWFibGVFbnRyaWVzID0gdHJ1ZTtcclxuICAgIHRoaXMubm9Db2xsZWN0aW9uR2VuZXJhdGlvbiA9IHRydWU7XHJcbiAgICB0aGlzLnVzYWdlSW5zdHJ1Y3Rpb25zID0gKCkgPT4gKDxJbmZvQ29tcG9uZW50IG9uVG9nZ2xlTW9kc1N0YXRlPXtwcm9wcy5vblRvZ2dsZU1vZHNTdGF0ZX0gLz4pO1xyXG4gICAgdGhpcy5jdXN0b21JdGVtUmVuZGVyZXIgPSAocHJvcHMpID0+IHtcclxuICAgICAgcmV0dXJuICg8SXRlbVJlbmRlcmVyIGNsYXNzTmFtZT17cHJvcHMuY2xhc3NOYW1lfSBpdGVtPXtwcm9wcy5pdGVtfSAvPilcclxuICAgIH07XHJcbiAgICB0aGlzLm1BcGkgPSBwcm9wcy5hcGk7XHJcbiAgICB0aGlzLm1Qcmlvcml0eU1hbmFnZXIgPSBwcm9wcy5nZXRQcmlvcml0eU1hbmFnZXIoKTtcclxuICAgIHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIgPSB0aGlzLmRlc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnZhbGlkYXRlID0gdGhpcy52YWxpZGF0ZS5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNlcmlhbGl6ZUxvYWRPcmRlcihsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksICgpID0+IHRoaXMubVByaW9yaXR5TWFuYWdlcilcclxuICAgICAgLnNldElOSVN0cnVjdChsb2FkT3JkZXIpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZWFkYWJsZU5hbWVzID0geyBbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCcgfTtcclxuICBwdWJsaWMgYXN5bmMgZGVzZXJpYWxpemVMb2FkT3JkZXIoKTogUHJvbWlzZTx0eXBlcy5Mb2FkT3JkZXI+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBmaW5kTmFtZSA9IChlbnRyeTogeyBuYW1lOiBzdHJpbmcsIFZLPzogc3RyaW5nIH0pID0+IHtcclxuICAgICAgaWYgKHRoaXMucmVhZGFibGVOYW1lcz8uW2VudHJ5Lm5hbWVdICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkYWJsZU5hbWVzW2VudHJ5Lm5hbWVdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZW50cnkuVksgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBlbnRyeS5uYW1lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICAgIGNvbnN0IG1vZDogdHlwZXMuSU1vZCA9IG1vZHNbZW50cnkuVktdO1xyXG4gICAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gZW50cnkubmFtZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGAke3V0aWwucmVuZGVyTW9kTmFtZShtb2QpfSAoJHtlbnRyeS5uYW1lfSlgO1xyXG4gICAgfTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB1bnNvcnRlZDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksICgpID0+IHRoaXMubVByaW9yaXR5TWFuYWdlcikucmVhZFN0cnVjdHVyZSgpO1xyXG4gICAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmtleXModW5zb3J0ZWQpLnNvcnQoKGEsIGIpID0+IHVuc29ydGVkW2FdLlByaW9yaXR5IC0gdW5zb3J0ZWRbYl0uUHJpb3JpdHkpLnJlZHVjZSgoYWNjdW0sIGl0ZXIsIGlkeCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVudHJ5ID0gdW5zb3J0ZWRbaXRlcl07XHJcbiAgICAgICAgYWNjdW1baXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpID8gJ2xvY2tlZCcgOiAncmVndWxhciddLnB1c2goe1xyXG4gICAgICAgICAgaWQ6IGl0ZXIsXHJcbiAgICAgICAgICBuYW1lOiBmaW5kTmFtZSh7IG5hbWU6IGl0ZXIsIFZLOiBlbnRyeS5WSyB9KSxcclxuICAgICAgICAgIGVuYWJsZWQ6IGVudHJ5LkVuYWJsZWQgPT09ICcxJyxcclxuICAgICAgICAgIG1vZElkOiBlbnRyeT8uVksgPz8gaXRlcixcclxuICAgICAgICAgIGxvY2tlZDogaXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpLFxyXG4gICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICBwcmVmaXg6IGl0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/IGFjY3VtLmxvY2tlZC5sZW5ndGggOiBlbnRyeT8uUHJpb3JpdHkgPz8gaWR4ICsgMSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgeyBsb2NrZWQ6IFtdLCByZWd1bGFyOiBbXSB9KTtcclxuICAgICAgY29uc3QgZmluYWxFbnRyaWVzID0gW10uY29uY2F0KGVudHJpZXMubG9ja2VkLCBlbnRyaWVzLnJlZ3VsYXIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbmFsRW50cmllcyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHZhbGlkYXRlKHByZXY6IHR5cGVzLkxvYWRPcmRlciwgY3VycmVudDogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTx0eXBlcy5JVmFsaWRhdGlvblJlc3VsdD4ge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNvbGxlY3Rpb25JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgLy8gaW1wb3J0IGxvYWQgb3JkZXIgZnJvbSBjb2xsZWN0aW9uLlxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxyXG4gICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXHJcbiAgICBtZXNzYWdlOiAnUGFyc2luZyBjb2xsZWN0aW9uIGRhdGEnLFxyXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBjb2xsZWN0aW9uTW9kID0gbW9kc1tjb2xsZWN0aW9uSWRdO1xyXG4gIGlmIChjb2xsZWN0aW9uTW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignY29sbGVjdGlvbiBtb2QgaXMgbWlzc2luZycsIGNvbGxlY3Rpb25JZCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgdHJ5IHtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXHJcbiAgICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxyXG4gICAgICBtZXNzYWdlOiAnRW5zdXJpbmcgbW9kcyBhcmUgZGVwbG95ZWQuLi4nLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBhd2FpdCB1dGlsLnRvUHJvbWlzZShjYiA9PiBhcGkuZXZlbnRzLmVtaXQoJ2RlcGxveS1tb2RzJywgY2IpKTtcclxuICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgY29sbGVjdGlvbk1vZC5pbnN0YWxsYXRpb25QYXRoLCAnY29sbGVjdGlvbi5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGNvbGxlY3Rpb24/LmxvYWRPcmRlciB8fCB7fTtcclxuICAgIGlmIChPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIGRvZXMgbm90IGluY2x1ZGUgbG9hZCBvcmRlciB0byBpbXBvcnQnLFxyXG4gICAgICAgIGRpc3BsYXlNUzogMzAwMCxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb252ZXJ0ZWQgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSwgbG9hZE9yZGVyKTtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXHJcbiAgICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxyXG4gICAgICBtZXNzYWdlOiAnV3JpdGluZyBMb2FkIE9yZGVyLi4uJyxcclxuICAgICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIH0pO1xyXG4gICAgYXdhaXQgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkuc2V0SU5JU3RydWN0KGNvbnZlcnRlZClcclxuICAgICAgLnRoZW4oKCkgPT4gZm9yY2VSZWZyZXNoKGFwaSkpO1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICAgIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIGxvYWQgb3JkZXIgaGFzIGJlZW4gaW1wb3J0ZWQnLFxyXG4gICAgICBkaXNwbGF5TVM6IDMwMDAsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbXBvcnQgbG9hZCBvcmRlcicsIGVycik7XHJcbiAgICByZXR1cm47XHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVFczTG9hZE9yZGVyOyJdfQ==