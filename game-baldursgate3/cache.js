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
                if (packageList.length === 0) {
                    return this.getCacheEntry(api, filePath, mod);
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJDQUE2RDtBQUU3RCxxQ0FBbUM7QUFDbkMsbURBQThDO0FBRTlDLGlDQUE0QztBQVk1QyxNQUFxQixZQUFZO0lBRXhCLE1BQU0sQ0FBQyxXQUFXO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztTQUM1QztRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBR0Q7UUFDRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRVksYUFBYSxDQUFDLEdBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLEdBQWdCOztZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDcEM7WUFDRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLElBQUksS0FBYSxDQUFDO1lBQ2xCLElBQUk7Z0JBQ0YsTUFBTSxJQUFJLEdBQUcsZUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDOUI7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ3BCO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssU0FBUyxDQUFDO21CQUM1QixD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T0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9DLENBQUM7O0FBN0dILCtCQThHQztBQTdHZ0IscUJBQVEsR0FBaUIsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgbGlzdFBhY2thZ2UgfSBmcm9tICcuL2RpdmluZVdyYXBwZXInO1xyXG5pbXBvcnQgeyBJUGFrSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBleHRyYWN0UGFrSW5mb0ltcGwgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQ2FjaGVFbnRyeSB7XHJcbiAgbGFzdE1vZGlmaWVkOiBudW1iZXI7XHJcbiAgaW5mbzogSVBha0luZm87XHJcbiAgZmlsZU5hbWU6IHN0cmluZztcclxuICBwYWNrYWdlTGlzdDogc3RyaW5nW107XHJcbiAgaXNMaXN0ZWQ6IGJvb2xlYW47XHJcbiAgbW9kPzogdHlwZXMuSU1vZDtcclxufVxyXG5cclxudHlwZSBJUGFrTWFwID0geyBbZmlsZVBhdGg6IHN0cmluZ106IElDYWNoZUVudHJ5IH07XHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBha0luZm9DYWNoZSB7XHJcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IFBha0luZm9DYWNoZSA9IG51bGw7XHJcbiAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBQYWtJbmZvQ2FjaGUge1xyXG4gICAgaWYgKCFQYWtJbmZvQ2FjaGUuaW5zdGFuY2UpIHtcclxuICAgICAgUGFrSW5mb0NhY2hlLmluc3RhbmNlID0gbmV3IFBha0luZm9DYWNoZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQYWtJbmZvQ2FjaGUuaW5zdGFuY2U7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1DYWNoZTogSVBha01hcDtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMubUNhY2hlID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBnZXRDYWNoZUVudHJ5KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZD86IHR5cGVzLklNb2QpOiBQcm9taXNlPElDYWNoZUVudHJ5PiB7XHJcbiAgICBpZiAoIXRoaXMubUNhY2hlKSB7IFxyXG4gICAgICB0aGlzLm1DYWNoZSA9IGF3YWl0IHRoaXMubG9hZChhcGkpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaWQgPSB0aGlzLmZpbGVJZChmaWxlUGF0aCk7XHJcbiAgICBsZXQgbXRpbWU6IG51bWJlcjtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhmaWxlUGF0aCk7XHJcbiAgICAgIG10aW1lID0gTnVtYmVyKHN0YXQubXRpbWVNcyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbXRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgfVxyXG4gICAgaWYgKCh0aGlzLm1DYWNoZVtpZF0gPT09IHVuZGVmaW5lZClcclxuICAgICAgICB8fCAobXRpbWUgIT09IHRoaXMubUNhY2hlW2lkXS5sYXN0TW9kaWZpZWRcclxuICAgICAgICB8fCAodGhpcy5tQ2FjaGVbaWRdLnBhY2thZ2VMaXN0Lmxlbmd0aCA9PT0gMCkpKSB7XHJcbiAgICAgIGNvbnN0IHBhY2thZ2VMaXN0ID0gYXdhaXQgbGlzdFBhY2thZ2UoYXBpLCBmaWxlUGF0aCk7XHJcbiAgICAgIGlmIChwYWNrYWdlTGlzdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyBHdWVzcyB3ZSBuZWVkIHRvIHRyeSBhZ2Fpbi4uLlxyXG4gICAgICAgIHJldHVybiB0aGlzLmdldENhY2hlRW50cnkoYXBpLCBmaWxlUGF0aCwgbW9kKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBpc0xpc3RlZCA9IHRoaXMuaXNMT0xpc3RlZChhcGksIGZpbGVQYXRoLCBwYWNrYWdlTGlzdCk7XHJcbiAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBleHRyYWN0UGFrSW5mb0ltcGwoYXBpLCBmaWxlUGF0aCwgbW9kLCBpc0xpc3RlZCk7XHJcbiAgICAgIHRoaXMubUNhY2hlW2lkXSA9IHtcclxuICAgICAgICBmaWxlTmFtZTogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXHJcbiAgICAgICAgbGFzdE1vZGlmaWVkOiBtdGltZSxcclxuICAgICAgICBpbmZvLFxyXG4gICAgICAgIHBhY2thZ2VMaXN0LFxyXG4gICAgICAgIG1vZCxcclxuICAgICAgICBpc0xpc3RlZCxcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm1DYWNoZVtpZF07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXQoKSB7XHJcbiAgICB0aGlzLm1DYWNoZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc2F2ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIGlmICghdGhpcy5tQ2FjaGUpIHtcclxuICAgICAgLy8gTm90aGluZyB0byBzYXZlLlxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBzdGFnaW5nID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBjYWNoZVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHN0YWdpbmcpLCAnY2FjaGUnLCBwcm9maWxlSWQgKyAnLmpzb24nKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGNhY2hlUGF0aCkpO1xyXG4gICAgICBhd2FpdCB1dGlsLndyaXRlRmlsZUF0b21pYyhjYWNoZVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMubUNhY2hlKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc2F2ZSBjYWNoZScsIGVycik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgbG9hZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElQYWtNYXA+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoY2FjaGVQYXRoKSk7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNhY2hlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBpZiAoIVsnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpKSB7XHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbG9hZCBjYWNoZScsIGVycik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHt9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpc0xPTGlzdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBwYWNrYWdlTGlzdDogc3RyaW5nW10pOiBib29sZWFuIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIGxvb2sgYXQgdGhlIGVuZCBvZiB0aGUgZmlyc3QgYml0IG9mIGRhdGEgdG8gc2VlIGlmIGl0IGhhcyBhIG1ldGEubHN4IGZpbGVcclxuICAgICAgLy8gZXhhbXBsZSAnTW9kcy9TYWZlIEVkaXRpb24vbWV0YS5sc3hcXHQxNzU5XFx0MCdcclxuICAgICAgY29uc3QgY29udGFpbnNNZXRhRmlsZSA9IHBhY2thZ2VMaXN0LmZpbmQobGluZSA9PiBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKSAhPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGZhbHNlO1xyXG5cclxuICAgICAgLy8gaW52ZXJ0IHJlc3VsdCBhcyAnbGlzdGVkJyBtZWFucyBpdCBkb2Vzbid0IGNvbnRhaW4gYSBtZXRhIGZpbGUuXHJcbiAgICAgIHJldHVybiAhY29udGFpbnNNZXRhRmlsZTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgdHlwZTogJ2Vycm9yJyxcclxuICAgICAgICBtZXNzYWdlOiBgJHtwYXRoLmJhc2VuYW1lKHBha1BhdGgpfSBjb3VsZG4ndCBiZSByZWFkIGNvcnJlY3RseS4gVGhpcyBtb2QgYmUgaW5jb3JyZWN0bHkgbG9ja2VkL3VubG9ja2VkIGJ1dCB3aWxsIGRlZmF1bHQgdG8gdW5sb2NrZWQuYCxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBmYWxzZTsgICAgXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZpbGVJZChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKS50b1VwcGVyQ2FzZSgpO1xyXG4gIH1cclxufVxyXG4iXX0=
