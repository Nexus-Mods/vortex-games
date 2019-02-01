const fs = require('fs');
const { promisify } = require('util');
const Promise = require('bluebird');
const opn = require('opn');
const path = require('path');
const { actions, util } = require('vortex-api');

class SubnauticaBelowZero {
  constructor(context) {
    this.context = context;
    this.id = 'subnauticabelowzero';
    this.name = 'Subnautica: Below Zero';
    this.mergeMods = true;
    this.queryModPath = () => 'QMods';
	  this.supportedTools = [
      {
      id: 'qmods',
      name: 'QModManager',
      executable: () => 'QModManager.exe',
      requiredFiles: [
        'QModManager.exe',
      ],
      relative: true,
      }
    ];
    this.logo = 'gameart.png';
    this.executable = () => 'SubnauticaZero.exe';
    this.requiredFiles = [
      'SubnauticaZero.exe'
    ];
    this.details = {
      steamAppId: 848450,
    };
  }

  async requiresLauncher() {
    return util.epicGamesLauncher.isGameInstalled('Jaguar')
      .then(epic => epic
        ? { launcher: 'epic', addInfo: 'Jaguar' }
        : undefined);
  }

  async queryPath() {
    return util.steam.findByAppId('848450')
        .then(game => game.gamePath);
  }

  async getPathExistsAsync(path) {
      try {
       await promisify(fs.access)(path, fs.constants.R_OK);
       return true;
      }
      catch(err) {
        return false;
      }
  }
  
  async setup(discovery) {
    // skip if QModManager found
    let qmodPath = path.join(discovery.path, 'SubnauticaZero_Data', 'Managed', 'QModManager.exe')
    let qmodFound = await this.getPathExistsAsync(qmodPath);
    if (qmodFound) {
      return;
    }
  
    // show need-QModManager dialogue
    var context = this.context;
    return new Promise((resolve, reject) => {
      context.api.store.dispatch(
        actions.showDialog(
          'question',
          'Action required',
          { message: 'You must install QModManager to use mods with Subnautica: Below Zero.' },
          [
            { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
            { label: 'Go to QModManager page', action: () => { opn('https://www.nexusmods.com/subnauticabelowzero/mods/1/').catch(err => undefined); reject(new util.UserCanceled()); } }
          ]
        )
      );
    });
  }
}

module.exports = {
  default: function(context) {
    context.registerGame(new SubnauticaBelowZero(context));
  }
};
