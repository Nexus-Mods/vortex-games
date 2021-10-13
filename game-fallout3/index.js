const Promise = require('bluebird');
const path = require('path');
const { fs, util } = require('vortex-api');
const winapi = require('winapi-bindings');

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
    return util.GameStoreHelper.findByAppId(['22300', '22370', '1454315831'])
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
      'data/fallout3.esm',
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
    queryModPath: () => 'data',
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
      'data/fallout3.esm'
    ],
    environment: {
      SteamAPPId: '22300',
    },
    details: {
      steamAppId: 22300,
    }
  });

  return true;
}

module.exports = {
  default: main,
};
