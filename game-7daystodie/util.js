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
exports.getModInfoFiles = exports.getModName = exports.makePrefix = exports.ensureLOFile = exports.genProps = exports.toBlue = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
exports.toBlue = toBlue;
function genProps(context, profileId) {
    const api = context.api;
    const state = api.getState();
    const profile = (profileId !== undefined)
        ? vortex_api_1.selectors.profileById(state, profileId)
        : vortex_api_1.selectors.activeProfile(state);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
        return undefined;
    }
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    return { api, state, profile, mods, discovery };
}
exports.genProps = genProps;
function ensureLOFile(context, profileId, props) {
    return __awaiter(this, void 0, void 0, function* () {
        if (props === undefined) {
            props = genProps(context, profileId);
        }
        if (props === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('failed to generate game props'));
        }
        const targetPath = path_1.default.join(props.discovery.path, props.profile.id + '_' + common_1.LO_FILE_NAME);
        try {
            yield vortex_api_1.fs.statAsync(targetPath)
                .catch({ code: 'ENOENT' }, () => vortex_api_1.fs.writeFileAsync(targetPath, JSON.stringify([]), { encoding: 'utf8' }));
            return targetPath;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.ensureLOFile = ensureLOFile;
function makePrefix(input) {
    let res = '';
    let rest = input;
    while (rest > 0) {
        res = String.fromCharCode(65 + (rest % 25)) + res;
        rest = Math.floor(rest / 25);
    }
    return vortex_api_1.util.pad(res, 'A', 3);
}
exports.makePrefix = makePrefix;
function getModName(modInfoPath) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        let modInfo;
        try {
            const xmlData = yield vortex_api_1.fs.readFileAsync(modInfoPath);
            modInfo = yield (0, xml2js_1.parseStringPromise)(xmlData);
            const modName = ((_d = (_c = (_b = (_a = modInfo === null || modInfo === void 0 ? void 0 : modInfo.ModInfo) === null || _a === void 0 ? void 0 : _a[0].Name) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.$) === null || _d === void 0 ? void 0 : _d.value)
                || ((_j = (_h = (_g = (_f = (_e = modInfo === null || modInfo === void 0 ? void 0 : modInfo.xml.ModInfo) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.Name) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.$) === null || _j === void 0 ? void 0 : _j.value);
            return (modName !== undefined)
                ? Promise.resolve(modName)
                : Promise.reject(new vortex_api_1.util.DataInvalid('Unexpected modinfo.xml format'));
        }
        catch (err) {
            return Promise.reject(new vortex_api_1.util.DataInvalid('Failed to parse ModInfo.xml file'));
        }
    });
}
exports.getModName = getModName;
function getModInfoFiles(basePath) {
    return __awaiter(this, void 0, void 0, function* () {
        let filePaths = [];
        return (0, turbowalk_1.default)(basePath, files => {
            const filtered = files.filter(entry => !entry.isDirectory && path_1.default.basename(entry.filePath) === common_1.MOD_INFO);
            filePaths = filePaths.concat(filtered.map(entry => entry.filePath));
        }, { recurse: true, skipLinks: true })
            .catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
            ? Promise.resolve() : Promise.reject(err))
            .then(() => Promise.resolve(filePaths));
    });
}
exports.getModInfoFiles = getModInfoFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QiwwREFBa0M7QUFDbEMsMkNBQXdEO0FBQ3hELG1DQUE0QztBQUU1QyxxQ0FBMkQ7QUFLM0QsU0FBZ0IsTUFBTSxDQUFJLElBQW9DO0lBQzVELE9BQU8sQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixRQUFRLENBQUMsT0FBZ0MsRUFBRSxTQUFrQjtJQUMzRSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLE9BQU8sR0FBbUIsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVuQyxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxTQUFTLEdBQTJCLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDMUQsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDOUQsSUFBSSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFO1FBQ2pDLE9B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QUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQUE7QUFWRCwwQ0FVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBMT19GSUxFX05BTUUsIE1PRF9JTkZPIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbi8vIFdlIF9zaG91bGRfIGp1c3QgZXhwb3J0IHRoaXMgZnJvbSB2b3J0ZXgtYXBpLCBidXQgSSBndWVzcyBpdCdzIG5vdCB3aXNlIHRvIG1ha2UgaXRcclxuLy8gIGVhc3kgZm9yIHVzZXJzIHNpbmNlIHdlIHdhbnQgdG8gbW92ZSBhd2F5IGZyb20gYmx1ZWJpcmQgaW4gdGhlIGZ1dHVyZSA/XHJcbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlblByb3BzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ/OiBzdHJpbmcpOiBJUHJvcHMge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSAocHJvZmlsZUlkICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKVxyXG4gICAgOiBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcblxyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgcmV0dXJuIHsgYXBpLCBzdGF0ZSwgcHJvZmlsZSwgbW9kcywgZGlzY292ZXJ5IH07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVMT0ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkPzogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzPzogSVByb3BzKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0LCBwcm9maWxlSWQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ZhaWxlZCB0byBnZW5lcmF0ZSBnYW1lIHByb3BzJykpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihwcm9wcy5kaXNjb3ZlcnkucGF0aCwgcHJvcHMucHJvZmlsZS5pZCArICdfJyArIExPX0ZJTEVfTkFNRSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyh0YXJnZXRQYXRoKVxyXG4gICAgICAuY2F0Y2goeyBjb2RlOiAnRU5PRU5UJyB9LCAoKSA9PiBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbiAgICByZXR1cm4gdGFyZ2V0UGF0aDtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcmVmaXgoaW5wdXQ6IG51bWJlcikge1xyXG4gIGxldCByZXMgPSAnJztcclxuICBsZXQgcmVzdCA9IGlucHV0O1xyXG4gIHdoaWxlIChyZXN0ID4gMCkge1xyXG4gICAgcmVzID0gU3RyaW5nLmZyb21DaGFyQ29kZSg2NSArIChyZXN0ICUgMjUpKSArIHJlcztcclxuICAgIHJlc3QgPSBNYXRoLmZsb29yKHJlc3QgLyAyNSk7XHJcbiAgfVxyXG4gIHJldHVybiB1dGlsLnBhZCgocmVzIGFzIGFueSksICdBJywgMyk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNb2ROYW1lKG1vZEluZm9QYXRoKTogUHJvbWlzZTxhbnk+IHtcclxuICBsZXQgbW9kSW5mbztcclxuICB0cnkge1xyXG4gICAgY29uc3QgeG1sRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kSW5mb1BhdGgpO1xyXG4gICAgbW9kSW5mbyA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSBtb2RJbmZvPy5Nb2RJbmZvPy5bMF0uTmFtZT8uWzBdPy4kPy52YWx1ZVxyXG4gICAgICAgICAgICAgICAgIHx8IG1vZEluZm8/LnhtbC5Nb2RJbmZvPy5bMF0/Lk5hbWU/LlswXT8uJD8udmFsdWU7XHJcbiAgICByZXR1cm4gKG1vZE5hbWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUobW9kTmFtZSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnVW5leHBlY3RlZCBtb2RpbmZvLnhtbCBmb3JtYXQnKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBwYXJzZSBNb2RJbmZvLnhtbCBmaWxlJykpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZEluZm9GaWxlcyhiYXNlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGxldCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gW107XHJcbiAgcmV0dXJuIHR1cmJvd2FsayhiYXNlUGF0aCwgZmlsZXMgPT4ge1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZW50cnkgPT5cclxuICAgICAgIWVudHJ5LmlzRGlyZWN0b3J5ICYmIHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSBNT0RfSU5GTyk7XHJcbiAgICBmaWxlUGF0aHMgPSBmaWxlUGF0aHMuY29uY2F0KGZpbHRlcmVkLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCkpO1xyXG4gIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXHJcbiAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aHMpKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQXR0cmlidXRlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfT4ge31cclxuZXhwb3J0IGludGVyZmFjZSBJWG1sTm9kZTxBdHRyaWJ1dGVUIGV4dGVuZHMgb2JqZWN0PiB7XHJcbiAgJDogQXR0cmlidXRlVDtcclxufVxyXG5leHBvcnQgaW50ZXJmYWNlIElNb2ROYW1lTm9kZSBleHRlbmRzIElYbWxOb2RlPHsgaWQ6ICdOYW1lJyB9PiB7XHJcbiAgYXR0cmlidXRlOiBJQXR0cmlidXRlO1xyXG59XHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1vZEluZm9Ob2RlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogJ01vZEluZm8nIH0+IHtcclxuICBjaGlsZHJlbj86IFt7IG5vZGU6IElNb2ROYW1lTm9kZVtdIH1dO1xyXG4gIGF0dHJpYnV0ZT86IElBdHRyaWJ1dGVbXTtcclxufVxyXG4iXX0=