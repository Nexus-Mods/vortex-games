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
function queryScriptMerges(context, includedModIds, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modTypes = vortex_api_1.selectors.modPathsForGame(state, common_1.GAME_ID);
        const deployment = yield util_2.getDeployment(context.api, includedModIds);
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
        const merged = yield mergeInventoryParsing_1.getNamesOfMergedMods(context);
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
function exportScriptMerges(context, profileId, includedModIds, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId, true);
        if (props === undefined) {
            return;
        }
        const exportMergedData = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, shortid_1.generate());
                yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
                yield handleMergedScripts(props, 'export', tempPath);
                const data = yield util_1.prepareFileData(tempPath);
                return Promise.resolve(data);
            }
            catch (err) {
                return Promise.reject(err);
            }
        });
        try {
            yield queryScriptMerges(context, includedModIds, collection);
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
                return context.api.showDialog('question', 'Potential merged data mismatch', {
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
            const data = yield util_1.restoreFileData(fileData, tempPath);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxvREFBdUI7QUFDdkIsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFFN0QscUNBQ2dGO0FBRWhGLHFDQUFtQztBQUVuQyw2Q0FBa0Y7QUFFbEYsbUVBQStEO0FBRS9ELGlEQUF3RTtBQUV4RSxpQ0FBdUM7QUFhdkMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFFdEUsU0FBUyxZQUFZLENBQUMsT0FBZ0MsRUFDaEMsU0FBaUIsRUFBRSxLQUFlOztJQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFtQixzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEUsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRTtRQUMvQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sa0JBQWtCLEdBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3JFLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUs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Q0FBQyxhQUFhLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUMzSSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7WUFDbkQsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUU7Z0JBRWxDLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN6QyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3pGLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO29CQUNsQyxNQUFNLG1DQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNyQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sa0JBQWtCLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxpQkFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQzthQUM1RTtTQUNGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzFFO0lBQ0gsQ0FBQztDQUFBO0FBM0JELGtEQTJCQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNULFxyXG4gIFNDUklQVF9NRVJHRVJfSUQsIFczX1RFTVBfREFUQV9ESVIsIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgZ2VuZXJhdGUgfSBmcm9tICdzaG9ydGlkJztcclxuXHJcbmltcG9ydCB7IGhleDJCdWZmZXIsIHByZXBhcmVGaWxlRGF0YSwgcmVzdG9yZUZpbGVEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy91dGlsJztcclxuXHJcbmltcG9ydCB7IGdldE5hbWVzT2ZNZXJnZWRNb2RzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZSwgZG93bmxvYWRTY3JpcHRNZXJnZXIgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XHJcblxyXG5pbXBvcnQgeyBnZXREZXBsb3ltZW50IH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCB7IElEZXBsb3llZEZpbGUsIElEZXBsb3ltZW50IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG50eXBlIE9wVHlwZSA9ICdpbXBvcnQnIHwgJ2V4cG9ydCc7XHJcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcclxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcclxuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcclxuICBzY3JpcHRNZXJnZXJUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2w7XHJcbiAgZ2FtZVBhdGg6IHN0cmluZztcclxufVxyXG5cclxuY29uc3Qgc29ydEluYyA9IChsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpID0+IGxocy5sZW5ndGggLSByaHMubGVuZ3RoO1xyXG5jb25zdCBzb3J0RGVjID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gcmhzLmxlbmd0aCAtIGxocy5sZW5ndGg7XHJcblxyXG5mdW5jdGlvbiBnZW5CYXNlUHJvcHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZywgZm9yY2U/OiBib29sZWFuKTogSUJhc2VQcm9wcyB7XHJcbiAgaWYgKCFwcm9maWxlSWQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9jYWxNZXJnZWRTY3JpcHRzOiBib29sZWFuID0gKGZvcmNlKSA/IHRydWUgOiB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBwcm9maWxlSWQsICdmZWF0dXJlcycsICdsb2NhbF9tZXJnZXMnXSwgZmFsc2UpO1xyXG4gIGlmICghbG9jYWxNZXJnZWRTY3JpcHRzKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZGlzY292ZXJ5Py50b29scz8uW1NDUklQVF9NRVJHRVJfSURdO1xyXG4gIGlmICghc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgLy8gUmVnYXJkbGVzcyBvZiB0aGUgdXNlcidzIHByb2ZpbGUgc2V0dGluZ3MgLSB0aGVyZSdzIG5vIHBvaW50IGluIGJhY2tpbmcgdXBcclxuICAgIC8vICB0aGUgbWVyZ2VzIGlmIHdlIGRvbid0IGtub3cgd2hlcmUgdGhlIHNjcmlwdCBtZXJnZXIgaXMhXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgYXBpOiBjb250ZXh0LmFwaSwgc3RhdGUsIHByb2ZpbGUsIHNjcmlwdE1lcmdlclRvb2wsIGdhbWVQYXRoOiBkaXNjb3ZlcnkucGF0aCB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRGaWxlRW50cmllcyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGxldCBmaWxlczogc3RyaW5nW10gPSBbXTtcclxuICByZXR1cm4gdHVyYm93YWxrKGZpbGVQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgIGNvbnN0IHZhbGlkRW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGVudHJ5ID0+IGVudHJ5LmZpbGVQYXRoKTtcclxuICAgIGZpbGVzID0gZmlsZXMuY29uY2F0KHZhbGlkRW50cmllcyk7XHJcbiAgfSwgeyByZWN1cnNlOiB0cnVlIH0pXHJcbiAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZmlsZXMpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbW92ZUZpbGUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGZyb20sIGZpbGVOYW1lKTtcclxuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHRvLCBmaWxlTmFtZSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGNvcHlGaWxlKHNyYywgZGVzdCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBJdCdzIHBlcmZlY3RseSBwb3NzaWJsZSBmb3IgdGhlIHVzZXIgbm90IHRvIGhhdmUgYW55IG1lcmdlcyB5ZXQuXHJcbiAgICByZXR1cm4gKGVyci5jb2RlICE9PSAnRU5PRU5UJylcclxuICAgICAgPyBQcm9taXNlLnJlamVjdChlcnIpXHJcbiAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZW1vdmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcclxuICBpZiAocGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gJycpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNvcHlGaWxlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpO1xyXG4gICAgYXdhaXQgcmVtb3ZlRmlsZShkZXN0KTtcclxuICAgIGF3YWl0IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBtb3ZlRmlsZXMoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZywgcHJvcHM6IElCYXNlUHJvcHMpIHtcclxuICBjb25zdCB0ID0gcHJvcHMuYXBpLnRyYW5zbGF0ZTtcclxuICBjb25zdCByZW1vdmVEZXN0RmlsZXMgPSBhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBkZXN0RmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoZGVzdCk7XHJcbiAgICAgIGRlc3RGaWxlcy5zb3J0KHNvcnREZWMpO1xyXG4gICAgICBmb3IgKGNvbnN0IGRlc3RGaWxlIG9mIGRlc3RGaWxlcykge1xyXG4gICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3RGaWxlKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gcmVzdG9yZSBtZXJnZWQgZmlsZXMnLCB7XHJcbiAgICAgICAgICBiYmNvZGU6IHQoJ1ZvcnRleCBlbmNvdW50ZXJlZCBhIHBlcm1pc3Npb25zIHJlbGF0ZWQgZXJyb3Igd2hpbGUgYXR0ZW1wdGluZyAnXHJcbiAgICAgICAgICAgICsgJ3RvIHJlcGxhY2U6e3tibH19XCJ7e2ZpbGVQYXRofX1cInt7Ymx9fSdcclxuICAgICAgICAgICAgKyAnUGxlYXNlIHRyeSB0byByZXNvbHZlIGFueSBwZXJtaXNzaW9ucyByZWxhdGVkIGlzc3VlcyBhbmQgcmV0dXJuIHRvIHRoaXMgJ1xyXG4gICAgICAgICAgICArICdkaWFsb2cgd2hlbiB5b3UgdGhpbmsgeW91IG1hbmFnZWQgdG8gZml4IGl0LiBUaGVyZSBhcmUgYSBjb3VwbGUgb2YgdGhpbmdzICdcclxuICAgICAgICAgICAgKyAneW91IGNhbiB0cnkgdG8gZml4IHRoaXM6W2JyXVsvYnJdW2xpc3RdWypdIENsb3NlL0Rpc2FibGUgYW55IGFwcGxpY2F0aW9ucyB0aGF0IG1heSAnXHJcbiAgICAgICAgICAgICsgJ2ludGVyZmVyZSB3aXRoIFZvcnRleFxcJ3Mgb3BlcmF0aW9ucyBzdWNoIGFzIHRoZSBnYW1lIGl0c2VsZiwgdGhlIHdpdGNoZXIgc2NyaXB0IG1lcmdlciwgJ1xyXG4gICAgICAgICAgICArICdhbnkgZXh0ZXJuYWwgbW9kZGluZyB0b29scywgYW55IGFudGktdmlydXMgc29mdHdhcmUuICdcclxuICAgICAgICAgICAgKyAnWypdIEVuc3VyZSB0aGF0IHlvdXIgV2luZG93cyB1c2VyIGFjY291bnQgaGFzIGZ1bGwgcmVhZC93cml0ZSBwZXJtaXNzaW9ucyB0byB0aGUgZmlsZSBzcGVjaWZpZWQgJ1xyXG4gICAgICAgICAgICArICdbL2xpc3RdJywgeyByZXBsYWNlOiB7IGZpbGVQYXRoOiBlcnIucGF0aCwgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nIH0gfSksXHJcbiAgICAgICAgfSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcclxuICAgICAgICAgIHsgbGFiZWw6ICdUcnkgQWdhaW4nLCBhY3Rpb246ICgpID0+IHJlbW92ZURlc3RGaWxlcygpIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGNsZWFuIHVwIHRoZSBkZXN0aW5hdGlvbiBmb2xkZXIgLSB3ZSBjYW4ndFxyXG4gICAgICAgIC8vICBjb250aW51ZS5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKGVyci5tZXNzYWdlKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBhd2FpdCByZW1vdmVEZXN0RmlsZXMoKTtcclxuICBjb25zdCBjb3BpZWQ6IHN0cmluZ1tdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNyY0ZpbGVzOiBzdHJpbmdbXSA9IGF3YWl0IGdldEZpbGVFbnRyaWVzKHNyYyk7XHJcbiAgICBzcmNGaWxlcy5zb3J0KHNvcnRJbmMpO1xyXG4gICAgZm9yIChjb25zdCBzcmNGaWxlIG9mIHNyY0ZpbGVzKSB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKHNyYywgc3JjRmlsZSk7XHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oZGVzdCwgcmVsUGF0aCk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgY29weUZpbGUoc3JjRmlsZSwgdGFyZ2V0UGF0aCk7XHJcbiAgICAgICAgY29waWVkLnB1c2godGFyZ2V0UGF0aCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIG1vdmUgZmlsZScsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiAoY2xlYW5VcCkge1xyXG4gICAgLy8gICAvLyBXZSBtYW5hZ2VkIHRvIGNvcHkgYWxsIHRoZSBmaWxlcywgY2xlYW4gdXAgdGhlIHNvdXJjZVxyXG4gICAgLy8gICBzcmNGaWxlcy5zb3J0KHNvcnREZWMpO1xyXG4gICAgLy8gICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcclxuICAgIC8vICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhzcmNGaWxlKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKCEhZXJyLnBhdGggJiYgIWVyci5wYXRoLmluY2x1ZGVzKGRlc3QpKSB7XHJcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgc291cmNlXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSBmYWlsZWQgdG8gY29weSAtIGNsZWFuIHVwLlxyXG4gICAgY29waWVkLnNvcnQoc29ydERlYyk7XHJcbiAgICBmb3IgKGNvbnN0IGxpbmsgb2YgY29waWVkKSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxpbmspO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wczogSUJhc2VQcm9wcywgb3BUeXBlOiBPcFR5cGUsIGRlc3Q/OiBzdHJpbmcpIHtcclxuICBjb25zdCB7IHNjcmlwdE1lcmdlclRvb2wsIHByb2ZpbGUsIGdhbWVQYXRoIH0gPSBwcm9wcztcclxuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Ob3RGb3VuZCgnU2NyaXB0IG1lcmdpbmcgdG9vbCBwYXRoJykpO1xyXG4gIH1cclxuICBpZiAoIXByb2ZpbGU/LmlkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuQXJndW1lbnRJbnZhbGlkKCdpbnZhbGlkIHByb2ZpbGUnKSk7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbWVyZ2VyVG9vbERpciA9IHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXJUb29sLnBhdGgpO1xyXG4gICAgY29uc3QgcHJvZmlsZVBhdGg6IHN0cmluZyA9IChkZXN0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgID8gcGF0aC5qb2luKG1lcmdlclRvb2xEaXIsIHByb2ZpbGUuaWQpXHJcbiAgICAgIDogZGVzdDtcclxuICAgIGNvbnN0IGxvYXJPcmRlckZpbGVwYXRoOiBzdHJpbmcgPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgY29uc3QgbWVyZ2VkTW9kTmFtZSA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWUobWVyZ2VyVG9vbERpcik7XHJcbiAgICBjb25zdCBtZXJnZWRTY3JpcHRzUGF0aCA9IHBhdGguam9pbihnYW1lUGF0aCwgJ01vZHMnLCBtZXJnZWRNb2ROYW1lKTtcclxuXHJcbiAgICAvLyBKdXN0IGluIGNhc2UgaXQncyBtaXNzaW5nLlxyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtZXJnZWRTY3JpcHRzUGF0aCk7XHJcblxyXG4gICAgaWYgKG9wVHlwZSA9PT0gJ2V4cG9ydCcpIHtcclxuICAgICAgYXdhaXQgbW92ZUZpbGUobWVyZ2VyVG9vbERpciwgcHJvZmlsZVBhdGgsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHByb2ZpbGVQYXRoLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlcyhtZXJnZWRTY3JpcHRzUGF0aCwgcGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgcHJvcHMpO1xyXG4gICAgfSBlbHNlIGlmIChvcFR5cGUgPT09ICdpbXBvcnQnKSB7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBtZXJnZXJUb29sRGlyLCBNRVJHRV9JTlZfTUFOSUZFU1QpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZShwcm9maWxlUGF0aCwgcGF0aC5kaXJuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSwgcGF0aC5iYXNlbmFtZShsb2FyT3JkZXJGaWxlcGF0aCkpO1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZXMocGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgbWVyZ2VkU2NyaXB0c1BhdGgsIHByb3BzKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHN0b3JlL3Jlc3RvcmUgbWVyZ2VkIHNjcmlwdHMnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVUb1Byb2ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZXMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZElkczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RUeXBlczogeyBbdHlwZUlkOiBzdHJpbmddOiBzdHJpbmcgfSA9IHNlbGVjdG9ycy5tb2RQYXRoc0ZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGRlcGxveW1lbnQ6IElEZXBsb3ltZW50ID0gYXdhaXQgZ2V0RGVwbG95bWVudChjb250ZXh0LmFwaSwgaW5jbHVkZWRNb2RJZHMpO1xyXG4gIGNvbnN0IGRlcGxveWVkTmFtZXM6IHN0cmluZ1tdID0gT2JqZWN0LmtleXMobW9kVHlwZXMpLnJlZHVjZSgoYWNjdW0sIHR5cGVJZCkgPT4ge1xyXG4gICAgY29uc3QgbW9kUGF0aCA9IG1vZFR5cGVzW3R5cGVJZF07XHJcbiAgICBjb25zdCBmaWxlczogSURlcGxveWVkRmlsZVtdID0gZGVwbG95bWVudFt0eXBlSWRdO1xyXG4gICAgY29uc3QgaXNSb290TW9kID0gbW9kUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdtb2RzJykgPT09IC0xO1xyXG4gICAgY29uc3QgbmFtZXMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IG5hbWVTZWdtZW50cyA9IGZpbGUucmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgIGlmIChpc1Jvb3RNb2QpIHtcclxuICAgICAgICBjb25zdCBuYW1lSWR4ID0gbmFtZVNlZ21lbnRzLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpLmluZGV4T2YoJ21vZHMnKSArIDE7XHJcbiAgICAgICAgcmV0dXJuIChuYW1lSWR4ID4gMClcclxuICAgICAgICAgID8gbmFtZVNlZ21lbnRzW25hbWVJZHhdXHJcbiAgICAgICAgICA6IHVuZGVmaW5lZDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmFtZVNlZ21lbnRzWzBdO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGFjY3VtID0gYWNjdW0uY29uY2F0KG5hbWVzLmZpbHRlcihuYW1lID0+ICEhbmFtZSkpO1xyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIFtdKTtcclxuICBjb25zdCB1bmlxdWVEZXBsb3llZCA9IEFycmF5LmZyb20obmV3IFNldChkZXBsb3llZE5hbWVzKSk7XHJcbiAgY29uc3QgbWVyZ2VkID0gYXdhaXQgZ2V0TmFtZXNPZk1lcmdlZE1vZHMoY29udGV4dCk7XHJcbiAgY29uc3QgZGlmZiA9IF8uZGlmZmVyZW5jZShtZXJnZWQsIHVuaXF1ZURlcGxveWVkKTtcclxuICBjb25zdCBpc09wdGlvbmFsID0gKG1vZElkOiBzdHJpbmcpID0+IChjb2xsZWN0aW9uLnJ1bGVzID8/IFtdKS5maW5kKHJ1bGUgPT4ge1xyXG4gICAgY29uc3QgbW9kOiB0eXBlcy5JTW9kID0gbW9kc1ttb2RJZF07XHJcbiAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgICBjb25zdCB2YWxpZFR5cGUgPSBbJ3JlY29tbWVuZHMnXS5pbmNsdWRlcyhydWxlLnR5cGUpO1xyXG4gICAgaWYgKCF2YWxpZFR5cGUpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbWF0Y2hlZFJ1bGUgPSB1dGlsLnRlc3RNb2RSZWZlcmVuY2UobW9kLCBydWxlLnJlZmVyZW5jZSk7XHJcbiAgICByZXR1cm4gbWF0Y2hlZFJ1bGU7XHJcbiAgfSkgIT09IHVuZGVmaW5lZDtcclxuICBjb25zdCBvcHRpb25hbE1vZHMgPSBpbmNsdWRlZE1vZElkcy5maWx0ZXIoaXNPcHRpb25hbCk7XHJcbiAgaWYgKG9wdGlvbmFsTW9kcy5sZW5ndGggPiAwIHx8IGRpZmYubGVuZ3RoICE9PSAwKSB7XHJcbiAgICB0aHJvdyBuZXcgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IoZGlmZiB8fCBbXSxcclxuICAgICAgb3B0aW9uYWxNb2RzIHx8IFtdLCB1dGlsLnJlbmRlck1vZE5hbWUoY29sbGVjdGlvbikpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZElkczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdHlwZXMuSU1vZCkge1xyXG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCwgdHJ1ZSk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGV4cG9ydE1lcmdlZERhdGEgPSBhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpKTtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyh0ZW1wUGF0aCk7XHJcbiAgICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnLCB0ZW1wUGF0aCk7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBwcmVwYXJlRmlsZURhdGEodGVtcFBhdGgpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHF1ZXJ5U2NyaXB0TWVyZ2VzKGNvbnRleHQsIGluY2x1ZGVkTW9kSWRzLCBjb2xsZWN0aW9uKTtcclxuICAgIHJldHVybiBleHBvcnRNZXJnZWREYXRhKCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IpIHtcclxuICAgICAgY29uc3QgdmlvbGF0aW9uRXJyb3IgPSAoZXJyIGFzIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yKTtcclxuICAgICAgY29uc3Qgb3B0aW9uYWwgPSB2aW9sYXRpb25FcnJvci5PcHRpb25hbDtcclxuICAgICAgY29uc3Qgbm90SW5jbHVkZWQgPSB2aW9sYXRpb25FcnJvci5Ob3RJbmNsdWRlZDtcclxuICAgICAgY29uc3Qgb3B0aW9uYWxTZWdtZW50ID0gKG9wdGlvbmFsLmxlbmd0aCA+IDApXHJcbiAgICAgICAgPyAnTWFya2VkIGFzIFwib3B0aW9uYWxcIiBidXQgbmVlZCB0byBiZSBtYXJrZWQgXCJyZXF1aXJlZFwiOnt7YnJ9fVtsaXN0XSdcclxuICAgICAgICAgICsgb3B0aW9uYWwubWFwKG9wdCA9PiBgWypdJHtvcHR9YCkgKyAnWy9saXN0XXt7YnJ9fSdcclxuICAgICAgICA6ICcnO1xyXG4gICAgICBjb25zdCBub3RJbmNsdWRlZFNlZ21lbnQgPSAobm90SW5jbHVkZWQubGVuZ3RoID4gMClcclxuICAgICAgICA/ICdObyBsb25nZXIgcGFydCBvZiB0aGUgY29sbGVjdGlvbiBhbmQgbmVlZCB0byBiZSByZS1hZGRlZDp7e2JyfX1bbGlzdF0nXHJcbiAgICAgICAgICArIG5vdEluY2x1ZGVkLm1hcChuaSA9PiBgWypdJHtuaX1gKSArICdbL2xpc3Rde3ticn19J1xyXG4gICAgICAgIDogJyc7XHJcbiAgICAgIHJldHVybiBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdQb3RlbnRpYWwgbWVyZ2VkIGRhdGEgbWlzbWF0Y2gnLCB7XHJcbiAgICAgICAgYmJjb2RlOiAnWW91ciBjb2xsZWN0aW9uIGluY2x1ZGVzIGEgc2NyaXB0IG1lcmdlIHRoYXQgaXMgcmVmZXJlbmNpbmcgbW9kcyAnXHJcbiAgICAgICAgICArIGB0aGF0IGFyZS4uLnt7Ymx9fSAke25vdEluY2x1ZGVkU2VnbWVudH0ke29wdGlvbmFsU2VnbWVudH1gXHJcbiAgICAgICAgICArICdGb3IgdGhlIGNvbGxlY3Rpb24gdG8gZnVuY3Rpb24gY29ycmVjdGx5IHlvdSB3aWxsIG5lZWQgdG8gYWRkcmVzcyB0aGUgJ1xyXG4gICAgICAgICAgKyAnYWJvdmUgb3IgcmUtcnVuIHRoZSBTY3JpcHQgTWVyZ2VyIHRvIHJlbW92ZSB0cmFjZXMgb2YgbWVyZ2VzIHJlZmVyZW5jaW5nICdcclxuICAgICAgICAgICsgJ3RoZXNlIG1vZHMuIFBsZWFzZSwgZG8gb25seSBwcm9jZWVkIHRvIHVwbG9hZCB0aGUgY29sbGVjdGlvbi9yZXZpc2lvbiBhcyAnXHJcbiAgICAgICAgICArICdpcyBpZiB5b3UgaW50ZW5kIHRvIHVwbG9hZCB0aGUgc2NyaXB0IG1lcmdlIGFzIGlzIGFuZCBpZiB0aGUgcmVmZXJlbmNlIGZvciAnXHJcbiAgICAgICAgICArICd0aGUgbWVyZ2Ugd2lsbCBlLmcuIGJlIGFjcXVpcmVkIGZyb20gYW4gZXh0ZXJuYWwgc291cmNlIGFzIHBhcnQgb2YgdGhlIGNvbGxlY3Rpb24uJyxcclxuICAgICAgICBwYXJhbWV0ZXJzOiB7IGJyOiAnW2JyXVsvYnJdJywgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nIH0sXHJcbiAgICAgIH0sIFtcclxuICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxyXG4gICAgICAgIHsgbGFiZWw6ICdVcGxvYWQgQ29sbGVjdGlvbicgfVxyXG4gICAgICBdKS50aGVuKHJlcyA9PiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpXHJcbiAgICAgICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgOiBleHBvcnRNZXJnZWREYXRhKCkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVEYXRhOiBCdWZmZXIpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQsIHRydWUpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NjcmlwdCBNZXJnZXMgSW1wb3J0Jywge1xyXG4gICAgdGV4dDogJ1RoZSBjb2xsZWN0aW9uIHlvdSBhcmUgaW1wb3J0aW5nIGNvbnRhaW5zIHNjcmlwdCBtZXJnZXMgd2hpY2ggdGhlIGNyZWF0b3Igb2YgJ1xyXG4gICAgICAgICsgJ3RoZSBjb2xsZWN0aW9uIGRlZW1lZCBuZWNlc3NhcnkgZm9yIHRoZSBtb2RzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS4gUGxlYXNlIG5vdGUgdGhhdCAnXHJcbiAgICAgICAgKyAnaW1wb3J0aW5nIHRoZXNlIHdpbGwgb3ZlcndyaXRlIGFueSBleGlzdGluZyBzY3JpcHQgbWVyZ2VzIHlvdSBtYXkgaGF2ZSBlZmZlY3R1YXRlZC4gJ1xyXG4gICAgICAgICsgJ1BsZWFzZSBlbnN1cmUgdG8gYmFjayB1cCBhbnkgZXhpc3RpbmcgbWVyZ2VzIChpZiBhcHBsaWNhYmxlL3JlcXVpcmVkKSBiZWZvcmUgJ1xyXG4gICAgICAgICsgJ3Byb2NlZWRpbmcuJyxcclxuICB9LFxyXG4gIFtcclxuICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICB7IGxhYmVsOiAnSW1wb3J0IE1lcmdlcycgfSxcclxuICBdLCAnaW1wb3J0LXczLXNjcmlwdC1tZXJnZXMtd2FybmluZycpO1xyXG5cclxuICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSk7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpKTtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGVtcFBhdGgpO1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YSwgdGVtcFBhdGgpO1xyXG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcsIHRlbXBQYXRoKTtcclxuICAgIGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBtZXNzYWdlOiAnU2NyaXB0IG1lcmdlcyBpbXBvcnRlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICBpZDogJ3dpdGNoZXIzLXNjcmlwdC1tZXJnZXMtc3RhdHVzJyxcclxuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1ha2VPbkNvbnRleHRJbXBvcnQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIGNvbGxlY3Rpb25JZDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBjb2xsZWN0aW9uTW9kID0gbW9kc1tjb2xsZWN0aW9uSWRdO1xyXG4gIGlmIChjb2xsZWN0aW9uTW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnZXJyb3InLCAnY29sbGVjdGlvbiBtb2QgaXMgbWlzc2luZycsIGNvbGxlY3Rpb25JZCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgY29sbGVjdGlvbk1vZC5pbnN0YWxsYXRpb25QYXRoLCAnY29sbGVjdGlvbi5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIGNvbnN0IHsgc2NyaXB0TWVyZ2VkRGF0YSB9ID0gY29sbGVjdGlvbi5tZXJnZWREYXRhO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlZERhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSB0aGUgc2NyaXB0IG1lcmdlciBpbnN0YWxsZWQgc3RyYWlnaHQgYXdheSFcclxuICAgICAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGF3YWl0IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGNvbnRleHQpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICBhd2FpdCBpbXBvcnRTY3JpcHRNZXJnZXMoY29udGV4dCwgcHJvZmlsZUlkLCBoZXgyQnVmZmVyKHNjcmlwdE1lcmdlZERhdGEpKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBzY3JpcHQgbWVyZ2VzJywgZXJyKTtcclxuICB9XHJcbn1cclxuIl19