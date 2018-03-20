const Promise = require('bluebird');
const { remote } = require('electron');
const path = require('path');
const { fs, log, selectors, util } = require('vortex-api');

function findGame() {
  return util.steam.findByAppId('264710')
      .then(game => game.gamePath);
}

let tools = [
  {
	id: 'qmods',
	name: 'QModManager',
	executable: () => 'QModManager.exe',
	requiredFiles: [
	  'QModManager.exe',
	],
	relative: true,
  }
];

function main(context) {
  context.registerGame({
    id: 'subnautica',
    name: 'Subnautica',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'QMods',
	  supportedTools: tools,
    logo: 'gameart.png',
    executable: () => 'Subnautica.exe',
    requiredFiles: [
      'Subnautica.exe',
    ],
    details: {
      steamAppId: 264710,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
