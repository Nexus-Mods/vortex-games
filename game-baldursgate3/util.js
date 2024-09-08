"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.readStoredLO = exports.readModSettings = exports.writeModSettings = exports.extractMeta = exports.extractPakInfoImpl = exports.getLatestLSLibMod = exports.getLatestInstalledLSLibVer = exports.findNode = exports.forceRefresh = exports.logDebug = exports.logError = exports.parseModNode = exports.getActivePlayerProfile = exports.getOwnGameVersion = exports.gameSupportsProfile = exports.getPlayerProfiles = exports.globalProfilePath = exports.profilesPath = exports.modsPath = exports.documentsPath = exports.getGameDataPath = exports.getGamePath = void 0;
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const divineWrapper_1 = require("./divineWrapper");
function getGamePath(api) {
    var _a, _b;
    const state = api.getState();
    return (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
}
exports.getGamePath = getGamePath;
function getGameDataPath(api) {
    var _a, _b;
    const state = api.getState();
    const gamePath = (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
    if (gamePath !== undefined) {
        return path.join(gamePath, 'Data');
    }
    else {
        return undefined;
    }
}
exports.getGameDataPath = getGameDataPath;
function documentsPath() {
    return path.join(vortex_api_1.util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}
exports.documentsPath = documentsPath;
function modsPath() {
    return path.join(documentsPath(), 'Mods');
}
exports.modsPath = modsPath;
function profilesPath() {
    return path.join(documentsPath(), 'PlayerProfiles');
}
exports.profilesPath = profilesPath;
function globalProfilePath() {
    return path.join(documentsPath(), 'global');
}
exports.globalProfilePath = globalProfilePath;
exports.getPlayerProfiles = (() => {
    let cached = [];
    try {
        cached = vortex_api_1.fs.readdirSync(profilesPath())
            .filter(name => (path.extname(name) === '') && (name !== 'Default'));
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    return () => cached;
})();
function gameSupportsProfile(gameVersion) {
    return semver.lt(semver.coerce(gameVersion), '4.1.206');
}
exports.gameSupportsProfile = gameSupportsProfile;
function getOwnGameVersion(state) {
    return __awaiter(this, void 0, void 0, function* () {
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        return yield vortex_api_1.util.getGame(common_1.GAME_ID).getInstalledVersion(discovery);
    });
}
exports.getOwnGameVersion = getOwnGameVersion;
function getActivePlayerProfile(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        return gameSupportsProfile(yield getOwnGameVersion(api.getState()))
            ? ((_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile) || 'global'
            : 'Public';
    });
}
exports.getActivePlayerProfile = getActivePlayerProfile;
function parseModNode(node) {
    const name = findNode(node.attribute, 'Name').$.value;
    return {
        id: name,
        name,
        data: findNode(node.attribute, 'UUID').$.value,
    };
}
exports.parseModNode = parseModNode;
const resolveMeta = (metadata) => {
    return (metadata !== undefined)
        ? typeof metadata === 'string'
            ? metadata
            : JSON.stringify(metadata)
        : undefined;
};
function logError(message, metadata) {
    const meta = resolveMeta(metadata);
    (0, vortex_api_1.log)('debug', message, meta);
}
exports.logError = logError;
function logDebug(message, metadata) {
    if (common_1.DEBUG) {
        const meta = resolveMeta(metadata);
        (0, vortex_api_1.log)('debug', message, meta);
    }
}
exports.logDebug = logDebug;
function forceRefresh(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const action = {
        type: 'SET_FB_FORCE_UPDATE',
        payload: {
            profileId,
        },
    };
    api.store.dispatch(action);
}
exports.forceRefresh = forceRefresh;
function findNode(nodes, id) {
    var _a;
    return (_a = nodes === null || nodes === void 0 ? void 0 : nodes.find(iter => iter.$.id === id)) !== null && _a !== void 0 ? _a : undefined;
}
exports.findNode = findNode;
function getLatestInstalledLSLibVer(api) {
    const state = api.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    return Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const arcId = mods[id].archiveId;
            const dl = vortex_api_1.util.getSafe(state, ['persistent', 'downloads', 'files', arcId], undefined);
            const storedVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(storedVer, prev)) {
                    prev = storedVer;
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
            }
            if (dl !== undefined) {
                const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
                const idx = fileName.indexOf('-v');
                try {
                    const ver = semver.coerce(fileName.slice(idx + 2)).version;
                    if (semver.valid(ver) && ver !== storedVer) {
                        api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', ver));
                        prev = ver;
                    }
                }
                catch (err) {
                    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', '1.0.0'));
                    prev = '1.0.0';
                }
            }
        }
        return prev;
    }, '0.0.0');
}
exports.getLatestInstalledLSLibVer = getLatestInstalledLSLibVer;
function getLatestLSLibMod(api) {
    const state = api.getState();
    const mods = state.persistent.mods[common_1.GAME_ID];
    if (mods === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    const lsLib = Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === common_1.MOD_TYPE_LSLIB) {
            const latestVer = vortex_api_1.util.getSafe(prev, ['attributes', 'version'], '0.0.0');
            const currentVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(currentVer, latestVer)) {
                    prev = mods[id];
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid mod version', { modId: id, version: currentVer });
            }
        }
        return prev;
    }, undefined);
    if (lsLib === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    return lsLib;
}
exports.getLatestLSLibMod = getLatestLSLibMod;
function extractPakInfoImpl(api, pakPath, mod, isListed) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const meta = yield extractMeta(api, pakPath, mod);
        const config = findNode((_a = meta === null || meta === void 0 ? void 0 : meta.save) === null || _a === void 0 ? void 0 : _a.region, 'Config');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const moduleInfo = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModuleInfo');
        const attr = (name, fallback) => { var _a, _b, _c; return (_c = (_b = (_a = findNode(moduleInfo === null || moduleInfo === void 0 ? void 0 : moduleInfo.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback(); };
        const genName = path.basename(pakPath, path.extname(pakPath));
        return {
            author: attr('Author', () => 'Unknown'),
            description: attr('Description', () => 'Missing'),
            folder: attr('Folder', () => genName),
            md5: attr('MD5', () => ''),
            name: attr('Name', () => genName),
            type: attr('Type', () => 'Adventure'),
            uuid: attr('UUID', () => require('uuid').v4()),
            version: attr('Version64', () => '1'),
            publishHandle: attr('PublishHandle', () => '0'),
            isListed: isListed
        };
    });
}
exports.extractPakInfoImpl = extractPakInfoImpl;
function extractMeta(api, pakPath, mod) {
    return __awaiter(this, void 0, void 0, function* () {
        const metaPath = path.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', (0, shortid_1.generate)());
        yield vortex_api_1.fs.ensureDirAsync(metaPath);
        yield (0, divineWrapper_1.extractPak)(api, pakPath, metaPath, '*/meta.lsx');
        try {
            let metaLSXPath = path.join(metaPath, 'meta.lsx');
            yield (0, turbowalk_1.default)(metaPath, entries => {
                const temp = entries.find(e => path.basename(e.filePath).toLowerCase() === 'meta.lsx');
                if (temp !== undefined) {
                    metaLSXPath = temp.filePath;
                }
            });
            const dat = yield vortex_api_1.fs.readFileAsync(metaLSXPath);
            const meta = yield (0, xml2js_1.parseStringPromise)(dat);
            yield vortex_api_1.fs.removeAsync(metaPath);
            return meta;
        }
        catch (err) {
            yield vortex_api_1.fs.removeAsync(metaPath);
            if (err.code === 'ENOENT') {
                return Promise.resolve(undefined);
            }
            else if (err.message.includes('Column') && (err.message.includes('Line'))) {
                api.sendNotification({
                    type: 'warning',
                    message: 'The meta.lsx file in "{{modName}}" is invalid, please report this to the author',
                    actions: [{
                            title: 'More',
                            action: () => {
                                api.showDialog('error', 'Invalid meta.lsx file', {
                                    message: err.message,
                                }, [{ label: 'Close' }]);
                            }
                        }],
                    replace: {
                        modName: vortex_api_1.util.renderModName(mod),
                    }
                });
                return Promise.resolve(undefined);
            }
            else {
                throw err;
            }
        }
    });
}
exports.extractMeta = extractMeta;
let storedLO = [];
function writeModSettings(api, data, bg3profile) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bg3profile) {
            return;
        }
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfilePath(), 'modsettings.lsx');
        const builder = new xml2js_1.Builder();
        const xml = builder.buildObject(data);
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(settingsPath));
            yield vortex_api_1.fs.writeFileAsync(settingsPath, xml);
        }
        catch (err) {
            storedLO = [];
            const allowReport = ['ENOENT', 'EPERM'].includes(err.code);
            api.showErrorNotification('Failed to write mod settings', err, { allowReport });
            return;
        }
    });
}
exports.writeModSettings = writeModSettings;
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = yield getActivePlayerProfile(api);
        const playerProfiles = (0, exports.getPlayerProfiles)();
        if (playerProfiles.length === 0) {
            storedLO = [];
            return;
        }
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfilePath(), 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
exports.readModSettings = readModSettings;
function readStoredLO(api) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    return __awaiter(this, void 0, void 0, function* () {
        const modSettings = yield readModSettings(api);
        const config = findNode((_a = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const modOrderRoot = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModOrder');
        const modsRoot = findNode((_e = (_d = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'Mods');
        const modOrderNodes = (_h = (_g = (_f = modOrderRoot === null || modOrderRoot === void 0 ? void 0 : modOrderRoot.children) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.node) !== null && _h !== void 0 ? _h : [];
        const modNodes = (_l = (_k = (_j = modsRoot === null || modsRoot === void 0 ? void 0 : modsRoot.children) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.node) !== null && _l !== void 0 ? _l : [];
        const modOrder = modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
        const state = api.store.getState();
        const vProfile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabled = Object.keys(mods).filter(id => vortex_api_1.util.getSafe(vProfile, ['modState', id, 'enabled'], false));
        const bg3profile = (_m = state.settings.baldursgate3) === null || _m === void 0 ? void 0 : _m.playerProfile;
        if (enabled.length > 0 && modNodes.length === 1) {
            const lastWrite = (_p = (_o = state.settings.baldursgate3) === null || _o === void 0 ? void 0 : _o.settingsWritten) === null || _p === void 0 ? void 0 : _p[bg3profile];
            if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
                api.showDialog('info', '"modsettings.lsx" file was reset', {
                    text: 'The game reset the list of active mods and ran without them.\n'
                        + 'This happens when an invalid or incompatible mod is installed. '
                        + 'The game will not load any mods if one of them is incompatible, unfortunately '
                        + 'there is no easy way to find out which one caused the problem.',
                }, [
                    { label: 'Continue' },
                ]);
            }
        }
        storedLO = modNodes
            .map(node => parseModNode(node))
            .filter(entry => entry.id === 'Gustav')
            .sort((lhs, rhs) => modOrder
            .findIndex(i => i === lhs.data) - modOrder.findIndex(i => i === rhs.data));
    });
}
exports.readStoredLO = readStoredLO;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsK0NBQWlDO0FBQ2pDLHFDQUE4QztBQUM5QywwREFBNkI7QUFDN0IsMkNBQXNFO0FBQ3RFLG1DQUFxRDtBQUNyRCxxQ0FBMEQ7QUFDMUQsbURBQTZDO0FBRzdDLFNBQWdCLFdBQVcsQ0FBQyxHQUFHOztJQUM3QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsT0FBTyxNQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSwwQ0FBRyxnQkFBTyxDQUFDLDBDQUFFLElBQWMsQ0FBQztBQUN2RSxDQUFDO0FBSEQsa0NBR0M7QUFFRCxTQUFnQixlQUFlLENBQUMsR0FBRzs7SUFDakMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sUUFBUSxHQUFHLE1BQUEsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLDBDQUFHLGdCQUFPLENBQUMsMENBQUUsSUFBSSxDQUFDO0lBQ3JFLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtRQUMxQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3BDO1NBQU07UUFDTCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtBQUNILENBQUM7QUFSRCwwQ0FRQztBQUVELFNBQWdCLGFBQWE7SUFDM0IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUZELHNDQUVDO0FBRUQsU0FBZ0IsUUFBUTtJQUN0QixPQUFPLElBQUks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Qzs7Q0FDaEY7QUF0Q0Qsb0NBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGdlbmVyYXRlIGFzIHNob3J0aWQgfSBmcm9tICdzaG9ydGlkJztcbmltcG9ydCB3YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHNlbGVjdG9ycywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuaW1wb3J0IHsgREVCVUcsIE1PRF9UWVBFX0xTTElCLCBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgZXh0cmFjdFBhayB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XG5pbXBvcnQgeyBJTW9kU2V0dGluZ3MsIElQYWtJbmZvLCBJTW9kTm9kZSwgSVhtbE5vZGUgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEdhbWVQYXRoKGFwaSk6IHN0cmluZyB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIHJldHVybiBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGggYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2FtZURhdGFQYXRoKGFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBnYW1lUGF0aCA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aDtcbiAgaWYgKGdhbWVQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKGdhbWVQYXRoLCAnRGF0YScpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvY3VtZW50c1BhdGgoKSB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdsb2NhbEFwcERhdGEnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2RzUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdNb2RzJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9maWxlc1BhdGgoKSB7XG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnUGxheWVyUHJvZmlsZXMnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdsb2JhbFByb2ZpbGVQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ2dsb2JhbCcpO1xufVxuXG5leHBvcnQgY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xuICBsZXQgY2FjaGVkID0gW107XG4gIHRyeSB7XG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXG4gICAgICAgIC5maWx0ZXIobmFtZSA9PiAocGF0aC5leHRuYW1lKG5hbWUpID09PSAnJykgJiYgKG5hbWUgIT09ICdEZWZhdWx0JykpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIHJldHVybiAoKSA9PiBjYWNoZWQ7XG59KSgpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2FtZVN1cHBvcnRzUHJvZmlsZShnYW1lVmVyc2lvbjogc3RyaW5nKSB7XG4gIHJldHVybiBzZW12ZXIubHQoc2VtdmVyLmNvZXJjZShnYW1lVmVyc2lvbiksICc0LjEuMjA2Jyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRPd25HYW1lVmVyc2lvbihzdGF0ZTogdHlwZXMuSVN0YXRlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIHJldHVybiBhd2FpdCB1dGlsLmdldEdhbWUoR0FNRV9JRCkuZ2V0SW5zdGFsbGVkVmVyc2lvbihkaXNjb3ZlcnkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgcmV0dXJuIGdhbWVTdXBwb3J0c1Byb2ZpbGUoYXdhaXQgZ2V0T3duR2FtZVZlcnNpb24oYXBpLmdldFN0YXRlKCkpKVxuICAgID8gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlIHx8ICdnbG9iYWwnXG4gICAgOiAnUHVibGljJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xuICBjb25zdCBuYW1lID0gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdOYW1lJykuJC52YWx1ZTtcbiAgcmV0dXJuIHtcbiAgICBpZDogbmFtZSxcbiAgICBuYW1lLFxuICAgIGRhdGE6IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQudmFsdWUsXG4gIH07XG59XG5cbmNvbnN0IHJlc29sdmVNZXRhID0gKG1ldGFkYXRhPzogYW55KSA9PiB7XG4gIHJldHVybiAobWV0YWRhdGEgIT09IHVuZGVmaW5lZClcbiAgICA/IHR5cGVvZiBtZXRhZGF0YSA9PT0gJ3N0cmluZydcbiAgICAgID8gbWV0YWRhdGFcbiAgICAgIDogSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpXG4gICAgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2dFcnJvcihtZXNzYWdlOiBzdHJpbmcsIG1ldGFkYXRhPzogYW55KSB7XG4gIGNvbnN0IG1ldGEgPSByZXNvbHZlTWV0YShtZXRhZGF0YSk7XG4gICAgbG9nKCdkZWJ1ZycsIG1lc3NhZ2UsIG1ldGEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9nRGVidWcobWVzc2FnZTogc3RyaW5nLCBtZXRhZGF0YT86IGFueSkge1xuICBpZiAoREVCVUcpIHtcbiAgICAvLyBzbyBtZXRhXG4gICAgY29uc3QgbWV0YSA9IHJlc29sdmVNZXRhKG1ldGFkYXRhKTtcbiAgICBsb2coJ2RlYnVnJywgbWVzc2FnZSwgbWV0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IGFjdGlvbiA9IHtcbiAgICB0eXBlOiAnU0VUX0ZCX0ZPUkNFX1VQREFURScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcHJvZmlsZUlkLFxuICAgIH0sXG4gIH07XG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZE5vZGU8VCBleHRlbmRzIElYbWxOb2RlPHsgaWQ6IHN0cmluZyB9PiwgVT4obm9kZXM6IFRbXSwgaWQ6IHN0cmluZyk6IFQge1xuICByZXR1cm4gbm9kZXM/LmZpbmQoaXRlciA9PiBpdGVyLiQuaWQgPT09IGlkKSA/PyB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XG4gICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldiwgaWQpID0+IHtcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcpIHtcbiAgICAgIGNvbnN0IGFyY0lkID0gbW9kc1tpZF0uYXJjaGl2ZUlkO1xuICAgICAgY29uc3QgZGw6IHR5cGVzLklEb3dubG9hZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgICAgWydwZXJzaXN0ZW50JywgJ2Rvd25sb2FkcycsICdmaWxlcycsIGFyY0lkXSwgdW5kZWZpbmVkKTtcbiAgICAgIGNvbnN0IHN0b3JlZFZlciA9IHV0aWwuZ2V0U2FmZShtb2RzW2lkXSwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzZW12ZXIuZ3Qoc3RvcmVkVmVyLCBwcmV2KSkge1xuICAgICAgICAgIHByZXYgPSBzdG9yZWRWZXI7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCB2ZXJzaW9uIHN0b3JlZCBmb3IgbHNsaWIgbW9kJywgeyBpZCwgdmVyc2lvbjogc3RvcmVkVmVyIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBUaGUgTFNMaWIgZGV2ZWxvcGVyIGRvZXNuJ3QgYWx3YXlzIHVwZGF0ZSB0aGUgdmVyc2lvbiBvbiB0aGUgZXhlY3V0YWJsZVxuICAgICAgICAvLyAgaXRzZWxmIC0gd2UncmUgZ29pbmcgdG8gdHJ5IHRvIGV4dHJhY3QgaXQgZnJvbSB0aGUgYXJjaGl2ZSB3aGljaCB0ZW5kc1xuICAgICAgICAvLyAgdG8gdXNlIHRoZSBjb3JyZWN0IHZlcnNpb24uXG4gICAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShkbC5sb2NhbFBhdGgsIHBhdGguZXh0bmFtZShkbC5sb2NhbFBhdGgpKTtcbiAgICAgICAgY29uc3QgaWR4ID0gZmlsZU5hbWUuaW5kZXhPZignLXYnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB2ZXIgPSBzZW12ZXIuY29lcmNlKGZpbGVOYW1lLnNsaWNlKGlkeCArIDIpKS52ZXJzaW9uO1xuICAgICAgICAgIGlmIChzZW12ZXIudmFsaWQodmVyKSAmJiB2ZXIgIT09IHN0b3JlZFZlcikge1xuICAgICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsIHZlcikpO1xuICAgICAgICAgICAgcHJldiA9IHZlcjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIC8vIFdlIGZhaWxlZCB0byBnZXQgdGhlIHZlcnNpb24uLi4gT2ggd2VsbC4uIFNldCBhIGJvZ3VzIHZlcnNpb24gc2luY2VcbiAgICAgICAgICAvLyAgd2UgY2xlYXJseSBoYXZlIGxzbGliIGluc3RhbGxlZCAtIHRoZSB1cGRhdGUgZnVuY3Rpb25hbGl0eSBzaG91bGQgdGFrZVxuICAgICAgICAgIC8vICBjYXJlIG9mIHRoZSByZXN0ICh3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgY2hlY2sgZm9yIHVwZGF0ZXMgYnV0dG9uKVxuICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShHQU1FX0lELCBpZCwgJ3ZlcnNpb24nLCAnMS4wLjAnKSk7XG4gICAgICAgICAgcHJldiA9ICcxLjAuMCc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sICcwLjAuMCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XG4gIGlmIChtb2RzID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gTU9EX1RZUEVfTFNMSUIpIHtcbiAgICAgIGNvbnN0IGxhdGVzdFZlciA9IHV0aWwuZ2V0U2FmZShwcmV2LCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNlbXZlci5ndChjdXJyZW50VmVyLCBsYXRlc3RWZXIpKSB7XG4gICAgICAgICAgcHJldiA9IG1vZHNbaWRdO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgbW9kIHZlcnNpb24nLCB7IG1vZElkOiBpZCwgdmVyc2lvbjogY3VycmVudFZlciB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIHVuZGVmaW5lZCk7XG5cbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gbHNMaWI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0UGFrSW5mb0ltcGwoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCwgaXNMaXN0ZWQ6IGJvb2xlYW4pOiBQcm9taXNlPElQYWtJbmZvPiB7XG4gIGNvbnN0IG1ldGEgPSBhd2FpdCBleHRyYWN0TWV0YShhcGksIHBha1BhdGgsIG1vZCk7XG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xuICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xuICBjb25zdCBtb2R1bGVJbmZvID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHVsZUluZm8nKTtcblxuICBjb25zdCBhdHRyID0gKG5hbWU6IHN0cmluZywgZmFsbGJhY2s6ICgpID0+IGFueSkgPT5cbiAgICBmaW5kTm9kZShtb2R1bGVJbmZvPy5hdHRyaWJ1dGUsIG5hbWUpPy4kPy52YWx1ZSA/PyBmYWxsYmFjaygpO1xuXG4gIGNvbnN0IGdlbk5hbWUgPSBwYXRoLmJhc2VuYW1lKHBha1BhdGgsIHBhdGguZXh0bmFtZShwYWtQYXRoKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBhdXRob3I6IGF0dHIoJ0F1dGhvcicsICgpID0+ICdVbmtub3duJyksXG4gICAgZGVzY3JpcHRpb246IGF0dHIoJ0Rlc2NyaXB0aW9uJywgKCkgPT4gJ01pc3NpbmcnKSxcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxuICAgIG1kNTogYXR0cignTUQ1JywgKCkgPT4gJycpLFxuICAgIG5hbWU6IGF0dHIoJ05hbWUnLCAoKSA9PiBnZW5OYW1lKSxcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxuICAgIHV1aWQ6IGF0dHIoJ1VVSUQnLCAoKSA9PiByZXF1aXJlKCd1dWlkJykudjQoKSksXG4gICAgdmVyc2lvbjogYXR0cignVmVyc2lvbjY0JywgKCkgPT4gJzEnKSxcbiAgICBwdWJsaXNoSGFuZGxlOiBhdHRyKCdQdWJsaXNoSGFuZGxlJywgKCkgPT4gJzAnKSxcbiAgICBpc0xpc3RlZDogaXNMaXN0ZWRcbiAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RNZXRhKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBjb25zdCBtZXRhUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ3RlbXAnKSwgJ2xzbWV0YScsIHNob3J0aWQoKSk7XG4gIGF3YWl0IGZzLmVuc3VyZURpckFzeW5jKG1ldGFQYXRoKTtcbiAgYXdhaXQgZXh0cmFjdFBhayhhcGksIHBha1BhdGgsIG1ldGFQYXRoLCAnKi9tZXRhLmxzeCcpO1xuICB0cnkge1xuICAgIC8vIHRoZSBtZXRhLmxzeCBtYXkgYmUgaW4gYSBzdWJkaXJlY3RvcnkuIFRoZXJlIGlzIHByb2JhYmx5IGEgcGF0dGVybiBoZXJlXG4gICAgLy8gYnV0IHdlJ2xsIGp1c3QgdXNlIGl0IGZyb20gd2hlcmV2ZXJcbiAgICBsZXQgbWV0YUxTWFBhdGg6IHN0cmluZyA9IHBhdGguam9pbihtZXRhUGF0aCwgJ21ldGEubHN4Jyk7XG4gICAgYXdhaXQgd2FsayhtZXRhUGF0aCwgZW50cmllcyA9PiB7XG4gICAgICBjb25zdCB0ZW1wID0gZW50cmllcy5maW5kKGUgPT4gcGF0aC5iYXNlbmFtZShlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKTtcbiAgICAgIGlmICh0ZW1wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbWV0YUxTWFBhdGggPSB0ZW1wLmZpbGVQYXRoO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobWV0YUxTWFBhdGgpO1xuICAgIGNvbnN0IG1ldGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XG4gICAgcmV0dXJuIG1ldGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1ldGFQYXRoKTtcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgfSBlbHNlIGlmIChlcnIubWVzc2FnZS5pbmNsdWRlcygnQ29sdW1uJykgJiYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKCdMaW5lJykpKSB7XG4gICAgICAvLyBhbiBlcnJvciBtZXNzYWdlIHNwZWNpZnlpbmcgY29sdW1uIGFuZCByb3cgaW5kaWNhdGUgYSBwcm9ibGVtIHBhcnNpbmcgdGhlIHhtbCBmaWxlXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcbiAgICAgICAgbWVzc2FnZTogJ1RoZSBtZXRhLmxzeCBmaWxlIGluIFwie3ttb2ROYW1lfX1cIiBpcyBpbnZhbGlkLCBwbGVhc2UgcmVwb3J0IHRoaXMgdG8gdGhlIGF1dGhvcicsXG4gICAgICAgIGFjdGlvbnM6IFt7XG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcbiAgICAgICAgICBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdJbnZhbGlkIG1ldGEubHN4IGZpbGUnLCB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgfSwgW3sgbGFiZWw6ICdDbG9zZScgfV0pXG4gICAgICAgICAgfVxuICAgICAgICB9XSxcbiAgICAgICAgcmVwbGFjZToge1xuICAgICAgICAgIG1vZE5hbWU6IHV0aWwucmVuZGVyTW9kTmFtZShtb2QpLFxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG59XG5cbmxldCBzdG9yZWRMTyA9IFtdO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkYXRhOiBJTW9kU2V0dGluZ3MsIGJnM3Byb2ZpbGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIWJnM3Byb2ZpbGUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzZXR0aW5nc1BhdGggPSAoYmczcHJvZmlsZSAhPT0gJ2dsb2JhbCcpIFxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG5cbiAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoc2V0dGluZ3NQYXRoKSk7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoc2V0dGluZ3NQYXRoLCB4bWwpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBzdG9yZWRMTyA9IFtdO1xuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBzZXR0aW5ncycsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHN0b3JlZExPID0gW107XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gKGJnM3Byb2ZpbGUgIT09ICdnbG9iYWwnKVxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlUGF0aCgpLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2V0dGluZ3NQYXRoKTtcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFN0b3JlZExPKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcbiAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XG4gIGNvbnN0IG1vZHNSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcbiAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcblxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCB2UHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XG4gICAgdXRpbC5nZXRTYWZlKHZQcm9maWxlLCBbJ21vZFN0YXRlJywgaWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID4gMCAmJiBtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcbiAgICBjb25zdCBsYXN0V3JpdGUgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnNldHRpbmdzV3JpdHRlbj8uW2JnM3Byb2ZpbGVdO1xuICAgIGlmICgobGFzdFdyaXRlICE9PSB1bmRlZmluZWQpICYmIChsYXN0V3JpdGUuY291bnQgPiAxKSkge1xuICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlIHdhcyByZXNldCcsIHtcbiAgICAgICAgdGV4dDogJ1RoZSBnYW1lIHJlc2V0IHRoZSBsaXN0IG9mIGFjdGl2ZSBtb2RzIGFuZCByYW4gd2l0aG91dCB0aGVtLlxcbidcbiAgICAgICAgICAgICsgJ1RoaXMgaGFwcGVucyB3aGVuIGFuIGludmFsaWQgb3IgaW5jb21wYXRpYmxlIG1vZCBpcyBpbnN0YWxsZWQuICdcbiAgICAgICAgICAgICsgJ1RoZSBnYW1lIHdpbGwgbm90IGxvYWQgYW55IG1vZHMgaWYgb25lIG9mIHRoZW0gaXMgaW5jb21wYXRpYmxlLCB1bmZvcnR1bmF0ZWx5ICdcbiAgICAgICAgICAgICsgJ3RoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIGZpbmQgb3V0IHdoaWNoIG9uZSBjYXVzZWQgdGhlIHByb2JsZW0uJyxcbiAgICAgIH0sIFtcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlJyB9LFxuICAgICAgXSk7XG4gICAgfVxuICB9XG5cbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXG4gICAgLy8gR3VzdGF2IGlzIHRoZSBjb3JlIGdhbWVcbiAgICAuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LmlkID09PSAnR3VzdGF2JylcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxuICAgIC5zb3J0KChsaHMsIHJocykgPT4gbW9kT3JkZXJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xufSJdfQ==