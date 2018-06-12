const { log, util } = require('vortex-api');

const { remote } = require('electron');
const path = require('path');
const Registry = require('winreg');

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  let regkey;

  if (process.arch === 'x32') {
    regkey = '\\Software\\Zenimax_Online\\Launcher';
  } else {
    regkey = '\\Software\\Wow6432Node\\Zenimax_Online\\Launcher';
  }

  const regKey = new Registry({
    hive: Registry.HKLM,
    key: regkey,
  });

  return new Promise((resolve, reject) => {
    regKey.get('InstallPath', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else if (result === null) {
        reject(new Error('empty registry key'));
      } else {
        resolve(path.join(result.value, 'Launcher'));
      }
    });
  })
  .catch(err =>
    util.steam.findByName('The Elder Scrolls Online')
      .then(game => game.gamePath)
  );
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
