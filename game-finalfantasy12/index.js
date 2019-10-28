const Promise = require('bluebird');
const path = require('path');
const { fs, util } = require('vortex-api');
const { app, remote } = require('electron');
const uniApp = app || remote.app;
const settings = require('./settings');
const installer = require('./installer');
const game = require('./game-merged');

function findGame() {
  return util.steam.findByAppId(settings.STEAMID.toString())
    .then(game => game.gamePath);
}

function testSupportedContent(files, gameId) {
  let supported = false;

  if (gameId === settings.NEXUS_ID) {
    supported = (files.find(file => file.toLowerCase().indexOf(settings.DATA_DIR_SEP) !== -1) !== undefined);
    /*
    //test for standard dirs
    supported =  (gameId === settings.NEXUS_ID) &&
        settings.MODDING_DIRS.some(dir =>
          (files.find(file =>
            file.toLowerCase().indexOf(dir + path.sep) !== -1) !== undefined
          )
        );
    */

    // Test for a mod installer.
    if (files.find(file =>
      (path.basename(file).toLowerCase() === 'moduleconfig.xml')
      && (path.basename(path.dirname(file)).toLowerCase() === 'fomod'))) {
      supported = false;
    } else if (!supported) {
      return Promise.reject(new util.DataInvalid('Mod is not supported. Auto installation available only from "' + settings.DATA_DIR + '" directory.'));
    }
  }
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files) {
  // Remove directories and anything that isn't in the rootPath.
  const rootPath = files.find(file => file.endsWith(settings.DATA_DIR_SEP));
  const pathStartPos = rootPath.length - settings.DATA_DIR_SEP.length;

  let filtered = files.filter(file =>
    ((file.indexOf(rootPath) !== -1)
      && (!file.endsWith(path.sep))));

  filtered = filtered.map(file => {
    return {
      source: file,
      destination: file.substr(pathStartPos),
    };
  });

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file.source,
      destination: file.destination,
    }
  });

  return Promise.resolve({ instructions });
}

function prepareForModding(discovery) {
  return Promise.all([
    fs.ensureDirWritableAsync(path.join(discovery.path, settings.MODS_DIR, settings.BACKUP_DIR)),
    fs.ensureDirWritableAsync(path.join(discovery.path, settings.MODS_DIR, settings.DEPLOY_DIR)),
    fs.ensureDirWritableAsync(path.join(uniApp.getPath('userData'), settings.NEXUS_ID, 'bin')),
    fs.ensureDirWritableAsync(path.join(uniApp.getPath('userData'), settings.NEXUS_ID, 'logs')),
    fs.ensureDirWritableAsync(path.join(uniApp.getPath('userData'), settings.NEXUS_ID, 'list')),
    ...installer.SIZE_FILES.map(sizeFile => fs.makeFileWritableAsync(path.join(discovery.path, 'FileSizeTables', sizeFile))),
    fs.makeFileWritableAsync(path.join(discovery.path, installer.VBF_FILE)),
  ]);
}

function main(context) {
  context.registerGame({
    id: settings.NEXUS_ID,
    name: 'Final Fantasy XII',
    mergeMods: game.MERGED,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => path.join(settings.MODS_DIR, settings.DEPLOY_DIR),
    logo: 'gameart.jpg',
    executable: () => path.join('x64', 'FFXII_TZA.exe'),
    requiredFiles: [
      path.join('x64', 'FFXII_TZA.exe'),
      installer.VBF_FILE,
      ...installer.SIZE_FILES.map(sizeTable => path.join('FileSizeTables', sizeTable))
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: settings.STEAMID.toString(),
    },
    details: {
      steamAppId: settings.STEAMID,
    },
    detach: true,
  });

  context.registerInstaller('finalfantasy12-mod', 25, testSupportedContent, installContent);

  context.once(() => game.performOnce(context));

  return true;
}

module.exports = {
  default: main,
};
