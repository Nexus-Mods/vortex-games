const { remote } = require('electron');
const { fs, log, util } = require('vortex-api');
const path = require('path');

function findGame() {
  return util.steam.findByAppId('379430')
      .then(game => game.gamePath);
}

function test(game, discovery) {
  if (game.id !== 'kingdomcomedeliverance') {
    return undefined;
  }

  return {
    baseFiles: [
      {
        in: path.join(discovery.path, 'user.cfg'),
        out: 'user.cfg',
      },
    ],
    filter: filePath => path.basename(filePath) === 'user.cfg',
  };
}

function merge(filePath, mergeDir) {
  return fs.readFileAsync(filePath)
      .then(modData => fs.writeFileAsync(path.join(mergeDir, 'user.cfg'),
                                         '\n' + modData, {flag: 'a'}));
}


function main(context) {
  context.registerGame({
    id: 'kingdomcomedeliverance',
    name: 'Kingdom Come: Deliverance',
    mergeMods: false,
    queryPath: findGame,
    queryModPath: () => '.',
    logo: 'gameart.png',
    executable: () => 'Bin/Win64/KingdomCome.exe',
    requiredFiles: [
      'Bin/Win64/KingdomCome.exe',
    ],
    details: {
      steamAppId: 379430,
    },
  });

  context.registerMerge(test, merge, '');

  return true;
}

module.exports = {
  default: main,
};
