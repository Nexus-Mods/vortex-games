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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vortex_parse_ini_1 = __importStar(require("vortex-parse-ini"));
const vortex_api_1 = require("vortex-api");
const util_1 = require("./util");
const migrations_1 = require("./migrations");
const common_1 = require("./common");
class IniStructure {
    static getInstance(api, priorityManager) {
        if (!IniStructure.instance) {
            if (api === undefined || priorityManager === undefined) {
                throw new Error('IniStructure is not context aware');
            }
            IniStructure.instance = new IniStructure(api, priorityManager);
        }
        return IniStructure.instance;
    }
    constructor(api, priorityManager) {
        this.mIniStruct = {};
        this.mIniStruct = {};
        this.mApi = api;
        this.mPriorityManager = priorityManager;
    }
    getIniStructure() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mIniStruct;
        });
    }
    setINIStruct(loadOrder, priorityManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const modMap = yield (0, util_1.getAllMods)(this.mApi);
            this.mIniStruct = {};
            const mods = [].concat(modMap.merged, modMap.managed, modMap.manual);
            const manualLocked = modMap.manual.filter(util_1.isLockedEntry);
            const managedLocked = modMap.managed
                .filter(entry => (0, util_1.isLockedEntry)(entry.name))
                .map(entry => entry.name);
            const totalLocked = [].concat(modMap.merged, manualLocked, managedLocked);
            this.mIniStruct = mods.reduce((accum, mod, idx) => {
                var _a, _b, _c;
                let name;
                let key;
                if (typeof (mod) === 'object' && mod !== null) {
                    name = mod.name;
                    key = mod.id;
                }
                else {
                    name = mod;
                    key = mod;
                }
                const LOEntry = vortex_api_1.util.getSafe(loadOrder, [key], undefined);
                if (idx === 0) {
                    priorityManager === null || priorityManager === void 0 ? void 0 : priorityManager.resetMaxPriority(totalLocked.length);
                }
                accum[name] = {
                    Enabled: (LOEntry !== undefined) ? LOEntry.enabled ? 1 : 0 : 1,
                    Priority: totalLocked.includes(name)
                        ? totalLocked.indexOf(name)
                        : (_c = (_a = priorityManager === null || priorityManager === void 0 ? void 0 : priorityManager.getPriority(key)) !== null && _a !== void 0 ? _a : (_b = LOEntry === null || LOEntry === void 0 ? void 0 : LOEntry.data) === null || _b === void 0 ? void 0 : _b.prefix) !== null && _c !== void 0 ? _c : idx + 1,
                    VK: key,
                };
                return accum;
            }, {});
            return this.writeToModSettings();
        });
    }
    revertLOFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const profile = vortex_api_1.selectors.activeProfile(state);
            if (!!profile && (profile.gameId === GAME_ID)) {
                const loadOrder = (0, migrations_1.getPersistentLoadOrder)(this.mApi);
                const manuallyAdded = yield (0, util_1.getManuallyAddedMods)(this.mApi);
                if (manuallyAdded.length > 0) {
                    const newStruct = {};
                    manuallyAdded.forEach((mod, idx) => {
                        var _a, _b;
                        newStruct[mod] = {
                            Enabled: 1,
                            Priority: ((loadOrder !== undefined && !!loadOrder[mod])
                                ? parseInt((_b = (_a = loadOrder[mod]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.prefix, 10) : idx) + 1,
                        };
                    });
                    this.mIniStruct = newStruct;
                    yield this.writeToModSettings()
                        .then(() => {
                        (0, util_1.forceRefresh)(this.mApi);
                        return Promise.resolve();
                    })
                        .catch(err => this.modSettingsErrorHandler(err, 'Failed to cleanup load order file'));
                }
                else {
                    const filePath = (0, common_1.getLoadOrderFilePath)();
                    vortex_api_1.fs.removeAsync(filePath)
                        .catch(err => (err.code === 'ENOENT')
                        ? Promise.resolve()
                        : this.mApi.showErrorNotification('Failed to cleanup load order file', err));
                }
            }
        });
    }
    ensureModSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, common_1.getLoadOrderFilePath)();
            const parser = new vortex_parse_ini_1.default(new vortex_parse_ini_1.WinapiFormat());
            return vortex_api_1.fs.statAsync(filePath)
                .then(() => parser.read(filePath))
                .catch(err => (err.code === 'ENOENT')
                ? this.createModSettings()
                    .then(() => parser.read(filePath))
                : Promise.reject(err));
        });
    }
    createModSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, common_1.getLoadOrderFilePath)();
            return vortex_api_1.fs.ensureDirWritableAsync(path.dirname(filePath))
                .then(() => vortex_api_1.fs.writeFileAsync(filePath, '', { encoding: 'utf8' }));
        });
    }
    modSettingsErrorHandler(err, errMessage) {
        let allowReport = true;
        const userCanceled = err instanceof vortex_api_1.util.UserCanceled;
        if (userCanceled) {
            allowReport = false;
        }
        const busyResource = err instanceof common_1.ResourceInaccessibleError;
        if (allowReport && busyResource) {
            allowReport = err.allowReport;
            err.message = err.errorMessage;
        }
        this.mApi.showErrorNotification(errMessage, err, { allowReport });
        return;
    }
    readStructure() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
                return Promise.resolve([]);
            }
            const filePath = (0, common_1.getLoadOrderFilePath)();
            const parser = new vortex_parse_ini_1.default(new vortex_parse_ini_1.WinapiFormat());
            const ini = yield parser.read(filePath);
            return Promise.resolve(ini);
        });
    }
    writeToModSettings() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, common_1.getLoadOrderFilePath)();
            const parser = new vortex_parse_ini_1.default(new vortex_parse_ini_1.WinapiFormat());
            try {
                yield vortex_api_1.fs.removeAsync(filePath);
                yield vortex_api_1.fs.writeFileAsync(filePath, '', { encoding: 'utf8' });
                const ini = yield parser.read(filePath);
                const struct = Object.keys(this.mIniStruct);
                for (const key of struct) {
                    if (((_b = (_a = this.mIniStruct) === null || _a === void 0 ? void 0 : _a[key]) === null || _b === void 0 ? void 0 : _b.Enabled) === undefined) {
                        continue;
                    }
                    ini.data[key] = {
                        Enabled: this.mIniStruct[key].Enabled,
                        Priority: this.mIniStruct[key].Priority,
                        VK: this.mIniStruct[key].VK,
                    };
                }
                yield parser.write(filePath, ini);
                return Promise.resolve();
            }
            catch (err) {
                return (err.path !== undefined && ['EPERM', 'EBUSY'].includes(err.code))
                    ? Promise.reject(new common_1.ResourceInaccessibleError(err.path))
                    : Promise.reject(err);
            }
        });
    }
}
exports.default = IniStructure;
IniStructure.instance = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5pUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxxRUFBMkQ7QUFDM0QsMkNBQXdEO0FBRXhELGlDQUF1RjtBQUd2Riw2Q0FBc0Q7QUFFdEQscUNBQXNHO0FBRXRHLE1BQXFCLFlBQVk7SUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUF5QixFQUFFLGVBQWlDO1FBQ3BGLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFO2dCQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7YUFDdEQ7WUFDRCxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUNoRTtRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBSUQsWUFBWSxHQUF3QixFQUFFLGVBQWdDO1FBSDlELGVBQVUsR0FBRyxFQUFFLENBQUM7UUFJdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztJQUMxQyxDQUFDO0lBRVksZUFBZTs7WUFDMUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVZLFlBQVksQ0FBQyxTQUEwQixFQUFFLGVBQWdDOztZQUNwRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsaUJBQVUsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLEdBQUcsRUFB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LEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3RFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksa0NBQXlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN6RCxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUN4Qjs7S0FDRjs7QUFwTEgsK0JBcUxDO0FBcExnQixxQkFBUSxHQUFpQixJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgSW5pUGFyc2VyLCB7IFdpbmFwaUZvcm1hdCB9IGZyb20gJ3ZvcnRleC1wYXJzZS1pbmknO1xyXG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgZm9yY2VSZWZyZXNoLCBpc0xvY2tlZEVudHJ5LCBnZXRBbGxNb2RzLCBnZXRNYW51YWxseUFkZGVkTW9kcyB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgRE9fTk9UX0RJU1BMQVksIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IsIGdldExvYWRPcmRlckZpbGVQYXRoLCBVTklfUEFUQ0ggfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbmlTdHJ1Y3R1cmUge1xyXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBJbmlTdHJ1Y3R1cmUgPSBudWxsO1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoYXBpPzogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyPzogUHJpb3JpdHlNYW5hZ2VyKTogSW5pU3RydWN0dXJlIHtcclxuICAgIGlmICghSW5pU3RydWN0dXJlLmluc3RhbmNlKSB7XHJcbiAgICAgIGlmIChhcGkgPT09IHVuZGVmaW5lZCB8fCBwcmlvcml0eU1hbmFnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5pU3RydWN0dXJlIGlzIG5vdCBjb250ZXh0IGF3YXJlJyk7XHJcbiAgICAgIH1cclxuICAgICAgSW5pU3RydWN0dXJlLmluc3RhbmNlID0gbmV3IEluaVN0cnVjdHVyZShhcGksIHByaW9yaXR5TWFuYWdlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5pbnN0YW5jZTtcclxuICB9XHJcbiAgcHJpdmF0ZSBtSW5pU3RydWN0ID0ge307XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbVByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIpIHtcclxuICAgIHRoaXMubUluaVN0cnVjdCA9IHt9O1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyID0gcHJpb3JpdHlNYW5hZ2VyO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGdldEluaVN0cnVjdHVyZSgpIHtcclxuICAgIHJldHVybiB0aGlzLm1JbmlTdHJ1Y3Q7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2V0SU5JU3RydWN0KGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcikge1xyXG4gICAgY29uc3QgbW9kTWFwID0gYXdhaXQgZ2V0QWxsTW9kcyh0aGlzLm1BcGkpO1xyXG4gICAgdGhpcy5tSW5pU3RydWN0ID0ge307XHJcbiAgICBjb25zdCBtb2RzID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1vZE1hcC5tYW5hZ2VkLCBtb2RNYXAubWFudWFsKTtcclxuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKGlzTG9ja2VkRW50cnkpO1xyXG4gICAgY29uc3QgbWFuYWdlZExvY2tlZCA9IG1vZE1hcC5tYW5hZ2VkXHJcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gaXNMb2NrZWRFbnRyeShlbnRyeS5uYW1lKSlcclxuICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKTtcclxuICAgIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCwgbWFuYWdlZExvY2tlZCk7XHJcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSBtb2RzLnJlZHVjZSgoYWNjdW0sIG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgIGxldCBuYW1lO1xyXG4gICAgICBsZXQga2V5O1xyXG4gICAgICBpZiAodHlwZW9mKG1vZCkgPT09ICdvYmplY3QnICYmIG1vZCAhPT0gbnVsbCkge1xyXG4gICAgICAgIG5hbWUgPSBtb2QubmFtZTtcclxuICAgICAgICBrZXkgPSBtb2QuaWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZDtcclxuICAgICAgICBrZXkgPSBtb2Q7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IExPRW50cnkgPSB1dGlsLmdldFNhZmUobG9hZE9yZGVyLCBba2V5XSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICAgIHByaW9yaXR5TWFuYWdlcj8ucmVzZXRNYXhQcmlvcml0eSh0b3RhbExvY2tlZC5sZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICAgIGFjY3VtW25hbWVdID0ge1xyXG4gICAgICAgIC8vIFRoZSBJTkkgZmlsZSdzIGVuYWJsZWQgYXR0cmlidXRlIGV4cGVjdHMgMSBvciAwXHJcbiAgICAgICAgRW5hYmxlZDogKExPRW50cnkgIT09IHVuZGVmaW5lZCkgPyBMT0VudHJ5LmVuYWJsZWQgPyAxIDogMCA6IDEsXHJcbiAgICAgICAgUHJpb3JpdHk6IHRvdGFsTG9ja2VkLmluY2x1ZGVzKG5hbWUpXHJcbiAgICAgICAgICA/IHRvdGFsTG9ja2VkLmluZGV4T2YobmFtZSlcclxuICAgICAgICAgIDogcHJpb3JpdHlNYW5hZ2VyPy5nZXRQcmlvcml0eShrZXkpID8/IExPRW50cnk/LmRhdGE/LnByZWZpeCA/PyBpZHggKyAxLFxyXG4gICAgICAgIFZLOiBrZXksXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIHt9KTtcclxuICAgIHJldHVybiB0aGlzLndyaXRlVG9Nb2RTZXR0aW5ncygpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJldmVydExPRmlsZSgpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpKSB7XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIodGhpcy5tQXBpKTtcclxuICAgICAgY29uc3QgbWFudWFsbHlBZGRlZCA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKHRoaXMubUFwaSk7XHJcbiAgICAgIGlmIChtYW51YWxseUFkZGVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjb25zdCBuZXdTdHJ1Y3QgPSB7fTtcclxuICAgICAgICBtYW51YWxseUFkZGVkLmZvckVhY2goKG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgICAgICBuZXdTdHJ1Y3RbbW9kXSA9IHtcclxuICAgICAgICAgICAgRW5hYmxlZDogMSxcclxuICAgICAgICAgICAgUHJpb3JpdHk6ICgobG9hZE9yZGVyICE9PSB1bmRlZmluZWQgJiYgISFsb2FkT3JkZXJbbW9kXSlcclxuICAgICAgICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlclttb2RdPy5kYXRhPy5wcmVmaXgsIDEwKSA6IGlkeCkgKyAxLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5tSW5pU3RydWN0ID0gbmV3U3RydWN0O1xyXG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMubW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyLCAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgICAgICBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICA6IHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycikpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kU2V0dGluZ3MoKSB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICA/IHRoaXMuY3JlYXRlTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVNb2RTZXR0aW5ncygpIHtcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAgIC8vICBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKGVpdGhlciBieSB1cyBvciB0aGUgZ2FtZSkgYnV0XHJcbiAgICAvLyAganVzdCBpbiBjYXNlIGl0IGdvdCByZW1vdmVkIHNvbWVob3csIHdlIHJlLWluc3RhdGUgaXRcclxuICAgIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKVxyXG4gICAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyOiBhbnksIGVyck1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcclxuICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkO1xyXG4gICAgaWYgKHVzZXJDYW5jZWxlZCkge1xyXG4gICAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYnVzeVJlc291cmNlID0gZXJyIGluc3RhbmNlb2YgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcjtcclxuICAgIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcclxuICAgICAgYWxsb3dSZXBvcnQgPSBlcnIuYWxsb3dSZXBvcnQ7XHJcbiAgICAgIGVyci5tZXNzYWdlID0gZXJyLmVycm9yTWVzc2FnZTtcclxuICAgIH1cclxuICBcclxuICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJlYWRTdHJ1Y3R1cmUoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gV2hhdCBhbiBvZGQgdXNlIGNhc2UgLSBwZXJoYXBzIHRoZSB1c2VyIGhhZCBzd2l0Y2hlZCBnYW1lTW9kZXMgb3JcclxuICAgICAgLy8gIGV2ZW4gZGVsZXRlZCBoaXMgcHJvZmlsZSBkdXJpbmcgdGhlIHByZS1zb3J0IGZ1bmN0aW9uYWxpdHkgP1xyXG4gICAgICAvLyAgT2RkIGJ1dCBwbGF1c2libGUgSSBzdXBwb3NlID9cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9XHJcbiAgXHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICBjb25zdCBpbmkgPSBhd2FpdCBwYXJzZXIucmVhZChmaWxlUGF0aCk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluaSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgd3JpdGVUb01vZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlcihuZXcgV2luYXBpRm9ybWF0KCkpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpO1xyXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgICAgY29uc3QgaW5pID0gYXdhaXQgcGFyc2VyLnJlYWQoZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBzdHJ1Y3QgPSBPYmplY3Qua2V5cyh0aGlzLm1JbmlTdHJ1Y3QpO1xyXG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBzdHJ1Y3QpIHtcclxuICAgICAgICBpZiAodGhpcy5tSW5pU3RydWN0Py5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgdXNlciB0byBydW4gbXVsdGlwbGUgb3BlcmF0aW9ucyBhdCBvbmNlLFxyXG4gICAgICAgICAgLy8gIGNhdXNpbmcgdGhlIHN0YXRpYyBpbmkgc3RydWN0dXJlIHRvIGJlIG1vZGlmaWVkXHJcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXHJcbiAgICAgICAgICAvLyAgbW9kaWZ5aW5nIHRoZSBsb2FkIG9yZGVyIHdoaWxlIGRlcGxveWluZy4gVGhpcyBzaG91bGRcclxuICAgICAgICAgIC8vICBtYWtlIHN1cmUgd2UgZG9uJ3QgYXR0ZW1wdCB0byB3cml0ZSBhbnkgaW52YWxpZCBtb2QgZW50cmllcy5cclxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcclxuICAgICAgICAgIEVuYWJsZWQ6IHRoaXMubUluaVN0cnVjdFtrZXldLkVuYWJsZWQsXHJcbiAgICAgICAgICBQcmlvcml0eTogdGhpcy5tSW5pU3RydWN0W2tleV0uUHJpb3JpdHksXHJcbiAgICAgICAgICBWSzogdGhpcy5tSW5pU3RydWN0W2tleV0uVkssXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBwYXJzZXIud3JpdGUoZmlsZVBhdGgsIGluaSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgIHJldHVybiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxyXG4gICAgICAgID8gUHJvbWlzZS5yZWplY3QobmV3IFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IoZXJyLnBhdGgpKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKVxyXG4gICAgfSBcclxuICB9XHJcbn0iXX0=