const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, util } = require('vortex-api');

const GAME_ID = 'vampirebloodlines';
const STEAM_ID = 2600;
const GOG_ID = 1207659240;

function readRegistryKey(hive, key, name) {
  try {
    const instPath = winapi.RegGetValue(hive, key, name);
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.resolve(undefined);
  }
}

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath)
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'))
    .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
      `SOFTWARE\\GOG.com\\Games\\${GOG_ID}`,
      'PATH'))
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Vampire'), Promise.resolve());
}

function getUnofficialModPath() {
  const state = _API.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  return path.join(discovery.path, 'Unofficial_Patch');
}

function isUPModType(instructions) {
  return fs.statAsync(getUnofficialModPath())
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}

function main(context) {
  _API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: 'Vampire the Masquerade\tBloodlines',
    logo: 'gameart.png',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Vampire',
    executable: () => 'Vampire.exe',
    requiredFiles: [],
    details: {
      steamAppId: STEAM_ID,
    },
    setup: prepareForModding,
  });

  // The "unofficial patch" mod modifies the mods folder. GoG seems to include
  //  this by default ?
  context.registerModType('vtmb-up-modtype', 25,
    (gameId) => gameId === GAME_ID, () => getUnofficialModPath(),
    (instructions) => isUPModType(instructions));
}

module.exports = {
  default: main
};
