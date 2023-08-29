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
function storeToProfile(context, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId);
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
function restoreFromProfile(context, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(context, profileId);
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
function queryScriptMerges(context, includedModIds, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modTypes = vortex_api_1.selectors.modPathsForGame(state, common_1.GAME_ID);
        const deployment = yield (0, util_2.getDeployment)(context.api, includedModIds);
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
        const merged = yield (0, mergeInventoryParsing_1.getNamesOfMergedMods)(context);
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
            const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)());
            yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
            const data = yield (0, util_1.restoreFileData)(fileData, tempPath);
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
                    yield (0, scriptmerger_1.downloadScriptMerger)(context);
                }
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
                yield importScriptMerges(context, profileId, (0, util_1.hex2Buffer)(scriptMergedData));
            }
        }
        catch (err) {
            if (!(err instanceof vortex_api_1.util.UserCanceled)) {
                context.api.showErrorNotification('Failed to import script merges', err);
            }
        }
    });
}
exports.makeOnContextImport = makeOnContextImport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxvREFBdUI7QUFDdkIsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFFN0QscUNBQ2dGO0FBRWhGLHFDQUFtQztBQUVuQyw2Q0FBa0Y7QUFFbEYsbUVBQStEO0FBRS9ELGlEQUF3RTtBQUV4RSxpQ0FBdUM7QUFhdkMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFFdEUsU0FBUyxZQUFZLENBQUMsT0FBZ0MsRUFDaEMsU0FBaUIsRUFBRSxLQUFlOztJQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFtQixzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEUsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRTtRQUMvQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sa0JBQWtCLEdBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3JFLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUs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QUFVLENBQUMsVUFBVSxDQUFDO1lBQ25ELElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO2dCQUVsQyxNQUFNLGdCQUFnQixHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDekMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN6RixJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRTtvQkFDbEMsTUFBTSxJQUFBLG1DQUFvQixFQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNyQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sa0JBQWtCLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFBLGlCQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2FBQzVFO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUksQ0FBQyxDQUFDLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQzFFO1NBQ0Y7SUFDSCxDQUFDO0NBQUE7QUE3QkQsa0RBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBNRVJHRV9JTlZfTUFOSUZFU1QsXG4gIFNDUklQVF9NRVJHRVJfSUQsIFczX1RFTVBfREFUQV9ESVIsIE1lcmdlRGF0YVZpb2xhdGlvbkVycm9yIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xuXG5pbXBvcnQgeyBoZXgyQnVmZmVyLCBwcmVwYXJlRmlsZURhdGEsIHJlc3RvcmVGaWxlRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdXRpbCc7XG5cbmltcG9ydCB7IGdldE5hbWVzT2ZNZXJnZWRNb2RzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xuXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lLCBkb3dubG9hZFNjcmlwdE1lcmdlciB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcblxuaW1wb3J0IHsgZ2V0RGVwbG95bWVudCB9IGZyb20gJy4vdXRpbCc7XG5cbmltcG9ydCB7IElEZXBsb3llZEZpbGUsIElEZXBsb3ltZW50IH0gZnJvbSAnLi90eXBlcyc7XG5cbnR5cGUgT3BUeXBlID0gJ2ltcG9ydCcgfCAnZXhwb3J0JztcbmludGVyZmFjZSBJQmFzZVByb3BzIHtcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcbiAgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sO1xuICBnYW1lUGF0aDogc3RyaW5nO1xufVxuXG5jb25zdCBzb3J0SW5jID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gbGhzLmxlbmd0aCAtIHJocy5sZW5ndGg7XG5jb25zdCBzb3J0RGVjID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gcmhzLmxlbmd0aCAtIGxocy5sZW5ndGg7XG5cbmZ1bmN0aW9uIGdlbkJhc2VQcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ6IHN0cmluZywgZm9yY2U/OiBib29sZWFuKTogSUJhc2VQcm9wcyB7XG4gIGlmICghcHJvZmlsZUlkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsTWVyZ2VkU2NyaXB0czogYm9vbGVhbiA9IChmb3JjZSkgPyB0cnVlIDogdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZCwgJ2ZlYXR1cmVzJywgJ2xvY2FsX21lcmdlcyddLCBmYWxzZSk7XG4gIGlmICghbG9jYWxNZXJnZWRTY3JpcHRzKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZGlzY292ZXJ5Py50b29scz8uW1NDUklQVF9NRVJHRVJfSURdO1xuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcbiAgICAvLyBSZWdhcmRsZXNzIG9mIHRoZSB1c2VyJ3MgcHJvZmlsZSBzZXR0aW5ncyAtIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gYmFja2luZyB1cFxuICAgIC8vICB0aGUgbWVyZ2VzIGlmIHdlIGRvbid0IGtub3cgd2hlcmUgdGhlIHNjcmlwdCBtZXJnZXIgaXMhXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiB7IGFwaTogY29udGV4dC5hcGksIHN0YXRlLCBwcm9maWxlLCBzY3JpcHRNZXJnZXJUb29sLCBnYW1lUGF0aDogZGlzY292ZXJ5LnBhdGggfTtcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZUVudHJpZXMoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgbGV0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuICByZXR1cm4gdHVyYm93YWxrKGZpbGVQYXRoLCBlbnRyaWVzID0+IHtcbiAgICBjb25zdCB2YWxpZEVudHJpZXMgPSBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAhZW50cnkuaXNEaXJlY3RvcnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpO1xuICAgIGZpbGVzID0gZmlsZXMuY29uY2F0KHZhbGlkRW50cmllcyk7XG4gIH0sIHsgcmVjdXJzZTogdHJ1ZSB9KVxuICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxuICAgID8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICA6IFByb21pc2UucmVqZWN0KGVycikpXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlcykpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBtb3ZlRmlsZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGZyb20sIGZpbGVOYW1lKTtcbiAgY29uc3QgZGVzdCA9IHBhdGguam9pbih0bywgZmlsZU5hbWUpO1xuICB0cnkge1xuICAgIGF3YWl0IGNvcHlGaWxlKHNyYywgZGVzdCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIEl0J3MgcGVyZmVjdGx5IHBvc3NpYmxlIGZvciB0aGUgdXNlciBub3QgdG8gaGF2ZSBhbnkgbWVyZ2VzIHlldC5cbiAgICByZXR1cm4gKGVyci5jb2RlICE9PSAnRU5PRU5UJylcbiAgICAgID8gUHJvbWlzZS5yZWplY3QoZXJyKVxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiByZW1vdmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgaWYgKHBhdGguZXh0bmFtZShmaWxlUGF0aCkgPT09ICcnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjb3B5RmlsZShzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpO1xuICAgIGF3YWl0IHJlbW92ZUZpbGUoZGVzdCk7XG4gICAgYXdhaXQgZnMuY29weUFzeW5jKHNyYywgZGVzdCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1vdmVGaWxlcyhzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nLCBwcm9wczogSUJhc2VQcm9wcykge1xuICBjb25zdCB0ID0gcHJvcHMuYXBpLnRyYW5zbGF0ZTtcbiAgY29uc3QgcmVtb3ZlRGVzdEZpbGVzID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkZXN0RmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoZGVzdCk7XG4gICAgICBkZXN0RmlsZXMuc29ydChzb3J0RGVjKTtcbiAgICAgIGZvciAoY29uc3QgZGVzdEZpbGUgb2YgZGVzdEZpbGVzKSB7XG4gICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3RGaWxlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpKSB7XG4gICAgICAgIHJldHVybiBwcm9wcy5hcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHJlc3RvcmUgbWVyZ2VkIGZpbGVzJywge1xuICAgICAgICAgIGJiY29kZTogdCgnVm9ydGV4IGVuY291bnRlcmVkIGEgcGVybWlzc2lvbnMgcmVsYXRlZCBlcnJvciB3aGlsZSBhdHRlbXB0aW5nICdcbiAgICAgICAgICAgICsgJ3RvIHJlcGxhY2U6e3tibH19XCJ7e2ZpbGVQYXRofX1cInt7Ymx9fSdcbiAgICAgICAgICAgICsgJ1BsZWFzZSB0cnkgdG8gcmVzb2x2ZSBhbnkgcGVybWlzc2lvbnMgcmVsYXRlZCBpc3N1ZXMgYW5kIHJldHVybiB0byB0aGlzICdcbiAgICAgICAgICAgICsgJ2RpYWxvZyB3aGVuIHlvdSB0aGluayB5b3UgbWFuYWdlZCB0byBmaXggaXQuIFRoZXJlIGFyZSBhIGNvdXBsZSBvZiB0aGluZ3MgJ1xuICAgICAgICAgICAgKyAneW91IGNhbiB0cnkgdG8gZml4IHRoaXM6W2JyXVsvYnJdW2xpc3RdWypdIENsb3NlL0Rpc2FibGUgYW55IGFwcGxpY2F0aW9ucyB0aGF0IG1heSAnXG4gICAgICAgICAgICArICdpbnRlcmZlcmUgd2l0aCBWb3J0ZXhcXCdzIG9wZXJhdGlvbnMgc3VjaCBhcyB0aGUgZ2FtZSBpdHNlbGYsIHRoZSB3aXRjaGVyIHNjcmlwdCBtZXJnZXIsICdcbiAgICAgICAgICAgICsgJ2FueSBleHRlcm5hbCBtb2RkaW5nIHRvb2xzLCBhbnkgYW50aS12aXJ1cyBzb2Z0d2FyZS4gJ1xuICAgICAgICAgICAgKyAnWypdIEVuc3VyZSB0aGF0IHlvdXIgV2luZG93cyB1c2VyIGFjY291bnQgaGFzIGZ1bGwgcmVhZC93cml0ZSBwZXJtaXNzaW9ucyB0byB0aGUgZmlsZSBzcGVjaWZpZWQgJ1xuICAgICAgICAgICAgKyAnWy9saXN0XScsIHsgcmVwbGFjZTogeyBmaWxlUGF0aDogZXJyLnBhdGgsIGJsOiAnW2JyXVsvYnJdW2JyXVsvYnJdJyB9IH0pLFxuICAgICAgICB9LFxuICAgICAgICBbXG4gICAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKCkpIH0sXG4gICAgICAgICAgeyBsYWJlbDogJ1RyeSBBZ2FpbicsIGFjdGlvbjogKCkgPT4gcmVtb3ZlRGVzdEZpbGVzKCkgfSxcbiAgICAgICAgXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBmYWlsZWQgdG8gY2xlYW4gdXAgdGhlIGRlc3RpbmF0aW9uIGZvbGRlciAtIHdlIGNhbid0XG4gICAgICAgIC8vICBjb250aW51ZS5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZChlcnIubWVzc2FnZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBhd2FpdCByZW1vdmVEZXN0RmlsZXMoKTtcbiAgY29uc3QgY29waWVkOiBzdHJpbmdbXSA9IFtdO1xuICB0cnkge1xuICAgIGNvbnN0IHNyY0ZpbGVzOiBzdHJpbmdbXSA9IGF3YWl0IGdldEZpbGVFbnRyaWVzKHNyYyk7XG4gICAgc3JjRmlsZXMuc29ydChzb3J0SW5jKTtcbiAgICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKHNyYywgc3JjRmlsZSk7XG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGRlc3QsIHJlbFBhdGgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgY29weUZpbGUoc3JjRmlsZSwgdGFyZ2V0UGF0aCk7XG4gICAgICAgIGNvcGllZC5wdXNoKHRhcmdldFBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIG1vdmUgZmlsZScsIGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgKGNsZWFuVXApIHtcbiAgICAvLyAgIC8vIFdlIG1hbmFnZWQgdG8gY29weSBhbGwgdGhlIGZpbGVzLCBjbGVhbiB1cCB0aGUgc291cmNlXG4gICAgLy8gICBzcmNGaWxlcy5zb3J0KHNvcnREZWMpO1xuICAgIC8vICAgZm9yIChjb25zdCBzcmNGaWxlIG9mIHNyY0ZpbGVzKSB7XG4gICAgLy8gICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKHNyY0ZpbGUpO1xuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKCEhZXJyLnBhdGggJiYgIWVyci5wYXRoLmluY2x1ZGVzKGRlc3QpKSB7XG4gICAgICAvLyBXZSBmYWlsZWQgdG8gY2xlYW4gdXAgdGhlIHNvdXJjZVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdlIGZhaWxlZCB0byBjb3B5IC0gY2xlYW4gdXAuXG4gICAgY29waWVkLnNvcnQoc29ydERlYyk7XG4gICAgZm9yIChjb25zdCBsaW5rIG9mIGNvcGllZCkge1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobGluayk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhY2t1cFBhdGgocHJvZmlsZTogdHlwZXMuSVByb2ZpbGUpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndXNlckRhdGEnKSxcbiAgICBwcm9maWxlLmdhbWVJZCwgJ3Byb2ZpbGVzJywgcHJvZmlsZS5pZCwgJ2JhY2t1cCcpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzOiBJQmFzZVByb3BzLCBvcFR5cGU6IE9wVHlwZSwgZGVzdD86IHN0cmluZykge1xuICBjb25zdCB7IHNjcmlwdE1lcmdlclRvb2wsIHByb2ZpbGUsIGdhbWVQYXRoIH0gPSBwcm9wcztcbiAgaWYgKCFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLk5vdEZvdW5kKCdTY3JpcHQgbWVyZ2luZyB0b29sIHBhdGgnKSk7XG4gIH1cbiAgaWYgKCFwcm9maWxlPy5pZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Bcmd1bWVudEludmFsaWQoJ2ludmFsaWQgcHJvZmlsZScpKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgbWVyZ2VyVG9vbERpciA9IHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXJUb29sLnBhdGgpO1xuICAgIGNvbnN0IHByb2ZpbGVQYXRoOiBzdHJpbmcgPSAoZGVzdCA9PT0gdW5kZWZpbmVkKVxuICAgICAgPyBwYXRoLmpvaW4obWVyZ2VyVG9vbERpciwgcHJvZmlsZS5pZClcbiAgICAgIDogZGVzdDtcbiAgICBjb25zdCBsb2FyT3JkZXJGaWxlcGF0aDogc3RyaW5nID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcbiAgICBjb25zdCBtZXJnZWRNb2ROYW1lID0gYXdhaXQgZ2V0TWVyZ2VkTW9kTmFtZShtZXJnZXJUb29sRGlyKTtcbiAgICBjb25zdCBtZXJnZWRTY3JpcHRzUGF0aCA9IHBhdGguam9pbihnYW1lUGF0aCwgJ01vZHMnLCBtZXJnZWRNb2ROYW1lKTtcblxuICAgIC8vIEp1c3QgaW4gY2FzZSBpdCdzIG1pc3NpbmcuXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtZXJnZWRTY3JpcHRzUGF0aCk7XG5cbiAgICBpZiAob3BUeXBlID09PSAnZXhwb3J0Jykge1xuICAgICAgYXdhaXQgbW92ZUZpbGUobWVyZ2VyVG9vbERpciwgcHJvZmlsZVBhdGgsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XG4gICAgICBhd2FpdCBtb3ZlRmlsZShwYXRoLmRpcm5hbWUobG9hck9yZGVyRmlsZXBhdGgpLCBwcm9maWxlUGF0aCwgcGF0aC5iYXNlbmFtZShsb2FyT3JkZXJGaWxlcGF0aCkpO1xuICAgICAgYXdhaXQgbW92ZUZpbGVzKG1lcmdlZFNjcmlwdHNQYXRoLCBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsIG1lcmdlZE1vZE5hbWUpLCBwcm9wcyk7XG4gICAgfSBlbHNlIGlmIChvcFR5cGUgPT09ICdpbXBvcnQnKSB7XG4gICAgICBhd2FpdCBtb3ZlRmlsZShwcm9maWxlUGF0aCwgbWVyZ2VyVG9vbERpciwgTUVSR0VfSU5WX01BTklGRVNUKTtcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBwYXRoLmRpcm5hbWUobG9hck9yZGVyRmlsZXBhdGgpLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XG4gICAgICBhd2FpdCBtb3ZlRmlsZXMocGF0aC5qb2luKHByb2ZpbGVQYXRoLCBtZXJnZWRNb2ROYW1lKSwgbWVyZ2VkU2NyaXB0c1BhdGgsIHByb3BzKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBzdG9yZS9yZXN0b3JlIG1lcmdlZCBzY3JpcHRzJywgZXJyKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVUb1Byb2ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZDogc3RyaW5nKSB7XG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgYmFrUGF0aCA9IGJhY2t1cFBhdGgocHJvcHMucHJvZmlsZSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2V4cG9ydCcsIGJha1BhdGgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2V4cG9ydCcpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ6IHN0cmluZykge1xuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQpO1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGJha1BhdGggPSBiYWNrdXBQYXRoKHByb3BzLnByb2ZpbGUpO1xuICB0cnkge1xuICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdpbXBvcnQnLCBiYWtQYXRoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbiAgcmV0dXJuIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdpbXBvcnQnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkTW9kSWRzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RUeXBlczogeyBbdHlwZUlkOiBzdHJpbmddOiBzdHJpbmcgfSA9IHNlbGVjdG9ycy5tb2RQYXRoc0ZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBkZXBsb3ltZW50OiBJRGVwbG95bWVudCA9IGF3YWl0IGdldERlcGxveW1lbnQoY29udGV4dC5hcGksIGluY2x1ZGVkTW9kSWRzKTtcbiAgY29uc3QgZGVwbG95ZWROYW1lczogc3RyaW5nW10gPSBPYmplY3Qua2V5cyhtb2RUeXBlcykucmVkdWNlKChhY2N1bSwgdHlwZUlkKSA9PiB7XG4gICAgY29uc3QgbW9kUGF0aCA9IG1vZFR5cGVzW3R5cGVJZF07XG4gICAgY29uc3QgZmlsZXM6IElEZXBsb3llZEZpbGVbXSA9IGRlcGxveW1lbnRbdHlwZUlkXTtcbiAgICBjb25zdCBpc1Jvb3RNb2QgPSBtb2RQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ21vZHMnKSA9PT0gLTE7XG4gICAgY29uc3QgbmFtZXMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICBjb25zdCBuYW1lU2VnbWVudHMgPSBmaWxlLnJlbFBhdGguc3BsaXQocGF0aC5zZXApO1xuICAgICAgaWYgKGlzUm9vdE1vZCkge1xuICAgICAgICBjb25zdCBuYW1lSWR4ID0gbmFtZVNlZ21lbnRzLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpLmluZGV4T2YoJ21vZHMnKSArIDE7XG4gICAgICAgIHJldHVybiAobmFtZUlkeCA+IDApXG4gICAgICAgICAgPyBuYW1lU2VnbWVudHNbbmFtZUlkeF1cbiAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuYW1lU2VnbWVudHNbMF07XG4gICAgICB9XG4gICAgfSk7XG4gICAgYWNjdW0gPSBhY2N1bS5jb25jYXQobmFtZXMuZmlsdGVyKG5hbWUgPT4gISFuYW1lKSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbXSk7XG4gIGNvbnN0IHVuaXF1ZURlcGxveWVkID0gQXJyYXkuZnJvbShuZXcgU2V0KGRlcGxveWVkTmFtZXMpKTtcbiAgY29uc3QgbWVyZ2VkID0gYXdhaXQgZ2V0TmFtZXNPZk1lcmdlZE1vZHMoY29udGV4dCk7XG4gIGNvbnN0IGRpZmYgPSBfLmRpZmZlcmVuY2UobWVyZ2VkLCB1bmlxdWVEZXBsb3llZCk7XG4gIGNvbnN0IGlzT3B0aW9uYWwgPSAobW9kSWQ6IHN0cmluZykgPT4gKGNvbGxlY3Rpb24ucnVsZXMgPz8gW10pLmZpbmQocnVsZSA9PiB7XG4gICAgY29uc3QgbW9kOiB0eXBlcy5JTW9kID0gbW9kc1ttb2RJZF07XG4gICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHZhbGlkVHlwZSA9IFsncmVjb21tZW5kcyddLmluY2x1ZGVzKHJ1bGUudHlwZSk7XG4gICAgaWYgKCF2YWxpZFR5cGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbWF0Y2hlZFJ1bGUgPSB1dGlsLnRlc3RNb2RSZWZlcmVuY2UobW9kLCBydWxlLnJlZmVyZW5jZSk7XG4gICAgcmV0dXJuIG1hdGNoZWRSdWxlO1xuICB9KSAhPT0gdW5kZWZpbmVkO1xuICBjb25zdCBvcHRpb25hbE1vZHMgPSBpbmNsdWRlZE1vZElkcy5maWx0ZXIoaXNPcHRpb25hbCk7XG4gIGlmIChvcHRpb25hbE1vZHMubGVuZ3RoID4gMCB8fCBkaWZmLmxlbmd0aCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBNZXJnZURhdGFWaW9sYXRpb25FcnJvcihkaWZmIHx8IFtdLFxuICAgICAgb3B0aW9uYWxNb2RzIHx8IFtdLCB1dGlsLnJlbmRlck1vZE5hbWUoY29sbGVjdGlvbikpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRTY3JpcHRNZXJnZXMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZElkczogc3RyaW5nW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpIHtcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkLCB0cnVlKTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBleHBvcnRNZXJnZWREYXRhID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpKTtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGVtcFBhdGgpO1xuICAgICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2V4cG9ydCcsIHRlbXBQYXRoKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBwcmVwYXJlRmlsZURhdGEodGVtcFBhdGgpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShkYXRhKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgIH1cbiAgfTtcblxuICB0cnkge1xuICAgIGF3YWl0IHF1ZXJ5U2NyaXB0TWVyZ2VzKGNvbnRleHQsIGluY2x1ZGVkTW9kSWRzLCBjb2xsZWN0aW9uKTtcbiAgICByZXR1cm4gZXhwb3J0TWVyZ2VkRGF0YSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IpIHtcbiAgICAgIGNvbnN0IHZpb2xhdGlvbkVycm9yID0gKGVyciBhcyBNZXJnZURhdGFWaW9sYXRpb25FcnJvcik7XG4gICAgICBjb25zdCBvcHRpb25hbCA9IHZpb2xhdGlvbkVycm9yLk9wdGlvbmFsO1xuICAgICAgY29uc3Qgbm90SW5jbHVkZWQgPSB2aW9sYXRpb25FcnJvci5Ob3RJbmNsdWRlZDtcbiAgICAgIGNvbnN0IG9wdGlvbmFsU2VnbWVudCA9IChvcHRpb25hbC5sZW5ndGggPiAwKVxuICAgICAgICA/ICdNYXJrZWQgYXMgXCJvcHRpb25hbFwiIGJ1dCBuZWVkIHRvIGJlIG1hcmtlZCBcInJlcXVpcmVkXCI6e3ticn19W2xpc3RdJ1xuICAgICAgICAgICsgb3B0aW9uYWwubWFwKG9wdCA9PiBgWypdJHtvcHR9YCkgKyAnWy9saXN0XXt7YnJ9fSdcbiAgICAgICAgOiAnJztcbiAgICAgIGNvbnN0IG5vdEluY2x1ZGVkU2VnbWVudCA9IChub3RJbmNsdWRlZC5sZW5ndGggPiAwKVxuICAgICAgICA/ICdObyBsb25nZXIgcGFydCBvZiB0aGUgY29sbGVjdGlvbiBhbmQgbmVlZCB0byBiZSByZS1hZGRlZDp7e2JyfX1bbGlzdF0nXG4gICAgICAgICAgKyBub3RJbmNsdWRlZC5tYXAobmkgPT4gYFsqXSR7bml9YCkgKyAnWy9saXN0XXt7YnJ9fSdcbiAgICAgICAgOiAnJztcbiAgICAgIHJldHVybiBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdQb3RlbnRpYWwgbWVyZ2VkIGRhdGEgbWlzbWF0Y2gnLCB7XG4gICAgICAgIGJiY29kZTogJ1lvdXIgY29sbGVjdGlvbiBpbmNsdWRlcyBhIHNjcmlwdCBtZXJnZSB0aGF0IGlzIHJlZmVyZW5jaW5nIG1vZHMgJ1xuICAgICAgICAgICsgYHRoYXQgYXJlLi4ue3tibH19ICR7bm90SW5jbHVkZWRTZWdtZW50fSR7b3B0aW9uYWxTZWdtZW50fWBcbiAgICAgICAgICArICdGb3IgdGhlIGNvbGxlY3Rpb24gdG8gZnVuY3Rpb24gY29ycmVjdGx5IHlvdSB3aWxsIG5lZWQgdG8gYWRkcmVzcyB0aGUgJ1xuICAgICAgICAgICsgJ2Fib3ZlIG9yIHJlLXJ1biB0aGUgU2NyaXB0IE1lcmdlciB0byByZW1vdmUgdHJhY2VzIG9mIG1lcmdlcyByZWZlcmVuY2luZyAnXG4gICAgICAgICAgKyAndGhlc2UgbW9kcy4gUGxlYXNlLCBkbyBvbmx5IHByb2NlZWQgdG8gdXBsb2FkIHRoZSBjb2xsZWN0aW9uL3JldmlzaW9uIGFzICdcbiAgICAgICAgICArICdpcyBpZiB5b3UgaW50ZW5kIHRvIHVwbG9hZCB0aGUgc2NyaXB0IG1lcmdlIGFzIGlzIGFuZCBpZiB0aGUgcmVmZXJlbmNlIGZvciAnXG4gICAgICAgICAgKyAndGhlIG1lcmdlIHdpbGwgZS5nLiBiZSBhY3F1aXJlZCBmcm9tIGFuIGV4dGVybmFsIHNvdXJjZSBhcyBwYXJ0IG9mIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAgIHBhcmFtZXRlcnM6IHsgYnI6ICdbYnJdWy9icl0nLCBibDogJ1ticl1bL2JyXVticl1bL2JyXScgfSxcbiAgICAgIH0sIFtcbiAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcbiAgICAgICAgeyBsYWJlbDogJ1VwbG9hZCBDb2xsZWN0aW9uJyB9XG4gICAgICBdKS50aGVuKHJlcyA9PiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpXG4gICAgICAgID8gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgICA6IGV4cG9ydE1lcmdlZERhdGEoKSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRTY3JpcHRNZXJnZXMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlRGF0YTogQnVmZmVyKSB7XG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCwgdHJ1ZSk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NjcmlwdCBNZXJnZXMgSW1wb3J0Jywge1xuICAgIHRleHQ6ICdUaGUgY29sbGVjdGlvbiB5b3UgYXJlIGltcG9ydGluZyBjb250YWlucyBzY3JpcHQgbWVyZ2VzIHdoaWNoIHRoZSBjcmVhdG9yIG9mICdcbiAgICAgICAgKyAndGhlIGNvbGxlY3Rpb24gZGVlbWVkIG5lY2Vzc2FyeSBmb3IgdGhlIG1vZHMgdG8gZnVuY3Rpb24gY29ycmVjdGx5LiBQbGVhc2Ugbm90ZSB0aGF0ICdcbiAgICAgICAgKyAnaW1wb3J0aW5nIHRoZXNlIHdpbGwgb3ZlcndyaXRlIGFueSBleGlzdGluZyBzY3JpcHQgbWVyZ2VzIHlvdSBtYXkgaGF2ZSBlZmZlY3R1YXRlZC4gJ1xuICAgICAgICArICdQbGVhc2UgZW5zdXJlIHRvIGJhY2sgdXAgYW55IGV4aXN0aW5nIG1lcmdlcyAoaWYgYXBwbGljYWJsZS9yZXF1aXJlZCkgYmVmb3JlICdcbiAgICAgICAgKyAncHJvY2VlZGluZy4nLFxuICB9LFxuICBbXG4gICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcbiAgICB7IGxhYmVsOiAnSW1wb3J0IE1lcmdlcycgfSxcbiAgXSwgJ2ltcG9ydC13My1zY3JpcHQtbWVyZ2VzLXdhcm5pbmcnKTtcblxuICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKCkpO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgdGVtcFBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSk7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyh0ZW1wUGF0aCk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YSwgdGVtcFBhdGgpO1xuICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdpbXBvcnQnLCB0ZW1wUGF0aCk7XG4gICAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICBtZXNzYWdlOiAnU2NyaXB0IG1lcmdlcyBpbXBvcnRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgaWQ6ICd3aXRjaGVyMy1zY3JpcHQtbWVyZ2VzLXN0YXR1cycsXG4gICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlT25Db250ZXh0SW1wb3J0KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBjb2xsZWN0aW9uSWQ6IHN0cmluZykge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgY29sbGVjdGlvbk1vZCA9IG1vZHNbY29sbGVjdGlvbklkXTtcbiAgaWYgKGNvbGxlY3Rpb25Nb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxvZygnZXJyb3InLCAnY29sbGVjdGlvbiBtb2QgaXMgbWlzc2luZycsIGNvbGxlY3Rpb25JZCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgY29sbGVjdGlvbk1vZC5pbnN0YWxsYXRpb25QYXRoLCAnY29sbGVjdGlvbi5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XG4gICAgY29uc3QgeyBzY3JpcHRNZXJnZWREYXRhIH0gPSBjb2xsZWN0aW9uLm1lcmdlZERhdGE7XG4gICAgaWYgKHNjcmlwdE1lcmdlZERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgdGhlIHNjcmlwdCBtZXJnZXIgaW5zdGFsbGVkIHN0cmFpZ2h0IGF3YXkhXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmIChzY3JpcHRNZXJnZXJUb29sID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXdhaXQgZG93bmxvYWRTY3JpcHRNZXJnZXIoY29udGV4dCk7XG4gICAgICB9XG4gICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICAgIGF3YWl0IGltcG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LCBwcm9maWxlSWQsIGhleDJCdWZmZXIoc2NyaXB0TWVyZ2VkRGF0YSkpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpKSB7XG4gICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbXBvcnQgc2NyaXB0IG1lcmdlcycsIGVycik7XG4gICAgfVxuICB9XG59XG4iXX0=