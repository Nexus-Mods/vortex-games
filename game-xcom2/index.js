const path = require('path');
const { util } = require('vortex-api');

function findGame() {
  return util.steam.findByName('XCOM 2')
      .then(game => game.gamePath);
}

function main(context) {
  context.registerGame({
    id: 'xcom2',
    name: 'XCOM 2',
    logo: 'gameart.png',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => path.join('XComGame', 'Mods'),
    executable: () => 'Binaries/Win64/XCom2.exe',
    requiredFiles: [
      'XComGame',
      'XComGame/CookedPCConsole/3DUIBP.upk',
      'XComGame/CharacterPool/Importable/Demos&Replays.bin'
    ],
    details: {
      steamAppId: 268500,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
