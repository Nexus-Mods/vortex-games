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
    isOptional(subModId, depId) {
        var _a;
        const dependency = (((_a = this.mDependencyMap[subModId]) === null || _a === void 0 ? void 0 : _a.dependencies) || []).find(dep => dep.id === depId);
        if (dependency === undefined) {
            return false;
        }
        return dependency.optional;
    }
    getDependencies(subModId) {
        var _a;
        return [].concat((((_a = this.mDependencyMap[subModId]) === null || _a === void 0 ? void 0 : _a.dependencies) || []).filter(dep => dep.order === 'LoadBeforeThis'), Object.keys(this.mDependencyMap).reduce((accum, iter) => {
            const subModule = this.mDependencyMap[iter];
            const deps = subModule.dependencies.filter(dep => dep.id === subModId && dep.order === 'LoadAfterThis');
            if (deps.length > 0) {
                const newDep = {
                    id: subModule.id,
                    incompatible: deps[0].incompatible,
                    optional: deps[0].optional,
                    order: 'LoadAfterThis',
                    version: (0, util_1.getCleanVersion)(subModule.id, deps[0].version),
                };
                accum = [].concat(accum, newDep);
            }
            return accum;
        }, []));
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
                const depNodes = ((_g = (_f = (_e = data === null || data === void 0 ? void 0 : data.Module) === null || _e === void 0 ? void 0 : _e.DependedModuleMetadatas) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.DependedModuleMetadata) || [];
                for (const node of depNodes) {
                    try {
                        const id = yield getAttrValue(node, 'id', false);
                        let version = yield getAttrValue(node, 'version');
                        version = (0, util_1.getCleanVersion)(id, version);
                        const dep = {
                            id,
                            optional: (yield getAttrValue(node, 'optional')) === 'true',
                            order: yield getAttrValue(node, 'order'),
                            version,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tTWV0YWRhdGFNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29tTWV0YWRhdGFNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDBEQUE4QztBQUM5QywyQ0FBNkQ7QUFFN0QscUNBQWdEO0FBRWhELGlDQUErRDtBQUUvRCxNQUFNLFlBQVksR0FBRyx5QkFBeUIsQ0FBQztBQUMvQyxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQztBQUlqRCxNQUFNLGtCQUFrQjtJQUd0QixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxVQUFVLENBQUMsUUFBZ0IsRUFBRSxLQUFhOztRQUMvQyxNQUFNLFVBQVUsR0FDZCxDQUFDLENBQUEsTUFBQSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQywwQ0FBRSxZQUFZLEtBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUNwRixJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUIsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQztJQUM3QixDQUFDO0lBRU0sZUFBZSxDQUFDLFFBQWdCOztRQUNyQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQ2QsQ0FBQyxDQUFBLE1BQUEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsMENBQUUsWUFBWSxLQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssZ0JBQWdCLENBQUMsRUFDakcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMs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QUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxnQkFBZ0IsTUFBSyxTQUFTLEVBQUU7b0JBQ3ZDLFNBQVM7aUJBQ1Y7Z0JBRUQsTUFBTSxTQUFTLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDMUQsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLEVBQUU7b0JBQ3BDLE1BQU0sVUFBVSxHQUFlLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQy9FLElBQUksQ0FBQSxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsRUFBRSxNQUFLLFNBQVMsRUFBRTt3QkFDaEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUM7cUJBQ3BDO2lCQUNGO2FBQ0Y7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO0tBQUE7Q0FDRjtBQUVELGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU1VCTU9EX0ZJTEUgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElEZXBlbmRlbmN5LCBJUHJvcHMsIElTdWJNb2R1bGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuUHJvcHMsIGdldENsZWFuVmVyc2lvbiwgZ2V0WE1MRGF0YSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBERVBfWE1MX0xJU1QgPSAnRGVwZW5kZWRNb2R1bGVNZXRhZGF0YXMnO1xyXG5jb25zdCBERVBfWE1MX0VMRU1FTlQgPSAnRGVwZW5kZWRNb2R1bGVNZXRhZGF0YSc7XHJcblxyXG4vLyBUaGlzIGNvbXBvbmVudCBhaW1zIHRvIGNhdGVyIGZvciB0aGUgY29tbXVuaXR5IGRldmVsb3BlZCBtZXRhZGF0YVxyXG4vLyAgc29ydGluZyBtZXRob2RvbG9neS5cclxuY2xhc3MgQ29tTWV0YWRhdGFNYW5hZ2VyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtRGVwZW5kZW5jeU1hcDogeyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGUgfTtcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubURlcGVuZGVuY3lNYXAgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaXNPcHRpb25hbChzdWJNb2RJZDogc3RyaW5nLCBkZXBJZDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBkZXBlbmRlbmN5OiBJRGVwZW5kZW5jeSA9XHJcbiAgICAgICh0aGlzLm1EZXBlbmRlbmN5TWFwW3N1Yk1vZElkXT8uZGVwZW5kZW5jaWVzIHx8IFtdKS5maW5kKGRlcCA9PiBkZXAuaWQgPT09IGRlcElkKTtcclxuICAgIGlmIChkZXBlbmRlbmN5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGRlcGVuZGVuY3kub3B0aW9uYWw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzKHN1Yk1vZElkOiBzdHJpbmcpOiBJRGVwZW5kZW5jeVtdIHtcclxuICAgIHJldHVybiBbXS5jb25jYXQoXHJcbiAgICAgICh0aGlzLm1EZXBlbmRlbmN5TWFwW3N1Yk1vZElkXT8uZGVwZW5kZW5jaWVzIHx8IFtdKS5maWx0ZXIoZGVwID0+IGRlcC5vcmRlciA9PT0gJ0xvYWRCZWZvcmVUaGlzJyksXHJcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMubURlcGVuZGVuY3lNYXApLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcclxuICAgICAgY29uc3Qgc3ViTW9kdWxlOiBJU3ViTW9kdWxlID0gdGhpcy5tRGVwZW5kZW5jeU1hcFtpdGVyXTtcclxuICAgICAgY29uc3QgZGVwcyA9IHN1Yk1vZHVsZS5kZXBlbmRlbmNpZXMuZmlsdGVyKGRlcCA9PiBkZXAuaWQgPT09IHN1Yk1vZElkICYmIGRlcC5vcmRlciA9PT0gJ0xvYWRBZnRlclRoaXMnKTtcclxuICAgICAgaWYgKGRlcHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IG5ld0RlcDogSURlcGVuZGVuY3kgPSB7XHJcbiAgICAgICAgICBpZDogc3ViTW9kdWxlLmlkLFxyXG4gICAgICAgICAgaW5jb21wYXRpYmxlOiBkZXBzWzBdLmluY29tcGF0aWJsZSxcclxuICAgICAgICAgIG9wdGlvbmFsOiBkZXBzWzBdLm9wdGlvbmFsLFxyXG4gICAgICAgICAgb3JkZXI6ICdMb2FkQWZ0ZXJUaGlzJyxcclxuICAgICAgICAgIHZlcnNpb246IGdldENsZWFuVmVyc2lvbihzdWJNb2R1bGUuaWQsIGRlcHNbMF0udmVyc2lvbiksXHJcbiAgICAgICAgfTtcclxuICAgICAgICBhY2N1bSA9IFtdLmNvbmNhdChhY2N1bSwgbmV3RGVwKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSkpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkPzogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHModGhpcy5tQXBpLCBwcm9maWxlSWQpO1xyXG4gICAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHVwZGF0ZSBEZXBlbmRlbmN5IG1hcCcsXHJcbiAgICAgICAgJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQgYW5kL29yIHByb2ZpbGUgaXMgaW52YWxpZCcsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLm1EZXBlbmRlbmN5TWFwID0gYXdhaXQgdGhpcy5nZW5EZXBlbmRlbmN5TWFwKHByb3BzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VTdWJNb2RGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElTdWJNb2R1bGU+IHtcclxuICAgIGNvbnN0IGdldEF0dHJWYWx1ZSA9IChub2RlLCBhdHRyLCBvcHRpb25hbCA9IHRydWUpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IG5vZGU/LiQ/LlthdHRyXTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbmFsXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgbWlzc2luZyAke2F0dHJ9YCkpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBzdWJNb2RJZDtcclxuICAgIGNvbnN0IGRlcGVuZGVuY2llczogSURlcGVuZGVuY3lbXSA9IFtdO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEoZmlsZVBhdGgpO1xyXG4gICAgICBzdWJNb2RJZCA9IGRhdGE/Lk1vZHVsZT8uSWQ/LlswXT8uJD8udmFsdWU7XHJcbiAgICAgIGNvbnN0IGRlcE5vZGVzID0gZGF0YT8uTW9kdWxlPy5EZXBlbmRlZE1vZHVsZU1ldGFkYXRhcz8uWzBdPy5EZXBlbmRlZE1vZHVsZU1ldGFkYXRhIHx8IFtdO1xyXG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZGVwTm9kZXMpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgaWQgPSBhd2FpdCBnZXRBdHRyVmFsdWUobm9kZSwgJ2lkJywgZmFsc2UpO1xyXG4gICAgICAgICAgbGV0IHZlcnNpb24gPSBhd2FpdCBnZXRBdHRyVmFsdWUobm9kZSwgJ3ZlcnNpb24nKTtcclxuICAgICAgICAgIHZlcnNpb24gPSBnZXRDbGVhblZlcnNpb24oaWQsIHZlcnNpb24pO1xyXG4gICAgICAgICAgY29uc3QgZGVwOiBJRGVwZW5kZW5jeSA9IHtcclxuICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgIG9wdGlvbmFsOiBhd2FpdCBnZXRBdHRyVmFsdWUobm9kZSwgJ29wdGlvbmFsJykgPT09ICd0cnVlJyxcclxuICAgICAgICAgICAgb3JkZXI6IGF3YWl0IGdldEF0dHJWYWx1ZShub2RlLCAnb3JkZXInKSxcclxuICAgICAgICAgICAgdmVyc2lvbixcclxuICAgICAgICAgICAgaW5jb21wYXRpYmxlOiBhd2FpdCBnZXRBdHRyVmFsdWUobm9kZSwgJ2luY29tcGF0aWJsZScpID09PSAndHJ1ZScsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgZGVwZW5kZW5jaWVzLnB1c2goZGVwKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHBhcnNlIGNvbW11bml0eSBkZXBlbmRlbmN5JywgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBXZSdyZSBzaW1wbHkgZ29pbmcgdG8gbG9nIGF0IHRoaXMgc3RhZ2U7IHRvbyBtYW55XHJcbiAgICAgIC8vICBtb2RzIGhhdmUgaGFkIGludmFsaWQgc3ViTW9kdWxlIGZpbGVzIGluIHRoZSBwYXN0XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFN1Yk1vZHVsZS54bWwnLCBlcnIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgaWQ6IHN1Yk1vZElkLCBkZXBlbmRlbmNpZXMgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZmluZFN1Yk1vZEZpbGVzKG1vZFBhdGg6IHN0cmluZykge1xyXG4gICAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHR1cmJvd2Fsayhtb2RQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeVxyXG4gICAgICAgICAgJiYgcGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xyXG4gICAgICAgIGZpbGVFbnRyaWVzID0gZmlsZUVudHJpZXMuY29uY2F0KGZpbHRlcmVkKTtcclxuICAgICAgfSkuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIFRoZSBhYmlsaXR5IHRvIHNvcnQgdGhlIHVzZXIncyBtb2RzIHVzaW5nIHRoZSBjb21tdW5pdHlcclxuICAgICAgLy8gIGRldmVsb3BlZCBtZXRhZGF0YSBpcyBhIG5pY2UgdG8gaGF2ZSAtIGJ1dCBub3QgYSBiaWcgZGVhbCBpZlxyXG4gICAgICAvLyAgd2UgY2FuJ3QgZG8gaXQgZm9yIHdoYXRldmVyIHJlYXNvbi5cclxuICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gZmluZCBzdWJtb2R1bGUgZmlsZXMnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gZmlsZUVudHJpZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZpbGVFbnRyaWVzO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBnZW5EZXBlbmRlbmN5TWFwKHByb3BzOiBJUHJvcHMpOiBQcm9taXNlPHsgW3N1Yk1vZElkOiBzdHJpbmddOiBJU3ViTW9kdWxlOyB9PiB7XHJcbiAgICBjb25zdCB7IHN0YXRlLCBlbmFibGVkTW9kcyB9ID0gcHJvcHM7XHJcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBkZXBNYXA6IHsgW3N1Yk1vZElkOiBzdHJpbmddOiBJU3ViTW9kdWxlIH0gPSB7fTtcclxuICAgIGZvciAoY29uc3QgbW9kSWQgb2YgT2JqZWN0LmtleXMoZW5hYmxlZE1vZHMpKSB7XHJcbiAgICAgIGNvbnN0IG1vZCA9IGVuYWJsZWRNb2RzW21vZElkXTtcclxuICAgICAgaWYgKG1vZD8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1vZEZvbGRlciA9IHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICAgIGNvbnN0IHN1Yk1vZEZpbGVzID0gYXdhaXQgdGhpcy5maW5kU3ViTW9kRmlsZXMobW9kRm9sZGVyKTtcclxuICAgICAgZm9yIChjb25zdCBzdWJNb2RGaWxlIG9mIHN1Yk1vZEZpbGVzKSB7XHJcbiAgICAgICAgY29uc3Qgc3ViTW9kRGF0YTogSVN1Yk1vZHVsZSA9IGF3YWl0IHRoaXMucGFyc2VTdWJNb2RGaWxlKHN1Yk1vZEZpbGUuZmlsZVBhdGgpO1xyXG4gICAgICAgIGlmIChzdWJNb2REYXRhPy5pZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBkZXBNYXBbc3ViTW9kRGF0YS5pZF0gPSBzdWJNb2REYXRhO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZXBNYXA7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDb21NZXRhZGF0YU1hbmFnZXI7XHJcbiJdfQ==