const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Fallout 4 VR',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('Fallout 4 VR')
      .then(game => game.gamePath);
  }
}

let tools = [
  {
    id: 'FO4VREdit',
    name: 'FO4VREdit',
    logo: 'fo3edit.png',
    executable: () => 'FO4VREdit.exe',
    requiredFiles: [
      'FO4VREdit.exe',
    ],
  },
];

function main(context) {
  context.registerGame({
    id: 'fallout4vr',
    name: 'Fallout 4 VR',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.png',
    executable: () => 'Fallout4VR.exe',
    requiredFiles: [
      'Fallout4VR.exe',
    ],
    environment: {
      SteamAPPId: '611660',
    },
    details: {
      steamAppId: 611660,
    }
  });

  return true;
}

module.exports = {
  default: main,
};
