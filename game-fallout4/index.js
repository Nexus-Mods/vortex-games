const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

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
      .then(game => game.gamePath);
  }
}

let tools = [
  {
    id: 'FO4Edit',
    name: 'FO4Edit',
    logo: 'tes5edit.png',
    executable: () => 'xedit.exe',
    requiredFiles: [
      'tes5edit.exe',
    ],
  },
  {
    id: 'FNIS',
    name: 'FNIS',
    logo: 'fnis.png',
    executable: () => 'GenerateFNISForUsers.exe',
    requiredFiles: [
      'GenerateFNISForUsers.exe',
    ],
    relative: true,
  },
  {
    id: 'f4se',
    name: 'F4SE',
    executable: () => 'f4se_loader.exe',
    requiredFiles: [
      'f4se_loader.exe',
    ],
    relative: true,
  },
];

function main(context) {
  context.registerGame({
    id: 'fallout4',
    name: 'Fallout 4',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'Fallout4.exe',
    requiredFiles: [
      'Fallout4.exe',
    ],
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
