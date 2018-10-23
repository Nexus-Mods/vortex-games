const { types, util } = require('vortex-api');
const Registry = require('winreg');

function findGame() {
  return new Promise((resolve, reject) => {
    if (Registry === undefined) {
      // linux ? macos ?
      return reject(new Error('No registry'));
    }

    const regKey = new Registry({
      hive: Registry.HKLM,
      key: '\\Software\\Wow6432Node\\Bethesda Softworks\\Skyrim Special Edition',
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
    util.steam.findByName('The Elder Scrolls V: Skyrim Special Edition')
      .then(game => game.gamePath)
  );
}

const tools = [
  {
    id: 'SSEEdit',
    name: 'SSEEdit',
    logo: 'tes5edit.png',
    executable: () => 'SSEEdit.exe',
    requiredFiles: [
      'SSEEdit.exe',
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
    name: 'FNIS',
    logo: 'fnis.png',
    executable: () => 'GenerateFNISForUsers.exe',
    requiredFiles: [
      'GenerateFNISForUsers.exe',
    ],
    relative: true,
  },
  {
    id: 'skse64',
    name: 'SKSE64',
    executable: () => 'skse64_loader.exe',
    requiredFiles: [
      'skse64_loader.exe',
    ],
    relative: true,
  },
];

function main(context) {
  context.registerGame({
    id: 'skyrimse',
    name: 'Skyrim Special Edition',
    shortName: 'SSE',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'SkyrimSE.exe',
    requiredFiles: [
      'SkyrimSE.exe',
    ],
    environment: {
      SteamAPPId: '489830',
    },
    details: {
      steamAppId: 489830,
    }
  });

  return true;
}

module.exports = {
  default: main,
};
