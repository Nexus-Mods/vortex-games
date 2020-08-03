const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Skyrim Special Edition',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('The Elder Scrolls V: Skyrim Special Edition')
      .then(game => game.gamePath);
  }
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
    id: 'skse64',
    name: 'Skyrim Script Extender 64',
    shortName: 'SKSE64',
    executable: () => 'skse64_loader.exe',
    requiredFiles: [
      'skse64_loader.exe',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true,
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
    logo: 'gameart.jpg',
    executable: () => 'SkyrimSE.exe',
    requiredFiles: [
      'SkyrimSE.exe',
    ],
    environment: {
      SteamAPPId: '489830',
    },
    details: {
      steamAppId: 489830,
      nexusPageId: 'skyrimspecialedition',
    }
  });

  return true;
}

module.exports = {
  default: main,
};
