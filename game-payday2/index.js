const
  fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird'),
  rjson = require('relaxed-json'),
  { promisify } = require('util'),
  { actions, log, util } = require('vortex-api'),
  winapi = require('winapi-bindings');

const MANIFEST_FILE = 'mod.txt';
const GAME_ID = 'payday2';
const PTRN_CONTENT = path.sep + 'mods' + path.sep;

class PAYDAY2 {
  /*********
  ** Vortex API
  *********/
  /**
   * Construct an instance.
   * @param {IExtensionContext} context -- The Vortex extension context.
   */
  constructor(context) {
    // properties used by Vortex
    this.context = context;
    this.id = GAME_ID;
    this.name = 'PAYDAY 2';
    this.logo = 'gameart.jpg';
    this.requiredFiles = ['payday2_win32_release.exe'];
    this.details = {
      steamAppId: 218620
    };
    this.mergeMods = true;
    this.requiresCleanup = true;
    this.shell = process.platform == 'win32';

    // custom properties
    this.defaultPaths = [
      // Windows
      'C:\\Program Files (x86)\\Steam\\steamapps\\common\\PAYDAY 2'
    ];
  }

  /**
   * Asynchronously find the game install path.
   *
   * This function should return quickly and, if it returns a value, it should definitively be the
   * valid game path. Usually this function will query the path from the registry or from steam.
   * This function may return a promise and it should do that if it's doing I/O.
   *
   * This may be left undefined but then the tool/game can only be discovered by searching the disk
   * which is slow and only happens manually.
   */
  async queryPath() {
    // check Steam
    let game = await util.steam.findByAppId('218620');
    if (game)
      return game.gamePath;

    // check default paths
    for (let defaultPath of this.defaultPaths)
    {
      if (await this.getPathExistsAsync(defaultPath))
        return defaultPath;
    }
  }

  /**
   * Get the path of the tool executable relative to the tool base path, i.e. binaries/UT3.exe or
   * TESV.exe. This is a function so that you can return different things based on the operating
   * system for example but be aware that it will be evaluated at application start and only once,
   * so the return value can not depend on things that change at runtime.
   */
  executable() {
    return "payday2_win32_release.exe"
  }

  /**
   * Get the default directory where mods for this game should be stored.
   * 
   * If this returns a relative path then the path is treated as relative to the game installation
   * directory. Simply return a dot ( () => '.' ) if mods are installed directly into the game
   * directory.
   */ 
  queryModPath()
  {
    return 'mods';
  }

  /**
   * Optional setup function. If this game requires some form of setup before it can be modded (like
   * creating a directory, changing a registry key, ...) do it here. It will be called every time
   * before the game mode is activated.
   * @param {IDiscoveryResult} discovery -- basic info about the game being loaded.
   */
  async setup(discovery)
  {
    // skip if BLT found
    let bltPath = path.join(discovery.path, 'WSOCK32.dll');
    let bltFound = await this.getPathExistsAsync(bltPath);
    if (bltFound)
      return;

    // show need-BLT dialogue
    var context = this.context;
    return new Promise((resolve, reject) => {
      context.api.store.dispatch(
        actions.showDialog(
          'question',
          'Action required',
          { text: 'You must install SuperBLT to use mods with PAYDAY 2.\n(Old BLT is no longer supported.)\n\nClick below to go to the download page.' },
          [
            { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
            { label: 'Go to SuperBLT\'s page', action: () => { util.opn('https://superblt.znix.xyz/').catch(err => undefined); reject(new util.UserCanceled()); } }
          ]
        )
      );
    });
  }


  /*********
  ** Internal methods
  *********/
  /**
   * Asynchronously check whether a file or directory path exists.
   * @param {string} path - The file or directory path.
   */
  async getPathExistsAsync(path)
  {
    try {
     await promisify(fs.access)(path, fs.constants.R_OK);
     return true;
    }
    catch(err) {
      return false;
    }
  }

  /**
   * Asynchronously read a registry key value.
   * @param {string} hive - The registry hive to access. This should be a constant like Registry.HKLM.
   * @param {string} key - The registry key.
   * @param {string} name - The name of the value to read.
   */
  async readRegistryKeyAsync(hive, key, name)
  {
    try {
      const instPath = winapi.RegGetValue(hive, key, name);
      if (!instPath) {
        throw new Error('empty registry key');
      }
      return Promise.resolve(instPath.value);
    } catch (err) {
      return Promise.resolve(undefined);
    }
  }
}

async function getModName(destinationPath, manifestFile) {
  const manifestPath = path.join(destinationPath, manifestFile);
  try {
    const file = await promisify(fs.readFile)(manifestPath, { encoding: 'utf8' });
    // it seems to be not uncommon that these files are not valid json,
    // so we use relaxed-json to improve our chances of parsing successfully
    const data = rjson.parse(util.deBOM(file));
    return (data.name !== undefined)
      ? Promise.resolve(data.name.replace(/[^a-zA-Z0-9]/g, ''))
      : Promise.reject(new util.DataInvalid('Invalid mod.txt file'));
  } catch(err) {
    log('error', 'Unable to parse mod.txt file', manifestPath);
    return path.basename(destinationPath, '.installing');
  }
}

async function testRootFolder(files, gameId) {
  // We assume that any mod containing "/mods/" in its directory
  //  structure is meant to be deployed to the root folder.
  const filtered = files.filter(file => file.endsWith(path.sep))
    .map(file => path.join('fakeDir', file));
  const contentDir = filtered.find(file => file.endsWith(PTRN_CONTENT));
  const supported = ((gameId === GAME_ID)
    && (contentDir !== undefined));

  return { supported };
}

async function installRootFolder(files, destinationPath) {
  // We're going to deploy "/mods/" and whatever folders come alongside it.
  //  i.e. SomeMod.7z
  //  Will be deployed     => ../SomeMod/Content/
  //  Will be deployed     => ../SomeMod/Mods/
  //  Will NOT be deployed => ../Readme.doc
  const contentFile = files.find(file => path.join('fakeDir', file).endsWith(PTRN_CONTENT));
  const idx = contentFile.indexOf(PTRN_CONTENT) + 1;
  const rootDir = path.basename(contentFile.substring(0, idx));
  const filtered = files.filter(file => (path.extname(file) !== '')
    && (file.indexOf(rootDir) !== -1)
    && (path.extname(file) !== '.txt'));
  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    };
  });

  return { instructions };
}

async function testSupported(files, gameId) {
  const supported = (gameId === GAME_ID)
    && (files.find(file => path.basename(file).toLowerCase() === MANIFEST_FILE) !== undefined)
    && (files.find(file => {
      // We create a prefix fake directory just in case the content
      //  folder is in the archive's root folder. This is to ensure we
      //  find a match for "/mods/"
      const testFile = path.join('fakeDir', file);
      return (testFile.endsWith(PTRN_CONTENT));
    }) === undefined);
  return { supported }
}

async function install(files,
                destinationPath,
                gameId,
                progressDelegate) {
  // The archive may contain multiple manifest files which would
  //  imply that we're installing multiple mods.
  const manifestFiles = files.filter(file =>
    path.basename(file).toLowerCase() === MANIFEST_FILE);

  const mods = manifestFiles.map(manifestFile => {
    const rootFolder = path.dirname(manifestFile);
    const manifestIndex = manifestFile.indexOf(MANIFEST_FILE);
    const modFiles = files.filter(file =>
      (file.indexOf(rootFolder) !== -1)
      && (path.dirname(file) !== '.')
      && (path.extname(file) !== ''));

    return {
      manifestFile,
      rootFolder,
      manifestIndex,
      modFiles,
    };
  });

  return Promise.map(mods, mod => getModName(destinationPath, mod.manifestFile)
    .then(manifestModName => {
      const modName = (mod.rootFolder !== '.')
        ? mod.rootFolder
        : manifestModName;

      return mod.modFiles.map(file => {
        const destination = path.join(modName, file.substr(mod.manifestIndex));
        return {
          type: 'copy',
          source: file,
          destination: destination,
        };
      });
    }))
    .then(data => {
      const instructions = [].concat.apply([], data);
      return Promise.resolve({ instructions });
    });
}

module.exports = {
  default: function(context) {
    const getDiscoveryPath = () => {
      const state = context.api.store.getState();
      const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
      if ((discovery === undefined) || (discovery.path === undefined)) {
        // should never happen and if it does it will cause errors elsewhere as well
        log('error', 'payday2 was not discovered');
        return undefined;
      }

      return discovery.path;
    }
    context.registerGame(new PAYDAY2(context));
    context.registerInstaller('payday2-installer', 50, testSupported, install);
    context.registerInstaller('pd2rootfolder', 50, testRootFolder, installRootFolder);
    context.registerModType('pd2rootfolder', 25, (gameId) => (gameId === GAME_ID),
      () => getDiscoveryPath(), (instructions) => Promise.resolve(instructions.find(instr =>
        (instr.type === 'copy') && (instr.destination.startsWith('mods' + path.sep))) !== undefined));
  }
}
