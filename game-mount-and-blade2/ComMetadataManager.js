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
const DEP_XML_LIST = 'DependedModuleMetadatas';
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
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            const getAttrValue = (node, attr, optional = true) => {
                var _a;
                try {
                    const value = (_a = node === null || node === void 0 ? void 0 : node.$) === null || _a === void 0 ? void 0 : _a[attr];
                    return Promise.resolve(value);
                }
                catch (err) {
                    return optional
                        ? Promise.resolve(undefined)
                        : Promise.reject(new Error(`missing ${attr}`));
                }
            };
            let subModId;
            const dependencies = [];
            try {
                const data = yield (0, util_1.getXMLData)(filePath);
                subModId = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.Module) === null || _a === void 0 ? void 0 : _a.Id) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.$) === null || _d === void 0 ? void 0 : _d.value;
                const depNodes = (_g = (_f = (_e = data === null || data === void 0 ? void 0 : data.Module) === null || _e === void 0 ? void 0 : _e.DependedModuleMetadatas) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.DependedModuleMetadata;
                for (const node of depNodes) {
                    try {
                        const dep = {
                            id: yield getAttrValue(node, 'id', false),
                            optional: (yield getAttrValue(node, 'optional')) === 'true',
                            order: yield getAttrValue(node, 'order'),
                            version: yield getAttrValue(node, 'version'),
                            incompatible: (yield getAttrValue(node, 'incompatible')) === 'true',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tTWV0YWRhdGFNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29tTWV0YWRhdGFNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDBEQUE4QztBQUM5QywyQ0FBNkQ7QUFFN0QscUNBQWdEO0FBRWhELGlDQUE4QztBQUU5QyxNQUFNLFlBQVksR0FBRyx5QkFBeUIsQ0FBQztBQUMvQyxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQztBQUlqRCxNQUFNLGtCQUFrQjtJQUd0QixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxJQUFJLENBQUMsU0FBbUI7UUFDN0IsTUFBTSxNQUFNLEdBQUcsQ0FBRSxHQUFHLFNBQVMsQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTs7WUFDaEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFtQixFQUFFLFFBQWdCLEVBQVUsRUFBRTtnQkFDakUsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDcEQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO3dCQUN2QixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7NEJBQ2hDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLGVBQWU7Z0NBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDVixDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNQO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxDQUFDO3FC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YUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxFQUFFLE1BQUssU0FBUyxFQUFFO3dCQUNoQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQztxQkFDcEM7aUJBQ0Y7YUFDRjtZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7S0FBQTtDQUNGO0FBRUQsa0JBQWUsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBTVUJNT0RfRklMRSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSURlcGVuZGVuY3ksIElQcm9wcywgSVN1Yk1vZHVsZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZW5Qcm9wcywgZ2V0WE1MRGF0YSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBERVBfWE1MX0xJU1QgPSAnRGVwZW5kZWRNb2R1bGVNZXRhZGF0YXMnO1xyXG5jb25zdCBERVBfWE1MX0VMRU1FTlQgPSAnRGVwZW5kZWRNb2R1bGVNZXRhZGF0YSc7XHJcblxyXG4vLyBUaGlzIGNvbXBvbmVudCBhaW1zIHRvIGNhdGVyIGZvciB0aGUgY29tbXVuaXR5IGRldmVsb3BlZCBtZXRhZGF0YVxyXG4vLyAgc29ydGluZyBtZXRob2RvbG9neS5cclxuY2xhc3MgQ29tTWV0YWRhdGFNYW5hZ2VyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtRGVwZW5kZW5jeU1hcDogeyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGUgfTtcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubURlcGVuZGVuY3lNYXAgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc29ydChsb2FkT3JkZXI6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xyXG4gICAgY29uc3Qgc29ydGVkID0gWyAuLi5sb2FkT3JkZXIgXS5zb3J0KChsaHMsIHJocykgPT4ge1xyXG4gICAgICBjb25zdCB0ZXN0RGVwcyA9IChkZXBzOiBJRGVwZW5kZW5jeVtdLCBzdWJNb2RJZDogc3RyaW5nKTogbnVtYmVyID0+IHtcclxuICAgICAgICBpZiAoZGVwcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IGRlcHMuZmluZChkZXAgPT4gZGVwLmlkID09PSBzdWJNb2RJZCk7XHJcbiAgICAgICAgICBpZiAobWF0Y2ggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKG1hdGNoLm9yZGVyICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgPyBtYXRjaC5vcmRlciA9PT0gJ0xvYWRBZnRlclRoaXMnXHJcbiAgICAgICAgICAgICAgICA/IC0xIDogMVxyXG4gICAgICAgICAgICAgIDogMDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgY29uc3QgbGhzRGVwcyA9IHRoaXMubURlcGVuZGVuY3lNYXBbbGhzXT8uZGVwZW5kZW5jaWVzO1xyXG4gICAgICBjb25zdCByaHNEZXBzID0gdGhpcy5tRGVwZW5kZW5jeU1hcFtyaHNdPy5kZXBlbmRlbmNpZXM7XHJcbiAgICAgIGNvbnN0IGxoc1JlcyA9IHRlc3REZXBzKGxoc0RlcHMsIHJocyk7XHJcbiAgICAgIGlmIChsaHNSZXMgIT09IDApIHtcclxuICAgICAgICByZXR1cm4gbGhzUmVzO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJoc1JlcyA9IHRlc3REZXBzKHJoc0RlcHMsIGxocyk7XHJcbiAgICAgIGlmIChyaHNSZXMgIT09IDApIHtcclxuICAgICAgICByZXR1cm4gcmhzUmVzO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gc29ydGVkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkPzogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHModGhpcy5tQXBpLCBwcm9maWxlSWQpO1xyXG4gICAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHVwZGF0ZSBEZXBlbmRlbmN5IG1hcCcsXHJcbiAgICAgICAgJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQgYW5kL29yIHByb2ZpbGUgaXMgaW52YWxpZCcsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLm1EZXBlbmRlbmN5TWFwID0gYXdhaXQgdGhpcy5nZW5EZXBlbmRlbmN5TWFwKHByb3BzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VTdWJNb2RGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElTdWJNb2R1bGU+IHtcclxuICAgIGNvbnN0IGdldEF0dHJWYWx1ZSA9IChub2RlLCBhdHRyLCBvcHRpb25hbCA9IHRydWUpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IG5vZGU/LiQ/LlthdHRyXTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbmFsXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgbWlzc2luZyAke2F0dHJ9YCkpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBzdWJNb2RJZDtcclxuICAgIGNvbnN0IGRlcGVuZGVuY2llczogSURlcGVuZGVuY3lbXSA9IFtdO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEoZmlsZVBhdGgpO1xyXG4gICAgICBzdWJNb2RJZCA9IGRhdGE/Lk1vZHVsZT8uSWQ/LlswXT8uJD8udmFsdWU7XHJcbiAgICAgIGNvbnN0IGRlcE5vZGVzID0gZGF0YT8uTW9kdWxlPy5EZXBlbmRlZE1vZHVsZU1ldGFkYXRhcz8uWzBdPy5EZXBlbmRlZE1vZHVsZU1ldGFkYXRhO1xyXG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZGVwTm9kZXMpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgZGVwOiBJRGVwZW5kZW5jeSA9IHtcclxuICAgICAgICAgICAgaWQ6IGF3YWl0IGdldEF0dHJWYWx1ZShub2RlLCAnaWQnLCBmYWxzZSksXHJcbiAgICAgICAgICAgIG9wdGlvbmFsOiBhd2FpdCBnZXRBdHRyVmFsdWUobm9kZSwgJ29wdGlvbmFsJykgPT09ICd0cnVlJyxcclxuICAgICAgICAgICAgb3JkZXI6IGF3YWl0IGdldEF0dHJWYWx1ZShub2RlLCAnb3JkZXInKSxcclxuICAgICAgICAgICAgdmVyc2lvbjogYXdhaXQgZ2V0QXR0clZhbHVlKG5vZGUsICd2ZXJzaW9uJyksXHJcbiAgICAgICAgICAgIGluY29tcGF0aWJsZTogYXdhaXQgZ2V0QXR0clZhbHVlKG5vZGUsICdpbmNvbXBhdGlibGUnKSA9PT0gJ3RydWUnLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIGRlcGVuZGVuY2llcy5wdXNoKGRlcCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byBwYXJzZSBjb21tdW5pdHkgZGVwZW5kZW5jeScsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8gV2UncmUgc2ltcGx5IGdvaW5nIHRvIGxvZyBhdCB0aGlzIHN0YWdlOyB0b28gbWFueVxyXG4gICAgICAvLyAgbW9kcyBoYXZlIGhhZCBpbnZhbGlkIHN1Yk1vZHVsZSBmaWxlcyBpbiB0aGUgcGFzdFxyXG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBTdWJNb2R1bGUueG1sJywgZXJyKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7IGlkOiBzdWJNb2RJZCwgZGVwZW5kZW5jaWVzIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGZpbmRTdWJNb2RGaWxlcyhtb2RQYXRoOiBzdHJpbmcpIHtcclxuICAgIGxldCBmaWxlRW50cmllczogSUVudHJ5W10gPSBbXTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0dXJib3dhbGsobW9kUGF0aCwgZW50cmllcyA9PiB7XHJcbiAgICAgICAgY29uc3QgZmlsdGVyZWQgPSBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAhZW50cnkuaXNEaXJlY3RvcnlcclxuICAgICAgICAgICYmIHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICAgICAgICBmaWxlRW50cmllcyA9IGZpbGVFbnRyaWVzLmNvbmNhdChmaWx0ZXJlZCk7XHJcbiAgICAgIH0pLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBUaGUgYWJpbGl0eSB0byBzb3J0IHRoZSB1c2VyJ3MgbW9kcyB1c2luZyB0aGUgY29tbXVuaXR5XHJcbiAgICAgIC8vICBkZXZlbG9wZWQgbWV0YWRhdGEgaXMgYSBuaWNlIHRvIGhhdmUgLSBidXQgbm90IGEgYmlnIGRlYWwgaWZcclxuICAgICAgLy8gIHdlIGNhbid0IGRvIGl0IGZvciB3aGF0ZXZlciByZWFzb24uXHJcbiAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIGZpbmQgc3VibW9kdWxlIGZpbGVzJywgZXJyKTtcclxuICAgICAgcmV0dXJuIGZpbGVFbnRyaWVzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmaWxlRW50cmllcztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZ2VuRGVwZW5kZW5jeU1hcChwcm9wczogSVByb3BzKTogUHJvbWlzZTx7IFtzdWJNb2RJZDogc3RyaW5nXTogSVN1Yk1vZHVsZTsgfT4ge1xyXG4gICAgY29uc3QgeyBzdGF0ZSwgZW5hYmxlZE1vZHMgfSA9IHByb3BzO1xyXG4gICAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgZGVwTWFwOiB7IFtzdWJNb2RJZDogc3RyaW5nXTogSVN1Yk1vZHVsZSB9ID0ge307XHJcbiAgICBmb3IgKGNvbnN0IG1vZElkIG9mIE9iamVjdC5rZXlzKGVuYWJsZWRNb2RzKSkge1xyXG4gICAgICBjb25zdCBtb2QgPSBlbmFibGVkTW9kc1ttb2RJZF07XHJcbiAgICAgIGlmIChtb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtb2RGb2xkZXIgPSBwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgICBjb25zdCBzdWJNb2RGaWxlcyA9IGF3YWl0IHRoaXMuZmluZFN1Yk1vZEZpbGVzKG1vZEZvbGRlcik7XHJcbiAgICAgIGZvciAoY29uc3Qgc3ViTW9kRmlsZSBvZiBzdWJNb2RGaWxlcykge1xyXG4gICAgICAgIGNvbnN0IHN1Yk1vZERhdGE6IElTdWJNb2R1bGUgPSBhd2FpdCB0aGlzLnBhcnNlU3ViTW9kRmlsZShzdWJNb2RGaWxlLmZpbGVQYXRoKTtcclxuICAgICAgICBpZiAoc3ViTW9kRGF0YT8uaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgZGVwTWFwW3N1Yk1vZERhdGEuaWRdID0gc3ViTW9kRGF0YTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGVwTWFwO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ29tTWV0YWRhdGFNYW5hZ2VyO1xyXG4iXX0=