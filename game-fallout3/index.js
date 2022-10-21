const Promise = require('bluebird');
const path = require('path');
const { fs, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const STEAMAPP_ID = '22300';
const STEAMAPP_ID2 = '22370';
const GOGAPP_ID = '1454315831';
const EPIC_ID = 'adeae8bbfc94427db57c7dfecce3f1d4';
const XBOX_ID = 'BethesdaSoftworks.Fallout3';

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Fallout3',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.GameStoreHelper.findByAppId([STEAMAPP_ID, STEAMAPP_ID2, GOGAPP_ID, EPIC_ID, XBOX_ID])
      .catch(err => util.GameStoreHelper.findByName('Fallout 3.*'))
      .then(game => game.gamePath);
  }
}

let tools = [
  {
    id: 'FO3Edit',
    name: 'FO3Edit',
    logo: 'fo3edit.png',
    executable: () => 'FO3Edit.exe',
    requiredFiles: [
      'FO3Edit.exe',
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
    id: 'fose',
    name: 'Fallout Script Extender',
    shortName: 'FOSE',
    executable: () => 'fose_loader.exe',
    requiredFiles: [
      'fose_loader.exe',
      'Data/fallout3.esm',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true
  }
];

function main(context) {
  context.registerGame({
    id: 'fallout3',
    name: 'Fallout 3',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'Data',
    logo: 'gameart.jpg',
    executable: (discoveryPath) => {
      if (discoveryPath === undefined) {
        return 'fallout3.exe';
      } else {
        try {
          fs.statSync(path.join(discoveryPath, 'fallout3ng.exe'));
          return 'fallout3ng.exe';
        } catch (err) {
          return 'fallout3.exe';
        }
      }
    },
    requiredFiles: [
      'Data/fallout3.esm'
    ],
    environment: {
      SteamAPPId: '22300',
    },
    details: {
      steamAppId: 22300,
      hashFiles: ['Data/Fallout3.esm'],
    }
  });

  return true;
}

module.exports = {
  default: main,
};
