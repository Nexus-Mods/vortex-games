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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJDQUE2RDtBQUU3RCxxQ0FBbUM7QUFDbkMsbURBQThDO0FBRTlDLGlDQUFzRDtBQUV0RCwwREFBNEI7QUFhNUIsTUFBcUIsWUFBWTtJQUV4QixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQXdCO1FBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDL0M7UUFFRCxPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDL0IsQ0FBQztJQUtELFlBQVksR0FBd0I7UUFFbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLG1CQUFHLENBQXNCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBRVksYUFBYSxDQUFDLEdBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLEdBQWdCOztZQUN6QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzNCLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBa0IsRUFBRSxFQUFFOztnQkFDeEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7b0JBQzNCLENBQUMsQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsTUFBTSxPQUFLLE1BQUEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLE1BQU0sQ0FBQTtvQkFDekQsQ0FBQyxDQUFDLEtBQUssTUFBSyxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsWUFBWSxDQUFBLENBQUM7WUFDcEMsQ0FBQyxDQUFDO1lBRUYsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM3QyxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQSxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsV0FBVyxLQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksZ0JBQWdCLEVBQUU7Z0JBQzdELE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSwyQkFBVyxFQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDckQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUEseUJBQWtCLEVBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3BFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRTtvQkFDbEIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO29CQUNqQyxZQUFZLEVBQUUsS0FBSztvQkFDbkIsSUFBSTtvQkFDSixXQUFXO29CQUNYLEdBQUc7b0JBQ0gsUUFBUTtpQkFDVCxDQUFDLENBQUM7YUFDSjtZQUNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0IsQ0FBQztLQUFBO0lBRU0sS0FBSztRQUNWLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxtQkFBRyxDQUFzQixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFWSxJQUFJOztZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUVoQixPQUFPO2FBQ1I7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztZQUNyRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDN0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLENBQUM7WUFDakYsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0saUJBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDM0U7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQyxPQUFPO2FBQ1I7UUFDSCxDQUFDO0tBQUE7SUFFYSxJQUFJLENBQUMsR0FBd0I7O1lBQ3pDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDckUsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQzdELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQ2pGLElBQUk7Z0JBQ0YsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLElBQUksR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNwQztZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2xDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQzNDO2FBQ0Y7UUFDSCxDQUFDO0tBQUE7SUFFTyxVQUFVLENBQUMsR0FBd0IsRUFBRSxPQUFlLEVBQUUsV0FBcUI7UUFDakYsSUFBSTtZQUdGLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLFVBQVUsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFHaEosT0FBTyxDQUFDLGdCQUFnQixDQUFDO1NBQzFCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ25CLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLG9HQUFvRzthQUN2SSxDQUFDLENBQUM7WUFDSCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVPLE1BQU0sQ0FBQyxRQUFnQjtRQUM3QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0MsQ0FBQzs7QUEzR0gsK0JBNEdDO0FBM0dnQixxQkFBUSxHQUFpQixJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IGxpc3RQYWNrYWdlIH0gZnJvbSAnLi9kaXZpbmVXcmFwcGVyJztcbmltcG9ydCB7IElQYWtJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBleHRyYWN0UGFrSW5mb0ltcGwsIGxvZ0RlYnVnIH0gZnJvbSAnLi91dGlsJztcblxuaW1wb3J0IExSVSBmcm9tICdscnUtY2FjaGUnO1xuaW1wb3J0IHsgc2V0VGltZW91dCB9IGZyb20gJ3RpbWVycy9wcm9taXNlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNhY2hlRW50cnkge1xuICBsYXN0TW9kaWZpZWQ6IG51bWJlcjtcbiAgaW5mbzogSVBha0luZm87XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIHBhY2thZ2VMaXN0OiBzdHJpbmdbXTtcbiAgaXNMaXN0ZWQ6IGJvb2xlYW47XG4gIG1vZD86IHR5cGVzLklNb2Q7XG59XG5cbnR5cGUgSVBha01hcCA9IExSVTxzdHJpbmcsIElDYWNoZUVudHJ5PjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBha0luZm9DYWNoZSB7XG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBQYWtJbmZvQ2FjaGUgPSBudWxsO1xuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFBha0luZm9DYWNoZSB7XG4gICAgaWYgKCFQYWtJbmZvQ2FjaGUuaW5zdGFuY2UpIHtcbiAgICAgIFBha0luZm9DYWNoZS5pbnN0YW5jZSA9IG5ldyBQYWtJbmZvQ2FjaGUoYXBpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUGFrSW5mb0NhY2hlLmluc3RhbmNlO1xuICB9XG5cbiAgcHJpdmF0ZSBtQ2FjaGU6IElQYWtNYXA7XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcblxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgICAvLyA3MDAgc2hvdWxkIGJlIGVub3VnaCBmb3IgZXZlcnlvbmUgSSBob3BlLlxuICAgIHRoaXMubUFwaSA9IGFwaTtcbiAgICB0aGlzLm1DYWNoZSA9IG5ldyBMUlU8c3RyaW5nLCBJQ2FjaGVFbnRyeT4oeyBtYXg6IDcwMCB9KTtcbiAgICB0aGlzLmxvYWQoYXBpKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBnZXRDYWNoZUVudHJ5KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kPzogdHlwZXMuSU1vZCk6IFByb21pc2U8SUNhY2hlRW50cnk+IHtcbiAgICBjb25zdCBpZCA9IHRoaXMuZmlsZUlkKGZpbGVQYXRoKTtcbiAgICBjb25zdCBzdGF0ID0gYXdhaXQgZnMuc3RhdEFzeW5jKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjdGltZSA9IHN0YXQuY3RpbWVNcztcbiAgICBjb25zdCBoYXNDaGFuZ2VkID0gKGVudHJ5OiBJQ2FjaGVFbnRyeSkgPT4ge1xuICAgICAgcmV0dXJuICghIW1vZCAmJiAhIWVudHJ5Lm1vZClcbiAgICAgICAgPyBtb2QuYXR0cmlidXRlcz8uZmlsZUlkICE9PSBlbnRyeS5tb2QuYXR0cmlidXRlcz8uZmlsZUlkXG4gICAgICAgIDogY3RpbWUgIT09IGVudHJ5Py5sYXN0TW9kaWZpZWQ7XG4gICAgfTtcblxuICAgIGNvbnN0IGNhY2hlRW50cnkgPSBhd2FpdCB0aGlzLm1DYWNoZS5nZXQoaWQpO1xuICAgIGNvbnN0IHBhY2thZ2VOb3RMaXN0ZWQgPSAoY2FjaGVFbnRyeT8ucGFja2FnZUxpc3QgfHwgW10pLmxlbmd0aCA9PT0gMDtcbiAgICBpZiAoIWNhY2hlRW50cnkgfHwgaGFzQ2hhbmdlZChjYWNoZUVudHJ5KSB8fCBwYWNrYWdlTm90TGlzdGVkKSB7XG4gICAgICBjb25zdCBwYWNrYWdlTGlzdCA9IGF3YWl0IGxpc3RQYWNrYWdlKGFwaSwgZmlsZVBhdGgpO1xuICAgICAgY29uc3QgaXNMaXN0ZWQgPSB0aGlzLmlzTE9MaXN0ZWQoYXBpLCBmaWxlUGF0aCwgcGFja2FnZUxpc3QpO1xuICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IGV4dHJhY3RQYWtJbmZvSW1wbChhcGksIGZpbGVQYXRoLCBtb2QsIGlzTGlzdGVkKTtcbiAgICAgIHRoaXMubUNhY2hlLnNldChpZCwge1xuICAgICAgICBmaWxlTmFtZTogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXG4gICAgICAgIGxhc3RNb2RpZmllZDogY3RpbWUsXG4gICAgICAgIGluZm8sXG4gICAgICAgIHBhY2thZ2VMaXN0LFxuICAgICAgICBtb2QsXG4gICAgICAgIGlzTGlzdGVkLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1DYWNoZS5nZXQoaWQpO1xuICB9XG5cbiAgcHVibGljIHJlc2V0KCkge1xuICAgIHRoaXMubUNhY2hlID0gbmV3IExSVTxzdHJpbmcsIElDYWNoZUVudHJ5Pih7IG1heDogNzAwIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHNhdmUoKSB7XG4gICAgaWYgKCF0aGlzLm1DYWNoZSkge1xuICAgICAgLy8gTm90aGluZyB0byBzYXZlLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBjYWNoZVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHN0YWdpbmcpLCAnY2FjaGUnLCBwcm9maWxlSWQgKyAnLmpzb24nKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoY2FjaGVQYXRoKSk7XG4gICAgICBhd2FpdCB1dGlsLndyaXRlRmlsZUF0b21pYyhjYWNoZVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMubUNhY2hlLmR1bXAoKSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc2F2ZSBjYWNoZScsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3Qgc3RhZ2luZyA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShjYWNoZVBhdGgpKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNhY2hlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgdGhpcy5tQ2FjaGUubG9hZChKU09OLnBhcnNlKGRhdGEpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmICghWydFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbG9hZCBjYWNoZScsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc0xPTGlzdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBwYWNrYWdlTGlzdDogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgLy8gbG9vayBhdCB0aGUgZW5kIG9mIHRoZSBmaXJzdCBiaXQgb2YgZGF0YSB0byBzZWUgaWYgaXQgaGFzIGEgbWV0YS5sc3ggZmlsZVxuICAgICAgLy8gZXhhbXBsZSAnTW9kcy9TYWZlIEVkaXRpb24vbWV0YS5sc3hcXHQxNzU5XFx0MCdcbiAgICAgIGNvbnN0IGNvbnRhaW5zTWV0YUZpbGUgPSBwYWNrYWdlTGlzdC5maW5kKGxpbmUgPT4gcGF0aC5iYXNlbmFtZShsaW5lLnNwbGl0KCdcXHQnKVswXSkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4JykgIT09IHVuZGVmaW5lZCA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgLy8gaW52ZXJ0IHJlc3VsdCBhcyAnbGlzdGVkJyBtZWFucyBpdCBkb2Vzbid0IGNvbnRhaW4gYSBtZXRhIGZpbGUuXG4gICAgICByZXR1cm4gIWNvbnRhaW5zTWV0YUZpbGU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgIG1lc3NhZ2U6IGAke3BhdGguYmFzZW5hbWUocGFrUGF0aCl9IGNvdWxkbid0IGJlIHJlYWQgY29ycmVjdGx5LiBUaGlzIG1vZCBiZSBpbmNvcnJlY3RseSBsb2NrZWQvdW5sb2NrZWQgYnV0IHdpbGwgZGVmYXVsdCB0byB1bmxvY2tlZC5gLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7ICAgIFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmlsZUlkKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKS50b1VwcGVyQ2FzZSgpO1xuICB9XG59XG4iXX0=