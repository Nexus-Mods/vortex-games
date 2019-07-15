const path = require('path');
const { fs, log, util } = require('vortex-api');

// Nexus Mods id for the game.
const BLOODSTAINED_ID = 'bloodstainedritualofthenight';

// All BSRotN mods will be .pak files
const MOD_FILE_EXT = ".pak";

let tools = [
  {
    id: 'BloodstainedRotNLauncher',
    name: 'Launcher',
    logo: 'gameart.jpg',
    executable: () => 'BloodstainedRotN.exe',
    relative: true,
    requiredFiles: [
      'BloodstainedRotN.exe',
    ],
  }
]

function findGame() {
  return util.steam.findByAppId('692850')
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'BloodstainedRotN/Content/Paks/~mod'),
    () => Promise.resolve());
}

function installContent(files) {
  // The .pak file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
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
  let supported = (gameId === BLOODSTAINED_ID) &&
    (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);

  if (supported && files.find(file =>
      (path.basename(file).toLowerCase() === 'moduleconfig.xml')
      && (path.basename(path.dirname(file)).toLowerCase() === 'fomod'))) {
    supported = false;
  }

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function main(context) {
  context.registerGame({
    id: BLOODSTAINED_ID,
    name: 'Bloodstained: Ritual of the Night',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'BloodstainedRotN/Content/Paks/~mod',
    logo: 'gameart.jpg',
    executable: () => 'BloodstainedROTN/Binaries/Win64/BloodstainedRotN-Win64-Shipping.exe',
    requiredFiles: [
      'BloodstainedRotN.exe',
      'BloodstainedROTN/Binaries/Win64/BloodstainedRotN-Win64-Shipping.exe' 
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 692850,
    },
  });

  context.registerInstaller('bloodstainedrotn-mod', 25, testSupportedContent, installContent);

  return true;
}

module.exports = {
  default: main,
};
