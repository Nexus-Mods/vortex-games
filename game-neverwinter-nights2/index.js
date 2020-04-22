const Promise = require('bluebird');
const { app, remote } = require('electron');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, util } = require('vortex-api');

const appUni = app || remote.app;

const GAME_ID = 'neverwinter2';
const MODULE_EXT = '.mod';

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

function modulesModPath() {
  return path.join(appUni.getPath('documents'), 'Neverwinter Nights 2', 'modules');
}

function install(files) {
  const instructions = files
    .filter(file => (path.extname(path.basename(file)) === MODULE_EXT))
    .map(file => ({
      type: 'copy',
      source: file,
      destination: path.join('modules', path.basename(file)),
    }));

  return Promise.resolve({ instructions });
}

function testSupported(files, gameId) {
  if (GAME_ID !== gameId) {
    // Not NWN2
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  // Only allow mods which contain .mod files - we "allow" .txt and .doc files in case the mod
  //  author included a readme file.
  const unsupportedFiles = files.filter(file => (path.extname(path.basename(file)) !== '')
                                             && (['.txt', '.doc', MODULE_EXT].indexOf(path.extname(file)) === -1));

  return Promise.resolve({
    supported: (unsupportedFiles.length === 0),
    requiredFiles: [],
  });
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(modulesModPath(), () => Promise.resolve());
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Neverwinter Nights 2',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: () => 'nwn2.exe',
    requiredFiles: [
      'nwn2.exe',
    ],
    setup: prepareForModding,
  });

  // This installer will only support mods with .mod files.
  context.registerInstaller('moduleinstaller', 25, testSupported, install);

  return true;
}

module.exports = {
  default: main
};
