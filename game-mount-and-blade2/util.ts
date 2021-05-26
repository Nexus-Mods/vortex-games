import Bluebird from 'bluebird';
import { parseXmlString } from 'libxmljs';
import path from 'path';
import { actions, fs, log, selectors, types, util } from 'vortex-api';

import { BANNERLORD_EXEC, GAME_ID } from './common';
import { getCache, getLauncherData } from './subModCache';
import { ILoadOrder, IProps } from './types';

// Used for the "custom launcher" tools.
//  gameMode: singleplayer or multiplayer
//  subModIds: the mod ids we want to load into the game.
const PARAMS_TEMPLATE = ['/{{gameMode}}', '_MODULES_{{subModIds}}*_MODULES_'];

export async function getXMLData(xmlFilePath: string) {
  return fs.readFileAsync(xmlFilePath)
    .then(data => {
      try {
        const xmlData = parseXmlString(data);
        return Promise.resolve(xmlData);
      } catch (err) {
        return Promise.reject(new util.DataInvalid(err.message));
      }
    })
    .catch(err => (err.code === 'ENOENT')
      ? Promise.reject(new util.NotFound(xmlFilePath))
      : Promise.reject(new util.DataInvalid(err.message)));
}

export function genProps(api: types.IExtensionApi, profileId?: string): IProps {
  const state = api.getState();
  const profile = (profileId !== undefined)
    ? selectors.profileById(state, profileId)
    : selectors.activeProfile(state);

  if (profile?.gameId !== GAME_ID) {
    return undefined;
  }

  const discovery: types.IDiscoveryResult = util.getSafe(state,
    ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  if (discovery?.path === undefined) {
    return undefined;
  }

  const mods: { [modId: string]: types.IMod } =
    util.getSafe(state, ['persistent', 'mods', GAME_ID], {});

  const enabledMods = Object.keys(mods)
    .filter(id => util.getSafe(profile, ['modState', id, 'enabled'], false))
    .reduce((accum, id) => {
      accum[id] = mods[id];
      return accum;
    }, {});

  return { state, profile, discovery, enabledMods };
}

export async function getElementValue(subModuleFilePath: string, elementName: string) {
  const logAndContinue = () => {
    log('error', 'Unable to parse xml element', elementName);
    return Promise.resolve(undefined);
  };
  return fs.readFileAsync(subModuleFilePath, { encoding: 'utf-8' })
    .then(xmlData => {
      try {
        const modInfo = parseXmlString(xmlData);
        const element = modInfo.get(`//${elementName}`);
        return ((element !== undefined) && (element.attr('value').value() !== undefined))
          ? Promise.resolve(element.attr('value').value())
          : logAndContinue();
      } catch (err) {
        const errorMessage = 'Vortex was unable to parse: ' + subModuleFilePath + '; please inform the mod author';
        return Promise.reject(new util.DataInvalid(errorMessage));
      }
    });
}

export async function refreshGameParams(context: types.IExtensionContext, loadOrder: ILoadOrder) {
  const LAUNCHER_DATA = getLauncherData();
  // Go through the enabled entries so we can form our game parameters.
  const enabled = (!!loadOrder && Object.keys(loadOrder).length > 0)
    ? Object.keys(loadOrder)
        .filter(key => loadOrder[key].enabled)
        .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
        .reduce((accum, key) => {
          const CACHE = getCache();
          const cacheKeys = Object.keys(CACHE);
          const entry = cacheKeys.find(cacheElement => CACHE[cacheElement].vortexId === key);
          if (!!entry) {
            accum.push(entry);
          }
          return accum;
        }, [])
    : LAUNCHER_DATA.singlePlayerSubMods
        .filter(subMod => subMod.enabled)
        .map(subMod => subMod.subModId);

  // Currently Singleplayer only! (more research into MP needs to be done)
  const parameters = [
    PARAMS_TEMPLATE[0].replace('{{gameMode}}', 'singleplayer'),
    PARAMS_TEMPLATE[1].replace('{{subModIds}}', enabled.map(key => `*${key}`).join('')),
  ];

  // This launcher will not function unless the path is guaranteed to point
  //  towards the bannerlord executable. Given that earlier versions of this
  //  extension had targeted TaleWorlds.Launcher.exe instead - we need to make
  //  sure this is set correctly.
  context.api.store.dispatch(actions.setGameParameters(GAME_ID, {
    executable: BANNERLORD_EXEC,
    parameters,
  }));

  return Promise.resolve();
}

export async function walkAsync(dir, levelsDeep = 2) {
  let entries = [];
  return fs.readdirAsync(dir).then(files => {
    const filtered = files.filter(file => !file.endsWith('.vortex_backup'));
    return Bluebird.each(filtered, file => {
      const fullPath = path.join(dir, file);
      return fs.statAsync(fullPath).then(stats => {
        if (stats.isDirectory() && levelsDeep > 0) {
          return walkAsync(fullPath, levelsDeep - 1)
            .then(nestedFiles => {
              entries = entries.concat(nestedFiles);
              return Promise.resolve();
            });
        } else {
          entries.push(fullPath);
          return Promise.resolve();
        }
      }).catch(err => {
        // This is a valid use case, particularly if the file
        //  is deployed by Vortex using symlinks, and the mod does
        //  not exist within the staging folder.
        log('error', 'MnB2: invalid symlink', err);
        return (err.code === 'ENOENT')
          ? Promise.resolve()
          : Promise.reject(err);
      });
    });
  })
  .then(() => Promise.resolve(entries));
}
