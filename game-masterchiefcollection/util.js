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
exports.identifyHaloGames = identifyHaloGames;
exports.applyToManifest = applyToManifest;
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
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(common_1.MOD_MANIFEST_FILE_PATH));
            yield vortex_api_1.fs.writeFileAsync(common_1.MOD_MANIFEST_FILE_PATH, lines.filter(line => !!line).join('\r\n'));
        }
        catch (err) {
            api.showErrorNotification('Failed to write mod manifest file', err, { allowReport: err.code !== 'EPERM' });
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFNQSw4Q0FnQkM7QUFFRCwwQ0F3QkM7QUFoREQsZ0RBQXdCO0FBQ3hCLDJDQUFrRDtBQUVsRCxxQ0FBdUU7QUFHdkUsU0FBZ0IsaUJBQWlCLENBQUMsS0FBZTtJQUcvQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNqRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBRyxtQkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQixPQUFPLEtBQUssQ0FBQztZQUNmLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1QsQ0FBQztBQUVELFNBQXNCLGVBQWUsQ0FBQyxHQUF3QixFQUFFLEtBQWM7O1FBQzVFLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUM7WUFDSCxZQUFZLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLCtCQUFzQixFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRyxPQUFPO1lBQ1QsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDMUUsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0UsSUFBSSxLQUFLLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUIsQ0FBQzthQUFNLElBQUksQ0FBQyxLQUFLLElBQUkscUJBQXFCLEVBQUUsQ0FBQztZQUMzQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUNELElBQUksQ0FBQztZQUNILE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsK0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQywrQkFBc0IsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLHFCQUFxQixDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDN0csQ0FBQztJQUNILENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgdHlwZXMsIHNlbGVjdG9ycyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSEFMT19HQU1FUywgTU9EX01BTklGRVNUX0ZJTEVfUEFUSCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSUhhbG9HYW1lIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaWRlbnRpZnlIYWxvR2FtZXMoZmlsZXM6IHN0cmluZ1tdKTogSUhhbG9HYW1lW10ge1xyXG4gIC8vIEZ1bmN0aW9uIGFpbXMgdG8gaWRlbnRpZnkgdGhlIHJlbGV2YW50IGhhbG8gZ2FtZSBlbnRyeSB1c2luZyB0aGVcclxuICAvLyAgbW9kIGZpbGVzLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpICE9PSAnJyk7XHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgY29uc3QgZW50cnkgPSBIQUxPX0dBTUVTW2tleV07XHJcbiAgICBmaWx0ZXJlZC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IGVsZW1lbnQuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoZW50cnkubW9kc1BhdGgpKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgW10pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXBwbHlUb01hbmlmZXN0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgYXBwbHk6IGJvb2xlYW4pIHtcclxuICBsZXQgbWFuaWZlc3REYXRhID0gJyc7XHJcbiAgdHJ5IHtcclxuICAgIG1hbmlmZXN0RGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoTU9EX01BTklGRVNUX0ZJTEVfUEFUSCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKCFbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSkge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2QgbWFuaWZlc3QgZmlsZScsIGVyciwgeyBhbGxvd1JlcG9ydDogZXJyLmNvZGUgIT09ICdFUEVSTScgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9XHJcbiAgY29uc3Qgc3RhZ2luZ1BhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICBjb25zdCBsaW5lcyA9IG1hbmlmZXN0RGF0YS5zcGxpdCgnXFxyXFxuJyk7XHJcbiAgY29uc3QgaGFzU3RhZ2luZ0ZvbGRlckVudHJ5ID0gbGluZXMuc29tZShsaW5lID0+IGxpbmUuaW5jbHVkZXMoc3RhZ2luZ1BhdGgpKTtcclxuICBpZiAoYXBwbHkgJiYgIWhhc1N0YWdpbmdGb2xkZXJFbnRyeSkge1xyXG4gICAgbGluZXMucHVzaChzdGFnaW5nUGF0aCk7XHJcbiAgfSBlbHNlIGlmICghYXBwbHkgJiYgaGFzU3RhZ2luZ0ZvbGRlckVudHJ5KSB7XHJcbiAgICBsaW5lcy5zcGxpY2UobGluZXMuaW5kZXhPZihzdGFnaW5nUGF0aCksIDEpO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoTU9EX01BTklGRVNUX0ZJTEVfUEFUSCkpO1xyXG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoTU9EX01BTklGRVNUX0ZJTEVfUEFUSCwgbGluZXMuZmlsdGVyKGxpbmUgPT4gISFsaW5lKS5qb2luKCdcXHJcXG4nKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIG1hbmlmZXN0IGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGVyci5jb2RlICE9PSAnRVBFUk0nIH0pO1xyXG4gIH1cclxufSJdfQ==