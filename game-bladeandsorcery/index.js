const Promise = require('bluebird');
const path = require('path');
const { actions, fs, log, util } = require('vortex-api');
const rjson = require('relaxed-json');
const semver = require('semver');

// Nexus Mods id for the game.
const BLADEANDSORCERY_ID = 'bladeandsorcery';
const RESOURCES_FILE = 'resources.assets';
const UMA_PRESETS_FOLDER = 'UMAPresets';

// MulleDK19's seems to be using the ConstructCache folder to store
//  mod textures separately ? great...
const CONSTRUCT_CACHE = 'ConstructCache';

// MulleDK19 B&S mods are expected to have this json file at its root directory.
const MULLE_MOD_INFO = 'mod.json';

// Official mod manifest file.
const OFFICIAL_MOD_MANIFEST = 'manifest.json';

// The global file holds current gameversion information
//  we're going to use this to compare against a mod's expected
//  gameversion and inform users of possible incompatibility.
//  (The global file is located in the game's StreamedAssets/Default path)
const GLOBAL_FILE = 'Global.json';

// let tools = [
//   {
//     id: 'BandSModLoader',
//     name: 'MulleDK19 Mod Loader',
//     executable: () => 'BASModLoaderConfig.exe',
//     requiredFiles: [
//       'BASModLoaderConfig.exe',
//     ],
//     relative: true,
//   }
// ]

async function getJSONElement(filePath, element) {
  return fs.readFileAsync(filePath, { encoding: 'utf-8' })
    .then(data => {
      try {
        const modData = rjson.parse(util.deBOM(data));
        const elementData = util.getSafe(modData, [element], undefined);
        return elementData !== undefined
          ? Promise.resolve(elementData)
          : Promise.reject(new util.DataInvalid(`"${element}" JSON element is missing`));
      } catch (err) {
        return Promise.reject(err);
      }
    });
}

async function getModName(destination, modFile, element, ext) {
  const modFilePath = path.join(destination, modFile);
  let modName;
  try {
    modName = await getJSONElement(modFilePath, element);
  } catch (err) {
    return Promise.reject(err);
  }

  if (modName === undefined) {
    return Promise.reject(new util.DataInvalid(`"${element}" JSON element is missing`));
  }

  return ext !== undefined
    ? Promise.resolve(path.basename(modName, ext))
    : Promise.resolve(modName);
}

//GAME IS ALSO FOUND IN THE OCULUS STORE!!
function findGame() {
  return util.steam.findByAppId('629730')
      .then(game => game.gamePath);
}

function prepareForModding(discovery, api) {
  // MulleDK19's mod loader is no longer being updated (http://treesoft.dk/bas/modloader/);
  //  leaving this code commented out for now, just in case he changes his mind.

  // return fs.statAsync(path.join(discovery.path, 'BASModLoaderConfig.exe'))
  //   .catch(err => api.sendNotification({
  //     type: 'info',
  //     message: 'MulleDK19 mod loader is missing',
  //     actions: [
  //       { title: 'More', action: (dismiss) =>
  //         api.showDialog('info', 'MulleDK19 Mod Loader', {
  //           text: api.translate('Certain B&S mods require MulleDK19\'s mod loader '
  //                             + 'to function correctly. These mods are easily identifiable '
  //                             + 'by the mod.json file; any mods that include that file will '
  //                             + 'require the mod loader to be installed and configured.')
  //         }, [ { label: 'Go to Mod Loader Page', action: () => {
  //           util.opn('http://treesoft.dk/bas/modloader/download.html');
  //           dismiss();
  //           }}, {label: 'Close', action: () => dismiss() } ])
  //       },
  //     ],
  //   }))
  //   .then(() =>
    return fs.ensureDirWritableAsync(path.join(discovery.path, streamingAssetsPath()),
      () => Promise.resolve());//);
}

function testModInstaller(files, gameId, fileName) {
  // Make sure we're able to support this mod.
  const supported = (gameId === BLADEANDSORCERY_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === fileName) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function streamingAssetsPath() {
  return path.join('BladeAndSorcery_Data', 'StreamingAssets');
}

async function checkModGameVersion(destination, discoveryPath, modFile) {
  try {
    const globalGameVersion = await getJSONElement(path.join(discoveryPath, streamingAssetsPath(), 'Default', GLOBAL_FILE), 'gameVersion');
    const modVersion = await getJSONElement(path.join(destination, modFile), 'GameVersion');
    const coercedMod = semver.coerce(modVersion.toString());
    const coercedGlobal = semver.coerce(globalGameVersion.toString());
    if ((coercedMod === null) || (coercedGlobal === null)) {
      return Promise.reject(new util.DataInvalid('Invalid GameVersion element'));
    }

    return Promise.resolve({
      match: semver.satisfies(coercedMod.version, coercedGlobal.version),
      modVersion: coercedMod.version,
      globalVersion: coercedGlobal.version,
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

async function installOfficialMod(files,
                        destinationPath,
                        gameId,
                        progressDelegate,
                        api) {
  const t = api.translate;
  const versionMismatchDialog = (gameVersion, modGameVersion) => new Promise((resolve, reject) => {
    api.store.dispatch(
      actions.showDialog(
        'warning',
        'Game Version Mismatch',
        { text: t('The mod you\'re attempting to install has been created for game version: "{{modVer}}"; '
                + 'the currently installed game version is: "{{gameVer}}", version mismatches may '
                + 'cause unexpected results inside the game, please keep this in mind if you choose to continue.',
        { replace: { modVer: modGameVersion, gameVer: gameVersion } }) },
        [
          { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
          {
            label: 'Continue installation', action: () => resolve()
          }
        ]
      )
    );
  });

  const modFile = files.find(file => path.basename(file).toLowerCase() === OFFICIAL_MOD_MANIFEST);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);
  const discoveryPath = getDiscoveryPath(api);

  const modName = await getModName(destinationPath, modFile, 'Name', undefined);
  const createInstructions = () => new Promise((resolve, reject) => {
    // Remove directories and anything that isn't in the rootPath.
    const filtered = files.filter(file =>
      ((file.indexOf(rootPath) !== -1)
      && (!file.endsWith(path.sep))));

    const instructions = filtered.map(file => {
      return {
        type: 'copy',
        source: file,
        destination: path.join(modName, file.substr(idx)),
      };
    });

    return resolve({ instructions });
  });
  return checkModGameVersion(destinationPath, discoveryPath, modFile)
    .then(res => {
      return (!res.match)
        ? versionMismatchDialog(res.globalVersion, res.modVersion)
            .then(() => createInstructions())
        : createInstructions();
    })
}

async function installMulleMod(files,
                        destinationPath,
                        gameId,
                        progressDelegate,
                        api) {
  // MulleDK19's mod loader is no longer being updated and will not function
  //  with B&S version 6.0 and higher (at least for now).
  api.sendNotification({
    type: 'info',
    message: 'Incompatible Mod',
    actions: [
      { title: 'More', action: (dismiss) =>
        api.showDialog('info', 'Incompatible Mod', {
          text: api.translate('The mod you\'re attempting to install is not compatible with '
                            + 'Blade and Sorcery 6.0+ and cannot be installed by Vortex. '
                            + 'Please check the mod page for an updated version.')
        }, [ { label: 'Close', action: () => dismiss() } ])
      },
    ],
  });
  return Promise.reject(new util.ProcessCanceled());
  // The mod.json file is expected to always be positioned in the root directory
  //  of the mod itself; we're going to create the mod folder ourselves and place
  //  the mod files within it.
  // Some mods contain a ConstructCache folder which seems to be used to store/cache
  //  certain textures. We're going to place these as well
  // const isCacheFile = (filePath) => (filePath.endsWith(path.sep))
  //                                && (filePath.indexOf(CONSTRUCT_CACHE) !== -1);
  // const cacheFiles = files.filter(file => isCacheFile(file));
  // let cacheIndex = undefined;
  // if (cacheFiles.length > 0) {
  //   // We just need to know the cache's index so we don't rely
  //   //  on how the mod author packaged his files.
  //   cacheIndex = cacheFiles[0].indexOf(CONSTRUCT_CACHE) + CONSTRUCT_CACHE.length;
  // }
  
  // const modFile = files.find(file => path.basename(file) === MULLE_MOD_INFO);
  // const idx = modFile.indexOf(path.basename(modFile));
  // const rootPath = path.dirname(modFile);
  // let modName = await getModName(destinationPath, modFile, 'Name', undefined);
  // modName = modName.replace(/[^a-zA-Z0-9]/g, '');
  // // Remove directories and anything that isn't in the rootPath.
  // const filtered = files.filter(file =>
  //   ((file.indexOf(rootPath) !== -1)
  //   && (!file.endsWith(path.sep))));

  // const instructions = filtered.map(file => {
  //   return {
  //     type: 'copy',
  //     source: file,
  //     destination: path.join('Mods', modName, file.substr(idx)),
  //   };
  // });

  // if (cacheIndex !== undefined) {
  //   cacheFiles.forEach(file => {
  //     instructions.push({
  //       type: 'copy',
  //       source: file,
  //       destination: path.join(CONSTRUCT_CACHE, file.substr(cacheIndex)),
  //     });
  //   });
  // }

  // return Promise.resolve({ instructions });
}

function installUMAPresetReplacer(files,
                         destinationPath,
                         gameId,
                         progressDelegate) {
  const resourcesFile = files.find(file => path.basename(file) === RESOURCES_FILE);
  const UMAPresetDir = files.find(file => path.basename(file) === UMA_PRESETS_FOLDER);
  let idx = (path.basename(path.dirname(UMAPresetDir)) !== '.')
    ? (path.basename(path.dirname(UMAPresetDir)).length)
    : 0;

  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file => 
    (!file.endsWith(path.sep)) && (path.basename(file) !== RESOURCES_FILE));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join('StreamingAssets', 'Default', file.substr(idx)),
    };
  });

  instructions.push({
    type: 'copy',
    source: resourcesFile,
    destination: resourcesFile,
  })

  return Promise.resolve({ instructions });
}

function instructionsHaveFile(instructions, fileName) {
  return new Promise((resolve, reject) => {
    const fileExists = instructions.find(inst => path.basename(inst.destination).toLowerCase() === fileName) !== undefined;
    return resolve(fileExists);
  })
}

function testUMAContent(instructions) {
  return new Promise((resolve, reject) => {
    const isUMAMod = (instructions.find(file => path.basename(file.destination) === RESOURCES_FILE) !== undefined)
                  && (instructions.find(file => path.dirname(file.destination).indexOf(UMA_PRESETS_FOLDER) !== -1) !== undefined);
    return resolve(isUMAMod);
  })
}

function testUMAPresetReplacer(files, gameId) {
  // This is a very unconventional installer as it expects a resources.assets
  //  file containing the textures of the preset + the UMA presets in JSON format.
  //  mod authors seem to be packing these alongside each other... fun...
  //  Most importantly: https://www.nexusmods.com/bladeandsorcery/mods/31?tab=files
  const supported = ((gameId === BLADEANDSORCERY_ID)
                  && (files.find(file => path.basename(file) === RESOURCES_FILE) !== undefined)
                  && (files.find(file => path.basename(file) === UMA_PRESETS_FOLDER) !== undefined))
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

const getDiscoveryPath = (api) => {
  const store = api.store;
  const state = store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', BLADEANDSORCERY_ID], undefined);
  if ((discovery === undefined) || (discovery.path === undefined)) {
    // should never happen and if it does it will cause errors elsewhere as well
    log('error', 'bladeandsorcery was not discovered');
    return '.';
  }

  return discovery.path;
}

// function getExecutable(discoveryPath) {
//   const legacyExec = 'Blade & Sorcery.exe';
//   const newExec = 'BladeAndSorcery.exe';
//   try {
//     fs.statSync(path.join(discoveryPath, legacyExec));
//     return legacyExec;
//   } catch (err) {
//     return newExec;
//   }
// }

function main(context) {
  const getUMADestination = () => {
    return path.join(getDiscoveryPath(context.api), 'BladeAndSorcery_Data');
  }

  const getOfficialDestination = () => {
    return path.join(getDiscoveryPath(context.api), streamingAssetsPath());
  }

  context.registerGame({
    id: BLADEANDSORCERY_ID,
    name: 'Blade & Sorcery',
    mergeMods: true,
    queryPath: findGame,
    //supportedTools: tools,
    // FOMOD installer will act as a replacer by default.
    queryModPath: () => path.join(streamingAssetsPath(), 'Default'),
    logo: 'gameart.jpg',
    executable: () => 'BladeAndSorcery.exe',
    requiredFiles: ['BladeAndSorcery.exe'],
    setup: (discovery) => prepareForModding(discovery, context.api),
    details: {
      steamAppId: 629730,
    },
  });

  context.registerInstaller('bas-uma-mod', 25, testUMAPresetReplacer, installUMAPresetReplacer);
  context.registerModType('bas-uma-modtype', 15, (gameId) => (gameId === BLADEANDSORCERY_ID),
    getUMADestination, testUMAContent);

  context.registerInstaller('bas-mulledk19-mod', 25,
    (files, gameId) => testModInstaller(files, gameId, MULLE_MOD_INFO),
    (files, destinationPath, gameId, progressDelegate) => installMulleMod(files, destinationPath, gameId, progressDelegate, context.api));

  context.registerModType('bas-mulledk19-modtype', 15, (gameId) => (gameId === BLADEANDSORCERY_ID),
    () => getDiscoveryPath(context.api), (instructions) => instructionsHaveFile(instructions, MULLE_MOD_INFO));

  context.registerInstaller('bas-official-mod', 25,
    (files, gameId) =>
      testModInstaller(files, gameId, OFFICIAL_MOD_MANIFEST),
    (files, destinationPath, gameId, progressDelegate) =>
      installOfficialMod(files, destinationPath, gameId, progressDelegate, context.api));

  context.registerModType('bas-official-modtype', 15, (gameId) => (gameId === BLADEANDSORCERY_ID),
    getOfficialDestination, (instructions) => instructionsHaveFile(instructions, OFFICIAL_MOD_MANIFEST));

  return true;
}

module.exports = {
  default: main,
};
