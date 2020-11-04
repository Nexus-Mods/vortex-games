const { remote } = require('electron');
const path = require('path');
const { fs, log, util } = require('vortex-api');

function findGame() {
  return util.steam.findByName('Starbound')
      .then(game => game.gamePath);
}

function gameExecutable() {
  return 'win64/starbound.exe';
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, 'mods'));
}

function main(context) {
  context.registerGame({
    id: 'starbound',
    name: 'Starbound',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'mods',
    logo: 'gameart.jpg',
    executable: gameExecutable,
    requiredFiles: [
      gameExecutable(),
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: '211820',
    },
    details: {
      steamAppId: 211820,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
