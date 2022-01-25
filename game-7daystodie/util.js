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
exports.getModInfoFiles = exports.getModName = exports.makePrefix = exports.reversePrefix = exports.getPrefixOffset = exports.ensureLOFile = exports.genProps = exports.toBlue = void 0;
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
function getPrefixOffset(api) {
    var _a;
    const state = api.getState();
    const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
    if (profileId === undefined) {
        api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
        return;
    }
    return vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'prefixOffset', profileId], 0);
}
exports.getPrefixOffset = getPrefixOffset;
function reversePrefix(input) {
    if (input.length !== 3 || input.match(/[A-Z][A-Z][A-Z]/g) === null) {
        throw new vortex_api_1.util.DataInvalid('Invalid input, please provide a valid prefix (AAA-ZZZ)');
    }
    const prefix = input.split('');
    const offset = prefix.reduce((prev, iter, idx) => {
        const pow = 2 - idx;
        const mult = Math.pow(25, pow);
        const charCode = (iter.charCodeAt(0) % 65);
        prev = prev + (charCode * mult);
        return prev;
    }, 0);
    return offset;
}
exports.reversePrefix = reversePrefix;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QiwwREFBa0M7QUFDbEMsMkNBQXdEO0FBQ3hELG1DQUE0QztBQUU1QyxxQ0FBMkQ7QUFLM0QsU0FBZ0IsTUFBTSxDQUFJLElBQW9DO0lBQzVELE9BQU8sQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixRQUFRLENBQUMsT0FBZ0MsRUFBRSxTQUFrQjtJQUMzRSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLE9BQU8sR0FBbUIsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVuQyxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxTQUFTLEdBQTJCLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDMUQsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDOUQsSUFBSSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFO1FBQ2pDLE9B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V0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDdEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMzQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FBQTtBQVZELDBDQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIExPX0ZJTEVfTkFNRSwgTU9EX0lORk8gfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuLy8gV2UgX3Nob3VsZF8ganVzdCBleHBvcnQgdGhpcyBmcm9tIHZvcnRleC1hcGksIGJ1dCBJIGd1ZXNzIGl0J3Mgbm90IHdpc2UgdG8gbWFrZSBpdFxyXG4vLyAgZWFzeSBmb3IgdXNlcnMgc2luY2Ugd2Ugd2FudCB0byBtb3ZlIGF3YXkgZnJvbSBibHVlYmlyZCBpbiB0aGUgZnV0dXJlID9cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuUHJvcHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZD86IHN0cmluZyk6IElQcm9wcyB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IChwcm9maWxlSWQgIT09IHVuZGVmaW5lZClcclxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXHJcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuXHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICByZXR1cm4geyBhcGksIHN0YXRlLCBwcm9maWxlLCBtb2RzLCBkaXNjb3ZlcnkgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUxPRmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgfVxyXG5cclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKHByb3BzLmRpc2NvdmVyeS5wYXRoLCBwcm9wcy5wcm9maWxlLmlkICsgJ18nICsgTE9fRklMRV9OQU1FKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHRhcmdldFBhdGgpXHJcbiAgICAgIC5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IGZzLndyaXRlRmlsZUFzeW5jKHRhcmdldFBhdGgsIEpTT04uc3RyaW5naWZ5KFtdKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxuICAgIHJldHVybiB0YXJnZXRQYXRoO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlZml4T2Zmc2V0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IG51bWJlciB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gSG93ID9cclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ05vIGFjdGl2ZSBwcm9maWxlIGZvciA3ZHRkJywgdW5kZWZpbmVkLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHJldHVybiB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICdwcmVmaXhPZmZzZXQnLCBwcm9maWxlSWRdLCAwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJldmVyc2VQcmVmaXgoaW5wdXQ6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgaWYgKGlucHV0Lmxlbmd0aCAhPT0gMyB8fCBpbnB1dC5tYXRjaCgvW0EtWl1bQS1aXVtBLVpdL2cpID09PSBudWxsKSB7XHJcbiAgICB0aHJvdyBuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBpbnB1dCwgcGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBwcmVmaXggKEFBQS1aWlopJyk7XHJcbiAgfVxyXG4gIGNvbnN0IHByZWZpeCA9IGlucHV0LnNwbGl0KCcnKTtcclxuXHJcbiAgY29uc3Qgb2Zmc2V0ID0gcHJlZml4LnJlZHVjZSgocHJldiwgaXRlciwgaWR4KSA9PiB7XHJcbiAgICBjb25zdCBwb3cgPSAyIC0gaWR4O1xyXG4gICAgY29uc3QgbXVsdCA9IE1hdGgucG93KDI1LCBwb3cpO1xyXG4gICAgY29uc3QgY2hhckNvZGUgPSAoaXRlci5jaGFyQ29kZUF0KDApICUgNjUpO1xyXG4gICAgcHJldiA9IHByZXYgKyAoY2hhckNvZGUgKiBtdWx0KTtcclxuICAgIHJldHVybiBwcmV2O1xyXG4gIH0sIDApO1xyXG5cclxuICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByZWZpeChpbnB1dDogbnVtYmVyKSB7XHJcbiAgbGV0IHJlcyA9ICcnO1xyXG4gIGxldCByZXN0ID0gaW5wdXQ7XHJcbiAgd2hpbGUgKHJlc3QgPiAwKSB7XHJcbiAgICByZXMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgKHJlc3QgJSAyNSkpICsgcmVzO1xyXG4gICAgcmVzdCA9IE1hdGguZmxvb3IocmVzdCAvIDI1KTtcclxuICB9XHJcbiAgcmV0dXJuIHV0aWwucGFkKChyZXMgYXMgYW55KSwgJ0EnLCAzKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZE5hbWUobW9kSW5mb1BhdGgpOiBQcm9taXNlPGFueT4ge1xyXG4gIGxldCBtb2RJbmZvO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB4bWxEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RJbmZvUGF0aCk7XHJcbiAgICBtb2RJbmZvID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKHhtbERhdGEpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9IG1vZEluZm8/Lk1vZEluZm8/LlswXS5OYW1lPy5bMF0/LiQ/LnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgfHwgbW9kSW5mbz8ueG1sLk1vZEluZm8/LlswXT8uTmFtZT8uWzBdPy4kPy52YWx1ZTtcclxuICAgIHJldHVybiAobW9kTmFtZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZShtb2ROYW1lKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdVbmV4cGVjdGVkIG1vZGluZm8ueG1sIGZvcm1hdCcpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHBhcnNlIE1vZEluZm8ueG1sIGZpbGUnKSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TW9kSW5mb0ZpbGVzKGJhc2VQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgbGV0IGZpbGVQYXRoczogc3RyaW5nW10gPSBbXTtcclxuICByZXR1cm4gdHVyYm93YWxrKGJhc2VQYXRoLCBmaWxlcyA9PiB7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihlbnRyeSA9PlxyXG4gICAgICAhZW50cnkuaXNEaXJlY3RvcnkgJiYgcGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09IE1PRF9JTkZPKTtcclxuICAgIGZpbGVQYXRocyA9IGZpbGVQYXRocy5jb25jYXQoZmlsdGVyZWQubWFwKGVudHJ5ID0+IGVudHJ5LmZpbGVQYXRoKSk7XHJcbiAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcclxuICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVQYXRocykpO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElBdHRyaWJ1dGUgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9PiB7fVxyXG5leHBvcnQgaW50ZXJmYWNlIElYbWxOb2RlPEF0dHJpYnV0ZVQgZXh0ZW5kcyBvYmplY3Q+IHtcclxuICAkOiBBdHRyaWJ1dGVUO1xyXG59XHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1vZE5hbWVOb2RlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogJ05hbWUnIH0+IHtcclxuICBhdHRyaWJ1dGU6IElBdHRyaWJ1dGU7XHJcbn1cclxuZXhwb3J0IGludGVyZmFjZSBJTW9kSW5mb05vZGUgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiAnTW9kSW5mbycgfT4ge1xyXG4gIGNoaWxkcmVuPzogW3sgbm9kZTogSU1vZE5hbWVOb2RlW10gfV07XHJcbiAgYXR0cmlidXRlPzogSUF0dHJpYnV0ZVtdO1xyXG59XHJcbiJdfQ==