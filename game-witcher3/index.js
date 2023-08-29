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
const GOG_WH_ID = '1207664643';
const GOG_WH_GOTY = '1640424747';
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
    {
        id: common_1.GAME_ID + '_DX11',
        name: 'The Witcher 3 (DX11)',
        logo: 'auto',
        relative: true,
        executable: () => 'bin/x64/witcher3.exe',
        requiredFiles: [
            'bin/x64/witcher3.exe',
        ],
    },
    {
        id: common_1.GAME_ID + '_DX12',
        name: 'The Witcher 3 (DX12)',
        logo: 'auto',
        relative: true,
        executable: () => 'bin/x64_DX12/witcher3.exe',
        requiredFiles: [
            'bin/x64_DX12/witcher3.exe',
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
        return vortex_api_1.util.GameStoreHelper.findByAppId([
            GOG_ID_GOTY, GOG_ID, GOG_WH_ID, GOG_WH_GOTY,
            STEAM_ID, STEAM_ID_WH,
        ])
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
function determineExecutable(discoveredPath) {
    if (discoveredPath !== undefined) {
        try {
            vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, 'bin', 'x64_DX12', 'witcher3.exe'));
            return 'bin/x64_DX12/witcher3.exe';
        }
        catch (err) {
        }
    }
    return 'bin/x64/witcher3.exe';
}
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
        executable: determineExecutable,
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
            hashFiles: ['bin/x64/witcher3.exe'],
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
    context.registerInstaller('witcher3dlcmod', 60, installers_1.testDLCMod, installers_1.installDLCMod);
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
            var _a;
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
            const docFiles = ((_a = deployment['witcher3menumodroot']) !== null && _a !== void 0 ? _a : [])
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
                if (!(err instanceof vortex_api_1.util.UserCanceled)) {
                    context.api.showErrorNotification('Failed to store profile specific merged items', err);
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUF5QztBQUN6QyxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLG9EQUFzQztBQUN0QywyQ0FBa0Y7QUFDbEYsNERBQThDO0FBQzlDLHNFQUFxQztBQUVyQyw2Q0FBMEM7QUFFMUMsbUNBQXFEO0FBRXJELDJEQUFxRjtBQUVyRixzRkFBOEQ7QUFFOUQsd0RBQWdDO0FBQ2hDLGlEQUEyRjtBQUUzRixxQ0FJa0I7QUFFbEIsbUNBQTZDO0FBRTdDLG1EQUFrRDtBQUVsRCxxREFBbUQ7QUFDbkQsdURBQW9EO0FBRXBELDZDQUEyRjtBQUMzRiwrQ0FBbUU7QUFFbkUsbUVBQTREO0FBRTVELHVDQUE0QztBQUM1Qyx5Q0FBdUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQztBQUNqQyxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUM7QUFDL0IsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMxQixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFFN0IsTUFBTSxzQkFBc0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBRWhHLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUNyQixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFFdEIsTUFBTSxLQUFLLEdBQWtCO0lBQzNCO1FBQ0UsRUFBRSxFQUFFLHlCQUFnQjtRQUNwQixJQUFJLEVBQUUsa0JBQWtCO1FBQ3hCLElBQUksRUFBRSx5QkFBeUI7UUFDL0IsVUFBVSxFQUFFLEdBQUcsRUFBRSxD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RyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUNwRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQSxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsTUFBTSxNQUFLLGdCQUFPLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRTtnQkFDdEUsT0FBTzthQUNSO1lBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsOEJBQXFCLEdBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRixlQUFlLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLFlBQVksRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkLCB7IGFsbCB9IGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBGbGV4TGF5b3V0LCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgKiBhcyBJbmlQYXJzZXIgZnJvbSAndm9ydGV4LXBhcnNlLWluaSc7XG5pbXBvcnQgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XG5cbmltcG9ydCB7IG1pZ3JhdGUxNDggfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcbmltcG9ydCBDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vdmlld3MvQ29sbGVjdGlvbnNEYXRhVmlldyc7XG5cbmltcG9ydCBtZW51TW9kIGZyb20gJy4vbWVudW1vZCc7XG5pbXBvcnQgeyBkb3dubG9hZFNjcmlwdE1lcmdlciwgZ2V0U2NyaXB0TWVyZ2VyRGlyLCBzZXRNZXJnZXJDb25maWcgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XG5cbmltcG9ydCB7IERPX05PVF9ERVBMT1ksIERPX05PVF9ESVNQTEFZLFxuICBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoLCBJMThOX05BTUVTUEFDRSxcbiAgSU5QVVRfWE1MX0ZJTEVOQU1FLCBMT0NLRURfUFJFRklYLCBQQVJUX1NVRkZJWCwgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcixcbiAgU0NSSVBUX01FUkdFUl9JRCwgVU5JX1BBVENILFxufSBmcm9tICcuL2NvbW1vbic7XG5cbmltcG9ydCB7IHRlc3RNb2RMaW1pdEJyZWFjaCB9IGZyb20gJy4vdGVzdHMnO1xuXG5pbXBvcnQgeyBNb2RMaW1pdFBhdGNoZXIgfSBmcm9tICcuL21vZExpbWl0UGF0Y2gnO1xuXG5pbXBvcnQgeyByZWdpc3RlckFjdGlvbnMgfSBmcm9tICcuL2ljb25iYXJBY3Rpb25zJztcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcblxuaW1wb3J0IHsgaW5zdGFsbE1peGVkLCB0ZXN0U3VwcG9ydGVkTWl4ZWQsIGluc3RhbGxETENNb2QsIHRlc3RETENNb2QgfSBmcm9tICcuL2luc3RhbGxlcnMnO1xuaW1wb3J0IHsgcmVzdG9yZUZyb21Qcm9maWxlLCBzdG9yZVRvUHJvZmlsZSB9IGZyb20gJy4vbWVyZ2VCYWNrdXAnO1xuXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lcyB9IGZyb20gJy4vbWVyZ2VJbnZlbnRvcnlQYXJzaW5nJztcblxuaW1wb3J0IHsgc2V0UHJpb3JpdHlUeXBlIH0gZnJvbSAnLi9hY3Rpb25zJztcbmltcG9ydCB7IFczUmVkdWNlciB9IGZyb20gJy4vcmVkdWNlcnMnO1xuXG5jb25zdCBHT0dfSUQgPSAnMTIwNzY2NDY2Myc7XG5jb25zdCBHT0dfSURfR09UWSA9ICcxNDk1MTM0MzIwJztcbmNvbnN0IEdPR19XSF9JRCA9ICcxMjA3NjY0NjQzJztcbmNvbnN0IEdPR19XSF9HT1RZID0gJzE2NDA0MjQ3NDcnO1xuY29uc3QgU1RFQU1fSUQgPSAnNDk5NDUwJztcbmNvbnN0IFNURUFNX0lEX1dIID0gJzI5MjAzMCc7XG5cbmNvbnN0IENPTkZJR19NQVRSSVhfUkVMX1BBVEggPSBwYXRoLmpvaW4oJ2JpbicsICdjb25maWcnLCAncjRnYW1lJywgJ3VzZXJfY29uZmlnX21hdHJpeCcsICdwYycpO1xuXG5sZXQgX0lOSV9TVFJVQ1QgPSB7fTtcbmxldCBfUFJFVklPVVNfTE8gPSB7fTtcblxuY29uc3QgdG9vbHM6IHR5cGVzLklUb29sW10gPSBbXG4gIHtcbiAgICBpZDogU0NSSVBUX01FUkdFUl9JRCxcbiAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXG4gICAgbG9nbzogJ1dpdGNoZXJTY3JpcHRNZXJnZXIuanBnJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXG4gICAgXSxcbiAgfSxcbiAge1xuICAgIGlkOiBHQU1FX0lEICsgJ19EWDExJyxcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMyAoRFgxMSknLFxuICAgIGxvZ286ICdhdXRvJyxcbiAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXG4gICAgXSxcbiAgfSxcbiAge1xuICAgIGlkOiBHQU1FX0lEICsgJ19EWDEyJyxcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMyAoRFgxMiknLFxuICAgIGxvZ286ICdhdXRvJyxcbiAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ2Jpbi94NjRfRFgxMi93aXRjaGVyMy5leGUnLFxuICAgIF0sXG4gIH0sXG5dO1xuXG5mdW5jdGlvbiB3cml0ZVRvTW9kU2V0dGluZ3MoKSB7XG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xuICByZXR1cm4gZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpXG4gICAgLnRoZW4oKCkgPT4gZnMud3JpdGVGaWxlQXN5bmMoZmlsZVBhdGgsICcnLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpXG4gICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxuICAgIC50aGVuKGluaSA9PiB7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChPYmplY3Qua2V5cyhfSU5JX1NUUlVDVCksIChrZXkpID0+IHtcbiAgICAgICAgaWYgKF9JTklfU1RSVUNUPy5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIHVzZXIgdG8gcnVuIG11bHRpcGxlIG9wZXJhdGlvbnMgYXQgb25jZSxcbiAgICAgICAgICAvLyAgY2F1c2luZyB0aGUgc3RhdGljIGluaSBzdHJ1Y3R1cmUgdG8gYmUgbW9kaWZpZWRcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXG4gICAgICAgICAgLy8gIG1vZGlmeWluZyB0aGUgbG9hZCBvcmRlciB3aGlsZSBkZXBsb3lpbmcuIFRoaXMgc2hvdWxkXG4gICAgICAgICAgLy8gIG1ha2Ugc3VyZSB3ZSBkb24ndCBhdHRlbXB0IHRvIHdyaXRlIGFueSBpbnZhbGlkIG1vZCBlbnRyaWVzLlxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcbiAgICAgICAgICBFbmFibGVkOiBfSU5JX1NUUlVDVFtrZXldLkVuYWJsZWQsXG4gICAgICAgICAgUHJpb3JpdHk6IF9JTklfU1RSVUNUW2tleV0uUHJpb3JpdHksXG4gICAgICAgICAgVks6IF9JTklfU1RSVUNUW2tleV0uVkssXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiBwYXJzZXIud3JpdGUoZmlsZVBhdGgsIGluaSkpO1xuICAgIH0pXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxuICAgICAgPyBQcm9taXNlLnJlamVjdChuZXcgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcihlcnIucGF0aCkpXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVNb2RTZXR0aW5ncygpIHtcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICAvLyBUaGVvcmV0aWNhbGx5IHRoZSBXaXRjaGVyIDMgZG9jdW1lbnRzIHBhdGggc2hvdWxkIGJlXG4gIC8vICBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKGVpdGhlciBieSB1cyBvciB0aGUgZ2FtZSkgYnV0XG4gIC8vICBqdXN0IGluIGNhc2UgaXQgZ290IHJlbW92ZWQgc29tZWhvdywgd2UgcmUtaW5zdGF0ZSBpdFxuICAvLyAgeWV0IGFnYWluLi4uIGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1OFxuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKVxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcbn1cblxuLy8gQXR0ZW1wdHMgdG8gcGFyc2UgYW5kIHJldHVybiBkYXRhIGZvdW5kIGluc2lkZVxuLy8gIHRoZSBtb2RzLnNldHRpbmdzIGZpbGUgaWYgZm91bmQgLSBvdGhlcndpc2UgdGhpc1xuLy8gIHdpbGwgZW5zdXJlIHRoZSBmaWxlIGlzIHByZXNlbnQuXG5mdW5jdGlvbiBlbnN1cmVNb2RTZXR0aW5ncygpIHtcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXG4gICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcbiAgICAgID8gY3JlYXRlTW9kU2V0dGluZ3MoKS50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldE1hbnVhbGx5QWRkZWRNb2RzKGNvbnRleHQpIHtcbiAgcmV0dXJuIGVuc3VyZU1vZFNldHRpbmdzKCkudGhlbihpbmkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gICAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZHMpO1xuICAgIGNvbnN0IGluaUVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSk7XG4gICAgY29uc3QgbWFudWFsQ2FuZGlkYXRlcyA9IFtdLmNvbmNhdChpbmlFbnRyaWVzLCBbVU5JX1BBVENIXSkuZmlsdGVyKGVudHJ5ID0+IHtcbiAgICAgIGNvbnN0IGhhc1ZvcnRleEtleSA9IHV0aWwuZ2V0U2FmZShpbmkuZGF0YVtlbnRyeV0sIFsnVksnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuICgoIWhhc1ZvcnRleEtleSkgfHwgKGluaS5kYXRhW2VudHJ5XS5WSyA9PT0gZW50cnkpICYmICFtb2RLZXlzLmluY2x1ZGVzKGVudHJ5KSk7XG4gICAgfSkgfHwgW1VOSV9QQVRDSF07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgU2V0KG1hbnVhbENhbmRpZGF0ZXMpKTtcbiAgfSlcbiAgLnRoZW4odW5pcXVlQ2FuZGlkYXRlcyA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICAgIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gSG93L3doeSBhcmUgd2UgZXZlbiBoZXJlID9cbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQhJykpO1xuICAgIH1cbiAgICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKEFycmF5LmZyb20odW5pcXVlQ2FuZGlkYXRlcyksIChhY2N1bSwgbW9kKSA9PiB7XG4gICAgICBjb25zdCBtb2RGb2xkZXIgPSBwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCk7XG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RGb2xkZXIpKVxuICAgICAgICAudGhlbigoKSA9PiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgIC8vIE9rLCB3ZSBrbm93IHRoZSBmb2xkZXIgaXMgdGhlcmUgLSBsZXRzIGVuc3VyZSB0aGF0XG4gICAgICAgICAgLy8gIGl0IGFjdHVhbGx5IGNvbnRhaW5zIGZpbGVzLlxuICAgICAgICAgIGxldCBjYW5kaWRhdGVzID0gW107XG4gICAgICAgICAgYXdhaXQgcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdChwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCksIGVudHJpZXMgPT4ge1xuICAgICAgICAgICAgY2FuZGlkYXRlcyA9IFtdLmNvbmNhdChjYW5kaWRhdGVzLCBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAoIWVudHJ5LmlzRGlyZWN0b3J5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSkgIT09ICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGVudHJ5Py5saW5rQ291bnQgPT09IHVuZGVmaW5lZCB8fCBlbnRyeS5saW5rQ291bnQgPD0gMSkpKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gKFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluZGV4T2YoZXJyLmNvZGUpICE9PSAtMSlcbiAgICAgICAgICAgID8gbnVsbCAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xuXG4gICAgICAgICAgY29uc3QgbWFwcGVkID0gYXdhaXQgQmx1ZWJpcmQubWFwKGNhbmRpZGF0ZXMsIGNhbmQgPT5cbiAgICAgICAgICAgIGZzLnN0YXRBc3luYyhjYW5kLmZpbGVQYXRoKVxuICAgICAgICAgICAgICAudGhlbihzdGF0cyA9PiBzdGF0cy5pc1N5bWJvbGljTGluaygpXG4gICAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKGNhbmQuZmlsZVBhdGgpKVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKSk7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUobWFwcGVkKTtcbiAgICAgICAgfSkpXG4gICAgICAgIC50aGVuKChmaWxlczogc3RyaW5nW10pID0+IHtcbiAgICAgICAgICBpZiAoZmlsZXMuZmlsdGVyKGZpbGUgPT4gZmlsZSAhPT0gdW5kZWZpbmVkKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhY2N1bS5wdXNoKG1vZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+ICgoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSAmJiAoZXJyLnBhdGggPT09IG1vZEZvbGRlcikpXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoYWNjdW0pXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbiAgICB9LCBbXSk7XG4gIH0pXG4gIC5jYXRjaChlcnIgPT4ge1xuICAgIC8vIFVzZXJDYW5jZWxlZCB3b3VsZCBzdWdnZXN0IHdlIHdlcmUgdW5hYmxlIHRvIHN0YXQgdGhlIFczIG1vZCBmb2xkZXJcbiAgICAvLyAgcHJvYmFibHkgZHVlIHRvIGEgcGVybWlzc2lvbmluZyBpc3N1ZSAoRU5PRU5UIGlzIGhhbmRsZWQgYWJvdmUpXG4gICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcbiAgICBjb25zdCBwcm9jZXNzQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpO1xuICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gKCF1c2VyQ2FuY2VsZWQgJiYgIXByb2Nlc3NDYW5jZWxlZCk7XG4gICAgY29uc3QgZGV0YWlscyA9IHVzZXJDYW5jZWxlZFxuICAgICAgPyAnVm9ydGV4IHRyaWVkIHRvIHNjYW4geW91ciBXMyBtb2RzIGZvbGRlciBmb3IgbWFudWFsbHkgYWRkZWQgbW9kcyBidXQgJ1xuICAgICAgICArICd3YXMgYmxvY2tlZCBieSB5b3VyIE9TL0FWIC0gcGxlYXNlIG1ha2Ugc3VyZSB0byBmaXggdGhpcyBiZWZvcmUgeW91ICdcbiAgICAgICAgKyAncHJvY2VlZCB0byBtb2QgVzMgYXMgeW91ciBtb2RkaW5nIGV4cGVyaWVuY2Ugd2lsbCBiZSBzZXZlcmVseSBhZmZlY3RlZC4nXG4gICAgICA6IGVycjtcbiAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBsb29rdXAgbWFudWFsbHkgYWRkZWQgbW9kcycsXG4gICAgICBkZXRhaWxzLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKTogQmx1ZWJpcmQ8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgaW5zdFBhdGggPSB3aW5hcGkuUmVnR2V0VmFsdWUoXG4gICAgICAnSEtFWV9MT0NBTF9NQUNISU5FJyxcbiAgICAgICdTb2Z0d2FyZVxcXFxDRCBQcm9qZWN0IFJlZFxcXFxUaGUgV2l0Y2hlciAzJyxcbiAgICAgICdJbnN0YWxsRm9sZGVyJyk7XG4gICAgaWYgKCFpbnN0UGF0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdlbXB0eSByZWdpc3RyeSBrZXknKTtcbiAgICB9XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoaW5zdFBhdGgudmFsdWUgYXMgc3RyaW5nKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtcbiAgICAgIEdPR19JRF9HT1RZLCBHT0dfSUQsIEdPR19XSF9JRCwgR09HX1dIX0dPVFksXG4gICAgICBTVEVBTV9JRCwgU1RFQU1fSURfV0gsXG4gICAgXSlcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZFRMKGZpbGVzLCBnYW1lSWQpIHtcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gJ3dpdGNoZXIzJylcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+XG4gICAgICBmaWxlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ21vZHMnKSAhPT0gLTEpICE9PSB1bmRlZmluZWQpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICBzdXBwb3J0ZWQsXG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsVEwoZmlsZXMsXG4gICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxuICAgICAgICAgICAgICAgICAgIGdhbWVJZCxcbiAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0RlbGVnYXRlKSB7XG4gIGxldCBwcmVmaXggPSBmaWxlcy5yZWR1Y2UoKHByZXYsIGZpbGUpID0+IHtcbiAgICBjb25zdCBjb21wb25lbnRzID0gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcbiAgICBjb25zdCBpZHggPSBjb21wb25lbnRzLmluZGV4T2YoJ21vZHMnKTtcbiAgICBpZiAoKGlkeCA+IDApICYmICgocHJldiA9PT0gdW5kZWZpbmVkKSB8fCAoaWR4IDwgcHJldi5sZW5ndGgpKSkge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudHMuc2xpY2UoMCwgaWR4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfVxuICB9LCB1bmRlZmluZWQpO1xuXG4gIHByZWZpeCA9IChwcmVmaXggPT09IHVuZGVmaW5lZCkgPyAnJyA6IHByZWZpeC5qb2luKHBhdGguc2VwKSArIHBhdGguc2VwO1xuXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbGVzXG4gICAgLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSAmJiBmaWxlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChwcmVmaXgpKVxuICAgIC5tYXAoZmlsZSA9PiAoe1xuICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc2xpY2UocHJlZml4Lmxlbmd0aCksXG4gICAgfSkpO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRDb250ZW50KGZpbGVzLCBnYW1lSWQpIHtcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRClcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdjb250ZW50JyArIHBhdGguc2VwKSAhPT0gdW5kZWZpbmVkKSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgIHN1cHBvcnRlZCxcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZpbGVzXG4gICAgLmZpbHRlcihmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdjb250ZW50JyArIHBhdGguc2VwKSlcbiAgICAubWFwKGZpbGUgPT4ge1xuICAgICAgY29uc3QgZmlsZUJhc2UgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5zbGljZSgxKS5qb2luKHBhdGguc2VwKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKCdtb2QnICsgZGVzdGluYXRpb25QYXRoLCBmaWxlQmFzZSksXG4gICAgICB9O1xuICB9KSk7XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxNZW51TW9kKGZpbGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZSkge1xuICAvLyBJbnB1dCBzcGVjaWZpYyBmaWxlcyBuZWVkIHRvIGJlIGluc3RhbGxlZCBvdXRzaWRlIHRoZSBtb2RzIGZvbGRlciB3aGlsZVxuICAvLyAgYWxsIG90aGVyIG1vZCBmaWxlcyBhcmUgdG8gYmUgaW5zdGFsbGVkIGFzIHVzdWFsLlxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGZpbGUpKSAhPT0gJycpO1xuICBjb25zdCBpbnB1dEZpbGVzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gZmlsZS5pbmRleE9mKENPTkZJR19NQVRSSVhfUkVMX1BBVEgpICE9PSAtMSk7XG4gIGNvbnN0IHVuaXF1ZUlucHV0ID0gaW5wdXRGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgLy8gU29tZSBtb2RzIHRlbmQgdG8gaW5jbHVkZSBhIGJhY2t1cCBmaWxlIG1lYW50IGZvciB0aGUgdXNlciB0byByZXN0b3JlXG4gICAgLy8gIGhpcyBnYW1lIHRvIHZhbmlsbGEgKG9idnMgd2Ugb25seSB3YW50IHRvIGFwcGx5IHRoZSBub24tYmFja3VwKS5cbiAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoaXRlcik7XG5cbiAgICBpZiAoYWNjdW0uZmluZChlbnRyeSA9PiBwYXRoLmJhc2VuYW1lKGVudHJ5KSA9PT0gZmlsZU5hbWUpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFRoaXMgY29uZmlnIGZpbGUgaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGUgYWNjdW11bGF0b3IuXG4gICAgICAvLyAgSWdub3JlIHRoaXMgaW5zdGFuY2UuXG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfVxuXG4gICAgY29uc3QgaW5zdGFuY2VzID0gaW5wdXRGaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBmaWxlTmFtZSk7XG4gICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAxKSB7XG4gICAgICAvLyBXZSBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBtZW51IGNvbmZpZyBmaWxlIC0gbW9kIGF1dGhvciBwcm9iYWJseSBpbmNsdWRlZFxuICAgICAgLy8gIGEgYmFja3VwIGZpbGUgdG8gcmVzdG9yZSB2YW5pbGxhIHN0YXRlLCBvciBwZXJoYXBzIHRoaXMgaXMgYSB2YXJpYW50IG1vZCB3aGljaCB3ZVxuICAgICAgLy8gIGNhbid0IGN1cnJlbnRseSBzdXBwb3J0LlxuICAgICAgLy8gSXQncyBkaWZmaWN1bHQgZm9yIHVzIHRvIGNvcnJlY3RseSBpZGVudGlmeSB0aGUgY29ycmVjdCBmaWxlIGJ1dCB3ZSdyZSBnb2luZyB0b1xuICAgICAgLy8gIHRyeSBhbmQgZ3Vlc3MgYmFzZWQgb24gd2hldGhlciB0aGUgY29uZmlnIGZpbGUgaGFzIGEgXCJiYWNrdXBcIiBmb2xkZXIgc2VnbWVudFxuICAgICAgLy8gIG90aGVyd2lzZSB3ZSBqdXN0IGFkZCB0aGUgZmlyc3QgZmlsZSBpbnN0YW5jZSAoSSdtIGdvaW5nIHRvIHJlZ3JldCBhZGRpbmcgdGhpcyBhcmVuJ3QgSSA/KVxuICAgICAgaWYgKGl0ZXIudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdiYWNrdXAnKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2UncmUgZ29pbmcgdG8gYXNzdW1lIHRoYXQgdGhpcyBpcyB0aGUgcmlnaHQgZmlsZS5cbiAgICAgICAgYWNjdW0ucHVzaChpdGVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhpcyBpcyBhIHVuaXF1ZSBtZW51IGNvbmZpZ3VyYXRpb24gZmlsZSAtIGFkZCBpdC5cbiAgICAgIGFjY3VtLnB1c2goaXRlcik7XG4gICAgfVxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgW10pO1xuXG4gIGxldCBvdGhlckZpbGVzID0gZmlsdGVyZWQuZmlsdGVyKGZpbGUgPT4gIWlucHV0RmlsZXMuaW5jbHVkZXMoZmlsZSkpO1xuICBjb25zdCBpbnB1dEZpbGVEZXN0aW5hdGlvbiA9IENPTkZJR19NQVRSSVhfUkVMX1BBVEg7XG5cbiAgLy8gR2V0IHRoZSBtb2QncyByb290IGZvbGRlci5cbiAgY29uc3QgYmluSWR4ID0gdW5pcXVlSW5wdXRbMF0uc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpO1xuXG4gIC8vIFJlZmVycyB0byBmaWxlcyBsb2NhdGVkIGluc2lkZSB0aGUgYXJjaGl2ZSdzICdNb2RzJyBkaXJlY3RvcnkuXG4gIC8vICBUaGlzIGFycmF5IGNhbiB2ZXJ5IHdlbGwgYmUgZW1wdHkgaWYgYSBtb2RzIGZvbGRlciBkb2Vzbid0IGV4aXN0XG4gIGNvbnN0IG1vZEZpbGVzID0gb3RoZXJGaWxlcy5maWx0ZXIoZmlsZSA9PlxuICAgIGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5jbHVkZXMoJ21vZHMnKSk7XG5cbiAgY29uc3QgbW9kc0lkeCA9IChtb2RGaWxlcy5sZW5ndGggPiAwKVxuICAgID8gbW9kRmlsZXNbMF0udG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpXG4gICAgOiAtMTtcbiAgY29uc3QgbW9kTmFtZXMgPSAobW9kc0lkeCAhPT0gLTEpXG4gICAgPyBtb2RGaWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgICBjb25zdCBtb2ROYW1lID0gaXRlci5zcGxpdChwYXRoLnNlcCkuc3BsaWNlKG1vZHNJZHggKyAxLCAxKS5qb2luKCk7XG4gICAgICBpZiAoIWFjY3VtLmluY2x1ZGVzKG1vZE5hbWUpKSB7XG4gICAgICAgIGFjY3VtLnB1c2gobW9kTmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwgW10pXG4gICAgOiBbXTtcbiAgLy8gVGhlIHByZXNlbmNlIG9mIGEgbW9kcyBmb2xkZXIgaW5kaWNhdGVzIHRoYXQgdGhpcyBtb2QgbWF5IHByb3ZpZGVcbiAgLy8gIHNldmVyYWwgbW9kIGVudHJpZXMuXG4gIGlmIChtb2RGaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgb3RoZXJGaWxlcyA9IG90aGVyRmlsZXMuZmlsdGVyKGZpbGUgPT4gIW1vZEZpbGVzLmluY2x1ZGVzKGZpbGUpKTtcbiAgfVxuXG4gIC8vIFdlJ3JlIGhvcGluZyB0aGF0IHRoZSBtb2QgYXV0aG9yIGhhcyBpbmNsdWRlZCB0aGUgbW9kIG5hbWUgaW4gdGhlIGFyY2hpdmUnc1xuICAvLyAgc3RydWN0dXJlIC0gaWYgaGUgZGlkbid0IC0gd2UncmUgZ29pbmcgdG8gdXNlIHRoZSBkZXN0aW5hdGlvbiBwYXRoIGluc3RlYWQuXG4gIGNvbnN0IG1vZE5hbWUgPSAoYmluSWR4ID4gMClcbiAgICA/IGlucHV0RmlsZXNbMF0uc3BsaXQocGF0aC5zZXApW2JpbklkeCAtIDFdXG4gICAgOiAoJ21vZCcgKyBwYXRoLmJhc2VuYW1lKGRlc3RpbmF0aW9uUGF0aCwgJy5pbnN0YWxsaW5nJykpLnJlcGxhY2UoL1xccy9nLCAnJyk7XG5cbiAgY29uc3QgdHJpbW1lZEZpbGVzID0gb3RoZXJGaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgY29uc3Qgc291cmNlID0gZmlsZTtcbiAgICBsZXQgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApXG4gICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGJpbklkeCk7XG4gICAgaWYgKHJlbFBhdGhbMF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVGhpcyBmaWxlIG11c3QndmUgYmVlbiBpbnNpZGUgdGhlIHJvb3Qgb2YgdGhlIGFyY2hpdmU7XG4gICAgICAvLyAgZGVwbG95IGFzIGlzLlxuICAgICAgcmVsUGF0aCA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0U2VnID0gcmVsUGF0aFswXS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChmaXJzdFNlZyA9PT0gJ2NvbnRlbnQnIHx8IGZpcnN0U2VnLmVuZHNXaXRoKFBBUlRfU1VGRklYKSkge1xuICAgICAgcmVsUGF0aCA9IFtdLmNvbmNhdChbJ01vZHMnLCBtb2ROYW1lXSwgcmVsUGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNvdXJjZSxcbiAgICAgIHJlbFBhdGg6IHJlbFBhdGguam9pbihwYXRoLnNlcCksXG4gICAgfTtcbiAgfSk7XG5cbiAgY29uc3QgdG9Db3B5SW5zdHJ1Y3Rpb24gPSAoc291cmNlLCBkZXN0aW5hdGlvbikgPT4gKHtcbiAgICB0eXBlOiAnY29weScsXG4gICAgc291cmNlLFxuICAgIGRlc3RpbmF0aW9uLFxuICB9KTtcblxuICBjb25zdCBpbnB1dEluc3RydWN0aW9ucyA9IHVuaXF1ZUlucHV0Lm1hcChmaWxlID0+XG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZSwgcGF0aC5qb2luKGlucHV0RmlsZURlc3RpbmF0aW9uLCBwYXRoLmJhc2VuYW1lKGZpbGUpKSkpO1xuXG4gIGNvbnN0IG90aGVySW5zdHJ1Y3Rpb25zID0gdHJpbW1lZEZpbGVzLm1hcChmaWxlID0+XG4gICAgdG9Db3B5SW5zdHJ1Y3Rpb24oZmlsZS5zb3VyY2UsIGZpbGUucmVsUGF0aCkpO1xuXG4gIGNvbnN0IG1vZEZpbGVJbnN0cnVjdGlvbnMgPSBtb2RGaWxlcy5tYXAoZmlsZSA9PlxuICAgIHRvQ29weUluc3RydWN0aW9uKGZpbGUsIGZpbGUpKTtcblxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBbXS5jb25jYXQoaW5wdXRJbnN0cnVjdGlvbnMsIG90aGVySW5zdHJ1Y3Rpb25zLCBtb2RGaWxlSW5zdHJ1Y3Rpb25zKTtcbiAgaWYgKG1vZE5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICBpbnN0cnVjdGlvbnMucHVzaCh7XG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICAgIGtleTogJ21vZENvbXBvbmVudHMnLFxuICAgICAgdmFsdWU6IG1vZE5hbWVzLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmZ1bmN0aW9uIHRlc3RNZW51TW9kUm9vdChpbnN0cnVjdGlvbnM6IGFueVtdLCBnYW1lSWQ6IHN0cmluZyk6XG4gIFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdCB8IGJvb2xlYW4+IHtcbiAgY29uc3QgcHJlZGljYXRlID0gKGluc3RyKSA9PiAoISFnYW1lSWQpXG4gICAgPyAoKEdBTUVfSUQgPT09IGdhbWVJZCkgJiYgKGluc3RyLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKSlcbiAgICA6ICgoaW5zdHIudHlwZSA9PT0gJ2NvcHknKSAmJiAoaW5zdHIuZGVzdGluYXRpb24uaW5kZXhPZihDT05GSUdfTUFUUklYX1JFTF9QQVRIKSAhPT0gLTEpKTtcblxuICByZXR1cm4gKCEhZ2FtZUlkKVxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgc3VwcG9ydGVkOiBpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQsXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICAgICAgfSlcbiAgICA6IFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChwcmVkaWNhdGUpICE9PSB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiB0ZXN0VEwoaW5zdHJ1Y3Rpb25zKSB7XG4gIGNvbnN0IG1lbnVNb2RGaWxlcyA9IGluc3RydWN0aW9ucy5maWx0ZXIoaW5zdHIgPT4gISFpbnN0ci5kZXN0aW5hdGlvblxuICAgICYmIGluc3RyLmRlc3RpbmF0aW9uLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKTtcbiAgaWYgKG1lbnVNb2RGaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxuICAgIGluc3RydWN0aW9uID0+ICEhaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24gJiYgaW5zdHJ1Y3Rpb24uZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdtb2RzJyArIHBhdGguc2VwKSxcbiAgKSAhPT0gdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gdGVzdERMQyhpbnN0cnVjdGlvbnMpIHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChcbiAgICBpbnN0cnVjdGlvbiA9PiAhIWluc3RydWN0aW9uLmRlc3RpbmF0aW9uICYmIGluc3RydWN0aW9uLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZGxjJyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKSB7XG4gIGNvbnN0IG5vdGlmSWQgPSAnbWlzc2luZy1zY3JpcHQtbWVyZ2VyJztcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIGlkOiBub3RpZklkLFxuICAgIHR5cGU6ICdpbmZvJyxcbiAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdXaXRjaGVyIDMgc2NyaXB0IG1lcmdlciBpcyBtaXNzaW5nL21pc2NvbmZpZ3VyZWQnLFxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcbiAgICBhY3Rpb25zOiBbXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyJywge1xuICAgICAgICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdWb3J0ZXggaXMgdW5hYmxlIHRvIHJlc29sdmUgdGhlIFNjcmlwdCBNZXJnZXJcXCdzIGxvY2F0aW9uLiBUaGUgdG9vbCBuZWVkcyB0byBiZSBkb3dubG9hZGVkIGFuZCBjb25maWd1cmVkIG1hbnVhbGx5LiAnXG4gICAgICAgICAgICAgICsgJ1t1cmw9aHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL1Rvb2xfU2V0dXA6X1dpdGNoZXJfM19TY3JpcHRfTWVyZ2VyXUZpbmQgb3V0IG1vcmUgYWJvdXQgaG93IHRvIGNvbmZpZ3VyZSBpdCBhcyBhIHRvb2wgZm9yIHVzZSBpbiBWb3J0ZXguWy91cmxdW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgICAgICAgICArICdOb3RlOiBXaGlsZSBzY3JpcHQgbWVyZ2luZyB3b3JrcyB3ZWxsIHdpdGggdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kcywgdGhlcmUgaXMgbm8gZ3VhcmFudGVlIGZvciBhIHNhdGlzZnlpbmcgb3V0Y29tZSBpbiBldmVyeSBzaW5nbGUgY2FzZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcbiAgICAgICAgICB9LCBbXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKTtcbiAgICAgICAgICAgIH19LFxuICAgICAgICAgICAgeyBsYWJlbDogJ0Rvd25sb2FkIFNjcmlwdCBNZXJnZXInLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3dpdGNoZXIzL21vZHMvNDg0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKSkgfSxcbiAgICAgICAgICBdKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkge1xuICBjb25zdCBmaW5kU2NyaXB0TWVyZ2VyID0gYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBzY3JpcHQgbWVyZ2VyJywgZXJyb3IpO1xuICAgIGNvbnN0IHNjcmlwdE1lcmdlclBhdGggPSBhd2FpdCBnZXRTY3JpcHRNZXJnZXJEaXIoY29udGV4dCk7XG4gICAgaWYgKHNjcmlwdE1lcmdlclBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBzZXRNZXJnZXJDb25maWcoZGlzY292ZXJ5LnBhdGgsIHNjcmlwdE1lcmdlclBhdGgpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBjb25zdCBlbnN1cmVQYXRoID0gKGRpcnBhdGgpID0+XG4gICAgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhkaXJwYXRoKVxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFRVhJU1QnKVxuICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICBlbnN1cmVQYXRoKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSksXG4gICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKSksXG4gICAgZW5zdXJlUGF0aChwYXRoLmRpcm5hbWUoZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKSkpXSlcbiAgICAgIC50aGVuKCgpID0+IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGNvbnRleHQpXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgICA6IGZpbmRTY3JpcHRNZXJnZXIoZXJyKSkpO1xufVxuXG5mdW5jdGlvbiBnZXRTY3JpcHRNZXJnZXJUb29sKGFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBzY3JpcHRNZXJnZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XG4gIGlmICghIXNjcmlwdE1lcmdlcj8ucGF0aCkge1xuICAgIHJldHVybiBzY3JpcHRNZXJnZXI7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBydW5TY3JpcHRNZXJnZXIoYXBpKSB7XG4gIGNvbnN0IHRvb2wgPSBnZXRTY3JpcHRNZXJnZXJUb29sKGFwaSk7XG4gIGlmICh0b29sPy5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgcmV0dXJuIGFwaS5ydW5FeGVjdXRhYmxlKHRvb2wucGF0aCwgW10sIHsgc3VnZ2VzdERlcGxveTogdHJ1ZSB9KVxuICAgIC5jYXRjaChlcnIgPT4gYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJ1biB0b29sJywgZXJyLFxuICAgICAgeyBhbGxvd1JlcG9ydDogWydFUEVSTScsICdFQUNDRVNTJywgJ0VOT0VOVCddLmluZGV4T2YoZXJyLmNvZGUpICE9PSAtMSB9KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFsbE1vZHMoY29udGV4dCkge1xuICAvLyBNb2QgdHlwZXMgd2UgZG9uJ3Qgd2FudCB0byBkaXNwbGF5IGluIHRoZSBMTyBwYWdlXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIG1lcmdlZDogW10sXG4gICAgICBtYW51YWw6IFtdLFxuICAgICAgbWFuYWdlZDogW10sXG4gICAgfSk7XG4gIH1cbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcblxuICAvLyBPbmx5IHNlbGVjdCBtb2RzIHdoaWNoIGFyZSBlbmFibGVkLCBhbmQgYXJlIG5vdCBhIG1lbnUgbW9kLlxuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZFN0YXRlKS5maWx0ZXIoa2V5ID0+XG4gICAgKCEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSkpO1xuXG4gIGNvbnN0IG1lcmdlZE1vZE5hbWVzID0gYXdhaXQgZ2V0TWVyZ2VkTW9kTmFtZXMoY29udGV4dCk7XG4gIGNvbnN0IG1hbnVhbGx5QWRkZWRNb2RzID0gYXdhaXQgZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCk7XG4gIGNvbnN0IG1hbmFnZWRNb2RzID0gYXdhaXQgZ2V0TWFuYWdlZE1vZE5hbWVzKGNvbnRleHQsIGVuYWJsZWRNb2RzLm1hcChrZXkgPT4gbW9kc1trZXldKSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgIG1lcmdlZDogbWVyZ2VkTW9kTmFtZXMsXG4gICAgbWFudWFsOiBtYW51YWxseUFkZGVkTW9kcy5maWx0ZXIobW9kID0+ICFtZXJnZWRNb2ROYW1lcy5pbmNsdWRlcyhtb2QpKSxcbiAgICBtYW5hZ2VkOiBtYW5hZ2VkTW9kcyxcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNldElOSVN0cnVjdChjb250ZXh0LCBsb2FkT3JkZXIsIHByaW9yaXR5TWFuYWdlcikge1xuICByZXR1cm4gZ2V0QWxsTW9kcyhjb250ZXh0KS50aGVuKG1vZE1hcCA9PiB7XG4gICAgX0lOSV9TVFJVQ1QgPSB7fTtcbiAgICBjb25zdCBtb2RzID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1vZE1hcC5tYW5hZ2VkLCBtb2RNYXAubWFudWFsKTtcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihpc0xvY2tlZEVudHJ5KTtcbiAgICBjb25zdCBtYW5hZ2VkTG9ja2VkID0gbW9kTWFwLm1hbmFnZWRcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gaXNMb2NrZWRFbnRyeShlbnRyeS5uYW1lKSlcbiAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSk7XG4gICAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkLCBtYW5hZ2VkTG9ja2VkKTtcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChtb2RzLCAobW9kLCBpZHgpID0+IHtcbiAgICAgIGxldCBuYW1lO1xuICAgICAgbGV0IGtleTtcbiAgICAgIGlmICh0eXBlb2YobW9kKSA9PT0gJ29iamVjdCcgJiYgbW9kICE9PSBudWxsKSB7XG4gICAgICAgIG5hbWUgPSBtb2QubmFtZTtcbiAgICAgICAga2V5ID0gbW9kLmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmFtZSA9IG1vZDtcbiAgICAgICAga2V5ID0gbW9kO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBMT0VudHJ5ID0gdXRpbC5nZXRTYWZlKGxvYWRPcmRlciwgW2tleV0sIHVuZGVmaW5lZCk7XG4gICAgICBpZiAoaWR4ID09PSAwKSB7XG4gICAgICAgIHByaW9yaXR5TWFuYWdlci5yZXNldE1heFByaW9yaXR5KHRvdGFsTG9ja2VkLmxlbmd0aCk7XG4gICAgICB9XG4gICAgICBfSU5JX1NUUlVDVFtuYW1lXSA9IHtcbiAgICAgICAgLy8gVGhlIElOSSBmaWxlJ3MgZW5hYmxlZCBhdHRyaWJ1dGUgZXhwZWN0cyAxIG9yIDBcbiAgICAgICAgRW5hYmxlZDogKExPRW50cnkgIT09IHVuZGVmaW5lZCkgPyBMT0VudHJ5LmVuYWJsZWQgPyAxIDogMCA6IDEsXG4gICAgICAgIFByaW9yaXR5OiB0b3RhbExvY2tlZC5pbmNsdWRlcyhuYW1lKVxuICAgICAgICAgID8gdG90YWxMb2NrZWQuaW5kZXhPZihuYW1lKVxuICAgICAgICAgIDogcHJpb3JpdHlNYW5hZ2VyLmdldFByaW9yaXR5KHsgaWQ6IGtleSB9KSxcbiAgICAgICAgVks6IGtleSxcbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpc0xvY2tlZEVudHJ5KG1vZE5hbWU6IHN0cmluZykge1xuICAvLyBXZSdyZSBhZGRpbmcgdGhpcyB0byBhdm9pZCBoYXZpbmcgdGhlIGxvYWQgb3JkZXIgcGFnZVxuICAvLyAgZnJvbSBub3QgbG9hZGluZyBpZiB3ZSBlbmNvdW50ZXIgYW4gaW52YWxpZCBtb2QgbmFtZS5cbiAgaWYgKCFtb2ROYW1lIHx8IHR5cGVvZihtb2ROYW1lKSAhPT0gJ3N0cmluZycpIHtcbiAgICBsb2coJ2RlYnVnJywgJ2VuY291bnRlcmVkIGludmFsaWQgbW9kIGluc3RhbmNlL25hbWUnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcbn1cblxubGV0IHJlZnJlc2hGdW5jO1xuLy8gaXRlbTogSUxvYWRPcmRlckRpc3BsYXlJdGVtXG5mdW5jdGlvbiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgaXRlbTogdHlwZXMuSUxvYWRPcmRlckRpc3BsYXlJdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgIG1pblByaW9yaXR5OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgb25TZXRQcmlvcml0eTogKGtleTogc3RyaW5nLCBwcmlvcml0eTogbnVtYmVyKSA9PiB2b2lkKSB7XG4gIGNvbnN0IHByaW9yaXR5SW5wdXREaWFsb2cgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBCbHVlYmlyZCgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmlvcml0eScsIHtcbiAgICAgICAgdGV4dDogY29udGV4dC5hcGkudHJhbnNsYXRlKCdJbnNlcnQgbmV3IG51bWVyaWNhbCBwcmlvcml0eSBmb3Ige3tpdGVtTmFtZX19IGluIHRoZSBpbnB1dCBib3g6JywgeyByZXBsYWNlOiB7IGl0ZW1OYW1lOiBpdGVtLm5hbWUgfSB9KSxcbiAgICAgICAgaW5wdXQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ3czUHJpb3JpdHlJbnB1dCcsXG4gICAgICAgICAgICBsYWJlbDogJ1ByaW9yaXR5JyxcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IF9JTklfU1RSVUNUW2l0ZW0uaWRdPy5Qcmlvcml0eSB8fCAwLFxuICAgICAgICAgIH1dLFxuICAgICAgfSwgWyB7IGxhYmVsOiAnQ2FuY2VsJyB9LCB7IGxhYmVsOiAnU2V0JywgZGVmYXVsdDogdHJ1ZSB9IF0pXG4gICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ1NldCcpIHtcbiAgICAgICAgICBjb25zdCBpdGVtS2V5ID0gT2JqZWN0LmtleXMoX0lOSV9TVFJVQ1QpLmZpbmQoa2V5ID0+IF9JTklfU1RSVUNUW2tleV0uVksgPT09IGl0ZW0uaWQpO1xuICAgICAgICAgIGNvbnN0IHdhbnRlZFByaW9yaXR5ID0gcmVzdWx0LmlucHV0Wyd3M1ByaW9yaXR5SW5wdXQnXTtcbiAgICAgICAgICBpZiAod2FudGVkUHJpb3JpdHkgPD0gbWluUHJpb3JpdHkpIHtcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignQ2hvc2VuIHByaW9yaXR5IGlzIGFscmVhZHkgYXNzaWduZWQgdG8gYSBsb2NrZWQgZW50cnknLFxuICAgICAgICAgICAgICB3YW50ZWRQcmlvcml0eS50b1N0cmluZygpLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpdGVtS2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIF9JTklfU1RSVUNUW2l0ZW1LZXldLlByaW9yaXR5ID0gcGFyc2VJbnQod2FudGVkUHJpb3JpdHksIDEwKTtcbiAgICAgICAgICAgIG9uU2V0UHJpb3JpdHkoaXRlbUtleSwgd2FudGVkUHJpb3JpdHkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBzZXQgcHJpb3JpdHkgLSBtb2QgaXMgbm90IGluIGluaSBzdHJ1Y3QnLCB7IG1vZElkOiBpdGVtLmlkIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG4gIGNvbnN0IGl0ZW1BY3Rpb25zID0gW1xuICAgIHtcbiAgICAgIHNob3c6IGl0ZW0ubG9ja2VkICE9PSB0cnVlLFxuICAgICAgdGl0bGU6ICdTZXQgTWFudWFsIFByaW9yaXR5JyxcbiAgICAgIGFjdGlvbjogKCkgPT4gcHJpb3JpdHlJbnB1dERpYWxvZygpLFxuICAgIH0sXG4gIF07XG5cbiAgcmV0dXJuIGl0ZW1BY3Rpb25zO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIHByaW9yaXR5TWFuYWdlcik6IFByb21pc2U8YW55W10+IHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCB7IGdldFByaW9yaXR5LCByZXNldE1heFByaW9yaXR5IH0gPSBwcmlvcml0eU1hbmFnZXI7XG4gIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gV2hhdCBhbiBvZGQgdXNlIGNhc2UgLSBwZXJoYXBzIHRoZSB1c2VyIGhhZCBzd2l0Y2hlZCBnYW1lTW9kZXMgb3JcbiAgICAvLyAgZXZlbiBkZWxldGVkIGhpcyBwcm9maWxlIGR1cmluZyB0aGUgcHJlLXNvcnQgZnVuY3Rpb25hbGl0eSA/XG4gICAgLy8gIE9kZCBidXQgcGxhdXNpYmxlIEkgc3VwcG9zZSA/XG4gICAgbG9nKCd3YXJuJywgJ1tXM10gdW5hYmxlIHRvIHByZXNvcnQgZHVlIHRvIG5vIGFjdGl2ZSBwcm9maWxlJyk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gIH1cblxuICBsZXQgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcbiAgY29uc3Qgb25TZXRQcmlvcml0eSA9IChpdGVtS2V5LCB3YW50ZWRQcmlvcml0eSkgPT4ge1xuICAgIHJldHVybiB3cml0ZVRvTW9kU2V0dGluZ3MoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB3YW50ZWRQcmlvcml0eSA9ICt3YW50ZWRQcmlvcml0eTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgICAgICBjb25zdCBtb2RJZCA9IF9JTklfU1RSVUNUW2l0ZW1LZXldLlZLO1xuICAgICAgICBjb25zdCBsb0VudHJ5ID0gbG9hZE9yZGVyW21vZElkXTtcbiAgICAgICAgaWYgKHByaW9yaXR5TWFuYWdlci5wcmlvcml0eVR5cGUgPT09ICdwb3NpdGlvbi1iYXNlZCcpIHtcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlckVudHJ5KFxuICAgICAgICAgICAgYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHtcbiAgICAgICAgICAgICAgLi4ubG9FbnRyeSxcbiAgICAgICAgICAgICAgcG9zOiAobG9FbnRyeS5wb3MgPCB3YW50ZWRQcmlvcml0eSkgPyB3YW50ZWRQcmlvcml0eSA6IHdhbnRlZFByaW9yaXR5IC0gMixcbiAgICAgICAgICB9KSk7XG4gICAgICAgICAgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgYWN0aXZlUHJvZmlsZS5pZF0sIHt9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlckVudHJ5KFxuICAgICAgICAgICAgYWN0aXZlUHJvZmlsZS5pZCwgbW9kSWQsIHtcbiAgICAgICAgICAgICAgLi4ubG9FbnRyeSxcbiAgICAgICAgICAgICAgcHJlZml4OiBwYXJzZUludChfSU5JX1NUUlVDVFtpdGVtS2V5XS5Qcmlvcml0eSwgMTApLFxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVmcmVzaEZ1bmMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJlZnJlc2hGdW5jKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcbiAgICAgICAgJ0ZhaWxlZCB0byBtb2RpZnkgbG9hZCBvcmRlciBmaWxlJykpO1xuICB9O1xuICBjb25zdCBhbGxNb2RzID0gYXdhaXQgZ2V0QWxsTW9kcyhjb250ZXh0KTtcbiAgaWYgKChhbGxNb2RzLm1lcmdlZC5sZW5ndGggPT09IDApICYmIChhbGxNb2RzLm1hbnVhbC5sZW5ndGggPT09IDApKSB7XG4gICAgaXRlbXMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgIGlmIChpZHggPT09IDApIHtcbiAgICAgICAgcmVzZXRNYXhQcmlvcml0eSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgMCwgb25TZXRQcmlvcml0eSksXG4gICAgICAgIHByZWZpeDogZ2V0UHJpb3JpdHkoaXRlbSksXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgbG9ja2VkTW9kcyA9IFtdLmNvbmNhdChhbGxNb2RzLm1hbnVhbC5maWx0ZXIoaXNMb2NrZWRFbnRyeSksXG4gICAgYWxsTW9kcy5tYW5hZ2VkLmZpbHRlcihlbnRyeSA9PiBpc0xvY2tlZEVudHJ5KGVudHJ5Lm5hbWUpKVxuICAgICAgICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSkpO1xuICBjb25zdCByZWFkYWJsZU5hbWVzID0ge1xuICAgIFtVTklfUEFUQ0hdOiAnVW5pZmljYXRpb24vQ29tbXVuaXR5IFBhdGNoJyxcbiAgfTtcblxuICBjb25zdCBsb2NrZWRFbnRyaWVzID0gW10uY29uY2F0KGFsbE1vZHMubWVyZ2VkLCBsb2NrZWRNb2RzKVxuICAgIC5yZWR1Y2UoKGFjY3VtLCBtb2ROYW1lLCBpZHgpID0+IHtcbiAgICAgIGNvbnN0IG9iaiA9IHtcbiAgICAgICAgaWQ6IG1vZE5hbWUsXG4gICAgICAgIG5hbWU6ICEhcmVhZGFibGVOYW1lc1ttb2ROYW1lXSA/IHJlYWRhYmxlTmFtZXNbbW9kTmFtZV0gOiBtb2ROYW1lLFxuICAgICAgICBpbWdVcmw6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxuICAgICAgICBsb2NrZWQ6IHRydWUsXG4gICAgICAgIHByZWZpeDogaWR4ICsgMSxcbiAgICAgIH07XG5cbiAgICAgIGlmICghYWNjdW0uZmluZChhY2MgPT4gb2JqLmlkID09PSBhY2MuaWQpKSB7XG4gICAgICAgIGFjY3VtLnB1c2gob2JqKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFtdKTtcblxuICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihpdGVtID0+ICFhbGxNb2RzLm1lcmdlZC5pbmNsdWRlcyhpdGVtLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFhbGxNb2RzLm1hbnVhbC5pbmNsdWRlcyhpdGVtLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICFhbGxNb2RzLm1hbmFnZWQuZmluZChtb2QgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobW9kLm5hbWUgPT09IFVOSV9QQVRDSCkgJiYgKG1vZC5pZCA9PT0gaXRlbS5pZCkpKVxuICAgICAgICAgICAgICAgLm1hcCgoaXRlbSwgaWR4KSA9PiB7XG4gICAgaWYgKGlkeCA9PT0gMCkge1xuICAgICAgcmVzZXRNYXhQcmlvcml0eShsb2NrZWRFbnRyaWVzLmxlbmd0aCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAuLi5pdGVtLFxuICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgbG9ja2VkRW50cmllcy5sZW5ndGgsIG9uU2V0UHJpb3JpdHkpLFxuICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcbiAgICB9O1xuICB9KTtcblxuICBjb25zdCBtYW51YWxFbnRyaWVzID0gYWxsTW9kcy5tYW51YWxcbiAgICAuZmlsdGVyKGtleSA9PlxuICAgICAgICAgKGxvY2tlZEVudHJpZXMuZmluZChlbnRyeSA9PiBlbnRyeS5pZCA9PT0ga2V5KSA9PT0gdW5kZWZpbmVkKVxuICAgICAgJiYgKGFsbE1vZHMubWFuYWdlZC5maW5kKGVudHJ5ID0+IGVudHJ5LmlkID09PSBrZXkpID09PSB1bmRlZmluZWQpKVxuICAgIC5tYXAoa2V5ID0+IHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB7XG4gICAgICAgIGlkOiBrZXksXG4gICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgaW1nVXJsOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcbiAgICAgICAgZXh0ZXJuYWw6IHRydWUsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgcHJlZml4OiBnZXRQcmlvcml0eShpdGVtKSxcbiAgICAgICAgY29udGV4dE1lbnVBY3Rpb25zOiBnZW5FbnRyeUFjdGlvbnMoY29udGV4dCwgaXRlbSwgbG9ja2VkRW50cmllcy5sZW5ndGgsIG9uU2V0UHJpb3JpdHkpLFxuICAgICAgfTtcbiAgfSk7XG5cbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcik7XG4gIGNvbnN0IGtub3duTWFudWFsbHlBZGRlZCA9IG1hbnVhbEVudHJpZXMuZmlsdGVyKGVudHJ5ID0+IGtleXMuaW5jbHVkZXMoZW50cnkuaWQpKSB8fCBbXTtcbiAgY29uc3QgdW5rbm93bk1hbnVhbGx5QWRkZWQgPSBtYW51YWxFbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAha2V5cy5pbmNsdWRlcyhlbnRyeS5pZCkpIHx8IFtdO1xuICBjb25zdCBmaWx0ZXJlZE9yZGVyID0ga2V5c1xuICAgIC5maWx0ZXIoa2V5ID0+IGxvY2tlZEVudHJpZXMuZmluZChpdGVtID0+IGl0ZW0uaWQgPT09IGtleSkgPT09IHVuZGVmaW5lZClcbiAgICAucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XG4gICAgICBhY2N1bVtrZXldID0gbG9hZE9yZGVyW2tleV07XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwgW10pO1xuICBrbm93bk1hbnVhbGx5QWRkZWQuZm9yRWFjaChrbm93biA9PiB7XG4gICAgY29uc3QgZGlmZiA9IGtleXMubGVuZ3RoIC0gT2JqZWN0LmtleXMoZmlsdGVyZWRPcmRlcikubGVuZ3RoO1xuXG4gICAgY29uc3QgcG9zID0gZmlsdGVyZWRPcmRlcltrbm93bi5pZF0ucG9zIC0gZGlmZjtcbiAgICBpdGVtcyA9IFtdLmNvbmNhdChpdGVtcy5zbGljZSgwLCBwb3MpIHx8IFtdLCBrbm93biwgaXRlbXMuc2xpY2UocG9zKSB8fCBbXSk7XG4gIH0pO1xuXG4gIGxldCBwcmVTb3J0ZWQgPSBbXS5jb25jYXQoXG4gICAgLi4ubG9ja2VkRW50cmllcyxcbiAgICBpdGVtcy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICBpZiAodHlwZW9mKGl0ZW0/Lm5hbWUpICE9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCBpc0xvY2tlZCA9IGxvY2tlZEVudHJpZXMuZmluZChsb2NrZWQgPT4gbG9ja2VkLm5hbWUgPT09IGl0ZW0ubmFtZSkgIT09IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IGRvTm90RGlzcGxheSA9IERPX05PVF9ESVNQTEFZLmluY2x1ZGVzKGl0ZW0ubmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIHJldHVybiAhaXNMb2NrZWQgJiYgIWRvTm90RGlzcGxheTtcbiAgICB9KSxcbiAgICAuLi51bmtub3duTWFudWFsbHlBZGRlZCk7XG5cbiAgY29uc3QgaXNFeHRlcm5hbCA9IChlbnRyeSkgPT4ge1xuICAgIHJldHVybiAoKGVudHJ5LmV4dGVybmFsID09PSB0cnVlKVxuICAgICAgJiYgKGFsbE1vZHMubWFuYWdlZC5maW5kKG1hbiA9PiBtYW4uaWQgPT09IGVudHJ5LmlkKSA9PT0gdW5kZWZpbmVkKSk7XG4gIH07XG4gIHByZVNvcnRlZCA9ICh1cGRhdGVUeXBlICE9PSAnZHJhZy1uLWRyb3AnKVxuICAgID8gcHJlU29ydGVkLnNvcnQoKGxocywgcmhzKSA9PiBsaHMucHJlZml4IC0gcmhzLnByZWZpeClcbiAgICA6IHByZVNvcnRlZC5yZWR1Y2UoKGFjY3VtLCBlbnRyeSwgaWR4KSA9PiB7XG4gICAgICAgIGlmIChsb2NrZWRFbnRyaWVzLmluZGV4T2YoZW50cnkpICE9PSAtMSB8fCBpZHggPT09IDApIHtcbiAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwcmV2UHJlZml4ID0gcGFyc2VJbnQoYWNjdW1baWR4IC0gMV0ucHJlZml4LCAxMCk7XG4gICAgICAgICAgaWYgKHByZXZQcmVmaXggPj0gZW50cnkucHJlZml4KSB7XG4gICAgICAgICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgICAgICAgLi4uZW50cnksXG4gICAgICAgICAgICAgIGV4dGVybmFsOiBpc0V4dGVybmFsKGVudHJ5KSxcbiAgICAgICAgICAgICAgcHJlZml4OiBwcmV2UHJlZml4ICsgMSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY2N1bS5wdXNoKHsgLi4uZW50cnksIGV4dGVybmFsOiBpc0V4dGVybmFsKGVudHJ5KSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgfSwgW10pO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHByZVNvcnRlZCk7XG59XG5cbmZ1bmN0aW9uIGZpbmRNb2RGb2xkZXIoaW5zdGFsbGF0aW9uUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QpOiBCbHVlYmlyZDxzdHJpbmc+IHtcbiAgaWYgKCFpbnN0YWxsYXRpb25QYXRoIHx8ICFtb2Q/Lmluc3RhbGxhdGlvblBhdGgpIHtcbiAgICBjb25zdCBlcnJNZXNzYWdlID0gIWluc3RhbGxhdGlvblBhdGhcbiAgICAgID8gJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnXG4gICAgICA6ICdGYWlsZWQgdG8gcmVzb2x2ZSBtb2QgaW5zdGFsbGF0aW9uIHBhdGgnO1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IEVycm9yKGVyck1lc3NhZ2UpKTtcbiAgfVxuXG4gIGNvbnN0IGV4cGVjdGVkTW9kTmFtZUxvY2F0aW9uID0gWyd3aXRjaGVyM21lbnVtb2Ryb290JywgJ3dpdGNoZXIzdGwnXS5pbmNsdWRlcyhtb2QudHlwZSlcbiAgICA/IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgJ01vZHMnKVxuICAgIDogcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhleHBlY3RlZE1vZE5hbWVMb2NhdGlvbilcbiAgICAudGhlbihlbnRyaWVzID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzWzBdKSk7XG59XG5cbmZ1bmN0aW9uIGdldE1hbmFnZWRNb2ROYW1lcyhjb250ZXh0OiB0eXBlcy5JQ29tcG9uZW50Q29udGV4dCwgbW9kczogdHlwZXMuSU1vZFtdKSB7XG4gIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKG1vZHMsIChhY2N1bSwgbW9kKSA9PiBmaW5kTW9kRm9sZGVyKGluc3RhbGxhdGlvblBhdGgsIG1vZClcbiAgICAudGhlbihtb2ROYW1lID0+IHtcbiAgICAgIGlmICghbW9kTmFtZSB8fCBbJ2NvbGxlY3Rpb24nLCAndzNtb2RsaW1pdHBhdGNoZXInXS5pbmNsdWRlcyhtb2QudHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgICB9XG4gICAgICBjb25zdCBtb2RDb21wb25lbnRzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ21vZENvbXBvbmVudHMnXSwgW10pO1xuICAgICAgaWYgKG1vZENvbXBvbmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG1vZENvbXBvbmVudHMucHVzaChtb2ROYW1lKTtcbiAgICAgIH1cbiAgICAgIFsuLi5tb2RDb21wb25lbnRzXS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICAgIGlkOiBtb2QuaWQsXG4gICAgICAgICAgbmFtZToga2V5LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgfSlcbiAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHJlc29sdmUgbW9kIG5hbWUnLCBlcnIpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgfSksIFtdKTtcbn1cblxuY29uc3QgdG9nZ2xlTW9kc1N0YXRlID0gYXN5bmMgKGNvbnRleHQsIHByb3BzLCBlbmFibGVkKSA9PiB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHt9KTtcbiAgY29uc3QgbW9kTWFwID0gYXdhaXQgZ2V0QWxsTW9kcyhjb250ZXh0KTtcbiAgY29uc3QgbWFudWFsTG9ja2VkID0gbW9kTWFwLm1hbnVhbC5maWx0ZXIobW9kTmFtZSA9PiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkpO1xuICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQpO1xuICBjb25zdCBuZXdMTyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikucmVkdWNlKChhY2N1bSwga2V5KSA9PiB7XG4gICAgaWYgKHRvdGFsTG9ja2VkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgIGFjY3VtW2tleV0gPSBsb2FkT3JkZXJba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWNjdW1ba2V5XSA9IHtcbiAgICAgICAgLi4ubG9hZE9yZGVyW2tleV0sXG4gICAgICAgIGVuYWJsZWQsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8gYXMgYW55KSk7XG4gIHByb3BzLnJlZnJlc2goKTtcbn07XG5cbmZ1bmN0aW9uIGluZm9Db21wb25lbnQoY29udGV4dCwgcHJvcHMpOiBKU1guRWxlbWVudCB7XG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLCB7IGlkOiAnbG9hZG9yZGVyaW5mbycgfSxcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LCB0KCdNYW5hZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHsgc3R5bGU6IHsgaGVpZ2h0OiAnMzAlJyB9IH0sXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge30sXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdZb3UgY2FuIGFkanVzdCB0aGUgbG9hZCBvcmRlciBmb3IgVGhlIFdpdGNoZXIgMyBieSBkcmFnZ2luZyBhbmQgZHJvcHBpbmcgJ1xuICAgICAgKyAnbW9kcyB1cCBvciBkb3duIG9uIHRoaXMgcGFnZS4gIElmIHlvdSBhcmUgdXNpbmcgc2V2ZXJhbCBtb2RzIHRoYXQgYWRkIHNjcmlwdHMgeW91IG1heSBuZWVkIHRvIHVzZSAnXG4gICAgICArICd0aGUgV2l0Y2hlciAzIFNjcmlwdCBtZXJnZXIuIEZvciBtb3JlIGluZm9ybWF0aW9uIHNlZTogJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnYScsIHsgb25DbGljazogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Nb2RkaW5nX1RoZV9XaXRjaGVyXzNfd2l0aF9Wb3J0ZXgnKSB9LCB0KCdNb2RkaW5nIFRoZSBXaXRjaGVyIDMgd2l0aCBWb3J0ZXguJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSkpLFxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcbiAgICAgIHN0eWxlOiB7IGhlaWdodDogJzgwJScgfSxcbiAgICB9LFxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LCB0KCdQbGVhc2Ugbm90ZTonLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHt9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdGb3IgV2l0Y2hlciAzLCB0aGUgbW9kIHdpdGggdGhlIGxvd2VzdCBpbmRleCBudW1iZXIgKGJ5IGRlZmF1bHQsIHRoZSBtb2Qgc29ydGVkIGF0IHRoZSB0b3ApIG92ZXJyaWRlcyBtb2RzIHdpdGggYSBoaWdoZXIgaW5kZXggbnVtYmVyLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCB7fSwgdCgnWW91IGFyZSBhYmxlIHRvIG1vZGlmeSB0aGUgcHJpb3JpdHkgbWFudWFsbHkgYnkgcmlnaHQgY2xpY2tpbmcgYW55IExPIGVudHJ5IGFuZCBzZXQgdGhlIG1vZFxcJ3MgcHJpb3JpdHknLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ0lmIHlvdSBjYW5ub3Qgc2VlIHlvdXIgbW9kIGluIHRoaXMgbG9hZCBvcmRlciwgeW91IG1heSBuZWVkIHRvIGFkZCBpdCBtYW51YWxseSAoc2VlIG91ciB3aWtpIGZvciBkZXRhaWxzKS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ1doZW4gbWFuYWdpbmcgbWVudSBtb2RzLCBtb2Qgc2V0dGluZ3MgY2hhbmdlZCBpbnNpZGUgdGhlIGdhbWUgd2lsbCBiZSBkZXRlY3RlZCBieSBWb3J0ZXggYXMgZXh0ZXJuYWwgY2hhbmdlcyAtIHRoYXQgaXMgZXhwZWN0ZWQsICdcbiAgICAgICAgICArICdjaG9vc2UgdG8gdXNlIHRoZSBuZXdlciBmaWxlIGFuZCB5b3VyIHNldHRpbmdzIHdpbGwgYmUgbWFkZSBwZXJzaXN0ZW50LicsXG4gICAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIHt9LCB0KCdZb3UgY2FuIGNoYW5nZSB0aGUgd2F5IHRoZSBwcmlvcml0aWVzIGFyZSBhc3NnaW5lZCB1c2luZyB0aGUgXCJTd2l0Y2ggVG8gUG9zaXRpb24vUHJlZml4IGJhc2VkXCIgYnV0dG9uLiAnXG4gICAgICAgICAgKyAnUHJlZml4IGJhc2VkIGlzIGxlc3MgcmVzdHJpY3RpdmUgYW5kIGFsbG93cyB5b3UgdG8gc2V0IGFueSBwcmlvcml0eSB2YWx1ZSB5b3Ugd2FudCBcIjUwMDAsIDY5OTk5LCBldGNcIiB3aGlsZSBwb3NpdGlvbiBiYXNlZCB3aWxsICdcbiAgICAgICAgICArICdyZXN0cmljdCB0aGUgcHJpb3JpdGllcyB0byB0aGUgbnVtYmVyIG9mIGxvYWQgb3JkZXIgZW50cmllcyB0aGF0IGFyZSBhdmFpbGFibGUuJyxcbiAgICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywge30sIHQoJ01lcmdlcyBnZW5lcmF0ZWQgYnkgdGhlIFdpdGNoZXIgMyBTY3JpcHQgbWVyZ2VyIG11c3QgYmUgbG9hZGVkIGZpcnN0IGFuZCBhcmUgbG9ja2VkIGluIHRoZSBmaXJzdCBsb2FkIG9yZGVyIHNsb3QuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5CdXR0b24sIHtcbiAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB0b2dnbGVNb2RzU3RhdGUoY29udGV4dCwgcHJvcHMsIGZhbHNlKSxcbiAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnNXB4JyxcbiAgICAgICAgICAgIHdpZHRoOiAnbWluLWNvbnRlbnQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sIHQoJ0Rpc2FibGUgQWxsJykpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdicicpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkJ1dHRvbiwge1xuICAgICAgICAgIG9uQ2xpY2s6ICgpID0+IHRvZ2dsZU1vZHNTdGF0ZShjb250ZXh0LCBwcm9wcywgdHJ1ZSksXG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzVweCcsXG4gICAgICAgICAgICB3aWR0aDogJ21pbi1jb250ZW50JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LCB0KCdFbmFibGUgQWxsICcpKSwgW10pKTtcbn1cblxuZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZShjb250ZXh0LCByZWFzb24pIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKCEhc2NyaXB0TWVyZ2VyVG9vbD8ucGF0aCkge1xuICAgIGNvbnRleHQuYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgaWQ6ICd3aXRjaGVyMy1tZXJnZScsXG4gICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICBtZXNzYWdlOiBjb250ZXh0LmFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgU2NyaXB0IG1lcmdlciBtYXkgbmVlZCB0byBiZSBleGVjdXRlZCcsXG4gICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMycsIHtcbiAgICAgICAgICAgICAgdGV4dDogcmVhc29uLFxuICAgICAgICAgICAgfSwgW1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6ICdSdW4gdG9vbCcsXG4gICAgICAgICAgYWN0aW9uOiBkaXNtaXNzID0+IHtcbiAgICAgICAgICAgIHJ1blNjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XG4gICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihjb250ZXh0LmFwaSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FuTWVyZ2UoZ2FtZSwgZ2FtZURpc2NvdmVyeSkge1xuICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gKHtcbiAgICBiYXNlRmlsZXM6ICgpID0+IFtcbiAgICAgIHtcbiAgICAgICAgaW46IHBhdGguam9pbihnYW1lRGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXG4gICAgICAgIG91dDogcGF0aC5qb2luKENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSksXG4gICAgICB9LFxuICAgIF0sXG4gICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBmaWxlUGF0aC5lbmRzV2l0aChJTlBVVF9YTUxfRklMRU5BTUUpLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVhZElucHV0RmlsZShjb250ZXh0LCBtZXJnZURpcikge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGNvbnN0IGdhbWVJbnB1dEZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBJTlBVVF9YTUxfRklMRU5BTUUpO1xuICByZXR1cm4gKCEhZGlzY292ZXJ5Py5wYXRoKVxuICAgID8gZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4obWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIElOUFVUX1hNTF9GSUxFTkFNRSkpXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXG4gICAgICAgID8gZnMucmVhZEZpbGVBc3luYyhnYW1lSW5wdXRGaWxlcGF0aClcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKVxuICAgIDogUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xufVxuXG5jb25zdCBlbXB0eVhtbCA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz48bWV0YWRhdGE+PC9tZXRhZGF0YT4nO1xuZnVuY3Rpb24gbWVyZ2UoZmlsZVBhdGgsIG1lcmdlRGlyLCBjb250ZXh0KSB7XG4gIGxldCBtb2REYXRhO1xuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aClcbiAgICAudGhlbihhc3luYyB4bWxEYXRhID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG1vZERhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoeG1sRGF0YSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBUaGUgbW9kIGl0c2VsZiBoYXMgaW52YWxpZCB4bWwgZGF0YS5cbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIG1vZCBYTUwgZGF0YSAtIGluZm9ybSBtb2QgYXV0aG9yJyxcbiAgICAgICAgeyBwYXRoOiBmaWxlUGF0aCwgZXJyb3I6IGVyci5tZXNzYWdlIH0sIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICBtb2REYXRhID0gZW1wdHlYbWw7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHJlYWRJbnB1dEZpbGUoY29udGV4dCwgbWVyZ2VEaXIpKVxuICAgIC50aGVuKGFzeW5jIG1lcmdlZERhdGEgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbWVyZ2VkID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKG1lcmdlZERhdGEpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlZCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgbWVyZ2VkIGZpbGUgLSBpZiBpdCdzIGludmFsaWQgY2hhbmNlcyBhcmUgd2UgbWVzc2VkIHVwXG4gICAgICAgIC8vICBzb21laG93LCByZWFzb24gd2h5IHdlJ3JlIGdvaW5nIHRvIGFsbG93IHRoaXMgZXJyb3IgdG8gZ2V0IHJlcG9ydGVkLlxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gICAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XG4gICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBtZXJnZWQgWE1MIGRhdGEnLCBlcnIsIHtcbiAgICAgICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcbiAgICAgICAgICBhdHRhY2htZW50czogW1xuICAgICAgICAgICAgeyBpZDogJ19fbWVyZ2VkL2lucHV0LnhtbCcsIHR5cGU6ICdkYXRhJywgZGF0YTogbWVyZ2VkRGF0YSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaXRjaGVyIDMgbWVudSBtb2QgbWVyZ2VkIGRhdGEnIH0sXG4gICAgICAgICAgICB7IGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9sb2FkT3JkZXJgLCB0eXBlOiAnZGF0YScsIGRhdGE6IGxvYWRPcmRlcixcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDdXJyZW50IGxvYWQgb3JkZXInIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBtZXJnZWQgWE1MIGRhdGEnKSk7XG4gICAgICB9XG4gICAgfSlcbiAgICAudGhlbihnYW1lSW5kZXhGaWxlID0+IHtcbiAgICAgIGNvbnN0IG1vZEdyb3VwcyA9IG1vZERhdGE/LlVzZXJDb25maWc/Lkdyb3VwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZ2FtZUdyb3VwcyA9IGdhbWVJbmRleEZpbGU/LlVzZXJDb25maWc/Lkdyb3VwO1xuICAgICAgICBjb25zdCBpdGVyID0gbW9kR3JvdXBzW2ldO1xuICAgICAgICBjb25zdCBtb2RWYXJzID0gaXRlcj8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xuICAgICAgICBjb25zdCBnYW1lR3JvdXBJZHggPSBnYW1lR3JvdXBzLmZpbmRJbmRleChncm91cCA9PiBncm91cD8uJD8uaWQgPT09IGl0ZXI/LiQ/LmlkKTtcbiAgICAgICAgaWYgKGdhbWVHcm91cElkeCAhPT0gLTEpIHtcbiAgICAgICAgICBjb25zdCBnYW1lR3JvdXAgPSBnYW1lR3JvdXBzW2dhbWVHcm91cElkeF07XG4gICAgICAgICAgY29uc3QgZ2FtZVZhcnMgPSBnYW1lR3JvdXA/LlZpc2libGVWYXJzPy5bMF0/LlZhcjtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG1vZFZhcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG1vZFZhciA9IG1vZFZhcnNbal07XG4gICAgICAgICAgICBjb25zdCBpZCA9IG1vZFZhcj8uJD8uaWQ7XG4gICAgICAgICAgICBjb25zdCBnYW1lVmFySWR4ID0gZ2FtZVZhcnMuZmluZEluZGV4KHYgPT4gdj8uJD8uaWQgPT09IGlkKTtcbiAgICAgICAgICAgIGlmIChnYW1lVmFySWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgICBnYW1lSW5kZXhGaWxlLlVzZXJDb25maWcuR3JvdXBbZ2FtZUdyb3VwSWR4XS5WaXNpYmxlVmFyc1swXS5WYXJbZ2FtZVZhcklkeF0gPSBtb2RWYXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBnYW1lSW5kZXhGaWxlLlVzZXJDb25maWcuR3JvdXBbZ2FtZUdyb3VwSWR4XS5WaXNpYmxlVmFyc1swXS5WYXIucHVzaChtb2RWYXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnYW1lSW5kZXhGaWxlLlVzZXJDb25maWcuR3JvdXAucHVzaChtb2RHcm91cHNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcbiAgICAgIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoZ2FtZUluZGV4RmlsZSk7XG4gICAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMoXG4gICAgICAgIHBhdGguam9pbihtZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgSU5QVVRfWE1MX0ZJTEVOQU1FKSxcbiAgICAgICAgeG1sKTtcbiAgICB9KVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgbG9nKCdlcnJvcicsICdpbnB1dC54bWwgbWVyZ2UgZmFpbGVkJywgZXJyKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9KTtcbn1cblxuY29uc3QgU0NSSVBUX01FUkdFUl9GSUxFUyA9IFsnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnXTtcbmZ1bmN0aW9uIHNjcmlwdE1lcmdlclRlc3QoZmlsZXMsIGdhbWVJZCkge1xuICBjb25zdCBtYXRjaGVyID0gKGZpbGUgPT4gU0NSSVBUX01FUkdFUl9GSUxFUy5pbmNsdWRlcyhmaWxlKSk7XG4gIGNvbnN0IHN1cHBvcnRlZCA9ICgoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoZmlsZXMuZmlsdGVyKG1hdGNoZXIpLmxlbmd0aCA+IDApKTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBTQ1JJUFRfTUVSR0VSX0ZJTEVTIH0pO1xufVxuXG5mdW5jdGlvbiBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihjb250ZXh0LCBlcnIsIGVyck1lc3NhZ2UpIHtcbiAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcbiAgY29uc3QgdXNlckNhbmNlbGVkID0gZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQ7XG4gIGlmICh1c2VyQ2FuY2VsZWQpIHtcbiAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xuICB9XG4gIGNvbnN0IGJ1c3lSZXNvdXJjZSA9IGVyciBpbnN0YW5jZW9mIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3I7XG4gIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcbiAgICBhbGxvd1JlcG9ydCA9IGVyci5hbGxvd1JlcG9ydDtcbiAgICBlcnIubWVzc2FnZSA9IGVyci5lcnJvck1lc3NhZ2U7XG4gIH1cblxuICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICByZXR1cm47XG59XG5cbmZ1bmN0aW9uIHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyKGNvbnRleHQsIGZpbGVzKSB7XG4gIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignSW52YWxpZCBNb2QnLCAnSXQgbG9va3MgbGlrZSB5b3UgdHJpZWQgdG8gaW5zdGFsbCAnXG4gICAgKyAnVGhlIFdpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyLCB3aGljaCBpcyBhIHRvb2wgYW5kIG5vdCBhIG1vZCBmb3IgVGhlIFdpdGNoZXIgMy5cXG5cXG4nXG4gICAgKyAnVGhlIHNjcmlwdCBtZXJnZXIgc2hvdWxkXFwndmUgYmVlbiBpbnN0YWxsZWQgYXV0b21hdGljYWxseSBieSBWb3J0ZXggYXMgc29vbiBhcyB5b3UgYWN0aXZhdGVkIHRoaXMgZXh0ZW5zaW9uLiAnXG4gICAgKyAnSWYgdGhlIGRvd25sb2FkIG9yIGluc3RhbGxhdGlvbiBoYXMgZmFpbGVkIGZvciBhbnkgcmVhc29uIC0gcGxlYXNlIGxldCB1cyBrbm93IHdoeSwgYnkgcmVwb3J0aW5nIHRoZSBlcnJvciB0aHJvdWdoICdcbiAgICArICdvdXIgZmVlZGJhY2sgc3lzdGVtIGFuZCBtYWtlIHN1cmUgdG8gaW5jbHVkZSB2b3J0ZXggbG9ncy4gUGxlYXNlIG5vdGU6IGlmIHlvdVxcJ3ZlIGluc3RhbGxlZCAnXG4gICAgKyAndGhlIHNjcmlwdCBtZXJnZXIgaW4gcHJldmlvdXMgdmVyc2lvbnMgb2YgVm9ydGV4IGFzIGEgbW9kIGFuZCBTVElMTCBoYXZlIGl0IGluc3RhbGxlZCAnXG4gICAgKyAnKGl0XFwncyBwcmVzZW50IGluIHlvdXIgbW9kIGxpc3QpIC0geW91IHNob3VsZCBjb25zaWRlciB1bi1pbnN0YWxsaW5nIGl0IGZvbGxvd2VkIGJ5IGEgVm9ydGV4IHJlc3RhcnQ7ICdcbiAgICArICd0aGUgYXV0b21hdGljIG1lcmdlciBpbnN0YWxsZXIvdXBkYXRlciBzaG91bGQgdGhlbiBraWNrIG9mZiBhbmQgc2V0IHVwIHRoZSB0b29sIGZvciB5b3UuJyxcbiAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnSW52YWxpZCBtb2QnKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XG59XG5cbmZ1bmN0aW9uIGRldGVybWluZUV4ZWN1dGFibGUoZGlzY292ZXJlZFBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChkaXNjb3ZlcmVkUGF0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLnN0YXRTeW5jKHBhdGguam9pbihkaXNjb3ZlcmVkUGF0aCwgJ2JpbicsICd4NjRfRFgxMicsICd3aXRjaGVyMy5leGUnKSk7XG4gICAgICByZXR1cm4gJ2Jpbi94NjRfRFgxMi93aXRjaGVyMy5leGUnO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gbm9wLCB1c2UgZmFsbGJhY2tcbiAgICB9XG4gIH1cbiAgcmV0dXJuICdiaW4veDY0L3dpdGNoZXIzLmV4ZSc7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBXM1JlZHVjZXIpO1xuICBsZXQgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XG4gIGxldCBtb2RMaW1pdFBhdGNoZXI6IE1vZExpbWl0UGF0Y2hlcjtcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBHQU1FX0lELFxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzJyxcbiAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdNb2RzJyxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6IGRldGVybWluZUV4ZWN1dGFibGUsXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXG4gICAgXSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogJzI5MjAzMCcsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiAyOTIwMzAsXG4gICAgICBpZ25vcmVDb25mbGljdHM6IERPX05PVF9ERVBMT1ksXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXG4gICAgICBoYXNoRmlsZXM6IFsnYmluL3g2NC93aXRjaGVyMy5leGUnXSxcbiAgICB9LFxuICB9KTtcblxuICBjb25zdCBnZXRETENQYXRoID0gKGdhbWUpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcbiAgICByZXR1cm4gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJyk7XG4gIH07XG5cbiAgY29uc3QgZ2V0VExQYXRoID0gKGdhbWUpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XG4gIH07XG5cbiAgY29uc3QgaXNUVzMgPSAoZ2FtZUlkID0gdW5kZWZpbmVkKSA9PiB7XG4gICAgaWYgKGdhbWVJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XG4gICAgfVxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xuICB9O1xuXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzdGwnLCAyNSwgdG9CbHVlKHRlc3RTdXBwb3J0ZWRUTCksIHRvQmx1ZShpbnN0YWxsVEwpKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtaXhlZCcsIDMwLCB0b0JsdWUodGVzdFN1cHBvcnRlZE1peGVkKSwgdG9CbHVlKGluc3RhbGxNaXhlZCkpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM2NvbnRlbnQnLCA1MCxcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtZW51bW9kcm9vdCcsIDIwLFxuICAgIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSwgdG9CbHVlKGluc3RhbGxNZW51TW9kKSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzZGxjbW9kJywgNjAsIHRlc3RETENNb2QgYXMgYW55LCBpbnN0YWxsRExDTW9kIGFzIGFueSlcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2NyaXB0bWVyZ2VyZHVtbXknLCAxNSxcbiAgICB0b0JsdWUoc2NyaXB0TWVyZ2VyVGVzdCksIHRvQmx1ZSgoZmlsZXMpID0+IHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyKGNvbnRleHQsIGZpbGVzKSkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM3RsJywgMjUsIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0VEwpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3dpdGNoZXIzZGxjJywgMjUsIGlzVFczLCBnZXRETENQYXRoLCB0b0JsdWUodGVzdERMQykpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNtZW51bW9kcm9vdCcsIDIwLFxuICAgIGlzVFczLCBnZXRUTFBhdGgsIHRvQmx1ZSh0ZXN0TWVudU1vZFJvb3QgYXMgYW55KSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMsXG4gICAgKGdhbWUpID0+IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnVGhlIFdpdGNoZXIgMycpLFxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgndzNtb2RsaW1pdHBhdGNoZXInLCAyNSwgaXNUVzMsIGdldFRMUGF0aCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSksXG4gICAgeyBkZXBsb3ltZW50RXNzZW50aWFsOiBmYWxzZSwgbmFtZTogJ01vZCBMaW1pdCBQYXRjaGVyIE1vZCBUeXBlJyB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTWVyZ2UoY2FuTWVyZ2UsXG4gICAgKGZpbGVQYXRoLCBtZXJnZURpcikgPT4gbWVyZ2UoZmlsZVBhdGgsIG1lcmdlRGlyLCBjb250ZXh0KSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKChvbGRWZXJzaW9uKSA9PiAobWlncmF0ZTE0OChjb250ZXh0LCBvbGRWZXJzaW9uKSBhcyBhbnkpKTtcblxuICByZWdpc3RlckFjdGlvbnMoe1xuICAgIGNvbnRleHQsXG4gICAgcmVmcmVzaEZ1bmMsXG4gICAgZ2V0UHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBwcmlvcml0eU1hbmFnZXIsXG4gICAgZ2V0TW9kTGltaXRQYXRjaGVyOiAoKSA9PiBtb2RMaW1pdFBhdGNoZXIsXG4gIH0pO1xuXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcbiAgICAnd2l0Y2hlcjNfY29sbGVjdGlvbl9kYXRhJyxcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10sIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpID0+XG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKSA9PlxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAodCkgPT4gdCgnV2l0Y2hlciAzIERhdGEnKSxcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxuICApO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJQcm9maWxlRmVhdHVyZShcbiAgICAnbG9jYWxfbWVyZ2VzJywgJ2Jvb2xlYW4nLCAnc2V0dGluZ3MnLCAnUHJvZmlsZSBEYXRhJyxcbiAgICAnVGhpcyBwcm9maWxlIHdpbGwgc3RvcmUgYW5kIHJlc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBkYXRhIChtZXJnZWQgc2NyaXB0cywgbG9hZG9yZGVyLCBldGMpIHdoZW4gc3dpdGNoaW5nIHByb2ZpbGVzJyxcbiAgICAoKSA9PiB7XG4gICAgICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xuICAgICAgcmV0dXJuIGFjdGl2ZUdhbWVJZCA9PT0gR0FNRV9JRDtcbiAgICB9KTtcblxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsICdjb2xsZWN0aW9uJ107XG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXJQYWdlKHtcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXG4gICAgY3JlYXRlSW5mb1BhbmVsOiAocHJvcHMpID0+IHtcbiAgICAgIHJlZnJlc2hGdW5jID0gcHJvcHMucmVmcmVzaDtcbiAgICAgIHJldHVybiBpbmZvQ29tcG9uZW50KGNvbnRleHQsIHByb3BzKSBhcyBhbnk7XG4gICAgfSxcbiAgICBnYW1lQXJ0VVJMOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcbiAgICBmaWx0ZXI6IChtb2RzKSA9PiBtb2RzLmZpbHRlcihtb2QgPT4gIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2QudHlwZSkpLFxuICAgIHByZVNvcnQ6IChpdGVtczogYW55W10sIGRpcmVjdGlvbjogYW55LCB1cGRhdGVUeXBlOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiBwcmVTb3J0KGNvbnRleHQsIGl0ZW1zLCBkaXJlY3Rpb24sIHVwZGF0ZVR5cGUsIHByaW9yaXR5TWFuYWdlcikgYXMgYW55O1xuICAgIH0sXG4gICAgbm9Db2xsZWN0aW9uR2VuZXJhdGlvbjogdHJ1ZSxcbiAgICBjYWxsYmFjazogKGxvYWRPcmRlciwgdXBkYXRlVHlwZSkgPT4ge1xuICAgICAgaWYgKGxvYWRPcmRlciA9PT0gX1BSRVZJT1VTX0xPKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKF9QUkVWSU9VU19MTyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSk7XG4gICAgICB9XG4gICAgICBfUFJFVklPVVNfTE8gPSBsb2FkT3JkZXI7XG4gICAgICBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpXG4gICAgICAgIC50aGVuKCgpID0+IHdyaXRlVG9Nb2RTZXR0aW5ncygpKVxuICAgICAgICAuY2F0Y2goZXJyID0+IG1vZFNldHRpbmdzRXJyb3JIYW5kbGVyKGNvbnRleHQsIGVycixcbiAgICAgICAgICAnRmFpbGVkIHRvIG1vZGlmeSBsb2FkIG9yZGVyIGZpbGUnKSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXG4gICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcbiAgY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ21vZC1hY3RpdmF0ZWQnLFxuICAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XG5cbiAgY29uc3QgcmV2ZXJ0TE9GaWxlID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSkge1xuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoY29udGV4dCkudGhlbigobWFudWFsbHlBZGRlZCkgPT4ge1xuICAgICAgICBpZiAobWFudWFsbHlBZGRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc3QgbmV3U3RydWN0ID0ge307XG4gICAgICAgICAgbWFudWFsbHlBZGRlZC5mb3JFYWNoKChtb2QsIGlkeCkgPT4ge1xuICAgICAgICAgICAgbmV3U3RydWN0W21vZF0gPSB7XG4gICAgICAgICAgICAgIEVuYWJsZWQ6IDEsXG4gICAgICAgICAgICAgIFByaW9yaXR5OiAoKGxvYWRPcmRlciAhPT0gdW5kZWZpbmVkICYmICEhbG9hZE9yZGVyW21vZF0pXG4gICAgICAgICAgICAgICAgPyBwYXJzZUludChsb2FkT3JkZXJbbW9kXS5wcmVmaXgsIDEwKSA6IGlkeCkgKyAxLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIF9JTklfU1RSVUNUID0gbmV3U3RydWN0O1xuICAgICAgICAgIHdyaXRlVG9Nb2RTZXR0aW5ncygpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHJlZnJlc2hGdW5jPy4oKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxuICAgICAgICAgICAgICAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcbiAgICAgICAgICBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcbiAgICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAgICAgICA6IGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJywgZXJyKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCB2YWxpZGF0ZVByb2ZpbGUgPSAocHJvZmlsZUlkLCBzdGF0ZSkgPT4ge1xuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gICAgY29uc3QgZGVwbG95UHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgICBpZiAoISFhY3RpdmVQcm9maWxlICYmICEhZGVwbG95UHJvZmlsZSAmJiAoZGVwbG95UHJvZmlsZS5pZCAhPT0gYWN0aXZlUHJvZmlsZS5pZCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKGFjdGl2ZVByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gYWN0aXZlUHJvZmlsZTtcbiAgfTtcblxuICBsZXQgcHJldkRlcGxveW1lbnQgPSBbXTtcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICBtb2RMaW1pdFBhdGNoZXIgPSBuZXcgTW9kTGltaXRQYXRjaGVyKGNvbnRleHQuYXBpKTtcbiAgICBwcmlvcml0eU1hbmFnZXIgPSBuZXcgUHJpb3JpdHlNYW5hZ2VyKGNvbnRleHQuYXBpLCAncHJlZml4LWJhc2VkJyk7XG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCBhc3luYyAoZ2FtZU1vZGUpID0+IHtcbiAgICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xuICAgICAgICAvLyBKdXN0IGluIGNhc2UgdGhlIHNjcmlwdCBtZXJnZXIgbm90aWZpY2F0aW9uIGlzIHN0aWxsXG4gICAgICAgIC8vICBwcmVzZW50LlxuICAgICAgICBjb250ZXh0LmFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCd3aXRjaGVyMy1tZXJnZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgICBjb25zdCBsYXN0UHJvZklkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZU1vZGUpO1xuICAgICAgICBjb25zdCBhY3RpdmVQcm9mID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcbiAgICAgICAgaWYgKGxhc3RQcm9mSWQgIT09IGFjdGl2ZVByb2Y/LmlkKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHJlc3RvcmVGcm9tUHJvZmlsZShjb250ZXh0LCBhY3RpdmVQcm9mPy5pZCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzdG9yZSBwcm9maWxlIG1lcmdlZCBmaWxlcycsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29udGV4dC5hcGkub25Bc3luYygnd2lsbC1kZXBsb3knLCAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZCwgc3RhdGUpO1xuICAgICAgaWYgKGFjdGl2ZVByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtZW51TW9kLm9uV2lsbERlcGxveShjb250ZXh0LmFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG4gICAgfSk7XG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkLCBzdGF0ZSk7XG4gICAgICBpZiAoYWN0aXZlUHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KHByZXZEZXBsb3ltZW50KSAhPT0gSlNPTi5zdHJpbmdpZnkoZGVwbG95bWVudCkpIHtcbiAgICAgICAgcHJldkRlcGxveW1lbnQgPSBkZXBsb3ltZW50O1xuICAgICAgICBxdWVyeVNjcmlwdE1lcmdlKGNvbnRleHQsICdZb3VyIG1vZHMgc3RhdGUvbG9hZCBvcmRlciBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHlvdSByYW4gJ1xuICAgICAgICAgICsgJ3RoZSBzY3JpcHQgbWVyZ2VyLiBZb3UgbWF5IHdhbnQgdG8gcnVuIHRoZSBtZXJnZXIgdG9vbCBhbmQgY2hlY2sgd2hldGhlciBhbnkgbmV3IHNjcmlwdCBjb25mbGljdHMgYXJlICdcbiAgICAgICAgICArICdwcmVzZW50LCBvciBpZiBleGlzdGluZyBtZXJnZXMgaGF2ZSBiZWNvbWUgdW5lY2Vzc2FyeS4gUGxlYXNlIGFsc28gbm90ZSB0aGF0IGFueSBsb2FkIG9yZGVyIGNoYW5nZXMgJ1xuICAgICAgICAgICsgJ21heSBhZmZlY3QgdGhlIG9yZGVyIGluIHdoaWNoIHlvdXIgY29uZmxpY3RpbmcgbW9kcyBhcmUgbWVhbnQgdG8gYmUgbWVyZ2VkLCBhbmQgbWF5IHJlcXVpcmUgeW91IHRvICdcbiAgICAgICAgICArICdyZW1vdmUgdGhlIGV4aXN0aW5nIG1lcmdlIGFuZCByZS1hcHBseSBpdC4nKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGFjdGl2ZVByb2ZpbGUuaWRdLCB7fSk7XG4gICAgICBjb25zdCBkb2NGaWxlcyA9IChkZXBsb3ltZW50Wyd3aXRjaGVyM21lbnVtb2Ryb290J10gPz8gW10pXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcbiAgICAgIGNvbnN0IG1lbnVNb2RQcm9taXNlID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9jRmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1lbnUgbW9kcyBkZXBsb3llZCAtIHJlbW92ZSB0aGUgbW9kLlxuICAgICAgICAgIHJldHVybiBtZW51TW9kLnJlbW92ZU1vZChjb250ZXh0LmFwaSwgYWN0aXZlUHJvZmlsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG1lbnVNb2Qub25EaWREZXBsb3koY29udGV4dC5hcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpXG4gICAgICAgICAgICAudGhlbihhc3luYyBtb2RJZCA9PiB7XG4gICAgICAgICAgICAgIGlmIChtb2RJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKGFjdGl2ZVByb2ZpbGUuaWQsIG1vZElkLCB0cnVlKSk7XG4gICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBtb2RJZCk7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gbWVudU1vZFByb21pc2UoKVxuICAgICAgICAudGhlbigoKSA9PiBzZXRJTklTdHJ1Y3QoY29udGV4dCwgbG9hZE9yZGVyLCBwcmlvcml0eU1hbmFnZXIpKVxuICAgICAgICAudGhlbigoKSA9PiB3cml0ZVRvTW9kU2V0dGluZ3MoKSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJlZnJlc2hGdW5jPy4oKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoY29udGV4dCwgZXJyLFxuICAgICAgICAgICdGYWlsZWQgdG8gbW9kaWZ5IGxvYWQgb3JkZXIgZmlsZScpKTtcbiAgICB9KTtcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3Byb2ZpbGUtd2lsbC1jaGFuZ2UnLCBhc3luYyAobmV3UHJvZmlsZUlkKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBuZXdQcm9maWxlSWQpO1xuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByaW9yaXR5VHlwZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0UHJpb3JpdHlUeXBlQnJhbmNoKCksICdwcmVmaXgtYmFzZWQnKTtcbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByaW9yaXR5VHlwZShwcmlvcml0eVR5cGUpKTtcblxuICAgICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHN0b3JlVG9Qcm9maWxlKGNvbnRleHQsIGxhc3RQcm9mSWQpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gcmVzdG9yZUZyb21Qcm9maWxlKGNvbnRleHQsIHByb2ZpbGUuaWQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkpIHtcbiAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzdG9yZSBwcm9maWxlIHNwZWNpZmljIG1lcmdlZCBpdGVtcycsIGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCAocHJldiwgY3VycmVudCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICAgIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcmlvcml0eVR5cGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFByaW9yaXR5VHlwZUJyYW5jaCgpLCAncHJlZml4LWJhc2VkJyk7XG4gICAgICBwcmlvcml0eU1hbmFnZXIucHJpb3JpdHlUeXBlID0gcHJpb3JpdHlUeXBlO1xuICAgIH0pO1xuXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdwdXJnZS1tb2RzJywgKCkgPT4ge1xuICAgICAgcmV2ZXJ0TE9GaWxlKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpbixcbn07XG4iXX0=