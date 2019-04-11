const Promise = require('bluebird');
const opn = require('opn');
const path = require('path');
const winapi = require('winapi-bindings');
const { app, remote } = require('electron');
const { actions, fs, util } = require('vortex-api');

const uniApp = app || remote.app;

let _API;
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
  queryPath: findUnityModManager,
  executable: () => 'UnityModManager.exe',
  requiredFiles: ['UnityModManager.exe'],
  relative: true,
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
    .then(value => fs.statAsync(value)
      .then(() => Promise.resolve(value))
      .catch(() => fs.statAsync(ummPath))
      .then(() => Promise.resolve(ummPath)));
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
        message: 'Most Dawn of Man mods require "Unity Mod Manager" to be installed to run correctly.\n'
               + 'Simpler "Scenario" mods can be used without UMM.'
      },
      [
        { label: 'Continue', action: () => resolve() },
        { label: 'Go to UMM page', action: () => {
          opn('https://www.nexusmods.com/site/mods/21/').catch(err => undefined);
          // We want to go forward even if UMM is not installed as the scenario modType
          //  can be installed without UMM.
          resolve();
        }},
      ]));
  });

  // UMM's dll path when installed using Vortex.
  const unityModManagerDllPath = path.join(discovery.path, 'UnityModManager', UMM_DLL);

  return fs.ensureDirWritableAsync(SCENE_FOLDER, () => Promise.resolve())
    .then(() => fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'),
      () => Promise.resolve()))
    .then(() => findUnityModManager(unityModManagerDllPath))
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

function installUMM(files) {
  const dllFile = files.find(file => file.endsWith(UMM_DLL));
  const idx = dllFile.indexOf(UMM_DLL);
  const instructions = files.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    };
  })

  return Promise.resolve({ instructions });
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

  const getUMMPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return ((discovery === undefined) || (discovery.path === undefined))
      ? undefined
      : path.join(discovery.path, 'UnityModManager');
  };

  context.registerModType('dom-umm-modtype', 25,
    (gameId) => gameId === GAME_ID, getUMMPath,
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
