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

// SW: KOTOR games do not store their installation location in
//  registry ( at least the Steam versions don't )
//  Unforunately this means we can only rely on Steam for
//  registry discovery.
const steamReg = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App ';

const OVERRIDE_FOLDER = 'override';

const KOTOR_GAMES = {
  kotor: {
    id: 'kotor',
    shortName: 'Star Wars: KOTOR',
    name: 'STAR WARS™ - Knights of the Old Republic™',
    steamId: '32370',
    regPath: steamReg + '32370',
    logo: 'gameartkotor.png',
    exec: 'swkotor.exe',
  },
  kotor2: {
    id: 'kotor2',
    shortName: 'Star Wars: KOTOR II',
    name: 'STAR WARS™ Knights of the Old Republic™ II - The Sith Lords™',
    steamId: '208580',
    regPath: steamReg + '208580',
    logo: 'gameartkotor2.png',
    exec: 'swkotor2.exe',
  },
}

function findGame(kotorGame) {
  const { name, regPath } = kotorGame;
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      regPath,
      'InstallLocation');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName(name)
      .then(game => game.gamePath);
  }
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
      queryPath: () => findGame(game.regPath),
      queryModPath: () => OVERRIDE_FOLDER,
      logo: game.logo,
      executable: () => game.exec,
      requiredFiles: [
        game.exec,
      ],
      details: {
        steamAppId: game.steamId,
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
        // Remove all precedent folders up to the modRoot directory (including the override folder).
        const lowerCased = file.toLowerCase();
        const finalDestination = lowerCased.substr(lowerCased.indexOf(OVERRIDE_FOLDER) + OVERRIDE_FOLDER.length + 1);
        return {
          type: 'copy',
          source: file,
          destination: finalDestination,
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
