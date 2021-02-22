const React = require('react');
const BS = require('react-bootstrap');
const { app, remote } = require('electron');
const Promise = require('bluebird');
const path = require('path');
const { actions, fs, log, selectors, FlexLayout, util } = require('vortex-api');
const { parseXmlString } = require('libxmljs');
const semver = require('semver');

const CustomItemRenderer = require('./customItemRenderer');
const { SUBMOD_FILE, GAME_ID } = require('./common');
const { migrate026 } = require('./migrations');

const APPUNI = app || remote.app;
const LAUNCHER_EXEC = path.join('bin', 'Win64_Shipping_Client', 'TaleWorlds.MountAndBlade.Launcher.exe');
const MODDING_KIT_EXEC = path.join('bin', 'Win64_Shipping_wEditor', 'TaleWorlds.MountAndBlade.Launcher.exe');
const LAUNCHER_DATA_PATH = path.join(APPUNI.getPath('documents'), 'Mount and Blade II Bannerlord', 'Configs', 'LauncherData.xml');
const LAUNCHER_DATA = {
  singlePlayerSubMods: [],
  multiplayerSubMods: [],
}

let STORE_ID;
let CACHE = {};

const STEAMAPP_ID = 261550;
const EPICAPP_ID = 'Chickadee';
const MODULES = 'Modules';

const I18N_NAMESPACE = 'game-mount-and-blade2';

const XML_EL_MULTIPLAYER = 'MultiplayerModule';

// A set of folder names (lowercased) which are available alongside the
//  game's modules folder. We could've used the fomod installer stop patterns
//  functionality for this, but it's better if this extension is self contained;
//  especially given that the game's modding pattern changes quite often.
const ROOT_FOLDERS = new Set(['bin', 'data', 'gui', 'icons', 'modules',
  'music', 'shaders', 'sounds', 'xmlschemas']);

const OFFICIAL_MODULES = new Set(['Native', 'CustomBattle', 'SandBoxCore', 'Sandbox', 'StoryMode']);
const LOCKED_MODULES = new Set([]);

// Used for the "custom launcher" tools.
//  gameMode: singleplayer or multiplayer
//  subModIds: the mod ids we want to load into the game.
const PARAMS_TEMPLATE = ['/{{gameMode}}', '_MODULES_{{subModIds}}*_MODULES_'];

// The relative path to the actual game executable, not the launcher.
const BANNERLORD_EXEC = path.join('bin', 'Win64_Shipping_Client', 'Bannerlord.exe');

async function walkAsync(dir, levelsDeep = 2) {
  let entries = [];
  return fs.readdirAsync(dir).then(files => {
    const filtered = files.filter(file => !file.endsWith('.vortex_backup'));
    return Promise.each(filtered, file => {
      const fullPath = path.join(dir, file);
      return fs.statAsync(fullPath).then(stats => {
        if (stats.isDirectory() && levelsDeep > 0) {
          return walkAsync(fullPath, levelsDeep - 1)
            .then(nestedFiles => {
              entries = entries.concat(nestedFiles);
              return Promise.resolve();
            })
        } else {
          entries.push(fullPath);
          return Promise.resolve();
        }
      }).catch(err => {
        // This is a valid use case, particularly if the file
        //  is deployed by Vortex using symlinks, and the mod does
        //  not exist within the staging folder.
        log('error', 'MnB2: invalid symlink', err);
        return (err.code === 'ENOENT')
          ? Promise.resolve()
          : Promise.reject(err);
      });
    });
  })
  .then(() => Promise.resolve(entries))
}

async function getDeployedSubModPaths(context) {
  const state = context.api.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if (discovery?.path === undefined) {
    return Promise.reject(new util.ProcessCanceled('game discovery is incomplete'));
  }
  const modulePath = path.join(discovery.path, MODULES);
  let moduleFiles;
  try {
    moduleFiles = await walkAsync(modulePath);
  } catch (err) {
    if (err instanceof util.UserCanceled) {
      return Promise.resolve([]);
    }
    const isMissingOfficialModules = ((err.code === 'ENOENT')
      && ([].concat([ MODULES ], Array.from(OFFICIAL_MODULES)))
            .indexOf(path.basename(err.path)) !== -1);
    const errorMsg = isMissingOfficialModules
      ? 'Game files are missing - please re-install the game'
      : err.message;
    context.api.showErrorNotification(errorMsg, err);
    return Promise.resolve([]);
  }
  const subModules = moduleFiles.filter(file => path.basename(file).toLowerCase() === SUBMOD_FILE);
  return Promise.resolve(subModules);
}

async function getDeployedModData(context, subModuleFilePaths) {
  const managedIds = await getManagedIds(context);
  const getCleanVersion = (subModId, unsanitized) => {
    if (!unsanitized) {
      log('debug', 'failed to sanitize/coerce version', { subModId, unsanitized });
      return undefined;
    }
    try {
      const sanitized = unsanitized.replace(/[a-z]|[A-Z]/g, '');
      const coerced = semver.coerce(sanitized);
      return coerced.version;
    } catch (err) {
      log('debug', 'failed to sanitize/coerce version', { subModId, unsanitized, error: err.message });
      return undefined;
    }
  };

  return Promise.reduce(subModuleFilePaths, async (accum, subModFile) => {
    try {
      const subModData = await getXMLData(subModFile);
      const subModId = subModData.get('//Id').attr('value').value();
      const subModVerData = subModData.get('//Version').attr('value').value();
      const subModVer = getCleanVersion(subModId, subModVerData);
      const managedEntry = managedIds.find(entry => entry.subModId === subModId);
      const isMultiplayer = (!!subModData.get(`//${XML_EL_MULTIPLAYER}`));
      const depNodes = subModData.find('//DependedModule');
      let dependencies = [];
      try {
        dependencies = depNodes.map(depNode => {
          let depVersion;
          const depId = depNode.attr('Id').value();
          try {
            const unsanitized = depNode.attr('DependentVersion').value();
            depVersion = getCleanVersion(subModId, unsanitized);
          } catch (err) {
            // DependentVersion is an optional attribute, it's not a big deal if
            //  it's missing.
            log('debug', 'failed to resolve dependency version', { subModId, error: err.message });
          }

          return { depId, depVersion };
        });
      } catch (err) {
        log('debug', 'submodule has no dependencies or is invalid', err);
      }
      const subModName = subModData.get('//Name').attr('value').value();

      accum[subModId] = {
        subModId,
        subModName,
        subModVer,
        subModFile,
        vortexId: !!managedEntry ? managedEntry.vortexId : subModId,
        isOfficial: OFFICIAL_MODULES.has(subModId),
        isLocked: LOCKED_MODULES.has(subModId),
        isMultiplayer,
        dependencies,
        invalid: {
          // Will hold the submod ids of any detected cyclic dependencies.
          cyclic: [],

          // Will hold the submod ids of any missing dependencies.
          missing: [],

          // Will hold the submod ids of supposedly incompatible dependencies (version-wise)
          incompatibleDeps: [],
        },
      };
    } catch(err) {
      const errorMessage = 'Vortex was unable to parse: ' + subModFile + ';\n\n'
                         + 'You can either inform the mod author and wait for fix, or '
                         + 'you can use an online xml validator to find and fix the error yourself.';
      // libxmljs rarely produces useful error messages - it usually points
      //  to the parent node of the actual problem and in this case nearly
      //  always will point to the root of the XML file (Module) which is completely useless.
      //  We're going to provide a human readable error to the user.
      context.api.showErrorNotification('Unable to parse submodule file', errorMessage, { allowReport: false });
      log('error', 'MNB2: parsing error', err);
    }
    
    return Promise.resolve(accum);
  }, {});
}

async function getManagedIds(context) {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  if (activeProfile === undefined) {
    // This is a valid use case if the gamemode
    //  has failed activation.
    return Promise.resolve([]);
  }

  const modState = util.getSafe(state, ['persistent', 'profiles', activeProfile.id, 'modState'], {});
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const enabledMods = Object.keys(modState)
    .filter(key => !!mods[key] && modState[key].enabled)
    .map(key => mods[key]);

  const invalidMods = [];
  const installationDir = selectors.installPathForGame(state, GAME_ID);
  if (installationDir === undefined) {
    log('error', 'failed to get managed ids', 'undefined staging folder');
    return Promise.resolve([]);
  }
  return Promise.reduce(enabledMods, async (accum, entry) => {
    if (entry?.installationPath === undefined) {
      // Invalid mod entry - skip it.
      return Promise.resolve(accum);
    }
    const modInstallationPath = path.join(installationDir, entry.installationPath);
    let files;
    try {
      files = await walkAsync(modInstallationPath, 3);
    } catch (err) {
      // The mod must've been removed manually by the user from
      //  the staging folder - good job buddy!
      //  Going to log this, but otherwise allow it to proceed.
      invalidMods.push(entry.id);
      log('error', 'failed to read mod staging folder', { modId: entry.id, error: err.message });
      return Promise.resolve(accum);
    }

    const subModFile = files.find(file => path.basename(file).toLowerCase() === SUBMOD_FILE)
    if (subModFile === undefined) {
      // No submod file - no LO
      return Promise.resolve(accum);
    }

    let subModId;
    try {
      subModId = await getElementValue(subModFile, 'Id');
    } catch (err) {
      // The submodule would've never managed to install correctly
      //  if the xml file had been invalid - this suggests that the user
      //  or a 3rd party application has tampered with the file...
      //  We simply log this here as the parse-ing failure will be highlighted
      //  by the CACHE logic.
      log('error', '[MnB2] Unable to parse submodule file', err);
      //context.api.showErrorNotification('Unable to parse submodule file', err);
      return Promise.resolve(accum);
    }
    
    accum.push({
      subModId,
      subModFile,
      vortexId: entry.id,
    });

    return Promise.resolve(accum)
  }, [])
  .tap((res) => {
    if (invalidMods.length > 0) {
      const errMessage = 'The following mods are inaccessible or are missing '
        + 'in the staging folder:\n\n' + invalidMods.join('\n') + '\n\nPlease ensure '
        + 'these mods and their content are not open in any other application '
        + '(including the game itself). If the mod is missing entirely, please re-install it '
        + 'or remove it from your mods page. Please check your vortex log file for details.';
      context.api.showErrorNotification('Invalid Mods in Staging',
                                        new Error(errMessage), { allowReport: false });
    }
    return Promise.resolve(res);
  });
}

async function getXMLData(xmlFilePath) {
  return fs.readFileAsync(xmlFilePath)
    .then(data => {
      try {
        const xmlData = parseXmlString(data);
        return Promise.resolve(xmlData);
      } catch (err) {
        return Promise.reject(new util.DataInvalid(err.message));
      }
    })
    .catch(err => (err.code === 'ENOENT')
      ? Promise.reject(new util.NotFound(xmlFilePath))
      : Promise.reject(new util.DataInvalid(err.message)));
}

async function refreshGameParams(context, loadOrder) {
  // Go through the enabled entries so we can form our game parameters.
  const enabled = (!!loadOrder && Object.keys(loadOrder).length > 0)
    ? Object.keys(loadOrder)
        .filter(key => loadOrder[key].enabled)
        .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
        .reduce((accum, key) => {
          const cacheKeys = Object.keys(CACHE);
          const entry = cacheKeys.find(cacheElement => CACHE[cacheElement].vortexId === key);
          if (!!entry) {
            accum.push(entry);
          }
          return accum;
        }, [])
    : LAUNCHER_DATA.singlePlayerSubMods
        .filter(subMod => subMod.enabled)
        .map(subMod => subMod.subModId);

  // Currently Singleplayer only! (more research into MP needs to be done)
  const parameters = [
    PARAMS_TEMPLATE[0].replace('{{gameMode}}', 'singleplayer'),
    PARAMS_TEMPLATE[1].replace('{{subModIds}}', enabled.map(key => `*${key}`).join('')),
  ];

  // This launcher will not function unless the path is guaranteed to point
  //  towards the bannerlord executable. Given that earlier versions of this
  //  extension had targeted TaleWorlds.Launcher.exe instead - we need to make
  //  sure this is set correctly.
  context.api.store.dispatch(actions.setGameParameters(GAME_ID, {
    executable: BANNERLORD_EXEC,
    parameters
  }));
  
  return Promise.resolve();
}

async function getElementValue(subModuleFilePath, elementName) {
  const logAndContinue = () => {
    log('error', 'Unable to parse xml element', elementName);
    return Promise.resolve(undefined);
  }
  return fs.readFileAsync(subModuleFilePath, { encoding: 'utf-8' })
    .then(xmlData => {
      try {
        const modInfo = parseXmlString(xmlData);
        const element = modInfo.get(`//${elementName}`);
        return ((element !== undefined) && (element.attr('value').value() !== undefined))
          ? Promise.resolve(element.attr('value').value())
          : logAndContinue();
      } catch (err) {
        const errorMessage = 'Vortex was unable to parse: ' + subModuleFilePath + '; please inform the mod author'; 
        return Promise.reject(new util.DataInvalid(errorMessage));
      }
    });
}

function findGame() {
  return util.GameStoreHelper.findByAppId([EPICAPP_ID, STEAMAPP_ID.toString()])
    .then(game =>{
      STORE_ID = game.gameStoreId;
      return Promise.resolve(game.gamePath);
    });
}

function testRootMod(files, gameId) {
  const notSupported = { supported: false, requiredFiles: [] };
  if (gameId !== GAME_ID) {
    // Different game.
    return Promise.resolve(notSupported);
  }

  const lowered = files.map(file => file.toLowerCase());
  const modsFile = lowered.find(file => file.split(path.sep).indexOf(MODULES.toLowerCase()) !== -1);
  if (modsFile === undefined) {
    // There's no Modules folder.
    return Promise.resolve(notSupported);
  }

  const idx = modsFile.split(path.sep).indexOf(MODULES.toLowerCase());
  const rootFolderMatches = lowered.filter(file => {
    const segments = file.split(path.sep);
    return (((segments.length - 1) > idx) && ROOT_FOLDERS.has(segments[idx]));
  }) || [];

  return Promise.resolve({ supported: (rootFolderMatches.length > 0), requiredFiles: [] });
}

function installRootMod(files, destinationPath) {
  const moduleFile = files.find(file => file.split(path.sep).indexOf(MODULES) !== -1);
  const idx = moduleFile.split(path.sep).indexOf(MODULES);
  const filtered = files.filter(file => {
    const segments = file.split(path.sep).map(seg => seg.toLowerCase());
    const lastElementIdx = segments.length - 1;

    // Ignore directories and ensure that the file contains a known root folder at
    //  the expected index.
    return (ROOT_FOLDERS.has(segments[idx])
      && (path.extname(segments[lastElementIdx]) !== ''));
  });

  const instructions = filtered.map(file => {
    const destination = file.split(path.sep)
                            .slice(idx)
                            .join(path.sep);
    return {
      type: 'copy',
      source: file,
      destination,
    }
  });

  return Promise.resolve({ instructions });
}

function testForSubmodules(files, gameId) {
  // Check this is a mod for Bannerlord and it contains a SubModule.xml
  const supported = ((gameId === GAME_ID) 
    && files.find(file => path.basename(file).toLowerCase() === SUBMOD_FILE) !== undefined);

  return Promise.resolve({
    supported,
    requiredFiles: []
  })
}

async function installSubModules(files, destinationPath) {
  // Remove directories straight away.
  const filtered = files.filter(file => { 
    const segments = file.split(path.sep);
    return path.extname(segments[segments.length - 1]) !== '';
  });
  const subModIds = [];
  const subMods = filtered.filter(file => path.basename(file).toLowerCase() === SUBMOD_FILE);
  return Promise.reduce(subMods, async (accum, modFile) => {
    const segments = modFile.split(path.sep).filter(seg => !!seg);
    const subModId = await getElementValue(path.join(destinationPath, modFile), 'Id');
    const modName = (segments.length > 1)
      ? segments[segments.length - 2]
      : subModId;

    subModIds.push(subModId);
    const idx = modFile.toLowerCase().indexOf(SUBMOD_FILE);
    // Filter the mod files for this specific submodule.
    const subModFiles = filtered.filter(file => file.slice(0, idx) == modFile.slice(0, idx));
    const instructions = subModFiles.map(modFile => ({
      type: 'copy',
      source: modFile,
      destination: path.join(MODULES, modName, modFile.slice(idx)),
    }));
    return accum.concat(instructions);
  }, [])
  .then(merged => {
    const subModIdsAttr = {
      type: 'attribute',
      key: 'subModIds',
      value: subModIds,
    }
    return Promise.resolve({ instructions: [].concat(merged, [subModIdsAttr]) })
  });
}

function ensureOfficialLauncher(context, discovery) {
  context.api.store.dispatch(actions.addDiscoveredTool(GAME_ID, 'TaleWorldsBannerlordLauncher', {
    id: 'TaleWorldsBannerlordLauncher',
    name: 'Official Launcher',
    logo: 'twlauncher.png',
    executable: () => path.basename(LAUNCHER_EXEC),
    requiredFiles: [
      path.basename(LAUNCHER_EXEC),
    ],
    path: path.join(discovery.path, LAUNCHER_EXEC),
    relative: true,
    workingDirectory: path.join(discovery.path, 'bin', 'Win64_Shipping_Client'),
  }));
}

function setModdingTool(context, discovery, hidden = undefined) {
  const toolId = 'bannerlord-sdk';
  const exec = path.basename(MODDING_KIT_EXEC);
  const tool = {
    id: toolId,
    name: 'Modding Kit',
    logo: 'twlauncher.png',
    executable: () => exec,
    requiredFiles: [ exec ],
    path: path.join(discovery.path, MODDING_KIT_EXEC),
    relative: true,
    exclusive: true,
    workingDirectory: path.join(discovery.path, path.dirname(MODDING_KIT_EXEC)),
    hidden,
  };

  context.api.store.dispatch(actions.addDiscoveredTool(GAME_ID, toolId, tool));
}

async function prepareForModding(context, discovery) {
  // Quickly ensure that the official Launcher is added.
  ensureOfficialLauncher(context, discovery);
  try {
    await fs.statAsync(path.join(discovery.path, MODDING_KIT_EXEC));
    setModdingTool(context, discovery);
  } catch (err) {
    const tools = discovery?.tools;
    if ((tools !== undefined)
    && (util.getSafe(tools, ['bannerlord-sdk'], undefined) !== undefined)) {
      setModdingTool(context, discovery, true);
    }
  }

  // If game store not found, location may be set manually - allow setup
  //  function to continue.
  const findStoreId = () => findGame().catch(err => Promise.resolve());
  const startSteam = () => findStoreId()
    .then(() => (STORE_ID === 'steam')
      ? util.GameStoreHelper.launchGameStore(context.api, STORE_ID, undefined, true)
      : Promise.resolve())

  const idRegexp = /\<Id\>(.*?)\<\/Id\>/gm;
  const enabledRegexp = /\<IsSelected\>(.*?)\<\/IsSelected\>/gm;
  const trimTagsRegexp = /<[^>]*>?/gm;
  const createDataElement = (xmlNode) => {
    const nodeString = xmlNode.toString({ whitespace: false }).replace(/[ \t\r\n]/gm, '');
    if (!!nodeString) {
      return {
        subModId: nodeString.match(idRegexp)[0].replace(trimTagsRegexp, ''),
        enabled: nodeString.match(enabledRegexp)[0]
          .toLowerCase()
          .replace(trimTagsRegexp, '') === 'true',
      };
    } else {
      return undefined;
    }
  };

  // Check if we've already set the load order object for this profile
  //  and create it if we haven't.
  return startSteam().then(() => getXMLData(LAUNCHER_DATA_PATH)).then(launcherData => {
    try {
      const singlePlayerMods = launcherData.get('//UserData/SingleplayerData/ModDatas').childNodes();
      const multiPlayerMods = launcherData.get('//UserData/MultiplayerData/ModDatas').childNodes();
      LAUNCHER_DATA.singlePlayerSubMods = singlePlayerMods.reduce((accum, spm) => {
        const dataElement = createDataElement(spm);
        if (!!dataElement) {
          accum.push(dataElement);
        }
        return accum;
      }, []);
      LAUNCHER_DATA.multiplayerSubMods = multiPlayerMods.reduce((accum, mpm) => {
        const dataElement = createDataElement(mpm);
        if (!!dataElement) {
          accum.push(dataElement);
        }
        return accum;
      }, []);
    } catch (err) {
      return Promise.reject(new util.DataInvalid(err.message));
    }
  }).then(async () => {
    const deployedSubModules = await getDeployedSubModPaths(context);
    CACHE = await getDeployedModData(context, deployedSubModules);

    // We're going to do a quick tSort at this point - not going to
    //  change the user's load order, but this will highlight any
    //  cyclic or missing dependencies.
    const modIds = Object.keys(CACHE);
    const sorted = tSort(modIds, true);
  })
  .catch(err => {
    if (err instanceof util.NotFound) {
      context.api.showErrorNotification('Failed to find game launcher data',
        'Please run the game at least once through the official game launcher and '
      + 'try again', { allowReport: false });
      return Promise.resolve();
    } else if (err instanceof util.ProcessCanceled) {
      context.api.showErrorNotification('Failed to find game launcher data',
        err, { allowReport: false });
    }

    return Promise.reject(err);
  })
  .finally(() => {
    const state = context.api.store.getState();
    const activeProfile = selectors.activeProfile(state);
    if (activeProfile === undefined) {
      // Valid use case when attempting to switch to
      //  Bannerlord without any active profile.
      return refreshGameParams(context, {});
    }
    const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
    return refreshGameParams(context, loadOrder);
  });
}

function isInvalid(subModId) {
  const cyclicErrors = util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
  const missingDeps = util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
  return ((cyclicErrors.length > 0) || (missingDeps > 0));
}

function getValidationInfo(modVortexId) {
  // We expect the method caller to provide the vortexId of the subMod, as 
  //  this is how we store this information in the load order object.
  //  Reason why we need to search the cache by vortexId rather than subModId.
  const subModId = Object.keys(CACHE).find(key => CACHE[key].vortexId === modVortexId);
  const cyclic = util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
  const missing = util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
  const incompatible = util.getSafe(CACHE[subModId], ['invalid', 'incompatibleDeps'], []);
  return {
    cyclic,
    missing,
    incompatible,
  }
}

function tSort(subModIds, allowLocked = false, loadOrder = undefined) {
  // Topological sort - we need to:
  //  - Identify cyclic dependencies.
  //  - Identify missing dependencies.
  //  - We will try to identify incompatible dependencies (version-wise)

  // These are manually locked mod entries.
  const lockedSubMods = (!!loadOrder)
    ? subModIds.filter(subModId => {
      const entry = CACHE[subModId];
      return (!!entry)
        ? !!loadOrder[entry.vortexId]?.locked
        : false;
    })
    : [];
  const alphabetical = subModIds.filter(subMod => !lockedSubMods.includes(subMod))
                                .sort();
  const graph = alphabetical.reduce((accum, entry) => {
    const depIds = [...CACHE[entry].dependencies].map(dep => dep.depId);
    // Create the node graph.
    accum[entry] = depIds.sort();
    return accum;
  }, {});

  // Will store the final LO result
  const result = [];
  
  // The nodes we have visited/processed.
  let visited = [];

  // The nodes which are still processing.
  let processing = [];

  const topSort = (node) => {
    processing[node] = true;
    const dependencies = (!!allowLocked)
      ? graph[node]
      : graph[node].filter(element => !LOCKED_MODULES.has(element));

    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];
      if (processing[dep]) {
        // Cyclic dependency detected - highlight both mods as invalid
        //  within the cache itself - we also need to highlight which mods.
        CACHE[node].invalid.cyclic.push(dep);
        CACHE[dep].invalid.cyclic.push(node);

        visited[node] = true;
        processing[node] = false;
        continue;
      }

      const incompatibleDeps = CACHE[node].invalid.incompatibleDeps;
      const incDep = incompatibleDeps.find(d => d.depId === dep);
      if (Object.keys(graph).includes(dep) && (incDep === undefined)) {
        const depVer = CACHE[dep].subModVer;
        const depInst = CACHE[node].dependencies.find(d => d.depId === dep);
        try {
          const match = semver.satisfies(depInst.depVersion, depVer);
          if (!match && !!depInst?.depVersion && !!depVer) {
            CACHE[node].invalid.incompatibleDeps.push({
              depId: dep,
              requiredVersion: depInst.depVersion,
              currentVersion: depVer,
            });
          }
        } catch (err) {
          // Ok so we didn't manage to compare the versions, we log this and
          //  continue.
          log('debug', 'failed to compare versions', err);
        }
      }

      if (!visited[dep] && !lockedSubMods.includes(dep)) {
        if (!Object.keys(graph).includes(dep)) {
          CACHE[node].invalid.missing.push(dep);
        } else {
          topSort(dep);
        }
      }
    };

    processing[node] = false;
    visited[node] = true;

    if (!isInvalid(node)) {
      result.push(node);
    }
  }
  
  for (const node in graph) {
    if (!visited[node] && !processing[node]) {
      topSort(node);
    }
  }

  // Proper topological sort dictates we simply return the
  //  result at this point. But, mod authors want modules
  //  with no dependencies to bubble up to the top of the LO.
  //  (This will only apply to non locked entries)
  if (allowLocked) {
    return result;
  }

  const subModsWithNoDeps = result.filter(dep => (graph[dep].length === 0)
    || (graph[dep].find(d => !LOCKED_MODULES.has(d)) === undefined)).sort() || [];
  let tamperedResult = [].concat(subModsWithNoDeps, result.filter(entry => !subModsWithNoDeps.includes(entry)));
  lockedSubMods.forEach(subModId => {
    const pos = loadOrder[CACHE[subModId].vortexId].pos;
    tamperedResult.splice(pos, 0, [subModId]);
  });
  return tamperedResult;
}

function isExternal(context, subModId) {
  const state = context.api.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const modIds = Object.keys(mods);
  modIds.forEach(modId => {
    const subModIds = util.getSafe(mods[modId], ['attributes', 'subModIds'], []);
    if (subModIds.includes(subModId)) {
      return false;
    }
  })
  return true;
}

let refreshFunc;
async function refreshCacheOnEvent(context, profileId) {
  CACHE = {};
  if (profileId === undefined) {
    return Promise.resolve();
  }
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  const deployProfile = selectors.profileById(state, profileId);
  if ((activeProfile?.gameId !== deployProfile?.gameId) || (activeProfile?.gameId !== GAME_ID)) {
    // Deployment event seems to be executed for a profile other
    //  than the currently active one. Not going to continue.
    return Promise.resolve();
  }

  try {
    const deployedSubModules = await getDeployedSubModPaths(context);
    CACHE = await getDeployedModData(context, deployedSubModules);
  } catch (err) {
    // ProcessCanceled means that we were unable to scan for deployed
    //  subModules, probably because game discovery is incomplete.
    // It's beyond the scope of this function to report discovery
    //  related issues.
    return (err instanceof util.ProcessCanceled)
      ? Promise.resolve()
      : Promise.reject(err);
  }

  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profileId], {});

  // We're going to do a quick tSort at this point - not going to
  //  change the user's load order, but this will highlight any
  //  cyclic or missing dependencies.
  const modIds = Object.keys(CACHE);
  const sorted = tSort(modIds, true, loadOrder);

  if (refreshFunc !== undefined) {
    refreshFunc();
  }

  return refreshGameParams(context, loadOrder);
}

async function preSort(context, items, direction, updateType) {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  if (activeProfile?.id === undefined || activeProfile?.gameId !== GAME_ID) {
    // Race condition ?
    return items;
  }

  let modIds = Object.keys(CACHE);
  if (items.length > 0 && modIds.length === 0) {
    // Cache hasn't been populated yet.
    try {
      // Refresh the cache.
      await refreshCacheOnEvent(context, activeProfile.id);
      modIds = Object.keys(CACHE);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // Locked ids are always at the top of the list as all
  //  other modules depend on these.
  let lockedIds = modIds.filter(id => CACHE[id].isLocked);

  try {
    // Sort the locked ids amongst themselves to ensure
    //  that the game receives these in the right order.
    lockedIds = tSort(lockedIds, true);
  } catch (err) {
    return Promise.reject(err);
  }

  // Create the locked entries.
  const lockedItems = lockedIds.map(id => ({
    id: CACHE[id].vortexId,
    name: CACHE[id].subModName,
    imgUrl: `${__dirname}/gameart.jpg`,
    locked: true,
    official: OFFICIAL_MODULES.has(id),
  }));
  
  // External ids will include official modules as well but not locked entries.
  const externalIds = modIds.filter(id => (!CACHE[id].isLocked) && (CACHE[id].vortexId === id));
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
  const LOkeys = ((Object.keys(loadOrder).length > 0)
    ? Object.keys(loadOrder)
    : LAUNCHER_DATA.singlePlayerSubMods.map(mod => mod.subModId));

  // External modules that are already in the load order.
  const knownExt = externalIds.filter(id => LOkeys.includes(id)) || [];

  // External modules which are new and have yet to be added to the LO.
  const unknownExt = externalIds.filter(id => !LOkeys.includes(id)) || [];

  items = items.filter(item => {
    // Remove any lockedIds, but also ensure that the
    //  entry can be found in the cache. If it's not in the
    //  cache, this may mean that the submod xml file failed
    //  parse-ing and therefore should not be displayed.
    const isLocked = lockedIds.includes(item.id);
    const hasCacheEntry = Object.keys(CACHE).find(key =>
      CACHE[key].vortexId === item.id) !== undefined;
    return !isLocked && hasCacheEntry;
  });

  const posMap = {};
  let nextAvailable = LOkeys.length;
  const getNextPos = (loId) => {
    if (LOCKED_MODULES.has(loId)) {
      return Array.from(LOCKED_MODULES).indexOf(loId);
    }

    if (posMap[loId] === undefined) {
      posMap[loId] = nextAvailable;
      return nextAvailable++;
    } else {
      return posMap[loId];
    }
  }

  knownExt.map(key => ({
    id: CACHE[key].vortexId,
    name: CACHE[key].subModName,
    imgUrl: `${__dirname}/gameart.jpg`,
    external: isExternal(context, CACHE[key].vortexId),
    official: OFFICIAL_MODULES.has(key),
  }))
    .sort((a, b) => (loadOrder[a.id]?.pos || getNextPos(a.id)) - (loadOrder[b.id]?.pos || getNextPos(b.id)))
    .forEach(known => {
      // If this a known external module and is NOT in the item list already
      //  we need to re-insert in the correct index as all known external modules
      //  at this point are actually deployed inside the mods folder and should
      //  be in the items list!
      const diff = (LOkeys.length) - (LOkeys.length - Array.from(LOCKED_MODULES).length);
      if (items.find(item => item.id === known.id) === undefined) {
        const pos = loadOrder[known.id]?.pos;
        const idx = (pos !== undefined) ? (pos - diff) : (getNextPos(known.id) - diff);
        items.splice(idx, 0, known);
        //items = [].concat(items.slice(0, idx) || [], known, items.slice(idx) || []);
      }
    });

  const unknownItems = [].concat(unknownExt)
    .map(key => ({
      id: CACHE[key].vortexId,
      name: CACHE[key].subModName,
      imgUrl: `${__dirname}/gameart.jpg`,
      external: isExternal(context, CACHE[key].vortexId),
      official: OFFICIAL_MODULES.has(key),
    }));

  const preSorted = [].concat(lockedItems, items, unknownItems);
  return (direction === 'descending')
    ? Promise.resolve(preSorted.reverse())
    : Promise.resolve(preSorted);
}

function infoComponent(context, props) {
  const t = context.api.translate;
  return React.createElement(BS.Panel, { id: 'loadorderinfo' },
    React.createElement('h2', {}, t('Managing your load order', { ns: I18N_NAMESPACE })),
    React.createElement(FlexLayout.Flex, {},
    React.createElement('div', {},
    React.createElement('p', {}, t('You can adjust the load order for Bannerlord by dragging and dropping mods up or down on this page. '
                                 + 'Please keep in mind that Bannerlord is still in Early Access, which means that there might be significant '
                                 + 'changes to the game as time goes on. Please notify us of any Vortex related issues you encounter with this '
                                 + 'extension so we can fix it. For more information and help see: ', { ns: I18N_NAMESPACE }),
    React.createElement('a', { onClick: () => util.opn('https://wiki.nexusmods.com/index.php/Modding_Bannerlord_with_Vortex') }, t('Modding Bannerlord with Vortex.', { ns: I18N_NAMESPACE }))))),
    React.createElement('div', {},
      React.createElement('p', {}, t('How to use:', { ns: I18N_NAMESPACE })),
      React.createElement('ul', {},
        React.createElement('li', {}, t('Check the box next to the mods you want to be active in the game.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Click Auto Sort in the toolbar. (See below for details).', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Make sure to run the game directly via the Play button in the top left corner '
                                      + '(on the Bannerlord tile). Your Vortex load order may not be loaded if you run the Single Player game through the game launcher.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Optional: Manually drag and drop mods to different positions in the load order (for testing different overrides). Mods further down the list override mods further up.', { ns: I18N_NAMESPACE })))),
    React.createElement('div', {},
      React.createElement('p', {}, t('Please note:', { ns: I18N_NAMESPACE })),
      React.createElement('ul', {},
        React.createElement('li', {}, t('The load order reflected here will only be loaded if you run the game via the play button in '
                                      + 'the top left corner. Do not run the Single Player game through the launcher, as that will ignore '
                                      + 'the Vortex load order and go by what is shown in the launcher instead.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('For Bannerlord, mods sorted further towards the bottom of the list will override mods further up (if they conflict). '
                                      + 'Note: Harmony patches may be the exception to this rule.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Auto Sort uses the SubModule.xml files (the entries under <DependedModules>) to detect '
                                      + 'dependencies to sort by. ', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('If you cannot see your mod in this load order, Vortex may have been unable to find or parse its SubModule.xml file. '
                                      + 'Most - but not all mods - come with or need a SubModule.xml file.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Hit the deploy button whenever you install and enable a new mod.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('The game will not launch unless the game store (Steam, Epic, etc) is started beforehand. If you\'re getting the '
                                      + '"Unable to Initialize Steam API" error, restart Steam.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Right clicking an entry will open the context menu which can be used to lock LO entries into position; entry will '
                                      + 'be ignored by auto-sort maintaining its locked position.', { ns: I18N_NAMESPACE })))));
}

let _IS_SORTING = false;
function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Mount & Blade II:\tBannerlord',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    logo: 'gameart.jpg',
    executable: () => BANNERLORD_EXEC,
    setup: (discovery) => prepareForModding(context, discovery),
    requiredFiles: [
      BANNERLORD_EXEC
    ],
    parameters: [],
    requiresCleanup: true,
    environment: {
      SteamAPPId: STEAMAPP_ID.toString(),
    },
    details: {
      steamAppId: STEAMAPP_ID,
      epicAppId: EPICAPP_ID,
      customOpenModsPath: MODULES,
    },
  });

  // Register the LO page.
  context.registerLoadOrderPage({
    gameId: GAME_ID,
    createInfoPanel: (props) => {
      refreshFunc = props.refresh;
      return infoComponent(context, props);
    },
    gameArtURL: `${__dirname}/gameart.jpg`,
    preSort: (items, direction) => preSort(context, items, direction),
    callback: (loadOrder) => refreshGameParams(context, loadOrder),
    itemRenderer: CustomItemRenderer.default,
  });

  context.registerInstaller('bannerlordrootmod', 20, testRootMod, installRootMod);

  // Installs one or more submodules.
  context.registerInstaller('bannerlordsubmodules', 25, testForSubmodules, installSubModules);

  // A very simple migration that intends to add the subModIds attribute
  //  to mods that act as "mod packs". This migration is non-invasive and will
  //  not report any errors. Side effects of the migration not working correctly
  //  will not affect the user's existing environment.
  context.registerMigration(old => migrate026(context.api, old));

  context.registerAction('generic-load-order-icons', 200,
    _IS_SORTING ? 'spinner' : 'loot-sort', {}, 'Auto Sort', async () => {
      if (_IS_SORTING) {
        // Already sorting - don't do anything.
        return Promise.resolve();
      }

      _IS_SORTING = true;

      try {
        CACHE = {};
        const deployedSubModules = await getDeployedSubModPaths(context);
        CACHE = await getDeployedModData(context, deployedSubModules);
      } catch (err) {
        context.api.showErrorNotification('Failed to resolve submodule file data', err);
        _IS_SORTING = false;
        return;
      }

      const modIds = Object.keys(CACHE);
      const lockedIds = modIds.filter(id => CACHE[id].isLocked);
      const subModIds = modIds.filter(id => !CACHE[id].isLocked);

      let sortedLocked = [];
      let sortedSubMods = [];

      const state = context.api.store.getState();
      const activeProfile = selectors.activeProfile(state);
      if (activeProfile?.id === undefined) {
        // Probably best that we don't report this via notification as a number
        //  of things may have occurred that caused this issue. We log it instead.
        log('error', 'Failed to sort mods', { reason: 'No active profile' });
        _IS_SORTING = false;
        return;
      }

      const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});

      try {
        sortedLocked = tSort(lockedIds, true);
        sortedSubMods = tSort(subModIds, false, loadOrder);
      } catch (err) {
        context.api.showErrorNotification('Failed to sort mods', err);
        return;
      }

      const newOrder = [].concat(sortedLocked, sortedSubMods).reduce((accum, id, idx) => {
        const vortexId = CACHE[id].vortexId;
        const newEntry = {
          pos: idx,
          enabled: CACHE[id].isOfficial
            ? true
            : (!!loadOrder[vortexId])
              ? loadOrder[vortexId].enabled
              : true,
          locked: (loadOrder[vortexId]?.locked === true),
        }

        accum[vortexId] = newEntry;
        return accum;
      }, {});

      context.api.store.dispatch(actions.setLoadOrder(activeProfile.id, newOrder));
      return refreshGameParams(context, newOrder)
        .then(() => context.api.sendNotification({
          id: 'mnb2-sort-finished',
          type: 'info',
          message: context.api.translate('Finished sorting', { ns: I18N_NAMESPACE }),
          displayMS: 3000,
        })).finally(() => _IS_SORTING = false);
  }, () => {
    const state = context.api.store.getState();
    const gameId = selectors.activeGameId(state);
    return (gameId === GAME_ID);
  });

  context.once(() => {
    context.api.onAsync('did-deploy', async (profileId, deployment) =>
      refreshCacheOnEvent(context, profileId));

    context.api.onAsync('did-purge', async (profileId) =>
      refreshCacheOnEvent(context, profileId));

    context.api.events.on('gamemode-activated', (gameMode) => {
      const state = context.api.getState();
      const prof = selectors.activeProfile(state);
      refreshCacheOnEvent(context, prof?.id);
    });

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
          if (mod === undefined) {
            return Promise.resolve();
          }
          const relPath = path.relative(modPaths[mod.type ?? ''], entry.filePath);
          const targetPath = path.join(installPath, mod.id, relPath);
          // copy the new file back into the corresponding mod, then delete it. That way, vortex will
          // create a link to it with the correct deployment method and not ask the user any questions
          await fs.ensureDirAsync(path.dirname(targetPath));

          // Remove the target destination file if it exists.
          //  this is to completely avoid a scenario where we may attempt to
          //  copy the same file onto itself.
          return fs.removeAsync(targetPath)
            .catch(err => (err.code === 'ENOENT')
              ? Promise.resolve()
              : Promise.reject(err))
            .then(() => fs.copyAsync(entry.filePath, targetPath))
            .then(() => fs.removeAsync(entry.filePath))
            .catch(err => log('error', 'failed to import added file to mod', err.message));
        }
      });
    });
  })

  return true;
}

module.exports = {
  default: main,
  getValidationInfo,
};
