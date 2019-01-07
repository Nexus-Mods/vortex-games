const path = require('path');
const { fs, log, util } = require('vortex-api');

const MOD_MANIFEST = 'mod.manifest';

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
  return input.replace(/[0-9 -.]/g, '');
}

function findModManifest(files) {
  return files.find(file => path.basename(file).toLowerCase() === MOD_MANIFEST);
}

function testSupported(files, gameId) {
  if (gameId !== 'kingdomcomedeliverance') {
    return Promise.resolve({ supported: false });
  }

  return Promise.resolve({ 
    supported: findModManifest(files) !== undefined,
    requiredFiles: []
  });
}

function install(files, destinationPath, gameId, progressDelegate) {
  const modRootIndex = findModManifest(files).indexOf(MOD_MANIFEST);
  let modName = path.parse(path.basename(destinationPath)).name;
  modName = transformId(modName);

  const filtered = files.filter(file => 
    (path.dirname(file) !== '.') && (path.extname(file) !== ''));

  const instructions = filtered.map(file => {
    const destination = modRootIndex !== 0
      ? path.join(modName, file.substr(modRootIndex))
      : path.join(modName, file);

    return {
      type: 'copy',
      source: file,
      destination: destination,
    };
  })

  return Promise.resolve({ instructions });
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
        prepareForModding(discovery)
        .then(() => fs.writeFileAsync(path.join(discovery.path, 'Mods', 'mod_order.txt'),
                                      mods.map(mod => transformId(mod.id)).join('\n')));
      }
    });
  })

  context.registerInstaller('kcd-mod-installer', 50, testSupported, install);

  return true;
}

module.exports = {
  default: main,
};
