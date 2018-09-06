const Promise = require('bluebird');
const path = require('path');
const Registry = require('winreg');
const { fs } = require('vortex-api');
const { remote } = require('electron');

const NWNEE_GAME_ID = 'nwnee';

// Will contain the path to the mods folder.
//  this is to avoid calling remote.app each time we
//  need the mods folder.
let _modsFolder = undefined;

// Override folder name. We're going to assume that any files that are present
//  within an 'override' directory inside the archive, are going to be deployed 
//  to Neverwinter's override directory untampered.
const MOD_OVERRIDE = 'override';

// A map of file extensions mapped against their
//  expected folder name.
const MOD_EXT_DESTINATION = {
  mod: 'modules',
  tga: 'portraits',
  erf: 'erf',
  hak: 'hak',
  tlk: 'tlk',
};

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  let regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 704450',
  });

  return new Promise((resolve, reject) => {
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
  if (_modsFolder === undefined) {
    _modsFolder = path.join(remote.app.getPath('documents'), 'Neverwinter Nights');
  }

  return _modsFolder;
}

function prepareForModding() {
  // Ensure all modding related directories are present.
  return Promise.map(Object.keys(MOD_EXT_DESTINATION), ext => fs.ensureDirAsync(path.join(modPath(), MOD_EXT_DESTINATION[ext])));
}

function main(context) {
  context.registerGame({
    id: NWNEE_GAME_ID,
    name: 'Neverwinter Nights: Enhanced Edition',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'bin/win32/nwmain.exe',
    requiredFiles: [
      'bin/win32/nwmain.exe',
    ],
    details: {
      webPageId: 'neverwinter',
    },
    setup: prepareForModding,
  });

  context.registerInstaller('nwnee-mod', 25, testSupportedContent, installContent);

  return true;
}

/**
 * File extensions are used to dictate the destination for
 *  each file, unless the mod's files are placed within an
 *  override folder; in which case those files will be placed
 *  within the override game folder regardless of their ext.
 */
function installContent(files) {
  const instructions = files.filter(file => MOD_EXT_DESTINATION[path.extname(file).substr(1).toLowerCase()] !== undefined)
    .map(file => {
      let finalDestination;
      if (file.indexOf(MOD_OVERRIDE) !== -1) {
        finalDestination = path.join(file);
      } else {
        const fileType = path.extname(file).substr(1);
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
  const supported = (gameId === NWNEE_GAME_ID) &&
    (files.find(file => path.extname(file).substr(1) in MOD_EXT_DESTINATION) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

module.exports = {
  default: main
};
