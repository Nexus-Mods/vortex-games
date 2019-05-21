const Promise = require('bluebird');
const winapi = require('winapi-bindings');

const { remote, app } = require('electron');
const path = require('path');
const { fs } = require('vortex-api');

const appUni = app || remote.app;

// The Sims 4 mods folder may be affected by localization.
//  Judging by Origin's install manifest the game will generally
//  use the en_US localization form for most locales except for
//  de_DE, es_ES, fr_FR and nl_NL.
const LOCALE_MODS_FOLDER = {
  en_US: 'The Sims 4',
  de_DE: 'Die Sims 4',
  es_ES: 'Los Sims 4',
  fr_FR: 'Les Sims 4',
  nl_NL: 'De Sims 4',
}

function findGame() {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Currently only discovered on windows'));
  }
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Maxis\\The Sims 4',
      'Install Dir');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.reject(err);
  }
}

// Given that registerGame does not accept mod paths asynchronously
//  we're adding a temporary "hack" that loops through each possible localization
//  mod path and return the first one we find.
// TODO: Modify registerGame to accept mod paths asynchronously so
//  we can query the Locale registry key and use that to retrieve the
//  correct mod path.
function modPath() {
  for (let key in LOCALE_MODS_FOLDER) {
    const modsFolder = path.join(appUni.getPath('documents'), 'Electronic Arts', LOCALE_MODS_FOLDER[key]);
    try {
      if (fs.statSync(modsFolder) !== undefined) {
        return path.join(modsFolder, 'Mods');
      }
    } catch(err) {
      if (err.code !== 'ENOENT') {
        log('warn', 'Failed to check Sims 4 install directory', {
          tested: modsPath,
          err: err.message,
        });
      }
      // do nothing
    }
  }
  throw new Error('Couldn\'t find the mods directory for Sims 4. Please make sure you have run it at least once. '
    + 'If you report this as a bug, please let us know where the directory is located on your system.');
}

function prepareForModding() {
  return fs.ensureDirAsync(modPath());
}

function main(context) {
  context.registerGame({
    id: 'thesims4',
    name: 'The Sims 4',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.png',
    executable: () => 'game/bin/TS4.exe',
    setup: prepareForModding,
    supportedTools: [
      {
        id: 'exe64bit',
        name: 'The Sims 4 (64 bit)',
        logo: 'icon.png',
        executable: () => 'game/bin/TS4_x64.exe',
        requiredFiles: [
          'game/bin/TS4_x64.exe',
        ],
        relative: true,
      },
    ],
    requiredFiles: [
      'game/bin/TS4.exe',
    ],
  });

  return true;
}

module.exports = {
  default: main
};
