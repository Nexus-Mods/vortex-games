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
            const props = util_1.genProps(this.mApi, profileId);
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
            let dependencies = [];
            try {
                const data = yield util_1.getXMLData(filePath);
                subModId = data.get('//Id').attr('value').value();
                const depNodes = data.find(`//${DEP_XML_ELEMENT}`);
                dependencies = yield depNodes.reduce((accumP, node) => __awaiter(this, void 0, void 0, function* () {
                    const accum = yield accumP;
                    try {
                        const dep = {
                            id: yield getAttributeValue(node, 'id', false),
                            optional: (yield getAttributeValue(node, 'optional')) === 'true',
                            order: yield getAttributeValue(node, 'order'),
                            version: yield getAttributeValue(node, 'version'),
                            incompatible: (yield getAttributeValue(node, 'incompatible')) === 'true',
                        };
                        accum.push(dep);
                    }
                    catch (err) {
                        vortex_api_1.log('error', 'unable to parse community dependency', err);
                    }
                    return accum;
                }), []);
            }
            catch (err) {
                vortex_api_1.log('error', 'failed to parse SubModule.xml', err);
                return;
            }
            return { id: subModId, dependencies };
        });
    }
    findSubModFiles(modPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileEntries = [];
            try {
                yield turbowalk_1.default(modPath, entries => {
                    const filtered = entries.filter(entry => !entry.isDirectory
                        && path_1.default.basename(entry.filePath).toLowerCase() === common_1.SUBMOD_FILE);
                    fileEntries = fileEntries.concat(filtered);
                }).catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
                    ? Promise.resolve()
                    : Promise.reject(err));
            }
            catch (err) {
                vortex_api_1.log('error', 'unable to find submodule files', err);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tTWV0YWRhdGFNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29tTWV0YWRhdGFNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDBEQUE4QztBQUM5QywyQ0FBNkQ7QUFFN0QscUNBQWdEO0FBRWhELGlDQUE4QztBQUU5QyxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQztBQUlqRCxNQUFNLGtCQUFrQjtJQUd0QixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxJQUFJLENBQUMsU0FBbUI7UUFDN0IsTUFBTSxNQUFNLEdBQUcsQ0FBRSxHQUFHLFNBQVMsQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTs7WUFDaEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFtQixFQUFFLFFBQWdCLEVBQVUsRUFBRTtnQkFDakUsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDcEQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO3dCQUN2QixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7NEJBQ2hDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLGVBQWU7Z0NBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDVixDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNQO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxDQUFDO3FCQUNWO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDO1lBQ0YsTUFB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LE1BQUssU0FBUyxFQUFFO3dCQUNoQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQztxQkFDcEM7aUJBQ0Y7YUFDRjtZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7S0FBQTtDQUNGO0FBRUQsa0JBQWUsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBTVUJNT0RfRklMRSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSURlcGVuZGVuY3ksIElQcm9wcywgSVN1Yk1vZHVsZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZW5Qcm9wcywgZ2V0WE1MRGF0YSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBERVBfWE1MX0VMRU1FTlQgPSAnRGVwZW5kZWRNb2R1bGVNZXRhZGF0YSc7XHJcblxyXG4vLyBUaGlzIGNvbXBvbmVudCBhaW1zIHRvIGNhdGVyIGZvciB0aGUgY29tbXVuaXR5IGRldmVsb3BlZCBtZXRhZGF0YVxyXG4vLyAgc29ydGluZyBtZXRob2RvbG9neS5cclxuY2xhc3MgQ29tTWV0YWRhdGFNYW5hZ2VyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtRGVwZW5kZW5jeU1hcDogeyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGUgfTtcclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubURlcGVuZGVuY3lNYXAgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc29ydChsb2FkT3JkZXI6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xyXG4gICAgY29uc3Qgc29ydGVkID0gWyAuLi5sb2FkT3JkZXIgXS5zb3J0KChsaHMsIHJocykgPT4ge1xyXG4gICAgICBjb25zdCB0ZXN0RGVwcyA9IChkZXBzOiBJRGVwZW5kZW5jeVtdLCBzdWJNb2RJZDogc3RyaW5nKTogbnVtYmVyID0+IHtcclxuICAgICAgICBpZiAoZGVwcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IGRlcHMuZmluZChkZXAgPT4gZGVwLmlkID09PSBzdWJNb2RJZCk7XHJcbiAgICAgICAgICBpZiAobWF0Y2ggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKG1hdGNoLm9yZGVyICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgPyBtYXRjaC5vcmRlciA9PT0gJ0xvYWRBZnRlclRoaXMnXHJcbiAgICAgICAgICAgICAgICA/IC0xIDogMVxyXG4gICAgICAgICAgICAgIDogMDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgY29uc3QgbGhzRGVwcyA9IHRoaXMubURlcGVuZGVuY3lNYXBbbGhzXT8uZGVwZW5kZW5jaWVzO1xyXG4gICAgICBjb25zdCByaHNEZXBzID0gdGhpcy5tRGVwZW5kZW5jeU1hcFtyaHNdPy5kZXBlbmRlbmNpZXM7XHJcbiAgICAgIGNvbnN0IGxoc1JlcyA9IHRlc3REZXBzKGxoc0RlcHMsIHJocyk7XHJcbiAgICAgIGlmIChsaHNSZXMgIT09IDApIHtcclxuICAgICAgICByZXR1cm4gbGhzUmVzO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJoc1JlcyA9IHRlc3REZXBzKHJoc0RlcHMsIGxocyk7XHJcbiAgICAgIGlmIChyaHNSZXMgIT09IDApIHtcclxuICAgICAgICByZXR1cm4gcmhzUmVzO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gc29ydGVkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHVwZGF0ZURlcGVuZGVuY3lNYXAocHJvZmlsZUlkPzogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHModGhpcy5tQXBpLCBwcm9maWxlSWQpO1xyXG4gICAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHVwZGF0ZSBEZXBlbmRlbmN5IG1hcCcsXHJcbiAgICAgICAgJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQgYW5kL29yIHByb2ZpbGUgaXMgaW52YWxpZCcsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLm1EZXBlbmRlbmN5TWFwID0gYXdhaXQgdGhpcy5nZW5EZXBlbmRlbmN5TWFwKHByb3BzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VTdWJNb2RGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElTdWJNb2R1bGU+IHtcclxuICAgIGNvbnN0IGdldEF0dHJpYnV0ZVZhbHVlID0gYXN5bmMgKG5vZGU6IGFueSwgYXR0cmliOiBzdHJpbmcsIG9wdGlvbmFsOiBib29sZWFuID0gdHJ1ZSkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gbm9kZS5hdHRyKGF0dHJpYikudmFsdWUoKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbmFsXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgbWlzc2luZyAke2F0dHJpYn1gKSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgbGV0IHN1Yk1vZElkO1xyXG4gICAgbGV0IGRlcGVuZGVuY2llczogSURlcGVuZGVuY3lbXSA9IFtdO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFhNTERhdGEoZmlsZVBhdGgpO1xyXG4gICAgICBzdWJNb2RJZCA9IGRhdGEuZ2V0KCcvL0lkJykuYXR0cigndmFsdWUnKS52YWx1ZSgpO1xyXG4gICAgICBjb25zdCBkZXBOb2RlcyA9IGRhdGEuZmluZChgLy8ke0RFUF9YTUxfRUxFTUVOVH1gKTtcclxuICAgICAgZGVwZW5kZW5jaWVzID0gYXdhaXQgZGVwTm9kZXMucmVkdWNlKGFzeW5jIChhY2N1bVAsIG5vZGUpID0+IHtcclxuICAgICAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgZGVwOiBJRGVwZW5kZW5jeSA9IHtcclxuICAgICAgICAgICAgaWQ6IGF3YWl0IGdldEF0dHJpYnV0ZVZhbHVlKG5vZGUsICdpZCcsIGZhbHNlKSxcclxuICAgICAgICAgICAgb3B0aW9uYWw6IGF3YWl0IGdldEF0dHJpYnV0ZVZhbHVlKG5vZGUsICdvcHRpb25hbCcpID09PSAndHJ1ZScsXHJcbiAgICAgICAgICAgIG9yZGVyOiBhd2FpdCBnZXRBdHRyaWJ1dGVWYWx1ZShub2RlLCAnb3JkZXInKSxcclxuICAgICAgICAgICAgdmVyc2lvbjogYXdhaXQgZ2V0QXR0cmlidXRlVmFsdWUobm9kZSwgJ3ZlcnNpb24nKSxcclxuICAgICAgICAgICAgaW5jb21wYXRpYmxlOiBhd2FpdCBnZXRBdHRyaWJ1dGVWYWx1ZShub2RlLCAnaW5jb21wYXRpYmxlJykgPT09ICd0cnVlJyxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBhY2N1bS5wdXNoKGRlcCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byBwYXJzZSBjb21tdW5pdHkgZGVwZW5kZW5jeScsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIC8vIFdlJ3JlIHNpbXBseSBnb2luZyB0byBsb2cgYXQgdGhpcyBzdGFnZTsgdG9vIG1hbnlcclxuICAgICAgLy8gIG1vZHMgaGF2ZSBoYWQgaW52YWxpZCBzdWJNb2R1bGUgZmlsZXMgaW4gdGhlIHBhc3RcclxuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgU3ViTW9kdWxlLnhtbCcsIGVycik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geyBpZDogc3ViTW9kSWQsIGRlcGVuZGVuY2llcyB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBmaW5kU3ViTW9kRmlsZXMobW9kUGF0aDogc3RyaW5nKSB7XHJcbiAgICBsZXQgZmlsZUVudHJpZXM6IElFbnRyeVtdID0gW107XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgdHVyYm93YWxrKG1vZFBhdGgsIGVudHJpZXMgPT4ge1xyXG4gICAgICAgIGNvbnN0IGZpbHRlcmVkID0gZW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWVudHJ5LmlzRGlyZWN0b3J5XHJcbiAgICAgICAgICAmJiBwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBTVUJNT0RfRklMRSk7XHJcbiAgICAgICAgZmlsZUVudHJpZXMgPSBmaWxlRW50cmllcy5jb25jYXQoZmlsdGVyZWQpO1xyXG4gICAgICB9KS5jYXRjaChlcnIgPT4gWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5jbHVkZXMoZXJyLmNvZGUpXHJcbiAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8gVGhlIGFiaWxpdHkgdG8gc29ydCB0aGUgdXNlcidzIG1vZHMgdXNpbmcgdGhlIGNvbW11bml0eVxyXG4gICAgICAvLyAgZGV2ZWxvcGVkIG1ldGFkYXRhIGlzIGEgbmljZSB0byBoYXZlIC0gYnV0IG5vdCBhIGJpZyBkZWFsIGlmXHJcbiAgICAgIC8vICB3ZSBjYW4ndCBkbyBpdCBmb3Igd2hhdGV2ZXIgcmVhc29uLlxyXG4gICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byBmaW5kIHN1Ym1vZHVsZSBmaWxlcycsIGVycik7XHJcbiAgICAgIHJldHVybiBmaWxlRW50cmllcztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmlsZUVudHJpZXM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGdlbkRlcGVuZGVuY3lNYXAocHJvcHM6IElQcm9wcyk6IFByb21pc2U8eyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGU7IH0+IHtcclxuICAgIGNvbnN0IHsgc3RhdGUsIGVuYWJsZWRNb2RzIH0gPSBwcm9wcztcclxuICAgIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGRlcE1hcDogeyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGUgfSA9IHt9O1xyXG4gICAgZm9yIChjb25zdCBtb2RJZCBvZiBPYmplY3Qua2V5cyhlbmFibGVkTW9kcykpIHtcclxuICAgICAgY29uc3QgbW9kID0gZW5hYmxlZE1vZHNbbW9kSWRdO1xyXG4gICAgICBpZiAobW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgY29uc3Qgc3ViTW9kRmlsZXMgPSBhd2FpdCB0aGlzLmZpbmRTdWJNb2RGaWxlcyhtb2RGb2xkZXIpO1xyXG4gICAgICBmb3IgKGNvbnN0IHN1Yk1vZEZpbGUgb2Ygc3ViTW9kRmlsZXMpIHtcclxuICAgICAgICBjb25zdCBzdWJNb2REYXRhOiBJU3ViTW9kdWxlID0gYXdhaXQgdGhpcy5wYXJzZVN1Yk1vZEZpbGUoc3ViTW9kRmlsZS5maWxlUGF0aCk7XHJcbiAgICAgICAgaWYgKHN1Yk1vZERhdGE/LmlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGRlcE1hcFtzdWJNb2REYXRhLmlkXSA9IHN1Yk1vZERhdGE7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRlcE1hcDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IENvbU1ldGFkYXRhTWFuYWdlcjtcclxuIl19