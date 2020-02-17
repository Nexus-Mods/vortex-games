//Import some assets from Vortex we'll need.
const path = require("path");
const { fs, log, util } = require("vortex-api");
const winapi = require("winapi-bindings");

const { isModXML, isModInstaller } = require("./utils");

// Nexus Mods domain for the game. e.g. nexusmods.com/bloodstainedritualofthenight
const GAME_ID = "noita";
//Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = 881100;
//GOG Application ID, you can get this from https://www.gogdb.org/
const GOGAPP_ID = 1310457090;

const GAME_NAME = "Noita";
const MOD_DIR = () => "mods";
const EXE_NAME = "noita.exe";
const ART_NAME = "gameart.jpg";
const INSTALLER_PRIORITY = 25;

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: GAME_NAME,
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: MOD_DIR,
    logo: ART_NAME,
    executable: () => EXE_NAME,
    requiredFiles: [
      EXE_NAME,
      // REVIEW: maybe this is not required, just mods/ ?
      "mods/PLACE_MODS_HERE"
    ],
    environment: {
      SteamAPPId: STEAMAPP_ID.toString()
    },
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID
    }
  });

  context.registerInstaller(
    `${GAME_ID}-mod`,
    INSTALLER_PRIORITY,
    testSupportedContent,
    installContent
  );

  return true;
}

function findGame() {
  return util.steam
    .findByAppId(STEAMAPP_ID.toString())
    .then(game => game.gamePath);
}

function testSupportedContent(files, gameId) {
  let supported = gameId === GAME_ID && files.find(isModXML) !== undefined;

  // Test for a mod installer.
  if (supported && isModInstaller) {
    supported = false;
  }

  // TODO: see requiredFiles
  return Promise.resolve({ supported, requiredFiles: [] });
}

function installContent(files) {
  const modXML = files.find(isModXML);
  const rootPath = path.dirname(modXML);

  // Remove anything that isn't in the rootPath.
  const filtered = files.filter(file => file.indexOf(rootPath) !== -1);

  const instructions = filtered.map(file => {
    return {
      type: "copy",
      source: file,
      destination: path.join(file.substr(idx))
    };
  });

  return Promise.resolve({ instructions });
}

module.exports = {
  default: main
};
