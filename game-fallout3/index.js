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
      key: '\\Software\\Wow6432Node\\Bethesda Softworks\\Fallout3',
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
    util.steam.findByName('Fallout 3')
      .then(game => game.gamePath)
  );
}

let tools = [
  {
    id: 'FO3Edit',
    name: 'FO3Edit',
    logo: 'fo3edit.png',
    executable: () => 'FO3Edit.exe',
    requiredFiles: [
      'FO3Edit.exe',
    ],
  },
  {
    id: 'fose',
    name: 'FOSE',
    executable: () => 'fose_loader.exe',
    requiredFiles: [
      'fose_loader.exe',
    ],
    relative: true,
  }
];

function main(context) {
  context.registerGame({
    id: 'fallout3',
    name: 'Fallout 3',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'fallout3.exe',
    requiredFiles: [
      'fallout3.exe',
    ],
    environment: {
      SteamAPPId: '22300',
    },
    details: {
      steamAppId: 22300,
    }
  });

  return true;
}

module.exports = {
  default: main,
};
