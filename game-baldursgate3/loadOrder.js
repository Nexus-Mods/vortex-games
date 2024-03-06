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
exports.loadOrderFilePath = exports.ensureLOFile = exports.genProps = exports.validate = exports.deepRefresh = exports.exportToGame = exports.exportToFile = exports.importModSettingsGame = exports.importModSettingsFile = exports.deserialize = exports.serialize = void 0;
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
                if (curr.mod === undefined) {
                    acc.invalid.push(curr);
                    return acc;
                }
                acc.valid.push(curr);
                return acc;
            }, { valid: [], invalid: [] });
            (0, util_1.logDebug)('deserialize processedPaks=', processedPaks);
            const addedMods = processedPaks.valid.filter(pak => filteredLoadOrder.find(entry => entry.id === pak.fileName) === undefined);
            (0, util_1.logDebug)('deserialize addedMods=', addedMods);
            (0, util_1.logDebug)('deserialize paks=', paks);
            addedMods.forEach(pak => {
                filteredLoadOrder.push({
                    id: pak.fileName,
                    modId: pak.mod.id,
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
        const gameSettingsPath = path_1.default.join((0, util_1.profilesPath)(), 'Public', 'modsettings.lsx');
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
function processLsxFile(api, lsxPath) {
    var _a, _b, _c, _d, _e, _f, _g;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
        api.sendNotification({
            id: 'bg3-loadorder-import-activity',
            title: 'Importing LSX File',
            message: lsxPath,
            type: 'activity',
            noDismiss: true,
            allowSuppress: false,
        });
        try {
            const lsxLoadOrder = yield readLsxFile(lsxPath);
            (0, util_1.logDebug)('processLsxFile lsxPath=', lsxPath);
            const region = (0, util_1.findNode)((_b = lsxLoadOrder === null || lsxLoadOrder === void 0 ? void 0 : lsxLoadOrder.save) === null || _b === void 0 ? void 0 : _b.region, 'ModuleSettings');
            const root = (0, util_1.findNode)(region === null || region === void 0 ? void 0 : region.node, 'root');
            const modsNode = (0, util_1.findNode)((_d = (_c = root === null || root === void 0 ? void 0 : root.children) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.node, 'Mods');
            const loNode = (_g = (0, util_1.findNode)((_f = (_e = root === null || root === void 0 ? void 0 : root.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node, 'ModOrder')) !== null && _g !== void 0 ? _g : { children: [] };
            if ((loNode.children === undefined) || (loNode.children[0] === '')) {
                loNode.children = [{ node: [] }];
            }
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            let uuidArray = loNode.children[0].node.map((loEntry) => loEntry.attribute.find(attr => (attr.$.id === 'UUID')).$.value);
            (0, util_1.logDebug)(`processLsxFile uuidArray=`, uuidArray);
            if (checkIfDuplicateExists(uuidArray)) {
                api.sendNotification({
                    type: 'warning',
                    id: 'bg3-loadorder-imported-duplicate',
                    title: 'Duplicate Entries',
                    message: 'Duplicate UUIDs found in the ModOrder section of the .lsx file being imported. This sometimes can cause issues with the load order.',
                });
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
                const pak = paks.find((pak) => pak.info.name === curr.attribute.find(attr => (attr.$.id === 'Name')).$.value);
                if (pak !== undefined) {
                    acc.push({
                        id: pak.fileName,
                        modId: pak.mod.id,
                        enabled: true,
                        name: path_1.default.basename(pak.fileName, '.pak'),
                        data: pak.info,
                        locked: pak.info.isListed
                    });
                }
                return acc;
            }, []);
            (0, util_1.logDebug)('processLsxFile (before adding missing) newLoadOrder=', newLoadOrder);
            missing.forEach(pak => {
                newLoadOrder.push({
                    id: pak.fileName,
                    modId: pak.mod.id,
                    enabled: true,
                    name: path_1.default.basename(pak.fileName, '.pak'),
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
            api.dismissNotification('bg3-loadorder-import-activity');
            api.showErrorNotification('Failed to import load order', err, {
                allowReport: false
            });
        }
    });
}
function exportTo(api, filepath) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
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
            const loNode = (_g = (0, util_1.findNode)((_f = (_e = root === null || root === void 0 ? void 0 : root.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node, 'ModOrder')) !== null && _g !== void 0 ? _g : { children: [] };
            if ((loNode.children === undefined) || (loNode.children[0] === '')) {
                loNode.children = [{ node: [] }];
            }
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            const descriptionNodes = (_m = (_l = (_k = (_j = (_h = modsNode === null || modsNode === void 0 ? void 0 : modsNode.children) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.node) === null || _k === void 0 ? void 0 : _k.filter) === null || _l === void 0 ? void 0 : _l.call(_k, iter => iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'GustavDev')))) !== null && _m !== void 0 ? _m : [];
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
                        { $: { id: 'Folder', type: 'LSWString', value: entry.data.folder } },
                        { $: { id: 'MD5', type: 'LSString', value: entry.data.md5 } },
                        { $: { id: 'Name', type: 'FixedString', value: entry.data.name } },
                        { $: { id: 'UUID', type: 'FixedString', value: entry.data.uuid } },
                        { $: { id: 'Version', type: 'int32', value: entry.data.version } },
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
            loNode.children[0].node = loadOrderNodes;
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
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), 'Public', 'modsettings.lsx');
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
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), 'Public', 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
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
        (0, util_1.logDebug)('paks', paks);
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
        const cache = cache_1.default.getInstance();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQXNFO0FBQ3RFLGdEQUF3QjtBQUN4QiwrQ0FBaUM7QUFDakMsd0RBQWdDO0FBRWhDLHFDQUFpRDtBQUVqRCxtQ0FBcUQ7QUFJckQsbURBQW9EO0FBQ3BELGlDQUFvRTtBQUVwRSxvREFBb0Q7QUFFcEQsU0FBc0IsU0FBUyxDQUFDLE9BQWdDLEVBQ2hDLFNBQTBCLEVBQzFCLFNBQWtCOzs7UUFDaEQsTUFBTSxLQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUdyQyxNQUFNLFVBQVUsR0FBRyxNQUFNLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBR2pFLElBQUEsZUFBUSxFQUFDLHNCQUFzQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRzVDLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDcEYsTUFBTSxlQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFLckYsTUFBTSxnQkFB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ZSAqL1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIExPX0ZJTEVfTkFNRSB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IEJHM1BhaywgSU1vZE5vZGUsIElNb2RTZXR0aW5ncywgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuaW1wb3J0IHsgTG9ja2VkU3RhdGUgfSBmcm9tICd2b3J0ZXgtYXBpL2xpYi9leHRlbnNpb25zL2ZpbGVfYmFzZWRfbG9hZG9yZGVyL3R5cGVzL3R5cGVzJztcbmltcG9ydCB7IElPcGVuT3B0aW9ucywgSVNhdmVPcHRpb25zIH0gZnJvbSAndm9ydGV4LWFwaS9saWIvdHlwZXMvSUV4dGVuc2lvbkNvbnRleHQnO1xuXG5pbXBvcnQgeyBEaXZpbmVFeGVjTWlzc2luZyB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XG5pbXBvcnQgeyBmaW5kTm9kZSwgbG9nRGVidWcsIG1vZHNQYXRoLCBwcm9maWxlc1BhdGggfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQgUGFrSW5mb0NhY2hlLCB7IElDYWNoZUVudHJ5IH0gZnJvbSAnLi9jYWNoZSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ludmFsaWQgcHJvcHMnKSk7XG4gIH1cbiAgXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcblxuICAvLyBNYWtlIHN1cmUgdGhlIExPIGZpbGUgaXMgY3JlYXRlZCBhbmQgcmVhZHkgdG8gYmUgd3JpdHRlbiB0by5cbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0LCBwcm9maWxlSWQsIHByb3BzKTtcbiAgLy9jb25zdCBmaWx0ZXJlZExPID0gbG9hZE9yZGVyLmZpbHRlcihsbyA9PiAoIUlOVkFMSURfTE9fTU9EX1RZUEVTLmluY2x1ZGVzKHByb3BzLm1vZHM/Lltsbz8ubW9kSWRdPy50eXBlKSkpO1xuXG4gIGxvZ0RlYnVnKCdzZXJpYWxpemUgbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XG5cbiAgLy8gV3JpdGUgdGhlIHByZWZpeGVkIExPIHRvIGZpbGUuXG4gIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGxvRmlsZVBhdGgpLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xuICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhsb0ZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShsb2FkT3JkZXIpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG5cbiAgLy8gY2hlY2sgdGhlIHN0YXRlIGZvciBpZiB3ZSBhcmUga2VlcGluZyB0aGUgZ2FtZSBvbmUgaW4gc3luY1xuICAvLyBpZiB3ZSBhcmUgd3JpdGluZyB2b3J0ZXgncyBsb2FkIG9yZGVyLCB0aGVuIHdlIHdpbGwgYWxzbyB3cml0ZSB0aGUgZ2FtZXMgb25lXG5cbiAgY29uc3QgYXV0b0V4cG9ydFRvR2FtZTpib29sZWFuID0gc3RhdGUuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddLmF1dG9FeHBvcnRMb2FkT3JkZXIgPz8gZmFsc2U7XG5cbiAgbG9nRGVidWcoJ3NlcmlhbGl6ZSBhdXRvRXhwb3J0VG9HYW1lPScsIGF1dG9FeHBvcnRUb0dhbWUpO1xuXG4gIGlmKGF1dG9FeHBvcnRUb0dhbWUpIFxuICAgIGF3YWl0IGV4cG9ydFRvR2FtZShjb250ZXh0LmFwaSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVzZXJpYWxpemUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBQcm9taXNlPHR5cGVzLkxvYWRPcmRlcj4ge1xuICBcbiAgLy8gZ2VuUHJvcHMgaXMgYSBzbWFsbCB1dGlsaXR5IGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgb2Z0ZW4gcmUtdXNlZCBvYmplY3RzXG4gIC8vICBzdWNoIGFzIHRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdGFsbGVkIE1vZHMsIFZvcnRleCdzIGFwcGxpY2F0aW9uIHN0YXRlLFxuICAvLyAgdGhlIGN1cnJlbnRseSBhY3RpdmUgcHJvZmlsZSwgZXRjLlxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XG4gIGlmIChwcm9wcz8ucHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgLy8gV2h5IGFyZSB3ZSBkZXNlcmlhbGl6aW5nIHdoZW4gdGhlIHByb2ZpbGUgaXMgaW52YWxpZCBvciBiZWxvbmdzIHRvIGFub3RoZXIgZ2FtZSA/XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIFxuICBjb25zdCBwYWtzID0gYXdhaXQgcmVhZFBBS3MoY29udGV4dC5hcGkpO1xuXG4gIC8vIGNyZWF0ZSBpZiBuZWNlc3NhcnksIGJ1dCBsb2FkIHRoZSBsb2FkIG9yZGVyIGZyb20gZmlsZSAgICBcbiAgY29uc3QgbG9GaWxlUGF0aCA9IGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcbiAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxvRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxuICBsZXQgbG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xuXG4gIHRyeSB7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGxvYWRPcmRlciA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuXG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdDb3JydXB0IGxvYWQgb3JkZXIgZmlsZScsIHtcbiAgICAgICAgICBiYmNvZGU6IHByb3BzLmFwaS50cmFuc2xhdGUoJ1RoZSBsb2FkIG9yZGVyIGZpbGUgaXMgaW4gYSBjb3JydXB0IHN0YXRlLiBZb3UgY2FuIHRyeSB0byBmaXggaXQgeW91cnNlbGYgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnb3IgVm9ydGV4IGNhbiByZWdlbmVyYXRlIHRoZSBmaWxlIGZvciB5b3UsIGJ1dCB0aGF0IG1heSByZXN1bHQgaW4gbG9zcyBvZiBkYXRhICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnKFdpbGwgb25seSBhZmZlY3QgbG9hZCBvcmRlciBpdGVtcyB5b3UgYWRkZWQgbWFudWFsbHksIGlmIGFueSkuJylcbiAgICAgICAgfSwgW1xuICAgICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IHJlamVjdChlcnIpIH0sXG4gICAgICAgICAgeyBsYWJlbDogJ1JlZ2VuZXJhdGUgRmlsZScsIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgbG9hZE9yZGVyID0gW107XG4gICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBdKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBcbiAgICBsb2dEZWJ1ZygnZGVzZXJpYWxpemUgbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XG5cbiAgICAvLyBmaWx0ZXIgb3V0IGFueSBwYWsgZmlsZXMgdGhhdCBubyBsb25nZXIgZXhpc3RcbiAgICBjb25zdCBmaWx0ZXJlZExvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSBsb2FkT3JkZXIuZmlsdGVyKGVudHJ5ID0+IHBha3MuZmluZChwYWsgPT4gcGFrLmZpbGVOYW1lID09PSBlbnRyeS5pZCkpO1xuXG4gICAgbG9nRGVidWcoJ2Rlc2VyaWFsaXplIGZpbHRlcmVkTG9hZE9yZGVyPScsIGZpbHRlcmVkTG9hZE9yZGVyKTtcblxuICAgIC8vIGZpbHRlciBvdXQgcGFrIGZpbGVzIHRoYXQgZG9uJ3QgaGF2ZSBhIGNvcnJlc3BvbmRpbmcgbW9kICh3aGljaCBtZWFucyBWb3J0ZXggZGlkbid0IGluc3RhbGwgaXQvaXNuJ3QgYXdhcmUgb2YgaXQpXG4gICAgLy9jb25zdCBwYWtzV2l0aE1vZHM6QkczUGFrW10gPSBwYWtzLmZpbHRlcihwYWsgPT4gcGFrLm1vZCAhPT0gdW5kZWZpbmVkKTtcblxuICAgICAgLy8gZ28gdGhyb3VnaCBlYWNoIHBhayBmaWxlIGluIHRoZSBNb2RzIGZvbGRlci4uLlxuICAgIGNvbnN0IHByb2Nlc3NlZFBha3MgPSBwYWtzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7ICAgICAgXG5cbiAgICAgIC8vIGlmIHBhayBmaWxlIGRvZXNuJ3QgaGF2ZSBhbiBhc3NvY2lhdGVkIG1vZCwgdGhlbiB3ZSBkb24ndCB3YW50IHRvIGRlYWwgd2l0aCBpdFxuICAgICAgaWYoY3Vyci5tb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhY2MuaW52YWxpZC5wdXNoKGN1cnIpOyBcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgYWNjLnZhbGlkLnB1c2goY3Vycik7XG4gICAgICByZXR1cm4gYWNjO1xuXG4gICAgfSwgeyB2YWxpZDogW10sIGludmFsaWQ6IFtdIH0pO1xuXG4gICAgbG9nRGVidWcoJ2Rlc2VyaWFsaXplIHByb2Nlc3NlZFBha3M9JywgcHJvY2Vzc2VkUGFrcyk7XG5cbiAgICAvLyBnZXQgYW55IHBhayBmaWxlcyB0aGF0IGFyZW4ndCBpbiB0aGUgZmlsdGVyZWRMb2FkT3JkZXJcbiAgICBjb25zdCBhZGRlZE1vZHM6QkczUGFrW10gPSBwcm9jZXNzZWRQYWtzLnZhbGlkLmZpbHRlcihwYWsgPT4gZmlsdGVyZWRMb2FkT3JkZXIuZmluZChlbnRyeSA9PiBlbnRyeS5pZCA9PT0gcGFrLmZpbGVOYW1lKSA9PT0gdW5kZWZpbmVkKTtcblxuICAgIGxvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBhZGRlZE1vZHM9JywgYWRkZWRNb2RzKTtcbiAgICBcbiAgICAvLyBDaGVjayBpZiB0aGUgdXNlciBhZGRlZCBhbnkgbmV3IG1vZHMuXG4gICAgLy9jb25zdCBkaWZmID0gZW5hYmxlZE1vZElkcy5maWx0ZXIoaWQgPT4gKCFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhtb2RzW2lkXT8udHlwZSkpXG4gICAgLy8gICYmIChmaWx0ZXJlZERhdGEuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IGlkKSA9PT0gdW5kZWZpbmVkKSk7XG5cbiAgICBsb2dEZWJ1ZygnZGVzZXJpYWxpemUgcGFrcz0nLCBwYWtzKTtcblxuXG4gICAgLy8gQWRkIGFueSBuZXdseSBhZGRlZCBtb2RzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxvYWRPcmRlci5cbiAgICBhZGRlZE1vZHMuZm9yRWFjaChwYWsgPT4ge1xuICAgICAgZmlsdGVyZWRMb2FkT3JkZXIucHVzaCh7XG4gICAgICAgIGlkOiBwYWsuZmlsZU5hbWUsXG4gICAgICAgIG1vZElkOiBwYWsubW9kLmlkLFxuICAgICAgICBlbmFibGVkOiB0cnVlLCAgLy8gbm90IHVzaW5nIGxvYWQgb3JkZXIgZm9yIGVuYWJsaW5nL2Rpc2FibGluZyAgICAgIFxuICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhay5maWxlTmFtZSwgJy5wYWsnKSxcbiAgICAgICAgZGF0YTogcGFrLmluZm8sXG4gICAgICAgIGxvY2tlZDogcGFrLmluZm8uaXNMaXN0ZWQgYXMgTG9ja2VkU3RhdGUgICAgICAgIFxuICAgICAgfSkgICAgICBcbiAgICB9KTsgICAgICAgXG5cbiAgICAvL2xvZ0RlYnVnKCdkZXNlcmlhbGl6ZSBmaWx0ZXJlZERhdGE9JywgZmlsdGVyZWREYXRhKTtcblxuICAgIC8vIHNvcnRlZCBzbyB0aGF0IGFueSBtb2RzIHRoYXQgYXJlIGxvY2tlZCBhcHBlYXIgYXQgdGhlIHRvcFxuICAgIC8vY29uc3Qgc29ydGVkQW5kRmlsdGVyZWREYXRhID0gXG4gICAgXG4gICAgLy8gcmV0dXJuXG4gICAgcmV0dXJuIGZpbHRlcmVkTG9hZE9yZGVyLnNvcnQoKGEsIGIpID0+ICgrYi5sb2NrZWQgLSArYS5sb2NrZWQpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TW9kU2V0dGluZ3NGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcblxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuXG4gIGNvbnN0IG9wdGlvbnM6IElPcGVuT3B0aW9ucyA9IHtcbiAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gaW1wb3J0IGZyb20nKSxcbiAgICBmaWx0ZXJzOiBbeyBuYW1lOiAnQkczIExvYWQgT3JkZXInLCBleHRlbnNpb25zOiBbJ2xzeCddIH1dXG4gIH07XG5cbiAgY29uc3Qgc2VsZWN0ZWRQYXRoOnN0cmluZyA9IGF3YWl0IGFwaS5zZWxlY3RGaWxlKG9wdGlvbnMpO1xuXG4gIGxvZ0RlYnVnKCdpbXBvcnRNb2RTZXR0aW5nc0ZpbGUgc2VsZWN0ZWRQYXRoPScsIHNlbGVjdGVkUGF0aCk7XG4gIFxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXG4gIGlmKHNlbGVjdGVkUGF0aCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybjtcblxuICBwcm9jZXNzTHN4RmlsZShhcGksIHNlbGVjdGVkUGF0aCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xuXG4gIGNvbnN0IGdhbWVTZXR0aW5nc1BhdGg6c3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xuXG4gIGxvZ0RlYnVnKCdpbXBvcnRNb2RTZXR0aW5nc0dhbWUgZ2FtZVNldHRpbmdzUGF0aD0nLCBnYW1lU2V0dGluZ3NQYXRoKTtcblxuICBwcm9jZXNzTHN4RmlsZShhcGksIGdhbWVTZXR0aW5nc1BhdGgpO1xufVxuXG5mdW5jdGlvbiBjaGVja0lmRHVwbGljYXRlRXhpc3RzKGFycikge1xuICByZXR1cm4gbmV3IFNldChhcnIpLnNpemUgIT09IGFyci5sZW5ndGhcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlKG5vZGU6IElNb2ROb2RlLCBuYW1lOiBzdHJpbmcsIGZhbGxiYWNrPzogc3RyaW5nKTpzdHJpbmcge1xuICByZXR1cm4gZmluZE5vZGUobm9kZT8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2s7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NMc3hGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbHN4UGF0aDpzdHJpbmcpIHsgIFxuXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG5cbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIGlkOiAnYmczLWxvYWRvcmRlci1pbXBvcnQtYWN0aXZpdHknLFxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIExTWCBGaWxlJyxcbiAgICBtZXNzYWdlOiBsc3hQYXRoLFxuICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgbm9EaXNtaXNzOiB0cnVlLFxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxuICB9KTtcblxuICB0cnkge1xuXG4gICAgY29uc3QgbHN4TG9hZE9yZGVyOklNb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRMc3hGaWxlKGxzeFBhdGgpO1xuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBsc3hQYXRoPScsIGxzeFBhdGgpO1xuXG4gICAgLy8gYnVpbGR1cCBvYmplY3QgZnJvbSB4bWxcbiAgICBjb25zdCByZWdpb24gPSBmaW5kTm9kZShsc3hMb2FkT3JkZXI/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XG4gICAgY29uc3Qgcm9vdCA9IGZpbmROb2RlKHJlZ2lvbj8ubm9kZSwgJ3Jvb3QnKTtcbiAgICBjb25zdCBtb2RzTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XG4gICAgY29uc3QgbG9Ob2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJykgPz8geyBjaGlsZHJlbjogW10gfTtcbiAgICBpZiAoKGxvTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKGxvTm9kZS5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcbiAgICAgIGxvTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xuICAgIH1cbiAgICBpZiAoKG1vZHNOb2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xuICAgIH1cblxuICAgIC8vIGdldCBuaWNlIHN0cmluZyBhcnJheSwgaW4gb3JkZXIsIG9mIG1vZHMgZnJvbSB0aGUgbG9hZCBvcmRlciBzZWN0aW9uXG4gICAgbGV0IHV1aWRBcnJheTpzdHJpbmdbXSA9IGxvTm9kZS5jaGlsZHJlblswXS5ub2RlLm1hcCgobG9FbnRyeSkgPT4gbG9FbnRyeS5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdVVUlEJykpLiQudmFsdWUpO1xuICAgIFxuICAgIGxvZ0RlYnVnKGBwcm9jZXNzTHN4RmlsZSB1dWlkQXJyYXk9YCwgdXVpZEFycmF5KTtcblxuICAgIC8vIGFyZSB0aGVyZSBhbnkgZHVwbGljYXRlcz8gaWYgc28uLi5cbiAgICBpZihjaGVja0lmRHVwbGljYXRlRXhpc3RzKHV1aWRBcnJheSkpIHtcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgICBpZDogJ2JnMy1sb2Fkb3JkZXItaW1wb3J0ZWQtZHVwbGljYXRlJyxcbiAgICAgICAgdGl0bGU6ICdEdXBsaWNhdGUgRW50cmllcycsXG4gICAgICAgIG1lc3NhZ2U6ICdEdXBsaWNhdGUgVVVJRHMgZm91bmQgaW4gdGhlIE1vZE9yZGVyIHNlY3Rpb24gb2YgdGhlIC5sc3ggZmlsZSBiZWluZyBpbXBvcnRlZC4gVGhpcyBzb21ldGltZXMgY2FuIGNhdXNlIGlzc3VlcyB3aXRoIHRoZSBsb2FkIG9yZGVyLicsXG4gICAgICAgIFxuICAgICAgICAvL2Rpc3BsYXlNUzogMzAwMFxuICAgICAgfSk7IFxuICAgICAgXG4gICAgICAvLyByZW1vdmUgdGhlc2UgZHVwbGljYXRlcyBhZnRlciB0aGUgZmlyc3Qgb25lXG4gICAgICAvL3V1aWRBcnJheSA9IEFycmF5LmZyb20obmV3IFNldCh1dWlkQXJyYXkpKTtcbiAgICB9ICAgXG5cbiAgICBjb25zdCBsc3hNb2ROb2RlczpJTW9kTm9kZVtdID0gbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZTtcblxuICAgIC8qXG4gICAgLy8gZ2V0IG1vZHMsIGluIHRoZSBhYm92ZSBvcmRlciwgZnJvbSB0aGUgbW9kcyBzZWN0aW9uIG9mIHRoZSBmaWxlIFxuICAgIGNvbnN0IGxzeE1vZHM6SU1vZE5vZGVbXSA9IHV1aWRBcnJheS5tYXAoKHV1aWQpID0+IHtcbiAgICAgIHJldHVybiBsc3hNb2ROb2Rlcy5maW5kKG1vZE5vZGUgPT4gbW9kTm9kZS5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdVVUlEJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gdXVpZCkpKTtcbiAgICB9KTsqL1xuXG4gICAgbG9nRGVidWcoYHByb2Nlc3NMc3hGaWxlIGxzeE1vZE5vZGVzPWAsIGxzeE1vZE5vZGVzKTtcblxuICAgIC8vIHdlIG5vdyBoYXZlIGFsbCB0aGUgaW5mb3JtYXRpb24gZnJvbSBmaWxlIHRoYXQgd2UgbmVlZFxuXG4gICAgLy8gbGV0cyBnZXQgYWxsIHBha3MgZnJvbSB0aGUgZm9sZGVyXG4gICAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtzKGFwaSk7XG5cbiAgICAvLyBhcmUgdGhlcmUgYW55IHBhayBmaWxlcyBub3QgaW4gdGhlIGxzeCBmaWxlP1xuICAgIGNvbnN0IG1pc3NpbmcgPSBwYWtzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7ICBcblxuICAgICAgLy8gaWYgY3VycmVudCBwYWsgaGFzIG5vIGFzc29jaWF0ZWQgcGFrLCB0aGVuIHdlIHNraXAuIHdlIGRlZmludGVseSBhcmVuJ3QgYWRkaW5nIHRoaXMgcGFrIGlmIHZvcnRleCBoYXNuJ3QgbWFuYWdlZCBpdC5cbiAgICAgIGlmKGN1cnIubW9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH1cblxuICAgICAgLy8gaWYgY3VycmVudCBwYWssIHdoaWNoIHZvcnRleCBoYXMgZGVmaW5hdGVseSBtYW5hZ2VkLCBpc24ndCBhbHJlYWR5IGluIHRoZSBsc3ggZmlsZSwgdGhlbiB0aGlzIGlzIG1pc3NpbmcgYW5kIHdlIG5lZWQgdG8gbG9hZCBvcmRlclxuICAgICAgaWYobHN4TW9kTm9kZXMuZmluZChsc3hFbnRyeSA9PiBsc3hFbnRyeS5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykgJiYgKGF0dHIuJC52YWx1ZSA9PT0gY3Vyci5pbmZvLm5hbWUpKSkgPT09IHVuZGVmaW5lZCkgXG4gICAgICAgIGFjYy5wdXNoKGN1cnIpO1xuXG4gICAgICAvLyBza2lwIHRoaXMgXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIFtdKTtcblxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAtIG1pc3NpbmcgcGFrIGZpbGVzIHRoYXQgaGF2ZSBhc3NvY2lhdGVkIG1vZHMgPScsIG1pc3NpbmcpO1xuXG4gICAgLy8gYnVpbGQgYSBsb2FkIG9yZGVyIGZyb20gdGhlIGxzeCBmaWxlIGFuZCBhZGQgYW55IG1pc3NpbmcgcGFrcyBhdCB0aGUgZW5kP1xuXG4gICAgLy9sZXQgbmV3TG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xuXG4gICAgLy8gbG9vcCB0aHJvdWdoIGxzeCBtb2Qgbm9kZXMgYW5kIGZpbmQgdGhlIHBhayB0aGV5IGFyZSBhc3NvY2lhdGVkIHdpdGhcblxuICAgIGxldCBuZXdMb2FkT3JkZXI6IHR5cGVzLklMb2FkT3JkZXJFbnRyeVtdID0gbHN4TW9kTm9kZXMucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcbiAgICAgIFxuICAgICAgLy8gZmluZCB0aGUgYmczUGFrIHRoaXMgaXMgcmVmZXJpbmcgdG9vIGFzIGl0J3MgZWFzaWVyIHRvIGdldCBhbGwgdGhlIGluZm9ybWF0aW9uXG4gICAgICBjb25zdCBwYWsgPSBwYWtzLmZpbmQoKHBhaykgPT4gcGFrLmluZm8ubmFtZSA9PT0gY3Vyci5hdHRyaWJ1dGUuZmluZChhdHRyID0+IChhdHRyLiQuaWQgPT09ICdOYW1lJykpLiQudmFsdWUpO1xuXG4gICAgICAvLyBpZiB0aGUgcGFrIGlzIGZvdW5kLCB0aGVuIHdlIGFkZCBhIGxvYWQgb3JkZXIgZW50cnkuIGlmIGl0IGlzbid0LCB0aGVuIGl0cyBwcm9iIGJlZW4gZGVsZXRlZCBpbiB2b3J0ZXggYW5kIGxzeCBoYXMgYW4gZXh0cmEgZW50cnlcbiAgICAgIGlmIChwYWsgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhY2MucHVzaCh7XG4gICAgICAgICAgaWQ6IHBhay5maWxlTmFtZSxcbiAgICAgICAgICBtb2RJZDogcGFrLm1vZC5pZCxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLCAgICAgICAgXG4gICAgICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXG4gICAgICAgICAgZGF0YTogcGFrLmluZm8sXG4gICAgICAgICAgbG9ja2VkOiBwYWsuaW5mby5pc0xpc3RlZCBhcyBMb2NrZWRTdGF0ZSAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIFtdKTsgICBcblxuICAgIGxvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSAoYmVmb3JlIGFkZGluZyBtaXNzaW5nKSBuZXdMb2FkT3JkZXI9JywgbmV3TG9hZE9yZGVyKTtcblxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXG4gICAgbWlzc2luZy5mb3JFYWNoKHBhayA9PiB7XG4gICAgICBuZXdMb2FkT3JkZXIucHVzaCh7XG4gICAgICAgIGlkOiBwYWsuZmlsZU5hbWUsXG4gICAgICAgIG1vZElkOiBwYWsubW9kLmlkLFxuICAgICAgICBlbmFibGVkOiB0cnVlLCAgICAgICAgXG4gICAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocGFrLmZpbGVOYW1lLCAnLnBhaycpLFxuICAgICAgICBkYXRhOiBwYWsuaW5mbyxcbiAgICAgICAgbG9ja2VkOiBwYWsuaW5mby5pc0xpc3RlZCBhcyBMb2NrZWRTdGF0ZSAgICAgICAgXG4gICAgICB9KSAgICAgIFxuICAgIH0pOyAgIFxuXG4gICAgbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIChhZnRlciBhZGRpbmcgbWlzc2luZykgbmV3TG9hZE9yZGVyPScsIG5ld0xvYWRPcmRlcik7XG5cbiAgICBuZXdMb2FkT3JkZXIuc29ydCgoYSwgYikgPT4gKCtiLmxvY2tlZCAtICthLmxvY2tlZCkpO1xuXG4gICAgbG9nRGVidWcoJ3Byb2Nlc3NMc3hGaWxlIChhZnRlciBzb3J0aW5nKSBuZXdMb2FkT3JkZXI9JywgbmV3TG9hZE9yZGVyKTtcblxuICAgIC8vIGdldCBsb2FkIG9yZGVyXG4gICAgLy9sZXQgbG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcbiAgICAvL2xvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcblxuICAgIC8vIG1hbnVhbHkgc2V0IGxvYWQgb3JkZXI/XG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgbmV3TG9hZE9yZGVyKSk7XG5cbiAgICAvL3V0aWwuc2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIG5ld0xvYWRPcmRlcik7XG5cbiAgICAvLyBnZXQgbG9hZCBvcmRlciBhZ2Fpbj9cbiAgICAvL2xvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcbiAgICAvL2xvZ0RlYnVnKCdwcm9jZXNzTHN4RmlsZSBsb2FkT3JkZXI9JywgbG9hZE9yZGVyKTtcblxuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtbG9hZG9yZGVyLWltcG9ydC1hY3Rpdml0eScpO1xuXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWltcG9ydGVkJyxcbiAgICAgIHRpdGxlOiAnTG9hZCBPcmRlciBJbXBvcnRlZCcsXG4gICAgICBtZXNzYWdlOiBsc3hQYXRoLFxuICAgICAgZGlzcGxheU1TOiAzMDAwXG4gICAgfSk7XG5cbiAgICBsb2dEZWJ1ZygncHJvY2Vzc0xzeEZpbGUgZmluaXNoZWQnKTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignYmczLWxvYWRvcmRlci1pbXBvcnQtYWN0aXZpdHknKTtcblxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbXBvcnQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlXG4gICAgfSk7XG4gIH1cblxufVxuXG5hc3luYyBmdW5jdGlvbiBleHBvcnRUbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVwYXRoOiBzdHJpbmcpIHtcblxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuXG4gIC8vIGdldCBsb2FkIG9yZGVyIGZyb20gc3RhdGVcbiAgY29uc3QgbG9hZE9yZGVyOnR5cGVzLkxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcblxuICBsb2dEZWJ1ZygnZXhwb3J0VG8gbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XG5cbiAgdHJ5IHtcbiAgICAvLyByZWFkIHRoZSBnYW1lIGJnMyBtb2RzZXR0aW5ncy5sc3ggc28gdGhhdCB3ZSBnZXQgdGhlIGRlZmF1bHQgZ2FtZSBndXN0YXYgdGhpbmc/XG4gICAgY29uc3QgbW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTW9kU2V0dGluZ3MoYXBpKTtcblxuICAgIC8vIGJ1aWxkdXAgb2JqZWN0IGZyb20geG1sXG4gICAgY29uc3QgcmVnaW9uID0gZmluZE5vZGUobW9kU2V0dGluZ3M/LnNhdmU/LnJlZ2lvbiwgJ01vZHVsZVNldHRpbmdzJyk7XG4gICAgY29uc3Qgcm9vdCA9IGZpbmROb2RlKHJlZ2lvbj8ubm9kZSwgJ3Jvb3QnKTtcbiAgICBjb25zdCBtb2RzTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RzJyk7XG4gICAgY29uc3QgbG9Ob2RlID0gZmluZE5vZGUocm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJykgPz8geyBjaGlsZHJlbjogW10gfTtcbiAgICBpZiAoKGxvTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKGxvTm9kZS5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcbiAgICAgIGxvTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xuICAgIH1cbiAgICBpZiAoKG1vZHNOb2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xuICAgIH1cblxuICAgIC8vIGRyb3AgYWxsIG5vZGVzIGV4Y2VwdCBmb3IgdGhlIGdhbWUgZW50cnlcbiAgICBjb25zdCBkZXNjcmlwdGlvbk5vZGVzID0gbW9kc05vZGU/LmNoaWxkcmVuPy5bMF0/Lm5vZGU/LmZpbHRlcj8uKGl0ZXIgPT5cbiAgICAgIGl0ZXIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09ICdHdXN0YXZEZXYnKSkpID8/IFtdO1xuXG4gICAgXG5cblxuICAgIC8vIFxuICAgIGNvbnN0IGZpbHRlcmVkUGFrcyA9IGxvYWRPcmRlci5maWx0ZXIoZW50cnkgPT4gISFlbnRyeS5kYXRhPy51dWlkXG4gICAgICAgICAgICAgICAgICAgICYmIGVudHJ5LmVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgJiYgIWVudHJ5LmRhdGE/LmlzTGlzdGVkKTtcblxuICAgIGxvZ0RlYnVnKCdleHBvcnRUbyBmaWx0ZXJlZFBha3M9JywgZmlsdGVyZWRQYWtzKTtcblxuICAgIC8vIGFkZCBuZXcgbm9kZXMgZm9yIHRoZSBlbmFibGVkIG1vZHNcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZpbHRlcmVkUGFrcykge1xuICAgICAgLy8gY29uc3QgbWQ1ID0gYXdhaXQgdXRpbC5maWxlTUQ1KHBhdGguam9pbihtb2RzUGF0aCgpLCBrZXkpKTtcbiAgICAgIGRlc2NyaXB0aW9uTm9kZXMucHVzaCh7XG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGVTaG9ydERlc2MnIH0sXG4gICAgICAgIGF0dHJpYnV0ZTogW1xuICAgICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1dTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5mb2xkZXIgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ01ENScsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm1kNSB9IH0sXG4gICAgICAgICAgeyAkOiB7IGlkOiAnTmFtZScsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLm5hbWUgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS51dWlkIH0gfSxcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdWZXJzaW9uJywgdHlwZTogJ2ludDMyJywgdmFsdWU6IGVudHJ5LmRhdGEudmVyc2lvbiB9IH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBcbiAgICBjb25zdCBsb2FkT3JkZXJOb2RlcyA9IGZpbHRlcmVkUGFrc1xuICAgICAgLy8uc29ydCgobGhzLCByaHMpID0+IGxocy5wb3MgLSByaHMucG9zKSAvLyBkb24ndCBrbm93IGlmIHdlIG5lZWQgdGhpcyBub3dcbiAgICAgIC5tYXAoKGVudHJ5KTogSU1vZE5vZGUgPT4gKHtcbiAgICAgICAgJDogeyBpZDogJ01vZHVsZScgfSxcbiAgICAgICAgYXR0cmlidXRlOiBbXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVVVJRCcsIHR5cGU6ICdGaXhlZFN0cmluZycsIHZhbHVlOiBlbnRyeS5kYXRhLnV1aWQgfSB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZSA9IGRlc2NyaXB0aW9uTm9kZXM7XG4gICAgbG9Ob2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBsb2FkT3JkZXJOb2RlcztcblxuICAgIHdyaXRlTW9kU2V0dGluZ3MoYXBpLCBtb2RTZXR0aW5ncywgZmlsZXBhdGgpO1xuICAgIFxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgIGlkOiAnYmczLWxvYWRvcmRlci1leHBvcnRlZCcsXG4gICAgICB0aXRsZTogJ0xvYWQgT3JkZXIgRXhwb3J0ZWQnLFxuICAgICAgbWVzc2FnZTogZmlsZXBhdGgsXG4gICAgICBkaXNwbGF5TVM6IDMwMDBcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgY3JlYXRlIGEgcHJvZmlsZSBpbi1nYW1lJyxcbiAgICB9KTtcbiAgfSAgXG5cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydFRvRmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XG5cbiAgbGV0IHNlbGVjdGVkUGF0aDpzdHJpbmc7XG5cbiAgLy8gYW4gb2xkZXIgdmVyc2lvbiBvZiBWb3J0ZXggbWlnaHQgbm90IGhhdmUgdGhlIHVwZGF0ZWQgYXBpLnNhdmVGaWxlIGZ1bmN0aW9uIHNvIHdpbGwgZmFsbGJhY2tcbiAgLy8gdG8gdGhlIHByZXZpb3VzIGhhY2sgam9iIG9mIHNlbGVjdEZpbGUgYnV0IGFjdHVhbGx5IHdyaXRlc1xuICBcbiAgaWYoYXBpLnNhdmVGaWxlICE9PSB1bmRlZmluZWQpIHtcblxuICAgIGNvbnN0IG9wdGlvbnM6IElTYXZlT3B0aW9ucyA9IHtcbiAgICAgIHRpdGxlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgY2hvb3NlIGEgQkczIC5sc3ggZmlsZSB0byBleHBvcnQgdG8nKSxcbiAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzMgTG9hZCBPcmRlcicsIGV4dGVuc2lvbnM6IFsnbHN4J10gfV0sICAgICAgXG4gICAgfTtcblxuICAgIHNlbGVjdGVkUGF0aCA9IGF3YWl0IGFwaS5zYXZlRmlsZShvcHRpb25zKTsgICAgXG5cbiAgfSBlbHNlIHtcblxuICAgIGNvbnN0IG9wdGlvbnM6IElPcGVuT3B0aW9ucyA9IHtcbiAgICAgIHRpdGxlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgY2hvb3NlIGEgQkczIC5sc3ggZmlsZSB0byBleHBvcnQgdG8nKSxcbiAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdCRzMgTG9hZCBPcmRlcicsIGV4dGVuc2lvbnM6IFsnbHN4J10gfV0sXG4gICAgICBjcmVhdGU6IHRydWVcbiAgICB9O1xuXG4gICAgc2VsZWN0ZWRQYXRoID0gYXdhaXQgYXBpLnNlbGVjdEZpbGUob3B0aW9ucyk7XG4gIH1cblxuICBsb2dEZWJ1ZyhgZXhwb3J0VG9GaWxlICR7c2VsZWN0ZWRQYXRofWApO1xuXG4gIC8vIGlmIG5vIHBhdGggc2VsZWN0ZWQsIHRoZW4gY2FuY2VsIHByb2JhYmx5IHByZXNzZWRcbiAgaWYoc2VsZWN0ZWRQYXRoID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuO1xuXG4gIGV4cG9ydFRvKGFwaSwgc2VsZWN0ZWRQYXRoKTtcbn1cbiAgXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG9HYW1lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcblxuICBjb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksICdQdWJsaWMnLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG5cbiAgbG9nRGVidWcoYGV4cG9ydFRvR2FtZSAke3NldHRpbmdzUGF0aH1gKTtcblxuICBleHBvcnRUbyhhcGksIHNldHRpbmdzUGF0aCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWVwUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XG5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcblxuICAvLyBnZXQgbG9hZCBvcmRlciBmcm9tIHN0YXRlXG4gIGNvbnN0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XG5cbiAgbG9nRGVidWcoJ2RlZXBSZWZyZXNoJywgbG9hZE9yZGVyKTtcbn1cblxuXG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBcbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xuICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHNldHRpbmdzUGF0aCk7XG4gIGxvZ0RlYnVnKCdyZWFkTW9kU2V0dGluZ3MnLCBkYXQpO1xuICByZXR1cm4gcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRMc3hGaWxlKGxzeFBhdGg6IHN0cmluZyk6IFByb21pc2U8SU1vZFNldHRpbmdzPiB7XG4gIFxuICAvL2NvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgJ1B1YmxpYycsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsc3hQYXRoKTtcbiAgbG9nRGVidWcoJ2xzeFBhdGgnLCBkYXQpO1xuICByZXR1cm4gcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkYXRhOiBJTW9kU2V0dGluZ3MsIGZpbGVwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XG4gIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZGF0YSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZXBhdGgpKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhmaWxlcGF0aCwgeG1sKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBzZXR0aW5ncycsIGVycik7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YWxpZGF0ZShwcmV2OiB0eXBlcy5Mb2FkT3JkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTxhbnk+IHtcbiAgLy8gTm90aGluZyB0byB2YWxpZGF0ZSByZWFsbHkgLSB0aGUgZ2FtZSBkb2VzIG5vdCByZWFkIG91ciBsb2FkIG9yZGVyIGZpbGVcbiAgLy8gIGFuZCB3ZSBkb24ndCB3YW50IHRvIGFwcGx5IGFueSByZXN0cmljdGlvbnMgZWl0aGVyLCBzbyB3ZSBqdXN0XG4gIC8vICByZXR1cm4uXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRQQUtzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgOiBQcm9taXNlPEFycmF5PElDYWNoZUVudHJ5Pj4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBsc0xpYiA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgcGFrcyA9IGF3YWl0IHJlYWRQQUtMaXN0KGFwaSk7XG5cbiAgbG9nRGVidWcoJ3Bha3MnLCBwYWtzKTtcblxuICBsZXQgbWFuaWZlc3Q7XG4gIHRyeSB7XG4gICAgbWFuaWZlc3QgPSBhd2FpdCB1dGlsLmdldE1hbmlmZXN0KGFwaSwgJycsIEdBTUVfSUQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICFbJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGRlcGxveW1lbnQgbWFuaWZlc3QnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgIGlkOiAnYmczLXJlYWRpbmctcGFrcy1hY3Rpdml0eScsXG4gICAgbWVzc2FnZTogJ1JlYWRpbmcgUEFLIGZpbGVzLiBUaGlzIG1pZ2h0IHRha2UgYSB3aGlsZS4uLicsXG4gIH0pXG4gIGNvbnN0IGNhY2hlOiBQYWtJbmZvQ2FjaGUgPSBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoKTtcbiAgY29uc3QgcmVzID0gYXdhaXQgUHJvbWlzZS5hbGwocGFrcy5tYXAoYXN5bmMgKGZpbGVOYW1lLCBpZHgpID0+IHtcbiAgICByZXR1cm4gdXRpbC53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCAoKSA9PiB7XG4gICAgICBjb25zdCBmdW5jID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBtYW5pZmVzdC5maWxlcy5maW5kKGVudHJ5ID0+IGVudHJ5LnJlbFBhdGggPT09IGZpbGVOYW1lKTtcbiAgICAgICAgICBjb25zdCBtb2QgPSAobWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgPyBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF0/LlttYW5pZmVzdEVudHJ5LnNvdXJjZV1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgY29uc3QgcGFrUGF0aCA9IHBhdGguam9pbihtb2RzUGF0aCgpLCBmaWxlTmFtZSk7XG4gICAgICAgICAgcmV0dXJuIGNhY2hlLmdldENhY2hlRW50cnkoYXBpLCBwYWtQYXRoLCBtb2QpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGl2aW5lRXhlY01pc3NpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAnVGhlIGluc3RhbGxlZCBjb3B5IG9mIExTTGliL0RpdmluZSBpcyBjb3JydXB0ZWQgLSBwbGVhc2UgJ1xuICAgICAgICAgICAgICArICdkZWxldGUgdGhlIGV4aXN0aW5nIExTTGliIG1vZCBlbnRyeSBhbmQgcmUtaW5zdGFsbCBpdC4gTWFrZSBzdXJlIHRvICdcbiAgICAgICAgICAgICAgKyAnZGlzYWJsZSBvciBhZGQgYW55IG5lY2Vzc2FyeSBleGNlcHRpb25zIHRvIHlvdXIgc2VjdXJpdHkgc29mdHdhcmUgdG8gJ1xuICAgICAgICAgICAgICArICdlbnN1cmUgaXQgZG9lcyBub3QgaW50ZXJmZXJlIHdpdGggVm9ydGV4L0xTTGliIGZpbGUgb3BlcmF0aW9ucy4nO1xuICAgICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRGl2aW5lIGV4ZWN1dGFibGUgaXMgbWlzc2luZycsIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gY291bGQgaGFwcGVuIGlmIHRoZSBmaWxlIGdvdCBkZWxldGVkIHNpbmNlIHJlYWRpbmcgdGhlIGxpc3Qgb2YgcGFrcy5cbiAgICAgICAgICAvLyBhY3R1YWxseSwgdGhpcyBzZWVtcyB0byBiZSBmYWlybHkgY29tbW9uIHdoZW4gdXBkYXRpbmcgYSBtb2RcbiAgICAgICAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBwYWsuIFBsZWFzZSBtYWtlIHN1cmUgeW91IGFyZSB1c2luZyB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgTFNMaWIgYnkgdXNpbmcgdGhlIFwiUmUtaW5zdGFsbCBMU0xpYi9EaXZpbmVcIiB0b29sYmFyIGJ1dHRvbiBvbiB0aGUgTW9kcyBwYWdlLicsIGVyciwge1xuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGZpbGVOYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKCkpO1xuICAgIH0pO1xuICB9KSk7XG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtcmVhZGluZy1wYWtzLWFjdGl2aXR5Jyk7XG5cbiAgcmV0dXJuIHJlcy5maWx0ZXIoaXRlciA9PiBpdGVyICE9PSB1bmRlZmluZWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLTGlzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xuICB0cnkge1xuICAgIHBha3MgPSAoYXdhaXQgZnMucmVhZGRpckFzeW5jKG1vZHNQYXRoKCkpKVxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgoKSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIG5vcFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzIGRpcmVjdG9yeScsIGVyciwge1xuICAgICAgICBpZDogJ2JnMy1mYWlsZWQtcmVhZC1tb2RzJyxcbiAgICAgICAgbWVzc2FnZTogbW9kc1BhdGgoKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwYWtzID0gW107XG4gIH1cblxuICByZXR1cm4gcGFrcztcbn1cblxuZnVuY3Rpb24gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XG4gIGlmIChtb2RzID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcpIHtcbiAgICAgIGNvbnN0IGxhdGVzdFZlciA9IHV0aWwuZ2V0U2FmZShwcmV2LCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNlbXZlci5ndChjdXJyZW50VmVyLCBsYXRlc3RWZXIpKSB7XG4gICAgICAgICAgcHJldiA9IG1vZHNbaWRdO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgbW9kIHZlcnNpb24nLCB7IG1vZElkOiBpZCwgdmVyc2lvbjogY3VycmVudFZlciB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIHVuZGVmaW5lZCk7XG5cbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gbHNMaWI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkPzogc3RyaW5nKTogSVByb3BzIHtcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXG4gICAgOiBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG5cbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIHJldHVybiB7IGFwaSwgc3RhdGUsIHByb2ZpbGUsIG1vZHMsIGRpc2NvdmVyeSB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlTE9GaWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzPzogSVByb3BzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XG4gIH1cblxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ZhaWxlZCB0byBnZW5lcmF0ZSBnYW1lIHByb3BzJykpO1xuICB9XG5cbiAgY29uc3QgdGFyZ2V0UGF0aCA9IGxvYWRPcmRlckZpbGVQYXRoKHByb3BzLnByb2ZpbGUuaWQpO1xuICB0cnkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5zdGF0QXN5bmModGFyZ2V0UGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9ICAgIFxuICBcbiAgXG4gIHJldHVybiB0YXJnZXRQYXRoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZE9yZGVyRmlsZVBhdGgocHJvZmlsZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndXNlckRhdGEnKSwgR0FNRV9JRCwgcHJvZmlsZUlkICsgJ18nICsgTE9fRklMRV9OQU1FKTtcbn1cblxuIl19