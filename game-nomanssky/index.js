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
  const pcbanks = path.join(discovery.path, 'GAMEDATA', 'PCBANKS');
  return fs.ensureDirAsync(path.join(discovery.path, modPath()))
    .then(() => fs.renameAsync(path.join(pcbanks, 'DISABLEMODS.TXT'), path.join(pcbanks, 'ENABLEMODS.TXT'))
      .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err)));
}

function main(context) {
  context.registerGame({
    id: 'nomanssky',
    name: 'No Man\'s Sky',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: () => 'Binaries/NMS.exe',
    requiredFiles: [
      'Binaries/NMS.exe',
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: '275850',
    },
    details: {
      steamAppId: 275850,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
