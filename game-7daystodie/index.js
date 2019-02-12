const Promise = require('bluebird');
const winapi = require('winapi-bindings');
const path = require('path');
const { fs, log, util } = require('vortex-api');
const { remote } = require('electron');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 251570',
      'InstallLocation');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('7 Days to Die')
      .catch(() => util.steam.findByAppId('251570'))
      .then(game => game.gamePath);
  }
}

function gameExecutable() {
  return '7DaysToDie.exe';
}

function main(context) {
  context.registerGame({
    id: '7daystodie',
    name: '7 Days to Die',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    logo: 'gameart.png',
    executable: gameExecutable,
    requiredFiles: [
	  '7DaysToDie.exe',
    ],
    details: {
      steamAppId: 251570,
    },
  });

  return true;
}

module.exports = {
  default: main
};
