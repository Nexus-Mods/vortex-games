import { IFileInfo } from '@nexusmods/nexus-api';
import path from 'path';
import { actions, fs, log, types, selectors, util } from 'vortex-api';
import * as nodeFs from 'fs';
import * as semver from 'semver';
import { spawn } from 'child_process';

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

const PATCH_4GB_MOD_ID = 62552;
const PATCH_4GB_EXECUTABLES = ['FNVpatch.exe', 'FalloutNVpatch.exe'];

let selectedLanguage = undefined;
let multipleLanguages = false;

interface IPatchInfo {
  offset: number;
  original: number;
  patched: number;
  name: string;
}

const gameStoreIds: { [gameStoreId: string]: types.IStoreQuery[] } = {
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
      const folders: string[] = await fs.readdirAsync(selectedGame.gamePath).filter(p => !path.extname(p) && !p.startsWith('.'));
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

async function downloadAndInstall4GBPatch(api: types.IExtensionApi): Promise<void> {
  let nxmUrl = 'https://www.nexusmods.com/newvegas/mods/62552?tab=files';
  try {
    if (api.ext?.ensureLoggedIn !== undefined) {
      await api.ext.ensureLoggedIn();
    }
    const modFiles: IFileInfo[] = await api.ext.nexusGetModFiles(GAME_ID, PATCH_4GB_MOD_ID);

    const file = modFiles
      .filter(file => file.category_id === 1)
      .sort((lhs, rhs) => semver.rcompare(util.coerceToSemver(lhs.version), util.coerceToSemver(rhs.version)))[0];

    if (file === undefined) {
      throw new util.ProcessCanceled('No 4GB patch main file found');
    }

    const dlInfo = {
      game: GAME_ID,
      name: '4GB Patch',
    };

    const existingDownload = selectors.getDownloadByIds(api.getState(), {
      gameId: GAME_ID,
      modId: PATCH_4GB_MOD_ID,
      fileId: file.file_id,
    });
    nxmUrl = `nxm://${GAME_ID}/mods/${PATCH_4GB_MOD_ID}/files/${file.file_id}`;
    const dlId = existingDownload
      ? existingDownload.id
      : await util.toPromise<string>(cb => api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, 'never', { allowInstall: false }));
    const existingMod = selectors.getMod(api.getState(), GAME_ID, PATCH_4GB_MOD_ID);
    const modId = ((existingMod?.state === 'installed') && (existingMod.attributes?.fileId === file.file_id))
      ? existingMod.id
      : await util.toPromise<string>(cb => api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, cb));
    const profileId = selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
    await actions.setModsEnabled(api, profileId, [modId], true, {
      allowAutoDeploy: false,
      installed: true,
    });
    await api.emitAndAwait('deploy-single-mod', GAME_ID, modId);
    await runInstaller4GBPatch(api, modId);
  } catch (err) {
    log('error', 'Failed to download patch', err);
    util.opn(nxmUrl).catch(() => null);
  }
}

async function runInstaller4GBPatch(api: types.IExtensionApi, modId: string): Promise<void> {
  const state = api.getState();
  const mod = selectors.getMod(state, GAME_ID, modId);
  if (!mod?.installationPath) {
    log('error', `Could not find mod ${modId} for 4GB patch installation`);
    return;
  }
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  if (!discovery?.path) {
    log('error', 'Could not find game path for 4GB patch installation');
    return;
  }
  const installPath = selectors.getModInstallPath(state, GAME_ID, modId);
  if (!installPath) {
    log('error', 'Could not find installation path for 4GB patch mod');
    return;
  }
  const files = await fs.readdirAsync(installPath);
  const patchExec = files.find(f => PATCH_4GB_EXECUTABLES.includes(f));
  if (!patchExec) {
    log('error', 'Could not find 4GB patch executable');
    return;
  }
  const patchPath = path.join(installPath, patchExec);
  try {
    await new Promise<void>((resolve, reject) => {
      const cp = spawn(patchPath, [], {
        cwd: discovery.path,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      cp.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n').map(l => l.trim()).filter(l => l);
        const logLines = lines.map(l => `[4GB Patch Installer] ${l}`);
        log('info', logLines.join('\n'));
        if (logLines.map(l => l.toLowerCase()).some(l => l.includes('any key'))) {
          cp.stdin?.write('\n');
        }
      });

      cp.stderr?.on('data', (data) => {
        log('warn', `[4GB Patch Installer] ${data.toString()}`);
      });

      cp.on('error', (error) => {
        reject(error);
      });

      cp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`4GB patch installer exited with code ${code}`));
        }
      });
    });
    api.sendNotification({
      type: 'success',
      message: '4GB patch installed successfully',
      displayMS: 3000,
    });
  } catch (err) {
    log('error', 'Failed to run 4GB patch installer', err);
    api.sendNotification({
      type: 'error',
      message: 'Failed to install 4GB patch',
      displayMS: 5000,
    });
  }
}

async function testFor4GBPatch(api): Promise<types.ITestResult> {
  const state = api.getState();
  const activeGameId = selectors.activeGameId(state);
  const discovery = state.settings.gameMode.discovered?.[GAME_ID];
  if (activeGameId !== GAME_ID || !discovery?.path) {
    return undefined;
  }

  const exePath = path.join(discovery.path, 'FalloutNV.exe');
  const hasBackupFile = () => fs.statAsync(path.join(path.dirname(exePath), path.basename(exePath, '.exe') + '_backup.exe'))
    .then(() => true)
    .catch(() => false);
  try {
    const hasBackup = await hasBackupFile();
    if (hasBackup) {
      return undefined;
    }
    return {
      description: {
        short: 'FalloutNV.exe requires 4GB patch',
        long: 'Fallout New Vegas requires the 4GB patch to work correctly with many mods. ' +
              'The patch allows the game to use more than 2GB of RAM, preventing crashes and improving stability.',
      },
      severity: 'warning',
      onRecheck: () => hasBackupFile() as any,
      automaticFix: () => downloadAndInstall4GBPatch(api) as any,
    };
  } catch (err) {
    // File doesn't exist or can't be read - not an error for this test
    log('debug', 'Could not check 4GB patch status', err.message);
    return undefined;
  }

  return undefined;
}

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

  const epicSettings = {
    launcher: 'epic',
    addInfo: {
      appId: EPIC_ID,
    }
  };

  if (store !== undefined) {
    if (store === 'xbox') return xboxSettings;
    if (store === 'epic') return epicSettings;
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

function testInstaller4GBPatch(api: types.IExtensionApi) {
  return (files: string[], gameId: string, archivePath?: string, details?: types.ITestSupportedDetails): Promise<types.ISupportedResult> => {
    const state = api.getState();
    const gameMode = selectors.activeGameId(state);
    if (gameMode !== GAME_ID || details?.hasXmlConfigXML || details?.hasCSScripts) {
      return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const lowered = files.map(f => f.toLowerCase());
    const hasPatchExe = PATCH_4GB_EXECUTABLES.some(execName => lowered.includes(execName.toLowerCase()));
    if (hasPatchExe) {
      return Promise.resolve({ supported: true, requiredFiles: [] });
    }
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
}

function applyInstaller4GBPatch(api: types.IExtensionApi) {
  return async (files: string[], destinationPath: string, gameId: string,
      progressDelegate: types.ProgressDelegate, choices?: any,
      unattended?: boolean, archivePath?: string, options?: types.IInstallationDetails) : Promise<types.IInstallResult> => {
    const instructions: types.IInstruction[] = files.map(f => ({
      type: 'copy',
      source: f,
      destination: f,
    }));
    const attrib: types.IInstruction = {
      type: 'attribute',
      key: 'is4GBPatcher',
      value: true,
    };
    const modTypeInstr: types.IInstruction = {
      type: 'setmodtype',
      value: 'dinput',
    };
    instructions.push(modTypeInstr);
    return { instructions: [ ...instructions, attrib, modTypeInstr ] };
  }
}

function main(context: types.IExtensionContext): boolean {
  context.requireExtension('Fallout New Vegas Sanity Checks', undefined, true);

  context.registerGame({
    id: GAME_ID,
    name: 'Fallout:\tNew Vegas',
    setup: (discovery) => prepareForModding(context.api, discovery) as any,
    shortName: 'New Vegas',
    mergeMods: true,
    queryPath: findGame as any,
    requiresLauncher: requiresLauncher as any,
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

  // Tests/Health checks
  context.registerTest('falloutnv-4gb-patch', 'gamemode-activated',
    () => testFor4GBPatch(context.api) as any);

  // Installers
  context.registerInstaller(
    'falloutnv-4gb-patch', 25,
    testInstaller4GBPatch(context.api) as any,
    applyInstaller4GBPatch(context.api) as any
  );

  return true;
}

module.exports = {
  default: main,
};
