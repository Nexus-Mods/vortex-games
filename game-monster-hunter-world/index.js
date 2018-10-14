const Promise = require('bluebird');
const path = require('path');
const Registry = require('winreg');
const { fs, util } = require('vortex-api');

// Monster Hunter: World mods are consistently contained within
//  the 'nativePC' folder. We're going to depend on this folder
//  existing within the archive when trying to decide whether the
//  mod is supported or not.
const NATIVE_PC_FOLDER = 'nativePC';

// We can rely on the steam uninstall registry key when
//  figuring out the install location for MH:W; but this is
//  of course only valid for steam installations.
//  TODO: Find and test a regkey which does not depend
//  on steam to cater for non-steam installations.
const steamReg = '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 582010';

const MHW_EXEC = 'MonsterHunterWorld.exe';

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  let regKey = new Registry({
    hive: Registry.HKLM,
    key: steamReg,
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
    util.steam.findByName('MONSTER HUNTER: WORLD')
      .then(game => game.gamePath)
  );
}

function prepareForModding(discovery) {
    return fs.ensureDirAsync(path.join(discovery.path, NATIVE_PC_FOLDER));
}

function main(context) {
  context.registerGame({
    id: 'monsterhunterworld',
    name: 'Monster Hunter: World',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    logo: 'gameart.png',
    executable: () => MHW_EXEC,
    requiredFiles: [
      MHW_EXEC,
    ],
    details: {
      steamAppId: '582010',
    },
    setup: prepareForModding,
  });

  return true;
}

module.exports = {
  default: main
};
