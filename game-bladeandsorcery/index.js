const Promise = require('bluebird');
const path = require('path');
const { actions, fs, FlexLayout, log, selectors, util } = require('vortex-api');
const semver = require('semver');

const { app, remote } = require('electron');
const uniApp = app || remote.app;

const { GAME_ID, I18N_NAMESPACE, MOD_MANIFEST } = require('./common');
const { testModInstaller, installMulleMod, installOfficialMod } = require('./installers');

const { migrate010, migrate020 } = require('./migrations');

const { isOfficialModType, streamingAssetsPath, getModName,
        getGameVersion, getMinModVersion, getDiscoveryPath } = require('./util');

const React = require('react');
const BS = require('react-bootstrap');

// MulleDK19 B&S mods are expected to have this json file at its root directory.
const MULLE_MOD_INFO = 'mod.json';

// As discussed with KospY, we're going to use a load order file
//  to organize the order in which the game loads its mods.
//  the file will be located inside StreamingAssets/Mods.
const LOAD_ORDER_FILENAME = 'loadorder.json';

//GAME IS ALSO FOUND IN THE OCULUS STORE!!
function findGame() {
  return util.steam.findByAppId('629730')
      .then(game => game.gamePath);
}

function createModDirectories(discovery) {
  const createDir = (filePath) => fs.ensureDirWritableAsync(filePath);
  const streamingPath = path.join(discovery.path, streamingAssetsPath());
  return Promise.all([
    createDir(streamingPath),
    createDir(streamingPath, 'Mods'),
    createDir(streamingPath, 'Default'),
  ]);
}

async function purgeMods(discovery, api) {
  const baseModsPath = path.join(discovery.path, streamingAssetsPath());
  await api.emitAndAwait('purge-mods-in-path',
    GAME_ID, 'bas-official-modtype', path.join(baseModsPath, 'Mods'));

  return await api.emitAndAwait('purge-mods-in-path',
    GAME_ID, 'bas-legacy-modtype', baseModsPath);
}

async function ensureModType(discovery, api) {
  // Aims to ensure that the user's mods are all assigned
  //  the correct modType for their game version.
  //  (We're doing this as users may jump between 8.4 and older versions)
  const targetModType = await getOfficialModType(api);
  const state = api.store.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});

  // Not really invalid - just wrong modType for the currently installed game version.
  const invalidMods = Object.keys(mods).filter(key => isOfficialModType(mods[key]?.type)
                                                  && mods[key].type !== targetModType);
  return (invalidMods.length > 0)
    ? purgeMods(discovery, api).then(() => {
        invalidMods.forEach(key => api.store.dispatch(actions.setModType(GAME_ID, key, targetModType)));
        api.store.dispatch(actions.setDeploymentNecessary(GAME_ID, true));
        return Promise.resolve();
      })
    : Promise.resolve();
}

async function prepareForModding(discovery, api) {
  try {
    await createModDirectories(discovery);
    await ensureLOFile(discovery.path);
    await ensureModType(discovery, api);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function getOfficialModType(api) {
  const discoveryPath = getDiscoveryPath(api);
  let gameVersion;
  try {
    gameVersion = await getGameVersion(discoveryPath);
  } catch (err) {
    // Failed to ascertain the game's version
    return Promise.reject(err);
  }
  const modType = semver.gte(semver.coerce(gameVersion), semver.coerce('8.4'))
    ? 'bas-official-modtype' : 'bas-legacy-modtype';
  return Promise.resolve(modType);
}

async function getDeployedManaged(context, modType) {
  // returns array of the mod names as defined in each mod's
  //  manifest (this is obviously only deployed mods)
  const state = context.api.getState();
  const deployPath = selectors.modPathsForGame(state, GAME_ID)[modType];
  const deploymentManifest = await util.getManifest(context.api, modType, GAME_ID);
  const gameManifestFiles = deploymentManifest.files.filter(entry =>
    path.basename(entry.relPath).toLowerCase() === MOD_MANIFEST);
  return Promise.reduce(gameManifestFiles, async (accum, manifest) => {
    try {
      const modName = await getModName(path.join(deployPath, manifest.relPath), 'Name');
      accum.push({ modName, modId: manifest.source });
    } catch (err) {
      // The only way this can occur is if the user had manipulated the file
      //  in staging if using symlinks or he had moved/removed the file in
      //  the mod's folder completely.
      log('error', 'manifest is missing', err);
    }
    return accum;
  }, []);
    
}

async function getDeployedExternal(context, managedNames, loKeys) {
  const state = context.api.store.getState();
  const modType = await getOfficialModType(context.api);

  const invalidNames = [].concat(['default', 'aa', 'steamvr'], managedNames);
  const modsPath = selectors.modPathsForGame(state, GAME_ID)[modType];
  const modNames = {
    known: [],
    unknown: [],
  };
  await util.walk(modsPath, async (iter, stats) => {
    const modName = path.basename(iter);
    if (stats.isDirectory() && !invalidNames.includes(modName)) {
        const hasManifest = await fs.statAsync(path.join(iter, MOD_MANIFEST))
          .then(() => Promise.resolve(true))
          .catch(err => Promise.resolve(false));
        if (hasManifest) {
          if (loKeys.includes(modName)) {
            modNames.known.push(modName);
          } else {
            modNames.unknown.push(modName);
          }
        }
      }
  })

  return Promise.resolve(modNames);
}

async function ensureLOFile(discoveryPath) {
  // It really doesn't matter what modType we're using, the loadorder
  //  file can only be loaded by 8.4 and above which will always expect it to
  //  be located inside the "new" Mods folder.
  const loFilePath = path.join(discoveryPath, streamingAssetsPath(), 'Mods', LOAD_ORDER_FILENAME);
  return fs.statAsync(loFilePath)
    .then(() => Promise.resolve(loFilePath))
    .catch(err => fs.writeFileAsync(loFilePath, '', { encoding: 'utf8' })
      .then(() => Promise.resolve(loFilePath)));
}

async function readLOFromFile(api) {
  const discoveryPath = getDiscoveryPath(api);
  const loFilePath = await ensureLOFile(discoveryPath);
  const data = await fs.readFileAsync(loFilePath, { encoding: 'utf8' });
  try {
    const lo = JSON.parse(data).modNames;
    const formatted = lo.reduce((accum, iter) => {
      accum.push({
        name: iter,
      })
      return accum;
    }, []);
    return Promise.resolve(formatted);
  } catch (err) {
    log('error', 'failed to parse BaS load order file', err);
    return Promise.reject(new util.DataInvalid('Invalid load order file'));
  }
}

async function writeLOToFile(api, loadOrder) {
  const discoveryPath = getDiscoveryPath(api);
  const loFilePath = await ensureLOFile(discoveryPath);
  const loKeys = Object.keys(loadOrder).sort((a, b) => loadOrder[a].pos - loadOrder[b].pos);
  const modNames = loKeys.reduce((accum, iter) => {
    const loName = loadOrder[iter].data.name;
    accum.push(loName);
    return accum;
  }, []);
  const loData = {
    modNames,
  }
  return fs.writeFileAsync(loFilePath, JSON.stringify(loData, undefined, 2), { encoding: 'utf8' });
}

async function preSort(context, items, direction, refreshType) {
  const state = context.api.store.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const activeProfile = selectors.activeProfile(state);
  const toLOPage = (itemList) => Promise.resolve(itemList);

  if (activeProfile === undefined) {
    return toLOPage(items);
  }

  let targetModType;
  try {
    targetModType = await getOfficialModType(context.api);
  } catch (err) {
    // The game.json file must be missing...
    log('error', 'failed to ascertain current official modType', err);
    return Promise.resolve(items);
  }

  const toDisplayItem = (modName, modId) => ({
    id: (modId !== undefined) ? modId : modName,
    external: (modId !== undefined) ? false : true,
    name: modName,
    imgUrl: `${__dirname}/gameart.jpg`,
    data: {
      name: modName,
    }
  });

  const managedMods = await getDeployedManaged(context, targetModType);
  const managedItems = managedMods.map(item => toDisplayItem(item.modName, item.modId))
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
  const loKeys = Object.keys(loadOrder).sort((a, b) => loadOrder[a].pos - loadOrder[b].pos);
  const external = await getDeployedExternal(context, managedMods.map(mod => mod.modName), loKeys);
  const allExternal = [].concat(external.known, external.unknown);
  const externalItems = allExternal.map(item => toDisplayItem(item));
  if (refreshType === 'refresh') {
    // This is the result of the refreshing; in which case we don't care for
    //  the order we set in the state - we're going to read in
    //  the load order file and organize the display items so that they
    //  reflect the order defined by the file.
    try {
      const lo = await readLOFromFile(context.api);
      const preSorted = [].concat(managedItems, externalItems)
        .sort((a, b) => {
          const aIdx = lo.findIndex(item => item.name === a.name);
          const bIdx = lo.findIndex(item => item.name === b.name);
          return aIdx - bIdx;
        });
      return toLOPage(preSorted);
    } catch (err) {
      context.api.showErrorNotification('Failed to read load order', err, {
        allowReport: false,
        message: 'Please make sure that your load order file exists and is valid',
      });
      return toLOPage(items);
    }
  } else if (refreshType === 'drag-n-drop') {
    const getIdx = (id) => {
      const idx = items.findIndex(item => item.id === id);
      return idx !== undefined 
        ? idx : loKeys.indexOf(id);
    };

    items = [].concat(items, externalItems)
      .sort((a, b) => getIdx(a.id) - getIdx(b.id));
    return toLOPage(items);
  } else {
    const preSorted = [].concat(managedItems, externalItems)
      .sort((a, b) => loKeys.indexOf(a.id) - loKeys.indexOf(b.id));
    return toLOPage(preSorted);
  }
}

function infoComponent(context, props) {
  const t = context.api.translate;
  return React.createElement(BS.Panel, { id: 'loadorderinfo' },
    React.createElement('h2', {}, t('Managing your load order', { ns: I18N_NAMESPACE })),
    React.createElement(FlexLayout.Fixed, { style: { height: '30%' } },
    React.createElement('div', {},
    React.createElement('p', {}, t('You can adjust the load order for Blade and Sorcery by dragging and dropping '
    + 'mods up or down on this page.', { ns: I18N_NAMESPACE })))),
    React.createElement('div', { style: { height: '70%' } },
      React.createElement('p', {}, t('Please note:', { ns: I18N_NAMESPACE })),
      React.createElement('ul', {},
        React.createElement('li', {}, t('The mods displayed in this page are valid mods, confirmed to be deployed inside the '
          + 'game\'s mods folder. If a mod is missing, try deploying your mods - if it\'s still missing - it\'s not a valid mod!', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('If you cannot see your manually added mod in this load order - click refresh and Vortex '
          + 'should be able to pick it up as long as it has a valid manifest.json file.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('The load order file will only be picked up by the game in version 8.4 Beta 5 and above', { ns: I18N_NAMESPACE })))));
}

function resolveGameVersion(discoveryPath) {
  if (semver.satisfies(uniApp.getVersion(), '<1.4.0')) {
    return Promise.reject(new util.ProcessCanceled('not supported in older Vortex versions'));
  }
  return getMinModVersion(discoveryPath)
    .then(minVer => {
      const coerced = semver.coerce(minVer.version);
      return Promise.resolve(coerced.version);
    })
}

function main(context) {
  const getLegacyDestination = () => {
    return path.join(getDiscoveryPath(context.api), streamingAssetsPath());
  }

  const getOfficialDestination = () => {
    return path.join(getDiscoveryPath(context.api), streamingAssetsPath(), 'Mods');
  }

  context.registerGame({
    id: GAME_ID,
    name: 'Blade & Sorcery',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => path.join(streamingAssetsPath(), 'Mods'),
    getGameVersion: resolveGameVersion,
    logo: 'gameart.jpg',
    executable: () => 'BladeAndSorcery.exe',
    requiredFiles: ['BladeAndSorcery.exe'],
    requiresCleanup: true,
    setup: (discovery) => prepareForModding(discovery, context.api),
    environment: {
      SteamAPPId: '629730',
    },
    details: {
      steamAppId: 629730,
    },
  });

  context.registerMigration(old => migrate010(context.api, old));
  context.registerMigration(old => migrate020(context.api, old));

  // Only reason why we're still keeping this installer is to block users from
  //  installing outdated mods.
  context.registerInstaller('bas-mulledk19-mod', 25,
    (files, gameId) => testModInstaller(files, gameId, MULLE_MOD_INFO),
    (files, destinationPath, gameId, progressDelegate) => installMulleMod(files, destinationPath, gameId, progressDelegate, context.api));

  context.registerInstaller('bas-official-mod', 25,
    (files, gameId) =>
      testModInstaller(files, gameId, MOD_MANIFEST),
    (files, destinationPath, gameId, progressDelegate) =>
      installOfficialMod(files, destinationPath, gameId, progressDelegate, context.api));

  context.registerModType('bas-official-modtype', 15, (gameId) => (gameId === GAME_ID),
    getOfficialDestination, () => Promise.resolve(false), { name: 'Official Mod (v8.4+)' });

  context.registerModType('bas-legacy-modtype', 15, (gameId) => (gameId === GAME_ID),
    getLegacyDestination, () => Promise.resolve(false), { name: 'Legacy Mod (v8.3 and below)' });

  let refreshFunc;
  context.registerLoadOrderPage({
    gameId: GAME_ID,
    createInfoPanel: (props) => {
      refreshFunc = props.refresh;
      return infoComponent(context, props);
    },
    filter: (mods) => mods.filter(mod => isOfficialModType(mod.type) && (mod?.attributes?.hasMultipleMods === false)),
    gameArtURL: `${__dirname}/gameart.jpg`,
    preSort: (items, direction, refreshType) => preSort(context, items, direction, refreshType),
    displayCheckboxes: false,
    callback: (loadOrder) => writeLOToFile(context.api, loadOrder),
  });

  context.registerAction('generic-load-order-icons', 200, 'open-ext', {}, 'View Load Order File', async () => {
    const discoveryPath = getDiscoveryPath(context.api);
    util.opn(path.join(discoveryPath, streamingAssetsPath(), 'Mods')).catch(err => null);
  }, () => {
    const state = context.api.getState();
    const activeGameId = selectors.activeGameId(state);
    return (activeGameId === GAME_ID);
  });

  const refreshOnDeployEvent = (profileId) => {
    const state = context.api.getState();
    const prof = selectors.profileById(state, profileId);
    if (refreshFunc !== undefined && prof?.gameId === GAME_ID) {
      refreshFunc();
    }

    return Promise.resolve();
  };

  context.once(() => {
    context.api.onAsync('will-deploy', async (profileId, deployment) => {
      const state = context.api.store.getState();
      const activeProf = selectors.activeProfile(state);
      const profile = selectors.profileById(state, profileId);
      if ((activeProf !== profile) || (GAME_ID !== profile?.gameId)) {
        return Promise.resolve();
      }
      const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
      const targetModType = await getOfficialModType(context.api);
      // Not really invalid - just wrong modType for the currently installed game version.
      const invalidMods = Object.keys(mods).filter(key => isOfficialModType(mods[key]?.type)
                                                       && mods[key].type !== targetModType);
      return (invalidMods.length > 0)
        ? new Promise((resolve) => {
          context.api.showDialog('error', 'Blade & Sorcery version mismatch', {
            text: 'Vortex has detected a change in the installed version of Blade & Sorcery '
                + 'since the last deployment. Some of your mods may not work correctly. '
                + 'Please restart Vortex to fix this issue.',
          },
          [
            { label: 'Ok', action: () => resolve() },
          ])
        })
        : Promise.resolve();
    });

    context.api.onAsync('did-deploy', refreshOnDeployEvent);
    context.api.onAsync('did-purge', refreshOnDeployEvent);
  });

  return true;
}

module.exports = {
  default: main,
};
