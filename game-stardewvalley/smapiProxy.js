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
            const files = (_c = yield ((_b = (_a = this.mAPI.ext).nexusGetModFiles) === null || _b === void 0 ? void 0 : _b.call(_a, common_1.GAME_ID, nexusId))) !== null && _c !== void 0 ? _c : [];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUUvQiwrQ0FBaUM7QUFFakMscUNBQW1DO0FBQ25DLDJDQUFtRDtBQUVuRCxpQ0FBK0M7QUFFL0MsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBRTlCLE1BQU0sVUFBVTtJQUdkLFlBQVksR0FBd0I7UUFDbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNkLElBQUksRUFBRSxVQUFVO1lBQ2hCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztTQUNGLENBQUM7SUFDSixDQUFDO0lBRVksSUFBSSxDQUFDLEtBQWE7OztZQUM3QixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUM1QixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSwwQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7b0JBQy9ELE9BQU8sRUFBRSxDQUFDO2lCQUNYO2dCQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxP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ZUluZm8gfSBmcm9tICdAbmV4dXNtb2RzL25leHVzLWFwaSc7XHJcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcclxuaW1wb3J0IHsgSUxvb2t1cFJlc3VsdCwgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBTTUFQSV9JT19BUElfVkVSU0lPTiB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuaW1wb3J0IHsgSVNNQVBJSU9RdWVyeSwgSVNNQVBJUmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGNvZXJjZSwgc2VtdmVyQ29tcGFyZSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBTTUFQSV9IT1NUID0gJ3NtYXBpLmlvJztcclxuXHJcbmNsYXNzIFNNQVBJUHJveHkge1xyXG4gIHByaXZhdGUgbUFQSTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1PcHRpb25zOiBodHRwcy5SZXF1ZXN0T3B0aW9ucztcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFQSSA9IGFwaTtcclxuICAgIHRoaXMubU9wdGlvbnMgPSB7XHJcbiAgICAgIGhvc3Q6IFNNQVBJX0hPU1QsXHJcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICBwcm90b2NvbDogJ2h0dHBzOicsXHJcbiAgICAgIHBhdGg6ICcvYXBpL3YzLjAvbW9kcycsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBmaW5kKHF1ZXJ5OiBJUXVlcnkpOiBQcm9taXNlPElMb29rdXBSZXN1bHRbXT4ge1xyXG4gICAgaWYgKHF1ZXJ5Lm5hbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmZpbmRCeU5hbWVzKFt7IGlkOiBxdWVyeS5uYW1lIH1dKTtcclxuICAgICAgaWYgKChyZXMubGVuZ3RoID09PSAwKSB8fCAocmVzWzBdLm1ldGFkYXRhPy5tYWluID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZUtleShxdWVyeSk7XHJcbiAgICAgIGlmIChyZXNbMF0ubWV0YWRhdGEubmV4dXNJRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubG9va3VwT25OZXh1cyhcclxuICAgICAgICAgIHF1ZXJ5LCByZXNbMF0ubWV0YWRhdGEubmV4dXNJRCwgcmVzWzBdLm1ldGFkYXRhLm1haW4udmVyc2lvbik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIHsga2V5LCB2YWx1ZToge1xyXG4gICAgICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZmlsZU5hbWU6IHF1ZXJ5Lm5hbWUsXHJcbiAgICAgICAgICAgIGZpbGVTaXplQnl0ZXM6IDAsXHJcbiAgICAgICAgICAgIGZpbGVWZXJzaW9uOiAnJyxcclxuICAgICAgICAgICAgc291cmNlVVJJOiByZXNbMF0ubWV0YWRhdGEubWFpbj8udXJsLFxyXG4gICAgICAgICAgfSB9LFxyXG4gICAgICAgIF07XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBmaW5kQnlOYW1lcyhxdWVyeTogSVNNQVBJSU9RdWVyeVtdKTogUHJvbWlzZTxJU01BUElSZXN1bHRbXT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdCh0aGlzLm1PcHRpb25zLCByZXMgPT4ge1xyXG4gICAgICAgIGxldCBib2R5ID0gQnVmZmVyLmZyb20oW10pO1xyXG4gICAgICAgIHJlc1xyXG4gICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgICAgIC5vbignZGF0YScsIGNodW5rID0+IHtcclxuICAgICAgICAgICAgYm9keSA9IEJ1ZmZlci5jb25jYXQoW2JvZHksIGNodW5rXSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKEpTT04ucGFyc2UoYm9keS50b1N0cmluZygndXRmOCcpKSkpO1xyXG4gICAgICB9KVxyXG4gICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXHJcbiAgICAgIHJlcS53cml0ZShKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbW9kczogcXVlcnksXHJcbiAgICAgICAgaW5jbHVkZUV4dGVuZGVkTWV0YWRhdGE6IHRydWUsXHJcbiAgICAgICAgYXBpVmVyc2lvbjogU01BUElfSU9fQVBJX1ZFUlNJT04sXHJcbiAgICAgIH0pKTtcclxuICAgICAgcmVxLmVuZCgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1ha2VLZXkocXVlcnk6IElRdWVyeSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYHNtYXBpbzoke3F1ZXJ5Lm5hbWV9OiR7cXVlcnkudmVyc2lvbk1hdGNofWA7ICAgIFxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBsb29rdXBPbk5leHVzKHF1ZXJ5OiBJUXVlcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHVzSWQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogc3RyaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SUxvb2t1cFJlc3VsdFtdPiB7XHJcbiAgICBhd2FpdCB0aGlzLm1BUEkuZXh0LmVuc3VyZUxvZ2dlZEluKCk7XHJcblxyXG4gICAgY29uc3QgZmlsZXM6IElGaWxlSW5mb1tdID0gYXdhaXQgdGhpcy5tQVBJLmV4dC5uZXh1c0dldE1vZEZpbGVzPy4oR0FNRV9JRCwgbmV4dXNJZCkgPz8gW107XHJcblxyXG4gICAgY29uc3QgdmVyc2lvblBhdHRlcm4gPSBgPj0ke3ZlcnNpb259YDtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gZmlsZXNcclxuICAgICAgLmZpbHRlcihpdGVyID0+IHNlbXZlci5zYXRpc2ZpZXMoY29lcmNlKGl0ZXIudmVyc2lvbiksIHZlcnNpb25QYXR0ZXJuKSlcclxuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXJDb21wYXJlKHJocy52ZXJzaW9uLCBsaHMudmVyc2lvbikpWzBdO1xyXG5cclxuICAgIGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBmaWxlIGZvdW5kJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gW3tcclxuICAgICAga2V5OiB0aGlzLm1ha2VLZXkocXVlcnkpLFxyXG4gICAgICB2YWx1ZToge1xyXG4gICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcclxuICAgICAgICBmaWxlTmFtZTogZmlsZS5maWxlX25hbWUsXHJcbiAgICAgICAgZmlsZVNpemVCeXRlczogZmlsZS5zaXplICogMTAyNCxcclxuICAgICAgICBmaWxlVmVyc2lvbjogZmlsZS52ZXJzaW9uLFxyXG4gICAgICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgICAgICBzb3VyY2VVUkk6IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvJHtuZXh1c0lkfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gLFxyXG4gICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogcXVlcnkubmFtZS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgIHNvdXJjZTogJ25leHVzJyxcclxuICAgICAgICBkb21haW5OYW1lOiBHQU1FX0lELFxyXG4gICAgICAgIGRldGFpbHM6IHtcclxuICAgICAgICAgIGNhdGVnb3J5OiBmaWxlLmNhdGVnb3J5X2lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogZmlsZS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgIG1vZElkOiBuZXh1c0lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICBmaWxlSWQ6IGZpbGUuZmlsZV9pZC50b1N0cmluZygpLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH1dO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU01BUElQcm94eTtcclxuIl19