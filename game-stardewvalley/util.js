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
exports.walkPath = exports.semverCompare = exports.coerce = exports.parseManifest = exports.defaultModsRelPath = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBcUM7QUFDckMsK0NBQWlDO0FBQ2pDLDBEQUE0RDtBQUM1RCwyQ0FBc0M7QUFHdEMsU0FBZ0Isa0JBQWtCO0lBQ2hDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFGRCxnREFFQztBQUVELFNBQXNCLGFBQWEsQ0FBQyxnQkFBd0I7O1FBQzFELElBQUk7WUFDRixNQUFNLFlBQVksR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNyRixNQUFNLFFBQVEsR0FBb0IsSUFBQSxvQkFBSyxFQUFDLGlCQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFvQixDQUFDO1lBQ3JGLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2IsTUFBTSxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLENBQUM7YUFDeEQ7WUFDRCxPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBWEQsc0NBV0M7QUFNRCxTQUFnQixNQUFNLENBQUMsS0FBYTtJQUNsQyxJQUFJO1FBQ0YsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDakM7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM3QjtBQUNILENBQUM7QUFORCx3QkFNQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxHQUFXLEVBQUUsR0FBVztJQUNwRCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM3QjtTQUFNO1FBQ0wsT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN4QztBQUNILENBQUM7QUFSRCxzQ0FRQztBQUVELFNBQXNCLFFBQVEsQ0FBQyxPQUFlLEVBQUUsV0FBMEI7O1FBQ3hFLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVztZQUN6QixDQUFDLGlDQUFNLFdBQVcsS0FBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUM3RSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDbEUsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sSUFBSSxPQUFPLENBQVcsQ0FBTyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckQsTUFBTSxJQUFBLG1CQUFTLEVBQUMsT0FBTyxFQUFFLENBQUMsT0FBaUIsRUFBRSxFQUFFO2dCQUM3QyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBUyxDQUFDO1lBR2xDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUYsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQWRELDRCQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGFyc2UgfSBmcm9tICdyZWxheGVkLWpzb24nO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnksIElXYWxrT3B0aW9ucyB9IGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGZzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IElTRFZNb2RNYW5pZmVzdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRNb2RzUmVsUGF0aCgpOiBzdHJpbmcge1xyXG4gIHJldHVybiAnTW9kcyc7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZU1hbmlmZXN0KG1hbmlmZXN0RmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8SVNEVk1vZE1hbmlmZXN0PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1hbmlmZXN0RGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobWFuaWZlc3RGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KTtcclxuICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPSBwYXJzZSh1dGlsLmRlQk9NKG1hbmlmZXN0RGF0YSkpIGFzIElTRFZNb2RNYW5pZmVzdDtcclxuICAgIGlmICghbWFuaWZlc3QpIHtcclxuICAgICAgdGhyb3cgbmV3IHV0aWwuRGF0YUludmFsaWQoJ01hbmlmZXN0IGZpbGUgaXMgaW52YWxpZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1hbmlmZXN0O1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogc2VtdmVyLmNvZXJjZSBkcm9wcyBwcmUtcmVsZWFzZSBpbmZvcm1hdGlvbiBmcm9tIGFcclxuICogcGVyZmVjdGx5IHZhbGlkIHNlbWFudGljIHZlcnNpb24gc3RyaW5nLCBkb24ndCB3YW50IHRoYXRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb2VyY2UoaW5wdXQ6IHN0cmluZyk6IHNlbXZlci5TZW1WZXIge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gbmV3IHNlbXZlci5TZW1WZXIoaW5wdXQpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIHNlbXZlci5jb2VyY2UoaW5wdXQpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNlbXZlckNvbXBhcmUobGhzOiBzdHJpbmcsIHJoczogc3RyaW5nKTogbnVtYmVyIHtcclxuICBjb25zdCBsID0gY29lcmNlKGxocyk7XHJcbiAgY29uc3QgciA9IGNvZXJjZShyaHMpO1xyXG4gIGlmICgobCAhPT0gbnVsbCkgJiYgKHIgIT09IG51bGwpKSB7XHJcbiAgICByZXR1cm4gc2VtdmVyLmNvbXBhcmUobCwgcik7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBsaHMubG9jYWxlQ29tcGFyZShyaHMsICdlbi1VUycpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtQYXRoKGRpclBhdGg6IHN0cmluZywgd2Fsa09wdGlvbnM/OiBJV2Fsa09wdGlvbnMpOiBQcm9taXNlPElFbnRyeVtdPiB7XHJcbiAgd2Fsa09wdGlvbnMgPSAhIXdhbGtPcHRpb25zXHJcbiAgICA/IHsgLi4ud2Fsa09wdGlvbnMsIHNraXBIaWRkZW46IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9XHJcbiAgICA6IHsgc2tpcExpbmtzOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH07XHJcbiAgY29uc3Qgd2Fsa1Jlc3VsdHM6IElFbnRyeVtdID0gW107XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElFbnRyeVtdPihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBhd2FpdCB0dXJib3dhbGsoZGlyUGF0aCwgKGVudHJpZXM6IElFbnRyeVtdKSA9PiB7XHJcbiAgICAgIHdhbGtSZXN1bHRzLnB1c2goLi4uZW50cmllcyk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKSBhcyBhbnk7XHJcbiAgICAgIC8vIElmIHRoZSBkaXJlY3RvcnkgaXMgbWlzc2luZyB3aGVuIHdlIHRyeSB0byB3YWxrIGl0OyBpdCdzIG1vc3QgcHJvYmFibHkgZG93biB0byBhIGNvbGxlY3Rpb24gYmVpbmdcclxuICAgICAgLy8gIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGluc3RhbGxlZC9yZW1vdmVkLiBXZSBjYW4gc2FmZWx5IGlnbm9yZSB0aGlzLlxyXG4gICAgfSwgd2Fsa09wdGlvbnMpLmNhdGNoKGVyciA9PiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgcmV0dXJuIHJlc29sdmUod2Fsa1Jlc3VsdHMpO1xyXG4gIH0pO1xyXG59XHJcbiJdfQ==