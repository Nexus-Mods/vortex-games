const Promise = require('bluebird');
const path = require('path');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

const MS_ID = 'BethesdaSoftworks.Fallout4-PC';
function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Fallout4',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('Fallout 4')
      .catch(() => util.GameStoreHelper.findByAppId([MS_ID], 'xbox'))
      .then(game => game.gamePath);
  }
}

let tools = [
  {
    id: 'FO4Edit',
    name: 'FO4Edit',
    logo: 'fo3edit.png',
    executable: () => 'FO4Edit.exe',
    requiredFiles: [
      'FO4Edit.exe',
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
    id: 'f4se',
    name: 'Fallout 4 Script Extender',
    shortName: 'F4SE',
    executable: () => 'f4se_loader.exe',
    requiredFiles: [
      'f4se_loader.exe',
      'Fallout4.exe',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true
  },
  {
    id: 'bodyslide',
    name: 'BodySlide',
    executable: () => path.join('Data', 'Tools', 'BodySlide', 'BodySlide x64.exe'),
    requiredFiles: [
      path.join('Data', 'Tools', 'BodySlide', 'BodySlide x64.exe'),
    ],
    relative: true,
    logo: 'auto',
  }
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

function main(context) {
  context.registerGame({
    id: 'fallout4',
    name: 'Fallout 4',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.jpg',
    executable: () => 'Fallout4.exe',
    requiredFiles: [
      'Fallout4.exe',
    ],
    requiresLauncher,
    environment: {
      SteamAPPId: '377160',
    },
    details: {
      steamAppId: 377160,
    }
  });

  return true;
}

module.exports = {
  default: main,
};
