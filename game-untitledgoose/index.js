const Promise = require('bluebird');
const path = require('path');
const { fs, log, selectors, util } = require('vortex-api');
const { runPatcher } = require('harmony-patcher');

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
  return util.epicGamesLauncher.findByName(EPIC_APP_ID)
    .then(epicEntry => epicEntry.gamePath);
}

function modPath() {
  return path.join(DATAPATH, 'VortexMods');
}

function getDiscoveryPath(state) {
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if ((discovery === undefined) || (discovery.path === undefined)) {
    log('error', 'untitledgoosegame was not discovered');
    return undefined;
  }

  return discovery.path;
}

function prepareForModding(discovery) {
  const absPath = path.join(discovery.path, DATAPATH);
  return runPatcher(__dirname, absPath, ENTRY_POINT, false)
    .then(() => fs.ensureDirWritableAsync(path.join(absPath, 'VortexMods'), () => Promise.resolve()));
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
    setup: prepareForModding,
  });

  const reportPatcherError = (err) => {
    context.api.showErrorNotification('Patcher encountered errors',
      'The patcher was unable to finish its operation "{{errorMsg}}"',
      { replace: { errorMsg: err } });
  };

  context.registerAction('mod-icons', 500, 'savegame', {}, 'Patcher - Remove', () => {
    const store = context.api.store;
    const state = store.getState();
    const gameMode = selectors.activeGameId(state);
    if (gameMode !== GAME_ID) {
      return false;
    }
    const dataPath = path.join(getDiscoveryPath(state), DATAPATH);
    runPatcher(__dirname, dataPath, ENTRY_POINT, true)
      .catch(err => reportPatcherError(err));
    return true;
  }, () => {
    const state = context.api.store.getState();
    const gameMode = selectors.activeGameId(state);
    return (gameMode === GAME_ID)
  });

  context.registerAction('mod-icons', 500, 'savegame', {}, 'Patcher - Add', () => {
    const store = context.api.store;
    const state = store.getState();
    const gameMode = selectors.activeGameId(state);
    if (gameMode !== GAME_ID) {
      return false;
    }
    const dataPath = path.join(getDiscoveryPath(state), DATAPATH);
    runPatcher(__dirname, dataPath, ENTRY_POINT, false)
      .catch(err => reportPatcherError(err));
    return true;
  }, () => {
    const state = context.api.store.getState();
    const gameMode = selectors.activeGameId(state);
    return (gameMode === GAME_ID)
  });

  return true;
}

module.exports = {
  default: main,
};
