const Promise = require('bluebird');
const path = require('path');
const { fs, util, log } = require('vortex-api');
const STEAMAPP_ID = '22300';
const STEAMAPP_ID2 = '22370';
const GOG_ID = '1454315831';
const EPIC_ID = 'adeae8bbfc94427db57c7dfecce3f1d4';
const MS_ID = 'BethesdaSoftworks.Fallout3';

const gameStoreIds = {
  steam: [{ id: STEAMAPP_ID, prefer: 0 }, { id: STEAMAPP_ID2 }, { name: 'Fallout 3.*' }],
  xbox: [{ id: MS_ID }],
  gog: [{ id: GOG_ID }],
  epic: [{ id: EPIC_ID }],
  registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\Fallout3:Installed Path' }],
};

const tools = [
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

// List of folders in the various languages on Epic, for now we default to English but this could be enhanced to select a folder based on the Vortex locale.
// It's possible that some mods don't work with the non-English variant. 
// Structure is {GAME FOLDER}\{LANGUAGE FOLDER}
const localeFoldersEpic = {
  en: 'Fallout 3 GOTY English',
  fr: 'Fallout 3 GOTY French',
  de: 'Fallout 3 GOTY German',
  it: 'Fallout 3 GOTY Italian',
  es: 'Fallout 3 GOTY Spanish',
};

// List of folders in the various languages on Xbox, for now we default to English but this could be enhanced to select a folder based on the Vortex locale.
// It's possible that some mods don't work with the non-English variant. 
// Structure is {GAME FOLDER}\Content\{LANGUAGE FOLDER}
const localeFoldersXbox = {
  en: 'Fallout 3 GOTY English',
  fr: 'Fallout 3 GOTY French',
  de: 'Fallout 3 GOTY German',
  it: 'Fallout 3 GOTY Italian',
  es: 'Fallout 3 GOTY Spanish',
}

async function findGame() {
  const storeGames = await util.GameStoreHelper.find(gameStoreIds).catch(() => []);

  if (!storeGames.length) return;
  
  if (storeGames.length > 1) log('debug', 'Mutliple copies for Fallout 3 found', storeGames.map(s => s.gameStoreId));

  const selectedGame = storeGames[0];
  if (['epic', 'xbox'].includes(selectedGame.gameStoreId)) {
    const folderList = selectedGame.gameStoreId === 'epic' ? localeFoldersEpic : localeFoldersXbox;
    // Get the user's chosen language
    // state.interface.language || 'en';
    log('debug', 'Defaulting to the English game version', { store: selectedGame.gameStoreId, folder: folderList['en'] });
    return path.join(selectedGame.gamePath, folderList['en']);
  }
  else return selectedGame.gamePath;
}


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
