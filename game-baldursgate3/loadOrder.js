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
exports.loadOrderFilePath = exports.ensureLOFile = exports.genProps = exports.validate = exports.deepRefresh = exports.exportToGame = exports.exportToFile = exports.importModSettingsGame = exports.importModSettingsFile = exports.deserialize = exports.serialize = exports.profilesPath = void 0;
const vortex_api_1 = require("vortex-api");
const path_1 = __importDefault(require("path"));
const semver = __importStar(require("semver"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const bluebird_1 = __importDefault(require("bluebird"));
const child_process_1 = require("child_process");
const common_1 = require("./common");
const xml2js_1 = require("xml2js");
function documentsPath() {
    return path_1.default.join(vortex_api_1.util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}
function modsPath() {
    return path_1.default.join(documentsPath(), 'Mods');
}
function profilesPath() {
    return path_1.default.join(documentsPath(), 'PlayerProfiles');
}
exports.profilesPath = profilesPath;
function globalProfilePath() {
    return path_1.default.join(documentsPath(), 'global');
}
function serialize(context, loadOrder, profileId) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const props = genProps(context);
        if (props === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('invalid props'));
        }
        const state = context.api.getState();
        const loFilePath = yield ensureLOFile(context, profileId, props);
        console.log('serialize loadOrder=', loadOrder);
        yield vortex_api_1.fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
        yield vortex_api_1.fs.writeFileAsync(loFilePath, JSON.stringify(loadOrder), { encoding: 'utf8' });
        const autoExportToGame = (_a = state.settings['baldursgate3'].autoExportLoadOrder) !== null && _a !== void 0 ? _a : false;
        console.log('serialize autoExportToGame=', autoExportToGame);
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
        const mods = vortex_api_1.util.getSafe(props.state, ['persistent', 'mods', common_1.GAME_ID], {});
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
            console.log('deserialize loadOrder=', loadOrder);
            const filteredLoadOrder = loadOrder.filter(entry => paks.find(pak => pak.fileName === entry.id));
            console.log('deserialize filteredLoadOrder=', filteredLoadOrder);
            const processedPaks = paks.reduce((acc, curr) => {
                if (curr.mod === undefined) {
                    acc.invalid.push(curr);
                    return acc;
                }
                acc.valid.push(curr);
                return acc;
            }, { valid: [], invalid: [] });
            console.log('deserialize processedPaks=', processedPaks);
            const addedMods = processedPaks.valid.filter(pak => filteredLoadOrder.find(entry => entry.id === pak.fileName) === undefined);
            console.log('deserialize addedMods=', addedMods);
            console.log('deserialize paks=', paks);
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
        console.log('importModSettingsFile selectedPath=', selectedPath);
        if (selectedPath === undefined)
            return;
        processLsxFile(api, selectedPath);
    });
}
exports.importModSettingsFile = importModSettingsFile;
function importModSettingsGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameSettingsPath = path_1.default.join(profilesPath(), 'Public', 'modsettings.lsx');
        console.log('importModSettingsGame gameSettingsPath=', gameSettingsPath);
        processLsxFile(api, gameSettingsPath);
    });
}
exports.importModSettingsGame = importModSettingsGame;
function checkIfDuplicateExists(arr) {
    return new Set(arr).size !== arr.length;
}
function getAttribute(node, name, fallback) {
    var _a, _b, _c;
    return (_c = (_b = (_a = findNode(node === null || node === void 0 ? void 0 : node.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback;
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
            console.log('processLsxFile lsxPath=', lsxPath);
            const region = findNode((_b = lsxLoadOrder === null || lsxLoadOrder === void 0 ? void 0 : lsxLoadOrder.save) === null || _b === void 0 ? void 0 : _b.region, 'ModuleSettings');
            const root = findNode(region === null || region === void 0 ? void 0 : region.node, 'root');
            const modsNode = findNode((_d = (_c = root === null || root === void 0 ? void 0 : root.children) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.node, 'Mods');
            const loNode = (_g = findNode((_f = (_e = root === null || root === void 0 ? void 0 : root.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node, 'ModOrder')) !== null && _g !== void 0 ? _g : { children: [] };
            if ((loNode.children === undefined) || (loNode.children[0] === '')) {
                loNode.children = [{ node: [] }];
            }
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            let uuidArray = loNode.children[0].node.map((loEntry) => loEntry.attribute.find(attr => (attr.$.id === 'UUID')).$.value);
            console.log(`processLsxFile uuidArray=`, uuidArray);
            if (checkIfDuplicateExists(uuidArray)) {
                api.sendNotification({
                    type: 'warning',
                    id: 'bg3-loadorder-imported-duplicate',
                    title: 'Duplicate Entries',
                    message: 'Duplicate UUIDs found in the ModOrder section of the .lsx file being imported. This sometimes can cause issues with the load order.',
                });
            }
            const lsxModNodes = modsNode.children[0].node;
            console.log(`processLsxFile lsxModNodes=`, lsxModNodes);
            const paks = yield readPAKs(api);
            const missing = paks.reduce((acc, curr) => {
                if (curr.mod === undefined) {
                    return acc;
                }
                if (lsxModNodes.find(lsxEntry => lsxEntry.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === curr.info.name))) === undefined)
                    acc.push(curr);
                return acc;
            }, []);
            console.log('processLsxFile - missing pak files that have associated mods =', missing);
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
            console.log('processLsxFile (before adding missing) newLoadOrder=', newLoadOrder);
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
            console.log('processLsxFile (after adding missing) newLoadOrder=', newLoadOrder);
            newLoadOrder.sort((a, b) => (+b.locked - +a.locked));
            console.log('processLsxFile (after sorting) newLoadOrder=', newLoadOrder);
            api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLoadOrder));
            api.dismissNotification('bg3-loadorder-import-activity');
            api.sendNotification({
                type: 'success',
                id: 'bg3-loadorder-imported',
                title: 'Load Order Imported',
                message: lsxPath,
                displayMS: 3000
            });
            console.log('processLsxFile finished');
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
        console.log('exportTo loadOrder=', loadOrder);
        try {
            const modSettings = yield readModSettings(api);
            const region = findNode((_b = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _b === void 0 ? void 0 : _b.region, 'ModuleSettings');
            const root = findNode(region === null || region === void 0 ? void 0 : region.node, 'root');
            const modsNode = findNode((_d = (_c = root === null || root === void 0 ? void 0 : root.children) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.node, 'Mods');
            const loNode = (_g = findNode((_f = (_e = root === null || root === void 0 ? void 0 : root.children) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node, 'ModOrder')) !== null && _g !== void 0 ? _g : { children: [] };
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
            console.log('exportTo filteredPaks=', filteredPaks);
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
        const options = {
            title: api.translate('Please choose a BG3 .lsx file to export to'),
            filters: [{ name: 'BG3 Load Order', extensions: ['lsx'] }],
            create: true
        };
        const selectedPath = yield api.selectFile(options);
        console.log(`exportToFile ${selectedPath}`);
        if (selectedPath === undefined)
            return;
        exportTo(api, selectedPath);
    });
}
exports.exportToFile = exportToFile;
function exportToGame(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const settingsPath = path_1.default.join(profilesPath(), 'Public', 'modsettings.lsx');
        console.log(`exportToGame ${settingsPath}`);
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
        console.log('deepRefresh', loadOrder);
    });
}
exports.deepRefresh = deepRefresh;
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const settingsPath = path_1.default.join(profilesPath(), 'Public', 'modsettings.lsx');
        const dat = yield vortex_api_1.fs.readFileAsync(settingsPath);
        console.log('readModSettings', dat);
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function readLsxFile(lsxPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const dat = yield vortex_api_1.fs.readFileAsync(lsxPath);
        console.log('lsxPath', dat);
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
        console.log('paks', paks);
        let manifest;
        try {
            manifest = yield vortex_api_1.util.getManifest(api, '', common_1.GAME_ID);
        }
        catch (err) {
            const allowReport = !['EPERM'].includes(err.code);
            api.showErrorNotification('Failed to read deployment manifest', err, { allowReport });
            return [];
        }
        const res = yield Promise.all(paks.map((fileName) => __awaiter(this, void 0, void 0, function* () {
            return vortex_api_1.util.withErrorContext('reading pak', fileName, () => {
                const func = () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
                        const mod = (manifestEntry !== undefined)
                            ? (_a = state.persistent.mods[common_1.GAME_ID]) === null || _a === void 0 ? void 0 : _a[manifestEntry.source]
                            : undefined;
                        const pakPath = path_1.default.join(modsPath(), fileName);
                        return {
                            fileName,
                            mod,
                            info: yield extractPakInfoImpl(api, pakPath, mod),
                        };
                    }
                    catch (err) {
                        if (err instanceof DivineExecMissing) {
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
        return res.filter(iter => iter !== undefined);
    });
}
const listCache = {};
function listPackage(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let res;
        try {
            res = yield divine(api, 'list-package', { source: pakPath, loglevel: 'off' });
        }
        catch (error) {
            console.error(`listPackage caught error: `, error);
        }
        const lines = res.stdout.split('\n').map(line => line.trim()).filter(line => line.length !== 0);
        return lines;
    });
}
function isLOListed(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const maxRetries = 3;
        let retryCounter = 0;
        let lines;
        while (retryCounter < maxRetries) {
            lines = yield listPackage(api, pakPath);
            if (lines.length > 0) {
                break;
            }
            retryCounter++;
            if (retryCounter === maxRetries) {
                console.error(`isLOListed ${path_1.default.basename(pakPath)} retries=${retryCounter}/${maxRetries}: lines shouldn't be 0 and we've run out of retries.`);
                api.sendNotification({
                    type: 'error',
                    message: `${path_1.default.basename(pakPath)} couldn't be read correctly. This mod be incorrectly locked/unlocked but will default to unlocked.`,
                });
                return false;
            }
            console.warn(`isLOListed ${path_1.default.basename(pakPath)} retries=${retryCounter}/${maxRetries}: lines shouldn't be 0. need to retry.`);
        }
        const containsMetaFile = lines.find(line => path_1.default.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx') !== undefined ? true : false;
        return !containsMetaFile;
    });
}
function extractPakInfoImpl(api, pakPath, mod) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const meta = yield extractMeta(api, pakPath, mod);
        const config = findNode((_a = meta === null || meta === void 0 ? void 0 : meta.save) === null || _a === void 0 ? void 0 : _a.region, 'Config');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const moduleInfo = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModuleInfo');
        const attr = (name, fallback) => { var _a, _b, _c; return (_c = (_b = (_a = findNode(moduleInfo === null || moduleInfo === void 0 ? void 0 : moduleInfo.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback(); };
        const genName = path_1.default.basename(pakPath, path_1.default.extname(pakPath));
        let isListed;
        try {
            isListed = yield isLOListed(api, pakPath);
        }
        catch (error) {
            console.log('extractPakInfoImpl caught error:', error);
        }
        return {
            author: attr('Author', () => 'Unknown'),
            description: attr('Description', () => 'Missing'),
            folder: attr('Folder', () => genName),
            md5: attr('MD5', () => ''),
            name: attr('Name', () => genName),
            type: attr('Type', () => 'Adventure'),
            uuid: attr('UUID', () => require('uuid').v4()),
            version: attr('Version', () => '1'),
            isListed: isListed
        };
    });
}
class DivineExecMissing extends Error {
    constructor() {
        super('Divine executable is missing');
        this.name = 'DivineExecMissing';
    }
}
function divine(api, action, options) {
    return new Promise((resolve, reject) => {
        let returned = false;
        let stdout = '';
        const state = api.getState();
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const lsLib = getLatestLSLibMod(api);
        if (lsLib === undefined) {
            const err = new Error('LSLib/Divine tool is missing');
            err['attachLogOnReport'] = false;
            return reject(err);
        }
        const exe = path_1.default.join(stagingFolder, lsLib.installationPath, 'tools', 'divine.exe');
        const args = [
            '--action', action,
            '--source', options.source,
            '--game', 'bg3',
        ];
        if (options.loglevel !== undefined) {
            args.push('--loglevel', options.loglevel);
        }
        else {
            args.push('--loglevel', 'off');
        }
        if (options.destination !== undefined) {
            args.push('--destination', options.destination);
        }
        if (options.expression !== undefined) {
            args.push('--expression', options.expression);
        }
        const proc = (0, child_process_1.spawn)(exe, args);
        proc.stdout.on('data', data => stdout += data);
        proc.stderr.on('data', data => (0, vortex_api_1.log)('warn', data));
        proc.on('error', (errIn) => {
            if (!returned) {
                if (errIn['code'] === 'ENOENT') {
                    reject(new DivineExecMissing());
                }
                returned = true;
                const err = new Error('divine.exe failed: ' + errIn.message);
                err['attachLogOnReport'] = true;
                reject(err);
            }
        });
        proc.on('exit', (code) => {
            if (!returned) {
                returned = true;
                if (code === 0) {
                    return resolve({ stdout, returnCode: 0 });
                }
                else if ([2, 102].includes(code)) {
                    return resolve({ stdout: '', returnCode: 2 });
                }
                else {
                    if (code > 100) {
                        code -= 100;
                    }
                    const err = new Error(`divine.exe failed: ${code}`);
                    err['attachLogOnReport'] = true;
                    return reject(err);
                }
            }
        });
    });
}
function readPAKList(api) {
    return __awaiter(this, void 0, void 0, function* () {
        let paks;
        try {
            paks = (yield vortex_api_1.fs.readdirAsync(modsPath()))
                .filter(fileName => path_1.default.extname(fileName).toLowerCase() === '.pak');
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                try {
                    yield vortex_api_1.fs.ensureDirWritableAsync(modsPath(), () => Promise.resolve());
                }
                catch (err) {
                }
            }
            else {
                api.showErrorNotification('Failed to read mods directory', err, {
                    id: 'bg3-failed-read-mods',
                    message: modsPath(),
                });
            }
            paks = [];
        }
        return paks;
    });
}
function extractPak(api, pakPath, destPath, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        return divine(api, 'extract-package', { source: pakPath, destination: destPath, expression: pattern });
    });
}
function extractMeta(api, pakPath, mod) {
    return __awaiter(this, void 0, void 0, function* () {
        const metaPath = path_1.default.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', (0, shortid_1.generate)());
        yield vortex_api_1.fs.ensureDirAsync(metaPath);
        yield extractPak(api, pakPath, metaPath, '*/meta.lsx');
        try {
            let metaLSXPath = path_1.default.join(metaPath, 'meta.lsx');
            yield (0, turbowalk_1.default)(metaPath, entries => {
                const temp = entries.find(e => path_1.default.basename(e.filePath).toLowerCase() === 'meta.lsx');
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
function findNode(nodes, id) {
    var _a;
    return (_a = nodes === null || nodes === void 0 ? void 0 : nodes.find(iter => iter.$.id === id)) !== null && _a !== void 0 ? _a : undefined;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXNFO0FBQ3RFLGdEQUF3QjtBQUN4QiwrQ0FBaUM7QUFDakMscUNBQThDO0FBQzlDLDBEQUF5QztBQUN6Qyx3REFBZ0M7QUFDaEMsaURBQXNDO0FBRXRDLHFDQUF1RTtBQUV2RSxtQ0FBcUQ7QUFLckQsU0FBUyxhQUFhO0lBQ3BCLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0FBQzdGLENBQUM7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELFNBQWdCLFlBQVk7SUFDMUIsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUZELG9DQUVDO0FBRUQsU0FBUyxpQkFBaUI7SUFDeEIsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFFRCxTQUFzQixTQUFTLENBQUMsT0FBZ0MsRUFDaEMsU0FBMEIsRUFDMUIsU0FBa0I7OztRQUNoRCxNQUFNLEtBQUssR0FBVyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBR3JDLE1BQU0sVUFBVSxHQUFHLE1BQU0sWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFHakUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUcvQyxNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3BGLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBS3JGLE1BQU0sZ0JBQWdCLEdBQVcsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLG1CQUFtQixtQ0FBSSxLQUFLLENBQUM7UUFFN0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTdELElBQUcsZ0JBQWdCO1lBQ2pCLE1BQU0sWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVsQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7Q0FDMUI7QUEvQkQsOEJBK0JDO0FBRUQsU0FBc0IsV0FBVyxDQUFDLE9BQWdDOzs7UUFLaEUsTUFBTSxLQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQSxNQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxPQUFPLDBDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1lBRXRDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFnQkQsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXpDLE1BQU0sSUFBSSxHQUFvQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFLN0csTUFBTSxVQUFVLEdBQUcsTUFBTSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0MsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBRTFFLElBQUksU0FBUyxHQUE0QixFQUFFLENBQUM7UUFFNUMsSUFBSTtZQUVGLElBQUk7Z0JBQ0YsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbEM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFFWixNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUMxQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUseUJBQXlCLEVBQUU7d0JBQ3ZELE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0RUFBNEU7OEJBQzVFLGlGQUFpRjs0QkFDakYsaUVBQWlFLENBQUM7cUJBQy9GLEVBQUU7d0JBQ0QsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQzlDLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7Z0NBQ3ZDLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0NBQ2IsT0FBTyxPQUFPLEVBQUUsQ0FBQzs0QkFDbkIsQ0FBQzt5QkFDRjtxQkFDRixDQUFDLENBQUE7Z0JBQ0osQ0FBQyxDQUFDLENBQUE7YUFDSDtZQUdELE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFHakQsTUFBTSxpQkFBaUIsR0FBbUIsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpILE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQU1qRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUc5QyxJQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssU0FBUyxFQUFFO29CQUN6QixHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkIsT0FBTyxHQUFHLENBQUM7aUJBQ1o7Z0JBRUQsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JCLE9BQU8sR0FBRyxDQUFDO1lBRWIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUvQixPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBR3pELE1BQU0sU0FBUyxHQUFZLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUM7WUFFdkksT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxTQUFTLENBQUMsQ0FBQztZQU1qRCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBSXZDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLGlCQUFpQixDQUFDLElBQUksQ0FBQztvQkFDckIsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRO29CQUNoQixLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNqQixPQUFPLEVBQUUsSUFBSTtvQkFDYixJQUFJLEVBQUUsY0FBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQztvQkFDekMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO29CQUNkLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQXVCO2lCQUN6QyxDQUFDLENBQUE7WUFDSixDQUFDLENBQUMsQ0FBQztZQVFILE9BQU8saUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUNsRTtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCOztDQUNGO0FBeEhELGtDQXdIQztBQUdELFNBQXNCLHFCQUFxQixDQUFDLEdBQXdCOzs7UUFFbEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQUEsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLDBDQUFFLEVBQUUsQ0FBQztRQUVyRCxNQUFNLE9BQU8sR0FBaUI7WUFDNUIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsOENBQThDLENBQUM7WUFDcEUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztTQUMzRCxDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQVUsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTFELE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFHakUsSUFBRyxZQUFZLEtBQUssU0FBUztZQUMzQixPQUFPO1FBRVQsY0FBYyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQzs7Q0FDbkM7QUFuQkQsc0RBbUJDO0FBRUQsU0FBc0IscUJBQXFCLENBQUMsR0FBd0I7O1FBRWxFLE1BQU0sZ0JBQWdCLEdBQVUsY0FBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUV2RixPQUFPLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFekUsY0FBYyxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FBQTtBQVBELHNEQU9DO0FBRUQsU0FBUyxzQkFBc0IsQ0FBQyxHQUFHO0lBQ2pDLE9BQU8sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUE7QUFDekMsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLElBQWMsRUFBRSxJQUFZLEVBQUUsUUFBaUI7O0lBQ25FLE9BQU8sTUFBQSxNQUFBLE1BQUEsUUFBUSxDQUFDLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLDBDQUFFLENBQUMsMENBQUUsS0FBSyxtQ0FBSSxRQUFRLENBQUM7QUFDL0QsQ0FBQztBQUVELFNBQWUsY0FBYyxDQUFDLEdBQXdCLEVBQUUsT0FBYzs7O1FBRXBFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7UUFFckQsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1lBQ25CLEVBQUUsRUFBRSwrQkFBK0I7WUFDbkMsS0FBSyxFQUFFLG9CQUFvQjtZQUMzQixPQUFPLEVBQUUsT0FBTztZQUNoQixJQUFJLEVBQUUsVUFBVTtZQUNoQixTQUFTLEVBQUUsSUFBSTtZQUNmLGFBQWEsRUFBRSxLQUFLO1NBQ3JCLENBQUMsQ0FBQztRQUVILElBQUk7WUFFRixNQUFNLFlBQVksR0FBZ0IsTUFBTSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUdoRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBQSxZQUFZLGFBQVosWUFBWSx1QkFBWixZQUFZLENBQUUsSUFBSSwwQ0FBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUN0RSxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBQSxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxRQUFRLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0QsTUFBTSxNQUFNLEdBQUcsTUFBQSxRQUFRLENBQUMsTUFBQSxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxRQUFRLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLG1DQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQ25GLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQVMsS0FBSyxFQUFFLENBQUMsRUFBRTtnQkFDM0UsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDbEM7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFTLEtBQUssRUFBRSxDQUFDLEVBQUU7Z0JBQy9FLFFBQVEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ3BDO1lBR0QsSUFBSSxTQUFTLEdBQVksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEksT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUdwRCxJQUFHLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNwQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7b0JBQ25CLElBQUksRUFBRSxTQUFTO29CQUNmLEVBQUUsRUFBRSxrQ0FBa0M7b0JBQ3RDLEtBQUssRUFBRSxtQkFBbUI7b0JBQzFCLE9BQU8sRUFBRSxxSUFBcUk7aUJBRy9JLENBQUMsQ0FBQzthQUlKO1lBRUQsTUFBTSxXQUFXLEdBQWMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFRekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUt4RCxNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUdqQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUd4QyxJQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssU0FBUyxFQUFFO29CQUN6QixPQUFPLEdBQUcsQ0FBQztpQkFDWjtnQkFHRCxJQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTO29CQUN6SSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUdqQixPQUFPLEdBQUcsQ0FBQztZQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVQLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0VBQWdFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFRdkYsSUFBSSxZQUFZLEdBQTRCLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBRzNFLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFHOUcsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO29CQUNyQixHQUFHLENBQUMsSUFBSSxDQUFDO3dCQUNQLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUTt3QkFDaEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDakIsT0FBTyxFQUFFLElBQUk7d0JBQ2IsSUFBSSxFQUFFLGNBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7d0JBQ3pDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTt3QkFDZCxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUF1QjtxQkFDekMsQ0FBQyxDQUFDO2lCQUNKO2dCQUVELE9BQU8sR0FBRyxDQUFDO1lBQ2IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRVAsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzREFBc0QsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUdsRixPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQixZQUFZLENBQUMsSUFBSSxDQUFDO29CQUNoQixFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVE7b0JBQ2hCLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ2pCLE9BQU8sRUFBRSxJQUFJO29CQUNiLElBQUksRUFBRSxjQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO29CQUN6QyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7b0JBQ2QsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBdUI7aUJBQ3pDLENBQUMsQ0FBQTtZQUNKLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxREFBcUQsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVqRixZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUVyRCxPQUFPLENBQUMsR0FBRyxDQUFDLDhDQUE4QyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBTzFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBUWxFLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBRXpELEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsRUFBRSxFQUFFLHdCQUF3QjtnQkFDNUIsS0FBSyxFQUFFLHFCQUFxQjtnQkFDNUIsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUV4QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBRVosR0FBRyxDQUFDLG1CQUFtQixDQUFDLCtCQUErQixDQUFDLENBQUM7WUFFekQsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtnQkFDNUQsV0FBVyxFQUFFLEtBQUs7YUFDbkIsQ0FBQyxDQUFDO1NBQ0o7O0NBRUY7QUFFRCxTQUFlLFFBQVEsQ0FBQyxHQUF3QixFQUFFLFFBQWdCOzs7UUFFaEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQUEsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLDBDQUFFLEVBQUUsQ0FBQztRQUdyRCxNQUFNLFNBQVMsR0FBbUIsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUUzRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRTlDLElBQUk7WUFFRixNQUFNLFdBQVcsR0FBRyxNQUFNLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUcvQyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBQSxXQUFXLGFBQVgsV0FBVyx1QkFBWCxXQUFXLENBQUUsSUFBSSwwQ0FBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUNyRSxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBQSxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxRQUFRLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0QsTUFBTSxNQUFNLEdBQUcsTUFBQSxRQUFRLENBQUMsTUFBQSxNQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxRQUFRLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLG1DQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQ25GLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQVMsS0FBSyxFQUFFLENBQUMsRUFBRTtnQkFDM0UsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDbEM7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFTLEtBQUssRUFBRSxDQUFDLEVBQUU7Z0JBQy9FLFFBQVEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ3BDO1lBR0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLFFBQVEsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLElBQUksMENBQUUsTUFBTSxtREFBRyxJQUFJLENBQUMsRUFBRSxDQUN0RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLG1DQUFJLEVBQUUsQ0FBQztZQU0vRixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFOztnQkFBQyxPQUFBLENBQUMsQ0FBQyxDQUFBLE1BQUEsS0FBSyxDQUFDLElBQUksMENBQUUsSUFBSSxDQUFBO3VCQUM5QyxLQUFLLENBQUMsT0FBTzt1QkFDYixDQUFDLENBQUEsTUFBQSxLQUFLLENBQUMsSUFBSSwwQ0FBRSxRQUFRLENBQUEsQ0FBQTthQUFBLENBQUMsQ0FBQztZQUUxQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBR3BELEtBQUssTUFBTSxLQUFLLElBQUksWUFBWSxFQUFFO2dCQUVoQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7b0JBQ3BCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsRUFBRTtvQkFDNUIsU0FBUyxFQUFFO3dCQUNULEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO3dCQUNwRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTt3QkFDN0QsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7d0JBQ2xFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFO3dCQUNsRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRTtxQkFDbkU7aUJBQ0YsQ0FBQyxDQUFDO2FBQ0o7WUFHRCxNQUFNLGNBQWMsR0FBRyxZQUFZO2lCQUVoQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ3pCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUU7Z0JBQ25CLFNBQVMsRUFBRTtvQkFDVCxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtpQkFDbkU7YUFDRixDQUFDLENBQUMsQ0FBQztZQUVOLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLGdCQUFnQixDQUFDO1lBQzdDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQztZQUV6QyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTdDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsRUFBRSxFQUFFLHdCQUF3QjtnQkFDNUIsS0FBSyxFQUFFLHFCQUFxQjtnQkFDNUIsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztTQUVKO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO2dCQUMzRCxXQUFXLEVBQUUsS0FBSztnQkFDbEIsT0FBTyxFQUFFLGdFQUFnRTthQUMxRSxDQUFDLENBQUM7U0FDSjs7Q0FFRjtBQUVELFNBQXNCLFlBQVksQ0FBQyxHQUF3Qjs7UUFFekQsTUFBTSxPQUFPLEdBQWlCO1lBQzVCLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLDRDQUE0QyxDQUFDO1lBQ2xFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDMUQsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQVUsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTFELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLFlBQVksRUFBRSxDQUFDLENBQUM7UUFHNUMsSUFBRyxZQUFZLEtBQUssU0FBUztZQUMzQixPQUFPO1FBRVQsUUFBUSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQUE7QUFqQkQsb0NBaUJDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLEdBQXdCOztRQUV6RCxNQUFNLFlBQVksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBRTVFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLFlBQVksRUFBRSxDQUFDLENBQUM7UUFFNUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQUE7QUFQRCxvQ0FPQztBQUVELFNBQXNCLFdBQVcsQ0FBQyxHQUF3Qjs7O1FBRXhELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7UUFHckQsTUFBTSxTQUFTLEdBQW1CLGlCQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFM0csT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7O0NBQ3ZDO0FBVEQsa0NBU0M7QUFJRCxTQUFlLGVBQWUsQ0FBQyxHQUF3Qjs7UUFFckQsTUFBTSxZQUFZLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUM1RSxNQUFNLEdBQUcsR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNwQyxPQUFPLElBQUEsMkJBQWtCLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUFBO0FBRUQsU0FBZSxXQUFXLENBQUMsT0FBZTs7UUFHeEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLE9BQU8sSUFBQSwyQkFBa0IsRUFBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxDQUFDO0NBQUE7QUFFRCxTQUFlLGdCQUFnQixDQUFDLEdBQXdCLEVBQUUsSUFBa0IsRUFBRSxRQUFnQjs7UUFFNUYsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBTyxFQUFFLENBQUM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxJQUFJO1lBQ0YsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDeEM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMvRCxPQUFPO1NBQ1I7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFzQixRQUFRLENBQUMsSUFBcUIsRUFDckIsT0FBd0I7O1FBSXJELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FBQTtBQU5ELDRCQU1DO0FBR0QsU0FBZSxRQUFRLENBQUMsR0FBd0I7O1FBQzlDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXBDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTFCLElBQUksUUFBUSxDQUFDO1FBQ2IsSUFBSTtZQUNGLFFBQVEsR0FBRyxNQUFNLGlCQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1NBQ3JEO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxHQUFHLENBQUMscUJBQXFCLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUN0RixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBRUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBTSxRQUFRLEVBQUMsRUFBRTtZQUN0RCxPQUFPLGlCQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ3pELE1BQU0sSUFBSSxHQUFHLEdBQVMsRUFBRTs7b0JBQ3RCLElBQUk7d0JBQ0YsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDO3dCQUMvRSxNQUFNLEdBQUcsR0FBRyxDQUFDLGFBQWEsS0FBSyxTQUFTLENBQUM7NEJBQ3ZDLENBQUMsQ0FBQyxNQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFPLENBQUMsMENBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQzs0QkFDeEQsQ0FBQyxDQUFDLFNBQVMsQ0FBQzt3QkFFZCxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUVoRCxPQUFPOzRCQUNMLFFBQVE7NEJBQ1IsR0FBRzs0QkFDSCxJQUFJLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQzt5QkFDbEQsQ0FBQztxQkFDSDtvQkFBQyxPQUFPLEdBQUcsRUFBRTt3QkFDWixJQUFJLEdBQUcsWUFBWSxpQkFBaUIsRUFBRTs0QkFDcEMsTUFBTSxPQUFPLEdBQUcsMkRBQTJEO2tDQUN2RSxzRUFBc0U7a0NBQ3RFLHVFQUF1RTtrQ0FDdkUsaUVBQWlFLENBQUM7NEJBQ3RFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyw4QkFBOEIsRUFBRSxPQUFPLEVBQy9ELEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7NEJBQzFCLE9BQU8sU0FBUyxDQUFDO3lCQUNsQjt3QkFHRCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFOzRCQUN6QixHQUFHLENBQUMscUJBQXFCLENBQUMsd0pBQXdKLEVBQUUsR0FBRyxFQUFFO2dDQUN2TCxXQUFXLEVBQUUsS0FBSztnQ0FDbEIsT0FBTyxFQUFFLFFBQVE7NkJBQ2xCLENBQUMsQ0FBQzt5QkFDSjt3QkFDRCxPQUFPLFNBQVMsQ0FBQztxQkFDbEI7Z0JBQ0gsQ0FBQyxDQUFBLENBQUM7Z0JBQ0YsT0FBTyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBRUosT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUM7Q0FBQTtBQUVELE1BQU0sU0FBUyxHQUEwQyxFQUFFLENBQUM7QUFFNUQsU0FBZSxXQUFXLENBQUMsR0FBd0IsRUFBRSxPQUFlOztRQUVsRSxJQUFJLEdBQUcsQ0FBQztRQUVSLElBQUk7WUFDRSxHQUFHLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBQyxDQUFFLENBQUM7U0FDbkY7UUFBQyxPQUFNLEtBQUssRUFBRTtZQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDcEQ7UUFJRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBSWhHLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztDQUFBO0FBRUQsU0FBZSxVQUFVLENBQUMsR0FBd0IsRUFBRSxPQUFlOztRQVFqRSxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksS0FBYyxDQUFDO1FBRW5CLE9BQU8sWUFBWSxHQUFHLFVBQVUsRUFBRTtZQUVoQyxLQUFLLEdBQUcsTUFBTSxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBSXhDLElBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ25CLE1BQU07YUFDUDtZQUdELFlBQVksRUFBRSxDQUFDO1lBRWYsSUFBRyxZQUFZLEtBQUssVUFBVSxFQUFFO2dCQUU5QixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsWUFBWSxZQUFZLElBQUksVUFBVSxzREFBc0QsQ0FBQyxDQUFDO2dCQUVoSixHQUFHLENBQUMsZ0JBQWdCLENBQUM7b0JBQ25CLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLG9HQUFvRztpQkFDdkksQ0FBQyxDQUFDO2dCQUdILE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsWUFBWSxZQUFZLElBQUksVUFBVSx3Q0FBd0MsQ0FBQyxDQUFDO1NBQ2xJO1FBT0QsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssVUFBVSxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUsxSSxPQUFPLENBQUMsZ0JBQWdCLENBQUM7SUFDM0IsQ0FBQztDQUFBO0FBS0QsU0FBZSxrQkFBa0IsQ0FBQyxHQUF3QixFQUFFLE9BQWUsRUFBRSxHQUFlOzs7UUFDMUYsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsSUFBSSwwQ0FBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEQsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQUEsTUFBQSxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsUUFBUSwwQ0FBRyxDQUFDLENBQUMsMENBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRTNFLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBWSxFQUFFLFFBQW1CLEVBQUUsRUFBRSxtQkFDakQsT0FBQSxNQUFBLE1BQUEsTUFBQSxRQUFRLENBQUMsVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsMENBQUUsQ0FBQywwQ0FBRSxLQUFLLG1DQUFJLFFBQVEsRUFBRSxDQUFBLEVBQUEsQ0FBQztRQUVoRSxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxjQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFOUQsSUFBSSxRQUFnQixDQUFDO1FBRXJCLElBQUc7WUFDRCxRQUFRLEdBQUcsTUFBTSxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzNDO1FBQUMsT0FBTSxLQUFLLEVBQUU7WUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3hEO1FBR0QsT0FBTztZQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQztZQUN2QyxXQUFXLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUM7WUFDakQsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO1lBQ3JDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUMxQixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7WUFDakMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDO1lBQ3JDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM5QyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDbkMsUUFBUSxFQUFFLFFBQVE7U0FDbkIsQ0FBQzs7Q0FDSDtBQUdELE1BQU0saUJBQWtCLFNBQVEsS0FBSztJQUNuQztRQUNFLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7SUFDbEMsQ0FBQztDQUNGO0FBRUQsU0FBUyxNQUFNLENBQUMsR0FBd0IsRUFDdEMsTUFBb0IsRUFDcEIsT0FBdUI7SUFDdkIsT0FBTyxJQUFJLE9BQU8sQ0FBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDcEQsSUFBSSxRQUFRLEdBQVksS0FBSyxDQUFDO1FBQzlCLElBQUksTUFBTSxHQUFXLEVBQUUsQ0FBQztRQUV4QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxhQUFhLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQ25FLE1BQU0sS0FBSyxHQUFlLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ3RELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUNqQyxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNwQjtRQUNELE1BQU0sR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDcEYsTUFBTSxJQUFJLEdBQUc7WUFDWCxVQUFVLEVBQUUsTUFBTTtZQUNsQixVQUFVLEVBQUUsT0FBTyxDQUFDLE1BQU07WUFDMUIsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQztRQUVGLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzNDO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNoQztRQUVELElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7WUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2pEO1FBQ0QsSUFBSSxPQUFPLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDL0M7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFBLHFCQUFLLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTlCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFZLEVBQUUsRUFBRTtZQUNoQyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNiLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFFBQVEsRUFBRTtvQkFDOUIsTUFBTSxDQUFDLElBQUksaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO2lCQUNqQztnQkFDRCxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUNoQixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDaEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2I7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUNoQixJQUFJLElBQUksS0FBSyxDQUFDLEVBQUU7b0JBQ2QsT0FBTyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQzNDO3FCQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNsQyxPQUFPLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQy9DO3FCQUFNO29CQUVMLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRTt3QkFDZCxJQUFJLElBQUksR0FBRyxDQUFDO3FCQUNiO29CQUNELE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLHNCQUFzQixJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUNwRCxHQUFHLENBQUMsbUJBQW1CLENBQUMsR0FBRyxJQUFJLENBQUM7b0JBQ2hDLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNwQjthQUNGO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFlLFdBQVcsQ0FBQyxHQUF3Qjs7UUFDakQsSUFBSSxJQUFjLENBQUM7UUFDbkIsSUFBSTtZQUNGLElBQUksR0FBRyxDQUFDLE1BQU0sZUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2lCQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDO1NBQ3hFO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO2dCQUN6QixJQUFJO29CQUNGLE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2lCQUN0RTtnQkFBQyxPQUFPLEdBQUcsRUFBRTtpQkFFYjthQUNGO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7b0JBQzlELEVBQUUsRUFBRSxzQkFBc0I7b0JBQzFCLE9BQU8sRUFBRSxRQUFRLEVBQUU7aUJBQ3BCLENBQUMsQ0FBQzthQUNKO1lBQ0QsSUFBSSxHQUFHLEVBQUUsQ0FBQztTQUNYO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQUE7QUFFRCxTQUFlLFVBQVUsQ0FBQyxHQUF3QixFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTzs7UUFDNUUsT0FBTyxNQUFNLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUNsQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNyRSxDQUFDO0NBQUE7QUFFRCxTQUFlLFdBQVcsQ0FBQyxHQUF3QixFQUFFLE9BQWUsRUFBRSxHQUFlOztRQUNuRixNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFBLGtCQUFPLEdBQUUsQ0FBQyxDQUFDO1FBQzVFLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsQyxNQUFNLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2RCxJQUFJO1lBR0YsSUFBSSxXQUFXLEdBQVcsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDMUQsTUFBTSxJQUFBLG1CQUFJLEVBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUM3QixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssVUFBVSxDQUFDLENBQUM7Z0JBQ3ZGLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtvQkFDdEIsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7aUJBQzdCO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEQsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLDJCQUFrQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixPQUFPLElBQUksQ0FBQztTQUNiO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0IsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ25DO2lCQUFNLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFO2dCQUUzRSxHQUFHLENBQUMsZ0JBQWdCLENBQUM7b0JBQ25CLElBQUksRUFBRSxTQUFTO29CQUNmLE9BQU8sRUFBRSxpRkFBaUY7b0JBQzFGLE9BQU8sRUFBRSxDQUFDOzRCQUNSLEtBQUssRUFBRSxNQUFNOzRCQUNiLE1BQU0sRUFBRSxHQUFHLEVBQUU7Z0NBQ1gsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUU7b0NBQy9DLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztpQ0FDckIsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTs0QkFDMUIsQ0FBQzt5QkFDRixDQUFDO29CQUNGLE9BQU8sRUFBRTt3QkFDUCxPQUFPLEVBQUUsaUJBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDO3FCQUNqQztpQkFDRixDQUFDLENBQUE7Z0JBQ0YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ25DO2lCQUFNO2dCQUNMLE1BQU0sR0FBRyxDQUFDO2FBQ1g7U0FDRjtJQUNILENBQUM7Q0FBQTtBQUVELFNBQVMsUUFBUSxDQUF3QyxLQUFVLEVBQUUsRUFBVTs7SUFDN0UsT0FBTyxNQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsbUNBQUksU0FBUyxDQUFDO0FBQzVELENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEdBQXdCO0lBQ2pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLElBQUksR0FBb0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO0lBQzdFLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtRQUN0QixJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFDdEMsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBZSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQWdCLEVBQUUsRUFBVSxFQUFFLEVBQUU7UUFDbEYsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLHVCQUF1QixFQUFFO1lBQzdDLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6RSxNQUFNLFVBQVUsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUUsSUFBSTtnQkFDRixJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUNqQjthQUNGO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7YUFDeEU7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRWQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUN0QyxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxPQUFnQyxFQUFFLFNBQWtCO0lBQzNFLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDeEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sT0FBTyxHQUFtQixDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUM7UUFDdkQsQ0FBQyxDQUFDLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUM7UUFDekMsQ0FBQyxDQUFDLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRW5DLElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7UUFDL0IsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxNQUFNLFNBQVMsR0FBMkIsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUMxRCxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5RCxJQUFJLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksTUFBSyxTQUFTLEVBQUU7UUFDakMsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxNQUFNLElBQUksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN0RSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO0FBQ2xELENBQUM7QUFuQkQsNEJBbUJDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLE9BQWdDLEVBQ2hDLFNBQWtCLEVBQ2xCLEtBQWM7O1FBQy9DLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUN0QztRQUVELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7U0FDbEY7UUFFRCxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZELElBQUk7WUFDRixJQUFJO2dCQUNGLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNoQztZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQy9FO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtRQUdELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7Q0FBQTtBQXhCRCxvQ0F3QkM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxTQUFpQjtJQUNqRCxPQUFPLGNBQUksQ0FBQyxJQUFJLENBQUMsaUJBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEVBQUUsZ0JBQU8sRUFBRSxTQUFTLEdBQUcsR0FBRyxHQUFHLHFCQUFZLENBQUMsQ0FBQztBQUM1RixDQUFDO0FBRkQsOENBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgZ2VuZXJhdGUgYXMgc2hvcnRpZCB9IGZyb20gJ3Nob3J0aWQnO1xuaW1wb3J0IHdhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBJTlZBTElEX0xPX01PRF9UWVBFUywgTE9fRklMRV9OQU1FIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgQkczUGFrLCBEaXZpbmVBY3Rpb24sIElEaXZpbmVPcHRpb25zLCBJRGl2aW5lT3V0cHV0LCBJTW9kTm9kZSwgSU1vZFNldHRpbmdzLCBJUGFrSW5mbywgSVByb3BzLCBJWG1sTm9kZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQnVpbGRlciwgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcbmltcG9ydCB7IExvY2tlZFN0YXRlIH0gZnJvbSAndm9ydGV4LWFwaS9saWIvZXh0ZW5zaW9ucy9maWxlX2Jhc2VkX2xvYWRvcmRlci90eXBlcy90eXBlcyc7XG5pbXBvcnQgeyBJT3Blbk9wdGlvbnMgfSBmcm9tICd2b3J0ZXgtYXBpL2xpYi90eXBlcy9JRXh0ZW5zaW9uQ29udGV4dCc7XG5cblxuZnVuY3Rpb24gZG9jdW1lbnRzUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2xvY2FsQXBwRGF0YScpLCAnTGFyaWFuIFN0dWRpb3MnLCAnQmFsZHVyXFwncyBHYXRlIDMnKTtcbn1cblxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnTW9kcycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvZmlsZXNQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ1BsYXllclByb2ZpbGVzJyk7XG59XG5cbmZ1bmN0aW9uIGdsb2JhbFByb2ZpbGVQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ2dsb2JhbCcpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VyaWFsaXplKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdpbnZhbGlkIHByb3BzJykpO1xuICB9XG4gIFxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG5cbiAgLy8gTWFrZSBzdXJlIHRoZSBMTyBmaWxlIGlzIGNyZWF0ZWQgYW5kIHJlYWR5IHRvIGJlIHdyaXR0ZW4gdG8uXG4gIGNvbnN0IGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCwgcHJvZmlsZUlkLCBwcm9wcyk7XG4gIC8vY29uc3QgZmlsdGVyZWRMTyA9IGxvYWRPcmRlci5maWx0ZXIobG8gPT4gKCFJTlZBTElEX0xPX01PRF9UWVBFUy5pbmNsdWRlcyhwcm9wcy5tb2RzPy5bbG8/Lm1vZElkXT8udHlwZSkpKTtcblxuICBjb25zb2xlLmxvZygnc2VyaWFsaXplIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xuXG4gIC8vIFdyaXRlIHRoZSBwcmVmaXhlZCBMTyB0byBmaWxlLlxuICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsb0ZpbGVQYXRoKS5jYXRjaCh7IGNvZGU6ICdFTk9FTlQnIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcbiAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobG9GaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkobG9hZE9yZGVyKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG4gIC8vIGNoZWNrIHRoZSBzdGF0ZSBmb3IgaWYgd2UgYXJlIGtlZXBpbmcgdGhlIGdhbWUgb25lIGluIHN5bmNcbiAgLy8gaWYgd2UgYXJlIHdyaXRpbmcgdm9ydGV4J3MgbG9hZCBvcmRlciwgdGhlbiB3ZSB3aWxsIGFsc28gd3JpdGUgdGhlIGdhbWVzIG9uZVxuXG4gIGNvbnN0IGF1dG9FeHBvcnRUb0dhbWU6Ym9vbGVhbiA9IHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXS5hdXRvRXhwb3J0TG9hZE9yZGVyID8/IGZhbHNlO1xuXG4gIGNvbnNvbGUubG9nKCdzZXJpYWxpemUgYXV0b0V4cG9ydFRvR2FtZT0nLCBhdXRvRXhwb3J0VG9HYW1lKTtcblxuICBpZihhdXRvRXhwb3J0VG9HYW1lKSBcbiAgICBhd2FpdCBleHBvcnRUb0dhbWUoY29udGV4dC5hcGkpO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlc2VyaWFsaXplKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KTogUHJvbWlzZTx0eXBlcy5Mb2FkT3JkZXI+IHtcbiAgXG4gIC8vIGdlblByb3BzIGlzIGEgc21hbGwgdXRpbGl0eSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIG9mdGVuIHJlLXVzZWQgb2JqZWN0c1xuICAvLyAgc3VjaCBhcyB0aGUgY3VycmVudCBsaXN0IG9mIGluc3RhbGxlZCBNb2RzLCBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZSxcbiAgLy8gIHRoZSBjdXJyZW50bHkgYWN0aXZlIHByb2ZpbGUsIGV0Yy5cbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xuICBpZiAocHJvcHM/LnByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIC8vIFdoeSBhcmUgd2UgZGVzZXJpYWxpemluZyB3aGVuIHRoZSBwcm9maWxlIGlzIGludmFsaWQgb3IgYmVsb25ncyB0byBhbm90aGVyIGdhbWUgP1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG5cbi8qXG5cblxuICAvLyBUaGUgZGVzZXJpYWxpemF0aW9uIGZ1bmN0aW9uIHNob3VsZCBiZSB1c2VkIHRvIGZpbHRlciBhbmQgaW5zZXJ0IHdhbnRlZCBkYXRhIGludG8gVm9ydGV4J3NcbiAgLy8gIGxvYWRPcmRlciBhcHBsaWNhdGlvbiBzdGF0ZSwgb25jZSB0aGF0J3MgZG9uZSwgVm9ydGV4IHdpbGwgdHJpZ2dlciBhIHNlcmlhbGl6YXRpb24gZXZlbnRcbiAgLy8gIHdoaWNoIHdpbGwgZW5zdXJlIHRoYXQgdGhlIGRhdGEgaXMgd3JpdHRlbiB0byB0aGUgTE8gZmlsZS5cbiAgY29uc3QgY3VycmVudE1vZHNTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5wcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcblxuICAvLyB3ZSBvbmx5IHdhbnQgdG8gaW5zZXJ0IGVuYWJsZWQgbW9kcy5cbiAgY29uc3QgZW5hYmxlZE1vZElkcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRNb2RzU3RhdGUpXG4gICAgLmZpbHRlcihtb2RJZCA9PiB1dGlsLmdldFNhZmUoY3VycmVudE1vZHNTdGF0ZSwgW21vZElkLCAnZW5hYmxlZCddLCBmYWxzZSkpOyovXG5cbiAgXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLcyhjb250ZXh0LmFwaSk7XG5cbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG5cbiAgLy8gY3JlYXRlIGlmIG5lY2Vzc2FyeSwgYnV0IGxvYWQgdGhlIGxvYWQgb3JkZXIgZnJvbSBmaWxlXG4gICAgXG4gIGNvbnN0IGxvRmlsZVBhdGggPSBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XG4gIGNvbnN0IGZpbGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsb0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG5cbiAgbGV0IGxvYWRPcmRlcjogdHlwZXMuSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcblxuICB0cnkge1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBsb2FkT3JkZXIgPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcblxuICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBwcm9wcy5hcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnQ29ycnVwdCBsb2FkIG9yZGVyIGZpbGUnLCB7XG4gICAgICAgICAgYmJjb2RlOiBwcm9wcy5hcGkudHJhbnNsYXRlKCdUaGUgbG9hZCBvcmRlciBmaWxlIGlzIGluIGEgY29ycnVwdCBzdGF0ZS4gWW91IGNhbiB0cnkgdG8gZml4IGl0IHlvdXJzZWxmICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ29yIFZvcnRleCBjYW4gcmVnZW5lcmF0ZSB0aGUgZmlsZSBmb3IgeW91LCBidXQgdGhhdCBtYXkgcmVzdWx0IGluIGxvc3Mgb2YgZGF0YSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyhXaWxsIG9ubHkgYWZmZWN0IGxvYWQgb3JkZXIgaXRlbXMgeW91IGFkZGVkIG1hbnVhbGx5LCBpZiBhbnkpLicpXG4gICAgICAgIH0sIFtcbiAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiByZWplY3QoZXJyKSB9LFxuICAgICAgICAgIHsgbGFiZWw6ICdSZWdlbmVyYXRlIEZpbGUnLCBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIGxvYWRPcmRlciA9IFtdO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgXSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgXG4gICAgY29uc29sZS5sb2coJ2Rlc2VyaWFsaXplIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xuXG4gICAgLy8gZmlsdGVyIG91dCBhbnkgcGFrIGZpbGVzIHRoYXQgbm8gbG9uZ2VyIGV4aXN0XG4gICAgY29uc3QgZmlsdGVyZWRMb2FkT3JkZXI6dHlwZXMuTG9hZE9yZGVyID0gbG9hZE9yZGVyLmZpbHRlcihlbnRyeSA9PiBwYWtzLmZpbmQocGFrID0+IHBhay5maWxlTmFtZSA9PT0gZW50cnkuaWQpKTtcblxuICAgIGNvbnNvbGUubG9nKCdkZXNlcmlhbGl6ZSBmaWx0ZXJlZExvYWRPcmRlcj0nLCBmaWx0ZXJlZExvYWRPcmRlcik7XG5cbiAgICAvLyBmaWx0ZXIgb3V0IHBhayBmaWxlcyB0aGF0IGRvbid0IGhhdmUgYSBjb3JyZXNwb25kaW5nIG1vZCAod2hpY2ggbWVhbnMgVm9ydGV4IGRpZG4ndCBpbnN0YWxsIGl0L2lzbid0IGF3YXJlIG9mIGl0KVxuICAgIC8vY29uc3QgcGFrc1dpdGhNb2RzOkJHM1Bha1tdID0gcGFrcy5maWx0ZXIocGFrID0+IHBhay5tb2QgIT09IHVuZGVmaW5lZCk7XG5cbiAgICAgIC8vIGdvIHRocm91Z2ggZWFjaCBwYWsgZmlsZSBpbiB0aGUgTW9kcyBmb2xkZXIuLi5cbiAgICBjb25zdCBwcm9jZXNzZWRQYWtzID0gcGFrcy5yZWR1Y2UoKGFjYywgY3VycikgPT4geyAgICAgIFxuXG4gICAgICAvLyBpZiBwYWsgZmlsZSBkb2Vzbid0IGhhdmUgYW4gYXNzb2NpYXRlZCBtb2QsIHRoZW4gd2UgZG9uJ3Qgd2FudCB0byBkZWFsIHdpdGggaXRcbiAgICAgIGlmKGN1cnIubW9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYWNjLmludmFsaWQucHVzaChjdXJyKTsgXG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGFjYy52YWxpZC5wdXNoKGN1cnIpO1xuICAgICAgcmV0dXJuIGFjYztcblxuICAgIH0sIHsgdmFsaWQ6IFtdLCBpbnZhbGlkOiBbXSB9KTtcblxuICAgIGNvbnNvbGUubG9nKCdkZXNlcmlhbGl6ZSBwcm9jZXNzZWRQYWtzPScsIHByb2Nlc3NlZFBha3MpO1xuXG4gICAgLy8gZ2V0IGFueSBwYWsgZmlsZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIGZpbHRlcmVkTG9hZE9yZGVyXG4gICAgY29uc3QgYWRkZWRNb2RzOkJHM1Bha1tdID0gcHJvY2Vzc2VkUGFrcy52YWxpZC5maWx0ZXIocGFrID0+IGZpbHRlcmVkTG9hZE9yZGVyLmZpbmQoZW50cnkgPT4gZW50cnkuaWQgPT09IHBhay5maWxlTmFtZSkgPT09IHVuZGVmaW5lZCk7XG5cbiAgICBjb25zb2xlLmxvZygnZGVzZXJpYWxpemUgYWRkZWRNb2RzPScsIGFkZGVkTW9kcyk7XG4gICAgXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHVzZXIgYWRkZWQgYW55IG5ldyBtb2RzLlxuICAgIC8vY29uc3QgZGlmZiA9IGVuYWJsZWRNb2RJZHMuZmlsdGVyKGlkID0+ICghSU5WQUxJRF9MT19NT0RfVFlQRVMuaW5jbHVkZXMobW9kc1tpZF0/LnR5cGUpKVxuICAgIC8vICAmJiAoZmlsdGVyZWREYXRhLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBpZCkgPT09IHVuZGVmaW5lZCkpO1xuXG4gICAgY29uc29sZS5sb2coJ2Rlc2VyaWFsaXplIHBha3M9JywgcGFrcyk7XG5cblxuICAgIC8vIEFkZCBhbnkgbmV3bHkgYWRkZWQgbW9kcyB0byB0aGUgYm90dG9tIG9mIHRoZSBsb2FkT3JkZXIuXG4gICAgYWRkZWRNb2RzLmZvckVhY2gocGFrID0+IHtcbiAgICAgIGZpbHRlcmVkTG9hZE9yZGVyLnB1c2goe1xuICAgICAgICBpZDogcGFrLmZpbGVOYW1lLFxuICAgICAgICBtb2RJZDogcGFrLm1vZC5pZCxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSwgIC8vIG5vdCB1c2luZyBsb2FkIG9yZGVyIGZvciBlbmFibGluZy9kaXNhYmxpbmcgICAgICBcbiAgICAgICAgbmFtZTogcGF0aC5iYXNlbmFtZShwYWsuZmlsZU5hbWUsICcucGFrJyksXG4gICAgICAgIGRhdGE6IHBhay5pbmZvLFxuICAgICAgICBsb2NrZWQ6IHBhay5pbmZvLmlzTGlzdGVkIGFzIExvY2tlZFN0YXRlICAgICAgICBcbiAgICAgIH0pICAgICAgXG4gICAgfSk7ICAgICAgIFxuXG4gICAgLy9jb25zb2xlLmxvZygnZGVzZXJpYWxpemUgZmlsdGVyZWREYXRhPScsIGZpbHRlcmVkRGF0YSk7XG5cbiAgICAvLyBzb3J0ZWQgc28gdGhhdCBhbnkgbW9kcyB0aGF0IGFyZSBsb2NrZWQgYXBwZWFyIGF0IHRoZSB0b3BcbiAgICAvL2NvbnN0IHNvcnRlZEFuZEZpbHRlcmVkRGF0YSA9IFxuICAgIFxuICAgIC8vIHJldHVyblxuICAgIHJldHVybiBmaWx0ZXJlZExvYWRPcmRlci5zb3J0KChhLCBiKSA9PiAoK2IubG9ja2VkIC0gK2EubG9ja2VkKSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydE1vZFNldHRpbmdzRmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XG5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcblxuICBjb25zdCBvcHRpb25zOiBJT3Blbk9wdGlvbnMgPSB7XG4gICAgdGl0bGU6IGFwaS50cmFuc2xhdGUoJ1BsZWFzZSBjaG9vc2UgYSBCRzMgLmxzeCBmaWxlIHRvIGltcG9ydCBmcm9tJyksXG4gICAgZmlsdGVyczogW3sgbmFtZTogJ0JHMyBMb2FkIE9yZGVyJywgZXh0ZW5zaW9uczogWydsc3gnXSB9XVxuICB9O1xuXG4gIGNvbnN0IHNlbGVjdGVkUGF0aDpzdHJpbmcgPSBhd2FpdCBhcGkuc2VsZWN0RmlsZShvcHRpb25zKTtcblxuICBjb25zb2xlLmxvZygnaW1wb3J0TW9kU2V0dGluZ3NGaWxlIHNlbGVjdGVkUGF0aD0nLCBzZWxlY3RlZFBhdGgpO1xuICBcbiAgLy8gaWYgbm8gcGF0aCBzZWxlY3RlZCwgdGhlbiBjYW5jZWwgcHJvYmFibHkgcHJlc3NlZFxuICBpZihzZWxlY3RlZFBhdGggPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm47XG5cbiAgcHJvY2Vzc0xzeEZpbGUoYXBpLCBzZWxlY3RlZFBhdGgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcblxuICBjb25zdCBnYW1lU2V0dGluZ3NQYXRoOnN0cmluZyA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgJ1B1YmxpYycsICdtb2RzZXR0aW5ncy5sc3gnKTtcblxuICBjb25zb2xlLmxvZygnaW1wb3J0TW9kU2V0dGluZ3NHYW1lIGdhbWVTZXR0aW5nc1BhdGg9JywgZ2FtZVNldHRpbmdzUGF0aCk7XG5cbiAgcHJvY2Vzc0xzeEZpbGUoYXBpLCBnYW1lU2V0dGluZ3NQYXRoKTtcbn1cblxuZnVuY3Rpb24gY2hlY2tJZkR1cGxpY2F0ZUV4aXN0cyhhcnIpIHtcbiAgcmV0dXJuIG5ldyBTZXQoYXJyKS5zaXplICE9PSBhcnIubGVuZ3RoXG59XG5cbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZShub2RlOiBJTW9kTm9kZSwgbmFtZTogc3RyaW5nLCBmYWxsYmFjaz86IHN0cmluZyk6c3RyaW5nIHtcbiAgcmV0dXJuIGZpbmROb2RlKG5vZGU/LmF0dHJpYnV0ZSwgbmFtZSk/LiQ/LnZhbHVlID8/IGZhbGxiYWNrO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzTHN4RmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGxzeFBhdGg6c3RyaW5nKSB7ICBcblxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICBpZDogJ2JnMy1sb2Fkb3JkZXItaW1wb3J0LWFjdGl2aXR5JyxcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBMU1ggRmlsZScsXG4gICAgbWVzc2FnZTogbHN4UGF0aCxcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcbiAgfSk7XG5cbiAgdHJ5IHtcblxuICAgIGNvbnN0IGxzeExvYWRPcmRlcjpJTW9kU2V0dGluZ3MgPSBhd2FpdCByZWFkTHN4RmlsZShsc3hQYXRoKTtcbiAgICBjb25zb2xlLmxvZygncHJvY2Vzc0xzeEZpbGUgbHN4UGF0aD0nLCBsc3hQYXRoKTtcblxuICAgIC8vIGJ1aWxkdXAgb2JqZWN0IGZyb20geG1sXG4gICAgY29uc3QgcmVnaW9uID0gZmluZE5vZGUobHN4TG9hZE9yZGVyPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xuICAgIGNvbnN0IGxvTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpID8/IHsgY2hpbGRyZW46IFtdIH07XG4gICAgaWYgKChsb05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChsb05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBsb05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG5cbiAgICAvLyBnZXQgbmljZSBzdHJpbmcgYXJyYXksIGluIG9yZGVyLCBvZiBtb2RzIGZyb20gdGhlIGxvYWQgb3JkZXIgc2VjdGlvblxuICAgIGxldCB1dWlkQXJyYXk6c3RyaW5nW10gPSBsb05vZGUuY2hpbGRyZW5bMF0ubm9kZS5tYXAoKGxvRW50cnkpID0+IGxvRW50cnkuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnVVVJRCcpKS4kLnZhbHVlKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgcHJvY2Vzc0xzeEZpbGUgdXVpZEFycmF5PWAsIHV1aWRBcnJheSk7XG5cbiAgICAvLyBhcmUgdGhlcmUgYW55IGR1cGxpY2F0ZXM/IGlmIHNvLi4uXG4gICAgaWYoY2hlY2tJZkR1cGxpY2F0ZUV4aXN0cyh1dWlkQXJyYXkpKSB7XG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcbiAgICAgICAgaWQ6ICdiZzMtbG9hZG9yZGVyLWltcG9ydGVkLWR1cGxpY2F0ZScsXG4gICAgICAgIHRpdGxlOiAnRHVwbGljYXRlIEVudHJpZXMnLFxuICAgICAgICBtZXNzYWdlOiAnRHVwbGljYXRlIFVVSURzIGZvdW5kIGluIHRoZSBNb2RPcmRlciBzZWN0aW9uIG9mIHRoZSAubHN4IGZpbGUgYmVpbmcgaW1wb3J0ZWQuIFRoaXMgc29tZXRpbWVzIGNhbiBjYXVzZSBpc3N1ZXMgd2l0aCB0aGUgbG9hZCBvcmRlci4nLFxuICAgICAgICBcbiAgICAgICAgLy9kaXNwbGF5TVM6IDMwMDBcbiAgICAgIH0pOyBcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHRoZXNlIGR1cGxpY2F0ZXMgYWZ0ZXIgdGhlIGZpcnN0IG9uZVxuICAgICAgLy91dWlkQXJyYXkgPSBBcnJheS5mcm9tKG5ldyBTZXQodXVpZEFycmF5KSk7XG4gICAgfSAgIFxuXG4gICAgY29uc3QgbHN4TW9kTm9kZXM6SU1vZE5vZGVbXSA9IG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGU7XG5cbiAgICAvKlxuICAgIC8vIGdldCBtb2RzLCBpbiB0aGUgYWJvdmUgb3JkZXIsIGZyb20gdGhlIG1vZHMgc2VjdGlvbiBvZiB0aGUgZmlsZSBcbiAgICBjb25zdCBsc3hNb2RzOklNb2ROb2RlW10gPSB1dWlkQXJyYXkubWFwKCh1dWlkKSA9PiB7XG4gICAgICByZXR1cm4gbHN4TW9kTm9kZXMuZmluZChtb2ROb2RlID0+IG1vZE5vZGUuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnVVVJRCcpICYmIChhdHRyLiQudmFsdWUgPT09IHV1aWQpKSk7XG4gICAgfSk7Ki9cblxuICAgIGNvbnNvbGUubG9nKGBwcm9jZXNzTHN4RmlsZSBsc3hNb2ROb2Rlcz1gLCBsc3hNb2ROb2Rlcyk7XG5cbiAgICAvLyB3ZSBub3cgaGF2ZSBhbGwgdGhlIGluZm9ybWF0aW9uIGZyb20gZmlsZSB0aGF0IHdlIG5lZWRcblxuICAgIC8vIGxldHMgZ2V0IGFsbCBwYWtzIGZyb20gdGhlIGZvbGRlclxuICAgIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLcyhhcGkpO1xuXG4gICAgLy8gYXJlIHRoZXJlIGFueSBwYWsgZmlsZXMgbm90IGluIHRoZSBsc3ggZmlsZT9cbiAgICBjb25zdCBtaXNzaW5nID0gcGFrcy5yZWR1Y2UoKGFjYywgY3VycikgPT4geyAgXG5cbiAgICAgIC8vIGlmIGN1cnJlbnQgcGFrIGhhcyBubyBhc3NvY2lhdGVkIHBhaywgdGhlbiB3ZSBza2lwLiB3ZSBkZWZpbnRlbHkgYXJlbid0IGFkZGluZyB0aGlzIHBhayBpZiB2b3J0ZXggaGFzbid0IG1hbmFnZWQgaXQuXG4gICAgICBpZihjdXJyLm1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGN1cnJlbnQgcGFrLCB3aGljaCB2b3J0ZXggaGFzIGRlZmluYXRlbHkgbWFuYWdlZCwgaXNuJ3QgYWxyZWFkeSBpbiB0aGUgbHN4IGZpbGUsIHRoZW4gdGhpcyBpcyBtaXNzaW5nIGFuZCB3ZSBuZWVkIHRvIGxvYWQgb3JkZXJcbiAgICAgIGlmKGxzeE1vZE5vZGVzLmZpbmQobHN4RW50cnkgPT4gbHN4RW50cnkuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpICYmIChhdHRyLiQudmFsdWUgPT09IGN1cnIuaW5mby5uYW1lKSkpID09PSB1bmRlZmluZWQpIFxuICAgICAgICBhY2MucHVzaChjdXJyKTtcblxuICAgICAgLy8gc2tpcCB0aGlzIFxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zb2xlLmxvZygncHJvY2Vzc0xzeEZpbGUgLSBtaXNzaW5nIHBhayBmaWxlcyB0aGF0IGhhdmUgYXNzb2NpYXRlZCBtb2RzID0nLCBtaXNzaW5nKTtcblxuICAgIC8vIGJ1aWxkIGEgbG9hZCBvcmRlciBmcm9tIHRoZSBsc3ggZmlsZSBhbmQgYWRkIGFueSBtaXNzaW5nIHBha3MgYXQgdGhlIGVuZD9cblxuICAgIC8vbGV0IG5ld0xvYWRPcmRlcjogdHlwZXMuSUxvYWRPcmRlckVudHJ5W10gPSBbXTtcblxuICAgIC8vIGxvb3AgdGhyb3VnaCBsc3ggbW9kIG5vZGVzIGFuZCBmaW5kIHRoZSBwYWsgdGhleSBhcmUgYXNzb2NpYXRlZCB3aXRoXG5cbiAgICBsZXQgbmV3TG9hZE9yZGVyOiB0eXBlcy5JTG9hZE9yZGVyRW50cnlbXSA9IGxzeE1vZE5vZGVzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG4gICAgICBcbiAgICAgIC8vIGZpbmQgdGhlIGJnM1BhayB0aGlzIGlzIHJlZmVyaW5nIHRvbyBhcyBpdCdzIGVhc2llciB0byBnZXQgYWxsIHRoZSBpbmZvcm1hdGlvblxuICAgICAgY29uc3QgcGFrID0gcGFrcy5maW5kKChwYWspID0+IHBhay5pbmZvLm5hbWUgPT09IGN1cnIuYXR0cmlidXRlLmZpbmQoYXR0ciA9PiAoYXR0ci4kLmlkID09PSAnTmFtZScpKS4kLnZhbHVlKTtcblxuICAgICAgLy8gaWYgdGhlIHBhayBpcyBmb3VuZCwgdGhlbiB3ZSBhZGQgYSBsb2FkIG9yZGVyIGVudHJ5LiBpZiBpdCBpc24ndCwgdGhlbiBpdHMgcHJvYiBiZWVuIGRlbGV0ZWQgaW4gdm9ydGV4IGFuZCBsc3ggaGFzIGFuIGV4dHJhIGVudHJ5XG4gICAgICBpZiAocGFrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYWNjLnB1c2goe1xuICAgICAgICAgIGlkOiBwYWsuZmlsZU5hbWUsXG4gICAgICAgICAgbW9kSWQ6IHBhay5tb2QuaWQsXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSwgICAgICAgIFxuICAgICAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocGFrLmZpbGVOYW1lLCAnLnBhaycpLFxuICAgICAgICAgIGRhdGE6IHBhay5pbmZvLFxuICAgICAgICAgIGxvY2tlZDogcGFrLmluZm8uaXNMaXN0ZWQgYXMgTG9ja2VkU3RhdGUgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCBbXSk7ICAgXG5cbiAgICBjb25zb2xlLmxvZygncHJvY2Vzc0xzeEZpbGUgKGJlZm9yZSBhZGRpbmcgbWlzc2luZykgbmV3TG9hZE9yZGVyPScsIG5ld0xvYWRPcmRlcik7XG5cbiAgICAvLyBBZGQgYW55IG5ld2x5IGFkZGVkIG1vZHMgdG8gdGhlIGJvdHRvbSBvZiB0aGUgbG9hZE9yZGVyLlxuICAgIG1pc3NpbmcuZm9yRWFjaChwYWsgPT4ge1xuICAgICAgbmV3TG9hZE9yZGVyLnB1c2goe1xuICAgICAgICBpZDogcGFrLmZpbGVOYW1lLFxuICAgICAgICBtb2RJZDogcGFrLm1vZC5pZCxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSwgICAgICAgIFxuICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKHBhay5maWxlTmFtZSwgJy5wYWsnKSxcbiAgICAgICAgZGF0YTogcGFrLmluZm8sXG4gICAgICAgIGxvY2tlZDogcGFrLmluZm8uaXNMaXN0ZWQgYXMgTG9ja2VkU3RhdGUgICAgICAgIFxuICAgICAgfSkgICAgICBcbiAgICB9KTsgICBcblxuICAgIGNvbnNvbGUubG9nKCdwcm9jZXNzTHN4RmlsZSAoYWZ0ZXIgYWRkaW5nIG1pc3NpbmcpIG5ld0xvYWRPcmRlcj0nLCBuZXdMb2FkT3JkZXIpO1xuXG4gICAgbmV3TG9hZE9yZGVyLnNvcnQoKGEsIGIpID0+ICgrYi5sb2NrZWQgLSArYS5sb2NrZWQpKTtcblxuICAgIGNvbnNvbGUubG9nKCdwcm9jZXNzTHN4RmlsZSAoYWZ0ZXIgc29ydGluZykgbmV3TG9hZE9yZGVyPScsIG5ld0xvYWRPcmRlcik7XG5cbiAgICAvLyBnZXQgbG9hZCBvcmRlclxuICAgIC8vbGV0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XG4gICAgLy9jb25zb2xlLmxvZygncHJvY2Vzc0xzeEZpbGUgbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XG5cbiAgICAvLyBtYW51YWx5IHNldCBsb2FkIG9yZGVyP1xuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG5ld0xvYWRPcmRlcikpO1xuXG4gICAgLy91dGlsLnNldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBuZXdMb2FkT3JkZXIpO1xuXG4gICAgLy8gZ2V0IGxvYWQgb3JkZXIgYWdhaW4/XG4gICAgLy9sb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XG4gICAgLy9jb25zb2xlLmxvZygncHJvY2Vzc0xzeEZpbGUgbG9hZE9yZGVyPScsIGxvYWRPcmRlcik7XG5cbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignYmczLWxvYWRvcmRlci1pbXBvcnQtYWN0aXZpdHknKTtcblxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgIGlkOiAnYmczLWxvYWRvcmRlci1pbXBvcnRlZCcsXG4gICAgICB0aXRsZTogJ0xvYWQgT3JkZXIgSW1wb3J0ZWQnLFxuICAgICAgbWVzc2FnZTogbHN4UGF0aCxcbiAgICAgIGRpc3BsYXlNUzogMzAwMFxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ3Byb2Nlc3NMc3hGaWxlIGZpbmlzaGVkJyk7XG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgXG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ2JnMy1sb2Fkb3JkZXItaW1wb3J0LWFjdGl2aXR5Jyk7XG5cbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IGxvYWQgb3JkZXInLCBlcnIsIHtcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZVxuICAgIH0pO1xuICB9XG5cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhwb3J0VG8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlcGF0aDogc3RyaW5nKSB7XG5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcblxuICAvLyBnZXQgbG9hZCBvcmRlciBmcm9tIHN0YXRlXG4gIGNvbnN0IGxvYWRPcmRlcjp0eXBlcy5Mb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XG5cbiAgY29uc29sZS5sb2coJ2V4cG9ydFRvIGxvYWRPcmRlcj0nLCBsb2FkT3JkZXIpO1xuXG4gIHRyeSB7XG4gICAgLy8gcmVhZCB0aGUgZ2FtZSBiZzMgbW9kc2V0dGluZ3MubHN4IHNvIHRoYXQgd2UgZ2V0IHRoZSBkZWZhdWx0IGdhbWUgZ3VzdGF2IHRoaW5nP1xuICAgIGNvbnN0IG1vZFNldHRpbmdzID0gYXdhaXQgcmVhZE1vZFNldHRpbmdzKGFwaSk7XG5cbiAgICAvLyBidWlsZHVwIG9iamVjdCBmcm9tIHhtbFxuICAgIGNvbnN0IHJlZ2lvbiA9IGZpbmROb2RlKG1vZFNldHRpbmdzPy5zYXZlPy5yZWdpb24sICdNb2R1bGVTZXR0aW5ncycpO1xuICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyZWdpb24/Lm5vZGUsICdyb290Jyk7XG4gICAgY29uc3QgbW9kc05vZGUgPSBmaW5kTm9kZShyb290Py5jaGlsZHJlbj8uWzBdPy5ub2RlLCAnTW9kcycpO1xuICAgIGNvbnN0IGxvTm9kZSA9IGZpbmROb2RlKHJvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2RPcmRlcicpID8/IHsgY2hpbGRyZW46IFtdIH07XG4gICAgaWYgKChsb05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChsb05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBsb05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG5cbiAgICAvLyBkcm9wIGFsbCBub2RlcyBleGNlcHQgZm9yIHRoZSBnYW1lIGVudHJ5XG4gICAgY29uc3QgZGVzY3JpcHRpb25Ob2RlcyA9IG1vZHNOb2RlPy5jaGlsZHJlbj8uWzBdPy5ub2RlPy5maWx0ZXI/LihpdGVyID0+XG4gICAgICBpdGVyLmF0dHJpYnV0ZS5maW5kKGF0dHIgPT4gKGF0dHIuJC5pZCA9PT0gJ05hbWUnKSAmJiAoYXR0ci4kLnZhbHVlID09PSAnR3VzdGF2RGV2JykpKSA/PyBbXTtcblxuICAgIFxuXG5cbiAgICAvLyBcbiAgICBjb25zdCBmaWx0ZXJlZFBha3MgPSBsb2FkT3JkZXIuZmlsdGVyKGVudHJ5ID0+ICEhZW50cnkuZGF0YT8udXVpZFxuICAgICAgICAgICAgICAgICAgICAmJiBlbnRyeS5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgICYmICFlbnRyeS5kYXRhPy5pc0xpc3RlZCk7XG5cbiAgICBjb25zb2xlLmxvZygnZXhwb3J0VG8gZmlsdGVyZWRQYWtzPScsIGZpbHRlcmVkUGFrcyk7XG5cbiAgICAvLyBhZGQgbmV3IG5vZGVzIGZvciB0aGUgZW5hYmxlZCBtb2RzXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWx0ZXJlZFBha3MpIHtcbiAgICAgIC8vIGNvbnN0IG1kNSA9IGF3YWl0IHV0aWwuZmlsZU1ENShwYXRoLmpvaW4obW9kc1BhdGgoKSwga2V5KSk7XG4gICAgICBkZXNjcmlwdGlvbk5vZGVzLnB1c2goe1xuICAgICAgICAkOiB7IGlkOiAnTW9kdWxlU2hvcnREZXNjJyB9LFxuICAgICAgICBhdHRyaWJ1dGU6IFtcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdGb2xkZXInLCB0eXBlOiAnTFNXU3RyaW5nJywgdmFsdWU6IGVudHJ5LmRhdGEuZm9sZGVyIH0gfSxcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdNRDUnLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5tZDUgfSB9LFxuICAgICAgICAgIHsgJDogeyBpZDogJ05hbWUnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS5uYW1lIH0gfSxcbiAgICAgICAgICB7ICQ6IHsgaWQ6ICdVVUlEJywgdHlwZTogJ0ZpeGVkU3RyaW5nJywgdmFsdWU6IGVudHJ5LmRhdGEudXVpZCB9IH0sXG4gICAgICAgICAgeyAkOiB7IGlkOiAnVmVyc2lvbicsIHR5cGU6ICdpbnQzMicsIHZhbHVlOiBlbnRyeS5kYXRhLnZlcnNpb24gfSB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gXG4gICAgY29uc3QgbG9hZE9yZGVyTm9kZXMgPSBmaWx0ZXJlZFBha3NcbiAgICAgIC8vLnNvcnQoKGxocywgcmhzKSA9PiBsaHMucG9zIC0gcmhzLnBvcykgLy8gZG9uJ3Qga25vdyBpZiB3ZSBuZWVkIHRoaXMgbm93XG4gICAgICAubWFwKChlbnRyeSk6IElNb2ROb2RlID0+ICh7XG4gICAgICAgICQ6IHsgaWQ6ICdNb2R1bGUnIH0sXG4gICAgICAgIGF0dHJpYnV0ZTogW1xuICAgICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnRml4ZWRTdHJpbmcnLCB2YWx1ZTogZW50cnkuZGF0YS51dWlkIH0gfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgIG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUgPSBkZXNjcmlwdGlvbk5vZGVzO1xuICAgIGxvTm9kZS5jaGlsZHJlblswXS5ub2RlID0gbG9hZE9yZGVyTm9kZXM7XG5cbiAgICB3cml0ZU1vZFNldHRpbmdzKGFwaSwgbW9kU2V0dGluZ3MsIGZpbGVwYXRoKTtcbiAgICBcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICBpZDogJ2JnMy1sb2Fkb3JkZXItZXhwb3J0ZWQnLFxuICAgICAgdGl0bGU6ICdMb2FkIE9yZGVyIEV4cG9ydGVkJyxcbiAgICAgIG1lc3NhZ2U6IGZpbGVwYXRoLFxuICAgICAgZGlzcGxheU1TOiAzMDAwXG4gICAgfSk7XG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIGxvYWQgb3JkZXInLCBlcnIsIHtcbiAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIGNyZWF0ZSBhIHByb2ZpbGUgaW4tZ2FtZScsXG4gICAgfSk7XG4gIH0gIFxuXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRUb0ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xuXG4gIGNvbnN0IG9wdGlvbnM6IElPcGVuT3B0aW9ucyA9IHtcbiAgICB0aXRsZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGNob29zZSBhIEJHMyAubHN4IGZpbGUgdG8gZXhwb3J0IHRvJyksXG4gICAgZmlsdGVyczogW3sgbmFtZTogJ0JHMyBMb2FkIE9yZGVyJywgZXh0ZW5zaW9uczogWydsc3gnXSB9XSxcbiAgICBjcmVhdGU6IHRydWVcbiAgfTtcblxuICBjb25zdCBzZWxlY3RlZFBhdGg6c3RyaW5nID0gYXdhaXQgYXBpLnNlbGVjdEZpbGUob3B0aW9ucyk7XG5cbiAgY29uc29sZS5sb2coYGV4cG9ydFRvRmlsZSAke3NlbGVjdGVkUGF0aH1gKTtcblxuICAvLyBpZiBubyBwYXRoIHNlbGVjdGVkLCB0aGVuIGNhbmNlbCBwcm9iYWJseSBwcmVzc2VkXG4gIGlmKHNlbGVjdGVkUGF0aCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybjtcblxuICBleHBvcnRUbyhhcGksIHNlbGVjdGVkUGF0aCk7XG59XG4gIFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydFRvR2FtZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XG5cbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xuXG4gIGNvbnNvbGUubG9nKGBleHBvcnRUb0dhbWUgJHtzZXR0aW5nc1BhdGh9YCk7XG5cbiAgZXhwb3J0VG8oYXBpLCBzZXR0aW5nc1BhdGgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVlcFJlZnJlc2goYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xuXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG5cbiAgLy8gZ2V0IGxvYWQgb3JkZXIgZnJvbSBzdGF0ZVxuICBjb25zdCBsb2FkT3JkZXI6dHlwZXMuTG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xuXG4gIGNvbnNvbGUubG9nKCdkZWVwUmVmcmVzaCcsIGxvYWRPcmRlcik7XG59XG5cblxuXG5hc3luYyBmdW5jdGlvbiByZWFkTW9kU2V0dGluZ3MoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcbiAgXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgJ1B1YmxpYycsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhzZXR0aW5nc1BhdGgpO1xuICBjb25zb2xlLmxvZygncmVhZE1vZFNldHRpbmdzJywgZGF0KTtcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTHN4RmlsZShsc3hQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBcbiAgLy9jb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksICdQdWJsaWMnLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gIGNvbnN0IGRhdCA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobHN4UGF0aCk7XG4gIGNvbnNvbGUubG9nKCdsc3hQYXRoJywgZGF0KTtcbiAgcmV0dXJuIHBhcnNlU3RyaW5nUHJvbWlzZShkYXQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBmaWxlcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIFxuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcbiAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChkYXRhKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShmaWxlcGF0aCkpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVwYXRoLCB4bWwpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIHNldHRpbmdzJywgZXJyKTtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlKHByZXY6IHR5cGVzLkxvYWRPcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50OiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPGFueT4ge1xuICAvLyBOb3RoaW5nIHRvIHZhbGlkYXRlIHJlYWxseSAtIHRoZSBnYW1lIGRvZXMgbm90IHJlYWQgb3VyIGxvYWQgb3JkZXIgZmlsZVxuICAvLyAgYW5kIHdlIGRvbid0IHdhbnQgdG8gYXBwbHkgYW55IHJlc3RyaWN0aW9ucyBlaXRoZXIsIHNvIHdlIGp1c3RcbiAgLy8gIHJldHVybi5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIDogUHJvbWlzZTxBcnJheTxCRzNQYWs+PiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxzTGliID0gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKTtcbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgXG4gIGNvbnN0IHBha3MgPSBhd2FpdCByZWFkUEFLTGlzdChhcGkpO1xuXG4gIGNvbnNvbGUubG9nKCdwYWtzJywgcGFrcyk7XG5cbiAgbGV0IG1hbmlmZXN0O1xuICB0cnkge1xuICAgIG1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksICcnLCBHQU1FX0lEKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc3QgYWxsb3dSZXBvcnQgPSAhWydFUEVSTSddLmluY2x1ZGVzKGVyci5jb2RlKTtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBkZXBsb3ltZW50IG1hbmlmZXN0JywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IFByb21pc2UuYWxsKHBha3MubWFwKGFzeW5jIGZpbGVOYW1lID0+IHtcbiAgICByZXR1cm4gdXRpbC53aXRoRXJyb3JDb250ZXh0KCdyZWFkaW5nIHBhaycsIGZpbGVOYW1lLCAoKSA9PiB7XG4gICAgICBjb25zdCBmdW5jID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBtYW5pZmVzdC5maWxlcy5maW5kKGVudHJ5ID0+IGVudHJ5LnJlbFBhdGggPT09IGZpbGVOYW1lKTtcbiAgICAgICAgICBjb25zdCBtb2QgPSAobWFuaWZlc3RFbnRyeSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgPyBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF0/LlttYW5pZmVzdEVudHJ5LnNvdXJjZV1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgY29uc3QgcGFrUGF0aCA9IHBhdGguam9pbihtb2RzUGF0aCgpLCBmaWxlTmFtZSk7XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgICAgICBtb2QsXG4gICAgICAgICAgICBpbmZvOiBhd2FpdCBleHRyYWN0UGFrSW5mb0ltcGwoYXBpLCBwYWtQYXRoLCBtb2QpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEaXZpbmVFeGVjTWlzc2luZykge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdUaGUgaW5zdGFsbGVkIGNvcHkgb2YgTFNMaWIvRGl2aW5lIGlzIGNvcnJ1cHRlZCAtIHBsZWFzZSAnXG4gICAgICAgICAgICAgICsgJ2RlbGV0ZSB0aGUgZXhpc3RpbmcgTFNMaWIgbW9kIGVudHJ5IGFuZCByZS1pbnN0YWxsIGl0LiBNYWtlIHN1cmUgdG8gJ1xuICAgICAgICAgICAgICArICdkaXNhYmxlIG9yIGFkZCBhbnkgbmVjZXNzYXJ5IGV4Y2VwdGlvbnMgdG8geW91ciBzZWN1cml0eSBzb2Z0d2FyZSB0byAnXG4gICAgICAgICAgICAgICsgJ2Vuc3VyZSBpdCBkb2VzIG5vdCBpbnRlcmZlcmUgd2l0aCBWb3J0ZXgvTFNMaWIgZmlsZSBvcGVyYXRpb25zLic7XG4gICAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJywgbWVzc2FnZSxcbiAgICAgICAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBjb3VsZCBoYXBwZW4gaWYgdGhlIGZpbGUgZ290IGRlbGV0ZWQgc2luY2UgcmVhZGluZyB0aGUgbGlzdCBvZiBwYWtzLlxuICAgICAgICAgIC8vIGFjdHVhbGx5LCB0aGlzIHNlZW1zIHRvIGJlIGZhaXJseSBjb21tb24gd2hlbiB1cGRhdGluZyBhIG1vZFxuICAgICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIHBhay4gUGxlYXNlIG1ha2Ugc3VyZSB5b3UgYXJlIHVzaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBMU0xpYiBieSB1c2luZyB0aGUgXCJSZS1pbnN0YWxsIExTTGliL0RpdmluZVwiIHRvb2xiYXIgYnV0dG9uIG9uIHRoZSBNb2RzIHBhZ2UuJywgZXJyLCB7XG4gICAgICAgICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogZmlsZU5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoKSk7XG4gICAgfSk7XG4gIH0pKTtcblxuICByZXR1cm4gcmVzLmZpbHRlcihpdGVyID0+IGl0ZXIgIT09IHVuZGVmaW5lZCk7XG59XG5cbmNvbnN0IGxpc3RDYWNoZTogeyBbcGF0aDogc3RyaW5nXTogUHJvbWlzZTxzdHJpbmdbXT4gfSA9IHt9O1xuXG5hc3luYyBmdW5jdGlvbiBsaXN0UGFja2FnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcblxuICBsZXQgcmVzO1xuXG4gIHRyeSB7XG4gICAgICAgIHJlcyA9IGF3YWl0IGRpdmluZShhcGksICdsaXN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCwgbG9nbGV2ZWw6ICdvZmYnfSApO1xuICB9IGNhdGNoKGVycm9yKSB7ICAgIFxuICAgIGNvbnNvbGUuZXJyb3IoYGxpc3RQYWNrYWdlIGNhdWdodCBlcnJvcjogYCwgZXJyb3IpO1xuICB9XG4gIFxuICAvL2NvbnNvbGUubG9nKGBsaXN0UGFja2FnZSByZXM9YCwgcmVzKTtcbiAgXG4gIGNvbnN0IGxpbmVzID0gcmVzLnN0ZG91dC5zcGxpdCgnXFxuJykubWFwKGxpbmUgPT4gbGluZS50cmltKCkpLmZpbHRlcihsaW5lID0+IGxpbmUubGVuZ3RoICE9PSAwKTtcblxuICAvL2NvbnNvbGUubG9nKGBsaXN0UGFja2FnZSBsaW5lcz1gLCBsaW5lcyk7XG5cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpc0xPTGlzdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIFxuICAvKlxuICBpZiAobGlzdENhY2hlW3Bha1BhdGhdID09PSB1bmRlZmluZWQpIHtcbiAgICBsaXN0Q2FjaGVbcGFrUGF0aF0gPSBsaXN0UGFja2FnZShhcGksIHBha1BhdGgpO1xuICB9ICBcbiAgY29uc3QgbGluZXMgPSBhd2FpdCBsaXN0Q2FjaGVbcGFrUGF0aF07Ki9cblxuICBjb25zdCBtYXhSZXRyaWVzID0gMztcbiAgbGV0IHJldHJ5Q291bnRlciA9IDA7IFxuICBsZXQgbGluZXM6c3RyaW5nW107XG5cbiAgd2hpbGUgKHJldHJ5Q291bnRlciA8IG1heFJldHJpZXMpIHtcblxuICAgIGxpbmVzID0gYXdhaXQgbGlzdFBhY2thZ2UoYXBpLCBwYWtQYXRoKTtcbiAgICAvL2NvbnNvbGUubG9nKGBpc0xPTGlzdGVkICR7cGF0aC5iYXNlbmFtZShwYWtQYXRoKX0gcmV0cmllcz0ke3JldHJ5Q291bnRlcn0vJHttYXhSZXRyaWVzfSBsaW5lc2AsIGxpbmVzKTtcblxuICAgIC8vIGdvdCBhIHJlc3BvbnNlIHNvIGxldHMgYnJlYWsgb3V0IG9mIHRoaXMgbG9vcFxuICAgIGlmKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIGFkZCB0byB0aGUgY291bnRlciBhbmQgdHJ5IGFnYWluXG4gICAgcmV0cnlDb3VudGVyKys7XG5cbiAgICBpZihyZXRyeUNvdW50ZXIgPT09IG1heFJldHJpZXMpIHtcbiAgICAgIFxuICAgICAgY29uc29sZS5lcnJvcihgaXNMT0xpc3RlZCAke3BhdGguYmFzZW5hbWUocGFrUGF0aCl9IHJldHJpZXM9JHtyZXRyeUNvdW50ZXJ9LyR7bWF4UmV0cmllc306IGxpbmVzIHNob3VsZG4ndCBiZSAwIGFuZCB3ZSd2ZSBydW4gb3V0IG9mIHJldHJpZXMuYCk7XG5cbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogYCR7cGF0aC5iYXNlbmFtZShwYWtQYXRoKX0gY291bGRuJ3QgYmUgcmVhZCBjb3JyZWN0bHkuIFRoaXMgbW9kIGJlIGluY29ycmVjdGx5IGxvY2tlZC91bmxvY2tlZCBidXQgd2lsbCBkZWZhdWx0IHRvIHVubG9ja2VkLmAsXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gcmV0dXJuIGZhbHNlIHNvIHdlIGRlZmF1bHQgdG8gdW5sb2NrZWRcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oYGlzTE9MaXN0ZWQgJHtwYXRoLmJhc2VuYW1lKHBha1BhdGgpfSByZXRyaWVzPSR7cmV0cnlDb3VudGVyfS8ke21heFJldHJpZXN9OiBsaW5lcyBzaG91bGRuJ3QgYmUgMC4gbmVlZCB0byByZXRyeS5gKTtcbiAgfVxuXG4gIC8vIGNvbnN0IG5vbkdVSSA9IGxpbmVzLmZpbmQobGluZSA9PiAhbGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3B1YmxpYy9nYW1lL2d1aScpKTtcblxuICAvLyBleGFtcGxlICdNb2RzL1NhZmUgRWRpdGlvbi9tZXRhLmxzeFxcdDE3NTlcXHQwJ1xuXG4gIC8vIGxvb2sgYXQgdGhlIGVuZCBvZiB0aGUgZmlyc3QgYml0IG9mIGRhdGEgdG8gc2VlIGlmIGl0IGhhcyBhIG1ldGEubHN4IGZpbGVcbiAgY29uc3QgY29udGFpbnNNZXRhRmlsZSA9IGxpbmVzLmZpbmQobGluZSA9PiBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKSAhPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGZhbHNlO1xuXG4gIC8vY29uc29sZS5sb2coYGlzTE9MaXN0ZWQgJHtwYXRoLmJhc2VuYW1lKHBha1BhdGgpfSBjb250YWluc01ldGFGaWxlPWAsIGNvbnRhaW5zTWV0YUZpbGUpO1xuXG4gIC8vIGludmVydCByZXN1bHQgYXMgJ2xpc3RlZCcgbWVhbnMgaXQgZG9lc24ndCBjb250YWluIGEgbWV0YSBmaWxlLlxuICByZXR1cm4gIWNvbnRhaW5zTWV0YUZpbGU7XG59XG5cblxuXG5cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWtJbmZvSW1wbChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJUGFrSW5mbz4ge1xuICBjb25zdCBtZXRhID0gYXdhaXQgZXh0cmFjdE1ldGEoYXBpLCBwYWtQYXRoLCBtb2QpO1xuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtZXRhPy5zYXZlPy5yZWdpb24sICdDb25maWcnKTtcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XG5cbiAgY29uc3QgYXR0ciA9IChuYW1lOiBzdHJpbmcsIGZhbGxiYWNrOiAoKSA9PiBhbnkpID0+XG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcblxuICBjb25zdCBnZW5OYW1lID0gcGF0aC5iYXNlbmFtZShwYWtQYXRoLCBwYXRoLmV4dG5hbWUocGFrUGF0aCkpO1xuXG4gIGxldCBpc0xpc3RlZDpib29sZWFuO1xuXG4gIHRyeXtcbiAgICBpc0xpc3RlZCA9IGF3YWl0IGlzTE9MaXN0ZWQoYXBpLCBwYWtQYXRoKTtcbiAgfSBjYXRjaChlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKCdleHRyYWN0UGFrSW5mb0ltcGwgY2F1Z2h0IGVycm9yOicsIGVycm9yKTtcbiAgfVxuICBcblxuICByZXR1cm4ge1xuICAgIGF1dGhvcjogYXR0cignQXV0aG9yJywgKCkgPT4gJ1Vua25vd24nKSxcbiAgICBkZXNjcmlwdGlvbjogYXR0cignRGVzY3JpcHRpb24nLCAoKSA9PiAnTWlzc2luZycpLFxuICAgIGZvbGRlcjogYXR0cignRm9sZGVyJywgKCkgPT4gZ2VuTmFtZSksXG4gICAgbWQ1OiBhdHRyKCdNRDUnLCAoKSA9PiAnJyksXG4gICAgbmFtZTogYXR0cignTmFtZScsICgpID0+IGdlbk5hbWUpLFxuICAgIHR5cGU6IGF0dHIoJ1R5cGUnLCAoKSA9PiAnQWR2ZW50dXJlJyksXG4gICAgdXVpZDogYXR0cignVVVJRCcsICgpID0+IHJlcXVpcmUoJ3V1aWQnKS52NCgpKSxcbiAgICB2ZXJzaW9uOiBhdHRyKCdWZXJzaW9uJywgKCkgPT4gJzEnKSxcbiAgICBpc0xpc3RlZDogaXNMaXN0ZWRcbiAgfTtcbn1cblxuXG5jbGFzcyBEaXZpbmVFeGVjTWlzc2luZyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoJ0RpdmluZSBleGVjdXRhYmxlIGlzIG1pc3NpbmcnKTtcbiAgICB0aGlzLm5hbWUgPSAnRGl2aW5lRXhlY01pc3NpbmcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpdmluZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxuICBvcHRpb25zOiBJRGl2aW5lT3B0aW9ucyk6IFByb21pc2U8SURpdmluZU91dHB1dD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8SURpdmluZU91dHB1dD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCByZXR1cm5lZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIGxldCBzdGRvdXQ6IHN0cmluZyA9ICcnO1xuXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xuICAgIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0xTTGliL0RpdmluZSB0b29sIGlzIG1pc3NpbmcnKTtcbiAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgIH1cbiAgICBjb25zdCBleGUgPSBwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbHNMaWIuaW5zdGFsbGF0aW9uUGF0aCwgJ3Rvb2xzJywgJ2RpdmluZS5leGUnKTtcbiAgICBjb25zdCBhcmdzID0gW1xuICAgICAgJy0tYWN0aW9uJywgYWN0aW9uLFxuICAgICAgJy0tc291cmNlJywgb3B0aW9ucy5zb3VyY2UsXG4gICAgICAnLS1nYW1lJywgJ2JnMycsXG4gICAgXTtcblxuICAgIGlmIChvcHRpb25zLmxvZ2xldmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1sb2dsZXZlbCcsIG9wdGlvbnMubG9nbGV2ZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goJy0tbG9nbGV2ZWwnLCAnb2ZmJyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZGVzdGluYXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKCctLWRlc3RpbmF0aW9uJywgb3B0aW9ucy5kZXN0aW5hdGlvbik7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmV4cHJlc3Npb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKCctLWV4cHJlc3Npb24nLCBvcHRpb25zLmV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2MgPSBzcGF3bihleGUsIGFyZ3MpO1xuXG4gICAgcHJvYy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHN0ZG91dCArPSBkYXRhKTtcbiAgICBwcm9jLnN0ZGVyci5vbignZGF0YScsIGRhdGEgPT4gbG9nKCd3YXJuJywgZGF0YSkpO1xuXG4gICAgcHJvYy5vbignZXJyb3InLCAoZXJySW46IEVycm9yKSA9PiB7XG4gICAgICBpZiAoIXJldHVybmVkKSB7XG4gICAgICAgIGlmIChlcnJJblsnY29kZSddID09PSAnRU5PRU5UJykge1xuICAgICAgICAgIHJlamVjdChuZXcgRGl2aW5lRXhlY01pc3NpbmcoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ2RpdmluZS5leGUgZmFpbGVkOiAnICsgZXJySW4ubWVzc2FnZSk7XG4gICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHByb2Mub24oJ2V4aXQnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICBpZiAoIXJldHVybmVkKSB7XG4gICAgICAgIHJldHVybmVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dCwgcmV0dXJuQ29kZTogMCB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChbMiwgMTAyXS5pbmNsdWRlcyhjb2RlKSkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHsgc3Rkb3V0OiAnJywgcmV0dXJuQ29kZTogMiB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBkaXZpbmUuZXhlIHJldHVybnMgdGhlIGFjdHVhbCBlcnJvciBjb2RlICsgMTAwIGlmIGEgZmF0YWwgZXJyb3Igb2NjdXJlZFxuICAgICAgICAgIGlmIChjb2RlID4gMTAwKSB7XG4gICAgICAgICAgICBjb2RlIC09IDEwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtjb2RlfWApO1xuICAgICAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkUEFLTGlzdChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgbGV0IHBha3M6IHN0cmluZ1tdO1xuICB0cnkge1xuICAgIHBha3MgPSAoYXdhaXQgZnMucmVhZGRpckFzeW5jKG1vZHNQYXRoKCkpKVxuICAgICAgLmZpbHRlcihmaWxlTmFtZSA9PiBwYXRoLmV4dG5hbWUoZmlsZU5hbWUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgoKSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIG5vcFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2RzIGRpcmVjdG9yeScsIGVyciwge1xuICAgICAgICBpZDogJ2JnMy1mYWlsZWQtcmVhZC1tb2RzJyxcbiAgICAgICAgbWVzc2FnZTogbW9kc1BhdGgoKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwYWtzID0gW107XG4gIH1cblxuICByZXR1cm4gcGFrcztcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBhayhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGgsIGRlc3RQYXRoLCBwYXR0ZXJuKSB7XG4gIHJldHVybiBkaXZpbmUoYXBpLCAnZXh0cmFjdC1wYWNrYWdlJyxcbiAgICB7IHNvdXJjZTogcGFrUGF0aCwgZGVzdGluYXRpb246IGRlc3RQYXRoLCBleHByZXNzaW9uOiBwYXR0ZXJuIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcbiAgY29uc3QgbWV0YVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdsc21ldGEnLCBzaG9ydGlkKCkpO1xuICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhtZXRhUGF0aCk7XG4gIGF3YWl0IGV4dHJhY3RQYWsoYXBpLCBwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcbiAgdHJ5IHtcbiAgICAvLyB0aGUgbWV0YS5sc3ggbWF5IGJlIGluIGEgc3ViZGlyZWN0b3J5LiBUaGVyZSBpcyBwcm9iYWJseSBhIHBhdHRlcm4gaGVyZVxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXG4gICAgbGV0IG1ldGFMU1hQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4obWV0YVBhdGgsICdtZXRhLmxzeCcpO1xuICAgIGF3YWl0IHdhbGsobWV0YVBhdGgsIGVudHJpZXMgPT4ge1xuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XG4gICAgICBpZiAodGVtcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1ldGFMU1hQYXRoID0gdGVtcC5maWxlUGF0aDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1ldGFMU1hQYXRoKTtcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobWV0YVBhdGgpO1xuICAgIHJldHVybiBtZXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH0gZWxzZSBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvbHVtbicpICYmIChlcnIubWVzc2FnZS5pbmNsdWRlcygnTGluZScpKSkge1xuICAgICAgLy8gYW4gZXJyb3IgbWVzc2FnZSBzcGVjaWZ5aW5nIGNvbHVtbiBhbmQgcm93IGluZGljYXRlIGEgcHJvYmxlbSBwYXJzaW5nIHRoZSB4bWwgZmlsZVxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgIG1lc3NhZ2U6ICdUaGUgbWV0YS5sc3ggZmlsZSBpbiBcInt7bW9kTmFtZX19XCIgaXMgaW52YWxpZCwgcGxlYXNlIHJlcG9ydCB0aGlzIHRvIHRoZSBhdXRob3InLFxuICAgICAgICBhY3Rpb25zOiBbe1xuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnSW52YWxpZCBtZXRhLmxzeCBmaWxlJywge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIH0sIFt7IGxhYmVsOiAnQ2xvc2UnIH1dKVxuICAgICAgICAgIH1cbiAgICAgICAgfV0sXG4gICAgICAgIHJlcGxhY2U6IHtcbiAgICAgICAgICBtb2ROYW1lOiB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSxcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kTm9kZTxUIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nIH0+LCBVPihub2RlczogVFtdLCBpZDogc3RyaW5nKTogVCB7XG4gIHJldHVybiBub2Rlcz8uZmluZChpdGVyID0+IGl0ZXIuJC5pZCA9PT0gaWQpID8/IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XG4gIGlmIChtb2RzID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXY6IHR5cGVzLklNb2QsIGlkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gJ2JnMy1sc2xpYi1kaXZpbmUtdG9vbCcpIHtcbiAgICAgIGNvbnN0IGxhdGVzdFZlciA9IHV0aWwuZ2V0U2FmZShwcmV2LCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNlbXZlci5ndChjdXJyZW50VmVyLCBsYXRlc3RWZXIpKSB7XG4gICAgICAgICAgcHJldiA9IG1vZHNbaWRdO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgbW9kIHZlcnNpb24nLCB7IG1vZElkOiBpZCwgdmVyc2lvbjogY3VycmVudFZlciB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIHVuZGVmaW5lZCk7XG5cbiAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gbHNMaWI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkPzogc3RyaW5nKTogSVByb3BzIHtcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXG4gICAgOiBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG5cbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIHJldHVybiB7IGFwaSwgc3RhdGUsIHByb2ZpbGUsIG1vZHMsIGRpc2NvdmVyeSB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlTE9GaWxlKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSWQ/OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzPzogSVByb3BzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XG4gIH1cblxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ZhaWxlZCB0byBnZW5lcmF0ZSBnYW1lIHByb3BzJykpO1xuICB9XG5cbiAgY29uc3QgdGFyZ2V0UGF0aCA9IGxvYWRPcmRlckZpbGVQYXRoKHByb3BzLnByb2ZpbGUuaWQpO1xuICB0cnkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5zdGF0QXN5bmModGFyZ2V0UGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9ICAgIFxuICBcbiAgXG4gIHJldHVybiB0YXJnZXRQYXRoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZE9yZGVyRmlsZVBhdGgocHJvZmlsZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgndXNlckRhdGEnKSwgR0FNRV9JRCwgcHJvZmlsZUlkICsgJ18nICsgTE9fRklMRV9OQU1FKTtcbn1cblxuIl19