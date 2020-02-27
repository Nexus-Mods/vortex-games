const Promise = require('bluebird');
const path = require('path');
const { fs, log, util } = require('vortex-api');
const { runPatcher } = require('harmony-patcher');
const semver = require('semver');

const DATAPATH = path.join('Untitled_Data', 'Managed')
const ENTRY_POINT = 'GameManager::Awake';
const EPIC_APP_ID = 'Flour';

const GAME_ID = 'untitledgoosegame';

function requiresLauncher() {
  return util.epicGamesLauncher.isGameInstalled(EPIC_APP_ID)
    .then(epic => epic
      ? { launcher: 'epic', addInfo: EPIC_APP_ID }
      : undefined);
}

function findGame() {
  return util.epicGamesLauncher.findByAppId(EPIC_APP_ID)
    .then(epicEntry => epicEntry.gamePath);
}

function modPath() {
  return path.join(DATAPATH, 'VortexMods');
}

function getDiscoveryPath(state) {
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if ((discovery === undefined) || (discovery.path === undefined)) {
    log('debug', 'untitledgoosegame was not discovered');
    return undefined;
  }

  return discovery.path;
}

function prepareForModding(discovery) {
  const absPath = path.join(discovery.path, DATAPATH);
  return fs.ensureDirWritableAsync(path.join(absPath, 'VortexMods'), () => Promise.resolve());
}

function migrate010(api, oldVersion) {
  if (semver.gte(oldVersion, '0.1.0')) {
    return Promise.resolve();
  }

  const state = api.store.getState();
  const discoveryPath = getDiscoveryPath(state);
  if (discoveryPath === undefined) {
    // Game was not discovered, this is a valid use case.
    //  User might not own the game.
    return Promise.resolve();
  }

  const absPath = path.join(discoveryPath, DATAPATH);
  const assemblyPath = path.join(absPath, 'VortexHarmonyInstaller.dll');
  // Test if the patch exists and remove it, if it is.
  return fs.statAsync(assemblyPath)
    .then(() => runPatcher(__dirname, absPath, ENTRY_POINT, true))
    .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Untitled Goose Game',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    requiresLauncher,
    logo: 'gameart.jpg',
    executable: () => 'Untitled.exe',
    requiredFiles: [
      'Untitled.exe',
      'UnityPlayer.dll',
    ],
    details: {
      harmonyPatchDetails: {
        dataPath: DATAPATH,
        entryPoint: ENTRY_POINT,
        modsPath: modPath(),
        injectVIGO: true,
      },
    },
    setup: prepareForModding,
  });

  context.registerMigration(old => migrate010(context.api, old));

  return true;
}

module.exports = {
  default: main,
};
