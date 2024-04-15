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
                const LOEntry = (loadOrder || []).find(iter => iter.modId === key);
                const idxOfEntry = (loadOrder || []).findIndex(iter => iter.modId === key);
                if (idx === 0) {
                    priorityManager === null || priorityManager === void 0 ? void 0 : priorityManager.resetMaxPriority(totalLocked.length);
                }
                accum[name] = {
                    Enabled: (LOEntry !== undefined) ? LOEntry.enabled ? 1 : 0 : 1,
                    Priority: totalLocked.includes(name) ? totalLocked.indexOf(name) + 1 : idxOfEntry + 1,
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
                const struct = Object.keys(this.mIniStruct).sort((a, b) => this.mIniStruct[a].Priority - this.mIniStruct[b].Priority);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5pUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxxRUFBMkQ7QUFDM0QsMkNBQXdEO0FBRXhELGlDQUF1RjtBQUd2Riw2Q0FBc0Q7QUFFdEQscUNBQXNHO0FBRXRHLE1BQXFCLFlBQVk7SUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUF5QixFQUFFLGVBQWlDO1FBQ3BGLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFO2dCQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7YUFDdEQ7WUFDRCxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUNoRTtRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBSUQsWUFBWSxHQUF3QixFQUFFLGVBQWdDO1FBSDlELGVBQVUsR0FBRyxFQUFFLENBQUM7UUFJdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztJQUMxQyxDQUFDO0lBRVksZUFBZTs7WUFDMUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVZLFlBQVksQ0FBQyxTQUEwQixFQUFFLGVBQWdDOztZQUNwRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsaUJBQVUsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLEdBQUcsRUFB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QkFDNUIsQ0FBQztpQkFDSDtnQkFDRCxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxQjtZQUFDLE9BQU0sR0FBRyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN0RSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGtDQUF5QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7YUFDeEI7O0tBQ0Y7O0FBbkxILCtCQW9MQztBQW5MZ0IscUJBQVEsR0FBaUIsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IEluaVBhcnNlciwgeyBXaW5hcGlGb3JtYXQgfSBmcm9tICd2b3J0ZXgtcGFyc2UtaW5pJztcclxuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IGZvcmNlUmVmcmVzaCwgaXNMb2NrZWRFbnRyeSwgZ2V0QWxsTW9kcywgZ2V0TWFudWFsbHlBZGRlZE1vZHMgfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcblxyXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCB7IERPX05PVF9ESVNQTEFZLCBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yLCBnZXRMb2FkT3JkZXJGaWxlUGF0aCwgVU5JX1BBVENIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5pU3RydWN0dXJlIHtcclxuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogSW5pU3RydWN0dXJlID0gbnVsbDtcclxuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKGFwaT86IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcj86IFByaW9yaXR5TWFuYWdlcik6IEluaVN0cnVjdHVyZSB7XHJcbiAgICBpZiAoIUluaVN0cnVjdHVyZS5pbnN0YW5jZSkge1xyXG4gICAgICBpZiAoYXBpID09PSB1bmRlZmluZWQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luaVN0cnVjdHVyZSBpcyBub3QgY29udGV4dCBhd2FyZScpO1xyXG4gICAgICB9XHJcbiAgICAgIEluaVN0cnVjdHVyZS5pbnN0YW5jZSA9IG5ldyBJbmlTdHJ1Y3R1cmUoYXBpLCBwcmlvcml0eU1hbmFnZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBJbmlTdHJ1Y3R1cmUuaW5zdGFuY2U7XHJcbiAgfVxyXG4gIHByaXZhdGUgbUluaVN0cnVjdCA9IHt9O1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyKSB7XHJcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSB7fTtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubVByaW9yaXR5TWFuYWdlciA9IHByaW9yaXR5TWFuYWdlcjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBnZXRJbmlTdHJ1Y3R1cmUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tSW5pU3RydWN0O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNldElOSVN0cnVjdChsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIpIHtcclxuICAgIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHModGhpcy5tQXBpKTtcclxuICAgIHRoaXMubUluaVN0cnVjdCA9IHt9O1xyXG4gICAgY29uc3QgbW9kcyA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtb2RNYXAubWFuYWdlZCwgbW9kTWFwLm1hbnVhbCk7XHJcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihpc0xvY2tlZEVudHJ5KTtcclxuICAgIGNvbnN0IG1hbmFnZWRMb2NrZWQgPSBtb2RNYXAubWFuYWdlZFxyXG4gICAgICAuZmlsdGVyKGVudHJ5ID0+IGlzTG9ja2VkRW50cnkoZW50cnkubmFtZSkpXHJcbiAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSk7XHJcbiAgICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQsIG1hbmFnZWRMb2NrZWQpO1xyXG4gICAgdGhpcy5tSW5pU3RydWN0ID0gbW9kcy5yZWR1Y2UoKGFjY3VtLCBtb2QsIGlkeCkgPT4ge1xyXG4gICAgICBsZXQgbmFtZTtcclxuICAgICAgbGV0IGtleTtcclxuICAgICAgaWYgKHR5cGVvZihtb2QpID09PSAnb2JqZWN0JyAmJiBtb2QgIT09IG51bGwpIHtcclxuICAgICAgICBuYW1lID0gbW9kLm5hbWU7XHJcbiAgICAgICAga2V5ID0gbW9kLmlkO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5hbWUgPSBtb2Q7XHJcbiAgICAgICAga2V5ID0gbW9kO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBMT0VudHJ5ID0gKGxvYWRPcmRlciB8fCBbXSkuZmluZChpdGVyID0+IGl0ZXIubW9kSWQgPT09IGtleSk7XHJcbiAgICAgIGNvbnN0IGlkeE9mRW50cnkgPSAobG9hZE9yZGVyIHx8IFtdKS5maW5kSW5kZXgoaXRlciA9PiBpdGVyLm1vZElkID09PSBrZXkpO1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgcHJpb3JpdHlNYW5hZ2VyPy5yZXNldE1heFByaW9yaXR5KHRvdGFsTG9ja2VkLmxlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgICAgYWNjdW1bbmFtZV0gPSB7XHJcbiAgICAgICAgLy8gVGhlIElOSSBmaWxlJ3MgZW5hYmxlZCBhdHRyaWJ1dGUgZXhwZWN0cyAxIG9yIDBcclxuICAgICAgICBFbmFibGVkOiAoTE9FbnRyeSAhPT0gdW5kZWZpbmVkKSA/IExPRW50cnkuZW5hYmxlZCA/IDEgOiAwIDogMSxcclxuICAgICAgICBQcmlvcml0eTogdG90YWxMb2NrZWQuaW5jbHVkZXMobmFtZSkgPyB0b3RhbExvY2tlZC5pbmRleE9mKG5hbWUpICsgMSA6IGlkeE9mRW50cnkgKyAxLFxyXG4gICAgICAgIFZLOiBrZXksXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIHt9KTtcclxuICAgIHJldHVybiB0aGlzLndyaXRlVG9Nb2RTZXR0aW5ncygpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJldmVydExPRmlsZSgpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpKSB7XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIodGhpcy5tQXBpKTtcclxuICAgICAgY29uc3QgbWFudWFsbHlBZGRlZCA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKHRoaXMubUFwaSk7XHJcbiAgICAgIGlmIChtYW51YWxseUFkZGVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjb25zdCBuZXdTdHJ1Y3QgPSB7fTtcclxuICAgICAgICBtYW51YWxseUFkZGVkLmZvckVhY2goKG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgICAgICBuZXdTdHJ1Y3RbbW9kXSA9IHtcclxuICAgICAgICAgICAgRW5hYmxlZDogMSxcclxuICAgICAgICAgICAgUHJpb3JpdHk6ICgobG9hZE9yZGVyICE9PSB1bmRlZmluZWQgJiYgISFsb2FkT3JkZXJbbW9kXSlcclxuICAgICAgICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlclttb2RdPy5kYXRhPy5wcmVmaXgsIDEwKSA6IGlkeCkgKyAxLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5tSW5pU3RydWN0ID0gbmV3U3RydWN0O1xyXG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMubW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyLCAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgICAgICBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICA6IHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycikpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kU2V0dGluZ3MoKSB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICA/IHRoaXMuY3JlYXRlTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVNb2RTZXR0aW5ncygpIHtcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAgIC8vICBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKGVpdGhlciBieSB1cyBvciB0aGUgZ2FtZSkgYnV0XHJcbiAgICAvLyAganVzdCBpbiBjYXNlIGl0IGdvdCByZW1vdmVkIHNvbWVob3csIHdlIHJlLWluc3RhdGUgaXRcclxuICAgIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKVxyXG4gICAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyOiBhbnksIGVyck1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcclxuICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkO1xyXG4gICAgaWYgKHVzZXJDYW5jZWxlZCkge1xyXG4gICAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYnVzeVJlc291cmNlID0gZXJyIGluc3RhbmNlb2YgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcjtcclxuICAgIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcclxuICAgICAgYWxsb3dSZXBvcnQgPSBlcnIuYWxsb3dSZXBvcnQ7XHJcbiAgICAgIGVyci5tZXNzYWdlID0gZXJyLmVycm9yTWVzc2FnZTtcclxuICAgIH1cclxuICBcclxuICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJlYWRTdHJ1Y3R1cmUoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gV2hhdCBhbiBvZGQgdXNlIGNhc2UgLSBwZXJoYXBzIHRoZSB1c2VyIGhhZCBzd2l0Y2hlZCBnYW1lTW9kZXMgb3JcclxuICAgICAgLy8gIGV2ZW4gZGVsZXRlZCBoaXMgcHJvZmlsZSBkdXJpbmcgdGhlIHByZS1zb3J0IGZ1bmN0aW9uYWxpdHkgP1xyXG4gICAgICAvLyAgT2RkIGJ1dCBwbGF1c2libGUgSSBzdXBwb3NlID9cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9XHJcbiAgXHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICBjb25zdCBpbmkgPSBhd2FpdCBwYXJzZXIucmVhZChmaWxlUGF0aCk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluaSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgd3JpdGVUb01vZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlcihuZXcgV2luYXBpRm9ybWF0KCkpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpO1xyXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgICAgY29uc3QgaW5pID0gYXdhaXQgcGFyc2VyLnJlYWQoZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBzdHJ1Y3QgPSBPYmplY3Qua2V5cyh0aGlzLm1JbmlTdHJ1Y3QpLnNvcnQoKGEsIGIpID0+IHRoaXMubUluaVN0cnVjdFthXS5Qcmlvcml0eSAtIHRoaXMubUluaVN0cnVjdFtiXS5Qcmlvcml0eSk7XHJcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIHN0cnVjdCkge1xyXG4gICAgICAgIGlmICh0aGlzLm1JbmlTdHJ1Y3Q/LltrZXldPy5FbmFibGVkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIC8vIEl0J3MgcG9zc2libGUgZm9yIHRoZSB1c2VyIHRvIHJ1biBtdWx0aXBsZSBvcGVyYXRpb25zIGF0IG9uY2UsXHJcbiAgICAgICAgICAvLyAgY2F1c2luZyB0aGUgc3RhdGljIGluaSBzdHJ1Y3R1cmUgdG8gYmUgbW9kaWZpZWRcclxuICAgICAgICAgIC8vICBlbHNld2hlcmUgd2hpbGUgd2UncmUgYXR0ZW1wdGluZyB0byB3cml0ZSB0byBmaWxlLiBUaGUgdXNlciBtdXN0J3ZlIGJlZW5cclxuICAgICAgICAgIC8vICBtb2RpZnlpbmcgdGhlIGxvYWQgb3JkZXIgd2hpbGUgZGVwbG95aW5nLiBUaGlzIHNob3VsZFxyXG4gICAgICAgICAgLy8gIG1ha2Ugc3VyZSB3ZSBkb24ndCBhdHRlbXB0IHRvIHdyaXRlIGFueSBpbnZhbGlkIG1vZCBlbnRyaWVzLlxyXG4gICAgICAgICAgLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvODQzN1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbmkuZGF0YVtrZXldID0ge1xyXG4gICAgICAgICAgRW5hYmxlZDogdGhpcy5tSW5pU3RydWN0W2tleV0uRW5hYmxlZCxcclxuICAgICAgICAgIFByaW9yaXR5OiB0aGlzLm1JbmlTdHJ1Y3Rba2V5XS5Qcmlvcml0eSxcclxuICAgICAgICAgIFZLOiB0aGlzLm1JbmlTdHJ1Y3Rba2V5XS5WSyxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IHBhcnNlci53cml0ZShmaWxlUGF0aCwgaW5pKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgcmV0dXJuIChlcnIucGF0aCAhPT0gdW5kZWZpbmVkICYmIFsnRVBFUk0nLCAnRUJVU1knXS5pbmNsdWRlcyhlcnIuY29kZSkpXHJcbiAgICAgICAgPyBQcm9taXNlLnJlamVjdChuZXcgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcihlcnIucGF0aCkpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpXHJcbiAgICB9IFxyXG4gIH1cclxufSJdfQ==