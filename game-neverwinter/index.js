const Promise = require('bluebird');
const path = require('path');
const Registry = require('winreg');
const { fs } = require('vortex-api');

const NWN_GAME_ID = 'nwn';

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

function prepareForModding(discovery) {
  return Promise.map(Object.keys(MOD_EXT_DESTINATION), ext => fs.ensureDirAsync(path.join(discovery.path, MOD_EXT_DESTINATION[ext])));
}

function main(context) {
  context.registerGame({
    id: NWN_GAME_ID,
    name: 'Neverwinter Nights',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => getPath(),
    logo: 'gameart.png',
    executable: () => 'nwmain.exe',
    requiredFiles: [
      'nwmain.exe',
    ],
    details: {
      webPageId: 'neverwinter',
    },
    setup: prepareForModding,
  });

  const getPath = () => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[NWN_GAME_ID];
    return discovery.path;
  }

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

    return Promise.resolve({instructions});
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === NWN_GAME_ID) &&
    (files.find(file => path.extname(file).substr(1) in MOD_EXT_DESTINATION) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

module.exports = {
  default: main
};
