const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
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
const steamReg = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 582010';

const MHW_EXEC = 'MonsterHunterWorld.exe';

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      steamReg,
      'InstallLocation');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('MONSTER HUNTER: WORLD')
      .then(game => game.gamePath);
  }
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
