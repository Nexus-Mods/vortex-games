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
                const res = yield this.findByName(query.name);
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
                throw new Error('only lookup by logical name supported at this time');
            }
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
                        logicalFileName: query.name,
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
    findByName(name) {
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
                    mods: [{ "id": name }],
                    "includeExtendedMetadata": true,
                }));
                req.end();
            });
        });
    }
}
exports.default = SMAPIProxy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBRy9CLHFDQUFtQztBQUVuQyxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUM7QUF5QjlCLE1BQU0sVUFBVTtJQUdkLFlBQVksR0FBd0I7UUFDbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNkLElBQUksRUFBRSxVQUFVO1lBQ2hCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztTQUNGLENBQUM7SUFDSixDQUFDO0lBRVksSUFBSSxDQUFDLEtBQWE7OztZQUM3QixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUM1QixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSwwQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7b0JBQy9ELE9BQU8sRUFBRSxDQUFDO2lCQUNYO2dCQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO29CQUN6QyxPQUFPLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FDN0IsS0FBSyxFQUFFLEdBQUcs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QUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ3RDLENBQUMsQ0FBQzt5QkFDRCxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLENBQUMsQ0FBQztxQkFDQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7Z0JBQ2xDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztvQkFDdkIsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7b0JBQ3RCLHlCQUF5QixFQUFFLElBQUk7aUJBQ2hDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUFFRCxrQkFBZSxVQUFVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJRmlsZUluZm8gfSBmcm9tICdAbmV4dXNtb2RzL25leHVzLWFwaSc7XHJcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcclxuaW1wb3J0IHsgSUxvb2t1cFJlc3VsdCwgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XHJcbmltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5jb25zdCBTTUFQSV9IT1NUID0gJ3NtYXBpLmlvJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVNNQVBJUmVzdWx0IHtcclxuICBpZDogc3RyaW5nO1xyXG4gIG1ldGFkYXRhOiB7XHJcbiAgICBpZDogc3RyaW5nW10sXHJcbiAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICBuZXh1c0lEPzogbnVtYmVyLFxyXG4gICAgY2h1Y2tsZWZpc2hJRD86IG51bWJlcixcclxuICAgIGN1cnNlRm9yZ2VJRD86IG51bWJlcixcclxuICAgIGN1cnNlRm9ya2VLZXk/OiBzdHJpbmcsXHJcbiAgICBtb2REcm9wSUQ/OiBudW1iZXIsXHJcbiAgICBnaXRIdWJSZXBvOiBzdHJpbmcsXHJcbiAgICBjdXN0b21Tb3VyY2VVcmw6IHN0cmluZyxcclxuICAgIGN1c3RvbVVybDogc3RyaW5nLFxyXG4gICAgbWFpbjoge1xyXG4gICAgICB2ZXJzaW9uPzogc3RyaW5nLFxyXG4gICAgICB1cmw/OiBzdHJpbmcsXHJcbiAgICB9LFxyXG4gICAgY29tcGF0aWJpbGl0eVN0YXR1czogc3RyaW5nLFxyXG4gICAgY29tcGF0aWJpbGl0eVN1bW1hcnk6IHN0cmluZyxcclxuICB9LFxyXG4gIFwiZXJyb3JzXCI6IFtdXHJcbn1cclxuIFxyXG5jbGFzcyBTTUFQSVByb3h5IHtcclxuICBwcml2YXRlIG1BUEk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtT3B0aW9uczogaHR0cHMuUmVxdWVzdE9wdGlvbnM7XHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BUEkgPSBhcGk7XHJcbiAgICB0aGlzLm1PcHRpb25zID0ge1xyXG4gICAgICBob3N0OiBTTUFQSV9IT1NULFxyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgcHJvdG9jb2w6ICdodHRwczonLFxyXG4gICAgICBwYXRoOiAnL2FwaS92My4wL21vZHMnLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZmluZChxdWVyeTogSVF1ZXJ5KTogUHJvbWlzZTxJTG9va3VwUmVzdWx0W10+IHtcclxuICAgIGlmIChxdWVyeS5uYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5maW5kQnlOYW1lKHF1ZXJ5Lm5hbWUpO1xyXG4gICAgICBpZiAoKHJlcy5sZW5ndGggPT09IDApIHx8IChyZXNbMF0ubWV0YWRhdGE/Lm1haW4gPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qga2V5ID0gdGhpcy5tYWtlS2V5KHF1ZXJ5KTtcclxuICAgICAgaWYgKHJlc1swXS5tZXRhZGF0YS5uZXh1c0lEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5sb29rdXBPbk5leHVzKFxyXG4gICAgICAgICAgcXVlcnksIHJlc1swXS5tZXRhZGF0YS5uZXh1c0lELCByZXNbMF0ubWV0YWRhdGEubWFpbi52ZXJzaW9uKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZygncmV0dXJuaW5nIHRoaXJkLXBhcnR5IGRlcGVuZGVuY3kgaW5mbycpO1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICB7IGtleSwgdmFsdWU6IHtcclxuICAgICAgICAgICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgICAgICAgICBmaWxlTUQ1OiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGZpbGVOYW1lOiBxdWVyeS5uYW1lLFxyXG4gICAgICAgICAgICBmaWxlU2l6ZUJ5dGVzOiAwLFxyXG4gICAgICAgICAgICBmaWxlVmVyc2lvbjogJycsXHJcbiAgICAgICAgICAgIHNvdXJjZVVSSTogcmVzWzBdLm1ldGFkYXRhLm1haW4/LnVybCxcclxuICAgICAgICAgIH0gfSxcclxuICAgICAgICBdO1xyXG4gICAgICB9XHJcblxyXG4gICAgIFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbmx5IGxvb2t1cCBieSBsb2dpY2FsIG5hbWUgc3VwcG9ydGVkIGF0IHRoaXMgdGltZScpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYWtlS2V5KHF1ZXJ5OiBJUXVlcnkpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGBzbWFwaW86JHtxdWVyeS5uYW1lfToke3F1ZXJ5LnZlcnNpb25NYXRjaH1gOyAgICBcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgbG9va3VwT25OZXh1cyhxdWVyeTogSVF1ZXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh1c0lkOiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHN0cmluZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPElMb29rdXBSZXN1bHRbXT4ge1xyXG4gICAgY29uc3QgZmlsZTogSUZpbGVJbmZvID0gKGF3YWl0IHRoaXMubUFQSS5lbWl0QW5kQXdhaXQoJ2dldC1sYXRlc3QtZmlsZScsIG5leHVzSWQsIEdBTUVfSUQsIGA+PSR7dmVyc2lvbn1gKSlbMF07XHJcbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gZmlsZSBmb3VuZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFt7XHJcbiAgICAgIGtleTogdGhpcy5tYWtlS2V5KHF1ZXJ5KSxcclxuICAgICAgdmFsdWU6IHtcclxuICAgICAgICBmaWxlTUQ1OiB1bmRlZmluZWQsXHJcbiAgICAgICAgZmlsZU5hbWU6IGZpbGUuZmlsZV9uYW1lLFxyXG4gICAgICAgIGZpbGVTaXplQnl0ZXM6IGZpbGUuc2l6ZSAqIDEwMjQsXHJcbiAgICAgICAgZmlsZVZlcnNpb246IGZpbGUudmVyc2lvbixcclxuICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgc291cmNlVVJJOiBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7bmV4dXNJZH0vZmlsZXMvJHtmaWxlLmZpbGVfaWR9YCxcclxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IHF1ZXJ5Lm5hbWUsXHJcbiAgICAgICAgc291cmNlOiAnbmV4dXMnLFxyXG4gICAgICAgIGRvbWFpbk5hbWU6IEdBTUVfSUQsXHJcbiAgICAgICAgZGV0YWlsczoge1xyXG4gICAgICAgICAgY2F0ZWdvcnk6IGZpbGUuY2F0ZWdvcnlfaWQudG9TdHJpbmcoKSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBmaWxlLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgbW9kSWQ6IG5leHVzSWQudG9TdHJpbmcoKSxcclxuICAgICAgICAgIGZpbGVJZDogZmlsZS5maWxlX2lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgfV07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGZpbmRCeU5hbWUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxJU01BUElSZXN1bHRbXT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdCh0aGlzLm1PcHRpb25zLCByZXMgPT4ge1xyXG4gICAgICAgIGxldCBib2R5ID0gQnVmZmVyLmZyb20oW10pO1xyXG4gICAgICAgIHJlc1xyXG4gICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgICAgIC5vbignZGF0YScsIGNodW5rID0+IHtcclxuICAgICAgICAgICAgYm9keSA9IEJ1ZmZlci5jb25jYXQoW2JvZHksIGNodW5rXSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKEpTT04ucGFyc2UoYm9keS50b1N0cmluZygndXRmOCcpKSkpO1xyXG4gICAgICB9KVxyXG4gICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXHJcbiAgICAgIHJlcS53cml0ZShKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbW9kczogW3sgXCJpZFwiOiBuYW1lIH1dLFxyXG4gICAgICAgIFwiaW5jbHVkZUV4dGVuZGVkTWV0YWRhdGFcIjogdHJ1ZSxcclxuICAgICAgfSkpO1xyXG4gICAgICByZXEuZW5kKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNNQVBJUHJveHk7XHJcbiJdfQ==