const { app, remote } = require('electron');
const path = require('path');
const { fs, util } = require('vortex-api');

const appUni = app || remote.app;
const LOCAL_LOW = path.resolve(appUni.getPath('appData'),
  '..', 'LocalLow', 'Daggerfall Workshop', 'Daggerfall Unity');
const ENV_LOG = path.join(LOCAL_LOW, 'DFTFU_Environment.log');
const GAME_ID = 'daggerfallunity';
const GAME_EXEC = 'DaggerfallUnity.exe';
const CMD_PATTERN = 'CommandLine | ';
const VERSION_PATTERN = 'Version | ';
const DFMOD_EXT = '.dfmod';

function resolveGameVersion() {
  return fs.readFileAsync(ENV_LOG, { encoding: 'utf8' })
    .then(data => {
      const match = data.match(/^Version \| [0-9].[0-9].*/gm);
      return (match)
        ? Promise.resolve(match[0].substr(VERSION_PATTERN.length).trim())
        : Promise.reject(new util.DataInvalid('Unable to resolve game version'));
  })
}

function findGame() {
  const getTrimmedPath = (gamePath) => {
    const trimmed = gamePath.substr(CMD_PATTERN.length).trim().replace(/\"/g, '');
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

function testSupported(files, gameId) {
  const notSupported = () => Promise.resolve({ supported: false, requiredFiles: [], });
  const dfmods = files.filter(file => path.extname(file) === DFMOD_EXT);

  // No point proceeding if we only find 0-1 dfmods.
  if (dfmods.length < 2)
    return notSupported();

  // Game extension only supports Windows currently, so if we are able to find
  //  the 'windows' substring within the filepath, we assume that's the mod
  //  copy that's supposed to be deployed.
  if (dfmods.find(mod => path.dirname(mod).toLowerCase().indexOf('windows') !== -1) === undefined)
    return notSupported();

  const supported = ((dfmods.length > 1) && (gameId === GAME_ID))
    ? (new Set(dfmods.map(mod => path.basename(mod))).size !== dfmods.length)
    : false;
  
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function install(files, destinationPath) {
  const result = {
    instructions: [],
  };
  const dfmods = files.filter(file => path.extname(file) === DFMOD_EXT)
                      .map(mod => path.basename(mod));
  let filtered = files.filter(file => !file.endsWith(path.sep));
  filtered.forEach(file => {
    if (dfmods.indexOf(path.basename(file)) !== -1) {
      if (path.dirname(file).toLowerCase().indexOf('windows') !== -1) {
        // This is the dfmod we want to install.
        result.instructions.push({
          type: 'copy',
          source: file,
          destination: path.basename(file),
        });
      }
    } else {
      // Non-dfmod file, might be needed - going to include it just in case
      //  (also only if it's inside the windows folder)
      if (path.dirname(file).toLowerCase().indexOf('windows') !== -1) {
        result.instructions.push({
          type: 'copy',
          source: file,
          destination: file,
        });
      }
    }
  });

  return Promise.resolve(result);
}

function main(context) {
	context.registerGame({
    id: GAME_ID,
    name: 'Daggerfall Unity',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => path.join('DaggerfallUnity_Data', 'StreamingAssets'),
    logo: 'gameart.jpg',
    getGameVersion: resolveGameVersion,
    executable: () => GAME_EXEC,
    requiredFiles: [
      GAME_EXEC,
    ],
  });

  // The game is multi-platform and many modders seem to be nesting the mod files
  //  inside the target platform, we're only interested in the windows version
  //  at this point
  context.registerInstaller('dfmodmultiplatform', 15, testSupported, install);

	return true
}

module.exports = {
  default: main,
};