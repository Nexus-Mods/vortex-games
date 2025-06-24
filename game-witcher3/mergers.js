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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Vycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUF3RDtBQUN4RCxtQ0FBcUQ7QUFFckQscUNBQW1HO0FBQ25HLDZDQUFzRDtBQUN0RCxpQ0FBNkU7QUFDN0UsOENBQXNCO0FBRXRCLE1BQU0saUJBQWtCLFNBQVEsaUJBQUksQ0FBQyxXQUFXO0lBQzlDLFlBQVksT0FBZSxFQUFFLFdBQW1CO1FBQzlDLEtBQUssQ0FBQyxHQUFHLE9BQU8sTUFBTSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWNNLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFLENBQUMsQ0FBTyxXQUFtQixFQUFFLGNBQXNCLEVBQUUsRUFBRTs7SUFDNUcsSUFBSTtRQUNGLE1BQU0sT0FBTyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsTUFBTSxTQUFTLEdBQUcsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsVUFBVSwwQ0FBRSxLQUFLLENBQUM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQWlCLENBQUMsc0NBQXNDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkYsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsY0FB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RSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEcsSUFBSSxDQUFDLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFFO1lBQ3BCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQztTQUM5RTtRQUNELE1BQU0sb0JBQW9CLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFBLHVCQUFnQixFQUFDLFNBQVMsQ0FBQyxFQUFFLGNBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNoRyxNQUFNLGNBQWMsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxjQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDM0UsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLEdBQUcsMEJBQWlCLENBQUM7UUFDaEUsSUFBSTtZQUNGLElBQUksTUFBTSxJQUFBLGlCQUFVLEVBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ3BDLE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUN6QztZQUNELElBQUksTUFBTSxJQUFBLGlCQUFVLEVBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ3BDLE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUN6QztZQUNELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQy9DO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZnMsIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgQnVpbGRlciwgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIENPTkZJR19NQVRSSVhfRklMRVMsIFZPUlRFWF9CQUNLVVBfVEFHIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuaW1wb3J0IHsgZmlsZUV4aXN0cywgZ2V0RG9jdW1lbnRzUGF0aCwgaXNTZXR0aW5nc0ZpbGUsIGlzWE1MIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IGluaSBmcm9tICdpbmknO1xyXG5cclxuY2xhc3MgTW9kWE1MRGF0YUludmFsaWQgZXh0ZW5kcyB1dGlsLkRhdGFJbnZhbGlkIHtcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIG1vZEZpbGVQYXRoOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKGAke21lc3NhZ2V9OlxcbiR7bW9kRmlsZVBhdGh9YCk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBFeGFtcGxlIG9mIGhvdyB3ZSBleHBlY3QgdGhlIHZhcnMgdG8gYmUgd3JhcHBlZDpcclxuLy8gPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLTE2XCI/PlxyXG4vLyA8VXNlckNvbmZpZz5cclxuLy8gXHQ8R3JvdXAgYnVpbGRlcj1cIklucHV0XCIgaWQ9XCJQQ0lucHV0XCIgZGlzcGxheU5hbWU9XCJjb250cm9sc19wY1wiIHRhZ3M9XCJrZXliaW5kc1wiPlxyXG4vLyBcdFx0PFZpc2libGVWYXJzPlxyXG4vLyBcdFx0XHQ8VmFyIGJ1aWxkZXI9XCJJbnB1dFwiIGlkPVwiTW92ZUZ3ZFwiXHRcdFx0XHRcdGRpc3BsYXlOYW1lPVwibW92ZV9mb3J3YXJkXCJcdFx0XHRcdFx0XHRkaXNwbGF5VHlwZT1cIklOUFVUUENcIiBhY3Rpb25zPVwiTW92ZUZvcndhcmQ7TW92ZW1lbnREb3VibGVUYXBXO0NoYW5nZUNob2ljZVVwXCIvPlxyXG4vLyBcdFx0XHQ8VmFyIGJ1aWxkZXI9XCJJbnB1dFwiIGlkPVwiTW92ZUJja1wiXHRcdFx0XHRcdGRpc3BsYXlOYW1lPVwibW92ZV9iYWNrXCJcdFx0XHRcdFx0XHRcdGRpc3BsYXlUeXBlPVwiSU5QVVRQQ1wiIGFjdGlvbnM9XCJNb3ZlQmFja3dhcmQ7TW92ZW1lbnREb3VibGVUYXBTO0NoYW5nZUNob2ljZURvd247R0lfRGVjZWxlcmF0ZVwiLz5cclxuLy8gICAgIDwvVmlzaWJsZVZhcnM+XHJcbi8vIFx0PC9Hcm91cD5cclxuLy8gPC9Vc2VyQ29uZmlnPlxyXG4vLyBBZGRpbmcgYSBncm91cCB3aXRoIGEgZGlmZmVyZW50IGlkIHdpbGwgY3JlYXRlIGEgbmV3IGdyb3VwIGluIHRoZSBnYW1lJ3MgaW5wdXQueG1sXHJcbi8vICBmaWxlLCBpZiB0aGUgZ3JvdXAgYWxyZWFkeSBleGlzdHMgaXQgd2lsbCBtZXJnZSB0aGUgdmFycyBpbnRvIHRoZSBleGlzdGluZyBncm91cC5cclxuZXhwb3J0IGNvbnN0IGRvTWVyZ2VYTUwgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBhc3luYyAobW9kRmlsZVBhdGg6IHN0cmluZywgdGFyZ2V0TWVyZ2VEaXI6IHN0cmluZykgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RGaWxlUGF0aCk7XHJcbiAgICBjb25zdCBtb2RYbWwgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UobW9kRGF0YSk7XHJcbiAgICBjb25zdCBtb2RHcm91cHMgPSBtb2RYbWw/LlVzZXJDb25maWc/Lkdyb3VwO1xyXG4gICAgaWYgKCFtb2RHcm91cHMpIHtcclxuICAgICAgY29uc3QgZXJyID0gbmV3IE1vZFhNTERhdGFJbnZhbGlkKCdJbnZhbGlkIFhNTCBkYXRhIC0gaW5mb3JtIG1vZCBhdXRob3InLCBtb2RGaWxlUGF0aCk7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBYTUwgZGF0YScsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGN1cnJlbnRJbnB1dEZpbGUgPSBhd2FpdCByZWFkWE1MSW5wdXRGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcclxuICAgIGNvbnN0IG1lcmdlZFhtbERhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoY3VycmVudElucHV0RmlsZSk7XHJcbiAgICBtb2RHcm91cHMuZm9yRWFjaChtb2RHcm91cCA9PiB7XHJcbiAgICAgIGNvbnN0IGdhbWVHcm91cHMgPSBtZXJnZWRYbWxEYXRhPy5Vc2VyQ29uZmlnPy5Hcm91cDtcclxuICAgICAgY29uc3QgbW9kVmFycyA9IG1vZEdyb3VwPy5WaXNpYmxlVmFycz8uWzBdPy5WYXI7XHJcbiAgICAgIGNvbnN0IGdhbWVHcm91cCA9IGdhbWVHcm91cHMuZmluZChncm91cCA9PiBncm91cD8uJD8uaWQgPT09IG1vZEdyb3VwPy4kPy5pZCk7XHJcbiAgICAgIGlmIChnYW1lR3JvdXApIHtcclxuICAgICAgICBjb25zdCBnYW1lVmFycyA9IGdhbWVHcm91cD8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xyXG4gICAgICAgIG1vZFZhcnMuZm9yRWFjaChtb2RWYXIgPT4ge1xyXG4gICAgICAgICAgY29uc3QgZ2FtZVZhciA9IGdhbWVWYXJzLmZpbmQodiA9PiB2Py4kPy5pZCA9PT0gbW9kVmFyPy4kPy5pZCk7XHJcbiAgICAgICAgICBpZiAoZ2FtZVZhcikge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGdhbWVWYXIsIG1vZFZhcik7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnYW1lVmFycy5wdXNoKG1vZFZhcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZ2FtZUdyb3Vwcy5wdXNoKG1vZEdyb3VwKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoeyBkb2N0eXBlOiB7IGR0ZDogJ1VURi0xNicgfSB9KTtcclxuICAgIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QobWVyZ2VkWG1sRGF0YSk7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCkpO1xyXG4gICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpLCB4bWwpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKGFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcclxuICAgIGlmICghYWN0aXZlUHJvZmlsZT8uaWQpIHtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIFhNTCBkYXRhJywgJ05vIGFjdGl2ZSBwcm9maWxlIGZvdW5kJywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICAgIGNvbnN0IGV4dGVuZGVkRXJyID0gdXRpbC5kZWVwTWVyZ2UoeyBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIsIG1lc3NhZ2U6IGVyci5tZXNzYWdlLCBzdGFjazogZXJyLnN0YWNrIH0sIGVycik7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2UgWE1MIGRhdGEnLCBleHRlbmRlZEVyciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcclxuICAgICAgYXR0YWNobWVudHM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbG9hZE9yZGVyYCxcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGRhdGE6IGxvYWRPcmRlcixcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBsb2FkIG9yZGVyJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjYW5NZXJnZVhNTCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gKGdhbWUsIGdhbWVEaXNjb3ZlcnkpID0+IHtcclxuICAgIGlmIChnYW1lLmlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYmFzZUZpbGVzOiAoZGVwbG95ZWRGaWxlczogdHlwZXMuSURlcGxveWVkRmlsZVtdKSA9PiBkZXBsb3llZEZpbGVzXHJcbiAgICAgICAgLmZpbHRlcihmaWxlID0+IGlzWE1MKGZpbGUucmVsUGF0aCkpXHJcbiAgICAgICAgLm1hcChmaWxlID0+ICh7XHJcbiAgICAgICAgICBpbjogcGF0aC5qb2luKGdhbWVEaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgZmlsZS5yZWxQYXRoKSxcclxuICAgICAgICAgIG91dDogcGF0aC5qb2luKENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIGZpbGUucmVsUGF0aCksXHJcbiAgICAgICAgfSkpLFxyXG4gICAgICBmaWx0ZXI6IGZpbGVQYXRoID0+IGlzWE1MKGZpbGVQYXRoKSAmJiBDT05GSUdfTUFUUklYX0ZJTEVTLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZmlsZVBhdGgsIHBhdGguZXh0bmFtZShmaWxlUGF0aCkpKSxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkWE1MSW5wdXRGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kRmlsZVBhdGg6IHN0cmluZywgbWVyZ2VEaXJQYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCh7IGNvZGU6ICdFTk9FTlQnLCBtZXNzYWdlOiAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IGdhbWVJbnB1dEZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XHJcbiAgY29uc3QgbWVyZ2VkRmlsZVBhdGggPSBwYXRoLmpvaW4obWVyZ2VEaXJQYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XHJcbiAgY29uc3QgYmFja3VwRmlsZVBhdGggPSBnYW1lSW5wdXRGaWxlcGF0aCArIFZPUlRFWF9CQUNLVVBfVEFHO1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhtZXJnZWRGaWxlUGF0aCkpIHtcclxuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMobWVyZ2VkRmlsZVBhdGgpO1xyXG4gICAgfVxyXG4gICAgaWYgKGF3YWl0IGZpbGVFeGlzdHMoYmFja3VwRmlsZVBhdGgpKSB7XHJcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGJhY2t1cEZpbGVQYXRoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGdhbWVJbnB1dEZpbGVwYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gcmVhZCBtZXJnZWQvbmF0aXZlIHhtbCBmaWxlJywge1xyXG4gICAgICB0ZXh0OiAnVGhlIG9yaWdpbmFsL25hdGl2ZSBYTUwgZmlsZSBpcyBtaXNzaW5nLiBXb3VsZCB5b3UgbGlrZSB0byB1c2UgdGhlIG1vZCBmaWxlIGluc3RlYWQ/JyxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ1VzZSBNb2QgRmlsZScgfSxcclxuICAgICAgeyBsYWJlbDogJ1NraXAnLCBkZWZhdWx0OiB0cnVlIH0sXHJcbiAgICBdLCAndzMteG1sLW1lcmdlLWZhaWwnKTtcclxuICAgIGlmIChyZXMuYWN0aW9uID09PSAnVXNlIE1vZCBGaWxlJykge1xyXG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtb2RGaWxlUGF0aCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCcnKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8vI3JlZ2lvbiBleHBlcmltZW50YWwgc2V0dGluZ3MgbWVyZ2VcclxuLy8gVGhpcyBpcyBhbiBleHBlcmltZW50YWwgZmVhdHVyZSB0aGF0IHdpbGwgbWVyZ2Ugc2V0dGluZ3MgZmlsZXMgaW4gdGhlIGdhbWUncyBkb2N1bWVudHMgZm9sZGVyLlxyXG4vLyAgY3VycmVudGx5IHVudXNlZCBkdWUgdG8gdHJvdWJsZXNvbWUgbWlncmF0aW9uIGZyb20gdGhlIG9sZCBzZXR0aW5ncyBzeXN0ZW0uXHJcbmV4cG9ydCBjb25zdCBjYW5NZXJnZVNldHRpbmdzID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xyXG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUsIGdhbWVEaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpID0+IHtcclxuICAgIGlmIChnYW1lLmlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICAvLyBpZiAoaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgICAvLyAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYmFzZUZpbGVzOiAoZGVwbG95ZWRGaWxlczogdHlwZXMuSURlcGxveWVkRmlsZVtdKSA9PiBkZXBsb3llZEZpbGVzXHJcbiAgICAgICAgLmZpbHRlcihmaWxlID0+IGlzU2V0dGluZ3NGaWxlKHBhdGguYmFzZW5hbWUoZmlsZS5yZWxQYXRoKSkpXHJcbiAgICAgICAgLm1hcChmaWxlID0+ICh7XHJcbiAgICAgICAgICBpbjogcGF0aC5qb2luKGdldERvY3VtZW50c1BhdGgoZ2FtZSksIHBhdGguYmFzZW5hbWUoZmlsZS5yZWxQYXRoKSksXHJcbiAgICAgICAgICBvdXQ6IHBhdGguYmFzZW5hbWUoZmlsZS5yZWxQYXRoKSxcclxuICAgICAgICB9KSksXHJcbiAgICAgIGZpbHRlcjogZmlsZVBhdGggPT4gaXNTZXR0aW5nc0ZpbGUoZmlsZVBhdGgpLFxyXG4gICAgfTtcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZG9NZXJnZVNldHRpbmdzID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gYXN5bmMgKG1vZEZpbGVQYXRoOiBzdHJpbmcsIHRhcmdldE1lcmdlRGlyOiBzdHJpbmcpID0+IHtcclxuICAvLyBpZiAoaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgLy8gfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IG1vZEluaURhdGEgPSBpbmkucGFyc2UobW9kRGF0YSk7XHJcbiAgICBjb25zdCBjdXJyZW50U2V0dGluZ3NGaWxlID0gYXdhaXQgcmVhZFNldHRpbmdzRmlsZShhcGksIG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpcik7XHJcbiAgICBjb25zdCBtZXJnZWRJbmlEYXRhID0gaW5pLnBhcnNlKGN1cnJlbnRTZXR0aW5nc0ZpbGUpO1xyXG4gICAgT2JqZWN0LmtleXMobW9kSW5pRGF0YSkuZm9yRWFjaChzZWN0aW9uID0+IHtcclxuICAgICAgaWYgKCFtZXJnZWRJbmlEYXRhW3NlY3Rpb25dKSB7XHJcbiAgICAgICAgbWVyZ2VkSW5pRGF0YVtzZWN0aW9uXSA9IG1vZEluaURhdGFbc2VjdGlvbl07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgT2JqZWN0LmtleXMobW9kSW5pRGF0YVtzZWN0aW9uXSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgbWVyZ2VkSW5pRGF0YVtzZWN0aW9uXVtrZXldID0gbW9kSW5pRGF0YVtzZWN0aW9uXVtrZXldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBtZXJnZWRJbmlTdHJpbmcgPSBpbmkuc3RyaW5naWZ5KG1lcmdlZEluaURhdGEpO1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyh0YXJnZXRNZXJnZURpcik7XHJcbiAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKHRhcmdldE1lcmdlRGlyLCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSksIG1lcmdlZEluaVN0cmluZyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICAgIGNvbnN0IGV4dGVuZGVkRXJyID0gdXRpbC5kZWVwTWVyZ2UoeyBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIsIG1lc3NhZ2U6IGVyci5tZXNzYWdlLCBzdGFjazogZXJyLnN0YWNrIH0sIGVycik7XHJcbiAgICBjb25zdCBtZXJnZWREYXRhID0gYXdhaXQgcmVhZFNldHRpbmdzRmlsZShhcGksIG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpcik7XHJcbiAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIHNldHRpbmdzIGRhdGEnLCBleHRlbmRlZEVyciwge1xyXG4gICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcclxuICAgICAgYXR0YWNobWVudHM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbG9hZE9yZGVyYCxcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGRhdGE6IGxvYWRPcmRlcixcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBsb2FkIG9yZGVyJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X21lcmdlZF9zZXR0aW5nc2AsXHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBkYXRhOiBtZXJnZWREYXRhLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdNZXJnZWQgc2V0dGluZ3MnXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbW9kX3NldHRpbmdzYCxcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGRhdGE6IG1vZERhdGEsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ01vZCBzZXR0aW5ncydcclxuICAgICAgICB9XHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRTZXR0aW5nc0ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2RGaWxlUGF0aDogc3RyaW5nLCBtZXJnZURpclBhdGg6IHN0cmluZykge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoIWRpc2NvdmVyeT8ucGF0aCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHsgY29kZTogJ0VOT0VOVCcsIG1lc3NhZ2U6ICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJyB9KTtcclxuICB9XHJcbiAgY29uc3QgZ2FtZVNldHRpbmdzRmlsZXBhdGggPSBwYXRoLmpvaW4oZ2V0RG9jdW1lbnRzUGF0aChkaXNjb3ZlcnkpLCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XHJcbiAgY29uc3QgbWVyZ2VkRmlsZVBhdGggPSBwYXRoLmpvaW4obWVyZ2VEaXJQYXRoLCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XHJcbiAgY29uc3QgYmFja3VwRmlsZVBhdGggPSBnYW1lU2V0dGluZ3NGaWxlcGF0aCArIFZPUlRFWF9CQUNLVVBfVEFHO1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhtZXJnZWRGaWxlUGF0aCkpIHtcclxuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMobWVyZ2VkRmlsZVBhdGgpO1xyXG4gICAgfVxyXG4gICAgaWYgKGF3YWl0IGZpbGVFeGlzdHMoYmFja3VwRmlsZVBhdGgpKSB7XHJcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGJhY2t1cEZpbGVQYXRoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGdhbWVTZXR0aW5nc0ZpbGVwYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuLy8jZW5kcmVnaW9uIl19