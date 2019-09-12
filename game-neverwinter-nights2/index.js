const Promise = require('bluebird');
const { app, remote } = require('electron');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, util } = require('vortex-api');

const appUni = app || remote.app;

const GAME_ID = 'neverwinter2';

function findGame() {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Currently only discovered on windows'));
  }
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\obsidian\\nwn 2\\neverwinter',
      'Location');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.reject(err);
  }
}

function modPath() {
  return path.join(appUni.getPath('documents'), 'Neverwinter Nights 2');
}

function overrideModPath() {
  return path.join(appUni.getPath('documents'), 'Neverwinter Nights 2', 'override');
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Neverwinter Nights 2',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'nwn2.exe',
    requiredFiles: [
      'nwn2.exe',
    ],
  });

  return true;
}

module.exports = {
  default: main
};
