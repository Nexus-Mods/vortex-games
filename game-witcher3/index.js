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
            .filter(key => (lockedEntries.find(entry => entry.id === key) === undefined)
            && (allMods.managed.find(entry => entry.id === key) === undefined))
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
        const isExternal = (entry) => {
            return ((entry.external === true)
                && (allMods.managed.find(man => man.id === entry.id) === undefined));
        };
        preSorted = (updateType !== 'drag-n-drop')
            ? preSorted.sort((lhs, rhs) => lhs.prefix - rhs.prefix)
            : preSorted.reduce((accum, entry, idx) => {
                if (lockedEntries.indexOf(entry) !== -1 || idx === 0) {
                    accum.push(entry);
                }
                else {
                    const prevPrefix = parseInt(accum[idx - 1].prefix, 10);
                    if (prevPrefix >= entry.prefix) {
                        accum.push(Object.assign(Object.assign({}, entry), { external: isExternal(entry), prefix: prevPrefix + 1 }));
                    }
                    else {
                        accum.push(Object.assign(Object.assign({}, entry), { external: isExternal(entry) }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQXlDO0FBQ3pDLGdEQUF3QjtBQUN4QixrREFBMEI7QUFDMUIsb0RBQXNDO0FBQ3RDLDJDQUFrRjtBQUNsRiw0REFBOEM7QUFDOUMsc0VBQXFDO0FBRXJDLDZDQUEwQztBQUUxQyxtQ0FBcUQ7QUFFckQsMkRBQXFGO0FBRXJGLHNGQUE4RDtBQUU5RCx3REFBZ0M7QUFDaEMsaURBQTJGO0FBRTNGLHFDQUlrQjtBQUVsQixtQ0FBNkM7QUFFN0MsbURBQWtEO0FBRWxELHFEQUFtRDtBQUNuRCx1REFBb0Q7QUFFcEQsNkNBQWdFO0FBQ2hFLCtDQUFtRTtBQUVuRSxtRUFBNEQ7QUFFNUQsdUNBQTRDO0FBQzVDLHlDQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMxQixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFFN0IsTUFBTSxzQkFBc0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBRWhHLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUNyQixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFFdEIsTUFBTSxLQUFLLEdBQUc7SUFDWjtRQUNFLEVBQUUsRUFBRSx5QkFBZ0I7UUFDcEIsSUFBSSxFQUFFLGtCQUFrQjtRQUN4QixJQUFJLEVBQUUseUJBQXlCO1FBQy9CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx5QkFBeUI7UUFDM0MsYUFBYSxFQUFFO1lBQ2IseUJBQXlCO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsU0FB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T0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDcEUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxNQUFNLGFBQWEsR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUEsYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFFLE1BQU0sTUFBSyxnQkFBTyxJQUFJLGVBQWUsS0FBSyxTQUFTLEVBQUU7Z0JBQ3RFLE9BQU87YUFDUjtZQUVELE1BQU0sWUFBWSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFBLDhCQUFxQixHQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEYsZUFBZSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN2QyxZQUFZLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCwgeyBhbGwgfSBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCAqIGFzIEluaVBhcnNlciBmcm9tICd2b3J0ZXgtcGFyc2UtaW5pJztcclxuaW1wb3J0IHdpbmFwaSBmcm9tICd3aW5hcGktYmluZGluZ3MnO1xyXG5cclxuaW1wb3J0IHsgbWlncmF0ZTE0OCB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5cclxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xyXG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuXHJcbmltcG9ydCBtZW51TW9kIGZyb20gJy4vbWVudW1vZCc7XHJcbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyLCBnZXRTY3JpcHRNZXJnZXJEaXIsIHNldE1lcmdlckNvbmZpZyB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcclxuXHJcbmltcG9ydCB7IERPX05PVF9ERVBMT1ksIERPX05PVF9ESVNQTEFZLFxyXG4gIEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLCBnZXRQcmlvcml0eVR5cGVCcmFuY2gsIEkxOE5fTkFNRVNQQUNFLFxyXG4gIElOUFVUX1hNTF9GSUxFTkFNRSwgTE9DS0VEX1BSRUZJWCwgUEFSVF9TVUZGSVgsIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IsXHJcbiAgU0NSSVBUX01FUkdFUl9JRCwgVU5JX1BBVENILFxyXG59IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IHRlc3RNb2RMaW1pdEJyZWFjaCB9IGZyb20gJy4vdGVzdHMnO1xyXG5cclxuaW1wb3J0IHsgTW9kTGltaXRQYXRjaGVyIH0gZnJvbSAnLi9tb2RMaW1pdFBhdGNoJztcclxuXHJcbmltcG9ydCB7IHJlZ2lzdGVyQWN0aW9ucyB9IGZyb20gJy4vaWNvbmJhckFjdGlvbnMnO1xyXG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XHJcblxyXG5pbXBvcnQgeyBpbnN0YWxsTWl4ZWQsIHRlc3RTdXBwb3J0ZWRNaXhlZCB9IGZyb20gJy4vaW5zdGFsbGVycyc7XHJcbmltcG9ydCB7IHJlc3RvcmVGcm9tUHJvZmlsZSwgc3RvcmVUb1Byb2ZpbGUgfSBmcm9tICcuL21lcmdlQmFja3VwJztcclxuXHJcbmltcG9ydCB7IGdldE1lcmdlZE1vZE5hbWVzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xyXG5cclxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHsgVzNSZWR1Y2VyIH0gZnJvbSAnLi9yZWR1Y2Vycyc7XHJcblxyXG5jb25zdCBHT0dfSUQgPSAnMTIwNzY2NDY2Myc7XHJcbmNvbnN0IEdPR19JRF9HT1RZID0gJzE0OTUxMzQzMjAnO1xyXG5jb25zdCBTVEVBTV9JRCA9ICc0OTk0NTAnO1xyXG5jb25zdCBTVEVBTV9JRF9XSCA9ICcyOTIwMzAnO1xyXG5cclxuY29uc3QgQ09ORklHX01BVFJJWF9SRUxfUEFUSCA9IHBhdGguam9pbignYmluJywgJ2NvbmZpZycsICdyNGdhbWUnLCAndXNlcl9jb25maWdfbWF0cml4JywgJ3BjJyk7XHJcblxyXG5sZXQgX0lOSV9TVFJVQ1QgPSB7fTtcclxubGV0IF9QUkVWSU9VU19MTyA9IHt9O1xyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAge1xyXG4gICAgaWQ6IFNDUklQVF9NRVJHRVJfSUQsXHJcbiAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXHJcbiAgICBsb2dvOiAnV2l0Y2hlclNjcmlwdE1lcmdlci5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlVG9Nb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKVxyXG4gICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxyXG4gICAgLnRoZW4oaW5pID0+IHtcclxuICAgICAgcmV0dXJuIEJsdWViaXJkLmVhY2goT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLCAoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYgKF9JTklfU1RSVUNUPy5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgdXNlciB0byBydW4gbXVsdGlwbGUgb3BlcmF0aW9ucyBhdCBvbmNlLFxyXG4gICAgICAgICAgLy8gIGNhdXNpbmcgdGhlIHN0YXRpYyBpbmkgc3RydWN0dXJlIHRvIGJlIG1vZGlmaWVkXHJcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXHJcbiAgICAgICAgICAvLyAgbW9kaWZ5aW5nIHRoZSBsb2FkIG9yZGVyIHdoaWxlIGRlcGxveWluZy4gVGhpcyBzaG91bGRcclxuICAgICAgICAgIC8vICBtYWtlIHN1cmUgd2UgZG9uJ3QgYXR0ZW1wdCB0byB3cml0ZSBhbnkgaW52YWxpZCBtb2QgZW50cmllcy5cclxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcclxuICAgICAgICAgIEVuYWJsZWQ6IF9JTklfU1RSVUNUW2tleV0uRW5hYmxlZCxcclxuICAgICAgICAgIFByaW9yaXR5OiBfSU5JX1NUUlVDVFtrZXldLlByaW9yaXR5LFxyXG4gICAgICAgICAgVks6IF9JTklfU1RSVUNUW2tleV0uVkssXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHBhcnNlci53cml0ZShmaWxlUGF0aCwgaW5pKSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxyXG4gICAgICA/IFByb21pc2UucmVqZWN0KG5ldyBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yKGVyci5wYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTW9kU2V0dGluZ3MoKSB7XHJcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcclxuICAvLyAgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChlaXRoZXIgYnkgdXMgb3IgdGhlIGdhbWUpIGJ1dFxyXG4gIC8vICBqdXN0IGluIGNhc2UgaXQgZ290IHJlbW92ZWQgc29tZWhvdywgd2UgcmUtaW5zdGF0ZSBpdFxyXG4gIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XHJcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxufVxyXG5cclxuLy8gQXR0ZW1wdHMgdG8gcGFyc2UgYW5kIHJldHVybiBkYXRhIGZvdW5kIGluc2lkZVxyXG4vLyAgdGhlIG1vZHMuc2V0dGluZ3MgZmlsZSBpZiBmb3VuZCAtIG90aGVyd2lzZSB0aGlzXHJcbi8vICB3aWxsIGVuc3VyZSB0aGUgZmlsZSBpcyBwcmVzZW50LlxyXG5mdW5jdGlvbiBlbnN1cmVNb2RTZXR0aW5ncygpIHtcclxuICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXHJcbiAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gY3JlYXRlTW9kU2V0dGluZ3MoKS50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCkge1xyXG4gIHJldHVybiBlbnN1cmVNb2RTZXR0aW5ncygpLnRoZW4oaW5pID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICAgIGNvbnN0IGluaUVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSk7XHJcbiAgICBjb25zdCBtYW51YWxDYW5kaWRhdGVzID0gW10uY29uY2F0KGluaUVudHJpZXMsIFtVTklfUEFUQ0hdKS5maWx0ZXIoZW50cnkgPT4ge1xyXG4gICAgICBjb25zdCBoYXNWb3J0ZXhLZXkgPSB1dGlsLmdldFNhZmUoaW5pLmRhdGFbZW50cnldLCBbJ1ZLJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZDtcclxuICAgICAgcmV0dXJuICgoIWhhc1ZvcnRleEtleSkgfHwgKGluaS5kYXRhW2VudHJ5XS5WSyA9PT0gZW50cnkpICYmICFtb2RLZXlzLmluY2x1ZGVzKGVudHJ5KSk7XHJcbiAgICB9KSB8fCBbVU5JX1BBVENIXTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFNldChtYW51YWxDYW5kaWRhdGVzKSk7XHJcbiAgfSlcclxuICAudGhlbih1bmlxdWVDYW5kaWRhdGVzID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gSG93L3doeSBhcmUgd2UgZXZlbiBoZXJlID9cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCEnKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoQXJyYXkuZnJvbSh1bmlxdWVDYW5kaWRhdGVzKSwgKGFjY3VtLCBtb2QpID0+IHtcclxuICAgICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpO1xyXG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RGb2xkZXIpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAvLyBPaywgd2Uga25vdyB0aGUgZm9sZGVyIGlzIHRoZXJlIC0gbGV0cyBlbnN1cmUgdGhhdFxyXG4gICAgICAgICAgLy8gIGl0IGFjdHVhbGx5IGNvbnRhaW5zIGZpbGVzLlxyXG4gICAgICAgICAgbGV0IGNhbmRpZGF0ZXMgPSBbXTtcclxuICAgICAgICAgIGF3YWl0IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQocGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpLCBlbnRyaWVzID0+IHtcclxuICAgICAgICAgICAgY2FuZGlkYXRlcyA9IFtdLmNvbmNhdChjYW5kaWRhdGVzLCBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAoIWVudHJ5LmlzRGlyZWN0b3J5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAocGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKSAhPT0gJycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChlbnRyeT8ubGlua0NvdW50ID09PSB1bmRlZmluZWQgfHwgZW50cnkubGlua0NvdW50IDw9IDEpKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAoWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5kZXhPZihlcnIuY29kZSkgIT09IC0xKVxyXG4gICAgICAgICAgICA/IG51bGwgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICAgICAgICAgIGNvbnN0IG1hcHBlZCA9IGF3YWl0IEJsdWViaXJkLm1hcChjYW5kaWRhdGVzLCBjYW5kID0+XHJcbiAgICAgICAgICAgIGZzLnN0YXRBc3luYyhjYW5kLmZpbGVQYXRoKVxyXG4gICAgICAgICAgICAgIC50aGVuKHN0YXRzID0+IHN0YXRzLmlzU3ltYm9saWNMaW5rKClcclxuICAgICAgICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKGNhbmQuZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpKTtcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKG1hcHBlZCk7XHJcbiAgICAgICAgfSkpXHJcbiAgICAgICAgLnRoZW4oKGZpbGVzOiBzdHJpbmdbXSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUgIT09IHVuZGVmaW5lZCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKG1vZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpICYmIChlcnIucGF0aCA9PT0gbW9kRm9sZGVyKSlcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgIH0sIFtdKTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgLy8gVXNlckNhbmNlbGVkIHdvdWxkIHN1Z2dlc3Qgd2Ugd2VyZSB1bmFibGUgdG8gc3RhdCB0aGUgVzMgbW9kIGZvbGRlclxyXG4gICAgLy8gIHByb2JhYmx5IGR1ZSB0byBhIHBlcm1pc3Npb25pbmcgaXNzdWUgKEVOT0VOVCBpcyBoYW5kbGVkIGFib3ZlKVxyXG4gICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcclxuICAgIGNvbnN0IHByb2Nlc3NDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCk7XHJcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICghdXNlckNhbmNlbGVkICYmICFwcm9jZXNzQ2FuY2VsZWQpO1xyXG4gICAgY29uc3QgZGV0YWlscyA9IHVzZXJDYW5jZWxlZFxyXG4gICAgICA/ICdWb3J0ZXggdHJpZWQgdG8gc2NhbiB5b3VyIFczIG1vZHMgZm9sZGVyIGZvciBtYW51YWxseSBhZGRlZCBtb2RzIGJ1dCAnXHJcbiAgICAgICAgKyAnd2FzIGJsb2NrZWQgYnkgeW91ciBPUy9BViAtIHBsZWFzZSBtYWtlIHN1cmUgdG8gZml4IHRoaXMgYmVmb3JlIHlvdSAnXHJcbiAgICAgICAgKyAncHJvY2VlZCB0byBtb2QgVzMgYXMgeW91ciBtb2RkaW5nIGV4cGVyaWVuY2Ugd2lsbCBiZSBzZXZlcmVseSBhZmZlY3RlZC4nXHJcbiAgICAgIDogZXJyO1xyXG4gICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbG9va3VwIG1hbnVhbGx5IGFkZGVkIG1vZHMnLFxyXG4gICAgICBkZXRhaWxzLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IEJsdWViaXJkPHN0cmluZz4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBpbnN0UGF0aCA9IHdpbmFwaS5SZWdHZXRWYWx1ZShcclxuICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXHJcbiAgICAgICdTb2Z0d2FyZVxcXFxDRCBQcm9qZWN0IFJlZFxcXFxUaGUgV2l0Y2hlciAzJyxcclxuICAgICAgJ0luc3RhbGxGb2xkZXInKTtcclxuICAgIGlmICghaW5zdFBhdGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcclxuICAgIH1cclxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGluc3RQYXRoLnZhbHVlIGFzIHN0cmluZyk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRF9HT1RZLCBHT0dfSUQsIFNURUFNX0lELCBTVEVBTV9JRF9XSF0pXHJcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkVEwoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09ICd3aXRjaGVyMycpXHJcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICAgIGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpICE9PSAtMSkgIT09IHVuZGVmaW5lZCk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbFRMKGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIGxldCBwcmVmaXggPSBmaWxlcy5yZWR1Y2UoKHByZXYsIGZpbGUpID0+IHtcclxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgY29uc3QgaWR4ID0gY29tcG9uZW50cy5pbmRleE9mKCdtb2RzJyk7XHJcbiAgICBpZiAoKGlkeCA+IDApICYmICgocHJldiA9PT0gdW5kZWZpbmVkKSB8fCAoaWR4IDwgcHJldi5sZW5ndGgpKSkge1xyXG4gICAgICByZXR1cm4gY29tcG9uZW50cy5zbGljZSgwLCBpZHgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9XHJcbiAgfSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgcHJlZml4ID0gKHByZWZpeCA9PT0gdW5kZWZpbmVkKSA/ICcnIDogcHJlZml4LmpvaW4ocGF0aC5zZXApICsgcGF0aC5zZXA7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbGVzXHJcbiAgICAuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApICYmIGZpbGUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKHByZWZpeCkpXHJcbiAgICAubWFwKGZpbGUgPT4gKHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnNsaWNlKHByZWZpeC5sZW5ndGgpLFxyXG4gICAgfSkpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRClcclxuICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2NvbnRlbnQnICsgcGF0aC5zZXApICE9PSB1bmRlZmluZWQpKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsQ29udGVudChmaWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRGVsZWdhdGUpIHtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbGVzXHJcbiAgICAuZmlsdGVyKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2NvbnRlbnQnICsgcGF0aC5zZXApKVxyXG4gICAgLm1hcChmaWxlID0+IHtcclxuICAgICAgY29uc3QgZmlsZUJhc2UgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5zbGljZSgxKS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oJ21vZCcgKyBkZXN0aW5hdGlvblBhdGgsIGZpbGVCYXNlKSxcclxuICAgICAgfTtcclxuICB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxNZW51TW9kKGZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xyXG4gIC8vIElucHV0IHNwZWNpZmljIGZpbGVzIG5lZWQgdG8gYmUgaW5zdGFsbGVkIG91dHNpZGUgdGhlIG1vZHMgZm9sZGVyIHdoaWxlXHJcbiAgLy8gIGFsbCBvdGhlciBtb2QgZmlsZXMgYXJlIHRvIGJlIGluc3RhbGxlZCBhcyB1c3VhbC5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGZpbGUpKSAhPT0gJycpO1xyXG4gIGNvbnN0IGlucHV0RmlsZXMgPSBmaWx0ZXJlZC5maWx0ZXIoZmlsZSA9PiBmaWxlLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKTtcclxuICBjb25zdCB1bmlxdWVJbnB1dCA9IGlucHV0RmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgLy8gU29tZSBtb2RzIHRlbmQgdG8gaW5jbHVkZSBhIGJhY2t1cCBmaWxlIG1lYW50IGZvciB0aGUgdXNlciB0byByZXN0b3JlXHJcbiAgICAvLyAgaGlzIGdhbWUgdG8gdmFuaWxsYSAob2J2cyB3ZSBvbmx5IHdhbnQgdG8gYXBwbHkgdGhlIG5vbi1iYWNrdXApLlxyXG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGl0ZXIpO1xyXG5cclxuICAgIGlmIChhY2N1bS5maW5kKGVudHJ5ID0+IHBhdGguYmFzZW5hbWUoZW50cnkpID09PSBmaWxlTmFtZSkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBUaGlzIGNvbmZpZyBmaWxlIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhlIGFjY3VtdWxhdG9yLlxyXG4gICAgICAvLyAgSWdub3JlIHRoaXMgaW5zdGFuY2UuXHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbnN0YW5jZXMgPSBpbnB1dEZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IGZpbGVOYW1lKTtcclxuICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAvLyBXZSBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBtZW51IGNvbmZpZyBmaWxlIC0gbW9kIGF1dGhvciBwcm9iYWJseSBpbmNsdWRlZFxyXG4gICAgICAvLyAgYSBiYWNrdXAgZmlsZSB0byByZXN0b3JlIHZhbmlsbGEgc3RhdGUsIG9yIHBlcmhhcHMgdGhpcyBpcyBhIHZhcmlhbnQgbW9kIHdoaWNoIHdlXHJcbiAgICAgIC8vICBjYW4ndCBjdXJyZW50bHkgc3VwcG9ydC5cclxuICAgICAgLy8gSXQncyBkaWZmaWN1bHQgZm9yIHVzIHRvIGNvcnJlY3RseSBpZGVudGlmeSB0aGUgY29ycmVjdCBmaWxlIGJ1dCB3ZSdyZSBnb2luZyB0b1xyXG4gICAgICAvLyAgdHJ5IGFuZCBndWVzcyBiYXNlZCBvbiB3aGV0aGVyIHRoZSBjb25maWcgZmlsZSBoYXMgYSBcImJhY2t1cFwiIGZvbGRlciBzZWdtZW50XHJcbiAgICAgIC8vICBvdGhlcndpc2Ugd2UganVzdCBhZGQgdGhlIGZpcnN0IGZpbGUgaW5zdGFuY2UgKEknbSBnb2luZyB0byByZWdyZXQgYWRkaW5nIHRoaXMgYXJlbid0IEkgPylcclxuICAgICAgaWYgKGl0ZXIudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdiYWNrdXAnKSA9PT0gLTEpIHtcclxuICAgICAgICAvLyBXZSdyZSBnb2luZyB0byBhc3N1bWUgdGhhdCB0aGlzIGlzIHRoZSByaWdodCBmaWxlLlxyXG4gICAgICAgIGFjY3VtLnB1c2goaXRlcik7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFRoaXMgaXMgYSB1bmlxdWUgbWVudSBjb25maWd1cmF0aW9uIGZpbGUgLSBhZGQgaXQuXHJcbiAgICAgIGFjY3VtLnB1c2goaXRlcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgW10pO1xyXG5cclxuICBsZXQgb3RoZXJGaWxlcyA9IGZpbHRlcmVkLmZpbHRlcihmaWxlID0+ICFpbnB1dEZpbGVzLmluY2x1ZGVzKGZpbGUpKTtcclxuICBjb25zdCBpbnB1dEZpbGVEZXN0aW5hdGlvbiA9IENPTkZJR19NQVRSSVhfUkVMX1BBVEg7XHJcblxyXG4gIC8vIEdldCB0aGUgbW9kJ3Mgcm9vdCBmb2xkZXIuXHJcbiAgY29uc3QgYmluSWR4ID0gdW5pcXVlSW5wdXRbMF0uc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpO1xyXG5cclxuICAvLyBSZWZlcnMgdG8gZmlsZXMgbG9jYXRlZCBpbnNpZGUgdGhlIGFyY2hpdmUncyAnTW9kcycgZGlyZWN0b3J5LlxyXG4gIC8vICBUaGlzIGFycmF5IGNhbiB2ZXJ5IHdlbGwgYmUgZW1wdHkgaWYgYSBtb2RzIGZvbGRlciBkb2Vzbid0IGV4aXN0XHJcbiAgY29uc3QgbW9kRmlsZXMgPSBvdGhlckZpbGVzLmZpbHRlcihmaWxlID0+XHJcbiAgICBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluY2x1ZGVzKCdtb2RzJykpO1xyXG5cclxuICBjb25zdCBtb2RzSWR4ID0gKG1vZEZpbGVzLmxlbmd0aCA+IDApXHJcbiAgICA/IG1vZEZpbGVzWzBdLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ21vZHMnKVxyXG4gICAgOiAtMTtcclxuICBjb25zdCBtb2ROYW1lcyA9IChtb2RzSWR4ICE9PSAtMSlcclxuICAgID8gbW9kRmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgICBjb25zdCBtb2ROYW1lID0gaXRlci5zcGxpdChwYXRoLnNlcCkuc3BsaWNlKG1vZHNJZHggKyAxLCAxKS5qb2luKCk7XHJcbiAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobW9kTmFtZSkpIHtcclxuICAgICAgICBhY2N1bS5wdXNoKG1vZE5hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKVxyXG4gICAgOiBbXTtcclxuICAvLyBUaGUgcHJlc2VuY2Ugb2YgYSBtb2RzIGZvbGRlciBpbmRpY2F0ZXMgdGhhdCB0aGlzIG1vZCBtYXkgcHJvdmlkZVxyXG4gIC8vICBzZXZlcmFsIG1vZCBlbnRyaWVzLlxyXG4gIGlmIChtb2RGaWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICBvdGhlckZpbGVzID0gb3RoZXJGaWxlcy5maWx0ZXIoZmlsZSA9PiAhbW9kRmlsZXMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIH1cclxuXHJcbiAgLy8gV2UncmUgaG9waW5nIHRoYXQgdGhlIG1vZCBhdXRob3IgaGFzIGluY2x1ZGVkIHRoZSBtb2QgbmFtZSBpbiB0aGUgYXJjaGl2ZSdzXHJcbiAgLy8gIHN0cnVjdHVyZSAtIGlmIGhlIGRpZG4ndCAtIHdlJ3JlIGdvaW5nIHRvIHVzZSB0aGUgZGVzdGluYXRpb24gcGF0aCBpbnN0ZWFkLlxyXG4gIGNvbnN0IG1vZE5hbWUgPSAoYmluSWR4ID4gMClcclxuICAgID8gaW5wdXRGaWxlc1swXS5zcGxpdChwYXRoLnNlcClbYmluSWR4IC0gMV1cclxuICAgIDogKCdtb2QnICsgcGF0aC5iYXNlbmFtZShkZXN0aW5hdGlvblBhdGgsICcuaW5zdGFsbGluZycpKS5yZXBsYWNlKC9cXHMvZywgJycpO1xyXG5cclxuICBjb25zdCB0cmltbWVkRmlsZXMgPSBvdGhlckZpbGVzLm1hcChmaWxlID0+IHtcclxuICAgIGNvbnN0IHNvdXJjZSA9IGZpbGU7XHJcbiAgICBsZXQgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoYmluSWR4KTtcclxuICAgIGlmIChyZWxQYXRoWzBdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gVGhpcyBmaWxlIG11c3QndmUgYmVlbiBpbnNpZGUgdGhlIHJvb3Qgb2YgdGhlIGFyY2hpdmU7XHJcbiAgICAgIC8vICBkZXBsb3kgYXMgaXMuXHJcbiAgICAgIHJlbFBhdGggPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmaXJzdFNlZyA9IHJlbFBhdGhbMF0udG9Mb3dlckNhc2UoKTtcclxuICAgIGlmIChmaXJzdFNlZyA9PT0gJ2NvbnRlbnQnIHx8IGZpcnN0U2VnLmVuZHNXaXRoKFBBUlRfU1VGRklYKSkge1xyXG4gICAgICByZWxQYXRoID0gW10uY29uY2F0KFsnTW9kcycsIG1vZE5hbWVdLCByZWxQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzb3VyY2UsXHJcbiAgICAgIHJlbFBhdGg6IHJlbFBhdGguam9pbihwYXRoLnNlcCksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCB0b0NvcHlJbnN0cnVjdGlvbiA9IChzb3VyY2UsIGRlc3RpbmF0aW9uKSA9PiAoe1xyXG4gICAgdHlwZTogJ2NvcHknLFxyXG4gICAgc291cmNlLFxyXG4gICAgZGVzdGluYXRpb24sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGlucHV0SW5zdHJ1Y3Rpb25zID0gdW5pcXVlSW5wdXQubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUsIHBhdGguam9pbihpbnB1dEZpbGVEZXN0aW5hdGlvbiwgcGF0aC5iYXNlbmFtZShmaWxlKSkpKTtcclxuXHJcbiAgY29uc3Qgb3RoZXJJbnN0cnVjdGlvbnMgPSB0cmltbWVkRmlsZXMubWFwKGZpbGUgPT5cclxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUuc291cmNlLCBmaWxlLnJlbFBhdGgpKTtcclxuXHJcbiAgY29uc3QgbW9kRmlsZUluc3RydWN0aW9ucyA9IG1vZEZpbGVzLm1hcChmaWxlID0+XHJcbiAgICB0b0NvcHlJbnN0cnVjdGlvbihmaWxlLCBmaWxlKSk7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChpbnB1dEluc3RydWN0aW9ucywgb3RoZXJJbnN0cnVjdGlvbnMsIG1vZEZpbGVJbnN0cnVjdGlvbnMpO1xyXG4gIGlmIChtb2ROYW1lcy5sZW5ndGggPiAwKSB7XHJcbiAgICBpbnN0cnVjdGlvbnMucHVzaCh7XHJcbiAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICBrZXk6ICdtb2RDb21wb25lbnRzJyxcclxuICAgICAgdmFsdWU6IG1vZE5hbWVzLFxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RNZW51TW9kUm9vdChpbnN0cnVjdGlvbnM6IGFueVtdLCBnYW1lSWQ6IHN0cmluZyk6XHJcbiAgUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0IHwgYm9vbGVhbj4ge1xyXG4gIGNvbnN0IHByZWRpY2F0ZSA9IChpbnN0cikgPT4gKCEhZ2FtZUlkKVxyXG4gICAgPyAoKEdBTUVfSUQgPT09IGdhbWVJZCkgJiYgKGluc3RyLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKSlcclxuICAgIDogKChpbnN0ci50eXBlID09PSAnY29weScpICYmIChpbnN0ci5kZXN0aW5hdGlvbi5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSkpO1xyXG5cclxuICByZXR1cm4gKCEhZ2FtZUlkKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgIHN1cHBvcnRlZDogaW5zdHJ1Y3Rpb25zLmZpbmQocHJlZGljYXRlKSAhPT0gdW5kZWZpbmVkLFxyXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gICAgICB9KVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUoaW5zdHJ1Y3Rpb25zLmZpbmQocHJlZGljYXRlKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFRMKGluc3RydWN0aW9ucykge1xyXG4gIGNvbnN0IG1lbnVNb2RGaWxlcyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gISFpbnN0ci5kZXN0aW5hdGlvblxyXG4gICAgJiYgaW5zdHIuZGVzdGluYXRpb24uaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpO1xyXG4gIGlmIChtZW51TW9kRmlsZXMubGVuZ3RoID4gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxyXG4gICAgaW5zdHJ1Y3Rpb24gPT4gISFpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbiAmJiBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ21vZHMnICsgcGF0aC5zZXApLFxyXG4gICkgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RETEMoaW5zdHJ1Y3Rpb25zKSB7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChcclxuICAgIGluc3RydWN0aW9uID0+ICEhaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24gJiYgaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdkbGMnICsgcGF0aC5zZXApKSAhPT0gdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpIHtcclxuICBjb25zdCBub3RpZklkID0gJ21pc3Npbmctc2NyaXB0LW1lcmdlcic7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6IG5vdGlmSWQsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdXaXRjaGVyIDMgc2NyaXB0IG1lcmdlciBpcyBtaXNzaW5nL21pc2NvbmZpZ3VyZWQnLFxyXG4gICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXInLCB7XHJcbiAgICAgICAgICAgIGJiY29kZTogYXBpLnRyYW5zbGF0ZSgnVm9ydGV4IGlzIHVuYWJsZSB0byByZXNvbHZlIHRoZSBTY3JpcHQgTWVyZ2VyXFwncyBsb2NhdGlvbi4gVGhlIHRvb2wgbmVlZHMgdG8gYmUgZG93bmxvYWRlZCBhbmQgY29uZmlndXJlZCBtYW51YWxseS4gJ1xyXG4gICAgICAgICAgICAgICsgJ1t1cmw9aHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL1Rvb2xfU2V0dXA6X1dpdGNoZXJfM19TY3JpcHRfTWVyZ2VyXUZpbmQgb3V0IG1vcmUgYWJvdXQgaG93IHRvIGNvbmZpZ3VyZSBpdCBhcyBhIHRvb2wgZm9yIHVzZSBpbiBWb3J0ZXguWy91cmxdW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICAgICAgICsgJ05vdGU6IFdoaWxlIHNjcmlwdCBtZXJnaW5nIHdvcmtzIHdlbGwgd2l0aCB0aGUgdmFzdCBtYWpvcml0eSBvZiBtb2RzLCB0aGVyZSBpcyBubyBndWFyYW50ZWUgZm9yIGEgc2F0aXNmeWluZyBvdXRjb21lIGluIGV2ZXJ5IHNpbmdsZSBjYXNlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0Rvd25sb2FkIFNjcmlwdCBNZXJnZXInLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3dpdGNoZXIzL21vZHMvNDg0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJykpIH0sXHJcbiAgICAgICAgICBdKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSB7XHJcbiAgY29uc3QgZmluZFNjcmlwdE1lcmdlciA9IGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBzY3JpcHQgbWVyZ2VyJywgZXJyb3IpO1xyXG4gICAgY29uc3Qgc2NyaXB0TWVyZ2VyUGF0aCA9IGF3YWl0IGdldFNjcmlwdE1lcmdlckRpcihjb250ZXh0KTtcclxuICAgIGlmIChzY3JpcHRNZXJnZXJQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHNldE1lcmdlckNvbmZpZyhkaXNjb3ZlcnkucGF0aCwgc2NyaXB0TWVyZ2VyUGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBlbnN1cmVQYXRoID0gKGRpcnBhdGgpID0+XHJcbiAgICBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKGRpcnBhdGgpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRUVYSVNUJylcclxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKSxcclxuICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJykpLFxyXG4gICAgZW5zdXJlUGF0aChwYXRoLmRpcm5hbWUoZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKSkpXSlcclxuICAgICAgLnRoZW4oKCkgPT4gZG93bmxvYWRTY3JpcHRNZXJnZXIoY29udGV4dClcclxuICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogZmluZFNjcmlwdE1lcmdlcihlcnIpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFNjcmlwdE1lcmdlclRvb2woYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoISFzY3JpcHRNZXJnZXI/LnBhdGgpIHtcclxuICAgIHJldHVybiBzY3JpcHRNZXJnZXI7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5TY3JpcHRNZXJnZXIoYXBpKSB7XHJcbiAgY29uc3QgdG9vbCA9IGdldFNjcmlwdE1lcmdlclRvb2woYXBpKTtcclxuICBpZiAodG9vbD8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXBpLnJ1bkV4ZWN1dGFibGUodG9vbC5wYXRoLCBbXSwgeyBzdWdnZXN0RGVwbG95OiB0cnVlIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBydW4gdG9vbCcsIGVycixcclxuICAgICAgeyBhbGxvd1JlcG9ydDogWydFUEVSTScsICdFQUNDRVNTJywgJ0VOT0VOVCddLmluZGV4T2YoZXJyLmNvZGUpICE9PSAtMSB9KSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEFsbE1vZHMoY29udGV4dCkge1xyXG4gIC8vIE1vZCB0eXBlcyB3ZSBkb24ndCB3YW50IHRvIGRpc3BsYXkgaW4gdGhlIExPIHBhZ2VcclxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgbWVyZ2VkOiBbXSxcclxuICAgICAgbWFudWFsOiBbXSxcclxuICAgICAgbWFuYWdlZDogW10sXHJcbiAgICB9KTtcclxuICB9XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG5cclxuICAvLyBPbmx5IHNlbGVjdCBtb2RzIHdoaWNoIGFyZSBlbmFibGVkLCBhbmQgYXJlIG5vdCBhIG1lbnUgbW9kLlxyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpLmZpbHRlcihrZXkgPT5cclxuICAgICghIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpKTtcclxuXHJcbiAgY29uc3QgbWVyZ2VkTW9kTmFtZXMgPSBhd2FpdCBnZXRNZXJnZWRNb2ROYW1lcyhjb250ZXh0KTtcclxuICBjb25zdCBtYW51YWxseUFkZGVkTW9kcyA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpO1xyXG4gIGNvbnN0IG1hbmFnZWRNb2RzID0gYXdhaXQgZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQsIGVuYWJsZWRNb2RzLm1hcChrZXkgPT4gbW9kc1trZXldKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBtZXJnZWQ6IG1lcmdlZE1vZE5hbWVzLFxyXG4gICAgbWFudWFsOiBtYW51YWxseUFkZGVkTW9kcy5maWx0ZXIobW9kID0+ICFtZXJnZWRNb2ROYW1lcy5pbmNsdWRlcyhtb2QpKSxcclxuICAgIG1hbmFnZWQ6IG1hbmFnZWRNb2RzLFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpIHtcclxuICByZXR1cm4gZ2V0QWxsTW9kcyhjb250ZXh0KS50aGVuKG1vZE1hcCA9PiB7XHJcbiAgICBfSU5JX1NUUlVDVCA9IHt9O1xyXG4gICAgY29uc3QgbW9kcyA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtb2RNYXAubWFuYWdlZCwgbW9kTWFwLm1hbnVhbCk7XHJcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihpc0xvY2tlZEVudHJ5KTtcclxuICAgIGNvbnN0IG1hbmFnZWRMb2NrZWQgPSBtb2RNYXAubWFuYWdlZFxyXG4gICAgICAuZmlsdGVyKGVudHJ5ID0+IGlzTG9ja2VkRW50cnkoZW50cnkubmFtZSkpXHJcbiAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSk7XHJcbiAgICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQsIG1hbmFnZWRMb2NrZWQpO1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLmVhY2gobW9kcywgKG1vZCwgaWR4KSA9PiB7XHJcbiAgICAgIGxldCBuYW1lO1xyXG4gICAgICBsZXQga2V5O1xyXG4gICAgICBpZiAodHlwZW9mKG1vZCkgPT09ICdvYmplY3QnICYmIG1vZCAhPT0gbnVsbCkge1xyXG4gICAgICAgIG5hbWUgPSBtb2QubmFtZTtcclxuICAgICAgICBrZXkgPSBtb2QuaWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmFtZSA9IG1vZDtcclxuICAgICAgICBrZXkgPSBtb2Q7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IExPRW50cnkgPSB1dGlsLmdldFNhZmUobG9hZE9yZGVyLCBba2V5XSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICAgIHByaW9yaXR5TWFuYWdlci5yZXNldE1heFByaW9yaXR5KHRvdGFsTG9ja2VkLmxlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgICAgX0lOSV9TVFJVQ1RbbmFtZV0gPSB7XHJcbiAgICAgICAgLy8gVGhlIElOSSBmaWxlJ3MgZW5hYmxlZCBhdHRyaWJ1dGUgZXhwZWN0cyAxIG9yIDBcclxuICAgICAgICBFbmFibGVkOiAoTE9FbnRyeSAhPT0gdW5kZWZpbmVkKSA/IExPRW50cnkuZW5hYmxlZCA/IDEgOiAwIDogMSxcclxuICAgICAgICBQcmlvcml0eTogdG90YWxMb2NrZWQuaW5jbHVkZXMobmFtZSlcclxuICAgICAgICAgID8gdG90YWxMb2NrZWQuaW5kZXhPZihuYW1lKVxyXG4gICAgICAgICAgOiBwcmlvcml0eU1hbmFnZXIuZ2V0UHJpb3JpdHkoeyBpZDoga2V5IH0pLFxyXG4gICAgICAgIFZLOiBrZXksXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNMb2NrZWRFbnRyeShtb2ROYW1lOiBzdHJpbmcpIHtcclxuICAvLyBXZSdyZSBhZGRpbmcgdGhpcyB0byBhdm9pZCBoYXZpbmcgdGhlIGxvYWQgb3JkZXIgcGFnZVxyXG4gIC8vICBmcm9tIG5vdCBsb2FkaW5nIGlmIHdlIGVuY291bnRlciBhbiBpbnZhbGlkIG1vZCBuYW1lLlxyXG4gIGlmICghbW9kTmFtZSB8fCB0eXBlb2YobW9kTmFtZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICBsb2coJ2RlYnVnJywgJ2VuY291bnRlcmVkIGludmFsaWQgbW9kIGluc3RhbmNlL25hbWUnKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcmV0dXJuIG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcclxufVxyXG5cclxubGV0IHJlZnJlc2hGdW5jO1xyXG4vLyBpdGVtOiBJTG9hZE9yZGVyRGlzcGxheUl0ZW1cclxuZnVuY3Rpb24gZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgaXRlbTogdHlwZXMuSUxvYWRPcmRlckRpc3BsYXlJdGVtLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgbWluUHJpb3JpdHk6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2V0UHJpb3JpdHk6IChrZXk6IHN0cmluZywgcHJpb3JpdHk6IG51bWJlcikgPT4gdm9pZCkge1xyXG4gIGNvbnN0IHByaW9yaXR5SW5wdXREaWFsb2cgPSAoKSA9PiB7XHJcbiAgICByZXR1cm4gbmV3IEJsdWViaXJkKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NldCBOZXcgUHJpb3JpdHknLCB7XHJcbiAgICAgICAgdGV4dDogY29udGV4dC5hcGkudHJhbnNsYXRlKCdJbnNlcnQgbmV3IG51bWVyaWNhbCBwcmlvcml0eSBmb3Ige3tpdGVtTmFtZX19IGluIHRoZSBpbnB1dCBib3g6JywgeyByZXBsYWNlOiB7IGl0ZW1OYW1lOiBpdGVtLm5hbWUgfSB9KSxcclxuICAgICAgICBpbnB1dDogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ3czUHJpb3JpdHlJbnB1dCcsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnUHJpb3JpdHknLFxyXG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IF9JTklfU1RSVUNUW2l0ZW0uaWRdPy5Qcmlvcml0eSB8fCAwLFxyXG4gICAgICAgICAgfV0sXHJcbiAgICAgIH0sIFsgeyBsYWJlbDogJ0NhbmNlbCcgfSwgeyBsYWJlbDogJ1NldCcsIGRlZmF1bHQ6IHRydWUgfSBdKVxyXG4gICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnU2V0Jykge1xyXG4gICAgICAgICAgY29uc3QgaXRlbUtleSA9IE9iamVjdC5rZXlzKF9JTklfU1RSVUNUKS5maW5kKGtleSA9PiBfSU5JX1NUUlVDVFtrZXldLlZLID09PSBpdGVtLmlkKTtcclxuICAgICAgICAgIGNvbnN0IHdhbnRlZFByaW9yaXR5ID0gcmVzdWx0LmlucHV0Wyd3M1ByaW9yaXR5SW5wdXQnXTtcclxuICAgICAgICAgIGlmICh3YW50ZWRQcmlvcml0eSA8PSBtaW5Qcmlvcml0eSkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0Nob3NlbiBwcmlvcml0eSBpcyBhbHJlYWR5IGFzc2lnbmVkIHRvIGEgbG9ja2VkIGVudHJ5JyxcclxuICAgICAgICAgICAgICB3YW50ZWRQcmlvcml0eS50b1N0cmluZygpLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpdGVtS2V5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgX0lOSV9TVFJVQ1RbaXRlbUtleV0uUHJpb3JpdHkgPSBwYXJzZUludCh3YW50ZWRQcmlvcml0eSwgMTApO1xyXG4gICAgICAgICAgICBvblNldFByaW9yaXR5KGl0ZW1LZXksIHdhbnRlZFByaW9yaXR5KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHNldCBwcmlvcml0eSAtIG1vZCBpcyBub3QgaW4gaW5pIHN0cnVjdCcsIHsgbW9kSWQ6IGl0ZW0uaWQgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICBjb25zdCBpdGVtQWN0aW9ucyA9IFtcclxuICAgIHtcclxuICAgICAgc2hvdzogaXRlbS5sb2NrZWQgIT09IHRydWUsXHJcbiAgICAgIHRpdGxlOiAnU2V0IE1hbnVhbCBQcmlvcml0eScsXHJcbiAgICAgIGFjdGlvbjogKCkgPT4gcHJpb3JpdHlJbnB1dERpYWxvZygpLFxyXG4gICAgfSxcclxuICBdO1xyXG5cclxuICByZXR1cm4gaXRlbUFjdGlvbnM7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZVNvcnQoY29udGV4dCwgaXRlbXMsIGRpcmVjdGlvbiwgdXBkYXRlVHlwZSwgcHJpb3JpdHlNYW5hZ2VyKTogUHJvbWlzZTxhbnlbXT4ge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IHsgZ2V0UHJpb3JpdHksIHJlc2V0TWF4UHJpb3JpdHkgfSA9IHByaW9yaXR5TWFuYWdlcjtcclxuICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gV2hhdCBhbiBvZGQgdXNlIGNhc2UgLSBwZXJoYXBzIHRoZSB1c2VyIGhhZCBzd2l0Y2hlZCBnYW1lTW9kZXMgb3JcclxuICAgIC8vICBldmVuIGRlbGV0ZWQgaGlzIHByb2ZpbGUgZHVyaW5nIHRoZSBwcmUtc29ydCBmdW5jdGlvbmFsaXR5ID9cclxuICAgIC8vICBPZGQgYnV0IHBsYXVzaWJsZSBJIHN1cHBvc2UgP1xyXG4gICAgbG9nKCd3YXJuJywgJ1tXM10gdW5hYmxlIHRvIHByZXNvcnQgZHVlIHRvIG5vIGFjdGl2ZSBwcm9maWxlJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICB9XHJcblxyXG4gIGxldCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IG9uU2V0UHJpb3JpdHkgPSAoaXRlbUtleSwgd2FudGVkUHJpb3JpdHkpID0+IHtcclxuICAgIHJldHVybiB3cml0ZVRvTW9kU2V0dGluZ3MoKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgd2FudGVkUHJpb3JpdHkgPSArd2FudGVkUHJpb3JpdHk7XHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgbW9kSWQgPSBfSU5JX1NUUlVDVFtpdGVtS2V5XS5WSztcclxuICAgICAgICBjb25zdCBsb0VudHJ5ID0gbG9hZE9yZGVyW21vZElkXTtcclxuICAgICAgICBpZiAocHJpb3JpdHlNYW5hZ2VyLnByaW9yaXR5VHlwZSA9PT0gJ3Bvc2l0aW9uLWJhc2VkJykge1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXJFbnRyeShcclxuICAgICAgICAgICAgYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHtcclxuICAgICAgICAgICAgICAuLi5sb0VudHJ5LFxyXG4gICAgICAgICAgICAgIHBvczogKGxvRW50cnkucG9zIDwgd2FudGVkUHJpb3JpdHkpID8gd2FudGVkUHJpb3JpdHkgOiB3YW50ZWRQcmlvcml0eSAtIDIsXHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlckVudHJ5KFxyXG4gICAgICAgICAgICBhY3RpdmVQcm9maWxlLmlkLCBtb2RJZCwge1xyXG4gICAgICAgICAgICAgIC4uLmxvRW50cnksXHJcbiAgICAgICAgICAgICAgcHJlZml4OiBwYXJzZUludChfSU5JX1NUUlVDVFtpdGVtS2V5XS5Qcmlvcml0eSwgMTApLFxyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmVmcmVzaEZ1bmMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICB9O1xyXG4gIGNvbnN0IGFsbE1vZHMgPSBhd2FpdCBnZXRBbGxNb2RzKGNvbnRleHQpO1xyXG4gIGlmICgoYWxsTW9kcy5tZXJnZWQubGVuZ3RoID09PSAwKSAmJiAoYWxsTW9kcy5tYW51YWwubGVuZ3RoID09PSAwKSkge1xyXG4gICAgaXRlbXMubWFwKChpdGVtLCBpZHgpID0+IHtcclxuICAgICAgaWYgKGlkeCA9PT0gMCkge1xyXG4gICAgICAgIHJlc2V0TWF4UHJpb3JpdHkoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLml0ZW0sXHJcbiAgICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgMCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG9ja2VkTW9kcyA9IFtdLmNvbmNhdChhbGxNb2RzLm1hbnVhbC5maWx0ZXIoaXNMb2NrZWRFbnRyeSksXHJcbiAgICBhbGxNb2RzLm1hbmFnZWQuZmlsdGVyKGVudHJ5ID0+IGlzTG9ja2VkRW50cnkoZW50cnkubmFtZSkpXHJcbiAgICAgICAgICAgICAgICAgICAubWFwKGVudHJ5ID0+IGVudHJ5Lm5hbWUpKTtcclxuICBjb25zdCByZWFkYWJsZU5hbWVzID0ge1xyXG4gICAgW1VOSV9QQVRDSF06ICdVbmlmaWNhdGlvbi9Db21tdW5pdHkgUGF0Y2gnLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGxvY2tlZEVudHJpZXMgPSBbXS5jb25jYXQoYWxsTW9kcy5tZXJnZWQsIGxvY2tlZE1vZHMpXHJcbiAgICAucmVkdWNlKChhY2N1bSwgbW9kTmFtZSwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG9iaiA9IHtcclxuICAgICAgICBpZDogbW9kTmFtZSxcclxuICAgICAgICBuYW1lOiAhIXJlYWRhYmxlTmFtZXNbbW9kTmFtZV0gPyByZWFkYWJsZU5hbWVzW21vZE5hbWVdIDogbW9kTmFtZSxcclxuICAgICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICAgIGxvY2tlZDogdHJ1ZSxcclxuICAgICAgICBwcmVmaXg6IGlkeCArIDEsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAoIWFjY3VtLmZpbmQoYWNjID0+IG9iai5pZCA9PT0gYWNjLmlkKSkge1xyXG4gICAgICAgIGFjY3VtLnB1c2gob2JqKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW10pO1xyXG5cclxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+ICFhbGxNb2RzLm1lcmdlZC5pbmNsdWRlcyhpdGVtLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWFsbE1vZHMubWFudWFsLmluY2x1ZGVzKGl0ZW0uaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAhYWxsTW9kcy5tYW5hZ2VkLmZpbmQobW9kID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobW9kLm5hbWUgPT09IFVOSV9QQVRDSCkgJiYgKG1vZC5pZCA9PT0gaXRlbS5pZCkpKVxyXG4gICAgICAgICAgICAgICAubWFwKChpdGVtLCBpZHgpID0+IHtcclxuICAgIGlmIChpZHggPT09IDApIHtcclxuICAgICAgcmVzZXRNYXhQcmlvcml0eShsb2NrZWRFbnRyaWVzLmxlbmd0aCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5pdGVtLFxyXG4gICAgICBjb250ZXh0TWVudUFjdGlvbnM6IGdlbkVudHJ5QWN0aW9ucyhjb250ZXh0LCBpdGVtLCBsb2NrZWRFbnRyaWVzLmxlbmd0aCwgb25TZXRQcmlvcml0eSksXHJcbiAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtYW51YWxFbnRyaWVzID0gYWxsTW9kcy5tYW51YWxcclxuICAgIC5maWx0ZXIoa2V5ID0+XHJcbiAgICAgICAgIChsb2NrZWRFbnRyaWVzLmZpbmQoZW50cnkgPT4gZW50cnkuaWQgPT09IGtleSkgPT09IHVuZGVmaW5lZClcclxuICAgICAgJiYgKGFsbE1vZHMubWFuYWdlZC5maW5kKGVudHJ5ID0+IGVudHJ5LmlkID09PSBrZXkpID09PSB1bmRlZmluZWQpKVxyXG4gICAgLm1hcChrZXkgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtID0ge1xyXG4gICAgICAgIGlkOiBrZXksXHJcbiAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgIGltZ1VybDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgZXh0ZXJuYWw6IHRydWUsXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uaXRlbSxcclxuICAgICAgICBwcmVmaXg6IGdldFByaW9yaXR5KGl0ZW0pLFxyXG4gICAgICAgIGNvbnRleHRNZW51QWN0aW9uczogZ2VuRW50cnlBY3Rpb25zKGNvbnRleHQsIGl0ZW0sIGxvY2tlZEVudHJpZXMubGVuZ3RoLCBvblNldFByaW9yaXR5KSxcclxuICAgICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcik7XHJcbiAgY29uc3Qga25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4ga2V5cy5pbmNsdWRlcyhlbnRyeS5pZCkpIHx8IFtdO1xyXG4gIGNvbnN0IHVua25vd25NYW51YWxseUFkZGVkID0gbWFudWFsRW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWtleXMuaW5jbHVkZXMoZW50cnkuaWQpKSB8fCBbXTtcclxuICBjb25zdCBmaWx0ZXJlZE9yZGVyID0ga2V5c1xyXG4gICAgLmZpbHRlcihrZXkgPT4gbG9ja2VkRW50cmllcy5maW5kKGl0ZW0gPT4gaXRlbS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgICBhY2N1bVtrZXldID0gbG9hZE9yZGVyW2tleV07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICBrbm93bk1hbnVhbGx5QWRkZWQuZm9yRWFjaChrbm93biA9PiB7XHJcbiAgICBjb25zdCBkaWZmID0ga2V5cy5sZW5ndGggLSBPYmplY3Qua2V5cyhmaWx0ZXJlZE9yZGVyKS5sZW5ndGg7XHJcblxyXG4gICAgY29uc3QgcG9zID0gZmlsdGVyZWRPcmRlcltrbm93bi5pZF0ucG9zIC0gZGlmZjtcclxuICAgIGl0ZW1zID0gW10uY29uY2F0KGl0ZW1zLnNsaWNlKDAsIHBvcykgfHwgW10sIGtub3duLCBpdGVtcy5zbGljZShwb3MpIHx8IFtdKTtcclxuICB9KTtcclxuXHJcbiAgbGV0IHByZVNvcnRlZCA9IFtdLmNvbmNhdChcclxuICAgIC4uLmxvY2tlZEVudHJpZXMsXHJcbiAgICBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAgIGlmICh0eXBlb2YoaXRlbT8ubmFtZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGlzTG9ja2VkID0gbG9ja2VkRW50cmllcy5maW5kKGxvY2tlZCA9PiBsb2NrZWQubmFtZSA9PT0gaXRlbS5uYW1lKSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCBkb05vdERpc3BsYXkgPSBET19OT1RfRElTUExBWS5pbmNsdWRlcyhpdGVtLm5hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIHJldHVybiAhaXNMb2NrZWQgJiYgIWRvTm90RGlzcGxheTtcclxuICAgIH0pLFxyXG4gICAgLi4udW5rbm93bk1hbnVhbGx5QWRkZWQpO1xyXG5cclxuICBjb25zdCBpc0V4dGVybmFsID0gKGVudHJ5KSA9PiB7XHJcbiAgICByZXR1cm4gKChlbnRyeS5leHRlcm5hbCA9PT0gdHJ1ZSlcclxuICAgICAgJiYgKGFsbE1vZHMubWFuYWdlZC5maW5kKG1hbiA9PiBtYW4uaWQgPT09IGVudHJ5LmlkKSA9PT0gdW5kZWZpbmVkKSk7XHJcbiAgfTtcclxuICBwcmVTb3J0ZWQgPSAodXBkYXRlVHlwZSAhPT0gJ2RyYWctbi1kcm9wJylcclxuICAgID8gcHJlU29ydGVkLnNvcnQoKGxocywgcmhzKSA9PiBsaHMucHJlZml4IC0gcmhzLnByZWZpeClcclxuICAgIDogcHJlU29ydGVkLnJlZHVjZSgoYWNjdW0sIGVudHJ5LCBpZHgpID0+IHtcclxuICAgICAgICBpZiAobG9ja2VkRW50cmllcy5pbmRleE9mKGVudHJ5KSAhPT0gLTEgfHwgaWR4ID09PSAwKSB7XHJcbiAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgcHJldlByZWZpeCA9IHBhcnNlSW50KGFjY3VtW2lkeCAtIDFdLnByZWZpeCwgMTApO1xyXG4gICAgICAgICAgaWYgKHByZXZQcmVmaXggPj0gZW50cnkucHJlZml4KSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgICAgIC4uLmVudHJ5LFxyXG4gICAgICAgICAgICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGVudHJ5KSxcclxuICAgICAgICAgICAgICBwcmVmaXg6IHByZXZQcmVmaXggKyAxLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goeyAuLi5lbnRyeSwgZXh0ZXJuYWw6IGlzRXh0ZXJuYWwoZW50cnkpIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWNjdW07XHJcbiAgICAgIH0sIFtdKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHByZVNvcnRlZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRNb2RGb2xkZXIoaW5zdGFsbGF0aW9uUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QpOiBCbHVlYmlyZDxzdHJpbmc+IHtcclxuICBpZiAoIWluc3RhbGxhdGlvblBhdGggfHwgIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xyXG4gICAgY29uc3QgZXJyTWVzc2FnZSA9ICFpbnN0YWxsYXRpb25QYXRoXHJcbiAgICAgID8gJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnXHJcbiAgICAgIDogJ0ZhaWxlZCB0byByZXNvbHZlIG1vZCBpbnN0YWxsYXRpb24gcGF0aCc7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyBFcnJvcihlcnJNZXNzYWdlKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBleHBlY3RlZE1vZE5hbWVMb2NhdGlvbiA9IFsnd2l0Y2hlcjNtZW51bW9kcm9vdCcsICd3aXRjaGVyM3RsJ10uaW5jbHVkZXMobW9kLnR5cGUpXHJcbiAgICA/IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgJ01vZHMnKVxyXG4gICAgOiBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZXhwZWN0ZWRNb2ROYW1lTG9jYXRpb24pXHJcbiAgICAudGhlbihlbnRyaWVzID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzWzBdKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1hbmFnZWRNb2ROYW1lcyhjb250ZXh0OiB0eXBlcy5JQ29tcG9uZW50Q29udGV4dCwgbW9kczogdHlwZXMuSU1vZFtdKSB7XHJcbiAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShtb2RzLCAoYWNjdW0sIG1vZCkgPT4gZmluZE1vZEZvbGRlcihpbnN0YWxsYXRpb25QYXRoLCBtb2QpXHJcbiAgICAudGhlbihtb2ROYW1lID0+IHtcclxuICAgICAgaWYgKCFtb2ROYW1lIHx8IFsnY29sbGVjdGlvbicsICd3M21vZGxpbWl0cGF0Y2hlciddLmluY2x1ZGVzKG1vZC50eXBlKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vZENvbXBvbmVudHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnbW9kQ29tcG9uZW50cyddLCBbXSk7XHJcbiAgICAgIGlmIChtb2RDb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIG1vZENvbXBvbmVudHMucHVzaChtb2ROYW1lKTtcclxuICAgICAgfVxyXG4gICAgICBbLi4ubW9kQ29tcG9uZW50c10uZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgaWQ6IG1vZC5pZCxcclxuICAgICAgICAgIG5hbWU6IGtleSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byByZXNvbHZlIG1vZCBuYW1lJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICB9KSwgW10pO1xyXG59XHJcblxyXG5jb25zdCB0b2dnbGVNb2RzU3RhdGUgPSBhc3luYyAoY29udGV4dCwgcHJvcHMsIGVuYWJsZWQpID0+IHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwge30pO1xyXG4gIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dCk7XHJcbiAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIobW9kTmFtZSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkpO1xyXG4gIGNvbnN0IHRvdGFsTG9ja2VkID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1hbnVhbExvY2tlZCk7XHJcbiAgY29uc3QgbmV3TE8gPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgaWYgKHRvdGFsTG9ja2VkLmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgYWNjdW1ba2V5XSA9IGxvYWRPcmRlcltrZXldO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYWNjdW1ba2V5XSA9IHtcclxuICAgICAgICAuLi5sb2FkT3JkZXJba2V5XSxcclxuICAgICAgICBlbmFibGVkLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlLmlkLCBuZXdMTyBhcyBhbnkpKTtcclxuICBwcm9wcy5yZWZyZXNoKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKTogSlNYLkVsZW1lbnQge1xyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdsb2Fkb3JkZXJpbmZvJyB9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSwgdCgnTWFuYWdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHsgc3R5bGU6IHsgaGVpZ2h0OiAnMzAlJyB9IH0sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSwgdCgnWW91IGNhbiBhZGp1c3QgdGhlIGxvYWQgb3JkZXIgZm9yIFRoZSBXaXRjaGVyIDMgYnkgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nICdcclxuICAgICAgKyAnbW9kcyB1cCBvciBkb3duIG9uIHRoaXMgcGFnZS4gIElmIHlvdSBhcmUgdXNpbmcgc2V2ZXJhbCBtb2RzIHRoYXQgYWRkIHNjcmlwdHMgeW91IG1heSBuZWVkIHRvIHVzZSAnXHJcbiAgICAgICsgJ3RoZSBXaXRjaGVyIDMgU2NyaXB0IG1lcmdlci4gRm9yIG1vcmUgaW5mb3JtYXRpb24gc2VlOiAnLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7IG9uQ2xpY2s6ICgpID0+IHV0aWwub3BuKCdodHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvTW9kZGluZ19UaGVfV2l0Y2hlcl8zX3dpdGhfVm9ydGV4JykgfSwgdCgnTW9kZGluZyBUaGUgV2l0Y2hlciAzIHdpdGggVm9ydGV4LicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSkpKSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcclxuICAgICAgc3R5bGU6IHsgaGVpZ2h0OiAnODAlJyB9LFxyXG4gICAgfSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdQbGVhc2Ugbm90ZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywge30sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnRm9yIFdpdGNoZXIgMywgdGhlIG1vZCB3aXRoIHRoZSBsb3dlc3QgaW5kZXggbnVtYmVyIChieSBkZWZhdWx0LCB0aGUgbW9kIHNvcnRlZCBhdCB0aGUgdG9wKSBvdmVycmlkZXMgbW9kcyB3aXRoIGEgaGlnaGVyIGluZGV4IG51bWJlci4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnWW91IGFyZSBhYmxlIHRvIG1vZGlmeSB0aGUgcHJpb3JpdHkgbWFudWFsbHkgYnkgcmlnaHQgY2xpY2tpbmcgYW55IExPIGVudHJ5IGFuZCBzZXQgdGhlIG1vZFxcJ3MgcHJpb3JpdHknLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnSWYgeW91IGNhbm5vdCBzZWUgeW91ciBtb2QgaW4gdGhpcyBsb2FkIG9yZGVyLCB5b3UgbWF5IG5lZWQgdG8gYWRkIGl0IG1hbnVhbGx5IChzZWUgb3VyIHdpa2kgZm9yIGRldGFpbHMpLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdXaGVuIG1hbmFnaW5nIG1lbnUgbW9kcywgbW9kIHNldHRpbmdzIGNoYW5nZWQgaW5zaWRlIHRoZSBnYW1lIHdpbGwgYmUgZGV0ZWN0ZWQgYnkgVm9ydGV4IGFzIGV4dGVybmFsIGNoYW5nZXMgLSB0aGF0IGlzIGV4cGVjdGVkLCAnXHJcbiAgICAgICAgICArICdjaG9vc2UgdG8gdXNlIHRoZSBuZXdlciBmaWxlIGFuZCB5b3VyIHNldHRpbmdzIHdpbGwgYmUgbWFkZSBwZXJzaXN0ZW50LicsXHJcbiAgICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnWW91IGNhbiBjaGFuZ2UgdGhlIHdheSB0aGUgcHJpb3JpdGllcyBhcmUgYXNzZ2luZWQgdXNpbmcgdGhlIFwiU3dpdGNoIFRvIFBvc2l0aW9uL1ByZWZpeCBiYXNlZFwiIGJ1dHRvbi4gJ1xyXG4gICAgICAgICAgKyAnUHJlZml4IGJhc2VkIGlzIGxlc3MgcmVzdHJpY3RpdmUgYW5kIGFsbG93cyB5b3UgdG8gc2V0IGFueSBwcmlvcml0eSB2YWx1ZSB5b3Ugd2FudCBcIjUwMDAsIDY5OTk5LCBldGNcIiB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsICdcclxuICAgICAgICAgICsgJ3Jlc3RyaWN0IHRoZSBwcmlvcml0aWVzIHRvIHRoZSBudW1iZXIgb2YgbG9hZCBvcmRlciBlbnRyaWVzIHRoYXQgYXJlIGF2YWlsYWJsZS4nLFxyXG4gICAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01lcmdlcyBnZW5lcmF0ZWQgYnkgdGhlIFdpdGNoZXIgMyBTY3JpcHQgbWVyZ2VyIG11c3QgYmUgbG9hZGVkIGZpcnN0IGFuZCBhcmUgbG9ja2VkIGluIHRoZSBmaXJzdCBsb2FkIG9yZGVyIHNsb3QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkJ1dHRvbiwge1xyXG4gICAgICAgICAgb25DbGljazogKCkgPT4gdG9nZ2xlTW9kc1N0YXRlKGNvbnRleHQsIHByb3BzLCBmYWxzZSksXHJcbiAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBtYXJnaW5Cb3R0b206ICc1cHgnLFxyXG4gICAgICAgICAgICB3aWR0aDogJ21pbi1jb250ZW50JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgdCgnRGlzYWJsZSBBbGwnKSksXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYnInKSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkJ1dHRvbiwge1xyXG4gICAgICAgICAgb25DbGljazogKCkgPT4gdG9nZ2xlTW9kc1N0YXRlKGNvbnRleHQsIHByb3BzLCB0cnVlKSxcclxuICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzVweCcsXHJcbiAgICAgICAgICAgIHdpZHRoOiAnbWluLWNvbnRlbnQnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LCB0KCdFbmFibGUgQWxsICcpKSwgW10pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZShjb250ZXh0LCByZWFzb24pIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKCEhc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xyXG4gICAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnd2l0Y2hlcjMtbWVyZ2UnLFxyXG4gICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgIG1lc3NhZ2U6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSgnV2l0Y2hlciBTY3JpcHQgbWVyZ2VyIG1heSBuZWVkIHRvIGJlIGV4ZWN1dGVkJyxcclxuICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMnLCB7XHJcbiAgICAgICAgICAgICAgdGV4dDogcmVhc29uLFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ1J1biB0b29sJyxcclxuICAgICAgICAgIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICAgIHJ1blNjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGNvbnRleHQuYXBpKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbk1lcmdlKGdhbWUsIGdhbWVEaXNjb3ZlcnkpIHtcclxuICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiAoe1xyXG4gICAgYmFzZUZpbGVzOiAoKSA9PiBbXHJcbiAgICAgIHtcclxuICAgICAgICBpbjogcGF0aC5qb2luKGdhbWVEaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICAgICAgICBvdXQ6IHBhdGguam9pbihDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIGZpbHRlcjogZmlsZVBhdGggPT4gZmlsZVBhdGguZW5kc1dpdGgoSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZElucHV0RmlsZShjb250ZXh0LCBtZXJnZURpcikge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGNvbnN0IGdhbWVJbnB1dEZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpO1xyXG4gIHJldHVybiAoISFkaXNjb3Zlcnk/LnBhdGgpXHJcbiAgICA/IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKG1lcmdlRGlyLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpKVxyXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgICAgPyBmcy5yZWFkRmlsZUFzeW5jKGdhbWVJbnB1dEZpbGVwYXRoKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgIDogUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xyXG59XHJcblxyXG5jb25zdCBlbXB0eVhtbCA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz48bWV0YWRhdGE+PC9tZXRhZGF0YT4nO1xyXG5mdW5jdGlvbiBtZXJnZShmaWxlUGF0aCwgbWVyZ2VEaXIsIGNvbnRleHQpIHtcclxuICBsZXQgbW9kRGF0YTtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aClcclxuICAgIC50aGVuKGFzeW5jIHhtbERhdGEgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG1vZERhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoeG1sRGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAvLyBUaGUgbW9kIGl0c2VsZiBoYXMgaW52YWxpZCB4bWwgZGF0YS5cclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ludmFsaWQgbW9kIFhNTCBkYXRhIC0gaW5mb3JtIG1vZCBhdXRob3InLFxyXG4gICAgICAgIHsgcGF0aDogZmlsZVBhdGgsIGVycm9yOiBlcnIubWVzc2FnZSB9LCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICBtb2REYXRhID0gZW1wdHlYbWw7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgLnRoZW4oKCkgPT4gcmVhZElucHV0RmlsZShjb250ZXh0LCBtZXJnZURpcikpXHJcbiAgICAudGhlbihhc3luYyBtZXJnZWREYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtZXJnZWQgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UobWVyZ2VkRGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtZXJnZWQpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBtZXJnZWQgZmlsZSAtIGlmIGl0J3MgaW52YWxpZCBjaGFuY2VzIGFyZSB3ZSBtZXNzZWQgdXBcclxuICAgICAgICAvLyAgc29tZWhvdywgcmVhc29uIHdoeSB3ZSdyZSBnb2luZyB0byBhbGxvdyB0aGlzIGVycm9yIHRvIGdldCByZXBvcnRlZC5cclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBtZXJnZWQgWE1MIGRhdGEnLCBlcnIsIHtcclxuICAgICAgICAgIGFsbG93UmVwb3J0OiB0cnVlLFxyXG4gICAgICAgICAgYXR0YWNobWVudHM6IFtcclxuICAgICAgICAgICAgeyBpZDogJ19fbWVyZ2VkL2lucHV0LnhtbCcsIHR5cGU6ICdkYXRhJywgZGF0YTogbWVyZ2VkRGF0YSxcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1dpdGNoZXIgMyBtZW51IG1vZCBtZXJnZWQgZGF0YScgfSxcclxuICAgICAgICAgICAgeyBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbG9hZE9yZGVyYCwgdHlwZTogJ2RhdGEnLCBkYXRhOiBsb2FkT3JkZXIsXHJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IGxvYWQgb3JkZXInIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBtZXJnZWQgWE1MIGRhdGEnKSk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAudGhlbihnYW1lSW5kZXhGaWxlID0+IHtcclxuICAgICAgY29uc3QgbW9kR3JvdXBzID0gbW9kRGF0YT8uVXNlckNvbmZpZz8uR3JvdXA7XHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kR3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgZ2FtZUdyb3VwcyA9IGdhbWVJbmRleEZpbGU/LlVzZXJDb25maWc/Lkdyb3VwO1xyXG4gICAgICAgIGNvbnN0IGl0ZXIgPSBtb2RHcm91cHNbaV07XHJcbiAgICAgICAgY29uc3QgbW9kVmFycyA9IGl0ZXI/LlZpc2libGVWYXJzPy5bMF0/LlZhcjtcclxuICAgICAgICBjb25zdCBnYW1lR3JvdXBJZHggPSBnYW1lR3JvdXBzLmZpbmRJbmRleChncm91cCA9PiBncm91cD8uJD8uaWQgPT09IGl0ZXI/LiQ/LmlkKTtcclxuICAgICAgICBpZiAoZ2FtZUdyb3VwSWR4ICE9PSAtMSkge1xyXG4gICAgICAgICAgY29uc3QgZ2FtZUdyb3VwID0gZ2FtZUdyb3Vwc1tnYW1lR3JvdXBJZHhdO1xyXG4gICAgICAgICAgY29uc3QgZ2FtZVZhcnMgPSBnYW1lR3JvdXA/LlZpc2libGVWYXJzPy5bMF0/LlZhcjtcclxuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbW9kVmFycy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBjb25zdCBtb2RWYXIgPSBtb2RWYXJzW2pdO1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IG1vZFZhcj8uJD8uaWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGdhbWVWYXJJZHggPSBnYW1lVmFycy5maW5kSW5kZXgodiA9PiB2Py4kPy5pZCA9PT0gaWQpO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZVZhcklkeCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICBnYW1lSW5kZXhGaWxlLlVzZXJDb25maWcuR3JvdXBbZ2FtZUdyb3VwSWR4XS5WaXNpYmxlVmFyc1swXS5WYXJbZ2FtZVZhcklkeF0gPSBtb2RWYXI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgZ2FtZUluZGV4RmlsZS5Vc2VyQ29uZmlnLkdyb3VwW2dhbWVHcm91cElkeF0uVmlzaWJsZVZhcnNbMF0uVmFyLnB1c2gobW9kVmFyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBnYW1lSW5kZXhGaWxlLlVzZXJDb25maWcuR3JvdXAucHVzaChtb2RHcm91cHNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcclxuICAgICAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChnYW1lSW5kZXhGaWxlKTtcclxuICAgICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKFxyXG4gICAgICAgIHBhdGguam9pbihtZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcclxuICAgICAgICB4bWwpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ2lucHV0LnhtbCBtZXJnZSBmYWlsZWQnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuY29uc3QgU0NSSVBUX01FUkdFUl9GSUxFUyA9IFsnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnXTtcclxuZnVuY3Rpb24gc2NyaXB0TWVyZ2VyVGVzdChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3QgbWF0Y2hlciA9IChmaWxlID0+IFNDUklQVF9NRVJHRVJfRklMRVMuaW5jbHVkZXMoZmlsZSkpO1xyXG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZmlsZXMuZmlsdGVyKG1hdGNoZXIpLmxlbmd0aCA+IDApKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogU0NSSVBUX01FUkdFUl9GSUxFUyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLCBlcnJNZXNzYWdlKSB7XHJcbiAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcclxuICBjb25zdCB1c2VyQ2FuY2VsZWQgPSBlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZDtcclxuICBpZiAodXNlckNhbmNlbGVkKSB7XHJcbiAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xyXG4gIH1cclxuICBjb25zdCBidXN5UmVzb3VyY2UgPSBlcnIgaW5zdGFuY2VvZiBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yO1xyXG4gIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcclxuICAgIGFsbG93UmVwb3J0ID0gZXJyLmFsbG93UmVwb3J0O1xyXG4gICAgZXJyLm1lc3NhZ2UgPSBlcnIuZXJyb3JNZXNzYWdlO1xyXG4gIH1cclxuXHJcbiAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKGVyck1lc3NhZ2UsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICByZXR1cm47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyKGNvbnRleHQsIGZpbGVzKSB7XHJcbiAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIE1vZCcsICdJdCBsb29rcyBsaWtlIHlvdSB0cmllZCB0byBpbnN0YWxsICdcclxuICAgICsgJ1RoZSBXaXRjaGVyIDMgU2NyaXB0IE1lcmdlciwgd2hpY2ggaXMgYSB0b29sIGFuZCBub3QgYSBtb2QgZm9yIFRoZSBXaXRjaGVyIDMuXFxuXFxuJ1xyXG4gICAgKyAnVGhlIHNjcmlwdCBtZXJnZXIgc2hvdWxkXFwndmUgYmVlbiBpbnN0YWxsZWQgYXV0b21hdGljYWxseSBieSBWb3J0ZXggYXMgc29vbiBhcyB5b3UgYWN0aXZhdGVkIHRoaXMgZXh0ZW5zaW9uLiAnXHJcbiAgICArICdJZiB0aGUgZG93bmxvYWQgb3IgaW5zdGFsbGF0aW9uIGhhcyBmYWlsZWQgZm9yIGFueSByZWFzb24gLSBwbGVhc2UgbGV0IHVzIGtub3cgd2h5LCBieSByZXBvcnRpbmcgdGhlIGVycm9yIHRocm91Z2ggJ1xyXG4gICAgKyAnb3VyIGZlZWRiYWNrIHN5c3RlbSBhbmQgbWFrZSBzdXJlIHRvIGluY2x1ZGUgdm9ydGV4IGxvZ3MuIFBsZWFzZSBub3RlOiBpZiB5b3VcXCd2ZSBpbnN0YWxsZWQgJ1xyXG4gICAgKyAndGhlIHNjcmlwdCBtZXJnZXIgaW4gcHJldmlvdXMgdmVyc2lvbnMgb2YgVm9ydGV4IGFzIGEgbW9kIGFuZCBTVElMTCBoYXZlIGl0IGluc3RhbGxlZCAnXHJcbiAgICArICcoaXRcXCdzIHByZXNlbnQgaW4geW91ciBtb2QgbGlzdCkgLSB5b3Ugc2hvdWxkIGNvbnNpZGVyIHVuLWluc3RhbGxpbmcgaXQgZm9sbG93ZWQgYnkgYSBWb3J0ZXggcmVzdGFydDsgJ1xyXG4gICAgKyAndGhlIGF1dG9tYXRpYyBtZXJnZXIgaW5zdGFsbGVyL3VwZGF0ZXIgc2hvdWxkIHRoZW4ga2ljayBvZmYgYW5kIHNldCB1cCB0aGUgdG9vbCBmb3IgeW91LicsXHJcbiAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdJbnZhbGlkIG1vZCcpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcclxuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBXM1JlZHVjZXIpO1xyXG4gIGxldCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcclxuICBsZXQgbW9kTGltaXRQYXRjaGVyOiBNb2RMaW1pdFBhdGNoZXI7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMycsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiAnTW9kcycsXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcclxuICAgIHNldHVwOiB0b0JsdWUoKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSksXHJcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXHJcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogJzI5MjAzMCcsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiAyOTIwMzAsXHJcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogRE9fTk9UX0RFUExPWSxcclxuICAgICAgaWdub3JlRGVwbG95OiBET19OT1RfREVQTE9ZLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZ2V0RExDUGF0aCA9IChnYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0RMQycpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGdldFRMUGF0aCA9IChnYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGlzVFczID0gKGdhbWVJZCA9IHVuZGVmaW5lZCkgPT4ge1xyXG4gICAgaWYgKGdhbWVJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcclxuICB9O1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM3RsJywgMjUsIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkVEwpLCB0b0JsdWUoaW5zdGFsbFRMKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtaXhlZCcsIDMwLCB0b0JsdWUodGVzdFN1cHBvcnRlZE1peGVkKSwgdG9CbHVlKGluc3RhbGxNaXhlZCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzY29udGVudCcsIDUwLFxyXG4gICAgdG9CbHVlKHRlc3RTdXBwb3J0ZWRDb250ZW50KSwgdG9CbHVlKGluc3RhbGxDb250ZW50KSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtZW51bW9kcm9vdCcsIDIwLFxyXG4gICAgdG9CbHVlKHRlc3RNZW51TW9kUm9vdCBhcyBhbnkpLCB0b0JsdWUoaW5zdGFsbE1lbnVNb2QpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzY3JpcHRtZXJnZXJkdW1teScsIDE1LFxyXG4gICAgdG9CbHVlKHNjcmlwdE1lcmdlclRlc3QpLCB0b0JsdWUoKGZpbGVzKSA9PiBzY3JpcHRNZXJnZXJEdW1teUluc3RhbGxlcihjb250ZXh0LCBmaWxlcykpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzdGwnLCAyNSwgaXNUVzMsIGdldFRMUGF0aCwgdG9CbHVlKHRlc3RUTCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM2RsYycsIDI1LCBpc1RXMywgZ2V0RExDUGF0aCwgdG9CbHVlKHRlc3RETEMpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNtZW51bW9kcm9vdCcsIDIwLFxyXG4gICAgaXNUVzMsIGdldFRMUGF0aCwgdG9CbHVlKHRlc3RNZW51TW9kUm9vdCBhcyBhbnkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJywgNjAsIGlzVFczLFxyXG4gICAgKGdhbWUpID0+IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnVGhlIFdpdGNoZXIgMycpLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgndzNtb2RsaW1pdHBhdGNoZXInLCAyNSwgaXNUVzMsIGdldFRMUGF0aCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSksXHJcbiAgICB7IGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlLCBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXIgTW9kIFR5cGUnIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWVyZ2UoY2FuTWVyZ2UsXHJcbiAgICAoZmlsZVBhdGgsIG1lcmdlRGlyKSA9PiBtZXJnZShmaWxlUGF0aCwgbWVyZ2VEaXIsIGNvbnRleHQpLCAnd2l0Y2hlcjNtZW51bW9kcm9vdCcpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKChvbGRWZXJzaW9uKSA9PiAobWlncmF0ZTE0OChjb250ZXh0LCBvbGRWZXJzaW9uKSBhcyBhbnkpKTtcclxuXHJcbiAgcmVnaXN0ZXJBY3Rpb25zKHtcclxuICAgIGNvbnRleHQsXHJcbiAgICByZWZyZXNoRnVuYyxcclxuICAgIGdldFByaW9yaXR5TWFuYWdlcjogKCkgPT4gcHJpb3JpdHlNYW5hZ2VyLFxyXG4gICAgZ2V0TW9kTGltaXRQYXRjaGVyOiAoKSA9PiBtb2RMaW1pdFBhdGNoZXIsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcclxuICAgICd3aXRjaGVyM19jb2xsZWN0aW9uX2RhdGEnLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLCBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSA9PlxyXG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxyXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdXaXRjaGVyIDMgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJQcm9maWxlRmVhdHVyZShcclxuICAgICdsb2NhbF9tZXJnZXMnLCAnYm9vbGVhbicsICdzZXR0aW5ncycsICdQcm9maWxlIERhdGEnLFxyXG4gICAgJ1RoaXMgcHJvZmlsZSB3aWxsIHN0b3JlIGFuZCByZXN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgZGF0YSAobWVyZ2VkIHNjcmlwdHMsIGxvYWRvcmRlciwgZXRjKSB3aGVuIHN3aXRjaGluZyBwcm9maWxlcycsXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSk7XHJcbiAgICAgIHJldHVybiBhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQ7XHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCAnY29sbGVjdGlvbiddO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXJQYWdlKHtcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIGNyZWF0ZUluZm9QYW5lbDogKHByb3BzKSA9PiB7XHJcbiAgICAgIHJlZnJlc2hGdW5jID0gcHJvcHMucmVmcmVzaDtcclxuICAgICAgcmV0dXJuIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpIGFzIGFueTtcclxuICAgIH0sXHJcbiAgICBnYW1lQXJ0VVJMOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgIGZpbHRlcjogKG1vZHMpID0+IG1vZHMuZmlsdGVyKG1vZCA9PiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZC50eXBlKSksXHJcbiAgICBwcmVTb3J0OiAoaXRlbXM6IGFueVtdLCBkaXJlY3Rpb246IGFueSwgdXBkYXRlVHlwZTogYW55KSA9PiB7XHJcbiAgICAgIHJldHVybiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIHByaW9yaXR5TWFuYWdlcikgYXMgYW55O1xyXG4gICAgfSxcclxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXHJcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlciwgdXBkYXRlVHlwZSkgPT4ge1xyXG4gICAgICBpZiAobG9hZE9yZGVyID09PSBfUFJFVklPVVNfTE8pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChfUFJFVklPVVNfTE8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSk7XHJcbiAgICAgIH1cclxuICAgICAgX1BSRVZJT1VTX0xPID0gbG9hZE9yZGVyO1xyXG4gICAgICBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gd3JpdGVUb01vZFNldHRpbmdzKCkpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgICAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgndHczLW1vZC1saW1pdC1icmVhY2gnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcclxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XHJcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ21vZC1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcclxuXHJcbiAgY29uc3QgcmV2ZXJ0TE9GaWxlID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSkge1xyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgdW5kZWZpbmVkKTtcclxuICAgICAgcmV0dXJuIGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpLnRoZW4oKG1hbnVhbGx5QWRkZWQpID0+IHtcclxuICAgICAgICBpZiAobWFudWFsbHlBZGRlZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdTdHJ1Y3QgPSB7fTtcclxuICAgICAgICAgIG1hbnVhbGx5QWRkZWQuZm9yRWFjaCgobW9kLCBpZHgpID0+IHtcclxuICAgICAgICAgICAgbmV3U3RydWN0W21vZF0gPSB7XHJcbiAgICAgICAgICAgICAgRW5hYmxlZDogMSxcclxuICAgICAgICAgICAgICBQcmlvcml0eTogKChsb2FkT3JkZXIgIT09IHVuZGVmaW5lZCAmJiAhIWxvYWRPcmRlclttb2RdKVxyXG4gICAgICAgICAgICAgICAgPyBwYXJzZUludChsb2FkT3JkZXJbbW9kXS5wcmVmaXgsIDEwKSA6IGlkeCkgKyAxLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgX0lOSV9TVFJVQ1QgPSBuZXdTdHJ1Y3Q7XHJcbiAgICAgICAgICB3cml0ZVRvTW9kU2V0dGluZ3MoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmVmcmVzaEZ1bmM/LigpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsXHJcbiAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xyXG4gICAgICAgICAgZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgICAgICAgICAgOiBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgdmFsaWRhdGVQcm9maWxlID0gKHByb2ZpbGVJZCwgc3RhdGUpID0+IHtcclxuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICBjb25zdCBkZXBsb3lQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgaWYgKCEhYWN0aXZlUHJvZmlsZSAmJiAhIWRlcGxveVByb2ZpbGUgJiYgKGRlcGxveVByb2ZpbGUuaWQgIT09IGFjdGl2ZVByb2ZpbGUuaWQpKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhY3RpdmVQcm9maWxlO1xyXG4gIH07XHJcblxyXG4gIGxldCBwcmV2RGVwbG95bWVudCA9IFtdO1xyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBtb2RMaW1pdFBhdGNoZXIgPSBuZXcgTW9kTGltaXRQYXRjaGVyKGNvbnRleHQuYXBpKTtcclxuICAgIHByaW9yaXR5TWFuYWdlciA9IG5ldyBQcmlvcml0eU1hbmFnZXIoY29udGV4dC5hcGksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgYXN5bmMgKGdhbWVNb2RlKSA9PiB7XHJcbiAgICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIC8vIEp1c3QgaW4gY2FzZSB0aGUgc2NyaXB0IG1lcmdlciBub3RpZmljYXRpb24gaXMgc3RpbGxcclxuICAgICAgICAvLyAgcHJlc2VudC5cclxuICAgICAgICBjb250ZXh0LmFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCd3aXRjaGVyMy1tZXJnZScpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZU1vZGUpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2YgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcclxuICAgICAgICBpZiAobGFzdFByb2ZJZCAhPT0gYWN0aXZlUHJvZj8uaWQpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQsIGFjdGl2ZVByb2Y/LmlkKSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzdG9yZSBwcm9maWxlIG1lcmdlZCBmaWxlcycsIGVycik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ3dpbGwtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBtZW51TW9kLm9uV2lsbERlcGxveShjb250ZXh0LmFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHZhbGlkYXRlUHJvZmlsZShwcm9maWxlSWQsIHN0YXRlKTtcclxuICAgICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KHByZXZEZXBsb3ltZW50KSAhPT0gSlNPTi5zdHJpbmdpZnkoZGVwbG95bWVudCkpIHtcclxuICAgICAgICBwcmV2RGVwbG95bWVudCA9IGRlcGxveW1lbnQ7XHJcbiAgICAgICAgcXVlcnlTY3JpcHRNZXJnZShjb250ZXh0LCAnWW91ciBtb2RzIHN0YXRlL2xvYWQgb3JkZXIgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgdGltZSB5b3UgcmFuICdcclxuICAgICAgICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyLiBZb3UgbWF5IHdhbnQgdG8gcnVuIHRoZSBtZXJnZXIgdG9vbCBhbmQgY2hlY2sgd2hldGhlciBhbnkgbmV3IHNjcmlwdCBjb25mbGljdHMgYXJlICdcclxuICAgICAgICAgICsgJ3ByZXNlbnQsIG9yIGlmIGV4aXN0aW5nIG1lcmdlcyBoYXZlIGJlY29tZSB1bmVjZXNzYXJ5LiBQbGVhc2UgYWxzbyBub3RlIHRoYXQgYW55IGxvYWQgb3JkZXIgY2hhbmdlcyAnXHJcbiAgICAgICAgICArICdtYXkgYWZmZWN0IHRoZSBvcmRlciBpbiB3aGljaCB5b3VyIGNvbmZsaWN0aW5nIG1vZHMgYXJlIG1lYW50IHRvIGJlIG1lcmdlZCwgYW5kIG1heSByZXF1aXJlIHlvdSB0byAnXHJcbiAgICAgICAgICArICdyZW1vdmUgdGhlIGV4aXN0aW5nIG1lcmdlIGFuZCByZS1hcHBseSBpdC4nKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBhY3RpdmVQcm9maWxlLmlkXSwge30pO1xyXG4gICAgICBjb25zdCBkb2NGaWxlcyA9IGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXVxyXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIChmaWxlLnJlbFBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpO1xyXG4gICAgICBjb25zdCBtZW51TW9kUHJvbWlzZSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoZG9jRmlsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gbWVudSBtb2RzIGRlcGxveWVkIC0gcmVtb3ZlIHRoZSBtb2QuXHJcbiAgICAgICAgICByZXR1cm4gbWVudU1vZC5yZW1vdmVNb2QoY29udGV4dC5hcGksIGFjdGl2ZVByb2ZpbGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gbWVudU1vZC5vbkRpZERlcGxveShjb250ZXh0LmFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgICAgICAgLnRoZW4oYXN5bmMgbW9kSWQgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChtb2RJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQoYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHRydWUpKTtcclxuICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgbW9kSWQpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIG1lbnVNb2RQcm9taXNlKClcclxuICAgICAgICAudGhlbigoKSA9PiBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHdyaXRlVG9Nb2RTZXR0aW5ncygpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJlZnJlc2hGdW5jPy4oKTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxyXG4gICAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xyXG4gICAgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3Byb2ZpbGUtd2lsbC1jaGFuZ2UnLCBhc3luYyAobmV3UHJvZmlsZUlkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbmV3UHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcHJpb3JpdHlUeXBlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBnZXRQcmlvcml0eVR5cGVCcmFuY2goKSwgJ3ByZWZpeC1iYXNlZCcpO1xyXG4gICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmlvcml0eVR5cGUocHJpb3JpdHlUeXBlKSk7XHJcblxyXG4gICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgcHJvZmlsZS5nYW1lSWQpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiByZXN0b3JlRnJvbVByb2ZpbGUoY29udGV4dCwgcHJvZmlsZS5pZCkpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzdG9yZSBwcm9maWxlIHNwZWNpZmljIG1lcmdlZCBpdGVtcycsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCAocHJldiwgY3VycmVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcclxuICAgICAgcHJpb3JpdHlNYW5hZ2VyLnByaW9yaXR5VHlwZSA9IHByaW9yaXR5VHlwZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcclxuICAgICAgcmV2ZXJ0TE9GaWxlKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW4sXHJcbn07XHJcbiJdfQ==