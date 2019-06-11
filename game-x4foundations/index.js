const { app, remote } = require('electron');
const Promise = require('bluebird');
const { parseXmlString } = require('libxmljs');
const path = require('path');
const { fs, log, util } = require('vortex-api');
const Big = require('big.js');

const APPUNI = app || remote.app;
const STEAM_ID = 392160;
const GOG_ID = '1395669635';

let _STEAM_USER_ID = '';
let _STEAM_ENTRY;

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => {
      _STEAM_ENTRY = game;
      return Promise.resolve(game.gamePath);
    })
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'))
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'));
}

function readRegistryKey(hive, key, name) {
  try {
    const instPath = winapi.RegGetValue(hive, key, name);
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.resolve(undefined);
  }
}

function testSupported(files, gameId) {
  if (gameId !== 'x4foundations') {
    return Promise.resolve({ supported: false });
  }

  const contentPath = files.find(file => path.basename(file) === 'content.xml');
  return Promise.resolve({
    supported: contentPath !== undefined,
    requiredFiles: [ contentPath ],
  });
}

function install(files,
                 destinationPath,
                 gameId,
                 progressDelegate) {
  const contentPath = files.find(file => path.basename(file) === 'content.xml');
  const basePath = path.dirname(contentPath);

  let outputPath = basePath;

  return fs.readFileAsync(path.join(destinationPath, contentPath),
                          { encoding: 'utf8' })
      .then(data => {
        let parsed;
        try {
          parsed = parseXmlString(data);
        } catch (err) { 
          return Promise.reject(new util.DataInvalid('content.xml invalid: ' + err.message));
        }
        const attrInstructions = [];

        const getAttr = key => {
          try {
            return parsed.get('//content').attr(key).value();
          } catch (err) {
            log('info', 'attribute missing in content.xml',  { key });
          }
        }

        outputPath = getAttr('id');
        if (outputPath === undefined) {
          return Promise.reject(
              new util.DataInvalid('invalid or unsupported content.xml'));
        }
        attrInstructions.push({
          type: 'attribute',
          key: 'customFileName',
          value: getAttr('name').trim(),
        });
        attrInstructions.push({
          type: 'attribute',
          key: 'description',
          value: getAttr('description'),
        });
        attrInstructions.push({
          type: 'attribute',
          key: 'sticky',
          value: getAttr('save') === 'true',
        });
        attrInstructions.push({
          trype: 'attribute',
          key: 'author',
          value: getAttr('author'),
        });
        attrInstructions.push({
          type: 'attribute',
          key: 'version',
          value: getAttr('version'),
        });
        return Promise.resolve(attrInstructions);
      })
      .then(attrInstructions => {
        let instructions = attrInstructions.concat(
            files.filter(file => file.startsWith(basePath + path.sep) &&
                                 !file.endsWith(path.sep))
                .map(file => ({
                       type: 'copy',
                       source: file,
                       destination: path.join(
                           outputPath, file.substring(basePath.length + 1))
                     })));
        return { instructions };
      });
}

function steamUserId32Bit() {
  if (_STEAM_USER_ID !== '') {
    return _STEAM_USER_ID;
  }

  if ((_STEAM_ENTRY !== undefined) && (_STEAM_ENTRY.lastUser !== undefined)) {
    const id64Bit = new Big(_STEAM_ENTRY.lastUser);
    const id32Bit = id64Bit.mod(Big(2).pow(32));
    _STEAM_USER_ID = id32Bit.toFixed();
  }

  return _STEAM_USER_ID;
}

function queryModPath() {
  return (_STEAM_ENTRY !== undefined)
    ? path.join(APPUNI.getPath('documents'), 'Egosoft', 'X4', steamUserId32Bit(), 'extensions')
    : 'extensions';
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(queryModPath(),
    () => Promise.resolve());
}

function main(context) {
  context.registerGame({
    id: 'x4foundations',
    name: 'X4: Foundations',
    mergeMods: true,
    queryPath: findGame,
    queryModPath,
    logo: 'gameart.png',
    executable: () => 'X4.exe',
    setup: prepareForModding,
    requiredFiles: [
      'X4.exe',
    ],
    details: {
      steamAppId: STEAM_ID,
    },
  });

  context.registerInstaller('x4foundations', 50, testSupported, install);

  return true;
}

module.exports = {
  default: main,
};
