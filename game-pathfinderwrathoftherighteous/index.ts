const path = require('path');
const { fs, types, util } = require('vortex-api');

const GAME_ID = 'pathfinderwrathoftherighteous';
const NAME = 'Pathfinder: Wrath\tof the Righteous';
const STEAM_ID = '1184370';
const GOG_ID = '1207187357';

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAM_ID, GOG_ID])
    .then(game => game.gamePath);
}

function setup(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'));
}

function main(context) {
  context.requireExtension('modtype-umm');
  context.registerGame(
    {
      id: GAME_ID,
      name: NAME,
      logo: 'gameart.jpg',
      mergeMods: true,
      queryPath: findGame,
      queryModPath: () => 'Mods',
      executable: () => 'Wrath.exe',
      requiredFiles: ['Wrath.exe'],
      environment: {
        SteamAPPId: STEAM_ID,
      }, 
      details:
      {
        steamAppId: +STEAM_ID,
      },
      setup,
    });
  context.once(() => {
    if (context.api.ext.ummAddGame !== undefined) {
      context.api.ext.ummAddGame({
        gameId: GAME_ID,
        autoDownloadUMM: true,
      });
    }
  })

  return true;
}

module.exports = {
    default: main
};
