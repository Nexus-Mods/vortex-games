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

let cachedModPath;

function findModPath() {
  let locale;
  // check registry for the locale
  try {
    const candidate = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Maxis\\The Sims 4',
      'Locale');
    if (!!candidate) {
      locale = candidate.value;
    }
  } catch (err) { }

  const eaPath = path.join(appUni.getPath('documents'), 'Electronic Arts');

  // if we didn't find the locale in the registry (suspicious) loop through the known
  // ones and see if the corresponding mod folder exists
  if (locale === undefined) {
    locale = Object.keys(LOCALE_MODS_FOLDER).find(candidate => {
      try {
        const modsFolder = path.join(eaPath, candidate);
        fs.statSync(modsFolder);
        return true;
      } catch (err) {
        return false;
      }
    });
  }

  if (locale !== undefined) {
    return path.join(eaPath, locale, 'Mods');
  }

  throw new Error('Couldn\'t find the mods directory for Sims 4. Please make sure you have run it at least once. '
    + 'If you report this as a bug, please let us know where the directory is located on your system.');

}

function modPath() {
  if (cachedModPath === undefined) {
    cachedModPath = findModPath();
  }

  return cachedModPath;
}

const resourceCfg = `
Priority 500
PackedFile *.package
PackedFile */*.package
PackedFile */*/*.package
PackedFile */*/*/*.package
PackedFile */*/*/*/*.package
PackedFile */*/*/*/*/*.package
`;

function writeResourceCfg() {
  return fs.writeFileAsync(path.join(modPath(), 'Resource.cfg'), resourceCfg);
}

function prepareForModding() {
  return fs.ensureDirAsync(modPath())
    .then(() => writeResourceCfg());
}

const TRAY_EXTENSIONS = new Set([
  '.bpi', '.blueprint', '.trayitem', '.sfx', '.ion', '.householdbinary',
  '.sgi', '.hhi', '.room', '.midi', '.rmi',
]);

const MODS_EXTENSIONS = new Set([
  '.package', '.ts4script', '.py', '.pyc', '.pyo',
]);

function testMixed(files, gameId) {
  if (gameId !== 'thesims4') {
    return Promise.resolve(false);
  }

  const trayFile = files.find(
    file => {
      const ext = path.extname(file);
      return TRAY_EXTENSIONS.has(ext.toLowerCase());
     })

  return Promise.resolve({
    supported: trayFile !== undefined,
    requiredFiles: [],
  });
}

function hasParent(input, set) {
  if (input.length === 0) {
    return false;
  }

  const dirPath = path.dirname(input).toLowerCase();
  if (set.has(dirPath)) {
    return true;
  } else if (dirPath === '.') {
    return false;
  } else {
    return hasParent(dirPath, set);
  }
}

function installMixed(files, destinationPath) {
  const instructions = [];

  instructions.push({ type: 'setmodtype', value: 'sims4mixed' });

  const ext = input => path.extname(input).toLowerCase();

  // find out which path(s) contain files for tray
  const traySamples = files.filter(filePath => TRAY_EXTENSIONS.has(ext(filePath)));
  let trayBases = new Set(traySamples
    .map(filePath => path.dirname(filePath).toLowerCase()));

  // find out which path(s) contain files for mods
  const modsSamples = files.filter(filePath => MODS_EXTENSIONS.has(ext(filePath)));
  let modsBases = new Set(modsSamples
    .map(filePath => path.dirname(filePath).toLowerCase()));

  // the following tries to account for overlap where the same directory contains files
  // for tray and mods:
  //   a) if a directory contains files with an extension for the mods directory,
  //      all files in that dir get copied to mods except for those that have an extension for
  //      tray directory
  //   b) if a directory contains files with an extension for the tray directory,
  //      all files in that dir get copied to tray, unless they were handled in a)
  //   c) everything that's left is also copied to mods, just in case
  //
  // This way, if a directory contains "tray files" but also a readme.txt, all files including
  // the readme go to tray.
  // If a directory contains "tray files", "mods files" and a readme.txt, tray files go to
  // tray, mods files go to mods and the readme also goes to mods.
  files.forEach(filePath => {
    if (filePath.endsWith(path.sep)) {
      return;
    }
    const instruction = {
      type: 'copy',
      source: filePath,
    };
    if (hasParent(filePath, modsBases) && !TRAY_EXTENSIONS.has(ext(filePath))) {
      instruction.destination = path.join('Mods', path.basename(filePath));
    } else if (hasParent(filePath, trayBases)) {
      instruction.destination = path.join('Tray', path.basename(filePath));
    } else {
      instruction.destination = path.join('Mods', path.basename(filePath));
    }
    instructions.push(instruction);
  });

  return Promise.resolve({ instructions });
}

function getMixedPath() {
  return path.resolve(modPath(), '..');
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

  context.registerModType('sims4mixed', 25, gameId => gameId === 'thesims4', getMixedPath,
                          () => Promise.resolve(false));
  context.registerInstaller('sims4mixed', 25, testMixed, installMixed);

  return true;
}

module.exports = {
  default: main
};
