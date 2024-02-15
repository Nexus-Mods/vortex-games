import * as semver from 'semver';
import { fs, types } from 'vortex-api';
import { importModSettingsGame } from './loadOrder';
import path from 'path';

import { profilesPath } from './util';

export async function migrate(api: types.IExtensionApi): Promise<void> {
  
  const settingsPath = path.join(profilesPath(), 'Public', 'modsettings.lsx');
  const backupPath = settingsPath + '.backup';


  try {
    await fs.statAsync(backupPath); // if it doesn't exist, make a backup
  } 
  catch (err) {

    console.log(`${backupPath} doesn't exist.`);

    try {
      await fs.statAsync(settingsPath); 
      await fs.copyAsync(settingsPath, backupPath, { overwrite: true } );
      
      console.log(`backup created`);
      
      // import
      await importModSettingsGame(api);
      
      //console.log(`${backupPath} doesn't exist`);
    } 
    catch (err) {
      console.log(`${settingsPath} doesn't exist`);
    }    
  }

  // back up made just in case
}

export async function migrate13(api: types.IExtensionApi, oldVersion: string): Promise<void> {

  const newVersion = '1.4.0'; // FORCING MIGRATION

  // if old version is newer, then skip
  if (semver.gte(oldVersion, newVersion)) {
    console.log('skipping migration');
    return Promise.reject();
  }

  console.log('perform migration');

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
