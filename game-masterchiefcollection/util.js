"use strict";
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
exports.applyToManifest = exports.identifyHaloGames = void 0;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function identifyHaloGames(files) {
    const filtered = files.filter(file => path_1.default.extname(file) !== '');
    return Object.keys(common_1.HALO_GAMES).reduce((accum, key) => {
        const entry = common_1.HALO_GAMES[key];
        filtered.forEach(element => {
            const segments = element.split(path_1.default.sep);
            if (segments.includes(entry.modsPath)) {
                accum.push(entry);
                return accum;
            }
        });
        return accum;
    }, []);
}
exports.identifyHaloGames = identifyHaloGames;
function applyToManifest(api, apply) {
    return __awaiter(this, void 0, void 0, function* () {
        let manifestData = '';
        try {
            manifestData = yield vortex_api_1.fs.readFileAsync(common_1.MOD_MANIFEST_FILE_PATH, { encoding: 'utf8' });
        }
        catch (err) {
            if (!['ENOENT'].includes(err.code)) {
                api.showErrorNotification('Failed to read mod manifest file', err, { allowReport: err.code !== 'EPERM' });
                return;
            }
        }
        const stagingPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
        const lines = manifestData.split('\r\n');
        const hasStagingFolderEntry = lines.some(line => line.includes(stagingPath));
        if (apply && !hasStagingFolderEntry) {
            lines.push(stagingPath);
        }
        else if (!apply && hasStagingFolderEntry) {
            lines.splice(lines.indexOf(stagingPath), 1);
        }
        yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(common_1.MOD_MANIFEST_FILE_PATH));
        yield vortex_api_1.fs.writeFileAsync(common_1.MOD_MANIFEST_FILE_PATH, lines.filter(line => !!line).join('\r\n'));
    });
}
exports.applyToManifest = applyToManifest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRDtBQUVsRCxxQ0FBdUU7QUFHdkUsU0FBZ0IsaUJBQWlCLENBQUMsS0FBZTtJQUcvQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNqRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBRyxtQkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDckMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEIsT0FBTyxLQUFLLENBQUM7YUFDZDtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVCxDQUFDO0FBaEJELDhDQWdCQztBQUlELFNBQXNCLGVBQWUsQ0FBQyxHQUF3QixFQUFFLEtBQWM7O1FBQzVFLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN0QixJQUFJO1lBQ0YsWUFBWSxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQywrQkFBc0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQ3JGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNsQyxHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDMUcsT0FBTzthQUNSO1NBQ0Y7UUFDRCxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDMUUsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0UsSUFBSSxLQUFLLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3pCO2FBQU0sSUFBSSxDQUFDLEtBQUssSUFBSSxxQkFBcUIsRUFBRTtZQUMxQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0M7UUFDRCxNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLCtCQUFzQixDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsK0JBQXNCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDO0NBQUE7QUFwQkQsMENBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZzLCB0eXBlcywgc2VsZWN0b3JzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBIQUxPX0dBTUVTLCBNT0RfTUFOSUZFU1RfRklMRV9QQVRIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJSGFsb0dhbWUgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpZGVudGlmeUhhbG9HYW1lcyhmaWxlczogc3RyaW5nW10pOiBJSGFsb0dhbWVbXSB7XHJcbiAgLy8gRnVuY3Rpb24gYWltcyB0byBpZGVudGlmeSB0aGUgcmVsZXZhbnQgaGFsbyBnYW1lIGVudHJ5IHVzaW5nIHRoZVxyXG4gIC8vICBtb2QgZmlsZXMuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkgIT09ICcnKTtcclxuICByZXR1cm4gT2JqZWN0LmtleXMoSEFMT19HQU1FUykucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XHJcbiAgICBjb25zdCBlbnRyeSA9IEhBTE9fR0FNRVNba2V5XTtcclxuICAgIGZpbHRlcmVkLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gZWxlbWVudC5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcyhlbnRyeS5tb2RzUGF0aCkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFwcGx5VG9NYW5pZmVzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGFwcGx5OiBib29sZWFuKSB7XHJcbiAgbGV0IG1hbmlmZXN0RGF0YSA9ICcnO1xyXG4gIHRyeSB7XHJcbiAgICBtYW5pZmVzdERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKE1PRF9NQU5JRkVTVF9GSUxFX1BBVEgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmICghWydFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbW9kIG1hbmlmZXN0IGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGVyci5jb2RlICE9PSAnRVBFUk0nIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0IHN0YWdpbmdQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgbGluZXMgPSBtYW5pZmVzdERhdGEuc3BsaXQoJ1xcclxcbicpO1xyXG4gIGNvbnN0IGhhc1N0YWdpbmdGb2xkZXJFbnRyeSA9IGxpbmVzLnNvbWUobGluZSA9PiBsaW5lLmluY2x1ZGVzKHN0YWdpbmdQYXRoKSk7XHJcbiAgaWYgKGFwcGx5ICYmICFoYXNTdGFnaW5nRm9sZGVyRW50cnkpIHtcclxuICAgIGxpbmVzLnB1c2goc3RhZ2luZ1BhdGgpO1xyXG4gIH0gZWxzZSBpZiAoIWFwcGx5ICYmIGhhc1N0YWdpbmdGb2xkZXJFbnRyeSkge1xyXG4gICAgbGluZXMuc3BsaWNlKGxpbmVzLmluZGV4T2Yoc3RhZ2luZ1BhdGgpLCAxKTtcclxuICB9XHJcbiAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoTU9EX01BTklGRVNUX0ZJTEVfUEFUSCkpO1xyXG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKE1PRF9NQU5JRkVTVF9GSUxFX1BBVEgsIGxpbmVzLmZpbHRlcihsaW5lID0+ICEhbGluZSkuam9pbignXFxyXFxuJykpO1xyXG59Il19