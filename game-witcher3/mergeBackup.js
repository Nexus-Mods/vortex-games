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
exports.makeOnContextImport = exports.importScriptMerges = exports.exportScriptMerges = exports.restoreFromProfile = exports.storeToProfile = void 0;
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const scriptmerger_1 = require("./scriptmerger");
const util_1 = require("./collections/util");
const shortid_1 = require("shortid");
const util_2 = require("./collections/util");
const scriptmerger_2 = require("./scriptmerger");
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
                        { label: 'Try Again', action: () => removeDestFiles() },
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
            const mergedModName = yield scriptmerger_2.getMergedModName(mergerToolDir);
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
            const data = yield util_2.prepareFileData(tempPath);
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
        const res = yield context.api.showDialog('question', 'Script Merges Import', {
            text: 'The collection you are importing contains script merges which the creator of '
                + 'the collection deemed necessary for the mods to function correctly. Please note that '
                + 'importing these will overwrite any existing script merges you may have effectuated. '
                + 'Please ensure to back up any existing merges (if applicable/required) before '
                + 'proceeding.',
        }, [
            { label: 'Cancel' },
            { label: 'Import Merges' },
        ], 'import-w3-script-merges-warning');
        if (res.action === 'Cancel') {
            return Promise.reject(new vortex_api_1.util.UserCanceled());
        }
        try {
            const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, shortid_1.generate());
            yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
            const data = yield util_2.restoreFileData(fileData, tempPath);
            yield handleMergedScripts(props, 'import', tempPath);
            context.api.sendNotification({
                message: 'Script merges imported successfully',
                id: 'witcher3-script-merges-status',
                type: 'success',
            });
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.importScriptMerges = importScriptMerges;
function makeOnContextImport(context, collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const collectionMod = mods[collectionId];
        if ((collectionMod === null || collectionMod === void 0 ? void 0 : collectionMod.installationPath) === undefined) {
            vortex_api_1.log('error', 'collection mod is missing', collectionId);
            return;
        }
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        try {
            const fileData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(stagingFolder, collectionMod.installationPath, 'collection.json'), { encoding: 'utf8' });
            const collection = JSON.parse(fileData);
            const { scriptMergedData } = collection.mergedData;
            if (scriptMergedData !== undefined) {
                const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
                if (scriptMergerTool === undefined) {
                    yield scriptmerger_1.downloadScriptMerger(context);
                }
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
                yield importScriptMerges(context, profileId, util_1.hex2Buffer(scriptMergedData));
            }
        }
        catch (err) {
            context.api.showErrorNotification('Failed to import script merges', err);
        }
    });
}
exports.makeOnContextImport = makeOnContextImport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUV0RSxxQ0FDdUQ7QUFFdkQsaURBQXNEO0FBRXRELDZDQUFnRDtBQUVoRCxxQ0FBbUM7QUFFbkMsNkNBQXNFO0FBRXRFLGlEQUFrRDtBQVdsRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN0RSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUV0RSxTQUFTLFlBQVksQ0FBQyxPQUFnQyxFQUNoQyxTQUFpQixFQUFFLEtBQWU7O0lBQ3RELElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDckMsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RSxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxrQkFBa0IsR0FBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDckUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsY0FB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QUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDM0ksTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO1lBQ25ELElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO2dCQUVsQyxNQUFNLGdCQUFnQixHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDekMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN6RixJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRTtvQkFDbEMsTUFBTSxtQ0FBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDckM7Z0JBQ0QsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsaUJBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7YUFDNUU7U0FDRjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUMxRTtJQUNILENBQUM7Q0FBQTtBQTNCRCxrREEyQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNULFxyXG4gIFNDUklQVF9NRVJHRVJfSUQsIFczX1RFTVBfREFUQV9ESVIgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBkb3dubG9hZFNjcmlwdE1lcmdlciB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IGhleDJCdWZmZXIgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgZ2VuZXJhdGUgfSBmcm9tICdzaG9ydGlkJztcclxuXHJcbmltcG9ydCB7IHByZXBhcmVGaWxlRGF0YSwgcmVzdG9yZUZpbGVEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy91dGlsJztcclxuXHJcbmltcG9ydCB7IGdldE1lcmdlZE1vZE5hbWUgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XHJcblxyXG50eXBlIE9wVHlwZSA9ICdpbXBvcnQnIHwgJ2V4cG9ydCc7XHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxuICBzY3JpcHRNZXJnZXJUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2w7XHJcbiAgZ2FtZVBhdGg6IHN0cmluZztcclxufVxyXG5cclxuY29uc3Qgc29ydEluYyA9IChsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpID0+IGxocy5sZW5ndGggLSByaHMubGVuZ3RoO1xyXG5jb25zdCBzb3J0RGVjID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gcmhzLmxlbmd0aCAtIGxocy5sZW5ndGg7XHJcblxyXG5mdW5jdGlvbiBnZW5CYXNlUHJvcHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZywgZm9yY2U/OiBib29sZWFuKTogSUJhc2VQcm9wcyB7XHJcbiAgaWYgKCFwcm9maWxlSWQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9jYWxNZXJnZWRTY3JpcHRzOiBib29sZWFuID0gKGZvcmNlKSA/IHRydWUgOiB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBwcm9maWxlSWQsICdmZWF0dXJlcycsICdsb2NhbF9tZXJnZXMnXSwgZmFsc2UpO1xyXG4gIGlmICghbG9jYWxNZXJnZWRTY3JpcHRzKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZGlzY292ZXJ5Py50b29scz8uW1NDUklQVF9NRVJHRVJfSURdO1xyXG4gIGlmICghc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgLy8gUmVnYXJkbGVzcyBvZiB0aGUgdXNlcidzIHByb2ZpbGUgc2V0dGluZ3MgLSB0aGVyZSdzIG5vIHBvaW50IGluIGJhY2tpbmcgdXBcclxuICAgIC8vICB0aGUgbWVyZ2VzIGlmIHdlIGRvbid0IGtub3cgd2hlcmUgdGhlIHNjcmlwdCBtZXJnZXIgaXMhXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgYXBpOiBjb250ZXh0LmFwaSwgc3RhdGUsIHByb2ZpbGUsIHNjcmlwdE1lcmdlclRvb2wsIGdhbWVQYXRoOiBkaXNjb3ZlcnkucGF0aCB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRGaWxlRW50cmllcyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGxldCBmaWxlczogc3RyaW5nW10gPSBbXTtcclxuICByZXR1cm4gdHVyYm93YWxrKGZpbGVQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgIGNvbnN0IHZhbGlkRW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGVudHJ5ID0+IGVudHJ5LmZpbGVQYXRoKTtcclxuICAgIGZpbGVzID0gZmlsZXMuY29uY2F0KHZhbGlkRW50cmllcyk7XHJcbiAgfSwgeyByZWN1cnNlOiB0cnVlIH0pXHJcbiAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZmlsZXMpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbW92ZUZpbGUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGZyb20sIGZpbGVOYW1lKTtcclxuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHRvLCBmaWxlTmFtZSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGNvcHlGaWxlKHNyYywgZGVzdCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBJdCdzIHBlcmZlY3RseSBwb3NzaWJsZSBmb3IgdGhlIHVzZXIgbm90IHRvIGhhdmUgYW55IG1lcmdlcyB5ZXQuXHJcbiAgICByZXR1cm4gKGVyci5jb2RlICE9PSAnRU5PRU5UJylcclxuICAgICAgPyBQcm9taXNlLnJlamVjdChlcnIpXHJcbiAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZW1vdmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcclxuICBpZiAocGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gJycpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNvcHlGaWxlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpO1xyXG4gICAgYXdhaXQgcmVtb3ZlRmlsZShkZXN0KTtcclxuICAgIGF3YWl0IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBtb3ZlRmlsZXMoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZywgcHJvcHM6IElCYXNlUHJvcHMpIHtcclxuICBjb25zdCB0ID0gcHJvcHMuYXBpLnRyYW5zbGF0ZTtcclxuICBjb25zdCByZW1vdmVEZXN0RmlsZXMgPSBhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBkZXN0RmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoZGVzdCk7XHJcbiAgICAgIGRlc3RGaWxlcy5zb3J0KHNvcnREZWMpO1xyXG4gICAgICBmb3IgKGNvbnN0IGRlc3RGaWxlIG9mIGRlc3RGaWxlcykge1xyXG4gICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3RGaWxlKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gcmVzdG9yZSBtZXJnZWQgZmlsZXMnLCB7XHJcbiAgICAgICAgICBiYmNvZGU6IHQoJ1ZvcnRleCBlbmNvdW50ZXJlZCBhIHBlcm1pc3Npb25zIHJlbGF0ZWQgZXJyb3Igd2hpbGUgYXR0ZW1wdGluZyAnXHJcbiAgICAgICAgICAgICsgJ3RvIHJlcGxhY2U6e3tibH19XCJ7e2ZpbGVQYXRofX1cInt7Ymx9fSdcclxuICAgICAgICAgICAgKyAnUGxlYXNlIHRyeSB0byByZXNvbHZlIGFueSBwZXJtaXNzaW9ucyByZWxhdGVkIGlzc3VlcyBhbmQgcmV0dXJuIHRvIHRoaXMgJ1xyXG4gICAgICAgICAgICArICdkaWFsb2cgd2hlbiB5b3UgdGhpbmsgeW91IG1hbmFnZWQgdG8gZml4IGl0LiBUaGVyZSBhcmUgYSBjb3VwbGUgb2YgdGhpbmdzICdcclxuICAgICAgICAgICAgKyAneW91IGNhbiB0cnkgdG8gZml4IHRoaXM6W2JyXVsvYnJdW2xpc3RdWypdIENsb3NlL0Rpc2FibGUgYW55IGFwcGxpY2F0aW9ucyB0aGF0IG1heSAnXHJcbiAgICAgICAgICAgICsgJ2ludGVyZmVyZSB3aXRoIFZvcnRleFxcJ3Mgb3BlcmF0aW9ucyBzdWNoIGFzIHRoZSBnYW1lIGl0c2VsZiwgdGhlIHdpdGNoZXIgc2NyaXB0IG1lcmdlciwgJ1xyXG4gICAgICAgICAgICArICdhbnkgZXh0ZXJuYWwgbW9kZGluZyB0b29scywgYW55IGFudGktdmlydXMgc29mdHdhcmUuICdcclxuICAgICAgICAgICAgKyAnWypdIEVuc3VyZSB0aGF0IHlvdXIgV2luZG93cyB1c2VyIGFjY291bnQgaGFzIGZ1bGwgcmVhZC93cml0ZSBwZXJtaXNzaW9ucyB0byB0aGUgZmlsZSBzcGVjaWZpZWQgJ1xyXG4gICAgICAgICAgICArICdbL2xpc3RdJywgeyByZXBsYWNlOiB7IGZpbGVQYXRoOiBlcnIucGF0aCwgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nIH0gfSksXHJcbiAgICAgICAgfSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcclxuICAgICAgICAgIHsgbGFiZWw6ICdUcnkgQWdhaW4nLCBhY3Rpb246ICgpID0+IHJlbW92ZURlc3RGaWxlcygpIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGNsZWFuIHVwIHRoZSBkZXN0aW5hdGlvbiBmb2xkZXIgLSB3ZSBjYW4ndFxyXG4gICAgICAgIC8vICBjb250aW51ZS5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKGVyci5tZXNzYWdlKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBhd2FpdCByZW1vdmVEZXN0RmlsZXMoKTtcclxuICBjb25zdCBjb3BpZWQ6IHN0cmluZ1tdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNyY0ZpbGVzOiBzdHJpbmdbXSA9IGF3YWl0IGdldEZpbGVFbnRyaWVzKHNyYyk7XHJcbiAgICBzcmNGaWxlcy5zb3J0KHNvcnRJbmMpO1xyXG4gICAgZm9yIChjb25zdCBzcmNGaWxlIG9mIHNyY0ZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKHNyYywgc3JjRmlsZSk7XHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oZGVzdCwgcmVsUGF0aCk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgY29weUZpbGUoc3JjRmlsZSwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgICAgY29waWVkLnB1c2godGFyZ2V0UGF0aCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIG1vdmUgZmlsZScsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiAoY2xlYW5VcCkge1xyXG4gICAgLy8gICAvLyBXZSBtYW5hZ2VkIHRvIGNvcHkgYWxsIHRoZSBmaWxlcywgY2xlYW4gdXAgdGhlIHNvdXJjZVxyXG4gICAgLy8gICBzcmNGaWxlcy5zb3J0KHNvcnREZWMpO1xyXG4gICAgLy8gICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcclxuICAgIC8vICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhzcmNGaWxlKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKCEhZXJyLnBhdGggJiYgIWVyci5wYXRoLmluY2x1ZGVzKGRlc3QpKSB7XHJcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgc291cmNlXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSBmYWlsZWQgdG8gY29weSAtIGNsZWFuIHVwLlxyXG4gICAgY29waWVkLnNvcnQoc29ydERlYyk7XHJcbiAgICBmb3IgKGNvbnN0IGxpbmsgb2YgY29waWVkKSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxpbmspO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wczogSUJhc2VQcm9wcywgb3BUeXBlOiBPcFR5cGUsIGRlc3Q/OiBzdHJpbmcpIHtcclxuICBjb25zdCB7IHNjcmlwdE1lcmdlclRvb2wsIHByb2ZpbGUsIGdhbWVQYXRoIH0gPSBwcm9wcztcclxuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Ob3RGb3VuZCgnU2NyaXB0IG1lcmdpbmcgdG9vbCBwYXRoJykpO1xyXG4gIH1cclxuICBpZiAoIXByb2ZpbGU/LmlkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuQXJndW1lbnRJbnZhbGlkKCdpbnZhbGlkIHByb2ZpbGUnKSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbWVyZ2VyVG9vbERpciA9IHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXJUb29sLnBhdGgpO1xyXG4gICAgY29uc3QgcHJvZmlsZVBhdGg6IHN0cmluZyA9IChkZXN0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgID8gcGF0aC5qb2luKG1lcmdlclRvb2xEaXIsIHByb2ZpbGUuaWQpXHJcbiAgICAgIDogZGVzdDtcclxuICAgIGNvbnN0IGxvYXJPcmRlckZpbGVwYXRoOiBzdHJpbmcgPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgY29uc3QgbWVyZ2VkTW9kTmFtZSA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWUobWVyZ2VyVG9vbERpcik7XHJcbiAgICBjb25zdCBtZXJnZWRTY3JpcHRzUGF0aCA9IHBhdGguam9pbihnYW1lUGF0aCwgJ01vZHMnLCBtZXJnZWRNb2ROYW1lKTtcclxuXHJcbiAgICAvLyBKdXN0IGluIGNhc2UgaXQncyBtaXNzaW5nLlxyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtZXJnZWRTY3JpcHRzUGF0aCk7XHJcblxyXG4gICAgaWYgKG9wVHlwZSA9PT0gJ2V4cG9ydCcpIHtcclxuICAgICAgYXdhaXQgbW92ZUZpbGUobWVyZ2VyVG9vbERpciwgcHJvZmlsZVBhdGgsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHByb2ZpbGVQYXRoLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlcyhtZXJnZWRTY3JpcHRzUGF0aCwgcGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgcHJvcHMpO1xyXG4gICAgfSBlbHNlIGlmIChvcFR5cGUgPT09ICdpbXBvcnQnKSB7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBtZXJnZXJUb29sRGlyLCBNRVJHRV9JTlZfTUFOSUZFU1QpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZShwcm9maWxlUGF0aCwgcGF0aC5kaXJuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSwgcGF0aC5iYXNlbmFtZShsb2FyT3JkZXJGaWxlcGF0aCkpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZXMocGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgbWVyZ2VkU2NyaXB0c1BhdGgsIHByb3BzKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHN0b3JlL3Jlc3RvcmUgbWVyZ2VkIHNjcmlwdHMnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVUb1Byb2ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkLCB0cnVlKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgdGVtcFBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSk7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRlbXBQYXRoKTtcclxuICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnLCB0ZW1wUGF0aCk7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcHJlcGFyZUZpbGVEYXRhKHRlbXBQYXRoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVEYXRhOiBCdWZmZXIpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQsIHRydWUpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NjcmlwdCBNZXJnZXMgSW1wb3J0Jywge1xyXG4gICAgdGV4dDogJ1RoZSBjb2xsZWN0aW9uIHlvdSBhcmUgaW1wb3J0aW5nIGNvbnRhaW5zIHNjcmlwdCBtZXJnZXMgd2hpY2ggdGhlIGNyZWF0b3Igb2YgJ1xyXG4gICAgICAgICsgJ3RoZSBjb2xsZWN0aW9uIGRlZW1lZCBuZWNlc3NhcnkgZm9yIHRoZSBtb2RzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS4gUGxlYXNlIG5vdGUgdGhhdCAnXHJcbiAgICAgICAgKyAnaW1wb3J0aW5nIHRoZXNlIHdpbGwgb3ZlcndyaXRlIGFueSBleGlzdGluZyBzY3JpcHQgbWVyZ2VzIHlvdSBtYXkgaGF2ZSBlZmZlY3R1YXRlZC4gJ1xyXG4gICAgICAgICsgJ1BsZWFzZSBlbnN1cmUgdG8gYmFjayB1cCBhbnkgZXhpc3RpbmcgbWVyZ2VzIChpZiBhcHBsaWNhYmxlL3JlcXVpcmVkKSBiZWZvcmUgJ1xyXG4gICAgICAgICsgJ3Byb2NlZWRpbmcuJyxcclxuICB9LFxyXG4gIFtcclxuICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICB7IGxhYmVsOiAnSW1wb3J0IE1lcmdlcycgfSxcclxuICBdLCAnaW1wb3J0LXczLXNjcmlwdC1tZXJnZXMtd2FybmluZycpO1xyXG5cclxuICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSk7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpKTtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGVtcFBhdGgpO1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YSwgdGVtcFBhdGgpO1xyXG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcsIHRlbXBQYXRoKTtcclxuICAgIGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBtZXNzYWdlOiAnU2NyaXB0IG1lcmdlcyBpbXBvcnRlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICBpZDogJ3dpdGNoZXIzLXNjcmlwdC1tZXJnZXMtc3RhdHVzJyxcclxuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1ha2VPbkNvbnRleHRJbXBvcnQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIGNvbGxlY3Rpb25JZDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBjb2xsZWN0aW9uTW9kID0gbW9kc1tjb2xsZWN0aW9uSWRdO1xyXG4gIGlmIChjb2xsZWN0aW9uTW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnZXJyb3InLCAnY29sbGVjdGlvbiBtb2QgaXMgbWlzc2luZycsIGNvbGxlY3Rpb25JZCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgY29sbGVjdGlvbk1vZC5pbnN0YWxsYXRpb25QYXRoLCAnY29sbGVjdGlvbi5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIGNvbnN0IHsgc2NyaXB0TWVyZ2VkRGF0YSB9ID0gY29sbGVjdGlvbi5tZXJnZWREYXRhO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlZERhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSB0aGUgc2NyaXB0IG1lcmdlciBpbnN0YWxsZWQgc3RyYWlnaHQgYXdheSFcclxuICAgICAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGF3YWl0IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGNvbnRleHQpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBhd2FpdCBpbXBvcnRTY3JpcHRNZXJnZXMoY29udGV4dCwgcHJvZmlsZUlkLCBoZXgyQnVmZmVyKHNjcmlwdE1lcmdlZERhdGEpKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBzY3JpcHQgbWVyZ2VzJywgZXJyKTtcclxuICB9XHJcbn1cclxuIl19