import { log, types, util } from 'vortex-api';

import { GAME_ID } from './common';

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
