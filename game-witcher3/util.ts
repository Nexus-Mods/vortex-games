import { log, types, util } from 'vortex-api';

import { GAME_ID } from './common';

import { IDeployment } from './types';

export async function getDeployment(api: types.IExtensionApi): Promise<IDeployment> {
  const state = api.getState();
  const discovery = util.getSafe(state,
    ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  const game = util.getGame(GAME_ID);
  if ((game === undefined) || (discovery?.path === undefined)) {
    log('error', 'game is not discovered', GAME_ID);
    return undefined;
  }

  const modPaths: { [typeId: string]: string } = game.getModPaths(discovery.path);
  const modTypes = Object.keys(modPaths).filter(key => !!modPaths[key]);
  const deployment: IDeployment = await modTypes.reduce(async (accumP, modType) => {
    const accum = await accumP;
    try {
      const manifest: types.IDeploymentManifest = await util.getManifest(api, modType, GAME_ID);
      accum[modType] = manifest.files;
    } catch (err) {
      log('error', 'failed to get manifest', err);
    }
    return accum;
  }, {});

  return deployment;
}
