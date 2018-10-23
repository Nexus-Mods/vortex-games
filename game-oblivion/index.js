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
      key: '\\Software\\Wow6432Node\\Bethesda Softworks\\oblivion',
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
    util.steam.findByName('The Elder Scrolls IV: Oblivion')
      .then(game => game.gamePath)
  );
}

let tools = [
  {
    id: 'TES4Edit',
    name: 'TES4Edit',
    logo: 'tes5edit.png',
    executable: () => 'TES4Edit.exe',
    requiredFiles: [
      'TES4Edit.exe',
    ],
  },
];

function main(context) {
  context.registerGame({
    id: 'oblivion',
    name: 'Oblivion',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'oblivion.exe',
    requiredFiles: [
      'oblivion.exe',
    ],
    environment: {
      SteamAPPId: '22330',
    },
    details: {
      steamAppId: 22330,
    },
  });
  return true;
}

module.exports = {
  default: main
};
