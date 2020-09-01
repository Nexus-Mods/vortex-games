const Promise = require('bluebird');
const { app, remote } = require('electron');
const path = require('path');
const { fs, selectors, util } = require('vortex-api');

const appUni = remote !== undefined ? remote.app : app;

const GAME_ID = 'battletech';
const APPID = 637090;

function findGame() {
  return util.steam.findByAppId(APPID.toString())
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'), () => Promise.resolve());
}

function gameExecutable() {
  return 'BattleTech.exe';
}

function modPath() {
  return path.join(appUni.getPath('documents'), 'My Games', 'BattleTech', 'mods');
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'BattleTech',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: gameExecutable,
    requiredFiles: [
      gameExecutable(),
      'BattleTechLauncher.exe',
    ],
    setup: prepareForModding,
    directoryCleaning: 'all',
    environment: {
      SteamAPPId: APPID.toString(),
    },
    details: {
      steamAppId: APPID,
    },
  });

  context.once(() => {
    context.api.onAsync('added-files', async (profileId, files) => {
      const state = context.api.store.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile.gameId !== GAME_ID) {
        // don't care about any other games
        return;
      }
      const game = util.getGame(GAME_ID);
      const discovery = selectors.discoveryByGame(state, GAME_ID);
      const modPaths = game.getModPaths(discovery.path);
      const installPath = selectors.installPathForGame(state, GAME_ID);

      await Promise.map(files, async entry => {
        // only act if we definitively know which mod owns the file
        if (entry.candidates.length === 1) {
          const mod = util.getSafe(state.persistent.mods, [GAME_ID, entry.candidates[0]], undefined);
          if (mod?.type === undefined) {
            // Mod no longer installed ?
            return Promise.resolve();
          }
          const relPath = path.relative(modPaths[mod.type ?? ''], entry.filePath);
          const targetPath = path.join(installPath, mod.id, relPath);
          // copy the new file back into the corresponding mod, then delete it. That way, vortex will
          // create a link to it with the correct deployment method and not ask the user any questions
          await fs.ensureDirAsync(path.dirname(targetPath));
          await fs.copyAsync(entry.filePath, targetPath);
          await fs.removeAsync(entry.filePath);
        }
      });
    });
  });

  return true;
}

module.exports = {
  default: main,
};
