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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.serialize = serialize;
exports.deserialize = deserialize;
exports.importFromBG3MM = importFromBG3MM;
exports.importModSettingsFile = importModSettingsFile;
exports.importModSettingsGame = importModSettingsGame;
exports.getNodes = getNodes;
exports.processLsxFile = processLsxFile;
exports.exportToFile = exportToFile;
exports.exportToGame = exportToGame;
exports.deepRefresh = deepRefresh;
exports.validate = validate;
exports.genProps = genProps;
exports.ensureLOFile = ensureLOFile;
exports.loadOrderFilePath = loadOrderFilePath;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function deserialize(context) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function importFromBG3MM(context) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function importModSettingsFile(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function importModSettingsGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
        const gameSettingsPath = path_1.default.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
        (0, util_1.logDebug)('importModSettingsGame gameSettingsPath=', gameSettingsPath);
        processLsxFile(api, gameSettingsPath);
    });
}
function checkIfDuplicateExists(arr) {
    return new Set(arr).size !== arr.length;
}
function getAttribute(node, name, fallback) {
    var _a, _b, _c;
    return (_c = (_b = (_a = (0, util_1.findNode)(node === null || node === void 0 ? void 0 : node.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback;
}
function processBG3MMFile(api, jsonPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const lsxLoadOrder = yield readLsxFile(lsxPath);
        (0, util_1.logDebug)('processLsxFile lsxPath=', lsxPath);
        const region = (0, util_1.findNode)((_a = lsxLoadOrder === null || lsxLoadOrder === void 0 ? void 0 : lsxLoadOrder.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const root = (0, util_1.findNode)(region === null || region === void 0 ? void 0 : region.node, 'root');
        const modsNode = (0, util_1.findNode)((_c = (_b = root === null || root === void 0 ? void 0 : root.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'Mods');
        const modsOrderNode = (0, util_1.findNode)((_e = (_d = root === null || root === void 0 ? void 0 : root.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'ModOrder');
        return { region, root, modsNode, modsOrderNode };
    });
}
function processLsxFile(api, lsxPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
            let loNode = ['v7', 'v8'].includes(format) ? modsNode : modsOrderNode !== undefined ? modsOrderNode : modsNode;
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
            api.store.dispatch(vortex_api_1.actions.setFBLoadOrder(profileId, newLoadOrder));
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
function exportTo(api, filepath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
            const descriptionNodes = (_j = (_h = (_g = (_f = (_e = modsNode === null || modsNode === void 0 ? void 0 : modsNode.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node) === null || _g === void 0 ? void 0 : _g.filter) === null || _h === void 0 ? void 0 : _h.call(_g, iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value.startsWith('Gustav'))))) !== null && _j !== void 0 ? _j : [];
            const filteredPaks = loadOrder.filter(entry => {
                var _a, _b;
                return !!((_a = entry.data) === null || _a === void 0 ? void 0 : _a.uuid)
                    && entry.enabled
                    && !((_b = entry.data) === null || _b === void 0 ? void 0 : _b.isListed);
            });
            (0, util_1.logDebug)('exportTo filteredPaks=', filteredPaks);
            for (const entry of filteredPaks) {
                const attributeOrder = ['Folder', 'MD5', 'Name', 'PublishHandle', 'UUID', 'Version64', 'Version'];
                const attributes = (['v7', 'v8'].includes(modSettingsFormat))
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
            if (!['v7', 'v8'].includes(modSettingsFormat)) {
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
function exportToGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
        (0, util_1.logDebug)(`exportToGame ${settingsPath}`);
        exportTo(api, settingsPath);
    });
}
function deepRefresh(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
        (0, util_1.logDebug)('deepRefresh', loadOrder);
    });
}
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
        const builder = (['v7', 'v8'].includes(format))
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
function loadOrderFilePath(profileId) {
    return path_1.default.join(vortex_api_1.util.getVortexPath('userData'), common_1.GAME_ID, profileId + '_' + common_1.LO_FILE_NAME);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLDhCQStCQztBQUVELGtDQStGQztBQUVELDBDQW9DQztBQUVELHNEQW1CQztBQUVELHNEQVFDO0FBZ0NELDRCQVdDO0FBRUQsd0NBOEpDO0FBb0hELG9DQWtDQztBQUVELG9DQVFDO0FBRUQsa0NBU0M7QUFpQ0QsNEJBTUM7QUF5SEQsNEJBbUJDO0FBRUQsb0NBd0JDO0FBRUQsOENBRUM7QUE1eEJELDJDQUFzRTtBQUN0RSxnREFBd0I7QUFDeEIsK0NBQWlDO0FBQ2pDLHdEQUFnQztBQUVoQyxxQ0FBd0U7QUFFeEUsbUNBQW9FO0FBSXBFLG1EQUFvRDtBQUNwRCxpQ0FBMEo7QUFFMUosb0RBQW9EO0FBRXBELFNBQXNCLFNBQVMsQ0FBQyxPQUFnQyxFQUNoQyxTQUEwQixFQUMxQixTQUFrQjs7O1FBQ2hELE1BQU0sS0FBSyxHQUFXLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN4QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBR3JDLE1BQU0sVUFBVSxHQUFHLE1BQU0sWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFHakUsSUFBQSxlQUFRLEVBQUMsc0JBQXNCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFHNUMsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFB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Q0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUM7WUFDSCxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNiLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBR0QsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztDQUFBO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsU0FBaUI7SUFDakQsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFLGdCQUFPLEVBQUUsU0FBUyxHQUFHLEdBQUcsR0FBRyxxQkFBWSxDQUFDLENBQUM7QUFDNUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgTE9fRklMRV9OQU1FLCBOT1RJRl9JTVBPUlRfQUNUSVZJVFkgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IEJHM1BhaywgSU1vZE5vZGUsIElNb2RTZXR0aW5ncywgSVByb3BzLCBJUm9vdE5vZGUgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgQnVpbGRlciwgcGFyc2VTdHJpbmdQcm9taXNlLCBSZW5kZXJPcHRpb25zIH0gZnJvbSAneG1sMmpzJztcclxuaW1wb3J0IHsgTG9ja2VkU3RhdGUgfSBmcm9tICd2b3J0ZXgtYXBpL2xpYi9leHRlbnNpb25zL2ZpbGVfYmFzZWRfbG9hZG9yZGVyL3R5cGVzL3R5cGVzJztcclxuaW1wb3J0IHsgSU9wZW5PcHRpb25zLCBJU2F2ZU9wdGlvbnMgfSBmcm9tICd2b3J0ZXgtYXBpL2xpYi90eXBlcy9JRXh0ZW5zaW9uQ29udGV4dCc7XHJcblxyXG5pbXBvcnQgeyBEaXZpbmVFeGVjTWlzc2luZyB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XHJcbmltcG9ydCB7IGZpbmROb2RlLCBmb3JjZVJlZnJlc2gsIGdldEFjdGl2ZVBsYXllclByb2ZpbGUsIGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdCwgZ2V0UGxheWVyUHJvZmlsZXMsIGxvZ0RlYnVnLCBtb2RzUGF0aCwgcHJvZmlsZXNQYXRoIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCBQYWtJbmZvQ2FjaGUsIHsgSUNhY2hlRW50cnkgfSBmcm9tICcuL2NhY2hlJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdpbnZhbGlkIHByb3BzJykpO1xyXG4gIH1cclxuICBcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcblxyXG4gIC8vIE1ha2Ugc3VyZSB0aGUgTE8gZmlsZSBpcyBjcmVhdGVkIGFuZCByZWFkeSB0byBiZSB3cml0dGVuIHRvLlxyXG4gIGNvbnN0IGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCwgcHJvZmlsZUlkLCBwcm9wcyk7XHJcbiAgLy9jb25zdCBmaWx0ZXJlZExPID0gbG9hZE9yZGVyLmZpbHRlcihsbyA9PiAoIUlOVkFMSURfTE9fTU9EX1RZUEVTLmluY2x1ZGVzKHByb3BzLm1vZHM/Lltsbz8ubW9kSWRdPy50eXBlKSkpO1xyXG5cclxuICBsb2dEZWJ1Zygnc2VyaWFsaXplIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xyXG5cclxuICAvLyBXcml0ZSB0aGUgcHJlZml4ZWQgTE8gdG8gZmlsZS5cclxuICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsb0ZpbGVQYXRoKS5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhsb0ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShsb2FkT3JkZXIpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcblxyXG4gIC8vIGNoZWNrIHRoZSBzdGF0ZSBmb3IgaWYgd2UgYXJlIGtlZXBpbmcgdGhlIGdhbWUgb25lIGluIHN5bmNcclxuICAvLyBpZiB3ZSBhcmUgd3JpdGluZyB2b3J0ZXgncyBsb2FkIG9yZGVyLCB0aGVuIHdlIHdpbGwgYWxzbyB3cml0ZSB0aGUgZ2FtZXMgb25lXHJcblxyXG4gIGNvbnN0IGF1dG9FeHBvcnRUb0dhbWU6Ym9vbGVhbiA9IHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXS5hdXRvRXhwb3J0TG9hZE9yZGVyID8/IGZhbHNlO1xyXG5cclxuICBsb2dEZWJ1Zygnc2VyaWFsaXplIGF1dG9FeHBvcnRUb0dhbWU9JywgYXV0b0V4cG9ydFRvR2FtZSk7XHJcblxyXG4gIGlmKGF1dG9FeHBvcnRUb0dhbWUpIFxyXG4gICAgYXdhaXQgZXhwb3J0VG9HYW1lKGNvbnRleHQuYXBpKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBQcm9taXNlPHR5cGVzLkxvYWRPcmRlcj4ge1xyXG4gIFxyXG4gIC8vIGdlblByb3BzIGlzIGEgc21hbGwgdXRpbGl0eSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIG9mdGVuIHJlLXVzZWQgb2JqZWN0c1xyXG4gIC8vICBzdWNoIGFzIHRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdGFsbGVkIE1vZHMsIFZvcnRleCdzIGFwcGxpY2F0aW9uIHN0YXRlLFxyXG4gIC8vICB0aGUgY3VycmVudGx5IGFjdGl2ZSBwcm9maWxlLCBldGMuXHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcz8ucHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBXaHkgYXJlIHdlIGRlc2VyaWFsaXppbmcgd2hlbiB0aGUgcHJvZmlsZSBpcyBpbnZhbGlkIG9yIGJlbG9uZ3MgdG8gYW5vdGhlciBnYW1lID9cclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgXHJcbiAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtzKGNvbnRleHQuYXBpKTtcclxuXHJcbiAgLy8gY3JlYXRlIGlmIG5lY2Vzc2FyeSwgYnV0IGxvYWQgdGhlIGxvYWQgb3JkZXIgZnJvbSBmaWxlICAgIFxyXG4gIGNvbnN0IGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuXHJcbiAgbGV0IGxvYWRPcmRlcjogdHlwZXMuSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgbG9hZE9yZGVyID0gSlNPTi5wYXJzZShmaWxlRGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nKCdlcnJvcicsICdDb3JydXB0IGxvYWQgb3JkZXIgZmlsZScsIGVycik7XHJcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBwcm9wcy5hcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnQ29ycnVwdCBsb2FkIG9yZGVyIGZpbGUnLCB7XHJcbiAgICAgICAgICBiYmNvZGU6IHByb3BzLmFwaS50cmFuc2xhdGUoJ1RoZSBsb2FkIG9yZGVyIGZpbGUgaXMgaW4gYSBjb3JydXB0IHN0YXRlLiBZb3UgY2FuIHRyeSB0byBmaXggaXQgeW91cnNlbGYgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdvciBWb3J0ZXggY2FuIHJlZ2VuZXJhdGUgdGhlIGZpbGUgZm9yIHlvdSwgYnV0IHRoYXQgbWF5IHJlc3VsdCBpbiBsb3NzIG9mIGRhdGEgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyhXaWxsIG9ubHkgYWZmZWN0IGxvYWQgb3JkZXIgaXRlbXMgeW91IGFkZGVkIG1hbnVhbGx5LCBpZiBhbnkpLicpXHJcbiAgICAgICAgfSwgW1xyXG4gICAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gcmVqZWN0KGVycikgfSxcclxuICAgICAgICAgIHsgbGFiZWw6ICdSZWdlbmVyYXRlIEZpbGUnLCBhY3Rpb246IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsb0ZpbGVQYXRoKS5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICAgICAgICAgICAgICBsb2FkT3JkZXIgPSBbXTtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSlcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBmaWx0ZXIgb3V0IGFueSBwYWsgZmlsZXMgdGhhdCBubyBsb25nZXIgZXhpc3RcclxuICAgIGNvbnN0IGZpbHRlcmVkTG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIgPSBsb2FkT3JkZXIuZmlsdGVyKGVudHJ5ID0+IHBha3MuZmluZChwYWsgPT4gcGFrLmZpbGVOYW1lID09PSBlbnRyeS5pZCkpO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBmaWx0ZXJlZExvYWRPcmRlcj0nLCBmaWx0ZXJlZExvYWRPcmRlcik7XHJcblxyXG4gICAgLy8gZmlsdGVyIG91dCBwYWsgZmlsZXMgdGhhdCBkb24ndCBoYXZlIGEgY29ycmVzcG9uZGluZyBtb2QgKHdoaWNoIG1lYW5zIFZvcnRleCBkaWRuJ3QgaW5zdGFsbCBpdC9pc24ndCBhd2FyZSBvZiBpdClcclxuICAgIC8vY29uc3QgcGFrc1dpdGhNb2RzOkJHM1Bha1tdID0gcGFrcy5maWx0ZXIocGFrID0+IHBhay5tb2QgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gICAgICAvLyBnbyB0aHJvdWdoIGVhY2ggcGFrIGZpbGUgaW4gdGhlIE1vZHMgZm9sZGVyLi4uXHJcbiAgICBjb25zdCBwcm9jZXNzZWRQYWtzID0gcGFrcy5yZWR1Y2UoKGFjYywgY3VycikgPT4geyAgICAgICAgICAgIFxyXG4gICAgICBhY2MudmFsaWQucHVzaChjdXJyKTtcclxuICAgICAgcmV0dXJuIGFjYztcclxuICAgIH0sIHsgdmFsaWQ6IFtdLCBpbnZhbGlkOiBbXSB9KTtcclxuXHJcbiAgICBsb2dEZWJ1ZygnZGVzZXJpYWxpemUgcHJvY2Vzc2VkUGFrcz0nLCBwcm9jZXNzZWRQYWtzKTtcclxuXHJcbiAgICAvLyBnZXQgYW55IHBhayBmaWxlcyB0aGF0IGFyZW4ndCBpbiB0aGUgZmlsdGVyZWRMb2FkT3JkZXJcclxuICAgIGNvbnN0IGFkZGVkTW9kczogQkczUGFrW10gPSBwcm9jZXNzZWRQYWtzLnZhbGlkLmZpbHRlcihwYWsgPT4gZmlsdGVyZWRMb2FkT3JkZXIuZmluZChlbnRyeSA9PiBlbnRyeS5pZCA9PT0gcGFrLmZpbGVOYW1lKSA9PT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgICBsb2dEZWJ1ZygnZGVzZXJpYWxpemUgYWRkZWRNb2RzPScsIGFkZGVkTW9kcyk7XHJcbiAgICBcclxuICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIGFkZGVkIGFueSBuZXcgbW9kcy5cclxuICAgIC8vY29uc3QgZGlmZiA9IGVuYWJsZWRNb2RJZHMuZmlsdGVyKGlkID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMobW9kc1tpZF0/LnR5cGUpKVxyXG4gICAgLy8gICYmIChmaWx0ZXJlZERhdGEuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IGlkKSA9PT0gdW5kZWZpbmVkKSk7XHJcblxyXG4gICAgbG9nRGVidWcoJ2Rlc2VyaWFsaXplIHBha3M9JywgcGFrcyk7XHJcblxyXG5cclxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXHJcbiAgICBhZGRlZE1vZHMuZm9yRWFjaChwYWsgPT4ge1xyXG4gICAgICBmaWx0ZXJlZExvYWRPcmRlci5wdXNoKHtcclxuICAgICAgICBpZDogcGFrLmZpbGVOYW1lLFxyXG4gICAgICAgIG1vZElkOiBwYWsubW9kPy5pZCxcclxuICAgICAgICBlbmFibGVkOiB0cnVlLCAgLy8gbm90IHVzaW5nIGxvYWQgb3JkZXIgZm9yIGVuYWJsaW5nL2Rpc2FibGluZyAgICAgIFxyXG4gICAgICAgIG5hbWU6IHBhay5pbmZvPy5uYW1lIHx8IHBhdGguYmFzZW5hbWUocGFrLmZpbGVOYW1lLCAnLnBhaycpLFxyXG4gICAgICAgIGRhdGE6IHBhay5pbmZvLFxyXG4gICAgICAgIGxvY2tlZDogcGFrLmluZm8uaXNMaXN0ZWQgYXMgTG9ja2VkU3RhdGUgICAgICAgIFxyXG4gICAgICB9KSAgICAgIFxyXG4gICAgfSk7ICAgICAgIFxyXG5cclxuICAgIC8vbG9nRGVidWcoJ2Rlc2VyaWFsaXplIGZpbHRlcmVkRGF0YT0nLCBmaWx0ZXJlZERhdGEpO1xyXG5cclxuICAgIC8vIHNvcnRlZCBzbyB0aGF0IGFueSBtb2RzIHRoYXQgYXJlIGxvY2tlZCBhcHBlYXIgYXQgdGhlIHRvcFxyXG4gICAgLy9jb25zdCBzb3J0ZWRBbmRGaWx0ZXJlZERhdGEgPSBcclxuICAgIFxyXG4gICAgLy8gcmV0dXJuXHJcbiAgICByZXR1cm4gZmlsdGVyZWRMb2FkT3JkZXIuc29ydCgoYSwgYikgPT4gKCtiLmxvY2tlZCAtICthLmxvY2tlZCkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0RnJvbUJHM01NKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XHJcbiAgY29uc3Qgb3B0aW9uczogSU9wZW5PcHRpb25zID0ge1xyXG4gICAgdGl0bGU6IGFwaS50cmFuc2xhdGUoJ1BsZWFzZSBjaG9vc2UgYSBCRzNNTSAuanNvbiBsb2FkIG9yZGVyIGZpbGUgdG8gaW1wb3J0IGZyb20nKSxcclxuICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzNNTSBMb2FkIE9yZGVyJywgZXh0ZW5zaW9uczogWydqc29uJ10gfV1cclxuICB9O1xyXG5cclxuICBjb25zdCBzZWxlY3RlZFBhdGg6c3RyaW5nID0gYXdhaXQgYXBpLnNlbGVjdEZpbGUob3B0aW9ucyk7XHJcblxyXG4gIGxvZ0RlYnVnKCdpbXBvcnRGcm9tQkczTU0gc2VsZWN0ZWRQYXRoPScsIHNlbGVjdGVkUGF0aCk7XHJcbiAgXHJcbiAgLy8gaWYgbm8gcGF0aCBzZWxlY3RlZCwgdGhlbiBjYW5jZWwgcHJvYmFibHkgcHJlc3NlZFxyXG4gIGlmKHNlbGVjdGVkUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoc2VsZWN0ZWRQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBsb2FkT3JkZXI6IGFueVtdID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgIGxvZ0RlYnVnKCdpbXBvcnRGcm9tQkczTU0gbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XHJcblxyXG4gICAgY29uc3QgZ2V0SW5kZXggPSAodXVpZDogc3RyaW5nKTogbnVtYmVyID0+IHtcclxuICAgICAgY29uc3QgaW5kZXggPSBsb2FkT3JkZXIuZmluZEluZGV4KGVudHJ5ID0+IGVudHJ5LlVVSUQgIT09IHVuZGVmaW5lZCAmJiBlbnRyeS5VVUlEID09PSB1dWlkKTtcclxuICAgICAgcmV0dXJuIGluZGV4ICE9PSAtMSA/IGluZGV4IDogSW5maW5pdHk7IC8vIElmIFVVSUQgbm90IGZvdW5kLCBwdXQgaXQgYXQgdGhlIGVuZFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuICAgIGNvbnN0IGN1cnJlbnRMb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgICBjb25zdCBuZXdMTyA9IFsuLi5jdXJyZW50TG9hZE9yZGVyXS5zb3J0KChhLCBiKSA9PiBnZXRJbmRleChhLmRhdGE/LnV1aWQpIC0gZ2V0SW5kZXgoYi5kYXRhPy51dWlkKSk7XHJcbiAgICBhd2FpdCBzZXJpYWxpemUoY29udGV4dCwgbmV3TE8sIHByb2ZpbGVJZCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IEJHM01NIGxvYWQgb3JkZXIgZmlsZScsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGZvcmNlUmVmcmVzaChjb250ZXh0LmFwaSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TW9kU2V0dGluZ3NGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG5cclxuICBjb25zdCBvcHRpb25zOiBJT3Blbk9wdGlvbnMgPSB7XHJcbiAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gaW1wb3J0IGZyb20nKSxcclxuICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzMgTG9hZCBPcmRlcicsIGV4dGVuc2lvbnM6IFsnbHN4J10gfV1cclxuICB9O1xyXG5cclxuICBjb25zdCBzZWxlY3RlZFBhdGg6c3RyaW5nID0gYXdhaXQgYXBpLnNlbGVjdEZpbGUob3B0aW9ucyk7XHJcblxyXG4gIGxvZ0RlYnVnKCdpbXBvcnRNb2RTZXR0aW5nc0ZpbGUgc2VsZWN0ZWRQYXRoPScsIHNlbGVjdGVkUGF0aCk7XHJcbiAgXHJcbiAgLy8gaWYgbm8gcGF0aCBzZWxlY3RlZCwgdGhlbiBjYW5jZWwgcHJvYmFibHkgcHJlc3NlZFxyXG4gIGlmKHNlbGVjdGVkUGF0aCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICBwcm9jZXNzTHN4RmlsZShhcGksIHNlbGVjdGVkUGF0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xyXG5cclxuICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3QgZ2FtZVNldHRpbmdzUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNQcm9maWxlSWQsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuXHJcbiAgbG9nRGVidWcoJ2ltcG9ydE1vZFNldHRpbmdzR2FtZSBnYW1lU2V0dGluZ3NQYXRoPScsIGdhbWVTZXR0aW5nc1BhdGgpO1xyXG5cclxuICBwcm9jZXNzTHN4RmlsZShhcGksIGdhbWVTZXR0aW5nc1BhdGgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0lmRHVwbGljYXRlRXhpc3RzKGFycikge1xyXG4gIHJldHVybiBuZXcgU2V0KGFycikuc2l6ZSAhPT0gYXJyLmxlbmd0aFxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGUobm9kZTogSU1vZE5vZGUsIG5hbWU6IHN0cmluZywgZmFsbGJhY2s/OiBzdHJpbmcpOnN0cmluZyB7XHJcbiAgcmV0dXJuIGZpbmROb2RlKG5vZGU/LmF0dHJpYnV0ZSwgbmFtZSk/LiQ/LnZhbHVlID8/IGZhbGxiYWNrO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzQkczTU1GaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwganNvblBhdGg6IHN0cmluZykge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuXHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6IE5PVElGX0lNUE9SVF9BQ1RJVklUWSxcclxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIEpTT04gRmlsZScsXHJcbiAgICBtZXNzYWdlOiBqc29uUGF0aCxcclxuICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuXHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcblxyXG4gIH0gZmluYWxseSB7XHJcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihOT1RJRl9JTVBPUlRfQUNUSVZJVFkpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE5vZGVzKGxzeFBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcbiAgY29uc3QgbHN4TG9hZE9yZGVyOiBJTW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTHN4RmlsZShsc3hQYXRoKTtcclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBsc3hQYXRoPScsIGxzeFBhdGgpO1xyXG5cclxuICAgIC8vIGJ1aWxkdXAgb2JqZWN0IGZyb20geG1sXHJcbiAgICBjb25zdCByZWdpb24gPSBmaW5kTm9kZShsc3hMb2FkT3JkZXI/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XHJcbiAgICBjb25zdCByb290ID0gZmluZE5vZGUocmVnaW9uPy5ub2RlLCAncm9vdCcpO1xyXG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xyXG4gICAgY29uc3QgbW9kc09yZGVyTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpO1xyXG5cclxuICAgIHJldHVybiB7IHJlZ2lvbiwgcm9vdCwgbW9kc05vZGUsIG1vZHNPcmRlck5vZGUgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NMc3hGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbHN4UGF0aDpzdHJpbmcpIHsgIFxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcblxyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiBOT1RJRl9JTVBPUlRfQUNUSVZJVFksXHJcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBMU1ggRmlsZScsXHJcbiAgICBtZXNzYWdlOiBsc3hQYXRoLFxyXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBtb2RzTm9kZSwgbW9kc09yZGVyTm9kZSB9ID0gYXdhaXQgZ2V0Tm9kZXMobHN4UGF0aCk7XHJcbiAgICBpZiAoKG1vZHNOb2RlPy5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlPy5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcclxuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtYXQgPSBhd2FpdCBnZXREZWZhdWx0TW9kU2V0dGluZ3NGb3JtYXQoYXBpKTtcclxuICAgIGxldCBsb05vZGUgPSBbJ3Y3JywgJ3Y4J10uaW5jbHVkZXMoZm9ybWF0KSA/IG1vZHNOb2RlIDogbW9kc09yZGVyTm9kZSAhPT0gdW5kZWZpbmVkID8gbW9kc09yZGVyTm9kZSA6IG1vZHNOb2RlO1xyXG5cclxuICAgIC8vIGdldCBuaWNlIHN0cmluZyBhcnJheSwgaW4gb3JkZXIsIG9mIG1vZHMgZnJvbSB0aGUgbG9hZCBvcmRlciBzZWN0aW9uXHJcbiAgICBsZXQgdXVpZEFycmF5OnN0cmluZ1tdID0gbG9Ob2RlPy5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkXHJcbiAgICAgID8gbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUubWFwKChsb0VudHJ5KSA9PiBsb0VudHJ5LmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ1VVSUQnKSkuJC52YWx1ZSlcclxuICAgICAgOiBbXTtcclxuXHJcbiAgICBsb2dEZWJ1ZyhgcHJvY2Vzc0xzeEZpbGUgdXVpZEFycmF5PWAsIHV1aWRBcnJheSk7XHJcblxyXG4gICAgLy8gYXJlIHRoZXJlIGFueSBkdXBsaWNhdGVzPyBpZiBzby4uLlxyXG4gICAgaWYoY2hlY2tJZkR1cGxpY2F0ZUV4aXN0cyh1dWlkQXJyYXkpKSB7XHJcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWltcG9ydGVkLWR1cGxpY2F0ZScsXHJcbiAgICAgICAgdGl0bGU6ICdEdXBsaWNhdGUgRW50cmllcycsXHJcbiAgICAgICAgbWVzc2FnZTogJ0R1cGxpY2F0ZSBVVUlEcyBmb3VuZCBpbiB0aGUgTW9kT3JkZXIgc2VjdGlvbiBvZiB0aGUgLmxzeCBmaWxlIGJlaW5nIGltcG9ydGVkLiBUaGlzIHNvbWV0aW1lcyBjYW4gY2F1c2UgaXNzdWVzIHdpdGggdGhlIGxvYWQgb3JkZXIuJyxcclxuICAgICAgICBcclxuICAgICAgICAvL2Rpc3BsYXlNUzogMzAwMFxyXG4gICAgICB9KTsgXHJcbiAgICAgIFxyXG4gICAgICAvLyByZW1vdmUgdGhlc2UgZHVwbGljYXRlcyBhZnRlciB0aGUgZmlyc3Qgb25lXHJcbiAgICAgIHV1aWRBcnJheSA9IEFycmF5LmZyb20obmV3IFNldCh1dWlkQXJyYXkpKTtcclxuICAgIH0gICBcclxuXHJcbiAgICBjb25zdCBsc3hNb2ROb2RlczogSU1vZE5vZGVbXSA9IG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGU7XHJcblxyXG4gICAgLypcclxuICAgIC8vIGdldCBtb2RzLCBpbiB0aGUgYWJvdmUgb3JkZXIsIGZyb20gdGhlIG1vZHMgc2VjdGlvbiBvZiB0aGUgZmlsZSBcclxuICAgIGNvbnN0IGxzeE1vZHM6SU1vZE5vZGVbXSA9IHV1aWRBcnJheS5tYXAoKHV1aWQpID0+IHtcclxuICAgICAgcmV0dXJuIGxzeE1vZE5vZGVzLmZpbmQobW9kTm9kZSA9PiBtb2ROb2RlLmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ1VVSUQnKSAmJiAoYXR0ci4kLnZhbHVlID09PSB1dWlkKSkpO1xyXG4gICAgfSk7Ki9cclxuXHJcbiAgICBsb2dEZWJ1ZyhgcHJvY2Vzc0xzeEZpbGUgbHN4TW9kTm9kZXM9YCwgbHN4TW9kTm9kZXMpO1xyXG5cclxuICAgIC8vIHdlIG5vdyBoYXZlIGFsbCB0aGUgaW5mb3JtYXRpb24gZnJvbSBmaWxlIHRoYXQgd2UgbmVlZFxyXG5cclxuICAgIC8vIGxldHMgZ2V0IGFsbCBwYWtzIGZyb20gdGhlIGZvbGRlclxyXG4gICAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtzKGFwaSk7XHJcblxyXG4gICAgLy8gYXJlIHRoZXJlIGFueSBwYWsgZmlsZXMgbm90IGluIHRoZSBsc3ggZmlsZT9cclxuICAgIGNvbnN0IG1pc3NpbmcgPSBwYWtzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7ICBcclxuXHJcbiAgICAgIC8vIGlmIGN1cnJlbnQgcGFrIGhhcyBubyBhc3NvY2lhdGVkIHBhaywgdGhlbiB3ZSBza2lwLiB3ZSBkZWZpbnRlbHkgYXJlbid0IGFkZGluZyB0aGlzIHBhayBpZiB2b3J0ZXggaGFzbid0IG1hbmFnZWQgaXQuXHJcbiAgICAgIGlmKGN1cnIubW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gYWNjO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBpZiBjdXJyZW50IHBhaywgd2hpY2ggdm9ydGV4IGhhcyBkZWZpbmF0ZWx5IG1hbmFnZWQsIGlzbid0IGFscmVhZHkgaW4gdGhlIGxzeCBmaWxlLCB0aGVuIHRoaXMgaXMgbWlzc2luZyBhbmQgd2UgbmVlZCB0byBsb2FkIG9yZGVyXHJcbiAgICAgIGlmKGxzeE1vZE5vZGVzLmZpbmQobHN4RW50cnkgPT4gbHN4RW50cnkuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09IGN1cnIuaW5mby5uYW1lKSkpID09PSB1bmRlZmluZWQpIFxyXG4gICAgICAgIGFjYy5wdXNoKGN1cnIpO1xyXG5cclxuICAgICAgLy8gc2tpcCB0aGlzIFxyXG4gICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwgW10pO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAtIG1pc3NpbmcgcGFrIGZpbGVzIHRoYXQgaGF2ZSBhc3NvY2lhdGVkIG1vZHMgPScsIG1pc3NpbmcpO1xyXG5cclxuICAgIC8vIGJ1aWxkIGEgbG9hZCBvcmRlciBmcm9tIHRoZSBsc3ggZmlsZSBhbmQgYWRkIGFueSBtaXNzaW5nIHBha3MgYXQgdGhlIGVuZD9cclxuXHJcbiAgICAvL2xldCBuZXdMb2FkT3JkZXI6IHR5cGVzLklMb2FkT3JkZXJFbnRyeVtdID0gW107XHJcblxyXG4gICAgLy8gbG9vcCB0aHJvdWdoIGxzeCBtb2Qgbm9kZXMgYW5kIGZpbmQgdGhlIHBhayB0aGV5IGFyZSBhc3NvY2lhdGVkIHdpdGhcclxuXHJcbiAgICBsZXQgbmV3TG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IGxzeE1vZE5vZGVzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XHJcbiAgICAgIFxyXG4gICAgICAvLyBmaW5kIHRoZSBiZzNQYWsgdGhpcyBpcyByZWZlcmluZyB0b28gYXMgaXQncyBlYXNpZXIgdG8gZ2V0IGFsbCB0aGUgaW5mb3JtYXRpb25cclxuICAgICAgY29uc3QgcGFrID0gcGFrcy5maW5kKChwYWspID0+IHBhay5pbmZvLm5hbWUgPT09IGN1cnIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpKS4kLnZhbHVlKTtcclxuXHJcbiAgICAgIC8vIGlmIHRoZSBwYWsgaXMgZm91bmQsIHRoZW4gd2UgYWRkIGEgbG9hZCBvcmRlciBlbnRyeS4gaWYgaXQgaXNuJ3QsIHRoZW4gaXRzIHByb2IgYmVlbiBkZWxldGVkIGluIHZvcnRleCBhbmQgbHN4IGhhcyBhbiBleHRyYSBlbnRyeVxyXG4gICAgICBpZiAocGFrICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBhY2MucHVzaCh7XHJcbiAgICAgICAgICBpZDogcGFrLmZpbGVOYW1lLFxyXG4gICAgICAgICAgbW9kSWQ6IHBhaz8ubW9kPy5pZCxcclxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsICAgICAgICBcclxuICAgICAgICAgIG5hbWU6IHBhay5pbmZvPy5uYW1lIHx8IHBhdGguYmFzZW5hbWUocGFrLmZpbGVOYW1lLCAnLnBhaycpLFxyXG4gICAgICAgICAgZGF0YTogcGFrLmluZm8sXHJcbiAgICAgICAgICBsb2NrZWQ6IHBhay5pbmZvLmlzTGlzdGVkIGFzIExvY2tlZFN0YXRlICAgICAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGFjYztcclxuICAgIH0sIFtdKTsgICBcclxuXHJcbiAgICBsb2dEZWJ1ZygncHJvY2Vzc0xzeEZpbGUgKGJlZm9yZSBhZGRpbmcgbWlzc2luZykgbmV3TG9hZE9yZGVyPScsIG5ld0xvYWRPcmRlcik7XHJcblxyXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cclxuICAgIG1pc3NpbmcuZm9yRWFjaChwYWsgPT4ge1xyXG4gICAgICBuZXdMb2FkT3JkZXIucHVzaCh7XHJcbiAgICAgICAgaWQ6IHBhay5maWxlTmFtZSxcclxuICAgICAgICBtb2RJZDogIHBhaz8ubW9kPy5pZCxcclxuICAgICAgICBlbmFibGVkOiB0cnVlLCAgICAgICAgXHJcbiAgICAgICAgbmFtZTogcGFrLmluZm8/Lm5hbWUgfHwgcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXHJcbiAgICAgICAgZGF0YTogcGFrLmluZm8sXHJcbiAgICAgICAgbG9ja2VkOiBwYWsuaW5mby5pc0xpc3RlZCBhcyBMb2NrZWRTdGF0ZSAgICAgICAgXHJcbiAgICAgIH0pICAgICAgXHJcbiAgICB9KTsgICBcclxuXHJcbiAgICBsb2dEZWJ1ZygncHJvY2Vzc0xzeEZpbGUgKGFmdGVyIGFkZGluZyBtaXNzaW5nKSBuZXdMb2FkT3JkZXI9JywgbmV3TG9hZE9yZGVyKTtcclxuXHJcbiAgICBuZXdMb2FkT3JkZXIuc29ydCgoYSwgYikgPT4gKCtiLmxvY2tlZCAtICthLmxvY2tlZCkpO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAoYWZ0ZXIgc29ydGluZykgbmV3TG9hZE9yZGVyPScsIG5ld0xvYWRPcmRlcik7XHJcblxyXG4gICAgLy8gZ2V0IGxvYWQgb3JkZXJcclxuICAgIC8vbGV0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgICAvL2xvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcclxuXHJcbiAgICAvLyBtYW51YWx5IHNldCBsb2FkIG9yZGVyP1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RkJMb2FkT3JkZXIocHJvZmlsZUlkLCBuZXdMb2FkT3JkZXIpKTtcclxuXHJcbiAgICAvL3V0aWwuc2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIG5ld0xvYWRPcmRlcik7XHJcblxyXG4gICAgLy8gZ2V0IGxvYWQgb3JkZXIgYWdhaW4/XHJcbiAgICAvL2xvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgIC8vbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xyXG5cclxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtbG9hZG9yZGVyLWltcG9ydC1hY3Rpdml0eScpO1xyXG5cclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgICBpZDogJ2JnMy1sb2Fkb3JkZXItaW1wb3J0ZWQnLFxyXG4gICAgICB0aXRsZTogJ0xvYWQgT3JkZXIgSW1wb3J0ZWQnLFxyXG4gICAgICBtZXNzYWdlOiBsc3hQYXRoLFxyXG4gICAgICBkaXNwbGF5TVM6IDMwMDBcclxuICAgIH0pO1xyXG5cclxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBmaW5pc2hlZCcpO1xyXG5cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIFxyXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oTk9USUZfSU1QT1JUX0FDVElWSVRZKTtcclxuXHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHBvcnRUbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVwYXRoOiBzdHJpbmcpIHtcclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG5cclxuICAvLyBnZXQgbG9hZCBvcmRlciBmcm9tIHN0YXRlXHJcbiAgY29uc3QgbG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuXHJcbiAgbG9nRGVidWcoJ2V4cG9ydFRvIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xyXG5cclxuICB0cnkge1xyXG4gICAgLy8gcmVhZCB0aGUgZ2FtZSBiZzMgbW9kc2V0dGluZ3MubHN4IHNvIHRoYXQgd2UgZ2V0IHRoZSBkZWZhdWx0IGdhbWUgZ3VzdGF2IHRoaW5nP1xyXG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcclxuICAgIGNvbnN0IG1vZFNldHRpbmdzRm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XHJcblxyXG4gICAgLy8gYnVpbGR1cCBvYmplY3QgZnJvbSB4bWxcclxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xyXG4gICAgY29uc3Qgcm9vdCA9IGZpbmROb2RlKHJlZ2lvbj8ubm9kZSwgJ3Jvb3QnKTtcclxuICAgIGNvbnN0IG1vZHNOb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcclxuXHJcbiAgICBpZiAoKG1vZHNOb2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XHJcbiAgICAgIG1vZHNOb2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZHJvcCBhbGwgbm9kZXMgZXhjZXB0IGZvciB0aGUgZ2FtZSBlbnRyeVxyXG4gICAgY29uc3QgZGVzY3JpcHRpb25Ob2RlcyA9IG1vZHNOb2RlPy5jaGlsZHJlbj8uWzBdPy5ub2RlPy5maWx0ZXI/LihpdGVyID0+XHJcbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUuc3RhcnRzV2l0aCgnR3VzdGF2JykpKSkgPz8gW107XHJcblxyXG4gICAgY29uc3QgZmlsdGVyZWRQYWtzID0gbG9hZE9yZGVyLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5LmRhdGE/LnV1aWRcclxuICAgICAgICAgICAgICAgICAgICAmJiBlbnRyeS5lbmFibGVkXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgIWVudHJ5LmRhdGE/LmlzTGlzdGVkKTtcclxuXHJcbiAgICBsb2dEZWJ1ZygnZXhwb3J0VG8gZmlsdGVyZWRQYWtzPScsIGZpbHRlcmVkUGFrcyk7XHJcblxyXG4gICAgLy8gYWRkIG5ldyBub2RlcyBmb3IgdGhlIGVuYWJsZWQgbW9kc1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWx0ZXJlZFBha3MpIHtcclxuICAgICAgLy8gY29uc3QgbWQ1ID0gYXdhaXQgdXRpbC5maWxlTUQ1KHBhdGguam9pbihtb2RzUGF0aCgpLCBrZXkpKTtcclxuXHJcbiAgICAgIC8qXHJcbiAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIkZvbGRlclwiIHR5cGU9XCJMU1N0cmluZ1wiIHZhbHVlPVwiQ2xhc3NBZGRpdGlvbnNfYzRmYzNkYzAtMzIyMi1jZjNiLTU4Y2QtY2NjZThjZTRjOGY1XCIvPlxyXG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJNRDVcIiB0eXBlPVwiTFNTdHJpbmdcIiB2YWx1ZT1cImQ2NzhhZWI1NGM2YzE0OTZjMGVhZTcxY2UwMzNlOWZiXCIvPlxyXG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJOYW1lXCIgdHlwZT1cIkxTU3RyaW5nXCIgdmFsdWU9XCJJbG9uaWFzIENoYW5nZXNcIi8+XHJcbiAgICAgICAgPGF0dHJpYnV0ZSBpZD1cIlB1Ymxpc2hIYW5kbGVcIiB0eXBlPVwidWludDY0XCIgdmFsdWU9XCI0MzI1Mjg1XCIvPlxyXG4gICAgICAgIDxhdHRyaWJ1dGUgaWQ9XCJVVUlEXCIgdHlwZT1cImd1aWRcIiB2YWx1ZT1cImM0ZmMzZGMwLTMyMjItY2YzYi01OGNkLWNjY2U4Y2U0YzhmNVwiLz5cclxuICAgICAgICA8YXR0cmlidXRlIGlkPVwiVmVyc2lvbjY0XCIgdHlwZT1cImludDY0XCIgdmFsdWU9XCIzNjAyODc5NzAxODk2Mzk3MFwiLz5cclxuICAgICAgKi9cclxuXHJcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU9yZGVyID0gWydGb2xkZXInLCAnTUQ1JywgJ05hbWUnLCAnUHVibGlzaEhhbmRsZScsICdVVUlEJywgJ1ZlcnNpb242NCcsICdWZXJzaW9uJ107XHJcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSAoWyd2NycsICd2OCddLmluY2x1ZGVzKG1vZFNldHRpbmdzRm9ybWF0KSlcclxuICAgICAgICA/IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLmZvbGRlciB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdOYW1lJywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6IGVudHJ5LmRhdGEubmFtZSB9IH0sXHJcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdQdWJsaXNoSGFuZGxlJywgdHlwZTogJ3VpbnQ2NCcsIHZhbHVlOiAwIH0gfSxcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb242NCcsIHR5cGU6ICdpbnQ2NCcsIHZhbHVlOiBlbnRyeS5kYXRhLnZlcnNpb24gfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdndWlkJywgdmFsdWU6IGVudHJ5LmRhdGEudXVpZCB9IH0sXHJcbiAgICAgICAgXSA6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5mb2xkZXIgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm5hbWUgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLnV1aWQgfSB9LFxyXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVmVyc2lvbicsIHR5cGU6ICdpbnQzMicsIHZhbHVlOiBlbnRyeS5kYXRhLnZlcnNpb24gfSB9LFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xyXG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXHJcbiAgICAgICAgYXR0cmlidXRlOiBbXS5jb25jYXQoYXR0cmlidXRlcywgW3sgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm1kNSB9IH1dKVxyXG4gICAgICAgICAgLnNvcnQoIChhLCBiKSA9PiBhdHRyaWJ1dGVPcmRlci5pbmRleE9mKGEuJC5pZCkgLSBhdHRyaWJ1dGVPcmRlci5pbmRleE9mKGIuJC5pZCkpLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGZpbHRlcmVkUGFrc1xyXG4gICAgICAvLy5zb3J0KChsaHMsIHJocykgPT4gbGhzLnBvcyAtIHJocy5wb3MpIC8vIGRvbid0IGtub3cgaWYgd2UgbmVlZCB0aGlzIG5vd1xyXG4gICAgICAubWFwKChlbnRyeSk6IElNb2ROb2RlID0+ICh7XHJcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcclxuICAgICAgICBhdHRyaWJ1dGU6IFtcclxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS51dWlkIH0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSk7XHJcblxyXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XHJcbiAgICBpZiAoIVsndjcnLCAndjgnXS5pbmNsdWRlcyhtb2RTZXR0aW5nc0Zvcm1hdCkpIHtcclxuICAgICAgbGV0IG1vZE9yZGVyTm9kZTogSVJvb3ROb2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XHJcbiAgICAgIGxldCBpbnNlcnROb2RlID0gZmFsc2U7XHJcbiAgICAgIGlmICghbW9kT3JkZXJOb2RlKSB7XHJcbiAgICAgICAgaW5zZXJ0Tm9kZSA9IHRydWU7XHJcbiAgICAgICAgbW9kT3JkZXJOb2RlID0geyAkOiB7IGlkOiAnTW9kT3JkZXInIH0sIGNoaWxkcmVuOiBbeyBub2RlOiBbXSB9XSB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKChtb2RPcmRlck5vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChtb2RPcmRlck5vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XHJcbiAgICAgICAgbW9kT3JkZXJOb2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XHJcbiAgICAgIH1cclxuICAgICAgbW9kT3JkZXJOb2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBsb2FkT3JkZXJOb2RlcztcclxuICAgICAgaWYgKGluc2VydE5vZGUgJiYgISFyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlKSB7XHJcbiAgICAgICAgcm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZS5zcGxpY2UoMCwgMCwgbW9kT3JkZXJOb2RlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncywgZmlsZXBhdGgpO1xyXG4gICAgXHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWV4cG9ydGVkJyxcclxuICAgICAgdGl0bGU6ICdMb2FkIE9yZGVyIEV4cG9ydGVkJyxcclxuICAgICAgbWVzc2FnZTogZmlsZXBhdGgsXHJcbiAgICAgIGRpc3BsYXlNUzogMzAwMFxyXG4gICAgfSk7XHJcblxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcclxuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCBjcmVhdGUgYSBwcm9maWxlIGluLWdhbWUnLFxyXG4gICAgfSk7XHJcbiAgfSAgXHJcblxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG9GaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcclxuXHJcbiAgbGV0IHNlbGVjdGVkUGF0aDpzdHJpbmc7XHJcblxyXG4gIC8vIGFuIG9sZGVyIHZlcnNpb24gb2YgVm9ydGV4IG1pZ2h0IG5vdCBoYXZlIHRoZSB1cGRhdGVkIGFwaS5zYXZlRmlsZSBmdW5jdGlvbiBzbyB3aWxsIGZhbGxiYWNrXHJcbiAgLy8gdG8gdGhlIHByZXZpb3VzIGhhY2sgam9iIG9mIHNlbGVjdEZpbGUgYnV0IGFjdHVhbGx5IHdyaXRlc1xyXG4gIFxyXG4gIGlmKGFwaS5zYXZlRmlsZSAhPT0gdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uczogSVNhdmVPcHRpb25zID0ge1xyXG4gICAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gZXhwb3J0IHRvJyksXHJcbiAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzMgTG9hZCBPcmRlcicsIGV4dGVuc2lvbnM6IFsnbHN4J10gfV0sICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHNlbGVjdGVkUGF0aCA9IGF3YWl0IGFwaS5zYXZlRmlsZShvcHRpb25zKTsgICAgXHJcblxyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uczogSU9wZW5PcHRpb25zID0ge1xyXG4gICAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gZXhwb3J0IHRvJyksXHJcbiAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzMgTG9hZCBPcmRlcicsIGV4dGVuc2lvbnM6IFsnbHN4J10gfV0sXHJcbiAgICAgIGNyZWF0ZTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICBzZWxlY3RlZFBhdGggPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIGxvZ0RlYnVnKGBleHBvcnRUb0ZpbGUgJHtzZWxlY3RlZFBhdGh9YCk7XHJcblxyXG4gIC8vIGlmIG5vIHBhdGggc2VsZWN0ZWQsIHRoZW4gY2FuY2VsIHByb2JhYmx5IHByZXNzZWRcclxuICBpZihzZWxlY3RlZFBhdGggPT09IHVuZGVmaW5lZClcclxuICAgIHJldHVybjtcclxuXHJcbiAgZXhwb3J0VG8oYXBpLCBzZWxlY3RlZFBhdGgpO1xyXG59XHJcbiAgXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRUb0dhbWUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xyXG5cclxuICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3Qgc2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG5cclxuICBsb2dEZWJ1ZyhgZXhwb3J0VG9HYW1lICR7c2V0dGluZ3NQYXRofWApO1xyXG5cclxuICBleHBvcnRUbyhhcGksIHNldHRpbmdzUGF0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWVwUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuXHJcbiAgLy8gZ2V0IGxvYWQgb3JkZXIgZnJvbSBzdGF0ZVxyXG4gIGNvbnN0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcblxyXG4gIGxvZ0RlYnVnKCdkZWVwUmVmcmVzaCcsIGxvYWRPcmRlcik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xyXG4gIGNvbnN0IGJnM1Byb2ZpbGVJZCA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBzZXR0aW5nc1BhdGg6IHN0cmluZyA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczUHJvZmlsZUlkLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZXR0aW5nc1BhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICBsb2dEZWJ1ZygncmVhZE1vZFNldHRpbmdzJywgZGF0KTtcclxuICByZXR1cm4gcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlYWRMc3hGaWxlKGxzeFBhdGg6IHN0cmluZyk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XHJcbiAgXHJcbiAgLy9jb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksICdQdWJsaWMnLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsc3hQYXRoKTtcclxuICBsb2dEZWJ1ZygnbHN4UGF0aCcsIGRhdCk7XHJcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBmaWxlcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XHJcbiAgY29uc3QgYnVpbGRlciA9IChbJ3Y3JywgJ3Y4J10uaW5jbHVkZXMoZm9ybWF0KSlcclxuICAgID8gbmV3IEJ1aWxkZXIoeyByZW5kZXJPcHRzOiB7IHByZXR0eTogdHJ1ZSwgaW5kZW50OiAnICAgICcgfX0pXHJcbiAgICA6IG5ldyBCdWlsZGVyKCk7XHJcbiAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChkYXRhKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZXBhdGgpKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVwYXRoLCB4bWwpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBzZXR0aW5ncycsIGVycik7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGUocHJldjogdHlwZXMuTG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTxhbnk+IHtcclxuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxyXG4gIC8vICBhbmQgd2UgZG9uJ3Qgd2FudCB0byBhcHBseSBhbnkgcmVzdHJpY3Rpb25zIGVpdGhlciwgc28gd2UganVzdFxyXG4gIC8vICByZXR1cm4uXHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVhZFBBS3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA6IFByb21pc2U8QXJyYXk8SUNhY2hlRW50cnk+PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBsc0xpYiA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XHJcbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLTGlzdChhcGkpO1xyXG5cclxuICAvLyBsb2dEZWJ1ZygncGFrcycsIHBha3MpO1xyXG5cclxuICBsZXQgbWFuaWZlc3Q7XHJcbiAgdHJ5IHtcclxuICAgIG1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksICcnLCBHQU1FX0lEKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gIVsnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSk7XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBkZXBsb3ltZW50IG1hbmlmZXN0JywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gICAgaWQ6ICdiZzMtcmVhZGluZy1wYWtzLWFjdGl2aXR5JyxcclxuICAgIG1lc3NhZ2U6ICdSZWFkaW5nIFBBSyBmaWxlcy4gVGhpcyBtaWdodCB0YWtlIGEgd2hpbGUuLi4nLFxyXG4gIH0pXHJcbiAgY29uc3QgY2FjaGU6IFBha0luZm9DYWNoZSA9IFBha0luZm9DYWNoZS5nZXRJbnN0YW5jZShhcGkpO1xyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IFByb21pc2UuYWxsKHBha3MubWFwKGFzeW5jIChmaWxlTmFtZSwgaWR4KSA9PiB7XHJcbiAgICByZXR1cm4gdXRpbC53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZ1bmMgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBtYW5pZmVzdC5maWxlcy5maW5kKGVudHJ5ID0+IGVudHJ5LnJlbFBhdGggPT09IGZpbGVOYW1lKTtcclxuICAgICAgICAgIGNvbnN0IG1vZCA9IChtYW5pZmVzdEVudHJ5ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgID8gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdPy5bbWFuaWZlc3RFbnRyeS5zb3VyY2VdXHJcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHBha1BhdGggPSBwYXRoLmpvaW4obW9kc1BhdGgoKSwgZmlsZU5hbWUpO1xyXG4gICAgICAgICAgcmV0dXJuIGNhY2hlLmdldENhY2hlRW50cnkoYXBpLCBwYWtQYXRoLCBtb2QpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIERpdmluZUV4ZWNNaXNzaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAnVGhlIGluc3RhbGxlZCBjb3B5IG9mIExTTGliL0RpdmluZSBpcyBjb3JydXB0ZWQgLSBwbGVhc2UgJ1xyXG4gICAgICAgICAgICAgICsgJ2RlbGV0ZSB0aGUgZXhpc3RpbmcgTFNMaWIgbW9kIGVudHJ5IGFuZCByZS1pbnN0YWxsIGl0LiBNYWtlIHN1cmUgdG8gJ1xyXG4gICAgICAgICAgICAgICsgJ2Rpc2FibGUgb3IgYWRkIGFueSBuZWNlc3NhcnkgZXhjZXB0aW9ucyB0byB5b3VyIHNlY3VyaXR5IHNvZnR3YXJlIHRvICdcclxuICAgICAgICAgICAgICArICdlbnN1cmUgaXQgZG9lcyBub3QgaW50ZXJmZXJlIHdpdGggVm9ydGV4L0xTTGliIGZpbGUgb3BlcmF0aW9ucy4nO1xyXG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJywgbWVzc2FnZSxcclxuICAgICAgICAgICAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGNvdWxkIGhhcHBlbiBpZiB0aGUgZmlsZSBnb3QgZGVsZXRlZCBzaW5jZSByZWFkaW5nIHRoZSBsaXN0IG9mIHBha3MuXHJcbiAgICAgICAgICAvLyBhY3R1YWxseSwgdGhpcyBzZWVtcyB0byBiZSBmYWlybHkgY29tbW9uIHdoZW4gdXBkYXRpbmcgYSBtb2RcclxuICAgICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcclxuICAgICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgcGFrLiBQbGVhc2UgbWFrZSBzdXJlIHlvdSBhcmUgdXNpbmcgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIExTTGliIGJ5IHVzaW5nIHRoZSBcIlJlLWluc3RhbGwgTFNMaWIvRGl2aW5lXCIgdG9vbGJhciBidXR0b24gb24gdGhlIE1vZHMgcGFnZS4nLCBlcnIsIHtcclxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogZmlsZU5hbWUsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoKSk7XHJcbiAgICB9KTtcclxuICB9KSk7XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1yZWFkaW5nLXBha3MtYWN0aXZpdHknKTtcclxuXHJcbiAgcmV0dXJuIHJlcy5maWx0ZXIoaXRlciA9PiBpdGVyICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLTGlzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBsZXQgcGFrczogc3RyaW5nW107XHJcbiAgdHJ5IHtcclxuICAgIHBha3MgPSAoYXdhaXQgZnMucmVhZGRpckFzeW5jKG1vZHNQYXRoKCkpKVxyXG4gICAgICAuZmlsdGVyKGZpbGVOYW1lID0+IHBhdGguZXh0bmFtZShmaWxlTmFtZSkudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKCksICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gbm9wXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZHMgZGlyZWN0b3J5JywgZXJyLCB7XHJcbiAgICAgICAgaWQ6ICdiZzMtZmFpbGVkLXJlYWQtbW9kcycsXHJcbiAgICAgICAgbWVzc2FnZTogbW9kc1BhdGgoKSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBwYWtzID0gW107XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFrcztcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdO1xyXG4gIGlmIChtb2RzID09PSB1bmRlZmluZWQpIHtcclxuICAgIGxvZygnd2FybicsICdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldjogdHlwZXMuSU1vZCwgaWQ6IHN0cmluZykgPT4ge1xyXG4gICAgaWYgKG1vZHNbaWRdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKSB7XHJcbiAgICAgIGNvbnN0IGxhdGVzdFZlciA9IHV0aWwuZ2V0U2FmZShwcmV2LCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcclxuICAgICAgY29uc3QgY3VycmVudFZlciA9IHV0aWwuZ2V0U2FmZShtb2RzW2lkXSwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKHNlbXZlci5ndChjdXJyZW50VmVyLCBsYXRlc3RWZXIpKSB7XHJcbiAgICAgICAgICBwcmV2ID0gbW9kc1tpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCBtb2QgdmVyc2lvbicsIHsgbW9kSWQ6IGlkLCB2ZXJzaW9uOiBjdXJyZW50VmVyIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJldjtcclxuICB9LCB1bmRlZmluZWQpO1xyXG5cclxuICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbHNMaWI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkPzogc3RyaW5nKTogSVByb3BzIHtcclxuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcclxuICAgIDogc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG5cclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIHJldHVybiB7IGFwaSwgc3RhdGUsIHByb2ZpbGUsIG1vZHMsIGRpc2NvdmVyeSB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlTE9GaWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcz86IElQcm9wcyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHByb3BzID0gZ2VuUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcclxuICB9XHJcblxyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdmYWlsZWQgdG8gZ2VuZXJhdGUgZ2FtZSBwcm9wcycpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRhcmdldFBhdGggPSBsb2FkT3JkZXJGaWxlUGF0aChwcm9wcy5wcm9maWxlLmlkKTtcclxuICB0cnkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHRhcmdldFBhdGgpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHRhcmdldFBhdGgsIEpTT04uc3RyaW5naWZ5KFtdKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfSAgICBcclxuICBcclxuICBcclxuICByZXR1cm4gdGFyZ2V0UGF0aDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRPcmRlckZpbGVQYXRoKHByb2ZpbGVJZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndXNlckRhdGEnKSwgR0FNRV9JRCwgcHJvZmlsZUlkICsgJ18nICsgTE9fRklMRV9OQU1FKTtcclxufVxyXG5cclxuIl19