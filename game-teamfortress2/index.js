const { util } = require('vortex-api');
const path = require('path');

const STEAM_ID = 440;
const GAME_ID = 'teamfortress2';

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath);
}

let tools = [
  {
    id: 'hammer',
    name: 'Hammer',
    logo: 'hammer.png',
    executable: () => 'hammer.exe',
    requiredFiles: [
      'hammer.exe',
    ],
  },
];

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Team Fortress 2',
    shortName: 'TF2',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => path.join('tf', 'custom'),
    logo: 'gameart.png',
    executable: () => 'hl2.exe',
    requiredFiles: [
      'hl2.exe',
      path.join('tf', 'gameinfo.txt'),
    ],
    environment: {
      SteamAPPId: STEAM_ID.toString(),
    },
    details: {
      steamAppId: STEAM_ID,
      nexusPageId: GAME_ID,
    }
  });
  return true;
}

module.exports = {
  default: main,
};
