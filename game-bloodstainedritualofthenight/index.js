const path = require('path');
const semver = require('semver');
const { actions, fs, log, util } = require('vortex-api');

// Nexus Mods id for the game.
const BLOODSTAINED_ID = 'bloodstainedritualofthenight';

// All BSRotN mods will be .pak files
const MOD_FILE_EXT = ".pak";

function findGame() {
  return util.steam.findByAppId('692850')
      .then(game => game.gamePath);
}

const oldModPath = path.join('BloodstainedRotN', 'Content', 'Paks', '~mod');
const relModPath = path.join('BloodstainedRotN', 'Content', 'Paks', '~mods');

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, relModPath),
    () => Promise.resolve());
}

function installContent(files) {
  // The .pak file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);
  
  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file => 
    ((file.indexOf(rootPath) !== -1) 
    && (!file.endsWith(path.sep))));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join(file.substr(idx)),
    };
  });

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  let supported = (gameId === BLOODSTAINED_ID) &&
    (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);

  if (supported && files.find(file =>
      (path.basename(file).toLowerCase() === 'moduleconfig.xml')
      && (path.basename(path.dirname(file)).toLowerCase() === 'fomod'))) {
    supported = false;
  }

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function migrate100(api, oldVersion) {
  if (semver.gte(oldVersion || '0.0.1', '1.0.0')) {
    return Promise.resolve();
  }

  const state = api.store.getState();
  const activatorId = util.getSafe(state, ['settings', 'mods', 'activator', BLOODSTAINED_ID], undefined);
  const discovery =
    util.getSafe(state, ['settings', 'gameMode', 'discovered', BLOODSTAINED_ID], undefined);

  if ((discovery === undefined)
      || (discovery.path === undefined)
      || (activatorId === undefined)) {
    // if this game is not discovered or deployed there is no need to migrate
    log('debug', 'skipping bloodstained migration because no deployment set up for it');
    return Promise.resolve();
  }

  // would be good to inform the user beforehand but since this is run in the main process
  // and we can't currently show a (working) dialog from the main process it has to be
  // this way.
  return api.awaitUI()
    .then(() => api.emitAndAwait('purge-mods-in-path', BLOODSTAINED_ID, '', path.join(discovery.path, oldModPath)))
    .then(() => {
      api.store.dispatch(actions.setDeploymentNecessary(BLOODSTAINED_ID, true));
    });
}

function main(context) {
  context.registerGame({
    id: BLOODSTAINED_ID,
    name: 'Bloodstained:\tRitual of the Night',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => relModPath,
    logo: 'gameart.jpg',
    executable: () => 'BloodstainedROTN.exe',
    requiredFiles: [
      'BloodstainedRotN.exe',
      'BloodstainedROTN/Binaries/Win64/BloodstainedRotN-Win64-Shipping.exe' 
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: '692850',
    },
    details: {
      steamAppId: 692850,
    },
  });

  context.registerInstaller('bloodstainedrotn-mod', 25, testSupportedContent, installContent);
  context.registerMigration(old => migrate100(context.api, old));

  return true;
}

module.exports = {
  default: main,
};
