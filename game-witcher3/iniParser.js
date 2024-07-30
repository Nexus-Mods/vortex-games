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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const vortex_parse_ini_1 = __importStar(require("vortex-parse-ini"));
const vortex_api_1 = require("vortex-api");
const util_1 = require("./util");
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
        this.mPriorityManager = priorityManager();
    }
    getIniStructure() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mIniStruct;
        });
    }
    setINIStruct(loadOrder) {
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
                var _a;
                let name;
                let key;
                if (typeof (mod) === 'object' && !!mod) {
                    name = mod.name;
                    key = mod.id;
                }
                else {
                    name = mod;
                    key = mod;
                }
                const LOEntry = (loadOrder || []).find(iter => iter.modId === key);
                const idxOfEntry = (loadOrder || []).findIndex(iter => iter.name === name || iter.modId === key);
                if (idx === 0) {
                    (_a = this.mPriorityManager) === null || _a === void 0 ? void 0 : _a.resetMaxPriority(totalLocked.length);
                }
                accum[name] = {
                    Enabled: (LOEntry !== undefined) ? LOEntry.enabled ? 1 : 0 : 1,
                    Priority: totalLocked.includes(name)
                        ? totalLocked.indexOf(name) + 1
                        : idxOfEntry === -1
                            ? loadOrder.length + 1
                            : idxOfEntry + totalLocked.length,
                    VK: key,
                };
                return accum;
            }, {});
            this.resolveDuplicates();
            return this.writeToModSettings();
        });
    }
    resolveDuplicates() {
        const findDuplicate = (key, vk) => Object.keys(this.mIniStruct).find((k) => k !== key && !k.startsWith('dlc') && this.mIniStruct[k].VK === vk);
        this.mIniStruct = Object.entries(this.mIniStruct).reduce((accum, iter) => {
            const [key, value] = iter;
            if (key === (value === null || value === void 0 ? void 0 : value['VK'])) {
                accum[key] = value;
            }
            else {
                const dup = findDuplicate(key, value === null || value === void 0 ? void 0 : value['VK']);
                if (!dup) {
                    accum[key] = value;
                }
            }
            return accum;
        }, {});
    }
    revertLOFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const profile = vortex_api_1.selectors.activeProfile(state);
            if (!!profile && (profile.gameId === common_1.GAME_ID)) {
                const manuallyAdded = yield (0, util_1.getManuallyAddedMods)(this.mApi);
                if (manuallyAdded.length > 0) {
                    const newStruct = {};
                    manuallyAdded.forEach((mod, idx) => {
                        newStruct[mod] = {
                            Enabled: 1,
                            Priority: idx + 1,
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
                    yield vortex_api_1.fs.removeAsync(filePath).catch(err => (err.code !== 'ENOENT')
                        ? this.mApi.showErrorNotification('Failed to cleanup load order file', err)
                        : null);
                    (0, util_1.forceRefresh)(this.mApi);
                    return Promise.resolve();
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
            return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(filePath))
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
                return Promise.resolve(null);
            }
            const filePath = (0, common_1.getLoadOrderFilePath)();
            const parser = new vortex_parse_ini_1.default(new vortex_parse_ini_1.WinapiFormat());
            const ini = yield parser.read(filePath);
            const keys = Object.keys(ini.data);
            const data = Object.entries(ini.data).reduce((accum, [key, value]) => {
                if (key.startsWith('dlc')) {
                    const hasPrimary = keys.find((k) => !k.startsWith('dlc') && ini.data[k].VK === value.VK);
                    if (hasPrimary) {
                        return accum;
                    }
                }
                accum[key] = value;
                return accum;
            }, {});
            return Promise.resolve(data);
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
                const ini = yield this.ensureModSettings();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5pUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIscUVBQW9FO0FBQ3BFLDJDQUF3RDtBQUV4RCxpQ0FBdUY7QUFHdkYscUNBQW9GO0FBRXBGLE1BQXFCLFlBQVk7SUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUF5QixFQUFFLGVBQXVDO1FBQzFGLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFO2dCQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7YUFDdEQ7WUFDRCxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUNoRTtRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBSUQsWUFBWSxHQUF3QixFQUFFLGVBQXNDO1FBSHBFLGVBQVUsR0FBRyxFQUFFLENBQUM7UUFJdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFWSxlQUFlOztZQUMxQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztLQUFBO0lBRVksWUFBWSxDQUFDLFNBQTBCOztZQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsaUJBQVUsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLEdBQUcsRUFBRSxD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aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBJbmlQYXJzZXIsIHsgSW5pRmlsZSwgV2luYXBpRm9ybWF0IH0gZnJvbSAndm9ydGV4LXBhcnNlLWluaSc7XHJcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBmb3JjZVJlZnJlc2gsIGlzTG9ja2VkRW50cnksIGdldEFsbE1vZHMsIGdldE1hbnVhbGx5QWRkZWRNb2RzIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvciwgZ2V0TG9hZE9yZGVyRmlsZVBhdGggfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbmlTdHJ1Y3R1cmUge1xyXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBJbmlTdHJ1Y3R1cmUgPSBudWxsO1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoYXBpPzogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyPzogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyKTogSW5pU3RydWN0dXJlIHtcclxuICAgIGlmICghSW5pU3RydWN0dXJlLmluc3RhbmNlKSB7XHJcbiAgICAgIGlmIChhcGkgPT09IHVuZGVmaW5lZCB8fCBwcmlvcml0eU1hbmFnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5pU3RydWN0dXJlIGlzIG5vdCBjb250ZXh0IGF3YXJlJyk7XHJcbiAgICAgIH1cclxuICAgICAgSW5pU3RydWN0dXJlLmluc3RhbmNlID0gbmV3IEluaVN0cnVjdHVyZShhcGksIHByaW9yaXR5TWFuYWdlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5pbnN0YW5jZTtcclxuICB9XHJcbiAgcHJpdmF0ZSBtSW5pU3RydWN0ID0ge307XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbVByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBQcmlvcml0eU1hbmFnZXIpIHtcclxuICAgIHRoaXMubUluaVN0cnVjdCA9IHt9O1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyID0gcHJpb3JpdHlNYW5hZ2VyKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZ2V0SW5pU3RydWN0dXJlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMubUluaVN0cnVjdDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBzZXRJTklTdHJ1Y3QobG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIpIHtcclxuICAgIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHModGhpcy5tQXBpKTtcclxuICAgIHRoaXMubUluaVN0cnVjdCA9IHt9O1xyXG4gICAgY29uc3QgbW9kcyA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtb2RNYXAubWFuYWdlZCwgbW9kTWFwLm1hbnVhbCk7XHJcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihpc0xvY2tlZEVudHJ5KTtcclxuICAgIGNvbnN0IG1hbmFnZWRMb2NrZWQgPSBtb2RNYXAubWFuYWdlZFxyXG4gICAgICAuZmlsdGVyKGVudHJ5ID0+IGlzTG9ja2VkRW50cnkoZW50cnkubmFtZSkpXHJcbiAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSk7XHJcbiAgICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQsIG1hbmFnZWRMb2NrZWQpO1xyXG4gICAgdGhpcy5tSW5pU3RydWN0ID0gbW9kcy5yZWR1Y2UoKGFjY3VtLCBtb2QsIGlkeCkgPT4ge1xyXG4gICAgICBsZXQgbmFtZTtcclxuICAgICAgbGV0IGtleTtcclxuICAgICAgaWYgKHR5cGVvZihtb2QpID09PSAnb2JqZWN0JyAmJiAhIW1vZCkge1xyXG4gICAgICAgIG5hbWUgPSBtb2QubmFtZTtcclxuICAgICAgICBrZXkgPSBtb2QuaWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZDtcclxuICAgICAgICBrZXkgPSBtb2Q7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IExPRW50cnkgPSAobG9hZE9yZGVyIHx8IFtdKS5maW5kKGl0ZXIgPT4gaXRlci5tb2RJZCA9PT0ga2V5KTtcclxuICAgICAgY29uc3QgaWR4T2ZFbnRyeSA9IChsb2FkT3JkZXIgfHwgW10pLmZpbmRJbmRleChpdGVyID0+IGl0ZXIubmFtZSA9PT0gbmFtZSB8fCBpdGVyLm1vZElkID09PSBrZXkpO1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyPy5yZXNldE1heFByaW9yaXR5KHRvdGFsTG9ja2VkLmxlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgICAgYWNjdW1bbmFtZV0gPSB7XHJcbiAgICAgICAgLy8gVGhlIElOSSBmaWxlJ3MgZW5hYmxlZCBhdHRyaWJ1dGUgZXhwZWN0cyAxIG9yIDBcclxuICAgICAgICBFbmFibGVkOiAoTE9FbnRyeSAhPT0gdW5kZWZpbmVkKSA/IExPRW50cnkuZW5hYmxlZCA/IDEgOiAwIDogMSxcclxuICAgICAgICBQcmlvcml0eTogdG90YWxMb2NrZWQuaW5jbHVkZXMobmFtZSlcclxuICAgICAgICAgID8gdG90YWxMb2NrZWQuaW5kZXhPZihuYW1lKSArIDFcclxuICAgICAgICAgIDogaWR4T2ZFbnRyeSA9PT0gLTFcclxuICAgICAgICAgICAgPyBsb2FkT3JkZXIubGVuZ3RoICsgMVxyXG4gICAgICAgICAgICA6IGlkeE9mRW50cnkgKyB0b3RhbExvY2tlZC5sZW5ndGgsXHJcbiAgICAgICAgVks6IGtleSxcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwge30pO1xyXG4gICAgdGhpcy5yZXNvbHZlRHVwbGljYXRlcygpO1xyXG4gICAgcmV0dXJuIHRoaXMud3JpdGVUb01vZFNldHRpbmdzKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlc29sdmVEdXBsaWNhdGVzKCkge1xyXG4gICAgY29uc3QgZmluZER1cGxpY2F0ZSA9IChrZXk6IHN0cmluZywgdms6IHN0cmluZykgPT4gT2JqZWN0LmtleXModGhpcy5tSW5pU3RydWN0KS5maW5kKChrKSA9PiBrICE9PSBrZXkgJiYgIWsuc3RhcnRzV2l0aCgnZGxjJykgJiYgdGhpcy5tSW5pU3RydWN0W2tdLlZLID09PSB2ayk7XHJcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSBPYmplY3QuZW50cmllcyh0aGlzLm1JbmlTdHJ1Y3QpLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcclxuICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0gaXRlcjtcclxuICAgICAgaWYgKGtleSA9PT0gdmFsdWU/LlsnVksnXSkge1xyXG4gICAgICAgIC8vIE5vdCBtYW5hZ2VkIGJ5IFZvcnRleFxyXG4gICAgICAgIGFjY3VtW2tleV0gPSB2YWx1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBkdXAgPSBmaW5kRHVwbGljYXRlKGtleSwgdmFsdWU/LlsnVksnXSk7XHJcbiAgICAgICAgaWYgKCFkdXApIHtcclxuICAgICAgICAgIGFjY3VtW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwge30pO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJldmVydExPRmlsZSgpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpKSB7XHJcbiAgICAgIGNvbnN0IG1hbnVhbGx5QWRkZWQgPSBhd2FpdCBnZXRNYW51YWxseUFkZGVkTW9kcyh0aGlzLm1BcGkpO1xyXG4gICAgICBpZiAobWFudWFsbHlBZGRlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uc3QgbmV3U3RydWN0ID0ge307XHJcbiAgICAgICAgbWFudWFsbHlBZGRlZC5mb3JFYWNoKChtb2QsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgbmV3U3RydWN0W21vZF0gPSB7XHJcbiAgICAgICAgICAgIEVuYWJsZWQ6IDEsXHJcbiAgICAgICAgICAgIFByaW9yaXR5OiBpZHggKyAxLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5tSW5pU3RydWN0ID0gbmV3U3RydWN0O1xyXG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMubW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyLCAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCkuY2F0Y2goZXJyID0+IChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICA/IHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycilcclxuICAgICAgICAgIDogbnVsbCk7XHJcbiAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kU2V0dGluZ3MoKSB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICA/IHRoaXMuY3JlYXRlTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVNb2RTZXR0aW5ncygpIHtcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAgIC8vICBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKGVpdGhlciBieSB1cyBvciB0aGUgZ2FtZSkgYnV0XHJcbiAgICAvLyAganVzdCBpbiBjYXNlIGl0IGdvdCByZW1vdmVkIHNvbWVob3csIHdlIHJlLWluc3RhdGUgaXRcclxuICAgIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKVxyXG4gICAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyOiBhbnksIGVyck1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcclxuICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkO1xyXG4gICAgaWYgKHVzZXJDYW5jZWxlZCkge1xyXG4gICAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYnVzeVJlc291cmNlID0gZXJyIGluc3RhbmNlb2YgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcjtcclxuICAgIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcclxuICAgICAgYWxsb3dSZXBvcnQgPSBlcnIuYWxsb3dSZXBvcnQ7XHJcbiAgICAgIGVyci5tZXNzYWdlID0gZXJyLmVycm9yTWVzc2FnZTtcclxuICAgIH1cclxuICBcclxuICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJlYWRTdHJ1Y3R1cmUoKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueSB9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgICB9XHJcbiAgXHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICBjb25zdCBpbmkgPSBhd2FpdCBwYXJzZXIucmVhZChmaWxlUGF0aCk7XHJcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoaW5pLmRhdGEpO1xyXG4gICAgY29uc3QgZGF0YSA9IE9iamVjdC5lbnRyaWVzKGluaS5kYXRhKS5yZWR1Y2UoKGFjY3VtLCBba2V5LCB2YWx1ZV0pID0+IHtcclxuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKCdkbGMnKSkge1xyXG4gICAgICAgIGNvbnN0IGhhc1ByaW1hcnkgPSBrZXlzLmZpbmQoKGspID0+ICFrLnN0YXJ0c1dpdGgoJ2RsYycpICYmIGluaS5kYXRhW2tdLlZLID09PSB2YWx1ZS5WSyk7XHJcbiAgICAgICAgaWYgKGhhc1ByaW1hcnkpIHtcclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYWNjdW1ba2V5XSA9IHZhbHVlO1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCB7fSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHdyaXRlVG9Nb2RTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIobmV3IFdpbmFwaUZvcm1hdCgpKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKTtcclxuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoZmlsZVBhdGgsICcnLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICAgIGNvbnN0IGluaSA9IGF3YWl0IHRoaXMuZW5zdXJlTW9kU2V0dGluZ3MoKTtcclxuICAgICAgY29uc3Qgc3RydWN0ID0gT2JqZWN0LmtleXModGhpcy5tSW5pU3RydWN0KS5zb3J0KChhLCBiKSA9PiB0aGlzLm1JbmlTdHJ1Y3RbYV0uUHJpb3JpdHkgLSB0aGlzLm1JbmlTdHJ1Y3RbYl0uUHJpb3JpdHkpO1xyXG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBzdHJ1Y3QpIHtcclxuICAgICAgICBpZiAodGhpcy5tSW5pU3RydWN0Py5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgdXNlciB0byBydW4gbXVsdGlwbGUgb3BlcmF0aW9ucyBhdCBvbmNlLFxyXG4gICAgICAgICAgLy8gIGNhdXNpbmcgdGhlIHN0YXRpYyBpbmkgc3RydWN0dXJlIHRvIGJlIG1vZGlmaWVkXHJcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXHJcbiAgICAgICAgICAvLyAgbW9kaWZ5aW5nIHRoZSBsb2FkIG9yZGVyIHdoaWxlIGRlcGxveWluZy4gVGhpcyBzaG91bGRcclxuICAgICAgICAgIC8vICBtYWtlIHN1cmUgd2UgZG9uJ3QgYXR0ZW1wdCB0byB3cml0ZSBhbnkgaW52YWxpZCBtb2QgZW50cmllcy5cclxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcclxuICAgICAgICAgIEVuYWJsZWQ6IHRoaXMubUluaVN0cnVjdFtrZXldLkVuYWJsZWQsXHJcbiAgICAgICAgICBQcmlvcml0eTogdGhpcy5tSW5pU3RydWN0W2tleV0uUHJpb3JpdHksXHJcbiAgICAgICAgICBWSzogdGhpcy5tSW5pU3RydWN0W2tleV0uVkssXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBwYXJzZXIud3JpdGUoZmlsZVBhdGgsIGluaSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgIHJldHVybiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxyXG4gICAgICAgID8gUHJvbWlzZS5yZWplY3QobmV3IFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IoZXJyLnBhdGgpKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKVxyXG4gICAgfSBcclxuICB9XHJcbn0iXX0=