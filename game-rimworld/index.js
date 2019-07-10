const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const { fs, log, selectors, util } = require('vortex-api');

function findGame() {
  return util.steam.findByAppId('294100')
      .then(game => game.gamePath);
}

function main(context) {
  var arch = process.platform === 'x64';
  context.registerGame({
    id: 'rimworld',
    name: 'RimWorld',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.png',
    executable: arch ?
      () => 'RimWorldWin64.exe' :
      () => 'RimWorldWin.exe',
    requiredFiles: arch ? [
      'RimWorldWin64.exe'
    ] : [
      'RimWorldWin.exe'
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
