import { types, util } from 'vortex-api';
import { ILoadOrder, ILoadOrderEntry } from '../types';

import { OFFICIAL_MODULES } from '../common';

export class CollectionGenerateError extends Error {
  constructor(why: string) {
    super(`Failed to generate game specific data for collection: ${why}`);
    this.name = 'CollectionGenerateError';
  }
}

export class CollectionParseError extends Error {
  constructor(collectionName: string, why: string) {
    super(`Failed to parse game specific data for collection ${collectionName}: ${why}`);
    this.name = 'CollectionGenerateError';
  }
}

export function isValidMod(mod: types.IMod) {
  return (mod?.type !== 'collection');
}

export function isModInCollection(collectionMod: types.IMod, mod: types.IMod) {
  if (collectionMod.rules === undefined) {
    return false;
  }

  return collectionMod.rules.find(rule =>
    util.testModReference(mod, rule.reference)) !== undefined;
}

export function genCollectionLoadOrder(loadOrder: { [modId: string]: ILoadOrderEntry },
                                       mods: { [modId: string]: types.IMod },
                                       collection?: types.IMod): ILoadOrder {
  const filteredMods = (collection !== undefined)
    ? Object.keys(mods)
        .filter(id => isValidMod(mods[id]) && isModInCollection(collection, mods[id]))
        .reduce((accum, iter) => {
          accum[iter] = mods[iter];
          return accum;
        }, {})
    : mods;

  const sortedMods = Object.keys(loadOrder)
    .filter(id => isValidSubMod(id, filteredMods))
    .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
    .reduce((accum, iter, idx) => {
      accum[iter] = {
        ...loadOrder[iter],
        pos: idx,
      };
      return accum;
    }, {});
  return sortedMods;
}

function isValidSubMod(subModId: string, mods: { [modId: string]: types.IMod }) {
  if (OFFICIAL_MODULES.has(subModId)) {
    // official modules are always included.
    return true;
  }

  // The mods map should only include mods that have been included in the
  //  collection or this won't work.
  const modIds = Object.keys(mods);
  const subModIds: string[] = modIds.reduce((accum, id) =>
    accum.concat([id], mods[id]?.['attributes']?.['subModIds'] || []), []);

  return subModIds.map(id => id.toLowerCase()).includes(subModId.toLowerCase());
}
