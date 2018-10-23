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
      key: '\\Software\\Wow6432Node\\Bethesda Softworks\\skyrim',
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
    util.steam.findByName('The Elder Scrolls V: Skyrim')
      .then(game => game.gamePath)
  );
}

let tools = [
  {
    id: 'TES5Edit',
    name: 'TES5Edit',
    logo: 'tes5edit.png',
    executable: () => 'TES5Edit.exe',
    requiredFiles: [
      'TES5Edit.exe',
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
    id: 'FNIS',
    name: 'Fores New Idles in Skyrim',
    shortName: 'FNIS',
    logo: 'fnis.png',
    executable: () => 'GenerateFNISForUsers.exe',
    requiredFiles: [
      'GenerateFNISForUsers.exe',
    ],
    relative: true,
  },
  {
    id: 'skse',
    name: 'Skyrim Script Extender',
    shortName: 'SKSE',
    executable: () => 'skse_loader.exe',
    requiredFiles: [
      'skse_loader.exe',
    ],
    relative: true,
  },
];

function main(context) {
  context.registerGame({
    id: 'skyrim',
    name: 'Skyrim',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'TESV.exe',
    requiredFiles: [
      'TESV.exe',
    ],
    environment: {
      SteamAPPId: '72850',
    },
    details: {
      steamAppId: 72850,
    }
  });

  return true;
}

module.exports = {
  default: main
};
