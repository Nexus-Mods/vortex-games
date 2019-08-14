const Promise = require('bluebird');
const path = require('path');
const { actions, fs, selectors, util } = require('vortex-api');

// Expected file name for the qbms script.
const BMS_SCRIPT = path.join(__dirname, 'dmc5_pak_unpack.bms');

// Invalidation qbms script - this script relies on a filtered.list
//  file to be generated.
const INVAL_SCRIPT = path.join(__dirname, 'dmc5_pak_invalidate.bms');

// DMC5 filenames are encrypted. The list file contains
//  the actual filenames mapped against their murmur3 hash.
const FILE_LIST = path.join(__dirname, 'dmc5_pak_names_release.list');

// DMC5 requires us to invalidate/zero-out file entries within
//  the game's pak file; the filtered.list file is generated
//  using the full file list.
const FILTERED_LIST = path.join(__dirname, 'filtered.list');

// Regex pattern used to identify installed DLCs
const DLC_FOLDER_RGX = /^\d+$/gm;

const NATIVES_DIR = 'natives' + path.sep;
const GAME_PAK_FILE = 're_chunk_000.pak';
const DLC_PAK_FILE = 're_dlc_000.pak';
const GAME_ID = 'devilmaycry5';
const STEAM_ID = 601150;

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath);
}

function prepareForModding(discovery, api) {
  const displayInformation = () => api.sendNotification({
    type: 'warn',
    message: 'Important Information regarding DMC 5 Modding',
    noDismiss: true,
    actions: [
      { title: 'More', action: (dismiss) => 
        api.showDialog('info', 'Important Information regarding DMC 5 Modding', {
          bbcode: 'Before you start modding Devil May Cry 5 please note that Vortex will need to '
                + 'modify your game archives directly.<br/><br/>'
                + 'Vortex will be extracting and invalidating files during mod installation or any time '
                + 'you click the "Invalidate Paths" button in the "Mods" section.<br/><br/>'
                + 'For the best modding experience - and to avoid conflicts - please ensure the following:<br/><br/>'
                + '1. Only use Vortex to install mods on a fresh, legitimate, vanilla (i.e. unmodified) copy of the game.<br/>'
                + '2. DO NOT use any other modding tools alongside Vortex to mod the game as that can lead to your game ' 
                + 'archives becoming corrupted - making a reinstallation necessary.<br/>'
                + '3. It is necessary for you to click the "Invalidate Paths" button in the mods section after every time ' 
                + 'the game is updated to ensure that your mods will work correctly.<br/>'
        }, [ { label: 'Close', action: () => dismiss() } ])
      },
    ],
  });

  const state = api.store.getState();
  const installedMods = util.getSafe(state, ['persistent', 'mods', GAME_ID]) || {};
  let downloads = util.getSafe(state, ['persistent', 'downloads', 'files']) || {};
  downloads = Object.keys(downloads).map(key => downloads[key]);
  const hasdmc5downloads = downloads.find(downl => {
    return (!!downl.game)
      ? new Set(downl.game).has(GAME_ID)
      : undefined;
  }) !== undefined;

  if ((Object.keys(installedMods).length == 0) && !hasdmc5downloads) {
    displayInformation();
  }

  return fs.ensureDirWritableAsync(
    path.join(discovery.path, 'natives'), () => Promise.resolve());
}

function testArchive(files, discoveryPath, archivePath, api) {
  const checkLooseFiles = () => 
    // Check whether we can find the files we're trying to extract
    //  inside the game's discoveryPath.
    Promise.each(files, file => fs.statAsync(path.join(discoveryPath, file)))
      .then(() => Promise.resolve(true))
      .catch(err => Promise.resolve(false));

  let errorPromise = Promise.resolve();
  return api.emitAndAwait('quickbms-operation', GAME_ID, BMS_SCRIPT,
    archivePath, discoveryPath, 'list', { wildCards: files }, found => {
      errorPromise = (found.length === files.length)
      ? Promise.resolve()
      : (found.length > 0)
        // If we found any entries, this is clearly the right archive, but 
        //  the file list may be missing entries - we cancel the process
        //  in this case.
        ? Promise.reject(new util.NotFound('Incomplete file list'))
        : checkLooseFiles().then(res => (res)
          ? Promise.resolve() // Found loose files - the files must've been invalidated, that's fine.
          : Promise.reject(new util.DataInvalid('Files not found')))
      return Promise.resolve();
    }).then(() => errorPromise);
}

async function findArchiveFile(files, discoveryPath, api) {
  let archivePath = path.join(discoveryPath, GAME_PAK_FILE);
  // We're going to check the main game file first.
  return new Promise((resolve, reject) => {
    return testArchive(files, discoveryPath, archivePath, api)
      .then(() => resolve(GAME_PAK_FILE))
      .catch(util.DataInvalid, () => fs.readdirAsync(discoveryPath)
        .then(entries => {
          const installedDLC = entries.filter(entry => entry.match(DLC_FOLDER_RGX));
          return Promise.each(installedDLC, dlc => {
            archivePath = path.join(discoveryPath, dlc, DLC_PAK_FILE);
            return testArchive(files, discoveryPath, archivePath, api)
              .then(() => resolve(path.join(dlc, DLC_PAK_FILE)))
              .catch(util.DataInvalid, () => Promise.resolve());
          })
          .then(() => resolve(undefined))
        }))
      .catch(err => reject(err));
  });
}

async function installQBMS(files, destinationPath, gameId, progressDelegate, api) {
  const rootPath = files.find(file => file.endsWith(NATIVES_DIR));
  const idx = rootPath.length - NATIVES_DIR.length;

  // Remove directories and anything that isn't in the rootPath.
  let filtered = files.filter(file =>
    ((file.indexOf(rootPath) !== -1)
      && (!file.endsWith(path.sep))));

  filtered = filtered.map(file => { 
    return {
      source: file, 
      destination: file.substr(idx), 
    };
  });

  const discoveryPath = getDiscoveryPath(api);
  if (!(!!discoveryPath)) {
    // Invalid discovery path. How is the game not discovered at this point?!
    return Promise.reject(new util.NotFound('devilmaycry5 was not discovered'));
  }

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file.source,
      destination: file.destination,
    }
  });

  // Create the wildcards quickBMS is going to use to filter/find
  //  list matches.
  const wildCards = filtered.map(fileEntry =>
    fileEntry.destination.replace(/\\/g, '/'));

  return findArchiveFile(wildCards, discoveryPath, api)
    .then(archivefile => {
      if (archivefile === undefined) {
        return Promise.reject(new util.NotFound('Failed to match mod files to game archives'));
      }
      const quickbmsOpts = {
        wildCards,
        overwrite: true,
      }
      const archivePath = path.join(discoveryPath, archivefile);
      return api.emitAndAwait('quickbms-operation', GAME_ID, BMS_SCRIPT,
        archivePath, discoveryPath, 'extract', quickbmsOpts)
        .then(() => generateFilteredList(filtered.map(file => file.destination)))
        .then(() => api.emitAndAwait('quickbms-operation', GAME_ID, INVAL_SCRIPT,
          archivePath, discoveryPath, 'write', {}))
        .then(() => Promise.resolve({ instructions }))
    });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID)
    && (files.find(file => file.indexOf(NATIVES_DIR) !== -1) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function getDiscoveryPath(api) {
  const store = api.store;
  const state = store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if ((discovery === undefined) || (discovery.path === undefined)) {
    log('error', 'devilmaycry5 was not discovered');
    return undefined;
  }

  return discovery.path;
}

function generateFilteredList(files) {
  const fileList = (process.platform === 'win32')
    ? files.map(file => file.replace(/\\/g, '/'))
    : files;
  return fs.readFileAsync(FILE_LIST, { encoding: 'utf-8' })
    .then(data => {
      const filtered = [];
      const fileEntries = data.split('\n');
      fileList.forEach(file => {
        const found = fileEntries.find(entry => entry.indexOf(file) !== -1);
        if (found !== undefined) {
          filtered.push(found);
        }
      });

      return removeFilteredList().then(() => 
        fs.writeFileAsync(FILTERED_LIST, filtered.join('\n')));
    });
}

function walkAsync(dir) {
  let entries = [];
  return fs.readdirAsync(dir).then(files => {
    return Promise.map(files, file => {
      const fullPath = path.join(dir, file);
      return fs.statAsync(fullPath).then(stats => {
        if (stats.isDirectory()) {
          return walkAsync(fullPath)
            .then(nestedFiles => {
              entries = entries.concat(nestedFiles);
              return Promise.resolve();
            })
        } else {
          entries.push(fullPath);
          return Promise.resolve();
        }
      });
    });
  })
  .then(() => Promise.resolve(entries));
}

function removeFilteredList() {
  return fs.removeAsync(FILTERED_LIST)
    .catch(err => (err.code === 'ENOENT') 
      ? Promise.resolve()
      : Promise.reject(err));
}

function main(context) {
  context.requireExtension('quickbms-support');
  context.registerGame({
    id: GAME_ID,
    name: 'Devil May Cry 5',
    logo: 'gameart.png',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    executable: () => 'DevilMayCry5.exe',
    requiredFiles: ['DevilMayCry5.exe'],
    details: {
      steamAppId: STEAM_ID,
    },
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  context.registerInstaller('dmc5-qbms-mod', 25, testSupportedContent,
    (files, destinationPath, gameId, progressDelegate) => 
      installQBMS(files, destinationPath, gameId, progressDelegate, context.api));

  context.registerAction('mod-icons', 500, 'savegame', {}, 'Invalidate Paths', () => {
    const store = context.api.store;
    const state = store.getState();
    const gameMode = selectors.activeGameId(state);
    if (gameMode !== GAME_ID) {
      return false;
    }

    const stagingFolder = selectors.installPathForGame(state, GAME_ID);
    store.dispatch(actions.startActivity('mods', 'invalidations'));
    const installedMods = util.getSafe(state, ['persistent', 'mods', GAME_ID]);
    const mods = Object.keys(installedMods);
    const discoveryPath = getDiscoveryPath(context.api);
    return Promise.each(mods, mod => {
      const modFolder = path.join(stagingFolder, mod);
      return walkAsync(modFolder)
        .then(entries => {
          const relFilePaths = entries.map(entry => entry.replace(modFolder + path.sep, ''));
          const wildCards = relFilePaths.map(fileEntry => fileEntry.replace(/\\/g, '/'))
          return findArchiveFile(wildCards, discoveryPath, context.api)
            .then(archivefile => {
              if (archivefile === undefined) {
                return Promise.reject(new util.NotFound('Failed to match mod files to game archives'));
              }
              const quickbmsOpts = {
                wildCards,
                overwrite: true,
              }
              const archivePath = path.join(discoveryPath, archivefile);
              return context.api.emitAndAwait('quickbms-operation', GAME_ID, BMS_SCRIPT,
                archivePath, discoveryPath, 'extract', quickbmsOpts)
                .then(() => generateFilteredList(relFilePaths))
                .then(() => context.api.emitAndAwait('quickbms-operation', GAME_ID, INVAL_SCRIPT,
                  archivePath, discoveryPath, 'write', {}))
                .catch(util.DataInvalid, () => Promise.resolve());
            });
        })
    })
    .finally(() => { store.dispatch(actions.stopActivity('mods', 'invalidations')); })
  }, () => {
    const state = context.api.store.getState();
    const gameMode = selectors.activeGameId(state);
    return (gameMode === GAME_ID)
  });
}

module.exports = {
  default: main
};