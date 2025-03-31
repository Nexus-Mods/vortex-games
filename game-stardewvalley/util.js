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
exports.deleteFolder = exports.walkPath = exports.semverCompare = exports.coerce = exports.parseManifest = exports.defaultModsRelPath = void 0;
const relaxed_json_1 = require("relaxed-json");
const semver = __importStar(require("semver"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
function defaultModsRelPath() {
    return 'Mods';
}
exports.defaultModsRelPath = defaultModsRelPath;
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
exports.deleteFolder = deleteFolder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBcUM7QUFDckMsK0NBQWlDO0FBQ2pDLDBEQUE0RDtBQUM1RCwyQ0FBc0M7QUFHdEMsU0FBZ0Isa0JBQWtCO0lBQ2hDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFGRCxnREFFQztBQUVELFNBQXNCLGFBQWEsQ0FBQyxnQkFBd0I7O1FBQzFELElBQUk7WUFDRixNQUFNLFlBQVksR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNyRixNQUFNLFFBQVEsR0FBb0IsSUFBQSxvQkFBSyxFQUFDLGlCQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFvQixDQUFDO1lBQ3JGLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2IsTUFBTSxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLENBQUM7YUFDeEQ7WUFDRCxPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBWEQsc0NBV0M7QUFNRCxTQUFnQixNQUFNLENBQUMsS0FBYTtJQUNsQyxJQUFJO1FBQ0YsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDakM7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM3QjtBQUNILENBQUM7QUFORCx3QkFNQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxHQUFXLEVBQUUsR0FBVztJQUNwRCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM3QjtTQUFNO1FBQ0wsT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN4QztBQUNILENBQUM7QUFSRCxzQ0FRQztBQUVELFNBQXNCLFFBQVEsQ0FBQyxPQUFlLEVBQUUsV0FBMEI7O1FBQ3hFLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVztZQUN6QixDQUFDLGlDQUFNLFdBQVcsS0FBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUM3RSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDbEUsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sSUFBSSxPQUFPLENBQVcsQ0FBTyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckQsTUFBTSxJQUFBLG1CQUFTLEVBQUMsT0FBTyxFQUFFLENBQUMsT0FBaUIsRUFBRSxFQUFFO2dCQUM3QyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBUyxDQUFDO1lBR2xDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUYsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQWRELDRCQWNDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWUsRUFBRSxXQUEwQjs7UUFDNUUsSUFBSTtZQUNGLE1BQU0sT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNyRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5RCxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRTtnQkFDM0IsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN0QztZQUNELE1BQU0sZUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM5QjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBWEQsb0NBV0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXJzZSB9IGZyb20gJ3JlbGF4ZWQtanNvbic7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSwgSVdhbGtPcHRpb25zIH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgSVNEVk1vZE1hbmlmZXN0IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdE1vZHNSZWxQYXRoKCk6IHN0cmluZyB7XHJcbiAgcmV0dXJuICdNb2RzJztcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlTWFuaWZlc3QobWFuaWZlc3RGaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJU0RWTW9kTWFuaWZlc3Q+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgbWFuaWZlc3REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtYW5pZmVzdEZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xyXG4gICAgY29uc3QgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdCA9IHBhcnNlKHV0aWwuZGVCT00obWFuaWZlc3REYXRhKSkgYXMgSVNEVk1vZE1hbmlmZXN0O1xyXG4gICAgaWYgKCFtYW5pZmVzdCkge1xyXG4gICAgICB0aHJvdyBuZXcgdXRpbC5EYXRhSW52YWxpZCgnTWFuaWZlc3QgZmlsZSBpcyBpbnZhbGlkJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWFuaWZlc3Q7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBzZW12ZXIuY29lcmNlIGRyb3BzIHByZS1yZWxlYXNlIGluZm9ybWF0aW9uIGZyb20gYVxyXG4gKiBwZXJmZWN0bHkgdmFsaWQgc2VtYW50aWMgdmVyc2lvbiBzdHJpbmcsIGRvbid0IHdhbnQgdGhhdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZShpbnB1dDogc3RyaW5nKTogc2VtdmVyLlNlbVZlciB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBuZXcgc2VtdmVyLlNlbVZlcihpbnB1dCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gc2VtdmVyLmNvZXJjZShpbnB1dCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VtdmVyQ29tcGFyZShsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gIGNvbnN0IGwgPSBjb2VyY2UobGhzKTtcclxuICBjb25zdCByID0gY29lcmNlKHJocyk7XHJcbiAgaWYgKChsICE9PSBudWxsKSAmJiAociAhPT0gbnVsbCkpIHtcclxuICAgIHJldHVybiBzZW12ZXIuY29tcGFyZShsLCByKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGxocy5sb2NhbGVDb21wYXJlKHJocywgJ2VuLVVTJyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa1BhdGgoZGlyUGF0aDogc3RyaW5nLCB3YWxrT3B0aW9ucz86IElXYWxrT3B0aW9ucyk6IFByb21pc2U8SUVudHJ5W10+IHtcclxuICB3YWxrT3B0aW9ucyA9ICEhd2Fsa09wdGlvbnNcclxuICAgID8geyAuLi53YWxrT3B0aW9ucywgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH1cclxuICAgIDogeyBza2lwTGlua3M6IHRydWUsIHNraXBIaWRkZW46IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUgfTtcclxuICBjb25zdCB3YWxrUmVzdWx0czogSUVudHJ5W10gPSBbXTtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SUVudHJ5W10+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcclxuICAgICAgd2Fsa1Jlc3VsdHMucHVzaCguLi5lbnRyaWVzKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpIGFzIGFueTtcclxuICAgICAgLy8gSWYgdGhlIGRpcmVjdG9yeSBpcyBtaXNzaW5nIHdoZW4gd2UgdHJ5IHRvIHdhbGsgaXQ7IGl0J3MgbW9zdCBwcm9iYWJseSBkb3duIHRvIGEgY29sbGVjdGlvbiBiZWluZ1xyXG4gICAgICAvLyAgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgaW5zdGFsbGVkL3JlbW92ZWQuIFdlIGNhbiBzYWZlbHkgaWdub3JlIHRoaXMuXHJcbiAgICB9LCB3YWxrT3B0aW9ucykuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICByZXR1cm4gcmVzb2x2ZSh3YWxrUmVzdWx0cyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVGb2xkZXIoZGlyUGF0aDogc3RyaW5nLCB3YWxrT3B0aW9ucz86IElXYWxrT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgd2Fsa1BhdGgoZGlyUGF0aCwgd2Fsa09wdGlvbnMpO1xyXG4gICAgZW50cmllcy5zb3J0KChhLCBiKSA9PiBiLmZpbGVQYXRoLmxlbmd0aCAtIGEuZmlsZVBhdGgubGVuZ3RoKTtcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgICBhd2FpdCBmcy5ybWRpckFzeW5jKGRpclBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcbiJdfQ==