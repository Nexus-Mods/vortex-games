const
  path = require('path'),
  Promise = require('bluebird'),
  rjson = require('relaxed-json'),
  { promisify } = require('util'),
  { actions, fs, log, selectors, util } = require('vortex-api'),
  winapi = require('winapi-bindings');

const MANIFEST_FILE = 'manifest.json';
const GAME_ID = 'stardewvalley';
const PTRN_CONTENT = path.sep + 'Content' + path.sep;

class StardewValley {
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
    this.name = 'Stardew Valley';
    this.logo = 'gameart.jpg';
    this.requiredFiles = process.platform == 'win32'
      ? ['Stardew Valley.exe']
      : ['StardewValley', 'StardewValley.exe'];
    this.details = {
      steamAppId: 413150
    };
    this.mergeMods = true;
    this.requiresCleanup = true;
    this.shell = process.platform == 'win32';

    // custom properties
    this.defaultPaths = [
      // Linux
      process.env.HOME + '/GOG Games/Stardew Valley/game',
      process.env.HOME + '/.local/share/Steam/steamapps/common/Stardew Valley',

      // Mac
      '/Applications/Stardew Valley.app/Contents/MacOS',
      process.env.HOME + '/Library/Application Support/Steam/steamapps/common/Stardew Valley/Contents/MacOS',

      // Windows
      'C:\\Program Files (x86)\\GalaxyClient\\Games\\Stardew Valley',
      'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Stardew Valley',
      'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley'
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
    let game = await util.steam.findByAppId('413150');
    if (game)
      return game.gamePath;

    // check GOG Galaxy
    let path =
      await this.readRegistryKeyAsync('HKEY_LOCAL_MACHINE', 'SOFTWARE\\GOG.com\\Games\\1453375253', 'PATH')
      || await this.readRegistryKeyAsync('HKEY_LOCAL_MACHINE', 'SOFTWARE\\GOG.com\\Games\\1453375253', 'path')
      || await this.readRegistryKeyAsync('HKEY_LOCAL_MACHINE', 'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\1453375253', 'PATH')
      || await this.readRegistryKeyAsync('HKEY_LOCAL_MACHINE', 'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\1453375253', 'path')
    if (path && await this.getPathExistsAsync(path))
      return path;

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
    return process.platform == 'win32'
      ? 'StardewModdingAPI.exe'
      : 'StardewValley';
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
    return 'Mods';
  }

  /**
   * Optional setup function. If this game requires some form of setup before it can be modded (like
   * creating a directory, changing a registry key, ...) do it here. It will be called every time
   * before the game mode is activated.
   * @param {IDiscoveryResult} discovery -- basic info about the game being loaded.
   */
  async setup(discovery)
  {
    // skip if SMAPI found
    let smapiPath = path.join(discovery.path, 'StardewModdingAPI.exe');
    let smapiFound = await this.getPathExistsAsync(smapiPath);
    if (smapiFound)
      return;

    // show need-SMAPI dialogue
    var context = this.context;
    return new Promise((resolve, reject) => {
      context.api.store.dispatch(
        actions.showDialog(
          'question',
          'Action required',
          { text: 'You must install SMAPI to use mods with Stardew Valley.' },
          [
            { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
            { label: 'Go to SMAPI page', action: () => { util.opn('https://smapi.io').catch(err => undefined); reject(new util.UserCanceled()); } }
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
     await fs.statAsync(path);
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
    const file = await fs.readFileAsync(manifestPath, { encoding: 'utf8' });
    // it seems to be not uncommon that these files are not valid json,
    // so we use relaxed-json to improve our chances of parsing successfully
    const data = rjson.parse(util.deBOM(file));
    return (data.Name !== undefined)
      ? Promise.resolve(data.Name.replace(/[^a-zA-Z0-9]/g, ''))
      : Promise.reject(new util.DataInvalid('Invalid manifest.json file'));
  } catch(err) {
    log('error', 'Unable to parse manifest.json file', manifestPath);
    return path.basename(destinationPath, '.installing');
  }
}

async function testRootFolder(files, gameId) {
  // We assume that any mod containing "/Content/" in its directory
  //  structure is meant to be deployed to the root folder.
  const filtered = files.filter(file => file.endsWith(path.sep))
    .map(file => path.join('fakeDir', file));
  const contentDir = filtered.find(file => file.endsWith(PTRN_CONTENT));
  const supported = ((gameId === GAME_ID)
    && (contentDir !== undefined));

  return { supported };
}

async function installRootFolder(files, destinationPath) {
  // We're going to deploy "/Content/" and whatever folders come alongside it.
  //  i.e. SomeMod.7z
  //  Will be deployed     => ../SomeMod/Content/
  //  Will be deployed     => ../SomeMod/Mods/
  //  Will NOT be deployed => ../Readme.doc
  const contentFile = files.find(file => path.join('fakeDir', file).endsWith(PTRN_CONTENT));
  const idx = contentFile.indexOf(PTRN_CONTENT) + 1;
  const rootDir = path.basename(contentFile.substring(0, idx));
  const filtered = files.filter(file => !file.endsWith(path.sep)
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
      //  find a match for "/Content/"
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
      && !file.endsWith(path.sep));

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
        log('error', 'stardewvalley was not discovered');
        return undefined;
      }

      return discovery.path;
    }
    context.registerGame(new StardewValley(context));
    context.registerInstaller('stardew-valley-installer', 50, testSupported, install);
    context.registerInstaller('sdvrootfolder', 50, testRootFolder, installRootFolder);
    context.registerModType('sdvrootfolder', 25, (gameId) => (gameId === GAME_ID),
      () => getDiscoveryPath(), (instructions) => {
        // Only interested in copy instructions.
        const copyInstructions = instructions.filter(instr => instr.type === 'copy');
        // This is a tricky pattern so we're going to 1st present the different packaging
        //  patterns we need to cater for:
        //  1. Replacement mod with "Content" folder. Does not require SMAPI so no
        //    manifest files are included.
        //  2. Replacement mod with "Content" folder + one or more SMAPI mods included
        //    alongside the Content folder inside a "Mods" folder.
        //  3. A regular SMAPI mod with a "Content" folder inside the mod's root dir.
        //
        // pattern 1:
        //  - Ensure we don't have manifest files
        //  - Ensure we have a "Content" folder
        //
        // To solve patterns 2 and 3 we're going to:
        //  Check whether we have any manifest files, if we do, we expect the following
        //    archive structure in order for the modType to function correctly:
        //    archive.zip =>
        //      ../Content/
        //      ../Mods/
        //      ../Mods/A_SMAPI_MOD\manifest.json
        const hasManifest = copyInstructions.find(instr =>
          instr.destination.endsWith(MANIFEST_FILE))
        const hasModsFolder = copyInstructions.find(instr =>
          instr.destination.startsWith('Mods' + path.sep)) !== undefined;
        const hasContentFolder = copyInstructions.find(instr =>
          instr.destination.startsWith('Content' + path.sep)) !== undefined

        return (hasManifest)
          ? Promise.resolve(hasContentFolder && hasModsFolder)
          : Promise.resolve(hasContentFolder);
      });

    context.once(() => {
      context.api.onAsync('added-files', async (profileId, files) => {
        const state = context.api.store.getState();
        const profile = selectors.profileById(state, profileId);
        if (profile.gameId !== GAME_ID) {
          // don't care about any other games
          return;
        }
        const game = util.getGame(GAME_ID);
        const discovery = selectors.discoveryByGame(state, GAME_ID);
        const modPaths = game.getModPaths(discovery.path);
        const installPath = selectors.installPathForGame(state, GAME_ID);

        await Promise.map(files, async entry => {
          // only act if we definitively know which mod owns the file
          if (entry.candidates.length === 1) {
            const mod = util.getSafe(state.persistent.mods, [GAME_ID, entry.candidates[0]], undefined);
            const relPath = path.relative(modPaths[mod.type], entry.filePath);
            const targetPath = path.join(installPath, mod.id, relPath);
            // copy the new file back into the corresponding mod, then delete it. That way, vortex will
            // create a link to it with the correct deployment method and not ask the user any questions
            await fs.ensureDirAsync(path.dirname(targetPath));
            await fs.copyAsync(entry.filePath, targetPath);
            await fs.removeAsync(entry.filePath);
          }
        });
      });
    });
  }
}
