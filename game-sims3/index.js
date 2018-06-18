const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const { fs } = require('vortex-api');
const Registry = require('winreg');

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\WOW6432Node\\Sims\\The Sims 3',
  });

  return new Promise((resolve, reject) => {
    regKey.get('Install Dir', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else if (result === null) {
        reject(new Error('empty registry key'));
      } else {
        resolve(result.value);
      }
    });
  });
}

const resource = `Priority 500
PackedFile DCCache/*.dbc
PackedFile Packages/*.package
PackedFile Packages/*/*.package
PackedFile Packages/*/*/*.package
PackedFile Packages/*/*/*/*.package
PackedFile Packages/*/*/*/*/*.package
`;

function prepareForModding() {
  const basePath = modPath();
  const resPath = path.join(path.dirname(basePath), 'Resource.cfg');
  return fs.ensureDirAsync(basePath)
    .then(() => fs.statAsync(resPath))
    .catch(() => fs.writeFileAsync(resPath, resource, { encoding: 'utf-8' }));
}

function modPath() {
  return path.join(remote.app.getPath('documents'), 'Electronic Arts', 'The Sims 3', 'Mods', 'Packages');
}

let tools = [];

function main(context) {
  context.registerGame({
    id: 'thesims3',
    name: 'The Sims 3',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'game/bin/TS3.exe',
    requiredFiles: [
      'game/bin/TS3.exe',
    ],
    supportedTools: tools,
    setup: prepareForModding,
    details: {
      steamAppId: 47890,
    },
  });
  return true;
}

module.exports = {
  default: main,
};
