import Bluebird from 'bluebird';
import { Element } from 'libxmljs';
import path from 'path';
import semver from 'semver';
import { log, selectors, types, util } from 'vortex-api';
import { GAME_ID, LOCKED_MODULES, MODULES,
  OFFICIAL_MODULES, SUBMOD_FILE } from './common';
import { ISubModCache } from './types';
import { getElementValue, getXMLData, walkAsync } from './util';

const XML_EL_MULTIPLAYER = 'MultiplayerModule';
const LAUNCHER_DATA_PATH = path.join(util.getVortexPath('documents'), 'Mount and Blade II Bannerlord', 'Configs', 'LauncherData.xml');
const LAUNCHER_DATA = {
  singlePlayerSubMods: [],
  multiplayerSubMods: [],
};

export function getLauncherData() {
  return LAUNCHER_DATA;
}

let CACHE: ISubModCache = {};
export function getCache() {
  return CACHE;
}

export async function refreshCache(context: types.IExtensionContext) {
  try {
    CACHE = {};
    const subModuleFilePaths: string[] = await getDeployedSubModPaths(context);
    CACHE = await getDeployedModData(context, subModuleFilePaths);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function getDeployedSubModPaths(context: types.IExtensionContext) {
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

async function getDeployedModData(context: types.IExtensionContext, subModuleFilePaths: string[]) {
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
      log('debug', 'failed to sanitize/coerce version',
        { subModId, unsanitized, error: err.message });
      return undefined;
    }
  };

  return Bluebird.reduce(subModuleFilePaths, async (accum, subModFile: string) => {
    try {
      const getAttrValue = (node, attr) => node?.[attr]?.[0]?.$?.value;
      const subModData = await getXMLData(subModFile);
      const module = subModData?.Module;
      const subModId = getAttrValue(module, 'Id');
      const subModVerData = getAttrValue(module, 'Version');
      const subModVer = getCleanVersion(subModId, subModVerData);
      const managedEntry = managedIds.find(entry => entry.subModId === subModId);
      const isMultiplayer = getAttrValue(module, XML_EL_MULTIPLAYER) !== undefined;
      const depNodes = module?.DependedModules?.[0]?.DependedModule;
      let dependencies = [];
      try {
        dependencies = depNodes.map(depNode => {
          let depVersion;
          const depId = depNode?.$?.Id;
          try {
            const unsanitized = depNode?.$?.DependentVersion;
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
      const subModName = getAttrValue(module, 'Name');

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
    } catch (err) {
      const errorMessage = 'Vortex was unable to parse: ' + subModFile + ';\n\n'
                         + 'You can either inform the mod author and wait for fix, or '
                         + 'you can use an online xml validator to find and fix the '
                         + 'error yourself.';
      // libxmljs rarely produces useful error messages - it usually points
      //  to the parent node of the actual problem and in this case nearly
      //  always will point to the root of the XML file (Module) which is completely useless.
      //  We're going to provide a human readable error to the user.
      context.api.showErrorNotification('Unable to parse submodule file',
        errorMessage, { allowReport: false });
      log('error', 'MNB2: parsing error', err);
    }
    return Promise.resolve(accum);
  }, {});
}

export async function parseLauncherData() {
  const createDataElement = (xmlNode) => {
    if (xmlNode === undefined) {
      return undefined;
    }
    return {
      subModId: xmlNode?.Id[0],
      enabled: xmlNode?.IsSelected[0] === 'true',
    };
  };

  const launcherData = await getXMLData(LAUNCHER_DATA_PATH);
  try {
    const singlePlayerMods = launcherData?.UserData?.SingleplayerData?.[0]?.ModDatas?.[0]?.UserModData;
    const multiPlayerMods = launcherData?.UserData?.MultiplayerData?.[0]?.ModDatas?.[0]?.UserModData;
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
    // This is potentially due to the game not being installed correctly
    //  or perhaps the users are using a 3rd party launcher which overwrites
    //  the default launcher configuration... Lets just default to the data
    //  we expect and let the user deal with whatever is broken later on
    //  his environment later.
    log('error', 'failed to parse launcher data', err);
    LAUNCHER_DATA.singlePlayerSubMods = [
      { subModId: 'Native', enabled: true },
      { subModId: 'SandBoxCore', enabled: true },
      { subModId: 'CustomBattle', enabled: true },
      { subModId: 'Sandbox', enabled: true },
      { subModId: 'StoryMode', enabled: true },
    ];
    LAUNCHER_DATA.multiplayerSubMods = [];
    return Promise.resolve();
  }
}

async function getManagedIds(context: types.IExtensionContext) {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  if (activeProfile === undefined) {
    // This is a valid use case if the gamemode
    //  has failed activation.
    return Promise.resolve([]);
  }

  const modState = util.getSafe(state,
    ['persistent', 'profiles', activeProfile.id, 'modState'], {});
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
  return Bluebird.reduce(enabledMods, async (accum, entry) => {
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

    const subModFile = files.find(file => path.basename(file).toLowerCase() === SUBMOD_FILE);
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
      return Promise.resolve(accum);
    }
    accum.push({
      subModId,
      subModFile,
      vortexId: entry.id,
    });

    return Promise.resolve(accum);
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

export function isInvalid(subModId: string) {
  const cyclicErrors = util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
  const missingDeps = util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
  return ((cyclicErrors.length > 0) || (missingDeps.length > 0));
}

export function getValidationInfo(vortexId: string) {
  // We expect the method caller to provide the vortexId of the subMod, as
  //  this is how we store this information in the load order object.
  //  Reason why we need to search the cache by vortexId rather than subModId.
  const subModId = Object.keys(CACHE).find(key => CACHE[key].vortexId === vortexId);
  const cyclic = util.getSafe(CACHE[subModId], ['invalid', 'cyclic'], []);
  const missing = util.getSafe(CACHE[subModId], ['invalid', 'missing'], []);
  const incompatible = util.getSafe(CACHE[subModId], ['invalid', 'incompatibleDeps'], []);
  return {
    cyclic,
    missing,
    incompatible,
  };
}
