const path = require('path');
const { fs, util } = require('vortex-api');

function findGame() {
  return util.steam.findByName('Pillars of Eternity II: Deadfire')
      .then(game => game.gamePath);
}

function modPath() {
  return path.join('PillarsOfEternityII_Data', 'override');
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, modPath()));
}

let tools = [];

function main(context) {
  context.registerGame({
    id: 'pillarsofeternity2',
    name: 'Pillars Of Eternity II: Deadfire',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'PillarsOfEternityII.exe',
    requiredFiles: [
      'PillarsOfEternityII.exe',
    ],
    supportedTools: tools,
    setup: prepareForModding,
    details: {
      steamAppId: 560130,
    },
  });
  return true;
}

module.exports = {
  default: main,
};
