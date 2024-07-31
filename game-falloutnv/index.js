const path = require('path');
const { fs, log, util } = require('vortex-api');

// List of folders in the various languages on Xbox, for now we default to English but this could be enhanced to select a folder based on the Vortex locale.
// It's possible that some mods don't work with the non-English variant. 
// Structure is {GAME FOLDER}\Content\{LANGUAGE FOLDER}
const localeFoldersXbox = {
  en: 'Fallout New Vegas English',
  fr: 'Fallout New Vegas French',
  de: 'Fallout New Vegas German',
  it: 'Fallout New Vegas Italian',
  es: 'Fallout New Vegas Spanish',
}

const GAME_ID = 'falloutnv';
const NEXUS_DOMAIN_NAME = 'newvegas';
const STEAMAPP_ID = '22380';
const STEAMAPP_ID2 = '22490';
const GOG_ID = '1454587428';
const MS_ID = 'BethesdaSoftworks.FalloutNewVegas';
const EPIC_ID = '5daeb974a22a435988892319b3a4f476';

let selectedLanguage = undefined;
let multipleLanguages = false;

const gameStoreIds = {
  steam: [{ id: STEAMAPP_ID, prefer: 0 }, { id: STEAMAPP_ID2 }, { name: 'Fallout: New Vegas.*' }],
  xbox: [{ id: MS_ID }],
  gog: [{ id: GOG_ID }],
  epic: [{ id: EPIC_ID }],
  registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\falloutnv:Installed Path' }],
};


async function findGame() {
  const storeGames = await util.GameStoreHelper.find(gameStoreIds).catch(() => []);

  if (!storeGames.length) return;
  
  if (storeGames.length > 1) log('debug', 'Mutliple copies of New Vegas found', storeGames.map(s => s.gameStoreId));

  const selectedGame = storeGames[0];
  if (['epic', 'xbox'].includes(selectedGame.gameStoreId)) {
    // Get a list of folders in the installation.
    try {
      const folders = await fs.readdirAsync(selectedGame.gamePath).filter(p => !path.extname(p) && !p.startsWith('.'));
      const availableLocales = Object.keys(localeFoldersXbox).reduce((accum, cur) => {
        const localeFolderName = localeFoldersXbox[cur];
        if (folders.includes(localeFolderName)) accum.push(cur);
        return accum;
      }, []);
      if (!availableLocales.length) {
        log('warn', 'Could not find any recognised locale folders for New Vegas', {folders, path: selectedGame.gamePath});
        selectedGame.gamePath = path.join(selectedGame.gamePath, folders[0]);
        // Get the last word of the folder name to show as a language
        selectedLanguage = folders[0].toUpperCase().replace('Fallout New Vegas', '').trim();
      }
      // Only one language?
      else if (availableLocales.length === 1) selectedGame.gamePath = path.join(selectedGame.gamePath, localeFoldersXbox[availableLocales[0]]);
      else {
        // Get the user's chosen language
        // state.interface.language || 'en'; 
        // Multiple?
        const selectedLocale = availableLocales.includes('en') ? 'en' : availableLocales[0];
        selectedLanguage = selectedLocale.toUpperCase();
        multipleLanguages = true;
        log('debug', `Defaulting to the ${selectedLocale} game version`, { store: selectedGame.gameStoreId, folder: localeFoldersXbox[selectedLocale] });
        selectedGame.gamePath = path.join(selectedGame.gamePath, localeFoldersXbox[selectedLocale]);
      }      
    }
    catch(err) {
      log('warn', 'Could not check for Fallout NV locale paths', err);
    }
  }
  return selectedGame;
}

const tools = [
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

function prepareForModding(api, discovery) {
  const gameName = util.getGame(GAME_ID)?.name || 'This game';

  if (discovery.store && ['epic', 'xbox'].includes(discovery.store)) {
    const storeName = discovery.store === 'epic' ? 'Epic Games' : 'Xbox Game Pass';
    
    // If this is an Epic or Xbox game we've defaulted to English, so we should let the user know.
    if(multipleLanguages) api.sendNotification({
      id: `${GAME_ID}-locale-message`,
      type: 'info',
      title: 'Multiple Languages Available',
      message: `Default: ${selectedLanguage}`,
      allowSuppress: true,
      actions: [
        {
          title: 'More',
          action: (dismiss) => {
            dismiss();
            api.showDialog('info', 'Mutliple Languages Available', {
              bbcode: '{{gameName}} has multiple language options when downloaded from {{storeName}}. [br][/br][br][/br]'+
                'Vortex has selected the {{selectedLanguage}} variant by default. [br][/br][br][/br]'+
                'If you would prefer to manage a different language you can change the path to the game using the "Manually Set Location" option in the games tab.',
              parameters: { gameName, storeName, selectedLanguage }
            }, 
            [ 
              { label: 'Close', action: () => api.suppressNotification(`${GAME_ID}-locale-message`) }
            ]
            );
          }
        }
      ]
    });
  }
  return Promise.resolve();
}

async function requiresLauncher(gamePath, store) {
  const xboxSettings = {
    launcher: 'xbox',
    addInfo: {
      appId: MS_ID,
      parameters: [
        { appExecName: 'Game' },
      ],
    }
  };

  if (store !== undefined) {
    if (store === 'xbox') return xboxSettings;
    else return undefined;
  }

  // Store type isn't detected. Try and match the Xbox path. 

  try {
    const game = await util.GameStoreHelper.findByAppId([MS_ID], 'xbox');
    const normalizeFunc = await util.getNormalizeFunc(gamePath);
    if (normalizeFunc(game.gamePath) === normalizeFunc(gamePath)) return xboxSettings;
    else return undefined;
  }
  catch(err) {
    return undefined;
  }
}

function main(context) {
  context.requireExtension('Fallout New Vegas Sanity Checks');
  context.registerGame({
    id: GAME_ID,
    name: 'Fallout:\tNew Vegas',
    setup: (discovery) => prepareForModding(context.api, discovery),
    shortName: 'New Vegas',
    mergeMods: true,
    queryPath: findGame,
    requiresLauncher,
    supportedTools: tools,
    queryModPath: () => 'Data',
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
      nexusPageId: NEXUS_DOMAIN_NAME,
      hashFiles: [
        'Data/Update.bsa',
        'Data/FalloutNV.esm',
      ],
    }
  });
  return true;
}

module.exports = {
  default: main,
};
