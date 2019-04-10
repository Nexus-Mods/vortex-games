const Promise = require('bluebird');
const path = require('path');
const { fs, log, util } = require('vortex-api');

function findGame() {
  return util.steam.findByAppId('379430')
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'),
    () => Promise.resolve());
}

function transformId(input) {
  // the game doesn't like spaces in its mod names
  return input.replace(/[ -.]/g, '');
}

function main(context) {
  context.registerGame({
    id: 'kingdomcomedeliverance',
    name: 'Kingdom Come: Deliverance',
    mergeMods: mod => transformId(mod.id),
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.png',
    executable: () => 'Bin/Win64/KingdomCome.exe',
    requiredFiles: [
      'Bin/Win64/KingdomCome.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 379430,
    },
  });

  context.once(() => {
    // the bake-settings event receives the list of enabled mods, sorted by priority. perfect.
    context.api.events.on('bake-settings', (gameId, mods) => {
      if (gameId === 'kingdomcomedeliverance') {
        const store = context.api.store;
        const state = store.getState();
        const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', gameId], undefined);
        if (discovery === undefined) {
          // should never happen and if it does it will cause errors elsewhere as well
          log('error', 'kingdomcomedeliverance was not discovered');
          return;
        }

        const modOrderFile = path.join(discovery.path, 'Mods', 'mod_order.txt');
        const transformedMods = mods.map(mod => transformId(mod.id));
        prepareForModding(discovery)
        .then(() => fs.readFileAsync(modOrderFile, { encoding: 'utf-8' }))
          .catch(err => (err.code === 'ENOENT')
            ? Promise.resolve(null) // No mod order file? no problem.
            : Promise.reject(err))
        .then(data => {
          if (data === null) {
            return Promise.resolve();
          } else {
            // We need to lookup pre-existing mods and ensure we don't remove them.
            //  We rely on the mods being separated by newLine (but so does the game afaik)
            const currentMods = data.split(/\r?\n/g); // Pattern should work for both Windows and *nix
            const diff = currentMods.filter(current =>
              transformedMods.find(newMod => newMod === current) === undefined);
            return Promise.each(diff, mod => {
              // Ensure that the mod manifest exists as that's a clear indication that
              //  the mod is still installed.
              return fs.statAsync(path.join(discovery.path, 'Mods', mod, 'mod.manifest'))
              .tap(() => transformedMods.push(mod))
              .catch(err => {
                if (['ENOENT', 'UNKNOWN'].indexOf(err.code) === -1) {
                  transformedMods.push(mod);
                }

                return Promise.resolve();
              })
            })
          }
        })
        .then(() => fs.writeFileAsync(modOrderFile, transformedMods.join('\n')))
        .catch(err => {
          const errorMessage = ['EPERM', 'ENOENT'].indexOf(err.code) !== -1
            ? 'Please ensure that the file exists, and that you have full write permissions to it.'
            : err;
          context.api.showErrorNotification('Unable to manipulate mod_order.txt',
          errorMessage, { allowReport: ['EPERM', 'ENOENT'].indexOf(err.code) === -1 })
        });
      }
    });
  })

  return true;
}

module.exports = {
  default: main,
};
