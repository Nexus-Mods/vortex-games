const { app, remote } = require('electron');
const path = require('path');
const { fs, log, util } = require('vortex-api');
const Registry = require('winreg');
const { parseXmlString } = require('libxmljs');

const appUni = app || remote.app;

function findGame() {
  if (Registry === undefined) {
    return null;
  }

  let regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\Wow6432Node\\BioWare\\Dragon Age',
  });

  return new Promise((resolve, reject) => {
    regKey.get('Path', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else if (result === null) {
        reject(new Error('empty registry key'));
      } else {
        resolve(result.value);
      }
    });
  });
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
    filter: filePath => path.basename(filePath) === 'Manifest.xml',
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
    executable: () => 'daorigins.exe',
    setup: prepareForModding,
    requiredFiles: [
      'daorigins.exe',
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
