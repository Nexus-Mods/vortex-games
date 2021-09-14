// Nexus Mods domain for the game. e.g. nexusmods.com/bloodstainedritualofthenight
const GAME_ID = 'bloonstd6';

//Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = '960090';

//Import some assets from Vortex we'll need.
const path = require('path');
const { fs, log, util } = require('vortex-api');

const MOD_FILE_EXT = ".dll";

function main(context) {
	//This is the main function Vortex will run when detecting the game extension. 
	context.registerGame({
    id: GAME_ID,
    name: 'Bloons TD6',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => 'Mods',
    logo: 'gameart.png',
    executable: () => 'BloonsTD6.exe',
    requiredFiles: [
      'BloonsTD6.exe',
      'MelonLoader/MelonLoader.dll'
    ],
    setup: (discovery) => prepareForModding(discovery, context.api),
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
    },
  });

  context.registerInstaller('bloonstd6-mod', 25, testSupportedContent, installContent);

	return true
}

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
      .then(game => game.gamePath);
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

function prepareForModding(discovery, api) {
  // Path to the main Melonloader DLL file.
  const MelonLoaderPath = path.join(discovery.path, 'MelonLoader', 'MelonLoader.dll');
  // Ensure the mods folder exists, then check for MelonLoader.
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'))
    .then(() => checkForMelonLoader(api, MelonLoaderPath));
}

function checkForMelonLoader(api, MelonLoaderPath) {
  return fs.statAsync(MelonLoaderPath)
    .catch(() => {
      api.sendNotification({
        id: 'melonloader-missing',
        type: 'warning',
        title: 'MelonLoader not installed',
        message: 'MelonLoader is required to mod Bloons TD6.',
        actions: [
          {
            title: 'Get MelonLoader',
            action: () => util.opn("https://github.com/LavaGang/MelonLoader/releases").catch(() => undefined)
          }
        ]
      });
    });
}

function installContent(files) {
  // The .dll file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
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

module.exports = {
    default: main,
};