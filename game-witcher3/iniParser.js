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
            return this.writeToModSettings();
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5pUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIscUVBQW9FO0FBQ3BFLDJDQUF3RDtBQUV4RCxpQ0FBdUY7QUFHdkYscUNBQW9GO0FBRXBGLE1BQXFCLFlBQVk7SUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUF5QixFQUFFLGVBQXVDO1FBQzFGLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFO2dCQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7YUFDdEQ7WUFDRCxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUNoRTtRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBSUQsWUFBWSxHQUF3QixFQUFFLGVBQXNDO1FBSHBFLGVBQVUsR0FBRyxFQUFFLENBQUM7UUFJdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFWSxlQUFlOztZQUMxQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztLQUFBO0lBRVksWUFBWSxDQUFDLFNBQTBCOztZQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsaUJBQVUsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLEdBQUcsRUFBRSxD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RUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDMUI7WUFBQyxPQUFNLEdBQUcsRUFBRTtnQkFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdEUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxrQ0FBeUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pELENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ3hCOztLQUNGOztBQW5MSCwrQkFvTEM7QUFuTGdCLHFCQUFRLEdBQWlCLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgSW5pUGFyc2VyLCB7IEluaUZpbGUsIFdpbmFwaUZvcm1hdCB9IGZyb20gJ3ZvcnRleC1wYXJzZS1pbmknO1xyXG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgZm9yY2VSZWZyZXNoLCBpc0xvY2tlZEVudHJ5LCBnZXRBbGxNb2RzLCBnZXRNYW51YWxseUFkZGVkTW9kcyB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IsIGdldExvYWRPcmRlckZpbGVQYXRoIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5pU3RydWN0dXJlIHtcclxuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogSW5pU3RydWN0dXJlID0gbnVsbDtcclxuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKGFwaT86IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcj86ICgpID0+IFByaW9yaXR5TWFuYWdlcik6IEluaVN0cnVjdHVyZSB7XHJcbiAgICBpZiAoIUluaVN0cnVjdHVyZS5pbnN0YW5jZSkge1xyXG4gICAgICBpZiAoYXBpID09PSB1bmRlZmluZWQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luaVN0cnVjdHVyZSBpcyBub3QgY29udGV4dCBhd2FyZScpO1xyXG4gICAgICB9XHJcbiAgICAgIEluaVN0cnVjdHVyZS5pbnN0YW5jZSA9IG5ldyBJbmlTdHJ1Y3R1cmUoYXBpLCBwcmlvcml0eU1hbmFnZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBJbmlTdHJ1Y3R1cmUuaW5zdGFuY2U7XHJcbiAgfVxyXG4gIHByaXZhdGUgbUluaVN0cnVjdCA9IHt9O1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Qcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyKSB7XHJcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSB7fTtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubVByaW9yaXR5TWFuYWdlciA9IHByaW9yaXR5TWFuYWdlcigpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGdldEluaVN0cnVjdHVyZSgpIHtcclxuICAgIHJldHVybiB0aGlzLm1JbmlTdHJ1Y3Q7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2V0SU5JU3RydWN0KGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKSB7XHJcbiAgICBjb25zdCBtb2RNYXAgPSBhd2FpdCBnZXRBbGxNb2RzKHRoaXMubUFwaSk7XHJcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSB7fTtcclxuICAgIGNvbnN0IG1vZHMgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbW9kTWFwLm1hbmFnZWQsIG1vZE1hcC5tYW51YWwpO1xyXG4gICAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIoaXNMb2NrZWRFbnRyeSk7XHJcbiAgICBjb25zdCBtYW5hZ2VkTG9ja2VkID0gbW9kTWFwLm1hbmFnZWRcclxuICAgICAgLmZpbHRlcihlbnRyeSA9PiBpc0xvY2tlZEVudHJ5KGVudHJ5Lm5hbWUpKVxyXG4gICAgICAubWFwKGVudHJ5ID0+IGVudHJ5Lm5hbWUpO1xyXG4gICAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkLCBtYW5hZ2VkTG9ja2VkKTtcclxuICAgIHRoaXMubUluaVN0cnVjdCA9IG1vZHMucmVkdWNlKChhY2N1bSwgbW9kLCBpZHgpID0+IHtcclxuICAgICAgbGV0IG5hbWU7XHJcbiAgICAgIGxldCBrZXk7XHJcbiAgICAgIGlmICh0eXBlb2YobW9kKSA9PT0gJ29iamVjdCcgJiYgISFtb2QpIHtcclxuICAgICAgICBuYW1lID0gbW9kLm5hbWU7XHJcbiAgICAgICAga2V5ID0gbW9kLmlkO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5hbWUgPSBtb2Q7XHJcbiAgICAgICAga2V5ID0gbW9kO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBMT0VudHJ5ID0gKGxvYWRPcmRlciB8fCBbXSkuZmluZChpdGVyID0+IGl0ZXIubW9kSWQgPT09IGtleSk7XHJcbiAgICAgIGNvbnN0IGlkeE9mRW50cnkgPSAobG9hZE9yZGVyIHx8IFtdKS5maW5kSW5kZXgoaXRlciA9PiBpdGVyLm5hbWUgPT09IG5hbWUgfHwgaXRlci5tb2RJZCA9PT0ga2V5KTtcclxuICAgICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICAgIHRoaXMubVByaW9yaXR5TWFuYWdlcj8ucmVzZXRNYXhQcmlvcml0eSh0b3RhbExvY2tlZC5sZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICAgIGFjY3VtW25hbWVdID0ge1xyXG4gICAgICAgIC8vIFRoZSBJTkkgZmlsZSdzIGVuYWJsZWQgYXR0cmlidXRlIGV4cGVjdHMgMSBvciAwXHJcbiAgICAgICAgRW5hYmxlZDogKExPRW50cnkgIT09IHVuZGVmaW5lZCkgPyBMT0VudHJ5LmVuYWJsZWQgPyAxIDogMCA6IDEsXHJcbiAgICAgICAgUHJpb3JpdHk6IHRvdGFsTG9ja2VkLmluY2x1ZGVzKG5hbWUpXHJcbiAgICAgICAgICA/IHRvdGFsTG9ja2VkLmluZGV4T2YobmFtZSkgKyAxXHJcbiAgICAgICAgICA6IGlkeE9mRW50cnkgPT09IC0xXHJcbiAgICAgICAgICAgID8gbG9hZE9yZGVyLmxlbmd0aCArIDFcclxuICAgICAgICAgICAgOiBpZHhPZkVudHJ5ICsgdG90YWxMb2NrZWQubGVuZ3RoLFxyXG4gICAgICAgIFZLOiBrZXksXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIHt9KTtcclxuICAgIHJldHVybiB0aGlzLndyaXRlVG9Nb2RTZXR0aW5ncygpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJldmVydExPRmlsZSgpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpKSB7XHJcbiAgICAgIGNvbnN0IG1hbnVhbGx5QWRkZWQgPSBhd2FpdCBnZXRNYW51YWxseUFkZGVkTW9kcyh0aGlzLm1BcGkpO1xyXG4gICAgICBpZiAobWFudWFsbHlBZGRlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uc3QgbmV3U3RydWN0ID0ge307XHJcbiAgICAgICAgbWFudWFsbHlBZGRlZC5mb3JFYWNoKChtb2QsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgbmV3U3RydWN0W21vZF0gPSB7XHJcbiAgICAgICAgICAgIEVuYWJsZWQ6IDEsXHJcbiAgICAgICAgICAgIFByaW9yaXR5OiBpZHggKyAxLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5tSW5pU3RydWN0ID0gbmV3U3RydWN0O1xyXG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMubW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyLCAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCkuY2F0Y2goZXJyID0+IChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICA/IHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycilcclxuICAgICAgICAgIDogbnVsbCk7XHJcbiAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kU2V0dGluZ3MoKSB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICA/IHRoaXMuY3JlYXRlTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVNb2RTZXR0aW5ncygpIHtcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAgIC8vICBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKGVpdGhlciBieSB1cyBvciB0aGUgZ2FtZSkgYnV0XHJcbiAgICAvLyAganVzdCBpbiBjYXNlIGl0IGdvdCByZW1vdmVkIHNvbWVob3csIHdlIHJlLWluc3RhdGUgaXRcclxuICAgIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKVxyXG4gICAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyOiBhbnksIGVyck1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcclxuICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkO1xyXG4gICAgaWYgKHVzZXJDYW5jZWxlZCkge1xyXG4gICAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYnVzeVJlc291cmNlID0gZXJyIGluc3RhbmNlb2YgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcjtcclxuICAgIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcclxuICAgICAgYWxsb3dSZXBvcnQgPSBlcnIuYWxsb3dSZXBvcnQ7XHJcbiAgICAgIGVyci5tZXNzYWdlID0gZXJyLmVycm9yTWVzc2FnZTtcclxuICAgIH1cclxuICBcclxuICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHJlYWRTdHJ1Y3R1cmUoKTogUHJvbWlzZTxJbmlGaWxlPG9iamVjdD4+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuICAgIH1cclxuICBcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIobmV3IFdpbmFwaUZvcm1hdCgpKTtcclxuICAgIGNvbnN0IGluaSA9IGF3YWl0IHBhcnNlci5yZWFkKGZpbGVQYXRoKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5pKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyB3cml0ZVRvTW9kU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCk7XHJcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICBjb25zdCBpbmkgPSBhd2FpdCBwYXJzZXIucmVhZChmaWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IHN0cnVjdCA9IE9iamVjdC5rZXlzKHRoaXMubUluaVN0cnVjdCkuc29ydCgoYSwgYikgPT4gdGhpcy5tSW5pU3RydWN0W2FdLlByaW9yaXR5IC0gdGhpcy5tSW5pU3RydWN0W2JdLlByaW9yaXR5KTtcclxuICAgICAgZm9yIChjb25zdCBrZXkgb2Ygc3RydWN0KSB7XHJcbiAgICAgICAgaWYgKHRoaXMubUluaVN0cnVjdD8uW2tleV0/LkVuYWJsZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIHVzZXIgdG8gcnVuIG11bHRpcGxlIG9wZXJhdGlvbnMgYXQgb25jZSxcclxuICAgICAgICAgIC8vICBjYXVzaW5nIHRoZSBzdGF0aWMgaW5pIHN0cnVjdHVyZSB0byBiZSBtb2RpZmllZFxyXG4gICAgICAgICAgLy8gIGVsc2V3aGVyZSB3aGlsZSB3ZSdyZSBhdHRlbXB0aW5nIHRvIHdyaXRlIHRvIGZpbGUuIFRoZSB1c2VyIG11c3QndmUgYmVlblxyXG4gICAgICAgICAgLy8gIG1vZGlmeWluZyB0aGUgbG9hZCBvcmRlciB3aGlsZSBkZXBsb3lpbmcuIFRoaXMgc2hvdWxkXHJcbiAgICAgICAgICAvLyAgbWFrZSBzdXJlIHdlIGRvbid0IGF0dGVtcHQgdG8gd3JpdGUgYW55IGludmFsaWQgbW9kIGVudHJpZXMuXHJcbiAgICAgICAgICAvLyAgaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy84NDM3XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluaS5kYXRhW2tleV0gPSB7XHJcbiAgICAgICAgICBFbmFibGVkOiB0aGlzLm1JbmlTdHJ1Y3Rba2V5XS5FbmFibGVkLFxyXG4gICAgICAgICAgUHJpb3JpdHk6IHRoaXMubUluaVN0cnVjdFtrZXldLlByaW9yaXR5LFxyXG4gICAgICAgICAgVks6IHRoaXMubUluaVN0cnVjdFtrZXldLlZLLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgcGFyc2VyLndyaXRlKGZpbGVQYXRoLCBpbmkpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9IGNhdGNoKGVycikge1xyXG4gICAgICByZXR1cm4gKGVyci5wYXRoICE9PSB1bmRlZmluZWQgJiYgWydFUEVSTScsICdFQlVTWSddLmluY2x1ZGVzKGVyci5jb2RlKSlcclxuICAgICAgICA/IFByb21pc2UucmVqZWN0KG5ldyBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yKGVyci5wYXRoKSlcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycilcclxuICAgIH0gXHJcbiAgfVxyXG59Il19