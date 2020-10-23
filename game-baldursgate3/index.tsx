import Bluebird from 'bluebird';
import { spawn } from 'child_process';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';
import { FormControl } from 'react-bootstrap';
import { createAction } from 'redux-act';
import { generate as shortid } from 'shortid';
import walk, { IEntry } from 'turbowalk';
import { actions, fs, log, selectors, types, util } from 'vortex-api';
import { Builder, parseStringPromise } from 'xml2js';
import { ILoadOrderEntry, IModNode, IModSettings, IPakInfo, IXmlNode } from './types';

const GAME_ID = 'baldursgate3';
const STOP_PATTERNS = ['[^/]*\\.pak$'];
const LSLIB_URL = 'https://github.com/Norbyte/lslib';

function toWordExp(input) {
  return '(^|/)' + input + '(/|$)';
}

// actions
const setPlayerProfile = createAction('BG3_SET_PLAYERPROFILE', name => name);
const settingsWritten = createAction('BG3_SETTINGS_WRITTEN',
  (profile: string, time: number, count: number) => ({ profile, time, count }));

// reducer
const reducer: types.IReducerSpec = {
  reducers: {
    [setPlayerProfile as any]: (state, payload) => util.setSafe(state, ['playerProfile'], payload),
    [settingsWritten as any]: (state, payload) => {
      const { profile, time, count } = payload;
      return util.setSafe(state, ['settingsWritten', profile], { time, count });
    },
  },
  defaults: {
    playerProfile: '',
    settingsWritten: {},
  },
};

function documentsPath() {
  return path.join(util.getVortexPath('documents'), 'Larian Studios', 'Baldur\'s Gate 3');
}

function modsPath() {
  return path.join(documentsPath(), 'Mods');
}

function profilesPath() {
  return path.join(documentsPath(), 'PlayerProfiles');
}

function findGame(): any {
  return util.GameStoreHelper.findByAppId(['1456460669', '1086940'])
    .then(game => game.gamePath);
}

function prepareForModding(api: types.IExtensionApi, discovery): any {
  const mp = modsPath();
  api.sendNotification({
    type: 'info',
    title: 'BG3 support uses LSLib',
    message: LSLIB_URL,
    allowSuppress: true,
    actions: [
      { title: 'Visit Page', action: () => util.opn(LSLIB_URL).catch(() => null) },
    ],
  });
  return fs.statAsync(mp)
    .catch(() => fs.ensureDirWritableAsync(mp, () => Bluebird.resolve() as any)
      .then(() => api.showDialog('info', 'Early Access Game', {
        bbcode: 'Baldur\'s Gate 3 is currently in Early Access. It doesn\'t officially '
            + 'support modding, doesn\'t include any modding tools and will receive '
            + 'frequent updates.<br/>'
            + 'Mods may become incompatible within days of being released, generally '
            + 'not work and/or break unrelated things within the game.<br/><br/>'
            + '[color="red"]Please don\'t report issues that happen in connection with mods to the '
            + 'game developers (Larian Studios) or through the Vortex feedback system.[/color]'
      }, [ { label: 'I understand' } ])));
}

function getGameDataPath(api) {
  const state = api.getState();
  const gameMode = selectors.activeGameId(state);
  const gamePath = state.settings.gameMode.discovered?.[GAME_ID]?.path;
  if (gamePath !== undefined) {
    return path.join(gamePath, 'Data');
  } else {
    return undefined;
  }
}

const ORIGINAL_FILES = new Set([
  'assets.pak',
  'assets.pak',
  'effects.pak',
  'engine.pak',
  'engineshaders.pak',
  'game.pak',
  'gameplatform.pak',
  'gustav.pak',
  'gustav_textures.pak',
  'icons.pak',
  'lowtex.pak',
  'materials.pak',
  'minimaps.pak',
  'models.pak',
  'shared.pak',
  'sharedsoundbanks.pak',
  'sharedsounds.pak',
  'textures.pak',
  'virtualtextures.pak',
]);

function isReplacer(api: types.IExtensionApi, files: types.IInstruction[]) {
  const origFile = files.find(iter => ORIGINAL_FILES.has(iter.destination.toLowerCase()));
  const paks = files.filter(iter => path.extname(iter.destination).toLowerCase() === '.pak');
  if ((origFile !== undefined) || (paks.length === 0)) {
    return api.showDialog('question', 'Mod looks like a replacer', {
      bbcode: 'The mod you just installed looks like a "replacer", meaning it is intended to replace '
          + 'one of the files shipped with the game.<br/>'
          + 'You should be aware that such a replacer includes a copy of some game data from a '
          + 'specific version of the game and may therefore break as soon as the game gets updated.<br/>'
          + 'Even if doesn\'t break, it may revert bugfixes that the game '
          + 'developers have made.<br/><br/>'
          + 'Therefore [color="red"]please take extra care to keep this mod updated[/color] and remove it when it '
          + 'no longer matches the game version.',
    }, [
      { label: 'Install as Mod (will likely not work)' },
      { label: 'Install as Replacer' },
    ]).then(result => result.action === 'Install as Replacer');
  } else {
    return Bluebird.resolve(false);
  }
}

function testReplacer(files: string[], gameId: string): Bluebird<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return Bluebird.resolve({ supported: false, requiredFiles: [] });
  }
  const paks = files.filter(file => path.extname(file).toLowerCase() === '.pak');

  return Bluebird.resolve({
    supported: paks.length === 0,
    requiredFiles: [],
  });
}

function installReplacer(files: string[],
                         destinationPath: string,
                         gameId: string,
                         progressDelegate: types.ProgressDelegate)
                         : Bluebird<types.IInstallResult> {
  const directories = Array.from(new Set(files.map(file => path.dirname(file).toUpperCase())));
  let dataPath: string = directories.find(dir => path.basename(dir) === 'DATA');
  if (dataPath === undefined) {
    const genOrPublic = directories
      .find(dir => ['PUBLIC', 'GENERATED'].includes(path.basename(dir)));
    if (genOrPublic !== undefined) {
      dataPath = path.dirname(genOrPublic);
    }
  }

  const instructions: types.IInstruction[] = (dataPath !== undefined)
    ? files.reduce((prev: types.IInstruction[], filePath: string) => {
      if (filePath.endsWith(path.sep)) {
        return prev;
      }
      const relPath = path.relative(dataPath, filePath);
      if (!relPath.startsWith('..')) {
        prev.push({
          type: 'copy',
          source: filePath,
          destination: relPath,
        });
      }
      return prev;
    }, [])
    : files.map((filePath: string): types.IInstruction => ({
        type: 'copy',
        source: filePath,
        destination: filePath,
      }));

  return Bluebird.resolve({
    instructions,
  });
}

const getPlayerProfiles = (() => {
  const cached = (fs as any).readdirSync(profilesPath())
      .filter(name => (path.extname(name) === '') && (name !== 'Default'));
  return () => cached;
})();

function InfoPanel(props) {
  const { t, currentProfile, onSetPlayerProfile } = props;

  const onSelect = React.useCallback((ev) => {
    onSetPlayerProfile(ev.currentTarget.value);
  }, [onSetPlayerProfile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
        {t('Ingame Profile: ')}
        <FormControl
          componentClass='select'
          name='userProfile'
          className='form-control'
          value={currentProfile}
          onChange={onSelect}
        >
          {getPlayerProfiles().map(prof => (<option key={prof} value={prof}>{prof}</option>))}
        </FormControl>
      </div>
      <div>
        {t('Please refer to mod descriptions from mod authors to determine the right order. '
          + 'If you can\'t find any suggestions for a mod, it probably doesn\'t matter.')}
      </div>
    </div>
  );
}

async function writeLoadOrder(api: types.IExtensionApi,
                              loadOrder: { [key: string]: ILoadOrderEntry }) {
  const bg3profile: string = api.store.getState().settings.baldursgate3?.playerProfile;

  if (!bg3profile) {
    log('warn', 'No Baldur\'s Gate 3 profile to save load order to');
    return;
  }

  const modSettings = await readModSettings(api);

  try {
    const region = findNode(modSettings.save.region, 'ModuleSettings');
    const root = findNode(region.node, 'root');
    const modsNode = findNode(root.children[0].node, 'Mods');
    const loNode = findNode(root.children[0].node, 'ModOrder');
    if ((loNode.children === undefined) || ((loNode.children[0] as any) === '')) {
      loNode.children = [{ node: [] }];
    }
    // drop all nodes except for the game entry
    const descriptionNodes = modsNode.children[0].node.filter(iter =>
      iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'Gustav')));

    const enabledPaks = Object.keys(loadOrder)
        .filter(key => !!loadOrder[key].data?.uuid && loadOrder[key].enabled);

    // add new nodes for the enabled mods
    for (const key of enabledPaks) {
      // const md5 = await util.fileMD5(path.join(modsPath(), key));
      descriptionNodes.push({
        $: { id: 'ModuleShortDesc' },
        attribute: [
          { $: { id: 'Folder', type: 'LSWString', value: loadOrder[key].data.folder } },
          { $: { id: 'MD5', type: 'LSString', value: loadOrder[key].data.md5 } },
          { $: { id: 'Name', type: 'FixedString', value: loadOrder[key].data.name } },
          { $: { id: 'UUID', type: 'FixedString', value: loadOrder[key].data.uuid } },
          { $: { id: 'Version', type: 'int32', value: loadOrder[key].data.version } },
        ],
      });
    }

    const loadOrderNodes = enabledPaks
      .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
      .map((key: string): IModNode => ({
        $: { id: 'Module' },
        attribute: [
          { $: { id: 'UUID', type: 'FixedString', value: loadOrder[key].data.uuid } },
        ],
      }));

    modsNode.children[0].node = descriptionNodes;
    loNode.children[0].node = loadOrderNodes;

    writeModSettings(api, modSettings);
    api.store.dispatch(settingsWritten(bg3profile, Date.now(), enabledPaks.length));
  } catch (err) {
    api.showErrorNotification('Failed to write load order', err, {
      allowReport: false,
      message: 'Please run the game at least once and create a profile in-game',
    });
  }
}

async function extractPak(pakPath, destPath, pattern) {
  return new Promise((resolve, reject) => {
    const exe = path.join(__dirname, 'tools', 'divine.exe');
    const args = [
      '--action', 'extract-package',
      '--source', pakPath,
      '--destination', destPath,
      '--loglevel', 'off',
      '--game', 'bg3',
      '--expression', pattern,
    ];
    const proc = spawn(exe, args, { cwd: path.join(__dirname, 'tools') });

    proc.stdout.on('data', data => log('debug', data));
    proc.stderr.on('data', data => log('warn', data));
    proc.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        const err = new Error('divine.exe failed');
        err['attachLogOnReport'] = true;
        err['code'] = code;
        reject(err);
      }
    });
  });
}

async function extractMeta(pakPath: string): Promise<IModSettings> {
  const metaPath = path.join(util.getVortexPath('temp'), 'lsmeta', shortid());
  await fs.ensureDirAsync(metaPath);
  await extractPak(pakPath, metaPath, '*/meta.lsx');
  try {
    // the meta.lsx may be in a subdirectory. There is probably a pattern here
    // but we'll just use it from wherever
    let metaLSXPath: string = path.join(metaPath, 'meta.lsx');
    await walk(metaPath, entries => {
      const temp = entries.find(e => path.basename(e.filePath).toLowerCase() === 'meta.lsx');
      if (temp !== undefined) {
        metaLSXPath = temp.filePath;
      }
    });
    const dat = await fs.readFileAsync(metaLSXPath);
    const meta = await parseStringPromise(dat);
    await fs.removeAsync(metaPath);
    return meta;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return Promise.resolve(undefined);
    } else {
      throw err;
    }
  }
}

function findNode<T extends IXmlNode<{ id: string }>, U>(nodes: T[], id: string): T {
  return nodes?.find(iter => iter.$.id === id) ?? undefined;
}

async function extractPakInfo(pakPath: string): Promise<IPakInfo> {
  const meta = await extractMeta(pakPath);
  const config = findNode(meta?.save?.region, 'Config');
  const configRoot = findNode(config?.node, 'root');
  const moduleInfo = findNode(configRoot?.children?.[0]?.node, 'ModuleInfo');

  const attr = (name: string, fallback: () => any) =>
    findNode(moduleInfo?.attribute, name)?.$?.value ?? fallback();

  const genName = path.basename(pakPath, path.extname(pakPath));

  return {
    author: attr('Author', () => 'Unknown'),
    description: attr('Description', () => 'Missing'),
    folder: attr('Folder', () => genName),
    md5: attr('MD5', () => ''),
    name: attr('Name', () => genName),
    type: attr('Type', () => 'Adventure'),
    uuid: attr('UUID', () => require('uuid').v4()),
    version: attr('Version', () => '1'),
  };
}

const fallbackPicture = path.join(__dirname, 'gameart.jpg');

let storedLO: any[];

function parseModNode(node: IModNode) {
  const name = findNode(node.attribute, 'Name').$.value;
  return {
    id: name,
    name,
    data: findNode(node.attribute, 'UUID').$.value,
  };
}

async function readModSettings(api: types.IExtensionApi): Promise<IModSettings> {
  const state = api.store.getState();
  let bg3profile: string = state.settings.baldursgate3?.playerProfile;
  if (!bg3profile) {
    const playerProfiles = getPlayerProfiles();
    if (playerProfiles.length === 0) {
      storedLO = [];
      return;
    }
    bg3profile = getPlayerProfiles()[0];
  }

  const settingsPath = path.join(profilesPath(), bg3profile, 'modsettings.lsx');
  const dat = await fs.readFileAsync(settingsPath);
  return parseStringPromise(dat);
}

async function writeModSettings(api: types.IExtensionApi, data: IModSettings): Promise<void> {
  let bg3profile: string = api.store.getState().settings.baldursgate3?.playerProfile;
  if (!bg3profile) {
    const playerProfiles = getPlayerProfiles();
    if (playerProfiles.length === 0) {
      storedLO = [];
      return;
    }
    bg3profile = getPlayerProfiles()[0];
  }

  const settingsPath = path.join(profilesPath(), bg3profile, 'modsettings.lsx');

  const builder = new Builder();
  const xml = builder.buildObject(data);
  await fs.writeFileAsync(settingsPath, xml);
}

async function readStoredLO(api: types.IExtensionApi) {
  const modSettings = await readModSettings(api);
  const config = findNode(modSettings.save?.region, 'ModuleSettings');
  const configRoot = findNode(config?.node, 'root');
  const modOrderRoot = findNode(configRoot?.children?.[0]?.node, 'ModOrder');
  const modsRoot = findNode(configRoot.children?.[0]?.node, 'Mods');
  const modOrderNodes = modOrderRoot.children?.[0]?.node ?? [];
  const modNodes = modsRoot.children?.[0]?.node ?? [];

  const modOrder = modOrderNodes.map(node => findNode(node.attribute, 'UUID').$?.value);

  // return util.setSafe(state, ['settingsWritten', profile], { time, count });
  const state = api.store.getState();
  const bg3profile: string = state.settings.baldursgate3?.playerProfile;
  if (modNodes.length === 1) {
    const lastWrite = state.settings.baldursgate3?.settingsWritten?.[bg3profile];
    if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
      api.sendNotification({
        type: 'warning',
        allowSuppress: true,
        title: '"modsettings.lsx" file was reset',
        message: 'This usually happens when an invalid mod is installed',
      });
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

function makePreSort(api: types.IExtensionApi) {
  // workaround for mod_load_order being bugged af, it will occasionally call preSort
  // with a fresh list of mods from filter, completely ignoring previous sort results

  return async (items: any[], sortDir: any, updateType: any): Promise<any[]> => {
    if ((items.length === 0) && (storedLO !== undefined)) {
      return storedLO;
    }

    const state = api.getState();
    const paks = (await fs.readdirAsync(modsPath()))
      .filter(fileName => path.extname(fileName).toLowerCase() === '.pak');

    const manifest = await util.getManifest(api, '', GAME_ID);

    const result: any[] = [];

    for (const fileName of paks) {
      const existingItem = items.find(iter => iter.id === fileName);
      if ((existingItem !== undefined)
          && (updateType !== 'refresh')
          && (existingItem.imgUrl !== undefined)) {
        result.push(existingItem);
        continue;
      }

      const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
      const mod = manifestEntry !== undefined
        ? state.persistent.mods[GAME_ID][manifestEntry.source]
        : undefined;

      let modInfo = existingItem?.data;
      if (modInfo === undefined) {
        modInfo = await extractPakInfo(path.join(modsPath(), fileName));
      }

      if (mod !== undefined) {
        // pak is from a mod (an installed one)
        result.push({
          id: fileName,
          name: util.renderModName(mod),
          imgUrl: mod.attributes?.pictureUrl ?? fallbackPicture,
          data: modInfo,
          external: false,
        });
      } else {
        result.push({
          id: fileName,
          name: path.basename(fileName, path.extname(fileName)),
          imgUrl: fallbackPicture,
          data: modInfo,
          external: true,
        });
      }
    }

    /*
    .sort((lhs, rhs) => (sortDir === 'ascending')
      ? lhs.name.localeCompare(rhs.name)
      : rhs.name.localeCompare(lhs.name))
      ;*/
    storedLO = result.sort((lhs, rhs) => items.indexOf(lhs) - items.indexOf(rhs));
    return storedLO;
  };
}

function main(context: types.IExtensionContext) {
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
          'game/bin/TS4.exe',
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
      SteamAPPId: '1086940',
    },
    details: {
      steamAppId: 1086940,
      stopPatterns: STOP_PATTERNS.map(toWordExp),
    },
  });

  let forceRefresh: () => void;

  context.registerReducer(['settings', 'baldursgate3'], reducer);

  context.registerInstaller('bg3-replacer', 25, testReplacer, installReplacer);

  context.registerModType('bg3-replacer', 25, (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api), files => isReplacer(context.api, files),
    { name: 'BG3 Replacer' } as any);

  (context as any).registerLoadOrderPage({
    gameId: GAME_ID,
    createInfoPanel: (props) => {
      forceRefresh = props.forceRefreshIn;
      return React.createElement(InfoPanel, {
        t: context.api.translate,
        currentProfile: context.api.store.getState().settings.baldursgate3?.playerProfile,
        onSetPlayerProfile: (profileName: string) => {
          context.api.store.dispatch(setPlayerProfile(profileName));
          readStoredLO(context.api);
          forceRefresh();
        },
      });
    },
    filter: () => [],
    preSort: makePreSort(context.api),
    gameArtURL: `${__dirname}/gameart.jpg`,
    displayCheckboxes: true,
    callback: (loadOrder: any) => writeLoadOrder(context.api, loadOrder),
  });

  context.once(() => {
    context.api.onStateChange(['session', 'base', 'toolsRunning'],
      (prev: any, current: any) => {
        // when a tool exits, re-read the load order from disk as it may have been
        // changed
        const gameMode = selectors.activeGameId(context.api.getState());
        if ((gameMode === GAME_ID) && (Object.keys(current).length === 0)) {
          readStoredLO(context.api);
        }
      });

    context.api.onAsync('did-deploy', (profileId: string, deployment) => {
      const profile = selectors.profileById(context.api.getState(), profileId);
      if ((profile.gameId === GAME_ID) && (forceRefresh !== undefined)) {
        forceRefresh();
      }
      return Promise.resolve();
    });

    return Bluebird.resolve(readStoredLO(context.api));
  });

  return true;
}

export default main;
