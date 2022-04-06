const path = require('path');
const Promise = require('bluebird');
const { fs, util } = require('vortex-api');

const STEAM_DLL = 'steam_api64.dll'

function findGame() {
  return util.steam.findByAppId('294100')
      .then(game => game.gamePath);
}

function requiresLauncher(gamePath) {
  return fs.readdirAsync(gamePath)
    .then(files => (files.find(file => file.endsWith(STEAM_DLL)) !== undefined)
      ? Promise.resolve({ launcher: 'steam' })
      : Promise.resolve(undefined))
    .catch(err => Promise.reject(err));
}

function resolveGameVersion(discoveryPath) {
  const versionPath = path.join(discoveryPath, 'version.txt');
  return fs.readFileAsync(versionPath, { encoding: 'utf8' })
    .then((res) => Promise.resolve(res));
}

function main(context) {
  context.registerGame({
    id: 'rimworld',
    name: 'RimWorld',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.jpg',
    executable: () => 'RimWorldWin64.exe',
    requiredFiles: [
      'RimWorldWin64.exe'
    ],
    getGameVersion: resolveGameVersion,
    requiresLauncher,
    environment: {
      SteamAPPId: '294100',
    },
    details: {
      steamAppId: 294100,
    },
  });

  return true;
}

module.exports = {
  default: main,
};
