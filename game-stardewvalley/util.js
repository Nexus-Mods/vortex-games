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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.defaultModsRelPath = defaultModsRelPath;
exports.parseManifest = parseManifest;
exports.coerce = coerce;
exports.semverCompare = semverCompare;
exports.walkPath = walkPath;
exports.deleteFolder = deleteFolder;
const relaxed_json_1 = require("relaxed-json");
const semver = __importStar(require("semver"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
function defaultModsRelPath() {
    return 'Mods';
}
function parseManifest(manifestFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const manifestData = yield vortex_api_1.fs.readFileAsync(manifestFilePath, { encoding: 'utf-8' });
            const manifest = (0, relaxed_json_1.parse)(vortex_api_1.util.deBOM(manifestData));
            if (!manifest) {
                throw new vortex_api_1.util.DataInvalid('Manifest file is invalid');
            }
            return manifest;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function coerce(input) {
    try {
        return new semver.SemVer(input);
    }
    catch (err) {
        return semver.coerce(input);
    }
}
function semverCompare(lhs, rhs) {
    const l = coerce(lhs);
    const r = coerce(rhs);
    if ((l !== null) && (r !== null)) {
        return semver.compare(l, r);
    }
    else {
        return lhs.localeCompare(rhs, 'en-US');
    }
}
function walkPath(dirPath, walkOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        walkOptions = !!walkOptions
            ? Object.assign(Object.assign({}, walkOptions), { skipHidden: true, skipInaccessible: true, skipLinks: true }) : { skipLinks: true, skipHidden: true, skipInaccessible: true };
        const walkResults = [];
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield (0, turbowalk_1.default)(dirPath, (entries) => {
                walkResults.push(...entries);
                return Promise.resolve();
            }, walkOptions).catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
            return resolve(walkResults);
        }));
    });
}
function deleteFolder(dirPath, walkOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const entries = yield walkPath(dirPath, walkOptions);
            entries.sort((a, b) => b.filePath.length - a.filePath.length);
            for (const entry of entries) {
                yield vortex_api_1.fs.removeAsync(entry.filePath);
            }
            yield vortex_api_1.fs.rmdirAsync(dirPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxnREFFQztBQUVELHNDQVdDO0FBTUQsd0JBTUM7QUFFRCxzQ0FRQztBQUVELDRCQWNDO0FBRUQsb0NBV0M7QUF4RUQsK0NBQXFDO0FBQ3JDLCtDQUFpQztBQUNqQywwREFBNEQ7QUFDNUQsMkNBQXNDO0FBR3RDLFNBQWdCLGtCQUFrQjtJQUNoQyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBc0IsYUFBYSxDQUFDLGdCQUF3Qjs7UUFDMUQsSUFBSSxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDckYsTUFBTSxRQUFRLEdBQW9CLElBQUEsb0JBQUssRUFBQyxpQkFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBb0IsQ0FBQztZQUNyRixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDekQsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0NBQUE7QUFNRCxTQUFnQixNQUFNLENBQUMsS0FBYTtJQUNsQyxJQUFJLENBQUM7UUFDSCxPQUFPLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxHQUFXLEVBQUUsR0FBVztJQUNwRCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN6QyxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQXNCLFFBQVEsQ0FBQyxPQUFlLEVBQUUsV0FBMEI7O1FBQ3hFLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVztZQUN6QixDQUFDLGlDQUFNLFdBQVcsS0FBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUM3RSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDbEUsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sSUFBSSxPQUFPLENBQVcsQ0FBTyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckQsTUFBTSxJQUFBLG1CQUFTLEVBQUMsT0FBTyxFQUFFLENBQUMsT0FBaUIsRUFBRSxFQUFFO2dCQUM3QyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBUyxDQUFDO1lBR2xDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUYsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQUVELFNBQXNCLFlBQVksQ0FBQyxPQUFlLEVBQUUsV0FBMEI7O1FBQzVFLElBQUksQ0FBQztZQUNILE1BQU0sT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNyRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5RCxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUM1QixNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxNQUFNLGVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsQ0FBQztJQUNILENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhcnNlIH0gZnJvbSAncmVsYXhlZC1qc29uJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5LCBJV2Fsa09wdGlvbnMgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBmcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBJU0RWTW9kTWFuaWZlc3QgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0TW9kc1JlbFBhdGgoKTogc3RyaW5nIHtcclxuICByZXR1cm4gJ01vZHMnO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VNYW5pZmVzdChtYW5pZmVzdEZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElTRFZNb2RNYW5pZmVzdD4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtYW5pZmVzdERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1hbmlmZXN0RmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID0gcGFyc2UodXRpbC5kZUJPTShtYW5pZmVzdERhdGEpKSBhcyBJU0RWTW9kTWFuaWZlc3Q7XHJcbiAgICBpZiAoIW1hbmlmZXN0KSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdNYW5pZmVzdCBmaWxlIGlzIGludmFsaWQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtYW5pZmVzdDtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIHNlbXZlci5jb2VyY2UgZHJvcHMgcHJlLXJlbGVhc2UgaW5mb3JtYXRpb24gZnJvbSBhXHJcbiAqIHBlcmZlY3RseSB2YWxpZCBzZW1hbnRpYyB2ZXJzaW9uIHN0cmluZywgZG9uJ3Qgd2FudCB0aGF0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29lcmNlKGlucHV0OiBzdHJpbmcpOiBzZW12ZXIuU2VtVmVyIHtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIG5ldyBzZW12ZXIuU2VtVmVyKGlucHV0KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBzZW12ZXIuY29lcmNlKGlucHV0KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZW12ZXJDb21wYXJlKGxoczogc3RyaW5nLCByaHM6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgY29uc3QgbCA9IGNvZXJjZShsaHMpO1xyXG4gIGNvbnN0IHIgPSBjb2VyY2UocmhzKTtcclxuICBpZiAoKGwgIT09IG51bGwpICYmIChyICE9PSBudWxsKSkge1xyXG4gICAgcmV0dXJuIHNlbXZlci5jb21wYXJlKGwsIHIpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gbGhzLmxvY2FsZUNvbXBhcmUocmhzLCAnZW4tVVMnKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3YWxrUGF0aChkaXJQYXRoOiBzdHJpbmcsIHdhbGtPcHRpb25zPzogSVdhbGtPcHRpb25zKTogUHJvbWlzZTxJRW50cnlbXT4ge1xyXG4gIHdhbGtPcHRpb25zID0gISF3YWxrT3B0aW9uc1xyXG4gICAgPyB7IC4uLndhbGtPcHRpb25zLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfVxyXG4gICAgOiB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9O1xyXG4gIGNvbnN0IHdhbGtSZXN1bHRzOiBJRW50cnlbXSA9IFtdO1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRW50cnlbXT4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXdhaXQgdHVyYm93YWxrKGRpclBhdGgsIChlbnRyaWVzOiBJRW50cnlbXSkgPT4ge1xyXG4gICAgICB3YWxrUmVzdWx0cy5wdXNoKC4uLmVudHJpZXMpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkgYXMgYW55O1xyXG4gICAgICAvLyBJZiB0aGUgZGlyZWN0b3J5IGlzIG1pc3Npbmcgd2hlbiB3ZSB0cnkgdG8gd2FsayBpdDsgaXQncyBtb3N0IHByb2JhYmx5IGRvd24gdG8gYSBjb2xsZWN0aW9uIGJlaW5nXHJcbiAgICAgIC8vICBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBpbnN0YWxsZWQvcmVtb3ZlZC4gV2UgY2FuIHNhZmVseSBpZ25vcmUgdGhpcy5cclxuICAgIH0sIHdhbGtPcHRpb25zKS5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIHJldHVybiByZXNvbHZlKHdhbGtSZXN1bHRzKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUZvbGRlcihkaXJQYXRoOiBzdHJpbmcsIHdhbGtPcHRpb25zPzogSVdhbGtPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB3YWxrUGF0aChkaXJQYXRoLCB3YWxrT3B0aW9ucyk7XHJcbiAgICBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGIuZmlsZVBhdGgubGVuZ3RoIC0gYS5maWxlUGF0aC5sZW5ndGgpO1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKTtcclxuICAgIH1cclxuICAgIGF3YWl0IGZzLnJtZGlyQXN5bmMoZGlyUGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuIl19