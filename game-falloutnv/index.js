const Promise = require('bluebird');
const Registry = require('winreg');
const { util } = require('vortex-api');

function findGame() {
  return new Promise((resolve, reject) => {
    if (Registry === undefined) {
      // linux ? macos ?
      return reject(new Error('No registry'));
    }

    let regKey = new Registry({
      hive: Registry.HKLM,
      key: '\\Software\\Wow6432Node\\Bethesda Softworks\\falloutnv',
    });

    regKey.get('Installed Path', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else if (result === null) {
        reject(new Error('empty registry key'));
      } else {
        resolve(result.value);
      }
    });
  })
  .catch(err =>
    util.steam.findByName('Fallout: New Vegas')
      .then(game => game.gamePath)
  );
}

let tools = [
  {
    id: 'FNVEdit',
    name: 'FNVEdit',
    logo: 'fo3edit.png',
    executable: () => 'FNVEdit.exe',
    requiredFiles: [
      'FNVEdit.exe',
    ],
  },
  {
    id: 'WryeBash',
    name: 'Wrye Bash',
    logo: 'wrye.png',
    executable: () => 'Wrye Bash.exe',
    requiredFiles: [
      'Wrye Bash.exe',
    ],
  },
  {
    id: 'nvse',
    name: 'New Vegas Script Extender',
    shortName: 'NVSE',
    executable: () => 'nvse_loader.exe',
    requiredFiles: [
      'nvse_loader.exe',
    ],
    relative: true,
  }
];

function main(context) {
  context.registerGame({
    id: 'falloutnv',
    name: 'Fallout: New Vegas',
    shortName: 'New Vegas',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'FalloutNV.exe',
    requiredFiles: [
      'FalloutNV.exe',
    ],
    environment: {
      SteamAPPId: '22380',
    },
    details: {
      steamAppId: 22380,
    }
  });
  return true;
}

module.exports = {
  default: main,
};
