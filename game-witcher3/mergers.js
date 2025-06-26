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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Vycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUF3RDtBQUN4RCxtQ0FBcUQ7QUFFckQscUNBQW1HO0FBQ25HLDZDQUFzRDtBQUN0RCxpQ0FBNkU7QUFDN0UsOENBQXNCO0FBRXRCLE1BQU0saUJBQWtCLFNBQVEsaUJBQUksQ0FBQyxXQUFXO0lBQzlDLFlBQVksT0FBZSxFQUFFLFdBQW1CO1FBQzlDLEtBQUssQ0FBQyxHQUFHLE9BQU8sTUFBTSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWNNLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFLENBQUMsQ0FBTyxXQUFtQixFQUFFLGNBQXNCLEVBQUUsRUFBRTs7SUFDNUcsSUFBSTtRQUNGLE1BQU0sT0FBTyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsTUFBTSxTQUFTLEdBQUcsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsVUFBVSwwQ0FBRSxLQUFLLENBQUM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQWlCLENBQUMsc0NBQXNDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkYsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsY0FB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QUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNsRyxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLEVBQUU7WUFDcEIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1NBQzlFO1FBQ0QsTUFBTSxvQkFBb0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsdUJBQWdCLEVBQUMsU0FBUyxDQUFDLEVBQUUsY0FBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLE1BQU0sY0FBYyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGNBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMzRSxNQUFNLGNBQWMsR0FBRyxvQkFBb0IsR0FBRywwQkFBaUIsQ0FBQztRQUNoRSxJQUFJO1lBQ0YsSUFBSSxNQUFNLElBQUEsaUJBQVUsRUFBQyxjQUFjLENBQUMsRUFBRTtnQkFDcEMsT0FBTyxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ3pDO1lBQ0QsSUFBSSxNQUFNLElBQUEsaUJBQVUsRUFBQyxjQUFjLENBQUMsRUFBRTtnQkFDcEMsT0FBTyxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ3pDO1lBQ0QsT0FBTyxlQUFFLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDL0M7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgQ09ORklHX01BVFJJWF9GSUxFUywgVk9SVEVYX0JBQ0tVUF9UQUcgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBmaWxlRXhpc3RzLCBnZXREb2N1bWVudHNQYXRoLCBpc1NldHRpbmdzRmlsZSwgaXNYTUwgfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgaW5pIGZyb20gJ2luaSc7XHJcblxyXG5jbGFzcyBNb2RYTUxEYXRhSW52YWxpZCBleHRlbmRzIHV0aWwuRGF0YUludmFsaWQge1xyXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgbW9kRmlsZVBhdGg6IHN0cmluZykge1xyXG4gICAgc3VwZXIoYCR7bWVzc2FnZX06XFxuJHttb2RGaWxlUGF0aH1gKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIEV4YW1wbGUgb2YgaG93IHdlIGV4cGVjdCB0aGUgdmFycyB0byBiZSB3cmFwcGVkOlxyXG4vLyA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtMTZcIj8+XHJcbi8vIDxVc2VyQ29uZmlnPlxyXG4vLyBcdDxHcm91cCBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIlBDSW5wdXRcIiBkaXNwbGF5TmFtZT1cImNvbnRyb2xzX3BjXCIgdGFncz1cImtleWJpbmRzXCI+XHJcbi8vIFx0XHQ8VmlzaWJsZVZhcnM+XHJcbi8vIFx0XHRcdDxWYXIgYnVpbGRlcj1cIklucHV0XCIgaWQ9XCJNb3ZlRndkXCJcdFx0XHRcdFx0ZGlzcGxheU5hbWU9XCJtb3ZlX2ZvcndhcmRcIlx0XHRcdFx0XHRcdGRpc3BsYXlUeXBlPVwiSU5QVVRQQ1wiIGFjdGlvbnM9XCJNb3ZlRm9yd2FyZDtNb3ZlbWVudERvdWJsZVRhcFc7Q2hhbmdlQ2hvaWNlVXBcIi8+XHJcbi8vIFx0XHRcdDxWYXIgYnVpbGRlcj1cIklucHV0XCIgaWQ9XCJNb3ZlQmNrXCJcdFx0XHRcdFx0ZGlzcGxheU5hbWU9XCJtb3ZlX2JhY2tcIlx0XHRcdFx0XHRcdFx0ZGlzcGxheVR5cGU9XCJJTlBVVFBDXCIgYWN0aW9ucz1cIk1vdmVCYWNrd2FyZDtNb3ZlbWVudERvdWJsZVRhcFM7Q2hhbmdlQ2hvaWNlRG93bjtHSV9EZWNlbGVyYXRlXCIvPlxyXG4vLyAgICAgPC9WaXNpYmxlVmFycz5cclxuLy8gXHQ8L0dyb3VwPlxyXG4vLyA8L1VzZXJDb25maWc+XHJcbi8vIEFkZGluZyBhIGdyb3VwIHdpdGggYSBkaWZmZXJlbnQgaWQgd2lsbCBjcmVhdGUgYSBuZXcgZ3JvdXAgaW4gdGhlIGdhbWUncyBpbnB1dC54bWxcclxuLy8gIGZpbGUsIGlmIHRoZSBncm91cCBhbHJlYWR5IGV4aXN0cyBpdCB3aWxsIG1lcmdlIHRoZSB2YXJzIGludG8gdGhlIGV4aXN0aW5nIGdyb3VwLlxyXG5leHBvcnQgY29uc3QgZG9NZXJnZVhNTCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IGFzeW5jIChtb2RGaWxlUGF0aDogc3RyaW5nLCB0YXJnZXRNZXJnZURpcjogc3RyaW5nKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEZpbGVQYXRoKTtcclxuICAgIGNvbnN0IG1vZFhtbCA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShtb2REYXRhKTtcclxuICAgIGNvbnN0IG1vZEdyb3VwcyA9IG1vZFhtbD8uVXNlckNvbmZpZz8uR3JvdXA7XHJcbiAgICBpZiAoIW1vZEdyb3Vwcykge1xyXG4gICAgICBjb25zdCBlcnIgPSBuZXcgTW9kWE1MRGF0YUludmFsaWQoJ0ludmFsaWQgWE1MIGRhdGEgLSBpbmZvcm0gbW9kIGF1dGhvcicsIG1vZEZpbGVQYXRoKTtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIFhNTCBkYXRhJywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY3VycmVudElucHV0RmlsZSA9IGF3YWl0IHJlYWRYTUxJbnB1dEZpbGUoYXBpLCBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIpO1xyXG4gICAgaWYgKCFjdXJyZW50SW5wdXRGaWxlKSB7XHJcbiAgICAgIC8vIElmIHRoZSBjdXJyZW50IGlucHV0IGZpbGUgaXMgbm90IGZvdW5kLCB3ZSBjYW5ub3QgbWVyZ2UsIHNvIHdlIGp1c3QgcmV0dXJuLlxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtZXJnZWRYbWxEYXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGN1cnJlbnRJbnB1dEZpbGUpO1xyXG4gICAgbW9kR3JvdXBzLmZvckVhY2gobW9kR3JvdXAgPT4ge1xyXG4gICAgICBjb25zdCBnYW1lR3JvdXBzID0gbWVyZ2VkWG1sRGF0YT8uVXNlckNvbmZpZz8uR3JvdXA7XHJcbiAgICAgIGNvbnN0IG1vZFZhcnMgPSBtb2RHcm91cD8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xyXG4gICAgICBjb25zdCBnYW1lR3JvdXAgPSBnYW1lR3JvdXBzLmZpbmQoZ3JvdXAgPT4gZ3JvdXA/LiQ/LmlkID09PSBtb2RHcm91cD8uJD8uaWQpO1xyXG4gICAgICBpZiAoZ2FtZUdyb3VwKSB7XHJcbiAgICAgICAgY29uc3QgZ2FtZVZhcnMgPSBnYW1lR3JvdXA/LlZpc2libGVWYXJzPy5bMF0/LlZhcjtcclxuICAgICAgICBtb2RWYXJzLmZvckVhY2gobW9kVmFyID0+IHtcclxuICAgICAgICAgIGNvbnN0IGdhbWVWYXIgPSBnYW1lVmFycy5maW5kKHYgPT4gdj8uJD8uaWQgPT09IG1vZFZhcj8uJD8uaWQpO1xyXG4gICAgICAgICAgaWYgKGdhbWVWYXIpIHtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihnYW1lVmFyLCBtb2RWYXIpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZ2FtZVZhcnMucHVzaChtb2RWYXIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGdhbWVHcm91cHMucHVzaChtb2RHcm91cCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKHsgZG9jdHlwZTogeyBkdGQ6ICdVVEYtMTYnIH0gfSk7XHJcbiAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KG1lcmdlZFhtbERhdGEpO1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4odGFyZ2V0TWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgpKTtcclxuICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4odGFyZ2V0TWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKSwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuc3RvcmUuZ2V0U3RhdGUoKSk7XHJcbiAgICBpZiAoIWFjdGl2ZVByb2ZpbGU/LmlkKSB7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBYTUwgZGF0YScsICdObyBhY3RpdmUgcHJvZmlsZSBmb3VuZCcsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XHJcbiAgICBjb25zdCBleHRlbmRlZEVyciA9IHV0aWwuZGVlcE1lcmdlKHsgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyLCBtZXNzYWdlOiBlcnIubWVzc2FnZSwgc3RhY2s6IGVyci5zdGFjayB9LCBlcnIpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIFhNTCBkYXRhJywgZXh0ZW5kZWRFcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXHJcbiAgICAgIGF0dGFjaG1lbnRzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X2xvYWRPcmRlcmAsXHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBkYXRhOiBsb2FkT3JkZXIsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcidcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgY2FuTWVyZ2VYTUwgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIChnYW1lLCBnYW1lRGlzY292ZXJ5KSA9PiB7XHJcbiAgICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGJhc2VGaWxlczogKGRlcGxveWVkRmlsZXM6IHR5cGVzLklEZXBsb3llZEZpbGVbXSkgPT4gZGVwbG95ZWRGaWxlc1xyXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBpc1hNTChmaWxlLnJlbFBhdGgpKVxyXG4gICAgICAgIC5tYXAoZmlsZSA9PiAoe1xyXG4gICAgICAgICAgaW46IHBhdGguam9pbihnYW1lRGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIGZpbGUucmVsUGF0aCksXHJcbiAgICAgICAgICBvdXQ6IHBhdGguam9pbihDT05GSUdfTUFUUklYX1JFTF9QQVRILCBmaWxlLnJlbFBhdGgpLFxyXG4gICAgICAgIH0pKSxcclxuICAgICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBpc1hNTChmaWxlUGF0aCkgJiYgQ09ORklHX01BVFJJWF9GSUxFUy5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpKSksXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFhNTElucHV0RmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZEZpbGVQYXRoOiBzdHJpbmcsIG1lcmdlRGlyUGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xyXG4gIH1cclxuICBjb25zdCBnYW1lSW5wdXRGaWxlcGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xyXG4gIGNvbnN0IG1lcmdlZEZpbGVQYXRoID0gcGF0aC5qb2luKG1lcmdlRGlyUGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xyXG4gIGNvbnN0IGJhY2t1cEZpbGVQYXRoID0gZ2FtZUlucHV0RmlsZXBhdGggKyBWT1JURVhfQkFDS1VQX1RBRztcclxuICB0cnkge1xyXG4gICAgbGV0IGlucHV0RmlsZURhdGE7XHJcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhtZXJnZWRGaWxlUGF0aCkpIHtcclxuICAgICAgaW5wdXRGaWxlRGF0YSA9IGZzLnJlYWRGaWxlQXN5bmMobWVyZ2VkRmlsZVBhdGgpO1xyXG4gICAgfSBlbHNlIGlmIChhd2FpdCBmaWxlRXhpc3RzKGJhY2t1cEZpbGVQYXRoKSkge1xyXG4gICAgICBpbnB1dEZpbGVEYXRhID0gZnMucmVhZEZpbGVBc3luYyhiYWNrdXBGaWxlUGF0aCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbnB1dEZpbGVEYXRhID0gZnMucmVhZEZpbGVBc3luYyhnYW1lSW5wdXRGaWxlcGF0aCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5wdXRGaWxlRGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gcmVhZCBtZXJnZWQvbmF0aXZlIHhtbCBmaWxlJywge1xyXG4gICAgICB0ZXh0OiAnQSBuYXRpdmUgWE1MIGZpbGUgaXMgbWlzc2luZy4gUGxlYXNlIHZlcmlmeSB5b3VyIGdhbWUgZmlsZXMgdGhyb3VnaCB0aGUgZ2FtZSBzdG9yZSBjbGllbnQuJyxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0Nsb3NlJywgZGVmYXVsdDogdHJ1ZSB9LFxyXG4gICAgXSwgJ3czLXhtbC1tZXJnZS1mYWlsJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gIH1cclxufVxyXG5cclxuLy8jcmVnaW9uIGV4cGVyaW1lbnRhbCBzZXR0aW5ncyBtZXJnZVxyXG4vLyBUaGlzIGlzIGFuIGV4cGVyaW1lbnRhbCBmZWF0dXJlIHRoYXQgd2lsbCBtZXJnZSBzZXR0aW5ncyBmaWxlcyBpbiB0aGUgZ2FtZSdzIGRvY3VtZW50cyBmb2xkZXIuXHJcbi8vICBjdXJyZW50bHkgdW51c2VkIGR1ZSB0byB0cm91Ymxlc29tZSBtaWdyYXRpb24gZnJvbSB0aGUgb2xkIHNldHRpbmdzIHN5c3RlbS5cclxuZXhwb3J0IGNvbnN0IGNhbk1lcmdlU2V0dGluZ3MgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIChnYW1lOiB0eXBlcy5JR2FtZSwgZ2FtZURpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkgPT4ge1xyXG4gICAgaWYgKGdhbWUuaWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIC8vIGlmIChpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcclxuICAgIC8vICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIC8vIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBiYXNlRmlsZXM6IChkZXBsb3llZEZpbGVzOiB0eXBlcy5JRGVwbG95ZWRGaWxlW10pID0+IGRlcGxveWVkRmlsZXNcclxuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gaXNTZXR0aW5nc0ZpbGUocGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpKSlcclxuICAgICAgICAubWFwKGZpbGUgPT4gKHtcclxuICAgICAgICAgIGluOiBwYXRoLmpvaW4oZ2V0RG9jdW1lbnRzUGF0aChnYW1lKSwgcGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpKSxcclxuICAgICAgICAgIG91dDogcGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpLFxyXG4gICAgICAgIH0pKSxcclxuICAgICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBpc1NldHRpbmdzRmlsZShmaWxlUGF0aCksXHJcbiAgICB9O1xyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBkb01lcmdlU2V0dGluZ3MgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBhc3luYyAobW9kRmlsZVBhdGg6IHN0cmluZywgdGFyZ2V0TWVyZ2VEaXI6IHN0cmluZykgPT4ge1xyXG4gIC8vIGlmIChpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcclxuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAvLyB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgbW9kSW5pRGF0YSA9IGluaS5wYXJzZShtb2REYXRhKTtcclxuICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5nc0ZpbGUgPSBhd2FpdCByZWFkU2V0dGluZ3NGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcclxuICAgIGNvbnN0IG1lcmdlZEluaURhdGEgPSBpbmkucGFyc2UoY3VycmVudFNldHRpbmdzRmlsZSk7XHJcbiAgICBPYmplY3Qua2V5cyhtb2RJbmlEYXRhKS5mb3JFYWNoKHNlY3Rpb24gPT4ge1xyXG4gICAgICBpZiAoIW1lcmdlZEluaURhdGFbc2VjdGlvbl0pIHtcclxuICAgICAgICBtZXJnZWRJbmlEYXRhW3NlY3Rpb25dID0gbW9kSW5pRGF0YVtzZWN0aW9uXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBPYmplY3Qua2V5cyhtb2RJbmlEYXRhW3NlY3Rpb25dKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICBtZXJnZWRJbmlEYXRhW3NlY3Rpb25dW2tleV0gPSBtb2RJbmlEYXRhW3NlY3Rpb25dW2tleV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG1lcmdlZEluaVN0cmluZyA9IGluaS5zdHJpbmdpZnkobWVyZ2VkSW5pRGF0YSk7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRhcmdldE1lcmdlRGlyKTtcclxuICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4odGFyZ2V0TWVyZ2VEaXIsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKSwgbWVyZ2VkSW5pU3RyaW5nKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgY29uc3QgbG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xyXG4gICAgY29uc3QgZXh0ZW5kZWRFcnIgPSB1dGlsLmRlZXBNZXJnZSh7IG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpciwgbWVzc2FnZTogZXJyLm1lc3NhZ2UsIHN0YWNrOiBlcnIuc3RhY2sgfSwgZXJyKTtcclxuICAgIGNvbnN0IG1lcmdlZERhdGEgPSBhd2FpdCByZWFkU2V0dGluZ3NGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcclxuICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2Ugc2V0dGluZ3MgZGF0YScsIGV4dGVuZGVkRXJyLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiB0cnVlLFxyXG4gICAgICBhdHRhY2htZW50czogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9sb2FkT3JkZXJgLFxyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAgZGF0YTogbG9hZE9yZGVyLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IGxvYWQgb3JkZXInXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbWVyZ2VkX3NldHRpbmdzYCxcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGRhdGE6IG1lcmdlZERhdGEsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ01lcmdlZCBzZXR0aW5ncydcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9tb2Rfc2V0dGluZ3NgLFxyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAgZGF0YTogbW9kRGF0YSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTW9kIHNldHRpbmdzJ1xyXG4gICAgICAgIH1cclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFNldHRpbmdzRmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZEZpbGVQYXRoOiBzdHJpbmcsIG1lcmdlRGlyUGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xyXG4gIH1cclxuICBjb25zdCBnYW1lU2V0dGluZ3NGaWxlcGF0aCA9IHBhdGguam9pbihnZXREb2N1bWVudHNQYXRoKGRpc2NvdmVyeSksIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcclxuICBjb25zdCBtZXJnZWRGaWxlUGF0aCA9IHBhdGguam9pbihtZXJnZURpclBhdGgsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcclxuICBjb25zdCBiYWNrdXBGaWxlUGF0aCA9IGdhbWVTZXR0aW5nc0ZpbGVwYXRoICsgVk9SVEVYX0JBQ0tVUF9UQUc7XHJcbiAgdHJ5IHtcclxuICAgIGlmIChhd2FpdCBmaWxlRXhpc3RzKG1lcmdlZEZpbGVQYXRoKSkge1xyXG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtZXJnZWRGaWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhiYWNrdXBGaWxlUGF0aCkpIHtcclxuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoYmFja3VwRmlsZVBhdGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoZ2FtZVNldHRpbmdzRmlsZXBhdGgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyNlbmRyZWdpb24iXX0=