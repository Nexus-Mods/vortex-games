const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Steam\\steamapps\\common\\Team Fortress 2',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('Team Fortress 2')
      .then(game => game.gamePath);
  }
}

let tools = [
  {
    id: 'hammer',
    name: 'Hammer',
    logo: 'hammer.png',
    executable: () => 'hammer.exe',
    requiredFiles: [
      'hammer.exe',
    ],
  },
];

function main(context) {
  context.registerGame({
    id: 'teamfortress2',
    name: 'Team Fortress 2',
    shortName: 'TF2',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'tf\\custom',
    logo: 'gameart.png',
    executable: () => 'hl2.exe',
    requiredFiles: [
      'hl2.exe',
    ],
    environment: {
      SteamAPPId: '440',
    },
    details: {
      steamAppId: 440,
      nexusPageId: 'teamfortress2',
    }
  });
  return true;
}

module.exports = {
  default: main,
};
