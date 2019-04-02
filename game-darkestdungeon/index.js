const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { parseXmlString } = require('libxmljs');
const { fs, log, util } = require('vortex-api');

let _GAME_MODS_FOLDER;
const _DIRECTORY_STRUCT = [];

const GOG_ID = '1450711444';
const STEAM_ID = '262060';

// Nexus Mods id for the game.
const GAME_ID = 'darkestdungeon';

// We expect mods to have the project.xml file included.
const PROJECT_FILE = 'project.xml';

const PROJECT_TEMPLATE =
`<?xml version="1.0" encoding="utf-8"?>
<project>
    <PreviewIconFile>preview_icon.png</PreviewIconFile>
    <ItemDescriptionShort/>
    <ModDataPath>{{modPath}}</ModDataPath>
    <Title>{{title}}</Title>
    <Language>english</Language>
    <UpdateDetails/>
    <Visibility>public</Visibility>
    <UploadMode>direct_upload</UploadMode>
    <VersionMajor>1</VersionMajor>
    <VersionMinor>0</VersionMinor>
    <TargetBuild>0</TargetBuild>
    <Tags>
    </Tags>
    <ItemDescription>{{description}}</ItemDescription>
</project>`

function walkAsync(dir, gamePathIndex) {
  if(path.relative(dir, _GAME_MODS_FOLDER) === 'mods') {
    gamePathIndex = dir.length + 1;
  }
  return fs.readdirAsync(dir).then(files => {
    return Promise.map(files, file => {
      const fullPath = path.join(dir, file);
      return fs.statAsync(fullPath).then(stats => {
        if (stats.isDirectory()) {
          _DIRECTORY_STRUCT.push(fullPath.substr(gamePathIndex));
          return walkAsync(fullPath, gamePathIndex)
            .then(dirs => {
              _DIRECTORY_STRUCT.concat(dirs);
              return Promise.resolve();
            })
        } else {
          return Promise.resolve()
        }
      })
    })
    .then(() => Promise.resolve(_DIRECTORY_STRUCT));
  });
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
  return walkAsync(discovery.path, 0)
    .then(() => fs.ensureDirWritableAsync(_GAME_MODS_FOLDER,
      () => Promise.resolve()))
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

function writeProjectFile(projectFilePath, title, modPath, description) {
  let projectFile = PROJECT_TEMPLATE.replace('{{title}}', title);
  projectFile = projectFile.replace('{{modPath}}', modPath);
  projectFile = projectFile.replace('{{description}}', description);
  return fs.writeFileAsync(projectFilePath, projectFile, { encoding: 'utf-8' });
}

function installProject(files, destinationPath) {
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

function testSupportedProject(files, gameId) {
  if (process.platform !== 'win32') {
    // Windows only for now.
    return Promise.resolve({supported: false, requiredFiles: []});
  }

  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === PROJECT_FILE) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function testSupportedNoProject(files, gameId) {
  if ((process.platform !== 'win32')
    || (files.find(file => path.basename(file) === PROJECT_FILE) !== undefined)) {
    // - We only support Windows for now due to the executable location.
    // - Ensure we don't have a project file.
    return Promise.resolve({supported: false, requiredFiles: []});
  }

  const filtered = files.filter(file => file.endsWith(path.sep));
  const supported = (gameId === GAME_ID)
    && (filtered.find(file =>
      _DIRECTORY_STRUCT.find(dir =>
        file.indexOf(dir) !== -1) !== undefined) !== undefined);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installNoProject(files, destinationPath) {
  // Ignore files that aren't in the expected directory structure.
  const dirStructure = files.filter(file => _DIRECTORY_STRUCT.find(dir => file.indexOf(dir) !== -1) !== undefined);
  const diff = files.filter(file => !dirStructure.includes(file));
  if (diff.length > 0) {
    log('warn', 'darkestdungeon - discarded files:', diff.join(' - '));
  }
  const modName = path.basename(destinationPath, '.installing')
    .replace(/[^A-Za-z]/g, '');
  const expectedModPath = path.join(_GAME_MODS_FOLDER, modName);
  return writeProjectFile(path.join(destinationPath, PROJECT_FILE), modName, expectedModPath, 'Mod installed with Vortex')
    .then(() => {
      dirStructure.push(PROJECT_FILE);
      // Remove directories and anything that isn't in the rootPath.
      const filtered = dirStructure.filter(file =>
        (!file.endsWith(path.sep)));

      const instructions = filtered.map(file => {
        return {
          type: 'copy',
          source: file,
          destination: path.join(modName, file),
        };
      });

      return Promise.resolve({ instructions });
    })
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

  context.registerInstaller('dd-project-mod', 25, testSupportedProject, installProject);
  context.registerInstaller('dd-noproject-mod', 25, testSupportedNoProject, installNoProject);

  return true;
}

module.exports = {
  default: main,
};
