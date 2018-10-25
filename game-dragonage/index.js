const { app, remote } = require('electron');
const path = require('path');
const { fs } = require('vortex-api');
const { parseXmlString } = require('libxmljs');
const winapi = require('winapi-bindings');

const appUni = app || remote.app;

function findGame() {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Currently only discovered on windows'));
  }
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
}

function queryModPath() {
  return path.join(appUni.getPath('documents'), 'BioWare', 'Dragon Age', 'packages', 'core', 'override');
}

function prepareForModding() {
  return fs.ensureDirAsync(queryModPath())
    .then(() => fs.ensureDirAsync(path.join(appUni.getPath('documents'), 'BioWare', 'Dragon Age', 'AddIns')))
    .then(() => fs.ensureDirAsync(path.dirname(addinsPath())));
}

function addinsPath() {
  return path.join(appUni.getPath('documents'), 'Bioware', 'Dragon Age',
                   'Settings', 'AddIns.xml');
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
        out: 'Addins.xml',
      },
    ],
    filter: filePath => path.basename(filePath).toLowerCase() === 'manifest.xml',
  };
}

function merge(filePath, mergeDir) {
  let manifest;
  return fs.readFileAsync(filePath)
      .then(xmlData => {
        manifest = parseXmlString(xmlData);
        return Promise.resolve();
      })
      .then(() => fs.readFileAsync(path.join(mergeDir, 'AddIns.xml')))
      .catch(err => (err.code === 'ENOENT')
          ? fs.readFileAsync(addinsPath()).catch(err => emptyAddins)
          : Promise.reject(err))
      .then(addinsData => new Promise((resolve, reject) => {
        try  {
          resolve(parseXmlString(addinsData));
        } catch (err) {
          resolve(parseXmlString(emptyAddins));
        }
      }))
      .then(addins => {
        const list = addins.get('//AddInsList');
        manifest.find('//Manifest/AddInsList/AddInItem').forEach(item => {
          list.addChild(item);
        });
        return fs.writeFileAsync(path.join(mergeDir, 'AddIns.xml'),
                                 addins.toString(), { encoding: 'utf-8' });
      });
}

function main(context) {
  context.requireExtension('modtype-dragonage');
  context.registerGame({
    id: 'dragonage',
    name: 'Dragon Age',
    mergeMods: true,
    queryPath: findGame,
    queryModPath,
    logo: 'gameart.png',
    executable: () => 'bin_ship/daorigins.exe',
    setup: prepareForModding,
    requiredFiles: [
      'bin_ship/daorigins.exe',
    ],
    details: {
      steamAppId: 17450,
    },
  });
  context.registerMerge(test, merge, 'dragonage-settings');

  return true;
}

module.exports = {
  default: main,
};
