const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, util } = require('vortex-api');

// Monster Hunter: World mods are consistently contained within
//  the 'nativePC' folder. We're going to depend on this folder
//  existing within the archive when trying to decide whether the
//  mod is supported or not.
const NATIVE_PC_FOLDER = 'nativePC';

// We can rely on the steam uninstall registry key when
//  figuring out the install location for MH:W; but this is
//  of course only valid for steam installations.
//  TODO: Find and test a regkey which does not depend
//  on steam to cater for non-steam installations.
const steamReg = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 582010';

const MHW_EXEC = 'MonsterHunterWorld.exe';

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      steamReg,
      'InstallLocation');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('MONSTER HUNTER: WORLD')
      .then(game => game.gamePath);
  }
}

function prepareForModding(discovery) {
    return fs.ensureDirAsync(path.join(discovery.path, NATIVE_PC_FOLDER));
}

function main(context) {
  context.registerGame({
    id: 'monsterhunterworld',
    name: 'Monster Hunter: World',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => NATIVE_PC_FOLDER,
    logo: 'gameart.jpg',
    executable: () => MHW_EXEC,
    requiredFiles: [
      MHW_EXEC,
    ],
    details: {
      steamAppId: '582010',
    },
    setup: prepareForModding,
  });

  context.registerInstaller('monster-hunter-mod', 25, isSupported, installContent);

  return true;
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  // Grab any modfile that is nested withing 'nativePC'.
  const modFile = files.find(file =>
    file.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1);
  
  // Find the index of the natives folder + natives folder length + path.sep; going
  //  to remove everything preceding that point in the filepath.
  const idx = modFile.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase())
    + NATIVE_PC_FOLDER.length + 1;

  // Filter out unwanted files.
  const filtered = files.filter(file =>
    (path.extname(file) !== '')
    && (path.dirname(file.toLowerCase()).indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    };
  })
  
  return Promise.resolve({instructions});
}

function isSupported(files, gameId) {
  // Ensure that the archive structure has the nativePC Folder present.
  const supported = (gameId === 'monsterhunterworld') 
    && (files.find(file =>
      file.toLowerCase().indexOf(NATIVE_PC_FOLDER.toLowerCase()) !== -1) !== undefined)
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

module.exports = {
  default: main
};
