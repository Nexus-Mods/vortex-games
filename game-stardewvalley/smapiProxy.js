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
const vortex_api_1 = require("vortex-api");
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
                        .on('end', () => {
                        const textual = body.toString('utf8');
                        try {
                            const parsed = JSON.parse(textual);
                            resolve(parsed);
                        }
                        catch (err) {
                            (0, vortex_api_1.log)('error', 'failed to parse smapi response', textual);
                            reject(err);
                        }
                    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUUvQiwrQ0FBaUM7QUFDakMsMkNBQXdDO0FBQ3hDLHFDQUFtQztBQUNuQywyQ0FBbUQ7QUFFbkQsaUNBQStDO0FBRS9DLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQztBQUU5QixNQUFNLFVBQVU7SUFHZCxZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUc7WUFDZCxJQUFJLEVBQUUsVUFBVTtZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7YUFDbkM7U0FDRixDQUFDO0lBQ0osQ0FBQztJQUVZLElBQUksQ0FBQyxLQUFhOzs7WUFDN0IsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsMENBQUUsSUFBSSxNQUFLLFNBQVMsQ0FBQyxFQUFFO29CQUMvRCxPQUFPLEVBQUUsQ0FBQztpQkFDWDtnQkFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FB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QUFXLENBQUMsUUFBUSxFQUFFOzRCQUNyQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7NEJBQzdCLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFOzRCQUN6QixNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7eUJBQ2hDO3FCQUNGO2lCQUNGLENBQUMsQ0FBQzs7S0FDSjtDQUNGO0FBRUQsa0JBQWUsVUFBVSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUZpbGVJbmZvIH0gZnJvbSAnQG5leHVzbW9kcy9uZXh1cy1hcGknO1xyXG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XHJcbmltcG9ydCB7IElMb29rdXBSZXN1bHQsIElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgbG9nLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBTTUFQSV9JT19BUElfVkVSU0lPTiB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuaW1wb3J0IHsgSVNNQVBJSU9RdWVyeSwgSVNNQVBJUmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGNvZXJjZSwgc2VtdmVyQ29tcGFyZSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBTTUFQSV9IT1NUID0gJ3NtYXBpLmlvJztcclxuXHJcbmNsYXNzIFNNQVBJUHJveHkge1xyXG4gIHByaXZhdGUgbUFQSTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1PcHRpb25zOiBodHRwcy5SZXF1ZXN0T3B0aW9ucztcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFQSSA9IGFwaTtcclxuICAgIHRoaXMubU9wdGlvbnMgPSB7XHJcbiAgICAgIGhvc3Q6IFNNQVBJX0hPU1QsXHJcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICBwcm90b2NvbDogJ2h0dHBzOicsXHJcbiAgICAgIHBhdGg6ICcvYXBpL3YzLjAvbW9kcycsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBmaW5kKHF1ZXJ5OiBJUXVlcnkpOiBQcm9taXNlPElMb29rdXBSZXN1bHRbXT4ge1xyXG4gICAgaWYgKHF1ZXJ5Lm5hbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmZpbmRCeU5hbWVzKFt7IGlkOiBxdWVyeS5uYW1lIH1dKTtcclxuICAgICAgaWYgKChyZXMubGVuZ3RoID09PSAwKSB8fCAocmVzWzBdLm1ldGFkYXRhPy5tYWluID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZUtleShxdWVyeSk7XHJcbiAgICAgIGlmIChyZXNbMF0ubWV0YWRhdGEubmV4dXNJRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubG9va3VwT25OZXh1cyhcclxuICAgICAgICAgIHF1ZXJ5LCByZXNbMF0ubWV0YWRhdGEubmV4dXNJRCwgcmVzWzBdLm1ldGFkYXRhLm1haW4udmVyc2lvbik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIHsga2V5LCB2YWx1ZToge1xyXG4gICAgICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZmlsZU5hbWU6IHF1ZXJ5Lm5hbWUsXHJcbiAgICAgICAgICAgIGZpbGVTaXplQnl0ZXM6IDAsXHJcbiAgICAgICAgICAgIGZpbGVWZXJzaW9uOiAnJyxcclxuICAgICAgICAgICAgc291cmNlVVJJOiByZXNbMF0ubWV0YWRhdGEubWFpbj8udXJsLFxyXG4gICAgICAgICAgfSB9LFxyXG4gICAgICAgIF07XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBmaW5kQnlOYW1lcyhxdWVyeTogSVNNQVBJSU9RdWVyeVtdKTogUHJvbWlzZTxJU01BUElSZXN1bHRbXT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdCh0aGlzLm1PcHRpb25zLCByZXMgPT4ge1xyXG4gICAgICAgIGxldCBib2R5ID0gQnVmZmVyLmZyb20oW10pO1xyXG4gICAgICAgIHJlc1xyXG4gICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgICAgIC5vbignZGF0YScsIGNodW5rID0+IHtcclxuICAgICAgICAgICAgYm9keSA9IEJ1ZmZlci5jb25jYXQoW2JvZHksIGNodW5rXSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHR1YWwgPSBib2R5LnRvU3RyaW5nKCd1dGY4Jyk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0ZXh0dWFsKTtcclxuICAgICAgICAgICAgICByZXNvbHZlKHBhcnNlZCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIHNtYXBpIHJlc3BvbnNlJywgdGV4dHVhbCk7XHJcbiAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9KVxyXG4gICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXHJcbiAgICAgIHJlcS53cml0ZShKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbW9kczogcXVlcnksXHJcbiAgICAgICAgaW5jbHVkZUV4dGVuZGVkTWV0YWRhdGE6IHRydWUsXHJcbiAgICAgICAgYXBpVmVyc2lvbjogU01BUElfSU9fQVBJX1ZFUlNJT04sXHJcbiAgICAgIH0pKTtcclxuICAgICAgcmVxLmVuZCgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1ha2VLZXkocXVlcnk6IElRdWVyeSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYHNtYXBpbzoke3F1ZXJ5Lm5hbWV9OiR7cXVlcnkudmVyc2lvbk1hdGNofWA7ICAgIFxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBsb29rdXBPbk5leHVzKHF1ZXJ5OiBJUXVlcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHVzSWQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogc3RyaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SUxvb2t1cFJlc3VsdFtdPiB7XHJcbiAgICBhd2FpdCB0aGlzLm1BUEkuZXh0LmVuc3VyZUxvZ2dlZEluKCk7XHJcblxyXG4gICAgY29uc3QgZmlsZXM6IElGaWxlSW5mb1tdID0gYXdhaXQgdGhpcy5tQVBJLmV4dC5uZXh1c0dldE1vZEZpbGVzPy4oR0FNRV9JRCwgbmV4dXNJZCkgPz8gW107XHJcblxyXG4gICAgY29uc3QgdmVyc2lvblBhdHRlcm4gPSBgPj0ke3ZlcnNpb259YDtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gZmlsZXNcclxuICAgICAgLmZpbHRlcihpdGVyID0+IHNlbXZlci5zYXRpc2ZpZXMoY29lcmNlKGl0ZXIudmVyc2lvbiksIHZlcnNpb25QYXR0ZXJuKSlcclxuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXJDb21wYXJlKHJocy52ZXJzaW9uLCBsaHMudmVyc2lvbikpWzBdO1xyXG5cclxuICAgIGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBmaWxlIGZvdW5kJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gW3tcclxuICAgICAga2V5OiB0aGlzLm1ha2VLZXkocXVlcnkpLFxyXG4gICAgICB2YWx1ZToge1xyXG4gICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcclxuICAgICAgICBmaWxlTmFtZTogZmlsZS5maWxlX25hbWUsXHJcbiAgICAgICAgZmlsZVNpemVCeXRlczogZmlsZS5zaXplICogMTAyNCxcclxuICAgICAgICBmaWxlVmVyc2lvbjogZmlsZS52ZXJzaW9uLFxyXG4gICAgICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgICAgICBzb3VyY2VVUkk6IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvJHtuZXh1c0lkfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gLFxyXG4gICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogcXVlcnkubmFtZS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgIHNvdXJjZTogJ25leHVzJyxcclxuICAgICAgICBkb21haW5OYW1lOiBHQU1FX0lELFxyXG4gICAgICAgIGRldGFpbHM6IHtcclxuICAgICAgICAgIGNhdGVnb3J5OiBmaWxlLmNhdGVnb3J5X2lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogZmlsZS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgIG1vZElkOiBuZXh1c0lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICBmaWxlSWQ6IGZpbGUuZmlsZV9pZC50b1N0cmluZygpLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH1dO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU01BUElQcm94eTtcclxuIl19