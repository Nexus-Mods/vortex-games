const Promise = require('bluebird');
const path = require('path');
const { fs, types, util } = require('vortex-api');

const GAME_ID = 'greedfall';

function findGame() {
  return util.steam.findByAppId("606880").then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'datalocal'), () => Promise.resolve());
}

function isFomod(files) {
  return files.find(file =>
      (path.basename(file).toLowerCase() === 'moduleconfig.xml')
      && (path.basename(path.dirname(file)).toLowerCase() === 'fomod'));
}

function testMod(files, gameId) {
  const supported = (gameId === GAME_ID) && !isFomod(files);

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

/**
 * @param {string[]} files
 * @param {string} destinationPath
 */
function installMod(files, destinationPath) {
  const instructions = files.map(file => {
    const segments = file.split(path.sep);
    const offset = segments.findIndex(seg => seg.toLowerCase() === 'datalocal');
    const outPath = offset !== -1
      ? segments.slice(offset + 1).join(path.sep)
      : file;

    if (file.endsWith(path.sep)) {
      return {
        type: 'mkdir',
        destination: outPath,
      };
    } else {
      return {
        type: 'copy',
        source: file,
        destination: outPath,
      };
    }
  });

  return Promise.resolve({ instructions });
}



const gameParameters = {
  id: GAME_ID,
  name: 'GreedFall',
  logo: 'gameart.png',
  mergeMods: true,
  queryPath: findGame,
  queryModPath: () => 'datalocal',
  executable: () => 'GreedFall.exe',
  requiredFiles: ['GreedFall.exe'],
  details:
  {
    steamAppId: "606880",
  },
  setup: prepareForModding,
}

function main(context) {
  context.registerGame(gameParameters);
  context.registerInstaller('greedfall-mod', 25, testMod, installMod);

  return true;
}

module.exports = {
  default: main
};
