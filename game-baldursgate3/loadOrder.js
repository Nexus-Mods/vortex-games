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
                (0, vortex_api_1.log)('error', 'Corrupt load order file', err);
                yield new Promise((resolve, reject) => {
                    props.api.showDialog('error', 'Corrupt load order file', {
                        bbcode: props.api.translate('The load order file is in a corrupt state. You can try to fix it yourself '
                            + 'or Vortex can regenerate the file for you, but that may result in loss of data ' +
                            '(Will only affect load order items you added manually, if any).')
                    }, [
                        { label: 'Cancel', action: () => reject(err) },
                        { label: 'Regenerate File', action: () => __awaiter(this, void 0, void 0, function* () {
                                yield vortex_api_1.fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
                                loadOrder = [];
                                return resolve();
                            })
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
            let uuidArray = (loNode === null || loNode === void 0 ? void 0 : loNode.children) !== undefined
                ? loNode.children[0].node.map((loEntry) => loEntry.attribute.find(attr => (attr.$.id === 'UUID')).$.value)
                : [];
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
        (0, util_1.logDebug)('exportTo loadOrder=', loadOrder);
        try {
            const modSettings = yield readModSettings(api);
            const modSettingsFormat = yield (0, util_1.getDefaultModSettingsFormat)(api);
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
                const attributeOrder = ['Folder', 'MD5', 'Name', 'PublishHandle', 'UUID', 'Version64', 'Version'];
                const attributes = (modSettingsFormat === 'v7')
                    ? [
                        { $: { id: 'Folder', type: 'LSString', value: entry.data.folder } },
                        { $: { id: 'Name', type: 'LSString', value: entry.data.name } },
                        { $: { id: 'PublishHandle', type: 'uint64', value: 0 } },
                        { $: { id: 'Version64', type: 'int64', value: entry.data.version } },
                        { $: { id: 'UUID', type: 'guid', value: entry.data.uuid } },
                    ] : [
                    { $: { id: 'Folder', type: 'LSWString', value: entry.data.folder } },
                    { $: { id: 'Name', type: 'FixedString', value: entry.data.name } },
                    { $: { id: 'UUID', type: 'FixedString', value: entry.data.uuid } },
                    { $: { id: 'Version', type: 'int32', value: entry.data.version } },
                ];
                descriptionNodes.push({
                    $: { id: 'ModuleShortDesc' },
                    attribute: [].concat(attributes, [{ $: { id: 'MD5', type: 'LSString', value: entry.data.md5 } }])
                        .sort((a, b) => attributeOrder.indexOf(a.$.id) - attributeOrder.indexOf(b.$.id)),
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
            if (modSettingsFormat !== 'v7') {
                let modOrderNode = (0, util_1.findNode)((_l = (_k = root === null || root === void 0 ? void 0 : root.children) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.node, 'ModOrder');
                let insertNode = false;
                if (!modOrderNode) {
                    insertNode = true;
                    modOrderNode = { $: { id: 'ModOrder' }, children: [{ node: [] }] };
                }
                if ((modOrderNode.children === undefined) || (modOrderNode.children[0] === '')) {
                    modOrderNode.children = [{ node: [] }];
                }
                modOrderNode.children[0].node = loadOrderNodes;
                if (insertNode && !!((_o = (_m = root === null || root === void 0 ? void 0 : root.children) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.node)) {
                    (_q = (_p = root === null || root === void 0 ? void 0 : root.children) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.node.splice(0, 0, modOrderNode);
                }
            }
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
        const format = yield (0, util_1.getDefaultModSettingsFormat)(api);
        const builder = (format === 'v7')
            ? new xml2js_1.Builder({ renderOpts: { pretty: true, indent: '    ' } })
            : new xml2js_1.Builder();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQXNFO0FBQ3RFLGdEQUF3QjtBQUN4QiwrQ0FBaUM7QUFDakMsd0RBQWdDO0FBRWhDLHFDQUF3RTtBQUV4RSxtQ0FBb0U7QUFJcEUsbURBQW9EO0FBQ3BELGlDQUEwSjtBQUUxSixvREFBb0Q7QUFFcEQsU0FBc0IsU0FBUyxDQUFDLE9BQWdDLEVBQ2hDLFNBQTBCLEVBQzFCLFNBQWtCOzs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUdyQyxNQUFNLFVBQVUsR0FBRyxNQUFNLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBR2pFLElBQUEsZUFBUSxFQUFDLHNCQUFzQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRzVDLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDcEYsTUFBTSxlQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFLckYsTUFBTSxnQkFB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QUVELFNBQXNCLFlBQVksQ0FBQyxPQUFnQyxFQUNoQyxTQUFrQixFQUNsQixLQUFjOztRQUMvQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDdEM7UUFFRCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO1NBQ2xGO1FBRUQsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RCxJQUFJO1lBQ0YsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDaEM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQzthQUMvRTtTQUNGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7UUFHRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0NBQUE7QUF4QkQsb0NBd0JDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsU0FBaUI7SUFDakQsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFLGdCQUFPLEVBQUUsU0FBUyxHQUFHLEdBQUcsR0FBRyxxQkFBWSxDQUFDLENBQUM7QUFDNUYsQ0FBQztBQUZELDhDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBMT19GSUxFX05BTUUsIE5PVElGX0lNUE9SVF9BQ1RJVklUWSB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgQkczUGFrLCBJTW9kTm9kZSwgSU1vZFNldHRpbmdzLCBJUHJvcHMsIElSb290Tm9kZSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UsIFJlbmRlck9wdGlvbnMgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgeyBMb2NrZWRTdGF0ZSB9IGZyb20gJ3ZvcnRleC1hcGkvbGliL2V4dGVuc2lvbnMvZmlsZV9iYXNlZF9sb2Fkb3JkZXIvdHlwZXMvdHlwZXMnO1xyXG5pbXBvcnQgeyBJT3Blbk9wdGlvbnMsIElTYXZlT3B0aW9ucyB9IGZyb20gJ3ZvcnRleC1hcGkvbGliL3R5cGVzL0lFeHRlbnNpb25Db250ZXh0JztcclxuXHJcbmltcG9ydCB7IERpdmluZUV4ZWNNaXNzaW5nIH0gZnJvbSAnLi9kaXZpbmVXcmFwcGVyJztcclxuaW1wb3J0IHsgZmluZE5vZGUsIGZvcmNlUmVmcmVzaCwgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZSwgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0LCBnZXRQbGF5ZXJQcm9maWxlcywgbG9nRGVidWcsIG1vZHNQYXRoLCBwcm9maWxlc1BhdGggfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0IFBha0luZm9DYWNoZSwgeyBJQ2FjaGVFbnRyeSB9IGZyb20gJy4vY2FjaGUnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XHJcbiAgfVxyXG4gIFxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuXHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBMTyBmaWxlIGlzIGNyZWF0ZWQgYW5kIHJlYWR5IHRvIGJlIHdyaXR0ZW4gdG8uXHJcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0LCBwcm9maWxlSWQsIHByb3BzKTtcclxuICAvL2NvbnN0IGZpbHRlcmVkTE8gPSBsb2FkT3JkZXIuZmlsdGVyKGxvID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMocHJvcHMubW9kcz8uW2xvPy5tb2RJZF0/LnR5cGUpKSk7XHJcblxyXG4gIGxvZ0RlYnVnKCdzZXJpYWxpemUgbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XHJcblxyXG4gIC8vIFdyaXRlIHRoZSBwcmVmaXhlZCBMTyB0byBmaWxlLlxyXG4gIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxvRmlsZVBhdGgpLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxvRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGxvYWRPcmRlciksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuXHJcbiAgLy8gY2hlY2sgdGhlIHN0YXRlIGZvciBpZiB3ZSBhcmUga2VlcGluZyB0aGUgZ2FtZSBvbmUgaW4gc3luY1xyXG4gIC8vIGlmIHdlIGFyZSB3cml0aW5nIHZvcnRleCdzIGxvYWQgb3JkZXIsIHRoZW4gd2Ugd2lsbCBhbHNvIHdyaXRlIHRoZSBnYW1lcyBvbmVcclxuXHJcbiAgY29uc3QgYXV0b0V4cG9ydFRvR2FtZTpib29sZWFuID0gc3RhdGUuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddLmF1dG9FeHBvcnRMb2FkT3JkZXIgPz8gZmFsc2U7XHJcblxyXG4gIGxvZ0RlYnVnKCdzZXJpYWxpemUgYXV0b0V4cG9ydFRvR2FtZT0nLCBhdXRvRXhwb3J0VG9HYW1lKTtcclxuXHJcbiAgaWYoYXV0b0V4cG9ydFRvR2FtZSkgXHJcbiAgICBhd2FpdCBleHBvcnRUb0dhbWUoY29udGV4dC5hcGkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXNlcmlhbGl6ZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IFByb21pc2U8dHlwZXMuTG9hZE9yZGVyPiB7XHJcbiAgXHJcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXHJcbiAgLy8gIHN1Y2ggYXMgdGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0YWxsZWQgTW9kcywgVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUsXHJcbiAgLy8gIHRoZSBjdXJyZW50bHkgYWN0aXZlIHByb2ZpbGUsIGV0Yy5cclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzPy5wcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIFdoeSBhcmUgd2UgZGVzZXJpYWxpemluZyB3aGVuIHRoZSBwcm9maWxlIGlzIGludmFsaWQgb3IgYmVsb25ncyB0byBhbm90aGVyIGdhbWUgP1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBcclxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS3MoY29udGV4dC5hcGkpO1xyXG5cclxuICAvLyBjcmVhdGUgaWYgbmVjZXNzYXJ5LCBidXQgbG9hZCB0aGUgbG9hZCBvcmRlciBmcm9tIGZpbGUgICAgXHJcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcclxuICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobG9GaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG5cclxuICBsZXQgbG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xyXG5cclxuICB0cnkge1xyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICBsb2FkT3JkZXIgPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ0NvcnJ1cHQgbG9hZCBvcmRlciBmaWxlJywgZXJyKTtcclxuICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdDb3JydXB0IGxvYWQgb3JkZXIgZmlsZScsIHtcclxuICAgICAgICAgIGJiY29kZTogcHJvcHMuYXBpLnRyYW5zbGF0ZSgnVGhlIGxvYWQgb3JkZXIgZmlsZSBpcyBpbiBhIGNvcnJ1cHQgc3RhdGUuIFlvdSBjYW4gdHJ5IHRvIGZpeCBpdCB5b3Vyc2VsZiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ29yIFZvcnRleCBjYW4gcmVnZW5lcmF0ZSB0aGUgZmlsZSBmb3IgeW91LCBidXQgdGhhdCBtYXkgcmVzdWx0IGluIGxvc3Mgb2YgZGF0YSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnKFdpbGwgb25seSBhZmZlY3QgbG9hZCBvcmRlciBpdGVtcyB5b3UgYWRkZWQgbWFudWFsbHksIGlmIGFueSkuJylcclxuICAgICAgICB9LCBbXHJcbiAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiByZWplY3QoZXJyKSB9LFxyXG4gICAgICAgICAgeyBsYWJlbDogJ1JlZ2VuZXJhdGUgRmlsZScsIGFjdGlvbjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxvRmlsZVBhdGgpLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG4gICAgICAgICAgICAgIGxvYWRPcmRlciA9IFtdO1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICBdKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgbG9nRGVidWcoJ2Rlc2VyaWFsaXplIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xyXG5cclxuICAgIC8vIGZpbHRlciBvdXQgYW55IHBhayBmaWxlcyB0aGF0IG5vIGxvbmdlciBleGlzdFxyXG4gICAgY29uc3QgZmlsdGVyZWRMb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlciA9IGxvYWRPcmRlci5maWx0ZXIoZW50cnkgPT4gcGFrcy5maW5kKHBhayA9PiBwYWsuZmlsZU5hbWUgPT09IGVudHJ5LmlkKSk7XHJcblxyXG4gICAgbG9nRGVidWcoJ2Rlc2VyaWFsaXplIGZpbHRlcmVkTG9hZE9yZGVyPScsIGZpbHRlcmVkTG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBmaWx0ZXIgb3V0IHBhayBmaWxlcyB0aGF0IGRvbid0IGhhdmUgYSBjb3JyZXNwb25kaW5nIG1vZCAod2hpY2ggbWVhbnMgVm9ydGV4IGRpZG4ndCBpbnN0YWxsIGl0L2lzbid0IGF3YXJlIG9mIGl0KVxyXG4gICAgLy9jb25zdCBwYWtzV2l0aE1vZHM6QkczUGFrW10gPSBwYWtzLmZpbHRlcihwYWsgPT4gcGFrLm1vZCAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIC8vIGdvIHRocm91Z2ggZWFjaCBwYWsgZmlsZSBpbiB0aGUgTW9kcyBmb2xkZXIuLi5cclxuICAgIGNvbnN0IHByb2Nlc3NlZFBha3MgPSBwYWtzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7ICAgICAgICAgICAgXHJcbiAgICAgIGFjYy52YWxpZC5wdXNoKGN1cnIpO1xyXG4gICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwgeyB2YWxpZDogW10sIGludmFsaWQ6IFtdIH0pO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBwcm9jZXNzZWRQYWtzPScsIHByb2Nlc3NlZFBha3MpO1xyXG5cclxuICAgIC8vIGdldCBhbnkgcGFrIGZpbGVzIHRoYXQgYXJlbid0IGluIHRoZSBmaWx0ZXJlZExvYWRPcmRlclxyXG4gICAgY29uc3QgYWRkZWRNb2RzOiBCRzNQYWtbXSA9IHByb2Nlc3NlZFBha3MudmFsaWQuZmlsdGVyKHBhayA9PiBmaWx0ZXJlZExvYWRPcmRlci5maW5kKGVudHJ5ID0+IGVudHJ5LmlkID09PSBwYWsuZmlsZU5hbWUpID09PSB1bmRlZmluZWQpO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBhZGRlZE1vZHM9JywgYWRkZWRNb2RzKTtcclxuICAgIFxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgYWRkZWQgYW55IG5ldyBtb2RzLlxyXG4gICAgLy9jb25zdCBkaWZmID0gZW5hYmxlZE1vZElkcy5maWx0ZXIoaWQgPT4gKCFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhtb2RzW2lkXT8udHlwZSkpXHJcbiAgICAvLyAgJiYgKGZpbHRlcmVkRGF0YS5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gaWQpID09PSB1bmRlZmluZWQpKTtcclxuXHJcbiAgICBsb2dEZWJ1ZygnZGVzZXJpYWxpemUgcGFrcz0nLCBwYWtzKTtcclxuXHJcblxyXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cclxuICAgIGFkZGVkTW9kcy5mb3JFYWNoKHBhayA9PiB7XHJcbiAgICAgIGZpbHRlcmVkTG9hZE9yZGVyLnB1c2goe1xyXG4gICAgICAgIGlkOiBwYWsuZmlsZU5hbWUsXHJcbiAgICAgICAgbW9kSWQ6IHBhay5tb2Q/LmlkLFxyXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsICAvLyBub3QgdXNpbmcgbG9hZCBvcmRlciBmb3IgZW5hYmxpbmcvZGlzYWJsaW5nICAgICAgXHJcbiAgICAgICAgbmFtZTogcGFrLmluZm8/Lm5hbWUgfHwgcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXHJcbiAgICAgICAgZGF0YTogcGFrLmluZm8sXHJcbiAgICAgICAgbG9ja2VkOiBwYWsuaW5mby5pc0xpc3RlZCBhcyBMb2NrZWRTdGF0ZSAgICAgICAgXHJcbiAgICAgIH0pICAgICAgXHJcbiAgICB9KTsgICAgICAgXHJcblxyXG4gICAgLy9sb2dEZWJ1ZygnZGVzZXJpYWxpemUgZmlsdGVyZWREYXRhPScsIGZpbHRlcmVkRGF0YSk7XHJcblxyXG4gICAgLy8gc29ydGVkIHNvIHRoYXQgYW55IG1vZHMgdGhhdCBhcmUgbG9ja2VkIGFwcGVhciBhdCB0aGUgdG9wXHJcbiAgICAvL2NvbnN0IHNvcnRlZEFuZEZpbHRlcmVkRGF0YSA9IFxyXG4gICAgXHJcbiAgICAvLyByZXR1cm5cclxuICAgIHJldHVybiBmaWx0ZXJlZExvYWRPcmRlci5zb3J0KChhLCBiKSA9PiAoK2IubG9ja2VkIC0gK2EubG9ja2VkKSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRGcm9tQkczTU0oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBvcHRpb25zOiBJT3Blbk9wdGlvbnMgPSB7XHJcbiAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHM01NIC5qc29uIGxvYWQgb3JkZXIgZmlsZSB0byBpbXBvcnQgZnJvbScpLFxyXG4gICAgZmlsdGVyczogW3sgbmFtZTogJ0JHM01NIExvYWQgT3JkZXInLCBleHRlbnNpb25zOiBbJ2pzb24nXSB9XVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHNlbGVjdGVkUGF0aDpzdHJpbmcgPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcclxuXHJcbiAgbG9nRGVidWcoJ2ltcG9ydEZyb21CRzNNTSBzZWxlY3RlZFBhdGg9Jywgc2VsZWN0ZWRQYXRoKTtcclxuICBcclxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXHJcbiAgaWYoc2VsZWN0ZWRQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZWxlY3RlZFBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGxvYWRPcmRlcjogYW55W10gPSBKU09OLnBhcnNlKGRhdGEpO1xyXG4gICAgbG9nRGVidWcoJ2ltcG9ydEZyb21CRzNNTSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgICBjb25zdCBnZXRJbmRleCA9ICh1dWlkOiBzdHJpbmcpOiBudW1iZXIgPT4ge1xyXG4gICAgICBjb25zdCBpbmRleCA9IGxvYWRPcmRlci5maW5kSW5kZXgoZW50cnkgPT4gZW50cnkuVVVJRCAhPT0gdW5kZWZpbmVkICYmIGVudHJ5LlVVSUQgPT09IHV1aWQpO1xyXG4gICAgICByZXR1cm4gaW5kZXggIT09IC0xID8gaW5kZXggOiBJbmZpbml0eTsgLy8gSWYgVVVJRCBub3QgZm91bmQsIHB1dCBpdCBhdCB0aGUgZW5kXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gICAgY29uc3QgY3VycmVudExvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgIGNvbnN0IG5ld0xPID0gWy4uLmN1cnJlbnRMb2FkT3JkZXJdLnNvcnQoKGEsIGIpID0+IGdldEluZGV4KGEuZGF0YT8udXVpZCkgLSBnZXRJbmRleChiLmRhdGE/LnV1aWQpKTtcclxuICAgIGF3YWl0IHNlcmlhbGl6ZShjb250ZXh0LCBuZXdMTywgcHJvZmlsZUlkKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbXBvcnQgQkczTU0gbG9hZCBvcmRlciBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgZm9yY2VSZWZyZXNoKGNvbnRleHQuYXBpKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xyXG5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcblxyXG4gIGNvbnN0IG9wdGlvbnM6IElPcGVuT3B0aW9ucyA9IHtcclxuICAgIHRpdGxlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgY2hvb3NlIGEgQkczIC5sc3ggZmlsZSB0byBpbXBvcnQgZnJvbScpLFxyXG4gICAgZmlsdGVyczogW3sgbmFtZTogJ0JHMyBMb2FkIE9yZGVyJywgZXh0ZW5zaW9uczogWydsc3gnXSB9XVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHNlbGVjdGVkUGF0aDpzdHJpbmcgPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcclxuXHJcbiAgbG9nRGVidWcoJ2ltcG9ydE1vZFNldHRpbmdzRmlsZSBzZWxlY3RlZFBhdGg9Jywgc2VsZWN0ZWRQYXRoKTtcclxuICBcclxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXHJcbiAgaWYoc2VsZWN0ZWRQYXRoID09PSB1bmRlZmluZWQpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIHByb2Nlc3NMc3hGaWxlKGFwaSwgc2VsZWN0ZWRQYXRoKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydE1vZFNldHRpbmdzR2FtZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XHJcblxyXG4gIGNvbnN0IGJnM1Byb2ZpbGVJZCA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBnYW1lU2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBsb2dEZWJ1ZygnaW1wb3J0TW9kU2V0dGluZ3NHYW1lIGdhbWVTZXR0aW5nc1BhdGg9JywgZ2FtZVNldHRpbmdzUGF0aCk7XHJcblxyXG4gIHByb2Nlc3NMc3hGaWxlKGFwaSwgZ2FtZVNldHRpbmdzUGF0aCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrSWZEdXBsaWNhdGVFeGlzdHMoYXJyKSB7XHJcbiAgcmV0dXJuIG5ldyBTZXQoYXJyKS5zaXplICE9PSBhcnIubGVuZ3RoXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZShub2RlOiBJTW9kTm9kZSwgbmFtZTogc3RyaW5nLCBmYWxsYmFjaz86IHN0cmluZyk6c3RyaW5nIHtcclxuICByZXR1cm4gZmluZE5vZGUobm9kZT8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2s7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NCRzNNTUZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBqc29uUGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG5cclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogTk9USUZfSU1QT1JUX0FDVElWSVRZLFxyXG4gICAgdGl0bGU6ICdJbXBvcnRpbmcgSlNPTiBGaWxlJyxcclxuICAgIG1lc3NhZ2U6IGpzb25QYXRoLFxyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gIH0pO1xyXG5cclxuICB0cnkge1xyXG5cclxuICB9IGNhdGNoIChlcnIpIHtcclxuXHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKE5PVElGX0lNUE9SVF9BQ1RJVklUWSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Tm9kZXMobHN4UGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICBjb25zdCBsc3hMb2FkT3JkZXI6IElNb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRMc3hGaWxlKGxzeFBhdGgpO1xyXG4gICAgbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIGxzeFBhdGg9JywgbHN4UGF0aCk7XHJcblxyXG4gICAgLy8gYnVpbGR1cCBvYmplY3QgZnJvbSB4bWxcclxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKGxzeExvYWRPcmRlcj8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RzTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcbiAgICBjb25zdCBtb2RzT3JkZXJOb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcblxyXG4gICAgcmV0dXJuIHsgcmVnaW9uLCByb290LCBtb2RzTm9kZSwgbW9kc09yZGVyTm9kZSB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0xzeEZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBsc3hQYXRoOnN0cmluZykgeyAgXHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuXHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6IE5PVElGX0lNUE9SVF9BQ1RJVklUWSxcclxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIExTWCBGaWxlJyxcclxuICAgIG1lc3NhZ2U6IGxzeFBhdGgsXHJcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXHJcbiAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IG1vZHNOb2RlLCBtb2RzT3JkZXJOb2RlIH0gPSBhd2FpdCBnZXROb2Rlcyhsc3hQYXRoKTtcclxuICAgIGlmICgobW9kc05vZGU/LmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGU/LmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xyXG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1hdCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xyXG4gICAgbGV0IGxvTm9kZSA9IGZvcm1hdCA9PT0gJ3Y3JyA/IG1vZHNOb2RlIDogbW9kc09yZGVyTm9kZSAhPT0gdW5kZWZpbmVkID8gbW9kc09yZGVyTm9kZSA6IG1vZHNOb2RlO1xyXG5cclxuICAgIC8vIGdldCBuaWNlIHN0cmluZyBhcnJheSwgaW4gb3JkZXIsIG9mIG1vZHMgZnJvbSB0aGUgbG9hZCBvcmRlciBzZWN0aW9uXHJcbiAgICBsZXQgdXVpZEFycmF5OnN0cmluZ1tdID0gbG9Ob2RlPy5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkXHJcbiAgICAgID8gbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUubWFwKChsb0VudHJ5KSA9PiBsb0VudHJ5LmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ1VVSUQnKSkuJC52YWx1ZSlcclxuICAgICAgOiBbXTtcclxuXHJcbiAgICBsb2dEZWJ1ZyhgcHJvY2Vzc0xzeEZpbGUgdXVpZEFycmF5PWAsIHV1aWRBcnJheSk7XHJcblxyXG4gICAgLy8gYXJlIHRoZXJlIGFueSBkdXBsaWNhdGVzPyBpZiBzby4uLlxyXG4gICAgaWYoY2hlY2tJZkR1cGxpY2F0ZUV4aXN0cyh1dWlkQXJyYXkpKSB7XHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWltcG9ydGVkLWR1cGxpY2F0ZScsXHJcbiAgICAgICAgdGl0bGU6ICdEdXBsaWNhdGUgRW50cmllcycsXHJcbiAgICAgICAgbWVzc2FnZTogJ0R1cGxpY2F0ZSBVVUlEcyBmb3VuZCBpbiB0aGUgTW9kT3JkZXIgc2VjdGlvbiBvZiB0aGUgLmxzeCBmaWxlIGJlaW5nIGltcG9ydGVkLiBUaGlzIHNvbWV0aW1lcyBjYW4gY2F1c2UgaXNzdWVzIHdpdGggdGhlIGxvYWQgb3JkZXIuJyxcclxuICAgICAgICBcclxuICAgICAgICAvL2Rpc3BsYXlNUzogMzAwMFxyXG4gICAgICB9KTsgXHJcbiAgICAgIFxyXG4gICAgICAvLyByZW1vdmUgdGhlc2UgZHVwbGljYXRlcyBhZnRlciB0aGUgZmlyc3Qgb25lXHJcbiAgICAgIHV1aWRBcnJheSA9IEFycmF5LmZyb20obmV3IFNldCh1dWlkQXJyYXkpKTtcclxuICAgIH0gICBcclxuXHJcbiAgICBjb25zdCBsc3hNb2ROb2RlczogSU1vZE5vZGVbXSA9IG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGU7XHJcblxyXG4gICAgLypcclxuICAgIC8vIGdldCBtb2RzLCBpbiB0aGUgYWJvdmUgb3JkZXIsIGZyb20gdGhlIG1vZHMgc2VjdGlvbiBvZiB0aGUgZmlsZSBcclxuICAgIGNvbnN0IGxzeE1vZHM6SU1vZE5vZGVbXSA9IHV1aWRBcnJheS5tYXAoKHV1aWQpID0+IHtcclxuICAgICAgcmV0dXJuIGxzeE1vZE5vZGVzLmZpbmQobW9kTm9kZSA9PiBtb2ROb2RlLmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ1VVSUQnKSAmJiAoYXR0ci4kLnZhbHVlID09PSB1dWlkKSkpO1xyXG4gICAgfSk7Ki9cclxuXHJcbiAgICBsb2dEZWJ1ZyhgcHJvY2Vzc0xzeEZpbGUgbHN4TW9kTm9kZXM9YCwgbHN4TW9kTm9kZXMpO1xyXG5cclxuICAgIC8vIHdlIG5vdyBoYXZlIGFsbCB0aGUgaW5mb3JtYXRpb24gZnJvbSBmaWxlIHRoYXQgd2UgbmVlZFxyXG5cclxuICAgIC8vIGxldHMgZ2V0IGFsbCBwYWtzIGZyb20gdGhlIGZvbGRlclxyXG4gICAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtzKGFwaSk7XHJcblxyXG4gICAgLy8gYXJlIHRoZXJlIGFueSBwYWsgZmlsZXMgbm90IGluIHRoZSBsc3ggZmlsZT9cclxuICAgIGNvbnN0IG1pc3NpbmcgPSBwYWtzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7ICBcclxuXHJcbiAgICAgIC8vIGlmIGN1cnJlbnQgcGFrIGhhcyBubyBhc3NvY2lhdGVkIHBhaywgdGhlbiB3ZSBza2lwLiB3ZSBkZWZpbnRlbHkgYXJlbid0IGFkZGluZyB0aGlzIHBhayBpZiB2b3J0ZXggaGFzbid0IG1hbmFnZWQgaXQuXHJcbiAgICAgIGlmKGN1cnIubW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gYWNjO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBpZiBjdXJyZW50IHBhaywgd2hpY2ggdm9ydGV4IGhhcyBkZWZpbmF0ZWx5IG1hbmFnZWQsIGlzbid0IGFscmVhZHkgaW4gdGhlIGxzeCBmaWxlLCB0aGVuIHRoaXMgaXMgbWlzc2luZyBhbmQgd2UgbmVlZCB0byBsb2FkIG9yZGVyXHJcbiAgICAgIGlmKGxzeE1vZE5vZGVzLmZpbmQobHN4RW50cnkgPT4gbHN4RW50cnkuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09IGN1cnIuaW5mby5uYW1lKSkpID09PSB1bmRlZmluZWQpIFxyXG4gICAgICAgIGFjYy5wdXNoKGN1cnIpO1xyXG5cclxuICAgICAgLy8gc2tpcCB0aGlzIFxyXG4gICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwgW10pO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAtIG1pc3NpbmcgcGFrIGZpbGVzIHRoYXQgaGF2ZSBhc3NvY2lhdGVkIG1vZHMgPScsIG1pc3NpbmcpO1xyXG5cclxuICAgIC8vIGJ1aWxkIGEgbG9hZCBvcmRlciBmcm9tIHRoZSBsc3ggZmlsZSBhbmQgYWRkIGFueSBtaXNzaW5nIHBha3MgYXQgdGhlIGVuZD9cclxuXHJcbiAgICAvL2xldCBuZXdMb2FkT3JkZXI6IHR5cGVzLklMb2FkT3JkZXJFbnRyeVtdID0gW107XHJcblxyXG4gICAgLy8gbG9vcCB0aHJvdWdoIGxzeCBtb2Qgbm9kZXMgYW5kIGZpbmQgdGhlIHBhayB0aGV5IGFyZSBhc3NvY2lhdGVkIHdpdGhcclxuXHJcbiAgICBsZXQgbmV3TG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IGxzeE1vZE5vZGVzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XHJcbiAgICAgIFxyXG4gICAgICAvLyBmaW5kIHRoZSBiZzNQYWsgdGhpcyBpcyByZWZlcmluZyB0b28gYXMgaXQncyBlYXNpZXIgdG8gZ2V0IGFsbCB0aGUgaW5mb3JtYXRpb25cclxuICAgICAgY29uc3QgcGFrID0gcGFrcy5maW5kKChwYWspID0+IHBhay5pbmZvLm5hbWUgPT09IGN1cnIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpKS4kLnZhbHVlKTtcclxuXHJcbiAgICAgIC8vIGlmIHRoZSBwYWsgaXMgZm91bmQsIHRoZW4gd2UgYWRkIGEgbG9hZCBvcmRlciBlbnRyeS4gaWYgaXQgaXNuJ3QsIHRoZW4gaXRzIHByb2IgYmVlbiBkZWxldGVkIGluIHZvcnRleCBhbmQgbHN4IGhhcyBhbiBleHRyYSBlbnRyeVxyXG4gICAgICBpZiAocGFrICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBhY2MucHVzaCh7XHJcbiAgICAgICAgICBpZDogcGFrLmZpbGVOYW1lLFxyXG4gICAgICAgICAgbW9kSWQ6IHBhaz8ubW9kPy5pZCxcclxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsICAgICAgICBcclxuICAgICAgICAgIG5hbWU6IHBhay5pbmZvPy5uYW1lIHx8IHBhdGguYmFzZW5hbWUocGFrLmZpbGVOYW1lLCAnLnBhaycpLFxyXG4gICAgICAgICAgZGF0YTogcGFrLmluZm8sXHJcbiAgICAgICAgICBsb2NrZWQ6IHBhay5pbmZvLmlzTGlzdGVkIGFzIExvY2tlZFN0YXRlICAgICAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGFjYztcclxuICAgIH0sIFtdKTsgICBcclxuXHJcbiAgICBsb2dEZWJ1ZygncHJvY2Vzc0xzeEZpbGUgKGJlZm9yZSBhZGRpbmcgbWlzc2luZykgbmV3TG9hZE9yZGVyPScsIG5ld0xvYWRPcmRlcik7XHJcblxyXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cclxuICAgIG1pc3NpbmcuZm9yRWFjaChwYWsgPT4ge1xyXG4gICAgICBuZXdMb2FkT3JkZXIucHVzaCh7XHJcbiAgICAgICAgaWQ6IHBhay5maWxlTmFtZSxcclxuICAgICAgICBtb2RJZDogIHBhaz8ubW9kPy5pZCxcclxuICAgICAgICBlbmFibGVkOiB0cnVlLCAgICAgICAgXHJcbiAgICAgICAgbmFtZTogcGFrLmluZm8/Lm5hbWUgfHwgcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXHJcbiAgICAgICAgZGF0YTogcGFrLmluZm8sXHJcbiAgICAgICAgbG9ja2VkOiBwYWsuaW5mby5pc0xpc3RlZCBhcyBMb2NrZWRTdGF0ZSAgICAgICAgXHJcbiAgICAgIH0pICAgICAgXHJcbiAgICB9KTsgICBcclxuXHJcbiAgICBsb2dEZWJ1ZygncHJvY2Vzc0xzeEZpbGUgKGFmdGVyIGFkZGluZyBtaXNzaW5nKSBuZXdMb2FkT3JkZXI9JywgbmV3TG9hZE9yZGVyKTtcclxuXHJcbiAgICBuZXdMb2FkT3JkZXIuc29ydCgoYSwgYikgPT4gKCtiLmxvY2tlZCAtICthLmxvY2tlZCkpO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAoYWZ0ZXIgc29ydGluZykgbmV3TG9hZE9yZGVyPScsIG5ld0xvYWRPcmRlcik7XHJcblxyXG4gICAgLy8gZ2V0IGxvYWQgb3JkZXJcclxuICAgIC8vbGV0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgICAvL2xvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBtYW51YWx5IHNldCBsb2FkIG9yZGVyP1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgbmV3TG9hZE9yZGVyKSk7XHJcblxyXG4gICAgLy91dGlsLnNldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBuZXdMb2FkT3JkZXIpO1xyXG5cclxuICAgIC8vIGdldCBsb2FkIG9yZGVyIGFnYWluP1xyXG4gICAgLy9sb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgICAvL2xvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignYmczLWxvYWRvcmRlci1pbXBvcnQtYWN0aXZpdHknKTtcclxuXHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWltcG9ydGVkJyxcclxuICAgICAgdGl0bGU6ICdMb2FkIE9yZGVyIEltcG9ydGVkJyxcclxuICAgICAgbWVzc2FnZTogbHN4UGF0aCxcclxuICAgICAgZGlzcGxheU1TOiAzMDAwXHJcbiAgICB9KTtcclxuXHJcbiAgICBsb2dEZWJ1ZygncHJvY2Vzc0xzeEZpbGUgZmluaXNoZWQnKTtcclxuXHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBcclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKE5PVElGX0lNUE9SVF9BQ1RJVklUWSk7XHJcblxyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBsb2FkIG9yZGVyJywgZXJyLCB7XHJcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlcGF0aDogc3RyaW5nKSB7XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuXHJcbiAgLy8gZ2V0IGxvYWQgb3JkZXIgZnJvbSBzdGF0ZVxyXG4gIGNvbnN0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcblxyXG4gIGxvZ0RlYnVnKCdleHBvcnRUbyBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIHJlYWQgdGhlIGdhbWUgYmczIG1vZHNldHRpbmdzLmxzeCBzbyB0aGF0IHdlIGdldCB0aGUgZGVmYXVsdCBnYW1lIGd1c3RhdiB0aGluZz9cclxuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XHJcbiAgICBjb25zdCBtb2RTZXR0aW5nc0Zvcm1hdCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xyXG5cclxuICAgIC8vIGJ1aWxkdXAgb2JqZWN0IGZyb20geG1sXHJcbiAgICBjb25zdCByZWdpb24gPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcclxuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XHJcbiAgICBjb25zdCBtb2RzTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XHJcblxyXG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xyXG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRyb3AgYWxsIG5vZGVzIGV4Y2VwdCBmb3IgdGhlIGdhbWUgZW50cnlcclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTm9kZXMgPSBtb2RzTm9kZT8uY2hpbGRyZW4/LlswXT8ubm9kZT8uZmlsdGVyPy4oaXRlciA9PlxyXG4gICAgICBpdGVyLmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ05hbWUnKSAmJiAoYXR0ci4kLnZhbHVlID09PSAnR3VzdGF2RGV2JykpKSA/PyBbXTtcclxuXHJcbiAgICBjb25zdCBmaWx0ZXJlZFBha3MgPSBsb2FkT3JkZXIuZmlsdGVyKGVudHJ5ID0+ICEhZW50cnkuZGF0YT8udXVpZFxyXG4gICAgICAgICAgICAgICAgICAgICYmIGVudHJ5LmVuYWJsZWRcclxuICAgICAgICAgICAgICAgICAgICAmJiAhZW50cnkuZGF0YT8uaXNMaXN0ZWQpO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdleHBvcnRUbyBmaWx0ZXJlZFBha3M9JywgZmlsdGVyZWRQYWtzKTtcclxuXHJcbiAgICAvLyBhZGQgbmV3IG5vZGVzIGZvciB0aGUgZW5hYmxlZCBtb2RzXHJcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZpbHRlcmVkUGFrcykge1xyXG4gICAgICAvLyBjb25zdCBtZDUgPSBhd2FpdCB1dGlsLmZpbGVNRDUocGF0aC5qb2luKG1vZHNQYXRoKCksIGtleSkpO1xyXG5cclxuICAgICAgLypcclxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiRm9sZGVyXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJDbGFzc0FkZGl0aW9uc19jNGZjM2RjMC0zMjIyLWNmM2ItNThjZC1jY2NlOGNlNGM4ZjVcIi8+XHJcbiAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk1ENVwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiZDY3OGFlYjU0YzZjMTQ5NmMwZWFlNzFjZTAzM2U5ZmJcIi8+XHJcbiAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIk5hbWVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cIklsb25pYXMgQ2hhbmdlc1wiLz5cclxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiUHVibGlzaEhhbmRsZVwiIHR5cGU9XCJ1aW50NjRcIiB2YWx1ZT1cIjQzMjUyODVcIi8+XHJcbiAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlVVSURcIiB0eXBlPVwiZ3VpZFwiIHZhbHVlPVwiYzRmYzNkYzAtMzIyMi1jZjNiLTU4Y2QtY2NjZThjZTRjOGY1XCIvPlxyXG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJWZXJzaW9uNjRcIiB0eXBlPVwiaW50NjRcIiB2YWx1ZT1cIjM2MDI4Nzk3MDE4OTYzOTcwXCIvPlxyXG4gICAgICAqL1xyXG5cclxuICAgICAgY29uc3QgYXR0cmlidXRlT3JkZXIgPSBbJ0ZvbGRlcicsICdNRDUnLCAnTmFtZScsICdQdWJsaXNoSGFuZGxlJywgJ1VVSUQnLCAnVmVyc2lvbjY0JywgJ1ZlcnNpb24nXTtcclxuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IChtb2RTZXR0aW5nc0Zvcm1hdCA9PT0gJ3Y3JylcclxuICAgICAgICA/IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLmZvbGRlciB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdOYW1lJywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6IGVudHJ5LmRhdGEubmFtZSB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdQdWJsaXNoSGFuZGxlJywgdHlwZTogJ3VpbnQ2NCcsIHZhbHVlOiAwIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb242NCcsIHR5cGU6ICdpbnQ2NCcsIHZhbHVlOiBlbnRyeS5kYXRhLnZlcnNpb24gfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdndWlkJywgdmFsdWU6IGVudHJ5LmRhdGEudXVpZCB9IH0sXHJcbiAgICAgICAgXSA6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5mb2xkZXIgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm5hbWUgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLnV1aWQgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVmVyc2lvbicsIHR5cGU6ICdpbnQzMicsIHZhbHVlOiBlbnRyeS5kYXRhLnZlcnNpb24gfSB9LFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xyXG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXHJcbiAgICAgICAgYXR0cmlidXRlOiBbXS5jb25jYXQoYXR0cmlidXRlcywgW3sgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm1kNSB9IH1dKVxyXG4gICAgICAgICAgLnNvcnQoIChhLCBiKSA9PiBhdHRyaWJ1dGVPcmRlci5pbmRleE9mKGEuJC5pZCkgLSBhdHRyaWJ1dGVPcmRlci5pbmRleE9mKGIuJC5pZCkpLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGZpbHRlcmVkUGFrc1xyXG4gICAgICAvLy5zb3J0KChsaHMsIHJocykgPT4gbGhzLnBvcyAtIHJocy5wb3MpIC8vIGRvbid0IGtub3cgaWYgd2UgbmVlZCB0aGlzIG5vd1xyXG4gICAgICAubWFwKChlbnRyeSk6IElNb2ROb2RlID0+ICh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS51dWlkIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XHJcbiAgICBpZiAobW9kU2V0dGluZ3NGb3JtYXQgIT09ICd2NycpIHtcclxuICAgICAgbGV0IG1vZE9yZGVyTm9kZTogSVJvb3ROb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcbiAgICAgIGxldCBpbnNlcnROb2RlID0gZmFsc2U7XHJcbiAgICAgIGlmICghbW9kT3JkZXJOb2RlKSB7XHJcbiAgICAgICAgaW5zZXJ0Tm9kZSA9IHRydWU7XHJcbiAgICAgICAgbW9kT3JkZXJOb2RlID0geyAkOiB7IGlkOiAnTW9kT3JkZXInIH0sIGNoaWxkcmVuOiBbeyBub2RlOiBbXSB9XSB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKChtb2RPcmRlck5vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChtb2RPcmRlck5vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XHJcbiAgICAgICAgbW9kT3JkZXJOb2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XHJcbiAgICAgIH1cclxuICAgICAgbW9kT3JkZXJOb2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBsb2FkT3JkZXJOb2RlcztcclxuICAgICAgaWYgKGluc2VydE5vZGUgJiYgISFyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlKSB7XHJcbiAgICAgICAgcm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZS5zcGxpY2UoMCwgMCwgbW9kT3JkZXJOb2RlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncywgZmlsZXBhdGgpO1xyXG4gICAgXHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWV4cG9ydGVkJyxcclxuICAgICAgdGl0bGU6ICdMb2FkIE9yZGVyIEV4cG9ydGVkJyxcclxuICAgICAgbWVzc2FnZTogZmlsZXBhdGgsXHJcbiAgICAgIGRpc3BsYXlNUzogMzAwMFxyXG4gICAgfSk7XHJcblxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgfSAgXHJcblxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG9GaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcclxuXHJcbiAgbGV0IHNlbGVjdGVkUGF0aDpzdHJpbmc7XHJcblxyXG4gIC8vIGFuIG9sZGVyIHZlcnNpb24gb2YgVm9ydGV4IG1pZ2h0IG5vdCBoYXZlIHRoZSB1cGRhdGVkIGFwaS5zYXZlRmlsZSBmdW5jdGlvbiBzbyB3aWxsIGZhbGxiYWNrXHJcbiAgLy8gdG8gdGhlIHByZXZpb3VzIGhhY2sgam9iIG9mIHNlbGVjdEZpbGUgYnV0IGFjdHVhbGx5IHdyaXRlc1xyXG4gIFxyXG4gIGlmKGFwaS5zYXZlRmlsZSAhPT0gdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uczogSVNhdmVPcHRpb25zID0ge1xyXG4gICAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gZXhwb3J0IHRvJyksXHJcbiAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzMgTG9hZCBPcmRlcicsIGV4dGVuc2lvbnM6IFsnbHN4J10gfV0sICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHNlbGVjdGVkUGF0aCA9IGF3YWl0IGFwaS5zYXZlRmlsZShvcHRpb25zKTsgICAgXHJcblxyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uczogSU9wZW5PcHRpb25zID0ge1xyXG4gICAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gZXhwb3J0IHRvJyksXHJcbiAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzMgTG9hZCBPcmRlcicsIGV4dGVuc2lvbnM6IFsnbHN4J10gfV0sXHJcbiAgICAgIGNyZWF0ZTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICBzZWxlY3RlZFBhdGggPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIGxvZ0RlYnVnKGBleHBvcnRUb0ZpbGUgJHtzZWxlY3RlZFBhdGh9YCk7XHJcblxyXG4gIC8vIGlmIG5vIHBhdGggc2VsZWN0ZWQsIHRoZW4gY2FuY2VsIHByb2JhYmx5IHByZXNzZWRcclxuICBpZihzZWxlY3RlZFBhdGggPT09IHVuZGVmaW5lZClcclxuICAgIHJldHVybjtcclxuXHJcbiAgZXhwb3J0VG8oYXBpLCBzZWxlY3RlZFBhdGgpO1xyXG59XHJcbiAgXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRUb0dhbWUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xyXG5cclxuICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3Qgc2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBsb2dEZWJ1ZyhgZXhwb3J0VG9HYW1lICR7c2V0dGluZ3NQYXRofWApO1xyXG5cclxuICBleHBvcnRUbyhhcGksIHNldHRpbmdzUGF0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWVwUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuXHJcbiAgLy8gZ2V0IGxvYWQgb3JkZXIgZnJvbSBzdGF0ZVxyXG4gIGNvbnN0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcblxyXG4gIGxvZ0RlYnVnKCdkZWVwUmVmcmVzaCcsIGxvYWRPcmRlcik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IGJnM1Byb2ZpbGVJZCA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBzZXR0aW5nc1BhdGg6IHN0cmluZyA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczUHJvZmlsZUlkLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZXR0aW5nc1BhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICBsb2dEZWJ1ZygncmVhZE1vZFNldHRpbmdzJywgZGF0KTtcclxuICByZXR1cm4gcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRMc3hGaWxlKGxzeFBhdGg6IHN0cmluZyk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgXHJcbiAgLy9jb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksICdQdWJsaWMnLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsc3hQYXRoKTtcclxuICBsb2dEZWJ1ZygnbHN4UGF0aCcsIGRhdCk7XHJcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBmaWxlcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XHJcbiAgY29uc3QgYnVpbGRlciA9IChmb3JtYXQgPT09ICd2NycpXHJcbiAgICA/IG5ldyBCdWlsZGVyKHsgcmVuZGVyT3B0czogeyBwcmV0dHk6IHRydWUsIGluZGVudDogJyAgICAnIH19KVxyXG4gICAgOiBuZXcgQnVpbGRlcigpO1xyXG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGZpbGVwYXRoKSk7XHJcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhmaWxlcGF0aCwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2Qgc2V0dGluZ3MnLCBlcnIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IHR5cGVzLkxvYWRPcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8YW55PiB7XHJcbiAgLy8gTm90aGluZyB0byB2YWxpZGF0ZSByZWFsbHkgLSB0aGUgZ2FtZSBkb2VzIG5vdCByZWFkIG91ciBsb2FkIG9yZGVyIGZpbGVcclxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcclxuICAvLyAgcmV0dXJuLlxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRQQUtzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgOiBQcm9taXNlPEFycmF5PElDYWNoZUVudHJ5Pj4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbHNMaWIgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xyXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS0xpc3QoYXBpKTtcclxuXHJcbiAgLy8gbG9nRGVidWcoJ3Bha3MnLCBwYWtzKTtcclxuXHJcbiAgbGV0IG1hbmlmZXN0O1xyXG4gIHRyeSB7XHJcbiAgICBtYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCAnJywgR0FNRV9JRCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgZGVwbG95bWVudCBtYW5pZmVzdCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIGlkOiAnYmczLXJlYWRpbmctcGFrcy1hY3Rpdml0eScsXHJcbiAgICBtZXNzYWdlOiAnUmVhZGluZyBQQUsgZmlsZXMuIFRoaXMgbWlnaHQgdGFrZSBhIHdoaWxlLi4uJyxcclxuICB9KVxyXG4gIGNvbnN0IGNhY2hlOiBQYWtJbmZvQ2FjaGUgPSBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoYXBpKTtcclxuICBjb25zdCByZXMgPSBhd2FpdCBQcm9taXNlLmFsbChwYWtzLm1hcChhc3luYyAoZmlsZU5hbWUsIGlkeCkgPT4ge1xyXG4gICAgcmV0dXJuIHV0aWwud2l0aEVycm9yQ29udGV4dCgncmVhZGluZyBwYWsnLCBmaWxlTmFtZSwgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmdW5jID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBtYW5pZmVzdEVudHJ5ID0gbWFuaWZlc3QuZmlsZXMuZmluZChlbnRyeSA9PiBlbnRyeS5yZWxQYXRoID09PSBmaWxlTmFtZSk7XHJcbiAgICAgICAgICBjb25zdCBtb2QgPSAobWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICA/IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXT8uW21hbmlmZXN0RW50cnkuc291cmNlXVxyXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICBjb25zdCBwYWtQYXRoID0gcGF0aC5qb2luKG1vZHNQYXRoKCksIGZpbGVOYW1lKTtcclxuICAgICAgICAgIHJldHVybiBjYWNoZS5nZXRDYWNoZUVudHJ5KGFwaSwgcGFrUGF0aCwgbW9kKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEaXZpbmVFeGVjTWlzc2luZykge1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gJ1RoZSBpbnN0YWxsZWQgY29weSBvZiBMU0xpYi9EaXZpbmUgaXMgY29ycnVwdGVkIC0gcGxlYXNlICdcclxuICAgICAgICAgICAgICArICdkZWxldGUgdGhlIGV4aXN0aW5nIExTTGliIG1vZCBlbnRyeSBhbmQgcmUtaW5zdGFsbCBpdC4gTWFrZSBzdXJlIHRvICdcclxuICAgICAgICAgICAgICArICdkaXNhYmxlIG9yIGFkZCBhbnkgbmVjZXNzYXJ5IGV4Y2VwdGlvbnMgdG8geW91ciBzZWN1cml0eSBzb2Z0d2FyZSB0byAnXHJcbiAgICAgICAgICAgICAgKyAnZW5zdXJlIGl0IGRvZXMgbm90IGludGVyZmVyZSB3aXRoIFZvcnRleC9MU0xpYiBmaWxlIG9wZXJhdGlvbnMuJztcclxuICAgICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRGl2aW5lIGV4ZWN1dGFibGUgaXMgbWlzc2luZycsIG1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBjb3VsZCBoYXBwZW4gaWYgdGhlIGZpbGUgZ290IGRlbGV0ZWQgc2luY2UgcmVhZGluZyB0aGUgbGlzdCBvZiBwYWtzLlxyXG4gICAgICAgICAgLy8gYWN0dWFsbHksIHRoaXMgc2VlbXMgdG8gYmUgZmFpcmx5IGNvbW1vbiB3aGVuIHVwZGF0aW5nIGEgbW9kXHJcbiAgICAgICAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhay4gUGxlYXNlIG1ha2Ugc3VyZSB5b3UgYXJlIHVzaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBMU0xpYiBieSB1c2luZyB0aGUgXCJSZS1pbnN0YWxsIExTTGliL0RpdmluZVwiIHRvb2xiYXIgYnV0dG9uIG9uIHRoZSBNb2RzIHBhZ2UuJywgZXJyLCB7XHJcbiAgICAgICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGZpbGVOYW1lLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKCkpO1xyXG4gICAgfSk7XHJcbiAgfSkpO1xyXG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtcmVhZGluZy1wYWtzLWFjdGl2aXR5Jyk7XHJcblxyXG4gIHJldHVybiByZXMuZmlsdGVyKGl0ZXIgPT4gaXRlciAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS0xpc3QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xyXG4gIHRyeSB7XHJcbiAgICBwYWtzID0gKGF3YWl0IGZzLnJlYWRkaXJBc3luYyhtb2RzUGF0aCgpKSlcclxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCgpLCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIG5vcFxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzIGRpcmVjdG9yeScsIGVyciwge1xyXG4gICAgICAgIGlkOiAnYmczLWZhaWxlZC1yZWFkLW1vZHMnLFxyXG4gICAgICAgIG1lc3NhZ2U6IG1vZHNQYXRoKCksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcGFrcyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBha3M7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExhdGVzdExTTGliTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHN0YXRlLnBlcnNpc3RlbnQubW9kc1tHQU1FX0lEXTtcclxuICBpZiAobW9kcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBsYXRlc3RWZXIgPSB1dGlsLmdldFNhZmUocHJldiwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmIChzZW12ZXIuZ3QoY3VycmVudFZlciwgbGF0ZXN0VmVyKSkge1xyXG4gICAgICAgICAgcHJldiA9IG1vZHNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgbW9kIHZlcnNpb24nLCB7IG1vZElkOiBpZCwgdmVyc2lvbjogY3VycmVudFZlciB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGxzTGliO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuUHJvcHMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIHByb2ZpbGVJZD86IHN0cmluZyk6IElQcm9wcyB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IChwcm9maWxlSWQgIT09IHVuZGVmaW5lZClcclxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXHJcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuXHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICByZXR1cm4geyBhcGksIHN0YXRlLCBwcm9maWxlLCBtb2RzLCBkaXNjb3ZlcnkgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUxPRmlsZShjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XHJcbiAgfVxyXG5cclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0YXJnZXRQYXRoID0gbG9hZE9yZGVyRmlsZVBhdGgocHJvcHMucHJvZmlsZS5pZCk7XHJcbiAgdHJ5IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyh0YXJnZXRQYXRoKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH0gICAgXHJcbiAgXHJcbiAgXHJcbiAgcmV0dXJuIHRhcmdldFBhdGg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkT3JkZXJGaWxlUGF0aChwcm9maWxlSWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ3VzZXJEYXRhJyksIEdBTUVfSUQsIHByb2ZpbGVJZCArICdfJyArIExPX0ZJTEVfTkFNRSk7XHJcbn1cclxuXHJcbiJdfQ==