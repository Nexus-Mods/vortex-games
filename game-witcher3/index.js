const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, selectors, util } = require('vortex-api');
const { parseXmlString } = require('libxmljs');
const semver = require('semver');

const GAME_ID = 'witcher3';
const SCRIPT_MERGER_ID = 'W3ScriptMerger';
const I18N_NAMESPACE = 'game-witcher3';
const MERGE_INV_MANIFEST = 'MergeInventory.xml';

let _LOWEST_IDX = 0;

let tools = [
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

function prefixDesignation(idx) {
  // Prefix value is a maximum of 4 characters. e.g. "0000" "0001" , etc.
  const missingCount = 4 - idx.toString().length;
  if (missingCount > 3 || missingCount < 0){
    return '9999';
  } else {
    return `${'0'.repeat(missingCount) + idx}`;
  }
}

function loadOrderPrefix(api, mod) {
  const state = api.store.getState();
  const profile = selectors.activeProfile(state);
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], []);
  const pos = !!loadOrder[mod.id] ? loadOrder[mod.id].pos : -1;
  if (pos === -1) {
    return '9999';
  }

  return prefixDesignation(pos + _LOWEST_IDX);
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
    && (files.find(file => file.toLowerCase().indexOf('content' + path.sep) !== -1) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  let instructions = [];
  const pattern = 'content' + path.sep;
  files = files.filter(file => {
    const components = file.split(path.sep)
      .map(comp => comp.toLowerCase())
      .filter(comp => !!comp);
    return (components.indexOf('content') !== -1)
      ? path.extname(components[components.length - 1]) !== ''
      : false;
  });

  const idx = files[0].toLowerCase().indexOf(pattern);
  instructions = files.map(file => {
      return {
        type: 'copy',
        source: file,
        destination: file.substr(idx),
      };
  });
  return Promise.resolve({ instructions });
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
  const missingScriptMerger = () => new Promise((resolve, reject) => {
    return api.sendNotification({
      id: notifId,
      type: 'info',
      message: api.translate('Witcher 3 script merger not installed/configured', { ns: I18N_NAMESPACE }),
      allowSuppress: true,
      actions: [
        {
          title: 'More',
          action: () => {
            api.showDialog('info', 'Witcher 3', {
              bbcode: api.translate('Many Witcher 3 mods consist of small scripts to change game '
              + 'functionality. At times, two or more mods may attempt to change the same script, '
              + 'this will result in a conflict which can generally be solved by changing the order '
              + 'in which the mods are loaded (top-most mod overwrites the other).[br][/br][br][/br] Alternatively, a '
              + 'W3 script merging tool exists which will (as the name suggests) merge the two mods together.[br][/br]'
              + 'It is highly recommended to download and install the tool and configure it to work with Vortex.[br][/br]'
              + 'You can find more information on how to ' 
              + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_W3ScriptMerger]configure the script merger here.[/url]' , { ns: I18N_NAMESPACE }),
            }, [
              { label: 'Cancel', action: () => resolve() },
              { label: 'Download', action: () => util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                                  .catch(err => resolve())
                                                  .then(() => resolve()) },
            ]);
          },
        },
      ],
    });
  })

  const findScriptMerger = () => new Promise((resolve, reject) => {
    const raiseMissingNotif = () => missingScriptMerger().then(() => resolve());
    const scriptMergerPath = util.getSafe(discovery, ['tools', SCRIPT_MERGER_ID, 'path'], undefined);
    return (scriptMergerPath !== undefined)
      ? fs.statAsync(scriptMergerPath)
          .then(() => resolve())
          .catch(err => raiseMissingNotif())
      : raiseMissingNotif();
  });

  return findScriptMerger().then(() => fs.ensureDirAsync(path.join(discovery.path, 'Mods')));
}

function migrate110(api, oldVersion) {
  if (semver.gte(oldVersion, '1.1.0')) {
    return Promise.resolve();
  }

  const state = api.store.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const hasMods = Object.keys(mods).length > 0;

  if (!hasMods) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    return api.sendNotification({
      id: 'witcher3-requires-upgrade',
      type: 'warning',
      message: api.translate('Mods for Witcher 3 need to be reinstalled',
        { ns: I18N_NAMESPACE }),
      noDismiss: true,
      actions: [
        {
          title: 'Explain',
          action: () => {
            api.showDialog('info', 'Witcher 3', {
              text: 'Vortex now supports drag-drop load ordering for Witcher 3 mods. '
                  + 'Unfortunately to achieve this, we were forced to change the way Vortex '
                  + 'installs Witcher 3 mods - to use this new functionality and ensure that your '
                  + 'mods are deployed correctly, please re-install all your mods!'
                  + '\n\nWe are sorry for the inconvenience.',
            }, [
              { label: 'Close' },
            ]);
          },
        },
        {
          title: 'Understood',
          action: dismiss => {
            dismiss();
            resolve();
          }
        }
      ],
    });
  });
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

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'The Witcher 3',
    mergeMods: mod => 'mod' + loadOrderPrefix(context.api, mod) + mod.id,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => 'Mods',
    logo: 'gameart.jpg',
    executable: () => 'bin/x64/witcher3.exe',
    setup: (discovery) => prepareForModding(context, discovery),
    supportedTools: tools,
    requiredFiles: [
      'bin/x64/witcher3.exe',
    ],
    requiresCleanup: true, // Technically this is not needed from the game's perspective and the
                           //  mods would run fine, but the mods folder can become VERY messy without it.
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

  context.registerLoadOrderPage({
    gameId: GAME_ID,
    loadOrderInfo: 'When organizing your Witcher 3 mods, please keep in mind that the top-most mod '
                 + 'will win any conflicts - e.g. if mod 0001 and 0008 modify the same script file, ' 
                 + 'the game will load mod 0001 and ignore the script file in 0008. Additionally - if the script '
                 + 'merger is configured, Vortex will be able to ensure that any merged mods are '
                 + 'locked at the top of the order, ensuring they get loaded first.',
    gameArtURL: `${__dirname}/gameart.jpg`,
    preSort: async (items) => {
      const state = context.api.store.getState();
      const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID]);
      const scriptMerger = util.getSafe(discovery, ['tools', SCRIPT_MERGER_ID]);
      if (!!scriptMerger && !!scriptMerger.path) {
        const modNames = await getMergedModNames(path.dirname(scriptMerger.path));
        _LOWEST_PREFIX = modNames.length;
        const mergedId = modNames.length > 1
          ? `mergedMod0000 - mergedMod${prefixDesignation(modNames.length - 1)}`
          : (modNames.length !== 0) ? 'mergedMod0000' : undefined;

        if (mergedId === undefined) {
          // There are no merged mods - set the prefixes and move along.
          items.forEach((item, idx) => item.prefix = prefixDesignation(idx + _LOWEST_PREFIX));
          return Promise.resolve(items);
        }

        const mergedEntry = {
          id: mergedId,
          name: mergedId,
          imgUrl: `${__dirname}/gameart.jpg`,
          prefix: prefixDesignation(modNames.length - 1),
          locked: true,
        };
        const mergedMod = items.find(item => item.id.startsWith('mergedMod'));
        if (mergedMod !== undefined && mergedMod.id !== mergedEntry.id) {
          items = items.splice(items.indexOf(mergedMod.id), 0);
        }
        items.forEach((item, idx) => item.prefix = prefixDesignation(idx + _LOWEST_PREFIX));
        return Promise.resolve([].concat(mergedEntry, ...items));
      }
    },
  });

  let lastEnabledModsState = [];
  context.once(() => {
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
                      + 'It is highly recommended to run the tool and check whether any new script conflicts '
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
