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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5pUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIscUVBQTJEO0FBQzNELDJDQUF3RDtBQUV4RCxpQ0FBdUY7QUFHdkYsNkNBQXNEO0FBRXRELHFDQUEyRTtBQUUzRSxNQUFxQixZQUFZO0lBRXhCLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBeUIsRUFBRSxlQUFpQztRQUNwRixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRTtZQUMxQixJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRTtnQkFDdEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO2FBQ3REO1lBQ0QsWUFBWSxDQUFDLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUM7U0FDaEU7UUFFRCxPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDL0IsQ0FBQztJQUlELFlBQVksR0FBd0IsRUFBRSxlQUFnQztRQUg5RCxlQUFVLEdBQUcsRUFBRSxDQUFDO1FBSXRCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7SUFDMUMsQ0FBQztJQUVZLGVBQWU7O1lBQzFCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN6QixDQUFDO0tBQUE7SUFFWSxZQUFZLENBQUMsU0FBMEIsRUFBRSxlQUFnQzs7WUFDcEYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGlCQUFVLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLE1B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Q0FBQyxDQUFDLEVBQUU7cUJBQzVCLENBQUM7aUJBQ0g7Z0JBQ0QsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDMUI7WUFBQyxPQUFNLEdBQUcsRUFBRTtnQkFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdEUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxrQ0FBeUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pELENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ3hCOztLQUNGOztBQW5MSCwrQkFvTEM7QUFuTGdCLHFCQUFRLEdBQWlCLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgSW5pUGFyc2VyLCB7IFdpbmFwaUZvcm1hdCB9IGZyb20gJ3ZvcnRleC1wYXJzZS1pbmknO1xyXG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgZm9yY2VSZWZyZXNoLCBpc0xvY2tlZEVudHJ5LCBnZXRBbGxNb2RzLCBnZXRNYW51YWxseUFkZGVkTW9kcyB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvciwgZ2V0TG9hZE9yZGVyRmlsZVBhdGggfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbmlTdHJ1Y3R1cmUge1xyXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBJbmlTdHJ1Y3R1cmUgPSBudWxsO1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoYXBpPzogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyPzogUHJpb3JpdHlNYW5hZ2VyKTogSW5pU3RydWN0dXJlIHtcclxuICAgIGlmICghSW5pU3RydWN0dXJlLmluc3RhbmNlKSB7XHJcbiAgICAgIGlmIChhcGkgPT09IHVuZGVmaW5lZCB8fCBwcmlvcml0eU1hbmFnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5pU3RydWN0dXJlIGlzIG5vdCBjb250ZXh0IGF3YXJlJyk7XHJcbiAgICAgIH1cclxuICAgICAgSW5pU3RydWN0dXJlLmluc3RhbmNlID0gbmV3IEluaVN0cnVjdHVyZShhcGksIHByaW9yaXR5TWFuYWdlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5pbnN0YW5jZTtcclxuICB9XHJcbiAgcHJpdmF0ZSBtSW5pU3RydWN0ID0ge307XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbVByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXIpIHtcclxuICAgIHRoaXMubUluaVN0cnVjdCA9IHt9O1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyID0gcHJpb3JpdHlNYW5hZ2VyO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGdldEluaVN0cnVjdHVyZSgpIHtcclxuICAgIHJldHVybiB0aGlzLm1JbmlTdHJ1Y3Q7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2V0SU5JU3RydWN0KGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcikge1xyXG4gICAgY29uc3QgbW9kTWFwID0gYXdhaXQgZ2V0QWxsTW9kcyh0aGlzLm1BcGkpO1xyXG4gICAgdGhpcy5tSW5pU3RydWN0ID0ge307XHJcbiAgICBjb25zdCBtb2RzID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1vZE1hcC5tYW5hZ2VkLCBtb2RNYXAubWFudWFsKTtcclxuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKGlzTG9ja2VkRW50cnkpO1xyXG4gICAgY29uc3QgbWFuYWdlZExvY2tlZCA9IG1vZE1hcC5tYW5hZ2VkXHJcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gaXNMb2NrZWRFbnRyeShlbnRyeS5uYW1lKSlcclxuICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKTtcclxuICAgIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCwgbWFuYWdlZExvY2tlZCk7XHJcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSBtb2RzLnJlZHVjZSgoYWNjdW0sIG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgIGxldCBuYW1lO1xyXG4gICAgICBsZXQga2V5O1xyXG4gICAgICBpZiAodHlwZW9mKG1vZCkgPT09ICdvYmplY3QnICYmIG1vZCAhPT0gbnVsbCkge1xyXG4gICAgICAgIG5hbWUgPSBtb2QubmFtZTtcclxuICAgICAgICBrZXkgPSBtb2QuaWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZDtcclxuICAgICAgICBrZXkgPSBtb2Q7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IExPRW50cnkgPSAobG9hZE9yZGVyIHx8IFtdKS5maW5kKGl0ZXIgPT4gaXRlci5tb2RJZCA9PT0ga2V5KTtcclxuICAgICAgY29uc3QgaWR4T2ZFbnRyeSA9IChsb2FkT3JkZXIgfHwgW10pLmZpbmRJbmRleChpdGVyID0+IGl0ZXIubW9kSWQgPT09IGtleSk7XHJcbiAgICAgIGlmIChpZHggPT09IDApIHtcclxuICAgICAgICBwcmlvcml0eU1hbmFnZXI/LnJlc2V0TWF4UHJpb3JpdHkodG90YWxMb2NrZWQubGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgICBhY2N1bVtuYW1lXSA9IHtcclxuICAgICAgICAvLyBUaGUgSU5JIGZpbGUncyBlbmFibGVkIGF0dHJpYnV0ZSBleHBlY3RzIDEgb3IgMFxyXG4gICAgICAgIEVuYWJsZWQ6IChMT0VudHJ5ICE9PSB1bmRlZmluZWQpID8gTE9FbnRyeS5lbmFibGVkID8gMSA6IDAgOiAxLFxyXG4gICAgICAgIFByaW9yaXR5OiB0b3RhbExvY2tlZC5pbmNsdWRlcyhuYW1lKSA/IHRvdGFsTG9ja2VkLmluZGV4T2YobmFtZSkgKyAxIDogaWR4T2ZFbnRyeSArIDEsXHJcbiAgICAgICAgVks6IGtleSxcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwge30pO1xyXG4gICAgcmV0dXJuIHRoaXMud3JpdGVUb01vZFNldHRpbmdzKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgcmV2ZXJ0TE9GaWxlKCkge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoISFwcm9maWxlICYmIChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkpIHtcclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcih0aGlzLm1BcGkpO1xyXG4gICAgICBjb25zdCBtYW51YWxseUFkZGVkID0gYXdhaXQgZ2V0TWFudWFsbHlBZGRlZE1vZHModGhpcy5tQXBpKTtcclxuICAgICAgaWYgKG1hbnVhbGx5QWRkZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IG5ld1N0cnVjdCA9IHt9O1xyXG4gICAgICAgIG1hbnVhbGx5QWRkZWQuZm9yRWFjaCgobW9kLCBpZHgpID0+IHtcclxuICAgICAgICAgIG5ld1N0cnVjdFttb2RdID0ge1xyXG4gICAgICAgICAgICBFbmFibGVkOiAxLFxyXG4gICAgICAgICAgICBQcmlvcml0eTogKChsb2FkT3JkZXIgIT09IHVuZGVmaW5lZCAmJiAhIWxvYWRPcmRlclttb2RdKVxyXG4gICAgICAgICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW21vZF0/LmRhdGE/LnByZWZpeCwgMTApIDogaWR4KSArIDEsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLm1JbmlTdHJ1Y3QgPSBuZXdTdHJ1Y3Q7XHJcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZVRvTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBmb3JjZVJlZnJlc2godGhpcy5tQXBpKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gdGhpcy5tb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihlcnIsICdGYWlsZWQgdG8gY2xlYW51cCBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgICAgIGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICAgIDogdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJywgZXJyKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBlbnN1cmVNb2RTZXR0aW5ncygpIHtcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIobmV3IFdpbmFwaUZvcm1hdCgpKTtcclxuICAgIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXHJcbiAgICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgID8gdGhpcy5jcmVhdGVNb2RTZXR0aW5ncygpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU1vZFNldHRpbmdzKCkge1xyXG4gICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgLy8gVGhlb3JldGljYWxseSB0aGUgV2l0Y2hlciAzIGRvY3VtZW50cyBwYXRoIHNob3VsZCBiZVxyXG4gICAgLy8gIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoZWl0aGVyIGJ5IHVzIG9yIHRoZSBnYW1lKSBidXRcclxuICAgIC8vICBqdXN0IGluIGNhc2UgaXQgZ290IHJlbW92ZWQgc29tZWhvdywgd2UgcmUtaW5zdGF0ZSBpdFxyXG4gICAgLy8gIHlldCBhZ2Fpbi4uLiBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzcwNThcclxuICAgIHJldHVybiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShmaWxlUGF0aCkpXHJcbiAgICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihlcnI6IGFueSwgZXJyTWVzc2FnZTogc3RyaW5nKSB7XHJcbiAgICBsZXQgYWxsb3dSZXBvcnQgPSB0cnVlO1xyXG4gICAgY29uc3QgdXNlckNhbmNlbGVkID0gZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQ7XHJcbiAgICBpZiAodXNlckNhbmNlbGVkKSB7XHJcbiAgICAgIGFsbG93UmVwb3J0ID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBjb25zdCBidXN5UmVzb3VyY2UgPSBlcnIgaW5zdGFuY2VvZiBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yO1xyXG4gICAgaWYgKGFsbG93UmVwb3J0ICYmIGJ1c3lSZXNvdXJjZSkge1xyXG4gICAgICBhbGxvd1JlcG9ydCA9IGVyci5hbGxvd1JlcG9ydDtcclxuICAgICAgZXJyLm1lc3NhZ2UgPSBlcnIuZXJyb3JNZXNzYWdlO1xyXG4gICAgfVxyXG4gIFxyXG4gICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJNZXNzYWdlLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgcmVhZFN0cnVjdHVyZSgpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBXaGF0IGFuIG9kZCB1c2UgY2FzZSAtIHBlcmhhcHMgdGhlIHVzZXIgaGFkIHN3aXRjaGVkIGdhbWVNb2RlcyBvclxyXG4gICAgICAvLyAgZXZlbiBkZWxldGVkIGhpcyBwcm9maWxlIGR1cmluZyB0aGUgcHJlLXNvcnQgZnVuY3Rpb25hbGl0eSA/XHJcbiAgICAgIC8vICBPZGQgYnV0IHBsYXVzaWJsZSBJIHN1cHBvc2UgP1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH1cclxuICBcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIobmV3IFdpbmFwaUZvcm1hdCgpKTtcclxuICAgIGNvbnN0IGluaSA9IGF3YWl0IHBhcnNlci5yZWFkKGZpbGVQYXRoKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5pKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyB3cml0ZVRvTW9kU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCk7XHJcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICBjb25zdCBpbmkgPSBhd2FpdCBwYXJzZXIucmVhZChmaWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IHN0cnVjdCA9IE9iamVjdC5rZXlzKHRoaXMubUluaVN0cnVjdCkuc29ydCgoYSwgYikgPT4gdGhpcy5tSW5pU3RydWN0W2FdLlByaW9yaXR5IC0gdGhpcy5tSW5pU3RydWN0W2JdLlByaW9yaXR5KTtcclxuICAgICAgZm9yIChjb25zdCBrZXkgb2Ygc3RydWN0KSB7XHJcbiAgICAgICAgaWYgKHRoaXMubUluaVN0cnVjdD8uW2tleV0/LkVuYWJsZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIHVzZXIgdG8gcnVuIG11bHRpcGxlIG9wZXJhdGlvbnMgYXQgb25jZSxcclxuICAgICAgICAgIC8vICBjYXVzaW5nIHRoZSBzdGF0aWMgaW5pIHN0cnVjdHVyZSB0byBiZSBtb2RpZmllZFxyXG4gICAgICAgICAgLy8gIGVsc2V3aGVyZSB3aGlsZSB3ZSdyZSBhdHRlbXB0aW5nIHRvIHdyaXRlIHRvIGZpbGUuIFRoZSB1c2VyIG11c3QndmUgYmVlblxyXG4gICAgICAgICAgLy8gIG1vZGlmeWluZyB0aGUgbG9hZCBvcmRlciB3aGlsZSBkZXBsb3lpbmcuIFRoaXMgc2hvdWxkXHJcbiAgICAgICAgICAvLyAgbWFrZSBzdXJlIHdlIGRvbid0IGF0dGVtcHQgdG8gd3JpdGUgYW55IGludmFsaWQgbW9kIGVudHJpZXMuXHJcbiAgICAgICAgICAvLyAgaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy84NDM3XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluaS5kYXRhW2tleV0gPSB7XHJcbiAgICAgICAgICBFbmFibGVkOiB0aGlzLm1JbmlTdHJ1Y3Rba2V5XS5FbmFibGVkLFxyXG4gICAgICAgICAgUHJpb3JpdHk6IHRoaXMubUluaVN0cnVjdFtrZXldLlByaW9yaXR5LFxyXG4gICAgICAgICAgVks6IHRoaXMubUluaVN0cnVjdFtrZXldLlZLLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgcGFyc2VyLndyaXRlKGZpbGVQYXRoLCBpbmkpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9IGNhdGNoKGVycikge1xyXG4gICAgICByZXR1cm4gKGVyci5wYXRoICE9PSB1bmRlZmluZWQgJiYgWydFUEVSTScsICdFQlVTWSddLmluY2x1ZGVzKGVyci5jb2RlKSlcclxuICAgICAgICA/IFByb21pc2UucmVqZWN0KG5ldyBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yKGVyci5wYXRoKSlcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycilcclxuICAgIH0gXHJcbiAgfVxyXG59Il19