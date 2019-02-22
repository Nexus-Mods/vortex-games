const { util } = require('vortex-api');

function findGame() {
  // enderal doesn't seem to have a registry entry
  return util.steam.findByName('Enderal: Forgotten Stories')
    .then(game => game.gamePath);
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
    id: 'enderal',
    name: 'Enderal',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'Enderal Launcher.exe',
    requiredFiles: [
      'Enderal Launcher.exe',
      'TESV.exe',
    ],
    environment: {
      SteamAPPId: '933480',
    },
    details: {
      steamAppId: 933480,
    }
  });

  return true;
}

module.exports = {
  default: main
};
