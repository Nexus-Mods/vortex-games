/* eslint-disable */
import * as path from 'path';
import * as semver from 'semver';
import { actions, types, selectors, log, util } from 'vortex-api';
import { DEBUG, MOD_TYPE_LSLIB, GAME_ID } from './common';

export function getGamePath(api): string {
  const state = api.getState();
  return state.settings.gameMode.discovered?.[GAME_ID]?.path as string;
}

export function getGameDataPath(api) {
  const state = api.getState();
  const gamePath = state.settings.gameMode.discovered?.[GAME_ID]?.path;
  if (gamePath !== undefined) {
    return path.join(gamePath, 'Data');
  } else {
    return undefined;
  }
}

export function documentsPath() {
  return path.join(util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}

export function modsPath() {
  return path.join(documentsPath(), 'Mods');
}

export function profilesPath() {
  return path.join(documentsPath(), 'PlayerProfiles');
}

export function globalProfilePath() {
  return path.join(documentsPath(), 'global');
}

const resolveMeta = (metadata?: any) => {
  return (metadata !== undefined)
    ? typeof metadata === 'string'
      ? metadata
      : JSON.stringify(metadata)
    : undefined;
}

export function logError(message: string, metadata?: any) {
  const meta = resolveMeta(metadata);
    log('debug', message, meta);
}

export function logDebug(message: string, metadata?: any) {
  if (DEBUG) {
    // so meta
    const meta = resolveMeta(metadata);
    log('debug', message, meta);
  }
}

export function forceRefresh(api: types.IExtensionApi) {
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  const action = {
    type: 'SET_FB_FORCE_UPDATE',
    payload: {
      profileId,
    },
  };
  api.store.dispatch(action);
}

export function getLatestInstalledLSLibVer(api: types.IExtensionApi) {
  const state = api.getState();
  const mods: { [modId: string]: types.IMod } =
    util.getSafe(state, ['persistent', 'mods', GAME_ID], {});

  return Object.keys(mods).reduce((prev, id) => {
    if (mods[id].type === 'bg3-lslib-divine-tool') {
      const arcId = mods[id].archiveId;
      const dl: types.IDownload = util.getSafe(state,
        ['persistent', 'downloads', 'files', arcId], undefined);
      const storedVer = util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');

      try {
        if (semver.gt(storedVer, prev)) {
          prev = storedVer;
        }
      } catch (err) {
        log('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
      }

      if (dl !== undefined) {
        // The LSLib developer doesn't always update the version on the executable
        //  itself - we're going to try to extract it from the archive which tends
        //  to use the correct version.
        const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
        const idx = fileName.indexOf('-v');
        try {
          const ver = semver.coerce(fileName.slice(idx + 2)).version;
          if (semver.valid(ver) && ver !== storedVer) {
            api.store.dispatch(actions.setModAttribute(GAME_ID, id, 'version', ver));
            prev = ver;
          }
        } catch (err) {
          // We failed to get the version... Oh well.. Set a bogus version since
          //  we clearly have lslib installed - the update functionality should take
          //  care of the rest (when the user clicks the check for updates button)
          api.store.dispatch(actions.setModAttribute(GAME_ID, id, 'version', '1.0.0'));
          prev = '1.0.0';
        }
      }
    }
    return prev;
  }, '0.0.0');
}

export function getLatestLSLibMod(api: types.IExtensionApi) {
  const state = api.getState();
  const mods: { [modId: string]: types.IMod } = state.persistent.mods[GAME_ID];
  if (mods === undefined) {
    log('warn', 'LSLib is not installed');
    return undefined;
  }
  const lsLib: types.IMod = Object.keys(mods).reduce((prev: types.IMod, id: string) => {
    if (mods[id].type === MOD_TYPE_LSLIB) {
      const latestVer = util.getSafe(prev, ['attributes', 'version'], '0.0.0');
      const currentVer = util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
      try {
        if (semver.gt(currentVer, latestVer)) {
          prev = mods[id];
        }
      } catch (err) {
        log('warn', 'invalid mod version', { modId: id, version: currentVer });
      }
    }
    return prev;
  }, undefined);

  if (lsLib === undefined) {
    log('warn', 'LSLib is not installed');
    return undefined;
  }

  return lsLib;
}