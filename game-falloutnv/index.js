const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\falloutnv',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.GameStoreHelper.findByName('Fallout: New Vegas.*')
      .catch(err => util.GameStoreHelper.findByAppId(['22380', '22490', '1454587428']))
      .then(game => game.gamePath);
  }
}

let tools = [
  {
    id: 'FNVEdit',
    name: 'FNVEdit',
    logo: 'fo3edit.png',
    executable: () => 'FNVEdit.exe',
    requiredFiles: [
      'FNVEdit.exe',
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
    id: 'nvse',
    name: 'New Vegas Script Extender',
    logo: 'nvse.png',
    shortName: 'NVSE',
    executable: () => 'nvse_loader.exe',
    requiredFiles: [
      'nvse_loader.exe',
      'FalloutNV.exe',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true,
  }
];

function main(context) {
  context.registerGame({
    id: 'falloutnv',
    name: 'Fallout:\tNew Vegas',
    shortName: 'New Vegas',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.jpg',
    executable: () => 'FalloutNV.exe',
    requiredFiles: [
      'FalloutNV.exe',
    ],
    environment: {
      SteamAPPId: '22380',
    },
    details: {
      steamAppId: 22380,
      nexusPageId: 'newvegas',
    }
  });
  return true;
}

module.exports = {
  default: main,
};
