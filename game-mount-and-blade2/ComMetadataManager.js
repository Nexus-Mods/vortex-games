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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tTWV0YWRhdGFNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29tTWV0YWRhdGFNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDBEQUE4QztBQUM5QywyQ0FBNkQ7QUFFN0QscUNBQWdEO0FBRWhELGlDQUErRDtBQUUvRCxNQUFNLFlBQVksR0FBRyx5QkFBeUIsQ0FBQztBQUMvQyxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQztBQUlqRCxNQUFNLGtCQUFrQjtJQUd0QixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxVQUFVLENBQUMsUUFBZ0IsRUFBRSxLQUFhOztRQUMvQyxNQUFNLFVBQVUsR0FDZCxDQUFDLENBQUEsTUFBQSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQywwQ0FBRSxZQUFZLEtBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUNwRixJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUIsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQztJQUM3QixDQUFDO0lBRU0sZUFBZSxDQUFDLFFBQWdCOztRQUNyQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQ2QsQ0FBQyxDQUFBLE1BQUEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsMENBQUUsWUFBWSxLQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssZ0JBQWdCLENBQUMsRUFDakcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMs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QUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxnQkFBZ0IsTUFBSyxTQUFTLEVBQUU7b0JBQ3ZDLFNBQVM7aUJBQ1Y7Z0JBRUQsTUFBTSxTQUFTLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDMUQsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLEVBQUU7b0JBQ3BDLE1BQU0sVUFBVSxHQUFlLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQy9FLElBQUksQ0FBQSxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsRUFBRSxNQUFLLFNBQVMsRUFBRTt3QkFDaEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUM7cUJBQ3BDO2lCQUNGO2FBQ0Y7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO0tBQUE7Q0FDRjtBQUVELGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIFNVQk1PRF9GSUxFIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgSURlcGVuZGVuY3ksIElQcm9wcywgSVN1Yk1vZHVsZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZ2VuUHJvcHMsIGdldENsZWFuVmVyc2lvbiwgZ2V0WE1MRGF0YSB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IERFUF9YTUxfTElTVCA9ICdEZXBlbmRlZE1vZHVsZU1ldGFkYXRhcyc7XG5jb25zdCBERVBfWE1MX0VMRU1FTlQgPSAnRGVwZW5kZWRNb2R1bGVNZXRhZGF0YSc7XG5cbi8vIFRoaXMgY29tcG9uZW50IGFpbXMgdG8gY2F0ZXIgZm9yIHRoZSBjb21tdW5pdHkgZGV2ZWxvcGVkIG1ldGFkYXRhXG4vLyAgc29ydGluZyBtZXRob2RvbG9neS5cbmNsYXNzIENvbU1ldGFkYXRhTWFuYWdlciB7XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHJpdmF0ZSBtRGVwZW5kZW5jeU1hcDogeyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGUgfTtcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gICAgdGhpcy5tQXBpID0gYXBpO1xuICAgIHRoaXMubURlcGVuZGVuY3lNYXAgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBwdWJsaWMgaXNPcHRpb25hbChzdWJNb2RJZDogc3RyaW5nLCBkZXBJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgZGVwZW5kZW5jeTogSURlcGVuZGVuY3kgPVxuICAgICAgKHRoaXMubURlcGVuZGVuY3lNYXBbc3ViTW9kSWRdPy5kZXBlbmRlbmNpZXMgfHwgW10pLmZpbmQoZGVwID0+IGRlcC5pZCA9PT0gZGVwSWQpO1xuICAgIGlmIChkZXBlbmRlbmN5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGRlcGVuZGVuY3kub3B0aW9uYWw7XG4gIH1cblxuICBwdWJsaWMgZ2V0RGVwZW5kZW5jaWVzKHN1Yk1vZElkOiBzdHJpbmcpOiBJRGVwZW5kZW5jeVtdIHtcbiAgICByZXR1cm4gW10uY29uY2F0KFxuICAgICAgKHRoaXMubURlcGVuZGVuY3lNYXBbc3ViTW9kSWRdPy5kZXBlbmRlbmNpZXMgfHwgW10pLmZpbHRlcihkZXAgPT4gZGVwLm9yZGVyID09PSAnTG9hZEJlZm9yZVRoaXMnKSxcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMubURlcGVuZGVuY3lNYXApLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcbiAgICAgIGNvbnN0IHN1Yk1vZHVsZTogSVN1Yk1vZHVsZSA9IHRoaXMubURlcGVuZGVuY3lNYXBbaXRlcl07XG4gICAgICBjb25zdCBkZXBzID0gc3ViTW9kdWxlLmRlcGVuZGVuY2llcy5maWx0ZXIoZGVwID0+IGRlcC5pZCA9PT0gc3ViTW9kSWQgJiYgZGVwLm9yZGVyID09PSAnTG9hZEFmdGVyVGhpcycpO1xuICAgICAgaWYgKGRlcHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBuZXdEZXA6IElEZXBlbmRlbmN5ID0ge1xuICAgICAgICAgIGlkOiBzdWJNb2R1bGUuaWQsXG4gICAgICAgICAgaW5jb21wYXRpYmxlOiBkZXBzWzBdLmluY29tcGF0aWJsZSxcbiAgICAgICAgICBvcHRpb25hbDogZGVwc1swXS5vcHRpb25hbCxcbiAgICAgICAgICBvcmRlcjogJ0xvYWRBZnRlclRoaXMnLFxuICAgICAgICAgIHZlcnNpb246IGdldENsZWFuVmVyc2lvbihzdWJNb2R1bGUuaWQsIGRlcHNbMF0udmVyc2lvbiksXG4gICAgICAgIH07XG4gICAgICAgIGFjY3VtID0gW10uY29uY2F0KGFjY3VtLCBuZXdEZXApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFtdKSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgdXBkYXRlRGVwZW5kZW5jeU1hcChwcm9maWxlSWQ/OiBzdHJpbmcpIHtcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHModGhpcy5tQXBpLCBwcm9maWxlSWQpO1xuICAgIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1BcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gdXBkYXRlIERlcGVuZGVuY3kgbWFwJyxcbiAgICAgICAgJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQgYW5kL29yIHByb2ZpbGUgaXMgaW52YWxpZCcsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1EZXBlbmRlbmN5TWFwID0gYXdhaXQgdGhpcy5nZW5EZXBlbmRlbmN5TWFwKHByb3BzKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VTdWJNb2RGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElTdWJNb2R1bGU+IHtcbiAgICBjb25zdCBnZXRBdHRyVmFsdWUgPSAobm9kZSwgYXR0ciwgb3B0aW9uYWwgPSB0cnVlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IG5vZGU/LiQ/LlthdHRyXTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbmFsXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKVxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBtaXNzaW5nICR7YXR0cn1gKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCBzdWJNb2RJZDtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmN5W10gPSBbXTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEoZmlsZVBhdGgpO1xuICAgICAgc3ViTW9kSWQgPSBkYXRhPy5Nb2R1bGU/LklkPy5bMF0/LiQ/LnZhbHVlO1xuICAgICAgY29uc3QgZGVwTm9kZXMgPSBkYXRhPy5Nb2R1bGU/LkRlcGVuZGVkTW9kdWxlTWV0YWRhdGFzPy5bMF0/LkRlcGVuZGVkTW9kdWxlTWV0YWRhdGEgfHwgW107XG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZGVwTm9kZXMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBpZCA9IGF3YWl0IGdldEF0dHJWYWx1ZShub2RlLCAnaWQnLCBmYWxzZSk7XG4gICAgICAgICAgbGV0IHZlcnNpb24gPSBhd2FpdCBnZXRBdHRyVmFsdWUobm9kZSwgJ3ZlcnNpb24nKTtcbiAgICAgICAgICB2ZXJzaW9uID0gZ2V0Q2xlYW5WZXJzaW9uKGlkLCB2ZXJzaW9uKTtcbiAgICAgICAgICBjb25zdCBkZXA6IElEZXBlbmRlbmN5ID0ge1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBvcHRpb25hbDogYXdhaXQgZ2V0QXR0clZhbHVlKG5vZGUsICdvcHRpb25hbCcpID09PSAndHJ1ZScsXG4gICAgICAgICAgICBvcmRlcjogYXdhaXQgZ2V0QXR0clZhbHVlKG5vZGUsICdvcmRlcicpLFxuICAgICAgICAgICAgdmVyc2lvbixcbiAgICAgICAgICAgIGluY29tcGF0aWJsZTogYXdhaXQgZ2V0QXR0clZhbHVlKG5vZGUsICdpbmNvbXBhdGlibGUnKSA9PT0gJ3RydWUnLFxuICAgICAgICAgIH07XG4gICAgICAgICAgZGVwZW5kZW5jaWVzLnB1c2goZGVwKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gcGFyc2UgY29tbXVuaXR5IGRlcGVuZGVuY3knLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBXZSdyZSBzaW1wbHkgZ29pbmcgdG8gbG9nIGF0IHRoaXMgc3RhZ2U7IHRvbyBtYW55XG4gICAgICAvLyAgbW9kcyBoYXZlIGhhZCBpbnZhbGlkIHN1Yk1vZHVsZSBmaWxlcyBpbiB0aGUgcGFzdFxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgU3ViTW9kdWxlLnhtbCcsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgaWQ6IHN1Yk1vZElkLCBkZXBlbmRlbmNpZXMgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmluZFN1Yk1vZEZpbGVzKG1vZFBhdGg6IHN0cmluZykge1xuICAgIGxldCBmaWxlRW50cmllczogSUVudHJ5W10gPSBbXTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0dXJib3dhbGsobW9kUGF0aCwgZW50cmllcyA9PiB7XG4gICAgICAgIGNvbnN0IGZpbHRlcmVkID0gZW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWVudHJ5LmlzRGlyZWN0b3J5XG4gICAgICAgICAgJiYgcGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gU1VCTU9EX0ZJTEUpO1xuICAgICAgICBmaWxlRW50cmllcyA9IGZpbGVFbnRyaWVzLmNvbmNhdChmaWx0ZXJlZCk7XG4gICAgICB9KS5jYXRjaChlcnIgPT4gWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5jbHVkZXMoZXJyLmNvZGUpXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIFRoZSBhYmlsaXR5IHRvIHNvcnQgdGhlIHVzZXIncyBtb2RzIHVzaW5nIHRoZSBjb21tdW5pdHlcbiAgICAgIC8vICBkZXZlbG9wZWQgbWV0YWRhdGEgaXMgYSBuaWNlIHRvIGhhdmUgLSBidXQgbm90IGEgYmlnIGRlYWwgaWZcbiAgICAgIC8vICB3ZSBjYW4ndCBkbyBpdCBmb3Igd2hhdGV2ZXIgcmVhc29uLlxuICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gZmluZCBzdWJtb2R1bGUgZmlsZXMnLCBlcnIpO1xuICAgICAgcmV0dXJuIGZpbGVFbnRyaWVzO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlRW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuRGVwZW5kZW5jeU1hcChwcm9wczogSVByb3BzKTogUHJvbWlzZTx7IFtzdWJNb2RJZDogc3RyaW5nXTogSVN1Yk1vZHVsZTsgfT4ge1xuICAgIGNvbnN0IHsgc3RhdGUsIGVuYWJsZWRNb2RzIH0gPSBwcm9wcztcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgZGVwTWFwOiB7IFtzdWJNb2RJZDogc3RyaW5nXTogSVN1Yk1vZHVsZSB9ID0ge307XG4gICAgZm9yIChjb25zdCBtb2RJZCBvZiBPYmplY3Qua2V5cyhlbmFibGVkTW9kcykpIHtcbiAgICAgIGNvbnN0IG1vZCA9IGVuYWJsZWRNb2RzW21vZElkXTtcbiAgICAgIGlmIChtb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICAgIGNvbnN0IHN1Yk1vZEZpbGVzID0gYXdhaXQgdGhpcy5maW5kU3ViTW9kRmlsZXMobW9kRm9sZGVyKTtcbiAgICAgIGZvciAoY29uc3Qgc3ViTW9kRmlsZSBvZiBzdWJNb2RGaWxlcykge1xuICAgICAgICBjb25zdCBzdWJNb2REYXRhOiBJU3ViTW9kdWxlID0gYXdhaXQgdGhpcy5wYXJzZVN1Yk1vZEZpbGUoc3ViTW9kRmlsZS5maWxlUGF0aCk7XG4gICAgICAgIGlmIChzdWJNb2REYXRhPy5pZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZGVwTWFwW3N1Yk1vZERhdGEuaWRdID0gc3ViTW9kRGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXBNYXA7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tTWV0YWRhdGFNYW5hZ2VyO1xuIl19