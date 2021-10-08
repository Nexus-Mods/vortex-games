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
            context.api.showErrorNotification('Failed to import script merges', err);
        }
    });
}
exports.makeOnContextImport = makeOnContextImport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxvREFBdUI7QUFDdkIsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFFN0QscUNBQ2dGO0FBRWhGLHFDQUFtQztBQUVuQyw2Q0FBa0Y7QUFFbEYsbUVBQStEO0FBRS9ELGlEQUF3RTtBQUV4RSxpQ0FBdUM7QUFhdkMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFFdEUsU0FBUyxZQUFZLENBQUMsT0FBZ0MsRUFDaEMsU0FBaUIsRUFBRSxLQUFlOztJQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFtQixzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEUsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRTtRQUMvQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sa0JBQWtCLEdBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3JFLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUs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aCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBNRVJHRV9JTlZfTUFOSUZFU1QsXHJcbiAgU0NSSVBUX01FUkdFUl9JRCwgVzNfVEVNUF9EQVRBX0RJUiwgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xyXG5cclxuaW1wb3J0IHsgaGV4MkJ1ZmZlciwgcHJlcGFyZUZpbGVEYXRhLCByZXN0b3JlRmlsZURhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TmFtZXNPZk1lcmdlZE1vZHMgfSBmcm9tICcuL21lcmdlSW52ZW50b3J5UGFyc2luZyc7XHJcblxyXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lLCBkb3dubG9hZFNjcmlwdE1lcmdlciB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IGdldERlcGxveW1lbnQgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgSURlcGxveWVkRmlsZSwgSURlcGxveW1lbnQgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbnR5cGUgT3BUeXBlID0gJ2ltcG9ydCcgfCAnZXhwb3J0JztcclxuaW50ZXJmYWNlIElCYXNlUHJvcHMge1xyXG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBzdGF0ZTogdHlwZXMuSVN0YXRlO1xyXG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xyXG4gIHNjcmlwdE1lcmdlclRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbDtcclxuICBnYW1lUGF0aDogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBzb3J0SW5jID0gKGxoczogc3RyaW5nLCByaHM6IHN0cmluZykgPT4gbGhzLmxlbmd0aCAtIHJocy5sZW5ndGg7XHJcbmNvbnN0IHNvcnREZWMgPSAobGhzOiBzdHJpbmcsIHJoczogc3RyaW5nKSA9PiByaHMubGVuZ3RoIC0gbGhzLmxlbmd0aDtcclxuXHJcbmZ1bmN0aW9uIGdlbkJhc2VQcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLCBmb3JjZT86IGJvb2xlYW4pOiBJQmFzZVByb3BzIHtcclxuICBpZiAoIXByb2ZpbGVJZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2NhbE1lcmdlZFNjcmlwdHM6IGJvb2xlYW4gPSAoZm9yY2UpID8gdHJ1ZSA6IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZCwgJ2ZlYXR1cmVzJywgJ2xvY2FsX21lcmdlcyddLCBmYWxzZSk7XHJcbiAgaWYgKCFsb2NhbE1lcmdlZFNjcmlwdHMpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bU0NSSVBUX01FUkdFUl9JRF07XHJcbiAgaWYgKCFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICAvLyBSZWdhcmRsZXNzIG9mIHRoZSB1c2VyJ3MgcHJvZmlsZSBzZXR0aW5ncyAtIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gYmFja2luZyB1cFxyXG4gICAgLy8gIHRoZSBtZXJnZXMgaWYgd2UgZG9uJ3Qga25vdyB3aGVyZSB0aGUgc2NyaXB0IG1lcmdlciBpcyFcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBhcGk6IGNvbnRleHQuYXBpLCBzdGF0ZSwgcHJvZmlsZSwgc2NyaXB0TWVyZ2VyVG9vbCwgZ2FtZVBhdGg6IGRpc2NvdmVyeS5wYXRoIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEZpbGVFbnRyaWVzKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgbGV0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gIHJldHVybiB0dXJib3dhbGsoZmlsZVBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgY29uc3QgdmFsaWRFbnRyaWVzID0gZW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgZmlsZXMgPSBmaWxlcy5jb25jYXQodmFsaWRFbnRyaWVzKTtcclxuICB9LCB7IHJlY3Vyc2U6IHRydWUgfSlcclxuICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlcykpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBtb3ZlRmlsZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGZpbGVOYW1lOiBzdHJpbmcpIHtcclxuICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oZnJvbSwgZmlsZU5hbWUpO1xyXG4gIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4odG8sIGZpbGVOYW1lKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgY29weUZpbGUoc3JjLCBkZXN0KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIEl0J3MgcGVyZmVjdGx5IHBvc3NpYmxlIGZvciB0aGUgdXNlciBub3QgdG8gaGF2ZSBhbnkgbWVyZ2VzIHlldC5cclxuICAgIHJldHVybiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKVxyXG4gICAgICA/IFByb21pc2UucmVqZWN0KGVycilcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZVBhdGg6IHN0cmluZykge1xyXG4gIGlmIChwYXRoLmV4dG5hbWUoZmlsZVBhdGgpID09PSAnJykge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY29weUZpbGUoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XHJcbiAgICBhd2FpdCByZW1vdmVGaWxlKGRlc3QpO1xyXG4gICAgYXdhaXQgZnMuY29weUFzeW5jKHNyYywgZGVzdCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG1vdmVGaWxlcyhzcmM6IHN0cmluZywgZGVzdDogc3RyaW5nLCBwcm9wczogSUJhc2VQcm9wcykge1xyXG4gIGNvbnN0IHQgPSBwcm9wcy5hcGkudHJhbnNsYXRlO1xyXG4gIGNvbnN0IHJlbW92ZURlc3RGaWxlcyA9IGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGRlc3RGaWxlczogc3RyaW5nW10gPSBhd2FpdCBnZXRGaWxlRW50cmllcyhkZXN0KTtcclxuICAgICAgZGVzdEZpbGVzLnNvcnQoc29ydERlYyk7XHJcbiAgICAgIGZvciAoY29uc3QgZGVzdEZpbGUgb2YgZGVzdEZpbGVzKSB7XHJcbiAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdEZpbGUpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKFsnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcclxuICAgICAgICByZXR1cm4gcHJvcHMuYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byByZXN0b3JlIG1lcmdlZCBmaWxlcycsIHtcclxuICAgICAgICAgIGJiY29kZTogdCgnVm9ydGV4IGVuY291bnRlcmVkIGEgcGVybWlzc2lvbnMgcmVsYXRlZCBlcnJvciB3aGlsZSBhdHRlbXB0aW5nICdcclxuICAgICAgICAgICAgKyAndG8gcmVwbGFjZTp7e2JsfX1cInt7ZmlsZVBhdGh9fVwie3tibH19J1xyXG4gICAgICAgICAgICArICdQbGVhc2UgdHJ5IHRvIHJlc29sdmUgYW55IHBlcm1pc3Npb25zIHJlbGF0ZWQgaXNzdWVzIGFuZCByZXR1cm4gdG8gdGhpcyAnXHJcbiAgICAgICAgICAgICsgJ2RpYWxvZyB3aGVuIHlvdSB0aGluayB5b3UgbWFuYWdlZCB0byBmaXggaXQuIFRoZXJlIGFyZSBhIGNvdXBsZSBvZiB0aGluZ3MgJ1xyXG4gICAgICAgICAgICArICd5b3UgY2FuIHRyeSB0byBmaXggdGhpczpbYnJdWy9icl1bbGlzdF1bKl0gQ2xvc2UvRGlzYWJsZSBhbnkgYXBwbGljYXRpb25zIHRoYXQgbWF5ICdcclxuICAgICAgICAgICAgKyAnaW50ZXJmZXJlIHdpdGggVm9ydGV4XFwncyBvcGVyYXRpb25zIHN1Y2ggYXMgdGhlIGdhbWUgaXRzZWxmLCB0aGUgd2l0Y2hlciBzY3JpcHQgbWVyZ2VyLCAnXHJcbiAgICAgICAgICAgICsgJ2FueSBleHRlcm5hbCBtb2RkaW5nIHRvb2xzLCBhbnkgYW50aS12aXJ1cyBzb2Z0d2FyZS4gJ1xyXG4gICAgICAgICAgICArICdbKl0gRW5zdXJlIHRoYXQgeW91ciBXaW5kb3dzIHVzZXIgYWNjb3VudCBoYXMgZnVsbCByZWFkL3dyaXRlIHBlcm1pc3Npb25zIHRvIHRoZSBmaWxlIHNwZWNpZmllZCAnXHJcbiAgICAgICAgICAgICsgJ1svbGlzdF0nLCB7IHJlcGxhY2U6IHsgZmlsZVBhdGg6IGVyci5wYXRoLCBibDogJ1ticl1bL2JyXVticl1bL2JyXScgfSB9KSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKSB9LFxyXG4gICAgICAgICAgeyBsYWJlbDogJ1RyeSBBZ2FpbicsIGFjdGlvbjogKCkgPT4gcmVtb3ZlRGVzdEZpbGVzKCkgfSxcclxuICAgICAgICBdKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBXZSBmYWlsZWQgdG8gY2xlYW4gdXAgdGhlIGRlc3RpbmF0aW9uIGZvbGRlciAtIHdlIGNhbid0XHJcbiAgICAgICAgLy8gIGNvbnRpbnVlLlxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoZXJyLm1lc3NhZ2UpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGF3YWl0IHJlbW92ZURlc3RGaWxlcygpO1xyXG4gIGNvbnN0IGNvcGllZDogc3RyaW5nW10gPSBbXTtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc3JjRmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoc3JjKTtcclxuICAgIHNyY0ZpbGVzLnNvcnQoc29ydEluYyk7XHJcbiAgICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoc3JjLCBzcmNGaWxlKTtcclxuICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihkZXN0LCByZWxQYXRoKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBjb3B5RmlsZShzcmNGaWxlLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICBjb3BpZWQucHVzaCh0YXJnZXRQYXRoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbW92ZSBmaWxlJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIChjbGVhblVwKSB7XHJcbiAgICAvLyAgIC8vIFdlIG1hbmFnZWQgdG8gY29weSBhbGwgdGhlIGZpbGVzLCBjbGVhbiB1cCB0aGUgc291cmNlXHJcbiAgICAvLyAgIHNyY0ZpbGVzLnNvcnQoc29ydERlYyk7XHJcbiAgICAvLyAgIGZvciAoY29uc3Qgc3JjRmlsZSBvZiBzcmNGaWxlcykge1xyXG4gICAgLy8gICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKHNyY0ZpbGUpO1xyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoISFlcnIucGF0aCAmJiAhZXJyLnBhdGguaW5jbHVkZXMoZGVzdCkpIHtcclxuICAgICAgLy8gV2UgZmFpbGVkIHRvIGNsZWFuIHVwIHRoZSBzb3VyY2VcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlIGZhaWxlZCB0byBjb3B5IC0gY2xlYW4gdXAuXHJcbiAgICBjb3BpZWQuc29ydChzb3J0RGVjKTtcclxuICAgIGZvciAoY29uc3QgbGluayBvZiBjb3BpZWQpIHtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobGluayk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzOiBJQmFzZVByb3BzLCBvcFR5cGU6IE9wVHlwZSwgZGVzdD86IHN0cmluZykge1xyXG4gIGNvbnN0IHsgc2NyaXB0TWVyZ2VyVG9vbCwgcHJvZmlsZSwgZ2FtZVBhdGggfSA9IHByb3BzO1xyXG4gIGlmICghc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLk5vdEZvdW5kKCdTY3JpcHQgbWVyZ2luZyB0b29sIHBhdGgnKSk7XHJcbiAgfVxyXG4gIGlmICghcHJvZmlsZT8uaWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Bcmd1bWVudEludmFsaWQoJ2ludmFsaWQgcHJvZmlsZScpKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtZXJnZXJUb29sRGlyID0gcGF0aC5kaXJuYW1lKHNjcmlwdE1lcmdlclRvb2wucGF0aCk7XHJcbiAgICBjb25zdCBwcm9maWxlUGF0aDogc3RyaW5nID0gKGRlc3QgPT09IHVuZGVmaW5lZClcclxuICAgICAgPyBwYXRoLmpvaW4obWVyZ2VyVG9vbERpciwgcHJvZmlsZS5pZClcclxuICAgICAgOiBkZXN0O1xyXG4gICAgY29uc3QgbG9hck9yZGVyRmlsZXBhdGg6IHN0cmluZyA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICBjb25zdCBtZXJnZWRNb2ROYW1lID0gYXdhaXQgZ2V0TWVyZ2VkTW9kTmFtZShtZXJnZXJUb29sRGlyKTtcclxuICAgIGNvbnN0IG1lcmdlZFNjcmlwdHNQYXRoID0gcGF0aC5qb2luKGdhbWVQYXRoLCAnTW9kcycsIG1lcmdlZE1vZE5hbWUpO1xyXG5cclxuICAgIC8vIEp1c3QgaW4gY2FzZSBpdCdzIG1pc3NpbmcuXHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1lcmdlZFNjcmlwdHNQYXRoKTtcclxuXHJcbiAgICBpZiAob3BUeXBlID09PSAnZXhwb3J0Jykge1xyXG4gICAgICBhd2FpdCBtb3ZlRmlsZShtZXJnZXJUb29sRGlyLCBwcm9maWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNUKTtcclxuICAgICAgYXdhaXQgbW92ZUZpbGUocGF0aC5kaXJuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSwgcHJvZmlsZVBhdGgsIHBhdGguYmFzZW5hbWUobG9hck9yZGVyRmlsZXBhdGgpKTtcclxuICAgICAgYXdhaXQgbW92ZUZpbGVzKG1lcmdlZFNjcmlwdHNQYXRoLCBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsIG1lcmdlZE1vZE5hbWUpLCBwcm9wcyk7XHJcbiAgICB9IGVsc2UgaWYgKG9wVHlwZSA9PT0gJ2ltcG9ydCcpIHtcclxuICAgICAgYXdhaXQgbW92ZUZpbGUocHJvZmlsZVBhdGgsIG1lcmdlclRvb2xEaXIsIE1FUkdFX0lOVl9NQU5JRkVTVCk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBwYXRoLmRpcm5hbWUobG9hck9yZGVyRmlsZXBhdGgpLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XHJcbiAgICAgIGF3YWl0IG1vdmVGaWxlcyhwYXRoLmpvaW4ocHJvZmlsZVBhdGgsIG1lcmdlZE1vZE5hbWUpLCBtZXJnZWRTY3JpcHRzUGF0aCwgcHJvcHMpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc3RvcmUvcmVzdG9yZSBtZXJnZWQgc2NyaXB0cycsIGVycik7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZVRvUHJvZmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhjb250ZXh0LCBwcm9maWxlSWQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2V4cG9ydCcpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ6IHN0cmluZykge1xyXG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHJldHVybiBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnaW1wb3J0Jyk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeVNjcmlwdE1lcmdlcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkTW9kSWRzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZFR5cGVzOiB7IFt0eXBlSWQ6IHN0cmluZ106IHN0cmluZyB9ID0gc2VsZWN0b3JzLm1vZFBhdGhzRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBnZXREZXBsb3ltZW50KGNvbnRleHQuYXBpLCBpbmNsdWRlZE1vZElkcyk7XHJcbiAgY29uc3QgZGVwbG95ZWROYW1lczogc3RyaW5nW10gPSBPYmplY3Qua2V5cyhtb2RUeXBlcykucmVkdWNlKChhY2N1bSwgdHlwZUlkKSA9PiB7XHJcbiAgICBjb25zdCBtb2RQYXRoID0gbW9kVHlwZXNbdHlwZUlkXTtcclxuICAgIGNvbnN0IGZpbGVzOiBJRGVwbG95ZWRGaWxlW10gPSBkZXBsb3ltZW50W3R5cGVJZF07XHJcbiAgICBjb25zdCBpc1Jvb3RNb2QgPSBtb2RQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ21vZHMnKSA9PT0gLTE7XHJcbiAgICBjb25zdCBuYW1lcyA9IGZpbGVzLm1hcChmaWxlID0+IHtcclxuICAgICAgY29uc3QgbmFtZVNlZ21lbnRzID0gZmlsZS5yZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgaWYgKGlzUm9vdE1vZCkge1xyXG4gICAgICAgIGNvbnN0IG5hbWVJZHggPSBuYW1lU2VnbWVudHMubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSkuaW5kZXhPZignbW9kcycpICsgMTtcclxuICAgICAgICByZXR1cm4gKG5hbWVJZHggPiAwKVxyXG4gICAgICAgICAgPyBuYW1lU2VnbWVudHNbbmFtZUlkeF1cclxuICAgICAgICAgIDogdW5kZWZpbmVkO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuYW1lU2VnbWVudHNbMF07XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgYWNjdW0gPSBhY2N1bS5jb25jYXQobmFtZXMuZmlsdGVyKG5hbWUgPT4gISFuYW1lKSk7XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgW10pO1xyXG4gIGNvbnN0IHVuaXF1ZURlcGxveWVkID0gQXJyYXkuZnJvbShuZXcgU2V0KGRlcGxveWVkTmFtZXMpKTtcclxuICBjb25zdCBtZXJnZWQgPSBhd2FpdCBnZXROYW1lc09mTWVyZ2VkTW9kcyhjb250ZXh0KTtcclxuICBjb25zdCBkaWZmID0gXy5kaWZmZXJlbmNlKG1lcmdlZCwgdW5pcXVlRGVwbG95ZWQpO1xyXG4gIGNvbnN0IGlzT3B0aW9uYWwgPSAobW9kSWQ6IHN0cmluZykgPT4gKGNvbGxlY3Rpb24ucnVsZXMgPz8gW10pLmZpbmQocnVsZSA9PiB7XHJcbiAgICBjb25zdCBtb2Q6IHR5cGVzLklNb2QgPSBtb2RzW21vZElkXTtcclxuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICAgIGNvbnN0IHZhbGlkVHlwZSA9IFsncmVjb21tZW5kcyddLmluY2x1ZGVzKHJ1bGUudHlwZSk7XHJcbiAgICBpZiAoIXZhbGlkVHlwZSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtYXRjaGVkUnVsZSA9IHV0aWwudGVzdE1vZFJlZmVyZW5jZShtb2QsIHJ1bGUucmVmZXJlbmNlKTtcclxuICAgIHJldHVybiBtYXRjaGVkUnVsZTtcclxuICB9KSAhPT0gdW5kZWZpbmVkO1xyXG4gIGNvbnN0IG9wdGlvbmFsTW9kcyA9IGluY2x1ZGVkTW9kSWRzLmZpbHRlcihpc09wdGlvbmFsKTtcclxuICBpZiAob3B0aW9uYWxNb2RzLmxlbmd0aCA+IDAgfHwgZGlmZi5sZW5ndGggIT09IDApIHtcclxuICAgIHRocm93IG5ldyBNZXJnZURhdGFWaW9sYXRpb25FcnJvcihkaWZmIHx8IFtdLFxyXG4gICAgICBvcHRpb25hbE1vZHMgfHwgW10sIHV0aWwucmVuZGVyTW9kTmFtZShjb2xsZWN0aW9uKSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkTW9kSWRzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XHJcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkLCB0cnVlKTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZXhwb3J0TWVyZ2VkRGF0YSA9IGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHRlbXBQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIGdlbmVyYXRlKCkpO1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRlbXBQYXRoKTtcclxuICAgICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2V4cG9ydCcsIHRlbXBQYXRoKTtcclxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHByZXBhcmVGaWxlRGF0YSh0ZW1wUGF0aCk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcXVlcnlTY3JpcHRNZXJnZXMoY29udGV4dCwgaW5jbHVkZWRNb2RJZHMsIGNvbGxlY3Rpb24pO1xyXG4gICAgcmV0dXJuIGV4cG9ydE1lcmdlZERhdGEoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNZXJnZURhdGFWaW9sYXRpb25FcnJvcikge1xyXG4gICAgICBjb25zdCB2aW9sYXRpb25FcnJvciA9IChlcnIgYXMgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IpO1xyXG4gICAgICBjb25zdCBvcHRpb25hbCA9IHZpb2xhdGlvbkVycm9yLk9wdGlvbmFsO1xyXG4gICAgICBjb25zdCBub3RJbmNsdWRlZCA9IHZpb2xhdGlvbkVycm9yLk5vdEluY2x1ZGVkO1xyXG4gICAgICBjb25zdCBvcHRpb25hbFNlZ21lbnQgPSAob3B0aW9uYWwubGVuZ3RoID4gMClcclxuICAgICAgICA/ICdNYXJrZWQgYXMgXCJvcHRpb25hbFwiIGJ1dCBuZWVkIHRvIGJlIG1hcmtlZCBcInJlcXVpcmVkXCI6e3ticn19W2xpc3RdJ1xyXG4gICAgICAgICAgKyBvcHRpb25hbC5tYXAob3B0ID0+IGBbKl0ke29wdH1gKSArICdbL2xpc3Rde3ticn19J1xyXG4gICAgICAgIDogJyc7XHJcbiAgICAgIGNvbnN0IG5vdEluY2x1ZGVkU2VnbWVudCA9IChub3RJbmNsdWRlZC5sZW5ndGggPiAwKVxyXG4gICAgICAgID8gJ05vIGxvbmdlciBwYXJ0IG9mIHRoZSBjb2xsZWN0aW9uIGFuZCBuZWVkIHRvIGJlIHJlLWFkZGVkOnt7YnJ9fVtsaXN0XSdcclxuICAgICAgICAgICsgbm90SW5jbHVkZWQubWFwKG5pID0+IGBbKl0ke25pfWApICsgJ1svbGlzdF17e2JyfX0nXHJcbiAgICAgICAgOiAnJztcclxuICAgICAgcmV0dXJuIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1BvdGVudGlhbCBtZXJnZWQgZGF0YSBtaXNtYXRjaCcsIHtcclxuICAgICAgICBiYmNvZGU6ICdZb3VyIGNvbGxlY3Rpb24gaW5jbHVkZXMgYSBzY3JpcHQgbWVyZ2UgdGhhdCBpcyByZWZlcmVuY2luZyBtb2RzICdcclxuICAgICAgICAgICsgYHRoYXQgYXJlLi4ue3tibH19ICR7bm90SW5jbHVkZWRTZWdtZW50fSR7b3B0aW9uYWxTZWdtZW50fWBcclxuICAgICAgICAgICsgJ0ZvciB0aGUgY29sbGVjdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkgeW91IHdpbGwgbmVlZCB0byBhZGRyZXNzIHRoZSAnXHJcbiAgICAgICAgICArICdhYm92ZSBvciByZS1ydW4gdGhlIFNjcmlwdCBNZXJnZXIgdG8gcmVtb3ZlIHRyYWNlcyBvZiBtZXJnZXMgcmVmZXJlbmNpbmcgJ1xyXG4gICAgICAgICAgKyAndGhlc2UgbW9kcy4gUGxlYXNlLCBkbyBvbmx5IHByb2NlZWQgdG8gdXBsb2FkIHRoZSBjb2xsZWN0aW9uL3JldmlzaW9uIGFzICdcclxuICAgICAgICAgICsgJ2lzIGlmIHlvdSBpbnRlbmQgdG8gdXBsb2FkIHRoZSBzY3JpcHQgbWVyZ2UgYXMgaXMgYW5kIGlmIHRoZSByZWZlcmVuY2UgZm9yICdcclxuICAgICAgICAgICsgJ3RoZSBtZXJnZSB3aWxsIGUuZy4gYmUgYWNxdWlyZWQgZnJvbSBhbiBleHRlcm5hbCBzb3VyY2UgYXMgcGFydCBvZiB0aGUgY29sbGVjdGlvbi4nLFxyXG4gICAgICAgIHBhcmFtZXRlcnM6IHsgYnI6ICdbYnJdWy9icl0nLCBibDogJ1ticl1bL2JyXVticl1bL2JyXScgfSxcclxuICAgICAgfSwgW1xyXG4gICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgICAgeyBsYWJlbDogJ1VwbG9hZCBDb2xsZWN0aW9uJyB9XHJcbiAgICAgIF0pLnRoZW4ocmVzID0+IChyZXMuYWN0aW9uID09PSAnQ2FuY2VsJylcclxuICAgICAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICA6IGV4cG9ydE1lcmdlZERhdGEoKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRTY3JpcHRNZXJnZXMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZURhdGE6IEJ1ZmZlcikge1xyXG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCwgdHJ1ZSk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgcmVzID0gYXdhaXQgY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2NyaXB0IE1lcmdlcyBJbXBvcnQnLCB7XHJcbiAgICB0ZXh0OiAnVGhlIGNvbGxlY3Rpb24geW91IGFyZSBpbXBvcnRpbmcgY29udGFpbnMgc2NyaXB0IG1lcmdlcyB3aGljaCB0aGUgY3JlYXRvciBvZiAnXHJcbiAgICAgICAgKyAndGhlIGNvbGxlY3Rpb24gZGVlbWVkIG5lY2Vzc2FyeSBmb3IgdGhlIG1vZHMgdG8gZnVuY3Rpb24gY29ycmVjdGx5LiBQbGVhc2Ugbm90ZSB0aGF0ICdcclxuICAgICAgICArICdpbXBvcnRpbmcgdGhlc2Ugd2lsbCBvdmVyd3JpdGUgYW55IGV4aXN0aW5nIHNjcmlwdCBtZXJnZXMgeW91IG1heSBoYXZlIGVmZmVjdHVhdGVkLiAnXHJcbiAgICAgICAgKyAnUGxlYXNlIGVuc3VyZSB0byBiYWNrIHVwIGFueSBleGlzdGluZyBtZXJnZXMgKGlmIGFwcGxpY2FibGUvcmVxdWlyZWQpIGJlZm9yZSAnXHJcbiAgICAgICAgKyAncHJvY2VlZGluZy4nLFxyXG4gIH0sXHJcbiAgW1xyXG4gICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcclxuICAgIHsgbGFiZWw6ICdJbXBvcnQgTWVyZ2VzJyB9LFxyXG4gIF0sICdpbXBvcnQtdzMtc2NyaXB0LW1lcmdlcy13YXJuaW5nJyk7XHJcblxyXG4gIGlmIChyZXMuYWN0aW9uID09PSAnQ2FuY2VsJykge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKTtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHRlbXBQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIGdlbmVyYXRlKCkpO1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyh0ZW1wUGF0aCk7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzdG9yZUZpbGVEYXRhKGZpbGVEYXRhLCB0ZW1wUGF0aCk7XHJcbiAgICBhd2FpdCBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnaW1wb3J0JywgdGVtcFBhdGgpO1xyXG4gICAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIG1lc3NhZ2U6ICdTY3JpcHQgbWVyZ2VzIGltcG9ydGVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgIGlkOiAnd2l0Y2hlcjMtc2NyaXB0LW1lcmdlcy1zdGF0dXMnLFxyXG4gICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFrZU9uQ29udGV4dEltcG9ydChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgY29sbGVjdGlvbklkOiBzdHJpbmcpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGNvbGxlY3Rpb25Nb2QgPSBtb2RzW2NvbGxlY3Rpb25JZF07XHJcbiAgaWYgKGNvbGxlY3Rpb25Nb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCdlcnJvcicsICdjb2xsZWN0aW9uIG1vZCBpcyBtaXNzaW5nJywgY29sbGVjdGlvbklkKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBjb2xsZWN0aW9uTW9kLmluc3RhbGxhdGlvblBhdGgsICdjb2xsZWN0aW9uLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgY29sbGVjdGlvbiA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xyXG4gICAgY29uc3QgeyBzY3JpcHRNZXJnZWREYXRhIH0gPSBjb2xsZWN0aW9uLm1lcmdlZERhdGE7XHJcbiAgICBpZiAoc2NyaXB0TWVyZ2VkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIHRoZSBzY3JpcHQgbWVyZ2VyIGluc3RhbGxlZCBzdHJhaWdodCBhd2F5IVxyXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYXdhaXQgZG93bmxvYWRTY3JpcHRNZXJnZXIoY29udGV4dCk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgIGF3YWl0IGltcG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LCBwcm9maWxlSWQsIGhleDJCdWZmZXIoc2NyaXB0TWVyZ2VkRGF0YSkpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IHNjcmlwdCBtZXJnZXMnLCBlcnIpO1xyXG4gIH1cclxufVxyXG4iXX0=