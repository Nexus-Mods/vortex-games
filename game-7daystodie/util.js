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
const PARSER = new xml2js_1.Parser({ explicitRoot: false });
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
        const targetPath = (0, common_1.loadOrderFilePath)(props.profile.id);
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
        const mult = Math.pow(26, pow);
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
        res = String.fromCharCode(65 + (rest % 26)) + res;
        rest = Math.floor(rest / 26);
    }
    return vortex_api_1.util.pad(res, 'A', 3);
}
exports.makePrefix = makePrefix;
function getModName(modInfoPath) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __awaiter(this, void 0, void 0, function* () {
        let modInfo;
        try {
            const xmlData = yield vortex_api_1.fs.readFileAsync(modInfoPath);
            modInfo = yield PARSER.parseStringPromise(xmlData);
            const modName = ((_c = (_b = (_a = modInfo === null || modInfo === void 0 ? void 0 : modInfo.DisplayName) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.$) === null || _c === void 0 ? void 0 : _c.value)
                || ((_h = (_g = (_f = (_e = (_d = modInfo === null || modInfo === void 0 ? void 0 : modInfo.ModInfo) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.Name) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.$) === null || _h === void 0 ? void 0 : _h.value)
                || ((_l = (_k = (_j = modInfo === null || modInfo === void 0 ? void 0 : modInfo.Name) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.$) === null || _l === void 0 ? void 0 : _l.value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QiwwREFBa0M7QUFDbEMsMkNBQXdEO0FBQ3hELG1DQUFnQztBQUVoQyxxQ0FBZ0U7QUFHaEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsRUFBQyxZQUFZLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUlqRCxTQUFnQixNQUFNLENBQUksSUFBb0M7SUFDNUQsT0FBTyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUUsQ0FBQyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFGRCx3QkFFQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxPQUFnQyxFQUFFLFNBQWtCO0lBQzNFLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDeEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sT0FBTyxHQUFtQixDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUM7UUFDdkQsQ0FBQyxDQUFDLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUM7UUFDekMsQ0FBQyxDQUFDLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRW5DLElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7UUFDL0IsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxNQUFNLFNBQVMsR0FBMkIsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUMxRCxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5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LElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDckMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDdEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMzQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FBQTtBQVZELDBDQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSAneG1sMmpzJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIE1PRF9JTkZPLCBsb2FkT3JkZXJGaWxlUGF0aCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5jb25zdCBQQVJTRVIgPSBuZXcgUGFyc2VyKHtleHBsaWNpdFJvb3Q6IGZhbHNlfSk7XHJcblxyXG4vLyBXZSBfc2hvdWxkXyBqdXN0IGV4cG9ydCB0aGlzIGZyb20gdm9ydGV4LWFwaSwgYnV0IEkgZ3Vlc3MgaXQncyBub3Qgd2lzZSB0byBtYWtlIGl0XHJcbi8vICBlYXN5IGZvciB1c2VycyBzaW5jZSB3ZSB3YW50IHRvIG1vdmUgYXdheSBmcm9tIGJsdWViaXJkIGluIHRoZSBmdXR1cmUgP1xyXG5leHBvcnQgZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkPzogc3RyaW5nKTogSVByb3BzIHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcclxuICAgIDogc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG5cclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIHJldHVybiB7IGFwaSwgc3RhdGUsIHByb2ZpbGUsIG1vZHMsIGRpc2NvdmVyeSB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlTE9GaWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcz86IElQcm9wcyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHByb3BzID0gZ2VuUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICB9XHJcblxyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdmYWlsZWQgdG8gZ2VuZXJhdGUgZ2FtZSBwcm9wcycpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRhcmdldFBhdGggPSBsb2FkT3JkZXJGaWxlUGF0aChwcm9wcy5wcm9maWxlLmlkKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHRhcmdldFBhdGgpXHJcbiAgICAgIC5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IGZzLndyaXRlRmlsZUFzeW5jKHRhcmdldFBhdGgsIEpTT04uc3RyaW5naWZ5KFtdKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxuICAgIHJldHVybiB0YXJnZXRQYXRoO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlZml4T2Zmc2V0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IG51bWJlciB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gSG93ID9cclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ05vIGFjdGl2ZSBwcm9maWxlIGZvciA3ZHRkJywgdW5kZWZpbmVkLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHJldHVybiB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICdwcmVmaXhPZmZzZXQnLCBwcm9maWxlSWRdLCAwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJldmVyc2VQcmVmaXgoaW5wdXQ6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgaWYgKGlucHV0Lmxlbmd0aCAhPT0gMyB8fCBpbnB1dC5tYXRjaCgvW0EtWl1bQS1aXVtBLVpdL2cpID09PSBudWxsKSB7XHJcbiAgICB0aHJvdyBuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBpbnB1dCwgcGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBwcmVmaXggKEFBQS1aWlopJyk7XHJcbiAgfVxyXG4gIGNvbnN0IHByZWZpeCA9IGlucHV0LnNwbGl0KCcnKTtcclxuXHJcbiAgY29uc3Qgb2Zmc2V0ID0gcHJlZml4LnJlZHVjZSgocHJldiwgaXRlciwgaWR4KSA9PiB7XHJcbiAgICBjb25zdCBwb3cgPSAyIC0gaWR4O1xyXG4gICAgY29uc3QgbXVsdCA9IE1hdGgucG93KDI2LCBwb3cpO1xyXG4gICAgY29uc3QgY2hhckNvZGUgPSAoaXRlci5jaGFyQ29kZUF0KDApICUgNjUpO1xyXG4gICAgcHJldiA9IHByZXYgKyAoY2hhckNvZGUgKiBtdWx0KTtcclxuICAgIHJldHVybiBwcmV2O1xyXG4gIH0sIDApO1xyXG5cclxuICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByZWZpeChpbnB1dDogbnVtYmVyKSB7XHJcbiAgbGV0IHJlcyA9ICcnO1xyXG4gIGxldCByZXN0ID0gaW5wdXQ7XHJcbiAgd2hpbGUgKHJlc3QgPiAwKSB7XHJcbiAgICByZXMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgKHJlc3QgJSAyNikpICsgcmVzO1xyXG4gICAgcmVzdCA9IE1hdGguZmxvb3IocmVzdCAvIDI2KTtcclxuICB9XHJcbiAgcmV0dXJuIHV0aWwucGFkKChyZXMgYXMgYW55KSwgJ0EnLCAzKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZE5hbWUobW9kSW5mb1BhdGgpOiBQcm9taXNlPGFueT4ge1xyXG4gIGxldCBtb2RJbmZvO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB4bWxEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RJbmZvUGF0aCk7XHJcbiAgICBtb2RJbmZvID0gYXdhaXQgUEFSU0VSLnBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSBtb2RJbmZvPy5EaXNwbGF5TmFtZT8uWzBdPy4kPy52YWx1ZVxyXG4gICAgICAgICAgICAgICAgIHx8IG1vZEluZm8/Lk1vZEluZm8/LlswXT8uTmFtZT8uWzBdPy4kPy52YWx1ZVxyXG4gICAgICAgICAgICAgICAgIHx8IG1vZEluZm8/Lk5hbWU/LlswXT8uJD8udmFsdWU7XHJcbiAgICByZXR1cm4gKG1vZE5hbWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUobW9kTmFtZSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnVW5leHBlY3RlZCBtb2RpbmZvLnhtbCBmb3JtYXQnKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBwYXJzZSBNb2RJbmZvLnhtbCBmaWxlJykpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZEluZm9GaWxlcyhiYXNlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGxldCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gW107XHJcbiAgcmV0dXJuIHR1cmJvd2FsayhiYXNlUGF0aCwgZmlsZXMgPT4ge1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZW50cnkgPT5cclxuICAgICAgIWVudHJ5LmlzRGlyZWN0b3J5ICYmIHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSBNT0RfSU5GTyk7XHJcbiAgICBmaWxlUGF0aHMgPSBmaWxlUGF0aHMuY29uY2F0KGZpbHRlcmVkLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCkpO1xyXG4gIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXHJcbiAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aHMpKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQXR0cmlidXRlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfT4ge31cclxuZXhwb3J0IGludGVyZmFjZSBJWG1sTm9kZTxBdHRyaWJ1dGVUIGV4dGVuZHMgb2JqZWN0PiB7XHJcbiAgJDogQXR0cmlidXRlVDtcclxufVxyXG5leHBvcnQgaW50ZXJmYWNlIElNb2ROYW1lTm9kZSBleHRlbmRzIElYbWxOb2RlPHsgaWQ6ICdOYW1lJyB9PiB7XHJcbiAgYXR0cmlidXRlOiBJQXR0cmlidXRlO1xyXG59XHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1vZEluZm9Ob2RlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogJ01vZEluZm8nIH0+IHtcclxuICBjaGlsZHJlbj86IFt7IG5vZGU6IElNb2ROYW1lTm9kZVtdIH1dO1xyXG4gIGF0dHJpYnV0ZT86IElBdHRyaWJ1dGVbXTtcclxufVxyXG4iXX0=