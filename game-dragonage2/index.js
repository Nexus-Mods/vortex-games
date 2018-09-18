const { app, remote } = require('electron');
const path = require('path');
const { fs } = require('vortex-api');
const Registry = require('winreg');

const appUni = app || remote.app;

function regget(key, val) {
  return new Promise((resolve, reject) => {
    const regKey = new Registry({
      hive: Registry.HKLM,
      key,
    });
    regKey.get(val, (err, result) => {
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

function findGame() {
  if (Registry === undefined) {
    return null;
  }

  // Dragon Age 2 seems to store the installation directory information
  //  in different registry paths (possibly tied to game edition or localisation),
  //  namely within HKLM...\Dragon Age 2\Install Dir; OR HKLM...\Dragon Age II\Install Dir;
  //  we're going to test both.
  return regget('\\Software\\Wow6432Node\\BioWare\\Dragon Age 2', 'Install Dir')
    .catch(() => regget('\\Software\\Wow6432Node\\BioWare\\Dragon Age II', 'Install Dir'));
}

function queryModPath() {
  return path.join(appUni.getPath('documents'), 'BioWare', 'Dragon Age 2', 'packages', 'core', 'override');
}

function prepareForModding() {
  return fs.ensureDirAsync(queryModPath());
}

function main(context) {
  context.requireExtension('modtype-dragonage');
  context.registerGame({
    id: 'dragonage2',
    name: 'Dragon Age 2',
    mergeMods: true,
    queryPath: findGame,
    queryModPath,
    logo: 'gameart.png',
    executable: () => 'bin_ship/dragonage2.exe',
    setup: prepareForModding,
    requiredFiles: [
      'bin_ship/dragonage2.exe',
    ],
    details: {
    },
  });

  return true;
}

module.exports = {
  default: main,
};
