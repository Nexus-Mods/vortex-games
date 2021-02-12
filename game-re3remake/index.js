const Promise = require('bluebird');
const path = require('path');

const { actions, fs, log, selectors, util } = require('vortex-api');

// Expected file name for the qbms script.
const BMS_SCRIPT = path.join(__dirname, 're3_pak_unpack.bms');

// Invalidation qbms script - this script relies on a filtered.list
//  file to be generated.
const INVAL_SCRIPT = path.join(__dirname, 're3_pak_invalidate.bms');

// Revalidation qbms script - this script relies on a invalcache.file
//  file to be generated and placed next to the input archive.
const REVAL_SCRIPT = path.join(__dirname, 're3_pak_revalidate.bms');

// RE2 filenames are encrypted. The list file contains
//  the actual filenames mapped against their murmur3 hash.
const ORIGINAL_FILE_LIST = path.join(__dirname, 're3_pak_names_release.list');

const NATIVES_DIR = 'natives' + path.sep;
const STEAM_DLL = 'steam_api64.dll';
const GAME_PAK_FILE = 're_chunk_000.pak';
const GAME_ID = 'residentevil32020';
const STEAM_ID = 952060;

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

  // // Create the wildcards quickBMS is going to use to filter/find
  // //  list matches.
  // const wildCards = filtered.map(fileEntry =>
  //   fileEntry.destination.replace(/\\/g, '/'));
  // return addToFileList(wildCards)
  //   .then(() => Promise.resolve({ instructions }));
}

function main(context) {
  context.requireExtension('re-engine-wrapper');
  context.registerGame({
    id: GAME_ID,
    name: 'Resident Evil 3 (2020)',
    logo: 'gameart.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    executable: () => 're3.exe',
    requiredFiles: ['re3.exe', GAME_PAK_FILE],
    //requiresLauncher,
    environment: {
      SteamAPPId: STEAM_ID.toString(),
    },
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  context.registerInstaller('re3qbmsmod', 25, testSupportedContent, installContent);
}

module.exports = {
  default: main
};