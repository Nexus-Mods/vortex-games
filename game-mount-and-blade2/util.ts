import { parseXmlString } from 'libxmljs';
import { fs, selectors, types, util } from 'vortex-api';

import { GAME_ID } from './common';
import { IProps } from './types';

export async function getXMLData(xmlFilePath: string) {
  return fs.readFileAsync(xmlFilePath)
    .then(data => {
      try {
        const xmlData = parseXmlString(data);
        return Promise.resolve(xmlData);
      } catch (err) {
        return Promise.reject(new util.DataInvalid(err.message));
      }
    })
    .catch(err => (err.code === 'ENOENT')
      ? Promise.reject(new util.NotFound(xmlFilePath))
      : Promise.reject(new util.DataInvalid(err.message)));
}

export function genProps(api: types.IExtensionApi, profileId?: string): IProps {
  const state = api.getState();
  const profile = (profileId !== undefined)
    ? selectors.profileById(state, profileId)
    : selectors.activeProfile(state);

  if (profile?.gameId !== GAME_ID) {
    return undefined;
  }

  const discovery: types.IDiscoveryResult = util.getSafe(state,
    ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if (discovery?.path === undefined) {
    return undefined;
  }

  const mods: { [modId: string]: types.IMod } =
    util.getSafe(state, ['persistent', 'mods', GAME_ID], {});

  const enabledMods = Object.keys(mods)
    .filter(id => util.getSafe(profile, ['modState', id, 'enabled'], false))
    .reduce((accum, id) => {
      accum[id] = mods[id];
      return accum;
    }, {});

  return { state, profile, discovery, enabledMods };
}
