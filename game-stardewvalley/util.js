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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkPath = exports.semverCompare = exports.coerce = exports.parseManifest = void 0;
const relaxed_json_1 = require("relaxed-json");
const semver = __importStar(require("semver"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
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
exports.parseManifest = parseManifest;
function coerce(input) {
    try {
        return new semver.SemVer(input);
    }
    catch (err) {
        return semver.coerce(input);
    }
}
exports.coerce = coerce;
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
exports.semverCompare = semverCompare;
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
exports.walkPath = walkPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBcUM7QUFDckMsK0NBQWlDO0FBQ2pDLDBEQUE0RDtBQUM1RCwyQ0FBc0M7QUFHdEMsU0FBc0IsYUFBYSxDQUFDLGdCQUF3Qjs7UUFDMUQsSUFBSTtZQUNGLE1BQU0sWUFBWSxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sUUFBUSxHQUFvQixJQUFBLG9CQUFLLEVBQUMsaUJBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQW9CLENBQUM7WUFDckYsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixNQUFNLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsMEJBQTBCLENBQUMsQ0FBQzthQUN4RDtZQUNELE9BQU8sUUFBUSxDQUFDO1NBQ2pCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUE7QUFYRCxzQ0FXQztBQU1ELFNBQWdCLE1BQU0sQ0FBQyxLQUFhO0lBQ2xDLElBQUk7UUFDRixPQUFPLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNqQztJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1osT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzdCO0FBQ0gsQ0FBQztBQU5ELHdCQU1DO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLEdBQVcsRUFBRSxHQUFXO0lBQ3BELE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0QixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRTtRQUNoQyxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzdCO1NBQU07UUFDTCxPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3hDO0FBQ0gsQ0FBQztBQVJELHNDQVFDO0FBRUQsU0FBc0IsUUFBUSxDQUFDLE9BQWUsRUFBRSxXQUEwQjs7UUFDeEUsV0FBVyxHQUFHLENBQUMsQ0FBQyxXQUFXO1lBQ3pCLENBQUMsaUNBQU0sV0FBVyxLQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLElBQzdFLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUNsRSxNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7UUFDakMsT0FBTyxJQUFJLE9BQU8sQ0FBVyxDQUFPLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyRCxNQUFNLElBQUEsbUJBQVMsRUFBQyxPQUFPLEVBQUUsQ0FBQyxPQUFpQixFQUFFLEVBQUU7Z0JBQzdDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztnQkFDN0IsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFTLENBQUM7WUFHbEMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5RixPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBZEQsNEJBY0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXJzZSB9IGZyb20gJ3JlbGF4ZWQtanNvbic7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSwgSVdhbGtPcHRpb25zIH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgSVNEVk1vZE1hbmlmZXN0IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VNYW5pZmVzdChtYW5pZmVzdEZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElTRFZNb2RNYW5pZmVzdD4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtYW5pZmVzdERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1hbmlmZXN0RmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XHJcbiAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID0gcGFyc2UodXRpbC5kZUJPTShtYW5pZmVzdERhdGEpKSBhcyBJU0RWTW9kTWFuaWZlc3Q7XHJcbiAgICBpZiAoIW1hbmlmZXN0KSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdNYW5pZmVzdCBmaWxlIGlzIGludmFsaWQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtYW5pZmVzdDtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIHNlbXZlci5jb2VyY2UgZHJvcHMgcHJlLXJlbGVhc2UgaW5mb3JtYXRpb24gZnJvbSBhXHJcbiAqIHBlcmZlY3RseSB2YWxpZCBzZW1hbnRpYyB2ZXJzaW9uIHN0cmluZywgZG9uJ3Qgd2FudCB0aGF0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29lcmNlKGlucHV0OiBzdHJpbmcpOiBzZW12ZXIuU2VtVmVyIHtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIG5ldyBzZW12ZXIuU2VtVmVyKGlucHV0KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBzZW12ZXIuY29lcmNlKGlucHV0KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZW12ZXJDb21wYXJlKGxoczogc3RyaW5nLCByaHM6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgY29uc3QgbCA9IGNvZXJjZShsaHMpO1xyXG4gIGNvbnN0IHIgPSBjb2VyY2UocmhzKTtcclxuICBpZiAoKGwgIT09IG51bGwpICYmIChyICE9PSBudWxsKSkge1xyXG4gICAgcmV0dXJuIHNlbXZlci5jb21wYXJlKGwsIHIpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gbGhzLmxvY2FsZUNvbXBhcmUocmhzLCAnZW4tVVMnKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3YWxrUGF0aChkaXJQYXRoOiBzdHJpbmcsIHdhbGtPcHRpb25zPzogSVdhbGtPcHRpb25zKTogUHJvbWlzZTxJRW50cnlbXT4ge1xyXG4gIHdhbGtPcHRpb25zID0gISF3YWxrT3B0aW9uc1xyXG4gICAgPyB7IC4uLndhbGtPcHRpb25zLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfVxyXG4gICAgOiB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9O1xyXG4gIGNvbnN0IHdhbGtSZXN1bHRzOiBJRW50cnlbXSA9IFtdO1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRW50cnlbXT4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXdhaXQgdHVyYm93YWxrKGRpclBhdGgsIChlbnRyaWVzOiBJRW50cnlbXSkgPT4ge1xyXG4gICAgICB3YWxrUmVzdWx0cy5wdXNoKC4uLmVudHJpZXMpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkgYXMgYW55O1xyXG4gICAgICAvLyBJZiB0aGUgZGlyZWN0b3J5IGlzIG1pc3Npbmcgd2hlbiB3ZSB0cnkgdG8gd2FsayBpdDsgaXQncyBtb3N0IHByb2JhYmx5IGRvd24gdG8gYSBjb2xsZWN0aW9uIGJlaW5nXHJcbiAgICAgIC8vICBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBpbnN0YWxsZWQvcmVtb3ZlZC4gV2UgY2FuIHNhZmVseSBpZ25vcmUgdGhpcy5cclxuICAgIH0sIHdhbGtPcHRpb25zKS5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIHJldHVybiByZXNvbHZlKHdhbGtSZXN1bHRzKTtcclxuICB9KTtcclxufSJdfQ==