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
exports.getModInfoFiles = exports.getModName = exports.makePrefix = exports.reversePrefix = exports.getPrefixOffset = exports.ensureLOFile = exports.genProps = exports.toBlue = exports.getModsPath = exports.selectUDF = exports.relaunchExt = exports.deploy = exports.purge = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const actions_1 = require("./actions");
const common_1 = require("./common");
const PARSER = new xml2js_1.Parser({ explicitRoot: false });
function purge(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => api.events.emit('purge-mods', true, (err) => err ? reject(err) : resolve()));
    });
}
exports.purge = purge;
function deploy(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => api.events.emit('deploy-mods', (err) => err ? reject(err) : resolve()));
    });
}
exports.deploy = deploy;
const relaunchExt = (api) => {
    return api.showDialog('info', 'Restart Required', {
        text: 'The extension requires a restart to complete the UDF setup. '
            + 'The extension will now exit - please re-activate it via the games page or dashboard.',
    }, [{ label: 'Restart Extension' }])
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield purge(api);
        const batched = [
            vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true),
            vortex_api_1.actions.setNextProfile(undefined),
        ];
        vortex_api_1.util.batchDispatch(api.store, batched);
    }));
};
exports.relaunchExt = relaunchExt;
const selectUDF = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const launcherSettings = (0, common_1.launcherSettingsFilePath)();
    const res = yield context.api.showDialog('info', 'Choose User Data Folder', {
        text: 'The modding pattern for 7DTD is changing. The Mods path inside the game directory '
            + 'is being deprecated and mods located in the old path will no longer work in the near '
            + 'future. Please select your User Data Folder (UDF) - Vortex will deploy to this new location. '
            + 'Please NEVER set your UDF path to Vortex\'s staging folder.',
    }, [
        { label: 'Cancel' },
        { label: 'Select UDF' },
    ]);
    if (res.action !== 'Select UDF') {
        return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UDF'));
    }
    yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(launcherSettings));
    yield ensureLOFile(context);
    let directory = yield context.api.selectDir({
        title: 'Select User Data Folder',
        defaultPath: path_1.default.join(path_1.default.dirname(launcherSettings)),
    });
    if (!directory) {
        return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UDF'));
    }
    const segments = directory.split(path_1.default.sep);
    const lowered = segments.map(seg => seg.toLowerCase());
    if (lowered[lowered.length - 1] === 'mods') {
        segments.pop();
        directory = segments.join(path_1.default.sep);
    }
    if (lowered.includes('vortex')) {
        return context.api.showDialog('info', 'Invalid User Data Folder', {
            text: 'The UDF cannot be set inside Vortex directories. Please select a different folder.',
        }, [
            { label: 'Try Again' }
        ]).then(() => (0, exports.selectUDF)(context));
    }
    yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(directory, 'Mods'));
    const launcher = common_1.DEFAULT_LAUNCHER_SETTINGS;
    launcher.DefaultRunConfig.AdditionalParameters = `-UserDataFolder="${directory}"`;
    const launcherData = JSON.stringify(launcher, null, 2);
    yield vortex_api_1.fs.writeFileAsync(launcherSettings, launcherData, { encoding: 'utf8' });
    context.api.store.dispatch((0, actions_1.setUDF)(directory));
    return (0, exports.relaunchExt)(context.api);
});
exports.selectUDF = selectUDF;
function getModsPath(api) {
    const state = api.getState();
    const udf = vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'udf'], undefined);
    return udf !== undefined ? path_1.default.join(udf, 'Mods') : 'Mods';
}
exports.getModsPath = getModsPath;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QiwwREFBa0M7QUFDbEMsMkNBQWlFO0FBQ2pFLG1DQUFnQztBQUVoQyx1Q0FBbUM7QUFFbkMscUNBQXFIO0FBR3JILE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7QUFFbkQsU0FBc0IsS0FBSyxDQUFDLEdBQXdCOztRQUNsRCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQzNDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDakYsQ0FBQztDQUFBO0FBSEQsc0JBR0M7QUFFRCxTQUFzQixNQUFNLENBQUMsR0FBd0I7O1FBQ25ELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FDM0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7Q0FBQTtBQUhELHdCQUdDO0FBRU0sTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDdEQsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTtRQUNo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dCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBzZXRVREYgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgREVGQVVMVF9MQVVOQ0hFUl9TRVRUSU5HUywgR0FNRV9JRCwgTU9EX0lORk8sIGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCwgbG9hZE9yZGVyRmlsZVBhdGggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuY29uc3QgUEFSU0VSID0gbmV3IFBhcnNlcih7IGV4cGxpY2l0Um9vdDogZmFsc2UgfSk7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHVyZ2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+XHJcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ3B1cmdlLW1vZHMnLCB0cnVlLCAoZXJyKSA9PiBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKSkpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVwbG95KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxyXG4gICAgYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIChlcnIpID0+IGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCByZWxhdW5jaEV4dCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcclxuICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnUmVzdGFydCBSZXF1aXJlZCcsIHtcclxuICAgIHRleHQ6ICdUaGUgZXh0ZW5zaW9uIHJlcXVpcmVzIGEgcmVzdGFydCB0byBjb21wbGV0ZSB0aGUgVURGIHNldHVwLiAnXHJcbiAgICAgICAgKyAnVGhlIGV4dGVuc2lvbiB3aWxsIG5vdyBleGl0IC0gcGxlYXNlIHJlLWFjdGl2YXRlIGl0IHZpYSB0aGUgZ2FtZXMgcGFnZSBvciBkYXNoYm9hcmQuJyxcclxuICB9LCBbIHsgbGFiZWw6ICdSZXN0YXJ0IEV4dGVuc2lvbicgfSBdKVxyXG4gIC50aGVuKGFzeW5jICgpID0+IHtcclxuICAgIGF3YWl0IHB1cmdlKGFwaSk7XHJcbiAgICBjb25zdCBiYXRjaGVkID0gW1xyXG4gICAgICBhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSksXHJcbiAgICAgIGFjdGlvbnMuc2V0TmV4dFByb2ZpbGUodW5kZWZpbmVkKSxcclxuICAgIF07XHJcbiAgICB1dGlsLmJhdGNoRGlzcGF0Y2goYXBpLnN0b3JlLCBiYXRjaGVkKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHNlbGVjdFVERiA9IGFzeW5jIChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkgPT4ge1xyXG4gIGNvbnN0IGxhdW5jaGVyU2V0dGluZ3MgPSBsYXVuY2hlclNldHRpbmdzRmlsZVBhdGgoKTtcclxuICBjb25zdCByZXMgPSBhd2FpdCBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0Nob29zZSBVc2VyIERhdGEgRm9sZGVyJywge1xyXG4gICAgdGV4dDogJ1RoZSBtb2RkaW5nIHBhdHRlcm4gZm9yIDdEVEQgaXMgY2hhbmdpbmcuIFRoZSBNb2RzIHBhdGggaW5zaWRlIHRoZSBnYW1lIGRpcmVjdG9yeSAnXHJcbiAgICAgICsgJ2lzIGJlaW5nIGRlcHJlY2F0ZWQgYW5kIG1vZHMgbG9jYXRlZCBpbiB0aGUgb2xkIHBhdGggd2lsbCBubyBsb25nZXIgd29yayBpbiB0aGUgbmVhciAnXHJcbiAgICAgICsgJ2Z1dHVyZS4gUGxlYXNlIHNlbGVjdCB5b3VyIFVzZXIgRGF0YSBGb2xkZXIgKFVERikgLSBWb3J0ZXggd2lsbCBkZXBsb3kgdG8gdGhpcyBuZXcgbG9jYXRpb24uICdcclxuICAgICAgKyAnUGxlYXNlIE5FVkVSIHNldCB5b3VyIFVERiBwYXRoIHRvIFZvcnRleFxcJ3Mgc3RhZ2luZyBmb2xkZXIuJyxcclxuICB9LFxyXG4gICAgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnU2VsZWN0IFVERicgfSxcclxuICAgIF0pO1xyXG4gIGlmIChyZXMuYWN0aW9uICE9PSAnU2VsZWN0IFVERicpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0Nhbm5vdCBwcm9jZWVkIHdpdGhvdXQgVURGJykpO1xyXG4gIH1cclxuICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShsYXVuY2hlclNldHRpbmdzKSk7XHJcbiAgYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xyXG4gIGxldCBkaXJlY3RvcnkgPSBhd2FpdCBjb250ZXh0LmFwaS5zZWxlY3REaXIoe1xyXG4gICAgdGl0bGU6ICdTZWxlY3QgVXNlciBEYXRhIEZvbGRlcicsXHJcbiAgICBkZWZhdWx0UGF0aDogcGF0aC5qb2luKHBhdGguZGlybmFtZShsYXVuY2hlclNldHRpbmdzKSksXHJcbiAgfSk7XHJcbiAgaWYgKCFkaXJlY3RvcnkpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0Nhbm5vdCBwcm9jZWVkIHdpdGhvdXQgVURGJykpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VnbWVudHMgPSBkaXJlY3Rvcnkuc3BsaXQocGF0aC5zZXApO1xyXG4gIGNvbnN0IGxvd2VyZWQgPSBzZWdtZW50cy5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcclxuICBpZiAobG93ZXJlZFtsb3dlcmVkLmxlbmd0aCAtIDFdID09PSAnbW9kcycpIHtcclxuICAgIHNlZ21lbnRzLnBvcCgpO1xyXG4gICAgZGlyZWN0b3J5ID0gc2VnbWVudHMuam9pbihwYXRoLnNlcCk7XHJcbiAgfVxyXG4gIGlmIChsb3dlcmVkLmluY2x1ZGVzKCd2b3J0ZXgnKSkge1xyXG4gICAgcmV0dXJuIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnSW52YWxpZCBVc2VyIERhdGEgRm9sZGVyJywge1xyXG4gICAgICB0ZXh0OiAnVGhlIFVERiBjYW5ub3QgYmUgc2V0IGluc2lkZSBWb3J0ZXggZGlyZWN0b3JpZXMuIFBsZWFzZSBzZWxlY3QgYSBkaWZmZXJlbnQgZm9sZGVyLicsXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdUcnkgQWdhaW4nIH1cclxuICAgIF0pLnRoZW4oKCkgPT4gc2VsZWN0VURGKGNvbnRleHQpKTtcclxuICB9XHJcbiAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlyZWN0b3J5LCAnTW9kcycpKTtcclxuICBjb25zdCBsYXVuY2hlciA9IERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1M7XHJcbiAgbGF1bmNoZXIuRGVmYXVsdFJ1bkNvbmZpZy5BZGRpdGlvbmFsUGFyYW1ldGVycyA9IGAtVXNlckRhdGFGb2xkZXI9XCIke2RpcmVjdG9yeX1cImA7XHJcbiAgY29uc3QgbGF1bmNoZXJEYXRhID0gSlNPTi5zdHJpbmdpZnkobGF1bmNoZXIsIG51bGwsIDIpO1xyXG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIGxhdW5jaGVyRGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFVERihkaXJlY3RvcnkpKTtcclxuICByZXR1cm4gcmVsYXVuY2hFeHQoY29udGV4dC5hcGkpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZHNQYXRoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IHN0cmluZyB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCB1ZGYgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICd1ZGYnXSwgdW5kZWZpbmVkKTtcclxuICByZXR1cm4gdWRmICE9PSB1bmRlZmluZWQgPyBwYXRoLmpvaW4odWRmLCAnTW9kcycpIDogJ01vZHMnO1xyXG59XHJcblxyXG4vLyBXZSBfc2hvdWxkXyBqdXN0IGV4cG9ydCB0aGlzIGZyb20gdm9ydGV4LWFwaSwgYnV0IEkgZ3Vlc3MgaXQncyBub3Qgd2lzZSB0byBtYWtlIGl0XHJcbi8vICBlYXN5IGZvciB1c2VycyBzaW5jZSB3ZSB3YW50IHRvIG1vdmUgYXdheSBmcm9tIGJsdWViaXJkIGluIHRoZSBmdXR1cmUgP1xyXG5leHBvcnQgZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkPzogc3RyaW5nKTogSVByb3BzIHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcclxuICAgIDogc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG5cclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIHJldHVybiB7IGFwaSwgc3RhdGUsIHByb2ZpbGUsIG1vZHMsIGRpc2NvdmVyeSB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlTE9GaWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkPzogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgfVxyXG5cclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0YXJnZXRQYXRoID0gbG9hZE9yZGVyRmlsZVBhdGgocHJvcHMucHJvZmlsZS5pZCk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyh0YXJnZXRQYXRoKVxyXG4gICAgICAuY2F0Y2goeyBjb2RlOiAnRU5PRU5UJyB9LCAoKSA9PiBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbiAgICByZXR1cm4gdGFyZ2V0UGF0aDtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZWZpeE9mZnNldChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBudW1iZXIge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIEhvdyA/XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJlZml4T2Zmc2V0JywgcHJvZmlsZUlkXSwgMCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXZlcnNlUHJlZml4KGlucHV0OiBzdHJpbmcpOiBudW1iZXIge1xyXG4gIGlmIChpbnB1dC5sZW5ndGggIT09IDMgfHwgaW5wdXQubWF0Y2goL1tBLVpdW0EtWl1bQS1aXS9nKSA9PT0gbnVsbCkge1xyXG4gICAgdGhyb3cgbmV3IHV0aWwuRGF0YUludmFsaWQoJ0ludmFsaWQgaW5wdXQsIHBsZWFzZSBwcm92aWRlIGEgdmFsaWQgcHJlZml4IChBQUEtWlpaKScpO1xyXG4gIH1cclxuICBjb25zdCBwcmVmaXggPSBpbnB1dC5zcGxpdCgnJyk7XHJcblxyXG4gIGNvbnN0IG9mZnNldCA9IHByZWZpeC5yZWR1Y2UoKHByZXYsIGl0ZXIsIGlkeCkgPT4ge1xyXG4gICAgY29uc3QgcG93ID0gMiAtIGlkeDtcclxuICAgIGNvbnN0IG11bHQgPSBNYXRoLnBvdygyNiwgcG93KTtcclxuICAgIGNvbnN0IGNoYXJDb2RlID0gKGl0ZXIuY2hhckNvZGVBdCgwKSAlIDY1KTtcclxuICAgIHByZXYgPSBwcmV2ICsgKGNoYXJDb2RlICogbXVsdCk7XHJcbiAgICByZXR1cm4gcHJldjtcclxuICB9LCAwKTtcclxuXHJcbiAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcmVmaXgoaW5wdXQ6IG51bWJlcikge1xyXG4gIGxldCByZXMgPSAnJztcclxuICBsZXQgcmVzdCA9IGlucHV0O1xyXG4gIHdoaWxlIChyZXN0ID4gMCkge1xyXG4gICAgcmVzID0gU3RyaW5nLmZyb21DaGFyQ29kZSg2NSArIChyZXN0ICUgMjYpKSArIHJlcztcclxuICAgIHJlc3QgPSBNYXRoLmZsb29yKHJlc3QgLyAyNik7XHJcbiAgfVxyXG4gIHJldHVybiB1dGlsLnBhZCgocmVzIGFzIGFueSksICdBJywgMyk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNb2ROYW1lKG1vZEluZm9QYXRoKTogUHJvbWlzZTxhbnk+IHtcclxuICBsZXQgbW9kSW5mbztcclxuICB0cnkge1xyXG4gICAgY29uc3QgeG1sRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kSW5mb1BhdGgpO1xyXG4gICAgbW9kSW5mbyA9IGF3YWl0IFBBUlNFUi5wYXJzZVN0cmluZ1Byb21pc2UoeG1sRGF0YSk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gbW9kSW5mbz8uRGlzcGxheU5hbWU/LlswXT8uJD8udmFsdWVcclxuICAgICAgfHwgbW9kSW5mbz8uTW9kSW5mbz8uWzBdPy5OYW1lPy5bMF0/LiQ/LnZhbHVlXHJcbiAgICAgIHx8IG1vZEluZm8/Lk5hbWU/LlswXT8uJD8udmFsdWU7XHJcbiAgICByZXR1cm4gKG1vZE5hbWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUobW9kTmFtZSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnVW5leHBlY3RlZCBtb2RpbmZvLnhtbCBmb3JtYXQnKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBwYXJzZSBNb2RJbmZvLnhtbCBmaWxlJykpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZEluZm9GaWxlcyhiYXNlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGxldCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gW107XHJcbiAgcmV0dXJuIHR1cmJvd2FsayhiYXNlUGF0aCwgZmlsZXMgPT4ge1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZW50cnkgPT5cclxuICAgICAgIWVudHJ5LmlzRGlyZWN0b3J5ICYmIHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSBNT0RfSU5GTyk7XHJcbiAgICBmaWxlUGF0aHMgPSBmaWxlUGF0aHMuY29uY2F0KGZpbHRlcmVkLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCkpO1xyXG4gIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aHMpKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQXR0cmlidXRlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfT4geyB9XHJcbmV4cG9ydCBpbnRlcmZhY2UgSVhtbE5vZGU8QXR0cmlidXRlVCBleHRlbmRzIG9iamVjdD4ge1xyXG4gICQ6IEF0dHJpYnV0ZVQ7XHJcbn1cclxuZXhwb3J0IGludGVyZmFjZSBJTW9kTmFtZU5vZGUgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiAnTmFtZScgfT4ge1xyXG4gIGF0dHJpYnV0ZTogSUF0dHJpYnV0ZTtcclxufVxyXG5leHBvcnQgaW50ZXJmYWNlIElNb2RJbmZvTm9kZSBleHRlbmRzIElYbWxOb2RlPHsgaWQ6ICdNb2RJbmZvJyB9PiB7XHJcbiAgY2hpbGRyZW4/OiBbeyBub2RlOiBJTW9kTmFtZU5vZGVbXSB9XTtcclxuICBhdHRyaWJ1dGU/OiBJQXR0cmlidXRlW107XHJcbn1cclxuIl19