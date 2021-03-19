const Promise = require('bluebird');
const path = require('path');
const semver = require('semver');

const { actions, fs, log, selectors, util } = require('vortex-api');

// Expected file name for the qbms script.
const BMS_SCRIPT = path.join(__dirname, 're2_pak_unpack.bms');

// Invalidation qbms script - this script relies on a filtered.list
//  file to be generated.
const INVAL_SCRIPT = path.join(__dirname, 're2_pak_invalidate.bms');

// Revalidation qbms script - this script relies on a invalcache.file
//  file to be generated and placed next to the input archive.
const REVAL_SCRIPT = path.join(__dirname, 're2_pak_revalidate.bms');

// RE2 filenames are encrypted. The list file contains
//  the actual filenames mapped against their murmur3 hash.
const ORIGINAL_FILE_LIST = path.join(__dirname, 're2_pak_names_release.list');

const NATIVES_DIR = 'natives' + path.sep;
const GAME_PAK_FILE = 're_chunk_000.pak';
const DLC_PAK_FILE = 're_dlc_000.pak';
const GAME_ID = 'residentevil22019';
const STEAM_ID = 883710;
const STEAM_ID_Z = 895950;

const legacyArcNames = {
  _native: GAME_PAK_FILE,
  _920560: path.join('920560', DLC_PAK_FILE),
  _920561: path.join('920561', DLC_PAK_FILE),
  _920562: path.join('920562', DLC_PAK_FILE),
  _920563: path.join('920563', DLC_PAK_FILE),
  _920564: path.join('920564', DLC_PAK_FILE),
  _920565: path.join('920565', DLC_PAK_FILE),
  _920566: path.join('920566', DLC_PAK_FILE),
  _920567: path.join('920567', DLC_PAK_FILE),
  _920568: path.join('920568', DLC_PAK_FILE),
  _920569: path.join('920569', DLC_PAK_FILE),
  _920570: path.join('920570', DLC_PAK_FILE),
}

const I18N_NAMESPACE = `game-${GAME_ID}`;
const MIGRATION_FILE = path.join(util.getVortexPath('temp'), GAME_ID + '_needsMigration');

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .catch(err => util.steam.findByAppId(STEAM_ID_Z.toString()))
    .then(game => game.gamePath);
}

function prepareForModding(discovery, api) {
  if (api.ext.addReEngineGame === undefined) {
    return Promise.reject(new Error('re-engine-wrapper dependency is not loaded!'));
  }
  return fs.statAsync(MIGRATION_FILE)
    .then(() => migrateToReWrapper(api))
    .catch(err => new Promise((resolve, reject) => {
      api.ext.addReEngineGame({
        gameMode: GAME_ID,
        bmsScriptPaths: {
          invalidation: INVAL_SCRIPT,
          revalidation: REVAL_SCRIPT,
          extract: BMS_SCRIPT,
        },
        fileListPath: ORIGINAL_FILE_LIST,
        legacyArcNames,
      }, err => (err === undefined)
        ? resolve()
        : reject(err));
    }))
    .then(() => fs.removeAsync(MIGRATION_FILE).catch(err => Promise.resolve()))
    .then(() => fs.ensureDirWritableAsync(path.join(discovery.path, 'natives')));
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

async function installContent(files,
                              destinationPath,
                              gameId,
                              progressDelegate) {
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

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file.source,
      destination: file.destination,
    }
  });

  return Promise.resolve({ instructions });
}

function migrateToReWrapper(api) {
  const mods = util.getSafe(api.getState(), ['persistent', 'mods', GAME_ID], {});
  if (Object.keys(mods).length === 0) {
    return Promise.resolve();
  }

  if (api.ext.migrateReEngineGame === undefined) {
    log('error', 're-engine-wrapper is not loaded - failed to migrate the invalidation cache');
    return new Promise((resolve) => {
      return api.sendNotification({
        type: 'warning',
        message: api.translate('Resident Evil 2 mods need to be re-installed',
          { ns: I18N_NAMESPACE }),
        noDismiss: true,
        actions: [
          {
            title: 'More',
            action: () => {
              api.showDialog('info', 'Resident Evil 2 (2019)', {
                text: 'Vortex\'s Resident Evil 2 modding pattern has been enhanced to better support '
                    + 'the game\'s modding requirements.\n\nVortex attempted to automatically migrate '
                    + 'your existing invalidation cache but was unsuccessful - unfortunately this means '
                    + 'you will have to re-install all of your RE2 mods in order to continue managing them with Vortex.\n\n'
                    + 'We are sorry for the inconvenience.',
              }, [
                { label: 'Close' },
              ]);
            },
          },
          {
            title: 'Understood',
            action: dismiss => {
              dismiss();
              resolve();
            }
          }
        ],
      });
    });
  }

  return new Promise((resolve, reject) => {
    const gameConfig = {
      gameMode: GAME_ID,
      bmsScriptPaths: {
        invalidation: INVAL_SCRIPT,
        revalidation: REVAL_SCRIPT,
        extract: BMS_SCRIPT,
      },
      fileListPath: ORIGINAL_FILE_LIST,
      legacyArcNames,
    };
    api.ext.migrateReEngineGame(gameConfig, (err) => {
      return (err !== undefined)
        ? reject(err)
        : resolve();
    });
  });
}

function migrate020(oldVersion) {
  if (semver.gte(oldVersion || '0.0.1', '0.2.0')) {
    return Promise.resolve();
  }

  return fs.writeFileAsync(MIGRATION_FILE, 'temporaryfile')
    .catch(err => ['EEXIST'].includes(err.code)
      ? Promise.resolve()
      : Promise.reject(err));
}

function migrate010(api, oldVersion) {
  if (semver.gte(oldVersion || '0.0.1', '0.1.0')) {
    return Promise.resolve();
  }

  const state = api.store.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  return (Object.keys(mods).length === 0)
    ? Promise.resolve()
    : new Promise((resolve) => {
      return api.sendNotification({
        id: 're2-reinstall',
        type: 'warning',
        message: api.translate('Resident Evil 2 mods need to be re-installed',
          { ns: I18N_NAMESPACE }),
        noDismiss: true,
        actions: [
          {
            title: 'More',
            action: () => {
              api.showDialog('info', 'Resident Evil 2 (2019)', {
                text: 'Vortex\'s Resident Evil 2 modding pattern has been enhanced to better support '
                    + 'the game\'s modding requirements; specifically when installing non-dlc mods.\n'
                    + 'These enhancements have changed the way mods were previously installed, which '
                    + 'unfortunately means that for the mods to work correctly you have to purge and '
                    + 'reinstall them.\n'
                    + 'We are sorry for the inconvenience.',
              }, [
                { label: 'Close' },
              ]);
            },
          },
          {
            title: 'Understood',
            action: dismiss => {
              dismiss();
              resolve();
            }
          }
        ],
      });
  });
}

function main(context) {
  context.requireExtension('re-engine-wrapper');
  context.registerGame({
    id: GAME_ID,
    name: 'Resident Evil 2 (2019)',
    logo: 'gameart.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    executable: () => 're2.exe',
    requiredFiles: ['re2.exe', GAME_PAK_FILE],
    environment: {
      SteamAPPId: STEAM_ID.toString(),
    },
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  // Pre-qbms RE2 installer was not fit for purpose and needs to be removed.
  //  Users which have already downloaded mods need to be migrated.
  context.registerMigration(old => migrate010(context.api, old));
  context.registerMigration(migrate020);

  context.registerInstaller('re2qbmsmod', 25, testSupportedContent, installContent);
}

module.exports = {
  default: main
};