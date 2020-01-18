const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, log, util } = require('vortex-api');
// Nexus Mods id for the game.
const GAME_ID = 'halflife2';

// All HL2 mods will be .vpk files
const MOD_FILE_EXT = ".vpk";

function findGame() {
  return util.steam.findByAppId('220')
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'hl2', 'custom'),
    () => Promise.resolve());
}

function installContent(files) {
  // The .vpk file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);
  
  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file => 
    ((file.indexOf(rootPath) !== -1) 
    && (!file.endsWith(path.sep))));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join(file.substr(idx)),
    };
  });

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  let supported = (gameId === GAME_ID) &&
    (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);

  if (supported && files.find(file =>
      (path.basename(file).toLowerCase() === 'moduleconfig.xml')
      && (path.basename(path.dirname(file)).toLowerCase() === 'fomod'))) {
    supported = false;
  }

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

let _API = undefined;
function main(context) {
  _API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: 'Half-Life 2',
    mergeMods: true,
    queryPath: findGame,
    requiresCleanup: true,
    supportedTools: [],
    queryModPath: () => path.join('hl2', 'custom'),
    logo: 'gameart.jpg',
    executable: () => 'hl2.exe',
    requiredFiles: [
      'hl2.exe'
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: 220,
    },
    details: {
      steamAppId: 220,
    },
  });

  context.registerInstaller('halflife2-mod', 25, testSupportedContent, installContent);
  
  return true;
}

module.exports = {
  default: main,
};