const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
    return util.steam.findByName('Pathfinder: Kingmaker')
      .then(game => game.gamePath);  
}

let tools = [
  {
    id: 'UnityModManager',
    name: 'Unity Mod Manager',
    logo: 'umm.png',
    executable: () => 'UnityModManager.exe',
    requiredFiles: [
      'UnityModManager.exe',
    ],
  },
];

function main(context) {
  context.registerGame({
    id: 'pathfinderkingmaker',
    name: 'Pathfinder: Kingmaker',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'Mods',
    logo: 'gameart.png',
    executable: () => 'Kingmaker.exe',
    requiredFiles: [
      'Kingmaker.exe',
    ],
    environment: {
      SteamAPPId: '640820',
    },
    details: {
      steamAppId: 640820,
    },
  });
  return true;
}

module.exports = {
  default: main
};
