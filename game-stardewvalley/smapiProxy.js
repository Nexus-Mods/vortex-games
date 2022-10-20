"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const https = __importStar(require("https"));
const semver = __importStar(require("semver"));
const common_1 = require("./common");
const constants_1 = require("./constants");
const util_1 = require("./util");
const SMAPI_HOST = 'smapi.io';
class SMAPIProxy {
    constructor(api) {
        this.mAPI = api;
        this.mOptions = {
            host: SMAPI_HOST,
            method: 'POST',
            protocol: 'https:',
            path: '/api/v3.0/mods',
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }
    find(query) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (query.name !== undefined) {
                const res = yield this.findByNames([{ id: query.name }]);
                if ((res.length === 0) || (((_a = res[0].metadata) === null || _a === void 0 ? void 0 : _a.main) === undefined)) {
                    return [];
                }
                const key = this.makeKey(query);
                if (res[0].metadata.nexusID !== undefined) {
                    return yield this.lookupOnNexus(query, res[0].metadata.nexusID, res[0].metadata.main.version);
                }
                else {
                    console.log('returning third-party dependency info');
                    return [
                        { key, value: {
                                gameId: common_1.GAME_ID,
                                fileMD5: undefined,
                                fileName: query.name,
                                fileSizeBytes: 0,
                                fileVersion: '',
                                sourceURI: (_b = res[0].metadata.main) === null || _b === void 0 ? void 0 : _b.url,
                            } },
                    ];
                }
            }
            else {
                return [];
            }
        });
    }
    findByNames(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const req = https.request(this.mOptions, res => {
                    let body = Buffer.from([]);
                    res
                        .on('error', err => reject(err))
                        .on('data', chunk => {
                        body = Buffer.concat([body, chunk]);
                    })
                        .on('end', () => resolve(JSON.parse(body.toString('utf8'))));
                })
                    .on('error', err => reject(err));
                req.write(JSON.stringify({
                    mods: query,
                    includeExtendedMetadata: true,
                    apiVersion: constants_1.SMAPI_IO_API_VERSION,
                }));
                req.end();
            });
        });
    }
    makeKey(query) {
        return `smapio:${query.name}:${query.versionMatch}`;
    }
    lookupOnNexus(query, nexusId, version) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mAPI.ext.ensureLoggedIn();
            const files = (_c = (_b = (_a = this.mAPI.ext).nexusGetModFiles) === null || _b === void 0 ? void 0 : _b.call(_a, common_1.GAME_ID, nexusId)) !== null && _c !== void 0 ? _c : [];
            const versionPattern = `>=${version}`;
            const file = files
                .filter(iter => semver.satisfies((0, util_1.coerce)(iter.version), versionPattern))
                .sort((lhs, rhs) => (0, util_1.semverCompare)(rhs.version, lhs.version))[0];
            if (file === undefined) {
                throw new Error('no file found');
            }
            return [{
                    key: this.makeKey(query),
                    value: {
                        fileMD5: undefined,
                        fileName: file.file_name,
                        fileSizeBytes: file.size * 1024,
                        fileVersion: file.version,
                        gameId: common_1.GAME_ID,
                        sourceURI: `nxm://${common_1.GAME_ID}/mods/${nexusId}/files/${file.file_id}`,
                        logicalFileName: query.name.toLowerCase(),
                        source: 'nexus',
                        domainName: common_1.GAME_ID,
                        details: {
                            category: file.category_id.toString(),
                            description: file.description,
                            modId: nexusId.toString(),
                            fileId: file.file_id.toString(),
                        }
                    },
                }];
        });
    }
}
exports.default = SMAPIProxy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBRS9CLCtDQUFpQztBQUVqQyxxQ0FBbUM7QUFDbkMsMkNBQW1EO0FBRW5ELGlDQUErQztBQUUvQyxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFFOUIsTUFBTSxVQUFVO0lBR2QsWUFBWSxHQUF3QjtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsUUFBUSxHQUFHO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsTUFBTSxFQUFFLE1BQU07WUFDZCxRQUFRLEVBQUUsUUFBUTtZQUNsQixJQUFJLEVBQUUsZ0JBQWdCO1lBQ3RCLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2FBQ25DO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFFWSxJQUFJLENBQUMsS0FBYTs7O1lBQzdCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxNQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLDBDQUFFLElBQUksTUFBSyxTQUFTLENBQUMsRUFBRTtvQkFDL0QsT0FBTyxFQUFFLENBQUM7aUJBQ1g7Z0JBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8s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c0NvbnRlbnQiOlsiaW1wb3J0IHsgSUZpbGVJbmZvIH0gZnJvbSAnQG5leHVzbW9kcy9uZXh1cy1hcGknO1xyXG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XHJcbmltcG9ydCB7IElMb29rdXBSZXN1bHQsIElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgU01BUElfSU9fQVBJX1ZFUlNJT04gfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcbmltcG9ydCB7IElTTUFQSUlPUXVlcnksIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBjb2VyY2UsIHNlbXZlckNvbXBhcmUgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgU01BUElfSE9TVCA9ICdzbWFwaS5pbyc7XHJcblxyXG5jbGFzcyBTTUFQSVByb3h5IHtcclxuICBwcml2YXRlIG1BUEk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtT3B0aW9uczogaHR0cHMuUmVxdWVzdE9wdGlvbnM7XHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BUEkgPSBhcGk7XHJcbiAgICB0aGlzLm1PcHRpb25zID0ge1xyXG4gICAgICBob3N0OiBTTUFQSV9IT1NULFxyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgcHJvdG9jb2w6ICdodHRwczonLFxyXG4gICAgICBwYXRoOiAnL2FwaS92My4wL21vZHMnLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZmluZChxdWVyeTogSVF1ZXJ5KTogUHJvbWlzZTxJTG9va3VwUmVzdWx0W10+IHtcclxuICAgIGlmIChxdWVyeS5uYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5maW5kQnlOYW1lcyhbeyBpZDogcXVlcnkubmFtZSB9XSk7XHJcbiAgICAgIGlmICgocmVzLmxlbmd0aCA9PT0gMCkgfHwgKHJlc1swXS5tZXRhZGF0YT8ubWFpbiA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBrZXkgPSB0aGlzLm1ha2VLZXkocXVlcnkpO1xyXG4gICAgICBpZiAocmVzWzBdLm1ldGFkYXRhLm5leHVzSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmxvb2t1cE9uTmV4dXMoXHJcbiAgICAgICAgICBxdWVyeSwgcmVzWzBdLm1ldGFkYXRhLm5leHVzSUQsIHJlc1swXS5tZXRhZGF0YS5tYWluLnZlcnNpb24pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdyZXR1cm5pbmcgdGhpcmQtcGFydHkgZGVwZW5kZW5jeSBpbmZvJyk7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIHsga2V5LCB2YWx1ZToge1xyXG4gICAgICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZmlsZU5hbWU6IHF1ZXJ5Lm5hbWUsXHJcbiAgICAgICAgICAgIGZpbGVTaXplQnl0ZXM6IDAsXHJcbiAgICAgICAgICAgIGZpbGVWZXJzaW9uOiAnJyxcclxuICAgICAgICAgICAgc291cmNlVVJJOiByZXNbMF0ubWV0YWRhdGEubWFpbj8udXJsLFxyXG4gICAgICAgICAgfSB9LFxyXG4gICAgICAgIF07XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBmaW5kQnlOYW1lcyhxdWVyeTogSVNNQVBJSU9RdWVyeVtdKTogUHJvbWlzZTxJU01BUElSZXN1bHRbXT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdCh0aGlzLm1PcHRpb25zLCByZXMgPT4ge1xyXG4gICAgICAgIGxldCBib2R5ID0gQnVmZmVyLmZyb20oW10pO1xyXG4gICAgICAgIHJlc1xyXG4gICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgICAgIC5vbignZGF0YScsIGNodW5rID0+IHtcclxuICAgICAgICAgICAgYm9keSA9IEJ1ZmZlci5jb25jYXQoW2JvZHksIGNodW5rXSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKEpTT04ucGFyc2UoYm9keS50b1N0cmluZygndXRmOCcpKSkpO1xyXG4gICAgICB9KVxyXG4gICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXHJcbiAgICAgIHJlcS53cml0ZShKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbW9kczogcXVlcnksXHJcbiAgICAgICAgaW5jbHVkZUV4dGVuZGVkTWV0YWRhdGE6IHRydWUsXHJcbiAgICAgICAgYXBpVmVyc2lvbjogU01BUElfSU9fQVBJX1ZFUlNJT04sXHJcbiAgICAgIH0pKTtcclxuICAgICAgcmVxLmVuZCgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1ha2VLZXkocXVlcnk6IElRdWVyeSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYHNtYXBpbzoke3F1ZXJ5Lm5hbWV9OiR7cXVlcnkudmVyc2lvbk1hdGNofWA7ICAgIFxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBsb29rdXBPbk5leHVzKHF1ZXJ5OiBJUXVlcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHVzSWQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogc3RyaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SUxvb2t1cFJlc3VsdFtdPiB7XHJcbiAgICBhd2FpdCB0aGlzLm1BUEkuZXh0LmVuc3VyZUxvZ2dlZEluKCk7XHJcblxyXG4gICAgY29uc3QgZmlsZXM6IElGaWxlSW5mb1tdID0gdGhpcy5tQVBJLmV4dC5uZXh1c0dldE1vZEZpbGVzPy4oR0FNRV9JRCwgbmV4dXNJZCkgPz8gW107XHJcblxyXG4gICAgY29uc3QgdmVyc2lvblBhdHRlcm4gPSBgPj0ke3ZlcnNpb259YDtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gZmlsZXNcclxuICAgICAgLmZpbHRlcihpdGVyID0+IHNlbXZlci5zYXRpc2ZpZXMoY29lcmNlKGl0ZXIudmVyc2lvbiksIHZlcnNpb25QYXR0ZXJuKSlcclxuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXJDb21wYXJlKHJocy52ZXJzaW9uLCBsaHMudmVyc2lvbikpWzBdO1xyXG5cclxuICAgIGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBmaWxlIGZvdW5kJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gW3tcclxuICAgICAga2V5OiB0aGlzLm1ha2VLZXkocXVlcnkpLFxyXG4gICAgICB2YWx1ZToge1xyXG4gICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcclxuICAgICAgICBmaWxlTmFtZTogZmlsZS5maWxlX25hbWUsXHJcbiAgICAgICAgZmlsZVNpemVCeXRlczogZmlsZS5zaXplICogMTAyNCxcclxuICAgICAgICBmaWxlVmVyc2lvbjogZmlsZS52ZXJzaW9uLFxyXG4gICAgICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgICAgICBzb3VyY2VVUkk6IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvJHtuZXh1c0lkfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gLFxyXG4gICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogcXVlcnkubmFtZS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgIHNvdXJjZTogJ25leHVzJyxcclxuICAgICAgICBkb21haW5OYW1lOiBHQU1FX0lELFxyXG4gICAgICAgIGRldGFpbHM6IHtcclxuICAgICAgICAgIGNhdGVnb3J5OiBmaWxlLmNhdGVnb3J5X2lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogZmlsZS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgIG1vZElkOiBuZXh1c0lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICBmaWxlSWQ6IGZpbGUuZmlsZV9pZC50b1N0cmluZygpLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH1dO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU01BUElQcm94eTtcclxuIl19