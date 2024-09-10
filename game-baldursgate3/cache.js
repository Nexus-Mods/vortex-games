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
const path = __importStar(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const divineWrapper_1 = require("./divineWrapper");
const util_1 = require("./util");
const lru_cache_1 = __importDefault(require("lru-cache"));
class PakInfoCache {
    static getInstance(api) {
        if (!PakInfoCache.instance) {
            PakInfoCache.instance = new PakInfoCache(api);
        }
        return PakInfoCache.instance;
    }
    constructor(api) {
        this.mApi = api;
        this.mCache = new lru_cache_1.default({ max: 700 });
        this.load(api);
    }
    getCacheEntry(api, filePath, mod) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.fileId(filePath);
            const stat = yield vortex_api_1.fs.statAsync(filePath);
            const ctime = stat.ctimeMs;
            const hasChanged = (entry) => {
                var _a, _b;
                return (!!mod && !!entry.mod)
                    ? ((_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.fileId) !== ((_b = entry.mod.attributes) === null || _b === void 0 ? void 0 : _b.fileId)
                    : ctime !== (entry === null || entry === void 0 ? void 0 : entry.lastModified);
            };
            const cacheEntry = yield this.mCache.get(id);
            const packageNotListed = ((cacheEntry === null || cacheEntry === void 0 ? void 0 : cacheEntry.packageList) || []).length === 0;
            if (!cacheEntry || hasChanged(cacheEntry) || packageNotListed) {
                const packageList = yield (0, divineWrapper_1.listPackage)(api, filePath);
                const isListed = this.isLOListed(api, filePath, packageList);
                const info = yield (0, util_1.extractPakInfoImpl)(api, filePath, mod, isListed);
                this.mCache.set(id, {
                    fileName: path.basename(filePath),
                    lastModified: ctime,
                    info,
                    packageList,
                    mod,
                    isListed,
                });
            }
            return this.mCache.get(id);
        });
    }
    reset() {
        this.mCache = new lru_cache_1.default({ max: 700 });
        this.save();
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.mCache) {
                return;
            }
            const state = this.mApi.getState();
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const cachePath = path.join(path.dirname(staging), 'cache', profileId + '.json');
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(cachePath));
                yield vortex_api_1.util.writeFileAtomic(cachePath, JSON.stringify(this.mCache.dump()));
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'failed to save cache', err);
                return;
            }
        });
    }
    load(api) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = api.getState();
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const cachePath = path.join(path.dirname(staging), 'cache', profileId + '.json');
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(cachePath));
                const data = yield vortex_api_1.fs.readFileAsync(cachePath, { encoding: 'utf8' });
                this.mCache.load(JSON.parse(data));
            }
            catch (err) {
                if (!['ENOENT'].includes(err.code)) {
                    (0, vortex_api_1.log)('error', 'failed to load cache', err);
                }
            }
        });
    }
    isLOListed(api, pakPath, packageList) {
        try {
            const containsMetaFile = packageList.find(line => path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx') !== undefined ? true : false;
            return !containsMetaFile;
        }
        catch (err) {
            api.sendNotification({
                type: 'error',
                message: `${path.basename(pakPath)} couldn't be read correctly. This mod be incorrectly locked/unlocked but will default to unlocked.`,
            });
            return false;
        }
    }
    fileId(filePath) {
        return path.basename(filePath).toUpperCase();
    }
}
exports.default = PakInfoCache;
PakInfoCache.instance = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJDQUE2RDtBQUU3RCxxQ0FBbUM7QUFDbkMsbURBQThDO0FBRTlDLGlDQUFzRDtBQUV0RCwwREFBNEI7QUFhNUIsTUFBcUIsWUFBWTtJQUV4QixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQXdCO1FBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDL0M7UUFFRCxPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDL0IsQ0FBQztJQUtELFlBQVksR0FBd0I7UUFFbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLG1CQUFHLENBQXNCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBRVksYUFBYSxDQUFDLEdBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLEdBQWdCOztZQUN6QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzNCLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBa0IsRUFBRSxFQUFFOztnQkFDeEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7b0JBQzNCLENB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Q0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFHaEosT0FBTyxDQUFDLGdCQUFnQixDQUFDO1NBQzFCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ25CLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLG9HQUFvRzthQUN2SSxDQUFDLENBQUM7WUFDSCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVPLE1BQU0sQ0FBQyxRQUFnQjtRQUM3QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0MsQ0FBQzs7QUE1R0gsK0JBNkdDO0FBNUdnQixxQkFBUSxHQUFpQixJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBsaXN0UGFja2FnZSB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XHJcbmltcG9ydCB7IElQYWtJbmZvIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGV4dHJhY3RQYWtJbmZvSW1wbCwgbG9nRGVidWcgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IExSVSBmcm9tICdscnUtY2FjaGUnO1xyXG5pbXBvcnQgeyBzZXRUaW1lb3V0IH0gZnJvbSAndGltZXJzL3Byb21pc2VzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUNhY2hlRW50cnkge1xyXG4gIGxhc3RNb2RpZmllZDogbnVtYmVyO1xyXG4gIGluZm86IElQYWtJbmZvO1xyXG4gIGZpbGVOYW1lOiBzdHJpbmc7XHJcbiAgcGFja2FnZUxpc3Q6IHN0cmluZ1tdO1xyXG4gIGlzTGlzdGVkOiBib29sZWFuO1xyXG4gIG1vZD86IHR5cGVzLklNb2Q7XHJcbn1cclxuXHJcbnR5cGUgSVBha01hcCA9IExSVTxzdHJpbmcsIElDYWNoZUVudHJ5PjtcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFrSW5mb0NhY2hlIHtcclxuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogUGFrSW5mb0NhY2hlID0gbnVsbDtcclxuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFBha0luZm9DYWNoZSB7XHJcbiAgICBpZiAoIVBha0luZm9DYWNoZS5pbnN0YW5jZSkge1xyXG4gICAgICBQYWtJbmZvQ2FjaGUuaW5zdGFuY2UgPSBuZXcgUGFrSW5mb0NhY2hlKGFwaSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFBha0luZm9DYWNoZS5pbnN0YW5jZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbUNhY2hlOiBJUGFrTWFwO1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICAvLyA3MDAgc2hvdWxkIGJlIGVub3VnaCBmb3IgZXZlcnlvbmUgSSBob3BlLlxyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gICAgdGhpcy5tQ2FjaGUgPSBuZXcgTFJVPHN0cmluZywgSUNhY2hlRW50cnk+KHsgbWF4OiA3MDAgfSk7XHJcbiAgICB0aGlzLmxvYWQoYXBpKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBnZXRDYWNoZUVudHJ5KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZD86IHR5cGVzLklNb2QpOiBQcm9taXNlPElDYWNoZUVudHJ5PiB7XHJcbiAgICBjb25zdCBpZCA9IHRoaXMuZmlsZUlkKGZpbGVQYXRoKTtcclxuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpO1xyXG4gICAgY29uc3QgY3RpbWUgPSBzdGF0LmN0aW1lTXM7XHJcbiAgICBjb25zdCBoYXNDaGFuZ2VkID0gKGVudHJ5OiBJQ2FjaGVFbnRyeSkgPT4ge1xyXG4gICAgICByZXR1cm4gKCEhbW9kICYmICEhZW50cnkubW9kKVxyXG4gICAgICAgID8gbW9kLmF0dHJpYnV0ZXM/LmZpbGVJZCAhPT0gZW50cnkubW9kLmF0dHJpYnV0ZXM/LmZpbGVJZFxyXG4gICAgICAgIDogY3RpbWUgIT09IGVudHJ5Py5sYXN0TW9kaWZpZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGNhY2hlRW50cnkgPSBhd2FpdCB0aGlzLm1DYWNoZS5nZXQoaWQpO1xyXG4gICAgY29uc3QgcGFja2FnZU5vdExpc3RlZCA9IChjYWNoZUVudHJ5Py5wYWNrYWdlTGlzdCB8fCBbXSkubGVuZ3RoID09PSAwO1xyXG4gICAgaWYgKCFjYWNoZUVudHJ5IHx8IGhhc0NoYW5nZWQoY2FjaGVFbnRyeSkgfHwgcGFja2FnZU5vdExpc3RlZCkge1xyXG4gICAgICBjb25zdCBwYWNrYWdlTGlzdCA9IGF3YWl0IGxpc3RQYWNrYWdlKGFwaSwgZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBpc0xpc3RlZCA9IHRoaXMuaXNMT0xpc3RlZChhcGksIGZpbGVQYXRoLCBwYWNrYWdlTGlzdCk7XHJcbiAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBleHRyYWN0UGFrSW5mb0ltcGwoYXBpLCBmaWxlUGF0aCwgbW9kLCBpc0xpc3RlZCk7XHJcbiAgICAgIHRoaXMubUNhY2hlLnNldChpZCwge1xyXG4gICAgICAgIGZpbGVOYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcclxuICAgICAgICBsYXN0TW9kaWZpZWQ6IGN0aW1lLFxyXG4gICAgICAgIGluZm8sXHJcbiAgICAgICAgcGFja2FnZUxpc3QsXHJcbiAgICAgICAgbW9kLFxyXG4gICAgICAgIGlzTGlzdGVkLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm1DYWNoZS5nZXQoaWQpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlc2V0KCkge1xyXG4gICAgdGhpcy5tQ2FjaGUgPSBuZXcgTFJVPHN0cmluZywgSUNhY2hlRW50cnk+KHsgbWF4OiA3MDAgfSk7XHJcbiAgICB0aGlzLnNhdmUoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBzYXZlKCkge1xyXG4gICAgaWYgKCF0aGlzLm1DYWNoZSkge1xyXG4gICAgICAvLyBOb3RoaW5nIHRvIHNhdmUuXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoY2FjaGVQYXRoKSk7XHJcbiAgICAgIGF3YWl0IHV0aWwud3JpdGVGaWxlQXRvbWljKGNhY2hlUGF0aCwgSlNPTi5zdHJpbmdpZnkodGhpcy5tQ2FjaGUuZHVtcCgpKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc2F2ZSBjYWNoZScsIGVycik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgbG9hZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoY2FjaGVQYXRoKSk7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNhY2hlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICB0aGlzLm1DYWNoZS5sb2FkKEpTT04ucGFyc2UoZGF0YSkpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmICghWydFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBsb2FkIGNhY2hlJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpc0xPTGlzdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBwYWNrYWdlTGlzdDogc3RyaW5nW10pOiBib29sZWFuIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIGxvb2sgYXQgdGhlIGVuZCBvZiB0aGUgZmlyc3QgYml0IG9mIGRhdGEgdG8gc2VlIGlmIGl0IGhhcyBhIG1ldGEubHN4IGZpbGVcclxuICAgICAgLy8gZXhhbXBsZSAnTW9kcy9TYWZlIEVkaXRpb24vbWV0YS5sc3hcXHQxNzU5XFx0MCdcclxuICAgICAgY29uc3QgY29udGFpbnNNZXRhRmlsZSA9IHBhY2thZ2VMaXN0LmZpbmQobGluZSA9PiBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKSAhPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGZhbHNlO1xyXG5cclxuICAgICAgLy8gaW52ZXJ0IHJlc3VsdCBhcyAnbGlzdGVkJyBtZWFucyBpdCBkb2Vzbid0IGNvbnRhaW4gYSBtZXRhIGZpbGUuXHJcbiAgICAgIHJldHVybiAhY29udGFpbnNNZXRhRmlsZTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgdHlwZTogJ2Vycm9yJyxcclxuICAgICAgICBtZXNzYWdlOiBgJHtwYXRoLmJhc2VuYW1lKHBha1BhdGgpfSBjb3VsZG4ndCBiZSByZWFkIGNvcnJlY3RseS4gVGhpcyBtb2QgYmUgaW5jb3JyZWN0bHkgbG9ja2VkL3VubG9ja2VkIGJ1dCB3aWxsIGRlZmF1bHQgdG8gdW5sb2NrZWQuYCxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBmYWxzZTsgICAgXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZpbGVJZChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKS50b1VwcGVyQ2FzZSgpO1xyXG4gIH1cclxufVxyXG4iXX0=