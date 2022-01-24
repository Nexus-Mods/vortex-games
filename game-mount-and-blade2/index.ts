import { Promise as Bluebird } from 'bluebird';

import * as React from 'react';
import * as BS from 'react-bootstrap';

import getVersion from 'exe-version';

import path from 'path';
import semver from 'semver';
import { actions, FlexLayout, fs, log, selectors, types, util } from 'vortex-api';
import { getElementValue, getXMLData, refreshGameParams, walkAsync } from './util';

import { BANNERLORD_EXEC, GAME_ID, LOCKED_MODULES, MODULES, OFFICIAL_MODULES, SUBMOD_FILE } from './common';
import CustomItemRenderer from './customItemRenderer';
import { migrate026 } from './migrations';

import ComMetadataManager from './ComMetadataManager';
import { getCache, getLauncherData, isInvalid, parseLauncherData, refreshCache } from './subModCache';
import { ISortProps, ISubModCache } from './types';
import { genCollectionsData, parseCollectionsData } from './collections/collections';
import CollectionsDataView from './views/CollectionsDataView';
import { ICollectionsData } from './collections/types';

const LAUNCHER_EXEC = path.join('bin', 'Win64_Shipping_Client', 'TaleWorlds.MountAndBlade.Launcher.exe');
const MODDING_KIT_EXEC = path.join('bin', 'Win64_Shipping_wEditor', 'TaleWorlds.MountAndBlade.Launcher.exe');

let STORE_ID;

const GOG_IDS = ['1802539526', '1564781494'];
const STEAMAPP_ID = 261550;
const EPICAPP_ID = 'Chickadee';

const I18N_NAMESPACE = 'game-mount-and-blade2';

// A set of folder names (lowercased) which are available alongside the
//  game's modules folder. We could've used the fomod installer stop patterns
//  functionality for this, but it's better if this extension is self contained;
//  especially given that the game's modding pattern changes quite often.
const ROOT_FOLDERS = new Set(['bin', 'data', 'gui', 'icons', 'modules',
  'music', 'shaders', 'sounds', 'xmlschemas']);

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
  const filtered = files.filter(file => {
    const segments = file.split(path.sep).map(seg => seg.toLowerCase());
    const lastElementIdx = segments.length - 1;

    // Ignore directories and ensure that the file contains a known root folder at
    //  the expected index.
    return (ROOT_FOLDERS.has(segments[idx])
      && (path.extname(segments[lastElementIdx]) !== ''));
  });

  const instructions = filtered.map(file => {
    const destination = file.split(path.sep)
                            .slice(idx)
                            .join(path.sep);
    return {
      type: 'copy',
      source: file,
      destination,
    };
  });

  return Promise.resolve({ instructions });
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

async function prepareForModding(context, discovery, metaManager: ComMetadataManager) {
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
  return startSteam().then(() => parseLauncherData()).then(async () => {
    try {
      await refreshCache(context);
    } catch (err) {
      return Promise.reject(err);
    }

    // We're going to do a quick tSort at this point - not going to
    //  change the user's load order, but this will highlight any
    //  cyclic or missing dependencies.
    const CACHE = getCache();
    const modIds = Object.keys(CACHE);
    const sorted = tSort({ subModIds: modIds, allowLocked: true, metaManager });
  })
  .catch(err => {
    if (err instanceof util.NotFound) {
      context.api.showErrorNotification('Failed to find game launcher data',
        'Please run the game at least once through the official game launcher and '
      + 'try again', { allowReport: false });
      return Promise.resolve();
    } else if (err instanceof util.ProcessCanceled) {
      context.api.showErrorNotification('Failed to find game launcher data',
        err, { allowReport: false });
    }

    return Promise.reject(err);
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

function tSort(sortProps: ISortProps, test: boolean = false) {
  const { subModIds, allowLocked, loadOrder, metaManager } = sortProps;
  const CACHE = getCache();
  // Topological sort - we need to:
  //  - Identify cyclic dependencies.
  //  - Identify missing dependencies.
  //  - We will try to identify incompatible dependencies (version-wise)

  // These are manually locked mod entries.
  const lockedSubMods = (!!loadOrder)
    ? subModIds.filter(subModId => {
      const entry = CACHE[subModId];
      return (!!entry)
        ? !!loadOrder[entry.vortexId]?.locked
        : false;
    })
    : [];
  const alphabetical = subModIds.filter(subMod => !lockedSubMods.includes(subMod))
                                .sort();
  const graph = alphabetical.reduce((accum, entry) => {
    const depIds = [...CACHE[entry].dependencies].map(dep => dep.depId);
    // Create the node graph.
    accum[entry] = depIds.sort();
    return accum;
  }, {});

  // Will store the final LO result
  const result = [];

  // The nodes we have visited/processed.
  const visited = [];

  // The nodes which are still processing.
  const processing = [];

  const topSort = (node) => {
    processing[node] = true;
    const dependencies = (!!allowLocked)
      ? graph[node]
      : graph[node].filter(element => !LOCKED_MODULES.has(element));

    for (const dep of dependencies) {
      if (processing[dep]) {
        // Cyclic dependency detected - highlight both mods as invalid
        //  within the cache itself - we also need to highlight which mods.
        CACHE[node].invalid.cyclic.push(dep);
        CACHE[dep].invalid.cyclic.push(node);

        visited[node] = true;
        processing[node] = false;
        continue;
      }

      const incompatibleDeps = CACHE[node].invalid.incompatibleDeps;
      const incDep = incompatibleDeps.find(d => d.depId === dep);
      if (Object.keys(graph).includes(dep) && (incDep === undefined)) {
        const depVer = CACHE[dep].subModVer;
        const depInst = CACHE[node].dependencies.find(d => d.depId === dep);
        try {
          const match = semver.satisfies(depInst.depVersion, depVer);
          if (!match && !!depInst?.depVersion && !!depVer) {
            CACHE[node].invalid.incompatibleDeps.push({
              depId: dep,
              requiredVersion: depInst.depVersion,
              currentVersion: depVer,
            });
          }
        } catch (err) {
          // Ok so we didn't manage to compare the versions, we log this and
          //  continue.
          log('debug', 'failed to compare versions', err);
        }
      }

      if (!visited[dep] && !lockedSubMods.includes(dep)) {
        if (!Object.keys(graph).includes(dep)) {
          CACHE[node].invalid.missing.push(dep);
        } else {
          topSort(dep);
        }
      }
    }

    processing[node] = false;
    visited[node] = true;

    if (!isInvalid(node)) {
      result.push(node);
    }
  };

  for (const node in graph) {
    if (!visited[node] && !processing[node]) {
      topSort(node);
    }
  }

  if (allowLocked) {
    return result;
  }

  // Proper topological sort dictates we simply return the
  //  result at this point. But, mod authors want modules
  //  with no dependencies to bubble up to the top of the LO.
  //  (This will only apply to non locked entries)
  const subModsWithNoDeps = result.filter(dep => (graph[dep].length === 0)
    || (graph[dep].find(d => !LOCKED_MODULES.has(d)) === undefined)).sort() || [];
  const tamperedResult = [].concat(subModsWithNoDeps,
    result.filter(entry => !subModsWithNoDeps.includes(entry)));
  lockedSubMods.forEach(subModId => {
    const pos = loadOrder[CACHE[subModId].vortexId].pos;
    tamperedResult.splice(pos, 0, [subModId]);
  });

  if (test === true) {
    const metaSorted = metaManager.sort(tamperedResult);
    return metaSorted;
  } else {
    return tamperedResult;
  }
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
                                   metaManager: ComMetadataManager) {
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

  await metaManager.updateDependencyMap(profileId);

  try {
    await refreshCache(context);
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

  // We're going to do a quick tSort at this point - not going to
  //  change the user's load order, but this will highlight any
  //  cyclic or missing dependencies.
  const CACHE = getCache();
  const modIds = Object.keys(CACHE);
  const sortProps: ISortProps = {
    subModIds: modIds,
    allowLocked: true,
    loadOrder,
    metaManager,
  };
  const sorted = tSort(sortProps);

  if (refreshFunc !== undefined) {
    refreshFunc();
  }

  return refreshGameParams(context, loadOrder);
}

async function preSort(context, items, direction, updateType, metaManager) {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  const CACHE = getCache();
  if (activeProfile?.id === undefined || activeProfile?.gameId !== GAME_ID) {
    // Race condition ?
    return items;
  }

  let modIds = Object.keys(CACHE);
  if (items.length > 0 && modIds.length === 0) {
    // Cache hasn't been populated yet.
    try {
      // Refresh the cache.
      await refreshCacheOnEvent(context, activeProfile.id, metaManager);
      modIds = Object.keys(CACHE);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // Locked ids are always at the top of the list as all
  //  other modules depend on these.
  let lockedIds = modIds.filter(id => CACHE[id].isLocked);

  try {
    // Sort the locked ids amongst themselves to ensure
    //  that the game receives these in the right order.
    const sortProps: ISortProps = {
      subModIds: lockedIds,
      allowLocked: true,
      metaManager,
    };
    lockedIds = tSort(sortProps);
  } catch (err) {
    return Promise.reject(err);
  }

  // Create the locked entries.
  const lockedItems = lockedIds.map(id => ({
    id: CACHE[id].vortexId,
    name: CACHE[id].subModName,
    imgUrl: `${__dirname}/gameart.jpg`,
    locked: true,
    official: OFFICIAL_MODULES.has(id),
  }));

  const LAUNCHER_DATA = getLauncherData();

  // External ids will include official modules as well but not locked entries.
  const externalIds = modIds.filter(id => (!CACHE[id].isLocked) && (CACHE[id].vortexId === id));
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
  const LOkeys = ((Object.keys(loadOrder).length > 0)
    ? Object.keys(loadOrder)
    : LAUNCHER_DATA.singlePlayerSubMods.map(mod => mod.subModId));

  // External modules that are already in the load order.
  const knownExt = externalIds.filter(id => LOkeys.includes(id)) || [];

  // External modules which are new and have yet to be added to the LO.
  const unknownExt = externalIds.filter(id => !LOkeys.includes(id)) || [];

  items = items.filter(item => {
    // Remove any lockedIds, but also ensure that the
    //  entry can be found in the cache. If it's not in the
    //  cache, this may mean that the submod xml file failed
    //  parse-ing and therefore should not be displayed.
    const isLocked = lockedIds.includes(item.id);
    const hasCacheEntry = Object.keys(CACHE).find(key =>
      CACHE[key].vortexId === item.id) !== undefined;
    return !isLocked && hasCacheEntry;
  });

  const posMap = {};
  let nextAvailable = LOkeys.length;
  const getNextPos = (loId) => {
    if (LOCKED_MODULES.has(loId)) {
      return Array.from(LOCKED_MODULES).indexOf(loId);
    }

    if (posMap[loId] === undefined) {
      posMap[loId] = nextAvailable;
      return nextAvailable++;
    } else {
      return posMap[loId];
    }
  };

  knownExt.map(key => ({
    id: CACHE[key].vortexId,
    name: CACHE[key].subModName,
    imgUrl: `${__dirname}/gameart.jpg`,
    external: isExternal(context, CACHE[key].vortexId),
    official: OFFICIAL_MODULES.has(key),
  }))
    // tslint:disable-next-line: max-line-length
    .sort((a, b) => (loadOrder[a.id]?.pos || getNextPos(a.id)) - (loadOrder[b.id]?.pos || getNextPos(b.id)))
    .forEach(known => {
      // If this a known external module and is NOT in the item list already
      //  we need to re-insert in the correct index as all known external modules
      //  at this point are actually deployed inside the mods folder and should
      //  be in the items list!
      const diff = (LOkeys.length) - (LOkeys.length - Array.from(LOCKED_MODULES).length);
      if (items.find(item => item.id === known.id) === undefined) {
        const pos = loadOrder[known.id]?.pos;
        const idx = (pos !== undefined) ? (pos - diff) : (getNextPos(known.id) - diff);
        items.splice(idx, 0, known);
      }
    });

  const unknownItems = [].concat(unknownExt)
    .map(key => ({
      id: CACHE[key].vortexId,
      name: CACHE[key].subModName,
      imgUrl: `${__dirname}/gameart.jpg`,
      external: isExternal(context, CACHE[key].vortexId),
      official: OFFICIAL_MODULES.has(key),
    }));

  const preSorted = [].concat(lockedItems, items, unknownItems);
  return (direction === 'descending')
    ? Promise.resolve(preSorted.reverse())
    : Promise.resolve(preSorted);
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
                                      + '"Unable to Initialize Steam API" error, restart Steam.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Right clicking an entry will open the context menu which can be used to lock LO entries into position; entry will '
                                      + 'be ignored by auto-sort maintaining its locked position.', { ns: I18N_NAMESPACE })))));
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
function main(context) {
  const metaManager = new ComMetadataManager(context.api);
  context.registerGame({
    id: GAME_ID,
    name: 'Mount & Blade II:\tBannerlord',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    getGameVersion: resolveGameVersion,
    logo: 'gameart.jpg',
    executable: () => BANNERLORD_EXEC,
    setup: (discovery) => prepareForModding(context, discovery, metaManager),
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
      preSort(context, items, direction, updateType, metaManager),
    callback: (loadOrder) => refreshGameParams(context, loadOrder),
    itemRenderer: CustomItemRenderer.default,
  });

  context.registerInstaller('bannerlordrootmod', 20, testRootMod, installRootMod);

  // Installs one or more submodules.
  context.registerInstaller('bannerlordsubmodules', 25, testForSubmodules, installSubModules);

  // A very simple migration that intends to add the subModIds attribute
  //  to mods that act as "mod packs". This migration is non-invasive and will
  //  not report any errors. Side effects of the migration not working correctly
  //  will not affect the user's existing environment.
  context.registerMigration(old => migrate026(context.api, old));

  context.registerAction('generic-load-order-icons', 200,
    _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', async () => {
      if (_IS_SORTING) {
        // Already sorting - don't do anything.
        return Promise.resolve();
      }

      _IS_SORTING = true;

      try {
        await metaManager.updateDependencyMap();
        await refreshCache(context);
      } catch (err) {
        context.api.showErrorNotification('Failed to resolve submodule file data', err);
        _IS_SORTING = false;
        return;
      }

      const CACHE = getCache();
      const modIds = Object.keys(CACHE);
      const lockedIds = modIds.filter(id => CACHE[id].isLocked);
      const subModIds = modIds.filter(id => !CACHE[id].isLocked);

      let sortedLocked = [];
      let sortedSubMods = [];

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

      try {
        sortedLocked = tSort({ subModIds: lockedIds, allowLocked: true, metaManager });
        sortedSubMods = tSort({ subModIds, allowLocked: false, loadOrder, metaManager }, true);
      } catch (err) {
        context.api.showErrorNotification('Failed to sort mods', err);
        return;
      }

      const newOrder = [].concat(sortedLocked, sortedSubMods).reduce((accum, id, idx) => {
        const vortexId = CACHE[id].vortexId;
        const newEntry = {
          pos: idx,
          enabled: CACHE[id].isOfficial
            ? true
            : (!!loadOrder[vortexId])
              ? loadOrder[vortexId].enabled
              : true,
          locked: (loadOrder[vortexId]?.locked === true),
        };

        accum[vortexId] = newEntry;
        return accum;
      }, {});

      context.api.store.dispatch(actions.setLoadOrder(activeProfile.id, newOrder));
      return refreshGameParams(context, newOrder)
        .then(() => context.api.sendNotification({
          id: 'mnb2-sort-finished',
          type: 'info',
          message: context.api.translate('Finished sorting', { ns: I18N_NAMESPACE }),
          displayMS: 3000,
        })).finally(() => _IS_SORTING = false);
  }, () => {
    const state = context.api.store.getState();
    const gameId = selectors.activeGameId(state);
    return (gameId === GAME_ID);
  });

  context.once(() => {
    context.api.onAsync('did-deploy', async (profileId, deployment) =>
      refreshCacheOnEvent(context, profileId, metaManager));

    context.api.onAsync('did-purge', async (profileId) =>
      refreshCacheOnEvent(context, profileId, metaManager));

    context.api.events.on('gamemode-activated', (gameMode) => {
      const state = context.api.getState();
      const prof = selectors.activeProfile(state);
      refreshCacheOnEvent(context, prof?.id, metaManager);
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
