const Promise = require('bluebird');
const winapi = require('winapi-bindings');
const path = require('path');
const { fs, util } = require('vortex-api');
const { parseXmlString } = require('libxmljs');

const GAME_ID = '7daystodie';
const MOD_INFO = 'modinfo.xml';

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

function getModName(modInfoPath) {
  let modInfo;
  return fs.readFileAsync(modInfoPath)
    .then(xmlData => {
      try {
        modInfo = parseXmlString(xmlData);
        const modName = modInfo.get('//Name');
        return ((modName !== undefined) && (modName.attr('value').value() !== undefined))
          ? Promise.resolve(modName.attr('value').value())
          : Promise.reject(new util.DataInvalid('Unexpected modinfo.xml format'));
      } catch (err) {
        return Promise.reject(new util.DataInvalid('Failed to parse ModInfo.xml file'))
      }
    })
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  // The modinfo.xml file is expected to always be positioned in the root directory
  //  of the mod itself; we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.basename(file).toLowerCase() === MOD_INFO);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);
  return getModName(path.join(destinationPath, modFile))
    .then(modName => {
      modName = modName.replace(/[^a-zA-Z0-9]/g, '');

      // Remove directories and anything that isn't in the rootPath (also directories).
      const filtered = files.filter(file =>
        ((file.indexOf(rootPath) !== -1)
          && (!file.endsWith(path.sep))));

      const instructions = filtered.map(file => {
        return {
          type: 'copy',
          source: file,
          destination: path.join(modName, file.substr(idx)),
        };
      });

      return Promise.resolve({ instructions });
    });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === MOD_INFO) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'),
    () => Promise.resolve());
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: '7 Days to Die',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.png',
    executable: gameExecutable,
    requiredFiles: [
      '7DaysToDie.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 251570,
    },
  });

  context.registerInstaller('7dtd-mod', 25, testSupportedContent, installContent);

  return true;
}

module.exports = {
  default: main
};
