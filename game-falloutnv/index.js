const path = require('path');
const { fs, log, util } = require('vortex-api');
const crypto = require('crypto')
const Bluebird = require('bluebird');

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
const GAME_EXECUTABLE = 'FalloutNV.exe';
const GAME_TRANSLATION_PLUGIN = 'FalloutNV_lang.esp';

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
        log('warn', 'Could not find any recognised locale folders for New Vegas', { folders, path: selectedGame.gamePath });
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
    catch (err) {
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
    id: 'geckfnv',
    name: 'GECK',
    logo: 'geck.png',
    executable: () => 'GECK.exe',
    requiredFiles: [
      'GECK.exe',
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
    if (multipleLanguages) api.sendNotification({
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
              bbcode: '{{gameName}} has multiple language options when downloaded from {{storeName}}. [br][/br][br][/br]' +
                'Vortex has selected the {{selectedLanguage}} variant by default. [br][/br][br][/br]' +
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
  catch (err) {
    return undefined;
  }
}

function main(context) {
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

  context.registerTest('fnvsanitycheck-fnv-test-gamemode-activated', 'gamemode-activated', () => {
    return Bluebird.resolve(executableCheckFNV(context.api))
      .then(() => {
        translationPluginCheckFNV(context.api);
        enhancedDefaultGECKParameter();
        automaticOverrideCreation(context.api);
        context.api.events.on('mod-enabled', (profileId, modId) => {
          automaticSingleOverrideCreation(context.api, modId);
        }
        );
        return true;
      })
      .catch(err => {
        log('warning', `Error executing tests: ${err}`);
        return false;
      });
  });
  return true;
}

async function translationPluginCheckFNV(api) {
  const state = api.getState()
  const currentGame = selectors.activeGameId(state)

  if (currentGame != GAME_ID)
    return;

  const discovery = selectors.discoveryByGame(state, GAME_ID);
  const pluginPath = path.join(discovery.path, 'data', GAME_TRANSLATION_PLUGIN);
  try {
    await fs.statAsync(pluginPath);
    api.sendNotification({
      id: 'sanitycheck-fnvtranslationplugin',
      type: 'warning',
      message: 'Translation plugin present',
      allowSuppress: true,
      actions: [
        {
          title: 'More',
          action: dismiss => {
            const t = api.translate;
            api.showDialog('info', 'FalloutNV_lang.esp was found in the data folder', {
              bbcode: t(`This translation plugin directly edits thousands of records to change the language, `
                + `which will cause many incompatibilities with most mods.[br][/br][br][/br]Do you want to delete it? `)
            }, [
              {
                label: 'Yes', action: () => {
                  try {
                    fs.removeAsync(pluginPath);
                    log('info', 'Translatioh plugin deleted successfully');
                    dismiss();
                  } catch (err) {
                    alert(`Error occurred while deleting file: ${err}`);
                  }
                }
              },
              { label: 'No' },
              { label: 'Ignore', action: () => api.suppressNotification(`sanitycheck-fnvtranslationplugin`) }
            ]);
          },
        },
      ],
    });
  }
  catch (err) {
    return; //Exit early if the translation plugin doesn't exists
  }
}

function executableCheckFNV(api) {
  const state = api.getState()
  const currentGame = selectors.activeGameId(state)

  if (currentGame != GAME_ID)
    return;

  const discovery = selectors.discoveryByGame(state, GAME_ID);
  const executablePath = path.join(discovery.path, GAME_EXECUTABLE);
  const fileStream = fs.createReadStream(executablePath);
  const hashAlgorithm = 'md5';
  const hash = crypto.createHash(hashAlgorithm);
  const patchedExecutableHashes = [
    '3e00e9397d71fae83af39129471024a7', //Patched GOG executable
    '27c096c5ad9657af4f39f764231521da', //Patched EpicGames executable
    '50c70408a000acade2ed257c87cecbc2'  //Patched Steam executable
  ];
  let executableHash;

  fileStream.on('data', (data) => {
    hash.update(data);
  });
  fileStream.on('end', () => {
    executableHash = hash.digest('hex');
    if (!patchedExecutableHashes.includes(executableHash)) {
      api.sendNotification({
        id: 'sanitycheck-fnvexecutable',
        type: 'warning',
        message: 'Unpatched game executable',
        allowSuppress: true,
        actions: [
          {
            title: 'More',
            action: dismiss => {
              const t = api.translate;
              api.showDialog('info', 'Unpatched game executable', {
                bbcode: t(`The game executable hasn't been patched with the 4GB Patcher. It won't `
                  + `load xNVSE and will be limited to 2GB of RAM[br][/br]You can download `
                  + `and install the patch according to your platform from the link below:[br][/br][br][/br]`
                  + `[url=https://www.nexusmods.com/newvegas/mods/62552]Steam/GOG Patcher[/url][br][/br][br][/br]`
                  + `[url=https://www.nexusmods.com/newvegas/mods/81281]Epic Games Patcher[/url][br][/br][br][/br]`
                  + `After patching the game you should only launch the game from the game executable and not from `
                  + `New Vegas Script Extender under the tools to avoid loading the script extender twice`)
              }, [
                { label: 'Ok' },
                { label: 'Ignore', action: () => api.suppressNotification(`sanitycheck-fnvexecutable`) }
              ]);
            },
          },
        ],
      });
    }
  });
  fileStream.on('error', (err) => {
    log(`error`, `Error reading executable file: ${err}`);
  });
}

async function enhancedDefaultGECKParameter() {
  const GECKConfigPath = path.join(util.getVortexPath('documents'), 'My Games', 'FalloutNV', 'GECKCustom.ini')
  try {
    await fs.statAsync(GECKConfigPath); // if it doesn't exist, create an enhanced configuration
  }
  catch (err) {
    fs.writeFileAsync(GECKConfigPath, //The absent of whitespace is intended
      `[General]\n`
      + `bUseMultibounds=0\n`
      + `bAllowMultipleMasterLoads=1\n`
      + `bAllowMultipleEditors=1\n`
      + `[Localization]\n`
      + `iExtendedTopicLength=255\n`
      + `bAllowExtendedText=1`
    )
  }
}

async function createOverrideFiles(modPath, api) {
  let overrideCreated = false;
  try {
    const modDirectories = await fs.readdirAsync(modPath, { withFileTypes: true });
    let bsaFiles;

    for (const dirent of modDirectories) {
      if (!dirent.isDirectory() || dirent.name === '.git') {
        continue;  // Ignore non-directories and .git directory
      }

      const modDirPath = path.join(modPath, dirent.name);
      try {
        bsaFiles = (await fs.readdirAsync(modDirPath))
          .filter(file => file.endsWith('.bsa'));
      } catch (e) {
        log(`error`, `An error has occured while filtering bsa files: ${e}`);
      }

      for (const bsaFile of bsaFiles) {
        const fileNameWithoutExtension = path.basename(bsaFile, '.bsa');
        const overrideFilePath = path.join(modDirPath, `${fileNameWithoutExtension}.override`);

        try {
          await fs.statAsync(overrideFilePath); // if it doesn't exist, create the override files
        }
        catch (err) {
          await fs.openAsync(overrideFilePath, 'a');
          overrideCreated = true;
          log('info', `An override file for ${bsaFile} is missing, one was automatically generated.`);
        }
      }
    }
  } catch (error) {
    alert(`Failed to create override files in ${modPath}: ${error.message}`);
  }
  if (overrideCreated) {

    api.sendNotification({
      id: 'sanitycheck-fnvoverridedeploy',
      type: 'warning',
      message: 'Redeployment required',
      allowSuppress: true,
      actions: [
        {
          title: 'More',
          action: dismiss => {
            const t = api.translate;
            api.showDialog('info', 'Redeployment required', {
              bbcode: t(`Vortex has automatically added .override files for all bsa files in the staging folder.[br][/br]`
                + `Redeployment of mods is necessary to ensure the override files are added.[br][/br][br][/br]`
                + `BSA files can be made to override previous BSA files like newer Bethesda titles by creating an empty `
                + `text file with the same name as the BSA file and adding the extension .override to the filename. `
                + `More information [url=https://geckwiki.com/index.php?title=BSA_Files]here[/url][br][/br][br][/br]`
                + `This behavior requires the [url=https://www.nexusmods.com/newvegas/mods/58277]JIP LN NVSE[/url] plugin to work as expected.`)
            }, [
              {
                label: 'Deploy', action: () => {
                  api.events.emit('deploy-mods', (err) => {
                    if (err) {
                      log('warn', `Error deploying mods \n\n${err}`);
                    } else {
                      log('debug', 'Override file created, event emitted.');
                    }
                  });
                  dismiss()
                }
              },
              { label: 'Close' },
              { label: 'Ignore', action: () => api.suppressNotification(`sanitycheck-fnvoverridedeploy`) }
            ]);
          },
        },
      ],
    });
  }
}

async function createSingleOverrideFiles(modPath) {
  try {
    const files = await fs.readdirAsync(modPath);
    const bsaFiles = files.filter(file => file.endsWith('.bsa'));

    for (const bsaFile of bsaFiles) {
      const fileNameWithoutExtension = path.basename(bsaFile, '.bsa');
      const overrideFilePath = path.join(modPath, `${fileNameWithoutExtension}.override`);

      try {
        await fs.statAsync(overrideFilePath); // Check if file exists
      } catch (err) {
        await fs.openAsync(overrideFilePath, 'a'); // Create the override file
        log('info', `An override file for ${bsaFile} was created.`);
      }
    }

  } catch (error) {
    log(`warn`, `Failed to create override files in ${modPath}: ${error}`);
  }
}

function automaticOverrideCreation(api) {
  const state = api.getState()
  const currentGame = selectors.activeGameId(state)
  if (currentGame != GAME_ID)
    return;

  const staging = selectors.installPathForGame(state, GAME_ID);

  createOverrideFiles(staging, api);
}

function automaticSingleOverrideCreation(api, modId) {
  const state = api.getState()
  const currentGame = selectors.activeGameId(state)
  if (currentGame != GAME_ID)
    return;

  const staging = selectors.installPathForGame(state, GAME_ID);

  createSingleOverrideFiles(path.join(staging, modId));
}

module.exports = {
  default: main,
};
