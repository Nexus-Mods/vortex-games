const path = require('path');
const { fs, log, util } = require('vortex-api');

// Nexus Mods id for the game.
const TW3KINDOMS_ID = 'totalwarthreekingdoms';

// All BSRotN mods will be .pak files
const MOD_FILE_EXT = ".pack";

let tools = [
  {
    id: 'TW3KingdomsTweak',
    name: 'Tweak',
    logo: 'gameart.jpg',
    executable: () => 'assembly_kit/binaries/Tweak.retail.x64.exe',
    relative: true,
    requiredFiles: [
      'assembly_kit/binaries/Tweak.retail.x64.exe'
    ],
  },
  {
    id: 'TW3KingdomsBOB',
    name: 'B.O.B.',
    logo: 'gameart.jpg',
    executable: () => 'assembly_kit/binaries/BoB.retail.x64.exe',
    relative: true,
    requiredFiles: [
      'assembly_kit/binaries/BoB.retail.x64.exe'
    ],
  }
]

function findGame() {
  return util.steam.findByAppId('779340')
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'data'),
    () => Promise.resolve());
}

function installContent(files) {
  // The .pack file is expected to always be positioned in the data directory we're going to disregard anything placed outside the root.
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

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === TW3KINDOMS_ID) &&
    (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function main(context) {
  context.registerGame({
    id: TW3KINDOMS_ID,
    name: 'Total War: Three Kingdoms',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.jpg',
    executable: () => 'launcher/launcher.exe',
    requiredFiles: [
      'launcher/launcher.exe', 
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 779340,
    },
  });

  context.registerInstaller('tw3kingdoms-mod', 25, testSupportedContent, installContent);

  return true;
}

module.exports = {
  default: main,
};
