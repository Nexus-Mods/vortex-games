const { log, util } = require('vortex-api');

const { remote } = require('electron');
const path = require('path');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    if (process.arch === 'x32') {
      regkey = 'Software\\Zenimax_Online\\Launcher';
    } else {
      regkey = 'Software\\Wow6432Node\\Zenimax_Online\\Launcher';
    }

    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      regKey,
      'InstallPath');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(path.join(instPath.value, 'Launcher'));
  } catch (err) {
    return util.steam.findByName('The Elder Scrolls Online')
      .then(game => game.gamePath);
  }
}

function modPath() {
  return path.join(remote.app.getPath('documents'), 'Elder Scrolls Online', 'live', 'Addons');
}

function main(context) {
  context.registerGame({
    id: 'teso',
    name: 'The Elder Scrolls Online',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'Bethesda.net_Launcher.exe',
    requiredFiles: [
      'Bethesda.net_Launcher.exe',
    ],
    details: {
      steamAppId: 306130,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
