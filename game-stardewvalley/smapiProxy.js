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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUUvQiwrQ0FBaUM7QUFDakMsMkNBQXdDO0FBQ3hDLHFDQUFtQztBQUNuQywyQ0FBbUQ7QUFFbkQsaUNBQStDO0FBRS9DLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQztBQUU5QixNQUFNLFVBQVU7SUFHZCxZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUc7WUFDZCxJQUFJLEVBQUUsVUFBVTtZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7YUFDbkM7U0FDRixDQUFDO0lBQ0osQ0FBQztJQUVZLElBQUksQ0FBQyxLQUFhOzs7WUFDN0IsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsMENBQUUsSUFBSSxNQUFLLFNBQVMsQ0FBQyxFQUFFO29CQUMvRCxPQUFPLEVBQUUsQ0FBQztpQkFDWDtnQkFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FB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QUFXLENBQUMsUUFBUSxFQUFFOzRCQUNyQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7NEJBQzdCLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFOzRCQUN6QixNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7eUJBQ2hDO3FCQUNGO2lCQUNGLENBQUMsQ0FBQzs7S0FDSjtDQUNGO0FBRUQsa0JBQWUsVUFBVSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUZpbGVJbmZvIH0gZnJvbSAnQG5leHVzbW9kcy9uZXh1cy1hcGknO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0IHsgSUxvb2t1cFJlc3VsdCwgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGxvZywgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBTTUFQSV9JT19BUElfVkVSU0lPTiB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IElTTUFQSUlPUXVlcnksIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgY29lcmNlLCBzZW12ZXJDb21wYXJlIH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgU01BUElfSE9TVCA9ICdzbWFwaS5pbyc7XG5cbmNsYXNzIFNNQVBJUHJveHkge1xuICBwcml2YXRlIG1BUEk6IHR5cGVzLklFeHRlbnNpb25BcGk7XG4gIHByaXZhdGUgbU9wdGlvbnM6IGh0dHBzLlJlcXVlc3RPcHRpb25zO1xuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgICB0aGlzLm1BUEkgPSBhcGk7XG4gICAgdGhpcy5tT3B0aW9ucyA9IHtcbiAgICAgIGhvc3Q6IFNNQVBJX0hPU1QsXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHByb3RvY29sOiAnaHR0cHM6JyxcbiAgICAgIHBhdGg6ICcvYXBpL3YzLjAvbW9kcycsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZmluZChxdWVyeTogSVF1ZXJ5KTogUHJvbWlzZTxJTG9va3VwUmVzdWx0W10+IHtcbiAgICBpZiAocXVlcnkubmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmZpbmRCeU5hbWVzKFt7IGlkOiBxdWVyeS5uYW1lIH1dKTtcbiAgICAgIGlmICgocmVzLmxlbmd0aCA9PT0gMCkgfHwgKHJlc1swXS5tZXRhZGF0YT8ubWFpbiA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLm1ha2VLZXkocXVlcnkpO1xuICAgICAgaWYgKHJlc1swXS5tZXRhZGF0YS5uZXh1c0lEICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubG9va3VwT25OZXh1cyhcbiAgICAgICAgICBxdWVyeSwgcmVzWzBdLm1ldGFkYXRhLm5leHVzSUQsIHJlc1swXS5tZXRhZGF0YS5tYWluLnZlcnNpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICB7IGtleSwgdmFsdWU6IHtcbiAgICAgICAgICAgIGdhbWVJZDogR0FNRV9JRCxcbiAgICAgICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGZpbGVOYW1lOiBxdWVyeS5uYW1lLFxuICAgICAgICAgICAgZmlsZVNpemVCeXRlczogMCxcbiAgICAgICAgICAgIGZpbGVWZXJzaW9uOiAnJyxcbiAgICAgICAgICAgIHNvdXJjZVVSSTogcmVzWzBdLm1ldGFkYXRhLm1haW4/LnVybCxcbiAgICAgICAgICB9IH0sXG4gICAgICAgIF07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZmluZEJ5TmFtZXMocXVlcnk6IElTTUFQSUlPUXVlcnlbXSk6IFByb21pc2U8SVNNQVBJUmVzdWx0W10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdCh0aGlzLm1PcHRpb25zLCByZXMgPT4ge1xuICAgICAgICBsZXQgYm9keSA9IEJ1ZmZlci5mcm9tKFtdKTtcbiAgICAgICAgcmVzXG4gICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcbiAgICAgICAgICAub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICAgICAgICBib2R5ID0gQnVmZmVyLmNvbmNhdChbYm9keSwgY2h1bmtdKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGV4dHVhbCA9IGJvZHkudG9TdHJpbmcoJ3V0ZjgnKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UodGV4dHVhbCk7XG4gICAgICAgICAgICAgIHJlc29sdmUocGFyc2VkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBzbWFwaSByZXNwb25zZScsIHRleHR1YWwpO1xuICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXG4gICAgICByZXEud3JpdGUoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtb2RzOiBxdWVyeSxcbiAgICAgICAgaW5jbHVkZUV4dGVuZGVkTWV0YWRhdGE6IHRydWUsXG4gICAgICAgIGFwaVZlcnNpb246IFNNQVBJX0lPX0FQSV9WRVJTSU9OLFxuICAgICAgfSkpO1xuICAgICAgcmVxLmVuZCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBtYWtlS2V5KHF1ZXJ5OiBJUXVlcnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgc21hcGlvOiR7cXVlcnkubmFtZX06JHtxdWVyeS52ZXJzaW9uTWF0Y2h9YDsgICAgXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGxvb2t1cE9uTmV4dXMocXVlcnk6IElRdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHVzSWQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHN0cmluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTxJTG9va3VwUmVzdWx0W10+IHtcbiAgICBhd2FpdCB0aGlzLm1BUEkuZXh0LmVuc3VyZUxvZ2dlZEluKCk7XG5cbiAgICBjb25zdCBmaWxlczogSUZpbGVJbmZvW10gPSBhd2FpdCB0aGlzLm1BUEkuZXh0Lm5leHVzR2V0TW9kRmlsZXM/LihHQU1FX0lELCBuZXh1c0lkKSA/PyBbXTtcblxuICAgIGNvbnN0IHZlcnNpb25QYXR0ZXJuID0gYD49JHt2ZXJzaW9ufWA7XG5cbiAgICBjb25zdCBmaWxlID0gZmlsZXNcbiAgICAgIC5maWx0ZXIoaXRlciA9PiBzZW12ZXIuc2F0aXNmaWVzKGNvZXJjZShpdGVyLnZlcnNpb24pLCB2ZXJzaW9uUGF0dGVybikpXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IHNlbXZlckNvbXBhcmUocmhzLnZlcnNpb24sIGxocy52ZXJzaW9uKSlbMF07XG5cbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIGZpbGUgZm91bmQnKTtcbiAgICB9XG4gICAgcmV0dXJuIFt7XG4gICAgICBrZXk6IHRoaXMubWFrZUtleShxdWVyeSksXG4gICAgICB2YWx1ZToge1xuICAgICAgICBmaWxlTUQ1OiB1bmRlZmluZWQsXG4gICAgICAgIGZpbGVOYW1lOiBmaWxlLmZpbGVfbmFtZSxcbiAgICAgICAgZmlsZVNpemVCeXRlczogZmlsZS5zaXplICogMTAyNCxcbiAgICAgICAgZmlsZVZlcnNpb246IGZpbGUudmVyc2lvbixcbiAgICAgICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgICAgICBzb3VyY2VVUkk6IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvJHtuZXh1c0lkfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gLFxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IHF1ZXJ5Lm5hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgc291cmNlOiAnbmV4dXMnLFxuICAgICAgICBkb21haW5OYW1lOiBHQU1FX0lELFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgY2F0ZWdvcnk6IGZpbGUuY2F0ZWdvcnlfaWQudG9TdHJpbmcoKSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogZmlsZS5kZXNjcmlwdGlvbixcbiAgICAgICAgICBtb2RJZDogbmV4dXNJZC50b1N0cmluZygpLFxuICAgICAgICAgIGZpbGVJZDogZmlsZS5maWxlX2lkLnRvU3RyaW5nKCksXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfV07XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU01BUElQcm94eTtcbiJdfQ==