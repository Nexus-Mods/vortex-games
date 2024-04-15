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
exports.default = TW3LoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLGtEQUEwQjtBQUMxQiwyQ0FBOEM7QUFFOUMscUNBQTZEO0FBQzdELDBFQUFrRDtBQUNsRCw0REFBdUM7QUFPdEMsQ0FBQztBQUVGLE1BQU0sWUFBWTtJQVVoQixZQUFZLEtBQWlCO1FBa0JyQixrQkFBYSxHQUFHLEVBQUMsQ0FBQyxrQkFBUyxDQUFDLEVBQUUsNkJBQTZCLEVBQUMsQ0FBQztRQWpCbkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBTyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLDhCQUFDLHVCQUFhLElBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUM5RixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7UUFDOUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRVksa0JBQWtCLENBQUMsU0FBMEI7O1lBQ3hE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QyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQztLQUFBO0NBQ0Y7QUFFRCxrQkFBZSxZQUFZLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBMT0NLRURfUFJFRklYLCBVTklfUEFUQ0ggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBJbmZvQ29tcG9uZW50IGZyb20gJy4vdmlld3MvSW5mb0NvbXBvbmVudCc7XHJcbmltcG9ydCBJbmlTdHJ1Y3R1cmUgZnJvbSAnLi9pbmlQYXJzZXInO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuICBvblRvZ2dsZU1vZHNTdGF0ZTogKGVuYWJsZTogYm9vbGVhbikgPT4gdm9pZDtcclxufTtcclxuXHJcbmNsYXNzIFRXM0xvYWRPcmRlciBpbXBsZW1lbnRzIHR5cGVzLklMb2FkT3JkZXJHYW1lSW5mbyB7XHJcbiAgcHVibGljIGdhbWVJZDogc3RyaW5nO1xyXG4gIHB1YmxpYyB0b2dnbGVhYmxlRW50cmllcz86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGNsZWFyU3RhdGVPblB1cmdlPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgdXNhZ2VJbnN0cnVjdGlvbnM/OiBSZWFjdC5Db21wb25lbnRUeXBlPHt9PjtcclxuICBwdWJsaWMgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbj86IGJvb2xlYW4gfCB1bmRlZmluZWQ7XHJcblxyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM6IElCYXNlUHJvcHMpIHtcclxuICAgIHRoaXMuZ2FtZUlkID0gR0FNRV9JRDtcclxuICAgIHRoaXMuY2xlYXJTdGF0ZU9uUHVyZ2UgPSB0cnVlO1xyXG4gICAgdGhpcy50b2dnbGVhYmxlRW50cmllcyA9IHRydWU7XHJcbiAgICB0aGlzLm5vQ29sbGVjdGlvbkdlbmVyYXRpb24gPSB0cnVlO1xyXG4gICAgdGhpcy51c2FnZUluc3RydWN0aW9ucyA9ICgpID0+ICg8SW5mb0NvbXBvbmVudCBvblRvZ2dsZU1vZHNTdGF0ZT17cHJvcHMub25Ub2dnbGVNb2RzU3RhdGV9Lz4pO1xyXG4gICAgdGhpcy5tQXBpID0gcHJvcHMuYXBpO1xyXG4gICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyID0gcHJvcHMucHJpb3JpdHlNYW5hZ2VyO1xyXG4gICAgdGhpcy5kZXNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyID0gdGhpcy5zZXJpYWxpemVMb2FkT3JkZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMudmFsaWRhdGUgPSB0aGlzLnZhbGlkYXRlLmJpbmQodGhpcyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2VyaWFsaXplTG9hZE9yZGVyKGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKHRoaXMubUFwaSwgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgIC5zZXRJTklTdHJ1Y3QobG9hZE9yZGVyLCB0aGlzLm1Qcmlvcml0eU1hbmFnZXIpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZWFkYWJsZU5hbWVzID0ge1tVTklfUEFUQ0hdOiAnVW5pZmljYXRpb24vQ29tbXVuaXR5IFBhdGNoJ307XHJcbiAgcHVibGljIGFzeW5jIGRlc2VyaWFsaXplTG9hZE9yZGVyKCk6IFByb21pc2U8dHlwZXMuTG9hZE9yZGVyPiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZmluZE5hbWUgPSAodmFsOiBzdHJpbmcpID0+IHRoaXMucmVhZGFibGVOYW1lcz8uW3ZhbF0gfHwgdmFsO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgaW5pID0gYXdhaXQgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKHRoaXMubUFwaSwgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyKS5yZWFkU3RydWN0dXJlKCk7XHJcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSkuc29ydCgoYSwgYikgPT4gaW5pLmRhdGFbYV0uUHJpb3JpdHkgLSBpbmkuZGF0YVtiXS5Qcmlvcml0eSkucmVkdWNlKChhY2N1bSwgaXRlciwgaWR4KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBlbnRyeSA9IGluaS5kYXRhW2l0ZXJdO1xyXG4gICAgICAgICAgYWNjdW1baXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpID8gJ2xvY2tlZCcgOiAncmVndWxhciddLnB1c2goe1xyXG4gICAgICAgICAgICBpZDogaXRlcixcclxuICAgICAgICAgICAgbmFtZTogZmluZE5hbWUoaXRlciksXHJcbiAgICAgICAgICAgIGVuYWJsZWQ6IGVudHJ5LkVuYWJsZWQgPT09ICcxJyxcclxuICAgICAgICAgICAgbW9kSWQ6IGVudHJ5Py5WSyA/PyBpdGVyLFxyXG4gICAgICAgICAgICBsb2NrZWQ6IGl0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgIHByZWZpeDogaXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpID8gYWNjdW0ubG9ja2VkLmxlbmd0aCA6IGVudHJ5Py5Qcmlvcml0eSA/PyBpZHggKyAxLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICAgIH0sIHsgbG9ja2VkOiBbXSwgcmVndWxhcjogW10gfSk7XHJcbiAgICAgIGNvbnN0IGZpbmFsRW50cmllcyA9IFtdLmNvbmNhdChlbnRyaWVzLmxvY2tlZCwgZW50cmllcy5yZWd1bGFyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaW5hbEVudHJpZXMpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyB2YWxpZGF0ZShwcmV2OiB0eXBlcy5Mb2FkT3JkZXIsIGN1cnJlbnQ6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dHlwZXMuSVZhbGlkYXRpb25SZXN1bHQ+IHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFRXM0xvYWRPcmRlcjsiXX0=