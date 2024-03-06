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
                || (mtime !== this.mCache[id].lastModified)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJDQUE2RDtBQUU3RCxxQ0FBbUM7QUFDbkMsbURBQThDO0FBRTlDLGlDQUE0QztBQVk1QyxNQUFxQixZQUFZO0lBRXhCLE1BQU0sQ0FBQyxXQUFXO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztTQUM1QztRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBR0Q7UUFDRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRVksYUFBYSxDQUFDLEdBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLEdBQWdCOztZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDcEM7WUFDRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLElBQUksS0FBYSxDQUFDO1lBQ2xCLElBQUk7Z0JBQ0YsTUFBTSxJQUFJLEdBQUcsZUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDOUI7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ3BCO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssU0FBUyxDQUFDO21CQUM1QixD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WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNsQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUMzQztnQkFDRCxPQUFPLEVBQUUsQ0FBQzthQUNYO1FBQ0gsQ0FBQztLQUFBO0lBRU8sVUFBVSxDQUFDLEdBQXdCLEVBQUUsT0FBZSxFQUFFLFdBQXFCO1FBQ2pGLElBQUk7WUFHRixNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxVQUFVLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBR2hKLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztTQUMxQjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuQixJQUFJLEVBQUUsT0FBTztnQkFDYixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxvR0FBb0c7YUFDdkksQ0FBQyxDQUFDO1lBQ0gsT0FBTyxLQUFLLENBQUM7U0FDZDtJQUNILENBQUM7SUFFTyxNQUFNLENBQUMsUUFBZ0I7UUFDN0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9DLENBQUM7O0FBeEdILCtCQXlHQztBQXhHZ0IscUJBQVEsR0FBaUIsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBsaXN0UGFja2FnZSB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XG5pbXBvcnQgeyBJUGFrSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZXh0cmFjdFBha0luZm9JbXBsIH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ2FjaGVFbnRyeSB7XG4gIGxhc3RNb2RpZmllZDogbnVtYmVyO1xuICBpbmZvOiBJUGFrSW5mbztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgcGFja2FnZUxpc3Q6IHN0cmluZ1tdO1xuICBpc0xpc3RlZDogYm9vbGVhbjtcbiAgbW9kPzogdHlwZXMuSU1vZDtcbn1cblxudHlwZSBJUGFrTWFwID0geyBbZmlsZVBhdGg6IHN0cmluZ106IElDYWNoZUVudHJ5IH07XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYWtJbmZvQ2FjaGUge1xuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogUGFrSW5mb0NhY2hlID0gbnVsbDtcbiAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBQYWtJbmZvQ2FjaGUge1xuICAgIGlmICghUGFrSW5mb0NhY2hlLmluc3RhbmNlKSB7XG4gICAgICBQYWtJbmZvQ2FjaGUuaW5zdGFuY2UgPSBuZXcgUGFrSW5mb0NhY2hlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFBha0luZm9DYWNoZS5pbnN0YW5jZTtcbiAgfVxuXG4gIHByaXZhdGUgbUNhY2hlOiBJUGFrTWFwO1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm1DYWNoZSA9IG51bGw7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0Q2FjaGVFbnRyeShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZD86IHR5cGVzLklNb2QpOiBQcm9taXNlPElDYWNoZUVudHJ5PiB7XG4gICAgaWYgKCF0aGlzLm1DYWNoZSkgeyBcbiAgICAgIHRoaXMubUNhY2hlID0gYXdhaXQgdGhpcy5sb2FkKGFwaSk7XG4gICAgfVxuICAgIGNvbnN0IGlkID0gdGhpcy5maWxlSWQoZmlsZVBhdGgpO1xuICAgIGxldCBtdGltZTogbnVtYmVyO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZmlsZVBhdGgpO1xuICAgICAgbXRpbWUgPSBOdW1iZXIoc3RhdC5tdGltZU1zKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIG10aW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG4gICAgaWYgKCh0aGlzLm1DYWNoZVtpZF0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgfHwgKG10aW1lICE9PSB0aGlzLm1DYWNoZVtpZF0ubGFzdE1vZGlmaWVkKSkge1xuICAgICAgY29uc3QgcGFja2FnZUxpc3QgPSBhd2FpdCBsaXN0UGFja2FnZShhcGksIGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGlzTGlzdGVkID0gdGhpcy5pc0xPTGlzdGVkKGFwaSwgZmlsZVBhdGgsIHBhY2thZ2VMaXN0KTtcbiAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBleHRyYWN0UGFrSW5mb0ltcGwoYXBpLCBmaWxlUGF0aCwgbW9kLCBpc0xpc3RlZCk7XG4gICAgICB0aGlzLm1DYWNoZVtpZF0gPSB7XG4gICAgICAgIGZpbGVOYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcbiAgICAgICAgbGFzdE1vZGlmaWVkOiBtdGltZSxcbiAgICAgICAgaW5mbyxcbiAgICAgICAgcGFja2FnZUxpc3QsXG4gICAgICAgIG1vZCxcbiAgICAgICAgaXNMaXN0ZWQsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tQ2FjaGVbaWRdO1xuICB9XG5cbiAgcHVibGljIHJlc2V0KCkge1xuICAgIHRoaXMubUNhY2hlID0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzYXZlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAgIGlmICghdGhpcy5tQ2FjaGUpIHtcbiAgICAgIC8vIE5vdGhpbmcgdG8gc2F2ZS5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBzdGFnaW5nID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgY2FjaGVQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShzdGFnaW5nKSwgJ2NhY2hlJywgcHJvZmlsZUlkICsgJy5qc29uJyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGNhY2hlUGF0aCkpO1xuICAgICAgYXdhaXQgdXRpbC53cml0ZUZpbGVBdG9taWMoY2FjaGVQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLm1DYWNoZSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc2F2ZSBjYWNoZScsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8SVBha01hcD4ge1xuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3Qgc3RhZ2luZyA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShjYWNoZVBhdGgpKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNhY2hlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoIVsnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpKSB7XG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGxvYWQgY2FjaGUnLCBlcnIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNMT0xpc3RlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgcGFja2FnZUxpc3Q6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIGxvb2sgYXQgdGhlIGVuZCBvZiB0aGUgZmlyc3QgYml0IG9mIGRhdGEgdG8gc2VlIGlmIGl0IGhhcyBhIG1ldGEubHN4IGZpbGVcbiAgICAgIC8vIGV4YW1wbGUgJ01vZHMvU2FmZSBFZGl0aW9uL21ldGEubHN4XFx0MTc1OVxcdDAnXG4gICAgICBjb25zdCBjb250YWluc01ldGFGaWxlID0gcGFja2FnZUxpc3QuZmluZChsaW5lID0+IHBhdGguYmFzZW5hbWUobGluZS5zcGxpdCgnXFx0JylbMF0pLnRvTG93ZXJDYXNlKCkgPT09ICdtZXRhLmxzeCcpICE9PSB1bmRlZmluZWQgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgIC8vIGludmVydCByZXN1bHQgYXMgJ2xpc3RlZCcgbWVhbnMgaXQgZG9lc24ndCBjb250YWluIGEgbWV0YSBmaWxlLlxuICAgICAgcmV0dXJuICFjb250YWluc01ldGFGaWxlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICBtZXNzYWdlOiBgJHtwYXRoLmJhc2VuYW1lKHBha1BhdGgpfSBjb3VsZG4ndCBiZSByZWFkIGNvcnJlY3RseS4gVGhpcyBtb2QgYmUgaW5jb3JyZWN0bHkgbG9ja2VkL3VubG9ja2VkIGJ1dCB3aWxsIGRlZmF1bHQgdG8gdW5sb2NrZWQuYCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlOyAgICBcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbGVJZChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCkudG9VcHBlckNhc2UoKTtcbiAgfVxufVxuIl19