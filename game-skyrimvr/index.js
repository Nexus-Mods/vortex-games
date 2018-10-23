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
      key: '\\Software\\Wow6432Node\\Bethesda Softworks\\Skyrim VR',
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
    util.steam.findByName('The Elder Scrolls V: Skyrim VR')
      .then(game => game.gamePath)
  );
}

const tools = [
  {
    id: 'TES5VREdit',
    name: 'TES5VREdit',
    logo: 'tes5edit.png',
    executable: () => 'TES5VREdit.exe',
    requiredFiles: [
      'TES5VREdit.exe',
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
