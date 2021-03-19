const path = require('path');
const { fs, util } = require('vortex-api');

const GOG_ID = '2147483047';
const STEAM_ID = '606150';
const GAME_ID = 'moonlighter';

function findGame() {
  return util.GameStoreHelper.findByName('Moonlighter')
    .catch(() => util.GameStoreHelper.findByAppId([STEAM_ID, GOG_ID]))
    .then(game => game.gamePath);
}

function setup(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'BepInEx', 'plugins'));
}

function main(context) {
  context.requireExtension('modtype-bepinex');
  context.registerGame({
    id: GAME_ID,
    name: 'Moonlighter',
    logo: 'gameart.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => path.join('BepInEx', 'plugins'),
    executable: () => 'Moonlighter.exe',
    setup,
    requiredFiles: [
      'Moonlighter.exe'
    ],
    environment: {
      SteamAPPId: STEAM_ID,
    },
    details: {
      steamAppId: +STEAM_ID,
    },
  });

  context.once(() => {
    if (context.api.ext.bepinexAddGame !== undefined) {
      context.api.ext.bepinexAddGame({
        gameId: GAME_ID,
        autoDownloadBepInEx: true,
        doorstopConfig: {
          doorstopType: 'default',
          ignoreDisableSwitch: true,
        }
      })
    }
  })
}

module.exports = {
  default: main
};
