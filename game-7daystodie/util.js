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
const libxmljs_1 = require("libxmljs");
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
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
    return __awaiter(this, void 0, void 0, function* () {
        let modInfo;
        try {
            const xmlData = yield vortex_api_1.fs.readFileAsync(modInfoPath);
            modInfo = (0, libxmljs_1.parseXmlString)(xmlData);
            const modName = modInfo.get('//Name');
            return ((modName !== undefined) && (modName.attr('value').value() !== undefined))
                ? Promise.resolve(modName.attr('value').value())
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLHVDQUEwQztBQUMxQyxnREFBd0I7QUFDeEIsMERBQWtDO0FBQ2xDLDJDQUF3RDtBQUV4RCxxQ0FBMkQ7QUFLM0QsU0FBZ0IsTUFBTSxDQUFJLElBQW9DO0lBQzVELE9BQU8sQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixRQUFRLENBQUMsT0FBZ0MsRUFBRSxTQUFrQjtJQUMzRSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLE9BQU8sR0FBbUIsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVuQyxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxTQUFTLEdBQTJCLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDMUQsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDOUQsSUFBSSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFO1FBQ2pDLE9B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ZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBwYXJzZVhtbFN0cmluZyB9IGZyb20gJ2xpYnhtbGpzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIExPX0ZJTEVfTkFNRSwgTU9EX0lORk8gfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuLy8gV2UgX3Nob3VsZF8ganVzdCBleHBvcnQgdGhpcyBmcm9tIHZvcnRleC1hcGksIGJ1dCBJIGd1ZXNzIGl0J3Mgbm90IHdpc2UgdG8gbWFrZSBpdFxyXG4vLyAgZWFzeSBmb3IgdXNlcnMgc2luY2Ugd2Ugd2FudCB0byBtb3ZlIGF3YXkgZnJvbSBibHVlYmlyZCBpbiB0aGUgZnV0dXJlID9cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuUHJvcHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZD86IHN0cmluZyk6IElQcm9wcyB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IChwcm9maWxlSWQgIT09IHVuZGVmaW5lZClcclxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXHJcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuXHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICByZXR1cm4geyBhcGksIHN0YXRlLCBwcm9maWxlLCBtb2RzLCBkaXNjb3ZlcnkgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUxPRmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgfVxyXG5cclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKHByb3BzLmRpc2NvdmVyeS5wYXRoLCBwcm9wcy5wcm9maWxlLmlkICsgJ18nICsgTE9fRklMRV9OQU1FKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHRhcmdldFBhdGgpXHJcbiAgICAgIC5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IGZzLndyaXRlRmlsZUFzeW5jKHRhcmdldFBhdGgsIEpTT04uc3RyaW5naWZ5KFtdKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxuICAgIHJldHVybiB0YXJnZXRQYXRoO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByZWZpeChpbnB1dDogbnVtYmVyKSB7XHJcbiAgbGV0IHJlcyA9ICcnO1xyXG4gIGxldCByZXN0ID0gaW5wdXQ7XHJcbiAgd2hpbGUgKHJlc3QgPiAwKSB7XHJcbiAgICByZXMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgKHJlc3QgJSAyNSkpICsgcmVzO1xyXG4gICAgcmVzdCA9IE1hdGguZmxvb3IocmVzdCAvIDI1KTtcclxuICB9XHJcbiAgcmV0dXJuIHV0aWwucGFkKChyZXMgYXMgYW55KSwgJ0EnLCAzKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZE5hbWUobW9kSW5mb1BhdGgpOiBQcm9taXNlPGFueT4ge1xyXG4gIGxldCBtb2RJbmZvO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB4bWxEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RJbmZvUGF0aCk7XHJcbiAgICBtb2RJbmZvID0gcGFyc2VYbWxTdHJpbmcoeG1sRGF0YSk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gbW9kSW5mby5nZXQoJy8vTmFtZScpO1xyXG4gICAgcmV0dXJuICgobW9kTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiAobW9kTmFtZS5hdHRyKCd2YWx1ZScpLnZhbHVlKCkgIT09IHVuZGVmaW5lZCkpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWUuYXR0cigndmFsdWUnKS52YWx1ZSgpKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdVbmV4cGVjdGVkIG1vZGluZm8ueG1sIGZvcm1hdCcpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHBhcnNlIE1vZEluZm8ueG1sIGZpbGUnKSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TW9kSW5mb0ZpbGVzKGJhc2VQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgbGV0IGZpbGVQYXRoczogc3RyaW5nW10gPSBbXTtcclxuICByZXR1cm4gdHVyYm93YWxrKGJhc2VQYXRoLCBmaWxlcyA9PiB7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihlbnRyeSA9PlxyXG4gICAgICAhZW50cnkuaXNEaXJlY3RvcnkgJiYgcGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09IE1PRF9JTkZPKTtcclxuICAgIGZpbGVQYXRocyA9IGZpbGVQYXRocy5jb25jYXQoZmlsdGVyZWQubWFwKGVudHJ5ID0+IGVudHJ5LmZpbGVQYXRoKSk7XHJcbiAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcclxuICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVQYXRocykpO1xyXG59XHJcbiJdfQ==