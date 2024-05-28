/* eslint-disable */
import Bluebird from 'bluebird';
import { fs, log, types, selectors, util } from 'vortex-api';

import IniStructure from './iniParser';

import path from 'path';

import { getMergedModNames } from './mergeInventoryParsing';

import turbowalk, { IEntry, IWalkOptions } from 'turbowalk';

import { GAME_ID, LOCKED_PREFIX, I18N_NAMESPACE, UNI_PATCH, ACTIVITY_ID_IMPORTING_LOADORDER } from './common';
import { IDeployedFile, IDeployment } from './types';

export async function getDeployment(api: types.IExtensionApi,
  includedMods?: string[]): Promise<IDeployment> {
  const state = api.getState();
  const discovery = util.getSafe(state,
    ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  const game = util.getGame(GAME_ID);
  if ((game === undefined) || (discovery?.path === undefined)) {
    log('error', 'game is not discovered', GAME_ID);
    return undefined;
  }

  const mods: { [modId: string]: types.IMod } = util.getSafe(state,
    ['persistent', 'mods', GAME_ID], {});

  const installationDirectories = Object.values(mods)
    .filter(mod => (includedMods !== undefined)
      ? includedMods.includes(mod.id)
      : true)
    .map(mod => mod.installationPath);

  const filterFunc = (file: IDeployedFile) => installationDirectories.includes(file.source);

  const modPaths: { [typeId: string]: string } = game.getModPaths(discovery.path);
  const modTypes = Object.keys(modPaths).filter(key => !!modPaths[key]);
  const deployment: IDeployment = await modTypes.reduce(async (accumP, modType) => {
    const accum = await accumP;
    try {
      const manifest: types.IDeploymentManifest = await util.getManifest(api, modType, GAME_ID);
      accum[modType] = manifest.files.filter(filterFunc);
    } catch (err) {
      log('error', 'failed to get manifest', err);
    }
    return accum;
  }, {});

  return deployment;
}

export const getDocumentsPath = (game: types.IGame) => {
  return path.join(util.getVortexPath('documents'), 'The Witcher 3')
}

export const getDLCPath = (api: types.IExtensionApi) => {
  return (game: types.IGame) => {
    const state = api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return path.join(discovery.path, 'DLC');
  }
};

export const getTLPath = ((api: types.IExtensionApi) => {
  return (game: types.IGame) => {
    const state = api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return discovery.path;
  }
});

export const isTW3 = (api: types.IExtensionApi) => {
  return (gameId: string) => {
    if (gameId !== undefined) {
      return (gameId === GAME_ID);
    }
    const state = api.getState();
    const gameMode = selectors.activeGameId(state);
    return (gameMode === GAME_ID);
  }
};

export function notifyMissingScriptMerger(api) {
  const notifId = 'missing-script-merger';
  api.sendNotification({
    id: notifId,
    type: 'info',
    message: api.translate('Witcher 3 script merger is missing/misconfigured',
      { ns: I18N_NAMESPACE }),
    allowSuppress: true,
    actions: [
      {
        title: 'More',
        action: () => {
          api.showDialog('info', 'Witcher 3 Script Merger', {
            bbcode: api.translate('Vortex is unable to resolve the Script Merger\'s location. The tool needs to be downloaded and configured manually. '
              + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]Find out more about how to configure it as a tool for use in Vortex.[/url][br][/br][br][/br]'
              + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: I18N_NAMESPACE }),
          }, [
            {
              label: 'Cancel', action: () => {
                api.dismissNotification('missing-script-merger');
              }
            },
            {
              label: 'Download Script Merger', action: () => util.opn('https://www.nexusmods.com/witcher3/mods/484')
                .catch(err => null)
                .then(() => api.dismissNotification('missing-script-merger'))
            },
          ]);
        },
      },
    ],
  });
}

export async function findModFolders(installationPath: string, mod: types.IMod): Promise<string[]> {
  if (!installationPath || !mod?.installationPath) {
    const errMessage = !installationPath
      ? 'Game is not discovered'
      : 'Failed to resolve mod installation path';
    return Promise.reject(new Error(errMessage));
  }

  const expectedModNameLocation = ['witcher3menumodroot', 'witcher3tl'].includes(mod.type)
    ? path.join(installationPath, mod.installationPath, 'Mods')
    : path.join(installationPath, mod.installationPath);
  const entries = await fs.readdirAsync(expectedModNameLocation);
  const validEntries = [];
  for (const entry of entries) {
    const stats = await fs.statAsync(path.join(expectedModNameLocation, entry)).catch(err => null);
    if (stats?.isDirectory()) {
      validEntries.push(entry);
    }
  }

  return (validEntries.length > 0)
    ? Promise.resolve(validEntries)
    : Promise.reject(new Error('Failed to find mod folder'));
}

export async function getManagedModNames(api: types.IExtensionApi, mods: types.IMod[]): Promise<{ name: string, id: string }[]> {
  const installationPath = selectors.installPathForGame(api.getState(), GAME_ID);
  return mods.reduce(async (accumP, mod) => {
    const accum = await accumP;
    let folderNames = [];
    try {
      if (!folderNames || ['collection', 'w3modlimitpatcher'].includes(mod.type)) {
        return Promise.resolve(accum);
      }
      folderNames = await findModFolders(installationPath, mod);
      for (const component of folderNames) {
        accum.push({ id: mod.id, name: component });
      }
    } catch (err) {
      log('error', 'unable to resolve mod name', err);
    }
    return Promise.resolve(accum);
  }, Promise.resolve([]));
}

export async function getAllMods(api: types.IExtensionApi) {
  // Mod types we don't want to display in the LO page
  const invalidModTypes = ['witcher3menumoddocuments', 'collection'];
  const state = api.getState();
  const profile = selectors.activeProfile(state);
  if (profile?.id === undefined) {
    return Promise.resolve({
      merged: [],
      manual: [],
      managed: [],
    });
  }
  const modState = util.getSafe(state, ['persistent', 'profiles', profile.id, 'modState'], {});
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});

  // Only select mods which are enabled, and are not a menu mod.
  const enabledMods = Object.keys(modState).filter(key =>
    (!!mods[key] && modState[key].enabled && !invalidModTypes.includes(mods[key].type)));

  const mergedModNames = await getMergedModNames(api);
  const manuallyAddedMods = await getManuallyAddedMods(api);
  const managedMods = await getManagedModNames(api, enabledMods.map(key => mods[key]));
  return Promise.resolve({
    merged: mergedModNames,
    manual: manuallyAddedMods.filter(mod => !mergedModNames.includes(mod)),
    managed: managedMods,
  });
}

export async function getManuallyAddedMods(api: types.IExtensionApi) {
  const state = api.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if (discovery?.path === undefined) {
    // How/why are we even here ?
    return Promise.reject(new util.ProcessCanceled('Game is not discovered!'));
  }
  const ini = await IniStructure.getInstance().ensureModSettings();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const modKeys = Object.keys(mods);
  const iniEntries = Object.keys(ini.data);
  const manualCandidates = [].concat(iniEntries).filter(entry => {
    const hasVortexKey = util.getSafe(ini.data[entry], ['VK'], undefined) !== undefined;
    return ((!hasVortexKey) || (ini.data[entry].VK === entry) && !modKeys.includes(entry));
  });
  const uniqueCandidates = new Set(new Set(manualCandidates));
  const modsPath = path.join(discovery.path, 'Mods');
  const candidates = Array.from(uniqueCandidates);
  const validCandidates = await candidates.reduce(async (accumP, mod) => {
    const accum = await accumP;
    const modFolder = path.join(modsPath, mod);
    const exists = fs.statAsync(path.join(modFolder)).then(() => true).catch(() => false);
    if (!exists) {
      return Promise.resolve(accum);
    }

    // Ok, we know the folder is there - lets ensure that
    //  it actually contains files.
    try {
      const entries = await walkPath(modFolder, { skipHidden: true, skipLinks: true });
      if (entries.length > 0) {
        const files = entries.filter(entry => !entry.isDirectory
          && (path.extname(path.basename(entry.filePath)) !== '')
          && (entry?.linkCount === undefined || entry.linkCount <= 1));
        if (files.length > 0) {
          accum.push(mod);
        }
      }
    } catch (err) {
      if (!['ENOENT', 'ENOTFOUND'].some(err.code)) {
        log('error', 'unable to walk path', err);
      }
      return Promise.resolve(accum);
    }
    return Promise.resolve(accum);
  }, Promise.resolve([]));
  return Promise.resolve(validCandidates);
}

export function isLockedEntry(modName: string) {
  // We're adding this to avoid having the load order page
  //  from not loading if we encounter an invalid mod name.
  if (!modName || typeof (modName) !== 'string') {
    log('debug', 'encountered invalid mod instance/name');
    return false;
  }
  return modName.startsWith(LOCKED_PREFIX);
}

export function determineExecutable(discoveredPath: string): string {
  if (discoveredPath !== undefined) {
    try {
      fs.statSync(path.join(discoveredPath, 'bin', 'x64_DX12', 'witcher3.exe'));
      return 'bin/x64_DX12/witcher3.exe';
    } catch (err) {
      // nop, use fallback
    }
  }
  return 'bin/x64/witcher3.exe';
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

export async function walkPath(dirPath: string, walkOptions?: IWalkOptions): Promise<IEntry[]> {
  walkOptions = walkOptions || { skipLinks: true, skipHidden: true, skipInaccessible: true };
  // We REALLY don't care for hidden or inaccessible files.
  walkOptions = { ...walkOptions, skipHidden: true, skipInaccessible: true, skipLinks: true };
  const walkResults: IEntry[] = [];
  return new Promise<IEntry[]>(async (resolve, reject) => {
    await turbowalk(dirPath, (entries: IEntry[]) => {
      walkResults.push(...entries);
      return Promise.resolve() as any;
      // If the directory is missing when we try to walk it; it's most probably down to a collection being
      //  in the process of being installed/removed. We can safely ignore this.
    }, walkOptions).catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
    return resolve(walkResults);
  });
}

export function validateProfile(profileId: string, state: types.IState) {
  const activeProfile = selectors.activeProfile(state);
  const deployProfile = selectors.profileById(state, profileId);
  if (!!activeProfile && !!deployProfile && (deployProfile.id !== activeProfile.id)) {
    return undefined;
  }

  if (activeProfile?.gameId !== GAME_ID) {
    return undefined;
  }

  return activeProfile;
};

export function suppressEventHandlers(api: types.IExtensionApi) {
  // This isn't cool, but meh.
  const state = api.getState();
  return (state.session.notifications.notifications.some(n => n.id === ACTIVITY_ID_IMPORTING_LOADORDER));
}

export function toBlue<T>(func: (...args: any[]) => Promise<T>): (...args: any[]) => Bluebird<T> {
  return (...args: any[]) => Bluebird.resolve(func(...args));
}
