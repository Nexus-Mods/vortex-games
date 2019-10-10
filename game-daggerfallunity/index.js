const { app, remote } = require('electron');
const path = require('path');
const { fs } = require('vortex-api');

const appUni = app || remote.app;
const LOCAL_LOW = path.resolve(appUni.getPath('appData'),
  '..', 'LocalLow', 'Daggerfall Workshop', 'Daggerfall Unity');
const ENV_LOG = path.join(LOCAL_LOW, 'DFTFU_Environment.log');
const GAME_ID = 'daggerfallunity';
const GAME_EXEC = 'DaggerfallUnity.exe';
const CMD_PATTERN = 'CommandLine | ';


function findGame() {
  const getTrimmedPath = (gamePath) => {
    const trimmed = gamePath.substr(CMD_PATTERN.length);
    return path.dirname(trimmed);
  }

  return fs.readFileAsync(ENV_LOG, { encoding: 'utf8' })
    .then(data => {
      const lines = data.split(/\n/gm);
      const gamePathLine = lines.find(line => line.indexOf(GAME_EXEC) !== -1);
      return (gamePathLine !== undefined)
        ? Promise.resolve(getTrimmedPath(gamePathLine))
        : Promise.resolve(undefined);
  });
}

function main(context) {
	//This is the main function Vortex will run when detecting the game extension. 
	context.registerGame({
    id: GAME_ID,
    name: 'Daggerfall Unity',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => path.join('DaggerfallUnity_Data', 'StreamingAssets'),
    logo: 'gameart.jpg',
    executable: () => GAME_EXEC,
    requiredFiles: [
      GAME_EXEC,
    ],
  });

	return true
}

module.exports = {
  default: main,
};