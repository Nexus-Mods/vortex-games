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
exports.loadOrderFilePath = exports.ensureLOFile = exports.genProps = exports.validate = exports.deepRefresh = exports.exportToGame = exports.exportToFile = exports.importModSettingsGame = exports.importModSettingsFile = exports.importFromBG3MM = exports.deserialize = exports.serialize = void 0;
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
        (0, vortex_api_1.log)('info', 'serialize loadOrder=', loadOrder);
        yield vortex_api_1.fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
        yield vortex_api_1.fs.writeFileAsync(loFilePath, JSON.stringify(loadOrder), { encoding: 'utf8' });
        const autoExportToGame = (_a = state.settings['baldursgate3'].autoExportLoadOrder) !== null && _a !== void 0 ? _a : false;
        (0, vortex_api_1.log)('info', 'serialize autoExportToGame=', autoExportToGame);
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
            (0, vortex_api_1.log)('info', 'deserialize loadOrder=', loadOrder);
            const filteredLoadOrder = loadOrder.filter(entry => paks.find(pak => pak.fileName === entry.id));
            (0, vortex_api_1.log)('info', 'deserialize filteredLoadOrder=', filteredLoadOrder);
            const processedPaks = paks.reduce((acc, curr) => {
                if (curr.mod === undefined) {
                    acc.invalid.push(curr);
                    return acc;
                }
                acc.valid.push(curr);
                return acc;
            }, { valid: [], invalid: [] });
            (0, vortex_api_1.log)('info', 'deserialize processedPaks=', processedPaks);
            const addedMods = processedPaks.valid.filter(pak => filteredLoadOrder.find(entry => entry.id === pak.fileName) === undefined);
            (0, vortex_api_1.log)('info', 'deserialize addedMods=', addedMods);
            (0, vortex_api_1.log)('info', 'deserialize paks=', paks);
            addedMods.forEach(pak => {
                var _a;
                filteredLoadOrder.push({
                    id: pak.fileName,
                    modId: (_a = pak.mod) === null || _a === void 0 ? void 0 : _a.id,
                    enabled: true,
                    name: path_1.default.basename(pak.fileName, '.pak'),
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
        (0, vortex_api_1.log)('info', 'importFromBG3MM selectedPath=', selectedPath);
        if (selectedPath === undefined) {
            return;
        }
        try {
            const data = yield vortex_api_1.fs.readFileAsync(selectedPath, { encoding: 'utf8' });
            const loadOrder = JSON.parse(data);
            (0, vortex_api_1.log)('info', 'importFromBG3MM loadOrder=', loadOrder);
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
        (0, vortex_api_1.log)('info', 'importModSettingsFile selectedPath=', selectedPath);
        if (selectedPath === undefined)
            return;
        processLsxFile(api, selectedPath);
    });
}
exports.importModSettingsFile = importModSettingsFile;
function importModSettingsGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameSettingsPath = path_1.default.join((0, util_1.profilesPath)(), 'Public', 'modsettings.lsx');
        (0, vortex_api_1.log)('info', 'importModSettingsGame gameSettingsPath=', gameSettingsPath);
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
function processLsxFile(api, lsxPath) {
    var _a, _b, _c, _d;
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
            const lsxLoadOrder = yield readLsxFile(lsxPath);
            (0, vortex_api_1.log)('info', 'processLsxFile lsxPath=', lsxPath);
            const region = (0, util_1.findNode)((_b = lsxLoadOrder === null || lsxLoadOrder === void 0 ? void 0 : lsxLoadOrder.save) === null || _b === void 0 ? void 0 : _b.region, 'ModuleSettings');
            const root = (0, util_1.findNode)(region === null || region === void 0 ? void 0 : region.node, 'root');
            const modsNode = (0, util_1.findNode)((_d = (_c = root === null || root === void 0 ? void 0 : root.children) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.node, 'Mods');
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            const lsxModNodes = modsNode.children[0].node;
            (0, vortex_api_1.log)('info', `processLsxFile lsxModNodes=`, lsxModNodes);
            const paks = yield readPAKs(api);
            const missing = paks.reduce((acc, curr) => {
                if (curr.mod === undefined) {
                    return acc;
                }
                if (lsxModNodes.find(lsxEntry => lsxEntry.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === curr.info.name))) === undefined)
                    acc.push(curr);
                return acc;
            }, []);
            (0, vortex_api_1.log)('info', 'processLsxFile - missing pak files that have associated mods =', missing);
            let newLoadOrder = lsxModNodes.reduce((acc, curr) => {
                var _a;
                const pak = paks.find((pak) => pak.info.name === curr.attribute.find(attr => (attr.$.id === 'Name')).$.value);
                if (pak !== undefined) {
                    acc.push({
                        id: pak.fileName,
                        modId: (_a = pak === null || pak === void 0 ? void 0 : pak.mod) === null || _a === void 0 ? void 0 : _a.id,
                        enabled: true,
                        name: path_1.default.basename(pak.fileName, '.pak'),
                        data: pak.info,
                        locked: pak.info.isListed
                    });
                }
                return acc;
            }, []);
            (0, vortex_api_1.log)('info', 'processLsxFile (before adding missing) newLoadOrder=', newLoadOrder);
            missing.forEach(pak => {
                var _a;
                newLoadOrder.push({
                    id: pak.fileName,
                    modId: (_a = pak === null || pak === void 0 ? void 0 : pak.mod) === null || _a === void 0 ? void 0 : _a.id,
                    enabled: true,
                    name: path_1.default.basename(pak.fileName, '.pak'),
                    data: pak.info,
                    locked: pak.info.isListed
                });
            });
            (0, vortex_api_1.log)('info', 'processLsxFile (after adding missing) newLoadOrder=', newLoadOrder);
            newLoadOrder.sort((a, b) => (+b.locked - +a.locked));
            (0, vortex_api_1.log)('info', 'processLsxFile (after sorting) newLoadOrder=', newLoadOrder);
            api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLoadOrder));
            api.dismissNotification('bg3-loadorder-import-activity');
            api.sendNotification({
                type: 'success',
                id: 'bg3-loadorder-imported',
                title: 'Load Order Imported',
                message: lsxPath,
                displayMS: 3000
            });
            (0, vortex_api_1.log)('info', 'processLsxFile finished');
        }
        catch (err) {
            api.dismissNotification(common_1.NOTIF_IMPORT_ACTIVITY);
            api.showErrorNotification('Failed to import load order', err, {
                allowReport: false
            });
        }
    });
}
function exportTo(api, filepath) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
        (0, vortex_api_1.log)('info', 'exportTo loadOrder=', loadOrder);
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
            (0, vortex_api_1.log)('info', 'exportTo filteredPaks=', filteredPaks);
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
            const loadOrderNodes = filteredPaks
                .map((entry) => ({
                $: { id: 'Module' },
                attribute: [
                    { $: { id: 'UUID', type: 'FixedString', value: entry.data.uuid } },
                ],
            }));
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
        (0, vortex_api_1.log)('info', `exportToFile ${selectedPath}`);
        if (selectedPath === undefined)
            return;
        exportTo(api, selectedPath);
    });
}
exports.exportToFile = exportToFile;
function exportToGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), 'Public', 'modsettings.lsx');
        (0, vortex_api_1.log)('info', `exportToGame ${settingsPath}`);
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
        (0, vortex_api_1.log)('info', 'deepRefresh', loadOrder);
    });
}
exports.deepRefresh = deepRefresh;
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), 'Public', 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
        (0, vortex_api_1.log)('info', 'readModSettings', dat);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function readLsxFile(lsxPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const dat = yield vortex_api_1.fs.readFileAsync(lsxPath);
        (0, vortex_api_1.log)('info', 'lsxPath', dat);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQXNFO0FBQ3RFLGdEQUF3QjtBQUN4QiwrQ0FBaUM7QUFDakMsd0RBQWdDO0FBRWhDLHFDQUF3RTtBQUV4RSxtQ0FBcUQ7QUFJckQsbURBQW9EO0FBQ3BELGlDQUFrRjtBQUVsRixvREFBb0Q7QUFFcEQsU0FBc0IsU0FBUyxDQUFDLE9BQWdDLEVBQ2hDLFNBQTBCLEVBQzFCLFNBQWtCOzs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUdyQyxNQUFNLFVBQVUsR0FBRyxNQUFNLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBR2pFLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsc0JBQXNCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFHL0MsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNwRixNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUty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RyxDQUFDLENBQUM7U0FDNUI7UUFHRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0NBQUE7QUF4QkQsb0NBd0JDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsU0FBaUI7SUFDakQsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFLGdCQUFPLEVBQUUsU0FBUyxHQUFHLEdBQUcsR0FBRyxxQkFBWSxDQUFDLENBQUM7QUFDNUYsQ0FBQztBQUZELDhDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBMT19GSUxFX05BTUUsIE5PVElGX0lNUE9SVF9BQ1RJVklUWSB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IEJHM1BhaywgSU1vZE5vZGUsIElNb2RTZXR0aW5ncywgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuaW1wb3J0IHsgTG9ja2VkU3RhdGUgfSBmcm9tICd2b3J0ZXgtYXBpL2xpYi9leHRlbnNpb25zL2ZpbGVfYmFzZWRfbG9hZG9yZGVyL3R5cGVzL3R5cGVzJztcbmltcG9ydCB7IElPcGVuT3B0aW9ucywgSVNhdmVPcHRpb25zIH0gZnJvbSAndm9ydGV4LWFwaS9saWIvdHlwZXMvSUV4dGVuc2lvbkNvbnRleHQnO1xuXG5pbXBvcnQgeyBEaXZpbmVFeGVjTWlzc2luZyB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XG5pbXBvcnQgeyBmaW5kTm9kZSwgZm9yY2VSZWZyZXNoLCBsb2dEZWJ1ZywgbW9kc1BhdGgsIHByb2ZpbGVzUGF0aCB9IGZyb20gJy4vdXRpbCc7XG5cbmltcG9ydCBQYWtJbmZvQ2FjaGUsIHsgSUNhY2hlRW50cnkgfSBmcm9tICcuL2NhY2hlJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnaW52YWxpZCBwcm9wcycpKTtcbiAgfVxuICBcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGUgTE8gZmlsZSBpcyBjcmVhdGVkIGFuZCByZWFkeSB0byBiZSB3cml0dGVuIHRvLlxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQsIHByb2ZpbGVJZCwgcHJvcHMpO1xuICAvL2NvbnN0IGZpbHRlcmVkTE8gPSBsb2FkT3JkZXIuZmlsdGVyKGxvID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMocHJvcHMubW9kcz8uW2xvPy5tb2RJZF0/LnR5cGUpKSk7XG5cbiAgbG9nKCdpbmZvJywgJ3NlcmlhbGl6ZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcblxuICAvLyBXcml0ZSB0aGUgcHJlZml4ZWQgTE8gdG8gZmlsZS5cbiAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobG9GaWxlUGF0aCkuY2F0Y2goeyBjb2RlOiAnRU5PRU5UJyB9LCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSk7XG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxvRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGxvYWRPcmRlciksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxuICAvLyBjaGVjayB0aGUgc3RhdGUgZm9yIGlmIHdlIGFyZSBrZWVwaW5nIHRoZSBnYW1lIG9uZSBpbiBzeW5jXG4gIC8vIGlmIHdlIGFyZSB3cml0aW5nIHZvcnRleCdzIGxvYWQgb3JkZXIsIHRoZW4gd2Ugd2lsbCBhbHNvIHdyaXRlIHRoZSBnYW1lcyBvbmVcblxuICBjb25zdCBhdXRvRXhwb3J0VG9HYW1lOmJvb2xlYW4gPSBzdGF0ZS5zZXR0aW5nc1snYmFsZHVyc2dhdGUzJ10uYXV0b0V4cG9ydExvYWRPcmRlciA/PyBmYWxzZTtcblxuICBsb2coJ2luZm8nLCAnc2VyaWFsaXplIGF1dG9FeHBvcnRUb0dhbWU9JywgYXV0b0V4cG9ydFRvR2FtZSk7XG5cbiAgaWYoYXV0b0V4cG9ydFRvR2FtZSkgXG4gICAgYXdhaXQgZXhwb3J0VG9HYW1lKGNvbnRleHQuYXBpKTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8dHlwZXMuTG9hZE9yZGVyPiB7XG4gIFxuICAvLyBnZW5Qcm9wcyBpcyBhIHNtYWxsIHV0aWxpdHkgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBvZnRlbiByZS11c2VkIG9iamVjdHNcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXG4gIC8vICB0aGUgY3VycmVudGx5IGFjdGl2ZSBwcm9maWxlLCBldGMuXG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAvLyBXaHkgYXJlIHdlIGRlc2VyaWFsaXppbmcgd2hlbiB0aGUgcHJvZmlsZSBpcyBpbnZhbGlkIG9yIGJlbG9uZ3MgdG8gYW5vdGhlciBnYW1lID9cbiAgICByZXR1cm4gW107XG4gIH1cbiAgXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLcyhjb250ZXh0LmFwaSk7XG5cbiAgLy8gY3JlYXRlIGlmIG5lY2Vzc2FyeSwgYnV0IGxvYWQgdGhlIGxvYWQgb3JkZXIgZnJvbSBmaWxlICAgIFxuICBjb25zdCBsb0ZpbGVQYXRoID0gYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xuICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobG9GaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG4gIGxldCBsb2FkT3JkZXI6IHR5cGVzLklMb2FkT3JkZXJFbnRyeVtdID0gW107XG5cbiAgdHJ5IHtcbiAgICBcbiAgICB0cnkge1xuICAgICAgbG9hZE9yZGVyID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG5cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcHJvcHMuYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0NvcnJ1cHQgbG9hZCBvcmRlciBmaWxlJywge1xuICAgICAgICAgIGJiY29kZTogcHJvcHMuYXBpLnRyYW5zbGF0ZSgnVGhlIGxvYWQgb3JkZXIgZmlsZSBpcyBpbiBhIGNvcnJ1cHQgc3RhdGUuIFlvdSBjYW4gdHJ5IHRvIGZpeCBpdCB5b3Vyc2VsZiAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdvciBWb3J0ZXggY2FuIHJlZ2VuZXJhdGUgdGhlIGZpbGUgZm9yIHlvdSwgYnV0IHRoYXQgbWF5IHJlc3VsdCBpbiBsb3NzIG9mIGRhdGEgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcoV2lsbCBvbmx5IGFmZmVjdCBsb2FkIG9yZGVyIGl0ZW1zIHlvdSBhZGRlZCBtYW51YWxseSwgaWYgYW55KS4nKVxuICAgICAgICB9LCBbXG4gICAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gcmVqZWN0KGVycikgfSxcbiAgICAgICAgICB7IGxhYmVsOiAnUmVnZW5lcmF0ZSBGaWxlJywgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBsb2FkT3JkZXIgPSBbXTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF0pXG4gICAgICB9KVxuICAgIH1cblxuICAgIFxuICAgIGxvZygnaW5mbycsICdkZXNlcmlhbGl6ZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcblxuICAgIC8vIGZpbHRlciBvdXQgYW55IHBhayBmaWxlcyB0aGF0IG5vIGxvbmdlciBleGlzdFxuICAgIGNvbnN0IGZpbHRlcmVkTG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IGxvYWRPcmRlci5maWx0ZXIoZW50cnkgPT4gcGFrcy5maW5kKHBhayA9PiBwYWsuZmlsZU5hbWUgPT09IGVudHJ5LmlkKSk7XG5cbiAgICBsb2coJ2luZm8nLCAnZGVzZXJpYWxpemUgZmlsdGVyZWRMb2FkT3JkZXI9JywgZmlsdGVyZWRMb2FkT3JkZXIpO1xuXG4gICAgLy8gZmlsdGVyIG91dCBwYWsgZmlsZXMgdGhhdCBkb24ndCBoYXZlIGEgY29ycmVzcG9uZGluZyBtb2QgKHdoaWNoIG1lYW5zIFZvcnRleCBkaWRuJ3QgaW5zdGFsbCBpdC9pc24ndCBhd2FyZSBvZiBpdClcbiAgICAvL2NvbnN0IHBha3NXaXRoTW9kczpCRzNQYWtbXSA9IHBha3MuZmlsdGVyKHBhayA9PiBwYWsubW9kICE9PSB1bmRlZmluZWQpO1xuXG4gICAgICAvLyBnbyB0aHJvdWdoIGVhY2ggcGFrIGZpbGUgaW4gdGhlIE1vZHMgZm9sZGVyLi4uXG4gICAgY29uc3QgcHJvY2Vzc2VkUGFrcyA9IHBha3MucmVkdWNlKChhY2MsIGN1cnIpID0+IHsgICAgICBcblxuICAgICAgLy8gaWYgcGFrIGZpbGUgZG9lc24ndCBoYXZlIGFuIGFzc29jaWF0ZWQgbW9kLCB0aGVuIHdlIGRvbid0IHdhbnQgdG8gZGVhbCB3aXRoIGl0XG4gICAgICBpZihjdXJyLm1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFjYy5pbnZhbGlkLnB1c2goY3Vycik7IFxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfVxuICAgICAgXG4gICAgICBhY2MudmFsaWQucHVzaChjdXJyKTtcbiAgICAgIHJldHVybiBhY2M7XG5cbiAgICB9LCB7IHZhbGlkOiBbXSwgaW52YWxpZDogW10gfSk7XG5cbiAgICBsb2coJ2luZm8nLCAnZGVzZXJpYWxpemUgcHJvY2Vzc2VkUGFrcz0nLCBwcm9jZXNzZWRQYWtzKTtcblxuICAgIC8vIGdldCBhbnkgcGFrIGZpbGVzIHRoYXQgYXJlbid0IGluIHRoZSBmaWx0ZXJlZExvYWRPcmRlclxuICAgIGNvbnN0IGFkZGVkTW9kczpCRzNQYWtbXSA9IHByb2Nlc3NlZFBha3MudmFsaWQuZmlsdGVyKHBhayA9PiBmaWx0ZXJlZExvYWRPcmRlci5maW5kKGVudHJ5ID0+IGVudHJ5LmlkID09PSBwYWsuZmlsZU5hbWUpID09PSB1bmRlZmluZWQpO1xuXG4gICAgbG9nKCdpbmZvJywgJ2Rlc2VyaWFsaXplIGFkZGVkTW9kcz0nLCBhZGRlZE1vZHMpO1xuICAgIFxuICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIGFkZGVkIGFueSBuZXcgbW9kcy5cbiAgICAvL2NvbnN0IGRpZmYgPSBlbmFibGVkTW9kSWRzLmZpbHRlcihpZCA9PiAoIUlOVkFMSURfTE9fTU9EX1RZUEVTLmluY2x1ZGVzKG1vZHNbaWRdPy50eXBlKSlcbiAgICAvLyAgJiYgKGZpbHRlcmVkRGF0YS5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gaWQpID09PSB1bmRlZmluZWQpKTtcblxuICAgIGxvZygnaW5mbycsICdkZXNlcmlhbGl6ZSBwYWtzPScsIHBha3MpO1xuXG5cbiAgICAvLyBBZGQgYW55IG5ld2x5IGFkZGVkIG1vZHMgdG8gdGhlIGJvdHRvbSBvZiB0aGUgbG9hZE9yZGVyLlxuICAgIGFkZGVkTW9kcy5mb3JFYWNoKHBhayA9PiB7XG4gICAgICBmaWx0ZXJlZExvYWRPcmRlci5wdXNoKHtcbiAgICAgICAgaWQ6IHBhay5maWxlTmFtZSxcbiAgICAgICAgbW9kSWQ6IHBhay5tb2Q/LmlkLFxuICAgICAgICBlbmFibGVkOiB0cnVlLCAgLy8gbm90IHVzaW5nIGxvYWQgb3JkZXIgZm9yIGVuYWJsaW5nL2Rpc2FibGluZyAgICAgIFxuICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhay5maWxlTmFtZSwgJy5wYWsnKSxcbiAgICAgICAgZGF0YTogcGFrLmluZm8sXG4gICAgICAgIGxvY2tlZDogcGFrLmluZm8uaXNMaXN0ZWQgYXMgTG9ja2VkU3RhdGUgICAgICAgIFxuICAgICAgfSkgICAgICBcbiAgICB9KTsgICAgICAgXG5cbiAgICAvL2xvZygnaW5mbycsICdkZXNlcmlhbGl6ZSBmaWx0ZXJlZERhdGE9JywgZmlsdGVyZWREYXRhKTtcblxuICAgIC8vIHNvcnRlZCBzbyB0aGF0IGFueSBtb2RzIHRoYXQgYXJlIGxvY2tlZCBhcHBlYXIgYXQgdGhlIHRvcFxuICAgIC8vY29uc3Qgc29ydGVkQW5kRmlsdGVyZWREYXRhID0gXG4gICAgXG4gICAgLy8gcmV0dXJuXG4gICAgcmV0dXJuIGZpbHRlcmVkTG9hZE9yZGVyLnNvcnQoKGEsIGIpID0+ICgrYi5sb2NrZWQgLSArYS5sb2NrZWQpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydEZyb21CRzNNTShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcbiAgY29uc3Qgb3B0aW9uczogSU9wZW5PcHRpb25zID0ge1xuICAgIHRpdGxlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgY2hvb3NlIGEgQkczTU0gLmpzb24gbG9hZCBvcmRlciBmaWxlIHRvIGltcG9ydCBmcm9tJyksXG4gICAgZmlsdGVyczogW3sgbmFtZTogJ0JHM01NIExvYWQgT3JkZXInLCBleHRlbnNpb25zOiBbJ2pzb24nXSB9XVxuICB9O1xuXG4gIGNvbnN0IHNlbGVjdGVkUGF0aDpzdHJpbmcgPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcblxuICBsb2coJ2luZm8nLCAnaW1wb3J0RnJvbUJHM01NIHNlbGVjdGVkUGF0aD0nLCBzZWxlY3RlZFBhdGgpO1xuICBcbiAgLy8gaWYgbm8gcGF0aCBzZWxlY3RlZCwgdGhlbiBjYW5jZWwgcHJvYmFibHkgcHJlc3NlZFxuICBpZihzZWxlY3RlZFBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2VsZWN0ZWRQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgY29uc3QgbG9hZE9yZGVyOiBhbnlbXSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgbG9nKCdpbmZvJywgJ2ltcG9ydEZyb21CRzNNTSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcblxuICAgIGNvbnN0IGdldEluZGV4ID0gKHV1aWQ6IHN0cmluZyk6IG51bWJlciA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvYWRPcmRlci5maW5kSW5kZXgoZW50cnkgPT4gZW50cnkuVVVJRCAhPT0gdW5kZWZpbmVkICYmIGVudHJ5LlVVSUQgPT09IHV1aWQpO1xuICAgICAgcmV0dXJuIGluZGV4ICE9PSAtMSA/IGluZGV4IDogSW5maW5pdHk7IC8vIElmIFVVSUQgbm90IGZvdW5kLCBwdXQgaXQgYXQgdGhlIGVuZFxuICAgIH07XG5cbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG4gICAgY29uc3QgY3VycmVudExvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcbiAgICBjb25zdCBuZXdMTyA9IFsuLi5jdXJyZW50TG9hZE9yZGVyXS5zb3J0KChhLCBiKSA9PiBnZXRJbmRleChhLmRhdGE/LnV1aWQpIC0gZ2V0SW5kZXgoYi5kYXRhPy51dWlkKSk7XG4gICAgYXdhaXQgc2VyaWFsaXplKGNvbnRleHQsIG5ld0xPLCBwcm9maWxlSWQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IEJHM01NIGxvYWQgb3JkZXIgZmlsZScsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgZm9yY2VSZWZyZXNoKGNvbnRleHQuYXBpKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TW9kU2V0dGluZ3NGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcblxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuXG4gIGNvbnN0IG9wdGlvbnM6IElPcGVuT3B0aW9ucyA9IHtcbiAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gaW1wb3J0IGZyb20nKSxcbiAgICBmaWx0ZXJzOiBbeyBuYW1lOiAnQkczIExvYWQgT3JkZXInLCBleHRlbnNpb25zOiBbJ2xzeCddIH1dXG4gIH07XG5cbiAgY29uc3Qgc2VsZWN0ZWRQYXRoOnN0cmluZyA9IGF3YWl0IGFwaS5zZWxlY3RGaWxlKG9wdGlvbnMpO1xuXG4gIGxvZygnaW5mbycsICdpbXBvcnRNb2RTZXR0aW5nc0ZpbGUgc2VsZWN0ZWRQYXRoPScsIHNlbGVjdGVkUGF0aCk7XG4gIFxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXG4gIGlmKHNlbGVjdGVkUGF0aCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybjtcblxuICBwcm9jZXNzTHN4RmlsZShhcGksIHNlbGVjdGVkUGF0aCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xuXG4gIGNvbnN0IGdhbWVTZXR0aW5nc1BhdGg6c3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xuXG4gIGxvZygnaW5mbycsICdpbXBvcnRNb2RTZXR0aW5nc0dhbWUgZ2FtZVNldHRpbmdzUGF0aD0nLCBnYW1lU2V0dGluZ3NQYXRoKTtcblxuICBwcm9jZXNzTHN4RmlsZShhcGksIGdhbWVTZXR0aW5nc1BhdGgpO1xufVxuXG5mdW5jdGlvbiBjaGVja0lmRHVwbGljYXRlRXhpc3RzKGFycikge1xuICByZXR1cm4gbmV3IFNldChhcnIpLnNpemUgIT09IGFyci5sZW5ndGhcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlKG5vZGU6IElNb2ROb2RlLCBuYW1lOiBzdHJpbmcsIGZhbGxiYWNrPzogc3RyaW5nKTpzdHJpbmcge1xuICByZXR1cm4gZmluZE5vZGUobm9kZT8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2s7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NCRzNNTUZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBqc29uUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG5cbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIGlkOiBOT1RJRl9JTVBPUlRfQUNUSVZJVFksXG4gICAgdGl0bGU6ICdJbXBvcnRpbmcgSlNPTiBGaWxlJyxcbiAgICBtZXNzYWdlOiBqc29uUGF0aCxcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcbiAgfSk7XG5cbiAgdHJ5IHtcblxuICB9IGNhdGNoIChlcnIpIHtcblxuICB9IGZpbmFsbHkge1xuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKE5PVElGX0lNUE9SVF9BQ1RJVklUWSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0xzeEZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBsc3hQYXRoOnN0cmluZykgeyAgXG5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcblxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgaWQ6IE5PVElGX0lNUE9SVF9BQ1RJVklUWSxcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBMU1ggRmlsZScsXG4gICAgbWVzc2FnZTogbHN4UGF0aCxcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcbiAgfSk7XG5cbiAgdHJ5IHtcblxuICAgIGNvbnN0IGxzeExvYWRPcmRlcjpJTW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTHN4RmlsZShsc3hQYXRoKTtcbiAgICBsb2coJ2luZm8nLCAncHJvY2Vzc0xzeEZpbGUgbHN4UGF0aD0nLCBsc3hQYXRoKTtcblxuICAgIC8vIGJ1aWxkdXAgb2JqZWN0IGZyb20geG1sXG4gICAgY29uc3QgcmVnaW9uID0gZmluZE5vZGUobHN4TG9hZE9yZGVyPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xuICAgXG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG5cbiAgICAvLyBnZXQgbmljZSBzdHJpbmcgYXJyYXksIGluIG9yZGVyLCBvZiBtb2RzIGZyb20gdGhlIGxvYWQgb3JkZXIgc2VjdGlvblxuICAgIC8vbGV0IHV1aWRBcnJheTpzdHJpbmdbXSA9IGxvTm9kZS5jaGlsZHJlblswXS5ub2RlLm1hcCgobG9FbnRyeSkgPT4gbG9FbnRyeS5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdVVUlEJykpLiQudmFsdWUpO1xuICAgIFxuICAgIC8vbG9nKCdpbmZvJywgYHByb2Nlc3NMc3hGaWxlIHV1aWRBcnJheT1gLCB1dWlkQXJyYXkpO1xuXG4gICAgLypcbiAgICAvLyBhcmUgdGhlcmUgYW55IGR1cGxpY2F0ZXM/IGlmIHNvLi4uXG4gICAgaWYoY2hlY2tJZkR1cGxpY2F0ZUV4aXN0cyh1dWlkQXJyYXkpKSB7XG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcbiAgICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWltcG9ydGVkLWR1cGxpY2F0ZScsXG4gICAgICAgIHRpdGxlOiAnRHVwbGljYXRlIEVudHJpZXMnLFxuICAgICAgICBtZXNzYWdlOiAnRHVwbGljYXRlIFVVSURzIGZvdW5kIGluIHRoZSBNb2RPcmRlciBzZWN0aW9uIG9mIHRoZSAubHN4IGZpbGUgYmVpbmcgaW1wb3J0ZWQuIFRoaXMgc29tZXRpbWVzIGNhbiBjYXVzZSBpc3N1ZXMgd2l0aCB0aGUgbG9hZCBvcmRlci4nLFxuICAgICAgICBcbiAgICAgICAgLy9kaXNwbGF5TVM6IDMwMDBcbiAgICAgIH0pOyBcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHRoZXNlIGR1cGxpY2F0ZXMgYWZ0ZXIgdGhlIGZpcnN0IG9uZVxuICAgICAgLy91dWlkQXJyYXkgPSBBcnJheS5mcm9tKG5ldyBTZXQodXVpZEFycmF5KSk7XG4gICAgfSAgIFxuICAgICovXG5cbiAgICBjb25zdCBsc3hNb2ROb2RlczpJTW9kTm9kZVtdID0gbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZTtcblxuICAgIC8qXG4gICAgLy8gZ2V0IG1vZHMsIGluIHRoZSBhYm92ZSBvcmRlciwgZnJvbSB0aGUgbW9kcyBzZWN0aW9uIG9mIHRoZSBmaWxlIFxuICAgIGNvbnN0IGxzeE1vZHM6SU1vZE5vZGVbXSA9IHV1aWRBcnJheS5tYXAoKHV1aWQpID0+IHtcbiAgICAgIHJldHVybiBsc3hNb2ROb2Rlcy5maW5kKG1vZE5vZGUgPT4gbW9kTm9kZS5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdVVUlEJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gdXVpZCkpKTtcbiAgICB9KTsqL1xuXG4gICAgbG9nKCdpbmZvJywgYHByb2Nlc3NMc3hGaWxlIGxzeE1vZE5vZGVzPWAsIGxzeE1vZE5vZGVzKTtcblxuICAgIC8vIHdlIG5vdyBoYXZlIGFsbCB0aGUgaW5mb3JtYXRpb24gZnJvbSBmaWxlIHRoYXQgd2UgbmVlZFxuXG4gICAgLy8gbGV0cyBnZXQgYWxsIHBha3MgZnJvbSB0aGUgZm9sZGVyXG4gICAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtzKGFwaSk7XG5cbiAgICAvLyBhcmUgdGhlcmUgYW55IHBhayBmaWxlcyBub3QgaW4gdGhlIGxzeCBmaWxlP1xuICAgIGNvbnN0IG1pc3NpbmcgPSBwYWtzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7ICBcblxuICAgICAgLy8gaWYgY3VycmVudCBwYWsgaGFzIG5vIGFzc29jaWF0ZWQgcGFrLCB0aGVuIHdlIHNraXAuIHdlIGRlZmludGVseSBhcmVuJ3QgYWRkaW5nIHRoaXMgcGFrIGlmIHZvcnRleCBoYXNuJ3QgbWFuYWdlZCBpdC5cbiAgICAgIGlmKGN1cnIubW9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH1cblxuICAgICAgLy8gaWYgY3VycmVudCBwYWssIHdoaWNoIHZvcnRleCBoYXMgZGVmaW5hdGVseSBtYW5hZ2VkLCBpc24ndCBhbHJlYWR5IGluIHRoZSBsc3ggZmlsZSwgdGhlbiB0aGlzIGlzIG1pc3NpbmcgYW5kIHdlIG5lZWQgdG8gbG9hZCBvcmRlclxuICAgICAgaWYobHN4TW9kTm9kZXMuZmluZChsc3hFbnRyeSA9PiBsc3hFbnRyeS5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gY3Vyci5pbmZvLm5hbWUpKSkgPT09IHVuZGVmaW5lZCkgXG4gICAgICAgIGFjYy5wdXNoKGN1cnIpO1xuXG4gICAgICAvLyBza2lwIHRoaXMgXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIFtdKTtcblxuICAgIGxvZygnaW5mbycsICdwcm9jZXNzTHN4RmlsZSAtIG1pc3NpbmcgcGFrIGZpbGVzIHRoYXQgaGF2ZSBhc3NvY2lhdGVkIG1vZHMgPScsIG1pc3NpbmcpO1xuXG4gICAgLy8gYnVpbGQgYSBsb2FkIG9yZGVyIGZyb20gdGhlIGxzeCBmaWxlIGFuZCBhZGQgYW55IG1pc3NpbmcgcGFrcyBhdCB0aGUgZW5kP1xuXG4gICAgLy9sZXQgbmV3TG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xuXG4gICAgLy8gbG9vcCB0aHJvdWdoIGxzeCBtb2Qgbm9kZXMgYW5kIGZpbmQgdGhlIHBhayB0aGV5IGFyZSBhc3NvY2lhdGVkIHdpdGhcblxuICAgIGxldCBuZXdMb2FkT3JkZXI6IHR5cGVzLklMb2FkT3JkZXJFbnRyeVtdID0gbHN4TW9kTm9kZXMucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcbiAgICAgIFxuICAgICAgLy8gZmluZCB0aGUgYmczUGFrIHRoaXMgaXMgcmVmZXJpbmcgdG9vIGFzIGl0J3MgZWFzaWVyIHRvIGdldCBhbGwgdGhlIGluZm9ybWF0aW9uXG4gICAgICBjb25zdCBwYWsgPSBwYWtzLmZpbmQoKHBhaykgPT4gcGFrLmluZm8ubmFtZSA9PT0gY3Vyci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykpLiQudmFsdWUpO1xuXG4gICAgICAvLyBpZiB0aGUgcGFrIGlzIGZvdW5kLCB0aGVuIHdlIGFkZCBhIGxvYWQgb3JkZXIgZW50cnkuIGlmIGl0IGlzbid0LCB0aGVuIGl0cyBwcm9iIGJlZW4gZGVsZXRlZCBpbiB2b3J0ZXggYW5kIGxzeCBoYXMgYW4gZXh0cmEgZW50cnlcbiAgICAgIGlmIChwYWsgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhY2MucHVzaCh7XG4gICAgICAgICAgaWQ6IHBhay5maWxlTmFtZSxcbiAgICAgICAgICBtb2RJZDogcGFrPy5tb2Q/LmlkLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsICAgICAgICBcbiAgICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhay5maWxlTmFtZSwgJy5wYWsnKSxcbiAgICAgICAgICBkYXRhOiBwYWsuaW5mbyxcbiAgICAgICAgICBsb2NrZWQ6IHBhay5pbmZvLmlzTGlzdGVkIGFzIExvY2tlZFN0YXRlICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgW10pOyAgIFxuXG4gICAgbG9nKCdpbmZvJywgJ3Byb2Nlc3NMc3hGaWxlIChiZWZvcmUgYWRkaW5nIG1pc3NpbmcpIG5ld0xvYWRPcmRlcj0nLCBuZXdMb2FkT3JkZXIpO1xuXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cbiAgICBtaXNzaW5nLmZvckVhY2gocGFrID0+IHtcbiAgICAgIG5ld0xvYWRPcmRlci5wdXNoKHtcbiAgICAgICAgaWQ6IHBhay5maWxlTmFtZSxcbiAgICAgICAgbW9kSWQ6ICBwYWs/Lm1vZD8uaWQsXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsICAgICAgICBcbiAgICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXG4gICAgICAgIGRhdGE6IHBhay5pbmZvLFxuICAgICAgICBsb2NrZWQ6IHBhay5pbmZvLmlzTGlzdGVkIGFzIExvY2tlZFN0YXRlICAgICAgICBcbiAgICAgIH0pICAgICAgXG4gICAgfSk7ICAgXG5cbiAgICBsb2coJ2luZm8nLCAncHJvY2Vzc0xzeEZpbGUgKGFmdGVyIGFkZGluZyBtaXNzaW5nKSBuZXdMb2FkT3JkZXI9JywgbmV3TG9hZE9yZGVyKTtcblxuICAgIG5ld0xvYWRPcmRlci5zb3J0KChhLCBiKSA9PiAoK2IubG9ja2VkIC0gK2EubG9ja2VkKSk7XG5cbiAgICBsb2coJ2luZm8nLCAncHJvY2Vzc0xzeEZpbGUgKGFmdGVyIHNvcnRpbmcpIG5ld0xvYWRPcmRlcj0nLCBuZXdMb2FkT3JkZXIpO1xuXG4gICAgLy8gZ2V0IGxvYWQgb3JkZXJcbiAgICAvL2xldCBsb2FkT3JkZXI6dHlwZXMuTG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xuICAgIC8vbG9nKCdpbmZvJywgJ3Byb2Nlc3NMc3hGaWxlIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xuXG4gICAgLy8gbWFudWFseSBzZXQgbG9hZCBvcmRlcj9cbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBuZXdMb2FkT3JkZXIpKTtcblxuICAgIC8vdXRpbC5zZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgbmV3TG9hZE9yZGVyKTtcblxuICAgIC8vIGdldCBsb2FkIG9yZGVyIGFnYWluP1xuICAgIC8vbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xuICAgIC8vbG9nKCdpbmZvJywgJ3Byb2Nlc3NMc3hGaWxlIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xuXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1sb2Fkb3JkZXItaW1wb3J0LWFjdGl2aXR5Jyk7XG5cbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICBpZDogJ2JnMy1sb2Fkb3JkZXItaW1wb3J0ZWQnLFxuICAgICAgdGl0bGU6ICdMb2FkIE9yZGVyIEltcG9ydGVkJyxcbiAgICAgIG1lc3NhZ2U6IGxzeFBhdGgsXG4gICAgICBkaXNwbGF5TVM6IDMwMDBcbiAgICB9KTtcblxuICAgIGxvZygnaW5mbycsICdwcm9jZXNzTHN4RmlsZSBmaW5pc2hlZCcpO1xuXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIFxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKE5PVElGX0lNUE9SVF9BQ1RJVklUWSk7XG5cbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IGxvYWQgb3JkZXInLCBlcnIsIHtcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZVxuICAgIH0pO1xuICB9XG5cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlcGF0aDogc3RyaW5nKSB7XG5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcblxuICAvLyBnZXQgbG9hZCBvcmRlciBmcm9tIHN0YXRlXG4gIGNvbnN0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XG5cbiAgbG9nKCdpbmZvJywgJ2V4cG9ydFRvIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xuXG4gIHRyeSB7XG4gICAgLy8gcmVhZCB0aGUgZ2FtZSBiZzMgbW9kc2V0dGluZ3MubHN4IHNvIHRoYXQgd2UgZ2V0IHRoZSBkZWZhdWx0IGdhbWUgZ3VzdGF2IHRoaW5nP1xuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XG5cbiAgICAvLyBidWlsZHVwIG9iamVjdCBmcm9tIHhtbFxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xuICAgIFxuICAgIGlmICgobW9kc05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChtb2RzTm9kZS5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcbiAgICAgIG1vZHNOb2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XG4gICAgfVxuXG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTm9kZXMgPSBtb2RzTm9kZT8uY2hpbGRyZW4/LlswXT8ubm9kZT8uZmlsdGVyPy4oaXRlciA9PlxuICAgICAgaXRlci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gJ0d1c3RhdkRldicpKSkgPz8gW107XG5cbiAgICBcblxuXG4gICAgLy8gXG4gICAgY29uc3QgZmlsdGVyZWRQYWtzID0gbG9hZE9yZGVyLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5LmRhdGE/LnV1aWRcbiAgICAgICAgICAgICAgICAgICAgJiYgZW50cnkuZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICAmJiAhZW50cnkuZGF0YT8uaXNMaXN0ZWQpO1xuXG4gICAgbG9nKCdpbmZvJywgJ2V4cG9ydFRvIGZpbHRlcmVkUGFrcz0nLCBmaWx0ZXJlZFBha3MpO1xuXG4gICAgLy8gYWRkIG5ldyBub2RlcyBmb3IgdGhlIGVuYWJsZWQgbW9kc1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZmlsdGVyZWRQYWtzKSB7XG4gICAgICAvLyBjb25zdCBtZDUgPSBhd2FpdCB1dGlsLmZpbGVNRDUocGF0aC5qb2luKG1vZHNQYXRoKCksIGtleSkpO1xuXG4gICAgICAvKlxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiRm9sZGVyXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJDbGFzc0FkZGl0aW9uc19jNGZjM2RjMC0zMjIyLWNmM2ItNThjZC1jY2NlOGNlNGM4ZjVcIi8+XG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJNRDVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cImQ2NzhhZWI1NGM2YzE0OTZjMGVhZTcxY2UwMzNlOWZiXCIvPlxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiTmFtZVwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiSWxvbmlhcyBDaGFuZ2VzXCIvPlxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiUHVibGlzaEhhbmRsZVwiIHR5cGU9XCJ1aW50NjRcIiB2YWx1ZT1cIjQzMjUyODVcIi8+XG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJVVUlEXCIgdHlwZT1cImd1aWRcIiB2YWx1ZT1cImM0ZmMzZGMwLTMyMjItY2YzYi01OGNkLWNjY2U4Y2U0YzhmNVwiLz5cbiAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlZlcnNpb242NFwiIHR5cGU9XCJpbnQ2NFwiIHZhbHVlPVwiMzYwMjg3OTcwMTg5NjM5NzBcIi8+XG4gICAgICAqL1xuXG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xuICAgICAgICAkOiB7IGlkOiAnTW9kdWxlU2hvcnREZXNjJyB9LFxuICAgICAgICBhdHRyaWJ1dGU6IFtcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdGb2xkZXInLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5mb2xkZXIgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm1kNSB9IH0sXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm5hbWUgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ1B1Ymxpc2hIYW5kbGUnLCB0eXBlOiAndWludDY0JywgdmFsdWU6IDAgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnZ3VpZCcsIHZhbHVlOiBlbnRyeS5kYXRhLnV1aWQgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb242NCcsIHR5cGU6ICdpbnQ2NCcsIHZhbHVlOiBlbnRyeS5kYXRhLnZlcnNpb24gfSB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gXG4gICAgY29uc3QgbG9hZE9yZGVyTm9kZXMgPSBmaWx0ZXJlZFBha3NcbiAgICAgIC8vLnNvcnQoKGxocywgcmhzKSA9PiBsaHMucG9zIC0gcmhzLnBvcykgLy8gZG9uJ3Qga25vdyBpZiB3ZSBuZWVkIHRoaXMgbm93XG4gICAgICAubWFwKChlbnRyeSk6IElNb2ROb2RlID0+ICh7XG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGUnIH0sXG4gICAgICAgIGF0dHJpYnV0ZTogW1xuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS51dWlkIH0gfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgIG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBkZXNjcmlwdGlvbk5vZGVzO1xuXG4gICAgd3JpdGVNb2RTZXR0aW5ncyhhcGksIG1vZFNldHRpbmdzLCBmaWxlcGF0aCk7XG4gICAgXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWV4cG9ydGVkJyxcbiAgICAgIHRpdGxlOiAnTG9hZCBPcmRlciBFeHBvcnRlZCcsXG4gICAgICBtZXNzYWdlOiBmaWxlcGF0aCxcbiAgICAgIGRpc3BsYXlNUzogMzAwMFxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxuICAgIH0pO1xuICB9ICBcblxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG9GaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcblxuICBsZXQgc2VsZWN0ZWRQYXRoOnN0cmluZztcblxuICAvLyBhbiBvbGRlciB2ZXJzaW9uIG9mIFZvcnRleCBtaWdodCBub3QgaGF2ZSB0aGUgdXBkYXRlZCBhcGkuc2F2ZUZpbGUgZnVuY3Rpb24gc28gd2lsbCBmYWxsYmFja1xuICAvLyB0byB0aGUgcHJldmlvdXMgaGFjayBqb2Igb2Ygc2VsZWN0RmlsZSBidXQgYWN0dWFsbHkgd3JpdGVzXG4gIFxuICBpZihhcGkuc2F2ZUZpbGUgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgY29uc3Qgb3B0aW9uczogSVNhdmVPcHRpb25zID0ge1xuICAgICAgdGl0bGU6IGFwaS50cmFuc2xhdGUoJ1BsZWFzZSBjaG9vc2UgYSBCRzMgLmxzeCBmaWxlIHRvIGV4cG9ydCB0bycpLFxuICAgICAgZmlsdGVyczogW3sgbmFtZTogJ0JHMyBMb2FkIE9yZGVyJywgZXh0ZW5zaW9uczogWydsc3gnXSB9XSwgICAgICBcbiAgICB9O1xuXG4gICAgc2VsZWN0ZWRQYXRoID0gYXdhaXQgYXBpLnNhdmVGaWxlKG9wdGlvbnMpOyAgICBcblxuICB9IGVsc2Uge1xuXG4gICAgY29uc3Qgb3B0aW9uczogSU9wZW5PcHRpb25zID0ge1xuICAgICAgdGl0bGU6IGFwaS50cmFuc2xhdGUoJ1BsZWFzZSBjaG9vc2UgYSBCRzMgLmxzeCBmaWxlIHRvIGV4cG9ydCB0bycpLFxuICAgICAgZmlsdGVyczogW3sgbmFtZTogJ0JHMyBMb2FkIE9yZGVyJywgZXh0ZW5zaW9uczogWydsc3gnXSB9XSxcbiAgICAgIGNyZWF0ZTogdHJ1ZVxuICAgIH07XG5cbiAgICBzZWxlY3RlZFBhdGggPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcbiAgfVxuXG4gIGxvZygnaW5mbycsIGBleHBvcnRUb0ZpbGUgJHtzZWxlY3RlZFBhdGh9YCk7XG5cbiAgLy8gaWYgbm8gcGF0aCBzZWxlY3RlZCwgdGhlbiBjYW5jZWwgcHJvYmFibHkgcHJlc3NlZFxuICBpZihzZWxlY3RlZFBhdGggPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm47XG5cbiAgZXhwb3J0VG8oYXBpLCBzZWxlY3RlZFBhdGgpO1xufVxuICBcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRUb0dhbWUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xuXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgJ1B1YmxpYycsICdtb2RzZXR0aW5ncy5sc3gnKTtcblxuICBsb2coJ2luZm8nLCBgZXhwb3J0VG9HYW1lICR7c2V0dGluZ3NQYXRofWApO1xuXG4gIGV4cG9ydFRvKGFwaSwgc2V0dGluZ3NQYXRoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlZXBSZWZyZXNoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcblxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuXG4gIC8vIGdldCBsb2FkIG9yZGVyIGZyb20gc3RhdGVcbiAgY29uc3QgbG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcblxuICBsb2coJ2luZm8nLCAnZGVlcFJlZnJlc2gnLCBsb2FkT3JkZXIpO1xufVxuXG5cblxuYXN5bmMgZnVuY3Rpb24gcmVhZE1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XG4gIFxuICBjb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksICdQdWJsaWMnLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2V0dGluZ3NQYXRoKTtcbiAgbG9nKCdpbmZvJywgJ3JlYWRNb2RTZXR0aW5ncycsIGRhdCk7XG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZExzeEZpbGUobHN4UGF0aDogc3RyaW5nKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcbiAgXG4gIC8vY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xuICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxzeFBhdGgpO1xuICBsb2coJ2luZm8nLCAnbHN4UGF0aCcsIGRhdCk7XG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd3JpdGVNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRhdGE6IElNb2RTZXR0aW5ncywgZmlsZXBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcbiAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChkYXRhKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShmaWxlcGF0aCkpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVwYXRoLCB4bWwpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIHNldHRpbmdzJywgZXJyKTtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IHR5cGVzLkxvYWRPcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50OiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPGFueT4ge1xuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcbiAgLy8gIHJldHVybi5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA6IFByb21pc2U8QXJyYXk8SUNhY2hlRW50cnk+PiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxzTGliID0gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKTtcbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS0xpc3QoYXBpKTtcblxuICAvLyBsb2coJ2luZm8nLCAncGFrcycsIHBha3MpO1xuXG4gIGxldCBtYW5pZmVzdDtcbiAgdHJ5IHtcbiAgICBtYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCAnJywgR0FNRV9JRCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gIVsnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgZGVwbG95bWVudCBtYW5pZmVzdCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgaWQ6ICdiZzMtcmVhZGluZy1wYWtzLWFjdGl2aXR5JyxcbiAgICBtZXNzYWdlOiAnUmVhZGluZyBQQUsgZmlsZXMuIFRoaXMgbWlnaHQgdGFrZSBhIHdoaWxlLi4uJyxcbiAgfSlcbiAgY29uc3QgY2FjaGU6IFBha0luZm9DYWNoZSA9IFBha0luZm9DYWNoZS5nZXRJbnN0YW5jZShhcGkpO1xuICBjb25zdCByZXMgPSBhd2FpdCBQcm9taXNlLmFsbChwYWtzLm1hcChhc3luYyAoZmlsZU5hbWUsIGlkeCkgPT4ge1xuICAgIHJldHVybiB1dGlsLndpdGhFcnJvckNvbnRleHQoJ3JlYWRpbmcgcGFrJywgZmlsZU5hbWUsICgpID0+IHtcbiAgICAgIGNvbnN0IGZ1bmMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IG1hbmlmZXN0LmZpbGVzLmZpbmQoZW50cnkgPT4gZW50cnkucmVsUGF0aCA9PT0gZmlsZU5hbWUpO1xuICAgICAgICAgIGNvbnN0IG1vZCA9IChtYW5pZmVzdEVudHJ5ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXT8uW21hbmlmZXN0RW50cnkuc291cmNlXVxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICBjb25zdCBwYWtQYXRoID0gcGF0aC5qb2luKG1vZHNQYXRoKCksIGZpbGVOYW1lKTtcbiAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0Q2FjaGVFbnRyeShhcGksIHBha1BhdGgsIG1vZCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEaXZpbmVFeGVjTWlzc2luZykge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdUaGUgaW5zdGFsbGVkIGNvcHkgb2YgTFNMaWIvRGl2aW5lIGlzIGNvcnJ1cHRlZCAtIHBsZWFzZSAnXG4gICAgICAgICAgICAgICsgJ2RlbGV0ZSB0aGUgZXhpc3RpbmcgTFNMaWIgbW9kIGVudHJ5IGFuZCByZS1pbnN0YWxsIGl0LiBNYWtlIHN1cmUgdG8gJ1xuICAgICAgICAgICAgICArICdkaXNhYmxlIG9yIGFkZCBhbnkgbmVjZXNzYXJ5IGV4Y2VwdGlvbnMgdG8geW91ciBzZWN1cml0eSBzb2Z0d2FyZSB0byAnXG4gICAgICAgICAgICAgICsgJ2Vuc3VyZSBpdCBkb2VzIG5vdCBpbnRlcmZlcmUgd2l0aCBWb3J0ZXgvTFNMaWIgZmlsZSBvcGVyYXRpb25zLic7XG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJywgbWVzc2FnZSxcbiAgICAgICAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBjb3VsZCBoYXBwZW4gaWYgdGhlIGZpbGUgZ290IGRlbGV0ZWQgc2luY2UgcmVhZGluZyB0aGUgbGlzdCBvZiBwYWtzLlxuICAgICAgICAgIC8vIGFjdHVhbGx5LCB0aGlzIHNlZW1zIHRvIGJlIGZhaXJseSBjb21tb24gd2hlbiB1cGRhdGluZyBhIG1vZFxuICAgICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhay4gUGxlYXNlIG1ha2Ugc3VyZSB5b3UgYXJlIHVzaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBMU0xpYiBieSB1c2luZyB0aGUgXCJSZS1pbnN0YWxsIExTTGliL0RpdmluZVwiIHRvb2xiYXIgYnV0dG9uIG9uIHRoZSBNb2RzIHBhZ2UuJywgZXJyLCB7XG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogZmlsZU5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoKSk7XG4gICAgfSk7XG4gIH0pKTtcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1yZWFkaW5nLXBha3MtYWN0aXZpdHknKTtcblxuICByZXR1cm4gcmVzLmZpbHRlcihpdGVyID0+IGl0ZXIgIT09IHVuZGVmaW5lZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRQQUtMaXN0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBsZXQgcGFrczogc3RyaW5nW107XG4gIHRyeSB7XG4gICAgcGFrcyA9IChhd2FpdCBmcy5yZWFkZGlyQXN5bmMobW9kc1BhdGgoKSkpXG4gICAgICAuZmlsdGVyKGZpbGVOYW1lID0+IHBhdGguZXh0bmFtZShmaWxlTmFtZSkudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCgpLCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gbm9wXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZHMgZGlyZWN0b3J5JywgZXJyLCB7XG4gICAgICAgIGlkOiAnYmczLWZhaWxlZC1yZWFkLW1vZHMnLFxuICAgICAgICBtZXNzYWdlOiBtb2RzUGF0aCgpLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHBha3MgPSBbXTtcbiAgfVxuXG4gIHJldHVybiBwYWtzO1xufVxuXG5mdW5jdGlvbiBnZXRMYXRlc3RMU0xpYk1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXTtcbiAgaWYgKG1vZHMgPT09IHVuZGVmaW5lZCkge1xuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldjogdHlwZXMuSU1vZCwgaWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xuICAgICAgY29uc3QgbGF0ZXN0VmVyID0gdXRpbC5nZXRTYWZlKHByZXYsIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuICAgICAgY29uc3QgY3VycmVudFZlciA9IHV0aWwuZ2V0U2FmZShtb2RzW2lkXSwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2VtdmVyLmd0KGN1cnJlbnRWZXIsIGxhdGVzdFZlcikpIHtcbiAgICAgICAgICBwcmV2ID0gbW9kc1tpZF07XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCBtb2QgdmVyc2lvbicsIHsgbW9kSWQ6IGlkLCB2ZXJzaW9uOiBjdXJyZW50VmVyIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSwgdW5kZWZpbmVkKTtcblxuICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBsc0xpYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlblByb3BzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ/OiBzdHJpbmcpOiBJUHJvcHMge1xuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSAocHJvZmlsZUlkICE9PSB1bmRlZmluZWQpXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcblxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgcmV0dXJuIHsgYXBpLCBzdGF0ZSwgcHJvZmlsZSwgbW9kcywgZGlzY292ZXJ5IH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVMT0ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHByb3BzID0gZ2VuUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcbiAgfVxuXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XG4gIH1cblxuICBjb25zdCB0YXJnZXRQYXRoID0gbG9hZE9yZGVyRmlsZVBhdGgocHJvcHMucHJvZmlsZS5pZCk7XG4gIHRyeSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyh0YXJnZXRQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHRhcmdldFBhdGgsIEpTT04uc3RyaW5naWZ5KFtdKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH0gICAgXG4gIFxuICBcbiAgcmV0dXJuIHRhcmdldFBhdGg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkT3JkZXJGaWxlUGF0aChwcm9maWxlSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd1c2VyRGF0YScpLCBHQU1FX0lELCBwcm9maWxlSWQgKyAnXycgKyBMT19GSUxFX05BTUUpO1xufVxuXG4iXX0=