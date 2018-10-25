const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\Morrowind',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('The Elder Scrolls III: Morrowind')
      .then(game => game.gamePath);
  }
}

let tools = [
];

function main(context) {
  context.registerGame({
    id: 'morrowind',
    name: 'Morrowind',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'Data Files',
    logo: 'gameart.png',
    executable: () => 'morrowind.exe',
    requiredFiles: [
      'morrowind.exe',
    ],
    environment: {
      SteamAPPId: '22320',
    },
    details: {
      steamAppId: 22320,
    },
  });
  return true;
}

module.exports = {
  default: main
};
