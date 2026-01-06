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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const path = __importStar(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const divineWrapper_1 = require("./divineWrapper");
const util_1 = require("./util");
const lru_cache_1 = require("lru-cache");
class PakInfoCache {
    static getInstance(api) {
        if (!PakInfoCache.instance) {
            PakInfoCache.instance = new PakInfoCache(api);
        }
        return PakInfoCache.instance;
    }
    constructor(api) {
        this.mApi = api;
        this.mCache = new lru_cache_1.LRUCache({ max: 700 });
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
        this.mCache = new lru_cache_1.LRUCache({ max: 700 });
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
                const cacheData = Array.from(this.mCache.entries());
                yield vortex_api_1.util.writeFileAtomic(cachePath, JSON.stringify(cacheData));
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
                const cacheData = JSON.parse(data);
                if (Array.isArray(cacheData)) {
                    for (const [key, value] of cacheData) {
                        this.mCache.set(key, value);
                    }
                }
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
PakInfoCache.instance = null;
exports.default = PakInfoCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDJDQUE2QjtBQUM3QiwyQ0FBNkQ7QUFFN0QscUNBQW1DO0FBQ25DLG1EQUE4QztBQUU5QyxpQ0FBc0Q7QUFFdEQseUNBQXFDO0FBWXJDLE1BQXFCLFlBQVk7SUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUF3QjtRQUNoRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzNCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBS0QsWUFBWSxHQUF3QjtRQUVsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksb0JBQVEsQ0FBc0IsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFFWSxhQUFhLENBQUMsR0FBd0IsRUFDeEIsUUFBZ0IsRUFDaEIsR0FBZ0I7O1lBQ3pDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsTUFBTSxJQUFJLEdBQUcsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDM0IsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFrQixFQUFFLEVBQUU7O2dCQUN4QyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdB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b0JBQ25DLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztLQUFBO0lBRU8sVUFBVSxDQUFDLEdBQXdCLEVBQUUsT0FBZSxFQUFFLFdBQXFCO1FBQ2pGLElBQUksQ0FBQztZQUdILE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLFVBQVUsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFHaEosT0FBTyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuQixJQUFJLEVBQUUsT0FBTztnQkFDYixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxvR0FBb0c7YUFDdkksQ0FBQyxDQUFDO1lBQ0gsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0lBQ0gsQ0FBQztJQUVPLE1BQU0sQ0FBQyxRQUFnQjtRQUM3QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0MsQ0FBQzs7QUFuSGMscUJBQVEsR0FBaUIsSUFBSSxDQUFDO2tCQUQxQixZQUFZIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgbGlzdFBhY2thZ2UgfSBmcm9tICcuL2RpdmluZVdyYXBwZXInO1xyXG5pbXBvcnQgeyBJUGFrSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBleHRyYWN0UGFrSW5mb0ltcGwsIGxvZ0RlYnVnIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7IExSVUNhY2hlIH0gZnJvbSAnbHJ1LWNhY2hlJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUNhY2hlRW50cnkge1xyXG4gIGxhc3RNb2RpZmllZDogbnVtYmVyO1xyXG4gIGluZm86IElQYWtJbmZvO1xyXG4gIGZpbGVOYW1lOiBzdHJpbmc7XHJcbiAgcGFja2FnZUxpc3Q6IHN0cmluZ1tdO1xyXG4gIGlzTGlzdGVkOiBib29sZWFuO1xyXG4gIG1vZD86IHR5cGVzLklNb2Q7XHJcbn1cclxuXHJcbnR5cGUgSVBha01hcCA9IExSVUNhY2hlPHN0cmluZywgSUNhY2hlRW50cnk+O1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYWtJbmZvQ2FjaGUge1xyXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBQYWtJbmZvQ2FjaGUgPSBudWxsO1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUGFrSW5mb0NhY2hlIHtcclxuICAgIGlmICghUGFrSW5mb0NhY2hlLmluc3RhbmNlKSB7XHJcbiAgICAgIFBha0luZm9DYWNoZS5pbnN0YW5jZSA9IG5ldyBQYWtJbmZvQ2FjaGUoYXBpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUGFrSW5mb0NhY2hlLmluc3RhbmNlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtQ2FjaGU6IElQYWtNYXA7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIC8vIDcwMCBzaG91bGQgYmUgZW5vdWdoIGZvciBldmVyeW9uZSBJIGhvcGUuXHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1DYWNoZSA9IG5ldyBMUlVDYWNoZTxzdHJpbmcsIElDYWNoZUVudHJ5Pih7IG1heDogNzAwIH0pO1xyXG4gICAgdGhpcy5sb2FkKGFwaSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZ2V0Q2FjaGVFbnRyeShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2Q/OiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJQ2FjaGVFbnRyeT4ge1xyXG4gICAgY29uc3QgaWQgPSB0aGlzLmZpbGVJZChmaWxlUGF0aCk7XHJcbiAgICBjb25zdCBzdGF0ID0gYXdhaXQgZnMuc3RhdEFzeW5jKGZpbGVQYXRoKTtcclxuICAgIGNvbnN0IGN0aW1lID0gc3RhdC5jdGltZU1zO1xyXG4gICAgY29uc3QgaGFzQ2hhbmdlZCA9IChlbnRyeTogSUNhY2hlRW50cnkpID0+IHtcclxuICAgICAgcmV0dXJuICghIW1vZCAmJiAhIWVudHJ5Lm1vZClcclxuICAgICAgICA/IG1vZC5hdHRyaWJ1dGVzPy5maWxlSWQgIT09IGVudHJ5Lm1vZC5hdHRyaWJ1dGVzPy5maWxlSWRcclxuICAgICAgICA6IGN0aW1lICE9PSBlbnRyeT8ubGFzdE1vZGlmaWVkO1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBjYWNoZUVudHJ5ID0gYXdhaXQgdGhpcy5tQ2FjaGUuZ2V0KGlkKTtcclxuICAgIGNvbnN0IHBhY2thZ2VOb3RMaXN0ZWQgPSAoY2FjaGVFbnRyeT8ucGFja2FnZUxpc3QgfHwgW10pLmxlbmd0aCA9PT0gMDtcclxuICAgIGlmICghY2FjaGVFbnRyeSB8fCBoYXNDaGFuZ2VkKGNhY2hlRW50cnkpIHx8IHBhY2thZ2VOb3RMaXN0ZWQpIHtcclxuICAgICAgY29uc3QgcGFja2FnZUxpc3QgPSBhd2FpdCBsaXN0UGFja2FnZShhcGksIGZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgaXNMaXN0ZWQgPSB0aGlzLmlzTE9MaXN0ZWQoYXBpLCBmaWxlUGF0aCwgcGFja2FnZUxpc3QpO1xyXG4gICAgICBjb25zdCBpbmZvID0gYXdhaXQgZXh0cmFjdFBha0luZm9JbXBsKGFwaSwgZmlsZVBhdGgsIG1vZCwgaXNMaXN0ZWQpO1xyXG4gICAgICB0aGlzLm1DYWNoZS5zZXQoaWQsIHtcclxuICAgICAgICBmaWxlTmFtZTogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXHJcbiAgICAgICAgbGFzdE1vZGlmaWVkOiBjdGltZSxcclxuICAgICAgICBpbmZvLFxyXG4gICAgICAgIHBhY2thZ2VMaXN0LFxyXG4gICAgICAgIG1vZCxcclxuICAgICAgICBpc0xpc3RlZCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5tQ2FjaGUuZ2V0KGlkKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXNldCgpIHtcclxuICAgIHRoaXMubUNhY2hlID0gbmV3IExSVUNhY2hlPHN0cmluZywgSUNhY2hlRW50cnk+KHsgbWF4OiA3MDAgfSk7XHJcbiAgICB0aGlzLnNhdmUoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBzYXZlKCkge1xyXG4gICAgaWYgKCF0aGlzLm1DYWNoZSkge1xyXG4gICAgICAvLyBOb3RoaW5nIHRvIHNhdmUuXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoY2FjaGVQYXRoKSk7XHJcbiAgICAgIC8vIENvbnZlcnQgY2FjaGUgZW50cmllcyB0byBhcnJheSBmb3Igc2VyaWFsaXphdGlvblxyXG4gICAgICBjb25zdCBjYWNoZURhdGEgPSBBcnJheS5mcm9tKHRoaXMubUNhY2hlLmVudHJpZXMoKSk7XHJcbiAgICAgIGF3YWl0IHV0aWwud3JpdGVGaWxlQXRvbWljKGNhY2hlUGF0aCwgSlNPTi5zdHJpbmdpZnkoY2FjaGVEYXRhKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc2F2ZSBjYWNoZScsIGVycik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgbG9hZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoY2FjaGVQYXRoKSk7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNhY2hlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICBjb25zdCBjYWNoZURhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xyXG4gICAgICAvLyBSZXN0b3JlIGNhY2hlIGVudHJpZXMgZnJvbSBhcnJheVxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShjYWNoZURhdGEpKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgY2FjaGVEYXRhKSB7XHJcbiAgICAgICAgICB0aGlzLm1DYWNoZS5zZXQoa2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKCFbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSkge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvYWQgY2FjaGUnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGlzTE9MaXN0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcsIHBhY2thZ2VMaXN0OiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gbG9vayBhdCB0aGUgZW5kIG9mIHRoZSBmaXJzdCBiaXQgb2YgZGF0YSB0byBzZWUgaWYgaXQgaGFzIGEgbWV0YS5sc3ggZmlsZVxyXG4gICAgICAvLyBleGFtcGxlICdNb2RzL1NhZmUgRWRpdGlvbi9tZXRhLmxzeFxcdDE3NTlcXHQwJ1xyXG4gICAgICBjb25zdCBjb250YWluc01ldGFGaWxlID0gcGFja2FnZUxpc3QuZmluZChsaW5lID0+IHBhdGguYmFzZW5hbWUobGluZS5zcGxpdCgnXFx0JylbMF0pLnRvTG93ZXJDYXNlKCkgPT09ICdtZXRhLmxzeCcpICE9PSB1bmRlZmluZWQgPyB0cnVlIDogZmFsc2U7XHJcblxyXG4gICAgICAvLyBpbnZlcnQgcmVzdWx0IGFzICdsaXN0ZWQnIG1lYW5zIGl0IGRvZXNuJ3QgY29udGFpbiBhIG1ldGEgZmlsZS5cclxuICAgICAgcmV0dXJuICFjb250YWluc01ldGFGaWxlO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICB0eXBlOiAnZXJyb3InLFxyXG4gICAgICAgIG1lc3NhZ2U6IGAke3BhdGguYmFzZW5hbWUocGFrUGF0aCl9IGNvdWxkbid0IGJlIHJlYWQgY29ycmVjdGx5LiBUaGlzIG1vZCBiZSBpbmNvcnJlY3RseSBsb2NrZWQvdW5sb2NrZWQgYnV0IHdpbGwgZGVmYXVsdCB0byB1bmxvY2tlZC5gLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGZhbHNlOyAgICBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgZmlsZUlkKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLnRvVXBwZXJDYXNlKCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==