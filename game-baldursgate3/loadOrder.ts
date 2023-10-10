import { actions, fs, log, selectors, types, util } from 'vortex-api';
import path from 'path';
import * as semver from 'semver';
import { generate as shortid } from 'shortid';
import walk, { IEntry } from 'turbowalk';
import Bluebird from 'bluebird';
import { spawn } from 'child_process';

import { GAME_ID, INVALID_LO_MOD_TYPES, LO_FILE_NAME } from './common';
import { BG3Pak, DivineAction, IDivineOptions, IDivineOutput, IModNode, IModSettings, IPakInfo, IProps, IXmlNode } from './types';
import { Builder, parseStringPromise } from 'xml2js';
import { LockedState } from 'vortex-api/lib/extensions/file_based_loadorder/types/types';
import { IOpenOptions } from 'vortex-api/lib/types/IExtensionContext';


function documentsPath() {
  return path.join(util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}

function modsPath() {
  return path.join(documentsPath(), 'Mods');
}

export function profilesPath() {
  return path.join(documentsPath(), 'PlayerProfiles');
}

function globalProfilePath() {
  return path.join(documentsPath(), 'global');
}

export async function serialize(context: types.IExtensionContext,
                                loadOrder: types.LoadOrder,
                                profileId?: string): Promise<void> {
  const props: IProps = genProps(context);
  if (props === undefined) {
    return Promise.reject(new util.ProcessCanceled('invalid props'));
  }
  
  const state = context.api.getState();

  // Make sure the LO file is created and ready to be written to.
  const loFilePath = await ensureLOFile(context, profileId, props);
  //const filteredLO = loadOrder.filter(lo => (!INVALID_LO_MOD_TYPES.includes(props.mods?.[lo?.modId]?.type)));

  console.log('serialize loadOrder=', loadOrder);

  // Write the prefixed LO to file.
  await fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
  await fs.writeFileAsync(loFilePath, JSON.stringify(loadOrder), { encoding: 'utf8' });

  // check the state for if we are keeping the game one in sync
  // if we are writing vortex's load order, then we will also write the games one

  const autoExportToGame:boolean = state.settings['baldursgate3'].autoExportLoadOrder ?? false;

  console.log('serialize autoExportToGame=', autoExportToGame);

  if(autoExportToGame) 
    await exportToGame(context.api);

  return Promise.resolve();
}

export async function deserialize(context: types.IExtensionContext): Promise<types.LoadOrder> {
  
  // genProps is a small utility function which returns often re-used objects
  //  such as the current list of installed Mods, Vortex's application state,
  //  the currently active profile, etc.
  const props: IProps = genProps(context);
  if (props?.profile?.gameId !== GAME_ID) {
    // Why are we deserializing when the profile is invalid or belongs to another game ?
    return [];
  }


/*


  // The deserialization function should be used to filter and insert wanted data into Vortex's
  //  loadOrder application state, once that's done, Vortex will trigger a serialization event
  //  which will ensure that the data is written to the LO file.
  const currentModsState = util.getSafe(props.profile, ['modState'], {});

  // we only want to insert enabled mods.
  const enabledModIds = Object.keys(currentModsState)
    .filter(modId => util.getSafe(currentModsState, [modId, 'enabled'], false));*/

  
  const paks = await readPAKs(context.api);

  const mods: { [modId: string]: types.IMod } = util.getSafe(props.state, ['persistent', 'mods', GAME_ID], {});


  // create if necessary, but load the load order from file
    
  const loFilePath = await ensureLOFile(context);
  const fileData = await fs.readFileAsync(loFilePath, { encoding: 'utf8' });

  let loadOrder: types.ILoadOrderEntry[] = [];

  try {
    
    try {
      loadOrder = JSON.parse(fileData);
    } catch (err) {

      await new Promise<void>((resolve, reject) => {
        props.api.showDialog('error', 'Corrupt load order file', {
          bbcode: props.api.translate('The load order file is in a corrupt state. You can try to fix it yourself '
                                    + 'or Vortex can regenerate the file for you, but that may result in loss of data ' +
                                      '(Will only affect load order items you added manually, if any).')
        }, [
          { label: 'Cancel', action: () => reject(err) },
          { label: 'Regenerate File', action: () => {
            loadOrder = [];
              return resolve();
            }
          }
        ])
      })
    }

    
    console.log('deserialize loadOrder=', loadOrder);

    // filter out any pak files that no longer exist
    const filteredLoadOrder:types.LoadOrder = loadOrder.filter(entry => paks.find(pak => pak.fileName === entry.id));

    console.log('deserialize filteredLoadOrder=', filteredLoadOrder);

    // get any pak files that aren't in the filteredLoadOrder
    const addedMods:BG3Pak[] = paks.filter(pak => filteredLoadOrder.find(entry => entry.id === pak.fileName) === undefined);

    console.log('deserialize addedMods=', addedMods);
    
    // Check if the user added any new mods.
    //const diff = enabledModIds.filter(id => (!INVALID_LO_MOD_TYPES.includes(mods[id]?.type))
    //  && (filteredData.find(loEntry => loEntry.id === id) === undefined));

    console.log('deserialize paks=', paks);

    // Add any newly added mods to the bottom of the loadOrder.
    addedMods.forEach(pak => {
      filteredLoadOrder.push({
        id: pak.fileName,
        modId: pak.mod.id,
        enabled: true,        
        name: pak.info.name,
        data: pak.info,
        locked: pak.info.isListed as LockedState        
      })      
    });       

    //console.log('deserialize filteredData=', filteredData);

    // sorted so that any mods that are locked appear at the top
    //const sortedAndFilteredData = 
    
    // return
    return filteredLoadOrder.sort((a, b) => (+b.locked - +a.locked));
  } catch (err) {
    return Promise.reject(err);
  }
}


export async function importModSettingsFile(api: types.IExtensionApi): Promise<boolean | void> {

  const state = api.getState();
  const profileId = selectors.activeProfile(state)?.id;

  const options: IOpenOptions = {
    title: api.translate('Please choose a BG3 .lsx file to import from'),
    filters: [{ name: 'BG3 Load Order', extensions: ['lsx'] }]
  };

  const selectedPath:string = await api.selectFile(options);

  console.log('importModSettingsFile selectedPath=', selectedPath);
  
  // if no path selected, then cancel probably pressed
  if(selectedPath === undefined)
    return;

  processLsxFile(api, selectedPath);
}

export async function importModSettingsGame(api: types.IExtensionApi): Promise<boolean | void> {

  const gameSettingsPath:string = path.join(profilesPath(), 'Public', 'modsettings.lsx');

  console.log('importModSettingsGame gameSettingsPath=', gameSettingsPath);

  processLsxFile(api, gameSettingsPath);
}

function checkIfDuplicateExists(arr) {
  return new Set(arr).size !== arr.length
}

function getAttribute(node: IModNode, name: string, fallback?: string):string {
  return findNode(node?.attribute, name)?.$?.value ?? fallback;
}

async function processLsxFile(api: types.IExtensionApi, lsxPath:string) {  

  const state = api.getState();
  const profileId = selectors.activeProfile(state)?.id;

  try {

    const lsxLoadOrder:IModSettings = await readLsxFile(lsxPath);
    console.log('processLsxFile lsxPath=', lsxPath);

    // buildup object from xml
    const region = findNode(lsxLoadOrder?.save?.region, 'ModuleSettings');
    const root = findNode(region?.node, 'root');
    const modsNode = findNode(root?.children?.[0]?.node, 'Mods');
    const loNode = findNode(root?.children?.[0]?.node, 'ModOrder') ?? { children: [] };
    if ((loNode.children === undefined) || ((loNode.children[0] as any) === '')) {
      loNode.children = [{ node: [] }];
    }
    if ((modsNode.children === undefined) || ((modsNode.children[0] as any) === '')) {
      modsNode.children = [{ node: [] }];
    }

    // get nice string array, in order, of mods from the load order section
    let uuidArray:string[] = loNode.children[0].node.map((loEntry) => loEntry.attribute.find(attr => (attr.$.id === 'UUID')).$.value);


    
    console.log(`processLsxFile uuidArray=`, uuidArray);

    // are there any duplicates? if so...
    if(checkIfDuplicateExists(uuidArray)) {
      api.sendNotification({
        type: 'warning',
        id: 'bg3-loadorder-imported-duplicate',
        title: 'Duplicate Entries',
        message: 'Duplicate UUIDs found in the ModOrder section of the .lsx file being imported. This sometimes can cause issues with the load order.',
        
        //displayMS: 3000
      }); 
      
      // remove these duplicates after the first one
      //uuidArray = Array.from(new Set(uuidArray));
    }   

    const lsxModNodes:IModNode[] = modsNode.children[0].node;

    /*
    // get mods, in the above order, from the mods section of the file 
    const lsxMods:IModNode[] = uuidArray.map((uuid) => {
      return lsxModNodes.find(modNode => modNode.attribute.find(attr => (attr.$.id === 'UUID') && (attr.$.value === uuid)));
    });*/

    console.log(`processLsxFile lsxModNodes=`, lsxModNodes);

    // we now have all the information from file that we need

    // lets get all paks from the folder
    const paks = await readPAKs(api);

    // are there any pak files not in the lsx file?
    const missing = paks.reduce((acc, curr) => {      
      if(lsxModNodes.find(lsxEntry => lsxEntry.attribute.find(attr => (attr.$.id === 'Folder') && (attr.$.value === curr.info.name))) === undefined) 
        acc.push(curr);
      return acc;
    }, []);
    console.log('processLsxFile missing=', missing);

    // build a load order from the lsx file and add any missing paks at the end?

    //let newLoadOrder: types.ILoadOrderEntry[] = [];


    // loop through lsx mod nodes and find the pak they are associated with

    let newLoadOrder: types.ILoadOrderEntry[] = lsxModNodes.reduce((acc, curr) => {
      // find the bg3Pak this is refering too as it's easier to get all the information
      const pak = paks.find((pak) => pak.info.name === curr.attribute.find(attr => (attr.$.id === 'Folder')).$.value);

      // if the pak is found, then we add a load order entry. if it isn't, then its prob been deleted in vortex and lsx has an extra entry
      if (pak !== undefined) {
        acc.push({
          id: pak.fileName,
          modId: pak.mod.id,
          enabled: true,        
          name: pak.info.name,
          data: pak.info,
          locked: pak.info.isListed as LockedState        
        });
      }

      return acc;
    }, []);   

    console.log('processLsxFile newLoadOrder=', newLoadOrder);

    // Add any newly added mods to the bottom of the loadOrder.
    missing.forEach(pak => {
      newLoadOrder.push({
        id: pak.fileName,
        modId: pak.mod.id,
        enabled: true,        
        name: pak.info.name,
        data: pak.info,
        locked: pak.info.isListed as LockedState        
      })      
    });   

    newLoadOrder.sort((a, b) => (+b.locked - +a.locked));

    console.log('processLsxFile newLoadOrder=', newLoadOrder);

    // get load order
    let loadOrder:types.LoadOrder = util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
    console.log('processLsxFile loadOrder=', loadOrder);

    // manualy set load order?
    api.store.dispatch(actions.setLoadOrder(profileId, newLoadOrder));

    //util.setSafe(api.getState(), ['persistent', 'loadOrder', profileId], newLoadOrder);

    // get load order again?
    loadOrder = util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
    console.log('processLsxFile loadOrder=', loadOrder);

    api.sendNotification({
      type: 'success',
      id: 'bg3-loadorder-imported',
      title: 'Load Order Imported',
      message: lsxPath,
      displayMS: 3000
    });

    console.log('processLsxFile finished');

  } catch (err) {
    api.showErrorNotification('Failed to import load order', err, {
      allowReport: false
    });
  }
}

async function exportTo(api: types.IExtensionApi, filepath: string) {

  const state = api.getState();
  const profileId = selectors.activeProfile(state)?.id;

  // get load order from state
  const loadOrder:types.LoadOrder = util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);

  console.log('exportTo loadOrder=', loadOrder);

  try {
    // read the game bg3 modsettings.lsx so that we get the default game gustav thing?
    const modSettings = await readModSettings(api);

    // buildup object from xml
    const region = findNode(modSettings?.save?.region, 'ModuleSettings');
    const root = findNode(region?.node, 'root');
    const modsNode = findNode(root?.children?.[0]?.node, 'Mods');
    const loNode = findNode(root?.children?.[0]?.node, 'ModOrder') ?? { children: [] };
    if ((loNode.children === undefined) || ((loNode.children[0] as any) === '')) {
      loNode.children = [{ node: [] }];
    }
    if ((modsNode.children === undefined) || ((modsNode.children[0] as any) === '')) {
      modsNode.children = [{ node: [] }];
    }

    // drop all nodes except for the game entry
    const descriptionNodes = modsNode?.children?.[0]?.node?.filter?.(iter =>
      iter.attribute.find(attr => (attr.$.id === 'Name') && (attr.$.value === 'GustavDev'))) ?? [];

    


    // 
    const filteredPaks = loadOrder.filter(entry => !!entry.data?.uuid
                    && entry.enabled
                    && !entry.data?.isListed);

    console.log('exportTo filteredPaks=', filteredPaks);

    // add new nodes for the enabled mods
    for (const entry of filteredPaks) {
      // const md5 = await util.fileMD5(path.join(modsPath(), key));
      descriptionNodes.push({
        $: { id: 'ModuleShortDesc' },
        attribute: [
          { $: { id: 'Folder', type: 'LSWString', value: entry.data.folder } },
          { $: { id: 'MD5', type: 'LSString', value: entry.data.md5 } },
          { $: { id: 'Name', type: 'FixedString', value: entry.data.name } },
          { $: { id: 'UUID', type: 'FixedString', value: entry.data.uuid } },
          { $: { id: 'Version', type: 'int32', value: entry.data.version } },
        ],
      });
    }

    // 
    const loadOrderNodes = filteredPaks
      //.sort((lhs, rhs) => lhs.pos - rhs.pos) // don't know if we need this now
      .map((entry): IModNode => ({
        $: { id: 'Module' },
        attribute: [
          { $: { id: 'UUID', type: 'FixedString', value: entry.data.uuid } },
        ],
      }));

    modsNode.children[0].node = descriptionNodes;
    loNode.children[0].node = loadOrderNodes;

    writeModSettings(api, modSettings, filepath);
    
    api.sendNotification({
      type: 'success',
      id: 'bg3-loadorder-exported',
      title: 'Load Order Exported',
      message: filepath,
      displayMS: 3000
    });

  } catch (err) {
    api.showErrorNotification('Failed to write load order', err, {
      allowReport: false,
      message: 'Please run the game at least once and create a profile in-game',
    });
  }  

}

export async function exportToFile(api: types.IExtensionApi): Promise<boolean | void> {

  const options: IOpenOptions = {
    title: api.translate('Please choose a BG3 .lsx file to export to'),
    filters: [{ name: 'BG3 Load Order', extensions: ['lsx'] }],
    create: true
  };

  const selectedPath:string = await api.selectFile(options);

  console.log(`exportToFile ${selectedPath}`);

  // if no path selected, then cancel probably pressed
  if(selectedPath === undefined)
    return;

  exportTo(api, selectedPath);
}
  
export async function exportToGame(api: types.IExtensionApi): Promise<boolean | void> {

  const settingsPath = path.join(profilesPath(), 'Public', 'modsettings.lsx');

  console.log(`exportToGame ${settingsPath}`);

  exportTo(api, settingsPath);
}

export async function deepRefresh(api: types.IExtensionApi): Promise<boolean | void> {

  const state = api.getState();
  const profileId = selectors.activeProfile(state)?.id;

  // get load order from state
  const loadOrder:types.LoadOrder = util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);

  console.log('deepRefresh', loadOrder);
}



async function readModSettings(api: types.IExtensionApi): Promise<IModSettings> {
  
  const settingsPath = path.join(profilesPath(), 'Public', 'modsettings.lsx');
  const dat = await fs.readFileAsync(settingsPath);
  console.log('readModSettings', dat);
  return parseStringPromise(dat);
}

async function readLsxFile(lsxPath: string): Promise<IModSettings> {
  
  //const settingsPath = path.join(profilesPath(), 'Public', 'modsettings.lsx');
  const dat = await fs.readFileAsync(lsxPath);
  console.log('lsxPath', dat);
  return parseStringPromise(dat);
}

async function writeModSettings(api: types.IExtensionApi, data: IModSettings, filepath: string): Promise<void> {
  
  const builder = new Builder();
  const xml = builder.buildObject(data);
  try {
    await fs.ensureDirWritableAsync(path.dirname(filepath));
    await fs.writeFileAsync(filepath, xml);
  } catch (err) {
    api.showErrorNotification('Failed to write mod settings', err);
    return;
  }
}

export async function validate(prev: types.LoadOrder,
                               current: types.LoadOrder): Promise<any> {
  // Nothing to validate really - the game does not read our load order file
  //  and we don't want to apply any restrictions either, so we just
  //  return.
  return undefined;
}


async function readPAKs(api: types.IExtensionApi) : Promise<Array<BG3Pak>> {
  const state = api.getState();
  const lsLib = getLatestLSLibMod(api);
  if (lsLib === undefined) {
    return [];
  }
  
  const paks = await readPAKList(api);

  console.log('paks', { paks: paks });

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
            api.showErrorNotification('Failed to read pak. Please make sure you are using the latest version of LSLib by using the "Re-install LSLib/Divine" toolbar button on the Mods page.', err, {
              allowReport: false,
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

const listCache: { [path: string]: Promise<string[]> } = {};

async function listPackage(api: types.IExtensionApi, pakPath: string): Promise<string[]> {
  const res = await divine(api, 'list-package', { source: pakPath, loglevel: 'all'} );
  
  console.log(`listPackage res=`, res);
  
  const lines = res.stdout.split('\n').map(line => line.trim()).filter(line => line.length !== 0);

  console.log(`listPackage lines=`, lines);

  return lines;
}

async function isLOListed(api: types.IExtensionApi, pakPath: string): Promise<boolean> {
  
  /*
  if (listCache[pakPath] === undefined) {
    listCache[pakPath] = listPackage(api, pakPath);
  }  
  const lines = await listCache[pakPath];*/

  const lines = await listPackage(api, pakPath);

  console.log(`lines ${pakPath}`, lines);

  // const nonGUI = lines.find(line => !line.toLowerCase().startsWith('public/game/gui'));
  const metaLSX = lines.find(line =>
    path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx');
  
    console.log('isLOListed metaLSX=', metaLSX);

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

  let isListed = await isLOListed(api, pakPath);

  console.log('extractPakInfoImpl()', meta);

  return {
    author: attr('Author', () => 'Unknown'),
    description: attr('Description', () => 'Missing'),
    folder: attr('Folder', () => genName),
    md5: attr('MD5', () => ''),
    name: attr('Name', () => genName),
    type: attr('Type', () => 'Adventure'),
    uuid: attr('UUID', () => require('uuid').v4()),
    version: attr('Version', () => '1'),
    isListed: isListed
  };
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
      '--game', 'bg3',
    ];

    if (options.loglevel !== undefined) {
      args.push('--loglevel', options.loglevel);
    } else {
      args.push('--loglevel', 'off');
    }

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

async function readPAKList(api: types.IExtensionApi) {
  let paks: string[];
  try {
    paks = (await fs.readdirAsync(modsPath()))
      .filter(fileName => path.extname(fileName).toLowerCase() === '.pak');
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        await fs.ensureDirWritableAsync(modsPath(), () => Promise.resolve());
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

export function genProps(context: types.IExtensionContext, profileId?: string): IProps {
  const api = context.api;
  const state = api.getState();
  const profile: types.IProfile = (profileId !== undefined)
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

  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  return { api, state, profile, mods, discovery };
}

export async function ensureLOFile(context: types.IExtensionContext,
                                   profileId?: string,
                                   props?: IProps): Promise<string> {
  if (props === undefined) {
    props = genProps(context, profileId);
  }

  if (props === undefined) {
    return Promise.reject(new util.ProcessCanceled('failed to generate game props'));
  }

  const targetPath = loadOrderFilePath(props.profile.id);
  try {
    try {
      await fs.statAsync(targetPath);
    } catch (err) {
      await fs.writeFileAsync(targetPath, JSON.stringify([]), { encoding: 'utf8' });
    }
  } catch (err) {
    return Promise.reject(err);
  }    
  
  
  return targetPath;
}

export function loadOrderFilePath(profileId: string): string {
  return path.join(util.getVortexPath('userData'), GAME_ID, profileId + '_' + LO_FILE_NAME);
}

