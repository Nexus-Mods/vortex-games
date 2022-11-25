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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcGlQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNtYXBpUHJveHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUUvQiwrQ0FBaUM7QUFFakMscUNBQW1DO0FBQ25DLDJDQUFtRDtBQUVuRCxpQ0FBK0M7QUFFL0MsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBRTlCLE1BQU0sVUFBVTtJQUdkLFlBQVksR0FBd0I7UUFDbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNkLElBQUksRUFBRSxVQUFVO1lBQ2hCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztTQUNGLENBQUM7SUFDSixDQUFDO0lBRVksSUFBSSxDQUFDLEtBQWE7OztZQUM3QixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUM1QixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSwwQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7b0JBQy9ELE9BQU8sRUFBRSxDQUFDO2lCQUNYO2dCQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO29CQUN6QyxPQUFPLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FDN0IsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNqRTtxQkFBTTtvQkFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7b0JBQ3JELE9BQU87d0JBQ0wsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFO2dDQUNaLE1BQU0sRUFBRSxnQkFBTztnQ0FDZixPQUFPLEVBQUUsU0FBUztnQ0FDbEIsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJO2dDQUNwQixhQUFhLEVBQUUsQ0FBQztnQ0FDaEIsV0FBVyxFQUFFLEVBQUU7Z0NBQ2YsU0FBUyxFQUFFLE1BQUEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLDBDQUFFLEdBQUc7NkJBQ3JDLEVBQUU7cUJBQ0osQ0FBQztpQkFDSDthQUNGO2lCQUFNO2dCQUNMLE9BQU8sRUFBRSxDQUFDO2FBQ1g7O0tBQ0Y7SUFFWSxXQUFXLENBQUMsS0FBc0I7O1lBQzdDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3JDLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRTtvQkFDN0MsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDM0IsR0FBRzt5QkFDQSxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3lCQUMvQixFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFO3dCQUNsQixJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxDQUFDLENBQUM7eUJBQ0QsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDLENBQUM7cUJBQ0MsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO2dCQUNsQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ3ZCLElBQUksRUFBRSxLQUFLO29CQUNYLHVCQUF1QixFQUFFLElBQUk7b0JBQzdCLFVBQVUsRUFBRSxnQ0FBb0I7aUJBQ2pDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRU8sT0FBTyxDQUFDLEtBQWE7UUFDM0IsT0FBTyxVQUFVLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3RELENBQUM7SUFFYSxhQUFhLENBQUMsS0FBYSxFQUNiLE9BQWUsRUFDZixPQUFlOzs7WUFFekMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUVyQyxNQUFNLEtBQUssR0FBZ0IsTUFBQSxNQUFNLENBQUEsTUFBQSxNQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDLGdCQUFnQixtREFBRyxnQkFBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBLG1DQUFJLEVBQUUsQ0FBQztZQUUxRixNQUFNLGNBQWMsR0FBRyxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBRXRDLE1BQU0sSUFBSSxHQUFHLEtBQUs7aUJBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFBLGFBQU0sRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7aUJBQ3RFLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUEsb0JBQWEsRUFBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWxFLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQzthQUNsQztZQUNELE9BQU8sQ0FBQztvQkFDTixHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7b0JBQ3hCLEtBQUssRUFBRTt3QkFDTCxPQUFPLEVBQUUsU0FBUzt3QkFDbEIsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTO3dCQUN4QixhQUFhLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJO3dCQUMvQixXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU87d0JBQ3pCLE1BQU0sRUFBRSxnQkFBTzt3QkFDZixTQUFTLEVBQUUsU0FBUyxnQkFBTyxTQUFTLE9BQU8sVUFBVSxJQUFJLENBQUMsT0FBTyxFQUFFO3dCQUNuRSxlQUFlLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7d0JBQ3pDLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFVBQVUsRUFBRSxnQkFBTzt3QkFDbkIsT0FBTyxFQUFFOzRCQUNQLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRTs0QkFDckMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXOzRCQUM3QixLQUFLLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRTs0QkFDekIsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO3lCQUNoQztxQkFDRjtpQkFDRixDQUFDLENBQUM7O0tBQ0o7Q0FDRjtBQUVELGtCQUFlLFVBQVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElGaWxlSW5mbyB9IGZyb20gJ0BuZXh1c21vZHMvbmV4dXMtYXBpJztcclxuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xyXG5pbXBvcnQgeyBJTG9va3VwUmVzdWx0LCBJUXVlcnkgfSBmcm9tICdtb2RtZXRhLWRiJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IFNNQVBJX0lPX0FQSV9WRVJTSU9OIH0gZnJvbSAnLi9jb25zdGFudHMnO1xyXG5pbXBvcnQgeyBJU01BUElJT1F1ZXJ5LCBJU01BUElSZXN1bHQgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgY29lcmNlLCBzZW12ZXJDb21wYXJlIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IFNNQVBJX0hPU1QgPSAnc21hcGkuaW8nO1xyXG5cclxuY2xhc3MgU01BUElQcm94eSB7XHJcbiAgcHJpdmF0ZSBtQVBJOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbU9wdGlvbnM6IGh0dHBzLlJlcXVlc3RPcHRpb25zO1xyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gICAgdGhpcy5tQVBJID0gYXBpO1xyXG4gICAgdGhpcy5tT3B0aW9ucyA9IHtcclxuICAgICAgaG9zdDogU01BUElfSE9TVCxcclxuICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgIHByb3RvY29sOiAnaHR0cHM6JyxcclxuICAgICAgcGF0aDogJy9hcGkvdjMuMC9tb2RzJyxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGZpbmQocXVlcnk6IElRdWVyeSk6IFByb21pc2U8SUxvb2t1cFJlc3VsdFtdPiB7XHJcbiAgICBpZiAocXVlcnkubmFtZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuZmluZEJ5TmFtZXMoW3sgaWQ6IHF1ZXJ5Lm5hbWUgfV0pO1xyXG4gICAgICBpZiAoKHJlcy5sZW5ndGggPT09IDApIHx8IChyZXNbMF0ubWV0YWRhdGE/Lm1haW4gPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qga2V5ID0gdGhpcy5tYWtlS2V5KHF1ZXJ5KTtcclxuICAgICAgaWYgKHJlc1swXS5tZXRhZGF0YS5uZXh1c0lEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5sb29rdXBPbk5leHVzKFxyXG4gICAgICAgICAgcXVlcnksIHJlc1swXS5tZXRhZGF0YS5uZXh1c0lELCByZXNbMF0ubWV0YWRhdGEubWFpbi52ZXJzaW9uKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZygncmV0dXJuaW5nIHRoaXJkLXBhcnR5IGRlcGVuZGVuY3kgaW5mbycpO1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICB7IGtleSwgdmFsdWU6IHtcclxuICAgICAgICAgICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgICAgICAgICBmaWxlTUQ1OiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGZpbGVOYW1lOiBxdWVyeS5uYW1lLFxyXG4gICAgICAgICAgICBmaWxlU2l6ZUJ5dGVzOiAwLFxyXG4gICAgICAgICAgICBmaWxlVmVyc2lvbjogJycsXHJcbiAgICAgICAgICAgIHNvdXJjZVVSSTogcmVzWzBdLm1ldGFkYXRhLm1haW4/LnVybCxcclxuICAgICAgICAgIH0gfSxcclxuICAgICAgICBdO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZmluZEJ5TmFtZXMocXVlcnk6IElTTUFQSUlPUXVlcnlbXSk6IFByb21pc2U8SVNNQVBJUmVzdWx0W10+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcSA9IGh0dHBzLnJlcXVlc3QodGhpcy5tT3B0aW9ucywgcmVzID0+IHtcclxuICAgICAgICBsZXQgYm9keSA9IEJ1ZmZlci5mcm9tKFtdKTtcclxuICAgICAgICByZXNcclxuICAgICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXHJcbiAgICAgICAgICAub24oJ2RhdGEnLCBjaHVuayA9PiB7XHJcbiAgICAgICAgICAgIGJvZHkgPSBCdWZmZXIuY29uY2F0KFtib2R5LCBjaHVua10pO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC5vbignZW5kJywgKCkgPT4gcmVzb2x2ZShKU09OLnBhcnNlKGJvZHkudG9TdHJpbmcoJ3V0ZjgnKSkpKTtcclxuICAgICAgfSlcclxuICAgICAgICAub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKVxyXG4gICAgICByZXEud3JpdGUoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIG1vZHM6IHF1ZXJ5LFxyXG4gICAgICAgIGluY2x1ZGVFeHRlbmRlZE1ldGFkYXRhOiB0cnVlLFxyXG4gICAgICAgIGFwaVZlcnNpb246IFNNQVBJX0lPX0FQSV9WRVJTSU9OLFxyXG4gICAgICB9KSk7XHJcbiAgICAgIHJlcS5lbmQoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYWtlS2V5KHF1ZXJ5OiBJUXVlcnkpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGBzbWFwaW86JHtxdWVyeS5uYW1lfToke3F1ZXJ5LnZlcnNpb25NYXRjaH1gOyAgICBcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgbG9va3VwT25OZXh1cyhxdWVyeTogSVF1ZXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh1c0lkOiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHN0cmluZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPElMb29rdXBSZXN1bHRbXT4ge1xyXG4gICAgYXdhaXQgdGhpcy5tQVBJLmV4dC5lbnN1cmVMb2dnZWRJbigpO1xyXG5cclxuICAgIGNvbnN0IGZpbGVzOiBJRmlsZUluZm9bXSA9IGF3YWl0IHRoaXMubUFQSS5leHQubmV4dXNHZXRNb2RGaWxlcz8uKEdBTUVfSUQsIG5leHVzSWQpID8/IFtdO1xyXG5cclxuICAgIGNvbnN0IHZlcnNpb25QYXR0ZXJuID0gYD49JHt2ZXJzaW9ufWA7XHJcblxyXG4gICAgY29uc3QgZmlsZSA9IGZpbGVzXHJcbiAgICAgIC5maWx0ZXIoaXRlciA9PiBzZW12ZXIuc2F0aXNmaWVzKGNvZXJjZShpdGVyLnZlcnNpb24pLCB2ZXJzaW9uUGF0dGVybikpXHJcbiAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyQ29tcGFyZShyaHMudmVyc2lvbiwgbGhzLnZlcnNpb24pKVswXTtcclxuXHJcbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gZmlsZSBmb3VuZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFt7XHJcbiAgICAgIGtleTogdGhpcy5tYWtlS2V5KHF1ZXJ5KSxcclxuICAgICAgdmFsdWU6IHtcclxuICAgICAgICBmaWxlTUQ1OiB1bmRlZmluZWQsXHJcbiAgICAgICAgZmlsZU5hbWU6IGZpbGUuZmlsZV9uYW1lLFxyXG4gICAgICAgIGZpbGVTaXplQnl0ZXM6IGZpbGUuc2l6ZSAqIDEwMjQsXHJcbiAgICAgICAgZmlsZVZlcnNpb246IGZpbGUudmVyc2lvbixcclxuICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgc291cmNlVVJJOiBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7bmV4dXNJZH0vZmlsZXMvJHtmaWxlLmZpbGVfaWR9YCxcclxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6IHF1ZXJ5Lm5hbWUudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICBzb3VyY2U6ICduZXh1cycsXHJcbiAgICAgICAgZG9tYWluTmFtZTogR0FNRV9JRCxcclxuICAgICAgICBkZXRhaWxzOiB7XHJcbiAgICAgICAgICBjYXRlZ29yeTogZmlsZS5jYXRlZ29yeV9pZC50b1N0cmluZygpLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IGZpbGUuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICBtb2RJZDogbmV4dXNJZC50b1N0cmluZygpLFxyXG4gICAgICAgICAgZmlsZUlkOiBmaWxlLmZpbGVfaWQudG9TdHJpbmcoKSxcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICB9XTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNNQVBJUHJveHk7XHJcbiJdfQ==