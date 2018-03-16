const { fs, log, util } = require('vortex-api');

const path = require('path');

function findGame() {
  return util.steam.findByName('No Man\'s Sky')
      .then(game => game.gamePath);
}

function modPath() {
  return path.join('GAMEDATA', 'PCBANKS', 'MODS');
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, modPath()));
}

function main(context) {
  context.registerGame({
    id: 'nomanssky',
    name: 'No Man\'s Sky',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'Binaries/NMS.exe',
    requiredFiles: [
      'Binaries/NMS.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 275850,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
