const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const Registry = require('winreg');
const { fs } = require('vortex-api');

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
};

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  let regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\Wow6432Node\\Bioware\\NWN\\Neverwinter',
  });

  return new Promise((resolve, reject) => {
    regKey.get('Location', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else if (result === null) {
        reject(new Error('empty registry key'));
      } else {
        resolve(result.value);
      }
    });
  })
}

function findGameEE() {
  return new Promise((resolve, reject) => {
    if (Registry === undefined) {
      return reject(new Error('not windows'));
    }
    let regKey = new Registry({
      hive: Registry.HKLM,
      key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 704450',
    });

    regKey.get('InstallLocation', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else if (result === null) {
        reject(new Error('empty registry key'));
      } else {
        resolve(result.value);
      }
    });
  }).catch(err =>
    util.steam.findByName('Neverwinter Nights: Enhanced Edition')
      .then(game => game.gamePath)
  );
}


function modPath() {
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
    queryModPath: modPath,
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
