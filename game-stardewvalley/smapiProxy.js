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
            yield this.mAPI.ext.ensureLoggedIn();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBRy9CLHFDQUFtQztBQUNuQywyQ0FBbUQ7QUFHbkQsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBRTlCLE1BQU0sVUFBVTtJQUdkLFlBQVksR0FBd0I7UUFDbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNkLElBQUksRUFBRSxVQUFVO1lBQ2hCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztTQUNGLENBQUM7SUFDSixDQUFDO0lBRVksSUFBSSxDQUFDLEtBQWE7OztZQUM3QixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUM1QixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSwwQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7b0JBQy9ELE9BQU8sRUFBRSxDQUFDO2lCQUNYO2dCQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO29CQUN6QyxPQUFP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LENBQUMsS0FBSyxDQUFDO29CQUN4QixLQUFLLEVBQUU7d0JBQ0wsT0FBTyxFQUFFLFNBQVM7d0JBQ2xCLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUzt3QkFDeEIsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSTt3QkFDL0IsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPO3dCQUN6QixNQUFNLEVBQUUsZ0JBQU87d0JBQ2YsU0FBUyxFQUFFLFNBQVMsZ0JBQU8sU0FBUyxPQUFPLFVBQVUsSUFBSSxDQUFDLE9BQU8sRUFBRTt3QkFDbkUsZUFBZSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO3dCQUN6QyxNQUFNLEVBQUUsT0FBTzt3QkFDZixVQUFVLEVBQUUsZ0JBQU87d0JBQ25CLE9BQU8sRUFBRTs0QkFDUCxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUU7NEJBQ3JDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVzs0QkFDN0IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUU7NEJBQ3pCLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTt5QkFDaEM7cUJBQ0Y7aUJBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUFFRCxrQkFBZSxVQUFVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJRmlsZUluZm8gfSBmcm9tICdAbmV4dXNtb2RzL25leHVzLWFwaSc7XHJcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcclxuaW1wb3J0IHsgSUxvb2t1cFJlc3VsdCwgSVF1ZXJ5IH0gZnJvbSAnbW9kbWV0YS1kYic7XHJcbmltcG9ydCB7IHNlbGVjdG9ycywgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgU01BUElfSU9fQVBJX1ZFUlNJT04gfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcbmltcG9ydCB7IElTTUFQSUlPUXVlcnksIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuY29uc3QgU01BUElfSE9TVCA9ICdzbWFwaS5pbyc7XHJcblxyXG5jbGFzcyBTTUFQSVByb3h5IHtcclxuICBwcml2YXRlIG1BUEk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtT3B0aW9uczogaHR0cHMuUmVxdWVzdE9wdGlvbnM7XHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BUEkgPSBhcGk7XHJcbiAgICB0aGlzLm1PcHRpb25zID0ge1xyXG4gICAgICBob3N0OiBTTUFQSV9IT1NULFxyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgcHJvdG9jb2w6ICdodHRwczonLFxyXG4gICAgICBwYXRoOiAnL2FwaS92My4wL21vZHMnLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZmluZChxdWVyeTogSVF1ZXJ5KTogUHJvbWlzZTxJTG9va3VwUmVzdWx0W10+IHtcclxuICAgIGlmIChxdWVyeS5uYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5maW5kQnlOYW1lcyhbeyBpZDogcXVlcnkubmFtZSB9XSk7XHJcbiAgICAgIGlmICgocmVzLmxlbmd0aCA9PT0gMCkgfHwgKHJlc1swXS5tZXRhZGF0YT8ubWFpbiA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBrZXkgPSB0aGlzLm1ha2VLZXkocXVlcnkpO1xyXG4gICAgICBpZiAocmVzWzBdLm1ldGFkYXRhLm5leHVzSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmxvb2t1cE9uTmV4dXMoXHJcbiAgICAgICAgICBxdWVyeSwgcmVzWzBdLm1ldGFkYXRhLm5leHVzSUQsIHJlc1swXS5tZXRhZGF0YS5tYWluLnZlcnNpb24pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdyZXR1cm5pbmcgdGhpcmQtcGFydHkgZGVwZW5kZW5jeSBpbmZvJyk7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIHsga2V5LCB2YWx1ZToge1xyXG4gICAgICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgICAgIGZpbGVNRDU6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZmlsZU5hbWU6IHF1ZXJ5Lm5hbWUsXHJcbiAgICAgICAgICAgIGZpbGVTaXplQnl0ZXM6IDAsXHJcbiAgICAgICAgICAgIGZpbGVWZXJzaW9uOiAnJyxcclxuICAgICAgICAgICAgc291cmNlVVJJOiByZXNbMF0ubWV0YWRhdGEubWFpbj8udXJsLFxyXG4gICAgICAgICAgfSB9LFxyXG4gICAgICAgIF07XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBmaW5kQnlOYW1lcyhxdWVyeTogSVNNQVBJSU9RdWVyeVtdKTogUHJvbWlzZTxJU01BUElSZXN1bHRbXT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdCh0aGlzLm1PcHRpb25zLCByZXMgPT4ge1xyXG4gICAgICAgIGxldCBib2R5ID0gQnVmZmVyLmZyb20oW10pO1xyXG4gICAgICAgIHJlc1xyXG4gICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgICAgIC5vbignZGF0YScsIGNodW5rID0+IHtcclxuICAgICAgICAgICAgYm9keSA9IEJ1ZmZlci5jb25jYXQoW2JvZHksIGNodW5rXSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKEpTT04ucGFyc2UoYm9keS50b1N0cmluZygndXRmOCcpKSkpO1xyXG4gICAgICB9KVxyXG4gICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXHJcbiAgICAgIHJlcS53cml0ZShKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbW9kczogcXVlcnksXHJcbiAgICAgICAgaW5jbHVkZUV4dGVuZGVkTWV0YWRhdGE6IHRydWUsXHJcbiAgICAgICAgYXBpVmVyc2lvbjogU01BUElfSU9fQVBJX1ZFUlNJT04sXHJcbiAgICAgIH0pKTtcclxuICAgICAgcmVxLmVuZCgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1ha2VLZXkocXVlcnk6IElRdWVyeSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYHNtYXBpbzoke3F1ZXJ5Lm5hbWV9OiR7cXVlcnkudmVyc2lvbk1hdGNofWA7ICAgIFxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBsb29rdXBPbk5leHVzKHF1ZXJ5OiBJUXVlcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHVzSWQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogc3RyaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SUxvb2t1cFJlc3VsdFtdPiB7XHJcbiAgICBhd2FpdCB0aGlzLm1BUEkuZXh0LmVuc3VyZUxvZ2dlZEluKCk7XHJcblxyXG4gICAgY29uc3QgZmlsZTogSUZpbGVJbmZvID0gKGF3YWl0IHRoaXMubUFQSS5lbWl0QW5kQXdhaXQoJ2dldC1sYXRlc3QtZmlsZScsIG5leHVzSWQsIEdBTUVfSUQsIGA+PSR7dmVyc2lvbn1gKSlbMF07XHJcbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gZmlsZSBmb3VuZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFt7XHJcbiAgICAgIGtleTogdGhpcy5tYWtlS2V5KHF1ZXJ5KSxcclxuICAgICAgdmFsdWU6IHtcclxuICAgICAgICBmaWxlTUQ1OiB1bmRlZmluZWQsXHJcbiAgICAgICAgZmlsZU5hbWU6IGZpbGUuZmlsZV9uYW1lLFxyXG4gICAgICAgIGZpbGVTaXplQnl0ZXM6IGZpbGUuc2l6ZSAqIDEwMjQsXHJcbiAgICAgICAgZmlsZVZlcnNpb246IGZpbGUudmVyc2lvbixcclxuICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgc291cmNlVVJJOiBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7bmV4dXNJZH0vZmlsZXMvJHtmaWxlLmZpbGVfaWR9YCxcclxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IHF1ZXJ5Lm5hbWUudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICBzb3VyY2U6ICduZXh1cycsXHJcbiAgICAgICAgZG9tYWluTmFtZTogR0FNRV9JRCxcclxuICAgICAgICBkZXRhaWxzOiB7XHJcbiAgICAgICAgICBjYXRlZ29yeTogZmlsZS5jYXRlZ29yeV9pZC50b1N0cmluZygpLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IGZpbGUuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICBtb2RJZDogbmV4dXNJZC50b1N0cmluZygpLFxyXG4gICAgICAgICAgZmlsZUlkOiBmaWxlLmZpbGVfaWQudG9TdHJpbmcoKSxcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICB9XTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNNQVBJUHJveHk7XHJcbiJdfQ==