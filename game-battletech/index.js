const Promise = require('bluebird');
const { app, remote } = require('electron');
const path = require('path');
const { fs, log, util } = require('vortex-api');

const appUni = remote !== undefined ? remote.app : app;

const APPID = 637090;

function findGame() {
  return util.steam.findByAppId(APPID.toString())
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'), () => Promise.resolve());
}

function gameExecutable() {
  return 'BattleTech.exe';
}

function modPath() {
  return path.join(appUni.getPath('documents'), 'My Games', 'BattleTech', 'mods');
}

function main(context) {
  context.registerGame({
    id: 'battletech',
    name: 'BattleTech',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: gameExecutable,
    requiredFiles: [
      gameExecutable(),
      'BattleTechLauncher.exe',
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: APPID.toString(),
    },
    details: {
      steamAppId: APPID,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
