/* eslint-disable */
import path from 'path';
import semver from 'semver';
import { actions, fs, selectors, types, util } from 'vortex-api';

import { GAME_ID } from './common';
import { prefix } from 'react-bootstrap/lib/utils/bootstrapUtils';

export async function migrate148(context: types.IExtensionContext,
                                 oldVersion: string): Promise<void> {
  if (semver.gte(oldVersion, '1.4.8')) {
    return Promise.resolve();
  }

  const state = context.api.getState();
  const lastActiveProfile = selectors.lastActiveProfileForGame(state, GAME_ID);
  const profile = selectors.profileById(state, lastActiveProfile);
  const mods: { [modId: string]: types.IMod } =
    util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const modState = util.getSafe(profile, ['modState'], {});
  const isEnabled = (mod: types.IMod) => modState[mod.id]?.enabled === true;
  const limitPatchMod = Object.values(mods).find(mod =>
    (mod.type === 'w3modlimitpatcher') && isEnabled(mod));
  if (limitPatchMod === undefined) {
    return Promise.resolve();
  }

  const t = context.api.translate;
  context.api.sendNotification({
    type: 'warning',
    allowSuppress: false,
    message: t('Faulty Witcher 3 Mod Limit Patch detected'),
    actions: [
      {
        title: 'More',
        action: (dismiss) => {
          dismiss();
          context.api.showDialog('info', 'Witcher 3 Mod Limit Patch', {
            text: t('Due to a bug, the mod limit patch was not applied correctly. '
                     + 'Please Uninstall/Remove your existing mod limit match mod entry in '
                     + 'your mods page and re-apply the patch using the "Apply Mod Limit Patch" '
                     + 'button.'),
          }, [
            { label: 'Close' },
          ]);
        },
      },
    ],
  });

  return Promise.resolve();
}

export function getPersistentLoadOrder(api: types.IExtensionApi): types.ILoadOrderEntry[] {
  // We migrated away from the regular mod load order extension
  //  to the file based load ordering
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return [];
  }
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], undefined);
  if (loadOrder === undefined) {
    return [];
  }
  if (Array.isArray(loadOrder)) {
    return loadOrder;
  }
  if (typeof loadOrder === 'object') {
    return Object.values(loadOrder).map(convertDisplayItem);
  }
  return [];
}

function convertDisplayItem(item: types.ILoadOrderDisplayItem): types.ILoadOrderEntry {
  return {
    id: item.id,
    name: item.name,
    locked: item.locked,
    enabled: true,
    data: {
      prefix: item.prefix,
    }
  }
}
