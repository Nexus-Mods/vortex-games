const { types } = require('vortex-api');
const Registry = require('winreg');

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\Wow6432Node\\Bethesda Softworks\\Skyrim VR',
  });

  return new Promise((resolve, reject) => {
    regKey.get('Installed Path', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else {
        resolve(result.value);
      }
    });
  })
  .catch(err =>
    util.Steam.findByName('The Elder Scrolls V: Skyrim VR')
      .then(game => game.gamePath)
  );
}

const tools = [
  {
    id: 'SSEEdit',
    name: 'SSEEdit',
    logo: 'tes5edit.png',
    executable: () => 'sseedit.exe',
    requiredFiles: [
      'tes5edit.exe',
    ],
  },
  {
    id: 'WryeBash',
    name: 'WryeBash',
    logo: 'wrye.png',
    executable: () => 'wryebash.exe',
    requiredFiles: [
      'wryebash.exe',
    ],
  },
  {
    id: 'loot',
    name: 'LOOT',
    logo: 'loot.png',
    executable: () => 'loot.exe',
    parameters: [
      '--game="Skyrim Special Edition"',
    ],
    requiredFiles: [
      'loot.exe',
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
    id: 'skyrimvr',
    name: 'Skyrim VR',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'SkyrimVR.exe',
    requiredFiles: [
      'SkyrimVR.exe',
    ],
    environment: {
      SteamAPPId: '611670',
    },
    details: {
      steamAppId: 611670,
    }
  });

  return true;
}

module.exports = {
  default: main,
};
