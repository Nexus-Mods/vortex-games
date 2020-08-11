const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

const MORROWIND_ID = 'morrowind';
const STEAMAPP_ID = '1172380';
const GOGAPP_ID = '1435828767';

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID])
      .then(game => game.gamePath)
      .catch(() => {
        const instPath = winapi.RegGetValue(
          'HKEY_LOCAL_MACHINE',
          'Software\\Wow6432Node\\Bethesda Softworks\\Morrowind',
          'Installed Path'
        );

        if (!instPath) throw new Error('empty registry key');
        return Promise.resolve(instPath.value);
      });
}

const tools = [
  {
    id: 'tes3edit',
    name: 'TES3Edit',
    logo: 'tes3edit.png',
    executable: () => 'TES3Edit.exe',
    requiredFiles: []
  },
  {
    id: 'mw-construction-set',
    name: 'Construction Set',
    executable: () => 'TES Construction Set.exe',
    requiredFiles: [
      'TES Construction Set.exe',
    ],
    relative: true,
    exclusive: true
  }
];

function main(context) {
  context.registerGame({
    id: MORROWIND_ID,
    name: 'Morrowind',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'Data Files',
    logo: 'gameart.jpg',
    executable: () => 'morrowind.exe',
    requiredFiles: [
      'morrowind.exe',
    ],
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: parseInt(STEAMAPP_ID),
      gogAppId: GOGAPP_ID
    },
  });
  return true;
}

module.exports = {
  default: main
};
