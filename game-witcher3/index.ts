/* eslint-disable */
import Bluebird from 'bluebird';
import path from 'path';
import { actions, fs, log, selectors, types, util } from 'vortex-api';
import winapi from 'winapi-bindings';

import { getPersistentLoadOrder, migrate148 } from './migrations';

import { Builder, parseStringPromise } from 'xml2js';

import { genCollectionsData, parseCollectionsData } from './collections/collections';
import { IW3CollectionsData } from './collections/types';
import CollectionsDataView from './views/CollectionsDataView';

import { downloadScriptMerger, getScriptMergerDir, setMergerConfig } from './scriptmerger';

import { DO_NOT_DEPLOY, GAME_ID, getLoadOrderFilePath,
  LOCKED_PREFIX, SCRIPT_MERGER_ID, VORTEX_BACKUP_TAG,
} from './common';

import { testDLC, testTL } from './modTypes';

import { registerActions } from './iconbarActions';
import { PriorityManager } from './priorityManager';

import { installContent, installMenuMod, installTL, installDLCMod, installMixed,
  scriptMergerDummyInstaller, scriptMergerTest, testMenuModRoot, testSupportedContent,
  testSupportedTL, testSupportedMixed, testDLCMod } from './installers';

import { W3Reducer } from './reducers';

import { getDLCPath, getAllMods, determineExecutable, getDocumentsPath,
  getTLPath, isTW3, notifyMissingScriptMerger, fileExists } from './util';
import TW3LoadOrder from './loadOrder';


import { onDidDeploy, onDidPurge, onDidRemoveMod, onGameModeActivation, onModsDisabled,
  onProfileWillChange, onSettingsChange, onWillDeploy } from './eventHandlers';
import IniStructure from './iniParser';

const GOG_ID = '1207664663';
const GOG_ID_GOTY = '1495134320';
const GOG_WH_ID = '1207664643';
const GOG_WH_GOTY = '1640424747';
const STEAM_ID = '499450';
const STEAM_ID_WH = '292030';
const EPIC_ID = '725a22e15ed74735bb0d6a19f3cc82d0';

const CONFIG_MATRIX_REL_PATH = path.join('bin', 'config', 'r4game', 'user_config_matrix', 'pc');
const CONFIG_MATRIX_FILES = ['audio', 'display', 'gameplay', 'gamma', 'graphics', 'graphicsdx11', 'hdr', 'hidden', 'hud', 'input', 'localization'];

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

function prepareForModding(api: types.IExtensionApi) {
  return (discovery: types.IDiscoveryResult) => {
    const findScriptMerger = async (error) => {
      log('error', 'failed to download/install script merger', error);
      const scriptMergerPath = await getScriptMergerDir(api);
      if (scriptMergerPath === undefined) {
        notifyMissingScriptMerger(api);
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
        .then(() => downloadScriptMerger(api)
          .catch(err => (err instanceof util.UserCanceled)
            ? Promise.resolve()
            : findScriptMerger(err)));
  }
}

function isXML(filePath) {
  return ['.xml'].includes(path.extname(filePath).toLowerCase());
}

function canMerge(api: types.IExtensionApi) {
  return (game, gameDiscovery) => {
    if (game.id !== GAME_ID) {
      return undefined;
    }

    return {
      baseFiles: (deployedFiles: types.IDeployedFile[]) => deployedFiles
        .filter(file => isXML(file.relPath))
        .map(file => ({
          in: path.join(gameDiscovery.path, CONFIG_MATRIX_REL_PATH, file.relPath),
          out: path.join(CONFIG_MATRIX_REL_PATH, file.relPath),
        })),
      filter: filePath => isXML(filePath) && CONFIG_MATRIX_FILES.includes(path.basename(filePath, path.extname(filePath))),
    };
  }
}

async function readInputFile(api: types.IExtensionApi, modFilePath: string, mergeDirPath: string) {
  const state = api.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if (!discovery?.path) {
    return Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
  }
  const gameInputFilepath = path.join(discovery.path, CONFIG_MATRIX_REL_PATH, path.basename(modFilePath));
  const mergedFilePath = path.join(mergeDirPath, CONFIG_MATRIX_REL_PATH, path.basename(modFilePath));
  const backupFilePath = gameInputFilepath + VORTEX_BACKUP_TAG;
  try {
    if (await fileExists(mergedFilePath)) {
      return fs.readFileAsync(mergedFilePath);
    }
    if (await fileExists(backupFilePath)) {
      return fs.readFileAsync(backupFilePath);
    }
    return fs.readFileAsync(gameInputFilepath);
  } catch (err) {
    // Perhaps we should show a dialog here to ask the user whether they want to still
    //  deploy the mod's xml data to the game's directory.
    // For that to happen we need to take out the CONFIG_MATRIX_FILES array.
    
    // const result = await api.showDialog('question', 'Failed to read game XML data.', {
    //   text: 'One of your mods is trying',
    // },[
    //   { label: 'Retry' },
    //   { label: 'Cancel' },
    // ]);
    return Promise.reject(err);
  }
}

class ModXMLDataInvalid extends util.DataInvalid {
  constructor(message: string, modFilePath: string) {
    super(`${message}:\n${modFilePath}`);
  }
}

// Example of how we expect the vars to be wrapped:
// <?xml version="1.0" encoding="UTF-16"?>
// <UserConfig>
// 	<Group builder="Input" id="PCInput" displayName="controls_pc" tags="keybinds">
// 		<VisibleVars>
// 			<Var builder="Input" id="MoveFwd"					displayName="move_forward"						displayType="INPUTPC" actions="MoveForward;MovementDoubleTapW;ChangeChoiceUp"/>
// 			<Var builder="Input" id="MoveBck"					displayName="move_back"							displayType="INPUTPC" actions="MoveBackward;MovementDoubleTapS;ChangeChoiceDown;GI_Decelerate"/>
//     </VisibleVars>
// 	</Group>
// </UserConfig>
// Adding a group with a different id will create a new group in the game's input.xml
//  file, if the group already exists it will merge the vars into the existing group.
const doMerge = (api: types.IExtensionApi) => async (modFilePath: string, targetMergeDir: string) => {
  try {
    const modData = await fs.readFileAsync(modFilePath);
    const modXml = await parseStringPromise(modData);
    const modGroups = modXml?.UserConfig?.Group;
    if (!modGroups) {
      const err = new ModXMLDataInvalid('Invalid XML data - inform mod author', modFilePath);
      api.showErrorNotification('Failed to merge XML data', err, { allowReport: false });
      return Promise.resolve();
    }
    const currentInputFile = await readInputFile(api, modFilePath, targetMergeDir);
    const mergedXmlData = await parseStringPromise(currentInputFile);
    modGroups.forEach(modGroup => {
      const gameGroups = mergedXmlData?.UserConfig?.Group;
      const modVars = modGroup?.VisibleVars?.[0]?.Var;
      const gameGroup = gameGroups.find(group => group?.$?.id === modGroup?.$?.id);
      if (gameGroup) {
        const gameVars = gameGroup?.VisibleVars?.[0]?.Var;
        modVars.forEach(modVar => {
          const gameVar = gameVars.find(v => v?.$?.id === modVar?.$?.id);
          if (gameVar) {
            Object.assign(gameVar, modVar);
          } else {
            gameVars.push(modVar);
          }
        });
      } else {
        gameGroups.push(modGroup);
      }
    });
    const builder = new Builder({ doctype: { dtd: 'UTF-16' } });
    const xml = builder.buildObject(mergedXmlData);
    await fs.ensureDirWritableAsync(path.join(targetMergeDir, CONFIG_MATRIX_REL_PATH));
    return fs.writeFileAsync(path.join(targetMergeDir, CONFIG_MATRIX_REL_PATH, path.basename(modFilePath)), xml);
  } catch (err) {
    const state = api.store.getState();
    const activeProfile = selectors.activeProfile(state);
    const loadOrder = getPersistentLoadOrder(api);
    const extendedErr = util.deepMerge({ modFilePath, targetMergeDir, message: err.message, stack: err.stack }, err);
    api.showErrorNotification('Failed to merge XML data', extendedErr, {
      allowReport: true,
      attachments: [
        {
          id: `${activeProfile.id}_loadOrder`,
          type: 'data',
          data: loadOrder,
          description: 'Current load order'
        },
      ],
    });
    return Promise.resolve();
  }
}

let loadOrder: TW3LoadOrder;
let priorityManager: PriorityManager;
const getPriorityManager = () => priorityManager;
// let modLimitPatcher: ModLimitPatcher;

function main(context: types.IExtensionContext) {
  context.registerReducer(['settings', 'witcher3'], W3Reducer);
  context.registerGame({
    id: GAME_ID,
    name: 'The Witcher 3',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.jpg',
    executable: determineExecutable,
    setup: prepareForModding(context.api) as any,
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
    },
  });

  context.registerInstaller('scriptmergerdummy', 15, scriptMergerTest as any, scriptMergerDummyInstaller as any);
  context.registerInstaller('witcher3menumodroot', 20, testMenuModRoot as any, installMenuMod as any);
  context.registerInstaller('witcher3mixed', 25, testSupportedMixed as any, installMixed as any);
  context.registerInstaller('witcher3tl', 30, testSupportedTL as any, installTL as any);
  context.registerInstaller('witcher3content', 50, testSupportedContent as any, installContent as any);
  context.registerInstaller('witcher3dlcmod', 60, testDLCMod as any, installDLCMod as any);

  context.registerModType('witcher3menumodroot', 20, isTW3(context.api), getTLPath(context.api), testMenuModRoot as any);
  context.registerModType('witcher3tl', 25, isTW3(context.api), getTLPath(context.api), testTL as any);
  context.registerModType('witcher3dlc', 25, isTW3(context.api), getDLCPath(context.api), testDLC as any);
  context.registerModType('w3modlimitpatcher', 25, isTW3(context.api), getTLPath(context.api), () => Bluebird.resolve(false),
    { deploymentEssential: false, name: 'Mod Limit Patcher Mod Type' });
  context.registerModType('witcher3menumoddocuments', 60, isTW3(context.api), getDocumentsPath, () => Bluebird.resolve(false));

  context.registerMerge(canMerge(context.api), doMerge(context.api) as any, 'witcher3menumodroot');

  context.registerMigration((oldVersion) => (migrate148(context, oldVersion) as any));

  registerActions({ context, getPriorityManager });

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

  const toggleModsState = async (enabled) => {
    const state = context.api.store.getState();
    const profile = selectors.activeProfile(state);
    const loadOrder = getPersistentLoadOrder(context.api);
    const modMap = await getAllMods(context.api);
    const manualLocked = modMap.manual.filter(modName => modName.startsWith(LOCKED_PREFIX));
    const totalLocked = [].concat(modMap.merged, manualLocked);
    const newLO = loadOrder.reduce((accum, key, idx) => {
      if (totalLocked.includes(key)) {
        accum.push(loadOrder[idx]);
      } else {
        accum.push({
          ...loadOrder[idx],
          enabled,
        });
      }
      return accum;
    }, []);
    context.api.store.dispatch(actions.setLoadOrder(profile.id, newLO as any));
  };
  const props = {
    onToggleModsState: toggleModsState,
    api: context.api,
    getPriorityManager,
  }
  context.registerLoadOrder(new TW3LoadOrder(props));
  // context.registerTest('tw3-mod-limit-breach', 'gamemode-activated',
  //   () => Bluebird.resolve(testModLimitBreach(context.api, modLimitPatcher)));
  // context.registerTest('tw3-mod-limit-breach', 'mod-activated',
  //   () => Bluebird.resolve(testModLimitBreach(context.api, modLimitPatcher)));

  context.once(() => {
    priorityManager = new PriorityManager(context.api, 'prefix-based');
    IniStructure.getInstance(context.api, getPriorityManager);
    // modLimitPatcher = new ModLimitPatcher(context.api);
    loadOrder = new TW3LoadOrder({
      api: context.api,
      getPriorityManager,
      onToggleModsState: toggleModsState
    });

    context.api.events.on('gamemode-activated', onGameModeActivation(context.api));
    context.api.events.on('profile-will-change', onProfileWillChange(context.api));
    context.api.events.on('mods-enabled', onModsDisabled(context.api, getPriorityManager));

    context.api.onAsync('will-deploy', onWillDeploy(context.api) as any);
    context.api.onAsync('did-deploy', onDidDeploy(context.api) as any);
    context.api.onAsync('did-purge', onDidPurge(context.api, getPriorityManager) as any);
    context.api.onAsync('did-remove-mod', onDidRemoveMod(context.api, getPriorityManager) as any);

    context.api.onStateChange(['settings', 'witcher3'], onSettingsChange(context.api, getPriorityManager) as any);
  });
  return true;
}

module.exports = {
  default: main,
};
