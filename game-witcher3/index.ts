import Bluebird, { all } from 'bluebird';
import path from 'path';
import React from 'react';
import * as BS from 'react-bootstrap';
import { actions, FlexLayout, fs, log, selectors, types, util } from 'vortex-api';
import * as IniParser from 'vortex-parse-ini';
import winapi from 'winapi-bindings';

import { migrate148 } from './migrations';

import { Builder, parseStringPromise } from 'xml2js';

import { genCollectionsData, parseCollectionsData } from './collections/collections';
import { IW3CollectionsData } from './collections/types';
import CollectionsDataView from './views/CollectionsDataView';

import menuMod from './menumod';
import { downloadScriptMerger, getScriptMergerDir, setMergerConfig } from './scriptmerger';

import { DO_NOT_DEPLOY, DO_NOT_DISPLAY,
  GAME_ID, getLoadOrderFilePath, getPriorityTypeBranch, I18N_NAMESPACE,
  INPUT_XML_FILENAME, LOCKED_PREFIX, PART_SUFFIX, ResourceInaccessibleError,
  SCRIPT_MERGER_ID, UNI_PATCH,
} from './common';

import { testModLimitBreach } from './tests';

import { ModLimitPatcher } from './modLimitPatch';

import { registerActions } from './iconbarActions';
import { PriorityManager } from './priorityManager';

import { installMixed, testSupportedMixed, installDLCMod, testDLCMod } from './installers';
import { restoreFromProfile, storeToProfile } from './mergeBackup';

import { getMergedModNames } from './mergeInventoryParsing';

import { setPriorityType } from './actions';
import { W3Reducer } from './reducers';

const GOG_ID = '1207664663';
const GOG_ID_GOTY = '1495134320';
const GOG_WH_ID = '1207664643';
const GOG_WH_GOTY = '1640424747';
const STEAM_ID = '499450';
const STEAM_ID_WH = '292030';
const EPIC_ID = '725a22e15ed74735bb0d6a19f3cc82d0';

const CONFIG_MATRIX_REL_PATH = path.join('bin', 'config', 'r4game', 'user_config_matrix', 'pc');

let _INI_STRUCT = {};
let _PREVIOUS_LO = {};

const tools: types.ITool[] = [
  {
    id: SCRIPT_MERGER_ID,
    name: 'W3 Script Merger',
    logo: 'WitcherScriptMerger.jpg',
    executable: () => 'WitcherScriptMerger.exe',
    requiredFiles: [
      'WitcherScriptMerger.exe',
    ],
  },
  {
    id: GAME_ID + '_DX11',
    name: 'The Witcher 3 (DX11)',
    logo: 'auto',
    relative: true,
    executable: () => 'bin/x64/witcher3.exe',
    requiredFiles: [
      'bin/x64/witcher3.exe',
    ],
  },
  {
    id: GAME_ID + '_DX12',
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
  const filePath = getLoadOrderFilePath();
  const parser = new IniParser.default(new IniParser.WinapiFormat());
  return fs.removeAsync(filePath)
    .then(() => fs.writeFileAsync(filePath, '', { encoding: 'utf8' }))
    .then(() => parser.read(filePath))
    .then(ini => {
      return Bluebird.each(Object.keys(_INI_STRUCT), (key) => {
        if (_INI_STRUCT?.[key]?.Enabled === undefined) {
          // It's possible for the user to run multiple operations at once,
          //  causing the static ini structure to be modified
          //  elsewhere while we're attempting to write to file. The user must've been
          //  modifying the load order while deploying. This should
          //  make sure we don't attempt to write any invalid mod entries.
          //  https://github.com/Nexus-Mods/Vortex/issues/8437
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
      ? Promise.reject(new ResourceInaccessibleError(err.path))
      : Promise.reject(err));
}

function createModSettings() {
  const filePath = getLoadOrderFilePath();
  // Theoretically the Witcher 3 documents path should be
  //  created at this point (either by us or the game) but
  //  just in case it got removed somehow, we re-instate it
  //  yet again... https://github.com/Nexus-Mods/Vortex/issues/7058
  return fs.ensureDirWritableAsync(path.dirname(filePath))
    .then(() => fs.writeFileAsync(filePath, '', { encoding: 'utf8' }));
}

// Attempts to parse and return data found inside
//  the mods.settings file if found - otherwise this
//  will ensure the file is present.
function ensureModSettings() {
  const filePath = getLoadOrderFilePath();
  const parser = new IniParser.default(new IniParser.WinapiFormat());
  return fs.statAsync(filePath)
    .then(() => parser.read(filePath))
    .catch(err => (err.code === 'ENOENT')
      ? createModSettings().then(() => parser.read(filePath))
      : Promise.reject(err));
}

async function getManuallyAddedMods(context) {
  return ensureModSettings().then(ini => {
    const state = context.api.store.getState();
    const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
    const modKeys = Object.keys(mods);
    const iniEntries = Object.keys(ini.data);
    const manualCandidates = [].concat(iniEntries, [UNI_PATCH]).filter(entry => {
      const hasVortexKey = util.getSafe(ini.data[entry], ['VK'], undefined) !== undefined;
      return ((!hasVortexKey) || (ini.data[entry].VK === entry) && !modKeys.includes(entry));
    }) || [UNI_PATCH];
    return Promise.resolve(new Set(manualCandidates));
  })
  .then(uniqueCandidates => {
    const state = context.api.store.getState();
    const discovery = util.getSafe(state,
      ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
    if (discovery?.path === undefined) {
      // How/why are we even here ?
      return Promise.reject(new util.ProcessCanceled('Game is not discovered!'));
    }
    const modsPath = path.join(discovery.path, 'Mods');
    return Bluebird.reduce(Array.from(uniqueCandidates), (accum, mod) => {
      const modFolder = path.join(modsPath, mod);
      return fs.statAsync(path.join(modFolder))
        .then(() => new Promise(async (resolve) => {
          // Ok, we know the folder is there - lets ensure that
          //  it actually contains files.
          let candidates = [];
          await require('turbowalk').default(path.join(modsPath, mod), entries => {
            candidates = [].concat(candidates, entries.filter(entry => (!entry.isDirectory)
                                 && (path.extname(path.basename(entry.filePath)) !== '')
                                 && (entry?.linkCount === undefined || entry.linkCount <= 1)));
          })
          .catch(err => (['ENOENT', 'ENOTFOUND'].indexOf(err.code) !== -1)
            ? null // do nothing
            : Promise.reject(err));

          const mapped = await Bluebird.map(candidates, cand =>
            fs.statAsync(cand.filePath)
              .then(stats => stats.isSymbolicLink()
                ? Promise.resolve(undefined)
                : Promise.resolve(cand.filePath))
              .catch(err => Promise.resolve(undefined)));
          return resolve(mapped);
        }))
        .then((files: string[]) => {
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
    // UserCanceled would suggest we were unable to stat the W3 mod folder
    //  probably due to a permissioning issue (ENOENT is handled above)
    const userCanceled = (err instanceof util.UserCanceled);
    const processCanceled = (err instanceof util.ProcessCanceled);
    const allowReport = (!userCanceled && !processCanceled);
    const details = userCanceled
      ? 'Vortex tried to scan your W3 mods folder for manually added mods but '
        + 'was blocked by your OS/AV - please make sure to fix this before you '
        + 'proceed to mod W3 as your modding experience will be severely affected.'
      : err;
    context.api.showErrorNotification('Failed to lookup manually added mods',
      details, { allowReport });
    return Promise.resolve([]);
  });
}

function findGame(): Bluebird<string> {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\CD Project Red\\The Witcher 3',
      'InstallFolder');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Bluebird.resolve(instPath.value as string);
  } catch (err) {
    return util.GameStoreHelper.findByAppId([
      GOG_ID_GOTY, GOG_ID, GOG_WH_ID, GOG_WH_GOTY,
      STEAM_ID, STEAM_ID_WH, EPIC_ID
    ])
      .then(game => game.gamePath);
  }
}

function testSupportedTL(files, gameId) {
  const supported = (gameId === 'witcher3')
    && (files.find(file =>
      file.toLowerCase().split(path.sep).indexOf('mods') !== -1) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installTL(files,
                   destinationPath,
                   gameId,
                   progressDelegate) {
  let prefix = files.reduce((prev, file) => {
    const components = file.toLowerCase().split(path.sep);
    const idx = components.indexOf('mods');
    if ((idx > 0) && ((prev === undefined) || (idx < prev.length))) {
      return components.slice(0, idx);
    } else {
      return prev;
    }
  }, undefined);

  prefix = (prefix === undefined) ? '' : prefix.join(path.sep) + path.sep;

  const instructions = files
    .filter(file => !file.endsWith(path.sep) && file.toLowerCase().startsWith(prefix))
    .map(file => ({
      type: 'copy',
      source: file,
      destination: file.slice(prefix.length),
    }));

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  const supported = (gameId === GAME_ID)
    && (files.find(file => file.toLowerCase().startsWith('content' + path.sep) !== undefined));
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  return Promise.resolve(files
    .filter(file => file.toLowerCase().startsWith('content' + path.sep))
    .map(file => {
      const fileBase = file.split(path.sep).slice(1).join(path.sep);
      return {
        type: 'copy',
        source: file,
        destination: path.join('mod' + destinationPath, fileBase),
      };
  }));
}

function installMenuMod(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  // Input specific files need to be installed outside the mods folder while
  //  all other mod files are to be installed as usual.
  const filtered = files.filter(file => path.extname(path.basename(file)) !== '');
  const inputFiles = filtered.filter(file => file.indexOf(CONFIG_MATRIX_REL_PATH) !== -1);
  const uniqueInput = inputFiles.reduce((accum, iter) => {
    // Some mods tend to include a backup file meant for the user to restore
    //  his game to vanilla (obvs we only want to apply the non-backup).
    const fileName = path.basename(iter);

    if (accum.find(entry => path.basename(entry) === fileName) !== undefined) {
      // This config file has already been added to the accumulator.
      //  Ignore this instance.
      return accum;
    }

    const instances = inputFiles.filter(file => path.basename(file) === fileName);
    if (instances.length > 1) {
      // We have multiple instances of the same menu config file - mod author probably included
      //  a backup file to restore vanilla state, or perhaps this is a variant mod which we
      //  can't currently support.
      // It's difficult for us to correctly identify the correct file but we're going to
      //  try and guess based on whether the config file has a "backup" folder segment
      //  otherwise we just add the first file instance (I'm going to regret adding this aren't I ?)
      if (iter.toLowerCase().indexOf('backup') === -1) {
        // We're going to assume that this is the right file.
        accum.push(iter);
      }
    } else {
      // This is a unique menu configuration file - add it.
      accum.push(iter);
    }
    return accum;
  }, []);

  let otherFiles = filtered.filter(file => !inputFiles.includes(file));
  const inputFileDestination = CONFIG_MATRIX_REL_PATH;

  // Get the mod's root folder.
  const binIdx = uniqueInput[0].split(path.sep).indexOf('bin');

  // Refers to files located inside the archive's 'Mods' directory.
  //  This array can very well be empty if a mods folder doesn't exist
  const modFiles = otherFiles.filter(file =>
    file.toLowerCase().split(path.sep).includes('mods'));

  const modsIdx = (modFiles.length > 0)
    ? modFiles[0].toLowerCase().split(path.sep).indexOf('mods')
    : -1;
  const modNames = (modsIdx !== -1)
    ? modFiles.reduce((accum, iter) => {
      const modName = iter.split(path.sep).splice(modsIdx + 1, 1).join();
      if (!accum.includes(modName)) {
        accum.push(modName);
      }
      return accum;
    }, [])
    : [];
  // The presence of a mods folder indicates that this mod may provide
  //  several mod entries.
  if (modFiles.length > 0) {
    otherFiles = otherFiles.filter(file => !modFiles.includes(file));
  }

  // We're hoping that the mod author has included the mod name in the archive's
  //  structure - if he didn't - we're going to use the destination path instead.
  const modName = (binIdx > 0)
    ? inputFiles[0].split(path.sep)[binIdx - 1]
    : ('mod' + path.basename(destinationPath, '.installing')).replace(/\s/g, '');

  const trimmedFiles = otherFiles.map(file => {
    const source = file;
    let relPath = file.split(path.sep)
                      .slice(binIdx);
    if (relPath[0] === undefined) {
      // This file must've been inside the root of the archive;
      //  deploy as is.
      relPath = file.split(path.sep);
    }

    const firstSeg = relPath[0].toLowerCase();
    if (firstSeg === 'content' || firstSeg.endsWith(PART_SUFFIX)) {
      relPath = [].concat(['Mods', modName], relPath);
    }

    return {
      source,
      relPath: relPath.join(path.sep),
    };
  });

  const toCopyInstruction = (source, destination) => ({
    type: 'copy',
    source,
    destination,
  });

  const inputInstructions = uniqueInput.map(file =>
    toCopyInstruction(file, path.join(inputFileDestination, path.basename(file))));

  const otherInstructions = trimmedFiles.map(file =>
    toCopyInstruction(file.source, file.relPath));

  const modFileInstructions = modFiles.map(file =>
    toCopyInstruction(file, file));

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

function testMenuModRoot(instructions: any[], gameId: string):
  Promise<types.ISupportedResult | boolean> {
  const predicate = (instr) => (!!gameId)
    ? ((GAME_ID === gameId) && (instr.indexOf(CONFIG_MATRIX_REL_PATH) !== -1))
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

  return Promise.resolve(instructions.find(
    instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('mods' + path.sep),
  ) !== undefined);
}

function testDLC(instructions) {
  return Promise.resolve(instructions.find(
    instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('dlc' + path.sep)) !== undefined);
}

function notifyMissingScriptMerger(api) {
  const notifId = 'missing-script-merger';
  api.sendNotification({
    id: notifId,
    type: 'info',
    message: api.translate('Witcher 3 script merger is missing/misconfigured',
      { ns: I18N_NAMESPACE }),
    allowSuppress: true,
    actions: [
      {
        title: 'More',
        action: () => {
          api.showDialog('info', 'Witcher 3 Script Merger', {
            bbcode: api.translate('Vortex is unable to resolve the Script Merger\'s location. The tool needs to be downloaded and configured manually. '
              + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]Find out more about how to configure it as a tool for use in Vortex.[/url][br][/br][br][/br]'
              + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: I18N_NAMESPACE }),
          }, [
            { label: 'Cancel', action: () => {
              api.dismissNotification('missing-script-merger');
            }},
            { label: 'Download Script Merger', action: () => util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                                .catch(err => null)
                                                .then(() => api.dismissNotification('missing-script-merger')) },
          ]);
        },
      },
    ],
  });
}

function prepareForModding(context, discovery) {
  const findScriptMerger = async (error) => {
    log('error', 'failed to download/install script merger', error);
    const scriptMergerPath = await getScriptMergerDir(context);
    if (scriptMergerPath === undefined) {
      notifyMissingScriptMerger(context.api);
      return Promise.resolve();
    } else {
      if (discovery?.tools?.W3ScriptMerger === undefined) {
        return setMergerConfig(discovery.path, scriptMergerPath);
      }
    }
  };

  const ensurePath = (dirpath) =>
    fs.ensureDirWritableAsync(dirpath)
      .catch(err => (err.code === 'EEXIST')
        ? Promise.resolve()
        : Promise.reject(err));

  return Promise.all([
    ensurePath(path.join(discovery.path, 'Mods')),
    ensurePath(path.join(discovery.path, 'DLC')),
    ensurePath(path.dirname(getLoadOrderFilePath()))])
      .then(() => downloadScriptMerger(context)
        .catch(err => (err instanceof util.UserCanceled)
          ? Promise.resolve()
          : findScriptMerger(err)));
}

function getScriptMergerTool(api) {
  const state = api.store.getState();
  const scriptMerger = util.getSafe(state,
    ['settings', 'gameMode', 'discovered', GAME_ID, 'tools', SCRIPT_MERGER_ID], undefined);
  if (!!scriptMerger?.path) {
    return scriptMerger;
  }

  return undefined;
}

function runScriptMerger(api) {
  const tool = getScriptMergerTool(api);
  if (tool?.path === undefined) {
    notifyMissingScriptMerger(api);
    return Promise.resolve();
  }

  return api.runExecutable(tool.path, [], { suggestDeploy: true })
    .catch(err => api.showErrorNotification('Failed to run tool', err,
      { allowReport: ['EPERM', 'EACCESS', 'ENOENT'].indexOf(err.code) !== -1 }));
}

async function getAllMods(context) {
  // Mod types we don't want to display in the LO page
  const invalidModTypes = ['witcher3menumoddocuments'];
  const state = context.api.store.getState();
  const profile = selectors.activeProfile(state);
  if (profile?.id === undefined) {
    return Promise.resolve({
      merged: [],
      manual: [],
      managed: [],
    });
  }
  const modState = util.getSafe(state, ['persistent', 'profiles', profile.id, 'modState'], {});
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});

  // Only select mods which are enabled, and are not a menu mod.
  const enabledMods = Object.keys(modState).filter(key =>
    (!!mods[key] && modState[key].enabled && !invalidModTypes.includes(mods[key].type)));

  const mergedModNames = await getMergedModNames(context);
  const manuallyAddedMods = await getManuallyAddedMods(context);
  const managedMods = await getManagedModNames(context, enabledMods.map(key => mods[key]));
  return Promise.resolve({
    merged: mergedModNames,
    manual: manuallyAddedMods.filter(mod => !mergedModNames.includes(mod)),
    managed: managedMods,
  });
}

async function setINIStruct(context, loadOrder, priorityManager) {
  return getAllMods(context).then(modMap => {
    _INI_STRUCT = {};
    const mods = [].concat(modMap.merged, modMap.managed, modMap.manual);
    const manualLocked = modMap.manual.filter(isLockedEntry);
    const managedLocked = modMap.managed
      .filter(entry => isLockedEntry(entry.name))
      .map(entry => entry.name);
    const totalLocked = [].concat(modMap.merged, manualLocked, managedLocked);
    return Bluebird.each(mods, (mod, idx) => {
      let name;
      let key;
      if (typeof(mod) === 'object' && mod !== null) {
        name = mod.name;
        key = mod.id;
      } else {
        name = mod;
        key = mod;
      }

      const LOEntry = util.getSafe(loadOrder, [key], undefined);
      if (idx === 0) {
        priorityManager.resetMaxPriority(totalLocked.length);
      }
      _INI_STRUCT[name] = {
        // The INI file's enabled attribute expects 1 or 0
        Enabled: (LOEntry !== undefined) ? LOEntry.enabled ? 1 : 0 : 1,
        Priority: totalLocked.includes(name)
          ? totalLocked.indexOf(name)
          : priorityManager.getPriority({ id: key }),
        VK: key,
      };
    });
  });
}

function isLockedEntry(modName: string) {
  // We're adding this to avoid having the load order page
  //  from not loading if we encounter an invalid mod name.
  if (!modName || typeof(modName) !== 'string') {
    log('debug', 'encountered invalid mod instance/name');
    return false;
  }
  return modName.startsWith(LOCKED_PREFIX);
}

let refreshFunc;
// item: ILoadOrderDisplayItem
function genEntryActions(context: types.IExtensionContext,
                         item: types.ILoadOrderDisplayItem,
                         minPriority: number,
                         onSetPriority: (key: string, priority: number) => void) {
  const priorityInputDialog = () => {
    return new Bluebird((resolve) => {
      context.api.showDialog('question', 'Set New Priority', {
        text: context.api.translate('Insert new numerical priority for {{itemName}} in the input box:', { replace: { itemName: item.name } }),
        input: [
          {
            id: 'w3PriorityInput',
            label: 'Priority',
            type: 'number',
            placeholder: _INI_STRUCT[item.id]?.Priority || 0,
          }],
      }, [ { label: 'Cancel' }, { label: 'Set', default: true } ])
      .then(result => {
        if (result.action === 'Set') {
          const itemKey = Object.keys(_INI_STRUCT).find(key => _INI_STRUCT[key].VK === item.id);
          const wantedPriority = result.input['w3PriorityInput'];
          if (wantedPriority <= minPriority) {
            context.api.showErrorNotification('Chosen priority is already assigned to a locked entry',
              wantedPriority.toString(), { allowReport: false });
            return resolve();
          }
          if (itemKey !== undefined) {
            _INI_STRUCT[itemKey].Priority = parseInt(wantedPriority, 10);
            onSetPriority(itemKey, wantedPriority);
          } else {
            log('error', 'Failed to set priority - mod is not in ini struct', { modId: item.id });
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

async function preSort(context, items, direction, updateType, priorityManager): Promise<any[]> {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  const { getPriority, resetMaxPriority } = priorityManager;
  if (activeProfile?.id === undefined) {
    // What an odd use case - perhaps the user had switched gameModes or
    //  even deleted his profile during the pre-sort functionality ?
    //  Odd but plausible I suppose ?
    log('warn', '[W3] unable to presort due to no active profile');
    return Promise.resolve([]);
  }

  let loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
  const onSetPriority = (itemKey, wantedPriority) => {
    return writeToModSettings()
      .then(() => {
        wantedPriority = +wantedPriority;
        const state = context.api.store.getState();
        const activeProfile = selectors.activeProfile(state);
        const modId = _INI_STRUCT[itemKey].VK;
        const loEntry = loadOrder[modId];
        if (priorityManager.priorityType === 'position-based') {
          context.api.store.dispatch(actions.setLoadOrderEntry(
            activeProfile.id, modId, {
              ...loEntry,
              pos: (loEntry.pos < wantedPriority) ? wantedPriority : wantedPriority - 2,
          }));
          loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
        } else {
          context.api.store.dispatch(actions.setLoadOrderEntry(
            activeProfile.id, modId, {
              ...loEntry,
              prefix: parseInt(_INI_STRUCT[itemKey].Priority, 10),
          }));
        }
        if (refreshFunc !== undefined) {
          refreshFunc();
        }
      })
      .catch(err => modSettingsErrorHandler(context, err,
        'Failed to modify load order file'));
  };
  const allMods = await getAllMods(context);
  if ((allMods.merged.length === 0) && (allMods.manual.length === 0)) {
    items.map((item, idx) => {
      if (idx === 0) {
        resetMaxPriority();
      }
      return {
        ...item,
        contextMenuActions: genEntryActions(context, item, 0, onSetPriority),
        prefix: getPriority(item),
      };
    });
  }

  const lockedMods = [].concat(allMods.manual.filter(isLockedEntry),
    allMods.managed.filter(entry => isLockedEntry(entry.name))
                   .map(entry => entry.name));
  const readableNames = {
    [UNI_PATCH]: 'Unification/Community Patch',
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
                            && !allMods.managed.find(mod =>
                                  (mod.name === UNI_PATCH) && (mod.id === item.id)))
               .map((item, idx) => {
    if (idx === 0) {
      resetMaxPriority(lockedEntries.length);
    }
    return {
      ...item,
      contextMenuActions: genEntryActions(context, item, lockedEntries.length, onSetPriority),
      prefix: getPriority(item),
    };
  });

  const manualEntries = allMods.manual
    .filter(key =>
         (lockedEntries.find(entry => entry.id === key) === undefined)
      && (allMods.managed.find(entry => entry.id === key) === undefined))
    .map(key => {
      const item = {
        id: key,
        name: key,
        imgUrl: `${__dirname}/gameart.jpg`,
        external: true,
      };
      return {
        ...item,
        prefix: getPriority(item),
        contextMenuActions: genEntryActions(context, item, lockedEntries.length, onSetPriority),
      };
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

  let preSorted = [].concat(
    ...lockedEntries,
    items.filter(item => {
      if (typeof(item?.name) !== 'string') {
        return false;
      }
      const isLocked = lockedEntries.find(locked => locked.name === item.name) !== undefined;
      const doNotDisplay = DO_NOT_DISPLAY.includes(item.name.toLowerCase());
      return !isLocked && !doNotDisplay;
    }),
    ...unknownManuallyAdded);

  const isExternal = (entry) => {
    return ((entry.external === true)
      && (allMods.managed.find(man => man.id === entry.id) === undefined));
  };
  preSorted = (updateType !== 'drag-n-drop')
    ? preSorted.sort((lhs, rhs) => lhs.prefix - rhs.prefix)
    : preSorted.reduce((accum, entry, idx) => {
        if (lockedEntries.indexOf(entry) !== -1 || idx === 0) {
          accum.push(entry);
        } else {
          const prevPrefix = parseInt(accum[idx - 1].prefix, 10);
          if (prevPrefix >= entry.prefix) {
            accum.push({
              ...entry,
              external: isExternal(entry),
              prefix: prevPrefix + 1,
            });
          } else {
            accum.push({ ...entry, external: isExternal(entry) });
          }
        }
        return accum;
      }, []);
  return Promise.resolve(preSorted);
}

function findModFolder(installationPath: string, mod: types.IMod): Bluebird<string> {
  if (!installationPath || !mod?.installationPath) {
    const errMessage = !installationPath
      ? 'Game is not discovered'
      : 'Failed to resolve mod installation path';
    return Bluebird.reject(new Error(errMessage));
  }

  const expectedModNameLocation = ['witcher3menumodroot', 'witcher3tl'].includes(mod.type)
    ? path.join(installationPath, mod.installationPath, 'Mods')
    : path.join(installationPath, mod.installationPath);
  return fs.readdirAsync(expectedModNameLocation)
    .then(entries => Promise.resolve(entries[0]));
}

function getManagedModNames(context: types.IComponentContext, mods: types.IMod[]) {
  const installationPath = selectors.installPathForGame(context.api.store.getState(), GAME_ID);
  return Bluebird.reduce(mods, (accum, mod) => findModFolder(installationPath, mod)
    .then(modName => {
      if (!modName || ['collection', 'w3modlimitpatcher'].includes(mod.type)) {
        return Promise.resolve(accum);
      }
      const modComponents = util.getSafe(mod, ['attributes', 'modComponents'], []);
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
      log('error', 'unable to resolve mod name', err);
      return Promise.resolve(accum);
    }), []);
}

const toggleModsState = async (context, props, enabled) => {
  const state = context.api.store.getState();
  const profile = selectors.activeProfile(state);
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], {});
  const modMap = await getAllMods(context);
  const manualLocked = modMap.manual.filter(modName => modName.startsWith(LOCKED_PREFIX));
  const totalLocked = [].concat(modMap.merged, manualLocked);
  const newLO = Object.keys(loadOrder).reduce((accum, key) => {
    if (totalLocked.includes(key)) {
      accum[key] = loadOrder[key];
    } else {
      accum[key] = {
        ...loadOrder[key],
        enabled,
      };
    }
    return accum;
  }, {});
  context.api.store.dispatch(actions.setLoadOrder(profile.id, newLO as any));
  props.refresh();
};

function infoComponent(context, props): JSX.Element {
  const t = context.api.translate;
  return React.createElement(BS.Panel, { id: 'loadorderinfo' },
    React.createElement('h2', {}, t('Managing your load order', { ns: I18N_NAMESPACE })),
    React.createElement(FlexLayout.Flex, { style: { height: '30%' } },
    React.createElement('div', {},
    React.createElement('p', {}, t('You can adjust the load order for The Witcher 3 by dragging and dropping '
      + 'mods up or down on this page.  If you are using several mods that add scripts you may need to use '
      + 'the Witcher 3 Script merger. For more information see: ', { ns: I18N_NAMESPACE }),
    React.createElement('a', { onClick: () => util.opn('https://wiki.nexusmods.com/index.php/Modding_The_Witcher_3_with_Vortex') }, t('Modding The Witcher 3 with Vortex.', { ns: I18N_NAMESPACE }))))),
    React.createElement('div', {
      style: { height: '80%' },
    },
      React.createElement('p', {}, t('Please note:', { ns: I18N_NAMESPACE })),
      React.createElement('ul', {},
        React.createElement('li', {}, t('For Witcher 3, the mod with the lowest index number (by default, the mod sorted at the top) overrides mods with a higher index number.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('You are able to modify the priority manually by right clicking any LO entry and set the mod\'s priority', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('If you cannot see your mod in this load order, you may need to add it manually (see our wiki for details).', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('When managing menu mods, mod settings changed inside the game will be detected by Vortex as external changes - that is expected, '
          + 'choose to use the newer file and your settings will be made persistent.',
          { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('You can change the way the priorities are assgined using the "Switch To Position/Prefix based" button. '
          + 'Prefix based is less restrictive and allows you to set any priority value you want "5000, 69999, etc" while position based will '
          + 'restrict the priorities to the number of load order entries that are available.',
          { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Merges generated by the Witcher 3 Script merger must be loaded first and are locked in the first load order slot.', { ns: I18N_NAMESPACE }))),
        React.createElement(BS.Button, {
          onClick: () => toggleModsState(context, props, false),
          style: {
            marginBottom: '5px',
            width: 'min-content',
          },
        }, t('Disable All')),
        React.createElement('br'),
        React.createElement(BS.Button, {
          onClick: () => toggleModsState(context, props, true),
          style: {
            marginBottom: '5px',
            width: 'min-content',
          },
        }, t('Enable All ')), []));
}

function queryScriptMerge(context, reason) {
  const state = context.api.store.getState();
  const scriptMergerTool = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID, 'tools', SCRIPT_MERGER_ID], undefined);
  if (!!scriptMergerTool?.path) {
    context.api.sendNotification({
      id: 'witcher3-merge',
      type: 'warning',
      message: context.api.translate('Witcher Script merger may need to be executed',
        { ns: I18N_NAMESPACE }),
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
  } else {
    notifyMissingScriptMerger(context.api);
  }
}

function canMerge(game, gameDiscovery) {
  if (game.id !== GAME_ID) {
    return undefined;
  }

  return ({
    baseFiles: () => [
      {
        in: path.join(gameDiscovery.path, CONFIG_MATRIX_REL_PATH, INPUT_XML_FILENAME),
        out: path.join(CONFIG_MATRIX_REL_PATH, INPUT_XML_FILENAME),
      },
    ],
    filter: filePath => filePath.endsWith(INPUT_XML_FILENAME),
  });
}

function readInputFile(context, mergeDir) {
  const state = context.api.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  const gameInputFilepath = path.join(discovery.path, CONFIG_MATRIX_REL_PATH, INPUT_XML_FILENAME);
  return (!!discovery?.path)
    ? fs.readFileAsync(path.join(mergeDir, CONFIG_MATRIX_REL_PATH, INPUT_XML_FILENAME))
      .catch(err => (err.code === 'ENOENT')
        ? fs.readFileAsync(gameInputFilepath)
        : Promise.reject(err))
    : Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
}

const emptyXml = '<?xml version="1.0" encoding="UTF-8"?><metadata></metadata>';
function merge(filePath, mergeDir, context) {
  let modData;
  return fs.readFileAsync(filePath)
    .then(async xmlData => {
      try {
        modData = await parseStringPromise(xmlData);
        return Promise.resolve();
      } catch (err) {
        // The mod itself has invalid xml data.
        context.api.showErrorNotification('Invalid mod XML data - inform mod author',
        { path: filePath, error: err.message }, { allowReport: false });
        modData = emptyXml;
        return Promise.resolve();
      }
    })
    .then(() => readInputFile(context, mergeDir))
    .then(async mergedData => {
      try {
        const merged = await parseStringPromise(mergedData);
        return Promise.resolve(merged);
      } catch (err) {
        // This is the merged file - if it's invalid chances are we messed up
        //  somehow, reason why we're going to allow this error to get reported.
        const state = context.api.store.getState();
        const activeProfile = selectors.activeProfile(state);
        const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
        context.api.showErrorNotification('Invalid merged XML data', err, {
          allowReport: true,
          attachments: [
            { id: '__merged/input.xml', type: 'data', data: mergedData,
              description: 'Witcher 3 menu mod merged data' },
            { id: `${activeProfile.id}_loadOrder`, type: 'data', data: loadOrder,
              description: 'Current load order' },
          ],
        });
        return Promise.reject(new util.DataInvalid('Invalid merged XML data'));
      }
    })
    .then(gameIndexFile => {
      const modGroups = modData?.UserConfig?.Group;
      for (let i = 0; i < modGroups.length; i++) {
        const gameGroups = gameIndexFile?.UserConfig?.Group;
        const iter = modGroups[i];
        const modVars = iter?.VisibleVars?.[0]?.Var;
        const gameGroupIdx = gameGroups.findIndex(group => group?.$?.id === iter?.$?.id);
        if (gameGroupIdx !== -1) {
          const gameGroup = gameGroups[gameGroupIdx];
          const gameVars = gameGroup?.VisibleVars?.[0]?.Var;
          for (let j = 0; j < modVars.length; j++) {
            const modVar = modVars[j];
            const id = modVar?.$?.id;
            const gameVarIdx = gameVars.findIndex(v => v?.$?.id === id);
            if (gameVarIdx !== -1) {
              gameIndexFile.UserConfig.Group[gameGroupIdx].VisibleVars[0].Var[gameVarIdx] = modVar;
            } else {
              gameIndexFile.UserConfig.Group[gameGroupIdx].VisibleVars[0].Var.push(modVar);
            }
          }
        } else {
          gameIndexFile.UserConfig.Group.push(modGroups[i]);
        }
      }
      const builder = new Builder();
      const xml = builder.buildObject(gameIndexFile);
      return fs.writeFileAsync(
        path.join(mergeDir, CONFIG_MATRIX_REL_PATH, INPUT_XML_FILENAME),
        xml);
    })
    .catch(err => {
      log('error', 'input.xml merge failed', err);
      return Promise.resolve();
    });
}

const SCRIPT_MERGER_FILES = ['WitcherScriptMerger.exe'];
function scriptMergerTest(files, gameId) {
  const matcher = (file => SCRIPT_MERGER_FILES.includes(file));
  const supported = ((gameId === GAME_ID) && (files.filter(matcher).length > 0));

  return Promise.resolve({ supported, requiredFiles: SCRIPT_MERGER_FILES });
}

function modSettingsErrorHandler(context, err, errMessage) {
  let allowReport = true;
  const userCanceled = err instanceof util.UserCanceled;
  if (userCanceled) {
    allowReport = false;
  }
  const busyResource = err instanceof ResourceInaccessibleError;
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
    + 'the automatic merger installer/updater should then kick off and set up the tool for you.',
    { allowReport: false });
  return Promise.reject(new util.ProcessCanceled('Invalid mod'));
}

export function toBlue<T>(func: (...args: any[]) => Promise<T>): (...args: any[]) => Bluebird<T> {
  return (...args: any[]) => Bluebird.resolve(func(...args));
}

function determineExecutable(discoveredPath: string): string {
  if (discoveredPath !== undefined) {
    try {
      fs.statSync(path.join(discoveredPath, 'bin', 'x64_DX12', 'witcher3.exe'));
      return 'bin/x64_DX12/witcher3.exe';
    } catch (err) {
      // nop, use fallback
    }
  }
  return 'bin/x64/witcher3.exe';
}

function main(context: types.IExtensionContext) {
  context.registerReducer(['settings', 'witcher3'], W3Reducer);
  let priorityManager: PriorityManager;
  let modLimitPatcher: ModLimitPatcher;
  context.registerGame({
    id: GAME_ID,
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
      ignoreConflicts: DO_NOT_DEPLOY,
      ignoreDeploy: DO_NOT_DEPLOY,
      hashFiles: ['bin/x64/witcher3.exe'],
    },
  });

  const getDLCPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return path.join(discovery.path, 'DLC');
  };

  const getTLPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return discovery.path;
  };

  const isTW3 = (gameId = undefined) => {
    if (gameId !== undefined) {
      return (gameId === GAME_ID);
    }
    const state = context.api.getState();
    const gameMode = selectors.activeGameId(state);
    return (gameMode === GAME_ID);
  };

  context.registerInstaller('witcher3tl', 25, toBlue(testSupportedTL), toBlue(installTL));
  context.registerInstaller('witcher3mixed', 30, toBlue(testSupportedMixed), toBlue(installMixed));
  context.registerInstaller('witcher3content', 50,
    toBlue(testSupportedContent), toBlue(installContent));
  context.registerInstaller('witcher3menumodroot', 20,
    toBlue(testMenuModRoot as any), toBlue(installMenuMod));
  context.registerInstaller('witcher3dlcmod', 60, testDLCMod as any, installDLCMod as any)
  context.registerInstaller('scriptmergerdummy', 15,
    toBlue(scriptMergerTest), toBlue((files) => scriptMergerDummyInstaller(context, files)));

  context.registerModType('witcher3tl', 25, isTW3, getTLPath, toBlue(testTL));
  context.registerModType('witcher3dlc', 25, isTW3, getDLCPath, toBlue(testDLC));
  context.registerModType('witcher3menumodroot', 20,
    isTW3, getTLPath, toBlue(testMenuModRoot as any));
  context.registerModType('witcher3menumoddocuments', 60, isTW3,
    (game) => path.join(util.getVortexPath('documents'), 'The Witcher 3'),
    () => Bluebird.resolve(false));

  context.registerModType('w3modlimitpatcher', 25, isTW3, getTLPath, () => Bluebird.resolve(false),
    { deploymentEssential: false, name: 'Mod Limit Patcher Mod Type' });

  context.registerMerge(canMerge,
    (filePath, mergeDir) => merge(filePath, mergeDir, context), 'witcher3menumodroot');

  context.registerMigration((oldVersion) => (migrate148(context, oldVersion) as any));

  registerActions({
    context,
    refreshFunc,
    getPriorityManager: () => priorityManager,
    getModLimitPatcher: () => modLimitPatcher,
  });

  context.optional.registerCollectionFeature(
    'witcher3_collection_data',
    (gameId: string, includedMods: string[], collection: types.IMod) =>
      genCollectionsData(context, gameId, includedMods, collection),
    (gameId: string, collection: IW3CollectionsData) =>
      parseCollectionsData(context, gameId, collection),
    () => Promise.resolve(),
    (t) => t('Witcher 3 Data'),
    (state: types.IState, gameId: string) => gameId === GAME_ID,
    CollectionsDataView,
  );

  context.registerProfileFeature(
    'local_merges', 'boolean', 'settings', 'Profile Data',
    'This profile will store and restore profile specific data (merged scripts, loadorder, etc) when switching profiles',
    () => {
      const activeGameId = selectors.activeGameId(context.api.getState());
      return activeGameId === GAME_ID;
    });

  const invalidModTypes = ['witcher3menumoddocuments', 'collection'];
  context.registerLoadOrderPage({
    gameId: GAME_ID,
    createInfoPanel: (props) => {
      refreshFunc = props.refresh;
      return infoComponent(context, props) as any;
    },
    gameArtURL: `${__dirname}/gameart.jpg`,
    filter: (mods) => mods.filter(mod => !invalidModTypes.includes(mod.type)),
    preSort: (items: any[], direction: any, updateType: any) => {
      return preSort(context, items, direction, updateType, priorityManager) as any;
    },
    noCollectionGeneration: true,
    callback: (loadOrder, updateType) => {
      if (loadOrder === _PREVIOUS_LO) {
        return;
      }

      if (_PREVIOUS_LO !== undefined) {
        context.api.store.dispatch(actions.setDeploymentNecessary(GAME_ID, true));
      }
      _PREVIOUS_LO = loadOrder;
      setINIStruct(context, loadOrder, priorityManager)
        .then(() => writeToModSettings())
        .catch(err => modSettingsErrorHandler(context, err,
          'Failed to modify load order file'));
    },
  });

  context.registerTest('tw3-mod-limit-breach', 'gamemode-activated',
    () => Bluebird.resolve(testModLimitBreach(context.api, modLimitPatcher)));
  context.registerTest('tw3-mod-limit-breach', 'mod-activated',
    () => Bluebird.resolve(testModLimitBreach(context.api, modLimitPatcher)));

  const revertLOFile = () => {
    const state = context.api.store.getState();
    const profile = selectors.activeProfile(state);
    if (!!profile && (profile.gameId === GAME_ID)) {
      const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], undefined);
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
              refreshFunc?.();
              return Promise.resolve();
            })
            .catch(err => modSettingsErrorHandler(context, err,
              'Failed to cleanup load order file'));
        } else {
          const filePath = getLoadOrderFilePath();
          fs.removeAsync(filePath)
            .catch(err => (err.code === 'ENOENT')
              ? Promise.resolve()
              : context.api.showErrorNotification('Failed to cleanup load order file', err));
        }
      });
    }
  };

  const validateProfile = (profileId, state) => {
    const activeProfile = selectors.activeProfile(state);
    const deployProfile = selectors.profileById(state, profileId);
    if (!!activeProfile && !!deployProfile && (deployProfile.id !== activeProfile.id)) {
      return undefined;
    }

    if (activeProfile?.gameId !== GAME_ID) {
      return undefined;
    }

    return activeProfile;
  };

  let prevDeployment = [];
  context.once(() => {
    modLimitPatcher = new ModLimitPatcher(context.api);
    priorityManager = new PriorityManager(context.api, 'prefix-based');
    context.api.events.on('gamemode-activated', async (gameMode) => {
      if (gameMode !== GAME_ID) {
        // Just in case the script merger notification is still
        //  present.
        context.api.dismissNotification('witcher3-merge');
      } else {
        const state = context.api.getState();
        const lastProfId = selectors.lastActiveProfileForGame(state, gameMode);
        const activeProf = selectors.activeProfile(state);
        const priorityType = util.getSafe(state, getPriorityTypeBranch(), 'prefix-based');
        context.api.store.dispatch(setPriorityType(priorityType));
        if (lastProfId !== activeProf?.id) {
          try {
            await storeToProfile(context, lastProfId)
              .then(() => restoreFromProfile(context, activeProf?.id));
          } catch (err) {
            context.api.showErrorNotification('Failed to restore profile merged files', err);
          }
        }
      }
    });
    context.api.onAsync('will-deploy', (profileId, deployment) => {
      const state = context.api.store.getState();
      const activeProfile = validateProfile(profileId, state);
      if (activeProfile === undefined) {
        return Promise.resolve();
      }

      return menuMod.onWillDeploy(context.api, deployment, activeProfile)
        .catch(err => (err instanceof util.UserCanceled)
          ? Promise.resolve()
          : Promise.reject(err));
    });
    context.api.onAsync('did-deploy', async (profileId, deployment) => {
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
      const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
      const docFiles = (deployment['witcher3menumodroot'] ?? [])
        .filter(file => file.relPath.endsWith(PART_SUFFIX)
                        && (file.relPath.indexOf(INPUT_XML_FILENAME) === -1));
      const menuModPromise = () => {
        if (docFiles.length === 0) {
          // If there are no menu mods deployed - remove the mod.
          return menuMod.removeMod(context.api, activeProfile);
        } else {
          return menuMod.onDidDeploy(context.api, deployment, activeProfile)
            .then(async modId => {
              if (modId === undefined) {
                return Promise.resolve();
              }

              context.api.store.dispatch(actions.setModEnabled(activeProfile.id, modId, true));
              await context.api.emitAndAwait('deploy-single-mod', GAME_ID, modId);
              return Promise.resolve();
            });
        }
      };

      return menuModPromise()
        .then(() => setINIStruct(context, loadOrder, priorityManager))
        .then(() => writeToModSettings())
        .then(() => {
          refreshFunc?.();
          return Promise.resolve();
        })
        .catch(err => modSettingsErrorHandler(context, err,
          'Failed to modify load order file'));
    });
    context.api.events.on('profile-will-change', async (newProfileId) => {
      const state = context.api.getState();
      const profile = selectors.profileById(state, newProfileId);
      if (profile?.gameId !== GAME_ID) {
        return;
      }

      const priorityType = util.getSafe(state, getPriorityTypeBranch(), 'prefix-based');
      context.api.store.dispatch(setPriorityType(priorityType));

      const lastProfId = selectors.lastActiveProfileForGame(state, profile.gameId);
      try {
        await storeToProfile(context, lastProfId)
          .then(() => restoreFromProfile(context, profile.id));
      } catch (err) {
        if (!(err instanceof util.UserCanceled)) {
          context.api.showErrorNotification('Failed to store profile specific merged items', err);
        }
      }
    });

    context.api.onStateChange(['settings', 'witcher3'], (prev, current) => {
      const state = context.api.getState();
      const activeProfile = selectors.activeProfile(state);
      if (activeProfile?.gameId !== GAME_ID || priorityManager === undefined) {
        return;
      }

      const priorityType = util.getSafe(state, getPriorityTypeBranch(), 'prefix-based');
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
