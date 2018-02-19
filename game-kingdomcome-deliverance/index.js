const { remote } = require('electron');
const { fs, log, util } = require('vortex-api');
const path = require('path');

function findGame() {
  return util.steam.findByAppId('379430')
      .then(game => game.gamePath);
}

function main(context) {
  context.registerGame({
    id: 'kingdomcomedeliverance',
    name: 'Kingdom Come: Deliverance',
    mergeMods: false,
    queryPath: findGame,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'Bin/Win64/KingdomCome.exe',
    requiredFiles: [
      'Bin/Win64/KingdomCome.exe',
    ],
    details: {
      steamAppId: 379430,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
