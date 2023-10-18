"use strict";
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
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const path_1 = __importDefault(require("path"));
class DependencyManager {
    constructor(api) {
        this.mLoading = false;
        this.mApi = api;
    }
    getManifests() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.scanManifests();
            return this.mManifests;
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mLoading) {
                return;
            }
            this.mLoading = true;
            yield this.scanManifests(true);
            this.mLoading = false;
        });
    }
    scanManifests(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!force && this.mManifests !== undefined) {
                return;
            }
            const state = this.mApi.getState();
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
            const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
            const manifests = yield Object.values(mods).reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
                const accum = yield accumP;
                if (!isActive(iter.id)) {
                    return Promise.resolve(accum);
                }
                const modPath = path_1.default.join(staging, iter.installationPath);
                return (0, turbowalk_1.default)(modPath, (entries) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    for (const entry of entries) {
                        if (path_1.default.basename(entry.filePath) === 'manifest.json') {
                            let manifest;
                            try {
                                manifest = yield (0, util_1.parseManifest)(entry.filePath);
                            }
                            catch (err) {
                                (0, vortex_api_1.log)('error', 'failed to parse manifest', { error: err.message, manifest: entry.filePath });
                                continue;
                            }
                            const list = (_a = accum[iter.id]) !== null && _a !== void 0 ? _a : [];
                            list.push(manifest);
                            accum[iter.id] = list;
                        }
                    }
                }), { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
                    .then(() => Promise.resolve(accum))
                    .catch(err => {
                    if (err['code'] === 'ENOENT') {
                        return Promise.resolve([]);
                    }
                    else {
                        return Promise.reject(err);
                    }
                });
            }), {});
            this.mManifests = manifests;
            return Promise.resolve();
        });
    }
}
exports.default = DependencyManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLDBEQUFrQztBQUNsQywyQ0FBeUQ7QUFDekQscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFHeEIsTUFBcUIsaUJBQWlCO0lBS3BDLFlBQVksR0FBd0I7UUFGNUIsYUFBUSxHQUFZLEtBQUssQ0FBQztRQUdoQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUNsQixDQUFDO0lBRVksWUFBWTs7WUFDdkIsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVZLE9BQU87O1lBQ2xCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDakIsT0FBTzthQUNSO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDckIsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLENBQUM7S0FBQTtJQUVZLGFBQWEsQ0FBQyxLQUFlOztZQUN4QyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUMzQyxPQUFPO2FBQ1I7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztZQUM3RCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDckUsTUFBTSxPQUFPLEdBQUcs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cGVzJztcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcbmltcG9ydCB7IGxvZywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcblxuaW1wb3J0IHsgcGFyc2VNYW5pZmVzdCB9IGZyb20gJy4vdXRpbCc7XG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG50eXBlIE1hbmlmZXN0TWFwID0geyBbbW9kSWQ6IHN0cmluZ106IElTRFZNb2RNYW5pZmVzdFtdIH07XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXBlbmRlbmN5TWFuYWdlciB7XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHJpdmF0ZSBtTWFuaWZlc3RzOiBNYW5pZmVzdE1hcDtcbiAgcHJpdmF0ZSBtTG9hZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAgIHRoaXMubUFwaSA9IGFwaTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBnZXRNYW5pZmVzdHMoKTogUHJvbWlzZTxNYW5pZmVzdE1hcD4ge1xuICAgIGF3YWl0IHRoaXMuc2Nhbk1hbmlmZXN0cygpO1xuICAgIHJldHVybiB0aGlzLm1NYW5pZmVzdHM7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5tTG9hZGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1Mb2FkaW5nID0gdHJ1ZTtcbiAgICBhd2FpdCB0aGlzLnNjYW5NYW5pZmVzdHModHJ1ZSk7XG4gICAgdGhpcy5tTG9hZGluZyA9IGZhbHNlO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHNjYW5NYW5pZmVzdHMoZm9yY2U/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLm1NYW5pZmVzdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICAgIGNvbnN0IGlzQWN0aXZlID0gKG1vZElkOiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKTtcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gICAgY29uc3QgbWFuaWZlc3RzID0gYXdhaXQgT2JqZWN0LnZhbHVlcyhtb2RzKS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xuICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7ICAgICAgXG4gICAgICBpZiAoIWlzQWN0aXZlKGl0ZXIuaWQpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICAgICAgfVxuICAgICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihzdGFnaW5nLCBpdGVyLmluc3RhbGxhdGlvblBhdGgpO1xuICAgICAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09ICdtYW5pZmVzdC5qc29uJykge1xuICAgICAgICAgIGxldCBtYW5pZmVzdDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbWFuaWZlc3QgPSBhd2FpdCBwYXJzZU1hbmlmZXN0KGVudHJ5LmZpbGVQYXRoKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBlcnJvcjogZXJyLm1lc3NhZ2UsIG1hbmlmZXN0OiBlbnRyeS5maWxlUGF0aCB9KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBsaXN0ID0gYWNjdW1baXRlci5pZF0gPz8gW107XG4gICAgICAgICAgbGlzdC5wdXNoKG1hbmlmZXN0KTtcbiAgICAgICAgICBhY2N1bVtpdGVyLmlkXSA9IGxpc3Q7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZX0pXG4gICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoYWNjdW0pKVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGlmIChlcnJbJ2NvZGUnXSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwge30pO1xuICAgIHRoaXMubU1hbmlmZXN0cyA9IG1hbmlmZXN0cztcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cbiJdfQ==