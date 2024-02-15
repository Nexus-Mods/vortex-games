/* eslint-disable */
/**
 * Important - although we no longer define the info panel here,
 *  we still need to keep the index file's '.tsx' extension.
 *  At least while our update process for bundled plugins remains
 *  through the 'release' branch.
 * 
 * Removing files from bundled plugins without stubbing the extension
 *  can potentially break the extension on the user's end.
 */
import Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';
import * as semver from 'semver';
import { fs, selectors, types, util } from 'vortex-api';
import { Builder, parseStringPromise } from 'xml2js';
import { IModNode, IModSettings, IXmlNode } from './types';

import {
  DEFAULT_MOD_SETTINGS, GAME_ID, LSLIB_URL, IGNORE_PATTERNS,
  MOD_TYPE_BG3SE, MOD_TYPE_LOOSE, MOD_TYPE_LSLIB, MOD_TYPE_REPLACER,
} from './common';
import * as gitHubDownloader from './githubDownloader';
import Settings from './Settings';
import reducer from './reducers';
import { migrate } from './migrations';

import {
  logDebug, forceRefresh, getLatestInstalledLSLibVer,
  getGameDataPath, getGamePath, globalProfilePath, modsPath,
  profilesPath, getLatestLSLibMod,
} from './util';

import {
  testLSLib, testBG3SE, testEngineInjector, testModFixer, testReplacer,
  installLSLib, installBG3SE, installEngineInjector, installModFixer, installReplacer,
} from './installers';

import {
  isBG3SE, isLSLib, isLoose, isReplacer,
} from './modTypes';

import {
  deserialize, importModSettingsFile, importModSettingsGame,
  serialize, exportToGame, exportToFile, validate,
} from './loadOrder';

import { InfoPanelWrap } from './InfoPanel'

const STOP_PATTERNS = ['[^/]*\\.pak$'];

const GOG_ID = '1456460669';
const STEAM_ID = '1086940';

function toWordExp(input) {
  return '(^|/)' + input + '(/|$)';
}

function findGame(): any {
  return util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID])
    .then(game => game.gamePath);
}

async function ensureGlobalProfile(api: types.IExtensionApi, discovery: types.IDiscoveryResult) {
  if (discovery?.path) {
    const profilePath = globalProfilePath();
    try {
      await fs.ensureDirWritableAsync(profilePath);
      const modSettingsFilePath = path.join(profilePath, 'modsettings.lsx');
      try {
        await fs.statAsync(modSettingsFilePath);
      } catch (err) {
        await fs.writeFileAsync(modSettingsFilePath, DEFAULT_MOD_SETTINGS, { encoding: 'utf8' });
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

function prepareForModding(api: types.IExtensionApi, discovery): any {
  const mp = modsPath();  

  showFullReleaseModFixerRecommendation(api); 

  api.sendNotification({
    id: 'bg3-uses-lslib',
    type: 'info',
    title: 'BG3 support uses LSLib',
    message: LSLIB_URL,
    allowSuppress: true,
    actions: [
      { title: 'Visit Page', action: () => util.opn(LSLIB_URL).catch(() => null) },
    ],
  });
  return fs.statAsync(mp)
    .catch(() => fs.ensureDirWritableAsync(mp, () => Bluebird.resolve() as any))
    .finally(() => ensureGlobalProfile(api, discovery));
}

function showFullReleaseModFixerRecommendation(api: types.IExtensionApi) {
  // check to see if mod is installed first?
  const mods = api.store.getState().persistent?.mods?.baldursgate3;
  if(mods !== undefined) {
    const modArray: types.IMod[] = mods ? Object.values(mods) : [];
    logDebug('modArray', modArray);
  
    const modFixerInstalled:boolean =  modArray.filter(mod => !!mod?.attributes?.modFixer).length != 0;  
    logDebug('modFixerInstalled', modFixerInstalled);

    // if we've found an installed modfixer, then don't bother showing notification 
    if(modFixerInstalled) {
      return;
    }
  }

  // no mods found
  api.sendNotification({
    type: 'warning',
    title: 'Recommended Mod',
    message: 'Most mods require this mod.',
    id: 'bg3-recommended-mod',
    allowSuppress: true,
    actions: [
      {
        title: 'More', action: dismiss => {
          api.showDialog('question', 'Recommended Mods', {
            text:
              'We recommend installing "Baldur\'s Gate 3 Mod Fixer" to be able to mod Baldur\'s Gate 3.\n\n' + 
              'This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods'
          }, [
            { label: 'Dismiss' },
            { label: 'Open Nexus Mods', default: true },
          ])
            .then(result => {
              dismiss();
              if (result.action === 'Open Nexus Mods') {
                util.opn('https://www.nexusmods.com/baldursgate3/mods/141?tab=description').catch(() => null)
              } else if (result.action === 'Cancel') {
                // dismiss anyway
              }
              return Promise.resolve();
            });
        }
      }
    ],
  });
}


const getPlayerProfiles = (() => {
  let cached = [];
  try {
    cached = (fs as any).readdirSync(profilesPath())
        .filter(name => (path.extname(name) === '') && (name !== 'Default'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  return () => cached;
})();

function gameSupportsProfile(gameVersion: string) {
  return semver.lt(semver.coerce(gameVersion), '4.1.206');
}

async function getOwnGameVersion(state: types.IState): Promise<string> {
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  return await util.getGame(GAME_ID).getInstalledVersion(discovery);
}

async function getActivePlayerProfile(api: types.IExtensionApi) {
  return gameSupportsProfile(await getOwnGameVersion(api.getState()))
    ? api.store.getState().settings.baldursgate3?.playerProfile || 'global'
    : 'Public';
}

function findNode<T extends IXmlNode<{ id: string }>, U>(nodes: T[], id: string): T {
  return nodes?.find(iter => iter.$.id === id) ?? undefined;
}

function parseModNode(node: IModNode) {
  const name = findNode(node.attribute, 'Name').$.value;
  return {
    id: name,
    name,
    data: findNode(node.attribute, 'UUID').$.value,
  };
}

let storedLO: any[];
async function readModSettings(api: types.IExtensionApi): Promise<IModSettings> {
  const bg3profile: string = await getActivePlayerProfile(api);
  const playerProfiles = getPlayerProfiles();
  if (playerProfiles.length === 0) {
    storedLO = [];
    return;
  }

  const settingsPath = (bg3profile !== 'global')
    ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
    : path.join(globalProfilePath(), 'modsettings.lsx');
  const dat = await fs.readFileAsync(settingsPath);
  return parseStringPromise(dat);
}

async function writeModSettings(api: types.IExtensionApi, data: IModSettings, bg3profile: string): Promise<void> {
  if (!bg3profile) {
    return;
  }

  const settingsPath = (bg3profile !== 'global') 
    ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
    : path.join(globalProfilePath(), 'modsettings.lsx');

  const builder = new Builder();
  const xml = builder.buildObject(data);
  try {
    await fs.ensureDirWritableAsync(path.dirname(settingsPath));
    await fs.writeFileAsync(settingsPath, xml);
  } catch (err) {
    storedLO = [];
    const allowReport = ['ENOENT', 'EPERM'].includes(err.code);
    api.showErrorNotification('Failed to write mod settings', err, { allowReport });
    return;
  }
}

async function readStoredLO(api: types.IExtensionApi) {
  const modSettings = await readModSettings(api);
  const config = findNode(modSettings?.save?.region, 'ModuleSettings');
  const configRoot = findNode(config?.node, 'root');
  const modOrderRoot = findNode(configRoot?.children?.[0]?.node, 'ModOrder');
  const modsRoot = findNode(configRoot?.children?.[0]?.node, 'Mods');
  const modOrderNodes = modOrderRoot?.children?.[0]?.node ?? [];
  const modNodes = modsRoot?.children?.[0]?.node ?? [];

  const modOrder = modOrderNodes.map(node => findNode(node.attribute, 'UUID').$?.value);

  // return util.setSafe(state, ['settingsWritten', profile], { time, count });
  const state = api.store.getState();
  const vProfile = selectors.activeProfile(state);
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const enabled = Object.keys(mods).filter(id =>
    util.getSafe(vProfile, ['modState', id, 'enabled'], false));
  const bg3profile: string = state.settings.baldursgate3?.playerProfile;
  if (enabled.length > 0 && modNodes.length === 1) {
    const lastWrite = state.settings.baldursgate3?.settingsWritten?.[bg3profile];
    if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
      api.showDialog('info', '"modsettings.lsx" file was reset', {
        text: 'The game reset the list of active mods and ran without them.\n'
            + 'This happens when an invalid or incompatible mod is installed. '
            + 'The game will not load any mods if one of them is incompatible, unfortunately '
            + 'there is no easy way to find out which one caused the problem.',
      }, [
        { label: 'Continue' },
      ]);
    }
  }

  storedLO = modNodes
    .map(node => parseModNode(node))
    // Gustav is the core game
    .filter(entry => entry.id === 'Gustav')
    // sort by the index of each mod in the modOrder list
    .sort((lhs, rhs) => modOrder
      .findIndex(i => i === lhs.data) - modOrder.findIndex(i => i === rhs.data));
}

async function onCheckModVersion(api: types.IExtensionApi, gameId: string, mods: types.IMod[]) {
  const profile = selectors.activeProfile(api.getState());
  if (profile.gameId !== GAME_ID || gameId !== GAME_ID) {
    return;
  }

  const latestVer: string = getLatestInstalledLSLibVer(api);

  if (latestVer === '0.0.0') {
    // Nothing to update.
    return;
  }

  const newestVer: string = await gitHubDownloader.checkForUpdates(api, latestVer);
  if (!newestVer || newestVer === latestVer) {
    return;
  }
}

async function onGameModeActivated(api: types.IExtensionApi, gameId: string) {
  if (gameId !== GAME_ID) {
    return;
  }
  try {
    await migrate(api);
  } catch (err) {
    api.showErrorNotification(
      'Failed to migrate', err, {
        //message: 'Please run the game before you start modding',
        allowReport: false,
    });
  }

  try {
    await readStoredLO(api);
  } catch (err) {
    api.showErrorNotification(
      'Failed to read load order', err, {
        message: 'Please run the game before you start modding',
        allowReport: false,
    });
  }

  const latestVer: string = getLatestInstalledLSLibVer(api);
  if (latestVer === '0.0.0') {
    await gitHubDownloader.downloadDivine(api);
  }

}

function main(context: types.IExtensionContext) {
  context.registerReducer(['settings', 'baldursgate3'], reducer);

  context.registerGame({
    id: GAME_ID,
    name: 'Baldur\'s Gate 3',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [
      {
        id: 'exevulkan',
        name: 'Baldur\'s Gate 3 (Vulkan)',
        executable: () => 'bin/bg3.exe',
        requiredFiles: [
          'bin/bg3.exe',
        ],
        relative: true,
      },
    ],
    queryModPath: modsPath,
    logo: 'gameart.jpg',
    executable: () => 'bin/bg3_dx11.exe',
    setup: discovery => prepareForModding(context.api, discovery),
    requiredFiles: [
      'bin/bg3_dx11.exe',
    ],
    environment: {
      SteamAPPId: STEAM_ID,
    },
    details: {
      steamAppId: +STEAM_ID,
      stopPatterns: STOP_PATTERNS.map(toWordExp),
      ignoreConflicts: IGNORE_PATTERNS,
      ignoreDeploy: IGNORE_PATTERNS,
    },
  });

  context.registerAction('mod-icons', 300, 'settings', {}, 'Re-install LSLib/Divine', () => {
    const state = context.api.getState();
    const mods: { [modId: string]: types.IMod } =
      util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
    const lslibs = Object.keys(mods).filter(mod => mods[mod].type === 'bg3-lslib-divine-tool');
    context.api.events.emit('remove-mods', GAME_ID, lslibs, (err) => {
      if (err !== null) {
        context.api.showErrorNotification('Failed to reinstall lslib',
          'Please re-install manually', { allowReport: false });
        return;
      }
      gitHubDownloader.downloadDivine(context.api);
    });
  }, () => {
    const state = context.api.store.getState();
    const gameMode = selectors.activeGameId(state);
    return gameMode === GAME_ID;
  });  

  context.registerInstaller('bg3-lslib-divine-tool', 15, testLSLib as any, installLSLib as any);
  context.registerInstaller('bg3-bg3se', 15, testBG3SE as any, installBG3SE as any);
  context.registerInstaller('bg3-engine-injector', 20, testEngineInjector as any, installEngineInjector as any);
  context.registerInstaller('bg3-replacer', 25, testReplacer as any, installReplacer as any);
  context.registerInstaller('bg3-modfixer', 25, testModFixer as any, installModFixer as any);

  context.registerModType(MOD_TYPE_LSLIB, 15, (gameId) => gameId === GAME_ID,
    () => undefined, 
    isLSLib as any,
    { name: 'BG3 LSLib', noConflicts: true });

  context.registerModType(MOD_TYPE_BG3SE, 15, (gameId) => gameId === GAME_ID,
    () => path.join(getGamePath(context.api), 'bin'), 
    isBG3SE as any,
    { name: 'BG3 BG3SE' });

  context.registerModType(MOD_TYPE_LOOSE, 20, (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api), 
    isLoose as any,
    { name: 'BG3 Loose' } as any);

  context.registerModType(MOD_TYPE_REPLACER, 25, (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api), 
    instructions => isReplacer(context.api, instructions) as any,
    { name: 'BG3 Replacer' } as any);

  context.registerLoadOrder({
    clearStateOnPurge: false,
    gameId: GAME_ID,
    deserializeLoadOrder: () => deserialize(context),
    serializeLoadOrder: (loadOrder, prev) => serialize(context, loadOrder),
    validate,
    toggleableEntries: false,
    usageInstructions: (() => (
      <InfoPanelWrap
        api={context.api}
        getOwnGameVersion={getOwnGameVersion}
        readStoredLO={readStoredLO}
        installLSLib={onGameModeActivated}
        getLatestLSLibMod={getLatestLSLibMod}
      />)
    ) as any,
  });

  const isBG3 = () => {
    const state = context.api.getState();
    const activeGame = selectors.activeGameId(state);
    return activeGame === GAME_ID;
  };
  /*
  context.registerAction('fb-load-order-icons', 145, 'refresh', {}, 'Deep Refresh', () => { deepRefresh(context.api); }, () => {
    const state = context.api.getState();
    const activeGame = selectors.activeGameId(state);
    return activeGame === GAME_ID;
  });*/

  context.registerAction('fb-load-order-icons', 150, 'changelog', {}, 'Export to Game', () => { exportToGame(context.api); }, isBG3);

  context.registerAction('fb-load-order-icons', 151, 'changelog', {}, 'Export to File...', () => { exportToFile(context.api); }, isBG3);

  context.registerAction('fb-load-order-icons', 160, 'import', {}, 'Import from Game', () => { importModSettingsGame(context.api); }, isBG3);

  context.registerAction('fb-load-order-icons', 161, 'import', {}, 'Import from File...', () => { 
    importModSettingsFile(context.api); 
  }, isBG3);

  context.registerSettings('Mods', Settings, undefined, isBG3, 150);

  //context.registerMigration((oldVersion) => Bluebird.resolve(migrate13(context.api, oldVersion)));

  context.once(() => {
    context.api.onStateChange(['session', 'base', 'toolsRunning'],
      async (prev: any, current: any) => {
        // when a tool exits, re-read the load order from disk as it may have been
        // changed
        const gameMode = selectors.activeGameId(context.api.getState());
        if ((gameMode === GAME_ID) && (Object.keys(current).length === 0)) {
          try {
            await readStoredLO(context.api);
          } catch (err) {
            context.api.showErrorNotification('Failed to read load order', err, {
              message: 'Please run the game before you start modding',
              allowReport: false,
            });
          }
        }
      });

    context.api.onAsync('did-deploy', (profileId: string, deployment) => {
      const profile = selectors.profileById(context.api.getState(), profileId);
      if (profile?.gameId === GAME_ID) {
        forceRefresh(context.api);
      }
      return Promise.resolve();
    });

    context.api.events.on('check-mods-version',
      (gameId: string, mods: types.IMod[]) => onCheckModVersion(context.api, gameId, mods));

    context.api.events.on('gamemode-activated',
      async (gameMode: string) => onGameModeActivated(context.api, gameMode));
  });

  return true;
}

export default main;
