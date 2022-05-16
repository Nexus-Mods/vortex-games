const { getFileVersion, getFileVersionLocalized } = require('exe-version');
const path = require('path');
const { fs, selectors, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const GAME_ID = 'skyrimse';
const MS_ID = 'BethesdaSoftworks.SkyrimSE-PC';
function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Skyrim Special Edition',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('The Elder Scrolls V: Skyrim Special Edition')
      .catch(() => util.GameStoreHelper.findByAppId([MS_ID], 'xbox'))
      .then(game => game.gamePath);
  }
}

const tools = [
  {
    id: 'SSEEdit',
    name: 'SSEEdit',
    logo: 'tes5edit.png',
    executable: () => 'SSEEdit.exe',
    requiredFiles: [
      'SSEEdit.exe',
    ],
  },
  {
    id: 'WryeBash',
    name: 'Wrye Bash',
    logo: 'wrye.png',
    executable: () => 'Wrye Bash.exe',
    requiredFiles: [
      'Wrye Bash.exe',
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
    id: 'skse64',
    name: 'Skyrim Script Extender 64',
    shortName: 'SKSE64',
    executable: () => 'skse64_loader.exe',
    requiredFiles: [
      'skse64_loader.exe',
      'SkyrimSE.exe',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true,
  },
  {
    id: 'bodyslide',
    name: 'BodySlide',
    executable: () => path.join('Data', 'CalienteTools', 'BodySlide', 'BodySlide x64.exe'),
    requiredFiles: [
      path.join('Data', 'CalienteTools', 'BodySlide', 'BodySlide x64.exe'),
    ],
    relative: true,
    logo: 'auto',
  },
];

function requiresLauncher(gamePath) {
  return util.GameStoreHelper.findByAppId([MS_ID], 'xbox')
    .then(() => Promise.resolve({
      launcher: 'xbox',
      addInfo: {
        appId: MS_ID,
        parameters: [
          { appExecName: 'Game' },
        ],
      }
    }))
    .catch(err => Promise.resolve(undefined));
}

async function getGameVersion(api, gamePath, exePath) {
  const appManifest = path.join(gamePath, 'appxmanifest.xml');
  try {
    await fs.statAsync(appManifest);
    if (api.ext?.['getHashVersion']) {
      const state = api.getState();
      const game = selectors.gameById(state, GAME_ID);
      const discovery = selectors.discoveryByGame(state, GAME_ID);
      return new Promise((resolve, reject) => {
        api.ext?.['getHashVersion'](game, discovery, (err, ver) => {
          return err !== null
            ? reject(err)
            : resolve(ver);
        });
      }); 
    } else {
      throw new util.NotSupportedError();
    }
  } catch (err) {
    const fullPath = path.join(gamePath, exePath);
    const fileVersion = getFileVersion(fullPath);
    return (fileVersion !== '1.0.0.0')
      ? fileVersion
      : getFileVersionLocalized(fullPath);
  }
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Skyrim Special Edition',
    shortName: 'SSE',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'Data',
    logo: 'gameart.jpg',
    executable: () => 'SkyrimSE.exe',
    requiredFiles: [
      'SkyrimSE.exe',
    ],
    requiresLauncher,
    getGameVersion: (gamePath, exePath) => getGameVersion(context.api, gamePath, exePath),
    environment: {
      SteamAPPId: '489830',
    },
    details: {
      steamAppId: 489830,
      nexusPageId: 'skyrimspecialedition',
      hashFiles: [
        'appxmanifest.xml',
        path.join('Data', 'Skyrim.esm'),
        path.join('Data', 'Update.esm'),
      ],
    }
  });

  return true;
}

module.exports = {
  default: main,
};
