const path = require('path');
const { fs, util, log } = require('vortex-api');
const { remote } = require('electron');

const XCOM2_ID = 'xcom2';
const WOTC_ID = 'xcom2-wotc';
const XCOM2_MODS = path.join('XComGame', 'Mods');
const XCOM2_CONFIG = path.join('XComGame', 'Config');
const WOTC_MODS = path.join('XCom2-WarOfTheChosen', 'XComGame', 'Mods');
const WOTC_CONFIG = path.join('XCom2-WarOfTheChosen', 'XComGame', 'Config');
const MOD_EXT = '.XComMod';
const MOD_OPTIONS = 'DefaultModOptions.ini';

const STEAMAPP_ID = '268500'; //WOTC is 593380 but it's the same folder so we don't need it.
const GOGAPP_ID = '1482002159'; //WOTC is 1414942413 but it's the same folder so we don't need it.

const optionsPath = (gameId) => {
  switch(gameId) {
    case(XCOM2_ID): return XCOM2_CONFIG;
    case(WOTC_ID): return WOTC_CONFIG;
    default: return '';
  }
}

const getModsPath = (gameId) => {
  switch(gameId) {
    case(XCOM2_ID): return XCOM2_MODS;
    case(WOTC_ID): return WOTC_MODS;
    default: return '';
  }
}

const instructions = (gameId) => {
  return `This page shows a list of all XCOM 2 mods you have installed with Vortex, Steam Workshop or manually.<br/><br/>`+
  `Use the checkboxes on this page to enable or disable the mods. Enabled mods will be added to ${MOD_OPTIONS} in the ${optionsPath(gameId)} folder and will be loaded by the game.`
}

/*
2.0 update based on the following information sources 
https://support.feralinteractive.com/docs/en/xcom2warofthechosen/1.3/steam/faqs/?access=FOJzacYvnB
https://www.gog.com/forum/xcom_2/actually_where_do_mods_go_in_this_version/page1

*/

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID])
      .then(game => game.gamePath);
}

function prepareForModding(discovery, modPath) {
  return fs.ensureDirAsync(path.join(discovery.path, modPath));
}

// The launcher is generic, but I want to show a different icon for WOTC :) 
function supportedTools(game) {
  return [
    {
      id: `${game}-launcher`,
      name: 'Launcher',
      logo: path.join('icons', game === XCOM2_ID ? 'xcom-icon.png' : 'wotc-icon.png'),
      executable: () => path.join('Launcher', 'launcher.exe'),
      requiredFiles: [
        path.join('Launcher', 'launcher.exe'),
      ],
      relative: true,
    }
  ]
}

function main(context) {
  context.registerGame({
    id: XCOM2_ID,
    name: 'XCOM 2',
    logo: 'gameart-xcom2.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => XCOM2_MODS,
    executable: () => 'Binaries/Win64/XCom2.exe',
    setup: (discovery) => prepareForModding(discovery, XCOM2_MODS),
    requiredFiles: [
      'XComGame',
      'XComGame/CookedPCConsole/3DUIBP.upk',
      'XComGame/CharacterPool/Importable/Demos&Replays.bin'
    ],
    supportedTools: supportedTools(XCOM2_ID),
    parameters: ['-fromLauncher', '-review', '-noRedScreens', '-noStartupMovies', '-CrashDumpWatcher'],
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID,
    },
  });

  context.registerGame({
    id: WOTC_ID,
    name: 'XCOM 2: War of the Chosen',
    logo: 'gameart-wotc.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => WOTC_MODS,
    executable: () => 'XCom2-WarOfTheChosen/Binaries/Win64/XCom2.exe',
    setup: (discovery) => prepareForModding(discovery, WOTC_MODS),
    requiredFiles: [
      'XCom2-WarOfTheChosen',
      'XCom2-WarOfTheChosen/XComGame/CookedPCConsole/3DUIBP.upk',
    ],
    parameters: ['-fromLauncher', '-review', '-noRedScreens', '-noStartupMovies', '-CrashDumpWatcher'],
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    supportedTools: supportedTools(WOTC_MODS),
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID,
      nexusPageId: 'xcom2'
    },
  });

  // Register an installer for XCOM mods to sanity check the file structure and add details to the mods themselves.
  context.registerInstaller('xcom2-installer', 25, testMod, installMod);
  
  // Register load order pages for both versions of the game.
  context.registerLoadOrder({
    gameId: XCOM2_ID,
    validate,
    deserializeLoadOrder: () => deserializeLoadOrder(context.api, XCOM2_ID),
    serializeLoadOrder: (loadOrder) => serializeLoadOrder(context.api, loadOrder, XCOM2_ID),
    toggleableEntries: true,
    usageInstructions: instructions(XCOM2_ID)
  });

  context.registerLoadOrder({
    gameId: WOTC_ID,
    validate,
    deserializeLoadOrder: () => deserializeLoadOrder(context.api, WOTC_ID),
    serializeLoadOrder: (loadOrder) => serializeLoadOrder(context.api, loadOrder, WOTC_ID),
    toggleableEntries: true,
    usageInstructions: instructions(WOTC_ID)
  });

  return true;
}

// Installing functions

function testMod(files, gameId) {
  const supported = (gameId === XCOM2_ID || gameId === WOTC_ID) 
    && (!!files.find(file => path.extname(file).toLowerCase() === MOD_EXT.toLowerCase()));

  return Promise.resolve({ supported, requiredFiles: [] });
}

async function installMod(files) {
  // Grab a list of any XComMod files.
  const xComModFiles = files.filter(file => path.extname(file).toLowerCase() == MOD_EXT.toLowerCase());

  // Prepare the XComMod attribute.
  const attributes = [{
    type: 'attribute',
    key: 'xComMods',
    value: xComModFiles.map(file => path.basename(file, MOD_EXT))
  }];

  // Sort the files as their respective mods (in the case of multiple mods in one archive)
  let copy = [];
  xComModFiles.forEach(mod => {
    // The name of the XComMod File, without the extension.
    const modName = path.basename(mod, MOD_EXT);
    // The containing folder (this should be the same.)
    const modFolder = path.dirname(mod);
    // Files in the mod folder
    const modFiles = files.filter(file => file.indexOf(modFolder) !== -1 && !file.endsWith(path.sep));
    // Instructions for Vortex from the file list.
    const modInstructions = modFiles.map(file => {
      // Trim off the folder name, in case it doesn't match the modName.
      const shortPath = file.substr(file.indexOf(modFolder) + modFolder.length);
      return {
      type: 'copy',
      source: file,
      destination: path.join(modName, shortPath)
      }
    });
    // Add the instructions to the copy.
    copy = [...copy, ...modInstructions];
  });

  return Promise.resolve({ instructions: [...copy, ...attributes] });
}

// Load order functions

function validate(prev, cur) {
  const invalidNames = cur.filter(entry => entry.name.indexOf('"') != -1);
  const invalid = invalidNames.map(entry => ({ id: entry.id, reason: 'contains invalid characters.' }))
  if (invalidNames.length) return Promise.resolve({ invalid });
  return Promise.resolve();
}

async function deserializeLoadOrder(api, gameId) {

  const state = api.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', gameId]);
  if (!discovery || !discovery.path) return Promise.reject('The game could not be discovered.');

  // Scan the mods folder for directories
  let folders = [];
  const modsPath = path.join(discovery.path, getModsPath(gameId));
  try {
    const dir = await fs.readdirAsync(modsPath);
    folders = await dir.reduce(async (prev, cur) => {
      if (!!path.extname(cur)) return prev;
      const statPath = path.join(modsPath, cur, `${cur}${MOD_EXT}`);
      try {
        await fs.statAsync(statPath);
        prev.push(cur);
        return prev;
      }
      catch (err) {
        if (err.code !== 'ENOENT') log('warn', 'Error checking for XComMod file in mod folder', err);
        return prev;
      }
    }, []);
  }
  catch(err) {
    log('error', `Error reading ${gameId} mods folder`, err);
  }

  // Get the latest deployment list.
  let deployedFiles = [];
  try {
    const manifest = await util.getManifest(api, '', gameId);
    deployedFiles = manifest.files;
  }
  catch(err) {
    if (err.code !== 'ENOENT') log('error', `Error reading manifest for ${gameId}`, err);
  }

  // If we have the game on Steam, also get the Steam Workshop mods.
  let workshopMods = [];
  if (discovery.path.toLowerCase().includes('steamapps')) {
    const steamApps = discovery.path.substr(0, discovery.path.indexOf('common'));
    const workshopDir = path.join(steamApps, 'workshop', 'content', STEAMAPP_ID);
    try {
      const folders = await fs.readdirAsync(workshopDir);
      workshopMods = await folders.filter(f => !path.extname(f)).reduce(async (prev, cur) => {
        const wsModPath = path.join(workshopDir, cur);
        const wsModDir = await fs.readdirAsync(wsModPath).catch(() => []);
        const modFile = wsModDir.find(file => path.extname(file).toLowerCase() === MOD_EXT.toLowerCase());
        if (modFile) prev.push(path.basename(modFile, MOD_EXT));
        return prev;
      }, []);
    }
    catch(err) {
      if (err.code !== 'ENOENT') log('warn', `Error reading workshop mods for ${gameId}`, err);
    }
  }

  // Now we need the INI which holds the enabled mods.
  const optionsIni = path.join(discovery.path, optionsPath(gameId), MOD_OPTIONS);
  let enabledMods = [];
  try {
    const file = await fs.readFileAsync(optionsIni, 'utf8');
    const arr = file.split('\n');
    const active = arr.filter(line => line.startsWith('ActiveMods='));
    const names = active.map(mod => mod.replace('ActiveMods=', '').replace(/"/g,''));
    enabledMods = names.filter(name => folders.includes(name));
  }
  catch(err) {
    if (err.code === 'ENOENT') log('info', `${MOD_OPTIONS} does not exist for ${gameId}`);
    else log('error', `Error reading ${MOD_OPTIONS} for ${gameId}`, err);
  }

  // Use a set to ensure there are no duplicates
  let loadOrderUniques = new Set([...enabledMods, ...folders, ...workshopMods]);

  // Map our data into a load order.
  const loadOrder = [...loadOrderUniques].map(xmod => {
    const enabled = enabledMods.includes(xmod);
    const xmodPath = path.join(xmod, `${xmod}${MOD_EXT}`);
    const deployed = deployedFiles.find(file => file.relPath.toLowerCase() === xmodPath.toLowerCase());
    return {
      id: xmod.toLowerCase(),
      name: xmod,
      enabled,
      modId: deployed ? deployed.source : undefined
    }
  });

  return Promise.resolve(loadOrder);

}

async function serializeLoadOrder(api, loadOrder, gameId) {
  // Get the game install folder.
  const state = api.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', gameId]);
  if (!discovery || !discovery.path) return Promise.reject('The game could not be discovered.');
  const optionsIni = path.join(discovery.path, optionsPath(gameId), MOD_OPTIONS);

  try {
    const mods = loadOrder.filter(entry => entry.enabled).map(entry => entry.name);
    return fs.writeFileAsync(optionsIni, xComModOptionsIni(mods), { encoding: 'utf-8' });
  }
  catch(err) {
    log('error', 'Error saving load order', err)
    return Promise.reject(err);
  }
}

const xComModOptionsIni = (mods) => {
  return `;Generated by Vortex ${remote.app.getVersion()} (https://www.nexusmods.com/about/vortex/)\n`+
  '[Engine.XComModOptions]\n'+
  mods.map(mod => `ActiveMods="${mod}"`).join('\n')+
  '\n\n;Use the below pattern to activate mods (no "+"/"-" etc. operators as this is the base INI file)\n'
  +';ActiveMods="TerrorFromTheDerp"\n'
  +';ActiveMods="Squadsize_EU"';
}

module.exports = {
  default: main,
};