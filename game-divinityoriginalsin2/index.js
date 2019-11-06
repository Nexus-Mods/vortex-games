const { app, remote } = require('electron');
const path = require('path');
const { selectors, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const GAME_ID = 'divinityoriginalsin2';
const GAME_ID_DE = 'divinityoriginalsin2definitiveedition';

const appUni = app || remote.app;

function modPath() {
  return path.join(appUni.getPath('documents'), 'Larian Studios', 'Divinity Original Sin 2', 'Mods');
}

function modPathDE() {
  return path.join(appUni.getPath('documents'), 'Larian Studios', 'Divinity Original Sin 2 Definitive Edition', 'Mods');
}

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\1584823040',
      'path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('Divinity: Original Sin 2')
      .then(game => game.gamePath);
  }
}

function isPak(file) {
  return path.extname(file.relPath).toLowerCase() === '.pak';
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Divinity: Original Sin 2\tOriginal Edition',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: () => 'bin/SupportTool.exe',
    requiredFiles: [
      'bin/SupportTool.exe',
    ],
    environment: {
      SteamAPPId: '435150',
    },
    details: {
      steamAppId: 435150,
    }
  });

  context.registerGame({
    id: GAME_ID_DE,
    name: 'Divinity: Original Sin 2\tDefinitive Edition',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: modPathDE,
    logo: 'gameartDE.png',
    executable: () => 'DefEd/bin/SupportTool.exe',
    requiredFiles: [
      'DefEd/bin/SupportTool.exe',
    ],
    environment: {
      SteamAPPId: '435150',
    },
    details: {
      steamAppId: 435150,
    }
  });

  context.once(() => {
    let previouslyDeployed;
    context.api.onAsync('will-deploy', (profileId, deployment) => {
      const state = context.api.store.getState();
      const profile = selectors.profileById(state, profileId);
      if ([GAME_ID, GAME_ID_DE].indexOf(profile.gameId) === -1) {
        return Promise.resolve();
      }
      previouslyDeployed = new Set(deployment[''].filter(isPak).map(iter => iter.relPath));
      return Promise.resolve();
    })
    context.api.onAsync('did-deploy', (profileId, deployment) => {
      const state = context.api.store.getState();
      const profile = selectors.profileById(state, profileId);

      if ([GAME_ID, GAME_ID_DE].indexOf(profile.gameId) === -1) {
        return Promise.resolve();
      }

      const paks = deployment[''].filter(isPak).map(iter => iter.relPath);
      const added = paks.filter(iter => !previouslyDeployed.has(iter));
      if (added.length > 0) {
        context.api.sendNotification({
          type: 'info',
          id: 'dos2-enable-mods',
          icon: 'attention-required',
          message: 'Please remember to enable mods in-game',
          displayMS: 5000,
        });
      }
      return Promise.resolve();
    });
  });

  return true;
}

module.exports = {
  default: main
};
