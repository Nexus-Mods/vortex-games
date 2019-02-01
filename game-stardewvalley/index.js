const
  fs = require('fs'),
  opn = require('opn'),
  path = require('path'),
  { promisify } = require('util'),
  { actions, util } = require('vortex-api'),
  winapi = require('winapi-bindings');

const MANIFEST_FILE = 'manifest.json';

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
    this.id = 'stardewvalley';
    this.name = 'Stardew Valley';
    this.logo = 'gameart.png';
    this.requiredFiles = process.platform == 'win32'
      ? ['Stardew Valley.exe']
      : ['StardewValley', 'StardewValley.exe'];
    this.details = {
      steamAppId: 413150
    };
    this.mergeMods = false;
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
      || await this.readRegistryKeyAsync('HKEY_LOCAL_MACHINE', 'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\1453375253', 'PATH');
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
          { message: 'You must install SMAPI to use mods with Stardew Valley.' },
          [
            { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
            { label: 'Go to SMAPI page', action: () => { opn('https://smapi.io').catch(err => undefined); reject(new util.UserCanceled()); } }
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

async function testSupported(files, gameId) {
  const supported = (gameId === 'stardewvalley') && 
    (files.find(file => path.basename(file).toLowerCase() === MANIFEST_FILE) !== undefined)
  return { supported }
}

async function install(files,
                destinationPath,
                gameId,
                progressDelegate) {
  // We're going to assume that the mod's root directory is wherever
  //  the manifest.json file is located. Everything outside the root
  //  will be removed.
  const filtered = files.filter(file => 
    (path.dirname(file) !== '.') 
    && (path.extname(file) !== ''));

    const manifestFile = files.find(file => path.basename(file).toLowerCase() === MANIFEST_FILE).toLowerCase();
    const manifestIndex = manifestFile.indexOf(MANIFEST_FILE);
    const instructions = filtered.map(file => {
      const destination = file.substr(manifestIndex);

      return {
        type: 'copy',
        source: file,
        destination: destination,
      };
    });

  return Promise.resolve({ instructions })
}

module.exports = {
  default: function(context) {
    context.registerGame(new StardewValley(context));
    context.registerInstaller('stardew-valley-installer', 50, testSupported, install);
  }
}
