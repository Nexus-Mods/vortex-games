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
const common_1 = require("./common");
const constants_1 = require("./constants");
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
        return __awaiter(this, void 0, void 0, function* () {
            const file = (yield this.mAPI.emitAndAwait('get-latest-file', nexusId, common_1.GAME_ID, `>=${version}`))[0];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBRy9CLHFDQUFtQztBQUNuQywyQ0FBbUQ7QUFHbkQsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBRTlCLE1BQU0sVUFBVTtJQUdkLFlBQVksR0FBd0I7UUFDbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNkLElBQUksRUFBRSxVQUFVO1lBQ2hCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztTQUNGLENBQUM7SUFDSixDQUFDO0lBRVksSUFBSSxDQUFDLEtBQWE7OztZQUM3QixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUM1QixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSwwQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7b0JBQy9ELE9BQU8sRUFBRSxDQUFDO2lCQUNYO2dCQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO29CQUN6QyxPQUFP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QUNsQixRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVM7d0JBQ3hCLGFBQWEsRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUk7d0JBQy9CLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTzt3QkFDekIsTUFBTSxFQUFFLGdCQUFPO3dCQUNmLFNBQVMsRUFBRSxTQUFTLGdCQUFPLFNBQVMsT0FBTyxVQUFVLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ25FLGVBQWUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTt3QkFDekMsTUFBTSxFQUFFLE9BQU87d0JBQ2YsVUFBVSxFQUFFLGdCQUFPO3dCQUNuQixPQUFPLEVBQUU7NEJBQ1AsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFOzRCQUNyQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7NEJBQzdCLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFOzRCQUN6QixNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7eUJBQ2hDO3FCQUNGO2lCQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FBQTtDQUNGO0FBRUQsa0JBQWUsVUFBVSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUZpbGVJbmZvIH0gZnJvbSAnQG5leHVzbW9kcy9uZXh1cy1hcGknO1xyXG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XHJcbmltcG9ydCB7IElMb29rdXBSZXN1bHQsIElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xyXG5pbXBvcnQgeyB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBTTUFQSV9JT19BUElfVkVSU0lPTiB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuaW1wb3J0IHsgSVNNQVBJSU9RdWVyeSwgSVNNQVBJUmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5jb25zdCBTTUFQSV9IT1NUID0gJ3NtYXBpLmlvJztcclxuXHJcbmNsYXNzIFNNQVBJUHJveHkge1xyXG4gIHByaXZhdGUgbUFQSTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1PcHRpb25zOiBodHRwcy5SZXF1ZXN0T3B0aW9ucztcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFQSSA9IGFwaTtcclxuICAgIHRoaXMubU9wdGlvbnMgPSB7XHJcbiAgICAgIGhvc3Q6IFNNQVBJX0hPU1QsXHJcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICBwcm90b2NvbDogJ2h0dHBzOicsXHJcbiAgICAgIHBhdGg6ICcvYXBpL3YzLjAvbW9kcycsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBmaW5kKHF1ZXJ5OiBJUXVlcnkpOiBQcm9taXNlPElMb29rdXBSZXN1bHRbXT4ge1xyXG4gICAgaWYgKHF1ZXJ5Lm5hbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmZpbmRCeU5hbWVzKFt7IGlkOiBxdWVyeS5uYW1lIH1dKTtcclxuICAgICAgaWYgKChyZXMubGVuZ3RoID09PSAwKSB8fCAocmVzWzBdLm1ldGFkYXRhPy5tYWluID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZUtleShxdWVyeSk7XHJcbiAgICAgIGlmIChyZXNbMF0ubWV0YWRhdGEubmV4dXNJRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubG9va3VwT25OZXh1cyhcclxuICAgICAgICAgIHF1ZXJ5LCByZXNbMF0ubWV0YWRhdGEubmV4dXNJRCwgcmVzWzBdLm1ldGFkYXRhLm1haW4udmVyc2lvbik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3JldHVybmluZyB0aGlyZC1wYXJ0eSBkZXBlbmRlbmN5IGluZm8nKTtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgeyBrZXksIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgICAgICAgICAgZmlsZU1ENTogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBmaWxlTmFtZTogcXVlcnkubmFtZSxcclxuICAgICAgICAgICAgZmlsZVNpemVCeXRlczogMCxcclxuICAgICAgICAgICAgZmlsZVZlcnNpb246ICcnLFxyXG4gICAgICAgICAgICBzb3VyY2VVUkk6IHJlc1swXS5tZXRhZGF0YS5tYWluPy51cmwsXHJcbiAgICAgICAgICB9IH0sXHJcbiAgICAgICAgXTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGZpbmRCeU5hbWVzKHF1ZXJ5OiBJU01BUElJT1F1ZXJ5W10pOiBQcm9taXNlPElTTUFQSVJlc3VsdFtdPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCByZXEgPSBodHRwcy5yZXF1ZXN0KHRoaXMubU9wdGlvbnMsIHJlcyA9PiB7XHJcbiAgICAgICAgbGV0IGJvZHkgPSBCdWZmZXIuZnJvbShbXSk7XHJcbiAgICAgICAgcmVzXHJcbiAgICAgICAgICAub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKVxyXG4gICAgICAgICAgLm9uKCdkYXRhJywgY2h1bmsgPT4ge1xyXG4gICAgICAgICAgICBib2R5ID0gQnVmZmVyLmNvbmNhdChbYm9keSwgY2h1bmtdKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAub24oJ2VuZCcsICgpID0+IHJlc29sdmUoSlNPTi5wYXJzZShib2R5LnRvU3RyaW5nKCd1dGY4JykpKSk7XHJcbiAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgcmVxLndyaXRlKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBtb2RzOiBxdWVyeSxcclxuICAgICAgICBpbmNsdWRlRXh0ZW5kZWRNZXRhZGF0YTogdHJ1ZSxcclxuICAgICAgICBhcGlWZXJzaW9uOiBTTUFQSV9JT19BUElfVkVSU0lPTixcclxuICAgICAgfSkpO1xyXG4gICAgICByZXEuZW5kKCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbWFrZUtleShxdWVyeTogSVF1ZXJ5KTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgc21hcGlvOiR7cXVlcnkubmFtZX06JHtxdWVyeS52ZXJzaW9uTWF0Y2h9YDsgICAgXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGxvb2t1cE9uTmV4dXMocXVlcnk6IElRdWVyeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dXNJZDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBzdHJpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTxJTG9va3VwUmVzdWx0W10+IHtcclxuICAgIGNvbnN0IGZpbGU6IElGaWxlSW5mbyA9IChhd2FpdCB0aGlzLm1BUEkuZW1pdEFuZEF3YWl0KCdnZXQtbGF0ZXN0LWZpbGUnLCBuZXh1c0lkLCBHQU1FX0lELCBgPj0ke3ZlcnNpb259YCkpWzBdO1xyXG4gICAgaWYgKGZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIGZpbGUgZm91bmQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBbe1xyXG4gICAgICBrZXk6IHRoaXMubWFrZUtleShxdWVyeSksXHJcbiAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgZmlsZU1ENTogdW5kZWZpbmVkLFxyXG4gICAgICAgIGZpbGVOYW1lOiBmaWxlLmZpbGVfbmFtZSxcclxuICAgICAgICBmaWxlU2l6ZUJ5dGVzOiBmaWxlLnNpemUgKiAxMDI0LFxyXG4gICAgICAgIGZpbGVWZXJzaW9uOiBmaWxlLnZlcnNpb24sXHJcbiAgICAgICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgICAgIHNvdXJjZVVSSTogYG54bTovLyR7R0FNRV9JRH0vbW9kcy8ke25leHVzSWR9L2ZpbGVzLyR7ZmlsZS5maWxlX2lkfWAsXHJcbiAgICAgICAgbG9naWNhbEZpbGVOYW1lOiBxdWVyeS5uYW1lLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgc291cmNlOiAnbmV4dXMnLFxyXG4gICAgICAgIGRvbWFpbk5hbWU6IEdBTUVfSUQsXHJcbiAgICAgICAgZGV0YWlsczoge1xyXG4gICAgICAgICAgY2F0ZWdvcnk6IGZpbGUuY2F0ZWdvcnlfaWQudG9TdHJpbmcoKSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBmaWxlLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgbW9kSWQ6IG5leHVzSWQudG9TdHJpbmcoKSxcclxuICAgICAgICAgIGZpbGVJZDogZmlsZS5maWxlX2lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgfV07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTTUFQSVByb3h5O1xyXG4iXX0=