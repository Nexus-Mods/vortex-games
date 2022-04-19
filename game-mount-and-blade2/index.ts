import { Promise as Bluebird } from 'bluebird';

import * as React from 'react';
import * as BS from 'react-bootstrap';

import { BannerlordModuleManager } from './bmm/index';

import getVersion from 'exe-version';

import path from 'path';
import semver, { sort } from 'semver';
import { actions, FlexLayout, fs, log, selectors, types, util } from 'vortex-api';
import { getElementValue, getXMLData, refreshGameParams, walkAsync } from './util';

import {
  BANNERLORD_EXEC, GAME_ID, I18N_NAMESPACE,
  MODULES, OFFICIAL_MODULES, SUBMOD_FILE,
} from './common';
import CustomItemRenderer from './customItemRenderer';
import { migrate026, migrate045 } from './migrations';

import { genCollectionsData, parseCollectionsData } from './collections/collections';
import { ICollectionsData } from './collections/types';
import { getCache, refreshCache } from './subModCache';
import { ILoadOrder, IModuleCache, IModuleInfoExtendedExt, ISortProps } from './types';
import CollectionsDataView from './views/CollectionsDataView';

import { createAction } from 'redux-act';

import Settings from './views/Settings';

const LAUNCHER_EXEC = path.join('bin', 'Win64_Shipping_Client', 'TaleWorlds.MountAndBlade.Launcher.exe');
const MODDING_KIT_EXEC = path.join('bin', 'Win64_Shipping_wEditor', 'TaleWorlds.MountAndBlade.Launcher.exe');

let STORE_ID;

const GOG_IDS = ['1802539526', '1564781494'];
const STEAMAPP_ID = 261550;
const EPICAPP_ID = 'Chickadee';

// A set of folder names (lowercased) which are available alongside the
//  game's modules folder. We could've used the fomod installer stop patterns
//  functionality for this, but it's better if this extension is self contained;
//  especially given that the game's modding pattern changes quite often.
const ROOT_FOLDERS = new Set(['bin', 'data', 'gui', 'icons', 'modules',
  'music', 'shaders', 'sounds', 'xmlschemas']);

const setSortOnDeploy = createAction('MNB2_SET_SORT_ON_DEPLOY',
  (profileId: string, sort: boolean) => ({ profileId, sort }));
const reducer: types.IReducerSpec = {
  reducers: {
    [setSortOnDeploy as any]: (state, payload) =>
      util.setSafe(state, ['sortOnDeploy', payload.profileId], payload.sort),
  },
  defaults: {
    sortOnDeploy: {},
  },
};

function findGame() {
  return util.GameStoreHelper.findByAppId([EPICAPP_ID, STEAMAPP_ID.toString(), ...GOG_IDS])
    .then(game => {
      STORE_ID = game.gameStoreId;
      return Promise.resolve(game.gamePath);
    });
}

function testRootMod(files, gameId) {
  const notSupported = { supported: false, requiredFiles: [] };
  if (gameId !== GAME_ID) {
    // Different game.
    return Promise.resolve(notSupported);
  }

  const lowered = files.map(file => file.toLowerCase());
  const modsFile = lowered.find(file => file.split(path.sep).indexOf(MODULES.toLowerCase()) !== -1);
  if (modsFile === undefined) {
    // There's no Modules folder.
    return Promise.resolve(notSupported);
  }

  const idx = modsFile.split(path.sep).indexOf(MODULES.toLowerCase());
  const rootFolderMatches = lowered.filter(file => {
    const segments = file.split(path.sep);
    return (((segments.length - 1) > idx) && ROOT_FOLDERS.has(segments[idx]));
  }) || [];

  return Promise.resolve({ supported: (rootFolderMatches.length > 0), requiredFiles: [] });
}

function installRootMod(files, destinationPath) {
  const moduleFile = files.find(file => file.split(path.sep).indexOf(MODULES) !== -1);
  const idx = moduleFile.split(path.sep).indexOf(MODULES);
  const subMods = files.filter(file => path.basename(file).toLowerCase() === SUBMOD_FILE);
  return Bluebird.map(subMods, async (modFile: string) => {
    const subModId = await getElementValue(path.join(destinationPath, modFile), 'Id');
    return Bluebird.resolve(subModId);
  })
  .then((subModIds: string[]) => {
    const filtered = files.filter(file => {
      const segments = file.split(path.sep).map(seg => seg.toLowerCase());
      const lastElementIdx = segments.length - 1;

      // Ignore directories and ensure that the file contains a known root folder at
      //  the expected index.
      return (ROOT_FOLDERS.has(segments[idx])
        && (path.extname(segments[lastElementIdx]) !== ''));
      });
    const attributes = subModIds.length > 0
      ? [
          {
            type: 'attribute',
            key: 'subModIds',
            value: subModIds,
          },
        ]
      : [];
    const instructions = attributes.concat(filtered.map(file => {
      const destination = file.split(path.sep)
                              .slice(idx)
                              .join(path.sep);
      return {
        type: 'copy',
        source: file,
        destination,
      };
    }));

    return Bluebird.resolve({ instructions });
  });
}

function testForSubmodules(files, gameId) {
  // Check this is a mod for Bannerlord and it contains a SubModule.xml
  const supported = ((gameId === GAME_ID)
    && files.find(file => path.basename(file).toLowerCase() === SUBMOD_FILE) !== undefined);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

async function installSubModules(files, destinationPath) {
  // Remove directories straight away.
  const filtered = files.filter(file => {
    const segments = file.split(path.sep);
    return path.extname(segments[segments.length - 1]) !== '';
  });
  const subModIds = [];
  const subMods = filtered.filter(file => path.basename(file).toLowerCase() === SUBMOD_FILE);
  return Bluebird.reduce(subMods, async (accum, modFile: string) => {
    const segments = modFile.split(path.sep).filter(seg => !!seg);
    const subModId = await getElementValue(path.join(destinationPath, modFile), 'Id');
    const modName = (segments.length > 1)
      ? segments[segments.length - 2]
      : subModId;
    if (modName === undefined) {
      return Promise.reject(new util.DataInvalid('Invalid Submodule.xml file - inform the mod author'));
    }
    subModIds.push(subModId);
    const idx = modFile.toLowerCase().indexOf(SUBMOD_FILE);
    // Filter the mod files for this specific submodule.
    const subModFiles: string[]
      = filtered.filter(file => file.slice(0, idx) === modFile.slice(0, idx));
    const instructions = subModFiles.map((modFile: string) => ({
      type: 'copy',
      source: modFile,
      destination: path.join(MODULES, modName, modFile.slice(idx)),
    }));
    return accum.concat(instructions);
  }, [])
  .then(merged => {
    const subModIdsAttr = {
      type: 'attribute',
      key: 'subModIds',
      value: subModIds,
    };
    return Promise.resolve({ instructions: [].concat(merged, [subModIdsAttr]) });
  });
}

function ensureOfficialLauncher(context, discovery) {
  context.api.store.dispatch(actions.addDiscoveredTool(GAME_ID, 'TaleWorldsBannerlordLauncher', {
    id: 'TaleWorldsBannerlordLauncher',
    name: 'Official Launcher',
    logo: 'twlauncher.png',
    executable: () => path.basename(LAUNCHER_EXEC),
    requiredFiles: [
      path.basename(LAUNCHER_EXEC),
    ],
    path: path.join(discovery.path, LAUNCHER_EXEC),
    relative: true,
    workingDirectory: path.join(discovery.path, 'bin', 'Win64_Shipping_Client'),
    hidden: false,
    custom: false,
  }, false));
}

function setModdingTool(context: types.IExtensionContext,
                        discovery: types.IDiscoveryResult,
                        hidden?: boolean) {
  const toolId = 'bannerlord-sdk';
  const exec = path.basename(MODDING_KIT_EXEC);
  const tool = {
    id: toolId,
    name: 'Modding Kit',
    logo: 'twlauncher.png',
    executable: () => exec,
    requiredFiles: [ exec ],
    path: path.join(discovery.path, MODDING_KIT_EXEC),
    relative: true,
    exclusive: true,
    workingDirectory: path.join(discovery.path, path.dirname(MODDING_KIT_EXEC)),
    hidden,
    custom: false,
  };

  context.api.store.dispatch(actions.addDiscoveredTool(GAME_ID, toolId, tool, false));
}

async function prepareForModding(context, discovery, bmm: BannerlordModuleManager) {
  if (bmm === undefined) {
    bmm = await BannerlordModuleManager.createAsync();
  }
  // Quickly ensure that the official Launcher is added.
  ensureOfficialLauncher(context, discovery);
  try {
    await fs.statAsync(path.join(discovery.path, MODDING_KIT_EXEC));
    setModdingTool(context, discovery);
  } catch (err) {
    const tools = discovery?.tools;
    if ((tools !== undefined)
    && (util.getSafe(tools, ['bannerlord-sdk'], undefined) !== undefined)) {
      setModdingTool(context, discovery, true);
    }
  }

  // If game store not found, location may be set manually - allow setup
  //  function to continue.
  const findStoreId = () => findGame().catch(err => Promise.resolve());
  const startSteam = () => findStoreId()
    .then(() => (STORE_ID === 'steam')
      ? util.GameStoreHelper.launchGameStore(context.api, STORE_ID, undefined, true)
      : Promise.resolve());

  // Check if we've already set the load order object for this profile
  //  and create it if we haven't.
  return startSteam().then(async () => {
    try {
      await refreshCache(context, bmm);
    } catch (err) {
      return Promise.reject(err);
    }
  })
  .finally(() => {
    const state = context.api.store.getState();
    const activeProfile = selectors.activeProfile(state);
    if (activeProfile === undefined) {
      // Valid use case when attempting to switch to
      //  Bannerlord without any active profile.
      return refreshGameParams(context, {});
    }
    const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
    return refreshGameParams(context, loadOrder);
  });
}

function tSort(sortProps: ISortProps) {
  const { bmm } = sortProps;
  const CACHE: IModuleCache = getCache();
  const sorted = bmm.sort(Object.values(CACHE));
  return sorted;
}

function isExternal(context, subModId) {
  const state = context.api.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const modIds = Object.keys(mods);
  modIds.forEach(modId => {
    const subModIds = util.getSafe(mods[modId], ['attributes', 'subModIds'], []);
    if (subModIds.includes(subModId)) {
      return false;
    }
  });
  return true;
}

let refreshFunc;
async function refreshCacheOnEvent(context: types.IExtensionContext,
                                   profileId: string,
                                   bmm: BannerlordModuleManager) {
  if (profileId === undefined) {
    return Promise.resolve();
  }

  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  const deployProfile = selectors.profileById(state, profileId);
  if ((activeProfile?.gameId !== deployProfile?.gameId) || (activeProfile?.gameId !== GAME_ID)) {
    // Deployment event seems to be executed for a profile other
    //  than the currently active one. Not going to continue.
    return Promise.resolve();
  }
  try {
    await refreshCache(context, bmm);
  } catch (err) {
    // ProcessCanceled means that we were unable to scan for deployed
    //  subModules, probably because game discovery is incomplete.
    // It's beyond the scope of this function to report discovery
    //  related issues.
    return (err instanceof util.ProcessCanceled)
      ? Promise.resolve()
      : Promise.reject(err);
  }

  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profileId], {});

  if (util.getSafe(state, ['settings', 'mountandblade2', 'sortOnDeploy', activeProfile.id], true)) {
    return sortImpl(context, bmm);
  } else {
    if (refreshFunc !== undefined) {
      refreshFunc();
    }
    return refreshGameParams(context, loadOrder);
  }
}

async function preSort(context, items, direction, updateType, bmm) {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  if (activeProfile?.id === undefined || activeProfile?.gameId !== GAME_ID) {
    // Race condition ?
    return Promise.resolve(items);
  }
  const CACHE = getCache();
  if (Object.keys(CACHE).length !== items.length) {
    const displayItems = Object.values(CACHE).map(iter => ({
      id: iter.id,
      name: iter.name,
      imgUrl: `${__dirname}/gameart.jpg`,
      external: isExternal(context, iter.id),
      official: iter.isOfficial,
    }));
    return Promise.resolve(displayItems);
  } else {
    let ordered = [];
    if (updateType !== 'drag-n-drop') {
      const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
      ordered = items.filter(item => loadOrder[item.id] !== undefined)
                          .sort((lhs, rhs) => loadOrder[lhs.id].pos - loadOrder[rhs.id].pos);
      const unOrdered = items.filter(item => loadOrder[item.id] === undefined);
      ordered = [].concat(ordered, unOrdered);
    } else {
      ordered = items;
    }
    return Promise.resolve(ordered);
  }
}

function infoComponent(context, props) {
  const t = context.api.translate;
  return React.createElement(BS.Panel, { id: 'loadorderinfo' },
    React.createElement('h2', {}, t('Managing your load order', { ns: I18N_NAMESPACE })),
    React.createElement(FlexLayout.Flex, {},
    React.createElement('div', {},
    React.createElement('p', {}, t('You can adjust the load order for Bannerlord by dragging and dropping mods up or down on this page. '
                                 + 'Please keep in mind that Bannerlord is still in Early Access, which means that there might be significant '
                                 + 'changes to the game as time goes on. Please notify us of any Vortex related issues you encounter with this '
                                 + 'extension so we can fix it. For more information and help see: ', { ns: I18N_NAMESPACE }),
    React.createElement('a', { onClick: () => util.opn('https://wiki.nexusmods.com/index.php/Modding_Bannerlord_with_Vortex') }, t('Modding Bannerlord with Vortex.', { ns: I18N_NAMESPACE }))))),
    React.createElement('div', {},
      React.createElement('p', {}, t('How to use:', { ns: I18N_NAMESPACE })),
      React.createElement('ul', {},
        React.createElement('li', {}, t('Check the box next to the mods you want to be active in the game.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Click Auto Sort in the toolbar. (See below for details).', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Make sure to run the game directly via the Play button in the top left corner '
                                      + '(on the Bannerlord tile). Your Vortex load order may not be loaded if you run the Single Player game through the game launcher.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Optional: Manually drag and drop mods to different positions in the load order (for testing different overrides). Mods further down the list override mods further up.', { ns: I18N_NAMESPACE })))),
    React.createElement('div', {},
      React.createElement('p', {}, t('Please note:', { ns: I18N_NAMESPACE })),
      React.createElement('ul', {},
        React.createElement('li', {}, t('The load order reflected here will only be loaded if you run the game via the play button in '
                                      + 'the top left corner. Do not run the Single Player game through the launcher, as that will ignore '
                                      + 'the Vortex load order and go by what is shown in the launcher instead.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('For Bannerlord, mods sorted further towards the bottom of the list will override mods further up (if they conflict). '
                                      + 'Note: Harmony patches may be the exception to this rule.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Auto Sort uses the SubModule.xml files (the entries under <DependedModules>) to detect '
                                      + 'dependencies to sort by. ', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('If you cannot see your mod in this load order, Vortex may have been unable to find or parse its SubModule.xml file. '
                                      + 'Most - but not all mods - come with or need a SubModule.xml file.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Hit the deploy button whenever you install and enable a new mod.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('The game will not launch unless the game store (Steam, Epic, etc) is started beforehand. If you\'re getting the '
                                      + '"Unable to Initialize Steam API" error, restart Steam.', { ns: I18N_NAMESPACE })))));
}

async function resolveGameVersion(discoveryPath: string) {
  if (process.env.NODE_ENV !== 'development' && semver.satisfies(util.getApplication().version, '<1.4.0')) {
    return Promise.reject(new util.ProcessCanceled('not supported in older Vortex versions'));
  }
  try {
    const data = await getXMLData(path.join(discoveryPath, 'bin', 'Win64_Shipping_Client', 'Version.xml'));
    const exePath = path.join(discoveryPath, BANNERLORD_EXEC);
    const value = data?.Version?.Singleplayer?.[0]?.$?.Value
      .slice(1)
      .split('.')
      .slice(0, 3)
      .join('.');
    return (semver.valid(value)) ? Promise.resolve(value) : getVersion(exePath);
  } catch (err) {
    return Promise.reject(err);
  }
}

let _IS_SORTING = false;
async function sortImpl(context: types.IExtensionContext, bmm: BannerlordModuleManager) {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  if (activeProfile?.id === undefined) {
    // Probably best that we don't report this via notification as a number
    //  of things may have occurred that caused this issue. We log it instead.
    log('error', 'Failed to sort mods', { reason: 'No active profile' });
    _IS_SORTING = false;
    return;
  }

  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});

  let sorted: IModuleInfoExtendedExt[];
  try {
    await refreshCache(context, bmm);
    sorted = tSort({ loadOrder, bmm });
  } catch (err) {
    context.api.showErrorNotification('Failed to sort mods', err);
    return;
  }

  const newOrder: ILoadOrder = sorted.reduce((accum: ILoadOrder,
                                              mod: IModuleInfoExtendedExt,
                                              idx: number) => {
    if (mod === undefined) {
      return accum;
    }
    accum[mod.vortexId || mod.id] = {
      pos: idx,
      enabled: loadOrder[mod.vortexId || mod.id]?.enabled || true,
      external: isExternal(context, mod.id),
      data: mod,
    };
    return accum;
  }, {});

  context.api.store.dispatch(actions.setLoadOrder(activeProfile.id, newOrder as any));
  return refreshGameParams(context, newOrder)
    .then(() => context.api.sendNotification({
      id: 'mnb2-sort-finished',
      type: 'info',
      message: context.api.translate('Finished sorting', { ns: I18N_NAMESPACE }),
      displayMS: 3000,
    })).finally(() => _IS_SORTING = false);
}

function main(context) {
  context.registerReducer(['settings', 'mountandblade2'], reducer);
  let bmm: BannerlordModuleManager;
  (context.registerSettings as any)('Interface', Settings, () => ({
    t: context.api.translate,
    onSetSortOnDeploy: (profileId: string, sort: boolean) =>
      context.api.store.dispatch(setSortOnDeploy(profileId, sort)),
  }), () => {
    const state = context.api.getState();
    const profile = selectors.activeProfile(state);
    return profile !== undefined && profile?.gameId === GAME_ID;
  }, 51);

  context.registerGame({
    id: GAME_ID,
    name: 'Mount & Blade II:\tBannerlord',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    getGameVersion: resolveGameVersion,
    logo: 'gameart.jpg',
    executable: () => BANNERLORD_EXEC,
    setup: (discovery) => prepareForModding(context, discovery, bmm),
    requiredFiles: [
      BANNERLORD_EXEC,
    ],
    parameters: [],
    requiresCleanup: true,
    environment: {
      SteamAPPId: STEAMAPP_ID.toString(),
    },
    details: {
      steamAppId: STEAMAPP_ID,
      epicAppId: EPICAPP_ID,
      customOpenModsPath: MODULES,
    },
  });

  context.optional.registerCollectionFeature(
    'mountandblade2_collection_data',
    (gameId: string, includedMods: string[]) =>
      genCollectionsData(context, gameId, includedMods),
    (gameId: string, collection: ICollectionsData) =>
      parseCollectionsData(context, gameId, collection),
    () => Promise.resolve(),
    (t) => t('Mount and Blade 2 Data'),
    (state: types.IState, gameId: string) => gameId === GAME_ID,
    CollectionsDataView,
  );

  // Register the LO page.
  context.registerLoadOrderPage({
    gameId: GAME_ID,
    createInfoPanel: (props) => {
      refreshFunc = props.refresh;
      return infoComponent(context, props);
    },
    noCollectionGeneration: true,
    gameArtURL: `${__dirname}/gameart.jpg`,
    preSort: (items, direction, updateType) =>
      preSort(context, items, direction, updateType, bmm),
    callback: (loadOrder) => refreshGameParams(context, loadOrder),
    itemRenderer: (props) => React.createElement(CustomItemRenderer.default, {
      ...props,
      moduleManager: bmm,
    }),
  });

  context.registerInstaller('bannerlordrootmod', 20, testRootMod, installRootMod);

  // Installs one or more submodules.
  context.registerInstaller('bannerlordsubmodules', 25, testForSubmodules, installSubModules);

  // A very simple migration that intends to add the subModIds attribute
  //  to mods that act as "mod packs". This migration is non-invasive and will
  //  not report any errors. Side effects of the migration not working correctly
  //  will not affect the user's existing environment.
  context.registerMigration(old => migrate026(context.api, old));
  context.registerMigration(old => migrate045(context.api, old));

  context.registerAction('generic-load-order-icons', 200,
    _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', () => {
      sortImpl(context, bmm);
  }, () => {
    const state = context.api.store.getState();
    const gameId = selectors.activeGameId(state);
    return (gameId === GAME_ID);
  });

  context.once(async () => {
    bmm = await BannerlordModuleManager.createAsync();
    context.api.onAsync('did-deploy', async (profileId, deployment) =>
      refreshCacheOnEvent(context, profileId, bmm));

    context.api.onAsync('did-purge', async (profileId) =>
      refreshCacheOnEvent(context, profileId, bmm));

    context.api.events.on('gamemode-activated', (gameMode) => {
      const state = context.api.getState();
      const prof = selectors.activeProfile(state);
      refreshCacheOnEvent(context, prof?.id, bmm);
    });

    context.api.onAsync('added-files', async (profileId, files) => {
      const state = context.api.store.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile.gameId !== GAME_ID) {
        // don't care about any other games
        return;
      }
      const game = util.getGame(GAME_ID);
      const discovery = selectors.discoveryByGame(state, GAME_ID);
      const modPaths = game.getModPaths(discovery.path);
      const installPath = selectors.installPathForGame(state, GAME_ID);

      await Bluebird.map(files, async (entry: { filePath: string, candidates: string[] }) => {
        // only act if we definitively know which mod owns the file
        if (entry.candidates.length === 1) {
          const mod = util.getSafe(state.persistent.mods,
            [GAME_ID, entry.candidates[0]], undefined);
          if (mod === undefined) {
            return Promise.resolve();
          }
          const relPath = path.relative(modPaths[mod.type ?? ''], entry.filePath);
          const targetPath = path.join(installPath, mod.id, relPath);
          // copy the new file back into the corresponding mod, then delete it.
          //  That way, vortex will create a link to it with the correct
          //  deployment method and not ask the user any questions
          await fs.ensureDirAsync(path.dirname(targetPath));

          // Remove the target destination file if it exists.
          //  this is to completely avoid a scenario where we may attempt to
          //  copy the same file onto itself.
          return fs.removeAsync(targetPath)
            .catch(err => (err.code === 'ENOENT')
              ? Promise.resolve()
              : Promise.reject(err))
            .then(() => fs.copyAsync(entry.filePath, targetPath))
            .then(() => fs.removeAsync(entry.filePath))
            .catch(err => log('error', 'failed to import added file to mod', err.message));
        }
      });
    });
  });

  return true;
}

module.exports = {
  default: main,
};
