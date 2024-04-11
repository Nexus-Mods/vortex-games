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
exports.makeOnContextImport = exports.importScriptMerges = exports.exportScriptMerges = exports.queryScriptMerges = exports.restoreFromProfile = exports.storeToProfile = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const shortid_1 = require("shortid");
const util_1 = require("./collections/util");
const mergeInventoryParsing_1 = require("./mergeInventoryParsing");
const scriptmerger_1 = require("./scriptmerger");
const util_2 = require("./util");
const sortInc = (lhs, rhs) => lhs.length - rhs.length;
const sortDec = (lhs, rhs) => rhs.length - lhs.length;
function genBaseProps(api, profileId, force) {
    var _a;
    if (!profileId) {
        return undefined;
    }
    const state = api.getState();
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
    return { api, state, profile, scriptMergerTool, gamePath: discovery.path };
}
function getFileEntries(filePath) {
    let files = [];
    return (0, turbowalk_1.default)(filePath, entries => {
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
                    (0, vortex_api_1.log)('error', 'failed to move file', err);
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
function backupPath(profile) {
    return path_1.default.join(vortex_api_1.util.getVortexPath('userData'), profile.gameId, 'profiles', profile.id, 'backup');
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
            const loarOrderFilepath = (0, common_1.getLoadOrderFilePath)();
            const mergedModName = yield (0, scriptmerger_1.getMergedModName)(mergerToolDir);
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
            return Promise.resolve();
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to store/restore merged scripts', err);
            return Promise.reject(err);
        }
    });
}
function storeToProfile(api, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId);
        if (props === undefined) {
            return;
        }
        const bakPath = backupPath(props.profile);
        try {
            yield handleMergedScripts(props, 'export', bakPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
        return handleMergedScripts(props, 'export');
    });
}
exports.storeToProfile = storeToProfile;
function restoreFromProfile(api, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId);
        if (props === undefined) {
            return;
        }
        const bakPath = backupPath(props.profile);
        try {
            yield handleMergedScripts(props, 'import', bakPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
        return handleMergedScripts(props, 'import');
    });
}
exports.restoreFromProfile = restoreFromProfile;
function queryScriptMerges(api, includedModIds, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modTypes = vortex_api_1.selectors.modPathsForGame(state, common_1.GAME_ID);
        const deployment = yield (0, util_2.getDeployment)(api, includedModIds);
        const deployedNames = Object.keys(modTypes).reduce((accum, typeId) => {
            const modPath = modTypes[typeId];
            const files = deployment[typeId];
            const isRootMod = modPath.toLowerCase().split(path_1.default.sep).indexOf('mods') === -1;
            const names = files.map(file => {
                const nameSegments = file.relPath.split(path_1.default.sep);
                if (isRootMod) {
                    const nameIdx = nameSegments.map(seg => seg.toLowerCase()).indexOf('mods') + 1;
                    return (nameIdx > 0)
                        ? nameSegments[nameIdx]
                        : undefined;
                }
                else {
                    return nameSegments[0];
                }
            });
            accum = accum.concat(names.filter(name => !!name));
            return accum;
        }, []);
        const uniqueDeployed = Array.from(new Set(deployedNames));
        const merged = yield (0, mergeInventoryParsing_1.getNamesOfMergedMods)(api);
        const diff = lodash_1.default.difference(merged, uniqueDeployed);
        const isOptional = (modId) => {
            var _a;
            return ((_a = collection.rules) !== null && _a !== void 0 ? _a : []).find(rule => {
                const mod = mods[modId];
                if (mod === undefined) {
                    return false;
                }
                const validType = ['recommends'].includes(rule.type);
                if (!validType) {
                    return false;
                }
                const matchedRule = vortex_api_1.util.testModReference(mod, rule.reference);
                return matchedRule;
            }) !== undefined;
        };
        const optionalMods = includedModIds.filter(isOptional);
        if (optionalMods.length > 0 || diff.length !== 0) {
            throw new common_1.MergeDataViolationError(diff || [], optionalMods || [], vortex_api_1.util.renderModName(collection));
        }
    });
}
exports.queryScriptMerges = queryScriptMerges;
function exportScriptMerges(api, profileId, includedModIds, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId, true);
        if (props === undefined) {
            return;
        }
        const exportMergedData = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)());
                yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
                yield handleMergedScripts(props, 'export', tempPath);
                const data = yield (0, util_1.prepareFileData)(tempPath);
                return Promise.resolve(data);
            }
            catch (err) {
                return Promise.reject(err);
            }
        });
        try {
            yield queryScriptMerges(api, includedModIds, collection);
            return exportMergedData();
        }
        catch (err) {
            if (err instanceof common_1.MergeDataViolationError) {
                const violationError = err;
                const optional = violationError.Optional;
                const notIncluded = violationError.NotIncluded;
                const optionalSegment = (optional.length > 0)
                    ? 'Marked as "optional" but need to be marked "required":{{br}}[list]'
                        + optional.map(opt => `[*]${opt}`) + '[/list]{{br}}'
                    : '';
                const notIncludedSegment = (notIncluded.length > 0)
                    ? 'No longer part of the collection and need to be re-added:{{br}}[list]'
                        + notIncluded.map(ni => `[*]${ni}`) + '[/list]{{br}}'
                    : '';
                return api.showDialog('question', 'Potential merged data mismatch', {
                    bbcode: 'Your collection includes a script merge that is referencing mods '
                        + `that are...{{bl}} ${notIncludedSegment}${optionalSegment}`
                        + 'For the collection to function correctly you will need to address the '
                        + 'above or re-run the Script Merger to remove traces of merges referencing '
                        + 'these mods. Please, do only proceed to upload the collection/revision as '
                        + 'is if you intend to upload the script merge as is and if the reference for '
                        + 'the merge will e.g. be acquired from an external source as part of the collection.',
                    parameters: { br: '[br][/br]', bl: '[br][/br][br][/br]' },
                }, [
                    { label: 'Cancel' },
                    { label: 'Upload Collection' }
                ]).then(res => (res.action === 'Cancel')
                    ? Promise.reject(new vortex_api_1.util.UserCanceled)
                    : exportMergedData());
            }
            return Promise.reject(err);
        }
    });
}
exports.exportScriptMerges = exportScriptMerges;
function importScriptMerges(api, profileId, fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId, true);
        if (props === undefined) {
            return;
        }
        const res = yield api.showDialog('question', 'Script Merges Import', {
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
            const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)());
            yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
            const data = yield (0, util_1.restoreFileData)(fileData, tempPath);
            yield handleMergedScripts(props, 'import', tempPath);
            api.sendNotification({
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
function makeOnContextImport(api, collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const collectionMod = mods[collectionId];
        if ((collectionMod === null || collectionMod === void 0 ? void 0 : collectionMod.installationPath) === undefined) {
            (0, vortex_api_1.log)('error', 'collection mod is missing', collectionId);
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
                    yield (0, scriptmerger_1.downloadScriptMerger)(api);
                }
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
                yield importScriptMerges(api, profileId, (0, util_1.hex2Buffer)(scriptMergedData));
            }
        }
        catch (err) {
            if (!(err instanceof vortex_api_1.util.UserCanceled)) {
                api.showErrorNotification('Failed to import script merges', err);
            }
        }
    });
}
exports.makeOnContextImport = makeOnContextImport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxvREFBdUI7QUFDdkIsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFFN0QscUNBQ2dGO0FBRWhGLHFDQUFtQztBQUVuQyw2Q0FBa0Y7QUFFbEYsbUVBQStEO0FBRS9ELGlEQUF3RTtBQUV4RSxpQ0FBdUM7QUFhdkMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFFdEUsU0FBUyxZQUFZLENBQUMsR0FBd0IsRUFDeEIsU0FBaUIsRUFBRSxLQUFlOztJQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RSxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxrQkFBa0IsR0FBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDckUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUs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TyxDQUFDLEtBQUssRUFDekMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN6RixJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRTtvQkFDbEMsTUFBTSxJQUFBLG1DQUFvQixFQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNqQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sa0JBQWtCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFBLGlCQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2FBQ3hFO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUksQ0FBQyxDQUFDLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUN2QyxHQUFHLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDbEU7U0FDRjtJQUNILENBQUM7Q0FBQTtBQTdCRCxrREE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNULFxyXG4gIFNDUklQVF9NRVJHRVJfSUQsIFczX1RFTVBfREFUQV9ESVIsIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgZ2VuZXJhdGUgfSBmcm9tICdzaG9ydGlkJztcclxuXHJcbmltcG9ydCB7IGhleDJCdWZmZXIsIHByZXBhcmVGaWxlRGF0YSwgcmVzdG9yZUZpbGVEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy91dGlsJztcclxuXHJcbmltcG9ydCB7IGdldE5hbWVzT2ZNZXJnZWRNb2RzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZSwgZG93bmxvYWRTY3JpcHRNZXJnZXIgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XHJcblxyXG5pbXBvcnQgeyBnZXREZXBsb3ltZW50IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7IElEZXBsb3llZEZpbGUsIElEZXBsb3ltZW50IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG50eXBlIE9wVHlwZSA9ICdpbXBvcnQnIHwgJ2V4cG9ydCc7XHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxuICBzY3JpcHRNZXJnZXJUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2w7XHJcbiAgZ2FtZVBhdGg6IHN0cmluZztcclxufVxyXG5cclxuY29uc3Qgc29ydEluYyA9IChsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpID0+IGxocy5sZW5ndGggLSByaHMubGVuZ3RoO1xyXG5jb25zdCBzb3J0RGVjID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gcmhzLmxlbmd0aCAtIGxocy5sZW5ndGg7XHJcblxyXG5mdW5jdGlvbiBnZW5CYXNlUHJvcHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbik6IElCYXNlUHJvcHMge1xyXG4gIGlmICghcHJvZmlsZUlkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2NhbE1lcmdlZFNjcmlwdHM6IGJvb2xlYW4gPSAoZm9yY2UpID8gdHJ1ZSA6IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZCwgJ2ZlYXR1cmVzJywgJ2xvY2FsX21lcmdlcyddLCBmYWxzZSk7XHJcbiAgaWYgKCFsb2NhbE1lcmdlZFNjcmlwdHMpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bU0NSSVBUX01FUkdFUl9JRF07XHJcbiAgaWYgKCFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICAvLyBSZWdhcmRsZXNzIG9mIHRoZSB1c2VyJ3MgcHJvZmlsZSBzZXR0aW5ncyAtIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gYmFja2luZyB1cFxyXG4gICAgLy8gIHRoZSBtZXJnZXMgaWYgd2UgZG9uJ3Qga25vdyB3aGVyZSB0aGUgc2NyaXB0IG1lcmdlciBpcyFcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBhcGksIHN0YXRlLCBwcm9maWxlLCBzY3JpcHRNZXJnZXJUb29sLCBnYW1lUGF0aDogZGlzY292ZXJ5LnBhdGggfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RmlsZUVudHJpZXMoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBsZXQgZmlsZXM6IHN0cmluZ1tdID0gW107XHJcbiAgcmV0dXJuIHR1cmJvd2FsayhmaWxlUGF0aCwgZW50cmllcyA9PiB7XHJcbiAgICBjb25zdCB2YWxpZEVudHJpZXMgPSBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAhZW50cnkuaXNEaXJlY3RvcnkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICBmaWxlcyA9IGZpbGVzLmNvbmNhdCh2YWxpZEVudHJpZXMpO1xyXG4gIH0sIHsgcmVjdXJzZTogdHJ1ZSB9KVxyXG4gIC5jYXRjaChlcnIgPT4gWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5jbHVkZXMoZXJyLmNvZGUpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVzKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG1vdmVGaWxlKGZyb206IHN0cmluZywgdG86IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZykge1xyXG4gIGNvbnN0IHNyYyA9IHBhdGguam9pbihmcm9tLCBmaWxlTmFtZSk7XHJcbiAgY29uc3QgZGVzdCA9IHBhdGguam9pbih0bywgZmlsZU5hbWUpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBjb3B5RmlsZShzcmMsIGRlc3QpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgLy8gSXQncyBwZXJmZWN0bHkgcG9zc2libGUgZm9yIHRoZSB1c2VyIG5vdCB0byBoYXZlIGFueSBtZXJnZXMgeWV0LlxyXG4gICAgcmV0dXJuIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZWplY3QoZXJyKVxyXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVtb3ZlRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XHJcbiAgaWYgKHBhdGguZXh0bmFtZShmaWxlUGF0aCkgPT09ICcnKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjb3B5RmlsZShzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nKSB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGRlc3QpKTtcclxuICAgIGF3YWl0IHJlbW92ZUZpbGUoZGVzdCk7XHJcbiAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbW92ZUZpbGVzKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcsIHByb3BzOiBJQmFzZVByb3BzKSB7XHJcbiAgY29uc3QgdCA9IHByb3BzLmFwaS50cmFuc2xhdGU7XHJcbiAgY29uc3QgcmVtb3ZlRGVzdEZpbGVzID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGVzdEZpbGVzOiBzdHJpbmdbXSA9IGF3YWl0IGdldEZpbGVFbnRyaWVzKGRlc3QpO1xyXG4gICAgICBkZXN0RmlsZXMuc29ydChzb3J0RGVjKTtcclxuICAgICAgZm9yIChjb25zdCBkZXN0RmlsZSBvZiBkZXN0RmlsZXMpIHtcclxuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0RmlsZSk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBpZiAoWydFUEVSTSddLmluY2x1ZGVzKGVyci5jb2RlKSkge1xyXG4gICAgICAgIHJldHVybiBwcm9wcy5hcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHJlc3RvcmUgbWVyZ2VkIGZpbGVzJywge1xyXG4gICAgICAgICAgYmJjb2RlOiB0KCdWb3J0ZXggZW5jb3VudGVyZWQgYSBwZXJtaXNzaW9ucyByZWxhdGVkIGVycm9yIHdoaWxlIGF0dGVtcHRpbmcgJ1xyXG4gICAgICAgICAgICArICd0byByZXBsYWNlOnt7Ymx9fVwie3tmaWxlUGF0aH19XCJ7e2JsfX0nXHJcbiAgICAgICAgICAgICsgJ1BsZWFzZSB0cnkgdG8gcmVzb2x2ZSBhbnkgcGVybWlzc2lvbnMgcmVsYXRlZCBpc3N1ZXMgYW5kIHJldHVybiB0byB0aGlzICdcclxuICAgICAgICAgICAgKyAnZGlhbG9nIHdoZW4geW91IHRoaW5rIHlvdSBtYW5hZ2VkIHRvIGZpeCBpdC4gVGhlcmUgYXJlIGEgY291cGxlIG9mIHRoaW5ncyAnXHJcbiAgICAgICAgICAgICsgJ3lvdSBjYW4gdHJ5IHRvIGZpeCB0aGlzOlticl1bL2JyXVtsaXN0XVsqXSBDbG9zZS9EaXNhYmxlIGFueSBhcHBsaWNhdGlvbnMgdGhhdCBtYXkgJ1xyXG4gICAgICAgICAgICArICdpbnRlcmZlcmUgd2l0aCBWb3J0ZXhcXCdzIG9wZXJhdGlvbnMgc3VjaCBhcyB0aGUgZ2FtZSBpdHNlbGYsIHRoZSB3aXRjaGVyIHNjcmlwdCBtZXJnZXIsICdcclxuICAgICAgICAgICAgKyAnYW55IGV4dGVybmFsIG1vZGRpbmcgdG9vbHMsIGFueSBhbnRpLXZpcnVzIHNvZnR3YXJlLiAnXHJcbiAgICAgICAgICAgICsgJ1sqXSBFbnN1cmUgdGhhdCB5b3VyIFdpbmRvd3MgdXNlciBhY2NvdW50IGhhcyBmdWxsIHJlYWQvd3JpdGUgcGVybWlzc2lvbnMgdG8gdGhlIGZpbGUgc3BlY2lmaWVkICdcclxuICAgICAgICAgICAgKyAnWy9saXN0XScsIHsgcmVwbGFjZTogeyBmaWxlUGF0aDogZXJyLnBhdGgsIGJsOiAnW2JyXVsvYnJdW2JyXVsvYnJdJyB9IH0pLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKCkpIH0sXHJcbiAgICAgICAgICB7IGxhYmVsOiAnVHJ5IEFnYWluJywgYWN0aW9uOiAoKSA9PiByZW1vdmVEZXN0RmlsZXMoKSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgZGVzdGluYXRpb24gZm9sZGVyIC0gd2UgY2FuJ3RcclxuICAgICAgICAvLyAgY29udGludWUuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZChlcnIubWVzc2FnZSkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXdhaXQgcmVtb3ZlRGVzdEZpbGVzKCk7XHJcbiAgY29uc3QgY29waWVkOiBzdHJpbmdbXSA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBzcmNGaWxlczogc3RyaW5nW10gPSBhd2FpdCBnZXRGaWxlRW50cmllcyhzcmMpO1xyXG4gICAgc3JjRmlsZXMuc29ydChzb3J0SW5jKTtcclxuICAgIGZvciAoY29uc3Qgc3JjRmlsZSBvZiBzcmNGaWxlcykge1xyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShzcmMsIHNyY0ZpbGUpO1xyXG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGRlc3QsIHJlbFBhdGgpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGNvcHlGaWxlKHNyY0ZpbGUsIHRhcmdldFBhdGgpO1xyXG4gICAgICAgIGNvcGllZC5wdXNoKHRhcmdldFBhdGgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBtb3ZlIGZpbGUnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgKGNsZWFuVXApIHtcclxuICAgIC8vICAgLy8gV2UgbWFuYWdlZCB0byBjb3B5IGFsbCB0aGUgZmlsZXMsIGNsZWFuIHVwIHRoZSBzb3VyY2VcclxuICAgIC8vICAgc3JjRmlsZXMuc29ydChzb3J0RGVjKTtcclxuICAgIC8vICAgZm9yIChjb25zdCBzcmNGaWxlIG9mIHNyY0ZpbGVzKSB7XHJcbiAgICAvLyAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoc3JjRmlsZSk7XHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmICghIWVyci5wYXRoICYmICFlcnIucGF0aC5pbmNsdWRlcyhkZXN0KSkge1xyXG4gICAgICAvLyBXZSBmYWlsZWQgdG8gY2xlYW4gdXAgdGhlIHNvdXJjZVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2UgZmFpbGVkIHRvIGNvcHkgLSBjbGVhbiB1cC5cclxuICAgIGNvcGllZC5zb3J0KHNvcnREZWMpO1xyXG4gICAgZm9yIChjb25zdCBsaW5rIG9mIGNvcGllZCkge1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsaW5rKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJhY2t1cFBhdGgocHJvZmlsZTogdHlwZXMuSVByb2ZpbGUpOiBzdHJpbmcge1xyXG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd1c2VyRGF0YScpLFxyXG4gICAgcHJvZmlsZS5nYW1lSWQsICdwcm9maWxlcycsIHByb2ZpbGUuaWQsICdiYWNrdXAnKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wczogSUJhc2VQcm9wcywgb3BUeXBlOiBPcFR5cGUsIGRlc3Q/OiBzdHJpbmcpIHtcclxuICBjb25zdCB7IHNjcmlwdE1lcmdlclRvb2wsIHByb2ZpbGUsIGdhbWVQYXRoIH0gPSBwcm9wcztcclxuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Ob3RGb3VuZCgnU2NyaXB0IG1lcmdpbmcgdG9vbCBwYXRoJykpO1xyXG4gIH1cclxuICBpZiAoIXByb2ZpbGU/LmlkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuQXJndW1lbnRJbnZhbGlkKCdpbnZhbGlkIHByb2ZpbGUnKSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbWVyZ2VyVG9vbERpciA9IHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXJUb29sLnBhdGgpO1xyXG4gICAgY29uc3QgcHJvZmlsZVBhdGg6IHN0cmluZyA9IChkZXN0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgID8gcGF0aC5qb2luKG1lcmdlclRvb2xEaXIsIHByb2ZpbGUuaWQpXHJcbiAgICAgIDogZGVzdDtcclxuICAgIGNvbnN0IGxvYXJPcmRlckZpbGVwYXRoOiBzdHJpbmcgPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgY29uc3QgbWVyZ2VkTW9kTmFtZSA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWUobWVyZ2VyVG9vbERpcik7XHJcbiAgICBjb25zdCBtZXJnZWRTY3JpcHRzUGF0aCA9IHBhdGguam9pbihnYW1lUGF0aCwgJ01vZHMnLCBtZXJnZWRNb2ROYW1lKTtcclxuXHJcbiAgICAvLyBKdXN0IGluIGNhc2UgaXQncyBtaXNzaW5nLlxyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtZXJnZWRTY3JpcHRzUGF0aCk7XHJcblxyXG4gICAgaWYgKG9wVHlwZSA9PT0gJ2V4cG9ydCcpIHtcclxuICAgICAgYXdhaXQgbW92ZUZpbGUobWVyZ2VyVG9vbERpciwgcHJvZmlsZVBhdGgsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHByb2ZpbGVQYXRoLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlcyhtZXJnZWRTY3JpcHRzUGF0aCwgcGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgcHJvcHMpO1xyXG4gICAgfSBlbHNlIGlmIChvcFR5cGUgPT09ICdpbXBvcnQnKSB7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBtZXJnZXJUb29sRGlyLCBNRVJHRV9JTlZfTUFOSUZFU1QpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZShwcm9maWxlUGF0aCwgcGF0aC5kaXJuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSwgcGF0aC5iYXNlbmFtZShsb2FyT3JkZXJGaWxlcGF0aCkpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZXMocGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgbWVyZ2VkU2NyaXB0c1BhdGgsIHByb3BzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHN0b3JlL3Jlc3RvcmUgbWVyZ2VkIHNjcmlwdHMnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVUb1Byb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGFwaSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgYmFrUGF0aCA9IGJhY2t1cFBhdGgocHJvcHMucHJvZmlsZSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnLCBiYWtQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2V4cG9ydCcpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUZyb21Qcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhhcGksIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGJha1BhdGggPSBiYWNrdXBQYXRoKHByb3BzLnByb2ZpbGUpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnaW1wb3J0JywgYmFrUGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbiAgcmV0dXJuIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdpbXBvcnQnKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5U2NyaXB0TWVyZ2VzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkTW9kSWRzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RUeXBlczogeyBbdHlwZUlkOiBzdHJpbmddOiBzdHJpbmcgfSA9IHNlbGVjdG9ycy5tb2RQYXRoc0ZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGRlcGxveW1lbnQ6IElEZXBsb3ltZW50ID0gYXdhaXQgZ2V0RGVwbG95bWVudChhcGksIGluY2x1ZGVkTW9kSWRzKTtcclxuICBjb25zdCBkZXBsb3llZE5hbWVzOiBzdHJpbmdbXSA9IE9iamVjdC5rZXlzKG1vZFR5cGVzKS5yZWR1Y2UoKGFjY3VtLCB0eXBlSWQpID0+IHtcclxuICAgIGNvbnN0IG1vZFBhdGggPSBtb2RUeXBlc1t0eXBlSWRdO1xyXG4gICAgY29uc3QgZmlsZXM6IElEZXBsb3llZEZpbGVbXSA9IGRlcGxveW1lbnRbdHlwZUlkXTtcclxuICAgIGNvbnN0IGlzUm9vdE1vZCA9IG1vZFBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpID09PSAtMTtcclxuICAgIGNvbnN0IG5hbWVzID0gZmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBuYW1lU2VnbWVudHMgPSBmaWxlLnJlbFBhdGguc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICBpZiAoaXNSb290TW9kKSB7XHJcbiAgICAgICAgY29uc3QgbmFtZUlkeCA9IG5hbWVTZWdtZW50cy5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKS5pbmRleE9mKCdtb2RzJykgKyAxO1xyXG4gICAgICAgIHJldHVybiAobmFtZUlkeCA+IDApXHJcbiAgICAgICAgICA/IG5hbWVTZWdtZW50c1tuYW1lSWR4XVxyXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5hbWVTZWdtZW50c1swXTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBhY2N1bSA9IGFjY3VtLmNvbmNhdChuYW1lcy5maWx0ZXIobmFtZSA9PiAhIW5hbWUpKTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcbiAgY29uc3QgdW5pcXVlRGVwbG95ZWQgPSBBcnJheS5mcm9tKG5ldyBTZXQoZGVwbG95ZWROYW1lcykpO1xyXG4gIGNvbnN0IG1lcmdlZCA9IGF3YWl0IGdldE5hbWVzT2ZNZXJnZWRNb2RzKGFwaSk7XHJcbiAgY29uc3QgZGlmZiA9IF8uZGlmZmVyZW5jZShtZXJnZWQsIHVuaXF1ZURlcGxveWVkKTtcclxuICBjb25zdCBpc09wdGlvbmFsID0gKG1vZElkOiBzdHJpbmcpID0+IChjb2xsZWN0aW9uLnJ1bGVzID8/IFtdKS5maW5kKHJ1bGUgPT4ge1xyXG4gICAgY29uc3QgbW9kOiB0eXBlcy5JTW9kID0gbW9kc1ttb2RJZF07XHJcbiAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdmFsaWRUeXBlID0gWydyZWNvbW1lbmRzJ10uaW5jbHVkZXMocnVsZS50eXBlKTtcclxuICAgIGlmICghdmFsaWRUeXBlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1hdGNoZWRSdWxlID0gdXRpbC50ZXN0TW9kUmVmZXJlbmNlKG1vZCwgcnVsZS5yZWZlcmVuY2UpO1xyXG4gICAgcmV0dXJuIG1hdGNoZWRSdWxlO1xyXG4gIH0pICE9PSB1bmRlZmluZWQ7XHJcbiAgY29uc3Qgb3B0aW9uYWxNb2RzID0gaW5jbHVkZWRNb2RJZHMuZmlsdGVyKGlzT3B0aW9uYWwpO1xyXG4gIGlmIChvcHRpb25hbE1vZHMubGVuZ3RoID4gMCB8fCBkaWZmLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgdGhyb3cgbmV3IE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yKGRpZmYgfHwgW10sXHJcbiAgICAgIG9wdGlvbmFsTW9kcyB8fCBbXSwgdXRpbC5yZW5kZXJNb2ROYW1lKGNvbGxlY3Rpb24pKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRTY3JpcHRNZXJnZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkTW9kSWRzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoYXBpLCBwcm9maWxlSWQsIHRydWUpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBleHBvcnRNZXJnZWREYXRhID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdGVtcFBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSk7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGVtcFBhdGgpO1xyXG4gICAgICBhd2FpdCBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnZXhwb3J0JywgdGVtcFBhdGgpO1xyXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcHJlcGFyZUZpbGVEYXRhKHRlbXBQYXRoKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShkYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcXVlcnlTY3JpcHRNZXJnZXMoYXBpLCBpbmNsdWRlZE1vZElkcywgY29sbGVjdGlvbik7XHJcbiAgICByZXR1cm4gZXhwb3J0TWVyZ2VkRGF0YSgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yKSB7XHJcbiAgICAgIGNvbnN0IHZpb2xhdGlvbkVycm9yID0gKGVyciBhcyBNZXJnZURhdGFWaW9sYXRpb25FcnJvcik7XHJcbiAgICAgIGNvbnN0IG9wdGlvbmFsID0gdmlvbGF0aW9uRXJyb3IuT3B0aW9uYWw7XHJcbiAgICAgIGNvbnN0IG5vdEluY2x1ZGVkID0gdmlvbGF0aW9uRXJyb3IuTm90SW5jbHVkZWQ7XHJcbiAgICAgIGNvbnN0IG9wdGlvbmFsU2VnbWVudCA9IChvcHRpb25hbC5sZW5ndGggPiAwKVxyXG4gICAgICAgID8gJ01hcmtlZCBhcyBcIm9wdGlvbmFsXCIgYnV0IG5lZWQgdG8gYmUgbWFya2VkIFwicmVxdWlyZWRcIjp7e2JyfX1bbGlzdF0nXHJcbiAgICAgICAgICArIG9wdGlvbmFsLm1hcChvcHQgPT4gYFsqXSR7b3B0fWApICsgJ1svbGlzdF17e2JyfX0nXHJcbiAgICAgICAgOiAnJztcclxuICAgICAgY29uc3Qgbm90SW5jbHVkZWRTZWdtZW50ID0gKG5vdEluY2x1ZGVkLmxlbmd0aCA+IDApXHJcbiAgICAgICAgPyAnTm8gbG9uZ2VyIHBhcnQgb2YgdGhlIGNvbGxlY3Rpb24gYW5kIG5lZWQgdG8gYmUgcmUtYWRkZWQ6e3ticn19W2xpc3RdJ1xyXG4gICAgICAgICAgKyBub3RJbmNsdWRlZC5tYXAobmkgPT4gYFsqXSR7bml9YCkgKyAnWy9saXN0XXt7YnJ9fSdcclxuICAgICAgICA6ICcnO1xyXG4gICAgICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1BvdGVudGlhbCBtZXJnZWQgZGF0YSBtaXNtYXRjaCcsIHtcclxuICAgICAgICBiYmNvZGU6ICdZb3VyIGNvbGxlY3Rpb24gaW5jbHVkZXMgYSBzY3JpcHQgbWVyZ2UgdGhhdCBpcyByZWZlcmVuY2luZyBtb2RzICdcclxuICAgICAgICAgICsgYHRoYXQgYXJlLi4ue3tibH19ICR7bm90SW5jbHVkZWRTZWdtZW50fSR7b3B0aW9uYWxTZWdtZW50fWBcclxuICAgICAgICAgICsgJ0ZvciB0aGUgY29sbGVjdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkgeW91IHdpbGwgbmVlZCB0byBhZGRyZXNzIHRoZSAnXHJcbiAgICAgICAgICArICdhYm92ZSBvciByZS1ydW4gdGhlIFNjcmlwdCBNZXJnZXIgdG8gcmVtb3ZlIHRyYWNlcyBvZiBtZXJnZXMgcmVmZXJlbmNpbmcgJ1xyXG4gICAgICAgICAgKyAndGhlc2UgbW9kcy4gUGxlYXNlLCBkbyBvbmx5IHByb2NlZWQgdG8gdXBsb2FkIHRoZSBjb2xsZWN0aW9uL3JldmlzaW9uIGFzICdcclxuICAgICAgICAgICsgJ2lzIGlmIHlvdSBpbnRlbmQgdG8gdXBsb2FkIHRoZSBzY3JpcHQgbWVyZ2UgYXMgaXMgYW5kIGlmIHRoZSByZWZlcmVuY2UgZm9yICdcclxuICAgICAgICAgICsgJ3RoZSBtZXJnZSB3aWxsIGUuZy4gYmUgYWNxdWlyZWQgZnJvbSBhbiBleHRlcm5hbCBzb3VyY2UgYXMgcGFydCBvZiB0aGUgY29sbGVjdGlvbi4nLFxyXG4gICAgICAgIHBhcmFtZXRlcnM6IHsgYnI6ICdbYnJdWy9icl0nLCBibDogJ1ticl1bL2JyXVticl1bL2JyXScgfSxcclxuICAgICAgfSwgW1xyXG4gICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgICAgeyBsYWJlbDogJ1VwbG9hZCBDb2xsZWN0aW9uJyB9XHJcbiAgICAgIF0pLnRoZW4ocmVzID0+IChyZXMuYWN0aW9uID09PSAnQ2FuY2VsJylcclxuICAgICAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICA6IGV4cG9ydE1lcmdlZERhdGEoKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRTY3JpcHRNZXJnZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVEYXRhOiBCdWZmZXIpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhhcGksIHByb2ZpbGVJZCwgdHJ1ZSk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgcmVzID0gYXdhaXQgYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NjcmlwdCBNZXJnZXMgSW1wb3J0Jywge1xyXG4gICAgdGV4dDogJ1RoZSBjb2xsZWN0aW9uIHlvdSBhcmUgaW1wb3J0aW5nIGNvbnRhaW5zIHNjcmlwdCBtZXJnZXMgd2hpY2ggdGhlIGNyZWF0b3Igb2YgJ1xyXG4gICAgICAgICsgJ3RoZSBjb2xsZWN0aW9uIGRlZW1lZCBuZWNlc3NhcnkgZm9yIHRoZSBtb2RzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS4gUGxlYXNlIG5vdGUgdGhhdCAnXHJcbiAgICAgICAgKyAnaW1wb3J0aW5nIHRoZXNlIHdpbGwgb3ZlcndyaXRlIGFueSBleGlzdGluZyBzY3JpcHQgbWVyZ2VzIHlvdSBtYXkgaGF2ZSBlZmZlY3R1YXRlZC4gJ1xyXG4gICAgICAgICsgJ1BsZWFzZSBlbnN1cmUgdG8gYmFjayB1cCBhbnkgZXhpc3RpbmcgbWVyZ2VzIChpZiBhcHBsaWNhYmxlL3JlcXVpcmVkKSBiZWZvcmUgJ1xyXG4gICAgICAgICsgJ3Byb2NlZWRpbmcuJyxcclxuICB9LFxyXG4gIFtcclxuICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICB7IGxhYmVsOiAnSW1wb3J0IE1lcmdlcycgfSxcclxuICBdLCAnaW1wb3J0LXczLXNjcmlwdC1tZXJnZXMtd2FybmluZycpO1xyXG5cclxuICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSk7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpKTtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGVtcFBhdGgpO1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YSwgdGVtcFBhdGgpO1xyXG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcsIHRlbXBQYXRoKTtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgbWVzc2FnZTogJ1NjcmlwdCBtZXJnZXMgaW1wb3J0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgaWQ6ICd3aXRjaGVyMy1zY3JpcHQtbWVyZ2VzLXN0YXR1cycsXHJcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGRhdGE7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlT25Db250ZXh0SW1wb3J0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29sbGVjdGlvbklkOiBzdHJpbmcpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBjb2xsZWN0aW9uTW9kID0gbW9kc1tjb2xsZWN0aW9uSWRdO1xyXG4gIGlmIChjb2xsZWN0aW9uTW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnZXJyb3InLCAnY29sbGVjdGlvbiBtb2QgaXMgbWlzc2luZycsIGNvbGxlY3Rpb25JZCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgY29sbGVjdGlvbk1vZC5pbnN0YWxsYXRpb25QYXRoLCAnY29sbGVjdGlvbi5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIGNvbnN0IHsgc2NyaXB0TWVyZ2VkRGF0YSB9ID0gY29sbGVjdGlvbi5tZXJnZWREYXRhO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlZERhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSB0aGUgc2NyaXB0IG1lcmdlciBpbnN0YWxsZWQgc3RyYWlnaHQgYXdheSFcclxuICAgICAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGF3YWl0IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGF3YWl0IGltcG9ydFNjcmlwdE1lcmdlcyhhcGksIHByb2ZpbGVJZCwgaGV4MkJ1ZmZlcihzY3JpcHRNZXJnZWREYXRhKSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkpIHtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBzY3JpcHQgbWVyZ2VzJywgZXJyKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19