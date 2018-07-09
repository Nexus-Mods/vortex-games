const path = require('path');
const { fs, log, util } = require('vortex-api');

function findGame() {
  return util.steam.findByName('War Thunder')
      .then(game => game.gamePath);
}

function modPath() {
  return 'UserSkins';
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, modPath()));
}

function main(context) {
  context.registerGame({
    id: 'warthunder',
    name: 'War Thunder',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'win64/aces.exe',
    requiredFiles: [
      'win64/aces.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 236390,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
