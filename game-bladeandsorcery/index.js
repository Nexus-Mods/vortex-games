const Promise = require('bluebird');
const path = require('path');
const { actions, fs, log, util } = require('vortex-api');
const rjson = require('relaxed-json');
const semver = require('semver');
const shortId = require('shortid');

// Nexus Mods id for the game.
const BLADEANDSORCERY_ID = 'bladeandsorcery';
const RESOURCES_FILE = 'resources.assets';
const UMA_PRESETS_FOLDER = 'UMAPresets';

// MulleDK19 B&S mods are expected to have this json file at its root directory.
const MULLE_MOD_INFO = 'mod.json';

// Official mod manifest file.
const OFFICIAL_MOD_MANIFEST = 'manifest.json';

// The global file holds current gameversion information
//  we're going to use this to compare against a mod's expected
//  gameversion and inform users of possible incompatibility.
//  (The global file is located in the game's StreamedAssets/Default path)
const GLOBAL_FILE = 'Global.json';

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
        return (err.message.indexOf('Unexpected end of JSON input') !== -1)
          ? Promise.reject(new util.DataInvalid('Invalid manifest.json file'))
          : Promise.reject(err);
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

  // remove all characters except for characters and numbers.
  modName = modName.replace(/[^a-zA-Z0-9]+/g, "")

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
  return fs.ensureDirWritableAsync(path.join(discovery.path, streamingAssetsPath()),
    () => Promise.resolve());
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

async function checkModGameVersion(destination, minModVersion, modFile) {
  const coercedMin = semver.coerce(minModVersion.version);
  const minVersion = minModVersion.majorOnly
    ? coercedMin.major + '.x'
    : `>=${coercedMin.version}`;
  try {
    let modVersion = await getJSONElement(path.join(destination, modFile), 'GameVersion');
    modVersion = modVersion.toString().replace(',', '.');
    const coercedMod = semver.coerce(modVersion.toString());
    if (coercedMod === null) {
      return Promise.reject(new util.DataInvalid('Mod manifest has an invalid GameVersion element'));
    }

    return Promise.resolve({
      match: semver.satisfies(coercedMod.version, minVersion),
      modVersion: coercedMod.version,
      globalVersion: coercedMin.version,
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

async function getMinModVersion(discoveryPath) {
  return getJSONElement(path.join(discoveryPath, streamingAssetsPath(), 'Default', GLOBAL_FILE), 'minModVersion')
    .then(version => { return { version, majorOnly: false } })
    .catch(err => (err.message.indexOf('JSON element is missing') !== -1)
      ? getJSONElement(path.join(discoveryPath, streamingAssetsPath(), 'Default', GLOBAL_FILE), 'gameVersion')
          .then(version => { return { version, majorOnly: true } })
      : Promise.reject(err));
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

  let minModVersion;
  const discoveryPath = getDiscoveryPath(api);
  try {
    minModVersion = await getMinModVersion(discoveryPath);
    minModVersion.version = minModVersion.version.toString().replace(',', '.');
  }
  catch (err) {
    Promise.reject(err);
  }

  if (minModVersion === undefined) {
    return Promise.reject(new util.DataInvalid('Failed to identify game version'));
  }

  const usedModNames = [];

  const manifestFiles = files.filter(file =>
    path.basename(file).toLowerCase() === OFFICIAL_MOD_MANIFEST);

  const createInstructions = (manifestFile) =>
    getModName(destinationPath, manifestFile, 'Name', undefined)
      .then(manifestModName => {
        const isUsedModName = usedModNames.find(modName => modName === manifestModName) !== undefined;
        const modName = (isUsedModName)
          ? manifestModName + '_' + shortId.generate()
          : manifestModName;

        usedModNames.push(modName);

        const idx = manifestFile.indexOf(path.basename(manifestFile));
        const rootPath = path.dirname(manifestFile);

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

        return Promise.resolve(instructions);
      });

  return Promise.map(manifestFiles, manFile =>
    checkModGameVersion(destinationPath, minModVersion, manFile)
    .then(res => (!res.match)
      ? versionMismatchDialog(res.globalVersion, res.modVersion)
          .then(() => createInstructions(manFile))
      : createInstructions(manFile))
  ).then(manifestMods => {
    const instructions = manifestMods.reduce((prev, instructions) => {
      prev = prev.concat(instructions);
      return prev;
    }, []);

    return Promise.resolve({ instructions });
  });
}

async function installMulleMod(files,
                        destinationPath,
                        gameId,
                        progressDelegate,
                        api) {
  // MulleDK19's mod loader is no longer being updated and will not function
  //  with B&S version 6.0 and higher. We're going to keep this modType installer
  //  for the sake of stopping users from installing out of date mods.
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
  const copies = instructions.filter(instruction => instruction.type === 'copy');
  return new Promise((resolve, reject) => {
    const fileExists = copies.find(inst => path.basename(inst.destination).toLowerCase() === fileName) !== undefined;
    return resolve(fileExists);
  })
}

function testUMAContent(instructions) {
  const copies = instructions.filter(instruction => instruction.type === 'copy');
  return new Promise((resolve, reject) => {
    const isUMAMod = (copies.find(file => path.basename(file.destination) === RESOURCES_FILE) !== undefined)
                  && (copies.find(file => path.dirname(file.destination).indexOf(UMA_PRESETS_FOLDER) !== -1) !== undefined);
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
      // The default queryModPath result is used for replacement mods,
      //  this works in combination with the fomod stop patterns functionality
      //  to correctly identify the folder structure which works quite well and
      //  therefore should not be modified as that would require us to write duplicate code
      //  for the same functionality which could possibly be less reliable than the battle
      //  tested stop patterns.
      //
      // The BaS developers have requested that we do not open the StreamingAssets/Default
      //  folder when users click the "Open Game Mods Folder" button on the mods page.
      //  Instead of changing the path directly and write a migration function for such
      //  a minor use case - we're going to provide a custom "Open Mods Path" value to be
      //  used by the open-directory extension.
      customOpenModsPath: streamingAssetsPath(),
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
