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
            const filterFunc = (modName) => {
                if (!modName || typeof (modName) !== 'string') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQXlDO0FBQ3pDLGdEQUF3QjtBQUN4QixrREFBMEI7QUFDMUIsb0RBQXNDO0FBQ3RDLDJDQUFrRjtBQUNsRiw0REFBOEM7QUFDOUMsc0VBQXFDO0FBRXJDLDZDQUEwQztBQUUxQyxtQ0FBcUQ7QUFFckQsMkRBQXFGO0FBRXJGLHNGQUE4RDtBQUU5RCx3REFBZ0M7QUFDaEMsaURBQTJGO0FBRTNGLHFDQUlrQjtBQUVsQixtQ0FBNkM7QUFFN0MsbURBQWtEO0FBRWxELHFEQUFtRDtBQUNuRCx1REFBb0Q7QUFFcEQsNkNBQWdFO0FBQ2hFLCtDQUFtRTtBQUVuRSxtRUFBNEQ7QUFFNUQsdUNBQTRDO0FBQzVDLHlDQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMxQixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFFN0IsTUFBTSxzQkFBc0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBRWhHLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUNyQixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFFdEIsTUFBTSxLQUFLLEdBQUc7SUFDWjtRQUNFLEVBQUUsRUFBRSx5QkFBZ0I7UUFDcEIsSUFBSSxFQUFFLGtCQUFrQjtRQUN4QixJQUFJLEVBQUUseUJBQXlCO1FBQy9CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx5QkFBeUI7UUFDM0MsYUFBYSxFQUFFO1lBQ2IseUJBQXlCO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsU0FB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QUFJLENBQUEsYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFFLE1BQU0sTUFBSyxnQkFBTyxJQUFJLGVBQWUsS0FBSyxTQUFTLEVBQUU7Z0JBQ3RFLE9BQU87YUFDUjtZQUVELE1BQU0sWUFBWSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFBLDhCQUFxQixHQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEYsZUFBZSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN2QyxZQUFZLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCwgeyBhbGwgfSBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIEluaVBhcnNlciBmcm9tICd2b3J0ZXgtcGFyc2UtaW5pJztcclxuaW1wb3J0IHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5cclxuaW1wb3J0IHsgbWlncmF0ZTE0OCB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xyXG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCBtZW51TW9kIGZyb20gJy4vbWVudW1vZCc7XHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyLCBnZXRTY3JpcHRNZXJnZXJEaXIsIHNldE1lcmdlckNvbmZpZyB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IERPX05PVF9ERVBMT1ksIERPX05PVF9ESVNQTEFZLFxyXG4gIEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBnZXRQcmlvcml0eVR5cGVCcmFuY2gsIEkxOE5fTkFNRVNQQUNFLFxyXG4gIElOUFVUX1hNTF9GSUxFTkFNRSwgTE9DS0VEX1BSRUZJWCwgUEFSVF9TVUZGSVgsIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IsXHJcbiAgU0NSSVBUX01FUkdFUl9JRCwgVU5JX1BBVENILFxyXG59IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IHRlc3RNb2RMaW1pdEJyZWFjaCB9IGZyb20gJy4vdGVzdHMnO1xyXG5cclxuaW1wb3J0IHsgTW9kTGltaXRQYXRjaGVyIH0gZnJvbSAnLi9tb2RMaW1pdFBhdGNoJztcclxuXHJcbmltcG9ydCB7IHJlZ2lzdGVyQWN0aW9ucyB9IGZyb20gJy4vaWNvbmJhckFjdGlvbnMnO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcblxyXG5pbXBvcnQgeyBpbnN0YWxsTWl4ZWQsIHRlc3RTdXBwb3J0ZWRNaXhlZCB9IGZyb20gJy4vaW5zdGFsbGVycyc7XHJcbmltcG9ydCB7IHJlc3RvcmVGcm9tUHJvZmlsZSwgc3RvcmVUb1Byb2ZpbGUgfSBmcm9tICcuL21lcmdlQmFja3VwJztcclxuXHJcbmltcG9ydCB7IGdldE1lcmdlZE1vZE5hbWVzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xyXG5cclxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHsgVzNSZWR1Y2VyIH0gZnJvbSAnLi9yZWR1Y2Vycyc7XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTIwNzY2NDY2Myc7XHJcbmNvbnN0IEdPR19JRF9HT1RZID0gJzE0OTUxMzQzMjAnO1xyXG5jb25zdCBTVEVBTV9JRCA9ICc0OTk0NTAnO1xyXG5jb25zdCBTVEVBTV9JRF9XSCA9ICcyOTIwMzAnO1xyXG5cclxuY29uc3QgQ09ORklHX01BVFJJWF9SRUxfUEFUSCA9IHBhdGguam9pbignYmluJywgJ2NvbmZpZycsICdyNGdhbWUnLCAndXNlcl9jb25maWdfbWF0cml4JywgJ3BjJyk7XHJcblxyXG5sZXQgX0lOSV9TVFJVQ1QgPSB7fTtcclxubGV0IF9QUkVWSU9VU19MTyA9IHt9O1xyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAge1xyXG4gICAgaWQ6IFNDUklQVF9NRVJHRVJfSUQsXHJcbiAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXHJcbiAgICBsb2dvOiAnV2l0Y2hlclNjcmlwdE1lcmdlci5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlVG9Nb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKVxyXG4gICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgLnRoZW4oaW5pID0+IHtcclxuICAgICAgcmV0dXJuIEJsdWViaXJkLmVhY2goT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLCAoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYgKF9JTklfU1RSVUNUPy5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgdXNlciB0byBydW4gbXVsdGlwbGUgb3BlcmF0aW9ucyBhdCBvbmNlLFxyXG4gICAgICAgICAgLy8gIGNhdXNpbmcgdGhlIHN0YXRpYyBpbmkgc3RydWN0dXJlIHRvIGJlIG1vZGlmaWVkXHJcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXHJcbiAgICAgICAgICAvLyAgbW9kaWZ5aW5nIHRoZSBsb2FkIG9yZGVyIHdoaWxlIGRlcGxveWluZy4gVGhpcyBzaG91bGRcclxuICAgICAgICAgIC8vICBtYWtlIHN1cmUgd2UgZG9uJ3QgYXR0ZW1wdCB0byB3cml0ZSBhbnkgaW52YWxpZCBtb2QgZW50cmllcy5cclxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcclxuICAgICAgICAgIEVuYWJsZWQ6IF9JTklfU1RSVUNUW2tleV0uRW5hYmxlZCxcclxuICAgICAgICAgIFByaW9yaXR5OiBfSU5JX1NUUlVDVFtrZXldLlByaW9yaXR5LFxyXG4gICAgICAgICAgVks6IF9JTklfU1RSVUNUW2tleV0uVkssXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHBhcnNlci53cml0ZShmaWxlUGF0aCwgaW5pKSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxyXG4gICAgICA/IFByb21pc2UucmVqZWN0KG5ldyBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yKGVyci5wYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTW9kU2V0dGluZ3MoKSB7XHJcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAvLyAgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChlaXRoZXIgYnkgdXMgb3IgdGhlIGdhbWUpIGJ1dFxyXG4gIC8vICBqdXN0IGluIGNhc2UgaXQgZ290IHJlbW92ZWQgc29tZWhvdywgd2UgcmUtaW5zdGF0ZSBpdFxyXG4gIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxufVxyXG5cclxuLy8gQXR0ZW1wdHMgdG8gcGFyc2UgYW5kIHJldHVybiBkYXRhIGZvdW5kIGluc2lkZVxyXG4vLyAgdGhlIG1vZHMuc2V0dGluZ3MgZmlsZSBpZiBmb3VuZCAtIG90aGVyd2lzZSB0aGlzXHJcbi8vICB3aWxsIGVuc3VyZSB0aGUgZmlsZSBpcyBwcmVzZW50LlxyXG5mdW5jdGlvbiBlbnN1cmVNb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXHJcbiAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gY3JlYXRlTW9kU2V0dGluZ3MoKS50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCkge1xyXG4gIHJldHVybiBlbnN1cmVNb2RTZXR0aW5ncygpLnRoZW4oaW5pID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICAgIGNvbnN0IGluaUVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSk7XHJcbiAgICBjb25zdCBtYW51YWxDYW5kaWRhdGVzID0gW10uY29uY2F0KGluaUVudHJpZXMsIFtVTklfUEFUQ0hdKS5maWx0ZXIoZW50cnkgPT4ge1xyXG4gICAgICBjb25zdCBoYXNWb3J0ZXhLZXkgPSB1dGlsLmdldFNhZmUoaW5pLmRhdGFbZW50cnldLCBbJ1ZLJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgcmV0dXJuICgoIWhhc1ZvcnRleEtleSkgfHwgKGluaS5kYXRhW2VudHJ5XS5WSyA9PT0gZW50cnkpICYmICFtb2RLZXlzLmluY2x1ZGVzKGVudHJ5KSk7XHJcbiAgICB9KSB8fCBbVU5JX1BBVENIXTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFNldChtYW51YWxDYW5kaWRhdGVzKSk7XHJcbiAgfSlcclxuICAudGhlbih1bmlxdWVDYW5kaWRhdGVzID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gSG93L3doeSBhcmUgd2UgZXZlbiBoZXJlID9cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCEnKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoQXJyYXkuZnJvbSh1bmlxdWVDYW5kaWRhdGVzKSwgKGFjY3VtLCBtb2QpID0+IHtcclxuICAgICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpO1xyXG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RGb2xkZXIpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAvLyBPaywgd2Uga25vdyB0aGUgZm9sZGVyIGlzIHRoZXJlIC0gbGV0cyBlbnN1cmUgdGhhdFxyXG4gICAgICAgICAgLy8gIGl0IGFjdHVhbGx5IGNvbnRhaW5zIGZpbGVzLlxyXG4gICAgICAgICAgbGV0IGNhbmRpZGF0ZXMgPSBbXTtcclxuICAgICAgICAgIGF3YWl0IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQocGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpLCBlbnRyaWVzID0+IHtcclxuICAgICAgICAgICAgY2FuZGlkYXRlcyA9IFtdLmNvbmNhdChjYW5kaWRhdGVzLCBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAoIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAocGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKSAhPT0gJycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChlbnRyeT8ubGlua0NvdW50ID09PSB1bmRlZmluZWQgfHwgZW50cnkubGlua0NvdW50IDw9IDEpKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAoWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xKVxyXG4gICAgICAgICAgICA/IG51bGwgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICAgICAgICAgIGNvbnN0IG1hcHBlZCA9IGF3YWl0IEJsdWViaXJkLm1hcChjYW5kaWRhdGVzLCBjYW5kID0+XHJcbiAgICAgICAgICAgIGZzLnN0YXRBc3luYyhjYW5kLmZpbGVQYXRoKVxyXG4gICAgICAgICAgICAgIC50aGVuKHN0YXRzID0+IHN0YXRzLmlzU3ltYm9saWNMaW5rKClcclxuICAgICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKGNhbmQuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpKTtcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKG1hcHBlZCk7XHJcbiAgICAgICAgfSkpXHJcbiAgICAgICAgLnRoZW4oKGZpbGVzOiBzdHJpbmdbXSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUgIT09IHVuZGVmaW5lZCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKG1vZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpICYmIChlcnIucGF0aCA9PT0gbW9kRm9sZGVyKSlcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH0sIFtdKTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgLy8gVXNlckNhbmNlbGVkIHdvdWxkIHN1Z2dlc3Qgd2Ugd2VyZSB1bmFibGUgdG8gc3RhdCB0aGUgVzMgbW9kIGZvbGRlclxyXG4gICAgLy8gIHByb2JhYmx5IGR1ZSB0byBhIHBlcm1pc3Npb25pbmcgaXNzdWUgKEVOT0VOVCBpcyBoYW5kbGVkIGFib3ZlKVxyXG4gICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcclxuICAgIGNvbnN0IHByb2Nlc3NDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCk7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICghdXNlckNhbmNlbGVkICYmICFwcm9jZXNzQ2FuY2VsZWQpO1xyXG4gICAgY29uc3QgZGV0YWlscyA9IHVzZXJDYW5jZWxlZFxyXG4gICAgICA/ICdWb3J0ZXggdHJpZWQgdG8gc2NhbiB5b3VyIFczIG1vZHMgZm9sZGVyIGZvciBtYW51YWxseSBhZGRlZCBtb2RzIGJ1dCAnXHJcbiAgICAgICAgKyAnd2FzIGJsb2NrZWQgYnkgeW91ciBPUy9BViAtIHBsZWFzZSBtYWtlIHN1cmUgdG8gZml4IHRoaXMgYmVmb3JlIHlvdSAnXHJcbiAgICAgICAgKyAncHJvY2VlZCB0byBtb2QgVzMgYXMgeW91ciBtb2RkaW5nIGV4cGVyaWVuY2Ugd2lsbCBiZSBzZXZlcmVseSBhZmZlY3RlZC4nXHJcbiAgICAgIDogZXJyO1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbG9va3VwIG1hbnVhbGx5IGFkZGVkIG1vZHMnLFxyXG4gICAgICBkZXRhaWxzLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShcclxuICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXHJcbiAgICAgICdTb2Z0d2FyZVxcXFxDRCBQcm9qZWN0IFJlZFxcXFxUaGUgV2l0Y2hlciAzJyxcclxuICAgICAgJ0luc3RhbGxGb2xkZXInKTtcclxuICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcclxuICAgIH1cclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGluc3RQYXRoLnZhbHVlIGFzIHN0cmluZyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRF9HT1RZLCBHT0dfSUQsIFNURUFNX0lELCBTVEVBTV9JRF9XSF0pXHJcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkVEwoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09ICd3aXRjaGVyMycpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICAgIGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpICE9PSAtMSkgIT09IHVuZGVmaW5lZCk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFRMKGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIGxldCBwcmVmaXggPSBmaWxlcy5yZWR1Y2UoKHByZXYsIGZpbGUpID0+IHtcclxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgY29uc3QgaWR4ID0gY29tcG9uZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICBpZiAoKGlkeCA+IDApICYmICgocHJldiA9PT0gdW5kZWZpbmVkKSB8fCAoaWR4IDwgcHJldi5sZW5ndGgpKSkge1xyXG4gICAgICByZXR1cm4gY29tcG9uZW50cy5zbGljZSgwLCBpZHgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9XHJcbiAgfSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgcHJlZml4ID0gKHByZWZpeCA9PT0gdW5kZWZpbmVkKSA/ICcnIDogcHJlZml4LmpvaW4ocGF0aC5zZXApICsgcGF0aC5zZXA7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbGVzXHJcbiAgICAuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApICYmIGZpbGUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKHByZWZpeCkpXHJcbiAgICAubWFwKGZpbGUgPT4gKHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnNsaWNlKHByZWZpeC5sZW5ndGgpLFxyXG4gICAgfSkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2NvbnRlbnQnICsgcGF0aC5zZXApICE9PSB1bmRlZmluZWQpKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsQ29udGVudChmaWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGUpIHtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbGVzXHJcbiAgICAuZmlsdGVyKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2NvbnRlbnQnICsgcGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHtcclxuICAgICAgY29uc3QgZmlsZUJhc2UgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5zbGljZSgxKS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oJ21vZCcgKyBkZXN0aW5hdGlvblBhdGgsIGZpbGVCYXNlKSxcclxuICAgICAgfTtcclxuICB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxNZW51TW9kKGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIC8vIElucHV0IHNwZWNpZmljIGZpbGVzIG5lZWQgdG8gYmUgaW5zdGFsbGVkIG91dHNpZGUgdGhlIG1vZHMgZm9sZGVyIHdoaWxlXHJcbiAgLy8gIGFsbCBvdGhlciBtb2QgZmlsZXMgYXJlIHRvIGJlIGluc3RhbGxlZCBhcyB1c3VhbC5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGZpbGUpKSAhPT0gJycpO1xyXG4gIGNvbnN0IGlucHV0RmlsZXMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBmaWxlLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKTtcclxuICBjb25zdCB1bmlxdWVJbnB1dCA9IGlucHV0RmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgLy8gU29tZSBtb2RzIHRlbmQgdG8gaW5jbHVkZSBhIGJhY2t1cCBmaWxlIG1lYW50IGZvciB0aGUgdXNlciB0byByZXN0b3JlXHJcbiAgICAvLyAgaGlzIGdhbWUgdG8gdmFuaWxsYSAob2J2cyB3ZSBvbmx5IHdhbnQgdG8gYXBwbHkgdGhlIG5vbi1iYWNrdXApLlxyXG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGl0ZXIpO1xyXG5cclxuICAgIGlmIChhY2N1bS5maW5kKGVudHJ5ID0+IHBhdGguYmFzZW5hbWUoZW50cnkpID09PSBmaWxlTmFtZSkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBUaGlzIGNvbmZpZyBmaWxlIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhlIGFjY3VtdWxhdG9yLlxyXG4gICAgICAvLyAgSWdub3JlIHRoaXMgaW5zdGFuY2UuXHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbnN0YW5jZXMgPSBpbnB1dEZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IGZpbGVOYW1lKTtcclxuICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAvLyBXZSBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBtZW51IGNvbmZpZyBmaWxlIC0gbW9kIGF1dGhvciBwcm9iYWJseSBpbmNsdWRlZFxyXG4gICAgICAvLyAgYSBiYWNrdXAgZmlsZSB0byByZXN0b3JlIHZhbmlsbGEgc3RhdGUsIG9yIHBlcmhhcHMgdGhpcyBpcyBhIHZhcmlhbnQgbW9kIHdoaWNoIHdlXHJcbiAgICAgIC8vICBjYW4ndCBjdXJyZW50bHkgc3VwcG9ydC5cclxuICAgICAgLy8gSXQncyBkaWZmaWN1bHQgZm9yIHVzIHRvIGNvcnJlY3RseSBpZGVudGlmeSB0aGUgY29ycmVjdCBmaWxlIGJ1dCB3ZSdyZSBnb2luZyB0b1xyXG4gICAgICAvLyAgdHJ5IGFuZCBndWVzcyBiYXNlZCBvbiB3aGV0aGVyIHRoZSBjb25maWcgZmlsZSBoYXMgYSBcImJhY2t1cFwiIGZvbGRlciBzZWdtZW50XHJcbiAgICAgIC8vICBvdGhlcndpc2Ugd2UganVzdCBhZGQgdGhlIGZpcnN0IGZpbGUgaW5zdGFuY2UgKEknbSBnb2luZyB0byByZWdyZXQgYWRkaW5nIHRoaXMgYXJlbid0IEkgPylcclxuICAgICAgaWYgKGl0ZXIudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdiYWNrdXAnKSA9PT0gLTEpIHtcclxuICAgICAgICAvLyBXZSdyZSBnb2luZyB0byBhc3N1bWUgdGhhdCB0aGlzIGlzIHRoZSByaWdodCBmaWxlLlxyXG4gICAgICAgIGFjY3VtLnB1c2goaXRlcik7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFRoaXMgaXMgYSB1bmlxdWUgbWVudSBjb25maWd1cmF0aW9uIGZpbGUgLSBhZGQgaXQuXHJcbiAgICAgIGFjY3VtLnB1c2goaXRlcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgW10pO1xyXG5cclxuICBsZXQgb3RoZXJGaWxlcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+ICFpbnB1dEZpbGVzLmluY2x1ZGVzKGZpbGUpKTtcclxuICBjb25zdCBpbnB1dEZpbGVEZXN0aW5hdGlvbiA9IENPTkZJR19NQVRSSVhfUkVMX1BBVEg7XHJcblxyXG4gIC8vIEdldCB0aGUgbW9kJ3Mgcm9vdCBmb2xkZXIuXHJcbiAgY29uc3QgYmluSWR4ID0gdW5pcXVlSW5wdXRbMF0uc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpO1xyXG5cclxuICAvLyBSZWZlcnMgdG8gZmlsZXMgbG9jYXRlZCBpbnNpZGUgdGhlIGFyY2hpdmUncyAnTW9kcycgZGlyZWN0b3J5LlxyXG4gIC8vICBUaGlzIGFycmF5IGNhbiB2ZXJ5IHdlbGwgYmUgZW1wdHkgaWYgYSBtb2RzIGZvbGRlciBkb2Vzbid0IGV4aXN0XHJcbiAgY29uc3QgbW9kRmlsZXMgPSBvdGhlckZpbGVzLmZpbHRlcihmaWxlID0+XHJcbiAgICBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluY2x1ZGVzKCdtb2RzJykpO1xyXG5cclxuICBjb25zdCBtb2RzSWR4ID0gKG1vZEZpbGVzLmxlbmd0aCA+IDApXHJcbiAgICA/IG1vZEZpbGVzWzBdLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ21vZHMnKVxyXG4gICAgOiAtMTtcclxuICBjb25zdCBtb2ROYW1lcyA9IChtb2RzSWR4ICE9PSAtMSlcclxuICAgID8gbW9kRmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgICBjb25zdCBtb2ROYW1lID0gaXRlci5zcGxpdChwYXRoLnNlcCkuc3BsaWNlKG1vZHNJZHggKyAxLCAxKS5qb2luKCk7XHJcbiAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobW9kTmFtZSkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKG1vZE5hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKVxyXG4gICAgOiBbXTtcclxuICAvLyBUaGUgcHJlc2VuY2Ugb2YgYSBtb2RzIGZvbGRlciBpbmRpY2F0ZXMgdGhhdCB0aGlzIG1vZCBtYXkgcHJvdmlkZVxyXG4gIC8vICBzZXZlcmFsIG1vZCBlbnRyaWVzLlxyXG4gIGlmIChtb2RGaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICBvdGhlckZpbGVzID0gb3RoZXJGaWxlcy5maWx0ZXIoZmlsZSA9PiAhbW9kRmlsZXMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIH1cclxuXHJcbiAgLy8gV2UncmUgaG9waW5nIHRoYXQgdGhlIG1vZCBhdXRob3IgaGFzIGluY2x1ZGVkIHRoZSBtb2QgbmFtZSBpbiB0aGUgYXJjaGl2ZSdzXHJcbiAgLy8gIHN0cnVjdHVyZSAtIGlmIGhlIGRpZG4ndCAtIHdlJ3JlIGdvaW5nIHRvIHVzZSB0aGUgZGVzdGluYXRpb24gcGF0aCBpbnN0ZWFkLlxyXG4gIGNvbnN0IG1vZE5hbWUgPSAoYmluSWR4ID4gMClcclxuICAgID8gaW5wdXRGaWxlc1swXS5zcGxpdChwYXRoLnNlcClbYmluSWR4IC0gMV1cclxuICAgIDogKCdtb2QnICsgcGF0aC5iYXNlbmFtZShkZXN0aW5hdGlvblBhdGgsICcuaW5zdGFsbGluZycpKS5yZXBsYWNlKC9cXHMvZywgJycpO1xyXG5cclxuICBjb25zdCB0cmltbWVkRmlsZXMgPSBvdGhlckZpbGVzLm1hcChmaWxlID0+IHtcclxuICAgIGNvbnN0IHNvdXJjZSA9IGZpbGU7XHJcbiAgICBsZXQgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoYmluSWR4KTtcclxuICAgIGlmIChyZWxQYXRoWzBdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gVGhpcyBmaWxlIG11c3QndmUgYmVlbiBpbnNpZGUgdGhlIHJvb3Qgb2YgdGhlIGFyY2hpdmU7XHJcbiAgICAgIC8vICBkZXBsb3kgYXMgaXMuXHJcbiAgICAgIHJlbFBhdGggPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmaXJzdFNlZyA9IHJlbFBhdGhbMF0udG9Mb3dlckNhc2UoKTtcclxuICAgIGlmIChmaXJzdFNlZyA9PT0gJ2NvbnRlbnQnIHx8IGZpcnN0U2VnLmVuZHNXaXRoKFBBUlRfU1VGRklYKSkge1xyXG4gICAgICByZWxQYXRoID0gW10uY29uY2F0KFsnTW9kcycsIG1vZE5hbWVdLCByZWxQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzb3VyY2UsXHJcbiAgICAgIHJlbFBhdGg6IHJlbFBhdGguam9pbihwYXRoLnNlcCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCB0b0NvcHlJbnN0cnVjdGlvbiA9IChzb3VyY2UsIGRlc3RpbmF0aW9uKSA9PiAoe1xyXG4gICAgdHlwZTogJ2NvcHknLFxyXG4gICAgc291cmNlLFxyXG4gICAgZGVzdGluYXRpb24sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGlucHV0SW5zdHJ1Y3Rpb25zID0gdW5pcXVlSW5wdXQubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUsIHBhdGguam9pbihpbnB1dEZpbGVEZXN0aW5hdGlvbiwgcGF0aC5iYXNlbmFtZShmaWxlKSkpKTtcclxuXHJcbiAgY29uc3Qgb3RoZXJJbnN0cnVjdGlvbnMgPSB0cmltbWVkRmlsZXMubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUuc291cmNlLCBmaWxlLnJlbFBhdGgpKTtcclxuXHJcbiAgY29uc3QgbW9kRmlsZUluc3RydWN0aW9ucyA9IG1vZEZpbGVzLm1hcChmaWxlID0+XHJcbiAgICB0b0NvcHlJbnN0cnVjdGlvbihmaWxlLCBmaWxlKSk7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChpbnB1dEluc3RydWN0aW9ucywgb3RoZXJJbnN0cnVjdGlvbnMsIG1vZEZpbGVJbnN0cnVjdGlvbnMpO1xyXG4gIGlmIChtb2ROYW1lcy5sZW5ndGggPiAwKSB7XHJcbiAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICBrZXk6ICdtb2RDb21wb25lbnRzJyxcclxuICAgICAgdmFsdWU6IG1vZE5hbWVzLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RNZW51TW9kUm9vdChpbnN0cnVjdGlvbnM6IGFueVtdLCBnYW1lSWQ6IHN0cmluZyk6XHJcbiAgUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0IHwgYm9vbGVhbj4ge1xyXG4gIGNvbnN0IHByZWRpY2F0ZSA9IChpbnN0cikgPT4gKCEhZ2FtZUlkKVxyXG4gICAgPyAoKEdBTUVfSUQgPT09IGdhbWVJZCkgJiYgKGluc3RyLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKSlcclxuICAgIDogKChpbnN0ci50eXBlID09PSAnY29weScpICYmIChpbnN0ci5kZXN0aW5hdGlvbi5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSkpO1xyXG5cclxuICByZXR1cm4gKCEhZ2FtZUlkKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgIHN1cHBvcnRlZDogaW5zdHJ1Y3Rpb25zLmZpbmQocHJlZGljYXRlKSAhPT0gdW5kZWZpbmVkLFxyXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gICAgICB9KVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUoaW5zdHJ1Y3Rpb25zLmZpbmQocHJlZGljYXRlKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFRMKGluc3RydWN0aW9ucykge1xyXG4gIGNvbnN0IG1lbnVNb2RGaWxlcyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gISFpbnN0ci5kZXN0aW5hdGlvblxyXG4gICAgJiYgaW5zdHIuZGVzdGluYXRpb24uaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpO1xyXG4gIGlmIChtZW51TW9kRmlsZXMubGVuZ3RoID4gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxyXG4gICAgaW5zdHJ1Y3Rpb24gPT4gISFpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbiAmJiBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ21vZHMnICsgcGF0aC5zZXApLFxyXG4gICkgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RETEMoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChcclxuICAgIGluc3RydWN0aW9uID0+ICEhaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24gJiYgaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdkbGMnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpIHtcclxuICBjb25zdCBub3RpZklkID0gJ21pc3Npbmctc2NyaXB0LW1lcmdlcic7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6IG5vdGlmSWQsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdXaXRjaGVyIDMgc2NyaXB0IG1lcmdlciBpcyBtaXNzaW5nL21pc2NvbmZpZ3VyZWQnLFxyXG4gICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXInLCB7XHJcbiAgICAgICAgICAgIGJiY29kZTogYXBpLnRyYW5zbGF0ZSgnVm9ydGV4IGlzIHVuYWJsZSB0byByZXNvbHZlIHRoZSBTY3JpcHQgTWVyZ2VyXFwncyBsb2NhdGlvbi4gVGhlIHRvb2wgbmVlZHMgdG8gYmUgZG93bmxvYWRlZCBhbmQgY29uZmlndXJlZCBtYW51YWxseS4gJ1xyXG4gICAgICAgICAgICAgICsgJ1t1cmw9aHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL1Rvb2xfU2V0dXA6X1dpdGNoZXJfM19TY3JpcHRfTWVyZ2VyXUZpbmQgb3V0IG1vcmUgYWJvdXQgaG93IHRvIGNvbmZpZ3VyZSBpdCBhcyBhIHRvb2wgZm9yIHVzZSBpbiBWb3J0ZXguWy91cmxdW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICAgICAgICsgJ05vdGU6IFdoaWxlIHNjcmlwdCBtZXJnaW5nIHdvcmtzIHdlbGwgd2l0aCB0aGUgdmFzdCBtYWpvcml0eSBvZiBtb2RzLCB0aGVyZSBpcyBubyBndWFyYW50ZWUgZm9yIGEgc2F0aXNmeWluZyBvdXRjb21lIGluIGV2ZXJ5IHNpbmdsZSBjYXNlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0Rvd25sb2FkIFNjcmlwdCBNZXJnZXInLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3dpdGNoZXIzL21vZHMvNDg0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJykpIH0sXHJcbiAgICAgICAgICBdKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSB7XHJcbiAgY29uc3QgZmluZFNjcmlwdE1lcmdlciA9IGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBzY3JpcHQgbWVyZ2VyJywgZXJyb3IpO1xyXG4gICAgY29uc3Qgc2NyaXB0TWVyZ2VyUGF0aCA9IGF3YWl0IGdldFNjcmlwdE1lcmdlckRpcihjb250ZXh0KTtcclxuICAgIGlmIChzY3JpcHRNZXJnZXJQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHNldE1lcmdlckNvbmZpZyhkaXNjb3ZlcnkucGF0aCwgc2NyaXB0TWVyZ2VyUGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBlbnN1cmVQYXRoID0gKGRpcnBhdGgpID0+XHJcbiAgICBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKGRpcnBhdGgpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRUVYSVNUJylcclxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKSxcclxuICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJykpLFxyXG4gICAgZW5zdXJlUGF0aChwYXRoLmRpcm5hbWUoZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKSkpXSlcclxuICAgICAgLnRoZW4oKCkgPT4gZG93bmxvYWRTY3JpcHRNZXJnZXIoY29udGV4dClcclxuICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogZmluZFNjcmlwdE1lcmdlcihlcnIpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFNjcmlwdE1lcmdlclRvb2woYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXI/LnBhdGgpIHtcclxuICAgIHJldHVybiBzY3JpcHRNZXJnZXI7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5TY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3QgdG9vbCA9IGdldFNjcmlwdE1lcmdlclRvb2woYXBpKTtcclxuICBpZiAodG9vbD8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXBpLnJ1bkV4ZWN1dGFibGUodG9vbC5wYXRoLCBbXSwgeyBzdWdnZXN0RGVwbG95OiB0cnVlIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBydW4gdG9vbCcsIGVycixcclxuICAgICAgeyBhbGxvd1JlcG9ydDogWydFUEVSTScsICdFQUNDRVNTJywgJ0VOT0VOVCddLmluZGV4T2YoZXJyLmNvZGUpICE9PSAtMSB9KSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEFsbE1vZHMoY29udGV4dCkge1xyXG4gIC8vIE1vZCB0eXBlcyB3ZSBkb24ndCB3YW50IHRvIGRpc3BsYXkgaW4gdGhlIExPIHBhZ2VcclxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgbWVyZ2VkOiBbXSxcclxuICAgICAgbWFudWFsOiBbXSxcclxuICAgICAgbWFuYWdlZDogW10sXHJcbiAgICB9KTtcclxuICB9XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG5cclxuICAvLyBPbmx5IHNlbGVjdCBtb2RzIHdoaWNoIGFyZSBlbmFibGVkLCBhbmQgYXJlIG5vdCBhIG1lbnUgbW9kLlxyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpLmZpbHRlcihrZXkgPT5cclxuICAgICghIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpKTtcclxuXHJcbiAgY29uc3QgbWVyZ2VkTW9kTmFtZXMgPSBhd2FpdCBnZXRNZXJnZWRNb2ROYW1lcyhjb250ZXh0KTtcclxuICBjb25zdCBtYW51YWxseUFkZGVkTW9kcyA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbmFnZWRNb2RzID0gYXdhaXQgZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQsIGVuYWJsZWRNb2RzLm1hcChrZXkgPT4gbW9kc1trZXldKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBtZXJnZWQ6IG1lcmdlZE1vZE5hbWVzLFxyXG4gICAgbWFudWFsOiBtYW51YWxseUFkZGVkTW9kcy5maWx0ZXIobW9kID0+ICFtZXJnZWRNb2ROYW1lcy5pbmNsdWRlcyhtb2QpKSxcclxuICAgIG1hbmFnZWQ6IG1hbmFnZWRNb2RzLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpIHtcclxuICByZXR1cm4gZ2V0QWxsTW9kcyhjb250ZXh0KS50aGVuKG1vZE1hcCA9PiB7XHJcbiAgICBfSU5JX1NUUlVDVCA9IHt9O1xyXG4gICAgY29uc3QgbW9kcyA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtb2RNYXAubWFuYWdlZCwgbW9kTWFwLm1hbnVhbCk7XHJcbiAgICBjb25zdCBmaWx0ZXJGdW5jID0gKG1vZE5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAvLyBXZSdyZSBhZGRpbmcgdGhpcyB0byBhdm9pZCBoYXZpbmcgdGhlIGxvYWQgb3JkZXIgcGFnZVxyXG4gICAgICAvLyAgZnJvbSBub3QgbG9hZGluZyBpZiB3ZSBlbmNvdW50ZXIgYW4gaW52YWxpZCBtb2QgbmFtZS5cclxuICAgICAgaWYgKCFtb2ROYW1lIHx8IHR5cGVvZihtb2ROYW1lKSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBsb2coJ2RlYnVnJywgJ2VuY291bnRlcmVkIGludmFsaWQgbW9kIGluc3RhbmNlL25hbWUnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKGZpbHRlckZ1bmMpO1xyXG4gICAgY29uc3QgbWFuYWdlZExvY2tlZCA9IG1vZE1hcC5tYW5hZ2VkXHJcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gZmlsdGVyRnVuYyhlbnRyeS5uYW1lKSlcclxuICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKTtcclxuICAgIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCwgbWFuYWdlZExvY2tlZCk7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChtb2RzLCAobW9kLCBpZHgpID0+IHtcclxuICAgICAgbGV0IG5hbWU7XHJcbiAgICAgIGxldCBrZXk7XHJcbiAgICAgIGlmICh0eXBlb2YobW9kKSA9PT0gJ29iamVjdCcgJiYgbW9kICE9PSBudWxsKSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZC5uYW1lO1xyXG4gICAgICAgIGtleSA9IG1vZC5pZDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuYW1lID0gbW9kO1xyXG4gICAgICAgIGtleSA9IG1vZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgTE9FbnRyeSA9IHV0aWwuZ2V0U2FmZShsb2FkT3JkZXIsIFtrZXldLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgcHJpb3JpdHlNYW5hZ2VyLnJlc2V0TWF4UHJpb3JpdHkodG90YWxMb2NrZWQubGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgICBfSU5JX1NUUlVDVFtuYW1lXSA9IHtcclxuICAgICAgICAvLyBUaGUgSU5JIGZpbGUncyBlbmFibGVkIGF0dHJpYnV0ZSBleHBlY3RzIDEgb3IgMFxyXG4gICAgICAgIEVuYWJsZWQ6IChMT0VudHJ5ICE9PSB1bmRlZmluZWQpID8gTE9FbnRyeS5lbmFibGVkID8gMSA6IDAgOiAxLFxyXG4gICAgICAgIFByaW9yaXR5OiB0b3RhbExvY2tlZC5pbmNsdWRlcyhuYW1lKVxyXG4gICAgICAgICAgPyB0b3RhbExvY2tlZC5pbmRleE9mKG5hbWUpXHJcbiAgICAgICAgICA6IHByaW9yaXR5TWFuYWdlci5nZXRQcmlvcml0eSh7IGlkOiBrZXkgfSksXHJcbiAgICAgICAgVks6IGtleSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5sZXQgcmVmcmVzaEZ1bmM7XHJcbi8vIGl0ZW06IElMb2FkT3JkZXJEaXNwbGF5SXRlbVxyXG5mdW5jdGlvbiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRGlzcGxheUl0ZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBtaW5Qcmlvcml0eTogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgb25TZXRQcmlvcml0eTogKGtleTogc3RyaW5nLCBwcmlvcml0eTogbnVtYmVyKSA9PiB2b2lkKSB7XHJcbiAgY29uc3QgcHJpb3JpdHlJbnB1dERpYWxvZyA9ICgpID0+IHtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoKHJlc29sdmUpID0+IHtcclxuICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmlvcml0eScsIHtcclxuICAgICAgICB0ZXh0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ0luc2VydCBuZXcgbnVtZXJpY2FsIHByaW9yaXR5IGZvciB7e2l0ZW1OYW1lfX0gaW4gdGhlIGlucHV0IGJveDonLCB7IHJlcGxhY2U6IHsgaXRlbU5hbWU6IGl0ZW0ubmFtZSB9IH0pLFxyXG4gICAgICAgIGlucHV0OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAndzNQcmlvcml0eUlucHV0JyxcclxuICAgICAgICAgICAgbGFiZWw6ICdQcmlvcml0eScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogX0lOSV9TVFJVQ1RbaXRlbS5pZF0/LlByaW9yaXR5IHx8IDAsXHJcbiAgICAgICAgICB9XSxcclxuICAgICAgfSwgWyB7IGxhYmVsOiAnQ2FuY2VsJyB9LCB7IGxhYmVsOiAnU2V0JywgZGVmYXVsdDogdHJ1ZSB9IF0pXHJcbiAgICAgIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdTZXQnKSB7XHJcbiAgICAgICAgICBjb25zdCBpdGVtS2V5ID0gT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLmZpbmQoa2V5ID0+IF9JTklfU1RSVUNUW2tleV0uVksgPT09IGl0ZW0uaWQpO1xyXG4gICAgICAgICAgY29uc3Qgd2FudGVkUHJpb3JpdHkgPSByZXN1bHQuaW5wdXRbJ3czUHJpb3JpdHlJbnB1dCddO1xyXG4gICAgICAgICAgaWYgKHdhbnRlZFByaW9yaXR5IDw9IG1pblByaW9yaXR5KSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignQ2hvc2VuIHByaW9yaXR5IGlzIGFscmVhZHkgYXNzaWduZWQgdG8gYSBsb2NrZWQgZW50cnknLFxyXG4gICAgICAgICAgICAgIHdhbnRlZFByaW9yaXR5LnRvU3RyaW5nKCksIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGl0ZW1LZXkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBfSU5JX1NUUlVDVFtpdGVtS2V5XS5Qcmlvcml0eSA9IHBhcnNlSW50KHdhbnRlZFByaW9yaXR5LCAxMCk7XHJcbiAgICAgICAgICAgIG9uU2V0UHJpb3JpdHkoaXRlbUtleSwgd2FudGVkUHJpb3JpdHkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gc2V0IHByaW9yaXR5IC0gbW9kIGlzIG5vdCBpbiBpbmkgc3RydWN0JywgeyBtb2RJZDogaXRlbS5pZCB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIGNvbnN0IGl0ZW1BY3Rpb25zID0gW1xyXG4gICAge1xyXG4gICAgICBzaG93OiBpdGVtLmxvY2tlZCAhPT0gdHJ1ZSxcclxuICAgICAgdGl0bGU6ICdTZXQgTWFudWFsIFByaW9yaXR5JyxcclxuICAgICAgYWN0aW9uOiAoKSA9PiBwcmlvcml0eUlucHV0RGlhbG9nKCksXHJcbiAgICB9LFxyXG4gIF07XHJcblxyXG4gIHJldHVybiBpdGVtQWN0aW9ucztcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBwcmlvcml0eU1hbmFnZXIpOiBQcm9taXNlPGFueVtdPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgeyBnZXRQcmlvcml0eSwgcmVzZXRNYXhQcmlvcml0eSB9ID0gcHJpb3JpdHlNYW5hZ2VyO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBXaGF0IGFuIG9kZCB1c2UgY2FzZSAtIHBlcmhhcHMgdGhlIHVzZXIgaGFkIHN3aXRjaGVkIGdhbWVNb2RlcyBvclxyXG4gICAgLy8gIGV2ZW4gZGVsZXRlZCBoaXMgcHJvZmlsZSBkdXJpbmcgdGhlIHByZS1zb3J0IGZ1bmN0aW9uYWxpdHkgP1xyXG4gICAgLy8gIE9kZCBidXQgcGxhdXNpYmxlIEkgc3VwcG9zZSA/XHJcbiAgICBsb2coJ3dhcm4nLCAnW1czXSB1bmFibGUgdG8gcHJlc29ydCBkdWUgdG8gbm8gYWN0aXZlIHByb2ZpbGUnKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gIH1cclxuXHJcbiAgbGV0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgY29uc3Qgb25TZXRQcmlvcml0eSA9IChpdGVtS2V5LCB3YW50ZWRQcmlvcml0eSkgPT4ge1xyXG4gICAgcmV0dXJuIHdyaXRlVG9Nb2RTZXR0aW5ncygpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICB3YW50ZWRQcmlvcml0eSA9ICt3YW50ZWRQcmlvcml0eTtcclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgICBjb25zdCBtb2RJZCA9IF9JTklfU1RSVUNUW2l0ZW1LZXldLlZLO1xyXG4gICAgICAgIGNvbnN0IGxvRW50cnkgPSBsb2FkT3JkZXJbbW9kSWRdO1xyXG4gICAgICAgIGlmIChwcmlvcml0eU1hbmFnZXIucHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnKSB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlckVudHJ5KFxyXG4gICAgICAgICAgICBhY3RpdmVQcm9maWxlLmlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgICAgIC4uLmxvRW50cnksXHJcbiAgICAgICAgICAgICAgcG9zOiAobG9FbnRyeS5wb3MgPCB3YW50ZWRQcmlvcml0eSkgPyB3YW50ZWRQcmlvcml0eSA6IHdhbnRlZFByaW9yaXR5IC0gMixcclxuICAgICAgICAgIH0pKTtcclxuICAgICAgICAgIGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyRW50cnkoXHJcbiAgICAgICAgICAgIGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB7XHJcbiAgICAgICAgICAgICAgLi4ubG9FbnRyeSxcclxuICAgICAgICAgICAgICBwcmVmaXg6IHBhcnNlSW50KF9JTklfU1RSVUNUW2l0ZW1LZXldLlByaW9yaXR5LCAxMCksXHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWZyZXNoRnVuYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICByZWZyZXNoRnVuYygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gIH07XHJcbiAgY29uc3QgYWxsTW9kcyA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dCk7XHJcbiAgaWYgKChhbGxNb2RzLm1lcmdlZC5sZW5ndGggPT09IDApICYmIChhbGxNb2RzLm1hbnVhbC5sZW5ndGggPT09IDApKSB7XHJcbiAgICBpdGVtcy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgICAgcmVzZXRNYXhQcmlvcml0eSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uaXRlbSxcclxuICAgICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCAwLCBvblNldFByaW9yaXR5KSxcclxuICAgICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBmaWx0ZXJGdW5jID0gKG1vZE5hbWU6IHN0cmluZykgPT4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpO1xyXG4gIGNvbnN0IGxvY2tlZE1vZHMgPSBbXS5jb25jYXQoYWxsTW9kcy5tYW51YWwuZmlsdGVyKGZpbHRlckZ1bmMpLFxyXG4gICAgYWxsTW9kcy5tYW5hZ2VkLmZpbHRlcihlbnRyeSA9PiBmaWx0ZXJGdW5jKGVudHJ5Lm5hbWUpKVxyXG4gICAgICAgICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKSk7XHJcbiAgY29uc3QgcmVhZGFibGVOYW1lcyA9IHtcclxuICAgIFtVTklfUEFUQ0hdOiAnVW5pZmljYXRpb24vQ29tbXVuaXR5IFBhdGNoJyxcclxuICB9O1xyXG5cclxuICBjb25zdCBsb2NrZWRFbnRyaWVzID0gW10uY29uY2F0KGFsbE1vZHMubWVyZ2VkLCBsb2NrZWRNb2RzKVxyXG4gICAgLnJlZHVjZSgoYWNjdW0sIG1vZE5hbWUsIGlkeCkgPT4ge1xyXG4gICAgICBjb25zdCBvYmogPSB7XHJcbiAgICAgICAgaWQ6IG1vZE5hbWUsXHJcbiAgICAgICAgbmFtZTogISFyZWFkYWJsZU5hbWVzW21vZE5hbWVdID8gcmVhZGFibGVOYW1lc1ttb2ROYW1lXSA6IG1vZE5hbWUsXHJcbiAgICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgICBsb2NrZWQ6IHRydWUsXHJcbiAgICAgICAgcHJlZml4OiBpZHggKyAxLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKCFhY2N1bS5maW5kKGFjYyA9PiBvYmouaWQgPT09IGFjYy5pZCkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKG9iaik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuXHJcbiAgaXRlbXMgPSBpdGVtcy5maWx0ZXIoaXRlbSA9PiAhYWxsTW9kcy5tZXJnZWQuaW5jbHVkZXMoaXRlbS5pZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFhbGxNb2RzLm1hbnVhbC5pbmNsdWRlcyhpdGVtLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWFsbE1vZHMubWFuYWdlZC5maW5kKG1vZCA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG1vZC5uYW1lID09PSBVTklfUEFUQ0gpICYmIChtb2QuaWQgPT09IGl0ZW0uaWQpKSlcclxuICAgICAgICAgICAgICAgLm1hcCgoaXRlbSwgaWR4KSA9PiB7XHJcbiAgICBpZiAoaWR4ID09PSAwKSB7XHJcbiAgICAgIHJlc2V0TWF4UHJpb3JpdHkobG9ja2VkRW50cmllcy5sZW5ndGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uaXRlbSxcclxuICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgbG9ja2VkRW50cmllcy5sZW5ndGgsIG9uU2V0UHJpb3JpdHkpLFxyXG4gICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgbWFudWFsRW50cmllcyA9IGFsbE1vZHMubWFudWFsXHJcbiAgICAuZmlsdGVyKGtleSA9PiBsb2NrZWRFbnRyaWVzLmZpbmQoZW50cnkgPT4gZW50cnkuaWQgPT09IGtleSkgPT09IHVuZGVmaW5lZClcclxuICAgIC5tYXAoa2V5ID0+IHtcclxuICAgICAgY29uc3QgaXRlbSA9IHtcclxuICAgICAgICBpZDoga2V5LFxyXG4gICAgICAgIG5hbWU6IGtleSxcclxuICAgICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICAgIGV4dGVybmFsOiB0cnVlLFxyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLml0ZW0sXHJcbiAgICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcclxuICAgICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCBsb2NrZWRFbnRyaWVzLmxlbmd0aCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpO1xyXG4gIGNvbnN0IGtub3duTWFudWFsbHlBZGRlZCA9IG1hbnVhbEVudHJpZXMuZmlsdGVyKGVudHJ5ID0+IGtleXMuaW5jbHVkZXMoZW50cnkuaWQpKSB8fCBbXTtcclxuICBjb25zdCB1bmtub3duTWFudWFsbHlBZGRlZCA9IG1hbnVhbEVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFrZXlzLmluY2x1ZGVzKGVudHJ5LmlkKSkgfHwgW107XHJcbiAgY29uc3QgZmlsdGVyZWRPcmRlciA9IGtleXNcclxuICAgIC5maWx0ZXIoa2V5ID0+IGxvY2tlZEVudHJpZXMuZmluZChpdGVtID0+IGl0ZW0uaWQgPT09IGtleSkgPT09IHVuZGVmaW5lZClcclxuICAgIC5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcclxuICAgICAgYWNjdW1ba2V5XSA9IGxvYWRPcmRlcltrZXldO1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAga25vd25NYW51YWxseUFkZGVkLmZvckVhY2goa25vd24gPT4ge1xyXG4gICAgY29uc3QgZGlmZiA9IGtleXMubGVuZ3RoIC0gT2JqZWN0LmtleXMoZmlsdGVyZWRPcmRlcikubGVuZ3RoO1xyXG5cclxuICAgIGNvbnN0IHBvcyA9IGZpbHRlcmVkT3JkZXJba25vd24uaWRdLnBvcyAtIGRpZmY7XHJcbiAgICBpdGVtcyA9IFtdLmNvbmNhdChpdGVtcy5zbGljZSgwLCBwb3MpIHx8IFtdLCBrbm93biwgaXRlbXMuc2xpY2UocG9zKSB8fCBbXSk7XHJcbiAgfSk7XHJcblxyXG4gIGxldCBwcmVTb3J0ZWQgPSBbXS5jb25jYXQoXHJcbiAgICAuLi5sb2NrZWRFbnRyaWVzLFxyXG4gICAgaXRlbXMuZmlsdGVyKGl0ZW0gPT4ge1xyXG4gICAgICBjb25zdCBpc0xvY2tlZCA9IGxvY2tlZEVudHJpZXMuZmluZChsb2NrZWQgPT4gbG9ja2VkLm5hbWUgPT09IGl0ZW0ubmFtZSkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgZG9Ob3REaXNwbGF5ID0gRE9fTk9UX0RJU1BMQVkuaW5jbHVkZXMoaXRlbS5uYW1lLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICByZXR1cm4gIWlzTG9ja2VkICYmICFkb05vdERpc3BsYXk7XHJcbiAgICB9KSxcclxuICAgIC4uLnVua25vd25NYW51YWxseUFkZGVkKTtcclxuXHJcbiAgcHJlU29ydGVkID0gKHVwZGF0ZVR5cGUgIT09ICdkcmFnLW4tZHJvcCcpXHJcbiAgICA/IHByZVNvcnRlZC5zb3J0KChsaHMsIHJocykgPT4gbGhzLnByZWZpeCAtIHJocy5wcmVmaXgpXHJcbiAgICA6IHByZVNvcnRlZC5yZWR1Y2UoKGFjY3VtLCBlbnRyeSwgaWR4KSA9PiB7XHJcbiAgICAgICAgaWYgKGxvY2tlZEVudHJpZXMuaW5kZXhPZihlbnRyeSkgIT09IC0xIHx8IGlkeCA9PT0gMCkge1xyXG4gICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IHByZXZQcmVmaXggPSBwYXJzZUludChhY2N1bVtpZHggLSAxXS5wcmVmaXgsIDEwKTtcclxuICAgICAgICAgIGlmIChwcmV2UHJlZml4ID49IGVudHJ5LnByZWZpeCkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICAgICAgICAuLi5lbnRyeSxcclxuICAgICAgICAgICAgICBleHRlcm5hbDogKChlbnRyeS5leHRlcm5hbCA9PT0gdHJ1ZSkgJiYgKGFsbE1vZHMubWFuYWdlZC5maW5kKG1hbiA9PiBtYW4ubmFtZSA9PT0gZW50cnkubmFtZSkpKVxyXG4gICAgICAgICAgICAgICAgPyBmYWxzZSA6IHRydWUsXHJcbiAgICAgICAgICAgICAgcHJlZml4OiBwcmV2UHJlZml4ICsgMSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCBbXSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShwcmVTb3J0ZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogQmx1ZWJpcmQ8c3RyaW5nPiB7XHJcbiAgaWYgKCFpbnN0YWxsYXRpb25QYXRoIHx8ICFtb2Q/Lmluc3RhbGxhdGlvblBhdGgpIHtcclxuICAgIGNvbnN0IGVyck1lc3NhZ2UgPSAhaW5zdGFsbGF0aW9uUGF0aFxyXG4gICAgICA/ICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJ1xyXG4gICAgICA6ICdGYWlsZWQgdG8gcmVzb2x2ZSBtb2QgaW5zdGFsbGF0aW9uIHBhdGgnO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLnJlamVjdChuZXcgRXJyb3IoZXJyTWVzc2FnZSkpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZXhwZWN0ZWRNb2ROYW1lTG9jYXRpb24gPSBbJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAnd2l0Y2hlcjN0bCddLmluY2x1ZGVzKG1vZC50eXBlKVxyXG4gICAgPyBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgsICdNb2RzJylcclxuICAgIDogcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcclxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uKVxyXG4gICAgLnRoZW4oZW50cmllcyA9PiBQcm9taXNlLnJlc29sdmUoZW50cmllc1swXSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRNYW5hZ2VkTW9kTmFtZXMoY29udGV4dDogdHlwZXMuSUNvbXBvbmVudENvbnRleHQsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xyXG4gIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UobW9kcywgKGFjY3VtLCBtb2QpID0+IGZpbmRNb2RGb2xkZXIoaW5zdGFsbGF0aW9uUGF0aCwgbW9kKVxyXG4gICAgLnRoZW4obW9kTmFtZSA9PiB7XHJcbiAgICAgIGlmICghbW9kTmFtZSB8fCBbJ2NvbGxlY3Rpb24nLCAndzNtb2RsaW1pdHBhdGNoZXInXS5pbmNsdWRlcyhtb2QudHlwZSkpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBtb2RDb21wb25lbnRzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ21vZENvbXBvbmVudHMnXSwgW10pO1xyXG4gICAgICBpZiAobW9kQ29tcG9uZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBtb2RDb21wb25lbnRzLnB1c2gobW9kTmFtZSk7XHJcbiAgICAgIH1cclxuICAgICAgWy4uLm1vZENvbXBvbmVudHNdLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICAgIGlkOiBtb2QuaWQsXHJcbiAgICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gcmVzb2x2ZSBtb2QgbmFtZScsIGVycik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfSksIFtdKTtcclxufVxyXG5cclxuY29uc3QgdG9nZ2xlTW9kc1N0YXRlID0gYXN5bmMgKGNvbnRleHQsIHByb3BzLCBlbmFibGVkKSA9PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHt9KTtcclxuICBjb25zdCBtb2RNYXAgPSBhd2FpdCBnZXRBbGxNb2RzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKG1vZE5hbWUgPT4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpKTtcclxuICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQpO1xyXG4gIGNvbnN0IG5ld0xPID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcclxuICAgIGlmICh0b3RhbExvY2tlZC5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgIGFjY3VtW2tleV0gPSBsb2FkT3JkZXJba2V5XTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFjY3VtW2tleV0gPSB7XHJcbiAgICAgICAgLi4ubG9hZE9yZGVyW2tleV0sXHJcbiAgICAgICAgZW5hYmxlZCxcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8gYXMgYW55KSk7XHJcbiAgcHJvcHMucmVmcmVzaCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gaW5mb0NvbXBvbmVudChjb250ZXh0LCBwcm9wcyk6IEpTWC5FbGVtZW50IHtcclxuICBjb25zdCB0ID0gY29udGV4dC5hcGkudHJhbnNsYXRlO1xyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLCB7IGlkOiAnbG9hZG9yZGVyaW5mbycgfSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2gyJywge30sIHQoJ01hbmFnaW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7IHN0eWxlOiB7IGhlaWdodDogJzMwJScgfSB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sIHQoJ1lvdSBjYW4gYWRqdXN0IHRoZSBsb2FkIG9yZGVyIGZvciBUaGUgV2l0Y2hlciAzIGJ5IGRyYWdnaW5nIGFuZCBkcm9wcGluZyAnXHJcbiAgICAgICsgJ21vZHMgdXAgb3IgZG93biBvbiB0aGlzIHBhZ2UuICBJZiB5b3UgYXJlIHVzaW5nIHNldmVyYWwgbW9kcyB0aGF0IGFkZCBzY3JpcHRzIHlvdSBtYXkgbmVlZCB0byB1c2UgJ1xyXG4gICAgICArICd0aGUgV2l0Y2hlciAzIFNjcmlwdCBtZXJnZXIuIEZvciBtb3JlIGluZm9ybWF0aW9uIHNlZTogJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdhJywgeyBvbkNsaWNrOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL01vZGRpbmdfVGhlX1dpdGNoZXJfM193aXRoX1ZvcnRleCcpIH0sIHQoJ01vZGRpbmcgVGhlIFdpdGNoZXIgMyB3aXRoIFZvcnRleC4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSkpKSksXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7XHJcbiAgICAgIHN0eWxlOiB7IGhlaWdodDogJzgwJScgfSxcclxuICAgIH0sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnUGxlYXNlIG5vdGU6JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0ZvciBXaXRjaGVyIDMsIHRoZSBtb2Qgd2l0aCB0aGUgbG93ZXN0IGluZGV4IG51bWJlciAoYnkgZGVmYXVsdCwgdGhlIG1vZCBzb3J0ZWQgYXQgdGhlIHRvcCkgb3ZlcnJpZGVzIG1vZHMgd2l0aCBhIGhpZ2hlciBpbmRleCBudW1iZXIuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1lvdSBhcmUgYWJsZSB0byBtb2RpZnkgdGhlIHByaW9yaXR5IG1hbnVhbGx5IGJ5IHJpZ2h0IGNsaWNraW5nIGFueSBMTyBlbnRyeSBhbmQgc2V0IHRoZSBtb2RcXCdzIHByaW9yaXR5JywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0lmIHlvdSBjYW5ub3Qgc2VlIHlvdXIgbW9kIGluIHRoaXMgbG9hZCBvcmRlciwgeW91IG1heSBuZWVkIHRvIGFkZCBpdCBtYW51YWxseSAoc2VlIG91ciB3aWtpIGZvciBkZXRhaWxzKS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnV2hlbiBtYW5hZ2luZyBtZW51IG1vZHMsIG1vZCBzZXR0aW5ncyBjaGFuZ2VkIGluc2lkZSB0aGUgZ2FtZSB3aWxsIGJlIGRldGVjdGVkIGJ5IFZvcnRleCBhcyBleHRlcm5hbCBjaGFuZ2VzIC0gdGhhdCBpcyBleHBlY3RlZCwgJ1xyXG4gICAgICAgICAgKyAnY2hvb3NlIHRvIHVzZSB0aGUgbmV3ZXIgZmlsZSBhbmQgeW91ciBzZXR0aW5ncyB3aWxsIGJlIG1hZGUgcGVyc2lzdGVudC4nLFxyXG4gICAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1lvdSBjYW4gY2hhbmdlIHRoZSB3YXkgdGhlIHByaW9yaXRpZXMgYXJlIGFzc2dpbmVkIHVzaW5nIHRoZSBcIlN3aXRjaCBUbyBQb3NpdGlvbi9QcmVmaXggYmFzZWRcIiBidXR0b24uICdcclxuICAgICAgICAgICsgJ1ByZWZpeCBiYXNlZCBpcyBsZXNzIHJlc3RyaWN0aXZlIGFuZCBhbGxvd3MgeW91IHRvIHNldCBhbnkgcHJpb3JpdHkgdmFsdWUgeW91IHdhbnQgXCI1MDAwLCA2OTk5OSwgZXRjXCIgd2hpbGUgcG9zaXRpb24gYmFzZWQgd2lsbCAnXHJcbiAgICAgICAgICArICdyZXN0cmljdCB0aGUgcHJpb3JpdGllcyB0byB0aGUgbnVtYmVyIG9mIGxvYWQgb3JkZXIgZW50cmllcyB0aGF0IGFyZSBhdmFpbGFibGUuJyxcclxuICAgICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdNZXJnZXMgZ2VuZXJhdGVkIGJ5IHRoZSBXaXRjaGVyIDMgU2NyaXB0IG1lcmdlciBtdXN0IGJlIGxvYWRlZCBmaXJzdCBhbmQgYXJlIGxvY2tlZCBpbiB0aGUgZmlyc3QgbG9hZCBvcmRlciBzbG90LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5CdXR0b24sIHtcclxuICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IHRvZ2dsZU1vZHNTdGF0ZShjb250ZXh0LCBwcm9wcywgZmFsc2UpLFxyXG4gICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnNXB4JyxcclxuICAgICAgICAgICAgd2lkdGg6ICdtaW4tY29udGVudCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sIHQoJ0Rpc2FibGUgQWxsJykpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2JyJyksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5CdXR0b24sIHtcclxuICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IHRvZ2dsZU1vZHNTdGF0ZShjb250ZXh0LCBwcm9wcywgdHJ1ZSksXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBtYXJnaW5Cb3R0b206ICc1cHgnLFxyXG4gICAgICAgICAgICB3aWR0aDogJ21pbi1jb250ZW50JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgdCgnRW5hYmxlIEFsbCAnKSksIFtdKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHF1ZXJ5U2NyaXB0TWVyZ2UoY29udGV4dCwgcmVhc29uKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmICghIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcclxuICAgIGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJ3dpdGNoZXIzLW1lcmdlJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICBtZXNzYWdlOiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgU2NyaXB0IG1lcmdlciBtYXkgbmVlZCB0byBiZSBleGVjdXRlZCcsXHJcbiAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzJywge1xyXG4gICAgICAgICAgICAgIHRleHQ6IHJlYXNvbixcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDbG9zZScgfSxcclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdSdW4gdG9vbCcsXHJcbiAgICAgICAgICBhY3Rpb246IGRpc21pc3MgPT4ge1xyXG4gICAgICAgICAgICBydW5TY3JpcHRNZXJnZXIoY29udGV4dC5hcGkpO1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjYW5NZXJnZShnYW1lLCBnYW1lRGlzY292ZXJ5KSB7XHJcbiAgaWYgKGdhbWUuaWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKHtcclxuICAgIGJhc2VGaWxlczogKCkgPT4gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaW46IHBhdGguam9pbihnYW1lRGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgICAgICAgb3V0OiBwYXRoLmpvaW4oQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBmaWx0ZXI6IGZpbGVQYXRoID0+IGZpbGVQYXRoLmVuZHNXaXRoKElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRJbnB1dEZpbGUoY29udGV4dCwgbWVyZ2VEaXIpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICBjb25zdCBnYW1lSW5wdXRGaWxlcGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKTtcclxuICByZXR1cm4gKCEhZGlzY292ZXJ5Py5wYXRoKVxyXG4gICAgPyBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihtZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSlcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgID8gZnMucmVhZEZpbGVBc3luYyhnYW1lSW5wdXRGaWxlcGF0aClcclxuICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgICA6IFByb21pc2UucmVqZWN0KHsgY29kZTogJ0VOT0VOVCcsIG1lc3NhZ2U6ICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJyB9KTtcclxufVxyXG5cclxuY29uc3QgZW1wdHlYbWwgPSAnPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+PG1ldGFkYXRhPjwvbWV0YWRhdGE+JztcclxuZnVuY3Rpb24gbWVyZ2UoZmlsZVBhdGgsIG1lcmdlRGlyLCBjb250ZXh0KSB7XHJcbiAgbGV0IG1vZERhdGE7XHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoZmlsZVBhdGgpXHJcbiAgICAudGhlbihhc3luYyB4bWxEYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBtb2REYXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKHhtbERhdGEpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gVGhlIG1vZCBpdHNlbGYgaGFzIGludmFsaWQgeG1sIGRhdGEuXHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIG1vZCBYTUwgZGF0YSAtIGluZm9ybSBtb2QgYXV0aG9yJyxcclxuICAgICAgICB7IHBhdGg6IGZpbGVQYXRoLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgbW9kRGF0YSA9IGVtcHR5WG1sO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC50aGVuKCgpID0+IHJlYWRJbnB1dEZpbGUoY29udGV4dCwgbWVyZ2VEaXIpKVxyXG4gICAgLnRoZW4oYXN5bmMgbWVyZ2VkRGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VkID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKG1lcmdlZERhdGEpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobWVyZ2VkKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgbWVyZ2VkIGZpbGUgLSBpZiBpdCdzIGludmFsaWQgY2hhbmNlcyBhcmUgd2UgbWVzc2VkIHVwXHJcbiAgICAgICAgLy8gIHNvbWVob3csIHJlYXNvbiB3aHkgd2UncmUgZ29pbmcgdG8gYWxsb3cgdGhpcyBlcnJvciB0byBnZXQgcmVwb3J0ZWQuXHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgbWVyZ2VkIFhNTCBkYXRhJywgZXJyLCB7XHJcbiAgICAgICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcclxuICAgICAgICAgIGF0dGFjaG1lbnRzOiBbXHJcbiAgICAgICAgICAgIHsgaWQ6ICdfX21lcmdlZC9pbnB1dC54bWwnLCB0eXBlOiAnZGF0YScsIGRhdGE6IG1lcmdlZERhdGEsXHJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaXRjaGVyIDMgbWVudSBtb2QgbWVyZ2VkIGRhdGEnIH0sXHJcbiAgICAgICAgICAgIHsgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X2xvYWRPcmRlcmAsIHR5cGU6ICdkYXRhJywgZGF0YTogbG9hZE9yZGVyLFxyXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBsb2FkIG9yZGVyJyB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ludmFsaWQgbWVyZ2VkIFhNTCBkYXRhJykpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLnRoZW4oZ2FtZUluZGV4RmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vZEdyb3VwcyA9IG1vZERhdGE/LlVzZXJDb25maWc/Lkdyb3VwO1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZEdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGdhbWVHcm91cHMgPSBnYW1lSW5kZXhGaWxlPy5Vc2VyQ29uZmlnPy5Hcm91cDtcclxuICAgICAgICBjb25zdCBpdGVyID0gbW9kR3JvdXBzW2ldO1xyXG4gICAgICAgIGNvbnN0IG1vZFZhcnMgPSBpdGVyPy5WaXNpYmxlVmFycz8uWzBdPy5WYXI7XHJcbiAgICAgICAgY29uc3QgZ2FtZUdyb3VwSWR4ID0gZ2FtZUdyb3Vwcy5maW5kSW5kZXgoZ3JvdXAgPT4gZ3JvdXA/LiQ/LmlkID09PSBpdGVyPy4kPy5pZCk7XHJcbiAgICAgICAgaWYgKGdhbWVHcm91cElkeCAhPT0gLTEpIHtcclxuICAgICAgICAgIGNvbnN0IGdhbWVHcm91cCA9IGdhbWVHcm91cHNbZ2FtZUdyb3VwSWR4XTtcclxuICAgICAgICAgIGNvbnN0IGdhbWVWYXJzID0gZ2FtZUdyb3VwPy5WaXNpYmxlVmFycz8uWzBdPy5WYXI7XHJcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG1vZFZhcnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbW9kVmFyID0gbW9kVmFyc1tqXTtcclxuICAgICAgICAgICAgY29uc3QgaWQgPSBtb2RWYXI/LiQ/LmlkO1xyXG4gICAgICAgICAgICBjb25zdCBnYW1lVmFySWR4ID0gZ2FtZVZhcnMuZmluZEluZGV4KHYgPT4gdj8uJD8uaWQgPT09IGlkKTtcclxuICAgICAgICAgICAgaWYgKGdhbWVWYXJJZHggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgZ2FtZUluZGV4RmlsZS5Vc2VyQ29uZmlnLkdyb3VwW2dhbWVHcm91cElkeF0uVmlzaWJsZVZhcnNbMF0uVmFyW2dhbWVWYXJJZHhdID0gbW9kVmFyO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGdhbWVJbmRleEZpbGUuVXNlckNvbmZpZy5Hcm91cFtnYW1lR3JvdXBJZHhdLlZpc2libGVWYXJzWzBdLlZhci5wdXNoKG1vZFZhcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZ2FtZUluZGV4RmlsZS5Vc2VyQ29uZmlnLkdyb3VwLnB1c2gobW9kR3JvdXBzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XHJcbiAgICAgIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZ2FtZUluZGV4RmlsZSk7XHJcbiAgICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhcclxuICAgICAgICBwYXRoLmpvaW4obWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXHJcbiAgICAgICAgeG1sKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgbG9nKCdlcnJvcicsICdpbnB1dC54bWwgbWVyZ2UgZmFpbGVkJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmNvbnN0IFNDUklQVF9NRVJHRVJfRklMRVMgPSBbJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJ107XHJcbmZ1bmN0aW9uIHNjcmlwdE1lcmdlclRlc3QoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IG1hdGNoZXIgPSAoZmlsZSA9PiBTQ1JJUFRfTUVSR0VSX0ZJTEVTLmluY2x1ZGVzKGZpbGUpKTtcclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbHRlcihtYXRjaGVyKS5sZW5ndGggPiAwKSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFNDUklQVF9NRVJHRVJfRklMRVMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVyciwgZXJyTWVzc2FnZSkge1xyXG4gIGxldCBhbGxvd1JlcG9ydCA9IHRydWU7XHJcbiAgY29uc3QgdXNlckNhbmNlbGVkID0gZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQ7XHJcbiAgaWYgKHVzZXJDYW5jZWxlZCkge1xyXG4gICAgYWxsb3dSZXBvcnQgPSBmYWxzZTtcclxuICB9XHJcbiAgY29uc3QgYnVzeVJlc291cmNlID0gZXJyIGluc3RhbmNlb2YgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcjtcclxuICBpZiAoYWxsb3dSZXBvcnQgJiYgYnVzeVJlc291cmNlKSB7XHJcbiAgICBhbGxvd1JlcG9ydCA9IGVyci5hbGxvd1JlcG9ydDtcclxuICAgIGVyci5tZXNzYWdlID0gZXJyLmVycm9yTWVzc2FnZTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJNZXNzYWdlLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgcmV0dXJuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzY3JpcHRNZXJnZXJEdW1teUluc3RhbGxlcihjb250ZXh0LCBmaWxlcykge1xyXG4gIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBNb2QnLCAnSXQgbG9va3MgbGlrZSB5b3UgdHJpZWQgdG8gaW5zdGFsbCAnXHJcbiAgICArICdUaGUgV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXIsIHdoaWNoIGlzIGEgdG9vbCBhbmQgbm90IGEgbW9kIGZvciBUaGUgV2l0Y2hlciAzLlxcblxcbidcclxuICAgICsgJ1RoZSBzY3JpcHQgbWVyZ2VyIHNob3VsZFxcJ3ZlIGJlZW4gaW5zdGFsbGVkIGF1dG9tYXRpY2FsbHkgYnkgVm9ydGV4IGFzIHNvb24gYXMgeW91IGFjdGl2YXRlZCB0aGlzIGV4dGVuc2lvbi4gJ1xyXG4gICAgKyAnSWYgdGhlIGRvd25sb2FkIG9yIGluc3RhbGxhdGlvbiBoYXMgZmFpbGVkIGZvciBhbnkgcmVhc29uIC0gcGxlYXNlIGxldCB1cyBrbm93IHdoeSwgYnkgcmVwb3J0aW5nIHRoZSBlcnJvciB0aHJvdWdoICdcclxuICAgICsgJ291ciBmZWVkYmFjayBzeXN0ZW0gYW5kIG1ha2Ugc3VyZSB0byBpbmNsdWRlIHZvcnRleCBsb2dzLiBQbGVhc2Ugbm90ZTogaWYgeW91XFwndmUgaW5zdGFsbGVkICdcclxuICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyIGluIHByZXZpb3VzIHZlcnNpb25zIG9mIFZvcnRleCBhcyBhIG1vZCBhbmQgU1RJTEwgaGF2ZSBpdCBpbnN0YWxsZWQgJ1xyXG4gICAgKyAnKGl0XFwncyBwcmVzZW50IGluIHlvdXIgbW9kIGxpc3QpIC0geW91IHNob3VsZCBjb25zaWRlciB1bi1pbnN0YWxsaW5nIGl0IGZvbGxvd2VkIGJ5IGEgVm9ydGV4IHJlc3RhcnQ7ICdcclxuICAgICsgJ3RoZSBhdXRvbWF0aWMgbWVyZ2VyIGluc3RhbGxlci91cGRhdGVyIHNob3VsZCB0aGVuIGtpY2sgb2ZmIGFuZCBzZXQgdXAgdGhlIHRvb2wgZm9yIHlvdS4nLFxyXG4gICAgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnSW52YWxpZCBtb2QnKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnd2l0Y2hlcjMnXSwgVzNSZWR1Y2VyKTtcclxuICBsZXQgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XHJcbiAgbGV0IG1vZExpbWl0UGF0Y2hlcjogTW9kTGltaXRQYXRjaGVyO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ01vZHMnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXHJcbiAgICBzZXR1cDogdG9CbHVlKChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkpLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IHRvb2xzLFxyXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxyXG4gICAgXSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6ICcyOTIwMzAnLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogMjkyMDMwLFxyXG4gICAgICBpZ25vcmVDb25mbGljdHM6IERPX05PVF9ERVBMT1ksXHJcbiAgICAgIGlnbm9yZURlcGxveTogRE9fTk9UX0RFUExPWSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGdldERMQ1BhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBnZXRUTFBhdGggPSAoZ2FtZSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcclxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcclxuICB9O1xyXG5cclxuICBjb25zdCBpc1RXMyA9IChnYW1lSWQgPSB1bmRlZmluZWQpID0+IHtcclxuICAgIGlmIChnYW1lSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XHJcbiAgfTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjN0bCcsIDI1LCB0b0JsdWUodGVzdFN1cHBvcnRlZFRMKSwgdG9CbHVlKGluc3RhbGxUTCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzbWl4ZWQnLCAzMCwgdG9CbHVlKHRlc3RTdXBwb3J0ZWRNaXhlZCksIHRvQmx1ZShpbnN0YWxsTWl4ZWQpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM2NvbnRlbnQnLCA1MCxcclxuICAgIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkQ29udGVudCksIHRvQmx1ZShpbnN0YWxsQ29udGVudCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCxcclxuICAgIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSwgdG9CbHVlKGluc3RhbGxNZW51TW9kKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2NyaXB0bWVyZ2VyZHVtbXknLCAxNSxcclxuICAgIHRvQmx1ZShzY3JpcHRNZXJnZXJUZXN0KSwgdG9CbHVlKChmaWxlcykgPT4gc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIoY29udGV4dCwgZmlsZXMpKSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM3RsJywgMjUsIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0VEwpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNkbGMnLCAyNSwgaXNUVzMsIGdldERMQ1BhdGgsIHRvQmx1ZSh0ZXN0RExDKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCxcclxuICAgIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsIDYwLCBpc1RXMyxcclxuICAgIChnYW1lKSA9PiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ1RoZSBXaXRjaGVyIDMnKSxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3czbW9kbGltaXRwYXRjaGVyJywgMjUsIGlzVFczLCBnZXRUTFBhdGgsICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpLFxyXG4gICAgeyBkZXBsb3ltZW50RXNzZW50aWFsOiBmYWxzZSwgbmFtZTogJ01vZCBMaW1pdCBQYXRjaGVyIE1vZCBUeXBlJyB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1lcmdlKGNhbk1lcmdlLFxyXG4gICAgKGZpbGVQYXRoLCBtZXJnZURpcikgPT4gbWVyZ2UoZmlsZVBhdGgsIG1lcmdlRGlyLCBjb250ZXh0KSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbigob2xkVmVyc2lvbikgPT4gKG1pZ3JhdGUxNDgoY29udGV4dCwgb2xkVmVyc2lvbikgYXMgYW55KSk7XHJcblxyXG4gIHJlZ2lzdGVyQWN0aW9ucyh7XHJcbiAgICBjb250ZXh0LFxyXG4gICAgcmVmcmVzaEZ1bmMsXHJcbiAgICBnZXRQcmlvcml0eU1hbmFnZXI6ICgpID0+IHByaW9yaXR5TWFuYWdlcixcclxuICAgIGdldE1vZExpbWl0UGF0Y2hlcjogKCkgPT4gbW9kTGltaXRQYXRjaGVyLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXHJcbiAgICAnd2l0Y2hlcjNfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSwgY29sbGVjdGlvbjogdHlwZXMuSU1vZCkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKSA9PlxyXG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxyXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXHJcbiAgICAodCkgPT4gdCgnV2l0Y2hlciAzIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyUHJvZmlsZUZlYXR1cmUoXHJcbiAgICAnbG9jYWxfbWVyZ2VzJywgJ2Jvb2xlYW4nLCAnc2V0dGluZ3MnLCAnUHJvZmlsZSBEYXRhJyxcclxuICAgICdUaGlzIHByb2ZpbGUgd2lsbCBzdG9yZSBhbmQgcmVzdG9yZSBwcm9maWxlIHNwZWNpZmljIGRhdGEgKG1lcmdlZCBzY3JpcHRzLCBsb2Fkb3JkZXIsIGV0Yykgd2hlbiBzd2l0Y2hpbmcgcHJvZmlsZXMnLFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xyXG4gICAgICByZXR1cm4gYWN0aXZlR2FtZUlkID09PSBHQU1FX0lEO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJywgJ2NvbGxlY3Rpb24nXTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyUGFnZSh7XHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICBjcmVhdGVJbmZvUGFuZWw6IChwcm9wcykgPT4ge1xyXG4gICAgICByZWZyZXNoRnVuYyA9IHByb3BzLnJlZnJlc2g7XHJcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSBhcyBhbnk7XHJcbiAgICB9LFxyXG4gICAgZ2FtZUFydFVSTDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICBmaWx0ZXI6IChtb2RzKSA9PiBtb2RzLmZpbHRlcihtb2QgPT4gIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2QudHlwZSkpLFxyXG4gICAgcHJlU29ydDogKGl0ZW1zOiBhbnlbXSwgZGlyZWN0aW9uOiBhbnksIHVwZGF0ZVR5cGU6IGFueSkgPT4ge1xyXG4gICAgICByZXR1cm4gcHJlU29ydChjb250ZXh0LCBpdGVtcywgZGlyZWN0aW9uLCB1cGRhdGVUeXBlLCBwcmlvcml0eU1hbmFnZXIpIGFzIGFueTtcclxuICAgIH0sXHJcbiAgICBub0NvbGxlY3Rpb25HZW5lcmF0aW9uOiB0cnVlLFxyXG4gICAgY2FsbGJhY2s6IChsb2FkT3JkZXIsIHVwZGF0ZVR5cGUpID0+IHtcclxuICAgICAgaWYgKGxvYWRPcmRlciA9PT0gX1BSRVZJT1VTX0xPKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoX1BSRVZJT1VTX0xPICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpO1xyXG4gICAgICB9XHJcbiAgICAgIF9QUkVWSU9VU19MTyA9IGxvYWRPcmRlcjtcclxuICAgICAgc2V0SU5JU3RydWN0KGNvbnRleHQsIGxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHdyaXRlVG9Nb2RTZXR0aW5ncygpKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXHJcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RNb2RMaW1pdEJyZWFjaChjb250ZXh0LmFwaSwgbW9kTGltaXRQYXRjaGVyKSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCd0dzMtbW9kLWxpbWl0LWJyZWFjaCcsICdtb2QtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XHJcblxyXG4gIGNvbnN0IHJldmVydExPRmlsZSA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBpZiAoISFwcm9maWxlICYmIChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkpIHtcclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIHJldHVybiBnZXRNYW51YWxseUFkZGVkTW9kcyhjb250ZXh0KS50aGVuKChtYW51YWxseUFkZGVkKSA9PiB7XHJcbiAgICAgICAgaWYgKG1hbnVhbGx5QWRkZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgY29uc3QgbmV3U3RydWN0ID0ge307XHJcbiAgICAgICAgICBtYW51YWxseUFkZGVkLmZvckVhY2goKG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgICAgICAgIG5ld1N0cnVjdFttb2RdID0ge1xyXG4gICAgICAgICAgICAgIEVuYWJsZWQ6IDEsXHJcbiAgICAgICAgICAgICAgUHJpb3JpdHk6ICgobG9hZE9yZGVyICE9PSB1bmRlZmluZWQgJiYgISFsb2FkT3JkZXJbbW9kXSlcclxuICAgICAgICAgICAgICAgID8gcGFyc2VJbnQobG9hZE9yZGVyW21vZF0ucHJlZml4LCAxMCkgOiBpZHgpICsgMSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIF9JTklfU1RSVUNUID0gbmV3U3RydWN0O1xyXG4gICAgICAgICAgd3JpdGVUb01vZFNldHRpbmdzKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJlZnJlc2hGdW5jPy4oKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgICAgICdGYWlsZWQgdG8gY2xlYW51cCBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcclxuICAgICAgICAgIGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgICAgIDogY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gY2xlYW51cCBsb2FkIG9yZGVyIGZpbGUnLCBlcnIpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHZhbGlkYXRlUHJvZmlsZSA9IChwcm9maWxlSWQsIHN0YXRlKSA9PiB7XHJcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgY29uc3QgZGVwbG95UHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgIGlmICghIWFjdGl2ZVByb2ZpbGUgJiYgISFkZXBsb3lQcm9maWxlICYmIChkZXBsb3lQcm9maWxlLmlkICE9PSBhY3RpdmVQcm9maWxlLmlkKSkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWN0aXZlUHJvZmlsZTtcclxuICB9O1xyXG5cclxuICBsZXQgcHJldkRlcGxveW1lbnQgPSBbXTtcclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgbW9kTGltaXRQYXRjaGVyID0gbmV3IE1vZExpbWl0UGF0Y2hlcihjb250ZXh0LmFwaSk7XHJcbiAgICBwcmlvcml0eU1hbmFnZXIgPSBuZXcgUHJpb3JpdHlNYW5hZ2VyKGNvbnRleHQuYXBpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIGFzeW5jIChnYW1lTW9kZSkgPT4ge1xyXG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICAvLyBKdXN0IGluIGNhc2UgdGhlIHNjcmlwdCBtZXJnZXIgbm90aWZpY2F0aW9uIGlzIHN0aWxsXHJcbiAgICAgICAgLy8gIHByZXNlbnQuXHJcbiAgICAgICAgY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignd2l0Y2hlcjMtbWVyZ2UnKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIGdhbWVNb2RlKTtcclxuICAgICAgICBjb25zdCBhY3RpdmVQcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcbiAgICAgICAgaWYgKGxhc3RQcm9mSWQgIT09IGFjdGl2ZVByb2Y/LmlkKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShjb250ZXh0LCBsYXN0UHJvZklkKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0LCBhY3RpdmVQcm9mPy5pZCkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlc3RvcmUgcHJvZmlsZSBtZXJnZWQgZmlsZXMnLCBlcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCd3aWxsLWRlcGxveScsIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbWVudU1vZC5vbldpbGxEZXBsb3koY29udGV4dC5hcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChKU09OLnN0cmluZ2lmeShwcmV2RGVwbG95bWVudCkgIT09IEpTT04uc3RyaW5naWZ5KGRlcGxveW1lbnQpKSB7XHJcbiAgICAgICAgcHJldkRlcGxveW1lbnQgPSBkZXBsb3ltZW50O1xyXG4gICAgICAgIHF1ZXJ5U2NyaXB0TWVyZ2UoY29udGV4dCwgJ1lvdXIgbW9kcyBzdGF0ZS9sb2FkIG9yZGVyIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgeW91IHJhbiAnXHJcbiAgICAgICAgICArICd0aGUgc2NyaXB0IG1lcmdlci4gWW91IG1heSB3YW50IHRvIHJ1biB0aGUgbWVyZ2VyIHRvb2wgYW5kIGNoZWNrIHdoZXRoZXIgYW55IG5ldyBzY3JpcHQgY29uZmxpY3RzIGFyZSAnXHJcbiAgICAgICAgICArICdwcmVzZW50LCBvciBpZiBleGlzdGluZyBtZXJnZXMgaGF2ZSBiZWNvbWUgdW5lY2Vzc2FyeS4gUGxlYXNlIGFsc28gbm90ZSB0aGF0IGFueSBsb2FkIG9yZGVyIGNoYW5nZXMgJ1xyXG4gICAgICAgICAgKyAnbWF5IGFmZmVjdCB0aGUgb3JkZXIgaW4gd2hpY2ggeW91ciBjb25mbGljdGluZyBtb2RzIGFyZSBtZWFudCB0byBiZSBtZXJnZWQsIGFuZCBtYXkgcmVxdWlyZSB5b3UgdG8gJ1xyXG4gICAgICAgICAgKyAncmVtb3ZlIHRoZSBleGlzdGluZyBtZXJnZSBhbmQgcmUtYXBwbHkgaXQuJyk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcclxuICAgICAgY29uc3QgZG9jRmlsZXMgPSBkZXBsb3ltZW50Wyd3aXRjaGVyM21lbnVtb2Ryb290J11cclxuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gZmlsZS5yZWxQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcclxuICAgICAgY29uc3QgbWVudU1vZFByb21pc2UgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKGRvY0ZpbGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1lbnUgbW9kcyBkZXBsb3llZCAtIHJlbW92ZSB0aGUgbW9kLlxyXG4gICAgICAgICAgcmV0dXJuIG1lbnVNb2QucmVtb3ZlTW9kKGNvbnRleHQuYXBpLCBhY3RpdmVQcm9maWxlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIG1lbnVNb2Qub25EaWREZXBsb3koY29udGV4dC5hcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAgICAgICAgIC50aGVuKGFzeW5jIG1vZElkID0+IHtcclxuICAgICAgICAgICAgICBpZiAobW9kSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5hcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIG1vZElkKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiBtZW51TW9kUHJvbWlzZSgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gc2V0SU5JU3RydWN0KGNvbnRleHQsIGxvYWRPcmRlciwgcHJpb3JpdHlNYW5hZ2VyKSlcclxuICAgICAgICAudGhlbigoKSA9PiB3cml0ZVRvTW9kU2V0dGluZ3MoKSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICByZWZyZXNoRnVuYz8uKCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcclxuICAgICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICAgIH0pO1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdwcm9maWxlLXdpbGwtY2hhbmdlJywgYXN5bmMgKG5ld1Byb2ZpbGVJZCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIG5ld1Byb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJpb3JpdHlUeXBlKHByaW9yaXR5VHlwZSkpO1xyXG5cclxuICAgICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBzdG9yZVRvUHJvZmlsZShjb250ZXh0LCBsYXN0UHJvZklkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQsIHByb2ZpbGUuaWQpKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBtZXJnZWQgaXRlbXMnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vblN0YXRlQ2hhbmdlKFsnc2V0dGluZ3MnLCAnd2l0Y2hlcjMnXSwgKHByZXYsIGN1cnJlbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8IHByaW9yaXR5TWFuYWdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XHJcbiAgICAgIHByaW9yaXR5TWFuYWdlci5wcmlvcml0eVR5cGUgPSBwcmlvcml0eVR5cGU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3B1cmdlLW1vZHMnLCAoKSA9PiB7XHJcbiAgICAgIHJldmVydExPRmlsZSgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=