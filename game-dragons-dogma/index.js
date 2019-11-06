const path = require('path');
const { fs, log, util } = require('vortex-api');

function findGame() {
  return util.steam.findByName('Dragon\'s Dogma: Dark Arisen')
    .then(game => game.gamePath);
}

function modPath() {
  return path.join('nativePC', 'rom');
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, modPath()));
}

function main(context) {
  context.requireExtension('mtframework-arc-support');

  context.registerGame({
    id: 'dragonsdogma',
    name: 'Dragon\'s Dogma',
    mergeMods: true,
    mergeArchive: filePath => path.basename(filePath).toLowerCase() === 'game_main.arc',
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: () => 'DDDA.exe',
    requiredFiles: [
      'DDDA.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 367500,
    },
  });

  context.registerInstaller('dragons-dogma-rom-mod', 25, testSupportedContent, installContent);

  return true;
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  const romDir = 'rom';
  // Going to filter out all directories and any files
  //  that are outside the 'rom' folder as they're clearly
  //  not supposed to be loaded by the game. (these are usually)
  //  readme files which may cause collisions.
  const filtered = files.filter(file => 
    (path.dirname(file) !== '.') 
    && (path.extname(file) !== '') 
    && (file.toLowerCase().indexOf(romDir) !== -1));

  const instructions = filtered.map(file => {
    const romDirIndex = file.toLowerCase().indexOf(romDir) + romDir.length;
    const destination = file.substr(romDirIndex)

    return {
      type: 'copy',
      source: file,
      destination: destination,
    };
  })

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  return gameId !== 'dragonsdogma'
    ? Promise.resolve({ supported: false })
    : Promise.resolve({ supported: files.find(file => 
      file.toLowerCase().indexOf('rom') !== -1) !== undefined });
}

module.exports = {
  default: main,
};
