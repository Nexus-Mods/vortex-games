const { app, remote } = require('electron');
const path = require('path');
const { fs, util } = require('vortex-api');
const { parseXmlString } = require('libxmljs');
const winapi = require('winapi-bindings');

const appUni = app || remote.app;

const ADDINS_FILE = 'AddIns.xml';
const STEAM_ID = 17450;
const STEAM_ID_ULTIMATE_EDITION = 47810;

// Static variables to store paths we resolve using appUni.
let _ADDINS_PATH = undefined;
let _MODS_PATH = undefined;

let _APPID;
function findGame() {
  return util.GameStoreHelper.findByAppId([STEAM_ID.toString(), STEAM_ID_ULTIMATE_EDITION.toString()])
    .then(game => {
      _APPID = game.appid;
      return Promise.resolve(game.gamePath);
    })
    .catch(err => {
      try {
        const instPath = winapi.RegGetValue(
          'HKEY_LOCAL_MACHINE',
          'Software\\Wow6432Node\\BioWare\\Dragon Age',
          'Path');
        if (!instPath) {
          throw new Error('empty registry key');
        }
        return Promise.resolve(instPath.value);
      } catch (err) {
        return Promise.reject(err);
      }
    })
}

function queryModPath() {
  if (_MODS_PATH === undefined) {
    _MODS_PATH = path.join(appUni.getPath('documents'), 'BioWare', 'Dragon Age', 'packages', 'core', 'override');
  }
  
  return _MODS_PATH;
}

function prepareForModding() {
  return fs.ensureDirWritableAsync(queryModPath())
    .then(() => fs.ensureDirAsync(path.join(appUni.getPath('documents'), 'BioWare', 'Dragon Age', 'AddIns')))
    .then(() => fs.ensureDirAsync(path.dirname(addinsPath())));
}

function addinsPath() {
  if (_ADDINS_PATH === undefined) {
    _ADDINS_PATH = path.join(appUni.getPath('documents'), 'Bioware', 'Dragon Age',
      'Settings', ADDINS_FILE);
  }

  return _ADDINS_PATH;
}

const emptyAddins = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AddInsList></AddInsList>`;

function test(game) {
  if (game.id !== 'dragonage') {
    return undefined;
  }

  return {
    baseFiles: () => [
      {
        in: addinsPath(),
        out: path.join('Settings', ADDINS_FILE),
      },
    ],
    filter: filePath => path.basename(filePath).toLowerCase() === 'manifest.xml',
  };
}

function requiresLauncher(gamePath) {
  // Steam installation would include DAOU_UpdateAddinsXML_Steam.exe so it's
  //  safe to assume that if we find this file - we need the launcher.
  const gameRoot = gamePath.substring(0, gamePath.lastIndexOf(path.sep));
  return fs.statAsync(path.join(gameRoot, 'redist', 'DAOU_UpdateAddinsXML_Steam.exe'))
    .then(() => Promise.resolve({ launcher: 'steam', addInfo: _APPID }))
    .catch(err => Promise.resolve(undefined));
}

function merge(filePath, mergeDir) {
  let manifest;
  return fs.readFileAsync(filePath)
      .then(xmlData => {
        try {
          manifest = parseXmlString(xmlData);
        } catch (err) {
          return Promise.reject(new util.ProcessCanceled(`File invalid "${filePath}"`));
        }
        return Promise.resolve();
      })
      .then(() => readAddinsData(mergeDir))
      .then(addinsData => new Promise((resolve, reject) => {
        try  {
          resolve(parseXmlString(addinsData));
        } catch (err) {
          resolve(parseXmlString(emptyAddins));
        }
      }))
      .then(addins => {
        const list = addins.get('//AddInsList');
        if (list === undefined) {
          return Promise.reject(new util.ProcessCanceled(`Addins file is invalid - "${path.join(mergeDir, 'Settings', ADDINS_FILE)}"`));
        }

        manifest.find('//Manifest/AddInsList/AddInItem').forEach(item => {
          list.addChild(item);
        });
        const destPath = path.join(mergeDir, 'Settings');
        return fs.ensureDirAsync(destPath)
          .then(() => fs.writeFileAsync(path.join(destPath, ADDINS_FILE),
            addins.toString(), { encoding: 'utf-8' }))
      });
}

function readAddinsData(mergeDir) {
  return fs.readFileAsync(path.join(mergeDir, 'Settings', ADDINS_FILE))
    .catch(err => (err.code === 'ENOENT')
      ? fs.readFileAsync(addinsPath()).catch(err => emptyAddins)
      : Promise.reject(err)
    );
}

function main(context) {
  context.requireExtension('modtype-dragonage');
  context.registerGame({
    id: 'dragonage',
    name: 'Dragon Age: Origins',
    mergeMods: true,
    requiresLauncher,
    queryPath: findGame,
    queryModPath,
    logo: 'gameart.jpg',
    executable: () => 'bin_ship/daorigins.exe',
    setup: prepareForModding,
    requiredFiles: [
      'bin_ship/daorigins.exe',
    ],
    details: {
      steamAppId: STEAM_ID,
    },
  });
  context.registerMerge(test, merge, 'dazip');

  return true;
}

module.exports = {
  default: main,
};
