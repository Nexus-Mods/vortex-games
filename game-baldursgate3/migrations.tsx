import * as semver from 'semver';
import { fs, types, util } from 'vortex-api';
import { importModSettingsGame } from './loadOrder';
import path from 'path';

import { getActivePlayerProfile, logDebug, profilesPath } from './util';
import { setBG3ExtensionVersion } from './actions';
import { DEBUG } from './common';

export async function migrate(api: types.IExtensionApi): Promise<void> {
  const bg3ProfileId = await getActivePlayerProfile(api);
  const settingsPath: string = path.join(profilesPath(), bg3ProfileId, 'modsettings.lsx');
  const backupPath = settingsPath + '.backup';
  const currentVersion = util.getSafe(api.getState(), ['settings', 'baldursgate3','extensionVersion'], '0.0.0');

  try {
    await fs.statAsync(backupPath); // if it doesn't exist, make a backup
  } 
  catch (err) {

    logDebug(`${backupPath} doesn't exist.`);

    try {
      await fs.statAsync(settingsPath); 
      await fs.copyAsync(settingsPath, backupPath, { overwrite: true } );
      
      logDebug(`backup created`);
      
      // import
      await importModSettingsGame(api);
      
      //logDebug(`${backupPath} doesn't exist`);
    } 
    catch (err) {
      logDebug(`${settingsPath} doesn't exist`);
    }    
  } finally {
    await migrate15(api, currentVersion);
  }

  // back up made just in case
}

export async function migrate15(api: types.IExtensionApi, oldVersion: string): Promise<void> {

  const newVersion = '1.5.0';

  // if old version is newer, then skip
  if (!DEBUG && semver.gte(oldVersion, newVersion)) {
    logDebug('skipping migration');
    return Promise.resolve();
  }

  await importModSettingsGame(api);
  const t = api.translate;
  api.sendNotification({
    id: 'bg3-patch7-info',
    type: 'info',
    message: 'Baldur\'s Gate 3 patch 7',
    actions: [{
      title: 'More',
      action: (dismiss) => {
        api.showDialog('info', 'Baldur\'s Gate 3 patch 7', {
          bbcode: t('As of Baldur\'s Gate 3 patch 7, the "ModFixer" mod is no longer required. Please feel free to disable it.{{bl}}'
                  + 'Additional information about patch 7 troubleshooting can be found here: [url]{{url}}[/url]', { replace: {
            bl: '[br][/br][br][/br]',
            url: 'https://wiki.bg3.community/en/Tutorials/patch7-troubleshooting',
          } }),
        }, [ { label: 'Close', action: () => dismiss() } ]);
      }
    }],
  })
  api.store.dispatch(setBG3ExtensionVersion(newVersion));
}

export async function migrate13(api: types.IExtensionApi, oldVersion: string): Promise<void> {

  const newVersion = '1.4.0'; // FORCING MIGRATION

  // if old version is newer, then skip
  if (semver.gte(oldVersion, newVersion)) {
    logDebug('skipping migration');
    return Promise.reject();
  }

  logDebug('perform migration');

  // do we just a force a import from game?!

  try {
    await importModSettingsGame(api);
    return Promise.reject(); // FORCE NOT RECORD VERSION NUMBER
  } 
  catch {
    return Promise.reject();
  }

  return Promise.reject();  
}
