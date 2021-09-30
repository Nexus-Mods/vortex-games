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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const libxmljs_1 = require("libxmljs");
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const BS = __importStar(require("react-bootstrap"));
const vortex_api_1 = require("vortex-api");
const IniParser = __importStar(require("vortex-parse-ini"));
const winapi_bindings_1 = __importDefault(require("winapi-bindings"));
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./views/CollectionsDataView"));
const menumod_1 = __importDefault(require("./menumod"));
const scriptmerger_1 = require("./scriptmerger");
const common_1 = require("./common");
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
    const filePath = common_1.getLoadOrderFilePath();
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
    const filePath = common_1.getLoadOrderFilePath();
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(filePath))
        .then(() => vortex_api_1.fs.writeFileAsync(filePath, '', { encoding: 'utf8' }));
}
function ensureModSettings() {
    const filePath = common_1.getLoadOrderFilePath();
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
                    if (files.filter(file => !!file).length > 0) {
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
        return vortex_api_1.util.GameStoreHelper.findByAppId([GOG_ID_GOTY, GOG_ID, STEAM_ID])
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
    const findScriptMerger = (error) => {
        var _a;
        vortex_api_1.log('error', 'failed to download/install script merger', error);
        const scriptMergerPath = scriptmerger_1.getScriptMergerDir(context);
        if (scriptMergerPath === undefined) {
            notifyMissingScriptMerger(context.api);
            return Promise.resolve();
        }
        else {
            if (((_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger) === undefined) {
                return scriptmerger_1.setMergerConfig(discovery.path, scriptMergerPath);
            }
        }
    };
    const ensurePath = (dirpath) => vortex_api_1.fs.ensureDirWritableAsync(dirpath)
        .catch(err => (err.code === 'EEXIST')
        ? Promise.resolve()
        : Promise.reject(err));
    return Promise.all([
        ensurePath(path_1.default.join(discovery.path, 'Mods')),
        ensurePath(path_1.default.join(discovery.path, 'DLC')),
        ensurePath(path_1.default.dirname(common_1.getLoadOrderFilePath()))
    ])
        .then(() => scriptmerger_1.downloadScriptMerger(context)
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
        const mergedModNames = yield mergeInventoryParsing_1.getMergedModNames(context);
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
            const filterFunc = (modName) => modName.startsWith(common_1.LOCKED_PREFIX);
            const manualLocked = modMap.manual.filter(filterFunc);
            const managedLocked = modMap.managed
                .filter(entry => filterFunc(entry.name))
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
                    priorityManager.resetMaxPriority();
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
                        context.api.showErrorNotification('Cannot change to locked entry Priority', wantedPriority);
                        return resolve();
                    }
                    if (itemKey !== undefined) {
                        _INI_STRUCT[itemKey].Priority = parseInt(wantedPriority, 10);
                        onSetPriority(itemKey, wantedPriority);
                    }
                    else {
                        vortex_api_1.log('error', 'Failed to set priority - mod is not in ini struct', { modId: item.id });
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
            vortex_api_1.log('warn', '[W3] unable to presort due to no active profile');
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
        const filterFunc = (modName) => modName.startsWith(common_1.LOCKED_PREFIX);
        const lockedMods = [].concat(allMods.manual.filter(filterFunc), allMods.managed.filter(entry => filterFunc(entry.name))
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
                resetMaxPriority();
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
                        accum.push(Object.assign(Object.assign({}, entry), { prefix: prevPrefix + 1 }));
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
        if (mod.type === 'collection') {
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
        vortex_api_1.log('error', 'unable to resolve mod name', err);
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
        .then(xmlData => {
        try {
            modData = libxmljs_1.parseXmlString(xmlData, { ignore_enc: true, noblanks: true });
            return Promise.resolve();
        }
        catch (err) {
            context.api.showErrorNotification('Invalid mod XML data - inform mod author', { path: filePath, error: err.message }, { allowReport: false });
            modData = emptyXml;
            return Promise.resolve();
        }
    })
        .then(() => readInputFile(context, mergeDir))
        .then(mergedData => {
        try {
            const merged = libxmljs_1.parseXmlString(mergedData, { ignore_enc: true, noblanks: true });
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
    })
        .then(gameIndexFile => {
        const modVars = modData.find('//Var');
        const gameVars = gameIndexFile.find('//Var');
        modVars.forEach(modVar => {
            const matcher = (gameVar) => {
                let gameVarParent;
                let modVarParent;
                try {
                    gameVarParent = gameVar.parent().parent();
                    modVarParent = modVar.parent().parent();
                }
                catch (err) {
                    return false;
                }
                if ((typeof (gameVarParent === null || gameVarParent === void 0 ? void 0 : gameVarParent.attr) !== 'function')
                    || (typeof (modVarParent === null || modVarParent === void 0 ? void 0 : modVarParent.attr) !== 'function')) {
                    vortex_api_1.log('error', 'failed to find parent group of mod variable', modVar);
                    return false;
                }
                return ((gameVarParent.attr('id').value() === modVarParent.attr('id').value())
                    && (gameVar.attr('id').value() === modVar.attr('id').value()));
            };
            const existingVar = gameVars.find(matcher);
            if (existingVar) {
                existingVar.replace(modVar.clone());
            }
            else {
                const parentGroup = modVar.parent().parent();
                const groupId = parentGroup.attr('id').value();
                const matchingIndexGroup = gameIndexFile.find('//Group')
                    .filter(group => group.attr('id').value() === groupId);
                if (matchingIndexGroup.length > 1) {
                    const err = new vortex_api_1.util.DataInvalid('Duplicate group entries found in game input.xml'
                        + `\n\n${path_1.default.join(mergeDir, common_1.INPUT_XML_FILENAME)}\n\n`
                        + 'file - please fix this manually before attempting to re-install the mod');
                    context.api.showErrorNotification('Duplicate group entries detected', err, { allowReport: false });
                    return Promise.reject(err);
                }
                else if (matchingIndexGroup.length === 0) {
                    const userConfig = gameIndexFile.get('//UserConfig');
                    userConfig.addChild(parentGroup.clone());
                }
                else {
                    matchingIndexGroup[0].child(0).addChild(modVar.clone());
                }
            }
        });
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(mergeDir, CONFIG_MATRIX_REL_PATH, common_1.INPUT_XML_FILENAME), gameIndexFile);
    })
        .catch(err => {
        vortex_api_1.log('error', 'input.xml merge failed', err);
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
    context.registerAction('mods-action-icons', 300, 'start-install', {}, 'Import Script Merges', instanceIds => { mergeBackup_1.makeOnContextImport(context, instanceIds[0]); }, instanceIds => {
        var _a;
        const state = context.api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        if (((_a = mods[instanceIds === null || instanceIds === void 0 ? void 0 : instanceIds[0]]) === null || _a === void 0 ? void 0 : _a.type) !== 'collection') {
            return false;
        }
        const activeGameId = vortex_api_1.selectors.activeGameId(state);
        return activeGameId === common_1.GAME_ID;
    });
    context.registerInstaller('witcher3tl', 25, toBlue(testSupportedTL), toBlue(installTL));
    context.registerInstaller('witcher3mixed', 30, toBlue(installers_1.testSupportedMixed), toBlue(installers_1.installMixed));
    context.registerInstaller('witcher3content', 50, toBlue(testSupportedContent), toBlue(installContent));
    context.registerInstaller('witcher3menumodroot', 20, toBlue(testMenuModRoot), toBlue(installMenuMod));
    context.registerInstaller('scriptmergerdummy', 15, toBlue(scriptMergerTest), toBlue((files) => scriptMergerDummyInstaller(context, files)));
    context.registerModType('witcher3tl', 25, isTW3, getTLPath, toBlue(testTL));
    context.registerModType('witcher3dlc', 25, isTW3, getDLCPath, toBlue(testDLC));
    context.registerModType('witcher3menumodroot', 20, isTW3, getTLPath, toBlue(testMenuModRoot));
    context.registerModType('witcher3menumoddocuments', 60, isTW3, (game) => path_1.default.join(common_1.UNIAPP.getPath('documents'), 'The Witcher 3'), () => bluebird_1.default.resolve(false));
    context.registerMerge(canMerge, (filePath, mergeDir) => merge(filePath, mergeDir, context), 'witcher3menumodroot');
    iconbarActions_1.registerActions({ context, refreshFunc, getPriorityManager: () => priorityManager });
    context['registerCollectionFeature']('witcher3_collection_data', (gameId, includedMods, collection) => collections_1.genCollectionsData(context, gameId, includedMods, collection), (gameId, collection) => collections_1.parseCollectionsData(context, gameId, collection), () => Promise.resolve(), (t) => t('Witcher 3 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
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
                    const filePath = common_1.getLoadOrderFilePath();
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
        priorityManager = new priorityManager_1.PriorityManager(context.api, 'prefix-based');
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () {
            if (gameMode !== common_1.GAME_ID) {
                context.api.dismissNotification('witcher3-merge');
            }
            else {
                const state = context.api.getState();
                const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, gameMode);
                const activeProf = vortex_api_1.selectors.activeProfile(state);
                const priorityType = vortex_api_1.util.getSafe(state, common_1.getPriorityTypeBranch(), 'prefix-based');
                context.api.store.dispatch(actions_1.setPriorityType(priorityType));
                if (lastProfId !== (activeProf === null || activeProf === void 0 ? void 0 : activeProf.id)) {
                    try {
                        yield mergeBackup_1.storeToProfile(context, lastProfId)
                            .then(() => mergeBackup_1.restoreFromProfile(context, activeProf === null || activeProf === void 0 ? void 0 : activeProf.id));
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
            const priorityType = vortex_api_1.util.getSafe(state, common_1.getPriorityTypeBranch(), 'prefix-based');
            context.api.store.dispatch(actions_1.setPriorityType(priorityType));
            const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, profile.gameId);
            try {
                yield mergeBackup_1.storeToProfile(context, lastProfId)
                    .then(() => mergeBackup_1.restoreFromProfile(context, profile.id));
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
            const priorityType = vortex_api_1.util.getSafe(state, common_1.getPriorityTypeBranch(), 'prefix-based');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLHVDQUFtRDtBQUNuRCxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLG9EQUFzQztBQUN0QywyQ0FBa0Y7QUFDbEYsNERBQThDO0FBQzlDLHNFQUFxQztBQUVyQywyREFBcUY7QUFFckYsc0ZBQThEO0FBRTlELHdEQUFnQztBQUNoQyxpREFBMkY7QUFFM0YscUNBSWtCO0FBRWxCLHFEQUFtRDtBQUNuRCx1REFBb0Q7QUFFcEQsNkNBQWdFO0FBQ2hFLCtDQUF3RjtBQUV4RixtRUFBNEQ7QUFFNUQsdUNBQTRDO0FBQzVDLHlDQUF1QztBQUd2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUUxQixNQUFNLHNCQUFzQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFaEcsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUV0QixNQUFNLEtBQUssR0FBRztJQUNaO1FBQ0UsRUFBRSxFQUFFLHlCQUFnQjtRQUNwQixJQUFJLEVBQUUsa0JBQWtCO1FBQ3hCLElBQUksRUFBRSx5QkFBeUI7UUFDL0IsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLHlCQUF5QjtRQUMzQyxhQUFhLEVBQUU7WUFDYix5QkFBeUI7U0FDMUI7S0FDRjtDQUNGLENBQUM7QUFFRixTQUFTLGtCQUFrQjtJQUN6QixNQUFNLFFBQVEsR0FBRyw2QkFBb0IsRUFBRSxDQUFDO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLElB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bnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgRWxlbWVudCwgcGFyc2VYbWxTdHJpbmcgfSBmcm9tICdsaWJ4bWxqcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIEluaVBhcnNlciBmcm9tICd2b3J0ZXgtcGFyc2UtaW5pJztcclxuaW1wb3J0IHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xyXG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCBtZW51TW9kIGZyb20gJy4vbWVudW1vZCc7XHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyLCBnZXRTY3JpcHRNZXJnZXJEaXIsIHNldE1lcmdlckNvbmZpZyB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IERPX05PVF9ERVBMT1ksIERPX05PVF9ESVNQTEFZLFxyXG4gIEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBnZXRQcmlvcml0eVR5cGVCcmFuY2gsIEkxOE5fTkFNRVNQQUNFLCBJTlBVVF9YTUxfRklMRU5BTUUsXHJcbiAgTE9DS0VEX1BSRUZJWCwgTUVSR0VfSU5WX01BTklGRVNULCBQQVJUX1NVRkZJWCwgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcixcclxuICBTQ1JJUFRfTUVSR0VSX0lELCBVTklfUEFUQ0gsIFVOSUFQUCxcclxufSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyByZWdpc3RlckFjdGlvbnMgfSBmcm9tICcuL2ljb25iYXJBY3Rpb25zJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5cclxuaW1wb3J0IHsgaW5zdGFsbE1peGVkLCB0ZXN0U3VwcG9ydGVkTWl4ZWQgfSBmcm9tICcuL2luc3RhbGxlcnMnO1xyXG5pbXBvcnQgeyBtYWtlT25Db250ZXh0SW1wb3J0LCByZXN0b3JlRnJvbVByb2ZpbGUsIHN0b3JlVG9Qcm9maWxlIH0gZnJvbSAnLi9tZXJnZUJhY2t1cCc7XHJcblxyXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lcyB9IGZyb20gJy4vbWVyZ2VJbnZlbnRvcnlQYXJzaW5nJztcclxuXHJcbmltcG9ydCB7IHNldFByaW9yaXR5VHlwZSB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IFczUmVkdWNlciB9IGZyb20gJy4vcmVkdWNlcnMnO1xyXG5pbXBvcnQgeyBpdGVyYXRlZSB9IGZyb20gJ2xvZGFzaCc7XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTIwNzY2NDY2Myc7XHJcbmNvbnN0IEdPR19JRF9HT1RZID0gJzE0OTUxMzQzMjAnO1xyXG5jb25zdCBTVEVBTV9JRCA9ICc0OTk0NTAnO1xyXG5cclxuY29uc3QgQ09ORklHX01BVFJJWF9SRUxfUEFUSCA9IHBhdGguam9pbignYmluJywgJ2NvbmZpZycsICdyNGdhbWUnLCAndXNlcl9jb25maWdfbWF0cml4JywgJ3BjJyk7XHJcblxyXG5sZXQgX0lOSV9TVFJVQ1QgPSB7fTtcclxubGV0IF9QUkVWSU9VU19MTyA9IHt9O1xyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAge1xyXG4gICAgaWQ6IFNDUklQVF9NRVJHRVJfSUQsXHJcbiAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXHJcbiAgICBsb2dvOiAnV2l0Y2hlclNjcmlwdE1lcmdlci5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlVG9Nb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKVxyXG4gICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgLnRoZW4oaW5pID0+IHtcclxuICAgICAgcmV0dXJuIEJsdWViaXJkLmVhY2goT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLCAoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYgKF9JTklfU1RSVUNUPy5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgdXNlciB0byBydW4gbXVsdGlwbGUgb3BlcmF0aW9ucyBhdCBvbmNlLFxyXG4gICAgICAgICAgLy8gIGNhdXNpbmcgdGhlIHN0YXRpYyBpbmkgc3RydWN0dXJlIHRvIGJlIG1vZGlmaWVkXHJcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXHJcbiAgICAgICAgICAvLyAgbW9kaWZ5aW5nIHRoZSBsb2FkIG9yZGVyIHdoaWxlIGRlcGxveWluZy4gVGhpcyBzaG91bGRcclxuICAgICAgICAgIC8vICBtYWtlIHN1cmUgd2UgZG9uJ3QgYXR0ZW1wdCB0byB3cml0ZSBhbnkgaW52YWxpZCBtb2QgZW50cmllcy5cclxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcclxuICAgICAgICAgIEVuYWJsZWQ6IF9JTklfU1RSVUNUW2tleV0uRW5hYmxlZCxcclxuICAgICAgICAgIFByaW9yaXR5OiBfSU5JX1NUUlVDVFtrZXldLlByaW9yaXR5LFxyXG4gICAgICAgICAgVks6IF9JTklfU1RSVUNUW2tleV0uVkssXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHBhcnNlci53cml0ZShmaWxlUGF0aCwgaW5pKSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxyXG4gICAgICA/IFByb21pc2UucmVqZWN0KG5ldyBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yKGVyci5wYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTW9kU2V0dGluZ3MoKSB7XHJcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAvLyAgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChlaXRoZXIgYnkgdXMgb3IgdGhlIGdhbWUpIGJ1dFxyXG4gIC8vICBqdXN0IGluIGNhc2UgaXQgZ290IHJlbW92ZWQgc29tZWhvdywgd2UgcmUtaW5zdGF0ZSBpdFxyXG4gIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxufVxyXG5cclxuLy8gQXR0ZW1wdHMgdG8gcGFyc2UgYW5kIHJldHVybiBkYXRhIGZvdW5kIGluc2lkZVxyXG4vLyAgdGhlIG1vZHMuc2V0dGluZ3MgZmlsZSBpZiBmb3VuZCAtIG90aGVyd2lzZSB0aGlzXHJcbi8vICB3aWxsIGVuc3VyZSB0aGUgZmlsZSBpcyBwcmVzZW50LlxyXG5mdW5jdGlvbiBlbnN1cmVNb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXHJcbiAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gY3JlYXRlTW9kU2V0dGluZ3MoKS50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCkge1xyXG4gIHJldHVybiBlbnN1cmVNb2RTZXR0aW5ncygpLnRoZW4oaW5pID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICAgIGNvbnN0IGluaUVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSk7XHJcbiAgICBjb25zdCBtYW51YWxDYW5kaWRhdGVzID0gW10uY29uY2F0KGluaUVudHJpZXMsIFtVTklfUEFUQ0hdKS5maWx0ZXIoZW50cnkgPT4ge1xyXG4gICAgICBjb25zdCBoYXNWb3J0ZXhLZXkgPSB1dGlsLmdldFNhZmUoaW5pLmRhdGFbZW50cnldLCBbJ1ZLJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgcmV0dXJuICgoIWhhc1ZvcnRleEtleSkgfHwgKGluaS5kYXRhW2VudHJ5XS5WSyA9PT0gZW50cnkpICYmICFtb2RLZXlzLmluY2x1ZGVzKGVudHJ5KSk7XHJcbiAgICB9KSB8fCBbVU5JX1BBVENIXTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFNldChtYW51YWxDYW5kaWRhdGVzKSk7XHJcbiAgfSlcclxuICAudGhlbih1bmlxdWVDYW5kaWRhdGVzID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gSG93L3doeSBhcmUgd2UgZXZlbiBoZXJlID9cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCEnKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoQXJyYXkuZnJvbSh1bmlxdWVDYW5kaWRhdGVzKSwgKGFjY3VtLCBtb2QpID0+IHtcclxuICAgICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpO1xyXG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RGb2xkZXIpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAvLyBPaywgd2Uga25vdyB0aGUgZm9sZGVyIGlzIHRoZXJlIC0gbGV0cyBlbnN1cmUgdGhhdFxyXG4gICAgICAgICAgLy8gIGl0IGFjdHVhbGx5IGNvbnRhaW5zIGZpbGVzLlxyXG4gICAgICAgICAgbGV0IGNhbmRpZGF0ZXMgPSBbXTtcclxuICAgICAgICAgIGF3YWl0IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQocGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpLCBlbnRyaWVzID0+IHtcclxuICAgICAgICAgICAgY2FuZGlkYXRlcyA9IFtdLmNvbmNhdChjYW5kaWRhdGVzLCBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAoIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAocGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKSAhPT0gJycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChlbnRyeT8ubGlua0NvdW50ID09PSB1bmRlZmluZWQgfHwgZW50cnkubGlua0NvdW50IDw9IDEpKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAoWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xKVxyXG4gICAgICAgICAgICA/IG51bGwgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICAgICAgICAgIGNvbnN0IG1hcHBlZCA9IGF3YWl0IEJsdWViaXJkLm1hcChjYW5kaWRhdGVzLCBjYW5kID0+XHJcbiAgICAgICAgICAgIGZzLnN0YXRBc3luYyhjYW5kLmZpbGVQYXRoKVxyXG4gICAgICAgICAgICAgIC50aGVuKHN0YXRzID0+IHN0YXRzLmlzU3ltYm9saWNMaW5rKClcclxuICAgICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKGNhbmQuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpKTtcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKG1hcHBlZCk7XHJcbiAgICAgICAgfSkpXHJcbiAgICAgICAgLnRoZW4oKGZpbGVzOiBzdHJpbmdbXSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGZpbGVzLmZpbHRlcihmaWxlID0+ICEhZmlsZSkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKG1vZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpICYmIChlcnIucGF0aCA9PT0gbW9kRm9sZGVyKSlcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH0sIFtdKTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgLy8gVXNlckNhbmNlbGVkIHdvdWxkIHN1Z2dlc3Qgd2Ugd2VyZSB1bmFibGUgdG8gc3RhdCB0aGUgVzMgbW9kIGZvbGRlclxyXG4gICAgLy8gIHByb2JhYmx5IGR1ZSB0byBhIHBlcm1pc3Npb25pbmcgaXNzdWUgKEVOT0VOVCBpcyBoYW5kbGVkIGFib3ZlKVxyXG4gICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcclxuICAgIGNvbnN0IHByb2Nlc3NDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCk7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICghdXNlckNhbmNlbGVkICYmICFwcm9jZXNzQ2FuY2VsZWQpO1xyXG4gICAgY29uc3QgZGV0YWlscyA9IHVzZXJDYW5jZWxlZFxyXG4gICAgICA/ICdWb3J0ZXggdHJpZWQgdG8gc2NhbiB5b3VyIFczIG1vZHMgZm9sZGVyIGZvciBtYW51YWxseSBhZGRlZCBtb2RzIGJ1dCAnXHJcbiAgICAgICAgKyAnd2FzIGJsb2NrZWQgYnkgeW91ciBPUy9BViAtIHBsZWFzZSBtYWtlIHN1cmUgdG8gZml4IHRoaXMgYmVmb3JlIHlvdSAnXHJcbiAgICAgICAgKyAncHJvY2VlZCB0byBtb2QgVzMgYXMgeW91ciBtb2RkaW5nIGV4cGVyaWVuY2Ugd2lsbCBiZSBzZXZlcmVseSBhZmZlY3RlZC4nXHJcbiAgICAgIDogZXJyO1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbG9va3VwIG1hbnVhbGx5IGFkZGVkIG1vZHMnLFxyXG4gICAgICBkZXRhaWxzLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShcclxuICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXHJcbiAgICAgICdTb2Z0d2FyZVxcXFxDRCBQcm9qZWN0IFJlZFxcXFxUaGUgV2l0Y2hlciAzJyxcclxuICAgICAgJ0luc3RhbGxGb2xkZXInKTtcclxuICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcclxuICAgIH1cclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGluc3RQYXRoLnZhbHVlIGFzIHN0cmluZyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRF9HT1RZLCBHT0dfSUQsIFNURUFNX0lEXSlcclxuICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRUTChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gJ3dpdGNoZXIzJylcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgICAgZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdtb2RzJykgIT09IC0xKSAhPT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsVEwoZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICBnYW1lSWQsXHJcbiAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XHJcbiAgbGV0IHByZWZpeCA9IGZpbGVzLnJlZHVjZSgocHJldiwgZmlsZSkgPT4ge1xyXG4gICAgY29uc3QgY29tcG9uZW50cyA9IGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICBjb25zdCBpZHggPSBjb21wb25lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgIGlmICgoaWR4ID4gMCkgJiYgKChwcmV2ID09PSB1bmRlZmluZWQpIHx8IChpZHggPCBwcmV2Lmxlbmd0aCkpKSB7XHJcbiAgICAgIHJldHVybiBjb21wb25lbnRzLnNsaWNlKDAsIGlkeCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH1cclxuICB9LCB1bmRlZmluZWQpO1xyXG5cclxuICBwcmVmaXggPSAocHJlZml4ID09PSB1bmRlZmluZWQpID8gJycgOiBwcmVmaXguam9pbihwYXRoLnNlcCkgKyBwYXRoLnNlcDtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsZXNcclxuICAgIC5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkgJiYgZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgocHJlZml4KSlcclxuICAgIC5tYXAoZmlsZSA9PiAoe1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc2xpY2UocHJlZml4Lmxlbmd0aCksXHJcbiAgICB9KSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRDb250ZW50KGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnY29udGVudCcgKyBwYXRoLnNlcCkgIT09IHVuZGVmaW5lZCkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmlsZXNcclxuICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnY29udGVudCcgKyBwYXRoLnNlcCkpXHJcbiAgICAubWFwKGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBmaWxlQmFzZSA9IGZpbGUuc3BsaXQocGF0aC5zZXApLnNsaWNlKDEpLmpvaW4ocGF0aC5zZXApO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbignbW9kJyArIGRlc3RpbmF0aW9uUGF0aCwgZmlsZUJhc2UpLFxyXG4gICAgICB9O1xyXG4gIH0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbE1lbnVNb2QoZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XHJcbiAgLy8gSW5wdXQgc3BlY2lmaWMgZmlsZXMgbmVlZCB0byBiZSBpbnN0YWxsZWQgb3V0c2lkZSB0aGUgbW9kcyBmb2xkZXIgd2hpbGVcclxuICAvLyAgYWxsIG90aGVyIG1vZCBmaWxlcyBhcmUgdG8gYmUgaW5zdGFsbGVkIGFzIHVzdWFsLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZSkpICE9PSAnJyk7XHJcbiAgY29uc3QgaW5wdXRGaWxlcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IGZpbGUuaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpO1xyXG4gIGNvbnN0IHVuaXF1ZUlucHV0ID0gaW5wdXRGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICAvLyBTb21lIG1vZHMgdGVuZCB0byBpbmNsdWRlIGEgYmFja3VwIGZpbGUgbWVhbnQgZm9yIHRoZSB1c2VyIHRvIHJlc3RvcmVcclxuICAgIC8vICBoaXMgZ2FtZSB0byB2YW5pbGxhIChvYnZzIHdlIG9ubHkgd2FudCB0byBhcHBseSB0aGUgbm9uLWJhY2t1cCkuXHJcbiAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoaXRlcik7XHJcblxyXG4gICAgaWYgKGFjY3VtLmZpbmQoZW50cnkgPT4gcGF0aC5iYXNlbmFtZShlbnRyeSkgPT09IGZpbGVOYW1lKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFRoaXMgY29uZmlnIGZpbGUgaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGUgYWNjdW11bGF0b3IuXHJcbiAgICAgIC8vICBJZ25vcmUgdGhpcyBpbnN0YW5jZS5cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGluc3RhbmNlcyA9IGlucHV0RmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gZmlsZU5hbWUpO1xyXG4gICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIC8vIFdlIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIG1lbnUgY29uZmlnIGZpbGUgLSBtb2QgYXV0aG9yIHByb2JhYmx5IGluY2x1ZGVkXHJcbiAgICAgIC8vICBhIGJhY2t1cCBmaWxlIHRvIHJlc3RvcmUgdmFuaWxsYSBzdGF0ZSwgb3IgcGVyaGFwcyB0aGlzIGlzIGEgdmFyaWFudCBtb2Qgd2hpY2ggd2VcclxuICAgICAgLy8gIGNhbid0IGN1cnJlbnRseSBzdXBwb3J0LlxyXG4gICAgICAvLyBJdCdzIGRpZmZpY3VsdCBmb3IgdXMgdG8gY29ycmVjdGx5IGlkZW50aWZ5IHRoZSBjb3JyZWN0IGZpbGUgYnV0IHdlJ3JlIGdvaW5nIHRvXHJcbiAgICAgIC8vICB0cnkgYW5kIGd1ZXNzIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGNvbmZpZyBmaWxlIGhhcyBhIFwiYmFja3VwXCIgZm9sZGVyIHNlZ21lbnRcclxuICAgICAgLy8gIG90aGVyd2lzZSB3ZSBqdXN0IGFkZCB0aGUgZmlyc3QgZmlsZSBpbnN0YW5jZSAoSSdtIGdvaW5nIHRvIHJlZ3JldCBhZGRpbmcgdGhpcyBhcmVuJ3QgSSA/KVxyXG4gICAgICBpZiAoaXRlci50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2JhY2t1cCcpID09PSAtMSkge1xyXG4gICAgICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGFzc3VtZSB0aGF0IHRoaXMgaXMgdGhlIHJpZ2h0IGZpbGUuXHJcbiAgICAgICAgYWNjdW0ucHVzaChpdGVyKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gVGhpcyBpcyBhIHVuaXF1ZSBtZW51IGNvbmZpZ3VyYXRpb24gZmlsZSAtIGFkZCBpdC5cclxuICAgICAgYWNjdW0ucHVzaChpdGVyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcblxyXG4gIGxldCBvdGhlckZpbGVzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gIWlucHV0RmlsZXMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIGNvbnN0IGlucHV0RmlsZURlc3RpbmF0aW9uID0gQ09ORklHX01BVFJJWF9SRUxfUEFUSDtcclxuXHJcbiAgLy8gR2V0IHRoZSBtb2QncyByb290IGZvbGRlci5cclxuICBjb25zdCBiaW5JZHggPSB1bmlxdWVJbnB1dFswXS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJyk7XHJcblxyXG4gIC8vIFJlZmVycyB0byBmaWxlcyBsb2NhdGVkIGluc2lkZSB0aGUgYXJjaGl2ZSdzICdNb2RzJyBkaXJlY3RvcnkuXHJcbiAgLy8gIFRoaXMgYXJyYXkgY2FuIHZlcnkgd2VsbCBiZSBlbXB0eSBpZiBhIG1vZHMgZm9sZGVyIGRvZXNuJ3QgZXhpc3RcclxuICBjb25zdCBtb2RGaWxlcyA9IG90aGVyRmlsZXMuZmlsdGVyKGZpbGUgPT5cclxuICAgIGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5jbHVkZXMoJ21vZHMnKSk7XHJcblxyXG4gIGNvbnN0IG1vZHNJZHggPSAobW9kRmlsZXMubGVuZ3RoID4gMClcclxuICAgID8gbW9kRmlsZXNbMF0udG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpXHJcbiAgICA6IC0xO1xyXG4gIGNvbnN0IG1vZE5hbWVzID0gKG1vZHNJZHggIT09IC0xKVxyXG4gICAgPyBtb2RGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vZE5hbWUgPSBpdGVyLnNwbGl0KHBhdGguc2VwKS5zcGxpY2UobW9kc0lkeCArIDEsIDEpLmpvaW4oKTtcclxuICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtb2ROYW1lKSkge1xyXG4gICAgICAgIGFjY3VtLnB1c2gobW9kTmFtZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pXHJcbiAgICA6IFtdO1xyXG4gIC8vIFRoZSBwcmVzZW5jZSBvZiBhIG1vZHMgZm9sZGVyIGluZGljYXRlcyB0aGF0IHRoaXMgbW9kIG1heSBwcm92aWRlXHJcbiAgLy8gIHNldmVyYWwgbW9kIGVudHJpZXMuXHJcbiAgaWYgKG1vZEZpbGVzLmxlbmd0aCA+IDApIHtcclxuICAgIG90aGVyRmlsZXMgPSBvdGhlckZpbGVzLmZpbHRlcihmaWxlID0+ICFtb2RGaWxlcy5pbmNsdWRlcyhmaWxlKSk7XHJcbiAgfVxyXG5cclxuICAvLyBXZSdyZSBob3BpbmcgdGhhdCB0aGUgbW9kIGF1dGhvciBoYXMgaW5jbHVkZWQgdGhlIG1vZCBuYW1lIGluIHRoZSBhcmNoaXZlJ3NcclxuICAvLyAgc3RydWN0dXJlIC0gaWYgaGUgZGlkbid0IC0gd2UncmUgZ29pbmcgdG8gdXNlIHRoZSBkZXN0aW5hdGlvbiBwYXRoIGluc3RlYWQuXHJcbiAgY29uc3QgbW9kTmFtZSA9IChiaW5JZHggPiAwKVxyXG4gICAgPyBpbnB1dEZpbGVzWzBdLnNwbGl0KHBhdGguc2VwKVtiaW5JZHggLSAxXVxyXG4gICAgOiAoJ21vZCcgKyBwYXRoLmJhc2VuYW1lKGRlc3RpbmF0aW9uUGF0aCwgJy5pbnN0YWxsaW5nJykpLnJlcGxhY2UoL1xccy9nLCAnJyk7XHJcblxyXG4gIGNvbnN0IHRyaW1tZWRGaWxlcyA9IG90aGVyRmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc291cmNlID0gZmlsZTtcclxuICAgIGxldCByZWxQYXRoID0gZmlsZS5zcGxpdChwYXRoLnNlcClcclxuICAgICAgICAgICAgICAgICAgICAgIC5zbGljZShiaW5JZHgpO1xyXG4gICAgaWYgKHJlbFBhdGhbMF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBUaGlzIGZpbGUgbXVzdCd2ZSBiZWVuIGluc2lkZSB0aGUgcm9vdCBvZiB0aGUgYXJjaGl2ZTtcclxuICAgICAgLy8gIGRlcGxveSBhcyBpcy5cclxuICAgICAgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpcnN0U2VnID0gcmVsUGF0aFswXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGZpcnN0U2VnID09PSAnY29udGVudCcgfHwgZmlyc3RTZWcuZW5kc1dpdGgoUEFSVF9TVUZGSVgpKSB7XHJcbiAgICAgIHJlbFBhdGggPSBbXS5jb25jYXQoWydNb2RzJywgbW9kTmFtZV0sIHJlbFBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNvdXJjZSxcclxuICAgICAgcmVsUGF0aDogcmVsUGF0aC5qb2luKHBhdGguc2VwKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHRvQ29weUluc3RydWN0aW9uID0gKHNvdXJjZSwgZGVzdGluYXRpb24pID0+ICh7XHJcbiAgICB0eXBlOiAnY29weScsXHJcbiAgICBzb3VyY2UsXHJcbiAgICBkZXN0aW5hdGlvbixcclxuICB9KTtcclxuXHJcbiAgY29uc3QgaW5wdXRJbnN0cnVjdGlvbnMgPSB1bmlxdWVJbnB1dC5tYXAoZmlsZSA9PlxyXG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZSwgcGF0aC5qb2luKGlucHV0RmlsZURlc3RpbmF0aW9uLCBwYXRoLmJhc2VuYW1lKGZpbGUpKSkpO1xyXG5cclxuICBjb25zdCBvdGhlckluc3RydWN0aW9ucyA9IHRyaW1tZWRGaWxlcy5tYXAoZmlsZSA9PlxyXG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZS5zb3VyY2UsIGZpbGUucmVsUGF0aCkpO1xyXG5cclxuICBjb25zdCBtb2RGaWxlSW5zdHJ1Y3Rpb25zID0gbW9kRmlsZXMubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUsIGZpbGUpKTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gW10uY29uY2F0KGlucHV0SW5zdHJ1Y3Rpb25zLCBvdGhlckluc3RydWN0aW9ucywgbW9kRmlsZUluc3RydWN0aW9ucyk7XHJcbiAgaWYgKG1vZE5hbWVzLmxlbmd0aCA+IDApIHtcclxuICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgIGtleTogJ21vZENvbXBvbmVudHMnLFxyXG4gICAgICB2YWx1ZTogbW9kTmFtZXMsXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdE1lbnVNb2RSb290KGluc3RydWN0aW9uczogYW55W10sIGdhbWVJZDogc3RyaW5nKTpcclxuICBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQgfCBib29sZWFuPiB7XHJcbiAgY29uc3QgcHJlZGljYXRlID0gKGluc3RyKSA9PiAoISFnYW1lSWQpXHJcbiAgICA/ICgoR0FNRV9JRCA9PT0gZ2FtZUlkKSAmJiAoaW5zdHIuaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpKVxyXG4gICAgOiAoKGluc3RyLnR5cGUgPT09ICdjb3B5JykgJiYgKGluc3RyLmRlc3RpbmF0aW9uLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKSk7XHJcblxyXG4gIHJldHVybiAoISFnYW1lSWQpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgc3VwcG9ydGVkOiBpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgICAgIH0pXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0VEwoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgY29uc3QgbWVudU1vZEZpbGVzID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiAhIWluc3RyLmRlc3RpbmF0aW9uXHJcbiAgICAmJiBpbnN0ci5kZXN0aW5hdGlvbi5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSk7XHJcbiAgaWYgKG1lbnVNb2RGaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdHJ1Y3Rpb25zLmZpbmQoXHJcbiAgICBpbnN0cnVjdGlvbiA9PiAhIWluc3RydWN0aW9uLmRlc3RpbmF0aW9uICYmIGluc3RydWN0aW9uLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnbW9kcycgKyBwYXRoLnNlcCksXHJcbiAgKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdERMQyhpbnN0cnVjdGlvbnMpIHtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxyXG4gICAgaW5zdHJ1Y3Rpb24gPT4gISFpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbiAmJiBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2RsYycgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSkge1xyXG4gIGNvbnN0IG5vdGlmSWQgPSAnbWlzc2luZy1zY3JpcHQtbWVyZ2VyJztcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogbm90aWZJZCxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgMyBzY3JpcHQgbWVyZ2VyIGlzIG1pc3NpbmcvbWlzY29uZmlndXJlZCcsXHJcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgU2NyaXB0IE1lcmdlcicsIHtcclxuICAgICAgICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdWb3J0ZXggaXMgdW5hYmxlIHRvIHJlc29sdmUgdGhlIFNjcmlwdCBNZXJnZXJcXCdzIGxvY2F0aW9uLiBUaGUgdG9vbCBuZWVkcyB0byBiZSBkb3dubG9hZGVkIGFuZCBjb25maWd1cmVkIG1hbnVhbGx5LiAnXHJcbiAgICAgICAgICAgICAgKyAnW3VybD1odHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvVG9vbF9TZXR1cDpfV2l0Y2hlcl8zX1NjcmlwdF9NZXJnZXJdRmluZCBvdXQgbW9yZSBhYm91dCBob3cgdG8gY29uZmlndXJlIGl0IGFzIGEgdG9vbCBmb3IgdXNlIGluIFZvcnRleC5bL3VybF1bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICAgICAgICAgKyAnTm90ZTogV2hpbGUgc2NyaXB0IG1lcmdpbmcgd29ya3Mgd2VsbCB3aXRoIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHMsIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSBmb3IgYSBzYXRpc2Z5aW5nIG91dGNvbWUgaW4gZXZlcnkgc2luZ2xlIGNhc2UuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJyk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7IGxhYmVsOiAnRG93bmxvYWQgU2NyaXB0IE1lcmdlcicsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKSkgfSxcclxuICAgICAgICAgIF0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpIHtcclxuICBjb25zdCBmaW5kU2NyaXB0TWVyZ2VyID0gKGVycm9yKSA9PiB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBkb3dubG9hZC9pbnN0YWxsIHNjcmlwdCBtZXJnZXInLCBlcnJvcik7XHJcbiAgICBjb25zdCBzY3JpcHRNZXJnZXJQYXRoID0gZ2V0U2NyaXB0TWVyZ2VyRGlyKGNvbnRleHQpO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlclBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gc2V0TWVyZ2VyQ29uZmlnKGRpc2NvdmVyeS5wYXRoLCBzY3JpcHRNZXJnZXJQYXRoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGVuc3VyZVBhdGggPSAoZGlycGF0aCkgPT5cclxuICAgIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoZGlycGF0aClcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFRVhJU1QnKVxyXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpLFxyXG4gICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKSksXHJcbiAgICBlbnN1cmVQYXRoKHBhdGguZGlybmFtZShnZXRMb2FkT3JkZXJGaWxlUGF0aCgpKSldKVxyXG4gICAgICAudGhlbigoKSA9PiBkb3dubG9hZFNjcmlwdE1lcmdlcihjb250ZXh0KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgOiBmaW5kU2NyaXB0TWVyZ2VyKGVycikpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHNjcmlwdE1lcmdlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghIXNjcmlwdE1lcmdlcj8ucGF0aCkge1xyXG4gICAgcmV0dXJuIHNjcmlwdE1lcmdlcjtcclxuICB9XHJcblxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1blNjcmlwdE1lcmdlcihhcGkpIHtcclxuICBjb25zdCB0b29sID0gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpO1xyXG4gIGlmICh0b29sPy5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBhcGkucnVuRXhlY3V0YWJsZSh0b29sLnBhdGgsIFtdLCB7IHN1Z2dlc3REZXBsb3k6IHRydWUgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJ1biB0b29sJywgZXJyLFxyXG4gICAgICB7IGFsbG93UmVwb3J0OiBbJ0VQRVJNJywgJ0VBQ0NFU1MnLCAnRU5PRU5UJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xIH0pKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTW9kcyhjb250ZXh0KSB7XHJcbiAgLy8gTW9kIHR5cGVzIHdlIGRvbid0IHdhbnQgdG8gZGlzcGxheSBpbiB0aGUgTE8gcGFnZVxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBtZXJnZWQ6IFtdLFxyXG4gICAgICBtYW51YWw6IFtdLFxyXG4gICAgICBtYW5hZ2VkOiBbXSxcclxuICAgIH0pO1xyXG4gIH1cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcblxyXG4gIC8vIE9ubHkgc2VsZWN0IG1vZHMgd2hpY2ggYXJlIGVuYWJsZWQsIGFuZCBhcmUgbm90IGEgbWVudSBtb2QuXHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RTdGF0ZSkuZmlsdGVyKGtleSA9PlxyXG4gICAgKCEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSkpO1xyXG5cclxuICBjb25zdCBtZXJnZWRNb2ROYW1lcyA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWVzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbnVhbGx5QWRkZWRNb2RzID0gYXdhaXQgZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCk7XHJcbiAgY29uc3QgbWFuYWdlZE1vZHMgPSBhd2FpdCBnZXRNYW5hZ2VkTW9kTmFtZXMoY29udGV4dCwgZW5hYmxlZE1vZHMubWFwKGtleSA9PiBtb2RzW2tleV0pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIG1lcmdlZDogbWVyZ2VkTW9kTmFtZXMsXHJcbiAgICBtYW51YWw6IG1hbnVhbGx5QWRkZWRNb2RzLmZpbHRlcihtb2QgPT4gIW1lcmdlZE1vZE5hbWVzLmluY2x1ZGVzKG1vZCkpLFxyXG4gICAgbWFuYWdlZDogbWFuYWdlZE1vZHMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNldElOSVN0cnVjdChjb250ZXh0LCBsb2FkT3JkZXIsIHByaW9yaXR5TWFuYWdlcikge1xyXG4gIHJldHVybiBnZXRBbGxNb2RzKGNvbnRleHQpLnRoZW4obW9kTWFwID0+IHtcclxuICAgIF9JTklfU1RSVUNUID0ge307XHJcbiAgICBjb25zdCBtb2RzID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1vZE1hcC5tYW5hZ2VkLCBtb2RNYXAubWFudWFsKTtcclxuICAgIGNvbnN0IGZpbHRlckZ1bmMgPSAobW9kTmFtZTogc3RyaW5nKSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCk7XHJcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihmaWx0ZXJGdW5jKTtcclxuICAgIGNvbnN0IG1hbmFnZWRMb2NrZWQgPSBtb2RNYXAubWFuYWdlZFxyXG4gICAgICAuZmlsdGVyKGVudHJ5ID0+IGZpbHRlckZ1bmMoZW50cnkubmFtZSkpXHJcbiAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSk7XHJcbiAgICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQsIG1hbmFnZWRMb2NrZWQpO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLmVhY2gobW9kcywgKG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgIGxldCBuYW1lO1xyXG4gICAgICBsZXQga2V5O1xyXG4gICAgICBpZiAodHlwZW9mKG1vZCkgPT09ICdvYmplY3QnICYmIG1vZCAhPT0gbnVsbCkge1xyXG4gICAgICAgIG5hbWUgPSBtb2QubmFtZTtcclxuICAgICAgICBrZXkgPSBtb2QuaWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZDtcclxuICAgICAgICBrZXkgPSBtb2Q7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IExPRW50cnkgPSB1dGlsLmdldFNhZmUobG9hZE9yZGVyLCBba2V5XSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICAgIHByaW9yaXR5TWFuYWdlci5yZXNldE1heFByaW9yaXR5KCk7XHJcbiAgICAgIH1cclxuICAgICAgX0lOSV9TVFJVQ1RbbmFtZV0gPSB7XHJcbiAgICAgICAgLy8gVGhlIElOSSBmaWxlJ3MgZW5hYmxlZCBhdHRyaWJ1dGUgZXhwZWN0cyAxIG9yIDBcclxuICAgICAgICBFbmFibGVkOiAoTE9FbnRyeSAhPT0gdW5kZWZpbmVkKSA/IExPRW50cnkuZW5hYmxlZCA/IDEgOiAwIDogMSxcclxuICAgICAgICBQcmlvcml0eTogdG90YWxMb2NrZWQuaW5jbHVkZXMobmFtZSlcclxuICAgICAgICAgID8gdG90YWxMb2NrZWQuaW5kZXhPZihuYW1lKVxyXG4gICAgICAgICAgOiBwcmlvcml0eU1hbmFnZXIuZ2V0UHJpb3JpdHkoeyBpZDoga2V5IH0pLFxyXG4gICAgICAgIFZLOiBrZXksXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxubGV0IHJlZnJlc2hGdW5jO1xyXG4vLyBpdGVtOiBJTG9hZE9yZGVyRGlzcGxheUl0ZW1cclxuZnVuY3Rpb24gZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgaXRlbTogdHlwZXMuSUxvYWRPcmRlckRpc3BsYXlJdGVtLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgbWluUHJpb3JpdHk6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2V0UHJpb3JpdHk6IChrZXk6IHN0cmluZywgcHJpb3JpdHk6IG51bWJlcikgPT4gdm9pZCkge1xyXG4gIGNvbnN0IHByaW9yaXR5SW5wdXREaWFsb2cgPSAoKSA9PiB7XHJcbiAgICByZXR1cm4gbmV3IEJsdWViaXJkKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NldCBOZXcgUHJpb3JpdHknLCB7XHJcbiAgICAgICAgdGV4dDogY29udGV4dC5hcGkudHJhbnNsYXRlKCdJbnNlcnQgbmV3IG51bWVyaWNhbCBwcmlvcml0eSBmb3Ige3tpdGVtTmFtZX19IGluIHRoZSBpbnB1dCBib3g6JywgeyByZXBsYWNlOiB7IGl0ZW1OYW1lOiBpdGVtLm5hbWUgfSB9KSxcclxuICAgICAgICBpbnB1dDogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3czUHJpb3JpdHlJbnB1dCcsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnUHJpb3JpdHknLFxyXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IF9JTklfU1RSVUNUW2l0ZW0uaWRdPy5Qcmlvcml0eSB8fCAwLFxyXG4gICAgICAgICAgfV0sXHJcbiAgICAgIH0sIFsgeyBsYWJlbDogJ0NhbmNlbCcgfSwgeyBsYWJlbDogJ1NldCcsIGRlZmF1bHQ6IHRydWUgfSBdKVxyXG4gICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnU2V0Jykge1xyXG4gICAgICAgICAgY29uc3QgaXRlbUtleSA9IE9iamVjdC5rZXlzKF9JTklfU1RSVUNUKS5maW5kKGtleSA9PiBfSU5JX1NUUlVDVFtrZXldLlZLID09PSBpdGVtLmlkKTtcclxuICAgICAgICAgIGNvbnN0IHdhbnRlZFByaW9yaXR5ID0gcmVzdWx0LmlucHV0Wyd3M1ByaW9yaXR5SW5wdXQnXTtcclxuICAgICAgICAgIGlmICh3YW50ZWRQcmlvcml0eSA8PSBtaW5Qcmlvcml0eSkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0Nhbm5vdCBjaGFuZ2UgdG8gbG9ja2VkIGVudHJ5IFByaW9yaXR5JyxcclxuICAgICAgICAgICAgICB3YW50ZWRQcmlvcml0eSk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaXRlbUtleSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIF9JTklfU1RSVUNUW2l0ZW1LZXldLlByaW9yaXR5ID0gcGFyc2VJbnQod2FudGVkUHJpb3JpdHksIDEwKTtcclxuICAgICAgICAgICAgb25TZXRQcmlvcml0eShpdGVtS2V5LCB3YW50ZWRQcmlvcml0eSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzZXQgcHJpb3JpdHkgLSBtb2QgaXMgbm90IGluIGluaSBzdHJ1Y3QnLCB7IG1vZElkOiBpdGVtLmlkIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH07XHJcbiAgY29uc3QgaXRlbUFjdGlvbnMgPSBbXHJcbiAgICB7XHJcbiAgICAgIHNob3c6IGl0ZW0ubG9ja2VkICE9PSB0cnVlLFxyXG4gICAgICB0aXRsZTogJ1NldCBNYW51YWwgUHJpb3JpdHknLFxyXG4gICAgICBhY3Rpb246ICgpID0+IHByaW9yaXR5SW5wdXREaWFsb2coKSxcclxuICAgIH0sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIGl0ZW1BY3Rpb25zO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIHByaW9yaXR5TWFuYWdlcik6IFByb21pc2U8YW55W10+IHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCB7IGdldFByaW9yaXR5LCByZXNldE1heFByaW9yaXR5IH0gPSBwcmlvcml0eU1hbmFnZXI7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFdoYXQgYW4gb2RkIHVzZSBjYXNlIC0gcGVyaGFwcyB0aGUgdXNlciBoYWQgc3dpdGNoZWQgZ2FtZU1vZGVzIG9yXHJcbiAgICAvLyAgZXZlbiBkZWxldGVkIGhpcyBwcm9maWxlIGR1cmluZyB0aGUgcHJlLXNvcnQgZnVuY3Rpb25hbGl0eSA/XHJcbiAgICAvLyAgT2RkIGJ1dCBwbGF1c2libGUgSSBzdXBwb3NlID9cclxuICAgIGxvZygnd2FybicsICdbVzNdIHVuYWJsZSB0byBwcmVzb3J0IGR1ZSB0byBubyBhY3RpdmUgcHJvZmlsZScpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICBsZXQgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBvblNldFByaW9yaXR5ID0gKGl0ZW1LZXksIHdhbnRlZFByaW9yaXR5KSA9PiB7XHJcbiAgICByZXR1cm4gd3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHdhbnRlZFByaW9yaXR5ID0gK3dhbnRlZFByaW9yaXR5O1xyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IG1vZElkID0gX0lOSV9TVFJVQ1RbaXRlbUtleV0uVks7XHJcbiAgICAgICAgY29uc3QgbG9FbnRyeSA9IGxvYWRPcmRlclttb2RJZF07XHJcbiAgICAgICAgaWYgKHByaW9yaXR5TWFuYWdlci5wcmlvcml0eVR5cGUgPT09ICdwb3NpdGlvbi1iYXNlZCcpIHtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyRW50cnkoXHJcbiAgICAgICAgICAgIGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB7XHJcbiAgICAgICAgICAgICAgLi4ubG9FbnRyeSxcclxuICAgICAgICAgICAgICBwb3M6IChsb0VudHJ5LnBvcyA8IHdhbnRlZFByaW9yaXR5KSA/IHdhbnRlZFByaW9yaXR5IDogd2FudGVkUHJpb3JpdHkgLSAyLFxyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXJFbnRyeShcclxuICAgICAgICAgICAgYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHtcclxuICAgICAgICAgICAgICAuLi5sb0VudHJ5LFxyXG4gICAgICAgICAgICAgIHByZWZpeDogcGFyc2VJbnQoX0lOSV9TVFJVQ1RbaXRlbUtleV0uUHJpb3JpdHksIDEwKSxcclxuICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZnJlc2hGdW5jICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJlZnJlc2hGdW5jKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgfTtcclxuICBjb25zdCBhbGxNb2RzID0gYXdhaXQgZ2V0QWxsTW9kcyhjb250ZXh0KTtcclxuICBpZiAoKGFsbE1vZHMubWVyZ2VkLmxlbmd0aCA9PT0gMCkgJiYgKGFsbE1vZHMubWFudWFsLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgIGl0ZW1zLm1hcCgoaXRlbSwgaWR4KSA9PiB7XHJcbiAgICAgIGlmIChpZHggPT09IDApIHtcclxuICAgICAgICByZXNldE1heFByaW9yaXR5KCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5pdGVtLFxyXG4gICAgICAgIGNvbnRleHRNZW51QWN0aW9uczogZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQsIGl0ZW0sIDAsIG9uU2V0UHJpb3JpdHkpLFxyXG4gICAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGZpbHRlckZ1bmMgPSAobW9kTmFtZTogc3RyaW5nKSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCk7XHJcbiAgY29uc3QgbG9ja2VkTW9kcyA9IFtdLmNvbmNhdChhbGxNb2RzLm1hbnVhbC5maWx0ZXIoZmlsdGVyRnVuYyksXHJcbiAgICBhbGxNb2RzLm1hbmFnZWQuZmlsdGVyKGVudHJ5ID0+IGZpbHRlckZ1bmMoZW50cnkubmFtZSkpXHJcbiAgICAgICAgICAgICAgICAgICAubWFwKGVudHJ5ID0+IGVudHJ5Lm5hbWUpKTtcclxuICBjb25zdCByZWFkYWJsZU5hbWVzID0ge1xyXG4gICAgW1VOSV9QQVRDSF06ICdVbmlmaWNhdGlvbi9Db21tdW5pdHkgUGF0Y2gnLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGxvY2tlZEVudHJpZXMgPSBbXS5jb25jYXQoYWxsTW9kcy5tZXJnZWQsIGxvY2tlZE1vZHMpXHJcbiAgICAucmVkdWNlKChhY2N1bSwgbW9kTmFtZSwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG9iaiA9IHtcclxuICAgICAgICBpZDogbW9kTmFtZSxcclxuICAgICAgICBuYW1lOiAhIXJlYWRhYmxlTmFtZXNbbW9kTmFtZV0gPyByZWFkYWJsZU5hbWVzW21vZE5hbWVdIDogbW9kTmFtZSxcclxuICAgICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICAgIGxvY2tlZDogdHJ1ZSxcclxuICAgICAgICBwcmVmaXg6IGlkeCArIDEsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAoIWFjY3VtLmZpbmQoYWNjID0+IG9iai5pZCA9PT0gYWNjLmlkKSkge1xyXG4gICAgICAgIGFjY3VtLnB1c2gob2JqKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG5cclxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+ICFhbGxNb2RzLm1lcmdlZC5pbmNsdWRlcyhpdGVtLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWFsbE1vZHMubWFudWFsLmluY2x1ZGVzKGl0ZW0uaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhYWxsTW9kcy5tYW5hZ2VkLmZpbmQobW9kID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobW9kLm5hbWUgPT09IFVOSV9QQVRDSCkgJiYgKG1vZC5pZCA9PT0gaXRlbS5pZCkpKVxyXG4gICAgICAgICAgICAgICAubWFwKChpdGVtLCBpZHgpID0+IHtcclxuICAgIGlmIChpZHggPT09IDApIHtcclxuICAgICAgcmVzZXRNYXhQcmlvcml0eSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uaXRlbSxcclxuICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgbG9ja2VkRW50cmllcy5sZW5ndGgsIG9uU2V0UHJpb3JpdHkpLFxyXG4gICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgbWFudWFsRW50cmllcyA9IGFsbE1vZHMubWFudWFsXHJcbiAgICAuZmlsdGVyKGtleSA9PiBsb2NrZWRFbnRyaWVzLmZpbmQoZW50cnkgPT4gZW50cnkuaWQgPT09IGtleSkgPT09IHVuZGVmaW5lZClcclxuICAgIC5tYXAoa2V5ID0+IHtcclxuICAgICAgY29uc3QgaXRlbSA9IHtcclxuICAgICAgICBpZDoga2V5LFxyXG4gICAgICAgIG5hbWU6IGtleSxcclxuICAgICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICAgIGV4dGVybmFsOiB0cnVlLFxyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLml0ZW0sXHJcbiAgICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcclxuICAgICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCBsb2NrZWRFbnRyaWVzLmxlbmd0aCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpO1xyXG4gIGNvbnN0IGtub3duTWFudWFsbHlBZGRlZCA9IG1hbnVhbEVudHJpZXMuZmlsdGVyKGVudHJ5ID0+IGtleXMuaW5jbHVkZXMoZW50cnkuaWQpKSB8fCBbXTtcclxuICBjb25zdCB1bmtub3duTWFudWFsbHlBZGRlZCA9IG1hbnVhbEVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFrZXlzLmluY2x1ZGVzKGVudHJ5LmlkKSkgfHwgW107XHJcbiAgY29uc3QgZmlsdGVyZWRPcmRlciA9IGtleXNcclxuICAgIC5maWx0ZXIoa2V5ID0+IGxvY2tlZEVudHJpZXMuZmluZChpdGVtID0+IGl0ZW0uaWQgPT09IGtleSkgPT09IHVuZGVmaW5lZClcclxuICAgIC5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcclxuICAgICAgYWNjdW1ba2V5XSA9IGxvYWRPcmRlcltrZXldO1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAga25vd25NYW51YWxseUFkZGVkLmZvckVhY2goa25vd24gPT4ge1xyXG4gICAgY29uc3QgZGlmZiA9IGtleXMubGVuZ3RoIC0gT2JqZWN0LmtleXMoZmlsdGVyZWRPcmRlcikubGVuZ3RoO1xyXG5cclxuICAgIGNvbnN0IHBvcyA9IGZpbHRlcmVkT3JkZXJba25vd24uaWRdLnBvcyAtIGRpZmY7XHJcbiAgICBpdGVtcyA9IFtdLmNvbmNhdChpdGVtcy5zbGljZSgwLCBwb3MpIHx8IFtdLCBrbm93biwgaXRlbXMuc2xpY2UocG9zKSB8fCBbXSk7XHJcbiAgfSk7XHJcblxyXG4gIGxldCBwcmVTb3J0ZWQgPSBbXS5jb25jYXQoXHJcbiAgICAuLi5sb2NrZWRFbnRyaWVzLFxyXG4gICAgaXRlbXMuZmlsdGVyKGl0ZW0gPT4ge1xyXG4gICAgICBjb25zdCBpc0xvY2tlZCA9IGxvY2tlZEVudHJpZXMuZmluZChsb2NrZWQgPT4gbG9ja2VkLm5hbWUgPT09IGl0ZW0ubmFtZSkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgZG9Ob3REaXNwbGF5ID0gRE9fTk9UX0RJU1BMQVkuaW5jbHVkZXMoaXRlbS5uYW1lLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICByZXR1cm4gIWlzTG9ja2VkICYmICFkb05vdERpc3BsYXk7XHJcbiAgICB9KSxcclxuICAgIC4uLnVua25vd25NYW51YWxseUFkZGVkKTtcclxuXHJcbiAgcHJlU29ydGVkID0gKHVwZGF0ZVR5cGUgIT09ICdkcmFnLW4tZHJvcCcpXHJcbiAgICA/IHByZVNvcnRlZC5zb3J0KChsaHMsIHJocykgPT4gbGhzLnByZWZpeCAtIHJocy5wcmVmaXgpXHJcbiAgICA6IHByZVNvcnRlZC5yZWR1Y2UoKGFjY3VtLCBlbnRyeSwgaWR4KSA9PiB7XHJcbiAgICAgICAgaWYgKGxvY2tlZEVudHJpZXMuaW5kZXhPZihlbnRyeSkgIT09IC0xIHx8IGlkeCA9PT0gMCkge1xyXG4gICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IHByZXZQcmVmaXggPSBwYXJzZUludChhY2N1bVtpZHggLSAxXS5wcmVmaXgsIDEwKTtcclxuICAgICAgICAgIGlmIChwcmV2UHJlZml4ID49IGVudHJ5LnByZWZpeCkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICAgICAgICAuLi5lbnRyeSxcclxuICAgICAgICAgICAgICBwcmVmaXg6IHByZXZQcmVmaXggKyAxLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIFtdKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHByZVNvcnRlZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRNb2RGb2xkZXIoaW5zdGFsbGF0aW9uUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QpOiBCbHVlYmlyZDxzdHJpbmc+IHtcclxuICBpZiAoIWluc3RhbGxhdGlvblBhdGggfHwgIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xyXG4gICAgY29uc3QgZXJyTWVzc2FnZSA9ICFpbnN0YWxsYXRpb25QYXRoXHJcbiAgICAgID8gJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnXHJcbiAgICAgIDogJ0ZhaWxlZCB0byByZXNvbHZlIG1vZCBpbnN0YWxsYXRpb24gcGF0aCc7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcihlcnJNZXNzYWdlKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBleHBlY3RlZE1vZE5hbWVMb2NhdGlvbiA9IFsnd2l0Y2hlcjNtZW51bW9kcm9vdCcsICd3aXRjaGVyM3RsJ10uaW5jbHVkZXMobW9kLnR5cGUpXHJcbiAgICA/IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgJ01vZHMnKVxyXG4gICAgOiBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZXhwZWN0ZWRNb2ROYW1lTG9jYXRpb24pXHJcbiAgICAudGhlbihlbnRyaWVzID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzWzBdKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1hbmFnZWRNb2ROYW1lcyhjb250ZXh0OiB0eXBlcy5JQ29tcG9uZW50Q29udGV4dCwgbW9kczogdHlwZXMuSU1vZFtdKSB7XHJcbiAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShtb2RzLCAoYWNjdW0sIG1vZCkgPT4gZmluZE1vZEZvbGRlcihpbnN0YWxsYXRpb25QYXRoLCBtb2QpXHJcbiAgICAudGhlbihtb2ROYW1lID0+IHtcclxuICAgICAgaWYgKG1vZC50eXBlID09PSAnY29sbGVjdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBtb2RDb21wb25lbnRzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ21vZENvbXBvbmVudHMnXSwgW10pO1xyXG4gICAgICBpZiAobW9kQ29tcG9uZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBtb2RDb21wb25lbnRzLnB1c2gobW9kTmFtZSk7XHJcbiAgICAgIH1cclxuICAgICAgWy4uLm1vZENvbXBvbmVudHNdLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICAgIGlkOiBtb2QuaWQsXHJcbiAgICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gcmVzb2x2ZSBtb2QgbmFtZScsIGVycik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfSksIFtdKTtcclxufVxyXG5cclxuY29uc3QgdG9nZ2xlTW9kc1N0YXRlID0gYXN5bmMgKGNvbnRleHQsIHByb3BzLCBlbmFibGVkKSA9PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBtb2RNYXAgPSBhd2FpdCBnZXRBbGxNb2RzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKG1vZE5hbWUgPT4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpKTtcclxuICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQpO1xyXG4gIGNvbnN0IG5ld0xPID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcclxuICAgIGlmICh0b3RhbExvY2tlZC5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgIGFjY3VtW2tleV0gPSBsb2FkT3JkZXJba2V5XTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFjY3VtW2tleV0gPSB7XHJcbiAgICAgICAgLi4ubG9hZE9yZGVyW2tleV0sXHJcbiAgICAgICAgZW5hYmxlZCxcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8gYXMgYW55KSk7XHJcbiAgcHJvcHMucmVmcmVzaCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcyk6IEpTWC5FbGVtZW50IHtcclxuICBjb25zdCB0ID0gY29udGV4dC5hcGkudHJhbnNsYXRlO1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLCB7IGlkOiAnbG9hZG9yZGVyaW5mbycgfSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2gyJywge30sIHQoJ01hbmFnaW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7IHN0eWxlOiB7IGhlaWdodDogJzMwJScgfSB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1lvdSBjYW4gYWRqdXN0IHRoZSBsb2FkIG9yZGVyIGZvciBUaGUgV2l0Y2hlciAzIGJ5IGRyYWdnaW5nIGFuZCBkcm9wcGluZyAnXHJcbiAgICAgICsgJ21vZHMgdXAgb3IgZG93biBvbiB0aGlzIHBhZ2UuICBJZiB5b3UgYXJlIHVzaW5nIHNldmVyYWwgbW9kcyB0aGF0IGFkZCBzY3JpcHRzIHlvdSBtYXkgbmVlZCB0byB1c2UgJ1xyXG4gICAgICArICd0aGUgV2l0Y2hlciAzIFNjcmlwdCBtZXJnZXIuIEZvciBtb3JlIGluZm9ybWF0aW9uIHNlZTogJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdhJywgeyBvbkNsaWNrOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL01vZGRpbmdfVGhlX1dpdGNoZXJfM193aXRoX1ZvcnRleCcpIH0sIHQoJ01vZGRpbmcgVGhlIFdpdGNoZXIgMyB3aXRoIFZvcnRleC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7XHJcbiAgICAgIHN0eWxlOiB7IGhlaWdodDogJzgwJScgfSxcclxuICAgIH0sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnUGxlYXNlIG5vdGU6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0ZvciBXaXRjaGVyIDMsIHRoZSBtb2Qgd2l0aCB0aGUgbG93ZXN0IGluZGV4IG51bWJlciAoYnkgZGVmYXVsdCwgdGhlIG1vZCBzb3J0ZWQgYXQgdGhlIHRvcCkgb3ZlcnJpZGVzIG1vZHMgd2l0aCBhIGhpZ2hlciBpbmRleCBudW1iZXIuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1lvdSBhcmUgYWJsZSB0byBtb2RpZnkgdGhlIHByaW9yaXR5IG1hbnVhbGx5IGJ5IHJpZ2h0IGNsaWNraW5nIGFueSBMTyBlbnRyeSBhbmQgc2V0IHRoZSBtb2RcXCdzIHByaW9yaXR5JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0lmIHlvdSBjYW5ub3Qgc2VlIHlvdXIgbW9kIGluIHRoaXMgbG9hZCBvcmRlciwgeW91IG1heSBuZWVkIHRvIGFkZCBpdCBtYW51YWxseSAoc2VlIG91ciB3aWtpIGZvciBkZXRhaWxzKS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnV2hlbiBtYW5hZ2luZyBtZW51IG1vZHMsIG1vZCBzZXR0aW5ncyBjaGFuZ2VkIGluc2lkZSB0aGUgZ2FtZSB3aWxsIGJlIGRldGVjdGVkIGJ5IFZvcnRleCBhcyBleHRlcm5hbCBjaGFuZ2VzIC0gdGhhdCBpcyBleHBlY3RlZCwgJ1xyXG4gICAgICAgICAgKyAnY2hvb3NlIHRvIHVzZSB0aGUgbmV3ZXIgZmlsZSBhbmQgeW91ciBzZXR0aW5ncyB3aWxsIGJlIG1hZGUgcGVyc2lzdGVudC4nLFxyXG4gICAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1lvdSBjYW4gY2hhbmdlIHRoZSB3YXkgdGhlIHByaW9yaXRpZXMgYXJlIGFzc2dpbmVkIHVzaW5nIHRoZSBcIlN3aXRjaCBUbyBQb3NpdGlvbi9QcmVmaXggYmFzZWRcIiBidXR0b24uICdcclxuICAgICAgICAgICsgJ1ByZWZpeCBiYXNlZCBpcyBsZXNzIHJlc3RyaWN0aXZlIGFuZCBhbGxvd3MgeW91IHRvIHNldCBhbnkgcHJpb3JpdHkgdmFsdWUgeW91IHdhbnQgXCI1MDAwLCA2OTk5OSwgZXRjXCIgd2hpbGUgcG9zaXRpb24gYmFzZWQgd2lsbCAnXHJcbiAgICAgICAgICArICdyZXN0cmljdCB0aGUgcHJpb3JpdGllcyB0byB0aGUgbnVtYmVyIG9mIGxvYWQgb3JkZXIgZW50cmllcyB0aGF0IGFyZSBhdmFpbGFibGUuJyxcclxuICAgICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdNZXJnZXMgZ2VuZXJhdGVkIGJ5IHRoZSBXaXRjaGVyIDMgU2NyaXB0IG1lcmdlciBtdXN0IGJlIGxvYWRlZCBmaXJzdCBhbmQgYXJlIGxvY2tlZCBpbiB0aGUgZmlyc3QgbG9hZCBvcmRlciBzbG90LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5CdXR0b24sIHtcclxuICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IHRvZ2dsZU1vZHNTdGF0ZShjb250ZXh0LCBwcm9wcywgZmFsc2UpLFxyXG4gICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnNXB4JyxcclxuICAgICAgICAgICAgd2lkdGg6ICdtaW4tY29udGVudCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sIHQoJ0Rpc2FibGUgQWxsJykpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2JyJyksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5CdXR0b24sIHtcclxuICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IHRvZ2dsZU1vZHNTdGF0ZShjb250ZXh0LCBwcm9wcywgdHJ1ZSksXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBtYXJnaW5Cb3R0b206ICc1cHgnLFxyXG4gICAgICAgICAgICB3aWR0aDogJ21pbi1jb250ZW50JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgdCgnRW5hYmxlIEFsbCAnKSksIFtdKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHF1ZXJ5U2NyaXB0TWVyZ2UoY29udGV4dCwgcmVhc29uKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ3dpdGNoZXIzLW1lcmdlJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICBtZXNzYWdlOiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgU2NyaXB0IG1lcmdlciBtYXkgbmVlZCB0byBiZSBleGVjdXRlZCcsXHJcbiAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzJywge1xyXG4gICAgICAgICAgICAgIHRleHQ6IHJlYXNvbixcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDbG9zZScgfSxcclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdSdW4gdG9vbCcsXHJcbiAgICAgICAgICBhY3Rpb246IGRpc21pc3MgPT4ge1xyXG4gICAgICAgICAgICBydW5TY3JpcHRNZXJnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjYW5NZXJnZShnYW1lLCBnYW1lRGlzY292ZXJ5KSB7XHJcbiAgaWYgKGdhbWUuaWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKHtcclxuICAgIGJhc2VGaWxlczogKCkgPT4gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaW46IHBhdGguam9pbihnYW1lRGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgICAgICAgb3V0OiBwYXRoLmpvaW4oQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBmaWx0ZXI6IGZpbGVQYXRoID0+IGZpbGVQYXRoLmVuZHNXaXRoKElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRJbnB1dEZpbGUoY29udGV4dCwgbWVyZ2VEaXIpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBnYW1lSW5wdXRGaWxlcGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKTtcclxuICByZXR1cm4gKCEhZGlzY292ZXJ5Py5wYXRoKVxyXG4gICAgPyBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihtZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSlcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgID8gZnMucmVhZEZpbGVBc3luYyhnYW1lSW5wdXRGaWxlcGF0aClcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgICA6IFByb21pc2UucmVqZWN0KHsgY29kZTogJ0VOT0VOVCcsIG1lc3NhZ2U6ICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJyB9KTtcclxufVxyXG5cclxuY29uc3QgZW1wdHlYbWwgPSAnPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+PG1ldGFkYXRhPjwvbWV0YWRhdGE+JztcclxuZnVuY3Rpb24gbWVyZ2UoZmlsZVBhdGgsIG1lcmdlRGlyLCBjb250ZXh0KSB7XHJcbiAgbGV0IG1vZERhdGE7XHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoZmlsZVBhdGgpXHJcbiAgICAudGhlbih4bWxEYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBtb2REYXRhID0gcGFyc2VYbWxTdHJpbmcoeG1sRGF0YSwgeyBpZ25vcmVfZW5jOiB0cnVlLCBub2JsYW5rczogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIFRoZSBtb2QgaXRzZWxmIGhhcyBpbnZhbGlkIHhtbCBkYXRhLlxyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBtb2QgWE1MIGRhdGEgLSBpbmZvcm0gbW9kIGF1dGhvcicsXHJcbiAgICAgICAgeyBwYXRoOiBmaWxlUGF0aCwgZXJyb3I6IGVyci5tZXNzYWdlIH0sIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgIG1vZERhdGEgPSBlbXB0eVhtbDtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAudGhlbigoKSA9PiByZWFkSW5wdXRGaWxlKGNvbnRleHQsIG1lcmdlRGlyKSlcclxuICAgIC50aGVuKG1lcmdlZERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG1lcmdlZCA9IHBhcnNlWG1sU3RyaW5nKG1lcmdlZERhdGEsIHsgaWdub3JlX2VuYzogdHJ1ZSwgbm9ibGFua3M6IHRydWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtZXJnZWQpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBtZXJnZWQgZmlsZSAtIGlmIGl0J3MgaW52YWxpZCBjaGFuY2VzIGFyZSB3ZSBtZXNzZWQgdXBcclxuICAgICAgICAvLyAgc29tZWhvdywgcmVhc29uIHdoeSB3ZSdyZSBnb2luZyB0byBhbGxvdyB0aGlzIGVycm9yIHRvIGdldCByZXBvcnRlZC5cclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBtZXJnZWQgWE1MIGRhdGEnLCBlcnIsIHtcclxuICAgICAgICAgIGFsbG93UmVwb3J0OiB0cnVlLFxyXG4gICAgICAgICAgYXR0YWNobWVudHM6IFtcclxuICAgICAgICAgICAgeyBpZDogJ19fbWVyZ2VkL2lucHV0LnhtbCcsIHR5cGU6ICdkYXRhJywgZGF0YTogbWVyZ2VkRGF0YSxcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1dpdGNoZXIgMyBtZW51IG1vZCBtZXJnZWQgZGF0YScgfSxcclxuICAgICAgICAgICAgeyBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbG9hZE9yZGVyYCwgdHlwZTogJ2RhdGEnLCBkYXRhOiBsb2FkT3JkZXIsXHJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IGxvYWQgb3JkZXInIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBtZXJnZWQgWE1MIGRhdGEnKSk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAudGhlbihnYW1lSW5kZXhGaWxlID0+IHtcclxuICAgICAgY29uc3QgbW9kVmFycyA9IG1vZERhdGEuZmluZCgnLy9WYXInKTtcclxuICAgICAgY29uc3QgZ2FtZVZhcnMgPSBnYW1lSW5kZXhGaWxlLmZpbmQ8RWxlbWVudD4oJy8vVmFyJyk7XHJcblxyXG4gICAgICBtb2RWYXJzLmZvckVhY2gobW9kVmFyID0+IHtcclxuICAgICAgICBjb25zdCBtYXRjaGVyID0gKGdhbWVWYXIpID0+IHtcclxuICAgICAgICAgIGxldCBnYW1lVmFyUGFyZW50O1xyXG4gICAgICAgICAgbGV0IG1vZFZhclBhcmVudDtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGdhbWVWYXJQYXJlbnQgPSBnYW1lVmFyLnBhcmVudCgpLnBhcmVudCgpO1xyXG4gICAgICAgICAgICBtb2RWYXJQYXJlbnQgPSBtb2RWYXIucGFyZW50KCkucGFyZW50KCk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgLy8gVGhpcyBnYW1lIHZhcmlhYmxlIG11c3QndmUgYmVlbiByZXBsYWNlZCBpbiBhIHByZXZpb3VzXHJcbiAgICAgICAgICAgIC8vICBpdGVyYXRpb24uXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoKHR5cGVvZihnYW1lVmFyUGFyZW50Py5hdHRyKSAhPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICB8fCAodHlwZW9mKG1vZFZhclBhcmVudD8uYXR0cikgIT09ICdmdW5jdGlvbicpKSB7XHJcbiAgICAgICAgICAgICAvLyBUaGlzIGlzIGFjdHVhbGx5IHF1aXRlIHByb2JsZW1hdGljIC0gaXQgcHJldHR5IG11Y2ggbWVhbnNcclxuICAgICAgICAgICAgIC8vICB0aGF0IGVpdGhlciB0aGUgbW9kIG9yIHRoZSBnYW1lIGl0c2VsZiBoYXMgZ2FtZSB2YXJpYWJsZXNcclxuICAgICAgICAgICAgIC8vICBsb2NhdGVkIG91dHNpZGUgYSBncm91cC4gRWl0aGVyIHRoZSBnYW1lIGlucHV0IGZpbGUgaXMgY29ycnVwdGVkXHJcbiAgICAgICAgICAgICAvLyAgKG1hbnVhbCB0YW1wZXJpbmc/KSBvciB0aGUgbW9kIGl0c2VsZiBpcy4gVGhhbmtmdWxseSB3ZSB3aWxsIGJlXHJcbiAgICAgICAgICAgICAvLyAgY3JlYXRpbmcgdGhlIG1pc3NpbmcgZ3JvdXAsIGJ1dCBpdCBsZWFkcyB0byB0aGUgcXVlc3Rpb24sIHdoYXRcclxuICAgICAgICAgICAgIC8vICBvdGhlciBzdXJwcmlzZXMgYXJlIHdlIGdvaW5nIHRvIGVuY291bnRlciBmdXJ0aGVyIGRvd24gdGhlIGxpbmUgP1xyXG4gICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZmluZCBwYXJlbnQgZ3JvdXAgb2YgbW9kIHZhcmlhYmxlJywgbW9kVmFyKTtcclxuICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuICgoZ2FtZVZhclBhcmVudC5hdHRyKCdpZCcpLnZhbHVlKCkgPT09IG1vZFZhclBhcmVudC5hdHRyKCdpZCcpLnZhbHVlKCkpXHJcbiAgICAgICAgICAgICYmIChnYW1lVmFyLmF0dHIoJ2lkJykudmFsdWUoKSA9PT0gbW9kVmFyLmF0dHIoJ2lkJykudmFsdWUoKSkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nVmFyID0gZ2FtZVZhcnMuZmluZChtYXRjaGVyKTtcclxuICAgICAgICBpZiAoZXhpc3RpbmdWYXIpIHtcclxuICAgICAgICAgIGV4aXN0aW5nVmFyLnJlcGxhY2UobW9kVmFyLmNsb25lKCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBwYXJlbnRHcm91cCA9IG1vZFZhci5wYXJlbnQoKS5wYXJlbnQoKTtcclxuICAgICAgICAgIGNvbnN0IGdyb3VwSWQgPSBwYXJlbnRHcm91cC5hdHRyKCdpZCcpLnZhbHVlKCk7XHJcbiAgICAgICAgICBjb25zdCBtYXRjaGluZ0luZGV4R3JvdXAgPSBnYW1lSW5kZXhGaWxlLmZpbmQ8RWxlbWVudD4oJy8vR3JvdXAnKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGdyb3VwID0+IGdyb3VwLmF0dHIoJ2lkJykudmFsdWUoKSA9PT0gZ3JvdXBJZCk7XHJcbiAgICAgICAgICBpZiAobWF0Y2hpbmdJbmRleEdyb3VwLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgLy8gU29tZXRoaW5nJ3Mgd3Jvbmcgd2l0aCB0aGUgZmlsZSAtIGJhY2sgb2ZmLlxyXG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgdXRpbC5EYXRhSW52YWxpZCgnRHVwbGljYXRlIGdyb3VwIGVudHJpZXMgZm91bmQgaW4gZ2FtZSBpbnB1dC54bWwnXHJcbiAgICAgICAgICAgICAgKyBgXFxuXFxuJHtwYXRoLmpvaW4obWVyZ2VEaXIsIElOUFVUX1hNTF9GSUxFTkFNRSl9XFxuXFxuYFxyXG4gICAgICAgICAgICAgICsgJ2ZpbGUgLSBwbGVhc2UgZml4IHRoaXMgbWFudWFsbHkgYmVmb3JlIGF0dGVtcHRpbmcgdG8gcmUtaW5zdGFsbCB0aGUgbW9kJyk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRHVwbGljYXRlIGdyb3VwIGVudHJpZXMgZGV0ZWN0ZWQnLCBlcnIsXHJcbiAgICAgICAgICAgICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaGluZ0luZGV4R3JvdXAubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gYWRkIHRoZSBncm91cCBBTkQgdGhlIHZhci5cclxuICAgICAgICAgICAgY29uc3QgdXNlckNvbmZpZyA9IGdhbWVJbmRleEZpbGUuZ2V0PEVsZW1lbnQ+KCcvL1VzZXJDb25maWcnKTtcclxuICAgICAgICAgICAgdXNlckNvbmZpZy5hZGRDaGlsZChwYXJlbnRHcm91cC5jbG9uZSgpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIChtYXRjaGluZ0luZGV4R3JvdXBbMF0uY2hpbGQoMCkgYXMgRWxlbWVudCkuYWRkQ2hpbGQobW9kVmFyLmNsb25lKCkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKG1lcmdlRGlyLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gICAgICAgIGdhbWVJbmRleEZpbGUpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ2lucHV0LnhtbCBtZXJnZSBmYWlsZWQnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuY29uc3QgU0NSSVBUX01FUkdFUl9GSUxFUyA9IFsnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnXTtcclxuZnVuY3Rpb24gc2NyaXB0TWVyZ2VyVGVzdChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3QgbWF0Y2hlciA9IChmaWxlID0+IFNDUklQVF9NRVJHRVJfRklMRVMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZmlsZXMuZmlsdGVyKG1hdGNoZXIpLmxlbmd0aCA+IDApKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogU0NSSVBUX01FUkdFUl9GSUxFUyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLCBlcnJNZXNzYWdlKSB7XHJcbiAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcclxuICBjb25zdCB1c2VyQ2FuY2VsZWQgPSBlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZDtcclxuICBpZiAodXNlckNhbmNlbGVkKSB7XHJcbiAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xyXG4gIH1cclxuICBjb25zdCBidXN5UmVzb3VyY2UgPSBlcnIgaW5zdGFuY2VvZiBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yO1xyXG4gIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcclxuICAgIGFsbG93UmVwb3J0ID0gZXJyLmFsbG93UmVwb3J0O1xyXG4gICAgZXJyLm1lc3NhZ2UgPSBlcnIuZXJyb3JNZXNzYWdlO1xyXG4gIH1cclxuXHJcbiAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKGVyck1lc3NhZ2UsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICByZXR1cm47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyKGNvbnRleHQsIGZpbGVzKSB7XHJcbiAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIE1vZCcsICdJdCBsb29rcyBsaWtlIHlvdSB0cmllZCB0byBpbnN0YWxsICdcclxuICAgICsgJ1RoZSBXaXRjaGVyIDMgU2NyaXB0IE1lcmdlciwgd2hpY2ggaXMgYSB0b29sIGFuZCBub3QgYSBtb2QgZm9yIFRoZSBXaXRjaGVyIDMuXFxuXFxuJ1xyXG4gICAgKyAnVGhlIHNjcmlwdCBtZXJnZXIgc2hvdWxkXFwndmUgYmVlbiBpbnN0YWxsZWQgYXV0b21hdGljYWxseSBieSBWb3J0ZXggYXMgc29vbiBhcyB5b3UgYWN0aXZhdGVkIHRoaXMgZXh0ZW5zaW9uLiAnXHJcbiAgICArICdJZiB0aGUgZG93bmxvYWQgb3IgaW5zdGFsbGF0aW9uIGhhcyBmYWlsZWQgZm9yIGFueSByZWFzb24gLSBwbGVhc2UgbGV0IHVzIGtub3cgd2h5LCBieSByZXBvcnRpbmcgdGhlIGVycm9yIHRocm91Z2ggJ1xyXG4gICAgKyAnb3VyIGZlZWRiYWNrIHN5c3RlbSBhbmQgbWFrZSBzdXJlIHRvIGluY2x1ZGUgdm9ydGV4IGxvZ3MuIFBsZWFzZSBub3RlOiBpZiB5b3VcXCd2ZSBpbnN0YWxsZWQgJ1xyXG4gICAgKyAndGhlIHNjcmlwdCBtZXJnZXIgaW4gcHJldmlvdXMgdmVyc2lvbnMgb2YgVm9ydGV4IGFzIGEgbW9kIGFuZCBTVElMTCBoYXZlIGl0IGluc3RhbGxlZCAnXHJcbiAgICArICcoaXRcXCdzIHByZXNlbnQgaW4geW91ciBtb2QgbGlzdCkgLSB5b3Ugc2hvdWxkIGNvbnNpZGVyIHVuLWluc3RhbGxpbmcgaXQgZm9sbG93ZWQgYnkgYSBWb3J0ZXggcmVzdGFydDsgJ1xyXG4gICAgKyAndGhlIGF1dG9tYXRpYyBtZXJnZXIgaW5zdGFsbGVyL3VwZGF0ZXIgc2hvdWxkIHRoZW4ga2ljayBvZmYgYW5kIHNldCB1cCB0aGUgdG9vbCBmb3IgeW91LicsXHJcbiAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdJbnZhbGlkIG1vZCcpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBXM1JlZHVjZXIpO1xyXG4gIGxldCBwcmlvcml0eU1hbmFnZXI7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMycsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiAnTW9kcycsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIHNldHVwOiB0b0JsdWUoKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSksXHJcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXHJcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogJzI5MjAzMCcsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiAyOTIwMzAsXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogRE9fTk9UX0RFUExPWSxcclxuICAgICAgaWdub3JlRGVwbG95OiBET19OT1RfREVQTE9ZLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZ2V0RExDUGF0aCA9IChnYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0RMQycpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGdldFRMUGF0aCA9IChnYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGlzVFczID0gKGdhbWVJZCA9IHVuZGVmaW5lZCkgPT4ge1xyXG4gICAgaWYgKGdhbWVJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcclxuICB9O1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2RzLWFjdGlvbi1pY29ucycsIDMwMCwgJ3N0YXJ0LWluc3RhbGwnLCB7fSwgJ0ltcG9ydCBTY3JpcHQgTWVyZ2VzJyxcclxuICAgIGluc3RhbmNlSWRzID0+IHsgbWFrZU9uQ29udGV4dEltcG9ydChjb250ZXh0LCBpbnN0YW5jZUlkc1swXSk7IH0sXHJcbiAgICBpbnN0YW5jZUlkcyA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgICBpZiAobW9kc1tpbnN0YW5jZUlkcz8uWzBdXT8udHlwZSAhPT0gJ2NvbGxlY3Rpb24nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgICByZXR1cm4gYWN0aXZlR2FtZUlkID09PSBHQU1FX0lEO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzdGwnLCAyNSwgdG9CbHVlKHRlc3RTdXBwb3J0ZWRUTCksIHRvQmx1ZShpbnN0YWxsVEwpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21peGVkJywgMzAsIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkTWl4ZWQpLCB0b0JsdWUoaW5zdGFsbE1peGVkKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNjb250ZW50JywgNTAsXHJcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsXHJcbiAgICB0b0JsdWUodGVzdE1lbnVNb2RSb290IGFzIGFueSksIHRvQmx1ZShpbnN0YWxsTWVudU1vZCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NjcmlwdG1lcmdlcmR1bW15JywgMTUsXHJcbiAgICB0b0JsdWUoc2NyaXB0TWVyZ2VyVGVzdCksIHRvQmx1ZSgoZmlsZXMpID0+IHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyKGNvbnRleHQsIGZpbGVzKSkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjN0bCcsIDI1LCBpc1RXMywgZ2V0VExQYXRoLCB0b0JsdWUodGVzdFRMKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzZGxjJywgMjUsIGlzVFczLCBnZXRETENQYXRoLCB0b0JsdWUodGVzdERMQykpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsXHJcbiAgICBpc1RXMywgZ2V0VExQYXRoLCB0b0JsdWUodGVzdE1lbnVNb2RSb290IGFzIGFueSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMsXHJcbiAgICAoZ2FtZSkgPT4gcGF0aC5qb2luKFVOSUFQUC5nZXRQYXRoKCdkb2N1bWVudHMnKSwgJ1RoZSBXaXRjaGVyIDMnKSxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1lcmdlKGNhbk1lcmdlLFxyXG4gICAgKGZpbGVQYXRoLCBtZXJnZURpcikgPT4gbWVyZ2UoZmlsZVBhdGgsIG1lcmdlRGlyLCBjb250ZXh0KSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcclxuXHJcbiAgcmVnaXN0ZXJBY3Rpb25zKHsgY29udGV4dCwgcmVmcmVzaEZ1bmMsIGdldFByaW9yaXR5TWFuYWdlcjogKCkgPT4gcHJpb3JpdHlNYW5hZ2VyIH0pO1xyXG5cclxuICBjb250ZXh0WydyZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlJ10oXHJcbiAgICAnd2l0Y2hlcjNfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSwgY29sbGVjdGlvbjogdHlwZXMuSU1vZCkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXHJcbiAgICAodCkgPT4gdCgnV2l0Y2hlciAzIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyUHJvZmlsZUZlYXR1cmUoXHJcbiAgICAnbG9jYWxfbWVyZ2VzJywgJ2Jvb2xlYW4nLCAnc2V0dGluZ3MnLCAnUHJvZmlsZSBEYXRhJyxcclxuICAgICdUaGlzIHByb2ZpbGUgd2lsbCBzdG9yZSBhbmQgcmVzdG9yZSBwcm9maWxlIHNwZWNpZmljIGRhdGEgKG1lcmdlZCBzY3JpcHRzLCBsb2Fkb3JkZXIsIGV0Yykgd2hlbiBzd2l0Y2hpbmcgcHJvZmlsZXMnLFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xyXG4gICAgICByZXR1cm4gYWN0aXZlR2FtZUlkID09PSBHQU1FX0lEO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJywgJ2NvbGxlY3Rpb24nXTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSBhcyBhbnk7XHJcbiAgICB9LFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBmaWx0ZXI6IChtb2RzKSA9PiBtb2RzLmZpbHRlcihtb2QgPT4gIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2QudHlwZSkpLFxyXG4gICAgcHJlU29ydDogKGl0ZW1zOiBhbnlbXSwgZGlyZWN0aW9uOiBhbnksIHVwZGF0ZVR5cGU6IGFueSkgPT4ge1xyXG4gICAgICByZXR1cm4gcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBwcmlvcml0eU1hbmFnZXIpIGFzIGFueTtcclxuICAgIH0sXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgY2FsbGJhY2s6IChsb2FkT3JkZXIsIHVwZGF0ZVR5cGUpID0+IHtcclxuICAgICAgaWYgKGxvYWRPcmRlciA9PT0gX1BSRVZJT1VTX0xPKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoX1BSRVZJT1VTX0xPICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpO1xyXG4gICAgICB9XHJcbiAgICAgIF9QUkVWSU9VU19MTyA9IGxvYWRPcmRlcjtcclxuICAgICAgc2V0SU5JU3RydWN0KGNvbnRleHQsIGxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHdyaXRlVG9Nb2RTZXR0aW5ncygpKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgcmV2ZXJ0TE9GaWxlID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSkge1xyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgdW5kZWZpbmVkKTtcclxuICAgICAgcmV0dXJuIGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpLnRoZW4oKG1hbnVhbGx5QWRkZWQpID0+IHtcclxuICAgICAgICBpZiAobWFudWFsbHlBZGRlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdTdHJ1Y3QgPSB7fTtcclxuICAgICAgICAgIG1hbnVhbGx5QWRkZWQuZm9yRWFjaCgobW9kLCBpZHgpID0+IHtcclxuICAgICAgICAgICAgbmV3U3RydWN0W21vZF0gPSB7XHJcbiAgICAgICAgICAgICAgRW5hYmxlZDogMSxcclxuICAgICAgICAgICAgICBQcmlvcml0eTogKChsb2FkT3JkZXIgIT09IHVuZGVmaW5lZCAmJiAhIWxvYWRPcmRlclttb2RdKVxyXG4gICAgICAgICAgICAgICAgPyBwYXJzZUludChsb2FkT3JkZXJbbW9kXS5wcmVmaXgsIDEwKSA6IGlkeCkgKyAxLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgX0lOSV9TVFJVQ1QgPSBuZXdTdHJ1Y3Q7XHJcbiAgICAgICAgICB3cml0ZVRvTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmVmcmVzaEZ1bmM/LigpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgICAgICAgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICAgICAgOiBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgdmFsaWRhdGVQcm9maWxlID0gKHByb2ZpbGVJZCwgc3RhdGUpID0+IHtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgaWYgKCEhYWN0aXZlUHJvZmlsZSAmJiAhIWRlcGxveVByb2ZpbGUgJiYgKGRlcGxveVByb2ZpbGUuaWQgIT09IGFjdGl2ZVByb2ZpbGUuaWQpKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhY3RpdmVQcm9maWxlO1xyXG4gIH07XHJcblxyXG4gIGxldCBwcmV2RGVwbG95bWVudCA9IFtdO1xyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBwcmlvcml0eU1hbmFnZXIgPSBuZXcgUHJpb3JpdHlNYW5hZ2VyKGNvbnRleHQuYXBpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIGFzeW5jIChnYW1lTW9kZSkgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICAvLyBKdXN0IGluIGNhc2UgdGhlIHNjcmlwdCBtZXJnZXIgbm90aWZpY2F0aW9uIGlzIHN0aWxsXHJcbiAgICAgICAgLy8gIHByZXNlbnQuXHJcbiAgICAgICAgY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignd2l0Y2hlcjMtbWVyZ2UnKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIGdhbWVNb2RlKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcbiAgICAgICAgaWYgKGxhc3RQcm9mSWQgIT09IGFjdGl2ZVByb2Y/LmlkKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShjb250ZXh0LCBsYXN0UHJvZklkKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0LCBhY3RpdmVQcm9mPy5pZCkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlc3RvcmUgcHJvZmlsZSBtZXJnZWQgZmlsZXMnLCBlcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCd3aWxsLWRlcGxveScsIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbWVudU1vZC5vbldpbGxEZXBsb3koY29udGV4dC5hcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChKU09OLnN0cmluZ2lmeShwcmV2RGVwbG95bWVudCkgIT09IEpTT04uc3RyaW5naWZ5KGRlcGxveW1lbnQpKSB7XHJcbiAgICAgICAgcHJldkRlcGxveW1lbnQgPSBkZXBsb3ltZW50O1xyXG4gICAgICAgIHF1ZXJ5U2NyaXB0TWVyZ2UoY29udGV4dCwgJ1lvdXIgbW9kcyBzdGF0ZS9sb2FkIG9yZGVyIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgeW91IHJhbiAnXHJcbiAgICAgICAgICArICd0aGUgc2NyaXB0IG1lcmdlci4gWW91IG1heSB3YW50IHRvIHJ1biB0aGUgbWVyZ2VyIHRvb2wgYW5kIGNoZWNrIHdoZXRoZXIgYW55IG5ldyBzY3JpcHQgY29uZmxpY3RzIGFyZSAnXHJcbiAgICAgICAgICArICdwcmVzZW50LCBvciBpZiBleGlzdGluZyBtZXJnZXMgaGF2ZSBiZWNvbWUgdW5lY2Vzc2FyeS4gUGxlYXNlIGFsc28gbm90ZSB0aGF0IGFueSBsb2FkIG9yZGVyIGNoYW5nZXMgJ1xyXG4gICAgICAgICAgKyAnbWF5IGFmZmVjdCB0aGUgb3JkZXIgaW4gd2hpY2ggeW91ciBjb25mbGljdGluZyBtb2RzIGFyZSBtZWFudCB0byBiZSBtZXJnZWQsIGFuZCBtYXkgcmVxdWlyZSB5b3UgdG8gJ1xyXG4gICAgICAgICAgKyAncmVtb3ZlIHRoZSBleGlzdGluZyBtZXJnZSBhbmQgcmUtYXBwbHkgaXQuJyk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgICAgY29uc3QgZG9jRmlsZXMgPSBkZXBsb3ltZW50Wyd3aXRjaGVyM21lbnVtb2Ryb290J11cclxuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gZmlsZS5yZWxQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcclxuICAgICAgY29uc3QgbWVudU1vZFByb21pc2UgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKGRvY0ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1lbnUgbW9kcyBkZXBsb3llZCAtIHJlbW92ZSB0aGUgbW9kLlxyXG4gICAgICAgICAgcmV0dXJuIG1lbnVNb2QucmVtb3ZlTW9kKGNvbnRleHQuYXBpLCBhY3RpdmVQcm9maWxlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIG1lbnVNb2Qub25EaWREZXBsb3koY29udGV4dC5hcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgICAgIC50aGVuKGFzeW5jIG1vZElkID0+IHtcclxuICAgICAgICAgICAgICBpZiAobW9kSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5hcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIG1vZElkKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiBtZW51TW9kUHJvbWlzZSgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gc2V0SU5JU3RydWN0KGNvbnRleHQsIGxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyKSlcclxuICAgICAgICAudGhlbigoKSA9PiB3cml0ZVRvTW9kU2V0dGluZ3MoKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICByZWZyZXNoRnVuYz8uKCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICAgIH0pO1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdwcm9maWxlLXdpbGwtY2hhbmdlJywgYXN5bmMgKG5ld1Byb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIG5ld1Byb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJpb3JpdHlUeXBlKHByaW9yaXR5VHlwZSkpO1xyXG5cclxuICAgICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShjb250ZXh0LCBsYXN0UHJvZklkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQsIHByb2ZpbGUuaWQpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBtZXJnZWQgaXRlbXMnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2V0dGluZ3MnLCAnd2l0Y2hlcjMnXSwgKHByZXYsIGN1cnJlbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8IHByaW9yaXR5TWFuYWdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICAgIHByaW9yaXR5TWFuYWdlci5wcmlvcml0eVR5cGUgPSBwcmlvcml0eVR5cGU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3B1cmdlLW1vZHMnLCAoKSA9PiB7XHJcbiAgICAgIHJldmVydExPRmlsZSgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=