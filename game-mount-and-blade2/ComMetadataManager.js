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
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const DEP_XML_ELEMENT = 'DependedModuleMetadata';
class ComMetadataManager {
    constructor(api) {
        this.mApi = api;
        this.mDependencyMap = undefined;
    }
    sort(loadOrder) {
        const sorted = [...loadOrder].sort((lhs, rhs) => {
            var _a, _b;
            const testDeps = (deps, subModId) => {
                if (deps !== undefined) {
                    const match = deps.find(dep => dep.id === subModId);
                    if (match !== undefined) {
                        return (match.order !== undefined)
                            ? match.order === 'LoadAfterThis'
                                ? -1 : 1
                            : 0;
                    }
                    else {
                        return 0;
                    }
                }
            };
            const lhsDeps = (_a = this.mDependencyMap[lhs]) === null || _a === void 0 ? void 0 : _a.dependencies;
            const rhsDeps = (_b = this.mDependencyMap[rhs]) === null || _b === void 0 ? void 0 : _b.dependencies;
            const lhsRes = testDeps(lhsDeps, rhs);
            if (lhsRes !== 0) {
                return lhsRes;
            }
            const rhsRes = testDeps(rhsDeps, lhs);
            if (rhsRes !== 0) {
                return rhsRes;
            }
            return 0;
        });
        return sorted;
    }
    updateDependencyMap(profileId) {
        return __awaiter(this, void 0, void 0, function* () {
            const props = (0, util_1.genProps)(this.mApi, profileId);
            if (props === undefined) {
                this.mApi.showErrorNotification('Failed to update Dependency map', 'Game is not discovered and/or profile is invalid', { allowReport: false });
                return;
            }
            this.mDependencyMap = yield this.genDependencyMap(props);
        });
    }
    parseSubModFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const getAttributeValue = (node, attrib, optional = true) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const value = node.attr(attrib).value();
                    return Promise.resolve(value);
                }
                catch (err) {
                    return optional
                        ? Promise.resolve(undefined)
                        : Promise.reject(new Error(`missing ${attrib}`));
                }
            });
            let subModId;
            const dependencies = [];
            try {
                const data = yield (0, util_1.getXMLData)(filePath);
                subModId = data.get('//Id').attr('value').value();
                const depNodes = data.find(`//${DEP_XML_ELEMENT}`);
                for (const node of depNodes) {
                    try {
                        const dep = {
                            id: yield getAttributeValue(node, 'id', false),
                            optional: (yield getAttributeValue(node, 'optional')) === 'true',
                            order: yield getAttributeValue(node, 'order'),
                            version: yield getAttributeValue(node, 'version'),
                            incompatible: (yield getAttributeValue(node, 'incompatible')) === 'true',
                        };
                        dependencies.push(dep);
                    }
                    catch (err) {
                        (0, vortex_api_1.log)('error', 'unable to parse community dependency', err);
                    }
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'failed to parse SubModule.xml', err);
                return;
            }
            return { id: subModId, dependencies };
        });
    }
    findSubModFiles(modPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileEntries = [];
            try {
                yield (0, turbowalk_1.default)(modPath, entries => {
                    const filtered = entries.filter(entry => !entry.isDirectory
                        && path_1.default.basename(entry.filePath).toLowerCase() === common_1.SUBMOD_FILE);
                    fileEntries = fileEntries.concat(filtered);
                }).catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
                    ? Promise.resolve()
                    : Promise.reject(err));
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'unable to find submodule files', err);
                return fileEntries;
            }
            return fileEntries;
        });
    }
    genDependencyMap(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const { state, enabledMods } = props;
            const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const depMap = {};
            for (const modId of Object.keys(enabledMods)) {
                const mod = enabledMods[modId];
                if ((mod === null || mod === void 0 ? void 0 : mod.installationPath) === undefined) {
                    continue;
                }
                const modFolder = path_1.default.join(stagingFolder, mod.installationPath);
                const subModFiles = yield this.findSubModFiles(modFolder);
                for (const subModFile of subModFiles) {
                    const subModData = yield this.parseSubModFile(subModFile.filePath);
                    if ((subModData === null || subModData === void 0 ? void 0 : subModData.id) !== undefined) {
                        depMap[subModData.id] = subModData;
                    }
                }
            }
            return depMap;
        });
    }
}
exports.default = ComMetadataManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tTWV0YWRhdGFNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29tTWV0YWRhdGFNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDBEQUE4QztBQUM5QywyQ0FBNkQ7QUFFN0QscUNBQWdEO0FBRWhELGlDQUE4QztBQUU5QyxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQztBQUlqRCxNQUFNLGtCQUFrQjtJQUd0QixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxJQUFJLENBQUMsU0FBbUI7UUFDN0IsTUFBTSxNQUFNLEdBQUcsQ0FBRSxHQUFHLFNBQVMsQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTs7WUFDaEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFtQixFQUFFLFFBQWdCLEVBQVUsRUFBRTtnQkFDakUsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDcEQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO3dCQUN2QixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7NEJBQ2hDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLGVBQWU7Z0NBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDVixDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNQO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxDQUFDO3FCQUNWO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDO1lBQ0YsTUFB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Q0Y7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO0tBQUE7Q0FDRjtBQUVELGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRWxlbWVudCB9IGZyb20gJ2xpYnhtbGpzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU1VCTU9EX0ZJTEUgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElEZXBlbmRlbmN5LCBJUHJvcHMsIElTdWJNb2R1bGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuUHJvcHMsIGdldFhNTERhdGEgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgREVQX1hNTF9FTEVNRU5UID0gJ0RlcGVuZGVkTW9kdWxlTWV0YWRhdGEnO1xyXG5cclxuLy8gVGhpcyBjb21wb25lbnQgYWltcyB0byBjYXRlciBmb3IgdGhlIGNvbW11bml0eSBkZXZlbG9wZWQgbWV0YWRhdGFcclxuLy8gIHNvcnRpbmcgbWV0aG9kb2xvZ3kuXHJcbmNsYXNzIENvbU1ldGFkYXRhTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbURlcGVuZGVuY3lNYXA6IHsgW3N1Yk1vZElkOiBzdHJpbmddOiBJU3ViTW9kdWxlIH07XHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1EZXBlbmRlbmN5TWFwID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNvcnQobG9hZE9yZGVyOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IHNvcnRlZCA9IFsgLi4ubG9hZE9yZGVyIF0uc29ydCgobGhzLCByaHMpID0+IHtcclxuICAgICAgY29uc3QgdGVzdERlcHMgPSAoZGVwczogSURlcGVuZGVuY3lbXSwgc3ViTW9kSWQ6IHN0cmluZyk6IG51bWJlciA9PiB7XHJcbiAgICAgICAgaWYgKGRlcHMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBkZXBzLmZpbmQoZGVwID0+IGRlcC5pZCA9PT0gc3ViTW9kSWQpO1xyXG4gICAgICAgICAgaWYgKG1hdGNoICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChtYXRjaC5vcmRlciAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgID8gbWF0Y2gub3JkZXIgPT09ICdMb2FkQWZ0ZXJUaGlzJ1xyXG4gICAgICAgICAgICAgICAgPyAtMSA6IDFcclxuICAgICAgICAgICAgICA6IDA7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IGxoc0RlcHMgPSB0aGlzLm1EZXBlbmRlbmN5TWFwW2xoc10/LmRlcGVuZGVuY2llcztcclxuICAgICAgY29uc3QgcmhzRGVwcyA9IHRoaXMubURlcGVuZGVuY3lNYXBbcmhzXT8uZGVwZW5kZW5jaWVzO1xyXG4gICAgICBjb25zdCBsaHNSZXMgPSB0ZXN0RGVwcyhsaHNEZXBzLCByaHMpO1xyXG4gICAgICBpZiAobGhzUmVzICE9PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGxoc1JlcztcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByaHNSZXMgPSB0ZXN0RGVwcyhyaHNEZXBzLCBsaHMpO1xyXG4gICAgICBpZiAocmhzUmVzICE9PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHJoc1JlcztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHNvcnRlZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyB1cGRhdGVEZXBlbmRlbmN5TWFwKHByb2ZpbGVJZD86IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKHRoaXMubUFwaSwgcHJvZmlsZUlkKTtcclxuICAgIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB1cGRhdGUgRGVwZW5kZW5jeSBtYXAnLFxyXG4gICAgICAgICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkIGFuZC9vciBwcm9maWxlIGlzIGludmFsaWQnLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tRGVwZW5kZW5jeU1hcCA9IGF3YWl0IHRoaXMuZ2VuRGVwZW5kZW5jeU1hcChwcm9wcyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIHBhcnNlU3ViTW9kRmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJU3ViTW9kdWxlPiB7XHJcbiAgICBjb25zdCBnZXRBdHRyaWJ1dGVWYWx1ZSA9IGFzeW5jIChub2RlOiBhbnksIGF0dHJpYjogc3RyaW5nLCBvcHRpb25hbDogYm9vbGVhbiA9IHRydWUpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IG5vZGUuYXR0cihhdHRyaWIpLnZhbHVlKCk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWx1ZSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBvcHRpb25hbFxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYG1pc3NpbmcgJHthdHRyaWJ9YCkpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBzdWJNb2RJZDtcclxuICAgIGNvbnN0IGRlcGVuZGVuY2llczogSURlcGVuZGVuY3lbXSA9IFtdO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEoZmlsZVBhdGgpO1xyXG4gICAgICBzdWJNb2RJZCA9IGRhdGEuZ2V0PEVsZW1lbnQ+KCcvL0lkJykuYXR0cigndmFsdWUnKS52YWx1ZSgpO1xyXG4gICAgICBjb25zdCBkZXBOb2RlcyA9IGRhdGEuZmluZChgLy8ke0RFUF9YTUxfRUxFTUVOVH1gKTtcclxuICAgICAgZm9yIChjb25zdCBub2RlIG9mIGRlcE5vZGVzKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IGRlcDogSURlcGVuZGVuY3kgPSB7XHJcbiAgICAgICAgICAgIGlkOiBhd2FpdCBnZXRBdHRyaWJ1dGVWYWx1ZShub2RlLCAnaWQnLCBmYWxzZSksXHJcbiAgICAgICAgICAgIG9wdGlvbmFsOiBhd2FpdCBnZXRBdHRyaWJ1dGVWYWx1ZShub2RlLCAnb3B0aW9uYWwnKSA9PT0gJ3RydWUnLFxyXG4gICAgICAgICAgICBvcmRlcjogYXdhaXQgZ2V0QXR0cmlidXRlVmFsdWUobm9kZSwgJ29yZGVyJyksXHJcbiAgICAgICAgICAgIHZlcnNpb246IGF3YWl0IGdldEF0dHJpYnV0ZVZhbHVlKG5vZGUsICd2ZXJzaW9uJyksXHJcbiAgICAgICAgICAgIGluY29tcGF0aWJsZTogYXdhaXQgZ2V0QXR0cmlidXRlVmFsdWUobm9kZSwgJ2luY29tcGF0aWJsZScpID09PSAndHJ1ZScsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgZGVwZW5kZW5jaWVzLnB1c2goZGVwKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHBhcnNlIGNvbW11bml0eSBkZXBlbmRlbmN5JywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBXZSdyZSBzaW1wbHkgZ29pbmcgdG8gbG9nIGF0IHRoaXMgc3RhZ2U7IHRvbyBtYW55XHJcbiAgICAgIC8vICBtb2RzIGhhdmUgaGFkIGludmFsaWQgc3ViTW9kdWxlIGZpbGVzIGluIHRoZSBwYXN0XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFN1Yk1vZHVsZS54bWwnLCBlcnIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgaWQ6IHN1Yk1vZElkLCBkZXBlbmRlbmNpZXMgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZmluZFN1Yk1vZEZpbGVzKG1vZFBhdGg6IHN0cmluZykge1xyXG4gICAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHR1cmJvd2Fsayhtb2RQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeVxyXG4gICAgICAgICAgJiYgcGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gICAgICAgIGZpbGVFbnRyaWVzID0gZmlsZUVudHJpZXMuY29uY2F0KGZpbHRlcmVkKTtcclxuICAgICAgfSkuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIFRoZSBhYmlsaXR5IHRvIHNvcnQgdGhlIHVzZXIncyBtb2RzIHVzaW5nIHRoZSBjb21tdW5pdHlcclxuICAgICAgLy8gIGRldmVsb3BlZCBtZXRhZGF0YSBpcyBhIG5pY2UgdG8gaGF2ZSAtIGJ1dCBub3QgYSBiaWcgZGVhbCBpZlxyXG4gICAgICAvLyAgd2UgY2FuJ3QgZG8gaXQgZm9yIHdoYXRldmVyIHJlYXNvbi5cclxuICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gZmluZCBzdWJtb2R1bGUgZmlsZXMnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gZmlsZUVudHJpZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZpbGVFbnRyaWVzO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBnZW5EZXBlbmRlbmN5TWFwKHByb3BzOiBJUHJvcHMpOiBQcm9taXNlPHsgW3N1Yk1vZElkOiBzdHJpbmddOiBJU3ViTW9kdWxlOyB9PiB7XHJcbiAgICBjb25zdCB7IHN0YXRlLCBlbmFibGVkTW9kcyB9ID0gcHJvcHM7XHJcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBkZXBNYXA6IHsgW3N1Yk1vZElkOiBzdHJpbmddOiBJU3ViTW9kdWxlIH0gPSB7fTtcclxuICAgIGZvciAoY29uc3QgbW9kSWQgb2YgT2JqZWN0LmtleXMoZW5hYmxlZE1vZHMpKSB7XHJcbiAgICAgIGNvbnN0IG1vZCA9IGVuYWJsZWRNb2RzW21vZElkXTtcclxuICAgICAgaWYgKG1vZD8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1vZEZvbGRlciA9IHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZEZpbGVzID0gYXdhaXQgdGhpcy5maW5kU3ViTW9kRmlsZXMobW9kRm9sZGVyKTtcclxuICAgICAgZm9yIChjb25zdCBzdWJNb2RGaWxlIG9mIHN1Yk1vZEZpbGVzKSB7XHJcbiAgICAgICAgY29uc3Qgc3ViTW9kRGF0YTogSVN1Yk1vZHVsZSA9IGF3YWl0IHRoaXMucGFyc2VTdWJNb2RGaWxlKHN1Yk1vZEZpbGUuZmlsZVBhdGgpO1xyXG4gICAgICAgIGlmIChzdWJNb2REYXRhPy5pZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBkZXBNYXBbc3ViTW9kRGF0YS5pZF0gPSBzdWJNb2REYXRhO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZXBNYXA7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDb21NZXRhZGF0YU1hbmFnZXI7XHJcbiJdfQ==