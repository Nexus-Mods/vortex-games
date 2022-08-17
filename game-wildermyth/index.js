const path = require('path');
const { fs, log, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const GAME_ID = 'wildermyth';
const STEAMAPP_ID = '763890';
const GOGAPP_ID = '1853330157';
const MOD_FILE_EXT = ".json";

//Is the queryModPath right? What is it relative to?

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Wildermyth',
    mergeMods: false,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => 'mods/user',
    logo: 'gameart.png',
    executable: () => 'wildermyth',
    requiredFiles: [
      'wildermyth.jar',
      'scratchpad.jar'
    ],
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID,
    },
  });

  context.registerInstaller('wildermyth-mod', 25, testSupportedContent, installContent);

  return true
}

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\' + GOGAPP_ID,
      'PATH');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID])
      .then(game => game.gamePath);
  }
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  let supported = (gameId === GAME_ID) &&
    (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files) {
  const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);

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


module.exports = {
  default: main,
};