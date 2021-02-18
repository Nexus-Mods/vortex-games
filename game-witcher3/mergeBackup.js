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
exports.restoreFromProfile = exports.storeToProfile = void 0;
const turbowalk_1 = __importDefault(require("turbowalk"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const scriptmerger_1 = require("./scriptmerger");
const sortInc = (lhs, rhs) => lhs.length - rhs.length;
const sortDec = (lhs, rhs) => rhs.length - lhs.length;
function genBaseProps(context, profileId) {
    var _a;
    if (!profileId) {
        return undefined;
    }
    const state = context.api.getState();
    const profile = vortex_api_1.selectors.profileById(state, profileId);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    const localMergedScripts = vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profileId, 'features', 'local_merges'], false);
    if (!localMergedScripts) {
        return undefined;
    }
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    const scriptMergerTool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a[common_1.SCRIPT_MERGER_ID];
    if (!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
        return undefined;
    }
    return { state, profile, scriptMergerTool, gamePath: discovery.path };
}
function getFileEntries(filePath) {
    let files = [];
    return turbowalk_1.default(filePath, entries => {
        const validEntries = entries.filter(entry => !entry.isDirectory)
            .map(entry => entry.filePath);
        files = files.concat(validEntries);
    }, { recurse: true })
        .catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
        ? Promise.resolve()
        : Promise.reject(err))
        .then(() => Promise.resolve(files));
}
function moveFile(from, to, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const src = path_1.default.join(from, fileName);
        const dest = path_1.default.join(to, fileName);
        try {
            yield copyFile(src, dest);
        }
        catch (err) {
            return (err.code !== 'ENOENT')
                ? Promise.reject(err)
                : Promise.resolve();
        }
    });
}
function removeFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (path_1.default.extname(filePath) === '') {
            return;
        }
        try {
            yield vortex_api_1.fs.removeAsync(filePath);
        }
        catch (err) {
            return (err.code === 'ENOENT')
                ? Promise.resolve()
                : Promise.reject(err);
        }
    });
}
function copyFile(src, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest));
        yield removeFile(dest);
        yield vortex_api_1.fs.copyAsync(src, dest);
    });
}
function moveFiles(src, dest, cleanUp = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const destFiles = yield getFileEntries(dest);
            destFiles.sort(sortDec);
            for (const destFile of destFiles) {
                yield vortex_api_1.fs.removeAsync(destFile);
            }
        }
        catch (err) {
            throw new vortex_api_1.util.ProcessCanceled(err.message);
        }
        const copied = [];
        try {
            const srcFiles = yield getFileEntries(src);
            srcFiles.sort(sortInc);
            for (const srcFile of srcFiles) {
                const relPath = path_1.default.relative(src, srcFile);
                const targetPath = path_1.default.join(dest, relPath);
                yield copyFile(srcFile, targetPath);
                copied.push(targetPath);
            }
            if (cleanUp) {
                srcFiles.sort(sortDec);
                for (const srcFile of srcFiles) {
                    yield vortex_api_1.fs.removeAsync(srcFile);
                }
            }
        }
        catch (err) {
            if (!!err.path && !err.path.includes(dest)) {
                return;
            }
            copied.sort(sortDec);
            for (const link of copied) {
                yield vortex_api_1.fs.removeAsync(link);
            }
        }
    });
}
function handleMergedScripts(props, opType) {
    return __awaiter(this, void 0, void 0, function* () {
        const { scriptMergerTool, profile, gamePath } = props;
        if (!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
            throw new vortex_api_1.util.NotFound('Script merging tool path');
        }
        if (!(profile === null || profile === void 0 ? void 0 : profile.id)) {
            throw new vortex_api_1.util.ArgumentInvalid('invalid profile');
        }
        const mergerToolDir = path_1.default.dirname(scriptMergerTool.path);
        const profilePath = path_1.default.join(mergerToolDir, profile.id);
        const loarOrderFilepath = common_1.getLoadOrderFilePath();
        const mergedModName = yield scriptmerger_1.getMergedModName(mergerToolDir);
        const mergedScriptsPath = path_1.default.join(gamePath, 'Mods', mergedModName);
        if (opType === 'export') {
            yield moveFile(mergerToolDir, profilePath, common_1.MERGE_INV_MANIFEST);
            yield moveFile(path_1.default.dirname(loarOrderFilepath), profilePath, path_1.default.basename(loarOrderFilepath));
            yield moveFiles(mergedScriptsPath, path_1.default.join(profilePath, mergedModName));
        }
        else if (opType === 'import') {
            yield moveFile(profilePath, mergerToolDir, common_1.MERGE_INV_MANIFEST);
            yield moveFile(profilePath, path_1.default.dirname(loarOrderFilepath), path_1.default.basename(loarOrderFilepath));
            yield moveFiles(path_1.default.join(profilePath, mergedModName), mergedScriptsPath, false);
        }
    });
}
function storeToProfile(context, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId);
        if (props === undefined) {
            return;
        }
        yield handleMergedScripts(props, 'export');
    });
}
exports.storeToProfile = storeToProfile;
function restoreFromProfile(context, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId);
        if (props === undefined) {
            return;
        }
        yield handleMergedScripts(props, 'import');
    });
}
exports.restoreFromProfile = restoreFromProfile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwREFBa0M7QUFHbEMsZ0RBQXdCO0FBQ3hCLDJDQUFzRTtBQUV0RSxxQ0FDZ0U7QUFFaEUsaURBQWtEO0FBVWxELE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ3RFLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBRXRFLFNBQVMsWUFBWSxDQUFDLE9BQWdDLEVBQUUsU0FBaUI7O0lBQ3ZFLElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDckMsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RSxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxrQkFBa0IsR0FBWSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3BELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVFLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sU0FBUyxHQUEyQixpQkFBSSxDQUFD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RUFBRTtZQUN2QixPQUFPO1NBQ1I7UUFFRCxNQUFNLG1CQUFtQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQUE7QUFQRCx3Q0FPQztBQUVELFNBQXNCLGtCQUFrQixDQUFDLE9BQWdDLEVBQUUsU0FBaUI7O1FBQzFGLE1BQU0sS0FBSyxHQUFlLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0QsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU87U0FDUjtRQUVELE1BQU0sbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FBQTtBQVBELGdEQU9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5cclxuaW1wb3J0IHsgYXBwLCByZW1vdGUgfSBmcm9tICdlbGVjdHJvbic7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCxcclxuICAgICAgICAgTUVSR0VfSU5WX01BTklGRVNULCBTQ1JJUFRfTUVSR0VSX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZSB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbnR5cGUgT3BUeXBlID0gJ2ltcG9ydCcgfCAnZXhwb3J0JztcclxuaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIHN0YXRlOiB0eXBlcy5JU3RhdGU7XHJcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XHJcbiAgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sO1xyXG4gIGdhbWVQYXRoOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IHNvcnRJbmMgPSAobGhzOiBzdHJpbmcsIHJoczogc3RyaW5nKSA9PiBsaHMubGVuZ3RoIC0gcmhzLmxlbmd0aDtcclxuY29uc3Qgc29ydERlYyA9IChsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpID0+IHJocy5sZW5ndGggLSBsaHMubGVuZ3RoO1xyXG5cclxuZnVuY3Rpb24gZ2VuQmFzZVByb3BzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ6IHN0cmluZyk6IElCYXNlUHJvcHMge1xyXG4gIGlmICghcHJvZmlsZUlkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvY2FsTWVyZ2VkU2NyaXB0czogYm9vbGVhbiA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZCwgJ2ZlYXR1cmVzJywgJ2xvY2FsX21lcmdlcyddLCBmYWxzZSk7XHJcbiAgaWYgKCFsb2NhbE1lcmdlZFNjcmlwdHMpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bU0NSSVBUX01FUkdFUl9JRF07XHJcbiAgaWYgKCFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICAvLyBSZWdhcmRsZXNzIG9mIHRoZSB1c2VyJ3MgcHJvZmlsZSBzZXR0aW5ncyAtIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gYmFja2luZyB1cFxyXG4gICAgLy8gIHRoZSBtZXJnZXMgaWYgd2UgZG9uJ3Qga25vdyB3aGVyZSB0aGUgc2NyaXB0IG1lcmdlciBpcyFcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBzdGF0ZSwgcHJvZmlsZSwgc2NyaXB0TWVyZ2VyVG9vbCwgZ2FtZVBhdGg6IGRpc2NvdmVyeS5wYXRoIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEZpbGVFbnRyaWVzKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgbGV0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gIHJldHVybiB0dXJib3dhbGsoZmlsZVBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgY29uc3QgdmFsaWRFbnRyaWVzID0gZW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgZmlsZXMgPSBmaWxlcy5jb25jYXQodmFsaWRFbnRyaWVzKTtcclxuICB9LCB7IHJlY3Vyc2U6IHRydWUgfSlcclxuICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlcykpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBtb3ZlRmlsZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGZpbGVOYW1lOiBzdHJpbmcpIHtcclxuICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oZnJvbSwgZmlsZU5hbWUpO1xyXG4gIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4odG8sIGZpbGVOYW1lKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgY29weUZpbGUoc3JjLCBkZXN0KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKVxyXG4gICAgICA/IFByb21pc2UucmVqZWN0KGVycilcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChwYXRoLmV4dG5hbWUoZmlsZVBhdGgpID09PSAnJykge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY29weUZpbGUoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xyXG4gIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGRlc3QpKTtcclxuICBhd2FpdCByZW1vdmVGaWxlKGRlc3QpO1xyXG4gIGF3YWl0IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBtb3ZlRmlsZXMoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZywgY2xlYW5VcDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRlc3RGaWxlczogc3RyaW5nW10gPSBhd2FpdCBnZXRGaWxlRW50cmllcyhkZXN0KTtcclxuICAgIGRlc3RGaWxlcy5zb3J0KHNvcnREZWMpO1xyXG4gICAgZm9yIChjb25zdCBkZXN0RmlsZSBvZiBkZXN0RmlsZXMpIHtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdEZpbGUpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgLy8gV2UgZmFpbGVkIHRvIGNsZWFuIHVwIHRoZSBkZXN0aW5hdGlvbiBmb2xkZXIgLSB3ZSBjYW4ndFxyXG4gICAgLy8gIGNvbnRpbnVlLlxyXG4gICAgdGhyb3cgbmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKGVyci5tZXNzYWdlKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNvcGllZDogc3RyaW5nW10gPSBbXTtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc3JjRmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoc3JjKTtcclxuICAgIHNyY0ZpbGVzLnNvcnQoc29ydEluYyk7XHJcbiAgICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoc3JjLCBzcmNGaWxlKTtcclxuICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihkZXN0LCByZWxQYXRoKTtcclxuICAgICAgYXdhaXQgY29weUZpbGUoc3JjRmlsZSwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgIGNvcGllZC5wdXNoKHRhcmdldFBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjbGVhblVwKSB7XHJcbiAgICAgIC8vIFdlIG1hbmFnZWQgdG8gY29weSBhbGwgdGhlIGZpbGVzLCBjbGVhbiB1cCB0aGUgc291cmNlXHJcbiAgICAgIHNyY0ZpbGVzLnNvcnQoc29ydERlYyk7XHJcbiAgICAgIGZvciAoY29uc3Qgc3JjRmlsZSBvZiBzcmNGaWxlcykge1xyXG4gICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKHNyY0ZpbGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoISFlcnIucGF0aCAmJiAhZXJyLnBhdGguaW5jbHVkZXMoZGVzdCkpIHtcclxuICAgICAgLy8gV2UgZmFpbGVkIHRvIGNsZWFuIHVwIHRoZSBzb3VyY2VcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlIGZhaWxlZCB0byBjb3B5IC0gY2xlYW4gdXAuXHJcbiAgICBjb3BpZWQuc29ydChzb3J0RGVjKTtcclxuICAgIGZvciAoY29uc3QgbGluayBvZiBjb3BpZWQpIHtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobGluayk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzOiBJQmFzZVByb3BzLCBvcFR5cGU6IE9wVHlwZSkge1xyXG4gIGNvbnN0IHsgc2NyaXB0TWVyZ2VyVG9vbCwgcHJvZmlsZSwgZ2FtZVBhdGggfSA9IHByb3BzO1xyXG4gIGlmICghc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgdGhyb3cgbmV3IHV0aWwuTm90Rm91bmQoJ1NjcmlwdCBtZXJnaW5nIHRvb2wgcGF0aCcpO1xyXG4gIH1cclxuICBpZiAoIXByb2ZpbGU/LmlkKSB7XHJcbiAgICB0aHJvdyBuZXcgdXRpbC5Bcmd1bWVudEludmFsaWQoJ2ludmFsaWQgcHJvZmlsZScpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbWVyZ2VyVG9vbERpciA9IHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXJUb29sLnBhdGgpO1xyXG4gIGNvbnN0IHByb2ZpbGVQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4obWVyZ2VyVG9vbERpciwgcHJvZmlsZS5pZCk7XHJcbiAgY29uc3QgbG9hck9yZGVyRmlsZXBhdGg6IHN0cmluZyA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgbWVyZ2VkTW9kTmFtZSA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWUobWVyZ2VyVG9vbERpcik7XHJcbiAgY29uc3QgbWVyZ2VkU2NyaXB0c1BhdGggPSBwYXRoLmpvaW4oZ2FtZVBhdGgsICdNb2RzJywgbWVyZ2VkTW9kTmFtZSk7XHJcblxyXG4gIGlmIChvcFR5cGUgPT09ICdleHBvcnQnKSB7XHJcbiAgICBhd2FpdCBtb3ZlRmlsZShtZXJnZXJUb29sRGlyLCBwcm9maWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNUKTtcclxuICAgIGF3YWl0IG1vdmVGaWxlKHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHByb2ZpbGVQYXRoLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XHJcbiAgICBhd2FpdCBtb3ZlRmlsZXMobWVyZ2VkU2NyaXB0c1BhdGgsIHBhdGguam9pbihwcm9maWxlUGF0aCwgbWVyZ2VkTW9kTmFtZSkpO1xyXG4gIH0gZWxzZSBpZiAob3BUeXBlID09PSAnaW1wb3J0Jykge1xyXG4gICAgYXdhaXQgbW92ZUZpbGUocHJvZmlsZVBhdGgsIG1lcmdlclRvb2xEaXIsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XHJcbiAgICBhd2FpdCBtb3ZlRmlsZShwcm9maWxlUGF0aCwgcGF0aC5kaXJuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSwgcGF0aC5iYXNlbmFtZShsb2FyT3JkZXJGaWxlcGF0aCkpO1xyXG4gICAgYXdhaXQgbW92ZUZpbGVzKHBhdGguam9pbihwcm9maWxlUGF0aCwgbWVyZ2VkTW9kTmFtZSksIG1lcmdlZFNjcmlwdHNQYXRoLCBmYWxzZSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVUb1Byb2ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2V4cG9ydCcpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdpbXBvcnQnKTtcclxufVxyXG4iXX0=