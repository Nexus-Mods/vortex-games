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
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
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
        return handleMergedScripts(props, 'export');
    });
}
exports.storeToProfile = storeToProfile;
function restoreFromProfile(context, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId);
        if (props === undefined) {
            return;
        }
        return handleMergedScripts(props, 'import');
    });
}
exports.restoreFromProfile = restoreFromProfile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUV0RSxxQ0FDZ0U7QUFFaEUsaURBQWtEO0FBVWxELE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ3RFLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBRXRFLFNBQVMsWUFBWSxDQUFDLE9BQWdDLEVBQUUsU0FBaUI7O0lBQ3ZFLElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDckMsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RSxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxrQkFBa0IsR0FBWSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3BELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVFLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sU0FBUyxHQUEyQixpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzFELENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlELE1BQU0sZ0JBQWdCLFNBQTBCLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxLQUFLLDBDQUFHLHlCQUFnQixDQUFDLENBQUM7SUFDckYsSUFBSSxFQUFDLGdCQUFnQixhQUFoQixnQkFBZ0IsdUJBQWhCLGdCQUFnQixDQUFFLElBQUksQ0FBQSxFQUFFO1FBRzNCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN4RSxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsUUFBZ0I7SUFDdEMsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQ3pCLE9BQU8sbUJBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDbkMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQzthQUNuQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUQsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1NBQ3BCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ3RELENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ25CLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUVELFNBQWUsUUFBUSxDQUFDLElBQVksRUFBRSxFQUFVLEVBQUUsUUFBZ0I7O1FBQ2hFLE1BQU0sR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLElBQUk7WUFDRixNQUFNLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDM0I7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO2dCQUNyQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBZSxVQUFVLENBQUMsUUFBZ0I7O1FBQ3hDLElBQUksY0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDakMsT0FBTztTQUNSO1FBQ0QsSUFBSTtZQUNGLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO2dCQUM1QixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtnQkFDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekI7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFlLFFBQVEsQ0FBQyxHQUFXLEVBQUUsSUFBWTs7UUFDL0MsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUFBO0FBRUQsU0FBZSxTQUFTLENBQUMsR0FBVyxFQUFFLElBQVksRUFBRSxVQUFtQixLQUFLOztRQUMxRSxJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQWEsTUFBTSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkQsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4QixLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRTtnQkFDaEMsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ2hDO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUdaLE1BQU0sSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDN0M7UUFFRCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDNUIsSUFBSTtZQUNGLE1BQU0sUUFBUSxHQUFhLE1BQU0sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JELFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7Z0JBQzlCLE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLFVBQVUsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxRQUFRLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3pCO1lBRUQsSUFBSSxPQUFPLEVBQUU7Z0JBRVgsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdkIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7b0JBQzlCLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDL0I7YUFDRjtTQUNGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBRTFDLE9BQU87YUFDUjtZQUdELE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLEVBQUU7Z0JBQ3pCLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM1QjtTQUNGO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBZSxtQkFBbUIsQ0FBQyxLQUFpQixFQUFFLE1BQWM7O1FBQ2xFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQ3RELElBQUksRUFBQyxnQkFBZ0IsYUFBaEIsZ0JBQWdCLHVCQUFoQixnQkFBZ0IsQ0FBRSxJQUFJLENBQUEsRUFBRTtZQUMzQixNQUFNLElBQUksaUJBQUksQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsQ0FBQztTQUNyRDtRQUNELElBQUksRUFBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsRUFBRSxDQUFBLEVBQUU7WUFDaEIsTUFBTSxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDbkQ7UUFFRCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFELE1BQU0sV0FBVyxHQUFXLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqRSxNQUFNLGlCQUFpQixHQUFXLDZCQUFvQixFQUFFLENBQUM7UUFDekQsTUFBTSxhQUFhLEdBQUcsTUFBTSwrQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM1RCxNQUFNLGlCQUFpQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUVyRSxJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDdkIsTUFBTSxRQUFRLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSwyQkFBa0IsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sUUFBUSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRSxXQUFXLEVBQUUsY0FBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDL0YsTUFBTSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztTQUMzRTthQUFNLElBQUksTUFBTSxLQUFLLFFBQVEsRUFBRTtZQUM5QixNQUFNLFFBQVEsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLDJCQUFrQixDQUFDLENBQUM7WUFDL0QsTUFBTSxRQUFRLENBQUMsV0FBVyxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRSxjQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUMvRixNQUFNLFNBQVMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNsRjtJQUNILENBQUM7Q0FBQTtBQUVELFNBQXNCLGNBQWMsQ0FBQyxPQUFnQyxFQUFFLFNBQWlCOztRQUN0RixNQUFNLEtBQUssR0FBZSxZQUFZLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzNELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPO1NBQ1I7UUFFRCxPQUFPLG1CQUFtQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQUE7QUFQRCx3Q0FPQztBQUVELFNBQXNCLGtCQUFrQixDQUFDLE9BQWdDLEVBQUUsU0FBaUI7O1FBQzFGLE1BQU0sS0FBSyxHQUFlLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0QsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU87U0FDUjtRQUVELE9BQU8sbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FBQTtBQVBELGdEQU9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgZ2V0TG9hZE9yZGVyRmlsZVBhdGgsXHJcbiAgICAgICAgIE1FUkdFX0lOVl9NQU5JRkVTVCwgU0NSSVBUX01FUkdFUl9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IGdldE1lcmdlZE1vZE5hbWUgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XHJcblxyXG50eXBlIE9wVHlwZSA9ICdpbXBvcnQnIHwgJ2V4cG9ydCc7XHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG4gIHNjcmlwdE1lcmdlclRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbDtcclxuICBnYW1lUGF0aDogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBzb3J0SW5jID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gbGhzLmxlbmd0aCAtIHJocy5sZW5ndGg7XHJcbmNvbnN0IHNvcnREZWMgPSAobGhzOiBzdHJpbmcsIHJoczogc3RyaW5nKSA9PiByaHMubGVuZ3RoIC0gbGhzLmxlbmd0aDtcclxuXHJcbmZ1bmN0aW9uIGdlbkJhc2VQcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkOiBzdHJpbmcpOiBJQmFzZVByb3BzIHtcclxuICBpZiAoIXByb2ZpbGVJZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2NhbE1lcmdlZFNjcmlwdHM6IGJvb2xlYW4gPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBwcm9maWxlSWQsICdmZWF0dXJlcycsICdsb2NhbF9tZXJnZXMnXSwgZmFsc2UpO1xyXG4gIGlmICghbG9jYWxNZXJnZWRTY3JpcHRzKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZGlzY292ZXJ5Py50b29scz8uW1NDUklQVF9NRVJHRVJfSURdO1xyXG4gIGlmICghc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgLy8gUmVnYXJkbGVzcyBvZiB0aGUgdXNlcidzIHByb2ZpbGUgc2V0dGluZ3MgLSB0aGVyZSdzIG5vIHBvaW50IGluIGJhY2tpbmcgdXBcclxuICAgIC8vICB0aGUgbWVyZ2VzIGlmIHdlIGRvbid0IGtub3cgd2hlcmUgdGhlIHNjcmlwdCBtZXJnZXIgaXMhXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgc3RhdGUsIHByb2ZpbGUsIHNjcmlwdE1lcmdlclRvb2wsIGdhbWVQYXRoOiBkaXNjb3ZlcnkucGF0aCB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRGaWxlRW50cmllcyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGxldCBmaWxlczogc3RyaW5nW10gPSBbXTtcclxuICByZXR1cm4gdHVyYm93YWxrKGZpbGVQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgIGNvbnN0IHZhbGlkRW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGVudHJ5ID0+IGVudHJ5LmZpbGVQYXRoKTtcclxuICAgIGZpbGVzID0gZmlsZXMuY29uY2F0KHZhbGlkRW50cmllcyk7XHJcbiAgfSwgeyByZWN1cnNlOiB0cnVlIH0pXHJcbiAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZmlsZXMpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbW92ZUZpbGUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGZyb20sIGZpbGVOYW1lKTtcclxuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHRvLCBmaWxlTmFtZSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGNvcHlGaWxlKHNyYywgZGVzdCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gKGVyci5jb2RlICE9PSAnRU5PRU5UJylcclxuICAgICAgPyBQcm9taXNlLnJlamVjdChlcnIpXHJcbiAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZW1vdmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcclxuICBpZiAocGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gJycpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNvcHlGaWxlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcclxuICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XHJcbiAgYXdhaXQgcmVtb3ZlRmlsZShkZXN0KTtcclxuICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbW92ZUZpbGVzKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcsIGNsZWFuVXA6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkZXN0RmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoZGVzdCk7XHJcbiAgICBkZXN0RmlsZXMuc29ydChzb3J0RGVjKTtcclxuICAgIGZvciAoY29uc3QgZGVzdEZpbGUgb2YgZGVzdEZpbGVzKSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3RGaWxlKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgZGVzdGluYXRpb24gZm9sZGVyIC0gd2UgY2FuJ3RcclxuICAgIC8vICBjb250aW51ZS5cclxuICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZChlcnIubWVzc2FnZSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb3BpZWQ6IHN0cmluZ1tdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNyY0ZpbGVzOiBzdHJpbmdbXSA9IGF3YWl0IGdldEZpbGVFbnRyaWVzKHNyYyk7XHJcbiAgICBzcmNGaWxlcy5zb3J0KHNvcnRJbmMpO1xyXG4gICAgZm9yIChjb25zdCBzcmNGaWxlIG9mIHNyY0ZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKHNyYywgc3JjRmlsZSk7XHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oZGVzdCwgcmVsUGF0aCk7XHJcbiAgICAgIGF3YWl0IGNvcHlGaWxlKHNyY0ZpbGUsIHRhcmdldFBhdGgpO1xyXG4gICAgICBjb3BpZWQucHVzaCh0YXJnZXRQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2xlYW5VcCkge1xyXG4gICAgICAvLyBXZSBtYW5hZ2VkIHRvIGNvcHkgYWxsIHRoZSBmaWxlcywgY2xlYW4gdXAgdGhlIHNvdXJjZVxyXG4gICAgICBzcmNGaWxlcy5zb3J0KHNvcnREZWMpO1xyXG4gICAgICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcclxuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhzcmNGaWxlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKCEhZXJyLnBhdGggJiYgIWVyci5wYXRoLmluY2x1ZGVzKGRlc3QpKSB7XHJcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgc291cmNlXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSBmYWlsZWQgdG8gY29weSAtIGNsZWFuIHVwLlxyXG4gICAgY29waWVkLnNvcnQoc29ydERlYyk7XHJcbiAgICBmb3IgKGNvbnN0IGxpbmsgb2YgY29waWVkKSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxpbmspO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wczogSUJhc2VQcm9wcywgb3BUeXBlOiBPcFR5cGUpIHtcclxuICBjb25zdCB7IHNjcmlwdE1lcmdlclRvb2wsIHByb2ZpbGUsIGdhbWVQYXRoIH0gPSBwcm9wcztcclxuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIHRocm93IG5ldyB1dGlsLk5vdEZvdW5kKCdTY3JpcHQgbWVyZ2luZyB0b29sIHBhdGgnKTtcclxuICB9XHJcbiAgaWYgKCFwcm9maWxlPy5pZCkge1xyXG4gICAgdGhyb3cgbmV3IHV0aWwuQXJndW1lbnRJbnZhbGlkKCdpbnZhbGlkIHByb2ZpbGUnKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1lcmdlclRvb2xEaXIgPSBwYXRoLmRpcm5hbWUoc2NyaXB0TWVyZ2VyVG9vbC5wYXRoKTtcclxuICBjb25zdCBwcm9maWxlUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKG1lcmdlclRvb2xEaXIsIHByb2ZpbGUuaWQpO1xyXG4gIGNvbnN0IGxvYXJPcmRlckZpbGVwYXRoOiBzdHJpbmcgPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gIGNvbnN0IG1lcmdlZE1vZE5hbWUgPSBhd2FpdCBnZXRNZXJnZWRNb2ROYW1lKG1lcmdlclRvb2xEaXIpO1xyXG4gIGNvbnN0IG1lcmdlZFNjcmlwdHNQYXRoID0gcGF0aC5qb2luKGdhbWVQYXRoLCAnTW9kcycsIG1lcmdlZE1vZE5hbWUpO1xyXG5cclxuICBpZiAob3BUeXBlID09PSAnZXhwb3J0Jykge1xyXG4gICAgYXdhaXQgbW92ZUZpbGUobWVyZ2VyVG9vbERpciwgcHJvZmlsZVBhdGgsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XHJcbiAgICBhd2FpdCBtb3ZlRmlsZShwYXRoLmRpcm5hbWUobG9hck9yZGVyRmlsZXBhdGgpLCBwcm9maWxlUGF0aCwgcGF0aC5iYXNlbmFtZShsb2FyT3JkZXJGaWxlcGF0aCkpO1xyXG4gICAgYXdhaXQgbW92ZUZpbGVzKG1lcmdlZFNjcmlwdHNQYXRoLCBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsIG1lcmdlZE1vZE5hbWUpKTtcclxuICB9IGVsc2UgaWYgKG9wVHlwZSA9PT0gJ2ltcG9ydCcpIHtcclxuICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBtZXJnZXJUb29sRGlyLCBNRVJHRV9JTlZfTUFOSUZFU1QpO1xyXG4gICAgYXdhaXQgbW92ZUZpbGUocHJvZmlsZVBhdGgsIHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHBhdGguYmFzZW5hbWUobG9hck9yZGVyRmlsZXBhdGgpKTtcclxuICAgIGF3YWl0IG1vdmVGaWxlcyhwYXRoLmpvaW4ocHJvZmlsZVBhdGgsIG1lcmdlZE1vZE5hbWUpLCBtZXJnZWRTY3JpcHRzUGF0aCwgZmFsc2UpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlVG9Qcm9maWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHJldHVybiBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnZXhwb3J0Jyk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXN0b3JlRnJvbVByb2ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdpbXBvcnQnKTtcclxufVxyXG4iXX0=