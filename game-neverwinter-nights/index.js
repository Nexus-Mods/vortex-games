const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, util } = require('vortex-api');

const NWN_GAME_ID = 'nwn';
const NWNEE_GAME_ID = 'nwnee';

// Override folder name. We're going to assume that any files that are present
//  within an 'override' directory inside the archive, are going to be deployed 
//  to Neverwinter's override directory untampered.
const MOD_OVERRIDE = 'override';

// A map of file extensions mapped against their
//  expected folder name.
const MOD_EXT_DESTINATION = {
  '.mod': 'modules',
  '.tga': 'portraits',
  '.erf': 'erf',
  '.hak': 'hak',
  '.tlk': 'tlk',
  '.bmu': 'music',
};

function findGame() {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Currently only discovered on windows'));
  }
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bioware\\NWN\\Neverwinter',
      'Location');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.reject(err);
  }
}

function findGameEE() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 704450',
      'InstallLocation');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('Neverwinter Nights: Enhanced Edition')
      .then(game => game.gamePath);
  }
}


function modPath(context) {
  const state = context.api.store.getState();
  const discovery = state.settings.gameMode.discovered[NWN_GAME_ID];
  return discovery.path;
}

let _modsFolder;
function modPathEE() {
  if (_modsFolder === undefined) {
    _modsFolder = path.join(remote.app.getPath('documents'), 'Neverwinter Nights');
  }

  return _modsFolder;
}

function prepareForModding(discovery) {
  return Promise.map(Object.keys(MOD_EXT_DESTINATION),
    ext => fs.ensureDirAsync(path.join(discovery.id === 'nwn' ? discovery.path : modPathEE(), MOD_EXT_DESTINATION[ext])));
}

function main(context) {
  context.registerGame({
    id: NWN_GAME_ID,
    name: 'Neverwinter Nights',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => modPath(context),
    logo: 'gameart.png',
    executable: () => 'nwmain.exe',
    requiredFiles: [
      'nwmain.exe',
    ],
    details: {
      nexusPageId: 'neverwinter',
    },
    setup: prepareForModding,
  });

  context.registerGame({
    id: NWNEE_GAME_ID,
    name: 'Neverwinter Nights: Enhanced Edition',
    mergeMods: true,
    queryPath: findGameEE,
    queryModPath: modPathEE,
    logo: 'gameartee.png',
    executable: () => 'bin/win32/nwmain.exe',
    requiredFiles: [
      'bin/win32/nwmain.exe',
    ],
    details: {
      nexusPageId: 'neverwinter',
    },
    setup: prepareForModding,
  });

  context.registerInstaller('nwn-mod', 25, testSupportedContent, installContent);

  return true;
}

/**
 * File extensions are used to dictate the destination for
 *  each file, unless the mod's files are placed within an
 *  override folder; in which case those files will be placed
 *  within the override game folder regardless of their ext.
 */
function installContent(files) {
  const instructions = files
    .filter(file => MOD_EXT_DESTINATION[path.extname(file).toLowerCase()] !== undefined)
    .map(file => {
      let finalDestination;
      if (file.indexOf(MOD_OVERRIDE) !== -1) {
        finalDestination = path.join(file);
      } else {
        const fileType = path.extname(file).toLowerCase();
        finalDestination = path.join(MOD_EXT_DESTINATION[fileType], path.basename(file));
      }

      return {
        type: 'copy',
        source: file,
        destination: finalDestination,
      };
    });

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = ([NWN_GAME_ID, NWNEE_GAME_ID].indexOf(gameId) !== -1) &&
    (files.find(file => path.extname(file).toLowerCase() in MOD_EXT_DESTINATION) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

module.exports = {
  default: main
};
