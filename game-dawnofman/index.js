const Promise = require('bluebird');
const opn = require('opn');
const path = require('path');
const winapi = require('winapi-bindings');
const { app, remote } = require('electron');
const { actions, fs, util } = require('vortex-api');

const uniApp = app || remote.app;

let _API;
let _UMM_PATH;
const GAME_ID = 'dawnofman';
const STEAM_ID = 858810;
const GOG_ID = 1899257943;
const UMM_DLL = 'UnityModManager.dll';
const SCENE_FILE_EXT = '.scn.xml';
const UMM_MOD_INFO = 'Info.json';
const SCENE_FOLDER = path.join(uniApp.getPath('documents'), 'DawnOfMan', 'Scenarios');

const tools = [{
  id: 'UnityModManager',
  name: 'Unity Mod Manager',
  logo: 'umm.png',
  executable: () => 'UnityModManager.exe',
  requiredFiles: ['UnityModManager.exe'],
}]

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

function findUnityModManager(ummPath) {
  return readRegistryKey('HKEY_CURRENT_USER', 'Software\\UnityModManager', 'Path')
    .then(value => fs.statAsync(path.join(value, UMM_DLL))
    .then(() => {
      _UMM_PATH = value;
      return setUMMPath(value);
    })
    .catch(err => {
      return (ummPath !== undefined)
        ? fs.statAsync(path.join(ummPath, UMM_DLL))
        : Promise.reject(err);
    })
    .then(() => {
      _UMM_PATH = ummPath;
      return setUMMPath(ummPath);
    }));
}

function createUMMTool(ummPath, toolId) {
  _API.store.dispatch(actions.addDiscoveredTool(GAME_ID, toolId, {
    path: path.join(ummPath, 'UnityModManager.exe'),
    hidden: false,
    custom: false,
    workingDirectory: ummPath,
  }));

  return Promise.resolve();
}

function setUMMPath(resolvedPath) {
  const state = _API.store.getState();
  const tools = util.getSafe(state, ['settings', 'gameMode', 'dawnofman', 'tools'], undefined);

  if (tools !== undefined) {
    const UMM = (Object.keys(tools).map(key => tools[key]))
      .find(tool => tool.path.endsWith('UnityModManager.exe'));

    return (UMM !== undefined)
      ? ((UMM.path !== undefined) && (path.dirname(UMM.path) === resolvedPath))
        ? Promise.resolve()
        : createUMMTool(resolvedPath, UMM.id)
      : createUMMTool(resolvedPath, 'UnityModManager');
  } else {
    return createUMMTool(resolvedPath, 'UnityModManager');
  }
}

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath)
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'))
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'))
}

function prepareForModding(discovery) {
  const showUMMDialog = () => new Promise((resolve, reject) => {
    _API.store.dispatch(actions.showDialog('question', 'Action required',
      {
        message: 'Most Dawn of Man mods require Unity Mod Manager to be installed to run correctly.\n'
               + 'Once installed, UMM must be used to inject your mods into the game itself.\n'
               + 'For ease of use, UMM comes pre-added as a tool for Dawn of Man but you may have\n'
               + 'to configure it manually.\n'
               + 'For usage information and download link please see UMM\'s page.\n\n'
               + 'Please note: simpler "Scenario" mods can be used without UMM.'
      },
      [
        { label: 'Continue', action: () => resolve() },
        { label: 'More on Vortex Tools', action: () => {
          opn('https://wiki.nexusmods.com/index.php/Category:Tool_Setup')
            .then(() => showUMMDialog())
            .catch(err => undefined);
          resolve();
        }},
        { label: 'Go to UMM page', action: () => {
          opn('https://www.nexusmods.com/site/mods/21/').catch(err => undefined);
          // We want to go forward even if UMM is not installed as the scenario modType
          //  can be installed without UMM.
          resolve();
        }},
      ]));
  });

  // UMM's path when installed using Vortex.
  const unityModManagerPath = path.join(discovery.path, 'UnityModManager');

  return fs.ensureDirWritableAsync(SCENE_FOLDER, () => Promise.resolve())
    .then(() => fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'),
      () => Promise.resolve()))
    .then(() => findUnityModManager(unityModManagerPath))
    .catch(err => (err.code === 'ENOENT')
      ? showUMMDialog()
      : Promise.reject(err));
}

function endsWithPattern(instructions, pattern) {
  return Promise.resolve(instructions.find(inst => inst.source.endsWith(pattern)) !== undefined);
}

function installSceneMod(files, destinationPath) {
  const sceneFile = files.find(file => file.endsWith(SCENE_FILE_EXT));
  const idx = sceneFile.indexOf(path.basename(sceneFile));
  const modName = path.basename(destinationPath, '.installing')
    .replace(/[^A-Za-z]/g, '');

  const filtered = files.filter(file => !file.endsWith(path.sep))
  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join(modName, file.substr(idx)),
    };
  })

  return Promise.resolve({ instructions });
}

function installUMM(files, destinationPath) {
  const dirPath = path.dirname(destinationPath);
  const folderName = path.basename(destinationPath, '.installing');
  const dllFile = files.find(file => file.endsWith(UMM_DLL));
  const idx = dllFile.indexOf(UMM_DLL);
  const instructions = files.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    };
  })

  return createUMMTool(path.join(dirPath, folderName), 'UnityModManager')
    .then(() => Promise.resolve({ instructions }));
}

function installMod(files, destinationPath) {
  // The scene file is expected to be at the root of scene mods.
  const infoFile = files.find(file => file.endsWith(UMM_MOD_INFO));
  const idx = infoFile.indexOf(UMM_MOD_INFO);
  const rootPath = path.dirname(infoFile);
  const modName = path.basename(destinationPath, '.installing')
    .replace(/[^A-Za-z]/g, '');

  const filtered = files.filter(file => (!file.endsWith(path.sep))
    && (file.indexOf(rootPath) !== -1));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join(modName, file.substr(idx)),
    };
  });

  return Promise.resolve({ instructions });
}

function isSceneMod(files) {
  return files.find(file => file.endsWith(SCENE_FILE_EXT)) !== undefined;
}

function isUMMApp(files) {
  return files.find(file => file.toLowerCase().endsWith(UMM_DLL.toLowerCase())) !== undefined;
}

function isUMMMod(files) {
  return files.find(file => file.endsWith(UMM_MOD_INFO)) !== undefined;
}

function testSceneMod(files, gameId) {
  return Promise.resolve({
    supported: ((gameId === GAME_ID) && (isSceneMod(files))),
    requiredFiles: []
  });
}

function testUmmApp(files, gameId) {
  return Promise.resolve({
    supported: ((gameId === GAME_ID) && (isUMMApp(files))),
    requiredFiles: []
  });
}

function testMod(files, gameId) {
  return Promise.resolve({
    supported: ((gameId === GAME_ID) && (isUMMMod(files))),
    requiredFiles: []
  });
}

function main(context) {
  _API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: 'Dawn of Man',
    logo: 'gameart.png',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    executable: () => 'DawnOfMan.exe',
    requiredFiles: [],
    details: {
      steamAppId: STEAM_ID,
    },
    setup: prepareForModding,
    supportedTools: tools,
  });

  context.registerModType('dom-umm-modtype', 25,
    (gameId) => gameId === GAME_ID, () => _UMM_PATH,
    (instructions) => endsWithPattern(instructions, UMM_DLL));

  context.registerModType('dom-scene-modtype', 25,
    (gameId) => gameId === GAME_ID, () => SCENE_FOLDER,
    (instructions) => endsWithPattern(instructions, SCENE_FILE_EXT));

  context.registerInstaller('dom-umm-', 25, testUmmApp, installUMM);
  context.registerInstaller('dom-scene-installer', 25, testSceneMod, installSceneMod);
  context.registerInstaller('dom-mod', 25, testMod, installMod);
}

module.exports = {
  default: main
};
