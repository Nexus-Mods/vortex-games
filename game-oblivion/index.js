const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Bethesda Softworks\\oblivion',
      'Installed Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('The Elder Scrolls IV: Oblivion')
      .then(game => game.gamePath);
  }
}

let tools = [
  {
    id: 'TES4Edit',
    name: 'TES4Edit',
    logo: 'tes5edit.png',
    executable: () => 'TES4Edit.exe',
    requiredFiles: [
      'TES4Edit.exe',
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
    id: 'obse',
    name: 'Oblivion Script Extender',
    shortName: 'OBSE',
    executable: () => 'obse_loader.exe',
    requiredFiles: [
      'obse_loader.exe',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true,
  },
];

function main(context) {
  context.registerGame({
    id: 'oblivion',
    name: 'Oblivion',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'data',
    logo: 'gameart.jpg',
    executable: () => 'oblivion.exe',
    requiredFiles: [
      'oblivion.exe',
    ],
    environment: {
      SteamAPPId: '22330',
    },
    details: {
      steamAppId: 22330,
    },
  });
  return true;
}

module.exports = {
  default: main
};
