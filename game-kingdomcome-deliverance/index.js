const path = require('path');
const { fs, log, util } = require('vortex-api');

function findGame() {
  return util.steam.findByAppId('379430')
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, 'Mods'));
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
        console.log('discovery', discovery, gameId, mods);
        if (discovery === undefined) {
          // should never happen and if it does it will cause errors elsewhere as well
          log('error', 'kingdomcomedeliverance was not discovered');
          return;
        }
        fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'))
        .then(() => fs.writeFileAsync(path.join(discovery.path, 'Mods', 'mod_order.txt'),
                                      mods.map(mod => transformId(mod.id)).join('\n')));
      }
    });
  })

  return true;
}

module.exports = {
  default: main,
};
