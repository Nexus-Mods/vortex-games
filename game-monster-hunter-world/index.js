const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { actions, fs, util } = require('vortex-api');

const DINPUT = 'dinput8.dll';
const GAME_ID = 'monsterhunterworld';
const RESHADE_DIRNAME = 'reshade-shaders';


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

function prepareForModding(discovery, api) {
  const modEngineDInput = path.join(discovery.path, DINPUT);
  const showModEngineDialog = () => new Promise((resolve, reject) => {
    api.store.dispatch(actions.showDialog('question', 'Action required',
      {
        message: 'Monster Hunter: World requires "Stracker\'s Loader" for most mods to install and function correctly.\n'
                + 'Vortex is able to install Stracker\'s Loader automatically (as a mod) but please ensure it is enabled\n'
                + 'and deployed at all times.'
      },
      [
        { label: 'Continue', action: () => resolve() },
        { label: 'Go to Stracker\'s Loader mod page', action: () => {
            util.opn('https://www.nexusmods.com/monsterhunterworld/mods/1982').catch(err => undefined);
            resolve();
        }},
      ]));
  });

  // Check whether Stracker's Loader is installed.
  return fs.ensureDirWritableAsync(path.join(discovery.path, NATIVE_PC_FOLDER), () => Promise.resolve())
    .then(() => fs.statAsync(modEngineDInput)
      .catch(err => (err.code === 'ENOENT')
        ? showModEngineDialog()
        : Promise.reject(err)));
}

function main(context) {
  const missingReshade = (api) => new Promise((resolve, reject) => {
    api.store.dispatch(actions.showDialog('warning', 'Action required', {
      message: 'You\'re attempting to install what appears to be a ReShade mod, but '
             + 'Vortex is unable to confirm whether\n ReShade is installed. \n\nThe mod '
             + 'will still be installed, but please keep in mind that this mod will '
             + 'not function without ReShade.',
    },
    [
      { label: 'Continue', action: () => resolve() },
      { label: 'Download ReShade', action: () => {
          util.opn('https://reshade.me').catch(err => undefined);
          resolve();
      }},
    ]));
  });

  const getDiscoveryPath = (api) => {
    const store = api.store;
    const state = store.getState();
    const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
    if ((discovery === undefined) || (discovery.path === undefined)) {
      // should never happen.
      log('error', 'monster hunter: world was not discovered');
      return undefined;
    }

    return discovery.path;
  }

  context.registerGame({
    id: GAME_ID,
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
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  const getPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    if (discovery !== undefined) {
      return discovery.path;
    }
    else {
      return undefined;
    }
  };

  const testReshade = (instructions) => {
    const filtered = instructions.filter(instr => (instr.type === 'copy') && (path.extname(instr.source) === '.ini'));
    return Promise.resolve(filtered.length > 0);
  };

  context.registerModType('mhwreshade', 25, gameId => gameId === GAME_ID, getPath, testReshade);
  context.registerInstaller('monster-hunter-mod', 25, isSupported, installContent);
  context.registerInstaller('mhwreshadeinstaller', 24, isReshadeMod, (files, destinationPath, gameId, progressDelegate) => {
    const filtered = files.filter(file => (path.extname(file) === '.ini'));
    const instructions = filtered.map(file => {
      return {
        type: 'copy',
        source: file,
        destination: path.basename(file),
      };
    });

    return fs.statAsync(path.join(getDiscoveryPath(context.api), RESHADE_DIRNAME))
      .then(() => Promise.resolve({ instructions }))
      .catch(() => missingReshade(context.api).then(() => Promise.resolve({ instructions })));
  });

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

function isReshadeMod(files, gameId) {
  const filtered = files.filter(file => (path.extname(file) === '.ini'));
  const supported = (gameId === GAME_ID) && (filtered.length > 0);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function isSupported(files, gameId) {
  // Ensure that the archive structure has the nativePC Folder present.
  const supported = (gameId === GAME_ID)
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