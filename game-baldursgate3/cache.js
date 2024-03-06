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
const path = __importStar(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const divineWrapper_1 = require("./divineWrapper");
const util_1 = require("./util");
class PakInfoCache {
    static getInstance() {
        if (!PakInfoCache.instance) {
            PakInfoCache.instance = new PakInfoCache();
        }
        return PakInfoCache.instance;
    }
    constructor() {
        this.mCache = null;
    }
    getCacheEntry(api, filePath, mod) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.mCache) {
                this.mCache = yield this.load(api);
            }
            const id = this.fileId(filePath);
            let mtime;
            try {
                const stat = vortex_api_1.fs.statSync(filePath);
                mtime = Number(stat.mtimeMs);
            }
            catch (err) {
                mtime = Date.now();
            }
            if ((this.mCache[id] === undefined)
                || (mtime !== this.mCache[id].lastModified
                    || (this.mCache[id].packageList.length === 0))) {
                const packageList = yield (0, divineWrapper_1.listPackage)(api, filePath);
                const isListed = this.isLOListed(api, filePath, packageList);
                const info = yield (0, util_1.extractPakInfoImpl)(api, filePath, mod, isListed);
                this.mCache[id] = {
                    fileName: path.basename(filePath),
                    lastModified: mtime,
                    info,
                    packageList,
                    mod,
                    isListed,
                };
            }
            return this.mCache[id];
        });
    }
    reset() {
        this.mCache = null;
    }
    save(api) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.mCache) {
                return;
            }
            const state = api.getState();
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const cachePath = path.join(path.dirname(staging), 'cache', profileId + '.json');
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(cachePath));
                yield vortex_api_1.util.writeFileAtomic(cachePath, JSON.stringify(this.mCache));
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
                return JSON.parse(data);
            }
            catch (err) {
                if (!['ENOENT'].includes(err.code)) {
                    (0, vortex_api_1.log)('error', 'failed to load cache', err);
                }
                return {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJDQUE2RDtBQUU3RCxxQ0FBbUM7QUFDbkMsbURBQThDO0FBRTlDLGlDQUE0QztBQVk1QyxNQUFxQixZQUFZO0lBRXhCLE1BQU0sQ0FBQyxXQUFXO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztTQUM1QztRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBR0Q7UUFDRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRVksYUFBYSxDQUFDLEdBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLEdBQWdCOztZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDcEM7WUFDRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLElBQUksS0FBYSxDQUFDO1lBQ2xCLElBQUk7Z0JBQ0YsTUFBTSxJQUFJLEdBQUcsZUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDOUI7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ3BCO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssU0FBUyxDQUFDO21CQUM1QixD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Y2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBsaXN0UGFja2FnZSB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XHJcbmltcG9ydCB7IElQYWtJbmZvIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGV4dHJhY3RQYWtJbmZvSW1wbCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElDYWNoZUVudHJ5IHtcclxuICBsYXN0TW9kaWZpZWQ6IG51bWJlcjtcclxuICBpbmZvOiBJUGFrSW5mbztcclxuICBmaWxlTmFtZTogc3RyaW5nO1xyXG4gIHBhY2thZ2VMaXN0OiBzdHJpbmdbXTtcclxuICBpc0xpc3RlZDogYm9vbGVhbjtcclxuICBtb2Q/OiB0eXBlcy5JTW9kO1xyXG59XHJcblxyXG50eXBlIElQYWtNYXAgPSB7IFtmaWxlUGF0aDogc3RyaW5nXTogSUNhY2hlRW50cnkgfTtcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFrSW5mb0NhY2hlIHtcclxuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogUGFrSW5mb0NhY2hlID0gbnVsbDtcclxuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKCk6IFBha0luZm9DYWNoZSB7XHJcbiAgICBpZiAoIVBha0luZm9DYWNoZS5pbnN0YW5jZSkge1xyXG4gICAgICBQYWtJbmZvQ2FjaGUuaW5zdGFuY2UgPSBuZXcgUGFrSW5mb0NhY2hlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFBha0luZm9DYWNoZS5pbnN0YW5jZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbUNhY2hlOiBJUGFrTWFwO1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5tQ2FjaGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGdldENhY2hlRW50cnkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kPzogdHlwZXMuSU1vZCk6IFByb21pc2U8SUNhY2hlRW50cnk+IHtcclxuICAgIGlmICghdGhpcy5tQ2FjaGUpIHsgXHJcbiAgICAgIHRoaXMubUNhY2hlID0gYXdhaXQgdGhpcy5sb2FkKGFwaSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpZCA9IHRoaXMuZmlsZUlkKGZpbGVQYXRoKTtcclxuICAgIGxldCBtdGltZTogbnVtYmVyO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZpbGVQYXRoKTtcclxuICAgICAgbXRpbWUgPSBOdW1iZXIoc3RhdC5tdGltZU1zKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBtdGltZSA9IERhdGUubm93KCk7XHJcbiAgICB9XHJcbiAgICBpZiAoKHRoaXMubUNhY2hlW2lkXSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHx8IChtdGltZSAhPT0gdGhpcy5tQ2FjaGVbaWRdLmxhc3RNb2RpZmllZFxyXG4gICAgICAgIHx8ICh0aGlzLm1DYWNoZVtpZF0ucGFja2FnZUxpc3QubGVuZ3RoID09PSAwKSkpIHtcclxuICAgICAgY29uc3QgcGFja2FnZUxpc3QgPSBhd2FpdCBsaXN0UGFja2FnZShhcGksIGZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgaXNMaXN0ZWQgPSB0aGlzLmlzTE9MaXN0ZWQoYXBpLCBmaWxlUGF0aCwgcGFja2FnZUxpc3QpO1xyXG4gICAgICBjb25zdCBpbmZvID0gYXdhaXQgZXh0cmFjdFBha0luZm9JbXBsKGFwaSwgZmlsZVBhdGgsIG1vZCwgaXNMaXN0ZWQpO1xyXG4gICAgICB0aGlzLm1DYWNoZVtpZF0gPSB7XHJcbiAgICAgICAgZmlsZU5hbWU6IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLFxyXG4gICAgICAgIGxhc3RNb2RpZmllZDogbXRpbWUsXHJcbiAgICAgICAgaW5mbyxcclxuICAgICAgICBwYWNrYWdlTGlzdCxcclxuICAgICAgICBtb2QsXHJcbiAgICAgICAgaXNMaXN0ZWQsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5tQ2FjaGVbaWRdO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlc2V0KCkge1xyXG4gICAgdGhpcy5tQ2FjaGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHNhdmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICBpZiAoIXRoaXMubUNhY2hlKSB7XHJcbiAgICAgIC8vIE5vdGhpbmcgdG8gc2F2ZS5cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3Qgc3RhZ2luZyA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgY2FjaGVQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShzdGFnaW5nKSwgJ2NhY2hlJywgcHJvZmlsZUlkICsgJy5qc29uJyk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShjYWNoZVBhdGgpKTtcclxuICAgICAgYXdhaXQgdXRpbC53cml0ZUZpbGVBdG9taWMoY2FjaGVQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLm1DYWNoZSkpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHNhdmUgY2FjaGUnLCBlcnIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGxvYWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJUGFrTWFwPiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBzdGFnaW5nID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBjYWNoZVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHN0YWdpbmcpLCAnY2FjaGUnLCBwcm9maWxlSWQgKyAnLmpzb24nKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGNhY2hlUGF0aCkpO1xyXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhjYWNoZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKCFbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSkge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvYWQgY2FjaGUnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB7fTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgaXNMT0xpc3RlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgcGFja2FnZUxpc3Q6IHN0cmluZ1tdKTogYm9vbGVhbiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBsb29rIGF0IHRoZSBlbmQgb2YgdGhlIGZpcnN0IGJpdCBvZiBkYXRhIHRvIHNlZSBpZiBpdCBoYXMgYSBtZXRhLmxzeCBmaWxlXHJcbiAgICAgIC8vIGV4YW1wbGUgJ01vZHMvU2FmZSBFZGl0aW9uL21ldGEubHN4XFx0MTc1OVxcdDAnXHJcbiAgICAgIGNvbnN0IGNvbnRhaW5zTWV0YUZpbGUgPSBwYWNrYWdlTGlzdC5maW5kKGxpbmUgPT4gcGF0aC5iYXNlbmFtZShsaW5lLnNwbGl0KCdcXHQnKVswXSkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4JykgIT09IHVuZGVmaW5lZCA/IHRydWUgOiBmYWxzZTtcclxuXHJcbiAgICAgIC8vIGludmVydCByZXN1bHQgYXMgJ2xpc3RlZCcgbWVhbnMgaXQgZG9lc24ndCBjb250YWluIGEgbWV0YSBmaWxlLlxyXG4gICAgICByZXR1cm4gIWNvbnRhaW5zTWV0YUZpbGU7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIHR5cGU6ICdlcnJvcicsXHJcbiAgICAgICAgbWVzc2FnZTogYCR7cGF0aC5iYXNlbmFtZShwYWtQYXRoKX0gY291bGRuJ3QgYmUgcmVhZCBjb3JyZWN0bHkuIFRoaXMgbW9kIGJlIGluY29ycmVjdGx5IGxvY2tlZC91bmxvY2tlZCBidXQgd2lsbCBkZWZhdWx0IHRvIHVubG9ja2VkLmAsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gZmFsc2U7ICAgIFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmaWxlSWQoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCkudG9VcHBlckNhc2UoKTtcclxuICB9XHJcbn1cclxuIl19