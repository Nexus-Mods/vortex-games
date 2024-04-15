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
const react_1 = __importDefault(require("react"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const InfoComponent_1 = __importDefault(require("./views/InfoComponent"));
const iniParser_1 = __importDefault(require("./iniParser"));
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
        this.mPriorityManager = props.priorityManager;
        this.deserializeLoadOrder = this.deserializeLoadOrder.bind(this);
        this.serializeLoadOrder = this.serializeLoadOrder.bind(this);
        this.validate = this.validate.bind(this);
    }
    serializeLoadOrder(loadOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            return iniParser_1.default.getInstance(this.mApi, this.mPriorityManager)
                .setINIStruct(loadOrder, this.mPriorityManager);
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
                const ini = yield iniParser_1.default.getInstance(this.mApi, this.mPriorityManager).readStructure();
                const entries = Object.keys(ini.data).reduce((accum, iter, idx) => {
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
exports.default = TW3LoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLGtEQUEwQjtBQUMxQiwyQ0FBOEM7QUFFOUMscUNBQTZEO0FBQzdELDBFQUFrRDtBQUNsRCw0REFBdUM7QUFPdEMsQ0FBQztBQUVGLE1BQU0sWUFBWTtJQVVoQixZQUFZLEtBQWlCO1FBa0JyQixrQkFBYSxHQUFHLEVBQUMsQ0FBQyxrQkFBUyxDQUFDLEVBQUUsNkJBQTZCLEVBQUMsQ0FBQztRQWpCbkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBTyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLDhCQUFDLHVCQUFhLElBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUM5RixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7UUFDOUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRVksa0JBQWtCLENBQUMsU0FBMEI7O1lBQ3hELE9BQU8sbUJBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUM7aUJBQzdDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDckUsQ0FBQztLQUFBO0lBR1ksb0JBQW9COztZQUMvQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQSxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsRUFBRSxNQUFLLFNBQVMsRUFBRTtnQkFDbkMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQzVCO1lBQ0QsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFXLEVBQUUsRUFBRSxXQUFDLE9BQUEsQ0FBQSxNQUFBLElBQUksQ0FBQyxhQUFhLDBDQUFHLEdBQUcsQ0FBQyxLQUFJLEdBQUcsQ0FBQSxFQUFBLENBQUM7WUFDbkUsSUFBSTtnQkFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLG1CQUFZLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzdGLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7O29CQUM5RCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM3QixLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxzQkFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDO3dCQUNoRSxFQUFFLEVBQUUsSUFBSTt3QkFDUixJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQzt3QkFDcEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEtBQUssR0FBRzt3QkFDOUIsS0FBSyxFQUFFLE1BQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLEVBQUUsbUNBQUksSUFBSTt3QkFDeEIsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsc0JBQWEsQ0FBQzt3QkFDdEMsSUFBSSxFQUFFOzRCQUNKLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLHNCQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLFFBQVEsbUNBQUksR0FBRyxHQUFHLENBQUM7eUJBQzFGO3FCQUNGLENBQUMsQ0FBQTtvQkFDRixPQUFPLEtBQUssQ0FBQztnQkFDZixDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNoRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDdEM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixPQUFNO2FBQ1A7UUFDSCxDQUFDO0tBQUE7SUFFWSxRQUFRLENBQUMsSUFBcUIsRUFBRSxPQUF3Qjs7WUFDbkUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7S0FBQTtDQUNGO0FBRUQsa0JBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgTE9DS0VEX1BSRUZJWCwgVU5JX1BBVENIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgSW5mb0NvbXBvbmVudCBmcm9tICcuL3ZpZXdzL0luZm9Db21wb25lbnQnO1xyXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XHJcbiAgb25Ub2dnbGVNb2RzU3RhdGU6IChlbmFibGU6IGJvb2xlYW4pID0+IHZvaWQ7XHJcbn07XHJcblxyXG5jbGFzcyBUVzNMb2FkT3JkZXIgaW1wbGVtZW50cyB0eXBlcy5JTG9hZE9yZGVyR2FtZUluZm8ge1xyXG4gIHB1YmxpYyBnYW1lSWQ6IHN0cmluZztcclxuICBwdWJsaWMgdG9nZ2xlYWJsZUVudHJpZXM/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyBjbGVhclN0YXRlT25QdXJnZT86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHVzYWdlSW5zdHJ1Y3Rpb25zPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7fT47XHJcbiAgcHVibGljIG5vQ29sbGVjdGlvbkdlbmVyYXRpb24/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xyXG5cclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtUHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBJQmFzZVByb3BzKSB7XHJcbiAgICB0aGlzLmdhbWVJZCA9IEdBTUVfSUQ7XHJcbiAgICB0aGlzLmNsZWFyU3RhdGVPblB1cmdlID0gdHJ1ZTtcclxuICAgIHRoaXMudG9nZ2xlYWJsZUVudHJpZXMgPSB0cnVlO1xyXG4gICAgdGhpcy5ub0NvbGxlY3Rpb25HZW5lcmF0aW9uID0gdHJ1ZTtcclxuICAgIHRoaXMudXNhZ2VJbnN0cnVjdGlvbnMgPSAoKSA9PiAoPEluZm9Db21wb25lbnQgb25Ub2dnbGVNb2RzU3RhdGU9e3Byb3BzLm9uVG9nZ2xlTW9kc1N0YXRlfS8+KTtcclxuICAgIHRoaXMubUFwaSA9IHByb3BzLmFwaTtcclxuICAgIHRoaXMubVByaW9yaXR5TWFuYWdlciA9IHByb3BzLnByaW9yaXR5TWFuYWdlcjtcclxuICAgIHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIgPSB0aGlzLmRlc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnZhbGlkYXRlID0gdGhpcy52YWxpZGF0ZS5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNlcmlhbGl6ZUxvYWRPcmRlcihsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksIHRoaXMubVByaW9yaXR5TWFuYWdlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAuc2V0SU5JU3RydWN0KGxvYWRPcmRlciwgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVhZGFibGVOYW1lcyA9IHtbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCd9O1xyXG4gIHB1YmxpYyBhc3luYyBkZXNlcmlhbGl6ZUxvYWRPcmRlcigpOiBQcm9taXNlPHR5cGVzLkxvYWRPcmRlcj4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGZpbmROYW1lID0gKHZhbDogc3RyaW5nKSA9PiB0aGlzLnJlYWRhYmxlTmFtZXM/Llt2YWxdIHx8IHZhbDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGluaSA9IGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksIHRoaXMubVByaW9yaXR5TWFuYWdlcikucmVhZFN0cnVjdHVyZSgpO1xyXG4gICAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmtleXMoaW5pLmRhdGEpLnJlZHVjZSgoYWNjdW0sIGl0ZXIsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZW50cnkgPSBpbmkuZGF0YVtpdGVyXTtcclxuICAgICAgICAgIGFjY3VtW2l0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/ICdsb2NrZWQnIDogJ3JlZ3VsYXInXS5wdXNoKHtcclxuICAgICAgICAgICAgaWQ6IGl0ZXIsXHJcbiAgICAgICAgICAgIG5hbWU6IGZpbmROYW1lKGl0ZXIpLFxyXG4gICAgICAgICAgICBlbmFibGVkOiBlbnRyeS5FbmFibGVkID09PSAnMScsXHJcbiAgICAgICAgICAgIG1vZElkOiBlbnRyeT8uVksgPz8gaXRlcixcclxuICAgICAgICAgICAgbG9ja2VkOiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCksXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICBwcmVmaXg6IGl0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/IGFjY3VtLmxvY2tlZC5sZW5ndGggOiBlbnRyeT8uUHJpb3JpdHkgPz8gaWR4ICsgMSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9LCB7IGxvY2tlZDogW10sIHJlZ3VsYXI6IFtdIH0pO1xyXG4gICAgICBjb25zdCBmaW5hbEVudHJpZXMgPSBbXS5jb25jYXQoZW50cmllcy5sb2NrZWQsIGVudHJpZXMucmVndWxhcik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmluYWxFbnRyaWVzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgdmFsaWRhdGUocHJldjogdHlwZXMuTG9hZE9yZGVyLCBjdXJyZW50OiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPHR5cGVzLklWYWxpZGF0aW9uUmVzdWx0PiB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBUVzNMb2FkT3JkZXI7Il19