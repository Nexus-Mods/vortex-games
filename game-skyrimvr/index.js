/* eslint-disable */
const { getFileVersion, getFileVersionLocalized } = require('exe-version');
const path = require('path');
const { actions, selectors, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const GAME_ID = 'skyrimvr';
const ESL_ENABLER_LIB = 'skyrimvresl.dll';

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Skyrim VR',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.GameStoreHelper.findByAppId(['611670'])
      .then(game => game.gamePath);
  }
}

function getGameVersion(gamePath, exePath) {
  const fullPath = path.join(gamePath, exePath);
  const fileVersion = getFileVersion(fullPath);

  return (Promise.resolve((fileVersion !== '1.0.0.0')
    ? fileVersion
    : getFileVersionLocalized(fullPath)))
    .then(version => version + '-VR');
}

const tools = [
  {
    id: 'TES5VREdit',
    name: 'TES5VREdit',
    logo: 'tes5edit.png',
    executable: () => 'TES5VREdit.exe',
    requiredFiles: [
      'TES5VREdit.exe',
    ],
  },
  {
    id: 'FNIS',
    name: 'Fores New Idles in Skyrim',
    shortName: 'FNIS',
    logo: 'fnis.png',
    executable: () => 'GenerateFNISForUsers.exe',
    requiredFiles: [
      'GenerateFNISForUsers.exe',
    ],
    relative: true,
  },
  {
    id: 'sksevr',
    name: 'Skyrim Script Extender VR',
    shortName: 'SKSEVR',
    executable: () => 'sksevr_loader.exe',
    requiredFiles: [
      'sksevr_loader.exe',
      'SkyrimVR.exe',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true,
  },
];

function isESLSupported(api) {
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  if (discovery?.store === 'xbox') {
    return false;
  }
  const modState = util.getSafe(state, ['persistent', 'profiles', profileId, 'modState'], {});
  const isEnabled = (modId) => util.getSafe(modState, [modId, 'enabled'], false);
  const mods = util.getSafe (state, ['persistent', 'mods', GAME_ID], {});
  const hasESLEnabler = Object.keys(mods).some(modId => isEnabled(modId) && mods[modId].attributes.eslEnabler === true);
  return hasESLEnabler;
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Skyrim VR',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'Data',
    logo: 'gameart.jpg',
    executable: () => 'SkyrimVR.exe',
    getGameVersion,
    requiredFiles: [
      'SkyrimVR.exe',
    ],
    environment: {
      SteamAPPId: '611670',
    },
    details: {
      steamAppId: 611670,
      compatibleDownloads: ['skyrimse'],
      supportsESL: () => isESLSupported(context.api),
    }
  });

  context.once(() => {
    context.api.onAsync('did-deploy', (profileId, newDeployment) => {
      const state = context.api.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID) {
        return Promise.resolve();
      }
      const discovery = selectors.discoveryByGame(state, GAME_ID);
      if (!discovery?.path || discovery?.store === 'xbox') {
        // Skyrim VR is currently not on Xbox, but it may be one day!
        return Promise.resolve();
      }

      const deployedFiles = newDeployment[''];
      const modESLEnabler = deployedFiles.find(file => file.relPath.toLowerCase().endsWith(ESL_ENABLER_LIB));
      if (modESLEnabler === undefined) {
        return Promise.resolve();
      }

      const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
      const mod = Object.values(mods).find(mod => mod.installationPath === modESLEnabler.source);
      if (mod === undefined || mod.attributes.eslEnabler === true) {
        return Promise.resolve();
      }

      const modAttributes = {
        ...mod.attributes,
        eslEnabler: true,
      };

      context.api.store.dispatch(actions.setModAttributes(GAME_ID, mod.id, modAttributes));
      return Promise.resolve();
    });
  });

  return true;
}

module.exports = {
  default: main,
};
