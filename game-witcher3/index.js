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
        (0, vortex_api_1.log)('error', 'failed to download/install script merger', error);
        const scriptMergerPath = (0, scriptmerger_1.getScriptMergerDir)(context);
        if (scriptMergerPath === undefined) {
            notifyMissingScriptMerger(context.api);
            return Promise.resolve();
        }
        else {
            if (((_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger) === undefined) {
                return (0, scriptmerger_1.setMergerConfig)(discovery.path, scriptMergerPath);
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
            const filterFunc = (modName) => {
                if (!modName) {
                    (0, vortex_api_1.log)('debug', 'encountered invalid mod instance/name');
                    return false;
                }
                return modName.startsWith(common_1.LOCKED_PREFIX);
            };
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
        .then(xmlData => {
        try {
            modData = (0, libxmljs_1.parseXmlString)(xmlData, { ignore_enc: true, noblanks: true });
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
            const merged = (0, libxmljs_1.parseXmlString)(mergedData, { ignore_enc: true, noblanks: true });
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
                    (0, vortex_api_1.log)('error', 'failed to find parent group of mod variable', modVar);
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
    (0, iconbarActions_1.registerActions)({
        context,
        refreshFunc,
        getPriorityManager: () => priorityManager,
        getModLimitPatcher: () => modLimitPatcher,
    });
    context['registerCollectionFeature']('witcher3_collection_data', (gameId, includedMods, collection) => (0, collections_1.genCollectionsData)(context, gameId, includedMods, collection), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Witcher 3 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLHVDQUFtRDtBQUNuRCxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLG9EQUFzQztBQUN0QywyQ0FBa0Y7QUFDbEYsNERBQThDO0FBQzlDLHNFQUFxQztBQUVyQywyREFBcUY7QUFFckYsc0ZBQThEO0FBRTlELHdEQUFnQztBQUNoQyxpREFBMkY7QUFFM0YscUNBSWtCO0FBRWxCLG1DQUE2QztBQUU3QyxtREFBa0Q7QUFFbEQscURBQW1EO0FBQ25ELHVEQUFvRDtBQUVwRCw2Q0FBZ0U7QUFDaEUsK0NBQW1FO0FBRW5FLG1FQUE0RDtBQUU1RCx1Q0FBNEM7QUFDNUMseUNBQXVDO0FBRXZDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBRTFCLE1BQU0sc0JBQXNCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUVoRyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDckIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBRXRCLE1BQU0sS0FBSyxHQUFHO0lBQ1o7UUFDRSxFQUFFLEVBQUUseUJBQWdCO1FBQ3BCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHlCQUF5QjtRQUMvQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMseUJBQXlCO1FBQzNDLGFBQWEsRUFBRTtZQUNiLHlCQUF5QjtTQUMxQjtLQUNGO0NBQ0YsQ0FBQztBQUVGLFNBQVMsa0JBQWtCO0lBQ3pCLE1BQU0sUUFBUSxHQUFHLElBQUEsNkJBQW9CLEdB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LGdCQUFPLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRTtnQkFDdEUsT0FBTzthQUNSO1lBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsOEJBQXFCLEdBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRixlQUFlLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLFlBQVksRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHsgRWxlbWVudCwgcGFyc2VYbWxTdHJpbmcgfSBmcm9tICdsaWJ4bWxqcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIEluaVBhcnNlciBmcm9tICd2b3J0ZXgtcGFyc2UtaW5pJztcclxuaW1wb3J0IHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xyXG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCBtZW51TW9kIGZyb20gJy4vbWVudW1vZCc7XHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyLCBnZXRTY3JpcHRNZXJnZXJEaXIsIHNldE1lcmdlckNvbmZpZyB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IERPX05PVF9ERVBMT1ksIERPX05PVF9ESVNQTEFZLFxyXG4gIEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBnZXRQcmlvcml0eVR5cGVCcmFuY2gsIEkxOE5fTkFNRVNQQUNFLFxyXG4gIElOUFVUX1hNTF9GSUxFTkFNRSwgTE9DS0VEX1BSRUZJWCwgUEFSVF9TVUZGSVgsIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IsXHJcbiAgU0NSSVBUX01FUkdFUl9JRCwgVU5JX1BBVENILFxyXG59IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IHRlc3RNb2RMaW1pdEJyZWFjaCB9IGZyb20gJy4vdGVzdHMnO1xyXG5cclxuaW1wb3J0IHsgTW9kTGltaXRQYXRjaGVyIH0gZnJvbSAnLi9tb2RMaW1pdFBhdGNoJztcclxuXHJcbmltcG9ydCB7IHJlZ2lzdGVyQWN0aW9ucyB9IGZyb20gJy4vaWNvbmJhckFjdGlvbnMnO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcblxyXG5pbXBvcnQgeyBpbnN0YWxsTWl4ZWQsIHRlc3RTdXBwb3J0ZWRNaXhlZCB9IGZyb20gJy4vaW5zdGFsbGVycyc7XHJcbmltcG9ydCB7IHJlc3RvcmVGcm9tUHJvZmlsZSwgc3RvcmVUb1Byb2ZpbGUgfSBmcm9tICcuL21lcmdlQmFja3VwJztcclxuXHJcbmltcG9ydCB7IGdldE1lcmdlZE1vZE5hbWVzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xyXG5cclxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHsgVzNSZWR1Y2VyIH0gZnJvbSAnLi9yZWR1Y2Vycyc7XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTIwNzY2NDY2Myc7XHJcbmNvbnN0IEdPR19JRF9HT1RZID0gJzE0OTUxMzQzMjAnO1xyXG5jb25zdCBTVEVBTV9JRCA9ICc0OTk0NTAnO1xyXG5cclxuY29uc3QgQ09ORklHX01BVFJJWF9SRUxfUEFUSCA9IHBhdGguam9pbignYmluJywgJ2NvbmZpZycsICdyNGdhbWUnLCAndXNlcl9jb25maWdfbWF0cml4JywgJ3BjJyk7XHJcblxyXG5sZXQgX0lOSV9TVFJVQ1QgPSB7fTtcclxubGV0IF9QUkVWSU9VU19MTyA9IHt9O1xyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAge1xyXG4gICAgaWQ6IFNDUklQVF9NRVJHRVJfSUQsXHJcbiAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXHJcbiAgICBsb2dvOiAnV2l0Y2hlclNjcmlwdE1lcmdlci5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlVG9Nb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKVxyXG4gICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgLnRoZW4oaW5pID0+IHtcclxuICAgICAgcmV0dXJuIEJsdWViaXJkLmVhY2goT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLCAoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYgKF9JTklfU1RSVUNUPy5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgdXNlciB0byBydW4gbXVsdGlwbGUgb3BlcmF0aW9ucyBhdCBvbmNlLFxyXG4gICAgICAgICAgLy8gIGNhdXNpbmcgdGhlIHN0YXRpYyBpbmkgc3RydWN0dXJlIHRvIGJlIG1vZGlmaWVkXHJcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXHJcbiAgICAgICAgICAvLyAgbW9kaWZ5aW5nIHRoZSBsb2FkIG9yZGVyIHdoaWxlIGRlcGxveWluZy4gVGhpcyBzaG91bGRcclxuICAgICAgICAgIC8vICBtYWtlIHN1cmUgd2UgZG9uJ3QgYXR0ZW1wdCB0byB3cml0ZSBhbnkgaW52YWxpZCBtb2QgZW50cmllcy5cclxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcclxuICAgICAgICAgIEVuYWJsZWQ6IF9JTklfU1RSVUNUW2tleV0uRW5hYmxlZCxcclxuICAgICAgICAgIFByaW9yaXR5OiBfSU5JX1NUUlVDVFtrZXldLlByaW9yaXR5LFxyXG4gICAgICAgICAgVks6IF9JTklfU1RSVUNUW2tleV0uVkssXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHBhcnNlci53cml0ZShmaWxlUGF0aCwgaW5pKSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxyXG4gICAgICA/IFByb21pc2UucmVqZWN0KG5ldyBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yKGVyci5wYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTW9kU2V0dGluZ3MoKSB7XHJcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAvLyAgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChlaXRoZXIgYnkgdXMgb3IgdGhlIGdhbWUpIGJ1dFxyXG4gIC8vICBqdXN0IGluIGNhc2UgaXQgZ290IHJlbW92ZWQgc29tZWhvdywgd2UgcmUtaW5zdGF0ZSBpdFxyXG4gIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxufVxyXG5cclxuLy8gQXR0ZW1wdHMgdG8gcGFyc2UgYW5kIHJldHVybiBkYXRhIGZvdW5kIGluc2lkZVxyXG4vLyAgdGhlIG1vZHMuc2V0dGluZ3MgZmlsZSBpZiBmb3VuZCAtIG90aGVyd2lzZSB0aGlzXHJcbi8vICB3aWxsIGVuc3VyZSB0aGUgZmlsZSBpcyBwcmVzZW50LlxyXG5mdW5jdGlvbiBlbnN1cmVNb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXHJcbiAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gY3JlYXRlTW9kU2V0dGluZ3MoKS50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCkge1xyXG4gIHJldHVybiBlbnN1cmVNb2RTZXR0aW5ncygpLnRoZW4oaW5pID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICAgIGNvbnN0IGluaUVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSk7XHJcbiAgICBjb25zdCBtYW51YWxDYW5kaWRhdGVzID0gW10uY29uY2F0KGluaUVudHJpZXMsIFtVTklfUEFUQ0hdKS5maWx0ZXIoZW50cnkgPT4ge1xyXG4gICAgICBjb25zdCBoYXNWb3J0ZXhLZXkgPSB1dGlsLmdldFNhZmUoaW5pLmRhdGFbZW50cnldLCBbJ1ZLJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgcmV0dXJuICgoIWhhc1ZvcnRleEtleSkgfHwgKGluaS5kYXRhW2VudHJ5XS5WSyA9PT0gZW50cnkpICYmICFtb2RLZXlzLmluY2x1ZGVzKGVudHJ5KSk7XHJcbiAgICB9KSB8fCBbVU5JX1BBVENIXTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFNldChtYW51YWxDYW5kaWRhdGVzKSk7XHJcbiAgfSlcclxuICAudGhlbih1bmlxdWVDYW5kaWRhdGVzID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gSG93L3doeSBhcmUgd2UgZXZlbiBoZXJlID9cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCEnKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoQXJyYXkuZnJvbSh1bmlxdWVDYW5kaWRhdGVzKSwgKGFjY3VtLCBtb2QpID0+IHtcclxuICAgICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpO1xyXG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RGb2xkZXIpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAvLyBPaywgd2Uga25vdyB0aGUgZm9sZGVyIGlzIHRoZXJlIC0gbGV0cyBlbnN1cmUgdGhhdFxyXG4gICAgICAgICAgLy8gIGl0IGFjdHVhbGx5IGNvbnRhaW5zIGZpbGVzLlxyXG4gICAgICAgICAgbGV0IGNhbmRpZGF0ZXMgPSBbXTtcclxuICAgICAgICAgIGF3YWl0IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQocGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpLCBlbnRyaWVzID0+IHtcclxuICAgICAgICAgICAgY2FuZGlkYXRlcyA9IFtdLmNvbmNhdChjYW5kaWRhdGVzLCBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAoIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAocGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKSAhPT0gJycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChlbnRyeT8ubGlua0NvdW50ID09PSB1bmRlZmluZWQgfHwgZW50cnkubGlua0NvdW50IDw9IDEpKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAoWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xKVxyXG4gICAgICAgICAgICA/IG51bGwgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICAgICAgICAgIGNvbnN0IG1hcHBlZCA9IGF3YWl0IEJsdWViaXJkLm1hcChjYW5kaWRhdGVzLCBjYW5kID0+XHJcbiAgICAgICAgICAgIGZzLnN0YXRBc3luYyhjYW5kLmZpbGVQYXRoKVxyXG4gICAgICAgICAgICAgIC50aGVuKHN0YXRzID0+IHN0YXRzLmlzU3ltYm9saWNMaW5rKClcclxuICAgICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKGNhbmQuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpKTtcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKG1hcHBlZCk7XHJcbiAgICAgICAgfSkpXHJcbiAgICAgICAgLnRoZW4oKGZpbGVzOiBzdHJpbmdbXSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUgIT09IHVuZGVmaW5lZCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKG1vZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpICYmIChlcnIucGF0aCA9PT0gbW9kRm9sZGVyKSlcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH0sIFtdKTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgLy8gVXNlckNhbmNlbGVkIHdvdWxkIHN1Z2dlc3Qgd2Ugd2VyZSB1bmFibGUgdG8gc3RhdCB0aGUgVzMgbW9kIGZvbGRlclxyXG4gICAgLy8gIHByb2JhYmx5IGR1ZSB0byBhIHBlcm1pc3Npb25pbmcgaXNzdWUgKEVOT0VOVCBpcyBoYW5kbGVkIGFib3ZlKVxyXG4gICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcclxuICAgIGNvbnN0IHByb2Nlc3NDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCk7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICghdXNlckNhbmNlbGVkICYmICFwcm9jZXNzQ2FuY2VsZWQpO1xyXG4gICAgY29uc3QgZGV0YWlscyA9IHVzZXJDYW5jZWxlZFxyXG4gICAgICA/ICdWb3J0ZXggdHJpZWQgdG8gc2NhbiB5b3VyIFczIG1vZHMgZm9sZGVyIGZvciBtYW51YWxseSBhZGRlZCBtb2RzIGJ1dCAnXHJcbiAgICAgICAgKyAnd2FzIGJsb2NrZWQgYnkgeW91ciBPUy9BViAtIHBsZWFzZSBtYWtlIHN1cmUgdG8gZml4IHRoaXMgYmVmb3JlIHlvdSAnXHJcbiAgICAgICAgKyAncHJvY2VlZCB0byBtb2QgVzMgYXMgeW91ciBtb2RkaW5nIGV4cGVyaWVuY2Ugd2lsbCBiZSBzZXZlcmVseSBhZmZlY3RlZC4nXHJcbiAgICAgIDogZXJyO1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbG9va3VwIG1hbnVhbGx5IGFkZGVkIG1vZHMnLFxyXG4gICAgICBkZXRhaWxzLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShcclxuICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXHJcbiAgICAgICdTb2Z0d2FyZVxcXFxDRCBQcm9qZWN0IFJlZFxcXFxUaGUgV2l0Y2hlciAzJyxcclxuICAgICAgJ0luc3RhbGxGb2xkZXInKTtcclxuICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcclxuICAgIH1cclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGluc3RQYXRoLnZhbHVlIGFzIHN0cmluZyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRF9HT1RZLCBHT0dfSUQsIFNURUFNX0lEXSlcclxuICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRUTChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gJ3dpdGNoZXIzJylcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgICAgZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdtb2RzJykgIT09IC0xKSAhPT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsVEwoZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICBnYW1lSWQsXHJcbiAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XHJcbiAgbGV0IHByZWZpeCA9IGZpbGVzLnJlZHVjZSgocHJldiwgZmlsZSkgPT4ge1xyXG4gICAgY29uc3QgY29tcG9uZW50cyA9IGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICBjb25zdCBpZHggPSBjb21wb25lbnRzLmluZGV4T2YoJ21vZHMnKTtcclxuICAgIGlmICgoaWR4ID4gMCkgJiYgKChwcmV2ID09PSB1bmRlZmluZWQpIHx8IChpZHggPCBwcmV2Lmxlbmd0aCkpKSB7XHJcbiAgICAgIHJldHVybiBjb21wb25lbnRzLnNsaWNlKDAsIGlkeCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH1cclxuICB9LCB1bmRlZmluZWQpO1xyXG5cclxuICBwcmVmaXggPSAocHJlZml4ID09PSB1bmRlZmluZWQpID8gJycgOiBwcmVmaXguam9pbihwYXRoLnNlcCkgKyBwYXRoLnNlcDtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsZXNcclxuICAgIC5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkgJiYgZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgocHJlZml4KSlcclxuICAgIC5tYXAoZmlsZSA9PiAoe1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc2xpY2UocHJlZml4Lmxlbmd0aCksXHJcbiAgICB9KSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRDb250ZW50KGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxyXG4gICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnY29udGVudCcgKyBwYXRoLnNlcCkgIT09IHVuZGVmaW5lZCkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmlsZXNcclxuICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnY29udGVudCcgKyBwYXRoLnNlcCkpXHJcbiAgICAubWFwKGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBmaWxlQmFzZSA9IGZpbGUuc3BsaXQocGF0aC5zZXApLnNsaWNlKDEpLmpvaW4ocGF0aC5zZXApO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbignbW9kJyArIGRlc3RpbmF0aW9uUGF0aCwgZmlsZUJhc2UpLFxyXG4gICAgICB9O1xyXG4gIH0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbE1lbnVNb2QoZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XHJcbiAgLy8gSW5wdXQgc3BlY2lmaWMgZmlsZXMgbmVlZCB0byBiZSBpbnN0YWxsZWQgb3V0c2lkZSB0aGUgbW9kcyBmb2xkZXIgd2hpbGVcclxuICAvLyAgYWxsIG90aGVyIG1vZCBmaWxlcyBhcmUgdG8gYmUgaW5zdGFsbGVkIGFzIHVzdWFsLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZSkpICE9PSAnJyk7XHJcbiAgY29uc3QgaW5wdXRGaWxlcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+IGZpbGUuaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpO1xyXG4gIGNvbnN0IHVuaXF1ZUlucHV0ID0gaW5wdXRGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICAvLyBTb21lIG1vZHMgdGVuZCB0byBpbmNsdWRlIGEgYmFja3VwIGZpbGUgbWVhbnQgZm9yIHRoZSB1c2VyIHRvIHJlc3RvcmVcclxuICAgIC8vICBoaXMgZ2FtZSB0byB2YW5pbGxhIChvYnZzIHdlIG9ubHkgd2FudCB0byBhcHBseSB0aGUgbm9uLWJhY2t1cCkuXHJcbiAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoaXRlcik7XHJcblxyXG4gICAgaWYgKGFjY3VtLmZpbmQoZW50cnkgPT4gcGF0aC5iYXNlbmFtZShlbnRyeSkgPT09IGZpbGVOYW1lKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFRoaXMgY29uZmlnIGZpbGUgaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGUgYWNjdW11bGF0b3IuXHJcbiAgICAgIC8vICBJZ25vcmUgdGhpcyBpbnN0YW5jZS5cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGluc3RhbmNlcyA9IGlucHV0RmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gZmlsZU5hbWUpO1xyXG4gICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIC8vIFdlIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIG1lbnUgY29uZmlnIGZpbGUgLSBtb2QgYXV0aG9yIHByb2JhYmx5IGluY2x1ZGVkXHJcbiAgICAgIC8vICBhIGJhY2t1cCBmaWxlIHRvIHJlc3RvcmUgdmFuaWxsYSBzdGF0ZSwgb3IgcGVyaGFwcyB0aGlzIGlzIGEgdmFyaWFudCBtb2Qgd2hpY2ggd2VcclxuICAgICAgLy8gIGNhbid0IGN1cnJlbnRseSBzdXBwb3J0LlxyXG4gICAgICAvLyBJdCdzIGRpZmZpY3VsdCBmb3IgdXMgdG8gY29ycmVjdGx5IGlkZW50aWZ5IHRoZSBjb3JyZWN0IGZpbGUgYnV0IHdlJ3JlIGdvaW5nIHRvXHJcbiAgICAgIC8vICB0cnkgYW5kIGd1ZXNzIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGNvbmZpZyBmaWxlIGhhcyBhIFwiYmFja3VwXCIgZm9sZGVyIHNlZ21lbnRcclxuICAgICAgLy8gIG90aGVyd2lzZSB3ZSBqdXN0IGFkZCB0aGUgZmlyc3QgZmlsZSBpbnN0YW5jZSAoSSdtIGdvaW5nIHRvIHJlZ3JldCBhZGRpbmcgdGhpcyBhcmVuJ3QgSSA/KVxyXG4gICAgICBpZiAoaXRlci50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2JhY2t1cCcpID09PSAtMSkge1xyXG4gICAgICAgIC8vIFdlJ3JlIGdvaW5nIHRvIGFzc3VtZSB0aGF0IHRoaXMgaXMgdGhlIHJpZ2h0IGZpbGUuXHJcbiAgICAgICAgYWNjdW0ucHVzaChpdGVyKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gVGhpcyBpcyBhIHVuaXF1ZSBtZW51IGNvbmZpZ3VyYXRpb24gZmlsZSAtIGFkZCBpdC5cclxuICAgICAgYWNjdW0ucHVzaChpdGVyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcblxyXG4gIGxldCBvdGhlckZpbGVzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gIWlucHV0RmlsZXMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIGNvbnN0IGlucHV0RmlsZURlc3RpbmF0aW9uID0gQ09ORklHX01BVFJJWF9SRUxfUEFUSDtcclxuXHJcbiAgLy8gR2V0IHRoZSBtb2QncyByb290IGZvbGRlci5cclxuICBjb25zdCBiaW5JZHggPSB1bmlxdWVJbnB1dFswXS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJyk7XHJcblxyXG4gIC8vIFJlZmVycyB0byBmaWxlcyBsb2NhdGVkIGluc2lkZSB0aGUgYXJjaGl2ZSdzICdNb2RzJyBkaXJlY3RvcnkuXHJcbiAgLy8gIFRoaXMgYXJyYXkgY2FuIHZlcnkgd2VsbCBiZSBlbXB0eSBpZiBhIG1vZHMgZm9sZGVyIGRvZXNuJ3QgZXhpc3RcclxuICBjb25zdCBtb2RGaWxlcyA9IG90aGVyRmlsZXMuZmlsdGVyKGZpbGUgPT5cclxuICAgIGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5jbHVkZXMoJ21vZHMnKSk7XHJcblxyXG4gIGNvbnN0IG1vZHNJZHggPSAobW9kRmlsZXMubGVuZ3RoID4gMClcclxuICAgID8gbW9kRmlsZXNbMF0udG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpXHJcbiAgICA6IC0xO1xyXG4gIGNvbnN0IG1vZE5hbWVzID0gKG1vZHNJZHggIT09IC0xKVxyXG4gICAgPyBtb2RGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vZE5hbWUgPSBpdGVyLnNwbGl0KHBhdGguc2VwKS5zcGxpY2UobW9kc0lkeCArIDEsIDEpLmpvaW4oKTtcclxuICAgICAgaWYgKCFhY2N1bS5pbmNsdWRlcyhtb2ROYW1lKSkge1xyXG4gICAgICAgIGFjY3VtLnB1c2gobW9kTmFtZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pXHJcbiAgICA6IFtdO1xyXG4gIC8vIFRoZSBwcmVzZW5jZSBvZiBhIG1vZHMgZm9sZGVyIGluZGljYXRlcyB0aGF0IHRoaXMgbW9kIG1heSBwcm92aWRlXHJcbiAgLy8gIHNldmVyYWwgbW9kIGVudHJpZXMuXHJcbiAgaWYgKG1vZEZpbGVzLmxlbmd0aCA+IDApIHtcclxuICAgIG90aGVyRmlsZXMgPSBvdGhlckZpbGVzLmZpbHRlcihmaWxlID0+ICFtb2RGaWxlcy5pbmNsdWRlcyhmaWxlKSk7XHJcbiAgfVxyXG5cclxuICAvLyBXZSdyZSBob3BpbmcgdGhhdCB0aGUgbW9kIGF1dGhvciBoYXMgaW5jbHVkZWQgdGhlIG1vZCBuYW1lIGluIHRoZSBhcmNoaXZlJ3NcclxuICAvLyAgc3RydWN0dXJlIC0gaWYgaGUgZGlkbid0IC0gd2UncmUgZ29pbmcgdG8gdXNlIHRoZSBkZXN0aW5hdGlvbiBwYXRoIGluc3RlYWQuXHJcbiAgY29uc3QgbW9kTmFtZSA9IChiaW5JZHggPiAwKVxyXG4gICAgPyBpbnB1dEZpbGVzWzBdLnNwbGl0KHBhdGguc2VwKVtiaW5JZHggLSAxXVxyXG4gICAgOiAoJ21vZCcgKyBwYXRoLmJhc2VuYW1lKGRlc3RpbmF0aW9uUGF0aCwgJy5pbnN0YWxsaW5nJykpLnJlcGxhY2UoL1xccy9nLCAnJyk7XHJcblxyXG4gIGNvbnN0IHRyaW1tZWRGaWxlcyA9IG90aGVyRmlsZXMubWFwKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc291cmNlID0gZmlsZTtcclxuICAgIGxldCByZWxQYXRoID0gZmlsZS5zcGxpdChwYXRoLnNlcClcclxuICAgICAgICAgICAgICAgICAgICAgIC5zbGljZShiaW5JZHgpO1xyXG4gICAgaWYgKHJlbFBhdGhbMF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBUaGlzIGZpbGUgbXVzdCd2ZSBiZWVuIGluc2lkZSB0aGUgcm9vdCBvZiB0aGUgYXJjaGl2ZTtcclxuICAgICAgLy8gIGRlcGxveSBhcyBpcy5cclxuICAgICAgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpcnN0U2VnID0gcmVsUGF0aFswXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGZpcnN0U2VnID09PSAnY29udGVudCcgfHwgZmlyc3RTZWcuZW5kc1dpdGgoUEFSVF9TVUZGSVgpKSB7XHJcbiAgICAgIHJlbFBhdGggPSBbXS5jb25jYXQoWydNb2RzJywgbW9kTmFtZV0sIHJlbFBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNvdXJjZSxcclxuICAgICAgcmVsUGF0aDogcmVsUGF0aC5qb2luKHBhdGguc2VwKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHRvQ29weUluc3RydWN0aW9uID0gKHNvdXJjZSwgZGVzdGluYXRpb24pID0+ICh7XHJcbiAgICB0eXBlOiAnY29weScsXHJcbiAgICBzb3VyY2UsXHJcbiAgICBkZXN0aW5hdGlvbixcclxuICB9KTtcclxuXHJcbiAgY29uc3QgaW5wdXRJbnN0cnVjdGlvbnMgPSB1bmlxdWVJbnB1dC5tYXAoZmlsZSA9PlxyXG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZSwgcGF0aC5qb2luKGlucHV0RmlsZURlc3RpbmF0aW9uLCBwYXRoLmJhc2VuYW1lKGZpbGUpKSkpO1xyXG5cclxuICBjb25zdCBvdGhlckluc3RydWN0aW9ucyA9IHRyaW1tZWRGaWxlcy5tYXAoZmlsZSA9PlxyXG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZS5zb3VyY2UsIGZpbGUucmVsUGF0aCkpO1xyXG5cclxuICBjb25zdCBtb2RGaWxlSW5zdHJ1Y3Rpb25zID0gbW9kRmlsZXMubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUsIGZpbGUpKTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gW10uY29uY2F0KGlucHV0SW5zdHJ1Y3Rpb25zLCBvdGhlckluc3RydWN0aW9ucywgbW9kRmlsZUluc3RydWN0aW9ucyk7XHJcbiAgaWYgKG1vZE5hbWVzLmxlbmd0aCA+IDApIHtcclxuICAgIGluc3RydWN0aW9ucy5wdXNoKHtcclxuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgIGtleTogJ21vZENvbXBvbmVudHMnLFxyXG4gICAgICB2YWx1ZTogbW9kTmFtZXMsXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdE1lbnVNb2RSb290KGluc3RydWN0aW9uczogYW55W10sIGdhbWVJZDogc3RyaW5nKTpcclxuICBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQgfCBib29sZWFuPiB7XHJcbiAgY29uc3QgcHJlZGljYXRlID0gKGluc3RyKSA9PiAoISFnYW1lSWQpXHJcbiAgICA/ICgoR0FNRV9JRCA9PT0gZ2FtZUlkKSAmJiAoaW5zdHIuaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpKVxyXG4gICAgOiAoKGluc3RyLnR5cGUgPT09ICdjb3B5JykgJiYgKGluc3RyLmRlc3RpbmF0aW9uLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKSk7XHJcblxyXG4gIHJldHVybiAoISFnYW1lSWQpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgc3VwcG9ydGVkOiBpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQsXHJcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgICAgIH0pXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0VEwoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgY29uc3QgbWVudU1vZEZpbGVzID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiAhIWluc3RyLmRlc3RpbmF0aW9uXHJcbiAgICAmJiBpbnN0ci5kZXN0aW5hdGlvbi5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSk7XHJcbiAgaWYgKG1lbnVNb2RGaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5zdHJ1Y3Rpb25zLmZpbmQoXHJcbiAgICBpbnN0cnVjdGlvbiA9PiAhIWluc3RydWN0aW9uLmRlc3RpbmF0aW9uICYmIGluc3RydWN0aW9uLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnbW9kcycgKyBwYXRoLnNlcCksXHJcbiAgKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdERMQyhpbnN0cnVjdGlvbnMpIHtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxyXG4gICAgaW5zdHJ1Y3Rpb24gPT4gISFpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbiAmJiBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2RsYycgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSkge1xyXG4gIGNvbnN0IG5vdGlmSWQgPSAnbWlzc2luZy1zY3JpcHQtbWVyZ2VyJztcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogbm90aWZJZCxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgMyBzY3JpcHQgbWVyZ2VyIGlzIG1pc3NpbmcvbWlzY29uZmlndXJlZCcsXHJcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgU2NyaXB0IE1lcmdlcicsIHtcclxuICAgICAgICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdWb3J0ZXggaXMgdW5hYmxlIHRvIHJlc29sdmUgdGhlIFNjcmlwdCBNZXJnZXJcXCdzIGxvY2F0aW9uLiBUaGUgdG9vbCBuZWVkcyB0byBiZSBkb3dubG9hZGVkIGFuZCBjb25maWd1cmVkIG1hbnVhbGx5LiAnXHJcbiAgICAgICAgICAgICAgKyAnW3VybD1odHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvVG9vbF9TZXR1cDpfV2l0Y2hlcl8zX1NjcmlwdF9NZXJnZXJdRmluZCBvdXQgbW9yZSBhYm91dCBob3cgdG8gY29uZmlndXJlIGl0IGFzIGEgdG9vbCBmb3IgdXNlIGluIFZvcnRleC5bL3VybF1bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICAgICAgICAgKyAnTm90ZTogV2hpbGUgc2NyaXB0IG1lcmdpbmcgd29ya3Mgd2VsbCB3aXRoIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHMsIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSBmb3IgYSBzYXRpc2Z5aW5nIG91dGNvbWUgaW4gZXZlcnkgc2luZ2xlIGNhc2UuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJyk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7IGxhYmVsOiAnRG93bmxvYWQgU2NyaXB0IE1lcmdlcicsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKSkgfSxcclxuICAgICAgICAgIF0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpIHtcclxuICBjb25zdCBmaW5kU2NyaXB0TWVyZ2VyID0gKGVycm9yKSA9PiB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBkb3dubG9hZC9pbnN0YWxsIHNjcmlwdCBtZXJnZXInLCBlcnJvcik7XHJcbiAgICBjb25zdCBzY3JpcHRNZXJnZXJQYXRoID0gZ2V0U2NyaXB0TWVyZ2VyRGlyKGNvbnRleHQpO1xyXG4gICAgaWYgKHNjcmlwdE1lcmdlclBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gc2V0TWVyZ2VyQ29uZmlnKGRpc2NvdmVyeS5wYXRoLCBzY3JpcHRNZXJnZXJQYXRoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGVuc3VyZVBhdGggPSAoZGlycGF0aCkgPT5cclxuICAgIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoZGlycGF0aClcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFRVhJU1QnKVxyXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpLFxyXG4gICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKSksXHJcbiAgICBlbnN1cmVQYXRoKHBhdGguZGlybmFtZShnZXRMb2FkT3JkZXJGaWxlUGF0aCgpKSldKVxyXG4gICAgICAudGhlbigoKSA9PiBkb3dubG9hZFNjcmlwdE1lcmdlcihjb250ZXh0KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgOiBmaW5kU2NyaXB0TWVyZ2VyKGVycikpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHNjcmlwdE1lcmdlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghIXNjcmlwdE1lcmdlcj8ucGF0aCkge1xyXG4gICAgcmV0dXJuIHNjcmlwdE1lcmdlcjtcclxuICB9XHJcblxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1blNjcmlwdE1lcmdlcihhcGkpIHtcclxuICBjb25zdCB0b29sID0gZ2V0U2NyaXB0TWVyZ2VyVG9vbChhcGkpO1xyXG4gIGlmICh0b29sPy5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBhcGkucnVuRXhlY3V0YWJsZSh0b29sLnBhdGgsIFtdLCB7IHN1Z2dlc3REZXBsb3k6IHRydWUgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJ1biB0b29sJywgZXJyLFxyXG4gICAgICB7IGFsbG93UmVwb3J0OiBbJ0VQRVJNJywgJ0VBQ0NFU1MnLCAnRU5PRU5UJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xIH0pKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTW9kcyhjb250ZXh0KSB7XHJcbiAgLy8gTW9kIHR5cGVzIHdlIGRvbid0IHdhbnQgdG8gZGlzcGxheSBpbiB0aGUgTE8gcGFnZVxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBtZXJnZWQ6IFtdLFxyXG4gICAgICBtYW51YWw6IFtdLFxyXG4gICAgICBtYW5hZ2VkOiBbXSxcclxuICAgIH0pO1xyXG4gIH1cclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcblxyXG4gIC8vIE9ubHkgc2VsZWN0IG1vZHMgd2hpY2ggYXJlIGVuYWJsZWQsIGFuZCBhcmUgbm90IGEgbWVudSBtb2QuXHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RTdGF0ZSkuZmlsdGVyKGtleSA9PlxyXG4gICAgKCEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSkpO1xyXG5cclxuICBjb25zdCBtZXJnZWRNb2ROYW1lcyA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWVzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbnVhbGx5QWRkZWRNb2RzID0gYXdhaXQgZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCk7XHJcbiAgY29uc3QgbWFuYWdlZE1vZHMgPSBhd2FpdCBnZXRNYW5hZ2VkTW9kTmFtZXMoY29udGV4dCwgZW5hYmxlZE1vZHMubWFwKGtleSA9PiBtb2RzW2tleV0pKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIG1lcmdlZDogbWVyZ2VkTW9kTmFtZXMsXHJcbiAgICBtYW51YWw6IG1hbnVhbGx5QWRkZWRNb2RzLmZpbHRlcihtb2QgPT4gIW1lcmdlZE1vZE5hbWVzLmluY2x1ZGVzKG1vZCkpLFxyXG4gICAgbWFuYWdlZDogbWFuYWdlZE1vZHMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNldElOSVN0cnVjdChjb250ZXh0LCBsb2FkT3JkZXIsIHByaW9yaXR5TWFuYWdlcikge1xyXG4gIHJldHVybiBnZXRBbGxNb2RzKGNvbnRleHQpLnRoZW4obW9kTWFwID0+IHtcclxuICAgIF9JTklfU1RSVUNUID0ge307XHJcbiAgICBjb25zdCBtb2RzID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1vZE1hcC5tYW5hZ2VkLCBtb2RNYXAubWFudWFsKTtcclxuICAgIGNvbnN0IGZpbHRlckZ1bmMgPSAobW9kTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIC8vIFdlJ3JlIGFkZGluZyB0aGlzIHRvIGF2b2lkIGhhdmluZyB0aGUgbG9hZCBvcmRlciBwYWdlXHJcbiAgICAgIC8vICBmcm9tIG5vdCBsb2FkaW5nIGlmIHdlIGVuY291bnRlciBhbiBpbnZhbGlkIG1vZCBuYW1lLlxyXG4gICAgICBpZiAoIW1vZE5hbWUpIHtcclxuICAgICAgICBsb2coJ2RlYnVnJywgJ2VuY291bnRlcmVkIGludmFsaWQgbW9kIGluc3RhbmNlL25hbWUnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKGZpbHRlckZ1bmMpO1xyXG4gICAgY29uc3QgbWFuYWdlZExvY2tlZCA9IG1vZE1hcC5tYW5hZ2VkXHJcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gZmlsdGVyRnVuYyhlbnRyeS5uYW1lKSlcclxuICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKTtcclxuICAgIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCwgbWFuYWdlZExvY2tlZCk7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChtb2RzLCAobW9kLCBpZHgpID0+IHtcclxuICAgICAgbGV0IG5hbWU7XHJcbiAgICAgIGxldCBrZXk7XHJcbiAgICAgIGlmICh0eXBlb2YobW9kKSA9PT0gJ29iamVjdCcgJiYgbW9kICE9PSBudWxsKSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZC5uYW1lO1xyXG4gICAgICAgIGtleSA9IG1vZC5pZDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuYW1lID0gbW9kO1xyXG4gICAgICAgIGtleSA9IG1vZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgTE9FbnRyeSA9IHV0aWwuZ2V0U2FmZShsb2FkT3JkZXIsIFtrZXldLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgcHJpb3JpdHlNYW5hZ2VyLnJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICAgICAgfVxyXG4gICAgICBfSU5JX1NUUlVDVFtuYW1lXSA9IHtcclxuICAgICAgICAvLyBUaGUgSU5JIGZpbGUncyBlbmFibGVkIGF0dHJpYnV0ZSBleHBlY3RzIDEgb3IgMFxyXG4gICAgICAgIEVuYWJsZWQ6IChMT0VudHJ5ICE9PSB1bmRlZmluZWQpID8gTE9FbnRyeS5lbmFibGVkID8gMSA6IDAgOiAxLFxyXG4gICAgICAgIFByaW9yaXR5OiB0b3RhbExvY2tlZC5pbmNsdWRlcyhuYW1lKVxyXG4gICAgICAgICAgPyB0b3RhbExvY2tlZC5pbmRleE9mKG5hbWUpXHJcbiAgICAgICAgICA6IHByaW9yaXR5TWFuYWdlci5nZXRQcmlvcml0eSh7IGlkOiBrZXkgfSksXHJcbiAgICAgICAgVks6IGtleSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbi8vIGl0ZW06IElMb2FkT3JkZXJEaXNwbGF5SXRlbVxyXG5mdW5jdGlvbiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRGlzcGxheUl0ZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBtaW5Qcmlvcml0eTogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgb25TZXRQcmlvcml0eTogKGtleTogc3RyaW5nLCBwcmlvcml0eTogbnVtYmVyKSA9PiB2b2lkKSB7XHJcbiAgY29uc3QgcHJpb3JpdHlJbnB1dERpYWxvZyA9ICgpID0+IHtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoKHJlc29sdmUpID0+IHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmlvcml0eScsIHtcclxuICAgICAgICB0ZXh0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0luc2VydCBuZXcgbnVtZXJpY2FsIHByaW9yaXR5IGZvciB7e2l0ZW1OYW1lfX0gaW4gdGhlIGlucHV0IGJveDonLCB7IHJlcGxhY2U6IHsgaXRlbU5hbWU6IGl0ZW0ubmFtZSB9IH0pLFxyXG4gICAgICAgIGlucHV0OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAndzNQcmlvcml0eUlucHV0JyxcclxuICAgICAgICAgICAgbGFiZWw6ICdQcmlvcml0eScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogX0lOSV9TVFJVQ1RbaXRlbS5pZF0/LlByaW9yaXR5IHx8IDAsXHJcbiAgICAgICAgICB9XSxcclxuICAgICAgfSwgWyB7IGxhYmVsOiAnQ2FuY2VsJyB9LCB7IGxhYmVsOiAnU2V0JywgZGVmYXVsdDogdHJ1ZSB9IF0pXHJcbiAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdTZXQnKSB7XHJcbiAgICAgICAgICBjb25zdCBpdGVtS2V5ID0gT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLmZpbmQoa2V5ID0+IF9JTklfU1RSVUNUW2tleV0uVksgPT09IGl0ZW0uaWQpO1xyXG4gICAgICAgICAgY29uc3Qgd2FudGVkUHJpb3JpdHkgPSByZXN1bHQuaW5wdXRbJ3czUHJpb3JpdHlJbnB1dCddO1xyXG4gICAgICAgICAgaWYgKHdhbnRlZFByaW9yaXR5IDw9IG1pblByaW9yaXR5KSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignQ2Fubm90IGNoYW5nZSB0byBsb2NrZWQgZW50cnkgUHJpb3JpdHknLFxyXG4gICAgICAgICAgICAgIHdhbnRlZFByaW9yaXR5KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpdGVtS2V5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgX0lOSV9TVFJVQ1RbaXRlbUtleV0uUHJpb3JpdHkgPSBwYXJzZUludCh3YW50ZWRQcmlvcml0eSwgMTApO1xyXG4gICAgICAgICAgICBvblNldFByaW9yaXR5KGl0ZW1LZXksIHdhbnRlZFByaW9yaXR5KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHNldCBwcmlvcml0eSAtIG1vZCBpcyBub3QgaW4gaW5pIHN0cnVjdCcsIHsgbW9kSWQ6IGl0ZW0uaWQgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICBjb25zdCBpdGVtQWN0aW9ucyA9IFtcclxuICAgIHtcclxuICAgICAgc2hvdzogaXRlbS5sb2NrZWQgIT09IHRydWUsXHJcbiAgICAgIHRpdGxlOiAnU2V0IE1hbnVhbCBQcmlvcml0eScsXHJcbiAgICAgIGFjdGlvbjogKCkgPT4gcHJpb3JpdHlJbnB1dERpYWxvZygpLFxyXG4gICAgfSxcclxuICBdO1xyXG5cclxuICByZXR1cm4gaXRlbUFjdGlvbnM7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgcHJpb3JpdHlNYW5hZ2VyKTogUHJvbWlzZTxhbnlbXT4ge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IHsgZ2V0UHJpb3JpdHksIHJlc2V0TWF4UHJpb3JpdHkgfSA9IHByaW9yaXR5TWFuYWdlcjtcclxuICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gV2hhdCBhbiBvZGQgdXNlIGNhc2UgLSBwZXJoYXBzIHRoZSB1c2VyIGhhZCBzd2l0Y2hlZCBnYW1lTW9kZXMgb3JcclxuICAgIC8vICBldmVuIGRlbGV0ZWQgaGlzIHByb2ZpbGUgZHVyaW5nIHRoZSBwcmUtc29ydCBmdW5jdGlvbmFsaXR5ID9cclxuICAgIC8vICBPZGQgYnV0IHBsYXVzaWJsZSBJIHN1cHBvc2UgP1xyXG4gICAgbG9nKCd3YXJuJywgJ1tXM10gdW5hYmxlIHRvIHByZXNvcnQgZHVlIHRvIG5vIGFjdGl2ZSBwcm9maWxlJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIGxldCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IG9uU2V0UHJpb3JpdHkgPSAoaXRlbUtleSwgd2FudGVkUHJpb3JpdHkpID0+IHtcclxuICAgIHJldHVybiB3cml0ZVRvTW9kU2V0dGluZ3MoKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgd2FudGVkUHJpb3JpdHkgPSArd2FudGVkUHJpb3JpdHk7XHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgbW9kSWQgPSBfSU5JX1NUUlVDVFtpdGVtS2V5XS5WSztcclxuICAgICAgICBjb25zdCBsb0VudHJ5ID0gbG9hZE9yZGVyW21vZElkXTtcclxuICAgICAgICBpZiAocHJpb3JpdHlNYW5hZ2VyLnByaW9yaXR5VHlwZSA9PT0gJ3Bvc2l0aW9uLWJhc2VkJykge1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXJFbnRyeShcclxuICAgICAgICAgICAgYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHtcclxuICAgICAgICAgICAgICAuLi5sb0VudHJ5LFxyXG4gICAgICAgICAgICAgIHBvczogKGxvRW50cnkucG9zIDwgd2FudGVkUHJpb3JpdHkpID8gd2FudGVkUHJpb3JpdHkgOiB3YW50ZWRQcmlvcml0eSAtIDIsXHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlckVudHJ5KFxyXG4gICAgICAgICAgICBhY3RpdmVQcm9maWxlLmlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgICAgIC4uLmxvRW50cnksXHJcbiAgICAgICAgICAgICAgcHJlZml4OiBwYXJzZUludChfSU5JX1NUUlVDVFtpdGVtS2V5XS5Qcmlvcml0eSwgMTApLFxyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmVmcmVzaEZ1bmMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICB9O1xyXG4gIGNvbnN0IGFsbE1vZHMgPSBhd2FpdCBnZXRBbGxNb2RzKGNvbnRleHQpO1xyXG4gIGlmICgoYWxsTW9kcy5tZXJnZWQubGVuZ3RoID09PSAwKSAmJiAoYWxsTW9kcy5tYW51YWwubGVuZ3RoID09PSAwKSkge1xyXG4gICAgaXRlbXMubWFwKChpdGVtLCBpZHgpID0+IHtcclxuICAgICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICAgIHJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLml0ZW0sXHJcbiAgICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgMCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZmlsdGVyRnVuYyA9IChtb2ROYW1lOiBzdHJpbmcpID0+IG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcclxuICBjb25zdCBsb2NrZWRNb2RzID0gW10uY29uY2F0KGFsbE1vZHMubWFudWFsLmZpbHRlcihmaWx0ZXJGdW5jKSxcclxuICAgIGFsbE1vZHMubWFuYWdlZC5maWx0ZXIoZW50cnkgPT4gZmlsdGVyRnVuYyhlbnRyeS5uYW1lKSlcclxuICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSkpO1xyXG4gIGNvbnN0IHJlYWRhYmxlTmFtZXMgPSB7XHJcbiAgICBbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCcsXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbG9ja2VkRW50cmllcyA9IFtdLmNvbmNhdChhbGxNb2RzLm1lcmdlZCwgbG9ja2VkTW9kcylcclxuICAgIC5yZWR1Y2UoKGFjY3VtLCBtb2ROYW1lLCBpZHgpID0+IHtcclxuICAgICAgY29uc3Qgb2JqID0ge1xyXG4gICAgICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgICAgIG5hbWU6ICEhcmVhZGFibGVOYW1lc1ttb2ROYW1lXSA/IHJlYWRhYmxlTmFtZXNbbW9kTmFtZV0gOiBtb2ROYW1lLFxyXG4gICAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgbG9ja2VkOiB0cnVlLFxyXG4gICAgICAgIHByZWZpeDogaWR4ICsgMSxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmICghYWNjdW0uZmluZChhY2MgPT4gb2JqLmlkID09PSBhY2MuaWQpKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaChvYmopO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcblxyXG4gIGl0ZW1zID0gaXRlbXMuZmlsdGVyKGl0ZW0gPT4gIWFsbE1vZHMubWVyZ2VkLmluY2x1ZGVzKGl0ZW0uaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhYWxsTW9kcy5tYW51YWwuaW5jbHVkZXMoaXRlbS5pZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFhbGxNb2RzLm1hbmFnZWQuZmluZChtb2QgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChtb2QubmFtZSA9PT0gVU5JX1BBVENIKSAmJiAobW9kLmlkID09PSBpdGVtLmlkKSkpXHJcbiAgICAgICAgICAgICAgIC5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICByZXNldE1heFByaW9yaXR5KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5pdGVtLFxyXG4gICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCBsb2NrZWRFbnRyaWVzLmxlbmd0aCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtYW51YWxFbnRyaWVzID0gYWxsTW9kcy5tYW51YWxcclxuICAgIC5maWx0ZXIoa2V5ID0+IGxvY2tlZEVudHJpZXMuZmluZChlbnRyeSA9PiBlbnRyeS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgLm1hcChrZXkgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtID0ge1xyXG4gICAgICAgIGlkOiBrZXksXHJcbiAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgZXh0ZXJuYWw6IHRydWUsXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uaXRlbSxcclxuICAgICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgICAgIGNvbnRleHRNZW51QWN0aW9uczogZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQsIGl0ZW0sIGxvY2tlZEVudHJpZXMubGVuZ3RoLCBvblNldFByaW9yaXR5KSxcclxuICAgICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcik7XHJcbiAgY29uc3Qga25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4ga2V5cy5pbmNsdWRlcyhlbnRyeS5pZCkpIHx8IFtdO1xyXG4gIGNvbnN0IHVua25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWtleXMuaW5jbHVkZXMoZW50cnkuaWQpKSB8fCBbXTtcclxuICBjb25zdCBmaWx0ZXJlZE9yZGVyID0ga2V5c1xyXG4gICAgLmZpbHRlcihrZXkgPT4gbG9ja2VkRW50cmllcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgICBhY2N1bVtrZXldID0gbG9hZE9yZGVyW2tleV07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICBrbm93bk1hbnVhbGx5QWRkZWQuZm9yRWFjaChrbm93biA9PiB7XHJcbiAgICBjb25zdCBkaWZmID0ga2V5cy5sZW5ndGggLSBPYmplY3Qua2V5cyhmaWx0ZXJlZE9yZGVyKS5sZW5ndGg7XHJcblxyXG4gICAgY29uc3QgcG9zID0gZmlsdGVyZWRPcmRlcltrbm93bi5pZF0ucG9zIC0gZGlmZjtcclxuICAgIGl0ZW1zID0gW10uY29uY2F0KGl0ZW1zLnNsaWNlKDAsIHBvcykgfHwgW10sIGtub3duLCBpdGVtcy5zbGljZShwb3MpIHx8IFtdKTtcclxuICB9KTtcclxuXHJcbiAgbGV0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChcclxuICAgIC4uLmxvY2tlZEVudHJpZXMsXHJcbiAgICBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IGlzTG9ja2VkID0gbG9ja2VkRW50cmllcy5maW5kKGxvY2tlZCA9PiBsb2NrZWQubmFtZSA9PT0gaXRlbS5uYW1lKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBkb05vdERpc3BsYXkgPSBET19OT1RfRElTUExBWS5pbmNsdWRlcyhpdGVtLm5hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIHJldHVybiAhaXNMb2NrZWQgJiYgIWRvTm90RGlzcGxheTtcclxuICAgIH0pLFxyXG4gICAgLi4udW5rbm93bk1hbnVhbGx5QWRkZWQpO1xyXG5cclxuICBwcmVTb3J0ZWQgPSAodXBkYXRlVHlwZSAhPT0gJ2RyYWctbi1kcm9wJylcclxuICAgID8gcHJlU29ydGVkLnNvcnQoKGxocywgcmhzKSA9PiBsaHMucHJlZml4IC0gcmhzLnByZWZpeClcclxuICAgIDogcHJlU29ydGVkLnJlZHVjZSgoYWNjdW0sIGVudHJ5LCBpZHgpID0+IHtcclxuICAgICAgICBpZiAobG9ja2VkRW50cmllcy5pbmRleE9mKGVudHJ5KSAhPT0gLTEgfHwgaWR4ID09PSAwKSB7XHJcbiAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgcHJldlByZWZpeCA9IHBhcnNlSW50KGFjY3VtW2lkeCAtIDFdLnByZWZpeCwgMTApO1xyXG4gICAgICAgICAgaWYgKHByZXZQcmVmaXggPj0gZW50cnkucHJlZml4KSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgICAgIC4uLmVudHJ5LFxyXG4gICAgICAgICAgICAgIHByZWZpeDogcHJldlByZWZpeCArIDEsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocHJlU29ydGVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE1vZEZvbGRlcihpbnN0YWxsYXRpb25QYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIGlmICghaW5zdGFsbGF0aW9uUGF0aCB8fCAhbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XHJcbiAgICBjb25zdCBlcnJNZXNzYWdlID0gIWluc3RhbGxhdGlvblBhdGhcclxuICAgICAgPyAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCdcclxuICAgICAgOiAnRmFpbGVkIHRvIHJlc29sdmUgbW9kIGluc3RhbGxhdGlvbiBwYXRoJztcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKGVyck1lc3NhZ2UpKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uID0gWyd3aXRjaGVyM21lbnVtb2Ryb290JywgJ3dpdGNoZXIzdGwnXS5pbmNsdWRlcyhtb2QudHlwZSlcclxuICAgID8gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCAnTW9kcycpXHJcbiAgICA6IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhleHBlY3RlZE1vZE5hbWVMb2NhdGlvbilcclxuICAgIC50aGVuKGVudHJpZXMgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXNbMF0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQ6IHR5cGVzLklDb21wb25lbnRDb250ZXh0LCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcclxuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKG1vZHMsIChhY2N1bSwgbW9kKSA9PiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGgsIG1vZClcclxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xyXG4gICAgICBpZiAoIW1vZE5hbWUgfHwgWydjb2xsZWN0aW9uJywgJ3czbW9kbGltaXRwYXRjaGVyJ10uaW5jbHVkZXMobW9kLnR5cGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbW9kQ29tcG9uZW50cyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdtb2RDb21wb25lbnRzJ10sIFtdKTtcclxuICAgICAgaWYgKG1vZENvbXBvbmVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgbW9kQ29tcG9uZW50cy5wdXNoKG1vZE5hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIFsuLi5tb2RDb21wb25lbnRzXS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgICBpZDogbW9kLmlkLFxyXG4gICAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHJlc29sdmUgbW9kIG5hbWUnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH0pLCBbXSk7XHJcbn1cclxuXHJcbmNvbnN0IHRvZ2dsZU1vZHNTdGF0ZSA9IGFzeW5jIChjb250ZXh0LCBwcm9wcywgZW5hYmxlZCkgPT4ge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgY29uc3QgbW9kTWFwID0gYXdhaXQgZ2V0QWxsTW9kcyhjb250ZXh0KTtcclxuICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihtb2ROYW1lID0+IG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSk7XHJcbiAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkKTtcclxuICBjb25zdCBuZXdMTyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XHJcbiAgICBpZiAodG90YWxMb2NrZWQuaW5jbHVkZXMoa2V5KSkge1xyXG4gICAgICBhY2N1bVtrZXldID0gbG9hZE9yZGVyW2tleV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhY2N1bVtrZXldID0ge1xyXG4gICAgICAgIC4uLmxvYWRPcmRlcltrZXldLFxyXG4gICAgICAgIGVuYWJsZWQsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIG5ld0xPIGFzIGFueSkpO1xyXG4gIHByb3BzLnJlZnJlc2goKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpOiBKU1guRWxlbWVudCB7XHJcbiAgY29uc3QgdCA9IGNvbnRleHQuYXBpLnRyYW5zbGF0ZTtcclxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2xvYWRvcmRlcmluZm8nIH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LCB0KCdNYW5hZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwgeyBzdHlsZTogeyBoZWlnaHQ6ICczMCUnIH0gfSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdZb3UgY2FuIGFkanVzdCB0aGUgbG9hZCBvcmRlciBmb3IgVGhlIFdpdGNoZXIgMyBieSBkcmFnZ2luZyBhbmQgZHJvcHBpbmcgJ1xyXG4gICAgICArICdtb2RzIHVwIG9yIGRvd24gb24gdGhpcyBwYWdlLiAgSWYgeW91IGFyZSB1c2luZyBzZXZlcmFsIG1vZHMgdGhhdCBhZGQgc2NyaXB0cyB5b3UgbWF5IG5lZWQgdG8gdXNlICdcclxuICAgICAgKyAndGhlIFdpdGNoZXIgMyBTY3JpcHQgbWVyZ2VyLiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBzZWU6ICcsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYScsIHsgb25DbGljazogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Nb2RkaW5nX1RoZV9XaXRjaGVyXzNfd2l0aF9Wb3J0ZXgnKSB9LCB0KCdNb2RkaW5nIFRoZSBXaXRjaGVyIDMgd2l0aCBWb3J0ZXguJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xyXG4gICAgICBzdHlsZTogeyBoZWlnaHQ6ICc4MCUnIH0sXHJcbiAgICB9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1BsZWFzZSBub3RlOicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7fSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdGb3IgV2l0Y2hlciAzLCB0aGUgbW9kIHdpdGggdGhlIGxvd2VzdCBpbmRleCBudW1iZXIgKGJ5IGRlZmF1bHQsIHRoZSBtb2Qgc29ydGVkIGF0IHRoZSB0b3ApIG92ZXJyaWRlcyBtb2RzIHdpdGggYSBoaWdoZXIgaW5kZXggbnVtYmVyLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdZb3UgYXJlIGFibGUgdG8gbW9kaWZ5IHRoZSBwcmlvcml0eSBtYW51YWxseSBieSByaWdodCBjbGlja2luZyBhbnkgTE8gZW50cnkgYW5kIHNldCB0aGUgbW9kXFwncyBwcmlvcml0eScsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdJZiB5b3UgY2Fubm90IHNlZSB5b3VyIG1vZCBpbiB0aGlzIGxvYWQgb3JkZXIsIHlvdSBtYXkgbmVlZCB0byBhZGQgaXQgbWFudWFsbHkgKHNlZSBvdXIgd2lraSBmb3IgZGV0YWlscykuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1doZW4gbWFuYWdpbmcgbWVudSBtb2RzLCBtb2Qgc2V0dGluZ3MgY2hhbmdlZCBpbnNpZGUgdGhlIGdhbWUgd2lsbCBiZSBkZXRlY3RlZCBieSBWb3J0ZXggYXMgZXh0ZXJuYWwgY2hhbmdlcyAtIHRoYXQgaXMgZXhwZWN0ZWQsICdcclxuICAgICAgICAgICsgJ2Nob29zZSB0byB1c2UgdGhlIG5ld2VyIGZpbGUgYW5kIHlvdXIgc2V0dGluZ3Mgd2lsbCBiZSBtYWRlIHBlcnNpc3RlbnQuJyxcclxuICAgICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdZb3UgY2FuIGNoYW5nZSB0aGUgd2F5IHRoZSBwcmlvcml0aWVzIGFyZSBhc3NnaW5lZCB1c2luZyB0aGUgXCJTd2l0Y2ggVG8gUG9zaXRpb24vUHJlZml4IGJhc2VkXCIgYnV0dG9uLiAnXHJcbiAgICAgICAgICArICdQcmVmaXggYmFzZWQgaXMgbGVzcyByZXN0cmljdGl2ZSBhbmQgYWxsb3dzIHlvdSB0byBzZXQgYW55IHByaW9yaXR5IHZhbHVlIHlvdSB3YW50IFwiNTAwMCwgNjk5OTksIGV0Y1wiIHdoaWxlIHBvc2l0aW9uIGJhc2VkIHdpbGwgJ1xyXG4gICAgICAgICAgKyAncmVzdHJpY3QgdGhlIHByaW9yaXRpZXMgdG8gdGhlIG51bWJlciBvZiBsb2FkIG9yZGVyIGVudHJpZXMgdGhhdCBhcmUgYXZhaWxhYmxlLicsXHJcbiAgICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnTWVyZ2VzIGdlbmVyYXRlZCBieSB0aGUgV2l0Y2hlciAzIFNjcmlwdCBtZXJnZXIgbXVzdCBiZSBsb2FkZWQgZmlyc3QgYW5kIGFyZSBsb2NrZWQgaW4gdGhlIGZpcnN0IGxvYWQgb3JkZXIgc2xvdC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuQnV0dG9uLCB7XHJcbiAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB0b2dnbGVNb2RzU3RhdGUoY29udGV4dCwgcHJvcHMsIGZhbHNlKSxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzVweCcsXHJcbiAgICAgICAgICAgIHdpZHRoOiAnbWluLWNvbnRlbnQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LCB0KCdEaXNhYmxlIEFsbCcpKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdicicpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuQnV0dG9uLCB7XHJcbiAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB0b2dnbGVNb2RzU3RhdGUoY29udGV4dCwgcHJvcHMsIHRydWUpLFxyXG4gICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnNXB4JyxcclxuICAgICAgICAgICAgd2lkdGg6ICdtaW4tY29udGVudCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sIHQoJ0VuYWJsZSBBbGwgJykpLCBbXSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBxdWVyeVNjcmlwdE1lcmdlKGNvbnRleHQsIHJlYXNvbikge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXJUb29sPy5wYXRoKSB7XHJcbiAgICBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgaWQ6ICd3aXRjaGVyMy1tZXJnZScsXHJcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgbWVzc2FnZTogY29udGV4dC5hcGkudHJhbnNsYXRlKCdXaXRjaGVyIFNjcmlwdCBtZXJnZXIgbWF5IG5lZWQgdG8gYmUgZXhlY3V0ZWQnLFxyXG4gICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMycsIHtcclxuICAgICAgICAgICAgICB0ZXh0OiByZWFzb24sXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnUnVuIHRvb2wnLFxyXG4gICAgICAgICAgYWN0aW9uOiBkaXNtaXNzID0+IHtcclxuICAgICAgICAgICAgcnVuU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoY29udGV4dC5hcGkpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY2FuTWVyZ2UoZ2FtZSwgZ2FtZURpc2NvdmVyeSkge1xyXG4gIGlmIChnYW1lLmlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuICh7XHJcbiAgICBiYXNlRmlsZXM6ICgpID0+IFtcclxuICAgICAge1xyXG4gICAgICAgIGluOiBwYXRoLmpvaW4oZ2FtZURpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gICAgICAgIG91dDogcGF0aC5qb2luKENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBmaWxlUGF0aC5lbmRzV2l0aChJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkSW5wdXRGaWxlKGNvbnRleHQsIG1lcmdlRGlyKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3QgZ2FtZUlucHV0RmlsZXBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSk7XHJcbiAgcmV0dXJuICghIWRpc2NvdmVyeT8ucGF0aClcclxuICAgID8gZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4obWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSkpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICA/IGZzLnJlYWRGaWxlQXN5bmMoZ2FtZUlucHV0RmlsZXBhdGgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgOiBQcm9taXNlLnJlamVjdCh7IGNvZGU6ICdFTk9FTlQnLCBtZXNzYWdlOiAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcgfSk7XHJcbn1cclxuXHJcbmNvbnN0IGVtcHR5WG1sID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PjxtZXRhZGF0YT48L21ldGFkYXRhPic7XHJcbmZ1bmN0aW9uIG1lcmdlKGZpbGVQYXRoLCBtZXJnZURpciwgY29udGV4dCkge1xyXG4gIGxldCBtb2REYXRhO1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgLnRoZW4oeG1sRGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbW9kRGF0YSA9IHBhcnNlWG1sU3RyaW5nKHhtbERhdGEsIHsgaWdub3JlX2VuYzogdHJ1ZSwgbm9ibGFua3M6IHRydWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAvLyBUaGUgbW9kIGl0c2VsZiBoYXMgaW52YWxpZCB4bWwgZGF0YS5cclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgbW9kIFhNTCBkYXRhIC0gaW5mb3JtIG1vZCBhdXRob3InLFxyXG4gICAgICAgIHsgcGF0aDogZmlsZVBhdGgsIGVycm9yOiBlcnIubWVzc2FnZSB9LCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICBtb2REYXRhID0gZW1wdHlYbWw7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLnRoZW4oKCkgPT4gcmVhZElucHV0RmlsZShjb250ZXh0LCBtZXJnZURpcikpXHJcbiAgICAudGhlbihtZXJnZWREYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtZXJnZWQgPSBwYXJzZVhtbFN0cmluZyhtZXJnZWREYXRhLCB7IGlnbm9yZV9lbmM6IHRydWUsIG5vYmxhbmtzOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobWVyZ2VkKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgbWVyZ2VkIGZpbGUgLSBpZiBpdCdzIGludmFsaWQgY2hhbmNlcyBhcmUgd2UgbWVzc2VkIHVwXHJcbiAgICAgICAgLy8gIHNvbWVob3csIHJlYXNvbiB3aHkgd2UncmUgZ29pbmcgdG8gYWxsb3cgdGhpcyBlcnJvciB0byBnZXQgcmVwb3J0ZWQuXHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgbWVyZ2VkIFhNTCBkYXRhJywgZXJyLCB7XHJcbiAgICAgICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcclxuICAgICAgICAgIGF0dGFjaG1lbnRzOiBbXHJcbiAgICAgICAgICAgIHsgaWQ6ICdfX21lcmdlZC9pbnB1dC54bWwnLCB0eXBlOiAnZGF0YScsIGRhdGE6IG1lcmdlZERhdGEsXHJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaXRjaGVyIDMgbWVudSBtb2QgbWVyZ2VkIGRhdGEnIH0sXHJcbiAgICAgICAgICAgIHsgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X2xvYWRPcmRlcmAsIHR5cGU6ICdkYXRhJywgZGF0YTogbG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBsb2FkIG9yZGVyJyB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ludmFsaWQgbWVyZ2VkIFhNTCBkYXRhJykpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLnRoZW4oZ2FtZUluZGV4RmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vZFZhcnMgPSBtb2REYXRhLmZpbmQoJy8vVmFyJyk7XHJcbiAgICAgIGNvbnN0IGdhbWVWYXJzID0gZ2FtZUluZGV4RmlsZS5maW5kPEVsZW1lbnQ+KCcvL1ZhcicpO1xyXG5cclxuICAgICAgbW9kVmFycy5mb3JFYWNoKG1vZFZhciA9PiB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2hlciA9IChnYW1lVmFyKSA9PiB7XHJcbiAgICAgICAgICBsZXQgZ2FtZVZhclBhcmVudDtcclxuICAgICAgICAgIGxldCBtb2RWYXJQYXJlbnQ7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBnYW1lVmFyUGFyZW50ID0gZ2FtZVZhci5wYXJlbnQoKS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgbW9kVmFyUGFyZW50ID0gbW9kVmFyLnBhcmVudCgpLnBhcmVudCgpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIC8vIFRoaXMgZ2FtZSB2YXJpYWJsZSBtdXN0J3ZlIGJlZW4gcmVwbGFjZWQgaW4gYSBwcmV2aW91c1xyXG4gICAgICAgICAgICAvLyAgaXRlcmF0aW9uLlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCh0eXBlb2YoZ2FtZVZhclBhcmVudD8uYXR0cikgIT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgfHwgKHR5cGVvZihtb2RWYXJQYXJlbnQ/LmF0dHIpICE9PSAnZnVuY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAgLy8gVGhpcyBpcyBhY3R1YWxseSBxdWl0ZSBwcm9ibGVtYXRpYyAtIGl0IHByZXR0eSBtdWNoIG1lYW5zXHJcbiAgICAgICAgICAgICAvLyAgdGhhdCBlaXRoZXIgdGhlIG1vZCBvciB0aGUgZ2FtZSBpdHNlbGYgaGFzIGdhbWUgdmFyaWFibGVzXHJcbiAgICAgICAgICAgICAvLyAgbG9jYXRlZCBvdXRzaWRlIGEgZ3JvdXAuIEVpdGhlciB0aGUgZ2FtZSBpbnB1dCBmaWxlIGlzIGNvcnJ1cHRlZFxyXG4gICAgICAgICAgICAgLy8gIChtYW51YWwgdGFtcGVyaW5nPykgb3IgdGhlIG1vZCBpdHNlbGYgaXMuIFRoYW5rZnVsbHkgd2Ugd2lsbCBiZVxyXG4gICAgICAgICAgICAgLy8gIGNyZWF0aW5nIHRoZSBtaXNzaW5nIGdyb3VwLCBidXQgaXQgbGVhZHMgdG8gdGhlIHF1ZXN0aW9uLCB3aGF0XHJcbiAgICAgICAgICAgICAvLyAgb3RoZXIgc3VycHJpc2VzIGFyZSB3ZSBnb2luZyB0byBlbmNvdW50ZXIgZnVydGhlciBkb3duIHRoZSBsaW5lID9cclxuICAgICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGZpbmQgcGFyZW50IGdyb3VwIG9mIG1vZCB2YXJpYWJsZScsIG1vZFZhcik7XHJcbiAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiAoKGdhbWVWYXJQYXJlbnQuYXR0cignaWQnKS52YWx1ZSgpID09PSBtb2RWYXJQYXJlbnQuYXR0cignaWQnKS52YWx1ZSgpKVxyXG4gICAgICAgICAgICAmJiAoZ2FtZVZhci5hdHRyKCdpZCcpLnZhbHVlKCkgPT09IG1vZFZhci5hdHRyKCdpZCcpLnZhbHVlKCkpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBleGlzdGluZ1ZhciA9IGdhbWVWYXJzLmZpbmQobWF0Y2hlcik7XHJcbiAgICAgICAgaWYgKGV4aXN0aW5nVmFyKSB7XHJcbiAgICAgICAgICBleGlzdGluZ1Zhci5yZXBsYWNlKG1vZFZhci5jbG9uZSgpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgcGFyZW50R3JvdXAgPSBtb2RWYXIucGFyZW50KCkucGFyZW50KCk7XHJcbiAgICAgICAgICBjb25zdCBncm91cElkID0gcGFyZW50R3JvdXAuYXR0cignaWQnKS52YWx1ZSgpO1xyXG4gICAgICAgICAgY29uc3QgbWF0Y2hpbmdJbmRleEdyb3VwID0gZ2FtZUluZGV4RmlsZS5maW5kPEVsZW1lbnQ+KCcvL0dyb3VwJylcclxuICAgICAgICAgICAgLmZpbHRlcihncm91cCA9PiBncm91cC5hdHRyKCdpZCcpLnZhbHVlKCkgPT09IGdyb3VwSWQpO1xyXG4gICAgICAgICAgaWYgKG1hdGNoaW5nSW5kZXhHcm91cC5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIC8vIFNvbWV0aGluZydzIHdyb25nIHdpdGggdGhlIGZpbGUgLSBiYWNrIG9mZi5cclxuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IHV0aWwuRGF0YUludmFsaWQoJ0R1cGxpY2F0ZSBncm91cCBlbnRyaWVzIGZvdW5kIGluIGdhbWUgaW5wdXQueG1sJ1xyXG4gICAgICAgICAgICAgICsgYFxcblxcbiR7cGF0aC5qb2luKG1lcmdlRGlyLCBJTlBVVF9YTUxfRklMRU5BTUUpfVxcblxcbmBcclxuICAgICAgICAgICAgICArICdmaWxlIC0gcGxlYXNlIGZpeCB0aGlzIG1hbnVhbGx5IGJlZm9yZSBhdHRlbXB0aW5nIHRvIHJlLWluc3RhbGwgdGhlIG1vZCcpO1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0R1cGxpY2F0ZSBncm91cCBlbnRyaWVzIGRldGVjdGVkJywgZXJyLFxyXG4gICAgICAgICAgICAgIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hpbmdJbmRleEdyb3VwLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBOZWVkIHRvIGFkZCB0aGUgZ3JvdXAgQU5EIHRoZSB2YXIuXHJcbiAgICAgICAgICAgIGNvbnN0IHVzZXJDb25maWcgPSBnYW1lSW5kZXhGaWxlLmdldDxFbGVtZW50PignLy9Vc2VyQ29uZmlnJyk7XHJcbiAgICAgICAgICAgIHVzZXJDb25maWcuYWRkQ2hpbGQocGFyZW50R3JvdXAuY2xvbmUoKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAobWF0Y2hpbmdJbmRleEdyb3VwWzBdLmNoaWxkKDApIGFzIEVsZW1lbnQpLmFkZENoaWxkKG1vZFZhci5jbG9uZSgpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbihtZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICAgICAgICBnYW1lSW5kZXhGaWxlKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCdlcnJvcicsICdpbnB1dC54bWwgbWVyZ2UgZmFpbGVkJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmNvbnN0IFNDUklQVF9NRVJHRVJfRklMRVMgPSBbJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJ107XHJcbmZ1bmN0aW9uIHNjcmlwdE1lcmdlclRlc3QoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IG1hdGNoZXIgPSAoZmlsZSA9PiBTQ1JJUFRfTUVSR0VSX0ZJTEVTLmluY2x1ZGVzKGZpbGUpKTtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbHRlcihtYXRjaGVyKS5sZW5ndGggPiAwKSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFNDUklQVF9NRVJHRVJfRklMRVMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVyciwgZXJyTWVzc2FnZSkge1xyXG4gIGxldCBhbGxvd1JlcG9ydCA9IHRydWU7XHJcbiAgY29uc3QgdXNlckNhbmNlbGVkID0gZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQ7XHJcbiAgaWYgKHVzZXJDYW5jZWxlZCkge1xyXG4gICAgYWxsb3dSZXBvcnQgPSBmYWxzZTtcclxuICB9XHJcbiAgY29uc3QgYnVzeVJlc291cmNlID0gZXJyIGluc3RhbmNlb2YgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcjtcclxuICBpZiAoYWxsb3dSZXBvcnQgJiYgYnVzeVJlc291cmNlKSB7XHJcbiAgICBhbGxvd1JlcG9ydCA9IGVyci5hbGxvd1JlcG9ydDtcclxuICAgIGVyci5tZXNzYWdlID0gZXJyLmVycm9yTWVzc2FnZTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJNZXNzYWdlLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgcmV0dXJuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzY3JpcHRNZXJnZXJEdW1teUluc3RhbGxlcihjb250ZXh0LCBmaWxlcykge1xyXG4gIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBNb2QnLCAnSXQgbG9va3MgbGlrZSB5b3UgdHJpZWQgdG8gaW5zdGFsbCAnXHJcbiAgICArICdUaGUgV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXIsIHdoaWNoIGlzIGEgdG9vbCBhbmQgbm90IGEgbW9kIGZvciBUaGUgV2l0Y2hlciAzLlxcblxcbidcclxuICAgICsgJ1RoZSBzY3JpcHQgbWVyZ2VyIHNob3VsZFxcJ3ZlIGJlZW4gaW5zdGFsbGVkIGF1dG9tYXRpY2FsbHkgYnkgVm9ydGV4IGFzIHNvb24gYXMgeW91IGFjdGl2YXRlZCB0aGlzIGV4dGVuc2lvbi4gJ1xyXG4gICAgKyAnSWYgdGhlIGRvd25sb2FkIG9yIGluc3RhbGxhdGlvbiBoYXMgZmFpbGVkIGZvciBhbnkgcmVhc29uIC0gcGxlYXNlIGxldCB1cyBrbm93IHdoeSwgYnkgcmVwb3J0aW5nIHRoZSBlcnJvciB0aHJvdWdoICdcclxuICAgICsgJ291ciBmZWVkYmFjayBzeXN0ZW0gYW5kIG1ha2Ugc3VyZSB0byBpbmNsdWRlIHZvcnRleCBsb2dzLiBQbGVhc2Ugbm90ZTogaWYgeW91XFwndmUgaW5zdGFsbGVkICdcclxuICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyIGluIHByZXZpb3VzIHZlcnNpb25zIG9mIFZvcnRleCBhcyBhIG1vZCBhbmQgU1RJTEwgaGF2ZSBpdCBpbnN0YWxsZWQgJ1xyXG4gICAgKyAnKGl0XFwncyBwcmVzZW50IGluIHlvdXIgbW9kIGxpc3QpIC0geW91IHNob3VsZCBjb25zaWRlciB1bi1pbnN0YWxsaW5nIGl0IGZvbGxvd2VkIGJ5IGEgVm9ydGV4IHJlc3RhcnQ7ICdcclxuICAgICsgJ3RoZSBhdXRvbWF0aWMgbWVyZ2VyIGluc3RhbGxlci91cGRhdGVyIHNob3VsZCB0aGVuIGtpY2sgb2ZmIGFuZCBzZXQgdXAgdGhlIHRvb2wgZm9yIHlvdS4nLFxyXG4gICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnSW52YWxpZCBtb2QnKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnd2l0Y2hlcjMnXSwgVzNSZWR1Y2VyKTtcclxuICBsZXQgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XHJcbiAgbGV0IG1vZExpbWl0UGF0Y2hlcjogTW9kTGltaXRQYXRjaGVyO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ01vZHMnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXHJcbiAgICBzZXR1cDogdG9CbHVlKChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkpLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IHRvb2xzLFxyXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxyXG4gICAgXSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6ICcyOTIwMzAnLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogMjkyMDMwLFxyXG4gICAgICBpZ25vcmVDb25mbGljdHM6IERPX05PVF9ERVBMT1ksXHJcbiAgICAgIGlnbm9yZURlcGxveTogRE9fTk9UX0RFUExPWSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGdldERMQ1BhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBnZXRUTFBhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9O1xyXG5cclxuICBjb25zdCBpc1RXMyA9IChnYW1lSWQgPSB1bmRlZmluZWQpID0+IHtcclxuICAgIGlmIChnYW1lSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XHJcbiAgfTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjN0bCcsIDI1LCB0b0JsdWUodGVzdFN1cHBvcnRlZFRMKSwgdG9CbHVlKGluc3RhbGxUTCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzbWl4ZWQnLCAzMCwgdG9CbHVlKHRlc3RTdXBwb3J0ZWRNaXhlZCksIHRvQmx1ZShpbnN0YWxsTWl4ZWQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM2NvbnRlbnQnLCA1MCxcclxuICAgIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkQ29udGVudCksIHRvQmx1ZShpbnN0YWxsQ29udGVudCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCxcclxuICAgIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSwgdG9CbHVlKGluc3RhbGxNZW51TW9kKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2NyaXB0bWVyZ2VyZHVtbXknLCAxNSxcclxuICAgIHRvQmx1ZShzY3JpcHRNZXJnZXJUZXN0KSwgdG9CbHVlKChmaWxlcykgPT4gc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIoY29udGV4dCwgZmlsZXMpKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM3RsJywgMjUsIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0VEwpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNkbGMnLCAyNSwgaXNUVzMsIGdldERMQ1BhdGgsIHRvQmx1ZSh0ZXN0RExDKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCxcclxuICAgIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsIDYwLCBpc1RXMyxcclxuICAgIChnYW1lKSA9PiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ1RoZSBXaXRjaGVyIDMnKSxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3czbW9kbGltaXRwYXRjaGVyJywgMjUsIGlzVFczLCBnZXRUTFBhdGgsICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpLFxyXG4gICAgeyBkZXBsb3ltZW50RXNzZW50aWFsOiBmYWxzZSwgbmFtZTogJ01vZCBMaW1pdCBQYXRjaGVyIE1vZCBUeXBlJyB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1lcmdlKGNhbk1lcmdlLFxyXG4gICAgKGZpbGVQYXRoLCBtZXJnZURpcikgPT4gbWVyZ2UoZmlsZVBhdGgsIG1lcmdlRGlyLCBjb250ZXh0KSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcclxuXHJcbiAgcmVnaXN0ZXJBY3Rpb25zKHtcclxuICAgIGNvbnRleHQsXHJcbiAgICByZWZyZXNoRnVuYyxcclxuICAgIGdldFByaW9yaXR5TWFuYWdlcjogKCkgPT4gcHJpb3JpdHlNYW5hZ2VyLFxyXG4gICAgZ2V0TW9kTGltaXRQYXRjaGVyOiAoKSA9PiBtb2RMaW1pdFBhdGNoZXIsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHRbJ3JlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUnXShcclxuICAgICd3aXRjaGVyM19jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLCBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdXaXRjaGVyIDMgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJQcm9maWxlRmVhdHVyZShcclxuICAgICdsb2NhbF9tZXJnZXMnLCAnYm9vbGVhbicsICdzZXR0aW5ncycsICdQcm9maWxlIERhdGEnLFxyXG4gICAgJ1RoaXMgcHJvZmlsZSB3aWxsIHN0b3JlIGFuZCByZXN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgZGF0YSAobWVyZ2VkIHNjcmlwdHMsIGxvYWRvcmRlciwgZXRjKSB3aGVuIHN3aXRjaGluZyBwcm9maWxlcycsXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgIHJldHVybiBhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQ7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCAnY29sbGVjdGlvbiddO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXJQYWdlKHtcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIGNyZWF0ZUluZm9QYW5lbDogKHByb3BzKSA9PiB7XHJcbiAgICAgIHJlZnJlc2hGdW5jID0gcHJvcHMucmVmcmVzaDtcclxuICAgICAgcmV0dXJuIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpIGFzIGFueTtcclxuICAgIH0sXHJcbiAgICBnYW1lQXJ0VVJMOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGZpbHRlcjogKG1vZHMpID0+IG1vZHMuZmlsdGVyKG1vZCA9PiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZC50eXBlKSksXHJcbiAgICBwcmVTb3J0OiAoaXRlbXM6IGFueVtdLCBkaXJlY3Rpb246IGFueSwgdXBkYXRlVHlwZTogYW55KSA9PiB7XHJcbiAgICAgIHJldHVybiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIHByaW9yaXR5TWFuYWdlcikgYXMgYW55O1xyXG4gICAgfSxcclxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlciwgdXBkYXRlVHlwZSkgPT4ge1xyXG4gICAgICBpZiAobG9hZE9yZGVyID09PSBfUFJFVklPVVNfTE8pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChfUFJFVklPVVNfTE8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSk7XHJcbiAgICAgIH1cclxuICAgICAgX1BSRVZJT1VTX0xPID0gbG9hZE9yZGVyO1xyXG4gICAgICBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gd3JpdGVUb01vZFNldHRpbmdzKCkpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgICAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgndHczLW1vZC1saW1pdC1icmVhY2gnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ21vZC1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcclxuXHJcbiAgY29uc3QgcmV2ZXJ0TE9GaWxlID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSkge1xyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgdW5kZWZpbmVkKTtcclxuICAgICAgcmV0dXJuIGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpLnRoZW4oKG1hbnVhbGx5QWRkZWQpID0+IHtcclxuICAgICAgICBpZiAobWFudWFsbHlBZGRlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdTdHJ1Y3QgPSB7fTtcclxuICAgICAgICAgIG1hbnVhbGx5QWRkZWQuZm9yRWFjaCgobW9kLCBpZHgpID0+IHtcclxuICAgICAgICAgICAgbmV3U3RydWN0W21vZF0gPSB7XHJcbiAgICAgICAgICAgICAgRW5hYmxlZDogMSxcclxuICAgICAgICAgICAgICBQcmlvcml0eTogKChsb2FkT3JkZXIgIT09IHVuZGVmaW5lZCAmJiAhIWxvYWRPcmRlclttb2RdKVxyXG4gICAgICAgICAgICAgICAgPyBwYXJzZUludChsb2FkT3JkZXJbbW9kXS5wcmVmaXgsIDEwKSA6IGlkeCkgKyAxLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgX0lOSV9TVFJVQ1QgPSBuZXdTdHJ1Y3Q7XHJcbiAgICAgICAgICB3cml0ZVRvTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmVmcmVzaEZ1bmM/LigpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgICAgICAgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICAgICAgOiBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgdmFsaWRhdGVQcm9maWxlID0gKHByb2ZpbGVJZCwgc3RhdGUpID0+IHtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgaWYgKCEhYWN0aXZlUHJvZmlsZSAmJiAhIWRlcGxveVByb2ZpbGUgJiYgKGRlcGxveVByb2ZpbGUuaWQgIT09IGFjdGl2ZVByb2ZpbGUuaWQpKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhY3RpdmVQcm9maWxlO1xyXG4gIH07XHJcblxyXG4gIGxldCBwcmV2RGVwbG95bWVudCA9IFtdO1xyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBtb2RMaW1pdFBhdGNoZXIgPSBuZXcgTW9kTGltaXRQYXRjaGVyKGNvbnRleHQuYXBpKTtcclxuICAgIHByaW9yaXR5TWFuYWdlciA9IG5ldyBQcmlvcml0eU1hbmFnZXIoY29udGV4dC5hcGksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgYXN5bmMgKGdhbWVNb2RlKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIEp1c3QgaW4gY2FzZSB0aGUgc2NyaXB0IG1lcmdlciBub3RpZmljYXRpb24gaXMgc3RpbGxcclxuICAgICAgICAvLyAgcHJlc2VudC5cclxuICAgICAgICBjb250ZXh0LmFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCd3aXRjaGVyMy1tZXJnZScpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZU1vZGUpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcclxuICAgICAgICBpZiAobGFzdFByb2ZJZCAhPT0gYWN0aXZlUHJvZj8uaWQpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQsIGFjdGl2ZVByb2Y/LmlkKSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzdG9yZSBwcm9maWxlIG1lcmdlZCBmaWxlcycsIGVycik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ3dpbGwtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBtZW51TW9kLm9uV2lsbERlcGxveShjb250ZXh0LmFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHZhbGlkYXRlUHJvZmlsZShwcm9maWxlSWQsIHN0YXRlKTtcclxuICAgICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KHByZXZEZXBsb3ltZW50KSAhPT0gSlNPTi5zdHJpbmdpZnkoZGVwbG95bWVudCkpIHtcclxuICAgICAgICBwcmV2RGVwbG95bWVudCA9IGRlcGxveW1lbnQ7XHJcbiAgICAgICAgcXVlcnlTY3JpcHRNZXJnZShjb250ZXh0LCAnWW91ciBtb2RzIHN0YXRlL2xvYWQgb3JkZXIgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgdGltZSB5b3UgcmFuICdcclxuICAgICAgICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyLiBZb3UgbWF5IHdhbnQgdG8gcnVuIHRoZSBtZXJnZXIgdG9vbCBhbmQgY2hlY2sgd2hldGhlciBhbnkgbmV3IHNjcmlwdCBjb25mbGljdHMgYXJlICdcclxuICAgICAgICAgICsgJ3ByZXNlbnQsIG9yIGlmIGV4aXN0aW5nIG1lcmdlcyBoYXZlIGJlY29tZSB1bmVjZXNzYXJ5LiBQbGVhc2UgYWxzbyBub3RlIHRoYXQgYW55IGxvYWQgb3JkZXIgY2hhbmdlcyAnXHJcbiAgICAgICAgICArICdtYXkgYWZmZWN0IHRoZSBvcmRlciBpbiB3aGljaCB5b3VyIGNvbmZsaWN0aW5nIG1vZHMgYXJlIG1lYW50IHRvIGJlIG1lcmdlZCwgYW5kIG1heSByZXF1aXJlIHlvdSB0byAnXHJcbiAgICAgICAgICArICdyZW1vdmUgdGhlIGV4aXN0aW5nIG1lcmdlIGFuZCByZS1hcHBseSBpdC4nKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICBjb25zdCBkb2NGaWxlcyA9IGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXVxyXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIChmaWxlLnJlbFBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpO1xyXG4gICAgICBjb25zdCBtZW51TW9kUHJvbWlzZSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoZG9jRmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gbWVudSBtb2RzIGRlcGxveWVkIC0gcmVtb3ZlIHRoZSBtb2QuXHJcbiAgICAgICAgICByZXR1cm4gbWVudU1vZC5yZW1vdmVNb2QoY29udGV4dC5hcGksIGFjdGl2ZVByb2ZpbGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gbWVudU1vZC5vbkRpZERlcGxveShjb250ZXh0LmFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgICAgICAgLnRoZW4oYXN5bmMgbW9kSWQgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChtb2RJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQoYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHRydWUpKTtcclxuICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgbW9kSWQpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIG1lbnVNb2RQcm9taXNlKClcclxuICAgICAgICAudGhlbigoKSA9PiBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHdyaXRlVG9Nb2RTZXR0aW5ncygpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJlZnJlc2hGdW5jPy4oKTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3Byb2ZpbGUtd2lsbC1jaGFuZ2UnLCBhc3luYyAobmV3UHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbmV3UHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcblxyXG4gICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgcHJvZmlsZS5nYW1lSWQpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiByZXN0b3JlRnJvbVByb2ZpbGUoY29udGV4dCwgcHJvZmlsZS5pZCkpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzdG9yZSBwcm9maWxlIHNwZWNpZmljIG1lcmdlZCBpdGVtcycsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCAocHJldiwgY3VycmVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgcHJpb3JpdHlNYW5hZ2VyLnByaW9yaXR5VHlwZSA9IHByaW9yaXR5VHlwZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcclxuICAgICAgcmV2ZXJ0TE9GaWxlKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW4sXHJcbn07XHJcbiJdfQ==