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
        const state = api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
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
            if (yield (0, util_1.fileExists)(mergedFilePath)) {
                return vortex_api_1.fs.readFileAsync(mergedFilePath);
            }
            if (yield (0, util_1.fileExists)(backupFilePath)) {
                return vortex_api_1.fs.readFileAsync(backupFilePath);
            }
            return vortex_api_1.fs.readFileAsync(gameInputFilepath);
        }
        catch (err) {
            const res = yield api.showDialog('error', 'Failed to read merged/native xml file', {
                text: 'The original/native XML file is missing. Would you like to use the mod file instead?',
            }, [
                { label: 'Use Mod File' },
                { label: 'Skip', default: true },
            ], 'w3-xml-merge-fail');
            if (res.action === 'Use Mod File') {
                return vortex_api_1.fs.readFileAsync(modFilePath);
            }
            else {
                return Promise.resolve('');
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Vycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUF3RDtBQUN4RCxtQ0FBcUQ7QUFFckQscUNBQW1HO0FBQ25HLDZDQUFzRDtBQUN0RCxpQ0FBNkU7QUFDN0UsOENBQXNCO0FBRXRCLE1BQU0saUJBQWtCLFNBQVEsaUJBQUksQ0FBQyxXQUFXO0lBQzlDLFlBQVksT0FBZSxFQUFFLFdBQW1CO1FBQzlDLEtBQUssQ0FBQyxHQUFHLE9BQU8sTUFBTSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWNNLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFLENBQUMsQ0FBTyxXQUFtQixFQUFFLGNBQXNCLEVBQUUsRUFBRTs7SUFDNUcsSUFBSTtRQUNGLE1BQU0sT0FBTyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsTUFBTSxTQUFTLEdBQUcsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsVUFBVSwwQ0FBRSxLQUFLLENBQUM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQWlCLENBQUMsc0NBQXNDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkYsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsY0FB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RSx3QkFBd0IsRUFBRSxDQUFDLENBQUM7U0FDOUU7UUFDRCxNQUFNLG9CQUFvQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSx1QkFBZ0IsRUFBQyxTQUFTLENBQUMsRUFBRSxjQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDaEcsTUFBTSxjQUFjLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsY0FBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixHQUFHLDBCQUFpQixDQUFDO1FBQ2hFLElBQUk7WUFDRixJQUFJLE1BQU0sSUFBQSxpQkFBVSxFQUFDLGNBQWMsQ0FBQyxFQUFFO2dCQUNwQyxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDekM7WUFDRCxJQUFJLE1BQU0sSUFBQSxpQkFBVSxFQUFDLGNBQWMsQ0FBQyxFQUFFO2dCQUNwQyxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDekM7WUFDRCxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztTQUMvQztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZzLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBDT05GSUdfTUFUUklYX0ZJTEVTLCBWT1JURVhfQkFDS1VQX1RBRyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcbmltcG9ydCB7IGZpbGVFeGlzdHMsIGdldERvY3VtZW50c1BhdGgsIGlzU2V0dGluZ3NGaWxlLCBpc1hNTCB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCBpbmkgZnJvbSAnaW5pJztcclxuXHJcbmNsYXNzIE1vZFhNTERhdGFJbnZhbGlkIGV4dGVuZHMgdXRpbC5EYXRhSW52YWxpZCB7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBtb2RGaWxlUGF0aDogc3RyaW5nKSB7XHJcbiAgICBzdXBlcihgJHttZXNzYWdlfTpcXG4ke21vZEZpbGVQYXRofWApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gRXhhbXBsZSBvZiBob3cgd2UgZXhwZWN0IHRoZSB2YXJzIHRvIGJlIHdyYXBwZWQ6XHJcbi8vIDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi0xNlwiPz5cclxuLy8gPFVzZXJDb25maWc+XHJcbi8vIFx0PEdyb3VwIGJ1aWxkZXI9XCJJbnB1dFwiIGlkPVwiUENJbnB1dFwiIGRpc3BsYXlOYW1lPVwiY29udHJvbHNfcGNcIiB0YWdzPVwia2V5YmluZHNcIj5cclxuLy8gXHRcdDxWaXNpYmxlVmFycz5cclxuLy8gXHRcdFx0PFZhciBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIk1vdmVGd2RcIlx0XHRcdFx0XHRkaXNwbGF5TmFtZT1cIm1vdmVfZm9yd2FyZFwiXHRcdFx0XHRcdFx0ZGlzcGxheVR5cGU9XCJJTlBVVFBDXCIgYWN0aW9ucz1cIk1vdmVGb3J3YXJkO01vdmVtZW50RG91YmxlVGFwVztDaGFuZ2VDaG9pY2VVcFwiLz5cclxuLy8gXHRcdFx0PFZhciBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIk1vdmVCY2tcIlx0XHRcdFx0XHRkaXNwbGF5TmFtZT1cIm1vdmVfYmFja1wiXHRcdFx0XHRcdFx0XHRkaXNwbGF5VHlwZT1cIklOUFVUUENcIiBhY3Rpb25zPVwiTW92ZUJhY2t3YXJkO01vdmVtZW50RG91YmxlVGFwUztDaGFuZ2VDaG9pY2VEb3duO0dJX0RlY2VsZXJhdGVcIi8+XHJcbi8vICAgICA8L1Zpc2libGVWYXJzPlxyXG4vLyBcdDwvR3JvdXA+XHJcbi8vIDwvVXNlckNvbmZpZz5cclxuLy8gQWRkaW5nIGEgZ3JvdXAgd2l0aCBhIGRpZmZlcmVudCBpZCB3aWxsIGNyZWF0ZSBhIG5ldyBncm91cCBpbiB0aGUgZ2FtZSdzIGlucHV0LnhtbFxyXG4vLyAgZmlsZSwgaWYgdGhlIGdyb3VwIGFscmVhZHkgZXhpc3RzIGl0IHdpbGwgbWVyZ2UgdGhlIHZhcnMgaW50byB0aGUgZXhpc3RpbmcgZ3JvdXAuXHJcbmV4cG9ydCBjb25zdCBkb01lcmdlWE1MID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gYXN5bmMgKG1vZEZpbGVQYXRoOiBzdHJpbmcsIHRhcmdldE1lcmdlRGlyOiBzdHJpbmcpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kRmlsZVBhdGgpO1xyXG4gICAgY29uc3QgbW9kWG1sID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKG1vZERhdGEpO1xyXG4gICAgY29uc3QgbW9kR3JvdXBzID0gbW9kWG1sPy5Vc2VyQ29uZmlnPy5Hcm91cDtcclxuICAgIGlmICghbW9kR3JvdXBzKSB7XHJcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBNb2RYTUxEYXRhSW52YWxpZCgnSW52YWxpZCBYTUwgZGF0YSAtIGluZm9ybSBtb2QgYXV0aG9yJywgbW9kRmlsZVBhdGgpO1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2UgWE1MIGRhdGEnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBjdXJyZW50SW5wdXRGaWxlID0gYXdhaXQgcmVhZFhNTElucHV0RmlsZShhcGksIG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpcik7XHJcbiAgICBjb25zdCBtZXJnZWRYbWxEYXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGN1cnJlbnRJbnB1dEZpbGUpO1xyXG4gICAgbW9kR3JvdXBzLmZvckVhY2gobW9kR3JvdXAgPT4ge1xyXG4gICAgICBjb25zdCBnYW1lR3JvdXBzID0gbWVyZ2VkWG1sRGF0YT8uVXNlckNvbmZpZz8uR3JvdXA7XHJcbiAgICAgIGNvbnN0IG1vZFZhcnMgPSBtb2RHcm91cD8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xyXG4gICAgICBjb25zdCBnYW1lR3JvdXAgPSBnYW1lR3JvdXBzLmZpbmQoZ3JvdXAgPT4gZ3JvdXA/LiQ/LmlkID09PSBtb2RHcm91cD8uJD8uaWQpO1xyXG4gICAgICBpZiAoZ2FtZUdyb3VwKSB7XHJcbiAgICAgICAgY29uc3QgZ2FtZVZhcnMgPSBnYW1lR3JvdXA/LlZpc2libGVWYXJzPy5bMF0/LlZhcjtcclxuICAgICAgICBtb2RWYXJzLmZvckVhY2gobW9kVmFyID0+IHtcclxuICAgICAgICAgIGNvbnN0IGdhbWVWYXIgPSBnYW1lVmFycy5maW5kKHYgPT4gdj8uJD8uaWQgPT09IG1vZFZhcj8uJD8uaWQpO1xyXG4gICAgICAgICAgaWYgKGdhbWVWYXIpIHtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihnYW1lVmFyLCBtb2RWYXIpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZ2FtZVZhcnMucHVzaChtb2RWYXIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGdhbWVHcm91cHMucHVzaChtb2RHcm91cCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKHsgZG9jdHlwZTogeyBkdGQ6ICdVVEYtMTYnIH0gfSk7XHJcbiAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KG1lcmdlZFhtbERhdGEpO1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4odGFyZ2V0TWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgpKTtcclxuICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4odGFyZ2V0TWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKSwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xyXG4gICAgY29uc3QgZXh0ZW5kZWRFcnIgPSB1dGlsLmRlZXBNZXJnZSh7IG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpciwgbWVzc2FnZTogZXJyLm1lc3NhZ2UsIHN0YWNrOiBlcnIuc3RhY2sgfSwgZXJyKTtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBYTUwgZGF0YScsIGV4dGVuZGVkRXJyLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiB0cnVlLFxyXG4gICAgICBhdHRhY2htZW50czogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9sb2FkT3JkZXJgLFxyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAgZGF0YTogbG9hZE9yZGVyLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IGxvYWQgb3JkZXInXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNhbk1lcmdlWE1MID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiAoZ2FtZSwgZ2FtZURpc2NvdmVyeSkgPT4ge1xyXG4gICAgaWYgKGdhbWUuaWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBiYXNlRmlsZXM6IChkZXBsb3llZEZpbGVzOiB0eXBlcy5JRGVwbG95ZWRGaWxlW10pID0+IGRlcGxveWVkRmlsZXNcclxuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gaXNYTUwoZmlsZS5yZWxQYXRoKSlcclxuICAgICAgICAubWFwKGZpbGUgPT4gKHtcclxuICAgICAgICAgIGluOiBwYXRoLmpvaW4oZ2FtZURpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBmaWxlLnJlbFBhdGgpLFxyXG4gICAgICAgICAgb3V0OiBwYXRoLmpvaW4oQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgZmlsZS5yZWxQYXRoKSxcclxuICAgICAgICB9KSksXHJcbiAgICAgIGZpbHRlcjogZmlsZVBhdGggPT4gaXNYTUwoZmlsZVBhdGgpICYmIENPTkZJR19NQVRSSVhfRklMRVMuaW5jbHVkZXMocGF0aC5iYXNlbmFtZShmaWxlUGF0aCwgcGF0aC5leHRuYW1lKGZpbGVQYXRoKSkpLFxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRYTUxJbnB1dEZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2RGaWxlUGF0aDogc3RyaW5nLCBtZXJnZURpclBhdGg6IHN0cmluZykge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoIWRpc2NvdmVyeT8ucGF0aCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHsgY29kZTogJ0VOT0VOVCcsIG1lc3NhZ2U6ICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJyB9KTtcclxuICB9XHJcbiAgY29uc3QgZ2FtZUlucHV0RmlsZXBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcclxuICBjb25zdCBtZXJnZWRGaWxlUGF0aCA9IHBhdGguam9pbihtZXJnZURpclBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcclxuICBjb25zdCBiYWNrdXBGaWxlUGF0aCA9IGdhbWVJbnB1dEZpbGVwYXRoICsgVk9SVEVYX0JBQ0tVUF9UQUc7XHJcbiAgdHJ5IHtcclxuICAgIGlmIChhd2FpdCBmaWxlRXhpc3RzKG1lcmdlZEZpbGVQYXRoKSkge1xyXG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtZXJnZWRGaWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhiYWNrdXBGaWxlUGF0aCkpIHtcclxuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoYmFja3VwRmlsZVBhdGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoZ2FtZUlucHV0RmlsZXBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byByZWFkIG1lcmdlZC9uYXRpdmUgeG1sIGZpbGUnLCB7XHJcbiAgICAgIHRleHQ6ICdUaGUgb3JpZ2luYWwvbmF0aXZlIFhNTCBmaWxlIGlzIG1pc3NpbmcuIFdvdWxkIHlvdSBsaWtlIHRvIHVzZSB0aGUgbW9kIGZpbGUgaW5zdGVhZD8nLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnVXNlIE1vZCBGaWxlJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnU2tpcCcsIGRlZmF1bHQ6IHRydWUgfSxcclxuICAgIF0sICd3My14bWwtbWVyZ2UtZmFpbCcpO1xyXG4gICAgaWYgKHJlcy5hY3Rpb24gPT09ICdVc2UgTW9kIEZpbGUnKSB7XHJcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKG1vZEZpbGVQYXRoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoJycpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLy8jcmVnaW9uIGV4cGVyaW1lbnRhbCBzZXR0aW5ncyBtZXJnZVxyXG4vLyBUaGlzIGlzIGFuIGV4cGVyaW1lbnRhbCBmZWF0dXJlIHRoYXQgd2lsbCBtZXJnZSBzZXR0aW5ncyBmaWxlcyBpbiB0aGUgZ2FtZSdzIGRvY3VtZW50cyBmb2xkZXIuXHJcbi8vICBjdXJyZW50bHkgdW51c2VkIGR1ZSB0byB0cm91Ymxlc29tZSBtaWdyYXRpb24gZnJvbSB0aGUgb2xkIHNldHRpbmdzIHN5c3RlbS5cclxuZXhwb3J0IGNvbnN0IGNhbk1lcmdlU2V0dGluZ3MgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIChnYW1lOiB0eXBlcy5JR2FtZSwgZ2FtZURpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkgPT4ge1xyXG4gICAgaWYgKGdhbWUuaWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIC8vIGlmIChpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcclxuICAgIC8vICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIC8vIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBiYXNlRmlsZXM6IChkZXBsb3llZEZpbGVzOiB0eXBlcy5JRGVwbG95ZWRGaWxlW10pID0+IGRlcGxveWVkRmlsZXNcclxuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gaXNTZXR0aW5nc0ZpbGUocGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpKSlcclxuICAgICAgICAubWFwKGZpbGUgPT4gKHtcclxuICAgICAgICAgIGluOiBwYXRoLmpvaW4oZ2V0RG9jdW1lbnRzUGF0aChnYW1lKSwgcGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpKSxcclxuICAgICAgICAgIG91dDogcGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpLFxyXG4gICAgICAgIH0pKSxcclxuICAgICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBpc1NldHRpbmdzRmlsZShmaWxlUGF0aCksXHJcbiAgICB9O1xyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBkb01lcmdlU2V0dGluZ3MgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBhc3luYyAobW9kRmlsZVBhdGg6IHN0cmluZywgdGFyZ2V0TWVyZ2VEaXI6IHN0cmluZykgPT4ge1xyXG4gIC8vIGlmIChpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcclxuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAvLyB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgbW9kSW5pRGF0YSA9IGluaS5wYXJzZShtb2REYXRhKTtcclxuICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5nc0ZpbGUgPSBhd2FpdCByZWFkU2V0dGluZ3NGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcclxuICAgIGNvbnN0IG1lcmdlZEluaURhdGEgPSBpbmkucGFyc2UoY3VycmVudFNldHRpbmdzRmlsZSk7XHJcbiAgICBPYmplY3Qua2V5cyhtb2RJbmlEYXRhKS5mb3JFYWNoKHNlY3Rpb24gPT4ge1xyXG4gICAgICBpZiAoIW1lcmdlZEluaURhdGFbc2VjdGlvbl0pIHtcclxuICAgICAgICBtZXJnZWRJbmlEYXRhW3NlY3Rpb25dID0gbW9kSW5pRGF0YVtzZWN0aW9uXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBPYmplY3Qua2V5cyhtb2RJbmlEYXRhW3NlY3Rpb25dKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICBtZXJnZWRJbmlEYXRhW3NlY3Rpb25dW2tleV0gPSBtb2RJbmlEYXRhW3NlY3Rpb25dW2tleV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG1lcmdlZEluaVN0cmluZyA9IGluaS5zdHJpbmdpZnkobWVyZ2VkSW5pRGF0YSk7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRhcmdldE1lcmdlRGlyKTtcclxuICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4odGFyZ2V0TWVyZ2VEaXIsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKSwgbWVyZ2VkSW5pU3RyaW5nKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xyXG4gICAgY29uc3QgZXh0ZW5kZWRFcnIgPSB1dGlsLmRlZXBNZXJnZSh7IG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpciwgbWVzc2FnZTogZXJyLm1lc3NhZ2UsIHN0YWNrOiBlcnIuc3RhY2sgfSwgZXJyKTtcclxuICAgIGNvbnN0IG1lcmdlZERhdGEgPSBhd2FpdCByZWFkU2V0dGluZ3NGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcclxuICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2Ugc2V0dGluZ3MgZGF0YScsIGV4dGVuZGVkRXJyLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiB0cnVlLFxyXG4gICAgICBhdHRhY2htZW50czogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9sb2FkT3JkZXJgLFxyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAgZGF0YTogbG9hZE9yZGVyLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IGxvYWQgb3JkZXInXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbWVyZ2VkX3NldHRpbmdzYCxcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGRhdGE6IG1lcmdlZERhdGEsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ01lcmdlZCBzZXR0aW5ncydcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9tb2Rfc2V0dGluZ3NgLFxyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAgZGF0YTogbW9kRGF0YSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTW9kIHNldHRpbmdzJ1xyXG4gICAgICAgIH1cclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFNldHRpbmdzRmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZEZpbGVQYXRoOiBzdHJpbmcsIG1lcmdlRGlyUGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xyXG4gIH1cclxuICBjb25zdCBnYW1lU2V0dGluZ3NGaWxlcGF0aCA9IHBhdGguam9pbihnZXREb2N1bWVudHNQYXRoKGRpc2NvdmVyeSksIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcclxuICBjb25zdCBtZXJnZWRGaWxlUGF0aCA9IHBhdGguam9pbihtZXJnZURpclBhdGgsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcclxuICBjb25zdCBiYWNrdXBGaWxlUGF0aCA9IGdhbWVTZXR0aW5nc0ZpbGVwYXRoICsgVk9SVEVYX0JBQ0tVUF9UQUc7XHJcbiAgdHJ5IHtcclxuICAgIGlmIChhd2FpdCBmaWxlRXhpc3RzKG1lcmdlZEZpbGVQYXRoKSkge1xyXG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtZXJnZWRGaWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhiYWNrdXBGaWxlUGF0aCkpIHtcclxuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoYmFja3VwRmlsZVBhdGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoZ2FtZVNldHRpbmdzRmlsZXBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyNlbmRyZWdpb24iXX0=