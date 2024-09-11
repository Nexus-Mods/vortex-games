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
exports.readStoredLO = exports.readModSettings = exports.parseLSXFile = exports.writeModSettings = exports.extractMeta = exports.extractPakInfoImpl = exports.getLatestLSLibMod = exports.convertV6toV7 = exports.getDefaultModSettings = exports.getDefaultModSettingsFormat = exports.getLatestInstalledLSLibVer = exports.findNode = exports.forceRefresh = exports.logDebug = exports.logError = exports.parseModNode = exports.getActivePlayerProfile = exports.getOwnGameVersion = exports.gameSupportsProfile = exports.getPlayerProfiles = exports.globalProfilePath = exports.profilesPath = exports.modsPath = exports.documentsPath = exports.getGameDataPath = exports.getGamePath = void 0;
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
function globalProfilePath(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield getActivePlayerProfile(api);
        return path.join(documentsPath(), bg3ProfileId);
    });
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
let _FORMAT = null;
const PATCH_7 = '4.58.49';
const PATCH_6 = '4.50.22';
function getDefaultModSettingsFormat(api) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_FORMAT !== null) {
            return _FORMAT;
        }
        _FORMAT = 'v7';
        try {
            const state = api.getState();
            const gameVersion = yield getOwnGameVersion(state);
            const coerced = gameVersion ? semver.coerce(gameVersion) : PATCH_7;
            if (semver.gte(coerced, PATCH_7)) {
                _FORMAT = 'v7';
            }
            else if (semver.gte(coerced, PATCH_6)) {
                _FORMAT = 'v6';
            }
            else {
                _FORMAT = 'pre-v6';
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('warn', 'failed to get game version', err);
        }
        return _FORMAT;
    });
}
exports.getDefaultModSettingsFormat = getDefaultModSettingsFormat;
function getDefaultModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_FORMAT === null) {
            _FORMAT = yield getDefaultModSettingsFormat(api);
        }
        return {
            'v7': common_1.DEFAULT_MOD_SETTINGS_V7,
            'v6': common_1.DEFAULT_MOD_SETTINGS_V6,
            'pre-v6': common_1.DEFAULT_MOD_SETTINGS_V6
        }[_FORMAT];
    });
}
exports.getDefaultModSettings = getDefaultModSettings;
function convertV6toV7(v6Xml) {
    return __awaiter(this, void 0, void 0, function* () {
        const v6Json = yield (0, xml2js_1.parseStringPromise)(v6Xml);
        v6Json.save.version[0].$.major = '4';
        v6Json.save.version[0].$.minor = '7';
        v6Json.save.version[0].$.revision = '1';
        v6Json.save.version[0].$.build = '3';
        const moduleSettingsChildren = v6Json.save.region[0].node[0].children[0].node;
        const modOrderIndex = moduleSettingsChildren.findIndex((n) => n.$.id === 'ModOrder');
        if (modOrderIndex !== -1) {
            moduleSettingsChildren.splice(modOrderIndex, 1);
        }
        const modsNode = moduleSettingsChildren.find((n) => n.$.id === 'Mods');
        if (modsNode) {
            for (let i = 0; i < modsNode.children[0].node.length; i++) {
                const moduleShortDescNode = modsNode.children[0].node[i];
                if (moduleShortDescNode) {
                    const uuidAttribute = moduleShortDescNode.attribute.find((attr) => attr.$.id === 'UUID');
                    if (uuidAttribute) {
                        uuidAttribute.$.type = 'guid';
                    }
                    const publishHandleAtt = moduleShortDescNode.attribute.find((attr) => attr.$.id === 'PublishHandle');
                    if (publishHandleAtt === undefined) {
                        moduleShortDescNode.attribute.push({
                            $: { id: 'publishHandle', type: 'uint64', value: '0' }
                        });
                    }
                }
            }
        }
        const builder = new xml2js_1.Builder();
        const v7Xml = builder.buildObject(v6Json);
        return v7Xml;
    });
}
exports.convertV6toV7 = convertV6toV7;
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
        const globalProfile = yield globalProfilePath(api);
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfile, 'modsettings.lsx');
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
function parseLSXFile(lsxPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const dat = yield vortex_api_1.fs.readFileAsync(lsxPath, { encoding: 'utf8' });
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
exports.parseLSXFile = parseLSXFile;
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = yield getActivePlayerProfile(api);
        const playerProfiles = (0, exports.getPlayerProfiles)();
        if (playerProfiles.length === 0) {
            storedLO = [];
            const settingsPath = path.join(profilesPath(), 'Public', 'modsettings.lsx');
            return parseLSXFile(settingsPath);
        }
        const globalProfile = yield globalProfilePath(api);
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfile, 'modsettings.lsx');
        return parseLSXFile(settingsPath);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsK0NBQWlDO0FBQ2pDLHFDQUE4QztBQUM5QywwREFBNkI7QUFDN0IsMkNBQXNFO0FBQ3RFLG1DQUFxRDtBQUNyRCxxQ0FBNEc7QUFDNUcsbURBQTZDO0FBRzdDLFNBQWdCLFdBQVcsQ0FBQyxHQUFHOztJQUM3QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsT0FBTyxNQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSwwQ0FBRyxnQkFBTyxDQUFDLDBDQUFFLElBQWMsQ0FBQztBQUN2RSxDQUFDO0FBSEQsa0NBR0M7QUFFRCxTQUFnQixlQUFlLENBQUMsR0FBRzs7SUFDakMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sUUFBUSxHQUFHLE1BQUEsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLDBDQUFHLGdCQUFPLENBQUMsMENBQUUsSUFBSSxDQUFDO0lBQ3JFLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtRQUMxQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3BDO1NBQU07UUFDTCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtBQUNILENBQUM7QUFSRCwwQ0FRQztBQUVELFNBQWdCLGFBQWE7SUFDM0IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUZELHNDQUVDO0FBRUQsU0FBZ0IsUUFBUTtJQUN0QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBZ0IsWUFBWTtJQUMxQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRkQsb0NBRUM7QUFFRCxTQUFzQixpQkFBaUIsQ0FBQyxHQUF3Qjs7UUFDOUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2RCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDbEQsQ0FBQztDQUFBO0FBSEQsOENBR0M7QUFFWSxRQUFBLGlCQUFpQixHQUFHLENBQUMsR0FBRyxFQUFFO0lBQ3JDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNoQixJQUFJO1FBQ0YsTUFBTSxHQUFJLGVBQVUsQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUM7YUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7S0FDeEU7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDekIsTUFBTSxHQUFHLENBQUM7U0FDWDtLQUNGO0lBQ0QsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDdEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUVMLFNBQWdCLG1CQUFtQixDQUFDLFdBQW1CO0lBQ3JELE9BQU8sTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFGRCxrREFFQztBQUVELFNBQXNCLGlCQUFpQixDQUFDLEtBQW1COztRQUN6RCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzVELE9BQU8sTUFBTSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBTyxDQUFDLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEUsQ0FBQztDQUFBO0FBSEQsOENBR0M7QUFFRCxTQUFzQixzQkFBc0IsQ0FBQyxHQUF3Qjs7O1FBQ25FLE9BQU8sbUJBQW1CLENBQUMsTUFBTSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQSxNQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksMENBQUUsYUFBYSxLQUFJLFFBQVE7WUFDdkUsQ0FBQyxDQUFDLFFBQVEsQ0FBQzs7Q0FDZDtBQUpELHdEQUlDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLElBQWM7SUFDekMsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUN0RCxPQUFPO1FBQ0wsRUFBRSxFQUFFLElBQUk7UUFDUixJQUFJO1FBQ0osSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLO0tBQy9DLENBQUM7QUFDSixDQUFDO0FBUEQsb0NBT0M7QUFFRCxNQUFNLFdBQVcsR0FBRyxDQUFDLFFBQWMsRUFBRSxFQUFFO0lBQ3JDLE9BQU8sQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxPQUFPLFFBQVEsS0FBSyxRQUFRO1lBQzVCLENBQUMsQ0FBQyxRQUFRO1lBQ1YsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDaEIsQ0FBQyxDQUFBO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLE9BQWUsRUFBRSxRQUFjO0lBQ3RELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBSEQsNEJBR0M7QUFFRCxTQUFnQixRQUFRLENBQUMsT0FBZSxFQUFFLFFBQWM7SUFDdEQsSUFBSSxjQUFLLEVBQUU7UUFFVCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDN0I7QUFDSCxDQUFDO0FBTkQsNEJBTUM7QUFFRCxTQUFnQixZQUFZLENBQUMsR0FBd0I7SUFDbkQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLE1BQU0sR0FBRztRQUNiLElBQUksRUFBRSxxQkFBcUI7UUFDM0IsT0FBTyxFQUFFO1lBQ1AsU0FBUztTQUNWO0tBQ0YsQ0FBQztJQUNGLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFWRCxvQ0FVQztBQUVELFNBQWdCLFFBQVEsQ0FBd0MsS0FBVSxFQUFFLEVBQVU7O0lBQ3BGLE9BQU8sTUFBQSxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLG1DQUFJLFNBQVMsQ0FBQztBQUM1RCxDQUFDO0FBRkQsNEJBRUM7QUFFRCxTQUFnQiwwQkFBMEIsQ0FBQyxHQUF3QjtJQUNqRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxJQUFJLEdBQ1IsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFM0QsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRTtRQUMzQyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssdUJBQXVCLEVBQUU7WUFDN0MsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNqQyxNQUFNLEVBQUUsR0FBb0IsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM1QyxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU3RSxJQUFJO2dCQUNGLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUU7b0JBQzlCLElBQUksR0FBRyxTQUFTLENBQUM7aUJBQ2xCO2FBQ0Y7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLHNDQUFzQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO2FBQ2pGO1lBRUQsSUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFO2dCQUlwQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDekUsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkMsSUFBSTtvQkFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO29CQUMzRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTt3QkFDMUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxlQUFlLENBQUMsZ0JBQU8sRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ3pFLElBQUksR0FBRyxHQUFHLENBQUM7cUJBQ1o7aUJBQ0Y7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7b0JBSVosR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxlQUFlLENBQUMsZ0JBQU8sRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQzdFLElBQUksR0FBRyxPQUFPLENBQUM7aUJBQ2hCO2FBQ0Y7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2QsQ0FBQztBQTNDRCxnRUEyQ0M7QUFFRCxJQUFJLE9BQU8sR0FBYSxJQUFJLENBQUM7QUFDN0IsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDO0FBQzFCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQztBQUMxQixTQUFzQiwyQkFBMkIsQ0FBQyxHQUF3Qjs7UUFDeEUsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1lBQ3BCLE9BQU8sT0FBTyxDQUFDO1NBQ2hCO1FBQ0QsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLElBQUk7WUFDRixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDN0IsTUFBTSxXQUFXLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuRCxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUNuRSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUNoQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2FBQ2hCO2lCQUFNLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUU7Z0JBQ3ZDLE9BQU8sR0FBRyxJQUFJLENBQUM7YUFDaEI7aUJBQU07Z0JBQ0wsT0FBTyxHQUFHLFFBQVEsQ0FBQzthQUNwQjtTQUNGO1FBQ0QsT0FBTyxHQUFHLEVBQUU7WUFDVixJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ2hEO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUFBO0FBdEJELGtFQXNCQztBQUVELFNBQXNCLHFCQUFxQixDQUFDLEdBQXdCOztRQUNsRSxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDcEIsT0FBTyxHQUFHLE1BQU0sMkJBQTJCLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbEQ7UUFDRCxPQUFPO1lBQ0wsSUFBSSxFQUFFLGdDQUF1QjtZQUM3QixJQUFJLEVBQUUsZ0NBQXVCO1lBQzdCLFFBQVEsRUFBRSxnQ0FBdUI7U0FDbEMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNiLENBQUM7Q0FBQTtBQVRELHNEQVNDO0FBRUQsU0FBc0IsYUFBYSxDQUFDLEtBQWE7O1FBQy9DLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQztRQUN4QyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUVyQyxNQUFNLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzlFLE1BQU0sYUFBYSxHQUFHLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssVUFBVSxDQUFDLENBQUM7UUFDMUYsSUFBSSxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFFeEIsc0JBQXNCLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNqRDtRQUdELE1BQU0sUUFBUSxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUM7UUFFNUUsSUFBSSxRQUFRLEVBQUU7WUFDWixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN6RCxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV6RCxJQUFJLG1CQUFtQixFQUFFO29CQUV2QixNQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFDOUYsSUFBSSxhQUFhLEVBQUU7d0JBQ2pCLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztxQkFDL0I7b0JBRUQsTUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxlQUFlLENBQUMsQ0FBQztvQkFDMUcsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUU7d0JBQ2xDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7NEJBQ2pDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFO3lCQUN2RCxDQUFDLENBQUE7cUJBQ0g7aUJBR0Y7YUFDRjtTQUNGO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBTyxFQUFFLENBQUM7UUFDOUIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUxQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FBQTtBQTVDRCxzQ0E0Q0M7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxHQUF3QjtJQUN4RCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxJQUFJLEdBQW9DLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFPLENBQUMsQ0FBQztJQUM3RSxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7UUFDdEIsSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBQ0QsTUFBTSxLQUFLLEdBQWUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFnQixFQUFFLEVBQVUsRUFBRSxFQUFFO1FBQ2xGLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyx1QkFBYyxFQUFFO1lBQ3BDLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6RSxNQUFNLFVBQVUsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUUsSUFBSTtnQkFDRixJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUNqQjthQUNGO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7YUFDeEU7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRWQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUN0QyxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQTVCRCw4Q0E0QkM7QUFFRCxTQUFzQixrQkFBa0IsQ0FBQyxHQUF3QixFQUFFLE9BQWUsRUFBRSxHQUFlLEVBQUUsUUFBaUI7OztRQUNwSCxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJLDBDQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsRCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBQSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxRQUFRLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFM0UsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFZLEVBQUUsUUFBbUIsRUFBRSxFQUFFLG1CQUNqRCxPQUFBLE1BQUEsTUFBQSxNQUFBLFFBQVEsQ0FBQyxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsU0FBUyxFQUFFLElBQUksQ0FBQywwQ0FBRSxDQUFDLDBDQUFFLEtBQUssbUNBQUksUUFBUSxFQUFFLENBQUEsRUFBQSxDQUFDO1FBRWhFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUU5RCxPQUFPO1lBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDO1lBQ3ZDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQztZQUNqRCxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7WUFDckMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzFCLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQztZQUNqQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUM7WUFDckMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzlDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUNyQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDL0MsUUFBUSxFQUFFLFFBQVE7U0FDbkIsQ0FBQzs7Q0FDSDtBQXZCRCxnREF1QkM7QUFFRCxTQUFzQixXQUFXLENBQUMsR0FBd0IsRUFBRSxPQUFlLEVBQUUsR0FBZTs7UUFDMUYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBQSxrQkFBTyxHQUFFLENBQUMsQ0FBQztRQUM1RSxNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsTUFBTSxJQUFBLDBCQUFVLEVBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkQsSUFBSTtZQUdGLElBQUksV0FBVyxHQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzFELE1BQU0sSUFBQSxtQkFBSSxFQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBRTtnQkFDN0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLFVBQVUsQ0FBQyxDQUFDO2dCQUN2RixJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7b0JBQ3RCLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2lCQUM3QjtZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUMzQyxNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0IsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7Z0JBQ3pCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNuQztpQkFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRTtnQkFFM0UsR0FBRyxDQUFDLGdCQUFnQixDQUFDO29CQUNuQixJQUFJLEVBQUUsU0FBUztvQkFDZixPQUFPLEVBQUUsaUZBQWlGO29CQUMxRixPQUFPLEVBQUUsQ0FBQzs0QkFDUixLQUFLLEVBQUUsTUFBTTs0QkFDYixNQUFNLEVBQUUsR0FBRyxFQUFFO2dDQUNYLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFO29DQUMvQyxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU87aUNBQ3JCLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUE7NEJBQzFCLENBQUM7eUJBQ0YsQ0FBQztvQkFDRixPQUFPLEVBQUU7d0JBQ1AsT0FBTyxFQUFFLGlCQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQztxQkFDakM7aUJBQ0YsQ0FBQyxDQUFBO2dCQUNGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNuQztpQkFBTTtnQkFDTCxNQUFNLEdBQUcsQ0FBQzthQUNYO1NBQ0Y7SUFDSCxDQUFDO0NBQUE7QUE1Q0Qsa0NBNENDO0FBRUQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFNBQXNCLGdCQUFnQixDQUFDLEdBQXdCLEVBQUUsSUFBa0IsRUFBRSxVQUFrQjs7UUFDckcsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLE9BQU87U0FDUjtRQUVELE1BQU0sYUFBYSxHQUFHLE1BQU0saUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxVQUFVLEtBQUssUUFBUSxDQUFDO1lBQzVDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQztZQUMxRCxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUVoRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFPLEVBQUUsQ0FBQztRQUM5QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLElBQUk7WUFDRixNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDNUQsTUFBTSxlQUFFLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztTQUM1QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNkLE1BQU0sV0FBVyxHQUFHLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDaEYsT0FBTztTQUNSO0lBQ0gsQ0FBQztDQUFBO0FBckJELDRDQXFCQztBQUVELFNBQXNCLFlBQVksQ0FBQyxPQUFlOztRQUNoRCxNQUFNLEdBQUcsR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDbEUsT0FBTyxJQUFBLDJCQUFrQixFQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FBQTtBQUhELG9DQUdDO0FBRUQsU0FBc0IsZUFBZSxDQUFDLEdBQXdCOztRQUM1RCxNQUFNLFVBQVUsR0FBVyxNQUFNLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdELE1BQU0sY0FBYyxHQUFHLElBQUEseUJBQWlCLEdBQUUsQ0FBQztRQUMzQyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQy9CLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDZCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVFLE9BQU8sWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuRCxNQUFNLFlBQVksR0FBRyxDQUFDLFVBQVUsS0FBSyxRQUFRLENBQUM7WUFDNUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixDQUFDO1lBQzFELENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Q0FBQTtBQWRELDBDQWNDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLEdBQXdCOzs7UUFDekQsTUFBTSxXQUFXLEdBQUcsTUFBTSxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0MsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQUEsV0FBVyxhQUFYLFdBQVcsdUJBQVgsV0FBVyxDQUFFLElBQUksMENBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDckUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE1BQUEsTUFBQSxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsUUFBUSwwQ0FBRyxDQUFDLENBQUMsMENBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFBLE1BQUEsVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFFLFFBQVEsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuRSxNQUFNLGFBQWEsR0FBRyxNQUFBLE1BQUEsTUFBQSxZQUFZLGFBQVosWUFBWSx1QkFBWixZQUFZLENBQUUsUUFBUSwwQ0FBRyxDQUFDLENBQUMsMENBQUUsSUFBSSxtQ0FBSSxFQUFFLENBQUM7UUFDOUQsTUFBTSxRQUFRLEdBQUcsTUFBQSxNQUFBLE1BQUEsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLFFBQVEsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLElBQUksbUNBQUksRUFBRSxDQUFDO1FBQ3JELE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBQyxPQUFBLE1BQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQywwQ0FBRSxLQUFLLENBQUEsRUFBQSxDQUFDLENBQUM7UUFHdEYsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLElBQUksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUM1QyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUQsTUFBTSxVQUFVLEdBQVcsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksMENBQUUsYUFBYSxDQUFDO1FBQ3RFLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDL0MsTUFBTSxTQUFTLEdBQUcsTUFBQSxNQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSwwQ0FBRSxlQUFlLDBDQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUN0RCxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxrQ0FBa0MsRUFBRTtvQkFDekQsSUFBSSxFQUFFLGdFQUFnRTswQkFDbEUsaUVBQWlFOzBCQUNqRSxnRkFBZ0Y7MEJBQ2hGLGdFQUFnRTtpQkFDckUsRUFBRTtvQkFDRCxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7aUJBQ3RCLENBQUMsQ0FBQzthQUNKO1NBQ0Y7UUFFRCxRQUFRLEdBQUcsUUFBUTthQUNoQixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7YUFFL0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUM7YUFFdEMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsUUFBUTthQUN6QixTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0NBQ2hGO0FBdENELG9DQXNDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBnZW5lcmF0ZSBhcyBzaG9ydGlkIH0gZnJvbSAnc2hvcnRpZCc7XHJcbmltcG9ydCB3YWxrIGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCB0eXBlcywgc2VsZWN0b3JzLCBsb2csIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgQnVpbGRlciwgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcclxuaW1wb3J0IHsgREVCVUcsIE1PRF9UWVBFX0xTTElCLCBHQU1FX0lELCBERUZBVUxUX01PRF9TRVRUSU5HU19WNywgREVGQVVMVF9NT0RfU0VUVElOR1NfVjYgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGV4dHJhY3RQYWsgfSBmcm9tICcuL2RpdmluZVdyYXBwZXInO1xyXG5pbXBvcnQgeyBJTW9kU2V0dGluZ3MsIElQYWtJbmZvLCBJTW9kTm9kZSwgSVhtbE5vZGUsIExPRm9ybWF0IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2FtZVBhdGgoYXBpKTogc3RyaW5nIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIHJldHVybiBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGggYXMgc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2FtZURhdGFQYXRoKGFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZVBhdGggPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGg7XHJcbiAgaWYgKGdhbWVQYXRoICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oZ2FtZVBhdGgsICdEYXRhJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZG9jdW1lbnRzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnbG9jYWxBcHBEYXRhJyksICdMYXJpYW4gU3R1ZGlvcycsICdCYWxkdXJcXCdzIEdhdGUgMycpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW9kc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdNb2RzJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9maWxlc1BhdGgoKSB7XHJcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdQbGF5ZXJQcm9maWxlcycpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2xvYmFsUHJvZmlsZVBhdGgoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3QgYmczUHJvZmlsZUlkID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xyXG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCBiZzNQcm9maWxlSWQpO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xyXG4gIGxldCBjYWNoZWQgPSBbXTtcclxuICB0cnkge1xyXG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXHJcbiAgICAgIC5maWx0ZXIobmFtZSA9PiAocGF0aC5leHRuYW1lKG5hbWUpID09PSAnJykgJiYgKG5hbWUgIT09ICdEZWZhdWx0JykpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiAoKSA9PiBjYWNoZWQ7XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2FtZVN1cHBvcnRzUHJvZmlsZShnYW1lVmVyc2lvbjogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIHNlbXZlci5sdChzZW12ZXIuY29lcmNlKGdhbWVWZXJzaW9uKSwgJzQuMS4yMDYnKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE93bkdhbWVWZXJzaW9uKHN0YXRlOiB0eXBlcy5JU3RhdGUpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIHJldHVybiBhd2FpdCB1dGlsLmdldEdhbWUoR0FNRV9JRCkuZ2V0SW5zdGFsbGVkVmVyc2lvbihkaXNjb3ZlcnkpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIHJldHVybiBnYW1lU3VwcG9ydHNQcm9maWxlKGF3YWl0IGdldE93bkdhbWVWZXJzaW9uKGFwaS5nZXRTdGF0ZSgpKSlcclxuICAgID8gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlIHx8ICdnbG9iYWwnXHJcbiAgICA6ICdQdWJsaWMnO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNb2ROb2RlKG5vZGU6IElNb2ROb2RlKSB7XHJcbiAgY29uc3QgbmFtZSA9IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnTmFtZScpLiQudmFsdWU7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBuYW1lLFxyXG4gICAgbmFtZSxcclxuICAgIGRhdGE6IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQudmFsdWUsXHJcbiAgfTtcclxufVxyXG5cclxuY29uc3QgcmVzb2x2ZU1ldGEgPSAobWV0YWRhdGE/OiBhbnkpID0+IHtcclxuICByZXR1cm4gKG1ldGFkYXRhICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IHR5cGVvZiBtZXRhZGF0YSA9PT0gJ3N0cmluZydcclxuICAgICAgPyBtZXRhZGF0YVxyXG4gICAgICA6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKVxyXG4gICAgOiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2dFcnJvcihtZXNzYWdlOiBzdHJpbmcsIG1ldGFkYXRhPzogYW55KSB7XHJcbiAgY29uc3QgbWV0YSA9IHJlc29sdmVNZXRhKG1ldGFkYXRhKTtcclxuICBsb2coJ2RlYnVnJywgbWVzc2FnZSwgbWV0YSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2dEZWJ1ZyhtZXNzYWdlOiBzdHJpbmcsIG1ldGFkYXRhPzogYW55KSB7XHJcbiAgaWYgKERFQlVHKSB7XHJcbiAgICAvLyBzbyBtZXRhXHJcbiAgICBjb25zdCBtZXRhID0gcmVzb2x2ZU1ldGEobWV0YWRhdGEpO1xyXG4gICAgbG9nKCdkZWJ1ZycsIG1lc3NhZ2UsIG1ldGEpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGFjdGlvbiA9IHtcclxuICAgIHR5cGU6ICdTRVRfRkJfRk9SQ0VfVVBEQVRFJyxcclxuICAgIHBheWxvYWQ6IHtcclxuICAgICAgcHJvZmlsZUlkLFxyXG4gICAgfSxcclxuICB9O1xyXG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb24pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmluZE5vZGU8VCBleHRlbmRzIElYbWxOb2RlPHsgaWQ6IHN0cmluZyB9PiwgVT4obm9kZXM6IFRbXSwgaWQ6IHN0cmluZyk6IFQge1xyXG4gIHJldHVybiBub2Rlcz8uZmluZChpdGVyID0+IGl0ZXIuJC5pZCA9PT0gaWQpID8/IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XHJcbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldiwgaWQpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBhcmNJZCA9IG1vZHNbaWRdLmFyY2hpdmVJZDtcclxuICAgICAgY29uc3QgZGw6IHR5cGVzLklEb3dubG9hZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnZG93bmxvYWRzJywgJ2ZpbGVzJywgYXJjSWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBzdG9yZWRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZiAoc2VtdmVyLmd0KHN0b3JlZFZlciwgcHJldikpIHtcclxuICAgICAgICAgIHByZXYgPSBzdG9yZWRWZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCB2ZXJzaW9uIHN0b3JlZCBmb3IgbHNsaWIgbW9kJywgeyBpZCwgdmVyc2lvbjogc3RvcmVkVmVyIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFRoZSBMU0xpYiBkZXZlbG9wZXIgZG9lc24ndCBhbHdheXMgdXBkYXRlIHRoZSB2ZXJzaW9uIG9uIHRoZSBleGVjdXRhYmxlXHJcbiAgICAgICAgLy8gIGl0c2VsZiAtIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBleHRyYWN0IGl0IGZyb20gdGhlIGFyY2hpdmUgd2hpY2ggdGVuZHNcclxuICAgICAgICAvLyAgdG8gdXNlIHRoZSBjb3JyZWN0IHZlcnNpb24uXHJcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRsLmxvY2FsUGF0aCwgcGF0aC5leHRuYW1lKGRsLmxvY2FsUGF0aCkpO1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHZlciA9IHNlbXZlci5jb2VyY2UoZmlsZU5hbWUuc2xpY2UoaWR4ICsgMikpLnZlcnNpb247XHJcbiAgICAgICAgICBpZiAoc2VtdmVyLnZhbGlkKHZlcikgJiYgdmVyICE9PSBzdG9yZWRWZXIpIHtcclxuICAgICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsIHZlcikpO1xyXG4gICAgICAgICAgICBwcmV2ID0gdmVyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGdldCB0aGUgdmVyc2lvbi4uLiBPaCB3ZWxsLi4gU2V0IGEgYm9ndXMgdmVyc2lvbiBzaW5jZVxyXG4gICAgICAgICAgLy8gIHdlIGNsZWFybHkgaGF2ZSBsc2xpYiBpbnN0YWxsZWQgLSB0aGUgdXBkYXRlIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIHRha2VcclxuICAgICAgICAgIC8vICBjYXJlIG9mIHRoZSByZXN0ICh3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgY2hlY2sgZm9yIHVwZGF0ZXMgYnV0dG9uKVxyXG4gICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsICcxLjAuMCcpKTtcclxuICAgICAgICAgIHByZXYgPSAnMS4wLjAnO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgJzAuMC4wJyk7XHJcbn1cclxuXHJcbmxldCBfRk9STUFUOiBMT0Zvcm1hdCA9IG51bGw7XHJcbmNvbnN0IFBBVENIXzcgPSAnNC41OC40OSc7XHJcbmNvbnN0IFBBVENIXzYgPSAnNC41MC4yMic7XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXREZWZhdWx0TW9kU2V0dGluZ3NGb3JtYXQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxMT0Zvcm1hdD4ge1xyXG4gIGlmIChfRk9STUFUICE9PSBudWxsKSB7XHJcbiAgICByZXR1cm4gX0ZPUk1BVDtcclxuICB9XHJcbiAgX0ZPUk1BVCA9ICd2Nyc7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lVmVyc2lvbiA9IGF3YWl0IGdldE93bkdhbWVWZXJzaW9uKHN0YXRlKTtcclxuICAgIGNvbnN0IGNvZXJjZWQgPSBnYW1lVmVyc2lvbiA/IHNlbXZlci5jb2VyY2UoZ2FtZVZlcnNpb24pIDogUEFUQ0hfNztcclxuICAgIGlmIChzZW12ZXIuZ3RlKGNvZXJjZWQsIFBBVENIXzcpKSB7XHJcbiAgICAgIF9GT1JNQVQgPSAndjcnO1xyXG4gICAgfSBlbHNlIGlmIChzZW12ZXIuZ3RlKGNvZXJjZWQsIFBBVENIXzYpKSB7XHJcbiAgICAgIF9GT1JNQVQgPSAndjYnO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgX0ZPUk1BVCA9ICdwcmUtdjYnO1xyXG4gICAgfVxyXG4gIH1cclxuICBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnZmFpbGVkIHRvIGdldCBnYW1lIHZlcnNpb24nLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIF9GT1JNQVQ7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXREZWZhdWx0TW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICBpZiAoX0ZPUk1BVCA9PT0gbnVsbCkge1xyXG4gICAgX0ZPUk1BVCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgJ3Y3JzogREVGQVVMVF9NT0RfU0VUVElOR1NfVjcsXHJcbiAgICAndjYnOiBERUZBVUxUX01PRF9TRVRUSU5HU19WNixcclxuICAgICdwcmUtdjYnOiBERUZBVUxUX01PRF9TRVRUSU5HU19WNlxyXG4gIH1bX0ZPUk1BVF07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb252ZXJ0VjZ0b1Y3KHY2WG1sOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IHY2SnNvbiA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZSh2NlhtbCk7XHJcbiAgdjZKc29uLnNhdmUudmVyc2lvblswXS4kLm1ham9yID0gJzQnO1xyXG4gIHY2SnNvbi5zYXZlLnZlcnNpb25bMF0uJC5taW5vciA9ICc3JztcclxuICB2Nkpzb24uc2F2ZS52ZXJzaW9uWzBdLiQucmV2aXNpb24gPSAnMSc7XHJcbiAgdjZKc29uLnNhdmUudmVyc2lvblswXS4kLmJ1aWxkID0gJzMnO1xyXG5cclxuICBjb25zdCBtb2R1bGVTZXR0aW5nc0NoaWxkcmVuID0gdjZKc29uLnNhdmUucmVnaW9uWzBdLm5vZGVbMF0uY2hpbGRyZW5bMF0ubm9kZTtcclxuICBjb25zdCBtb2RPcmRlckluZGV4ID0gbW9kdWxlU2V0dGluZ3NDaGlsZHJlbi5maW5kSW5kZXgoKG46IGFueSkgPT4gbi4kLmlkID09PSAnTW9kT3JkZXInKTtcclxuICBpZiAobW9kT3JkZXJJbmRleCAhPT0gLTEpIHtcclxuICAgIC8vIFJlbW92ZSB0aGUgJ01vZE9yZGVyJyBub2RlIGlmIGl0IGV4aXN0c1xyXG4gICAgbW9kdWxlU2V0dGluZ3NDaGlsZHJlbi5zcGxpY2UobW9kT3JkZXJJbmRleCwgMSk7XHJcbiAgfVxyXG5cclxuICAvLyBGaW5kIHRoZSAnTW9kcycgbm9kZSB0byBtb2RpZnkgYXR0cmlidXRlc1xyXG4gIGNvbnN0IG1vZHNOb2RlID0gbW9kdWxlU2V0dGluZ3NDaGlsZHJlbi5maW5kKChuOiBhbnkpID0+IG4uJC5pZCA9PT0gJ01vZHMnKTtcclxuXHJcbiAgaWYgKG1vZHNOb2RlKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3QgbW9kdWxlU2hvcnREZXNjTm9kZSA9IG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGVbaV07XHJcblxyXG4gICAgICBpZiAobW9kdWxlU2hvcnREZXNjTm9kZSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgJ1VVSUQnIGF0dHJpYnV0ZSB0eXBlIGZyb20gJ0ZpeGVkU3RyaW5nJyB0byAnZ3VpZCdcclxuICAgICAgICBjb25zdCB1dWlkQXR0cmlidXRlID0gbW9kdWxlU2hvcnREZXNjTm9kZS5hdHRyaWJ1dGUuZmluZCgoYXR0cjogYW55KSA9PiBhdHRyLiQuaWQgPT09ICdVVUlEJyk7XHJcbiAgICAgICAgaWYgKHV1aWRBdHRyaWJ1dGUpIHtcclxuICAgICAgICAgIHV1aWRBdHRyaWJ1dGUuJC50eXBlID0gJ2d1aWQnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcHVibGlzaEhhbmRsZUF0dCA9IG1vZHVsZVNob3J0RGVzY05vZGUuYXR0cmlidXRlLmZpbmQoKGF0dHI6IGFueSkgPT4gYXR0ci4kLmlkID09PSAnUHVibGlzaEhhbmRsZScpO1xyXG4gICAgICAgIGlmIChwdWJsaXNoSGFuZGxlQXR0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIG1vZHVsZVNob3J0RGVzY05vZGUuYXR0cmlidXRlLnB1c2goe1xyXG4gICAgICAgICAgICAkOiB7IGlkOiAncHVibGlzaEhhbmRsZScsIHR5cGU6ICd1aW50NjQnLCB2YWx1ZTogJzAnIH1cclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNaWdodCBuZWVkIHRvIGV4cGFuZCBvbiB0aGlzIGxhdGVyIChyZW1vdmluZyB1c2VsZXNzIGF0dHJpYnV0ZXMsIGV0YylcclxuICAgICAgfSBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gIGNvbnN0IHY3WG1sID0gYnVpbGRlci5idWlsZE9iamVjdCh2Nkpzb24pO1xyXG5cclxuICByZXR1cm4gdjdYbWw7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXRlc3RMU0xpYk1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XHJcbiAgaWYgKG1vZHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIGNvbnN0IGxzTGliOiB0eXBlcy5JTW9kID0gT2JqZWN0LmtleXMobW9kcykucmVkdWNlKChwcmV2OiB0eXBlcy5JTW9kLCBpZDogc3RyaW5nKSA9PiB7XHJcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gTU9EX1RZUEVfTFNMSUIpIHtcclxuICAgICAgY29uc3QgbGF0ZXN0VmVyID0gdXRpbC5nZXRTYWZlKHByZXYsIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG4gICAgICBjb25zdCBjdXJyZW50VmVyID0gdXRpbC5nZXRTYWZlKG1vZHNbaWRdLCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZiAoc2VtdmVyLmd0KGN1cnJlbnRWZXIsIGxhdGVzdFZlcikpIHtcclxuICAgICAgICAgIHByZXYgPSBtb2RzW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnd2FybicsICdpbnZhbGlkIG1vZCB2ZXJzaW9uJywgeyBtb2RJZDogaWQsIHZlcnNpb246IGN1cnJlbnRWZXIgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBwcmV2O1xyXG4gIH0sIHVuZGVmaW5lZCk7XHJcblxyXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiBsc0xpYjtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWtJbmZvSW1wbChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kLCBpc0xpc3RlZDogYm9vbGVhbik6IFByb21pc2U8SVBha0luZm8+IHtcclxuICBjb25zdCBtZXRhID0gYXdhaXQgZXh0cmFjdE1ldGEoYXBpLCBwYWtQYXRoLCBtb2QpO1xyXG4gIGNvbnN0IGNvbmZpZyA9IGZpbmROb2RlKG1ldGE/LnNhdmU/LnJlZ2lvbiwgJ0NvbmZpZycpO1xyXG4gIGNvbnN0IGNvbmZpZ1Jvb3QgPSBmaW5kTm9kZShjb25maWc/Lm5vZGUsICdyb290Jyk7XHJcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XHJcblxyXG4gIGNvbnN0IGF0dHIgPSAobmFtZTogc3RyaW5nLCBmYWxsYmFjazogKCkgPT4gYW55KSA9PlxyXG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcclxuXHJcbiAgY29uc3QgZ2VuTmFtZSA9IHBhdGguYmFzZW5hbWUocGFrUGF0aCwgcGF0aC5leHRuYW1lKHBha1BhdGgpKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcclxuICAgIGRlc2NyaXB0aW9uOiBhdHRyKCdEZXNjcmlwdGlvbicsICgpID0+ICdNaXNzaW5nJyksXHJcbiAgICBmb2xkZXI6IGF0dHIoJ0ZvbGRlcicsICgpID0+IGdlbk5hbWUpLFxyXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXHJcbiAgICBuYW1lOiBhdHRyKCdOYW1lJywgKCkgPT4gZ2VuTmFtZSksXHJcbiAgICB0eXBlOiBhdHRyKCdUeXBlJywgKCkgPT4gJ0FkdmVudHVyZScpLFxyXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcclxuICAgIHZlcnNpb246IGF0dHIoJ1ZlcnNpb242NCcsICgpID0+ICcxJyksXHJcbiAgICBwdWJsaXNoSGFuZGxlOiBhdHRyKCdQdWJsaXNoSGFuZGxlJywgKCkgPT4gJzAnKSxcclxuICAgIGlzTGlzdGVkOiBpc0xpc3RlZFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcclxuICBjb25zdCBtZXRhUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ3RlbXAnKSwgJ2xzbWV0YScsIHNob3J0aWQoKSk7XHJcbiAgYXdhaXQgZnMuZW5zdXJlRGlyQXN5bmMobWV0YVBhdGgpO1xyXG4gIGF3YWl0IGV4dHJhY3RQYWsoYXBpLCBwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcclxuICB0cnkge1xyXG4gICAgLy8gdGhlIG1ldGEubHN4IG1heSBiZSBpbiBhIHN1YmRpcmVjdG9yeS4gVGhlcmUgaXMgcHJvYmFibHkgYSBwYXR0ZXJuIGhlcmVcclxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXHJcbiAgICBsZXQgbWV0YUxTWFBhdGg6IHN0cmluZyA9IHBhdGguam9pbihtZXRhUGF0aCwgJ21ldGEubHN4Jyk7XHJcbiAgICBhd2FpdCB3YWxrKG1ldGFQYXRoLCBlbnRyaWVzID0+IHtcclxuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XHJcbiAgICAgIGlmICh0ZW1wICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBtZXRhTFNYUGF0aCA9IHRlbXAuZmlsZVBhdGg7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtZXRhTFNYUGF0aCk7XHJcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XHJcbiAgICByZXR1cm4gbWV0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1ldGFQYXRoKTtcclxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfSBlbHNlIGlmIChlcnIubWVzc2FnZS5pbmNsdWRlcygnQ29sdW1uJykgJiYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKCdMaW5lJykpKSB7XHJcbiAgICAgIC8vIGFuIGVycm9yIG1lc3NhZ2Ugc3BlY2lmeWluZyBjb2x1bW4gYW5kIHJvdyBpbmRpY2F0ZSBhIHByb2JsZW0gcGFyc2luZyB0aGUgeG1sIGZpbGVcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgICBtZXNzYWdlOiAnVGhlIG1ldGEubHN4IGZpbGUgaW4gXCJ7e21vZE5hbWV9fVwiIGlzIGludmFsaWQsIHBsZWFzZSByZXBvcnQgdGhpcyB0byB0aGUgYXV0aG9yJyxcclxuICAgICAgICBhY3Rpb25zOiBbe1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnSW52YWxpZCBtZXRhLmxzeCBmaWxlJywge1xyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxyXG4gICAgICAgICAgICB9LCBbeyBsYWJlbDogJ0Nsb3NlJyB9XSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XSxcclxuICAgICAgICByZXBsYWNlOiB7XHJcbiAgICAgICAgICBtb2ROYW1lOiB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSxcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmxldCBzdG9yZWRMTyA9IFtdO1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRhdGE6IElNb2RTZXR0aW5ncywgYmczcHJvZmlsZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKCFiZzNwcm9maWxlKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBnbG9iYWxQcm9maWxlID0gYXdhaXQgZ2xvYmFsUHJvZmlsZVBhdGgoYXBpKTtcclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSAoYmczcHJvZmlsZSAhPT0gJ2dsb2JhbCcpXHJcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXHJcbiAgICA6IHBhdGguam9pbihnbG9iYWxQcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcblxyXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKHNldHRpbmdzUGF0aCkpO1xyXG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoc2V0dGluZ3NQYXRoLCB4bWwpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgc3RvcmVkTE8gPSBbXTtcclxuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIHNldHRpbmdzJywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlTFNYRmlsZShsc3hQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobHN4UGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBwbGF5ZXJQcm9maWxlcyA9IGdldFBsYXllclByb2ZpbGVzKCk7XHJcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgc3RvcmVkTE8gPSBbXTtcclxuICAgIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgJ1B1YmxpYycsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICAgIHJldHVybiBwYXJzZUxTWEZpbGUoc2V0dGluZ3NQYXRoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGdsb2JhbFByb2ZpbGUgPSBhd2FpdCBnbG9iYWxQcm9maWxlUGF0aChhcGkpO1xyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJylcclxuICAgID8gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNwcm9maWxlLCAnbW9kc2V0dGluZ3MubHN4JylcclxuICAgIDogcGF0aC5qb2luKGdsb2JhbFByb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICByZXR1cm4gcGFyc2VMU1hGaWxlKHNldHRpbmdzUGF0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkU3RvcmVkTE8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcclxuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICBjb25zdCBjb25maWdSb290ID0gZmluZE5vZGUoY29uZmlnPy5ub2RlLCAncm9vdCcpO1xyXG4gIGNvbnN0IG1vZE9yZGVyUm9vdCA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpO1xyXG4gIGNvbnN0IG1vZHNSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcclxuICBjb25zdCBtb2RPcmRlck5vZGVzID0gbW9kT3JkZXJSb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlID8/IFtdO1xyXG4gIGNvbnN0IG1vZE5vZGVzID0gbW9kc1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUgPz8gW107XHJcbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcclxuXHJcbiAgLy8gcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydzZXR0aW5nc1dyaXR0ZW4nLCBwcm9maWxlXSwgeyB0aW1lLCBjb3VudCB9KTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHZQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XHJcbiAgICB1dGlsLmdldFNhZmUodlByb2ZpbGUsIFsnbW9kU3RhdGUnLCBpZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcclxuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnBsYXllclByb2ZpbGU7XHJcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID4gMCAmJiBtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcclxuICAgIGNvbnN0IGxhc3RXcml0ZSA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8uc2V0dGluZ3NXcml0dGVuPy5bYmczcHJvZmlsZV07XHJcbiAgICBpZiAoKGxhc3RXcml0ZSAhPT0gdW5kZWZpbmVkKSAmJiAobGFzdFdyaXRlLmNvdW50ID4gMSkpIHtcclxuICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlIHdhcyByZXNldCcsIHtcclxuICAgICAgICB0ZXh0OiAnVGhlIGdhbWUgcmVzZXQgdGhlIGxpc3Qgb2YgYWN0aXZlIG1vZHMgYW5kIHJhbiB3aXRob3V0IHRoZW0uXFxuJ1xyXG4gICAgICAgICAgKyAnVGhpcyBoYXBwZW5zIHdoZW4gYW4gaW52YWxpZCBvciBpbmNvbXBhdGlibGUgbW9kIGlzIGluc3RhbGxlZC4gJ1xyXG4gICAgICAgICAgKyAnVGhlIGdhbWUgd2lsbCBub3QgbG9hZCBhbnkgbW9kcyBpZiBvbmUgb2YgdGhlbSBpcyBpbmNvbXBhdGlibGUsIHVuZm9ydHVuYXRlbHkgJ1xyXG4gICAgICAgICAgKyAndGhlcmUgaXMgbm8gZWFzeSB3YXkgdG8gZmluZCBvdXQgd2hpY2ggb25lIGNhdXNlZCB0aGUgcHJvYmxlbS4nLFxyXG4gICAgICB9LCBbXHJcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlJyB9LFxyXG4gICAgICBdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHN0b3JlZExPID0gbW9kTm9kZXNcclxuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXHJcbiAgICAvLyBHdXN0YXYgaXMgdGhlIGNvcmUgZ2FtZVxyXG4gICAgLmZpbHRlcihlbnRyeSA9PiBlbnRyeS5pZCA9PT0gJ0d1c3RhdicpXHJcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBtb2RPcmRlclxyXG4gICAgICAuZmluZEluZGV4KGkgPT4gaSA9PT0gbGhzLmRhdGEpIC0gbW9kT3JkZXIuZmluZEluZGV4KGkgPT4gaSA9PT0gcmhzLmRhdGEpKTtcclxufSJdfQ==