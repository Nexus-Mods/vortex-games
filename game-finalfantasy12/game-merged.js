const MERGED = true;

const Promise = require('bluebird');
const path = require('path');
const { selectors, fs } = require('vortex-api');
const settings = require('./settings');
const installer = require('./installer');
const uuid = require('uuid');
const { app, remote } = require('electron');
const uniApp = app || remote.app;

function walkAsync(dir) {
  let entries = [];
  return fs.readdirAsync(dir).then(files => {
    return Promise.map(files, file => {
      const fullPath = path.join(dir, file);
      return fs.statAsync(fullPath).then(stats => {
        if (stats.isDirectory()) {
          return walkAsync(fullPath)
            .then(nestedFiles => {
              entries = entries.concat(nestedFiles);
              return Promise.resolve();
            })
        } else {
          entries.push(fullPath);
          return Promise.resolve();
        }
      });
    });
  })
    .then(() => Promise.resolve(entries));
}

function performOnce(context) {
  const INSTALL_NOTIFICATION_ID = 'finalfantasy12-external-install';
  const installNotification = (id, message) => context.api.sendNotification({
    type: 'activity',
    id: INSTALL_NOTIFICATION_ID + '-' + id,
    icon: 'icon-in-progress',
    message: message,
    noDismiss: true,
  });
  const dismissInstallNotification = (id) => context.api.dismissNotification(INSTALL_NOTIFICATION_ID + '-' + id);
  let oldFiles = [];
  let removedFiles = [];

  context.api.events.on('remove-mod', (gameId, modId) => {
    if (settings.NEXUS_ID !== gameId)
      return Promise.resolve();

    const store = context.api.store;
    const state = store.getState();
    const stagingFolder = selectors.installPathForGame(state, settings.NEXUS_ID);
    const modFolder = path.join(stagingFolder, modId);
    return walkAsync(modFolder)
      .then((entries) => removedFiles.push(...entries.map(file => file.substr((modFolder + path.sep + settings.DATA_DIR_SEP).length))))
  });

  context.api.onAsync('will-deploy', (profileId, deployment) => {
    const state = context.api.store.getState();
    const profile = selectors.profileById(state, profileId);
    if (settings.NEXUS_ID !== profile.gameId)
      return Promise.resolve();

    oldFiles = deployment[''];
  });

  context.api.onAsync('did-deploy', (profileId, deployment) => {
    const listDir = path.join(uniApp.getPath('userData'), settings.NEXUS_ID, 'list');
    const state = context.api.store.getState();
    const profile = selectors.profileById(state, profileId);
    if (settings.NEXUS_ID !== profile.gameId)
      return Promise.resolve();

    const installPath = selectors.currentGameDiscovery(state);
    const backupDir = path.join(installPath.path, settings.MODS_DIR, settings.BACKUP_DIR);
    const deployDir = path.join(installPath.path, settings.MODS_DIR, settings.DEPLOY_DIR, settings.DATA_DIR);

    //hack around removing enabled mods to not perform full purge/reinstalation
    let removedMissingFiles = [];
    //let removedChangedFiles = [];
    if (removedFiles.length > 0) {
      removedMissingFiles = removedFiles.filter(file => !deployment[''].find(fileNew => file === fileNew.relPath.substr(settings.DATA_DIR_SEP.length)));
      //removedChangedFiles = removedFiles.filter(file => deployment[''].find(fileNew => file === fileNew.relPath.substr(settings.DATA_DIR_SEP.length)));
      removedFiles = [];
    }

    return new Promise((resolve, reject) => {
      try {
        let missingFiles = oldFiles.filter(file => !deployment[''].find(fileNew => file.relPath === fileNew.relPath));
        missingFiles = missingFiles.map(file => file.relPath.substr(settings.DATA_DIR_SEP.length));
        //enabled mods were removed but are still in VBF archive
        if (missingFiles.length == 0 && removedMissingFiles.length > 0)
          missingFiles = removedMissingFiles;

        if (missingFiles.length != 0) {
          fs.accessSync(backupDir);
          installNotification('uninstall', 'Uninstallation via external tools in progress. Please wait.');
          return installer.checkToolsExist(context.api)
            .then(() => writeList('uninstall', listDir, missingFiles))
            .then((listFileName) => installer.patchVBF(backupDir, installPath.path, context.api, listFileName)
              .then(() => installer.patchAllSizes(backupDir, installPath.path, context.api, listFileName))
              .finally(() => fs.removeAsync(listFileName))
            )
            .then(() => Promise.each(missingFiles.map(file => fs.removeAsync(path.join(backupDir, file)))))
            .catch(() => resolve())
            .finally(() => dismissInstallNotification('uninstall'))
            ;
        } else {
          return resolve();
        }
      } catch (error) {
        return resolve();
      }
    })
      .then(() => {
        try {
          let changingFiles = deployment[''].filter(file => !oldFiles.find(fileOld => (file.relPath === fileOld.relPath && file.source === fileOld.source)));
          changingFiles = changingFiles.map(file => file.relPath.substr(settings.DATA_DIR_SEP.length));
          if (changingFiles.length != 0) {
            fs.accessSync(deployDir);
            installNotification('install', 'Installation via external tools in progress. Please wait.');
            return installer.checkToolsExist(context.api)
              .then(() => writeList('install', listDir, changingFiles))
              .then((listFileName) => installer.patchVBF(deployDir, installPath.path, context.api, listFileName, backupDir)
                .then(() => installer.patchAllSizes(deployDir, installPath.path, context.api, listFileName))
                .finally(() => fs.removeAsync(listFileName))
              )
              .catch(() => Promise.resolve())
              .finally(() => dismissInstallNotification('install'))
              ;
          } else {
            return Promise.resolve();
          }
        } catch (error) {
          return Promise.resolve();
        }
      });
  });

  context.api.events.on('purge-mods', () => {
    const store = context.api.store;
    const state = store.getState();
    const activeGameId = selectors.activeGameId(state);
    if (settings.NEXUS_ID !== activeGameId) {
      return Promise.resolve();
    }

    const installPath = selectors.currentGameDiscovery(state);
    const backupDir = path.join(installPath.path, settings.MODS_DIR, settings.BACKUP_DIR);
    return new Promise((resolve, reject) => {
      try {
        fs.accessSync(backupDir);
        installNotification('uninstall', 'Uninstallation via external tools in progress. Please wait.');
        return installer.checkToolsExist(context.api)
          .then(() => installer.patchVBF(backupDir, installPath.path, context.api))
          .then(() => installer.patchAllSizes(backupDir, installPath.path, context.api))
          .then(() => fs.removeAsync(backupDir))
          .catch(() => resolve())
          .finally(() => dismissInstallNotification('uninstall'))
          ;
      } catch (error) {
        return resolve();
      }
    });
  });
}

function writeList(operationString, listPath, files) {
  return new Promise((resolve, reject) => {
    try {
      let filePath = path.join(listPath, operationString + '-' + uuid.v4() + '.txt');
      let wstream = fs.createWriteStream(filePath);

      files.forEach(file => wstream.write(file + '\n'));
      wstream.close();
      return resolve(filePath);
    } catch (error) {
      return reject();
    }
  });
}

module.exports = {
  performOnce,
  MERGED,
};