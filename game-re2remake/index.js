const Promise = require('bluebird');
const path = require('path');
const { fs, util } = require('vortex-api');

const MODULE_CONFIG = 'moduleconfig.xml';
const NATIVES_DIR = 'natives' + path.sep;
const DLC_PAK_FILE = 're_dlc_000.pak';
const GAME_ID = 'residentevil22019';
const STEAM_ID = 883710;

// A list of DLC's and their corresponding model file prefixes.
//  We will have to update this list as new DLC is released.
const DLC_LIST = {
  DLC_920560: ['pl0000/pl0005', 'pl0000/pl0075'], // ARKLAY SHERIFF LEON (costume B)
  DLC_920561: ['pl0000/pl0004', 'pl0000/pl0050_04', 'pl0000/pl0074'], // LEON NOIR (costume A)
  DLC_920562: ['pl1000/pl1006', 'pl1000/pl1050_04', 'pl1000/pl1071'], // CLAIRE MILITARY (costume B)
  DLC_920563: ['pl1000/pl1005', 'pl1000/pl1075'], // CLAIRE NOIR (costume A)
  DLC_920564: ['pl1000/pl1004'], // ELZA WALKER COSTUME (Costume C)
  DLC_920565: ['pl0000/pl0007', 'pl0000/pl0057'], // Leon Costume: '98 (costume D)
  DLC_920566: ['pl1000/pl1007', 'pl1000/pl1057'], // Claire Costume: '98 (costume D)
}

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'natives'), () => Promise.resolve());
}

async function findInvalidations(files) {
  let invalidations = [];
  return new Promise((resolve, reject) => {
    Object.keys(DLC_LIST).map(key => {
      const dlcPath = path.join(key.substring(4), DLC_PAK_FILE);
      if (invalidations.indexOf(dlcPath) === -1) {
        const playerModelParts = DLC_LIST[key];
        playerModelParts.forEach(part => {
          const pathVal = path.join('sectionroot', 'character', 'player', part) + path.sep;
          if (files.find(file => file.indexOf(pathVal) !== -1) !== undefined) {
            invalidations.push(dlcPath);
          }
        })
      }
    })
    
    const uniqueInvalidations = Array.from(new Set(invalidations));
    return resolve(uniqueInvalidations);
  })
}

function getGameRootPath() {
  // Leaving this unused function here in case we are forced to use
  //  REtool in the future.
  const store = _API.store;
  const state = store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  return discovery.path;
}

async function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  const rootPath = files.find(file => file.endsWith(NATIVES_DIR));
  const idx = rootPath.length - NATIVES_DIR.length;

  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file =>
    ((file.indexOf(rootPath) !== -1)
      && (!file.endsWith(path.sep))));

  let instructions = [];
  const invalidations = await findInvalidations(filtered);
  return Promise.each(invalidations, inv => {
    // Create the invalidation file and installation instructions.
    return fs.ensureFileAsync(path.join(destinationPath, inv))
      .then(() => {
        instructions.push({
          type: 'copy',
          source: inv,
          destination: inv,
        });

        return Promise.resolve();
      });
  })
  .then(() => Promise.each(filtered, file => {
    instructions.push({
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    });
    return Promise.resolve();
  }))
  .then(() => Promise.resolve({ instructions }));
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID)
    && (files.find(file => file.indexOf(NATIVES_DIR) !== -1) !== undefined)
    && (files.find(file => file.toLowerCase().indexOf(MODULE_CONFIG) !== -1) === undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function main(context) {
  _API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: 'Resident Evil 2 (2019)',
    logo: 'gameart.png',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    executable: () => 're2.exe',
    requiredFiles: ['re2.exe'],
    details: {
      steamAppId: STEAM_ID,
    },
    setup: prepareForModding,
  });

  context.registerInstaller('re2remake-mod', 25, testSupportedContent, installContent);
}

module.exports = {
  default: main
};