"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.toBlue = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const BS = __importStar(require("react-bootstrap"));
const vortex_api_1 = require("vortex-api");
const IniParser = __importStar(require("vortex-parse-ini"));
const winapi_bindings_1 = __importDefault(require("winapi-bindings"));
const migrations_1 = require("./migrations");
const xml2js_1 = require("xml2js");
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./views/CollectionsDataView"));
const menumod_1 = __importDefault(require("./menumod"));
const scriptmerger_1 = require("./scriptmerger");
const common_1 = require("./common");
const tests_1 = require("./tests");
const modLimitPatch_1 = require("./modLimitPatch");
const iconbarActions_1 = require("./iconbarActions");
const priorityManager_1 = require("./priorityManager");
const installers_1 = require("./installers");
const mergeBackup_1 = require("./mergeBackup");
const mergeInventoryParsing_1 = require("./mergeInventoryParsing");
const actions_1 = require("./actions");
const reducers_1 = require("./reducers");
const GOG_ID = '1207664663';
const GOG_ID_GOTY = '1495134320';
const STEAM_ID = '499450';
const STEAM_ID_WH = '292030';
const CONFIG_MATRIX_REL_PATH = path_1.default.join('bin', 'config', 'r4game', 'user_config_matrix', 'pc');
let _INI_STRUCT = {};
let _PREVIOUS_LO = {};
const tools = [
    {
        id: common_1.SCRIPT_MERGER_ID,
        name: 'W3 Script Merger',
        logo: 'WitcherScriptMerger.jpg',
        executable: () => 'WitcherScriptMerger.exe',
        requiredFiles: [
            'WitcherScriptMerger.exe',
        ],
    },
];
function writeToModSettings() {
    const filePath = (0, common_1.getLoadOrderFilePath)();
    const parser = new IniParser.default(new IniParser.WinapiFormat());
    return vortex_api_1.fs.removeAsync(filePath)
        .then(() => vortex_api_1.fs.writeFileAsync(filePath, '', { encoding: 'utf8' }))
        .then(() => parser.read(filePath))
        .then(ini => {
        return bluebird_1.default.each(Object.keys(_INI_STRUCT), (key) => {
            var _a;
            if (((_a = _INI_STRUCT === null || _INI_STRUCT === void 0 ? void 0 : _INI_STRUCT[key]) === null || _a === void 0 ? void 0 : _a.Enabled) === undefined) {
                return Promise.resolve();
            }
            ini.data[key] = {
                Enabled: _INI_STRUCT[key].Enabled,
                Priority: _INI_STRUCT[key].Priority,
                VK: _INI_STRUCT[key].VK,
            };
            return Promise.resolve();
        })
            .then(() => parser.write(filePath, ini));
    })
        .catch(err => (err.path !== undefined && ['EPERM', 'EBUSY'].includes(err.code))
        ? Promise.reject(new common_1.ResourceInaccessibleError(err.path))
        : Promise.reject(err));
}
function createModSettings() {
    const filePath = (0, common_1.getLoadOrderFilePath)();
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(filePath))
        .then(() => vortex_api_1.fs.writeFileAsync(filePath, '', { encoding: 'utf8' }));
}
function ensureModSettings() {
    const filePath = (0, common_1.getLoadOrderFilePath)();
    const parser = new IniParser.default(new IniParser.WinapiFormat());
    return vortex_api_1.fs.statAsync(filePath)
        .then(() => parser.read(filePath))
        .catch(err => (err.code === 'ENOENT')
        ? createModSettings().then(() => parser.read(filePath))
        : Promise.reject(err));
}
function getManuallyAddedMods(context) {
    return __awaiter(this, void 0, void 0, function* () {
        return ensureModSettings().then(ini => {
            const state = context.api.store.getState();
            const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
            const modKeys = Object.keys(mods);
            const iniEntries = Object.keys(ini.data);
            const manualCandidates = [].concat(iniEntries, [common_1.UNI_PATCH]).filter(entry => {
                const hasVortexKey = vortex_api_1.util.getSafe(ini.data[entry], ['VK'], undefined) !== undefined;
                return ((!hasVortexKey) || (ini.data[entry].VK === entry) && !modKeys.includes(entry));
            }) || [common_1.UNI_PATCH];
            return Promise.resolve(new Set(manualCandidates));
        })
            .then(uniqueCandidates => {
            const state = context.api.store.getState();
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
            if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Game is not discovered!'));
            }
            const modsPath = path_1.default.join(discovery.path, 'Mods');
            return bluebird_1.default.reduce(Array.from(uniqueCandidates), (accum, mod) => {
                const modFolder = path_1.default.join(modsPath, mod);
                return vortex_api_1.fs.statAsync(path_1.default.join(modFolder))
                    .then(() => new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    let candidates = [];
                    yield require('turbowalk').default(path_1.default.join(modsPath, mod), entries => {
                        candidates = [].concat(candidates, entries.filter(entry => (!entry.isDirectory)
                            && (path_1.default.extname(path_1.default.basename(entry.filePath)) !== '')
                            && ((entry === null || entry === void 0 ? void 0 : entry.linkCount) === undefined || entry.linkCount <= 1)));
                    })
                        .catch(err => (['ENOENT', 'ENOTFOUND'].indexOf(err.code) !== -1)
                        ? null
                        : Promise.reject(err));
                    const mapped = yield bluebird_1.default.map(candidates, cand => vortex_api_1.fs.statAsync(cand.filePath)
                        .then(stats => stats.isSymbolicLink()
                        ? Promise.resolve(undefined)
                        : Promise.resolve(cand.filePath))
                        .catch(err => Promise.resolve(undefined)));
                    return resolve(mapped);
                })))
                    .then((files) => {
                    if (files.filter(file => file !== undefined).length > 0) {
                        accum.push(mod);
                    }
                    return Promise.resolve(accum);
                })
                    .catch(err => ((err.code === 'ENOENT') && (err.path === modFolder))
                    ? Promise.resolve(accum)
                    : Promise.reject(err));
            }, []);
        })
            .catch(err => {
            const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
            const processCanceled = (err instanceof vortex_api_1.util.ProcessCanceled);
            const allowReport = (!userCanceled && !processCanceled);
            const details = userCanceled
                ? 'Vortex tried to scan your W3 mods folder for manually added mods but '
                    + 'was blocked by your OS/AV - please make sure to fix this before you '
                    + 'proceed to mod W3 as your modding experience will be severely affected.'
                : err;
            context.api.showErrorNotification('Failed to lookup manually added mods', details, { allowReport });
            return Promise.resolve([]);
        });
    });
}
function findGame() {
    try {
        const instPath = winapi_bindings_1.default.RegGetValue('HKEY_LOCAL_MACHINE', 'Software\\CD Project Red\\The Witcher 3', 'InstallFolder');
        if (!instPath) {
            throw new Error('empty registry key');
        }
        return bluebird_1.default.resolve(instPath.value);
    }
    catch (err) {
        return vortex_api_1.util.GameStoreHelper.findByAppId([GOG_ID_GOTY, GOG_ID, STEAM_ID, STEAM_ID_WH])
            .then(game => game.gamePath);
    }
}
function testSupportedTL(files, gameId) {
    const supported = (gameId === 'witcher3')
        && (files.find(file => file.toLowerCase().split(path_1.default.sep).indexOf('mods') !== -1) !== undefined);
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function installTL(files, destinationPath, gameId, progressDelegate) {
    let prefix = files.reduce((prev, file) => {
        const components = file.toLowerCase().split(path_1.default.sep);
        const idx = components.indexOf('mods');
        if ((idx > 0) && ((prev === undefined) || (idx < prev.length))) {
            return components.slice(0, idx);
        }
        else {
            return prev;
        }
    }, undefined);
    prefix = (prefix === undefined) ? '' : prefix.join(path_1.default.sep) + path_1.default.sep;
    const instructions = files
        .filter(file => !file.endsWith(path_1.default.sep) && file.toLowerCase().startsWith(prefix))
        .map(file => ({
        type: 'copy',
        source: file,
        destination: file.slice(prefix.length),
    }));
    return Promise.resolve({ instructions });
}
function testSupportedContent(files, gameId) {
    const supported = (gameId === common_1.GAME_ID)
        && (files.find(file => file.toLowerCase().startsWith('content' + path_1.default.sep) !== undefined));
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function installContent(files, destinationPath, gameId, progressDelegate) {
    return Promise.resolve(files
        .filter(file => file.toLowerCase().startsWith('content' + path_1.default.sep))
        .map(file => {
        const fileBase = file.split(path_1.default.sep).slice(1).join(path_1.default.sep);
        return {
            type: 'copy',
            source: file,
            destination: path_1.default.join('mod' + destinationPath, fileBase),
        };
    }));
}
function installMenuMod(files, destinationPath, gameId, progressDelegate) {
    const filtered = files.filter(file => path_1.default.extname(path_1.default.basename(file)) !== '');
    const inputFiles = filtered.filter(file => file.indexOf(CONFIG_MATRIX_REL_PATH) !== -1);
    const uniqueInput = inputFiles.reduce((accum, iter) => {
        const fileName = path_1.default.basename(iter);
        if (accum.find(entry => path_1.default.basename(entry) === fileName) !== undefined) {
            return accum;
        }
        const instances = inputFiles.filter(file => path_1.default.basename(file) === fileName);
        if (instances.length > 1) {
            if (iter.toLowerCase().indexOf('backup') === -1) {
                accum.push(iter);
            }
        }
        else {
            accum.push(iter);
        }
        return accum;
    }, []);
    let otherFiles = filtered.filter(file => !inputFiles.includes(file));
    const inputFileDestination = CONFIG_MATRIX_REL_PATH;
    const binIdx = uniqueInput[0].split(path_1.default.sep).indexOf('bin');
    const modFiles = otherFiles.filter(file => file.toLowerCase().split(path_1.default.sep).includes('mods'));
    const modsIdx = (modFiles.length > 0)
        ? modFiles[0].toLowerCase().split(path_1.default.sep).indexOf('mods')
        : -1;
    const modNames = (modsIdx !== -1)
        ? modFiles.reduce((accum, iter) => {
            const modName = iter.split(path_1.default.sep).splice(modsIdx + 1, 1).join();
            if (!accum.includes(modName)) {
                accum.push(modName);
            }
            return accum;
        }, [])
        : [];
    if (modFiles.length > 0) {
        otherFiles = otherFiles.filter(file => !modFiles.includes(file));
    }
    const modName = (binIdx > 0)
        ? inputFiles[0].split(path_1.default.sep)[binIdx - 1]
        : ('mod' + path_1.default.basename(destinationPath, '.installing')).replace(/\s/g, '');
    const trimmedFiles = otherFiles.map(file => {
        const source = file;
        let relPath = file.split(path_1.default.sep)
            .slice(binIdx);
        if (relPath[0] === undefined) {
            relPath = file.split(path_1.default.sep);
        }
        const firstSeg = relPath[0].toLowerCase();
        if (firstSeg === 'content' || firstSeg.endsWith(common_1.PART_SUFFIX)) {
            relPath = [].concat(['Mods', modName], relPath);
        }
        return {
            source,
            relPath: relPath.join(path_1.default.sep),
        };
    });
    const toCopyInstruction = (source, destination) => ({
        type: 'copy',
        source,
        destination,
    });
    const inputInstructions = uniqueInput.map(file => toCopyInstruction(file, path_1.default.join(inputFileDestination, path_1.default.basename(file))));
    const otherInstructions = trimmedFiles.map(file => toCopyInstruction(file.source, file.relPath));
    const modFileInstructions = modFiles.map(file => toCopyInstruction(file, file));
    const instructions = [].concat(inputInstructions, otherInstructions, modFileInstructions);
    if (modNames.length > 0) {
        instructions.push({
            type: 'attribute',
            key: 'modComponents',
            value: modNames,
        });
    }
    return Promise.resolve({ instructions });
}
function testMenuModRoot(instructions, gameId) {
    const predicate = (instr) => (!!gameId)
        ? ((common_1.GAME_ID === gameId) && (instr.indexOf(CONFIG_MATRIX_REL_PATH) !== -1))
        : ((instr.type === 'copy') && (instr.destination.indexOf(CONFIG_MATRIX_REL_PATH) !== -1));
    return (!!gameId)
        ? Promise.resolve({
            supported: instructions.find(predicate) !== undefined,
            requiredFiles: [],
        })
        : Promise.resolve(instructions.find(predicate) !== undefined);
}
function testTL(instructions) {
    const menuModFiles = instructions.filter(instr => !!instr.destination
        && instr.destination.indexOf(CONFIG_MATRIX_REL_PATH) !== -1);
    if (menuModFiles.length > 0) {
        return Promise.resolve(false);
    }
    return Promise.resolve(instructions.find(instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('mods' + path_1.default.sep)) !== undefined);
}
function testDLC(instructions) {
    return Promise.resolve(instructions.find(instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('dlc' + path_1.default.sep)) !== undefined);
}
function notifyMissingScriptMerger(api) {
    const notifId = 'missing-script-merger';
    api.sendNotification({
        id: notifId,
        type: 'info',
        message: api.translate('Witcher 3 script merger is missing/misconfigured', { ns: common_1.I18N_NAMESPACE }),
        allowSuppress: true,
        actions: [
            {
                title: 'More',
                action: () => {
                    api.showDialog('info', 'Witcher 3 Script Merger', {
                        bbcode: api.translate('Vortex is unable to resolve the Script Merger\'s location. The tool needs to be downloaded and configured manually. '
                            + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]Find out more about how to configure it as a tool for use in Vortex.[/url][br][/br][br][/br]'
                            + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: common_1.I18N_NAMESPACE }),
                    }, [
                        { label: 'Cancel', action: () => {
                                api.dismissNotification('missing-script-merger');
                            } },
                        { label: 'Download Script Merger', action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                .catch(err => null)
                                .then(() => api.dismissNotification('missing-script-merger')) },
                    ]);
                },
            },
        ],
    });
}
function prepareForModding(context, discovery) {
    const findScriptMerger = (error) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        (0, vortex_api_1.log)('error', 'failed to download/install script merger', error);
        const scriptMergerPath = yield (0, scriptmerger_1.getScriptMergerDir)(context);
        if (scriptMergerPath === undefined) {
            notifyMissingScriptMerger(context.api);
            return Promise.resolve();
        }
        else {
            if (((_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger) === undefined) {
                return (0, scriptmerger_1.setMergerConfig)(discovery.path, scriptMergerPath);
            }
        }
    });
    const ensurePath = (dirpath) => vortex_api_1.fs.ensureDirWritableAsync(dirpath)
        .catch(err => (err.code === 'EEXIST')
        ? Promise.resolve()
        : Promise.reject(err));
    return Promise.all([
        ensurePath(path_1.default.join(discovery.path, 'Mods')),
        ensurePath(path_1.default.join(discovery.path, 'DLC')),
        ensurePath(path_1.default.dirname((0, common_1.getLoadOrderFilePath)()))
    ])
        .then(() => (0, scriptmerger_1.downloadScriptMerger)(context)
        .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
        ? Promise.resolve()
        : findScriptMerger(err)));
}
function getScriptMergerTool(api) {
    const state = api.store.getState();
    const scriptMerger = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
    if (!!(scriptMerger === null || scriptMerger === void 0 ? void 0 : scriptMerger.path)) {
        return scriptMerger;
    }
    return undefined;
}
function runScriptMerger(api) {
    const tool = getScriptMergerTool(api);
    if ((tool === null || tool === void 0 ? void 0 : tool.path) === undefined) {
        notifyMissingScriptMerger(api);
        return Promise.resolve();
    }
    return api.runExecutable(tool.path, [], { suggestDeploy: true })
        .catch(err => api.showErrorNotification('Failed to run tool', err, { allowReport: ['EPERM', 'EACCESS', 'ENOENT'].indexOf(err.code) !== -1 }));
}
function getAllMods(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const invalidModTypes = ['witcher3menumoddocuments'];
        const state = context.api.store.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.id) === undefined) {
            return Promise.resolve({
                merged: [],
                manual: [],
                managed: [],
            });
        }
        const modState = vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profile.id, 'modState'], {});
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabledMods = Object.keys(modState).filter(key => (!!mods[key] && modState[key].enabled && !invalidModTypes.includes(mods[key].type)));
        const mergedModNames = yield (0, mergeInventoryParsing_1.getMergedModNames)(context);
        const manuallyAddedMods = yield getManuallyAddedMods(context);
        const managedMods = yield getManagedModNames(context, enabledMods.map(key => mods[key]));
        return Promise.resolve({
            merged: mergedModNames,
            manual: manuallyAddedMods.filter(mod => !mergedModNames.includes(mod)),
            managed: managedMods,
        });
    });
}
function setINIStruct(context, loadOrder, priorityManager) {
    return __awaiter(this, void 0, void 0, function* () {
        return getAllMods(context).then(modMap => {
            _INI_STRUCT = {};
            const mods = [].concat(modMap.merged, modMap.managed, modMap.manual);
            const manualLocked = modMap.manual.filter(isLockedEntry);
            const managedLocked = modMap.managed
                .filter(entry => isLockedEntry(entry.name))
                .map(entry => entry.name);
            const totalLocked = [].concat(modMap.merged, manualLocked, managedLocked);
            return bluebird_1.default.each(mods, (mod, idx) => {
                let name;
                let key;
                if (typeof (mod) === 'object' && mod !== null) {
                    name = mod.name;
                    key = mod.id;
                }
                else {
                    name = mod;
                    key = mod;
                }
                const LOEntry = vortex_api_1.util.getSafe(loadOrder, [key], undefined);
                if (idx === 0) {
                    priorityManager.resetMaxPriority(totalLocked.length);
                }
                _INI_STRUCT[name] = {
                    Enabled: (LOEntry !== undefined) ? LOEntry.enabled ? 1 : 0 : 1,
                    Priority: totalLocked.includes(name)
                        ? totalLocked.indexOf(name)
                        : priorityManager.getPriority({ id: key }),
                    VK: key,
                };
            });
        });
    });
}
function isLockedEntry(modName) {
    if (!modName || typeof (modName) !== 'string') {
        (0, vortex_api_1.log)('debug', 'encountered invalid mod instance/name');
        return false;
    }
    return modName.startsWith(common_1.LOCKED_PREFIX);
}
let refreshFunc;
function genEntryActions(context, item, minPriority, onSetPriority) {
    const priorityInputDialog = () => {
        return new bluebird_1.default((resolve) => {
            var _a;
            context.api.showDialog('question', 'Set New Priority', {
                text: context.api.translate('Insert new numerical priority for {{itemName}} in the input box:', { replace: { itemName: item.name } }),
                input: [
                    {
                        id: 'w3PriorityInput',
                        label: 'Priority',
                        type: 'number',
                        placeholder: ((_a = _INI_STRUCT[item.id]) === null || _a === void 0 ? void 0 : _a.Priority) || 0,
                    }
                ],
            }, [{ label: 'Cancel' }, { label: 'Set', default: true }])
                .then(result => {
                if (result.action === 'Set') {
                    const itemKey = Object.keys(_INI_STRUCT).find(key => _INI_STRUCT[key].VK === item.id);
                    const wantedPriority = result.input['w3PriorityInput'];
                    if (wantedPriority <= minPriority) {
                        context.api.showErrorNotification('Chosen priority is already assigned to a locked entry', wantedPriority.toString(), { allowReport: false });
                        return resolve();
                    }
                    if (itemKey !== undefined) {
                        _INI_STRUCT[itemKey].Priority = parseInt(wantedPriority, 10);
                        onSetPriority(itemKey, wantedPriority);
                    }
                    else {
                        (0, vortex_api_1.log)('error', 'Failed to set priority - mod is not in ini struct', { modId: item.id });
                    }
                }
                return resolve();
            });
        });
    };
    const itemActions = [
        {
            show: item.locked !== true,
            title: 'Set Manual Priority',
            action: () => priorityInputDialog(),
        },
    ];
    return itemActions;
}
function preSort(context, items, direction, updateType, priorityManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const { getPriority, resetMaxPriority } = priorityManager;
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
            (0, vortex_api_1.log)('warn', '[W3] unable to presort due to no active profile');
            return Promise.resolve([]);
        }
        let loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
        const onSetPriority = (itemKey, wantedPriority) => {
            return writeToModSettings()
                .then(() => {
                wantedPriority = +wantedPriority;
                const state = context.api.store.getState();
                const activeProfile = vortex_api_1.selectors.activeProfile(state);
                const modId = _INI_STRUCT[itemKey].VK;
                const loEntry = loadOrder[modId];
                if (priorityManager.priorityType === 'position-based') {
                    context.api.store.dispatch(vortex_api_1.actions.setLoadOrderEntry(activeProfile.id, modId, Object.assign(Object.assign({}, loEntry), { pos: (loEntry.pos < wantedPriority) ? wantedPriority : wantedPriority - 2 })));
                    loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
                }
                else {
                    context.api.store.dispatch(vortex_api_1.actions.setLoadOrderEntry(activeProfile.id, modId, Object.assign(Object.assign({}, loEntry), { prefix: parseInt(_INI_STRUCT[itemKey].Priority, 10) })));
                }
                if (refreshFunc !== undefined) {
                    refreshFunc();
                }
            })
                .catch(err => modSettingsErrorHandler(context, err, 'Failed to modify load order file'));
        };
        const allMods = yield getAllMods(context);
        if ((allMods.merged.length === 0) && (allMods.manual.length === 0)) {
            items.map((item, idx) => {
                if (idx === 0) {
                    resetMaxPriority();
                }
                return Object.assign(Object.assign({}, item), { contextMenuActions: genEntryActions(context, item, 0, onSetPriority), prefix: getPriority(item) });
            });
        }
        const lockedMods = [].concat(allMods.manual.filter(isLockedEntry), allMods.managed.filter(entry => isLockedEntry(entry.name))
            .map(entry => entry.name));
        const readableNames = {
            [common_1.UNI_PATCH]: 'Unification/Community Patch',
        };
        const lockedEntries = [].concat(allMods.merged, lockedMods)
            .reduce((accum, modName, idx) => {
            const obj = {
                id: modName,
                name: !!readableNames[modName] ? readableNames[modName] : modName,
                imgUrl: `${__dirname}/gameart.jpg`,
                locked: true,
                prefix: idx + 1,
            };
            if (!accum.find(acc => obj.id === acc.id)) {
                accum.push(obj);
            }
            return accum;
        }, []);
        items = items.filter(item => !allMods.merged.includes(item.id)
            && !allMods.manual.includes(item.id)
            && !allMods.managed.find(mod => (mod.name === common_1.UNI_PATCH) && (mod.id === item.id)))
            .map((item, idx) => {
            if (idx === 0) {
                resetMaxPriority(lockedEntries.length);
            }
            return Object.assign(Object.assign({}, item), { contextMenuActions: genEntryActions(context, item, lockedEntries.length, onSetPriority), prefix: getPriority(item) });
        });
        const manualEntries = allMods.manual
            .filter(key => lockedEntries.find(entry => entry.id === key) === undefined)
            .map(key => {
            const item = {
                id: key,
                name: key,
                imgUrl: `${__dirname}/gameart.jpg`,
                external: true,
            };
            return Object.assign(Object.assign({}, item), { prefix: getPriority(item), contextMenuActions: genEntryActions(context, item, lockedEntries.length, onSetPriority) });
        });
        const keys = Object.keys(loadOrder);
        const knownManuallyAdded = manualEntries.filter(entry => keys.includes(entry.id)) || [];
        const unknownManuallyAdded = manualEntries.filter(entry => !keys.includes(entry.id)) || [];
        const filteredOrder = keys
            .filter(key => lockedEntries.find(item => item.id === key) === undefined)
            .reduce((accum, key) => {
            accum[key] = loadOrder[key];
            return accum;
        }, []);
        knownManuallyAdded.forEach(known => {
            const diff = keys.length - Object.keys(filteredOrder).length;
            const pos = filteredOrder[known.id].pos - diff;
            items = [].concat(items.slice(0, pos) || [], known, items.slice(pos) || []);
        });
        let preSorted = [].concat(...lockedEntries, items.filter(item => {
            if (typeof (item === null || item === void 0 ? void 0 : item.name) !== 'string') {
                return false;
            }
            const isLocked = lockedEntries.find(locked => locked.name === item.name) !== undefined;
            const doNotDisplay = common_1.DO_NOT_DISPLAY.includes(item.name.toLowerCase());
            return !isLocked && !doNotDisplay;
        }), ...unknownManuallyAdded);
        preSorted = (updateType !== 'drag-n-drop')
            ? preSorted.sort((lhs, rhs) => lhs.prefix - rhs.prefix)
            : preSorted.reduce((accum, entry, idx) => {
                if (lockedEntries.indexOf(entry) !== -1 || idx === 0) {
                    accum.push(entry);
                }
                else {
                    const prevPrefix = parseInt(accum[idx - 1].prefix, 10);
                    if (prevPrefix >= entry.prefix) {
                        accum.push(Object.assign(Object.assign({}, entry), { external: ((entry.external === true) && (allMods.managed.find(man => man.name === entry.name)))
                                ? false : true, prefix: prevPrefix + 1 }));
                    }
                    else {
                        accum.push(entry);
                    }
                }
                return accum;
            }, []);
        return Promise.resolve(preSorted);
    });
}
function findModFolder(installationPath, mod) {
    if (!installationPath || !(mod === null || mod === void 0 ? void 0 : mod.installationPath)) {
        const errMessage = !installationPath
            ? 'Game is not discovered'
            : 'Failed to resolve mod installation path';
        return bluebird_1.default.reject(new Error(errMessage));
    }
    const expectedModNameLocation = ['witcher3menumodroot', 'witcher3tl'].includes(mod.type)
        ? path_1.default.join(installationPath, mod.installationPath, 'Mods')
        : path_1.default.join(installationPath, mod.installationPath);
    return vortex_api_1.fs.readdirAsync(expectedModNameLocation)
        .then(entries => Promise.resolve(entries[0]));
}
function getManagedModNames(context, mods) {
    const installationPath = vortex_api_1.selectors.installPathForGame(context.api.store.getState(), common_1.GAME_ID);
    return bluebird_1.default.reduce(mods, (accum, mod) => findModFolder(installationPath, mod)
        .then(modName => {
        if (!modName || ['collection', 'w3modlimitpatcher'].includes(mod.type)) {
            return Promise.resolve(accum);
        }
        const modComponents = vortex_api_1.util.getSafe(mod, ['attributes', 'modComponents'], []);
        if (modComponents.length === 0) {
            modComponents.push(modName);
        }
        [...modComponents].forEach(key => {
            accum.push({
                id: mod.id,
                name: key,
            });
        });
        return Promise.resolve(accum);
    })
        .catch(err => {
        (0, vortex_api_1.log)('error', 'unable to resolve mod name', err);
        return Promise.resolve(accum);
    }), []);
}
const toggleModsState = (context, props, enabled) => __awaiter(void 0, void 0, void 0, function* () {
    const state = context.api.store.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], {});
    const modMap = yield getAllMods(context);
    const manualLocked = modMap.manual.filter(modName => modName.startsWith(common_1.LOCKED_PREFIX));
    const totalLocked = [].concat(modMap.merged, manualLocked);
    const newLO = Object.keys(loadOrder).reduce((accum, key) => {
        if (totalLocked.includes(key)) {
            accum[key] = loadOrder[key];
        }
        else {
            accum[key] = Object.assign(Object.assign({}, loadOrder[key]), { enabled });
        }
        return accum;
    }, {});
    context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(profile.id, newLO));
    props.refresh();
});
function infoComponent(context, props) {
    const t = context.api.translate;
    return react_1.default.createElement(BS.Panel, { id: 'loadorderinfo' }, react_1.default.createElement('h2', {}, t('Managing your load order', { ns: common_1.I18N_NAMESPACE })), react_1.default.createElement(vortex_api_1.FlexLayout.Flex, { style: { height: '30%' } }, react_1.default.createElement('div', {}, react_1.default.createElement('p', {}, t('You can adjust the load order for The Witcher 3 by dragging and dropping '
        + 'mods up or down on this page.  If you are using several mods that add scripts you may need to use '
        + 'the Witcher 3 Script merger. For more information see: ', { ns: common_1.I18N_NAMESPACE }), react_1.default.createElement('a', { onClick: () => vortex_api_1.util.opn('https://wiki.nexusmods.com/index.php/Modding_The_Witcher_3_with_Vortex') }, t('Modding The Witcher 3 with Vortex.', { ns: common_1.I18N_NAMESPACE }))))), react_1.default.createElement('div', {
        style: { height: '80%' },
    }, react_1.default.createElement('p', {}, t('Please note:', { ns: common_1.I18N_NAMESPACE })), react_1.default.createElement('ul', {}, react_1.default.createElement('li', {}, t('For Witcher 3, the mod with the lowest index number (by default, the mod sorted at the top) overrides mods with a higher index number.', { ns: common_1.I18N_NAMESPACE })), react_1.default.createElement('li', {}, t('You are able to modify the priority manually by right clicking any LO entry and set the mod\'s priority', { ns: common_1.I18N_NAMESPACE })), react_1.default.createElement('li', {}, t('If you cannot see your mod in this load order, you may need to add it manually (see our wiki for details).', { ns: common_1.I18N_NAMESPACE })), react_1.default.createElement('li', {}, t('When managing menu mods, mod settings changed inside the game will be detected by Vortex as external changes - that is expected, '
        + 'choose to use the newer file and your settings will be made persistent.', { ns: common_1.I18N_NAMESPACE })), react_1.default.createElement('li', {}, t('You can change the way the priorities are assgined using the "Switch To Position/Prefix based" button. '
        + 'Prefix based is less restrictive and allows you to set any priority value you want "5000, 69999, etc" while position based will '
        + 'restrict the priorities to the number of load order entries that are available.', { ns: common_1.I18N_NAMESPACE })), react_1.default.createElement('li', {}, t('Merges generated by the Witcher 3 Script merger must be loaded first and are locked in the first load order slot.', { ns: common_1.I18N_NAMESPACE }))), react_1.default.createElement(BS.Button, {
        onClick: () => toggleModsState(context, props, false),
        style: {
            marginBottom: '5px',
            width: 'min-content',
        },
    }, t('Disable All')), react_1.default.createElement('br'), react_1.default.createElement(BS.Button, {
        onClick: () => toggleModsState(context, props, true),
        style: {
            marginBottom: '5px',
            width: 'min-content',
        },
    }, t('Enable All ')), []));
}
function queryScriptMerge(context, reason) {
    const state = context.api.store.getState();
    const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
    if (!!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
        context.api.sendNotification({
            id: 'witcher3-merge',
            type: 'warning',
            message: context.api.translate('Witcher Script merger may need to be executed', { ns: common_1.I18N_NAMESPACE }),
            allowSuppress: true,
            actions: [
                {
                    title: 'More',
                    action: () => {
                        context.api.showDialog('info', 'Witcher 3', {
                            text: reason,
                        }, [
                            { label: 'Close' },
                        ]);
                    },
                },
                {
                    title: 'Run tool',
                    action: dismiss => {
                        runScriptMerger(context.api);
                        dismiss();
                    },
                },
            ],
        });
    }
    else {
        notifyMissingScriptMerger(context.api);
    }
}
function canMerge(game, gameDiscovery) {
    if (game.id !== common_1.GAME_ID) {
        return undefined;
    }
    return ({
        baseFiles: () => [
            {
                in: path_1.default.join(gameDiscovery.path, CONFIG_MATRIX_REL_PATH, common_1.INPUT_XML_FILENAME),
                out: path_1.default.join(CONFIG_MATRIX_REL_PATH, common_1.INPUT_XML_FILENAME),
            },
        ],
        filter: filePath => filePath.endsWith(common_1.INPUT_XML_FILENAME),
    });
}
function readInputFile(context, mergeDir) {
    const state = context.api.store.getState();
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    const gameInputFilepath = path_1.default.join(discovery.path, CONFIG_MATRIX_REL_PATH, common_1.INPUT_XML_FILENAME);
    return (!!(discovery === null || discovery === void 0 ? void 0 : discovery.path))
        ? vortex_api_1.fs.readFileAsync(path_1.default.join(mergeDir, CONFIG_MATRIX_REL_PATH, common_1.INPUT_XML_FILENAME))
            .catch(err => (err.code === 'ENOENT')
            ? vortex_api_1.fs.readFileAsync(gameInputFilepath)
            : Promise.reject(err))
        : Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
}
const emptyXml = '<?xml version="1.0" encoding="UTF-8"?><metadata></metadata>';
function merge(filePath, mergeDir, context) {
    let modData;
    return vortex_api_1.fs.readFileAsync(filePath)
        .then((xmlData) => __awaiter(this, void 0, void 0, function* () {
        try {
            modData = yield (0, xml2js_1.parseStringPromise)(xmlData);
            return Promise.resolve();
        }
        catch (err) {
            context.api.showErrorNotification('Invalid mod XML data - inform mod author', { path: filePath, error: err.message }, { allowReport: false });
            modData = emptyXml;
            return Promise.resolve();
        }
    }))
        .then(() => readInputFile(context, mergeDir))
        .then((mergedData) => __awaiter(this, void 0, void 0, function* () {
        try {
            const merged = yield (0, xml2js_1.parseStringPromise)(mergedData);
            return Promise.resolve(merged);
        }
        catch (err) {
            const state = context.api.store.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
            context.api.showErrorNotification('Invalid merged XML data', err, {
                allowReport: true,
                attachments: [
                    { id: '__merged/input.xml', type: 'data', data: mergedData,
                        description: 'Witcher 3 menu mod merged data' },
                    { id: `${activeProfile.id}_loadOrder`, type: 'data', data: loadOrder,
                        description: 'Current load order' },
                ],
            });
            return Promise.reject(new vortex_api_1.util.DataInvalid('Invalid merged XML data'));
        }
    }))
        .then(gameIndexFile => {
        var _a, _b, _c, _d, _e, _f, _g;
        const modGroups = (_a = modData === null || modData === void 0 ? void 0 : modData.UserConfig) === null || _a === void 0 ? void 0 : _a.Group;
        for (let i = 0; i < modGroups.length; i++) {
            const gameGroups = (_b = gameIndexFile === null || gameIndexFile === void 0 ? void 0 : gameIndexFile.UserConfig) === null || _b === void 0 ? void 0 : _b.Group;
            const iter = modGroups[i];
            const modVars = (_d = (_c = iter === null || iter === void 0 ? void 0 : iter.VisibleVars) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.Var;
            const gameGroupIdx = gameGroups.findIndex(group => { var _a, _b; return ((_a = group === null || group === void 0 ? void 0 : group.$) === null || _a === void 0 ? void 0 : _a.id) === ((_b = iter === null || iter === void 0 ? void 0 : iter.$) === null || _b === void 0 ? void 0 : _b.id); });
            if (gameGroupIdx !== -1) {
                const gameGroup = gameGroups[gameGroupIdx];
                const gameVars = (_f = (_e = gameGroup === null || gameGroup === void 0 ? void 0 : gameGroup.VisibleVars) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.Var;
                for (let j = 0; j < modVars.length; j++) {
                    const modVar = modVars[j];
                    const id = (_g = modVar === null || modVar === void 0 ? void 0 : modVar.$) === null || _g === void 0 ? void 0 : _g.id;
                    const gameVarIdx = gameVars.findIndex(v => { var _a; return ((_a = v === null || v === void 0 ? void 0 : v.$) === null || _a === void 0 ? void 0 : _a.id) === id; });
                    if (gameVarIdx !== -1) {
                        gameIndexFile.UserConfig.Group[gameGroupIdx].VisibleVars[0].Var[gameVarIdx] = modVar;
                    }
                    else {
                        gameIndexFile.UserConfig.Group[gameGroupIdx].VisibleVars[0].Var.push(modVar);
                    }
                }
            }
            else {
                gameIndexFile.UserConfig.Group.push(modGroups[i]);
            }
        }
        const builder = new xml2js_1.Builder();
        const xml = builder.buildObject(gameIndexFile);
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(mergeDir, CONFIG_MATRIX_REL_PATH, common_1.INPUT_XML_FILENAME), xml);
    })
        .catch(err => {
        (0, vortex_api_1.log)('error', 'input.xml merge failed', err);
        return Promise.resolve();
    });
}
const SCRIPT_MERGER_FILES = ['WitcherScriptMerger.exe'];
function scriptMergerTest(files, gameId) {
    const matcher = (file => SCRIPT_MERGER_FILES.includes(file));
    const supported = ((gameId === common_1.GAME_ID) && (files.filter(matcher).length > 0));
    return Promise.resolve({ supported, requiredFiles: SCRIPT_MERGER_FILES });
}
function modSettingsErrorHandler(context, err, errMessage) {
    let allowReport = true;
    const userCanceled = err instanceof vortex_api_1.util.UserCanceled;
    if (userCanceled) {
        allowReport = false;
    }
    const busyResource = err instanceof common_1.ResourceInaccessibleError;
    if (allowReport && busyResource) {
        allowReport = err.allowReport;
        err.message = err.errorMessage;
    }
    context.api.showErrorNotification(errMessage, err, { allowReport });
    return;
}
function scriptMergerDummyInstaller(context, files) {
    context.api.showErrorNotification('Invalid Mod', 'It looks like you tried to install '
        + 'The Witcher 3 Script Merger, which is a tool and not a mod for The Witcher 3.\n\n'
        + 'The script merger should\'ve been installed automatically by Vortex as soon as you activated this extension. '
        + 'If the download or installation has failed for any reason - please let us know why, by reporting the error through '
        + 'our feedback system and make sure to include vortex logs. Please note: if you\'ve installed '
        + 'the script merger in previous versions of Vortex as a mod and STILL have it installed '
        + '(it\'s present in your mod list) - you should consider un-installing it followed by a Vortex restart; '
        + 'the automatic merger installer/updater should then kick off and set up the tool for you.', { allowReport: false });
    return Promise.reject(new vortex_api_1.util.ProcessCanceled('Invalid mod'));
}
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
exports.toBlue = toBlue;
function main(context) {
    context.registerReducer(['settings', 'witcher3'], reducers_1.W3Reducer);
    let priorityManager;
    let modLimitPatcher;
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'The Witcher 3',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => 'Mods',
        logo: 'gameart.jpg',
        executable: () => 'bin/x64/witcher3.exe',
        setup: toBlue((discovery) => prepareForModding(context, discovery)),
        supportedTools: tools,
        requiresCleanup: true,
        requiredFiles: [
            'bin/x64/witcher3.exe',
        ],
        environment: {
            SteamAPPId: '292030',
        },
        details: {
            steamAppId: 292030,
            ignoreConflicts: common_1.DO_NOT_DEPLOY,
            ignoreDeploy: common_1.DO_NOT_DEPLOY,
        },
    });
    const getDLCPath = (game) => {
        const state = context.api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return path_1.default.join(discovery.path, 'DLC');
    };
    const getTLPath = (game) => {
        const state = context.api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return discovery.path;
    };
    const isTW3 = (gameId = undefined) => {
        if (gameId !== undefined) {
            return (gameId === common_1.GAME_ID);
        }
        const state = context.api.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === common_1.GAME_ID);
    };
    context.registerInstaller('witcher3tl', 25, toBlue(testSupportedTL), toBlue(installTL));
    context.registerInstaller('witcher3mixed', 30, toBlue(installers_1.testSupportedMixed), toBlue(installers_1.installMixed));
    context.registerInstaller('witcher3content', 50, toBlue(testSupportedContent), toBlue(installContent));
    context.registerInstaller('witcher3menumodroot', 20, toBlue(testMenuModRoot), toBlue(installMenuMod));
    context.registerInstaller('scriptmergerdummy', 15, toBlue(scriptMergerTest), toBlue((files) => scriptMergerDummyInstaller(context, files)));
    context.registerModType('witcher3tl', 25, isTW3, getTLPath, toBlue(testTL));
    context.registerModType('witcher3dlc', 25, isTW3, getDLCPath, toBlue(testDLC));
    context.registerModType('witcher3menumodroot', 20, isTW3, getTLPath, toBlue(testMenuModRoot));
    context.registerModType('witcher3menumoddocuments', 60, isTW3, (game) => path_1.default.join(vortex_api_1.util.getVortexPath('documents'), 'The Witcher 3'), () => bluebird_1.default.resolve(false));
    context.registerModType('w3modlimitpatcher', 25, isTW3, getTLPath, () => bluebird_1.default.resolve(false), { deploymentEssential: false, name: 'Mod Limit Patcher Mod Type' });
    context.registerMerge(canMerge, (filePath, mergeDir) => merge(filePath, mergeDir, context), 'witcher3menumodroot');
    context.registerMigration((oldVersion) => (0, migrations_1.migrate148)(context, oldVersion));
    (0, iconbarActions_1.registerActions)({
        context,
        refreshFunc,
        getPriorityManager: () => priorityManager,
        getModLimitPatcher: () => modLimitPatcher,
    });
    context.optional.registerCollectionFeature('witcher3_collection_data', (gameId, includedMods, collection) => (0, collections_1.genCollectionsData)(context, gameId, includedMods, collection), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Witcher 3 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
    context.registerProfileFeature('local_merges', 'boolean', 'settings', 'Profile Data', 'This profile will store and restore profile specific data (merged scripts, loadorder, etc) when switching profiles', () => {
        const activeGameId = vortex_api_1.selectors.activeGameId(context.api.getState());
        return activeGameId === common_1.GAME_ID;
    });
    const invalidModTypes = ['witcher3menumoddocuments', 'collection'];
    context.registerLoadOrderPage({
        gameId: common_1.GAME_ID,
        createInfoPanel: (props) => {
            refreshFunc = props.refresh;
            return infoComponent(context, props);
        },
        gameArtURL: `${__dirname}/gameart.jpg`,
        filter: (mods) => mods.filter(mod => !invalidModTypes.includes(mod.type)),
        preSort: (items, direction, updateType) => {
            return preSort(context, items, direction, updateType, priorityManager);
        },
        noCollectionGeneration: true,
        callback: (loadOrder, updateType) => {
            if (loadOrder === _PREVIOUS_LO) {
                return;
            }
            if (_PREVIOUS_LO !== undefined) {
                context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true));
            }
            _PREVIOUS_LO = loadOrder;
            setINIStruct(context, loadOrder, priorityManager)
                .then(() => writeToModSettings())
                .catch(err => modSettingsErrorHandler(context, err, 'Failed to modify load order file'));
        },
    });
    context.registerTest('tw3-mod-limit-breach', 'gamemode-activated', () => bluebird_1.default.resolve((0, tests_1.testModLimitBreach)(context.api, modLimitPatcher)));
    context.registerTest('tw3-mod-limit-breach', 'mod-activated', () => bluebird_1.default.resolve((0, tests_1.testModLimitBreach)(context.api, modLimitPatcher)));
    const revertLOFile = () => {
        const state = context.api.store.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if (!!profile && (profile.gameId === common_1.GAME_ID)) {
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], undefined);
            return getManuallyAddedMods(context).then((manuallyAdded) => {
                if (manuallyAdded.length > 0) {
                    const newStruct = {};
                    manuallyAdded.forEach((mod, idx) => {
                        newStruct[mod] = {
                            Enabled: 1,
                            Priority: ((loadOrder !== undefined && !!loadOrder[mod])
                                ? parseInt(loadOrder[mod].prefix, 10) : idx) + 1,
                        };
                    });
                    _INI_STRUCT = newStruct;
                    writeToModSettings()
                        .then(() => {
                        refreshFunc === null || refreshFunc === void 0 ? void 0 : refreshFunc();
                        return Promise.resolve();
                    })
                        .catch(err => modSettingsErrorHandler(context, err, 'Failed to cleanup load order file'));
                }
                else {
                    const filePath = (0, common_1.getLoadOrderFilePath)();
                    vortex_api_1.fs.removeAsync(filePath)
                        .catch(err => (err.code === 'ENOENT')
                        ? Promise.resolve()
                        : context.api.showErrorNotification('Failed to cleanup load order file', err));
                }
            });
        }
    };
    const validateProfile = (profileId, state) => {
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const deployProfile = vortex_api_1.selectors.profileById(state, profileId);
        if (!!activeProfile && !!deployProfile && (deployProfile.id !== activeProfile.id)) {
            return undefined;
        }
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID) {
            return undefined;
        }
        return activeProfile;
    };
    let prevDeployment = [];
    context.once(() => {
        modLimitPatcher = new modLimitPatch_1.ModLimitPatcher(context.api);
        priorityManager = new priorityManager_1.PriorityManager(context.api, 'prefix-based');
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () {
            if (gameMode !== common_1.GAME_ID) {
                context.api.dismissNotification('witcher3-merge');
            }
            else {
                const state = context.api.getState();
                const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, gameMode);
                const activeProf = vortex_api_1.selectors.activeProfile(state);
                const priorityType = vortex_api_1.util.getSafe(state, (0, common_1.getPriorityTypeBranch)(), 'prefix-based');
                context.api.store.dispatch((0, actions_1.setPriorityType)(priorityType));
                if (lastProfId !== (activeProf === null || activeProf === void 0 ? void 0 : activeProf.id)) {
                    try {
                        yield (0, mergeBackup_1.storeToProfile)(context, lastProfId)
                            .then(() => (0, mergeBackup_1.restoreFromProfile)(context, activeProf === null || activeProf === void 0 ? void 0 : activeProf.id));
                    }
                    catch (err) {
                        context.api.showErrorNotification('Failed to restore profile merged files', err);
                    }
                }
            }
        }));
        context.api.onAsync('will-deploy', (profileId, deployment) => {
            const state = context.api.store.getState();
            const activeProfile = validateProfile(profileId, state);
            if (activeProfile === undefined) {
                return Promise.resolve();
            }
            return menumod_1.default.onWillDeploy(context.api, deployment, activeProfile)
                .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
                ? Promise.resolve()
                : Promise.reject(err));
        });
        context.api.onAsync('did-deploy', (profileId, deployment) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.store.getState();
            const activeProfile = validateProfile(profileId, state);
            if (activeProfile === undefined) {
                return Promise.resolve();
            }
            if (JSON.stringify(prevDeployment) !== JSON.stringify(deployment)) {
                prevDeployment = deployment;
                queryScriptMerge(context, 'Your mods state/load order has changed since the last time you ran '
                    + 'the script merger. You may want to run the merger tool and check whether any new script conflicts are '
                    + 'present, or if existing merges have become unecessary. Please also note that any load order changes '
                    + 'may affect the order in which your conflicting mods are meant to be merged, and may require you to '
                    + 'remove the existing merge and re-apply it.');
            }
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
            const docFiles = deployment['witcher3menumodroot']
                .filter(file => file.relPath.endsWith(common_1.PART_SUFFIX)
                && (file.relPath.indexOf(common_1.INPUT_XML_FILENAME) === -1));
            const menuModPromise = () => {
                if (docFiles.length === 0) {
                    return menumod_1.default.removeMod(context.api, activeProfile);
                }
                else {
                    return menumod_1.default.onDidDeploy(context.api, deployment, activeProfile)
                        .then((modId) => __awaiter(this, void 0, void 0, function* () {
                        if (modId === undefined) {
                            return Promise.resolve();
                        }
                        context.api.store.dispatch(vortex_api_1.actions.setModEnabled(activeProfile.id, modId, true));
                        yield context.api.emitAndAwait('deploy-single-mod', common_1.GAME_ID, modId);
                        return Promise.resolve();
                    }));
                }
            };
            return menuModPromise()
                .then(() => setINIStruct(context, loadOrder, priorityManager))
                .then(() => writeToModSettings())
                .then(() => {
                refreshFunc === null || refreshFunc === void 0 ? void 0 : refreshFunc();
                return Promise.resolve();
            })
                .catch(err => modSettingsErrorHandler(context, err, 'Failed to modify load order file'));
        }));
        context.api.events.on('profile-will-change', (newProfileId) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, newProfileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
                return;
            }
            const priorityType = vortex_api_1.util.getSafe(state, (0, common_1.getPriorityTypeBranch)(), 'prefix-based');
            context.api.store.dispatch((0, actions_1.setPriorityType)(priorityType));
            const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, profile.gameId);
            try {
                yield (0, mergeBackup_1.storeToProfile)(context, lastProfId)
                    .then(() => (0, mergeBackup_1.restoreFromProfile)(context, profile.id));
            }
            catch (err) {
                context.api.showErrorNotification('Failed to store profile specific merged items', err);
            }
        }));
        context.api.onStateChange(['settings', 'witcher3'], (prev, current) => {
            const state = context.api.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID || priorityManager === undefined) {
                return;
            }
            const priorityType = vortex_api_1.util.getSafe(state, (0, common_1.getPriorityTypeBranch)(), 'prefix-based');
            priorityManager.priorityType = priorityType;
        });
        context.api.events.on('purge-mods', () => {
            revertLOFile();
        });
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQXlDO0FBQ3pDLGdEQUF3QjtBQUN4QixrREFBMEI7QUFDMUIsb0RBQXNDO0FBQ3RDLDJDQUFrRjtBQUNsRiw0REFBOEM7QUFDOUMsc0VBQXFDO0FBRXJDLDZDQUEwQztBQUUxQyxtQ0FBcUQ7QUFFckQsMkRBQXFGO0FBRXJGLHNGQUE4RDtBQUU5RCx3REFBZ0M7QUFDaEMsaURBQTJGO0FBRTNGLHFDQUlrQjtBQUVsQixtQ0FBNkM7QUFFN0MsbURBQWtEO0FBRWxELHFEQUFtRDtBQUNuRCx1REFBb0Q7QUFFcEQsNkNBQWdFO0FBQ2hFLCtDQUFtRTtBQUVuRSxtRUFBNEQ7QUFFNUQsdUNBQTRDO0FBQzVDLHlDQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMxQixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFFN0IsTUFBTSxzQkFBc0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBRWhHLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUNyQixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFFdEIsTUFBTSxLQUFLLEdBQUc7SUFDWjtRQUNFLEVBQUUsRUFBRSx5QkFBZ0I7UUFDcEIsSUFBSSxFQUFFLGtCQUFrQjtRQUN4QixJQUFJLEVBQUUseUJBQXlCO1FBQy9CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx5QkFBeUI7UUFDM0MsYUFBYSxFQUFFO1lBQ2IseUJBQXlCO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsU0FBUyxrQkFBa0I7SUFDekIsTUFBTSxRQUFRLEdBQUcsSUFBQSw2QkFBb0IsR0FBRSxDQUFDO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sZUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7U0FDNUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQ2pFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNWLE9BQU8sa0JBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFOztZQUNyRCxJQUFJLENBQUEsTUFBQSxXQUFXLGFBQVgsV0FBVyx1QkFBWCxXQUFXLENBQUcsR0FBRyxDQUFDLDBDQUFFLE9BQU8sTUFBSyxTQUFTLEVBQUU7Z0JBTzdDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzFCO1lBQ0QsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRztnQkFDZCxPQUFPLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU87Z0JBQ2pDLFFBQVEsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUTtnQkFDbkMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2FBQ3hCLENBQUM7WUFDRixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUM7YUFDRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUM7U0FDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0UsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxrQ0FBeUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRUQsU0FBUyxpQkFBaUI7SUFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBQSw2QkFBb0IsR0FBRSxDQUFDO0lBS3hDLE9BQU8sZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDckQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUtELFNBQVMsaUJBQWlCO0lBQ3hCLE1BQU0sUUFBUSxHQUFHLElBQUEsNkJBQW9CLEdBQUUsQ0FBQztJQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUNuRSxPQUFPLGVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1NBQzFCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2pDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7UUFDbkMsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRUQsU0FBZSxvQkFBb0IsQ0FBQyxPQUFPOztRQUN6QyxPQUFPLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3BDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzNDLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLGtCQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDekUsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztnQkFDcEYsT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQVMsQ0FBQyxDQUFDO1lBQ2xCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7WUFDdkIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDM0MsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNsQyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksTUFBSyxTQUFTLEVBQUU7Z0JBRWpDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQzthQUM1RTtZQUNELE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNuRCxPQUFPLGtCQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDbEUsTUFBTSxTQUFTLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzNDLE9BQU8sZUFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUN0QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBTyxPQUFPLEVBQUUsRUFBRTtvQkFHeEMsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO29CQUNwQixNQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUU7d0JBQ3JFLFVBQVUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7K0JBQ3ZELENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzsrQkFDcEQsQ0FBQyxDQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxTQUFTLE1BQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyRixDQUFDLENBQUM7eUJBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUM5RCxDQUFDLENBQUMsSUFBSTt3QkFDTixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUV6QixNQUFNLE1BQU0sR0FBRyxNQUFNLGtCQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUNuRCxlQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7eUJBQ3hCLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUU7d0JBQ25DLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQzt3QkFDNUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3lCQUNsQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDL0MsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQSxDQUFDLENBQUM7cUJBQ0YsSUFBSSxDQUFDLENBQUMsS0FBZSxFQUFFLEVBQUU7b0JBQ3hCLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO3dCQUN2RCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUNqQjtvQkFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUM7b0JBQ2pFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztvQkFDeEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDVCxDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFHWCxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sZUFBZSxHQUFHLENBQUMsR0FBRyxZQUFZLGlCQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDOUQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFlBQVksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sT0FBTyxHQUFHLFlBQVk7Z0JBQzFCLENBQUMsQ0FBQyx1RUFBdUU7c0JBQ3JFLHNFQUFzRTtzQkFDdEUseUVBQXlFO2dCQUM3RSxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxzQ0FBc0MsRUFDdEUsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUM1QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFFRCxTQUFTLFFBQVE7SUFDZixJQUFJO1FBQ0YsTUFBTSxRQUFRLEdBQUcseUJBQU0sQ0FBQyxXQUFXLENBQ2pDLG9CQUFvQixFQUNwQix5Q0FBeUMsRUFDekMsZUFBZSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztTQUN2QztRQUNELE9BQU8sa0JBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQWUsQ0FBQyxDQUFDO0tBQ25EO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQ2xGLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNoQztBQUNILENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFLLEVBQUUsTUFBTTtJQUNwQyxNQUFNLFNBQVMsR0FBRyxDQUFDLE1BQU0sS0FBSyxVQUFVLENBQUM7V0FDcEMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3BCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO0lBQzlFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUNyQixTQUFTO1FBQ1QsYUFBYSxFQUFFLEVBQUU7S0FDbEIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLEtBQUssRUFDTCxlQUFlLEVBQ2YsTUFBTSxFQUNOLGdCQUFnQjtJQUNqQyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3ZDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFO1lBQzlELE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDakM7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFZCxNQUFNLEdBQUcsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsY0FBSSxDQUFDLEdBQUcsQ0FBQztJQUV4RSxNQUFNLFlBQVksR0FBRyxLQUFLO1NBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNqRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ1osSUFBSSxFQUFFLE1BQU07UUFDWixNQUFNLEVBQUUsSUFBSTtRQUNaLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7S0FDdkMsQ0FBQyxDQUFDLENBQUM7SUFFTixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLEtBQUssRUFBRSxNQUFNO0lBQ3pDLE1BQU0sU0FBUyxHQUFHLENBQUMsTUFBTSxLQUFLLGdCQUFPLENBQUM7V0FDakMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsY0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDN0YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3JCLFNBQVM7UUFDVCxhQUFhLEVBQUUsRUFBRTtLQUNsQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUNMLGVBQWUsRUFDZixNQUFNLEVBQ04sZ0JBQWdCO0lBQ3RDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLO1NBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNuRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDVixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5RCxPQUFPO1lBQ0wsSUFBSSxFQUFFLE1BQU07WUFDWixNQUFNLEVBQUUsSUFBSTtZQUNaLFdBQVcsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxlQUFlLEVBQUUsUUFBUSxDQUFDO1NBQzFELENBQUM7SUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLEtBQUssRUFDTCxlQUFlLEVBQ2YsTUFBTSxFQUNOLGdCQUFnQjtJQUd0QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDaEYsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hGLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7UUFHcEQsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLFFBQVEsQ0FBQyxLQUFLLFNBQVMsRUFBRTtZQUd4RSxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDOUUsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQU94QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBRS9DLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEI7U0FDRjthQUFNO1lBRUwsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNsQjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLE1BQU0sb0JBQW9CLEdBQUcsc0JBQXNCLENBQUM7SUFHcEQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBSTdELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDeEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFdkQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDUCxNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUNyQjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNOLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFHUCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDbEU7SUFJRCxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztJQUUvRSxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUM7YUFDZixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBRzVCLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNoQztRQUVELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMxQyxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxvQkFBVyxDQUFDLEVBQUU7WUFDNUQsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDakQ7UUFFRCxPQUFPO1lBQ0wsTUFBTTtZQUNOLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUM7U0FDaEMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbEQsSUFBSSxFQUFFLE1BQU07UUFDWixNQUFNO1FBQ04sV0FBVztLQUNaLENBQUMsQ0FBQztJQUVILE1BQU0saUJBQWlCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUMvQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxjQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWpGLE1BQU0saUJBQWlCLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUNoRCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRWhELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUM5QyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVqQyxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDMUYsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUN2QixZQUFZLENBQUMsSUFBSSxDQUFDO1lBQ2hCLElBQUksRUFBRSxXQUFXO1lBQ2pCLEdBQUcsRUFBRSxlQUFlO1lBQ3BCLEtBQUssRUFBRSxRQUFRO1NBQ2hCLENBQUMsQ0FBQztLQUNKO0lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsWUFBbUIsRUFBRSxNQUFjO0lBRTFELE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBTyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFNUYsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDZixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNkLFNBQVMsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVM7WUFDckQsYUFBYSxFQUFFLEVBQUU7U0FDbEIsQ0FBQztRQUNKLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQUVELFNBQVMsTUFBTSxDQUFDLFlBQVk7SUFDMUIsTUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVztXQUNoRSxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0QsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUMzQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDL0I7SUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FDdEMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUNoSCxLQUFLLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxZQUFZO0lBQzNCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUN0QyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQztBQUNuSSxDQUFDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxHQUFHO0lBQ3BDLE1BQU0sT0FBTyxHQUFHLHVCQUF1QixDQUFDO0lBQ3hDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNuQixFQUFFLEVBQUUsT0FBTztRQUNYLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsa0RBQWtELEVBQ3ZFLEVBQUUsRUFBRSxFQUFFLHVCQUFjLEVBQUUsQ0FBQztRQUN6QixhQUFhLEVBQUUsSUFBSTtRQUNuQixPQUFPLEVBQUU7WUFDUDtnQkFDRSxLQUFLLEVBQUUsTUFBTTtnQkFDYixNQUFNLEVBQUUsR0FBRyxFQUFFO29CQUNYLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLHlCQUF5QixFQUFFO3dCQUNoRCxNQUFNLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxzSEFBc0g7OEJBQ3hJLDRLQUE0Szs4QkFDNUssNElBQTRJLEVBQUUsRUFBRSxFQUFFLEVBQUUsdUJBQWMsRUFBRSxDQUFDO3FCQUMxSyxFQUFFO3dCQUNELEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO2dDQUM5QixHQUFHLENBQUMsbUJBQW1CLENBQUMsdUJBQXVCLENBQUMsQ0FBQzs0QkFDbkQsQ0FBQyxFQUFDO3dCQUNGLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLEdBQUcsQ0FBQyw2Q0FBNkMsQ0FBQztpQ0FDbkUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO2lDQUNsQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QixDQUFDLENBQUMsRUFBRTtxQkFDcEcsQ0FBQyxDQUFDO2dCQUNMLENBQUM7YUFDRjtTQUNGO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFNBQVM7SUFDM0MsTUFBTSxnQkFBZ0IsR0FBRyxDQUFPLEtBQUssRUFBRSxFQUFFOztRQUN2QyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLDBDQUEwQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFBLGlDQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNELElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO1lBQ2xDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjthQUFNO1lBQ0wsSUFBSSxDQUFBLE1BQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLEtBQUssMENBQUUsY0FBYyxNQUFLLFNBQVMsRUFBRTtnQkFDbEQsT0FBTyxJQUFBLDhCQUFlLEVBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2FBQzFEO1NBQ0Y7SUFDSCxDQUFDLENBQUEsQ0FBQztJQUVGLE1BQU0sVUFBVSxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDN0IsZUFBRSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQztTQUMvQixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO1FBQ25DLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ25CLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFN0IsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ2pCLFVBQVUsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0MsVUFBVSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxVQUFVLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFBLDZCQUFvQixHQUFFLENBQUMsQ0FBQztLQUFDLENBQUM7U0FDL0MsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsbUNBQW9CLEVBQUMsT0FBTyxDQUFDO1NBQ3RDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxZQUFZLGlCQUFJLENBQUMsWUFBWSxDQUFDO1FBQzlDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ25CLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQUMsR0FBRztJQUM5QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ25DLE1BQU0sWUFBWSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDckMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3pGLElBQUksQ0FBQyxDQUFDLENBQUEsWUFBWSxhQUFaLFlBQVksdUJBQVosWUFBWSxDQUFFLElBQUksQ0FBQSxFQUFFO1FBQ3hCLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO0lBRUQsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEdBQUc7SUFDMUIsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEMsSUFBSSxDQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFO1FBQzVCLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzFCO0lBRUQsT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDO1NBQzdELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQy9ELEVBQUUsV0FBVyxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2pGLENBQUM7QUFFRCxTQUFlLFVBQVUsQ0FBQyxPQUFPOztRQUUvQixNQUFNLGVBQWUsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDckQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0MsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxFQUFFLE1BQUssU0FBUyxFQUFFO1lBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDckIsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsT0FBTyxFQUFFLEVBQUU7YUFDWixDQUFDLENBQUM7U0FDSjtRQUNELE1BQU0sUUFBUSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3RixNQUFNLElBQUksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUd0RSxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUNyRCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV2RixNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUEseUNBQWlCLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEQsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlELE1BQU0sV0FBVyxHQUFHLE1BQU0sa0JBQWtCLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNyQixNQUFNLEVBQUUsY0FBYztZQUN0QixNQUFNLEVBQUUsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RFLE9BQU8sRUFBRSxXQUFXO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQUVELFNBQWUsWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsZUFBZTs7UUFDN0QsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3ZDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDakIsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxPQUFPO2lCQUNqQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMxQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztZQUMxRSxPQUFPLGtCQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDdEMsSUFBSSxJQUFJLENBQUM7Z0JBQ1QsSUFBSSxHQUFHLENBQUM7Z0JBQ1IsSUFBSSxPQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7b0JBQzVDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO29CQUNoQixHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztpQkFDZDtxQkFBTTtvQkFDTCxJQUFJLEdBQUcsR0FBRyxDQUFDO29CQUNYLEdBQUcsR0FBRyxHQUFHLENBQUM7aUJBQ1g7Z0JBRUQsTUFBTSxPQUFPLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzFELElBQUksR0FBRyxLQUFLLENBQUMsRUFBRTtvQkFDYixlQUFlLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUN0RDtnQkFDRCxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBRWxCLE9BQU8sRUFBRSxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlELFFBQVEsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQzt3QkFDbEMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO3dCQUMzQixDQUFDLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQztvQkFDNUMsRUFBRSxFQUFFLEdBQUc7aUJBQ1IsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFFRCxTQUFTLGFBQWEsQ0FBQyxPQUFlO0lBR3BDLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtRQUM1QyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7UUFDdEQsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUNELE9BQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQyxzQkFBYSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELElBQUksV0FBVyxDQUFDO0FBRWhCLFNBQVMsZUFBZSxDQUFDLE9BQWdDLEVBQ2hDLElBQWlDLEVBQ2pDLFdBQW1CLEVBQ25CLGFBQXNEO0lBQzdFLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxFQUFFO1FBQy9CLE9BQU8sSUFBSSxrQkFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7O1lBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRTtnQkFDckQsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGtFQUFrRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUNySSxLQUFLLEVBQUU7b0JBQ0w7d0JBQ0UsRUFBRSxFQUFFLGlCQUFpQjt3QkFDckIsS0FBSyxFQUFFLFVBQVU7d0JBQ2pCLElBQUksRUFBRSxRQUFRO3dCQUNkLFdBQVcsRUFBRSxDQUFBLE1BQUEsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsMENBQUUsUUFBUSxLQUFJLENBQUM7cUJBQ2pEO2lCQUFDO2FBQ0wsRUFBRSxDQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUUsQ0FBQztpQkFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNiLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUU7b0JBQzNCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3RGLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFDdkQsSUFBSSxjQUFjLElBQUksV0FBVyxFQUFFO3dCQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLHVEQUF1RCxFQUN2RixjQUFjLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQzt3QkFDckQsT0FBTyxPQUFPLEVBQUUsQ0FBQztxQkFDbEI7b0JBQ0QsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO3dCQUN6QixXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzdELGFBQWEsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7cUJBQ3hDO3lCQUFNO3dCQUNMLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsbURBQW1ELEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7cUJBQ3ZGO2lCQUNGO2dCQUNELE9BQU8sT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztJQUNGLE1BQU0sV0FBVyxHQUFHO1FBQ2xCO1lBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSTtZQUMxQixLQUFLLEVBQUUscUJBQXFCO1lBQzVCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRTtTQUNwQztLQUNGLENBQUM7SUFFRixPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDO0FBRUQsU0FBZSxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGVBQWU7O1FBQzNFLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNDLE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JELE1BQU0sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxlQUFlLENBQUM7UUFDMUQsSUFBSSxDQUFBLGFBQWEsYUFBYixhQUFhLHVCQUFiLGFBQWEsQ0FBRSxFQUFFLE1BQUssU0FBUyxFQUFFO1lBSW5DLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsaURBQWlELENBQUMsQ0FBQztZQUMvRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFFRCxJQUFJLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2RixNQUFNLGFBQWEsR0FBRyxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsRUFBRTtZQUNoRCxPQUFPLGtCQUFrQixFQUFFO2lCQUN4QixJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULGNBQWMsR0FBRyxDQUFDLGNBQWMsQ0FBQztnQkFDakMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksZUFBZSxDQUFDLFlBQVksS0FBSyxnQkFBZ0IsRUFBRTtvQkFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsaUJBQWlCLENBQ2xELGFBQWEsQ0FBQyxFQUFFLEVBQUUsS0FBSyxrQ0FDbEIsT0FBTyxLQUNWLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxHQUFHLENBQUMsSUFDM0UsQ0FBQyxDQUFDO29CQUNKLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztpQkFDcEY7cUJBQU07b0JBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsaUJBQWlCLENBQ2xELGFBQWEsQ0FBQyxFQUFFLEVBQUUsS0FBSyxrQ0FDbEIsT0FBTyxLQUNWLE1BQU0sRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFDckQsQ0FBQyxDQUFDO2lCQUNMO2dCQUNELElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRTtvQkFDN0IsV0FBVyxFQUFFLENBQUM7aUJBQ2Y7WUFDSCxDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFDaEQsa0NBQWtDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQztRQUNGLE1BQU0sT0FBTyxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ2xFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQ3RCLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRTtvQkFDYixnQkFBZ0IsRUFBRSxDQUFDO2lCQUNwQjtnQkFDRCx1Q0FDSyxJQUFJLEtBQ1Asa0JBQWtCLEVBQUUsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxFQUNwRSxNQUFNLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUN6QjtZQUNKLENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUMvRCxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDNUMsTUFBTSxhQUFhLEdBQUc7WUFDcEIsQ0FBQyxrQkFBUyxDQUFDLEVBQUUsNkJBQTZCO1NBQzNDLENBQUM7UUFFRixNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDO2FBQ3hELE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDOUIsTUFBTSxHQUFHLEdBQUc7Z0JBQ1YsRUFBRSxFQUFFLE9BQU87Z0JBQ1gsSUFBSSxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTztnQkFDakUsTUFBTSxFQUFFLEdBQUcsU0FBUyxjQUFjO2dCQUNsQyxNQUFNLEVBQUUsSUFBSTtnQkFDWixNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUM7YUFDaEIsQ0FBQztZQUVGLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ3pDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDakI7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVULEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2VBQ2pDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztlQUNqQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ3pCLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxrQkFBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3BFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUM5QixJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUU7Z0JBQ2IsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3hDO1lBQ0QsdUNBQ0ssSUFBSSxLQUNQLGtCQUFrQixFQUFFLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLEVBQ3ZGLE1BQU0sRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQ3pCO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTTthQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsS0FBSyxTQUFTLENBQUM7YUFDMUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1QsTUFBTSxJQUFJLEdBQUc7Z0JBQ1gsRUFBRSxFQUFFLEdBQUc7Z0JBQ1AsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsTUFBTSxFQUFFLEdBQUcsU0FBUyxjQUFjO2dCQUNsQyxRQUFRLEVBQUUsSUFBSTthQUNmLENBQUM7WUFDRix1Q0FDSyxJQUFJLEtBQ1AsTUFBTSxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFDekIsa0JBQWtCLEVBQUUsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsSUFDdkY7UUFDTixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsTUFBTSxrQkFBa0IsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEYsTUFBTSxvQkFBb0IsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzRixNQUFNLGFBQWEsR0FBRyxJQUFJO2FBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxLQUFLLFNBQVMsQ0FBQzthQUN4RSxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDckIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNULGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNqQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxDQUFDO1lBRTdELE1BQU0sR0FBRyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztZQUMvQyxLQUFLLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUN2QixHQUFHLGFBQWEsRUFDaEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNsQixJQUFJLE9BQU0sQ0FBQyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsSUFBSSxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUNuQyxPQUFPLEtBQUssQ0FBQzthQUNkO1lBQ0QsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsQ0FBQztZQUN2RixNQUFNLFlBQVksR0FBRyx1QkFBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDdEUsT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUNwQyxDQUFDLENBQUMsRUFDRixHQUFHLG9CQUFvQixDQUFDLENBQUM7UUFFM0IsU0FBUyxHQUFHLENBQUMsVUFBVSxLQUFLLGFBQWEsQ0FBQztZQUN4QyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUN2RCxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7Z0JBQ3JDLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFO29CQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNuQjtxQkFBTTtvQkFDTCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3ZELElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7d0JBQzlCLEtBQUssQ0FBQyxJQUFJLGlDQUNMLEtBQUssS0FDUixRQUFRLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0NBQzdGLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksRUFDaEIsTUFBTSxFQUFFLFVBQVUsR0FBRyxDQUFDLElBQ3RCLENBQUM7cUJBQ0o7eUJBQU07d0JBQ0wsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDbkI7aUJBQ0Y7Z0JBQ0QsT0FBTyxLQUFLLENBQUM7WUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDWCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEMsQ0FBQztDQUFBO0FBRUQsU0FBUyxhQUFhLENBQUMsZ0JBQXdCLEVBQUUsR0FBZTtJQUM5RCxJQUFJLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxnQkFBZ0IsQ0FBQSxFQUFFO1FBQy9DLE1BQU0sVUFBVSxHQUFHLENBQUMsZ0JBQWdCO1lBQ2xDLENBQUMsQ0FBQyx3QkFBd0I7WUFDMUIsQ0FBQyxDQUFDLHlDQUF5QyxDQUFDO1FBQzlDLE9BQU8sa0JBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztLQUMvQztJQUVELE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxZQUFZLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztRQUN0RixDQUFDLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDO1FBQzNELENBQUMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3RELE9BQU8sZUFBRSxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsQ0FBQztTQUM1QyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsT0FBZ0MsRUFBRSxJQUFrQjtJQUM5RSxNQUFNLGdCQUFnQixHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO0lBQzdGLE9BQU8sa0JBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQztTQUM5RSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDZCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsWUFBWSxFQUFFLG1CQUFtQixDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN0RSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0I7UUFDRCxNQUFNLGFBQWEsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsZUFBZSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0UsSUFBSSxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM5QixhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzdCO1FBQ0QsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMvQixLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNULEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDVixJQUFJLEVBQUUsR0FBRzthQUNWLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQztTQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNYLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDaEQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1osQ0FBQztBQUVELE1BQU0sZUFBZSxHQUFHLENBQU8sT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUN4RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNuRixNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN6QyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsc0JBQWEsQ0FBQyxDQUFDLENBQUM7SUFDeEYsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBQ3pELElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM3QixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzdCO2FBQU07WUFDTCxLQUFLLENBQUMsR0FBRyxDQUFDLG1DQUNMLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FDakIsT0FBTyxHQUNSLENBQUM7U0FDSDtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1AsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBWSxDQUFDLENBQUMsQ0FBQztJQUMzRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEIsQ0FBQyxDQUFBLENBQUM7QUFFRixTQUFTLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSztJQUNuQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUNoQyxPQUFPLGVBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsRUFDMUQsZUFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQywwQkFBMEIsRUFBRSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUMsQ0FBQyxFQUNwRixlQUFLLENBQUMsYUFBYSxDQUFDLHVCQUFVLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQ2pFLGVBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFDN0IsZUFBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQywyRUFBMkU7VUFDdEcsb0dBQW9HO1VBQ3BHLHlEQUF5RCxFQUFFLEVBQUUsRUFBRSxFQUFFLHVCQUFjLEVBQUUsQ0FBQyxFQUN0RixlQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLEdBQUcsQ0FBQyx3RUFBd0UsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLG9DQUFvQyxFQUFFLEVBQUUsRUFBRSxFQUFFLHVCQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ25NLGVBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFO1FBQ3pCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7S0FDekIsRUFDQyxlQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUMsQ0FBQyxFQUN2RSxlQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQzFCLGVBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsd0lBQXdJLEVBQUUsRUFBRSxFQUFFLEVBQUUsdUJBQWMsRUFBRSxDQUFDLENBQUMsRUFDbE0sZUFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyx5R0FBeUcsRUFBRSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUMsQ0FBQyxFQUNuSyxlQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLDRHQUE0RyxFQUFFLEVBQUUsRUFBRSxFQUFFLHVCQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQ3RLLGVBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsbUlBQW1JO1VBQy9KLHlFQUF5RSxFQUMzRSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUMsQ0FBQyxFQUMxQixlQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLHlHQUF5RztVQUNySSxrSUFBa0k7VUFDbEksaUZBQWlGLEVBQ25GLEVBQUUsRUFBRSxFQUFFLHVCQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQzFCLGVBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsbUhBQW1ILEVBQUUsRUFBRSxFQUFFLEVBQUUsdUJBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUM5SyxlQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUU7UUFDN0IsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQztRQUNyRCxLQUFLLEVBQUU7WUFDTCxZQUFZLEVBQUUsS0FBSztZQUNuQixLQUFLLEVBQUUsYUFBYTtTQUNyQjtLQUNGLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQ3BCLGVBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQ3pCLGVBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtRQUM3QixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDO1FBQ3BELEtBQUssRUFBRTtZQUNMLFlBQVksRUFBRSxLQUFLO1lBQ25CLEtBQUssRUFBRSxhQUFhO1NBQ3JCO0tBQ0YsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxNQUFNO0lBQ3ZDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzNDLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLEVBQUUseUJBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNwSSxJQUFJLENBQUMsQ0FBQyxDQUFBLGdCQUFnQixhQUFoQixnQkFBZ0IsdUJBQWhCLGdCQUFnQixDQUFFLElBQUksQ0FBQSxFQUFFO1FBQzVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDM0IsRUFBRSxFQUFFLGdCQUFnQjtZQUNwQixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQywrQ0FBK0MsRUFDNUUsRUFBRSxFQUFFLEVBQUUsdUJBQWMsRUFBRSxDQUFDO1lBQ3pCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxLQUFLLEVBQUUsTUFBTTtvQkFDYixNQUFNLEVBQUUsR0FBRyxFQUFFO3dCQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUU7NEJBQzFDLElBQUksRUFBRSxNQUFNO3lCQUNiLEVBQUU7NEJBQ0QsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO3lCQUNuQixDQUFDLENBQUM7b0JBQ0wsQ0FBQztpQkFDRjtnQkFDRDtvQkFDRSxLQUFLLEVBQUUsVUFBVTtvQkFDakIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFO3dCQUNoQixlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUM3QixPQUFPLEVBQUUsQ0FBQztvQkFDWixDQUFDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7S0FDSjtTQUFNO1FBQ0wseUJBQXlCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3hDO0FBQ0gsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLElBQUksRUFBRSxhQUFhO0lBQ25DLElBQUksSUFBSSxDQUFDLEVBQUUsS0FBSyxnQkFBTyxFQUFFO1FBQ3ZCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsT0FBTyxDQUFDO1FBQ04sU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ2Y7Z0JBQ0UsRUFBRSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRSwyQkFBa0IsQ0FBQztnQkFDN0UsR0FBRyxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsMkJBQWtCLENBQUM7YUFDM0Q7U0FDRjtRQUNELE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsMkJBQWtCLENBQUM7S0FDMUQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE9BQU8sRUFBRSxRQUFRO0lBQ3RDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzNDLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNsRyxNQUFNLGlCQUFpQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRSwyQkFBa0IsQ0FBQyxDQUFDO0lBQ2hHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLENBQUM7UUFDeEIsQ0FBQyxDQUFDLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsc0JBQXNCLEVBQUUsMkJBQWtCLENBQUMsQ0FBQzthQUNoRixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO1lBQ25DLENBQUMsQ0FBQyxlQUFFLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDO1lBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFFRCxNQUFNLFFBQVEsR0FBRyw2REFBNkQsQ0FBQztBQUMvRSxTQUFTLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU87SUFDeEMsSUFBSSxPQUFPLENBQUM7SUFDWixPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO1NBQzlCLElBQUksQ0FBQyxDQUFNLE9BQU8sRUFBQyxFQUFFO1FBQ3BCLElBQUk7WUFDRixPQUFPLEdBQUcsTUFBTSxJQUFBLDJCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFFWixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDBDQUEwQyxFQUM1RSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sR0FBRyxRQUFRLENBQUM7WUFDbkIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7SUFDSCxDQUFDLENBQUEsQ0FBQztTQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzVDLElBQUksQ0FBQyxDQUFNLFVBQVUsRUFBQyxFQUFFO1FBQ3ZCLElBQUk7WUFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2hDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFHWixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMzQyxNQUFNLGFBQWEsR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRCxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6RixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtnQkFDaEUsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLFdBQVcsRUFBRTtvQkFDWCxFQUFFLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVO3dCQUN4RCxXQUFXLEVBQUUsZ0NBQWdDLEVBQUU7b0JBQ2pELEVBQUUsRUFBRSxFQUFFLEdBQUcsYUFBYSxDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVM7d0JBQ2xFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRTtpQkFDdEM7YUFDRixDQUFDLENBQUM7WUFDSCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7U0FDeEU7SUFDSCxDQUFDLENBQUEsQ0FBQztTQUNELElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRTs7UUFDcEIsTUFBTSxTQUFTLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsVUFBVSwwQ0FBRSxLQUFLLENBQUM7UUFDN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDekMsTUFBTSxVQUFVLEdBQUcsTUFBQSxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsVUFBVSwwQ0FBRSxLQUFLLENBQUM7WUFDcEQsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLE1BQU0sT0FBTyxHQUFHLE1BQUEsTUFBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsV0FBVywwQ0FBRyxDQUFDLENBQUMsMENBQUUsR0FBRyxDQUFDO1lBQzVDLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsZUFBQyxPQUFBLENBQUEsTUFBQSxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsQ0FBQywwQ0FBRSxFQUFFLE9BQUssTUFBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsQ0FBQywwQ0FBRSxFQUFFLENBQUEsQ0FBQSxFQUFBLENBQUMsQ0FBQztZQUNqRixJQUFJLFlBQVksS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLFFBQVEsR0FBRyxNQUFBLE1BQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLFdBQVcsMENBQUcsQ0FBQyxDQUFDLDBDQUFFLEdBQUcsQ0FBQztnQkFDbEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3ZDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsTUFBTSxFQUFFLEdBQUcsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsQ0FBQywwQ0FBRSxFQUFFLENBQUM7b0JBQ3pCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBQyxPQUFBLENBQUEsTUFBQSxDQUFDLGFBQUQsQ0FBQyx1QkFBRCxDQUFDLENBQUUsQ0FBQywwQ0FBRSxFQUFFLE1BQUssRUFBRSxDQUFBLEVBQUEsQ0FBQyxDQUFDO29CQUM1RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsRUFBRTt3QkFDckIsYUFBYSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLENBQUM7cUJBQ3RGO3lCQUFNO3dCQUNMLGFBQWEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUM5RTtpQkFDRjthQUNGO2lCQUFNO2dCQUNMLGFBQWEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNuRDtTQUNGO1FBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBTyxFQUFFLENBQUM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMvQyxPQUFPLGVBQUUsQ0FBQyxjQUFjLENBQ3RCLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLHNCQUFzQixFQUFFLDJCQUFrQixDQUFDLEVBQy9ELEdBQUcsQ0FBQyxDQUFDO0lBQ1QsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ1gsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM1QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRCxNQUFNLG1CQUFtQixHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUN4RCxTQUFTLGdCQUFnQixDQUFDLEtBQUssRUFBRSxNQUFNO0lBQ3JDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM3RCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTSxLQUFLLGdCQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFL0UsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7QUFDNUUsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxVQUFVO0lBQ3ZELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztJQUN2QixNQUFNLFlBQVksR0FBRyxHQUFHLFlBQVksaUJBQUksQ0FBQyxZQUFZLENBQUM7SUFDdEQsSUFBSSxZQUFZLEVBQUU7UUFDaEIsV0FBVyxHQUFHLEtBQUssQ0FBQztLQUNyQjtJQUNELE1BQU0sWUFBWSxHQUFHLEdBQUcsWUFBWSxrQ0FBeUIsQ0FBQztJQUM5RCxJQUFJLFdBQVcsSUFBSSxZQUFZLEVBQUU7UUFDL0IsV0FBVyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUM7UUFDOUIsR0FBRyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDO0tBQ2hDO0lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUNwRSxPQUFPO0FBQ1QsQ0FBQztBQUVELFNBQVMsMEJBQTBCLENBQUMsT0FBTyxFQUFFLEtBQUs7SUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLEVBQUUscUNBQXFDO1VBQ2xGLG1GQUFtRjtVQUNuRiwrR0FBK0c7VUFDL0cscUhBQXFIO1VBQ3JILDhGQUE4RjtVQUM5Rix3RkFBd0Y7VUFDeEYsd0dBQXdHO1VBQ3hHLDBGQUEwRixFQUM1RixFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzFCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUVELFNBQWdCLE1BQU0sQ0FBSSxJQUFvQztJQUM1RCxPQUFPLENBQUMsR0FBRyxJQUFXLEVBQUUsRUFBRSxDQUFDLGtCQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUZELHdCQUVDO0FBRUQsU0FBUyxJQUFJLENBQUMsT0FBZ0M7SUFDNUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxvQkFBUyxDQUFDLENBQUM7SUFDN0QsSUFBSSxlQUFnQyxDQUFDO0lBQ3JDLElBQUksZUFBZ0MsQ0FBQztJQUNyQyxPQUFPLENBQUMsWUFBWSxDQUFDO1FBQ25CLEVBQUUsRUFBRSxnQkFBTztRQUNYLElBQUksRUFBRSxlQUFlO1FBQ3JCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLFFBQVE7UUFDbkIsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU07UUFDMUIsSUFBSSxFQUFFLGFBQWE7UUFDbkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFzQjtRQUN4QyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkUsY0FBYyxFQUFFLEtBQUs7UUFDckIsZUFBZSxFQUFFLElBQUk7UUFDckIsYUFBYSxFQUFFO1lBQ2Isc0JBQXNCO1NBQ3ZCO1FBQ0QsV0FBVyxFQUFFO1lBQ1gsVUFBVSxFQUFFLFFBQVE7U0FDckI7UUFDRCxPQUFPLEVBQUU7WUFDUCxVQUFVLEVBQUUsTUFBTTtZQUNsQixlQUFlLEVBQUUsc0JBQWE7WUFDOUIsWUFBWSxFQUFFLHNCQUFhO1NBQzVCO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUMxQixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlELE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQztJQUVGLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDekIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0MsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5RCxPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7SUFDeEIsQ0FBQyxDQUFDO0lBRUYsTUFBTSxLQUFLLEdBQUcsQ0FBQyxNQUFNLEdBQUcsU0FBUyxFQUFFLEVBQUU7UUFDbkMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxNQUFNLEtBQUssZ0JBQU8sQ0FBQyxDQUFDO1NBQzdCO1FBQ0QsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLGdCQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUM7SUFFRixPQUFPLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDeEYsT0FBTyxDQUFDLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLCtCQUFrQixDQUFDLEVBQUUsTUFBTSxDQUFDLHlCQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ2pHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLEVBQzdDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ3hELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLEVBQ2pELE1BQU0sQ0FBQyxlQUFzQixDQUFDLEVBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDMUQsT0FBTyxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLEVBQUUsRUFDL0MsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTNGLE9BQU8sQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzVFLE9BQU8sQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQy9FLE9BQU8sQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQUUsRUFBRSxFQUMvQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxlQUFzQixDQUFDLENBQUMsQ0FBQztJQUNwRCxPQUFPLENBQUMsZUFBZSxDQUFDLDBCQUEwQixFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQzNELENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxFQUNyRSxHQUFHLEVBQUUsQ0FBQyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRWpDLE9BQU8sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQzlGLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSw0QkFBNEIsRUFBRSxDQUFDLENBQUM7SUFFdEUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQzVCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUVyRixPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFFLElBQUEsdUJBQVUsRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFTLENBQUMsQ0FBQztJQUVwRixJQUFBLGdDQUFlLEVBQUM7UUFDZCxPQUFPO1FBQ1AsV0FBVztRQUNYLGtCQUFrQixFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWU7UUFDekMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsZUFBZTtLQUMxQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUN4QywwQkFBMEIsRUFDMUIsQ0FBQyxNQUFjLEVBQUUsWUFBc0IsRUFBRSxVQUFzQixFQUFFLEVBQUUsQ0FDakUsSUFBQSxnQ0FBa0IsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsRUFDL0QsQ0FBQyxNQUFjLEVBQUUsVUFBOEIsRUFBRSxFQUFFLENBQ2pELElBQUEsa0NBQW9CLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFDbkQsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUN2QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQzFCLENBQUMsS0FBbUIsRUFBRSxNQUFjLEVBQUUsRUFBRSxDQUFDLE1BQU0sS0FBSyxnQkFBTyxFQUMzRCw2QkFBbUIsQ0FDcEIsQ0FBQztJQUVGLE9BQU8sQ0FBQyxzQkFBc0IsQ0FDNUIsY0FBYyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUNyRCxvSEFBb0gsRUFDcEgsR0FBRyxFQUFFO1FBQ0gsTUFBTSxZQUFZLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sWUFBWSxLQUFLLGdCQUFPLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFFTCxNQUFNLGVBQWUsR0FBRyxDQUFDLDBCQUEwQixFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ25FLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztRQUM1QixNQUFNLEVBQUUsZ0JBQU87UUFDZixlQUFlLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN6QixXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUM1QixPQUFPLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFRLENBQUM7UUFDOUMsQ0FBQztRQUNELFVBQVUsRUFBRSxHQUFHLFNBQVMsY0FBYztRQUN0QyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sRUFBRSxDQUFDLEtBQVksRUFBRSxTQUFjLEVBQUUsVUFBZSxFQUFFLEVBQUU7WUFDekQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGVBQWUsQ0FBUSxDQUFDO1FBQ2hGLENBQUM7UUFDRCxzQkFBc0IsRUFBRSxJQUFJO1FBQzVCLFFBQVEsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsRUFBRTtZQUNsQyxJQUFJLFNBQVMsS0FBSyxZQUFZLEVBQUU7Z0JBQzlCLE9BQU87YUFDUjtZQUVELElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRTtnQkFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsc0JBQXNCLENBQUMsZ0JBQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQzNFO1lBQ0QsWUFBWSxHQUFHLFNBQVMsQ0FBQztZQUN6QixZQUFZLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxlQUFlLENBQUM7aUJBQzlDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2lCQUNoQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUNoRCxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQztLQUNGLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQy9ELEdBQUcsRUFBRSxDQUFDLGtCQUFRLENBQUMsT0FBTyxDQUFDLElBQUEsMEJBQWtCLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSxlQUFlLEVBQzFELEdBQUcsRUFBRSxDQUFDLGtCQUFRLENBQUMsT0FBTyxDQUFDLElBQUEsMEJBQWtCLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFNUUsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNDLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssZ0JBQU8sQ0FBQyxFQUFFO1lBQzdDLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFGLE9BQU8sb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFLEVBQUU7Z0JBQzFELElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQzVCLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQztvQkFDckIsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTt3QkFDakMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHOzRCQUNmLE9BQU8sRUFBRSxDQUFDOzRCQUNWLFFBQVEsRUFBRSxDQUFDLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dDQUN0RCxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7eUJBQ25ELENBQUM7b0JBQ0osQ0FBQyxDQUFDLENBQUM7b0JBRUgsV0FBVyxHQUFHLFNBQVMsQ0FBQztvQkFDeEIsa0JBQWtCLEVBQUU7eUJBQ2pCLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQ1QsV0FBVyxhQUFYLFdBQVcsdUJBQVgsV0FBVyxFQUFJLENBQUM7d0JBQ2hCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMzQixDQUFDLENBQUM7eUJBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFDaEQsbUNBQW1DLENBQUMsQ0FBQyxDQUFDO2lCQUMzQztxQkFBTTtvQkFDTCxNQUFNLFFBQVEsR0FBRyxJQUFBLDZCQUFvQixHQUFFLENBQUM7b0JBQ3hDLGVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDO3lCQUNyQixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO3dCQUNuQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDcEY7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsTUFBTSxlQUFlLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDM0MsTUFBTSxhQUFhLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckQsTUFBTSxhQUFhLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxhQUFhLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDakYsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxJQUFJLENBQUEsYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1lBQ3JDLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO1FBRUQsT0FBTyxhQUFhLENBQUM7SUFDdkIsQ0FBQyxDQUFDO0lBRUYsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ2hCLGVBQWUsR0FBRyxJQUFJLCtCQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25ELGVBQWUsR0FBRyxJQUFJLGlDQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBTyxRQUFRLEVBQUUsRUFBRTtZQUM3RCxJQUFJLFFBQVEsS0FBSyxnQkFBTyxFQUFFO2dCQUd4QixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDbkQ7aUJBQU07Z0JBQ0wsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxVQUFVLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sVUFBVSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSw4QkFBcUIsR0FBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUNsRixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBQSx5QkFBZSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQzFELElBQUksVUFBVSxNQUFLLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxFQUFFLENBQUEsRUFBRTtvQkFDakMsSUFBSTt3QkFDRixNQUFNLElBQUEsNEJBQWMsRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFDOzZCQUN0QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSxnQ0FBa0IsRUFBQyxPQUFPLEVBQUUsVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQzVEO29CQUFDLE9BQU8sR0FBRyxFQUFFO3dCQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ2xGO2lCQUNGO2FBQ0Y7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxFQUFFO1lBQzNELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzNDLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEQsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO2dCQUMvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxQjtZQUVELE9BQU8saUJBQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDO2lCQUNoRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksQ0FBQztnQkFDOUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7Z0JBQ25CLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBTyxTQUFTLEVBQUUsVUFBVSxFQUFFLEVBQUU7WUFDaEUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDM0MsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RCxJQUFJLGFBQWEsS0FBSyxTQUFTLEVBQUU7Z0JBQy9CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzFCO1lBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ2pFLGNBQWMsR0FBRyxVQUFVLENBQUM7Z0JBQzVCLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxxRUFBcUU7c0JBQzNGLHdHQUF3RztzQkFDeEcsc0dBQXNHO3NCQUN0RyxxR0FBcUc7c0JBQ3JHLDRDQUE0QyxDQUFDLENBQUM7YUFDbkQ7WUFDRCxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6RixNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUM7aUJBQy9DLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLG9CQUFXLENBQUM7bUJBQy9CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsMkJBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEUsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO2dCQUMxQixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO29CQUV6QixPQUFPLGlCQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7aUJBQ3REO3FCQUFNO29CQUNMLE9BQU8saUJBQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDO3lCQUMvRCxJQUFJLENBQUMsQ0FBTSxLQUFLLEVBQUMsRUFBRTt3QkFDbEIsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFOzRCQUN2QixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzt5QkFDMUI7d0JBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2pGLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsbUJBQW1CLEVBQUUsZ0JBQU8sRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDcEUsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzNCLENBQUMsQ0FBQSxDQUFDLENBQUM7aUJBQ047WUFDSCxDQUFDLENBQUM7WUFFRixPQUFPLGNBQWMsRUFBRTtpQkFDcEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2lCQUM3RCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztpQkFDaEMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxXQUFXLGFBQVgsV0FBVyx1QkFBWCxXQUFXLEVBQUksQ0FBQztnQkFDaEIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDM0IsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQ2hELGtDQUFrQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQU8sWUFBWSxFQUFFLEVBQUU7WUFDbEUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRTtnQkFDL0IsT0FBTzthQUNSO1lBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsOEJBQXFCLEdBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBQSx5QkFBZSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFMUQsTUFBTSxVQUFVLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdFLElBQUk7Z0JBQ0YsTUFBTSxJQUFBLDRCQUFjLEVBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQztxQkFDdEMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsZ0NBQWtCLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3hEO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUN6RjtRQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUNwRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQSxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsTUFBTSxNQUFLLGdCQUFPLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRTtnQkFDdEUsT0FBTzthQUNSO1lBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsOEJBQXFCLEdBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRixlQUFlLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLFlBQVksRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkLCB7IGFsbCB9IGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIEZsZXhMYXlvdXQsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgSW5pUGFyc2VyIGZyb20gJ3ZvcnRleC1wYXJzZS1pbmknO1xyXG5pbXBvcnQgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcblxyXG5pbXBvcnQgeyBtaWdyYXRlMTQ4IH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuXHJcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XHJcbmltcG9ydCB7IElXM0NvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5cclxuaW1wb3J0IG1lbnVNb2QgZnJvbSAnLi9tZW51bW9kJztcclxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIsIGdldFNjcmlwdE1lcmdlckRpciwgc2V0TWVyZ2VyQ29uZmlnIH0gZnJvbSAnLi9zY3JpcHRtZXJnZXInO1xyXG5cclxuaW1wb3J0IHsgRE9fTk9UX0RFUExPWSwgRE9fTk9UX0RJU1BMQVksXHJcbiAgR0FNRV9JRCwgZ2V0TG9hZE9yZGVyRmlsZVBhdGgsIGdldFByaW9yaXR5VHlwZUJyYW5jaCwgSTE4Tl9OQU1FU1BBQ0UsXHJcbiAgSU5QVVRfWE1MX0ZJTEVOQU1FLCBMT0NLRURfUFJFRklYLCBQQVJUX1NVRkZJWCwgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcixcclxuICBTQ1JJUFRfTUVSR0VSX0lELCBVTklfUEFUQ0gsXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgdGVzdE1vZExpbWl0QnJlYWNoIH0gZnJvbSAnLi90ZXN0cyc7XHJcblxyXG5pbXBvcnQgeyBNb2RMaW1pdFBhdGNoZXIgfSBmcm9tICcuL21vZExpbWl0UGF0Y2gnO1xyXG5cclxuaW1wb3J0IHsgcmVnaXN0ZXJBY3Rpb25zIH0gZnJvbSAnLi9pY29uYmFyQWN0aW9ucyc7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IGluc3RhbGxNaXhlZCwgdGVzdFN1cHBvcnRlZE1peGVkIH0gZnJvbSAnLi9pbnN0YWxsZXJzJztcclxuaW1wb3J0IHsgcmVzdG9yZUZyb21Qcm9maWxlLCBzdG9yZVRvUHJvZmlsZSB9IGZyb20gJy4vbWVyZ2VCYWNrdXAnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZXMgfSBmcm9tICcuL21lcmdlSW52ZW50b3J5UGFyc2luZyc7XHJcblxyXG5pbXBvcnQgeyBzZXRQcmlvcml0eVR5cGUgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyBXM1JlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcclxuXHJcbmNvbnN0IEdPR19JRCA9ICcxMjA3NjY0NjYzJztcclxuY29uc3QgR09HX0lEX0dPVFkgPSAnMTQ5NTEzNDMyMCc7XHJcbmNvbnN0IFNURUFNX0lEID0gJzQ5OTQ1MCc7XHJcbmNvbnN0IFNURUFNX0lEX1dIID0gJzI5MjAzMCc7XHJcblxyXG5jb25zdCBDT05GSUdfTUFUUklYX1JFTF9QQVRIID0gcGF0aC5qb2luKCdiaW4nLCAnY29uZmlnJywgJ3I0Z2FtZScsICd1c2VyX2NvbmZpZ19tYXRyaXgnLCAncGMnKTtcclxuXHJcbmxldCBfSU5JX1NUUlVDVCA9IHt9O1xyXG5sZXQgX1BSRVZJT1VTX0xPID0ge307XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICB7XHJcbiAgICBpZDogU0NSSVBUX01FUkdFUl9JRCxcclxuICAgIG5hbWU6ICdXMyBTY3JpcHQgTWVyZ2VyJyxcclxuICAgIGxvZ286ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxyXG4gICAgXSxcclxuICB9LFxyXG5dO1xyXG5cclxuZnVuY3Rpb24gd3JpdGVUb01vZFNldHRpbmdzKCkge1xyXG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XHJcbiAgcmV0dXJuIGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMud3JpdGVGaWxlQXN5bmMoZmlsZVBhdGgsICcnLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpXHJcbiAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAudGhlbihpbmkgPT4ge1xyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChPYmplY3Qua2V5cyhfSU5JX1NUUlVDVCksIChrZXkpID0+IHtcclxuICAgICAgICBpZiAoX0lOSV9TVFJVQ1Q/LltrZXldPy5FbmFibGVkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIC8vIEl0J3MgcG9zc2libGUgZm9yIHRoZSB1c2VyIHRvIHJ1biBtdWx0aXBsZSBvcGVyYXRpb25zIGF0IG9uY2UsXHJcbiAgICAgICAgICAvLyAgY2F1c2luZyB0aGUgc3RhdGljIGluaSBzdHJ1Y3R1cmUgdG8gYmUgbW9kaWZpZWRcclxuICAgICAgICAgIC8vICBlbHNld2hlcmUgd2hpbGUgd2UncmUgYXR0ZW1wdGluZyB0byB3cml0ZSB0byBmaWxlLiBUaGUgdXNlciBtdXN0J3ZlIGJlZW5cclxuICAgICAgICAgIC8vICBtb2RpZnlpbmcgdGhlIGxvYWQgb3JkZXIgd2hpbGUgZGVwbG95aW5nLiBUaGlzIHNob3VsZFxyXG4gICAgICAgICAgLy8gIG1ha2Ugc3VyZSB3ZSBkb24ndCBhdHRlbXB0IHRvIHdyaXRlIGFueSBpbnZhbGlkIG1vZCBlbnRyaWVzLlxyXG4gICAgICAgICAgLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvODQzN1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbmkuZGF0YVtrZXldID0ge1xyXG4gICAgICAgICAgRW5hYmxlZDogX0lOSV9TVFJVQ1Rba2V5XS5FbmFibGVkLFxyXG4gICAgICAgICAgUHJpb3JpdHk6IF9JTklfU1RSVUNUW2tleV0uUHJpb3JpdHksXHJcbiAgICAgICAgICBWSzogX0lOSV9TVFJVQ1Rba2V5XS5WSyxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oKCkgPT4gcGFyc2VyLndyaXRlKGZpbGVQYXRoLCBpbmkpKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIucGF0aCAhPT0gdW5kZWZpbmVkICYmIFsnRVBFUk0nLCAnRUJVU1knXS5pbmNsdWRlcyhlcnIuY29kZSkpXHJcbiAgICAgID8gUHJvbWlzZS5yZWplY3QobmV3IFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IoZXJyLnBhdGgpKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgLy8gVGhlb3JldGljYWxseSB0aGUgV2l0Y2hlciAzIGRvY3VtZW50cyBwYXRoIHNob3VsZCBiZVxyXG4gIC8vICBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKGVpdGhlciBieSB1cyBvciB0aGUgZ2FtZSkgYnV0XHJcbiAgLy8gIGp1c3QgaW4gY2FzZSBpdCBnb3QgcmVtb3ZlZCBzb21laG93LCB3ZSByZS1pbnN0YXRlIGl0XHJcbiAgLy8gIHlldCBhZ2Fpbi4uLiBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzcwNThcclxuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMud3JpdGVGaWxlQXN5bmMoZmlsZVBhdGgsICcnLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xyXG59XHJcblxyXG4vLyBBdHRlbXB0cyB0byBwYXJzZSBhbmQgcmV0dXJuIGRhdGEgZm91bmQgaW5zaWRlXHJcbi8vICB0aGUgbW9kcy5zZXR0aW5ncyBmaWxlIGlmIGZvdW5kIC0gb3RoZXJ3aXNlIHRoaXNcclxuLy8gIHdpbGwgZW5zdXJlIHRoZSBmaWxlIGlzIHByZXNlbnQuXHJcbmZ1bmN0aW9uIGVuc3VyZU1vZFNldHRpbmdzKCkge1xyXG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgPyBjcmVhdGVNb2RTZXR0aW5ncygpLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRNYW51YWxseUFkZGVkTW9kcyhjb250ZXh0KSB7XHJcbiAgcmV0dXJuIGVuc3VyZU1vZFNldHRpbmdzKCkudGhlbihpbmkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gICAgY29uc3QgaW5pRW50cmllcyA9IE9iamVjdC5rZXlzKGluaS5kYXRhKTtcclxuICAgIGNvbnN0IG1hbnVhbENhbmRpZGF0ZXMgPSBbXS5jb25jYXQoaW5pRW50cmllcywgW1VOSV9QQVRDSF0pLmZpbHRlcihlbnRyeSA9PiB7XHJcbiAgICAgIGNvbnN0IGhhc1ZvcnRleEtleSA9IHV0aWwuZ2V0U2FmZShpbmkuZGF0YVtlbnRyeV0sIFsnVksnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICByZXR1cm4gKCghaGFzVm9ydGV4S2V5KSB8fCAoaW5pLmRhdGFbZW50cnldLlZLID09PSBlbnRyeSkgJiYgIW1vZEtleXMuaW5jbHVkZXMoZW50cnkpKTtcclxuICAgIH0pIHx8IFtVTklfUEFUQ0hdO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgU2V0KG1hbnVhbENhbmRpZGF0ZXMpKTtcclxuICB9KVxyXG4gIC50aGVuKHVuaXF1ZUNhbmRpZGF0ZXMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBIb3cvd2h5IGFyZSB3ZSBldmVuIGhlcmUgP1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkIScpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShBcnJheS5mcm9tKHVuaXF1ZUNhbmRpZGF0ZXMpLCAoYWNjdW0sIG1vZCkgPT4ge1xyXG4gICAgICBjb25zdCBtb2RGb2xkZXIgPSBwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCk7XHJcbiAgICAgIHJldHVybiBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZEZvbGRlcikpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgIC8vIE9rLCB3ZSBrbm93IHRoZSBmb2xkZXIgaXMgdGhlcmUgLSBsZXRzIGVuc3VyZSB0aGF0XHJcbiAgICAgICAgICAvLyAgaXQgYWN0dWFsbHkgY29udGFpbnMgZmlsZXMuXHJcbiAgICAgICAgICBsZXQgY2FuZGlkYXRlcyA9IFtdO1xyXG4gICAgICAgICAgYXdhaXQgcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdChwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCksIGVudHJpZXMgPT4ge1xyXG4gICAgICAgICAgICBjYW5kaWRhdGVzID0gW10uY29uY2F0KGNhbmRpZGF0ZXMsIGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICghZW50cnkuaXNEaXJlY3RvcnkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChwYXRoLmV4dG5hbWUocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkpICE9PSAnJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGVudHJ5Py5saW5rQ291bnQgPT09IHVuZGVmaW5lZCB8fCBlbnRyeS5saW5rQ291bnQgPD0gMSkpKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IChbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmRleE9mKGVyci5jb2RlKSAhPT0gLTEpXHJcbiAgICAgICAgICAgID8gbnVsbCAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcblxyXG4gICAgICAgICAgY29uc3QgbWFwcGVkID0gYXdhaXQgQmx1ZWJpcmQubWFwKGNhbmRpZGF0ZXMsIGNhbmQgPT5cclxuICAgICAgICAgICAgZnMuc3RhdEFzeW5jKGNhbmQuZmlsZVBhdGgpXHJcbiAgICAgICAgICAgICAgLnRoZW4oc3RhdHMgPT4gc3RhdHMuaXNTeW1ib2xpY0xpbmsoKVxyXG4gICAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgOiBQcm9taXNlLnJlc29sdmUoY2FuZC5maWxlUGF0aCkpXHJcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSkpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUobWFwcGVkKTtcclxuICAgICAgICB9KSlcclxuICAgICAgICAudGhlbigoZmlsZXM6IHN0cmluZ1tdKSA9PiB7XHJcbiAgICAgICAgICBpZiAoZmlsZXMuZmlsdGVyKGZpbGUgPT4gZmlsZSAhPT0gdW5kZWZpbmVkKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2gobW9kKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoKGVyci5jb2RlID09PSAnRU5PRU5UJykgJiYgKGVyci5wYXRoID09PSBtb2RGb2xkZXIpKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoYWNjdW0pXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgfSwgW10pO1xyXG4gIH0pXHJcbiAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAvLyBVc2VyQ2FuY2VsZWQgd291bGQgc3VnZ2VzdCB3ZSB3ZXJlIHVuYWJsZSB0byBzdGF0IHRoZSBXMyBtb2QgZm9sZGVyXHJcbiAgICAvLyAgcHJvYmFibHkgZHVlIHRvIGEgcGVybWlzc2lvbmluZyBpc3N1ZSAoRU5PRU5UIGlzIGhhbmRsZWQgYWJvdmUpXHJcbiAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpO1xyXG4gICAgY29uc3QgcHJvY2Vzc0NhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKTtcclxuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gKCF1c2VyQ2FuY2VsZWQgJiYgIXByb2Nlc3NDYW5jZWxlZCk7XHJcbiAgICBjb25zdCBkZXRhaWxzID0gdXNlckNhbmNlbGVkXHJcbiAgICAgID8gJ1ZvcnRleCB0cmllZCB0byBzY2FuIHlvdXIgVzMgbW9kcyBmb2xkZXIgZm9yIG1hbnVhbGx5IGFkZGVkIG1vZHMgYnV0ICdcclxuICAgICAgICArICd3YXMgYmxvY2tlZCBieSB5b3VyIE9TL0FWIC0gcGxlYXNlIG1ha2Ugc3VyZSB0byBmaXggdGhpcyBiZWZvcmUgeW91ICdcclxuICAgICAgICArICdwcm9jZWVkIHRvIG1vZCBXMyBhcyB5b3VyIG1vZGRpbmcgZXhwZXJpZW5jZSB3aWxsIGJlIHNldmVyZWx5IGFmZmVjdGVkLidcclxuICAgICAgOiBlcnI7XHJcbiAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBsb29rdXAgbWFudWFsbHkgYWRkZWQgbW9kcycsXHJcbiAgICAgIGRldGFpbHMsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKTogQmx1ZWJpcmQ8c3RyaW5nPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKFxyXG4gICAgICAnSEtFWV9MT0NBTF9NQUNISU5FJyxcclxuICAgICAgJ1NvZnR3YXJlXFxcXENEIFByb2plY3QgUmVkXFxcXFRoZSBXaXRjaGVyIDMnLFxyXG4gICAgICAnSW5zdGFsbEZvbGRlcicpO1xyXG4gICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoaW5zdFBhdGgudmFsdWUgYXMgc3RyaW5nKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbR09HX0lEX0dPVFksIEdPR19JRCwgU1RFQU1fSUQsIFNURUFNX0lEX1dIXSlcclxuICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRUTChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gJ3dpdGNoZXIzJylcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgICAgZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdtb2RzJykgIT09IC0xKSAhPT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsVEwoZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICBnYW1lSWQsXHJcbiAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XHJcbiAgbGV0IHByZWZpeCA9IGZpbGVzLnJlZHVjZSgocHJldiwgZmlsZSkgPT4ge1xyXG4gICAgY29uc3QgY29tcG9uZW50cyA9IGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICBjb25zdCBpZHggPSBjb21wb25lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgIGlmICgoaWR4ID4gMCkgJiYgKChwcmV2ID09PSB1bmRlZmluZWQpIHx8IChpZHggPCBwcmV2Lmxlbmd0aCkpKSB7XHJcbiAgICAgIHJldHVybiBjb21wb25lbnRzLnNsaWNlKDAsIGlkeCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH1cclxuICB9LCB1bmRlZmluZWQpO1xyXG5cclxuICBwcmVmaXggPSAocHJlZml4ID09PSB1bmRlZmluZWQpID8gJycgOiBwcmVmaXguam9pbihwYXRoLnNlcCkgKyBwYXRoLnNlcDtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsZXNcclxuICAgIC5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkgJiYgZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgocHJlZml4KSlcclxuICAgIC5tYXAoZmlsZSA9PiAoe1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc2xpY2UocHJlZml4Lmxlbmd0aCksXHJcbiAgICB9KSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRDb250ZW50KGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnY29udGVudCcgKyBwYXRoLnNlcCkgIT09IHVuZGVmaW5lZCkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmlsZXNcclxuICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnY29udGVudCcgKyBwYXRoLnNlcCkpXHJcbiAgICAubWFwKGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBmaWxlQmFzZSA9IGZpbGUuc3BsaXQocGF0aC5zZXApLnNsaWNlKDEpLmpvaW4ocGF0aC5zZXApO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbignbW9kJyArIGRlc3RpbmF0aW9uUGF0aCwgZmlsZUJhc2UpLFxyXG4gICAgICB9O1xyXG4gIH0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbE1lbnVNb2QoZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XHJcbiAgLy8gSW5wdXQgc3BlY2lmaWMgZmlsZXMgbmVlZCB0byBiZSBpbnN0YWxsZWQgb3V0c2lkZSB0aGUgbW9kcyBmb2xkZXIgd2hpbGVcclxuICAvLyAgYWxsIG90aGVyIG1vZCBmaWxlcyBhcmUgdG8gYmUgaW5zdGFsbGVkIGFzIHVzdWFsLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZSkpICE9PSAnJyk7XHJcbiAgY29uc3QgaW5wdXRGaWxlcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IGZpbGUuaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpO1xyXG4gIGNvbnN0IHVuaXF1ZUlucHV0ID0gaW5wdXRGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICAvLyBTb21lIG1vZHMgdGVuZCB0byBpbmNsdWRlIGEgYmFja3VwIGZpbGUgbWVhbnQgZm9yIHRoZSB1c2VyIHRvIHJlc3RvcmVcclxuICAgIC8vICBoaXMgZ2FtZSB0byB2YW5pbGxhIChvYnZzIHdlIG9ubHkgd2FudCB0byBhcHBseSB0aGUgbm9uLWJhY2t1cCkuXHJcbiAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoaXRlcik7XHJcblxyXG4gICAgaWYgKGFjY3VtLmZpbmQoZW50cnkgPT4gcGF0aC5iYXNlbmFtZShlbnRyeSkgPT09IGZpbGVOYW1lKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFRoaXMgY29uZmlnIGZpbGUgaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGUgYWNjdW11bGF0b3IuXHJcbiAgICAgIC8vICBJZ25vcmUgdGhpcyBpbnN0YW5jZS5cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGluc3RhbmNlcyA9IGlucHV0RmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gZmlsZU5hbWUpO1xyXG4gICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIC8vIFdlIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIG1lbnUgY29uZmlnIGZpbGUgLSBtb2QgYXV0aG9yIHByb2JhYmx5IGluY2x1ZGVkXHJcbiAgICAgIC8vICBhIGJhY2t1cCBmaWxlIHRvIHJlc3RvcmUgdmFuaWxsYSBzdGF0ZSwgb3IgcGVyaGFwcyB0aGlzIGlzIGEgdmFyaWFudCBtb2Qgd2hpY2ggd2VcclxuICAgICAgLy8gIGNhbid0IGN1cnJlbnRseSBzdXBwb3J0LlxyXG4gICAgICAvLyBJdCdzIGRpZmZpY3VsdCBmb3IgdXMgdG8gY29ycmVjdGx5IGlkZW50aWZ5IHRoZSBjb3JyZWN0IGZpbGUgYnV0IHdlJ3JlIGdvaW5nIHRvXHJcbiAgICAgIC8vICB0cnkgYW5kIGd1ZXNzIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGNvbmZpZyBmaWxlIGhhcyBhIFwiYmFja3VwXCIgZm9sZGVyIHNlZ21lbnRcclxuICAgICAgLy8gIG90aGVyd2lzZSB3ZSBqdXN0IGFkZCB0aGUgZmlyc3QgZmlsZSBpbnN0YW5jZSAoSSdtIGdvaW5nIHRvIHJlZ3JldCBhZGRpbmcgdGhpcyBhcmVuJ3QgSSA/KVxyXG4gICAgICBpZiAoaXRlci50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2JhY2t1cCcpID09PSAtMSkge1xyXG4gICAgICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGFzc3VtZSB0aGF0IHRoaXMgaXMgdGhlIHJpZ2h0IGZpbGUuXHJcbiAgICAgICAgYWNjdW0ucHVzaChpdGVyKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gVGhpcyBpcyBhIHVuaXF1ZSBtZW51IGNvbmZpZ3VyYXRpb24gZmlsZSAtIGFkZCBpdC5cclxuICAgICAgYWNjdW0ucHVzaChpdGVyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcblxyXG4gIGxldCBvdGhlckZpbGVzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gIWlucHV0RmlsZXMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIGNvbnN0IGlucHV0RmlsZURlc3RpbmF0aW9uID0gQ09ORklHX01BVFJJWF9SRUxfUEFUSDtcclxuXHJcbiAgLy8gR2V0IHRoZSBtb2QncyByb290IGZvbGRlci5cclxuICBjb25zdCBiaW5JZHggPSB1bmlxdWVJbnB1dFswXS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJyk7XHJcblxyXG4gIC8vIFJlZmVycyB0byBmaWxlcyBsb2NhdGVkIGluc2lkZSB0aGUgYXJjaGl2ZSdzICdNb2RzJyBkaXJlY3RvcnkuXHJcbiAgLy8gIFRoaXMgYXJyYXkgY2FuIHZlcnkgd2VsbCBiZSBlbXB0eSBpZiBhIG1vZHMgZm9sZGVyIGRvZXNuJ3QgZXhpc3RcclxuICBjb25zdCBtb2RGaWxlcyA9IG90aGVyRmlsZXMuZmlsdGVyKGZpbGUgPT5cclxuICAgIGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5jbHVkZXMoJ21vZHMnKSk7XHJcblxyXG4gIGNvbnN0IG1vZHNJZHggPSAobW9kRmlsZXMubGVuZ3RoID4gMClcclxuICAgID8gbW9kRmlsZXNbMF0udG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpXHJcbiAgICA6IC0xO1xyXG4gIGNvbnN0IG1vZE5hbWVzID0gKG1vZHNJZHggIT09IC0xKVxyXG4gICAgPyBtb2RGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vZE5hbWUgPSBpdGVyLnNwbGl0KHBhdGguc2VwKS5zcGxpY2UobW9kc0lkeCArIDEsIDEpLmpvaW4oKTtcclxuICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtb2ROYW1lKSkge1xyXG4gICAgICAgIGFjY3VtLnB1c2gobW9kTmFtZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pXHJcbiAgICA6IFtdO1xyXG4gIC8vIFRoZSBwcmVzZW5jZSBvZiBhIG1vZHMgZm9sZGVyIGluZGljYXRlcyB0aGF0IHRoaXMgbW9kIG1heSBwcm92aWRlXHJcbiAgLy8gIHNldmVyYWwgbW9kIGVudHJpZXMuXHJcbiAgaWYgKG1vZEZpbGVzLmxlbmd0aCA+IDApIHtcclxuICAgIG90aGVyRmlsZXMgPSBvdGhlckZpbGVzLmZpbHRlcihmaWxlID0+ICFtb2RGaWxlcy5pbmNsdWRlcyhmaWxlKSk7XHJcbiAgfVxyXG5cclxuICAvLyBXZSdyZSBob3BpbmcgdGhhdCB0aGUgbW9kIGF1dGhvciBoYXMgaW5jbHVkZWQgdGhlIG1vZCBuYW1lIGluIHRoZSBhcmNoaXZlJ3NcclxuICAvLyAgc3RydWN0dXJlIC0gaWYgaGUgZGlkbid0IC0gd2UncmUgZ29pbmcgdG8gdXNlIHRoZSBkZXN0aW5hdGlvbiBwYXRoIGluc3RlYWQuXHJcbiAgY29uc3QgbW9kTmFtZSA9IChiaW5JZHggPiAwKVxyXG4gICAgPyBpbnB1dEZpbGVzWzBdLnNwbGl0KHBhdGguc2VwKVtiaW5JZHggLSAxXVxyXG4gICAgOiAoJ21vZCcgKyBwYXRoLmJhc2VuYW1lKGRlc3RpbmF0aW9uUGF0aCwgJy5pbnN0YWxsaW5nJykpLnJlcGxhY2UoL1xccy9nLCAnJyk7XHJcblxyXG4gIGNvbnN0IHRyaW1tZWRGaWxlcyA9IG90aGVyRmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc291cmNlID0gZmlsZTtcclxuICAgIGxldCByZWxQYXRoID0gZmlsZS5zcGxpdChwYXRoLnNlcClcclxuICAgICAgICAgICAgICAgICAgICAgIC5zbGljZShiaW5JZHgpO1xyXG4gICAgaWYgKHJlbFBhdGhbMF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBUaGlzIGZpbGUgbXVzdCd2ZSBiZWVuIGluc2lkZSB0aGUgcm9vdCBvZiB0aGUgYXJjaGl2ZTtcclxuICAgICAgLy8gIGRlcGxveSBhcyBpcy5cclxuICAgICAgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpcnN0U2VnID0gcmVsUGF0aFswXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGZpcnN0U2VnID09PSAnY29udGVudCcgfHwgZmlyc3RTZWcuZW5kc1dpdGgoUEFSVF9TVUZGSVgpKSB7XHJcbiAgICAgIHJlbFBhdGggPSBbXS5jb25jYXQoWydNb2RzJywgbW9kTmFtZV0sIHJlbFBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNvdXJjZSxcclxuICAgICAgcmVsUGF0aDogcmVsUGF0aC5qb2luKHBhdGguc2VwKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHRvQ29weUluc3RydWN0aW9uID0gKHNvdXJjZSwgZGVzdGluYXRpb24pID0+ICh7XHJcbiAgICB0eXBlOiAnY29weScsXHJcbiAgICBzb3VyY2UsXHJcbiAgICBkZXN0aW5hdGlvbixcclxuICB9KTtcclxuXHJcbiAgY29uc3QgaW5wdXRJbnN0cnVjdGlvbnMgPSB1bmlxdWVJbnB1dC5tYXAoZmlsZSA9PlxyXG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZSwgcGF0aC5qb2luKGlucHV0RmlsZURlc3RpbmF0aW9uLCBwYXRoLmJhc2VuYW1lKGZpbGUpKSkpO1xyXG5cclxuICBjb25zdCBvdGhlckluc3RydWN0aW9ucyA9IHRyaW1tZWRGaWxlcy5tYXAoZmlsZSA9PlxyXG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZS5zb3VyY2UsIGZpbGUucmVsUGF0aCkpO1xyXG5cclxuICBjb25zdCBtb2RGaWxlSW5zdHJ1Y3Rpb25zID0gbW9kRmlsZXMubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUsIGZpbGUpKTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gW10uY29uY2F0KGlucHV0SW5zdHJ1Y3Rpb25zLCBvdGhlckluc3RydWN0aW9ucywgbW9kRmlsZUluc3RydWN0aW9ucyk7XHJcbiAgaWYgKG1vZE5hbWVzLmxlbmd0aCA+IDApIHtcclxuICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgIGtleTogJ21vZENvbXBvbmVudHMnLFxyXG4gICAgICB2YWx1ZTogbW9kTmFtZXMsXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdE1lbnVNb2RSb290KGluc3RydWN0aW9uczogYW55W10sIGdhbWVJZDogc3RyaW5nKTpcclxuICBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQgfCBib29sZWFuPiB7XHJcbiAgY29uc3QgcHJlZGljYXRlID0gKGluc3RyKSA9PiAoISFnYW1lSWQpXHJcbiAgICA/ICgoR0FNRV9JRCA9PT0gZ2FtZUlkKSAmJiAoaW5zdHIuaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpKVxyXG4gICAgOiAoKGluc3RyLnR5cGUgPT09ICdjb3B5JykgJiYgKGluc3RyLmRlc3RpbmF0aW9uLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKSk7XHJcblxyXG4gIHJldHVybiAoISFnYW1lSWQpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgc3VwcG9ydGVkOiBpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgICAgIH0pXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0VEwoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgY29uc3QgbWVudU1vZEZpbGVzID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiAhIWluc3RyLmRlc3RpbmF0aW9uXHJcbiAgICAmJiBpbnN0ci5kZXN0aW5hdGlvbi5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSk7XHJcbiAgaWYgKG1lbnVNb2RGaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdHJ1Y3Rpb25zLmZpbmQoXHJcbiAgICBpbnN0cnVjdGlvbiA9PiAhIWluc3RydWN0aW9uLmRlc3RpbmF0aW9uICYmIGluc3RydWN0aW9uLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnbW9kcycgKyBwYXRoLnNlcCksXHJcbiAgKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdERMQyhpbnN0cnVjdGlvbnMpIHtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxyXG4gICAgaW5zdHJ1Y3Rpb24gPT4gISFpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbiAmJiBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2RsYycgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSkge1xyXG4gIGNvbnN0IG5vdGlmSWQgPSAnbWlzc2luZy1zY3JpcHQtbWVyZ2VyJztcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogbm90aWZJZCxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgMyBzY3JpcHQgbWVyZ2VyIGlzIG1pc3NpbmcvbWlzY29uZmlndXJlZCcsXHJcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgU2NyaXB0IE1lcmdlcicsIHtcclxuICAgICAgICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdWb3J0ZXggaXMgdW5hYmxlIHRvIHJlc29sdmUgdGhlIFNjcmlwdCBNZXJnZXJcXCdzIGxvY2F0aW9uLiBUaGUgdG9vbCBuZWVkcyB0byBiZSBkb3dubG9hZGVkIGFuZCBjb25maWd1cmVkIG1hbnVhbGx5LiAnXHJcbiAgICAgICAgICAgICAgKyAnW3VybD1odHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvVG9vbF9TZXR1cDpfV2l0Y2hlcl8zX1NjcmlwdF9NZXJnZXJdRmluZCBvdXQgbW9yZSBhYm91dCBob3cgdG8gY29uZmlndXJlIGl0IGFzIGEgdG9vbCBmb3IgdXNlIGluIFZvcnRleC5bL3VybF1bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICAgICAgICAgKyAnTm90ZTogV2hpbGUgc2NyaXB0IG1lcmdpbmcgd29ya3Mgd2VsbCB3aXRoIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHMsIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSBmb3IgYSBzYXRpc2Z5aW5nIG91dGNvbWUgaW4gZXZlcnkgc2luZ2xlIGNhc2UuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJyk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7IGxhYmVsOiAnRG93bmxvYWQgU2NyaXB0IE1lcmdlcicsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKSkgfSxcclxuICAgICAgICAgIF0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpIHtcclxuICBjb25zdCBmaW5kU2NyaXB0TWVyZ2VyID0gYXN5bmMgKGVycm9yKSA9PiB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBkb3dubG9hZC9pbnN0YWxsIHNjcmlwdCBtZXJnZXInLCBlcnJvcik7XHJcbiAgICBjb25zdCBzY3JpcHRNZXJnZXJQYXRoID0gYXdhaXQgZ2V0U2NyaXB0TWVyZ2VyRGlyKGNvbnRleHQpO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlclBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gc2V0TWVyZ2VyQ29uZmlnKGRpc2NvdmVyeS5wYXRoLCBzY3JpcHRNZXJnZXJQYXRoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGVuc3VyZVBhdGggPSAoZGlycGF0aCkgPT5cclxuICAgIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoZGlycGF0aClcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFRVhJU1QnKVxyXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpLFxyXG4gICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKSksXHJcbiAgICBlbnN1cmVQYXRoKHBhdGguZGlybmFtZShnZXRMb2FkT3JkZXJGaWxlUGF0aCgpKSldKVxyXG4gICAgICAudGhlbigoKSA9PiBkb3dubG9hZFNjcmlwdE1lcmdlcihjb250ZXh0KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgOiBmaW5kU2NyaXB0TWVyZ2VyKGVycikpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHNjcmlwdE1lcmdlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghIXNjcmlwdE1lcmdlcj8ucGF0aCkge1xyXG4gICAgcmV0dXJuIHNjcmlwdE1lcmdlcjtcclxuICB9XHJcblxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1blNjcmlwdE1lcmdlcihhcGkpIHtcclxuICBjb25zdCB0b29sID0gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpO1xyXG4gIGlmICh0b29sPy5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBhcGkucnVuRXhlY3V0YWJsZSh0b29sLnBhdGgsIFtdLCB7IHN1Z2dlc3REZXBsb3k6IHRydWUgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJ1biB0b29sJywgZXJyLFxyXG4gICAgICB7IGFsbG93UmVwb3J0OiBbJ0VQRVJNJywgJ0VBQ0NFU1MnLCAnRU5PRU5UJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xIH0pKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTW9kcyhjb250ZXh0KSB7XHJcbiAgLy8gTW9kIHR5cGVzIHdlIGRvbid0IHdhbnQgdG8gZGlzcGxheSBpbiB0aGUgTE8gcGFnZVxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBtZXJnZWQ6IFtdLFxyXG4gICAgICBtYW51YWw6IFtdLFxyXG4gICAgICBtYW5hZ2VkOiBbXSxcclxuICAgIH0pO1xyXG4gIH1cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcblxyXG4gIC8vIE9ubHkgc2VsZWN0IG1vZHMgd2hpY2ggYXJlIGVuYWJsZWQsIGFuZCBhcmUgbm90IGEgbWVudSBtb2QuXHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RTdGF0ZSkuZmlsdGVyKGtleSA9PlxyXG4gICAgKCEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSkpO1xyXG5cclxuICBjb25zdCBtZXJnZWRNb2ROYW1lcyA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWVzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbnVhbGx5QWRkZWRNb2RzID0gYXdhaXQgZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCk7XHJcbiAgY29uc3QgbWFuYWdlZE1vZHMgPSBhd2FpdCBnZXRNYW5hZ2VkTW9kTmFtZXMoY29udGV4dCwgZW5hYmxlZE1vZHMubWFwKGtleSA9PiBtb2RzW2tleV0pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIG1lcmdlZDogbWVyZ2VkTW9kTmFtZXMsXHJcbiAgICBtYW51YWw6IG1hbnVhbGx5QWRkZWRNb2RzLmZpbHRlcihtb2QgPT4gIW1lcmdlZE1vZE5hbWVzLmluY2x1ZGVzKG1vZCkpLFxyXG4gICAgbWFuYWdlZDogbWFuYWdlZE1vZHMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNldElOSVN0cnVjdChjb250ZXh0LCBsb2FkT3JkZXIsIHByaW9yaXR5TWFuYWdlcikge1xyXG4gIHJldHVybiBnZXRBbGxNb2RzKGNvbnRleHQpLnRoZW4obW9kTWFwID0+IHtcclxuICAgIF9JTklfU1RSVUNUID0ge307XHJcbiAgICBjb25zdCBtb2RzID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1vZE1hcC5tYW5hZ2VkLCBtb2RNYXAubWFudWFsKTtcclxuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKGlzTG9ja2VkRW50cnkpO1xyXG4gICAgY29uc3QgbWFuYWdlZExvY2tlZCA9IG1vZE1hcC5tYW5hZ2VkXHJcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gaXNMb2NrZWRFbnRyeShlbnRyeS5uYW1lKSlcclxuICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKTtcclxuICAgIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCwgbWFuYWdlZExvY2tlZCk7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChtb2RzLCAobW9kLCBpZHgpID0+IHtcclxuICAgICAgbGV0IG5hbWU7XHJcbiAgICAgIGxldCBrZXk7XHJcbiAgICAgIGlmICh0eXBlb2YobW9kKSA9PT0gJ29iamVjdCcgJiYgbW9kICE9PSBudWxsKSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZC5uYW1lO1xyXG4gICAgICAgIGtleSA9IG1vZC5pZDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuYW1lID0gbW9kO1xyXG4gICAgICAgIGtleSA9IG1vZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgTE9FbnRyeSA9IHV0aWwuZ2V0U2FmZShsb2FkT3JkZXIsIFtrZXldLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgcHJpb3JpdHlNYW5hZ2VyLnJlc2V0TWF4UHJpb3JpdHkodG90YWxMb2NrZWQubGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgICBfSU5JX1NUUlVDVFtuYW1lXSA9IHtcclxuICAgICAgICAvLyBUaGUgSU5JIGZpbGUncyBlbmFibGVkIGF0dHJpYnV0ZSBleHBlY3RzIDEgb3IgMFxyXG4gICAgICAgIEVuYWJsZWQ6IChMT0VudHJ5ICE9PSB1bmRlZmluZWQpID8gTE9FbnRyeS5lbmFibGVkID8gMSA6IDAgOiAxLFxyXG4gICAgICAgIFByaW9yaXR5OiB0b3RhbExvY2tlZC5pbmNsdWRlcyhuYW1lKVxyXG4gICAgICAgICAgPyB0b3RhbExvY2tlZC5pbmRleE9mKG5hbWUpXHJcbiAgICAgICAgICA6IHByaW9yaXR5TWFuYWdlci5nZXRQcmlvcml0eSh7IGlkOiBrZXkgfSksXHJcbiAgICAgICAgVks6IGtleSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xvY2tlZEVudHJ5KG1vZE5hbWU6IHN0cmluZykge1xyXG4gIC8vIFdlJ3JlIGFkZGluZyB0aGlzIHRvIGF2b2lkIGhhdmluZyB0aGUgbG9hZCBvcmRlciBwYWdlXHJcbiAgLy8gIGZyb20gbm90IGxvYWRpbmcgaWYgd2UgZW5jb3VudGVyIGFuIGludmFsaWQgbW9kIG5hbWUuXHJcbiAgaWYgKCFtb2ROYW1lIHx8IHR5cGVvZihtb2ROYW1lKSAhPT0gJ3N0cmluZycpIHtcclxuICAgIGxvZygnZGVidWcnLCAnZW5jb3VudGVyZWQgaW52YWxpZCBtb2QgaW5zdGFuY2UvbmFtZScpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICByZXR1cm4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbi8vIGl0ZW06IElMb2FkT3JkZXJEaXNwbGF5SXRlbVxyXG5mdW5jdGlvbiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRGlzcGxheUl0ZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBtaW5Qcmlvcml0eTogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgb25TZXRQcmlvcml0eTogKGtleTogc3RyaW5nLCBwcmlvcml0eTogbnVtYmVyKSA9PiB2b2lkKSB7XHJcbiAgY29uc3QgcHJpb3JpdHlJbnB1dERpYWxvZyA9ICgpID0+IHtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoKHJlc29sdmUpID0+IHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmlvcml0eScsIHtcclxuICAgICAgICB0ZXh0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0luc2VydCBuZXcgbnVtZXJpY2FsIHByaW9yaXR5IGZvciB7e2l0ZW1OYW1lfX0gaW4gdGhlIGlucHV0IGJveDonLCB7IHJlcGxhY2U6IHsgaXRlbU5hbWU6IGl0ZW0ubmFtZSB9IH0pLFxyXG4gICAgICAgIGlucHV0OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAndzNQcmlvcml0eUlucHV0JyxcclxuICAgICAgICAgICAgbGFiZWw6ICdQcmlvcml0eScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogX0lOSV9TVFJVQ1RbaXRlbS5pZF0/LlByaW9yaXR5IHx8IDAsXHJcbiAgICAgICAgICB9XSxcclxuICAgICAgfSwgWyB7IGxhYmVsOiAnQ2FuY2VsJyB9LCB7IGxhYmVsOiAnU2V0JywgZGVmYXVsdDogdHJ1ZSB9IF0pXHJcbiAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdTZXQnKSB7XHJcbiAgICAgICAgICBjb25zdCBpdGVtS2V5ID0gT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLmZpbmQoa2V5ID0+IF9JTklfU1RSVUNUW2tleV0uVksgPT09IGl0ZW0uaWQpO1xyXG4gICAgICAgICAgY29uc3Qgd2FudGVkUHJpb3JpdHkgPSByZXN1bHQuaW5wdXRbJ3czUHJpb3JpdHlJbnB1dCddO1xyXG4gICAgICAgICAgaWYgKHdhbnRlZFByaW9yaXR5IDw9IG1pblByaW9yaXR5KSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignQ2hvc2VuIHByaW9yaXR5IGlzIGFscmVhZHkgYXNzaWduZWQgdG8gYSBsb2NrZWQgZW50cnknLFxyXG4gICAgICAgICAgICAgIHdhbnRlZFByaW9yaXR5LnRvU3RyaW5nKCksIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGl0ZW1LZXkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBfSU5JX1NUUlVDVFtpdGVtS2V5XS5Qcmlvcml0eSA9IHBhcnNlSW50KHdhbnRlZFByaW9yaXR5LCAxMCk7XHJcbiAgICAgICAgICAgIG9uU2V0UHJpb3JpdHkoaXRlbUtleSwgd2FudGVkUHJpb3JpdHkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gc2V0IHByaW9yaXR5IC0gbW9kIGlzIG5vdCBpbiBpbmkgc3RydWN0JywgeyBtb2RJZDogaXRlbS5pZCB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIGNvbnN0IGl0ZW1BY3Rpb25zID0gW1xyXG4gICAge1xyXG4gICAgICBzaG93OiBpdGVtLmxvY2tlZCAhPT0gdHJ1ZSxcclxuICAgICAgdGl0bGU6ICdTZXQgTWFudWFsIFByaW9yaXR5JyxcclxuICAgICAgYWN0aW9uOiAoKSA9PiBwcmlvcml0eUlucHV0RGlhbG9nKCksXHJcbiAgICB9LFxyXG4gIF07XHJcblxyXG4gIHJldHVybiBpdGVtQWN0aW9ucztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBwcmlvcml0eU1hbmFnZXIpOiBQcm9taXNlPGFueVtdPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgeyBnZXRQcmlvcml0eSwgcmVzZXRNYXhQcmlvcml0eSB9ID0gcHJpb3JpdHlNYW5hZ2VyO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBXaGF0IGFuIG9kZCB1c2UgY2FzZSAtIHBlcmhhcHMgdGhlIHVzZXIgaGFkIHN3aXRjaGVkIGdhbWVNb2RlcyBvclxyXG4gICAgLy8gIGV2ZW4gZGVsZXRlZCBoaXMgcHJvZmlsZSBkdXJpbmcgdGhlIHByZS1zb3J0IGZ1bmN0aW9uYWxpdHkgP1xyXG4gICAgLy8gIE9kZCBidXQgcGxhdXNpYmxlIEkgc3VwcG9zZSA/XHJcbiAgICBsb2coJ3dhcm4nLCAnW1czXSB1bmFibGUgdG8gcHJlc29ydCBkdWUgdG8gbm8gYWN0aXZlIHByb2ZpbGUnKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgbGV0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgY29uc3Qgb25TZXRQcmlvcml0eSA9IChpdGVtS2V5LCB3YW50ZWRQcmlvcml0eSkgPT4ge1xyXG4gICAgcmV0dXJuIHdyaXRlVG9Nb2RTZXR0aW5ncygpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICB3YW50ZWRQcmlvcml0eSA9ICt3YW50ZWRQcmlvcml0eTtcclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgICBjb25zdCBtb2RJZCA9IF9JTklfU1RSVUNUW2l0ZW1LZXldLlZLO1xyXG4gICAgICAgIGNvbnN0IGxvRW50cnkgPSBsb2FkT3JkZXJbbW9kSWRdO1xyXG4gICAgICAgIGlmIChwcmlvcml0eU1hbmFnZXIucHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnKSB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlckVudHJ5KFxyXG4gICAgICAgICAgICBhY3RpdmVQcm9maWxlLmlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgICAgIC4uLmxvRW50cnksXHJcbiAgICAgICAgICAgICAgcG9zOiAobG9FbnRyeS5wb3MgPCB3YW50ZWRQcmlvcml0eSkgPyB3YW50ZWRQcmlvcml0eSA6IHdhbnRlZFByaW9yaXR5IC0gMixcclxuICAgICAgICAgIH0pKTtcclxuICAgICAgICAgIGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyRW50cnkoXHJcbiAgICAgICAgICAgIGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB7XHJcbiAgICAgICAgICAgICAgLi4ubG9FbnRyeSxcclxuICAgICAgICAgICAgICBwcmVmaXg6IHBhcnNlSW50KF9JTklfU1RSVUNUW2l0ZW1LZXldLlByaW9yaXR5LCAxMCksXHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWZyZXNoRnVuYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICByZWZyZXNoRnVuYygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gIH07XHJcbiAgY29uc3QgYWxsTW9kcyA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dCk7XHJcbiAgaWYgKChhbGxNb2RzLm1lcmdlZC5sZW5ndGggPT09IDApICYmIChhbGxNb2RzLm1hbnVhbC5sZW5ndGggPT09IDApKSB7XHJcbiAgICBpdGVtcy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgcmVzZXRNYXhQcmlvcml0eSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uaXRlbSxcclxuICAgICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCAwLCBvblNldFByaW9yaXR5KSxcclxuICAgICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2NrZWRNb2RzID0gW10uY29uY2F0KGFsbE1vZHMubWFudWFsLmZpbHRlcihpc0xvY2tlZEVudHJ5KSxcclxuICAgIGFsbE1vZHMubWFuYWdlZC5maWx0ZXIoZW50cnkgPT4gaXNMb2NrZWRFbnRyeShlbnRyeS5uYW1lKSlcclxuICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSkpO1xyXG4gIGNvbnN0IHJlYWRhYmxlTmFtZXMgPSB7XHJcbiAgICBbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCcsXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbG9ja2VkRW50cmllcyA9IFtdLmNvbmNhdChhbGxNb2RzLm1lcmdlZCwgbG9ja2VkTW9kcylcclxuICAgIC5yZWR1Y2UoKGFjY3VtLCBtb2ROYW1lLCBpZHgpID0+IHtcclxuICAgICAgY29uc3Qgb2JqID0ge1xyXG4gICAgICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgICAgIG5hbWU6ICEhcmVhZGFibGVOYW1lc1ttb2ROYW1lXSA/IHJlYWRhYmxlTmFtZXNbbW9kTmFtZV0gOiBtb2ROYW1lLFxyXG4gICAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgICAgIHByZWZpeDogaWR4ICsgMSxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICghYWNjdW0uZmluZChhY2MgPT4gb2JqLmlkID09PSBhY2MuaWQpKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChvYmopO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcblxyXG4gIGl0ZW1zID0gaXRlbXMuZmlsdGVyKGl0ZW0gPT4gIWFsbE1vZHMubWVyZ2VkLmluY2x1ZGVzKGl0ZW0uaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhYWxsTW9kcy5tYW51YWwuaW5jbHVkZXMoaXRlbS5pZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFhbGxNb2RzLm1hbmFnZWQuZmluZChtb2QgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChtb2QubmFtZSA9PT0gVU5JX1BBVENIKSAmJiAobW9kLmlkID09PSBpdGVtLmlkKSkpXHJcbiAgICAgICAgICAgICAgIC5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICByZXNldE1heFByaW9yaXR5KGxvY2tlZEVudHJpZXMubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLml0ZW0sXHJcbiAgICAgIGNvbnRleHRNZW51QWN0aW9uczogZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQsIGl0ZW0sIGxvY2tlZEVudHJpZXMubGVuZ3RoLCBvblNldFByaW9yaXR5KSxcclxuICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IG1hbnVhbEVudHJpZXMgPSBhbGxNb2RzLm1hbnVhbFxyXG4gICAgLmZpbHRlcihrZXkgPT4gbG9ja2VkRW50cmllcy5maW5kKGVudHJ5ID0+IGVudHJ5LmlkID09PSBrZXkpID09PSB1bmRlZmluZWQpXHJcbiAgICAubWFwKGtleSA9PiB7XHJcbiAgICAgIGNvbnN0IGl0ZW0gPSB7XHJcbiAgICAgICAgaWQ6IGtleSxcclxuICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgICBleHRlcm5hbDogdHJ1ZSxcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5pdGVtLFxyXG4gICAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXHJcbiAgICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgbG9ja2VkRW50cmllcy5sZW5ndGgsIG9uU2V0UHJpb3JpdHkpLFxyXG4gICAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKTtcclxuICBjb25zdCBrbm93bk1hbnVhbGx5QWRkZWQgPSBtYW51YWxFbnRyaWVzLmZpbHRlcihlbnRyeSA9PiBrZXlzLmluY2x1ZGVzKGVudHJ5LmlkKSkgfHwgW107XHJcbiAgY29uc3QgdW5rbm93bk1hbnVhbGx5QWRkZWQgPSBtYW51YWxFbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAha2V5cy5pbmNsdWRlcyhlbnRyeS5pZCkpIHx8IFtdO1xyXG4gIGNvbnN0IGZpbHRlcmVkT3JkZXIgPSBrZXlzXHJcbiAgICAuZmlsdGVyKGtleSA9PiBsb2NrZWRFbnRyaWVzLmZpbmQoaXRlbSA9PiBpdGVtLmlkID09PSBrZXkpID09PSB1bmRlZmluZWQpXHJcbiAgICAucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XHJcbiAgICAgIGFjY3VtW2tleV0gPSBsb2FkT3JkZXJba2V5XTtcclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG4gIGtub3duTWFudWFsbHlBZGRlZC5mb3JFYWNoKGtub3duID0+IHtcclxuICAgIGNvbnN0IGRpZmYgPSBrZXlzLmxlbmd0aCAtIE9iamVjdC5rZXlzKGZpbHRlcmVkT3JkZXIpLmxlbmd0aDtcclxuXHJcbiAgICBjb25zdCBwb3MgPSBmaWx0ZXJlZE9yZGVyW2tub3duLmlkXS5wb3MgLSBkaWZmO1xyXG4gICAgaXRlbXMgPSBbXS5jb25jYXQoaXRlbXMuc2xpY2UoMCwgcG9zKSB8fCBbXSwga25vd24sIGl0ZW1zLnNsaWNlKHBvcykgfHwgW10pO1xyXG4gIH0pO1xyXG5cclxuICBsZXQgcHJlU29ydGVkID0gW10uY29uY2F0KFxyXG4gICAgLi4ubG9ja2VkRW50cmllcyxcclxuICAgIGl0ZW1zLmZpbHRlcihpdGVtID0+IHtcclxuICAgICAgaWYgKHR5cGVvZihpdGVtPy5uYW1lKSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgaXNMb2NrZWQgPSBsb2NrZWRFbnRyaWVzLmZpbmQobG9ja2VkID0+IGxvY2tlZC5uYW1lID09PSBpdGVtLm5hbWUpICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnN0IGRvTm90RGlzcGxheSA9IERPX05PVF9ESVNQTEFZLmluY2x1ZGVzKGl0ZW0ubmFtZS50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgcmV0dXJuICFpc0xvY2tlZCAmJiAhZG9Ob3REaXNwbGF5O1xyXG4gICAgfSksXHJcbiAgICAuLi51bmtub3duTWFudWFsbHlBZGRlZCk7XHJcblxyXG4gIHByZVNvcnRlZCA9ICh1cGRhdGVUeXBlICE9PSAnZHJhZy1uLWRyb3AnKVxyXG4gICAgPyBwcmVTb3J0ZWQuc29ydCgobGhzLCByaHMpID0+IGxocy5wcmVmaXggLSByaHMucHJlZml4KVxyXG4gICAgOiBwcmVTb3J0ZWQucmVkdWNlKChhY2N1bSwgZW50cnksIGlkeCkgPT4ge1xyXG4gICAgICAgIGlmIChsb2NrZWRFbnRyaWVzLmluZGV4T2YoZW50cnkpICE9PSAtMSB8fCBpZHggPT09IDApIHtcclxuICAgICAgICAgIGFjY3VtLnB1c2goZW50cnkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBwcmV2UHJlZml4ID0gcGFyc2VJbnQoYWNjdW1baWR4IC0gMV0ucHJlZml4LCAxMCk7XHJcbiAgICAgICAgICBpZiAocHJldlByZWZpeCA+PSBlbnRyeS5wcmVmaXgpIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgLi4uZW50cnksXHJcbiAgICAgICAgICAgICAgZXh0ZXJuYWw6ICgoZW50cnkuZXh0ZXJuYWwgPT09IHRydWUpICYmIChhbGxNb2RzLm1hbmFnZWQuZmluZChtYW4gPT4gbWFuLm5hbWUgPT09IGVudHJ5Lm5hbWUpKSlcclxuICAgICAgICAgICAgICAgID8gZmFsc2UgOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHByZWZpeDogcHJldlByZWZpeCArIDEsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE1vZEZvbGRlcihpbnN0YWxsYXRpb25QYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIGlmICghaW5zdGFsbGF0aW9uUGF0aCB8fCAhbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XHJcbiAgICBjb25zdCBlcnJNZXNzYWdlID0gIWluc3RhbGxhdGlvblBhdGhcclxuICAgICAgPyAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCdcclxuICAgICAgOiAnRmFpbGVkIHRvIHJlc29sdmUgbW9kIGluc3RhbGxhdGlvbiBwYXRoJztcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKGVyck1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uID0gWyd3aXRjaGVyM21lbnVtb2Ryb290JywgJ3dpdGNoZXIzdGwnXS5pbmNsdWRlcyhtb2QudHlwZSlcclxuICAgID8gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCAnTW9kcycpXHJcbiAgICA6IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhleHBlY3RlZE1vZE5hbWVMb2NhdGlvbilcclxuICAgIC50aGVuKGVudHJpZXMgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXNbMF0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQ6IHR5cGVzLklDb21wb25lbnRDb250ZXh0LCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcclxuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKG1vZHMsIChhY2N1bSwgbW9kKSA9PiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGgsIG1vZClcclxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xyXG4gICAgICBpZiAoIW1vZE5hbWUgfHwgWydjb2xsZWN0aW9uJywgJ3czbW9kbGltaXRwYXRjaGVyJ10uaW5jbHVkZXMobW9kLnR5cGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbW9kQ29tcG9uZW50cyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdtb2RDb21wb25lbnRzJ10sIFtdKTtcclxuICAgICAgaWYgKG1vZENvbXBvbmVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgbW9kQ29tcG9uZW50cy5wdXNoKG1vZE5hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIFsuLi5tb2RDb21wb25lbnRzXS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgICBpZDogbW9kLmlkLFxyXG4gICAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHJlc29sdmUgbW9kIG5hbWUnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH0pLCBbXSk7XHJcbn1cclxuXHJcbmNvbnN0IHRvZ2dsZU1vZHNTdGF0ZSA9IGFzeW5jIChjb250ZXh0LCBwcm9wcywgZW5hYmxlZCkgPT4ge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgY29uc3QgbW9kTWFwID0gYXdhaXQgZ2V0QWxsTW9kcyhjb250ZXh0KTtcclxuICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihtb2ROYW1lID0+IG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSk7XHJcbiAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkKTtcclxuICBjb25zdCBuZXdMTyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XHJcbiAgICBpZiAodG90YWxMb2NrZWQuaW5jbHVkZXMoa2V5KSkge1xyXG4gICAgICBhY2N1bVtrZXldID0gbG9hZE9yZGVyW2tleV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhY2N1bVtrZXldID0ge1xyXG4gICAgICAgIC4uLmxvYWRPcmRlcltrZXldLFxyXG4gICAgICAgIGVuYWJsZWQsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIG5ld0xPIGFzIGFueSkpO1xyXG4gIHByb3BzLnJlZnJlc2goKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpOiBKU1guRWxlbWVudCB7XHJcbiAgY29uc3QgdCA9IGNvbnRleHQuYXBpLnRyYW5zbGF0ZTtcclxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2xvYWRvcmRlcmluZm8nIH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LCB0KCdNYW5hZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwgeyBzdHlsZTogeyBoZWlnaHQ6ICczMCUnIH0gfSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdZb3UgY2FuIGFkanVzdCB0aGUgbG9hZCBvcmRlciBmb3IgVGhlIFdpdGNoZXIgMyBieSBkcmFnZ2luZyBhbmQgZHJvcHBpbmcgJ1xyXG4gICAgICArICdtb2RzIHVwIG9yIGRvd24gb24gdGhpcyBwYWdlLiAgSWYgeW91IGFyZSB1c2luZyBzZXZlcmFsIG1vZHMgdGhhdCBhZGQgc2NyaXB0cyB5b3UgbWF5IG5lZWQgdG8gdXNlICdcclxuICAgICAgKyAndGhlIFdpdGNoZXIgMyBTY3JpcHQgbWVyZ2VyLiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBzZWU6ICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYScsIHsgb25DbGljazogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Nb2RkaW5nX1RoZV9XaXRjaGVyXzNfd2l0aF9Wb3J0ZXgnKSB9LCB0KCdNb2RkaW5nIFRoZSBXaXRjaGVyIDMgd2l0aCBWb3J0ZXguJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xyXG4gICAgICBzdHlsZTogeyBoZWlnaHQ6ICc4MCUnIH0sXHJcbiAgICB9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1BsZWFzZSBub3RlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdGb3IgV2l0Y2hlciAzLCB0aGUgbW9kIHdpdGggdGhlIGxvd2VzdCBpbmRleCBudW1iZXIgKGJ5IGRlZmF1bHQsIHRoZSBtb2Qgc29ydGVkIGF0IHRoZSB0b3ApIG92ZXJyaWRlcyBtb2RzIHdpdGggYSBoaWdoZXIgaW5kZXggbnVtYmVyLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdZb3UgYXJlIGFibGUgdG8gbW9kaWZ5IHRoZSBwcmlvcml0eSBtYW51YWxseSBieSByaWdodCBjbGlja2luZyBhbnkgTE8gZW50cnkgYW5kIHNldCB0aGUgbW9kXFwncyBwcmlvcml0eScsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdJZiB5b3UgY2Fubm90IHNlZSB5b3VyIG1vZCBpbiB0aGlzIGxvYWQgb3JkZXIsIHlvdSBtYXkgbmVlZCB0byBhZGQgaXQgbWFudWFsbHkgKHNlZSBvdXIgd2lraSBmb3IgZGV0YWlscykuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1doZW4gbWFuYWdpbmcgbWVudSBtb2RzLCBtb2Qgc2V0dGluZ3MgY2hhbmdlZCBpbnNpZGUgdGhlIGdhbWUgd2lsbCBiZSBkZXRlY3RlZCBieSBWb3J0ZXggYXMgZXh0ZXJuYWwgY2hhbmdlcyAtIHRoYXQgaXMgZXhwZWN0ZWQsICdcclxuICAgICAgICAgICsgJ2Nob29zZSB0byB1c2UgdGhlIG5ld2VyIGZpbGUgYW5kIHlvdXIgc2V0dGluZ3Mgd2lsbCBiZSBtYWRlIHBlcnNpc3RlbnQuJyxcclxuICAgICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdZb3UgY2FuIGNoYW5nZSB0aGUgd2F5IHRoZSBwcmlvcml0aWVzIGFyZSBhc3NnaW5lZCB1c2luZyB0aGUgXCJTd2l0Y2ggVG8gUG9zaXRpb24vUHJlZml4IGJhc2VkXCIgYnV0dG9uLiAnXHJcbiAgICAgICAgICArICdQcmVmaXggYmFzZWQgaXMgbGVzcyByZXN0cmljdGl2ZSBhbmQgYWxsb3dzIHlvdSB0byBzZXQgYW55IHByaW9yaXR5IHZhbHVlIHlvdSB3YW50IFwiNTAwMCwgNjk5OTksIGV0Y1wiIHdoaWxlIHBvc2l0aW9uIGJhc2VkIHdpbGwgJ1xyXG4gICAgICAgICAgKyAncmVzdHJpY3QgdGhlIHByaW9yaXRpZXMgdG8gdGhlIG51bWJlciBvZiBsb2FkIG9yZGVyIGVudHJpZXMgdGhhdCBhcmUgYXZhaWxhYmxlLicsXHJcbiAgICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnTWVyZ2VzIGdlbmVyYXRlZCBieSB0aGUgV2l0Y2hlciAzIFNjcmlwdCBtZXJnZXIgbXVzdCBiZSBsb2FkZWQgZmlyc3QgYW5kIGFyZSBsb2NrZWQgaW4gdGhlIGZpcnN0IGxvYWQgb3JkZXIgc2xvdC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuQnV0dG9uLCB7XHJcbiAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB0b2dnbGVNb2RzU3RhdGUoY29udGV4dCwgcHJvcHMsIGZhbHNlKSxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzVweCcsXHJcbiAgICAgICAgICAgIHdpZHRoOiAnbWluLWNvbnRlbnQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LCB0KCdEaXNhYmxlIEFsbCcpKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdicicpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuQnV0dG9uLCB7XHJcbiAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB0b2dnbGVNb2RzU3RhdGUoY29udGV4dCwgcHJvcHMsIHRydWUpLFxyXG4gICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnNXB4JyxcclxuICAgICAgICAgICAgd2lkdGg6ICdtaW4tY29udGVudCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sIHQoJ0VuYWJsZSBBbGwgJykpLCBbXSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBxdWVyeVNjcmlwdE1lcmdlKGNvbnRleHQsIHJlYXNvbikge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6ICd3aXRjaGVyMy1tZXJnZScsXHJcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgbWVzc2FnZTogY29udGV4dC5hcGkudHJhbnNsYXRlKCdXaXRjaGVyIFNjcmlwdCBtZXJnZXIgbWF5IG5lZWQgdG8gYmUgZXhlY3V0ZWQnLFxyXG4gICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMycsIHtcclxuICAgICAgICAgICAgICB0ZXh0OiByZWFzb24sXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnUnVuIHRvb2wnLFxyXG4gICAgICAgICAgYWN0aW9uOiBkaXNtaXNzID0+IHtcclxuICAgICAgICAgICAgcnVuU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoY29udGV4dC5hcGkpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY2FuTWVyZ2UoZ2FtZSwgZ2FtZURpc2NvdmVyeSkge1xyXG4gIGlmIChnYW1lLmlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuICh7XHJcbiAgICBiYXNlRmlsZXM6ICgpID0+IFtcclxuICAgICAge1xyXG4gICAgICAgIGluOiBwYXRoLmpvaW4oZ2FtZURpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gICAgICAgIG91dDogcGF0aC5qb2luKENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBmaWxlUGF0aC5lbmRzV2l0aChJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkSW5wdXRGaWxlKGNvbnRleHQsIG1lcmdlRGlyKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3QgZ2FtZUlucHV0RmlsZXBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSk7XHJcbiAgcmV0dXJuICghIWRpc2NvdmVyeT8ucGF0aClcclxuICAgID8gZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4obWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSkpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICA/IGZzLnJlYWRGaWxlQXN5bmMoZ2FtZUlucHV0RmlsZXBhdGgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgOiBQcm9taXNlLnJlamVjdCh7IGNvZGU6ICdFTk9FTlQnLCBtZXNzYWdlOiAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcgfSk7XHJcbn1cclxuXHJcbmNvbnN0IGVtcHR5WG1sID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PjxtZXRhZGF0YT48L21ldGFkYXRhPic7XHJcbmZ1bmN0aW9uIG1lcmdlKGZpbGVQYXRoLCBtZXJnZURpciwgY29udGV4dCkge1xyXG4gIGxldCBtb2REYXRhO1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgLnRoZW4oYXN5bmMgeG1sRGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbW9kRGF0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIFRoZSBtb2QgaXRzZWxmIGhhcyBpbnZhbGlkIHhtbCBkYXRhLlxyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBtb2QgWE1MIGRhdGEgLSBpbmZvcm0gbW9kIGF1dGhvcicsXHJcbiAgICAgICAgeyBwYXRoOiBmaWxlUGF0aCwgZXJyb3I6IGVyci5tZXNzYWdlIH0sIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgIG1vZERhdGEgPSBlbXB0eVhtbDtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAudGhlbigoKSA9PiByZWFkSW5wdXRGaWxlKGNvbnRleHQsIG1lcmdlRGlyKSlcclxuICAgIC50aGVuKGFzeW5jIG1lcmdlZERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG1lcmdlZCA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShtZXJnZWREYXRhKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlZCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIG1lcmdlZCBmaWxlIC0gaWYgaXQncyBpbnZhbGlkIGNoYW5jZXMgYXJlIHdlIG1lc3NlZCB1cFxyXG4gICAgICAgIC8vICBzb21laG93LCByZWFzb24gd2h5IHdlJ3JlIGdvaW5nIHRvIGFsbG93IHRoaXMgZXJyb3IgdG8gZ2V0IHJlcG9ydGVkLlxyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIG1lcmdlZCBYTUwgZGF0YScsIGVyciwge1xyXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXHJcbiAgICAgICAgICBhdHRhY2htZW50czogW1xyXG4gICAgICAgICAgICB7IGlkOiAnX19tZXJnZWQvaW5wdXQueG1sJywgdHlwZTogJ2RhdGEnLCBkYXRhOiBtZXJnZWREYXRhLFxyXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2l0Y2hlciAzIG1lbnUgbW9kIG1lcmdlZCBkYXRhJyB9LFxyXG4gICAgICAgICAgICB7IGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9sb2FkT3JkZXJgLCB0eXBlOiAnZGF0YScsIGRhdGE6IGxvYWRPcmRlcixcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcicgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdJbnZhbGlkIG1lcmdlZCBYTUwgZGF0YScpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC50aGVuKGdhbWVJbmRleEZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBtb2RHcm91cHMgPSBtb2REYXRhPy5Vc2VyQ29uZmlnPy5Hcm91cDtcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RHcm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBnYW1lR3JvdXBzID0gZ2FtZUluZGV4RmlsZT8uVXNlckNvbmZpZz8uR3JvdXA7XHJcbiAgICAgICAgY29uc3QgaXRlciA9IG1vZEdyb3Vwc1tpXTtcclxuICAgICAgICBjb25zdCBtb2RWYXJzID0gaXRlcj8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xyXG4gICAgICAgIGNvbnN0IGdhbWVHcm91cElkeCA9IGdhbWVHcm91cHMuZmluZEluZGV4KGdyb3VwID0+IGdyb3VwPy4kPy5pZCA9PT0gaXRlcj8uJD8uaWQpO1xyXG4gICAgICAgIGlmIChnYW1lR3JvdXBJZHggIT09IC0xKSB7XHJcbiAgICAgICAgICBjb25zdCBnYW1lR3JvdXAgPSBnYW1lR3JvdXBzW2dhbWVHcm91cElkeF07XHJcbiAgICAgICAgICBjb25zdCBnYW1lVmFycyA9IGdhbWVHcm91cD8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xyXG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBtb2RWYXJzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1vZFZhciA9IG1vZFZhcnNbal07XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gbW9kVmFyPy4kPy5pZDtcclxuICAgICAgICAgICAgY29uc3QgZ2FtZVZhcklkeCA9IGdhbWVWYXJzLmZpbmRJbmRleCh2ID0+IHY/LiQ/LmlkID09PSBpZCk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lVmFySWR4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgIGdhbWVJbmRleEZpbGUuVXNlckNvbmZpZy5Hcm91cFtnYW1lR3JvdXBJZHhdLlZpc2libGVWYXJzWzBdLlZhcltnYW1lVmFySWR4XSA9IG1vZFZhcjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBnYW1lSW5kZXhGaWxlLlVzZXJDb25maWcuR3JvdXBbZ2FtZUdyb3VwSWR4XS5WaXNpYmxlVmFyc1swXS5WYXIucHVzaChtb2RWYXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGdhbWVJbmRleEZpbGUuVXNlckNvbmZpZy5Hcm91cC5wdXNoKG1vZEdyb3Vwc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gICAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGdhbWVJbmRleEZpbGUpO1xyXG4gICAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMoXHJcbiAgICAgICAgcGF0aC5qb2luKG1lcmdlRGlyLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gICAgICAgIHhtbCk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnaW5wdXQueG1sIG1lcmdlIGZhaWxlZCcsIGVycik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jb25zdCBTQ1JJUFRfTUVSR0VSX0ZJTEVTID0gWydXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZSddO1xyXG5mdW5jdGlvbiBzY3JpcHRNZXJnZXJUZXN0KGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBtYXRjaGVyID0gKGZpbGUgPT4gU0NSSVBUX01FUkdFUl9GSUxFUy5pbmNsdWRlcyhmaWxlKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpICYmIChmaWxlcy5maWx0ZXIobWF0Y2hlcikubGVuZ3RoID4gMCkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBTQ1JJUFRfTUVSR0VSX0ZJTEVTIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsIGVyck1lc3NhZ2UpIHtcclxuICBsZXQgYWxsb3dSZXBvcnQgPSB0cnVlO1xyXG4gIGNvbnN0IHVzZXJDYW5jZWxlZCA9IGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkO1xyXG4gIGlmICh1c2VyQ2FuY2VsZWQpIHtcclxuICAgIGFsbG93UmVwb3J0ID0gZmFsc2U7XHJcbiAgfVxyXG4gIGNvbnN0IGJ1c3lSZXNvdXJjZSA9IGVyciBpbnN0YW5jZW9mIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3I7XHJcbiAgaWYgKGFsbG93UmVwb3J0ICYmIGJ1c3lSZXNvdXJjZSkge1xyXG4gICAgYWxsb3dSZXBvcnQgPSBlcnIuYWxsb3dSZXBvcnQ7XHJcbiAgICBlcnIubWVzc2FnZSA9IGVyci5lcnJvck1lc3NhZ2U7XHJcbiAgfVxyXG5cclxuICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gIHJldHVybjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIoY29udGV4dCwgZmlsZXMpIHtcclxuICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTW9kJywgJ0l0IGxvb2tzIGxpa2UgeW91IHRyaWVkIHRvIGluc3RhbGwgJ1xyXG4gICAgKyAnVGhlIFdpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyLCB3aGljaCBpcyBhIHRvb2wgYW5kIG5vdCBhIG1vZCBmb3IgVGhlIFdpdGNoZXIgMy5cXG5cXG4nXHJcbiAgICArICdUaGUgc2NyaXB0IG1lcmdlciBzaG91bGRcXCd2ZSBiZWVuIGluc3RhbGxlZCBhdXRvbWF0aWNhbGx5IGJ5IFZvcnRleCBhcyBzb29uIGFzIHlvdSBhY3RpdmF0ZWQgdGhpcyBleHRlbnNpb24uICdcclxuICAgICsgJ0lmIHRoZSBkb3dubG9hZCBvciBpbnN0YWxsYXRpb24gaGFzIGZhaWxlZCBmb3IgYW55IHJlYXNvbiAtIHBsZWFzZSBsZXQgdXMga25vdyB3aHksIGJ5IHJlcG9ydGluZyB0aGUgZXJyb3IgdGhyb3VnaCAnXHJcbiAgICArICdvdXIgZmVlZGJhY2sgc3lzdGVtIGFuZCBtYWtlIHN1cmUgdG8gaW5jbHVkZSB2b3J0ZXggbG9ncy4gUGxlYXNlIG5vdGU6IGlmIHlvdVxcJ3ZlIGluc3RhbGxlZCAnXHJcbiAgICArICd0aGUgc2NyaXB0IG1lcmdlciBpbiBwcmV2aW91cyB2ZXJzaW9ucyBvZiBWb3J0ZXggYXMgYSBtb2QgYW5kIFNUSUxMIGhhdmUgaXQgaW5zdGFsbGVkICdcclxuICAgICsgJyhpdFxcJ3MgcHJlc2VudCBpbiB5b3VyIG1vZCBsaXN0KSAtIHlvdSBzaG91bGQgY29uc2lkZXIgdW4taW5zdGFsbGluZyBpdCBmb2xsb3dlZCBieSBhIFZvcnRleCByZXN0YXJ0OyAnXHJcbiAgICArICd0aGUgYXV0b21hdGljIG1lcmdlciBpbnN0YWxsZXIvdXBkYXRlciBzaG91bGQgdGhlbiBraWNrIG9mZiBhbmQgc2V0IHVwIHRoZSB0b29sIGZvciB5b3UuJyxcclxuICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0ludmFsaWQgbW9kJykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJ10sIFczUmVkdWNlcik7XHJcbiAgbGV0IHByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xyXG4gIGxldCBtb2RMaW1pdFBhdGNoZXI6IE1vZExpbWl0UGF0Y2hlcjtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdNb2RzJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxyXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMjkyMDMwJyxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IDI5MjAzMCxcclxuICAgICAgaWdub3JlQ29uZmxpY3RzOiBET19OT1RfREVQTE9ZLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBnZXRETENQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJyk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZ2V0VExQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaXNUVzMgPSAoZ2FtZUlkID0gdW5kZWZpbmVkKSA9PiB7XHJcbiAgICBpZiAoZ2FtZUlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIChnYW1lSWQgPT09IEdBTUVfSUQpO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gIH07XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzdGwnLCAyNSwgdG9CbHVlKHRlc3RTdXBwb3J0ZWRUTCksIHRvQmx1ZShpbnN0YWxsVEwpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21peGVkJywgMzAsIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkTWl4ZWQpLCB0b0JsdWUoaW5zdGFsbE1peGVkKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNjb250ZW50JywgNTAsXHJcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsXHJcbiAgICB0b0JsdWUodGVzdE1lbnVNb2RSb290IGFzIGFueSksIHRvQmx1ZShpbnN0YWxsTWVudU1vZCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NjcmlwdG1lcmdlcmR1bW15JywgMTUsXHJcbiAgICB0b0JsdWUoc2NyaXB0TWVyZ2VyVGVzdCksIHRvQmx1ZSgoZmlsZXMpID0+IHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyKGNvbnRleHQsIGZpbGVzKSkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjN0bCcsIDI1LCBpc1RXMywgZ2V0VExQYXRoLCB0b0JsdWUodGVzdFRMKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzZGxjJywgMjUsIGlzVFczLCBnZXRETENQYXRoLCB0b0JsdWUodGVzdERMQykpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsXHJcbiAgICBpc1RXMywgZ2V0VExQYXRoLCB0b0JsdWUodGVzdE1lbnVNb2RSb290IGFzIGFueSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMsXHJcbiAgICAoZ2FtZSkgPT4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnZG9jdW1lbnRzJyksICdUaGUgV2l0Y2hlciAzJyksXHJcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3M21vZGxpbWl0cGF0Y2hlcicsIDI1LCBpc1RXMywgZ2V0VExQYXRoLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSxcclxuICAgIHsgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UsIG5hbWU6ICdNb2QgTGltaXQgUGF0Y2hlciBNb2QgVHlwZScgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNZXJnZShjYW5NZXJnZSxcclxuICAgIChmaWxlUGF0aCwgbWVyZ2VEaXIpID0+IG1lcmdlKGZpbGVQYXRoLCBtZXJnZURpciwgY29udGV4dCksICd3aXRjaGVyM21lbnVtb2Ryb290Jyk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24oKG9sZFZlcnNpb24pID0+IChtaWdyYXRlMTQ4KGNvbnRleHQsIG9sZFZlcnNpb24pIGFzIGFueSkpO1xyXG5cclxuICByZWdpc3RlckFjdGlvbnMoe1xyXG4gICAgY29udGV4dCxcclxuICAgIHJlZnJlc2hGdW5jLFxyXG4gICAgZ2V0UHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBwcmlvcml0eU1hbmFnZXIsXHJcbiAgICBnZXRNb2RMaW1pdFBhdGNoZXI6ICgpID0+IG1vZExpbWl0UGF0Y2hlcixcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5vcHRpb25hbC5yZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlKFxyXG4gICAgJ3dpdGNoZXIzX2NvbGxlY3Rpb25fZGF0YScsXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10sIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpID0+XHJcbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbiksXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ1dpdGNoZXIgMyBEYXRhJyksXHJcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcsXHJcbiAgKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclByb2ZpbGVGZWF0dXJlKFxyXG4gICAgJ2xvY2FsX21lcmdlcycsICdib29sZWFuJywgJ3NldHRpbmdzJywgJ1Byb2ZpbGUgRGF0YScsXHJcbiAgICAnVGhpcyBwcm9maWxlIHdpbGwgc3RvcmUgYW5kIHJlc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBkYXRhIChtZXJnZWQgc2NyaXB0cywgbG9hZG9yZGVyLCBldGMpIHdoZW4gc3dpdGNoaW5nIHByb2ZpbGVzJyxcclxuICAgICgpID0+IHtcclxuICAgICAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcclxuICAgICAgcmV0dXJuIGFjdGl2ZUdhbWVJZCA9PT0gR0FNRV9JRDtcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsICdjb2xsZWN0aW9uJ107XHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlclBhZ2Uoe1xyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgY3JlYXRlSW5mb1BhbmVsOiAocHJvcHMpID0+IHtcclxuICAgICAgcmVmcmVzaEZ1bmMgPSBwcm9wcy5yZWZyZXNoO1xyXG4gICAgICByZXR1cm4gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcykgYXMgYW55O1xyXG4gICAgfSxcclxuICAgIGdhbWVBcnRVUkw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgZmlsdGVyOiAobW9kcykgPT4gbW9kcy5maWx0ZXIobW9kID0+ICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kLnR5cGUpKSxcclxuICAgIHByZVNvcnQ6IChpdGVtczogYW55W10sIGRpcmVjdGlvbjogYW55LCB1cGRhdGVUeXBlOiBhbnkpID0+IHtcclxuICAgICAgcmV0dXJuIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgcHJpb3JpdHlNYW5hZ2VyKSBhcyBhbnk7XHJcbiAgICB9LFxyXG4gICAgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbjogdHJ1ZSxcclxuICAgIGNhbGxiYWNrOiAobG9hZE9yZGVyLCB1cGRhdGVUeXBlKSA9PiB7XHJcbiAgICAgIGlmIChsb2FkT3JkZXIgPT09IF9QUkVWSU9VU19MTykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKF9QUkVWSU9VU19MTyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpKTtcclxuICAgICAgfVxyXG4gICAgICBfUFJFVklPVVNfTE8gPSBsb2FkT3JkZXI7XHJcbiAgICAgIHNldElOSVN0cnVjdChjb250ZXh0LCBsb2FkT3JkZXIsIHByaW9yaXR5TWFuYWdlcilcclxuICAgICAgICAudGhlbigoKSA9PiB3cml0ZVRvTW9kU2V0dGluZ3MoKSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCd0dzMtbW9kLWxpbWl0LWJyZWFjaCcsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgndHczLW1vZC1saW1pdC1icmVhY2gnLCAnbW9kLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RNb2RMaW1pdEJyZWFjaChjb250ZXh0LmFwaSwgbW9kTGltaXRQYXRjaGVyKSkpO1xyXG5cclxuICBjb25zdCByZXZlcnRMT0ZpbGUgPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpKSB7XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCkudGhlbigobWFudWFsbHlBZGRlZCkgPT4ge1xyXG4gICAgICAgIGlmIChtYW51YWxseUFkZGVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGNvbnN0IG5ld1N0cnVjdCA9IHt9O1xyXG4gICAgICAgICAgbWFudWFsbHlBZGRlZC5mb3JFYWNoKChtb2QsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgICBuZXdTdHJ1Y3RbbW9kXSA9IHtcclxuICAgICAgICAgICAgICBFbmFibGVkOiAxLFxyXG4gICAgICAgICAgICAgIFByaW9yaXR5OiAoKGxvYWRPcmRlciAhPT0gdW5kZWZpbmVkICYmICEhbG9hZE9yZGVyW21vZF0pXHJcbiAgICAgICAgICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlclttb2RdLnByZWZpeCwgMTApIDogaWR4KSArIDEsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBfSU5JX1NUUlVDVCA9IG5ld1N0cnVjdDtcclxuICAgICAgICAgIHdyaXRlVG9Nb2RTZXR0aW5ncygpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICByZWZyZXNoRnVuYz8uKCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAgICAgICAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICAgICAgICBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgICAgICA6IGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJywgZXJyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCB2YWxpZGF0ZVByb2ZpbGUgPSAocHJvZmlsZUlkLCBzdGF0ZSkgPT4ge1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICBpZiAoISFhY3RpdmVQcm9maWxlICYmICEhZGVwbG95UHJvZmlsZSAmJiAoZGVwbG95UHJvZmlsZS5pZCAhPT0gYWN0aXZlUHJvZmlsZS5pZCkpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFjdGl2ZVByb2ZpbGU7XHJcbiAgfTtcclxuXHJcbiAgbGV0IHByZXZEZXBsb3ltZW50ID0gW107XHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIG1vZExpbWl0UGF0Y2hlciA9IG5ldyBNb2RMaW1pdFBhdGNoZXIoY29udGV4dC5hcGkpO1xyXG4gICAgcHJpb3JpdHlNYW5hZ2VyID0gbmV3IFByaW9yaXR5TWFuYWdlcihjb250ZXh0LmFwaSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCBhc3luYyAoZ2FtZU1vZGUpID0+IHtcclxuICAgICAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgLy8gSnVzdCBpbiBjYXNlIHRoZSBzY3JpcHQgbWVyZ2VyIG5vdGlmaWNhdGlvbiBpcyBzdGlsbFxyXG4gICAgICAgIC8vICBwcmVzZW50LlxyXG4gICAgICAgIGNvbnRleHQuYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3dpdGNoZXIzLW1lcmdlJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBnYW1lTW9kZSk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlUHJvZiA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJpb3JpdHlUeXBlKHByaW9yaXR5VHlwZSkpO1xyXG4gICAgICAgIGlmIChsYXN0UHJvZklkICE9PSBhY3RpdmVQcm9mPy5pZCkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgc3RvcmVUb1Byb2ZpbGUoY29udGV4dCwgbGFzdFByb2ZJZClcclxuICAgICAgICAgICAgICAudGhlbigoKSA9PiByZXN0b3JlRnJvbVByb2ZpbGUoY29udGV4dCwgYWN0aXZlUHJvZj8uaWQpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZXN0b3JlIHByb2ZpbGUgbWVyZ2VkIGZpbGVzJywgZXJyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnd2lsbC1kZXBsb3knLCAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHZhbGlkYXRlUHJvZmlsZShwcm9maWxlSWQsIHN0YXRlKTtcclxuICAgICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG1lbnVNb2Qub25XaWxsRGVwbG95KGNvbnRleHQuYXBpLCBkZXBsb3ltZW50LCBhY3RpdmVQcm9maWxlKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH0pO1xyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoSlNPTi5zdHJpbmdpZnkocHJldkRlcGxveW1lbnQpICE9PSBKU09OLnN0cmluZ2lmeShkZXBsb3ltZW50KSkge1xyXG4gICAgICAgIHByZXZEZXBsb3ltZW50ID0gZGVwbG95bWVudDtcclxuICAgICAgICBxdWVyeVNjcmlwdE1lcmdlKGNvbnRleHQsICdZb3VyIG1vZHMgc3RhdGUvbG9hZCBvcmRlciBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHlvdSByYW4gJ1xyXG4gICAgICAgICAgKyAndGhlIHNjcmlwdCBtZXJnZXIuIFlvdSBtYXkgd2FudCB0byBydW4gdGhlIG1lcmdlciB0b29sIGFuZCBjaGVjayB3aGV0aGVyIGFueSBuZXcgc2NyaXB0IGNvbmZsaWN0cyBhcmUgJ1xyXG4gICAgICAgICAgKyAncHJlc2VudCwgb3IgaWYgZXhpc3RpbmcgbWVyZ2VzIGhhdmUgYmVjb21lIHVuZWNlc3NhcnkuIFBsZWFzZSBhbHNvIG5vdGUgdGhhdCBhbnkgbG9hZCBvcmRlciBjaGFuZ2VzICdcclxuICAgICAgICAgICsgJ21heSBhZmZlY3QgdGhlIG9yZGVyIGluIHdoaWNoIHlvdXIgY29uZmxpY3RpbmcgbW9kcyBhcmUgbWVhbnQgdG8gYmUgbWVyZ2VkLCBhbmQgbWF5IHJlcXVpcmUgeW91IHRvICdcclxuICAgICAgICAgICsgJ3JlbW92ZSB0aGUgZXhpc3RpbmcgbWVyZ2UgYW5kIHJlLWFwcGx5IGl0LicpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICAgIGNvbnN0IGRvY0ZpbGVzID0gZGVwbG95bWVudFsnd2l0Y2hlcjNtZW51bW9kcm9vdCddXHJcbiAgICAgICAgLmZpbHRlcihmaWxlID0+IGZpbGUucmVsUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWClcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGZpbGUucmVsUGF0aC5pbmRleE9mKElOUFVUX1hNTF9GSUxFTkFNRSkgPT09IC0xKSk7XHJcbiAgICAgIGNvbnN0IG1lbnVNb2RQcm9taXNlID0gKCkgPT4ge1xyXG4gICAgICAgIGlmIChkb2NGaWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBtZW51IG1vZHMgZGVwbG95ZWQgLSByZW1vdmUgdGhlIG1vZC5cclxuICAgICAgICAgIHJldHVybiBtZW51TW9kLnJlbW92ZU1vZChjb250ZXh0LmFwaSwgYWN0aXZlUHJvZmlsZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBtZW51TW9kLm9uRGlkRGVwbG95KGNvbnRleHQuYXBpLCBkZXBsb3ltZW50LCBhY3RpdmVQcm9maWxlKVxyXG4gICAgICAgICAgICAudGhlbihhc3luYyBtb2RJZCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKG1vZElkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChhY3RpdmVQcm9maWxlLmlkLCBtb2RJZCwgdHJ1ZSkpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBtb2RJZCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICByZXR1cm4gbWVudU1vZFByb21pc2UoKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHNldElOSVN0cnVjdChjb250ZXh0LCBsb2FkT3JkZXIsIHByaW9yaXR5TWFuYWdlcikpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gd3JpdGVUb01vZFNldHRpbmdzKCkpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmVmcmVzaEZ1bmM/LigpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgICAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHJvZmlsZS13aWxsLWNoYW5nZScsIGFzeW5jIChuZXdQcm9maWxlSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBuZXdQcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcclxuXHJcbiAgICAgIGNvbnN0IGxhc3RQcm9mSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBwcm9maWxlLmdhbWVJZCk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgc3RvcmVUb1Byb2ZpbGUoY29udGV4dCwgbGFzdFByb2ZJZClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0LCBwcm9maWxlLmlkKSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgbWVyZ2VkIGl0ZW1zJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25TdGF0ZUNoYW5nZShbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJ10sIChwcmV2LCBjdXJyZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBwcmlvcml0eU1hbmFnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgICBwcmlvcml0eU1hbmFnZXIucHJpb3JpdHlUeXBlID0gcHJpb3JpdHlUeXBlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdwdXJnZS1tb2RzJywgKCkgPT4ge1xyXG4gICAgICByZXZlcnRMT0ZpbGUoKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19