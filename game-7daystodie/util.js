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
exports.selectUDF = exports.relaunchExt = void 0;
exports.purge = purge;
exports.deploy = deploy;
exports.getModsPath = getModsPath;
exports.toBlue = toBlue;
exports.genProps = genProps;
exports.ensureLOFile = ensureLOFile;
exports.getPrefixOffset = getPrefixOffset;
exports.reversePrefix = reversePrefix;
exports.makePrefix = makePrefix;
exports.getModName = getModName;
exports.getModInfoFiles = getModInfoFiles;
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
        return new Promise((resolve, reject) => api.events.emit('purge-mods', false, (err) => err ? reject(err) : resolve()));
    });
}
function deploy(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => api.events.emit('deploy-mods', (err) => err ? reject(err) : resolve()));
    });
}
const relaunchExt = (api) => {
    return api.showDialog('info', 'Restart Required', {
        text: 'The extension requires a restart to complete the UDF setup. '
            + 'The extension will now exit - please re-activate it via the games page or dashboard.',
    }, [{ label: 'Restart Extension' }])
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield purge(api);
            const batched = [
                vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true),
                vortex_api_1.actions.setNextProfile(undefined),
            ];
            vortex_api_1.util.batchDispatch(api.store, batched);
        }
        catch (err) {
            api.showErrorNotification('Failed to set up UDF', err);
            return Promise.resolve();
        }
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
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
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
function makePrefix(input) {
    let res = '';
    let rest = input;
    while (rest > 0) {
        res = String.fromCharCode(65 + (rest % 26)) + res;
        rest = Math.floor(rest / 26);
    }
    return vortex_api_1.util.pad(res, 'A', 3);
}
function getModName(modInfoPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsc0JBR0M7QUFFRCx3QkFHQztBQXFFRCxrQ0FJQztBQUlELHdCQUVDO0FBRUQsNEJBbUJDO0FBRUQsb0NBbUJDO0FBRUQsMENBVUM7QUFFRCxzQ0FlQztBQUVELGdDQVFDO0FBRUQsZ0NBY0M7QUFFRCwwQ0FVQztBQWpORCx3REFBZ0M7QUFDaEMsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBaUU7QUFDakUsbUNBQWdDO0FBRWhDLHVDQUFtQztBQUVuQyxxQ0FBcUg7QUFHckgsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUVuRCxTQUFzQixLQUFLLENBQUMsR0FBd0I7O1FBQ2xELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FDM0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRixDQUFDO0NBQUE7QUFFRCxTQUFzQixNQUFNLENBQUMsR0FBd0I7O1FBQ25ELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FDM0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7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LEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDbkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDdEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMzQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBzZXRVREYgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgREVGQVVMVF9MQVVOQ0hFUl9TRVRUSU5HUywgR0FNRV9JRCwgTU9EX0lORk8sIGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCwgbG9hZE9yZGVyRmlsZVBhdGggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuY29uc3QgUEFSU0VSID0gbmV3IFBhcnNlcih7IGV4cGxpY2l0Um9vdDogZmFsc2UgfSk7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHVyZ2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+XHJcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ3B1cmdlLW1vZHMnLCBmYWxzZSwgKGVycikgPT4gZXJyID8gcmVqZWN0KGVycikgOiByZXNvbHZlKCkpKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlcGxveShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT5cclxuICAgIGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCAoZXJyKSA9PiBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKSkpO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcmVsYXVuY2hFeHQgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XHJcbiAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1Jlc3RhcnQgUmVxdWlyZWQnLCB7XHJcbiAgICB0ZXh0OiAnVGhlIGV4dGVuc2lvbiByZXF1aXJlcyBhIHJlc3RhcnQgdG8gY29tcGxldGUgdGhlIFVERiBzZXR1cC4gJ1xyXG4gICAgICAgICsgJ1RoZSBleHRlbnNpb24gd2lsbCBub3cgZXhpdCAtIHBsZWFzZSByZS1hY3RpdmF0ZSBpdCB2aWEgdGhlIGdhbWVzIHBhZ2Ugb3IgZGFzaGJvYXJkLicsXHJcbiAgfSwgWyB7IGxhYmVsOiAnUmVzdGFydCBFeHRlbnNpb24nIH0gXSlcclxuICAudGhlbihhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBwdXJnZShhcGkpO1xyXG4gICAgICBjb25zdCBiYXRjaGVkID0gW1xyXG4gICAgICAgIGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSxcclxuICAgICAgICBhY3Rpb25zLnNldE5leHRQcm9maWxlKHVuZGVmaW5lZCksXHJcbiAgICAgIF07XHJcbiAgICAgIHV0aWwuYmF0Y2hEaXNwYXRjaChhcGkuc3RvcmUsIGJhdGNoZWQpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzZXQgdXAgVURGJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc2VsZWN0VURGID0gYXN5bmMgKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSA9PiB7XHJcbiAgY29uc3QgbGF1bmNoZXJTZXR0aW5ncyA9IGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCgpO1xyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnQ2hvb3NlIFVzZXIgRGF0YSBGb2xkZXInLCB7XHJcbiAgICB0ZXh0OiAnVGhlIG1vZGRpbmcgcGF0dGVybiBmb3IgN0RURCBpcyBjaGFuZ2luZy4gVGhlIE1vZHMgcGF0aCBpbnNpZGUgdGhlIGdhbWUgZGlyZWN0b3J5ICdcclxuICAgICAgKyAnaXMgYmVpbmcgZGVwcmVjYXRlZCBhbmQgbW9kcyBsb2NhdGVkIGluIHRoZSBvbGQgcGF0aCB3aWxsIG5vIGxvbmdlciB3b3JrIGluIHRoZSBuZWFyICdcclxuICAgICAgKyAnZnV0dXJlLiBQbGVhc2Ugc2VsZWN0IHlvdXIgVXNlciBEYXRhIEZvbGRlciAoVURGKSAtIFZvcnRleCB3aWxsIGRlcGxveSB0byB0aGlzIG5ldyBsb2NhdGlvbi4gJ1xyXG4gICAgICArICdQbGVhc2UgTkVWRVIgc2V0IHlvdXIgVURGIHBhdGggdG8gVm9ydGV4XFwncyBzdGFnaW5nIGZvbGRlci4nLFxyXG4gIH0sXHJcbiAgICBbXHJcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdTZWxlY3QgVURGJyB9LFxyXG4gICAgXSk7XHJcbiAgaWYgKHJlcy5hY3Rpb24gIT09ICdTZWxlY3QgVURGJykge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVREYnKSk7XHJcbiAgfVxyXG4gIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGxhdW5jaGVyU2V0dGluZ3MpKTtcclxuICBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgbGV0IGRpcmVjdG9yeSA9IGF3YWl0IGNvbnRleHQuYXBpLnNlbGVjdERpcih7XHJcbiAgICB0aXRsZTogJ1NlbGVjdCBVc2VyIERhdGEgRm9sZGVyJyxcclxuICAgIGRlZmF1bHRQYXRoOiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGxhdW5jaGVyU2V0dGluZ3MpKSxcclxuICB9KTtcclxuICBpZiAoIWRpcmVjdG9yeSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVREYnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzZWdtZW50cyA9IGRpcmVjdG9yeS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgY29uc3QgbG93ZXJlZCA9IHNlZ21lbnRzLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xyXG4gIGlmIChsb3dlcmVkW2xvd2VyZWQubGVuZ3RoIC0gMV0gPT09ICdtb2RzJykge1xyXG4gICAgc2VnbWVudHMucG9wKCk7XHJcbiAgICBkaXJlY3RvcnkgPSBzZWdtZW50cy5qb2luKHBhdGguc2VwKTtcclxuICB9XHJcbiAgaWYgKGxvd2VyZWQuaW5jbHVkZXMoJ3ZvcnRleCcpKSB7XHJcbiAgICByZXR1cm4gY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdJbnZhbGlkIFVzZXIgRGF0YSBGb2xkZXInLCB7XHJcbiAgICAgIHRleHQ6ICdUaGUgVURGIGNhbm5vdCBiZSBzZXQgaW5zaWRlIFZvcnRleCBkaXJlY3Rvcmllcy4gUGxlYXNlIHNlbGVjdCBhIGRpZmZlcmVudCBmb2xkZXIuJyxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ1RyeSBBZ2FpbicgfVxyXG4gICAgXSkudGhlbigoKSA9PiBzZWxlY3RVREYoY29udGV4dCkpO1xyXG4gIH1cclxuICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXJlY3RvcnksICdNb2RzJykpO1xyXG4gIGNvbnN0IGxhdW5jaGVyID0gREVGQVVMVF9MQVVOQ0hFUl9TRVRUSU5HUztcclxuICBsYXVuY2hlci5EZWZhdWx0UnVuQ29uZmlnLkFkZGl0aW9uYWxQYXJhbWV0ZXJzID0gYC1Vc2VyRGF0YUZvbGRlcj1cIiR7ZGlyZWN0b3J5fVwiYDtcclxuICBjb25zdCBsYXVuY2hlckRhdGEgPSBKU09OLnN0cmluZ2lmeShsYXVuY2hlciwgbnVsbCwgMik7XHJcbiAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobGF1bmNoZXJTZXR0aW5ncywgbGF1bmNoZXJEYXRhLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0VURGKGRpcmVjdG9yeSkpO1xyXG4gIHJldHVybiByZWxhdW5jaEV4dChjb250ZXh0LmFwaSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kc1BhdGgoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogc3RyaW5nIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHVkZiA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3VkZiddLCB1bmRlZmluZWQpO1xyXG4gIHJldHVybiB1ZGYgIT09IHVuZGVmaW5lZCA/IHBhdGguam9pbih1ZGYsICdNb2RzJykgOiAnTW9kcyc7XHJcbn1cclxuXHJcbi8vIFdlIF9zaG91bGRfIGp1c3QgZXhwb3J0IHRoaXMgZnJvbSB2b3J0ZXgtYXBpLCBidXQgSSBndWVzcyBpdCdzIG5vdCB3aXNlIHRvIG1ha2UgaXRcclxuLy8gIGVhc3kgZm9yIHVzZXJzIHNpbmNlIHdlIHdhbnQgdG8gbW92ZSBhd2F5IGZyb20gYmx1ZWJpcmQgaW4gdGhlIGZ1dHVyZSA/XHJcbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlblByb3BzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ/OiBzdHJpbmcpOiBJUHJvcHMge1xyXG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSAocHJvZmlsZUlkICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKVxyXG4gICAgOiBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcblxyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgcmV0dXJuIHsgYXBpLCBzdGF0ZSwgcHJvZmlsZSwgbW9kcywgZGlzY292ZXJ5IH07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVMT0ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm9wcz86IElQcm9wcyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHByb3BzID0gZ2VuUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICB9XHJcblxyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdmYWlsZWQgdG8gZ2VuZXJhdGUgZ2FtZSBwcm9wcycpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRhcmdldFBhdGggPSBsb2FkT3JkZXJGaWxlUGF0aChwcm9wcy5wcm9maWxlLmlkKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHRhcmdldFBhdGgpXHJcbiAgICAgIC5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IGZzLndyaXRlRmlsZUFzeW5jKHRhcmdldFBhdGgsIEpTT04uc3RyaW5naWZ5KFtdKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxuICAgIHJldHVybiB0YXJnZXRQYXRoO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlZml4T2Zmc2V0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IG51bWJlciB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gSG93ID9cclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ05vIGFjdGl2ZSBwcm9maWxlIGZvciA3ZHRkJywgdW5kZWZpbmVkLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHJldHVybiB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICdwcmVmaXhPZmZzZXQnLCBwcm9maWxlSWRdLCAwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJldmVyc2VQcmVmaXgoaW5wdXQ6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgaWYgKGlucHV0Lmxlbmd0aCAhPT0gMyB8fCBpbnB1dC5tYXRjaCgvW0EtWl1bQS1aXVtBLVpdL2cpID09PSBudWxsKSB7XHJcbiAgICB0aHJvdyBuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBpbnB1dCwgcGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBwcmVmaXggKEFBQS1aWlopJyk7XHJcbiAgfVxyXG4gIGNvbnN0IHByZWZpeCA9IGlucHV0LnNwbGl0KCcnKTtcclxuXHJcbiAgY29uc3Qgb2Zmc2V0ID0gcHJlZml4LnJlZHVjZSgocHJldiwgaXRlciwgaWR4KSA9PiB7XHJcbiAgICBjb25zdCBwb3cgPSAyIC0gaWR4O1xyXG4gICAgY29uc3QgbXVsdCA9IE1hdGgucG93KDI2LCBwb3cpO1xyXG4gICAgY29uc3QgY2hhckNvZGUgPSAoaXRlci5jaGFyQ29kZUF0KDApICUgNjUpO1xyXG4gICAgcHJldiA9IHByZXYgKyAoY2hhckNvZGUgKiBtdWx0KTtcclxuICAgIHJldHVybiBwcmV2O1xyXG4gIH0sIDApO1xyXG5cclxuICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByZWZpeChpbnB1dDogbnVtYmVyKSB7XHJcbiAgbGV0IHJlcyA9ICcnO1xyXG4gIGxldCByZXN0ID0gaW5wdXQ7XHJcbiAgd2hpbGUgKHJlc3QgPiAwKSB7XHJcbiAgICByZXMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgKHJlc3QgJSAyNikpICsgcmVzO1xyXG4gICAgcmVzdCA9IE1hdGguZmxvb3IocmVzdCAvIDI2KTtcclxuICB9XHJcbiAgcmV0dXJuIHV0aWwucGFkKChyZXMgYXMgYW55KSwgJ0EnLCAzKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZE5hbWUobW9kSW5mb1BhdGgpOiBQcm9taXNlPGFueT4ge1xyXG4gIGxldCBtb2RJbmZvO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB4bWxEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RJbmZvUGF0aCk7XHJcbiAgICBtb2RJbmZvID0gYXdhaXQgUEFSU0VSLnBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSBtb2RJbmZvPy5EaXNwbGF5TmFtZT8uWzBdPy4kPy52YWx1ZVxyXG4gICAgICB8fCBtb2RJbmZvPy5Nb2RJbmZvPy5bMF0/Lk5hbWU/LlswXT8uJD8udmFsdWVcclxuICAgICAgfHwgbW9kSW5mbz8uTmFtZT8uWzBdPy4kPy52YWx1ZTtcclxuICAgIHJldHVybiAobW9kTmFtZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZShtb2ROYW1lKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdVbmV4cGVjdGVkIG1vZGluZm8ueG1sIGZvcm1hdCcpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHBhcnNlIE1vZEluZm8ueG1sIGZpbGUnKSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TW9kSW5mb0ZpbGVzKGJhc2VQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgbGV0IGZpbGVQYXRoczogc3RyaW5nW10gPSBbXTtcclxuICByZXR1cm4gdHVyYm93YWxrKGJhc2VQYXRoLCBmaWxlcyA9PiB7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihlbnRyeSA9PlxyXG4gICAgICAhZW50cnkuaXNEaXJlY3RvcnkgJiYgcGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09IE1PRF9JTkZPKTtcclxuICAgIGZpbGVQYXRocyA9IGZpbGVQYXRocy5jb25jYXQoZmlsdGVyZWQubWFwKGVudHJ5ID0+IGVudHJ5LmZpbGVQYXRoKSk7XHJcbiAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5jbHVkZXMoZXJyLmNvZGUpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVQYXRocykpO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElBdHRyaWJ1dGUgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9PiB7IH1cclxuZXhwb3J0IGludGVyZmFjZSBJWG1sTm9kZTxBdHRyaWJ1dGVUIGV4dGVuZHMgb2JqZWN0PiB7XHJcbiAgJDogQXR0cmlidXRlVDtcclxufVxyXG5leHBvcnQgaW50ZXJmYWNlIElNb2ROYW1lTm9kZSBleHRlbmRzIElYbWxOb2RlPHsgaWQ6ICdOYW1lJyB9PiB7XHJcbiAgYXR0cmlidXRlOiBJQXR0cmlidXRlO1xyXG59XHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1vZEluZm9Ob2RlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogJ01vZEluZm8nIH0+IHtcclxuICBjaGlsZHJlbj86IFt7IG5vZGU6IElNb2ROYW1lTm9kZVtdIH1dO1xyXG4gIGF0dHJpYnV0ZT86IElBdHRyaWJ1dGVbXTtcclxufVxyXG4iXX0=