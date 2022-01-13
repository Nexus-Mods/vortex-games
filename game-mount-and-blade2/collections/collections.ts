import { selectors, types, util } from 'vortex-api';

import { GAME_ID } from '../common';

import { ILoadOrder } from '../types';
import { ICollectionsData  } from './types';

import { exportLoadOrder, importLoadOrder } from './loadOrder';

import { CollectionParseError } from './collectionUtil';

export async function genCollectionsData(context: types.IExtensionContext,
                                         gameId: string,
                                         includedMods: string[]) {
  const api = context.api;
  const state = api.getState();
  const profile = selectors.activeProfile(state);
  const mods: { [modId: string]: types.IMod } = util.getSafe(state,
    ['persistent', 'mods', gameId], {});
  try {
    const loadOrder: ILoadOrder = await exportLoadOrder(api.getState(), includedMods, mods);
    const collectionData: ICollectionsData = { loadOrder };
    return Promise.resolve(collectionData);
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function parseCollectionsData(context: types.IExtensionContext,
                                           gameId: string,
                                           collection: ICollectionsData) {
  const api = context.api;
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, gameId);
  const profile = selectors.profileById(state, profileId);
  if (profile?.gameId !== gameId) {
    const collectionName = collection['info']?.['name'] !== undefined ? collection['info']['name'] : 'Witcher 3 Collection';
    return Promise.reject(new CollectionParseError(collectionName,
      'Last active profile is missing'));
  }
  try {
    await importLoadOrder(api, collection);
  } catch (err) {
    return Promise.reject(err);
  }
}
