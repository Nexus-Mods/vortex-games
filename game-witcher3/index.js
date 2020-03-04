const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, selectors, util } = require('vortex-api');
const { parseXmlString } = require('libxmljs');
const { app, remote } = require('electron');

const IniParser = require('vortex-parse-ini');

const appUni = app || remote.app;

const GAME_ID = 'witcher3';
const SCRIPT_MERGER_ID = 'W3ScriptMerger';
const I18N_NAMESPACE = 'game-witcher3';
const MERGE_INV_MANIFEST = 'MergeInventory.xml';1
const LOAD_ORDER_FILENAME = 'mods.settings';
let _INI_STRUCT = {};

const tools = [
  {
    id: SCRIPT_MERGER_ID,
    name: 'W3 Script Merger',
    logo: 'WitcherScriptMerger.jpg',
    executable: () => 'WitcherScriptMerger.exe',
    requiredFiles: [
      'WitcherScriptMerger.exe',
    ],
  }
]

function getLoadOrderFilePath() {
  return path.join(appUni.getPath('documents'), 'The Witcher 3', LOAD_ORDER_FILENAME);
}

function writeToModSettings() {
  const filePath = getLoadOrderFilePath();
  const parser = new IniParser.default(new IniParser.WinapiFormat());
  return fs.removeAsync(filePath).then(() => fs.writeFileAsync(filePath, '', { encoding:'utf8' }))
    .then(() => parser.read(filePath)).then(ini => {
      return Promise.each(Object.keys(_INI_STRUCT), (key) => {
        ini.data[key] = {
          Enabled: '1',
          Priority: _INI_STRUCT[key].Priority,
          VK: _INI_STRUCT[key].VK,
        }
        return Promise.resolve();
      })
      .then(() => parser.write(filePath, ini));
    });
}

// Attempts to parse and return data found inside
//  the mods.settings file if found - otherwise this
//  will ensure the file is present.
function ensureModSettings() {
  const filePath = getLoadOrderFilePath();
  const parser = new IniParser.default(new IniParser.WinapiFormat());
  return fs.statAsync(filePath)
    .then(() => parser.read(filePath))
    .catch(err => (err.code === 'ENOENT')
      ? fs.writeFileAsync(filePath, '', { encoding: 'utf8' }).then(() => parser.read(filePath))
      : Promise.reject(err));
}

function getManuallyAddedMods(context) {
  return ensureModSettings().then(ini => {
    const state = context.api.store.getState();
    const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
    const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], []);
    const modKeys = Object.keys(mods);
    const iniEntries = Object.keys(ini.data);
    const manualCandidates = iniEntries.filter(entry => {
      const hasVortexKey = util.getSafe(ini.data[entry], ['VK'], undefined) !== undefined;
      return ((!hasVortexKey) || (ini.data[entry].VK === entry) && !modKeys.includes(entry))
    }) || [];
    const modsPath = path.join(discovery.path, 'Mods');
    return Promise.reduce(manualCandidates, (accum, mod) => {
      return fs.statAsync(path.join(modsPath, mod))
        .then(() => {
          accum.push(mod);
          return accum;
        })
        .catch(err => accum)
    }, []);
  })
  .catch(err => {
    context.api.showErrorNotification('Failed to lookup manually added mods', err)
    return Promise.resolve([]);
  });
}

function getMergedModNames(scriptMergerPath) {
  return fs.readFileAsync(path.join(scriptMergerPath, MERGE_INV_MANIFEST))
    .then(xmlData => {
      try {
        const mergedModNames = [];
        const mergeData = parseXmlString(xmlData);
        mergeData.find('//MergedModName').forEach(modElement => {
          mergedModNames.push(modElement.text());
        })
        return Promise.resolve(mergedModNames);
      } catch (err) {
        return Promise.reject(err);
      }
    })
    .catch(err => (err.code === 'ENOENT') // No merge file? - no problem.
      ? Promise.resolve([])
      : Promise.reject(new util.DataInvalid(`Failed to parse ${MERGE_INV_MANIFEST}: ${err}`)))
}

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\CD Project Red\\The Witcher 3',
      'InstallFolder');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('The Witcher 3: Wild Hunt')
      .catch(() => util.steam.findByAppId('499450'))
      .then(game => game.gamePath);
  }
}

function testSupportedTL(files, gameId) {
  const supported = (gameId === 'witcher3')
    && (files.find(file =>
      file.toLowerCase().split(path.sep).indexOf('mods') !== -1) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installTL(files,
                   destinationPath,
                   gameId,
                   progressDelegate) {
  let prefix = files.reduce((prev, file) => {
    const components = file.toLowerCase().split(path.sep);
    const idx = components.indexOf('mods');
    if ((idx > 0) && ((prev === undefined) || (idx < prev.length))) {
      return components.slice(0, idx);
    } else {
      return prev;
    }
  }, undefined);

  if (prefix === undefined) {
    prefix = '';
  } else {
    prefix = prefix.join(path.sep) + path.sep;
  }

  const instructions = files
    .filter(file => !file.endsWith(path.sep) && file.toLowerCase().startsWith(prefix))
    .map(file => ({
      type: 'copy',
      source: file,
      destination: file.slice(prefix.length),
    }));

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  const supported = (gameId === GAME_ID)
    && (files.find(file => file.toLowerCase().startsWith('content' + path.sep) !== undefined));
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  return Promise.resolve(files
    .filter(file => file.toLowerCase().startsWith('content' + path.sep))
    .map(file => {
      const fileBase = file.split(path.sep).slice(1).join(path.sep);
      return {
        type: 'copy',
        source: file,
        destination: path.join('mod' + destinationPath, fileBase)
      };
  }));
}

function testTL(instructions) {
  return Promise.resolve(instructions.find(
    instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('mods' + path.sep)
  ) !== undefined);
}

function testDLC(instructions) {
  return Promise.resolve(instructions.find(
    instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('dlc' + path.sep)) !== undefined);
}

function prepareForModding(context, discovery) {
  const notifId = 'missing-script-merger';
  const api = context.api;
  const missingScriptMerger = () => api.sendNotification({
    id: notifId,
    type: 'info',
    message: api.translate('Witcher 3 script merger not installed/configured', { ns: I18N_NAMESPACE }),
    allowSuppress: true,
    actions: [
      {
        title: 'More',
        action: () => {
          api.showDialog('info', 'Witcher 3', {
            bbcode: api.translate('Many Witcher 3 mods add or edit game scripts. When several mods ' 
              + 'editing the same script are installed, these mods need to be merged using a tool ' 
              + 'called Witcher 3 Script Merger. You can download the merger right now and '
              + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]find out more about how to configure it as a tool for use in Vortex.[/url][br][/br][br][/br]' 
              + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: I18N_NAMESPACE }),
          }, [
            { label: 'Cancel', action: () => {
              api.dismissNotification('missing-script-merger');
            }},
            { label: 'Download Script Merger', action: () => util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                                .catch(err => null)
                                                .then(() => api.dismissNotification('missing-script-merger')) },
          ]);
        },
      },
    ],
  });

  const scriptMergerPath = util.getSafe(discovery, ['tools', SCRIPT_MERGER_ID, 'path'], undefined);
  const findScriptMerger = () => {
    return (scriptMergerPath !== undefined)
      ? fs.statAsync(scriptMergerPath)
          .catch(() => missingScriptMerger())
      : missingScriptMerger();
  };

  return fs.ensureDirAsync(path.join(discovery.path, 'Mods'))
    .tap(() => findScriptMerger());
}

function getScriptMergerTool(api) {
  const state = api.store.getState();
  const scriptMerger = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID, 'tools', SCRIPT_MERGER_ID], undefined);
  if (!!scriptMerger && !!scriptMerger.path) {
    return scriptMerger;
  }

  return undefined;
}

function runScriptMerger(api) {
  const tool = getScriptMergerTool(api);
  if (tool === undefined) {
    const error = new util.SetupError('Witcher Script Merger is not configured correctly');
    api.showErrorNotification('Failed to run tool', error);
  }

  return api.runExecutable(tool.path, [], { suggestDeploy: true });
}

async function getAllMods(context) {
  const state = context.api.store.getState();
  const profile = selectors.activeProfile(state);
  const modState = util.getSafe(state, ['persistent', 'profiles', profile.id, 'modState'], {});
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const enabledMods = Object.keys(modState).filter(key => modState[key].enabled);
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID]);
  const scriptMerger = util.getSafe(discovery, ['tools', SCRIPT_MERGER_ID]);
  let mergedModNames = [];
  if (!!scriptMerger && !!scriptMerger.path) {
    mergedModNames = await getMergedModNames(path.dirname(scriptMerger.path));
  }

  const manuallyAddedMods = await getManuallyAddedMods(context);
  const managedMods = await getManagedModNames(context, enabledMods.map(key => mods[key]));
  return Promise.resolve([].concat(mergedModNames, managedMods, manuallyAddedMods));
}

async function setINIStruct(context, loadOrder) {
  let nextAvailableIdx = Object.keys(loadOrder).length;
  const getNextIdx = () => {
    return nextAvailableIdx++;
  }
  return getAllMods(context).then(mods => {
    _INI_STRUCT = {};
    return Promise.each(mods, mod => {
      let name;
      let key;
      if (typeof(mod) === 'object' && mod !== null) {
        name = mod.name;
        key = mod.id;
      } else {
        name = mod;
        key = mod;
      }

      _INI_STRUCT[name] = {
        Enabled: '1',
        Priority: util.getSafe(loadOrder, [key], undefined) !== undefined
          ? loadOrder[key].pos + 1
          : getNextIdx(),
        VK: key,
      };
    });
  })
}

async function preSort(context, items) {
  const state = context.api.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID]);
  const scriptMerger = util.getSafe(discovery, ['tools', SCRIPT_MERGER_ID]);
  let mergedModNames = [];
  if (!!scriptMerger && !!scriptMerger.path) {
    mergedModNames = await getMergedModNames(path.dirname(scriptMerger.path));
  }

  const manuallyAddedMods = await getManuallyAddedMods(context);

  if ((mergedModNames.length === 0) && (manuallyAddedMods.length === 0)) {
    return items || [];
  }

  const mergedEntries = mergedModNames
    .filter(modName =>items.find(item => item.id === modName) === undefined)
    .map(modName => ({
      id: modName,
      name: modName,
      imgUrl: `${__dirname}/gameart.jpg`,
      locked: true,
  }))

  const manualEntries = manuallyAddedMods
    .filter(key => (items.find(item => item.id === key) === undefined)
                && (mergedEntries.find(entry => entry.id === key) === undefined))
    .map(key => ({
      id: key,
      name: key,
      imgUrl: `${__dirname}/gameart.jpg`,
  }));

  return Promise.resolve([].concat(...mergedEntries, ...items, ...manualEntries));
}

function getManagedModNames(context, mods) {
  const installationPath = selectors.installPathForGame(context.api.store.getState(), GAME_ID);
  return Promise.map(mods, mod => fs.readdirAsync(path.join(installationPath, mod.installationPath))
    .then(entries => ({
      id: mod.id,
      name: entries[0],
    })))
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'The Witcher 3',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.jpg',
    executable: () => 'bin/x64/witcher3.exe',
    setup: (discovery) => prepareForModding(context, discovery),
    supportedTools: tools,
    requiredFiles: [
      'bin/x64/witcher3.exe',
    ],
    details: {
      steamAppId: 292030,
    }
  });

  const getDLCPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return path.join(discovery.path, 'DLC');
  };

  const getTLPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return discovery.path;
  };

  context.registerMigration(old => migrate110(context.api, old));

  context.registerInstaller('witcher3tl', 25, testSupportedTL, installTL);
  context.registerInstaller('witcher3content', 50, testSupportedContent, installContent);
  context.registerModType('witcher3tl', 25, gameId => gameId === 'witcher3', getTLPath, testTL);
  context.registerModType('witcher3dlc', 25, gameId => gameId === 'witcher3', getDLCPath, testDLC);

  let previousLO = {};
  context.registerLoadOrderPage({
    gameId: GAME_ID,
    loadOrderInfo: 'When organizing your Witcher 3 mods, please keep in mind that the top-most mod '
                 + 'will win any conflicts - e.g. if both mod x and mod y modify the same script file, '
                 + 'and the game loads mod y before mod x - mod x will be ignored by the game. If the script '
                 + 'merger is configured, Vortex will be able to ensure that any merged mods it finds are '
                 + 'locked at the top of the order, ensuring they get loaded first.',
    gameArtURL: `${__dirname}/gameart.jpg`,
    preSort: (items) => preSort(context, items),
    callback: (loadOrder) => {
      if (loadOrder === previousLO) {
        return;
      }
      previousLO = loadOrder;
      setINIStruct(context, loadOrder)
        .then(() => writeToModSettings())
        .catch(err => {
          context.api.showErrorNotification('Failed to modify load order file', err);
          return;
        });
    },
  });

  let lastEnabledModsState = [];
  context.once(() => {
    context.api.onAsync('did-deploy', (profileId, deployment) => {
      const state = context.api.store.getState();
      const profile = selectors.profileById(state, profileId);
      if (!!profile && (profile.gameId === GAME_ID)) {
        const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], {})
        return setINIStruct(context, loadOrder)
          .then(() => writeToModSettings())
          .catch(err => {
            context.api.showErrorNotification('Failed to modify load order file', err);
            return Promise.resolve();
          });
      }
    });
    context.api.events.on('purge-mods', () => {
      const state = context.api.store.getState();
      const profile = selectors.activeProfile(state);
      if (!!profile && (profile.gameId === GAME_ID)) {
        const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], undefined);
        return getManuallyAddedMods(context).then((manuallyAdded) => {
          if (manuallyAdded.length > 0) {
            let newStruct = {};
            manuallyAdded.forEach((mod, idx) => {
              newStruct[mod] = {
                Enabled: 1,
                Priority: ((loadOrder !== undefined && !!loadOrder[mod]) ? loadOrder[mod].pos : idx) + 1,
              }
            })

            _INI_STRUCT = newStruct;
            writeToModSettings()
              .catch(err => context.api.showErrorNotification('Failed to cleanup load order file', err));
          } else {
            const filePath = getLoadOrderFilePath();
            fs.removeAsync(filePath)
              .catch(err => (err.code === 'ENOENT')
                ? Promise.resolve()
                : context.api.showErrorNotification('Failed to cleanup load order file', err));
          }
        });
      }
    });
    context.api.onStateChange(['persistent', 'profiles'], () => {
      const state = context.api.store.getState();
      const profile = selectors.activeProfile(state);
      if ((profile === undefined) || (profile.gameId !== GAME_ID)) {
        return;
      }

      const modState = util.getSafe(state, ['persistent', 'profiles', profile.id, 'modState'], {});
      const enabledMods = Object.keys(modState).filter(key => modState[key].enabled);
      const symmetricDiff = enabledMods
        .filter(x => !lastEnabledModsState.includes(x))
        .concat(lastEnabledModsState.filter(y => !enabledMods.includes(y)));

      if (symmetricDiff.length === 0) {
        return; // Same state as before, nothing to do here.
      }

      lastEnabledModsState = enabledMods;

      const hasW3MergeScript = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID, 'tools', SCRIPT_MERGER_ID], undefined);
      if (!!hasW3MergeScript && !!hasW3MergeScript.path) {
        context.api.sendNotification({
          id: 'witcher3-merge',
          type: 'warning',
          message: context.api.translate('Witcher Script merger may need to be executed',
            { ns: I18N_NAMESPACE }),
          noDismiss: true,
          allowSuppress: true,
          actions: [
            {
              title: 'More',
              action: () => {
                context.api.showDialog('info', 'Witcher 3', {
                  text: 'Your mods state has changed since the last time you ran the script merger. ' 
                      + 'You may want to run the merger tool and check whether any new script conflicts '
                      + 'are present, or if existing merges have become unecessary.',
                }, [
                  { label: 'Close' },
                ]);
              },
            },
            {
              title: 'Run tool',
              action: dismiss => {
                runScriptMerger(context.api);
                dismiss();
              }
            }
          ],
        });
      }
    });
  });

  return true;
}

module.exports = {
  default: main,
};
