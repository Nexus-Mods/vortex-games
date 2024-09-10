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
exports.loadOrderFilePath = exports.ensureLOFile = exports.genProps = exports.validate = exports.deepRefresh = exports.exportToGame = exports.exportToFile = exports.processLsxFile = exports.getNodes = exports.importModSettingsGame = exports.importModSettingsFile = exports.importFromBG3MM = exports.deserialize = exports.serialize = void 0;
const vortex_api_1 = require("vortex-api");
const path_1 = __importDefault(require("path"));
const semver = __importStar(require("semver"));
const bluebird_1 = __importDefault(require("bluebird"));
const common_1 = require("./common");
const xml2js_1 = require("xml2js");
const divineWrapper_1 = require("./divineWrapper");
const util_1 = require("./util");
const cache_1 = __importDefault(require("./cache"));
function serialize(context, loadOrder, profileId) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const props = genProps(context);
        if (props === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('invalid props'));
        }
        const state = context.api.getState();
        const loFilePath = yield ensureLOFile(context, profileId, props);
        (0, util_1.logDebug)('serialize loadOrder=', loadOrder);
        yield vortex_api_1.fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
        yield vortex_api_1.fs.writeFileAsync(loFilePath, JSON.stringify(loadOrder), { encoding: 'utf8' });
        const autoExportToGame = (_a = state.settings['baldursgate3'].autoExportLoadOrder) !== null && _a !== void 0 ? _a : false;
        (0, util_1.logDebug)('serialize autoExportToGame=', autoExportToGame);
        if (autoExportToGame)
            yield exportToGame(context.api);
        return Promise.resolve();
    });
}
exports.serialize = serialize;
function deserialize(context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const props = genProps(context);
        if (((_a = props === null || props === void 0 ? void 0 : props.profile) === null || _a === void 0 ? void 0 : _a.gameId) !== common_1.GAME_ID) {
            return [];
        }
        const paks = yield readPAKs(context.api);
        const loFilePath = yield ensureLOFile(context);
        const fileData = yield vortex_api_1.fs.readFileAsync(loFilePath, { encoding: 'utf8' });
        let loadOrder = [];
        try {
            try {
                loadOrder = JSON.parse(fileData);
            }
            catch (err) {
                yield new Promise((resolve, reject) => {
                    props.api.showDialog('error', 'Corrupt load order file', {
                        bbcode: props.api.translate('The load order file is in a corrupt state. You can try to fix it yourself '
                            + 'or Vortex can regenerate the file for you, but that may result in loss of data ' +
                            '(Will only affect load order items you added manually, if any).')
                    }, [
                        { label: 'Cancel', action: () => reject(err) },
                        { label: 'Regenerate File', action: () => {
                                loadOrder = [];
                                return resolve();
                            }
                        }
                    ]);
                });
            }
            (0, util_1.logDebug)('deserialize loadOrder=', loadOrder);
            const filteredLoadOrder = loadOrder.filter(entry => paks.find(pak => pak.fileName === entry.id));
            (0, util_1.logDebug)('deserialize filteredLoadOrder=', filteredLoadOrder);
            const processedPaks = paks.reduce((acc, curr) => {
                acc.valid.push(curr);
                return acc;
            }, { valid: [], invalid: [] });
            (0, util_1.logDebug)('deserialize processedPaks=', processedPaks);
            const addedMods = processedPaks.valid.filter(pak => filteredLoadOrder.find(entry => entry.id === pak.fileName) === undefined);
            (0, util_1.logDebug)('deserialize addedMods=', addedMods);
            (0, util_1.logDebug)('deserialize paks=', paks);
            addedMods.forEach(pak => {
                var _a, _b;
                filteredLoadOrder.push({
                    id: pak.fileName,
                    modId: (_a = pak.mod) === null || _a === void 0 ? void 0 : _a.id,
                    enabled: true,
                    name: ((_b = pak.info) === null || _b === void 0 ? void 0 : _b.name) || path_1.default.basename(pak.fileName, '.pak'),
                    data: pak.info,
                    locked: pak.info.isListed
                });
            });
            return filteredLoadOrder.sort((a, b) => (+b.locked - +a.locked));
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.deserialize = deserialize;
function importFromBG3MM(context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const options = {
            title: api.translate('Please choose a BG3MM .json load order file to import from'),
            filters: [{ name: 'BG3MM Load Order', extensions: ['json'] }]
        };
        const selectedPath = yield api.selectFile(options);
        (0, util_1.logDebug)('importFromBG3MM selectedPath=', selectedPath);
        if (selectedPath === undefined) {
            return;
        }
        try {
            const data = yield vortex_api_1.fs.readFileAsync(selectedPath, { encoding: 'utf8' });
            const loadOrder = JSON.parse(data);
            (0, util_1.logDebug)('importFromBG3MM loadOrder=', loadOrder);
            const getIndex = (uuid) => {
                const index = loadOrder.findIndex(entry => entry.UUID !== undefined && entry.UUID === uuid);
                return index !== -1 ? index : Infinity;
            };
            const state = api.getState();
            const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
            const currentLoadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], []);
            const newLO = [...currentLoadOrder].sort((a, b) => { var _a, _b; return getIndex((_a = a.data) === null || _a === void 0 ? void 0 : _a.uuid) - getIndex((_b = b.data) === null || _b === void 0 ? void 0 : _b.uuid); });
            yield serialize(context, newLO, profileId);
        }
        catch (err) {
            api.showErrorNotification('Failed to import BG3MM load order file', err, { allowReport: false });
        }
        finally {
            (0, util_1.forceRefresh)(context.api);
        }
    });
}
exports.importFromBG3MM = importFromBG3MM;
function importModSettingsFile(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        const options = {
            title: api.translate('Please choose a BG3 .lsx file to import from'),
            filters: [{ name: 'BG3 Load Order', extensions: ['lsx'] }]
        };
        const selectedPath = yield api.selectFile(options);
        (0, util_1.logDebug)('importModSettingsFile selectedPath=', selectedPath);
        if (selectedPath === undefined)
            return;
        processLsxFile(api, selectedPath);
    });
}
exports.importModSettingsFile = importModSettingsFile;
function importModSettingsGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
        const gameSettingsPath = path_1.default.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
        (0, util_1.logDebug)('importModSettingsGame gameSettingsPath=', gameSettingsPath);
        processLsxFile(api, gameSettingsPath);
    });
}
exports.importModSettingsGame = importModSettingsGame;
function checkIfDuplicateExists(arr) {
    return new Set(arr).size !== arr.length;
}
function getAttribute(node, name, fallback) {
    var _a, _b, _c;
    return (_c = (_b = (_a = (0, util_1.findNode)(node === null || node === void 0 ? void 0 : node.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback;
}
function processBG3MMFile(api, jsonPath) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        api.sendNotification({
            id: common_1.NOTIF_IMPORT_ACTIVITY,
            title: 'Importing JSON File',
            message: jsonPath,
            type: 'activity',
            noDismiss: true,
            allowSuppress: false,
        });
        try {
        }
        catch (err) {
        }
        finally {
            api.dismissNotification(common_1.NOTIF_IMPORT_ACTIVITY);
        }
    });
}
function getNodes(lsxPath) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const lsxLoadOrder = yield readLsxFile(lsxPath);
        (0, util_1.logDebug)('processLsxFile lsxPath=', lsxPath);
        const region = (0, util_1.findNode)((_a = lsxLoadOrder === null || lsxLoadOrder === void 0 ? void 0 : lsxLoadOrder.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const root = (0, util_1.findNode)(region === null || region === void 0 ? void 0 : region.node, 'root');
        const modsNode = (0, util_1.findNode)((_c = (_b = root === null || root === void 0 ? void 0 : root.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'Mods');
        const modsOrderNode = (0, util_1.findNode)((_e = (_d = root === null || root === void 0 ? void 0 : root.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'ModOrder');
        return { region, root, modsNode, modsOrderNode };
    });
}
exports.getNodes = getNodes;
function processLsxFile(api, lsxPath) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        api.sendNotification({
            id: common_1.NOTIF_IMPORT_ACTIVITY,
            title: 'Importing LSX File',
            message: lsxPath,
            type: 'activity',
            noDismiss: true,
            allowSuppress: false,
        });
        try {
            const { modsNode, modsOrderNode } = yield getNodes(lsxPath);
            if (((modsNode === null || modsNode === void 0 ? void 0 : modsNode.children) === undefined) || ((modsNode === null || modsNode === void 0 ? void 0 : modsNode.children[0]) === '')) {
                modsNode.children = [{ node: [] }];
            }
            const format = yield (0, util_1.getDefaultModSettingsFormat)(api);
            let loNode = format === 'v7' ? modsNode : modsOrderNode !== undefined ? modsOrderNode : modsNode;
            let uuidArray = loNode.children[0].node.map((loEntry) => loEntry.attribute.find(attr => (attr.$.id === 'UUID')).$.value);
            (0, util_1.logDebug)(`processLsxFile uuidArray=`, uuidArray);
            if (checkIfDuplicateExists(uuidArray)) {
                api.sendNotification({
                    type: 'warning',
                    id: 'bg3-loadorder-imported-duplicate',
                    title: 'Duplicate Entries',
                    message: 'Duplicate UUIDs found in the ModOrder section of the .lsx file being imported. This sometimes can cause issues with the load order.',
                });
                uuidArray = Array.from(new Set(uuidArray));
            }
            const lsxModNodes = modsNode.children[0].node;
            (0, util_1.logDebug)(`processLsxFile lsxModNodes=`, lsxModNodes);
            const paks = yield readPAKs(api);
            const missing = paks.reduce((acc, curr) => {
                if (curr.mod === undefined) {
                    return acc;
                }
                if (lsxModNodes.find(lsxEntry => lsxEntry.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === curr.info.name))) === undefined)
                    acc.push(curr);
                return acc;
            }, []);
            (0, util_1.logDebug)('processLsxFile - missing pak files that have associated mods =', missing);
            let newLoadOrder = lsxModNodes.reduce((acc, curr) => {
                var _a, _b;
                const pak = paks.find((pak) => pak.info.name === curr.attribute.find(attr => (attr.$.id === 'Name')).$.value);
                if (pak !== undefined) {
                    acc.push({
                        id: pak.fileName,
                        modId: (_a = pak === null || pak === void 0 ? void 0 : pak.mod) === null || _a === void 0 ? void 0 : _a.id,
                        enabled: true,
                        name: ((_b = pak.info) === null || _b === void 0 ? void 0 : _b.name) || path_1.default.basename(pak.fileName, '.pak'),
                        data: pak.info,
                        locked: pak.info.isListed
                    });
                }
                return acc;
            }, []);
            (0, util_1.logDebug)('processLsxFile (before adding missing) newLoadOrder=', newLoadOrder);
            missing.forEach(pak => {
                var _a, _b;
                newLoadOrder.push({
                    id: pak.fileName,
                    modId: (_a = pak === null || pak === void 0 ? void 0 : pak.mod) === null || _a === void 0 ? void 0 : _a.id,
                    enabled: true,
                    name: ((_b = pak.info) === null || _b === void 0 ? void 0 : _b.name) || path_1.default.basename(pak.fileName, '.pak'),
                    data: pak.info,
                    locked: pak.info.isListed
                });
            });
            (0, util_1.logDebug)('processLsxFile (after adding missing) newLoadOrder=', newLoadOrder);
            newLoadOrder.sort((a, b) => (+b.locked - +a.locked));
            (0, util_1.logDebug)('processLsxFile (after sorting) newLoadOrder=', newLoadOrder);
            api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLoadOrder));
            api.dismissNotification('bg3-loadorder-import-activity');
            api.sendNotification({
                type: 'success',
                id: 'bg3-loadorder-imported',
                title: 'Load Order Imported',
                message: lsxPath,
                displayMS: 3000
            });
            (0, util_1.logDebug)('processLsxFile finished');
        }
        catch (err) {
            api.dismissNotification(common_1.NOTIF_IMPORT_ACTIVITY);
            api.showErrorNotification('Failed to import load order', err, {
                allowReport: false
            });
        }
    });
}
exports.processLsxFile = processLsxFile;
function exportTo(api, filepath) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
        (0, util_1.logDebug)('exportTo loadOrder=', loadOrder);
        try {
            const modSettings = yield readModSettings(api);
            const region = (0, util_1.findNode)((_b = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _b === void 0 ? void 0 : _b.region, 'ModuleSettings');
            const root = (0, util_1.findNode)(region === null || region === void 0 ? void 0 : region.node, 'root');
            const modsNode = (0, util_1.findNode)((_d = (_c = root === null || root === void 0 ? void 0 : root.children) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.node, 'Mods');
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            const descriptionNodes = (_j = (_h = (_g = (_f = (_e = modsNode === null || modsNode === void 0 ? void 0 : modsNode.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node) === null || _g === void 0 ? void 0 : _g.filter) === null || _h === void 0 ? void 0 : _h.call(_g, iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'GustavDev')))) !== null && _j !== void 0 ? _j : [];
            const filteredPaks = loadOrder.filter(entry => {
                var _a, _b;
                return !!((_a = entry.data) === null || _a === void 0 ? void 0 : _a.uuid)
                    && entry.enabled
                    && !((_b = entry.data) === null || _b === void 0 ? void 0 : _b.isListed);
            });
            (0, util_1.logDebug)('exportTo filteredPaks=', filteredPaks);
            for (const entry of filteredPaks) {
                descriptionNodes.push({
                    $: { id: 'ModuleShortDesc' },
                    attribute: [
                        { $: { id: 'Folder', type: 'LSString', value: entry.data.folder } },
                        { $: { id: 'MD5', type: 'LSString', value: entry.data.md5 } },
                        { $: { id: 'Name', type: 'LSString', value: entry.data.name } },
                        { $: { id: 'PublishHandle', type: 'uint64', value: 0 } },
                        { $: { id: 'UUID', type: 'guid', value: entry.data.uuid } },
                        { $: { id: 'Version64', type: 'int64', value: entry.data.version } },
                    ],
                });
            }
            modsNode.children[0].node = descriptionNodes;
            writeModSettings(api, modSettings, filepath);
            api.sendNotification({
                type: 'success',
                id: 'bg3-loadorder-exported',
                title: 'Load Order Exported',
                message: filepath,
                displayMS: 3000
            });
        }
        catch (err) {
            api.showErrorNotification('Failed to write load order', err, {
                allowReport: false,
                message: 'Please run the game at least once and create a profile in-game',
            });
        }
    });
}
function exportToFile(api) {
    return __awaiter(this, void 0, void 0, function* () {
        let selectedPath;
        if (api.saveFile !== undefined) {
            const options = {
                title: api.translate('Please choose a BG3 .lsx file to export to'),
                filters: [{ name: 'BG3 Load Order', extensions: ['lsx'] }],
            };
            selectedPath = yield api.saveFile(options);
        }
        else {
            const options = {
                title: api.translate('Please choose a BG3 .lsx file to export to'),
                filters: [{ name: 'BG3 Load Order', extensions: ['lsx'] }],
                create: true
            };
            selectedPath = yield api.selectFile(options);
        }
        (0, util_1.logDebug)(`exportToFile ${selectedPath}`);
        if (selectedPath === undefined)
            return;
        exportTo(api, selectedPath);
    });
}
exports.exportToFile = exportToFile;
function exportToGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
        (0, util_1.logDebug)(`exportToGame ${settingsPath}`);
        exportTo(api, settingsPath);
    });
}
exports.exportToGame = exportToGame;
function deepRefresh(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
        (0, util_1.logDebug)('deepRefresh', loadOrder);
    });
}
exports.deepRefresh = deepRefresh;
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath, { encoding: 'utf8' });
        (0, util_1.logDebug)('readModSettings', dat);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function readLsxFile(lsxPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const dat = yield vortex_api_1.fs.readFileAsync(lsxPath);
        (0, util_1.logDebug)('lsxPath', dat);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function writeModSettings(api, data, filepath) {
    return __awaiter(this, void 0, void 0, function* () {
        const builder = new xml2js_1.Builder();
        const xml = builder.buildObject(data);
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(filepath));
            yield vortex_api_1.fs.writeFileAsync(filepath, xml);
        }
        catch (err) {
            api.showErrorNotification('Failed to write mod settings', err);
            return;
        }
    });
}
function validate(prev, current) {
    return __awaiter(this, void 0, void 0, function* () {
        return undefined;
    });
}
exports.validate = validate;
function readPAKs(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const lsLib = getLatestLSLibMod(api);
        if (lsLib === undefined) {
            return [];
        }
        const paks = yield readPAKList(api);
        let manifest;
        try {
            manifest = yield vortex_api_1.util.getManifest(api, '', common_1.GAME_ID);
        }
        catch (err) {
            const allowReport = !['EPERM'].includes(err.code);
            api.showErrorNotification('Failed to read deployment manifest', err, { allowReport });
            return [];
        }
        api.sendNotification({
            type: 'activity',
            id: 'bg3-reading-paks-activity',
            message: 'Reading PAK files. This might take a while...',
        });
        const cache = cache_1.default.getInstance(api);
        const res = yield Promise.all(paks.map((fileName, idx) => __awaiter(this, void 0, void 0, function* () {
            return vortex_api_1.util.withErrorContext('reading pak', fileName, () => {
                const func = () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
                        const mod = (manifestEntry !== undefined)
                            ? (_a = state.persistent.mods[common_1.GAME_ID]) === null || _a === void 0 ? void 0 : _a[manifestEntry.source]
                            : undefined;
                        const pakPath = path_1.default.join((0, util_1.modsPath)(), fileName);
                        return cache.getCacheEntry(api, pakPath, mod);
                    }
                    catch (err) {
                        if (err instanceof divineWrapper_1.DivineExecMissing) {
                            const message = 'The installed copy of LSLib/Divine is corrupted - please '
                                + 'delete the existing LSLib mod entry and re-install it. Make sure to '
                                + 'disable or add any necessary exceptions to your security software to '
                                + 'ensure it does not interfere with Vortex/LSLib file operations.';
                            api.showErrorNotification('Divine executable is missing', message, { allowReport: false });
                            return undefined;
                        }
                        if (err.code !== 'ENOENT') {
                            api.showErrorNotification('Failed to read pak. Please make sure you are using the latest version of LSLib by using the "Re-install LSLib/Divine" toolbar button on the Mods page.', err, {
                                allowReport: false,
                                message: fileName,
                            });
                        }
                        return undefined;
                    }
                });
                return bluebird_1.default.resolve(func());
            });
        })));
        api.dismissNotification('bg3-reading-paks-activity');
        return res.filter(iter => iter !== undefined);
    });
}
function readPAKList(api) {
    return __awaiter(this, void 0, void 0, function* () {
        let paks;
        try {
            paks = (yield vortex_api_1.fs.readdirAsync((0, util_1.modsPath)()))
                .filter(fileName => path_1.default.extname(fileName).toLowerCase() === '.pak');
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                try {
                    yield vortex_api_1.fs.ensureDirWritableAsync((0, util_1.modsPath)(), () => Promise.resolve());
                }
                catch (err) {
                }
            }
            else {
                api.showErrorNotification('Failed to read mods directory', err, {
                    id: 'bg3-failed-read-mods',
                    message: (0, util_1.modsPath)(),
                });
            }
            paks = [];
        }
        return paks;
    });
}
function getLatestLSLibMod(api) {
    const state = api.getState();
    const mods = state.persistent.mods[common_1.GAME_ID];
    if (mods === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    const lsLib = Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
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
        const targetPath = loadOrderFilePath(props.profile.id);
        try {
            try {
                yield vortex_api_1.fs.statAsync(targetPath);
            }
            catch (err) {
                yield vortex_api_1.fs.writeFileAsync(targetPath, JSON.stringify([]), { encoding: 'utf8' });
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
        return targetPath;
    });
}
exports.ensureLOFile = ensureLOFile;
function loadOrderFilePath(profileId) {
    return path_1.default.join(vortex_api_1.util.getVortexPath('userData'), common_1.GAME_ID, profileId + '_' + common_1.LO_FILE_NAME);
}
exports.loadOrderFilePath = loadOrderFilePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQXNFO0FBQ3RFLGdEQUF3QjtBQUN4QiwrQ0FBaUM7QUFDakMsd0RBQWdDO0FBRWhDLHFDQUF3RTtBQUV4RSxtQ0FBcUQ7QUFJckQsbURBQW9EO0FBQ3BELGlDQUF5SztBQUV6SyxvREFBb0Q7QUFFcEQsU0FBc0IsU0FBUyxDQUFDLE9BQWdDLEVBQ2hDLFNBQTBCLEVBQzFCLFNBQWtCOzs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUdyQyxNQUFNLFVBQVUsR0FBRyxNQUFNLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBR2pFLElBQUEsZUFBUSxFQUFDLHNCQUFzQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRzVDLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDcEYsTUFBTSxlQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFLckYsTUFBTSxnQkFBZ0IsR0FBVyxNQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsbUJBQW1CLG1DQUFJLEtBQUssQ0FBQztRQUU3RixJQUFBLGVBQVEsRUFBQyw2QkFBNkIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTFELElBQUcsZ0JBQWdCO1lBQ2pCLE1BQU0sWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVsQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7Q0FDMUI7QUEvQkQsOEJBK0JDO0FBRUQsU0FBc0IsV0FBVyxDQUFDLE9BQWdDOzs7UUFLaEUsTUFBTSxLQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQSxNQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxPQUFPLDBDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1lBRXRDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFHekMsTUFBTSxVQUFVLEdBQUcsTUFBTSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0MsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBRTFFLElBQUksU0FBUyxHQUE0QixFQUFFLENBQUM7UUFFNUMsSUFBSTtZQUVGLElBQUk7Z0JBQ0YsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbEM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFFWixNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUMxQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUseUJBQXlCLEVBQUU7d0JBQ3ZELE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0RUFBNEU7OEJBQzVFLGlGQUFpRjs0QkFDakYsaUVBQWlFLENBQUM7cUJBQy9GLEVBQUU7d0JBQ0QsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQzlDLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7Z0NBQ3ZDLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0NBQ2IsT0FBTyxPQUFPLEVBQUUsQ0FBQzs0QkFDbkIsQ0FBQzt5QkFDRjtxQkFDRixDQUFDLENBQUE7Z0JBQ0osQ0FBQyxDQUFDLENBQUE7YUFDSDtZQUdELElBQUEsZUFBUSxFQUFDLHdCQUF3QixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRzlDLE1BQU0saUJBQWlCLEdBQW1CLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVqSCxJQUFBLGVBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBTTlELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQzlDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyQixPQUFPLEdBQUcsQ0FBQztZQUNiLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFL0IsSUFBQSxlQUFRLEVBQUMsNEJBQTRCLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFHdEQsTUFBTSxTQUFTLEdBQWEsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQztZQUV4SSxJQUFBLGVBQVEsRUFBQyx3QkFBd0IsRUFBRSxTQUFTLENBQUMsQ0FBQztZQU05QyxJQUFBLGVBQVEsRUFBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUlwQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFOztnQkFDdEIsaUJBQWlCLENBQUMsSUFBSSxDQUFDO29CQUNyQixFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVE7b0JBQ2hCLEtBQUssRUFBRSxNQUFBLEdBQUcsQ0FBQyxHQUFHLDBDQUFFLEVBQUU7b0JBQ2xCLE9BQU8sRUFBRSxJQUFJO29CQUNiLElBQUksRUFBRSxDQUFBLE1BQUEsR0FBRyxDQUFDLElBQUksMENBQUUsSUFBSSxLQUFJLGNBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7b0JBQzNELElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtvQkFDZCxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUF1QjtpQkFDekMsQ0FBQyxDQUFBO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFRSCxPQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1Qjs7Q0FDRjtBQTlGRCxrQ0E4RkM7QUFFRCxTQUFzQixlQUFlLENBQUMsT0FBZ0M7OztRQUNwRSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sT0FBTyxHQUFpQjtZQUM1QixLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0REFBNEQsQ0FBQztZQUNsRixPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1NBQzlELENBQUM7UUFFRixNQUFNLFlBQVksR0FBVSxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFMUQsSUFBQSxlQUFRLEVBQUMsK0JBQStCLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFHeEQsSUFBRyxZQUFZLEtBQUssU0FBUyxFQUFFO1lBQzdCLE9BQU87U0FDUjtRQUVELElBQUk7WUFDRixNQUFNLElBQUksR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDeEUsTUFBTSxTQUFTLEdBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQyxJQUFBLGVBQVEsRUFBQyw0QkFBNEIsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVsRCxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQVksRUFBVSxFQUFFO2dCQUN4QyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztnQkFDNUYsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ3pDLENBQUMsQ0FBQztZQUVGLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7WUFDckQsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxlQUFDLE9BQUEsUUFBUSxDQUFDLE1BQUEsQ0FBQyxDQUFDLElBQUksMENBQUUsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQUEsQ0FBQyxDQUFDLElBQUksMENBQUUsSUFBSSxDQUFDLENBQUEsRUFBQSxDQUFDLENBQUM7WUFDcEcsTUFBTSxTQUFTLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztTQUM1QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLHFCQUFxQixDQUFDLHdDQUF3QyxFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQ2xHO2dCQUFTO1lBQ1IsSUFBQSxtQkFBWSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMzQjs7Q0FDRjtBQXBDRCwwQ0FvQ0M7QUFFRCxTQUFzQixxQkFBcUIsQ0FBQyxHQUF3Qjs7O1FBRWxFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7UUFFckQsTUFBTSxPQUFPLEdBQWlCO1lBQzVCLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLDhDQUE4QyxDQUFDO1lBQ3BFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7U0FDM0QsQ0FBQztRQUVGLE1BQU0sWUFBWSxHQUFVLE1BQU0sR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUUxRCxJQUFBLGVBQVEsRUFBQyxxQ0FBcUMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUc5RCxJQUFHLFlBQVksS0FBSyxTQUFTO1lBQzNCLE9BQU87UUFFVCxjQUFjLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDOztDQUNuQztBQW5CRCxzREFtQkM7QUFFRCxTQUFzQixxQkFBcUIsQ0FBQyxHQUF3Qjs7UUFFbEUsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLDZCQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sZ0JBQWdCLEdBQVcsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFBLG1CQUFZLEdBQUUsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUU1RixJQUFBLGVBQVEsRUFBQyx5Q0FBeUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXRFLGNBQWMsQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUN4QyxDQUFDO0NBQUE7QUFSRCxzREFRQztBQUVELFNBQVMsc0JBQXNCLENBQUMsR0FBRztJQUNqQyxPQUFPLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFBO0FBQ3pDLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFjLEVBQUUsSUFBWSxFQUFFLFFBQWlCOztJQUNuRSxPQUFPLE1BQUEsTUFBQSxNQUFBLElBQUEsZUFBUSxFQUFDLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLDBDQUFFLENBQUMsMENBQUUsS0FBSyxtQ0FBSSxRQUFRLENBQUM7QUFDL0QsQ0FBQztBQUVELFNBQWUsZ0JBQWdCLENBQUMsR0FBd0IsRUFBRSxRQUFnQjs7O1FBQ3hFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7UUFFckQsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1lBQ25CLEVBQUUsRUFBRSw4QkFBcUI7WUFDekIsS0FBSyxFQUFFLHFCQUFxQjtZQUM1QixPQUFPLEVBQUUsUUFBUTtZQUNqQixJQUFJLEVBQUUsVUFBVTtZQUNoQixTQUFTLEVBQUUsSUFBSTtZQUNmLGFBQWEsRUFBRSxLQUFLO1NBQ3JCLENBQUMsQ0FBQztRQUVILElBQUk7U0FFSDtRQUFDLE9BQU8sR0FBRyxFQUFFO1NBRWI7Z0JBQVM7WUFDUixHQUFHLENBQUMsbUJBQW1CLENBQUMsOEJBQXFCLENBQUMsQ0FBQztTQUNoRDs7Q0FDRjtBQUVELFNBQXNCLFFBQVEsQ0FBQyxPQUFlOzs7UUFDNUMsTUFBTSxZQUFZLEdBQWlCLE1BQU0sV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVELElBQUEsZUFBUSxFQUFDLHlCQUF5QixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRzdDLE1BQU0sTUFBTSxHQUFHLElBQUEsZUFBUSxFQUFDLE1BQUEsWUFBWSxhQUFaLFlBQVksdUJBQVosWUFBWSxDQUFFLElBQUksMENBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM1QyxNQUFNLFFBQVEsR0FBRyxJQUFBLGVBQVEsRUFBQyxNQUFBLE1BQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFFBQVEsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3RCxNQUFNLGFBQWEsR0FBRyxJQUFBLGVBQVEsRUFBQyxNQUFBLE1BQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFFBQVEsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUV0RSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLENBQUM7O0NBQ3BEO0FBWEQsNEJBV0M7QUFFRCxTQUFzQixjQUFjLENBQUMsR0FBd0IsRUFBRSxPQUFjOzs7UUFFM0UsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQUEsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLDBDQUFFLEVBQUUsQ0FBQztRQUVyRCxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDbkIsRUFBRSxFQUFFLDhCQUFxQjtZQUN6QixLQUFLLEVBQUUsb0JBQW9CO1lBQzNCLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLElBQUksRUFBRSxVQUFVO1lBQ2hCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsYUFBYSxFQUFFLEtBQUs7U0FDckIsQ0FBQyxDQUFDO1FBRUgsSUFBSTtZQUNGLE1BQU0sRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLEdBQUcsTUFBTSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLENBQUEsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLFFBQVEsTUFBSyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLFFBQVEsQ0FBQyxDQUFDLENBQVMsTUFBSyxFQUFFLENBQUMsRUFBRTtnQkFDakYsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDcEM7WUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsa0NBQTJCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsSUFBSSxNQUFNLEdBQUcsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUdqRyxJQUFJLFNBQVMsR0FBWSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsSSxJQUFBLGVBQVEsRUFBQywyQkFBMkIsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUdqRCxJQUFHLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNwQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7b0JBQ25CLElBQUksRUFBRSxTQUFTO29CQUNmLEVBQUUsRUFBRSxrQ0FBa0M7b0JBQ3RDLEtBQUssRUFBRSxtQkFBbUI7b0JBQzFCLE9BQU8sRUFBRSxxSUFBcUk7aUJBRy9JLENBQUMsQ0FBQztnQkFHSCxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2FBQzVDO1lBRUQsTUFBTSxXQUFXLEdBQWUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFRMUQsSUFBQSxlQUFRLEVBQUMsNkJBQTZCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFLckQsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFHakMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFHeEMsSUFBRyxJQUFJLENBQUMsR0FBRyxLQUFLLFNBQVMsRUFBRTtvQkFDekIsT0FBTyxHQUFHLENBQUM7aUJBQ1o7Z0JBR0QsSUFBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUztvQkFDekksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFHakIsT0FBTyxHQUFHLENBQUM7WUFDYixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFUCxJQUFBLGVBQVEsRUFBQyxnRUFBZ0UsRUFBRSxPQUFPLENBQUMsQ0FBQztZQVFwRixJQUFJLFlBQVksR0FBNEIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTs7Z0JBRzNFLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFHOUcsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO29CQUNyQixHQUFHLENBQUMsSUFBSSxDQUFDO3dCQUNQLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUTt3QkFDaEIsS0FBSyxFQUFFLE1BQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLEdBQUcsMENBQUUsRUFBRTt3QkFDbkIsT0FBTyxFQUFFLElBQUk7d0JBQ2IsSUFBSSxFQUFFLENBQUEsTUFBQSxHQUFHLENBQUMsSUFBSSwwQ0FBRSxJQUFJLEtBQUksY0FBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQzt3QkFDM0QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO3dCQUNkLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQXVCO3FCQUN6QyxDQUFDLENBQUM7aUJBQ0o7Z0JBRUQsT0FBTyxHQUFHLENBQUM7WUFDYixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFUCxJQUFBLGVBQVEsRUFBQyxzREFBc0QsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUcvRSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFOztnQkFDcEIsWUFBWSxDQUFDLElBQUksQ0FBQztvQkFDaEIsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRO29CQUNoQixLQUFLLEVBQUcsTUFBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsR0FBRywwQ0FBRSxFQUFFO29CQUNwQixPQUFPLEVBQUUsSUFBSTtvQkFDYixJQUFJLEVBQUUsQ0FBQSxNQUFBLEdBQUcsQ0FBQyxJQUFJLDBDQUFFLElBQUksS0FBSSxjQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO29CQUMzRCxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7b0JBQ2QsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBdUI7aUJBQ3pDLENBQUMsQ0FBQTtZQUNKLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBQSxlQUFRLEVBQUMscURBQXFELEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFOUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFckQsSUFBQSxlQUFRLEVBQUMsOENBQThDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFPdkUsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFRbEUsR0FBRyxDQUFDLG1CQUFtQixDQUFDLCtCQUErQixDQUFDLENBQUM7WUFFekQsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuQixJQUFJLEVBQUUsU0FBUztnQkFDZixFQUFFLEVBQUUsd0JBQXdCO2dCQUM1QixLQUFLLEVBQUUscUJBQXFCO2dCQUM1QixPQUFPLEVBQUUsT0FBTztnQkFDaEIsU0FBUyxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1lBRUgsSUFBQSxlQUFRLEVBQUMseUJBQXlCLENBQUMsQ0FBQztTQUVyQztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBRVosR0FBRyxDQUFDLG1CQUFtQixDQUFDLDhCQUFxQixDQUFDLENBQUM7WUFFL0MsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtnQkFDNUQsV0FBVyxFQUFFLEtBQUs7YUFDbkIsQ0FBQyxDQUFDO1NBQ0o7O0NBRUY7QUE1SkQsd0NBNEpDO0FBRUQsU0FBZSxRQUFRLENBQUMsR0FBd0IsRUFBRSxRQUFnQjs7O1FBRWhFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7UUFHckQsTUFBTSxTQUFTLEdBQW1CLGlCQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFM0csSUFBQSxlQUFRLEVBQUMscUJBQXFCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFM0MsSUFBSTtZQUVGLE1BQU0sV0FBVyxHQUFHLE1BQU0sZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRy9DLE1BQU0sTUFBTSxHQUFHLElBQUEsZUFBUSxFQUFDLE1BQUEsV0FBVyxhQUFYLFdBQVcsdUJBQVgsV0FBVyxDQUFFLElBQUksMENBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDckUsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBRyxJQUFBLGVBQVEsRUFBQyxNQUFBLE1BQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFFBQVEsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUU3RCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFTLEtBQUssRUFBRSxDQUFDLEVBQUU7Z0JBQy9FLFFBQVEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ3BDO1lBR0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLFFBQVEsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLElBQUksMENBQUUsTUFBTSxtREFBRyxJQUFJLENBQUMsRUFBRSxDQUN0RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLG1DQUFJLEVBQUUsQ0FBQztZQUUvRixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFOztnQkFBQyxPQUFBLENBQUMsQ0FBQyxDQUFBLE1BQUEsS0FBSyxDQUFDLElBQUksMENBQUUsSUFBSSxDQUFBO3VCQUM5QyxLQUFLLENBQUMsT0FBTzt1QkFDYixDQUFDLENBQUEsTUFBQSxLQUFLLENBQUMsSUFBSSwwQ0FBRSxRQUFRLENBQUEsQ0FBQTthQUFBLENBQUMsQ0FBQztZQUUxQyxJQUFBLGVBQVEsRUFBQyx3QkFBd0IsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUdqRCxLQUFLLE1BQU0sS0FBSyxJQUFJLFlBQVksRUFBRTtnQkFZaEMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDO29CQUNwQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsaUJBQWlCLEVBQUU7b0JBQzVCLFNBQVMsRUFBRTt3QkFDVCxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRTt3QkFDbkUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7d0JBQzdELEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFO3dCQUMvRCxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7d0JBQ3hELEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFO3dCQUMzRCxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRTtxQkFDckU7aUJBQ0YsQ0FBQyxDQUFDO2FBQ0o7WUFFRCxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxnQkFBZ0IsQ0FBQztZQUU3QyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTdDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsRUFBRSxFQUFFLHdCQUF3QjtnQkFDNUIsS0FBSyxFQUFFLHFCQUFxQjtnQkFDNUIsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztTQUVKO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO2dCQUMzRCxXQUFXLEVBQUUsS0FBSztnQkFDbEIsT0FBTyxFQUFFLGdFQUFnRTthQUMxRSxDQUFDLENBQUM7U0FDSjs7Q0FFRjtBQUVELFNBQXNCLFlBQVksQ0FBQyxHQUF3Qjs7UUFFekQsSUFBSSxZQUFtQixDQUFDO1FBS3hCLElBQUcsR0FBRyxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFFN0IsTUFBTSxPQUFPLEdBQWlCO2dCQUM1QixLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0Q0FBNEMsQ0FBQztnQkFDbEUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzthQUMzRCxDQUFDO1lBRUYsWUFBWSxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUU1QzthQUFNO1lBRUwsTUFBTSxPQUFPLEdBQWlCO2dCQUM1QixLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0Q0FBNEMsQ0FBQztnQkFDbEUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUQsTUFBTSxFQUFFLElBQUk7YUFDYixDQUFDO1lBRUYsWUFBWSxHQUFHLE1BQU0sR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM5QztRQUVELElBQUEsZUFBUSxFQUFDLGdCQUFnQixZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBR3pDLElBQUcsWUFBWSxLQUFLLFNBQVM7WUFDM0IsT0FBTztRQUVULFFBQVEsQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDOUIsQ0FBQztDQUFBO0FBbENELG9DQWtDQztBQUVELFNBQXNCLFlBQVksQ0FBQyxHQUF3Qjs7UUFFekQsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLDZCQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFXLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxtQkFBWSxHQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFFeEYsSUFBQSxlQUFRLEVBQUMsZ0JBQWdCLFlBQVksRUFBRSxDQUFDLENBQUM7UUFFekMsUUFBUSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQUE7QUFSRCxvQ0FRQztBQUVELFNBQXNCLFdBQVcsQ0FBQyxHQUF3Qjs7O1FBRXhELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7UUFHckQsTUFBTSxTQUFTLEdBQW1CLGlCQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFM0csSUFBQSxlQUFRLEVBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDOztDQUNwQztBQVRELGtDQVNDO0FBRUQsU0FBZSxlQUFlLENBQUMsR0FBd0I7O1FBQ3JELE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSw2QkFBc0IsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUN2RCxNQUFNLFlBQVksR0FBVyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsbUJBQVksR0FBRSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hGLE1BQU0sR0FBRyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN2RSxJQUFBLGVBQVEsRUFBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNqQyxPQUFPLElBQUEsMkJBQWtCLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUFBO0FBRUQsU0FBZSxXQUFXLENBQUMsT0FBZTs7UUFHeEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLElBQUEsZUFBUSxFQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QixPQUFPLElBQUEsMkJBQWtCLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUFBO0FBRUQsU0FBZSxnQkFBZ0IsQ0FBQyxHQUF3QixFQUFFLElBQWtCLEVBQUUsUUFBZ0I7O1FBQzVGLE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQU8sRUFBRSxDQUFDO1FBQzlCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN4RCxNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3hDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMscUJBQXFCLENBQUMsOEJBQThCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDL0QsT0FBTztTQUNSO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBc0IsUUFBUSxDQUFDLElBQXFCLEVBQ3JCLE9BQXdCOztRQUlyRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQUE7QUFORCw0QkFNQztBQUVELFNBQWUsUUFBUSxDQUFDLEdBQXdCOztRQUM5QyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUlwQyxJQUFJLFFBQVEsQ0FBQztRQUNiLElBQUk7WUFDRixRQUFRLEdBQUcsTUFBTSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLGdCQUFPLENBQUMsQ0FBQztTQUNyRDtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsR0FBRyxDQUFDLHFCQUFxQixDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDdEYsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztZQUNuQixJQUFJLEVBQUUsVUFBVTtZQUNoQixFQUFFLEVBQUUsMkJBQTJCO1lBQy9CLE9BQU8sRUFBRSwrQ0FBK0M7U0FDekQsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxLQUFLLEdBQWlCLGVBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBTyxRQUFRLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDN0QsT0FBTyxpQkFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFO2dCQUN6RCxNQUFNLElBQUksR0FBRyxHQUFTLEVBQUU7O29CQUN0QixJQUFJO3dCQUNGLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQzt3QkFDL0UsTUFBTSxHQUFHLEdBQUcsQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDOzRCQUN2QyxDQUFDLENBQUMsTUFBQSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBTyxDQUFDLDBDQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUM7NEJBQ3hELENBQUMsQ0FBQyxTQUFTLENBQUM7d0JBRWQsTUFBTSxPQUFPLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGVBQVEsR0FBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUNoRCxPQUFPLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztxQkFDL0M7b0JBQUMsT0FBTyxHQUFHLEVBQUU7d0JBQ1osSUFBSSxHQUFHLFlBQVksaUNBQWlCLEVBQUU7NEJBQ3BDLE1BQU0sT0FBTyxHQUFHLDJEQUEyRDtrQ0FDdkUsc0VBQXNFO2tDQUN0RSx1RUFBdUU7a0NBQ3ZFLGlFQUFpRSxDQUFDOzRCQUN0RSxHQUFHLENBQUMscUJBQXFCLENBQUMsOEJBQThCLEVBQUUsT0FBTyxFQUMvRCxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDOzRCQUMxQixPQUFPLFNBQVMsQ0FBQzt5QkFDbEI7d0JBR0QsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTs0QkFDekIsR0FBRyxDQUFDLHFCQUFxQixDQUFDLHdKQUF3SixFQUFFLEdBQUcsRUFBRTtnQ0FDdkwsV0FBVyxFQUFFLEtBQUs7Z0NBQ2xCLE9BQU8sRUFBRSxRQUFROzZCQUNsQixDQUFDLENBQUM7eUJBQ0o7d0JBQ0QsT0FBTyxTQUFTLENBQUM7cUJBQ2xCO2dCQUNILENBQUMsQ0FBQSxDQUFDO2dCQUNGLE9BQU8sa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztRQUNKLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBRXJELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQztJQUNoRCxDQUFDO0NBQUE7QUFFRCxTQUFlLFdBQVcsQ0FBQyxHQUF3Qjs7UUFDakQsSUFBSSxJQUFjLENBQUM7UUFDbkIsSUFBSTtZQUNGLElBQUksR0FBRyxDQUFDLE1BQU0sZUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFBLGVBQVEsR0FBRSxDQUFDLENBQUM7aUJBQ3ZDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUM7U0FDeEU7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7Z0JBQ3pCLElBQUk7b0JBQ0YsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBQSxlQUFRLEdBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztpQkFDdEU7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7aUJBRWI7YUFDRjtpQkFBTTtnQkFDTCxHQUFHLENBQUMscUJBQXFCLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO29CQUM5RCxFQUFFLEVBQUUsc0JBQXNCO29CQUMxQixPQUFPLEVBQUUsSUFBQSxlQUFRLEdBQUU7aUJBQ3BCLENBQUMsQ0FBQzthQUNKO1lBQ0QsSUFBSSxHQUFHLEVBQUUsQ0FBQztTQUNYO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQUE7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEdBQXdCO0lBQ2pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLElBQUksR0FBb0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO0lBQzdFLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtRQUN0QixJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFDdEMsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBZSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQWdCLEVBQUUsRUFBVSxFQUFFLEVBQUU7UUFDbEYsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLHVCQUF1QixFQUFFO1lBQzdDLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6RSxNQUFNLFVBQVUsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUUsSUFBSTtnQkFDRixJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUNqQjthQUNGO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7YUFDeEU7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRWQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUN0QyxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxPQUFnQyxFQUFFLFNBQWtCO0lBQzNFLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDeEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sT0FBTyxHQUFtQixDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUM7UUFDdkQsQ0FBQyxDQUFDLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUM7UUFDekMsQ0FBQyxDQUFDLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRW5DLElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7UUFDL0IsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxNQUFNLFNBQVMsR0FBMkIsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUMxRCxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5RCxJQUFJLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksTUFBSyxTQUFTLEVBQUU7UUFDakMsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxNQUFNLElBQUksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN0RSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO0FBQ2xELENBQUM7QUFuQkQsNEJBbUJDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWdDLEVBQ2hDLFNBQWtCLEVBQ2xCLEtBQWM7O1FBQy9DLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUN0QztRQUVELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7U0FDbEY7UUFFRCxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZELElBQUk7WUFDRixJQUFJO2dCQUNGLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNoQztZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQy9FO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtRQUdELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7Q0FBQTtBQXhCRCxvQ0F3QkM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxTQUFpQjtJQUNqRCxPQUFPLGNBQUksQ0FBQyxJQUFJLENBQUMsaUJBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEVBQUUsZ0JBQU8sRUFBRSxTQUFTLEdBQUcsR0FBRyxHQUFHLHFCQUFZLENBQUMsQ0FBQztBQUM1RixDQUFDO0FBRkQsOENBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIExPX0ZJTEVfTkFNRSwgTk9USUZfSU1QT1JUX0FDVElWSVRZIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBCRzNQYWssIElNb2ROb2RlLCBJTW9kU2V0dGluZ3MsIElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgeyBMb2NrZWRTdGF0ZSB9IGZyb20gJ3ZvcnRleC1hcGkvbGliL2V4dGVuc2lvbnMvZmlsZV9iYXNlZF9sb2Fkb3JkZXIvdHlwZXMvdHlwZXMnO1xyXG5pbXBvcnQgeyBJT3Blbk9wdGlvbnMsIElTYXZlT3B0aW9ucyB9IGZyb20gJ3ZvcnRleC1hcGkvbGliL3R5cGVzL0lFeHRlbnNpb25Db250ZXh0JztcclxuXHJcbmltcG9ydCB7IERpdmluZUV4ZWNNaXNzaW5nIH0gZnJvbSAnLi9kaXZpbmVXcmFwcGVyJztcclxuaW1wb3J0IHsgY29udmVydFY2dG9WNywgZmluZE5vZGUsIGZvcmNlUmVmcmVzaCwgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZSwgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0LCBnZXRQbGF5ZXJQcm9maWxlcywgbG9nRGVidWcsIG1vZHNQYXRoLCBwcm9maWxlc1BhdGggfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IFBha0luZm9DYWNoZSwgeyBJQ2FjaGVFbnRyeSB9IGZyb20gJy4vY2FjaGUnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XHJcbiAgfVxyXG4gIFxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuXHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBMTyBmaWxlIGlzIGNyZWF0ZWQgYW5kIHJlYWR5IHRvIGJlIHdyaXR0ZW4gdG8uXHJcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0LCBwcm9maWxlSWQsIHByb3BzKTtcclxuICAvL2NvbnN0IGZpbHRlcmVkTE8gPSBsb2FkT3JkZXIuZmlsdGVyKGxvID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMocHJvcHMubW9kcz8uW2xvPy5tb2RJZF0/LnR5cGUpKSk7XHJcblxyXG4gIGxvZ0RlYnVnKCdzZXJpYWxpemUgbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XHJcblxyXG4gIC8vIFdyaXRlIHRoZSBwcmVmaXhlZCBMTyB0byBmaWxlLlxyXG4gIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxvRmlsZVBhdGgpLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxvRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGxvYWRPcmRlciksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuXHJcbiAgLy8gY2hlY2sgdGhlIHN0YXRlIGZvciBpZiB3ZSBhcmUga2VlcGluZyB0aGUgZ2FtZSBvbmUgaW4gc3luY1xyXG4gIC8vIGlmIHdlIGFyZSB3cml0aW5nIHZvcnRleCdzIGxvYWQgb3JkZXIsIHRoZW4gd2Ugd2lsbCBhbHNvIHdyaXRlIHRoZSBnYW1lcyBvbmVcclxuXHJcbiAgY29uc3QgYXV0b0V4cG9ydFRvR2FtZTpib29sZWFuID0gc3RhdGUuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddLmF1dG9FeHBvcnRMb2FkT3JkZXIgPz8gZmFsc2U7XHJcblxyXG4gIGxvZ0RlYnVnKCdzZXJpYWxpemUgYXV0b0V4cG9ydFRvR2FtZT0nLCBhdXRvRXhwb3J0VG9HYW1lKTtcclxuXHJcbiAgaWYoYXV0b0V4cG9ydFRvR2FtZSkgXHJcbiAgICBhd2FpdCBleHBvcnRUb0dhbWUoY29udGV4dC5hcGkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8dHlwZXMuTG9hZE9yZGVyPiB7XHJcbiAgXHJcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXHJcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXHJcbiAgLy8gIHRoZSBjdXJyZW50bHkgYWN0aXZlIHByb2ZpbGUsIGV0Yy5cclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIFdoeSBhcmUgd2UgZGVzZXJpYWxpemluZyB3aGVuIHRoZSBwcm9maWxlIGlzIGludmFsaWQgb3IgYmVsb25ncyB0byBhbm90aGVyIGdhbWUgP1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBcclxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS3MoY29udGV4dC5hcGkpO1xyXG5cclxuICAvLyBjcmVhdGUgaWYgbmVjZXNzYXJ5LCBidXQgbG9hZCB0aGUgbG9hZCBvcmRlciBmcm9tIGZpbGUgICAgXHJcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcclxuICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobG9GaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG5cclxuICBsZXQgbG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xyXG5cclxuICB0cnkge1xyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICBsb2FkT3JkZXIgPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG5cclxuICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdDb3JydXB0IGxvYWQgb3JkZXIgZmlsZScsIHtcclxuICAgICAgICAgIGJiY29kZTogcHJvcHMuYXBpLnRyYW5zbGF0ZSgnVGhlIGxvYWQgb3JkZXIgZmlsZSBpcyBpbiBhIGNvcnJ1cHQgc3RhdGUuIFlvdSBjYW4gdHJ5IHRvIGZpeCBpdCB5b3Vyc2VsZiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ29yIFZvcnRleCBjYW4gcmVnZW5lcmF0ZSB0aGUgZmlsZSBmb3IgeW91LCBidXQgdGhhdCBtYXkgcmVzdWx0IGluIGxvc3Mgb2YgZGF0YSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnKFdpbGwgb25seSBhZmZlY3QgbG9hZCBvcmRlciBpdGVtcyB5b3UgYWRkZWQgbWFudWFsbHksIGlmIGFueSkuJylcclxuICAgICAgICB9LCBbXHJcbiAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiByZWplY3QoZXJyKSB9LFxyXG4gICAgICAgICAgeyBsYWJlbDogJ1JlZ2VuZXJhdGUgRmlsZScsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICBsb2FkT3JkZXIgPSBbXTtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSlcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBmaWx0ZXIgb3V0IGFueSBwYWsgZmlsZXMgdGhhdCBubyBsb25nZXIgZXhpc3RcclxuICAgIGNvbnN0IGZpbHRlcmVkTG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IGxvYWRPcmRlci5maWx0ZXIoZW50cnkgPT4gcGFrcy5maW5kKHBhayA9PiBwYWsuZmlsZU5hbWUgPT09IGVudHJ5LmlkKSk7XHJcblxyXG4gICAgbG9nRGVidWcoJ2Rlc2VyaWFsaXplIGZpbHRlcmVkTG9hZE9yZGVyPScsIGZpbHRlcmVkTG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBmaWx0ZXIgb3V0IHBhayBmaWxlcyB0aGF0IGRvbid0IGhhdmUgYSBjb3JyZXNwb25kaW5nIG1vZCAod2hpY2ggbWVhbnMgVm9ydGV4IGRpZG4ndCBpbnN0YWxsIGl0L2lzbid0IGF3YXJlIG9mIGl0KVxyXG4gICAgLy9jb25zdCBwYWtzV2l0aE1vZHM6QkczUGFrW10gPSBwYWtzLmZpbHRlcihwYWsgPT4gcGFrLm1vZCAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIC8vIGdvIHRocm91Z2ggZWFjaCBwYWsgZmlsZSBpbiB0aGUgTW9kcyBmb2xkZXIuLi5cclxuICAgIGNvbnN0IHByb2Nlc3NlZFBha3MgPSBwYWtzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7ICAgICAgICAgICAgXHJcbiAgICAgIGFjYy52YWxpZC5wdXNoKGN1cnIpO1xyXG4gICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwgeyB2YWxpZDogW10sIGludmFsaWQ6IFtdIH0pO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBwcm9jZXNzZWRQYWtzPScsIHByb2Nlc3NlZFBha3MpO1xyXG5cclxuICAgIC8vIGdldCBhbnkgcGFrIGZpbGVzIHRoYXQgYXJlbid0IGluIHRoZSBmaWx0ZXJlZExvYWRPcmRlclxyXG4gICAgY29uc3QgYWRkZWRNb2RzOiBCRzNQYWtbXSA9IHByb2Nlc3NlZFBha3MudmFsaWQuZmlsdGVyKHBhayA9PiBmaWx0ZXJlZExvYWRPcmRlci5maW5kKGVudHJ5ID0+IGVudHJ5LmlkID09PSBwYWsuZmlsZU5hbWUpID09PSB1bmRlZmluZWQpO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBhZGRlZE1vZHM9JywgYWRkZWRNb2RzKTtcclxuICAgIFxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgYWRkZWQgYW55IG5ldyBtb2RzLlxyXG4gICAgLy9jb25zdCBkaWZmID0gZW5hYmxlZE1vZElkcy5maWx0ZXIoaWQgPT4gKCFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhtb2RzW2lkXT8udHlwZSkpXHJcbiAgICAvLyAgJiYgKGZpbHRlcmVkRGF0YS5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gaWQpID09PSB1bmRlZmluZWQpKTtcclxuXHJcbiAgICBsb2dEZWJ1ZygnZGVzZXJpYWxpemUgcGFrcz0nLCBwYWtzKTtcclxuXHJcblxyXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cclxuICAgIGFkZGVkTW9kcy5mb3JFYWNoKHBhayA9PiB7XHJcbiAgICAgIGZpbHRlcmVkTG9hZE9yZGVyLnB1c2goe1xyXG4gICAgICAgIGlkOiBwYWsuZmlsZU5hbWUsXHJcbiAgICAgICAgbW9kSWQ6IHBhay5tb2Q/LmlkLFxyXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsICAvLyBub3QgdXNpbmcgbG9hZCBvcmRlciBmb3IgZW5hYmxpbmcvZGlzYWJsaW5nICAgICAgXHJcbiAgICAgICAgbmFtZTogcGFrLmluZm8/Lm5hbWUgfHwgcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXHJcbiAgICAgICAgZGF0YTogcGFrLmluZm8sXHJcbiAgICAgICAgbG9ja2VkOiBwYWsuaW5mby5pc0xpc3RlZCBhcyBMb2NrZWRTdGF0ZSAgICAgICAgXHJcbiAgICAgIH0pICAgICAgXHJcbiAgICB9KTsgICAgICAgXHJcblxyXG4gICAgLy9sb2dEZWJ1ZygnZGVzZXJpYWxpemUgZmlsdGVyZWREYXRhPScsIGZpbHRlcmVkRGF0YSk7XHJcblxyXG4gICAgLy8gc29ydGVkIHNvIHRoYXQgYW55IG1vZHMgdGhhdCBhcmUgbG9ja2VkIGFwcGVhciBhdCB0aGUgdG9wXHJcbiAgICAvL2NvbnN0IHNvcnRlZEFuZEZpbHRlcmVkRGF0YSA9IFxyXG4gICAgXHJcbiAgICAvLyByZXR1cm5cclxuICAgIHJldHVybiBmaWx0ZXJlZExvYWRPcmRlci5zb3J0KChhLCBiKSA9PiAoK2IubG9ja2VkIC0gK2EubG9ja2VkKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRGcm9tQkczTU0oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBvcHRpb25zOiBJT3Blbk9wdGlvbnMgPSB7XHJcbiAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHM01NIC5qc29uIGxvYWQgb3JkZXIgZmlsZSB0byBpbXBvcnQgZnJvbScpLFxyXG4gICAgZmlsdGVyczogW3sgbmFtZTogJ0JHM01NIExvYWQgT3JkZXInLCBleHRlbnNpb25zOiBbJ2pzb24nXSB9XVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHNlbGVjdGVkUGF0aDpzdHJpbmcgPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcclxuXHJcbiAgbG9nRGVidWcoJ2ltcG9ydEZyb21CRzNNTSBzZWxlY3RlZFBhdGg9Jywgc2VsZWN0ZWRQYXRoKTtcclxuICBcclxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXHJcbiAgaWYoc2VsZWN0ZWRQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZWxlY3RlZFBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGxvYWRPcmRlcjogYW55W10gPSBKU09OLnBhcnNlKGRhdGEpO1xyXG4gICAgbG9nRGVidWcoJ2ltcG9ydEZyb21CRzNNTSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgICBjb25zdCBnZXRJbmRleCA9ICh1dWlkOiBzdHJpbmcpOiBudW1iZXIgPT4ge1xyXG4gICAgICBjb25zdCBpbmRleCA9IGxvYWRPcmRlci5maW5kSW5kZXgoZW50cnkgPT4gZW50cnkuVVVJRCAhPT0gdW5kZWZpbmVkICYmIGVudHJ5LlVVSUQgPT09IHV1aWQpO1xyXG4gICAgICByZXR1cm4gaW5kZXggIT09IC0xID8gaW5kZXggOiBJbmZpbml0eTsgLy8gSWYgVVVJRCBub3QgZm91bmQsIHB1dCBpdCBhdCB0aGUgZW5kXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gICAgY29uc3QgY3VycmVudExvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgIGNvbnN0IG5ld0xPID0gWy4uLmN1cnJlbnRMb2FkT3JkZXJdLnNvcnQoKGEsIGIpID0+IGdldEluZGV4KGEuZGF0YT8udXVpZCkgLSBnZXRJbmRleChiLmRhdGE/LnV1aWQpKTtcclxuICAgIGF3YWl0IHNlcmlhbGl6ZShjb250ZXh0LCBuZXdMTywgcHJvZmlsZUlkKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbXBvcnQgQkczTU0gbG9hZCBvcmRlciBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgZm9yY2VSZWZyZXNoKGNvbnRleHQuYXBpKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xyXG5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcblxyXG4gIGNvbnN0IG9wdGlvbnM6IElPcGVuT3B0aW9ucyA9IHtcclxuICAgIHRpdGxlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgY2hvb3NlIGEgQkczIC5sc3ggZmlsZSB0byBpbXBvcnQgZnJvbScpLFxyXG4gICAgZmlsdGVyczogW3sgbmFtZTogJ0JHMyBMb2FkIE9yZGVyJywgZXh0ZW5zaW9uczogWydsc3gnXSB9XVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHNlbGVjdGVkUGF0aDpzdHJpbmcgPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcclxuXHJcbiAgbG9nRGVidWcoJ2ltcG9ydE1vZFNldHRpbmdzRmlsZSBzZWxlY3RlZFBhdGg9Jywgc2VsZWN0ZWRQYXRoKTtcclxuICBcclxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXHJcbiAgaWYoc2VsZWN0ZWRQYXRoID09PSB1bmRlZmluZWQpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIHByb2Nlc3NMc3hGaWxlKGFwaSwgc2VsZWN0ZWRQYXRoKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydE1vZFNldHRpbmdzR2FtZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XHJcblxyXG4gIGNvbnN0IGJnM1Byb2ZpbGVJZCA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBnYW1lU2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBsb2dEZWJ1ZygnaW1wb3J0TW9kU2V0dGluZ3NHYW1lIGdhbWVTZXR0aW5nc1BhdGg9JywgZ2FtZVNldHRpbmdzUGF0aCk7XHJcblxyXG4gIHByb2Nlc3NMc3hGaWxlKGFwaSwgZ2FtZVNldHRpbmdzUGF0aCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrSWZEdXBsaWNhdGVFeGlzdHMoYXJyKSB7XHJcbiAgcmV0dXJuIG5ldyBTZXQoYXJyKS5zaXplICE9PSBhcnIubGVuZ3RoXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZShub2RlOiBJTW9kTm9kZSwgbmFtZTogc3RyaW5nLCBmYWxsYmFjaz86IHN0cmluZyk6c3RyaW5nIHtcclxuICByZXR1cm4gZmluZE5vZGUobm9kZT8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2s7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NCRzNNTUZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBqc29uUGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG5cclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogTk9USUZfSU1QT1JUX0FDVElWSVRZLFxyXG4gICAgdGl0bGU6ICdJbXBvcnRpbmcgSlNPTiBGaWxlJyxcclxuICAgIG1lc3NhZ2U6IGpzb25QYXRoLFxyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gIH0pO1xyXG5cclxuICB0cnkge1xyXG5cclxuICB9IGNhdGNoIChlcnIpIHtcclxuXHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKE5PVElGX0lNUE9SVF9BQ1RJVklUWSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Tm9kZXMobHN4UGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICBjb25zdCBsc3hMb2FkT3JkZXI6IElNb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRMc3hGaWxlKGxzeFBhdGgpO1xyXG4gICAgbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIGxzeFBhdGg9JywgbHN4UGF0aCk7XHJcblxyXG4gICAgLy8gYnVpbGR1cCBvYmplY3QgZnJvbSB4bWxcclxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKGxzeExvYWRPcmRlcj8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RzTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgICBjb25zdCBtb2RzT3JkZXJOb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcblxyXG4gICAgcmV0dXJuIHsgcmVnaW9uLCByb290LCBtb2RzTm9kZSwgbW9kc09yZGVyTm9kZSB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0xzeEZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBsc3hQYXRoOnN0cmluZykgeyAgXHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuXHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6IE5PVElGX0lNUE9SVF9BQ1RJVklUWSxcclxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIExTWCBGaWxlJyxcclxuICAgIG1lc3NhZ2U6IGxzeFBhdGgsXHJcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IG1vZHNOb2RlLCBtb2RzT3JkZXJOb2RlIH0gPSBhd2FpdCBnZXROb2Rlcyhsc3hQYXRoKTtcclxuICAgIGlmICgobW9kc05vZGU/LmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGU/LmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xyXG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1hdCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xyXG4gICAgbGV0IGxvTm9kZSA9IGZvcm1hdCA9PT0gJ3Y3JyA/IG1vZHNOb2RlIDogbW9kc09yZGVyTm9kZSAhPT0gdW5kZWZpbmVkID8gbW9kc09yZGVyTm9kZSA6IG1vZHNOb2RlO1xyXG5cclxuICAgIC8vIGdldCBuaWNlIHN0cmluZyBhcnJheSwgaW4gb3JkZXIsIG9mIG1vZHMgZnJvbSB0aGUgbG9hZCBvcmRlciBzZWN0aW9uXHJcbiAgICBsZXQgdXVpZEFycmF5OnN0cmluZ1tdID0gbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUubWFwKChsb0VudHJ5KSA9PiBsb0VudHJ5LmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ1VVSUQnKSkuJC52YWx1ZSk7XHJcbiAgICBcclxuICAgIGxvZ0RlYnVnKGBwcm9jZXNzTHN4RmlsZSB1dWlkQXJyYXk9YCwgdXVpZEFycmF5KTtcclxuXHJcbiAgICAvLyBhcmUgdGhlcmUgYW55IGR1cGxpY2F0ZXM/IGlmIHNvLi4uXHJcbiAgICBpZihjaGVja0lmRHVwbGljYXRlRXhpc3RzKHV1aWRBcnJheSkpIHtcclxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgICBpZDogJ2JnMy1sb2Fkb3JkZXItaW1wb3J0ZWQtZHVwbGljYXRlJyxcclxuICAgICAgICB0aXRsZTogJ0R1cGxpY2F0ZSBFbnRyaWVzJyxcclxuICAgICAgICBtZXNzYWdlOiAnRHVwbGljYXRlIFVVSURzIGZvdW5kIGluIHRoZSBNb2RPcmRlciBzZWN0aW9uIG9mIHRoZSAubHN4IGZpbGUgYmVpbmcgaW1wb3J0ZWQuIFRoaXMgc29tZXRpbWVzIGNhbiBjYXVzZSBpc3N1ZXMgd2l0aCB0aGUgbG9hZCBvcmRlci4nLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vZGlzcGxheU1TOiAzMDAwXHJcbiAgICAgIH0pOyBcclxuICAgICAgXHJcbiAgICAgIC8vIHJlbW92ZSB0aGVzZSBkdXBsaWNhdGVzIGFmdGVyIHRoZSBmaXJzdCBvbmVcclxuICAgICAgdXVpZEFycmF5ID0gQXJyYXkuZnJvbShuZXcgU2V0KHV1aWRBcnJheSkpO1xyXG4gICAgfSAgIFxyXG5cclxuICAgIGNvbnN0IGxzeE1vZE5vZGVzOiBJTW9kTm9kZVtdID0gbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZTtcclxuXHJcbiAgICAvKlxyXG4gICAgLy8gZ2V0IG1vZHMsIGluIHRoZSBhYm92ZSBvcmRlciwgZnJvbSB0aGUgbW9kcyBzZWN0aW9uIG9mIHRoZSBmaWxlIFxyXG4gICAgY29uc3QgbHN4TW9kczpJTW9kTm9kZVtdID0gdXVpZEFycmF5Lm1hcCgodXVpZCkgPT4ge1xyXG4gICAgICByZXR1cm4gbHN4TW9kTm9kZXMuZmluZChtb2ROb2RlID0+IG1vZE5vZGUuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnVVVJRCcpICYmIChhdHRyLiQudmFsdWUgPT09IHV1aWQpKSk7XHJcbiAgICB9KTsqL1xyXG5cclxuICAgIGxvZ0RlYnVnKGBwcm9jZXNzTHN4RmlsZSBsc3hNb2ROb2Rlcz1gLCBsc3hNb2ROb2Rlcyk7XHJcblxyXG4gICAgLy8gd2Ugbm93IGhhdmUgYWxsIHRoZSBpbmZvcm1hdGlvbiBmcm9tIGZpbGUgdGhhdCB3ZSBuZWVkXHJcblxyXG4gICAgLy8gbGV0cyBnZXQgYWxsIHBha3MgZnJvbSB0aGUgZm9sZGVyXHJcbiAgICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS3MoYXBpKTtcclxuXHJcbiAgICAvLyBhcmUgdGhlcmUgYW55IHBhayBmaWxlcyBub3QgaW4gdGhlIGxzeCBmaWxlP1xyXG4gICAgY29uc3QgbWlzc2luZyA9IHBha3MucmVkdWNlKChhY2MsIGN1cnIpID0+IHsgIFxyXG5cclxuICAgICAgLy8gaWYgY3VycmVudCBwYWsgaGFzIG5vIGFzc29jaWF0ZWQgcGFrLCB0aGVuIHdlIHNraXAuIHdlIGRlZmludGVseSBhcmVuJ3QgYWRkaW5nIHRoaXMgcGFrIGlmIHZvcnRleCBoYXNuJ3QgbWFuYWdlZCBpdC5cclxuICAgICAgaWYoY3Vyci5tb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBhY2M7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGlmIGN1cnJlbnQgcGFrLCB3aGljaCB2b3J0ZXggaGFzIGRlZmluYXRlbHkgbWFuYWdlZCwgaXNuJ3QgYWxyZWFkeSBpbiB0aGUgbHN4IGZpbGUsIHRoZW4gdGhpcyBpcyBtaXNzaW5nIGFuZCB3ZSBuZWVkIHRvIGxvYWQgb3JkZXJcclxuICAgICAgaWYobHN4TW9kTm9kZXMuZmluZChsc3hFbnRyeSA9PiBsc3hFbnRyeS5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gY3Vyci5pbmZvLm5hbWUpKSkgPT09IHVuZGVmaW5lZCkgXHJcbiAgICAgICAgYWNjLnB1c2goY3Vycik7XHJcblxyXG4gICAgICAvLyBza2lwIHRoaXMgXHJcbiAgICAgIHJldHVybiBhY2M7XHJcbiAgICB9LCBbXSk7XHJcblxyXG4gICAgbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIC0gbWlzc2luZyBwYWsgZmlsZXMgdGhhdCBoYXZlIGFzc29jaWF0ZWQgbW9kcyA9JywgbWlzc2luZyk7XHJcblxyXG4gICAgLy8gYnVpbGQgYSBsb2FkIG9yZGVyIGZyb20gdGhlIGxzeCBmaWxlIGFuZCBhZGQgYW55IG1pc3NpbmcgcGFrcyBhdCB0aGUgZW5kP1xyXG5cclxuICAgIC8vbGV0IG5ld0xvYWRPcmRlcjogdHlwZXMuSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcclxuXHJcbiAgICAvLyBsb29wIHRocm91Z2ggbHN4IG1vZCBub2RlcyBhbmQgZmluZCB0aGUgcGFrIHRoZXkgYXJlIGFzc29jaWF0ZWQgd2l0aFxyXG5cclxuICAgIGxldCBuZXdMb2FkT3JkZXI6IHR5cGVzLklMb2FkT3JkZXJFbnRyeVtdID0gbHN4TW9kTm9kZXMucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcclxuICAgICAgXHJcbiAgICAgIC8vIGZpbmQgdGhlIGJnM1BhayB0aGlzIGlzIHJlZmVyaW5nIHRvbyBhcyBpdCdzIGVhc2llciB0byBnZXQgYWxsIHRoZSBpbmZvcm1hdGlvblxyXG4gICAgICBjb25zdCBwYWsgPSBwYWtzLmZpbmQoKHBhaykgPT4gcGFrLmluZm8ubmFtZSA9PT0gY3Vyci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykpLiQudmFsdWUpO1xyXG5cclxuICAgICAgLy8gaWYgdGhlIHBhayBpcyBmb3VuZCwgdGhlbiB3ZSBhZGQgYSBsb2FkIG9yZGVyIGVudHJ5LiBpZiBpdCBpc24ndCwgdGhlbiBpdHMgcHJvYiBiZWVuIGRlbGV0ZWQgaW4gdm9ydGV4IGFuZCBsc3ggaGFzIGFuIGV4dHJhIGVudHJ5XHJcbiAgICAgIGlmIChwYWsgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGFjYy5wdXNoKHtcclxuICAgICAgICAgIGlkOiBwYWsuZmlsZU5hbWUsXHJcbiAgICAgICAgICBtb2RJZDogcGFrPy5tb2Q/LmlkLFxyXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSwgICAgICAgIFxyXG4gICAgICAgICAgbmFtZTogcGFrLmluZm8/Lm5hbWUgfHwgcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXHJcbiAgICAgICAgICBkYXRhOiBwYWsuaW5mbyxcclxuICAgICAgICAgIGxvY2tlZDogcGFrLmluZm8uaXNMaXN0ZWQgYXMgTG9ja2VkU3RhdGUgICAgICAgIFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwgW10pOyAgIFxyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAoYmVmb3JlIGFkZGluZyBtaXNzaW5nKSBuZXdMb2FkT3JkZXI9JywgbmV3TG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBBZGQgYW55IG5ld2x5IGFkZGVkIG1vZHMgdG8gdGhlIGJvdHRvbSBvZiB0aGUgbG9hZE9yZGVyLlxyXG4gICAgbWlzc2luZy5mb3JFYWNoKHBhayA9PiB7XHJcbiAgICAgIG5ld0xvYWRPcmRlci5wdXNoKHtcclxuICAgICAgICBpZDogcGFrLmZpbGVOYW1lLFxyXG4gICAgICAgIG1vZElkOiAgcGFrPy5tb2Q/LmlkLFxyXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsICAgICAgICBcclxuICAgICAgICBuYW1lOiBwYWsuaW5mbz8ubmFtZSB8fCBwYXRoLmJhc2VuYW1lKHBhay5maWxlTmFtZSwgJy5wYWsnKSxcclxuICAgICAgICBkYXRhOiBwYWsuaW5mbyxcclxuICAgICAgICBsb2NrZWQ6IHBhay5pbmZvLmlzTGlzdGVkIGFzIExvY2tlZFN0YXRlICAgICAgICBcclxuICAgICAgfSkgICAgICBcclxuICAgIH0pOyAgIFxyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAoYWZ0ZXIgYWRkaW5nIG1pc3NpbmcpIG5ld0xvYWRPcmRlcj0nLCBuZXdMb2FkT3JkZXIpO1xyXG5cclxuICAgIG5ld0xvYWRPcmRlci5zb3J0KChhLCBiKSA9PiAoK2IubG9ja2VkIC0gK2EubG9ja2VkKSk7XHJcblxyXG4gICAgbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIChhZnRlciBzb3J0aW5nKSBuZXdMb2FkT3JkZXI9JywgbmV3TG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBnZXQgbG9hZCBvcmRlclxyXG4gICAgLy9sZXQgbG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgIC8vbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xyXG5cclxuICAgIC8vIG1hbnVhbHkgc2V0IGxvYWQgb3JkZXI/XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBuZXdMb2FkT3JkZXIpKTtcclxuXHJcbiAgICAvL3V0aWwuc2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIG5ld0xvYWRPcmRlcik7XHJcblxyXG4gICAgLy8gZ2V0IGxvYWQgb3JkZXIgYWdhaW4/XHJcbiAgICAvL2xvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgIC8vbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xyXG5cclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtbG9hZG9yZGVyLWltcG9ydC1hY3Rpdml0eScpO1xyXG5cclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgICBpZDogJ2JnMy1sb2Fkb3JkZXItaW1wb3J0ZWQnLFxyXG4gICAgICB0aXRsZTogJ0xvYWQgT3JkZXIgSW1wb3J0ZWQnLFxyXG4gICAgICBtZXNzYWdlOiBsc3hQYXRoLFxyXG4gICAgICBkaXNwbGF5TVM6IDMwMDBcclxuICAgIH0pO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBmaW5pc2hlZCcpO1xyXG5cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIFxyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oTk9USUZfSU1QT1JUX0FDVElWSVRZKTtcclxuXHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHBvcnRUbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVwYXRoOiBzdHJpbmcpIHtcclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG5cclxuICAvLyBnZXQgbG9hZCBvcmRlciBmcm9tIHN0YXRlXHJcbiAgY29uc3QgbG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuXHJcbiAgbG9nRGVidWcoJ2V4cG9ydFRvIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xyXG5cclxuICB0cnkge1xyXG4gICAgLy8gcmVhZCB0aGUgZ2FtZSBiZzMgbW9kc2V0dGluZ3MubHN4IHNvIHRoYXQgd2UgZ2V0IHRoZSBkZWZhdWx0IGdhbWUgZ3VzdGF2IHRoaW5nP1xyXG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcclxuXHJcbiAgICAvLyBidWlsZHVwIG9iamVjdCBmcm9tIHhtbFxyXG4gICAgY29uc3QgcmVnaW9uID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgICBjb25zdCByb290ID0gZmluZE5vZGUocmVnaW9uPy5ub2RlLCAncm9vdCcpO1xyXG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xyXG4gICAgXHJcbiAgICBpZiAoKG1vZHNOb2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XHJcbiAgICAgIG1vZHNOb2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxyXG4gICAgY29uc3QgZGVzY3JpcHRpb25Ob2RlcyA9IG1vZHNOb2RlPy5jaGlsZHJlbj8uWzBdPy5ub2RlPy5maWx0ZXI/LihpdGVyID0+XHJcbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09ICdHdXN0YXZEZXYnKSkpID8/IFtdO1xyXG5cclxuICAgIGNvbnN0IGZpbHRlcmVkUGFrcyA9IGxvYWRPcmRlci5maWx0ZXIoZW50cnkgPT4gISFlbnRyeS5kYXRhPy51dWlkXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgZW50cnkuZW5hYmxlZFxyXG4gICAgICAgICAgICAgICAgICAgICYmICFlbnRyeS5kYXRhPy5pc0xpc3RlZCk7XHJcblxyXG4gICAgbG9nRGVidWcoJ2V4cG9ydFRvIGZpbHRlcmVkUGFrcz0nLCBmaWx0ZXJlZFBha3MpO1xyXG5cclxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZmlsdGVyZWRQYWtzKSB7XHJcbiAgICAgIC8vIGNvbnN0IG1kNSA9IGF3YWl0IHV0aWwuZmlsZU1ENShwYXRoLmpvaW4obW9kc1BhdGgoKSwga2V5KSk7XHJcblxyXG4gICAgICAvKlxyXG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJGb2xkZXJcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIkNsYXNzQWRkaXRpb25zX2M0ZmMzZGMwLTMyMjItY2YzYi01OGNkLWNjY2U4Y2U0YzhmNVwiLz5cclxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiTUQ1XCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJkNjc4YWViNTRjNmMxNDk2YzBlYWU3MWNlMDMzZTlmYlwiLz5cclxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiTmFtZVwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiSWxvbmlhcyBDaGFuZ2VzXCIvPlxyXG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJQdWJsaXNoSGFuZGxlXCIgdHlwZT1cInVpbnQ2NFwiIHZhbHVlPVwiNDMyNTI4NVwiLz5cclxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiVVVJRFwiIHR5cGU9XCJndWlkXCIgdmFsdWU9XCJjNGZjM2RjMC0zMjIyLWNmM2ItNThjZC1jY2NlOGNlNGM4ZjVcIi8+XHJcbiAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlZlcnNpb242NFwiIHR5cGU9XCJpbnQ2NFwiIHZhbHVlPVwiMzYwMjg3OTcwMTg5NjM5NzBcIi8+XHJcbiAgICAgICovXHJcblxyXG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xyXG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXHJcbiAgICAgICAgYXR0cmlidXRlOiBbXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdGb2xkZXInLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5mb2xkZXIgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTUQ1JywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6IGVudHJ5LmRhdGEubWQ1IH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ05hbWUnLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5uYW1lIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1B1Ymxpc2hIYW5kbGUnLCB0eXBlOiAndWludDY0JywgdmFsdWU6IDAgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdndWlkJywgdmFsdWU6IGVudHJ5LmRhdGEudXVpZCB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdWZXJzaW9uNjQnLCB0eXBlOiAnaW50NjQnLCB2YWx1ZTogZW50cnkuZGF0YS52ZXJzaW9uIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBtb2RzTm9kZS5jaGlsZHJlblswXS5ub2RlID0gZGVzY3JpcHRpb25Ob2RlcztcclxuXHJcbiAgICB3cml0ZU1vZFNldHRpbmdzKGFwaSwgbW9kU2V0dGluZ3MsIGZpbGVwYXRoKTtcclxuICAgIFxyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICAgIGlkOiAnYmczLWxvYWRvcmRlci1leHBvcnRlZCcsXHJcbiAgICAgIHRpdGxlOiAnTG9hZCBPcmRlciBFeHBvcnRlZCcsXHJcbiAgICAgIG1lc3NhZ2U6IGZpbGVwYXRoLFxyXG4gICAgICBkaXNwbGF5TVM6IDMwMDBcclxuICAgIH0pO1xyXG5cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgY3JlYXRlIGEgcHJvZmlsZSBpbi1nYW1lJyxcclxuICAgIH0pO1xyXG4gIH0gIFxyXG5cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydFRvRmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XHJcblxyXG4gIGxldCBzZWxlY3RlZFBhdGg6c3RyaW5nO1xyXG5cclxuICAvLyBhbiBvbGRlciB2ZXJzaW9uIG9mIFZvcnRleCBtaWdodCBub3QgaGF2ZSB0aGUgdXBkYXRlZCBhcGkuc2F2ZUZpbGUgZnVuY3Rpb24gc28gd2lsbCBmYWxsYmFja1xyXG4gIC8vIHRvIHRoZSBwcmV2aW91cyBoYWNrIGpvYiBvZiBzZWxlY3RGaWxlIGJ1dCBhY3R1YWxseSB3cml0ZXNcclxuICBcclxuICBpZihhcGkuc2F2ZUZpbGUgIT09IHVuZGVmaW5lZCkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnM6IElTYXZlT3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IGFwaS50cmFuc2xhdGUoJ1BsZWFzZSBjaG9vc2UgYSBCRzMgLmxzeCBmaWxlIHRvIGV4cG9ydCB0bycpLFxyXG4gICAgICBmaWx0ZXJzOiBbeyBuYW1lOiAnQkczIExvYWQgT3JkZXInLCBleHRlbnNpb25zOiBbJ2xzeCddIH1dLCAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBzZWxlY3RlZFBhdGggPSBhd2FpdCBhcGkuc2F2ZUZpbGUob3B0aW9ucyk7ICAgIFxyXG5cclxuICB9IGVsc2Uge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnM6IElPcGVuT3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IGFwaS50cmFuc2xhdGUoJ1BsZWFzZSBjaG9vc2UgYSBCRzMgLmxzeCBmaWxlIHRvIGV4cG9ydCB0bycpLFxyXG4gICAgICBmaWx0ZXJzOiBbeyBuYW1lOiAnQkczIExvYWQgT3JkZXInLCBleHRlbnNpb25zOiBbJ2xzeCddIH1dLFxyXG4gICAgICBjcmVhdGU6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgc2VsZWN0ZWRQYXRoID0gYXdhaXQgYXBpLnNlbGVjdEZpbGUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBsb2dEZWJ1ZyhgZXhwb3J0VG9GaWxlICR7c2VsZWN0ZWRQYXRofWApO1xyXG5cclxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXHJcbiAgaWYoc2VsZWN0ZWRQYXRoID09PSB1bmRlZmluZWQpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIGV4cG9ydFRvKGFwaSwgc2VsZWN0ZWRQYXRoKTtcclxufVxyXG4gIFxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG9HYW1lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcclxuXHJcbiAgY29uc3QgYmczUHJvZmlsZUlkID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xyXG4gIGNvbnN0IHNldHRpbmdzUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNQcm9maWxlSWQsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuXHJcbiAgbG9nRGVidWcoYGV4cG9ydFRvR2FtZSAke3NldHRpbmdzUGF0aH1gKTtcclxuXHJcbiAgZXhwb3J0VG8oYXBpLCBzZXR0aW5nc1BhdGgpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVlcFJlZnJlc2goYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xyXG5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcblxyXG4gIC8vIGdldCBsb2FkIG9yZGVyIGZyb20gc3RhdGVcclxuICBjb25zdCBsb2FkT3JkZXI6dHlwZXMuTG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xyXG5cclxuICBsb2dEZWJ1ZygnZGVlcFJlZnJlc2gnLCBsb2FkT3JkZXIpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcclxuICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3Qgc2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2V0dGluZ3NQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgbG9nRGVidWcoJ3JlYWRNb2RTZXR0aW5ncycsIGRhdCk7XHJcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkTHN4RmlsZShsc3hQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIFxyXG4gIC8vY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobHN4UGF0aCk7XHJcbiAgbG9nRGVidWcoJ2xzeFBhdGgnLCBkYXQpO1xyXG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gd3JpdGVNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRhdGE6IElNb2RTZXR0aW5ncywgZmlsZXBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGZpbGVwYXRoKSk7XHJcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhmaWxlcGF0aCwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2Qgc2V0dGluZ3MnLCBlcnIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IHR5cGVzLkxvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8YW55PiB7XHJcbiAgLy8gTm90aGluZyB0byB2YWxpZGF0ZSByZWFsbHkgLSB0aGUgZ2FtZSBkb2VzIG5vdCByZWFkIG91ciBsb2FkIG9yZGVyIGZpbGVcclxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcclxuICAvLyAgcmV0dXJuLlxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRQQUtzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgOiBQcm9taXNlPEFycmF5PElDYWNoZUVudHJ5Pj4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbHNMaWIgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xyXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS0xpc3QoYXBpKTtcclxuXHJcbiAgLy8gbG9nRGVidWcoJ3Bha3MnLCBwYWtzKTtcclxuXHJcbiAgbGV0IG1hbmlmZXN0O1xyXG4gIHRyeSB7XHJcbiAgICBtYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCAnJywgR0FNRV9JRCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgZGVwbG95bWVudCBtYW5pZmVzdCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIGlkOiAnYmczLXJlYWRpbmctcGFrcy1hY3Rpdml0eScsXHJcbiAgICBtZXNzYWdlOiAnUmVhZGluZyBQQUsgZmlsZXMuIFRoaXMgbWlnaHQgdGFrZSBhIHdoaWxlLi4uJyxcclxuICB9KVxyXG4gIGNvbnN0IGNhY2hlOiBQYWtJbmZvQ2FjaGUgPSBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoYXBpKTtcclxuICBjb25zdCByZXMgPSBhd2FpdCBQcm9taXNlLmFsbChwYWtzLm1hcChhc3luYyAoZmlsZU5hbWUsIGlkeCkgPT4ge1xyXG4gICAgcmV0dXJuIHV0aWwud2l0aEVycm9yQ29udGV4dCgncmVhZGluZyBwYWsnLCBmaWxlTmFtZSwgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmdW5jID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBtYW5pZmVzdEVudHJ5ID0gbWFuaWZlc3QuZmlsZXMuZmluZChlbnRyeSA9PiBlbnRyeS5yZWxQYXRoID09PSBmaWxlTmFtZSk7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSAobWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXT8uW21hbmlmZXN0RW50cnkuc291cmNlXVxyXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICBjb25zdCBwYWtQYXRoID0gcGF0aC5qb2luKG1vZHNQYXRoKCksIGZpbGVOYW1lKTtcclxuICAgICAgICAgIHJldHVybiBjYWNoZS5nZXRDYWNoZUVudHJ5KGFwaSwgcGFrUGF0aCwgbW9kKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEaXZpbmVFeGVjTWlzc2luZykge1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gJ1RoZSBpbnN0YWxsZWQgY29weSBvZiBMU0xpYi9EaXZpbmUgaXMgY29ycnVwdGVkIC0gcGxlYXNlICdcclxuICAgICAgICAgICAgICArICdkZWxldGUgdGhlIGV4aXN0aW5nIExTTGliIG1vZCBlbnRyeSBhbmQgcmUtaW5zdGFsbCBpdC4gTWFrZSBzdXJlIHRvICdcclxuICAgICAgICAgICAgICArICdkaXNhYmxlIG9yIGFkZCBhbnkgbmVjZXNzYXJ5IGV4Y2VwdGlvbnMgdG8geW91ciBzZWN1cml0eSBzb2Z0d2FyZSB0byAnXHJcbiAgICAgICAgICAgICAgKyAnZW5zdXJlIGl0IGRvZXMgbm90IGludGVyZmVyZSB3aXRoIFZvcnRleC9MU0xpYiBmaWxlIG9wZXJhdGlvbnMuJztcclxuICAgICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRGl2aW5lIGV4ZWN1dGFibGUgaXMgbWlzc2luZycsIG1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBjb3VsZCBoYXBwZW4gaWYgdGhlIGZpbGUgZ290IGRlbGV0ZWQgc2luY2UgcmVhZGluZyB0aGUgbGlzdCBvZiBwYWtzLlxyXG4gICAgICAgICAgLy8gYWN0dWFsbHksIHRoaXMgc2VlbXMgdG8gYmUgZmFpcmx5IGNvbW1vbiB3aGVuIHVwZGF0aW5nIGEgbW9kXHJcbiAgICAgICAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhay4gUGxlYXNlIG1ha2Ugc3VyZSB5b3UgYXJlIHVzaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBMU0xpYiBieSB1c2luZyB0aGUgXCJSZS1pbnN0YWxsIExTTGliL0RpdmluZVwiIHRvb2xiYXIgYnV0dG9uIG9uIHRoZSBNb2RzIHBhZ2UuJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGZpbGVOYW1lLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKCkpO1xyXG4gICAgfSk7XHJcbiAgfSkpO1xyXG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtcmVhZGluZy1wYWtzLWFjdGl2aXR5Jyk7XHJcblxyXG4gIHJldHVybiByZXMuZmlsdGVyKGl0ZXIgPT4gaXRlciAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS0xpc3QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xyXG4gIHRyeSB7XHJcbiAgICBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCgpLCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIG5vcFxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzIGRpcmVjdG9yeScsIGVyciwge1xyXG4gICAgICAgIGlkOiAnYmczLWZhaWxlZC1yZWFkLW1vZHMnLFxyXG4gICAgICAgIG1lc3NhZ2U6IG1vZHNQYXRoKCksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcGFrcyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBha3M7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExhdGVzdExTTGliTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXTtcclxuICBpZiAobW9kcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBsYXRlc3RWZXIgPSB1dGlsLmdldFNhZmUocHJldiwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmIChzZW12ZXIuZ3QoY3VycmVudFZlciwgbGF0ZXN0VmVyKSkge1xyXG4gICAgICAgICAgcHJldiA9IG1vZHNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgbW9kIHZlcnNpb24nLCB7IG1vZElkOiBpZCwgdmVyc2lvbjogY3VycmVudFZlciB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGxzTGliO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuUHJvcHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZD86IHN0cmluZyk6IElQcm9wcyB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IChwcm9maWxlSWQgIT09IHVuZGVmaW5lZClcclxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXHJcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuXHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICByZXR1cm4geyBhcGksIHN0YXRlLCBwcm9maWxlLCBtb2RzLCBkaXNjb3ZlcnkgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUxPRmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgfVxyXG5cclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0YXJnZXRQYXRoID0gbG9hZE9yZGVyRmlsZVBhdGgocHJvcHMucHJvZmlsZS5pZCk7XHJcbiAgdHJ5IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyh0YXJnZXRQYXRoKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH0gICAgXHJcbiAgXHJcbiAgXHJcbiAgcmV0dXJuIHRhcmdldFBhdGg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkT3JkZXJGaWxlUGF0aChwcm9maWxlSWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ3VzZXJEYXRhJyksIEdBTUVfSUQsIHByb2ZpbGVJZCArICdfJyArIExPX0ZJTEVfTkFNRSk7XHJcbn1cclxuXHJcbiJdfQ==