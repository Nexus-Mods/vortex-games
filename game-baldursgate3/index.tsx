import Bluebird from 'bluebird';
import { spawn } from 'child_process';
import getVersion from 'exe-version';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';
import { FormControl } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { createAction } from 'redux-act';
import * as semver from 'semver';
import { generate as shortid } from 'shortid';
import walk, { IEntry } from 'turbowalk';
import { actions, fs, log, selectors, tooltip, types, util } from 'vortex-api';
import { Builder, parseStringPromise } from 'xml2js';
import { ILoadOrderEntry, IModNode, IModSettings, IPakInfo, IXmlNode } from './types';

import { DEFAULT_MOD_SETTINGS, GAME_ID, LSLIB_URL } from './common';
import * as gitHubDownloader from './githubDownloader';

const STOP_PATTERNS = ['[^/]*\\.pak$'];

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
    playerProfile: 'global',
    settingsWritten: {},
  },
};

function documentsPath() {
  return path.join(util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}

function modsPath() {
  return path.join(documentsPath(), 'Mods');
}

function profilesPath() {
  return path.join(documentsPath(), 'PlayerProfiles');
}

function globalProfilePath() {
  return path.join(documentsPath(), 'global');
}

function findGame(): any {
  return util.GameStoreHelper.findByAppId(['1456460669', '1086940'])
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
    .catch(() => fs.ensureDirWritableAsync(mp, () => Bluebird.resolve() as any)
      .then(() => api.showDialog('info', 'Early Access Game', {
        bbcode: 'Baldur\'s Gate 3 is currently in Early Access. It doesn\'t officially '
            + 'support modding, doesn\'t include any modding tools and will receive '
            + 'frequent updates.<br/>'
            + 'Mods may become incompatible within days of being released, generally '
            + 'not work and/or break unrelated things within the game.<br/><br/>'
            + '[color="red"]Please don\'t report issues that happen in connection with mods to the '
            + 'game developers (Larian Studios) or through the Vortex feedback system.[/color]',
      }, [ { label: 'I understand' } ])))
    .finally(() => ensureGlobalProfile(api, discovery));
}

function getGamePath(api) {
  const state = api.getState();
  return state.settings.gameMode.discovered?.[GAME_ID]?.path;
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

const LSLIB_FILES = new Set([
  'divine.exe',
  'lslib.dll',
]);

function isLSLib(api: types.IExtensionApi, files: types.IInstruction[]) {
  const origFile = files.find(iter =>
    (iter.type === 'copy') && LSLIB_FILES.has(path.basename(iter.destination).toLowerCase()));
  return origFile !== undefined
    ? Bluebird.resolve(true)
    : Bluebird.resolve(false);
}

function testLSLib(files: string[], gameId: string): Bluebird<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return Bluebird.resolve({ supported: false, requiredFiles: [] });
  }
  const matchedFiles = files.filter(file => LSLIB_FILES.has(path.basename(file).toLowerCase()));

  return Bluebird.resolve({
    supported: matchedFiles.length >= 2,
    requiredFiles: [],
  });
}

async function installLSLib(files: string[],
                            destinationPath: string,
                            gameId: string,
                            progressDelegate: types.ProgressDelegate)
                            : Promise<types.IInstallResult> {
  const exe = files.find(file => path.basename(file.toLowerCase()) === 'divine.exe');
  const exePath = path.join(destinationPath, exe);
  let ver: string = await getVersion(exePath);
  ver = ver.split('.').slice(0, 3).join('.');

  // Unfortunately the LSLib developer is not consistent when changing
  //  file versions - the executable attribute might have an older version
  //  value than the one specified by the filename - we're going to use
  //  the filename as the point of truth *ugh*
  const fileName = path.basename(destinationPath, path.extname(destinationPath));
  const idx = fileName.indexOf('-v');
  const fileNameVer = fileName.slice(idx + 2);
  if (semver.valid(fileNameVer) && ver !== fileNameVer) {
    ver = fileNameVer;
  }
  const versionAttr: types.IInstruction = { type: 'attribute', key: 'version', value: ver };
  const modtypeAttr: types.IInstruction = { type: 'setmodtype', value: 'bg3-lslib-divine-tool' };
  const instructions: types.IInstruction[] =
    files.reduce((accum: types.IInstruction[], filePath: string) => {
      if (filePath.toLowerCase()
                  .split(path.sep)
                  .indexOf('tools') !== -1
      && !filePath.endsWith(path.sep)) {
        accum.push({
          type: 'copy',
          source: filePath,
          destination: path.join('tools', path.basename(filePath)),
        });
      }
      return accum;
    }, [ modtypeAttr, versionAttr ]);

  return Promise.resolve({ instructions });
}

function isReplacer(api: types.IExtensionApi, files: types.IInstruction[]) {
  const origFile = files.find(iter =>
    (iter.type === 'copy') && ORIGINAL_FILES.has(iter.destination.toLowerCase()));

  const paks = files.filter(iter =>
    (iter.type === 'copy') && (path.extname(iter.destination).toLowerCase() === '.pak'));

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

function InfoPanel(props) {
  const { t, currentProfile, onInstallLSLib,
          onSetPlayerProfile, isLsLibInstalled } = props;

  const onSelect = React.useCallback((ev) => {
    onSetPlayerProfile(ev.currentTarget.value);
  }, [onSetPlayerProfile]);

  return isLsLibInstalled() ? (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' }}>
        {t('Ingame Profile: ')}
        <FormControl
          componentClass='select'
          name='userProfile'
          className='form-control'
          value={currentProfile}
          onChange={onSelect}
        >
          <option key='global' value='global'>{t('All Profiles')}</option>
          {getPlayerProfiles().map(prof => (<option key={prof} value={prof}>{prof}</option>))}
        </FormControl>
      </div>
      <hr/>
      <div>
        {t('Please refer to mod descriptions from mod authors to determine the right order. '
          + 'If you can\'t find any suggestions for a mod, it probably doesn\'t matter.')}
        <hr/>
        {t('Some mods may be locked in this list because they are loaded differently by the engine '
          + 'and can therefore not be load-ordered by mod managers. If you want to disable '
          + 'such a mod, please do so on the "Mods" screen.')}
      </div>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' }}>
        {t('LSLib is not installed')}
      </div>
      <hr/>
      <div>
        {t('To take full advantage of Vortex\'s BG3 modding capabilities such as managing the '
         + 'order in which mods are loaded into the game; Vortex requires a 3rd party tool "LSLib", '
         + 'please install the library using the buttons below to manage your load order.')}
      </div>
      <tooltip.Button
        tooltip={'Install LSLib'}
        onClick={onInstallLSLib}
      >
        {t('Install LSLib')}
      </tooltip.Button>
    </div>
  );
}

function getActivePlayerProfile(api: types.IExtensionApi) {
  return api.store.getState().settings.baldursgate3?.playerProfile || 'global';
}

async function writeLoadOrder(api: types.IExtensionApi,
                              loadOrder: { [key: string]: ILoadOrderEntry }) {
  const bg3profile: string = getActivePlayerProfile(api);
  const playerProfiles = (bg3profile === 'global') ? getPlayerProfiles() : [bg3profile];
  if (playerProfiles.length === 0) {
    api.sendNotification({
      id: 'bg3-no-profiles',
      type: 'warning',
      title: 'No player profiles',
      message: 'Please run the game at least once and create a profile in-game',
    });
    return;
  }
  api.dismissNotification('bg3-no-profiles');

  try {
    const modSettings = await readModSettings(api);

    const region = findNode(modSettings?.save?.region, 'ModuleSettings');
    const root = findNode(region?.node, 'root');
    const modsNode = findNode(root?.children?.[0]?.node, 'Mods');
    const loNode = findNode(root?.children?.[0]?.node, 'ModOrder') ?? { children: [] };
    if ((loNode.children === undefined) || ((loNode.children[0] as any) === '')) {
      loNode.children = [{ node: [] }];
    }
    // drop all nodes except for the game entry
    const descriptionNodes = modsNode?.children?.[0]?.node?.filter?.(iter =>
      iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'Gustav'))) ?? [];

    const enabledPaks = Object.keys(loadOrder)
        .filter(key => !!loadOrder[key].data?.uuid
                    && loadOrder[key].enabled
                    && !loadOrder[key].data?.isListed);

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

    if (bg3profile === 'global') {
      writeModSettings(api, modSettings, bg3profile);
    }
    for (const profile of playerProfiles) {
      writeModSettings(api, modSettings, profile);
      api.store.dispatch(settingsWritten(profile, Date.now(), enabledPaks.length));
    }
  } catch (err) {
    api.showErrorNotification('Failed to write load order', err, {
      allowReport: false,
      message: 'Please run the game at least once and create a profile in-game',
    });
  }
}

type DivineAction = 'create-package' | 'list-package' | 'extract-single-file'
                  | 'extract-package' | 'extract-packages' | 'convert-model'
                  | 'convert-models' | 'convert-resource' | 'convert-resources';

interface IDivineOptions {
  source: string;
  destination?: string;
  expression?: string;
}

interface IDivineOutput {
  stdout: string;
  returnCode: number;
}

function getLatestLSLibMod(api: types.IExtensionApi) {
  const state = api.getState();
  const mods: { [modId: string]: types.IMod } = state.persistent.mods[GAME_ID];
  if (mods === undefined) {
    log('warn', 'LSLib is not installed');
    return undefined;
  }
  const lsLib: types.IMod = Object.keys(mods).reduce((prev: types.IMod, id: string) => {
    if (mods[id].type === 'bg3-lslib-divine-tool') {
      const latestVer = util.getSafe(prev, ['attributes', 'version'], '0.0.0');
      const currentVer = util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
      try {
        if (semver.gt(currentVer, latestVer)) {
          prev = mods[id];
        }
      } catch (err) {
        log('warn', 'invalid mod version', { modId: id, version: currentVer });
      }
    }
    return prev;
  }, undefined);

  if (lsLib === undefined) {
    log('warn', 'LSLib is not installed');
    return undefined;
  }

  return lsLib;
}

class DivineExecMissing extends Error {
  constructor() {
    super('Divine executable is missing');
    this.name = 'DivineExecMissing';
  }
}

function divine(api: types.IExtensionApi,
                action: DivineAction,
                options: IDivineOptions): Promise<IDivineOutput> {
  return new Promise<IDivineOutput>((resolve, reject) => {
    let returned: boolean = false;
    let stdout: string = '';

    const state = api.getState();
    const stagingFolder = selectors.installPathForGame(state, GAME_ID);
    const lsLib: types.IMod = getLatestLSLibMod(api);
    if (lsLib === undefined) {
      const err = new Error('LSLib/Divine tool is missing');
      err['attachLogOnReport'] = false;
      return reject(err);
    }
    const exe = path.join(stagingFolder, lsLib.installationPath, 'tools', 'divine.exe');
    const args = [
      '--action', action,
      '--source', options.source,
      '--loglevel', 'off',
      '--game', 'bg3',
    ];

    if (options.destination !== undefined) {
      args.push('--destination', options.destination);
    }
    if (options.expression !== undefined) {
      args.push('--expression', options.expression);
    }

    const proc = spawn(exe, args);

    proc.stdout.on('data', data => stdout += data);
    proc.stderr.on('data', data => log('warn', data));

    proc.on('error', (errIn: Error) => {
      if (!returned) {
        if (errIn['code'] === 'ENOENT') {
          reject(new DivineExecMissing());
        }
        returned = true;
        const err = new Error('divine.exe failed: ' + errIn.message);
        err['attachLogOnReport'] = true;
        reject(err);
      }
    });
    proc.on('exit', (code: number) => {
      if (!returned) {
        returned = true;
        if (code === 0) {
          return resolve({ stdout, returnCode: 0 });
        } else if ([2, 102].includes(code)) {
          return resolve({ stdout: '', returnCode: 2 });
        } else {
          // divine.exe returns the actual error code + 100 if a fatal error occured
          if (code > 100) {
            code -= 100;
          }
          const err = new Error(`divine.exe failed: ${code}`);
          err['attachLogOnReport'] = true;
          return reject(err);
        }
      }
    });
  });
}

async function extractPak(api: types.IExtensionApi, pakPath, destPath, pattern) {
  return divine(api, 'extract-package',
    { source: pakPath, destination: destPath, expression: pattern });
}

async function extractMeta(api: types.IExtensionApi, pakPath: string, mod: types.IMod): Promise<IModSettings> {
  const metaPath = path.join(util.getVortexPath('temp'), 'lsmeta', shortid());
  await fs.ensureDirAsync(metaPath);
  await extractPak(api, pakPath, metaPath, '*/meta.lsx');
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
    await fs.removeAsync(metaPath);
    if (err.code === 'ENOENT') {
      return Promise.resolve(undefined);
    } else if (err.message.includes('Column') && (err.message.includes('Line'))) {
      // an error message specifying column and row indicate a problem parsing the xml file
      api.sendNotification({
        type: 'warning',
        message: 'The meta.lsx file in "{{modName}}" is invalid, please report this to the author',
        actions: [{
          title: 'More',
          action: () => {
            api.showDialog('error', 'Invalid meta.lsx file', {
              message: err.message,
            }, [{ label: 'Close' }])
          }
        }],
        replace: {
          modName: util.renderModName(mod),
        }
      })
      return Promise.resolve(undefined);
    } else {
      throw err;
    }
  }
}

function findNode<T extends IXmlNode<{ id: string }>, U>(nodes: T[], id: string): T {
  return nodes?.find(iter => iter.$.id === id) ?? undefined;
}

const listCache: { [path: string]: Promise<string[]> } = {};

async function listPackage(api: types.IExtensionApi, pakPath: string): Promise<string[]> {
  const res = await divine(api, 'list-package', { source: pakPath });
  const lines = res.stdout.split('\n').map(line => line.trim()).filter(line => line.length !== 0);

  return lines;
}

async function isLOListed(api: types.IExtensionApi, pakPath: string): Promise<boolean> {
  if (listCache[pakPath] === undefined) {
    listCache[pakPath] = listPackage(api, pakPath);
  }
  const lines = await listCache[pakPath];
  // const nonGUI = lines.find(line => !line.toLowerCase().startsWith('public/game/gui'));
  const metaLSX = lines.find(line =>
    path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx');
  return metaLSX === undefined;
}

async function extractPakInfoImpl(api: types.IExtensionApi, pakPath: string, mod: types.IMod): Promise<IPakInfo> {
  const meta = await extractMeta(api, pakPath, mod);
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
    isListed: await isLOListed(api, pakPath),
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
  const bg3profile: string = getActivePlayerProfile(api);
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

async function readPAKList(api: types.IExtensionApi) {
  let paks: string[];
  try {
    paks = (await fs.readdirAsync(modsPath()))
      .filter(fileName => path.extname(fileName).toLowerCase() === '.pak');
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        await fs.ensureDirWritableAsync(modsPath(), () => Bluebird.resolve());
      } catch (err) {
        // nop
      }
    } else {
      api.showErrorNotification('Failed to read mods directory', err, {
        id: 'bg3-failed-read-mods',
        message: modsPath(),
      });
    }
    paks = [];
  }

  return paks;
}

async function readPAKs(api: types.IExtensionApi)
    : Promise<Array<{ fileName: string, mod: types.IMod, info: IPakInfo }>> {
  const state = api.getState();
  const lsLib = getLatestLSLibMod(api);
  if (lsLib === undefined) {
    return [];
  }
  const paks = await readPAKList(api);

  let manifest;
  try {
    manifest = await util.getManifest(api, '', GAME_ID);
  } catch (err) {
    const allowReport = !['EPERM'].includes(err.code);
    api.showErrorNotification('Failed to read deployment manifest', err, { allowReport });
    return [];
  }

  const res = await Promise.all(paks.map(async fileName => {
    return util.withErrorContext('reading pak', fileName, () => {
      const func = async () => {
        try {
          const manifestEntry = manifest.files.find(entry => entry.relPath === fileName);
          const mod = (manifestEntry !== undefined)
            ? state.persistent.mods[GAME_ID]?.[manifestEntry.source]
            : undefined;

          const pakPath = path.join(modsPath(), fileName);

          return {
            fileName,
            mod,
            info: await extractPakInfoImpl(api, pakPath, mod),
          };
        } catch (err) {
          if (err instanceof DivineExecMissing) {
            const message = 'The installed copy of LSLib/Divine is corrupted - please '
              + 'delete the existing LSLib mod entry and re-install it. Make sure to '
              + 'disable or add any necessary exceptions to your security software to '
              + 'ensure it does not interfere with Vortex/LSLib file operations.';
            api.showErrorNotification('Divine executable is missing', message,
              { allowReport: false });
            return undefined;
          }
          // could happen if the file got deleted since reading the list of paks.
          // actually, this seems to be fairly common when updating a mod
          if (err.code !== 'ENOENT') {
            api.showErrorNotification('Failed to read pak', err, {
              allowReport: true,
              message: fileName,
            });
          }
          return undefined;
        }
      };
      return Bluebird.resolve(func());
    });
  }));
  return res.filter(iter => iter !== undefined);
}

async function readLO(api: types.IExtensionApi): Promise<string[]> {
  try {
    const modSettings = await readModSettings(api);
    const config = findNode(modSettings?.save?.region, 'ModuleSettings');
    const configRoot = findNode(config?.node, 'root');
    const modOrderRoot = findNode(configRoot?.children?.[0]?.node, 'ModOrder');
    const modOrderNodes = modOrderRoot?.children?.[0]?.node ?? [];
    return modOrderNodes.map(node => findNode(node.attribute, 'UUID').$?.value);
  } catch (err) {
    api.showErrorNotification('Failed to read modsettings.lsx', err, {
      allowReport: false,
      message: 'Please run the game at least once and create a profile in-game',
    });
    return [];
  }
}

function serializeLoadOrder(api: types.IExtensionApi, order): Promise<void> {
  return writeLoadOrder(api, order);
}

const deserializeDebouncer = new util.Debouncer(() => {
  return Promise.resolve();
}, 1000);

async function deserializeLoadOrder(api: types.IExtensionApi): Promise<any> {
  // this function might be invoked by the lslib mod being (un)installed in which case it might be
  // in the middle of being unpacked or removed which leads to weird error messages.
  // this is a hack hopefully ensureing the it's either fully there or not at all
  await util.toPromise(cb => deserializeDebouncer.schedule(cb));

  const paks = await readPAKs(api);

  const order = await readLO(api);

  const orderValue = (info: IPakInfo) => {
    return order.indexOf(info.uuid) + (info.isListed ? 0 : 1000);
  };

  return paks
    .sort((lhs, rhs) => orderValue(lhs.info) - orderValue(rhs.info))
    .map(({ fileName, mod, info }) => ({
      id: fileName,
      enabled: true,
      name: util.renderModName(mod),
      modId: mod?.id,
      locked: info.isListed,
      data: info,
    }));
}

function validate(before, after): Promise<any> {
  return Promise.resolve();
}

let forceRefresh: () => void;

function InfoPanelWrap(props: { api: types.IExtensionApi, refresh: () => void }) {
  const { api } = props;

  const currentProfile = useSelector((state: types.IState) =>
    state.settings['baldursgate3']?.playerProfile);

  React.useEffect(() => {
    forceRefresh = props.refresh;
  }, []);

  const onSetProfile = React.useCallback((profileName: string) => {
    const impl = async () => {
      api.store.dispatch(setPlayerProfile(profileName));
      try {
        await readStoredLO(api);
      } catch (err) {
        api.showErrorNotification('Failed to read load order', err, {
          message: 'Please run the game before you start modding',
          allowReport: false,
        });
      }
      forceRefresh?.();
    };
    impl();
  }, [ api ]);

  const isLsLibInstalled = React.useCallback(() => {
    return getLatestLSLibMod(api) !== undefined;
  }, [ api ]);

  const onInstallLSLib = React.useCallback(() => {
    onGameModeActivated(api, GAME_ID);
  }, [api]);

  return (
    <InfoPanel
      t={api.translate}
      currentProfile={currentProfile}
      onSetPlayerProfile={onSetProfile}
      isLsLibInstalled={isLsLibInstalled}
      onInstallLSLib={onInstallLSLib}
    />
  );
}

function getLatestInstalledLSLibVer(api: types.IExtensionApi) {
  const state = api.getState();
  const mods: { [modId: string]: types.IMod } =
    util.getSafe(state, ['persistent', 'mods', GAME_ID], {});

  return Object.keys(mods).reduce((prev, id) => {
    if (mods[id].type === 'bg3-lslib-divine-tool') {
      const arcId = mods[id].archiveId;
      const dl: types.IDownload = util.getSafe(state,
        ['persistent', 'downloads', 'files', arcId], undefined);
      const storedVer = util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');

      try {
        if (semver.gt(storedVer, prev)) {
          prev = storedVer;
        }
      } catch (err) {
        log('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
      }

      if (dl !== undefined) {
        // The LSLib developer doesn't always update the version on the executable
        //  itself - we're going to try to extract it from the archive which tends
        //  to use the correct version.
        const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
        const idx = fileName.indexOf('-v');
        try {
          const ver = semver.coerce(fileName.slice(idx + 2)).version;
          if (semver.valid(ver) && ver !== storedVer) {
            api.store.dispatch(actions.setModAttribute(GAME_ID, id, 'version', ver));
            prev = ver;
          }
        } catch (err) {
          // We failed to get the version... Oh well.. Set a bogus version since
          //  we clearly have lslib installed - the update functionality should take
          //  care of the rest (when the user clicks the check for updates button)
          api.store.dispatch(actions.setModAttribute(GAME_ID, id, 'version', '1.0.0'));
          prev = '1.0.0';
        }
      }
    }
    return prev;
  }, '0.0.0');
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

function nop() {
  // nop
}

async function onGameModeActivated(api: types.IExtensionApi, gameId: string) {
  if (gameId !== GAME_ID) {
    return;
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
      SteamAPPId: '1086940',
    },
    details: {
      steamAppId: 1086940,
      stopPatterns: STOP_PATTERNS.map(toWordExp),
      ignoreConflicts: [
        'info.json',
      ],
      ignoreDeploy: [
        'info.json',
      ],
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

  context.registerInstaller('bg3-replacer', 25, testReplacer, installReplacer);
  context.registerInstaller('bg3-lslib-divine-tool', 15, testLSLib, installLSLib as any);

  context.registerModType('bg3-replacer', 25, (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api), files => isReplacer(context.api, files),
    { name: 'BG3 Replacer' } as any);

  context.registerModType('bg3-lslib-divine-tool', 15, (gameId) => gameId === GAME_ID,
    () => undefined, files => isLSLib(context.api, files),
    { name: 'BG3 LSLib' });

  context.registerLoadOrder({
    gameId: GAME_ID,
    deserializeLoadOrder: () => deserializeLoadOrder(context.api),
    serializeLoadOrder: (loadOrder) => serializeLoadOrder(context.api, loadOrder),
    validate,
    toggleableEntries: true,
    usageInstructions: (() => (<InfoPanelWrap api={context.api} refresh={nop} />)) as any,
  });

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
      if ((profile?.gameId === GAME_ID) && (forceRefresh !== undefined)) {
        forceRefresh();
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
