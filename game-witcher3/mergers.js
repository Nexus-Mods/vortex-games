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
exports.doMergeSettings = exports.canMergeSettings = exports.canMergeXML = exports.doMergeXML = void 0;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const ini_1 = __importDefault(require("ini"));
class ModXMLDataInvalid extends vortex_api_1.util.DataInvalid {
    constructor(message, modFilePath) {
        super(`${message}:\n${modFilePath}`);
    }
}
const doMergeXML = (api) => (modFilePath, targetMergeDir) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const modData = yield vortex_api_1.fs.readFileAsync(modFilePath);
        const modXml = yield (0, xml2js_1.parseStringPromise)(modData);
        const modGroups = (_a = modXml === null || modXml === void 0 ? void 0 : modXml.UserConfig) === null || _a === void 0 ? void 0 : _a.Group;
        if (!modGroups) {
            const err = new ModXMLDataInvalid('Invalid XML data - inform mod author', modFilePath);
            api.showErrorNotification('Failed to merge XML data', err, { allowReport: false });
            return Promise.resolve();
        }
        const currentInputFile = yield readXMLInputFile(api, modFilePath, targetMergeDir);
        if (!currentInputFile) {
            return Promise.resolve();
        }
        const mergedXmlData = yield (0, xml2js_1.parseStringPromise)(currentInputFile);
        modGroups.forEach(modGroup => {
            var _a, _b, _c, _d, _e;
            const gameGroups = (_a = mergedXmlData === null || mergedXmlData === void 0 ? void 0 : mergedXmlData.UserConfig) === null || _a === void 0 ? void 0 : _a.Group;
            const modVars = (_c = (_b = modGroup === null || modGroup === void 0 ? void 0 : modGroup.VisibleVars) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.Var;
            const gameGroup = gameGroups.find(group => { var _a, _b; return ((_a = group === null || group === void 0 ? void 0 : group.$) === null || _a === void 0 ? void 0 : _a.id) === ((_b = modGroup === null || modGroup === void 0 ? void 0 : modGroup.$) === null || _b === void 0 ? void 0 : _b.id); });
            if (gameGroup) {
                const gameVars = (_e = (_d = gameGroup === null || gameGroup === void 0 ? void 0 : gameGroup.VisibleVars) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.Var;
                modVars.forEach(modVar => {
                    const gameVar = gameVars.find(v => { var _a, _b; return ((_a = v === null || v === void 0 ? void 0 : v.$) === null || _a === void 0 ? void 0 : _a.id) === ((_b = modVar === null || modVar === void 0 ? void 0 : modVar.$) === null || _b === void 0 ? void 0 : _b.id); });
                    if (gameVar) {
                        Object.assign(gameVar, modVar);
                    }
                    else {
                        gameVars.push(modVar);
                    }
                });
            }
            else {
                gameGroups.push(modGroup);
            }
        });
        const builder = new xml2js_1.Builder({ doctype: { dtd: 'UTF-16' } });
        const xml = builder.buildObject(mergedXmlData);
        yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(targetMergeDir, common_1.CONFIG_MATRIX_REL_PATH));
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(targetMergeDir, common_1.CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath)), xml);
    }
    catch (err) {
        const activeProfile = vortex_api_1.selectors.activeProfile(api.store.getState());
        if (!(activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id)) {
            api.showErrorNotification('Failed to merge XML data', 'No active profile found', { allowReport: false });
            return Promise.resolve();
        }
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const extendedErr = vortex_api_1.util.deepMerge({ modFilePath, targetMergeDir, message: err.message, stack: err.stack }, err);
        api.showErrorNotification('Failed to merge XML data', extendedErr, {
            allowReport: true,
            attachments: [
                {
                    id: `${activeProfile.id}_loadOrder`,
                    type: 'data',
                    data: loadOrder,
                    description: 'Current load order'
                },
            ],
        });
        return Promise.resolve();
    }
});
exports.doMergeXML = doMergeXML;
const canMergeXML = (api) => {
    return (game, gameDiscovery) => {
        if (game.id !== common_1.GAME_ID) {
            return undefined;
        }
        return {
            baseFiles: (deployedFiles) => deployedFiles
                .filter(file => (0, util_1.isXML)(file.relPath))
                .map(file => ({
                in: path_1.default.join(gameDiscovery.path, common_1.CONFIG_MATRIX_REL_PATH, file.relPath),
                out: path_1.default.join(common_1.CONFIG_MATRIX_REL_PATH, file.relPath),
            })),
            filter: filePath => (0, util_1.isXML)(filePath) && common_1.CONFIG_MATRIX_FILES.includes(path_1.default.basename(filePath, path_1.default.extname(filePath))),
        };
    };
};
exports.canMergeXML = canMergeXML;
function readXMLInputFile(api, modFilePath, mergeDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
            return Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
        }
        const gameInputFilepath = path_1.default.join(discovery.path, common_1.CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath));
        const mergedFilePath = path_1.default.join(mergeDirPath, common_1.CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath));
        const backupFilePath = gameInputFilepath + common_1.VORTEX_BACKUP_TAG;
        try {
            let inputFileData;
            if (yield (0, util_1.fileExists)(mergedFilePath)) {
                inputFileData = vortex_api_1.fs.readFileAsync(mergedFilePath);
            }
            else if (yield (0, util_1.fileExists)(backupFilePath)) {
                inputFileData = vortex_api_1.fs.readFileAsync(backupFilePath);
            }
            else {
                inputFileData = vortex_api_1.fs.readFileAsync(gameInputFilepath);
            }
            return inputFileData;
        }
        catch (err) {
            const res = yield api.showDialog('error', 'Failed to read merged/native xml file', {
                text: 'A native XML file is missing. Please verify your game files through the game store client.',
            }, [
                { label: 'Close', default: true },
            ], 'w3-xml-merge-fail');
            return Promise.resolve(null);
        }
    });
}
const canMergeSettings = (api) => {
    return (game, gameDiscovery) => {
        if (game.id !== common_1.GAME_ID) {
            return undefined;
        }
        return {
            baseFiles: (deployedFiles) => deployedFiles
                .filter(file => (0, util_1.isSettingsFile)(path_1.default.basename(file.relPath)))
                .map(file => ({
                in: path_1.default.join((0, util_1.getDocumentsPath)(game), path_1.default.basename(file.relPath)),
                out: path_1.default.basename(file.relPath),
            })),
            filter: filePath => (0, util_1.isSettingsFile)(filePath),
        };
    };
};
exports.canMergeSettings = canMergeSettings;
const doMergeSettings = (api) => (modFilePath, targetMergeDir) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const modData = yield vortex_api_1.fs.readFileAsync(modFilePath, { encoding: 'utf8' });
        const modIniData = ini_1.default.parse(modData);
        const currentSettingsFile = yield readSettingsFile(api, modFilePath, targetMergeDir);
        const mergedIniData = ini_1.default.parse(currentSettingsFile);
        Object.keys(modIniData).forEach(section => {
            if (!mergedIniData[section]) {
                mergedIniData[section] = modIniData[section];
            }
            else {
                Object.keys(modIniData[section]).forEach(key => {
                    mergedIniData[section][key] = modIniData[section][key];
                });
            }
        });
        const mergedIniString = ini_1.default.stringify(mergedIniData);
        yield vortex_api_1.fs.ensureDirWritableAsync(targetMergeDir);
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(targetMergeDir, path_1.default.basename(modFilePath)), mergedIniString);
    }
    catch (err) {
        const state = api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const extendedErr = vortex_api_1.util.deepMerge({ modFilePath, targetMergeDir, message: err.message, stack: err.stack }, err);
        const mergedData = yield readSettingsFile(api, modFilePath, targetMergeDir);
        const modData = yield vortex_api_1.fs.readFileAsync(modFilePath, { encoding: 'utf8' });
        api.showErrorNotification('Failed to merge settings data', extendedErr, {
            allowReport: true,
            attachments: [
                {
                    id: `${activeProfile.id}_loadOrder`,
                    type: 'data',
                    data: loadOrder,
                    description: 'Current load order'
                },
                {
                    id: `${activeProfile.id}_merged_settings`,
                    type: 'data',
                    data: mergedData,
                    description: 'Merged settings'
                },
                {
                    id: `${activeProfile.id}_mod_settings`,
                    type: 'data',
                    data: modData,
                    description: 'Mod settings'
                }
            ],
        });
        return Promise.resolve();
    }
});
exports.doMergeSettings = doMergeSettings;
function readSettingsFile(api, modFilePath, mergeDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
            return Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
        }
        const gameSettingsFilepath = path_1.default.join((0, util_1.getDocumentsPath)(discovery), path_1.default.basename(modFilePath));
        const mergedFilePath = path_1.default.join(mergeDirPath, path_1.default.basename(modFilePath));
        const backupFilePath = gameSettingsFilepath + common_1.VORTEX_BACKUP_TAG;
        try {
            if (yield (0, util_1.fileExists)(mergedFilePath)) {
                return vortex_api_1.fs.readFileAsync(mergedFilePath);
            }
            if (yield (0, util_1.fileExists)(backupFilePath)) {
                return vortex_api_1.fs.readFileAsync(backupFilePath);
            }
            return vortex_api_1.fs.readFileAsync(gameSettingsFilepath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Vycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUF3RDtBQUN4RCxtQ0FBcUQ7QUFFckQscUNBQW1HO0FBQ25HLDZDQUFzRDtBQUN0RCxpQ0FBNkU7QUFDN0UsOENBQXNCO0FBRXRCLE1BQU0saUJBQWtCLFNBQVEsaUJBQUksQ0FBQyxXQUFXO0lBQzlDLFlBQVksT0FBZSxFQUFFLFdBQW1CO1FBQzlDLEtBQUssQ0FBQyxHQUFHLE9BQU8sTUFBTSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWNNLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFLENBQUMsQ0FBTyxXQUFtQixFQUFFLGNBQXNCLEVBQUUsRUFBRTs7SUFDNUcsSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUNqRCxNQUFNLFNBQVMsR0FBRyxNQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxVQUFVLDBDQUFFLEtBQUssQ0FBQztRQUM1QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDZixNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFpQixDQUFDLHNDQUFzQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZGLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNuRixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEdBQUcsRUFB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WUFDRCxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZzLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBDT05GSUdfTUFUUklYX0ZJTEVTLCBWT1JURVhfQkFDS1VQX1RBRyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcbmltcG9ydCB7IGZpbGVFeGlzdHMsIGdldERvY3VtZW50c1BhdGgsIGlzU2V0dGluZ3NGaWxlLCBpc1hNTCB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCBpbmkgZnJvbSAnaW5pJztcclxuXHJcbmNsYXNzIE1vZFhNTERhdGFJbnZhbGlkIGV4dGVuZHMgdXRpbC5EYXRhSW52YWxpZCB7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBtb2RGaWxlUGF0aDogc3RyaW5nKSB7XHJcbiAgICBzdXBlcihgJHttZXNzYWdlfTpcXG4ke21vZEZpbGVQYXRofWApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gRXhhbXBsZSBvZiBob3cgd2UgZXhwZWN0IHRoZSB2YXJzIHRvIGJlIHdyYXBwZWQ6XHJcbi8vIDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi0xNlwiPz5cclxuLy8gPFVzZXJDb25maWc+XHJcbi8vIFx0PEdyb3VwIGJ1aWxkZXI9XCJJbnB1dFwiIGlkPVwiUENJbnB1dFwiIGRpc3BsYXlOYW1lPVwiY29udHJvbHNfcGNcIiB0YWdzPVwia2V5YmluZHNcIj5cclxuLy8gXHRcdDxWaXNpYmxlVmFycz5cclxuLy8gXHRcdFx0PFZhciBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIk1vdmVGd2RcIlx0XHRcdFx0XHRkaXNwbGF5TmFtZT1cIm1vdmVfZm9yd2FyZFwiXHRcdFx0XHRcdFx0ZGlzcGxheVR5cGU9XCJJTlBVVFBDXCIgYWN0aW9ucz1cIk1vdmVGb3J3YXJkO01vdmVtZW50RG91YmxlVGFwVztDaGFuZ2VDaG9pY2VVcFwiLz5cclxuLy8gXHRcdFx0PFZhciBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIk1vdmVCY2tcIlx0XHRcdFx0XHRkaXNwbGF5TmFtZT1cIm1vdmVfYmFja1wiXHRcdFx0XHRcdFx0XHRkaXNwbGF5VHlwZT1cIklOUFVUUENcIiBhY3Rpb25zPVwiTW92ZUJhY2t3YXJkO01vdmVtZW50RG91YmxlVGFwUztDaGFuZ2VDaG9pY2VEb3duO0dJX0RlY2VsZXJhdGVcIi8+XHJcbi8vICAgICA8L1Zpc2libGVWYXJzPlxyXG4vLyBcdDwvR3JvdXA+XHJcbi8vIDwvVXNlckNvbmZpZz5cclxuLy8gQWRkaW5nIGEgZ3JvdXAgd2l0aCBhIGRpZmZlcmVudCBpZCB3aWxsIGNyZWF0ZSBhIG5ldyBncm91cCBpbiB0aGUgZ2FtZSdzIGlucHV0LnhtbFxyXG4vLyAgZmlsZSwgaWYgdGhlIGdyb3VwIGFscmVhZHkgZXhpc3RzIGl0IHdpbGwgbWVyZ2UgdGhlIHZhcnMgaW50byB0aGUgZXhpc3RpbmcgZ3JvdXAuXHJcbmV4cG9ydCBjb25zdCBkb01lcmdlWE1MID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gYXN5bmMgKG1vZEZpbGVQYXRoOiBzdHJpbmcsIHRhcmdldE1lcmdlRGlyOiBzdHJpbmcpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kRmlsZVBhdGgpO1xyXG4gICAgY29uc3QgbW9kWG1sID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKG1vZERhdGEpO1xyXG4gICAgY29uc3QgbW9kR3JvdXBzID0gbW9kWG1sPy5Vc2VyQ29uZmlnPy5Hcm91cDtcclxuICAgIGlmICghbW9kR3JvdXBzKSB7XHJcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBNb2RYTUxEYXRhSW52YWxpZCgnSW52YWxpZCBYTUwgZGF0YSAtIGluZm9ybSBtb2QgYXV0aG9yJywgbW9kRmlsZVBhdGgpO1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2UgWE1MIGRhdGEnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBjdXJyZW50SW5wdXRGaWxlID0gYXdhaXQgcmVhZFhNTElucHV0RmlsZShhcGksIG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpcik7XHJcbiAgICBpZiAoIWN1cnJlbnRJbnB1dEZpbGUpIHtcclxuICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgaW5wdXQgZmlsZSBpcyBub3QgZm91bmQsIHdlIGNhbm5vdCBtZXJnZSwgc28gd2UganVzdCByZXR1cm4uXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1lcmdlZFhtbERhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoY3VycmVudElucHV0RmlsZSk7XHJcbiAgICBtb2RHcm91cHMuZm9yRWFjaChtb2RHcm91cCA9PiB7XHJcbiAgICAgIGNvbnN0IGdhbWVHcm91cHMgPSBtZXJnZWRYbWxEYXRhPy5Vc2VyQ29uZmlnPy5Hcm91cDtcclxuICAgICAgY29uc3QgbW9kVmFycyA9IG1vZEdyb3VwPy5WaXNpYmxlVmFycz8uWzBdPy5WYXI7XHJcbiAgICAgIGNvbnN0IGdhbWVHcm91cCA9IGdhbWVHcm91cHMuZmluZChncm91cCA9PiBncm91cD8uJD8uaWQgPT09IG1vZEdyb3VwPy4kPy5pZCk7XHJcbiAgICAgIGlmIChnYW1lR3JvdXApIHtcclxuICAgICAgICBjb25zdCBnYW1lVmFycyA9IGdhbWVHcm91cD8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xyXG4gICAgICAgIG1vZFZhcnMuZm9yRWFjaChtb2RWYXIgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZ2FtZVZhciA9IGdhbWVWYXJzLmZpbmQodiA9PiB2Py4kPy5pZCA9PT0gbW9kVmFyPy4kPy5pZCk7XHJcbiAgICAgICAgICBpZiAoZ2FtZVZhcikge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGdhbWVWYXIsIG1vZFZhcik7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnYW1lVmFycy5wdXNoKG1vZFZhcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZ2FtZUdyb3Vwcy5wdXNoKG1vZEdyb3VwKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoeyBkb2N0eXBlOiB7IGR0ZDogJ1VURi0xNicgfSB9KTtcclxuICAgIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QobWVyZ2VkWG1sRGF0YSk7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCkpO1xyXG4gICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpLCB4bWwpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKGFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcclxuICAgIGlmICghYWN0aXZlUHJvZmlsZT8uaWQpIHtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIFhNTCBkYXRhJywgJ05vIGFjdGl2ZSBwcm9maWxlIGZvdW5kJywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICAgIGNvbnN0IGV4dGVuZGVkRXJyID0gdXRpbC5kZWVwTWVyZ2UoeyBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIsIG1lc3NhZ2U6IGVyci5tZXNzYWdlLCBzdGFjazogZXJyLnN0YWNrIH0sIGVycik7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2UgWE1MIGRhdGEnLCBleHRlbmRlZEVyciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcclxuICAgICAgYXR0YWNobWVudHM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbG9hZE9yZGVyYCxcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGRhdGE6IGxvYWRPcmRlcixcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBsb2FkIG9yZGVyJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjYW5NZXJnZVhNTCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gKGdhbWUsIGdhbWVEaXNjb3ZlcnkpID0+IHtcclxuICAgIGlmIChnYW1lLmlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYmFzZUZpbGVzOiAoZGVwbG95ZWRGaWxlczogdHlwZXMuSURlcGxveWVkRmlsZVtdKSA9PiBkZXBsb3llZEZpbGVzXHJcbiAgICAgICAgLmZpbHRlcihmaWxlID0+IGlzWE1MKGZpbGUucmVsUGF0aCkpXHJcbiAgICAgICAgLm1hcChmaWxlID0+ICh7XHJcbiAgICAgICAgICBpbjogcGF0aC5qb2luKGdhbWVEaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgZmlsZS5yZWxQYXRoKSxcclxuICAgICAgICAgIG91dDogcGF0aC5qb2luKENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIGZpbGUucmVsUGF0aCksXHJcbiAgICAgICAgfSkpLFxyXG4gICAgICBmaWx0ZXI6IGZpbGVQYXRoID0+IGlzWE1MKGZpbGVQYXRoKSAmJiBDT05GSUdfTUFUUklYX0ZJTEVTLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZmlsZVBhdGgsIHBhdGguZXh0bmFtZShmaWxlUGF0aCkpKSxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkWE1MSW5wdXRGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kRmlsZVBhdGg6IHN0cmluZywgbWVyZ2VEaXJQYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCh7IGNvZGU6ICdFTk9FTlQnLCBtZXNzYWdlOiAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IGdhbWVJbnB1dEZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XHJcbiAgY29uc3QgbWVyZ2VkRmlsZVBhdGggPSBwYXRoLmpvaW4obWVyZ2VEaXJQYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XHJcbiAgY29uc3QgYmFja3VwRmlsZVBhdGggPSBnYW1lSW5wdXRGaWxlcGF0aCArIFZPUlRFWF9CQUNLVVBfVEFHO1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgaW5wdXRGaWxlRGF0YTtcclxuICAgIGlmIChhd2FpdCBmaWxlRXhpc3RzKG1lcmdlZEZpbGVQYXRoKSkge1xyXG4gICAgICBpbnB1dEZpbGVEYXRhID0gZnMucmVhZEZpbGVBc3luYyhtZXJnZWRGaWxlUGF0aCk7XHJcbiAgICB9IGVsc2UgaWYgKGF3YWl0IGZpbGVFeGlzdHMoYmFja3VwRmlsZVBhdGgpKSB7XHJcbiAgICAgIGlucHV0RmlsZURhdGEgPSBmcy5yZWFkRmlsZUFzeW5jKGJhY2t1cEZpbGVQYXRoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlucHV0RmlsZURhdGEgPSBmcy5yZWFkRmlsZUFzeW5jKGdhbWVJbnB1dEZpbGVwYXRoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBpbnB1dEZpbGVEYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byByZWFkIG1lcmdlZC9uYXRpdmUgeG1sIGZpbGUnLCB7XHJcbiAgICAgIHRleHQ6ICdBIG5hdGl2ZSBYTUwgZmlsZSBpcyBtaXNzaW5nLiBQbGVhc2UgdmVyaWZ5IHlvdXIgZ2FtZSBmaWxlcyB0aHJvdWdoIHRoZSBnYW1lIHN0b3JlIGNsaWVudC4nLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBkZWZhdWx0OiB0cnVlIH0sXHJcbiAgICBdLCAndzMteG1sLW1lcmdlLWZhaWwnKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyNyZWdpb24gZXhwZXJpbWVudGFsIHNldHRpbmdzIG1lcmdlXHJcbi8vIFRoaXMgaXMgYW4gZXhwZXJpbWVudGFsIGZlYXR1cmUgdGhhdCB3aWxsIG1lcmdlIHNldHRpbmdzIGZpbGVzIGluIHRoZSBnYW1lJ3MgZG9jdW1lbnRzIGZvbGRlci5cclxuLy8gIGN1cnJlbnRseSB1bnVzZWQgZHVlIHRvIHRyb3VibGVzb21lIG1pZ3JhdGlvbiBmcm9tIHRoZSBvbGQgc2V0dGluZ3Mgc3lzdGVtLlxyXG5leHBvcnQgY29uc3QgY2FuTWVyZ2VTZXR0aW5ncyA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gKGdhbWU6IHR5cGVzLklHYW1lLCBnYW1lRGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSA9PiB7XHJcbiAgICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgLy8gaWYgKGlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xyXG4gICAgLy8gICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGJhc2VGaWxlczogKGRlcGxveWVkRmlsZXM6IHR5cGVzLklEZXBsb3llZEZpbGVbXSkgPT4gZGVwbG95ZWRGaWxlc1xyXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBpc1NldHRpbmdzRmlsZShwYXRoLmJhc2VuYW1lKGZpbGUucmVsUGF0aCkpKVxyXG4gICAgICAgIC5tYXAoZmlsZSA9PiAoe1xyXG4gICAgICAgICAgaW46IHBhdGguam9pbihnZXREb2N1bWVudHNQYXRoKGdhbWUpLCBwYXRoLmJhc2VuYW1lKGZpbGUucmVsUGF0aCkpLFxyXG4gICAgICAgICAgb3V0OiBwYXRoLmJhc2VuYW1lKGZpbGUucmVsUGF0aCksXHJcbiAgICAgICAgfSkpLFxyXG4gICAgICBmaWx0ZXI6IGZpbGVQYXRoID0+IGlzU2V0dGluZ3NGaWxlKGZpbGVQYXRoKSxcclxuICAgIH07XHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGRvTWVyZ2VTZXR0aW5ncyA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IGFzeW5jIChtb2RGaWxlUGF0aDogc3RyaW5nLCB0YXJnZXRNZXJnZURpcjogc3RyaW5nKSA9PiB7XHJcbiAgLy8gaWYgKGlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xyXG4gIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIC8vIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBtb2RJbmlEYXRhID0gaW5pLnBhcnNlKG1vZERhdGEpO1xyXG4gICAgY29uc3QgY3VycmVudFNldHRpbmdzRmlsZSA9IGF3YWl0IHJlYWRTZXR0aW5nc0ZpbGUoYXBpLCBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIpO1xyXG4gICAgY29uc3QgbWVyZ2VkSW5pRGF0YSA9IGluaS5wYXJzZShjdXJyZW50U2V0dGluZ3NGaWxlKTtcclxuICAgIE9iamVjdC5rZXlzKG1vZEluaURhdGEpLmZvckVhY2goc2VjdGlvbiA9PiB7XHJcbiAgICAgIGlmICghbWVyZ2VkSW5pRGF0YVtzZWN0aW9uXSkge1xyXG4gICAgICAgIG1lcmdlZEluaURhdGFbc2VjdGlvbl0gPSBtb2RJbmlEYXRhW3NlY3Rpb25dO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIE9iamVjdC5rZXlzKG1vZEluaURhdGFbc2VjdGlvbl0pLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgIG1lcmdlZEluaURhdGFbc2VjdGlvbl1ba2V5XSA9IG1vZEluaURhdGFbc2VjdGlvbl1ba2V5XTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgbWVyZ2VkSW5pU3RyaW5nID0gaW5pLnN0cmluZ2lmeShtZXJnZWRJbmlEYXRhKTtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGFyZ2V0TWVyZ2VEaXIpO1xyXG4gICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpLCBtZXJnZWRJbmlTdHJpbmcpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XHJcbiAgICBjb25zdCBleHRlbmRlZEVyciA9IHV0aWwuZGVlcE1lcmdlKHsgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyLCBtZXNzYWdlOiBlcnIubWVzc2FnZSwgc3RhY2s6IGVyci5zdGFjayB9LCBlcnIpO1xyXG4gICAgY29uc3QgbWVyZ2VkRGF0YSA9IGF3YWl0IHJlYWRTZXR0aW5nc0ZpbGUoYXBpLCBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIpO1xyXG4gICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBzZXR0aW5ncyBkYXRhJywgZXh0ZW5kZWRFcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXHJcbiAgICAgIGF0dGFjaG1lbnRzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X2xvYWRPcmRlcmAsXHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBkYXRhOiBsb2FkT3JkZXIsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcidcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9tZXJnZWRfc2V0dGluZ3NgLFxyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAgZGF0YTogbWVyZ2VkRGF0YSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWVyZ2VkIHNldHRpbmdzJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X21vZF9zZXR0aW5nc2AsXHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBkYXRhOiBtb2REYXRhLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdNb2Qgc2V0dGluZ3MnXHJcbiAgICAgICAgfVxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkU2V0dGluZ3NGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kRmlsZVBhdGg6IHN0cmluZywgbWVyZ2VEaXJQYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCh7IGNvZGU6ICdFTk9FTlQnLCBtZXNzYWdlOiAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IGdhbWVTZXR0aW5nc0ZpbGVwYXRoID0gcGF0aC5qb2luKGdldERvY3VtZW50c1BhdGgoZGlzY292ZXJ5KSwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xyXG4gIGNvbnN0IG1lcmdlZEZpbGVQYXRoID0gcGF0aC5qb2luKG1lcmdlRGlyUGF0aCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xyXG4gIGNvbnN0IGJhY2t1cEZpbGVQYXRoID0gZ2FtZVNldHRpbmdzRmlsZXBhdGggKyBWT1JURVhfQkFDS1VQX1RBRztcclxuICB0cnkge1xyXG4gICAgaWYgKGF3YWl0IGZpbGVFeGlzdHMobWVyZ2VkRmlsZVBhdGgpKSB7XHJcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKG1lcmdlZEZpbGVQYXRoKTtcclxuICAgIH1cclxuICAgIGlmIChhd2FpdCBmaWxlRXhpc3RzKGJhY2t1cEZpbGVQYXRoKSkge1xyXG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhiYWNrdXBGaWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhnYW1lU2V0dGluZ3NGaWxlcGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbi8vI2VuZHJlZ2lvbiJdfQ==