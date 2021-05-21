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
exports.importScriptMerges = exports.exportScriptMerges = exports.restoreFromProfile = exports.storeToProfile = void 0;
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const shortid_1 = require("shortid");
const util_1 = require("./collections/util");
const scriptmerger_1 = require("./scriptmerger");
const sortInc = (lhs, rhs) => lhs.length - rhs.length;
const sortDec = (lhs, rhs) => rhs.length - lhs.length;
function genBaseProps(context, profileId, force) {
    var _a;
    if (!profileId) {
        return undefined;
    }
    const state = context.api.getState();
    const profile = vortex_api_1.selectors.profileById(state, profileId);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    const localMergedScripts = (force) ? true : vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profileId, 'features', 'local_merges'], false);
    if (!localMergedScripts) {
        return undefined;
    }
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    const scriptMergerTool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a[common_1.SCRIPT_MERGER_ID];
    if (!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
        return undefined;
    }
    return { api: context.api, state, profile, scriptMergerTool, gamePath: discovery.path };
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
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest));
            yield removeFile(dest);
            yield vortex_api_1.fs.copyAsync(src, dest);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function moveFiles(src, dest, props) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = props.api.translate;
        const removeDestFiles = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const destFiles = yield getFileEntries(dest);
                destFiles.sort(sortDec);
                for (const destFile of destFiles) {
                    yield vortex_api_1.fs.removeAsync(destFile);
                }
            }
            catch (err) {
                if (['EPERM'].includes(err.code)) {
                    return props.api.showDialog('error', 'Failed to restore merged files', {
                        bbcode: t('Vortex encountered a permissions related error while attempting '
                            + 'to replace:{{bl}}"{{filePath}}"{{bl}}'
                            + 'Please try to resolve any permissions related issues and return to this '
                            + 'dialog when you think you managed to fix it. There are a couple of things '
                            + 'you can try to fix this:[br][/br][list][*] Close/Disable any applications that may '
                            + 'interfere with Vortex\'s operations such as the game itself, the witcher script merger, '
                            + 'any external modding tools, any anti-virus software. '
                            + '[*] Ensure that your Windows user account has full read/write permissions to the file specified '
                            + '[/list]', { replace: { filePath: err.path, bl: '[br][/br][br][/br]' } }),
                    }, [
                        { label: 'Cancel', action: () => Promise.reject(new vortex_api_1.util.UserCanceled()) },
                        { label: 'Try Again', action: () => removeDestFiles() }
                    ]);
                }
                else {
                    return Promise.reject(new vortex_api_1.util.ProcessCanceled(err.message));
                }
            }
        });
        yield removeDestFiles();
        const copied = [];
        try {
            const srcFiles = yield getFileEntries(src);
            srcFiles.sort(sortInc);
            for (const srcFile of srcFiles) {
                const relPath = path_1.default.relative(src, srcFile);
                const targetPath = path_1.default.join(dest, relPath);
                try {
                    yield copyFile(srcFile, targetPath);
                    copied.push(targetPath);
                }
                catch (err) {
                    vortex_api_1.log('error', 'failed to move file', err);
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
function handleMergedScripts(props, opType, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        const { scriptMergerTool, profile, gamePath } = props;
        if (!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
            return Promise.reject(new vortex_api_1.util.NotFound('Script merging tool path'));
        }
        if (!(profile === null || profile === void 0 ? void 0 : profile.id)) {
            return Promise.reject(new vortex_api_1.util.ArgumentInvalid('invalid profile'));
        }
        try {
            const mergerToolDir = path_1.default.dirname(scriptMergerTool.path);
            const profilePath = (dest === undefined)
                ? path_1.default.join(mergerToolDir, profile.id)
                : dest;
            const loarOrderFilepath = common_1.getLoadOrderFilePath();
            const mergedModName = yield scriptmerger_1.getMergedModName(mergerToolDir);
            const mergedScriptsPath = path_1.default.join(gamePath, 'Mods', mergedModName);
            yield vortex_api_1.fs.ensureDirWritableAsync(mergedScriptsPath);
            if (opType === 'export') {
                yield moveFile(mergerToolDir, profilePath, common_1.MERGE_INV_MANIFEST);
                yield moveFile(path_1.default.dirname(loarOrderFilepath), profilePath, path_1.default.basename(loarOrderFilepath));
                yield moveFiles(mergedScriptsPath, path_1.default.join(profilePath, mergedModName), props);
            }
            else if (opType === 'import') {
                yield moveFile(profilePath, mergerToolDir, common_1.MERGE_INV_MANIFEST);
                yield moveFile(profilePath, path_1.default.dirname(loarOrderFilepath), path_1.default.basename(loarOrderFilepath));
                yield moveFiles(path_1.default.join(profilePath, mergedModName), mergedScriptsPath, props);
            }
        }
        catch (err) {
            vortex_api_1.log('error', 'failed to store/restore merged scripts', err);
            return Promise.reject(err);
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
function exportScriptMerges(context, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId, true);
        if (props === undefined) {
            return;
        }
        try {
            const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, shortid_1.generate());
            yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
            yield handleMergedScripts(props, 'export', tempPath);
            const data = yield util_1.prepareFileData(tempPath);
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.exportScriptMerges = exportScriptMerges;
function importScriptMerges(context, profileId, fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId, true);
        if (props === undefined) {
            return;
        }
        try {
            const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, shortid_1.generate());
            yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
            const data = yield util_1.restoreFileData(fileData, tempPath);
            yield handleMergedScripts(props, 'import', tempPath);
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.importScriptMerges = importScriptMerges;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUV0RSxxQ0FDdUQ7QUFFdkQscUNBQW1DO0FBRW5DLDZDQUFzRTtBQUV0RSxpREFBa0Q7QUFXbEQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFFdEUsU0FBUyxZQUFZLENBQUMsT0FBZ0MsRUFDaEMsU0FBaUIsRUFBRSxLQUFlOztJQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFtQixzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEUsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRTtRQUMvQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sa0JBQWtCLEdBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3JFLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVFLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sU0FBUyxHQUEyQixpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzFELENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlELE1BQU0sZ0JBQWdCLFNBQTBCLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxLQUFLLDBDQUFHLHlCQUFnQixDQUFDLENBQUM7SUFDckYsSUFBSSxFQUFDLGdCQUFnQixhQUFoQixnQkFBZ0IsdUJBQWhCLGdCQUFnQixDQUFFLElBQUksQ0FBQSxFQUFFO1FBRzNCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUMxRixDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsUUFBZ0I7SUFDdEMsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQ3pCLE9BQU8sbUJBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDbkMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQzthQUNuQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUQsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1NBQ3BCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ3RELENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ25CLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUVELFNBQWUsUUFBUSxDQUFDLElBQVksRUFBRSxFQUFVLEVBQUUsUUFBZ0I7O1FBQ2hFLE1BQU0sR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLElBQUk7WUFDRixNQUFNLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDM0I7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUVaLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO2dCQUNyQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBZSxVQUFVLENBQUMsUUFBZ0I7O1FBQ3hDLElBQUksY0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDakMsT0FBTztTQUNSO1FBQ0QsSUFBSTtZQUNGLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO2dCQUM1QixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtnQkFDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekI7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFlLFFBQVEsQ0FBQyxHQUFXLEVBQUUsSUFBWTs7UUFDL0MsSUFBSTtZQUNGLE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQy9CO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFlLFNBQVMsQ0FBQyxHQUFXLEVBQUUsSUFBWSxFQUFFLEtBQWlCOztRQUNuRSxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUM5QixNQUFNLGVBQWUsR0FBRyxHQUFTLEVBQUU7WUFDakMsSUFBSTtnQkFDRixNQUFNLFNBQVMsR0FBYSxNQUFNLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkQsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEIsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7b0JBQ2hDLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDaEM7YUFDRjtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNoQyxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRTt3QkFDckUsTUFBTSxFQUFFLENBQUMsQ0FBQyxrRUFBa0U7OEJBQ3hFLHVDQUF1Qzs4QkFDdkMsMEVBQTBFOzhCQUMxRSw0RUFBNEU7OEJBQzVFLHFGQUFxRjs4QkFDckYsMEZBQTBGOzhCQUMxRix1REFBdUQ7OEJBQ3ZELGtHQUFrRzs4QkFDbEcsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLEVBQUUsQ0FBQztxQkFDOUUsRUFDRDt3QkFDRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUU7d0JBQzFFLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFFLEVBQUU7cUJBQ3hELENBQUMsQ0FBQTtpQkFDSDtxQkFBTTtvQkFHTCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDOUQ7YUFDRjtRQUNILENBQUMsQ0FBQSxDQUFDO1FBRUYsTUFBTSxlQUFlLEVBQUUsQ0FBQztRQUN4QixNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDNUIsSUFBSTtZQUNGLE1BQU0sUUFBUSxHQUFhLE1BQU0sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JELFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7Z0JBQzlCLE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLFVBQVUsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDNUMsSUFBSTtvQkFDRixNQUFNLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3pCO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNaLGdCQUFHLENBQUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUMxQzthQUNGO1NBU0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFFMUMsT0FBTzthQUNSO1lBR0QsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRTtnQkFDekIsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzVCO1NBQ0Y7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFlLG1CQUFtQixDQUFDLEtBQWlCLEVBQUUsTUFBYyxFQUFFLElBQWE7O1FBQ2pGLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQ3RELElBQUksRUFBQyxnQkFBZ0IsYUFBaEIsZ0JBQWdCLHVCQUFoQixnQkFBZ0IsQ0FBRSxJQUFJLENBQUEsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7U0FDdEU7UUFDRCxJQUFJLEVBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLEVBQUUsQ0FBQSxFQUFFO1lBQ2hCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztTQUNwRTtRQUVELElBQUk7WUFDRixNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFELE1BQU0sV0FBVyxHQUFXLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQztnQkFDOUMsQ0FBQyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDVCxNQUFNLGlCQUFpQixHQUFXLDZCQUFvQixFQUFFLENBQUM7WUFDekQsTUFBTSxhQUFhLEdBQUcsTUFBTSwrQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1RCxNQUFNLGlCQUFpQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUdyRSxNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRW5ELElBQUksTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDdkIsTUFBTSxRQUFRLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSwyQkFBa0IsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLFFBQVEsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsV0FBVyxFQUFFLGNBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUMvRixNQUFNLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNsRjtpQkFBTSxJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUU7Z0JBQzlCLE1BQU0sUUFBUSxDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUsMkJBQWtCLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxRQUFRLENBQUMsV0FBVyxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRSxjQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDL0YsTUFBTSxTQUFTLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDbEY7U0FDRjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osZ0JBQUcsQ0FBQyxPQUFPLEVBQUUsd0NBQXdDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBc0IsY0FBYyxDQUFDLE9BQWdDLEVBQUUsU0FBaUI7O1FBQ3RGLE1BQU0sS0FBSyxHQUFlLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0QsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU87U0FDUjtRQUVELE9BQU8sbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FBQTtBQVBELHdDQU9DO0FBRUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFBRSxTQUFpQjs7UUFDMUYsTUFBTSxLQUFLLEdBQWUsWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMzRCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsT0FBTztTQUNSO1FBRUQsT0FBTyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUMsQ0FBQztDQUFBO0FBUEQsZ0RBT0M7QUFFRCxTQUFzQixrQkFBa0IsQ0FBQyxPQUFnQyxFQUNoQyxTQUFpQjs7UUFDeEQsTUFBTSxLQUFLLEdBQWUsWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakUsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU87U0FDUjtRQUNELElBQUk7WUFDRixNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLHlCQUFnQixFQUFFLGtCQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyRCxNQUFNLElBQUksR0FBRyxNQUFNLHNCQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0MsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBZkQsZ0RBZUM7QUFFRCxTQUFzQixrQkFBa0IsQ0FBQyxPQUFnQyxFQUNoQyxTQUFpQixFQUNqQixRQUFnQjs7UUFDdkQsTUFBTSxLQUFLLEdBQWUsWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakUsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU87U0FDUjtRQUNELElBQUk7WUFDRixNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLHlCQUFnQixFQUFFLGtCQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sSUFBSSxHQUFHLE1BQU0sc0JBQWUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkQsTUFBTSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQWhCRCxnREFnQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNULFxyXG4gIFNDUklQVF9NRVJHRVJfSUQsIFczX1RFTVBfREFUQV9ESVIgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xyXG5cclxuaW1wb3J0IHsgcHJlcGFyZUZpbGVEYXRhLCByZXN0b3JlRmlsZURhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZSB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbnR5cGUgT3BUeXBlID0gJ2ltcG9ydCcgfCAnZXhwb3J0JztcclxuaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG4gIHNjcmlwdE1lcmdlclRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbDtcclxuICBnYW1lUGF0aDogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBzb3J0SW5jID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gbGhzLmxlbmd0aCAtIHJocy5sZW5ndGg7XHJcbmNvbnN0IHNvcnREZWMgPSAobGhzOiBzdHJpbmcsIHJoczogc3RyaW5nKSA9PiByaHMubGVuZ3RoIC0gbGhzLmxlbmd0aDtcclxuXHJcbmZ1bmN0aW9uIGdlbkJhc2VQcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLCBmb3JjZT86IGJvb2xlYW4pOiBJQmFzZVByb3BzIHtcclxuICBpZiAoIXByb2ZpbGVJZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2NhbE1lcmdlZFNjcmlwdHM6IGJvb2xlYW4gPSAoZm9yY2UpID8gdHJ1ZSA6IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZCwgJ2ZlYXR1cmVzJywgJ2xvY2FsX21lcmdlcyddLCBmYWxzZSk7XHJcbiAgaWYgKCFsb2NhbE1lcmdlZFNjcmlwdHMpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bU0NSSVBUX01FUkdFUl9JRF07XHJcbiAgaWYgKCFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICAvLyBSZWdhcmRsZXNzIG9mIHRoZSB1c2VyJ3MgcHJvZmlsZSBzZXR0aW5ncyAtIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gYmFja2luZyB1cFxyXG4gICAgLy8gIHRoZSBtZXJnZXMgaWYgd2UgZG9uJ3Qga25vdyB3aGVyZSB0aGUgc2NyaXB0IG1lcmdlciBpcyFcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBhcGk6IGNvbnRleHQuYXBpLCBzdGF0ZSwgcHJvZmlsZSwgc2NyaXB0TWVyZ2VyVG9vbCwgZ2FtZVBhdGg6IGRpc2NvdmVyeS5wYXRoIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEZpbGVFbnRyaWVzKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgbGV0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gIHJldHVybiB0dXJib3dhbGsoZmlsZVBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgY29uc3QgdmFsaWRFbnRyaWVzID0gZW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgZmlsZXMgPSBmaWxlcy5jb25jYXQodmFsaWRFbnRyaWVzKTtcclxuICB9LCB7IHJlY3Vyc2U6IHRydWUgfSlcclxuICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlcykpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBtb3ZlRmlsZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGZpbGVOYW1lOiBzdHJpbmcpIHtcclxuICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oZnJvbSwgZmlsZU5hbWUpO1xyXG4gIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4odG8sIGZpbGVOYW1lKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgY29weUZpbGUoc3JjLCBkZXN0KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIEl0J3MgcGVyZmVjdGx5IHBvc3NpYmxlIGZvciB0aGUgdXNlciBub3QgdG8gaGF2ZSBhbnkgbWVyZ2VzIHlldC5cclxuICAgIHJldHVybiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKVxyXG4gICAgICA/IFByb21pc2UucmVqZWN0KGVycilcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChwYXRoLmV4dG5hbWUoZmlsZVBhdGgpID09PSAnJykge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY29weUZpbGUoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XHJcbiAgICBhd2FpdCByZW1vdmVGaWxlKGRlc3QpO1xyXG4gICAgYXdhaXQgZnMuY29weUFzeW5jKHNyYywgZGVzdCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG1vdmVGaWxlcyhzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nLCBwcm9wczogSUJhc2VQcm9wcykge1xyXG4gIGNvbnN0IHQgPSBwcm9wcy5hcGkudHJhbnNsYXRlO1xyXG4gIGNvbnN0IHJlbW92ZURlc3RGaWxlcyA9IGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGRlc3RGaWxlczogc3RyaW5nW10gPSBhd2FpdCBnZXRGaWxlRW50cmllcyhkZXN0KTtcclxuICAgICAgZGVzdEZpbGVzLnNvcnQoc29ydERlYyk7XHJcbiAgICAgIGZvciAoY29uc3QgZGVzdEZpbGUgb2YgZGVzdEZpbGVzKSB7XHJcbiAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdEZpbGUpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKFsnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcclxuICAgICAgICByZXR1cm4gcHJvcHMuYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byByZXN0b3JlIG1lcmdlZCBmaWxlcycsIHtcclxuICAgICAgICAgIGJiY29kZTogdCgnVm9ydGV4IGVuY291bnRlcmVkIGEgcGVybWlzc2lvbnMgcmVsYXRlZCBlcnJvciB3aGlsZSBhdHRlbXB0aW5nICdcclxuICAgICAgICAgICAgKyAndG8gcmVwbGFjZTp7e2JsfX1cInt7ZmlsZVBhdGh9fVwie3tibH19J1xyXG4gICAgICAgICAgICArICdQbGVhc2UgdHJ5IHRvIHJlc29sdmUgYW55IHBlcm1pc3Npb25zIHJlbGF0ZWQgaXNzdWVzIGFuZCByZXR1cm4gdG8gdGhpcyAnXHJcbiAgICAgICAgICAgICsgJ2RpYWxvZyB3aGVuIHlvdSB0aGluayB5b3UgbWFuYWdlZCB0byBmaXggaXQuIFRoZXJlIGFyZSBhIGNvdXBsZSBvZiB0aGluZ3MgJ1xyXG4gICAgICAgICAgICArICd5b3UgY2FuIHRyeSB0byBmaXggdGhpczpbYnJdWy9icl1bbGlzdF1bKl0gQ2xvc2UvRGlzYWJsZSBhbnkgYXBwbGljYXRpb25zIHRoYXQgbWF5ICdcclxuICAgICAgICAgICAgKyAnaW50ZXJmZXJlIHdpdGggVm9ydGV4XFwncyBvcGVyYXRpb25zIHN1Y2ggYXMgdGhlIGdhbWUgaXRzZWxmLCB0aGUgd2l0Y2hlciBzY3JpcHQgbWVyZ2VyLCAnXHJcbiAgICAgICAgICAgICsgJ2FueSBleHRlcm5hbCBtb2RkaW5nIHRvb2xzLCBhbnkgYW50aS12aXJ1cyBzb2Z0d2FyZS4gJ1xyXG4gICAgICAgICAgICArICdbKl0gRW5zdXJlIHRoYXQgeW91ciBXaW5kb3dzIHVzZXIgYWNjb3VudCBoYXMgZnVsbCByZWFkL3dyaXRlIHBlcm1pc3Npb25zIHRvIHRoZSBmaWxlIHNwZWNpZmllZCAnXHJcbiAgICAgICAgICAgICsgJ1svbGlzdF0nLCB7IHJlcGxhY2U6IHsgZmlsZVBhdGg6IGVyci5wYXRoLCBibDogJ1ticl1bL2JyXVticl1bL2JyXScgfSB9KSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKSB9LFxyXG4gICAgICAgICAgeyBsYWJlbDogJ1RyeSBBZ2FpbicsIGFjdGlvbjogKCkgPT4gcmVtb3ZlRGVzdEZpbGVzKCkgfVxyXG4gICAgICAgIF0pXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGNsZWFuIHVwIHRoZSBkZXN0aW5hdGlvbiBmb2xkZXIgLSB3ZSBjYW4ndFxyXG4gICAgICAgIC8vICBjb250aW51ZS5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKGVyci5tZXNzYWdlKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBhd2FpdCByZW1vdmVEZXN0RmlsZXMoKTtcclxuICBjb25zdCBjb3BpZWQ6IHN0cmluZ1tdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNyY0ZpbGVzOiBzdHJpbmdbXSA9IGF3YWl0IGdldEZpbGVFbnRyaWVzKHNyYyk7XHJcbiAgICBzcmNGaWxlcy5zb3J0KHNvcnRJbmMpO1xyXG4gICAgZm9yIChjb25zdCBzcmNGaWxlIG9mIHNyY0ZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKHNyYywgc3JjRmlsZSk7XHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oZGVzdCwgcmVsUGF0aCk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgY29weUZpbGUoc3JjRmlsZSwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgICAgY29waWVkLnB1c2godGFyZ2V0UGF0aCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIG1vdmUgZmlsZScsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiAoY2xlYW5VcCkge1xyXG4gICAgLy8gICAvLyBXZSBtYW5hZ2VkIHRvIGNvcHkgYWxsIHRoZSBmaWxlcywgY2xlYW4gdXAgdGhlIHNvdXJjZVxyXG4gICAgLy8gICBzcmNGaWxlcy5zb3J0KHNvcnREZWMpO1xyXG4gICAgLy8gICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcclxuICAgIC8vICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhzcmNGaWxlKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKCEhZXJyLnBhdGggJiYgIWVyci5wYXRoLmluY2x1ZGVzKGRlc3QpKSB7XHJcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgc291cmNlXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSBmYWlsZWQgdG8gY29weSAtIGNsZWFuIHVwLlxyXG4gICAgY29waWVkLnNvcnQoc29ydERlYyk7XHJcbiAgICBmb3IgKGNvbnN0IGxpbmsgb2YgY29waWVkKSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxpbmspO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wczogSUJhc2VQcm9wcywgb3BUeXBlOiBPcFR5cGUsIGRlc3Q/OiBzdHJpbmcpIHtcclxuICBjb25zdCB7IHNjcmlwdE1lcmdlclRvb2wsIHByb2ZpbGUsIGdhbWVQYXRoIH0gPSBwcm9wcztcclxuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Ob3RGb3VuZCgnU2NyaXB0IG1lcmdpbmcgdG9vbCBwYXRoJykpO1xyXG4gIH1cclxuICBpZiAoIXByb2ZpbGU/LmlkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuQXJndW1lbnRJbnZhbGlkKCdpbnZhbGlkIHByb2ZpbGUnKSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbWVyZ2VyVG9vbERpciA9IHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXJUb29sLnBhdGgpO1xyXG4gICAgY29uc3QgcHJvZmlsZVBhdGg6IHN0cmluZyA9IChkZXN0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgID8gcGF0aC5qb2luKG1lcmdlclRvb2xEaXIsIHByb2ZpbGUuaWQpXHJcbiAgICAgIDogZGVzdDtcclxuICAgIGNvbnN0IGxvYXJPcmRlckZpbGVwYXRoOiBzdHJpbmcgPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgY29uc3QgbWVyZ2VkTW9kTmFtZSA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWUobWVyZ2VyVG9vbERpcik7XHJcbiAgICBjb25zdCBtZXJnZWRTY3JpcHRzUGF0aCA9IHBhdGguam9pbihnYW1lUGF0aCwgJ01vZHMnLCBtZXJnZWRNb2ROYW1lKTtcclxuXHJcbiAgICAvLyBKdXN0IGluIGNhc2UgaXQncyBtaXNzaW5nLlxyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtZXJnZWRTY3JpcHRzUGF0aCk7XHJcblxyXG4gICAgaWYgKG9wVHlwZSA9PT0gJ2V4cG9ydCcpIHtcclxuICAgICAgYXdhaXQgbW92ZUZpbGUobWVyZ2VyVG9vbERpciwgcHJvZmlsZVBhdGgsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHByb2ZpbGVQYXRoLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlcyhtZXJnZWRTY3JpcHRzUGF0aCwgcGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgcHJvcHMpO1xyXG4gICAgfSBlbHNlIGlmIChvcFR5cGUgPT09ICdpbXBvcnQnKSB7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBtZXJnZXJUb29sRGlyLCBNRVJHRV9JTlZfTUFOSUZFU1QpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZShwcm9maWxlUGF0aCwgcGF0aC5kaXJuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSwgcGF0aC5iYXNlbmFtZShsb2FyT3JkZXJGaWxlcGF0aCkpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZXMocGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgbWVyZ2VkU2NyaXB0c1BhdGgsIHByb3BzKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHN0b3JlL3Jlc3RvcmUgbWVyZ2VkIHNjcmlwdHMnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVUb1Byb2ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkLCB0cnVlKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgdGVtcFBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSk7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRlbXBQYXRoKTtcclxuICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnLCB0ZW1wUGF0aCk7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcHJlcGFyZUZpbGVEYXRhKHRlbXBQYXRoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVEYXRhOiBCdWZmZXIpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQsIHRydWUpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpKTtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGVtcFBhdGgpO1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YSwgdGVtcFBhdGgpO1xyXG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcsIHRlbXBQYXRoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcbiJdfQ==