const Promise = require('bluebird');
const path = require('path');
const rjson = require('relaxed-json');
const { actions, fs, util } = require('vortex-api');

const MOD_FILE = 'mod.json';
const GAME_ID = 'subnautica';

class Subnautica {
  constructor(context) {
    this.context = context;
    this.id = GAME_ID;
    this.name = 'Subnautica';
    this.mergeMods = true;
    this.queryModPath = () => 'QMods';
    this.logo = 'gameart.jpg';
    this.executable = () => 'Subnautica.exe';
    this.requiredFiles = [
      'Subnautica.exe'
    ];
    this.environment = {
      SteamAPPId: '264710',
    };
    this.details = {
      steamAppId: 264710,
    };
  }

  async requiresLauncher() {
    return util.epicGamesLauncher.isGameInstalled('Jaguar')
      .then(epic => epic
        ? { launcher: 'epic', addInfo: 'Jaguar' }
        : undefined);
  }

  async queryPath() {
    return util.GameStoreHelper.findByAppId(['264710', 'Jaguar'])
        .then(game => game.gamePath);
  }
  
  async setup(discovery) {
    const qmodPath = path.join(discovery.path, 'BepInEx', 'plugins', 'QModManager', 'QModInstaller.dll');
  
    // show need-QModManager dialogue and create the mods folder, if it's not already there.
    var context = this.context;
    return fs.statAsync(qmodPath).catch(() => new Promise((resolve, reject) => {
      context.api.store.dispatch(
        actions.showDialog(
          'question',
          'Action required',
          { message: 'You must install QModManager to use mods with Subnautica.' },
          [
            { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
            { label: 'Go to QModManager page', action: () => { util.opn('https://www.nexusmods.com/subnautica/mods/201').catch(err => undefined); reject(new util.UserCanceled()); } }
          ]
        )
      );
    })).then(() => fs.ensureDirWritableAsync(path.join(discovery.path, 'QMods')));
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

module.exports = {
  default: function(context) {
    context.registerGame(new Subnautica(context));
    context.registerInstaller('subnautica-mod', 25, testMod, installMod);
  }
};
