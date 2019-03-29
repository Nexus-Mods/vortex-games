const path = require('path');
const winapi = require('winapi-bindings');
const { parseXmlString } = require('libxmljs');
const { fs, util } = require('vortex-api');

let _GAME_MODS_FOLDER;

const GOG_ID = '1450711444';
const STEAM_ID = '262060';

// Nexus Mods id for the game.
const GAME_ID = 'darkestdungeon';

// We expect mods to have the project.xml file included.
const PROJECT_FILE = 'project.xml';

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

function findGame() {
  return util.steam.findByAppId(STEAM_ID)
    .then(game => game.gamePath)
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'))
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'))
}

function prepareForModding(discovery) {
  if (_GAME_MODS_FOLDER === undefined) {
    _GAME_MODS_FOLDER = path.join(discovery.path, 'mods');
  }
  return fs.ensureDirWritableAsync(_GAME_MODS_FOLDER,
    () => Promise.resolve());
}

function setModDataPath(projectFilePath, modPath) {
  let projectData;
  return fs.readFileAsync(projectFilePath)
    .then(xmlData => {
      try {
        projectData = parseXmlString(xmlData);
      } catch (err) {
        return Promise.reject(new util.DataInvalid('Failed to parse project file.'))
      }

      const modDataPath = projectData.get('//ModDataPath');
      modDataPath.text(modPath);
      return fs.writeFileAsync(projectFilePath, projectData.toString(), { encoding: 'utf-8' });
    })
}

function installContent(files, destinationPath) {
  const projectFile = files.find(file => path.basename(file).toLowerCase() === PROJECT_FILE);
  const idx = projectFile.indexOf(path.basename(projectFile));
  const rootPath = path.dirname(projectFile);
  const modName = path.basename(destinationPath, '.installing')
    .replace(/[^A-Za-z]/g, '');
  const expectedModPath = path.join(_GAME_MODS_FOLDER, modName);
  return setModDataPath(path.join(destinationPath, projectFile), expectedModPath)
    .then(() => {
      // Remove directories and anything that isn't in the rootPath.
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
    })
}

function testSupportedContent(files, gameId) {
  if (process.platform !== 'win32') {
    // Windows only for now.
    return Promise.reject(new util.UnsupportedOperatingSystem())
  }

  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === PROJECT_FILE) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Darkest Dungeon',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'mods',
    logo: 'gameart.png',
    executable: () => '_windows/Darkest.exe',
    requiredFiles: [
      '_windows/Darkest.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: parseInt(STEAM_ID),
    },
  });

  context.registerInstaller('darkestdungeon-mod', 25, testSupportedContent, installContent);

  return true;
}

module.exports = {
  default: main,
};
