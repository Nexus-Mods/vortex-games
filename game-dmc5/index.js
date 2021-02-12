const Promise = require('bluebird');
const path = require('path');
const semver = require('semver');

const { actions, fs, log, selectors, util } = require('vortex-api');

// Expected file name for the qbms script.
const BMS_SCRIPT = path.join(__dirname, 'dmc5_pak_unpack.bms');

// Invalidation qbms script - this script relies on a filtered.list
//  file to be generated.
const INVAL_SCRIPT = path.join(__dirname, 'dmc5_pak_invalidate.bms');

// Revalidation qbms script - this script relies on a invalcache.file
//  file to be generated and placed next to the input archive.
const REVAL_SCRIPT = path.join(__dirname, 'dmc5_pak_revalidate.bms');

// DMC5 filenames are encrypted. The list file contains
//  the actual filenames mapped against their murmur3 hash.
const ORIGINAL_FILE_LIST = path.join(__dirname, 'dmc5_pak_names_release.list');

const NATIVES_DIR = 'natives' + path.sep;
const GAME_PAK_FILE = 're_chunk_000.pak';
const GAME_ID = 'devilmaycry5';
const STEAM_ID = 601150;

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath);
}

function prepareForModding(discovery, api) {
  if (api.ext.addReEngineGame === undefined) {
    return Promise.reject(new Error('re-engine-wrapper dependency is not loaded!'));
  }
  
  return new Promise((resolve, reject) => {
    api.ext.addReEngineGame({
      gameMode: GAME_ID,
      bmsScriptPaths: {
        invalidation: INVAL_SCRIPT,
        revalidation: REVAL_SCRIPT,
        extract: BMS_SCRIPT,
      },
      fileListPath: ORIGINAL_FILE_LIST,
    }, err => (err === undefined)
      ? resolve()
      : reject(err));
  }).then(() => fs.ensureDirWritableAsync(path.join(discovery.path, 'natives')));
}

function migrate010(api, oldVersion) {
  if (semver.gte(oldVersion || '0.0.1', '0.1.0')) {
    return Promise.resolve();
  }

  const mods = util.getSafe(api.getState(), ['persistent', 'mods', GAME_ID], {});
  if (Object.keys(mods).length === 0) {
    return Promise.resolve();
  }
  if (api.ext.migrateReEngineGame === undefined) {
    log('error', 're-engine-wrapper is not loaded - failed to migrate the invalidation cache');
    return new Promise((resolve) => {
      return api.sendNotification({
        type: 'warning',
        message: api.translate('DMC5 mods need to be re-installed',
          { ns: I18N_NAMESPACE }),
        noDismiss: true,
        actions: [
          {
            title: 'More',
            action: () => {
              api.showDialog('info', 'Devil May Cry 5', {
                text: 'Vortex\'s DMC5 modding pattern has been enhanced to better support '
                    + 'the game\'s modding requirements.\n\nVortex attempted to automatically migrate '
                    + 'your existing invalidation cache but was unsuccessful - unfortunately this means '
                    + 'you will have to re-install all of your DMC5 mods in order to continue managing them with Vortex.\n\n'
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
    };
    api.ext.migrateReEngineGame(gameConfig, (err) => {
      return (err !== undefined)
        ? reject(err)
        : resolve();
    });
  });
}

async function installQBMS(files, destinationPath, gameId, progressDelegate) {
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

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID)
    && (files.find(file => file.indexOf(NATIVES_DIR) !== -1) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function main(context) {
  context.requireExtension('re-engine-wrapper');
  context.registerGame({
    id: GAME_ID,
    name: 'Devil May Cry 5',
    logo: 'gameart.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    executable: () => 'DevilMayCry5.exe',
    requiredFiles: ['DevilMayCry5.exe', GAME_PAK_FILE],
    environment: {
      SteamAPPId: STEAM_ID.toString(),
    },
    details: {
      steamAppId: STEAM_ID,
    },
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  context.registerMigration(old => migrate010(context.api, old));

  context.registerInstaller('dmc5qbmsmod', 25, testSupportedContent, installQBMS);
}

module.exports = {
  default: main
};