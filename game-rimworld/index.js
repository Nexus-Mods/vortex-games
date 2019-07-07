const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const { fs, log, selectors, util } = require('vortex-api');

function findGame() {
  return util.steam.findByAppId('294100')
      .then(game => game.gamePath);
}

function main(context) {
  context.registerGame({
    id: 'rimworld',
    name: 'RimWorld',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.png',
    executable: () => 'RimWorldWin.exe',
    requiredFiles: [
      'RimWorldWin.exe',
    ],
    details: {
      steamAppId: 294100,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
