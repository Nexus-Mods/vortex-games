const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const { fs, log, selectors, util } = require('vortex-api');

function findGame() {
  return util.steam.findByAppId('220200')
      .then(game => game.gamePath);
}

function main(context) {
  context.registerGame({
    id: 'kerbalspaceprogram',
    name: 'Kerbal Space Program',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'GameData',
    logo: 'gameart.jpg',
    executable: () => 'KSP_x64.exe',
    requiredFiles: [
      'KSP_x64.exe',
    ],
    environment: {
      SteamAPPId: '220200',
    },
    details: {
      steamAppId: 220200,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
