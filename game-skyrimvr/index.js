const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Skyrim VR',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('The Elder Scrolls V: Skyrim VR')
      .then(game => game.gamePath);
  }
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
    id: 'sksevr',
    name: 'Skyrim Script Extender VR',
    shortName: 'SKSEVR',
    executable: () => 'sksevr_loader.exe',
    requiredFiles: [
      'sksevr_loader.exe',
    ],
    relative: true,
    exclusive: true,
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
    logo: 'gameart.jpg',
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
