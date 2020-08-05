const Promise = require('bluebird');
const path = require('path');
const rjson = require('relaxed-json');
const { fs, util } = require('vortex-api');

const MOD_FILE = 'mod.json';
const GAME_ID = 'subnauticabelowzero';

// Mod installation values.
const QMM_MODPAGE = 'https://www.nexusmods.com/subnauticabelowzero/mods/1';
const QMM_DLL = 'QModInstaller.dll';

class SubnauticaBelowZero {
  constructor(context) {
    this.context = context;
    this.id = GAME_ID;
    this.name = 'Subnautica: Below Zero';
    this.mergeMods = true;
    this.queryModPath = () => 'QMods';
    this.logo = 'gameart.jpg';
    this.executable = () => 'SubnauticaZero.exe';
    this.requiredFiles = [
      'SubnauticaZero.exe'
    ];
    this.environment = {
      SteamAPPId: '848450',
    };
    this.details = {
      steamAppId: 848450,
    };
  }

  async requiresLauncher() {
    return util.epicGamesLauncher.isGameInstalled('foxglove')
      .then(epic => epic
        ? { launcher: 'epic', addInfo: 'foxglove' }
        : undefined);
  }

  async queryPath() {
    return util.steam.findByAppId('848450')
      .then(game => game.gamePath);
  }
  
  async setup(discovery) {
    const api = this.context.api;
    const { store } = this.context.api;

    if (util.getSafe(discovery, ['environment', 'SteamAPPId'], undefined) === undefined) {
      // this game does weird things when the steam app id is not set, starting the original Subnautica game
      // instead of Below Zero. I'm assuming this is a setup error somewhere in Steam but it seems to have existed
      // for a while so who knows when it gets fixed
      const environment = util.getSafe(discovery, ['environment'], {});
      environment.SteamAPPId = '848450';
      store.dispatch({ type: 'SET_GAME_PARAMETERS', payload: { gameId: GAME_ID, parameters: { environment } } });
    }

    // skip if QModManager found
    const qModPath = path.join(discovery.path, 'BepInEx', 'plugins', 'QModManager', 'QModInstaller.dll');
  
    // create the QMods folder and show need-QModManager notification
    return fs.ensureDirWritableAsync(path.join(discovery.path, 'QMods'))
      .then(() => checkForQMM(api, qModPath));
  }
}

function getModName(destination, modFile) {
  const modFolder = path.basename(path.dirname(modFile));
  const modFilePath = path.join(destination, modFile);
  return (modFolder !== '.')
    ? Promise.resolve(modFolder)
    : fs.readFileAsync(modFilePath, { encoding: 'utf-8' })
      .then(data => {
        try {
          const modFile = rjson.parse(util.deBOM(data));
          return Promise.resolve(modFile.Id);
        } catch (err) {
          return Promise.reject(new util.DataInvalid('Failed to parse mod.json file.'));
        }
      });
}

function testMod(files, gameId) {
  return Promise.resolve({
    supported: ((gameId === GAME_ID)
      && (files.find(file => path.basename(file) === MOD_FILE) !== undefined)),
    requiredFiles: []
  });
}

function installMod(files, destinationPath) {
  const modFile = files.find(file => path.basename(file) === MOD_FILE);
  const idx = modFile.indexOf(MOD_FILE);
  const rootPath = path.dirname(modFile);

  const filtered = files.filter(file => (!file.endsWith(path.sep))
    && (file.indexOf(rootPath) !== -1));

  return getModName(destinationPath, modFile)
    .then(modName => {
      return Promise.map(filtered, file => {
        return Promise.resolve({
          type: 'copy',
          source: file,
          destination: path.join(modName, file.substr(idx)),
        });
      });
    })
    .then(instructions => Promise.resolve({ instructions }));
}

function checkForQMM(api, qModPath) {
  return fs.statAsync(qModPath)
    .catch(() => {
      api.sendNotification({
        id: 'qmm-missing',
        type: 'warning',
        title: 'QModManager not installed',
        message: 'QMM is required to mod Subnautica: Below Zero.',
        actions: [
          {
            title: 'Get QMM',
            action: () => util.opn(QMM_MODPAGE).catch(() => undefined)
          }
        ]
      });
    });
}

function testQMM(files, gameId) {
  const supported = 
    ((gameId === GAME_ID) 
    && (!!files.find(f => path.basename(f).toLowerCase() === QMM_DLL.toLowerCase())));

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function installQMM(files, api) {
  api.dismissNotification('qmm-missing');
  // Set as dinput so the files are installed to the game root directory.
  const modType = { type: 'setmodtype', value: 'dinput' };
  // Filter out directories, as these cause a warning. 
  files = files.filter(file => !file.endsWith(path.sep));
  const instructions = files.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file
    }
  });
  
  instructions.push(modType);

  return Promise.resolve({ instructions });

}

module.exports = {
  default: function(context) {
    context.registerGame(new SubnauticaBelowZero(context));
    context.registerInstaller('subnautica-belowzero-mod', 25, testMod, installMod);
    context.registerInstaller('subnautica-qmm-installer', 25, testQMM, (files) => installQMM(files, context.api));
  }
};
