import NexusT from '@nexusmods/nexus-api';
import { actions, types, selectors, util } from 'vortex-api';
import { GAME_ID } from './common';
import { gte } from 'semver';

export const SMAPI_MOD_ID = 2400;
export const SMAPI_URL = `https://www.nexusmods.com/stardewvalley/mods/${SMAPI_MOD_ID}`;

export function findSMAPIMod(api: types.IExtensionApi): types.IMod {
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  const profile = selectors.profileById(state, profileId);
  const isActive = (modId: string) => util.getSafe(profile, ['modState', modId, 'enabled'], false);
  const isSMAPI = (mod: types.IMod) =>
    mod.type === 'SMAPI' && mod.attributes?.modId === 2400;
  const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const SMAPIMods: types.IMod[] = Object.values(mods).filter((mod: types.IMod) =>
    isSMAPI(mod) && isActive(mod.id));

  return (SMAPIMods.length === 0)
    ? undefined
    : SMAPIMods.length > 1
      ? SMAPIMods.reduce((prev, iter) => {
        if (prev === undefined) {
          return iter;
        }
        return (gte(iter.attributes.version, prev.attributes.version)) ? iter : prev;
      }, undefined)
      : SMAPIMods[0];
}

export async function deploySMAPI(api: types.IExtensionApi) {
  return new Promise<void>((resolve) => {
    api.events.emit('deploy-mods', () => {
      api.events.emit('start-quick-discovery', () => {
        const discovery = selectors.discoveryByGame(api.getState(), GAME_ID);
        const tool = discovery?.tools?.['smapi'];
        if (tool) {
          api.store.dispatch(actions.setPrimaryTool(GAME_ID, tool.id));
        }
        return resolve();
      });
    })
  });
}

export async function downloadSMAPI(api: types.IExtensionApi, update?: boolean) {
  api.dismissNotification('smapi-missing');
  api.sendNotification({
    id: 'smapi-installing',
    message: update ? 'Updating SMAPI' : 'Installing SMAPI',
    type: 'activity',
    noDismiss: true,
    allowSuppress: false,
  });
  const autoInstall = util.getSafe(api.store.getState(), ['settings', 'automation', 'install'], false);
  const autoDeploy = util.getSafe(api.store.getState(), ['settings', 'automation', 'deploy'], false);
  const autoEnable = util.getSafe(api.store.getState(), ['settings', 'automation', 'enable'], false);
  const APIKEY = util.getSafe(api.store.getState(), ['confidential', 'account', 'nexus', 'APIKey'], '');
  try {
    const automationActions = [];
    if (autoInstall) {
      automationActions.push(actions.setAutoInstall(false));
    }
    if (autoDeploy) {
      automationActions.push(actions.setAutoDeployment(false));
    }
    if (automationActions.length > 0) {
      util.batchDispatch(api.store, automationActions);
    }

    if (!APIKEY) {
      throw new Error('No API key found');
    }
    const nexus = new NexusT('Vortex', util.getApplication().version, GAME_ID, 30000);
    await nexus.setKey(APIKEY);
    const modFiles = await nexus.getModFiles(SMAPI_MOD_ID, GAME_ID);
    const file = modFiles.files.reduce((acc, cur) => {
      if (!acc) {
        acc = cur;
      } else {
        if (Number.parseInt(cur.uploaded_time, 10) > Number.parseInt(acc.uploaded_time), 10) {
          acc = cur;
        }
      }
      return acc;
    }, undefined);
    const dlInfo = {
      game: GAME_ID,
      name: 'SMAPI',
    };
    const nxmUrl = `nxm://${GAME_ID}/mods/${SMAPI_MOD_ID}/files/${file.file_id}`;
    await new Promise<void>((resolve, reject) => {
      api.events.emit('start-download', [nxmUrl], dlInfo, undefined, (err, id) => {
        if (err) {
          return reject(err);
        }
        api.events.emit('start-install-download', id, undefined, (err, mId) => {
          if (err) {
            return reject(err);
          }
          const profileId = selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
          if (!autoEnable) {
            api.store.dispatch(actions.setModEnabled(profileId, mId, true));
          }
          return resolve(deploySMAPI(api));
        });
      });
    });
  } catch (err) {
    api.showErrorNotification('Failed to download/install SMAPI', err);
    util.opn(SMAPI_URL).catch(err => null);
  } finally {
    api.dismissNotification('smapi-installing');
    const automationActions = [];
    if (autoDeploy) {
      automationActions.push(actions.setAutoDeployment(true));
    }
    if (autoInstall) {
      automationActions.push(actions.setAutoInstall(true));
    }
    util.batchDispatch(api.store, automationActions);
  }
}
