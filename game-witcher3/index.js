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
    iconbarActions_1.registerActions({
        context,
        refreshFunc,
        getPriorityManager: () => priorityManager,
        getModLimitPatcher: () => modLimitPatcher,
    });
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
    context.registerTest('tw3-mod-limit-breach', 'gamemode-activated', () => bluebird_1.default.resolve(tests_1.testModLimitBreach(context.api, modLimitPatcher)));
    context.registerTest('tw3-mod-limit-breach', 'mod-activated', () => bluebird_1.default.resolve(tests_1.testModLimitBreach(context.api, modLimitPatcher)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLHVDQUFtRDtBQUNuRCxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLG9EQUFzQztBQUN0QywyQ0FBa0Y7QUFDbEYsNERBQThDO0FBQzlDLHNFQUFxQztBQUVyQywyREFBcUY7QUFFckYsc0ZBQThEO0FBRTlELHdEQUFnQztBQUNoQyxpREFBMkY7QUFFM0YscUNBSWtCO0FBRWxCLG1DQUE2QztBQUU3QyxtREFBa0Q7QUFFbEQscURBQW1EO0FBQ25ELHVEQUFvRDtBQUVwRCw2Q0FBZ0U7QUFDaEUsK0NBQW1FO0FBRW5FLG1FQUE0RDtBQUU1RCx1Q0FBNEM7QUFDNUMseUNBQXVDO0FBRXZDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBRTFCLE1BQU0sc0JBQXNCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUVoRyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDckIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBRXRCLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUseUJBQWdCO1FBQ3BCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHlCQUF5QjtRQUMvQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMseUJBQXlCO1FBQzNDLGFBQWEsRUFBRTtZQUNiLHlCQUF5QjtTQUMxQjtLQUNGO0NBQ0YsQ0FBQztBQUVGLFNBQVMsa0JBQWtCO0lBQ3pCLE1BQU0sUUFBUSxHQUFHLDZCQUFvQixFQUFFLENB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QUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBFbGVtZW50LCBwYXJzZVhtbFN0cmluZyB9IGZyb20gJ2xpYnhtbGpzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIEZsZXhMYXlvdXQsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgSW5pUGFyc2VyIGZyb20gJ3ZvcnRleC1wYXJzZS1pbmknO1xyXG5pbXBvcnQgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XHJcblxyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XHJcbmltcG9ydCB7IElXM0NvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xyXG5cclxuaW1wb3J0IG1lbnVNb2QgZnJvbSAnLi9tZW51bW9kJztcclxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIsIGdldFNjcmlwdE1lcmdlckRpciwgc2V0TWVyZ2VyQ29uZmlnIH0gZnJvbSAnLi9zY3JpcHRtZXJnZXInO1xyXG5cclxuaW1wb3J0IHsgRE9fTk9UX0RFUExPWSwgRE9fTk9UX0RJU1BMQVksXHJcbiAgR0FNRV9JRCwgZ2V0TG9hZE9yZGVyRmlsZVBhdGgsIGdldFByaW9yaXR5VHlwZUJyYW5jaCwgSTE4Tl9OQU1FU1BBQ0UsXHJcbiAgSU5QVVRfWE1MX0ZJTEVOQU1FLCBMT0NLRURfUFJFRklYLCBQQVJUX1NVRkZJWCwgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcixcclxuICBTQ1JJUFRfTUVSR0VSX0lELCBVTklfUEFUQ0gsXHJcbn0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgdGVzdE1vZExpbWl0QnJlYWNoIH0gZnJvbSAnLi90ZXN0cyc7XHJcblxyXG5pbXBvcnQgeyBNb2RMaW1pdFBhdGNoZXIgfSBmcm9tICcuL21vZExpbWl0UGF0Y2gnO1xyXG5cclxuaW1wb3J0IHsgcmVnaXN0ZXJBY3Rpb25zIH0gZnJvbSAnLi9pY29uYmFyQWN0aW9ucyc7XHJcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcclxuXHJcbmltcG9ydCB7IGluc3RhbGxNaXhlZCwgdGVzdFN1cHBvcnRlZE1peGVkIH0gZnJvbSAnLi9pbnN0YWxsZXJzJztcclxuaW1wb3J0IHsgcmVzdG9yZUZyb21Qcm9maWxlLCBzdG9yZVRvUHJvZmlsZSB9IGZyb20gJy4vbWVyZ2VCYWNrdXAnO1xyXG5cclxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZXMgfSBmcm9tICcuL21lcmdlSW52ZW50b3J5UGFyc2luZyc7XHJcblxyXG5pbXBvcnQgeyBzZXRQcmlvcml0eVR5cGUgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyBXM1JlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcclxuXHJcbmNvbnN0IEdPR19JRCA9ICcxMjA3NjY0NjYzJztcclxuY29uc3QgR09HX0lEX0dPVFkgPSAnMTQ5NTEzNDMyMCc7XHJcbmNvbnN0IFNURUFNX0lEID0gJzQ5OTQ1MCc7XHJcblxyXG5jb25zdCBDT05GSUdfTUFUUklYX1JFTF9QQVRIID0gcGF0aC5qb2luKCdiaW4nLCAnY29uZmlnJywgJ3I0Z2FtZScsICd1c2VyX2NvbmZpZ19tYXRyaXgnLCAncGMnKTtcclxuXHJcbmxldCBfSU5JX1NUUlVDVCA9IHt9O1xyXG5sZXQgX1BSRVZJT1VTX0xPID0ge307XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICB7XHJcbiAgICBpZDogU0NSSVBUX01FUkdFUl9JRCxcclxuICAgIG5hbWU6ICdXMyBTY3JpcHQgTWVyZ2VyJyxcclxuICAgIGxvZ286ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxyXG4gICAgXSxcclxuICB9LFxyXG5dO1xyXG5cclxuZnVuY3Rpb24gd3JpdGVUb01vZFNldHRpbmdzKCkge1xyXG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XHJcbiAgcmV0dXJuIGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMud3JpdGVGaWxlQXN5bmMoZmlsZVBhdGgsICcnLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpXHJcbiAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAudGhlbihpbmkgPT4ge1xyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChPYmplY3Qua2V5cyhfSU5JX1NUUlVDVCksIChrZXkpID0+IHtcclxuICAgICAgICBpZiAoX0lOSV9TVFJVQ1Q/LltrZXldPy5FbmFibGVkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIC8vIEl0J3MgcG9zc2libGUgZm9yIHRoZSB1c2VyIHRvIHJ1biBtdWx0aXBsZSBvcGVyYXRpb25zIGF0IG9uY2UsXHJcbiAgICAgICAgICAvLyAgY2F1c2luZyB0aGUgc3RhdGljIGluaSBzdHJ1Y3R1cmUgdG8gYmUgbW9kaWZpZWRcclxuICAgICAgICAgIC8vICBlbHNld2hlcmUgd2hpbGUgd2UncmUgYXR0ZW1wdGluZyB0byB3cml0ZSB0byBmaWxlLiBUaGUgdXNlciBtdXN0J3ZlIGJlZW5cclxuICAgICAgICAgIC8vICBtb2RpZnlpbmcgdGhlIGxvYWQgb3JkZXIgd2hpbGUgZGVwbG95aW5nLiBUaGlzIHNob3VsZFxyXG4gICAgICAgICAgLy8gIG1ha2Ugc3VyZSB3ZSBkb24ndCBhdHRlbXB0IHRvIHdyaXRlIGFueSBpbnZhbGlkIG1vZCBlbnRyaWVzLlxyXG4gICAgICAgICAgLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvODQzN1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbmkuZGF0YVtrZXldID0ge1xyXG4gICAgICAgICAgRW5hYmxlZDogX0lOSV9TVFJVQ1Rba2V5XS5FbmFibGVkLFxyXG4gICAgICAgICAgUHJpb3JpdHk6IF9JTklfU1RSVUNUW2tleV0uUHJpb3JpdHksXHJcbiAgICAgICAgICBWSzogX0lOSV9TVFJVQ1Rba2V5XS5WSyxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oKCkgPT4gcGFyc2VyLndyaXRlKGZpbGVQYXRoLCBpbmkpKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIucGF0aCAhPT0gdW5kZWZpbmVkICYmIFsnRVBFUk0nLCAnRUJVU1knXS5pbmNsdWRlcyhlcnIuY29kZSkpXHJcbiAgICAgID8gUHJvbWlzZS5yZWplY3QobmV3IFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IoZXJyLnBhdGgpKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVNb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgLy8gVGhlb3JldGljYWxseSB0aGUgV2l0Y2hlciAzIGRvY3VtZW50cyBwYXRoIHNob3VsZCBiZVxyXG4gIC8vICBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKGVpdGhlciBieSB1cyBvciB0aGUgZ2FtZSkgYnV0XHJcbiAgLy8gIGp1c3QgaW4gY2FzZSBpdCBnb3QgcmVtb3ZlZCBzb21laG93LCB3ZSByZS1pbnN0YXRlIGl0XHJcbiAgLy8gIHlldCBhZ2Fpbi4uLiBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzcwNThcclxuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMud3JpdGVGaWxlQXN5bmMoZmlsZVBhdGgsICcnLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xyXG59XHJcblxyXG4vLyBBdHRlbXB0cyB0byBwYXJzZSBhbmQgcmV0dXJuIGRhdGEgZm91bmQgaW5zaWRlXHJcbi8vICB0aGUgbW9kcy5zZXR0aW5ncyBmaWxlIGlmIGZvdW5kIC0gb3RoZXJ3aXNlIHRoaXNcclxuLy8gIHdpbGwgZW5zdXJlIHRoZSBmaWxlIGlzIHByZXNlbnQuXHJcbmZ1bmN0aW9uIGVuc3VyZU1vZFNldHRpbmdzKCkge1xyXG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgPyBjcmVhdGVNb2RTZXR0aW5ncygpLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRNYW51YWxseUFkZGVkTW9kcyhjb250ZXh0KSB7XHJcbiAgcmV0dXJuIGVuc3VyZU1vZFNldHRpbmdzKCkudGhlbihpbmkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gICAgY29uc3QgaW5pRW50cmllcyA9IE9iamVjdC5rZXlzKGluaS5kYXRhKTtcclxuICAgIGNvbnN0IG1hbnVhbENhbmRpZGF0ZXMgPSBbXS5jb25jYXQoaW5pRW50cmllcywgW1VOSV9QQVRDSF0pLmZpbHRlcihlbnRyeSA9PiB7XHJcbiAgICAgIGNvbnN0IGhhc1ZvcnRleEtleSA9IHV0aWwuZ2V0U2FmZShpbmkuZGF0YVtlbnRyeV0sIFsnVksnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICByZXR1cm4gKCghaGFzVm9ydGV4S2V5KSB8fCAoaW5pLmRhdGFbZW50cnldLlZLID09PSBlbnRyeSkgJiYgIW1vZEtleXMuaW5jbHVkZXMoZW50cnkpKTtcclxuICAgIH0pIHx8IFtVTklfUEFUQ0hdO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgU2V0KG1hbnVhbENhbmRpZGF0ZXMpKTtcclxuICB9KVxyXG4gIC50aGVuKHVuaXF1ZUNhbmRpZGF0ZXMgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBIb3cvd2h5IGFyZSB3ZSBldmVuIGhlcmUgP1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkIScpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShBcnJheS5mcm9tKHVuaXF1ZUNhbmRpZGF0ZXMpLCAoYWNjdW0sIG1vZCkgPT4ge1xyXG4gICAgICBjb25zdCBtb2RGb2xkZXIgPSBwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCk7XHJcbiAgICAgIHJldHVybiBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZEZvbGRlcikpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgIC8vIE9rLCB3ZSBrbm93IHRoZSBmb2xkZXIgaXMgdGhlcmUgLSBsZXRzIGVuc3VyZSB0aGF0XHJcbiAgICAgICAgICAvLyAgaXQgYWN0dWFsbHkgY29udGFpbnMgZmlsZXMuXHJcbiAgICAgICAgICBsZXQgY2FuZGlkYXRlcyA9IFtdO1xyXG4gICAgICAgICAgYXdhaXQgcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdChwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCksIGVudHJpZXMgPT4ge1xyXG4gICAgICAgICAgICBjYW5kaWRhdGVzID0gW10uY29uY2F0KGNhbmRpZGF0ZXMsIGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICghZW50cnkuaXNEaXJlY3RvcnkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChwYXRoLmV4dG5hbWUocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkpICE9PSAnJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGVudHJ5Py5saW5rQ291bnQgPT09IHVuZGVmaW5lZCB8fCBlbnRyeS5saW5rQ291bnQgPD0gMSkpKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IChbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmRleE9mKGVyci5jb2RlKSAhPT0gLTEpXHJcbiAgICAgICAgICAgID8gbnVsbCAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcblxyXG4gICAgICAgICAgY29uc3QgbWFwcGVkID0gYXdhaXQgQmx1ZWJpcmQubWFwKGNhbmRpZGF0ZXMsIGNhbmQgPT5cclxuICAgICAgICAgICAgZnMuc3RhdEFzeW5jKGNhbmQuZmlsZVBhdGgpXHJcbiAgICAgICAgICAgICAgLnRoZW4oc3RhdHMgPT4gc3RhdHMuaXNTeW1ib2xpY0xpbmsoKVxyXG4gICAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgOiBQcm9taXNlLnJlc29sdmUoY2FuZC5maWxlUGF0aCkpXHJcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSkpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUobWFwcGVkKTtcclxuICAgICAgICB9KSlcclxuICAgICAgICAudGhlbigoZmlsZXM6IHN0cmluZ1tdKSA9PiB7XHJcbiAgICAgICAgICBpZiAoZmlsZXMuZmlsdGVyKGZpbGUgPT4gISFmaWxlKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2gobW9kKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoKGVyci5jb2RlID09PSAnRU5PRU5UJykgJiYgKGVyci5wYXRoID09PSBtb2RGb2xkZXIpKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoYWNjdW0pXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgfSwgW10pO1xyXG4gIH0pXHJcbiAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAvLyBVc2VyQ2FuY2VsZWQgd291bGQgc3VnZ2VzdCB3ZSB3ZXJlIHVuYWJsZSB0byBzdGF0IHRoZSBXMyBtb2QgZm9sZGVyXHJcbiAgICAvLyAgcHJvYmFibHkgZHVlIHRvIGEgcGVybWlzc2lvbmluZyBpc3N1ZSAoRU5PRU5UIGlzIGhhbmRsZWQgYWJvdmUpXHJcbiAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpO1xyXG4gICAgY29uc3QgcHJvY2Vzc0NhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKTtcclxuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gKCF1c2VyQ2FuY2VsZWQgJiYgIXByb2Nlc3NDYW5jZWxlZCk7XHJcbiAgICBjb25zdCBkZXRhaWxzID0gdXNlckNhbmNlbGVkXHJcbiAgICAgID8gJ1ZvcnRleCB0cmllZCB0byBzY2FuIHlvdXIgVzMgbW9kcyBmb2xkZXIgZm9yIG1hbnVhbGx5IGFkZGVkIG1vZHMgYnV0ICdcclxuICAgICAgICArICd3YXMgYmxvY2tlZCBieSB5b3VyIE9TL0FWIC0gcGxlYXNlIG1ha2Ugc3VyZSB0byBmaXggdGhpcyBiZWZvcmUgeW91ICdcclxuICAgICAgICArICdwcm9jZWVkIHRvIG1vZCBXMyBhcyB5b3VyIG1vZGRpbmcgZXhwZXJpZW5jZSB3aWxsIGJlIHNldmVyZWx5IGFmZmVjdGVkLidcclxuICAgICAgOiBlcnI7XHJcbiAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBsb29rdXAgbWFudWFsbHkgYWRkZWQgbW9kcycsXHJcbiAgICAgIGRldGFpbHMsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKTogQmx1ZWJpcmQ8c3RyaW5nPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKFxyXG4gICAgICAnSEtFWV9MT0NBTF9NQUNISU5FJyxcclxuICAgICAgJ1NvZnR3YXJlXFxcXENEIFByb2plY3QgUmVkXFxcXFRoZSBXaXRjaGVyIDMnLFxyXG4gICAgICAnSW5zdGFsbEZvbGRlcicpO1xyXG4gICAgaWYgKCFpbnN0UGF0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoaW5zdFBhdGgudmFsdWUgYXMgc3RyaW5nKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbR09HX0lEX0dPVFksIEdPR19JRCwgU1RFQU1fSURdKVxyXG4gICAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZFRMKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSAnd2l0Y2hlcjMnKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PlxyXG4gICAgICBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ21vZHMnKSAhPT0gLTEpICE9PSB1bmRlZmluZWQpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxUTChmaWxlcyxcclxuICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCxcclxuICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcclxuICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGUpIHtcclxuICBsZXQgcHJlZml4ID0gZmlsZXMucmVkdWNlKChwcmV2LCBmaWxlKSA9PiB7XHJcbiAgICBjb25zdCBjb21wb25lbnRzID0gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIGNvbnN0IGlkeCA9IGNvbXBvbmVudHMuaW5kZXhPZignbW9kcycpO1xyXG4gICAgaWYgKChpZHggPiAwKSAmJiAoKHByZXYgPT09IHVuZGVmaW5lZCkgfHwgKGlkeCA8IHByZXYubGVuZ3RoKSkpIHtcclxuICAgICAgcmV0dXJuIGNvbXBvbmVudHMuc2xpY2UoMCwgaWR4KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfVxyXG4gIH0sIHVuZGVmaW5lZCk7XHJcblxyXG4gIHByZWZpeCA9IChwcmVmaXggPT09IHVuZGVmaW5lZCkgPyAnJyA6IHByZWZpeC5qb2luKHBhdGguc2VwKSArIHBhdGguc2VwO1xyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWxlc1xyXG4gICAgLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSAmJiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChwcmVmaXgpKVxyXG4gICAgLm1hcChmaWxlID0+ICh7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbjogZmlsZS5zbGljZShwcmVmaXgubGVuZ3RoKSxcclxuICAgIH0pKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZENvbnRlbnQoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdjb250ZW50JyArIHBhdGguc2VwKSAhPT0gdW5kZWZpbmVkKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbENvbnRlbnQoZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaWxlc1xyXG4gICAgLmZpbHRlcihmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdjb250ZW50JyArIHBhdGguc2VwKSlcclxuICAgIC5tYXAoZmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IGZpbGVCYXNlID0gZmlsZS5zcGxpdChwYXRoLnNlcCkuc2xpY2UoMSkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKCdtb2QnICsgZGVzdGluYXRpb25QYXRoLCBmaWxlQmFzZSksXHJcbiAgICAgIH07XHJcbiAgfSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsTWVudU1vZChmaWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGUpIHtcclxuICAvLyBJbnB1dCBzcGVjaWZpYyBmaWxlcyBuZWVkIHRvIGJlIGluc3RhbGxlZCBvdXRzaWRlIHRoZSBtb2RzIGZvbGRlciB3aGlsZVxyXG4gIC8vICBhbGwgb3RoZXIgbW9kIGZpbGVzIGFyZSB0byBiZSBpbnN0YWxsZWQgYXMgdXN1YWwuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUocGF0aC5iYXNlbmFtZShmaWxlKSkgIT09ICcnKTtcclxuICBjb25zdCBpbnB1dEZpbGVzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gZmlsZS5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSk7XHJcbiAgY29uc3QgdW5pcXVlSW5wdXQgPSBpbnB1dEZpbGVzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcclxuICAgIC8vIFNvbWUgbW9kcyB0ZW5kIHRvIGluY2x1ZGUgYSBiYWNrdXAgZmlsZSBtZWFudCBmb3IgdGhlIHVzZXIgdG8gcmVzdG9yZVxyXG4gICAgLy8gIGhpcyBnYW1lIHRvIHZhbmlsbGEgKG9idnMgd2Ugb25seSB3YW50IHRvIGFwcGx5IHRoZSBub24tYmFja3VwKS5cclxuICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShpdGVyKTtcclxuXHJcbiAgICBpZiAoYWNjdW0uZmluZChlbnRyeSA9PiBwYXRoLmJhc2VuYW1lKGVudHJ5KSA9PT0gZmlsZU5hbWUpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gVGhpcyBjb25maWcgZmlsZSBoYXMgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoZSBhY2N1bXVsYXRvci5cclxuICAgICAgLy8gIElnbm9yZSB0aGlzIGluc3RhbmNlLlxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaW5zdGFuY2VzID0gaW5wdXRGaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBmaWxlTmFtZSk7XHJcbiAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgLy8gV2UgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgbWVudSBjb25maWcgZmlsZSAtIG1vZCBhdXRob3IgcHJvYmFibHkgaW5jbHVkZWRcclxuICAgICAgLy8gIGEgYmFja3VwIGZpbGUgdG8gcmVzdG9yZSB2YW5pbGxhIHN0YXRlLCBvciBwZXJoYXBzIHRoaXMgaXMgYSB2YXJpYW50IG1vZCB3aGljaCB3ZVxyXG4gICAgICAvLyAgY2FuJ3QgY3VycmVudGx5IHN1cHBvcnQuXHJcbiAgICAgIC8vIEl0J3MgZGlmZmljdWx0IGZvciB1cyB0byBjb3JyZWN0bHkgaWRlbnRpZnkgdGhlIGNvcnJlY3QgZmlsZSBidXQgd2UncmUgZ29pbmcgdG9cclxuICAgICAgLy8gIHRyeSBhbmQgZ3Vlc3MgYmFzZWQgb24gd2hldGhlciB0aGUgY29uZmlnIGZpbGUgaGFzIGEgXCJiYWNrdXBcIiBmb2xkZXIgc2VnbWVudFxyXG4gICAgICAvLyAgb3RoZXJ3aXNlIHdlIGp1c3QgYWRkIHRoZSBmaXJzdCBmaWxlIGluc3RhbmNlIChJJ20gZ29pbmcgdG8gcmVncmV0IGFkZGluZyB0aGlzIGFyZW4ndCBJID8pXHJcbiAgICAgIGlmIChpdGVyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYmFja3VwJykgPT09IC0xKSB7XHJcbiAgICAgICAgLy8gV2UncmUgZ29pbmcgdG8gYXNzdW1lIHRoYXQgdGhpcyBpcyB0aGUgcmlnaHQgZmlsZS5cclxuICAgICAgICBhY2N1bS5wdXNoKGl0ZXIpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBUaGlzIGlzIGEgdW5pcXVlIG1lbnUgY29uZmlndXJhdGlvbiBmaWxlIC0gYWRkIGl0LlxyXG4gICAgICBhY2N1bS5wdXNoKGl0ZXIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIFtdKTtcclxuXHJcbiAgbGV0IG90aGVyRmlsZXMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiAhaW5wdXRGaWxlcy5pbmNsdWRlcyhmaWxlKSk7XHJcbiAgY29uc3QgaW5wdXRGaWxlRGVzdGluYXRpb24gPSBDT05GSUdfTUFUUklYX1JFTF9QQVRIO1xyXG5cclxuICAvLyBHZXQgdGhlIG1vZCdzIHJvb3QgZm9sZGVyLlxyXG4gIGNvbnN0IGJpbklkeCA9IHVuaXF1ZUlucHV0WzBdLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdiaW4nKTtcclxuXHJcbiAgLy8gUmVmZXJzIHRvIGZpbGVzIGxvY2F0ZWQgaW5zaWRlIHRoZSBhcmNoaXZlJ3MgJ01vZHMnIGRpcmVjdG9yeS5cclxuICAvLyAgVGhpcyBhcnJheSBjYW4gdmVyeSB3ZWxsIGJlIGVtcHR5IGlmIGEgbW9kcyBmb2xkZXIgZG9lc24ndCBleGlzdFxyXG4gIGNvbnN0IG1vZEZpbGVzID0gb3RoZXJGaWxlcy5maWx0ZXIoZmlsZSA9PlxyXG4gICAgZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5pbmNsdWRlcygnbW9kcycpKTtcclxuXHJcbiAgY29uc3QgbW9kc0lkeCA9IChtb2RGaWxlcy5sZW5ndGggPiAwKVxyXG4gICAgPyBtb2RGaWxlc1swXS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdtb2RzJylcclxuICAgIDogLTE7XHJcbiAgY29uc3QgbW9kTmFtZXMgPSAobW9kc0lkeCAhPT0gLTEpXHJcbiAgICA/IG1vZEZpbGVzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcclxuICAgICAgY29uc3QgbW9kTmFtZSA9IGl0ZXIuc3BsaXQocGF0aC5zZXApLnNwbGljZShtb2RzSWR4ICsgMSwgMSkuam9pbigpO1xyXG4gICAgICBpZiAoIWFjY3VtLmluY2x1ZGVzKG1vZE5hbWUpKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChtb2ROYW1lKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSlcclxuICAgIDogW107XHJcbiAgLy8gVGhlIHByZXNlbmNlIG9mIGEgbW9kcyBmb2xkZXIgaW5kaWNhdGVzIHRoYXQgdGhpcyBtb2QgbWF5IHByb3ZpZGVcclxuICAvLyAgc2V2ZXJhbCBtb2QgZW50cmllcy5cclxuICBpZiAobW9kRmlsZXMubGVuZ3RoID4gMCkge1xyXG4gICAgb3RoZXJGaWxlcyA9IG90aGVyRmlsZXMuZmlsdGVyKGZpbGUgPT4gIW1vZEZpbGVzLmluY2x1ZGVzKGZpbGUpKTtcclxuICB9XHJcblxyXG4gIC8vIFdlJ3JlIGhvcGluZyB0aGF0IHRoZSBtb2QgYXV0aG9yIGhhcyBpbmNsdWRlZCB0aGUgbW9kIG5hbWUgaW4gdGhlIGFyY2hpdmUnc1xyXG4gIC8vICBzdHJ1Y3R1cmUgLSBpZiBoZSBkaWRuJ3QgLSB3ZSdyZSBnb2luZyB0byB1c2UgdGhlIGRlc3RpbmF0aW9uIHBhdGggaW5zdGVhZC5cclxuICBjb25zdCBtb2ROYW1lID0gKGJpbklkeCA+IDApXHJcbiAgICA/IGlucHV0RmlsZXNbMF0uc3BsaXQocGF0aC5zZXApW2JpbklkeCAtIDFdXHJcbiAgICA6ICgnbW9kJyArIHBhdGguYmFzZW5hbWUoZGVzdGluYXRpb25QYXRoLCAnLmluc3RhbGxpbmcnKSkucmVwbGFjZSgvXFxzL2csICcnKTtcclxuXHJcbiAgY29uc3QgdHJpbW1lZEZpbGVzID0gb3RoZXJGaWxlcy5tYXAoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzb3VyY2UgPSBmaWxlO1xyXG4gICAgbGV0IHJlbFBhdGggPSBmaWxlLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGJpbklkeCk7XHJcbiAgICBpZiAocmVsUGF0aFswXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFRoaXMgZmlsZSBtdXN0J3ZlIGJlZW4gaW5zaWRlIHRoZSByb290IG9mIHRoZSBhcmNoaXZlO1xyXG4gICAgICAvLyAgZGVwbG95IGFzIGlzLlxyXG4gICAgICByZWxQYXRoID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmlyc3RTZWcgPSByZWxQYXRoWzBdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoZmlyc3RTZWcgPT09ICdjb250ZW50JyB8fCBmaXJzdFNlZy5lbmRzV2l0aChQQVJUX1NVRkZJWCkpIHtcclxuICAgICAgcmVsUGF0aCA9IFtdLmNvbmNhdChbJ01vZHMnLCBtb2ROYW1lXSwgcmVsUGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc291cmNlLFxyXG4gICAgICByZWxQYXRoOiByZWxQYXRoLmpvaW4ocGF0aC5zZXApLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgdG9Db3B5SW5zdHJ1Y3Rpb24gPSAoc291cmNlLCBkZXN0aW5hdGlvbikgPT4gKHtcclxuICAgIHR5cGU6ICdjb3B5JyxcclxuICAgIHNvdXJjZSxcclxuICAgIGRlc3RpbmF0aW9uLFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBpbnB1dEluc3RydWN0aW9ucyA9IHVuaXF1ZUlucHV0Lm1hcChmaWxlID0+XHJcbiAgICB0b0NvcHlJbnN0cnVjdGlvbihmaWxlLCBwYXRoLmpvaW4oaW5wdXRGaWxlRGVzdGluYXRpb24sIHBhdGguYmFzZW5hbWUoZmlsZSkpKSk7XHJcblxyXG4gIGNvbnN0IG90aGVySW5zdHJ1Y3Rpb25zID0gdHJpbW1lZEZpbGVzLm1hcChmaWxlID0+XHJcbiAgICB0b0NvcHlJbnN0cnVjdGlvbihmaWxlLnNvdXJjZSwgZmlsZS5yZWxQYXRoKSk7XHJcblxyXG4gIGNvbnN0IG1vZEZpbGVJbnN0cnVjdGlvbnMgPSBtb2RGaWxlcy5tYXAoZmlsZSA9PlxyXG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZSwgZmlsZSkpO1xyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBbXS5jb25jYXQoaW5wdXRJbnN0cnVjdGlvbnMsIG90aGVySW5zdHJ1Y3Rpb25zLCBtb2RGaWxlSW5zdHJ1Y3Rpb25zKTtcclxuICBpZiAobW9kTmFtZXMubGVuZ3RoID4gMCkge1xyXG4gICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xyXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAga2V5OiAnbW9kQ29tcG9uZW50cycsXHJcbiAgICAgIHZhbHVlOiBtb2ROYW1lcyxcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0TWVudU1vZFJvb3QoaW5zdHJ1Y3Rpb25zOiBhbnlbXSwgZ2FtZUlkOiBzdHJpbmcpOlxyXG4gIFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdCB8IGJvb2xlYW4+IHtcclxuICBjb25zdCBwcmVkaWNhdGUgPSAoaW5zdHIpID0+ICghIWdhbWVJZClcclxuICAgID8gKChHQU1FX0lEID09PSBnYW1lSWQpICYmIChpbnN0ci5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSkpXHJcbiAgICA6ICgoaW5zdHIudHlwZSA9PT0gJ2NvcHknKSAmJiAoaW5zdHIuZGVzdGluYXRpb24uaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpKTtcclxuXHJcbiAgcmV0dXJuICghIWdhbWVJZClcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICBzdXBwb3J0ZWQ6IGluc3RydWN0aW9ucy5maW5kKHByZWRpY2F0ZSkgIT09IHVuZGVmaW5lZCxcclxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICAgICAgfSlcclxuICAgIDogUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKHByZWRpY2F0ZSkgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RUTChpbnN0cnVjdGlvbnMpIHtcclxuICBjb25zdCBtZW51TW9kRmlsZXMgPSBpbnN0cnVjdGlvbnMuZmlsdGVyKGluc3RyID0+ICEhaW5zdHIuZGVzdGluYXRpb25cclxuICAgICYmIGluc3RyLmRlc3RpbmF0aW9uLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKTtcclxuICBpZiAobWVudU1vZEZpbGVzLmxlbmd0aCA+IDApIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChcclxuICAgIGluc3RydWN0aW9uID0+ICEhaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24gJiYgaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdtb2RzJyArIHBhdGguc2VwKSxcclxuICApICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0RExDKGluc3RydWN0aW9ucykge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdHJ1Y3Rpb25zLmZpbmQoXHJcbiAgICBpbnN0cnVjdGlvbiA9PiAhIWluc3RydWN0aW9uLmRlc3RpbmF0aW9uICYmIGluc3RydWN0aW9uLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZGxjJyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3Qgbm90aWZJZCA9ICdtaXNzaW5nLXNjcmlwdC1tZXJnZXInO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiBub3RpZklkLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnV2l0Y2hlciAzIHNjcmlwdCBtZXJnZXIgaXMgbWlzc2luZy9taXNjb25maWd1cmVkJyxcclxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgYWN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyJywge1xyXG4gICAgICAgICAgICBiYmNvZGU6IGFwaS50cmFuc2xhdGUoJ1ZvcnRleCBpcyB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgU2NyaXB0IE1lcmdlclxcJ3MgbG9jYXRpb24uIFRoZSB0b29sIG5lZWRzIHRvIGJlIGRvd25sb2FkZWQgYW5kIGNvbmZpZ3VyZWQgbWFudWFsbHkuICdcclxuICAgICAgICAgICAgICArICdbdXJsPWh0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Ub29sX1NldHVwOl9XaXRjaGVyXzNfU2NyaXB0X01lcmdlcl1GaW5kIG91dCBtb3JlIGFib3V0IGhvdyB0byBjb25maWd1cmUgaXQgYXMgYSB0b29sIGZvciB1c2UgaW4gVm9ydGV4LlsvdXJsXVticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgICAgICAgICArICdOb3RlOiBXaGlsZSBzY3JpcHQgbWVyZ2luZyB3b3JrcyB3ZWxsIHdpdGggdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kcywgdGhlcmUgaXMgbm8gZ3VhcmFudGVlIGZvciBhIHNhdGlzZnlpbmcgb3V0Y29tZSBpbiBldmVyeSBzaW5nbGUgY2FzZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKTtcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHsgbGFiZWw6ICdEb3dubG9hZCBTY3JpcHQgTWVyZ2VyJywgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS93aXRjaGVyMy9tb2RzLzQ4NCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpKSB9LFxyXG4gICAgICAgICAgXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkge1xyXG4gIGNvbnN0IGZpbmRTY3JpcHRNZXJnZXIgPSAoZXJyb3IpID0+IHtcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgc2NyaXB0IG1lcmdlcicsIGVycm9yKTtcclxuICAgIGNvbnN0IHNjcmlwdE1lcmdlclBhdGggPSBnZXRTY3JpcHRNZXJnZXJEaXIoY29udGV4dCk7XHJcbiAgICBpZiAoc2NyaXB0TWVyZ2VyUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBzZXRNZXJnZXJDb25maWcoZGlzY292ZXJ5LnBhdGgsIHNjcmlwdE1lcmdlclBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZW5zdXJlUGF0aCA9IChkaXJwYXRoKSA9PlxyXG4gICAgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhkaXJwYXRoKVxyXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VFWElTVCcpXHJcbiAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLmFsbChbXHJcbiAgICBlbnN1cmVQYXRoKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSksXHJcbiAgICBlbnN1cmVQYXRoKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0RMQycpKSxcclxuICAgIGVuc3VyZVBhdGgocGF0aC5kaXJuYW1lKGdldExvYWRPcmRlckZpbGVQYXRoKCkpKV0pXHJcbiAgICAgIC50aGVuKCgpID0+IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGNvbnRleHQpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICA6IGZpbmRTY3JpcHRNZXJnZXIoZXJyKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRTY3JpcHRNZXJnZXJUb29sKGFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKCEhc2NyaXB0TWVyZ2VyPy5wYXRoKSB7XHJcbiAgICByZXR1cm4gc2NyaXB0TWVyZ2VyO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuZnVuY3Rpb24gcnVuU2NyaXB0TWVyZ2VyKGFwaSkge1xyXG4gIGNvbnN0IHRvb2wgPSBnZXRTY3JpcHRNZXJnZXJUb29sKGFwaSk7XHJcbiAgaWYgKHRvb2w/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGFwaS5ydW5FeGVjdXRhYmxlKHRvb2wucGF0aCwgW10sIHsgc3VnZ2VzdERlcGxveTogdHJ1ZSB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcnVuIHRvb2wnLCBlcnIsXHJcbiAgICAgIHsgYWxsb3dSZXBvcnQ6IFsnRVBFUk0nLCAnRUFDQ0VTUycsICdFTk9FTlQnXS5pbmRleE9mKGVyci5jb2RlKSAhPT0gLTEgfSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRBbGxNb2RzKGNvbnRleHQpIHtcclxuICAvLyBNb2QgdHlwZXMgd2UgZG9uJ3Qgd2FudCB0byBkaXNwbGF5IGluIHRoZSBMTyBwYWdlXHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBpZiAocHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIG1lcmdlZDogW10sXHJcbiAgICAgIG1hbnVhbDogW10sXHJcbiAgICAgIG1hbmFnZWQ6IFtdLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBwcm9maWxlLmlkLCAnbW9kU3RhdGUnXSwge30pO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgLy8gT25seSBzZWxlY3QgbW9kcyB3aGljaCBhcmUgZW5hYmxlZCwgYW5kIGFyZSBub3QgYSBtZW51IG1vZC5cclxuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZFN0YXRlKS5maWx0ZXIoa2V5ID0+XHJcbiAgICAoISFtb2RzW2tleV0gJiYgbW9kU3RhdGVba2V5XS5lbmFibGVkICYmICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kc1trZXldLnR5cGUpKSk7XHJcblxyXG4gIGNvbnN0IG1lcmdlZE1vZE5hbWVzID0gYXdhaXQgZ2V0TWVyZ2VkTW9kTmFtZXMoY29udGV4dCk7XHJcbiAgY29uc3QgbWFudWFsbHlBZGRlZE1vZHMgPSBhd2FpdCBnZXRNYW51YWxseUFkZGVkTW9kcyhjb250ZXh0KTtcclxuICBjb25zdCBtYW5hZ2VkTW9kcyA9IGF3YWl0IGdldE1hbmFnZWRNb2ROYW1lcyhjb250ZXh0LCBlbmFibGVkTW9kcy5tYXAoa2V5ID0+IG1vZHNba2V5XSkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgbWVyZ2VkOiBtZXJnZWRNb2ROYW1lcyxcclxuICAgIG1hbnVhbDogbWFudWFsbHlBZGRlZE1vZHMuZmlsdGVyKG1vZCA9PiAhbWVyZ2VkTW9kTmFtZXMuaW5jbHVkZXMobW9kKSksXHJcbiAgICBtYW5hZ2VkOiBtYW5hZ2VkTW9kcyxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0SU5JU3RydWN0KGNvbnRleHQsIGxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyKSB7XHJcbiAgcmV0dXJuIGdldEFsbE1vZHMoY29udGV4dCkudGhlbihtb2RNYXAgPT4ge1xyXG4gICAgX0lOSV9TVFJVQ1QgPSB7fTtcclxuICAgIGNvbnN0IG1vZHMgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbW9kTWFwLm1hbmFnZWQsIG1vZE1hcC5tYW51YWwpO1xyXG4gICAgY29uc3QgZmlsdGVyRnVuYyA9IChtb2ROYW1lOiBzdHJpbmcpID0+IG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcclxuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKGZpbHRlckZ1bmMpO1xyXG4gICAgY29uc3QgbWFuYWdlZExvY2tlZCA9IG1vZE1hcC5tYW5hZ2VkXHJcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gZmlsdGVyRnVuYyhlbnRyeS5uYW1lKSlcclxuICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKTtcclxuICAgIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCwgbWFuYWdlZExvY2tlZCk7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChtb2RzLCAobW9kLCBpZHgpID0+IHtcclxuICAgICAgbGV0IG5hbWU7XHJcbiAgICAgIGxldCBrZXk7XHJcbiAgICAgIGlmICh0eXBlb2YobW9kKSA9PT0gJ29iamVjdCcgJiYgbW9kICE9PSBudWxsKSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZC5uYW1lO1xyXG4gICAgICAgIGtleSA9IG1vZC5pZDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuYW1lID0gbW9kO1xyXG4gICAgICAgIGtleSA9IG1vZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgTE9FbnRyeSA9IHV0aWwuZ2V0U2FmZShsb2FkT3JkZXIsIFtrZXldLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgcHJpb3JpdHlNYW5hZ2VyLnJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICAgICAgfVxyXG4gICAgICBfSU5JX1NUUlVDVFtuYW1lXSA9IHtcclxuICAgICAgICAvLyBUaGUgSU5JIGZpbGUncyBlbmFibGVkIGF0dHJpYnV0ZSBleHBlY3RzIDEgb3IgMFxyXG4gICAgICAgIEVuYWJsZWQ6IChMT0VudHJ5ICE9PSB1bmRlZmluZWQpID8gTE9FbnRyeS5lbmFibGVkID8gMSA6IDAgOiAxLFxyXG4gICAgICAgIFByaW9yaXR5OiB0b3RhbExvY2tlZC5pbmNsdWRlcyhuYW1lKVxyXG4gICAgICAgICAgPyB0b3RhbExvY2tlZC5pbmRleE9mKG5hbWUpXHJcbiAgICAgICAgICA6IHByaW9yaXR5TWFuYWdlci5nZXRQcmlvcml0eSh7IGlkOiBrZXkgfSksXHJcbiAgICAgICAgVks6IGtleSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbi8vIGl0ZW06IElMb2FkT3JkZXJEaXNwbGF5SXRlbVxyXG5mdW5jdGlvbiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRGlzcGxheUl0ZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBtaW5Qcmlvcml0eTogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgb25TZXRQcmlvcml0eTogKGtleTogc3RyaW5nLCBwcmlvcml0eTogbnVtYmVyKSA9PiB2b2lkKSB7XHJcbiAgY29uc3QgcHJpb3JpdHlJbnB1dERpYWxvZyA9ICgpID0+IHtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoKHJlc29sdmUpID0+IHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmlvcml0eScsIHtcclxuICAgICAgICB0ZXh0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0luc2VydCBuZXcgbnVtZXJpY2FsIHByaW9yaXR5IGZvciB7e2l0ZW1OYW1lfX0gaW4gdGhlIGlucHV0IGJveDonLCB7IHJlcGxhY2U6IHsgaXRlbU5hbWU6IGl0ZW0ubmFtZSB9IH0pLFxyXG4gICAgICAgIGlucHV0OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAndzNQcmlvcml0eUlucHV0JyxcclxuICAgICAgICAgICAgbGFiZWw6ICdQcmlvcml0eScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogX0lOSV9TVFJVQ1RbaXRlbS5pZF0/LlByaW9yaXR5IHx8IDAsXHJcbiAgICAgICAgICB9XSxcclxuICAgICAgfSwgWyB7IGxhYmVsOiAnQ2FuY2VsJyB9LCB7IGxhYmVsOiAnU2V0JywgZGVmYXVsdDogdHJ1ZSB9IF0pXHJcbiAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdTZXQnKSB7XHJcbiAgICAgICAgICBjb25zdCBpdGVtS2V5ID0gT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLmZpbmQoa2V5ID0+IF9JTklfU1RSVUNUW2tleV0uVksgPT09IGl0ZW0uaWQpO1xyXG4gICAgICAgICAgY29uc3Qgd2FudGVkUHJpb3JpdHkgPSByZXN1bHQuaW5wdXRbJ3czUHJpb3JpdHlJbnB1dCddO1xyXG4gICAgICAgICAgaWYgKHdhbnRlZFByaW9yaXR5IDw9IG1pblByaW9yaXR5KSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignQ2Fubm90IGNoYW5nZSB0byBsb2NrZWQgZW50cnkgUHJpb3JpdHknLFxyXG4gICAgICAgICAgICAgIHdhbnRlZFByaW9yaXR5KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpdGVtS2V5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgX0lOSV9TVFJVQ1RbaXRlbUtleV0uUHJpb3JpdHkgPSBwYXJzZUludCh3YW50ZWRQcmlvcml0eSwgMTApO1xyXG4gICAgICAgICAgICBvblNldFByaW9yaXR5KGl0ZW1LZXksIHdhbnRlZFByaW9yaXR5KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHNldCBwcmlvcml0eSAtIG1vZCBpcyBub3QgaW4gaW5pIHN0cnVjdCcsIHsgbW9kSWQ6IGl0ZW0uaWQgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICBjb25zdCBpdGVtQWN0aW9ucyA9IFtcclxuICAgIHtcclxuICAgICAgc2hvdzogaXRlbS5sb2NrZWQgIT09IHRydWUsXHJcbiAgICAgIHRpdGxlOiAnU2V0IE1hbnVhbCBQcmlvcml0eScsXHJcbiAgICAgIGFjdGlvbjogKCkgPT4gcHJpb3JpdHlJbnB1dERpYWxvZygpLFxyXG4gICAgfSxcclxuICBdO1xyXG5cclxuICByZXR1cm4gaXRlbUFjdGlvbnM7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgcHJpb3JpdHlNYW5hZ2VyKTogUHJvbWlzZTxhbnlbXT4ge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IHsgZ2V0UHJpb3JpdHksIHJlc2V0TWF4UHJpb3JpdHkgfSA9IHByaW9yaXR5TWFuYWdlcjtcclxuICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gV2hhdCBhbiBvZGQgdXNlIGNhc2UgLSBwZXJoYXBzIHRoZSB1c2VyIGhhZCBzd2l0Y2hlZCBnYW1lTW9kZXMgb3JcclxuICAgIC8vICBldmVuIGRlbGV0ZWQgaGlzIHByb2ZpbGUgZHVyaW5nIHRoZSBwcmUtc29ydCBmdW5jdGlvbmFsaXR5ID9cclxuICAgIC8vICBPZGQgYnV0IHBsYXVzaWJsZSBJIHN1cHBvc2UgP1xyXG4gICAgbG9nKCd3YXJuJywgJ1tXM10gdW5hYmxlIHRvIHByZXNvcnQgZHVlIHRvIG5vIGFjdGl2ZSBwcm9maWxlJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIGxldCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IG9uU2V0UHJpb3JpdHkgPSAoaXRlbUtleSwgd2FudGVkUHJpb3JpdHkpID0+IHtcclxuICAgIHJldHVybiB3cml0ZVRvTW9kU2V0dGluZ3MoKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgd2FudGVkUHJpb3JpdHkgPSArd2FudGVkUHJpb3JpdHk7XHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgbW9kSWQgPSBfSU5JX1NUUlVDVFtpdGVtS2V5XS5WSztcclxuICAgICAgICBjb25zdCBsb0VudHJ5ID0gbG9hZE9yZGVyW21vZElkXTtcclxuICAgICAgICBpZiAocHJpb3JpdHlNYW5hZ2VyLnByaW9yaXR5VHlwZSA9PT0gJ3Bvc2l0aW9uLWJhc2VkJykge1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXJFbnRyeShcclxuICAgICAgICAgICAgYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHtcclxuICAgICAgICAgICAgICAuLi5sb0VudHJ5LFxyXG4gICAgICAgICAgICAgIHBvczogKGxvRW50cnkucG9zIDwgd2FudGVkUHJpb3JpdHkpID8gd2FudGVkUHJpb3JpdHkgOiB3YW50ZWRQcmlvcml0eSAtIDIsXHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlckVudHJ5KFxyXG4gICAgICAgICAgICBhY3RpdmVQcm9maWxlLmlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgICAgIC4uLmxvRW50cnksXHJcbiAgICAgICAgICAgICAgcHJlZml4OiBwYXJzZUludChfSU5JX1NUUlVDVFtpdGVtS2V5XS5Qcmlvcml0eSwgMTApLFxyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmVmcmVzaEZ1bmMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICB9O1xyXG4gIGNvbnN0IGFsbE1vZHMgPSBhd2FpdCBnZXRBbGxNb2RzKGNvbnRleHQpO1xyXG4gIGlmICgoYWxsTW9kcy5tZXJnZWQubGVuZ3RoID09PSAwKSAmJiAoYWxsTW9kcy5tYW51YWwubGVuZ3RoID09PSAwKSkge1xyXG4gICAgaXRlbXMubWFwKChpdGVtLCBpZHgpID0+IHtcclxuICAgICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICAgIHJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLml0ZW0sXHJcbiAgICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgMCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZmlsdGVyRnVuYyA9IChtb2ROYW1lOiBzdHJpbmcpID0+IG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcclxuICBjb25zdCBsb2NrZWRNb2RzID0gW10uY29uY2F0KGFsbE1vZHMubWFudWFsLmZpbHRlcihmaWx0ZXJGdW5jKSxcclxuICAgIGFsbE1vZHMubWFuYWdlZC5maWx0ZXIoZW50cnkgPT4gZmlsdGVyRnVuYyhlbnRyeS5uYW1lKSlcclxuICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSkpO1xyXG4gIGNvbnN0IHJlYWRhYmxlTmFtZXMgPSB7XHJcbiAgICBbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCcsXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbG9ja2VkRW50cmllcyA9IFtdLmNvbmNhdChhbGxNb2RzLm1lcmdlZCwgbG9ja2VkTW9kcylcclxuICAgIC5yZWR1Y2UoKGFjY3VtLCBtb2ROYW1lLCBpZHgpID0+IHtcclxuICAgICAgY29uc3Qgb2JqID0ge1xyXG4gICAgICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgICAgIG5hbWU6ICEhcmVhZGFibGVOYW1lc1ttb2ROYW1lXSA/IHJlYWRhYmxlTmFtZXNbbW9kTmFtZV0gOiBtb2ROYW1lLFxyXG4gICAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgICAgIHByZWZpeDogaWR4ICsgMSxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICghYWNjdW0uZmluZChhY2MgPT4gb2JqLmlkID09PSBhY2MuaWQpKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChvYmopO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcblxyXG4gIGl0ZW1zID0gaXRlbXMuZmlsdGVyKGl0ZW0gPT4gIWFsbE1vZHMubWVyZ2VkLmluY2x1ZGVzKGl0ZW0uaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhYWxsTW9kcy5tYW51YWwuaW5jbHVkZXMoaXRlbS5pZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFhbGxNb2RzLm1hbmFnZWQuZmluZChtb2QgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChtb2QubmFtZSA9PT0gVU5JX1BBVENIKSAmJiAobW9kLmlkID09PSBpdGVtLmlkKSkpXHJcbiAgICAgICAgICAgICAgIC5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICByZXNldE1heFByaW9yaXR5KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5pdGVtLFxyXG4gICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCBsb2NrZWRFbnRyaWVzLmxlbmd0aCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtYW51YWxFbnRyaWVzID0gYWxsTW9kcy5tYW51YWxcclxuICAgIC5maWx0ZXIoa2V5ID0+IGxvY2tlZEVudHJpZXMuZmluZChlbnRyeSA9PiBlbnRyeS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgLm1hcChrZXkgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtID0ge1xyXG4gICAgICAgIGlkOiBrZXksXHJcbiAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgZXh0ZXJuYWw6IHRydWUsXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uaXRlbSxcclxuICAgICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgICAgIGNvbnRleHRNZW51QWN0aW9uczogZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQsIGl0ZW0sIGxvY2tlZEVudHJpZXMubGVuZ3RoLCBvblNldFByaW9yaXR5KSxcclxuICAgICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcik7XHJcbiAgY29uc3Qga25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4ga2V5cy5pbmNsdWRlcyhlbnRyeS5pZCkpIHx8IFtdO1xyXG4gIGNvbnN0IHVua25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWtleXMuaW5jbHVkZXMoZW50cnkuaWQpKSB8fCBbXTtcclxuICBjb25zdCBmaWx0ZXJlZE9yZGVyID0ga2V5c1xyXG4gICAgLmZpbHRlcihrZXkgPT4gbG9ja2VkRW50cmllcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgICBhY2N1bVtrZXldID0gbG9hZE9yZGVyW2tleV07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICBrbm93bk1hbnVhbGx5QWRkZWQuZm9yRWFjaChrbm93biA9PiB7XHJcbiAgICBjb25zdCBkaWZmID0ga2V5cy5sZW5ndGggLSBPYmplY3Qua2V5cyhmaWx0ZXJlZE9yZGVyKS5sZW5ndGg7XHJcblxyXG4gICAgY29uc3QgcG9zID0gZmlsdGVyZWRPcmRlcltrbm93bi5pZF0ucG9zIC0gZGlmZjtcclxuICAgIGl0ZW1zID0gW10uY29uY2F0KGl0ZW1zLnNsaWNlKDAsIHBvcykgfHwgW10sIGtub3duLCBpdGVtcy5zbGljZShwb3MpIHx8IFtdKTtcclxuICB9KTtcclxuXHJcbiAgbGV0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChcclxuICAgIC4uLmxvY2tlZEVudHJpZXMsXHJcbiAgICBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IGlzTG9ja2VkID0gbG9ja2VkRW50cmllcy5maW5kKGxvY2tlZCA9PiBsb2NrZWQubmFtZSA9PT0gaXRlbS5uYW1lKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBkb05vdERpc3BsYXkgPSBET19OT1RfRElTUExBWS5pbmNsdWRlcyhpdGVtLm5hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIHJldHVybiAhaXNMb2NrZWQgJiYgIWRvTm90RGlzcGxheTtcclxuICAgIH0pLFxyXG4gICAgLi4udW5rbm93bk1hbnVhbGx5QWRkZWQpO1xyXG5cclxuICBwcmVTb3J0ZWQgPSAodXBkYXRlVHlwZSAhPT0gJ2RyYWctbi1kcm9wJylcclxuICAgID8gcHJlU29ydGVkLnNvcnQoKGxocywgcmhzKSA9PiBsaHMucHJlZml4IC0gcmhzLnByZWZpeClcclxuICAgIDogcHJlU29ydGVkLnJlZHVjZSgoYWNjdW0sIGVudHJ5LCBpZHgpID0+IHtcclxuICAgICAgICBpZiAobG9ja2VkRW50cmllcy5pbmRleE9mKGVudHJ5KSAhPT0gLTEgfHwgaWR4ID09PSAwKSB7XHJcbiAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgcHJldlByZWZpeCA9IHBhcnNlSW50KGFjY3VtW2lkeCAtIDFdLnByZWZpeCwgMTApO1xyXG4gICAgICAgICAgaWYgKHByZXZQcmVmaXggPj0gZW50cnkucHJlZml4KSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgICAgIC4uLmVudHJ5LFxyXG4gICAgICAgICAgICAgIHByZWZpeDogcHJldlByZWZpeCArIDEsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE1vZEZvbGRlcihpbnN0YWxsYXRpb25QYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIGlmICghaW5zdGFsbGF0aW9uUGF0aCB8fCAhbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XHJcbiAgICBjb25zdCBlcnJNZXNzYWdlID0gIWluc3RhbGxhdGlvblBhdGhcclxuICAgICAgPyAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCdcclxuICAgICAgOiAnRmFpbGVkIHRvIHJlc29sdmUgbW9kIGluc3RhbGxhdGlvbiBwYXRoJztcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKGVyck1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uID0gWyd3aXRjaGVyM21lbnVtb2Ryb290JywgJ3dpdGNoZXIzdGwnXS5pbmNsdWRlcyhtb2QudHlwZSlcclxuICAgID8gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCAnTW9kcycpXHJcbiAgICA6IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhleHBlY3RlZE1vZE5hbWVMb2NhdGlvbilcclxuICAgIC50aGVuKGVudHJpZXMgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXNbMF0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQ6IHR5cGVzLklDb21wb25lbnRDb250ZXh0LCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcclxuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKG1vZHMsIChhY2N1bSwgbW9kKSA9PiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGgsIG1vZClcclxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xyXG4gICAgICBpZiAobW9kLnR5cGUgPT09ICdjb2xsZWN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZENvbXBvbmVudHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnbW9kQ29tcG9uZW50cyddLCBbXSk7XHJcbiAgICAgIGlmIChtb2RDb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIG1vZENvbXBvbmVudHMucHVzaChtb2ROYW1lKTtcclxuICAgICAgfVxyXG4gICAgICBbLi4ubW9kQ29tcG9uZW50c10uZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgaWQ6IG1vZC5pZCxcclxuICAgICAgICAgIG5hbWU6IGtleSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byByZXNvbHZlIG1vZCBuYW1lJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9KSwgW10pO1xyXG59XHJcblxyXG5jb25zdCB0b2dnbGVNb2RzU3RhdGUgPSBhc3luYyAoY29udGV4dCwgcHJvcHMsIGVuYWJsZWQpID0+IHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dCk7XHJcbiAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIobW9kTmFtZSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkpO1xyXG4gIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCk7XHJcbiAgY29uc3QgbmV3TE8gPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgaWYgKHRvdGFsTG9ja2VkLmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgYWNjdW1ba2V5XSA9IGxvYWRPcmRlcltrZXldO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYWNjdW1ba2V5XSA9IHtcclxuICAgICAgICAuLi5sb2FkT3JkZXJba2V5XSxcclxuICAgICAgICBlbmFibGVkLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlLmlkLCBuZXdMTyBhcyBhbnkpKTtcclxuICBwcm9wcy5yZWZyZXNoKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdsb2Fkb3JkZXJpbmZvJyB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSwgdCgnTWFuYWdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHsgc3R5bGU6IHsgaGVpZ2h0OiAnMzAlJyB9IH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnWW91IGNhbiBhZGp1c3QgdGhlIGxvYWQgb3JkZXIgZm9yIFRoZSBXaXRjaGVyIDMgYnkgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nICdcclxuICAgICAgKyAnbW9kcyB1cCBvciBkb3duIG9uIHRoaXMgcGFnZS4gIElmIHlvdSBhcmUgdXNpbmcgc2V2ZXJhbCBtb2RzIHRoYXQgYWRkIHNjcmlwdHMgeW91IG1heSBuZWVkIHRvIHVzZSAnXHJcbiAgICAgICsgJ3RoZSBXaXRjaGVyIDMgU2NyaXB0IG1lcmdlci4gRm9yIG1vcmUgaW5mb3JtYXRpb24gc2VlOiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19UaGVfV2l0Y2hlcl8zX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBUaGUgV2l0Y2hlciAzIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcclxuICAgICAgc3R5bGU6IHsgaGVpZ2h0OiAnODAlJyB9LFxyXG4gICAgfSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdQbGVhc2Ugbm90ZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnRm9yIFdpdGNoZXIgMywgdGhlIG1vZCB3aXRoIHRoZSBsb3dlc3QgaW5kZXggbnVtYmVyIChieSBkZWZhdWx0LCB0aGUgbW9kIHNvcnRlZCBhdCB0aGUgdG9wKSBvdmVycmlkZXMgbW9kcyB3aXRoIGEgaGlnaGVyIGluZGV4IG51bWJlci4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnWW91IGFyZSBhYmxlIHRvIG1vZGlmeSB0aGUgcHJpb3JpdHkgbWFudWFsbHkgYnkgcmlnaHQgY2xpY2tpbmcgYW55IExPIGVudHJ5IGFuZCBzZXQgdGhlIG1vZFxcJ3MgcHJpb3JpdHknLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSWYgeW91IGNhbm5vdCBzZWUgeW91ciBtb2QgaW4gdGhpcyBsb2FkIG9yZGVyLCB5b3UgbWF5IG5lZWQgdG8gYWRkIGl0IG1hbnVhbGx5IChzZWUgb3VyIHdpa2kgZm9yIGRldGFpbHMpLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdXaGVuIG1hbmFnaW5nIG1lbnUgbW9kcywgbW9kIHNldHRpbmdzIGNoYW5nZWQgaW5zaWRlIHRoZSBnYW1lIHdpbGwgYmUgZGV0ZWN0ZWQgYnkgVm9ydGV4IGFzIGV4dGVybmFsIGNoYW5nZXMgLSB0aGF0IGlzIGV4cGVjdGVkLCAnXHJcbiAgICAgICAgICArICdjaG9vc2UgdG8gdXNlIHRoZSBuZXdlciBmaWxlIGFuZCB5b3VyIHNldHRpbmdzIHdpbGwgYmUgbWFkZSBwZXJzaXN0ZW50LicsXHJcbiAgICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnWW91IGNhbiBjaGFuZ2UgdGhlIHdheSB0aGUgcHJpb3JpdGllcyBhcmUgYXNzZ2luZWQgdXNpbmcgdGhlIFwiU3dpdGNoIFRvIFBvc2l0aW9uL1ByZWZpeCBiYXNlZFwiIGJ1dHRvbi4gJ1xyXG4gICAgICAgICAgKyAnUHJlZml4IGJhc2VkIGlzIGxlc3MgcmVzdHJpY3RpdmUgYW5kIGFsbG93cyB5b3UgdG8gc2V0IGFueSBwcmlvcml0eSB2YWx1ZSB5b3Ugd2FudCBcIjUwMDAsIDY5OTk5LCBldGNcIiB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsICdcclxuICAgICAgICAgICsgJ3Jlc3RyaWN0IHRoZSBwcmlvcml0aWVzIHRvIHRoZSBudW1iZXIgb2YgbG9hZCBvcmRlciBlbnRyaWVzIHRoYXQgYXJlIGF2YWlsYWJsZS4nLFxyXG4gICAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01lcmdlcyBnZW5lcmF0ZWQgYnkgdGhlIFdpdGNoZXIgMyBTY3JpcHQgbWVyZ2VyIG11c3QgYmUgbG9hZGVkIGZpcnN0IGFuZCBhcmUgbG9ja2VkIGluIHRoZSBmaXJzdCBsb2FkIG9yZGVyIHNsb3QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkJ1dHRvbiwge1xyXG4gICAgICAgICAgb25DbGljazogKCkgPT4gdG9nZ2xlTW9kc1N0YXRlKGNvbnRleHQsIHByb3BzLCBmYWxzZSksXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBtYXJnaW5Cb3R0b206ICc1cHgnLFxyXG4gICAgICAgICAgICB3aWR0aDogJ21pbi1jb250ZW50JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgdCgnRGlzYWJsZSBBbGwnKSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYnInKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkJ1dHRvbiwge1xyXG4gICAgICAgICAgb25DbGljazogKCkgPT4gdG9nZ2xlTW9kc1N0YXRlKGNvbnRleHQsIHByb3BzLCB0cnVlKSxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzVweCcsXHJcbiAgICAgICAgICAgIHdpZHRoOiAnbWluLWNvbnRlbnQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LCB0KCdFbmFibGUgQWxsICcpKSwgW10pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZShjb250ZXh0LCByZWFzb24pIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKCEhc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnd2l0Y2hlcjMtbWVyZ2UnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIG1lc3NhZ2U6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSgnV2l0Y2hlciBTY3JpcHQgbWVyZ2VyIG1heSBuZWVkIHRvIGJlIGV4ZWN1dGVkJyxcclxuICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMnLCB7XHJcbiAgICAgICAgICAgICAgdGV4dDogcmVhc29uLFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ1J1biB0b29sJyxcclxuICAgICAgICAgIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICAgIHJ1blNjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbk1lcmdlKGdhbWUsIGdhbWVEaXNjb3ZlcnkpIHtcclxuICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiAoe1xyXG4gICAgYmFzZUZpbGVzOiAoKSA9PiBbXHJcbiAgICAgIHtcclxuICAgICAgICBpbjogcGF0aC5qb2luKGdhbWVEaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICAgICAgICBvdXQ6IHBhdGguam9pbihDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIGZpbHRlcjogZmlsZVBhdGggPT4gZmlsZVBhdGguZW5kc1dpdGgoSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZElucHV0RmlsZShjb250ZXh0LCBtZXJnZURpcikge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGNvbnN0IGdhbWVJbnB1dEZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpO1xyXG4gIHJldHVybiAoISFkaXNjb3Zlcnk/LnBhdGgpXHJcbiAgICA/IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKG1lcmdlRGlyLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpKVxyXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgPyBmcy5yZWFkRmlsZUFzeW5jKGdhbWVJbnB1dEZpbGVwYXRoKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgIDogUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xyXG59XHJcblxyXG5jb25zdCBlbXB0eVhtbCA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz48bWV0YWRhdGE+PC9tZXRhZGF0YT4nO1xyXG5mdW5jdGlvbiBtZXJnZShmaWxlUGF0aCwgbWVyZ2VEaXIsIGNvbnRleHQpIHtcclxuICBsZXQgbW9kRGF0YTtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKHhtbERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG1vZERhdGEgPSBwYXJzZVhtbFN0cmluZyh4bWxEYXRhLCB7IGlnbm9yZV9lbmM6IHRydWUsIG5vYmxhbmtzOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gVGhlIG1vZCBpdHNlbGYgaGFzIGludmFsaWQgeG1sIGRhdGEuXHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIG1vZCBYTUwgZGF0YSAtIGluZm9ybSBtb2QgYXV0aG9yJyxcclxuICAgICAgICB7IHBhdGg6IGZpbGVQYXRoLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgbW9kRGF0YSA9IGVtcHR5WG1sO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC50aGVuKCgpID0+IHJlYWRJbnB1dEZpbGUoY29udGV4dCwgbWVyZ2VEaXIpKVxyXG4gICAgLnRoZW4obWVyZ2VkRGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VkID0gcGFyc2VYbWxTdHJpbmcobWVyZ2VkRGF0YSwgeyBpZ25vcmVfZW5jOiB0cnVlLCBub2JsYW5rczogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlZCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIG1lcmdlZCBmaWxlIC0gaWYgaXQncyBpbnZhbGlkIGNoYW5jZXMgYXJlIHdlIG1lc3NlZCB1cFxyXG4gICAgICAgIC8vICBzb21laG93LCByZWFzb24gd2h5IHdlJ3JlIGdvaW5nIHRvIGFsbG93IHRoaXMgZXJyb3IgdG8gZ2V0IHJlcG9ydGVkLlxyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIG1lcmdlZCBYTUwgZGF0YScsIGVyciwge1xyXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXHJcbiAgICAgICAgICBhdHRhY2htZW50czogW1xyXG4gICAgICAgICAgICB7IGlkOiAnX19tZXJnZWQvaW5wdXQueG1sJywgdHlwZTogJ2RhdGEnLCBkYXRhOiBtZXJnZWREYXRhLFxyXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2l0Y2hlciAzIG1lbnUgbW9kIG1lcmdlZCBkYXRhJyB9LFxyXG4gICAgICAgICAgICB7IGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9sb2FkT3JkZXJgLCB0eXBlOiAnZGF0YScsIGRhdGE6IGxvYWRPcmRlcixcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcicgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdJbnZhbGlkIG1lcmdlZCBYTUwgZGF0YScpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC50aGVuKGdhbWVJbmRleEZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBtb2RWYXJzID0gbW9kRGF0YS5maW5kKCcvL1ZhcicpO1xyXG4gICAgICBjb25zdCBnYW1lVmFycyA9IGdhbWVJbmRleEZpbGUuZmluZDxFbGVtZW50PignLy9WYXInKTtcclxuXHJcbiAgICAgIG1vZFZhcnMuZm9yRWFjaChtb2RWYXIgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoZXIgPSAoZ2FtZVZhcikgPT4ge1xyXG4gICAgICAgICAgbGV0IGdhbWVWYXJQYXJlbnQ7XHJcbiAgICAgICAgICBsZXQgbW9kVmFyUGFyZW50O1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZ2FtZVZhclBhcmVudCA9IGdhbWVWYXIucGFyZW50KCkucGFyZW50KCk7XHJcbiAgICAgICAgICAgIG1vZFZhclBhcmVudCA9IG1vZFZhci5wYXJlbnQoKS5wYXJlbnQoKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAvLyBUaGlzIGdhbWUgdmFyaWFibGUgbXVzdCd2ZSBiZWVuIHJlcGxhY2VkIGluIGEgcHJldmlvdXNcclxuICAgICAgICAgICAgLy8gIGl0ZXJhdGlvbi5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICgodHlwZW9mKGdhbWVWYXJQYXJlbnQ/LmF0dHIpICE9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgIHx8ICh0eXBlb2YobW9kVmFyUGFyZW50Py5hdHRyKSAhPT0gJ2Z1bmN0aW9uJykpIHtcclxuICAgICAgICAgICAgIC8vIFRoaXMgaXMgYWN0dWFsbHkgcXVpdGUgcHJvYmxlbWF0aWMgLSBpdCBwcmV0dHkgbXVjaCBtZWFuc1xyXG4gICAgICAgICAgICAgLy8gIHRoYXQgZWl0aGVyIHRoZSBtb2Qgb3IgdGhlIGdhbWUgaXRzZWxmIGhhcyBnYW1lIHZhcmlhYmxlc1xyXG4gICAgICAgICAgICAgLy8gIGxvY2F0ZWQgb3V0c2lkZSBhIGdyb3VwLiBFaXRoZXIgdGhlIGdhbWUgaW5wdXQgZmlsZSBpcyBjb3JydXB0ZWRcclxuICAgICAgICAgICAgIC8vICAobWFudWFsIHRhbXBlcmluZz8pIG9yIHRoZSBtb2QgaXRzZWxmIGlzLiBUaGFua2Z1bGx5IHdlIHdpbGwgYmVcclxuICAgICAgICAgICAgIC8vICBjcmVhdGluZyB0aGUgbWlzc2luZyBncm91cCwgYnV0IGl0IGxlYWRzIHRvIHRoZSBxdWVzdGlvbiwgd2hhdFxyXG4gICAgICAgICAgICAgLy8gIG90aGVyIHN1cnByaXNlcyBhcmUgd2UgZ29pbmcgdG8gZW5jb3VudGVyIGZ1cnRoZXIgZG93biB0aGUgbGluZSA/XHJcbiAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBmaW5kIHBhcmVudCBncm91cCBvZiBtb2QgdmFyaWFibGUnLCBtb2RWYXIpO1xyXG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gKChnYW1lVmFyUGFyZW50LmF0dHIoJ2lkJykudmFsdWUoKSA9PT0gbW9kVmFyUGFyZW50LmF0dHIoJ2lkJykudmFsdWUoKSlcclxuICAgICAgICAgICAgJiYgKGdhbWVWYXIuYXR0cignaWQnKS52YWx1ZSgpID09PSBtb2RWYXIuYXR0cignaWQnKS52YWx1ZSgpKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdWYXIgPSBnYW1lVmFycy5maW5kKG1hdGNoZXIpO1xyXG4gICAgICAgIGlmIChleGlzdGluZ1Zhcikge1xyXG4gICAgICAgICAgZXhpc3RpbmdWYXIucmVwbGFjZShtb2RWYXIuY2xvbmUoKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IHBhcmVudEdyb3VwID0gbW9kVmFyLnBhcmVudCgpLnBhcmVudCgpO1xyXG4gICAgICAgICAgY29uc3QgZ3JvdXBJZCA9IHBhcmVudEdyb3VwLmF0dHIoJ2lkJykudmFsdWUoKTtcclxuICAgICAgICAgIGNvbnN0IG1hdGNoaW5nSW5kZXhHcm91cCA9IGdhbWVJbmRleEZpbGUuZmluZDxFbGVtZW50PignLy9Hcm91cCcpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoZ3JvdXAgPT4gZ3JvdXAuYXR0cignaWQnKS52YWx1ZSgpID09PSBncm91cElkKTtcclxuICAgICAgICAgIGlmIChtYXRjaGluZ0luZGV4R3JvdXAubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAvLyBTb21ldGhpbmcncyB3cm9uZyB3aXRoIHRoZSBmaWxlIC0gYmFjayBvZmYuXHJcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdEdXBsaWNhdGUgZ3JvdXAgZW50cmllcyBmb3VuZCBpbiBnYW1lIGlucHV0LnhtbCdcclxuICAgICAgICAgICAgICArIGBcXG5cXG4ke3BhdGguam9pbihtZXJnZURpciwgSU5QVVRfWE1MX0ZJTEVOQU1FKX1cXG5cXG5gXHJcbiAgICAgICAgICAgICAgKyAnZmlsZSAtIHBsZWFzZSBmaXggdGhpcyBtYW51YWxseSBiZWZvcmUgYXR0ZW1wdGluZyB0byByZS1pbnN0YWxsIHRoZSBtb2QnKTtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEdXBsaWNhdGUgZ3JvdXAgZW50cmllcyBkZXRlY3RlZCcsIGVycixcclxuICAgICAgICAgICAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoaW5nSW5kZXhHcm91cC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gTmVlZCB0byBhZGQgdGhlIGdyb3VwIEFORCB0aGUgdmFyLlxyXG4gICAgICAgICAgICBjb25zdCB1c2VyQ29uZmlnID0gZ2FtZUluZGV4RmlsZS5nZXQ8RWxlbWVudD4oJy8vVXNlckNvbmZpZycpO1xyXG4gICAgICAgICAgICB1c2VyQ29uZmlnLmFkZENoaWxkKHBhcmVudEdyb3VwLmNsb25lKCkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgKG1hdGNoaW5nSW5kZXhHcm91cFswXS5jaGlsZCgwKSBhcyBFbGVtZW50KS5hZGRDaGlsZChtb2RWYXIuY2xvbmUoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4obWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgICAgICAgZ2FtZUluZGV4RmlsZSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnaW5wdXQueG1sIG1lcmdlIGZhaWxlZCcsIGVycik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jb25zdCBTQ1JJUFRfTUVSR0VSX0ZJTEVTID0gWydXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZSddO1xyXG5mdW5jdGlvbiBzY3JpcHRNZXJnZXJUZXN0KGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBtYXRjaGVyID0gKGZpbGUgPT4gU0NSSVBUX01FUkdFUl9GSUxFUy5pbmNsdWRlcyhmaWxlKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpICYmIChmaWxlcy5maWx0ZXIobWF0Y2hlcikubGVuZ3RoID4gMCkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBTQ1JJUFRfTUVSR0VSX0ZJTEVTIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsIGVyck1lc3NhZ2UpIHtcclxuICBsZXQgYWxsb3dSZXBvcnQgPSB0cnVlO1xyXG4gIGNvbnN0IHVzZXJDYW5jZWxlZCA9IGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkO1xyXG4gIGlmICh1c2VyQ2FuY2VsZWQpIHtcclxuICAgIGFsbG93UmVwb3J0ID0gZmFsc2U7XHJcbiAgfVxyXG4gIGNvbnN0IGJ1c3lSZXNvdXJjZSA9IGVyciBpbnN0YW5jZW9mIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3I7XHJcbiAgaWYgKGFsbG93UmVwb3J0ICYmIGJ1c3lSZXNvdXJjZSkge1xyXG4gICAgYWxsb3dSZXBvcnQgPSBlcnIuYWxsb3dSZXBvcnQ7XHJcbiAgICBlcnIubWVzc2FnZSA9IGVyci5lcnJvck1lc3NhZ2U7XHJcbiAgfVxyXG5cclxuICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gIHJldHVybjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIoY29udGV4dCwgZmlsZXMpIHtcclxuICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTW9kJywgJ0l0IGxvb2tzIGxpa2UgeW91IHRyaWVkIHRvIGluc3RhbGwgJ1xyXG4gICAgKyAnVGhlIFdpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyLCB3aGljaCBpcyBhIHRvb2wgYW5kIG5vdCBhIG1vZCBmb3IgVGhlIFdpdGNoZXIgMy5cXG5cXG4nXHJcbiAgICArICdUaGUgc2NyaXB0IG1lcmdlciBzaG91bGRcXCd2ZSBiZWVuIGluc3RhbGxlZCBhdXRvbWF0aWNhbGx5IGJ5IFZvcnRleCBhcyBzb29uIGFzIHlvdSBhY3RpdmF0ZWQgdGhpcyBleHRlbnNpb24uICdcclxuICAgICsgJ0lmIHRoZSBkb3dubG9hZCBvciBpbnN0YWxsYXRpb24gaGFzIGZhaWxlZCBmb3IgYW55IHJlYXNvbiAtIHBsZWFzZSBsZXQgdXMga25vdyB3aHksIGJ5IHJlcG9ydGluZyB0aGUgZXJyb3IgdGhyb3VnaCAnXHJcbiAgICArICdvdXIgZmVlZGJhY2sgc3lzdGVtIGFuZCBtYWtlIHN1cmUgdG8gaW5jbHVkZSB2b3J0ZXggbG9ncy4gUGxlYXNlIG5vdGU6IGlmIHlvdVxcJ3ZlIGluc3RhbGxlZCAnXHJcbiAgICArICd0aGUgc2NyaXB0IG1lcmdlciBpbiBwcmV2aW91cyB2ZXJzaW9ucyBvZiBWb3J0ZXggYXMgYSBtb2QgYW5kIFNUSUxMIGhhdmUgaXQgaW5zdGFsbGVkICdcclxuICAgICsgJyhpdFxcJ3MgcHJlc2VudCBpbiB5b3VyIG1vZCBsaXN0KSAtIHlvdSBzaG91bGQgY29uc2lkZXIgdW4taW5zdGFsbGluZyBpdCBmb2xsb3dlZCBieSBhIFZvcnRleCByZXN0YXJ0OyAnXHJcbiAgICArICd0aGUgYXV0b21hdGljIG1lcmdlciBpbnN0YWxsZXIvdXBkYXRlciBzaG91bGQgdGhlbiBraWNrIG9mZiBhbmQgc2V0IHVwIHRoZSB0b29sIGZvciB5b3UuJyxcclxuICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0ludmFsaWQgbW9kJykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJ10sIFczUmVkdWNlcik7XHJcbiAgbGV0IHByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xyXG4gIGxldCBtb2RMaW1pdFBhdGNoZXI6IE1vZExpbWl0UGF0Y2hlcjtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdNb2RzJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxyXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMjkyMDMwJyxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IDI5MjAzMCxcclxuICAgICAgaWdub3JlQ29uZmxpY3RzOiBET19OT1RfREVQTE9ZLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBnZXRETENQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJyk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZ2V0VExQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaXNUVzMgPSAoZ2FtZUlkID0gdW5kZWZpbmVkKSA9PiB7XHJcbiAgICBpZiAoZ2FtZUlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIChnYW1lSWQgPT09IEdBTUVfSUQpO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gIH07XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzdGwnLCAyNSwgdG9CbHVlKHRlc3RTdXBwb3J0ZWRUTCksIHRvQmx1ZShpbnN0YWxsVEwpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21peGVkJywgMzAsIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkTWl4ZWQpLCB0b0JsdWUoaW5zdGFsbE1peGVkKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNjb250ZW50JywgNTAsXHJcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsXHJcbiAgICB0b0JsdWUodGVzdE1lbnVNb2RSb290IGFzIGFueSksIHRvQmx1ZShpbnN0YWxsTWVudU1vZCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NjcmlwdG1lcmdlcmR1bW15JywgMTUsXHJcbiAgICB0b0JsdWUoc2NyaXB0TWVyZ2VyVGVzdCksIHRvQmx1ZSgoZmlsZXMpID0+IHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyKGNvbnRleHQsIGZpbGVzKSkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjN0bCcsIDI1LCBpc1RXMywgZ2V0VExQYXRoLCB0b0JsdWUodGVzdFRMKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzZGxjJywgMjUsIGlzVFczLCBnZXRETENQYXRoLCB0b0JsdWUodGVzdERMQykpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsXHJcbiAgICBpc1RXMywgZ2V0VExQYXRoLCB0b0JsdWUodGVzdE1lbnVNb2RSb290IGFzIGFueSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMsXHJcbiAgICAoZ2FtZSkgPT4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnZG9jdW1lbnRzJyksICdUaGUgV2l0Y2hlciAzJyksXHJcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3M21vZGxpbWl0cGF0Y2hlcicsIDI1LCBpc1RXMywgZ2V0VExQYXRoLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSxcclxuICAgIHsgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UsIG5hbWU6ICdNb2QgTGltaXQgUGF0Y2hlciBNb2QgVHlwZScgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNZXJnZShjYW5NZXJnZSxcclxuICAgIChmaWxlUGF0aCwgbWVyZ2VEaXIpID0+IG1lcmdlKGZpbGVQYXRoLCBtZXJnZURpciwgY29udGV4dCksICd3aXRjaGVyM21lbnVtb2Ryb290Jyk7XHJcblxyXG4gIHJlZ2lzdGVyQWN0aW9ucyh7XHJcbiAgICBjb250ZXh0LFxyXG4gICAgcmVmcmVzaEZ1bmMsXHJcbiAgICBnZXRQcmlvcml0eU1hbmFnZXI6ICgpID0+IHByaW9yaXR5TWFuYWdlcixcclxuICAgIGdldE1vZExpbWl0UGF0Y2hlcjogKCkgPT4gbW9kTGltaXRQYXRjaGVyLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0WydyZWdpc3RlckNvbGxlY3Rpb25GZWF0dXJlJ10oXHJcbiAgICAnd2l0Y2hlcjNfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSwgY29sbGVjdGlvbjogdHlwZXMuSU1vZCkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXHJcbiAgICAodCkgPT4gdCgnV2l0Y2hlciAzIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyUHJvZmlsZUZlYXR1cmUoXHJcbiAgICAnbG9jYWxfbWVyZ2VzJywgJ2Jvb2xlYW4nLCAnc2V0dGluZ3MnLCAnUHJvZmlsZSBEYXRhJyxcclxuICAgICdUaGlzIHByb2ZpbGUgd2lsbCBzdG9yZSBhbmQgcmVzdG9yZSBwcm9maWxlIHNwZWNpZmljIGRhdGEgKG1lcmdlZCBzY3JpcHRzLCBsb2Fkb3JkZXIsIGV0Yykgd2hlbiBzd2l0Y2hpbmcgcHJvZmlsZXMnLFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xyXG4gICAgICByZXR1cm4gYWN0aXZlR2FtZUlkID09PSBHQU1FX0lEO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJywgJ2NvbGxlY3Rpb24nXTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSBhcyBhbnk7XHJcbiAgICB9LFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBmaWx0ZXI6IChtb2RzKSA9PiBtb2RzLmZpbHRlcihtb2QgPT4gIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2QudHlwZSkpLFxyXG4gICAgcHJlU29ydDogKGl0ZW1zOiBhbnlbXSwgZGlyZWN0aW9uOiBhbnksIHVwZGF0ZVR5cGU6IGFueSkgPT4ge1xyXG4gICAgICByZXR1cm4gcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBwcmlvcml0eU1hbmFnZXIpIGFzIGFueTtcclxuICAgIH0sXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgY2FsbGJhY2s6IChsb2FkT3JkZXIsIHVwZGF0ZVR5cGUpID0+IHtcclxuICAgICAgaWYgKGxvYWRPcmRlciA9PT0gX1BSRVZJT1VTX0xPKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoX1BSRVZJT1VTX0xPICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpO1xyXG4gICAgICB9XHJcbiAgICAgIF9QUkVWSU9VU19MTyA9IGxvYWRPcmRlcjtcclxuICAgICAgc2V0SU5JU3RydWN0KGNvbnRleHQsIGxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHdyaXRlVG9Nb2RTZXR0aW5ncygpKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RNb2RMaW1pdEJyZWFjaChjb250ZXh0LmFwaSwgbW9kTGltaXRQYXRjaGVyKSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCd0dzMtbW9kLWxpbWl0LWJyZWFjaCcsICdtb2QtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XHJcblxyXG4gIGNvbnN0IHJldmVydExPRmlsZSA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoISFwcm9maWxlICYmIChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkpIHtcclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIHJldHVybiBnZXRNYW51YWxseUFkZGVkTW9kcyhjb250ZXh0KS50aGVuKChtYW51YWxseUFkZGVkKSA9PiB7XHJcbiAgICAgICAgaWYgKG1hbnVhbGx5QWRkZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgY29uc3QgbmV3U3RydWN0ID0ge307XHJcbiAgICAgICAgICBtYW51YWxseUFkZGVkLmZvckVhY2goKG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgICAgICAgIG5ld1N0cnVjdFttb2RdID0ge1xyXG4gICAgICAgICAgICAgIEVuYWJsZWQ6IDEsXHJcbiAgICAgICAgICAgICAgUHJpb3JpdHk6ICgobG9hZE9yZGVyICE9PSB1bmRlZmluZWQgJiYgISFsb2FkT3JkZXJbbW9kXSlcclxuICAgICAgICAgICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW21vZF0ucHJlZml4LCAxMCkgOiBpZHgpICsgMSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIF9JTklfU1RSVUNUID0gbmV3U3RydWN0O1xyXG4gICAgICAgICAgd3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJlZnJlc2hGdW5jPy4oKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgICAgICdGYWlsZWQgdG8gY2xlYW51cCBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgICAgICAgIGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICAgIDogY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gY2xlYW51cCBsb2FkIG9yZGVyIGZpbGUnLCBlcnIpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHZhbGlkYXRlUHJvZmlsZSA9IChwcm9maWxlSWQsIHN0YXRlKSA9PiB7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgY29uc3QgZGVwbG95UHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgIGlmICghIWFjdGl2ZVByb2ZpbGUgJiYgISFkZXBsb3lQcm9maWxlICYmIChkZXBsb3lQcm9maWxlLmlkICE9PSBhY3RpdmVQcm9maWxlLmlkKSkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWN0aXZlUHJvZmlsZTtcclxuICB9O1xyXG5cclxuICBsZXQgcHJldkRlcGxveW1lbnQgPSBbXTtcclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgbW9kTGltaXRQYXRjaGVyID0gbmV3IE1vZExpbWl0UGF0Y2hlcihjb250ZXh0LmFwaSk7XHJcbiAgICBwcmlvcml0eU1hbmFnZXIgPSBuZXcgUHJpb3JpdHlNYW5hZ2VyKGNvbnRleHQuYXBpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIGFzeW5jIChnYW1lTW9kZSkgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICAvLyBKdXN0IGluIGNhc2UgdGhlIHNjcmlwdCBtZXJnZXIgbm90aWZpY2F0aW9uIGlzIHN0aWxsXHJcbiAgICAgICAgLy8gIHByZXNlbnQuXHJcbiAgICAgICAgY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignd2l0Y2hlcjMtbWVyZ2UnKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIGdhbWVNb2RlKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcbiAgICAgICAgaWYgKGxhc3RQcm9mSWQgIT09IGFjdGl2ZVByb2Y/LmlkKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShjb250ZXh0LCBsYXN0UHJvZklkKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0LCBhY3RpdmVQcm9mPy5pZCkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlc3RvcmUgcHJvZmlsZSBtZXJnZWQgZmlsZXMnLCBlcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCd3aWxsLWRlcGxveScsIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbWVudU1vZC5vbldpbGxEZXBsb3koY29udGV4dC5hcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChKU09OLnN0cmluZ2lmeShwcmV2RGVwbG95bWVudCkgIT09IEpTT04uc3RyaW5naWZ5KGRlcGxveW1lbnQpKSB7XHJcbiAgICAgICAgcHJldkRlcGxveW1lbnQgPSBkZXBsb3ltZW50O1xyXG4gICAgICAgIHF1ZXJ5U2NyaXB0TWVyZ2UoY29udGV4dCwgJ1lvdXIgbW9kcyBzdGF0ZS9sb2FkIG9yZGVyIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgeW91IHJhbiAnXHJcbiAgICAgICAgICArICd0aGUgc2NyaXB0IG1lcmdlci4gWW91IG1heSB3YW50IHRvIHJ1biB0aGUgbWVyZ2VyIHRvb2wgYW5kIGNoZWNrIHdoZXRoZXIgYW55IG5ldyBzY3JpcHQgY29uZmxpY3RzIGFyZSAnXHJcbiAgICAgICAgICArICdwcmVzZW50LCBvciBpZiBleGlzdGluZyBtZXJnZXMgaGF2ZSBiZWNvbWUgdW5lY2Vzc2FyeS4gUGxlYXNlIGFsc28gbm90ZSB0aGF0IGFueSBsb2FkIG9yZGVyIGNoYW5nZXMgJ1xyXG4gICAgICAgICAgKyAnbWF5IGFmZmVjdCB0aGUgb3JkZXIgaW4gd2hpY2ggeW91ciBjb25mbGljdGluZyBtb2RzIGFyZSBtZWFudCB0byBiZSBtZXJnZWQsIGFuZCBtYXkgcmVxdWlyZSB5b3UgdG8gJ1xyXG4gICAgICAgICAgKyAncmVtb3ZlIHRoZSBleGlzdGluZyBtZXJnZSBhbmQgcmUtYXBwbHkgaXQuJyk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgICAgY29uc3QgZG9jRmlsZXMgPSBkZXBsb3ltZW50Wyd3aXRjaGVyM21lbnVtb2Ryb290J11cclxuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gZmlsZS5yZWxQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcclxuICAgICAgY29uc3QgbWVudU1vZFByb21pc2UgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKGRvY0ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1lbnUgbW9kcyBkZXBsb3llZCAtIHJlbW92ZSB0aGUgbW9kLlxyXG4gICAgICAgICAgcmV0dXJuIG1lbnVNb2QucmVtb3ZlTW9kKGNvbnRleHQuYXBpLCBhY3RpdmVQcm9maWxlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIG1lbnVNb2Qub25EaWREZXBsb3koY29udGV4dC5hcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgICAgIC50aGVuKGFzeW5jIG1vZElkID0+IHtcclxuICAgICAgICAgICAgICBpZiAobW9kSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5hcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIG1vZElkKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiBtZW51TW9kUHJvbWlzZSgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gc2V0SU5JU3RydWN0KGNvbnRleHQsIGxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyKSlcclxuICAgICAgICAudGhlbigoKSA9PiB3cml0ZVRvTW9kU2V0dGluZ3MoKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICByZWZyZXNoRnVuYz8uKCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICAgIH0pO1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdwcm9maWxlLXdpbGwtY2hhbmdlJywgYXN5bmMgKG5ld1Byb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIG5ld1Byb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJpb3JpdHlUeXBlKHByaW9yaXR5VHlwZSkpO1xyXG5cclxuICAgICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShjb250ZXh0LCBsYXN0UHJvZklkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQsIHByb2ZpbGUuaWQpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBtZXJnZWQgaXRlbXMnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2V0dGluZ3MnLCAnd2l0Y2hlcjMnXSwgKHByZXYsIGN1cnJlbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8IHByaW9yaXR5TWFuYWdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICAgIHByaW9yaXR5TWFuYWdlci5wcmlvcml0eVR5cGUgPSBwcmlvcml0eVR5cGU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3B1cmdlLW1vZHMnLCAoKSA9PiB7XHJcbiAgICAgIHJldmVydExPRmlsZSgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=