import NexusT from '@nexusmods/nexus-api';
import { actions, types, selectors, util } from 'vortex-api';
import { GAME_ID } from './common';
export const SMAPI_URL = 'https://www.nexusmods.com/stardewvalley/mods/2400';

export async function downloadSMAPI(api: types.IExtensionApi) {
  api.dismissNotification('smapi-missing');
  api.sendNotification({
    id: 'smapi-installing',
    message: 'Installing SMAPI',
    type: 'activity',
    noDismiss: true,
    allowSuppress: false,
  });
  const APIKEY = util.getSafe(api.store.getState(), ['confidential', 'account', 'nexus', 'APIKey'], '');
  try {
    if (!APIKEY) {
      throw new Error('No API key found');
    }
    const nexus = new NexusT('Vortex', util.getApplication().version, GAME_ID, 30000);
    await nexus.setKey(APIKEY);
    const modFiles = await nexus.getModFiles(2400, GAME_ID);
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
    const nxmUrl = `nxm://${GAME_ID}/mods/2400/files/${file.file_id}`;
    api.events.emit('start-download', [nxmUrl], dlInfo, undefined, (err, id) => {
      if (err) {
        throw err;
      }
      api.events.emit('start-install-download', id, undefined, (err, mId) => {
        if (err) {
          throw err;
        }
        const profileId = selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
        api.store.dispatch(actions.setModEnabled(profileId, mId, true));
        api.events.emit('deploy-mods', () => {
          api.events.emit('start-quick-discovery', () => {
            api.dismissNotification('smapi-installing');
            const discovery = selectors.discoveryByGame(api.getState(), GAME_ID);
            const tool = discovery?.tools?.['smapi'];
            if (tool) {
              api.store.dispatch(actions.setPrimaryTool(GAME_ID, tool.id));
            }
          });
        });
      });
    });
  } catch (err) {
    api.dismissNotification('smapi-installing');
    api.showErrorNotification('Failed to download/install SMAPI', err);
    util.opn(SMAPI_URL).catch(err => null);
  }
}
