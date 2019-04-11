const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, util } = require('vortex-api');

// Mods for Surviving Mars normally have this file containing mod data. 
const MOD_FILE = "modcontent.hpk"

// Nexus Mods id for the game.
const SURVIVINGMARS_ID = 'survivingmars';

// Game has different executable names depending where
//  the user purchased it from.
const STEAM_EXE = 'MarsSteam.exe';
const GOG_EXE = 'MarsGOG.exe'

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\2129244347',
      'PATH');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByAppId('464920')
      .then(game => game.gamePath);
  }
}

function modPath() {
  return path.join(remote.app.getPath('appData'), 'Surviving Mars', 'mods');
}

function prepareForModding() {
  return fs.ensureDirAsync(modPath());
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  // The modinfo.ini file is expected to always be positioned in the root directory
  //  of the mod itself; we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.basename(file).toLowerCase() === MOD_FILE);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);
  const modName = (rootPath !== '')
    ? rootPath
    : path.basename(destinationPath, '.installing');

  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file =>
    ((file.indexOf(rootPath) !== -1)
      && (!file.endsWith(path.sep))));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join(modName, file.substr(idx)),
    };
  });

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === SURVIVINGMARS_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === MOD_FILE) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function getExecutable(discoveryPath) {
  if (discoveryPath === undefined) {
    return STEAM_EXE;
  }

  let execFile = GOG_EXE;
  try {
    fs.statSync(path.join(discoveryPath, GOG_EXE))
  } catch (err) {
    execFile = STEAM_EXE;
  }

  return execFile;
}

function main(context) {
  // We're going to register the game with the steam
  //  executable by default as theoretically we expect more users
  //  to have the Steam version installed.
  context.registerGame({
    id: SURVIVINGMARS_ID,
    name: 'Surviving Mars',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: (discoveryPath) => getExecutable(discoveryPath),
    requiredFiles: [],
    setup: prepareForModding,
    details: {
      steamAppId: 464920,
    },
  });

  context.registerInstaller('survivingmars-mod', 25, testSupportedContent, installContent);

  return true;
}

module.exports = {
  default: main,
};
