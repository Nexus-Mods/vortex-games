const Promise = require('bluebird');
const path = require('path');
const rjson = require('relaxed-json');
const { actions, fs, util } = require('vortex-api');

// Nexus Mods and game store IDs.
const SUBNAUTICA_ID = 'subnautica';
const STEAMAPP_ID = '264710';
const EPICAPP_ID = 'Jaguar';

// Mod installation values.
const QMM_MODPAGE = 'https://www.nexusmods.com/subnautica/mods/201';
const QMM_DLL = 'QModInstaller.dll';
// All valid QMM mods include a mod.json file.
const MOD_FILE = 'mod.json';
// Addons for CustomHullPlates and Posters use info.json. The later includes an Orientation prop.
const ADDON_FILE = 'info.json';
// CustomCraft2 mods should be packed with a CustomCraft2SML folder.
const CC2_FOLDER = 'CustomCraft2SML';


function main(context) {
  // Register Subnautica.
  context.registerGame({
    id: SUBNAUTICA_ID,
    name: 'Subnautica',
    mergeMods: true,
    queryModPath: () => 'QMods',
    logo: 'gameart.jpg',
    executable: () => 'Subnautica.exe',
    requiredFiles: [
      'Subnautica.exe'
    ],
    environment: {
      SteamAPPId: STEAMAPP_ID
    },
    details: {
      steamAppId: parseInt(STEAMAPP_ID),
      epicAppId: EPICAPP_ID
    },
    requiresLauncher: requiresEpicLauncher,
    queryPath: findGame,
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  // A Vortex compatible variant of QMM is no longer being provided by its developers.
  // context.registerInstaller('subnautica-qmm-installer', 25, testQMM, (files) => installQMM(files, context.api));
  context.registerInstaller('subnautica-mod-installer', 25, testSubnauticaMod, installSubnauticaMod);

  return true;
}

function requiresEpicLauncher() {
  return util.GameStoreHelper.isGameInstalled(EPICAPP_ID, 'epic')
    .then(epic => epic
      ? { launcher: 'epic', addInfo: EPICAPP_ID }
      : undefined);
}

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAMAPP_ID, EPICAPP_ID])
    .then(game => game.gamePath);
}

function prepareForModding(discovery, api) {
  // Path to the main QModManager DLL file.
  const qModPath = path.join(discovery.path, 'BepInEx', 'plugins', 'QModManager', QMM_DLL);
  // Ensure the mods folder exists, then check for QMM.
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'QMods'))
    .then(() => checkForQMM(api, qModPath));
}

function checkForQMM(api, qModPath) {
  return fs.statAsync(qModPath)
    .catch(() => {
      api.sendNotification({
        id: 'qmm-missing',
        type: 'warning',
        title: 'QModManager not installed',
        message: 'QMM is required to mod Subnautica.',
        actions: [
          {
            title: 'Get QMM',
            action: () => util.opn(QMM_MODPAGE).catch(() => undefined)
          }
        ]
      });
    });
}

function testQMM(files, gameId) {
  const supported = 
    ((gameId === SUBNAUTICA_ID) 
    && (!!files.find(f => path.basename(f).toLowerCase() === QMM_DLL.toLowerCase())));

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function installQMM(files, api) {
  api.dismissNotification('qmm-missing');
  // Set as dinput so the files are installed to the game root directory.
  const modType = { type: 'setmodtype', value: 'dinput' };
  // Filter out directories, as these cause a warning. 
  files = files.filter(file => !file.endsWith(path.sep));
  const instructions = files.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file
    }
  });
  
  instructions.push(modType);

  return Promise.resolve({ instructions });

}

function testSubnauticaMod(files, gameId) {
  if (gameId === SUBNAUTICA_ID) {
    const modTest = !!files.find(file => path.basename(file).toLowerCase() === MOD_FILE.toLowerCase());
    const addonTest = !!files.find(file => path.basename(file).toLowerCase() === ADDON_FILE.toLowerCase());
    const cc2Test = !!files.find(file => file.endsWith(CC2_FOLDER + path.sep));

    return Promise.resolve({ supported: (modTest || addonTest || cc2Test), requiredFiles: [] });
  }
  else return Promise.resolve({ supported: false, requiredFiles: [] });
}

async function installSubnauticaMod(files, destinationPath) {
  return installMod(files, destinationPath)
    .catch(() => installAddon(files, destinationPath)
      .catch(() => installCC2(files)
        .catch(() => Promise.reject(new util.DataInvalid('Unrecognised or invalid Subnautica mod.')))
        )
  );
}

function installMod(files, destinationPath) {
  const modFile = files.find(file => path.basename(file) === MOD_FILE);
  if (!modFile) return Promise.reject('Not a Subnautica mod file');
  const idx = modFile.indexOf(MOD_FILE);
  const rootPath = path.dirname(modFile);

  const filtered = files.filter(file => (!file.endsWith(path.sep))
    && (file.indexOf(rootPath) !== -1));

  return getModName(destinationPath, modFile)
    .then(modName => {
      return Promise.map(filtered, file => {
        return Promise.resolve({
          type: 'copy',
          source: file,
          destination: path.join(modName, file.substr(idx)),
        });
      });
    })
    .then(instructions => Promise.resolve({ instructions }));
}

function installAddon(files, destinationPath) {
  const addonFile = files.find(file => path.basename(file).toLowerCase() === ADDON_FILE.toLowerCase());
  if (!addonFile) return Promise.reject('Not a Subnautica addon file');
  // Select the folder above the info.json as this is the root of the Posters/Hullplates folder.
  const rootPath = path.dirname(path.join(addonFile, '..'));

  const filtered = files.filter(file => (!file.endsWith(path.sep))
    && (file.indexOf(rootPath) !== -1));
  
  let parentModFolder = '';

  const addonInfoPath = path.join(destinationPath, addonFile);
  return fs.readFileAsync(addonInfoPath, { encoding: 'utf-8' })
  .then(data => {
    try {
    const addonInfo = rjson.parse(util.deBOM(data));
    parentModFolder = !!addonInfo['Orientation'] ? 'CustomPosters' : 'CustomHullPlates';
    const idx = addonFile.indexOf(parentModFolder) + parentModFolder.length //!== -1 ? addonFile.indexOf(ADDON_FILE) : 0;
    const instructions = filtered.map(file => {
      return {
        type: 'copy',
        source: file,
        destination: path.join(parentModFolder, file.substr(idx))
      }
    });
    return Promise.resolve({ instructions });
    }
    catch(err) {
      console.log(err);
      return Promise.reject(new util.DataInvalid('Failed to parse info.json file.'));
    }
  });
}

function installCC2(files) {
  const cc2Folder = files.find(file => file.endsWith(CC2_FOLDER + path.sep));
  if (!cc2Folder) return Promise.reject('Unrecognised or invalid Subnautica mod.');
  const idx = cc2Folder.indexOf(CC2_FOLDER);
  const filtered = files.filter(file => file.includes(CC2_FOLDER) && !file.endsWith(path.sep));
  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx)
    }
  });
  return Promise.resolve({instructions});
}

function getModName(destination, modFile) {
  const modFolder = path.basename(path.dirname(modFile));
  const modFilePath = path.join(destination, modFile);
  return (modFolder !== '.')
    ? Promise.resolve(modFolder)
    : fs.readFileAsync(modFilePath, { encoding: 'utf-8' })
      .then(data => {
        try {
          const modFile = rjson.parse(util.deBOM(data));
          return Promise.resolve(modFile.Id);
        } catch (err) {
          return Promise.reject(new util.DataInvalid('Failed to parse mod.json file.'));
        }
      });
}

module.exports = {
  default: main
};
