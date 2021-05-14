// Star Wars: Knights of the Old Republic mods (kotor1 and kotor2) 
//  are usually extracted to the override folder found within the game's
//  directory. Most modders provide a full override directory structure
//  within their archive; in which case we will just copy over the 
//  contents of the override folder to the modPath.
//  
//  We will let the default installer to take over when the override structure
//  isn't detected.

const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, util } = require('vortex-api');

const STEAM_DLL = 'steam_api.dll';

const OVERRIDE_FOLDER = 'override';

const KOTOR_GAMES = {
  kotor: {
    id: 'kotor',
    shortName: 'Star Wars: KOTOR',
    name: 'STAR WARS™ - Knights of the Old Republic™',
    steamId: '32370',
    gogId: '1207666283',
    logo: 'gameart.jpg',
    exec: 'swkotor.exe',
  },
  kotor2: {
    id: 'kotor2',
    shortName: 'Star Wars: KOTOR II',
    name: 'STAR WARS™ Knights of the Old Republic™ II - The Sith Lords™',
    steamId: '208580',
    gogId: '1421404581',
    logo: 'gameartkotor2.jpg',
    exec: 'swkotor2.exe',
  },
}

function requiresLauncher(gamePath) {
  return fs.readdirAsync(gamePath)
    .then(files => files.find(file => file.indexOf(STEAM_DLL) !== -1) !== undefined 
      ? Promise.resolve({ launcher: 'steam' }) 
      : Promise.resolve(undefined))
    .catch(err => Promise.reject(err));
}

function readRegistryKey(hive, key, name) {
  try {
    const instPath = winapi.RegGetValue(hive, key, name);
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.reject(new util.ProcessCanceled(err));
  }
}

function findGame(kotorGame) {
  const { gogId, steamId } = kotorGame;
  return util.steam.findByAppId(steamId)
    .then(game => game.gamePath)
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${gogId}`,
      'PATH'))
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\GOG.com\\Games\\${gogId}`,
      'PATH'));
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, OVERRIDE_FOLDER));
}

function main(context) {
  Object.keys(KOTOR_GAMES).forEach(key => {
    const game = KOTOR_GAMES[key];
    context.registerGame({
      id: game.id,
      name: game.shortName,
      mergeMods: true,
      queryPath: () => findGame(game),
      queryModPath: () => OVERRIDE_FOLDER,
      requiresLauncher: game.id === 'kotor2' 
        ? requiresLauncher 
        : undefined,
      logo: game.logo,
      executable: () => game.exec,
      requiredFiles: [
        game.exec,
      ],
      environment: {
        SteamAPPId: game.steamId,
      },
      details: {
        steamAppId: parseInt(game.steamId, 10),
      },
      setup: prepareForModding,
    });
  })

  context.registerInstaller('kotor-override-mod', 25, testSupported, installContent);

  return true;
}

function installContent(files,
                destinationPath,
                gameId,
                progressDelegate) {
  // An override folder has been provided by the modder; we're going
  //  to copy over the contents of the override folder into the game's mods
  //  folder.
  const instructions = files
    .filter(file => path.dirname(file.toLowerCase()).indexOf(OVERRIDE_FOLDER) !== -1 && path.extname(file) !== '')
    .map(file => {
      const segments = file.split(path.sep);
      const idx = segments.findIndex(seg => seg.toLowerCase() === OVERRIDE_FOLDER);
      const destination = segments.slice(idx + 1).join(path.sep);
      return {
        type: 'copy',
        source: file,
        destination,
      };
    });

  return Promise.resolve({ instructions });
}

function testSupported(files, gameId) {
  const supported = (gameId in KOTOR_GAMES) 
  && files.find(file => file.toLowerCase().indexOf(OVERRIDE_FOLDER) !== -1) !== undefined;
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

module.exports = {
  default: main
};
