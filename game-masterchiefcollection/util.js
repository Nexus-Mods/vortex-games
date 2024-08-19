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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRDtBQUVsRCxxQ0FBdUU7QUFHdkUsU0FBZ0IsaUJBQWlCLENBQUMsS0FBZTtJQUcvQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNqRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBRyxtQkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDckMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEIsT0FBTyxLQUFLLENBQUM7YUFDZDtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVCxDQUFDO0FBaEJELDhDQWdCQztBQUVELFNBQXNCLGVBQWUsQ0FBQyxHQUF3QixFQUFFLEtBQWM7O1FBQzVFLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN0QixJQUFJO1lBQ0YsWUFBWSxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQywrQkFBc0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQ3JGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNsQyxHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDMUcsT0FBTzthQUNSO1NBQ0Y7UUFDRCxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDMUUsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0UsSUFBSSxLQUFLLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3pCO2FBQU0sSUFBSSxDQUFDLEtBQUssSUFBSSxxQkFBcUIsRUFBRTtZQUMxQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0M7UUFDRCxNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLCtCQUFzQixDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsK0JBQXNCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDO0NBQUE7QUFwQkQsMENBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZzLCB0eXBlcywgc2VsZWN0b3JzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBIQUxPX0dBTUVTLCBNT0RfTUFOSUZFU1RfRklMRV9QQVRIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJSGFsb0dhbWUgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpZGVudGlmeUhhbG9HYW1lcyhmaWxlczogc3RyaW5nW10pOiBJSGFsb0dhbWVbXSB7XHJcbiAgLy8gRnVuY3Rpb24gYWltcyB0byBpZGVudGlmeSB0aGUgcmVsZXZhbnQgaGFsbyBnYW1lIGVudHJ5IHVzaW5nIHRoZVxyXG4gIC8vICBtb2QgZmlsZXMuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkgIT09ICcnKTtcclxuICByZXR1cm4gT2JqZWN0LmtleXMoSEFMT19HQU1FUykucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XHJcbiAgICBjb25zdCBlbnRyeSA9IEhBTE9fR0FNRVNba2V5XTtcclxuICAgIGZpbHRlcmVkLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gZWxlbWVudC5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcyhlbnRyeS5tb2RzUGF0aCkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBseVRvTWFuaWZlc3QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBhcHBseTogYm9vbGVhbikge1xyXG4gIGxldCBtYW5pZmVzdERhdGEgPSAnJztcclxuICB0cnkge1xyXG4gICAgbWFuaWZlc3REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhNT0RfTUFOSUZFU1RfRklMRV9QQVRILCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoIVsnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpKSB7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZCBtYW5pZmVzdCBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiBlcnIuY29kZSAhPT0gJ0VQRVJNJyB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuICBjb25zdCBzdGFnaW5nUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGxpbmVzID0gbWFuaWZlc3REYXRhLnNwbGl0KCdcXHJcXG4nKTtcclxuICBjb25zdCBoYXNTdGFnaW5nRm9sZGVyRW50cnkgPSBsaW5lcy5zb21lKGxpbmUgPT4gbGluZS5pbmNsdWRlcyhzdGFnaW5nUGF0aCkpO1xyXG4gIGlmIChhcHBseSAmJiAhaGFzU3RhZ2luZ0ZvbGRlckVudHJ5KSB7XHJcbiAgICBsaW5lcy5wdXNoKHN0YWdpbmdQYXRoKTtcclxuICB9IGVsc2UgaWYgKCFhcHBseSAmJiBoYXNTdGFnaW5nRm9sZGVyRW50cnkpIHtcclxuICAgIGxpbmVzLnNwbGljZShsaW5lcy5pbmRleE9mKHN0YWdpbmdQYXRoKSwgMSk7XHJcbiAgfVxyXG4gIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKE1PRF9NQU5JRkVTVF9GSUxFX1BBVEgpKTtcclxuICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhNT0RfTUFOSUZFU1RfRklMRV9QQVRILCBsaW5lcy5maWx0ZXIobGluZSA9PiAhIWxpbmUpLmpvaW4oJ1xcclxcbicpKTtcclxufSJdfQ==