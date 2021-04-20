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
                    throw new Error('whatever');
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
                    depMap[subModData.id] = subModData;
                }
            }
            return depMap;
        });
    }
}
exports.default = ComMetadataManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tTWV0YWRhdGFNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29tTWV0YWRhdGFNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDBEQUE4QztBQUM5QywyQ0FBNkQ7QUFFN0QscUNBQWdEO0FBRWhELGlDQUE4QztBQUU5QyxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQztBQUlqRCxNQUFNLGtCQUFrQjtJQUd0QixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxJQUFJLENBQUMsU0FBbUI7UUFDN0IsTUFBTSxNQUFNLEdBQUcsQ0FBRSxHQUFHLFNBQVMsQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTs7WUFDaEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFtQixFQUFFLFFBQWdCLEVBQVUsRUFBRTtnQkFDakUsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDcEQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO3dCQUN2QixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7NEJBQ2hDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLGVBQWU7Z0NBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDVixDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNQO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxDQUFDO3FCQUNWO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDO1lBQ0YsTUFB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TSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUM7aUJBQ3BDO2FBQ0Y7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO0tBQUE7Q0FDRjtBQUVELGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgU1VCTU9EX0ZJTEUgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElEZXBlbmRlbmN5LCBJUHJvcHMsIElTdWJNb2R1bGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuUHJvcHMsIGdldFhNTERhdGEgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgREVQX1hNTF9FTEVNRU5UID0gJ0RlcGVuZGVkTW9kdWxlTWV0YWRhdGEnO1xyXG5cclxuLy8gVGhpcyBjb21wb25lbnQgYWltcyB0byBjYXRlciBmb3IgdGhlIGNvbW11bml0eSBkZXZlbG9wZWQgbWV0YWRhdGFcclxuLy8gIHNvcnRpbmcgbWV0aG9kb2xvZ3kuXHJcbmNsYXNzIENvbU1ldGFkYXRhTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbURlcGVuZGVuY3lNYXA6IHsgW3N1Yk1vZElkOiBzdHJpbmddOiBJU3ViTW9kdWxlIH07XHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1EZXBlbmRlbmN5TWFwID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNvcnQobG9hZE9yZGVyOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IHNvcnRlZCA9IFsgLi4ubG9hZE9yZGVyIF0uc29ydCgobGhzLCByaHMpID0+IHtcclxuICAgICAgY29uc3QgdGVzdERlcHMgPSAoZGVwczogSURlcGVuZGVuY3lbXSwgc3ViTW9kSWQ6IHN0cmluZyk6IG51bWJlciA9PiB7XHJcbiAgICAgICAgaWYgKGRlcHMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBkZXBzLmZpbmQoZGVwID0+IGRlcC5pZCA9PT0gc3ViTW9kSWQpO1xyXG4gICAgICAgICAgaWYgKG1hdGNoICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChtYXRjaC5vcmRlciAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgID8gbWF0Y2gub3JkZXIgPT09ICdMb2FkQWZ0ZXJUaGlzJ1xyXG4gICAgICAgICAgICAgICAgPyAtMSA6IDFcclxuICAgICAgICAgICAgICA6IDA7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IGxoc0RlcHMgPSB0aGlzLm1EZXBlbmRlbmN5TWFwW2xoc10/LmRlcGVuZGVuY2llcztcclxuICAgICAgY29uc3QgcmhzRGVwcyA9IHRoaXMubURlcGVuZGVuY3lNYXBbcmhzXT8uZGVwZW5kZW5jaWVzO1xyXG4gICAgICBjb25zdCBsaHNSZXMgPSB0ZXN0RGVwcyhsaHNEZXBzLCByaHMpO1xyXG4gICAgICBpZiAobGhzUmVzICE9PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGxoc1JlcztcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByaHNSZXMgPSB0ZXN0RGVwcyhyaHNEZXBzLCBsaHMpO1xyXG4gICAgICBpZiAocmhzUmVzICE9PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHJoc1JlcztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHNvcnRlZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyB1cGRhdGVEZXBlbmRlbmN5TWFwKHByb2ZpbGVJZD86IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKHRoaXMubUFwaSwgcHJvZmlsZUlkKTtcclxuICAgIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB1cGRhdGUgRGVwZW5kZW5jeSBtYXAnLFxyXG4gICAgICAgICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkIGFuZC9vciBwcm9maWxlIGlzIGludmFsaWQnLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tRGVwZW5kZW5jeU1hcCA9IGF3YWl0IHRoaXMuZ2VuRGVwZW5kZW5jeU1hcChwcm9wcyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIHBhcnNlU3ViTW9kRmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJU3ViTW9kdWxlPiB7XHJcbiAgICBjb25zdCBnZXRBdHRyaWJ1dGVWYWx1ZSA9IGFzeW5jIChub2RlOiBhbnksIGF0dHJpYjogc3RyaW5nLCBvcHRpb25hbDogYm9vbGVhbiA9IHRydWUpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IG5vZGUuYXR0cihhdHRyaWIpLnZhbHVlKCk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWx1ZSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBvcHRpb25hbFxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYG1pc3NpbmcgJHthdHRyaWJ9YCkpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBzdWJNb2RJZDtcclxuICAgIGxldCBkZXBlbmRlbmNpZXM6IElEZXBlbmRlbmN5W10gPSBbXTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZXRYTUxEYXRhKGZpbGVQYXRoKTtcclxuICAgICAgc3ViTW9kSWQgPSBkYXRhLmdldCgnLy9JZCcpLmF0dHIoJ3ZhbHVlJykudmFsdWUoKTtcclxuICAgICAgY29uc3QgZGVwTm9kZXMgPSBkYXRhLmZpbmQoYC8vJHtERVBfWE1MX0VMRU1FTlR9YCk7XHJcbiAgICAgIGRlcGVuZGVuY2llcyA9IGF3YWl0IGRlcE5vZGVzLnJlZHVjZShhc3luYyAoYWNjdW1QLCBub2RlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IGRlcDogSURlcGVuZGVuY3kgPSB7XHJcbiAgICAgICAgICAgIGlkOiBhd2FpdCBnZXRBdHRyaWJ1dGVWYWx1ZShub2RlLCAnaWQnLCBmYWxzZSksXHJcbiAgICAgICAgICAgIG9wdGlvbmFsOiBhd2FpdCBnZXRBdHRyaWJ1dGVWYWx1ZShub2RlLCAnb3B0aW9uYWwnKSA9PT0gJ3RydWUnLFxyXG4gICAgICAgICAgICBvcmRlcjogYXdhaXQgZ2V0QXR0cmlidXRlVmFsdWUobm9kZSwgJ29yZGVyJyksXHJcbiAgICAgICAgICAgIHZlcnNpb246IGF3YWl0IGdldEF0dHJpYnV0ZVZhbHVlKG5vZGUsICd2ZXJzaW9uJyksXHJcbiAgICAgICAgICAgIGluY29tcGF0aWJsZTogYXdhaXQgZ2V0QXR0cmlidXRlVmFsdWUobm9kZSwgJ2luY29tcGF0aWJsZScpID09PSAndHJ1ZScsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgYWNjdW0ucHVzaChkZXApO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gcGFyc2UgY29tbXVuaXR5IGRlcGVuZGVuY3knLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIFtdKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBXZSdyZSBzaW1wbHkgZ29pbmcgdG8gbG9nIGF0IHRoaXMgc3RhZ2U7IHRvbyBtYW55XHJcbiAgICAgIC8vICBtb2RzIGhhdmUgaGFkIGludmFsaWQgc3ViTW9kdWxlIGZpbGVzIGluIHRoZSBwYXN0XHJcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFN1Yk1vZHVsZS54bWwnLCBlcnIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgaWQ6IHN1Yk1vZElkLCBkZXBlbmRlbmNpZXMgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZmluZFN1Yk1vZEZpbGVzKG1vZFBhdGg6IHN0cmluZykge1xyXG4gICAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHR1cmJvd2Fsayhtb2RQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3doYXRldmVyJyk7XHJcbiAgICAgICAgY29uc3QgZmlsdGVyZWQgPSBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAhZW50cnkuaXNEaXJlY3RvcnlcclxuICAgICAgICAgICYmIHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09IFNVQk1PRF9GSUxFKTtcclxuICAgICAgICBmaWxlRW50cmllcyA9IGZpbGVFbnRyaWVzLmNvbmNhdChmaWx0ZXJlZCk7XHJcbiAgICAgIH0pLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byBmaW5kIHN1Ym1vZHVsZSBmaWxlcycsIGVycik7XHJcbiAgICAgIHJldHVybiBmaWxlRW50cmllcztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmlsZUVudHJpZXM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGdlbkRlcGVuZGVuY3lNYXAocHJvcHM6IElQcm9wcyk6IFByb21pc2U8eyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGU7IH0+IHtcclxuICAgIGNvbnN0IHsgc3RhdGUsIGVuYWJsZWRNb2RzIH0gPSBwcm9wcztcclxuICAgIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGRlcE1hcDogeyBbc3ViTW9kSWQ6IHN0cmluZ106IElTdWJNb2R1bGUgfSA9IHt9O1xyXG4gICAgZm9yIChjb25zdCBtb2RJZCBvZiBPYmplY3Qua2V5cyhlbmFibGVkTW9kcykpIHtcclxuICAgICAgY29uc3QgbW9kID0gZW5hYmxlZE1vZHNbbW9kSWRdO1xyXG4gICAgICBpZiAobW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgICAgY29uc3Qgc3ViTW9kRmlsZXMgPSBhd2FpdCB0aGlzLmZpbmRTdWJNb2RGaWxlcyhtb2RGb2xkZXIpO1xyXG4gICAgICBmb3IgKGNvbnN0IHN1Yk1vZEZpbGUgb2Ygc3ViTW9kRmlsZXMpIHtcclxuICAgICAgICBjb25zdCBzdWJNb2REYXRhOiBJU3ViTW9kdWxlID0gYXdhaXQgdGhpcy5wYXJzZVN1Yk1vZEZpbGUoc3ViTW9kRmlsZS5maWxlUGF0aCk7XHJcbiAgICAgICAgZGVwTWFwW3N1Yk1vZERhdGEuaWRdID0gc3ViTW9kRGF0YTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZXBNYXA7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDb21NZXRhZGF0YU1hbmFnZXI7XHJcbiJdfQ==