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
                        context.api.showErrorNotification('Cannot change to locked entry Priority');
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
            .map((modName, idx) => ({
            id: modName,
            name: !!readableNames[modName] ? readableNames[modName] : modName,
            imgUrl: `${__dirname}/gameart.jpg`,
            locked: true,
            prefix: idx + 1,
        }));
        items = items.filter(item => !allMods.merged.includes(item.id)
            && !allMods.manual.includes(item.id)).map((item, idx) => {
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
            accum.push(loadOrder[key]);
        }
        else {
            accum.push(Object.assign(Object.assign({}, loadOrder[key]), { enabled }));
        }
        return accum;
    }, []);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLHVDQUFtRDtBQUNuRCxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLG9EQUFzQztBQUN0QywyQ0FBa0Y7QUFDbEYsNERBQThDO0FBQzlDLHNFQUFxQztBQUVyQywyREFBcUY7QUFFckYsc0ZBQThEO0FBRTlELHdEQUFnQztBQUNoQyxpREFBMkY7QUFFM0YscUNBSWtCO0FBRWxCLHFEQUFtRDtBQUNuRCx1REFBb0Q7QUFFcEQsNkNBQWdFO0FBQ2hFLCtDQUF3RjtBQUV4RixtRUFBNEQ7QUFFNUQsdUNBQTRDO0FBQzVDLHlDQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUUxQixNQUFNLHNCQUFzQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFaEcsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUV0QixNQUFNLEtBQUssR0FBRztJQUNaO1FBQ0UsRUFBRSxFQUFFLHlCQUFnQjtRQUNwQixJQUFJLEVBQUUsa0JBQWtCO1FBQ3hCLElBQUksRUFBRSx5QkFBeUI7UUFDL0IsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLHlCQUF5QjtRQUMzQyxhQUFhLEVBQUU7WUFDYix5QkFBeUI7U0FDMUI7S0FDRjtDQUNGLENBQUM7QUFFRixTQUFTLGtCQUFrQjtJQUN6QixNQUFNLFFBQVEsR0FBRyw2QkFBb0IsRUFBRSxDQUFDO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLElB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LEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFBLGFBQWEsYUFBYixhQUFhLHVCQUFiLGFBQWEsQ0FBRSxNQUFNLE1BQUssZ0JBQU8sSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFO2dCQUN0RSxPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsOEJBQXFCLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRixlQUFlLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLFlBQVksRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgRWxlbWVudCwgcGFyc2VYbWxTdHJpbmcgfSBmcm9tICdsaWJ4bWxqcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIEluaVBhcnNlciBmcm9tICd2b3J0ZXgtcGFyc2UtaW5pJztcclxuaW1wb3J0IHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xyXG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCBtZW51TW9kIGZyb20gJy4vbWVudW1vZCc7XHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyLCBnZXRTY3JpcHRNZXJnZXJEaXIsIHNldE1lcmdlckNvbmZpZyB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IERPX05PVF9ERVBMT1ksIERPX05PVF9ESVNQTEFZLFxyXG4gIEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBnZXRQcmlvcml0eVR5cGVCcmFuY2gsIEkxOE5fTkFNRVNQQUNFLCBJTlBVVF9YTUxfRklMRU5BTUUsXHJcbiAgTE9DS0VEX1BSRUZJWCwgTUVSR0VfSU5WX01BTklGRVNULCBQQVJUX1NVRkZJWCwgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcixcclxuICBTQ1JJUFRfTUVSR0VSX0lELCBVTklfUEFUQ0gsIFVOSUFQUCxcclxufSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyByZWdpc3RlckFjdGlvbnMgfSBmcm9tICcuL2ljb25iYXJBY3Rpb25zJztcclxuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xyXG5cclxuaW1wb3J0IHsgaW5zdGFsbE1peGVkLCB0ZXN0U3VwcG9ydGVkTWl4ZWQgfSBmcm9tICcuL2luc3RhbGxlcnMnO1xyXG5pbXBvcnQgeyBtYWtlT25Db250ZXh0SW1wb3J0LCByZXN0b3JlRnJvbVByb2ZpbGUsIHN0b3JlVG9Qcm9maWxlIH0gZnJvbSAnLi9tZXJnZUJhY2t1cCc7XHJcblxyXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lcyB9IGZyb20gJy4vbWVyZ2VJbnZlbnRvcnlQYXJzaW5nJztcclxuXHJcbmltcG9ydCB7IHNldFByaW9yaXR5VHlwZSB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IFczUmVkdWNlciB9IGZyb20gJy4vcmVkdWNlcnMnO1xyXG5cclxuY29uc3QgR09HX0lEID0gJzEyMDc2NjQ2NjMnO1xyXG5jb25zdCBHT0dfSURfR09UWSA9ICcxNDk1MTM0MzIwJztcclxuY29uc3QgU1RFQU1fSUQgPSAnNDk5NDUwJztcclxuXHJcbmNvbnN0IENPTkZJR19NQVRSSVhfUkVMX1BBVEggPSBwYXRoLmpvaW4oJ2JpbicsICdjb25maWcnLCAncjRnYW1lJywgJ3VzZXJfY29uZmlnX21hdHJpeCcsICdwYycpO1xyXG5cclxubGV0IF9JTklfU1RSVUNUID0ge307XHJcbmxldCBfUFJFVklPVVNfTE8gPSB7fTtcclxuXHJcbmNvbnN0IHRvb2xzID0gW1xyXG4gIHtcclxuICAgIGlkOiBTQ1JJUFRfTUVSR0VSX0lELFxyXG4gICAgbmFtZTogJ1czIFNjcmlwdCBNZXJnZXInLFxyXG4gICAgbG9nbzogJ1dpdGNoZXJTY3JpcHRNZXJnZXIuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXHJcbiAgICBdLFxyXG4gIH0sXHJcbl07XHJcblxyXG5mdW5jdGlvbiB3cml0ZVRvTW9kU2V0dGluZ3MoKSB7XHJcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIuZGVmYXVsdChuZXcgSW5pUGFyc2VyLldpbmFwaUZvcm1hdCgpKTtcclxuICByZXR1cm4gZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpXHJcbiAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSlcclxuICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgIC50aGVuKGluaSA9PiB7XHJcbiAgICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKE9iamVjdC5rZXlzKF9JTklfU1RSVUNUKSwgKGtleSkgPT4ge1xyXG4gICAgICAgIGlmIChfSU5JX1NUUlVDVD8uW2tleV0/LkVuYWJsZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIHVzZXIgdG8gcnVuIG11bHRpcGxlIG9wZXJhdGlvbnMgYXQgb25jZSxcclxuICAgICAgICAgIC8vICBjYXVzaW5nIHRoZSBzdGF0aWMgaW5pIHN0cnVjdHVyZSB0byBiZSBtb2RpZmllZFxyXG4gICAgICAgICAgLy8gIGVsc2V3aGVyZSB3aGlsZSB3ZSdyZSBhdHRlbXB0aW5nIHRvIHdyaXRlIHRvIGZpbGUuIFRoZSB1c2VyIG11c3QndmUgYmVlblxyXG4gICAgICAgICAgLy8gIG1vZGlmeWluZyB0aGUgbG9hZCBvcmRlciB3aGlsZSBkZXBsb3lpbmcuIFRoaXMgc2hvdWxkXHJcbiAgICAgICAgICAvLyAgbWFrZSBzdXJlIHdlIGRvbid0IGF0dGVtcHQgdG8gd3JpdGUgYW55IGludmFsaWQgbW9kIGVudHJpZXMuXHJcbiAgICAgICAgICAvLyAgaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy84NDM3XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluaS5kYXRhW2tleV0gPSB7XHJcbiAgICAgICAgICBFbmFibGVkOiBfSU5JX1NUUlVDVFtrZXldLkVuYWJsZWQsXHJcbiAgICAgICAgICBQcmlvcml0eTogX0lOSV9TVFJVQ1Rba2V5XS5Qcmlvcml0eSxcclxuICAgICAgICAgIFZLOiBfSU5JX1NUUlVDVFtrZXldLlZLLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9KVxyXG4gICAgICAudGhlbigoKSA9PiBwYXJzZXIud3JpdGUoZmlsZVBhdGgsIGluaSkpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5wYXRoICE9PSB1bmRlZmluZWQgJiYgWydFUEVSTScsICdFQlVTWSddLmluY2x1ZGVzKGVyci5jb2RlKSlcclxuICAgICAgPyBQcm9taXNlLnJlamVjdChuZXcgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcihlcnIucGF0aCkpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZU1vZFNldHRpbmdzKCkge1xyXG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAvLyBUaGVvcmV0aWNhbGx5IHRoZSBXaXRjaGVyIDMgZG9jdW1lbnRzIHBhdGggc2hvdWxkIGJlXHJcbiAgLy8gIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoZWl0aGVyIGJ5IHVzIG9yIHRoZSBnYW1lKSBidXRcclxuICAvLyAganVzdCBpbiBjYXNlIGl0IGdvdCByZW1vdmVkIHNvbWVob3csIHdlIHJlLWluc3RhdGUgaXRcclxuICAvLyAgeWV0IGFnYWluLi4uIGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1OFxyXG4gIHJldHVybiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShmaWxlUGF0aCkpXHJcbiAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbn1cclxuXHJcbi8vIEF0dGVtcHRzIHRvIHBhcnNlIGFuZCByZXR1cm4gZGF0YSBmb3VuZCBpbnNpZGVcclxuLy8gIHRoZSBtb2RzLnNldHRpbmdzIGZpbGUgaWYgZm91bmQgLSBvdGhlcndpc2UgdGhpc1xyXG4vLyAgd2lsbCBlbnN1cmUgdGhlIGZpbGUgaXMgcHJlc2VudC5cclxuZnVuY3Rpb24gZW5zdXJlTW9kU2V0dGluZ3MoKSB7XHJcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIuZGVmYXVsdChuZXcgSW5pUGFyc2VyLldpbmFwaUZvcm1hdCgpKTtcclxuICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxyXG4gICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICA/IGNyZWF0ZU1vZFNldHRpbmdzKCkudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpIHtcclxuICByZXR1cm4gZW5zdXJlTW9kU2V0dGluZ3MoKS50aGVuKGluaSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kcyk7XHJcbiAgICBjb25zdCBpbmlFbnRyaWVzID0gT2JqZWN0LmtleXMoaW5pLmRhdGEpO1xyXG4gICAgY29uc3QgbWFudWFsQ2FuZGlkYXRlcyA9IFtdLmNvbmNhdChpbmlFbnRyaWVzLCBbVU5JX1BBVENIXSkuZmlsdGVyKGVudHJ5ID0+IHtcclxuICAgICAgY29uc3QgaGFzVm9ydGV4S2V5ID0gdXRpbC5nZXRTYWZlKGluaS5kYXRhW2VudHJ5XSwgWydWSyddLCB1bmRlZmluZWQpICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgIHJldHVybiAoKCFoYXNWb3J0ZXhLZXkpIHx8IChpbmkuZGF0YVtlbnRyeV0uVksgPT09IGVudHJ5KSAmJiAhbW9kS2V5cy5pbmNsdWRlcyhlbnRyeSkpO1xyXG4gICAgfSkgfHwgW1VOSV9QQVRDSF07XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBTZXQobWFudWFsQ2FuZGlkYXRlcykpO1xyXG4gIH0pXHJcbiAgLnRoZW4odW5pcXVlQ2FuZGlkYXRlcyA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIEhvdy93aHkgYXJlIHdlIGV2ZW4gaGVyZSA/XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQhJykpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyk7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKEFycmF5LmZyb20odW5pcXVlQ2FuZGlkYXRlcyksIChhY2N1bSwgbW9kKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vZEZvbGRlciA9IHBhdGguam9pbihtb2RzUGF0aCwgbW9kKTtcclxuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kRm9sZGVyKSlcclxuICAgICAgICAudGhlbigoKSA9PiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgLy8gT2ssIHdlIGtub3cgdGhlIGZvbGRlciBpcyB0aGVyZSAtIGxldHMgZW5zdXJlIHRoYXRcclxuICAgICAgICAgIC8vICBpdCBhY3R1YWxseSBjb250YWlucyBmaWxlcy5cclxuICAgICAgICAgIGxldCBjYW5kaWRhdGVzID0gW107XHJcbiAgICAgICAgICBhd2FpdCByZXF1aXJlKCd0dXJib3dhbGsnKS5kZWZhdWx0KHBhdGguam9pbihtb2RzUGF0aCwgbW9kKSwgZW50cmllcyA9PiB7XHJcbiAgICAgICAgICAgIGNhbmRpZGF0ZXMgPSBbXS5jb25jYXQoY2FuZGlkYXRlcywgZW50cmllcy5maWx0ZXIoZW50cnkgPT4gKCFlbnRyeS5pc0RpcmVjdG9yeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSkgIT09ICcnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoZW50cnk/LmxpbmtDb3VudCA9PT0gdW5kZWZpbmVkIHx8IGVudHJ5LmxpbmtDb3VudCA8PSAxKSkpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gKFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluZGV4T2YoZXJyLmNvZGUpICE9PSAtMSlcclxuICAgICAgICAgICAgPyBudWxsIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBtYXBwZWQgPSBhd2FpdCBCbHVlYmlyZC5tYXAoY2FuZGlkYXRlcywgY2FuZCA9PlxyXG4gICAgICAgICAgICBmcy5zdGF0QXN5bmMoY2FuZC5maWxlUGF0aClcclxuICAgICAgICAgICAgICAudGhlbihzdGF0cyA9PiBzdGF0cy5pc1N5bWJvbGljTGluaygpXHJcbiAgICAgICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICA6IFByb21pc2UucmVzb2x2ZShjYW5kLmZpbGVQYXRoKSlcclxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKSk7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShtYXBwZWQpO1xyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC50aGVuKChmaWxlczogc3RyaW5nW10pID0+IHtcclxuICAgICAgICAgIGlmIChmaWxlcy5maWx0ZXIoZmlsZSA9PiAhIWZpbGUpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChtb2QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+ICgoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSAmJiAoZXJyLnBhdGggPT09IG1vZEZvbGRlcikpXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZShhY2N1bSlcclxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICB9LCBbXSk7XHJcbiAgfSlcclxuICAuY2F0Y2goZXJyID0+IHtcclxuICAgIC8vIFVzZXJDYW5jZWxlZCB3b3VsZCBzdWdnZXN0IHdlIHdlcmUgdW5hYmxlIHRvIHN0YXQgdGhlIFczIG1vZCBmb2xkZXJcclxuICAgIC8vICBwcm9iYWJseSBkdWUgdG8gYSBwZXJtaXNzaW9uaW5nIGlzc3VlIChFTk9FTlQgaXMgaGFuZGxlZCBhYm92ZSlcclxuICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCk7XHJcbiAgICBjb25zdCBwcm9jZXNzQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpO1xyXG4gICAgY29uc3QgYWxsb3dSZXBvcnQgPSAoIXVzZXJDYW5jZWxlZCAmJiAhcHJvY2Vzc0NhbmNlbGVkKTtcclxuICAgIGNvbnN0IGRldGFpbHMgPSB1c2VyQ2FuY2VsZWRcclxuICAgICAgPyAnVm9ydGV4IHRyaWVkIHRvIHNjYW4geW91ciBXMyBtb2RzIGZvbGRlciBmb3IgbWFudWFsbHkgYWRkZWQgbW9kcyBidXQgJ1xyXG4gICAgICAgICsgJ3dhcyBibG9ja2VkIGJ5IHlvdXIgT1MvQVYgLSBwbGVhc2UgbWFrZSBzdXJlIHRvIGZpeCB0aGlzIGJlZm9yZSB5b3UgJ1xyXG4gICAgICAgICsgJ3Byb2NlZWQgdG8gbW9kIFczIGFzIHlvdXIgbW9kZGluZyBleHBlcmllbmNlIHdpbGwgYmUgc2V2ZXJlbHkgYWZmZWN0ZWQuJ1xyXG4gICAgICA6IGVycjtcclxuICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGxvb2t1cCBtYW51YWxseSBhZGRlZCBtb2RzJyxcclxuICAgICAgZGV0YWlscywgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBCbHVlYmlyZDxzdHJpbmc+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoXHJcbiAgICAgICdIS0VZX0xPQ0FMX01BQ0hJTkUnLFxyXG4gICAgICAnU29mdHdhcmVcXFxcQ0QgUHJvamVjdCBSZWRcXFxcVGhlIFdpdGNoZXIgMycsXHJcbiAgICAgICdJbnN0YWxsRm9sZGVyJyk7XHJcbiAgICBpZiAoIWluc3RQYXRoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSBhcyBzdHJpbmcpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtHT0dfSURfR09UWSwgR09HX0lELCBTVEVBTV9JRF0pXHJcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkVEwoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09ICd3aXRjaGVyMycpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICAgIGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpICE9PSAtMSkgIT09IHVuZGVmaW5lZCk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFRMKGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIGxldCBwcmVmaXggPSBmaWxlcy5yZWR1Y2UoKHByZXYsIGZpbGUpID0+IHtcclxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgY29uc3QgaWR4ID0gY29tcG9uZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICBpZiAoKGlkeCA+IDApICYmICgocHJldiA9PT0gdW5kZWZpbmVkKSB8fCAoaWR4IDwgcHJldi5sZW5ndGgpKSkge1xyXG4gICAgICByZXR1cm4gY29tcG9uZW50cy5zbGljZSgwLCBpZHgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9XHJcbiAgfSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgcHJlZml4ID0gKHByZWZpeCA9PT0gdW5kZWZpbmVkKSA/ICcnIDogcHJlZml4LmpvaW4ocGF0aC5zZXApICsgcGF0aC5zZXA7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbGVzXHJcbiAgICAuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApICYmIGZpbGUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKHByZWZpeCkpXHJcbiAgICAubWFwKGZpbGUgPT4gKHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnNsaWNlKHByZWZpeC5sZW5ndGgpLFxyXG4gICAgfSkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2NvbnRlbnQnICsgcGF0aC5zZXApICE9PSB1bmRlZmluZWQpKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsQ29udGVudChmaWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGUpIHtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbGVzXHJcbiAgICAuZmlsdGVyKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2NvbnRlbnQnICsgcGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHtcclxuICAgICAgY29uc3QgZmlsZUJhc2UgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5zbGljZSgxKS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oJ21vZCcgKyBkZXN0aW5hdGlvblBhdGgsIGZpbGVCYXNlKSxcclxuICAgICAgfTtcclxuICB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxNZW51TW9kKGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIC8vIElucHV0IHNwZWNpZmljIGZpbGVzIG5lZWQgdG8gYmUgaW5zdGFsbGVkIG91dHNpZGUgdGhlIG1vZHMgZm9sZGVyIHdoaWxlXHJcbiAgLy8gIGFsbCBvdGhlciBtb2QgZmlsZXMgYXJlIHRvIGJlIGluc3RhbGxlZCBhcyB1c3VhbC5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGZpbGUpKSAhPT0gJycpO1xyXG4gIGNvbnN0IGlucHV0RmlsZXMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBmaWxlLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKTtcclxuICBjb25zdCB1bmlxdWVJbnB1dCA9IGlucHV0RmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgLy8gU29tZSBtb2RzIHRlbmQgdG8gaW5jbHVkZSBhIGJhY2t1cCBmaWxlIG1lYW50IGZvciB0aGUgdXNlciB0byByZXN0b3JlXHJcbiAgICAvLyAgaGlzIGdhbWUgdG8gdmFuaWxsYSAob2J2cyB3ZSBvbmx5IHdhbnQgdG8gYXBwbHkgdGhlIG5vbi1iYWNrdXApLlxyXG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGl0ZXIpO1xyXG5cclxuICAgIGlmIChhY2N1bS5maW5kKGVudHJ5ID0+IHBhdGguYmFzZW5hbWUoZW50cnkpID09PSBmaWxlTmFtZSkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBUaGlzIGNvbmZpZyBmaWxlIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhlIGFjY3VtdWxhdG9yLlxyXG4gICAgICAvLyAgSWdub3JlIHRoaXMgaW5zdGFuY2UuXHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbnN0YW5jZXMgPSBpbnB1dEZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IGZpbGVOYW1lKTtcclxuICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAvLyBXZSBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBtZW51IGNvbmZpZyBmaWxlIC0gbW9kIGF1dGhvciBwcm9iYWJseSBpbmNsdWRlZFxyXG4gICAgICAvLyAgYSBiYWNrdXAgZmlsZSB0byByZXN0b3JlIHZhbmlsbGEgc3RhdGUsIG9yIHBlcmhhcHMgdGhpcyBpcyBhIHZhcmlhbnQgbW9kIHdoaWNoIHdlXHJcbiAgICAgIC8vICBjYW4ndCBjdXJyZW50bHkgc3VwcG9ydC5cclxuICAgICAgLy8gSXQncyBkaWZmaWN1bHQgZm9yIHVzIHRvIGNvcnJlY3RseSBpZGVudGlmeSB0aGUgY29ycmVjdCBmaWxlIGJ1dCB3ZSdyZSBnb2luZyB0b1xyXG4gICAgICAvLyAgdHJ5IGFuZCBndWVzcyBiYXNlZCBvbiB3aGV0aGVyIHRoZSBjb25maWcgZmlsZSBoYXMgYSBcImJhY2t1cFwiIGZvbGRlciBzZWdtZW50XHJcbiAgICAgIC8vICBvdGhlcndpc2Ugd2UganVzdCBhZGQgdGhlIGZpcnN0IGZpbGUgaW5zdGFuY2UgKEknbSBnb2luZyB0byByZWdyZXQgYWRkaW5nIHRoaXMgYXJlbid0IEkgPylcclxuICAgICAgaWYgKGl0ZXIudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdiYWNrdXAnKSA9PT0gLTEpIHtcclxuICAgICAgICAvLyBXZSdyZSBnb2luZyB0byBhc3N1bWUgdGhhdCB0aGlzIGlzIHRoZSByaWdodCBmaWxlLlxyXG4gICAgICAgIGFjY3VtLnB1c2goaXRlcik7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFRoaXMgaXMgYSB1bmlxdWUgbWVudSBjb25maWd1cmF0aW9uIGZpbGUgLSBhZGQgaXQuXHJcbiAgICAgIGFjY3VtLnB1c2goaXRlcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgW10pO1xyXG5cclxuICBsZXQgb3RoZXJGaWxlcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+ICFpbnB1dEZpbGVzLmluY2x1ZGVzKGZpbGUpKTtcclxuICBjb25zdCBpbnB1dEZpbGVEZXN0aW5hdGlvbiA9IENPTkZJR19NQVRSSVhfUkVMX1BBVEg7XHJcblxyXG4gIC8vIEdldCB0aGUgbW9kJ3Mgcm9vdCBmb2xkZXIuXHJcbiAgY29uc3QgYmluSWR4ID0gdW5pcXVlSW5wdXRbMF0uc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpO1xyXG5cclxuICAvLyBSZWZlcnMgdG8gZmlsZXMgbG9jYXRlZCBpbnNpZGUgdGhlIGFyY2hpdmUncyAnTW9kcycgZGlyZWN0b3J5LlxyXG4gIC8vICBUaGlzIGFycmF5IGNhbiB2ZXJ5IHdlbGwgYmUgZW1wdHkgaWYgYSBtb2RzIGZvbGRlciBkb2Vzbid0IGV4aXN0XHJcbiAgY29uc3QgbW9kRmlsZXMgPSBvdGhlckZpbGVzLmZpbHRlcihmaWxlID0+XHJcbiAgICBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluY2x1ZGVzKCdtb2RzJykpO1xyXG5cclxuICBjb25zdCBtb2RzSWR4ID0gKG1vZEZpbGVzLmxlbmd0aCA+IDApXHJcbiAgICA/IG1vZEZpbGVzWzBdLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ21vZHMnKVxyXG4gICAgOiAtMTtcclxuICBjb25zdCBtb2ROYW1lcyA9IChtb2RzSWR4ICE9PSAtMSlcclxuICAgID8gbW9kRmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgICBjb25zdCBtb2ROYW1lID0gaXRlci5zcGxpdChwYXRoLnNlcCkuc3BsaWNlKG1vZHNJZHggKyAxLCAxKS5qb2luKCk7XHJcbiAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobW9kTmFtZSkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKG1vZE5hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKVxyXG4gICAgOiBbXTtcclxuICAvLyBUaGUgcHJlc2VuY2Ugb2YgYSBtb2RzIGZvbGRlciBpbmRpY2F0ZXMgdGhhdCB0aGlzIG1vZCBtYXkgcHJvdmlkZVxyXG4gIC8vICBzZXZlcmFsIG1vZCBlbnRyaWVzLlxyXG4gIGlmIChtb2RGaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICBvdGhlckZpbGVzID0gb3RoZXJGaWxlcy5maWx0ZXIoZmlsZSA9PiAhbW9kRmlsZXMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIH1cclxuXHJcbiAgLy8gV2UncmUgaG9waW5nIHRoYXQgdGhlIG1vZCBhdXRob3IgaGFzIGluY2x1ZGVkIHRoZSBtb2QgbmFtZSBpbiB0aGUgYXJjaGl2ZSdzXHJcbiAgLy8gIHN0cnVjdHVyZSAtIGlmIGhlIGRpZG4ndCAtIHdlJ3JlIGdvaW5nIHRvIHVzZSB0aGUgZGVzdGluYXRpb24gcGF0aCBpbnN0ZWFkLlxyXG4gIGNvbnN0IG1vZE5hbWUgPSAoYmluSWR4ID4gMClcclxuICAgID8gaW5wdXRGaWxlc1swXS5zcGxpdChwYXRoLnNlcClbYmluSWR4IC0gMV1cclxuICAgIDogKCdtb2QnICsgcGF0aC5iYXNlbmFtZShkZXN0aW5hdGlvblBhdGgsICcuaW5zdGFsbGluZycpKS5yZXBsYWNlKC9cXHMvZywgJycpO1xyXG5cclxuICBjb25zdCB0cmltbWVkRmlsZXMgPSBvdGhlckZpbGVzLm1hcChmaWxlID0+IHtcclxuICAgIGNvbnN0IHNvdXJjZSA9IGZpbGU7XHJcbiAgICBsZXQgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoYmluSWR4KTtcclxuICAgIGlmIChyZWxQYXRoWzBdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gVGhpcyBmaWxlIG11c3QndmUgYmVlbiBpbnNpZGUgdGhlIHJvb3Qgb2YgdGhlIGFyY2hpdmU7XHJcbiAgICAgIC8vICBkZXBsb3kgYXMgaXMuXHJcbiAgICAgIHJlbFBhdGggPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmaXJzdFNlZyA9IHJlbFBhdGhbMF0udG9Mb3dlckNhc2UoKTtcclxuICAgIGlmIChmaXJzdFNlZyA9PT0gJ2NvbnRlbnQnIHx8IGZpcnN0U2VnLmVuZHNXaXRoKFBBUlRfU1VGRklYKSkge1xyXG4gICAgICByZWxQYXRoID0gW10uY29uY2F0KFsnTW9kcycsIG1vZE5hbWVdLCByZWxQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzb3VyY2UsXHJcbiAgICAgIHJlbFBhdGg6IHJlbFBhdGguam9pbihwYXRoLnNlcCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCB0b0NvcHlJbnN0cnVjdGlvbiA9IChzb3VyY2UsIGRlc3RpbmF0aW9uKSA9PiAoe1xyXG4gICAgdHlwZTogJ2NvcHknLFxyXG4gICAgc291cmNlLFxyXG4gICAgZGVzdGluYXRpb24sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGlucHV0SW5zdHJ1Y3Rpb25zID0gdW5pcXVlSW5wdXQubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUsIHBhdGguam9pbihpbnB1dEZpbGVEZXN0aW5hdGlvbiwgcGF0aC5iYXNlbmFtZShmaWxlKSkpKTtcclxuXHJcbiAgY29uc3Qgb3RoZXJJbnN0cnVjdGlvbnMgPSB0cmltbWVkRmlsZXMubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUuc291cmNlLCBmaWxlLnJlbFBhdGgpKTtcclxuXHJcbiAgY29uc3QgbW9kRmlsZUluc3RydWN0aW9ucyA9IG1vZEZpbGVzLm1hcChmaWxlID0+XHJcbiAgICB0b0NvcHlJbnN0cnVjdGlvbihmaWxlLCBmaWxlKSk7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChpbnB1dEluc3RydWN0aW9ucywgb3RoZXJJbnN0cnVjdGlvbnMsIG1vZEZpbGVJbnN0cnVjdGlvbnMpO1xyXG4gIGlmIChtb2ROYW1lcy5sZW5ndGggPiAwKSB7XHJcbiAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICBrZXk6ICdtb2RDb21wb25lbnRzJyxcclxuICAgICAgdmFsdWU6IG1vZE5hbWVzLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RNZW51TW9kUm9vdChpbnN0cnVjdGlvbnM6IGFueVtdLCBnYW1lSWQ6IHN0cmluZyk6XHJcbiAgUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0IHwgYm9vbGVhbj4ge1xyXG4gIGNvbnN0IHByZWRpY2F0ZSA9IChpbnN0cikgPT4gKCEhZ2FtZUlkKVxyXG4gICAgPyAoKEdBTUVfSUQgPT09IGdhbWVJZCkgJiYgKGluc3RyLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKSlcclxuICAgIDogKChpbnN0ci50eXBlID09PSAnY29weScpICYmIChpbnN0ci5kZXN0aW5hdGlvbi5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSkpO1xyXG5cclxuICByZXR1cm4gKCEhZ2FtZUlkKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgIHN1cHBvcnRlZDogaW5zdHJ1Y3Rpb25zLmZpbmQocHJlZGljYXRlKSAhPT0gdW5kZWZpbmVkLFxyXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gICAgICB9KVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUoaW5zdHJ1Y3Rpb25zLmZpbmQocHJlZGljYXRlKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFRMKGluc3RydWN0aW9ucykge1xyXG4gIGNvbnN0IG1lbnVNb2RGaWxlcyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gISFpbnN0ci5kZXN0aW5hdGlvblxyXG4gICAgJiYgaW5zdHIuZGVzdGluYXRpb24uaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpO1xyXG4gIGlmIChtZW51TW9kRmlsZXMubGVuZ3RoID4gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxyXG4gICAgaW5zdHJ1Y3Rpb24gPT4gISFpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbiAmJiBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ21vZHMnICsgcGF0aC5zZXApLFxyXG4gICkgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RETEMoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChcclxuICAgIGluc3RydWN0aW9uID0+ICEhaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24gJiYgaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdkbGMnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpIHtcclxuICBjb25zdCBub3RpZklkID0gJ21pc3Npbmctc2NyaXB0LW1lcmdlcic7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6IG5vdGlmSWQsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdXaXRjaGVyIDMgc2NyaXB0IG1lcmdlciBpcyBtaXNzaW5nL21pc2NvbmZpZ3VyZWQnLFxyXG4gICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXInLCB7XHJcbiAgICAgICAgICAgIGJiY29kZTogYXBpLnRyYW5zbGF0ZSgnVm9ydGV4IGlzIHVuYWJsZSB0byByZXNvbHZlIHRoZSBTY3JpcHQgTWVyZ2VyXFwncyBsb2NhdGlvbi4gVGhlIHRvb2wgbmVlZHMgdG8gYmUgZG93bmxvYWRlZCBhbmQgY29uZmlndXJlZCBtYW51YWxseS4gJ1xyXG4gICAgICAgICAgICAgICsgJ1t1cmw9aHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL1Rvb2xfU2V0dXA6X1dpdGNoZXJfM19TY3JpcHRfTWVyZ2VyXUZpbmQgb3V0IG1vcmUgYWJvdXQgaG93IHRvIGNvbmZpZ3VyZSBpdCBhcyBhIHRvb2wgZm9yIHVzZSBpbiBWb3J0ZXguWy91cmxdW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICAgICAgICsgJ05vdGU6IFdoaWxlIHNjcmlwdCBtZXJnaW5nIHdvcmtzIHdlbGwgd2l0aCB0aGUgdmFzdCBtYWpvcml0eSBvZiBtb2RzLCB0aGVyZSBpcyBubyBndWFyYW50ZWUgZm9yIGEgc2F0aXNmeWluZyBvdXRjb21lIGluIGV2ZXJ5IHNpbmdsZSBjYXNlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0Rvd25sb2FkIFNjcmlwdCBNZXJnZXInLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3dpdGNoZXIzL21vZHMvNDg0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJykpIH0sXHJcbiAgICAgICAgICBdKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSB7XHJcbiAgY29uc3QgZmluZFNjcmlwdE1lcmdlciA9IChlcnJvcikgPT4ge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBzY3JpcHQgbWVyZ2VyJywgZXJyb3IpO1xyXG4gICAgY29uc3Qgc2NyaXB0TWVyZ2VyUGF0aCA9IGdldFNjcmlwdE1lcmdlckRpcihjb250ZXh0KTtcclxuICAgIGlmIChzY3JpcHRNZXJnZXJQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHNldE1lcmdlckNvbmZpZyhkaXNjb3ZlcnkucGF0aCwgc2NyaXB0TWVyZ2VyUGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBlbnN1cmVQYXRoID0gKGRpcnBhdGgpID0+XHJcbiAgICBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKGRpcnBhdGgpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRUVYSVNUJylcclxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKSxcclxuICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJykpLFxyXG4gICAgZW5zdXJlUGF0aChwYXRoLmRpcm5hbWUoZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKSkpXSlcclxuICAgICAgLnRoZW4oKCkgPT4gZG93bmxvYWRTY3JpcHRNZXJnZXIoY29udGV4dClcclxuICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogZmluZFNjcmlwdE1lcmdlcihlcnIpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFNjcmlwdE1lcmdlclRvb2woYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXI/LnBhdGgpIHtcclxuICAgIHJldHVybiBzY3JpcHRNZXJnZXI7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5TY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3QgdG9vbCA9IGdldFNjcmlwdE1lcmdlclRvb2woYXBpKTtcclxuICBpZiAodG9vbD8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXBpLnJ1bkV4ZWN1dGFibGUodG9vbC5wYXRoLCBbXSwgeyBzdWdnZXN0RGVwbG95OiB0cnVlIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBydW4gdG9vbCcsIGVycixcclxuICAgICAgeyBhbGxvd1JlcG9ydDogWydFUEVSTScsICdFQUNDRVNTJywgJ0VOT0VOVCddLmluZGV4T2YoZXJyLmNvZGUpICE9PSAtMSB9KSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEFsbE1vZHMoY29udGV4dCkge1xyXG4gIC8vIE1vZCB0eXBlcyB3ZSBkb24ndCB3YW50IHRvIGRpc3BsYXkgaW4gdGhlIExPIHBhZ2VcclxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgbWVyZ2VkOiBbXSxcclxuICAgICAgbWFudWFsOiBbXSxcclxuICAgICAgbWFuYWdlZDogW10sXHJcbiAgICB9KTtcclxuICB9XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG5cclxuICAvLyBPbmx5IHNlbGVjdCBtb2RzIHdoaWNoIGFyZSBlbmFibGVkLCBhbmQgYXJlIG5vdCBhIG1lbnUgbW9kLlxyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpLmZpbHRlcihrZXkgPT5cclxuICAgICghIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpKTtcclxuXHJcbiAgY29uc3QgbWVyZ2VkTW9kTmFtZXMgPSBhd2FpdCBnZXRNZXJnZWRNb2ROYW1lcyhjb250ZXh0KTtcclxuICBjb25zdCBtYW51YWxseUFkZGVkTW9kcyA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbmFnZWRNb2RzID0gYXdhaXQgZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQsIGVuYWJsZWRNb2RzLm1hcChrZXkgPT4gbW9kc1trZXldKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBtZXJnZWQ6IG1lcmdlZE1vZE5hbWVzLFxyXG4gICAgbWFudWFsOiBtYW51YWxseUFkZGVkTW9kcy5maWx0ZXIobW9kID0+ICFtZXJnZWRNb2ROYW1lcy5pbmNsdWRlcyhtb2QpKSxcclxuICAgIG1hbmFnZWQ6IG1hbmFnZWRNb2RzLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpIHtcclxuICByZXR1cm4gZ2V0QWxsTW9kcyhjb250ZXh0KS50aGVuKG1vZE1hcCA9PiB7XHJcbiAgICBfSU5JX1NUUlVDVCA9IHt9O1xyXG4gICAgY29uc3QgbW9kcyA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtb2RNYXAubWFuYWdlZCwgbW9kTWFwLm1hbnVhbCk7XHJcbiAgICBjb25zdCBmaWx0ZXJGdW5jID0gKG1vZE5hbWU6IHN0cmluZykgPT4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpO1xyXG4gICAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIoZmlsdGVyRnVuYyk7XHJcbiAgICBjb25zdCBtYW5hZ2VkTG9ja2VkID0gbW9kTWFwLm1hbmFnZWRcclxuICAgICAgLmZpbHRlcihlbnRyeSA9PiBmaWx0ZXJGdW5jKGVudHJ5Lm5hbWUpKVxyXG4gICAgICAubWFwKGVudHJ5ID0+IGVudHJ5Lm5hbWUpO1xyXG4gICAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkLCBtYW5hZ2VkTG9ja2VkKTtcclxuICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKG1vZHMsIChtb2QsIGlkeCkgPT4ge1xyXG4gICAgICBsZXQgbmFtZTtcclxuICAgICAgbGV0IGtleTtcclxuICAgICAgaWYgKHR5cGVvZihtb2QpID09PSAnb2JqZWN0JyAmJiBtb2QgIT09IG51bGwpIHtcclxuICAgICAgICBuYW1lID0gbW9kLm5hbWU7XHJcbiAgICAgICAga2V5ID0gbW9kLmlkO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5hbWUgPSBtb2Q7XHJcbiAgICAgICAga2V5ID0gbW9kO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBMT0VudHJ5ID0gdXRpbC5nZXRTYWZlKGxvYWRPcmRlciwgW2tleV0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmIChpZHggPT09IDApIHtcclxuICAgICAgICBwcmlvcml0eU1hbmFnZXIucmVzZXRNYXhQcmlvcml0eSgpO1xyXG4gICAgICB9XHJcbiAgICAgIF9JTklfU1RSVUNUW25hbWVdID0ge1xyXG4gICAgICAgIC8vIFRoZSBJTkkgZmlsZSdzIGVuYWJsZWQgYXR0cmlidXRlIGV4cGVjdHMgMSBvciAwXHJcbiAgICAgICAgRW5hYmxlZDogKExPRW50cnkgIT09IHVuZGVmaW5lZCkgPyBMT0VudHJ5LmVuYWJsZWQgPyAxIDogMCA6IDEsXHJcbiAgICAgICAgUHJpb3JpdHk6IHRvdGFsTG9ja2VkLmluY2x1ZGVzKG5hbWUpXHJcbiAgICAgICAgICA/IHRvdGFsTG9ja2VkLmluZGV4T2YobmFtZSlcclxuICAgICAgICAgIDogcHJpb3JpdHlNYW5hZ2VyLmdldFByaW9yaXR5KHsgaWQ6IGtleSB9KSxcclxuICAgICAgICBWSzoga2V5LFxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmxldCByZWZyZXNoRnVuYztcclxuLy8gaXRlbTogSUxvYWRPcmRlckRpc3BsYXlJdGVtXHJcbmZ1bmN0aW9uIGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCBtaW5Qcmlvcml0eSwgb25TZXRQcmlvcml0eSkge1xyXG4gIGNvbnN0IHByaW9yaXR5SW5wdXREaWFsb2cgPSAoKSA9PiB7XHJcbiAgICByZXR1cm4gbmV3IEJsdWViaXJkKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NldCBOZXcgUHJpb3JpdHknLCB7XHJcbiAgICAgICAgdGV4dDogY29udGV4dC5hcGkudHJhbnNsYXRlKCdJbnNlcnQgbmV3IG51bWVyaWNhbCBwcmlvcml0eSBmb3Ige3tpdGVtTmFtZX19IGluIHRoZSBpbnB1dCBib3g6JywgeyByZXBsYWNlOiB7IGl0ZW1OYW1lOiBpdGVtLm5hbWUgfSB9KSxcclxuICAgICAgICBpbnB1dDogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3czUHJpb3JpdHlJbnB1dCcsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnUHJpb3JpdHknLFxyXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IF9JTklfU1RSVUNUW2l0ZW0uaWRdPy5Qcmlvcml0eSB8fCAwLFxyXG4gICAgICAgICAgfV0sXHJcbiAgICAgIH0sIFsgeyBsYWJlbDogJ0NhbmNlbCcgfSwgeyBsYWJlbDogJ1NldCcsIGRlZmF1bHQ6IHRydWUgfSBdKVxyXG4gICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnU2V0Jykge1xyXG4gICAgICAgICAgY29uc3QgaXRlbUtleSA9IE9iamVjdC5rZXlzKF9JTklfU1RSVUNUKS5maW5kKGtleSA9PiBfSU5JX1NUUlVDVFtrZXldLlZLID09PSBpdGVtLmlkKTtcclxuICAgICAgICAgIGNvbnN0IHdhbnRlZFByaW9yaXR5ID0gcmVzdWx0LmlucHV0Wyd3M1ByaW9yaXR5SW5wdXQnXTtcclxuICAgICAgICAgIGlmICh3YW50ZWRQcmlvcml0eSA8PSBtaW5Qcmlvcml0eSkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0Nhbm5vdCBjaGFuZ2UgdG8gbG9ja2VkIGVudHJ5IFByaW9yaXR5Jyk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaXRlbUtleSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIF9JTklfU1RSVUNUW2l0ZW1LZXldLlByaW9yaXR5ID0gcGFyc2VJbnQod2FudGVkUHJpb3JpdHksIDEwKTtcclxuICAgICAgICAgICAgb25TZXRQcmlvcml0eShpdGVtS2V5LCB3YW50ZWRQcmlvcml0eSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzZXQgcHJpb3JpdHkgLSBtb2QgaXMgbm90IGluIGluaSBzdHJ1Y3QnLCB7IG1vZElkOiBpdGVtLmlkIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH07XHJcbiAgY29uc3QgaXRlbUFjdGlvbnMgPSBbXHJcbiAgICB7XHJcbiAgICAgIHNob3c6IGl0ZW0ubG9ja2VkICE9PSB0cnVlLFxyXG4gICAgICB0aXRsZTogJ1NldCBNYW51YWwgUHJpb3JpdHknLFxyXG4gICAgICBhY3Rpb246ICgpID0+IHByaW9yaXR5SW5wdXREaWFsb2coKSxcclxuICAgIH0sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIGl0ZW1BY3Rpb25zO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIHByaW9yaXR5TWFuYWdlcik6IFByb21pc2U8YW55W10+IHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCB7IGdldFByaW9yaXR5LCByZXNldE1heFByaW9yaXR5IH0gPSBwcmlvcml0eU1hbmFnZXI7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIFdoYXQgYW4gb2RkIHVzZSBjYXNlIC0gcGVyaGFwcyB0aGUgdXNlciBoYWQgc3dpdGNoZWQgZ2FtZU1vZGVzIG9yXHJcbiAgICAvLyAgZXZlbiBkZWxldGVkIGhpcyBwcm9maWxlIGR1cmluZyB0aGUgcHJlLXNvcnQgZnVuY3Rpb25hbGl0eSA/XHJcbiAgICAvLyAgT2RkIGJ1dCBwbGF1c2libGUgSSBzdXBwb3NlID9cclxuICAgIGxvZygnd2FybicsICdbVzNdIHVuYWJsZSB0byBwcmVzb3J0IGR1ZSB0byBubyBhY3RpdmUgcHJvZmlsZScpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfVxyXG5cclxuICBsZXQgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBvblNldFByaW9yaXR5ID0gKGl0ZW1LZXksIHdhbnRlZFByaW9yaXR5KSA9PiB7XHJcbiAgICByZXR1cm4gd3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHdhbnRlZFByaW9yaXR5ID0gK3dhbnRlZFByaW9yaXR5O1xyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IG1vZElkID0gX0lOSV9TVFJVQ1RbaXRlbUtleV0uVks7XHJcbiAgICAgICAgY29uc3QgbG9FbnRyeSA9IGxvYWRPcmRlclttb2RJZF07XHJcbiAgICAgICAgaWYgKHByaW9yaXR5TWFuYWdlci5wcmlvcml0eVR5cGUgPT09ICdwb3NpdGlvbi1iYXNlZCcpIHtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyRW50cnkoXHJcbiAgICAgICAgICAgIGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB7XHJcbiAgICAgICAgICAgICAgLi4ubG9FbnRyeSxcclxuICAgICAgICAgICAgICBwb3M6IChsb0VudHJ5LnBvcyA8IHdhbnRlZFByaW9yaXR5KSA/IHdhbnRlZFByaW9yaXR5IDogd2FudGVkUHJpb3JpdHkgLSAyLFxyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXJFbnRyeShcclxuICAgICAgICAgICAgYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHtcclxuICAgICAgICAgICAgICAuLi5sb0VudHJ5LFxyXG4gICAgICAgICAgICAgIHByZWZpeDogcGFyc2VJbnQoX0lOSV9TVFJVQ1RbaXRlbUtleV0uUHJpb3JpdHksIDEwKSxcclxuICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZnJlc2hGdW5jICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJlZnJlc2hGdW5jKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgfTtcclxuICBjb25zdCBhbGxNb2RzID0gYXdhaXQgZ2V0QWxsTW9kcyhjb250ZXh0KTtcclxuICBpZiAoKGFsbE1vZHMubWVyZ2VkLmxlbmd0aCA9PT0gMCkgJiYgKGFsbE1vZHMubWFudWFsLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgIGl0ZW1zLm1hcCgoaXRlbSwgaWR4KSA9PiB7XHJcbiAgICAgIGlmIChpZHggPT09IDApIHtcclxuICAgICAgICByZXNldE1heFByaW9yaXR5KCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5pdGVtLFxyXG4gICAgICAgIGNvbnRleHRNZW51QWN0aW9uczogZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQsIGl0ZW0sIDAsIG9uU2V0UHJpb3JpdHkpLFxyXG4gICAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGZpbHRlckZ1bmMgPSAobW9kTmFtZTogc3RyaW5nKSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCk7XHJcbiAgY29uc3QgbG9ja2VkTW9kcyA9IFtdLmNvbmNhdChhbGxNb2RzLm1hbnVhbC5maWx0ZXIoZmlsdGVyRnVuYyksXHJcbiAgICBhbGxNb2RzLm1hbmFnZWQuZmlsdGVyKGVudHJ5ID0+IGZpbHRlckZ1bmMoZW50cnkubmFtZSkpXHJcbiAgICAgICAgICAgICAgICAgICAubWFwKGVudHJ5ID0+IGVudHJ5Lm5hbWUpKTtcclxuICBjb25zdCByZWFkYWJsZU5hbWVzID0ge1xyXG4gICAgW1VOSV9QQVRDSF06ICdVbmlmaWNhdGlvbi9Db21tdW5pdHkgUGF0Y2gnLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGxvY2tlZEVudHJpZXMgPSBbXS5jb25jYXQoYWxsTW9kcy5tZXJnZWQsIGxvY2tlZE1vZHMpXHJcbiAgICAubWFwKChtb2ROYW1lLCBpZHgpID0+ICh7XHJcbiAgICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgICBuYW1lOiAhIXJlYWRhYmxlTmFtZXNbbW9kTmFtZV0gPyByZWFkYWJsZU5hbWVzW21vZE5hbWVdIDogbW9kTmFtZSxcclxuICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgICBwcmVmaXg6IGlkeCArIDEsXHJcbiAgfSkpO1xyXG5cclxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+ICFhbGxNb2RzLm1lcmdlZC5pbmNsdWRlcyhpdGVtLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWFsbE1vZHMubWFudWFsLmluY2x1ZGVzKGl0ZW0uaWQpKS5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICByZXNldE1heFByaW9yaXR5KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5pdGVtLFxyXG4gICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCBsb2NrZWRFbnRyaWVzLmxlbmd0aCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtYW51YWxFbnRyaWVzID0gYWxsTW9kcy5tYW51YWxcclxuICAgIC5maWx0ZXIoa2V5ID0+IGxvY2tlZEVudHJpZXMuZmluZChlbnRyeSA9PiBlbnRyeS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgLm1hcChrZXkgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtID0ge1xyXG4gICAgICAgIGlkOiBrZXksXHJcbiAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgZXh0ZXJuYWw6IHRydWUsXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uaXRlbSxcclxuICAgICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgICAgIGNvbnRleHRNZW51QWN0aW9uczogZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQsIGl0ZW0sIGxvY2tlZEVudHJpZXMubGVuZ3RoLCBvblNldFByaW9yaXR5KSxcclxuICAgICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcik7XHJcbiAgY29uc3Qga25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4ga2V5cy5pbmNsdWRlcyhlbnRyeS5pZCkpIHx8IFtdO1xyXG4gIGNvbnN0IHVua25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWtleXMuaW5jbHVkZXMoZW50cnkuaWQpKSB8fCBbXTtcclxuICBjb25zdCBmaWx0ZXJlZE9yZGVyID0ga2V5c1xyXG4gICAgLmZpbHRlcihrZXkgPT4gbG9ja2VkRW50cmllcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgICBhY2N1bVtrZXldID0gbG9hZE9yZGVyW2tleV07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICBrbm93bk1hbnVhbGx5QWRkZWQuZm9yRWFjaChrbm93biA9PiB7XHJcbiAgICBjb25zdCBkaWZmID0ga2V5cy5sZW5ndGggLSBPYmplY3Qua2V5cyhmaWx0ZXJlZE9yZGVyKS5sZW5ndGg7XHJcblxyXG4gICAgY29uc3QgcG9zID0gZmlsdGVyZWRPcmRlcltrbm93bi5pZF0ucG9zIC0gZGlmZjtcclxuICAgIGl0ZW1zID0gW10uY29uY2F0KGl0ZW1zLnNsaWNlKDAsIHBvcykgfHwgW10sIGtub3duLCBpdGVtcy5zbGljZShwb3MpIHx8IFtdKTtcclxuICB9KTtcclxuXHJcbiAgbGV0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChcclxuICAgIC4uLmxvY2tlZEVudHJpZXMsXHJcbiAgICBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IGlzTG9ja2VkID0gbG9ja2VkRW50cmllcy5maW5kKGxvY2tlZCA9PiBsb2NrZWQubmFtZSA9PT0gaXRlbS5uYW1lKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBkb05vdERpc3BsYXkgPSBET19OT1RfRElTUExBWS5pbmNsdWRlcyhpdGVtLm5hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIHJldHVybiAhaXNMb2NrZWQgJiYgIWRvTm90RGlzcGxheTtcclxuICAgIH0pLFxyXG4gICAgLi4udW5rbm93bk1hbnVhbGx5QWRkZWQpO1xyXG5cclxuICBwcmVTb3J0ZWQgPSAodXBkYXRlVHlwZSAhPT0gJ2RyYWctbi1kcm9wJylcclxuICAgID8gcHJlU29ydGVkLnNvcnQoKGxocywgcmhzKSA9PiBsaHMucHJlZml4IC0gcmhzLnByZWZpeClcclxuICAgIDogcHJlU29ydGVkLnJlZHVjZSgoYWNjdW0sIGVudHJ5LCBpZHgpID0+IHtcclxuICAgICAgICBpZiAobG9ja2VkRW50cmllcy5pbmRleE9mKGVudHJ5KSAhPT0gLTEgfHwgaWR4ID09PSAwKSB7XHJcbiAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgcHJldlByZWZpeCA9IHBhcnNlSW50KGFjY3VtW2lkeCAtIDFdLnByZWZpeCwgMTApO1xyXG4gICAgICAgICAgaWYgKHByZXZQcmVmaXggPj0gZW50cnkucHJlZml4KSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgICAgIC4uLmVudHJ5LFxyXG4gICAgICAgICAgICAgIHByZWZpeDogcHJldlByZWZpeCArIDEsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE1vZEZvbGRlcihpbnN0YWxsYXRpb25QYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIGlmICghaW5zdGFsbGF0aW9uUGF0aCB8fCAhbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XHJcbiAgICBjb25zdCBlcnJNZXNzYWdlID0gIWluc3RhbGxhdGlvblBhdGhcclxuICAgICAgPyAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCdcclxuICAgICAgOiAnRmFpbGVkIHRvIHJlc29sdmUgbW9kIGluc3RhbGxhdGlvbiBwYXRoJztcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKGVyck1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uID0gWyd3aXRjaGVyM21lbnVtb2Ryb290JywgJ3dpdGNoZXIzdGwnXS5pbmNsdWRlcyhtb2QudHlwZSlcclxuICAgID8gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCAnTW9kcycpXHJcbiAgICA6IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhleHBlY3RlZE1vZE5hbWVMb2NhdGlvbilcclxuICAgIC50aGVuKGVudHJpZXMgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXNbMF0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQ6IHR5cGVzLklDb21wb25lbnRDb250ZXh0LCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcclxuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKG1vZHMsIChhY2N1bSwgbW9kKSA9PiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGgsIG1vZClcclxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xyXG4gICAgICBpZiAobW9kLnR5cGUgPT09ICdjb2xsZWN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZENvbXBvbmVudHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnbW9kQ29tcG9uZW50cyddLCBbXSk7XHJcbiAgICAgIGlmIChtb2RDb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIG1vZENvbXBvbmVudHMucHVzaChtb2ROYW1lKTtcclxuICAgICAgfVxyXG4gICAgICBbLi4ubW9kQ29tcG9uZW50c10uZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgaWQ6IG1vZC5pZCxcclxuICAgICAgICAgIG5hbWU6IGtleSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byByZXNvbHZlIG1vZCBuYW1lJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9KSwgW10pO1xyXG59XHJcblxyXG5jb25zdCB0b2dnbGVNb2RzU3RhdGUgPSBhc3luYyAoY29udGV4dCwgcHJvcHMsIGVuYWJsZWQpID0+IHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dCk7XHJcbiAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIobW9kTmFtZSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkpO1xyXG4gIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCk7XHJcbiAgY29uc3QgbmV3TE8gPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgaWYgKHRvdGFsTG9ja2VkLmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgYWNjdW0ucHVzaChsb2FkT3JkZXJba2V5XSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICAuLi5sb2FkT3JkZXJba2V5XSxcclxuICAgICAgICBlbmFibGVkLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8pKTtcclxuICBwcm9wcy5yZWZyZXNoKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdsb2Fkb3JkZXJpbmZvJyB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSwgdCgnTWFuYWdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHsgc3R5bGU6IHsgaGVpZ2h0OiAnMzAlJyB9IH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnWW91IGNhbiBhZGp1c3QgdGhlIGxvYWQgb3JkZXIgZm9yIFRoZSBXaXRjaGVyIDMgYnkgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nICdcclxuICAgICAgKyAnbW9kcyB1cCBvciBkb3duIG9uIHRoaXMgcGFnZS4gIElmIHlvdSBhcmUgdXNpbmcgc2V2ZXJhbCBtb2RzIHRoYXQgYWRkIHNjcmlwdHMgeW91IG1heSBuZWVkIHRvIHVzZSAnXHJcbiAgICAgICsgJ3RoZSBXaXRjaGVyIDMgU2NyaXB0IG1lcmdlci4gRm9yIG1vcmUgaW5mb3JtYXRpb24gc2VlOiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19UaGVfV2l0Y2hlcl8zX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBUaGUgV2l0Y2hlciAzIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcclxuICAgICAgc3R5bGU6IHsgaGVpZ2h0OiAnODAlJyB9LFxyXG4gICAgfSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdQbGVhc2Ugbm90ZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnRm9yIFdpdGNoZXIgMywgdGhlIG1vZCB3aXRoIHRoZSBsb3dlc3QgaW5kZXggbnVtYmVyIChieSBkZWZhdWx0LCB0aGUgbW9kIHNvcnRlZCBhdCB0aGUgdG9wKSBvdmVycmlkZXMgbW9kcyB3aXRoIGEgaGlnaGVyIGluZGV4IG51bWJlci4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnWW91IGFyZSBhYmxlIHRvIG1vZGlmeSB0aGUgcHJpb3JpdHkgbWFudWFsbHkgYnkgcmlnaHQgY2xpY2tpbmcgYW55IExPIGVudHJ5IGFuZCBzZXQgdGhlIG1vZFxcJ3MgcHJpb3JpdHknLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSWYgeW91IGNhbm5vdCBzZWUgeW91ciBtb2QgaW4gdGhpcyBsb2FkIG9yZGVyLCB5b3UgbWF5IG5lZWQgdG8gYWRkIGl0IG1hbnVhbGx5IChzZWUgb3VyIHdpa2kgZm9yIGRldGFpbHMpLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdXaGVuIG1hbmFnaW5nIG1lbnUgbW9kcywgbW9kIHNldHRpbmdzIGNoYW5nZWQgaW5zaWRlIHRoZSBnYW1lIHdpbGwgYmUgZGV0ZWN0ZWQgYnkgVm9ydGV4IGFzIGV4dGVybmFsIGNoYW5nZXMgLSB0aGF0IGlzIGV4cGVjdGVkLCAnXHJcbiAgICAgICAgICArICdjaG9vc2UgdG8gdXNlIHRoZSBuZXdlciBmaWxlIGFuZCB5b3VyIHNldHRpbmdzIHdpbGwgYmUgbWFkZSBwZXJzaXN0ZW50LicsXHJcbiAgICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnWW91IGNhbiBjaGFuZ2UgdGhlIHdheSB0aGUgcHJpb3JpdGllcyBhcmUgYXNzZ2luZWQgdXNpbmcgdGhlIFwiU3dpdGNoIFRvIFBvc2l0aW9uL1ByZWZpeCBiYXNlZFwiIGJ1dHRvbi4gJ1xyXG4gICAgICAgICAgKyAnUHJlZml4IGJhc2VkIGlzIGxlc3MgcmVzdHJpY3RpdmUgYW5kIGFsbG93cyB5b3UgdG8gc2V0IGFueSBwcmlvcml0eSB2YWx1ZSB5b3Ugd2FudCBcIjUwMDAsIDY5OTk5LCBldGNcIiB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsICdcclxuICAgICAgICAgICsgJ3Jlc3RyaWN0IHRoZSBwcmlvcml0aWVzIHRvIHRoZSBudW1iZXIgb2YgbG9hZCBvcmRlciBlbnRyaWVzIHRoYXQgYXJlIGF2YWlsYWJsZS4nLFxyXG4gICAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01lcmdlcyBnZW5lcmF0ZWQgYnkgdGhlIFdpdGNoZXIgMyBTY3JpcHQgbWVyZ2VyIG11c3QgYmUgbG9hZGVkIGZpcnN0IGFuZCBhcmUgbG9ja2VkIGluIHRoZSBmaXJzdCBsb2FkIG9yZGVyIHNsb3QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkJ1dHRvbiwge1xyXG4gICAgICAgICAgb25DbGljazogKCkgPT4gdG9nZ2xlTW9kc1N0YXRlKGNvbnRleHQsIHByb3BzLCBmYWxzZSksXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBtYXJnaW5Cb3R0b206ICc1cHgnLFxyXG4gICAgICAgICAgICB3aWR0aDogJ21pbi1jb250ZW50JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgdCgnRGlzYWJsZSBBbGwnKSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYnInKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkJ1dHRvbiwge1xyXG4gICAgICAgICAgb25DbGljazogKCkgPT4gdG9nZ2xlTW9kc1N0YXRlKGNvbnRleHQsIHByb3BzLCB0cnVlKSxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzVweCcsXHJcbiAgICAgICAgICAgIHdpZHRoOiAnbWluLWNvbnRlbnQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LCB0KCdFbmFibGUgQWxsICcpKSwgW10pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZShjb250ZXh0LCByZWFzb24pIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKCEhc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnd2l0Y2hlcjMtbWVyZ2UnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIG1lc3NhZ2U6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSgnV2l0Y2hlciBTY3JpcHQgbWVyZ2VyIG1heSBuZWVkIHRvIGJlIGV4ZWN1dGVkJyxcclxuICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMnLCB7XHJcbiAgICAgICAgICAgICAgdGV4dDogcmVhc29uLFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ1J1biB0b29sJyxcclxuICAgICAgICAgIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICAgIHJ1blNjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbk1lcmdlKGdhbWUsIGdhbWVEaXNjb3ZlcnkpIHtcclxuICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiAoe1xyXG4gICAgYmFzZUZpbGVzOiAoKSA9PiBbXHJcbiAgICAgIHtcclxuICAgICAgICBpbjogcGF0aC5qb2luKGdhbWVEaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICAgICAgICBvdXQ6IHBhdGguam9pbihDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIGZpbHRlcjogZmlsZVBhdGggPT4gZmlsZVBhdGguZW5kc1dpdGgoSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZElucHV0RmlsZShjb250ZXh0LCBtZXJnZURpcikge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGNvbnN0IGdhbWVJbnB1dEZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpO1xyXG4gIHJldHVybiAoISFkaXNjb3Zlcnk/LnBhdGgpXHJcbiAgICA/IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKG1lcmdlRGlyLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpKVxyXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgPyBmcy5yZWFkRmlsZUFzeW5jKGdhbWVJbnB1dEZpbGVwYXRoKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgIDogUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xyXG59XHJcblxyXG5jb25zdCBlbXB0eVhtbCA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz48bWV0YWRhdGE+PC9tZXRhZGF0YT4nO1xyXG5mdW5jdGlvbiBtZXJnZShmaWxlUGF0aCwgbWVyZ2VEaXIsIGNvbnRleHQpIHtcclxuICBsZXQgbW9kRGF0YTtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKHhtbERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG1vZERhdGEgPSBwYXJzZVhtbFN0cmluZyh4bWxEYXRhLCB7IGlnbm9yZV9lbmM6IHRydWUsIG5vYmxhbmtzOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gVGhlIG1vZCBpdHNlbGYgaGFzIGludmFsaWQgeG1sIGRhdGEuXHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIG1vZCBYTUwgZGF0YSAtIGluZm9ybSBtb2QgYXV0aG9yJyxcclxuICAgICAgICB7IHBhdGg6IGZpbGVQYXRoLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgbW9kRGF0YSA9IGVtcHR5WG1sO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC50aGVuKCgpID0+IHJlYWRJbnB1dEZpbGUoY29udGV4dCwgbWVyZ2VEaXIpKVxyXG4gICAgLnRoZW4obWVyZ2VkRGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VkID0gcGFyc2VYbWxTdHJpbmcobWVyZ2VkRGF0YSwgeyBpZ25vcmVfZW5jOiB0cnVlLCBub2JsYW5rczogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlZCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIG1lcmdlZCBmaWxlIC0gaWYgaXQncyBpbnZhbGlkIGNoYW5jZXMgYXJlIHdlIG1lc3NlZCB1cFxyXG4gICAgICAgIC8vICBzb21laG93LCByZWFzb24gd2h5IHdlJ3JlIGdvaW5nIHRvIGFsbG93IHRoaXMgZXJyb3IgdG8gZ2V0IHJlcG9ydGVkLlxyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIG1lcmdlZCBYTUwgZGF0YScsIGVyciwge1xyXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXHJcbiAgICAgICAgICBhdHRhY2htZW50czogW1xyXG4gICAgICAgICAgICB7IGlkOiAnX19tZXJnZWQvaW5wdXQueG1sJywgdHlwZTogJ2RhdGEnLCBkYXRhOiBtZXJnZWREYXRhLFxyXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2l0Y2hlciAzIG1lbnUgbW9kIG1lcmdlZCBkYXRhJyB9LFxyXG4gICAgICAgICAgICB7IGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9sb2FkT3JkZXJgLCB0eXBlOiAnZGF0YScsIGRhdGE6IGxvYWRPcmRlcixcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcicgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdJbnZhbGlkIG1lcmdlZCBYTUwgZGF0YScpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC50aGVuKGdhbWVJbmRleEZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBtb2RWYXJzID0gbW9kRGF0YS5maW5kKCcvL1ZhcicpO1xyXG4gICAgICBjb25zdCBnYW1lVmFycyA9IGdhbWVJbmRleEZpbGUuZmluZDxFbGVtZW50PignLy9WYXInKTtcclxuXHJcbiAgICAgIG1vZFZhcnMuZm9yRWFjaChtb2RWYXIgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoZXIgPSAoZ2FtZVZhcikgPT4ge1xyXG4gICAgICAgICAgbGV0IGdhbWVWYXJQYXJlbnQ7XHJcbiAgICAgICAgICBsZXQgbW9kVmFyUGFyZW50O1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZ2FtZVZhclBhcmVudCA9IGdhbWVWYXIucGFyZW50KCkucGFyZW50KCk7XHJcbiAgICAgICAgICAgIG1vZFZhclBhcmVudCA9IG1vZFZhci5wYXJlbnQoKS5wYXJlbnQoKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAvLyBUaGlzIGdhbWUgdmFyaWFibGUgbXVzdCd2ZSBiZWVuIHJlcGxhY2VkIGluIGEgcHJldmlvdXNcclxuICAgICAgICAgICAgLy8gIGl0ZXJhdGlvbi5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICgodHlwZW9mKGdhbWVWYXJQYXJlbnQ/LmF0dHIpICE9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgIHx8ICh0eXBlb2YobW9kVmFyUGFyZW50Py5hdHRyKSAhPT0gJ2Z1bmN0aW9uJykpIHtcclxuICAgICAgICAgICAgIC8vIFRoaXMgaXMgYWN0dWFsbHkgcXVpdGUgcHJvYmxlbWF0aWMgLSBpdCBwcmV0dHkgbXVjaCBtZWFuc1xyXG4gICAgICAgICAgICAgLy8gIHRoYXQgZWl0aGVyIHRoZSBtb2Qgb3IgdGhlIGdhbWUgaXRzZWxmIGhhcyBnYW1lIHZhcmlhYmxlc1xyXG4gICAgICAgICAgICAgLy8gIGxvY2F0ZWQgb3V0c2lkZSBhIGdyb3VwLiBFaXRoZXIgdGhlIGdhbWUgaW5wdXQgZmlsZSBpcyBjb3JydXB0ZWRcclxuICAgICAgICAgICAgIC8vICAobWFudWFsIHRhbXBlcmluZz8pIG9yIHRoZSBtb2QgaXRzZWxmIGlzLiBUaGFua2Z1bGx5IHdlIHdpbGwgYmVcclxuICAgICAgICAgICAgIC8vICBjcmVhdGluZyB0aGUgbWlzc2luZyBncm91cCwgYnV0IGl0IGxlYWRzIHRvIHRoZSBxdWVzdGlvbiwgd2hhdFxyXG4gICAgICAgICAgICAgLy8gIG90aGVyIHN1cnByaXNlcyBhcmUgd2UgZ29pbmcgdG8gZW5jb3VudGVyIGZ1cnRoZXIgZG93biB0aGUgbGluZSA/XHJcbiAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBmaW5kIHBhcmVudCBncm91cCBvZiBtb2QgdmFyaWFibGUnLCBtb2RWYXIpO1xyXG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gKChnYW1lVmFyUGFyZW50LmF0dHIoJ2lkJykudmFsdWUoKSA9PT0gbW9kVmFyUGFyZW50LmF0dHIoJ2lkJykudmFsdWUoKSlcclxuICAgICAgICAgICAgJiYgKGdhbWVWYXIuYXR0cignaWQnKS52YWx1ZSgpID09PSBtb2RWYXIuYXR0cignaWQnKS52YWx1ZSgpKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdWYXIgPSBnYW1lVmFycy5maW5kKG1hdGNoZXIpO1xyXG4gICAgICAgIGlmIChleGlzdGluZ1Zhcikge1xyXG4gICAgICAgICAgZXhpc3RpbmdWYXIucmVwbGFjZShtb2RWYXIuY2xvbmUoKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IHBhcmVudEdyb3VwID0gbW9kVmFyLnBhcmVudCgpLnBhcmVudCgpO1xyXG4gICAgICAgICAgY29uc3QgZ3JvdXBJZCA9IHBhcmVudEdyb3VwLmF0dHIoJ2lkJykudmFsdWUoKTtcclxuICAgICAgICAgIGNvbnN0IG1hdGNoaW5nSW5kZXhHcm91cCA9IGdhbWVJbmRleEZpbGUuZmluZDxFbGVtZW50PignLy9Hcm91cCcpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoZ3JvdXAgPT4gZ3JvdXAuYXR0cignaWQnKS52YWx1ZSgpID09PSBncm91cElkKTtcclxuICAgICAgICAgIGlmIChtYXRjaGluZ0luZGV4R3JvdXAubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAvLyBTb21ldGhpbmcncyB3cm9uZyB3aXRoIHRoZSBmaWxlIC0gYmFjayBvZmYuXHJcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdEdXBsaWNhdGUgZ3JvdXAgZW50cmllcyBmb3VuZCBpbiBnYW1lIGlucHV0LnhtbCdcclxuICAgICAgICAgICAgICArIGBcXG5cXG4ke3BhdGguam9pbihtZXJnZURpciwgSU5QVVRfWE1MX0ZJTEVOQU1FKX1cXG5cXG5gXHJcbiAgICAgICAgICAgICAgKyAnZmlsZSAtIHBsZWFzZSBmaXggdGhpcyBtYW51YWxseSBiZWZvcmUgYXR0ZW1wdGluZyB0byByZS1pbnN0YWxsIHRoZSBtb2QnKTtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEdXBsaWNhdGUgZ3JvdXAgZW50cmllcyBkZXRlY3RlZCcsIGVycixcclxuICAgICAgICAgICAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoaW5nSW5kZXhHcm91cC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gTmVlZCB0byBhZGQgdGhlIGdyb3VwIEFORCB0aGUgdmFyLlxyXG4gICAgICAgICAgICBjb25zdCB1c2VyQ29uZmlnID0gZ2FtZUluZGV4RmlsZS5nZXQ8RWxlbWVudD4oJy8vVXNlckNvbmZpZycpO1xyXG4gICAgICAgICAgICB1c2VyQ29uZmlnLmFkZENoaWxkKHBhcmVudEdyb3VwLmNsb25lKCkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgKG1hdGNoaW5nSW5kZXhHcm91cFswXS5jaGlsZCgwKSBhcyBFbGVtZW50KS5hZGRDaGlsZChtb2RWYXIuY2xvbmUoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4obWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgICAgICAgZ2FtZUluZGV4RmlsZSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnZXJyb3InLCAnaW5wdXQueG1sIG1lcmdlIGZhaWxlZCcsIGVycik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jb25zdCBTQ1JJUFRfTUVSR0VSX0ZJTEVTID0gWydXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZSddO1xyXG5mdW5jdGlvbiBzY3JpcHRNZXJnZXJUZXN0KGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBtYXRjaGVyID0gKGZpbGUgPT4gU0NSSVBUX01FUkdFUl9GSUxFUy5pbmNsdWRlcyhmaWxlKSk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpICYmIChmaWxlcy5maWx0ZXIobWF0Y2hlcikubGVuZ3RoID4gMCkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBTQ1JJUFRfTUVSR0VSX0ZJTEVTIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsIGVyck1lc3NhZ2UpIHtcclxuICBsZXQgYWxsb3dSZXBvcnQgPSB0cnVlO1xyXG4gIGNvbnN0IHVzZXJDYW5jZWxlZCA9IGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkO1xyXG4gIGlmICh1c2VyQ2FuY2VsZWQpIHtcclxuICAgIGFsbG93UmVwb3J0ID0gZmFsc2U7XHJcbiAgfVxyXG4gIGNvbnN0IGJ1c3lSZXNvdXJjZSA9IGVyciBpbnN0YW5jZW9mIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3I7XHJcbiAgaWYgKGFsbG93UmVwb3J0ICYmIGJ1c3lSZXNvdXJjZSkge1xyXG4gICAgYWxsb3dSZXBvcnQgPSBlcnIuYWxsb3dSZXBvcnQ7XHJcbiAgICBlcnIubWVzc2FnZSA9IGVyci5lcnJvck1lc3NhZ2U7XHJcbiAgfVxyXG5cclxuICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gIHJldHVybjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIoY29udGV4dCwgZmlsZXMpIHtcclxuICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgTW9kJywgJ0l0IGxvb2tzIGxpa2UgeW91IHRyaWVkIHRvIGluc3RhbGwgJ1xyXG4gICAgKyAnVGhlIFdpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyLCB3aGljaCBpcyBhIHRvb2wgYW5kIG5vdCBhIG1vZCBmb3IgVGhlIFdpdGNoZXIgMy5cXG5cXG4nXHJcbiAgICArICdUaGUgc2NyaXB0IG1lcmdlciBzaG91bGRcXCd2ZSBiZWVuIGluc3RhbGxlZCBhdXRvbWF0aWNhbGx5IGJ5IFZvcnRleCBhcyBzb29uIGFzIHlvdSBhY3RpdmF0ZWQgdGhpcyBleHRlbnNpb24uICdcclxuICAgICsgJ0lmIHRoZSBkb3dubG9hZCBvciBpbnN0YWxsYXRpb24gaGFzIGZhaWxlZCBmb3IgYW55IHJlYXNvbiAtIHBsZWFzZSBsZXQgdXMga25vdyB3aHksIGJ5IHJlcG9ydGluZyB0aGUgZXJyb3IgdGhyb3VnaCAnXHJcbiAgICArICdvdXIgZmVlZGJhY2sgc3lzdGVtIGFuZCBtYWtlIHN1cmUgdG8gaW5jbHVkZSB2b3J0ZXggbG9ncy4gUGxlYXNlIG5vdGU6IGlmIHlvdVxcJ3ZlIGluc3RhbGxlZCAnXHJcbiAgICArICd0aGUgc2NyaXB0IG1lcmdlciBpbiBwcmV2aW91cyB2ZXJzaW9ucyBvZiBWb3J0ZXggYXMgYSBtb2QgYW5kIFNUSUxMIGhhdmUgaXQgaW5zdGFsbGVkICdcclxuICAgICsgJyhpdFxcJ3MgcHJlc2VudCBpbiB5b3VyIG1vZCBsaXN0KSAtIHlvdSBzaG91bGQgY29uc2lkZXIgdW4taW5zdGFsbGluZyBpdCBmb2xsb3dlZCBieSBhIFZvcnRleCByZXN0YXJ0OyAnXHJcbiAgICArICd0aGUgYXV0b21hdGljIG1lcmdlciBpbnN0YWxsZXIvdXBkYXRlciBzaG91bGQgdGhlbiBraWNrIG9mZiBhbmQgc2V0IHVwIHRoZSB0b29sIGZvciB5b3UuJyxcclxuICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0ludmFsaWQgbW9kJykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xyXG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJ10sIFczUmVkdWNlcik7XHJcbiAgbGV0IHByaW9yaXR5TWFuYWdlcjtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdNb2RzJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxyXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMjkyMDMwJyxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6IDI5MjAzMCxcclxuICAgICAgaWdub3JlQ29uZmxpY3RzOiBET19OT1RfREVQTE9ZLFxyXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBnZXRETENQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJyk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZ2V0VExQYXRoID0gKGdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XHJcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaXNUVzMgPSAoZ2FtZUlkID0gdW5kZWZpbmVkKSA9PiB7XHJcbiAgICBpZiAoZ2FtZUlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIChnYW1lSWQgPT09IEdBTUVfSUQpO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xyXG4gIH07XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZHMtYWN0aW9uLWljb25zJywgMzAwLCAnc3RhcnQtaW5zdGFsbCcsIHt9LCAnSW1wb3J0IFNjcmlwdCBNZXJnZXMnLFxyXG4gICAgaW5zdGFuY2VJZHMgPT4geyBtYWtlT25Db250ZXh0SW1wb3J0KGNvbnRleHQsIGluc3RhbmNlSWRzWzBdKTsgfSxcclxuICAgIGluc3RhbmNlSWRzID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICAgIGlmIChtb2RzW2luc3RhbmNlSWRzPy5bMF1dPy50eXBlICE9PSAnY29sbGVjdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICAgIHJldHVybiBhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQ7XHJcbiAgICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjN0bCcsIDI1LCB0b0JsdWUodGVzdFN1cHBvcnRlZFRMKSwgdG9CbHVlKGluc3RhbGxUTCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzbWl4ZWQnLCAzMCwgdG9CbHVlKHRlc3RTdXBwb3J0ZWRNaXhlZCksIHRvQmx1ZShpbnN0YWxsTWl4ZWQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM2NvbnRlbnQnLCA1MCxcclxuICAgIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkQ29udGVudCksIHRvQmx1ZShpbnN0YWxsQ29udGVudCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCxcclxuICAgIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSwgdG9CbHVlKGluc3RhbGxNZW51TW9kKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2NyaXB0bWVyZ2VyZHVtbXknLCAxNSxcclxuICAgIHRvQmx1ZShzY3JpcHRNZXJnZXJUZXN0KSwgdG9CbHVlKChmaWxlcykgPT4gc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIoY29udGV4dCwgZmlsZXMpKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM3RsJywgMjUsIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0VEwpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNkbGMnLCAyNSwgaXNUVzMsIGdldERMQ1BhdGgsIHRvQmx1ZSh0ZXN0RExDKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCxcclxuICAgIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsIDYwLCBpc1RXMyxcclxuICAgIChnYW1lKSA9PiBwYXRoLmpvaW4oVU5JQVBQLmdldFBhdGgoJ2RvY3VtZW50cycpLCAnVGhlIFdpdGNoZXIgMycpLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWVyZ2UoY2FuTWVyZ2UsXHJcbiAgICAoZmlsZVBhdGgsIG1lcmdlRGlyKSA9PiBtZXJnZShmaWxlUGF0aCwgbWVyZ2VEaXIsIGNvbnRleHQpLCAnd2l0Y2hlcjNtZW51bW9kcm9vdCcpO1xyXG5cclxuICByZWdpc3RlckFjdGlvbnMoeyBjb250ZXh0LCByZWZyZXNoRnVuYywgZ2V0UHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBwcmlvcml0eU1hbmFnZXIgfSk7XHJcblxyXG4gIGNvbnRleHRbJ3JlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUnXShcclxuICAgICd3aXRjaGVyM19jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLCBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdXaXRjaGVyIDMgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJQcm9maWxlRmVhdHVyZShcclxuICAgICdsb2NhbF9tZXJnZXMnLCAnYm9vbGVhbicsICdzZXR0aW5ncycsICdQcm9maWxlIERhdGEnLFxyXG4gICAgJ1RoaXMgcHJvZmlsZSB3aWxsIHN0b3JlIGFuZCByZXN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgZGF0YSAobWVyZ2VkIHNjcmlwdHMsIGxvYWRvcmRlciwgZXRjKSB3aGVuIHN3aXRjaGluZyBwcm9maWxlcycsXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgIHJldHVybiBhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQ7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCAnY29sbGVjdGlvbiddO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXJQYWdlKHtcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIGNyZWF0ZUluZm9QYW5lbDogKHByb3BzKSA9PiB7XHJcbiAgICAgIHJlZnJlc2hGdW5jID0gcHJvcHMucmVmcmVzaDtcclxuICAgICAgcmV0dXJuIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpIGFzIGFueTtcclxuICAgIH0sXHJcbiAgICBnYW1lQXJ0VVJMOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGZpbHRlcjogKG1vZHMpID0+IG1vZHMuZmlsdGVyKG1vZCA9PiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZC50eXBlKSksXHJcbiAgICBwcmVTb3J0OiAoaXRlbXM6IGFueVtdLCBkaXJlY3Rpb246IGFueSwgdXBkYXRlVHlwZTogYW55KSA9PiB7XHJcbiAgICAgIHJldHVybiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIHByaW9yaXR5TWFuYWdlcikgYXMgYW55O1xyXG4gICAgfSxcclxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlciwgdXBkYXRlVHlwZSkgPT4ge1xyXG4gICAgICBpZiAobG9hZE9yZGVyID09PSBfUFJFVklPVVNfTE8pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChfUFJFVklPVVNfTE8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSk7XHJcbiAgICAgIH1cclxuICAgICAgX1BSRVZJT1VTX0xPID0gbG9hZE9yZGVyO1xyXG4gICAgICBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gd3JpdGVUb01vZFNldHRpbmdzKCkpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgICAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCByZXZlcnRMT0ZpbGUgPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpKSB7XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCkudGhlbigobWFudWFsbHlBZGRlZCkgPT4ge1xyXG4gICAgICAgIGlmIChtYW51YWxseUFkZGVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGNvbnN0IG5ld1N0cnVjdCA9IHt9O1xyXG4gICAgICAgICAgbWFudWFsbHlBZGRlZC5mb3JFYWNoKChtb2QsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgICBuZXdTdHJ1Y3RbbW9kXSA9IHtcclxuICAgICAgICAgICAgICBFbmFibGVkOiAxLFxyXG4gICAgICAgICAgICAgIFByaW9yaXR5OiAoKGxvYWRPcmRlciAhPT0gdW5kZWZpbmVkICYmICEhbG9hZE9yZGVyW21vZF0pXHJcbiAgICAgICAgICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlclttb2RdLnByZWZpeCwgMTApIDogaWR4KSArIDEsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBfSU5JX1NUUlVDVCA9IG5ld1N0cnVjdDtcclxuICAgICAgICAgIHdyaXRlVG9Nb2RTZXR0aW5ncygpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICByZWZyZXNoRnVuYz8uKCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAgICAgICAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgICAgICAgICBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgICAgICA6IGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJywgZXJyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCB2YWxpZGF0ZVByb2ZpbGUgPSAocHJvZmlsZUlkLCBzdGF0ZSkgPT4ge1xyXG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICBpZiAoISFhY3RpdmVQcm9maWxlICYmICEhZGVwbG95UHJvZmlsZSAmJiAoZGVwbG95UHJvZmlsZS5pZCAhPT0gYWN0aXZlUHJvZmlsZS5pZCkpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFjdGl2ZVByb2ZpbGU7XHJcbiAgfTtcclxuXHJcbiAgbGV0IHByZXZEZXBsb3ltZW50ID0gW107XHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIHByaW9yaXR5TWFuYWdlciA9IG5ldyBQcmlvcml0eU1hbmFnZXIoY29udGV4dC5hcGksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgYXN5bmMgKGdhbWVNb2RlKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIEp1c3QgaW4gY2FzZSB0aGUgc2NyaXB0IG1lcmdlciBub3RpZmljYXRpb24gaXMgc3RpbGxcclxuICAgICAgICAvLyAgcHJlc2VudC5cclxuICAgICAgICBjb250ZXh0LmFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCd3aXRjaGVyMy1tZXJnZScpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZU1vZGUpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcclxuICAgICAgICBpZiAobGFzdFByb2ZJZCAhPT0gYWN0aXZlUHJvZj8uaWQpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQsIGFjdGl2ZVByb2Y/LmlkKSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzdG9yZSBwcm9maWxlIG1lcmdlZCBmaWxlcycsIGVycik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ3dpbGwtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBtZW51TW9kLm9uV2lsbERlcGxveShjb250ZXh0LmFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHZhbGlkYXRlUHJvZmlsZShwcm9maWxlSWQsIHN0YXRlKTtcclxuICAgICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KHByZXZEZXBsb3ltZW50KSAhPT0gSlNPTi5zdHJpbmdpZnkoZGVwbG95bWVudCkpIHtcclxuICAgICAgICBwcmV2RGVwbG95bWVudCA9IGRlcGxveW1lbnQ7XHJcbiAgICAgICAgcXVlcnlTY3JpcHRNZXJnZShjb250ZXh0LCAnWW91ciBtb2RzIHN0YXRlL2xvYWQgb3JkZXIgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgdGltZSB5b3UgcmFuICdcclxuICAgICAgICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyLiBZb3UgbWF5IHdhbnQgdG8gcnVuIHRoZSBtZXJnZXIgdG9vbCBhbmQgY2hlY2sgd2hldGhlciBhbnkgbmV3IHNjcmlwdCBjb25mbGljdHMgYXJlICdcclxuICAgICAgICAgICsgJ3ByZXNlbnQsIG9yIGlmIGV4aXN0aW5nIG1lcmdlcyBoYXZlIGJlY29tZSB1bmVjZXNzYXJ5LiBQbGVhc2UgYWxzbyBub3RlIHRoYXQgYW55IGxvYWQgb3JkZXIgY2hhbmdlcyAnXHJcbiAgICAgICAgICArICdtYXkgYWZmZWN0IHRoZSBvcmRlciBpbiB3aGljaCB5b3VyIGNvbmZsaWN0aW5nIG1vZHMgYXJlIG1lYW50IHRvIGJlIG1lcmdlZCwgYW5kIG1heSByZXF1aXJlIHlvdSB0byAnXHJcbiAgICAgICAgICArICdyZW1vdmUgdGhlIGV4aXN0aW5nIG1lcmdlIGFuZCByZS1hcHBseSBpdC4nKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICBjb25zdCBkb2NGaWxlcyA9IGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXVxyXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIChmaWxlLnJlbFBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpO1xyXG4gICAgICBjb25zdCBtZW51TW9kUHJvbWlzZSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoZG9jRmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gbWVudSBtb2RzIGRlcGxveWVkIC0gcmVtb3ZlIHRoZSBtb2QuXHJcbiAgICAgICAgICByZXR1cm4gbWVudU1vZC5yZW1vdmVNb2QoY29udGV4dC5hcGksIGFjdGl2ZVByb2ZpbGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gbWVudU1vZC5vbkRpZERlcGxveShjb250ZXh0LmFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgICAgICAgLnRoZW4oYXN5bmMgbW9kSWQgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChtb2RJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQoYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHRydWUpKTtcclxuICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgbW9kSWQpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIG1lbnVNb2RQcm9taXNlKClcclxuICAgICAgICAudGhlbigoKSA9PiBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHdyaXRlVG9Nb2RTZXR0aW5ncygpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJlZnJlc2hGdW5jPy4oKTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3Byb2ZpbGUtd2lsbC1jaGFuZ2UnLCBhc3luYyAobmV3UHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbmV3UHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcblxyXG4gICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgcHJvZmlsZS5nYW1lSWQpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiByZXN0b3JlRnJvbVByb2ZpbGUoY29udGV4dCwgcHJvZmlsZS5pZCkpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzdG9yZSBwcm9maWxlIHNwZWNpZmljIG1lcmdlZCBpdGVtcycsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCAocHJldiwgY3VycmVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgcHJpb3JpdHlNYW5hZ2VyLnByaW9yaXR5VHlwZSA9IHByaW9yaXR5VHlwZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcclxuICAgICAgcmV2ZXJ0TE9GaWxlKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW4sXHJcbn07XHJcbiJdfQ==