const Promise = require('bluebird');
const { util } = require('vortex-api');
const Registry = require('winreg');

function findGame() {
  return new Promise((resolve, reject) => {
    if (Registry === undefined) {
      // linux ? macos ?
      return reject(new Error('No registry'));
    }

    let regKey = new Registry({
      hive: Registry.HKLM,
      key: '\\Software\\Wow6432Node\\Bethesda Softworks\\Fallout 4 VR',
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
    util.steam.findByName('Fallout 4 VR')
      .then(game => game.gamePath)
  );
}

let tools = [
  {
    id: 'FO4Edit',
    name: 'FO4Edit',
    logo: 'tes5edit.png',
    executable: () => 'xedit.exe',
    requiredFiles: [
      'tes5edit.exe',
    ],
  },
  {
    id: 'FNIS',
    name: 'FNIS',
    logo: 'fnis.png',
    executable: () => 'GenerateFNISForUsers.exe',
    requiredFiles: [
      'GenerateFNISForUsers.exe',
    ],
  },
];

function main(context) {
  context.registerGame({
    id: 'fallout4vr',
    name: 'Fallout 4 VR',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'Fallout4VR.exe',
    requiredFiles: [
      'Fallout4VR.exe',
    ],
    environment: {
      SteamAPPId: '611660',
    },
    details: {
      steamAppId: 611660,
    }
  });

  return true;
}

module.exports = {
  default: main,
};
